import { logger } from '../utils/logger.js';
import { N8nMcpError } from '../errors/index.js';
import { ErrorCode } from '../errors/error-codes.js';

// Import all tool handlers
import { ListWorkflowsHandler } from './workflow/list.js';
import { GetWorkflowHandler } from './workflow/get.js';
import { CreateWorkflowHandler } from './workflow/create.js';
import { UpdateWorkflowHandler } from './workflow/update.js';
import { DeleteWorkflowHandler } from './workflow/delete.js';
import { ActivateWorkflowHandler } from './workflow/activate.js';
import { DeactivateWorkflowHandler } from './workflow/deactivate.js';
import { UpdateWorkflowTagsHandler } from './workflow/update-tags.js';
import { TransferWorkflowHandler } from './workflow/transfer.js';

import { ListExecutionsHandler } from './execution/list.js';
import { ExecuteWorkflowHandler } from './execution/execute.js';
import { GetExecutionHandler } from './execution/get.js';
import { DeleteExecutionHandler } from './execution/delete.js';
import { RetryExecutionHandler } from './execution/retry.js';
import { StopExecutionHandler } from './execution/stop.js';

import { ListCredentialsHandler } from './credential/list.js';
import { CreateCredentialHandler } from './credential/create.js';
import { GetCredentialHandler } from './credential/get.js';
import { UpdateCredentialHandler } from './credential/update.js';
import { DeleteCredentialHandler } from './credential/delete.js';
import { TestCredentialHandler } from './credential/test.js';
import { TransferCredentialHandler } from './credential/transfer.js';

import { ListTagsHandler } from './tag/list.js';
import { GetTagHandler } from './tag/get.js';
import { CreateTagHandler } from './tag/create.js';
import { UpdateTagHandler } from './tag/update.js';
import { DeleteTagHandler } from './tag/delete.js';

import { ListUsersHandler } from './user/list.js';
import { GetUserHandler } from './user/get.js';

import { ListVariablesHandler } from './variable/list.js';
import { GetVariableHandler } from './variable/get.js';
import { CreateVariableHandler } from './variable/create.js';
import { UpdateVariableHandler } from './variable/update.js';
import { DeleteVariableHandler } from './variable/delete.js';

import { UploadWorkflowHandler } from './upload/upload.js';

import { CheckConnectivityHandler, GetHealthStatusHandler } from './utility/connectivity.js';

/**
 * Tool registry for managing all MCP tool handlers
 * Provides centralized tool execution and error handling
 */
export class ToolRegistry {
  private handlers: Map<string, any> = new Map();
  private logger = logger;

  constructor() {
    this.initializeHandlers();
  }

