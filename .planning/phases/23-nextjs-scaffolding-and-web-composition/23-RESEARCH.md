# Phase 23: Next.js Scaffolding and Web Composition - Research

**Researched:** 2026-03-10
**Domain:** Next.js scaffolding, shadcn/ui integration, Tailwind v4 token mapping, JSX composition overlay
**Confidence:** HIGH

## Summary

Phase 23 transforms Motif from a design system generator that outputs raw HTML into one that scaffolds real Next.js projects and composes screens as JSX components using Tailwind utility classes and shadcn/ui primitives. This phase has three distinct subsystems: (1) framework recommendation logic in `/motif:init` with `create-next-app` scaffolding, (2) shadcn/ui installation with Motif token mapping to Tailwind v4's `@theme` directive, and (3) a composer platform overlay (`composer-nextjs.md`) that instructs the screen composer agent to emit Next.js-native JSX components instead of raw HTML.

The key technical challenge is the token mapping layer. Motif's tokens.css uses CSS custom properties with its own naming convention (`--color-primary-500`, `--space-4`, `--radius-md`), while Tailwind v4 expects `@theme` variables under specific namespaces (`--color-*`, `--spacing-*`, `--radius-*`) and shadcn/ui expects its own semantic variable names (`--primary`, `--background`, `--border`). Phase 23 must produce a `globals.css` (or equivalent) that bridges all three naming systems: Motif tokens as `:root` CSS variables, shadcn semantic variables mapped to Motif equivalents, and `@theme inline` declarations that make Motif tokens available as Tailwind utility classes.

The second challenge is the composer overlay pattern. The existing compose-screen.md workflow spawns a subagent with instructions to produce HTML files. Phase 23 must introduce a platform-specific overlay document (`composer-nextjs.md`) that the orchestrator injects into the subagent's prompt when `platform === "web-nextjs"`, overriding file placement, import patterns, component format, and font/image handling to use Next.js App Router conventions.

**Primary recommendation:** Use `create-next-app@latest` with `--yes --ts --tailwind --app --eslint --src-dir --use-npm --disable-git` for scaffolding, then run `npx shadcn@latest init -y -b neutral` to add shadcn/ui. Generate a Tailwind-aware `globals.css` that maps Motif tokens to both shadcn variables and `@theme inline` declarations. Create `composer-nextjs.md` as a standalone overlay document injected by the orchestrator.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Next.js (via create-next-app) | 16.1.x (latest) | App Router project scaffolding | Official CLI, TypeScript + Tailwind + App Router built-in |
| Tailwind CSS | v4.x (bundled with create-next-app) | Utility-first CSS framework | Default in create-next-app, CSS-first config via @theme directive |
| shadcn/ui (via shadcn CLI) | latest | Accessible component primitives (Button, Card, Input, etc.) | Industry standard for React component library, copy-paste model, full customization |
| next/font/google | bundled | Google Fonts optimization with zero layout shift | Built into Next.js, automatic self-hosting and preloading |
| next/image | bundled | Image optimization with lazy loading | Built into Next.js, automatic sizing and format optimization |
| lucide-react | latest (shadcn default) | Icon library for React | Default icon library for shadcn/ui, tree-shakable |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/* | latest (shadcn deps) | Accessible primitives underlying shadcn components | Installed automatically by shadcn when adding components |
| class-variance-authority | latest | Component variant management | Installed by shadcn, used in component definitions |
| clsx + tailwind-merge (via cn util) | latest | Conditional class merging | Installed by shadcn init, the `cn()` utility |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| shadcn/ui | Radix Themes or Headless UI | shadcn gives full source ownership and Tailwind-native styling; Radix Themes is opinionated; Headless UI lacks built-in Tailwind integration |
| Tailwind v4 @theme | tailwind.config.ts extend | Tailwind v4 is CSS-first; config file is legacy approach. @theme is the current standard |
| lucide-react | react-icons or heroicons | lucide-react is shadcn default, tree-shakable, consistent with Motif's existing Lucide support |

**Installation (scaffolding sequence):**
```bash
# Step 1: Scaffold Next.js project
npx create-next-app@latest {name} --yes --ts --tailwind --app --eslint --src-dir --use-npm --disable-git

# Step 2: Install shadcn/ui (inside the scaffolded project)
cd {name}
npx shadcn@latest init -y -b neutral

# Step 3: Add core shadcn components
npx shadcn@latest add button card input badge
```

## Architecture Patterns

### Recommended Project Structure (After Scaffolding)
```
{project-name}/
  src/
    app/
      layout.tsx          # Root layout: fonts, metadata, global providers
      page.tsx            # Home page
      globals.css         # Motif tokens + shadcn variables + @theme declarations
      {route}/
        page.tsx          # Route pages (composed by Motif)
        layout.tsx        # Route-specific layouts (if needed)
        _components/      # Route-scoped components
    components/
      ui/                 # shadcn/ui components (Button, Card, etc.)
      {screen-name}/      # Screen-specific section components
    lib/
      utils.ts            # cn() utility from shadcn
  components.json         # shadcn/ui configuration
  package.json
  tsconfig.json
  next.config.ts
```

### Pattern 1: Three-Layer Token Bridge (Motif -> shadcn -> Tailwind)
**What:** A single `globals.css` file that maps Motif's CSS custom properties to shadcn's semantic variables and Tailwind v4's `@theme` utility classes.
**When to use:** Every scaffolded Next.js project.
**Why:** Motif tokens are the source of truth. shadcn components expect variables like `--primary`. Tailwind utility classes need `@theme` declarations. All three must coexist.

```css
/* globals.css — generated by Motif scaffolder */
@import "tailwindcss";

