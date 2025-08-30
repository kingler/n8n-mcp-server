#!/usr/bin/env node
/**
 * /fix-supabase - Resolve Supabase integration and pgvector configuration issues
 * 
 * Handles Supabase-specific issues including authentication, real-time subscriptions,
 * Row Level Security (RLS), pgvector for embeddings, and storage operations.
 */

const hook = {
  name: 'fix-supabase',
  description: 'Fix Supabase integration, pgvector, RLS, and real-time issues',
  trigger: '/fix-supabase',
  
  async execute(context) {
    const { error, feature, issue } = context.args;
    
    const solutions = {
      // Supabase Setup and Configuration
      'setup': {
        initialization: `// Supabase Client Setup for N8N MAS

// 1. Install dependencies
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

// 2. Environment variables (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:password@db.your-project.supabase.co:6543/postgres

// 3. Create Supabase client (lib/supabase.ts)
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

// Browser client
export const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // Recommended for security
    },
    global: {
      headers: {
        'x-application-name': 'n8n-mas',
      },
    },
    db: {
      schema: 'public',
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// Server client (with service role)
export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// 4. Type generation
npx supabase gen types typescript --project-id your-project-id > types/supabase.ts

// 5. Next.js App Router integration
// app/layout.tsx
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()
  
  return (
    <html>
      <body>
        <SupabaseProvider session={session}>
          {children}
        </SupabaseProvider>
      </body>
    </html>
  )
}`,

        authHelpers: `// Supabase Auth Helpers for Next.js 15.4

// 1. Client Component hooks
'use client'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function useSupabaseAuth() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  
  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error
      
      router.refresh()
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }
  
  const signUp = async (email: string, password: string, metadata?: any) => {
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: \`\${location.origin}/auth/callback\`,
        },
      })
      
      if (error) throw error
      
      return { data, error: null }
    } catch (error) {
      return { data: null, error }
    } finally {
      setLoading(false)
    }
  }
  
  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    router.push('/login')
    return { error }
  }
  
  return { signIn, signUp, signOut, loading }
}

// 2. Server Component auth
// app/api/auth/callback/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    await supabase.auth.exchangeCodeForSession(code)
  }
  
  return NextResponse.redirect(requestUrl.origin)
}

// 3. Middleware protection
// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  
  const {
    data: { session },
  } = await supabase.auth.getSession()
  
  // Protect routes
  if (!session && req.nextUrl.pathname.startsWith('/dashboard')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
    return NextResponse.redirect(redirectUrl)
  }
  
  return res
}

export const config = {
  matcher: ['/dashboard/:path*', '/api/protected/:path*'],
}`
      },

      // pgvector Implementation
      'pgvector': {
        setup: `-- Enable pgvector extension in Supabase

-- 1. Enable the extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create embeddings table
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI embeddings dimension
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create similarity search function
CREATE OR REPLACE FUNCTION match_embeddings(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    embeddings.id,
    embeddings.content,
    embeddings.metadata,
    1 - (embeddings.embedding <=> query_embedding) AS similarity
  FROM embeddings
  WHERE 1 - (embeddings.embedding <=> query_embedding) > match_threshold
  ORDER BY embeddings.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 4. Create index for performance
CREATE INDEX embeddings_embedding_idx ON embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- 5. RLS policies for embeddings
ALTER TABLE embeddings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read their own embeddings"
  ON embeddings FOR SELECT
  USING (auth.uid() = (metadata->>'user_id')::UUID);

CREATE POLICY "Users can insert their own embeddings"
  ON embeddings FOR INSERT
  WITH CHECK (auth.uid() = (metadata->>'user_id')::UUID);`,

        implementation: `// pgvector Implementation with Supabase

import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// 1. Generate embeddings
async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  
  return response.data[0].embedding
}

// 2. Store document with embedding
async function storeDocument(
  content: string,
  metadata: Record<string, any> = {}
) {
  try {
    // Generate embedding
    const embedding = await generateEmbedding(content)
    
    // Store in Supabase
    const { data, error } = await supabase
      .from('embeddings')
      .insert({
        content,
        embedding,
        metadata,
      })
      .select()
      .single()
    
    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Error storing document:', error)
    throw error
  }
}

// 3. Semantic search
async function semanticSearch(
  query: string,
  options: {
    threshold?: number
    limit?: number
    filter?: Record<string, any>
  } = {}
) {
  const { threshold = 0.7, limit = 10, filter = {} } = options
  
  try {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query)
    
    // Search similar documents
    const { data, error } = await supabase.rpc('match_embeddings', {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    })
    
    if (error) throw error
    
    // Apply additional filters if needed
    if (Object.keys(filter).length > 0) {
      return data.filter(item => {
        return Object.entries(filter).every(([key, value]) => {
          return item.metadata[key] === value
        })
      })
    }
    
    return data
  } catch (error) {
    console.error('Semantic search error:', error)
    throw error
  }
}

// 4. RAG implementation
async function ragQuery(
  query: string,
  systemPrompt: string = 'You are a helpful assistant.'
) {
  try {
    // Find relevant documents
    const documents = await semanticSearch(query, {
      threshold: 0.75,
      limit: 5,
    })
    
    // Build context
    const context = documents
      .map(doc => doc.content)
      .join('\n\n---\n\n')
    
    // Generate response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: \`Context:\n\${context}\n\nQuestion: \${query}\`,
        },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })
    
    return {
      answer: completion.choices[0].message.content,
      sources: documents,
    }
  } catch (error) {
    console.error('RAG query error:', error)
    throw error
  }
}

// 5. Batch processing for efficiency
async function batchStoreDocuments(
  documents: Array<{ content: string; metadata?: any }>
) {
  const BATCH_SIZE = 100
  const results = []
  
  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE)
    
    // Generate embeddings in parallel
    const embeddings = await Promise.all(
      batch.map(doc => generateEmbedding(doc.content))
    )
    
    // Prepare insert data
    const insertData = batch.map((doc, index) => ({
      content: doc.content,
      embedding: embeddings[index],
      metadata: doc.metadata || {},
    }))
    
    // Bulk insert
    const { data, error } = await supabase
      .from('embeddings')
      .insert(insertData)
      .select()
    
    if (error) throw error
    
    results.push(...data)
  }
  
  return results
}

// 6. Update embeddings when content changes
async function updateEmbedding(
  id: string,
  newContent: string,
  newMetadata?: any
) {
  const embedding = await generateEmbedding(newContent)
  
  const { data, error } = await supabase
    .from('embeddings')
    .update({
      content: newContent,
      embedding,
      metadata: newMetadata,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) throw error
  
  return data
}`
      },

      // Row Level Security (RLS)
      'rls': {
        policies: `-- Row Level Security (RLS) Patterns for N8N MAS

-- 1. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 2. User policies
-- Users can read their own data
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own data
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 3. Multi-tenancy with organizations
-- Create organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  organization_id UUID REFERENCES organizations(id),
  user_id UUID REFERENCES auth.users(id),
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (organization_id, user_id)
);

-- Organization RLS policies
CREATE POLICY "Organization members can view"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
    )
  );

-- 4. Hierarchical permissions for agents
CREATE POLICY "Users can manage their agents"
  ON agents FOR ALL
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM organization_members om
      JOIN agents a ON a.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
      AND a.id = agents.id
    )
  );

-- 5. Workflow access control
CREATE POLICY "Workflow access based on permissions"
  ON workflows FOR SELECT
  USING (
    -- Owner can always access
    created_by = auth.uid() OR
    -- Shared workflows
    id IN (
      SELECT workflow_id FROM workflow_shares
      WHERE user_id = auth.uid()
    ) OR
    -- Organization workflows
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
    )
  );

-- 6. Time-based access control
CREATE POLICY "Temporary access to resources"
  ON shared_resources FOR SELECT
  USING (
    shared_with = auth.uid() AND
    NOW() BETWEEN valid_from AND valid_until
  );

-- 7. Role-based access with JWT claims
-- First, create a function to extract role from JWT
CREATE OR REPLACE FUNCTION auth.role()
RETURNS TEXT AS $$
  SELECT COALESCE(
    current_setting('request.jwt.claims', true)::json->>'role',
    'user'
  )
$$ LANGUAGE SQL STABLE;

-- Use in policies
CREATE POLICY "Admins can view all workflows"
  ON workflows FOR SELECT
  USING (auth.role() = 'admin');

-- 8. Complex business logic in policies
CREATE POLICY "Task assignment rules"
  ON tasks FOR INSERT
  WITH CHECK (
    -- Can only assign to agents they own
    assigned_to IN (
      SELECT id FROM agents
      WHERE created_by = auth.uid()
    ) AND
    -- Cannot assign high-priority tasks without permission
    (priority != 'high' OR auth.role() IN ('admin', 'manager'))
  );

-- 9. Audit trail with RLS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID NOT NULL,
  changes JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Only admins and the user themselves can view audit logs
CREATE POLICY "Audit log visibility"
  ON audit_logs FOR SELECT
  USING (
    user_id = auth.uid() OR
    auth.role() = 'admin'
  );`,

        implementation: `// RLS Implementation in Application Code

// 1. Service-level RLS bypass for admin operations
import { createClient } from '@supabase/supabase-js'

// Admin client bypasses RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// User client respects RLS
const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// 2. Context-aware data fetching
export async function getUserWorkflows(userId: string) {
  // This respects RLS - will only return workflows the user has access to
  const { data, error } = await supabaseClient
    .from('workflows')
    .select(\`
      *,
      organization:organizations(name),
      created_by:users(email, username)
    \`)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  
  return data
}

// 3. Organization context switching
export function useOrganizationContext() {
  const [currentOrg, setCurrentOrg] = useState<string | null>(null)
  
  // Set organization context for RLS
  const switchOrganization = async (orgId: string) => {
    const { data, error } = await supabaseClient
      .from('organization_members')
      .select('role')
      .eq('organization_id', orgId)
      .eq('user_id', (await supabaseClient.auth.getUser()).data.user?.id)
      .single()
    
    if (error) throw error
    
    // Store in session for RLS context
    await supabaseClient.rpc('set_config', {
      parameter: 'app.current_organization_id',
      value: orgId,
    })
    
    setCurrentOrg(orgId)
  }
  
  return { currentOrg, switchOrganization }
}

// 4. RLS testing utilities
export async function testRLSPolicy(
  table: string,
  operation: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE',
  asUser: string
) {
  // Create a client with specific user context
  const testClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: \`Bearer \${await generateTestToken(asUser)}\`,
        },
      },
    }
  )
  
  try {
    let result
    switch (operation) {
      case 'SELECT':
        result = await testClient.from(table).select()
        break
      case 'INSERT':
        result = await testClient.from(table).insert({ test: true })
        break
      // ... other operations
    }
    
    return { allowed: !result.error, result }
  } catch (error) {
    return { allowed: false, error }
  }
}

// 5. RLS-aware caching
const rlsCache = new Map<string, { data: any; userId: string; expires: number }>()

export async function getCachedWithRLS<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300000 // 5 minutes
): Promise<T> {
  const user = (await supabaseClient.auth.getUser()).data.user
  const cacheKey = \`\${key}:\${user?.id}\`
  
  const cached = rlsCache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  
  const data = await fetcher()
  rlsCache.set(cacheKey, {
    data,
    userId: user?.id || '',
    expires: Date.now() + ttl,
  })
  
  return data
}`
      },

      // Real-time Subscriptions
      'realtime': {
        setup: `// Supabase Real-time Setup for N8N MAS

// 1. Enable real-time for tables
-- In Supabase dashboard or via SQL
ALTER PUBLICATION supabase_realtime ADD TABLE agents;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE workflow_executions;

// 2. Real-time client setup
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

export function useRealtimeSubscription() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const channelRef = useRef<RealtimeChannel | null>(null)
  
  useEffect(() => {
    // Create channel
    const channel = supabaseClient.channel('n8n-mas-updates')
    
    // Subscribe to agent changes
    channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agents',
        },
        (payload: RealtimePostgresChangesPayload<Agent>) => {
          handleAgentChange(payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: \`assigned_to=eq.\${currentUser.id}\`,
        },
        (payload: RealtimePostgresChangesPayload<Task>) => {
          handleTaskChange(payload)
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Real-time subscription active')
        }
      })
    
    channelRef.current = channel
    
    return () => {
      channel.unsubscribe()
    }
  }, [])
  
  const handleAgentChange = (payload: RealtimePostgresChangesPayload<Agent>) => {
    switch (payload.eventType) {
      case 'INSERT':
        setAgents(prev => [...prev, payload.new])
        break
      case 'UPDATE':
        setAgents(prev => 
          prev.map(agent => 
            agent.id === payload.new.id ? payload.new : agent
          )
        )
        break
      case 'DELETE':
        setAgents(prev => 
          prev.filter(agent => agent.id !== payload.old.id)
        )
        break
    }
  }
  
  return { agents, tasks }
}

// 3. Presence (who's online)
export function usePresence(roomId: string) {
  const [presences, setPresences] = useState<any[]>([])
  
  useEffect(() => {
    const channel = supabaseClient.channel(\`presence:\${roomId}\`)
    
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        setPresences(Object.values(state).flat())
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences)
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences)
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          const user = (await supabaseClient.auth.getUser()).data.user
          await channel.track({
            user_id: user?.id,
            online_at: new Date().toISOString(),
            user_name: user?.email,
          })
        }
      })
    
    return () => {
      channel.unsubscribe()
    }
  }, [roomId])
  
  return presences
}

// 4. Broadcast (custom events)
export function useBroadcast(channelName: string) {
  const channelRef = useRef<RealtimeChannel | null>(null)
  
  useEffect(() => {
    const channel = supabaseClient.channel(channelName)
    
    channel
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        // Handle cursor position updates
        console.log('Cursor update:', payload)
      })
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        // Handle typing indicators
        console.log('User typing:', payload)
      })
      .subscribe()
    
    channelRef.current = channel
    
    return () => {
      channel.unsubscribe()
    }
  }, [channelName])
  
  const broadcast = (event: string, payload: any) => {
    channelRef.current?.send({
      type: 'broadcast',
      event,
      payload,
    })
  }
  
  return { broadcast }
}

// 5. Optimistic updates with real-time
export function useOptimisticTasks() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [optimisticTasks, setOptimisticTasks] = useState<Task[]>([])
  
  // Subscribe to real-time updates
  useEffect(() => {
    const channel = supabaseClient
      .channel('tasks-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
        },
        (payload) => {
          // Remove optimistic update when real update arrives
          setOptimisticTasks(prev => 
            prev.filter(task => task.id !== payload.new?.id)
          )
          
          // Update real tasks
          handleTaskUpdate(payload)
        }
      )
      .subscribe()
    
    return () => {
      channel.unsubscribe()
    }
  }, [])
  
  const createTask = async (task: Partial<Task>) => {
    const optimisticTask = {
      ...task,
      id: \`temp-\${Date.now()}\`,
      created_at: new Date().toISOString(),
      _optimistic: true,
    } as Task
    
    // Add optimistic task
    setOptimisticTasks(prev => [...prev, optimisticTask])
    
    try {
      const { data, error } = await supabaseClient
        .from('tasks')
        .insert(task)
        .select()
        .single()
      
      if (error) throw error
      
      // Real-time update will remove the optimistic version
      return data
    } catch (error) {
      // Remove optimistic task on error
      setOptimisticTasks(prev => 
        prev.filter(t => t.id !== optimisticTask.id)
      )
      throw error
    }
  }
  
  // Merge optimistic and real tasks
  const allTasks = [...tasks, ...optimisticTasks]
  
  return { tasks: allTasks, createTask }
}`
      },

      // Storage Operations
      'storage': {
        setup: `// Supabase Storage for N8N MAS

// 1. Create storage buckets
-- Via Supabase dashboard or SQL
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('avatars', 'avatars', true),
  ('documents', 'documents', false),
  ('workflow-assets', 'workflow-assets', false);

-- 2. Storage policies
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );`,

        implementation: `// Storage Implementation

// 1. Upload files
export async function uploadFile(
  file: File,
  bucket: string,
  path: string
) {
  try {
    const fileExt = file.name.split('.').pop()
    const fileName = \`\${Math.random()}\${Date.now()}.\${fileExt}\`
    const filePath = \`\${path}/\${fileName}\`
    
    const { data, error } = await supabaseClient.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
      })
    
    if (error) throw error
    
    // Get public URL if bucket is public
    const { data: { publicUrl } } = supabaseClient.storage
      .from(bucket)
      .getPublicUrl(filePath)
    
    return { path: data.path, url: publicUrl }
  } catch (error) {
    console.error('Upload error:', error)
    throw error
  }
}

// 2. Upload with progress tracking
export function useFileUpload() {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  
  const upload = async (file: File, bucket: string, path: string) => {
    setUploading(true)
    setProgress(0)
    
    try {
      // For progress, we need to use XMLHttpRequest
      const formData = new FormData()
      formData.append('file', file)
      
      const fileName = \`\${Date.now()}-\${file.name}\`
      const filePath = \`\${path}/\${fileName}\`
      
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const percentComplete = (e.loaded / e.total) * 100
            setProgress(Math.round(percentComplete))
          }
        })
        
        xhr.addEventListener('load', () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } else {
            reject(new Error(\`Upload failed: \${xhr.statusText}\`))
          }
        })
        
        xhr.addEventListener('error', () => {
          reject(new Error('Upload failed'))
        })
        
        const session = supabaseClient.auth.getSession()
        xhr.open('POST', \`\${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/\${bucket}/\${filePath}\`)
        xhr.setRequestHeader('Authorization', \`Bearer \${session.data.session?.access_token}\`)
        xhr.send(formData)
      })
    } finally {
      setUploading(false)
    }
  }
  
  return { upload, uploading, progress }
}

// 3. Image transformation
export function getOptimizedImageUrl(
  bucket: string,
  path: string,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'webp' | 'jpg' | 'png'
  } = {}
) {
  const { width, height, quality = 75, format = 'webp' } = options
  
  // Build transformation string
  const transforms = []
  if (width) transforms.push(\`width=\${width}\`)
  if (height) transforms.push(\`height=\${height}\`)
  transforms.push(\`quality=\${quality}\`)
  transforms.push(\`format=\${format}\`)
  
  const { data } = supabaseClient.storage
    .from(bucket)
    .getPublicUrl(path, {
      transform: {
        width: width,
        height: height,
        quality: quality,
      },
    })
  
  return data.publicUrl
}

// 4. Resumable uploads for large files
export class ResumableUpload {
  private chunks: Blob[] = []
  private uploadedChunks: Set<number> = new Set()
  private uploadId: string
  
  constructor(
    private file: File,
    private bucket: string,
    private path: string,
    private chunkSize: number = 5 * 1024 * 1024 // 5MB chunks
  ) {
    this.uploadId = \`\${Date.now()}-\${Math.random()}\`
    this.createChunks()
  }
  
  private createChunks() {
    const chunks = Math.ceil(this.file.size / this.chunkSize)
    for (let i = 0; i < chunks; i++) {
      const start = i * this.chunkSize
      const end = Math.min(start + this.chunkSize, this.file.size)
      this.chunks.push(this.file.slice(start, end))
    }
  }
  
  async upload(onProgress?: (progress: number) => void) {
    const totalChunks = this.chunks.length
    
    for (let i = 0; i < totalChunks; i++) {
      if (this.uploadedChunks.has(i)) continue
      
      const chunk = this.chunks[i]
      const chunkPath = \`\${this.path}/.\${this.uploadId}/chunk-\${i}\`
      
      const { error } = await supabaseClient.storage
        .from(this.bucket)
        .upload(chunkPath, chunk, {
          cacheControl: '3600',
          upsert: true,
        })
      
      if (error) throw error
      
      this.uploadedChunks.add(i)
      
      if (onProgress) {
        const progress = (this.uploadedChunks.size / totalChunks) * 100
        onProgress(progress)
      }
    }
    
    // Combine chunks on server
    await this.combineChunks()
  }
  
  private async combineChunks() {
    // This would require a server-side function to combine chunks
    const { error } = await supabaseClient.functions.invoke('combine-chunks', {
      body: {
        uploadId: this.uploadId,
        bucket: this.bucket,
        finalPath: this.path,
        totalChunks: this.chunks.length,
      },
    })
    
    if (error) throw error
  }
  
  async resume() {
    // Check which chunks are already uploaded
    const { data } = await supabaseClient.storage
      .from(this.bucket)
      .list(\`\${this.path}/.\${this.uploadId}\`)
    
    if (data) {
      data.forEach((file) => {
        const match = file.name.match(/chunk-(\d+)/)
        if (match) {
          this.uploadedChunks.add(parseInt(match[1]))
        }
      })
    }
    
    // Continue upload
    return this.upload()
  }
}

// 5. Signed URLs for private files
export async function getSignedUrl(
  bucket: string,
  path: string,
  expiresIn: number = 3600
) {
  const { data, error } = await supabaseClient.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn)
  
  if (error) throw error
  
  return data.signedUrl
}`
      },

      // Common Issues
      'commonIssues': {
        authErrors: `// Common Supabase Auth Issues and Solutions

// 1. Email not confirmed error
// Error: Email not confirmed
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})

if (error?.message?.includes('Email not confirmed')) {
  // Resend confirmation email
  const { error: resendError } = await supabase.auth.resend({
    type: 'signup',
    email,
  })
  
  if (!resendError) {
    toast.info('Confirmation email sent. Please check your inbox.')
  }
}

// 2. Invalid refresh token
// Error: Invalid Refresh Token
// Solution: Clear session and re-authenticate
if (error?.message?.includes('Invalid Refresh Token')) {
  await supabase.auth.signOut()
  router.push('/login')
}

// 3. PKCE flow issues
// For server-side auth, disable PKCE
const supabase = createClient(url, key, {
  auth: {
    flowType: 'implicit', // For server-side
    // flowType: 'pkce', // For client-side (default)
  },
})

// 4. Session not persisting
// Ensure cookies are being set correctly
// app/api/auth/callback/route.ts
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  if (code) {
    const cookieStore = await cookies()
    const supabase = createRouteHandlerClient({ 
      cookies: () => cookieStore 
    })
    
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Session exchange error:', error)
      return NextResponse.redirect(\`\${requestUrl.origin}/auth/error\`)
    }
  }
  
  return NextResponse.redirect(\`\${requestUrl.origin}/dashboard\`)
}`,

        realtimeIssues: `// Real-time Subscription Issues

// 1. Subscriptions not receiving updates
// Check if real-time is enabled for the table
-- Run in SQL editor
ALTER PUBLICATION supabase_realtime ADD TABLE your_table;

// 2. RLS blocking real-time updates
// Create policies for real-time
CREATE POLICY "Enable real-time for authenticated users"
  ON your_table
  FOR SELECT
  USING (auth.role() = 'authenticated');

// 3. Connection issues
const channel = supabase
  .channel('my-channel')
  .on('postgres_changes', { 
    event: '*', 
    schema: 'public', 
    table: 'messages' 
  }, (payload) => {
    console.log('Change:', payload)
  })
  .on('system', {}, (payload) => {
    // Handle system messages
    if (payload.message === 'SUBSCRIPTION_ERROR') {
      console.error('Subscription error:', payload)
      // Retry logic
      setTimeout(() => {
        channel.subscribe()
      }, 5000)
    }
  })
  .subscribe((status, err) => {
    if (status === 'SUBSCRIBED') {
      console.log('Connected to real-time')
    } else if (status === 'CLOSED') {
      console.log('Disconnected from real-time')
    } else if (status === 'CHANNEL_ERROR') {
      console.error('Channel error:', err)
    }
  })

// 4. Memory leaks from subscriptions
// Always cleanup subscriptions
useEffect(() => {
  const channel = supabase.channel('updates')
  
  // ... subscription setup ...
  
  return () => {
    // Critical: Remove subscription on unmount
    supabase.removeChannel(channel)
  }
}, [])

// 5. Presence not syncing
// Ensure unique user IDs
const presenceKey = \`user:\${user.id}:\${Date.now()}\`
await channel.track({
  online_at: new Date().toISOString(),
  user_id: user.id,
}, {
  presenceKey, // Unique key prevents conflicts
})`,

        performanceIssues: `// Supabase Performance Optimization

// 1. Query optimization
// ❌ Bad: Multiple queries
const user = await supabase.from('users').select().eq('id', userId).single()
const posts = await supabase.from('posts').select().eq('author_id', userId)
const profile = await supabase.from('profiles').select().eq('user_id', userId).single()

// ✅ Good: Single query with joins
const { data } = await supabase
  .from('users')
  .select(\`
    *,
    profile:profiles(*),
    posts(*)
  \`)
  .eq('id', userId)
  .single()

// 2. Pagination for large datasets
// ❌ Bad: Fetching all records
const { data } = await supabase.from('logs').select()

// ✅ Good: Cursor-based pagination
const PAGE_SIZE = 50
const { data, error, count } = await supabase
  .from('logs')
  .select('*', { count: 'exact' })
  .order('created_at', { ascending: false })
  .range(0, PAGE_SIZE - 1)

// 3. Index optimization
-- Create indexes for frequently queried columns
CREATE INDEX idx_posts_author_created 
  ON posts(author_id, created_at DESC);

CREATE INDEX idx_embeddings_metadata 
  ON embeddings USING GIN (metadata);

-- For full-text search
CREATE INDEX idx_posts_search 
  ON posts USING GIN (to_tsvector('english', title || ' ' || content));

// 4. Connection pooling with PgBouncer
// Use connection string with pooling
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!,
  {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    // Use connection pooler endpoint
    ...(process.env.NODE_ENV === 'production' && {
      global: {
        headers: {
          'x-connection-pooler': 'true',
        },
      },
    }),
  }
)

// 5. Batch operations
// ❌ Bad: Individual inserts
for (const item of items) {
  await supabase.from('items').insert(item)
}

// ✅ Good: Batch insert
const { error } = await supabase
  .from('items')
  .insert(items)

// For large batches, chunk them
const BATCH_SIZE = 1000
for (let i = 0; i < items.length; i += BATCH_SIZE) {
  const batch = items.slice(i, i + BATCH_SIZE)
  await supabase.from('items').insert(batch)
}`
      }
    };
    
    return {
      feature: feature || issue,
      solution: solutions[feature] || solutions.commonIssues,
      integration: {
        database: 'PostgreSQL with extensions',
        authentication: 'Supabase Auth with RLS',
        realtime: 'WebSocket-based subscriptions',
        storage: 'S3-compatible object storage',
        vectorDB: 'pgvector for embeddings'
      },
      bestPractices: [
        'Always enable RLS on tables with user data',
        'Use service role keys only on server-side',
        'Implement proper error handling for auth flows',
        'Clean up real-time subscriptions to prevent memory leaks',
        'Use connection pooling for production',
        'Optimize queries with proper indexes',
        'Implement caching for frequently accessed data',
        'Use signed URLs for private file access'
      ],
      resources: [
        'Supabase Docs: https://supabase.com/docs',
        'pgvector Guide: https://supabase.com/docs/guides/database/extensions/pgvector',
        'RLS Guide: https://supabase.com/docs/guides/auth/row-level-security',
        'Real-time Guide: https://supabase.com/docs/guides/realtime',
        'Storage Guide: https://supabase.com/docs/guides/storage'
      ]
    };
  }
};

module.exports = hook;