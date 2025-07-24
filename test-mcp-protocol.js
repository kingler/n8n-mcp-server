#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testMCPProtocol() {
  log('Starting MCP Protocol Test...', colors.bright + colors.cyan);
  
  // Set up environment variables
  const env = {
    ...process.env,
    MCP_MODE: 'true',
    N8N_API_URL: process.env.N8N_API_URL || 'http://localhost:5678',
    N8N_API_KEY: process.env.N8N_API_KEY || 'test-api-key',
    LOG_LEVEL: 'debug',
    NODE_ENV: 'development',
    DEBUG_MCP: 'true'
  };

  log('\nEnvironment:', colors.yellow);
  Object.entries(env).forEach(([key, value]) => {
    if (key.includes('N8N') || key.includes('MCP') || key.includes('LOG')) {
      log(`  ${key}: ${key.includes('KEY') ? '[SET]' : value}`, colors.dim);
    }
  });

  // Spawn the server
  const serverPath = join(__dirname, 'start.js');
  log(`\nSpawning server from: ${serverPath}`, colors.blue);
  
  const server = spawn('node', [serverPath], {
    env,
    stdio: ['pipe', 'pipe', 'pipe']
  });

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
        log('\n📥 SERVER RESPONSE (JSON):', colors.bright + colors.green);
        log(JSON.stringify(json, null, 2), colors.green);
        
        // Check if it's the initialize response
        if (json.id === 0 && json.result) {
          log('\n✅ Initialize response received!', colors.bright + colors.green);
          log(`  Protocol Version: ${json.result.protocolVersion || 'not specified'}`, colors.green);
          log(`  Server Name: ${json.result.serverInfo?.name || 'not specified'}`, colors.green);
          log(`  Server Version: ${json.result.serverInfo?.version || 'not specified'}`, colors.green);
          log(`  Number of tools: ${json.result.capabilities?.tools ? 'supported' : 'not supported'}`, colors.green);
        }
      } catch (e) {
        // Not JSON, log as regular output
        log(`[stdout] ${line}`, colors.dim);
      }
    }
  });

  // Handle server stderr
  server.stderr.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        if (line.includes('start.js:') || line.includes('DEBUG')) {
          log(`[debug] ${line}`, colors.magenta);
        } else {
          log(`[stderr] ${line}`, colors.red);
        }
      }
    }
  });

  // Handle server errors
  server.on('error', (error) => {
    log(`\n❌ Failed to start server: ${error.message}`, colors.bright + colors.red);
    process.exit(1);
  });

  // Handle server exit
  server.on('close', (code) => {
    log(`\n🛑 Server exited with code: ${code}`, colors.yellow);
    process.exit(code || 0);
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Test sequence
  const messages = [
    {
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
    },
    {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {}
    }
  ];

  // Send messages
  for (const [index, message] of messages.entries()) {
    log(`\n📤 SENDING MESSAGE ${index + 1}:`, colors.bright + colors.blue);
    log(JSON.stringify(message, null, 2), colors.blue);
    
    server.stdin.write(JSON.stringify(message) + '\n');
    
    // Wait between messages
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Keep alive for a bit more to see any delayed responses
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  log('\n✅ Test completed. Shutting down...', colors.bright + colors.green);
  server.kill('SIGTERM');
  
  // Force exit after grace period
  setTimeout(() => {
    process.exit(0);
  }, 1000);
}

// Run the test
testMCPProtocol().catch((error) => {
  log(`\n❌ Test failed: ${error.message}`, colors.bright + colors.red);
  console.error(error);
  process.exit(1);
});