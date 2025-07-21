#!/usr/bin/env node

/**
 * Direct API test to check n8n connection
 */

import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const API_URL = process.env.N8N_API_URL || 'https://n8n.vividwalls.blog/api/v1';
const API_KEY = process.env.N8N_API_KEY;

async function testAPI() {
  console.log('Testing n8n API directly...\n');
  console.log(`API URL: ${API_URL}`);
  console.log(`API Key: ${API_KEY ? 'Present' : 'Missing'}\n`);

  try {
    // Test workflows endpoint
    console.log('Testing GET /workflows...');
    const response = await axios.get(`${API_URL}/workflows`, {
      headers: {
        'X-N8N-API-KEY': API_KEY,
        'Accept': 'application/json'
      },
      params: {
        limit: 5
      }
    });

    console.log(`Status: ${response.status}`);
    console.log(`Response data:`, JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('API Error:', error.response?.status, error.response?.statusText);
    console.error('Error details:', error.response?.data || error.message);
  }
}

testAPI();