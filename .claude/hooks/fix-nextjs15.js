#!/usr/bin/env node
/**
 * /fix-nextjs15 - Handle Next.js 15.4 App Router and Server Component issues
 * 
 * Addresses Next.js 15.4 specific issues including App Router patterns,
 * Server Components, Server Actions, and performance optimizations.
 */

const hook = {
  name: 'fix-nextjs15',
  description: 'Resolve Next.js 15.4 App Router, Server Components, and performance issues',
  trigger: '/fix-nextjs15',
  
  async execute(context) {
    const { error, component, issue } = context.args;
    
    const solutions = {
      // Server Component Issues
      'serverComponents': {
        asyncComponents: `// Next.js 15.4 - Async Server Components
// ✅ Correct pattern
export default async function Page() {
  const data = await fetchData(); // Direct async/await
  
  return (
    <main>
      <h1>{data.title}</h1>
      <ClientComponent initialData={data} />
    </main>
  );
}

// ❌ Common mistakes
// 1. Don't use 'use client' for data fetching
// 2. Don't use hooks in Server Components
// 3. Don't pass functions as props to Client Components`,

        dataFetching: `// Next.js 15.4 Data Fetching Patterns

// 1. Parallel Data Fetching
export default async function Page() {
  // Initiate both requests in parallel
  const userData = fetchUser();
  const postsData = fetchPosts();
  
  // Wait for both promises
  const [user, posts] = await Promise.all([userData, postsData]);
  
  return <Dashboard user={user} posts={posts} />;
}

// 2. Sequential When Dependent
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // params is now a Promise in Next.js 15
  const user = await fetchUser(id);
  const posts = await fetchUserPosts(user.id);
  
  return <UserProfile user={user} posts={posts} />;
}

// 3. Streaming with Suspense
import { Suspense } from 'react';

export default async function Page() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<UserSkeleton />}>
        <UserData />
      </Suspense>
      <Suspense fallback={<PostsSkeleton />}>
        <PostsList />
      </Suspense>
    </div>
  );
}`,

        hydrationErrors: `// Fixing Hydration Mismatches

// ❌ Problem: Dynamic content causes mismatch
function BadComponent() {
  return <div>{new Date().toLocaleString()}</div>;
}

// ✅ Solution 1: Use useEffect for client-only content
'use client';
import { useEffect, useState } from 'react';

function GoodComponent() {
  const [date, setDate] = useState<string>('');
  
  useEffect(() => {
    setDate(new Date().toLocaleString());
  }, []);
  
  return <div>{date}</div>;
}

// ✅ Solution 2: Use suppressHydrationWarning for intentional differences
function TimeComponent() {
  return (
    <time suppressHydrationWarning>
      {new Date().toLocaleString()}
    </time>
  );
}

// ✅ Solution 3: Ensure consistent server/client rendering
import { headers } from 'next/headers';

export default async function Page() {
  const headersList = await headers();
  const userAgent = headersList.get('user-agent');
  
  // Pass server data to client
  return <ClientComponent serverUserAgent={userAgent} />;
}`
      },

      // App Router Patterns
      'appRouter': {
        routeHandlers: `// Next.js 15.4 Route Handlers (app/api/route.ts)

import { NextRequest, NextResponse } from 'next/server';

// GET handler
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');
  
  // Add proper caching headers
  return NextResponse.json(
    { data: 'response' },
    { 
      status: 200,
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate'
      }
    }
  );
}

// POST handler with body parsing
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate with zod
    const validated = schema.parse(body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}

// Dynamic route handler (app/api/users/[id]/route.ts)
interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: Params) {
  const { id } = await params; // params is a Promise in Next.js 15
  
  const user = await prisma.user.findUnique({
    where: { id }
  });
  
  if (!user) {
    return NextResponse.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }
  
  return NextResponse.json(user);
}`,

        layouts: `// Next.js 15.4 Nested Layouts

// app/layout.tsx - Root Layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}

// app/(dashboard)/layout.tsx - Route Group Layout
export default async function DashboardLayout({
  children,
  modal, // Parallel route slot
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  const session = await getSession();
  
  if (!session) {
    redirect('/login');
  }
  
  return (
    <div className="dashboard">
      <Sidebar />
      <main>{children}</main>
      {modal}
    </div>
  );
}

// app/(dashboard)/settings/layout.tsx - Nested Layout
export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="settings-container">
      <SettingsNav />
      <div className="settings-content">
        {children}
      </div>
    </div>
  );
}`,

        parallelRoutes: `// Next.js 15.4 Parallel Routes

// app/dashboard/@analytics/page.tsx
export default async function Analytics() {
  const data = await fetchAnalytics();
  return <AnalyticsChart data={data} />;
}

// app/dashboard/@team/page.tsx
export default async function Team() {
  const members = await fetchTeam();
  return <TeamList members={members} />;
}

// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <div className="dashboard-grid">
      <div className="main">{children}</div>
      <div className="analytics">{analytics}</div>
      <div className="team">{team}</div>
    </div>
  );
}

// Conditional rendering of slots
export default function Layout({
  children,
  admin,
}: {
  children: React.ReactNode;
  admin: React.ReactNode;
}) {
  const isAdmin = useIsAdmin();
  
  return (
    <>
      {children}
      {isAdmin && admin}
    </>
  );
}`,

        interceptingRoutes: `// Next.js 15.4 Intercepting Routes

// app/(.)photos/[id]/page.tsx - Intercept photo route
import { Modal } from '@/components/modal';

export default async function PhotoModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const photo = await getPhoto(id);
  
  return (
    <Modal>
      <PhotoView photo={photo} />
    </Modal>
  );
}

// app/photos/[id]/page.tsx - Full page view
export default async function PhotoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const photo = await getPhoto(id);
  
  return (
    <main>
      <PhotoView photo={photo} fullPage />
    </main>
  );
}`
      },

      // Server Actions
      'serverActions': {
        formActions: `// Next.js 15.4 Server Actions

// app/actions/user.ts
'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const updateUserSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

export async function updateUser(prevState: any, formData: FormData) {
  try {
    // Validate input
    const validatedFields = updateUserSchema.parse({
      name: formData.get('name'),
      email: formData.get('email'),
    });
    
    // Update in database
    const user = await prisma.user.update({
      where: { id: prevState.userId },
      data: validatedFields,
    });
    
    // Revalidate cache
    revalidatePath('/dashboard/profile');
    revalidateTag('user');
    
    return { success: true, user };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error.flatten().fieldErrors };
    }
    return { success: false, error: 'Failed to update user' };
  }
}

// Using with forms
'use client';
import { useActionState } from 'react';

export function UserForm({ userId }: { userId: string }) {
  const [state, action, isPending] = useActionState(
    updateUser,
    { userId }
  );
  
  return (
    <form action={action}>
      <input name="name" defaultValue={state.user?.name} />
      <input name="email" defaultValue={state.user?.email} />
      {state.errors?.name && <p>{state.errors.name}</p>}
      {state.errors?.email && <p>{state.errors.email}</p>}
      <button disabled={isPending}>
        {isPending ? 'Saving...' : 'Save'}
      </button>
    </form>
  );
}`,

        optimisticUpdates: `// Optimistic Updates with Server Actions

'use client';
import { useOptimistic } from 'react';

export function TodoList({ todos }: { todos: Todo[] }) {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (state, newTodo: Todo) => [...state, newTodo]
  );
  
  async function createTodo(formData: FormData) {
    const newTodo = {
      id: Math.random().toString(),
      text: formData.get('text') as string,
      completed: false,
      pending: true,
    };
    
    // Optimistically add todo
    addOptimisticTodo(newTodo);
    
    // Call server action
    await createTodoAction(formData);
  }
  
  return (
    <>
      <form action={createTodo}>
        <input name="text" />
        <button>Add Todo</button>
      </form>
      <ul>
        {optimisticTodos.map(todo => (
          <li key={todo.id} className={todo.pending ? 'opacity-50' : ''}>
            {todo.text}
          </li>
        ))}
      </ul>
    </>
  );
}`
      },

      // Performance Optimizations
      'performance': {
        imageOptimization: `// Next.js 15.4 Image Optimization

import Image from 'next/image';

// Basic responsive image
export function ResponsiveImage() {
  return (
    <Image
      src="/hero.jpg"
      alt="Hero image"
      width={1200}
      height={600}
      priority // Load eagerly for above-fold images
      placeholder="blur" // Requires static import
      blurDataURL={shimmer(1200, 600)} // Custom blur
      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      className="rounded-lg"
    />
  );
}

// Generate blur placeholder
function shimmer(w: number, h: number) {
  return \`data:image/svg+xml;base64,\${toBase64(
    \`<svg width="\${w}" height="\${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="g">
          <stop stop-color="#333" offset="20%" />
          <stop stop-color="#222" offset="50%" />
          <stop stop-color="#333" offset="70%" />
        </linearGradient>
      </defs>
      <rect width="\${w}" height="\${h}" fill="#333" />
      <rect id="r" width="\${w}" height="\${h}" fill="url(#g)" />
      <animate attributeName="x" from="-\${w}" to="\${w}" dur="1s" repeatCount="indefinite" />
    </svg>\`
  )}\`;
}

// External images with loader
export function ExternalImage({ src }: { src: string }) {
  return (
    <Image
      loader={({ src, width, quality }) => {
        return \`https://example.com/\${src}?w=\${width}&q=\${quality || 75}\`;
      }}
      src={src}
      alt="External image"
      width={800}
      height={400}
      unoptimized={process.env.NODE_ENV === 'development'}
    />
  );
}`,

        fontOptimization: `// Next.js 15.4 Font Optimization

import { Inter, Roboto_Mono } from 'next/font/google';
import localFont from 'next/font/local';

// Google Fonts with variable font
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

// Local custom font
const customFont = localFont({
  src: [
    {
      path: './fonts/Custom-Regular.woff2',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Custom-Bold.woff2',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-custom',
  display: 'swap',
});

// Apply to layout
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={\`\${inter.variable} \${customFont.variable}\`}>
      <body className="font-inter">
        {children}
      </body>
    </html>
  );
}

// Use in CSS
const styles = \`
  .heading {
    font-family: var(--font-custom);
  }
  
  body {
    font-family: var(--font-inter);
  }
\`;`,

        bundleOptimization: `// Next.js 15.4 Bundle Optimization

// next.config.js
module.exports = {
  // Optimize bundle size
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Module transpilation
  transpilePackages: ['@n8n-mas/ui-components'],
  
  // Webpack optimization
  webpack: (config, { isServer }) => {
    // Tree shaking
    config.optimization.sideEffects = false;
    
    // Split chunks
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          default: false,
          vendors: false,
          framework: {
            name: 'framework',
            chunks: 'all',
            test: /(?<!node_modules.*)[\\\\/]node_modules[\\\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\\\/]/,
            priority: 40,
          },
          lib: {
            test(module) {
              return module.size() > 160000;
            },
            name(module) {
              const hash = crypto.createHash('sha1');
              hash.update(module.identifier());
              return hash.digest('hex').substring(0, 8);
            },
            priority: 30,
            minChunks: 1,
            reuseExistingChunk: true,
          },
          commons: {
            name: 'commons',
            chunks: 'all',
            minChunks: 2,
            priority: 20,
          },
          shared: {
            name(module, chunks) {
              return crypto
                .createHash('sha1')
                .update(chunks.reduce((acc, chunk) => acc + chunk.name, ''))
                .digest('hex');
            },
            priority: 10,
            minChunks: 2,
            reuseExistingChunk: true,
          },
        },
      };
    }
    
    return config;
  },
};

// Dynamic imports for code splitting
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false, // Disable SSR for client-only components
});`,

        caching: `// Next.js 15.4 Caching Strategies

// 1. Static Generation with ISR
export const revalidate = 3600; // Revalidate every hour

export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    next: { revalidate: 3600 }
  });
  
  return <Component data={data} />;
}

// 2. Dynamic with cache
export const dynamic = 'force-dynamic';

export default async function Page() {
  const data = await fetch('https://api.example.com/data', {
    cache: 'force-cache', // Cache indefinitely
    next: { tags: ['api-data'] } // For targeted revalidation
  });
  
  return <Component data={data} />;
}

// 3. Partial Prerendering (PPR)
export const experimental_ppr = true;

export default async function Page() {
  return (
    <div>
      <StaticHeader /> {/* Prerendered */}
      <Suspense fallback={<Loading />}>
        <DynamicContent /> {/* Streamed */}
      </Suspense>
    </div>
  );
}

// 4. Cache revalidation
import { revalidatePath, revalidateTag } from 'next/cache';

export async function updateData() {
  'use server';
  
  // Update data
  await db.update(data);
  
  // Revalidate specific path
  revalidatePath('/dashboard');
  
  // Or revalidate by tag
  revalidateTag('api-data');
}`
      },

      // Common Errors and Fixes
      'commonErrors': {
        'useClientDirective': `// 'use client' directive issues

// ❌ Error: Can't use hooks in Server Components
export default function Page() {
  const [state, setState] = useState(); // Error!
  return <div>{state}</div>;
}

// ✅ Fix: Add 'use client' directive
'use client';
import { useState } from 'react';

export default function Page() {
  const [state, setState] = useState();
  return <div>{state}</div>;
}

// ✅ Better: Split into Server and Client Components
// ServerComponent.tsx (no 'use client')
export default async function ServerComponent() {
  const data = await fetchData();
  return <ClientComponent initialData={data} />;
}

// ClientComponent.tsx
'use client';
export function ClientComponent({ initialData }) {
  const [data, setData] = useState(initialData);
  return <div>{data}</div>;
}`,

        'metadataErrors': `// Metadata export issues

// ❌ Error: Can't export metadata from Client Component
'use client';
export const metadata = { title: 'Page' }; // Error!

// ✅ Fix: Metadata only in Server Components
// Remove 'use client' for pages with metadata
export const metadata = {
  title: 'Page Title',
  description: 'Page description',
};

// ✅ Dynamic metadata
export async function generateMetadata({ params }) {
  const { id } = await params;
  const post = await getPost(id);
  
  return {
    title: post.title,
    openGraph: {
      images: [post.image],
    },
  };
}`,

        'middlewareErrors': `// Next.js 15.4 Middleware issues

// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // ❌ Error: Can't use Node.js APIs
  // const fs = require('fs'); // Error!
  
  // ✅ Use Edge Runtime compatible APIs
  const token = request.cookies.get('token');
  
  if (!token && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // Clone and modify headers
  const response = NextResponse.next();
  response.headers.set('x-custom-header', 'value');
  
  return response;
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};`
      }
    };
    
    return {
      issue: issue || error,
      solution: solutions[issue] || solutions.commonErrors,
      diagnostics: {
        nextVersion: '15.4',
        appRouter: true,
        turbopack: 'stable',
        serverComponents: 'default'
      },
      bestPractices: [
        'Use Server Components by default, Client Components only when needed',
        'Implement proper error boundaries and loading states',
        'Leverage Suspense for streaming SSR',
        'Use Server Actions for forms and mutations',
        'Optimize images and fonts with Next.js built-in components',
        'Implement proper caching strategies with ISR and on-demand revalidation',
        'Split code with dynamic imports for better performance'
      ],
      resources: [
        'Next.js 15 Docs: https://nextjs.org/docs',
        'App Router Migration: https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration',
        'Server Components: https://nextjs.org/docs/app/building-your-application/rendering/server-components',
        'Performance: https://nextjs.org/docs/app/building-your-application/optimizing'
      ]
    };
  }
};

module.exports = hook;