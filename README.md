# n8n MCP Server

A comprehensive Model Context Protocol (MCP) server that provides AI assistants with full programmatic access to n8n workflows, executions, credentials, and more.

## 🚀 Features

### Complete n8n API Coverage
- **Workflow Management**: Create, read, update, delete, activate, deactivate workflows
- **Execution Management**: List, get, delete, trigger, retry, stop executions
- **Credential Management**: Create, read, update, delete, test credentials
- **Tag Management**: Create, list, delete tags
- **User Management**: List and get user information
- **Variable Management**: Create, read, update, delete variables
- **File Upload**: Upload files to n8n (if supported)
- **Health Monitoring**: Check API connectivity and health status

### Advanced Features
- **Comprehensive Error Handling**: Detailed error codes and messages
- **Logging System**: Winston-based logging with multiple levels and categories
- **Input Validation**: Zod-based schema validation for all inputs
- **Retry Logic**: Automatic retry for transient failures
- **Rate Limiting**: Built-in rate limit handling
- **Type Safety**: Full TypeScript support with strict typing

## 📋 Prerequisites

- Node.js 18.0.0 or higher
- n8n instance with API access
- n8n API key

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/n8n-mcp-server.git
   cd n8n-mcp-server
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your n8n configuration:
   ```env
   N8N_API_URL=http://localhost:5678/api/v1
   N8N_API_KEY=your-api-key-here
   LOG_LEVEL=info
   NODE_ENV=development
   ```

4. **Build the project**
   ```bash
   npm run build
   ```

## 🚀 Usage

### Starting the Server

```bash
npm start
```

### Development Mode

```bash
npm run dev
```

### Testing

```bash
npm test
npm run test:coverage
```

## 🔌 MCP Client Configuration

To use this MCP server with Claude Desktop or other MCP clients, add the following configuration:

### Claude Desktop Configuration

Add to your Claude Desktop configuration file:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "n8n": {
      "command": "node",
      "args": ["/path/to/n8n-mcp-server/start.js"],
      "env": {
        "N8N_API_URL": "http://localhost:5678/api/v1",
        "N8N_API_KEY": "your-n8n-api-key",
        "LOG_LEVEL": "info"
      }
    }
  }
}
```

### Configuration Options

The MCP server accepts the following environment variables in the client configuration:

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `N8N_API_URL` | n8n API base URL | Yes | `http://localhost:5678/api/v1` |
| `N8N_API_KEY` | n8n API key for authentication | Yes | `n8n_api_1234567890abcdef` |
| `N8N_WEBHOOK_USERNAME` | Username for webhook authentication | No | `webhook-user` |
| `N8N_WEBHOOK_PASSWORD` | Password for webhook authentication | No | `webhook-pass` |
| `LOG_LEVEL` | Logging level | No | `info`, `debug`, `error` |
| `API_TIMEOUT` | API request timeout in milliseconds | No | `30000` |
| `API_RETRY_ATTEMPTS` | Number of retry attempts for failed requests | No | `3` |
| `API_RETRY_DELAY` | Delay between retries in milliseconds | No | `1000` |

### Obtaining n8n API Key

1. Log in to your n8n instance
2. Go to **Settings** → **API**
3. Generate a new API key
4. Copy the key and add it to your MCP client configuration

### Verifying the Connection

Once configured, the MCP client should be able to:
1. List available tools from the n8n server
2. Execute workflow operations
3. Manage credentials and executions

You can verify the connection by asking your AI assistant to list available n8n workflows or check the API connectivity status.

## 📚 Available Tools

### Workflow Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_workflows` | List all workflows with filtering | `active`, `limit`, `offset`, `tags`, `search` |
| `get_workflow` | Get specific workflow by ID | `workflowId` |
| `create_workflow` | Create new workflow | `name`, `nodes`, `connections`, `settings`, `tags` |
| `update_workflow` | Update existing workflow | `workflowId`, `name`, `nodes`, `connections`, `settings`, `tags` |
| `delete_workflow` | Delete workflow | `workflowId` |
| `activate_workflow` | Activate workflow | `workflowId` |
| `deactivate_workflow` | Deactivate workflow | `workflowId` |
| `update_workflow_tags` | Update workflow tags | `workflowId`, `tags` |
| `transfer_workflow` | Transfer workflow ownership | `workflowId`, `userId` |

### Execution Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_executions` | List executions with filtering | `workflowId`, `status`, `limit`, `offset`, `since`, `until` |
| `get_execution` | Get specific execution | `executionId` |
| `delete_execution` | Delete execution | `executionId` |
| `trigger_execution` | Manually trigger workflow | `workflowId`, `data` |
| `retry_execution` | Retry failed execution | `executionId` |
| `stop_execution` | Stop running execution | `executionId` |

### Credential Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_credentials` | List all credentials | `type` |
| `get_credential` | Get specific credential | `credentialId` |
| `create_credential` | Create new credential | `name`, `type`, `data`, `nodesAccess` |
| `update_credential` | Update credential | `credentialId`, `name`, `data`, `nodesAccess` |
| `delete_credential` | Delete credential | `credentialId` |
| `test_credential` | Test credential | `credentialId` |
| `transfer_credential` | Transfer credential ownership | `credentialId`, `userId` |

### Management Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `list_tags` | List all tags | None |
| `create_tag` | Create new tag | `name` |
| `delete_tag` | Delete tag | `tagId` |
| `list_users` | List all users | None |
| `get_user` | Get specific user | `userId` |
| `list_variables` | List all variables | None |
| `create_variable` | Create new variable | `key`, `value` |
| `update_variable` | Update variable | `variableId`, `key`, `value` |
| `delete_variable` | Delete variable | `variableId` |

