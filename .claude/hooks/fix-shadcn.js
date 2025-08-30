#!/usr/bin/env node
/**
 * /fix-shadcn - Resolve shadcn/ui 2.10.0 component integration problems
 * 
 * Addresses shadcn/ui v2.10.0 issues including Tailwind v4 compatibility,
 * component integration, theme customization, and accessibility.
 */

const hook = {
  name: 'fix-shadcn',
  description: 'Fix shadcn/ui 2.10.0 integration, theming, and component issues',
  trigger: '/fix-shadcn',
  
  async execute(context) {
    const { error, component, issue } = context.args;
    
    const solutions = {
      // Installation and Setup
      'setup': {
        initialization: `// shadcn/ui v2.10.0 Setup with Tailwind v4

// 1. Initialize shadcn/ui (updated for v2.10.0)
npx shadcn-ui@latest init

// 2. Updated components.json for v2.10.0
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "default",
  "rsc": true, // React Server Components support
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "app/globals.css",
    "baseColor": "slate", // or "gray", "neutral", "stone", "zinc"
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "framework": "next", // Updated for Next.js 15.4
  "registries": [
    {
      "name": "shadcn",
      "url": "https://ui.shadcn.com/registry"
    }
  ]
}

// 3. Install specific components
npx shadcn-ui@latest add button card dialog form

// 4. Install all dependencies
npm install @radix-ui/react-accordion @radix-ui/react-alert-dialog @radix-ui/react-aspect-ratio @radix-ui/react-avatar @radix-ui/react-checkbox @radix-ui/react-collapsible @radix-ui/react-context-menu @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-hover-card @radix-ui/react-label @radix-ui/react-menubar @radix-ui/react-navigation-menu @radix-ui/react-popover @radix-ui/react-progress @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slider @radix-ui/react-switch @radix-ui/react-tabs @radix-ui/react-toast @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip class-variance-authority clsx tailwind-merge`,

        utils: `// lib/utils.ts - Updated for v2.10.0 with Tailwind v4
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Additional utility functions for v2.10.0
export function formatDate(date: Date | string | number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function absoluteUrl(path: string) {
  return \`\${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}\${path}\`;
}

// Accessibility utilities
export function focusRing() {
  return "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";
}`,

        globals: `/* app/globals.css - shadcn/ui v2.10.0 with Tailwind v4 */
@import "tailwindcss/base";
@import "tailwindcss/components";
@import "tailwindcss/utilities";

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
    
    /* New in v2.10.0 */
    --chart-1: 12 76% 61%;
    --chart-2: 173 58% 39%;
    --chart-3: 197 37% 24%;
    --chart-4: 43 74% 66%;
    --chart-5: 27 87% 67%;
  }
  
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    
    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;
    
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
    
    /* Chart colors for dark mode */
    --chart-1: 220 70% 50%;
    --chart-2: 160 60% 45%;
    --chart-3: 30 80% 55%;
    --chart-4: 280 65% 60%;
    --chart-5: 340 75% 55%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
    font-feature-settings: "rlig" 1, "calt" 1;
  }
}

/* v2.10.0 Animations */
@layer utilities {
  .animate-in {
    animation-name: animateIn;
    animation-fill-mode: both;
    animation-duration: var(--animate-duration, 150ms);
  }
  
  .animate-out {
    animation-name: animateOut;
    animation-fill-mode: both;
    animation-duration: var(--animate-duration, 150ms);
  }
  
  @keyframes animateIn {
    from {
      opacity: var(--enter-opacity, 0);
      transform: translate3d(
        var(--enter-translate-x, 0),
        var(--enter-translate-y, 0),
        0
      ) scale(var(--enter-scale, 1));
    }
  }
  
  @keyframes animateOut {
    to {
      opacity: var(--exit-opacity, 0);
      transform: translate3d(
        var(--exit-translate-x, 0),
        var(--exit-translate-y, 0),
        0
      ) scale(var(--exit-scale, 1));
    }
  }
}`
      },

      // Component Integration Issues
      'components': {
        button: `// Button Component - v2.10.0 with Tailwind v4

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
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
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }

// Usage examples
<Button>Default Button</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline" size="sm">Small Outline</Button>
<Button size="icon" variant="ghost">
  <ChevronRight className="h-4 w-4" />
</Button>
<Button asChild>
  <Link href="/about">About</Link>
</Button>`,

        form: `// Form Components - v2.10.0 with React Hook Form & Zod

"use client"

import * as React from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "@/components/ui/use-toast"

// Define schema
const formSchema = z.object({
  username: z.string().min(2, {
    message: "Username must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email.",
  }),
  bio: z.string().max(160).optional(),
})

export function ProfileForm() {
  // Initialize form with v2.10.0 patterns
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      email: "",
      bio: "",
    },
  })

  // Handle submission
  async function onSubmit(values: z.infer<typeof formSchema>) {
    try {
      // Server action or API call
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      
      if (!response.ok) throw new Error("Failed to update profile")
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="johndoe" {...field} />
              </FormControl>
              <FormDescription>
                This is your public display name.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="john@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Updating..." : "Update profile"}
        </Button>
      </form>
    </Form>
  )
}`,

        dialog: `// Dialog Component - v2.10.0 with improved animations

"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-50 bg-black/80 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

// Usage with Server Actions
function DeleteDialog({ itemId }: { itemId: string }) {
  const [open, setOpen] = React.useState(false)
  
  async function handleDelete() {
    try {
      await deleteItem(itemId) // Server action
      setOpen(false)
      toast({ title: "Item deleted successfully" })
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to delete item",
        variant: "destructive" 
      })
    }
  }
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">Delete</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the item.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}`
      },

      // Theming and Customization
      'theming': {
        customTheme: `// Custom Theme Configuration for v2.10.0

// 1. Create theme configuration
// lib/themes.ts
export const themes = {
  default: {
    name: "Default",
    cssVars: {
      light: {
        background: "0 0% 100%",
        foreground: "222.2 84% 4.9%",
        primary: "222.2 47.4% 11.2%",
        "primary-foreground": "210 40% 98%",
      },
      dark: {
        background: "222.2 84% 4.9%",
        foreground: "210 40% 98%",
        primary: "210 40% 98%",
        "primary-foreground": "222.2 47.4% 11.2%",
      },
    },
  },
  ocean: {
    name: "Ocean",
    cssVars: {
      light: {
        background: "210 100% 97%",
        foreground: "210 100% 15%",
        primary: "210 100% 50%",
        "primary-foreground": "0 0% 100%",
      },
      dark: {
        background: "210 50% 10%",
        foreground: "210 40% 95%",
        primary: "210 100% 60%",
        "primary-foreground": "210 50% 10%",
      },
    },
  },
  forest: {
    name: "Forest",
    cssVars: {
      light: {
        background: "120 50% 96%",
        foreground: "120 100% 10%",
        primary: "120 60% 40%",
        "primary-foreground": "0 0% 100%",
      },
      dark: {
        background: "120 50% 8%",
        foreground: "120 20% 95%",
        primary: "120 60% 50%",
        "primary-foreground": "120 50% 8%",
      },
    },
  },
}

// 2. Theme Provider Component
// components/theme-provider.tsx
"use client"

import * as React from "react"
import { themes } from "@/lib/themes"

type Theme = keyof typeof themes
type Mode = "light" | "dark"

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
  defaultMode?: Mode
  storageKey?: string
}

export function ThemeProvider({
  children,
  defaultTheme = "default",
  defaultMode = "light",
  storageKey = "ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = React.useState<Theme>(defaultTheme)
  const [mode, setMode] = React.useState<Mode>(defaultMode)
  
  React.useEffect(() => {
    const root = window.document.documentElement
    
    // Apply CSS variables
    const cssVars = themes[theme].cssVars[mode]
    Object.entries(cssVars).forEach(([key, value]) => {
      root.style.setProperty(\`--\${key}\`, value)
    })
    
    // Apply dark class
    root.classList.toggle("dark", mode === "dark")
  }, [theme, mode])
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme, mode, setMode }}>
      {children}
    </ThemeContext.Provider>
  )
}

// 3. Custom component variants
// components/ui/custom-button.tsx
import { cva } from "class-variance-authority"

export const customButtonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        gradient: "bg-gradient-to-r from-primary to-primary/60 text-primary-foreground hover:opacity-90",
        glow: "bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-primary/40",
        neon: "border-2 border-primary text-primary shadow-[0_0_15px] shadow-primary/50 hover:shadow-primary/75",
      },
      size: {
        xs: "h-7 px-2 text-xs",
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-6 text-base",
        xl: "h-14 px-8 text-lg",
      },
    },
    defaultVariants: {
      variant: "gradient",
      size: "md",
    },
  }
)`,

        darkMode: `// Dark Mode Implementation with v2.10.0

// 1. Theme Toggle Component
// components/theme-toggle.tsx
"use client"

import * as React from "react"
import { Moon, Sun, Monitor } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" />
          <span>Light</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" />
          <span>Dark</span>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// 2. Next.js Theme Provider Setup
// app/providers.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}

// 3. Root Layout Integration
// app/layout.tsx
import { Providers } from "./providers"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}

// 4. Component-specific dark mode styles
// components/ui/card-dark.tsx
export function DarkAwareCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm dark:shadow-lg dark:shadow-primary/5">
      <div className="p-6 dark:bg-gradient-to-br dark:from-card dark:to-card/80">
        {children}
      </div>
    </div>
  )
}`
      },

      // Accessibility
      'accessibility': {
        ariaPatterns: `// Accessibility Best Practices for shadcn/ui v2.10.0

// 1. Accessible Form with ARIA labels
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function AccessibleForm() {
  return (
    <form aria-label="Contact form">
      <div className="space-y-4">
        {/* Proper label association */}
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="john@example.com"
            aria-describedby="email-error"
            aria-invalid={false}
            required
          />
          <p id="email-error" className="text-sm text-destructive" role="alert">
            {/* Error message appears here */}
          </p>
        </div>
        
        {/* Accessible button with loading state */}
        <Button
          type="submit"
          disabled={false}
          aria-busy={false}
          aria-label="Submit contact form"
        >
          <span className="sr-only">Submit form</span>
          <span aria-hidden="true">Submit</span>
        </Button>
      </div>
    </form>
  )
}

// 2. Keyboard Navigation for Custom Components
export function KeyboardNavigableList({ items }: { items: string[] }) {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setSelectedIndex((prev) => 
          prev < items.length - 1 ? prev + 1 : prev
        )
        break
      case "ArrowUp":
        e.preventDefault()
        setSelectedIndex((prev) => prev > 0 ? prev - 1 : prev)
        break
      case "Home":
        e.preventDefault()
        setSelectedIndex(0)
        break
      case "End":
        e.preventDefault()
        setSelectedIndex(items.length - 1)
        break
    }
  }
  
  return (
    <ul
      role="listbox"
      aria-label="Selectable list"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
    >
      {items.map((item, index) => (
        <li
          key={item}
          role="option"
          aria-selected={index === selectedIndex}
          className={cn(
            "px-4 py-2 cursor-pointer",
            index === selectedIndex && "bg-accent"
          )}
          onClick={() => setSelectedIndex(index)}
        >
          {item}
        </li>
      ))}
    </ul>
  )
}

// 3. Screen Reader Announcements
import { useEffect, useRef } from "react"

export function LiveRegion({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  )
}

// 4. Focus Management
export function FocusTrap({ children }: { children: React.ReactNode }) {
  const startRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  
  const handleStartFocus = () => {
    endRef.current?.focus()
  }
  
  const handleEndFocus = () => {
    startRef.current?.focus()
  }
  
  return (
    <>
      <div ref={startRef} tabIndex={0} onFocus={handleStartFocus} />
      {children}
      <div ref={endRef} tabIndex={0} onFocus={handleEndFocus} />
    </>
  )
}`,

        wcagCompliance: `// WCAG 2.1 AA Compliance Checklist for shadcn/ui

// 1. Color Contrast Checker
function checkContrast() {
  // Ensure all color combinations meet WCAG AA standards
  // Foreground/Background: minimum 4.5:1 for normal text
  // Large text (18pt+): minimum 3:1
  
  const contrastRatios = {
    "primary-on-background": "7.5:1", // ✅ Passes AA
    "muted-on-background": "4.6:1",   // ✅ Passes AA
    "primary-on-secondary": "8.2:1",  // ✅ Passes AA
  }
}

// 2. Focus Indicators
const focusStyles = {
  // Visible focus for all interactive elements
  button: "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  input: "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
  link: "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
}

// 3. Touch Target Sizes
const touchTargets = {
  // Minimum 44x44px for touch targets (WCAG 2.1)
  button: "min-h-[44px] min-w-[44px]",
  checkbox: "h-6 w-6 touch-target:h-11 touch-target:w-11",
  radio: "h-6 w-6 touch-target:h-11 touch-target:w-11",
}

// 4. Motion Preferences
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}`
      },

      // Common Issues
      'commonIssues': {
        hydrationMismatch: `// Fixing Hydration Mismatches with shadcn/ui

// ❌ Problem: Dynamic classes cause hydration errors
function BadComponent() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  return (
    <Button className={mounted ? "block" : "hidden"}>
      Click me
    </Button>
  )
}

// ✅ Solution 1: Use CSS instead of conditional rendering
function GoodComponent() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  return (
    <Button 
      className={cn(
        "transition-opacity",
        !mounted && "opacity-0 pointer-events-none"
      )}
    >
      Click me
    </Button>
  )
}

// ✅ Solution 2: Render after mount for client-only content
function ClientOnlyComponent() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  if (!mounted) {
    return <ButtonSkeleton /> // Server-safe placeholder
  }
  
  return <Button>Client-only button</Button>
}`,

        styleConflicts: `// Resolving Style Conflicts

// 1. CSS Specificity Issues
// ❌ Problem: Global styles override component styles
/* globals.css */
button {
  padding: 20px; /* Overrides shadcn/ui styles */
}

// ✅ Solution: Use CSS layers
/* globals.css */
@layer base {
  /* Base styles with lower specificity */
}

@layer components {
  /* Component styles */
}

@layer utilities {
  /* Utility overrides */
}

// 2. Tailwind Merge Conflicts
// ❌ Problem: Class conflicts
<Button className="p-4 p-2"> // Which padding wins?

// ✅ Solution: Use cn() utility
import { cn } from "@/lib/utils"

<Button className={cn("p-4", condition && "p-2")}>
// tailwind-merge resolves conflicts intelligently

// 3. Theme Variable Conflicts
// ❌ Problem: Hard-coded colors
<div className="bg-slate-900"> // Doesn't respect theme

// ✅ Solution: Use CSS variables
<div className="bg-background"> // Respects theme`,

        performanceIssues: `// Performance Optimization for shadcn/ui

// 1. Bundle Size Optimization
// ❌ Problem: Importing entire libraries
import * as RadixDialog from "@radix-ui/react-dialog"

// ✅ Solution: Import only needed parts
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@radix-ui/react-dialog"

// 2. Lazy Loading Heavy Components
// ❌ Problem: Loading all components upfront
import { DataTable } from "./data-table"
import { Chart } from "./chart"

// ✅ Solution: Dynamic imports
const DataTable = dynamic(() => import("./data-table"), {
  loading: () => <TableSkeleton />,
  ssr: false,
})

const Chart = dynamic(() => import("./chart"), {
  loading: () => <ChartSkeleton />,
})

// 3. Optimize Re-renders
// ❌ Problem: Unnecessary re-renders
function ParentComponent() {
  const [count, setCount] = useState(0)
  
  return (
    <>
      <Button onClick={() => setCount(count + 1)}>
        Count: {count}
      </Button>
      <ExpensiveComponent /> {/* Re-renders on every count change */}
    </>
  )
}

// ✅ Solution: Memoize expensive components
const ExpensiveComponent = React.memo(() => {
  return <ComplexUI />
})

// 4. Virtual Scrolling for Long Lists
import { useVirtualizer } from "@tanstack/react-virtual"

function VirtualList({ items }: { items: any[] }) {
  const parentRef = React.useRef<HTMLDivElement>(null)
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
  })
  
  return (
    <div ref={parentRef} className="h-[400px] overflow-auto">
      <div
        style={{
          height: \`\${virtualizer.getTotalSize()}px\`,
          width: "100%",
          position: "relative",
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: \`\${virtualItem.size}px\`,
              transform: \`translateY(\${virtualItem.start}px)\`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  )
}`
      }
    };
    
    return {
      component: component || 'general',
      issue: issue || error,
      solution: solutions[issue] || solutions.commonIssues,
      version: {
        shadcnUI: '2.10.0',
        tailwindCSS: '4.1.11',
        radixUI: 'latest',
        compatibility: 'Full Tailwind v4 support'
      },
      dependencies: {
        required: [
          '@radix-ui/react-*',
          'class-variance-authority',
          'clsx',
          'tailwind-merge',
          'lucide-react'
        ],
        optional: [
          'react-hook-form',
          '@hookform/resolvers',
          'zod',
          'next-themes',
          '@tanstack/react-table'
        ]
      },
      bestPractices: [
        'Use cn() utility for all dynamic class compositions',
        'Implement proper ARIA labels and keyboard navigation',
        'Leverage CSS variables for consistent theming',
        'Memoize complex components to prevent re-renders',
        'Use Radix UI primitives for accessibility',
        'Test with screen readers and keyboard navigation',
        'Implement proper focus management',
        'Use semantic HTML elements when possible'
      ],
      resources: [
        'shadcn/ui Docs: https://ui.shadcn.com',
        'Radix UI: https://www.radix-ui.com',
        'CVA: https://cva.style/docs',
        'Tailwind Merge: https://github.com/dcastil/tailwind-merge',
        'ARIA Authoring Practices: https://www.w3.org/WAI/ARIA/apg/'
      ]
    };
  }
};

module.exports = hook;