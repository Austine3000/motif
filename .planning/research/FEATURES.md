# Feature Landscape: Brownfield Intelligence

**Domain:** Brownfield project scanning, component decomposition, and convention-adaptive output for AI design engineering system (Motif v1.2)
**Researched:** 2026-03-04
**Overall confidence:** MEDIUM (training data only; no web verification available)

## Context

Motif v1.1 generates design systems and composes screens into monolithic HTML files that ignore existing project structure. When a user has a React/Next.js/Vue project with established component patterns, file organization conventions, and existing UI components, Motif drops a single large file into `.planning/design/screens/` with no awareness of what already exists. This creates three problems:

1. **Wasted existing work**: Users have components (`Button.tsx`, `Card.tsx`) that Motif ignores and recreates inline.
2. **Convention mismatch**: Output uses `kebab-case` files when the project uses `PascalCase`; outputs a single file when the project uses `components/` + `pages/` + `hooks/` patterns.
3. **Integration friction**: Users must manually decompose monolithic output into proper project structure, defeating the purpose of automation.

v1.2 addresses this with a scan-present-decide-execute flow: the system scans the project, presents findings to the user, the user makes decisions, and then agents execute within those constraints.

---

## Table Stakes

Features users expect when any AI tool claims brownfield awareness. Missing any of these means the tool feels "greenfield-only" and users revert to manual integration.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Project structure scanning** | Every AI coding assistant that touches existing code (Cursor, Copilot Workspaces, Bolt, Claude Code itself) reads project structure before acting. Users will immediately ask "do you know what's already in my project?" and expect yes. Without scanning, Motif operates blind. | MEDIUM | Modifies: `/motif:init` workflow, adds new scan step | Scan must detect: framework (React/Next/Vue/Svelte/HTML), directory layout (`src/` vs flat, `components/` location, `pages/` vs `app/` routing), CSS approach (Tailwind, CSS Modules, styled-components, plain CSS), and package manager. The init workflow already asks for stack; scanning CONFIRMS rather than asks. |
| **Existing component catalog** | Users with 10+ components will not accept Motif recreating a `Button` or `Card` from scratch. GitHub Copilot, Cursor, and v0 all attempt to reuse what exists. Users expect "I already have a Button, use mine." | HIGH | Requires: project scanning, modifies: composer agent context profile, modifies: COMPONENT-SPECS.md format | Must detect existing component files, extract their names and locations, and present to user. Does NOT need to parse component internals — just catalog file paths + export names. Deep prop analysis is v1.3+. |
| **File output convention matching** | When a project uses `src/components/ui/button.tsx` with barrel exports in `index.ts`, Motif output must follow the same pattern. Tools like Cursor and Claude Code already do this implicitly by reading surrounding files. Users do NOT expect to manually rename/move files after generation. | MEDIUM | Requires: project scanning (file naming patterns), modifies: composer output path logic | Detect: file naming convention (PascalCase vs kebab-case vs camelCase), component directory structure, barrel export patterns, file extension (.tsx vs .jsx vs .vue). Composer then writes to the correct location with the correct naming. |
| **Scan results presentation (user decides)** | The core v1.2 contract: "scan, present, user decides." No AI tool should silently make structural decisions about an existing project. v0 and Bolt both show what they found and let users approve before generating. Users expect transparency about what was detected. | LOW | Requires: project scanning, produces: PROJECT-SCAN.md artifact | After scanning, write findings to a structured file and present a summary to the user. User confirms or corrects before any generation happens. This is the trust-building step — "I found 23 components in src/components/, your CSS approach is Tailwind, your naming convention is kebab-case. Correct?" |
| **Composer output to project directories** | Currently all output goes to `.planning/design/screens/`. In a brownfield project, the composed screen must be written to where the project actually expects it — `src/app/dashboard/page.tsx`, not `.planning/design/screens/dashboard.html`. Without this, every compose requires manual file moving. | MEDIUM | Requires: project scanning, scan results confirmation, modifies: compose-screen.md workflow, modifies: composer agent | The composer needs a target directory from the scan results. For Next.js App Router: `src/app/{route}/page.tsx`. For Pages Router: `pages/{route}.tsx`. For plain React: `src/pages/` or `src/views/`. For HTML: project root or `public/`. The orchestrator resolves the path before spawning the composer. |
| **Import existing design tokens** | If a project already has CSS custom properties, Tailwind config colors, or a theme file, Motif should detect and import them rather than generating from scratch. This is the design-system equivalent of scanning components. Overwriting a team's established color palette is unacceptable. | HIGH | Modifies: `/motif:system` workflow, adds token extraction logic | Detect: existing `tailwind.config.*` (colors, spacing, fonts), CSS files with custom properties, theme files. Extract values. Present to user: "I found your existing tokens. Use these as the base?" If yes, Motif wraps them in its token format rather than generating new ones. If no, proceed with fresh generation. |

