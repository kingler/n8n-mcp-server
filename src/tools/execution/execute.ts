import { z } from 'zod';
import { ExecutionBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for execute_workflow tool
 */
const ExecuteWorkflowInputSchema = z.object({
  workflowId: z.string().min(1, 'Workflow ID is required'),
  data: z.record(z.any()).optional().default({}),
  mode: z.enum(['manual', 'trigger']).optional().default('manual'),
  waitForCompletion: z.boolean().optional().default(false),
  timeoutSeconds: z.number().min(1).max(300).optional().default(60),
  retryOnFailure: z.boolean().optional().default(false),
  maxRetries: z.number().min(1).max(5).optional().default(3),
  retryDelaySeconds: z.number().min(1).max(60).optional().default(5)
      });

type ExecuteWorkflowInput = z.infer<typeof ExecuteWorkflowInputSchema>;

/**
 * Tool handler for executing workflows
 * Handles workflow execution with optional waiting and retry logic
 */
export class ExecuteWorkflowHandler extends ExecutionBaseHandler {
  /**
   * Execute the execute workflow tool
   */
  async execute(args: Record<string, any>): Promise<any> {
    return this.handle(args as ExecuteWorkflowInput);
  }

  /**
   * Executes a workflow with the provided parameters
   * @param input - The workflow execution parameters
   * @returns The execution result
   */
  async handle(input: ExecuteWorkflowInput): Promise<any> {
    const logger = this.getLogger('execute-workflow');
    
    try {
      // Validate input parameters
      logger.info('Validating workflow execution input', { 
        workflowId: input.workflowId,
        mode: input.mode,
        waitForCompletion: input.waitForCompletion,
        timeoutSeconds: input.timeoutSeconds,
        retryOnFailure: input.retryOnFailure,
        maxRetries: input.maxRetries,
        hasData: !!input.data && Object.keys(input.data).length > 0
      });
      
      const validatedInput = ExecuteWorkflowInputSchema.parse(input);
      
      // Check if workflow exists and is active
      logger.info('Checking workflow status', { workflowId: validatedInput.workflowId });
      
      const workflow = await this.apiClient.getWorkflow(validatedInput.workflowId);
      
      if (!workflow.active) {
        return this.formatError(new N8nMcpError(`Cannot execute inactive workflow "${workflow.name}"`, ErrorCode.WorkflowExecutionError
        ));
      }
      
      logger.info('Workflow is active, proceeding with execution', { 
        workflowId: validatedInput.workflowId,
        workflowName: workflow.name,
        mode: validatedInput.mode
      });
      
      // Execute the workflow
      const execution = await this.apiClient.executeWorkflow(validatedInput.workflowId, {
        data: validatedInput.data
      });
      
      logger.info('Workflow execution started', { 
        executionId: execution.id,
        workflowId: validatedInput.workflowId,
        status: execution.status,
        startedAt: execution.startedAt
      });
      
      // If not waiting for completion, return immediately
      if (!validatedInput.waitForCompletion) {
        return this.formatSuccess({
        executionId: execution.id,
          status: execution.status,
          startedAt: execution.startedAt,
          message: 'Workflow execution started successfully'
        
      
      });
      }
      
      // Wait for completion with timeout and retry logic
      logger.info('Waiting for workflow execution to complete', { 
        executionId: execution.id,
        timeoutSeconds: validatedInput.timeoutSeconds
      });
      
      const finalExecution = await this.waitForExecutionCompletion(
        execution.id,
        validatedInput.timeoutSeconds,
        validatedInput.retryOnFailure,
        validatedInput.maxRetries,
        validatedInput.retryDelaySeconds
      );
      
      // Format the result based on execution status
      const result = {
        executionId: finalExecution.id,
        status: finalExecution.status,
        startedAt: finalExecution.startedAt,
        stoppedAt: finalExecution.stoppedAt,
        executionTime: finalExecution.executionTime,
        finished: finalExecution.finished,
        success: finalExecution.status === 'success',
        error: finalExecution.error,
        data: finalExecution.data
      };
      
      if (finalExecution.status === 'success') {
        logger.info('Workflow execution completed successfully', { 
          executionId: finalExecution.id,
          executionTime: finalExecution.executionTime
        });
        
        return this.formatSuccess(result);
      } else {
        logger.warn('Workflow execution completed with issues', { 
          executionId: finalExecution.id,
          status: finalExecution.status,
          error: finalExecution.error
        });
        
        return this.formatError(
          new Error(`Workflow execution ${finalExecution.status}: ${finalExecution.error || 'Unknown error'}`)
        );
      }
      
    } catch (error) {
      logger.error('Failed to execute workflow', { 
        workflowId: input.workflowId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof N8nMcpError) {
        throw error;
      }
      
      return this.formatError(new N8nMcpError(`Failed to execute workflow ${input.workflowId}`, ErrorCode.ExecutionError
      ));
    }
  }

  /**
   * Wait for execution completion with timeout
   */
  private async waitForExecutionCompletion(
    executionId: string,
    timeoutSeconds: number,
    retryOnFailure: boolean,
    maxRetries: number,
    retryDelaySeconds: number
  ): Promise<any> {
    const logger = this.getLogger('wait-for-execution');
    const startTime = Date.now();
    const timeoutMs = timeoutSeconds * 1000;
    let retryCount = 0;
    
    while (Date.now() - startTime < timeoutMs) {
      try {
        const execution = await this.apiClient.getExecution(executionId);
        
        // Check if execution is finished
        if (execution.finished) {
          return execution;
        }
        
        // Check if execution failed and retry is enabled
        if (execution.status === 'error' && retryOnFailure && retryCount < maxRetries) {
          logger.warn('Execution failed, retrying', { 
            executionId,
            retryCount: retryCount + 1,
            maxRetries,
            error: execution.error
          });
          
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, retryDelaySeconds * 1000));
          
          // Retry the execution
          const retryExecution = await this.apiClient.executeWorkflow(execution.workflowId, {
            data: execution.data
          });
          
          // Update execution ID for the retry
          executionId = retryExecution.id;
          retryCount++;
          
          continue;
        }
        
        // Wait before next check
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        logger.error('Error checking execution status', { 
          executionId,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    // Timeout reached
    return this.formatError(new N8nMcpError(`Execution ${executionId} did not complete within ${timeoutSeconds} seconds`, ErrorCode.ExecutionTimeoutError
    ));
  }
} 