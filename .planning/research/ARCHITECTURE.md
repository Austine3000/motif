# Architecture Patterns

**Domain:** Cross-Platform App Builder Integration for Motif Design System
**Researched:** 2026-03-09

## Recommended Architecture

The core architectural challenge: Motif currently hardcodes CSS custom properties (`tokens.css`) as the token delivery format and HTML/CSS as the composition output format. These assumptions are wired into workflows, agents, hooks, and the context engine. v1.4 must make the output format configurable per platform while keeping design intelligence (verticals, research, component specs) platform-agnostic.

The recommended approach: **Platform Adapters** -- a thin translation layer between Motif's universal design knowledge and platform-specific output. The design system architect generates a canonical token set. A platform adapter transforms tokens and composition instructions for the target framework. The composer agent receives platform-specific templates alongside the universal design system context.

### Current Architecture (Baseline)

```
DESIGN INTELLIGENCE (platform-agnostic, works today)
  core/references/verticals/*.md    -- domain patterns
  core/workflows/research.md        -- domain research orchestration
  core/workflows/generate-system.md -- token decision algorithms
  DESIGN-RESEARCH.md                -- locked design decisions
  PROJECT.md                        -- product context
  DESIGN-BRIEF.md                   -- aesthetic direction
  COMPONENT-SPECS.md                -- component specifications (XML)

TOKEN DELIVERY (CSS-only today)
  tokens.css                        -- :root { --color-primary-500: #hex; }
  token-showcase.html               -- visual preview

COMPOSITION OUTPUT (HTML/CSS-only today)
  compose-screen.md                 -- hardcodes HTML/CSS assumptions
  motif-screen-composer.md          -- agent with CSS-specific anti-slop checks
  hooks/motif-token-check.js        -- checks for hardcoded CSS values
  hooks/motif-font-check.js         -- checks font-family declarations
```

### Target Architecture (After v1.4)

```
DESIGN INTELLIGENCE (UNCHANGED -- zero modifications)
  core/references/verticals/*.md
  core/workflows/research.md
  DESIGN-RESEARCH.md, PROJECT.md, DESIGN-BRIEF.md
  COMPONENT-SPECS.md

TOKEN DELIVERY (platform-aware)
  tokens.css                           -- STILL generated (web default)
  tokens.ts                            -- NEW: TypeScript object export (React/RN)
  tokens.native.ts                     -- NEW: React Native StyleSheet-compatible
  core/references/platform-adapters.md -- NEW: platform registry + token format specs
  core/templates/tokens-*.template     -- NEW: per-platform token templates

COMPOSITION OUTPUT (platform-aware)
  core/workflows/compose-screen.md     -- MODIFIED: reads platform from STATE.md
  core/templates/composer-react.md     -- NEW: React-specific composition rules
  core/templates/composer-rn.md        -- NEW: React Native composition rules
  runtimes/claude-code/agents/
    motif-screen-composer.md           -- MODIFIED: platform-conditional anti-slop
  hooks/motif-token-check.js           -- MODIFIED: platform-aware validation

STATE (platform-aware)
  STATE.md                             -- MODIFIED: adds Platform field
  PROJECT.md                           -- ALREADY has Technical Stack field
```

## Component Boundaries

### What Exists and What Changes

| Component | Current State | v1.4 Change | Rationale |
|-----------|--------------|-------------|-----------|
| **Vertical references** | Platform-agnostic design patterns | UNCHANGED | Design intelligence has no framework dependency |
| **Research workflow** | Researches domain patterns | UNCHANGED | Research is about UX patterns, not code |
| **COMPONENT-SPECS.md** | XML specs with CSS token references | UNCHANGED | Specs describe visual behavior, not implementation |
| **Generate-system workflow** | Generates tokens.css | MODIFIED: also generates platform-specific token files | Token values are the same; only the delivery format changes |
| **Compose-screen workflow** | Spawns composer with HTML/CSS assumptions | MODIFIED: passes platform context to composer agent | The orchestrator adds platform to the agent prompt |
| **Screen composer agent** | Anti-slop checks for CSS | MODIFIED: platform-conditional checks | React uses `style={{}}`, RN uses `StyleSheet.create()` |
| **Token-check hook** | Validates CSS property patterns | MODIFIED: validates per-platform patterns | Must recognize `StyleSheet.create()` token references |
| **Font-check hook** | Checks CSS font-family | MODIFIED: checks per-platform font declarations | RN uses `fontFamily` property, not CSS |
| **STATE.md** | Tracks phase, vertical, stack | MODIFIED: adds `Platform` field | Composer needs to know output format |
| **PROJECT.md** | Has "Technical Stack" field | UNCHANGED | Already captures React/RN/HTML |
| **token-showcase.html** | Visual preview | UNCHANGED for web; RN gets no showcase | HTML showcase is web-only; RN projects get a different preview mechanism |