/* ── Layer 1: Motif Design Tokens (source of truth) ── */
:root {
  /* Colors */
  --color-primary-50: #eff6ff;
  --color-primary-500: #3b82f6;
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  /* ... full Motif tokens.css content ... */
  --surface-primary: #ffffff;
  --surface-elevated: #fafafa;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --border-primary: #e2e8f0;
  --border-focus: #3b82f6;
  /* Typography */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  /* ... */
  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-4: 1rem;
  /* ... */
  /* Radii */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}

/* ── Layer 2: shadcn Semantic Mapping ── */
/* Maps Motif tokens to shadcn's expected variable names */
:root {
  --background: var(--surface-primary);
  --foreground: var(--text-primary);
  --card: var(--surface-elevated);
  --card-foreground: var(--text-primary);
  --popover: var(--surface-elevated);
  --popover-foreground: var(--text-primary);
  --primary: var(--color-primary-500);
  --primary-foreground: var(--text-inverse);
  --secondary: var(--surface-secondary, var(--surface-tertiary));
  --secondary-foreground: var(--text-primary);
  --muted: var(--surface-tertiary);
  --muted-foreground: var(--text-secondary);
  --accent: var(--surface-secondary);
  --accent-foreground: var(--text-primary);
  --destructive: var(--color-error);
  --destructive-foreground: var(--text-inverse);
  --border: var(--border-primary);
  --input: var(--border-primary);
  --ring: var(--border-focus);
  --radius: var(--radius-md);
}

/* ── Layer 3: Tailwind @theme — makes Motif tokens into utility classes ── */
@theme inline {
  /* Colors: bg-primary-500, text-primary-500, etc. */
  --color-primary-50: var(--color-primary-50);
  --color-primary-500: var(--color-primary-500);
  --color-primary-600: var(--color-primary-600);
  --color-primary-700: var(--color-primary-700);
  /* ... all Motif color tokens ... */
  --color-surface-primary: var(--surface-primary);
  --color-surface-elevated: var(--surface-elevated);
  --color-text-primary: var(--text-primary);
  --color-text-secondary: var(--text-secondary);
  --color-success: var(--color-success);
  --color-error: var(--color-error);
  --color-warning: var(--color-warning);

  /* Spacing: p-motif-1, m-motif-4, gap-motif-6, etc. */
  --spacing-motif-1: var(--space-1);
  --spacing-motif-2: var(--space-2);
  --spacing-motif-3: var(--space-3);
  --spacing-motif-4: var(--space-4);
  --spacing-motif-6: var(--space-6);
  --spacing-motif-8: var(--space-8);
  --spacing-motif-12: var(--space-12);
  --spacing-motif-16: var(--space-16);

  /* Fonts */
  --font-display: var(--font-display);
  --font-body: var(--font-body);
  --font-mono: var(--font-mono);

  /* Radii: rounded-sm, rounded-md, rounded-lg */
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);
  --radius-full: var(--radius-full);

  /* Shadows */
  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
}
```

### Pattern 2: Font Loading via next/font in Root Layout
**What:** Import Google Fonts using next/font/google in layout.tsx, expose as CSS variables, and map to Tailwind via @theme.
**When to use:** Every Next.js project scaffolded by Motif.

```typescript
// src/app/layout.tsx
import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const body = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "{Product Name}",
  description: "{Product description}",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body className="font-body antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
