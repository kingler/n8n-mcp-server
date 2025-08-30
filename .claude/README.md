# Claude Code Hooks for N8N Multi-Agent System

This directory contains specialized Claude Code hooks designed to streamline development of the N8N Multi-Agent System (MAS). These hooks provide intelligent assistance for planning, development, debugging, and integration tasks specific to our technology stack.

## 🚀 Quick Start

To use these hooks in your Claude Code session, simply type the hook command (e.g., `/plan-feature`) when you need assistance with a specific task.

## 📋 Available Hooks

### Planning & Architecture

#### `/plan-feature`
Generate comprehensive technical specifications for new features considering the N8N MAS technology stack.

**Usage:**
```
/plan-feature create-agent-dashboard
```

**Features:**
- Frontend/Backend requirements
- Database schema design
- Agent integration patterns
- Security considerations
- Testing strategies
- Performance requirements

#### `/architect-system`
Design system architecture with technology constraints and best practices for distributed multi-agent systems.

**Usage:**
```
/architect-system workflow-orchestration-service
```

**Features:**
- C4 architecture diagrams
- Component design patterns
- Data flow architecture
- Integration patterns
- Deployment strategies

#### `/review-requirements`
Validate requirements against tech stack capabilities to ensure feasibility.

**Usage:**
```
/review-requirements real-time-collaboration-feature
```

**Features:**
- Technology compatibility analysis
- Performance impact assessment
- Security requirement validation
- Scalability considerations

### Development & Debugging

#### `/fix-typescript`
Resolve TypeScript 5.9.2 specific errors and type issues.

**Common Issues Fixed:**
- Type inference problems
- Strict mode violations
- Module resolution errors
- Generic constraint issues
- Union type narrowing

**Usage:**
```
/fix-typescript TS2345
```

#### `/fix-nextjs15`
Handle Next.js 15.4 App Router and Server Component issues.

**Common Issues Fixed:**
- Server Component async errors
- Hydration mismatches
- Route handler problems
- Metadata export issues
- Middleware edge runtime errors

**Usage:**
```
/fix-nextjs15 hydration-error
```

#### `/fix-tailwind-v4`
Address Tailwind CSS 4.1.11 configuration and utility issues.

**Features:**
- Lightning CSS engine setup
- v3 to v4 migration
- Container queries implementation
- Performance optimization
- Custom plugin development

**Usage:**
```
/fix-tailwind-v4 migration
```

#### `/fix-shadcn`
Resolve shadcn/ui 2.10.0 component integration problems.

**Common Issues Fixed:**
- Component import errors
- Theme customization issues
- Accessibility problems
- Dark mode implementation
- Tailwind v4 compatibility

**Usage:**
```
/fix-shadcn dialog-component
```

### Database & Integration

#### `/fix-prisma`
Debug Prisma ORM v6.13.0 schema and query problems.

**Features:**
- Schema design patterns
- Migration strategies
- Query optimization
- Type safety patterns
- Performance tuning

**Usage:**
```
/fix-prisma P2025
```

#### `/fix-supabase`
Resolve Supabase integration and pgvector configuration issues.

**Features:**
- Authentication setup
- Real-time subscriptions
- Row Level Security (RLS)
- pgvector configuration
- Storage operations

**Usage:**
```
/fix-supabase realtime
```

#### `/fix-neo4j`
Address Neo4j connection and GraphRAG implementation problems.

**Features:**
- Connection setup
- Cypher query optimization
- Graph data modeling
- GraphRAG patterns
- Performance optimization

**Usage:**
```
/fix-neo4j cypher-query
```

### Testing & Quality

#### `/test-component`
Generate comprehensive test suites for React components.

**Features:**
- React Testing Library setup
- Vitest configuration
- Accessibility testing
- Performance testing
- Snapshot testing
- Mock strategies

**Usage:**
```
/test-component WorkflowEditor
```

#### `/test-api`
Create API endpoint tests with proper mocking.

**Features:**
- Next.js route handler tests
- Express endpoint tests
- GraphQL resolver tests
- Integration tests
- Load testing
- Contract testing

