/**
 * n8n API Client Module
 *
 * This module provides a comprehensive client for interacting with the n8n API,
 * including all endpoints for workflows, executions, credentials, tags, users, and variables.
 */

import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import type { 
  EnvConfig, 
  N8nWorkflow, 
  N8nExecution, 
  N8nCredential, 
  N8nTag, 
  N8nUser, 
  N8nVariable,
  PaginatedResponse 
} from '../types/index.js';
import { 
  N8nApiError, 
  AuthenticationError, 
  NotFoundError, 
  ValidationError,
  ErrorHandler 
} from '../errors/index.js';
import { logger } from '../utils/logger.js';

/**
 * n8n API Client class
 */
export class N8nApiClient {
  private client: AxiosInstance;
  private config: EnvConfig;
  private logger = logger;

  constructor(config: EnvConfig) {
    this.config = config;
    
    // Create axios instance with base configuration
    this.client = axios.create({
      baseURL: config.n8nApiUrl,
      timeout: parseInt(process.env['API_TIMEOUT'] || '30000'),
      headers: {
        'Content-Type': 'application/json',
        'X-N8N-API-KEY': config.n8nApiKey,
      },
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        this.logger.logApiRequest(config.method?.toUpperCase() || 'UNKNOWN', config.url || '');
        return config;
      },
      (error) => {
        this.logger.error('Request interceptor error', { error: error.message });
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging and error handling
    this.client.interceptors.response.use(
      (response) => {
        this.logger.logApiResponse(
          response.config.method?.toUpperCase() || 'UNKNOWN',
          response.config.url || '',
          response.status
        );
        return response;
      },
      (error) => {
        this.logger.error('API request failed', {
          method: error.config?.method?.toUpperCase(),
          url: error.config?.url,
          status: error.response?.status,
          message: error.message,
        });
        return Promise.reject(this.handleApiError(error));
      }
    );
  }

  /**
   * Handle API errors and convert to appropriate error types
   */
  private handleApiError(error: any): Error {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message = error.response?.data?.message || error.message;

      switch (status) {
        case 401:
          return new AuthenticationError('Invalid API key or authentication failed');
        case 403:
          return new AuthenticationError('Insufficient permissions');
        case 404:
          return new NotFoundError('Resource not found');
        case 400:
          return new ValidationError(message);
        case 429:
          return new N8nApiError('Rate limit exceeded', 429);
        case 500:
        case 502:
        case 503:
          return new N8nApiError('n8n server error', status);
        default:
          return new N8nApiError(message || 'API request failed', status);
      }
    }

    return new N8nApiError(error.message || 'Unknown error');
  }

  /**
   * Make authenticated API request with error handling
   */
  private async makeRequest<T>(
    method: string,
    url: string,
    data?: any,
    config?: AxiosRequestConfig
  ): Promise<T> {
    try {
      const response: AxiosResponse<any> = await this.client.request({
        method,
        url,
        data,
        ...config,
      });
      
      // Handle n8n API response format - some endpoints wrap data in a 'data' property
      if (response.data && response.data.data !== undefined && 
          (url.includes('/workflows') || url.includes('/executions') || 
           url.includes('/credentials') || url.includes('/tags') || 
           url.includes('/users') || url.includes('/variables'))) {
        return response.data.data as T;
      }
      
      return response.data as T;
    } catch (error) {
      throw this.handleApiError(error);
    }
  }

  // ==================== WORKFLOW ENDPOINTS ====================

  /**
   * Get all workflows
   */
  async getWorkflows(params?: {
    active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<N8nWorkflow[]> {
    return this.makeRequest<N8nWorkflow[]>('GET', '/workflows', undefined, { params });
  }

  /**
   * Get workflow by ID with optional related data
   */
  async getWorkflow(id: string, options?: {
    includeTags?: boolean;
    includeCredentials?: boolean;
  }): Promise<N8nWorkflow> {
    const params = new URLSearchParams();
    if (options?.includeTags) params.append('includeTags', 'true');
    if (options?.includeCredentials) params.append('includeCredentials', 'true');
    
    return this.makeRequest<N8nWorkflow>('GET', `/workflows/${id}${params.toString() ? `?${params.toString()}` : ''}`);
  }

  /**
   * Create new workflow
   */
  async createWorkflow(workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    return this.makeRequest<N8nWorkflow>('POST', '/workflows', workflow);
  }

  /**
   * Update workflow
   */
  async updateWorkflow(id: string, workflow: Partial<N8nWorkflow>): Promise<N8nWorkflow> {
    return this.makeRequest<N8nWorkflow>('PUT', `/workflows/${id}`, workflow);
  }

  /**
   * Delete workflow with options
   */
  async deleteWorkflow(id: string, options?: {
    deleteExecutions?: boolean;
    deleteCredentials?: boolean;
  }): Promise<void> {
    const params = new URLSearchParams();
    if (options?.deleteExecutions) params.append('deleteExecutions', 'true');
    if (options?.deleteCredentials) params.append('deleteCredentials', 'true');
    
    return this.makeRequest<void>('DELETE', `/workflows/${id}${params.toString() ? `?${params.toString()}` : ''}`);
  }

  /**
   * Activate workflow
   */
  async activateWorkflow(id: string): Promise<N8nWorkflow> {
    return this.makeRequest<N8nWorkflow>('POST', `/workflows/${id}/activate`);
  }

  /**
   * Deactivate workflow
   */
  async deactivateWorkflow(id: string): Promise<N8nWorkflow> {
    return this.makeRequest<N8nWorkflow>('POST', `/workflows/${id}/deactivate`);
  }

  /**
   * Update workflow tags
   */
  async updateWorkflowTags(id: string, tags: string[]): Promise<N8nWorkflow> {
    return this.makeRequest<N8nWorkflow>('POST', `/workflows/${id}/tags`, { tags });
  }

  /**
   * Transfer workflow ownership
   */
  async transferWorkflow(id: string, userId: string): Promise<N8nWorkflow> {
    return this.makeRequest<N8nWorkflow>('POST', `/workflows/${id}/transfer`, { userId });
  }

  /**
   * Get workflow executions
   */
  async getWorkflowExecutions(workflowId: string, params?: {
    limit?: number;
    offset?: number;
    status?: string;
  }): Promise<PaginatedResponse<N8nExecution>> {
    return this.makeRequest<PaginatedResponse<N8nExecution>>('GET', `/workflows/${workflowId}/executions`, undefined, { params });
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(workflowId: string, executionRequest?: {
    data?: any;
    waitForCompletion?: boolean;
    timeout?: number;
  }): Promise<N8nExecution> {
    return this.makeRequest<N8nExecution>('POST', `/workflows/${workflowId}/execute`, executionRequest);
  }

  // ==================== EXECUTION ENDPOINTS ====================

  /**
   * Get all executions
   */
  async getExecutions(params?: {
    workflowId?: string;
    status?: string;
    limit?: number;
    offset?: number;
    since?: string;
    until?: string;
  }): Promise<PaginatedResponse<N8nExecution>> {
    return this.makeRequest<PaginatedResponse<N8nExecution>>('GET', '/executions', undefined, { params });
  }

  /**
   * Get execution by ID
   */
  async getExecution(id: string): Promise<N8nExecution> {
    return this.makeRequest<N8nExecution>('GET', `/executions/${id}`);
  }

  /**
   * Delete execution
   */
  async deleteExecution(id: string): Promise<void> {
    return this.makeRequest<void>('DELETE', `/executions/${id}`);
  }

  /**
   * Manually trigger workflow execution
   */
  async triggerExecution(workflowId: string, data?: any): Promise<N8nExecution> {
    return this.makeRequest<N8nExecution>('POST', '/executions', {
      workflowId,
      data,
    });
  }

  /**
   * Retry execution
   */
  async retryExecution(id: string): Promise<N8nExecution> {
    return this.makeRequest<N8nExecution>('POST', `/executions/${id}/retry`);
  }

  /**
   * Stop execution
   */
  async stopExecution(id: string): Promise<N8nExecution> {
    return this.makeRequest<N8nExecution>('POST', `/executions/${id}/stop`);
  }

  // ==================== CREDENTIAL ENDPOINTS ====================

  /**
   * Get credentials with optional parameters
   * Note: Some n8n instances may require different endpoints or methods
   */
  async getCredentials(params?: {
    limit?: number;
    offset?: number;
    includeSensitiveData?: boolean;
  }): Promise<PaginatedResponse<N8nCredential>> {
    try {
      // Try GET first (standard REST approach)
      return await this.makeRequest<PaginatedResponse<N8nCredential>>('GET', '/credentials', undefined, { params });
    } catch (error: any) {
      // If GET fails with method not allowed, try different approaches
      if (error.response?.status === 405) {
        this.logger.info('GET method not allowed for credentials, trying alternative approaches', { endpoint: '/credentials' });

        try {
          // Try POST with filter body
          return await this.makeRequest<PaginatedResponse<N8nCredential>>('POST', '/credentials/search', params || {});
        } catch (postError: any) {
          // If that fails, try a different endpoint pattern
          try {
            return await this.makeRequest<PaginatedResponse<N8nCredential>>('POST', '/credentials/list', params || {});
          } catch (listError: any) {
            // Return empty result with warning rather than failing completely
            this.logger.warn('All credential listing methods failed, returning empty result', {
              originalError: error.message,
              postError: postError.message,
              listError: listError.message
            });
            return {
              data: [],
              total: 0,
              pagination: {
                page: 1,
                limit: params?.limit || 50,
                total: 0,
                totalPages: 0
              }
            };
          }
        }
      }
      throw error;
    }
  }

  /**
   * Get credential by ID
   */
  async getCredential(id: string): Promise<N8nCredential> {
    return this.makeRequest<N8nCredential>('GET', `/credentials/${id}`);
  }

  /**
   * Create new credential
   */
  async createCredential(credential: Partial<N8nCredential>): Promise<N8nCredential> {
    return this.makeRequest<N8nCredential>('POST', '/credentials', credential);
  }

  /**
   * Update credential
   */
  async updateCredential(id: string, credential: Partial<N8nCredential>): Promise<N8nCredential> {
    return this.makeRequest<N8nCredential>('PUT', `/credentials/${id}`, credential);
  }

  /**
   * Delete credential
   */
  async deleteCredential(id: string): Promise<void> {
    return this.makeRequest<void>('DELETE', `/credentials/${id}`);
  }

  /**
   * Test credential
   */
  async testCredential(id: string): Promise<{ success: boolean; message?: string }> {
    return this.makeRequest<{ success: boolean; message?: string }>('POST', `/credentials/${id}/test`);
  }

  /**
   * Transfer credential ownership
   */
  async transferCredential(id: string, userId: string): Promise<N8nCredential> {
    return this.makeRequest<N8nCredential>('POST', `/credentials/${id}/transfer`, { userId });
  }

  // ==================== TAG ENDPOINTS ====================

  /**
   * Get all tags
   */
  async getTags(): Promise<N8nTag[]> {
    return this.makeRequest<N8nTag[]>('GET', '/tags');
  }

  /**
   * Get tag by ID
   */
  async getTag(id: string): Promise<N8nTag> {
    return this.makeRequest<N8nTag>('GET', `/tags/${id}`);
  }

  /**
   * Create new tag
   */
  async createTag(tag: Partial<N8nTag>): Promise<N8nTag> {
    return this.makeRequest<N8nTag>('POST', '/tags', tag);
  }

  /**
   * Update tag
   */
  async updateTag(id: string, tag: Partial<N8nTag>): Promise<N8nTag> {
    return this.makeRequest<N8nTag>('PUT', `/tags/${id}`, tag);
  }

  /**
   * Delete tag
   */
  async deleteTag(id: string): Promise<void> {
    return this.makeRequest<void>('DELETE', `/tags/${id}`);
  }

  // ==================== USER ENDPOINTS ====================

  /**
   * Get all users
   */
  async getUsers(): Promise<N8nUser[]> {
    return this.makeRequest<N8nUser[]>('GET', '/users');
  }

  /**
   * Get user by ID
   */
  async getUser(id: string): Promise<N8nUser> {
    return this.makeRequest<N8nUser>('GET', `/users/${id}`);
  }

  // ==================== VARIABLE ENDPOINTS ====================

  /**
   * Get all variables
   */
  async getVariables(): Promise<N8nVariable[]> {
    return this.makeRequest<N8nVariable[]>('GET', '/variables');
  }

  /**
   * Get variable by ID
   */
  async getVariable(id: string): Promise<N8nVariable> {
    return this.makeRequest<N8nVariable>('GET', `/variables/${id}`);
  }

  /**
   * Create new variable
   */
  async createVariable(variable: Partial<N8nVariable>): Promise<N8nVariable> {
    return this.makeRequest<N8nVariable>('POST', '/variables', variable);
  }

  /**
   * Update variable
   */
  async updateVariable(id: string, variable: Partial<N8nVariable>): Promise<N8nVariable> {
    return this.makeRequest<N8nVariable>('PUT', `/variables/${id}`, variable);
  }

  /**
   * Delete variable
   */
  async deleteVariable(id: string): Promise<void> {
    return this.makeRequest<void>('DELETE', `/variables/${id}`);
  }

  // ==================== FILE UPLOAD ENDPOINTS ====================

  /**
   * Upload file (if supported by n8n instance)
   */
  async uploadFile(file: Buffer, filename: string, mimeType: string): Promise<{ id: string; url: string }> {
    const formData = new FormData();
    formData.append('file', new Blob([file], { type: mimeType }), filename);

    return this.makeRequest<{ id: string; url: string }>('POST', '/files', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  /**
   * Upload workflow file
   */
  async uploadWorkflow(fileContent: Buffer, params: {
    filename: string;
    mimeType: string;
  }): Promise<{ id: string; url: string; workflow?: N8nWorkflow }> {
    const formData = new FormData();
    formData.append('file', new Blob([fileContent]), params.filename);
    formData.append('mimeType', params.mimeType);
    
    return this.makeRequest<{ id: string; url: string; workflow?: N8nWorkflow }>('POST', '/workflows/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // ==================== UTILITY METHODS ====================

  /**
   * Check API connectivity
   */
  async checkConnectivity(): Promise<boolean> {
    try {
      await this.makeRequest('GET', '/workflows');
      return true;
    } catch (error) {
      this.logger.error('API connectivity check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      return false;
    }
  }

  /**
   * Get API health status
   */
  async getHealthStatus(): Promise<{ status: string; version?: string }> {
    try {
      // Health endpoint is at root domain, not under API path
      const baseUrl = this.config.n8nApiUrl.replace('/api/v1', '');
      const healthUrl = `${baseUrl}/healthz`;
      
      const response = await axios.get(healthUrl, {
        headers: {
          'Content-Type': 'application/json',
          'X-N8N-API-KEY': this.config.n8nApiKey,
        },
        timeout: 10000
      });
      
      return { 
        status: response.data.status || 'ok', 
        version: response.data.version 
      };
    } catch (error) {
      return { status: 'unhealthy' };
    }
  }

  /**
   * Get webhook URL for workflow
   */
  getWebhookUrl(workflowName: string): string {
    const baseUrl = this.config.n8nApiUrl.replace('/api/v1', '');
    return `${baseUrl}/webhook/${workflowName}`;
  }
}

/**
 * Create n8n API client instance
 */
export function createApiService(config: EnvConfig): N8nApiClient {
  return new N8nApiClient(config);
} 