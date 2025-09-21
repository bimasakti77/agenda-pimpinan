const User = require('../models/User');

class UserService {
  // Get all users with pagination and filters
  async getAllUsers(filters = {}, page = 1, limit = 10) {
    const { role, search } = filters;
    
    let whereConditions = [];
    let values = [];
    let paramCount = 1;
    
    if (role) {
      whereConditions.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }
    
    if (search) {
      whereConditions.push(`(username ILIKE $${paramCount} OR email ILIKE $${paramCount} OR full_name ILIKE $${paramCount})`);
      values.push(`%${search}%`);
      paramCount++;
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    const query = `
      SELECT id, username, email, role, full_name, position, department, is_active, created_at, updated_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCount} OFFSET $${paramCount + 1}
    `;
    
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    
    values.push(limit, (page - 1) * limit);
    
    const pool = require('../config/database');
    const [usersResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, -2))
    ]);
    
    const users = usersResult.rows.map(row => new User(row));
    const total = parseInt(countResult.rows[0].count);
    
    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get user by ID
  async getUserById(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return user;
  }

  // Create user (admin only)
  async createUser(userData) {
    const user = await User.create(userData);
    return user;
  }

  // Update user (admin only)
  async updateUser(id, updateData) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update(updateData);
    return user;
  }

  // Delete user (soft delete)
  async deleteUser(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    await user.delete();
    return { message: 'User deleted successfully' };
  }

  // Hard delete user (superadmin only)
  async hardDeleteUser(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    await user.hardDelete();
    return { message: 'User permanently deleted' };
  }

  // Activate/Deactivate user
  async toggleUserStatus(id) {
    const user = await User.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ is_active: !user.is_active });
    return user;
  }

  // Get user statistics
  async getUserStatistics() {
    const pool = require('../config/database');
    
    const query = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_users,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'superadmin' THEN 1 END) as superadmin_users
      FROM users
    `;
    
    const result = await pool.query(query);
    return result.rows[0];
  }

  // Get users by role
  async getUsersByRole(role) {
    const result = await User.findAll(1, 1000, role);
    return result.users;
  }

  // Search users
  async searchUsers(searchTerm) {
    const filters = { search: searchTerm };
    const result = await this.getAllUsers(filters, 1, 1000);
    return result.users;
  }

  // Get user activity (agenda count)
  async getUserActivity(userId) {
    const pool = require('../config/database');
    
    const query = `
      SELECT 
        COUNT(*) as total_agenda,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_agenda,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled_agenda,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_agenda
      FROM agenda
      WHERE created_by = $1
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows[0];
  }

  // Bulk update user roles
  async bulkUpdateUserRoles(userIds, role) {
    const pool = require('../config/database');
    
    const placeholders = userIds.map((_, index) => `$${index + 1}`).join(',');
    const query = `
      UPDATE users 
      SET role = $${userIds.length + 1}, updated_at = NOW()
      WHERE id IN (${placeholders})
      RETURNING id, username, email, role
    `;
    
    const values = [...userIds, role];
    const result = await pool.query(query, values);
    
    return result.rows;
  }

  // Get user dashboard data
  async getUserDashboard(userId) {
    const user = await this.getUserById(userId);
    const activity = await this.getUserActivity(userId);
    
    // Get recent agenda
    const agendaService = require('./agendaService');
    const recentAgenda = await agendaService.getUpcomingAgenda(userId, 5);
    
    return {
      user: user.toJSON(),
      activity,
      recentAgenda
    };
  }
}

module.exports = new UserService();