### New Components

| Component | Location | Purpose | Dependencies |
|-----------|----------|---------|--------------|
| **Platform Adapters Reference** | `core/references/platform-adapters.md` | Registry of supported platforms, token format specs, composition rules per platform | None (pure reference) |
| **Token Templates** | `core/templates/tokens-web.template`, `tokens-react.template`, `tokens-rn.template` | Structural templates for each token delivery format | Used by generate-system workflow |
| **Composer Platform Overlays** | `core/templates/composer-react.md`, `composer-rn.md` | Platform-specific composition rules appended to composer prompt | Loaded by compose-screen workflow |
| **Token Generator Script** | `scripts/token-transformer.js` | Transforms canonical tokens.css into platform-specific formats | Run by generate-system workflow after token creation |

## Detailed Integration Points

### 1. Platform Detection and Registration

**Where it happens:** `/motif:init` (init.md workflow)

**Current behavior:** Round 4 asks "Technical stack?" and stores it in PROJECT.md and STATE.md as `Stack: React/Next.js/Vue/HTML`.

**Required change:** Map the stack answer to a canonical platform:

```
Stack → Platform mapping:
  HTML              → web-html    (tokens.css, HTML/CSS output)
  React             → web-react   (tokens.ts, JSX/CSS output)
  Next.js           → web-react   (tokens.ts, JSX/CSS output)
  Vue               → web-vue     (tokens.css, Vue SFC output)
  React Native      → native-rn   (tokens.native.ts, RN StyleSheet output)
  Expo              → native-rn   (tokens.native.ts, RN StyleSheet output)
```

**STATE.md addition:**
```markdown
## Platform
web-react
```

**Impact:** Minimal. The init workflow already captures stack. Adding a derived `Platform` field to STATE.md is a one-line addition to the file generation logic.

### 2. Token Delivery Per Platform

**Where it happens:** `/motif:system` (generate-system.md workflow)

**Current behavior:** System architect agent generates `tokens.css` with `:root { --prop: value; }` format.

**Required change:** After the system architect generates the canonical `tokens.css`, run a token transformer to produce platform-specific files.

**Why not change what the architect generates:** The CSS format is the canonical, human-readable format. It works as the source of truth. Platform-specific formats are mechanical transformations -- no design decisions involved. Keeping the architect focused on design decisions (color theory, contrast, typography) is correct. Adding format concerns to the architect prompt would bloat context and dilute design quality.

**Token format per platform:**

#### web-html (current, unchanged)
```css
:root {
  --color-primary-500: #1a9ba5;
  --space-4: 1rem;
  --font-body: 'DM Sans', sans-serif;
}
```

#### web-react
```typescript
// tokens.ts -- auto-generated from tokens.css
export const tokens = {
  color: {
    primary: {
      50: '#f0fafb',
      500: '#1a9ba5',
      // ...
    },
  },
  space: {
    1: '0.25rem',
    4: '1rem',
    // ...
  },
  font: {
    body: "'DM Sans', sans-serif",
    display: "'Plus Jakarta Sans', sans-serif",
  },
  // ...
} as const;

// Also export CSS custom properties for hybrid usage
export { default as tokensCss } from './tokens.css';
```

**Note:** web-react projects can ALSO use tokens.css directly via CSS imports. The TypeScript export is supplementary for inline style scenarios. The composer should prefer CSS custom properties when the project uses CSS Modules or plain CSS, and use the TS object when the project uses inline styles or CSS-in-JS.

