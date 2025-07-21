#!/usr/bin/env node

/**
 * Direct test of n8n MCP Server tools
 * This tests the tool handlers directly without MCP protocol
 */

import dotenv from 'dotenv';
dotenv.config();

// Set up environment
process.env.N8N_API_URL = process.env.N8N_API_URL || 'https://n8n.vividwalls.blog/api/v1';
process.env.N8N_API_KEY = process.env.N8N_API_KEY || '';

import { getEnvConfig } from './build/config/environment.js';
import { initializeLogger } from './build/utils/logger.js';
import { ToolRegistry } from './build/tools/registry.js';

async function testTools() {
  console.log('🚀 Testing n8n MCP Server tools directly...\n');

  try {
    // Initialize environment and logger
    const config = getEnvConfig();
    initializeLogger(config);
    
    console.log('✅ Environment configured');
    console.log(`   API URL: ${config.n8nApiUrl}`);
    console.log(`   Log Level: ${config.logLevel}\n`);

    // Create tool registry
    const registry = new ToolRegistry();
    const availableTools = registry.getAvailableTools();
    
    console.log(`📋 Found ${availableTools.length} tools:`);
    availableTools.forEach((tool, index) => {
      console.log(`   ${index + 1}. ${tool}`);
    });
    console.log('');

    // Test connectivity check
    console.log('🔌 Testing check_connectivity tool...');
    try {
      const connectivityResult = await registry.executeTool('check_connectivity', {});
      console.log('✅ Connectivity check:', connectivityResult.success ? 'PASSED' : 'FAILED');
      if (connectivityResult.data) {
        console.log('   Response:', JSON.stringify(connectivityResult.data, null, 2));
      }
    } catch (error) {
      console.error('❌ Connectivity check failed:', error.message);
    }
    console.log('');

    // Test list workflows
    console.log('📂 Testing list_workflows tool...');
    try {
      const workflowsResult = await registry.executeTool('list_workflows', {
        limit: 5,
        active: true
      });
      console.log('✅ List workflows:', workflowsResult.success ? 'PASSED' : 'FAILED');
      if (workflowsResult.data) {
        console.log(`   Found ${workflowsResult.data.workflows?.length || 0} workflows`);
        workflowsResult.data.workflows?.forEach((wf, i) => {
          console.log(`   ${i + 1}. ${wf.name} (ID: ${wf.id}, Active: ${wf.active})`);
        });
      }
    } catch (error) {
      console.error('❌ List workflows failed:', error.message);
    }

    console.log('\n✅ Tool testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run the test
testTools();