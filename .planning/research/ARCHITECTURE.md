# Architecture Research: Brownfield Intelligence Integration

**Domain:** Brownfield project scanning, component decomposition, and user-driven design decisions for an existing AI design engineering system (Motif)
**Researched:** 2026-03-04
**Confidence:** HIGH (based on deep analysis of existing Motif architecture)

## Existing Architecture Summary

Before proposing brownfield integration, here is how Motif works today:

```
User Command (/motif:init, /motif:research, etc.)
    |
    v
Thin Slash Command (.claude/commands/motif/*.md)
    |
    v
Core Workflow (.claude/get-motif/workflows/*.md)
    |  - Reads STATE.md (gate check)
    |  - Assembles file paths (NOT contents)
    |
    v
Task() Subagent (fresh 200K context)
    |  - Reads file paths passed by orchestrator
    |  - Produces artifacts in .planning/design/
    |  - Commits atomically
    |
    v
Orchestrator collects SUMMARY.md only
    |
    v
Updates STATE.md, advises next step
```

**State machine:** UNINITIALIZED -> INITIALIZED -> RESEARCHED -> SYSTEM_GENERATED -> COMPOSING -> REVIEWING -> ITERATING

**Key constraints:**
- Orchestrators stay at <=30% context, pass file paths not contents
- Each subagent gets fresh 200K context
- All intelligence is markdown-first, generated artifacts go in `.planning/design/`
- Zero npm dependencies, pure Node.js
- Token budgets enforced per artifact (PROJECT.md <=1000, DESIGN-RESEARCH.md <=3000, tokens.css <=3000, COMPONENT-SPECS.md <=5000)

## Recommended Architecture: Brownfield Integration

### Where Scanning Fits in the Pipeline

Scanning is a **new step before init**, implemented as a separate command `/motif:scan`. It does NOT replace init -- it produces artifacts that init, research, system, and compose all consume downstream.

**Why before init, not during init:**
1. Init already has a heavy interview flow (4 rounds). Adding scanning inflates it beyond the 30% orchestrator budget.
2. Scanning is optional -- greenfield projects skip it entirely. Gating it inside init creates branching complexity.
3. Scan results need to be reviewable by the user before init decisions are made. The user should see "here is what I found in your codebase" and then answer init questions with that context.
4. Scan can be re-run independently without re-initializing.

**Why not during research:**
Research spawns 4 parallel agents for domain patterns. Scanning is project-introspective, not domain-research. Mixing them would overload the research orchestrator and create dependency ordering issues (research agents need scan results to calibrate their findings).

### Updated State Machine

```
                    SCANNED (new)
                       |
UNINITIALIZED ----+----v-----> INITIALIZED -> RESEARCHED -> SYSTEM_GENERATED -> ...
                  |                                                              |
                  +--- (greenfield, skip scan) --->                              |
                                                                                 |
                  <-------------- (evolve loops back) --------------------------+
```

New phase: `SCANNED` sits between UNINITIALIZED and INITIALIZED, but is **optional**. Init accepts both `UNINITIALIZED` and `SCANNED` as valid predecessor states. This preserves the greenfield flow while adding the brownfield path.

### System Overview with Brownfield Integration

