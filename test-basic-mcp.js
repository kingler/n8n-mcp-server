#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Create a minimal MCP server
const server = new Server({
  name: 'test-server',
  version: '1.0.0',
});

import { ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Add a simple tool
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [{
      name: 'test_tool',
      description: 'A test tool',
      inputSchema: {
        type: 'object',
        properties: {}
      }
    }]
  };
});

// Connect with stdio transport
const transport = new StdioServerTransport();
server.connect(transport).then(() => {
  console.error('Test server connected successfully');
}).catch(error => {
  console.error('Failed to connect:', error);
  process.exit(1);
});