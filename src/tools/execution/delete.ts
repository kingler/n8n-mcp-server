import { z } from 'zod';
import { ExecutionBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for delete_execution tool
 */
const DeleteExecutionInputSchema = z.object({
  id: z.string().min(1, 'Execution ID is required')
      });

type DeleteExecutionInput = z.infer<typeof DeleteExecutionInputSchema>;

/**
 * Tool handler for deleting executions
 * Permanently removes an execution record from n8n
 */
export class DeleteExecutionHandler extends ExecutionBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'delete_execution',
    description: 'Delete an n8n workflow execution record',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the execution to delete'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the delete execution tool
   * @param input - Execution deletion parameters
   * @returns Tool execution result
   */
  async execute(input: DeleteExecutionInput) {
    return this.handle(input);
  }

  /**
   * Handle the delete execution tool
   * @param params - Execution deletion parameters
   * @returns Deletion result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('execution');
    
    try {
      logger.info('Deleting execution', { executionId: params.id });

      // Validate input
      const validatedInput = DeleteExecutionInputSchema.parse(params);

      // Delete the execution
      await this.apiClient.deleteExecution(validatedInput.id);

      const result = {
        success: true,
        data: {
          id: validatedInput.id,
          message: `Execution ${validatedInput.id} has been deleted successfully`
        }
      };

      logger.info('Execution deleted successfully', { 
        executionId: validatedInput.id
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to delete execution', { 
        executionId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to delete execution: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.ExecutionOperationError
      ));
    }
  }
} 