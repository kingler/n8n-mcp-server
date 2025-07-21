import { z } from 'zod';
import { UserBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for list_users tool
 */
const ListUsersInputSchema = z.object({
  limit: z.number().int().positive().max(1000).optional().default(100),
  offset: z.number().int().min(0).optional().default(0)
});

type ListUsersInput = z.infer<typeof ListUsersInputSchema>;

/**
 * Tool handler for listing users
 * Retrieves a list of users in n8n
 */
export class ListUsersHandler extends UserBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'list_users',
    description: 'List all users in n8n',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of users to return (default: 100, max: 1000)',
          minimum: 1,
          maximum: 1000
        },
        offset: {
          type: 'number',
          description: 'Number of users to skip (default: 0)',
          minimum: 0
        }
      }
    }
  };

  /**
   * Execute the list users tool
   * @param input - User listing parameters
   * @returns Tool execution result
   */
  async execute(input: ListUsersInput) {
    return this.handle(input);
  }

  /**
   * Handle the list users tool
   * @param params - User listing parameters
   * @returns User list
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('user');
    
    try {
      logger.info('Listing users', { 
        limit: params.limit,
        offset: params.offset
      });

      // Validate input
      const validatedInput = ListUsersInputSchema.parse(params);

      // Get users from API
      const users = await this.apiClient.getUsers();

      // Apply pagination
      const startIndex = validatedInput.offset;
      const endIndex = startIndex + validatedInput.limit;
      const paginatedUsers = users.slice(startIndex, endIndex);

      const result = {
        success: true,
        data: {
          users: paginatedUsers.map(user => ({
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            
            
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          })),
          totalCount: users.length,
          limit: validatedInput.limit,
          offset: validatedInput.offset,
          hasMore: endIndex < users.length
        }
      };

      logger.info('Users listed successfully', { 
        totalUsers: users.length,
        returnedUsers: paginatedUsers.length,
        limit: validatedInput.limit,
        offset: validatedInput.offset
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to list users', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to list users: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.UserOperationError
      ));
    }
  }
} 