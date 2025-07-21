import { z } from 'zod';
import { VariableBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for delete_variable tool
 */
const DeleteVariableInputSchema = z.object({
  id: z.string().min(1, 'Variable ID is required')
      });

type DeleteVariableInput = z.infer<typeof DeleteVariableInputSchema>;

/**
 * Tool handler for deleting variables
 * Permanently removes an environment variable from n8n
 */
export class DeleteVariableHandler extends VariableBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'delete_variable',
    description: 'Delete an environment variable from n8n permanently',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the variable to delete'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the delete variable tool
   * @param input - Variable deletion parameters
   * @returns Tool execution result
   */
  async execute(input: DeleteVariableInput) {
    return this.handle(input);
  }

  /**
   * Handle the delete variable tool
   * @param params - Variable deletion parameters
   * @returns Deletion result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('variable');
    
    try {
      logger.info('Deleting variable', { variableId: params.id });

      // Validate input
      const validatedInput = DeleteVariableInputSchema.parse(params);

      // Delete the variable
      await this.apiClient.deleteVariable(validatedInput.id);

      const result = {
        success: true,
        data: {
          id: validatedInput.id,
          message: `Variable ${validatedInput.id} has been deleted successfully`
        }
      };

      logger.info('Variable deleted successfully', { 
        variableId: validatedInput.id
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to delete variable', { 
        variableId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to delete variable: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.VariableOperationError
      ));
    }
  }
} 