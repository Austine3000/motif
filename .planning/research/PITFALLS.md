# Domain Pitfalls: Brownfield Intelligence & Component Decomposition

**Domain:** Adding project scanning, component cataloging, and component decomposition to an AI-agent-based design engineering system (Motif)
**Researched:** 2026-03-04
**Confidence:** HIGH (based on deep codebase analysis of existing Motif architecture, context engine constraints, and known AI agent behavior patterns)

---

## Critical Pitfalls

Mistakes that cause rewrites, break existing functionality, or silently produce wrong output.

---

### Pitfall 1: Over-Scanning Blows the Context Budget

**What goes wrong:**
The project scanner reads too much of the user's codebase and produces a scan artifact that exceeds the context budget. Motif's context engine enforces strict token budgets (PROJECT.md: 1000 tokens, DESIGN-RESEARCH.md: 3000 tokens, total subagent context: ~15,000 tokens). A project scan that catalogs every file, every component, every CSS variable in a brownfield project easily produces 5,000-20,000 tokens of output. When this scan artifact is loaded into a composer or system generator subagent, it crowds out COMPONENT-SPECS.md (5000 tokens) and tokens.css (3000 tokens) -- the files that actually drive correct output. The agent starts ignoring design system constraints because they are pushed to the tail end of its loaded context.

**Why it happens:**
The natural instinct is "scan everything so nothing is missed." A React project with 50 components, 200 files, and an existing design system has genuinely useful information everywhere. Without aggressive filtering, the scanner captures: every component name, every prop signature, every CSS file, every route, every config file. Each additional data point feels valuable in isolation but collectively they exceed the context budget. The Motif context engine reference explicitly warns: "If a file exceeds its budget, it must be split or summarized." But the scanner does not know what the budget IS unless it is told.

**Consequences:**
- Composer agents produce monolithic output that ignores component specs (specs pushed out of effective context window)
- Token-check and font-check hooks catch violations but cannot fix the root cause (agent never internalized the rules)
- System generator creates a design system that does not account for existing project tokens because it could not fit both scan results AND research findings
- Orchestrator exceeds the 30-40% context ceiling because it reads the oversized scan artifact to determine what to pass to subagents

**Prevention:**
1. Define a hard token budget for the scan artifact: `PROJECT-SCAN.md` must be under 2000 tokens. Period. This forces the scanner to summarize, not dump.
2. Implement a tiered scanning strategy:
   - **Tier 1 (always):** Framework detection, routing pattern, component directory structure (paths only, not contents). Target: 500 tokens.
   - **Tier 2 (always):** Existing design tokens/theme file detection. Extract token names and values, not the entire file. Target: 800 tokens.
   - **Tier 3 (on-demand):** Individual component analysis. Only performed when a specific component is referenced during compose. Never loaded in bulk. Target: 300 tokens per component.
3. Add the scan artifact to the context engine's budget table with an enforced ceiling. The context-engine.md reference already defines budgets for every file type; the scan artifact needs the same treatment.
4. Build the scanner output as structured markdown (tables, not prose) to maximize information density per token.

**Warning signs:**
- Scan artifact exceeds 2000 tokens
- Composer agents produce output with hardcoded values (sign they lost track of tokens.css instructions)
- Orchestrator context usage spikes above 40% after reading scan results
- System generator ignores existing project tokens despite scan claiming to detect them

**Detection:**
Run `token-counter.js` (existing script in `scripts/`) against the scan artifact. If it exceeds budget, the scanner must re-run with stricter filtering.

**Phase to address:**
Phase 1 (Scanner Design). The budget constraint must be baked into the scanner's architecture from day one, not retrofitted.

---

### Pitfall 2: Stale Scans Causing Ghost Component References

**What goes wrong:**
The project scan runs once during `/motif:init` (or a new `/motif:scan` command) and produces a snapshot. The user continues developing their project -- renaming components, deleting files, refactoring structure. The scan artifact becomes stale. Composer agents reference components that no longer exist, propose imports from deleted files, or structure output to match a routing pattern that has changed. Unlike STATE.md (which Motif controls and updates atomically), the scan artifact reflects external state that Motif does not control.

**Why it happens:**
Motif's state machine is designed for Motif's own artifacts: STATE.md tracks phase, screens, decisions. The scan artifact is fundamentally different -- it describes external reality that changes independently of Motif operations. The existing state machine has no concept of "external state invalidation." The state transitions (UNINITIALIZED -> INITIALIZED -> RESEARCHED -> etc.) assume that once a phase completes, its artifacts remain valid. A scan artifact violates this assumption.

**Consequences:**
- Composer agent generates `import { Button } from '@/components/Button'` referencing a component the user renamed to `PrimaryButton` last week
- System generator tries to merge with existing tokens from a theme file the user deleted
- Decomposition strategy outputs component boundaries matching a file structure that has been reorganized
- User loses trust in the tool because it gives advice based on outdated project state

