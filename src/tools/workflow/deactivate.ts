import { z } from 'zod';
import { WorkflowBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for deactivate_workflow tool
 */
const DeactivateWorkflowInputSchema = z.object({
  id: z.string().min(1, 'Workflow ID is required')
      });

type DeactivateWorkflowInput = z.infer<typeof DeactivateWorkflowInputSchema>;

/**
 * Tool handler for deactivating workflows
 * Sets the workflow to inactive state to prevent execution
 */
export class DeactivateWorkflowHandler extends WorkflowBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'deactivate_workflow',
    description: 'Deactivate an n8n workflow to prevent execution',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the workflow to deactivate'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the deactivate workflow tool
   * @param input - Workflow deactivation parameters
   * @returns Tool execution result
   */
  async execute(input: DeactivateWorkflowInput) {
    return this.handle(input);
  }

  /**
   * Handle the deactivate workflow tool
   * @param params - Workflow deactivation parameters
   * @returns Deactivation result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('workflow');
    
    try {
      logger.info('Deactivating workflow', { workflowId: params.id });

      // Validate input
      const validatedInput = DeactivateWorkflowInputSchema.parse(params);

      // Deactivate the workflow
      const deactivatedWorkflow = await this.apiClient.deactivateWorkflow(validatedInput.id);

      const result = {
        success: true,
        data: {
          id: deactivatedWorkflow.id,
          name: deactivatedWorkflow.name,
          active: deactivatedWorkflow.active,
          message: `Workflow "${deactivatedWorkflow.name}" has been deactivated`
        }
      };

      logger.info('Workflow deactivated successfully', { 
        workflowId: validatedInput.id,
        workflowName: deactivatedWorkflow.name
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to deactivate workflow', { 
        workflowId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to deactivate workflow: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.WorkflowOperationError
      ));
    }
  }
} 