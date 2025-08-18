/**
 * Error Handling Utilities
 * 
 * This file contains error handling utilities for database operations
 * and other error scenarios in the personalized LMS application.
 */

// ============================================================================
// ERROR TYPES AND INTERFACES
// ============================================================================

export interface ErrorDetails {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  context?: string;
}

export class DatabaseError extends Error {
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: string;
  public readonly context?: string;

  constructor(message: string, code: string, details?: any, context?: string) {
    super(message);
    this.name = 'DatabaseError';
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.context = context;
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      timestamp: this.timestamp,
      context: this.context
    };
  }
}

export class ValidationError extends Error {
  public readonly field: string;
  public readonly code: string;
  public readonly timestamp: string;

  constructor(message: string, field: string, code: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
    this.code = code;
    this.timestamp = new Date().toISOString();
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      details: { field: this.field },
      timestamp: this.timestamp
    };
  }
}

export class AuthenticationError extends Error {
  public readonly code: string;
  public readonly timestamp: string;

  constructor(message: string, code: string = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
    this.timestamp = new Date().toISOString();
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      timestamp: this.timestamp
    };
  }
}

export class AuthorizationError extends Error {
  public readonly code: string;
  public readonly timestamp: string;
  public readonly requiredRole?: string;
  public readonly userRole?: string;

  constructor(message: string, requiredRole?: string, userRole?: string) {
    super(message);
    this.name = 'AuthorizationError';
    this.code = 'AUTHORIZATION_ERROR';
    this.timestamp = new Date().toISOString();
    this.requiredRole = requiredRole;
    this.userRole = userRole;
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      details: {
        requiredRole: this.requiredRole,
        userRole: this.userRole
      },
      timestamp: this.timestamp
    };
  }
}

export class AIServiceError extends Error {
  public readonly code: string;
  public readonly timestamp: string;
  public readonly service: string;
  public readonly retryable: boolean;

  constructor(message: string, service: string, code: string = 'AI_SERVICE_ERROR', retryable: boolean = true) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.service = service;
    this.retryable = retryable;
    this.timestamp = new Date().toISOString();
  }

  toJSON(): ErrorDetails {
    return {
      code: this.code,
      message: this.message,
      details: {
        service: this.service,
        retryable: this.retryable
      },
      timestamp: this.timestamp
    };
  }
}

// ============================================================================
// ERROR CODE MAPPINGS
// ============================================================================

export const SUPABASE_ERROR_CODES = {
  // Authentication errors
  'invalid_credentials': 'INVALID_CREDENTIALS',
  'email_not_confirmed': 'EMAIL_NOT_CONFIRMED',
  'user_not_found': 'USER_NOT_FOUND',
  'weak_password': 'WEAK_PASSWORD',
  'signup_disabled': 'SIGNUP_DISABLED',
  
  // Database errors
  'PGRST116': 'NOT_FOUND',
  'PGRST301': 'UNAUTHORIZED',
  '23505': 'DUPLICATE_ENTRY',
  '23503': 'FOREIGN_KEY_VIOLATION',
  '23502': 'NOT_NULL_VIOLATION',
  '23514': 'CHECK_VIOLATION',
  '42501': 'INSUFFICIENT_PRIVILEGE',
  '42P01': 'UNDEFINED_TABLE',
  '42703': 'UNDEFINED_COLUMN',
  
  // Connection errors
  'ECONNREFUSED': 'CONNECTION_REFUSED',
  'ETIMEDOUT': 'CONNECTION_TIMEOUT',
  'ENOTFOUND': 'HOST_NOT_FOUND'
} as const;