```
+=========================================================================+
|                        Brownfield Layer (NEW)                            |
|                                                                          |
|  /motif:scan                                                             |
|       |                                                                  |
|       v                                                                  |
|  Scan Orchestrator (thin)                                                |
|       |                                                                  |
|       +---> Task(): File Scanner Agent                                   |
|       |         - Walks project tree                                     |
|       |         - Identifies framework, CSS approach, component files    |
|       |         - Outputs: PROJECT-SCAN.md                               |
|       |                                                                  |
|       +---> Task(): Component Decomposer Agent                           |
|       |         - Reads component files identified by scanner            |
|       |         - Extracts: tokens, patterns, component inventory        |
|       |         - Outputs: COMPONENT-SCAN.md, TOKEN-SCAN.md              |
|       |                                                                  |
|       v                                                                  |
|  Orchestrator synthesizes -> SCAN-SUMMARY.md                             |
|  User reviews scan results                                               |
|  STATE.md -> SCANNED                                                     |
|                                                                          |
+===========================+=============================================+
                            |
                            v
+=========================================================================+
|                    Existing Motif Pipeline (MODIFIED)                     |
|                                                                          |
|  /motif:init (now reads SCAN-SUMMARY.md if SCANNED)                      |
|       |  - Pre-fills interview answers from scan                         |
|       |  - Detects vertical, stack, existing design patterns             |
|       |  - User confirms/overrides scan findings                         |
|       |                                                                  |
|  /motif:research (now receives scan context)                             |
|       |  - Research agents get TOKEN-SCAN.md as additional context        |
|       |  - "The project already uses these colors/fonts. Research         |
|       |    should consider how to systematize them, not replace them."    |
|       |                                                                  |
|  /motif:system (now in EXTRACT+EXTEND mode)                              |
|       |  - Reads TOKEN-SCAN.md for existing values                       |
|       |  - Generates tokens.css that formalizes existing patterns         |
|       |  - Fills gaps from vertical research                             |
|       |                                                                  |
|  /motif:compose (now receives COMPONENT-SCAN.md)                         |
|       |  - Composer knows existing component structure                    |
|       |  - Composes screens using existing component patterns             |
|       |  - Bridges between old ad-hoc styles and new token system         |
|       |                                                                  |
+=========================================================================+
```

### Component Boundaries

| Component | Responsibility | New vs Modified | Communicates With |
|-----------|---------------|-----------------|-------------------|
| `/motif:scan` command | Thin entry point for scanning | **NEW** | Scan workflow |
| `workflows/scan.md` | Scan orchestrator -- spawns scanner and decomposer agents | **NEW** | Scanner agent, Decomposer agent |
| `agents/motif-scanner.md` | File Scanner agent definition | **NEW** | Project filesystem |
| `agents/motif-decomposer.md` | Component Decomposer agent definition | **NEW** | Project filesystem, scanner output |
| `SCAN-SUMMARY.md` | Compressed scan synthesis (<=2000 tokens) | **NEW** artifact | init, research, system, compose |
| `PROJECT-SCAN.md` | Raw scan: files, framework, structure | **NEW** artifact | Scan orchestrator |
| `COMPONENT-SCAN.md` | Component inventory with patterns | **NEW** artifact | System generator, composer |
| `TOKEN-SCAN.md` | Extracted design tokens from existing code | **NEW** artifact | System generator, research |
| `scan/` directory | Raw scan data | **NEW** directory | Orchestrator synthesis |
| `workflows/research.md` | Research orchestrator | **MODIFIED** -- conditionally loads scan context | Research agents |
| `workflows/generate-system.md` | System generator orchestrator | **MODIFIED** -- adds EXTRACT+EXTEND mode | System generator agent |
| `workflows/compose-screen.md` | Compose orchestrator | **MODIFIED** -- passes COMPONENT-SCAN.md path | Composer agent |
| `references/state-machine.md` | State machine definition | **MODIFIED** -- adds SCANNED phase | All commands |
| `commands/motif/init.md` | Init command | **MODIFIED** -- reads scan if SCANNED | Init workflow |

## Data Structures

### PROJECT-SCAN.md (raw, consumed by orchestrator only)

This is the raw output of the File Scanner agent. Budget: <=3000 tokens. Not loaded by downstream subagents -- the orchestrator compresses it into SCAN-SUMMARY.md.

