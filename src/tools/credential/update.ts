import { z } from 'zod';
import { CredentialBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for update_credential tool
 */
const UpdateCredentialInputSchema = z.object({
  id: z.string().min(1, 'Credential ID is required'),
  name: z.string().min(1, 'Credential name is required').optional(),
  type: z.string().optional(),
  data: z.record(z.any()).optional(),
  nodesAccess: z.array(z.any()).optional()
});

type UpdateCredentialInput = z.infer<typeof UpdateCredentialInputSchema>;

/**
 * Tool handler for updating credentials
 * Updates an existing credential with new information
 */
export class UpdateCredentialHandler extends CredentialBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'update_credential',
    description: 'Update an existing n8n credential',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the credential to update'
        },
        name: {
          type: 'string',
          description: 'New name for the credential'
        },
        type: {
          type: 'string',
          description: 'Type of the credential (e.g., httpBasicAuth, oAuth2Api)'
        },
        data: {
          type: 'object',
          description: 'Credential data object containing authentication details'
        },
        nodesAccess: {
          type: 'array',
          items: { type: 'object' },
          description: 'Array defining which nodes can access this credential'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the update credential tool
   * @param input - Credential update parameters
   * @returns Tool execution result
   */
  async execute(input: UpdateCredentialInput) {
    return this.handle(input);
  }

  /**
   * Handle the update credential tool
   * @param params - Credential update parameters
   * @returns Update result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('credential');
    
    try {
      logger.info('Updating credential', { 
        credentialId: params.id,
        name: params.name
      });

      // Validate input
      const validatedInput = UpdateCredentialInputSchema.parse(params);

      // Prepare update data
      const updateData: any = {};
      if (validatedInput.name) updateData.name = validatedInput.name;
      if (validatedInput.type) updateData.type = validatedInput.type;
      if (validatedInput.data) updateData.data = validatedInput.data;
      if (validatedInput.nodesAccess) updateData.nodesAccess = validatedInput.nodesAccess;

      // Update the credential
      const updatedCredential = await this.apiClient.updateCredential(
        validatedInput.id,
        updateData
      );

      const result = {
        success: true,
        data: {
          id: updatedCredential.id,
          name: updatedCredential.name,
          nodesAccess: updatedCredential.nodesAccess,
          message: `Credential "${updatedCredential.name}" has been updated successfully`
        }
      };

      logger.info('Credential updated successfully', { 
        credentialId: validatedInput.id,
        credentialName: updatedCredential.name
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to update credential', { 
        credentialId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to update credential: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.CredentialOperationError
      ));
    }
  }
} 