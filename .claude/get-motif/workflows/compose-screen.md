---
description: Compose a production screen using the design system. Spawns a fresh agent per screen. Orchestrator stays thin.
allowed-tools: Read, Grep, Glob, Bash(git add:*), Bash(git commit:*), Bash(git status), Task
argument-hint: [screen-name]
---

# /motif:compose — Screen Composition Orchestrator

You are the Motif compose orchestrator. You are THIN. You spawn a fresh composer agent for each screen. You NEVER write screen code yourself.

<gate_check>
Read `.planning/design/STATE.md`.
If Phase is not `SYSTEM_GENERATED`, `COMPOSING`, or `ITERATING`, stop and tell the user which command to run.
If `.planning/design/system/tokens.css` does not exist, stop: "Run /motif:system first."
If `.planning/design/system/COMPONENT-SPECS.md` does not exist, stop: "Run /motif:system first."
</gate_check>

## Step 1: Determine Screen

If `$ARGUMENTS` is provided, use it as the screen name.
If not, read STATE.md's Screens table and find the next screen with status `planned`.
If no planned screens remain, tell the user all screens are composed and suggest `/motif:review all`.

**Screen name:** `{SCREEN_NAME}`

## Step 2: Assemble Context Profile

Read ONLY the file paths — do NOT read their contents into your context:

```
REQUIRED_FILES:
  - .planning/design/PROJECT.md
  - .planning/design/system/tokens.css
  - .planning/design/system/COMPONENT-SPECS.md
  - .planning/design/DESIGN-RESEARCH.md
  - .planning/design/system/ICON-CATALOG.md

OPTIONAL_FILES (load if they exist):
  - .planning/design/screens/*-SUMMARY.md (only the most recent 2-3)
  - .planning/design/PROJECT-SCAN.md        (brownfield: directory structure, framework)
  - .planning/design/CONVENTIONS.md         (brownfield: code conventions)
  - .planning/design/COMPONENT-GAP.md       (brownfield: existing component reuse map)

Note: If ICON-CATALOG.md does not exist, warn the user:
"No icon catalog found -- icon names may be inconsistent. Re-run /motif:system to generate."
```

Check `.planning/design/PROJECT.md` quickly for the technical stack (React/Next.js/Vue/HTML).

Check if `.planning/design/PROJECT-SCAN.md` exists → set BROWNFIELD=true
If BROWNFIELD: also check for CONVENTIONS.md and COMPONENT-GAP.md.

**STACK:** `{STACK}`

## Step 2b: Scan Freshness Check

If BROWNFIELD is true (PROJECT-SCAN.md exists):
1. Read `.planning/design/PROJECT-SCAN.md` and find the `**Scanned:** YYYY-MM-DD` line
2. Compare the scan date to today's date
3. If the scan date is NOT today:
   - Warn the user: "Scan data is from {scan_date}. Your project may have changed since then."
   - Ask: "Continue with existing scan data, or re-scan first? (continue/rescan)"
   - If user says rescan: tell them to run `/motif:scan` first, then return to compose
   - If user says continue: proceed normally
4. If the scan date IS today: proceed without warning

If BROWNFIELD is false: skip this step entirely.

## Step 3: Spawn Composer Agent

Spawn ONE fresh agent with Task():

<agent_spawn id="compose-{SCREEN_NAME}">
**Task prompt:**

You are a senior frontend engineer and design system implementer. You build production-ready screens that are design-system-consistent, accessible, and follow domain-specific patterns.

## Your Task
Build the `{SCREEN_NAME}` screen for this project.

## Context Files — Read These First
Read each of these files before writing ANY code:
1. `.planning/design/PROJECT.md` — product context, users, stack
2. `.planning/design/system/tokens.css` — design tokens. EVERY color, font, spacing, radius, shadow MUST come from here. Zero hardcoded values.
3. `.planning/design/system/COMPONENT-SPECS.md` — component specifications. Follow exactly.
4. `.planning/design/DESIGN-RESEARCH.md` — domain patterns. The "Design Decisions (LOCKED)" section is mandatory.
5. `.planning/design/system/ICON-CATALOG.md` -- icon name lookup. Use ONLY these icon names.
{IF previous summaries exist: 6. `.planning/design/screens/{prev}-SUMMARY.md` — for cross-screen consistency}
{IF .planning/design/PROJECT-SCAN.md exists (brownfield project):}
7. `.planning/design/PROJECT-SCAN.md` — project directory structure, framework, existing components
8. `.planning/design/CONVENTIONS.md` — file naming, export style, import paths, CSS approach
9. `.planning/design/COMPONENT-GAP.md` — which design system components exist in the project vs need generating

Also read the project's CLAUDE.md if it exists for project-specific conventions.

## Composition Process

### A. Screen Analysis (think before coding)
Before writing code, write a brief analysis to `.planning/design/screens/{SCREEN_NAME}-ANALYSIS.md`:
- Purpose: What does this screen help the user do?
- User emotional state when arriving here
- Critical actions (1-2 primary)
- Information architecture (priority order)
- Which LOCKED design decisions from DESIGN-RESEARCH.md apply
- States to handle: default, loading, empty, error

