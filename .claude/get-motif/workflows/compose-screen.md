---
description: Compose a production screen using the design system. Spawns a fresh agent per screen. Orchestrator stays thin.
allowed-tools: Read, Grep, Glob, Bash(git add:*), Bash(git commit:*), Bash(git status), Task
argument-hint: [screen-name]
---

# /motif:compose — Screen Composition Orchestrator

You are the Motif compose orchestrator. You are THIN. You spawn a fresh composer agent for each screen. You NEVER write screen code yourself.

<gate_check>
**Step 0 -- Load state:**
Run `node .claude/get-motif/scripts/motif-state.js read` and parse JSON output.
- If `{"error": "missing"}` or `{"error": "corrupt"}`: run `node .claude/get-motif/scripts/motif-state.js recover`. If recovery succeeds, notify user: "State recovered from artifacts -- phase: {phase}, {N}/{M} screens". If recovery fails, warn: "No Motif state found. Proceeding without state context."
- Otherwise: state is loaded.

**Step 1 -- Validate phase:**
If Phase is not `SYSTEM_GENERATED`, `COMPOSING`, or `ITERATING`:
  WARN: "Current phase is {phase}. This command typically runs during SYSTEM_GENERATED, COMPOSING, or ITERATING. Proceeding anyway."
  (Do NOT block. Proceed with the command.)

**Step 2 -- Check prerequisites:**
If `.planning/design/system/tokens.css` does not exist:
  WARN: "Missing tokens.css. Running this command without it may produce inconsistent results. Consider running /motif:system first."
  (Do NOT block. Proceed with the command.)
If `.planning/design/system/COMPONENT-SPECS.md` does not exist:
  WARN: "Missing COMPONENT-SPECS.md. Running this command without it may produce inconsistent results. Consider running /motif:system first."
  (Do NOT block. Proceed with the command.)
</gate_check>

## Step 1: Determine Screen(s)

Parse `$ARGUMENTS` to determine single-screen or batch mode:

**Case A -- No arguments:**
Single-screen mode. Read STATE.md's Screens table and find the next screen with status `planned`.
If no planned screens remain, tell the user all screens are composed and suggest `/motif:review all`.
Set BATCH_MODE = false. Set SCREEN_NAME to the found screen.

**Case B -- Single screen name (one word, no `--all` flag, no other screen names):**
Single-screen mode for that screen name.
Set BATCH_MODE = false. Set SCREEN_NAME to the provided name.
(If `--concurrency` is present with a single screen name, ignore it silently.)

**Case C -- Multiple space-separated screen names (no `--all`):**
- Split `$ARGUMENTS` on spaces
- Filter out `--concurrency` and the number immediately following it
- Filter out any flags (words starting with `--`)
- Remaining words are screen names
- If only one screen name remains after filtering: treat as Case B
- Otherwise: set BATCH_MODE = true, SCREEN_LIST = [remaining names]

**Case D -- `--all` flag present:**
- Run `node .claude/get-motif/scripts/motif-state.js read` to get STATE.md JSON
- Collect all screens with status `planned` or `failed`
- If none found: print "No screens with status 'planned' or 'failed'. Nothing to compose." and STOP
- Set BATCH_MODE = true, SCREEN_LIST = [collected screen names]

**Concurrency parsing (Cases C and D only):**
- If `$ARGUMENTS` contains `--concurrency`, extract the integer immediately after it
- Default: 3. Max: 5. Min: 1.
- If the value is missing, not an integer, or out of range: WARN "Invalid concurrency value. Using default (3)." and set CONCURRENCY = 3
- If the value is > 5: WARN "Concurrency capped at 5 to avoid rate limiting." and set CONCURRENCY = 5
- Store as CONCURRENCY

If BATCH_MODE is false: proceed to Step 2 (single-screen flow -- Steps 2 through 6 and Final Step).
If BATCH_MODE is true: proceed to Step 1b (batch validation).

## Step 1b: Batch Validation (BATCH MODE only)

This step runs only when BATCH_MODE is true.

1. **Validate screen names.** Run `node .claude/get-motif/scripts/motif-state.js read` to get STATE.md JSON. For each name in SCREEN_LIST:
   - Check if the name exists in STATE.md's `screens` array (match on `name` field)
   - If a name is NOT found: report it. Check for close matches (e.g., "dashbord" vs "dashboard") using simple string similarity (shared prefix/suffix, edit distance of 1-2). If a close match exists, suggest it: "Screen 'dashbord' not found. Did you mean 'dashboard'?"
   - Remove unrecognized names from SCREEN_LIST

