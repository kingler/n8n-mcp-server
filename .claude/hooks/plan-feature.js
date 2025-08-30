#!/usr/bin/env node
/**
 * /plan-feature - Generate technical specifications for new features
 * 
 * This hook helps plan new features considering the N8N MAS technology stack
 * and architectural patterns.
 */

const hook = {
  name: 'plan-feature',
  description: 'Generate comprehensive technical specifications for new features',
  trigger: '/plan-feature',
  
  async execute(context) {
    const { featureName, description, scope } = context.args;
    
    return {
      template: `
# Feature Specification: ${featureName}

## Overview
${description}

## Technical Requirements

### Frontend (Next.js 15.4 + CopilotKit)
- **Components Required:**
  - Server Components for static content
  - Client Components for interactive features
  - CopilotKit integration for conversational UI
  
- **State Management:**
  - Zustand for client-side state
  - Server state via React Server Components
  - Real-time updates via WebSocket

- **UI/UX Considerations:**
  - Tailwind CSS v4 utility classes
  - shadcn/ui v2.10.0 components
  - Responsive design patterns
  - Accessibility (WCAG 2.1 AA)

### Backend (Express + Prisma)
- **API Endpoints:**
  - RESTful endpoints following OpenAPI 3.0
  - WebSocket events for real-time features
  - GraphQL for complex queries (if needed)

- **Database Schema (Prisma v6.13.0):**
  \`\`\`prisma
  model FeatureEntity {
    id            String   @id @default(cuid())
    createdAt     DateTime @default(now())
    updatedAt     DateTime @updatedAt
    deletedAt     DateTime?
    
    // Add feature-specific fields
    
    @@index([createdAt])
    @@map("feature_entities")
  }
  \`\`\`

- **Business Logic:**
  - Service layer pattern
  - Repository pattern for data access
  - Event-driven architecture

### Agent Integration
- **Required Agents:**
  - Neo (orchestration)
  - Oracle (analysis)
  - Relevant specialist agents

- **MCP Protocol Messages:**
  \`\`\`typescript
  interface FeatureRequest {
    type: 'feature.request';
    payload: {
      action: string;
      data: unknown;
    };
  }
  \`\`\`

### N8N Workflow Integration
- **Workflow Templates:**
  - Trigger nodes for feature events
  - Processing nodes for business logic
  - Integration nodes for external services

### Security Considerations
- **Authentication:** JWT with refresh tokens
- **Authorization:** RBAC with Prisma middleware
- **Data Protection:** Encryption at rest and in transit
- **Compliance:** GDPR data handling

### Testing Strategy
- **Unit Tests:** Vitest for all business logic
- **Integration Tests:** API endpoint testing
- **E2E Tests:** Playwright for critical paths
- **Performance Tests:** Load testing with k6

### Performance Requirements
- **Response Time:** < 200ms for API calls
- **Throughput:** Handle 1000 concurrent users
- **Caching:** Redis for frequently accessed data

### Deployment Considerations
- **Docker:** Multi-stage builds
- **Kubernetes:** Horizontal scaling
- **Monitoring:** Prometheus + Grafana
- **Logging:** ELK stack integration

## Implementation Plan

### Phase 1: Foundation (Week 1)
1. Database schema design and migration
2. Basic API endpoints
3. Initial UI components

### Phase 2: Core Features (Week 2-3)
1. Business logic implementation
2. Agent integration
3. N8N workflow creation

### Phase 3: Polish & Testing (Week 4)
1. Comprehensive testing
2. Performance optimization
3. Security audit
4. Documentation

## Risks & Mitigations
- **Risk:** Complex agent coordination
  - **Mitigation:** Incremental integration with fallback mechanisms
  
- **Risk:** Performance at scale
  - **Mitigation:** Implement caching and optimize queries early

## Success Metrics
- User adoption rate
- Performance benchmarks met
- Zero critical security issues
- 90%+ test coverage
`,
      additionalContext: {
        workspaceStructure: {
          frontend: 'apps/web/src',
          backend: 'apps/api/src',
          shared: 'packages/*',
          tests: '__tests__'
        },
        conventions: {
          naming: 'camelCase for functions, PascalCase for components',
          fileStructure: 'feature-based organization',
          imports: 'absolute imports with @ alias'
        }
      }
    };
  }
};

module.exports = hook;