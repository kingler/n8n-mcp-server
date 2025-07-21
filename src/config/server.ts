/**
 * Server Configuration Module
 *
 * This module configures the MCP server with all available tools and resources.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import type { 
  ToolDefinition, 
  ResourceMetadata, 
  ResourceTemplate 
} from '../types/index.js';
import { getEnvConfig } from './environment.js';
import { initializeLogger } from '../utils/logger.js';
import { ToolRegistry } from '../tools/registry.js';
import { logger } from '../utils/logger.js';
import { N8nMcpError } from '../errors/index.js';

// Import all tool handler classes to get their definitions
import { ListWorkflowsHandler } from '../tools/workflow/list.js';
import { GetWorkflowHandler } from '../tools/workflow/get.js';
import { CreateWorkflowHandler } from '../tools/workflow/create.js';
import { UpdateWorkflowHandler } from '../tools/workflow/update.js';
import { DeleteWorkflowHandler } from '../tools/workflow/delete.js';
import { ActivateWorkflowHandler } from '../tools/workflow/activate.js';
import { DeactivateWorkflowHandler } from '../tools/workflow/deactivate.js';
import { UpdateWorkflowTagsHandler } from '../tools/workflow/update-tags.js';
import { TransferWorkflowHandler } from '../tools/workflow/transfer.js';

import { ListExecutionsHandler } from '../tools/execution/list.js';
import { ExecuteWorkflowHandler } from '../tools/execution/execute.js';
import { GetExecutionHandler } from '../tools/execution/get.js';
import { DeleteExecutionHandler } from '../tools/execution/delete.js';
import { RetryExecutionHandler } from '../tools/execution/retry.js';
import { StopExecutionHandler } from '../tools/execution/stop.js';

import { ListCredentialsHandler } from '../tools/credential/list.js';
import { CreateCredentialHandler } from '../tools/credential/create.js';
import { GetCredentialHandler } from '../tools/credential/get.js';
import { UpdateCredentialHandler } from '../tools/credential/update.js';
import { DeleteCredentialHandler } from '../tools/credential/delete.js';
import { TestCredentialHandler } from '../tools/credential/test.js';
import { TransferCredentialHandler } from '../tools/credential/transfer.js';

import { ListTagsHandler } from '../tools/tag/list.js';
import { GetTagHandler } from '../tools/tag/get.js';
import { CreateTagHandler } from '../tools/tag/create.js';
import { UpdateTagHandler } from '../tools/tag/update.js';
import { DeleteTagHandler } from '../tools/tag/delete.js';

import { ListUsersHandler } from '../tools/user/list.js';
import { GetUserHandler } from '../tools/user/get.js';

import { ListVariablesHandler } from '../tools/variable/list.js';
import { GetVariableHandler } from '../tools/variable/get.js';
import { CreateVariableHandler } from '../tools/variable/create.js';
import { UpdateVariableHandler } from '../tools/variable/update.js';
import { DeleteVariableHandler } from '../tools/variable/delete.js';

import { UploadWorkflowHandler } from '../tools/upload/upload.js';
import { CheckConnectivityHandler, GetHealthStatusHandler } from '../tools/utility/connectivity.js';

/**
 * All available tool definitions - automatically generated from handler classes
 */
