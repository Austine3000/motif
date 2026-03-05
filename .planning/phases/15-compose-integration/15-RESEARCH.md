# Phase 15: Compose Integration - Research

**Researched:** 2026-03-05
**Domain:** Screen composition decomposition, project-directory file output, brownfield component reuse, convention-aware code generation
**Confidence:** HIGH

## Summary

Phase 15 transforms the Motif composer from a single-file-per-screen generator that writes exclusively to `.planning/design/screens/` into a decomposition engine that outputs one component per file, writes to the user's actual project directories (e.g., `src/components/`, `src/app/`), and imports existing project components instead of recreating them. This phase modifies three artifacts: the compose-screen workflow (`core/workflows/compose-screen.md`), the composer's context profile in the context engine (`context-engine.md`), and optionally a new decomposition helper script.

The current compose workflow spawns a subagent per screen that reads design tokens, component specs, and research, then produces a monolithic HTML/JSX file plus a summary. Phase 15 changes the OUTPUT behavior: the subagent still reads the same inputs but now produces multiple files (one per component) placed in the user's actual source tree. When PROJECT-SCAN.md and CONVENTIONS.md exist (brownfield), the composer reads the component catalog and imports matching components instead of recreating them. When these files do not exist (greenfield), the composer writes decomposed files to `.planning/design/screens/{screen-name}/` as a fallback.

The key architectural constraint is that all changes happen inside the subagent's instructions and the orchestrator's context assembly. No new scripts are needed -- the Claude agent already knows how to write files to arbitrary paths. The change is in what the instructions tell it to do with its output.

**Primary recommendation:** Modify compose-screen.md to add decomposition instructions, project-directory writing logic, and existing component reuse rules. Add CONVENTIONS.md and PROJECT-SCAN.md to the composer's context profile. Keep all changes existence-gated so greenfield behavior is unchanged.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js fs | Built-in | File writing to project directories | Zero dependencies, agent uses Write tool directly |
| (No new libraries) | - | - | All changes are workflow/instruction modifications, not code |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | This phase is purely workflow and instruction changes |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Agent-driven decomposition | A post-processing script that splits monolithic output | Script would add complexity and break the agent's ability to properly structure imports between files. Agent decomposition is simpler -- the agent writes each file independently with correct inter-file imports. |
| Convention detection at compose time | Pre-computed convention config from scan | Pre-computed is what we have (CONVENTIONS.md). The agent reads it and follows the patterns. No runtime detection needed. |
| Custom file placement logic in a script | Agent reads CONVENTIONS.md and places files | The agent already has Write tool access. No script needed -- the conventions tell it where to put files and how to name them. |

**Installation:**
```bash
# No installation needed -- purely workflow/instruction modifications
```

## Architecture Patterns

### Current vs. Target State

**Current (v1.1):**
```
Composer Agent → .planning/design/screens/dashboard.html (single monolithic file)
                → .planning/design/screens/dashboard-SUMMARY.md
```

**Target (v1.2):**
```
Composer Agent → src/components/ui/StatCard.tsx       (new component)
               → src/components/ui/MetricRow.tsx      (new component)
               → src/app/dashboard/page.tsx           (screen/page file)
               → .planning/design/screens/dashboard-SUMMARY.md

               (imports existing: src/components/ui/Button.tsx, src/components/ui/Card.tsx)
```

### Pattern 1: Decomposition Strategy
**What:** The composer agent breaks each screen into individual component files instead of producing a monolithic output.
**When to use:** Always -- this is the new default for compose.
**How it works:**

The agent follows this decomposition hierarchy:
1. **Page/Screen file** -- the top-level route component (e.g., `page.tsx`, `Dashboard.tsx`)
2. **Section components** -- major visual sections of the screen (e.g., `DashboardHeader.tsx`, `TransactionList.tsx`)
3. **New UI primitives** -- any new reusable components not in the project or COMPONENT-SPECS.md (rare in brownfield)

Rules:
- Each component gets its own file with its own imports
- No component file exceeds ~150 lines (if it does, decompose further)
- Every inter-component reference uses proper import statements
- The page file imports sections; sections import primitives
- Shared styles go into a co-located `.module.css` or use Tailwind classes per project convention

### Pattern 2: Project Directory Placement (Brownfield)
**What:** When CONVENTIONS.md exists, the agent writes files to the project's actual directories following detected conventions.
**When to use:** When `.planning/design/CONVENTIONS.md` and `.planning/design/PROJECT-SCAN.md` exist.

