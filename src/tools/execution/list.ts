import { z } from 'zod';
import { ExecutionBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for list_executions tool
 */
const ListExecutionsInputSchema = z.object({
  workflowId: z.string().optional(), // Filter by workflow ID
  status: z.enum(['running', 'success', 'error', 'waiting', 'canceled']).optional(), // Filter by status
  limit: z.number().min(1).max(100).optional().default(50),
  orderBy: z.enum(['startedAt', 'stoppedAt', 'status']).optional().default('startedAt'),
  orderDirection: z.enum(['ASC', 'DESC']).optional().default('DESC'),
  includeData: z.boolean().optional().default(false), // Whether to include execution data
  dateFrom: z.string().optional(), // Filter by start date (ISO string)
  dateTo: z.string().optional(), // Filter by end date (ISO string)
});

type ListExecutionsInput = z.infer<typeof ListExecutionsInputSchema>;

/**
 * Tool handler for listing workflow executions
 * Provides comprehensive execution listing with filtering and pagination
 */
export class ListExecutionsHandler extends ExecutionBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'list',
    description: 'List lists with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of items to return' }
      },
      required: []
    }
  };

  /**
   * Execute the list executions tool
   */
  async execute(args: Record<string, any>): Promise<any> {
    return this.handle(args as ListExecutionsInput);
  }

  /**
   * Lists workflow executions with filtering and pagination
   * @param input - The execution listing parameters
   * @returns List of executions with metadata
   */
  async handle(input: ListExecutionsInput): Promise<any> {
    const logger = this.getLogger('list-executions');
    
    try {
      // Validate input parameters
      logger.info('Validating execution listing input', {
        workflowId: input.workflowId,
        status: input.status,
        limit: input.limit,
        orderBy: input.orderBy,
        orderDirection: input.orderDirection,
        includeData: input.includeData,
        dateFrom: input.dateFrom,
        dateTo: input.dateTo
      });
      
      const validatedInput = ListExecutionsInputSchema.parse(input);
      
      // Prepare query parameters
      const queryParams: any = {
        limit: validatedInput.limit,
        includeData: validatedInput.includeData
      };
      
      if (validatedInput.workflowId) {
        queryParams.workflowId = validatedInput.workflowId;
      }
      
      if (validatedInput.status) {
        queryParams.status = validatedInput.status;
      }
      
      if (validatedInput.dateFrom) {
        queryParams.dateFrom = validatedInput.dateFrom;
      }
      
      if (validatedInput.dateTo) {
        queryParams.dateTo = validatedInput.dateTo;
      }
      
      logger.info('Retrieving workflow executions', { 
        queryParams,
        hasWorkflowFilter: !!validatedInput.workflowId,
        hasStatusFilter: !!validatedInput.status,
        hasDateFilter: !!validatedInput.dateFrom || !!validatedInput.dateTo,
        includeData: validatedInput.includeData
      });
      
      // Get executions
      const executions = await this.apiClient.getExecutions(queryParams);

      // Handle different response formats - n8n returns array directly, not paginated object
      const executionData = Array.isArray(executions) ? executions :
                           (executions && executions.data && Array.isArray(executions.data)) ? executions.data : [];

      // Calculate statistics - handle different status field formats
      const statusCounts = executionData.reduce((acc: any, execution: any) => {
        // n8n API may return different status formats
        let status = execution.status;
        if (!status) {
          // Derive status from other fields if status is not present
          if (execution.finished === true) {
            status = execution.stoppedAt ? 'success' : 'completed';
          } else if (execution.finished === false) {
            status = 'running';
          } else {
            status = 'unknown';
          }
        }
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});
      
      const totalExecutions = (executions && executions.total) || executionData.length;
      const hasMore = executionData.length === validatedInput.limit;

      // Calculate average execution time for successful executions
      const successfulExecutions = executionData.filter((exec: any) => {
        const status = exec.status || (exec.finished === true ? 'success' : 'unknown');
        return status === 'success' && (exec.executionTime || (exec.startedAt && exec.stoppedAt));
      });

      const averageExecutionTime = successfulExecutions.length > 0
        ? successfulExecutions.reduce((sum: number, exec: any) => {
            const execTime = exec.executionTime ||
              (exec.startedAt && exec.stoppedAt ?
                new Date(exec.stoppedAt).getTime() - new Date(exec.startedAt).getTime() : 0);
            return sum + execTime;
          }, 0) / successfulExecutions.length
        : null;

      // Sanitize sensitive data if not explicitly requested
      const sanitizedExecutions = executionData.map((execution: any) => {
        if (!validatedInput.includeData) {
          // Remove sensitive fields
          const { data, ...sanitizedExecution } = execution;
          return {
            ...sanitizedExecution,
            hasData: !!data // Indicate if data exists without exposing it
          };
        }
        return execution;
      });
      
      logger.info('Executions retrieved successfully', {
        totalExecutions,
        returnedCount: executionData.length,
        statusCounts,
        hasMore,
        averageExecutionTime,
        includeData: validatedInput.includeData
      });
      
      return this.formatSuccess({
        executions: sanitizedExecutions,
        pagination: {
          total: totalExecutions,
          limit: validatedInput.limit,
          hasMore,
          returnedCount: executionData.length
        },
        statistics: {
          statusCounts,
          totalExecutions,
          returnedCount: executionData.length,
          averageExecutionTime,
          successfulCount: statusCounts.success || 0,
          errorCount: statusCounts.error || 0,
          runningCount: statusCounts.running || 0
        }
      });
      
    } catch (error) {
      logger.error('Failed to list workflow executions', { 
        workflowId: input.workflowId,
        status: input.status,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof N8nMcpError) {
        throw error;
      }
      
      return this.formatError(new N8nMcpError('Failed to list workflow executions', ErrorCode.ExecutionError
      ));
    }
  }
} 