---

## Differentiators

Features that make Motif's brownfield intelligence notably better than competitors. These leverage Motif's unique position as a design-system-first tool, not just a code generator.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Component gap analysis** | Motif knows what components a vertical NEEDS (from COMPONENT-SPECS.md) and can diff that against what EXISTS (from the scan). "You have Button, Card, and Input. You're missing: TransactionRow, BalanceCard, StatusChip (fintech-specific). I'll generate only the missing ones." No other tool maps domain-required components against existing inventory. This is Motif's domain intelligence applied to brownfield awareness. | MEDIUM | Requires: existing component catalog + vertical component specs, produces: GAP-ANALYSIS.md | The gap analysis compares the scan catalog against COMPONENT-SPECS.md and vertical reference components. Three categories: (1) EXISTS — reuse as-is, (2) EXISTS-PARTIAL — exists but needs variant/state additions, (3) MISSING — must be generated. User approves the categorization before compose runs. |
| **Convention extraction (not just detection)** | Beyond detecting "this project uses Tailwind" — extract the SPECIFIC conventions. "Your buttons use `rounded-lg` not `rounded-md`. Your spacing uses `p-4` and `p-6` never `p-5`. Your cards always have `shadow-sm border border-gray-200`." Then teach the composer to follow these exact patterns. This is convention learning, not just framework detection. | HIGH | Requires: project scanning, pattern analysis of existing component files, modifies: composer instructions | Analyze 3-5 existing components to extract recurring patterns: border-radius choices, spacing preferences, shadow usage, color variable naming. Store as CONVENTIONS.md. Composer loads this alongside tokens.css. This is the hardest feature technically but the highest user-value differentiator. |
| **Component decomposition planner** | When Motif composes a complex screen, instead of one monolithic file, plan the decomposition: "This dashboard screen decomposes into: DashboardLayout (new), MetricsGrid (new, uses existing Card), TransactionList (new, uses existing Table), and QuickActions (new). I'll create 4 component files + 1 page file." Present the plan, user approves, then execute. | MEDIUM | Requires: project scanning (to know file structure conventions), modifies: compose-screen.md, modifies: composer agent output format | The composer currently writes one file. With decomposition: (1) composer plans the component tree, (2) writes an extraction plan to DECOMPOSITION-PLAN.md, (3) user approves, (4) composer writes individual files. The plan includes file paths following detected conventions. |
| **Selective token overlay** | When a project has SOME tokens (e.g., colors from Tailwind) but lacks others (e.g., no icon sizes, no motion tokens, no vertical-specific semantic tokens), Motif fills the gaps without overwriting existing values. "I'll add --icon-sm through --icon-2xl and --shadow-sm/md/lg. Your existing color tokens are preserved." | MEDIUM | Requires: token import (table stakes), modifies: generate-system.md token output | Instead of generating a complete tokens.css that conflicts with existing tokens, generate a motif-extensions.css that ONLY contains tokens the project lacks. Import it alongside the existing system. No conflicts, additive only. |
| **Reuse directive in COMPONENT-SPECS.md** | When a component EXISTS in the project, COMPONENT-SPECS.md should reference it with an import path rather than specifying it from scratch. "Button: USE EXISTING at src/components/ui/button.tsx" tells the composer to import, not recreate. This bridges the gap between Motif's specs and the real codebase. | LOW | Requires: existing component catalog, modifies: COMPONENT-SPECS.md format | Add a `<source>` element to component XML specs: `<source type="existing" path="src/components/ui/button.tsx" />` vs `<source type="generate" />`. The composer reads this and either imports or creates. |
| **Multi-file commit with atomic rollback** | When the composer outputs 5+ files (page + components + styles), commit them atomically. If validation fails, roll back the entire batch. Current single-file output doesn't need this; multi-file decomposition does. | LOW | Requires: component decomposition, uses: existing git commit patterns | The composer already commits. Change from single commit to staged multi-file commit. Validation hook runs before commit; if it fails, unstage all files. |

