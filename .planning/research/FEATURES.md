# Feature Research: Cross-Platform App Builder (Motif v1.4)

**Domain:** AI-powered design-to-code with framework-aware output, project scaffolding, and auto-run
**Researched:** 2026-03-09
**Confidence:** MEDIUM-HIGH (grounded in real tool behaviors from Bolt.new, v0, create-next-app, Expo, Claude Code Desktop; token translation patterns verified against Style Dictionary and NativeWind docs)

## Context

Motif v1.3 outputs HTML/CSS files into `.planning/design/screens/`. This works for greenfield design exploration but fails when users actually want to BUILD: they get beautiful screens in a format they cannot use. v1.4 transforms Motif into a tool that asks what you are building, recommends a framework, scaffolds a real project, outputs real framework components, and auto-runs the result.

Five capability areas are researched below:
1. Framework recommendation based on project type
2. Project scaffolding with proper file structure
3. Framework-specific component output (JSX, React Native, etc.)
4. Cross-platform design token delivery
5. Auto-run and preview

---

## Table Stakes

Features users expect. Missing these = the v1.4 upgrade feels incomplete.

### 1. Framework Recommendation

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Interactive project type prompt during `/motif:init`** | create-next-app, create-expo-app, and Bolt.new all ask "what are you building?" before choosing technology. Users expect the tool to ask, not assume. The prompt should ask: platform (web, mobile, both), app type (marketing site, web app, mobile app), and target audience. | LOW | Modifies: init workflow | This is a conversation, not a CLI menu. The AI agent asks 2-3 questions then recommends. Example: "You're building a fintech web app for consumers. I recommend Next.js + Tailwind CSS because it handles the dashboard-heavy UI with server-side rendering for SEO on marketing pages." |
| **Opinionated framework selection (not a menu of 15 options)** | v0 outputs React/Next.js/Tailwind/shadcn only. Bolt.new defaults to Vite+React. Lovable uses React+Supabase. The best tools PICK for you based on context, not present a buffet. Motif should recommend ONE framework per project type with clear rationale. | LOW | Requires: project type prompt | Recommendation matrix (hardcoded, not AI-improvised): Web app -> Next.js + Tailwind. Mobile app -> Expo (React Native) + NativeWind. Marketing/landing page -> Next.js + Tailwind. Cross-platform (web+mobile) -> Expo with web export + NativeWind. This matrix lives in a reference file the init workflow reads, not in the workflow itself. |
| **User can override the recommendation** | create-next-app lets you customize TypeScript/Tailwind/App Router choices. Users who know their stack should not be forced into the recommendation. "I recommend Next.js, but you mentioned you prefer Vue -- I'll use Nuxt instead." | LOW | Requires: framework recommendation | The override should be conversational: "Sounds good, but I want to use React with Vite instead of Next.js." The agent adjusts. Supported overrides: Next.js, Vite+React, Expo (React Native), Nuxt (Vue). Unsupported frameworks get a warning: "Motif doesn't have component templates for Svelte yet. I can output HTML/CSS that you adapt, or you can proceed with a supported framework." |
| **Stack decision persisted to STATE.md and PROJECT.md** | The compose workflow already reads PROJECT.md for the technical stack. The chosen framework MUST be written there so subsequent `/motif:compose` calls know what format to output. Without persistence, the agent after `/clear` has no idea what framework was chosen. | LOW | Requires: framework selection, modifies: STATE.md, PROJECT.md | Write to PROJECT.md: `## Technical Stack\n- Framework: Next.js 15\n- Styling: Tailwind CSS\n- Language: TypeScript`. Write to STATE.md YAML frontmatter: `stack: nextjs-tailwind`. The compose workflow reads this to determine output format. |

