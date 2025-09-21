const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const authService = require('../services/authService');
const { authenticate, authorize, canAccessResource } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// @route   GET /api/users
// @desc    Get all users (admin only)
// @access  Private (Admin)
router.get('/', authenticate, authorize('admin', 'superadmin'), async (req, res, next) => {
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
});

// @route   GET /api/users/statistics
// @desc    Get user statistics (admin only)
// @access  Private (Admin)
router.get('/statistics', authenticate, authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const stats = await userService.getUserStatistics();
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/dashboard
// @desc    Get user dashboard data
// @access  Private
router.get('/dashboard', authenticate, async (req, res, next) => {
  try {
    const dashboard = await userService.getUserDashboard(req.user.id);
    res.json({
      success: true,
      data: dashboard
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Private (Admin or own profile)
router.get('/:id', authenticate, canAccessResource('id'), async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);
    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/users
// @desc    Create new user (admin only)
// @access  Private (Admin)
router.post('/', authenticate, authorize('admin', 'superadmin'), validate(schemas.register), async (req, res, next) => {
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
});

// @route   PUT /api/users/:id
// @desc    Update user (admin only)
// @access  Private (Admin)
router.put('/:id', authenticate, authorize('admin', 'superadmin'), validate(schemas.updateUser), async (req, res, next) => {
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
});

// @route   PUT /api/users/:id/toggle-status
// @desc    Toggle user active status (admin only)
// @access  Private (Admin)
router.put('/:id/toggle-status', authenticate, authorize('admin', 'superadmin'), async (req, res, next) => {
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
});

// @route   PUT /api/users/:id/reset-password
// @desc    Reset user password (admin only)
// @access  Private (Admin)
router.put('/:id/reset-password', authenticate, authorize('admin', 'superadmin'), validate(schemas.resetPassword), async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.params.id, req.body.newPassword);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/bulk-update-roles
// @desc    Bulk update user roles (superadmin only)
// @access  Private (Superadmin)
router.put('/bulk-update-roles', authenticate, authorize('superadmin'), async (req, res, next) => {
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
});

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete - admin only)
// @access  Private (Admin)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), async (req, res, next) => {
  try {
    const result = await userService.deleteUser(req.params.id);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/users/:id/hard
// @desc    Hard delete user (superadmin only)
// @access  Private (Superadmin)
router.delete('/:id/hard', authenticate, authorize('superadmin'), async (req, res, next) => {
  try {
    const result = await userService.hardDeleteUser(req.params.id);
    res.json({
      success: true,
      message: result.message
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/:id/activity
// @desc    Get user activity (admin or own profile)
// @access  Private (Admin or own profile)
router.get('/:id/activity', authenticate, canAccessResource('id'), async (req, res, next) => {
  try {
    const activity = await userService.getUserActivity(req.params.id);
    res.json({
      success: true,
      data: activity
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
