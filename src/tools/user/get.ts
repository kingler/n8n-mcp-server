import { z } from 'zod';
import { UserBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for get_user tool
 */
const GetUserInputSchema = z.object({
  id: z.string().min(1, 'User ID is required')
      });

type GetUserInput = z.infer<typeof GetUserInputSchema>;

/**
 * Tool handler for getting single user details
 * Retrieves detailed information about a specific user
 */
export class GetUserHandler extends UserBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'get_user',
    description: 'Get detailed information about a specific n8n user',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the user to retrieve'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the get user tool
   * @param input - User retrieval parameters
   * @returns Tool execution result
   */
  async execute(input: GetUserInput) {
    return this.handle(input);
  }

  /**
   * Handle the get user tool
   * @param params - User retrieval parameters
   * @returns User details
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('user');
    
    try {
      logger.info('Getting user details', { userId: params.id });

      // Validate input
      const validatedInput = GetUserInputSchema.parse(params);

      // Get the user
      const user = await this.apiClient.getUser(validatedInput.id);

      const result = {
        success: true,
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          
          
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
      }
      };

      logger.info('User details retrieved successfully', { 
        userId: validatedInput.id,
        userEmail: user.email,
        userRole: user.role
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to get user details', { 
        userId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to get user: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.UserOperationError
      ));
    }
  }
} 