### 2. Project Scaffolding

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Run the official create-X tool** | create-next-app, create-expo-app, and `npm create vite` are the canonical scaffolders. Users expect the official tool's output, not a Motif-invented directory structure. Bolt.new runs the actual framework scaffolders under the hood. Re-inventing scaffolding means re-inventing bugs. | MEDIUM | Requires: framework selection | The agent runs: `npx create-next-app@latest {project-name} --typescript --tailwind --app --eslint --no-src-dir --import-alias "@/*" --yes` or `npx create-expo-app@latest {project-name} --template tabs` depending on selection. The `--yes` / non-interactive flags are critical -- the agent cannot answer interactive prompts mid-command. |
| **Scaffold runs in the current directory (or creates subdirectory)** | If the user already has a project directory, scaffolding should happen THERE. If they are starting fresh, it creates a new directory. create-next-app does `npx create-next-app@latest .` for current dir or `npx create-next-app@latest my-app` for new dir. The user should be asked. | LOW | Requires: project scaffolding | Ask: "Create the project here in the current directory, or in a new folder? If new, what should it be called?" Default to current directory if it is empty, new folder if it has files. |
| **Install dependencies automatically** | create-next-app and create-expo-app both run `npm install` as part of scaffolding. The user should not need to run it manually. After scaffolding, the project should be immediately runnable. | FREE | Included in create-X tools | The official scaffolders handle this. No Motif code needed. Just let the tool finish. |
| **Motif files installed alongside framework files** | After scaffolding, the user needs `.claude/get-motif/`, `.planning/design/`, hooks, and CLAUDE.md rules. This is the existing `motif init` behavior, but it must run AFTER framework scaffolding, not instead of it. The order matters: framework first, Motif overlay second. | LOW | Requires: scaffolding complete | Sequence: (1) create-next-app scaffolds, (2) Motif installs its files into the same directory. This is already how brownfield projects work -- Motif overlays onto existing projects. The init workflow just needs to orchestrate the sequence. |
| **Tailwind configured with design tokens** | If the framework uses Tailwind, the generated `tailwind.config.js` should extend with Motif's token values so that composed components can use `bg-primary` instead of `bg-[var(--color-primary)]`. This is how Tailwind projects actually work -- config extension, not CSS variable fallbacks. | MEDIUM | Requires: tokens.css generated (post-system phase), Tailwind installed | This happens during `/motif:system`, not during init. When the system architect generates tokens.css, it ALSO generates a `tailwind.extend.js` (or writes directly to `tailwind.config.ts`) that maps token values to Tailwind utility classes. Example: `colors: { primary: 'var(--color-primary)', surface: 'var(--color-surface)' }`. |

### 3. Framework-Specific Component Output

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **JSX/TSX component files instead of HTML** | v0 outputs React components. Bolt.new outputs framework components. The entire point of v1.4 is that `/motif:compose` outputs REAL components, not HTML files. A Next.js project gets `.tsx` page components. An Expo project gets React Native `View`/`Text` components. | HIGH | Requires: framework in PROJECT.md, modifies: compose-screen.md workflow, modifies: composer agent prompt | This is the core change. The compose-screen.md workflow must branch on framework: if Next.js, the agent prompt says "Output TSX components using Tailwind classes." If Expo, it says "Output React Native components using NativeWind classes and View/Text/ScrollView primitives." The anti-slop checklist changes per framework. |
| **Correct file placement for framework** | Next.js App Router expects `app/dashboard/page.tsx`. Expo expects `app/(tabs)/dashboard.tsx` (file-based routing). Vite+React expects `src/pages/Dashboard.tsx` or similar. The composed files must land in the RIGHT directory. | MEDIUM | Requires: framework detection, PROJECT-SCAN.md for brownfield | The brownfield compose path already handles this via PROJECT-SCAN.md and CONVENTIONS.md. For greenfield projects scaffolded by Motif, the directory structure is KNOWN (we ran create-next-app, so we know the structure). Write a framework-specific file placement reference that the composer reads. |
| **Framework-appropriate imports and patterns** | Next.js components use `"use client"` directive, `next/image`, `next/link`, `useRouter`. Expo components use `expo-router`, `@expo/vector-icons`, `SafeAreaView`. Getting imports wrong makes the output unusable. | MEDIUM | Requires: framework reference files | Create framework reference files (e.g., `nextjs-patterns.md`, `expo-patterns.md`) that the composer agent reads. These contain: import patterns, routing conventions, image handling, link components, layout patterns. The composer follows these like it follows COMPONENT-SPECS.md. |
| **Component decomposition into framework-idiomatic structure** | The existing composer already decomposes into page -> sections -> primitives. This must map to framework conventions: Next.js uses `_components/` co-location, Expo uses a `components/` directory. Barrel exports, named exports, default exports vary by framework. | LOW | Requires: framework reference files | The decomposition rules in compose-screen.md already support brownfield conventions. For greenfield v1.4 projects, the framework reference file specifies: "Next.js greenfield: page at `app/{route}/page.tsx`, sections at `app/{route}/_components/`, shared primitives at `components/ui/`." |
| **State management appropriate to framework** | Next.js components use React hooks (`useState`, `useEffect`). Expo components use the same React hooks but with different lifecycle considerations (no SSR). The composed components should use framework-appropriate state patterns. | LOW | Included in framework reference files | Not a separate feature -- part of the framework reference. "Next.js: use `'use client'` for interactive components, prefer Server Components for static content." "Expo: all components are client-side, use `useEffect` for data fetching." |

