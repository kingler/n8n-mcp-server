/**
 * n8n MCP Server Main Entry Point
 *
 * This is the main entry point for the n8n Model Context Protocol server.
 * It initializes the server and handles the connection to MCP clients.
 */

import { startServer } from './config/server.js';
import { getEnvConfig } from './config/environment.js';
import { initializeLogger } from './utils/logger.js';
import { logger } from './utils/logger.js';

/**
 * Main function to start the n8n MCP server
 */
async function main(): Promise<void> {
  try {
    // Load and validate environment configuration
    const config = getEnvConfig();
    
    // Initialize logging system
    initializeLogger(config);
    
    // Only log if not in MCP mode
    if (process.env['MCP_MODE'] !== 'true') {
      logger.info('Starting n8n MCP Server...', {
        version: '1.0.0',
        n8nApiUrl: config.n8nApiUrl,
        logLevel: config.logLevel,
      });
    }

    // Start the MCP server
    await startServer();
    
    if (process.env['MCP_MODE'] !== 'true') {
      logger.info('n8n MCP Server started successfully');
    }
    
  } catch (error) {
    console.error('Failed to start n8n MCP Server:', error);
    process.exit(1);
  }
}

// Only set up process handlers if not in MCP mode
// (MCP mode handlers are set up in server.ts)
if (process.env['MCP_MODE'] !== 'true') {
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', { error: error.message, stack: error.stack });
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled promise rejection:', { reason, promise });
    process.exit(1);
  });
}

// Start the server if this file is run directly or via start.js
const isDirectRun = import.meta.url === `file://${process.argv[1]}`;
const isStartScript = process.argv[1]?.endsWith('/start.js');

if (isDirectRun || isStartScript) {
  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { main }; 