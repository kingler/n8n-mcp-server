import { z } from 'zod';
import { WorkflowBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for delete_workflow tool
 */
const DeleteWorkflowInputSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
  force: z.boolean().optional().default(false), // Force delete even if active
  deleteExecutions: z.boolean().optional().default(false), // Delete associated executions
  deleteCredentials: z.boolean().optional().default(false), // Delete associated credentials
});

type DeleteWorkflowInput = z.infer<typeof DeleteWorkflowInputSchema>;

/**
 * Tool handler for deleting workflows
 * Handles workflow deletion with safety checks and cleanup options
 */
export class DeleteWorkflowHandler extends WorkflowBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'delete',
    description: 'Delete a delete',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the item to delete' }
      },
      required: ['id']
    }
  };

  /**
   * Execute the delete workflow tool
   */
  async execute(args: Record<string, any>): Promise<any> {
    return this.handle(args as DeleteWorkflowInput);
  }

  /**
   * Deletes a workflow with optional cleanup of related resources
   * @param input - The workflow deletion parameters
   * @returns The deletion result
   */
  async handle(input: DeleteWorkflowInput): Promise<any> {
    const logger = this.getLogger('delete-workflow');
    
    try {
      // Validate input parameters
      logger.info('Validating workflow deletion input', { 
        workflowId: input.workflowId,
        force: input.force,
        deleteExecutions: input.deleteExecutions,
        deleteCredentials: input.deleteCredentials
      });
      
      const validatedInput = DeleteWorkflowInputSchema.parse(input);
      
      // Check if workflow exists and get its details
      logger.info('Checking workflow existence before deletion', { workflowId: validatedInput.workflowId });
      
      const workflowToDelete = await this.apiClient.getWorkflow(validatedInput.workflowId);
      
      logger.info('Workflow found, checking deletion requirements', { 
        workflowId: workflowToDelete.id,
        workflowName: workflowToDelete.name,
        active: workflowToDelete.active,
        nodeCount: workflowToDelete.nodes?.length || 0,
        executionCount: workflowToDelete.executions?.length || 0
      });
      
      // Check if workflow is active and force flag is required
      if (workflowToDelete.active && !validatedInput.force) {
        return this.formatError(new N8nMcpError(`Cannot delete active workflow "${workflowToDelete.name}" without force flag`, ErrorCode.WorkflowDeletionError
        ));
      }
      
      // Prepare deletion options
      const deleteOptions: any = {
        force: validatedInput.force,
        deleteExecutions: validatedInput.deleteExecutions,
        deleteCredentials: validatedInput.deleteCredentials
      };
      
      logger.info('Deleting workflow', { 
        workflowId: validatedInput.workflowId,
        workflowName: workflowToDelete.name,
        deleteOptions,
        willDeleteExecutions: validatedInput.deleteExecutions,
        willDeleteCredentials: validatedInput.deleteCredentials
      });
      
      // Delete the workflow
      await this.apiClient.deleteWorkflow(validatedInput.workflowId, deleteOptions);
      
      logger.info('Workflow deleted successfully', { 
        workflowId: validatedInput.workflowId,
        workflowName: workflowToDelete.name,
        deletedAt: new Date().toISOString()
      });
      
      return this.formatSuccess({
        deletedWorkflow: {
          id: workflowToDelete.id,
          name: workflowToDelete.name,
          active: workflowToDelete.active,
          nodeCount: workflowToDelete.nodes?.length || 0,
          executionCount: workflowToDelete.executions?.length || 0,
          createdAt: workflowToDelete.createdAt,
          updatedAt: workflowToDelete.updatedAt
        },
        deletionOptions: deleteOptions,
        deletedAt: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('Failed to delete workflow', { 
        workflowId: input.workflowId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof N8nMcpError) {
        throw error;
      }
      
      return this.formatError(new N8nMcpError(`Failed to delete workflow ${input.workflowId}`, ErrorCode.WorkflowDeletionError
      ));
    }
  }
} 