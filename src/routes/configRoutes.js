/**
 * Configuration Routes
 * Provides configuration data to frontend from backend environment variables
 */

const express = require('express');
const router = express.Router();

/**
 * Get public configuration for frontend
 * This endpoint provides configuration that frontend needs
 */
router.get('/public', (req, res) => {
  try {
    const config = {
      api: {
        baseUrl: process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3000}/api`,
        timeout: parseInt(process.env.API_TIMEOUT) || 30000,
        retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS) || 3,
        retryDelay: parseInt(process.env.API_RETRY_DELAY) || 1000,
      },
      app: {
        name: process.env.APP_NAME || 'Agenda Pimpinan',
        version: process.env.APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        url: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,
      },
      features: {
        debug: process.env.ENABLE_DEBUG === 'true',
        analytics: process.env.ENABLE_ANALYTICS === 'true',
        errorReporting: process.env.ENABLE_ERROR_REPORTING === 'true',
      },
      external: {
        sentryDsn: process.env.SENTRY_DSN || '',
        googleAnalyticsId: process.env.GOOGLE_ANALYTICS_ID || '',
      }
    };

    res.json({
      success: true,
      data: config,
      message: 'Configuration retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve configuration',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

/**
 * Get health check information
 */
router.get('/health', (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    res.json({
      success: true,
      data: health,
      message: 'Health check successful'
    });
  } catch (error) {
    console.error('Error in health check:', error);
    res.status(500).json({
      success: false,
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
