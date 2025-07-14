import winston from 'winston';
import { isDevelopment, isProduction } from '@/config';

/**
 * Log levels
 */
export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

/**
 * Logger configuration
 */
const loggerConfig = {
  level: process.env['LOG_LEVEL'] || (isDevelopment() ? 'debug' : 'info'),
  defaultMeta: {
    service: 'digital-wardrobe-backend',
    environment: process.env['NODE_ENV'] || 'development',
    version: process.env['npm_package_version'] || '1.0.0'
  }
};

/**
 * Custom log format for development
 */
const developmentFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    const metaString = Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : '';
    const stackString = stack ? `\n${stack}` : '';
    return `${timestamp} [${level}]: ${message}${metaString}${stackString}`;
  })
);

/**
 * Custom log format for production
 */
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

/**
 * Create console transport
 */
const consoleTransport = new winston.transports.Console({
  format: isDevelopment() ? developmentFormat : productionFormat,
  silent: process.env['NODE_ENV'] === 'test'
});

/**
 * Create file transport for errors
 */
const errorFileTransport = new winston.transports.File({
  filename: 'logs/error.log',
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  maxsize: 5242880, // 5MB
  maxFiles: 10,
  tailable: true
});

/**
 * Create file transport for all logs
 */
const combinedFileTransport = new winston.transports.File({
  filename: 'logs/combined.log',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  maxsize: 5242880, // 5MB
  maxFiles: 10,
  tailable: true
});

/**
 * Create HTTP transport for production logging (optional)
 */
const httpTransport = process.env['LOG_HTTP_ENDPOINT'] ? new winston.transports.Http({
  host: process.env['LOG_HTTP_HOST'] || 'localhost',
  port: parseInt(process.env['LOG_HTTP_PORT'] || '3000', 10),
  path: process.env['LOG_HTTP_PATH'] || '/logs',
  ssl: process.env['LOG_HTTP_SSL'] === 'true'
}) : null;

/**
 * Create the main logger instance
 */
export const logger = winston.createLogger({
  level: loggerConfig.level,
  defaultMeta: loggerConfig.defaultMeta,
  transports: [
    consoleTransport,
    ...(isProduction() ? [errorFileTransport, combinedFileTransport] : []),
    ...(httpTransport && isProduction() ? [httpTransport] : [])
  ],
  exitOnError: false
});

/**
 * Create specialized loggers for different modules
 */
export const authLogger = logger.child({ module: 'auth' });
export const dbLogger = logger.child({ module: 'database' });
export const apiLogger = logger.child({ module: 'api' });
export const middlewareLogger = logger.child({ module: 'middleware' });
export const serviceLogger = logger.child({ module: 'service' });
export const emailLogger = logger.child({ module: 'email' });
export const fileLogger = logger.child({ module: 'file' });
export const cacheLogger = logger.child({ module: 'cache' });
export const jobLogger = logger.child({ module: 'job' });

/**
 * Logger utility functions
 */
