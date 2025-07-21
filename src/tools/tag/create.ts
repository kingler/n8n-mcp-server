import { z } from 'zod';
import { TagBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for create_tag tool
 */
const CreateTagInputSchema = z.object({
  name: z.string().min(1, 'Tag name is required').max(255, 'Tag name too long')
});

type CreateTagInput = z.infer<typeof CreateTagInputSchema>;

/**
 * Tool handler for creating tags
 * Creates a new tag in n8n
 */
export class CreateTagHandler extends TagBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'create_tag',
    description: 'Create a new tag in n8n',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Name of the tag to create',
          minLength: 1,
          maxLength: 255
        }
      },
      required: ['name']
    }
  };

  /**
   * Execute the create tag tool
   * @param input - Tag creation parameters
   * @returns Tool execution result
   */
  async execute(input: CreateTagInput) {
    return this.handle(input);
  }

  /**
   * Handle the create tag tool
   * @param params - Tag creation parameters
   * @returns Creation result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('tag');
    
    try {
      logger.info('Creating tag', { tagName: params.name });

      // Validate input
      const validatedInput = CreateTagInputSchema.parse(params);

      // Create the tag
      const createdTag = await this.apiClient.createTag({
        name: validatedInput.name
      });

      const result = {
        success: true,
        data: {
          id: createdTag.id,
          name: createdTag.name,
          createdAt: createdTag.createdAt,
          updatedAt: createdTag.updatedAt,
          message: `Tag "${createdTag.name}" has been created successfully`
        }
      };

      logger.info('Tag created successfully', { 
        tagId: createdTag.id,
        tagName: createdTag.name
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to create tag', { 
        tagName: params.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to create tag: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.TagOperationError
      ));
    }
  }
} 