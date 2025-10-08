/**
 * Authentication Configuration
 * Centralized configuration for token management
 * 
 * Environment Variables:
 * - NEXT_PUBLIC_TOKEN_CHECK_INTERVAL: Token checking interval (ms)
 * - NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD: Token refresh threshold (seconds)
 * - NEXT_PUBLIC_TOKEN_WARNING_THRESHOLD: Warning threshold (seconds)
 * - NEXT_PUBLIC_TOKEN_TOAST_DURATION: Toast duration (ms)
 * - NEXT_PUBLIC_TOKEN_LOGOUT_DELAY: Logout delay (ms)
 * 
 * Example .env.local:
 * NEXT_PUBLIC_TOKEN_CHECK_INTERVAL=30000
 * NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD=300
 * NEXT_PUBLIC_TOKEN_WARNING_THRESHOLD=300
 * NEXT_PUBLIC_TOKEN_TOAST_DURATION=10000
 * NEXT_PUBLIC_TOKEN_LOGOUT_DELAY=2000
 */

// Token checking intervals (in milliseconds) - Environment-based
export const TOKEN_CONFIG = {
  // How often to check token expiry
  CHECK_INTERVAL: parseInt(process.env.NEXT_PUBLIC_TOKEN_CHECK_INTERVAL || '30000'), // 30 seconds default
  
  // When to proactively refresh token (in seconds)
  REFRESH_THRESHOLD: parseInt(process.env.NEXT_PUBLIC_TOKEN_REFRESH_THRESHOLD || '300'), // 5 minutes default
  
  // When to show warning for refresh token (in seconds)
  WARNING_THRESHOLD: parseInt(process.env.NEXT_PUBLIC_TOKEN_WARNING_THRESHOLD || '300'), // 5 minutes default
  
  // Toast notification duration (in milliseconds)
  TOAST_DURATION: parseInt(process.env.NEXT_PUBLIC_TOKEN_TOAST_DURATION || '10000'), // 10 seconds default
  
  // Logout delay after session expiry (in milliseconds)
  LOGOUT_DELAY: parseInt(process.env.NEXT_PUBLIC_TOKEN_LOGOUT_DELAY || '2000'), // 2 seconds default
} as const;

// Environment-based configuration
export const getTokenConfig = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    ...TOKEN_CONFIG,
    // Faster checking in development for testing
    CHECK_INTERVAL: isDevelopment ? 15000 : TOKEN_CONFIG.CHECK_INTERVAL,
    // More aggressive refresh in production
    REFRESH_THRESHOLD: isProduction ? 180 : TOKEN_CONFIG.REFRESH_THRESHOLD,
  };
};

// Application-specific configurations
export const APP_CONFIG = {
  // High security apps (banking, healthcare)
  HIGH_SECURITY: {
    CHECK_INTERVAL: 15000, // 15 seconds
    REFRESH_THRESHOLD: 120, // 2 minutes
    WARNING_THRESHOLD: 180, // 3 minutes
  },
  
  // General web apps (e-commerce, SaaS)
  GENERAL: {
    CHECK_INTERVAL: 30000, // 30 seconds
    REFRESH_THRESHOLD: 300, // 5 minutes
    WARNING_THRESHOLD: 300, // 5 minutes
  },
  
  // Enterprise apps (internal tools)
  ENTERPRISE: {
    CHECK_INTERVAL: 60000, // 1 minute
    REFRESH_THRESHOLD: 600, // 10 minutes
    WARNING_THRESHOLD: 600, // 10 minutes
  },
  
  // Mobile apps (battery optimization)
  MOBILE: {
    CHECK_INTERVAL: 45000, // 45 seconds
    REFRESH_THRESHOLD: 300, // 5 minutes
    WARNING_THRESHOLD: 300, // 5 minutes
  },
} as const;

// Get configuration based on app type
export const getAppConfig = (appType: keyof typeof APP_CONFIG = 'GENERAL') => {
  return APP_CONFIG[appType];
};
