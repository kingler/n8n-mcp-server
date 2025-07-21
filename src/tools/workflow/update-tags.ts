import { z } from 'zod';
import { WorkflowBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for update_workflow_tags tool
 */
const UpdateWorkflowTagsInputSchema = z.object({
  id: z.string().min(1, 'Workflow ID is required'),
  tags: z.array(z.string()).default([])
});

type UpdateWorkflowTagsInput = z.infer<typeof UpdateWorkflowTagsInputSchema>;

/**
 * Tool handler for updating workflow tags
 * Updates the tags associated with a workflow
 */
export class UpdateWorkflowTagsHandler extends WorkflowBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'update_workflow_tags',
    description: 'Update tags for an n8n workflow',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the workflow to update tags for'
        },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Array of tag names to assign to the workflow'
        }
      },
      required: ['id', 'tags']
    }
  };

  /**
   * Execute the update workflow tags tool
   * @param input - Workflow tag update parameters
   * @returns Tool execution result
   */
  async execute(input: UpdateWorkflowTagsInput) {
    return this.handle(input);
  }

  /**
   * Handle the update workflow tags tool
   * @param params - Workflow tag update parameters
   * @returns Update result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('workflow');
    
    try {
      logger.info('Updating workflow tags', { 
        workflowId: params.id,
        tags: params.tags 
      });

      // Validate input
      const validatedInput = UpdateWorkflowTagsInputSchema.parse(params);

      // Update workflow tags
      const updatedWorkflow = await this.apiClient.updateWorkflowTags(
        validatedInput.id, 
        validatedInput.tags
      );

      const result = {
        success: true,
        data: {
          id: updatedWorkflow.id,
          name: updatedWorkflow.name,
          tags: updatedWorkflow.tags || [],
          message: `Tags updated for workflow "${updatedWorkflow.name}"`
        }
      };

      logger.info('Workflow tags updated successfully', { 
        workflowId: validatedInput.id,
        workflowName: updatedWorkflow.name,
        updatedTags: updatedWorkflow.tags
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to update workflow tags', { 
        workflowId: params.id,
        tags: params.tags,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to update workflow tags: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.WorkflowOperationError
      ));
    }
  }
} 