#!/usr/bin/env node
import { dirname } from 'path';
import { fileURLToPath } from 'url';

// Debug logging
if (process.env.DEBUG_MCP) {
  console.error('start.js: Starting...');
  console.error('start.js: Working directory:', process.cwd());
  console.error('start.js: Environment:', {
    MCP_MODE: process.env.MCP_MODE,
    N8N_API_URL: process.env.N8N_API_URL,
    LOG_LEVEL: process.env.LOG_LEVEL
  });
}

// Get the directory of this script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Change working directory to the project root
process.chdir(__dirname);

if (process.env.DEBUG_MCP) {
  console.error('start.js: Changed directory to:', __dirname);
}

// Wrapper script to suppress Node.js module type warnings
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'MODULE_TYPELESS_PACKAGE_JSON') {
    return; // Suppress this specific warning
  }
  console.error(warning);
});

// Keep the process alive
process.stdin.resume();

// Load and run the main server
import('./build/index.js').then(() => {
  if (process.env.DEBUG_MCP) {
    console.error('start.js: Server module loaded successfully');
  }
}).catch(error => {
  console.error('Failed to start server:', error);
  process.exit(1);
});