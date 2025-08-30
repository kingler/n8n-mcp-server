#!/usr/bin/env node
/**
 * /validate-types - Perform TypeScript type checking and validation
 * 
 * Validates TypeScript types across the N8N MAS monorepo, ensuring
 * type safety and catching potential runtime errors at compile time.
 */

const hook = {
  name: 'validate-types',
  description: 'Perform comprehensive TypeScript validation for N8N MAS',
  trigger: '/validate-types',
  
  async execute(context) {
    const { scope, fix, strict } = context.args;
    
    return {
      template: `
# TypeScript Type Validation

## Type Checking Commands

### Monorepo-wide Type Check
\`\`\`bash
# Check all workspaces
npm run type-check

# Check specific workspace
npm run type-check --workspace=@n8n-mas/web
npm run type-check --workspace=@n8n-mas/api

# Watch mode for development
npm run type-check:watch

# Generate type coverage report
npx type-coverage --detail
\`\`\`

### TypeScript Configuration

\`\`\`json
// tsconfig.json (root)
{
  "compilerOptions": {
    // Strict type checking
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    
    // Additional checks
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    
    // Module resolution
    "module": "ESNext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    
    // Emit configuration
    "noEmit": true,
    "declaration": true,
    "declarationMap": true,
    
    // Interop
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "isolatedModules": true,
    
    // Target
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    
    // Path mapping
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@n8n-mas/*": ["./packages/*/src"]
    }
  },
  "references": [
    { "path": "./apps/web" },
    { "path": "./apps/api" },
    { "path": "./packages/agent-framework" },
    { "path": "./packages/mcp-protocol" }
  ]
}
\`\`\`

## Type Validation Patterns

### 1. Runtime Type Validation with Zod

\`\`\`typescript
import { z } from 'zod'

// Define schemas
const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string().email(),
  username: z.string().min(3).max(30),
  role: z.enum(['user', 'admin', 'moderator']),
  metadata: z.record(z.unknown()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

const CreateUserSchema = UserSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
})

// Type inference
type User = z.infer<typeof UserSchema>
type CreateUserInput = z.infer<typeof CreateUserSchema>

// Validation function
export function validateUser(data: unknown): User {
  return UserSchema.parse(data)
}

// Safe parsing with error handling
export function safeValidateUser(data: unknown): 
  | { success: true; data: User }
  | { success: false; error: z.ZodError } {
  const result = UserSchema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return { success: false, error: result.error }
}

// API endpoint with validation
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = CreateUserSchema.parse(body)
    
    // Type is guaranteed here
    const user = await createUser(validatedData)
    
    return Response.json({ data: user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
\`\`\`

### 2. Type Guards and Predicates

\`\`\`typescript
// Type guards for runtime checks
export function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value &&
    typeof (value as any).id === 'string' &&
    typeof (value as any).email === 'string'
  )
}

// Discriminated unions
type ApiResponse<T> = 
  | { status: 'success'; data: T }
  | { status: 'error'; error: string }
  | { status: 'loading' }

function isSuccessResponse<T>(
  response: ApiResponse<T>
): response is { status: 'success'; data: T } {
  return response.status === 'success'
}

// Usage with type narrowing
function handleResponse<T>(response: ApiResponse<T>) {
  if (isSuccessResponse(response)) {
    // TypeScript knows response.data exists here
    console.log(response.data)
  } else if (response.status === 'error') {
    // TypeScript knows response.error exists here
    console.error(response.error)
  } else {
    // Must be loading
    console.log('Loading...')
  }
}

// Array type guards
function isStringArray(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.every(item => typeof item === 'string')
  )
}

// Object type guards with nested properties
interface Agent {
  id: string
  type: 'orchestrator' | 'specialist'
  capabilities: string[]
  config: {
    model: string
    temperature: number
  }
}

function isAgent(value: unknown): value is Agent {
  if (typeof value !== 'object' || value === null) return false
  
  const obj = value as Record<string, unknown>
  
  return (
    typeof obj.id === 'string' &&
    (obj.type === 'orchestrator' || obj.type === 'specialist') &&
    isStringArray(obj.capabilities) &&
    typeof obj.config === 'object' &&
    obj.config !== null &&
    typeof (obj.config as any).model === 'string' &&
    typeof (obj.config as any).temperature === 'number'
  )
}
\`\`\`

### 3. Generic Type Constraints

\`\`\`typescript
// Constrained generics
interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}

// Repository with type constraints
class Repository<T extends BaseEntity> {
  constructor(private model: string) {}
  
  async findById(id: string): Promise<T | null> {
    // Implementation
    return null
  }
  
  async create<CreateInput extends Omit<T, keyof BaseEntity>>(
    data: CreateInput
  ): Promise<T> {
    const entity = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    } as T
    
    return entity
  }
  
  async update<UpdateInput extends Partial<Omit<T, keyof BaseEntity>>>(
    id: string,
    data: UpdateInput
  ): Promise<T> {
    // Implementation
    throw new Error('Not implemented')
  }
}

// Conditional types
type AsyncReturnType<T extends (...args: any) => Promise<any>> = 
  T extends (...args: any) => Promise<infer R> ? R : never

// Usage
async function fetchUser(): Promise<User> {
  // Implementation
  throw new Error('Not implemented')
}

type FetchedUser = AsyncReturnType<typeof fetchUser> // User

// Mapped types with modifiers
type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object 
    ? DeepReadonly<T[P]> 
    : T[P]
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object 
    ? DeepPartial<T[P]> 
    : T[P]
}

// Template literal types
type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
type APIEndpoint = \`/api/\${string}\`
type RouteHandler = \`handle\${Capitalize<Lowercase<HTTPMethod>>}\`

// Produces: 'handleGet' | 'handlePost' | 'handlePut' | 'handleDelete' | 'handlePatch'
\`\`\`

### 4. Advanced Type Validation

\`\`\`typescript
// Branded types for type safety
type UserId = string & { __brand: 'UserId' }
type AgentId = string & { __brand: 'AgentId' }

function createUserId(id: string): UserId {
  // Validate format
  if (!id.match(/^user_[a-zA-Z0-9]+$/)) {
    throw new Error('Invalid user ID format')
  }
  return id as UserId
}

function createAgentId(id: string): AgentId {
  // Validate format
  if (!id.match(/^agent_[a-zA-Z0-9]+$/)) {
    throw new Error('Invalid agent ID format')
  }
  return id as AgentId
}

// Can't accidentally mix IDs
function assignTaskToAgent(agentId: AgentId, userId: UserId) {
  // Type safe - can't pass UserId where AgentId is expected
}

// Const assertions for literal types
const ROLES = ['user', 'admin', 'moderator'] as const
type Role = typeof ROLES[number] // 'user' | 'admin' | 'moderator'

// Exhaustive switch checks
function getRolePermissions(role: Role): string[] {
  switch (role) {
    case 'user':
      return ['read']
    case 'admin':
      return ['read', 'write', 'delete']
    case 'moderator':
      return ['read', 'write']
    default:
      // TypeScript error if not all cases handled
      const _exhaustive: never = role
      throw new Error(\`Unhandled role: \${role}\`)
  }
}

// Type-safe event emitter
type EventMap = {
  'user:created': { userId: UserId; email: string }
  'agent:started': { agentId: AgentId; taskId: string }
  'task:completed': { taskId: string; result: unknown }
}

class TypedEventEmitter {
  private handlers: Map<keyof EventMap, Set<Function>> = new Map()
  
  on<K extends keyof EventMap>(
    event: K,
    handler: (data: EventMap[K]) => void
  ): void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set())
    }
    this.handlers.get(event)!.add(handler)
  }
  
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const handlers = this.handlers.get(event)
    if (handlers) {
      handlers.forEach(handler => handler(data))
    }
  }
}
\`\`\`

### 5. Type Testing

\`\`\`typescript
// Type-level unit tests
import type { Expect, Equal } from '@type-challenges/utils'

// Test type equality
type TestUserType = Expect<Equal<User, {
  id: string
  email: string
  username: string
  role: 'user' | 'admin' | 'moderator'
  metadata?: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}>>

// Test generic constraints
type TestRepository = Repository<User> // Should compile
// @ts-expect-error - Missing required properties
type TestInvalidRepository = Repository<{ name: string }>

// Test conditional types
type TestAsync1 = Expect<Equal<
  AsyncReturnType<() => Promise<string>>,
  string
>>

type TestAsync2 = Expect<Equal<
  AsyncReturnType<() => Promise<User>>,
  User
>>

// Test utility types
type TestPartial = Expect<Equal<
  DeepPartial<{ a: { b: { c: string } } }>,
  { a?: { b?: { c?: string } } }
>>

// Runtime type tests
describe('Type Guards', () => {
  it('should correctly identify User type', () => {
    const validUser = {
      id: '123',
      email: 'test@example.com',
      username: 'testuser',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    
    expect(isUser(validUser)).toBe(true)
    expect(isUser({ id: '123' })).toBe(false)
    expect(isUser(null)).toBe(false)
    expect(isUser('string')).toBe(false)
  })
  
  it('should validate with Zod schema', () => {
    const result = UserSchema.safeParse({
      id: '123',
      email: 'invalid-email',
      username: 'te', // Too short
      role: 'superuser', // Invalid enum
      createdAt: '2024-01-01', // String instead of Date
    })
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.errors).toContainEqual(
        expect.objectContaining({
          path: ['email'],
          message: 'Invalid email',
        })
      )
    }
  })
})
\`\`\`

## Type Coverage Analysis

\`\`\`bash
# Install type coverage tool
npm install --save-dev type-coverage

# Run type coverage
npx type-coverage

# Detailed report
npx type-coverage --detail

# Set minimum coverage threshold
npx type-coverage --at-least 95

# Ignore specific files
npx type-coverage --ignore-files "**/*.test.ts"

# Generate badge
npx type-coverage --update-badge
\`\`\`

## Common Type Issues and Fixes

### 1. Implicit Any
\`\`\`typescript
// ❌ Bad: Implicit any
function processData(data) {
  return data.map(item => item.value)
}

// ✅ Good: Explicit types
function processData<T extends { value: number }>(data: T[]): number[] {
  return data.map(item => item.value)
}
\`\`\`

### 2. Type Assertions
\`\`\`typescript
// ❌ Bad: Unsafe assertion
const user = {} as User

// ✅ Good: Type guard or validation
const user = validateUser(userData)
\`\`\`

### 3. Union Type Narrowing
\`\`\`typescript
// ❌ Bad: Accessing property without narrowing
function processResponse(response: ApiResponse<User>) {
  console.log(response.data) // Error: Property 'data' does not exist
}

// ✅ Good: Proper type narrowing
function processResponse(response: ApiResponse<User>) {
  if (response.status === 'success') {
    console.log(response.data) // Safe access
  }
}
\`\`\`

### 4. Optional Chaining with Arrays
\`\`\`typescript
// ❌ Bad: Unsafe array access
const firstItem = items[0].name

// ✅ Good: Safe access with optional chaining
const firstItem = items[0]?.name

// ✅ Better: With noUncheckedIndexedAccess
const firstItem = items[0]?.name // TypeScript enforces this
\`\`\`
`,
      validationStrategies: {
        compile: 'TypeScript compiler checks',
        runtime: 'Zod schema validation',
        testing: 'Type-level unit tests',
        coverage: 'Type coverage analysis',
        linting: 'ESLint type-aware rules',
        ci: 'Automated type checking in CI/CD'
      },
      bestPractices: [
        'Enable strict mode in tsconfig.json',
        'Use type guards for runtime validation',
        'Prefer interfaces over type aliases for objects',
        'Avoid type assertions unless absolutely necessary',
        'Use branded types for domain modeling',
        'Implement exhaustive switch statements',
        'Write type-level tests for complex types',
        'Maintain high type coverage (>95%)'
      ],
      resources: [
        'TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/',
        'Type Challenges: https://github.com/type-challenges/type-challenges',
        'Zod Documentation: https://zod.dev/',
        'Type Coverage: https://github.com/plantain-00/type-coverage',
        'TypeScript Deep Dive: https://basarat.gitbook.io/typescript/'
      ]
    };
  }
};

module.exports = hook;