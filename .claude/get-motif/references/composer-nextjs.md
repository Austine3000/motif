# Next.js App Router — Composer Overlay

> **CRITICAL:** This document OVERRIDES default HTML composition behavior. When this overlay is active, ALL output must follow the rules below. If any base composition rule conflicts with this overlay, THIS OVERLAY WINS.

---

## 1. File Output Rules

| File Type | Path Pattern | Notes |
|-----------|-------------|-------|
| Page | `src/app/{route}/page.tsx` | Default export, Server Component by default |
| Layout | `src/app/{route}/layout.tsx` | Only if route needs a shared UI wrapper |
| Route-scoped component | `src/app/{route}/_components/{Name}.tsx` | Underscore prefix = not a route segment |
| Shared component | `src/components/{Name}.tsx` | Cross-route reusable components |

- Page files MUST use `export default function {PageName}Page()` format
- Route segments map to URL paths: `src/app/dashboard/page.tsx` serves `/dashboard`
- Nested routes use nested folders: `src/app/dashboard/settings/page.tsx` serves `/dashboard/settings`
- The root page is `src/app/page.tsx`

---

## 2. Import Rules

```tsx
// shadcn components — lowercase file, PascalCase export
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Icons — from lucide-react
import { ArrowRight, ChevronDown, Search } from "lucide-react";

// Images — Next.js optimized
import Image from "next/image";

// Conditional class merging
import { cn } from "@/lib/utils";

// Link — internal navigation
import Link from "next/link";
```

- Fonts: Handled by `layout.tsx` via `next/font/google`. Do NOT import fonts in page or component files.
- When a shadcn component is needed that was not pre-installed, note in SUMMARY.md: "Additional shadcn components needed: {list}. Run: `npx shadcn@latest add {component} -y`"

---

## 3. Styling Rules

**CRITICAL — This overrides the default inline-style behavior.**

- Use Tailwind utility classes for ALL styling via the `className` prop
- NEVER use inline `style={{}}` objects
- NEVER use raw CSS custom property references in JSX (no `var(--color-primary-500)`)
- NEVER write CSS files for component-specific styles — Tailwind utilities only

### Utility Categories

**Colors:**
- Background: `bg-surface-primary`, `bg-surface-elevated`, `bg-surface-sunken`, `bg-primary-500`, `bg-primary-600`
- Text: `text-text-primary`, `text-text-secondary`, `text-text-disabled`, `text-primary-500`
- Border: `border-border-primary`, `border-border-secondary`, `border-primary-500`

**Spacing:**
- Padding: `p-1` (4px), `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-6` (24px), `p-8` (32px)
- Margin: `m-1`, `m-2`, `m-4`, `mx-auto`, `mt-8`, `mb-4`
- Gap: `gap-2`, `gap-4`, `gap-6`, `gap-8`

**Border Radius:**
- `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full`

**Shadows:**
- `shadow-sm`, `shadow-md`, `shadow-lg`

**Typography:**
- `font-display`, `font-body`, `font-mono`
- `text-sm`, `text-base`, `text-lg`, `text-xl`, `text-2xl`, `text-3xl`
- `font-medium`, `font-semibold`, `font-bold`
- `leading-tight`, `leading-normal`, `leading-relaxed`

**Interactive States:**
- Hover: `hover:bg-primary-600`, `hover:text-text-primary`, `hover:shadow-lg`
- Focus: `focus:ring-2 focus:ring-ring focus:outline-none`
- Active: `active:scale-[0.98]`
- Disabled: `disabled:opacity-50 disabled:pointer-events-none`

---

## 4. Token-to-Tailwind Quick Reference

| Motif Token | Tailwind Utility | Example |
|-------------|-----------------|---------|
| `--color-primary-500` | `bg-primary-500`, `text-primary-500` | `className="bg-primary-500"` |
| `--color-primary-600` | `bg-primary-600`, `text-primary-600` | `className="hover:bg-primary-600"` |
| `--surface-primary` | `bg-surface-primary` | `className="bg-surface-primary"` |
| `--surface-elevated` | `bg-surface-elevated` | `className="bg-surface-elevated"` |
| `--surface-sunken` | `bg-surface-sunken` | `className="bg-surface-sunken"` |
| `--text-primary` | `text-text-primary` | `className="text-text-primary"` |
| `--text-secondary` | `text-text-secondary` | `className="text-text-secondary"` |
| `--text-disabled` | `text-text-disabled` | `className="text-text-disabled"` |
| `--border-primary` | `border-border-primary` | `className="border border-border-primary"` |
| `--space-4` (1rem) | `p-4`, `m-4`, `gap-4` | `className="p-4"` |
| `--space-6` (1.5rem) | `p-6`, `m-6`, `gap-6` | `className="gap-6"` |
| `--radius-sm` | `rounded-sm` | `className="rounded-sm"` |
| `--radius-md` | `rounded-md` | `className="rounded-md"` |
| `--radius-lg` | `rounded-lg` | `className="rounded-lg"` |
| `--shadow-sm` | `shadow-sm` | `className="shadow-sm"` |
| `--shadow-md` | `shadow-md` | `className="shadow-md"` |
| `--shadow-lg` | `shadow-lg` | `className="shadow-lg"` |
| `--font-display` | `font-display` | `className="font-display"` |
| `--font-body` | `font-body` | `className="font-body"` |
| `--font-mono` | `font-mono` | `className="font-mono"` |

