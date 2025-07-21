import { z } from 'zod';
import { VariableBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for list_variables tool
 */
const ListVariablesInputSchema = z.object({
  limit: z.number().int().positive().max(1000).optional().default(100),
  offset: z.number().int().min(0).optional().default(0)
});

type ListVariablesInput = z.infer<typeof ListVariablesInputSchema>;

/**
 * Tool handler for listing variables
 * Retrieves a list of environment variables in n8n
 */
export class ListVariablesHandler extends VariableBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'list_variables',
    description: 'List all environment variables in n8n',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of variables to return (default: 100, max: 1000)',
          minimum: 1,
          maximum: 1000
        },
        offset: {
          type: 'number',
          description: 'Number of variables to skip (default: 0)',
          minimum: 0
        }
      }
    }
  };

  /**
   * Execute the list variables tool
   * @param input - Variable listing parameters
   * @returns Tool execution result
   */
  async execute(input: ListVariablesInput) {
    return this.handle(input);
  }

  /**
   * Handle the list variables tool
   * @param params - Variable listing parameters
   * @returns Variable list
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('variable');
    
    try {
      logger.info('Listing variables', { 
        limit: params.limit,
        offset: params.offset
      });

      // Validate input
      const validatedInput = ListVariablesInputSchema.parse(params);

      // Get variables from API
      const variables = await this.apiClient.getVariables();

      // Apply pagination
      const startIndex = validatedInput.offset;
      const endIndex = startIndex + validatedInput.limit;
      const paginatedVariables = variables.slice(startIndex, endIndex);

      const result = {
        success: true,
        data: {
          variables: paginatedVariables.map(variable => ({
            id: variable.id,
            key: variable.key
      })),
          totalCount: variables.length,
          limit: validatedInput.limit,
          offset: validatedInput.offset,
          hasMore: endIndex < variables.length
        }
      };

      logger.info('Variables listed successfully', { 
        totalVariables: variables.length,
        returnedVariables: paginatedVariables.length,
        limit: validatedInput.limit,
        offset: validatedInput.offset
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to list variables', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to list variables: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.VariableOperationError
      ));
    }
  }
} 