# Vite + React Router — Composer Overlay

> **CRITICAL:** This document OVERRIDES default HTML composition behavior. When this overlay is active, generated output MUST follow Vite + React Router conventions. If any base composition rule conflicts with this overlay, this overlay wins.

---

## 1. File Output Rules

| File Type | Path Pattern | Notes |
|-----------|--------------|-------|
| Route page | `src/pages/{RouteName}Page.tsx` | Standard React component export |
| Router helper | `src/app/router.tsx` | Owns `createBrowserRouter` config |
| App shell | `src/app/AppShell.tsx` | Shared layout with `<Outlet />` |
| Shared component | `src/components/{Name}.tsx` | Reusable components across routes |
| Optional route section | `src/pages/{RouteName}/components/{Name}.tsx` | Route-specific composition helpers |

- Do NOT emit Next.js App Router paths such as `src/app/{route}/page.tsx`.
- Root routing must be client-side, mounted from `src/main.tsx`.
- Route pages are ordinary React components, not server components.
- Keep page output decomposed across route pages and shared components.

---

## 2. Import Rules

```tsx
import { Link, NavLink, Outlet, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ArrowRight, Search, Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
```

- Use imports from `react-router-dom` for navigation and router composition.
- Use `lucide-react` for icons when icons are needed.
- Use standard `<img>` for image rendering in Vite output.
- Use local React imports for hooks (`useState`, `useMemo`, `useEffect`) when needed.

### Explicitly forbidden imports

- `next/image`
- `next/link`
- `next/font`
- `next/navigation`
- Any runtime import from `.planning/`

---

## 3. Styling Rules

- Use Tailwind utility classes in JSX (`className`) for all component styling.
- Use Motif semantic utility names produced by the token bridge (for example `bg-surface-primary`, `text-text-primary`, `border-border-primary`).
- Prefer class composition over bespoke CSS files for route components.

### Prohibited styling patterns

- No inline style objects (`style={{ ... }}`).
- No raw CSS custom-property references in JSX (`var(--color-primary-500)`).
- No hardcoded hex colors in JSX.
- No direct imports from `.planning/design/system/*` at runtime.
- no .planning/ runtime imports.

---

## 4. Route Composition Rules

- Router contract belongs in `src/app/router.tsx` using `createBrowserRouter`.
- App bootstrap in `src/main.tsx` must mount `<RouterProvider router={appRouter} />`.
- App shell should wrap child routes with `<Outlet />`.
- Route pages belong in `src/pages/` and are mapped in router config.
- Keep route trees modular; split routes/pages/components into separate files.

### Rejection criteria

- Reject monolithic single-file route trees where router, shell, and all page sections are jammed into one file.
- Reject outputs that mimic Next.js App Router segment conventions.
- Reject outputs that bypass router helpers and place everything directly in `main.tsx`.

---

## 5. Token + Utility Mapping

| Intent | Utility Examples |
|--------|------------------|
| Surface backgrounds | `bg-surface-primary`, `bg-surface-elevated`, `bg-surface-sunken` |
| Primary accents | `bg-primary-500`, `text-primary-600`, `border-primary-500` |
| Text hierarchy | `text-text-primary`, `text-text-secondary`, `text-text-disabled` |
| Borders | `border-border-primary`, `border-border-secondary` |
| Radius | `rounded-sm`, `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-full` |
| Shadows | `shadow-sm`, `shadow-md`, `shadow-lg` |
| Layout spacing | `p-4`, `p-6`, `gap-4`, `gap-6`, `mx-auto`, `max-w-6xl` |

Use this utility approach instead of embedding design token variables directly in JSX.

---

## 6. Component Format Rules

- Pages: named exports are acceptable (`export function HomePage() { ... }`).
- Shared sections/primitives: one component per file in `src/components/` or route-specific folders.
- Strong typing: define TypeScript interfaces for props in each component file.
- Keep generated files focused and composable; avoid files >150 lines when possible.

---

## 7. Image and Font Rules

- Use standard `<img>` tags with meaningful `alt` text.
- Respect responsive behavior with Tailwind classes (`w-full`, `object-cover`, `aspect-*`).
- Fonts should come from project CSS/Tailwind setup. Do not import `next/font`.
- No framework-specific font helpers in component files.

---

## 8. Anti-Slop Additions (Vite-Specific)

Before finalizing output, verify:

- No `next/*` imports anywhere in Vite-composed files.
- No `.planning/` runtime imports.
- No inline style objects.
- No `var(--token)` expressions in JSX.
- No App Router file placement (`src/app/{segment}/page.tsx`).
- Router files exist in `src/app/` and pages exist in `src/pages/`.
- Route output is decomposed into pages/components, not one giant file.
- Generated code aligns with client-side React Router semantics.

If any item fails, regenerate with this overlay as the source of truth.