---

## Anti-Features

Features that seem like they belong in brownfield intelligence but create problems for Motif specifically. Deliberately NOT building these.

| Anti-Feature | Why It Seems Useful | Why It Is Problematic for Motif | What to Do Instead |
|--------------|---------------------|--------------------------------|-------------------|
| **Full AST parsing of existing components** | "Parse every component's props, state, and render tree to understand it completely" | AST parsing requires framework-specific parsers (TypeScript compiler API for TSX, Vue SFC parser for .vue, Svelte compiler for .svelte). Each parser is a significant dependency. More critically, AI agents are unreliable at interpreting parsed ASTs — they work better reading source files directly. The context cost of loading parsed component trees is enormous (easily 5-10K tokens per component) and crowds out the actual composition work. | Catalog components by file path and export name. Let the composer READ the source file at compose time if it needs to understand props. Shallow scan, deep read on demand. |
| **Automatic code migration/refactoring** | "Automatically refactor existing components to match Motif's design system" | Touching existing code that works is the fastest way to destroy user trust. If a user's Button.tsx works and their team knows it, rewriting it to use Motif tokens breaks their mental model and potentially their tests. Motif is additive — it generates NEW things, not refactors OLD things. | Generate NEW components that complement existing ones. If the user wants to migrate existing components to Motif tokens, that's a manual decision with explicit user direction — never automatic. |
| **Runtime component discovery** | "Use a dev server to dynamically discover rendered components via browser inspection" | Requires a running dev server, browser automation (Puppeteer/Playwright), and framework-specific rendering. This is an entirely different tool category (Storybook, Chromatic). Motif operates at design-time via file analysis, not runtime inspection. Adding a runtime dependency makes the tool unusable for projects that aren't currently runnable. | Static file scanning is sufficient. Read `package.json`, read directory structure, read component files. No server required. |
| **Design system migration assistant** | "Detect their current design system (Material UI, Chakra, Ant Design) and migrate to Motif tokens" | Migration implies replacing. Users of Material UI chose it deliberately and have hundreds of component instances. Migrating is a multi-sprint project, not a tool feature. Motif should COEXIST with existing design systems, not replace them. | Detect existing design systems and note them in the scan. If Material UI is present, the composer generates components that work alongside it (shared spacing, complementary colors) rather than conflicting. Co-existence, not replacement. |
| **Intelligent merge conflict resolution** | "When Motif output conflicts with existing files, automatically resolve the merge" | Automatic merge resolution is wrong as often as it's right. When it's wrong in a design system context, the result is visual inconsistency that's hard to debug ("why is this button 2px off?"). Design decisions require human judgment on conflicts. | Never overwrite existing files without explicit user confirmation. The decomposition planner shows what will be created/modified BEFORE it happens. New files are safe; modified files require approval. |
| **Cross-project design system sharing** | "Share design tokens across multiple projects in a monorepo" | Monorepo support is a distribution concern, not a brownfield concern. It requires package management, versioning, and multi-project coordination. Motif is a single-project tool. | Generate tokens for ONE project. If the user wants to share tokens across a monorepo, they copy tokens.css or publish it as a package manually. |
| **Storybook/docs generation for existing components** | "Generate Storybook stories for components found during scanning" | Documentation generation is a separate tool category. It requires understanding component APIs deeply (props, variants, states), which conflicts with the "shallow scan" principle. Tools like Storybook auto-docs, Docgen, and react-docgen already do this better. | Include existing components in the scan catalog with their file paths. Users can use dedicated documentation tools for existing component docs. |

