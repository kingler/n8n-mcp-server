#!/usr/bin/env node

import { spawn } from 'child_process';

const server = spawn('node', ['start.js'], {
  env: {
    ...process.env,
    MCP_MODE: 'true',
    N8N_API_URL: 'http://localhost:5678',
    N8N_API_KEY: 'test',
    DEBUG_MCP: 'true'
  },
  stdio: 'inherit'
});

setTimeout(() => {
  console.log('\nKilling server...');
  server.kill();
}, 5000);