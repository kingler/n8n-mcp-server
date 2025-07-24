#!/usr/bin/env node
import { spawn } from 'child_process';

console.error('Starting MCP server debug test...');

const server = spawn('node', ['start.js'], {
  env: {
    ...process.env,
    MCP_MODE: 'true',
    N8N_API_URL: 'https://n8n.vividwalls.blog/api/v1',
    N8N_API_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MjE0ZmE5OS1iYzM2LTQwNWUtYjU2Zi01MWI1MDk3N2IxZGIiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzUyNTAyNTU0fQ.stkXNJ8HK7jKxMLeUOtw3bY1n-y6wm7Rq5dK6zgcaOY',
    LOG_LEVEL: 'error'
  }
});

server.stdout.on('data', (data) => {
  console.log('STDOUT:', data.toString());
});

server.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});

server.on('error', (error) => {
  console.error('Server spawn error:', error);
});

server.on('exit', (code, signal) => {
  console.error(`Server exited with code ${code} and signal ${signal}`);
});

// Send initialize message
setTimeout(() => {
  const initMessage = JSON.stringify({
    jsonrpc: '2.0',
    id: 0,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    }
  }) + '\n';
  
  console.error('Sending initialize message:', initMessage);
  server.stdin.write(initMessage);
}, 1000);

// Keep process alive for 5 seconds
setTimeout(() => {
  console.error('Test complete, exiting...');
  server.kill();
  process.exit(0);
}, 5000);