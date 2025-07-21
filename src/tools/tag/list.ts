import { z } from 'zod';
import { TagBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for list_tags tool
 */
const ListTagsInputSchema = z.object({
  limit: z.number().int().positive().max(1000).optional().default(100),
  offset: z.number().int().min(0).optional().default(0)
});

type ListTagsInput = z.infer<typeof ListTagsInputSchema>;

/**
 * Tool handler for listing tags
 * Retrieves a list of available tags in n8n
 */
export class ListTagsHandler extends TagBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'list_tags',
    description: 'List all available tags in n8n',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: 'Maximum number of tags to return (default: 100, max: 1000)',
          minimum: 1,
          maximum: 1000
        },
        offset: {
          type: 'number',
          description: 'Number of tags to skip (default: 0)',
          minimum: 0
        }
      }
    }
  };

  /**
   * Execute the list tags tool
   * @param input - Tag listing parameters
   * @returns Tool execution result
   */
  async execute(input: ListTagsInput) {
    return this.handle(input);
  }

  /**
   * Handle the list tags tool
   * @param params - Tag listing parameters
   * @returns Tag list
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('tag');
    
    try {
      logger.info('Listing tags', { 
        limit: params.limit,
        offset: params.offset
      });

      // Validate input
      const validatedInput = ListTagsInputSchema.parse(params);

      // Get tags from API
      const tags = await this.apiClient.getTags();

      // Apply pagination
      const startIndex = validatedInput.offset;
      const endIndex = startIndex + validatedInput.limit;
      const paginatedTags = tags.slice(startIndex, endIndex);

      const result = {
        success: true,
        data: {
          tags: paginatedTags.map(tag => ({
            id: tag.id,
            name: tag.name,
            createdAt: tag.createdAt,
            updatedAt: tag.updatedAt
          })),
          totalCount: tags.length,
          limit: validatedInput.limit,
          offset: validatedInput.offset,
          hasMore: endIndex < tags.length
        }
      };

      logger.info('Tags listed successfully', { 
        totalTags: tags.length,
        returnedTags: paginatedTags.length,
        limit: validatedInput.limit,
        offset: validatedInput.offset
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to list tags', { 
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to list tags: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.TagOperationError
      ));
    }
  }
} 