import { z } from 'zod';
import { ExecutionBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for get_execution tool
 */
const GetExecutionInputSchema = z.object({
  id: z.string().min(1, 'Execution ID is required')
      });

type GetExecutionInput = z.infer<typeof GetExecutionInputSchema>;

/**
 * Tool handler for getting single execution details
 * Retrieves detailed information about a specific workflow execution
 */
export class GetExecutionHandler extends ExecutionBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'get_execution',
    description: 'Get detailed information about a specific n8n workflow execution',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the execution to retrieve'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the get execution tool
   * @param input - Execution retrieval parameters
   * @returns Tool execution result
   */
  async execute(input: GetExecutionInput) {
    return this.handle(input);
  }

  /**
   * Handle the get execution tool
   * @param params - Execution retrieval parameters
   * @returns Execution details
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('execution');
    
    try {
      logger.info('Getting execution details', { executionId: params.id });

      // Validate input
      const validatedInput = GetExecutionInputSchema.parse(params);

      // Get the execution
      const execution = await this.apiClient.getExecution(validatedInput.id);

      const result = {
        success: true,
        data: {
          id: execution.id,
          workflowId: execution.workflowId,
          status: execution.status,
          mode: execution.mode,
          startedAt: execution.startedAt,
          stoppedAt: execution.stoppedAt,
          finished: execution.finished,
          retryOf: execution.retryOf,
          retrySuccessId: execution.retrySuccessId,
          data: execution.data
      }
      };

      logger.info('Execution details retrieved successfully', { 
        executionId: validatedInput.id,
        status: execution.status,
        workflowId: execution.workflowId
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to get execution details', { 
        executionId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to get execution: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.ExecutionOperationError
      ));
    }
  }
} 