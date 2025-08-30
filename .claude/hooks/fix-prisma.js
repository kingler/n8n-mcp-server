#!/usr/bin/env node
/**
 * /fix-prisma - Debug Prisma ORM v6.13.0 schema and query problems
 * 
 * Handles Prisma v6.13.0 specific issues including schema design, migrations,
 * query optimization, type safety, and performance problems.
 */

const hook = {
  name: 'fix-prisma',
  description: 'Resolve Prisma ORM v6.13.0 schema, query, and performance issues',
  trigger: '/fix-prisma',
  
  async execute(context) {
    const { error, issue, query } = context.args;
    
    const solutions = {
      // Schema Design Issues
      'schema': {
        basicSchema: `// Prisma v6.13.0 Schema Best Practices

// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["multiSchema", "views", "prismaSchemaFolder"]
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  schemas  = ["public", "auth", "analytics"] // Multi-schema support
}

// Base model with common fields
model BaseModel {
  id        String   @id @default(cuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  deletedAt DateTime? // Soft delete support
  
  @@map("base_models")
  @@schema("public")
}

// User model with advanced features
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  username      String?   @unique
  passwordHash  String?   @map("password_hash")
  emailVerified DateTime? @map("email_verified")
  
  // JSON fields with type safety
  metadata      Json      @default("{}")
  preferences   Json      @db.JsonB // Better performance for queries
  
  // Relations
  profile       Profile?
  posts         Post[]
  sessions      Session[]
  
  // Audit fields
  createdAt     DateTime  @default(now()) @map("created_at")
  updatedAt     DateTime  @updatedAt @map("updated_at")
  lastLoginAt   DateTime? @map("last_login_at")
  
  // Indexes for performance
  @@index([email])
  @@index([username])
  @@index([createdAt])
  @@map("users")
  @@schema("auth")
}

// One-to-one relation
model Profile {
  id          String   @id @default(cuid())
  bio         String?  @db.Text
  avatarUrl   String?  @map("avatar_url")
  dateOfBirth DateTime? @map("date_of_birth")
  
  // Foreign key
  userId      String   @unique @map("user_id")
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  @@map("profiles")
  @@schema("public")
}

// Many-to-many with explicit relation table
model Post {
  id          String     @id @default(cuid())
  title       String     @db.VarChar(255)
  content     String     @db.Text
  published   Boolean    @default(false)
  viewCount   Int        @default(0) @map("view_count")
  
  // Full-text search
  searchVector Unsupported("tsvector")? @map("search_vector")
  
  authorId    String     @map("author_id")
  author      User       @relation(fields: [authorId], references: [id])
  
  categories  CategoriesOnPosts[]
  tags        Tag[]      @relation("PostTags")
  
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")
  publishedAt DateTime?  @map("published_at")
  
  // Composite index
  @@index([authorId, published])
  @@index([createdAt(sort: Desc)])
  @@map("posts")
}

// Explicit many-to-many relation
model Category {
  id    String @id @default(cuid())
  name  String @unique
  slug  String @unique
  
  posts CategoriesOnPosts[]
  
  @@map("categories")
}

model CategoriesOnPosts {
  postId     String @map("post_id")
  categoryId String @map("category_id")
  assignedAt DateTime @default(now()) @map("assigned_at")
  
  post       Post @relation(fields: [postId], references: [id], onDelete: Cascade)
  category   Category @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  
  @@id([postId, categoryId])
  @@map("categories_on_posts")
}

// Enum usage
enum Role {
  USER
  ADMIN
  MODERATOR
}

// View support (v6.13.0)
view ActiveUsers {
  id           String
  email        String
  lastLoginAt  DateTime?
  postCount    Int
  
  @@map("active_users")
}`,

        migrations: `// Prisma v6.13.0 Migration Best Practices

// 1. Safe migration with data transformation
-- migrations/20240315000000_add_user_metadata/migration.sql

-- Add column with default
ALTER TABLE "users" ADD COLUMN "metadata" JSONB DEFAULT '{}';

-- Backfill existing data
UPDATE "users" 
SET "metadata" = jsonb_build_object(
  'migrated', true,
  'legacy_id', id::text
)
WHERE "metadata" IS NULL;

-- Add NOT NULL constraint after backfill
ALTER TABLE "users" ALTER COLUMN "metadata" SET NOT NULL;

// 2. Zero-downtime migrations
// Step 1: Add new column (deploy)
ALTER TABLE "users" ADD COLUMN "username_new" VARCHAR(50);

// Step 2: Dual write (deploy)
// Application writes to both columns

// Step 3: Backfill data
UPDATE "users" SET "username_new" = "username" WHERE "username_new" IS NULL;

// Step 4: Switch reads (deploy)
// Application reads from new column

// Step 5: Drop old column (deploy)
ALTER TABLE "users" DROP COLUMN "username";
ALTER TABLE "users" RENAME COLUMN "username_new" TO "username";

// 3. Index creation without locking
CREATE INDEX CONCURRENTLY "idx_users_email" ON "users"("email");

// 4. Custom migration with Prisma
// prisma/migrations/custom.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Complex data migration
  await prisma.$transaction(async (tx) => {
    const users = await tx.user.findMany()
    
    for (const user of users) {
      await tx.user.update({
        where: { id: user.id },
        data: {
          metadata: {
            ...user.metadata as object,
            migrated: true,
            version: '2.0'
          }
        }
      })
    }
  })
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())`,

        advancedQueries: `// Prisma v6.13.0 Advanced Query Patterns

import { PrismaClient, Prisma } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// 1. Type-safe transactions with rollback
async function createUserWithProfile(data: {
  email: string
  username: string
  bio: string
}) {
  try {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          username: data.username,
        },
      })
      
      const profile = await tx.profile.create({
        data: {
          bio: data.bio,
          userId: user.id,
        },
      })
      
      // Simulate validation
      if (profile.bio.length < 10) {
        throw new Error('Bio too short')
      }
      
      return { user, profile }
    }, {
      maxWait: 5000, // 5 seconds
      timeout: 10000, // 10 seconds
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    })
  } catch (error) {
    // Transaction automatically rolled back
    console.error('Transaction failed:', error)
    throw error
  }
}

// 2. Optimized pagination with cursor
async function paginatePosts(cursor?: string, take: number = 10) {
  const posts = await prisma.post.findMany({
    take: take + 1, // Fetch one extra to check if there's more
    cursor: cursor ? { id: cursor } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          profile: {
            select: { avatarUrl: true }
          }
        }
      },
      _count: {
        select: { 
          categories: true,
          tags: true 
        }
      }
    }
  })
  
  const hasMore = posts.length > take
  const items = hasMore ? posts.slice(0, -1) : posts
  const nextCursor = hasMore ? items[items.length - 1].id : null
  
  return { items, nextCursor, hasMore }
}

// 3. Full-text search with PostgreSQL
async function searchPosts(query: string) {
  return await prisma.$queryRaw<Post[]>\`
    SELECT * FROM posts
    WHERE to_tsvector('english', title || ' ' || content) @@ plainto_tsquery('english', \${query})
    ORDER BY ts_rank(to_tsvector('english', title || ' ' || content), plainto_tsquery('english', \${query})) DESC
    LIMIT 20
  \`
}

// 4. Aggregation with groupBy
async function getPostStatsByAuthor() {
  return await prisma.post.groupBy({
    by: ['authorId', 'published'],
    _count: {
      id: true,
    },
    _sum: {
      viewCount: true,
    },
    _avg: {
      viewCount: true,
    },
    having: {
      viewCount: {
        _avg: {
          gt: 100,
        },
      },
    },
    orderBy: {
      _count: {
        id: 'desc',
      },
    },
  })
}

// 5. Complex filtering with type safety
type PostWhereInput = Prisma.PostWhereInput

function buildPostFilter(params: {
  authorId?: string
  published?: boolean
  tags?: string[]
  searchTerm?: string
  dateRange?: { start: Date; end: Date }
}): PostWhereInput {
  const where: PostWhereInput = {
    AND: []
  }
  
  if (params.authorId) {
    where.AND!.push({ authorId: params.authorId })
  }
  
  if (params.published !== undefined) {
    where.AND!.push({ published: params.published })
  }
  
  if (params.tags?.length) {
    where.AND!.push({
      tags: {
        some: {
          name: {
            in: params.tags
          }
        }
      }
    })
  }
  
  if (params.searchTerm) {
    where.AND!.push({
      OR: [
        { title: { contains: params.searchTerm, mode: 'insensitive' } },
        { content: { contains: params.searchTerm, mode: 'insensitive' } }
      ]
    })
  }
  
  if (params.dateRange) {
    where.AND!.push({
      createdAt: {
        gte: params.dateRange.start,
        lte: params.dateRange.end
      }
    })
  }
  
  return where.AND!.length ? where : {}
}

// 6. Upsert with conflict handling
async function upsertUser(email: string, data: Partial<User>) {
  return await prisma.user.upsert({
    where: { email },
    update: {
      ...data,
      updatedAt: new Date(),
    },
    create: {
      email,
      ...data,
    },
    include: {
      profile: true,
      _count: {
        select: { posts: true }
      }
    }
  })
}

// 7. Batch operations
async function batchCreatePosts(posts: Array<{
  title: string
  content: string
  authorId: string
}>) {
  // Use createMany for better performance
  const result = await prisma.post.createMany({
    data: posts,
    skipDuplicates: true,
  })
  
  // Get created posts
  const createdPosts = await prisma.post.findMany({
    where: {
      title: {
        in: posts.map(p => p.title)
      }
    },
    orderBy: { createdAt: 'desc' },
    take: posts.length
  })
  
  return { count: result.count, posts: createdPosts }
}`
      },

      // Performance Optimization
      'performance': {
        queryOptimization: `// Prisma v6.13.0 Performance Optimization

// 1. Connection pooling configuration
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Connection pool settings
  connection_limit: 10,
  pool_timeout: 10,
  pool_size: 10,
  // Query timeout
  statement_timeout: 20000,
})

// 2. Query optimization with select
// ❌ Bad: Fetching all fields
const users = await prisma.user.findMany({
  include: {
    posts: true,
    profile: true,
    sessions: true,
  }
})

// ✅ Good: Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    username: true,
    profile: {
      select: {
        avatarUrl: true,
        bio: true,
      }
    },
    _count: {
      select: {
        posts: true,
      }
    }
  }
})

// 3. N+1 query prevention
// ❌ Bad: N+1 queries
const posts = await prisma.post.findMany()
for (const post of posts) {
  const author = await prisma.user.findUnique({
    where: { id: post.authorId }
  })
  // Process...
}

// ✅ Good: Single query with include
const posts = await prisma.post.findMany({
  include: {
    author: {
      select: {
        id: true,
        username: true,
      }
    }
  }
})

// 4. Batch operations for performance
// ❌ Bad: Individual creates
for (const item of items) {
  await prisma.item.create({ data: item })
}

// ✅ Good: Batch create
await prisma.item.createMany({
  data: items,
})

// 5. Raw queries for complex operations
const results = await prisma.$queryRaw<
  Array<{ authorId: string; postCount: number }>
>\`
  SELECT 
    u.id as "authorId",
    COUNT(p.id)::int as "postCount"
  FROM users u
  LEFT JOIN posts p ON p.author_id = u.id
  WHERE u.created_at > NOW() - INTERVAL '30 days'
  GROUP BY u.id
  HAVING COUNT(p.id) > 5
  ORDER BY COUNT(p.id) DESC
\`

// 6. Index usage verification
// Check query plan
const queryPlan = await prisma.$queryRaw\`
  EXPLAIN ANALYZE
  SELECT * FROM users WHERE email = 'test@example.com'
\`

// 7. Middleware for query timing
prisma.$use(async (params, next) => {
  const before = Date.now()
  const result = await next(params)
  const after = Date.now()
  
  console.log(\`Query \${params.model}.\${params.action} took \${after - before}ms\`)
  
  return result
})`,

        caching: `// Implementing Caching with Prisma v6.13.0

import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'

const prisma = new PrismaClient()
const redis = new Redis(process.env.REDIS_URL)

// 1. Query result caching
class PrismaWithCache {
  private ttl = 300 // 5 minutes default
  
  async findUnique<T>(
    model: string,
    args: any,
    ttl?: number
  ): Promise<T | null> {
    const cacheKey = \`\${model}:findUnique:\${JSON.stringify(args)}\`
    
    // Check cache
    const cached = await redis.get(cacheKey)
    if (cached) {
      return JSON.parse(cached)
    }
    
    // Query database
    const result = await (prisma as any)[model].findUnique(args)
    
    // Cache result
    if (result) {
      await redis.set(
        cacheKey,
        JSON.stringify(result),
        'EX',
        ttl || this.ttl
      )
    }
    
    return result
  }
  
  async invalidate(model: string, id: string) {
    const pattern = \`\${model}:*:\${id}*\`
    const keys = await redis.keys(pattern)
    if (keys.length) {
      await redis.del(...keys)
    }
  }
}

// 2. Middleware-based caching
const cacheMiddleware = async (params: any, next: any) => {
  // Only cache read operations
  if (!['findUnique', 'findFirst', 'findMany'].includes(params.action)) {
    return next(params)
  }
  
  const cacheKey = \`\${params.model}:\${params.action}:\${JSON.stringify(params.args)}\`
  
  // Check cache
  const cached = await redis.get(cacheKey)
  if (cached) {
    return JSON.parse(cached)
  }
  
  // Execute query
  const result = await next(params)
  
  // Cache result (with model-specific TTL)
  const ttl = {
    User: 600,    // 10 minutes
    Post: 300,    // 5 minutes
    Category: 3600, // 1 hour
  }[params.model] || 300
  
  await redis.set(cacheKey, JSON.stringify(result), 'EX', ttl)
  
  return result
}

// 3. Cache invalidation on mutations
const invalidationMiddleware = async (params: any, next: any) => {
  const result = await next(params)
  
  // Invalidate cache on mutations
  if (['create', 'update', 'delete', 'upsert'].includes(params.action)) {
    const pattern = \`\${params.model}:*\`
    const keys = await redis.keys(pattern)
    if (keys.length) {
      await redis.del(...keys)
    }
  }
  
  return result
}

// Apply middleware
prisma.$use(cacheMiddleware)
prisma.$use(invalidationMiddleware)

// 4. Computed fields caching
async function getUserWithStats(userId: string) {
  const cacheKey = \`user:stats:\${userId}\`
  
  const cached = await redis.get(cacheKey)
  if (cached) return JSON.parse(cached)
  
  const [user, postCount, totalViews] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true }
    }),
    prisma.post.count({
      where: { authorId: userId }
    }),
    prisma.post.aggregate({
      where: { authorId: userId },
      _sum: { viewCount: true }
    })
  ])
  
  const result = {
    ...user,
    stats: {
      postCount,
      totalViews: totalViews._sum.viewCount || 0
    }
  }
  
  await redis.set(cacheKey, JSON.stringify(result), 'EX', 600)
  
  return result
}`
      },

      // Type Safety
      'typeSafety': {
        generatedTypes: `// Working with Prisma v6.13.0 Generated Types

import { 
  PrismaClient, 
  User, 
  Post, 
  Prisma 
} from '@prisma/client'

// 1. Input types for mutations
type UserCreateInput = Prisma.UserCreateInput
type UserUpdateInput = Prisma.UserUpdateInput
type UserWhereInput = Prisma.UserWhereInput
type UserWhereUniqueInput = Prisma.UserWhereUniqueInput

// 2. Type-safe service layer
class UserService {
  async createUser(data: Omit<UserCreateInput, 'id' | 'createdAt' | 'updatedAt'>) {
    return await prisma.user.create({
      data: {
        ...data,
        profile: data.profile ? {
          create: data.profile
        } : undefined
      },
      include: {
        profile: true
      }
    })
  }
  
  async updateUser(
    where: UserWhereUniqueInput,
    data: UserUpdateInput
  ) {
    return await prisma.user.update({
      where,
      data,
      include: {
        profile: true,
        _count: {
          select: { posts: true }
        }
      }
    })
  }
  
  async findUsers(params: {
    where?: UserWhereInput
    orderBy?: Prisma.UserOrderByWithRelationInput
    take?: number
    skip?: number
  }) {
    const { where, orderBy, take = 10, skip = 0 } = params
    
    return await prisma.user.findMany({
      where,
      orderBy,
      take,
      skip,
      include: {
        profile: {
          select: {
            bio: true,
            avatarUrl: true
          }
        }
      }
    })
  }
}

// 3. Type helpers for complex queries
type UserWithProfile = User & {
  profile: Profile | null
}

type PostWithAuthor = Post & {
  author: {
    id: string
    username: string | null
    profile: {
      avatarUrl: string | null
    } | null
  }
}

// 4. Utility types for API responses
type ApiResponse<T> = {
  data: T
  meta?: {
    total?: number
    page?: number
    pageSize?: number
  }
}

type PaginatedResponse<T> = ApiResponse<T[]> & {
  meta: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

// 5. Type guards
function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'string' && typeof obj.email === 'string'
}

function hasProfile<T extends { profile?: unknown }>(
  user: T
): user is T & { profile: NonNullable<T['profile']> } {
  return user.profile !== null && user.profile !== undefined
}

// 6. Generic repository pattern
class Repository<T, CreateInput, UpdateInput, WhereInput, WhereUniqueInput> {
  constructor(private model: any) {}
  
  async create(data: CreateInput): Promise<T> {
    return await this.model.create({ data })
  }
  
  async update(where: WhereUniqueInput, data: UpdateInput): Promise<T> {
    return await this.model.update({ where, data })
  }
  
  async findMany(where?: WhereInput): Promise<T[]> {
    return await this.model.findMany({ where })
  }
  
  async findUnique(where: WhereUniqueInput): Promise<T | null> {
    return await this.model.findUnique({ where })
  }
}

// Usage
const userRepo = new Repository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput,
  Prisma.UserWhereInput,
  Prisma.UserWhereUniqueInput
>(prisma.user)`,

        validation: `// Data Validation with Prisma v6.13.0 and Zod

import { z } from 'zod'
import { Prisma } from '@prisma/client'

// 1. Schema validation
const createUserSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_]+$/),
  password: z.string().min(8).max(100),
  profile: z.object({
    bio: z.string().max(500).optional(),
    dateOfBirth: z.date().optional(),
  }).optional(),
})

const updateUserSchema = createUserSchema.partial()

// 2. Type inference from Zod schemas
type CreateUserInput = z.infer<typeof createUserSchema>
type UpdateUserInput = z.infer<typeof updateUserSchema>

// 3. Validation middleware
async function validateAndCreate<T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  createFn: (data: T) => Promise<any>
) {
  const validated = schema.parse(data)
  return await createFn(validated)
}

// 4. API endpoint with validation
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    const user = await validateAndCreate(
      createUserSchema,
      body,
      async (data) => {
        // Hash password
        const passwordHash = await bcrypt.hash(data.password, 10)
        
        return await prisma.user.create({
          data: {
            email: data.email,
            username: data.username,
            passwordHash,
            profile: data.profile ? {
              create: data.profile
            } : undefined
          }
        })
      }
    )
    
    return Response.json({ user }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return Response.json(
        { errors: error.flatten().fieldErrors },
        { status: 400 }
      )
    }
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return Response.json(
          { error: 'Email or username already exists' },
          { status: 409 }
        )
      }
    }
    
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 5. Runtime type checking for JSON fields
const userMetadataSchema = z.object({
  theme: z.enum(['light', 'dark']).default('light'),
  notifications: z.object({
    email: z.boolean().default(true),
    push: z.boolean().default(false),
  }).default({}),
  features: z.record(z.boolean()).default({}),
})

async function updateUserMetadata(userId: string, metadata: unknown) {
  const validated = userMetadataSchema.parse(metadata)
  
  return await prisma.user.update({
    where: { id: userId },
    data: {
      metadata: validated as Prisma.JsonObject
    }
  })
}`
      },

      // Common Errors
      'commonErrors': {
        P2002: `// P2002: Unique constraint violation

// Error example:
// Unique constraint failed on the fields: (\`email\`)

// 1. Handle in try-catch
try {
  const user = await prisma.user.create({
    data: { email: 'existing@email.com', username: 'newuser' }
  })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const target = error.meta?.target as string[]
      console.log(\`Unique constraint failed on: \${target?.join(', ')}\`)
      
      // Handle specific fields
      if (target?.includes('email')) {
        throw new Error('Email already exists')
      }
      if (target?.includes('username')) {
        throw new Error('Username already taken')
      }
    }
  }
  throw error
}

// 2. Check before insert
const existingUser = await prisma.user.findUnique({
  where: { email: 'test@email.com' }
})

if (existingUser) {
  throw new Error('Email already registered')
}

// 3. Use upsert for idempotent operations
const user = await prisma.user.upsert({
  where: { email: 'test@email.com' },
  update: { username: 'updated' },
  create: { email: 'test@email.com', username: 'newuser' }
})`,

        P2025: `// P2025: Record not found

// Error: An operation failed because it depends on one or more records that were required but not found

// 1. Handle missing records
try {
  const updated = await prisma.user.update({
    where: { id: 'non-existent-id' },
    data: { username: 'new' }
  })
} catch (error) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      throw new Error('User not found')
    }
  }
  throw error
}

// 2. Check existence first
const user = await prisma.user.findUnique({
  where: { id: userId }
})

if (!user) {
  throw new Error('User not found')
}

// Safe update
const updated = await prisma.user.update({
  where: { id: user.id },
  data: { username: 'new' }
})

// 3. Use updateMany for safe operations
const result = await prisma.user.updateMany({
  where: { id: userId },
  data: { username: 'new' }
})

if (result.count === 0) {
  throw new Error('User not found or not updated')
}`,

        connectionErrors: `// Database Connection Errors

// 1. Connection pool exhausted
// Error: Can't reach database server

// Fix: Configure connection pool
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  // Increase pool size
  connection_limit: 20,
  
  // Add retry logic
  log: ['error', 'warn'],
  errorFormat: 'pretty',
})

// 2. Connection timeout
// Implement retry logic
async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries === 0) throw error
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Retry on connection errors
      if (['P1001', 'P1002'].includes(error.code)) {
        await new Promise(resolve => setTimeout(resolve, delay))
        return withRetry(fn, retries - 1, delay * 2)
      }
    }
    throw error
  }
}

// Usage
const user = await withRetry(() => 
  prisma.user.findUnique({ where: { id } })
)

// 3. Graceful shutdown
async function gracefulShutdown() {
  await prisma.$disconnect()
  process.exit(0)
}

process.on('SIGTERM', gracefulShutdown)
process.on('SIGINT', gracefulShutdown)`,

        migrationErrors: `// Migration Errors and Solutions

// 1. Migration failed: column already exists
// Solution: Check migration history
npx prisma migrate status

// Reset if needed (CAUTION: deletes data)
npx prisma migrate reset

// 2. Schema drift detected
// Solution: Baseline the database
npx prisma migrate dev --create-only
npx prisma migrate resolve --applied "20240315000000_baseline"

// 3. Migration pending in production
// Safe production migration
// Step 1: Review migration
npx prisma migrate dev --create-only

// Step 2: Test in staging
npx prisma migrate deploy --dry-run

// Step 3: Deploy with monitoring
npx prisma migrate deploy

// 4. Custom migration for data transformation
// migrations/20240315000000_transform_data.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function up() {
  // Transform data in batches
  const batchSize = 1000
  let skip = 0
  
  while (true) {
    const users = await prisma.user.findMany({
      take: batchSize,
      skip,
      where: { metadata: { equals: Prisma.DbNull } }
    })
    
    if (users.length === 0) break
    
    await prisma.$transaction(
      users.map(user => 
        prisma.user.update({
          where: { id: user.id },
          data: { metadata: {} }
        })
      )
    )
    
    skip += batchSize
  }
}

export async function down() {
  // Revert changes
  await prisma.user.updateMany({
    where: { metadata: { equals: {} } },
    data: { metadata: Prisma.DbNull }
  })
}`
      }
    };
    
    return {
      issue: issue || error,
      solution: solutions[issue] || solutions.commonErrors,
      version: {
        prisma: '6.13.0',
        features: [
          'Multi-schema support',
          'Views and materialized views',
          'Prisma Schema folder organization',
          'Improved TypeScript types',
          'Better connection pooling',
          'Enhanced transaction API'
        ]
      },
      bestPractices: [
        'Use select instead of include when possible',
        'Implement connection pooling for production',
        'Add proper indexes for frequently queried fields',
        'Use transactions for data consistency',
        'Implement caching for read-heavy operations',
        'Handle Prisma errors gracefully',
        'Use type-safe query builders',
        'Monitor query performance with logging'
      ],
      resources: [
        'Prisma Docs: https://www.prisma.io/docs',
        'Prisma Migrate: https://www.prisma.io/docs/concepts/components/prisma-migrate',
        'Performance Guide: https://www.prisma.io/docs/guides/performance-and-optimization',
        'Error Reference: https://www.prisma.io/docs/reference/api-reference/error-reference'
      ]
    };
  }
};

module.exports = hook;