2. **Check for empty list.** If SCREEN_LIST is empty after removing unrecognized names: STOP with error "No valid screen names to compose."

3. **Detect resume scenario.** After collecting SCREEN_LIST (screens with status `planned` or `failed`), read the full `screens` array from STATE.md. Check if any screens have status `composed`, `reviewed`, or `fixed`. If so:
   - SKIPPED_SCREENS = names of screens NOT in SCREEN_LIST (because their status is `composed`, `reviewed`, or `fixed`)
   - If SKIPPED_SCREENS is not empty, print:
     "Resuming batch -- skipping {SKIPPED_SCREENS.length} already-composed screen(s): {comma-separated names}"
     "Composing remaining {SCREEN_LIST.length} screen(s): {comma-separated names}"

4. **Check for stale files from previous attempt.** For each screen in SCREEN_LIST, check if `.planning/design/screens/{screen_name}-SUMMARY.md` exists on disk (use `test -f`). Collect any matches into STALE_SCREENS list.
   - If STALE_SCREENS is not empty, print:
     "Note: {STALE_SCREENS.length} screen(s) have files from a previous attempt: {comma-separated names}. These will be overwritten."

5. **Calculate waves.**
   - WAVE_COUNT = ceil(SCREEN_LIST.length / CONCURRENCY)
   - WAVES = split SCREEN_LIST into chunks of CONCURRENCY size

6. **Display batch plan:**
   "Composing {N} screens in {WAVE_COUNT} wave(s) (concurrency: {CONCURRENCY}): {comma-separated screen names}"

Proceed to Step 3b (batch wave dispatch). Skip Steps 2, 2b, 2c, 2d, and 3 -- these are single-screen only. In batch mode, context assembly happens inside Step 3b before the wave loop.

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

## Step 2c: Platform Overlay Resolution

