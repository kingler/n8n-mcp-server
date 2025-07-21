import { z } from 'zod';
import { VariableBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for get_variable tool
 */
const GetVariableInputSchema = z.object({
  id: z.string().min(1, 'Variable ID is required')
      });

type GetVariableInput = z.infer<typeof GetVariableInputSchema>;

/**
 * Tool handler for getting single variable details
 * Retrieves detailed information about a specific environment variable
 */
export class GetVariableHandler extends VariableBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'get_variable',
    description: 'Get detailed information about a specific n8n environment variable',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the variable to retrieve'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the get variable tool
   * @param input - Variable retrieval parameters
   * @returns Tool execution result
   */
  async execute(input: GetVariableInput) {
    return this.handle(input);
  }

  /**
   * Handle the get variable tool
   * @param params - Variable retrieval parameters
   * @returns Variable details
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('variable');
    
    try {
      logger.info('Getting variable details', { variableId: params.id });

      // Validate input
      const validatedInput = GetVariableInputSchema.parse(params);

      // Get the variable
      const variable = await this.apiClient.getVariable(validatedInput.id);

      const result = {
        success: true,
        data: {
          id: variable.id,
          key: variable.key,
          value: variable.value
      }
      };

      logger.info('Variable details retrieved successfully', { 
        variableId: validatedInput.id,
        variableKey: variable.key,
        });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to get variable details', { 
        variableId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to get variable: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.VariableOperationError
      ));
    }
  }
} 