---

## 5. Component Format Rules

### "use client" Directive

Add `"use client"` at the top of a file ONLY when the component uses:
- `useState`, `useEffect`, `useRef`, `useContext`, `useReducer`, `useCallback`, `useMemo`
- Event handlers: `onClick`, `onChange`, `onSubmit`, `onKeyDown`, etc.
- Browser APIs: `window`, `document`, `localStorage`, `navigator`
- Third-party hooks (e.g., `useRouter` from `next/navigation`)

Do NOT add `"use client"` when:
- The component only renders JSX markup with no interactivity
- The component only receives and displays props
- The component is a page.tsx that delegates interactivity to child components

**Strategy:** Keep page.tsx as a Server Component. Push interactivity down into `_components/` children marked with `"use client"`.

### Export Format

```tsx
// Pages — default export
export default function DashboardPage() { ... }

// Sub-components — named export
export function DashboardHeader() { ... }

// Client components — "use client" + named export
"use client";
export function SearchBar() { ... }
```

### TypeScript

- All props MUST be typed with TypeScript interfaces
- Define interfaces in the same file, above the component

```tsx
interface StatCardProps {
  title: string;
  value: string | number;
  trend?: "up" | "down" | "neutral";
  icon: React.ReactNode;
}

export function StatCard({ title, value, trend, icon }: StatCardProps) { ... }
```

---

## 6. Image Handling

- Use `<Image>` from `next/image` for ALL images
- Always provide `width` and `height` props, OR use `fill` prop with a sized container
- Use `priority` prop for above-the-fold hero images
- For placeholder images during composition: use a colored `<div>` with appropriate dimensions

```tsx
import Image from "next/image";

// Sized image
<Image src="/hero.jpg" alt="Hero banner" width={1200} height={600} priority className="rounded-lg" />

// Fill container
<div className="relative h-48 w-full">
  <Image src="/card-image.jpg" alt="Card visual" fill className="object-cover rounded-md" />
</div>

// Placeholder during composition
<div className="h-48 w-full rounded-md bg-surface-sunken" aria-label="Product image placeholder" />
```

---

## 7. Font Usage

- Fonts are loaded in the root `layout.tsx` via `next/font/google`
- Available as CSS variables on the `<html>` element: `--font-display`, `--font-body`, `--font-mono`
- Use via Tailwind: `font-display`, `font-body`, `font-mono`
- Do NOT attempt to load or import fonts in page or component files
- Do NOT use `@import url('fonts.googleapis.com/...')` anywhere

```tsx
// CORRECT — use Tailwind font utilities
<h1 className="font-display text-3xl font-bold">Dashboard</h1>
<p className="font-body text-base text-text-secondary">Welcome back</p>
<code className="font-mono text-sm">API_KEY=...</code>

// WRONG — never do this
import { Inter } from 'next/font/google'; // fonts belong in layout.tsx only
```

---

## 8. shadcn Component Usage

Use shadcn primitives where they match the design system spec:

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

// Button variants
<Button variant="default">Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Delete</Button>
<Button variant="ghost">Subtle</Button>
<Button variant="outline">Bordered</Button>
<Button size="sm">Small</Button>
<Button size="lg">Large</Button>

// Card with Tailwind extension
<Card className="bg-surface-elevated shadow-md">
  <CardHeader>
    <CardTitle className="font-display">Revenue</CardTitle>
    <CardDescription className="text-text-secondary">Monthly overview</CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    {/* content */}
  </CardContent>
</Card>

// Input with icon
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-secondary" />
  <Input className="pl-10" placeholder="Search..." />
</div>

// Badge
<Badge variant="default">Active</Badge>
<Badge variant="secondary">Pending</Badge>
<Badge variant="destructive">Failed</Badge>
```

For components not available in shadcn, compose with Tailwind utility classes on semantic HTML elements.

---

## 9. Anti-Slop Additions for Next.js

These checks extend the base Motif anti-slop checklist. Verify before writing each component:

- Am I using `style={{}}`? --> STOP. Use Tailwind `className` instead.
- Am I writing `var(--color-primary-500)` in JSX? --> STOP. Use `className="bg-primary-500"` or `className="text-primary-500"`.
- Am I using `<img>`? --> STOP. Use `<Image>` from `next/image`.
- Am I importing a font? --> STOP. Fonts come from `layout.tsx` via `next/font`.
- Am I putting `"use client"` on a `page.tsx` that only renders markup? --> STOP. Keep it a Server Component. Push interactivity to child components.
- Am I using `<a>` for internal navigation? --> STOP. Use `<Link>` from `next/link`.
- Am I writing a CSS file for component styles? --> STOP. Use Tailwind utilities.
- Am I hardcoding a color hex value? --> STOP. Find the matching Tailwind utility from the token map above.
- Am I using `React.FC` or `React.FunctionComponent`? --> STOP. Use plain function declarations with typed props.