```markdown
# Project Scan

## Framework Detection
- **Framework:** React 18 (detected via package.json dependencies)
- **Build tool:** Vite 5.x
- **CSS approach:** Tailwind CSS 3.x + CSS Modules for overrides
- **Component library:** None (custom components)
- **State management:** Zustand
- **Routing:** React Router v6

## Project Structure
```
src/
  components/          # 23 component files
    ui/                # 8 generic UI components (Button, Card, Input, ...)
    features/          # 15 feature-specific components
  pages/               # 6 page components
  styles/              # Global CSS, Tailwind config
  hooks/               # 4 custom hooks
  utils/               # Helper functions
```

## File Inventory
| Category | Count | Key Files |
|----------|-------|-----------|
| Components | 23 | Button.tsx, Card.tsx, TransactionRow.tsx, ... |
| Pages | 6 | Dashboard.tsx, Settings.tsx, ... |
| Styles | 3 | globals.css, tailwind.config.ts, variables.css |
| Assets | 12 | Logo, icons, images |

## Existing Design Patterns Detected
- Color values: 14 unique hex values across stylesheets
- Font declarations: 2 font families referenced
- Spacing: mix of Tailwind classes + hardcoded px values
- Border radius: 3 distinct values used (4px, 8px, 12px)

## Screens Detected
| # | Route/File | Purpose (inferred) |
|---|-----------|-------------------|
| 1 | /dashboard | Main dashboard view |
| 2 | /settings | User settings |
| ... | ... | ... |
```

### COMPONENT-SCAN.md (consumed by system generator + composer)

This is the Component Decomposer agent's output. Budget: <=3000 tokens. Loaded by the system generator (to formalize existing components into COMPONENT-SPECS.md) and by the composer (to understand the existing component library).

```markdown
# Component Inventory

## Scan Source
Scanned: [date] | Files analyzed: [N] | Framework: [detected]

## Existing Component Library

### Generic UI Components
| Component | File | Variants Detected | Props/API | Design Token Coverage |
|-----------|------|-------------------|-----------|----------------------|
| Button | src/components/ui/Button.tsx | primary, secondary, ghost | size, variant, disabled, loading | Partial -- colors hardcoded, spacing uses Tailwind |
| Card | src/components/ui/Card.tsx | default, elevated | children, className | None -- all styles inline |
| Input | src/components/ui/Input.tsx | text, password, search | type, placeholder, error | Partial -- border colors hardcoded |

### Feature Components
| Component | File | Domain Pattern | Reusable? |
|-----------|------|---------------|-----------|
| TransactionRow | src/components/features/TransactionRow.tsx | Transaction list item | Yes -- extract to design system |
| BalanceCard | src/components/features/BalanceCard.tsx | Balance display | Yes -- standardize |
| QuickAction | src/components/features/QuickAction.tsx | Action shortcut grid | Project-specific |

### Component Patterns Observed
- **Composition:** Components use children prop, some use render props
- **Styling:** Mix of Tailwind utility classes + inline styles + CSS modules
- **State handling:** Loading states present in 3/23 components, error states in 2/23
- **Accessibility:** aria-label on 4/23 components, no systematic focus management

### Gap Analysis
- Missing: Toast/notification, Modal, Dropdown, Table (using raw HTML)
- Incomplete states: Most components lack loading/empty/error states
- No design system: No shared token file, no component specs document
```

### TOKEN-SCAN.md (consumed by system generator + research agents)

This is the extracted design token data from the existing codebase. Budget: <=2000 tokens. The system generator uses this to build tokens.css that formalizes (not replaces) existing patterns.

