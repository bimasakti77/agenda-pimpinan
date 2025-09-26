/**
 * Environment Configuration
 * Centralized configuration management for the application
 */

interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  app: {
    name: string;
    version: string;
    environment: string;
  };
  features: {
    debug: boolean;
    analytics: boolean;
  };
  external: {
    sentryDsn?: string;
    googleAnalyticsId?: string;
  };
}


/**
 * Application configuration - Direct access to process.env
 */
export const config: AppConfig = {
  api: {
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
    timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
    retryAttempts: parseInt(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.NEXT_PUBLIC_API_RETRY_DELAY || '1000', 10),
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Agenda Pimpinan',
    version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    environment: process.env.NEXT_PUBLIC_APP_ENV || 'development',
  },
  features: {
    debug: (process.env.NEXT_PUBLIC_ENABLE_DEBUG || 'false').toLowerCase() === 'true',
    analytics: (process.env.NEXT_PUBLIC_ENABLE_ANALYTICS || 'false').toLowerCase() === 'true',
  },
  external: {
    sentryDsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    googleAnalyticsId: process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID,
  },
};

/**
 * Check if running in development mode
 */
export const isDevelopment = (process.env.NEXT_PUBLIC_APP_ENV || 'development') === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = (process.env.NEXT_PUBLIC_APP_ENV || 'development') === 'production';

/**
 * Check if debug mode is enabled
 */
export const isDebugEnabled = (process.env.NEXT_PUBLIC_ENABLE_DEBUG || 'false').toLowerCase() === 'true';

/**
 * API Configuration - Direct access to avoid circular dependency
 */
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api',
  timeout: parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || '30000', 10),
  retryAttempts: parseInt(process.env.NEXT_PUBLIC_API_RETRY_ATTEMPTS || '3', 10),
  retryDelay: parseInt(process.env.NEXT_PUBLIC_API_RETRY_DELAY || '1000', 10),
};

/**
 * App Configuration
 */
export const appConfig = config.app;

/**
 * Feature Configuration
 */
export const featureConfig = config.features;

/**
 * External Services Configuration
 */
export const externalConfig = config.external;

export default config;
