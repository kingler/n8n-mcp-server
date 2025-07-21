/**
 * List Workflows Tool Handler
 *
 * This tool retrieves a list of all workflows from n8n with optional filtering.
 */

import { WorkflowBaseHandler } from '../base-handler.js';
import type { ToolDefinition } from '../../types/index.js';
import { z } from 'zod';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for list workflows tool
 */
const listWorkflowsSchema = z.object({
  active: z.boolean().optional().describe('Filter workflows by active status'),
  limit: z.number().min(1).max(100).optional().describe('Maximum number of workflows to return (1-100)'),
  offset: z.number().min(0).optional().describe('Number of workflows to skip for pagination'),
  tags: z.array(z.string()).optional().describe('Filter workflows by tags'),
  search: z.string().optional().describe('Search workflows by name')
      });

export class ListWorkflowsHandler extends WorkflowBaseHandler {
  /**
   * Tool definition
   */
  static readonly definition: ToolDefinition = {
    name: 'list_workflows',
    description: 'Retrieve a list of all workflows from n8n with optional filtering by active status, tags, and search terms',
    inputSchema: {
      type: 'object',
      properties: {
        active: {
          type: 'boolean',
          description: 'Filter workflows by active status (true for active, false for inactive)'
      },
        limit: {
          type: 'number',
          description: 'Maximum number of workflows to return (1-100, default: 50)',
          minimum: 1,
          maximum: 100
      },
        offset: {
          type: 'number',
          description: 'Number of workflows to skip for pagination (default: 0)',
          minimum: 0
      },
        tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filter workflows by specific tags'
      },
        search: {
          type: 'string',
          description: 'Search workflows by name (case-insensitive)'
      }
      }
      }
      };

  /**
   * Execute the list workflows tool
   */
  async execute(args: Record<string, any>): Promise<any> {
    return this.handle(args);
  }

  /**
   * Handle the list workflows tool
   */
  async handle(args: Record<string, any>): Promise<any> {
    try {
      // Validate input arguments
      const validatedArgs = listWorkflowsSchema.parse(args);
      
      this.logger.info('Listing workflows', { 
        filters: {
          active: validatedArgs.active,
          limit: validatedArgs.limit,
          offset: validatedArgs.offset,
          tags: validatedArgs.tags,
          search: validatedArgs.search
      }
      });

      // Get workflows from n8n API
      const workflows = await this.apiClient.getWorkflows({
        ...(validatedArgs.active !== undefined && { active: validatedArgs.active }),
        ...(validatedArgs.limit !== undefined && { limit: validatedArgs.limit }),
        ...(validatedArgs.offset !== undefined && { offset: validatedArgs.offset })
      });

      // Apply additional filters if provided
      let filteredWorkflows = workflows;

      // Filter by tags if specified
      if (validatedArgs.tags && validatedArgs.tags.length > 0) {
        filteredWorkflows = filteredWorkflows.filter((workflow: any) => {
          if (!workflow.tags || workflow.tags.length === 0) return false;
          return validatedArgs.tags!.some((tag: string) => 
            workflow.tags!.some((workflowTag: any) => 
              workflowTag.name.toLowerCase() === tag.toLowerCase()
            )
          );
        });
      }

      // Filter by search term if specified
      if (validatedArgs.search) {
        const searchTerm = validatedArgs.search.toLowerCase();
        filteredWorkflows = filteredWorkflows.filter((workflow: any) =>
          workflow.name.toLowerCase().includes(searchTerm)
        );
      }

      // Format response
      const result = {
        workflows: filteredWorkflows.map((workflow: any) => ({
          id: workflow.id,
          name: workflow.name,
          active: workflow.active,
          tags: workflow.tags?.map((tag: any) => tag.name) || [],
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
          nodeCount: workflow.nodes?.length || 0
      })),
        total: filteredWorkflows.length,
        filters: {
          active: validatedArgs.active,
          limit: validatedArgs.limit,
          offset: validatedArgs.offset,
          tags: validatedArgs.tags,
          search: validatedArgs.search
      }
      };

      this.logger.info('Successfully listed workflows', { 
        count: result.total,
        filters: result.filters 
      });

      return this.formatSuccess(result);
    } catch (error) {
      return this.formatError(error as Error);
    }
  }
} 