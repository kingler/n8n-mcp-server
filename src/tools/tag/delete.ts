import { z } from 'zod';
import { TagBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for delete_tag tool
 */
const DeleteTagInputSchema = z.object({
  id: z.string().min(1, 'Tag ID is required')
      });

type DeleteTagInput = z.infer<typeof DeleteTagInputSchema>;

/**
 * Tool handler for deleting tags
 * Permanently removes a tag from n8n
 */
export class DeleteTagHandler extends TagBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'delete_tag',
    description: 'Delete an n8n tag permanently',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the tag to delete'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the delete tag tool
   * @param input - Tag deletion parameters
   * @returns Tool execution result
   */
  async execute(input: DeleteTagInput) {
    return this.handle(input);
  }

  /**
   * Handle the delete tag tool
   * @param params - Tag deletion parameters
   * @returns Deletion result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('tag');
    
    try {
      logger.info('Deleting tag', { tagId: params.id });

      // Validate input
      const validatedInput = DeleteTagInputSchema.parse(params);

      // Delete the tag
      await this.apiClient.deleteTag(validatedInput.id);

      const result = {
        success: true,
        data: {
          id: validatedInput.id,
          message: `Tag ${validatedInput.id} has been deleted successfully`
        }
      };

      logger.info('Tag deleted successfully', { 
        tagId: validatedInput.id
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to delete tag', { 
        tagId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to delete tag: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.TagOperationError
      ));
    }
  }
} 