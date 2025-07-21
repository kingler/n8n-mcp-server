/**
 * Test Setup File
 *
 * This file configures the test environment for Jest.
 */

import dotenv from 'dotenv';

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Set test environment
process.env['NODE_ENV'] = 'test';

// Global test timeout (if needed)
// jest.setTimeout(30000); 