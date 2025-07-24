#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Create a minimal MCP server
const server = new Server({
  name: 'test-server',
  version: '1.0.0',
});

// Add a simple tool
server.setRequestHandler({
  method: 'tools/list'
}, async () => {
  return {
    tools: [
      {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'A test message'
            }
          }
        }
      }
    ]
  };
});

// Connect transport
const transport = new StdioServerTransport();
await server.connect(transport);

console.error('Minimal MCP server started');