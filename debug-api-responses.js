#!/usr/bin/env node

/**
 * Debug API responses to understand the actual structure
 */

import dotenv from 'dotenv';
dotenv.config();

// Set up environment
process.env.N8N_API_URL = process.env.N8N_API_URL || 'https://n8n.vividwalls.blog/api/v1';
process.env.N8N_API_KEY = process.env.N8N_API_KEY || 'test-key';
process.env.LOG_LEVEL = 'info';

console.log('🔍 Debugging API Responses...\n');

async function debugExecutionsAPI() {
  console.log('⚡ Debugging Executions API...');
  
  try {
    const { N8nApiClient } = await import('./build/api/n8n-client.js');
    const { getEnvConfig } = await import('./build/config/environment.js');
    
    const config = getEnvConfig();
    const client = new N8nApiClient(config);
    
    console.log('Making direct API call to /executions...');
    
    // Make a direct API call to see the raw response
    const response = await client.makeRequest('GET', '/executions', undefined, { 
      params: { limit: 3 } 
    });
    
    console.log('Raw API Response:');
    console.log(JSON.stringify(response, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Executions API debug failed:', error.message);
    console.error('Error details:', error);
    return false;
  }
}

async function debugCredentialsAPI() {
  console.log('\n🔐 Debugging Credentials API...');
  
  try {
    const { N8nApiClient } = await import('./build/api/n8n-client.js');
    const { getEnvConfig } = await import('./build/config/environment.js');
    
    const config = getEnvConfig();
    const client = new N8nApiClient(config);
    
    console.log('Testing different credentials endpoints...');
    
    // Test different endpoints and methods
    const endpoints = [
      { method: 'GET', path: '/credentials' },
      { method: 'POST', path: '/credentials' },
      { method: 'GET', path: '/credentials/for-node' },
      { method: 'POST', path: '/credentials/search' },
      { method: 'POST', path: '/credentials/list' }
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\nTrying ${endpoint.method} ${endpoint.path}...`);
        const response = await client.makeRequest(endpoint.method, endpoint.path, 
          endpoint.method === 'POST' ? { limit: 3 } : undefined,
          endpoint.method === 'GET' ? { params: { limit: 3 } } : undefined
        );
        
        console.log(`✅ ${endpoint.method} ${endpoint.path} succeeded:`);
        console.log(JSON.stringify(response, null, 2));
        break; // Stop on first success
      } catch (error) {
        console.log(`❌ ${endpoint.method} ${endpoint.path} failed: ${error.message}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('❌ Credentials API debug failed:', error.message);
    return false;
  }
}

async function debugWorkflowsAPI() {
  console.log('\n📋 Debugging Workflows API (for comparison)...');
  
  try {
    const { N8nApiClient } = await import('./build/api/n8n-client.js');
    const { getEnvConfig } = await import('./build/config/environment.js');
    
    const config = getEnvConfig();
    const client = new N8nApiClient(config);
    
    console.log('Making direct API call to /workflows...');
    
    const response = await client.makeRequest('GET', '/workflows', undefined, { 
      params: { limit: 2 } 
    });
    
    console.log('Workflows API Response Structure:');
    console.log(JSON.stringify(response, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Workflows API debug failed:', error.message);
    return false;
  }
}

async function runDebugTests() {
  console.log('🚀 Running API Response Debug Tests\n');
  
  const tests = [
    { name: 'Workflows API', fn: debugWorkflowsAPI },
    { name: 'Executions API', fn: debugExecutionsAPI },
    { name: 'Credentials API', fn: debugCredentialsAPI }
  ];
  
  for (const test of tests) {
    await test.fn();
  }
  
  console.log('\n📊 Debug session complete. Check the responses above to understand the API structure.');
}

// Run the debug tests
runDebugTests().catch(error => {
  console.error('💥 Debug test runner failed:', error);
  process.exit(1);
});