#### native-rn
```typescript
// tokens.native.ts -- auto-generated from tokens.css
import { StyleSheet } from 'react-native';

export const colors = {
  primary: {
    50: '#f0fafb',
    500: '#1a9ba5',
    // ...
  },
  // ...
};

export const spacing = {
  1: 4,    // px values, not rem
  2: 8,
  3: 12,
  4: 16,
  // ...
};

export const typography = {
  fontFamily: {
    body: 'DMSans-Regular',      // RN uses font file names, not CSS strings
    display: 'PlusJakartaSans-Bold',
    mono: 'JetBrainsMono-Regular',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeight: {
    tight: 1.15,
    normal: 1.5,
    relaxed: 1.65,
  },
};

export const radii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  md: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  lg: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 5 },
};
```

**Critical difference for RN tokens:**
- Spacing uses raw pixel numbers (no rem -- RN uses density-independent pixels)
- Font family uses font file names (e.g., `DMSans-Regular`), not CSS font strings
- Shadows use RN's `shadowColor/shadowOffset/shadowOpacity/shadowRadius` + Android `elevation`
- No CSS custom properties -- everything is direct value references
- Border radius uses plain numbers (not px strings)

### 3. Token Transformer Script

**Location:** `scripts/token-transformer.js`

**Invocation:** Called by the generate-system workflow after the system architect commits tokens.css:

```bash
node scripts/token-transformer.js --platform web-react --input .planning/design/system/tokens.css --output .planning/design/system/tokens.ts
```

Or for RN:
```bash
node scripts/token-transformer.js --platform native-rn --input .planning/design/system/tokens.css --output .planning/design/system/tokens.native.ts
```

**Implementation approach:**
1. Parse tokens.css by reading CSS custom properties with regex (no CSS parser dependency -- zero deps constraint)
2. Categorize tokens by prefix (--color-*, --space-*, --font-*, --radius-*, --shadow-*, --text-*, etc.)
3. Apply platform-specific transforms (rem-to-px for RN, CSS-font-to-RN-font mapping)
4. Output the platform-specific file using the template

**Complexity:** MEDIUM. The main challenge is the CSS shadow syntax to RN shadow object conversion, and font name mapping (CSS `'DM Sans'` to RN `'DMSans-Regular'`). Both are well-defined transformations.

### 4. Compose-Screen Workflow Changes

**Current:** compose-screen.md spawns a composer agent with these assumptions:
- Output is HTML/CSS (or JSX with CSS custom properties for React)
- Anti-slop checks reference `var(--token)` syntax
- Decomposition rules reference `.tsx` files and CSS imports
- File placement assumes web directory structures

**Required changes:**

#### 4a. Platform Context Injection

In Step 2 (Assemble Context Profile), add:

```
Read STATE.md for: platform
Load platform-specific composition overlay:
  {MOTIF_ROOT}/templates/composer-{PLATFORM_FAMILY}.md
```

Where `PLATFORM_FAMILY` is derived:
- `web-html` → `composer-web.md` (existing behavior, no overlay needed)
- `web-react` → `composer-react.md`
- `native-rn` → `composer-rn.md`

#### 4b. Platform Overlay Content

**composer-react.md** (appended to composer agent prompt):
```markdown
## Platform: React (Web)

### Token Usage
- Import tokens: `import './tokens.css'` at component root OR `import { tokens } from './tokens'`
- Prefer CSS custom properties in className-based styling: `className={styles.card}` with `.card { background: var(--surface-elevated); }`
- For inline styles, use token object: `style={{ background: tokens.color.surface.elevated }}`

### File Format
- Components are .tsx files with named exports
- One component per file
- Styles: CSS Modules (.module.css) OR inline styles with token references
- If PROJECT-SCAN.md exists, match the project's CSS approach

### Anti-Slop (React-specific)
- NEVER use `style={{ color: '#hex' }}` -- use `var(--color-*)` or `tokens.color.*`
- NEVER use `style={{ padding: 16 }}` -- use `var(--space-4)` or `tokens.space[4]`
```