The agent reads CONVENTIONS.md for:
- **File naming:** PascalCase vs kebab-case vs camelCase
- **Export style:** named exports vs default exports
- **Import patterns:** path aliases (`@/`), barrel files, relative paths
- **Component directory:** where new components go (`src/components/ui/`, `src/components/features/`, etc.)
- **Page/route directory:** where page files go (`src/app/`, `src/pages/`, etc.)

The agent reads PROJECT-SCAN.md for:
- **Directory structure:** actual directory tree to place files correctly
- **Framework patterns:** Next.js App Router vs Pages Router, etc.

```
Decision flow for file placement:

1. Is this a page/route component?
   → Write to the framework's route directory (e.g., src/app/dashboard/page.tsx)

2. Is this a new reusable component?
   → Write to the project's component directory (e.g., src/components/ui/StatCard.tsx)

3. Is this a screen-specific section?
   → Write to a screen-specific directory (e.g., src/components/dashboard/DashboardHeader.tsx)
      OR co-locate with the page (e.g., src/app/dashboard/_components/DashboardHeader.tsx)
      depending on project convention from CONVENTIONS.md
```

### Pattern 3: Project Directory Placement (Greenfield Fallback)
**What:** When no scan artifacts exist, the agent writes decomposed files to `.planning/design/screens/{screen-name}/`.
**When to use:** When PROJECT-SCAN.md does not exist.

```
.planning/design/screens/
  dashboard/
    Dashboard.tsx          (or .html for HTML stack)
    DashboardHeader.tsx
    StatCard.tsx
    TransactionList.tsx
    index.ts               (barrel export)
```

This gives the user decomposed output without making assumptions about project structure. The user can move files to their desired locations.

### Pattern 4: Existing Component Reuse (Brownfield)
**What:** When COMPONENT-GAP.md and PROJECT-SCAN.md exist, the composer imports existing project components instead of recreating them.
**When to use:** When `.planning/design/COMPONENT-GAP.md` exists.

The agent follows this decision tree for each component it needs:

```
For each component needed in the screen:

1. Check COMPONENT-GAP.md "Existing" table:
   → If found: import from the listed file path. Do NOT recreate.
   → Use the project's import convention from CONVENTIONS.md.

2. Check COMPONENT-GAP.md "Partial Match" table:
   → If found: import from the listed file path. Add a comment noting it may need enhancement.
   → Use as-is; do not modify the existing component.

3. Check COMPONENT-SPECS.md:
   → If the component has a full spec: generate it as a new file.
   → If the component has a reference-only spec (marked "existing in project"):
     import from the file path noted in the spec.

4. Not found anywhere:
   → Generate as a new component file. Place per Pattern 2.
```

**Import generation example:**
```typescript
// Existing component (from COMPONENT-GAP.md): import using project conventions
import { Button } from '@/components/ui/Button';  // path alias from CONVENTIONS.md

// New component (generated by Motif): also follows project conventions
import { StatCard } from '@/components/dashboard/StatCard';
```

### Pattern 5: Convention-Aware Code Generation
**What:** The agent follows the project's detected code style when generating new files.
**When to use:** When CONVENTIONS.md exists.

The agent applies conventions to:
- **TypeScript vs JavaScript:** Use `.tsx`/`.ts` or `.jsx`/`.js` per project
- **Import syntax:** `import { X } from '...'` vs `import X from '...'` per dominant pattern
- **Export syntax:** `export function X` vs `export default function X` per dominant pattern
- **Formatting:** Single vs double quotes, semicolons vs no semicolons (detect from existing files)
- **CSS approach:** Tailwind classes, CSS modules, styled-components per detected approach
- **Path aliases:** Use `@/` or relative paths per tsconfig/CONVENTIONS.md

When CONVENTIONS.md does not exist, the agent uses sensible defaults:
- TypeScript with `.tsx`
- Named exports
- Single quotes
- Semicolons
- Inline styles using CSS custom properties from tokens.css