### 4. Cross-Platform Token Delivery

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **CSS custom properties for web (existing behavior)** | tokens.css with `--color-primary`, `--spacing-md`, etc. already works. This is the web token format and must continue to work for Next.js/Vite projects. | FREE | Already built | No change needed. tokens.css continues to be the source of truth for web. |
| **Tailwind config extension for Tailwind projects** | When the project uses Tailwind, tokens must also be available as Tailwind utility classes (`bg-primary`, `text-sm`, `rounded-md`). Tailwind-only projects do not use `var(--color-primary)` in JSX -- they use `className="bg-primary"`. | MEDIUM | Requires: tokens.css exists, framework uses Tailwind | The system architect generates BOTH tokens.css AND a Tailwind extension. The extension reads CSS variables: `primary: 'var(--color-primary)'`. This is how shadcn/ui works -- CSS variables as Tailwind values. Well-established pattern. |
| **React Native StyleSheet constants for Expo** | React Native does not support CSS custom properties natively. Tokens must be delivered as a JavaScript/TypeScript constants file: `export const tokens = { colors: { primary: '#1a2b3c' }, spacing: { md: 16 } }`. NativeWind bridges this gap partially, but raw token values are still needed for StyleSheet.create. | MEDIUM | Requires: tokens.css exists, framework is Expo | The system architect generates a `tokens.ts` file alongside `tokens.css`. This is a mechanical translation: parse CSS custom properties, output a typed TypeScript object. Style Dictionary does exactly this transformation, but Motif should do it inline (zero dependencies) with a simple script or agent instruction. |
| **NativeWind className support for Expo+Tailwind** | NativeWind translates Tailwind classes to React Native styles at build time. If Motif generates `className="bg-primary text-white p-4"` in an Expo component, NativeWind handles the rest. This means the SAME Tailwind classes work on web AND mobile. | MEDIUM | Requires: Expo project with NativeWind installed, Tailwind config extension | NativeWind v5 (preview as of 2026) simplifies config significantly. The scaffolder should install NativeWind alongside Expo and configure it. Then the composer outputs Tailwind classes in React Native components just like web components. The token delivery is unified: one Tailwind config, two platforms. |

