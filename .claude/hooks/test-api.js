#!/usr/bin/env node
/**
 * /test-api - Create API endpoint tests with proper mocking
 * 
 * Generates comprehensive test suites for Next.js 15.4 API routes,
 * Express endpoints, and GraphQL resolvers with appropriate mocking strategies.
 */

const hook = {
  name: 'test-api',
  description: 'Generate API endpoint tests with mocking for N8N MAS',
  trigger: '/test-api',
  
  async execute(context) {
    const { endpointPath, method, apiType } = context.args;
    
    return {
      template: `
# API Test Suite: ${endpointPath}

## Next.js 15.4 Route Handler Tests

\`\`\`typescript
// app/api/${endpointPath}/route.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { NextRequest } from 'next/server'
import * as Route from './route'
import { prisma } from '@/lib/prisma'
import { createMocks } from 'node-mocks-http'

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    $transaction: vi.fn((fn) => fn(prisma)),
  },
}))

// Mock Supabase
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ 
        data: { user: { id: 'test-user-id', email: 'test@example.com' } } 
      }),
    },
  }),
}))

describe('${method} ${endpointPath}', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })
  
  describe('${method} handler', () => {
    it('should return 200 with valid data', async () => {
      // Mock data
      const mockData = {
        id: '123',
        name: 'Test Item',
        createdAt: new Date(),
      }
      
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockData)
      
      // Create request
      const request = new NextRequest('http://localhost:3000/api/${endpointPath}', {
        method: '${method}',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-token',
        },
        ...(${method === 'POST' || method === 'PUT' || method === 'PATCH'} && {
          body: JSON.stringify({
            name: 'Test Item',
          }),
        }),
      })
      
      // Call handler
      const response = await Route.${method}(request)
      const data = await response.json()
      
      // Assertions
      expect(response.status).toBe(200)
      expect(data).toEqual({
        id: '123',
        name: 'Test Item',
        createdAt: mockData.createdAt.toISOString(),
      })
    })
    
    it('should handle validation errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/${endpointPath}', {
        method: '${method}',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Invalid data
          name: '', // Required field is empty
        }),
      })
      
      const response = await Route.${method}(request)
      const data = await response.json()
      
      expect(response.status).toBe(400)
      expect(data).toEqual({
        error: 'Validation failed',
        errors: {
          name: ['Name is required'],
        },
      })
    })
    
    it('should handle authentication errors', async () => {
      vi.mocked(createRouteHandlerClient).mockReturnValue({
        auth: {
          getUser: vi.fn().mockResolvedValue({ 
            data: { user: null }, 
            error: { message: 'Invalid token' } 
          }),
        },
      })
      
      const request = new NextRequest('http://localhost:3000/api/${endpointPath}', {
        method: '${method}',
      })
      
      const response = await Route.${method}(request)
      const data = await response.json()
      
      expect(response.status).toBe(401)
      expect(data).toEqual({
        error: 'Unauthorized',
      })
    })
    
    it('should handle database errors', async () => {
      vi.mocked(prisma.user.findUnique).mockRejectedValue(
        new Error('Database connection failed')
      )
      
      const request = new NextRequest('http://localhost:3000/api/${endpointPath}', {
        method: '${method}',
        headers: {
          'Authorization': 'Bearer mock-token',
        },
      })
      
      const response = await Route.${method}(request)
      const data = await response.json()
      
      expect(response.status).toBe(500)
      expect(data).toEqual({
        error: 'Internal server error',
      })
    })
    
    it('should handle rate limiting', async () => {
      // Mock rate limiter
      const mockRateLimiter = vi.fn().mockResolvedValue({ 
        success: false, 
        limit: 100, 
        remaining: 0 
      })
      
      const request = new NextRequest('http://localhost:3000/api/${endpointPath}', {
        method: '${method}',
        headers: {
          'X-Forwarded-For': '192.168.1.1',
        },
      })
      
      const response = await Route.${method}(request)
      
      expect(response.status).toBe(429)
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
    })
  })
})
\`\`\`

## Express API Tests

\`\`\`typescript
// apps/api/src/routes/${endpointPath}.test.ts

import request from 'supertest'
import express from 'express'
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { createServer } from '@/server'
import { prisma } from '@/lib/prisma'
import { redis } from '@/lib/redis'

// Mock dependencies
vi.mock('@/lib/prisma')
vi.mock('@/lib/redis')
vi.mock('@/services/auth', () => ({
  authenticate: vi.fn((req, res, next) => {
    req.user = { id: 'test-user-id', email: 'test@example.com' }
    next()
  }),
}))

describe('Express API: ${endpointPath}', () => {
  let app: express.Application
  let server: any
  
  beforeAll(async () => {
    app = await createServer()
    server = app.listen(0) // Random port
  })
  
  afterAll(async () => {
    await server.close()
  })
  
  describe('${method} ${endpointPath}', () => {
    it('should return successful response', async () => {
      const mockData = [
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ]
      
      vi.mocked(prisma.item.findMany).mockResolvedValue(mockData)
      
      const response = await request(app)
        .${method.toLowerCase()}('${endpointPath}')
        .set('Authorization', 'Bearer mock-token')
        .expect(200)
      
      expect(response.body).toEqual({
        data: mockData,
        meta: {
          total: 2,
        },
      })
    })
    
    it('should handle query parameters', async () => {
      const response = await request(app)
        .get('${endpointPath}')
        .query({ page: 2, limit: 10, sort: 'name' })
        .set('Authorization', 'Bearer mock-token')
        .expect(200)
      
      expect(vi.mocked(prisma.item.findMany)).toHaveBeenCalledWith({
        skip: 10,
        take: 10,
        orderBy: { name: 'asc' },
      })
    })
    
    it('should validate request body', async () => {
      const response = await request(app)
        .post('${endpointPath}')
        .set('Authorization', 'Bearer mock-token')
        .send({
          // Invalid data
          price: 'not-a-number',
        })
        .expect(400)
      
      expect(response.body).toEqual({
        error: 'Validation failed',
        details: [
          {
            field: 'name',
            message: 'Name is required',
          },
          {
            field: 'price',
            message: 'Price must be a number',
          },
        ],
      })
    })
    
    it('should use caching', async () => {
      // First request - cache miss
      vi.mocked(redis.get).mockResolvedValue(null)
      
      await request(app)
        .get('${endpointPath}/123')
        .set('Authorization', 'Bearer mock-token')
        .expect(200)
      
      expect(vi.mocked(prisma.item.findUnique)).toHaveBeenCalled()
      expect(vi.mocked(redis.set)).toHaveBeenCalled()
      
      // Second request - cache hit
      vi.mocked(redis.get).mockResolvedValue(JSON.stringify({ id: '123', name: 'Cached' }))
      vi.mocked(prisma.item.findUnique).mockClear()
      
      const response = await request(app)
        .get('${endpointPath}/123')
        .set('Authorization', 'Bearer mock-token')
        .expect(200)
      
      expect(vi.mocked(prisma.item.findUnique)).not.toHaveBeenCalled()
      expect(response.body.data.name).toBe('Cached')
    })
    
    it('should handle concurrent requests', async () => {
      const promises = Array.from({ length: 10 }, (_, i) => 
        request(app)
          .post('${endpointPath}')
          .set('Authorization', 'Bearer mock-token')
          .send({ name: \`Item \${i}\` })
      )
      
      const responses = await Promise.all(promises)
      
      responses.forEach(response => {
        expect(response.status).toBe(201)
      })
      
      expect(vi.mocked(prisma.item.create)).toHaveBeenCalledTimes(10)
    })
  })
})
\`\`\`

## GraphQL Resolver Tests

\`\`\`typescript
// apps/api/src/graphql/resolvers/${endpointPath}.test.ts

import { describe, it, expect, vi } from 'vitest'
import { graphql } from 'graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { typeDefs } from '../schema'
import { resolvers } from '../resolvers'
import { createTestContext } from '@/test/utils/graphql'

const schema = makeExecutableSchema({ typeDefs, resolvers })

describe('GraphQL: ${endpointPath}', () => {
  describe('Query', () => {
    it('should fetch single item', async () => {
      const mockItem = { id: '123', name: 'Test Item' }
      const context = createTestContext({
        prisma: {
          item: {
            findUnique: vi.fn().mockResolvedValue(mockItem),
          },
        },
      })
      
      const query = \`
        query GetItem($id: ID!) {
          item(id: $id) {
            id
            name
          }
        }
      \`
      
      const result = await graphql({
        schema,
        source: query,
        contextValue: context,
        variableValues: { id: '123' },
      })
      
      expect(result.errors).toBeUndefined()
      expect(result.data?.item).toEqual(mockItem)
    })
    
    it('should handle errors gracefully', async () => {
      const context = createTestContext({
        prisma: {
          item: {
            findUnique: vi.fn().mockRejectedValue(new Error('Database error')),
          },
        },
      })
      
      const query = \`
        query GetItem($id: ID!) {
          item(id: $id) {
            id
            name
          }
        }
      \`
      
      const result = await graphql({
        schema,
        source: query,
        contextValue: context,
        variableValues: { id: '123' },
      })
      
      expect(result.errors).toBeDefined()
      expect(result.errors?.[0].message).toBe('Failed to fetch item')
    })
  })
  
  describe('Mutation', () => {
    it('should create item with validation', async () => {
      const mockItem = { id: '123', name: 'New Item', price: 99.99 }
      const context = createTestContext({
        prisma: {
          item: {
            create: vi.fn().mockResolvedValue(mockItem),
          },
        },
      })
      
      const mutation = \`
        mutation CreateItem($input: CreateItemInput!) {
          createItem(input: $input) {
            id
            name
            price
          }
        }
      \`
      
      const result = await graphql({
        schema,
        source: mutation,
        contextValue: context,
        variableValues: {
          input: {
            name: 'New Item',
            price: 99.99,
          },
        },
      })
      
      expect(result.errors).toBeUndefined()
      expect(result.data?.createItem).toEqual(mockItem)
    })
    
    it('should enforce authorization', async () => {
      const context = createTestContext({
        user: null, // Not authenticated
      })
      
      const mutation = \`
        mutation DeleteItem($id: ID!) {
          deleteItem(id: $id)
        }
      \`
      
      const result = await graphql({
        schema,
        source: mutation,
        contextValue: context,
        variableValues: { id: '123' },
      })
      
      expect(result.errors).toBeDefined()
      expect(result.errors?.[0].extensions?.code).toBe('UNAUTHENTICATED')
    })
  })
  
  describe('Subscriptions', () => {
    it('should handle real-time updates', async () => {
      const context = createTestContext()
      
      const subscription = \`
        subscription OnItemUpdate($id: ID!) {
          itemUpdated(id: $id) {
            id
            name
            updatedAt
          }
        }
      \`
      
      const iterator = await graphql({
        schema,
        source: subscription,
        contextValue: context,
        variableValues: { id: '123' },
      })
      
      // Simulate update
      context.pubsub.publish('ITEM_UPDATED', {
        itemUpdated: { id: '123', name: 'Updated', updatedAt: new Date() },
      })
      
      const result = await iterator.next()
      expect(result.value.data?.itemUpdated).toBeDefined()
    })
  })
})
\`\`\`

## Integration Test Patterns

\`\`\`typescript
// Integration tests with real services

describe('API Integration Tests', () => {
  let container: StartedTestContainer
  let prismaClient: PrismaClient
  
  beforeAll(async () => {
    // Start test containers
    container = await new GenericContainer('postgres:15')
      .withExposedPorts(5432)
      .withEnv('POSTGRES_PASSWORD', 'test')
      .start()
    
    // Initialize Prisma with test database
    process.env.DATABASE_URL = \`postgresql://postgres:test@localhost:\${container.getMappedPort(5432)}/test\`
    prismaClient = new PrismaClient()
    
    // Run migrations
    await execSync('npx prisma migrate deploy')
  })
  
  afterAll(async () => {
    await prismaClient.$disconnect()
    await container.stop()
  })
  
  it('should perform end-to-end workflow creation', async () => {
    // Create user
    const user = await prismaClient.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
      },
    })
    
    // Create workflow via API
    const response = await request(app)
      .post('/api/workflows')
      .set('Authorization', \`Bearer \${generateTestToken(user.id)}\`)
      .send({
        name: 'Test Workflow',
        nodes: [
          { type: 'trigger', config: {} },
          { type: 'action', config: {} },
        ],
      })
      .expect(201)
    
    // Verify in database
    const workflow = await prismaClient.workflow.findUnique({
      where: { id: response.body.data.id },
      include: { nodes: true },
    })
    
    expect(workflow).toBeDefined()
    expect(workflow?.nodes).toHaveLength(2)
    
    // Verify webhook was created
    const webhook = await prismaClient.webhook.findFirst({
      where: { workflowId: workflow?.id },
    })
    
    expect(webhook).toBeDefined()
  })
})
\`\`\`

## Load Testing

\`\`\`typescript
// load-tests/api.test.ts

import { check } from 'k6'
import http from 'k6/http'
import { Rate } from 'k6/metrics'

export const errorRate = new Rate('errors')

export const options = {
  stages: [
    { duration: '30s', target: 10 },
    { duration: '1m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '1m', target: 50 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    errors: ['rate<0.1'], // Error rate under 10%
  },
}

export default function () {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer \${__ENV.API_TOKEN}',
    },
  }
  
  // Test GET endpoint
  const getRes = http.get('http://localhost:3000/api/items', params)
  check(getRes, {
    'GET status is 200': (r) => r.status === 200,
    'GET response time < 500ms': (r) => r.timings.duration < 500,
  })
  errorRate.add(getRes.status !== 200)
  
  // Test POST endpoint
  const payload = JSON.stringify({
    name: \`Item \${__VU}-\${__ITER}\`,
    price: Math.random() * 100,
  })
  
  const postRes = http.post('http://localhost:3000/api/items', payload, params)
  check(postRes, {
    'POST status is 201': (r) => r.status === 201,
    'POST response has id': (r) => JSON.parse(r.body).data.id !== undefined,
  })
  errorRate.add(postRes.status !== 201)
}
\`\`\`

## Contract Testing

\`\`\`typescript
// Contract tests with Pact

import { Pact } from '@pact-foundation/pact'
import { describe, it, beforeAll, afterAll } from 'vitest'
import { apiClient } from '@/lib/api-client'

describe('API Contract Tests', () => {
  const provider = new Pact({
    consumer: 'web-app',
    provider: 'api-server',
    port: 1234,
  })
  
  beforeAll(() => provider.setup())
  afterAll(() => provider.finalize())
  
  it('should fetch user profile', async () => {
    await provider.addInteraction({
      state: 'user exists',
      uponReceiving: 'a request for user profile',
      withRequest: {
        method: 'GET',
        path: '/api/users/123',
        headers: {
          Authorization: 'Bearer token',
        },
      },
      willRespondWith: {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
        body: {
          id: '123',
          email: 'user@example.com',
          name: 'Test User',
        },
      },
    })
    
    const response = await apiClient.getUser('123')
    expect(response).toEqual({
      id: '123',
      email: 'user@example.com',
      name: 'Test User',
    })
  })
})
\`\`\`
`,
      mockingStrategies: {
        database: 'Use Prisma mocks or in-memory database',
        authentication: 'Mock auth providers with predictable responses',
        externalAPIs: 'Use MSW for HTTP mocking',
        fileSystem: 'Use memfs for file operations',
        websockets: 'Use mock-socket for WebSocket testing',
        queues: 'Use in-memory queue implementations'
      },
      bestPractices: [
        'Test the contract, not the implementation',
        'Use proper test isolation with setup/teardown',
        'Mock at the network boundary, not internal modules',
        'Test error cases and edge cases thoroughly',
        'Use descriptive test names that explain the behavior',
        'Keep tests fast and deterministic',
        'Avoid testing framework code or libraries',
        'Use contract testing for service boundaries'
      ],
      resources: [
        'Vitest API Testing: https://vitest.dev/guide/testing-apis',
        'Supertest: https://github.com/visionmedia/supertest',
        'MSW: https://mswjs.io/',
        'Pact Contract Testing: https://pact.io/',
        'K6 Load Testing: https://k6.io/'
      ]
    };
  }
};

module.exports = hook;