  /**
   * Initialize all tool handlers
   */
  private initializeHandlers(): void {
    this.logger.info('Initializing tool handlers');
    
    // Workflow tools
    this.registerHandler('list_workflows', new ListWorkflowsHandler());
    this.registerHandler('get_workflow', new GetWorkflowHandler());
    this.registerHandler('create_workflow', new CreateWorkflowHandler());
    this.registerHandler('update_workflow', new UpdateWorkflowHandler());
    this.registerHandler('delete_workflow', new DeleteWorkflowHandler());
    this.registerHandler('activate_workflow', new ActivateWorkflowHandler());
    this.registerHandler('deactivate_workflow', new DeactivateWorkflowHandler());
    this.registerHandler('update_workflow_tags', new UpdateWorkflowTagsHandler());
    this.registerHandler('transfer_workflow', new TransferWorkflowHandler());
    
    // Execution tools
    this.registerHandler('list_executions', new ListExecutionsHandler());
    this.registerHandler('execute_workflow', new ExecuteWorkflowHandler());
    this.registerHandler('get_execution', new GetExecutionHandler());
    this.registerHandler('delete_execution', new DeleteExecutionHandler());
    this.registerHandler('retry_execution', new RetryExecutionHandler());
    this.registerHandler('stop_execution', new StopExecutionHandler());
    
    // Credential tools
    this.registerHandler('list_credentials', new ListCredentialsHandler());
    this.registerHandler('create_credential', new CreateCredentialHandler());
    this.registerHandler('get_credential', new GetCredentialHandler());
    this.registerHandler('update_credential', new UpdateCredentialHandler());
    this.registerHandler('delete_credential', new DeleteCredentialHandler());
    this.registerHandler('test_credential', new TestCredentialHandler());
    this.registerHandler('transfer_credential', new TransferCredentialHandler());

    // Tag tools
    this.registerHandler('list_tags', new ListTagsHandler());
    this.registerHandler('get_tag', new GetTagHandler());
    this.registerHandler('create_tag', new CreateTagHandler());
    this.registerHandler('update_tag', new UpdateTagHandler());
    this.registerHandler('delete_tag', new DeleteTagHandler());

    // User tools
    this.registerHandler('list_users', new ListUsersHandler());
    this.registerHandler('get_user', new GetUserHandler());

    // Variable tools
    this.registerHandler('list_variables', new ListVariablesHandler());
    this.registerHandler('get_variable', new GetVariableHandler());
    this.registerHandler('create_variable', new CreateVariableHandler());
    this.registerHandler('update_variable', new UpdateVariableHandler());
    this.registerHandler('delete_variable', new DeleteVariableHandler());
    
    // Upload tools
    this.registerHandler('upload_workflow', new UploadWorkflowHandler());

    // Utility tools
    this.registerHandler('check_connectivity', new CheckConnectivityHandler());
    this.registerHandler('get_health_status', new GetHealthStatusHandler());

    this.logger.info('Tool handlers initialized', {
      totalHandlers: this.handlers.size,
      availableTools: Array.from(this.handlers.keys())
    });
  }

  /**
   * Register a tool handler
   * @param toolName - The name of the tool
   * @param handler - The handler instance
   */
  private registerHandler(toolName: string, handler: any): void {
    this.handlers.set(toolName, handler);
    this.logger.debug('Registered tool handler', { toolName });
  }

  /**
   * Get a tool handler by name
   * @param toolName - The name of the tool
   * @returns The tool handler instance
   */
  getHandler(toolName: string): any {
    const handler = this.handlers.get(toolName);
    if (!handler) {
      throw new N8nMcpError(
        `Tool handler not found: ${toolName}`,
        ErrorCode.ToolNotFound
      );
    }
    return handler;
  }

  /**
   * Execute a tool with the given parameters
   * @param toolName - The name of the tool to execute
   * @param params - The parameters for the tool
   * @returns The tool execution result
   */
  async executeTool(toolName: string, params: any): Promise<any> {
    const logger = this.logger;
    
    try {
      logger.info('Executing tool', { toolName, params });
      
      const handler = this.getHandler(toolName);
      const result = await handler.handle(params);
      
      logger.info('Tool execution completed', { 
        toolName, 
        success: result.success,
        hasData: !!result.data
      });
      
      return result;
      
    } catch (error) {
      logger.error('Tool execution failed', { 
        toolName, 
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof N8nMcpError) {
        throw error;
      }
      
      throw new N8nMcpError(
        `Tool execution failed: ${toolName}`,
        ErrorCode.ToolExecutionError
      );
    }
  }

  /**
   * Get all available tool names
   * @returns Array of available tool names
   */
  getAvailableTools(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Check if a tool exists
   * @param toolName - The name of the tool to check
   * @returns True if the tool exists, false otherwise
   */
  hasTool(toolName: string): boolean {
    return this.handlers.has(toolName);
  }

  /**
   * Get tool handler information
   * @param toolName - The name of the tool
   * @returns Tool handler information
   */
  getToolInfo(toolName: string): any {
    const handler = this.getHandler(toolName);
    return {
      name: toolName,
      handler: handler.constructor.name,
      available: true
    };
  }

  /**
   * Get all tool information
   * @returns Array of tool information
   */
  getAllToolInfo(): any[] {
    return Array.from(this.handlers.keys()).map(toolName => this.getToolInfo(toolName));
  }
} 