### 5. Auto-Run and Preview

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Start dev server after composition** | Bolt.new auto-runs after every generation. v0 shows a live preview. Users expect to SEE their composed screen immediately. After `/motif:compose dashboard`, the dev server should start and the dashboard should be visible. | MEDIUM | Requires: project scaffolded, dependencies installed | The agent runs `npm run dev` (or `npx expo start --web`) in the background after composition. Claude Code supports background commands (Ctrl+B) and monitors logs in real-time. The agent should offer: "Screen composed. Start the dev server to preview? (yes/no)" |
| **Generate `.claude/launch.json` for Claude Code Desktop** | Claude Code Desktop uses `.claude/launch.json` to configure dev server preview. Motif should generate this file during scaffolding so the preview panel works automatically. | LOW | Requires: project scaffolded | Write `.claude/launch.json`: `{ "version": "0.0.1", "configurations": [{ "name": "{project-name}", "runtimeExecutable": "npm", "runtimeArgs": ["run", "dev"], "port": 3000 }] }`. For Expo: port 8081, runtimeArgs `["start", "--web"]`. This is a one-time file creation during init. |
| **Error detection and self-fix loop** | Bolt.new and Replit Agent both detect build/runtime errors from terminal output and attempt fixes. When the dev server shows a compilation error, the agent should read the error, identify the issue, and fix it. | LOW | Requires: dev server running in background | Claude Code already does this natively -- it monitors background command logs and can search them when something breaks. Motif does not need custom infrastructure for this. The agent's composer prompt should include: "After starting the dev server, check for compilation errors. If errors appear, fix them and verify the fix." |
| **QR code for mobile preview (Expo only)** | Expo's dev server outputs a QR code for scanning with Expo Go on a physical device. Users building mobile apps expect this flow. | FREE | Included in `npx expo start` | Expo handles this automatically. The terminal shows the QR code. No Motif code needed. |

---

## Differentiators

Features that set Motif apart from v0, Bolt.new, and Lovable.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Domain-intelligent framework recommendation** | v0/Bolt.new ask "what do you want to build?" and generate code. They do not cross-reference the PROJECT TYPE against design patterns. Motif uniquely knows that a fintech dashboard needs dense data tables (favoring Next.js for SSR performance) while a social app needs smooth scrolling feeds (favoring Expo for native feel). The recommendation is informed by vertical, not just technology preference. | LOW | Requires: vertical reference files, framework recommendation matrix | The recommendation matrix includes vertical-aware logic: `if vertical === 'social' && platform === 'mobile' -> Expo` because social apps are feed-centric and native scroll performance matters. `if vertical === 'devtools' -> Next.js` because developer tools are desktop-first. This is a lookup table, not AI reasoning -- it should be deterministic and documented. |
| **Design system THEN components (not simultaneous)** | v0 generates components with ad-hoc styling. Bolt.new generates an entire app with inconsistent design. Lovable generates with Supabase defaults. Motif is UNIQUE in that it generates a complete design system (tokens.css, COMPONENT-SPECS.md, ICON-CATALOG.md) FIRST, then every composed component is system-compliant. This produces genuinely consistent UIs across screens. No other AI tool does this. | FREE | Already built (existing pipeline) | This is Motif's core differentiator and must be preserved in v1.4. The new framework output is a FORMAT change (HTML -> JSX), not a PROCESS change. The system-then-compose pipeline stays exactly the same. |
| **Vertical-aware component generation** | When composing a fintech dashboard in Next.js, the composer knows to use tabular-nums for financial figures, dense spacing for data tables, and trust-signaling color hierarchy. When composing a social feed in Expo, it knows to use compact cards with engagement bars and pull-to-refresh. This domain intelligence infects every component. v0 and Bolt.new have zero domain awareness. | FREE | Already built (vertical references) | No new work needed. The vertical references already inform composition. The framework change (HTML -> JSX) does not affect the DESIGN decisions, only the OUTPUT format. |
| **Token-first Tailwind integration** | Most AI tools generate Tailwind with hardcoded values (`bg-blue-500`, `text-gray-900`). Motif generates Tailwind with semantic token references (`bg-primary`, `text-on-surface`) backed by CSS custom properties. This means changing the brand color updates EVERY component -- a capability v0 and Bolt.new lack because their Tailwind usage is hardcoded. | MEDIUM | Requires: Tailwind config extension with token mapping | The Tailwind config maps: `colors: { primary: 'var(--color-primary)', 'on-primary': 'var(--color-on-primary)' }`. Components use `className="bg-primary text-on-primary"`. Change `--color-primary` in tokens.css and everything updates. This is how shadcn/ui works and is proven at scale. |
| **Unified token file for web + mobile** | tokens.css is the single source of truth. For web (Next.js), it is used directly. For mobile (Expo), a `tokens.ts` file is mechanically generated from it. Change tokens.css, regenerate tokens.ts, and both platforms update. No other AI design tool handles cross-platform token synchronization. | MEDIUM | Requires: tokens.css, token translation script/instruction | The translation is mechanical: parse `--color-primary: #1a2b3c;` -> export `colors.primary = '#1a2b3c'`. A simple Node script or even an agent instruction can do this. Style Dictionary is overkill for this use case -- Motif only needs CSS -> TS, not CSS -> iOS + Android + web + etc. |
| **Auto-generated launch.json with framework awareness** | Claude Code Desktop users get instant preview with zero config. Motif detects the framework and writes the correct launch.json. Next.js gets port 3000 with `npm run dev`. Expo gets port 8081 with `expo start --web`. Users do not need to know about launch.json. | LOW | Requires: framework selection, project scaffolded | One-time file generation during init. Tiny feature, significant DX improvement for Claude Code Desktop users. |