**Prevention:**
1. Never cache the full scan. Instead, scan lazily: the orchestrator runs targeted scans at the moment they are needed, not ahead of time.
   - Before `/motif:system`: scan for existing theme/token files (not the full project)
   - Before `/motif:compose {screen}`: scan for components related to that screen's domain (not all components)
   - This means no single `PROJECT-SCAN.md` artifact. Instead, scan results are ephemeral and injected directly into the subagent prompt.
2. If a persistent scan artifact IS created, add a freshness timestamp and a re-scan trigger:
   ```markdown
   ## Scan Metadata
   Scanned: 2026-03-04T14:30:00Z
   Project root: /Users/user/project
   Files at scan time: 247
   WARNING: This scan is a snapshot. If project structure has changed, re-run /motif:scan.
   ```
3. Add a lightweight "drift check" before loading the scan: verify that 3-5 key paths from the scan still exist. If any are missing, warn the user and suggest re-scanning.
4. Design the scan artifact as a "hints" document, not a "source of truth." Subagent prompts should say: "The following project structure was detected at scan time. VERIFY paths before importing. If a referenced file does not exist, adapt accordingly."

**Warning signs:**
- Composed screens reference import paths that produce 404/module-not-found errors
- User reports "it keeps referencing my old component names"
- The scan artifact's timestamp is more than 1 session old
- Git diff between scan time and current HEAD touches files in the scanned directories

**Detection:**
Before loading scan artifact, run `stat` on 5 random file paths from the scan. If any return "not found," trigger a re-scan warning.

**Phase to address:**
Phase 1 (Scanner Design). The freshness strategy must be decided before the artifact format is finalized.

---

### Pitfall 3: Wrong Framework Assumptions from Ambiguous Project Signals

**What goes wrong:**
The scanner detects a `package.json` with React listed but misses that the project actually uses Next.js App Router (not Pages Router), or detects Tailwind CSS but misses that the project uses Tailwind with a custom design token layer, or detects TypeScript but misses that JSX files use `.tsx` while utilities use `.ts`. The scanner makes a top-level framework determination that cascades incorrectly through every downstream agent. The system generator creates a vanilla React design system when it should create an App Router-aware one. The composer generates `import` patterns that do not work in the project's actual setup.

**Why it happens:**
Framework detection from static file analysis is inherently ambiguous. A project with `next` in `package.json` could be using Pages Router, App Router, or both. A project with `tailwindcss` could be using utility classes directly, using `@apply` in component files, using CSS Modules with Tailwind, or using Tailwind alongside a custom CSS variable system. The scanner looks at file existence (`next.config.js` exists -> Next.js) but does not read configuration deeply enough to determine the actual usage pattern. Motif's existing init interview asks about the stack, but the user might say "React" when they mean "Next.js 14 App Router with RSC."

**Consequences:**
- Composed screens use `useState` in Server Components
- Import patterns use `pages/` convention in an App Router project
- Generated components assume client-side rendering when the project uses SSR
- CSS output uses `@apply` when the project uses CSS Modules
- Decomposed components do not account for the `'use client'` boundary

**Prevention:**
1. Do not rely on `package.json` alone. Check for configuration signals:
   - `next.config.js` or `next.config.ts` -> Next.js. Then check for `app/` directory (App Router) vs `pages/` directory (Pages Router) vs both.
   - `tailwind.config.js` -> Tailwind. Then check for `@apply` usage in CSS files, CSS Modules co-existence, custom plugin configuration.
   - `tsconfig.json` -> TypeScript. Check `paths` aliases to understand import conventions.
   - `vite.config.ts` -> Vite-based setup. Check for framework plugins (React, Vue, Svelte).
2. Produce a structured framework profile, not a single label:
   ```markdown
   ## Framework Profile
   - Runtime: Next.js 14
   - Router: App Router (app/ directory detected, no pages/ directory)
   - Rendering: Mixed (RSC default, 'use client' in 12 files)
   - Styling: Tailwind CSS + CSS Modules (*.module.css files found alongside tailwind classes)
   - Language: TypeScript (strict mode, path aliases: @/ -> src/)
   - State: Zustand (detected in 3 store files)
   ```
3. Present the detected profile to the user during init for confirmation: "I detected the following setup. Is this correct?" This catches misdetections before they propagate.
4. Make the framework profile available to every subagent, not just the system generator. Composer agents need to know about RSC boundaries. Reviewer agents need to check framework-appropriate patterns.

**Warning signs:**
- Scanner reports "React" without App Router/Pages Router distinction
- Composed screens import from wrong paths (`pages/api/` in an App Router project)
- User corrects framework detection during compose instead of during init
- Generated components missing `'use client'` directives