**composer-rn.md** (appended to composer agent prompt):
```markdown
## Platform: React Native

### Token Usage
- Import: `import { colors, spacing, typography, radii, shadows } from '../tokens.native'`
- ALL values come from token imports. Zero magic numbers.
- Spacing uses numeric values (not strings): `padding: spacing[4]` (equals 16)
- Font uses RN font names: `fontFamily: typography.fontFamily.body`

### File Format
- Components are .tsx files with named exports
- StyleSheet.create() for all styles (not inline objects)
- No CSS files -- RN does not support CSS
- No CSS custom properties -- import token objects directly
- No className -- use style prop
- No HTML elements -- use RN primitives (View, Text, ScrollView, Pressable, Image, FlatList)

### Element Mapping
- div → View
- span/p/h1-h6 → Text
- button → Pressable (not TouchableOpacity -- deprecated)
- img → Image
- ul/li with scroll → FlatList
- input → TextInput
- a → Pressable with onPress navigation

### Anti-Slop (RN-specific)
- NEVER use HTML elements (div, span, p, button, input)
- NEVER use CSS properties not supported by RN (e.g., box-shadow on Android -- use elevation)
- NEVER use rem/em units -- RN uses density-independent pixels (plain numbers)
- NEVER use var(--*) -- RN has no CSS custom properties
- NEVER use className -- RN uses style prop
- NEVER import 'tokens.css' -- import tokens.native.ts
- NEVER use `<Text>` without explicit style -- RN has no default typography cascade
```

#### 4c. Composer Agent Modifications

**motif-screen-composer.md changes (minimal):**

The agent definition needs one addition to its "Context Loading Profile" section:

```
### Load If Exists (new)
- {MOTIF_ROOT}/templates/composer-{platform}.md -- platform-specific composition rules
- .planning/design/system/tokens.native.ts -- RN token file (if platform is native-rn)
```

And one addition to the Anti-Slop Checklist:

```
12. **Am I using the wrong token import for this platform?**
    - web-html/web-react: var(--*) from tokens.css
    - native-rn: import from tokens.native.ts
```

The KEY insight: the composer agent definition does NOT need a rewrite. The platform overlay (composer-react.md or composer-rn.md) is injected by the orchestrator workflow, not baked into the agent definition. This keeps the agent definition short and platform-agnostic, with platform specifics arriving via the orchestrator's prompt construction.

### 5. Hook Modifications

#### motif-token-check.js

**Current:** Checks for hardcoded CSS values (`color: #hex`, `padding: 16px`, etc.)

**Required change:** Add platform awareness.

```javascript
// At top of hook:
const TARGET_EXTENSIONS_WEB = ['css', 'tsx', 'jsx', 'vue', 'html'];
const TARGET_EXTENSIONS_RN = ['tsx', 'jsx', 'ts', 'js'];

// In main handler:
const platform = detectPlatform(); // read STATE.md or .planning/design/system/tokens.native.ts existence
if (platform === 'native-rn') {
  // Check for RN-specific violations:
  // - Hardcoded numeric values not from token imports
  // - String color values not from token imports
  // - Direct fontFamily strings not from token imports
} else {
  // Existing CSS-based checks (unchanged)
}
```

**Complexity:** MEDIUM. The RN checks are structurally different from CSS checks -- instead of looking for `color: #hex`, look for `color: '#hex'` (JS string) or `padding: 16` (raw number not from import). This requires different regex patterns but the hook architecture (stdin JSON, stdout decision) is unchanged.

#### motif-font-check.js

**Current:** Checks for `font-family:` and `fontFamily:` CSS/JSX declarations.

**Required change:** For RN, check that `fontFamily` values match the token font names, not banned font list. The banned font concept works differently in RN -- you can't casually reference "Inter" unless the font is installed in the app. The hook should instead verify that fontFamily values reference the token file's font names.

### 6. COMPONENT-SPECS.md: No Changes Needed

This is a critical architectural decision. COMPONENT-SPECS.md uses XML with CSS token references:

```xml
<variant name="primary">
  background: var(--color-primary-500);
  color: var(--text-inverse);
  padding: var(--space-3) var(--space-5);
</variant>
```

These specs describe **visual intent**, not platform implementation. The composer agent reads the spec and translates to the target platform:
- Web: `background: var(--color-primary-500)` stays as-is
- React: `background: var(--color-primary-500)` in CSS module or `background: tokens.color.primary[500]` inline
- RN: `backgroundColor: colors.primary[500]` in StyleSheet

This is the right abstraction boundary. COMPONENT-SPECS.md is a design document, not a code template. The agent handles the translation because it understands both the spec format and the target platform. Trying to make COMPONENT-SPECS.md platform-aware would create a combinatorial explosion of spec variants.

### 7. Scaffolding: Project Structure Generation

**New capability:** When `/motif:init` detects a greenfield project with a non-HTML stack, generate starter project structure.

