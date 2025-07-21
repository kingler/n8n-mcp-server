import { z } from 'zod';
import { BaseToolHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Input schema for upload_workflow tool
 */
const UploadWorkflowInputSchema = z.object({
  filePath: z.string().min(1, 'File path is required'),
  overwrite: z.boolean().optional().default(false),
  includeCredentials: z.boolean().optional().default(true),
  includeTags: z.boolean().optional().default(true),
  includeVariables: z.boolean().optional().default(true),
  validateOnly: z.boolean().optional().default(false),
});

type UploadWorkflowInput = z.infer<typeof UploadWorkflowInputSchema>;

/**
 * Tool handler for uploading workflow files
 * Supports various file formats and import options
 */
export class UploadWorkflowHandler extends BaseToolHandler {
  /**
   * Execute the upload workflow tool
   */
  async execute(args: Record<string, any>): Promise<any> {
    return this.handle(args as UploadWorkflowInput);
  }

  /**
   * Uploads a workflow file to n8n
   * @param input - The upload parameters
   * @returns The upload result
   */
  async handle(input: UploadWorkflowInput): Promise<any> {
    const logger = this.getLogger('upload-workflow');
    
    try {
      // Validate input parameters
      logger.info('Validating workflow upload input', { 
        filePath: input.filePath,
        overwrite: input.overwrite,
        includeCredentials: input.includeCredentials,
        includeTags: input.includeTags,
        includeVariables: input.includeVariables,
        validateOnly: input.validateOnly
      });
      
      const validatedInput = UploadWorkflowInputSchema.parse(input);
      
      // Check if file exists
      try {
        await fs.access(validatedInput.filePath);
      } catch (error) {
        throw new N8nMcpError(
          `File not found: ${validatedInput.filePath}`,
          ErrorCode.NotFoundError
        );
      }
      
      // Validate file extension
      const fileExtension = path.extname(validatedInput.filePath).toLowerCase();
      const allowedExtensions = ['.json', '.zip', '.tar.gz', '.tgz'];
      
      if (!allowedExtensions.includes(fileExtension)) {
        throw new N8nMcpError(
          `Invalid file type: ${fileExtension}`,
          ErrorCode.InvalidFileType
        );
      }
      
      logger.info('File validation passed', { 
        filePath: validatedInput.filePath,
        fileExtension,
        fileSize: (await fs.stat(validatedInput.filePath)).size
      });
      
      // Prepare upload options
      const uploadOptions = {
        overwrite: validatedInput.overwrite,
        includeCredentials: validatedInput.includeCredentials,
        includeTags: validatedInput.includeTags,
        includeVariables: validatedInput.includeVariables,
        validateOnly: validatedInput.validateOnly,
      };
      
      logger.info('Uploading workflow file', { 
        filePath: validatedInput.filePath,
        uploadOptions
      });
      
      // Read the file content
      const fileContent = await fs.readFile(validatedInput.filePath);
      
      // Get filename for upload
      const filename = path.basename(validatedInput.filePath);
      const mimeType = fileExtension === '.json' ? 'application/json' : 'application/octet-stream';
      
      // Upload the file
      const uploadResult = await this.apiClient.uploadWorkflow(fileContent, {
        filename,
        mimeType
      });
      
      logger.info('Workflow upload completed', { 
        uploadId: uploadResult.id,
        hasWorkflow: !!uploadResult.workflow,
        workflowId: uploadResult.workflow?.id,
        workflowName: uploadResult.workflow?.name
      });
      
      // Format the result
      const result = {
        uploadId: uploadResult.id,
        uploadUrl: uploadResult.url,
        success: true,
        workflowCount: uploadResult.workflow ? 1 : 0,
        errors: []
      };
      
      // Add workflow information if available
      if (uploadResult.workflow) {
        (result as any).data = {
          importedWorkflows: [{
            id: uploadResult.workflow.id,
            name: uploadResult.workflow.name,
            active: uploadResult.workflow.active,
            nodes: uploadResult.workflow.nodes?.length || 0,
            createdAt: uploadResult.workflow.createdAt,
            updatedAt: uploadResult.workflow.updatedAt
          }]
        };
        
        logger.info('Workflow imported successfully', { 
          workflowId: uploadResult.workflow.id,
          workflowName: uploadResult.workflow.name,
          nodeCount: uploadResult.workflow.nodes?.length || 0
        });
      }
      
      // Add error information if any
      if ((uploadResult as any).errors && (uploadResult as any).errors.length > 0) {
        (result as any).data.errors = (uploadResult as any).errors;
        (result as any).errorCount = (uploadResult as any).errors.length;
        result.errors = (uploadResult as any).errors;
        
        logger.warn('Workflow upload completed with errors', { 
          errorCount: (uploadResult as any).errors.length,
          errors: (uploadResult as any).errors
        });
      }
      
      return this.formatSuccess(result);
      
    } catch (error) {
      logger.error('Failed to upload workflow file', { 
        filePath: input.filePath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof N8nMcpError) {
        throw error;
      }
      
      throw new N8nMcpError(
        `Failed to upload workflow file: ${input.filePath}`,
        ErrorCode.UploadError
      );
    }
  }
} 