---

## Anti-Features

Features that seem useful but would hurt Motif v1.4 specifically.

| Anti-Feature | Why It Seems Useful | Why It Is Problematic for Motif | What to Do Instead |
|--------------|---------------------|--------------------------------|-------------------|
| **Support every framework (Svelte, Angular, Flutter, SwiftUI)** | "More frameworks = more users." | Each framework needs: a scaffolding command, a file placement reference, an import pattern reference, a token delivery format, framework-specific anti-slop checks, and ongoing maintenance. 4 frameworks is already substantial. Angular adds decorators, modules, and dependency injection. Flutter adds Dart, widgets, and a completely different rendering model. SwiftUI adds Swift, a different build system, and Apple-only. The maintenance burden scales multiplicatively with verticals (8 verticals x N frameworks). | Support 4 frameworks: Next.js (web default), Vite+React (lightweight web), Expo/React Native (mobile), Nuxt/Vue (Vue ecosystem). Cover 90% of the solo dev / indie hacker audience. Add frameworks one at a time in future milestones based on demand. |
| **Visual drag-and-drop editor** | "Users should be able to visually arrange components." | Motif runs inside Claude Code (a terminal). There is no GUI. Building a visual editor means building a web application, hosting it, maintaining it, syncing state with the terminal workflow, and competing with Figma/Framer/v0 on their turf. Motif's advantage is that it works IN the coding environment, not alongside it. | Rely on the dev server preview. After `/motif:compose`, the user sees the result in the browser (via Claude Code Desktop preview or their own browser). Iterate by talking to the agent: "Move the sidebar to the right side." The AI agent IS the visual editor. |
| **Full-stack scaffolding (database, auth, API routes)** | "Bolt.new and Lovable generate full-stack apps. Motif should too." | Motif generates DESIGN SYSTEMS and UI COMPONENTS. Full-stack means: database schema, ORM setup, authentication flows, API route handlers, middleware, deployment config. This is an entirely different product category. Bolt.new and Lovable are app builders. Motif is a design system tool for AI coding assistants. Scope creep into full-stack kills the design focus. | Scaffold the FRONTEND only. The project has pages, components, and styling. Backend is the user's responsibility (or another AI tool's). If the user asks for auth, say: "Motif handles UI. For auth, I recommend following Next.js auth patterns with NextAuth.js -- want me to set that up separately?" |
| **Custom component library generation (shadcn-style install)** | "Generate a `components/ui/` library with Button, Card, Input, etc. that users can customize." | This recreates shadcn/ui. shadcn/ui already exists, is battle-tested, and has massive community support. Generating a competing component library adds maintenance burden, produces inferior components (less tested, fewer edge cases handled), and confuses users who already use shadcn. | For Next.js/Tailwind projects, USE shadcn/ui as the component primitive layer. The composer imports shadcn components and applies Motif's design tokens via Tailwind config extension. For Expo, use a lightweight set of primitives (View, Text, Pressable) with NativeWind classes. Do not generate a component library -- compose with existing ones. |
| **Real-time hot-reload sync between design tokens and preview** | "When tokens.css changes, the preview updates instantly without restarting the dev server." | CSS custom properties already hot-reload on web (Vite HMR handles this). For React Native, NativeWind handles Tailwind class changes via Metro bundler refresh. There is no sync problem to solve -- the frameworks already do this. Building custom sync infrastructure would duplicate existing framework capabilities. | Let the framework's dev server handle hot reload. Vite, Next.js, and Metro all support HMR natively. When the agent changes tokens.css, the browser refreshes automatically. No Motif code needed. |
| **Framework migration tooling** | "Let users switch from Next.js to Expo mid-project, converting all components." | Component translation between frameworks is lossy and error-prone. `div` -> `View`, `className` -> `style`, `next/image` -> `expo-image`, router differences, SSR vs client-only -- every component needs manual review. The output would be worse than regenerating from scratch. | If a user wants to switch frameworks, re-run `/motif:init` with the new framework and `/motif:compose` to regenerate. The DESIGN SYSTEM (tokens.css, COMPONENT-SPECS.md) is framework-agnostic and survives framework changes. Only the composed components need regeneration, and that is fast. |
| **Expo EAS Build / Vercel deployment integration** | "One-click deploy to production after composing." | Deployment requires: environment variables, domain configuration, build optimization, CDN setup, database migration. This is operational infrastructure, not design. Each deployment target (Vercel, EAS, Netlify, Fly.io) has different configuration. Supporting all of them is a product in itself. | Generate a working dev build. Deployment is the user's next step after Motif finishes. The generated project IS deployable with the standard `vercel` or `eas build` commands -- no Motif-specific deployment needed. |

