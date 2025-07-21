import { z } from 'zod';
import { WorkflowBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { WorkflowCreateRequest } from '../../types/index.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for create_workflow tool
 */
const CreateWorkflowInputSchema = z.object({
  name: z.string().min(1, 'Workflow name is required').max(255, 'Workflow name too long'),
  nodes: z.array(z.any()).optional().default([]),
  connections: z.record(z.any()).optional().default({}),
  settings: z.record(z.any()).optional().default({}),
  tags: z.array(z.string()).optional().default([]),
  active: z.boolean().optional().default(false),
  description: z.string().optional(),
  meta: z.record(z.any()).optional().default({})
      });

type CreateWorkflowInput = z.infer<typeof CreateWorkflowInputSchema>;

/**
 * Tool handler for creating new workflows
 * Handles workflow creation with proper validation and setup
 */
export class CreateWorkflowHandler extends WorkflowBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'create',
    description: 'Create a new create',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Name of the item' }
      },
      required: ['name']
    }
  };

  /**
   * Execute the create workflow tool
   */
  async execute(args: Record<string, any>): Promise<any> {
    return this.handle(args as CreateWorkflowInput);
  }

  /**
   * Creates a new workflow with the provided configuration
   * @param input - The workflow creation parameters
   * @returns The created workflow information
   */
  async handle(input: CreateWorkflowInput): Promise<any> {
    const logger = this.getLogger('create-workflow');
    
    try {
      // Validate input parameters
      logger.info('Validating workflow creation input', { 
        name: input.name,
        nodeCount: input.nodes?.length || 0,
        hasConnections: !!input.connections && Object.keys(input.connections).length > 0,
        hasSettings: !!input.settings && Object.keys(input.settings).length > 0,
        tagCount: input.tags?.length || 0,
        active: input.active,
        hasDescription: !!input.description
      });
      
      const validatedInput = CreateWorkflowInputSchema.parse(input);
      
      // Prepare workflow creation request
      const workflowData: any = {
        name: validatedInput.name,
        nodes: validatedInput.nodes,
        connections: validatedInput.connections,
        settings: validatedInput.settings,
        active: validatedInput.active,
        meta: validatedInput.meta
      };
      
      // Add tags if provided
      if (validatedInput.tags && validatedInput.tags.length > 0) {
        workflowData.tags = validatedInput.tags.map(tagName => ({ name: tagName }));
      }
      
      logger.info('Creating workflow', { 
        name: validatedInput.name,
        nodeCount: validatedInput.nodes?.length || 0,
        active: validatedInput.active,
        tagCount: validatedInput.tags?.length || 0
      });
      
      // Create the workflow
      const createdWorkflow = await this.apiClient.createWorkflow(workflowData);
      
      logger.info('Workflow created successfully', { 
        workflowId: createdWorkflow.id,
        workflowName: createdWorkflow.name,
        active: createdWorkflow.active,
        nodeCount: createdWorkflow.nodes?.length || 0,
        createdAt: createdWorkflow.createdAt
      });
      
      return this.formatSuccess({
        id: createdWorkflow.id,
        name: createdWorkflow.name,
        active: createdWorkflow.active,
        nodes: createdWorkflow.nodes?.length || 0,
        connections: Object.keys(createdWorkflow.connections || {}).length,
        settings: createdWorkflow.settings,
        tags: createdWorkflow.tags,
        versionId: createdWorkflow.versionId,
        createdAt: createdWorkflow.createdAt,
        updatedAt: createdWorkflow.updatedAt
      });
      
    } catch (error) {
      logger.error('Failed to create workflow', { 
        name: input.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof N8nMcpError) {
        throw error;
      }
      
      return this.formatError(new N8nMcpError(`Failed to create workflow "${input.name}"`, ErrorCode.WorkflowCreationError
      ));
    }
  }
} 