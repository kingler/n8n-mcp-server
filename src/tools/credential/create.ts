import { z } from 'zod';
import { CredentialBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { CredentialCreateRequest } from '../../types/index.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for create_credential tool
 */
const CreateCredentialInputSchema = z.object({
  name: z.string().min(1, 'Credential name is required').max(255, 'Credential name too long'),
  type: z.string().min(1, 'Credential type is required'),
  data: z.record(z.any()).refine((data) => Object.keys(data).length > 0, 'Credential data is required'),
  nodesAccess: z.array(z.any()).optional().default([]),
  meta: z.record(z.any()).optional().default({}),
  id: z.string().optional(), // Allow custom ID for imports
});

type CreateCredentialInput = z.infer<typeof CreateCredentialInputSchema>;

/**
 * Tool handler for creating new credentials
 * Handles secure credential creation with proper encryption
 */
export class CreateCredentialHandler extends CredentialBaseHandler {
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
   * Execute the create credential tool
   */
  async execute(args: Record<string, any>): Promise<any> {
    return this.handle(args as CreateCredentialInput);
  }

  /**
   * Creates a new credential with the provided configuration
   * @param input - The credential creation parameters
   * @returns The created credential information
   */
  async handle(input: CreateCredentialInput): Promise<any> {
    const logger = this.getLogger('create-credential');
    
    try {
      // Validate input parameters
      logger.info('Validating credential creation input', { 
        name: input.name,
        hasData: !!input.data && Object.keys(input.data).length > 0,
        nodesAccessCount: input.nodesAccess?.length || 0
      });
      
      const validatedInput = CreateCredentialInputSchema.parse(input);
      
      // Security logging for credential creation
      logger.info('Creating credential with sensitive data', { 
        name: validatedInput.name,
        dataFields: Object.keys(validatedInput.data as Record<string, any>),
        nodesAccessCount: validatedInput.nodesAccess?.length || 0
      });
      
      // Prepare credential creation request
      const credentialData: CredentialCreateRequest = {
        name: validatedInput.name,
        type: validatedInput.type,
        data: validatedInput.data,
        nodesAccess: validatedInput.nodesAccess
      };
      
      // Create the credential
      const createdCredential = await this.apiClient.createCredential(credentialData);
      
      // Sanitize the response to remove sensitive data
      const { data, ...sanitizedCredential } = createdCredential;
      
      logger.info('Credential created successfully', { 
        credentialId: createdCredential.id,
        credentialName: createdCredential.name,
        credentialType: createdCredential.type,
        createdAt: createdCredential.createdAt,
        hasData: !!data
      });
      
      return this.formatSuccess({
        ...sanitizedCredential,
        hasData: !!data // Indicate if data exists without exposing it
      
      
      });
      
    } catch (error) {
      logger.error('Failed to create credential', { 
        name: input.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof N8nMcpError) {
        throw error;
      }
      
      return this.formatError(new N8nMcpError(`Failed to create credential "${input.name}"`, ErrorCode.CredentialCreationError
      ));
    }
  }
} 