---

## Feature Dependencies

```
Framework Recommendation
    Project type prompt ──> Framework selection ──> Stack persisted to PROJECT.md/STATE.md
                                                         │
Project Scaffolding                                      │
    Framework selection ──> Run create-X tool ──> Motif overlay (init files)
                                │                        │
                                └── Install deps         │
                                                         │
Design System (existing pipeline, unchanged)             │
    /motif:research ──> /motif:system ──> tokens.css     │
                                │                        │
Token Delivery                  │                        │
    tokens.css ──> Tailwind config extension (web)       │
    tokens.css ──> tokens.ts (Expo/React Native)         │
    tokens.css ──> NativeWind config (Expo+Tailwind)     │
                                                         │
Framework Component Output                               │
    Stack in PROJECT.md ──────────────────────────────────┘
    Framework reference files ──> Composer agent prompt branching
    Token delivery format ──> Composer uses correct token access pattern
                                │
Auto-Run                        │
    Project scaffolded ──> launch.json generated ──> Dev server start
    Composition complete ──> Offer preview ──> Error detection loop
```

### Dependency Notes

- **Framework recommendation requires vertical selection:** The recommendation matrix uses vertical to inform framework choice (social+mobile -> Expo). Vertical selection happens during init, which already exists.
- **Project scaffolding requires framework selection:** Cannot run create-next-app until we know it is Next.js.
- **Token delivery requires tokens.css:** The Tailwind extension and tokens.ts are generated DURING `/motif:system`, not during init. Init scaffolds the project; system generates the design system including framework-appropriate token formats.
- **Component output requires both framework reference AND token delivery:** The composer needs to know (a) what framework to output for, and (b) how to reference tokens in that framework.
- **Auto-run requires a scaffolded, installable project:** Cannot start a dev server without package.json and node_modules.
- **launch.json generation is independent:** Can happen during init (after scaffolding) without waiting for design system or composition.

---

## Competitor Feature Analysis