### Anti-Patterns to Avoid
- **Modifying existing project files:** The composer NEVER modifies existing files in the user's project. It only creates new files and imports existing components. If a screen needs a modified version of an existing component, create a new wrapper or variant, don't edit the original.
- **Writing to node_modules or build directories:** Never write to directories in the SKIP_DIRS list from project-scanner.js.
- **Guessing directory structure without scan data:** In greenfield mode, never try to place files in `src/` -- use `.planning/design/screens/` instead. Only write to project directories when CONVENTIONS.md provides the structure.
- **Recreating components that already exist:** The entire point of COMP-03 is reuse. Check COMPONENT-GAP.md before generating any component.
- **Ignoring import path conventions:** Using relative paths when the project uses path aliases (or vice versa) creates inconsistency. Match the project's convention.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File decomposition logic | A post-processing script | Agent instructions in compose-screen.md | The agent already writes files; just tell it to write multiple files |
| Directory detection at compose time | Runtime directory scanner | Read CONVENTIONS.md and PROJECT-SCAN.md | Already computed during scan phase |
| Component existence checking | Real-time file system checks | Read COMPONENT-GAP.md | Already computed during system generation |
| Import path resolution | Custom resolver script | CONVENTIONS.md import patterns + PROJECT-SCAN.md structure | All information available in scan artifacts |

**Key insight:** Phase 15 adds no new scripts. All changes are in the compose-screen.md workflow instructions and the context engine profile. The Claude agent is the "runtime" -- it reads the instructions and writes the files. The instructions just need to tell it to decompose and place files correctly.

## Common Pitfalls

### Pitfall 1: Import Cycles Between Decomposed Files
**What goes wrong:** Component A imports Component B, which imports Component A, creating a circular dependency.
**Why it happens:** When decomposing a monolithic screen, the agent may create components that reference each other if the decomposition boundaries are unclear.
**How to avoid:** Enforce a strict import hierarchy in the agent instructions: Page -> Sections -> Primitives. Never allow a primitive to import a section, or a section to import a page. If two sections need to share state, lift the state to the page and pass it down as props.
**Warning signs:** Two generated files that import from each other.

### Pitfall 2: Brownfield Import Path Mismatch
**What goes wrong:** The composer generates `import { Button } from '../ui/Button'` but the project uses `import { Button } from '@/components/ui/Button'`.
**Why it happens:** The agent doesn't consistently check CONVENTIONS.md for import path patterns.
**How to avoid:** The agent instructions must explicitly state: "Read CONVENTIONS.md import patterns. If path aliases are detected (e.g., `@/` maps to `src/`), use them for ALL imports. If barrel files are detected, import from the barrel (e.g., `@/components/ui` not `@/components/ui/Button`). Match the dominant import style exactly."
**Warning signs:** Generated imports use a different path style than existing project files.

### Pitfall 3: Component Name Collision
**What goes wrong:** The composer creates a new `Card.tsx` but the project already has a `Card.tsx` with different functionality. The new file overwrites the existing one.
**Why it happens:** The agent places a new component in the same directory with the same name as an existing component.
**How to avoid:** Before writing any file, the agent must check if the file already exists. If it does, either: (a) import the existing one instead of creating a new one, or (b) use a different name (e.g., `DashboardCard.tsx` instead of `Card.tsx`). The COMPONENT-GAP.md check should catch most cases, but edge cases with non-cataloged files need a filesystem check.
**Warning signs:** Generated file paths that match existing project file paths.

### Pitfall 4: Greenfield Decomposition Breaks Current Workflow
**What goes wrong:** Greenfield projects (no scan artifacts) get decomposed output that the user doesn't expect, breaking the existing single-file workflow.
**Why it happens:** Decomposition is applied unconditionally, including to greenfield projects that previously got a single clean HTML file.
**How to avoid:** Two strategies:
1. **Greenfield still decomposes** but writes to `.planning/design/screens/{screen-name}/` with a clear barrel file. The SUMMARY.md documents all created files.
2. **All decomposition changes are additive** -- the files are just organized into a subdirectory instead of a single file. The previous `.planning/design/screens/dashboard.html` becomes `.planning/design/screens/dashboard/Dashboard.html` plus component files.

The key is that greenfield users get decomposition (COMP-01) but not project-directory placement (COMP-02, which requires scan data). This is a clean separation.
**Warning signs:** Greenfield compose produces empty output or errors.

### Pitfall 5: Context Budget Overrun in Composer Agent
**What goes wrong:** Adding PROJECT-SCAN.md, CONVENTIONS.md, and COMPONENT-GAP.md to the composer's context pushes it over budget.
**Why it happens:** The composer already loads tokens.css (~2000), COMPONENT-SPECS.md (~3000-5000), PROJECT.md (~800), DESIGN-RESEARCH.md (~2500), and ICON-CATALOG.md (~1000). Adding scan artifacts (~1200+800+800=2800) could push total to ~12,000+ tokens.
**How to avoid:** Not all scan artifacts need full loading. The composer needs:
- From PROJECT-SCAN.md: only the Directory Structure section (~200 tokens, not the full component catalog)
- From CONVENTIONS.md: the full file (~800 tokens)
- From COMPONENT-GAP.md: only the Existing and Partial Match tables (~400 tokens)

