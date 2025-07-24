/**
 * Logging Module
 *
 * This module provides a centralized logging system using Winston
 * for the n8n MCP server.
 */

import winston from 'winston';
import type { EnvConfig } from '../types/index.js';

/**
 * Winston logger configuration
 */
const createLogger = (config: EnvConfig) => {
  const logLevel = config.logLevel || 'info';
  
  // Define log format
  const logFormat = winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
      let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
      
      if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
      }
      
      if (stack) {
        log += `\n${stack}`;
      }
      
      return log;
    })
  );

  // Create logger instance
  const transports: winston.transport[] = [];
  
  // Only add console transport if not running as MCP server
  if (process.env['MCP_MODE'] !== 'true' && !process.env['MCP']) {
    transports.push(
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    );
  }
  
  // Only add file transports if not in MCP mode
  if (process.env['MCP_MODE'] !== 'true') {
    transports.push(
      new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      new winston.transports.File({
        filename: 'logs/combined.log',
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  }
  
  // In MCP mode, add a silent transport to prevent warnings
  if (process.env['MCP_MODE'] === 'true' && transports.length === 0) {
    transports.push(new winston.transports.Console({
      level: 'error',
      silent: true
    }));
  }

  const logger = winston.createLogger({
    level: logLevel,
    format: logFormat,
    defaultMeta: { service: 'n8n-mcp-server' },
    transports,
  });

  // Add request logging for development (but not in MCP mode)
  if (process.env['NODE_ENV'] === 'development' && process.env['MCP_MODE'] !== 'true' && !process.env['MCP']) {
    logger.add(new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }));
  }

  return logger;
};

/**
 * Logger instance
 */
let loggerInstance: winston.Logger | null = null;

/**
 * Initialize logger with configuration
 */
export function initializeLogger(config: EnvConfig): winston.Logger {
  if (!loggerInstance) {
    loggerInstance = createLogger(config);
  }
  return loggerInstance;
}

/**
 * Get logger instance
 */
export function getLogger(): winston.Logger {
  if (!loggerInstance) {
    throw new Error('Logger not initialized. Call initializeLogger() first.');
  }
  return loggerInstance;
}

/**
 * Log levels for different operations
 */
export const LogLevels = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug',
  VERBOSE: 'verbose',
} as const;

/**
 * Log categories for better organization
 */
export const LogCategories = {
  SERVER: 'server',
  API: 'api',
  WORKFLOW: 'workflow',
  EXECUTION: 'execution',
  CREDENTIAL: 'credential',
  UPLOAD: 'upload',
  TOOL: 'tool',
  RESOURCE: 'resource',
  AUTH: 'auth',
  VALIDATION: 'validation',
} as const;

/**
 * Enhanced logger with category support
 */
export class Logger {
  private logger: winston.Logger;
  private category: string;

  constructor(category: string = 'general') {
    this.logger = getLogger();
    this.category = category;
  }

  /**
   * Create a child logger with additional context
   */
  child(context: Record<string, any>): Logger {
    const childLogger = new Logger(this.category);
    childLogger.logger = this.logger.child(context);
    return childLogger;
  }

  /**
   * Log error message
   */
  error(message: string, meta?: Record<string, any>): void {
    this.logger.error(message, { category: this.category, ...meta });
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: Record<string, any>): void {
    this.logger.warn(message, { category: this.category, ...meta });
  }

  /**
   * Log info message
   */
  info(message: string, meta?: Record<string, any>): void {
    this.logger.info(message, { category: this.category, ...meta });
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: Record<string, any>): void {
    this.logger.debug(message, { category: this.category, ...meta });
  }

  /**
   * Log verbose message
   */
  verbose(message: string, meta?: Record<string, any>): void {
    this.logger.verbose(message, { category: this.category, ...meta });
  }

  /**
   * Log API request
   */
  logApiRequest(method: string, url: string, meta?: Record<string, any>): void {
    this.info(`API Request: ${method} ${url}`, {
      type: 'api_request',
      method,
      url,
      ...meta
    });
  }

  /**
   * Log API response
   */
  logApiResponse(method: string, url: string, statusCode: number, meta?: Record<string, any>): void {
    this.info(`API Response: ${method} ${url} - ${statusCode}`, {
      type: 'api_response',
      method,
      url,
      statusCode,
      ...meta
    });
  }

  /**
   * Log tool execution
   */
  logToolExecution(toolName: string, args: Record<string, any>, meta?: Record<string, any>): void {
    this.info(`Tool Execution: ${toolName}`, {
      type: 'tool_execution',
      toolName,
      args,
      ...meta
    });
  }

  /**
   * Log workflow operation
   */
  logWorkflowOperation(operation: string, workflowId: string, meta?: Record<string, any>): void {
    this.info(`Workflow ${operation}: ${workflowId}`, {
      type: 'workflow_operation',
      operation,
      workflowId,
      ...meta
    });
  }

  /**
   * Log execution operation
   */
  logExecutionOperation(operation: string, executionId: string, meta?: Record<string, any>): void {
    this.info(`Execution ${operation}: ${executionId}`, {
      type: 'execution_operation',
      operation,
      executionId,
      ...meta
    });
  }

  /**
   * Log credential operation
   */
  logCredentialOperation(operation: string, credentialId: string, meta?: Record<string, any>): void {
    this.info(`Credential ${operation}: ${credentialId}`, {
      type: 'credential_operation',
      operation,
      credentialId,
      ...meta
    });
  }

  /**
   * Log validation error
   */
  logValidationError(field: string, value: any, message: string, meta?: Record<string, any>): void {
    this.error(`Validation Error: ${field} = ${value} - ${message}`, {
      type: 'validation_error',
      field,
      value,
      message,
      ...meta
    });
  }

  /**
   * Log authentication event
   */
  logAuthEvent(event: string, userId?: string, meta?: Record<string, any>): void {
    this.info(`Auth Event: ${event}`, {
      type: 'auth_event',
      event,
      userId,
      ...meta
    });
  }
}

/**
 * Create a logger for a specific category
 */
export function createCategoryLogger(category: string): Logger {
  return new Logger(category);
}

// Export a lazy-initialized logger instance
let mainLogger: Logger | null = null;

export const logger = new Proxy({} as Logger, {
  get(target, prop) {
    if (!mainLogger) {
      // Create a basic logger if not initialized
      if (!loggerInstance) {
        // Use a basic config for initialization
        initializeLogger({
          n8nApiUrl: process.env['N8N_API_URL'] || '',
          n8nApiKey: process.env['N8N_API_KEY'] || '',
          logLevel: process.env['LOG_LEVEL'] || 'info',
        } as EnvConfig);
      }
      mainLogger = new Logger('main');
    }
    return (mainLogger as any)[prop];
  }
}); 