# Phase 16: Validation and Hardening - Research

**Researched:** 2026-03-06
**Domain:** Post-decomposition validation, atomic git commits, rollback on failure, stale scan artifact detection
**Confidence:** HIGH

## Summary

Phase 16 is the final phase of v1.2 Brownfield Intelligence. It adds three capabilities to the Motif compose pipeline: (1) atomic git commits that bundle all decomposed files from a single screen composition into one commit, (2) automatic rollback of that commit if post-decomposition validation checks fail (import cycles, naming conflicts, missing props), and (3) stale scan artifact detection that prevents composition against outdated scan data.

The current compose workflow (compose-screen.md) has the subagent commit with a simple `design(compose): implement {SCREEN_NAME} screen` at the end of Step F. There is no validation between file creation and commit, no rollback on failure, and no staleness check on scan artifacts. Phase 16 modifies the compose workflow to insert a validation gate between file creation and commit, wraps the commit in an atomic pattern with rollback capability, and adds a pre-composition staleness check in the orchestrator.

All three success criteria map to modifications of compose-screen.md (both canonical and live copies). A new validation script (`scripts/compose-validator.js`) provides the actual validation logic -- checking import cycles, naming conflicts, and missing props in decomposed files. The staleness check is a lightweight timestamp comparison that runs in the orchestrator (Step 2) before spawning the subagent.

**Primary recommendation:** Build a compose-validator.js script that validates decomposed output (import cycles, naming conflicts, prop mismatches), modify compose-screen.md to add a validation-then-commit-or-rollback pattern in Step F, and add a staleness check for scan artifacts in Step 2 of the orchestrator.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js fs | Built-in | Read decomposed files for validation | Zero dependencies, consistent with project-scanner.js pattern |
| Node.js path | Built-in | Path resolution for import cycle detection | Already used throughout scripts/ |
| Node.js child_process | Built-in | Run validator from agent via Bash tool | Agent uses `Bash(node:*)` pattern established in scan workflow |
| git | System | Atomic commit and rollback | Already used by compose subagent for commits |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | Pure Node.js, consistent with all other Motif scripts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom validator script | Agent-only validation via instructions | Agent instructions are unreliable for complex graph analysis (import cycles). A script provides deterministic validation with clear pass/fail output. |
| git reset --soft for rollback | Manual file deletion | Git reset is atomic and reliable. Manual deletion risks leaving partial artifacts. |
| Timestamp-based staleness | Content hash staleness | Timestamps are simpler and sufficient. If PROJECT-SCAN.md is older than the project's most recent component file modification, it's stale. Content hashing adds complexity for marginal benefit. |

**Installation:**
```bash
# No installation needed -- pure Node.js script, no dependencies
```

## Architecture Patterns

### Recommended Project Structure
```
scripts/
  compose-validator.js      # NEW: validates decomposed output
  project-scanner.js        # existing
  token-extractor.js        # existing
  gap-analyzer.js           # existing

core/workflows/
  compose-screen.md         # MODIFIED: validation gate + atomic commit + staleness check

.claude/get-motif/workflows/
  compose-screen.md         # MODIFIED: synced live copy
```

### Pattern 1: Validate-Then-Commit (Subagent Step F)

**What:** The compose subagent writes all files first, then runs validation, then commits atomically -- or rolls back on validation failure.
**When to use:** Always, in the compose subagent after file creation and before commit.

The current Step F is a single line:
```
Commit all files: `design(compose): implement {SCREEN_NAME} screen`
```

The new Step F becomes a multi-step process:

```markdown
### F. Validate and Commit

1. **Stage all created files** (do NOT commit yet):
   ```bash
   git add [all files listed in "Files Created" from step E]
   ```

2. **Run validation:**
   ```bash
   node scripts/compose-validator.js --screen {SCREEN_NAME} --files [file1] [file2] ...
   ```

3. **If validation PASSES:** Commit atomically:
   ```bash
   git commit -m "design(compose): implement {SCREEN_NAME} screen"
   ```

4. **If validation FAILS:** Roll back all staged files:
   ```bash
   git reset HEAD [all staged files]
   ```
   Then report the validation errors to the orchestrator via SUMMARY.md.
   Set a `validation: FAILED` field in the summary.
   Do NOT attempt to fix -- the orchestrator will report to the user.
```

**Why this pattern:** The subagent has `Bash(git add:*)` and `Bash(git commit:*)` in its allowed tools. By staging first, validating, then committing (or resetting), we get atomic behavior. If validation fails, `git reset HEAD` unstages the files without deleting them -- the user can inspect and fix manually.

