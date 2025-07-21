/**
 * Error Handling Module
 *
 * This module provides custom error classes and error handling utilities
 * for the n8n MCP server.
 */

import { McpError } from '@modelcontextprotocol/sdk/types.js';
import { ErrorCode, ErrorCodeDescriptions } from './error-codes.js';

/**
 * Base custom error class for the n8n MCP server
 */
export class N8nMcpError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly isMcpError: boolean = true;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.InternalError,
    statusCode: number = 500
  ) {
    super(message);
    this.name = 'N8nMcpError';
    this.code = code;
    this.statusCode = statusCode;
  }

  /**
   * Convert to MCP SDK error format
   */
  toMcpError(): McpError {
    return new McpError(this.code, this.message);
  }

  /**
   * Get error description from error code
   */
  getDescription(): string {
    return ErrorCodeDescriptions[this.code] || 'Unknown error';
  }
}

/**
 * API-specific error class
 */
export class N8nApiError extends N8nMcpError {
  constructor(
    message: string,
    statusCode: number = 500,
    code: ErrorCode = ErrorCode.ApiConnectionError
  ) {
    super(message, code, statusCode);
    this.name = 'N8nApiError';
  }
}

/**
 * Validation error class
 */
export class ValidationError extends N8nMcpError {
  constructor(message: string, field?: string) {
    const fullMessage = field ? `${field}: ${message}` : message;
    super(fullMessage, ErrorCode.ValidationError, 400);
    this.name = 'ValidationError';
  }
}

/**
 * Authentication error class
 */
export class AuthenticationError extends N8nMcpError {
  constructor(message: string = 'Authentication failed') {
    super(message, ErrorCode.AuthenticationError, 401);
    this.name = 'AuthenticationError';
  }
}

/**
 * Authorization error class
 */
export class AuthorizationError extends N8nMcpError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, ErrorCode.AuthorizationError, 403);
    this.name = 'AuthorizationError';
  }
}

/**
 * Resource not found error class
 */
export class NotFoundError extends N8nMcpError {
  constructor(resource: string, id?: string) {
    const message = id 
      ? `${resource} with ID '${id}' not found`
      : `${resource} not found`;
    super(message, ErrorCode.NotFoundError, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * Workflow-specific error class
 */
export class WorkflowError extends N8nMcpError {
  constructor(message: string, code: ErrorCode = ErrorCode.WorkflowError) {
    super(message, code, 400);
    this.name = 'WorkflowError';
  }
}

/**
 * Execution-specific error class
 */
export class ExecutionError extends N8nMcpError {
  constructor(message: string, code: ErrorCode = ErrorCode.ExecutionError) {
    super(message, code, 400);
    this.name = 'ExecutionError';
  }
}

/**
 * Credential-specific error class
 */
export class CredentialError extends N8nMcpError {
  constructor(message: string, code: ErrorCode = ErrorCode.CredentialError) {
    super(message, code, 400);
    this.name = 'CredentialError';
  }
}

/**
 * Upload-specific error class
 */
export class UploadError extends N8nMcpError {
  constructor(message: string, code: ErrorCode = ErrorCode.UploadError) {
    super(message, code, 400);
    this.name = 'UploadError';
  }
}

/**
 * Error handling utilities
 */
export class ErrorHandler {
  /**
   * Handle and format errors for MCP responses
   */
  static handleError(error: unknown): { error: string; isError: boolean } {
    if (error instanceof N8nMcpError) {
      return {
        error: error.message,
        isError: true,
      };
    }

    if (error instanceof Error) {
      return {
        error: error.message,
        isError: true,
      };
    }

    return {
      error: 'An unknown error occurred',
      isError: true,
    };
  }

  /**
   * Convert any error to N8nMcpError
   */
  static normalizeError(error: unknown): N8nMcpError {
    if (error instanceof N8nMcpError) {
      return error;
    }

    if (error instanceof Error) {
      return new N8nMcpError(error.message);
    }

    return new N8nMcpError('An unknown error occurred');
  }

  /**
   * Check if error is a network/API error
   */
  static isNetworkError(error: unknown): boolean {
    if (error instanceof N8nApiError) {
      return true;
    }

    if (error instanceof Error) {
      const networkErrorMessages = [
        'network',
        'connection',
        'timeout',
        'fetch',
        'axios',
        'http',
        'https',
      ];

      return networkErrorMessages.some(keyword =>
        error.message.toLowerCase().includes(keyword)
      );
    }

    return false;
  }

  /**
   * Check if error is retryable
   */
  static isRetryableError(error: unknown): boolean {
    if (error instanceof N8nMcpError) {
      const retryableCodes = [
        ErrorCode.ApiConnectionError,
        ErrorCode.ApiTimeoutError,
        ErrorCode.ServiceUnavailable,
        ErrorCode.ApiRateLimitError,
      ];
      return retryableCodes.includes(error.code);
    }

    return this.isNetworkError(error);
  }

  /**
   * Get appropriate HTTP status code for error
   */
  static getStatusCode(error: unknown): number {
    if (error instanceof N8nMcpError) {
      return error.statusCode;
    }

    if (error instanceof Error) {
      if (error.message.includes('not found')) return 404;
      if (error.message.includes('unauthorized')) return 401;
      if (error.message.includes('forbidden')) return 403;
      if (error.message.includes('validation')) return 400;
    }

    return 500;
  }
}

/**
 * Error message utilities
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof N8nMcpError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unknown error occurred';
}

// Export error codes for convenience
export { ErrorCode, ErrorCodeDescriptions } from './error-codes.js'; 