export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  EMAIL_NOT_CONFIRMED: 'Please confirm your email address before signing in',
  USER_NOT_FOUND: 'User account not found',
  WEAK_PASSWORD: 'Password must be at least 8 characters long',
  SIGNUP_DISABLED: 'New user registration is currently disabled',
  
  // Authorization
  UNAUTHORIZED: 'You do not have permission to access this resource',
  INSUFFICIENT_PRIVILEGE: 'Insufficient privileges to perform this operation',
  
  // Database
  NOT_FOUND: 'The requested resource was not found',
  DUPLICATE_ENTRY: 'A record with this information already exists',
  FOREIGN_KEY_VIOLATION: 'Cannot delete record due to existing references',
  NOT_NULL_VIOLATION: 'Required field cannot be empty',
  CHECK_VIOLATION: 'Data does not meet validation requirements',
  
  // Connection
  CONNECTION_REFUSED: 'Unable to connect to the database',
  CONNECTION_TIMEOUT: 'Database connection timed out',
  HOST_NOT_FOUND: 'Database host not found',
  
  // AI Services
  AI_SERVICE_UNAVAILABLE: 'AI service is temporarily unavailable',
  AI_QUOTA_EXCEEDED: 'AI service quota exceeded',
  AI_INVALID_REQUEST: 'Invalid request to AI service',
  
  // Validation
  VALIDATION_FAILED: 'Data validation failed',
  INVALID_FORMAT: 'Invalid data format',
  REQUIRED_FIELD: 'This field is required',
  
  // Generic
  INTERNAL_ERROR: 'An unexpected error occurred',
  NETWORK_ERROR: 'Network connection error',
  TIMEOUT_ERROR: 'Operation timed out'
} as const;

// ============================================================================
// ERROR HANDLERS
// ============================================================================

/**
 * Handle database errors from Supabase
 */
export const handleDatabaseError = (error: any, context?: string): DatabaseError => {
  let code = 'INTERNAL_ERROR';
  let message: string = ERROR_MESSAGES.INTERNAL_ERROR;

  // Handle Supabase errors
  if (error?.code) {
    const mappedCode = SUPABASE_ERROR_CODES[error.code as keyof typeof SUPABASE_ERROR_CODES];
    if (mappedCode) {
      code = mappedCode;
      const errorMessage = ERROR_MESSAGES[mappedCode as keyof typeof ERROR_MESSAGES];
      message = errorMessage || error.message;
    }
  }

  // Handle PostgreSQL errors
  if (error?.details && error.details.includes('duplicate key')) {
    code = 'DUPLICATE_ENTRY';
    message = ERROR_MESSAGES.DUPLICATE_ENTRY;
  }

  // Handle network errors
  if (error?.message?.includes('fetch')) {
    code = 'NETWORK_ERROR';
    message = ERROR_MESSAGES.NETWORK_ERROR;
  }

  return new DatabaseError(message, code, error, context);
};

/**
 * Handle authentication errors
 */
export const handleAuthError = (error: any): AuthenticationError => {
  let code = 'AUTH_ERROR';
  let message = 'Authentication failed';

  if (error?.message) {
    if (error.message.includes('Invalid login credentials')) {
      code = 'INVALID_CREDENTIALS';
      message = ERROR_MESSAGES.INVALID_CREDENTIALS;
    } else if (error.message.includes('Email not confirmed')) {
      code = 'EMAIL_NOT_CONFIRMED';
      message = ERROR_MESSAGES.EMAIL_NOT_CONFIRMED;
    } else if (error.message.includes('User not found')) {
      code = 'USER_NOT_FOUND';
      message = ERROR_MESSAGES.USER_NOT_FOUND;
    } else if (error.message.includes('Password should be')) {
      code = 'WEAK_PASSWORD';
      message = ERROR_MESSAGES.WEAK_PASSWORD;
    }
  }

  return new AuthenticationError(message, code);
};

/**
 * Handle AI service errors
 */
export const handleAIError = (error: any, service: string): AIServiceError => {
  let code = 'AI_SERVICE_ERROR';
  let message: string = ERROR_MESSAGES.AI_SERVICE_UNAVAILABLE;
  let retryable = true;

  if (error?.status === 429) {
    code = 'AI_QUOTA_EXCEEDED';
    message = ERROR_MESSAGES.AI_QUOTA_EXCEEDED;
    retryable = false;
  } else if (error?.status === 400) {
    code = 'AI_INVALID_REQUEST';
    message = ERROR_MESSAGES.AI_INVALID_REQUEST;
    retryable = false;
  } else if (error?.status >= 500) {
    code = 'AI_SERVICE_UNAVAILABLE';
    message = ERROR_MESSAGES.AI_SERVICE_UNAVAILABLE;
    retryable = true;
  }

  return new AIServiceError(message, service, code, retryable);
};

