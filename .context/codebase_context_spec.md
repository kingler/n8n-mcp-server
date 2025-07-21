# Codebase Context Specification

## Project Overview
A unified Model Context Protocol (MCP) server for n8n workflow management, vectorization, graph database operations, and multi-database integration. The project is modular, extensible, and designed for robust workflow automation and data processing.

## Main Components
- **src/**: Main application source code
  - **server.js**: MCP server entry point
  - **services/**: Business logic for n8n, workflow parsing/validation, Qdrant, Neo4j, Supabase
  - **tools/**: MCP tool definitions (workflow, execution, integration)
  - **utils/**: Shared utilities (error handling, validation)
  - **types/**: Enhanced type definitions
  - **config/**: Configuration management (future)
- **data/**: Data storage
  - **workflows/**: Source workflow files
  - **processed/**: Processed workflow data
  - **exports/**: Generated exports
- **scripts/**: Development and maintenance scripts
  - **import, validate, export, vectorize, parse workflows**
  - **legacy/**: Legacy scripts for Neo4j, Supabase, etc.
- **tests/**: Unit and integration tests
- **docs/**: Guides, architecture, and API documentation
- **config/**: Environment configurations
- **logs/**: Application logs

## Key Features
- n8n workflow CRUD and management
- Workflow validation and parsing
- Vector search and semantic similarity (Qdrant)
- Graph database operations (Neo4j)
- Relational storage (Supabase)
- Batch operations and real-time sync
- Robust logging (Winston)
- Modular tool and service architecture

## Baseline Context
- Project is actively developed and modularized
- Legacy scripts are being migrated to new structure
- Documentation and test coverage are present and growing
- Data and workflow management are core to the system

## Next Steps
- Maintain and update this context specification as the project evolves
- Use this document as a reference for onboarding, architecture, and dependency tracking 