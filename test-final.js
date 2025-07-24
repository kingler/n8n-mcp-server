#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function finalTest() {
  console.log('=== N8N MCP Server Response Test ===\n');
  
  const env = {
    ...process.env,
    MCP_MODE: 'true',
    N8N_API_URL: 'http://localhost:5678',
    N8N_API_KEY: process.env.N8N_API_KEY || 'test-key',
    LOG_LEVEL: 'info'
  };

  const server = spawn('node', [join(__dirname, 'start.js')], {
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let responseCount = 0;

  // Handle stdout
  server.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        try {
          const json = JSON.parse(line);
          responseCount++;
          console.log(`Response ${responseCount}:`, JSON.stringify(json, null, 2));
        } catch (e) {
          // Not JSON
        }
      }
    }
  });

  // Handle stderr with timestamps
  server.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.error(`[${new Date().toISOString()}] ${output}`);
    }
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Send initialize message
  console.log('\nSending initialize message...');
  const initMsg = JSON.stringify({
    jsonrpc: "2.0",
    id: 0,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: {
        name: "n8n-test",
        version: "1.0.0"
      }
    }
  }) + '\n';
  
  server.stdin.write(initMsg);

  // Wait for response
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Summary
  console.log('\n=== Test Summary ===');
  console.log(`Responses received: ${responseCount}`);
  console.log(`Test status: ${responseCount > 0 ? 'PASSED ✅' : 'FAILED ❌'}`);
  
  if (responseCount === 0) {
    console.log('\nThe MCP server is not responding to the initialize message.');
    console.log('This indicates a protocol handling issue in the server implementation.');
  }

  server.kill();
  process.exit(responseCount > 0 ? 0 : 1);
}

finalTest().catch(console.error);