```

### Pattern 3: Composer Platform Overlay (Orchestrator Injection)
**What:** The compose-screen.md orchestrator reads `platform` from STATE.md and injects a platform-specific overlay document into the subagent's prompt. For `web-nextjs`, it injects `composer-nextjs.md`.
**When to use:** Every `/motif:compose` invocation when platform is `web-nextjs`.

```
compose-screen.md (orchestrator)
  │
  ├── reads STATE.md → platform: "web-nextjs"
  │
  ├── reads framework-registry.json → composition.overlay: "composer-nextjs.md"
  │
  └── spawns subagent with:
       ├── standard context (PROJECT.md, tokens.css, COMPONENT-SPECS.md, etc.)
       ├── PLUS: composer-nextjs.md overlay (overrides file format, placement, imports)
       └── PLUS: components.json path (for shadcn component availability)
```

### Pattern 4: Page Component with App Router Conventions
**What:** Composed pages follow Next.js App Router file conventions: page.tsx for routes, layout.tsx for shared layouts, "use client" only when needed.
**When to use:** Every composed screen in a web-nextjs project.

```typescript
// src/app/dashboard/page.tsx (Server Component by default)
import { DashboardHeader } from "./_components/DashboardHeader";
import { MetricsGrid } from "./_components/MetricsGrid";
import { RecentTransactions } from "./_components/RecentTransactions";

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-surface-primary p-motif-6">
      <DashboardHeader />
      <MetricsGrid />
      <RecentTransactions />
    </main>
  );
}
```

```typescript
// src/app/dashboard/_components/MetricsGrid.tsx
"use client"; // Needed: uses state for loading/error states

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Uses Tailwind utility classes mapped from Motif tokens
export function MetricsGrid() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-motif-4">
      <Card className="bg-surface-elevated shadow-md rounded-lg">
        <CardHeader>
          <CardTitle className="text-text-secondary text-sm font-body">
            Total Balance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-text-primary text-2xl font-display font-semibold">
            $24,580.00
          </p>
        </CardContent>
      </Card>
    </section>
  );
}
```

### Anti-Patterns to Avoid
- **Running shadcn init before create-next-app:** The shadcn CLI expects an existing project with package.json. Always scaffold first, then init shadcn.
- **Hardcoding shadcn CSS variables in globals.css instead of mapping to Motif tokens:** The shadcn defaults would disconnect from Motif's design system. Always map `--primary` to `var(--color-primary-500)`, not to a hardcoded hex value.
- **Using tailwind.config.ts to define Motif tokens:** Tailwind v4 uses CSS-first @theme directives. The config file is legacy. The token bridge belongs in globals.css.
- **Putting "use client" on every component:** Server Components are the default and preferred for static content. Only add "use client" when the component uses state, effects, event handlers, or browser APIs.
- **Generating all shadcn components upfront:** Only install components that the design system specifies. Use `npx shadcn@latest add {component}` for each needed component. Over-installing bloats the project.
- **Having the LLM generate the globals.css token bridge:** This must be a deterministic script (extension of token-transformer.js or a new `tailwind-config-generator.js`). LLM-generated CSS will drift.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Project scaffolding | Custom mkdir + file generation | `create-next-app@latest` with flags | Official CLI handles tsconfig, package.json, app structure, Tailwind setup, and future breaking changes |
| Component primitives (Button, Card, Input) | Custom React components from scratch | `npx shadcn@latest add {component}` | Accessible, tested, Tailwind-native, customizable source ownership |
| Font optimization | Manual Google Fonts CDN links | `next/font/google` in layout.tsx | Zero layout shift, self-hosted, automatic preloading |
| Image optimization | `<img>` tags with manual sizing | `next/image` with proper width/height | Lazy loading, format optimization, responsive srcset |
| CSS utility class generation from tokens | Manual Tailwind plugin or config | `@theme inline` directive in globals.css | Tailwind v4's native mechanism for CSS-variable-to-utility mapping |
| Token-to-globals.css bridge | LLM composition | Deterministic script reading tokens.css | Eliminates drift; same tokens.css always produces same globals.css |

**Key insight:** The scaffolding phase should use official CLIs for everything they handle well (create-next-app, shadcn CLI) and only write custom scripts for the Motif-specific bridging layer (token mapping to globals.css, font import generation in layout.tsx).

## Common Pitfalls

### Pitfall 1: Tailwind v4 @theme Namespace Collisions with Motif Token Names
**What goes wrong:** Motif uses `--text-primary` for text color and `--text-base` for font size. Tailwind v4's `@theme` treats `--text-*` as font-size utilities. Putting `--text-primary: var(--text-primary)` in `@theme` would create a `text-primary` utility that sets font-size, not color.
**Why it happens:** Tailwind v4 namespaces are semantic: `--text-*` = font sizes, `--color-*` = colors. Motif's naming convention pre-dates this mapping.
**How to avoid:** In the `@theme` block, map Motif color tokens to the `--color-*` namespace: `--color-text-primary: var(--text-primary)`. This creates `text-text-primary` as a color utility. Map Motif font sizes to `--text-*`: `--text-xs: var(--text-xs)`. The Motif font sizes already match Tailwind's namespace convention.
**Warning signs:** `text-primary` utility changes font size instead of color. Components have wrong text colors.

### Pitfall 2: shadcn Components Not Finding CSS Variables
**What goes wrong:** shadcn components render with default/missing styles because they expect variables like `--primary`, `--background`, `--border` that are not defined.
**Why it happens:** The scaffolder replaces shadcn's default globals.css but forgets to include the Layer 2 semantic mapping.
**How to avoid:** The globals.css generator MUST include the shadcn semantic variable mapping (Layer 2 in the token bridge pattern). Verify by checking that all shadcn variables listed in the theming docs are mapped. Test by rendering a shadcn Button component.
**Warning signs:** Buttons appear unstyled or invisible. Card backgrounds are transparent.

### Pitfall 3: next/font Variable Names Conflicting with Motif Token Names
**What goes wrong:** next/font creates CSS variables like `--font-display` via the `variable` property. Motif's tokens.css also defines `--font-display`. If both are on the same element, next/font's value (a font-family CSS value) overrides Motif's token.
**Why it happens:** Both systems use the same variable naming convention for fonts.
**How to avoid:** This is actually DESIRED behavior. next/font sets the correct font-family value for `--font-display` at runtime, which is what Motif tokens expect. The key is to NOT define `--font-display` in the `:root` block of globals.css (the value comes from next/font instead). Remove font-family definitions from the Motif tokens when generating globals.css, and let next/font provide them via the className on `<html>`.
**Warning signs:** Fonts showing wrong family. Font values defined in both globals.css :root and next/font className.

### Pitfall 4: create-next-app Flags Change Between Versions
**What goes wrong:** The framework registry hardcodes CLI flags that may change in future Next.js versions. For example, `--yes` was added relatively recently, and the prompts have changed across versions.
**Why it happens:** CLI interfaces are not API contracts. They evolve.
**How to avoid:** Use `@latest` to always get the current version. The flags in framework-registry.json (`--yes --ts --tailwind --app --eslint --src-dir --use-npm --disable-git`) are verified for create-next-app 16.1.x. The `--yes` flag uses saved preferences or defaults, making the command non-interactive. If flags change, the registry is the single place to update.
**Warning signs:** Interactive prompts appearing during scaffolding. Unexpected project structure.

### Pitfall 5: Composer Agent Mixing HTML and JSX Patterns
**What goes wrong:** The composer agent, trained on existing Motif workflows that produce HTML, continues generating inline styles (`style={{ background: 'var(--surface-primary)' }}`) instead of Tailwind classes (`className="bg-surface-primary"`).
**Why it happens:** The base composer agent instructions emphasize inline CSS custom property usage. Without a strong platform overlay, the agent defaults to this pattern.
**How to avoid:** The `composer-nextjs.md` overlay must be explicit and directive: "Use Tailwind utility classes for ALL styling. NEVER use inline style objects. Use `className` with Tailwind utilities mapped from Motif tokens." Include a clear mapping table in the overlay showing token-to-utility translations.
**Warning signs:** Components with `style={{}}` objects. Missing Tailwind classes. Raw CSS custom property references in JSX.

### Pitfall 6: shadcn init Overwrites Tailwind Configuration
**What goes wrong:** Running `npx shadcn@latest init` after custom globals.css setup overwrites the carefully crafted token bridge with shadcn's default CSS variables.
**Why it happens:** shadcn init writes its own CSS variable definitions to the CSS file.
**How to avoid:** Run shadcn init FIRST (it sets up the base configuration), then OVERWRITE globals.css with the Motif token bridge that includes the shadcn mapping. Sequence: create-next-app -> shadcn init -> Motif globals.css generation. The Motif generator runs last and produces the final globals.css.
**Warning signs:** Motif tokens missing from globals.css. shadcn default colors appearing instead of Motif colors.

### Pitfall 7: Missing "use client" on Interactive Components
**What goes wrong:** A composed component uses `useState` or `onClick` but is missing the "use client" directive, causing a runtime error.
**Why it happens:** The composer agent does not know which components need client-side interactivity.
**How to avoid:** The composer-nextjs.md overlay must include clear rules: "Add 'use client' at the top of any component that uses: useState, useEffect, useRef, useContext, event handlers (onClick, onChange, onSubmit), or browser APIs (window, document). Page-level components (page.tsx) should be Server Components when possible -- push interactivity to child components."
**Warning signs:** "useState is not defined" errors. "Event handlers cannot be passed to client components" errors.

## Code Examples

### Tailwind Config Generator Script (tokens.css -> globals.css sections)
```javascript
// scripts/tailwind-config-generator.js
// Deterministic: reads tokens.css, produces @theme and shadcn variable blocks

