import { BaseToolHandler } from '../base-handler.js';
import type { ToolDefinition, ToolResult } from '../../types/index.js';

/**
 * Handler for checking n8n API connectivity
 */
export class CheckConnectivityHandler extends BaseToolHandler {
  /**
   * Tool definition
   */
  static readonly definition: ToolDefinition = {
    name: 'check_connectivity',
    description: 'Check connectivity to the n8n API',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  };

  /**
   * Execute the check connectivity tool
   */
  async execute(args: Record<string, any>): Promise<ToolResult> {
    return this.handle(args);
  }

  /**
   * Handle the check connectivity tool
   */
  async handle(args: Record<string, any>): Promise<ToolResult> {
    try {
      const logger = this.getLogger('connectivity');
      
      logger.info('Checking n8n API connectivity');
      
      const isConnected = await this.apiClient.checkConnectivity();
      const healthStatus = await this.apiClient.getHealthStatus();
      
      const result = {
        connected: isConnected,
        apiUrl: this.apiClient['config'].n8nApiUrl,
        healthStatus: healthStatus.status,
        version: healthStatus.version,
        timestamp: new Date().toISOString()
      };
      
      if (isConnected) {
        logger.info('API connectivity check successful', result);
        return this.formatSuccess(result);
      } else {
        logger.error('API connectivity check failed', result);
        return this.formatError(new Error('Unable to connect to n8n API'));
      }
    } catch (error) {
      return this.formatError(error as Error);
    }
  }
}

/**
 * Handler for getting n8n API health status
 */
export class GetHealthStatusHandler extends BaseToolHandler {
  /**
   * Tool definition
   */
  static readonly definition: ToolDefinition = {
    name: 'get_health_status',
    description: 'Get detailed health status of the n8n API',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  };

  /**
   * Execute the get health status tool
   */
  async execute(args: Record<string, any>): Promise<ToolResult> {
    return this.handle(args);
  }

  /**
   * Handle the get health status tool
   */
  async handle(args: Record<string, any>): Promise<ToolResult> {
    try {
      const logger = this.getLogger('health');
      
      logger.info('Getting n8n API health status');
      
      const healthStatus = await this.apiClient.getHealthStatus();
      const connectivity = await this.apiClient.checkConnectivity();
      
      const result = {
        status: healthStatus.status,
        version: healthStatus.version,
        connected: connectivity,
        apiUrl: this.apiClient['config'].n8nApiUrl,
        timestamp: new Date().toISOString(),
        details: {
          apiAvailable: connectivity,
          healthEndpoint: healthStatus.status !== 'unhealthy'
        }
      };
      
      logger.info('Health status retrieved', result);
      return this.formatSuccess(result);
    } catch (error) {
      return this.formatError(error as Error);
    }
  }
}