/**
 * Handle validation errors
 */
export const handleValidationError = (field: string, message: string, code: string = 'VALIDATION_FAILED'): ValidationError => {
  return new ValidationError(message, field, code);
};

// ============================================================================
// ERROR LOGGING AND REPORTING
// ============================================================================

export interface ErrorLogger {
  log(error: Error, context?: any): void;
  logToService?(error: Error, context?: any): Promise<void>;
}

export class ConsoleErrorLogger implements ErrorLogger {
  log(error: Error, context?: any): void {
    console.error('Error occurred:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString()
    });
  }
}

export class ProductionErrorLogger implements ErrorLogger {
  log(error: Error, context?: any): void {
    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Error occurred:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString()
      });
    }
  }

  async logToService(error: Error, context?: any): Promise<void> {
    // In production, you would send errors to a service like Sentry, LogRocket, etc.
    try {
      // Example: await sendToErrorService(error, context);
      console.warn('Error logging service not configured');
    } catch (loggingError) {
      console.error('Failed to log error to service:', loggingError);
    }
  }
}

// Global error logger instance
export const errorLogger: ErrorLogger = import.meta.env.PROD 
  ? new ProductionErrorLogger() 
  : new ConsoleErrorLogger();

// ============================================================================
// ERROR RECOVERY UTILITIES
// ============================================================================

/**
 * Retry function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Don't retry certain types of errors
      if (error instanceof ValidationError || 
          error instanceof AuthorizationError ||
          (error instanceof AIServiceError && !error.retryable)) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = baseDelay * Math.pow(2, attempt);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Circuit breaker pattern for external services
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private readonly threshold: number = 5,
    private readonly timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw new Error('Circuit breaker is OPEN');
      } else {
        this.state = 'HALF_OPEN';
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}

// ============================================================================
// ERROR BOUNDARY UTILITIES
// ============================================================================

/**
 * Safe async function wrapper that catches and logs errors
 */
export function safeAsync<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  fallback?: R
): (...args: T) => Promise<R | undefined> {
  return async (...args: T): Promise<R | undefined> => {
    try {
      return await fn(...args);
    } catch (error) {
      errorLogger.log(error as Error, { function: fn.name, args });
      return fallback;
    }
  };
}

/**
 * Safe sync function wrapper that catches and logs errors
 */
export function safeSync<T extends any[], R>(
  fn: (...args: T) => R,
  fallback?: R
): (...args: T) => R | undefined {
  return (...args: T): R | undefined => {
    try {
      return fn(...args);
    } catch (error) {
      errorLogger.log(error as Error, { function: fn.name, args });
      return fallback;
    }
  };
}

// ============================================================================
// ERROR RESPONSE UTILITIES
// ============================================================================

/**
 * Create standardized error response for API endpoints
 */
export function createErrorResponse(error: Error, status: number = 500): Response {
  const errorDetails: ErrorDetails = {
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  };

  if (error instanceof DatabaseError || 
      error instanceof ValidationError || 
      error instanceof AuthenticationError || 
      error instanceof AuthorizationError ||
      error instanceof AIServiceError) {
    Object.assign(errorDetails, error.toJSON());
  } else {
    errorDetails.message = import.meta.env.DEV ? error.message : errorDetails.message;
    errorDetails.details = import.meta.env.DEV ? { stack: error.stack } : undefined;
  }

  // Log the error
  errorLogger.log(error);

  return new Response(JSON.stringify(errorDetails), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

/**
 * Get appropriate HTTP status code for error type
 */
export function getErrorStatusCode(error: Error): number {
  if (error instanceof ValidationError) return 400;
  if (error instanceof AuthenticationError) return 401;
  if (error instanceof AuthorizationError) return 403;
  if (error instanceof DatabaseError) {
    switch (error.code) {
      case 'NOT_FOUND': return 404;
      case 'DUPLICATE_ENTRY': return 409;
      case 'UNAUTHORIZED': return 403;
      default: return 500;
    }
  }
  if (error instanceof AIServiceError) {
    switch (error.code) {
      case 'AI_QUOTA_EXCEEDED': return 429;
      case 'AI_INVALID_REQUEST': return 400;
      default: return 503;
    }
  }
  return 500;
}