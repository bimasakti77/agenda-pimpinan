const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
        this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '15m'; // Google standard: 15 minutes access token
        this.refreshTokenExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'; // Google standard: 7 days refresh token
    this.refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret-key';
  }

  // Generate JWT access token
  generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      type: 'access'
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.jwtExpiresIn
    });
  }

  // Generate refresh token
  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      type: 'refresh'
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiresIn
    });
  }

  // Verify JWT access token
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired access token');
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret);
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      return decoded;
    } catch (error) {
      throw new Error('Invalid or expired refresh token');
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

    // Generate tokens
    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  }

  // Login user
  async login(username, password) {
    console.log('=== AUTH SERVICE LOGIN ===');
    console.log('Login attempt with:', username);
    
    // Find user by username or email
    let user = await User.findByUsername(username);
    console.log('User found by username:', !!user);
    
    if (!user) {
      // Try to find by email if username not found
      console.log('Trying to find by email...');
      user = await User.findByEmail(username);
      console.log('User found by email:', !!user);
    }
    
    if (!user) {
      console.log('No user found with username/email:', username);
      throw new Error('Invalid username/email or password');
    }
    
    console.log('User found:', user.username, user.email, user.role);

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid username or password');
    }

    // Generate tokens
    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: user.toJSON(),
      accessToken,
      refreshToken
    };
  }

  // Refresh token
  async refreshToken(refreshToken) {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      const user = await User.findById(decoded.id);
      
      if (!user || !user.is_active) {
        throw new Error('User not found or inactive');
      }

      // Generate new access token only (refresh token stays the same)
      const newAccessToken = this.generateToken(user);
      
      return {
        user: user.toJSON(),
        accessToken: newAccessToken,
        refreshToken: refreshToken // Keep the same refresh token
      };
    } catch (error) {
      throw new Error('Invalid refresh token');
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
