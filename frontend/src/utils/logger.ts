/**
 * Logging utility for frontend application
 * Following modern web development standards
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private logLevel: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.logLevel = this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO;
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (level < this.logLevel) return;

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      error
    };

    // Console logging
    this.logToConsole(logEntry);

    // In production, you might want to send logs to a service
    if (!this.isDevelopment) {
      this.logToService(logEntry);
    }
  }

  private logToConsole(entry: LogEntry): void {
    const { level, message, timestamp, context, error } = entry;
    const timeStr = timestamp.toISOString();
    
    const logData = {
      time: timeStr,
      level: LogLevel[level],
      message,
      ...(context && { context }),
      ...(error && { error: error.message, stack: error.stack })
    };

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(`[DEBUG] ${timeStr}`, logData);
        break;
      case LogLevel.INFO:
        console.info(`[INFO] ${timeStr}`, logData);
        break;
      case LogLevel.WARN:
        console.warn(`[WARN] ${timeStr}`, logData);
        break;
      case LogLevel.ERROR:
        console.error(`[ERROR] ${timeStr}`, logData);
        break;
    }
  }

  private logToService(entry: LogEntry): void {
    // In production, send logs to monitoring service
    // Example: Sentry, LogRocket, or custom logging service
    try {
      // fetch('/api/logs', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(entry)
      // });
    } catch (err) {
      // Fallback to console if logging service fails
      console.error('Failed to send log to service:', err);
    }
  }

  debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  error(message: string, error?: Error, context?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Performance logging
  time(label: string): void {
    if (this.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.isDevelopment) {
      console.timeEnd(label);
    }
  }

  // API request logging
  logApiRequest(method: string, url: string, data?: any): void {
    this.debug('API Request', {
      method,
      url,
      data: data ? JSON.stringify(data) : undefined
    });
  }

  logApiResponse(method: string, url: string, status: number, data?: any): void {
    const level = status >= 400 ? LogLevel.ERROR : LogLevel.INFO;
    this.log(level, 'API Response', {
      method,
      url,
      status,
      data: data ? JSON.stringify(data) : undefined
    });
  }

  // User action logging
  logUserAction(action: string, context?: Record<string, any>): void {
    this.info('User Action', {
      action,
      ...context
    });
  }
}

// Create singleton instance
export const logger = new Logger();

// Convenience functions
export const logDebug = (message: string, context?: Record<string, any>) => 
  logger.debug(message, context);

export const logInfo = (message: string, context?: Record<string, any>) => 
  logger.info(message, context);

export const logWarn = (message: string, context?: Record<string, any>) => 
  logger.warn(message, context);

export const logError = (message: string, error?: Error, context?: Record<string, any>) => 
  logger.error(message, error, context);
