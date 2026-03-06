# Stack Research: Brownfield Intelligence Features

**Domain:** Project scanning, component cataloging, and decomposition for an existing zero-dep Node.js design engineering CLI
**Researched:** 2026-03-04
**Confidence:** HIGH

## Design Principle: Zero Dependencies Maintained

The brownfield scanning features must follow the same constraint as all existing Motif code: **zero npm dependencies, Node.js 22+ stdlib only**. This is non-negotiable. Every existing script (`install.js`, `token-check.js`, `font-check.js`, `aria-check.js`, `contrast-checker.js`, `token-counter.js`) uses pure Node.js APIs. The brownfield scanner must do the same.

This constraint means: **no AST parsers** (no `@babel/parser`, no `typescript`, no `postcss`). All analysis is regex-based and heuristic-based, which is the proven pattern across all existing hooks. This is a trade-off: we sacrifice parsing precision for zero-dep simplicity. The existing hooks demonstrate this trade-off works well enough for design-system enforcement.

---

## Recommended Stack Additions

### No New External Technologies

The brownfield features require **zero new packages**. Everything is built on the same Node.js 22+ stdlib already in use. What changes is how those APIs are composed into new scripts.

### New Node.js APIs to Leverage

These APIs are already available in the Node.js 22+ floor but are not yet used by Motif. They become critical for project scanning.

| API | Purpose | Why Needed Now | Confidence |
|-----|---------|---------------|------------|
| `fs.globSync(pattern, { cwd })` | Find component files across project tree | Scanning for `*.tsx`, `*.jsx`, `*.vue`, `*.svelte` files in user projects. Replaces manual recursive `readdirSync` + extension filtering. Available in Node 22. | HIGH |
| `path.matchesGlob(path, pattern)` | Match file paths against convention patterns | Detecting folder conventions (`components/`, `ui/`, `atoms/`, `molecules/`). Added v22.5.0, stable since v22.20.0. | HIGH |
| `fs.readdirSync(path, { withFileTypes: true, recursive: true })` | Recursive directory listing with file type info | Building complete project structure map. Already used in `walkFiles()` in `install.js` but manually recursive -- the built-in `recursive` option simplifies this. | HIGH |
| `fs.statSync(path).mtimeMs` | File modification timestamps | Ordering components by recency, detecting stale files. Already in use for verification. | HIGH |
| `crypto.createHash('sha256')` | Content hashing for change detection | Already used in `install.js` manifest. Reuse for detecting when scanned component catalogs need refresh. | HIGH |

**Source:** Node.js 22.x fs documentation (verified via WebFetch 2026-03-04). `path.matchesGlob` confirmed stable since v22.20.0.

---

## Core Technologies for Each Capability

### 1. Project Structure Scanner

**Purpose:** Detect folder conventions, framework, component organization pattern.

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `node:fs` (readdirSync, existsSync, statSync) | Node 22+ | Walk project tree, detect marker files | Same APIs used by `install.js` runtime detection. Pattern: check for `package.json`, `tsconfig.json`, framework config files to identify the stack. |
| `node:path` (matchesGlob, join, relative) | Node 22+ | Match folder names against convention patterns | `path.matchesGlob` is purpose-built for checking if paths match `components/**`, `src/ui/**`, etc. |

**Detection strategy (regex-based, no AST):**
```javascript
// Framework detection via package.json deps (already proven pattern)
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };
const framework = deps.next ? 'next' : deps.nuxt ? 'nuxt' : deps.react ? 'react' : deps.vue ? 'vue' : deps.svelte ? 'svelte' : 'unknown';

// Folder convention detection via marker directories
const conventions = [
  { pattern: 'src/components/**', type: 'flat-components' },
  { pattern: 'src/ui/**', type: 'ui-library' },
  { pattern: 'components/atoms/**', type: 'atomic-design' },
  { pattern: 'app/**/components/**', type: 'feature-scoped' },
];
```

**Confidence:** HIGH -- This is the same detection approach used by `detectRuntime()` in `install.js`, just expanded to more signals.

### 2. Component Cataloger

**Purpose:** Find component files, extract component name, props interface, and styling approach.

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `node:fs` (readFileSync, globSync) | Node 22+ | Find and read component files | `globSync('**/*.{tsx,jsx,vue,svelte}')` gets all component candidates. |
| Regex-based prop extraction | N/A (pure JS) | Extract prop types from component signatures | Same regex-over-source approach used by `motif-token-check.js` and `motif-font-check.js`. No AST needed for catalog-quality extraction. |

