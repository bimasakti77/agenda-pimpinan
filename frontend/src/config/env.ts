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
 * Get environment variable with fallback
 */
function getEnvVar(key: string, fallback: string = ''): string {
  if (typeof window !== 'undefined') {
    // Client-side
    return process.env[key] || fallback;
  }
  // Server-side
  return process.env[key] || fallback;
}

/**
 * Get boolean environment variable
 */
function getBooleanEnvVar(key: string, fallback: boolean = false): boolean {
  const value = getEnvVar(key, fallback.toString());
  return value.toLowerCase() === 'true';
}

/**
 * Get number environment variable
 */
function getNumberEnvVar(key: string, fallback: number = 0): number {
  const value = getEnvVar(key, fallback.toString());
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Application configuration
 */
export const config: AppConfig = {
  api: {
    baseUrl: getEnvVar('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3000/api'),
    timeout: getNumberEnvVar('NEXT_PUBLIC_API_TIMEOUT', 30000),
    retryAttempts: getNumberEnvVar('NEXT_PUBLIC_API_RETRY_ATTEMPTS', 3),
    retryDelay: getNumberEnvVar('NEXT_PUBLIC_API_RETRY_DELAY', 1000),
  },
  app: {
    name: getEnvVar('NEXT_PUBLIC_APP_NAME', 'Agenda Pimpinan'),
    version: getEnvVar('NEXT_PUBLIC_APP_VERSION', '1.0.0'),
    environment: getEnvVar('NEXT_PUBLIC_APP_ENV', 'development'),
  },
  features: {
    debug: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_DEBUG', false),
    analytics: getBooleanEnvVar('NEXT_PUBLIC_ENABLE_ANALYTICS', false),
  },
  external: {
    sentryDsn: getEnvVar('NEXT_PUBLIC_SENTRY_DSN'),
    googleAnalyticsId: getEnvVar('NEXT_PUBLIC_GOOGLE_ANALYTICS_ID'),
  },
};

/**
 * Check if running in development mode
 */
export const isDevelopment = config.app.environment === 'development';

/**
 * Check if running in production mode
 */
export const isProduction = config.app.environment === 'production';

/**
 * Check if debug mode is enabled
 */
export const isDebugEnabled = config.features.debug;

/**
 * API Configuration
 */
export const apiConfig = config.api;

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
