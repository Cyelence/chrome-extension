import { config } from 'dotenv';
import { AppConfig } from '@/types';

// Load environment variables
config();

/**
 * Validates that a required environment variable is present
 */
const requireEnv = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

/**
 * Gets an environment variable with a default value
 */
const getEnv = (key: string, defaultValue: string): string => {
  return process.env[key] || defaultValue;
};

/**
 * Gets an environment variable as a number
 */
const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a valid number`);
  }
  return parsed;
};

/**
 * Gets an environment variable as a boolean
 */
const getEnvBoolean = (key: string, defaultValue: boolean): boolean => {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  return value.toLowerCase() === 'true';
};

/**
 * Gets an environment variable as an array (comma-separated)
 */
const getEnvArray = (key: string, defaultValue: string[] = []): string[] => {
  const value = process.env[key];
  if (!value) return defaultValue;
  
  return value.split(',').map(item => item.trim()).filter(Boolean);
};

/**
 * Application configuration
 */
export const appConfig: AppConfig = {
  server: {
    port: getEnvNumber('PORT', 3001),
    host: getEnv('HOST', 'localhost'),
    nodeEnv: getEnv('NODE_ENV', 'development'),
    apiPrefix: getEnv('API_PREFIX', '/api/v1')
  },
  
  database: {
    url: requireEnv('DATABASE_URL')
  },
  
  auth: {
    jwtSecret: requireEnv('JWT_SECRET'),
    jwtExpiresIn: getEnv('JWT_EXPIRES_IN', '24h'),
    jwtRefreshExpiresIn: getEnv('JWT_REFRESH_EXPIRES_IN', '7d'),
    sessionSecret: requireEnv('SESSION_SECRET'),
    bcryptRounds: getEnvNumber('BCRYPT_ROUNDS', 12)
  },
  
  // Optional Redis configuration
  redis: process.env['REDIS_URL'] ? {
    url: process.env['REDIS_URL'],
    ...(process.env['REDIS_PASSWORD'] && { password: process.env['REDIS_PASSWORD'] }),
    db: getEnvNumber('REDIS_DB', 0)
  } : undefined,
  
  // Optional email configuration
  email: process.env['SMTP_HOST'] ? {
    host: process.env['SMTP_HOST'],
    port: getEnvNumber('SMTP_PORT', 587),
    secure: getEnvBoolean('SMTP_SECURE', false),
    user: requireEnv('SMTP_USER'),
    password: requireEnv('SMTP_PASS')
  } : undefined,
  
  // Optional storage configuration
  storage: (() => {
    if (process.env['AWS_ACCESS_KEY_ID'] && process.env['AWS_SECRET_ACCESS_KEY']) {
      return {
        provider: 'aws' as const,
        aws: {
          accessKeyId: process.env['AWS_ACCESS_KEY_ID'],
          secretAccessKey: process.env['AWS_SECRET_ACCESS_KEY'],
          region: getEnv('AWS_REGION', 'us-east-1'),
          bucket: requireEnv('AWS_S3_BUCKET')
        }
      };
    }
    
    if (process.env['CLOUDINARY_CLOUD_NAME'] && process.env['CLOUDINARY_API_KEY']) {
      return {
        provider: 'cloudinary' as const,
        cloudinary: {
          cloudName: process.env['CLOUDINARY_CLOUD_NAME'],
          apiKey: process.env['CLOUDINARY_API_KEY'],
          apiSecret: requireEnv('CLOUDINARY_API_SECRET')
        }
      };
    }
    
    return {
      provider: 'local' as const
    };
  })(),
  
  features: {
    enableSwagger: getEnvBoolean('ENABLE_SWAGGER', true),
    enableAnalytics: getEnvBoolean('ENABLE_ANALYTICS', true),
    enableCaching: getEnvBoolean('ENABLE_CACHING', true),
    enableCompression: getEnvBoolean('ENABLE_COMPRESSION', true)
  },
  
  security: {
    rateLimitWindowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
    rateLimitMaxRequests: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
    corsOrigins: getEnvArray('CORS_ORIGIN', [
      'http://localhost:3000',
      'http://localhost:3001',
      'chrome-extension://'
    ])
  }
};

/**
 * Validates the configuration
 */
export const validateConfig = (): void => {
  const requiredFields = [
    'DATABASE_URL',
    'JWT_SECRET',
    'SESSION_SECRET'
  ];
  
  const missingFields = requiredFields.filter(field => !process.env[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required environment variables: ${missingFields.join(', ')}`);
  }
  
  // Validate JWT secret length
  if (appConfig.auth.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
  }
  
  // Validate session secret length
  if (appConfig.auth.sessionSecret.length < 32) {
    throw new Error('SESSION_SECRET must be at least 32 characters long');
  }
  
  // Validate bcrypt rounds
  if (appConfig.auth.bcryptRounds < 10 || appConfig.auth.bcryptRounds > 15) {
    throw new Error('BCRYPT_ROUNDS must be between 10 and 15');
  }
  
  // Validate database URL format
  if (!appConfig.database.url.startsWith('postgresql://')) {
    throw new Error('DATABASE_URL must be a valid PostgreSQL connection string');
  }
  
  // Validate port range
  if (appConfig.server.port < 1024 || appConfig.server.port > 65535) {
    throw new Error('PORT must be between 1024 and 65535');
  }
};

/**
 * Environment helpers
 */
export const isDevelopment = (): boolean => appConfig.server.nodeEnv === 'development';
export const isProduction = (): boolean => appConfig.server.nodeEnv === 'production';
export const isTest = (): boolean => appConfig.server.nodeEnv === 'test';

/**
 * Feature flags
 */
export const featureFlags = {
  isSwaggerEnabled: appConfig.features.enableSwagger,
  isAnalyticsEnabled: appConfig.features.enableAnalytics,
  isCachingEnabled: appConfig.features.enableCaching,
  isCompressionEnabled: appConfig.features.enableCompression,
  isRedisEnabled: Boolean(appConfig.redis),
  isEmailEnabled: Boolean(appConfig.email),
  isStorageEnabled: Boolean(appConfig.storage)
};

/**
 * Log configuration (for debugging)
 */
export const logConfig = (): void => {
  if (isDevelopment()) {
    console.log('🚀 Application Configuration:');
    console.log(`  Environment: ${appConfig.server.nodeEnv}`);
    console.log(`  Server: ${appConfig.server.host}:${appConfig.server.port}`);
    console.log(`  API Prefix: ${appConfig.server.apiPrefix}`);
    console.log(`  Database: ${appConfig.database.url.split('@')[1]}`); // Hide credentials
    console.log(`  Features: ${JSON.stringify(featureFlags, null, 2)}`);
    console.log(`  CORS Origins: ${appConfig.security.corsOrigins.join(', ')}`);
  }
};

// Validate configuration on module load
validateConfig();

export default appConfig; 