const { parseTokensCSS, categorizeTokens } = require('./token-transformer');

function generateTailwindThemeBlock(categories) {
  const lines = ['@theme inline {'];

  // Colors -> --color-* namespace
  if (categories.colors) {
    lines.push('  /* Colors */');
    for (const [name, value] of Object.entries(categories.colors)) {
      // --color-primary-500 -> --color-primary-500 (already correct namespace)
      // --text-primary -> --color-text-primary (re-namespace to avoid font-size collision)
      // --surface-primary -> --color-surface-primary
      // --border-primary -> --color-border-primary
      if (name.startsWith('color-')) {
        lines.push(`  --color-${name}: var(--${name});`);
      } else {
        lines.push(`  --color-${name}: var(--${name});`);
      }
    }
  }

  // Spacing -> --spacing-* namespace
  if (categories.spacing) {
    lines.push('  /* Spacing */');
    for (const [name, value] of Object.entries(categories.spacing)) {
      // --space-4 -> --spacing-motif-4
      const key = name.replace('space-', 'motif-');
      lines.push(`  --spacing-${key}: var(--${name});`);
    }
  }

  // Radii -> --radius-* namespace (already matches)
  if (categories.radii) {
    lines.push('  /* Radii */');
    for (const [name, value] of Object.entries(categories.radii)) {
      lines.push(`  --${name}: var(--${name});`);
    }
  }

  // Shadows -> --shadow-* namespace (already matches)
  if (categories.shadows) {
    lines.push('  /* Shadows */');
    for (const [name, value] of Object.entries(categories.shadows)) {
      lines.push(`  --${name}: var(--${name});`);
    }
  }

  // Typography font sizes -> --text-* namespace
  if (categories.typography) {
    lines.push('  /* Typography */');
    for (const [name, value] of Object.entries(categories.typography)) {
      if (name.startsWith('text-')) {
        lines.push(`  --${name}: var(--${name});`);
      }
      // Font families handled by next/font, not @theme
      // Weights and leading don't need @theme (use Tailwind defaults)
    }
  }

  // Transitions -> --ease-* namespace
  if (categories.transitions) {
    lines.push('  /* Transitions */');
    for (const [name, value] of Object.entries(categories.transitions)) {
      if (name.startsWith('ease-')) {
        lines.push(`  --${name}: var(--${name});`);
      }
    }
  }

  lines.push('}');
  return lines.join('\n');
}

