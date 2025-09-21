const userService = require('../services/userService');
const authService = require('../services/authService');

class UserController {
  // Get all users (admin only)
  async getAllUsers(req, res, next) {
    try {
      const { page = 1, limit = 10, role, search } = req.query;
      const filters = { role, search };
      
      const result = await userService.getAllUsers(filters, parseInt(page), parseInt(limit));
      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user by ID
  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);
      res.json({
        success: true,
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Create new user (admin only)
  async createUser(req, res, next) {
    try {
      const user = await userService.createUser(req.body);
      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Update user (admin only)
  async updateUser(req, res, next) {
    try {
      const user = await userService.updateUser(req.params.id, req.body);
      res.json({
        success: true,
        message: 'User updated successfully',
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete user (admin only)
  async deleteUser(req, res, next) {
    try {
      const result = await userService.deleteUser(req.params.id);
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  // Hard delete user (superadmin only)
  async hardDeleteUser(req, res, next) {
    try {
      const result = await userService.hardDeleteUser(req.params.id);
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  // Toggle user status (admin only)
  async toggleUserStatus(req, res, next) {
    try {
      const user = await userService.toggleUserStatus(req.params.id);
      res.json({
        success: true,
        message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
        data: user.toJSON()
      });
    } catch (error) {
      next(error);
    }
  }

  // Reset user password (admin only)
  async resetUserPassword(req, res, next) {
    try {
      const result = await authService.resetPassword(req.params.id, req.body.newPassword);
      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  // Bulk update user roles (superadmin only)
  async bulkUpdateUserRoles(req, res, next) {
    try {
      const { userIds, role } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'User IDs array is required'
        });
      }
      
      if (!role || !['user', 'admin', 'superadmin'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Valid role is required'
        });
      }
      
      const updatedUsers = await userService.bulkUpdateUserRoles(userIds, role);
      res.json({
        success: true,
        message: `${updatedUsers.length} users updated successfully`,
        data: updatedUsers
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user statistics (admin only)
  async getUserStatistics(req, res, next) {
    try {
      const stats = await userService.getUserStatistics();
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user dashboard
  async getUserDashboard(req, res, next) {
    try {
      const dashboard = await userService.getUserDashboard(req.user.id);
      res.json({
        success: true,
        data: dashboard
      });
    } catch (error) {
      next(error);
    }
  }

  // Get user activity
  async getUserActivity(req, res, next) {
    try {
      const activity = await userService.getUserActivity(req.params.id);
      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
