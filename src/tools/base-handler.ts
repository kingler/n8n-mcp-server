/**
 * Base Tool Handler Module
 *
 * This module provides base classes for tool handlers with common functionality
 * for workflow, execution, credential, and upload operations.
 */

import type { ToolResult, ToolHandler } from '../types/index.js';
import { N8nApiClient } from '../api/n8n-client.js';
import type { EnvConfig } from '../config/environment.js';
import { logger } from '../utils/logger.js';
import { getEnvConfig } from '../config/environment.js';

/**
 * Base class for all tool handlers
 */
export abstract class BaseToolHandler implements ToolHandler {
  protected apiClient: N8nApiClient;
  protected logger = logger;

  constructor() {
    const config = getEnvConfig();
    this.apiClient = new N8nApiClient(config);
  }

  /**
   * Get a logger instance for a specific category
   */
  protected getLogger(category: string) {
    return this.logger;
  }

  /**
   * Format successful result
   */
  protected formatSuccess<T>(data: T): ToolResult {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, data }, null, 2),
        },
      ],
      success: true,
      data,
    };
  }

  /**
   * Format error result
   */
  protected formatError(error: Error): ToolResult {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ 
            success: false, 
            error: error.message,
            type: error.constructor.name 
          }, null, 2),
        },
      ],
      success: false,
      isError: true,
    };
  }

  /**
   * Abstract methods that must be implemented by subclasses
   */
  abstract execute(args: Record<string, any>): Promise<ToolResult>;
  abstract handle(args: Record<string, any>): Promise<ToolResult>;
}

/**
 * Base class for workflow tool handlers
 */
export abstract class WorkflowBaseHandler extends BaseToolHandler {
  protected override logger = logger;

  constructor() {
    super();
  }

  /**
   * Get a logger instance for a specific category
   */
  protected override getLogger(category: string) {
    return this.logger;
  }
}

/**
 * Base class for execution tool handlers
 */
export abstract class ExecutionBaseHandler extends BaseToolHandler {
  protected override logger = logger;

  constructor() {
    super();
  }

  /**
   * Get a logger instance for a specific category
   */
  protected override getLogger(category: string) {
    return this.logger;
  }
}

/**
 * Base class for credential tool handlers
 */
export abstract class CredentialBaseHandler extends BaseToolHandler {
  protected override logger = logger;

  constructor() {
    super();
  }

  /**
   * Get a logger instance for a specific category
   */
  protected override getLogger(category: string) {
    return this.logger;
  }
}

/**
 * Base class for upload tool handlers
 */
export abstract class UploadBaseHandler extends BaseToolHandler {
  protected override logger = logger;

  constructor() {
    super();
  }

  /**
   * Get a logger instance for a specific category
   */
  protected override getLogger(category: string) {
    return this.logger;
  }
}

/**
 * Base class for tag tool handlers
 */
export abstract class TagBaseHandler extends BaseToolHandler {
  protected override logger = logger;

  constructor() {
    super();
  }

  /**
   * Get a logger instance for a specific category
   */
  protected override getLogger(category: string) {
    return this.logger;
  }
}

/**
 * Base class for user tool handlers
 */
export abstract class UserBaseHandler extends BaseToolHandler {
  protected override logger = logger;

  constructor() {
    super();
  }

  /**
   * Get a logger instance for a specific category
   */
  protected override getLogger(category: string) {
    return this.logger;
  }
}

/**
 * Base class for variable tool handlers
 */
export abstract class VariableBaseHandler extends BaseToolHandler {
  protected override logger = logger;

  constructor() {
    super();
  }

  /**
   * Get a logger instance for a specific category
   */
  protected override getLogger(category: string) {
    return this.logger;
  }
} 