```markdown
# Token Scan

## Extracted Color Palette
| Source | Value | Usage Context | Frequency |
|--------|-------|--------------|-----------|
| globals.css | #1E40AF | Primary buttons, links | 12 occurrences |
| globals.css | #EF4444 | Error text, destructive buttons | 6 occurrences |
| Tailwind config | blue-600 (#2563EB) | Hover states | 8 occurrences |
| Inline styles | #F3F4F6 | Card backgrounds | 15 occurrences |
| ... | ... | ... | ... |

## Extracted Typography
| Property | Value | Source | Frequency |
|----------|-------|--------|-----------|
| font-family | 'Poppins', sans-serif | globals.css | Global |
| font-family | 'JetBrains Mono' | TransactionRow.tsx | Numbers only |
| font-size | 14px | Body text default | ~20 occurrences |
| font-weight | 600 | Headings | ~10 occurrences |

## Extracted Spacing Patterns
| Token Candidate | Values Found | Frequency |
|----------------|-------------|-----------|
| space-sm | 8px, 0.5rem, p-2 | 25 occurrences |
| space-md | 16px, 1rem, p-4 | 40 occurrences |
| space-lg | 24px, 1.5rem, p-6 | 15 occurrences |
| space-xl | 32px, 2rem, p-8 | 8 occurrences |

## Extracted Radii
| Value | Frequency | Context |
|-------|-----------|---------|
| 4px | 8 | Inputs, small cards |
| 8px | 15 | Cards, containers |
| 12px | 4 | Modal, large cards |
| 9999px | 6 | Pills, avatars |

## Inconsistencies Found
- Primary blue used as both #1E40AF and #2563EB (two different blues serving same role)
- Spacing inconsistent: same visual spacing achieved with 14px, 16px, and 1rem in different files
- No shadow system: 4 different box-shadow values, none reused
```

### SCAN-SUMMARY.md (the compressed artifact -- consumed by ALL downstream agents)

This is what the scan orchestrator produces after synthesizing PROJECT-SCAN.md, COMPONENT-SCAN.md, and TOKEN-SCAN.md. Budget: <=2000 tokens. This is the ONE scan artifact that gets loaded into every downstream subagent context (init, research, system, compose).

```markdown
# Scan Summary

## Project Profile
- **Framework:** React 18 + Vite + Tailwind CSS 3.x
- **Components:** 23 total (8 generic UI, 15 feature-specific)
- **Design system maturity:** None -- ad-hoc styles, no token file, no component specs
- **Screens:** 6 detected (Dashboard, Settings, ...)

## Existing Design Identity
- **Primary color:** #1E40AF (institutional blue, used 12x)
- **Font:** Poppins (display/body), JetBrains Mono (numbers)
- **Spacing base:** ~4px grid detected (8/16/24/32 most common)
- **Radius:** 4/8/12px scale detected
- **Density:** Comfortable (space-4 dominant)

## Reusable Components
Button (3 variants), Card (2 variants), Input (3 types), TransactionRow, BalanceCard

## Gaps
- Missing: Toast, Modal, Dropdown, Table
- States: Only 13% of components handle loading/error
- Accessibility: Minimal (4/23 have aria-labels)
- Token coverage: 0% -- all values hardcoded

## Inconsistencies to Resolve
- Two competing blues (#1E40AF vs #2563EB)
- Spacing inconsistent (14px vs 16px for same visual intent)
- 4 unique shadow values, none reused

## Brownfield Constraints
These values are LOCKED (user-confirmed existing brand):
- Primary: #1E40AF
- Font: Poppins
- Mono: JetBrains Mono
```

## Data Flow: How Scan Results Flow Through the Pipeline

### Flow 1: Scan -> Init

```
/motif:scan produces:
    .planning/design/scan/PROJECT-SCAN.md     (raw, ~3000 tokens)
    .planning/design/scan/COMPONENT-SCAN.md   (raw, ~3000 tokens)
    .planning/design/scan/TOKEN-SCAN.md        (raw, ~2000 tokens)
    .planning/design/SCAN-SUMMARY.md           (compressed, ~2000 tokens)

/motif:init reads SCAN-SUMMARY.md:
    - Pre-fills "What are you building?" from detected project purpose
    - Pre-fills "Technical stack?" from detected framework
    - Pre-fills "Screens for v1?" from detected routes/pages
    - Sets Input Type to B (Brand Constraints) or C (Visual References)
      based on what the scanner found
    - Presents findings to user for confirmation/override:
      "I scanned your project and found: [summary]. Does this look right?"
    - User can override any finding
    - LOCKED values from scan flow into DESIGN-BRIEF.md Brand Constraints
```