Alternatively, produce a slim COMPOSE-CONTEXT.md during the orchestrator step that extracts only the relevant sections from each scan artifact. This keeps the total addition under ~1500 tokens.
**Warning signs:** Composer agent produces truncated or incomplete output due to context pressure.

### Pitfall 6: Incorrect Framework-Specific File Patterns
**What goes wrong:** The composer generates `page.tsx` for a Pages Router Next.js project (which uses `index.tsx`) or generates a flat component for a Vue SFC project.
**Why it happens:** Framework-specific file patterns vary significantly, and the agent's default assumptions may not match the project.
**How to avoid:** The agent instructions must include framework-specific templates:
- **Next.js App Router:** `page.tsx`, `layout.tsx`, `_components/` co-location
- **Next.js Pages Router:** `index.tsx` in `pages/`, components in `components/`
- **React (Vite/CRA):** Flexible structure, follow CONVENTIONS.md
- **Vue:** `.vue` SFCs with `<template>`, `<script setup>`, `<style>`
- **Svelte:** `.svelte` files with component structure

PROJECT-SCAN.md tells us which framework; the agent instructions map framework to file patterns.
**Warning signs:** Generated file extensions or routing patterns don't match the framework.

## Code Examples

### Orchestrator Context Assembly (Modified Step 2 of compose-screen.md)
```markdown
## Step 2: Assemble Context Profile

Read ONLY the file paths — do NOT read their contents into your context:

REQUIRED_FILES:
  - .planning/design/PROJECT.md
  - .planning/design/system/tokens.css
  - .planning/design/system/COMPONENT-SPECS.md
  - .planning/design/DESIGN-RESEARCH.md
  - .planning/design/system/ICON-CATALOG.md

OPTIONAL_FILES (load if they exist):
  - .planning/design/screens/*-SUMMARY.md (only the most recent 2-3)
  - .planning/design/PROJECT-SCAN.md        # NEW: for directory structure + framework
  - .planning/design/CONVENTIONS.md         # NEW: for code conventions
  - .planning/design/COMPONENT-GAP.md       # NEW: for existing component reuse

Check .planning/design/PROJECT.md quickly for the technical stack.
Check if .planning/design/PROJECT-SCAN.md exists → set BROWNFIELD=true
If BROWNFIELD: read CONVENTIONS.md for target directories.
```

### Subagent Decomposition Instructions (New Section in Agent Prompt)
```markdown
## Decomposition Rules

You MUST decompose every screen into individual component files. No monolithic single-file output.

### File Decomposition
1. Identify all components in your screen design
2. Create one file per component:
   - Page/route component (top level)
   - Section components (major visual areas)
   - New UI primitives (only if not in COMPONENT-GAP.md "Existing")
3. Each file must:
   - Have its own imports
   - Export exactly one component
   - Be under 150 lines (decompose further if needed)

### Import Hierarchy (STRICT -- no circular imports)
Page → Sections → Primitives
- A page imports sections and primitives
- A section imports primitives only
- A primitive imports nothing from this screen (only external deps and tokens)

### File Placement

{IF PROJECT-SCAN.md and CONVENTIONS.md exist (brownfield):}

Read CONVENTIONS.md for:
- Naming convention (PascalCase/kebab-case)
- Export style (named/default)
- Import paths (aliases like @/, relative paths)
- CSS approach (Tailwind/CSS Modules/styled-components)

Read PROJECT-SCAN.md for:
- Component directories (where existing components live)
- Route/page directories (where pages live)
- Framework-specific patterns

Place files:
- Page component → framework route directory
- New reusable components → project's component directory
- Screen-specific sections → co-located with page OR in a features directory

{IF no PROJECT-SCAN.md (greenfield):}

Place all files in:
  .planning/design/screens/{SCREEN_NAME}/

Create a barrel export (index.ts or index.js) for the directory.
```