export const logUtils = {
  /**
   * Log HTTP request
   */
  logRequest: (req: any, res?: any, duration?: number): void => {
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      userId: req.user?.userId,
      ...(duration && { duration: `${duration}ms` }),
      ...(res && { statusCode: res.statusCode })
    };

    if (res?.statusCode >= 400) {
      apiLogger.warn('HTTP Request Failed', logData);
    } else {
      apiLogger.info('HTTP Request', logData);
    }
  },

  /**
   * Log database operation
   */
  logDatabase: (operation: string, table: string, duration?: number, error?: Error): void => {
    const logData = {
      operation,
      table,
      ...(duration && { duration: `${duration}ms` }),
      ...(error && { error: error.message })
    };

    if (error) {
      dbLogger.error('Database Operation Failed', logData);
    } else {
      dbLogger.debug('Database Operation', logData);
    }
  },

  /**
   * Log authentication events
   */
  logAuth: (event: string, userId?: string, details?: Record<string, unknown>): void => {
    const logData = {
      event,
      ...(userId && { userId }),
      ...details
    };

    authLogger.info('Authentication Event', logData);
  },

  /**
   * Log business events
   */
  logBusiness: (event: string, userId?: string, details?: Record<string, unknown>): void => {
    const logData = {
      event,
      ...(userId && { userId }),
      ...details
    };

    logger.info('Business Event', logData);
  },

  /**
   * Log performance metrics
   */
  logPerformance: (metric: string, value: number, unit: string = 'ms', tags?: Record<string, string>): void => {
    const logData = {
      metric,
      value,
      unit,
      ...tags
    };

    logger.info('Performance Metric', logData);
  },

  /**
   * Log security events
   */
  logSecurity: (event: string, level: 'info' | 'warn' | 'error', details?: Record<string, unknown>): void => {
    const logData = {
      event,
      security: true,
      ...details
    };

    logger[level]('Security Event', logData);
  },

  /**
   * Log external service calls
   */
  logExternalService: (
    service: string,
    endpoint: string,
    method: string,
    duration?: number,
    statusCode?: number,
    error?: Error
  ): void => {
    const logData = {
      service,
      endpoint,
      method,
      ...(duration && { duration: `${duration}ms` }),
      ...(statusCode && { statusCode }),
      ...(error && { error: error.message })
    };

    if (error || (statusCode && statusCode >= 400)) {
      logger.error('External Service Call Failed', logData);
    } else {
      logger.debug('External Service Call', logData);
    }
  }
};

/**
 * Error logging helper
 */
export const logError = (error: Error, context?: Record<string, unknown>): void => {
  const logData = {
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    ...context
  };

  logger.error('Application Error', logData);
};

/**
 * Request logging middleware helper
 */
export const createRequestLogger = () => {
  return (req: any, res: any, next: any): void => {
    const start = Date.now();
    const originalSend = res.send;

    res.send = function (body: any): any {
      const duration = Date.now() - start;
      logUtils.logRequest(req, res, duration);
      return originalSend.call(this, body);
    };

    next();
  };
};

/**
 * Query logger for database operations
 */
export const createQueryLogger = () => {
  return (query: string, params?: any[], duration?: number): void => {
    const logData = {
      query: query.replace(/\s+/g, ' ').trim(),
      ...(params && params.length > 0 && { params }),
      ...(duration && { duration: `${duration}ms` })
    };

    dbLogger.debug('Database Query', logData);
  };
};

/**
 * Stream for morgan HTTP logger
 */
export const morganStream = {
  write: (message: string): void => {
    apiLogger.info(message.trim());
  }
};

/**
 * Graceful shutdown logger
 */
export const gracefulShutdown = (signal: string): void => {
  logger.info('Graceful Shutdown', { signal });
  
  // Wait for logger to finish writing
  logger.end(() => {
    process.exit(0);
  });
};

/**
 * Log application startup
 */
export const logStartup = (port: number, environment: string): void => {
  logger.info('Application Started', {
    port,
    environment,
    nodeVersion: process.version,
    platform: process.platform,
    arch: process.arch,
    pid: process.pid,
    uptime: process.uptime()
  });
};

/**
 * Log configuration on startup
 */
export const logConfiguration = (config: Record<string, unknown>): void => {
  if (isDevelopment()) {
    logger.info('Application Configuration', config);
  }
};

/**
 * Health check logger
 */
export const logHealthCheck = (status: 'healthy' | 'unhealthy', checks: Record<string, boolean>): void => {
  const logData = {
    status,
    checks,
    timestamp: new Date().toISOString()
  };

  if (status === 'healthy') {
    logger.info('Health Check', logData);
  } else {
    logger.warn('Health Check Failed', logData);
  }
};

/**
 * Create logger for specific module
 */
export const createModuleLogger = (moduleName: string): winston.Logger => {
  return logger.child({ module: moduleName });
};

/**
 * Export default logger
 */
export default logger; 