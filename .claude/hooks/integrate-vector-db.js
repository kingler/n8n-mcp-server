#!/usr/bin/env node
/**
 * /integrate-vector-db - Set up pgvector operations for RAG capabilities
 * 
 * Implements vector database operations using pgvector in Supabase/PostgreSQL
 * for RAG (Retrieval-Augmented Generation) capabilities in N8N MAS.
 */

const hook = {
  name: 'integrate-vector-db',
  description: 'Implement pgvector for RAG capabilities in N8N MAS',
  trigger: '/integrate-vector-db',
  
  async execute(context) {
    const { feature, embeddingModel, dimensions } = context.args;
    
    return {
      template: `
# Vector Database Integration: ${feature}

## pgvector Setup in PostgreSQL/Supabase

### 1. Database Schema Setup
\`\`\`sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Main embeddings table
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  content_hash VARCHAR(64) UNIQUE, -- For deduplication
  embedding vector(${dimensions || 1536}), -- OpenAI ada-002 default
  metadata JSONB DEFAULT '{}',
  
  -- Source tracking
  source_type VARCHAR(50) NOT NULL, -- 'document', 'conversation', 'workflow', 'agent_memory'
  source_id VARCHAR(255),
  source_url TEXT,
  
  -- Categorization
  category VARCHAR(100),
  tags TEXT[] DEFAULT '{}',
  
  -- Temporal data
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- For temporary embeddings
  
  -- Usage tracking
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  
  -- Quality metrics
  confidence_score FLOAT DEFAULT 1.0,
  is_verified BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX embeddings_embedding_idx ON embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX embeddings_source_idx ON embeddings(source_type, source_id);
CREATE INDEX embeddings_category_idx ON embeddings(category);
CREATE INDEX embeddings_tags_idx ON embeddings USING GIN(tags);
CREATE INDEX embeddings_metadata_idx ON embeddings USING GIN(metadata);
CREATE INDEX embeddings_created_idx ON embeddings(created_at DESC);

-- Chunked documents table
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding_id UUID REFERENCES embeddings(id) ON DELETE CASCADE,
  
  -- Chunk metadata
  start_page INTEGER,
  end_page INTEGER,
  start_char INTEGER,
  end_char INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(document_id, chunk_index)
);

-- Documents metadata table
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  source_url TEXT,
  file_path TEXT,
  file_hash VARCHAR(64),
  
  -- Document metadata
  author VARCHAR(255),
  published_date DATE,
  document_type VARCHAR(50),
  language VARCHAR(10) DEFAULT 'en',
  
  -- Processing status
  processing_status VARCHAR(50) DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  chunk_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  
  -- Versioning
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES documents(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Query history for analytics
CREATE TABLE vector_queries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_text TEXT NOT NULL,
  query_embedding vector(${dimensions || 1536}),
  
  -- Results metadata
  result_count INTEGER,
  top_similarity_score FLOAT,
  execution_time_ms INTEGER,
  
  -- User context
  user_id UUID,
  session_id VARCHAR(255),
  context JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Semantic cache table
CREATE TABLE semantic_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_hash VARCHAR(64) UNIQUE,
  query_embedding vector(${dimensions || 1536}),
  response TEXT NOT NULL,
  response_metadata JSONB DEFAULT '{}',
  
  -- Cache management
  ttl_seconds INTEGER DEFAULT 3600,
  hit_count INTEGER DEFAULT 0,
  last_hit_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
\`\`\`

### 2. Vector Search Functions
\`\`\`sql
-- Basic similarity search
CREATE OR REPLACE FUNCTION search_embeddings(
  query_embedding vector(${dimensions || 1536}),
  match_count INT DEFAULT 10,
  threshold FLOAT DEFAULT 0.7
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
    e.id,
    e.content,
    e.metadata,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings e
  WHERE 1 - (e.embedding <=> query_embedding) > threshold
    AND (e.expires_at IS NULL OR e.expires_at > NOW())
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Advanced search with filters
CREATE OR REPLACE FUNCTION search_embeddings_advanced(
  query_embedding vector(${dimensions || 1536}),
  filters JSONB DEFAULT '{}',
  match_count INT DEFAULT 10,
  threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  similarity FLOAT,
  source_type VARCHAR,
  category VARCHAR
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.content,
    e.metadata,
    1 - (e.embedding <=> query_embedding) AS similarity,
    e.source_type,
    e.category
  FROM embeddings e
  WHERE 1 - (e.embedding <=> query_embedding) > threshold
    AND (e.expires_at IS NULL OR e.expires_at > NOW())
    AND (
      (filters->>'source_type' IS NULL OR e.source_type = filters->>'source_type')
      AND (filters->>'category' IS NULL OR e.category = filters->>'category')
      AND (filters->>'tags' IS NULL OR e.tags && (filters->>'tags')::text[])
      AND (filters->>'metadata' IS NULL OR e.metadata @> (filters->>'metadata')::jsonb)
    )
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
  
  -- Update access tracking
  UPDATE embeddings
  SET access_count = access_count + 1,
      last_accessed_at = NOW()
  WHERE id IN (SELECT id FROM result_table);
END;
$$;

-- Hybrid search combining vector and full-text
CREATE OR REPLACE FUNCTION hybrid_search(
  query_text TEXT,
  query_embedding vector(${dimensions || 1536}),
  match_count INT DEFAULT 10,
  vector_weight FLOAT DEFAULT 0.7,
  text_weight FLOAT DEFAULT 0.3
)
RETURNS TABLE (
  id UUID,
  content TEXT,
  metadata JSONB,
  combined_score FLOAT,
  vector_similarity FLOAT,
  text_relevance FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH vector_results AS (
    SELECT
      e.id,
      e.content,
      e.metadata,
      1 - (e.embedding <=> query_embedding) AS vector_similarity
    FROM embeddings e
    WHERE e.expires_at IS NULL OR e.expires_at > NOW()
    ORDER BY e.embedding <=> query_embedding
    LIMIT match_count * 2
  ),
  text_results AS (
    SELECT
      e.id,
      e.content,
      e.metadata,
      ts_rank(to_tsvector('english', e.content), 
              plainto_tsquery('english', query_text)) AS text_relevance
    FROM embeddings e
    WHERE to_tsvector('english', e.content) @@ plainto_tsquery('english', query_text)
      AND (e.expires_at IS NULL OR e.expires_at > NOW())
    ORDER BY text_relevance DESC
    LIMIT match_count * 2
  )
  SELECT DISTINCT ON (COALESCE(v.id, t.id))
    COALESCE(v.id, t.id) AS id,
    COALESCE(v.content, t.content) AS content,
    COALESCE(v.metadata, t.metadata) AS metadata,
    (COALESCE(v.vector_similarity, 0) * vector_weight + 
     COALESCE(t.text_relevance, 0) * text_weight) AS combined_score,
    COALESCE(v.vector_similarity, 0) AS vector_similarity,
    COALESCE(t.text_relevance, 0) AS text_relevance
  FROM vector_results v
  FULL OUTER JOIN text_results t ON v.id = t.id
  ORDER BY combined_score DESC
  LIMIT match_count;
END;
$$;

-- Semantic cache lookup
CREATE OR REPLACE FUNCTION check_semantic_cache(
  query_embedding vector(${dimensions || 1536}),
  similarity_threshold FLOAT DEFAULT 0.95
)
RETURNS TABLE (
  id UUID,
  response TEXT,
  response_metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- First, clean expired cache entries
  DELETE FROM semantic_cache WHERE expires_at < NOW();
  
  -- Look for similar cached queries
  RETURN QUERY
  SELECT
    c.id,
    c.response,
    c.response_metadata,
    1 - (c.query_embedding <=> query_embedding) AS similarity
  FROM semantic_cache c
  WHERE 1 - (c.query_embedding <=> query_embedding) > similarity_threshold
    AND (c.expires_at IS NULL OR c.expires_at > NOW())
  ORDER BY c.query_embedding <=> query_embedding
  LIMIT 1;
  
  -- Update hit count if found
  UPDATE semantic_cache
  SET hit_count = hit_count + 1,
      last_hit_at = NOW()
  WHERE id IN (SELECT id FROM result_table);
END;
$$;
\`\`\`

## TypeScript Implementation

### 1. Vector Database Service
\`\`\`typescript
// lib/vector-db-service.ts
import { createClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import crypto from 'crypto'

export class VectorDBService {
  private supabase: ReturnType<typeof createClient>
  private openai: OpenAI
  private embeddingModel: string
  private dimensions: number
  
  constructor(
    supabaseUrl: string = process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey: string = process.env.SUPABASE_SERVICE_ROLE_KEY!,
    openaiKey: string = process.env.OPENAI_API_KEY!,
    embeddingModel: string = 'text-embedding-3-small',
    dimensions: number = 1536
  ) {
    this.supabase = createClient(supabaseUrl, supabaseKey)
    this.openai = new OpenAI({ apiKey: openaiKey })
    this.embeddingModel = embeddingModel
    this.dimensions = dimensions
  }
  
  // Generate embeddings with retry logic
  async generateEmbedding(text: string): Promise<number[]> {
    const maxRetries = 3
    let lastError: any
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await this.openai.embeddings.create({
          model: this.embeddingModel,
          input: text,
          dimensions: this.dimensions,
        })
        
        return response.data[0].embedding
      } catch (error) {
        lastError = error
        
        // Exponential backoff
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000))
        }
      }
    }
    
    throw new Error(\`Failed to generate embedding after \${maxRetries} attempts: \${lastError?.message}\`)
  }
  
  // Store document with chunking
  async storeDocument(
    content: string,
    metadata: {
      title: string
      source_url?: string
      author?: string
      document_type?: string
      [key: string]: any
    },
    options: {
      chunkSize?: number
      chunkOverlap?: number
      sourceType?: string
      category?: string
      tags?: string[]
    } = {}
  ): Promise<{ documentId: string; chunks: number }> {
    const {
      chunkSize = 1000,
      chunkOverlap = 200,
      sourceType = 'document',
      category,
      tags = [],
    } = options
    
    // Create document record
    const { data: document, error: docError } = await this.supabase
      .from('documents')
      .insert({
        title: metadata.title,
        source_url: metadata.source_url,
        author: metadata.author,
        document_type: metadata.document_type,
        file_hash: this.hashContent(content),
      })
      .select()
      .single()
    
    if (docError) throw docError
    
    // Chunk the content
    const chunks = this.chunkText(content, chunkSize, chunkOverlap)
    const chunkRecords = []
    
    // Process chunks in batches
    const batchSize = 10
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize)
      
      const embeddings = await Promise.all(
        batch.map(chunk => this.generateEmbedding(chunk.text))
      )
      
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j]
        const embedding = embeddings[j]
        
        // Store embedding
        const { data: embeddingRecord, error: embError } = await this.supabase
          .from('embeddings')
          .insert({
            content: chunk.text,
            content_hash: this.hashContent(chunk.text),
            embedding,
            metadata: {
              ...metadata,
              chunk_index: i + j,
              total_chunks: chunks.length,
            },
            source_type: sourceType,
            source_id: document.id,
            category,
            tags,
          })
          .select()
          .single()
        
        if (embError && embError.code !== '23505') { // Ignore duplicate key errors
          throw embError
        }
        
        if (embeddingRecord) {
          // Create chunk record
          chunkRecords.push({
            document_id: document.id,
            chunk_index: i + j,
            content: chunk.text,
            embedding_id: embeddingRecord.id,
            start_char: chunk.start,
            end_char: chunk.end,
          })
        }
      }
    }
    
    // Insert chunk records
    if (chunkRecords.length > 0) {
      const { error: chunkError } = await this.supabase
        .from('document_chunks')
        .insert(chunkRecords)
      
      if (chunkError) throw chunkError
    }
    
    // Update document status
    await this.supabase
      .from('documents')
      .update({
        processing_status: 'completed',
        processed_at: new Date().toISOString(),
        chunk_count: chunks.length,
        total_tokens: this.estimateTokens(content),
      })
      .eq('id', document.id)
    
    return {
      documentId: document.id,
      chunks: chunks.length,
    }
  }
  
  // Semantic search
  async search(
    query: string,
    options: {
      limit?: number
      threshold?: number
      filters?: {
        source_type?: string
        category?: string
        tags?: string[]
        metadata?: Record<string, any>
      }
      includeMetadata?: boolean
      rerank?: boolean
    } = {}
  ): Promise<SearchResult[]> {
    const {
      limit = 10,
      threshold = 0.7,
      filters = {},
      includeMetadata = true,
      rerank = false,
    } = options
    
    // Check semantic cache first
    const cachedResult = await this.checkCache(query)
    if (cachedResult) {
      return cachedResult
    }
    
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query)
    
    // Perform search
    const { data, error } = await this.supabase
      .rpc('search_embeddings_advanced', {
        query_embedding: queryEmbedding,
        filters: filters as any,
        match_count: rerank ? limit * 3 : limit,
        threshold,
      })
    
    if (error) throw error
    
    let results = data as SearchResult[]
    
    // Rerank if requested
    if (rerank && results.length > 0) {
      results = await this.rerankResults(query, results, limit)
    }
    
    // Cache the result
    await this.cacheResult(query, queryEmbedding, results)
    
    // Track query
    await this.trackQuery(query, queryEmbedding, results)
    
    return results
  }
  
  // Hybrid search combining vector and text
  async hybridSearch(
    query: string,
    options: {
      limit?: number
      vectorWeight?: number
      textWeight?: number
    } = {}
  ): Promise<HybridSearchResult[]> {
    const {
      limit = 10,
      vectorWeight = 0.7,
      textWeight = 0.3,
    } = options
    
    const queryEmbedding = await this.generateEmbedding(query)
    
    const { data, error } = await this.supabase
      .rpc('hybrid_search', {
        query_text: query,
        query_embedding: queryEmbedding,
        match_count: limit,
        vector_weight: vectorWeight,
        text_weight: textWeight,
      })
    
    if (error) throw error
    
    return data as HybridSearchResult[]
  }
  
  // Update embedding
  async updateEmbedding(
    id: string,
    content: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    const embedding = await this.generateEmbedding(content)
    
    const updateData: any = {
      content,
      content_hash: this.hashContent(content),
      embedding,
      updated_at: new Date().toISOString(),
    }
    
    if (metadata) {
      updateData.metadata = metadata
    }
    
    const { error } = await this.supabase
      .from('embeddings')
      .update(updateData)
      .eq('id', id)
    
    if (error) throw error
  }
  
  // Delete embedding
  async deleteEmbedding(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('embeddings')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
  
  // Batch operations
  async batchStoreEmbeddings(
    items: Array<{
      content: string
      metadata?: Record<string, any>
      source_type?: string
      category?: string
      tags?: string[]
    }>,
    batchSize: number = 100
  ): Promise<{ stored: number; errors: any[] }> {
    const results = { stored: 0, errors: [] as any[] }
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize)
      
      try {
        // Generate embeddings in parallel
        const embeddings = await Promise.all(
          batch.map(item => this.generateEmbedding(item.content))
        )
        
        // Prepare insert data
        const insertData = batch.map((item, index) => ({
          content: item.content,
          content_hash: this.hashContent(item.content),
          embedding: embeddings[index],
          metadata: item.metadata || {},
          source_type: item.source_type || 'general',
          category: item.category,
          tags: item.tags || [],
        }))
        
        // Batch insert
        const { data, error } = await this.supabase
          .from('embeddings')
          .insert(insertData)
          .select()
        
        if (error) {
          results.errors.push({ batch: i / batchSize, error })
        } else {
          results.stored += data.length
        }
      } catch (error) {
        results.errors.push({ batch: i / batchSize, error })
      }
    }
    
    return results
  }
  
  // Utility methods
  private chunkText(
    text: string,
    chunkSize: number,
    overlap: number
  ): Array<{ text: string; start: number; end: number }> {
    const chunks: Array<{ text: string; start: number; end: number }> = []
    let start = 0
    
    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length)
      chunks.push({
        text: text.slice(start, end),
        start,
        end,
      })
      
      start += chunkSize - overlap
    }
    
    return chunks
  }
  
  private hashContent(content: string): string {
    return crypto
      .createHash('sha256')
      .update(content)
      .digest('hex')
  }
  
  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4)
  }
  
  private async checkCache(query: string): Promise<SearchResult[] | null> {
    const queryEmbedding = await this.generateEmbedding(query)
    
    const { data, error } = await this.supabase
      .rpc('check_semantic_cache', {
        query_embedding: queryEmbedding,
        similarity_threshold: 0.95,
      })
    
    if (error || !data || data.length === 0) {
      return null
    }
    
    try {
      return JSON.parse(data[0].response) as SearchResult[]
    } catch {
      return null
    }
  }
  
  private async cacheResult(
    query: string,
    queryEmbedding: number[],
    results: SearchResult[]
  ): Promise<void> {
    const queryHash = this.hashContent(query)
    
    await this.supabase
      .from('semantic_cache')
      .upsert({
        query_hash: queryHash,
        query_embedding: queryEmbedding,
        response: JSON.stringify(results),
        response_metadata: {
          result_count: results.length,
          avg_similarity: results.reduce((sum, r) => sum + r.similarity, 0) / results.length,
        },
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour
      })
  }
  
  private async trackQuery(
    query: string,
    queryEmbedding: number[],
    results: SearchResult[]
  ): Promise<void> {
    await this.supabase
      .from('vector_queries')
      .insert({
        query_text: query,
        query_embedding: queryEmbedding,
        result_count: results.length,
        top_similarity_score: results[0]?.similarity || 0,
      })
  }
  
  private async rerankResults(
    query: string,
    results: SearchResult[],
    limit: number
  ): Promise<SearchResult[]> {
    // Implement reranking logic (e.g., using a cross-encoder model)
    // For now, just return top results
    return results.slice(0, limit)
  }
}

// Types
interface SearchResult {
  id: string
  content: string
  metadata: Record<string, any>
  similarity: number
  source_type?: string
  category?: string
}

interface HybridSearchResult extends SearchResult {
  combined_score: number
  vector_similarity: number
  text_relevance: number
}
\`\`\`

### 2. RAG Implementation
\`\`\`typescript
// lib/rag-service.ts
import { VectorDBService } from './vector-db-service'
import { ChatOpenAI } from '@langchain/openai'
import { 
  ChatPromptTemplate,
  SystemMessagePromptTemplate,
  HumanMessagePromptTemplate,
} from '@langchain/core/prompts'
import { RunnableSequence } from '@langchain/core/runnables'
import { StringOutputParser } from '@langchain/core/output_parsers'

export class RAGService {
  private vectorDB: VectorDBService
  private llm: ChatOpenAI
  
  constructor(
    vectorDB: VectorDBService,
    modelName: string = 'gpt-4-turbo-preview'
  ) {
    this.vectorDB = vectorDB
    this.llm = new ChatOpenAI({
      modelName,
      temperature: 0.7,
      maxTokens: 2000,
    })
  }
  
  // Basic RAG query
  async query(
    question: string,
    options: {
      contextLimit?: number
      systemPrompt?: string
      includeMetadata?: boolean
      filters?: any
    } = {}
  ): Promise<RAGResponse> {
    const {
      contextLimit = 5,
      systemPrompt = 'You are a helpful AI assistant. Answer questions based on the provided context.',
      includeMetadata = true,
      filters = {},
    } = options
    
    // Retrieve relevant documents
    const searchResults = await this.vectorDB.search(question, {
      limit: contextLimit,
      filters,
      includeMetadata,
    })
    
    if (searchResults.length === 0) {
      return {
        answer: "I couldn't find any relevant information to answer your question.",
        sources: [],
        confidence: 0,
      }
    }
    
    // Build context
    const context = this.buildContext(searchResults)
    
    // Create prompt
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(systemPrompt),
      HumanMessagePromptTemplate.fromTemplate(\`
Context:
{context}

Question: {question}

Please provide a comprehensive answer based on the context above. If the context doesn't contain enough information, say so.
      \`),
    ])
    
    // Create chain
    const chain = RunnableSequence.from([
      prompt,
      this.llm,
      new StringOutputParser(),
    ])
    
    // Generate answer
    const answer = await chain.invoke({
      context,
      question,
    })
    
    // Calculate confidence based on similarity scores
    const avgSimilarity = searchResults.reduce((sum, r) => sum + r.similarity, 0) / searchResults.length
    
    return {
      answer,
      sources: searchResults.map(r => ({
        id: r.id,
        content: r.content.substring(0, 200) + '...',
        metadata: r.metadata,
        similarity: r.similarity,
      })),
      confidence: avgSimilarity,
      context,
    }
  }
  
  // Conversational RAG with memory
  async conversationalQuery(
    question: string,
    conversationId: string,
    options: {
      contextLimit?: number
      includeHistory?: boolean
      maxHistoryTurns?: number
    } = {}
  ): Promise<ConversationalRAGResponse> {
    const {
      contextLimit = 5,
      includeHistory = true,
      maxHistoryTurns = 5,
    } = options
    
    // Get conversation history
    const history = includeHistory
      ? await this.getConversationHistory(conversationId, maxHistoryTurns)
      : []
    
    // Search with conversation context
    const enhancedQuery = this.enhanceQueryWithHistory(question, history)
    const searchResults = await this.vectorDB.search(enhancedQuery, {
      limit: contextLimit,
    })
    
    // Build context
    const context = this.buildContext(searchResults)
    const historyContext = this.formatHistory(history)
    
    // Create conversational prompt
    const prompt = ChatPromptTemplate.fromMessages([
      SystemMessagePromptTemplate.fromTemplate(\`
You are a helpful AI assistant engaged in a conversation. Use the provided context and conversation history to answer questions.

Conversation History:
{history}

Current Context:
{context}
      \`),
      HumanMessagePromptTemplate.fromTemplate('{question}'),
    ])
    
    // Generate answer
    const chain = RunnableSequence.from([
      prompt,
      this.llm,
      new StringOutputParser(),
    ])
    
    const answer = await chain.invoke({
      history: historyContext,
      context,
      question,
    })
    
    // Store in conversation history
    await this.storeConversationTurn(conversationId, question, answer)
    
    return {
      answer,
      sources: searchResults,
      conversationId,
      turnNumber: history.length + 1,
    }
  }
  
  // Multi-step reasoning RAG
  async multiStepQuery(
    question: string,
    options: {
      maxSteps?: number
      stepPrompt?: string
    } = {}
  ): Promise<MultiStepRAGResponse> {
    const {
      maxSteps = 3,
      stepPrompt = 'Break down the question and search for relevant information step by step.',
    } = options
    
    const steps: RAGStep[] = []
    let currentQuestion = question
    
    for (let i = 0; i < maxSteps; i++) {
      // Decompose question
      const subQuestions = await this.decomposeQuestion(currentQuestion, i + 1)
      
      // Search for each sub-question
      const stepResults = await Promise.all(
        subQuestions.map(sq => this.vectorDB.search(sq, { limit: 3 }))
      )
      
      // Synthesize step result
      const stepSynthesis = await this.synthesizeStep(
        currentQuestion,
        subQuestions,
        stepResults
      )
      
      steps.push({
        stepNumber: i + 1,
        question: currentQuestion,
        subQuestions,
        results: stepResults.flat(),
        synthesis: stepSynthesis,
      })
      
      // Check if we have enough information
      if (await this.hasEnoughInformation(question, steps)) {
        break
      }
      
      // Generate next question
      currentQuestion = await this.generateNextQuestion(question, steps)
    }
    
    // Final synthesis
    const finalAnswer = await this.synthesizeFinalAnswer(question, steps)
    
    return {
      answer: finalAnswer,
      steps,
      totalSources: steps.flatMap(s => s.results).length,
    }
  }
  
  // Agent-augmented RAG
  async agentAugmentedQuery(
    question: string,
    agentType: string,
    options: {
      agentConfig?: any
      contextLimit?: number
    } = {}
  ): Promise<AgentRAGResponse> {
    const { agentConfig = {}, contextLimit = 10 } = options
    
    // Get agent-specific context
    const agentContext = await this.getAgentContext(agentType)
    
    // Search with agent-aware filters
    const searchResults = await this.vectorDB.search(question, {
      limit: contextLimit,
      filters: {
        source_type: 'agent_memory',
        metadata: { agent_type: agentType },
      },
    })
    
    // Build specialized prompt for agent
    const agentPrompt = this.getAgentPrompt(agentType)
    
    // Generate response with agent personality
    const chain = RunnableSequence.from([
      ChatPromptTemplate.fromMessages([
        SystemMessagePromptTemplate.fromTemplate(agentPrompt),
        HumanMessagePromptTemplate.fromTemplate(\`
Agent Context:
{agentContext}

Retrieved Information:
{context}

Question: {question}

Respond in character as the {agentType} agent.
        \`),
      ]),
      this.llm,
      new StringOutputParser(),
    ])
    
    const answer = await chain.invoke({
      agentContext,
      context: this.buildContext(searchResults),
      question,
      agentType,
    })
    
    return {
      answer,
      agentType,
      sources: searchResults,
      agentMetadata: {
        personality: agentType,
        contextUsed: agentContext,
      },
    }
  }
  
  // Utility methods
  private buildContext(results: SearchResult[]): string {
    return results
      .map((r, i) => \`[Source \${i + 1}]:\n\${r.content}\n\`)
      .join('\n---\n')
  }
  
  private async decomposeQuestion(
    question: string,
    stepNumber: number
  ): Promise<string[]> {
    const prompt = \`
Given the question: "\${question}"
And considering this is step \${stepNumber} of the analysis,
Break it down into 2-3 specific sub-questions that would help answer it.

Return only the sub-questions, one per line.
    \`
    
    const response = await this.llm.invoke(prompt)
    return response.content
      .toString()
      .split('\n')
      .filter(q => q.trim().length > 0)
      .slice(0, 3)
  }
  
  private async synthesizeStep(
    question: string,
    subQuestions: string[],
    results: SearchResult[][]
  ): Promise<string> {
    const context = results
      .flat()
      .map(r => r.content)
      .join('\n\n')
    
    const prompt = \`
Original question: "\${question}"
Sub-questions explored: \${subQuestions.join(', ')}

Based on the following information:
\${context}

Provide a brief synthesis of what we learned in this step.
    \`
    
    const response = await this.llm.invoke(prompt)
    return response.content.toString()
  }
  
  private async hasEnoughInformation(
    question: string,
    steps: RAGStep[]
  ): Promise<boolean> {
    const allResults = steps.flatMap(s => s.results)
    const avgSimilarity = allResults.reduce((sum, r) => sum + r.similarity, 0) / allResults.length
    
    // Simple heuristic - can be improved
    return avgSimilarity > 0.8 || steps.length >= 2
  }
  
  private async generateNextQuestion(
    originalQuestion: string,
    steps: RAGStep[]
  ): Promise<string> {
    const stepSummaries = steps.map(s => s.synthesis).join('\n')
    
    const prompt = \`
Original question: "\${originalQuestion}"

What we've learned so far:
\${stepSummaries}

What specific information do we still need to fully answer the original question?
Generate one focused follow-up question.
    \`
    
    const response = await this.llm.invoke(prompt)
    return response.content.toString().trim()
  }
  
  private async synthesizeFinalAnswer(
    question: string,
    steps: RAGStep[]
  ): Promise<string> {
    const allContext = steps
      .map(s => \`Step \${s.stepNumber}: \${s.synthesis}\`)
      .join('\n\n')
    
    const prompt = \`
Question: "\${question}"

Based on our multi-step investigation:
\${allContext}

Provide a comprehensive answer to the original question.
    \`
    
    const response = await this.llm.invoke(prompt)
    return response.content.toString()
  }
  
  private getAgentPrompt(agentType: string): string {
    const prompts: Record<string, string> = {
      neo: 'You are Neo, the orchestrator agent. You coordinate complex workflows and manage other agents.',
      oracle: 'You are Oracle, the analyzer agent. You provide deep insights and analysis.',
      trinity: 'You are Trinity, the UX specialist. You focus on user experience and interface design.',
      morpheus: 'You are Morpheus, the backend architect. You handle system design and implementation.',
    }
    
    return prompts[agentType] || 'You are a helpful AI assistant.'
  }
  
  private async getAgentContext(agentType: string): Promise<string> {
    // Retrieve agent-specific context from database
    return \`Agent Type: \${agentType}\nSpecialties: ...\nRecent Tasks: ...\`
  }
  
  private async getConversationHistory(
    conversationId: string,
    limit: number
  ): Promise<ConversationTurn[]> {
    // Implement conversation history retrieval
    return []
  }
  
  private async storeConversationTurn(
    conversationId: string,
    question: string,
    answer: string
  ): Promise<void> {
    // Store in database and vector store for future retrieval
    await this.vectorDB.storeEmbedding(
      \`Q: \${question}\nA: \${answer}\`,
      {
        source_type: 'conversation',
        conversation_id: conversationId,
        timestamp: new Date().toISOString(),
      }
    )
  }
  
  private enhanceQueryWithHistory(
    question: string,
    history: ConversationTurn[]
  ): string {
    if (history.length === 0) return question
    
    const recentContext = history
      .slice(-3)
      .map(turn => \`Q: \${turn.question}\nA: \${turn.answer}\`)
      .join('\n')
    
    return \`Given the conversation:\n\${recentContext}\n\nCurrent question: \${question}\`
  }
  
  private formatHistory(history: ConversationTurn[]): string {
    return history
      .map(turn => \`Human: \${turn.question}\nAssistant: \${turn.answer}\`)
      .join('\n\n')
  }
}

// Types
interface RAGResponse {
  answer: string
  sources: Array<{
    id: string
    content: string
    metadata: Record<string, any>
    similarity: number
  }>
  confidence: number
  context?: string
}

interface ConversationalRAGResponse {
  answer: string
  sources: SearchResult[]
  conversationId: string
  turnNumber: number
}

interface RAGStep {
  stepNumber: number
  question: string
  subQuestions: string[]
  results: SearchResult[]
  synthesis: string
}

interface MultiStepRAGResponse {
  answer: string
  steps: RAGStep[]
  totalSources: number
}

interface AgentRAGResponse {
  answer: string
  agentType: string
  sources: SearchResult[]
  agentMetadata: {
    personality: string
    contextUsed: string
  }
}

interface ConversationTurn {
  question: string
  answer: string
  timestamp: Date
}
\`\`\`

## Integration with N8N Workflows

### Vector Operations Node
\`\`\`typescript
// custom-nodes/VectorOperations/VectorOperations.node.ts
import {
  IExecuteFunctions,
  INodeExecutionData,
  INodeType,
  INodeTypeDescription,
} from 'n8n-workflow'

export class VectorOperations implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Vector Operations',
    name: 'vectorOperations',
    icon: 'fa:vector-square',
    group: ['transform'],
    version: 1,
    subtitle: '={{$parameter["operation"]}}',
    description: 'Perform vector database operations for RAG',
    defaults: {
      name: 'Vector Operations',
    },
    inputs: ['main'],
    outputs: ['main'],
    credentials: [
      {
        name: 'supabaseApi',
        required: true,
      },
      {
        name: 'openAiApi',
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
            name: 'Store Document',
            value: 'storeDocument',
            description: 'Store document with embeddings',
          },
          {
            name: 'Search',
            value: 'search',
            description: 'Semantic search in vector database',
          },
          {
            name: 'RAG Query',
            value: 'ragQuery',
            description: 'Retrieval-augmented generation query',
          },
          {
            name: 'Update Embedding',
            value: 'updateEmbedding',
            description: 'Update existing embedding',
          },
          {
            name: 'Delete Embedding',
            value: 'deleteEmbedding',
            description: 'Delete embedding from database',
          },
        ],
        default: 'search',
      },
      // Additional properties for each operation...
    ],
  }
  
  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    const items = this.getInputData()
    const returnData: INodeExecutionData[] = []
    
    const credentials = {
      supabase: await this.getCredentials('supabaseApi'),
      openai: await this.getCredentials('openAiApi'),
    }
    
    const vectorDB = new VectorDBService(
      credentials.supabase.url as string,
      credentials.supabase.serviceKey as string,
      credentials.openai.apiKey as string
    )
    
    const operation = this.getNodeParameter('operation', 0) as string
    
    for (let i = 0; i < items.length; i++) {
      try {
        let result: any
        
        switch (operation) {
          case 'storeDocument':
            const content = this.getNodeParameter('content', i) as string
            const metadata = this.getNodeParameter('metadata', i) as any
            
            result = await vectorDB.storeDocument(content, metadata)
            break
            
          case 'search':
            const query = this.getNodeParameter('query', i) as string
            const searchOptions = this.getNodeParameter('options', i) as any
            
            result = await vectorDB.search(query, searchOptions)
            break
            
          case 'ragQuery':
            const ragService = new RAGService(vectorDB)
            const question = this.getNodeParameter('question', i) as string
            const ragOptions = this.getNodeParameter('ragOptions', i) as any
            
            result = await ragService.query(question, ragOptions)
            break
            
          // ... other operations
        }
        
        returnData.push({
          json: result,
          pairedItem: { item: i },
        })
      } catch (error) {
        if (this.continueOnFail()) {
          returnData.push({
            json: { error: error.message },
            pairedItem: { item: i },
          })
        } else {
          throw error
        }
      }
    }
    
    return [returnData]
  }
}
\`\`\`

## Performance Optimization

### 1. Indexing Strategies
\`\`\`sql
-- Optimize vector searches with proper indexing
-- IVFFlat index (faster, less accurate)
CREATE INDEX embeddings_ivfflat_idx ON embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- HNSW index (slower to build, more accurate)
CREATE INDEX embeddings_hnsw_idx ON embeddings 
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Partial indexes for filtered searches
CREATE INDEX embeddings_active_idx ON embeddings 
  USING ivfflat (embedding vector_cosine_ops)
  WHERE expires_at IS NULL OR expires_at > NOW();

-- Composite indexes for common query patterns
CREATE INDEX embeddings_category_date_idx 
  ON embeddings(category, created_at DESC)
  WHERE expires_at IS NULL;
\`\`\`

### 2. Query Optimization
\`\`\`typescript
// Optimized batch search
async function batchSearch(
  queries: string[],
  options: SearchOptions = {}
): Promise<SearchResult[][]> {
  // Generate embeddings in parallel
  const embeddings = await Promise.all(
    queries.map(q => this.generateEmbedding(q))
  )
  
  // Execute searches in parallel with connection pooling
  const searchPromises = embeddings.map((embedding, index) =>
    this.supabase.rpc('search_embeddings', {
      query_embedding: embedding,
      match_count: options.limit || 10,
      threshold: options.threshold || 0.7,
    })
  )
  
  const results = await Promise.all(searchPromises)
  
  return results.map(r => r.data || [])
}

// Streaming search results
async function* streamSearch(
  query: string,
  options: StreamSearchOptions = {}
): AsyncGenerator<SearchResult, void, unknown> {
  const { batchSize = 10, maxResults = 100 } = options
  const embedding = await this.generateEmbedding(query)
  
  let offset = 0
  let hasMore = true
  
  while (hasMore && offset < maxResults) {
    const { data, error } = await this.supabase
      .rpc('search_embeddings', {
        query_embedding: embedding,
        match_count: batchSize,
        threshold: options.threshold || 0.7,
        offset,
      })
    
    if (error) throw error
    
    if (!data || data.length === 0) {
      hasMore = false
      break
    }
    
    for (const result of data) {
      yield result
    }
    
    offset += batchSize
    
    if (data.length < batchSize) {
      hasMore = false
    }
  }
}
\`\`\`

## Monitoring and Analytics

\`\`\`typescript
// lib/vector-db-analytics.ts
export class VectorDBAnalytics {
  async getSearchMetrics(timeRange: { start: Date; end: Date }) {
    const { data, error } = await this.supabase
      .from('vector_queries')
      .select('*')
      .gte('created_at', timeRange.start.toISOString())
      .lte('created_at', timeRange.end.toISOString())
    
    if (error) throw error
    
    return {
      totalQueries: data.length,
      avgResponseTime: this.calculateAvgResponseTime(data),
      topQueries: this.getTopQueries(data),
      similarityDistribution: this.getSimilarityDistribution(data),
      queryVolume: this.getQueryVolume(data),
    }
  }
  
  async getEmbeddingStats() {
    const { data, error } = await this.supabase
      .from('embeddings')
      .select('source_type, category, created_at')
    
    if (error) throw error
    
    return {
      totalEmbeddings: data.length,
      bySourceType: this.groupBy(data, 'source_type'),
      byCategory: this.groupBy(data, 'category'),
      growthRate: this.calculateGrowthRate(data),
    }
  }
  
  async getCachePerformance() {
    const { data, error } = await this.supabase
      .from('semantic_cache')
      .select('hit_count, created_at, last_hit_at')
    
    if (error) throw error
    
    const totalHits = data.reduce((sum, item) => sum + item.hit_count, 0)
    const cacheSize = data.length
    
    return {
      hitRate: (totalHits / (totalHits + cacheSize)) * 100,
      avgHitsPerEntry: totalHits / cacheSize,
      cacheEfficiency: this.calculateCacheEfficiency(data),
    }
  }
  
  private calculateAvgResponseTime(queries: any[]): number {
    const total = queries.reduce((sum, q) => sum + (q.execution_time_ms || 0), 0)
    return total / queries.length
  }
  
  private getTopQueries(queries: any[], limit = 10): any[] {
    const queryMap = new Map<string, number>()
    
    queries.forEach(q => {
      const count = queryMap.get(q.query_text) || 0
      queryMap.set(q.query_text, count + 1)
    })
    
    return Array.from(queryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([query, count]) => ({ query, count }))
  }
  
  private getSimilarityDistribution(queries: any[]): Record<string, number> {
    const buckets = {
      '0.9-1.0': 0,
      '0.8-0.9': 0,
      '0.7-0.8': 0,
      '< 0.7': 0,
    }
    
    queries.forEach(q => {
      const score = q.top_similarity_score || 0
      if (score >= 0.9) buckets['0.9-1.0']++
      else if (score >= 0.8) buckets['0.8-0.9']++
      else if (score >= 0.7) buckets['0.7-0.8']++
      else buckets['< 0.7']++
    })
    
    return buckets
  }
  
  private groupBy<T>(items: T[], key: keyof T): Record<string, number> {
    return items.reduce((acc, item) => {
      const value = String(item[key])
      acc[value] = (acc[value] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }
  
  private calculateGrowthRate(items: any[]): number {
    const sorted = items.sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
    
    if (sorted.length < 2) return 0
    
    const firstDate = new Date(sorted[0].created_at)
    const lastDate = new Date(sorted[sorted.length - 1].created_at)
    const daysDiff = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    
    return sorted.length / daysDiff
  }
  
  private calculateCacheEfficiency(cacheData: any[]): number {
    const now = Date.now()
    let totalValue = 0
    
    cacheData.forEach(item => {
      const age = now - new Date(item.created_at).getTime()
      const lastHit = item.last_hit_at ? now - new Date(item.last_hit_at).getTime() : age
      const value = item.hit_count / (lastHit / 3600000) // Hits per hour
      totalValue += value
    })
    
    return totalValue / cacheData.length
  }
}
\`\`\`
`,
      integrationStrategies: {
        embedding: 'OpenAI/Cohere/Custom embeddings',
        storage: 'pgvector in PostgreSQL/Supabase',
        search: 'Similarity and hybrid search',
        rag: 'Retrieval-augmented generation',
        caching: 'Semantic result caching',
        analytics: 'Search metrics and optimization'
      },
      bestPractices: [
        'Use appropriate embedding dimensions for your use case',
        'Implement proper chunking strategies for documents',
        'Index vectors appropriately for query patterns',
        'Cache frequently accessed embeddings',
        'Monitor search performance and optimize indexes',
        'Implement hybrid search for better results',
        'Use metadata filters to improve relevance',
        'Batch operations for better performance'
      ],
      resources: [
        'pgvector Docs: https://github.com/pgvector/pgvector',
        'Supabase Vector Docs: https://supabase.com/docs/guides/database/extensions/pgvector',
        'OpenAI Embeddings: https://platform.openai.com/docs/guides/embeddings',
        'LangChain RAG: https://python.langchain.com/docs/use_cases/question_answering',
        'Vector Search Best Practices: https://www.pinecone.io/learn/vector-search-best-practices/'
      ]
    };
  }
};

module.exports = hook;