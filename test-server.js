#!/usr/bin/env node

/**
 * Test script for n8n MCP Server
 * This script starts the server and tests tool availability
 */

import { spawn } from 'child_process';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

async function testServer() {
  console.log('🚀 Starting n8n MCP Server test...\n');

  try {
    // Create a client transport
    const transport = new StdioClientTransport({
      command: 'node',
      args: ['start.js'],
      env: {
        ...process.env,
        N8N_API_URL: process.env.N8N_API_URL,
        N8N_API_KEY: process.env.N8N_API_KEY,
        LOG_LEVEL: 'debug'
      }
    });

    // Create MCP client
    const client = new Client({
      name: 'n8n-mcp-test-client',
      version: '1.0.0'
    }, {
      capabilities: {}
    });

    // Connect to the server
    await client.connect(transport);
    console.log('✅ Connected to MCP server\n');

    // List available tools
    console.log('📋 Listing available tools...');
    const toolsResponse = await client.listTools();
    console.log(`Found ${toolsResponse.tools.length} tools:\n`);
    
    toolsResponse.tools.forEach((tool, index) => {
      console.log(`${index + 1}. ${tool.name}`);
      console.log(`   Description: ${tool.description}`);
      console.log(`   Input schema: ${JSON.stringify(tool.inputSchema, null, 2)}\n`);
    });

    // Test connectivity check tool
    console.log('🔌 Testing connectivity check...');
    try {
      const connectivityResult = await client.callTool({
        name: 'check_connectivity',
        arguments: {}
      });
      console.log('Connectivity check result:', JSON.stringify(connectivityResult, null, 2));
    } catch (error) {
      console.error('Connectivity check failed:', error.message);
    }

    // Test list workflows tool
    console.log('\n📂 Testing list_workflows tool...');
    try {
      const workflowsResult = await client.callTool({
        name: 'list_workflows',
        arguments: {
          limit: 5
        }
      });
      console.log('List workflows result:', JSON.stringify(workflowsResult, null, 2));
    } catch (error) {
      console.error('List workflows failed:', error.message);
    }

    // Close the connection
    await client.close();
    console.log('\n✅ Test completed successfully!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testServer();