#!/usr/bin/env node
/**
 * /integrate-copilotkit - Implement CopilotKit conversational interfaces
 * 
 * Handles CopilotKit integration for conversational AI features in the N8N MAS,
 * including setup, custom actions, state management, and UI components.
 */

const hook = {
  name: 'integrate-copilotkit',
  description: 'Implement CopilotKit conversational AI interfaces for N8N MAS',
  trigger: '/integrate-copilotkit',
  
  async execute(context) {
    const { feature, component, actionType } = context.args;
    
    return {
      template: `
# CopilotKit Integration: ${feature}

## Initial Setup

### 1. Installation and Configuration
\`\`\`bash
# Install CopilotKit packages
npm install @copilotkit/react-core @copilotkit/react-ui @copilotkit/react-textarea

# Optional: Backend runtime
npm install @copilotkit/backend @copilotkit/shared
\`\`\`

### 2. Environment Variables
\`\`\`env
# .env.local
COPILOT_API_KEY=your-api-key
COPILOT_PUBLIC_KEY=your-public-key
NEXT_PUBLIC_COPILOT_CLOUD_API_URL=https://api.copilotkit.ai

# For self-hosted
COPILOT_RUNTIME_URL=http://localhost:4000/copilotkit
\`\`\`

### 3. CopilotKit Provider Setup
\`\`\`typescript
// app/providers/copilot-provider.tsx
'use client'

import { CopilotKit } from '@copilotkit/react-core'
import { CopilotSidebar } from '@copilotkit/react-ui'
import '@copilotkit/react-ui/styles.css'

export function CopilotProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <CopilotKit
      publicApiKey={process.env.NEXT_PUBLIC_COPILOT_PUBLIC_KEY}
      runtimeUrl="/api/copilotkit"
      agent="n8n-mas-assistant"
      // Optional: Custom configuration
      properties={{
        organizationId: 'your-org-id',
        userId: 'current-user-id',
      }}
    >
      <CopilotSidebar
        instructions="You are an N8N MAS assistant helping users create workflows and manage agents."
        labels={{
          title: "N8N MAS Assistant",
          initial: "Hi! I can help you create workflows, manage agents, and answer questions about your automation system.",
        }}
        defaultOpen={false}
        clickOutsideToClose={true}
      >
        {children}
      </CopilotSidebar>
    </CopilotKit>
  )
}
\`\`\`

## Backend Runtime Setup

### Next.js API Route
\`\`\`typescript
// app/api/copilotkit/route.ts
import { CopilotBackend, OpenAIAdapter } from '@copilotkit/backend'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

export async function POST(req: NextRequest) {
  const copilotKit = new CopilotBackend({
    actions: [
      {
        name: 'createWorkflow',
        description: 'Create a new N8N workflow',
        parameters: [
          {
            name: 'name',
            type: 'string',
            description: 'Workflow name',
            required: true,
          },
          {
            name: 'description',
            type: 'string',
            description: 'Workflow description',
          },
          {
            name: 'nodes',
            type: 'object[]',
            description: 'Workflow nodes configuration',
          },
        ],
        handler: async ({ name, description, nodes }) => {
          // Implement workflow creation logic
          const workflow = await createWorkflowInN8N({
            name,
            description,
            nodes,
          })
          
          return {
            success: true,
            workflowId: workflow.id,
            message: \`Created workflow "\${name}" with \${nodes.length} nodes\`,
          }
        },
      },
      {
        name: 'deployAgent',
        description: 'Deploy a new AI agent',
        parameters: [
          {
            name: 'type',
            type: 'string',
            description: 'Agent type (orchestrator/specialist/analyzer)',
            required: true,
          },
          {
            name: 'config',
            type: 'object',
            description: 'Agent configuration',
          },
        ],
        handler: async ({ type, config }) => {
          const agent = await deployAgent({ type, config })
          return {
            success: true,
            agentId: agent.id,
            status: agent.status,
          }
        },
      },
    ],
    
    // Optional: Custom langchain setup
    langserve: {
      chainConstructor: async () => {
        const chain = createCustomChain()
        return chain
      },
    },
  })
  
  const openaiAdapter = new OpenAIAdapter({
    openai: {
      model: 'gpt-4-turbo-preview',
    },
  })
  
  return copilotKit.response(req, openaiAdapter)
}
\`\`\`

## Custom React Hooks

### 1. Readable State Hook
\`\`\`typescript
// hooks/use-workflow-state.ts
import { useCopilotReadable } from '@copilotkit/react-core'

export function useWorkflowState() {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  
  // Make state readable by Copilot
  useCopilotReadable({
    description: 'Current workflows in the system',
    value: workflows,
  })
  
  useCopilotReadable({
    description: 'Currently selected workflow',
    value: selectedWorkflow,
    convert: (workflow) => {
      if (!workflow) return 'No workflow selected'
      return \`Selected workflow: \${workflow.name} (ID: \${workflow.id}) with \${workflow.nodes.length} nodes\`
    },
  })
  
  // Agent states
  const [agents, setAgents] = useState<Agent[]>([])
  
  useCopilotReadable({
    description: 'Active agents and their status',
    value: agents,
    convert: (agents) => {
      return agents.map(agent => ({
        name: agent.name,
        type: agent.type,
        status: agent.status,
        currentTask: agent.currentTask?.name || 'Idle',
      }))
    },
  })
  
  return {
    workflows,
    setWorkflows,
    selectedWorkflow,
    setSelectedWorkflow,
    agents,
    setAgents,
  }
}
\`\`\`

### 2. Action Hook
\`\`\`typescript
// hooks/use-copilot-actions.ts
import { useCopilotAction } from '@copilotkit/react-core'

export function useCopilotActions() {
  const router = useRouter()
  const { createWorkflow, updateWorkflow } = useWorkflowMutations()
  const { deployAgent, configureAgent } = useAgentMutations()
  
  // Workflow creation action
  useCopilotAction({
    name: 'createWorkflow',
    description: 'Create a new N8N workflow with specified nodes',
    parameters: [
      {
        name: 'name',
        type: 'string',
        description: 'Name of the workflow',
        required: true,
      },
      {
        name: 'nodes',
        type: 'object[]',
        description: 'Array of workflow nodes',
        required: false,
      },
    ],
    handler: async ({ name, nodes = [] }) => {
      try {
        const workflow = await createWorkflow({
          name,
          nodes: nodes.map(node => ({
            type: node.type || 'http',
            position: node.position || [0, 0],
            parameters: node.parameters || {},
          })),
        })
        
        router.push(\`/workflows/\${workflow.id}\`)
        
        return {
          success: true,
          message: \`Created workflow "\${name}" successfully\`,
          workflowId: workflow.id,
        }
      } catch (error) {
        return {
          success: false,
          message: \`Failed to create workflow: \${error.message}\`,
        }
      }
    },
  })
  
  // Agent deployment action
  useCopilotAction({
    name: 'deployAgent',
    description: 'Deploy a new AI agent to handle specific tasks',
    parameters: [
      {
        name: 'agentType',
        type: 'string',
        description: 'Type of agent (neo, oracle, trinity, etc.)',
        required: true,
      },
      {
        name: 'taskType',
        type: 'string',
        description: 'Type of task the agent will handle',
      },
      {
        name: 'model',
        type: 'string',
        description: 'AI model to use (gpt-4, claude-3, etc.)',
      },
    ],
    handler: async ({ agentType, taskType, model }) => {
      const agent = await deployAgent({
        type: agentType,
        config: {
          taskType,
          model: model || 'gpt-4-turbo',
          temperature: 0.7,
        },
      })
      
      return {
        success: true,
        agentId: agent.id,
        status: agent.status,
        message: \`Deployed \${agentType} agent successfully\`,
      }
    },
  })
  
  // Workflow execution action
  useCopilotAction({
    name: 'executeWorkflow',
    description: 'Execute a workflow by ID or name',
    parameters: [
      {
        name: 'workflowIdentifier',
        type: 'string',
        description: 'Workflow ID or name',
        required: true,
      },
      {
        name: 'inputData',
        type: 'object',
        description: 'Input data for the workflow',
      },
    ],
    handler: async ({ workflowIdentifier, inputData = {} }) => {
      const execution = await executeWorkflow(workflowIdentifier, inputData)
      
      return {
        success: true,
        executionId: execution.id,
        status: execution.status,
        message: 'Workflow execution started',
      }
    },
  })
}
\`\`\`

### 3. Chat Component Integration
\`\`\`typescript
// components/workflow-chat.tsx
import { CopilotChat } from '@copilotkit/react-ui'
import { useCopilotChat } from '@copilotkit/react-core'

export function WorkflowChat() {
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    stop,
    append,
  } = useCopilotChat({
    id: 'workflow-assistant',
    initialMessages: [
      {
        role: 'assistant',
        content: 'I can help you create and manage workflows. What would you like to do?',
      },
    ],
    onFinish: (message) => {
      // Handle completion
      console.log('Assistant response:', message)
    },
  })
  
  return (
    <div className="flex flex-col h-full">
      <CopilotChat
        instructions="Help the user create and manage N8N workflows and agents."
        makeSystemMessage={(message) => {
          return {
            role: 'system',
            content: \`You are an N8N workflow expert. Current context: \${JSON.stringify(message)}\`,
          }
        }}
        showShareButton={true}
        Labels={{
          placeholder: 'Ask me to create a workflow or deploy an agent...',
          thinking: 'Creating your automation...',
          error: 'Something went wrong. Please try again.',
        }}
      />
      
      {/* Custom suggestions */}
      <div className="flex gap-2 p-4 border-t">
        <button
          onClick={() => append({
            role: 'user',
            content: 'Create a workflow that monitors emails and creates tasks',
          })}
          className="px-3 py-1 text-sm bg-primary/10 rounded-md hover:bg-primary/20"
        >
          Email to Task Workflow
        </button>
        <button
          onClick={() => append({
            role: 'user',
            content: 'Deploy an agent to analyze customer feedback',
          })}
          className="px-3 py-1 text-sm bg-primary/10 rounded-md hover:bg-primary/20"
        >
          Feedback Analyzer Agent
        </button>
      </div>
    </div>
  )
}
\`\`\`

## Advanced Features

### 1. Custom Textarea with Autocompletions
\`\`\`typescript
// components/workflow-editor.tsx
import { CopilotTextarea } from '@copilotkit/react-textarea'

export function WorkflowEditor() {
  const [code, setCode] = useState('')
  const { workflows } = useWorkflowState()
  
  const autocompletions = [
    {
      id: 'nodes',
      title: 'Workflow Nodes',
      items: [
        'HTTP Request',
        'Webhook',
        'Email',
        'Database',
        'AI Agent',
        'Conditional',
        'Loop',
      ].map(node => ({
        title: node,
        value: \`{ "type": "\${node.toLowerCase().replace(' ', '-')}", "parameters": {} }\`,
      })),
    },
    {
      id: 'workflows',
      title: 'Existing Workflows',
      items: workflows.map(w => ({
        title: w.name,
        value: w.id,
      })),
    },
  ]
  
  return (
    <CopilotTextarea
      value={code}
      onChange={(e) => setCode(e.target.value)}
      placeholder="Describe your workflow or paste JSON configuration..."
      autosuggestionsConfig={{
        textareaPurpose: 'N8N workflow configuration in JSON format',
        chatApiConfigs: {
          suggestionsApiConfig: {
            model: 'gpt-3.5-turbo',
            maxTokens: 50,
          },
        },
        autocompletions,
      }}
      className="min-h-[200px] font-mono"
    />
  )
}
\`\`\`

### 2. Context-Aware Actions
\`\`\`typescript
// hooks/use-contextual-actions.ts
export function useContextualActions() {
  const { selectedWorkflow, selectedNode } = useWorkflowContext()
  
  // Dynamic actions based on context
  useCopilotAction({
    name: 'modifySelectedNode',
    description: 'Modify the currently selected node',
    parameters: [
      {
        name: 'changes',
        type: 'object',
        description: 'Changes to apply to the node',
      },
    ],
    handler: async ({ changes }) => {
      if (!selectedNode) {
        return {
          success: false,
          message: 'No node selected',
        }
      }
      
      await updateNode(selectedNode.id, changes)
      
      return {
        success: true,
        message: \`Updated \${selectedNode.type} node\`,
      }
    },
    // Only available when a node is selected
    render: () => selectedNode !== null,
  })
  
  // Workflow-specific actions
  useCopilotAction({
    name: 'addNodeToWorkflow',
    description: 'Add a new node to the current workflow',
    parameters: [
      {
        name: 'nodeType',
        type: 'string',
        description: 'Type of node to add',
        required: true,
      },
      {
        name: 'position',
        type: 'object',
        description: 'Position of the node',
      },
    ],
    handler: async ({ nodeType, position }) => {
      if (!selectedWorkflow) {
        return {
          success: false,
          message: 'No workflow selected',
        }
      }
      
      const node = await addNodeToWorkflow(selectedWorkflow.id, {
        type: nodeType,
        position: position || calculateNextPosition(),
      })
      
      return {
        success: true,
        nodeId: node.id,
        message: \`Added \${nodeType} node to workflow\`,
      }
    },
    render: () => selectedWorkflow !== null,
  })
}
\`\`\`

### 3. Real-time Collaboration
\`\`\`typescript
// components/collaborative-workspace.tsx
import { useCopilotChat } from '@copilotkit/react-core'
import { usePresence } from '@/hooks/use-presence'

export function CollaborativeWorkspace() {
  const { append } = useCopilotChat()
  const { presences, broadcast } = usePresence('workspace')
  
  // Broadcast AI suggestions to collaborators
  const shareAISuggestion = async (suggestion: string) => {
    // Add to chat
    await append({
      role: 'assistant',
      content: suggestion,
      metadata: {
        sharedBy: currentUser.id,
        timestamp: new Date().toISOString(),
      },
    })
    
    // Broadcast to others
    broadcast('ai-suggestion', {
      suggestion,
      userId: currentUser.id,
    })
  }
  
  // Listen for shared suggestions
  useEffect(() => {
    const unsubscribe = subscribeToPresence('ai-suggestion', (data) => {
      if (data.userId !== currentUser.id) {
        showNotification(\`\${data.userName} shared an AI suggestion\`)
      }
    })
    
    return unsubscribe
  }, [])
  
  return (
    <div className="relative">
      {/* Presence indicators */}
      <div className="absolute top-2 right-2 flex gap-2">
        {presences.map(user => (
          <Avatar
            key={user.id}
            src={user.avatar}
            alt={user.name}
            className="w-8 h-8 ring-2 ring-green-500"
          />
        ))}
      </div>
      
      {/* Workspace content */}
      <WorkflowCanvas />
      
      {/* Collaborative chat */}
      <div className="fixed bottom-4 right-4 w-96">
        <CopilotChat
          instructions="Help multiple users collaborate on workflow creation."
          makeSystemMessage={(context) => ({
            role: 'system',
            content: \`Active collaborators: \${presences.map(p => p.name).join(', ')}. \${context}\`,
          })}
        />
      </div>
    </div>
  )
}
\`\`\`

### 4. Custom LangChain Integration
\`\`\`typescript
// lib/copilot-langchain.ts
import { ChatOpenAI } from '@langchain/openai'
import { PromptTemplate } from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'

export function createWorkflowChain() {
  const model = new ChatOpenAI({
    modelName: 'gpt-4-turbo-preview',
    temperature: 0.7,
  })
  
  const workflowPrompt = PromptTemplate.fromTemplate(\`
    You are an N8N workflow expert. Create a workflow configuration based on this request:
    
    Request: {request}
    
    Context:
    - Available nodes: {availableNodes}
    - User preferences: {preferences}
    - Existing workflows: {existingWorkflows}
    
    Generate a JSON workflow configuration that includes:
    1. Appropriate nodes for the task
    2. Proper connections between nodes
    3. Required parameters for each node
    4. Error handling where appropriate
    
    Response format:
    {{
      "name": "workflow name",
      "nodes": [...],
      "connections": [...]
    }}
  \`)
  
  const chain = RunnableSequence.from([
    workflowPrompt,
    model,
    new StringOutputParser(),
    // Parse and validate JSON
    (output) => {
      try {
        return JSON.parse(output)
      } catch (error) {
        throw new Error('Invalid workflow configuration generated')
      }
    },
  ])
  
  return chain
}

// Use in CopilotKit backend
export async function workflowGenerationAction(request: string, context: any) {
  const chain = createWorkflowChain()
  
  const workflow = await chain.invoke({
    request,
    availableNodes: getAvailableNodes(),
    preferences: context.userPreferences,
    existingWorkflows: context.existingWorkflows.map(w => w.name),
  })
  
  // Validate and create workflow
  const validated = validateWorkflowConfig(workflow)
  const created = await createWorkflow(validated)
  
  return {
    success: true,
    workflow: created,
    message: \`Created workflow "\${created.name}" with \${created.nodes.length} nodes\`,
  }
}
\`\`\`

## Error Handling and Edge Cases

\`\`\`typescript
// hooks/use-copilot-error-handling.ts
export function useCopilotErrorHandling() {
  const { setMessages } = useCopilotChat()
  
  // Global error handler
  useCopilotAction({
    name: '_handleError',
    description: 'Internal error handler',
    parameters: [],
    handler: async (params, context) => {
      if (context.error) {
        // Log error
        console.error('CopilotKit error:', context.error)
        
        // User-friendly message
        const errorMessage = getErrorMessage(context.error)
        
        return {
          success: false,
          message: errorMessage,
          suggestions: getErrorSuggestions(context.error),
        }
      }
    },
  })
  
  // Rate limiting handler
  const handleRateLimit = useCallback(() => {
    setMessages(prev => [
      ...prev,
      {
        role: 'assistant',
        content: 'I\'m currently rate limited. Please try again in a few moments.',
      },
    ])
  }, [setMessages])
  
  return { handleRateLimit }
}

function getErrorMessage(error: any): string {
  if (error.code === 'WORKFLOW_LIMIT_REACHED') {
    return 'You\'ve reached your workflow limit. Please upgrade your plan.'
  }
  
  if (error.code === 'INVALID_NODE_CONFIG') {
    return 'The node configuration is invalid. Let me help you fix it.'
  }
  
  return 'Something went wrong. Please try again.'
}

function getErrorSuggestions(error: any): string[] {
  if (error.code === 'WORKFLOW_LIMIT_REACHED') {
    return [
      'Delete unused workflows',
      'Upgrade to a higher plan',
      'Archive old workflows',
    ]
  }
  
  return ['Try a simpler request', 'Check your configuration']
}
\`\`\`
`,
      implementationPatterns: {
        provider: 'Wrap app with CopilotKit provider',
        actions: 'Define custom actions for domain operations',
        readableState: 'Make app state readable by AI',
        chatUI: 'Integrate chat components',
        autocompletions: 'Add context-aware suggestions',
        backend: 'Set up runtime for advanced features'
      },
      bestPractices: [
        'Keep actions focused and single-purpose',
        'Provide clear descriptions for AI understanding',
        'Use readable state for context awareness',
        'Implement proper error handling',
        'Add rate limiting and usage tracking',
        'Test actions thoroughly with different prompts',
        'Provide helpful initial messages and suggestions',
        'Keep UI responses fast with optimistic updates'
      ],
      resources: [
        'CopilotKit Docs: https://docs.copilotkit.ai/',
        'Examples: https://github.com/CopilotKit/CopilotKit/tree/main/examples',
        'API Reference: https://docs.copilotkit.ai/api-reference',
        'Best Practices: https://docs.copilotkit.ai/guides/best-practices',
        'LangChain Integration: https://docs.copilotkit.ai/guides/langchain'
      ]
    };
  }
};

module.exports = hook;