**Where:** New step in init.md, after file generation, before commit.

**Scaffolding per platform:**

#### web-react (greenfield only)
```
src/
  components/
    ui/           -- Motif-generated components land here
  styles/
    tokens.css    -- generated by /motif:system
    tokens.ts     -- generated by /motif:system
  App.tsx         -- starter with token import
```

#### native-rn (greenfield only)
```
src/
  components/
    ui/           -- Motif-generated components land here
  theme/
    tokens.native.ts  -- generated by /motif:system
    index.ts          -- re-exports for clean imports
  App.tsx              -- starter with token import
```

**For brownfield projects:** No scaffolding. The project-scanner already detects directory structure and conventions. Components are placed according to existing conventions per CONVENTIONS.md.

**Implementation:** A simple `scaffoldProject(platform)` function in the init workflow that creates directories and starter files. Not a code generator -- just empty directories with one import-demonstrating file.

### 8. Auto-Run Integration

**Context:** "Auto-run" means automatically opening/previewing the composed screen output.

**Current:** `generate-system.md` already does `open .planning/design/system/token-showcase.html`.

**Extension per platform:**

| Platform | Auto-Run Mechanism |
|----------|-------------------|
| web-html | `open .planning/design/screens/{name}/index.html` (current behavior) |
| web-react | No auto-run for individual screens (need build tooling). Open token-showcase.html for system preview. |
| native-rn | No auto-run (requires Expo/Metro). Print: "Run `npx expo start` to preview." |

**Architectural decision:** Auto-run is a thin concern. For web-html, it works today. For framework-based stacks (React, RN), auto-run requires build tooling that Motif should NOT own. Motif's job ends at generating correct source files. The user's dev server handles preview.

The exception: token-showcase.html remains a standalone HTML file regardless of platform. It's a design system visualization tool, not a product screen. Even RN projects get a web-based token showcase because it's the fastest way to visually verify the design system.

## Data Flow Changes

### Current Pipeline
```
/motif:init → PROJECT.md, DESIGN-BRIEF.md, STATE.md
/motif:research → DESIGN-RESEARCH.md
/motif:system → tokens.css, COMPONENT-SPECS.md, ICON-CATALOG.md, token-showcase.html
/motif:compose → HTML/CSS screen files + SUMMARY.md
/motif:review → REVIEW.md
/motif:fix → Updated screen files
```

### Modified Pipeline
```
/motif:init → PROJECT.md, DESIGN-BRIEF.md, STATE.md (+ Platform field)
                         ↓ (greenfield only)
                    scaffolded project structure
/motif:research → DESIGN-RESEARCH.md (UNCHANGED)
/motif:system → tokens.css (always)
                         ↓
              token-transformer.js
                         ↓
              tokens.ts OR tokens.native.ts (platform-specific)
              COMPONENT-SPECS.md (UNCHANGED)
              ICON-CATALOG.md (UNCHANGED)
              token-showcase.html (UNCHANGED)
/motif:compose → reads platform from STATE.md
                         ↓
              loads composer-{platform}.md overlay
                         ↓
              generates platform-appropriate component files + SUMMARY.md
/motif:review → REVIEW.md (UNCHANGED -- reviews design compliance, not code syntax)
/motif:fix → Updated screen files (platform-appropriate)
```

### What Does NOT Change

This is the most important section. Motif's value is in design intelligence, not code generation. These core assets are completely untouched:

1. **Vertical references** -- domain patterns are platform-agnostic
2. **Research workflow** -- UX pattern research has no framework dependency
3. **COMPONENT-SPECS.md format** -- visual intent description, not implementation
4. **DESIGN-RESEARCH.md** -- locked design decisions are about aesthetics
5. **Context engine profiles** -- file loading patterns are the same
6. **Context budgets** -- token file sizes are similar across formats
7. **Review workflow** -- design review evaluates visual compliance, not code quality
8. **Evolve workflow** -- system evolution modifies tokens.css (canonical), then re-runs transformer

## Patterns to Follow

### Pattern 1: Canonical + Derived
**What:** tokens.css is always the canonical source of truth. Platform-specific files are derived via transformation.
**When:** Always. Even for RN-only projects, tokens.css is generated first, then transformed.
**Why:** Design decisions happen in one place. The system architect agent doesn't need to know about platform formats. The transformer is a mechanical, testable script.

