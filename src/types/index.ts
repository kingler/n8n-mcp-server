/**
 * Core Types Module
 *
 * This module provides type definitions used throughout the application
 * and bridges compatibility with the MCP SDK.
 */

import type { Tool as McpTool } from '@modelcontextprotocol/sdk/types.js';

// MCP Tool Definition interface
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

// Environment Configuration
export interface EnvConfig {
  n8nApiUrl: string;
  n8nApiKey: string;
  n8nWebhookUsername: string;
  n8nWebhookPassword: string;
  logLevel: string;
  port: number;
}

// n8n API Types
export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  nodes: N8nNode[];
  connections: Record<string, any>;
  settings?: Record<string, any>;
  staticData?: Record<string, any>;
  tags?: N8nTag[];
  versionId: string;
  meta?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  executions?: N8nExecution[];
  credentials?: N8nCredential[];
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  typeVersion: number;
  position: [number, number];
  parameters?: Record<string, any>;
  credentials?: Record<string, any>;
}

export interface N8nExecution {
  id: string;
  workflowId: string;
  workflowName?: string;
  status: 'running' | 'success' | 'error' | 'waiting' | 'canceled';
  startedAt: string;
  stoppedAt?: string;
  finished?: boolean;
  data?: Record<string, any>;
  mode: 'manual' | 'trigger' | 'webhook';
  retryOf?: string;
  retrySuccessId?: string;
  error?: string;
  waitTill?: string;
  executionTime?: number;
}

export interface N8nCredential {
  id: string;
  name: string;
  type: string;
  data: Record<string, any>;
  nodesAccess: N8nNodeAccess[];
  createdAt: string;
  updatedAt: string;
}

export interface N8nNodeAccess {
  nodeType: string;
  date: string;
}

export interface N8nTag {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface N8nUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface N8nVariable {
  id: string;
  key: string;
  value: string;
  createdAt: string;
  updatedAt: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  total?: number;
}

// Tool Handler Base Types
export interface ToolHandler {
  execute(args: Record<string, any>): Promise<ToolResult>;
  handle(args: Record<string, any>): Promise<ToolResult>;
}

export interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
  success?: boolean;
  data?: any;
  message?: string;
}

// Request/Response Types for Tools
export interface WorkflowCreateRequest {
  name: string;
  nodes?: N8nNode[];
  connections?: Record<string, any>;
  settings?: Record<string, any>;
  tags?: string[];
}

export interface WorkflowUpdateRequest {
  workflowId: string;
  name?: string;
  nodes?: N8nNode[];
  connections?: Record<string, any>;
  settings?: Record<string, any>;
  tags?: string[];
}

export interface CredentialCreateRequest {
  name: string;
  type: string;
  data: Record<string, any>;
  nodesAccess?: N8nNodeAccess[];
}

// Base Handler Classes
export abstract class BaseToolHandler implements ToolHandler {
  protected logger: any; // Winston logger instance

  constructor() {
    // Initialize logger
  }

  abstract execute(args: Record<string, any>): Promise<ToolResult>;
  abstract handle(args: Record<string, any>): Promise<ToolResult>;

  protected formatSuccess(data: any, message?: string): ToolResult {
    const result: ToolResult = {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ success: true, data, message }, null, 2),
        },
      ],
      success: true,
      data,
    };
    
    if (message) {
      result.message = message;
    }
    
    return result;
  }

  protected formatError(error: Error, message?: string): ToolResult {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ 
            success: false, 
            error: error.message, 
            message: message || 'Operation failed' 
          }, null, 2),
        },
      ],
      isError: true,
      success: false,
      message: message || 'Operation failed',
    };
  }

  protected async handleExecution<T>(
    operation: () => Promise<T>,
    args: Record<string, any>
  ): Promise<ToolResult> {
    try {
      const result = await operation();
      return this.formatSuccess(result);
    } catch (error) {
      return this.formatError(error as Error);
    }
  }
}

// Validation Schemas
export interface ValidationSchema {
  type: string;
  properties: Record<string, any>;
  required?: string[];
}

// Resource Types
export interface ResourceMetadata {
  name: string;
  description: string;
  mimeType: string;
  uri: string;
}

export interface ResourceTemplate {
  name: string;
  description: string;
  uri: string;
} 