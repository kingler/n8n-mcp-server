import { z } from 'zod';
import { VariableBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for update_variable tool
 */
const UpdateVariableInputSchema = z.object({
  id: z.string().min(1, 'Variable ID is required'),
  key: z.string().min(1, 'Variable key is required').max(255, 'Variable key too long').optional(),
  value: z.string().optional(),
  type: z.enum(['string', 'number', 'boolean', 'json']).optional(),
  description: z.string().optional()
});

type UpdateVariableInput = z.infer<typeof UpdateVariableInputSchema>;

/**
 * Tool handler for updating variables
 * Updates an existing environment variable
 */
export class UpdateVariableHandler extends VariableBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'update_variable',
    description: 'Update an existing environment variable in n8n',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the variable to update'
        },
        key: {
          type: 'string',
          description: 'New key name for the variable',
          minLength: 1,
          maxLength: 255
        },
        value: {
          type: 'string',
          description: 'New value of the variable'
        },
        type: {
          type: 'string',
          enum: ['string', 'number', 'boolean', 'json'],
          description: 'Type of the variable'
        },
        description: {
          type: 'string',
          description: 'New description for the variable'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the update variable tool
   * @param input - Variable update parameters
   * @returns Tool execution result
   */
  async execute(input: UpdateVariableInput) {
    return this.handle(input);
  }

  /**
   * Handle the update variable tool
   * @param params - Variable update parameters
   * @returns Update result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('variable');
    
    try {
      logger.info('Updating variable', { 
        variableId: params.id,
        newKey: params.key
      });

      // Validate input
      const validatedInput = UpdateVariableInputSchema.parse(params);

      // Prepare update data
      const updateData: any = {};
      if (validatedInput.key) updateData.key = validatedInput.key;
      if (validatedInput.value !== undefined) updateData.value = validatedInput.value;
      if (validatedInput.type) updateData.type = validatedInput.type;
      if (validatedInput.description !== undefined) updateData.description = validatedInput.description;

      // Update the variable
      const updatedVariable = await this.apiClient.updateVariable(
        validatedInput.id,
        updateData
      );

      const result = {
        success: true,
        data: {
          id: updatedVariable.id,
          key: updatedVariable.key,
          value: updatedVariable.value,
          message: `Variable "${updatedVariable.key}" has been updated successfully`
        }
      };

      logger.info('Variable updated successfully', { 
        variableId: validatedInput.id,
        variableKey: updatedVariable.key
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to update variable', { 
        variableId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to update variable: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.VariableOperationError
      ));
    }
  }
} 