**Detection:**
After scanning, validate the framework profile against 3 heuristic checks: (1) does the detected router match the directory structure, (2) do the detected styling patterns match actual file contents, (3) do import path aliases match tsconfig paths.

**Phase to address:**
Phase 1 (Scanner Design). Framework detection is the foundation; getting it wrong poisons everything downstream.

---

### Pitfall 4: Decomposition Produces Components Nobody Can Reuse

**What goes wrong:**
Motif currently outputs monolithic HTML files per screen. v1.2 adds component decomposition -- breaking screens into reusable components. But the decomposer creates components that are either (a) too granular (a `<DividerLine />` component wrapping a single `<hr>`) or (b) too coupled (a `<DashboardHeader />` that hardcodes the user's name, avatar URL, and notification count). Neither extreme produces actually reusable components. The components exist as files but nobody would import them into a real project.

**Why it happens:**
Component decomposition requires understanding two things AI agents are bad at: (1) which parts of a UI will be reused across screens vs. which are one-offs, and (2) what the right prop interface is for a component to be flexible without being over-abstracted. The agent does not know the user's future plans -- it cannot predict which screens will share a sidebar, which cards will appear in multiple contexts, or which buttons need variant support. Without this knowledge, it either decomposes everything (creating a folder of 30 tiny components per screen) or decomposes nothing meaningful (creating 3 components that each contain half a page of coupled markup).

**Consequences:**
- Component folder contains 20-40 components per screen, most used exactly once
- Components have no props or only hardcoded props (not actually parameterized)
- Components import each other in circular or deeply nested chains
- User must manually refactor every decomposed component to make it usable in their real project
- The decomposition adds complexity without adding value, making users distrust the feature

**Prevention:**
1. Decompose to the design system's component catalog, not to arbitrary UI chunks. The COMPONENT-SPECS.md already defines the reusable components (Button, Card, Input, etc.). Decomposition should produce instances of these components, not invent new ones. New components should only be created when they represent a domain-specific pattern (TransactionRow, MetricCard) already identified in research.
2. Apply a "2+ screens" heuristic: only extract a new component if it appears (or would logically appear) in 2 or more screens. Single-use arrangements should remain inline.
3. Define a decomposition depth limit: maximum 2 levels of custom component nesting. `Screen -> Section -> Component` is fine. `Screen -> Section -> Subsection -> Card -> CardHeader -> CardHeaderIcon -> IconWrapper` is not.
4. Require prop interfaces for every extracted component. If the agent cannot identify at least 2 meaningful props (beyond `children`), the extraction probably is not worthwhile.
5. Include the component catalog from the scan (what components already exist in the project) so the agent maps to existing components rather than creating duplicates.

**Warning signs:**
- More than 8 custom components extracted from a single screen
- Components with zero or one prop
- Component names that are screen-specific (`DashboardSidebar` instead of `Sidebar`)
- Components that import other newly-created components (deep nesting)
- The decomposed output is harder to read than the monolithic version

**Detection:**
Post-decomposition validation: count components per screen (flag if >8), check prop counts (flag if <2), check for circular imports, check naming for screen-specific prefixes.

**Phase to address:**
Phase 3 (Decomposition Engine). But the decomposition RULES must be defined in Phase 1 (Scanner/Catalog Design) so the catalog informs decomposition boundaries.

---

### Pitfall 5: Token Merge Conflicts -- Adopt vs. Fresh Creates Franken-Systems

**What goes wrong:**
When a brownfield project already has design tokens (a `theme.ts`, `variables.css`, Tailwind config, or styled-components theme), Motif must decide: adopt the existing tokens, merge them with Motif-generated tokens, or generate fresh tokens that replace the existing ones. Each choice has failure modes:
- **Adopt:** Motif inherits inconsistent, incomplete, or poorly-structured tokens. The existing system might have 14 shades of gray with no naming convention, 3 different spacing scales, or colors that fail WCAG contrast.
- **Merge:** Motif tries to combine existing tokens with generated ones, producing a Frankenstein system where `--color-primary` comes from the project but `--color-primary-50` through `--color-primary-950` are generated, and they do not form a coherent scale.
- **Fresh:** Motif ignores the existing system entirely, producing designs that look nothing like the user's existing product. The user expected brownfield awareness; they got greenfield output with extra steps.

**Why it happens:**
This is a genuinely hard UX problem. The user's existing design tokens are a form of brand identity -- replacing them feels wrong, but adopting them constraints Motif to their quality level. Motif's Type B input handling (brand constraints) already handles explicit brand colors, but brownfield scanning detects tokens implicitly, without the user having consciously declared them as brand constraints. The scanner might find `--primary: #3b82f6` in a CSS file and treat it as a brand constraint, when the user actually copied it from a template and wants something better.

**Consequences:**
- Merged token files have duplicate or near-duplicate tokens (`--primary` and `--color-primary-500` both existing)
- Generated color scales do not harmonize with adopted base colors
- Spacing systems conflict (project uses 8px base, Motif generates 4px base)
- User sees their old tokens in the showcase alongside new tokens and is confused about which to use
- Components reference tokens from both systems, creating implicit dependencies on both

**Prevention:**
1. Make the decision explicit and user-facing. During init (after scanning), present findings:
   ```
   I found existing design tokens in your project:
   - Colors: 12 custom properties in variables.css (primary: #3b82f6, 6 grays, 5 semantic)
   - Spacing: 8px base unit, 6 scale values
   - Typography: Inter for body, system-ui for display

   How should I handle these?
   a) Adopt -- use your existing tokens as-is, fill gaps only
   b) Evolve -- use your tokens as starting points, improve and extend them
   c) Fresh -- generate a new system (your project's look will change)
   ```
2. "Evolve" (option b) should be the default recommendation. It respects the user's existing work while allowing Motif to add structure, fill gaps, and improve quality.
3. For "evolve" mode, generate a diff-style output showing what changed and why:
   ```
   KEPT: --primary: #3b82f6 (your brand color, LOCKED)
   ADDED: --color-primary-50 through --color-primary-950 (scale derived from your primary)
   REPLACED: --gray-100 through --gray-900 (your grays had inconsistent lightness steps; replaced with even scale)
   ADDED: --color-success, --color-error, --color-warning (missing semantic colors)
   ```
4. Never silently merge. Every token in the output must be traceable to either "kept from project," "derived from project," or "generated new."
5. Store the merge decision in STATE.md so downstream agents know whether they are working with adopted, evolved, or fresh tokens.

**Warning signs:**
- Token showcase shows duplicate-looking colors at slightly different values
- Composed screens reference tokens that do not exist in tokens.css (referencing old project tokens)
- User asks "why did it change my colors?" (fresh mode without clear communication)
- User asks "why didn't it improve my colors?" (adopt mode when evolve was expected)

**Detection:**
After token generation, diff the output against detected project tokens. Flag any project token that was silently dropped (neither kept nor explicitly replaced).

**Phase to address:**
Phase 2 (System Generator Brownfield Mode). But the user-facing decision flow must be designed in Phase 1 (Scanner/Init Flow).

---

### Pitfall 6: Component Catalog Becomes a Context Dump

**What goes wrong:**
The component catalog -- the artifact listing what components exist in the user's project -- tries to capture too much about each component. Instead of "Button component at `src/components/Button.tsx` with variants: primary, secondary, ghost," it captures the full prop types, the full implementation, the full styling, the usage examples. This turns the catalog into a 10,000+ token document that cannot be loaded into any subagent without blowing the context budget.

**Why it happens:**
The cataloger agent (or scanner) reads each component file and extracts "everything useful." For a single React component, "everything useful" includes: the component name, file path, exported interface, prop types (with JSDoc), internal state, CSS classes used, imported dependencies, and usage patterns. Multiply by 30-50 components in a typical project and the catalog exceeds any reasonable context budget. The cataloger does not know which details matter for downstream agents, so it preserves everything to be safe.

**Consequences:**
- Catalog exceeds context budget, cannot be loaded alongside tokens.css + COMPONENT-SPECS.md
- Orchestrator reads the full catalog to decide what to pass to subagents, blowing its 30% context ceiling
- Subagents that receive the catalog spend most of their effective context on project component details and less on design system compliance
- Information overload causes the agent to reference existing components incorrectly (mixing up prop names, confusing similar components)

**Prevention:**
1. Define a strict catalog format: one line per component, maximum 3 columns:
   ```markdown
   | Component | Path | Interface Summary |
   |-----------|------|-------------------|
   | Button | src/components/Button.tsx | variants: primary/secondary/ghost, size: sm/md/lg |
   | Card | src/components/Card.tsx | variant: default/outlined, children |
   | Modal | src/components/Modal.tsx | open: boolean, onClose: () => void, title: string |
   ```
2. Set a hard budget: component catalog must be under 1500 tokens. For a project with 50 components, that is ~30 tokens per component -- enough for name + path + one-line summary.
3. Use the catalog as an INDEX, not a source of truth. When a subagent needs details about a specific component, it reads the actual component file directly. The catalog tells it WHERE to look, not WHAT it will find.
4. Add the catalog to the context engine's profile definitions. The composer profile should include the catalog in `load_if_exists`, not `always_load`. The catalog is helpful context, not mandatory context.

**Warning signs:**
- Catalog file exceeds 1500 tokens (run `token-counter.js` to check)
- Catalog contains prop type definitions or implementation details
- Subagent prompts include the full catalog alongside full COMPONENT-SPECS.md (context competition)
- Orchestrator reads the catalog file contents into its own context (should only read file path)

**Detection:**
Automated: `token-counter.js` on catalog file. Manual: if any single component entry exceeds 2 lines, the catalog is too detailed.

**Phase to address:**
Phase 1 (Catalog Design). The format must be locked before the cataloger is built.

---

### Pitfall 7: Decision Fatigue from Too Many Adopt/Merge/Fresh Choices

**What goes wrong:**
The brownfield flow presents the user with too many decisions. For each detected artifact (colors, spacing, typography, radii, shadows, components, routing patterns, state management), the system asks: "adopt, evolve, or fresh?" The user faces 8-12 binary/ternary choices before any design work begins. They either (a) pick "adopt" for everything to avoid decisions (defeating the purpose of Motif), (b) pick "fresh" for everything to avoid complexity (defeating the purpose of brownfield awareness), or (c) disengage entirely because the tool feels like a configuration wizard, not a design assistant.

**Why it happens:**
The engineering instinct is to give users control over every aspect. Each individual choice makes sense: "Do you want to keep your colors?" is a reasonable question. "Do you want to keep your spacing?" is also reasonable. But asking 8 reasonable questions in sequence creates a burdensome experience. The existing Motif init interview is already 3-4 rounds of questions (product context, design inputs, differentiation seed, screens). Adding 8 more token-merge decisions doubles the cognitive load of initialization.

**Consequences:**
- Users default to extremes (all-adopt or all-fresh) rather than thoughtful per-category decisions
- The init flow takes 10+ minutes of Q&A before any design output is produced
- Users perceive Motif as complex/enterprise-y rather than fast/assistive
- The decision surface area creates more bug surface area (8 independent merge strategies that must all work correctly)

**Prevention:**
1. Collapse to ONE top-level decision with smart defaults:
   ```
   I found an existing design system in your project. How should I work with it?

   a) Respect it -- I'll build on your existing tokens and components
   b) Fresh start -- I'll generate a new design system (your existing look will change)
   c) Let me choose per category -- I'll ask about colors, spacing, typography separately
   ```
   Option (a) maps to "evolve" for everything. Option (b) maps to "fresh" for everything. Option (c) unlocks the per-category flow for power users. Most users will pick (a) or (b) and move on.
2. For option (a) "respect it," apply smart heuristics without asking:
   - If existing colors pass WCAG AA: adopt them as brand constraints (Type B input)
   - If existing colors fail WCAG AA: evolve them (fix contrast, keep hue)
   - If existing spacing uses a consistent scale: adopt it
   - If existing spacing is inconsistent: evolve to nearest standard scale (4px or 8px base)
   - If existing typography uses banned fonts (Inter, system-ui): evolve to Motif-appropriate alternatives
   - If existing typography uses distinctive fonts: adopt them as brand constraints
3. Show what was decided, not ask what to decide:
   ```
   Here's how I'll handle your existing system:
   - Colors: Keeping your primary (#3b82f6) and secondary (#10b981). Improving your grays (inconsistent lightness). Adding missing semantic colors.
   - Typography: Your body font (Inter) is generic -- I'll suggest alternatives. Your display font (Clash Display) is distinctive -- keeping it.
   - Spacing: Your 8px base is solid. I'll extend the scale with missing values.

   Looks good? Or want to adjust anything?
   ```
   This is a single confirmation, not 8 separate decisions.
4. Store the merge strategy in DESIGN-BRIEF.md's Inputs section, extending the existing Type B (Brand Constraints) pattern rather than creating a new input type.

**Warning signs:**
- Init flow has more than 5 rounds of questions
- Users consistently pick the same answer for all categories (sign they are not actually deciding)
- Per-category merge logic has >5 code paths (combinatorial complexity)
- Bug reports about "wrong merge behavior" in specific category combinations

**Detection:**
Count the number of user-facing questions in the brownfield init flow. If more than 2 brownfield-specific questions (beyond the existing init interview), the flow is too complex.

**Phase to address:**
Phase 2 (Init Flow Extension). But the decision to collapse choices must be made in Phase 1 (Design Decisions) before any UI flow is built.

---

## Moderate Pitfalls

---

### Pitfall 8: Scanner Assumes Monorepo is a Single Project

**What goes wrong:**
The scanner encounters a monorepo (Turborepo, Nx, Lerna, yarn workspaces) and scans all packages as if they are one project. It finds 3 different design systems (one per package), 150 components across 5 apps, and conflicting framework choices (one package uses React, another uses Vue). The scan artifact mixes all of them, producing an incoherent project profile.

**Prevention:**
1. Detect monorepo signals: `workspaces` in `package.json`, `turbo.json`, `nx.json`, `lerna.json`, `pnpm-workspace.yaml`.
2. When a monorepo is detected, ask the user which package/app to focus on. Scan that package in isolation.
3. Record the scoped package path in STATE.md so all subsequent operations use the correct root.

**Warning signs:**
- Scan artifact lists components from multiple packages with conflicting patterns
- Framework profile shows multiple frameworks
- Component catalog has duplicate component names from different packages

**Phase to address:**
Phase 1 (Scanner Design).

---

### Pitfall 9: Decomposition Ignores Framework-Specific Component Patterns

**What goes wrong:**
The decomposer extracts components as generic HTML/CSS fragments when the project uses React (JSX), Vue (SFCs), or Svelte (`.svelte` files). The decomposed output does not match the project's component authoring pattern. A React project gets components without proper hook usage. A Vue project gets components without `<script setup>`. A Next.js App Router project gets components without `'use client'` directives where needed.

**Prevention:**
1. The framework profile from scanning (Pitfall 3's prevention) must flow into the decomposer. The decomposer's prompt must specify: "Output components in {framework} format with {router} conventions."
2. Include 1-2 example components from the user's project in the decomposer's context (read the simplest existing component as a "style reference"). This gives the agent the project's actual authoring conventions, not generic framework patterns.
3. Define decomposition templates per framework:
   - React: functional component with typed props, hooks for state
   - Next.js App Router: default to Server Component, add `'use client'` only if interactive
   - Vue 3: `<script setup lang="ts">` + `<template>` + `<style scoped>`
   - Svelte: `<script lang="ts">` + markup + `<style>`

**Warning signs:**
- Decomposed components use class components in a functional-component project
- Missing `'use client'` in interactive components for App Router projects
- Vue components output as React JSX

**Phase to address:**
Phase 3 (Decomposition Engine). Framework profile from Phase 1 is a prerequisite.

---

### Pitfall 10: Existing Component Detection Hallucinates Reuse Opportunities

**What goes wrong:**
The catalog lists a `Button` component in the user's project. The composer agent sees it and generates `import { Button } from '@/components/Button'` in the composed screen. But the existing `Button` has a completely different API than what Motif's COMPONENT-SPECS.md defines. The existing button takes `variant="filled"` while Motif's spec says `variant="primary"`. The composed screen uses Motif's prop names on the project's component, producing silent rendering bugs (wrong variant, missing styles, undefined prop warnings).

**Prevention:**
1. The component catalog must include interface summaries (Pitfall 6's format) so the agent knows the actual prop API.
2. When the composer references an existing project component, it must use THAT component's interface, not Motif's COMPONENT-SPECS.md interface. This requires the prompt to clearly distinguish: "Motif's design system defines Button with these variants. Your project's Button has these variants. Use your project's Button API."
3. Add a "compatibility map" concept: for each Motif component type, note whether the project has a compatible component and what the mapping is:
   ```
   Motif Button(variant="primary") -> Project Button(variant="filled")
   Motif Card(variant="elevated") -> No project equivalent, generate new
   Motif Modal(open, onClose) -> Project Dialog(isOpen, onDismiss)
   ```
4. If no compatibility can be determined, default to generating new components rather than incorrectly using existing ones.

**Warning signs:**
- Composed screens import project components but pass Motif-spec props
- Console warnings about unknown props in development
- Components render with default/missing styles because the wrong variant name was used

**Phase to address:**
Phase 2 (Catalog Enhancement) for the compatibility mapping. Phase 3 (Compose Flow) for the prompt modifications.

---

### Pitfall 11: Scanner Exposes Sensitive Information

**What goes wrong:**
The scanner reads project files indiscriminately and captures sensitive data in the scan artifact: API keys in `.env` files, database connection strings in config files, auth secrets in server-side code. This artifact is then loaded into subagent prompts. While the data stays local (Motif does not transmit scan results), it unnecessarily expands the attack surface and wastes context tokens on non-design information.

**Prevention:**
1. Hardcode an exclusion list: `.env*`, `*.key`, `*.pem`, `*.secret`, `credentials.*`, `*config.server.*`
2. Only scan directories relevant to design: `src/components/`, `src/styles/`, `src/app/` (or equivalents). Never scan `server/`, `api/`, `lib/db/`, `scripts/`.
3. Only read file metadata (path, type, size) for most files. Only read file CONTENTS for component files, style files, and config files (package.json, tsconfig.json, tailwind.config.js).
4. Document what the scanner reads and does not read so users can audit.

**Warning signs:**
- Scan artifact contains strings that look like API keys or connection strings
- Scanner reads server-side code or API route implementations
- Scan artifact is unexpectedly large (reading non-design files)

**Phase to address:**
Phase 1 (Scanner Design). Security exclusions must be in the first version.

---

### Pitfall 12: Decomposition Creates Import Cycles

**What goes wrong:**
The decomposer extracts components that import each other circularly. `Header` imports `Navigation`, `Navigation` imports `UserMenu`, `UserMenu` imports `Header` (to access a shared context or layout reference). In the monolithic file, these were just sections of HTML with no import relationships. Decomposition introduces module boundaries that create cycles.

**Prevention:**
1. Enforce a strict component dependency tree: components can import from the design system (tokens, primitives) and from siblings, but never from parent layout components.
2. Run a post-decomposition cycle check: build an import graph and verify it is a DAG (directed acyclic graph).
3. Shared state or context that creates the cycle should be extracted into a separate module (a context provider, a shared hook, a shared constant) rather than being duplicated or circularly referenced.
4. Limit decomposition depth to 2 levels (Pitfall 4's prevention) which naturally prevents most cycles.

**Warning signs:**
- Build errors about circular imports after decomposition
- Components that reference each other bidirectionally
- The decomposer creating "shared" utility files to resolve its own cycles (sign of over-decomposition)

**Phase to address:**
Phase 3 (Decomposition Engine). Add cycle detection as a post-decomposition validation step.

---

## Minor Pitfalls

---

### Pitfall 13: Scanning Performance on Large Projects

**What goes wrong:**
The scanner uses `glob` and `read` operations to traverse the project. On a large project (10,000+ files), this takes significant time and may hit the Bash tool timeout (120 seconds). The user waits, the scan times out, and the init flow fails.

**Prevention:**
1. Use `find` with depth limits (`-maxdepth 3`) for initial structure detection.
2. Only read files in known component/style directories, not the entire tree.
3. Set a file count ceiling: if the project has >5000 files, only scan `src/` or the detected source root.
4. Add a progress indicator or at minimum an early message: "Scanning project structure..."

**Phase to address:**
Phase 1 (Scanner Implementation).

---

### Pitfall 14: Component Naming Conflicts Between Project and Motif

**What goes wrong:**
The project has a `Card` component. Motif's COMPONENT-SPECS.md also defines `Card`. The decomposer outputs a new `Card` component that follows Motif's spec but shadows the project's existing `Card`. Import resolution becomes ambiguous.

**Prevention:**
1. Decomposed Motif components should use a namespace prefix when conflicting: `MotifCard` or scoped to a `motif/` directory.
2. Better: map Motif's component spec to the project's existing component (Pitfall 10's compatibility map) and use the existing component directly.
3. During decomposition, check for name conflicts against the component catalog and rename proactively.

**Phase to address:**
Phase 3 (Decomposition Engine).

---

### Pitfall 15: Evolve Mode Produces Tokens the Project Cannot Consume

**What goes wrong:**
Motif generates `tokens.css` with CSS custom properties (`:root { --color-primary-500: #3b82f6; }`). But the project's existing token system uses a different format: Tailwind config (`colors: { primary: { 500: '#3b82f6' } }`), TypeScript theme object (`const theme = { colors: { primary500: '#3b82f6' } }`), or SCSS variables (`$primary-500: #3b82f6`). The generated tokens.css is technically correct but useless -- the project cannot consume it without a manual translation layer.

**Prevention:**
1. During scanning, detect the project's token format (CSS custom properties, Tailwind config, TS theme object, SCSS variables, styled-components theme).
2. Generate tokens in the project's native format IN ADDITION to Motif's canonical `tokens.css`. The canonical format remains for Motif's internal agents. A translated format is produced for the user's project.
3. Start with CSS custom properties only (v1.2). Add Tailwind config translation in a later version. This limits scope while covering the most common case.
4. Document clearly: "tokens.css is Motif's canonical token file. For Tailwind projects, see the generated tailwind.tokens.js."

**Warning signs:**
- User asks "how do I use these tokens in my Tailwind project?"
- Composed screens reference CSS variables but the project uses Tailwind utility classes
- Token showcase works but the tokens do not integrate into the project's build pipeline

**Phase to address:**
Phase 2 (Token Evolution). But scope to CSS custom properties only for v1.2. Tailwind/SCSS translation is a follow-up feature.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Scanner Design (Phase 1) | Over-scanning, stale data, wrong framework detection, security exposure | Hard token budget (2000), lazy scanning, framework profile validation, exclusion list |
| Catalog Design (Phase 1) | Context dump, information overload for agents | Index format (name + path + one-line), 1500 token budget, load-on-demand details |
| Init Flow Extension (Phase 2) | Decision fatigue, too many adopt/merge/fresh choices | Single top-level decision, smart defaults, show-don't-ask pattern |
| Token Evolution (Phase 2) | Franken-systems from naive merge, incompatible token formats | Evolve as default, explicit diff output, keep-or-explain every token |
| Decomposition Engine (Phase 3) | Useless components, import cycles, framework mismatch, naming conflicts | Design-system-aligned decomposition, 2-level depth limit, framework templates, cycle detection |
| Compose Flow Update (Phase 3) | Hallucinated reuse of existing components, wrong prop APIs | Compatibility maps, "verify before import" instructions, existing component interface in prompt |

## "Looks Done But Isn't" Checklist

- [ ] **Scanner respects context budget:** `PROJECT-SCAN.md` (or equivalent) is under 2000 tokens
- [ ] **Framework profile is validated:** Scanner output includes router type, styling approach, and import conventions -- not just "React"
- [ ] **Catalog is an index:** Each component entry is 1 line with name + path + summary. No prop type definitions in the catalog.
- [ ] **Token merge is explicit:** Every token in output is labeled "kept," "evolved," or "generated new." No silent drops.
- [ ] **User faces <= 2 brownfield decisions:** Top-level choice (respect/fresh/customize) and confirmation. Not per-category interrogation.
- [ ] **Decomposition produces < 8 components per screen:** Components map to design system primitives + domain-specific patterns, not arbitrary UI chunks.
- [ ] **No import cycles in decomposed output:** Post-decomposition validation confirms DAG structure.
- [ ] **Sensitive files excluded from scan:** `.env*`, credentials, server-side code never read.
- [ ] **Stale scan protection exists:** Either lazy scanning or freshness check before loading scan artifact.
- [ ] **Existing component compatibility mapped:** When the compose flow uses project components, it uses the project's prop API, not Motif's spec API.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Over-scanned context dump | LOW | Re-run scanner with stricter budget; replace artifact; no downstream impact if caught before compose |
| Stale scan causing wrong imports | MEDIUM | Re-scan; diff against current project; re-compose affected screens |
| Wrong framework detection | HIGH | Re-scan with corrected detection; regenerate system if framework affects token/component decisions; re-compose all screens |
| Useless decomposition | MEDIUM | Revert decomposed files; re-decompose with stricter rules; or keep monolithic output (it works, just not decomposed) |
| Franken-system from bad merge | HIGH | Delete generated tokens; re-run system generator with explicit adopt-or-fresh choice; re-compose all screens |
| Decision fatigue abandonment | LOW | Simplify the init flow; user re-runs init with fewer questions; no code impact |
| Component API mismatch | MEDIUM | Update compatibility map; re-compose affected screens with correct prop names |
| Import cycles in decomposition | LOW | Run cycle detector; refactor circular dependencies into shared modules; small, localized changes |

## Integration Gotchas Specific to Motif's Architecture

| Integration Point | Common Mistake | Correct Approach |
|-------------------|----------------|------------------|
| Context engine profiles | Adding scan artifact to `always_load` for all profiles | Add to `load_if_exists` only for composer and system generator. Never load for researcher or reviewer. |
| Orchestrator context ceiling | Reading scan artifact contents to decide what to pass to subagents | Read only scan METADATA (framework, token format, component count). Pass scan FILE PATH to subagent. Let subagent read details in fresh context. |
| STATE.md | No tracking of scan freshness or merge decisions | Add `Scan` section with timestamp, scoped package path, merge strategy. |
| DESIGN-BRIEF.md Inputs | Creating new Input Type E for brownfield | Extend Type B (Brand Constraints) and Type D (Design File) to cover brownfield detection. No new type needed. |
| Subagent spawning | Passing full project component code to subagent prompt | Pass component catalog (index) + specific file paths. Subagent reads files in its fresh window. |
| Existing hooks | Assuming existing hooks (token-check, font-check, aria-check) will catch brownfield-specific issues | Hooks validate Motif's output format. They do not validate that output is compatible with the project. Need new validation for import path correctness, prop API compatibility. |
| Compose workflow | Modifying compose-screen.md to always include brownfield context | Make brownfield context conditional. If no scan exists, compose workflow should work exactly as v1.1. Brownfield is additive, not required. |

## Sources

- Codebase analysis: `context-engine.md` (context budgets, profile definitions, anti-patterns), `state-machine.md` (phase transitions, gate checks), `design-inputs.md` (input types A-D, brand constraint flow), `compose-screen.md` (composer agent context loading, anti-slop checks), `generate-system.md` (token generation algorithm, component spec format), `runtime-adapters.md` (orchestrator context constraints, subagent spawning)
- Existing hooks: `motif-token-check.js`, `motif-font-check.js`, `motif-aria-check.js` (current validation scope and gaps)
- Existing scripts: `token-counter.js`, `contrast-checker.js` (available validation tools)
- Architecture constraints: orchestrator <= 30% context, subagent fresh 200K windows, zero npm deps, markdown-first artifacts
- Training data: patterns from brownfield migration tools (codemod, jscodeshift), design system adoption literature (Storybook migration guides, design token specification patterns), AI coding assistant context management patterns. Confidence: MEDIUM (not verified against current sources due to WebSearch unavailability).

---
*Pitfalls research for: Brownfield Intelligence & Component Decomposition for Motif v1.2*
*Researched: 2026-03-04*
