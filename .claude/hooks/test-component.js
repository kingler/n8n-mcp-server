#!/usr/bin/env node
/**
 * /test-component - Generate comprehensive test suites for React components
 * 
 * Creates test files for Next.js 15.4 components with React Testing Library,
 * Vitest, and proper mocking strategies for the N8N MAS stack.
 */

const hook = {
  name: 'test-component',
  description: 'Generate comprehensive test suites for React components in N8N MAS',
  trigger: '/test-component',
  
  async execute(context) {
    const { componentName, componentPath, testType } = context.args;
    
    return {
      template: `
# Component Test Suite: ${componentName}

## Test File Structure

\`\`\`typescript
// ${componentPath}/__tests__/${componentName}.test.tsx

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { axe, toHaveNoViolations } from 'jest-axe'
import { ${componentName} } from '../${componentName}'

// Add custom matchers
expect.extend(toHaveNoViolations)

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    pathname: '/',
    query: {},
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createClientComponentClient: () => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser } }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
    },
  }),
}))

// Test data
const mockUser = {
  id: '123',
  email: 'test@example.com',
  user_metadata: {},
}

describe('${componentName}', () => {
  const user = userEvent.setup()
  
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    // Cleanup
    vi.restoreAllMocks()
  })
  
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<${componentName} />)
      expect(screen.getByRole('...')).toBeInTheDocument()
    })
    
    it('should render with required props', () => {
      const props = {
        title: 'Test Title',
        onSubmit: vi.fn(),
      }
      
      render(<${componentName} {...props} />)
      expect(screen.getByText('Test Title')).toBeInTheDocument()
    })
    
    it('should match snapshot', () => {
      const { container } = render(<${componentName} />)
      expect(container).toMatchSnapshot()
    })
  })
  
  describe('User Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn()
      render(<${componentName} onClick={handleClick} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleClick).toHaveBeenCalledTimes(1)
    })
    
    it('should handle form submission', async () => {
      const handleSubmit = vi.fn()
      render(<${componentName} onSubmit={handleSubmit} />)
      
      // Fill form fields
      const input = screen.getByLabelText('Name')
      await user.type(input, 'John Doe')
      
      // Submit form
      const submitButton = screen.getByRole('button', { name: /submit/i })
      await user.click(submitButton)
      
      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalledWith({
          name: 'John Doe',
        })
      })
    })
    
    it('should handle keyboard navigation', async () => {
      render(<${componentName} />)
      
      const firstElement = screen.getByRole('button', { name: /first/i })
      const secondElement = screen.getByRole('button', { name: /second/i })
      
      // Focus first element
      await user.tab()
      expect(firstElement).toHaveFocus()
      
      // Tab to second element
      await user.tab()
      expect(secondElement).toHaveFocus()
      
      // Shift+Tab back
      await user.tab({ shift: true })
      expect(firstElement).toHaveFocus()
    })
  })
  
  describe('State Management', () => {
    it('should update state correctly', async () => {
      render(<${componentName} />)
      
      // Initial state
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      
      // Trigger state change
      const button = screen.getByRole('button', { name: /load data/i })
      await user.click(button)
      
      // Loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      
      // Final state
      await waitFor(() => {
        expect(screen.getByText('Data loaded')).toBeInTheDocument()
      })
    })
    
    it('should handle error states', async () => {
      // Mock error response
      const mockFetch = vi.fn().mockRejectedValue(new Error('API Error'))
      global.fetch = mockFetch
      
      render(<${componentName} />)
      
      const button = screen.getByRole('button', { name: /load/i })
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('API Error')
      })
    })
  })
  
  describe('Props Validation', () => {
    it('should handle missing required props gracefully', () => {
      // @ts-expect-error - Testing runtime behavior
      render(<${componentName} />)
      
      expect(screen.getByText(/default/i)).toBeInTheDocument()
    })
    
    it('should validate prop types', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      // @ts-expect-error - Testing runtime validation
      render(<${componentName} count="not-a-number" />)
      
      expect(consoleSpy).toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })
  
  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<${componentName} />)
      const results = await axe(container)
      
      expect(results).toHaveNoViolations()
    })
    
    it('should have proper ARIA labels', () => {
      render(<${componentName} />)
      
      const button = screen.getByRole('button', { name: /submit/i })
      expect(button).toHaveAttribute('aria-label')
      
      const form = screen.getByRole('form')
      expect(form).toHaveAttribute('aria-labelledby')
    })
    
    it('should announce dynamic content to screen readers', async () => {
      render(<${componentName} />)
      
      const button = screen.getByRole('button', { name: /update/i })
      await user.click(button)
      
      await waitFor(() => {
        const liveRegion = screen.getByRole('status')
        expect(liveRegion).toHaveTextContent('Content updated')
      })
    })
  })
  
  describe('Performance', () => {
    it('should not re-render unnecessarily', async () => {
      const renderSpy = vi.fn()
      
      function TestWrapper() {
        renderSpy()
        return <${componentName} />
      }
      
      const { rerender } = render(<TestWrapper />)
      expect(renderSpy).toHaveBeenCalledTimes(1)
      
      // Re-render with same props
      rerender(<TestWrapper />)
      expect(renderSpy).toHaveBeenCalledTimes(1) // Should not increase
    })
    
    it('should debounce expensive operations', async () => {
      const expensiveOperation = vi.fn()
      render(<${componentName} onSearch={expensiveOperation} />)
      
      const input = screen.getByRole('searchbox')
      
      // Type quickly
      await user.type(input, 'test query')
      
      // Should only call once after debounce delay
      await waitFor(() => {
        expect(expensiveOperation).toHaveBeenCalledTimes(1)
        expect(expensiveOperation).toHaveBeenCalledWith('test query')
      }, { timeout: 1000 })
    })
  })
  
  describe('Integration Tests', () => {
    it('should integrate with Supabase auth', async () => {
      const { mockSupabaseClient } = await import('@/test/utils/supabase-mock')
      
      render(
        <SupabaseProvider client={mockSupabaseClient}>
          <${componentName} />
        </SupabaseProvider>
      )
      
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument()
      })
    })
    
    it('should handle real-time updates', async () => {
      const { mockChannel } = await import('@/test/utils/realtime-mock')
      
      render(<${componentName} channel={mockChannel} />)
      
      // Simulate real-time event
      mockChannel.trigger('UPDATE', { id: '123', status: 'completed' })
      
      await waitFor(() => {
        expect(screen.getByText('Status: completed')).toBeInTheDocument()
      })
    })
  })
})
\`\`\`

## Test Utilities

\`\`\`typescript
// test/utils/test-utils.tsx

import { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/toaster'

// Custom providers wrapper
function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="light">
      {children}
      <Toaster />
    </ThemeProvider>
  )
}

// Custom render function
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options })
}

export * from '@testing-library/react'
export { customRender as render }
\`\`\`

## Mock Utilities

\`\`\`typescript
// test/mocks/handlers.ts - MSW handlers

import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/user', () => {
    return HttpResponse.json({
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
    })
  }),
  
  http.post('/api/workflow', async ({ request }) => {
    const body = await request.json()
    return HttpResponse.json({
      id: '456',
      ...body,
      status: 'created',
    })
  }),
  
  http.get('/api/agents', () => {
    return HttpResponse.json([
      { id: '1', name: 'Neo', type: 'orchestrator' },
      { id: '2', name: 'Trinity', type: 'specialist' },
    ])
  }),
]

// test/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
\`\`\`

## Component-Specific Test Patterns

### Server Component Testing
\`\`\`typescript
// For Next.js 15.4 Server Components
import { renderServerComponent } from '@/test/utils/server-component-test'

describe('ServerComponent', () => {
  it('should fetch and render data', async () => {
    const html = await renderServerComponent(
      <ServerComponent id="123" />
    )
    
    expect(html).toContain('Expected content')
  })
})
\`\`\`

### Form Component Testing
\`\`\`typescript
describe('FormComponent', () => {
  it('should validate required fields', async () => {
    render(<FormComponent />)
    
    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)
    
    expect(screen.getByText('Email is required')).toBeInTheDocument()
    expect(screen.getByText('Password is required')).toBeInTheDocument()
  })
  
  it('should show validation errors', async () => {
    render(<FormComponent />)
    
    const emailInput = screen.getByLabelText('Email')
    await user.type(emailInput, 'invalid-email')
    await user.tab() // Trigger blur
    
    expect(screen.getByText('Invalid email format')).toBeInTheDocument()
  })
})
\`\`\`

### Modal/Dialog Testing
\`\`\`typescript
describe('ModalComponent', () => {
  it('should open and close correctly', async () => {
    render(<ModalComponent />)
    
    // Modal should be closed initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    
    // Open modal
    const openButton = screen.getByRole('button', { name: /open/i })
    await user.click(openButton)
    
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    
    // Close modal
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
  
  it('should trap focus when open', async () => {
    render(<ModalComponent />)
    
    const openButton = screen.getByRole('button', { name: /open/i })
    await user.click(openButton)
    
    const dialog = screen.getByRole('dialog')
    const focusableElements = within(dialog).getAllByRole('button')
    
    // Tab through elements
    await user.tab()
    expect(focusableElements[0]).toHaveFocus()
    
    // Tab should wrap to first element
    await user.tab()
    await user.tab()
    expect(focusableElements[0]).toHaveFocus()
  })
})
\`\`\`

### Async Component Testing
\`\`\`typescript
describe('AsyncComponent', () => {
  it('should handle loading states', async () => {
    render(<AsyncComponent />)
    
    // Loading state
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument()
    
    // Wait for content
    await waitFor(() => {
      expect(screen.queryByTestId('skeleton-loader')).not.toBeInTheDocument()
      expect(screen.getByText('Loaded content')).toBeInTheDocument()
    })
  })
  
  it('should retry on error', async () => {
    const mockFetch = vi.fn()
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ data: 'Success' })
    
    global.fetch = mockFetch
    
    render(<AsyncComponent />)
    
    // First attempt fails
    await waitFor(() => {
      expect(screen.getByText('Error: Network error')).toBeInTheDocument()
    })
    
    // Click retry
    const retryButton = screen.getByRole('button', { name: /retry/i })
    await user.click(retryButton)
    
    // Second attempt succeeds
    await waitFor(() => {
      expect(screen.getByText('Success')).toBeInTheDocument()
    })
    
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
\`\`\`

## Coverage Configuration

\`\`\`typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData.ts',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
})
\`\`\`
`,
      testTypes: {
        unit: 'Unit tests for isolated component logic',
        integration: 'Integration tests with mocked dependencies',
        e2e: 'End-to-end tests with real browser (Playwright)',
        visual: 'Visual regression tests (Storybook + Chromatic)',
        performance: 'Performance tests (React Testing Library + Performance Observer)',
        accessibility: 'Accessibility tests (jest-axe + Pa11y)'
      },
      bestPractices: [
        'Test behavior, not implementation details',
        'Use Testing Library queries in priority order',
        'Mock at the boundary (network, not internal functions)',
        'Write tests that resemble how users interact with the app',
        'Keep tests isolated and independent',
        'Use descriptive test names that explain the scenario',
        'Test error states and edge cases',
        'Ensure accessibility in all components'
      ],
      resources: [
        'Testing Library Docs: https://testing-library.com/docs/',
        'Vitest Docs: https://vitest.dev/',
        'MSW Docs: https://mswjs.io/',
        'Jest-axe: https://github.com/nickcolley/jest-axe',
        'Testing Best Practices: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library'
      ]
    };
  }
};

module.exports = hook;