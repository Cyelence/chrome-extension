import { ValidationError as ExpressValidationError } from 'express-validator';
import { ApiError, ValidationError as ValidationErrorType, BusinessError } from '@/types';

/**
 * Custom error codes for the application
 */
export enum ErrorCode {
  // Authentication & Authorization
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_EXPIRED = 'AUTH_TOKEN_EXPIRED',
  AUTH_TOKEN_INVALID = 'AUTH_TOKEN_INVALID',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  AUTH_ACCOUNT_LOCKED = 'AUTH_ACCOUNT_LOCKED',
  AUTH_EMAIL_NOT_VERIFIED = 'AUTH_EMAIL_NOT_VERIFIED',
  
  // User Management
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  USER_INVALID_EMAIL = 'USER_INVALID_EMAIL',
  USER_WEAK_PASSWORD = 'USER_WEAK_PASSWORD',
  USER_PROFILE_INCOMPLETE = 'USER_PROFILE_INCOMPLETE',
  
  // Item Management
  ITEM_NOT_FOUND = 'ITEM_NOT_FOUND',
  ITEM_ALREADY_EXISTS = 'ITEM_ALREADY_EXISTS',
  ITEM_INVALID_DATA = 'ITEM_INVALID_DATA',
  ITEM_PERMISSION_DENIED = 'ITEM_PERMISSION_DENIED',
  ITEM_LIMIT_EXCEEDED = 'ITEM_LIMIT_EXCEEDED',
  
  // Collection Management
  COLLECTION_NOT_FOUND = 'COLLECTION_NOT_FOUND',
  COLLECTION_ALREADY_EXISTS = 'COLLECTION_ALREADY_EXISTS',
  COLLECTION_LIMIT_EXCEEDED = 'COLLECTION_LIMIT_EXCEEDED',
  COLLECTION_PERMISSION_DENIED = 'COLLECTION_PERMISSION_DENIED',
  
  // File & Media
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  FILE_INVALID_TYPE = 'FILE_INVALID_TYPE',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  
  // Database
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  DATABASE_QUERY_ERROR = 'DATABASE_QUERY_ERROR',
  DATABASE_CONSTRAINT_ERROR = 'DATABASE_CONSTRAINT_ERROR',
  DATABASE_TRANSACTION_ERROR = 'DATABASE_TRANSACTION_ERROR',
  
  // External Services
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  EXTERNAL_SERVICE_TIMEOUT = 'EXTERNAL_SERVICE_TIMEOUT',
  EXTERNAL_SERVICE_UNAVAILABLE = 'EXTERNAL_SERVICE_UNAVAILABLE',
  PAYMENT_PROCESSING_ERROR = 'PAYMENT_PROCESSING_ERROR',
  
  // Validation
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  VALIDATION_REQUIRED_FIELD = 'VALIDATION_REQUIRED_FIELD',
  VALIDATION_INVALID_FORMAT = 'VALIDATION_INVALID_FORMAT',
  VALIDATION_VALUE_TOO_LONG = 'VALIDATION_VALUE_TOO_LONG',
  VALIDATION_VALUE_TOO_SHORT = 'VALIDATION_VALUE_TOO_SHORT',
  
  // System
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  
  // Configuration
  CONFIG_INVALID = 'CONFIG_INVALID',
  CONFIG_MISSING = 'CONFIG_MISSING',
  FEATURE_DISABLED = 'FEATURE_DISABLED'
}

/**
 * HTTP status codes mapping
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504
} as const;

/**
 * Base application error class
 */
export class AppError extends Error implements BusinessError {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR,
    isOperational: boolean = true,
    details?: Record<string, unknown>
  ) {
    super(message);
    
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.details = details;
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to API response format
   */
  toApiError(): ApiError {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
      ...(process.env['NODE_ENV'] === 'development' && this.stack && { stack: this.stack })
    };
  }

  /**
   * Convert error to JSON for logging
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      details: this.details,
      stack: this.stack
    };
  }
}

/**
 * Authentication related errors
 */
export class AuthError extends AppError {
  constructor(message: string, code: ErrorCode, details?: Record<string, unknown>) {
    super(message, code, HTTP_STATUS.UNAUTHORIZED, true, details);
  }
}

/**
 * Authorization related errors
 */
export class AuthorizationError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, details?: Record<string, unknown>) {
    super(message, code, HTTP_STATUS.FORBIDDEN, true, details);
  }
}

/**
 * Resource not found errors
 */
export class NotFoundError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.RESOURCE_NOT_FOUND, details?: Record<string, unknown>) {
    super(message, code, HTTP_STATUS.NOT_FOUND, true, details);
  }
}

/**
 * Validation errors
 */
export class ValidationError extends AppError {
  public readonly errors: ValidationErrorType[];

  constructor(
    message: string,
    errors: ValidationErrorType[] = [],
    code: ErrorCode = ErrorCode.VALIDATION_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, true, details);
    this.errors = errors;
  }

  /**
   * Create validation error from express-validator results
   */
  static fromExpressValidator(
    errors: ExpressValidationError[],
    message: string = 'Validation failed'
  ): ValidationError {
    const validationErrors: ValidationErrorType[] = errors.map(error => ({
      field: error.type === 'field' ? error.path : 'unknown',
      message: error.msg,
      code: ErrorCode.VALIDATION_ERROR,
      value: error.type === 'field' ? error.value : undefined
    }));

    return new ValidationError(message, validationErrors, ErrorCode.VALIDATION_ERROR, {
      errorCount: errors.length
    });
  }
}