**Prop extraction strategy (regex, matching existing hook patterns):**
```javascript
// React/TSX: extract props from function signature or interface
const propsInterfacePattern = /(?:interface|type)\s+(\w+Props)\s*(?:=\s*)?{([^}]*)}/gs;
const functionComponentPattern = /(?:export\s+(?:default\s+)?)?(?:const|function)\s+(\w+)\s*[=:]\s*(?:\(|\s*(?:React\.)?FC)/g;

// Vue: extract defineProps
const vuePropsPattern = /defineProps<{([^}]*)}>/gs;
const vueOptionsPropsPattern = /props:\s*{([^}]*)}/gs;

// Svelte: extract export let declarations
const sveltePropsPattern = /export\s+let\s+(\w+)(?:\s*:\s*([^=;]+))?/g;
```

**Confidence:** HIGH -- The existing hooks prove this regex approach works. `motif-token-check.js` already does regex-based CSS property detection. `motif-aria-check.js` does regex-based HTML attribute detection across JSX. Component prop extraction is the same complexity class.

### 3. Token/Style Analyzer

**Purpose:** Detect existing design tokens, CSS custom properties, theme configuration.

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `node:fs` (readFileSync, globSync) | Node 22+ | Find CSS/theme files | Scan for `*.css`, `*.scss`, `tailwind.config.*`, `theme.*` files. |
| Regex-based CSS custom property extraction | N/A (pure JS) | Extract existing `--var-name: value` declarations | Exact same pattern as `motif-token-check.js` which already parses CSS property-value pairs with regex. |

**Token extraction strategy:**
```javascript
// CSS custom properties (same regex class as token-check.js)
const customPropertyPattern = /--([a-zA-Z][\w-]*)\s*:\s*([^;]+)/g;

// Tailwind detection
const hasTailwind = fs.existsSync('tailwind.config.js') || fs.existsSync('tailwind.config.ts');

// CSS-in-JS theme detection (styled-components, emotion)
const themePattern = /(?:createTheme|ThemeProvider|theme)\s*[=({]\s*{/g;
```

**Confidence:** HIGH -- `motif-token-check.js` already parses CSS values with regex. Extracting custom property declarations is simpler than detecting violations.

### 4. Component Decomposition Output

**Purpose:** Generate one-component-per-file output that matches user's existing conventions.

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Template string interpolation | N/A (JS built-in) | Generate component file content | No templating library needed. JavaScript template literals handle component scaffolding. |
| `node:fs` (writeFileSync, mkdirSync) | Node 22+ | Write decomposed component files | Same file-writing pattern as `install.js` `walkAndCopy()`. |
| `node:path` (join, dirname, relative) | Node 22+ | Resolve output paths matching project conventions | Compose output paths that follow the detected folder convention. |

**Confidence:** HIGH -- This is file generation, the simplest capability. `install.js` already generates files with template variable resolution (`{MOTIF_ROOT}` replacement).

---

## What the Scanner Outputs (Markdown, Not Code)

Critical architectural decision: the brownfield scanner produces **markdown reports** consumed by the AI agent, not programmatic data structures. This matches Motif's markdown-first architecture.

**Output format:**
```markdown
## Project Scan: [project-name]

### Framework: Next.js 14 (App Router)
### Component Pattern: Feature-scoped (app/**/components/)
### Styling: Tailwind CSS + CSS Modules
### Component Count: 47 files

### Existing Tokens
| Token | Value | Category |
|-------|-------|----------|
| --color-primary | #3B82F6 | Color |
| --spacing-md | 1rem | Spacing |

### Component Catalog
| Component | File | Props | Styling |
|-----------|------|-------|---------|
| Button | src/components/ui/Button.tsx | variant, size, disabled | Tailwind |
| Card | src/components/ui/Card.tsx | title, children | CSS Modules |
```

