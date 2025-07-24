#!/usr/bin/env node

import { createServer } from './build/config/server.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

async function testDirectServer() {
  console.error('Creating server...');
  
  const server = createServer();
  
  console.error('Server created, connecting transport...');
  
  const transport = new StdioServerTransport();
  
  // Add debugging
  transport.onMessage = (message) => {
    console.error('Transport received message:', JSON.stringify(message));
    return transport.onMessage.call(transport, message);
  };
  
  await server.connect(transport);
  
  console.error('Server connected and ready');
  
  // Keep the process alive
  process.stdin.resume();
}

testDirectServer().catch(error => {
  console.error('Failed to start test server:', error);
  process.exit(1);
});