---

## Feature Dependencies

```
PROJECT SCANNING (during /motif:init or /motif:scan)
    |
    +---> Scan results presentation (PROJECT-SCAN.md)
    |         |
    |         +---> User confirms/corrects findings
    |                   |
    |                   +---> Existing component catalog
    |                   |         |
    |                   |         +---> Component gap analysis (vs COMPONENT-SPECS.md)
    |                   |         |         |
    |                   |         |         +---> Reuse directives in COMPONENT-SPECS.md
    |                   |         |
    |                   |         +---> Composer knows what to import vs generate
    |                   |
    |                   +---> File output convention matching
    |                   |         |
    |                   |         +---> Composer writes to correct paths
    |                   |         |
    |                   |         +---> Component decomposition planner
    |                   |                   |
    |                   |                   +---> Multi-file commit with atomic rollback
    |                   |
    |                   +---> Existing token import
    |                             |
    |                             +---> Selective token overlay (fill gaps only)
    |
    +---> Convention extraction (reads existing component source)
              |
              +---> CONVENTIONS.md
                        |
                        +---> Composer follows project conventions
```

The critical dependency chain is: **project scanning MUST happen before** any brownfield-aware feature can function. Scanning produces the data that every downstream feature consumes. The scan results MUST be confirmed by the user before agents act on them — this is the trust contract.

Secondary chain: **convention extraction depends on scanning AND on having existing components to analyze**. If the project has fewer than 3 components, convention extraction provides too little signal and should be skipped.

---

## Scan Detail Specification

### What the scanner detects (Phase 1 — required)

| Category | Detection Method | Output |
|----------|-----------------|--------|
| **Framework** | Read `package.json` dependencies for react, next, vue, svelte, @angular/core. Check for `vite.config.*`, `next.config.*`, `nuxt.config.*`. | Framework name + version |
| **Directory layout** | Check for `src/`, `app/`, `pages/`, `components/`, `lib/`, `utils/`, `hooks/`, `styles/`. | Directory tree summary |
| **Component locations** | Glob for `*.tsx`, `*.jsx`, `*.vue`, `*.svelte` in likely component directories. Filter out test files, stories, configs. | Component file list with paths |
| **CSS approach** | Check for `tailwind.config.*`, `postcss.config.*`, `*.module.css`, `styled-components` in deps, `@emotion` in deps, `.css` files with custom properties. | CSS strategy name |
| **Naming conventions** | Sample 5-10 component filenames. Detect pattern: PascalCase (`Button.tsx`), kebab-case (`button.tsx`), index pattern (`button/index.tsx`). | Convention name + examples |
| **Package manager** | Check for `package-lock.json` (npm), `yarn.lock` (yarn), `pnpm-lock.yaml` (pnpm), `bun.lockb` (bun). | Package manager name |
| **Existing tokens/theme** | Check for CSS custom properties in `*.css` files, Tailwind config colors/spacing, theme files (`theme.ts`, `theme.js`). | Token source + sample values |
| **Routing pattern** | Next.js: `app/` (App Router) vs `pages/` (Pages Router). Vue: check for `vue-router`. React: check for `react-router-dom`. | Router type + route directory |

### What the scanner does NOT detect (out of scope)

- Component prop signatures (too deep for shallow scan)
- Component internal state logic
- API endpoints or data fetching patterns
- Test coverage or test framework
- CI/CD configuration
- Deployment target

---

## Scan Output: PROJECT-SCAN.md Format

