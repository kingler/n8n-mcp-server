#!/usr/bin/env node
/**
 * /fix-typescript - Resolve TypeScript 5.9.2 specific errors and type issues
 * 
 * Addresses common TypeScript errors, type inference problems, and 
 * configuration issues specific to TypeScript 5.9.2 in the N8N MAS project.
 */

const hook = {
  name: 'fix-typescript',
  description: 'Fix TypeScript 5.9.2 errors and type issues in N8N MAS',
  trigger: '/fix-typescript',
  
  async execute(context) {
    const { error, file, line } = context.args;
    
    const fixes = {
      // TypeScript 5.9.2 specific errors
      'TS2532': {
        error: 'Object is possibly undefined',
        solutions: [
          {
            pattern: 'object.property',
            fix: 'object?.property',
            explanation: 'Use optional chaining for potentially undefined objects'
          },
          {
            pattern: 'array[index]',
            fix: 'array[index]!',
            explanation: 'Use non-null assertion if you\'re certain the value exists'
          },
          {
            pattern: 'if (value) { value.method() }',
            fix: 'value?.method()',
            explanation: 'Simplify with optional chaining'
          }
        ]
      },
      
      'TS2345': {
        error: 'Argument of type X is not assignable to parameter of type Y',
        solutions: [
          {
            context: 'Prisma types',
            example: `// Common with Prisma v6.13.0
// Problem:
const user = await prisma.user.create({
  data: userData // Type error
});

// Solution 1: Use Prisma.UserCreateInput
import { Prisma } from '@prisma/client';
const userData: Prisma.UserCreateInput = {
  email: 'user@example.com',
  name: 'User Name'
};

// Solution 2: Use satisfies operator (TS 4.9+)
const userData = {
  email: 'user@example.com',
  name: 'User Name'
} satisfies Prisma.UserCreateInput;`,
          },
          {
            context: 'React Server Components',
            example: `// Next.js 15.4 Server Component types
// Problem:
async function ServerComponent({ params }) { // Missing types

// Solution:
interface PageProps {
  params: Promise<{ id: string }>; // Note: params is now a Promise in Next.js 15
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params; // Await the promise
  const query = await searchParams;
}`
          }
        ]
      },
      
      'TS2339': {
        error: 'Property does not exist on type',
        solutions: [
          {
            context: 'Module augmentation',
            example: `// Extend existing types
// Create types/global.d.ts
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      DATABASE_URL: string;
      NEXT_PUBLIC_API_URL: string;
      JWT_SECRET: string;
    }
  }
}

// For Next.js augmentation
declare module 'next' {
  export interface Metadata {
    customProperty?: string;
  }
}`
          },
          {
            context: 'Type guards',
            example: `// Type guard for discriminated unions
type AgentMessage = 
  | { type: 'task'; payload: TaskPayload }
  | { type: 'result'; payload: ResultPayload };

function isTaskMessage(msg: AgentMessage): msg is { type: 'task'; payload: TaskPayload } {
  return msg.type === 'task';
}

// Usage
if (isTaskMessage(message)) {
  // TypeScript knows message.payload is TaskPayload
  console.log(message.payload.taskId);
}`
          }
        ]
      },
      
      'TS1005': {
        error: 'Expected comma or semicolon',
        solutions: [
          {
            context: 'Type assertions',
            example: `// Incorrect as const assertion
const config = {
  api: process.env.API_URL
} as const; // TS1005 in some contexts

// Correct usage
const config = {
  api: process.env.API_URL
} as const satisfies Config;

// Or with proper typing
const config: Config = {
  api: process.env.API_URL!
};`
          }
        ]
      },
      
      'TS2786': {
        error: 'X cannot be used as a JSX component',
        solutions: [
          {
            context: 'React 18 types with TypeScript 5.9',
            example: `// Update React types
// package.json
{
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0"
  }
}

// For async Server Components
export default async function AsyncComponent(): Promise<React.ReactElement> {
  const data = await fetchData();
  return <div>{data}</div>;
}

// For components with children
interface Props {
  children: React.ReactNode; // Not React.FC anymore
}

export function Component({ children }: Props) {
  return <div>{children}</div>;
}`
          }
        ]
      },
      
      'TS2688': {
        error: 'Cannot find type definition file',
        solutions: [
          {
            context: 'Missing @types packages',
            example: `// Check and install missing types
npm install --save-dev @types/node @types/react @types/react-dom

// For packages without types, create declarations
// types/untyped-module.d.ts
declare module 'untyped-package' {
  export function someFunction(): void;
  export interface SomeInterface {
    property: string;
  }
}

// Or use any as last resort
declare module 'untyped-package';`
          }
        ]
      },
      
      // TypeScript 5.9.2 specific features
      'configurationIssues': {
        tsconfig: `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "jsx": "preserve",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "allowJs": true,
    "noEmit": true,
    "incremental": true,
    "isolatedModules": true,
    
    // TypeScript 5.9 features
    "verbatimModuleSyntax": true,
    "allowArbitraryExtensions": true,
    "customConditions": ["worker", "browser"],
    
    // Monorepo paths
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@n8n-mas/*": ["./packages/*/src"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules", "dist", ".next"]
}`,
        nextConfig: `// next.config.ts with TypeScript 5.9
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  typescript: {
    // Use project's TypeScript version
    ignoreBuildErrors: false,
  },
  experimental: {
    // TypeScript 5.9 decorators support
    decorators: true,
    // For monorepo
    externalDir: true,
  }
};

export default nextConfig;`
      },
      
      // Advanced type patterns
      'advancedPatterns': {
        templateLiterals: `// TypeScript 5.9 template literal types
type Route = \`/\${string}\`;
type APIRoute = \`/api/\${string}\`;
type AgentAction = \`agent.\${string}.\${string}\`;

// Uppercase/Lowercase/Capitalize/Uncapitalize
type EventName<T extends string> = \`on\${Capitalize<T>}\`;
type Handler = EventName<'click' | 'change'>; // 'onClick' | 'onChange'`,
        
        satisfiesOperator: `// Use satisfies for better type inference (TS 4.9+)
const config = {
  api: {
    url: process.env.API_URL,
    timeout: 5000
  },
  features: {
    analytics: true,
    monitoring: true
  }
} satisfies AppConfig;

// Maintains literal types while ensuring shape
const routes = {
  home: '/',
  dashboard: '/dashboard',
  api: {
    users: '/api/users',
    agents: '/api/agents'
  }
} as const satisfies Record<string, string | Record<string, string>>;`,
        
        genericConstraints: `// Advanced generic constraints
type DeepPartial<T> = T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

type DeepReadonly<T> = T extends object
  ? { readonly [P in keyof T]: DeepReadonly<T[P]> }
  : T;

// Conditional types with infer
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T;
type UnwrapArray<T> = T extends (infer U)[] ? U : T;

// Branded types for type safety
type UserId = string & { __brand: 'UserId' };
type AgentId = string & { __brand: 'AgentId' };

function createUserId(id: string): UserId {
  return id as UserId;
}`,
        
        utilityTypes: `// Custom utility types for N8N MAS
type Awaitable<T> = T | Promise<T>;
type Nullable<T> = T | null;
type Optional<T> = T | undefined;

// API response types
type APIResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

// Agent message types
type AgentMessage<T extends string, P = unknown> = {
  type: T;
  payload: P;
  timestamp: Date;
  correlationId: string;
};

// Prisma helpers
type PrismaModel<T> = T & {
  id: string;
  createdAt: Date;
  updatedAt: Date;
};`
      }
    };
    
    return {
      diagnostics: {
        error: error,
        file: file,
        line: line,
        typescriptVersion: '5.9.2'
      },
      solutions: fixes[error.split(':')[0]] || fixes.advancedPatterns,
      quickFixes: [
        'Run `npm run type-check` to see all TypeScript errors',
        'Use `npx tsc --noEmit --explainFiles` for detailed type resolution',
        'Enable strict mode for better type safety',
        'Use type predicates for type narrowing',
        'Leverage const assertions for literal types'
      ],
      resources: [
        'TypeScript 5.9 Release Notes: https://devblogs.microsoft.com/typescript/announcing-typescript-5-9/',
        'TypeScript Handbook: https://www.typescriptlang.org/docs/handbook/intro.html',
        'Next.js TypeScript Guide: https://nextjs.org/docs/app/building-your-application/configuring/typescript',
        'Prisma TypeScript Guide: https://www.prisma.io/docs/concepts/components/prisma-client/working-with-prismaclient/generating-prisma-client'
      ]
    };
  }
};

module.exports = hook;