import { z } from 'zod';
import { WorkflowBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for activate_workflow tool
 */
const ActivateWorkflowInputSchema = z.object({
  id: z.string().min(1, 'Workflow ID is required')
      });

type ActivateWorkflowInput = z.infer<typeof ActivateWorkflowInputSchema>;

/**
 * Tool handler for activating workflows
 * Sets the workflow to active state for execution
 */
export class ActivateWorkflowHandler extends WorkflowBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'activate_workflow',
    description: 'Activate an n8n workflow to enable execution',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the workflow to activate'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the activate workflow tool
   * @param input - Workflow activation parameters
   * @returns Tool execution result
   */
  async execute(input: ActivateWorkflowInput) {
    return this.handle(input);
  }

  /**
   * Handle the activate workflow tool
   * @param params - Workflow activation parameters
   * @returns Activation result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('workflow');
    
    try {
      logger.info('Activating workflow', { workflowId: params.id });

      // Validate input
      const validatedInput = ActivateWorkflowInputSchema.parse(params);

      // Activate the workflow
      const activatedWorkflow = await this.apiClient.activateWorkflow(validatedInput.id);

      const result = {
        id: activatedWorkflow.id,
        name: activatedWorkflow.name,
        active: activatedWorkflow.active,
        message: `Workflow "${activatedWorkflow.name}" has been activated`
      };

      logger.info('Workflow activated successfully', { 
        workflowId: validatedInput.id,
        workflowName: activatedWorkflow.name
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to activate workflow', { 
        workflowId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return this.formatError(error instanceof Error ? error : new N8nMcpError(
        `Failed to activate workflow: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.WorkflowOperationError
      ));
    }
  }
} 