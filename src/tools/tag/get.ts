import { z } from 'zod';
import { TagBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for get_tag tool
 */
const GetTagInputSchema = z.object({
  id: z.string().min(1, 'Tag ID is required')
      });

type GetTagInput = z.infer<typeof GetTagInputSchema>;

/**
 * Tool handler for getting single tag details
 * Retrieves detailed information about a specific tag
 */
export class GetTagHandler extends TagBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'get_tag',
    description: 'Get detailed information about a specific n8n tag',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the tag to retrieve'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the get tag tool
   * @param input - Tag retrieval parameters
   * @returns Tool execution result
   */
  async execute(input: GetTagInput) {
    return this.handle(input);
  }

  /**
   * Handle the get tag tool
   * @param params - Tag retrieval parameters
   * @returns Tag details
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('tag');
    
    try {
      logger.info('Getting tag details', { tagId: params.id });

      // Validate input
      const validatedInput = GetTagInputSchema.parse(params);

      // Get the tag
      const tag = await this.apiClient.getTag(validatedInput.id);

      const result = {
        success: true,
        data: {
          id: tag.id,
          name: tag.name,
          createdAt: tag.createdAt,
          updatedAt: tag.updatedAt
        }
      };

      logger.info('Tag details retrieved successfully', { 
        tagId: validatedInput.id,
        tagName: tag.name
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to get tag details', { 
        tagId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to get tag: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.TagOperationError
      ));
    }
  }
} 