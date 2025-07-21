import { z } from 'zod';
import { CredentialBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for list_credentials tool
 */
const ListCredentialsInputSchema = z.object({
  type: z.string().optional(), // Filter by credential type
  name: z.string().optional(), // Filter by credential name
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  orderBy: z.enum(['name', 'type', 'createdAt', 'updatedAt']).optional().default('name'),
  orderDirection: z.enum(['ASC', 'DESC']).optional().default('ASC'),
  includeData: z.boolean().optional().default(false), // Whether to include sensitive data
  includeNodes: z.boolean().optional().default(false), // Whether to include node usage
});

type ListCredentialsInput = z.infer<typeof ListCredentialsInputSchema>;

/**
 * Tool handler for listing credentials
 * Provides secure credential listing with optional sensitive data inclusion
 */
export class ListCredentialsHandler extends CredentialBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'list',
    description: 'List lists with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Maximum number of items to return' },
        offset: { type: 'number', description: 'Number of items to skip' }
      },
      required: []
    }
  };

  /**
   * Execute the list credentials tool
   */
  async execute(args: Record<string, any>): Promise<any> {
    return this.handle(args as ListCredentialsInput);
  }

  /**
   * Lists credentials with filtering and pagination
   * @param input - The credential listing parameters
   * @returns List of credentials with metadata
   */
  async handle(input: ListCredentialsInput): Promise<any> {
    const logger = this.getLogger('list-credentials');
    
    try {
      // Validate input parameters
      logger.info('Validating credential listing input', { 
        name: input.name,
        limit: input.limit,
        offset: input.offset,
        orderBy: input.orderBy,
        orderDirection: input.orderDirection,
        includeData: input.includeData
      });
      
      const validatedInput = ListCredentialsInputSchema.parse(input);
      
      // Security warning for sensitive data inclusion
      if (validatedInput.includeData) {
        logger.warn('Including sensitive credential data in response', { 
          name: validatedInput.name
        });
      }
      
      // Prepare query parameters
      const queryParams: any = {
        limit: validatedInput.limit,
        offset: validatedInput.offset,
        includeSensitiveData: validatedInput.includeData
      };
      
      if (validatedInput.type) {
        queryParams.type = validatedInput.type;
      }
      
      if (validatedInput.name) {
        queryParams.name = validatedInput.name;
      }
      
      logger.info('Retrieving credentials', { 
        queryParams,
        hasTypeFilter: !!validatedInput.type,
        hasNameFilter: !!validatedInput.name,
        includeSensitiveData: validatedInput.includeData
      });
      
      // Get credentials - handle case where API doesn't support credential listing
      let credentials;
      try {
        credentials = await this.apiClient.getCredentials(queryParams);
      } catch (error: any) {
        // If credentials listing is not supported, return informative message
        if (error.message?.includes('method not allowed') || error.response?.status === 405) {
          logger.warn('Credential listing not supported by this n8n instance', {
            error: error.message
          });

          return this.formatSuccess({
            credentials: [],
            total: 0,
            pagination: {
              total: 0,
              limit: validatedInput.limit,
              offset: validatedInput.offset,
              hasMore: false,
              nextOffset: null
            },
            message: 'Credential listing is not supported by this n8n instance. This is a security feature in some n8n configurations.',
            supportedOperations: ['create', 'get', 'update', 'delete', 'test']
          });
        }
        throw error;
      }
      
      // Calculate statistics
      const typeCounts = credentials.data.reduce((acc: any, credential: any) => {
        acc[credential.type] = (acc[credential.type] || 0) + 1;
        return acc;
      }, {});
      
      const totalCredentials = credentials.total || 0;
      const hasMore = (validatedInput.offset + validatedInput.limit) < totalCredentials;
      
      // Sanitize sensitive data if not explicitly requested
      const sanitizedCredentials = credentials.data.map((credential: any) => {
        if (!validatedInput.includeData) {
          // Remove sensitive fields
          const { data, ...sanitizedCredential } = credential;
          return {
            ...sanitizedCredential,
            hasData: !!data // Indicate if data exists without exposing it
          };
        }
        return credential;
      });
      
      logger.info('Credentials retrieved successfully', { 
        totalCredentials,
        returnedCount: credentials.data.length,
        typeCounts,
        hasMore,
        includeSensitiveData: validatedInput.includeData
      });
      
      return this.formatSuccess({
        credentials: sanitizedCredentials,
        pagination: {
          total: totalCredentials,
          limit: validatedInput.limit,
          offset: validatedInput.offset,
          hasMore,
          nextOffset: hasMore ? validatedInput.offset + validatedInput.limit : null
        },
        statistics: {
          typeCounts,
          totalCredentials,
          returnedCount: credentials.data.length
        }
      });
      
    } catch (error) {
      logger.error('Failed to list credentials', { 
        name: input.name,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof N8nMcpError) {
        throw error;
      }
      
      return this.formatError(new N8nMcpError('Failed to list credentials', ErrorCode.CredentialError
      ));
    }
  }
} 