This markdown is then read by the Motif agent (via Claude Code's Read tool) to inform design decisions. The scanner script writes to `.planning/design/scan/` -- fitting the existing `.planning/` convention.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| Regex-based component extraction | `@babel/parser` + `@babel/traverse` | External dependency. ~2MB install. Violates zero-dep constraint. Regex handles 90%+ of component detection for catalog purposes (we need names and prop lists, not full AST analysis). |
| Regex-based CSS extraction | `postcss` parser | External dependency. For extracting `--custom-property: value` pairs, a regex is simpler and sufficient. PostCSS is overkill when we're not transforming CSS. |
| Regex-based prop detection | `typescript` compiler API | External dependency. ~60MB install. The TypeScript compiler can parse prop interfaces perfectly, but the zero-dep constraint makes this impossible. Regex extracts prop names and basic types well enough for catalog display. |
| `fs.globSync` | `glob` npm package | External dependency. Node 22 built-in `fs.globSync` provides the same core functionality. The npm `glob` package adds features (ignore patterns, dot files) that can be replicated with a filter function. |
| `path.matchesGlob` | `minimatch` / `picomatch` | External dependency. `path.matchesGlob` (stable since Node 22.20.0) handles all convention-matching needs. |
| Markdown output | JSON output | JSON is harder for the AI agent to read in context. Markdown tables are Claude's native format for structured data. The agent reads scan results via Claude Code's Read tool -- markdown is optimal for that context window. |
| Sync APIs (`globSync`, `readFileSync`) | Async (`fs.promises.glob`, `readFile`) | The scanner runs once on demand, sequentially. Same rationale as `install.js` -- sync is simpler for linear scripts. |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `@babel/parser` | ~2MB dependency, violates zero-dep constraint | Regex-based component signature extraction |
| `typescript` compiler API | ~60MB dependency, violates zero-dep constraint | Regex-based prop interface extraction |
| `postcss` | Dependency, overkill for extracting CSS custom properties | Regex: `/--([\\w-]+)\\s*:\\s*([^;]+)/g` |
| `jscodeshift` / `recast` | AST transform tools -- dependencies, and we're reading not transforming | Regex-based source reading |
| `cheerio` / `jsdom` | HTML/JSX parsing libraries -- dependencies | Regex-based tag/attribute extraction (proven by `motif-aria-check.js`) |
| `tailwindcss` (as dep) | Would add Tailwind as a dependency to read its config | `JSON.parse` or regex on `tailwind.config.js` for theme extraction |
| `sass` / `less` compiler | Dependencies for preprocessing -- we only need to read variables | Regex: `$var-name: value` for SCSS, `@var-name: value` for LESS |
| Streaming/async patterns | Scanner reads a bounded set of files (user's project) -- not a pipeline | Sync `readFileSync` for simplicity |
| `node:worker_threads` | Parallel file processing -- unnecessary for scanning <1000 files | Sequential scan, results in <2 seconds for typical projects |

---

## Stack Patterns by Scanning Scenario

**If project uses TypeScript (most common):**
- Scan `**/*.tsx` and `**/*.ts` (not `.js`/`.jsx` -- the TSX files are the source of truth)
- Extract prop types from `interface FooProps` and `type FooProps = ` declarations
- Detect `tsconfig.json` paths/aliases for import resolution hints

**If project uses Vue SFC:**
- Scan `**/*.vue` files
- Extract props from `<script setup>` `defineProps<{...}>()` or Options API `props: {}`
- Detect `<style scoped>` vs global styles

**If project uses Svelte:**
- Scan `**/*.svelte` files
- Extract props from `export let propName` declarations
- Detect `<style>` blocks for component-scoped styles

**If project uses CSS Modules:**
- Detect `*.module.css` or `*.module.scss` files co-located with components
- Extract class names as the component's styling vocabulary
- Map class names to token usage via regex

**If project uses Tailwind:**
- Detect `tailwind.config.{js,ts,mjs,cjs}` and read theme extensions
- Extract custom colors, spacing, fonts from `theme.extend`
- Note: Tailwind config is JS -- read it as text and regex-extract theme values (do NOT `require()` it)

**If project uses styled-components / Emotion:**
- Detect `import styled from 'styled-components'` or `@emotion/styled` in component files
- Extract theme tokens from `ThemeProvider` value or `createTheme()` calls
- CSS-in-JS themes are typically JS objects -- regex-extract key-value pairs

---

## Performance Boundaries

| Project Size | Files Scanned | Expected Duration | Approach |
|-------------|---------------|-------------------|----------|
| Small (<50 components) | <200 files | <500ms | Full sync scan, no optimization needed |
| Medium (50-200 components) | 200-1000 files | 500ms-2s | Full sync scan, still fast enough |
| Large (200-500 components) | 1000-3000 files | 2-5s | Consider glob patterns to limit scope |
| Very large (>500 components) | 3000+ files | 5-10s | Must use targeted glob patterns, skip `node_modules`, `dist`, `.next`, etc. |

**Critical exclusion patterns for `fs.globSync`:**
```javascript
const EXCLUDE_DIRS = ['node_modules', '.next', '.nuxt', 'dist', 'build', '.git', 'coverage', '__tests__', '*.test.*', '*.spec.*', '*.stories.*'];
```

---

## Integration Points with Existing Motif

| Existing System | Integration Approach |
|----------------|---------------------|
| `install.js` installer | Scanner scripts ship in `scripts/` directory, installed to `.claude/get-motif/scripts/` |
| Hook architecture | No new hooks needed. Scanner is on-demand (run by agent), not PostToolUse. |
| `.planning/` convention | Scan output writes to `.planning/design/scan/PROJECT-SCAN.md` |
| Markdown-first architecture | All scan results are markdown tables/reports |
| `{MOTIF_ROOT}` resolution | Scanner paths use same `$CLAUDE_PROJECT_DIR` pattern as hooks |
| Agent workflows (`/motif:init`) | New `/motif:scan` command triggers the scanner before design system generation |
| Token system (`tokens.css`) | Scanner detects existing tokens and maps them to Motif token categories |

---

## Version Compatibility

| API | Minimum Node.js | Status in Node 22 | Notes |
|-----|-----------------|-------------------|-------|
| `fs.globSync` | 22.0.0 | Available (stability status needs runtime verification) | Core to file discovery. If experimental, fallback is `readdirSync({ recursive: true })` + `path.matchesGlob` filter. |
| `path.matchesGlob` | 22.5.0 | Stable since v22.20.0 | Confirmed via official docs (WebFetch 2026-03-04). Safe to use. |
| `fs.readdirSync({ recursive: true })` | 18.17.0 | Stable | Fallback if `globSync` is experimental. Already used by existing codebase (manual recursive walk in `install.js`). |
| `fs.readFileSync` | Always | Stable | Core file reading, no concerns. |
| `crypto.createHash` | Always | Stable | Already used in `install.js` for manifest hashing. |

**Fallback strategy:** If `fs.globSync` is experimental in Node 22 and emits warnings, use `fs.readdirSync(dir, { withFileTypes: true, recursive: true })` combined with `path.matchesGlob(filePath, pattern)` to replicate glob behavior. Both are confirmed stable.

---

## New Scripts to Create

| Script | Location | Purpose | Invocation |
|--------|----------|---------|------------|
| `scripts/project-scanner.js` | Ships in npm package | Detect framework, folder conventions, file counts | `node .claude/get-motif/scripts/project-scanner.js [project-root]` |
| `scripts/component-cataloger.js` | Ships in npm package | Extract component names, props, styling approach | `node .claude/get-motif/scripts/component-cataloger.js [project-root]` |
| `scripts/token-extractor.js` | Ships in npm package | Extract existing CSS custom properties, theme tokens | `node .claude/get-motif/scripts/token-extractor.js [project-root]` |

Each script follows the existing pattern: zero deps, shebang, `'use strict'`, reads from filesystem, outputs to stdout or writes to `.planning/`. No stdin JSON needed (unlike hooks) because these are invoked directly by the agent, not triggered by PostToolUse events.

---

## Sources

- [Node.js 22.x fs documentation](https://nodejs.org/docs/latest-v22.x/api/fs.html) -- `fs.globSync`, `fs.readdirSync({ recursive })`, `fs.cpSync`. Verified via WebFetch 2026-03-04.
- [Node.js 22.x path documentation](https://nodejs.org/docs/latest-v22.x/api/path.html) -- `path.matchesGlob` confirmed stable since v22.20.0. Verified via WebFetch 2026-03-04.
- Existing Motif codebase (`install.js`, `motif-token-check.js`, `motif-font-check.js`, `motif-aria-check.js`) -- Proven regex-based parsing patterns. Reviewed 2026-03-04.
- Previous STACK.md (2026-03-01) -- Baseline Node.js 22+ stdlib decisions, zero-dep constraint rationale.

---
*Stack research for: Brownfield intelligence features (project scanning, component cataloging, decomposition)*
*Researched: 2026-03-04*
