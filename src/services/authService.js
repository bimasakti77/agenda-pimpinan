const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  // Generate JWT token
  generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    });
  }

  // Verify JWT token
  verifyToken(token) {
    try {
      return jwt.verify(token, this.jwtSecret);
    } catch (error) {
      throw new Error('Invalid or expired token');
    }
  }

  // Register new user
  async register(userData) {
    const { username, email, password, full_name, position, department } = userData;

    // Check if user already exists
    const existingUserByEmail = await User.findByEmail(email);
    if (existingUserByEmail) {
      throw new Error('Email already registered');
    }

    const existingUserByUsername = await User.findByUsername(username);
    if (existingUserByUsername) {
      throw new Error('Username already taken');
    }

    // Create new user
    const user = await User.create({
      username,
      email,
      password,
      full_name,
      position,
      department,
      role: 'user' // Default role
    });

    // Generate token
    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token
    };
  }

  // Login user
  async login(username, password) {
    // Find user by username
    const user = await User.findByUsername(username);
    if (!user) {
      throw new Error('Invalid username or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    // Generate token
    const token = this.generateToken(user);

    return {
      user: user.toJSON(),
      token
    };
  }

  // Refresh token
  async refreshToken(token) {
    try {
      const decoded = this.verifyToken(token);
      const user = await User.findById(decoded.id);
      
      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      const newToken = this.generateToken(user);
      return {
        user: user.toJSON(),
        token: newToken
      };
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  // Change password
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.verifyPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    await user.updatePassword(newPassword);

    return { message: 'Password changed successfully' };
  }

  // Reset password (admin only)
  async resetPassword(userId, newPassword) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    await user.updatePassword(newPassword);
    return { message: 'Password reset successfully' };
  }

  // Get user profile
  async getProfile(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return user.toJSON();
  }

  // Update user profile
  async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Remove sensitive fields that shouldn't be updated through profile
    const { password, role, is_active, ...allowedUpdates } = updateData;
    
    await user.update(allowedUpdates);
    return user.toJSON();
  }
}

module.exports = new AuthService();
