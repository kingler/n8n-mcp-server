/**
 * Simple Environment configuration unit tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { getEnvConfig, resetEnvConfig } from '../../../src/config/environment.js';

describe('Environment Configuration - Simple Tests', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    // Reset the cached config before each test
    resetEnvConfig();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    resetEnvConfig();
  });

  describe('getEnvConfig', () => {
    it('should return a config object when environment variables are set', () => {
      // Setup - Set required environment variables
      process.env['N8N_API_URL'] = 'https://n8n.example.com/api/v1';
      process.env['N8N_API_KEY'] = 'test-api-key';
      
      // Execute
      const config = getEnvConfig();
      
      // Assert
      expect(config).toBeDefined();
      expect(config.n8nApiUrl).toBe('https://n8n.example.com/api/v1');
      expect(config.n8nApiKey).toBe('test-api-key');
      expect(typeof config.logLevel).toBe('string');
      expect(typeof config.port).toBe('number');
    });

    it('should handle different log levels', () => {
      // Setup
      process.env['N8N_API_URL'] = 'https://n8n.example.com/api/v1';
      process.env['N8N_API_KEY'] = 'test-api-key';
      process.env['LOG_LEVEL'] = 'debug';
      
      // Execute
      const config = getEnvConfig();
      
      // Assert
      expect(config.logLevel).toBe('debug');
    });

    it('should handle port configuration', () => {
      // Setup
      process.env['N8N_API_URL'] = 'https://n8n.example.com/api/v1';
      process.env['N8N_API_KEY'] = 'test-api-key';
      process.env['PORT'] = '8080';
      
      // Execute
      const config = getEnvConfig();
      
      // Assert
      expect(config.port).toBe(8080);
    });

    it('should use default values when optional variables are not set', () => {
      // Setup - Only set required variables
      process.env['N8N_API_URL'] = 'https://n8n.example.com/api/v1';
      process.env['N8N_API_KEY'] = 'test-api-key';
      
      // Clear optional variables
      delete process.env['LOG_LEVEL'];
      delete process.env['PORT'];
      
      // Execute
      const config = getEnvConfig();
      
      // Assert
      expect(config.logLevel).toBe('info'); // default
      expect(config.port).toBe(3000); // default
    });

    it('should handle localhost URLs', () => {
      // Setup
      process.env['N8N_API_URL'] = 'http://localhost:5678/api/v1';
      process.env['N8N_API_KEY'] = 'test-api-key';
      
      // Execute
      const config = getEnvConfig();
      
      // Assert
      expect(config.n8nApiUrl).toBe('http://localhost:5678/api/v1');
    });
  });
});
