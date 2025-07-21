import { z } from 'zod';
import { CredentialBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for transfer_credential tool
 */
const TransferCredentialInputSchema = z.object({
  id: z.string().min(1, 'Credential ID is required'),
  userId: z.string().min(1, 'User ID is required')
});

type TransferCredentialInput = z.infer<typeof TransferCredentialInputSchema>;

/**
 * Tool handler for transferring credential ownership
 * Transfers ownership of a credential to another user
 */
export class TransferCredentialHandler extends CredentialBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'transfer_credential',
    description: 'Transfer ownership of an n8n credential to another user',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the credential to transfer'
        },
        userId: {
          type: 'string',
          description: 'ID of the user to transfer the credential to'
        }
      },
      required: ['id', 'userId']
    }
  };

  /**
   * Execute the transfer credential tool
   * @param input - Credential transfer parameters
   * @returns Tool execution result
   */
  async execute(input: TransferCredentialInput) {
    return this.handle(input);
  }

  /**
   * Handle the transfer credential tool
   * @param params - Credential transfer parameters
   * @returns Transfer result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('credential');
    
    try {
      logger.info('Transferring credential ownership', { 
        credentialId: params.id,
        targetUserId: params.userId 
      });

      // Validate input
      const validatedInput = TransferCredentialInputSchema.parse(params);

      // Transfer credential ownership
      const transferredCredential = await this.apiClient.transferCredential(
        validatedInput.id, 
        validatedInput.userId
      );

      const result = {
        success: true,
        data: {
          id: transferredCredential.id,
          name: transferredCredential.name,
          message: `Credential "${transferredCredential.name}" has been transferred to user ${validatedInput.userId}`
        }
      };

      logger.info('Credential transferred successfully', { 
        credentialId: validatedInput.id,
        credentialName: transferredCredential.name
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to transfer credential', { 
        credentialId: params.id,
        targetUserId: params.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to transfer credential: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.CredentialOperationError
      ));
    }
  }
} 