### Existing Component Reuse Instructions (New Section in Agent Prompt)
```markdown
## Existing Component Reuse

{IF COMPONENT-GAP.md exists:}

Before generating ANY component, check COMPONENT-GAP.md:

1. **"Existing" table:** Component exists in the project.
   → Import it. Do NOT recreate it.
   → Use the file path from the table.
   → Apply project import conventions from CONVENTIONS.md.

2. **"Partial Match" table:** Similar component exists.
   → Import it. Do NOT recreate it.
   → Add a comment: // Note: using existing [FoundName] as [RequiredName]
   → If it needs props it doesn't have, pass them anyway — the user will enhance later.

3. **Not in COMPONENT-GAP.md:** Component does not exist.
   → Generate it as a new file.
   → Follow COMPONENT-SPECS.md for the spec.

Example:
// COMPONENT-GAP.md says Button exists at src/components/ui/Button.tsx
// CONVENTIONS.md says project uses @/ alias
import { Button } from '@/components/ui/Button';

// COMPONENT-GAP.md says no StatCard exists
// Generate new: src/components/dashboard/StatCard.tsx
```

### Updated SUMMARY.md Format
```markdown
# Screen: {SCREEN_NAME}

## Components Used
### Existing (imported from project)
- Button — src/components/ui/Button.tsx
- Card — src/components/ui/Card.tsx

### New (generated by Motif)
- StatCard — src/components/dashboard/StatCard.tsx
- TransactionList — src/components/dashboard/TransactionList.tsx

## Key Tokens Referenced
[List the primary tokens this screen depends on]

## Vertical Patterns Applied
[Which LOCKED decisions were implemented]

## States
- Default Y/N
- Loading Y/N
- Empty Y/N
- Error Y/N

## Files Created
[List ALL files created with full paths]
- src/app/dashboard/page.tsx
- src/components/dashboard/StatCard.tsx
- src/components/dashboard/TransactionList.tsx

## Files Imported (not created)
[List all existing project files that were imported]
- src/components/ui/Button.tsx
- src/components/ui/Card.tsx
```

## Integration Points

### compose-screen.md Modifications

**Step 2 (Context Assembly):** Add PROJECT-SCAN.md, CONVENTIONS.md, COMPONENT-GAP.md to optional files list. Set BROWNFIELD flag based on existence.

**Step 3 (Agent Spawn):** Add three new sections to the agent prompt:
1. Decomposition Rules (always active)
2. File Placement (brownfield vs greenfield branches)
3. Existing Component Reuse (only when COMPONENT-GAP.md exists)

**Step 4 (Collect Result):** Updated SUMMARY.md format with "Files Created" and "Files Imported" sections.

**Step 5 (Update State):** No changes needed -- screen status tracking is unchanged.

### context-engine.md Modifications

Update the Screen Composer profile:
```xml
<context_profile name="composer">
  <always_load>
    .planning/design/PROJECT.md
    .planning/design/system/tokens.css
    .planning/design/system/COMPONENT-SPECS.md
    .planning/design/system/ICON-CATALOG.md
  </always_load>
  <load_if_exists>
    .planning/design/DESIGN-RESEARCH.md
    .planning/design/screens/{previous-screen}-SUMMARY.md
    .planning/design/PROJECT-SCAN.md          # NEW
    .planning/design/CONVENTIONS.md           # NEW
    .planning/design/COMPONENT-GAP.md         # NEW
  </load_if_exists>
  <never_load>
    DESIGN-BRIEF.md
    Raw research files
    Other screen source code (only summaries)
    DESIGN-SYSTEM.md
    icon-libraries.md
    TOKEN-INVENTORY.md  # Composer doesn't need token inventory -- tokens.css has the final tokens
  </never_load>
</context_profile>
```

### Context Budget Impact

| Addition | Tokens (approx) | What Composer Needs |
|----------|-----------------|---------------------|
| PROJECT-SCAN.md | ~300 (directory structure only) | Directory layout and framework |
| CONVENTIONS.md | ~800 (full file) | All code conventions |
| COMPONENT-GAP.md | ~400 (existing + partial tables) | Which components to import vs generate |
| **Total addition** | **~1,500** | |

New total for fully-loaded brownfield composer: ~13,500 tokens (within the ~15,000 budget).

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Monolithic single-file screen output | Decomposed one-component-per-file output | Phase 15 (new) | Each component can be independently reviewed, edited, and reused |
| All output to .planning/design/screens/ | Output to project's actual directories | Phase 15 (new) | Composed screens are immediately usable in the project |
| Recreate all components from scratch | Import existing project components | Phase 15 (new) | Brownfield projects get compositions that integrate with their codebase |
| Framework-agnostic output | Convention-aware output matching project patterns | Phase 15 (new) | Generated code looks like it was written by the project's developers |

## Open Questions

