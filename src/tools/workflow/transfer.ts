import { z } from 'zod';
import { WorkflowBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for transfer_workflow tool
 */
const TransferWorkflowInputSchema = z.object({
  id: z.string().min(1, 'Workflow ID is required'),
  userId: z.string().min(1, 'User ID is required')
});

type TransferWorkflowInput = z.infer<typeof TransferWorkflowInputSchema>;

/**
 * Tool handler for transferring workflow ownership
 * Transfers ownership of a workflow to another user
 */
export class TransferWorkflowHandler extends WorkflowBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'transfer_workflow',
    description: 'Transfer ownership of an n8n workflow to another user',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the workflow to transfer'
        },
        userId: {
          type: 'string',
          description: 'ID of the user to transfer the workflow to'
        }
      },
      required: ['id', 'userId']
    }
  };

  /**
   * Execute the transfer workflow tool
   * @param input - Workflow transfer parameters
   * @returns Tool execution result
   */
  async execute(input: TransferWorkflowInput) {
    return this.handle(input);
  }

  /**
   * Handle the transfer workflow tool
   * @param params - Workflow transfer parameters
   * @returns Transfer result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('workflow');
    
    try {
      logger.info('Transferring workflow ownership', { 
        workflowId: params.id,
        targetUserId: params.userId 
      });

      // Validate input
      const validatedInput = TransferWorkflowInputSchema.parse(params);

      // Transfer workflow ownership
      const transferredWorkflow = await this.apiClient.transferWorkflow(
        validatedInput.id, 
        validatedInput.userId
      );

      const result = {
        success: true,
        data: {
          id: transferredWorkflow.id,
          name: transferredWorkflow.name,
          message: `Workflow "${transferredWorkflow.name}" has been transferred to user ${validatedInput.userId}`
        }
      };

      logger.info('Workflow transferred successfully', { 
        workflowId: validatedInput.id,
        workflowName: transferredWorkflow.name
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to transfer workflow', { 
        workflowId: params.id,
        targetUserId: params.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to transfer workflow: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.WorkflowOperationError
      ));
    }
  }
} 