#!/usr/bin/env node
/**
 * /fix-neo4j - Address Neo4j connection and GraphRAG implementation problems
 * 
 * Handles Neo4j-specific issues including connection setup, Cypher queries,
 * graph modeling, performance optimization, and GraphRAG implementations.
 */

const hook = {
  name: 'fix-neo4j',
  description: 'Resolve Neo4j connection, Cypher queries, and GraphRAG issues',
  trigger: '/fix-neo4j',
  
  async execute(context) {
    const { error, issue, query } = context.args;
    
    const solutions = {
      // Neo4j Connection Setup
      'connection': {
        setup: `// Neo4j Driver Setup for N8N MAS

// 1. Install dependencies
npm install neo4j-driver @neo4j/graphql graphql

// 2. Environment variables
NEO4J_URI=neo4j://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=your-password
NEO4J_DATABASE=neo4j // Optional, defaults to 'neo4j'

// 3. Driver initialization (lib/neo4j.ts)
import neo4j, { Driver, Session, Transaction } from 'neo4j-driver'

class Neo4jService {
  private driver: Driver
  private database: string
  
  constructor() {
    this.driver = neo4j.driver(
      process.env.NEO4J_URI!,
      neo4j.auth.basic(
        process.env.NEO4J_USERNAME!,
        process.env.NEO4J_PASSWORD!
      ),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
        connectionTimeout: 30 * 1000, // 30 seconds
        logging: {
          level: 'info',
          logger: (level, message) => {
            console.log(\`Neo4j \${level}: \${message}\`)
          }
        }
      }
    )
    
    this.database = process.env.NEO4J_DATABASE || 'neo4j'
    
    // Verify connectivity
    this.verifyConnectivity()
  }
  
  async verifyConnectivity(): Promise<void> {
    const session = this.driver.session()
    try {
      await session.run('RETURN 1')
      console.log('Neo4j connection established')
    } catch (error) {
      console.error('Neo4j connection failed:', error)
      throw error
    } finally {
      await session.close()
    }
  }
  
  getSession(mode: 'READ' | 'WRITE' = 'WRITE'): Session {
    return this.driver.session({
      database: this.database,
      defaultAccessMode: mode === 'READ' 
        ? neo4j.session.READ 
        : neo4j.session.WRITE
    })
  }
  
  async close(): Promise<void> {
    await this.driver.close()
  }
}

export const neo4jService = new Neo4jService()

// 4. Connection pooling best practices
export async function withSession<T>(
  work: (session: Session) => Promise<T>,
  mode: 'READ' | 'WRITE' = 'WRITE'
): Promise<T> {
  const session = neo4jService.getSession(mode)
  try {
    return await work(session)
  } finally {
    await session.close()
  }
}

// 5. Transaction handling
export async function withTransaction<T>(
  work: (tx: Transaction) => Promise<T>
): Promise<T> {
  return withSession(async (session) => {
    return await session.writeTransaction(work)
  })
}

// 6. Read replica routing
export async function withReadReplica<T>(
  work: (session: Session) => Promise<T>
): Promise<T> {
  return withSession(work, 'READ')
}`,

        errorHandling: `// Neo4j Error Handling Patterns

import { Neo4jError } from 'neo4j-driver'

export class Neo4jErrorHandler {
  static handle(error: any): never {
    if (error instanceof Neo4jError) {
      switch (error.code) {
        case 'Neo.ClientError.Schema.ConstraintValidationFailed':
          throw new Error('Unique constraint violation')
          
        case 'Neo.ClientError.Statement.EntityNotFound':
          throw new Error('Entity not found')
          
        case 'Neo.ClientError.Security.Unauthorized':
          throw new Error('Authentication failed')
          
        case 'Neo.TransientError.Transaction.Terminated':
          throw new Error('Transaction was terminated. Please retry.')
          
        case 'Neo.ClientError.Transaction.TransactionTimedOut':
          throw new Error('Transaction timed out')
          
        default:
          console.error('Neo4j Error:', error)
          throw new Error(\`Database error: \${error.message}\`)
      }
    }
    
    throw error
  }
}

// Retry logic for transient errors
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation()
    } catch (error: any) {
      lastError = error
      
      // Only retry transient errors
      if (error?.code?.startsWith('Neo.TransientError')) {
        console.log(\`Retrying after transient error (attempt \${i + 1}/\${maxRetries})\`)
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)))
        continue
      }
      
      // Don't retry other errors
      throw error
    }
  }
  
  throw lastError
}`
      },

      // Graph Data Modeling
      'dataModeling': {
        schema: `// Neo4j Graph Schema for N8N MAS

// 1. Create constraints and indexes
const setupSchema = async () => {
  const session = neo4jService.getSession()
  
  try {
    // Unique constraints
    await session.run(\`
      CREATE CONSTRAINT user_id_unique IF NOT EXISTS
      FOR (u:User) REQUIRE u.id IS UNIQUE
    \`)
    
    await session.run(\`
      CREATE CONSTRAINT agent_id_unique IF NOT EXISTS
      FOR (a:Agent) REQUIRE a.id IS UNIQUE
    \`)
    
    await session.run(\`
      CREATE CONSTRAINT workflow_id_unique IF NOT EXISTS
      FOR (w:Workflow) REQUIRE w.id IS UNIQUE
    \`)
    
    // Indexes for performance
    await session.run(\`
      CREATE INDEX user_email IF NOT EXISTS
      FOR (u:User) ON (u.email)
    \`)
    
    await session.run(\`
      CREATE INDEX agent_type IF NOT EXISTS
      FOR (a:Agent) ON (a.type)
    \`)
    
    await session.run(\`
      CREATE INDEX task_status IF NOT EXISTS
      FOR (t:Task) ON (t.status)
    \`)
    
    // Full-text search indexes
    await session.run(\`
      CREATE FULLTEXT INDEX workflow_search IF NOT EXISTS
      FOR (w:Workflow) ON EACH [w.name, w.description]
    \`)
    
    console.log('Neo4j schema setup completed')
  } finally {
    await session.close()
  }
}

// 2. Node definitions
interface UserNode {
  id: string
  email: string
  username: string
  createdAt: string
  metadata: Record<string, any>
}

interface AgentNode {
  id: string
  name: string
  type: 'orchestrator' | 'specialist' | 'analyzer'
  capabilities: string[]
  status: 'active' | 'inactive' | 'busy'
  model: string
  createdAt: string
}

interface WorkflowNode {
  id: string
  name: string
  description: string
  config: Record<string, any>
  version: number
  published: boolean
  createdAt: string
  updatedAt: string
}

interface TaskNode {
  id: string
  type: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  payload: Record<string, any>
  result?: Record<string, any>
  createdAt: string
  completedAt?: string
}

// 3. Relationship definitions
interface Relationships {
  // User relationships
  CREATED: { by: string; at: string }
  OWNS: { since: string; permissions: string[] }
  MEMBER_OF: { role: string; joinedAt: string }
  
  // Agent relationships
  COLLABORATES_WITH: { strength: number; context: string }
  SUPERVISES: { since: string }
  SPECIALIZES_IN: { expertise: string[]; level: number }
  
  // Workflow relationships
  TRIGGERS: { condition: string; delay?: number }
  DEPENDS_ON: { type: 'strict' | 'soft'; timeout?: number }
  INCLUDES: { position: number; config: Record<string, any> }
  
  // Task relationships
  ASSIGNED_TO: { at: string; priority: number }
  PRECEDED_BY: { gap?: number }
  PRODUCES: { format: string; size?: number }
}

// 4. Graph patterns
const graphPatterns = {
  // User's agent network
  userAgentNetwork: \`
    MATCH (u:User {id: $userId})-[:OWNS]->(a:Agent)
    OPTIONAL MATCH (a)-[:COLLABORATES_WITH]-(other:Agent)
    RETURN u, a, other
  \`,
  
  // Workflow dependencies
  workflowDependencies: \`
    MATCH path = (w:Workflow {id: $workflowId})-[:DEPENDS_ON*]->(dep:Workflow)
    RETURN path
  \`,
  
  // Agent collaboration graph
  agentCollaboration: \`
    MATCH (a1:Agent)-[c:COLLABORATES_WITH]-(a2:Agent)
    WHERE c.strength > $threshold
    RETURN a1, a2, c
    ORDER BY c.strength DESC
  \`,
  
  // Task execution path
  taskExecutionPath: \`
    MATCH path = (t:Task {id: $taskId})-[:PRECEDED_BY*]->(root:Task)
    WHERE NOT (root)-[:PRECEDED_BY]->()
    RETURN path
  \`
}`,

        operations: `// Neo4j CRUD Operations for N8N MAS

export class Neo4jRepository {
  // Create operations
  async createUser(user: Omit<UserNode, 'createdAt'>): Promise<UserNode> {
    return withTransaction(async (tx) => {
      const result = await tx.run(
        \`
        CREATE (u:User {
          id: randomUUID(),
          email: $email,
          username: $username,
          createdAt: datetime(),
          metadata: $metadata
        })
        RETURN u
        \`,
        {
          email: user.email,
          username: user.username,
          metadata: JSON.stringify(user.metadata || {})
        }
      )
      
      return this.parseNode(result.records[0].get('u'))
    })
  }
  
  async createAgent(agent: Omit<AgentNode, 'id' | 'createdAt'>, ownerId: string): Promise<AgentNode> {
    return withTransaction(async (tx) => {
      const result = await tx.run(
        \`
        MATCH (u:User {id: $ownerId})
        CREATE (a:Agent {
          id: randomUUID(),
          name: $name,
          type: $type,
          capabilities: $capabilities,
          status: $status,
          model: $model,
          createdAt: datetime()
        })
        CREATE (u)-[:OWNS {since: datetime()}]->(a)
        RETURN a
        \`,
        {
          ownerId,
          name: agent.name,
          type: agent.type,
          capabilities: agent.capabilities,
          status: agent.status,
          model: agent.model
        }
      )
      
      return this.parseNode(result.records[0].get('a'))
    })
  }
  
  // Read operations with relationships
  async getUserWithAgents(userId: string): Promise<any> {
    return withSession(async (session) => {
      const result = await session.run(
        \`
        MATCH (u:User {id: $userId})
        OPTIONAL MATCH (u)-[:OWNS]->(a:Agent)
        OPTIONAL MATCH (u)-[:CREATED]->(w:Workflow)
        RETURN u,
               collect(DISTINCT a) as agents,
               collect(DISTINCT w) as workflows
        \`,
        { userId }
      )
      
      if (result.records.length === 0) {
        return null
      }
      
      const record = result.records[0]
      return {
        user: this.parseNode(record.get('u')),
        agents: record.get('agents').map(this.parseNode),
        workflows: record.get('workflows').map(this.parseNode)
      }
    }, 'READ')
  }
  
  // Update operations
  async updateAgent(agentId: string, updates: Partial<AgentNode>): Promise<AgentNode> {
    return withTransaction(async (tx) => {
      const setClauses = Object.keys(updates)
        .filter(key => key !== 'id')
        .map(key => \`a.\${key} = $\${key}\`)
        .join(', ')
      
      const result = await tx.run(
        \`
        MATCH (a:Agent {id: $agentId})
        SET \${setClauses}, a.updatedAt = datetime()
        RETURN a
        \`,
        { agentId, ...updates }
      )
      
      if (result.records.length === 0) {
        throw new Error('Agent not found')
      }
      
      return this.parseNode(result.records[0].get('a'))
    })
  }
  
  // Delete operations (soft delete)
  async deleteAgent(agentId: string): Promise<void> {
    return withTransaction(async (tx) => {
      await tx.run(
        \`
        MATCH (a:Agent {id: $agentId})
        SET a.deletedAt = datetime(), a.status = 'inactive'
        \`,
        { agentId }
      )
    })
  }
  
  // Complex queries
  async findCollaboratingAgents(agentId: string, minStrength: number = 0.5): Promise<any[]> {
    return withSession(async (session) => {
      const result = await session.run(
        \`
        MATCH (a:Agent {id: $agentId})-[c:COLLABORATES_WITH]-(other:Agent)
        WHERE c.strength >= $minStrength
        AND a.deletedAt IS NULL
        AND other.deletedAt IS NULL
        RETURN other, c
        ORDER BY c.strength DESC
        \`,
        { agentId, minStrength }
      )
      
      return result.records.map(record => ({
        agent: this.parseNode(record.get('other')),
        collaboration: record.get('c').properties
      }))
    }, 'READ')
  }
  
  // Utility methods
  private parseNode(node: any): any {
    const properties = node.properties
    const parsed: any = {}
    
    for (const [key, value] of Object.entries(properties)) {
      if (neo4j.isDateTime(value)) {
        parsed[key] = value.toString()
      } else if (typeof value === 'string' && this.isJSON(value)) {
        parsed[key] = JSON.parse(value)
      } else {
        parsed[key] = value
      }
    }
    
    return parsed
  }
  
  private isJSON(str: string): boolean {
    try {
      JSON.parse(str)
      return true
    } catch {
      return false
    }
  }
}`
      },

      // GraphRAG Implementation
      'graphrag': {
        setup: `// GraphRAG Implementation with Neo4j

// 1. Knowledge graph schema for RAG
const setupGraphRAGSchema = async () => {
  const session = neo4jService.getSession()
  
  try {
    // Document nodes
    await session.run(\`
      CREATE CONSTRAINT document_id_unique IF NOT EXISTS
      FOR (d:Document) REQUIRE d.id IS UNIQUE
    \`)
    
    // Entity nodes
    await session.run(\`
      CREATE CONSTRAINT entity_id_unique IF NOT EXISTS
      FOR (e:Entity) REQUIRE e.id IS UNIQUE
    \`)
    
    // Concept nodes
    await session.run(\`
      CREATE CONSTRAINT concept_name_unique IF NOT EXISTS
      FOR (c:Concept) REQUIRE c.name IS UNIQUE
    \`)
    
    // Embedding vectors
    await session.run(\`
      CREATE VECTOR INDEX document_embeddings IF NOT EXISTS
      FOR (d:Document) ON d.embedding
      OPTIONS {indexConfig: {
        \`vector.dimensions\`: 1536,
        \`vector.similarity_function\`: 'cosine'
      }}
    \`)
    
    console.log('GraphRAG schema created')
  } finally {
    await session.close()
  }
}

// 2. Document ingestion with entity extraction
export async function ingestDocument(
  content: string,
  metadata: Record<string, any> = {}
): Promise<string> {
  return withTransaction(async (tx) => {
    // Generate embedding
    const embedding = await generateEmbedding(content)
    
    // Extract entities (using NLP service)
    const entities = await extractEntities(content)
    
    // Create document node
    const docResult = await tx.run(
      \`
      CREATE (d:Document {
        id: randomUUID(),
        content: $content,
        embedding: $embedding,
        metadata: $metadata,
        createdAt: datetime()
      })
      RETURN d.id as id
      \`,
      {
        content,
        embedding,
        metadata: JSON.stringify(metadata)
      }
    )
    
    const docId = docResult.records[0].get('id')
    
    // Create entities and relationships
    for (const entity of entities) {
      await tx.run(
        \`
        MATCH (d:Document {id: $docId})
        MERGE (e:Entity {id: $entityId, type: $type, name: $name})
        CREATE (d)-[:MENTIONS {
          frequency: $frequency,
          positions: $positions
        }]->(e)
        \`,
        {
          docId,
          entityId: entity.id,
          type: entity.type,
          name: entity.name,
          frequency: entity.frequency,
          positions: entity.positions
        }
      )
    }
    
    // Link related concepts
    await linkConcepts(tx, docId, content)
    
    return docId
  })
}

// 3. Hybrid search combining vector and graph
export async function hybridSearch(
  query: string,
  options: {
    vectorWeight?: number
    graphWeight?: number
    limit?: number
    entityTypes?: string[]
  } = {}
): Promise<any[]> {
  const {
    vectorWeight = 0.7,
    graphWeight = 0.3,
    limit = 10,
    entityTypes = []
  } = options
  
  const queryEmbedding = await generateEmbedding(query)
  
  return withSession(async (session) => {
    // Vector similarity search
    const vectorResults = await session.run(
      \`
      CALL db.index.vector.queryNodes(
        'document_embeddings',
        $limit,
        $embedding
      ) YIELD node, score
      RETURN node, score
      \`,
      {
        embedding: queryEmbedding,
        limit: limit * 2 // Get more for re-ranking
      }
    )
    
    // Graph-based search
    const graphResults = await session.run(
      \`
      CALL db.index.fulltext.queryNodes(
        'document_search',
        $query
      ) YIELD node, score
      MATCH (node)-[:MENTIONS]->(e:Entity)
      WHERE size($entityTypes) = 0 OR e.type IN $entityTypes
      WITH node, score, collect(e) as entities
      RETURN node, score, entities
      ORDER BY score DESC
      LIMIT $limit
      \`,
      {
        query,
        entityTypes,
        limit: limit * 2
      }
    )
    
    // Combine and re-rank results
    const combined = combineSearchResults(
      vectorResults.records,
      graphResults.records,
      vectorWeight,
      graphWeight
    )
    
    return combined.slice(0, limit)
  }, 'READ')
}

// 4. Graph-augmented generation
export async function graphAugmentedGeneration(
  query: string,
  systemPrompt?: string
): Promise<{
  answer: string
  sources: any[]
  graph: any
}> {
  // Find relevant documents and entities
  const searchResults = await hybridSearch(query, {
    limit: 5,
    vectorWeight: 0.6,
    graphWeight: 0.4
  })
  
  // Extract subgraph around relevant entities
  const subgraph = await extractRelevantSubgraph(
    searchResults.map(r => r.node.id)
  )
  
  // Build context from documents and graph
  const context = buildGraphContext(searchResults, subgraph)
  
  // Generate response with LLM
  const response = await generateWithContext(
    query,
    context,
    systemPrompt
  )
  
  return {
    answer: response,
    sources: searchResults,
    graph: subgraph
  }
}

// 5. Knowledge graph traversal for context
async function extractRelevantSubgraph(
  documentIds: string[],
  maxDepth: number = 2
): Promise<any> {
  return withSession(async (session) => {
    const result = await session.run(
      \`
      MATCH (d:Document)
      WHERE d.id IN $documentIds
      CALL apoc.path.expand(
        d,
        'MENTIONS|RELATES_TO|PART_OF',
        '+Entity|+Concept',
        1,
        $maxDepth
      ) YIELD path
      WITH collect(path) as paths
      CALL apoc.convert.toTree(paths) YIELD value
      RETURN value
      \`,
      {
        documentIds,
        maxDepth
      }
    )
    
    return result.records[0]?.get('value')
  }, 'READ')
}

// 6. Context building from graph
function buildGraphContext(
  documents: any[],
  subgraph: any
): string {
  let context = 'Relevant Documents:\n\n'
  
  // Add document content
  for (const doc of documents) {
    context += \`Document \${doc.node.id}:\n\${doc.node.content}\n\n\`
  }
  
  // Add entity relationships
  context += 'Entity Relationships:\n'
  const entities = extractEntitiesFromSubgraph(subgraph)
  
  for (const entity of entities) {
    context += \`- \${entity.name} (\${entity.type}): \${entity.relations.join(', ')}\n\`
  }
  
  // Add concept hierarchy
  context += '\nConcept Hierarchy:\n'
  const concepts = extractConceptsFromSubgraph(subgraph)
  context += formatConceptHierarchy(concepts)
  
  return context
}`,

        advanced: `// Advanced GraphRAG Patterns

// 1. Multi-hop reasoning
export async function multiHopReasoning(
  startEntity: string,
  targetType: string,
  maxHops: number = 3
): Promise<any[]> {
  return withSession(async (session) => {
    const result = await session.run(
      \`
      MATCH path = (start:Entity {id: $startEntity})-[*1..$maxHops]-(end:Entity {type: $targetType})
      WHERE all(r in relationships(path) WHERE type(r) IN ['RELATES_TO', 'CAUSES', 'INFLUENCES'])
      WITH path, reduce(score = 1.0, r in relationships(path) | score * r.weight) as pathScore
      RETURN path, pathScore
      ORDER BY pathScore DESC
      LIMIT 10
      \`,
      {
        startEntity,
        targetType,
        maxHops: neo4j.int(maxHops)
      }
    )
    
    return result.records.map(record => ({
      path: parsePath(record.get('path')),
      score: record.get('pathScore')
    }))
  }, 'READ')
}

// 2. Temporal graph queries
export async function temporalGraphQuery(
  query: string,
  timeRange: { start: Date; end: Date }
): Promise<any[]> {
  return withSession(async (session) => {
    const result = await session.run(
      \`
      MATCH (d:Document)-[:MENTIONS]->(e:Entity)
      WHERE d.createdAt >= datetime($start) 
        AND d.createdAt <= datetime($end)
        AND d.content CONTAINS $query
      WITH e, collect(d) as documents, count(d) as frequency
      MATCH (e)-[r:RELATES_TO]-(other:Entity)
      WHERE r.validFrom <= datetime($end) 
        AND (r.validTo IS NULL OR r.validTo >= datetime($start))
      RETURN e, documents, frequency, collect(other) as related
      ORDER BY frequency DESC
      \`,
      {
        query,
        start: timeRange.start.toISOString(),
        end: timeRange.end.toISOString()
      }
    )
    
    return result.records.map(record => ({
      entity: this.parseNode(record.get('e')),
      documents: record.get('documents').map(this.parseNode),
      frequency: record.get('frequency').toNumber(),
      related: record.get('related').map(this.parseNode)
    }))
  }, 'READ')
}

// 3. Graph summarization
export async function summarizeSubgraph(
  nodeIds: string[]
): Promise<{
  summary: string
  keyEntities: any[]
  mainTopics: string[]
}> {
  const subgraph = await withSession(async (session) => {
    const result = await session.run(
      \`
      MATCH (n)
      WHERE n.id IN $nodeIds
      OPTIONAL MATCH (n)-[r]-(m)
      WHERE m.id IN $nodeIds
      WITH collect(DISTINCT n) as nodes, 
           collect(DISTINCT {start: startNode(r).id, type: type(r), end: endNode(r).id}) as relationships
      RETURN nodes, relationships
      \`,
      { nodeIds }
    )
    
    return {
      nodes: result.records[0].get('nodes').map(this.parseNode),
      relationships: result.records[0].get('relationships')
    }
  }, 'READ')
  
  // Use PageRank to find key entities
  const keyEntities = await findKeyEntities(nodeIds)
  
  // Extract main topics using community detection
  const mainTopics = await detectCommunities(nodeIds)
  
  // Generate summary using LLM
  const summary = await generateGraphSummary(subgraph, keyEntities, mainTopics)
  
  return {
    summary,
    keyEntities,
    mainTopics
  }
}

// 4. Incremental graph updates
export async function updateKnowledgeGraph(
  newContent: string,
  documentId: string
): Promise<void> {
  return withTransaction(async (tx) => {
    // Extract new entities
    const newEntities = await extractEntities(newContent)
    const existingEntities = await getDocumentEntities(tx, documentId)
    
    // Find differences
    const entitiesToAdd = newEntities.filter(
      ne => !existingEntities.some(ee => ee.id === ne.id)
    )
    const entitiesToRemove = existingEntities.filter(
      ee => !newEntities.some(ne => ne.id === ee.id)
    )
    
    // Update relationships
    for (const entity of entitiesToAdd) {
      await tx.run(
        \`
        MATCH (d:Document {id: $documentId})
        MERGE (e:Entity {id: $entityId})
        SET e.name = $name, e.type = $type
        CREATE (d)-[:MENTIONS {frequency: $frequency}]->(e)
        \`,
        {
          documentId,
          entityId: entity.id,
          name: entity.name,
          type: entity.type,
          frequency: entity.frequency
        }
      )
    }
    
    for (const entity of entitiesToRemove) {
      await tx.run(
        \`
        MATCH (d:Document {id: $documentId})-[r:MENTIONS]->(e:Entity {id: $entityId})
        DELETE r
        \`,
        {
          documentId,
          entityId: entity.id
        }
      )
    }
    
    // Update document embedding
    const newEmbedding = await generateEmbedding(newContent)
    await tx.run(
      \`
      MATCH (d:Document {id: $documentId})
      SET d.content = $content, 
          d.embedding = $embedding,
          d.updatedAt = datetime()
      \`,
      {
        documentId,
        content: newContent,
        embedding: newEmbedding
      }
    )
  })
}

// 5. Graph-based recommendation
export async function recommendRelatedContent(
  userId: string,
  limit: number = 10
): Promise<any[]> {
  return withSession(async (session) => {
    const result = await session.run(
      \`
      // Find user's interaction history
      MATCH (u:User {id: $userId})-[:VIEWED|CREATED|LIKED]->(d:Document)
      WITH u, collect(d) as userDocs
      
      // Find entities from user's documents
      UNWIND userDocs as doc
      MATCH (doc)-[:MENTIONS]->(e:Entity)
      WITH u, userDocs, collect(DISTINCT e) as userEntities
      
      // Find similar documents through shared entities
      UNWIND userEntities as entity
      MATCH (entity)<-[:MENTIONS]-(rec:Document)
      WHERE NOT rec IN userDocs
      WITH rec, count(DISTINCT entity) as sharedEntities, userEntities
      
      // Calculate relevance score
      MATCH (rec)-[:MENTIONS]->(e:Entity)
      WITH rec, sharedEntities, 
           size([e IN collect(e) WHERE e IN userEntities]) * 1.0 / size(userEntities) as entityOverlap
      
      RETURN rec, sharedEntities, entityOverlap, 
             sharedEntities * entityOverlap as score
      ORDER BY score DESC
      LIMIT $limit
      \`,
      {
        userId,
        limit: neo4j.int(limit)
      }
    )
    
    return result.records.map(record => ({
      document: this.parseNode(record.get('rec')),
      sharedEntities: record.get('sharedEntities').toNumber(),
      entityOverlap: record.get('entityOverlap'),
      score: record.get('score')
    }))
  }, 'READ')
}`
      },

      // Performance Optimization
      'performance': {
        indexing: `// Neo4j Performance Optimization

// 1. Index strategies
const createPerformanceIndexes = async () => {
  const session = neo4jService.getSession()
  
  try {
    // Composite indexes for common queries
    await session.run(\`
      CREATE INDEX workflow_status_created IF NOT EXISTS
      FOR (w:Workflow) ON (w.status, w.createdAt)
    \`)
    
    await session.run(\`
      CREATE INDEX task_assigned_status IF NOT EXISTS
      FOR (t:Task) ON (t.assignedTo, t.status)
    \`)
    
    // Text indexes for search
    await session.run(\`
      CREATE TEXT INDEX entity_name_search IF NOT EXISTS
      FOR (e:Entity) ON (e.name)
    \`)
    
    // Point indexes for geospatial
    await session.run(\`
      CREATE POINT INDEX location_index IF NOT EXISTS
      FOR (l:Location) ON (l.coordinates)
    \`)
    
    // Lookup indexes for fast node access
    await session.run(\`
      CREATE LOOKUP INDEX node_labels IF NOT EXISTS
      FOR (n) ON EACH labels(n)
    \`)
    
    console.log('Performance indexes created')
  } finally {
    await session.close()
  }
}

// 2. Query optimization patterns
export class OptimizedQueries {
  // Use parameters for query plan caching
  static async findUserWorkflows(userId: string, status?: string) {
    return withSession(async (session) => {
      // Bad: String concatenation prevents query caching
      // const query = \`MATCH (u:User {id: '\${userId}'})\`
      
      // Good: Parameterized query
      const query = status
        ? \`
          MATCH (u:User {id: $userId})-[:CREATED]->(w:Workflow {status: $status})
          RETURN w
          ORDER BY w.createdAt DESC
          \`
        : \`
          MATCH (u:User {id: $userId})-[:CREATED]->(w:Workflow)
          RETURN w
          ORDER BY w.createdAt DESC
          \`
      
      const result = await session.run(query, { userId, status })
      return result.records.map(r => r.get('w').properties)
    }, 'READ')
  }
  
  // Profile queries for optimization
  static async profileQuery(query: string, params: any = {}) {
    const session = neo4jService.getSession()
    
    try {
      const result = await session.run(
        \`PROFILE \${query}\`,
        params
      )
      
      const profile = result.summary.profile
      console.log('Query Profile:', profile)
      
      // Analyze for issues
      const dbHits = result.summary.counters.updates()
      if (dbHits._stats.nodesCreated > 1000) {
        console.warn('Query creates many nodes, consider batching')
      }
      
      return result
    } finally {
      await session.close()
    }
  }
  
  // Batch operations for better performance
  static async batchCreateNodes(nodes: any[], label: string) {
    return withTransaction(async (tx) => {
      // Process in chunks to avoid memory issues
      const BATCH_SIZE = 1000
      const results = []
      
      for (let i = 0; i < nodes.length; i += BATCH_SIZE) {
        const batch = nodes.slice(i, i + BATCH_SIZE)
        
        const result = await tx.run(
          \`
          UNWIND $batch as node
          CREATE (n:\${label})
          SET n = node, n.id = randomUUID(), n.createdAt = datetime()
          RETURN n
          \`,
          { batch }
        )
        
        results.push(...result.records.map(r => r.get('n').properties))
      }
      
      return results
    })
  }
}

// 3. Memory management
export class MemoryOptimizedQueries {
  // Stream large result sets
  static async *streamLargeResults(query: string, params: any = {}) {
    const session = neo4jService.getSession()
    
    try {
      const result = session.run(query, params)
      
      for await (const record of result) {
        yield record
      }
    } finally {
      await session.close()
    }
  }
  
  // Pagination for large datasets
  static async paginateResults(
    query: string,
    params: any = {},
    page: number = 1,
    pageSize: number = 100
  ) {
    const skip = (page - 1) * pageSize
    
    const paginatedQuery = \`
      \${query}
      SKIP $skip
      LIMIT $limit
    \`
    
    return withSession(async (session) => {
      const result = await session.run(paginatedQuery, {
        ...params,
        skip: neo4j.int(skip),
        limit: neo4j.int(pageSize)
      })
      
      return result.records
    }, 'READ')
  }
}

// 4. Connection pool optimization
const optimizedDriver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(
    process.env.NEO4J_USERNAME!,
    process.env.NEO4J_PASSWORD!
  ),
  {
    // Connection pool settings
    maxConnectionPoolSize: 100,
    connectionAcquisitionTimeout: 60000,
    
    // Keep alive
    connectionLivenessCheckTimeout: 60000,
    
    // Routing settings for cluster
    resolver: (address) => {
      return process.env.NEO4J_CLUSTER_MEMBERS?.split(',') || [address]
    },
    
    // Retry logic
    maxTransactionRetryTime: 30000,
    
    // Logging
    logging: {
      level: 'warn',
      logger: console.log
    }
  }
)`,

        monitoring: `// Neo4j Monitoring and Diagnostics

// 1. Query monitoring
export async function monitorSlowQueries(thresholdMs: number = 1000) {
  return withSession(async (session) => {
    const result = await session.run(\`
      CALL dbms.listQueries() YIELD query, elapsedTimeMillis, username, database
      WHERE elapsedTimeMillis > $threshold
      RETURN query, elapsedTimeMillis, username, database
      ORDER BY elapsedTimeMillis DESC
    \`, { threshold: neo4j.int(thresholdMs) })
    
    return result.records.map(record => ({
      query: record.get('query'),
      elapsedTime: record.get('elapsedTimeMillis').toNumber(),
      username: record.get('username'),
      database: record.get('database')
    }))
  }, 'READ')
}

// 2. Database statistics
export async function getDatabaseStats() {
  return withSession(async (session) => {
    const stats: any = {}
    
    // Node count by label
    const nodeCount = await session.run(\`
      CALL db.labels() YIELD label
      CALL apoc.cypher.run('MATCH (n:' + label + ') RETURN count(n) as count', {}) YIELD value
      RETURN label, value.count as count
    \`)
    
    stats.nodeCounts = Object.fromEntries(
      nodeCount.records.map(r => [
        r.get('label'),
        r.get('count').toNumber()
      ])
    )
    
    // Relationship count by type
    const relCount = await session.run(\`
      CALL db.relationshipTypes() YIELD relationshipType
      CALL apoc.cypher.run('MATCH ()-[r:' + relationshipType + ']->() RETURN count(r) as count', {}) YIELD value
      RETURN relationshipType, value.count as count
    \`)
    
    stats.relationshipCounts = Object.fromEntries(
      relCount.records.map(r => [
        r.get('relationshipType'),
        r.get('count').toNumber()
      ])
    )
    
    // Database size
    const size = await session.run(\`
      CALL apoc.meta.stats() YIELD nodeCount, relCount, labelCount, relTypeCount
      RETURN nodeCount, relCount, labelCount, relTypeCount
    \`)
    
    const sizeRecord = size.records[0]
    stats.totals = {
      nodes: sizeRecord.get('nodeCount').toNumber(),
      relationships: sizeRecord.get('relCount').toNumber(),
      labels: sizeRecord.get('labelCount').toNumber(),
      relationshipTypes: sizeRecord.get('relTypeCount').toNumber()
    }
    
    return stats
  }, 'READ')
}

// 3. Performance metrics
export class Neo4jMetrics {
  private metrics: Map<string, any[]> = new Map()
  
  async recordQueryMetric(
    queryName: string,
    duration: number,
    resultCount: number
  ) {
    if (!this.metrics.has(queryName)) {
      this.metrics.set(queryName, [])
    }
    
    this.metrics.get(queryName)!.push({
      timestamp: new Date(),
      duration,
      resultCount
    })
    
    // Keep only last 1000 metrics per query
    const queryMetrics = this.metrics.get(queryName)!
    if (queryMetrics.length > 1000) {
      queryMetrics.shift()
    }
  }
  
  getQueryStats(queryName: string) {
    const queryMetrics = this.metrics.get(queryName) || []
    
    if (queryMetrics.length === 0) {
      return null
    }
    
    const durations = queryMetrics.map(m => m.duration)
    const sum = durations.reduce((a, b) => a + b, 0)
    const avg = sum / durations.length
    const sorted = [...durations].sort((a, b) => a - b)
    const p95 = sorted[Math.floor(sorted.length * 0.95)]
    const p99 = sorted[Math.floor(sorted.length * 0.99)]
    
    return {
      count: queryMetrics.length,
      avgDuration: avg,
      p95Duration: p95,
      p99Duration: p99,
      minDuration: Math.min(...durations),
      maxDuration: Math.max(...durations)
    }
  }
}`
      },

      // Common Issues
      'commonIssues': {
        connectionErrors: `// Neo4j Connection Issues and Solutions

// 1. Connection refused
// Error: Failed to connect to localhost:7687
try {
  const driver = neo4j.driver(uri, auth)
  await driver.verifyConnectivity()
} catch (error) {
  console.error('Connection failed:', error)
  
  // Check if Neo4j is running
  // docker ps | grep neo4j
  // systemctl status neo4j
  
  // Check if port is accessible
  // telnet localhost 7687
  
  // Check firewall rules
  // sudo ufw status
}

// 2. Authentication failed
// Error: The client is unauthorized due to authentication failure
// Solution: Verify credentials
const auth = neo4j.auth.basic(
  process.env.NEO4J_USERNAME || 'neo4j',
  process.env.NEO4J_PASSWORD || 'neo4j'
)

// Reset password if needed
// neo4j-admin set-initial-password newpassword

// 3. SSL/TLS issues
// For Neo4j Aura or secured instances
const driver = neo4j.driver(
  'neo4j+s://xxxx.databases.neo4j.io',
  auth,
  {
    encrypted: true,
    trust: 'TRUST_SYSTEM_CA_SIGNED_CERTIFICATES',
    trustedCertificates: ['/path/to/cert.pem']
  }
)

// 4. Connection pool exhausted
// Error: Connection acquisition timed out
const driver = neo4j.driver(uri, auth, {
  maxConnectionPoolSize: 100, // Increase pool size
  connectionAcquisitionTimeout: 60000, // Increase timeout
  connectionTimeout: 30000
})

// Monitor pool usage
driver.getServerInfo().then(info => {
  console.log('Server info:', info)
})`,

        cypherErrors: `// Common Cypher Query Errors

// 1. Variable not defined
// Error: Variable \`user\` not defined
// ❌ Wrong
MATCH (u:User {id: $userId})
RETURN user // Should be 'u'

// ✅ Correct
MATCH (u:User {id: $userId})
RETURN u

// 2. Type mismatch
// Error: Type mismatch: expected Float but was String
// ❌ Wrong
MATCH (n:Node {score: '10.5'}) // String instead of number

// ✅ Correct
MATCH (n:Node {score: 10.5})
// Or convert
MATCH (n:Node {score: toFloat('10.5')})

// 3. Null property access
// Error: Cannot access property on null
// ❌ Wrong
MATCH (u:User)
RETURN u.profile.name // profile might be null

// ✅ Correct
MATCH (u:User)
RETURN COALESCE(u.profile.name, 'Unknown')

// 4. Cartesian product warning
// Warning: This query builds a cartesian product
// ❌ Wrong - creates cartesian product
MATCH (a:User), (b:User)
WHERE a.age > 30 AND b.age > 30

// ✅ Correct - use relationship or separate queries
MATCH (a:User)-[:KNOWS]-(b:User)
WHERE a.age > 30 AND b.age > 30

// 5. Parameter not provided
// Error: Expected parameter: userId
const params = {
  userId: userId || throw new Error('userId is required')
}`,

        performanceIssues: `// Neo4j Performance Issues

// 1. Slow queries without indexes
// ❌ Slow without index
MATCH (u:User {email: $email})
RETURN u

// ✅ Create index first
CREATE INDEX user_email IF NOT EXISTS FOR (u:User) ON (u.email)

// 2. Missing node labels in queries
// ❌ Slow - scans all nodes
MATCH (n {type: 'User'})

// ✅ Fast - uses label index
MATCH (n:User)

// 3. Unbounded path queries
// ❌ Can be very slow
MATCH path = (a)-[*]-(b)

// ✅ Limit path length
MATCH path = (a)-[*1..5]-(b)

// 4. Large transaction issues
// ❌ Memory intensive
MATCH (n:LargeSet)
SET n.processed = true

// ✅ Process in batches
CALL apoc.periodic.iterate(
  "MATCH (n:LargeSet) WHERE n.processed IS NULL RETURN n",
  "SET n.processed = true",
  {batchSize: 10000, parallel: true}
)

// 5. Inefficient pattern matching
// ❌ Multiple MATCH clauses
MATCH (u:User {id: $userId})
MATCH (u)-[:OWNS]->(a:Asset)
MATCH (a)-[:LOCATED_IN]->(l:Location)

// ✅ Single pattern
MATCH (u:User {id: $userId})-[:OWNS]->(a:Asset)-[:LOCATED_IN]->(l:Location)`,

        dataIntegrityIssues: `// Data Integrity Issues in Neo4j

// 1. Duplicate nodes
// Check for duplicates
MATCH (n:User)
WITH n.email as email, collect(n) as nodes, count(*) as count
WHERE count > 1
RETURN email, count, nodes

// Remove duplicates (keep first)
MATCH (n:User)
WITH n.email as email, collect(n) as nodes
WHERE size(nodes) > 1
FOREACH (n in tail(nodes) | DETACH DELETE n)

// 2. Orphaned nodes
// Find nodes without relationships
MATCH (n)
WHERE NOT (n)--()
RETURN labels(n), count(n)

// Clean up orphaned nodes (careful!)
MATCH (n:TempNode)
WHERE NOT (n)--()
DELETE n

// 3. Constraint violations
// Add constraint safely
CREATE CONSTRAINT user_email_unique IF NOT EXISTS
FOR (u:User) REQUIRE u.email IS UNIQUE

// Handle existing duplicates first
MATCH (u:User)
WITH u.email as email, collect(u) as users
WHERE size(users) > 1
UNWIND range(1, size(users)-1) as idx
SET (users[idx]).email = (users[idx]).email + '_duplicate_' + idx

// 4. Data consistency checks
// Verify bidirectional relationships
MATCH (a)-[r:FRIENDS_WITH]->(b)
WHERE NOT (b)-[:FRIENDS_WITH]->(a)
CREATE (b)-[:FRIENDS_WITH]->(a)

// 5. Schema validation
// Use APOC for property validation
CALL apoc.trigger.add(
  'validate-user-email',
  'UNWIND $createdNodes AS n
   WITH n WHERE n:User AND NOT n.email =~ "^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
   CALL apoc.util.validate(true, "Invalid email format", [0])
   RETURN null',
  {phase: 'before'}
)`
      }
    };
    
    return {
      issue: issue || error,
      solution: solutions[issue] || solutions.commonIssues,
      neo4jVersion: {
        current: '5.x',
        features: [
          'Vector indexes for similarity search',
          'Graph Data Science library',
          'Composite databases',
          'Improved query performance',
          'Enhanced security features'
        ]
      },
      graphRAGCapabilities: [
        'Hybrid vector + graph search',
        'Multi-hop reasoning',
        'Entity extraction and linking',
        'Knowledge graph construction',
        'Contextual embeddings',
        'Graph-augmented generation'
      ],
      bestPractices: [
        'Always use parameters in queries to prevent injection',
        'Create appropriate indexes for query patterns',
        'Use labels in all node patterns',
        'Limit path query depths',
        'Process large datasets in batches',
        'Profile queries before production deployment',
        'Implement proper connection pooling',
        'Monitor query performance and database statistics'
      ],
      resources: [
        'Neo4j Documentation: https://neo4j.com/docs/',
        'Cypher Manual: https://neo4j.com/docs/cypher-manual/current/',
        'Graph Data Science: https://neo4j.com/docs/graph-data-science/current/',
        'APOC Library: https://neo4j.com/labs/apoc/',
        'GraphRAG: https://neo4j.com/developer/graph-rag/'
      ]
    };
  }
};

module.exports = hook;