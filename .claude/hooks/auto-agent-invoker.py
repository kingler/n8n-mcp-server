#!/usr/bin/env python3

"""
Auto Agent Invoker Hook
Automatically invokes the appropriate technology agent based on context
"""

import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import List, Dict, Optional, Tuple

# Agent mapping configuration
AGENT_PATTERNS = {
    "nextjs-architect": {
        "patterns": ["next.js", "nextjs", "app router", "server component", "next/", "middleware.ts"],
        "priority": 90,
        "icon": "🔷"
    },
    "react-component-engineer": {
        "patterns": ["react", "component", "hooks", "useState", "useEffect", "jsx", "tsx"],
        "priority": 85,
        "icon": "⚛️"
    },
    "typescript-guardian": {
        "patterns": ["typescript", "type safety", "interface", "generics", "tsconfig", "type definition"],
        "priority": 80,
        "icon": "📘"
    },
    "tailwind-css-designer": {
        "patterns": ["tailwind", "className", "dark mode", "utility classes", "tailwind.config"],
        "priority": 75,
        "icon": "🎨"
    },
    "radix-ui-specialist": {
        "patterns": ["radix", "accessible", "aria", "dropdown", "dialog", "popover", "@radix-ui"],
        "priority": 70,
        "icon": "♿"
    },
    "framer-motion-animator": {
        "patterns": ["framer", "motion", "animation", "animate", "transition", "gesture"],
        "priority": 65,
        "icon": "🎬"
    },
    "copilotkit-integration-expert": {
        "patterns": ["copilotkit", "copilot", "conversation", "chat ui", "useCopilot"],
        "priority": 95,
        "icon": "💬"
    },
    "n8n-workflow-engineer": {
        "patterns": ["n8n", "workflow", "webhook", "trigger", "automation", "custom node"],
        "priority": 90,
        "icon": "⚙️"
    },
    "prisma-database-architect": {
        "patterns": ["prisma", "migration", "database", "orm", "schema.prisma"],
        "priority": 85,
        "icon": "🗃️"
    },
    "neo4j-graph-specialist": {
        "patterns": ["neo4j", "cypher", "graph", "knowledge graph", "node relationship"],
        "priority": 80,
        "icon": "🕸️"
    },
    "postgresql-performance-tuner": {
        "patterns": ["postgresql", "postgres", "query optimization", "index", "vacuum"],
        "priority": 75,
        "icon": "🐘"
    },
    "docker-orchestration-manager": {
        "patterns": ["docker", "dockerfile", "container", "compose", "docker-compose"],
        "priority": 70,
        "icon": "🐳"
    },
    "redis-cache-optimizer": {
        "patterns": ["redis", "cache", "session", "pub/sub", "memory store"],
        "priority": 65,
        "icon": "⚡"
    },
    "websocket-communication-architect": {
        "patterns": ["websocket", "socket.io", "real-time", "ws://", "broadcast"],
        "priority": 60,
        "icon": "🔌"
    },
    "vitest-testing-engineer": {
        "patterns": ["vitest", "test", "spec", "describe", "expect", "mock"],
        "priority": 55,
        "icon": "🧪"
    },
    "npm-workspace-coordinator": {
        "patterns": ["npm workspace", "monorepo", "package.json", "dependencies"],
        "priority": 50,
        "icon": "📦"
    },
    "mcp-protocol-implementer": {
        "patterns": ["mcp", "model context protocol", "tool registration"],
        "priority": 85,
        "icon": "🔧"
    }
}

# File pattern to agent mapping
FILE_PATTERNS = {
    r".*\.tsx$": ["react-component-engineer", "typescript-guardian"],
    r".*/app/.*\.tsx$": ["nextjs-architect"],
    r".*\.(spec|test)\.(ts|tsx)$": ["vitest-testing-engineer"],
    r".*schema\.prisma$": ["prisma-database-architect"],
    r".*(Dockerfile|docker-compose.*\.yml)$": ["docker-orchestration-manager"],
    r".*/n8n/.*\.ts$": ["n8n-workflow-engineer"],
    r".*\.css$": ["tailwind-css-designer"],
    r".*tailwind\.config\.(js|ts)$": ["tailwind-css-designer"],
    r".*/api/.*\.ts$": ["typescript-guardian"],
    r".*\.cypher$": ["neo4j-graph-specialist"]
}