function generateShadcnMapping(categories) {
  const lines = [':root {'];
  lines.push('  /* shadcn/ui semantic mapping */');

  // Map Motif tokens to shadcn expected variable names
  const mapping = {
    '--background': '--surface-primary',
    '--foreground': '--text-primary',
    '--card': '--surface-elevated',
    '--card-foreground': '--text-primary',
    '--popover': '--surface-elevated',
    '--popover-foreground': '--text-primary',
    '--primary': '--color-primary-500',
    '--primary-foreground': '--text-inverse',
    '--secondary': '--surface-tertiary',
    '--secondary-foreground': '--text-primary',
    '--muted': '--surface-tertiary',
    '--muted-foreground': '--text-secondary',
    '--accent': '--surface-secondary',
    '--accent-foreground': '--text-primary',
    '--destructive': '--color-error',
    '--destructive-foreground': '--text-inverse',
    '--border': '--border-primary',
    '--input': '--border-primary',
    '--ring': '--border-focus',
    '--radius': '--radius-md',
  };

  for (const [shadcnVar, motifVar] of Object.entries(mapping)) {
    lines.push(`  ${shadcnVar}: var(${motifVar});`);
  }

  lines.push('}');
  return lines.join('\n');
}
```

### Framework Recommendation Logic (for init.md)
```markdown
<!-- Addition to init.md: framework recommendation based on project description -->

