import { z } from 'zod';
import { TagBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for update_tag tool
 */
const UpdateTagInputSchema = z.object({
  id: z.string().min(1, 'Tag ID is required'),
  name: z.string().min(1, 'Tag name is required').max(255, 'Tag name too long')
});

type UpdateTagInput = z.infer<typeof UpdateTagInputSchema>;

/**
 * Tool handler for updating tags
 * Updates an existing tag with new information
 */
export class UpdateTagHandler extends TagBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'update_tag',
    description: 'Update an existing n8n tag',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the tag to update'
        },
        name: {
          type: 'string',
          description: 'New name for the tag',
          minLength: 1,
          maxLength: 255
        }
      },
      required: ['id', 'name']
    }
  };

  /**
   * Execute the update tag tool
   * @param input - Tag update parameters
   * @returns Tool execution result
   */
  async execute(input: UpdateTagInput) {
    return this.handle(input);
  }

  /**
   * Handle the update tag tool
   * @param params - Tag update parameters
   * @returns Update result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('tag');
    
    try {
      logger.info('Updating tag', { 
        tagId: params.id,
        newName: params.name
      });

      // Validate input
      const validatedInput = UpdateTagInputSchema.parse(params);

      // Update the tag
      const updatedTag = await this.apiClient.updateTag(validatedInput.id, {
        name: validatedInput.name
      });

      const result = {
        success: true,
        data: {
          id: updatedTag.id,
          name: updatedTag.name,
          createdAt: updatedTag.createdAt,
          updatedAt: updatedTag.updatedAt,
          message: `Tag "${updatedTag.name}" has been updated successfully`
        }
      };

      logger.info('Tag updated successfully', { 
        tagId: validatedInput.id,
        tagName: updatedTag.name
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to update tag', { 
        tagId: params.id,
        newName: params.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to update tag: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.TagOperationError
      ));
    }
  }
} 