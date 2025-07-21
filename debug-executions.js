#!/usr/bin/env node

/**
 * Debug the List Executions tool specifically
 */

import dotenv from 'dotenv';
dotenv.config();

// Set up environment
process.env.N8N_API_URL = process.env.N8N_API_URL || 'https://n8n.vividwalls.blog/api/v1';
process.env.N8N_API_KEY = process.env.N8N_API_KEY || 'test-key';
process.env.LOG_LEVEL = 'info';

console.log('🔍 Debugging List Executions Tool...\n');

async function debugListExecutions() {
  try {
    const { ListExecutionsHandler } = await import('./build/tools/execution/list.js');
    const handler = new ListExecutionsHandler();
    
    console.log('Testing List Executions with detailed logging...');
    
    // Test with basic parameters
    const result = await handler.execute({ limit: 3 });
    
    console.log('Result structure:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.success) {
      console.log('✅ List Executions test passed');
      console.log(`   - Found ${result.data?.executions?.length || 0} executions`);
      console.log(`   - Statistics:`, result.data?.statistics);
    } else {
      console.log('❌ List Executions test failed');
      console.log('   - Error:', result.error);
    }
    
    return true;
  } catch (error) {
    console.error('❌ List Executions debug failed:', error.message);
    console.error('Stack trace:', error.stack);
    return false;
  }
}

// Run the debug
debugListExecutions().catch(error => {
  console.error('💥 Debug failed:', error);
  process.exit(1);
});