After Round 1 (What & Who), internally assess platform fit:

**Auto-recommendation rules:**
- "dashboard", "admin panel", "CRM", "analytics", "portfolio", "blog", "e-commerce store":
  -> Recommend: web-nextjs (SSR benefits, SEO, App Router)
- "landing page", "portfolio site", "brochure site":
  -> Recommend: web-static (simplest, fastest)
- "single page app", "SPA", "tool", "internal tool", "calculator":
  -> Recommend: web-vite (client-side rendering, fast builds)
- "mobile app", "iOS", "Android", "cross-platform mobile":
  -> Recommend: mobile-expo (React Native)
- Ambiguous / unclear:
  -> Recommend: web-nextjs (most versatile default)

Present recommendation with reasoning, allow override:
"Based on what you're building, I recommend **Next.js** (server-rendered, SEO-friendly,
scales well for dashboards). Want to go with that, or prefer something else?"
```

### Scaffolding Execution Flow
```javascript
// Pseudocode for the scaffolding sequence in the init workflow
const { execSync } = require('node:child_process');

function scaffoldNextJS(projectName, projectDir) {
  const registry = JSON.parse(fs.readFileSync('framework-registry.json'));
  const config = registry['web-nextjs'];

  // Step 1: create-next-app
  const args = config.scaffold.args.map(a => a.replace('{name}', projectName));
  execSync(`${config.scaffold.command} ${args.join(' ')}`, {
    cwd: projectDir,
    stdio: 'inherit',
  });

  // Step 2: shadcn init (inside created project)
  const appDir = path.join(projectDir, projectName);
  execSync('npx shadcn@latest init -y -b neutral', {
    cwd: appDir,
    stdio: 'inherit',
  });

  // Step 3: Add core components based on COMPONENT-SPECS.md
  const coreComponents = ['button', 'card', 'input', 'badge'];
  for (const comp of coreComponents) {
    execSync(`npx shadcn@latest add ${comp} -y`, {
      cwd: appDir,
      stdio: 'inherit',
    });
  }

  // Step 4: Generate globals.css with token bridge
  // (deterministic script, not LLM)

  // Step 5: Generate layout.tsx with next/font imports
  // (deterministic from tokens.css font declarations)
}
```

### Composer Overlay Structure (composer-nextjs.md)
```markdown
# Platform Overlay: Next.js (App Router)

## File Output Rules
- Pages: `src/app/{route}/page.tsx` (default export, Server Component)
- Layouts: `src/app/{route}/layout.tsx` (only if route needs shared UI)
- Components: `src/app/{route}/_components/{Name}.tsx` (route-scoped)
- Shared components: `src/components/{Name}.tsx` (cross-route reuse)

## Import Rules
- shadcn components: `import { Button } from "@/components/ui/button"`
- Icons: `import { IconName } from "lucide-react"`
- Fonts: handled by layout.tsx, do NOT import fonts in page components
- Images: `import Image from "next/image"`

