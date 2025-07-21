import { z } from 'zod';
import { ExecutionBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for retry_execution tool
 */
const RetryExecutionInputSchema = z.object({
  id: z.string().min(1, 'Execution ID is required')
      });

type RetryExecutionInput = z.infer<typeof RetryExecutionInputSchema>;

/**
 * Tool handler for retrying executions
 * Retries a failed or stopped workflow execution
 */
export class RetryExecutionHandler extends ExecutionBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'retry_execution',
    description: 'Retry a failed or stopped n8n workflow execution',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the execution to retry'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the retry execution tool
   * @param input - Execution retry parameters
   * @returns Tool execution result
   */
  async execute(input: RetryExecutionInput) {
    return this.handle(input);
  }

  /**
   * Handle the retry execution tool
   * @param params - Execution retry parameters
   * @returns Retry result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('execution');
    
    try {
      logger.info('Retrying execution', { executionId: params.id });

      // Validate input
      const validatedInput = RetryExecutionInputSchema.parse(params);

      // Retry the execution
      const retriedExecution = await this.apiClient.retryExecution(validatedInput.id);

      const result = {
        success: true,
        data: {
          id: retriedExecution.id,
          originalExecutionId: validatedInput.id,
          status: retriedExecution.status,
          mode: retriedExecution.mode,
          startedAt: retriedExecution.startedAt,
          workflowId: retriedExecution.workflowId,
          retryOf: retriedExecution.retryOf,
          message: `Execution ${validatedInput.id} has been retried with new execution ID ${retriedExecution.id}`
        }
      };

      logger.info('Execution retried successfully', { 
        originalExecutionId: validatedInput.id,
        newExecutionId: retriedExecution.id,
        status: retriedExecution.status
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to retry execution', { 
        executionId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to retry execution: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.ExecutionOperationError
      ));
    }
  }
} 