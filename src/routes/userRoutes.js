const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// @route   GET /api/users
// @desc    Get all users with pagination and filtering
// @access  Superadmin only
router.get('/', authenticate, authorize('superadmin'), async (req, res, next) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      role = null, 
      is_active = null,
      search = null 
    } = req.query;

    const result = await User.findAll(
      parseInt(page), 
      parseInt(limit), 
      role,
      is_active,
      search
    );

    res.json({
      success: true,
      data: {
        users: result.users.map(user => user.toJSON()),
        pagination: result.pagination
      }
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/check-nip
// @desc    Check NIP availability
// @access  Superadmin only
router.get('/check-nip', authenticate, authorize('superadmin'), async (req, res, next) => {
  try {
    const userController = require('../controllers/userController');
    await userController.checkNipAvailability(req, res, next);
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Superadmin only
router.get('/:id', authenticate, authorize('superadmin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Superadmin only
router.post('/', authenticate, authorize('superadmin'), validate(schemas.createUser), async (req, res, next) => {
  try {
    const userController = require('../controllers/userController');
    await userController.createUser(req, res, next);
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Superadmin only
router.put('/:id', authenticate, authorize('superadmin'), validate(schemas.updateUser), async (req, res, next) => {
  try {
    const userService = require('../services/userService');
    const user = await userService.updateUser(req.params.id, req.body);

    res.json({
      success: true,
      message: 'User updated successfully',
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/:id/reset-password
// @desc    Reset user password
// @access  Superadmin only
router.put('/:id/reset-password', authenticate, authorize('superadmin'), validate(schemas.resetPassword), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { newPassword } = req.body;

    // Update password
    await user.updatePassword(newPassword);

    res.json({
      success: true,
      message: 'Password reset successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/users/:id/toggle-status
// @desc    Toggle user active status
// @access  Superadmin only
router.put('/:id/toggle-status', authenticate, authorize('superadmin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Toggle status
    await user.update({ is_active: !user.is_active });

    res.json({
      success: true,
      message: `User ${user.is_active ? 'activated' : 'deactivated'} successfully`,
      data: user
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (soft delete)
// @access  Superadmin only
router.delete('/:id', authenticate, authorize('superadmin'), async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete
    await user.delete();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;