Read STATE.md for the `platform` field (from frontmatter or ## Platform section).

If platform is set and is NOT `web-static`:
1. Read `.claude/get-motif/references/framework-registry.json`
2. Look up `{platform}.composition.overlay` to get the overlay filename (e.g., "composer-nextjs.md")
3. Set OVERLAY_PATH to `.claude/get-motif/references/{overlay-filename}`
4. Verify the overlay file exists. If not, WARN: "Platform overlay {overlay-filename} not found. Composing without platform-specific instructions."
5. Set HAS_OVERLAY = true

If platform is `web-static` or not set:
- Set HAS_OVERLAY = false (no overlay needed; use static/file-output rules below)

## Step 2d: Scaffold Detection

If platform is set and HAS_OVERLAY is true:
1. Check for `.motif-scaffolded` marker file in the project root (current working directory or its parent).
2. If marker exists: the scaffold runner has produced a real project. The compose agent will write files directly into the scaffolded project tree (e.g., `src/app/{route}/page.tsx` for `web-nextjs`, `src/pages/{RouteName}Page.tsx` for `web-vite`).
3. If marker does NOT exist: WARN "No scaffolded project detected. Composition will use fallback file placement (`.planning/design/screens/`). Run `/motif:system` to scaffold first."
4. For `web-nextjs`, additionally verify `package.json` and `src/app/` exist in the project root. If they do, confirm the scaffold output is ready for composition.

This step ensures the compose flow consumes the real scaffold output (closing the integration gap) rather than falling back to stub behavior.

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
{IF HAS_OVERLAY is true:}
6. `{OVERLAY_PATH}` -- CRITICAL: Platform-specific composition rules. These OVERRIDE the default HTML composition behavior. Follow ALL rules in this document for file placement, import patterns, styling approach, and component format. This takes precedence over any conflicting instructions in the base composition rules.
{IF previous summaries exist: 7. `.planning/design/screens/{prev}-SUMMARY.md` — for cross-screen consistency}
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
10. **Platform compliance:** IF a platform overlay was provided, ALL output must follow its rules. File format, placement, imports, and styling approach are dictated by the overlay. The overlay rules OVERRIDE conflicting base rules (e.g., if overlay says "use Tailwind classes", do NOT use inline CSS custom properties even though the base rules mention them).

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

{IF HAS_OVERLAY is true (platform-specific project):}
Place files according to the platform overlay's File Output Rules.
The scaffolded project directory is the current working directory (or its parent if .planning/ is the cwd).
Use the overlay's conventions for page vs component placement.
{ELSE:}
If platform is `web-static`, use this Static compose destination behavior:
- Write the primary/landing screen to `index.html` in the scaffolded site root.
- Write additional screens to slugged HTML files in the same root (for example `pricing.html`, `contact.html`).
- Write shared styling updates to `css/styles.css` (do not scatter per-page CSS files unless explicitly requested).
- Write enhancement-only JavaScript to `js/main.js` only when needed.
- Keep output HTML/CSS-native (no React, no Tailwind dependency, no SPA router).
- Do not route primary composed output only to `.planning/design/screens/{SCREEN_NAME}/`.

If platform is NOT `web-static` and no overlay exists:
- Place all files in `.planning/design/screens/{SCREEN_NAME}/` (legacy fallback behavior).
- Create a barrel export (`index.ts` or `index.js`) for that directory.
- Use sensible defaults: TypeScript (.tsx), named exports, single quotes, semicolons, inline styles with CSS custom properties from tokens.css.
{ENDIF}

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
{IF HAS_OVERLAY is true:}
- All anti-slop additions from the platform overlay also apply. Read them.

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
{IF HAS_OVERLAY is true:}
- [ ] All files placed per platform overlay File Output Rules
- [ ] All styling uses platform overlay approach (Tailwind classes, not inline CSS)
- [ ] All imports follow platform overlay Import Rules
- [ ] "use client" applied correctly per platform overlay rules (if applicable)
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

## Step 3b: Batch Wave Dispatch (BATCH MODE only)

This step executes ONLY when BATCH_MODE is true. When BATCH_MODE is true, the workflow skips Steps 2, 2b, 2c, 2d, and 3 (single-screen flow) and jumps from Step 1b directly here.

**Pre-wave context assembly (run ONCE before the wave loop):**

Read the same context files as Step 2 (REQUIRED_FILES and OPTIONAL_FILES) but read them once -- the orchestrator passes file paths to each Task(), not contents. Also run Step 2c logic (platform overlay resolution) and Step 2d logic (scaffold detection) once, storing the results as variables:
- HAS_OVERLAY, OVERLAY_PATH (from Step 2c logic)
- STACK (from checking PROJECT.md for technical stack)
- BROWNFIELD (from checking PROJECT-SCAN.md existence)

Initialize tracking lists:
- ALL_RESULTS = [] (accumulates across all waves)
- TOTAL_SUCCEEDED = 0
- TOTAL_FAILED = 0

**For each wave (wave_index from 0 to WAVE_COUNT - 1):**

### 3b.1: Report wave start

“Starting wave {wave_index + 1}/{WAVE_COUNT}: {comma-separated screen names in this wave}”

### 3b.2: Spawn parallel Task() agents -- ALL in a single message

For each screen in the current wave, spawn one Task() using the SAME agent_spawn template from Step 3, but with this ADDITIONAL block PREPENDED to the Task prompt (before “You are a senior frontend engineer...”):

```
## BATCH MODE INSTRUCTIONS
You are composing in batch mode (wave {wave_index + 1} of {WAVE_COUNT}).

CRITICAL DIFFERENCES from single-screen mode:
1. After validation (compose-validator.js), do NOT run `git commit`. Leave validated files staged but NOT committed. The orchestrator will commit your work.
2. Do NOT modify tokens.css or COMPONENT-SPECS.md. If a token is missing, note it in SUMMARY.md under “## Missing Tokens” and use the closest existing alternative.
3. Your SUMMARY.md “## Files Created” section MUST list every file with its full path. The orchestrator uses this list to stage files for commit.
4. If compose-validator.js returns “fail”: run `git reset HEAD [files]` to unstage. Write “Validation: FAILED” in SUMMARY.md. Do NOT delete files.
5. If compose-validator.js returns “pass” or “warn”: leave files staged. Write “Validation: PASSED” (or “WARNED”) in SUMMARY.md.
6. Record timing in SUMMARY.md. Add a `## Timing` section at the end:
   ```
   ## Timing
   - Started: {run `date -u +%Y-%m-%dT%H:%M:%SZ` at the very start of your work, before reading context files}
   - Completed: {run `date -u +%Y-%m-%dT%H:%M:%SZ` after validation completes}
   ```
   This lets the orchestrator calculate per-screen duration accurately.
```

Replace `{SCREEN_NAME}` in the agent_spawn template with the current screen's name. All other template variables (STACK, HAS_OVERLAY, OVERLAY_PATH, BROWNFIELD, etc.) use the values resolved in the pre-wave context assembly above.

**Spawn ALL agents for this wave in a single message with multiple Task() calls.** Do NOT spawn them one at a time.

### 3b.3: Wait for all agents in the wave to complete

All Task() agents in the wave must finish before proceeding.

### 3b.4: Collect wave results

For each screen in the current wave:

1. Check if `.planning/design/screens/{SCREEN_NAME}-SUMMARY.md` exists
2. **If exists:** Read ONLY the `## Validation` and `## Files Created` sections (use targeted Read with line offsets or Grep -- do NOT read the full SUMMARY.md to avoid context bloat)
3. **Classify the result:**
   - `## Validation` contains “PASSED” -> status = PASSED (will commit)
   - `## Validation` contains “WARNED” -> status = WARNED (will commit)
   - `## Validation` contains “FAILED” -> status = FAILED (skip commit)
   - SUMMARY.md does not exist -> status = CRASHED (skip commit)
4. For PASSED or WARNED: parse the file paths from `## Files Created` section
4b. **Parse timing (PASSED, WARNED, or FAILED screens only):** Read the `## Timing` section from SUMMARY.md. Extract the "Started" and "Completed" ISO timestamps. Calculate duration as the difference in seconds. Format as `Xm Ys` (e.g., "1m 12s" or "0m 45s"). If `## Timing` section is missing, set duration to "N/A".
    For CRASHED screens (no SUMMARY.md): set duration to "N/A (crashed)".
5. Track result: `{name, status, files[], duration}`

### 3b.5: Commit successful screens SEQUENTIALLY

For each screen with PASSED or WARNED status, in order:

1. Parse file paths from the `## Files Created` section of that screen's SUMMARY.md
2. Stage the created files with explicit paths:
   ```bash
   git add {file1} {file2} {file3} ...
   ```
   NEVER use `git add .` or `git add -A`. Always list files explicitly.
3. Also stage the screen's SUMMARY.md and ANALYSIS.md:
   ```bash
   git add .planning/design/screens/{SCREEN_NAME}-SUMMARY.md .planning/design/screens/{SCREEN_NAME}-ANALYSIS.md
   ```
4. Commit:
   ```bash
   git commit -m “design(compose): implement {SCREEN_NAME} screen”
   ```
4b. Capture the commit hash: after `git commit`, run `git rev-parse --short HEAD` and store as the screen's `commit_hash`. For FAILED/CRASHED screens, set commit_hash to “--”.

For FAILED or CRASHED screens: do NOT commit. If FAILED, the subagent already unstaged the files. Warn: “Screen '{SCREEN_NAME}' failed validation. Files remain on disk at [paths listed in SUMMARY.md] for inspection. They will NOT be committed.”

### 3b.6: Update STATE.md atomically

Build a JSON payload with all screen status changes from this wave:

```json
{
  “updates”: [
    {“name”: “login”, “status”: “composed”},
    {“name”: “dashboard”, “status”: “composed”},
    {“name”: “settings”, “status”: “failed”}
  ],
  “screens_composed”: N,
  “phase”: “COMPOSING”
}
```

Where:
- Each screen in the wave gets an entry in `updates` with status `composed` (for PASSED/WARNED) or `failed` (for FAILED/CRASHED)
- `screens_composed` = total composed so far (previous count from STATE.md + this wave's successes + prior waves' successes)
- `phase` = “COMPOSING”

Run: `node .claude/get-motif/scripts/motif-state.js batch-update-screens '{payload}'`

Update tracking: TOTAL_SUCCEEDED += this wave's successes, TOTAL_FAILED += this wave's failures.

### 3b.7: Report wave results

Print per-screen results with duration:

“Wave {wave_index + 1}/{WAVE_COUNT} complete:
  - login: OK (1m 12s)
  - dashboard: OK (1m 45s)
  - settings: FAILED - validation failure (0m 58s)”

Duration source: use the `duration` field parsed in Step 3b.4 from each screen's SUMMARY.md `## Timing` section. If duration is “N/A”, print it as-is.

---

**After ALL waves complete:**

### 3b.8: Batch summary

Print a formatted summary table:

"Batch complete: {TOTAL_SUCCEEDED}/{SCREEN_LIST.length} screens | {total_duration}

| Screen | Status | Duration | Wave |
|--------|--------|----------|------|
| login | OK | 1m 12s | 1/2 |
| dashboard | OK | 1m 45s | 1/2 |
| settings | FAILED | 0m 58s | 1/2 |
| profile | OK | 1m 22s | 2/2 |

{IF any FAILED or CRASHED screens:}
Failed: {screen_name} ({reason from SUMMARY.md validation section})
Retry: /motif:compose {space-separated failed screen names}"

Duration values come from ALL_RESULTS[].duration (parsed in Step 3b.4).
Total duration: sum all wave wall-clock durations (time from first Task() spawn in wave to last result collected).
Wave column format: {wave_index + 1}/{WAVE_COUNT}.

### 3b.8b: Write batch manifest

Write `.planning/design/BATCH-RESULT.md` with the complete batch result data:

```markdown
# Batch Composition Result

**Date:** {current ISO timestamp}
**Screens:** {SCREEN_LIST.length} total | {TOTAL_SUCCEEDED} succeeded | {TOTAL_FAILED} failed
**Duration:** {total_duration}
**Concurrency:** {CONCURRENCY}

## Results

| Screen | Status | Duration | Wave | Commit |
|--------|--------|----------|------|--------|
| {for each screen in ALL_RESULTS: name | OK/FAILED/CRASHED | duration | wave_index+1/WAVE_COUNT | commit_hash or "--"} |

{IF any FAILED or CRASHED screens:}
## Failed Screens

### {screen_name}
- **Reason:** {reason from SUMMARY.md validation section, or "Agent crashed -- no SUMMARY.md produced" for CRASHED}
- **Files on disk:** .planning/design/screens/{screen_name}/
- **Retry:** `/motif:compose {screen_name}`
{ENDIF}
```

Then commit the manifest:
```bash
git add .planning/design/BATCH-RESULT.md
git commit -m "design(compose): batch result manifest"
```

This file overwrites any previous BATCH-RESULT.md. Previous runs are preserved in git history.

### 3b.8c: Auto-review dispatch

Automatically review all successfully composed screens from this batch.

1. **Collect reviewable screens:** Filter ALL_RESULTS for screens with status PASSED or WARNED. Store as REVIEWABLE_SCREENS.
2. **Skip if none:** If REVIEWABLE_SCREENS is empty, print "No screens passed composition -- skipping auto-review." and skip to 3b.8e.
3. **Announce:** "Auto-reviewing {N} composed screens..."
4. **Calculate review waves:** REVIEW_WAVE_COUNT = ceil(REVIEWABLE_SCREENS.length / CONCURRENCY). REVIEW_WAVES = split into chunks of CONCURRENCY size.
5. **For each review wave:** Spawn reviewer Task() agents using the template from review.md Step 2 (the full block from `<agent_spawn id="review-{SCREEN_NAME}">` through `</agent_spawn>`), but with BATCH AUTO-REVIEW INSTRUCTIONS prepended to the Task prompt:

```
## BATCH AUTO-REVIEW INSTRUCTIONS
You are reviewing in auto-review mode (triggered automatically after batch compose).

CRITICAL DIFFERENCES from standalone /motif:review:
1. After writing {SCREEN_NAME}-REVIEW.md, do NOT run `git commit`. Leave the file on disk. The orchestrator commits.
2. Do NOT modify STATE.md. The orchestrator handles state updates.
3. Write REVIEW.md to `.planning/design/reviews/{SCREEN_NAME}-REVIEW.md` as normal.
```

Then include the full reviewer agent_spawn template from review.md Step 2:

<agent_spawn id="review-{SCREEN_NAME}">
**Task prompt:**

You are a senior design critic and accessibility auditor. Review the `{SCREEN_NAME}` screen rigorously.

## Context -- Read These First
1. `.planning/design/system/tokens.css` -- the token source of truth
2. `.planning/design/system/COMPONENT-SPECS.md` -- how components should look/behave
3. `.planning/design/DESIGN-RESEARCH.md` -- domain-specific patterns (check LOCKED decisions)
4. `.planning/design/PROJECT.md` -- product context
5. The actual source code files for {SCREEN_NAME} (find them via git or file listing)
6. `.planning/design/screens/{SCREEN_NAME}-SUMMARY.md` -- what the composer intended
7. `.planning/design/system/ICON-CATALOG.md` -- icon name catalog (if it exists; skip icon checks if absent)

## Review Framework -- Four Lenses

### Lens 1: Nielsen's 10 Heuristics (/30 points)
Score 0-3 per heuristic. Be specific about what's good and what's missing.

### Lens 2: WCAG AA Accessibility (/25 points)
Check: contrast ratios, keyboard access, ARIA attributes, semantic HTML, focus indicators, touch targets, heading hierarchy.
**Actually check the code**, not just the visual concept.

### Lens 3: Design System Compliance (/25 points)
**Grep the source code** for violations:
- `grep -n "color:" {files}` -- any hardcoded colors? (hex, rgb, hsl that aren't in comments)
- `grep -n "font-family:" {files}` -- any hardcoded fonts?
- `grep -n "border-radius:" {files}` -- hardcoded radii?
- `grep -n "box-shadow:" {files}` -- hardcoded shadows?
- `grep -n "margin\|padding" {files}` -- hardcoded spacing? (check for px values not from tokens)
Cross-reference each component instance against COMPONENT-SPECS.md.

If `.planning/design/system/ICON-CATALOG.md` exists:
- `grep -n "ph-\|data-lucide=\|material-symbols-\|ti ti-" {files}` -- any icon references?
- Cross-reference found icon names against ICON-CATALOG.md
- Flag names not in the catalog as Critical

### Lens 4: Vertical UX Compliance (/20 points)
For each LOCKED decision in DESIGN-RESEARCH.md, verify the screen implements it.
For each BLOCKED anti-pattern, verify the screen avoids it.
If ICON-CATALOG.md exists, verify icon choices match the vertical (no cross-domain icons).

## Output Format

Save to `.planning/design/reviews/{SCREEN_NAME}-REVIEW.md`:

```markdown
# Design Review -- {SCREEN_NAME}

## Score: [X]/100

| Lens | Score | Key Finding |
|------|-------|-------------|
| Heuristics | X/30 | [one-line summary] |
| Accessibility | X/25 | [one-line summary] |
| System Compliance | X/25 | [one-line summary] |
| Vertical UX | X/20 | [one-line summary] |

## Critical Issues (must fix before shipping)
[Each with: location, problem, exact fix]

## Major Issues (should fix)
[Each with: location, problem, exact fix]

## Minor Issues (nice to fix)
[Each with: problem, fix]

## Commendations
[What was done well]
```

**CRITICAL:** Every issue MUST include an exact fix. Not "improve contrast" but "Change --text-secondary from #9CA3AF to #6B7280 on --surface-primary (#FFFFFF) to achieve 5.4:1 ratio (currently 2.9:1)."
</agent_spawn>

Spawn ALL agents for each review wave in a single message with multiple Task() calls (same pattern as 3b.2).

6. **Wait for all review agents in the wave to complete** before proceeding to the next wave.

### 3b.8d: Review result collection

Collect results from all reviewer agents, commit review files, update state, and update the batch manifest.

1. **Initialize:** REVIEW_RESULTS = [].
2. **For each screen in REVIEWABLE_SCREENS:**
   a. Check if `.planning/design/reviews/{SCREEN_NAME}-REVIEW.md` exists.
   b. **If exists:** Use Grep to find the `## Score:` line and extract the numeric score. Use Grep to check the `## Critical Issues` section -- count items that are NOT "None" or empty. Do NOT read the full REVIEW.md file (avoids context bloat).
   c. **Classify:** REVIEW_PASSED if score >= 80 AND zero critical issues. REVIEW_FAILED otherwise.
   d. **If REVIEW.md does not exist:** status = REVIEW_SKIPPED, score = 0, critical = "unknown".
   e. **Track:** {name, score, critical_count, review_status}.
3. **Commit all review files:**
   ```bash
   git add .planning/design/reviews/*-REVIEW.md
   git commit -m "design(review): auto-review batch -- {N} screens reviewed"
   ```
4. **Update STATE.md** via batch-update-screens: set each reviewed screen to status `reviewed`.
   ```json
   {
     "updates": [{"name": "{screen}", "status": "reviewed"}, ...],
     "phase": "REVIEWING"
   }
   ```
   Run: `node .claude/get-motif/scripts/motif-state.js batch-update-screens '{payload}'`
5. **Append review results to BATCH-RESULT.md.** Read the file, append the following section to the end:
   ```markdown
   ## Review Results

   **Reviewed:** {N} screens | **Passed:** {pass_count} | **Failed:** {fail_count}

   | Screen | Score | Critical | Status |
   |--------|-------|----------|--------|
   | {name} | {score}/100 | {critical_count} | PASS/FAIL |
   ```
   Then commit the updated manifest:
   ```bash
   git add .planning/design/BATCH-RESULT.md
   git commit -m "design(review): update batch manifest with review results"
   ```
6. **Print review summary table** to output (same format as the BATCH-RESULT.md table above).
7. **Store REVIEW_ALL_PASSED** = true if ALL screens have review_status REVIEW_PASSED.

### 3b.8e: Review gate (auto-run decision)

This step gates auto-run on review results. It reads REVIEW_ALL_PASSED (set by 3b.8d) and determines whether to proceed to auto-run, offer an override, or skip.

1. **If no screens were reviewed** (REVIEWABLE_SCREENS was empty in 3b.8c -- all screens failed composition): Skip this step entirely. Proceed to 3b.9 as before (unchanged behavior for all-failed batches).

2. **If REVIEW_ALL_PASSED is true:**
   Print: "All screens passed review. Proceeding to auto-run."
   Continue to Step 3b.9.

3. **If REVIEW_ALL_PASSED is false:**
   List failing screens with their scores and critical issue counts from REVIEW_RESULTS:
   ```
   Review found issues that should be fixed before running:
     - {screen_name}: {score}/100 ({critical_count} critical issues)
     - ...

   Recommended: Run `/motif:fix {space-separated failing screen names}` to address critical issues.

   Override: Would you like to launch the preview anyway? (yes/no)
   ```
   - If user says **yes**: Continue to Step 3b.9.
   - If user says **no**: Print "Skipping auto-run. Fix issues and re-compose, or run `/motif:review` after fixing." Skip 3b.9, go directly to 3b.10.

### 3b.9: Offer auto-run ONCE

This step is reached only if the review gate (3b.8e) passed or the user overrode a failed review.

Offer auto-run preview ONCE for the entire batch (not per-screen). Use the same eligibility checks as Step 4b:

- Determine `platform` from `.planning/design/STATE.md`
- Read `.claude/get-motif/references/framework-registry.json` and locate the platform entry
- Confirm the entry has `devServer` metadata with `mode` set to `daemon` or `static-preview`
- If any checks fail: skip auto-run

If eligible, prompt: “Batch composition complete. Do you want me to auto-run the preview now? (yes/no)”

If user says yes: run the shared launcher:
`node .claude/get-motif/scripts/runtime-launcher.js --platform {platform} --project-root {PROJECT_ROOT} --project-name {PROJECT_NAME} --source compose`

Report results per Step 4b. Auto-run failure does not affect batch results.

### 3b.10: Next step

Check STATE.md for remaining `planned` screens AND review status:

**If all screens are composed AND review passed (REVIEW_ALL_PASSED is true):**
  “All screens composed and reviewed. Your design is production-ready.”
  If auto-run was launched: “Preview is running -- check the browser.”
  If auto-run was not launched or skipped: “Run the preview manually or proceed to development.”

**If all screens are composed but review found issues (REVIEW_ALL_PASSED is false):**
  “All screens composed. Review found issues on {N} screens.”
  List failing screens.
  “Run `/motif:fix {failing_screen_names}` to address critical issues, then `/motif:compose {failing_screen_names}` to re-compose.”

**If some screens are `failed` (composition failures):**
  List them and suggest: “To retry failed screens, run `/motif:compose {failed_name_1} {failed_name_2}`”

**If some screens are still `planned` (were not in this batch):**
  List them and suggest composing them next.

If context > 50%, suggest `/clear` first.

**Batch mode ends here.** Do NOT proceed to Steps 4, 4b, 5, 6, or Final Step -- all result collection, state updates, and reporting are handled within Step 3b.

---

## Step 4: Collect Result (single-screen only)

This step runs only in single-screen mode (BATCH_MODE is false). In batch mode, result collection happens in Step 3b.4.

After the agent completes, read ONLY `.planning/design/screens/{SCREEN_NAME}-SUMMARY.md`.

Check:
- Did the agent create the summary? If not, something went wrong — report to user.
- Did the agent create screen files? Check with `git log --oneline -5`.

## Step 4b: Optional Auto-Run (Post-Compose, single-screen only)

This step runs only in single-screen mode. In batch mode, auto-run is offered once in Step 3b.9.

If composition succeeded and the summary exists, you may offer a post-compose auto-run preview.

**Eligibility checks (must pass before offering):**
- Determine `platform` from `.planning/STATE.md`.
- Read `.claude/get-motif/references/framework-registry.json` and locate the platform entry.
- Confirm the entry has `devServer` metadata with `mode` set to `daemon` or `static-preview`.
- If any of the above are missing, skip auto-run and continue to Step 5.

**Prompt (user-facing):**
“Composition complete. Do you want me to auto-run the preview now? (yes/no)”

**If user says yes:**
1. Resolve the project root:
   - Prefer `findProjectRoot(process.cwd())` from `bin/lib/find-root.js` if available.
   - If it returns null, fall back to `process.cwd()` and WARN.
2. Set `PROJECT_NAME` to `path.basename(PROJECT_ROOT)` (or the directory name if a parent root was detected).
3. Run the shared launcher (do NOT inline spawn logic here):
   `node .claude/get-motif/scripts/runtime-launcher.js --platform {platform} --project-root {PROJECT_ROOT} --project-name {PROJECT_NAME} --source compose`
4. If the launcher succeeds, report:
   - Read `.planning/runtime/active-session.json` (if present) to surface tracked runtime details.
   - For daemon runtimes: the preview URL, tracked PID, and whether Motif reused or restarted a prior session.
   - For static previews: the opened file target path and any reuse notice.
   - Always mention the session artifact path so users can debug (`.planning/runtime/active-session.json`).
   - If a `portConflict` is recorded, warn that an external process held the default port and Motif left it untouched.

**Failure handling:**
- If the launcher fails, WARN with the error message.
- Do NOT treat auto-run failure as a compose failure.
- Continue to Step 5 regardless.

**Guardrails:**
- Do NOT offer auto-run for unsupported platforms.
- Do NOT block static preview behind daemon-only logic.
- Do NOT change the brownfield/overlay composition flow.

## Step 5: Update State (single-screen only)

This step runs only in single-screen mode. In batch mode, state updates happen atomically in Step 3b.6 via batch-update-screens.

Update `.planning/design/STATE.md`:
- Phase → `COMPOSING` (if first screen) or leave as-is
- Update Screens table: set {SCREEN_NAME} status to `composed`
- Append to Decisions Log if relevant

## Step 6: Next Step (single-screen only)

This step runs only in single-screen mode. In batch mode, next-step guidance is provided in Step 3b.10.

Check STATE.md for remaining `planned` screens.
- If more screens remain: “Screen composed. Run `/motif:compose {next_screen}` for the next one.”
- If all screens composed: “All screens composed. Run `/motif:review all` to evaluate.”

If context > 50%, suggest `/clear` first.

## Multi-Screen Composition

Multi-screen composition is handled via batch mode. See Step 1 for argument detection (Cases C and D) and Step 3b for wave dispatch. To compose multiple screens, use:
- `/motif:compose login dashboard settings` -- named screens
- `/motif:compose --all` -- all planned/failed screens
- `/motif:compose --all --concurrency 2` -- with custom concurrency

## Final Step: Update State (single-screen only)

This step runs only in single-screen mode. In batch mode, state updates happen atomically in Step 3b.6 via `batch-update-screens`.

Run `node .claude/get-motif/scripts/motif-state.js update phase COMPOSING` (if phase changed from SYSTEM_GENERATED).
Run `node .claude/get-motif/scripts/motif-state.js update screens_composed {N}` where N is the new count.
Run `node .claude/get-motif/scripts/motif-state.js update last_command /motif:compose` and `update last_outcome success`.
Run `node .claude/get-motif/scripts/motif-state.js update updated {ISO_DATE}`.