### Utility Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `upload_file` | Upload file to n8n | `filename`, `content`, `mimeType` |
| `check_connectivity` | Check API connectivity | None |
| `get_health_status` | Get API health status | None |

## 🔧 Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `N8N_API_URL` | n8n API base URL | Yes | - |
| `N8N_API_KEY` | n8n API key | Yes | - |
| `N8N_WEBHOOK_USERNAME` | Webhook username | No | - |
| `N8N_WEBHOOK_PASSWORD` | Webhook password | No | - |
| `LOG_LEVEL` | Logging level | No | `info` |
| `PORT` | Server port | No | - |
| `NODE_ENV` | Environment | No | `development` |
| `API_TIMEOUT` | API timeout (ms) | No | `30000` |
| `API_RETRY_ATTEMPTS` | Retry attempts | No | `3` |
| `API_RETRY_DELAY` | Retry delay (ms) | No | `1000` |

### Logging Levels

- `error`: Only error messages
- `warn`: Warning and error messages
- `info`: Info, warning, and error messages
- `debug`: Debug, info, warning, and error messages
- `verbose`: All messages

## 🏗️ Project Structure

```
n8n-mcp-server/
├── src/
│   ├── api/
│   │   └── n8n-client.ts          # n8n API client
│   ├── config/
│   │   ├── environment.ts         # Environment configuration
│   │   └── server.ts              # Server configuration
│   ├── errors/
│   │   ├── error-codes.ts         # Error code definitions
│   │   └── index.ts               # Error handling utilities
│   ├── tools/
│   │   ├── base-handler.ts        # Base tool handler classes
│   │   ├── workflow/              # Workflow tool handlers
│   │   ├── execution/             # Execution tool handlers
│   │   ├── credentials/           # Credential tool handlers
│   │   └── upload/                # Upload tool handlers
│   ├── types/
│   │   └── index.ts               # Type definitions
│   ├── utils/
│   │   └── logger.ts              # Logging utilities
│   └── index.ts                   # Main entry point
├── tests/
│   ├── unit/                      # Unit tests
│   ├── integration/               # Integration tests
│   ├── fixtures/                  # Test fixtures
│   └── mocks/                     # Test mocks
├── build/                         # Compiled JavaScript
├── logs/                          # Log files
├── templates/                     # Workflow templates
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- --testNamePattern="list_workflows"
```

### Test Structure

- **Unit Tests**: Test individual functions and classes
- **Integration Tests**: Test API interactions and tool handlers
- **Fixtures**: Test data and mock responses
- **Mocks**: Mock implementations for external dependencies

## 📝 API Reference

### n8n API Endpoints Covered

#### Workflows
- `GET /workflows` - List workflows
- `GET /workflows/{id}` - Get workflow
- `POST /workflows` - Create workflow
- `PUT /workflows/{id}` - Update workflow
- `DELETE /workflows/{id}` - Delete workflow
- `POST /workflows/{id}/activate` - Activate workflow
- `POST /workflows/{id}/deactivate` - Deactivate workflow
- `POST /workflows/{id}/tags` - Update workflow tags
- `POST /workflows/{id}/transfer` - Transfer workflow ownership

#### Executions
- `GET /executions` - List executions
- `GET /executions/{id}` - Get execution
- `DELETE /executions/{id}` - Delete execution
- `POST /executions` - Trigger execution
- `POST /executions/{id}/retry` - Retry execution
- `POST /executions/{id}/stop` - Stop execution

#### Credentials
- `GET /credentials` - List credentials
- `GET /credentials/{id}` - Get credential
- `POST /credentials` - Create credential
- `PUT /credentials/{id}` - Update credential
- `DELETE /credentials/{id}` - Delete credential
- `POST /credentials/{id}/test` - Test credential
- `POST /credentials/{id}/transfer` - Transfer credential ownership

#### Tags
- `GET /tags` - List tags
- `GET /tags/{id}` - Get tag
- `POST /tags` - Create tag
- `PUT /tags/{id}` - Update tag
- `DELETE /tags/{id}` - Delete tag

#### Users
- `GET /users` - List users
- `GET /users/{id}` - Get user

#### Variables
- `GET /variables` - List variables
- `GET /variables/{id}` - Get variable
- `POST /variables` - Create variable
- `PUT /variables/{id}` - Update variable
- `DELETE /variables/{id}` - Delete variable

## 🔒 Security

- API keys are stored securely in environment variables
- All API requests are authenticated
- Input validation prevents injection attacks
- Error messages don't expose sensitive information
- Logging excludes sensitive data

## 🚀 Deployment

### Docker Deployment

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

### Environment-Specific Configurations

#### Development
```env
NODE_ENV=development
LOG_LEVEL=debug
```

#### Production
```env
NODE_ENV=production
LOG_LEVEL=info
```

#### Testing
```env
NODE_ENV=test
LOG_LEVEL=error
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write comprehensive tests
- Add JSDoc comments for all public APIs
- Follow the existing code style
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Project Wiki](https://github.com/your-org/n8n-mcp-server/wiki)
- **Issues**: [GitHub Issues](https://github.com/your-org/n8n-mcp-server/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/n8n-mcp-server/discussions)

## 🙏 Acknowledgments

- [n8n](https://n8n.io/) - The workflow automation platform
- [Model Context Protocol](https://modelcontextprotocol.io/) - The MCP specification
- [Winston](https://github.com/winstonjs/winston) - Logging library
- [Zod](https://github.com/colinhacks/zod) - TypeScript-first schema validation

## 📊 Status

![Build Status](https://github.com/your-org/n8n-mcp-server/workflows/Build/badge.svg)
![Test Coverage](https://codecov.io/gh/your-org/n8n-mcp-server/branch/main/graph/badge.svg)
![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg) 