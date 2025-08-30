#!/usr/bin/env node
/**
 * /fix-tailwind-v4 - Address Tailwind CSS 4.1.11 configuration and utility issues
 * 
 * Handles Tailwind CSS v4 specific issues including the new Lightning CSS engine,
 * configuration changes, utility class updates, and performance optimizations.
 */

const hook = {
  name: 'fix-tailwind-v4',
  description: 'Fix Tailwind CSS 4.1.11 configuration, utilities, and migration issues',
  trigger: '/fix-tailwind-v4',
  
  async execute(context) {
    const { error, issue, file } = context.args;
    
    const solutions = {
      // Tailwind v4 Configuration
      'configuration': {
        newConfig: `// tailwind.config.ts - Tailwind CSS v4 Configuration
import type { Config } from 'tailwindcss';

// Tailwind v4 uses a new configuration format
export default {
  // Content paths remain the same
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  
  // Theme configuration with v4 enhancements
  theme: {
    // Container queries are now built-in
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    
    extend: {
      // CSS custom properties integration
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
      },
      
      // New v4 features
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
    },
  },
  
  // v4 Plugins with new syntax
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/container-queries'),
  ],
} satisfies Config;`,

        cssImport: `/* app/globals.css - Tailwind v4 CSS imports */

/* Lightning CSS compatible imports */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

/* CSS Layer for custom styles */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;
    --radius: 0.5rem;
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    /* ... dark mode variables ... */
  }
}

@layer base {
  * {
    @apply border-border;
  }
  
  body {
    @apply bg-background text-foreground;
  }
}

/* Container queries - new in v4 */
@container (min-width: 640px) {
  .container-responsive {
    @apply grid-cols-2;
  }
}`,

        postcssConfig: `// postcss.config.js - Tailwind v4 with Lightning CSS
module.exports = {
  plugins: {
    'tailwindcss': {},
    // Lightning CSS handles autoprefixer functionality
    // 'autoprefixer': {} // No longer needed with Lightning CSS
  },
};

// For advanced optimization with Lightning CSS
module.exports = {
  plugins: {
    'tailwindcss': {
      // Lightning CSS options
      lightningcss: {
        targets: {
          chrome: 95,
          firefox: 91,
          safari: 14,
        },
        drafts: {
          nesting: true,
          customMedia: true,
        },
      },
    },
  },
};`
      },

      // v4 Migration Issues
      'migration': {
        breakingChanges: `// Tailwind v4 Breaking Changes and Fixes

// 1. Configuration file changes
// ❌ v3 config (tailwind.config.js)
module.exports = {
  purge: ['./src/**/*.{js,jsx,ts,tsx}'], // Deprecated
  darkMode: 'media', // Changed syntax
  variants: { // Removed
    extend: {},
  },
};

// ✅ v4 config (tailwind.config.ts)
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}'], // 'purge' renamed to 'content'
  darkMode: 'class', // or ['class', '[data-theme="dark"]']
  // variants removed - all utilities support all variants by default
} satisfies Config;

// 2. Utility class changes
// ❌ v3 classes
<div className="overflow-clip"> // Renamed
<div className="flex-grow-0"> // Simplified
<div className="decoration-slice"> // Changed

// ✅ v4 classes  
<div className="overflow-hidden">
<div className="grow-0">
<div className="box-decoration-slice">

// 3. Color opacity syntax
// ❌ v3 syntax
<div className="bg-red-500 bg-opacity-50">
<div className="text-blue-600/50"> // May not work in some contexts

// ✅ v4 syntax (both work, but new syntax preferred)
<div className="bg-red-500/50">
<div className="text-blue-600/50">

// 4. Arbitrary value improvements
// v4 supports more arbitrary values
<div className="w-[calc(100%-2rem)]">
<div className="grid-cols-[1fr_2fr_1fr]">
<div className="bg-[color:var(--custom-color)]">`,

        pluginUpdates: `// Updating Tailwind Plugins for v4

// 1. Forms plugin with v4
npm install @tailwindcss/forms@latest

// tailwind.config.ts
plugins: [
  require('@tailwindcss/forms')({
    strategy: 'class', // Use class strategy for more control
  }),
]

// 2. Typography plugin updates
npm install @tailwindcss/typography@latest

// New v4 prose modifiers
<article className="prose prose-slate prose-headings:text-primary prose-p:text-muted-foreground">

// 3. Container queries (now built-in)
// No plugin needed in v4!
<div className="@container">
  <div className="@md:grid-cols-2 @lg:grid-cols-3">
    <!-- Responsive based on container size -->
  </div>
</div>

// 4. Custom plugins for v4
import plugin from 'tailwindcss/plugin';

export default {
  plugins: [
    plugin(function({ addUtilities, matchUtilities, theme }) {
      // Add static utilities
      addUtilities({
        '.content-auto': {
          'content-visibility': 'auto',
        },
      });
      
      // Add dynamic utilities
      matchUtilities(
        {
          'animation-delay': (value) => ({
            'animation-delay': value,
          }),
        },
        {
          values: theme('transitionDelay'),
        }
      );
    }),
  ],
};`
      },

      // New v4 Features
      'newFeatures': {
        containerQueries: `// Container Queries in Tailwind v4

// Basic container query setup
<div className="@container">
  <div className="grid grid-cols-1 @md:grid-cols-2 @xl:grid-cols-3 gap-4">
    <Card className="p-4 @sm:p-6 @lg:p-8" />
  </div>
</div>

// Named containers
<div className="@container/sidebar">
  <nav className="@sm/sidebar:block hidden">
    <!-- Shows when sidebar container is sm or larger -->
  </nav>
</div>

// Complex responsive components
function ResponsiveCard({ children }) {
  return (
    <div className="@container">
      <div className="bg-white rounded-lg shadow-sm @sm:shadow-md @lg:shadow-lg">
        <div className="p-4 @sm:p-6 @lg:p-8">
          <h3 className="text-lg @sm:text-xl @lg:text-2xl font-semibold">
            {children}
          </h3>
          <div className="mt-2 @sm:mt-4 @lg:mt-6">
            <p className="text-sm @sm:text-base @lg:text-lg text-gray-600">
              Container-responsive text sizing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Container query variants for all utilities
<div className="@container">
  <div className="
    flex flex-col @sm:flex-row
    gap-2 @sm:gap-4 @lg:gap-6
    items-start @sm:items-center
    justify-start @sm:justify-between
  ">
    <!-- Fully responsive layout based on container -->
  </div>
</div>`,

        cssNesting: `// Native CSS Nesting Support in v4

/* Before v4 - needed postcss-nested */
.card {
  @apply bg-white rounded-lg shadow;
}
.card-header {
  @apply p-4 border-b;
}
.card-body {
  @apply p-4;
}

/* With v4 - native nesting */
.card {
  @apply bg-white rounded-lg shadow;
  
  .card-header {
    @apply p-4 border-b;
    
    h3 {
      @apply text-lg font-semibold;
    }
  }
  
  .card-body {
    @apply p-4;
    
    &:hover {
      @apply bg-gray-50;
    }
  }
  
  /* Nested media queries */
  @media (min-width: 640px) {
    @apply shadow-md;
    
    .card-header {
      @apply p-6;
    }
  }
}

/* Component with nested modifiers */
.button {
  @apply px-4 py-2 rounded font-medium;
  
  &[data-variant="primary"] {
    @apply bg-primary text-primary-foreground;
    
    &:hover {
      @apply bg-primary/90;
    }
  }
  
  &[data-variant="secondary"] {
    @apply bg-secondary text-secondary-foreground;
  }
  
  &[data-size="sm"] {
    @apply px-3 py-1 text-sm;
  }
}`,

        lightningCSS: `// Lightning CSS Engine Benefits in v4

// 1. Faster builds
// v3: ~500ms build time
// v4: ~50ms build time (10x faster!)

// 2. Better browser targeting
// tailwind.config.ts
export default {
  theme: {
    // Lightning CSS handles vendor prefixes based on browserslist
  },
  // Specify browser targets
  lightningcss: {
    targets: {
      chrome: 95,
      firefox: 91,
      safari: 14,
      edge: 95,
    },
  },
};

// 3. Modern CSS features automatically transpiled
.modern-grid {
  /* CSS Grid subgrid - automatically polyfilled */
  display: grid;
  grid-template-columns: subgrid;
  
  /* Logical properties */
  margin-inline: auto;
  padding-block: 2rem;
  
  /* New color functions */
  color: oklch(70% 0.25 138);
  background: color-mix(in srgb, var(--primary) 50%, white);
}

// 4. Smaller output CSS
// - Automatic removal of unused keyframes
// - Better compression
// - Optimized selector merging`,

        advancedPatterns: `// Advanced Tailwind v4 Patterns

// 1. Dynamic class composition with cn()
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Usage with v4 features
<div className={cn(
  "rounded-lg border bg-card text-card-foreground shadow-sm",
  "@container", // Container queries
  "has-[:checked]:ring-2", // Has selector
  className
)} />

// 2. Component variants with cva
import { cva } from 'class-variance-authority';

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// 3. Tailwind v4 with CSS Modules
// styles.module.css
.card {
  @apply @container bg-white rounded-lg shadow-sm;
  
  .header {
    @apply p-4 @sm:p-6 border-b;
  }
  
  .body {
    @apply p-4 @sm:p-6;
  }
}

// 4. Dynamic themes with CSS variables
const themes = {
  light: {
    '--background': '0 0% 100%',
    '--foreground': '222.2 84% 4.9%',
  },
  dark: {
    '--background': '222.2 84% 4.9%',
    '--foreground': '210 40% 98%',
  },
  ocean: {
    '--background': '209 100% 96%',
    '--foreground': '209 100% 20%',
  },
};

function ThemeProvider({ theme, children }) {
  return (
    <div style={themes[theme]} className="min-h-screen bg-background text-foreground">
      {children}
    </div>
  );
}`
      },

      // Performance Optimization
      'performance': {
        optimization: `// Tailwind v4 Performance Optimization

// 1. Content configuration optimization
export default {
  content: [
    // Be specific to reduce scanning
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    // Exclude test files
    '!**/*.test.{js,ts,jsx,tsx}',
    '!**/*.spec.{js,ts,jsx,tsx}',
  ],
  
  // 2. Disable features you don't use
  corePlugins: {
    // Disable unused core plugins
    float: false,
    clear: false,
    skew: false,
  },
  
  // 3. Optimize for production
  future: {
    hoverOnlyWhenSupported: true, // Better mobile performance
    respectDefaultRingColorOpacity: true,
  },
};

// 4. Use CSS containment
.performance-container {
  @apply relative;
  contain: layout style paint;
  content-visibility: auto;
}

// 5. Optimize animations
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}`,

        bundleSize: `// Reducing Tailwind v4 Bundle Size

// 1. Remove unused utilities in production
// next.config.js
module.exports = {
  experimental: {
    optimizeCss: true, // Enables CSS optimization
  },
};

// 2. Use dynamic imports for heavy components
const HeavyComponent = dynamic(
  () => import('./HeavyComponent'),
  { 
    ssr: false,
    loading: () => <div className="h-48 bg-gray-100 animate-pulse" />
  }
);

// 3. Extract critical CSS
// pages/_document.tsx
import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html>
      <Head>
        <style dangerouslySetInnerHTML={{
          __html: \`
            /* Critical CSS only */
            .container { max-width: 1280px; margin: 0 auto; padding: 0 1rem; }
            .hidden { display: none; }
            .block { display: block; }
          \`
        }} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}

// 4. Tree-shake Tailwind utilities
// tailwind.config.ts
export default {
  content: {
    relative: true,
    transform: (content) => {
      // Remove comments and unnecessary whitespace
      return content.replace(/<!--.*?-->/gs, '').replace(/\s+/g, ' ');
    },
  },
};`
      },

      // Common Issues and Fixes
      'commonIssues': {
        classNotWorking: `// Tailwind v4 Classes Not Working - Debug Guide

// 1. Check content configuration
// ❌ Wrong
content: ['./src/**/*.{js,ts,jsx,tsx}'] // Missing app directory

// ✅ Correct
content: [
  './app/**/*.{js,ts,jsx,tsx}',
  './components/**/*.{js,ts,jsx,tsx}',
  './src/**/*.{js,ts,jsx,tsx}',
]

// 2. Dynamic classes issue
// ❌ Wrong - Tailwind can't detect dynamic classes
const color = 'red';
<div className={\`bg-\${color}-500\`}> // Won't work

// ✅ Correct - Use complete class names
const colors = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
};
<div className={colors[color]}>

// ✅ Or safelist in config
export default {
  safelist: [
    'bg-red-500',
    'bg-blue-500',
    {
      pattern: /bg-(red|blue|green)-(100|200|300|400|500)/,
    },
  ],
};

// 3. CSS specificity issues
// ❌ Problem - Tailwind utilities overridden
.my-component {
  padding: 20px; /* Overrides Tailwind's p-4 */
}

// ✅ Solution - Use layers
@layer components {
  .my-component {
    @apply p-5; /* Use Tailwind utilities */
  }
}

// 4. Dark mode not working
// ❌ Wrong - Missing dark mode config
<div className="dark:bg-gray-800"> // Won't work without config

// ✅ Correct - Configure dark mode
export default {
  darkMode: 'class', // or 'media'
};

// And add dark class to html
<html className="dark">`,

        buildErrors: `// Tailwind v4 Build Errors and Solutions

// 1. PostCSS Configuration Error
// Error: Cannot find module 'autoprefixer'
// ✅ Fix: Remove autoprefixer (Lightning CSS handles this)
module.exports = {
  plugins: {
    tailwindcss: {},
    // autoprefixer: {}, // Remove this
  },
};

// 2. Import Error
// Error: Cannot import tailwindcss/base
// ✅ Fix: Check CSS import syntax
/* globals.css */
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

// 3. TypeScript Config Type Error
// Error: Cannot find type definition
// ✅ Fix: Install types
npm install --save-dev @types/tailwindcss

// And use satisfies
import type { Config } from 'tailwindcss';
export default {
  // config
} satisfies Config;

// 4. Plugin Compatibility
// Error: Plugin incompatible with v4
// ✅ Fix: Update or replace plugins
npm update @tailwindcss/forms @tailwindcss/typography
// Check plugin docs for v4 compatibility`
      }
    };
    
    return {
      issue: issue || error,
      solution: solutions[issue] || solutions.commonIssues,
      migration: {
        fromVersion: '3.x',
        toVersion: '4.1.11',
        breakingChanges: [
          'Config file format changed to TypeScript',
          'Lightning CSS replaces PostCSS for processing',
          'Some utility class names changed',
          'Variant configuration removed (all variants available by default)',
          'Container queries now built-in',
          'Native CSS nesting support'
        ]
      },
      performanceGains: {
        buildTime: '10x faster with Lightning CSS',
        bundleSize: 'Smaller output with better optimization',
        runtime: 'Better performance with CSS containment'
      },
      bestPractices: [
        'Use container queries for component-level responsiveness',
        'Leverage native CSS nesting for better organization',
        'Implement proper dark mode with CSS variables',
        'Use cn() utility for dynamic class composition',
        'Enable CSS containment for performance',
        'Be specific with content paths to reduce scanning'
      ],
      resources: [
        'Tailwind CSS v4 Docs: https://tailwindcss.com/docs',
        'Lightning CSS: https://lightningcss.dev/',
        'Container Queries: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries',
        'CSS Nesting: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_nesting'
      ]
    };
  }
};

module.exports = hook;