### Flow 2: Scan -> Research

```
/motif:research reads SCAN-SUMMARY.md (via orchestrator):
    - Passes to research agents as additional context:
      "This is a brownfield project. The existing codebase uses [colors/fonts/patterns].
       Research should consider how to systematize these, not replace them.
       Existing components: [list]. Research should identify gaps."
    - Visual language agent gets TOKEN-SCAN.md to understand existing palette
    - Competitor audit agent gets component list to benchmark coverage
```

### Flow 3: Scan -> System Generation

```
/motif:system reads TOKEN-SCAN.md + COMPONENT-SCAN.md:
    - Enters EXTRACT+EXTEND mode (new mode alongside fresh/Figma):
      1. Map existing colors to token scale (e.g., #1E40AF -> --color-primary-600)
      2. Generate missing scale values around existing colors
      3. Formalize existing spacing into --space-* tokens
      4. Map existing components to COMPONENT-SPECS.md
      5. Fill gaps from vertical research
    - Token comments reference scan:
      "/* Primary-600: #1E40AF -- extracted from existing codebase (12 occurrences).
          Scale generated around this value. */"
```

### Flow 4: Scan -> Compose

```
/motif:compose reads COMPONENT-SCAN.md:
    - Composer knows which components already exist
    - Can import existing components instead of rebuilding
    - Knows which components need token migration
    - Produces screens that use existing component patterns where they match
      COMPONENT-SPECS.md, and new components where gaps exist
```

## Architectural Patterns

### Pattern 1: Layered Scan with Compression

**What:** Two-agent scan (scanner + decomposer) produces raw artifacts that the orchestrator compresses into a single summary.

**Why:** Raw scan data is too large for downstream agent contexts. A 23-component project might produce 10,000+ tokens of raw analysis. The orchestrator compresses to <=2000 tokens, ensuring every downstream agent can load it without blowing context budget.

**Structure:**
```
Scanner Agent (raw)     Decomposer Agent (raw)
    |                       |
    v                       v
PROJECT-SCAN.md         COMPONENT-SCAN.md + TOKEN-SCAN.md
    |                       |
    +-------+-------+-------+
            |
            v
    Scan Orchestrator (synthesis)
            |
            v
    SCAN-SUMMARY.md (<=2000 tokens)
```

**Trade-off:** The orchestrator does one "heavy" operation (reading all three raw files to synthesize). This temporarily pushes it above 30% context, but it is a bounded operation -- synthesize once, then the orchestrator drops the raw data and proceeds thin.

### Pattern 2: Optional Phase Gate

**What:** The SCANNED phase is optional. Init accepts both UNINITIALIZED and SCANNED.

**Why:** Preserves the greenfield flow entirely. Users who start fresh never encounter brownfield scanning. The state machine gate check becomes:

```
<gate_check>
  <command>/motif:scan</command>
  <requires_phase>UNINITIALIZED</requires_phase>
  <blocks_if>Already scanned or initialized. Delete .planning/design/ to restart.</blocks_if>
</gate_check>

<gate_check>
  <command>/motif:init</command>
  <requires_phase>UNINITIALIZED or SCANNED</requires_phase>
  <blocks_if>Already initialized.</blocks_if>
</gate_check>
```

### Pattern 3: Scan-Aware Mode Flags

**What:** Downstream workflows detect brownfield mode by checking for SCAN-SUMMARY.md existence, not by explicit mode flags.

**Why:** No configuration needed. If `SCAN-SUMMARY.md` exists, the workflow adapts. If it does not exist, the workflow runs in standard greenfield mode. This is the same pattern used for Input Type D (Figma files) -- presence of artifacts drives behavior, not configuration.

