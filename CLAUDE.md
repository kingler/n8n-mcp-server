# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Build and Development
- `npm run build` - Compile TypeScript to JavaScript (output in `build/`)
- `npm run dev` - Watch mode for TypeScript compilation
- `npm start` - Start the MCP server (runs `node start.js`)
- `npm run clean` - Remove build directory
- `npm run prebuild` - Automatically runs before build to clean

### Testing
- `npm test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- Run specific test: `npm test -- --testNamePattern="test-name"`

### Code Quality
- `npm run lint` - Run ESLint on all TypeScript files
- `npm run lint:fix` - Auto-fix ESLint issues

## Architecture Overview

This is a Model Context Protocol (MCP) server that provides comprehensive API access to n8n workflows, executions, credentials, and more. The codebase follows a modular TypeScript architecture with strict typing.

### Core Structure

1. **Entry Point**: `src/index.ts` - Initializes the MCP server with error handling and graceful shutdown

2. **Tool System**: 
   - `src/tools/base-handler.ts` - Abstract base class for all tool handlers
   - `src/tools/registry.ts` - Central registry for all available tools
   - Tool handlers organized by domain:
     - `workflow/` - Workflow management operations
     - `execution/` - Execution control and monitoring
     - `credential/` - Credential management
     - `upload/` - File upload functionality

3. **API Client**: `src/api/n8n-client.ts` - Centralized n8n API client with retry logic and error handling

4. **Configuration**:
   - `src/config/environment.ts` - Environment variable validation using Zod
   - `src/config/server.ts` - MCP server setup and tool registration

5. **Error Handling**: `src/errors/` - Custom error types and error codes

6. **Logging**: `src/utils/logger.ts` - Winston-based logging system

### Key Design Patterns

- **Handler Pattern**: Each tool operation has a dedicated handler class extending `BaseToolHandler`
- **Type Safety**: Strict TypeScript with comprehensive type definitions in `src/types/`
- **ESM Modules**: Uses ES modules (`"type": "module"` in package.json)
- **Zod Validation**: Input validation for all tool parameters and environment variables

### Environment Configuration

Required environment variables (see `env.example`):
- `N8N_API_URL` - n8n API base URL
- `N8N_API_KEY` - n8n API authentication key
- `LOG_LEVEL` - Logging level (default: info)
- Optional: `N8N_WEBHOOK_USERNAME`, `N8N_WEBHOOK_PASSWORD`, `API_TIMEOUT`, `API_RETRY_ATTEMPTS`, `API_RETRY_DELAY`

### Testing Strategy

The project uses Jest with TypeScript support:
- Unit tests in `tests/unit/`
- Integration tests in `tests/integration/`
- Test fixtures in `tests/fixtures/`
- Mock implementations in `tests/mocks/`
- Setup file: `tests/setup.ts`

Coverage goal: 80% minimum for new code, 95% for critical paths

### Important Notes

- Node.js 18+ required (uses modern ES features)
- All imports must include `.js` extension due to ESM
- Comprehensive error codes defined in `src/errors/error-codes.ts`
- Rate limiting and retry logic built into the API client
- Integration testing strategy documented in `INTEGRATION_TESTING_STRATEGY.md`