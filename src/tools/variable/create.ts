import { z } from 'zod';
import { VariableBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for create_variable tool
 */
const CreateVariableInputSchema = z.object({
  key: z.string().min(1, 'Variable key is required').max(255, 'Variable key too long'),
  value: z.string(),
  type: z.enum(['string', 'number', 'boolean', 'json']).optional().default('string'),
  description: z.string().optional()
});

type CreateVariableInput = z.infer<typeof CreateVariableInputSchema>;

/**
 * Tool handler for creating variables
 * Creates a new environment variable in n8n
 */
export class CreateVariableHandler extends VariableBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'create_variable',
    description: 'Create a new environment variable in n8n',
    inputSchema: {
      type: 'object',
      properties: {
        key: {
          type: 'string',
          description: 'Key name for the variable',
          minLength: 1,
          maxLength: 255
        },
        value: {
          type: 'string',
          description: 'Value of the variable'
        },
        type: {
          type: 'string',
          enum: ['string', 'number', 'boolean', 'json'],
          description: 'Type of the variable (default: string)'
        },
        description: {
          type: 'string',
          description: 'Optional description for the variable'
        }
      },
      required: ['key', 'value']
    }
  };

  /**
   * Execute the create variable tool
   * @param input - Variable creation parameters
   * @returns Tool execution result
   */
  async execute(input: CreateVariableInput) {
    return this.handle(input);
  }

  /**
   * Handle the create variable tool
   * @param params - Variable creation parameters
   * @returns Creation result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('variable');
    
    try {
      logger.info('Creating variable', { 
        variableKey: params.key,
        variableType: params.type 
      });

      // Validate input
      const validatedInput = CreateVariableInputSchema.parse(params);

      // Create the variable
      const createdVariable = await this.apiClient.createVariable({
        key: validatedInput.key,
        value: validatedInput.value
      });

      const result = {
        success: true,
        data: {
          id: createdVariable.id,
          key: createdVariable.key,
          value: createdVariable.value,
          message: `Variable "${createdVariable.key}" has been created successfully`
        }
      };

      logger.info('Variable created successfully', { 
        variableId: createdVariable.id,
        variableKey: createdVariable.key
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to create variable', { 
        variableKey: params.key,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to create variable: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.VariableOperationError
      ));
    }
  }
} 