| Feature | v0 (Vercel) | Bolt.new | Lovable | Motif v1.4 (planned) |
|---------|-------------|----------|---------|---------------------|
| Framework recommendation | No -- always React/Next.js/Tailwind/shadcn | Implicit -- picks based on description | No -- always React/Supabase | Yes -- asks project type, recommends based on vertical + platform |
| Project scaffolding | No -- generates components, not projects | Yes -- scaffolds full project in WebContainer | Yes -- scaffolds full project | Yes -- runs official create-X tools locally |
| Framework component output | React/Next.js only | Multi-framework (JS ecosystem) | React only | Next.js, Vite+React, Expo, Nuxt |
| Design system consistency | None -- ad-hoc styling per generation | None -- inconsistent across generations | None -- Supabase UI defaults | Full design system pipeline: tokens -> specs -> compose |
| Domain/vertical awareness | None | None | None | 8 vertical references with domain-specific patterns |
| Token system | None (hardcoded Tailwind values) | None | None | CSS custom properties -> Tailwind extension -> RN constants |
| Auto-run preview | Live preview in browser | Live preview in WebContainer | Live preview in browser | Dev server via Claude Code background commands + launch.json |
| Cross-platform | Web only | Web only (JS frameworks) | Web only | Web (Next.js/Vite) + Mobile (Expo/RN) |
| Where it runs | Cloud (v0.app) | Cloud (bolt.new) | Cloud (lovable.dev) | Locally in Claude Code (user's machine) |
| Cost model | Token-based credits ($5/mo free) | Subscription ($20+/mo) | Subscription ($20+/mo) | Free (Motif is open source; user pays for Claude API) |

---

## MVP Definition

### Launch With (v1.4.0)

The minimum set that makes the cross-platform story real.

- [ ] **Framework recommendation during init** -- 2-3 conversational questions, opinionated recommendation, override allowed
- [ ] **Project scaffolding via create-next-app** -- Next.js only for v1.4.0 launch (highest demand, most Motif users are web devs)
- [ ] **JSX/TSX component output** -- compose-screen.md branches on framework, outputs `.tsx` components with Tailwind classes
- [ ] **Tailwind config extension with token mapping** -- generated during `/motif:system`, enables `bg-primary` instead of `bg-[var(--color-primary)]`
- [ ] **Framework reference file (Next.js)** -- import patterns, file placement, routing conventions, `"use client"` directive rules
- [ ] **launch.json generation** -- auto-generated during init for Claude Code Desktop preview
- [ ] **Auto-run offer after composition** -- "Start dev server to preview? (yes/no)", runs in background

### Add After Validation (v1.4.x)

Features to add once Next.js output is working and validated.

- [ ] **Expo/React Native scaffolding and output** -- second framework after Next.js is proven
- [ ] **tokens.ts generation for React Native** -- mechanical translation from tokens.css
- [ ] **NativeWind configuration** -- Tailwind classes in React Native components
- [ ] **Expo framework reference file** -- React Native primitives, expo-router, SafeAreaView patterns
- [ ] **Vite+React scaffolding and output** -- lightweight alternative to Next.js
- [ ] **Nuxt/Vue scaffolding and output** -- Vue ecosystem support

### Future Consideration (v1.5+)

Features to defer until cross-platform is stable.

- [ ] **shadcn/ui integration** -- auto-install shadcn components during scaffolding, composer imports them
- [ ] **Cross-platform project (web + mobile from one design system)** -- single tokens.css powers both Next.js and Expo outputs
- [ ] **Template library** -- pre-built project templates (SaaS dashboard, social feed, marketplace) that skip the init conversation

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| JSX/TSX component output (Next.js) | HIGH | HIGH | P1 |
| Framework recommendation during init | HIGH | LOW | P1 |
| Project scaffolding (create-next-app) | HIGH | MEDIUM | P1 |
| Tailwind config extension | HIGH | MEDIUM | P1 |
| launch.json generation | MEDIUM | LOW | P1 |
| Next.js framework reference file | HIGH | MEDIUM | P1 |
| Auto-run offer after composition | MEDIUM | LOW | P1 |
| Expo/RN scaffolding + output | HIGH | HIGH | P2 |
| tokens.ts for React Native | MEDIUM | MEDIUM | P2 |
| NativeWind configuration | MEDIUM | MEDIUM | P2 |
| Vite+React support | MEDIUM | MEDIUM | P2 |
| Nuxt/Vue support | LOW | MEDIUM | P3 |
| shadcn/ui integration | MEDIUM | HIGH | P3 |
| Cross-platform single design system | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must have for v1.4.0 launch
- P2: Add in v1.4.x after validation
- P3: Future consideration (v1.5+)

---

## UX Expectations (What Each Capability Looks Like)

### What "Recommend a Framework" Looks Like

The user runs `/motif:init`. The agent asks:

```
What are you building?
> A personal finance tracker for consumers

What platform are you targeting?
> Web for now, maybe mobile later

Got it. For a fintech web app with potential mobile expansion:

  Recommended: Next.js 15 + Tailwind CSS + TypeScript

  Why: Next.js handles the dashboard-heavy UI your fintech app needs,
  with server-side rendering for SEO on any public pages. Tailwind
  with your design tokens keeps the dense data tables readable.
  If you add mobile later, your design system (tokens.css) transfers
  directly to an Expo project with NativeWind.

  Proceed with Next.js, or do you have a different framework in mind?
```

This is conversational, not a CLI menu. The agent uses vertical knowledge to justify the recommendation.

### What "Auto-Run" Looks Like

After `/motif:compose dashboard` completes:

```
Dashboard screen composed: 6 files created in app/dashboard/

  app/dashboard/page.tsx (main page)
  app/dashboard/_components/StatsRow.tsx
  app/dashboard/_components/TransactionTable.tsx
  app/dashboard/_components/SpendingChart.tsx
  app/dashboard/_components/AccountSidebar.tsx
  components/ui/MetricCard.tsx

Start the dev server to preview? (yes/no)
> yes

Starting dev server... (running in background)
Server ready at http://localhost:3000

Open http://localhost:3000/dashboard to see your screen.
```

For Claude Code Desktop users, the preview panel opens automatically because launch.json is configured.

---

## Sources

### Framework Scaffolding
- [create-next-app CLI reference](https://nextjs.org/docs/app/api-reference/cli/create-next-app) -- HIGH confidence
- [Next.js installation guide](https://nextjs.org/docs/app/getting-started/installation) -- HIGH confidence
- [create-expo-app documentation](https://docs.expo.dev/more/create-expo/) -- HIGH confidence
- [Expo CLI documentation](https://docs.expo.dev/more/expo-cli/) -- HIGH confidence

### Design-to-Code Tools
- [Bolt.new GitHub repository](https://github.com/stackblitz/bolt.new) -- HIGH confidence
- [What is Bolt.new](https://skywork.ai/blog/what-is-bolt-new/) -- MEDIUM confidence
- [Vercel v0 review 2025](https://trickle.so/blog/vercel-v0-review) -- MEDIUM confidence
- [What is v0.dev (2026)](https://capacity.so/blog/what-is-v0-dev) -- MEDIUM confidence
- [v0 review 2026 (Taskade)](https://www.taskade.com/blog/v0-review) -- MEDIUM confidence

### Cross-Platform Tokens
- [NativeWind v5 overview](https://www.nativewind.dev/v5) -- HIGH confidence
- [Expo Tailwind CSS guide](https://docs.expo.dev/guides/tailwind/) -- HIGH confidence
- [css-to-react-native (styled-components)](https://github.com/styled-components/css-to-react-native) -- HIGH confidence
- [Design tokens cross-platform (ititans)](https://ititans.com/blog/cross-platform-mobile-ui-with-design-tokens/) -- MEDIUM confidence

### Auto-Run and Preview
- [Claude Code Desktop documentation](https://code.claude.com/docs/en/desktop) -- HIGH confidence
- [Claude Code background commands](https://claudelog.com/faqs/what-are-background-commands/) -- MEDIUM confidence
- [launch.json configuration (Claude Code)](https://code.claude.com/docs/en/desktop) -- HIGH confidence

### Competitor Analysis
- [Emergent vs Lovable vs Replit 2026](https://www.closefuture.io/blogs/emergent-vs-lovable-vs-replit) -- MEDIUM confidence
- [Bolt vs Replit vs Lovable comparison](https://emergent.sh/learn/bolt-new-vs-replit-vs-lovable) -- MEDIUM confidence
- [2026 AI coding platform comparison](https://medium.com/@aftab001x/the-2026-ai-coding-platform-wars-replit-vs-windsurf-vs-bolt-new-f908b9f76325) -- MEDIUM confidence

---
*Feature research for: Cross-Platform App Builder (Motif v1.4)*
*Researched: 2026-03-09*