/**
 * Database related errors
 */
export class DatabaseError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.DATABASE_QUERY_ERROR, details?: Record<string, unknown>) {
    super(message, code, HTTP_STATUS.INTERNAL_SERVER_ERROR, true, details);
  }
}

/**
 * External service errors
 */
export class ExternalServiceError extends AppError {
  constructor(
    message: string,
    serviceName: string,
    code: ErrorCode = ErrorCode.EXTERNAL_SERVICE_ERROR,
    statusCode: number = HTTP_STATUS.BAD_GATEWAY,
    details?: Record<string, unknown>
  ) {
    super(message, code, statusCode, true, {
      serviceName,
      ...details
    });
  }
}

/**
 * Rate limiting errors
 */
export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded', details?: Record<string, unknown>) {
    super(message, ErrorCode.RATE_LIMIT_EXCEEDED, HTTP_STATUS.TOO_MANY_REQUESTS, true, details);
  }
}

/**
 * File upload errors
 */
export class FileUploadError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.FILE_UPLOAD_FAILED, details?: Record<string, unknown>) {
    super(message, code, HTTP_STATUS.BAD_REQUEST, true, details);
  }
}

/**
 * Configuration errors
 */
export class ConfigError extends AppError {
  constructor(message: string, code: ErrorCode = ErrorCode.CONFIG_INVALID, details?: Record<string, unknown>) {
    super(message, code, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, details);
  }
}

/**
 * Error factory functions
 */
export const createError = {
  auth: (message: string, code: ErrorCode = ErrorCode.AUTH_INVALID_CREDENTIALS, details?: Record<string, unknown>) => 
    new AuthError(message, code, details),
  
  authorization: (message: string, details?: Record<string, unknown>) => 
    new AuthorizationError(message, ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, details),
  
  notFound: (resource: string, id?: string) => 
    new NotFoundError(
      `${resource} not found${id ? ` with ID: ${id}` : ''}`,
      ErrorCode.RESOURCE_NOT_FOUND,
      { resource, id }
    ),
  
  validation: (message: string, errors: ValidationError[] = []) => 
    new ValidationError(message, errors),
  
  database: (message: string, operation?: string, details?: Record<string, unknown>) => 
    new DatabaseError(message, ErrorCode.DATABASE_QUERY_ERROR, { operation, ...details }),
  
  external: (serviceName: string, message: string, statusCode?: number) => 
    new ExternalServiceError(message, serviceName, ErrorCode.EXTERNAL_SERVICE_ERROR, statusCode),
  
  rateLimit: (message?: string, details?: Record<string, unknown>) => 
    new RateLimitError(message, details),
  
  fileUpload: (message: string, fileName?: string, details?: Record<string, unknown>) => 
    new FileUploadError(message, ErrorCode.FILE_UPLOAD_FAILED, { fileName, ...details }),
  
  config: (message: string, configKey?: string) => 
    new ConfigError(message, ErrorCode.CONFIG_INVALID, { configKey }),
  
  internal: (message: string, details?: Record<string, unknown>) => 
    new AppError(message, ErrorCode.INTERNAL_SERVER_ERROR, HTTP_STATUS.INTERNAL_SERVER_ERROR, false, details)
};

/**
 * Check if error is operational (expected) or programming error
 */
export const isOperationalError = (error: Error): boolean => {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
};

/**
 * Convert any error to AppError
 */
export const normalizeError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }
  
  if (error instanceof Error) {
    return new AppError(
      error.message,
      ErrorCode.INTERNAL_SERVER_ERROR,
      HTTP_STATUS.INTERNAL_SERVER_ERROR,
      false,
      {
        originalError: error.name,
        stack: error.stack
      }
    );
  }
  
  return new AppError(
    'An unknown error occurred',
    ErrorCode.INTERNAL_SERVER_ERROR,
    HTTP_STATUS.INTERNAL_SERVER_ERROR,
    false,
    { originalError: String(error) }
  );
};

/**
 * Create error response for API
 */
export const createErrorResponse = (error: AppError): {
  success: false;
  error: ApiError;
  statusCode: number;
} => ({
  success: false,
  error: error.toApiError(),
  statusCode: error.statusCode
});

/**
 * Log error appropriately based on type
 */
export const logError = (error: AppError, context?: Record<string, unknown>): void => {
  const errorData = {
    ...error.toJSON(),
    context,
    timestamp: new Date().toISOString()
  };
  
  if (error.isOperational) {
    console.warn('Operational Error:', errorData);
  } else {
    console.error('Programming Error:', errorData);
  }
};

export default {
  AppError,
  AuthError,
  AuthorizationError,
  NotFoundError,
  ValidationError,
  DatabaseError,
  ExternalServiceError,
  RateLimitError,
  FileUploadError,
  ConfigError,
  ErrorCode,
  HTTP_STATUS,
  createError,
  isOperationalError,
  normalizeError,
  createErrorResponse,
  logError
}; 