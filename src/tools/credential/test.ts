import { z } from 'zod';
import { CredentialBaseHandler } from '../base-handler.js';
import { logger } from '../../utils/logger.js';
import { N8nMcpError } from '../../errors/index.js';
import { ErrorCode } from '../../errors/error-codes.js';
import type { ToolResult } from '../../types/index.js';

/**
 * Input schema for test_credential tool
 */
const TestCredentialInputSchema = z.object({
  id: z.string().min(1, 'Credential ID is required')
      });

type TestCredentialInput = z.infer<typeof TestCredentialInputSchema>;

/**
 * Tool handler for testing credentials
 * Tests whether a credential can successfully authenticate
 */
export class TestCredentialHandler extends CredentialBaseHandler {
  /**
   * Tool definition for MCP
   */
  static readonly definition = {
    name: 'test_credential',
    description: 'Test an n8n credential to verify it works correctly',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID of the credential to test'
        }
      },
      required: ['id']
    }
  };

  /**
   * Execute the test credential tool
   * @param input - Credential test parameters
   * @returns Tool execution result
   */
  async execute(input: TestCredentialInput) {
    return this.handle(input);
  }

  /**
   * Handle the test credential tool
   * @param params - Credential test parameters
   * @returns Test result
   */
  async handle(params: any): Promise<ToolResult> {
    const logger = this.getLogger('credential');
    
    try {
      logger.info('Testing credential', { credentialId: params.id });

      // Validate input
      const validatedInput = TestCredentialInputSchema.parse(params);

      // Test the credential
      const testResult = await this.apiClient.testCredential(validatedInput.id);

      const result = {
        success: true,
        data: {
          id: validatedInput.id,
          testSuccess: testResult.success,
          message: testResult.success 
            ? `Credential ${validatedInput.id} test passed successfully`
            : `Credential ${validatedInput.id} test failed: ${testResult.message}`,
          details: testResult.message || 'No additional details'
        }
      };

      logger.info('Credential test completed', { 
        credentialId: validatedInput.id,
        testSuccess: testResult.success,
        message: testResult.message
      });

      return this.formatSuccess(result);

    } catch (error) {
      logger.error('Failed to test credential', { 
        credentialId: params.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      });

      if (error instanceof N8nMcpError) {
        throw error;
      }

      return this.formatError(new N8nMcpError(`Failed to test credential: ${error instanceof Error ? error.message : 'Unknown error'}`, ErrorCode.CredentialOperationError
      ));
    }
  }
} 