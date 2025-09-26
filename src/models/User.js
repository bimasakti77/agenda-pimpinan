const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.password = data.password;
    this.role = data.role;
    this.full_name = data.full_name;
    this.position = data.position;
    this.department = data.department;
    this.nip = data.nip;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Create a new user
  static async create(userData) {
    const { username, email, password, role = 'user', full_name, position, department, nip } = userData;
    
    // Check if NIP already exists (if NIP is provided)
    if (nip && nip.trim() !== '') {
      const existingUser = await this.findByNip(nip.trim());
      if (existingUser) {
        throw new Error('NIP sudah terdaftar untuk user lain');
      }
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const query = `
      INSERT INTO users (username, email, password, role, full_name, position, department, nip)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, username, email, role, full_name, position, department, nip, is_active, created_at, updated_at
    `;
    
    const values = [username, email, hashedPassword, role, full_name, position, department, nip];
    const result = await pool.query(query, values);
    
    return new User(result.rows[0]);
  }

  // Find user by ID
  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Find user by email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Find user by username
  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Find user by NIP
  static async findByNip(nip) {
    const query = 'SELECT * FROM users WHERE nip = $1';
    const result = await pool.query(query, [nip]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return new User(result.rows[0]);
  }

  // Get all users with pagination and filtering
  static async findAll(page = 1, limit = 10, role = null, is_active = null, search = null) {
    const offset = (page - 1) * limit;
    let query = 'SELECT id, username, email, role, full_name, position, department, nip, is_active, created_at, updated_at FROM users';
    let countQuery = 'SELECT COUNT(*) FROM users';
    const values = [];
    const conditions = [];
    let paramCount = 1;
    
    // Add role filter
    if (role) {
      conditions.push(`role = $${paramCount}`);
      values.push(role);
      paramCount++;
    }
    
    // Add active status filter
    if (is_active !== null) {
      conditions.push(`is_active = $${paramCount}`);
      values.push(is_active === 'true' || is_active === true);
      paramCount++;
    }
    
    // Add search filter
    if (search) {
      conditions.push(`(
        username ILIKE $${paramCount} OR 
        email ILIKE $${paramCount} OR 
        full_name ILIKE $${paramCount} OR 
        position ILIKE $${paramCount} OR 
        department ILIKE $${paramCount} OR
        nip ILIKE $${paramCount}
      )`);
      values.push(`%${search}%`);
      paramCount++;
    }
    
    // Apply conditions
    if (conditions.length > 0) {
      const whereClause = ' WHERE ' + conditions.join(' AND ');
      query += whereClause;
      countQuery += whereClause;
    }
    
    // Add ordering and pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    values.push(limit, offset);
    
    const [usersResult, countResult] = await Promise.all([
      pool.query(query, values),
      pool.query(countQuery, values.slice(0, -2)) // Remove limit and offset for count
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

  // Update user
  async update(updateData) {
    const allowedFields = ['username', 'email', 'full_name', 'position', 'department', 'nip', 'role', 'is_active'];
    const updates = [];
    const values = [];
    let paramCount = 1;
    
    // Check if NIP is being updated and if it already exists
    if (updateData.nip && updateData.nip.trim() !== '') {
      const existingUser = await User.findByNip(updateData.nip.trim());
      if (existingUser && existingUser.id !== this.id) {
        throw new Error('NIP sudah terdaftar untuk user lain');
      }
    }
    
    for (const [key, value] of Object.entries(updateData)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updates.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    }
    
    if (updates.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(this.id);
    
    const query = `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    
    // Update current instance
    Object.assign(this, result.rows[0]);
    return this;
  }

  // Update password
  async updatePassword(newPassword) {
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    const query = 'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2';
    await pool.query(query, [hashedPassword, this.id]);
    
    this.password = hashedPassword;
    return this;
  }

  // Verify password
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password);
  }

  // Delete user (soft delete)
  async delete() {
    const query = 'UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1';
    await pool.query(query, [this.id]);
    this.is_active = false;
    return this;
  }

  // Hard delete user
  async hardDelete() {
    const query = 'DELETE FROM users WHERE id = $1';
    await pool.query(query, [this.id]);
    return true;
  }

  // Get user without sensitive data
  toJSON() {
    const { password, ...userWithoutPassword } = this;
    return userWithoutPassword;
  }
}

module.exports = User;
