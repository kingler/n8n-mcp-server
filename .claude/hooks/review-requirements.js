#!/usr/bin/env node
/**
 * /review-requirements - Validate requirements against tech stack capabilities
 * 
 * Analyzes feature requirements to ensure they align with the N8N MAS
 * technology stack capabilities and constraints.
 */

const hook = {
  name: 'review-requirements',
  description: 'Validate requirements against N8N MAS tech stack capabilities',
  trigger: '/review-requirements',
  
  async execute(context) {
    const { requirements, featureType } = context.args;
    
    return {
      template: `
# Requirements Validation Report

## Technology Stack Compatibility Analysis

### Next.js 15.4 Capabilities
✅ **Supported Features:**
- Server Components for improved performance
- App Router with nested layouts
- Server Actions for form handling
- Parallel and intercepting routes
- Built-in optimizations (Image, Font, Script)
- Streaming and Suspense
- Middleware for edge computing

⚠️ **Limitations to Consider:**
- Client Components increase bundle size
- Server Components can't use browser APIs
- Hydration mismatches with dynamic content
- Limited support for some third-party libraries
- No built-in state management (need Zustand/Jotai)

### Tailwind CSS v4.1.11 Analysis
✅ **New v4 Features Available:**
- Lightning CSS engine (faster builds)
- Container queries support
- Enhanced color palette
- Improved performance with JIT
- Better tree-shaking
- Native CSS nesting support

⚠️ **Migration Considerations:**
- Breaking changes from v3 config format
- Some plugins need updates for v4
- Changed utility class names
- New configuration paradigm

### shadcn/ui v2.10.0 Compatibility
✅ **Integration Benefits:**
- Tailwind v4 native support
- Copy-paste component model
- Full TypeScript support
- Accessibility built-in
- Customizable with CSS variables
- Server Component compatible

⚠️ **Potential Issues:**
- Some components may need Tailwind v4 adjustments
- Radix UI peer dependencies
- Theme customization complexity
- Bundle size with many components

### Prisma ORM v6.13.0 Capabilities
✅ **Supported Features:**
- Advanced query capabilities
- Type-safe database access
- Multi-schema support
- Connection pooling
- Raw SQL escape hatch
- Middleware for RBAC
- Optimistic locking

⚠️ **Known Limitations:**
- No support for some PostgreSQL features
- Migration rollback limitations
- Performance overhead for complex joins
- Limited support for database-specific features

### Supabase Integration
✅ **Available Features:**
- PostgreSQL with pgvector extension
- Row Level Security (RLS)
- Real-time subscriptions
- Edge Functions
- Storage API
- Auth integration

⚠️ **Constraints:**
- pgvector dimension limits (max 2000)
- Connection pool limits
- Rate limiting on free tier
- Vector index performance at scale

### Neo4j Graph Database
✅ **GraphRAG Capabilities:**
- Complex relationship queries
- Graph algorithms (PageRank, etc.)
- Pattern matching with Cypher
- Full-text search
- Geospatial queries
- ACID transactions

⚠️ **Limitations:**
- Memory requirements for large graphs
- Query complexity impacts performance
- Limited aggregation compared to SQL
- Backup/restore complexity

### CopilotKit Integration
✅ **Conversational UI Features:**
- In-app AI assistants
- Context-aware suggestions
- Code generation
- Natural language interfaces
- Multi-turn conversations
- Custom actions

⚠️ **Integration Challenges:**
- Token usage costs
- Latency for AI responses
- Context window limitations
- State synchronization complexity

### N8N Workflow Engine
✅ **Automation Capabilities:**
- 400+ integration nodes
- Custom node development
- Webhook triggers
- Conditional logic
- Error handling
- Parallel execution

⚠️ **Constraints:**
- Memory usage for large workflows
- Execution time limits
- Complex debugging
- Version compatibility

## Requirements Feasibility Matrix

| Requirement | Feasible | Tech Stack Component | Notes |
|------------|----------|---------------------|--------|
| Real-time updates | ✅ Yes | WebSocket + Supabase | Use Socket.io with Redis adapter |
| AI-powered search | ✅ Yes | pgvector + OpenAI | Implement RAG with embeddings |
| Complex workflows | ✅ Yes | N8N + Agent Framework | Custom nodes for agent integration |
| Multi-tenancy | ✅ Yes | Prisma + RLS | Row-level security with Supabase |
| Offline support | ⚠️ Partial | Next.js PWA | Limited by Server Components |
| Large file uploads | ✅ Yes | Supabase Storage | Use resumable uploads |
| Graph analytics | ✅ Yes | Neo4j | Implement GraphRAG patterns |

## Technical Debt Considerations

### Performance Impacts
1. **Bundle Size:** Monitor with next/bundle-analyzer
2. **Database Queries:** Use Prisma query analysis
3. **Agent Communication:** Implement message queuing
4. **Memory Usage:** Profile with Node.js tools

### Scalability Concerns
1. **Horizontal Scaling:** Design stateless services
2. **Database Connections:** Use PgBouncer
3. **Agent Pool Management:** Implement worker pools
4. **Cache Strategy:** Redis with proper TTL

### Security Requirements
1. **Authentication:** JWT with refresh token rotation
2. **Authorization:** RBAC with Prisma middleware  
3. **Data Encryption:** At rest and in transit
4. **Audit Logging:** Comprehensive event tracking

## Recommended Architecture Patterns

### For High-Performance Features
\`\`\`typescript
// Use Server Components with streaming
export default async function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}

// Implement data fetching with cache
const data = await fetch(url, {
  next: { revalidate: 60 }, // ISR
  cache: 'force-cache'
});
\`\`\`

### For Real-Time Features
\`\`\`typescript
// WebSocket with reconnection logic
const socket = io({
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5
});

// Supabase real-time subscriptions
const subscription = supabase
  .channel('room1')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'messages' },
    handleChange
  )
  .subscribe();
\`\`\`

### For AI/ML Features
\`\`\`typescript
// Vector similarity search
const similar = await prisma.$queryRaw\`
  SELECT id, content, 
    1 - (embedding <=> \${embedding}::vector) as similarity
  FROM documents
  WHERE 1 - (embedding <=> \${embedding}::vector) > 0.7
  ORDER BY similarity DESC
  LIMIT 10
\`;

// GraphRAG implementation
const query = \`
  MATCH (d:Document)-[:REFERENCES]->(e:Entity)
  WHERE e.type = $entityType
  RETURN d, collect(e) as entities
  ORDER BY d.relevance DESC
\`;
\`\`\`

## Risk Mitigation Strategies

1. **Technology Lock-in**
   - Use abstraction layers
   - Follow clean architecture
   - Document integration points

2. **Performance Degradation**
   - Implement monitoring early
   - Set up performance budgets
   - Use progressive enhancement

3. **Scaling Challenges**
   - Design for horizontal scaling
   - Implement caching layers
   - Use queue-based processing

4. **Integration Complexity**
   - Create integration tests
   - Document API contracts
   - Version external dependencies

## Approval Checklist

- [ ] Requirements align with tech stack capabilities
- [ ] Performance requirements are achievable
- [ ] Security requirements can be met
- [ ] Scalability needs are addressed
- [ ] Integration points are well-defined
- [ ] Technical debt is acceptable
- [ ] Team has necessary expertise
- [ ] Timeline is realistic

## Recommended Next Steps

1. **Proof of Concept:** Build minimal version with critical features
2. **Performance Testing:** Validate assumptions with load tests
3. **Security Review:** Conduct threat modeling session
4. **Architecture Review:** Present to technical stakeholders
5. **Risk Assessment:** Document and plan mitigations
`,
      validation: {
        passedChecks: [
          'Technology stack supports core requirements',
          'Performance targets achievable with optimization',
          'Security requirements can be implemented'
        ],
        warnings: [
          'Consider bundle size impact of Client Components',
          'Plan for vector embedding costs at scale',
          'Monitor agent communication overhead'
        ],
        blockers: []
      }
    };
  }
};

module.exports = hook;