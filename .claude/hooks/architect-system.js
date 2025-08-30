#!/usr/bin/env node
/**
 * /architect-system - Design system architecture with technology constraints
 * 
 * Creates comprehensive architectural designs considering the N8N MAS stack
 * and best practices for distributed multi-agent systems.
 */

const hook = {
  name: 'architect-system',
  description: 'Design system architecture with N8N MAS technology constraints',
  trigger: '/architect-system',
  
  async execute(context) {
    const { componentName, requirements, integrationType } = context.args;
    
    return {
      template: `
# System Architecture: ${componentName}

## Architectural Overview

### System Context (C4 Level 1)
\`\`\`mermaid
graph TB
    User[User/Client]
    Web[Next.js Web App]
    API[Express API Server]
    MAS[Multi-Agent System]
    N8N[N8N Workflow Engine]
    DB[(PostgreSQL + Redis)]
    
    User --> Web
    Web --> API
    API --> MAS
    API --> N8N
    API --> DB
    MAS --> N8N
\`\`\`

### Container Diagram (C4 Level 2)
\`\`\`mermaid
graph LR
    subgraph "Frontend Container"
        NextJS[Next.js 15.4<br/>App Router]
        CopilotKit[CopilotKit<br/>Conversational UI]
        TailwindV4[Tailwind CSS v4]
        ShadcnUI[shadcn/ui v2.10]
    end
    
    subgraph "API Container"
        Express[Express.js<br/>REST/WebSocket]
        Prisma[Prisma ORM v6.13]
        Auth[JWT Auth]
        MCP[MCP Protocol]
    end
    
    subgraph "Agent Container"
        Neo[Neo Orchestrator]
        Oracle[Oracle Analyzer]
        Specialists[Specialist Agents]
        AgentBus[Agent Event Bus]
    end
    
    subgraph "Data Layer"
        Postgres[(PostgreSQL 15)]
        Redis[(Redis 7)]
        Neo4j[(Neo4j Graph)]
        Supabase[Supabase<br/>pgvector]
    end
\`\`\`

## Component Architecture

### Frontend Architecture (Next.js 15.4)
\`\`\`typescript
// App Router Structure
app/
├── (auth)/
│   ├── login/
│   └── register/
├── (dashboard)/
│   ├── layout.tsx         // Server Component
│   ├── page.tsx          // Server Component
│   └── @modal/           // Parallel Route
├── api/                  // API Routes
└── components/
    ├── server/          // Server Components
    └── client/          // Client Components

// Component Pattern
export default async function ServerComponent() {
  const data = await fetchData(); // Direct data fetching
  return <ClientComponent initialData={data} />;
}
\`\`\`

### Backend Architecture (Express + Prisma)
\`\`\`typescript
// Clean Architecture Layers
src/
├── domain/              // Business entities
│   ├── entities/
│   └── value-objects/
├── application/         // Use cases
│   ├── services/
│   └── dto/
├── infrastructure/      // External interfaces
│   ├── database/       // Prisma repositories
│   ├── messaging/      // WebSocket/MCP
│   └── external/       // Third-party APIs
└── presentation/        // API layer
    ├── rest/           // REST endpoints
    ├── websocket/      // Real-time events
    └── graphql/        // GraphQL resolvers

// Repository Pattern with Prisma
class UserRepository {
  constructor(private prisma: PrismaClient) {}
  
  async findById(id: string): Promise<User | null> {
    const data = await this.prisma.user.findUnique({
      where: { id },
      include: { profile: true }
    });
    return data ? UserMapper.toDomain(data) : null;
  }
}
\`\`\`

### Multi-Agent Architecture
\`\`\`typescript
// Agent Communication Pattern
interface AgentMessage {
  id: string;
  from: AgentId;
  to: AgentId | 'broadcast';
  type: MessageType;
  payload: unknown;
  timestamp: Date;
  correlationId?: string;
}

// BDI Architecture Implementation
class Agent {
  private beliefs: BeliefSet;
  private desires: GoalSet;
  private intentions: PlanLibrary;
  
  async deliberate(): Promise<Goal> {
    // Select goal based on beliefs
  }
  
  async plan(goal: Goal): Promise<Plan> {
    // Generate plan to achieve goal
  }
  
  async execute(plan: Plan): Promise<void> {
    // Execute plan actions
  }
}
\`\`\`

## Data Architecture

### PostgreSQL Schema Design
\`\`\`sql
-- Multi-tenancy with Row Level Security
CREATE POLICY tenant_isolation ON all_tables
  USING (tenant_id = current_setting('app.tenant_id'));

-- Audit trail with temporal tables
CREATE TABLE users (
  id UUID PRIMARY KEY,
  -- ... fields ...
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_to TIMESTAMPTZ
);

-- Partitioning for performance
CREATE TABLE events (
  id UUID,
  created_at TIMESTAMPTZ,
  -- ... fields ...
) PARTITION BY RANGE (created_at);
\`\`\`

### Vector Database (Supabase pgvector)
\`\`\`sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Embedding storage
CREATE TABLE embeddings (
  id UUID PRIMARY KEY,
  content TEXT,
  embedding vector(1536),
  metadata JSONB
);

-- Similarity search index
CREATE INDEX ON embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
\`\`\`

### Graph Database (Neo4j)
\`\`\`cypher
// Knowledge graph structure
CREATE (a:Agent {id: $agentId, type: 'specialist'})
CREATE (t:Task {id: $taskId, status: 'pending'})
CREATE (a)-[:ASSIGNED_TO]->(t)
CREATE (t)-[:DEPENDS_ON]->(t2:Task)
\`\`\`

## Integration Patterns

### Event-Driven Architecture
\`\`\`typescript
// Event Bus Implementation
class EventBus {
  private handlers = new Map<string, Handler[]>();
  
  emit(event: DomainEvent): void {
    // Async event processing
    this.processAsync(event);
    
    // Sync handlers for critical paths
    this.processSync(event);
  }
}

// Saga Pattern for distributed transactions
class WorkflowSaga {
  async execute(command: CreateWorkflow): Promise<void> {
    const tx = await this.begin();
    try {
      await this.createWorkflow(command);
      await this.notifyAgents(command);
      await this.scheduleExecution(command);
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      await this.compensate(command);
    }
  }
}
\`\`\`

### API Gateway Pattern
\`\`\`typescript
// Rate limiting and caching
app.use('/api', 
  rateLimiter({ windowMs: 15 * 60 * 1000, max: 100 }),
  cacheMiddleware({ ttl: 300 }),
  apiRouter
);

// Circuit breaker for external services
const breaker = new CircuitBreaker(externalService, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});
\`\`\`

## Security Architecture

### Zero Trust Security Model
\`\`\`typescript
// JWT with refresh token rotation
const accessToken = jwt.sign(
  { sub: user.id, permissions: user.permissions },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

// Request signing for agent communication
const signature = crypto
  .createHmac('sha256', agent.secretKey)
  .update(JSON.stringify(message))
  .digest('hex');
\`\`\`

### Data Protection
- Encryption at rest: AES-256-GCM
- Encryption in transit: TLS 1.3
- Key management: AWS KMS / HashiCorp Vault
- Secrets rotation: 90-day policy

## Performance Architecture

### Caching Strategy
1. **Browser Cache:** Next.js static optimization
2. **CDN Cache:** Vercel Edge Network
3. **Application Cache:** Redis with cache-aside pattern
4. **Database Cache:** PostgreSQL query result cache

### Scaling Strategy
- **Horizontal Scaling:** Kubernetes HPA
- **Database Scaling:** Read replicas + connection pooling
- **Agent Scaling:** Distributed agent pools
- **Message Queue:** Redis Streams for backpressure

## Monitoring & Observability

### Three Pillars of Observability
\`\`\`typescript
// Structured logging
logger.info('workflow.created', {
  workflowId: workflow.id,
  userId: user.id,
  duration: executionTime,
  metadata: { source: 'api', version: '1.0' }
});

// Distributed tracing
const span = tracer.startSpan('agent.execute', {
  attributes: {
    'agent.id': agent.id,
    'task.type': task.type
  }
});

// Metrics collection
metrics.increment('api.requests', {
  endpoint: req.path,
  method: req.method,
  status: res.statusCode
});
\`\`\`

## Deployment Architecture

### Container Strategy
\`\`\`dockerfile
# Multi-stage build for Next.js
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
\`\`\`

### Kubernetes Deployment
\`\`\`yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: n8n-mas-api
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  template:
    spec:
      containers:
      - name: api
        image: n8n-mas/api:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
\`\`\`

## Architecture Decision Records (ADRs)

### ADR-001: Next.js 15.4 App Router
- **Status:** Accepted
- **Context:** Need for better performance and SEO
- **Decision:** Use App Router with Server Components
- **Consequences:** Better performance, more complex mental model

### ADR-002: Prisma ORM v6.13
- **Status:** Accepted  
- **Context:** Need type-safe database access
- **Decision:** Use Prisma with PostgreSQL
- **Consequences:** Type safety, migration management, some query limitations

### ADR-003: Multi-Agent BDI Architecture
- **Status:** Accepted
- **Context:** Complex autonomous agent behaviors needed
- **Decision:** Implement BDI cognitive architecture
- **Consequences:** Sophisticated agent reasoning, increased complexity
`,
      bestPractices: [
        'Use Server Components by default, Client Components when needed',
        'Implement proper error boundaries and suspense boundaries',
        'Follow single responsibility principle for agents',
        'Use event sourcing for audit trails',
        'Implement circuit breakers for external services',
        'Cache aggressively but invalidate properly',
        'Monitor everything, alert on what matters'
      ]
    };
  }
};

module.exports = hook;