```
# In generate-system.md workflow:
Check if .planning/design/SCAN-SUMMARY.md exists.
IF YES:
  - Also load .planning/design/scan/TOKEN-SCAN.md
  - Also load .planning/design/scan/COMPONENT-SCAN.md
  - Enter EXTRACT+EXTEND mode
IF NO:
  - Standard generation mode
```

### Pattern 4: User Confirmation Gate

**What:** After scanning, the orchestrator presents findings and requires user confirmation before proceeding.

**Why:** Brownfield scanning involves interpretation. The scanner might misidentify a primary color, miss a component, or misclassify the framework. The user must review and can override any finding. Overrides are captured in SCAN-SUMMARY.md as explicit LOCKED/UNLOCKED markers.

**Flow:**
```
Scan completes
    |
    v
"I found: React 18, Tailwind, 23 components, primary color #1E40AF.
 Here are the details: [shows SCAN-SUMMARY.md]

 Anything wrong? You can:
 - Confirm: proceed to /motif:init
 - Override: 'The real primary is #2563EB' (updates SCAN-SUMMARY.md)
 - Rescan: re-run with different scope"
    |
    v
User confirms -> STATE.md -> SCANNED
```

## File Layout: New Artifacts

```
.planning/design/
  SCAN-SUMMARY.md              # NEW - compressed scan (<=2000 tokens)
  scan/                        # NEW - raw scan data directory
    PROJECT-SCAN.md            # NEW - framework, structure, file inventory
    COMPONENT-SCAN.md          # NEW - component inventory with patterns
    TOKEN-SCAN.md              # NEW - extracted design values
  PROJECT.md                   # existing (init reads scan to pre-fill)
  DESIGN-BRIEF.md              # existing (scan data flows into Brand Constraints)
  DESIGN-RESEARCH.md           # existing (research considers scan context)
  STATE.md                     # MODIFIED (adds SCANNED phase)
  system/
    tokens.css                 # existing (system generator uses TOKEN-SCAN.md)
    COMPONENT-SPECS.md         # existing (system generator uses COMPONENT-SCAN.md)
    ...
  screens/
    ...
  research/
    ...

.claude/get-motif/
  workflows/
    scan.md                    # NEW - scan orchestrator workflow
    compose-screen.md          # MODIFIED - passes COMPONENT-SCAN.md path
    generate-system.md         # MODIFIED - adds EXTRACT+EXTEND mode
    research.md                # MODIFIED - conditionally loads scan context
  agents/
    motif-scanner.md           # NEW - file scanner agent definition
    motif-decomposer.md        # NEW - component decomposer agent definition
    ...existing agents...
  references/
    state-machine.md           # MODIFIED - adds SCANNED phase
    scan-heuristics.md         # NEW - framework detection rules, file patterns

.claude/commands/motif/
  scan.md                      # NEW - thin slash command entry point
  init.md                      # MODIFIED - accepts SCANNED state
```

## Context Budget Impact

| File | Tokens (approx) | Budget | Loaded By |
|------|-----------------|--------|-----------|
| SCAN-SUMMARY.md | ~2,000 | <=2,000 | init, research agents, system generator, composer |
| PROJECT-SCAN.md | ~3,000 | <=3,000 | Scan orchestrator only (not downstream) |
| COMPONENT-SCAN.md | ~3,000 | <=3,000 | System generator, composer |
| TOKEN-SCAN.md | ~2,000 | <=2,000 | System generator, research (visual language) |

**Total added context per downstream agent:**
- Init: +2,000 tokens (SCAN-SUMMARY.md only)
- Research agents: +2,000-4,000 tokens (SCAN-SUMMARY.md + TOKEN-SCAN.md for visual language agent)
- System generator: +7,000 tokens (SCAN-SUMMARY.md + COMPONENT-SCAN.md + TOKEN-SCAN.md)
- Composer: +5,000 tokens (SCAN-SUMMARY.md + COMPONENT-SCAN.md)

