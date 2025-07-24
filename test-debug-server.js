#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

console.error('[DEBUG] Starting debug server...');

// Create server
const server = new Server({
  name: 'n8n-mcp-debug',
  version: '1.0.0',
});

console.error('[DEBUG] Server created');

// Add handlers
server.setRequestHandler(ListToolsRequestSchema, async () => {
  console.error('[DEBUG] Handling tools/list request');
  return {
    tools: [
      {
        name: 'test_tool',
        description: 'A test tool',
        inputSchema: {
          type: 'object',
          properties: {
            message: { type: 'string' }
          }
        }
      }
    ]
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  console.error('[DEBUG] Handling tool call:', request.params.name);
  return {
    content: [
      {
        type: 'text',
        text: `Called ${request.params.name}`
      }
    ]
  };
});

console.error('[DEBUG] Handlers registered');

// Connect transport
const transport = new StdioServerTransport();

console.error('[DEBUG] Transport created, connecting...');

try {
  await server.connect(transport);
  console.error('[DEBUG] Server connected successfully');
} catch (error) {
  console.error('[DEBUG] Failed to connect:', error);
  process.exit(1);
}

// Keep alive
process.stdin.resume();