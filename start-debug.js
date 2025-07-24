#!/usr/bin/env node
import { spawn } from 'child_process';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Change to project directory
process.chdir(__dirname);

console.error('[start-debug] Starting n8n MCP server with debugging...');
console.error('[start-debug] Environment:', {
  MCP_MODE: process.env.MCP_MODE,
  N8N_API_URL: process.env.N8N_API_URL ? 'SET' : 'NOT SET',
  N8N_API_KEY: process.env.N8N_API_KEY ? 'SET' : 'NOT SET'
});

// Spawn the actual server
const server = spawn('node', ['build/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe'],
  env: process.env
});

// Pass through stdin
process.stdin.pipe(server.stdin);

// Handle stdout line by line to ensure proper message boundaries
let buffer = '';
server.stdout.on('data', (data) => {
  buffer += data.toString();
  const lines = buffer.split('\n');
  
  // Keep the last incomplete line in the buffer
  buffer = lines.pop() || '';
  
  // Process complete lines
  lines.forEach(line => {
    if (line.trim()) {
      console.error(`[start-debug] Sending response: ${line.substring(0, 100)}...`);
      process.stdout.write(line + '\n');
    }
  });
});

// Pass through stderr
server.stderr.on('data', (data) => {
  process.stderr.write(data);
});

// Handle server exit
server.on('close', (code) => {
  console.error(`[start-debug] Server exited with code ${code}`);
  process.exit(code || 0);
});

// Handle errors
server.on('error', (error) => {
  console.error('[start-debug] Server error:', error);
  process.exit(1);
});

// Keep the wrapper alive
process.stdin.resume();