#!/usr/bin/env node

import { spawn } from 'child_process';

// Test the minimal MCP server
async function testMinimal() {
  console.log('Testing minimal MCP server...\n');
  
  const server = spawn('node', ['test-minimal-mcp.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
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
          console.log('✅ SERVER RESPONSE:', JSON.stringify(json, null, 2));
        } catch (e) {
          console.log('📝 SERVER OUTPUT:', line);
        }
      }
    }
  });

  // Handle stderr
  server.stderr.on('data', (data) => {
    console.error('STDERR:', data.toString());
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 500));

  // Send initialize
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

  console.log('📤 Sending initialize...');
  server.stdin.write(JSON.stringify(initMessage) + '\n');

  // Wait
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send tools/list
  const toolsMessage = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  };

  console.log('📤 Sending tools/list...');
  server.stdin.write(JSON.stringify(toolsMessage) + '\n');

  // Wait
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\nTest completed.');
  server.kill();
}

testMinimal().catch(console.error);