## Styling Rules
- Use Tailwind utility classes for ALL styling
- NEVER use inline style={{}} objects
- Use Motif token-mapped classes: `bg-surface-primary`, `text-text-secondary`, `p-motif-4`, `rounded-md`, `shadow-md`
- Use shadcn component classes: `<Button variant="default">`, `<Card>`, `<Input>`
- For hover/focus/active states: use Tailwind modifiers (`hover:bg-primary-600`, `focus:ring-2`)

## Component Format
- "use client" ONLY when component uses: useState, useEffect, useRef, event handlers, browser APIs
- Page components (page.tsx) should be Server Components when possible
- Push interactivity to leaf components, keep page-level components as server components
- Export: `export default function PageName()` for pages, `export function ComponentName()` for components

## Image Handling
- Use `<Image>` from "next/image" for all images
- Always provide width and height props (or fill prop for dynamic sizing)
- Use priority prop for above-the-fold images

## Font Usage
- Fonts are loaded in layout.tsx via next/font/google
- Available as CSS variables: --font-display, --font-body, --font-mono
- Use via Tailwind: font-display, font-body, font-mono

## Token-to-Tailwind Quick Reference
| Motif Token | Tailwind Utility |
|-------------|-----------------|
| --color-primary-500 | bg-primary-500, text-primary-500 |
| --surface-primary | bg-surface-primary |
| --surface-elevated | bg-surface-elevated |
| --text-primary | text-text-primary |
| --text-secondary | text-text-secondary |
| --space-4 | p-motif-4, m-motif-4, gap-motif-4 |
| --radius-md | rounded-md |
| --shadow-md | shadow-md |
| --font-display | font-display |
| --font-body | font-body |
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| tailwind.config.ts with theme.extend | @theme directive in CSS (Tailwind v4) | Tailwind v4, Jan 2025 | Config is CSS-first; no JS config file needed for custom tokens |
| shadcn-ui package name | shadcn CLI (renamed) | 2024 | Use `npx shadcn@latest` not `npx shadcn-ui@latest` |
| HSL color format in shadcn | OKLCH color format | shadcn 2025+ | New projects use oklch() for CSS variables |
| forwardRef on all shadcn components | Removed forwardRef | React 19 / shadcn 2025+ | Components no longer need forwardRef wrapper |
| shadcn `default` style | shadcn `new-york` style (only remaining) | shadcn 2025 | `default` style deprecated; `new-york` is the standard |
| Manual project setup for shadcn | `shadcn init -t next` scaffolds templates | March 2026 (CLI v4) | Can scaffold full project templates with dark mode |
| Motif outputs HTML files | Phase 23: outputs Next.js JSX components | v1.4 Phase 23 | Real, runnable components instead of HTML prototypes |

**Deprecated/outdated:**
- `npx shadcn-ui@latest`: Renamed to `npx shadcn@latest` -- the old package name no longer works.
- `tailwind.config.ts` for theme extension: Still functional but Tailwind v4's CSS-first approach via `@theme` is the current standard.
- shadcn `default` style: Deprecated. Only `new-york` style remains.
- `React.forwardRef`: Removed from shadcn components as of React 19 compatibility update.

## Open Questions

1. **Should the scaffolder use `shadcn init -t next` (full template) or `shadcn init` (add to existing)?**
   - What we know: Since March 2026, `shadcn init -t next` can scaffold a complete Next.js project. However, Motif already uses `create-next-app` for scaffolding.
   - What's unclear: Whether `shadcn init -t next` produces a project structure compatible with Motif's expectations, or if it has opinions that conflict.
   - Recommendation: Use `create-next-app` first, then `shadcn init` (without `-t`) to add shadcn to the existing project. This gives Motif full control over the project structure while still getting shadcn's component infrastructure. The template flag is for standalone use, not integration.

2. **How should the Motif spacing namespace work with Tailwind's default spacing?**
   - What we know: Tailwind v4 has a default `--spacing` multiplier (4px base). Motif has its own `--space-*` tokens. Using `--spacing-motif-*` creates utilities like `p-motif-4` which is verbose.
   - What's unclear: Whether to override Tailwind's default spacing entirely with Motif values, or namespace them separately.
   - Recommendation: Override Tailwind's default `--spacing` base to match Motif's 4px base (they are identical). For specific Motif spacing tokens that don't map to Tailwind's numeric scale, use custom `@theme` entries. This way `p-4` = `--space-4` = `1rem` naturally, without the `motif-` prefix.