```markdown
# Project Scan Results

**Scanned:** [date]
**Confidence:** [HIGH if package.json found, MEDIUM if inferred from files, LOW if minimal project]

## Framework
[Name] [version] — detected from [source]

## Directory Layout
\`\`\`
src/
  app/          ← Next.js App Router pages
  components/
    ui/         ← Reusable UI components (14 files)
    features/   ← Feature-specific components (8 files)
  lib/          ← Utilities
  hooks/        ← Custom hooks (3 files)
  styles/       ← Global styles
\`\`\`

## CSS Approach
[Tailwind CSS v3.4 | CSS Modules | styled-components | plain CSS + custom properties]

## Naming Conventions
- Components: [PascalCase] (e.g., Button.tsx, UserCard.tsx)
- Directories: [kebab-case] (e.g., components/user-profile/)
- Barrel exports: [yes/no] (index.ts re-exports)

## Existing Components (N found)
| Component | Path | Category |
|-----------|------|----------|
| Button | src/components/ui/button.tsx | UI primitive |
| Card | src/components/ui/card.tsx | UI primitive |
| UserAvatar | src/components/ui/user-avatar.tsx | UI primitive |
| DashboardHeader | src/components/features/dashboard-header.tsx | Feature |
| ... | ... | ... |

## Existing Design Tokens
| Source | Type | Sample Values |
|--------|------|---------------|
| tailwind.config.ts | Colors | primary: #2563EB, secondary: #7C3AED |
| tailwind.config.ts | Spacing | Uses default Tailwind scale |
| globals.css | Custom Properties | --background: #fff, --foreground: #000 |

## Routing
[Next.js App Router] — pages in src/app/

## Package Manager
[pnpm] — detected from pnpm-lock.yaml
```

---

## MVP Recommendation

### Must Ship (Table Stakes) — brownfield is non-functional without these

1. **Project structure scanning** — the foundation everything else depends on. Detect framework, directory layout, CSS approach, naming conventions, routing, existing components, existing tokens. Write to PROJECT-SCAN.md.

2. **Scan results presentation** — present findings to user, get confirmation. This is the trust contract. Without this, users don't trust brownfield features.

3. **File output convention matching** — composer writes files to correct project directories with correct naming. This is the minimum viable "it fits my project."

4. **Composer output to project directories** — composed screens go to `src/app/dashboard/page.tsx`, not `.planning/design/screens/dashboard.html`. This is the single change that makes Motif feel brownfield-aware.

5. **Existing component catalog** — detect and list existing components so the composer knows what to import rather than recreate. The catalog is a file list, not deep analysis.

6. **Import existing design tokens** — detect existing CSS custom properties and Tailwind colors. Present to user: "Use these?" If yes, wrap in Motif format. If no, generate fresh.

### Should Ship (Differentiators) — makes Motif notably better than alternatives

7. **Component gap analysis** — diff existing components against vertical-required components. Show what's missing. Generate only what's needed.

8. **Reuse directive in COMPONENT-SPECS.md** — `<source type="existing" path="..." />` tells the composer to import, not recreate.

9. **Component decomposition planner** — plan multi-file output before writing. User approves the file plan.

10. **Selective token overlay** — generate `motif-extensions.css` for missing tokens only, preserving existing ones.

### Defer to v1.3+

- **Convention extraction** — analyzing existing component patterns to teach the composer. HIGH complexity, needs multiple analysis passes. High value but not blocking for v1.2.
- **Multi-file commit with atomic rollback** — nice-to-have safety net. Can use standard git patterns initially.
- **Cross-framework component bridge** — adapting output between React/Vue/Svelte. Currently each framework is a separate concern.

---

## Integration with Existing Pipeline

### How brownfield features modify each pipeline step