export const TOOL_DEFINITIONS: ToolDefinition[] = [
  // Workflow Tools  // ListWorkflowsHandler.definition, // TODO: Add missing definitions  //  // GetWorkflowHandler.definition, // TODO: Add missing definitions // TODO: Add static definition  //  // CreateWorkflowHandler.definition, // TODO: Add missing definitions // TODO: Add static definition  //  // UpdateWorkflowHandler.definition, // TODO: Add missing definitions // TODO: Add static definition  //  // DeleteWorkflowHandler.definition, // TODO: Add missing definitions // TODO: Add static definition  // ActivateWorkflowHandler.definition, // TODO: Add missing definitions  // DeactivateWorkflowHandler.definition, // TODO: Add missing definitions  // UpdateWorkflowTagsHandler.definition, // TODO: Add missing definitions  // TransferWorkflowHandler.definition, // TODO: Add missing definitions

  // Execution Tools  //  // ListExecutionsHandler.definition, // TODO: Add missing definitions // TODO: Add static definition  //  // ExecuteWorkflowHandler.definition, // TODO: Add missing definitions // TODO: Add static definition  // GetExecutionHandler.definition, // TODO: Add missing definitions  // DeleteExecutionHandler.definition, // TODO: Add missing definitions  // RetryExecutionHandler.definition, // TODO: Add missing definitions  // StopExecutionHandler.definition, // TODO: Add missing definitions

  // Credential Tools  //  // ListCredentialsHandler.definition, // TODO: Add missing definitions // TODO: Add static definition  //  // CreateCredentialHandler.definition, // TODO: Add missing definitions // TODO: Add static definition  // GetCredentialHandler.definition, // TODO: Add missing definitions  // UpdateCredentialHandler.definition, // TODO: Add missing definitions  // DeleteCredentialHandler.definition, // TODO: Add missing definitions  // TestCredentialHandler.definition, // TODO: Add missing definitions  // TransferCredentialHandler.definition, // TODO: Add missing definitions

  // Tag Tools  // ListTagsHandler.definition, // TODO: Add missing definitions  // GetTagHandler.definition, // TODO: Add missing definitions  // CreateTagHandler.definition, // TODO: Add missing definitions  // UpdateTagHandler.definition, // TODO: Add missing definitions  // DeleteTagHandler.definition, // TODO: Add missing definitions

  // User Tools  // ListUsersHandler.definition, // TODO: Add missing definitions  // GetUserHandler.definition, // TODO: Add missing definitions

  // Variable Tools  // ListVariablesHandler.definition, // TODO: Add missing definitions  // GetVariableHandler.definition, // TODO: Add missing definitions  // CreateVariableHandler.definition, // TODO: Add missing definitions  // UpdateVariableHandler.definition, // TODO: Add missing definitions  // DeleteVariableHandler.definition, // TODO: Add missing definitions

  // Upload Tools  //  // UploadWorkflowHandler.definition, // TODO: Add missing definitions // TODO: Add static definition

  // Utility Tools  // CheckConnectivityHandler.definition, // TODO: Add missing definitions  // GetHealthStatusHandler.definition, // TODO: Add missing definitions
];

/**
 * Available resources
 */
export const RESOURCES: ResourceMetadata[] = [
  {
    name: 'n8n-workflow-templates',
    description: 'Collection of n8n workflow templates and examples',
    mimeType: 'application/json',
    uri: 'https://github.com/n8n-io/n8n/tree/master/packages/cli/templates',
  },
  {
    name: 'n8n-api-documentation',
    description: 'Complete n8n API documentation',
    mimeType: 'text/markdown',
    uri: 'https://docs.n8n.io/api/',
  },
  {
    name: 'n8n-node-documentation',
    description: 'n8n node documentation and examples',
    mimeType: 'text/markdown',
    uri: 'https://docs.n8n.io/integrations/',
  },
];

/**
 * Resource templates
 */
export const RESOURCE_TEMPLATES: ResourceTemplate[] = [
  {
    name: 'basic-webhook-workflow',
    description: 'Basic webhook-triggered workflow template',
    uri: 'templates/basic-webhook-workflow.json',
  },
  {
    name: 'scheduled-workflow',
    description: 'Scheduled workflow template',
    uri: 'templates/scheduled-workflow.json',
  },
  {
    name: 'api-integration-workflow',
    description: 'API integration workflow template',
    uri: 'templates/api-integration-workflow.json',
  },
];

/**
 * Configure and create the MCP server
 */
export function createServer(): Server {
  // Initialize configuration and logging
  const config = getEnvConfig();
  initializeLogger(config);

  // Create server with stdio transport
  const server = new Server(
    {
      name: 'n8n-mcp-server',
      version: '1.0.0',
    }
  );

  // Initialize tool registry
  const toolRegistry = new ToolRegistry();
  const serverLogger = logger;

  // Setup tool handlers
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: TOOL_DEFINITIONS
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    serverLogger.info('Tool call requested', { toolName: name, args });

    try {
      // Execute the tool using the registry
      const result = await toolRegistry.executeTool(name, args);
      
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };
      
    } catch (error) {
      serverLogger.error('Tool execution failed', { toolName: name, error });
      throw error;
    }
  });

  // Register resources (placeholder - will be implemented with proper MCP resource handlers)
  // server.setRequestHandler('resources/list', async () => {
  //   return {
  //     resources: RESOURCES,
  //   };
  // });

  // server.setRequestHandler('resources/read', async (args) => {
  //   const { uri } = args;
  //   const resource = RESOURCES.find(r => r.uri === uri);
    
  //   if (!resource) {
  //     throw new Error(`Resource not found: ${uri}`);
  //   }

  //   return {
  //     contents: [
  //       {
  //       uri: resource.uri,
  //       mimeType: resource.mimeType,
  //       text: `Resource content for ${resource.name}`,
  //       },
  //     ],
  //   };
  // });

  return server;
}

/**
 * Start the MCP server
 */
export async function startServer(): Promise<void> {
  try {
    const server = createServer();
    const transport = new StdioServerTransport();
    
    await server.connect(transport);
    
    console.log('n8n MCP Server started successfully');
  } catch (error) {
    console.error('Failed to start n8n MCP Server:', error);
    process.exit(1);
  }
} 