### Pattern 2: Compose Validator Script

**What:** A Node.js script that validates decomposed compose output for common errors.
**When to use:** Called by the compose subagent after file creation, before commit.

The validator checks three things:

1. **Import Cycle Detection:** Build a directed graph of imports between generated files. If any cycle exists, fail with the cycle path.

2. **Naming Conflict Detection:** Check if any generated file path collides with an existing file in the project (for brownfield). Uses `fs.existsSync()` on each file path before the file is written. Note: since files are already written by the time the validator runs, this check verifies that the COMPONENT-GAP.md lookup worked correctly -- if a file was written over an existing file, that's a conflict.

3. **Missing Prop Detection:** For brownfield, compare props passed to imported components against the props listed in PROJECT-SCAN.md's Props Summary table. Warn (not fail) if a prop is passed that the existing component doesn't declare.

Output format (JSON to stdout):
```json
{
  "status": "pass|fail|warn",
  "errors": [
    { "type": "import-cycle", "detail": "StatCard -> MetricRow -> StatCard", "severity": "error" }
  ],
  "warnings": [
    { "type": "missing-prop", "detail": "Button: 'loading' prop not found in scanned props", "severity": "warn" }
  ]
}
```

### Pattern 3: Stale Scan Artifact Detection (Orchestrator Step 2)

**What:** Before spawning the compose subagent, the orchestrator checks if scan artifacts are still current relative to the project source files.
**When to use:** In the compose orchestrator's Step 2 (context assembly), only when brownfield (PROJECT-SCAN.md exists).

Detection logic:
- Get the modification time of `.planning/design/PROJECT-SCAN.md`
- Check if the project's source directories (from PROJECT-SCAN.md's directory structure) have any files newer than the scan timestamp
- If stale: warn the user and suggest re-running `/motif:scan` before composing
- The staleness check is a WARNING, not a blocker -- the user decides whether to re-scan or proceed

Implementation approach: This is instruction-based in the orchestrator, not a separate script. The orchestrator uses:
```bash
# Check if any source file is newer than PROJECT-SCAN.md
find src/ -name "*.tsx" -o -name "*.jsx" -newer .planning/design/PROJECT-SCAN.md | head -5
```

If files are found, warn the user. This is lightweight and uses only standard CLI tools available to the orchestrator's allowed tools.