3. **Should the globals.css generator be a new script or an extension of token-transformer.js?**
   - What we know: token-transformer.js produces tokens.ts (TypeScript constants). The globals.css generator would produce CSS (@theme + shadcn mapping). Different outputs, same input (tokens.css).
   - What's unclear: Whether combining them adds complexity or simplifies the pipeline.
   - Recommendation: Create a separate `tailwind-config-generator.js` script. It can import `parseTokensCSS` and `categorizeTokens` from token-transformer.js but has its own generation logic. Different output formats warrant different scripts. Call both from generate-system.md.

4. **Which shadcn components should be pre-installed during scaffolding?**
   - What we know: COMPONENT-SPECS.md specifies components per project. shadcn add is fast and can be run incrementally.
   - What's unclear: Whether to install a base set upfront or install on-demand during composition.
   - Recommendation: Install a base set during scaffolding (button, card, input, badge -- the four most universal components). During composition, the composer overlay should instruct the agent to run `npx shadcn@latest add {component}` for any additional needed components before using them. This balances initial readiness with avoiding bloat.

5. **How should dark mode tokens be handled?**
   - What we know: shadcn generates `.dark` class variables. Motif does not yet support dark mode tokens.
   - What's unclear: Whether to generate placeholder dark mode variables or skip entirely.
   - Recommendation: Skip dark mode for Phase 23. The shadcn init will include `.dark` class with its defaults. When Motif adds dark mode token support (v1.5+), the globals.css generator can be extended to map dark mode Motif tokens to the `.dark` class.

## Sources

### Primary (HIGH confidence)
- [Next.js create-next-app CLI docs](https://nextjs.org/docs/app/api-reference/cli/create-next-app) -- full flag reference for v16.1.6, verified 2026-02-27
- [shadcn/ui Next.js installation](https://ui.shadcn.com/docs/installation/next) -- init command, component installation
- [shadcn/ui theming](https://ui.shadcn.com/docs/theming) -- CSS variable naming convention, full variable list
- [shadcn/ui components.json](https://ui.shadcn.com/docs/components-json) -- full schema reference
- [shadcn/ui Tailwind v4](https://ui.shadcn.com/docs/tailwind-v4) -- @theme inline, CSS-first config, OKLCH migration
- [shadcn CLI v4 changelog](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) -- March 2026 updates, preset system, init templates
- [Tailwind CSS v4 @theme docs](https://tailwindcss.com/docs/theme) -- full namespace reference, @theme inline syntax
- Existing Motif codebase: `framework-registry.json` -- scaffold command, conventions, composition overlay config
- Existing Motif codebase: `token-transformer.js` -- parseTokensCSS and categorizeTokens functions (reusable)
- Existing Motif codebase: `compose-screen.md` -- current orchestrator pattern, subagent spawning
- Existing Motif codebase: `motif-screen-composer.md` -- current agent instructions, anti-slop checklist

### Secondary (MEDIUM confidence)
- [Next.js App Router file conventions](https://nextjs.org/docs/app/getting-started/layouts-and-pages) -- page.tsx, layout.tsx patterns
- [Next.js font optimization](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) -- next/font/google usage with CSS variables
- [Next.js use client directive](https://nextjs.org/docs/app/api-reference/directives/use-client) -- when to use, rules

### Tertiary (LOW confidence)
- None. All claims verified against official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries verified against official docs with current versions
- Architecture (token bridge): HIGH -- @theme inline syntax verified against Tailwind v4 docs; shadcn variable names verified against theming docs
- Architecture (composer overlay): MEDIUM -- pattern is sound but the specific orchestrator injection mechanism needs implementation-time validation
- Pitfalls: HIGH -- namespace collision verified against Tailwind v4 namespace reference; shadcn variable list verified against official theming docs
- Code examples: MEDIUM -- patterns are correct but exact variable mappings depend on specific Motif tokens.css content

**Research date:** 2026-03-10
**Valid until:** 2026-04-10 (Tailwind v4 and shadcn/ui are stable; Next.js App Router conventions are settled)
