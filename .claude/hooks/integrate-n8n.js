#!/usr/bin/env node
/**
 * /integrate-n8n - Connect N8N workflows with MCP protocol
 * 
 * Handles N8N workflow integration including custom nodes, webhook setup,
 * MCP protocol communication, and workflow automation for the N8N MAS.
 */

const hook = {
  name: 'integrate-n8n',
  description: 'Integrate N8N workflows with MCP protocol and agent framework',
  trigger: '/integrate-n8n',
  
  async execute(context) {
    const { integrationType, workflowName, nodeType } = context.args;
    
    return {
      template: `
# N8N Integration: ${integrationType}

## N8N Setup and Configuration

### 1. N8N Installation with Custom Configuration
\`\`\`typescript
// docker-compose.yml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n-mas
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=\${N8N_PASSWORD}
      - N8N_HOST=\${N8N_HOST}
      - N8N_PORT=5678
      - N8N_PROTOCOL=https
      - N8N_WEBHOOK_BASE_URL=\${N8N_WEBHOOK_URL}
      - N8N_EXECUTION_PROCESS=main
      - N8N_METRICS=true
      - N8N_METRICS_PREFIX=n8n_mas_
      - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
      - DB_TYPE=postgresdb
      - DB_POSTGRESDB_HOST=postgres
      - DB_POSTGRESDB_PORT=5432
      - DB_POSTGRESDB_DATABASE=n8n
      - DB_POSTGRESDB_USER=n8n
      - DB_POSTGRESDB_PASSWORD=\${DB_PASSWORD}
    volumes:
      - n8n-data:/home/node/.n8n
      - ./custom-nodes:/home/node/.n8n/custom
    networks:
      - n8n-mas-network

  n8n-worker:
    image: n8nio/n8n:latest
    command: worker
    restart: unless-stopped
    environment:
      - N8N_EXECUTION_MODE=queue
      - QUEUE_BULL_REDIS_HOST=redis
      - QUEUE_BULL_REDIS_PORT=6379
    depends_on:
      - n8n
      - redis
    networks:
      - n8n-mas-network

volumes:
  n8n-data:

networks:
  n8n-mas-network:
    external: true
\`\`\`

### 2. N8N API Client
\`\`\`typescript
// lib/n8n-client.ts
import axios, { AxiosInstance } from 'axios'

export class N8NClient {
  private client: AxiosInstance
  
  constructor(
    private baseURL: string = process.env.N8N_API_URL!,
    private apiKey: string = process.env.N8N_API_KEY!
  ) {
    this.client = axios.create({
      baseURL,
      headers: {
        'X-N8N-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
    })
  }
  
  // Workflow operations
  async createWorkflow(workflow: WorkflowConfig): Promise<N8NWorkflow> {
    const response = await this.client.post('/workflows', {
      name: workflow.name,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: {
        executionOrder: 'v1',
        saveDataSuccessExecution: 'all',
        saveDataErrorExecution: 'all',
        saveExecutionProgress: true,
        ...workflow.settings,
      },
      staticData: workflow.staticData,
      tags: workflow.tags,
    })
    
    return response.data
  }
  
  async getWorkflow(id: string): Promise<N8NWorkflow> {
    const response = await this.client.get(\`/workflows/\${id}\`)
    return response.data
  }
  
  async updateWorkflow(id: string, updates: Partial<WorkflowConfig>): Promise<N8NWorkflow> {
    const response = await this.client.patch(\`/workflows/\${id}\`, updates)
    return response.data
  }
  
  async activateWorkflow(id: string): Promise<void> {
    await this.client.patch(\`/workflows/\${id}\`, { active: true })
  }
  
  async deactivateWorkflow(id: string): Promise<void> {
    await this.client.patch(\`/workflows/\${id}\`, { active: false })
  }
  
  // Execution operations
  async executeWorkflow(
    id: string,
    data?: any,
    options?: ExecutionOptions
  ): Promise<ExecutionResult> {
    const response = await this.client.post(\`/workflows/\${id}/execute\`, {
      workflowData: data,
      runData: options?.runData,
      pinData: options?.pinData,
      startNodes: options?.startNodes,
    })
    
    return response.data
  }
  
  async getExecution(id: string): Promise<Execution> {
    const response = await this.client.get(\`/executions/\${id}\`)
    return response.data
  }
  
  async getExecutions(
    filters?: ExecutionFilters
  ): Promise<{ data: Execution[]; nextCursor?: string }> {
    const response = await this.client.get('/executions', {
      params: filters,
    })
    
    return response.data
  }
  
  // Webhook operations
  async getWebhookUrl(workflowId: string, nodeId: string): Promise<string> {
    const workflow = await this.getWorkflow(workflowId)
    const webhookNode = workflow.nodes.find(n => n.id === nodeId && n.type === 'n8n-nodes-base.webhook')
    
    if (!webhookNode) {
      throw new Error('Webhook node not found')
    }
    
    const path = webhookNode.parameters.path || webhookNode.webhookId
    return \`\${this.baseURL}/webhook/\${path}\`
  }
  
  // Credentials operations
  async createCredentials(credentials: CredentialData): Promise<Credential> {
    const response = await this.client.post('/credentials', {
      name: credentials.name,
      type: credentials.type,
      data: this.encryptCredentialData(credentials.data),
    })
    
    return response.data
  }
  
  private encryptCredentialData(data: any): string {
    // Implement encryption logic
    return Buffer.from(JSON.stringify(data)).toString('base64')
  }
}

// Types
interface WorkflowConfig {
  name: string
  nodes: N8NNode[]
  connections: N8NConnection
  settings?: WorkflowSettings
  staticData?: any
  tags?: string[]
}

interface N8NNode {
  id: string
  name: string
  type: string
  position: [number, number]
  parameters: any
  credentials?: Record<string, any>
  disabled?: boolean
}

interface N8NConnection {
  [nodeId: string]: {
    [outputName: string]: Array<{
      node: string
      type: string
      index: number
    }>
  }
}
\`\`\`

## Custom N8N Nodes

### 1. MCP Agent Node
\`\`\`typescript
// custom-nodes/McpAgent/McpAgent.node.ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
  NodeOperationError,
} from 'n8n-workflow'

export class McpAgent implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'MCP Agent',
    name: 'mcpAgent',
    icon: 'file:mcp.svg',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["agentType"]}}',
    description: 'Interact with MCP protocol agents',
    defaults: {
      name: 'MCP Agent',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'mcpApi',
        required: true,
      },
    ],
    properties: [
      {
        displayName: 'Operation',
        name: 'operation',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Send Task',
            value: 'sendTask',
            description: 'Send a task to an agent',
          },
          {
            name: 'Get Status',
            value: 'getStatus',
            description: 'Get agent or task status',
          },
          {
            name: 'Deploy Agent',
            value: 'deployAgent',
            description: 'Deploy a new agent',
          },
        ],
        default: 'sendTask',
      },
      {
        displayName: 'Agent Type',
        name: 'agentType',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['sendTask', 'deployAgent'],
          },
        },
        options: [
          {
            name: 'Neo (Orchestrator)',
            value: 'neo',
          },
          {
            name: 'Oracle (Analyzer)',
            value: 'oracle',
          },
          {
            name: 'Trinity (UX Specialist)',
            value: 'trinity',
          },
          {
            name: 'Morpheus (Backend)',
            value: 'morpheus',
          },
        ],
        default: 'neo',
      },
      {
        displayName: 'Task Type',
        name: 'taskType',
        type: 'options',
        displayOptions: {
          show: {
            operation: ['sendTask'],
          },
        },
        options: [
          {
            name: 'Analysis',
            value: 'analysis',
          },
          {
            name: 'Implementation',
            value: 'implementation',
          },
          {
            name: 'Review',
            value: 'review',
          },
          {
            name: 'Testing',
            value: 'testing',
          },
        ],
        default: 'analysis',
      },
      {
        displayName: 'Task Description',
        name: 'taskDescription',
        type: 'string',
        typeOptions: {
          rows: 4,
        },
        displayOptions: {
          show: {
            operation: ['sendTask'],
          },
        },
        default: '',
        description: 'Detailed description of the task',
      },
      {
        displayName: 'Additional Fields',
        name: 'additionalFields',
        type: 'collection',
        placeholder: 'Add Field',
        default: {},
        options: [
          {
            displayName: 'Priority',
            name: 'priority',
            type: 'options',
            options: [
              {
                name: 'Low',
                value: 'low',
              },
              {
                name: 'Medium',
                value: 'medium',
              },
              {
                name: 'High',
                value: 'high',
              },
              {
                name: 'Critical',
                value: 'critical',
              },
            ],
            default: 'medium',
          },
          {
            displayName: 'Timeout',
            name: 'timeout',
            type: 'number',
            default: 300,
            description: 'Timeout in seconds',
          },
          {
            displayName: 'Context',
            name: 'context',
            type: 'json',
            default: '{}',
            description: 'Additional context for the agent',
          },
        ],
      },
    ],
  }
  
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData()
    const returnData: INodeExecutionData[] = []
    const credentials = await this.getCredentials('mcpApi')
    
    const mcpClient = new MCPClient(
      credentials.apiUrl as string,
      credentials.apiKey as string
    )
    
    for (let i = 0; i < items.length; i++) {
      try {
        const operation = this.getNodeParameter('operation', i) as string
        const agentType = this.getNodeParameter('agentType', i) as string
        
        let result: any
        
        switch (operation) {
          case 'sendTask':
            const taskType = this.getNodeParameter('taskType', i) as string
            const taskDescription = this.getNodeParameter('taskDescription', i) as string
            const additionalFields = this.getNodeParameter('additionalFields', i) as any
            
            result = await mcpClient.sendTask({
              agentType,
              taskType,
              description: taskDescription,
              priority: additionalFields.priority || 'medium',
              timeout: additionalFields.timeout || 300,
              context: additionalFields.context ? JSON.parse(additionalFields.context) : {},
              inputData: items[i].json,
            })
            break
            
          case 'getStatus':
            const taskId = items[i].json.taskId as string
            if (!taskId) {
              throw new NodeOperationError(
                this.getNode(),
                'Task ID is required for status check'
              )
            }
            
            result = await mcpClient.getTaskStatus(taskId)
            break
            
          case 'deployAgent':
            result = await mcpClient.deployAgent({
              type: agentType,
              config: items[i].json,
            })
            break
            
          default:
            throw new NodeOperationError(
              this.getNode(),
              \`Unknown operation: \${operation}\`
            )
        }
        
        returnData.push({
          json: result,
          pairedItem: { item: i },
        })
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: {
              error: error.message,
            },
            pairedItem: { item: i },
          })
          continue
        }
        throw error
      }
    }
    
    return [returnData]
  }
}

// MCP Client implementation
class MCPClient {
  constructor(private apiUrl: string, private apiKey: string) {}
  
  async sendTask(task: any): Promise<any> {
    const response = await fetch(\`\${this.apiUrl}/tasks\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    })
    
    if (!response.ok) {
      throw new Error(\`MCP API error: \${response.statusText}\`)
    }
    
    return response.json()
  }
  
  async getTaskStatus(taskId: string): Promise<any> {
    const response = await fetch(\`\${this.apiUrl}/tasks/\${taskId}\`, {
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
      },
    })
    
    if (!response.ok) {
      throw new Error(\`MCP API error: \${response.statusText}\`)
    }
    
    return response.json()
  }
  
  async deployAgent(config: any): Promise<any> {
    const response = await fetch(\`\${this.apiUrl}/agents\`, {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${this.apiKey}\`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    })
    
    if (!response.ok) {
      throw new Error(\`MCP API error: \${response.statusText}\`)
    }
    
    return response.json()
  }
}
\`\`\`

### 2. Workflow Orchestrator Node
\`\`\`typescript
// custom-nodes/WorkflowOrchestrator/WorkflowOrchestrator.node.ts
export class WorkflowOrchestrator implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Workflow Orchestrator',
    name: 'workflowOrchestrator',
    icon: 'fa:project-diagram',
    group: ['transform'],
    version: 1,
    description: 'Orchestrate complex multi-agent workflows',
    defaults: {
      name: 'Workflow Orchestrator',
    },
    inputs: ['main'],
    outputs: ['main', 'main'], // Success and error outputs
    outputNames: ['success', 'error'],
    properties: [
      {
        displayName: 'Orchestration Strategy',
        name: 'strategy',
        type: 'options',
        options: [
          {
            name: 'Sequential',
            value: 'sequential',
            description: 'Execute agents one after another',
          },
          {
            name: 'Parallel',
            value: 'parallel',
            description: 'Execute agents simultaneously',
          },
          {
            name: 'Conditional',
            value: 'conditional',
            description: 'Execute based on conditions',
          },
          {
            name: 'Map-Reduce',
            value: 'mapreduce',
            description: 'Distribute and aggregate',
          },
        ],
        default: 'sequential',
      },
      {
        displayName: 'Agent Pipeline',
        name: 'pipeline',
        type: 'fixedCollection',
        typeOptions: {
          multipleValues: true,
        },
        default: {},
        options: [
          {
            name: 'stage',
            displayName: 'Stage',
            values: [
              {
                displayName: 'Stage Name',
                name: 'name',
                type: 'string',
                default: '',
              },
              {
                displayName: 'Agents',
                name: 'agents',
                type: 'multiOptions',
                options: [
                  {
                    name: 'Neo',
                    value: 'neo',
                  },
                  {
                    name: 'Oracle',
                    value: 'oracle',
                  },
                  {
                    name: 'Trinity',
                    value: 'trinity',
                  },
                  {
                    name: 'Morpheus',
                    value: 'morpheus',
                  },
                ],
                default: [],
              },
              {
                displayName: 'Condition',
                name: 'condition',
                type: 'string',
                displayOptions: {
                  show: {
                    '/strategy': ['conditional'],
                  },
                },
                default: '',
                placeholder: 'e.g., {{$json.status}} === "success"',
              },
            ],
          },
        ],
      },
      {
        displayName: 'Error Handling',
        name: 'errorHandling',
        type: 'options',
        options: [
          {
            name: 'Stop on Error',
            value: 'stop',
          },
          {
            name: 'Continue on Error',
            value: 'continue',
          },
          {
            name: 'Retry with Backoff',
            value: 'retry',
          },
        ],
        default: 'stop',
      },
      {
        displayName: 'Options',
        name: 'options',
        type: 'collection',
        placeholder: 'Add Option',
        default: {},
        options: [
          {
            displayName: 'Max Retries',
            name: 'maxRetries',
            type: 'number',
            displayOptions: {
              show: {
                '/errorHandling': ['retry'],
              },
            },
            default: 3,
          },
          {
            displayName: 'Timeout Per Stage',
            name: 'stageTimeout',
            type: 'number',
            default: 300,
            description: 'Timeout in seconds',
          },
          {
            displayName: 'Aggregate Results',
            name: 'aggregateResults',
            type: 'boolean',
            default: true,
            description: 'Combine results from all stages',
          },
        ],
      },
    ],
  }
  
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData()
    const strategy = this.getNodeParameter('strategy', 0) as string
    const pipeline = this.getNodeParameter('pipeline', 0) as any
    const errorHandling = this.getNodeParameter('errorHandling', 0) as string
    const options = this.getNodeParameter('options', 0) as any
    
    const successOutput: INodeExecutionData[] = []
    const errorOutput: INodeExecutionData[] = []
    
    for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
      const item = items[itemIndex]
      const orchestrator = new PipelineOrchestrator(strategy, errorHandling, options)
      
      try {
        const results = await orchestrator.execute(pipeline.stage || [], item.json)
        
        successOutput.push({
          json: {
            ...item.json,
            orchestrationResults: results,
            orchestrationMetadata: {
              strategy,
              stagesExecuted: results.length,
              timestamp: new Date().toISOString(),
            },
          },
          pairedItem: { item: itemIndex },
        })
      } catch (error) {
        errorOutput.push({
          json: {
            ...item.json,
            error: error.message,
            orchestrationMetadata: {
              strategy,
              failedAt: error.stage || 'unknown',
              timestamp: new Date().toISOString(),
            },
          },
          pairedItem: { item: itemIndex },
        })
        
        if (errorHandling === 'stop') {
          throw error
        }
      }
    }
    
    return [successOutput, errorOutput]
  }
}

// Pipeline orchestrator implementation
class PipelineOrchestrator {
  constructor(
    private strategy: string,
    private errorHandling: string,
    private options: any
  ) {}
  
  async execute(stages: any[], inputData: any): Promise<any[]> {
    switch (this.strategy) {
      case 'sequential':
        return this.executeSequential(stages, inputData)
      case 'parallel':
        return this.executeParallel(stages, inputData)
      case 'conditional':
        return this.executeConditional(stages, inputData)
      case 'mapreduce':
        return this.executeMapReduce(stages, inputData)
      default:
        throw new Error(\`Unknown strategy: \${this.strategy}\`)
    }
  }
  
  private async executeSequential(stages: any[], inputData: any): Promise<any[]> {
    const results = []
    let currentData = inputData
    
    for (const stage of stages) {
      const stageResult = await this.executeStage(stage, currentData)
      results.push(stageResult)
      
      // Pass output to next stage
      currentData = this.options.aggregateResults
        ? { ...currentData, ...stageResult }
        : stageResult
    }
    
    return results
  }
  
  private async executeParallel(stages: any[], inputData: any): Promise<any[]> {
    const promises = stages.map(stage => 
      this.executeStage(stage, inputData)
    )
    
    return Promise.all(promises)
  }
  
  private async executeConditional(stages: any[], inputData: any): Promise<any[]> {
    const results = []
    
    for (const stage of stages) {
      if (this.evaluateCondition(stage.condition, inputData)) {
        const stageResult = await this.executeStage(stage, inputData)
        results.push(stageResult)
      }
    }
    
    return results
  }
  
  private async executeMapReduce(stages: any[], inputData: any): Promise<any[]> {
    // Map phase
    const mapStage = stages[0]
    const mapResults = await Promise.all(
      mapStage.agents.map((agent: string) =>
        this.executeAgent(agent, inputData)
      )
    )
    
    // Reduce phase
    const reduceStage = stages[1]
    const reducedResult = await this.executeStage(reduceStage, {
      ...inputData,
      mapResults,
    })
    
    return [{ map: mapResults, reduce: reducedResult }]
  }
  
  private async executeStage(stage: any, data: any): Promise<any> {
    const agentPromises = stage.agents.map((agent: string) =>
      this.executeAgent(agent, data)
    )
    
    const results = await Promise.all(agentPromises)
    
    return {
      stageName: stage.name,
      results,
      timestamp: new Date().toISOString(),
    }
  }
  
  private async executeAgent(agentType: string, data: any): Promise<any> {
    // Implementation would call MCP protocol
    return {
      agent: agentType,
      status: 'completed',
      result: { processed: true },
    }
  }
  
  private evaluateCondition(condition: string, data: any): boolean {
    // Simple condition evaluation
    try {
      return new Function('$json', \`return \${condition}\`)(data)
    } catch {
      return false
    }
  }
}
\`\`\`

## Webhook Integration

### 1. N8N Webhook Handler
\`\`\`typescript
// apps/api/src/webhooks/n8n-webhook.ts
import { Request, Response } from 'express'
import { n8nClient } from '@/lib/n8n-client'
import { prisma } from '@/lib/prisma'
import { mcpProtocol } from '@/lib/mcp-protocol'

export async function handleN8NWebhook(req: Request, res: Response) {
  try {
    const { workflowId, executionId, nodeId } = req.params
    const payload = req.body
    
    // Validate webhook signature
    const signature = req.headers['x-n8n-signature'] as string
    if (!validateWebhookSignature(signature, payload)) {
      return res.status(401).json({ error: 'Invalid signature' })
    }
    
    // Get workflow context
    const workflow = await prisma.workflow.findUnique({
      where: { n8nWorkflowId: workflowId },
      include: {
        agents: true,
        executions: {
          where: { n8nExecutionId: executionId },
          take: 1,
        },
      },
    })
    
    if (!workflow) {
      return res.status(404).json({ error: 'Workflow not found' })
    }
    
    // Process based on webhook type
    const webhookType = payload.webhookType || 'data'
    
    switch (webhookType) {
      case 'workflow.start':
        await handleWorkflowStart(workflow, payload)
        break
        
      case 'workflow.complete':
        await handleWorkflowComplete(workflow, payload)
        break
        
      case 'node.execute':
        await handleNodeExecute(workflow, nodeId, payload)
        break
        
      case 'agent.callback':
        await handleAgentCallback(workflow, payload)
        break
        
      default:
        await handleDataWebhook(workflow, payload)
    }
    
    res.json({ success: true, received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

async function handleWorkflowStart(workflow: any, payload: any) {
  // Create execution record
  const execution = await prisma.workflowExecution.create({
    data: {
      workflowId: workflow.id,
      n8nExecutionId: payload.executionId,
      status: 'running',
      startedAt: new Date(),
      context: payload.context || {},
    },
  })
  
  // Notify agents
  for (const agent of workflow.agents) {
    await mcpProtocol.sendMessage({
      type: 'workflow.started',
      agentId: agent.id,
      payload: {
        workflowId: workflow.id,
        executionId: execution.id,
        context: execution.context,
      },
    })
  }
}

async function handleWorkflowComplete(workflow: any, payload: any) {
  // Update execution
  await prisma.workflowExecution.update({
    where: {
      workflowId_n8nExecutionId: {
        workflowId: workflow.id,
        n8nExecutionId: payload.executionId,
      },
    },
    data: {
      status: payload.success ? 'completed' : 'failed',
      completedAt: new Date(),
      results: payload.data || {},
      error: payload.error,
    },
  })
  
  // Cleanup agent resources
  for (const agent of workflow.agents) {
    await mcpProtocol.sendMessage({
      type: 'workflow.completed',
      agentId: agent.id,
      payload: {
        workflowId: workflow.id,
        executionId: payload.executionId,
        success: payload.success,
      },
    })
  }
}

async function handleNodeExecute(workflow: any, nodeId: string, payload: any) {
  // Find node configuration
  const node = workflow.nodes.find((n: any) => n.id === nodeId)
  
  if (node?.type === 'mcpAgent') {
    // Route to appropriate agent
    const agentType = node.parameters.agentType
    const agent = workflow.agents.find((a: any) => a.type === agentType)
    
    if (agent) {
      const response = await mcpProtocol.sendTask({
        agentId: agent.id,
        task: {
          type: node.parameters.taskType,
          payload: payload.data,
          context: {
            workflowId: workflow.id,
            nodeId: nodeId,
            executionId: payload.executionId,
          },
        },
      })
      
      // Store task result
      await prisma.taskExecution.create({
        data: {
          agentId: agent.id,
          workflowExecutionId: payload.executionId,
          nodeId: nodeId,
          status: 'completed',
          result: response.result,
        },
      })
    }
  }
}

async function handleAgentCallback(workflow: any, payload: any) {
  const { agentId, taskId, result } = payload
  
  // Update task status
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status: 'completed',
      completedAt: new Date(),
      result: result,
    },
  })
  
  // Continue workflow execution
  if (payload.continueExecution) {
    await n8nClient.executeWorkflow(workflow.n8nWorkflowId, result, {
      startNodes: [payload.nextNodeId],
    })
  }
}

async function handleDataWebhook(workflow: any, payload: any) {
  // Process incoming data
  const processedData = await processWebhookData(payload)
  
  // Store in database
  await prisma.webhookData.create({
    data: {
      workflowId: workflow.id,
      source: payload.source || 'external',
      data: processedData,
      receivedAt: new Date(),
    },
  })
  
  // Trigger workflow if configured
  if (workflow.settings.autoTrigger) {
    await n8nClient.executeWorkflow(workflow.n8nWorkflowId, processedData)
  }
}

function validateWebhookSignature(signature: string, payload: any): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.N8N_WEBHOOK_SECRET!)
    .update(JSON.stringify(payload))
    .digest('hex')
  
  return signature === expectedSignature
}
\`\`\`

### 2. Workflow Templates
\`\`\`typescript
// lib/workflow-templates.ts

export const workflowTemplates = {
  // Agent orchestration workflow
  agentOrchestration: {
    name: 'Multi-Agent Task Processing',
    nodes: [
      {
        id: 'webhook_trigger',
        type: 'n8n-nodes-base.webhook',
        position: [250, 300],
        parameters: {
          path: 'agent-tasks',
          httpMethod: 'POST',
          responseMode: 'onReceived',
          options: {},
        },
      },
      {
        id: 'task_router',
        type: 'n8n-nodes-base.switch',
        position: [450, 300],
        parameters: {
          dataType: 'string',
          value1: '={{$json["taskType"]}}',
          rules: {
            rules: [
              {
                value2: 'analysis',
                output: 0,
              },
              {
                value2: 'implementation',
                output: 1,
              },
              {
                value2: 'review',
                output: 2,
              },
            ],
          },
        },
      },
      {
        id: 'oracle_agent',
        type: 'mcpAgent',
        position: [650, 100],
        parameters: {
          agentType: 'oracle',
          taskType: 'analysis',
          taskDescription: '={{$json["description"]}}',
          additionalFields: {
            priority: '={{$json["priority"]}}',
            context: '={{$json["context"]}}',
          },
        },
      },
      {
        id: 'morpheus_agent',
        type: 'mcpAgent',
        position: [650, 300],
        parameters: {
          agentType: 'morpheus',
          taskType: 'implementation',
          taskDescription: '={{$json["description"]}}',
        },
      },
      {
        id: 'tank_agent',
        type: 'mcpAgent',
        position: [650, 500],
        parameters: {
          agentType: 'tank',
          taskType: 'review',
          taskDescription: '={{$json["description"]}}',
        },
      },
      {
        id: 'result_aggregator',
        type: 'n8n-nodes-base.merge',
        position: [850, 300],
        parameters: {
          mode: 'multiplex',
          options: {},
        },
      },
      {
        id: 'webhook_response',
        type: 'n8n-nodes-base.respondToWebhook',
        position: [1050, 300],
        parameters: {
          respondWith: 'json',
          responseBody: '={{$json}}',
        },
      },
    ],
    connections: {
      webhook_trigger: {
        main: [
          [
            {
              node: 'task_router',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      task_router: {
        main: [
          [
            {
              node: 'oracle_agent',
              type: 'main',
              index: 0,
            },
          ],
          [
            {
              node: 'morpheus_agent',
              type: 'main',
              index: 0,
            },
          ],
          [
            {
              node: 'tank_agent',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      oracle_agent: {
        main: [
          [
            {
              node: 'result_aggregator',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      morpheus_agent: {
        main: [
          [
            {
              node: 'result_aggregator',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      tank_agent: {
        main: [
          [
            {
              node: 'result_aggregator',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
      result_aggregator: {
        main: [
          [
            {
              node: 'webhook_response',
              type: 'main',
              index: 0,
            },
          ],
        ],
      },
    },
  },
  
  // RAG pipeline workflow
  ragPipeline: {
    name: 'RAG Document Processing Pipeline',
    nodes: [
      {
        id: 'document_trigger',
        type: 'n8n-nodes-base.filesystemTrigger',
        position: [250, 300],
        parameters: {
          path: '/documents/incoming',
          event: 'create',
        },
      },
      {
        id: 'document_reader',
        type: 'n8n-nodes-base.readPdf',
        position: [450, 300],
        parameters: {
          binaryPropertyName: 'data',
        },
      },
      {
        id: 'text_splitter',
        type: 'n8n-nodes-base.itemLists',
        position: [650, 300],
        parameters: {
          operation: 'splitIntoItems',
          fieldToSplitOut: 'text',
          options: {
            destinationFieldName: 'chunk',
            separator: '\\n\\n',
          },
        },
      },
      {
        id: 'embedding_generator',
        type: 'mcpAgent',
        position: [850, 300],
        parameters: {
          agentType: 'oracle',
          taskType: 'embedding',
          taskDescription: 'Generate embeddings for text chunk',
          additionalFields: {
            context: {
              model: 'text-embedding-3-small',
              dimensions: 1536,
            },
          },
        },
      },
      {
        id: 'vector_store',
        type: 'n8n-nodes-base.supabase',
        position: [1050, 300],
        parameters: {
          operation: 'insert',
          table: 'embeddings',
          columns: 'content,embedding,metadata',
          options: {},
        },
      },
      {
        id: 'neo4j_graph',
        type: 'n8n-nodes-base.neo4j',
        position: [1050, 500],
        parameters: {
          operation: 'create',
          query: \`
            CREATE (d:Document {id: $id, title: $title})
            WITH d
            UNWIND $entities as entity
            MERGE (e:Entity {name: entity.name, type: entity.type})
            CREATE (d)-[:MENTIONS {frequency: entity.frequency}]->(e)
          \`,
        },
      },
    ],
  },
  
  // Error handling workflow
  errorHandling: {
    name: 'Workflow Error Handler',
    nodes: [
      {
        id: 'error_trigger',
        type: 'n8n-nodes-base.errorTrigger',
        position: [250, 300],
        parameters: {},
      },
      {
        id: 'error_classifier',
        type: 'n8n-nodes-base.switch',
        position: [450, 300],
        parameters: {
          dataType: 'string',
          value1: '={{$json["error"]["name"]}}',
          rules: {
            rules: [
              {
                value2: 'NodeOperationError',
                output: 0,
              },
              {
                value2: 'NodeApiError',
                output: 1,
              },
              {
                value2: 'WorkflowOperationError',
                output: 2,
              },
            ],
            fallbackOutput: 3,
          },
        },
      },
      {
        id: 'retry_handler',
        type: 'n8n-nodes-base.wait',
        position: [650, 100],
        parameters: {
          amount: 5,
          unit: 'seconds',
        },
      },
      {
        id: 'alert_admin',
        type: 'n8n-nodes-base.emailSend',
        position: [650, 300],
        parameters: {
          fromEmail: 'n8n@mas.system',
          toEmail: 'admin@mas.system',
          subject: 'Workflow Error: {{$json["workflow"]["name"]}}',
          text: 'Error: {{$json["error"]["message"]}}\\n\\nStack: {{$json["error"]["stack"]}}',
        },
      },
      {
        id: 'log_error',
        type: 'n8n-nodes-base.postgres',
        position: [650, 500],
        parameters: {
          operation: 'insert',
          table: 'error_logs',
          columns: 'workflow_id,execution_id,error_type,error_message,stack_trace,created_at',
        },
      },
      {
        id: 'retry_workflow',
        type: 'n8n-nodes-base.executeWorkflow',
        position: [850, 100],
        parameters: {
          workflowId: '={{$json["workflow"]["id"]}}',
          workflowData: '={{$json["inputData"]}}',
        },
      },
    ],
  },
}

// Function to deploy template
export async function deployWorkflowTemplate(
  templateName: keyof typeof workflowTemplates,
  customizations?: Partial<WorkflowConfig>
): Promise<N8NWorkflow> {
  const template = workflowTemplates[templateName]
  
  const workflow = await n8nClient.createWorkflow({
    ...template,
    ...customizations,
    tags: ['template', templateName],
  })
  
  // Activate workflow
  await n8nClient.activateWorkflow(workflow.id)
  
  return workflow
}
\`\`\`

## Monitoring and Analytics

\`\`\`typescript
// lib/n8n-monitoring.ts
import { EventEmitter } from 'events'
import { StatsD } from 'node-statsd'

export class N8NMonitor extends EventEmitter {
  private statsd: StatsD
  private metricsInterval: NodeJS.Timeout
  
  constructor() {
    super()
    
    this.statsd = new StatsD({
      host: process.env.STATSD_HOST || 'localhost',
      port: parseInt(process.env.STATSD_PORT || '8125'),
      prefix: 'n8n_mas.',
    })
    
    this.startMetricsCollection()
  }
  
  private startMetricsCollection() {
    this.metricsInterval = setInterval(async () => {
      try {
        await this.collectMetrics()
      } catch (error) {
        console.error('Metrics collection error:', error)
      }
    }, 30000) // Every 30 seconds
  }
  
  private async collectMetrics() {
    // Workflow metrics
    const workflows = await n8nClient.getWorkflows()
    const activeWorkflows = workflows.filter(w => w.active).length
    
    this.statsd.gauge('workflows.total', workflows.length)
    this.statsd.gauge('workflows.active', activeWorkflows)
    
    // Execution metrics
    const executions = await n8nClient.getExecutions({
      startDate: new Date(Date.now() - 3600000).toISOString(), // Last hour
    })
    
    const successCount = executions.data.filter(e => e.finished && !e.stoppedAt).length
    const errorCount = executions.data.filter(e => e.stoppedAt).length
    
    this.statsd.increment('executions.success', successCount)
    this.statsd.increment('executions.error', errorCount)
    
    // Agent metrics
    const agentStats = await this.getAgentStats()
    
    for (const [agentType, stats] of Object.entries(agentStats)) {
      this.statsd.gauge(\`agents.\${agentType}.tasks_processed\`, stats.tasksProcessed)
      this.statsd.gauge(\`agents.\${agentType}.avg_response_time\`, stats.avgResponseTime)
      this.statsd.gauge(\`agents.\${agentType}.error_rate\`, stats.errorRate)
    }
    
    // Emit metrics event
    this.emit('metrics', {
      workflows: { total: workflows.length, active: activeWorkflows },
      executions: { success: successCount, error: errorCount },
      agents: agentStats,
    })
  }
  
  async getWorkflowMetrics(workflowId: string): Promise<WorkflowMetrics> {
    const executions = await n8nClient.getExecutions({
      workflowId,
      limit: 100,
    })
    
    const metrics = {
      totalExecutions: executions.data.length,
      successRate: 0,
      avgDuration: 0,
      errorTypes: {} as Record<string, number>,
    }
    
    let totalDuration = 0
    let successCount = 0
    
    for (const execution of executions.data) {
      if (execution.finished && !execution.stoppedAt) {
        successCount++
        const duration = new Date(execution.finished).getTime() - new Date(execution.startedAt).getTime()
        totalDuration += duration
      } else if (execution.stoppedAt) {
        const errorType = execution.data?.lastNodeExecuted || 'unknown'
        metrics.errorTypes[errorType] = (metrics.errorTypes[errorType] || 0) + 1
      }
    }
    
    metrics.successRate = (successCount / metrics.totalExecutions) * 100
    metrics.avgDuration = totalDuration / successCount
    
    return metrics
  }
  
  stop() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
    }
    this.statsd.close()
  }
}
\`\`\`
`,
      integrationPatterns: {
        webhooks: 'Bi-directional webhook communication',
        customNodes: 'Create N8N nodes for MCP agents',
        api: 'REST API integration with N8N',
        realtime: 'WebSocket for live updates',
        orchestration: 'Complex workflow patterns',
        monitoring: 'Metrics and analytics collection'
      },
      bestPractices: [
        'Use webhook signatures for security',
        'Implement proper error handling in workflows',
        'Design idempotent webhook handlers',
        'Use workflow templates for consistency',
        'Monitor execution performance',
        'Implement retry logic with exponential backoff',
        'Version control workflow configurations',
        'Test workflows in staging environment first'
      ],
      resources: [
        'N8N Documentation: https://docs.n8n.io/',
        'N8N API Reference: https://docs.n8n.io/api/',
        'Custom Nodes Guide: https://docs.n8n.io/integrations/creating-nodes/',
        'Workflow Examples: https://n8n.io/workflows/',
        'Community Forum: https://community.n8n.io/'
      ]
    };
  }
};

module.exports = hook;