```
/motif:init (MODIFIED)
  NEW STEP: After interview, run project scanner
  NEW STEP: Present scan results, get user confirmation
  NEW OUTPUT: .planning/design/PROJECT-SCAN.md
  MODIFIED: PROJECT.md now includes "Existing Components" and "Existing Tokens" sections
  MODIFIED: STATE.md gets new field: "Scan Status: [scanned|unscanned|skipped]"

/motif:research (UNCHANGED)
  Research is about domain patterns, not project structure.
  No brownfield modifications needed.

/motif:system (MODIFIED)
  NEW STEP: Check PROJECT-SCAN.md for existing tokens
  IF existing tokens found AND user approved reuse:
    → EXTRACT mode: wrap existing tokens in Motif format
    → OVERLAY mode: generate only missing tokens into motif-extensions.css
  IF no existing tokens OR user chose fresh:
    → Normal generation (unchanged)
  MODIFIED: COMPONENT-SPECS.md gets <source> directives for existing components
  NEW OUTPUT: GAP-ANALYSIS.md (what components exist vs what's needed)

/motif:compose (MODIFIED — most changes here)
  MODIFIED: Orchestrator resolves target file path from scan results + screen name
  MODIFIED: Composer agent loads PROJECT-SCAN.md (conventions, existing components)
  MODIFIED: Composer imports existing components instead of recreating
  MODIFIED: Composer writes to project directory, not .planning/design/screens/
  NEW STEP: Decomposition plan presented to user before writing (differentiator)
  MODIFIED: Commit includes all decomposed files atomically

/motif:review (MINOR MODIFICATION)
  MODIFIED: Reviewer checks import correctness (did composer use existing Button?)
  MODIFIED: Reviewer checks convention compliance (correct file naming?)
  No other changes.

/motif:fix (UNCHANGED)
  Fix agent reads review file and fixes. Brownfield awareness is inherited
  from the composed output — no additional brownfield logic needed.
```

### New command: /motif:scan (optional)

For users who want to re-scan after project changes, or who skipped scanning during init:

```
/motif:scan — Re-scan project structure
  Reads: project files, package.json, directory structure
  Writes: .planning/design/PROJECT-SCAN.md (overwrites previous)
  Presents: updated findings to user
  Updates: STATE.md scan status
```

This is optional — scanning during `/motif:init` is the primary path. `/motif:scan` is for re-scanning when the project changes.

---

## Context Engine Updates

### New context profile: Scanner

```xml
<context_profile name="scanner">
  <always_load>
    package.json
    tsconfig.json (if exists)
  </always_load>
  <scan_directories>
    src/
    app/
    pages/
    components/
    lib/
    styles/
    public/
  </scan_directories>
  <scan_files>
    tailwind.config.*
    postcss.config.*
    next.config.*
    vite.config.*
    nuxt.config.*
    *.css (in styles/ or root, first 5 only)
  </scan_files>
  <never_load>
    node_modules/
    .git/
    dist/
    build/
    .next/
    .nuxt/
    coverage/
  </never_load>
</context_profile>
```

### Modified context profile: Composer (brownfield additions)

```xml
<context_profile name="composer">
  <always_load>
    .planning/design/PROJECT.md
    .planning/design/system/tokens.css
    .planning/design/system/COMPONENT-SPECS.md
    .planning/design/system/ICON-CATALOG.md
    .planning/design/PROJECT-SCAN.md          <!-- NEW: brownfield scan results -->
  </always_load>
  <load_if_exists>
    .planning/design/DESIGN-RESEARCH.md
    .planning/design/screens/{previous-screen}-SUMMARY.md
    .planning/design/system/GAP-ANALYSIS.md   <!-- NEW: component gap analysis -->
  </load_if_exists>
  <!-- Composer may also read individual existing component files
       referenced in COMPONENT-SPECS.md <source> directives,
       but ONLY the ones it needs to import for the current screen -->
</context_profile>
```

### New context budget additions

| File | Max Tokens | Purpose |
|------|-----------|---------|
| PROJECT-SCAN.md | 1,500 | Scan results: framework, directories, components, tokens, conventions |
| GAP-ANALYSIS.md | 800 | Component gap analysis: exists/partial/missing |
| CONVENTIONS.md | 1,000 | Extracted project conventions (v1.3 differentiator) |

**Updated total context budget for brownfield-aware composer**: ~18,300 tokens (from ~15,000), leaving ~181,700 tokens for composition work. This is well within budget.

---

## State Machine Updates

### New state field

```markdown
## Scan Status
[unscanned | scanned | skipped]
```

### Modified phase flow

