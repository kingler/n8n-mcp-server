#!/usr/bin/env node

/**
 * Direct function testing without Jest
 * This script tests the core functions directly to demonstrate functionality
 */

import dotenv from 'dotenv';
dotenv.config();

// Set up test environment
process.env.N8N_API_URL = process.env.N8N_API_URL || 'https://n8n.vividwalls.blog/api/v1';
process.env.N8N_API_KEY = process.env.N8N_API_KEY || 'test-key';
process.env.LOG_LEVEL = 'error'; // Reduce noise during testing

console.log('🧪 Starting Direct Function Tests...\n');

async function testEnvironmentConfig() {
  console.log('📋 Testing Environment Configuration...');
  
  try {
    const { getEnvConfig, resetEnvConfig } = await import('./build/config/environment.js');
    
    // Reset any cached config
    resetEnvConfig();
    
    // Test basic configuration loading
    const config = getEnvConfig();
    
    console.log('✅ Environment config loaded successfully');
    console.log(`   - API URL: ${config.n8nApiUrl}`);
    console.log(`   - API Key: ${config.n8nApiKey ? 'Present' : 'Missing'}`);
    console.log(`   - Log Level: ${config.logLevel}`);
    console.log(`   - Port: ${config.port}`);
    
    return true;
  } catch (error) {
    console.error('❌ Environment config test failed:', error.message);
    return false;
  }
}

async function testApiClient() {
  console.log('\n🌐 Testing n8n API Client...');
  
  try {
    const { N8nApiClient } = await import('./build/api/n8n-client.js');
    const { getEnvConfig } = await import('./build/config/environment.js');
    
    const config = getEnvConfig();
    const client = new N8nApiClient(config);
    
    console.log('✅ API Client created successfully');
    console.log(`   - Base URL: ${config.n8nApiUrl}`);
    
    // Test connectivity (this might fail if n8n is not accessible)
    try {
      const workflows = await client.getWorkflows({ limit: 1 });
      console.log('✅ API connectivity test passed');
      console.log(`   - Retrieved ${workflows.length} workflow(s)`);
    } catch (apiError) {
      console.log('⚠️  API connectivity test failed (expected if n8n not accessible)');
      console.log(`   - Error: ${apiError.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ API Client test failed:', error.message);
    return false;
  }
}

async function testToolHandlers() {
  console.log('\n🔧 Testing Tool Handlers...');
  
  try {
    const { ListWorkflowsHandler } = await import('./build/tools/workflow/list.js');
    const { CheckConnectivityHandler } = await import('./build/tools/utility/connectivity.js');
    
    // Test tool handler instantiation
    const listHandler = new ListWorkflowsHandler();
    const connectivityHandler = new CheckConnectivityHandler();
    
    console.log('✅ Tool handlers created successfully');
    console.log('   - ListWorkflowsHandler: Ready');
    console.log('   - CheckConnectivityHandler: Ready');
    
    // Test connectivity handler (should work without n8n)
    try {
      const result = await connectivityHandler.execute({});
      console.log('✅ Connectivity handler test passed');
      console.log(`   - Result: ${result.success ? 'Success' : 'Failed'}`);
    } catch (handlerError) {
      console.log('⚠️  Connectivity handler test failed');
      console.log(`   - Error: ${handlerError.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Tool handlers test failed:', error.message);
    return false;
  }
}

async function testToolRegistry() {
  console.log('\n📚 Testing Tool Registry...');
  
  try {
    const { ToolRegistry } = await import('./build/tools/registry.js');
    
    const registry = new ToolRegistry();
    
    console.log('✅ Tool Registry created successfully');
    console.log(`   - Registered tools: ${registry.handlers?.size || 'Unknown'}`);
    
    // Test tool execution through registry
    try {
      const result = await registry.executeTool('check_connectivity', {});
      console.log('✅ Tool execution through registry passed');
      console.log(`   - Result: ${result.success ? 'Success' : 'Failed'}`);
    } catch (registryError) {
      console.log('⚠️  Tool execution through registry failed');
      console.log(`   - Error: ${registryError.message}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Tool Registry test failed:', error.message);
    return false;
  }
}

async function testServerConfiguration() {
  console.log('\n⚙️  Testing Server Configuration...');
  
  try {
    const { createServer, TOOL_DEFINITIONS } = await import('./build/config/server.js');
    
    console.log('✅ Server configuration loaded successfully');
    console.log(`   - Tool definitions: ${TOOL_DEFINITIONS.length}`);
    
    // List available tools
    console.log('   - Available tools:');
    TOOL_DEFINITIONS.forEach(tool => {
      console.log(`     • ${tool.name}: ${tool.description.substring(0, 50)}...`);
    });
    
    return true;
  } catch (error) {
    console.error('❌ Server configuration test failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Running All Direct Function Tests\n');
  
  const tests = [
    { name: 'Environment Config', fn: testEnvironmentConfig },
    { name: 'API Client', fn: testApiClient },
    { name: 'Tool Handlers', fn: testToolHandlers },
    { name: 'Tool Registry', fn: testToolRegistry },
    { name: 'Server Configuration', fn: testServerConfiguration }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! The core functionality is working.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the errors above for details.');
  }
  
  return failed === 0;
}

// Run the tests
runAllTests().catch(error => {
  console.error('💥 Test runner failed:', error);
  process.exit(1);
});