**Important:** The orchestrator currently has `allowed-tools: Read, Grep, Glob, Bash(git add:*), Bash(git commit:*), Bash(git status), Task`. The staleness check needs `Bash(find:*)` or an alternative approach. Since the orchestrator already uses `Glob`, it can use Glob to find files and Read to check the scan file timestamp. Alternatively, this check can be done via the Read tool (read PROJECT-SCAN.md's "Scanned:" date) compared to a `Bash(git log:*)` or `Bash(stat:*)` call.

**Simplest approach:** Read the `**Scanned:** YYYY-MM-DD` line from PROJECT-SCAN.md. Compare it to today's date. If the scan is more than 7 days old, warn. If it's from a different day and the user has committed changes to source files since the scan, warn. This avoids needing `find` in the allowed tools.

### Pattern 4: Updated Summary Format for Validation

**What:** The screen summary gains a validation status section.
**When to use:** Always -- the summary now reports whether validation passed.

```markdown
## Validation
- Status: PASSED/FAILED
- Import cycles: none/[list]
- Naming conflicts: none/[list]
- Prop warnings: none/[list]
```

### Anti-Patterns to Avoid
- **Fixing validation failures automatically in the subagent:** The subagent should NOT attempt to fix import cycles or naming conflicts. It reports the failure and the orchestrator tells the user. Auto-fix risks cascading changes that break other things.
- **Blocking commit on warnings:** Missing props are warnings, not errors. Only import cycles and naming conflicts should block the commit.
- **Making staleness check a hard blocker:** Users may intentionally compose against slightly stale scan data. The staleness check warns but does not block.
- **Deleting files on rollback:** `git reset HEAD` unstages files but leaves them on disk. This is intentional -- the user can inspect the failed output and fix manually. Do NOT use `git checkout -- [files]` which would delete the work.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Import cycle detection | Manual regex-based cycle check | Graph traversal in compose-validator.js | Import graphs can have complex indirect cycles. A proper DFS with cycle detection is needed. |
| Git atomic commit | Custom file tracking | `git add` + `git commit` + `git reset HEAD` on failure | Git provides atomic commit semantics natively |
| Stale artifact detection | Complex file watcher | Simple date comparison from PROJECT-SCAN.md header | Scan artifacts have a "Scanned: YYYY-MM-DD" header -- just read and compare |
| Prop validation | AST parsing of generated files | Regex-based import/prop extraction (consistent with project-scanner.js) | The project already uses regex-based analysis. Keep consistent. |

**Key insight:** The validation script is the only new code artifact in this phase. The atomic commit and rollback are git operations added to the compose workflow instructions. The staleness check is a simple date comparison in the orchestrator. Keep the scope tight.

## Common Pitfalls

### Pitfall 1: Subagent Allowed-Tools Mismatch
**What goes wrong:** The compose subagent can't run the validator because `Bash(node:*)` isn't in its allowed-tools.
**Why it happens:** The compose-screen.md frontmatter specifies `allowed-tools` for the orchestrator, but the subagent spawned via Task() inherits different tool permissions.
**How to avoid:** The subagent is spawned with Task() which gets its own tool access. The subagent currently commits via `Bash(git add:*)` and `Bash(git commit:*)`. Verify that the subagent can also run `Bash(node:*)` for the validator. The scan workflow (scan.md) uses `Bash(node:*)` in its allowed-tools, confirming this pattern works. The compose-screen.md frontmatter's allowed-tools apply to the ORCHESTRATOR, not the subagent.
**Warning signs:** Validator command fails with "tool not allowed" error.

### Pitfall 2: Rollback Removes Unstaged Work
**What goes wrong:** `git reset --hard` or `git checkout --` removes files the user was working on alongside the compose operation.
**Why it happens:** Using destructive git commands when only staging reset is needed.
**How to avoid:** Use `git reset HEAD [files]` which only unstages specific files. NEVER use `git reset --hard` or `git checkout --` in the rollback. The generated files should remain on disk for inspection.
**Warning signs:** User's other uncommitted work disappears after a compose validation failure.

### Pitfall 3: Validator Fails on Greenfield Projects
**What goes wrong:** The validator tries to check for naming conflicts against existing files, but greenfield projects have no source files -- all output goes to `.planning/design/screens/`.
**Why it happens:** Validator doesn't distinguish between brownfield and greenfield paths.
**How to avoid:** The validator receives a `--greenfield` flag (or infers it from file paths being in `.planning/`). In greenfield mode, skip naming conflict checks (there's nothing to conflict with) and skip prop validation (no PROJECT-SCAN.md). Import cycle detection still applies.
**Warning signs:** False positive naming conflicts in greenfield mode.

### Pitfall 4: Circular Import False Positives from External Dependencies
**What goes wrong:** The validator flags a "cycle" because File A imports React and File B also imports React, creating a false cycle through an external package.
**Why it happens:** The import graph includes all imports, not just inter-component imports.
**How to avoid:** Only track imports between the generated files themselves. Filter out any import that doesn't resolve to another file in the generated file list. External packages (react, next, etc.) and existing project files are excluded from cycle detection.
**Warning signs:** Validator reports import cycles involving `react`, `next/image`, or other framework imports.

### Pitfall 5: Staleness Check on Projects Without Git History
**What goes wrong:** The staleness check tries to compare scan date to git history, but the project has no relevant git commits or is a fresh clone.
**Why it happens:** Using git-based timestamps when the project's git state doesn't reflect file modifications.
**How to avoid:** Use the `Scanned: YYYY-MM-DD` date from PROJECT-SCAN.md directly. Compare to today's date. If the scan is from today, it's fresh. If it's from a previous session, warn. Don't depend on git log analysis for staleness.
**Warning signs:** Staleness check always reports "stale" or always reports "fresh" regardless of actual state.

### Pitfall 6: Validator Script Path Assumptions
**What goes wrong:** The validator is called with `node scripts/compose-validator.js` but the working directory inside the subagent is different from the project root.
**Why it happens:** The subagent might be spawned in a different working directory context.
**How to avoid:** Use the same path pattern as scan.md: `node scripts/compose-validator.js`. The scan workflow already uses `node scripts/project-scanner.js` from the project root, confirming this path pattern works. If needed, the compose-screen.md instructions can specify the full path.
**Warning signs:** "Cannot find module" error when running the validator.

## Code Examples

### compose-validator.js Structure
```javascript
#!/usr/bin/env node
'use strict';

/**
 * Compose Validator (VALID-01)
 *
 * Usage: node scripts/compose-validator.js --screen <name> --files <f1> <f2> ...
 *        [--scan-dir <dir>]  (default: .planning/design)
 *
 * Validates decomposed compose output:
 * 1. Import cycle detection (ERROR -- blocks commit)
 * 2. Naming conflict detection (ERROR -- blocks commit)
 * 3. Missing prop warnings (WARN -- does not block)
 *
 * Outputs JSON result to stdout.
 * Exit code 0 = pass or warn-only, exit code 1 = errors found.
 *
 * Zero external dependencies -- pure Node.js.
 */

const fs = require('node:fs');
const path = require('node:path');

// Parse CLI args
// ...

// 1. Import Cycle Detection
// Build adjacency list from import statements in generated files
// DFS with visited/recursion-stack for cycle detection
// Only track imports that resolve to other files in the --files list

// 2. Naming Conflict Detection (brownfield only)
// For each generated file, check if the path existed BEFORE composition
// Skip for files in .planning/design/ (greenfield path)

// 3. Missing Prop Validation (brownfield only)
// Read PROJECT-SCAN.md Props Summary table
// For each imported component, check if props passed match scanned props
// Warn on unknown props, don't error

// Output JSON result
```

### Import Cycle Detection Algorithm
```javascript
// Source: standard DFS cycle detection (textbook graph algorithm)
function detectCycles(adjacencyList) {
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function dfs(node, path) {
    visited.add(node);
    recursionStack.add(node);
    path.push(node);

    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, path);
      } else if (recursionStack.has(neighbor)) {
        // Found cycle: extract cycle from path
        const cycleStart = path.indexOf(neighbor);
        cycles.push(path.slice(cycleStart).concat(neighbor));
      }
    }

    path.pop();
    recursionStack.delete(node);
  }

  for (const node of adjacencyList.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}
```

### Extracting Imports from Generated Files
```javascript
// Source: consistent with project-scanner.js regex patterns
function extractLocalImports(content, generatedFiles) {
  const imports = [];
  // Match: import { X } from './path' or import X from '../path'
  const importPattern = /import\s+(?:\{[^}]+\}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importPattern.exec(content)) !== null) {
    const importPath = match[1];
    // Only track imports that resolve to other generated files
    // Skip: node_modules imports (no ./ or ../ prefix)
    // Skip: external package imports (react, next, etc.)
    if (importPath.startsWith('.') || importPath.startsWith('@/')) {
      imports.push(importPath);
    }
  }

  return imports;
}
```

### Staleness Check (Orchestrator Instructions)
```markdown
## Step 2b: Scan Freshness Check (brownfield only)

If PROJECT-SCAN.md exists:
1. Read the `**Scanned:** YYYY-MM-DD` line from PROJECT-SCAN.md
2. Compare to today's date
3. If the scan date is NOT today:
   - Warn the user: "Scan artifacts are from [date]. Project files may have changed since then."
   - Ask: "Continue composing with existing scan data, or re-scan first?"
     - Continue: proceed normally
     - Re-scan: tell user to run `/motif:scan` first, then return
4. If the scan date IS today: proceed without warning
```

### Updated Step F (Validate and Commit)
```markdown
### F. Validate and Commit

**Step F1: Stage all created files**
Run `git add` on every file you created (listed in your Files Created tracking).
Do NOT commit yet.

**Step F2: Run post-decomposition validation**
```bash
node scripts/compose-validator.js --screen {SCREEN_NAME} --files [file1] [file2] ...
```

Read the JSON output.

**Step F3: Act on results**

IF status is "pass" or "warn":
- Commit: `git commit -m "design(compose): implement {SCREEN_NAME} screen"`
- If there were warnings, note them in SUMMARY.md under ## Validation

IF status is "fail":
- Roll back staging: `git reset HEAD [all staged files]`
- Do NOT delete the files -- leave them for user inspection
- In SUMMARY.md, set:
  ```
  ## Validation
  - Status: FAILED
  - Errors: [list from validator output]
  ```
- Do NOT attempt to fix the errors yourself
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No validation of decomposed output | Validator script checks import cycles, naming conflicts, props | Phase 16 (new) | Prevents broken compositions from being committed |
| Single `git commit` with no validation gate | Stage -> validate -> commit or rollback | Phase 16 (new) | Atomic commits with safety net |
| No staleness awareness | Scan date comparison before composition | Phase 16 (new) | Prevents ghost component references from outdated scans |
| Subagent commits blindly | Subagent validates before committing, reports failures | Phase 16 (new) | User gets clear feedback on composition quality |

## Integration Points

### compose-screen.md Modifications

**Orchestrator (Step 2):** Add Step 2b for scan freshness check (brownfield only). Reads PROJECT-SCAN.md's Scanned date, compares to today, warns if stale.

**Subagent (Step F):** Replace single-line commit with validate-then-commit-or-rollback pattern. Add validation script call, conditional commit/rollback, and validation status in summary.

**Subagent (Step E - Summary):** Add `## Validation` section to summary template with status, errors, and warnings.

### Allowed Tools

The orchestrator's `allowed-tools` currently includes: `Read, Grep, Glob, Bash(git add:*), Bash(git commit:*), Bash(git status), Task`. The staleness check uses Read (to parse PROJECT-SCAN.md date) and comparison logic -- no new tools needed.

The subagent needs `Bash(node:*)` to run the validator. The subagent is spawned via Task() and its tools are determined by the Task prompt, not the orchestrator's frontmatter. The scan workflow already demonstrates `Bash(node:*)` usage in a Motif context.

### File Syncing

As with Phase 15, both `core/workflows/compose-screen.md` (canonical) and `.claude/get-motif/workflows/compose-screen.md` (live copy) must be kept identical.

## Open Questions

1. **Should the validator also check for hardcoded CSS values in generated files?**
   - What we know: The motif-token-check.js hook already catches hardcoded CSS values at Write/Edit time (PostToolUse hook). Running the validator would be redundant.
   - What's unclear: Whether the PostToolUse hook reliably catches all violations, or if a belt-and-suspenders approach is warranted.
   - Recommendation: **Do NOT duplicate token checking in the validator.** The existing hook system handles this. The validator focuses on structural issues (import cycles, naming conflicts, props) that the hooks cannot catch. Keep single responsibility.

2. **Should naming conflict detection check the filesystem at validation time, or compare against COMPONENT-GAP.md?**
   - What we know: COMPONENT-GAP.md lists known existing components. But a file might exist that isn't in the gap analysis (e.g., a utility file, a test file, a config file).
   - What's unclear: Whether filesystem checks are reliable given the subagent has already written the files (overwriting any previous file at that path).
   - Recommendation: **Use COMPONENT-GAP.md for brownfield component conflict detection, and `git status` for detecting unintended overwrites.** If git shows a modified (not new) file among the staged files, that's a conflict -- the composition overwrote an existing project file. This is reliable because `git add` + `git status --porcelain` shows `A` for new files and `M` for modified existing files.

3. **How aggressive should the staleness warning be?**
   - What we know: Users may run scan once and compose many screens over several sessions.
   - What's unclear: What threshold makes a scan "stale enough" to warn.
   - Recommendation: **Warn if the scan date is not today AND the user has made source file commits since the scan.** This catches real staleness (project changed since scan) without nagging users in multi-session composition workflows. If determining commit history is too complex, fall back to: warn if scan date is not today, with a simple "Continue?" prompt.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `core/workflows/compose-screen.md` -- current composition workflow, Step F commit pattern, allowed-tools
- Existing codebase: `.claude/get-motif/workflows/compose-screen.md` -- live copy, confirmed identical
- Existing codebase: `scripts/project-scanner.js` -- regex-based analysis pattern, zero-dependency approach, output format
- Existing codebase: `scripts/gap-analyzer.js` -- component matching pattern, markdown table parsing
- Existing codebase: `.claude/get-motif/hooks/motif-token-check.js` -- PostToolUse hook pattern, stdin JSON processing
- Existing codebase: `.claude/settings.json` -- hook configuration, allowed tools for hooks
- Existing codebase: `core/workflows/scan.md` -- scan workflow `Bash(node:*)` usage, artifact output format
- Phase 15 plans and summaries: decomposition rules, file placement, component reuse patterns
- Phase 15 research: context budget analysis, pitfall identification
- Phase 13 summaries: project-scanner.js capabilities, convention extraction

### Secondary (MEDIUM confidence)
- DFS cycle detection algorithm -- standard computer science algorithm, well-established
- Git staging/reset semantics -- `git reset HEAD` unstages without deleting, verified by git documentation

### Tertiary (LOW confidence)
- None -- all findings are based on direct codebase analysis and established patterns

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, pure Node.js consistent with existing scripts
- Architecture (validation script): HIGH -- follows established script pattern from project-scanner.js, uses standard graph algorithm
- Architecture (atomic commit): HIGH -- uses standard git operations already available to the subagent
- Architecture (staleness check): HIGH -- simple date comparison using existing artifact format
- Pitfalls: HIGH -- derived from direct analysis of compose workflow, subagent tool access, and git behavior

**Research date:** 2026-03-06
**Valid until:** 2026-04-06 (stable -- workflow modifications plus one new script, no external dependency changes)
