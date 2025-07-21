import { z } from 'zod';
import { ExecutionBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for stop_execution tool
 */
const StopExecutionInputSchema = z.object({
  id: z.string().min(1, 'Execution ID is required')
      });

type StopExecutionInput = z.infer<typeof StopExecutionInputSchema>;

/**
 * Tool handler for stopping executions
 * Stops a currently running workflow execution
 */
export class StopExecutionHandler extends ExecutionBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'stop_execution',
    description: 'Stop a currently running n8n workflow execution',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the execution to stop'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the stop execution tool
   * @param input - Execution stop parameters
   * @returns Tool execution result
   */
  async execute(input: StopExecutionInput) {
    return this.handle(input);
  }

  /**
   * Handle the stop execution tool
   * @param params - Execution stop parameters
   * @returns Stop result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('execution');
    
    try {
      logger.info('Stopping execution', { executionId: params.id });

      // Validate input
      const validatedInput = StopExecutionInputSchema.parse(params);

      // Stop the execution
      const stoppedExecution = await this.apiClient.stopExecution(validatedInput.id);

      const result = {
        success: true,
        data: {
          id: stoppedExecution.id,
          status: stoppedExecution.status,
          mode: stoppedExecution.mode,
          startedAt: stoppedExecution.startedAt,
          stoppedAt: stoppedExecution.stoppedAt,
          workflowId: stoppedExecution.workflowId,
          finished: stoppedExecution.finished,
          message: `Execution ${validatedInput.id} has been stopped successfully`
        }
      };

      logger.info('Execution stopped successfully', { 
        executionId: validatedInput.id,
        status: stoppedExecution.status,
        stoppedAt: stoppedExecution.stoppedAt
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to stop execution', { 
        executionId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to stop execution: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.ExecutionOperationError
      ));
    }
  }
} 