#!/usr/bin/env node

import { spawn } from 'child_process';
import readline from 'readline';

async function testDebug() {
  console.log('Starting debug test...\n');
  
  const server = spawn('node', ['test-debug-server.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Create readline for stdout
  const rl = readline.createInterface({
    input: server.stdout,
    crlfDelay: Infinity
  });

  // Handle stdout
  rl.on('line', (line) => {
    console.log('STDOUT:', line);
  });

  // Handle stderr
  server.stderr.on('data', (data) => {
    console.error('STDERR:', data.toString());
  });

  // Wait for startup
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Send initialize
  const init = {
    jsonrpc: "2.0",
    id: 0,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: {
        name: "debug-client",
        version: "1.0.0"
      }
    }
  };

  console.log('\nSending initialize...');
  server.stdin.write(JSON.stringify(init) + '\n');

  // Wait
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Send tools/list
  const tools = {
    jsonrpc: "2.0",
    id: 1,
    method: "tools/list",
    params: {}
  };

  console.log('\nSending tools/list...');
  server.stdin.write(JSON.stringify(tools) + '\n');

  // Wait
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  console.log('\nKilling server...');
  server.kill();
}

testDebug().catch(console.error);