1. **Should the orchestrator extract relevant sections from scan artifacts into a slim COMPOSE-CONTEXT.md, or should the subagent load the full files?**
   - What we know: The composer context budget is ~15K tokens. Adding full scan artifacts (~2800 tokens) is within budget but tight.
   - What's unclear: Whether the full PROJECT-SCAN.md component catalog (which can be large) is worth loading when the composer only needs directory structure.
   - Recommendation: **Subagent loads full files.** The scan artifacts are already budget-capped (PROJECT-SCAN.md <= 1500, CONVENTIONS.md <= 1000, COMPONENT-GAP.md <= 800). The total of ~2800 fits within budget. A pre-extraction step in the orchestrator adds complexity and a new artifact. If budget proves tight, we can add extraction in Phase 16 as a hardening measure.

2. **Should greenfield decomposition use the same directory structure conventions as brownfield (src/components/, etc.) or stay in .planning/?**
   - What we know: Greenfield projects have no established structure. Writing to `src/` assumes a directory that may not exist.
   - What's unclear: Whether users of greenfield Motif expect output in their project tree.
   - Recommendation: **Greenfield stays in .planning/design/screens/{screen-name}/.** This is safe, non-destructive, and consistent with the current workflow. Users can move files to their desired locations. Only brownfield projects (with scan data confirming the directory structure) get project-directory placement.

3. **How should the agent handle CSS when the project uses a CSS approach the agent can't easily follow (e.g., styled-components)?**
   - What we know: The agent currently generates inline CSS custom property references. Tailwind and CSS Modules are straightforward adaptations.
   - What's unclear: Whether the agent can reliably generate styled-components or Emotion patterns that match the project's style.
   - Recommendation: **Support Tailwind and CSS Modules explicitly. For CSS-in-JS, fall back to inline styles with custom properties and note the limitation in SUMMARY.md.** The agent instructions should have framework-specific CSS templates for the top 3 CSS approaches: Tailwind (className strings), CSS Modules (import styles, use styles.X), and vanilla/inline (style={{ property: 'var(--token)' }}). CSS-in-JS is a best-effort -- document this as a known limitation.

4. **Should the agent verify that imported components actually export the expected interface (props)?**
   - What we know: PROJECT-SCAN.md includes basic prop extraction for HIGH-confidence components.
   - What's unclear: Whether the scanned props are reliable enough for the agent to trust.
   - Recommendation: **Use props from PROJECT-SCAN.md when available but do not validate at compose time.** Prop verification is Phase 16's concern (validation and hardening). The composer should import components and pass the props it needs. If the interface doesn't match, that's caught during development. Keep Phase 15 focused on decomposition and placement.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `core/workflows/compose-screen.md` -- current composition workflow, agent spawn pattern, context assembly
- Existing codebase: `.claude/get-motif/workflows/compose-screen.md` -- live copy of composition workflow
- Existing codebase: `.claude/get-motif/references/context-engine.md` -- context profiles, budget table, loading rules
- Existing codebase: `.claude/get-motif/references/state-machine.md` -- phase definitions, gate checks, STATE.md format
- Existing codebase: `core/workflows/scan.md` -- scan workflow, artifact output format
- Existing codebase: `scripts/project-scanner.js` -- PROJECT-SCAN.md output format, component catalog structure
- Existing codebase: `scripts/gap-analyzer.js` -- COMPONENT-GAP.md output format, existing/missing/partial tables
- Phase 13 research and summaries: scan infrastructure patterns, convention extraction
- Phase 14 research and summaries: token integration, gap analysis, brownfield mode patterns

### Secondary (MEDIUM confidence)
- Component decomposition best practices (React/Next.js) -- based on established patterns in the React ecosystem
- File colocation patterns (Next.js App Router `_components/`, feature-based structure) -- based on Next.js documentation patterns

### Tertiary (LOW confidence)
- CSS-in-JS composer output -- unclear how reliably the agent can generate styled-components/Emotion patterns that match a project's existing style

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, pure workflow modifications
- Architecture (decomposition): HIGH -- clear decomposition rules derived from established component architecture patterns
- Architecture (project placement): HIGH -- directory information already available in PROJECT-SCAN.md and CONVENTIONS.md
- Architecture (component reuse): HIGH -- COMPONENT-GAP.md already provides the mapping; just need import generation
- Pitfalls: HIGH -- derived from known integration patterns and existing codebase constraints
- CSS-in-JS support: LOW -- reliability of agent-generated styled-components/Emotion code unclear

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable -- workflow modifications, no external dependency changes)