### B. Implementation Rules
1. **Stack:** {STACK}
2. **Token compliance:** ALL visual values from tokens.css. If you need a token that doesn't exist, create it in tokens.css first and commit separately.
3. **Component compliance:** Match COMPONENT-SPECS.md exactly.
4. **Font compliance:** Use ONLY fonts from --font-display, --font-body, --font-mono tokens. NEVER Inter, Roboto, Open Sans, Arial, system-ui.
5. **State coverage:** Default + Loading (skeleton) + Empty + Error. All four. Non-negotiable.
6. **Accessibility:** Semantic HTML (nav, main, section, button). ARIA labels on non-obvious elements. Visible focus styles using --border-focus. All interactive elements keyboard accessible. Touch targets ≥44×44px.
7. **Responsive:** Mobile + desktop breakpoints minimum.
8. **Vertical patterns:** Implement the LOCKED decisions from DESIGN-RESEARCH.md that apply to this screen.
9. **Icon compliance:** Use ONLY icon names from ICON-CATALOG.md. Every icon must use:
   - The exact class/element syntax from the catalog's "Class" column
   - An `--icon-{scale}` token for sizing (`--icon-sm` through `--icon-2xl`)
   - `currentColor` for color (set via parent element's `color` property)
   - NEVER invent icon names. If a needed icon isn't in the catalog, use the closest semantic match and note it in SUMMARY.md.
   - NEVER use bracket placeholders like `[icon]` or `[MerchantIcon]`.

### B2. Decomposition Rules

You MUST decompose every screen into individual component files. No monolithic single-file output.

#### File Decomposition
1. Identify all components in your screen design
2. Create one file per component:
   - Page/route component (top level)
   - Section components (major visual areas)
   - New UI primitives (only if not already existing per COMPONENT-GAP.md)
3. Each file must:
   - Have its own imports
   - Export exactly one component
   - Be under 150 lines (decompose further if needed)

#### Import Hierarchy (STRICT -- no circular imports)
Page -> Sections -> Primitives
- A page imports sections and primitives
- A section imports primitives only
- A primitive imports nothing from this screen (only external deps and tokens)

#### File Placement

{IF PROJECT-SCAN.md and CONVENTIONS.md exist (brownfield):}

Read CONVENTIONS.md for:
- Naming convention (PascalCase/kebab-case)
- Export style (named/default)
- Import paths (aliases like @/, relative paths)
- CSS approach (Tailwind/CSS Modules/styled-components)

Read PROJECT-SCAN.md for:
- Component directories (where existing components live)
- Route/page directories (where pages live)
- Framework-specific patterns (App Router vs Pages Router, etc.)

Place files:
- Page component -> framework route directory (e.g., src/app/dashboard/page.tsx)
- New reusable components -> project's component directory (e.g., src/components/ui/StatCard.tsx)
- Screen-specific sections -> co-located with page (e.g., src/app/dashboard/_components/DashboardHeader.tsx) OR in a features directory, depending on project convention

NEVER modify existing project files. Only create new files and import existing ones.
NEVER write to node_modules, .next, dist, build, or any build output directory.
Before writing any file, check if a file already exists at that path. If it does, use a different name (e.g., DashboardCard.tsx instead of Card.tsx).

{IF no PROJECT-SCAN.md (greenfield):}

Place all files in: `.planning/design/screens/{SCREEN_NAME}/`
Create a barrel export (index.ts or index.js) for the directory.
Use sensible defaults: TypeScript (.tsx), named exports, single quotes, semicolons, inline styles with CSS custom properties from tokens.css.

### B3. Existing Component Reuse

{IF .planning/design/COMPONENT-GAP.md exists:}

Before generating ANY component, check COMPONENT-GAP.md:

1. **"Existing" table:** Component exists in the project.
   -> Import it. Do NOT recreate it.
   -> Use the file path from the table.
   -> Apply project import conventions from CONVENTIONS.md (path aliases, barrel files, etc.).

2. **"Partial Match" table:** Similar component exists.
   -> Import it. Do NOT recreate it.
   -> Add a comment: // Note: using existing [FoundName] as [RequiredName]
   -> If it needs props it doesn't have, pass them anyway -- the user will enhance later.

3. **Not in COMPONENT-GAP.md:** Component does not exist.
   -> Generate it as a new file following COMPONENT-SPECS.md.
   -> Place per File Placement rules above.

Example:
```typescript
// COMPONENT-GAP.md says Button exists at src/components/ui/Button.tsx
// CONVENTIONS.md says project uses @/ alias
import { Button } from '@/components/ui/Button';

// COMPONENT-GAP.md says no StatCard exists
// Generate new: src/components/dashboard/StatCard.tsx
import { StatCard } from '@/components/dashboard/StatCard';
```

{IF COMPONENT-GAP.md does not exist:}
Generate all components as new files. No reuse checks needed.

### C. Anti-Slop Check
Before writing each component, verify:
- ❌ Am I using Inter? → STOP. Use --font-body.
- ❌ Am I hardcoding a color? → STOP. Find the token.
- ❌ Am I using border-radius: 8px? → STOP. Use var(--radius-md).
- ❌ Am I using a generic card layout? → STOP. Check what the vertical research says.
- ❌ Am I using an icon name not in ICON-CATALOG.md? -> STOP. Look up the semantic role in the catalog. Use the exact Class string.
- ❌ Am I hardcoding an icon size in px? -> STOP. Use var(--icon-sm) through var(--icon-2xl).
- ❌ Am I using a bracket placeholder like [icon: ...]? -> STOP. Replace with the actual icon element from the catalog.
- ❌ Am I writing everything into one file? -> STOP. Decompose into one component per file.
- ❌ Am I recreating a component that exists in COMPONENT-GAP.md? -> STOP. Import it instead.
- ❌ Am I using a different import path style than CONVENTIONS.md specifies? -> STOP. Match the project's convention.
- ✅ Every visual value references a CSS custom property from tokens.css.

### D. Self-Review Checklist
Before committing, verify:
- [ ] Zero hardcoded colors (grep for # in styles, should find only token comments)
- [ ] Zero hardcoded fonts (grep for font-family, should only reference tokens)
- [ ] All four states implemented (default, loading, empty, error)
- [ ] Semantic HTML (no div-only soup)
- [ ] Keyboard accessible (tab through all interactive elements)
- [ ] Responsive (test at 375px and 1280px mentally)
- [ ] All icon names exist in ICON-CATALOG.md (no invented names)
- [ ] All icon sizes use --icon-* tokens (no hardcoded font-size for icons)
- [ ] Icon CDN link present in <head> (or inherited from framework)
- [ ] IF Lucide: createIcons() called after DOM load
- [ ] Each component in its own file (no monolithic output)
- [ ] Import hierarchy: page -> sections -> primitives (no circular imports)
- [ ] IF brownfield: existing components imported, not recreated
- [ ] IF brownfield: file paths match project conventions (naming, directories)
- [ ] IF brownfield: import paths use project's style (@/ alias, relative, barrel)
- [ ] All created files staged but NOT committed until validation passes

### E. Create Summary
Save to `.planning/design/screens/{SCREEN_NAME}-SUMMARY.md`:
```markdown
# Screen: {SCREEN_NAME}

## Components Used
### Existing (imported from project)
[List components imported from the user's project with file paths -- or "N/A (greenfield)" if no scan data]

### New (generated by Motif)
[List all newly generated components with their file paths]

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

## Files Imported (not created)
[List all existing project files that were imported -- or "N/A (greenfield)" if no scan data]

## Validation
- Status: PASSED/FAILED/WARN
- Import cycles: none / [list cycles]
- Naming conflicts: none / [list conflicts]
- Prop warnings: none / [list warnings]
```

### F. Validate and Commit

**F1. Stage all created files** (do NOT commit yet):
```bash
git add [every file you created — list them all explicitly]
```

**F2. Run post-decomposition validation:**
```bash
node scripts/compose-validator.js --screen {SCREEN_NAME} --files [file1] [file2] ...
```
Pass every file you created as --files arguments.

Read the JSON output from stdout.

**F3. Act on results:**

IF status is "pass" or "warn":
- Commit atomically: `git commit -m "design(compose): implement {SCREEN_NAME} screen"`
- If there were warnings, note them in SUMMARY.md under ## Validation

IF status is "fail":
- Roll back staging: `git reset HEAD [all files you staged in F1]`
- Do NOT delete the files — leave them on disk for user inspection
- Do NOT attempt to fix the errors yourself
- In SUMMARY.md, record the validation failure (see Step E)
- The orchestrator will report the failure to the user
</agent_spawn>

## Step 4: Collect Result

After the agent completes, read ONLY `.planning/design/screens/{SCREEN_NAME}-SUMMARY.md`.

Check:
- Did the agent create the summary? If not, something went wrong — report to user.
- Did the agent create screen files? Check with `git log --oneline -5`.

## Step 5: Update State

Update `.planning/design/STATE.md`:
- Phase → `COMPOSING` (if first screen) or leave as-is
- Update Screens table: set {SCREEN_NAME} status to `composed`
- Append to Decisions Log if relevant

## Step 6: Next Step

Check STATE.md for remaining `planned` screens.
- If more screens remain: "Screen composed. Run `/motif:compose {next_screen}` for the next one."
- If all screens composed: "All screens composed. Run `/motif:review all` to evaluate."

If context > 50%, suggest `/clear` first.

## Parallel Composition

If the user wants to compose multiple screens at once, you CAN spawn multiple composer agents in parallel (one per screen) in a single message with multiple Task() calls. However, only do this if:
1. The screens are independent (don't share unique components)
2. The user explicitly requests it
3. They understand the rate limit implications

Default: one screen at a time, sequentially.