```
UNINITIALIZED → INITIALIZED (+ optionally SCANNED) → RESEARCHED → SYSTEM_GENERATED → COMPOSING → ...
```

Scanning is NOT a separate phase — it's a sub-step of INITIALIZED. The scan happens during `/motif:init` or via `/motif:scan`. The state tracks whether scanning occurred so downstream steps know whether brownfield features are available.

### Gate check modifications

```xml
<gate_check>
  <command>/motif:compose</command>
  <requires_phase>SYSTEM_GENERATED or COMPOSING or ITERATING</requires_phase>
  <warns_if>Scan Status is "unscanned" AND project has package.json.
    "Your project appears to have existing code, but hasn't been scanned.
     Run /motif:scan first for better integration, or continue for greenfield-style output."
  </warns_if>
</gate_check>
```

---

## Competitive Landscape Context

How the broader ecosystem handles brownfield:

### What AI coding assistants currently do (MEDIUM confidence — training data)

| Tool | Scanning | Component Reuse | Convention Matching | Decomposition |
|------|----------|----------------|--------------------|--------------|
| **Cursor** | Reads entire codebase into context. No structured scan. | Implicitly reuses via codebase context. No explicit catalog. | Matches conventions via example (sees existing code). | Generates into existing file structure naturally. |
| **Claude Code** | Reads files on demand. Tree/glob for structure. | Implicit — reads existing files when told to. | Matches conventions when shown examples. | User directs file placement. |
| **v0 (Vercel)** | No project scanning. Generates standalone components. | No reuse — generates fresh every time. | Generates shadcn/ui convention by default. | Single component output, user integrates. |
| **Bolt.new** | Reads project structure for full-app generation. | Limited — regenerates most things. | Framework-specific conventions (Next.js, Vite). | Multi-file output built-in for full apps. |
| **Lovable** | Full project context in browser IDE. | Modifies existing files in place. | Inherits conventions from existing code. | Operates on existing file structure. |

### Where Motif differentiates

None of these tools do **design-system-aware brownfield scanning**. They read code but don't understand design tokens, component specifications, or vertical-domain requirements. Motif's gap analysis ("you have Button and Card but you're missing TransactionRow for fintech") is unique. The closest comparison is Storybook's component catalog, but that requires runtime rendering — Motif does it via static file analysis.

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Table stakes features | HIGH | These are observable patterns in every AI coding tool. Training data is consistent across multiple sources and aligns with direct analysis of Motif's current pipeline gaps. |
| Differentiators | MEDIUM | Component gap analysis and reuse directives are novel features without direct competitors to reference. Confidence comes from analysis of Motif's existing architecture (vertical references, COMPONENT-SPECS.md format) which supports these features naturally. |
| Anti-features | HIGH | Each anti-feature is justified by Motif's specific architecture constraints (context-engine budgets, subagent pattern, file-based agent communication). These are architecture-driven exclusions, not opinion. |
| Competitive landscape | LOW | Based on training data only. No web verification available. Tool capabilities may have changed since training cutoff. Specific claims about v0, Bolt, Lovable, and Cursor should be validated. |
| Pipeline integration points | HIGH | Based on direct analysis of current workflow files (init.md, generate-system.md, compose-screen.md, context-engine.md, state-machine.md). Integration points are precisely identified from existing code. |
| Context budget impact | HIGH | Calculated from existing context-engine.md budgets. The +3,300 token increase for brownfield files is well within the 200K token window. |

---

## Sources

- Direct codebase analysis: `/motif:init` workflow, `/motif:compose` workflow, `/motif:system` workflow, `context-engine.md`, `state-machine.md`, `design-inputs.md`, `motif-screen-composer.md` agent
- Existing v1.1 research: `.planning/research/FEATURES.md` (icon integration), `.planning/research/ARCHITECTURE.md`, `.planning/research/SUMMARY.md`
- Training data (MEDIUM confidence): Cursor, Claude Code, v0, Bolt.new, Lovable brownfield behavior patterns
- Training data (HIGH confidence): React/Next.js/Vue project structure conventions, Tailwind CSS configuration patterns, CSS custom property detection methods