These are within budget. The composer agent currently loads ~12,000 tokens of context (PROJECT.md + tokens.css + COMPONENT-SPECS.md + DESIGN-RESEARCH.md + ICON-CATALOG.md). Adding 5,000 tokens brings it to ~17,000 -- well within the 200K context window.

## Scanning Implementation: What the Agents Do

### File Scanner Agent

**Input:** Project root path
**Output:** PROJECT-SCAN.md

**Heuristics (stored in references/scan-heuristics.md):**

1. **Framework detection:** Read package.json dependencies for react, vue, next, svelte, angular. Check for framework config files (next.config.*, vite.config.*, nuxt.config.*).
2. **CSS approach detection:** Check for tailwind.config.*, postcss.config.*, styled-components in deps, .module.css files, .scss files.
3. **Component file identification:** Glob for *.tsx, *.vue, *.svelte in src/components/ or components/. Fall back to scanning all directories for files exporting JSX/template elements.
4. **Page/route detection:** Check for pages/ or app/ directory (Next.js/Nuxt convention), or routes defined in router config.
5. **Style file identification:** Glob for *.css, *.scss, *.module.css, tailwind.config.*, theme.* files.
6. **Asset inventory:** Check for public/, assets/, images/ directories.

**Important:** The scanner uses `Glob` and `Read` tools only -- it does NOT execute project code, run builds, or install dependencies.

### Component Decomposer Agent

**Input:** File list from PROJECT-SCAN.md (or parallel scan)
**Output:** COMPONENT-SCAN.md, TOKEN-SCAN.md

**Process:**

1. Read each identified component file.
2. For each component, extract:
   - **Name:** Component export name
   - **Variants:** Conditional className/style branches (e.g., `variant === 'primary'`)
   - **Props:** TypeScript interface or PropTypes
   - **Styling approach:** Tailwind classes, CSS modules, styled-components, inline
   - **States handled:** Loading, error, empty, disabled
   - **Accessibility:** aria-* attributes, semantic elements, keyboard handlers
3. For style files, extract:
   - **Color values:** All hex, rgb, hsl values with usage context
   - **Font declarations:** font-family, font-size, font-weight with frequency
   - **Spacing values:** padding, margin, gap values with frequency
   - **Radius values:** border-radius values
   - **Shadow values:** box-shadow values
4. For Tailwind projects, also parse `tailwind.config.*` for:
   - Custom color palette
   - Custom spacing scale
   - Custom font configuration
   - Extended theme values

**Important:** The decomposer reads source files statically. It does NOT import modules, evaluate expressions, or run the application.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Scanning Everything

**What people do:** Scan node_modules, build output, test files, storybook files -- every file in the project.
**Why it is wrong:** Blows up scan time, produces noise that drowns signal, wastes context tokens on irrelevant data.
**Do this instead:** Scan only src/ (or the configured source directory), package.json, and CSS/config files. Exclude: node_modules, dist, build, .next, coverage, __tests__, *.test.*, *.spec.*, *.stories.*

### Anti-Pattern 2: Replacing Existing Styles