```
tokens.css (canonical, generated by architect)
    ↓ token-transformer.js
tokens.ts (derived, for web-react)
tokens.native.ts (derived, for native-rn)
```

### Pattern 2: Overlay, Don't Fork
**What:** Platform-specific composition rules are appended to the agent prompt as overlays, not baked into separate agent definitions.
**When:** compose-screen orchestrator building the agent prompt.
**Why:** One composer agent definition, many platform overlays. Adding a new platform = adding one overlay file, not forking the entire agent.

```
Agent prompt = base composer instructions
             + platform overlay (composer-react.md OR composer-rn.md)
             + project-specific context (scan data, conventions)
```

### Pattern 3: Platform Detection Flows Down
**What:** Platform is detected once at init time, stored in STATE.md, and read by all downstream commands.
**When:** Every workflow that produces platform-specific output.
**Why:** No re-detection, no inconsistency. One source of truth for "what platform are we building for?"

## Anti-Patterns to Avoid

### Anti-Pattern 1: Forking the Architect Agent Per Platform
**What:** Creating separate system architect agents for React, RN, etc.
**Why bad:** Design decisions are identical across platforms. The primary color doesn't change because you're using React Native. Forking creates drift and doubles maintenance.
**Instead:** One architect, one canonical output, mechanical transformation.

### Anti-Pattern 2: Making COMPONENT-SPECS.md Platform-Aware
**What:** Adding platform-specific code examples to component specs.
**Why bad:** Combinatorial explosion (N components x M platforms x K variants). Bloats context budget. Specs become code templates instead of design documents.
**Instead:** Specs describe visual intent. The composer agent translates to platform code. The agent is better at this than a template system.

### Anti-Pattern 3: Generating tokens.css Differently Per Platform
**What:** Having the architect agent output different token formats based on platform.
**Why bad:** Pollutes the architect's design-focused context with format concerns. Makes it impossible to add new platforms without modifying the architect. Breaks the "canonical + derived" pattern.
**Instead:** Architect always generates tokens.css. Transformer script handles format conversion.

### Anti-Pattern 4: Platform-Specific Hooks That Break Other Platforms
**What:** Hook checks that are always active but only apply to one platform (e.g., checking for `var(--*)` in a React Native project).
**Why bad:** False positives in cross-platform scenarios. Hooks blocking valid RN code because it doesn't use CSS custom properties.
**Instead:** Hooks detect platform from STATE.md/artifact presence and apply platform-appropriate checks.

### Anti-Pattern 5: Building a Custom Dev Server
**What:** Motif running a dev server to preview React/RN output.
**Why bad:** Scope creep. Requires build tooling (Vite, Metro). Introduces npm dependencies. Duplicates what the user's project already provides.
**Instead:** Motif generates correct source files. The user's dev server handles preview. Token showcase remains standalone HTML.

## Build Order (Dependency-Aware)

This is the implementation sequence. Each step depends on the previous.

### Step 1: Platform Adapters Reference (no dependencies)
Create `core/references/platform-adapters.md` defining:
- Supported platforms and their identifiers
- Token format specifications per platform
- Composition rules per platform
- Element mapping tables (HTML to RN)

### Step 2: STATE.md Platform Field (depends on Step 1)
- Modify STATE-TEMPLATE.md to include `## Platform`
- Modify init.md to derive platform from stack and write to STATE.md
- Modify state-machine.md to document the Platform field

### Step 3: Token Transformer Script (depends on Step 1)
- Create `scripts/token-transformer.js`
- Input: tokens.css path, platform identifier
- Output: platform-specific token file
- Test with existing tokens.css files from real projects

### Step 4: Generate-System Workflow Update (depends on Steps 2, 3)
- After architect generates tokens.css, run token-transformer.js
- Output path determined by platform
- Token showcase remains HTML (unchanged)

### Step 5: Composer Platform Overlays (depends on Step 1)
- Create `core/templates/composer-react.md`
- Create `core/templates/composer-rn.md`
- Each contains: token usage rules, file format rules, element mapping, anti-slop checks

### Step 6: Compose-Screen Workflow Update (depends on Steps 2, 5)
- Read platform from STATE.md
- Load appropriate composer overlay
- Pass platform context to spawned composer agent
- Modify file placement rules for platform

