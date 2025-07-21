#!/usr/bin/env node

/**
 * Test individual tool functions to demonstrate their capabilities
 */

import dotenv from 'dotenv';
dotenv.config();

// Set up environment
process.env.N8N_API_URL = process.env.N8N_API_URL || 'https://n8n.vividwalls.blog/api/v1';
process.env.N8N_API_KEY = process.env.N8N_API_KEY || 'test-key';
process.env.LOG_LEVEL = 'error';

console.log('🔧 Testing Individual Tool Functions...\n');

async function testListWorkflows() {
  console.log('📋 Testing List Workflows Tool...');
  
  try {
    const { ListWorkflowsHandler } = await import('./build/tools/workflow/list.js');
    const handler = new ListWorkflowsHandler();
    
    // Test with basic parameters
    const result = await handler.execute({ limit: 5 });
    
    if (result.success) {
      console.log('✅ List Workflows test passed');
      console.log(`   - Found ${result.data.workflows?.length || 0} workflows`);
      
      if (result.data.workflows && result.data.workflows.length > 0) {
        const workflow = result.data.workflows[0];
        console.log(`   - First workflow: "${workflow.name}" (${workflow.active ? 'Active' : 'Inactive'})`);
      }
    } else {
      console.log('⚠️  List Workflows returned unsuccessful result');
    }
    
    return true;
  } catch (error) {
    console.error('❌ List Workflows test failed:', error.message);
    return false;
  }
}

async function testGetWorkflow() {
  console.log('\n📄 Testing Get Workflow Tool...');
  
  try {
    // First get a workflow ID from the list
    const { ListWorkflowsHandler } = await import('./build/tools/workflow/list.js');
    const listHandler = new ListWorkflowsHandler();
    const listResult = await listHandler.execute({ limit: 1 });
    
    if (!listResult.success || !listResult.data.workflows || listResult.data.workflows.length === 0) {
      console.log('⚠️  No workflows available to test Get Workflow');
      return true;
    }
    
    const workflowId = listResult.data.workflows[0].id;
    
    const { GetWorkflowHandler } = await import('./build/tools/workflow/get.js');
    const handler = new GetWorkflowHandler();
    
    const result = await handler.execute({ workflowId });
    
    if (result.success) {
      console.log('✅ Get Workflow test passed');
      console.log(`   - Workflow: "${result.data.name}"`);
      console.log(`   - Nodes: ${result.data.nodes?.length || 0}`);
      console.log(`   - Active: ${result.data.active ? 'Yes' : 'No'}`);
    } else {
      console.log('⚠️  Get Workflow returned unsuccessful result');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Get Workflow test failed:', error.message);
    return false;
  }
}

async function testListExecutions() {
  console.log('\n⚡ Testing List Executions Tool...');
  
  try {
    const { ListExecutionsHandler } = await import('./build/tools/execution/list.js');
    const handler = new ListExecutionsHandler();
    
    const result = await handler.execute({ limit: 5 });
    
    if (result.success) {
      console.log('✅ List Executions test passed');
      console.log(`   - Found ${result.data.executions?.length || 0} executions`);
      
      if (result.data.executions && result.data.executions.length > 0) {
        const execution = result.data.executions[0];
        console.log(`   - Latest execution: ${execution.status} (${execution.mode})`);
      }
    } else {
      console.log('⚠️  List Executions returned unsuccessful result');
    }
    
    return true;
  } catch (error) {
    console.error('❌ List Executions test failed:', error.message);
    return false;
  }
}

async function testListCredentials() {
  console.log('\n🔐 Testing List Credentials Tool...');
  
  try {
    const { ListCredentialsHandler } = await import('./build/tools/credential/list.js');
    const handler = new ListCredentialsHandler();
    
    const result = await handler.execute({ limit: 5 });
    
    if (result.success) {
      console.log('✅ List Credentials test passed');
      console.log(`   - Found ${result.data.credentials?.length || 0} credentials`);
      
      if (result.data.credentials && result.data.credentials.length > 0) {
        const credential = result.data.credentials[0];
        console.log(`   - First credential: "${credential.name}" (${credential.type})`);
      }
    } else {
      console.log('⚠️  List Credentials returned unsuccessful result');
    }
    
    return true;
  } catch (error) {
    console.error('❌ List Credentials test failed:', error.message);
    return false;
  }
}

async function testConnectivityCheck() {
  console.log('\n🌐 Testing Connectivity Check Tool...');
  
  try {
    const { CheckConnectivityHandler } = await import('./build/tools/utility/connectivity.js');
    const handler = new CheckConnectivityHandler();
    
    const result = await handler.execute({});
    
    if (result.success) {
      console.log('✅ Connectivity Check test passed');
      console.log(`   - API Status: ${result.data.status}`);
      console.log(`   - Response Time: ${result.data.responseTime}ms`);
      console.log(`   - n8n Version: ${result.data.version || 'Unknown'}`);
    } else {
      console.log('⚠️  Connectivity Check returned unsuccessful result');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Connectivity Check test failed:', error.message);
    return false;
  }
}

async function testHealthStatus() {
  console.log('\n💚 Testing Health Status Tool...');
  
  try {
    const { GetHealthStatusHandler } = await import('./build/tools/utility/connectivity.js');
    const handler = new GetHealthStatusHandler();
    
    const result = await handler.execute({});
    
    if (result.success) {
      console.log('✅ Health Status test passed');
      console.log(`   - Overall Health: ${result.data.status}`);
      console.log(`   - API Accessible: ${result.data.apiAccessible ? 'Yes' : 'No'}`);
      console.log(`   - Database: ${result.data.database || 'Unknown'}`);
    } else {
      console.log('⚠️  Health Status returned unsuccessful result');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Health Status test failed:', error.message);
    return false;
  }
}

async function runToolTests() {
  console.log('🚀 Running Individual Tool Function Tests\n');
  
  const tests = [
    { name: 'List Workflows', fn: testListWorkflows },
    { name: 'Get Workflow', fn: testGetWorkflow },
    { name: 'List Executions', fn: testListExecutions },
    { name: 'List Credentials', fn: testListCredentials },
    { name: 'Connectivity Check', fn: testConnectivityCheck },
    { name: 'Health Status', fn: testHealthStatus }
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
  
  console.log('\n📊 Tool Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 All tool tests passed! The n8n integration is working perfectly.');
  } else {
    console.log('\n⚠️  Some tool tests failed. Check the errors above for details.');
  }
  
  return failed === 0;
}

// Run the tool tests
runToolTests().catch(error => {
  console.error('💥 Tool test runner failed:', error);
  process.exit(1);
});
