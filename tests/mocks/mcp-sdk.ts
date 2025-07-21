/**
 * Mock for @modelcontextprotocol/sdk to avoid ESM import issues in Jest
 */

export class McpError extends Error {
  public code: number;
  
  constructor(code: number, message: string) {
    super(message);
    this.name = 'McpError';
    this.code = code;
  }
} 