### Step 7: Hook Updates (depends on Step 2)
- motif-token-check.js: add platform detection, RN-specific checks
- motif-font-check.js: add RN font name validation

### Step 8: Greenfield Scaffolding (depends on Step 2)
- Add scaffoldProject() to init workflow
- Per-platform directory templates
- Only for greenfield projects

### Step 9: Validation (depends on all above)
- End-to-end test: init → research → system → compose for web-react
- End-to-end test: init → research → system → compose for native-rn
- Verify token transformer output matches expected format
- Verify hooks fire correctly per platform

## Scalability Considerations

| Concern | 2-3 Platforms (v1.4) | 5-6 Platforms (v2.0) | 10+ Platforms |
|---------|---------------------|---------------------|---------------|
| Token formats | One transformer script with platform switch | Same script, more cases | Consider Style Dictionary integration |
| Composer overlays | One .md file per platform | Same pattern | Same pattern (overlay files are cheap) |
| Hook platform checks | Platform switch in each hook | Same approach | Consider extracting platform check into shared utility |
| Testing | Manual E2E per platform | Automated per platform | CI matrix testing |
| COMPONENT-SPECS.md | Platform-agnostic (no change) | Still platform-agnostic | Still platform-agnostic |

## File Inventory: New and Modified

### New Files (8 files)

| File | Location | Size Est. | Purpose |
|------|----------|-----------|---------|
| `platform-adapters.md` | `core/references/` | ~200 lines | Platform registry and format specs |
| `token-transformer.js` | `scripts/` | ~300 lines | CSS-to-platform token conversion |
| `composer-react.md` | `core/templates/` | ~80 lines | React composition overlay |
| `composer-rn.md` | `core/templates/` | ~120 lines | React Native composition overlay |
| `tokens-react.template` | `core/templates/` | ~40 lines | TypeScript token file template |
| `tokens-rn.template` | `core/templates/` | ~60 lines | RN token file template |
| `tokens-web.template` | `core/templates/` | ~30 lines | CSS token file template (extracts current inline format) |

### Modified Files (8 files)

| File | Location | Change Scope | What Changes |
|------|----------|-------------|--------------|
| `init.md` | `runtimes/claude-code/commands/motif/` | SMALL | Add platform derivation from stack, write Platform to STATE.md, optional scaffolding call |
| `generate-system.md` | `core/workflows/` | SMALL | After architect commit, invoke token-transformer.js for non-web-html platforms |
| `compose-screen.md` | `core/workflows/` | MEDIUM | Read platform from STATE.md, load compositor overlay, modify file placement logic |
| `motif-screen-composer.md` | `runtimes/claude-code/agents/` | SMALL | Add platform-conditional anti-slop item, add overlay to context profile |
| `motif-token-check.js` | `runtimes/claude-code/hooks/` | MEDIUM | Platform detection, RN-specific violation patterns |
| `motif-font-check.js` | `runtimes/claude-code/hooks/` | SMALL | RN font name validation mode |
| `STATE-TEMPLATE.md` | `core/templates/` | TRIVIAL | Add `## Platform` section |
| `state-machine.md` | `core/references/` | TRIVIAL | Document Platform field |

### Unchanged Files (everything else)

All vertical references, research workflow, review workflow, fix workflow, evolve workflow, context engine, design inputs, COMPONENT-SPECS.md format, SUMMARY-TEMPLATE.md, all other agents (researcher, reviewer, fix agent), contrast-checker.js, token-counter.js, project-scanner.js, gap-analyzer.js, compose-validator.js, and the entire installer (bin/).

## Sources

- [React Native StyleSheet docs](https://reactnative.dev/docs/stylesheet) -- RN styling API reference (HIGH confidence)
- [Unistyles 3.0](https://expo.dev/blog/unistyles-3-0-beyond-react-native-stylesheet) -- Modern RN styling with CSS variable support on web (MEDIUM confidence)
- [Cross-platform design systems with Bit](https://bit.dev/blog/creating-a-cross-platform-design-system-for-react-and-react-native-with-bit-l7i3qgmw/) -- Token sharing patterns between React and RN (MEDIUM confidence)
- [Tamagui](https://tamagui.dev/) -- Cross-platform optimized UI with compile-time token resolution (MEDIUM confidence)
- Codebase analysis of existing Motif architecture (HIGH confidence -- direct source code inspection)