**What people do:** Scan finds ad-hoc styles, system generator ignores them and generates a fresh palette.
**Why it is wrong:** The user chose those colors/fonts for a reason. Replacing them breaks the product's visual identity and creates migration friction.
**Do this instead:** Formalize existing values into tokens. If two blues compete (#1E40AF vs #2563EB), present the choice to the user during scan review, then lock the chosen value.

### Anti-Pattern 3: Deep AST Parsing

**What people do:** Build a full AST parser to extract component structure with perfect accuracy.
**Why it is wrong:** Motif is runtime-agnostic markdown-first. Adding AST parsers means npm dependencies, framework-specific code, and maintenance burden. The existing zero-dependency constraint exists for good reasons.
**Do this instead:** Use heuristic text analysis via the AI agent's pattern recognition. The LLM reading a component file can identify variants, props, and styling patterns without an AST. Accuracy is ~90% vs ~99% for AST, but cost is near zero.

### Anti-Pattern 4: Storing Scan Data in STATE.md

**What people do:** Put scan results directly in STATE.md because "everything goes through state."
**Why it is wrong:** STATE.md has a strict format and must stay small (it is read by every command for gate checks). Adding scan data to it would bloat every context load.
**Do this instead:** Scan data lives in dedicated files. STATE.md only tracks the phase (SCANNED) and a one-line scan reference.

## Suggested Build Order

Build order considers dependency chains between new/modified components.

### Phase 1: Scan Infrastructure (no downstream changes)

Build the scan pipeline independently. It produces artifacts but nothing consumes them yet.

1. `references/scan-heuristics.md` -- framework detection rules, exclusion patterns
2. `agents/motif-scanner.md` -- File Scanner agent definition
3. `agents/motif-decomposer.md` -- Component Decomposer agent definition
4. `workflows/scan.md` -- Scan orchestrator workflow
5. `commands/motif/scan.md` -- Thin slash command
6. `references/state-machine.md` -- Add SCANNED phase (backward compatible)

**Test:** Run `/motif:scan` on a sample brownfield project. Verify PROJECT-SCAN.md, COMPONENT-SCAN.md, TOKEN-SCAN.md, and SCAN-SUMMARY.md are produced.

### Phase 2: Init Integration (reads scan, produces modified init artifacts)

Modify init to consume scan results when available.

1. `commands/motif/init.md` -- Accept SCANNED phase, read SCAN-SUMMARY.md
2. Modified interview flow: pre-fill from scan, present for confirmation
3. DESIGN-BRIEF.md generation: flow scan-detected Brand Constraints

**Test:** Run `/motif:scan` then `/motif:init`. Verify init pre-fills correctly and user can override.

### Phase 3: Research + System Integration (downstream consumers)

Modify research and system generation to operate in brownfield-aware mode.

1. `workflows/research.md` -- Pass scan context to research agents
2. `workflows/generate-system.md` -- Add EXTRACT+EXTEND mode
3. `agents/motif-system-architect.md` -- Update to handle TOKEN-SCAN.md input

**Test:** Full pipeline: scan -> init -> research -> system. Verify tokens.css formalizes existing values.

### Phase 4: Compose Integration (final consumer)

Modify compose to leverage existing component knowledge.

1. `workflows/compose-screen.md` -- Pass COMPONENT-SCAN.md to composer
2. `agents/motif-screen-composer.md` -- Update context loading profile

**Test:** Full pipeline: scan -> init -> research -> system -> compose. Verify composer uses existing component patterns.

## Integration Points Summary

| Integration Point | Type | Description |
|-------------------|------|-------------|
| scan.md -> STATE.md | Write | Sets phase to SCANNED |
| SCAN-SUMMARY.md -> init.md | Read | Pre-fills interview |
| SCAN-SUMMARY.md -> research agents | Read | Contextualizes domain research |
| TOKEN-SCAN.md -> generate-system.md | Read | EXTRACT+EXTEND mode input |
| COMPONENT-SCAN.md -> generate-system.md | Read | Component formalization input |
| COMPONENT-SCAN.md -> compose-screen.md | Read | Existing component awareness |
| state-machine.md -> all commands | Read | SCANNED phase gate checks |

## Sources

- Existing Motif architecture: `.claude/get-motif/workflows/*.md`, `.claude/get-motif/references/state-machine.md`, `.claude/get-motif/references/runtime-adapters.md`, `.claude/get-motif/references/design-inputs.md`
- Existing agent definitions: `.claude/get-motif/agents/*.md`
- Existing command definitions: `.claude/commands/motif/*.md`
- Existing data flow patterns: compose-screen.md (how orchestrators pass file paths to subagents), generate-system.md (how system generator consumes research)
- Design Inputs reference: Input Type B/C/D patterns for handling existing design assets (directly analogous to brownfield scanning)

---
*Architecture research for: Brownfield intelligence features for Motif design engineering system*
*Researched: 2026-03-04*