**Usage:**
```
/test-api POST /api/workflows
```

#### `/validate-types`
Perform TypeScript type checking and validation.

**Features:**
- Type coverage analysis
- Runtime validation with Zod
- Type guard patterns
- Generic constraints
- Type testing strategies

**Usage:**
```
/validate-types strict
```

### Integration Hooks

#### `/integrate-copilotkit`
Implement CopilotKit conversational interfaces.

**Features:**
- Provider setup
- Custom actions
- Chat UI integration
- State management
- Real-time collaboration
- LangChain integration

**Usage:**
```
/integrate-copilotkit workflow-assistant
```

#### `/integrate-n8n`
Connect N8N workflows with MCP protocol.

**Features:**
- Custom node development
- Webhook integration
- Workflow templates
- API client setup
- Monitoring implementation

**Usage:**
```
/integrate-n8n mcp-agent-node
```

#### `/integrate-vector-db`
Set up pgvector operations for RAG capabilities.

**Features:**
- Database schema setup
- Embedding generation
- Similarity search
- RAG implementation
- Performance optimization
- Analytics

**Usage:**
```
/integrate-vector-db document-search
```

## 🏗️ Hook Structure

Each hook follows a consistent structure:

```javascript
{
  name: 'hook-name',
  description: 'What this hook does',
  trigger: '/hook-command',
  execute: async (context) => {
    // Hook implementation
    return {
      template: 'Detailed solution template',
      bestPractices: [...],
      resources: [...]
    }
  }
}
```

## 🛠️ Configuration

The hooks are configured via `.claude/config.json`:

```json
{
  "version": "1.0.0",
  "project": "n8n-mas",
  "technology_stack": {
    "typescript": "5.9.2",
    "tailwindcss": "4.1.11",
    "shadcn-ui": "2.10.0",
    "nextjs": "15.4",
    "prisma": "6.13.0",
    "supabase": "latest",
    "neo4j": "latest",
    "copilotkit": "latest",
    "n8n": "latest"
  }
}
```

## 📊 Best Practices

1. **Use hooks proactively** - Don't wait for errors; use planning hooks before implementation
2. **Provide context** - Include error messages, file paths, and relevant code snippets
3. **Follow suggestions** - Hooks provide tested patterns specific to our stack
4. **Combine hooks** - Use multiple hooks for complex tasks (e.g., plan → implement → test)
5. **Check resources** - Each hook provides relevant documentation links

## 🔍 Common Workflows

### Feature Development
1. `/plan-feature` - Plan the feature
2. `/architect-system` - Design the architecture
3. `/fix-typescript` - Resolve type issues
4. `/test-component` - Generate tests
5. `/integrate-n8n` - Create workflows

### Debugging Session
1. `/fix-typescript` - Fix type errors
2. `/fix-nextjs15` - Resolve framework issues
3. `/fix-prisma` - Debug database queries
4. `/validate-types` - Ensure type safety

### Integration Setup
1. `/integrate-copilotkit` - Add conversational UI
2. `/integrate-n8n` - Connect workflows
3. `/integrate-vector-db` - Setup RAG
4. `/test-api` - Test integrations

## 🤝 Contributing

To add new hooks:

1. Create a new file in `.claude/hooks/`
2. Follow the existing hook structure
3. Add comprehensive examples and error patterns
4. Include relevant documentation links
5. Test the hook thoroughly

## 📚 Resources

- [N8N MAS Documentation](./docs)
- [TypeScript 5.9 Docs](https://www.typescriptlang.org/docs/)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Tailwind CSS v4](https://tailwindcss.com/docs)
- [Prisma v6.13](https://www.prisma.io/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Neo4j Docs](https://neo4j.com/docs/)

## 🐛 Troubleshooting

If a hook isn't working:

1. Check the hook name is typed correctly
2. Ensure you're in the N8N MAS project directory
3. Verify the `.claude/` directory exists
4. Check `config.json` for correct settings
5. Review hook output for specific error messages

## 📝 License

These hooks are part of the N8N MAS project and follow the same license terms.