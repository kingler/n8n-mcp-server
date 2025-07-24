#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test the MCP server
async function testMCP() {
  console.log('Starting MCP test...\n');
  
  // Environment variables
  const env = {
    ...process.env,
    MCP_MODE: 'true',
    N8N_API_URL: 'http://localhost:5678',
    N8N_API_KEY: 'test-api-key',
    LOG_LEVEL: 'info'
  };

  // Spawn the server
  const server = spawn('node', [join(__dirname, 'start.js')], {
    env,
    stdio: ['pipe', 'pipe', 'inherit'] // inherit stderr for debugging
  });

  // Handle stdout
  let buffer = '';
  server.stdout.on('data', (data) => {
    buffer += data.toString();
    
    // Try to parse complete JSON messages
    let lines = buffer.split('\n');
    buffer = lines.pop() || '';
    
    for (const line of lines) {
      if (line.trim()) {
        try {
          const json = JSON.parse(line);
          console.log('SERVER RESPONSE:', JSON.stringify(json, null, 2));
        } catch (e) {
          console.log('SERVER OUTPUT:', line);
        }
      }
    }
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send initialize message
  const initMessage = {
    jsonrpc: "2.0",
    id: 0,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  };

  console.log('Sending initialize message...');
  server.stdin.write(JSON.stringify(initMessage) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Send tools/list message
  const toolsMessage = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  };

  console.log('\nSending tools/list message...');
  server.stdin.write(JSON.stringify(toolsMessage) + '\n');

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Test a tool call
  const toolCallMessage = {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "list_workflows",
      arguments: {
        limit: 10
      }
    }
  };

  console.log('\nSending tool call message...');
  server.stdin.write(JSON.stringify(toolCallMessage) + '\n');

  // Wait and then exit
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('\nTest completed.');
  server.kill();
  process.exit(0);
}

testMCP().catch(error => {
  console.error('Test failed:', error);
  process.exit(1);
});