class AgentInvoker:
    def __init__(self):
        self.project_root = Path.cwd()
        self.hooks_dir = self.project_root / ".claude" / "hooks"
        self.config_file = self.hooks_dir / "agent-instantiation-hooks.json"
        
    def analyze_context(self, text: str) -> List[Tuple[str, int]]:
        """Analyze text and return suggested agents with their priorities"""
        text_lower = text.lower()
        suggestions = []
        
        for agent, config in AGENT_PATTERNS.items():
            for pattern in config["patterns"]:
                if pattern.lower() in text_lower:
                    suggestions.append((agent, config["priority"]))
                    break
        
        # Sort by priority (higher first)
        suggestions.sort(key=lambda x: x[1], reverse=True)
        return suggestions
    
    def analyze_files(self, file_paths: List[str]) -> List[str]:
        """Analyze file paths and return suggested agents"""
        agents = set()
        
        for file_path in file_paths:
            for pattern, agent_list in FILE_PATTERNS.items():
                if re.match(pattern, file_path):
                    agents.update(agent_list)
        
        return list(agents)
    
    def get_agent_command(self, agent: str, task: Optional[str] = None) -> str:
        """Generate the command to invoke an agent"""
        if task:
            return f"claude code --agent {agent} --task '{task}'"
        return f"claude code --agent {agent}"
    
    def suggest_agents(self, context: str, files: Optional[List[str]] = None) -> Dict:
        """Main function to suggest agents based on context"""
        result = {
            "primary_agent": None,
            "secondary_agents": [],
            "commands": [],
            "reasoning": []
        }
        
        # Analyze text context
        text_suggestions = self.analyze_context(context)
        
        # Analyze file context if provided
        file_suggestions = []
        if files:
            file_suggestions = self.analyze_files(files)
        
        # Combine and prioritize suggestions
        all_agents = {}
        for agent, priority in text_suggestions[:3]:  # Top 3 from text
            all_agents[agent] = priority
        
        for agent in file_suggestions[:2]:  # Top 2 from files
            if agent in AGENT_PATTERNS:
                priority = AGENT_PATTERNS[agent]["priority"]
                if agent not in all_agents:
                    all_agents[agent] = priority - 10  # Slightly lower priority for file-based
        
        if all_agents:
            sorted_agents = sorted(all_agents.items(), key=lambda x: x[1], reverse=True)
            result["primary_agent"] = sorted_agents[0][0]
            result["secondary_agents"] = [agent for agent, _ in sorted_agents[1:3]]
            
            # Generate commands
            for agent, _ in sorted_agents[:3]:
                icon = AGENT_PATTERNS[agent]["icon"]
                cmd = self.get_agent_command(agent)
                result["commands"].append(f"{icon} {cmd}")
            
            # Add reasoning
            result["reasoning"].append(f"Primary: {result['primary_agent']} - Best match for the context")
            if result["secondary_agents"]:
                result["reasoning"].append(f"Alternative: {', '.join(result['secondary_agents'])}")
        
        return result
    
    def output_suggestions(self, suggestions: Dict):
        """Output suggestions in a formatted way"""
        if not suggestions["primary_agent"]:
            print("ℹ️  No specific technology agent suggested for this context")
            return
        
        print("\n🤖 Agent Suggestions:")
        print("-" * 50)
        
        for cmd in suggestions["commands"]:
            print(f"  {cmd}")
        
        if suggestions["reasoning"]:
            print("\n📝 Reasoning:")
            for reason in suggestions["reasoning"]:
                print(f"  • {reason}")
        
        print("-" * 50)
        print("\n💡 Tip: Use the primary agent for best results, or combine multiple agents for complex tasks")

def main():
    """Main entry point for the hook"""
    invoker = AgentInvoker()
    
    # Get input from stdin or arguments
    if len(sys.argv) > 1:
        context = " ".join(sys.argv[1:])
    else:
        context = sys.stdin.read() if not sys.stdin.isatty() else ""
    
    if not context:
        print("ℹ️  No context provided. Use: echo 'your prompt' | python auto-agent-invoker.py")
        return
    
    # Check for file paths in context
    files = []
    words = context.split()
    for word in words:
        if "/" in word or "\\" in word:
            if Path(word).exists():
                files.append(word)
    
    # Get suggestions
    suggestions = invoker.suggest_agents(context, files if files else None)
    
    # Output suggestions
    invoker.output_suggestions(suggestions)
    
    # Optionally auto-invoke (can be enabled via environment variable)
    if os.getenv("AUTO_INVOKE_AGENT") == "true" and suggestions["primary_agent"]:
        print(f"\n🚀 Auto-invoking: {suggestions['primary_agent']}")
        cmd = invoker.get_agent_command(suggestions["primary_agent"], context)
        subprocess.run(cmd, shell=True)

if __name__ == "__main__":
    main()