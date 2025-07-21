import { z } from 'zod';
import { WorkflowBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { WorkflowUpdateRequest } from '../../types/index.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for update_workflow tool
 */
const UpdateWorkflowInputSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
  name: z.string().min(1).max(255).optional(),
  nodes: z.array(z.any()).optional(),
  connections: z.record(z.any()).optional(),
  settings: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional(),
  description: z.string().optional(),
  meta: z.record(z.any()).optional(),
  versionId: z.string().optional()
      });

type UpdateWorkflowInput = z.infer<typeof UpdateWorkflowInputSchema>;

/**
 * Tool handler for updating existing workflows
 * Handles workflow updates with proper validation and versioning
 */
export class UpdateWorkflowHandler extends WorkflowBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'update',
    description: 'Update an existing update',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the item to update' }
      },
      required: ['id']
    }
  };

  /**
   * Execute the update workflow tool
   */
  async execute(args: Record<string, any>): Promise<any> {
    return this.handle(args as UpdateWorkflowInput);
  }

  /**
   * Updates an existing workflow with the provided changes
   * @param input - The workflow update parameters
   * @returns The updated workflow information
   */
  async handle(input: UpdateWorkflowInput): Promise<any> {
    const logger = this.getLogger('update-workflow');
    
    try {
      // Validate input parameters
      logger.info('Validating workflow update input', { 
        workflowId: input.workflowId,
        hasName: !!input.name,
        hasNodes: !!input.nodes,
        hasConnections: !!input.connections,
        hasSettings: !!input.settings,
        hasTags: !!input.tags,
        hasActive: input.active !== undefined,
        hasDescription: !!input.description,
        hasVersionId: !!input.versionId
      });
      
      const validatedInput = UpdateWorkflowInputSchema.parse(input);
      
      // Check if workflow exists
      logger.info('Checking workflow existence', { workflowId: validatedInput.workflowId });
      
      const existingWorkflow = await this.apiClient.getWorkflow(validatedInput.workflowId);
      
      logger.info('Workflow found, preparing update', { 
        workflowId: existingWorkflow.id,
        workflowName: existingWorkflow.name,
        currentActive: existingWorkflow.active,
        currentNodeCount: existingWorkflow.nodes?.length || 0
      });
      
      // Prepare update data
      const updateData: any = {};
      
      if (validatedInput.name !== undefined) updateData.name = validatedInput.name;
      if (validatedInput.nodes !== undefined) updateData.nodes = validatedInput.nodes;
      if (validatedInput.connections !== undefined) updateData.connections = validatedInput.connections;
      if (validatedInput.settings !== undefined) updateData.settings = validatedInput.settings;
      if (validatedInput.active !== undefined) updateData.active = validatedInput.active;
      if (validatedInput.meta !== undefined) updateData.meta = validatedInput.meta;
      if (validatedInput.versionId !== undefined) updateData.versionId = validatedInput.versionId;
      
      // Handle tags separately
      if (validatedInput.tags !== undefined) {
        updateData.tags = validatedInput.tags.map(tagName => ({ name: tagName }));
      }
      
      logger.info('Updating workflow', { 
        workflowId: validatedInput.workflowId,
        updateFields: Object.keys(updateData),
        willActivate: updateData.active === true,
        willDeactivate: updateData.active === false
      });
      
      // Update the workflow
      const updatedWorkflow = await this.apiClient.updateWorkflow(validatedInput.workflowId, updateData);
      
      logger.info('Workflow updated successfully', { 
        workflowId: updatedWorkflow.id,
        workflowName: updatedWorkflow.name,
        active: updatedWorkflow.active,
        nodeCount: updatedWorkflow.nodes?.length || 0,
        updatedAt: updatedWorkflow.updatedAt
      });
      
      return this.formatSuccess({
        id: updatedWorkflow.id,
        name: updatedWorkflow.name,
        active: updatedWorkflow.active,
        nodes: updatedWorkflow.nodes?.length || 0,
        connections: Object.keys(updatedWorkflow.connections || {}).length,
        settings: updatedWorkflow.settings,
        tags: updatedWorkflow.tags,
        versionId: updatedWorkflow.versionId,
        createdAt: updatedWorkflow.createdAt,
        updatedAt: updatedWorkflow.updatedAt
      });
      
    } catch (error) {
      logger.error('Failed to update workflow', { 
        workflowId: input.workflowId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof N8nMcpError) {
        throw error;
      }
      
      return this.formatError(new N8nMcpError(`Failed to update workflow ${input.workflowId}`, ErrorCode.WorkflowUpdateError
      ));
    }
  }
} 