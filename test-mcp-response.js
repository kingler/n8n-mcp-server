#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function testMCPResponse() {
  console.log('🚀 Starting N8N MCP Server Test\n');
  
  // Set up environment
  const env = {
    ...process.env,
    MCP_MODE: 'true',
    N8N_API_URL: process.env.N8N_API_URL || 'http://localhost:5678',
    N8N_API_KEY: process.env.N8N_API_KEY || 'test-api-key',
    LOG_LEVEL: 'info',
    NODE_ENV: 'test'
  };

  console.log('📋 Environment Configuration:');
  console.log(`   N8N_API_URL: ${env.N8N_API_URL}`);
  console.log(`   N8N_API_KEY: ${env.N8N_API_KEY.substring(0, 4)}...`);
  console.log(`   MCP_MODE: ${env.MCP_MODE}`);
  console.log('');

  // Spawn the server
  const serverPath = join(__dirname, 'start.js');
  console.log(`📂 Starting server from: ${serverPath}\n`);
  
  const server = spawn('node', [serverPath], {
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Track server state
  let serverReady = false;
  let responses = [];

  // Create readline interface for stdout
  const rl = readline.createInterface({
    input: server.stdout,
    crlfDelay: Infinity
  });

  // Handle stdout line by line
  rl.on('line', (line) => {
    if (line.trim()) {
      try {
        const json = JSON.parse(line);
        responses.push(json);
        console.log('✅ Received JSON response:');
        console.log(JSON.stringify(json, null, 2));
        console.log('');
        
        // Check specific responses
        if (json.id === 0 && json.result) {
          console.log('🎉 Initialize response verified!');
          console.log(`   Protocol: ${json.result.protocolVersion}`);
          console.log(`   Server: ${json.result.serverInfo?.name} v${json.result.serverInfo?.version}`);
          console.log(`   Capabilities: ${Object.keys(json.result.capabilities || {}).join(', ') || 'none'}`);
          console.log('');
        } else if (json.id === 1 && json.result?.tools) {
          console.log(`🛠️  Tools available: ${json.result.tools.length}`);
          json.result.tools.slice(0, 5).forEach(tool => {
            console.log(`   - ${tool.name}: ${tool.description}`);
          });
          if (json.result.tools.length > 5) {
            console.log(`   ... and ${json.result.tools.length - 5} more`);
          }
          console.log('');
        }
      } catch (e) {
        // Not JSON
        if (!line.includes('[winston]')) {
          console.log(`📝 Server output: ${line}`);
        }
      }
    }
  });

  // Handle stderr
  server.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output && !output.includes('[winston]')) {
      console.error(`⚠️  stderr: ${output}`);
    }
  });

  // Handle server ready
  server.on('spawn', () => {
    serverReady = true;
    console.log('✓ Server process started\n');
  });

  // Handle server exit
  server.on('close', (code) => {
    console.log(`\n📊 Test Summary:`);
    console.log(`   Server exited with code: ${code}`);
    console.log(`   Total responses received: ${responses.length}`);
    console.log(`   Test result: ${responses.length >= 2 ? 'PASSED ✅' : 'FAILED ❌'}`);
    process.exit(responses.length >= 2 ? 0 : 1);
  });

  // Wait for server to be ready
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test sequence
  const testMessages = [
    {
      name: 'Initialize',
      message: {
        jsonrpc: "2.0",
        id: 0,
        method: "initialize",
        params: {
          protocolVersion: "2025-06-18",
          capabilities: {},
          clientInfo: {
            name: "n8n-mcp-test",
            version: "1.0.0"
          }
        }
      }
    },
    {
      name: 'List Tools',
      message: {
        jsonrpc: "2.0",
        id: 1,
        method: "tools/list",
        params: {}
      }
    }
  ];

  // Send test messages
  for (const test of testMessages) {
    console.log(`\n📤 Sending ${test.name} request...`);
    server.stdin.write(JSON.stringify(test.message) + '\n');
    
    // Wait for response
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Give time for final responses
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Gracefully shutdown
  console.log('\n🛑 Shutting down server...');
  server.kill('SIGTERM');
  
  // Force exit after timeout
  setTimeout(() => {
    console.log('⏱️  Timeout reached, forcing exit');
    process.exit(1);
  }, 5000);
}

// Run the test
testMCPResponse().catch((error) => {
  console.error('❌ Test failed with error:', error);
  process.exit(1);
});