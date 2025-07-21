import { z } from 'zod';
import { CredentialBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for get_credential tool
 */
const GetCredentialInputSchema = z.object({
  id: z.string().min(1, 'Credential ID is required')
      });

type GetCredentialInput = z.infer<typeof GetCredentialInputSchema>;

/**
 * Tool handler for getting single credential details
 * Retrieves detailed information about a specific credential
 */
export class GetCredentialHandler extends CredentialBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'get_credential',
    description: 'Get detailed information about a specific n8n credential',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the credential to retrieve'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the get credential tool
   * @param input - Credential retrieval parameters
   * @returns Tool execution result
   */
  async execute(input: GetCredentialInput) {
    return this.handle(input);
  }

  /**
   * Handle the get credential tool
   * @param params - Credential retrieval parameters
   * @returns Credential details
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('credential');
    
    try {
      logger.info('Getting credential details', { credentialId: params.id });

      // Validate input
      const validatedInput = GetCredentialInputSchema.parse(params);

      // Get the credential
      const credential = await this.apiClient.getCredential(validatedInput.id);

      const result = {
        success: true,
        data: {
          id: credential.id,
          name: credential.name,
          nodesAccess: credential.nodesAccess
      }
      };

      logger.info('Credential details retrieved successfully', { 
        credentialId: validatedInput.id,
        credentialName: credential.name,
        credentialType: credential.type
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to get credential details', { 
        credentialId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to get credential: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.CredentialOperationError
      ));
    }
  }
} 