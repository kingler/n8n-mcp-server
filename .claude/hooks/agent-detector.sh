#!/bin/bash

# Agent Detection Hook Script
# Analyzes context and suggests appropriate technology agents

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Function to analyze prompt for technology patterns
analyze_prompt() {
    local prompt="$1"
    local suggested_agents=()
    
    # Convert to lowercase for pattern matching
    local lower_prompt=$(echo "$prompt" | tr '[:upper:]' '[:lower:]')
    
    # Next.js patterns
    if [[ "$lower_prompt" =~ (next\.js|nextjs|app router|server component|next/) ]]; then
        suggested_agents+=("nextjs-architect")
    fi
    
    # React patterns
    if [[ "$lower_prompt" =~ (react|component|hooks|useState|useEffect|jsx) ]]; then
        suggested_agents+=("react-component-engineer")
    fi
    
    # TypeScript patterns
    if [[ "$lower_prompt" =~ (typescript|type safety|interface|generics|tsconfig) ]]; then
        suggested_agents+=("typescript-guardian")
    fi
    
    # Tailwind patterns
    if [[ "$lower_prompt" =~ (tailwind|className|dark mode|utility classes) ]]; then
        suggested_agents+=("tailwind-css-designer")
    fi
    
    # Radix UI patterns
    if [[ "$lower_prompt" =~ (radix|accessible|aria|dropdown|dialog|popover) ]]; then
        suggested_agents+=("radix-ui-specialist")
    fi
    
    # Framer Motion patterns
    if [[ "$lower_prompt" =~ (framer|motion|animation|animate|transition|gesture) ]]; then
        suggested_agents+=("framer-motion-animator")
    fi
    
    # CopilotKit patterns
    if [[ "$lower_prompt" =~ (copilotkit|copilot|conversation|chat ui) ]]; then
        suggested_agents+=("copilotkit-integration-expert")
    fi
    
    # N8N patterns
    if [[ "$lower_prompt" =~ (n8n|workflow|webhook|trigger|automation) ]]; then
        suggested_agents+=("n8n-workflow-engineer")
    fi
    
    # Prisma patterns
    if [[ "$lower_prompt" =~ (prisma|migration|database|orm|schema) ]]; then
        suggested_agents+=("prisma-database-architect")
    fi
    
    # Neo4j patterns
    if [[ "$lower_prompt" =~ (neo4j|cypher|graph|knowledge graph) ]]; then
        suggested_agents+=("neo4j-graph-specialist")
    fi
    
    # PostgreSQL patterns
    if [[ "$lower_prompt" =~ (postgresql|postgres|query optimization|index) ]]; then
        suggested_agents+=("postgresql-performance-tuner")
    fi
    
    # Docker patterns
    if [[ "$lower_prompt" =~ (docker|dockerfile|container|compose) ]]; then
        suggested_agents+=("docker-orchestration-manager")
    fi
    
    # Redis patterns
    if [[ "$lower_prompt" =~ (redis|cache|session|pub/sub) ]]; then
        suggested_agents+=("redis-cache-optimizer")
    fi
    
    # WebSocket patterns
    if [[ "$lower_prompt" =~ (websocket|socket\.io|real-time|broadcast) ]]; then
        suggested_agents+=("websocket-communication-architect")
    fi
    
    # Testing patterns
    if [[ "$lower_prompt" =~ (vitest|test|spec|mock|coverage) ]]; then
        suggested_agents+=("vitest-testing-engineer")
    fi
    
    # NPM/Monorepo patterns
    if [[ "$lower_prompt" =~ (npm workspace|monorepo|dependencies|package\.json) ]]; then
        suggested_agents+=("npm-workspace-coordinator")
    fi
    
    # MCP patterns
    if [[ "$lower_prompt" =~ (mcp|model context protocol|tool registration) ]]; then
        suggested_agents+=("mcp-protocol-implementer")
    fi
    
    # Output suggestions
    if [ ${#suggested_agents[@]} -gt 0 ]; then
        echo -e "${CYAN}🤖 Suggested Technology Agents:${NC}"
        for agent in "${suggested_agents[@]}"; do
            echo -e "${GREEN}  ➜ claude code --agent ${agent}${NC}"
        done
    fi
}

# Function to analyze file path for technology context
analyze_file() {
    local file_path="$1"
    local suggested_agents=()
    
    # React/TypeScript files
    if [[ "$file_path" =~ \.tsx$ ]]; then
        suggested_agents+=("react-component-engineer")
        suggested_agents+=("typescript-guardian")
    fi
    
    # Next.js app directory
    if [[ "$file_path" =~ /app/.+\.tsx$ ]]; then
        suggested_agents+=("nextjs-architect")
    fi
    
    # Test files
    if [[ "$file_path" =~ \.spec\.(ts|tsx)$ ]] || [[ "$file_path" =~ \.test\.(ts|tsx)$ ]]; then
        suggested_agents+=("vitest-testing-engineer")
    fi
    
    # Prisma schema
    if [[ "$file_path" =~ schema\.prisma$ ]]; then
        suggested_agents+=("prisma-database-architect")
    fi
    
    # Docker files
    if [[ "$file_path" =~ (Dockerfile|docker-compose) ]]; then
        suggested_agents+=("docker-orchestration-manager")
    fi
    
    # N8N files
    if [[ "$file_path" =~ /n8n/ ]]; then
        suggested_agents+=("n8n-workflow-engineer")
    fi
    
    # CSS files
    if [[ "$file_path" =~ \.css$ ]]; then
        suggested_agents+=("tailwind-css-designer")
    fi
    
    # Output suggestions
    if [ ${#suggested_agents[@]} -gt 0 ]; then
        echo -e "${YELLOW}📁 Based on file: ${file_path}${NC}"
        echo -e "${CYAN}Suggested agents:${NC}"
        for agent in "${suggested_agents[@]}"; do
            echo -e "${GREEN}  ➜ ${agent}${NC}"
        done
    fi
}

# Main execution
if [ "$1" == "prompt" ]; then
    analyze_prompt "$2"
elif [ "$1" == "file" ]; then
    analyze_file "$2"
else
    echo "Usage: $0 [prompt|file] <content>"
fi