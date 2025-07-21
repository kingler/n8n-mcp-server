import { z } from 'zod';
import { CredentialBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for delete_credential tool
 */
const DeleteCredentialInputSchema = z.object({
  id: z.string().min(1, 'Credential ID is required')
      });

type DeleteCredentialInput = z.infer<typeof DeleteCredentialInputSchema>;

/**
 * Tool handler for deleting credentials
 * Permanently removes a credential from n8n
 */
export class DeleteCredentialHandler extends CredentialBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'delete_credential',
    description: 'Delete an n8n credential permanently',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the credential to delete'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the delete credential tool
   * @param input - Credential deletion parameters
   * @returns Tool execution result
   */
  async execute(input: DeleteCredentialInput) {
    return this.handle(input);
  }

  /**
   * Handle the delete credential tool
   * @param params - Credential deletion parameters
   * @returns Deletion result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('credential');
    
    try {
      logger.info('Deleting credential', { credentialId: params.id });

      // Validate input
      const validatedInput = DeleteCredentialInputSchema.parse(params);

      // Delete the credential
      await this.apiClient.deleteCredential(validatedInput.id);

      const result = {
        id: validatedInput.id,
        message: `Credential ${validatedInput.id} has been deleted successfully`
      };

      logger.info('Credential deleted successfully', { 
        credentialId: validatedInput.id
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to delete credential', { 
        credentialId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      return this.formatError(error instanceof Error ? error : new N8nMcpError(
        `Failed to delete credential: ${error instanceof Error ? error.message : 'Unknown error'}`,
        ErrorCode.CredentialOperationError
      ));
    }
  }
} 