# Claude Hooks for Technology Agent Instantiation

This directory contains hooks that automatically detect context and suggest/invoke appropriate technology agents for your N8N-MAS project.

## Available Hooks

### 1. Agent Detection Hook (`agent-detector.sh`)
A bash script that analyzes prompts and file paths to suggest appropriate technology agents.

**Usage:**
```bash
# Analyze a prompt
./agent-detector.sh prompt "I need to optimize my React components"

# Analyze a file path
./agent-detector.sh file "apps/web/components/Dashboard.tsx"
```

### 2. Auto Agent Invoker (`auto-agent-invoker.py`)
A Python script that provides intelligent agent suggestions with priority scoring.

**Usage:**
```bash
# Direct invocation
python auto-agent-invoker.py "I need to set up WebSocket connections"

# Pipe input
echo "Create a Prisma migration for user authentication" | python auto-agent-invoker.py

# Auto-invoke mode (set environment variable)
export AUTO_INVOKE_AGENT=true
python auto-agent-invoker.py "Build a React component with Framer Motion"
```

### 3. Hook Configuration (`agent-instantiation-hooks.json`)
JSON configuration that defines patterns and rules for agent detection.

## Installation

### Method 1: Claude Settings Integration

Add to your Claude settings (`.claude/settings.json`):

```json
{
  "hooks": {
    "user-prompt-submit": ".claude/hooks/auto-agent-invoker.py",
    "file-edit": ".claude/hooks/agent-detector.sh file"
  }
}
```

### Method 2: Shell Alias

Add to your shell configuration (`.bashrc`, `.zshrc`, etc.):

```bash
# Agent suggestion alias
alias suggest-agent='python ~/.claude/hooks/auto-agent-invoker.py'

# Auto-invoke alias
alias ai-agent='AUTO_INVOKE_AGENT=true python ~/.claude/hooks/auto-agent-invoker.py'
```

### Method 3: Git Hooks Integration

For automatic agent suggestions on commits:

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Get staged files
STAGED_FILES=$(git diff --cached --name-only)

# Suggest agents based on modified files
echo "$STAGED_FILES" | python .claude/hooks/auto-agent-invoker.py
```

## Technology Agent Mapping

The hooks recognize the following technology patterns:

| Technology | Agent | Trigger Patterns |
|------------|-------|------------------|
| Next.js | `nextjs-architect` | next.js, app router, server component |
| React | `react-component-engineer` | react, hooks, useState, jsx |
| TypeScript | `typescript-guardian` | typescript, interface, generics |
| Tailwind CSS | `tailwind-css-designer` | tailwind, className, utility classes |
| Radix UI | `radix-ui-specialist` | radix, accessible, aria, dialog |
| Framer Motion | `framer-motion-animator` | framer, animation, transition |
| CopilotKit | `copilotkit-integration-expert` | copilotkit, conversation, chat ui |
| N8N | `n8n-workflow-engineer` | n8n, workflow, webhook, automation |
| Prisma | `prisma-database-architect` | prisma, migration, schema |
| Neo4j | `neo4j-graph-specialist` | neo4j, cypher, graph database |
| PostgreSQL | `postgresql-performance-tuner` | postgresql, query optimization |
| Docker | `docker-orchestration-manager` | docker, container, compose |
| Redis | `redis-cache-optimizer` | redis, cache, pub/sub |
| WebSocket | `websocket-communication-architect` | websocket, real-time, socket.io |
| Vitest | `vitest-testing-engineer` | test, spec, mock, coverage |
| NPM | `npm-workspace-coordinator` | npm workspace, monorepo |
| MCP | `mcp-protocol-implementer` | mcp, model context protocol |

## Advanced Usage

### Combining Multiple Agents

For complex tasks requiring multiple technologies:

```bash
# Manual combination
claude code --agent nextjs-architect --task "Set up Next.js structure"
claude code --agent prisma-database-architect --task "Design database schema"
claude code --agent tailwind-css-designer --task "Style components"

# Or use the project orchestrator
claude code --agent project-orchestrator-director --task "Coordinate Next.js app with database and styling"
```

### Custom Pattern Addition

To add custom patterns, edit `agent-instantiation-hooks.json`:

```json
{
  "patterns": [
    {
      "id": "custom-pattern",
      "patterns": ["your-keyword", "your-technology"],
      "agent": "your-agent-name",
      "message": "🔧 Custom agent suggestion"
    }
  ]
}
```

### Environment Variables

- `AUTO_INVOKE_AGENT`: Set to `true` to automatically invoke the suggested agent
- `AGENT_PRIORITY_THRESHOLD`: Minimum priority score for suggestions (default: 50)
- `MAX_AGENT_SUGGESTIONS`: Maximum number of agents to suggest (default: 3)

## Examples

### Example 1: React Component Development
```bash
$ echo "Create a dashboard component with charts" | python auto-agent-invoker.py

🤖 Agent Suggestions:
--------------------------------------------------
  ⚛️ claude code --agent react-component-engineer
  📘 claude code --agent typescript-guardian
  🎨 claude code --agent tailwind-css-designer

📝 Reasoning:
  • Primary: react-component-engineer - Best match for the context
  • Alternative: typescript-guardian, tailwind-css-designer
--------------------------------------------------
```

### Example 2: Database Migration
```bash
$ ./agent-detector.sh prompt "Add user authentication to Prisma schema"

🤖 Suggested Technology Agents:
  ➜ claude code --agent prisma-database-architect
  ➜ claude code --agent typescript-guardian
```

### Example 3: File-based Detection
```bash
$ ./agent-detector.sh file "apps/web/app/layout.tsx"

📁 Based on file: apps/web/app/layout.tsx
Suggested agents:
  ➜ nextjs-architect
  ➜ react-component-engineer
  ➜ typescript-guardian
```

## Troubleshooting

### Hook Not Triggering
1. Ensure scripts have execute permissions: `chmod +x *.sh *.py`
2. Check Claude settings file path is correct
3. Verify Python 3 is installed for Python scripts

### No Agents Suggested
1. Check if patterns match your input
2. Review `agent-instantiation-hooks.json` for pattern definitions
3. Use more specific technology keywords

### Auto-invoke Not Working
1. Ensure `AUTO_INVOKE_AGENT=true` is set
2. Verify `claude` command is in PATH
3. Check agent names match available agents

## Contributing

To add new technology agents or improve pattern detection:

1. Update `AGENT_PATTERNS` in `auto-agent-invoker.py`
2. Add file patterns to `FILE_PATTERNS`
3. Update the configuration in `agent-instantiation-hooks.json`
4. Test with various prompts and file paths
5. Document new patterns in this README

## Best Practices

1. **Start Specific**: Use technology-specific keywords for better agent matching
2. **Combine Agents**: Use multiple agents for complex, multi-technology tasks
3. **Review Suggestions**: Always review agent suggestions before auto-invoking
4. **Context Matters**: Provide file paths when working with specific files
5. **Update Patterns**: Customize patterns based on your project's terminology

## Support

For issues or improvements, please refer to the main project documentation or create an issue in the project repository.