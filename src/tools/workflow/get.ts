import { z } from 'zod';
import { WorkflowBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for get_workflow tool
 */
const GetWorkflowInputSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
  includeCredentials: z.boolean().optional().default(false),
  includeExecutions: z.boolean().optional().default(false)
      });

type GetWorkflowInput = z.infer<typeof GetWorkflowInputSchema>;

/**
 * Tool handler for retrieving workflow details
 * Provides comprehensive workflow information with optional related data
 */
export class GetWorkflowHandler extends WorkflowBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'get',
    description: 'Get a specific get by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the item to retrieve' }
      },
      required: ['id']
    }
  };

  /**
   * Execute the get workflow tool
   */
  async execute(args: Record<string, any>): Promise<any> {
    return this.handle(args as GetWorkflowInput);
  }

  /**
   * Retrieves detailed information about a specific workflow
   * @param input - The workflow retrieval parameters
   * @returns The workflow information
   */
  async handle(input: GetWorkflowInput): Promise<any> {
    const logger = this.getLogger('get-workflow');
    
    try {
      // Validate input parameters
      logger.info('Validating workflow retrieval input', {
        workflowId: input.workflowId,
        includeCredentials: input.includeCredentials,
        includeExecutions: input.includeExecutions
      });
      
      const validatedInput = GetWorkflowInputSchema.parse(input);
      
      // Prepare query parameters
      const queryParams: any = {
        includeCredentials: validatedInput.includeCredentials
      };
      
      logger.info('Retrieving workflow details', { 
        workflowId: validatedInput.workflowId,
        queryParams
      });
      
      // Get the workflow
      const workflow = await this.apiClient.getWorkflow(validatedInput.workflowId, queryParams);
      
      logger.info('Workflow retrieved successfully', { 
        workflowId: workflow.id,
        workflowName: workflow.name,
        active: workflow.active,
        nodeCount: workflow.nodes?.length || 0,
        tagCount: workflow.tags?.length || 0,
        hasCredentials: !!workflow.credentials && workflow.credentials.length > 0
      });
      
      // Format the response
      const result = {
        id: workflow.id,
        name: workflow.name,
        active: workflow.active,
        nodes: workflow.nodes?.length || 0,
        connections: Object.keys(workflow.connections || {}).length,
        settings: workflow.settings,
        tags: workflow.tags,
        versionId: workflow.versionId,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt
      };
      
      // Add credentials if requested and available
      if (validatedInput.includeCredentials && (workflow as any).credentials) {
        (result as any).credentials = (workflow as any).credentials.map((cred: any) => ({
          id: cred.id,
          name: cred.name,
          hasData: !!cred.data
        }));
      }
      
      // Add executions if requested
      if (validatedInput.includeExecutions && (workflow as any).executions) {
        (result as any).executions = (workflow as any).executions.map((exec: any) => ({
          id: exec.id,
          status: exec.status,
          startedAt: exec.startedAt,
          stoppedAt: exec.stoppedAt,
          executionTime: exec.executionTime,
          finished: exec.finished
        }));
      }
      
      return this.formatSuccess(result);
      
    } catch (error) {
      logger.error('Failed to retrieve workflow', { 
        workflowId: input.workflowId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof N8nMcpError) {
        throw error;
      }
      
      return this.formatError(new N8nMcpError(`Failed to retrieve workflow ${input.workflowId}`, ErrorCode.WorkflowError
      ));
    }
  }
} 