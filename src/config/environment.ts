/**
 * Environment Configuration Module
 *
 * This module handles environment variable loading and validation
 * for the n8n MCP server.
 */

import { z } from 'zod';
import dotenv from 'dotenv';
import path, { join } from 'path';
import { existsSync } from 'fs';
import type { EnvConfig } from '../types/index.js';
import { ValidationError } from '../errors/index.js';

// Get the directory of the current module
// Use path.join approach for both test and production environments
// This avoids import.meta issues while maintaining functionality
const configDir = path.join(process.cwd(), 'src', 'config');

// Load environment variables from .env file using absolute path
const projectRoot = join(configDir, '..', '..');
const envPath = join(projectRoot, '.env');

// Load environment variables immediately, before any other imports
const dotenvResult = dotenv.config({ path: envPath });

/**
 * Environment variable validation schema
 */
const envSchema = z.object({
  // Required n8n API configuration
  N8N_API_URL: z.string().url('N8N_API_URL must be a valid URL'),
  N8N_API_KEY: z.string().min(1, 'N8N_API_KEY is required'),
  
  // Optional n8n webhook configuration
  N8N_WEBHOOK_USERNAME: z.string().optional(),
  N8N_WEBHOOK_PASSWORD: z.string().optional(),
  
  // Logging configuration
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug', 'verbose']).default('info'),
  
  // Server configuration
  PORT: z.string().transform(val => parseInt(val, 10)).default('3000'),
  
  // Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  
  // Optional timeout configuration
  API_TIMEOUT: z.string().transform(val => parseInt(val, 10)).default('30000'),
  
  // Optional retry configuration
  API_RETRY_ATTEMPTS: z.string().transform(val => parseInt(val, 10)).default('3'),
  API_RETRY_DELAY: z.string().transform(val => parseInt(val, 10)).default('1000'),
});

/**
 * Validate and load environment configuration
 */
export function loadEnvironmentVariables(): EnvConfig {
  try {
    // Use console.error for MCP compatibility instead of logger (which isn't initialized yet)
    console.error('Loading environment configuration...');

    // Debug: Log what we're trying to validate
    console.error('About to validate environment variables:', {
      N8N_API_URL: process.env['N8N_API_URL'],
      N8N_API_KEY: process.env['N8N_API_KEY'] ? '[REDACTED]' : 'undefined',
      LOG_LEVEL: process.env['LOG_LEVEL'],
      PORT: process.env['PORT'],
      NODE_ENV: process.env['NODE_ENV']
    });

    // Validate environment variables
    const validatedEnv = envSchema.parse(process.env);
    
    // Transform to internal config format
    const config: EnvConfig = {
      n8nApiUrl: validatedEnv.N8N_API_URL,
      n8nApiKey: validatedEnv.N8N_API_KEY,
      n8nWebhookUsername: validatedEnv.N8N_WEBHOOK_USERNAME || '',
      n8nWebhookPassword: validatedEnv.N8N_WEBHOOK_PASSWORD || '',
      logLevel: validatedEnv.LOG_LEVEL,
      port: validatedEnv.PORT,
    };
    
    console.error('Environment configuration loaded successfully', {
      n8nApiUrl: config.n8nApiUrl,
      logLevel: config.logLevel,
      hasWebhookAuth: !!(config.n8nWebhookUsername && config.n8nWebhookPassword),
    });
    
    return config;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Zod validation errors:', error.errors);
      const validationErrors = error.errors.map(err =>
        `${err.path.join('.')}: ${err.message}`
      ).join(', ');

      throw new ValidationError(
        `Environment validation failed: ${validationErrors}`,
        'environment'
      );
    }
    
    throw new ValidationError(
      'Failed to load environment configuration',
      'environment'
    );
  }
}

/**
 * Get environment configuration with caching
 */
let cachedConfig: EnvConfig | null = null;

export function getEnvConfig(): EnvConfig {
  if (!cachedConfig) {
    cachedConfig = loadEnvironmentVariables();
  }
  return cachedConfig;
}

/**
 * Reset cached configuration (useful for testing)
 */
export function resetEnvConfig(): void {
  cachedConfig = null;
}

/**
 * Validate specific configuration values
 */
export function validateConfig(config: Partial<EnvConfig>): void {
  const errors: string[] = [];
  
  if (!config.n8nApiUrl) {
    errors.push('n8nApiUrl is required');
  } else if (!isValidUrl(config.n8nApiUrl)) {
    errors.push('n8nApiUrl must be a valid URL');
  }
  
  if (!config.n8nApiKey) {
    errors.push('n8nApiKey is required');
  }
  
  if (config.logLevel && !['error', 'warn', 'info', 'debug', 'verbose'].includes(config.logLevel)) {
    errors.push('logLevel must be one of: error, warn, info, debug, verbose');
  }
  
  if (errors.length > 0) {
    throw new ValidationError(
      `Configuration validation failed: ${errors.join(', ')}`,
      'configuration'
    );
  }
}

/**
 * Check if URL is valid
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get configuration for specific environment
 */
export function getConfigForEnvironment(env: string): EnvConfig {
  const config = getEnvConfig();
  
  // Override with environment-specific settings
  if (env === 'test') {
    return {
      ...config,
      logLevel: 'error', // Reduce logging in tests
    };
  }
  
  if (env === 'production') {
    return {
      ...config,
      logLevel: config.logLevel === 'debug' ? 'info' : config.logLevel, // Reduce debug logging in production
    };
  }
  
  return config;
}

/**
 * Export configuration types for convenience
 */
export type { EnvConfig }; 