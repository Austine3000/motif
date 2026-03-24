# Architecture Patterns: Batch Multi-Screen Composition

**Domain:** Design system composition tooling (Motif batch compose)
**Researched:** 2026-03-24
**Overall confidence:** HIGH (based on direct codebase analysis of all integration points)

## Existing Architecture Summary

Motif uses an **orchestrator/subagent pattern** where:

1. **compose-screen.md** is the workflow orchestrator -- it stays thin (<=30% context max)
2. Each screen spawns a **fresh subagent via Task()** with a clean 200K token window
3. **STATE.md** (YAML frontmatter) tracks phase, screen list, and completion status
4. **motif-state.js** provides atomic read/update/write/recover operations on STATE.md
5. **compose-validator.js** validates decomposed output (import cycles, naming conflicts, prop warnings) -- runs inside each subagent
6. Each subagent **commits atomically** per screen: `design(compose): implement {SCREEN_NAME} screen`
7. The orchestrator **reads only SUMMARY.md** after each subagent completes -- never full output

### Current Flow (Single Screen)

```
User: /motif:compose dashboard
  |
  v
Orchestrator (compose-screen.md)
  1. Load STATE.md via motif-state.js read
  2. Validate phase (SYSTEM_GENERATED, COMPOSING, ITERATING)
  3. Check prerequisites (tokens.css, COMPONENT-SPECS.md)
  4. Assemble context profile (file paths, not contents)
  5. Resolve platform overlay + scaffold detection
  6. Spawn ONE Task() subagent with assembled prompt
  7. Subagent: reads files -> composes screen -> validates -> commits
  8. Orchestrator: reads {SCREEN_NAME}-SUMMARY.md
  9. Updates STATE.md (phase, screen status, screens_composed)
  10. Suggests next screen or /motif:review
```

### Existing Parallel Support (Documented But Incomplete)

The compose-screen.md workflow already contains a "Parallel Composition" section (lines 429-437) that acknowledges multi-screen spawning:

> "If the user wants to compose multiple screens at once, you CAN spawn multiple composer agents in parallel (one per screen) in a single message with multiple Task() calls."

**Conditions listed:**
1. Screens are independent (no shared unique components)
2. User explicitly requests it
3. User understands rate limit implications

**What is NOT implemented despite this documentation:**
- No argument parsing for multiple screen names or "all"
- No batch state update mechanism (each sequential update is a separate read-write cycle)
- No batch result collection or progress reporting
- No auto-review trigger after batch completion
- No guidance on handling partial failures across the batch

---

## Recommended Architecture: Batch Compose

### Design Principle

**The orchestrator gains batch coordination. Subagents remain unchanged.** The screen composer agent (`motif-screen-composer.md`) and the compose-validator script need zero modification. All batch logic lives in the orchestrator workflow (`compose-screen.md`) and a small addition to `motif-state.js`.

### Component Inventory: Reuse vs Modify

| Component | File | Action | Rationale |
|-----------|------|--------|-----------|
| Screen Composer Agent | `agents/motif-screen-composer.md` | **REUSE AS-IS** | Screen-agnostic. Receives one screen name, composes it. Batch is invisible to it. |
| Compose Validator | `scripts/compose-validator.js` | **REUSE AS-IS** | Called per-screen inside each subagent. No batch awareness needed. |
| Review Workflow | `workflows/review.md` | **REUSE AS-IS** | Already accepts `all` argument, spawns one reviewer per screen in parallel. |
| Fix Workflow | `workflows/fix.md` | **REUSE AS-IS** | Per-screen fix agent, unchanged. |
| Context Engine | `references/context-engine.md` | **REUSE AS-IS** | Context profiles are per-subagent. Batch does not change loading. |
| State Machine | `references/state-machine.md` | **REUSE AS-IS** | Phase transitions unchanged. COMPOSING covers multiple screens already. |
| STATE.md schema | `.planning/design/STATE.md` | **NO CHANGE** | Existing frontmatter schema handles N screens with status fields. |
| Compose Orchestrator | `workflows/compose-screen.md` | **MODIFY** | Add multi-arg parsing, parallel spawning, batch collection, auto-review. |
| State Utility | `scripts/motif-state.js` | **MODIFY** | Add `batch-update-screens` command for atomic multi-screen updates. |
| Command Entry Point | `commands/motif/compose.md` | **MODIFY** | Update argument-hint from `[screen-name]` to `[screen-name... | all]`. |

**No new files are required.** The batch feature is purely an orchestration concern.

---

## Data Flow: Batch Compose

### Happy Path

```
User: /motif:compose dashboard settings profile
  |
  v
Step 1: ARGUMENT PARSING (new logic)
  Parse $ARGUMENTS:
  - If empty: find next "planned" screen (existing single-screen behavior)
  - If "all": read STATE.md, collect all screens with status "planned"
  - If multiple words: split on spaces, treat as screen name list
  - Validate each name exists in STATE.md screens array
  - Skip already-composed screens with warning
  - Result: SCREEN_LIST = [dashboard, settings, profile]
  |
  v
Step 2: CONTEXT ASSEMBLY (shared, done once)
  Same as current Step 2:
  - Check prerequisites (tokens.css, COMPONENT-SPECS.md)
  - Resolve platform overlay
  - Detect scaffold
  - Identify brownfield artifacts (PROJECT-SCAN.md, CONVENTIONS.md, COMPONENT-GAP.md)
  This is IDENTICAL for all screens (design system is shared)
  Result: CONTEXT_PROFILE (reused across all spawns)
  |
  v
Step 3: PARALLEL SPAWN (modified)
  Spawn N Task() calls in a SINGLE response
  Each Task() gets: same CONTEXT_PROFILE + unique SCREEN_NAME
  Subagents run in separate context windows
  Each subagent independently: read files -> compose -> validate -> commit
  |
  v
Step 4: BATCH RESULT COLLECTION (new logic)
  After ALL Task() calls return:
  - Read each {screen}-SUMMARY.md
  - Build results table: screen name, validation status, issue counts
  - Categorize: passed, warned, failed
  |
  v
Step 5: BATCH STATE UPDATE (modified)
  - Read STATE.md ONCE
  - Update ALL screen statuses in one atomic write
  - Use: node motif-state.js batch-update-screens '{"dashboard":"composed",...}'
  - Update screens_composed count
  - Update phase to COMPOSING if first compose
  |
  v
Step 6: AUTO-REVIEW (new logic)
  If ALL screens passed/warned:
    Ask: "All N screens composed. Auto-review all? (yes/no)"
    If yes: invoke review workflow with "all" argument
  If some screens failed:
    Report failures, suggest fixing, offer to review passing ones
  Check context usage -- if >50%, suggest /clear before review
```

### Single-Screen Path Preserved

When `$ARGUMENTS` is a single screen name or empty, the flow collapses to the existing behavior. The batch logic adds zero overhead to single-screen composition:

```
SCREEN_LIST.length === 1
  -> Skip batch collection, skip batch state update
  -> Use existing per-screen state update calls
  -> No auto-review prompt (existing "suggest next screen" behavior)
```

---

## Key Integration Points

### 1. Argument Parsing (compose-screen.md Step 1)

Current Step 1 handles two cases: argument provided (use it) or not (find next planned). Extend to three:

```
IF $ARGUMENTS is empty:
  -> Find next "planned" screen from STATE.md (existing behavior)
  -> BATCH_MODE = false

IF $ARGUMENTS is "all":
  -> Read STATE.md screens array
  -> Collect all entries with status "planned"
  -> If none: "All screens already composed. Run /motif:review all."
  -> BATCH_MODE = true

IF $ARGUMENTS contains spaces:
  -> Split on whitespace
  -> Validate each name against STATE.md screens array
  -> Warn and skip names not found
  -> Warn and skip names already composed
  -> If resulting list is empty: "No valid planned screens in arguments."
  -> BATCH_MODE = (list.length > 1)

ELSE:
  -> Single screen name (existing behavior)
  -> BATCH_MODE = false
```

### 2. Parallel Task() Spawning (compose-screen.md Step 3)

The orchestrator constructs the same agent prompt it does today, but parameterized per screen name. In batch mode, it emits multiple Task() calls in one response block:

```
For each screen in SCREEN_LIST:
  Task("compose-{screen}", prompt_with_screen_name)

// All Task() calls dispatched in one message
// Claude Code handles parallel execution
```

**Critical constraint:** The orchestrator MUST NOT read file contents between spawns. It passes file PATHS only. This keeps orchestrator context flat regardless of batch size.

### 3. Batch State Update (motif-state.js)

Current `update` command writes one key at a time. For a 5-screen batch, that is 5 sequential read-write cycles to STATE.md. The new `batch-update-screens` command:

```javascript
// New command addition to motif-state.js
// Usage: node motif-state.js batch-update-screens '{"dashboard":"composed","settings":"composed"}'

function cmdBatchUpdateScreens(jsonStr) {
  // 1. Parse input: { screenName: newStatus, ... }
  // 2. Read current STATE.md
  // 3. For each entry in input, find matching screen in state.screens array, update status
  // 4. Recalculate screens_composed = count of screens with status !== "planned"
  // 5. atomicWrite STATE.md with all updates in one operation
}
```

This is approximately 30 lines of code, reusing the existing `parseFrontmatter`, `serializeFrontmatter`, `atomicWrite`, and `readState` functions.

### 4. Auto-Review Integration (compose-screen.md Step 6)

The review workflow already supports `all`:

> "If `$ARGUMENTS` is `all`: review all screens with status `composed` or `fixed`"

After batch compose, the orchestrator prompts:

```
If BATCH_MODE and all screens passed:
  "All {N} screens composed successfully. Run auto-review? (yes/no)"
  If yes: transition to review workflow with scope "all"

If BATCH_MODE and some screens failed:
  Print results table
  "X/{N} screens composed. Y failed validation."
  "Run /motif:compose {failed_screen} to retry failed screens."
  "Run /motif:review all to review passing screens."
```

**No changes needed to the review workflow itself.** It already handles multi-screen review with parallel Task() spawning.

---

## Git Commit Sequencing

Each subagent commits independently. Parallel Task() calls in Claude Code are dispatched concurrently but their git operations serialize naturally at the OS-level file lock. This is safe because:

1. Each subagent stages and commits only its own files (enforced by compose workflow Step F)
2. Screen file paths are non-overlapping by design:
   - Greenfield: each screen writes to `screens/{SCREEN_NAME}/` or unique route paths
   - Brownfield: each screen writes to its own route directory (e.g., `src/app/dashboard/`, `src/app/settings/`)
3. The compose-validator already catches naming conflicts (brownfield mode)

**Risk scenario:** Two screens both create a shared utility component (e.g., `src/components/ui/StatCard.tsx`). The second commit would overwrite the first. This is mitigated by:
- The decomposition rules in the composer agent, which scope new components to the screen
- The brownfield naming conflict check in compose-validator.js
- The "screens are independent" prerequisite for parallel composition

---

## Patterns to Follow

### Pattern 1: Deferred State Update

Current per-screen flow updates STATE.md after each screen. Batch defers:

```
Current (sequential):
  Spawn agent -> Collect result -> Update STATE.md -> Spawn next

Batch:
  Spawn ALL agents -> Collect ALL results -> Update STATE.md ONCE

Why: Avoids N sequential read-write cycles to STATE.md.
Why: Prevents partial state corruption if orchestrator hits context limit mid-batch.
Why: Atomic update ensures STATE.md is always consistent.
```

### Pattern 2: Orchestrator Stays Thin

The orchestrator reads only:
- STATE.md (for screen list, phase): ~500 tokens
- Each `{screen}-SUMMARY.md` (for results): ~500 tokens each

For a 5-screen batch: ~500 + (5 x 500) = ~3,000 tokens of data. Plus workflow instructions (~3,000 tokens). Total: ~6,000 tokens. Well within the 30% budget even with auto-review added.

### Pattern 3: Graceful Partial Failure

If 3 of 5 screens succeed and 2 fail:
- The 3 successful screens are already committed by their subagents
- STATE.md marks 3 as `composed`, leaves 2 as `planned`
- Report shows clear pass/fail per screen
- User can retry failed screens individually or as a smaller batch

### Pattern 4: Conditional Branching (Single vs Batch)

The modified compose-screen.md uses a single BATCH_MODE flag to branch:

```
BATCH_MODE = false:
  -> Existing per-screen flow (unchanged behavior)
  -> Per-screen state updates
  -> "Suggest next screen" ending

BATCH_MODE = true:
  -> Parallel spawn
  -> Batch result collection
  -> Batch state update
  -> Auto-review prompt
```

This ensures zero regression for the common single-screen usage.

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Sequential Spawning in Batch Mode
**What:** Spawning one Task(), waiting, then spawning the next
**Why bad:** 5 screens at ~45 seconds each = 3.75 minutes. Parallel = ~45 seconds.
**Instead:** Spawn ALL Task() calls in a single response block

### Anti-Pattern 2: Subagents Writing to STATE.md
**What:** Having each subagent update STATE.md with its own completion
**Why bad:** Race condition. Subagent A reads state, subagent B reads state, both write -- one update lost.
**Current behavior (correct):** Subagents never touch STATE.md. The orchestrator does all state updates in Steps 5/Final Step. This is already correct for batch -- no change needed in the subagent.

### Anti-Pattern 3: Cross-Screen Dependencies in a Batch
**What:** Screen B's subagent reading Screen A's output for consistency
**Why bad:** Destroys parallelism. Creates sequential dependency chain.
**Instead:** Cross-screen consistency relies on previous compose runs' SUMMARY.md files (already in context profile). Within a single batch, screens are treated as independent.

### Anti-Pattern 4: Orchestrator Reading Full Subagent Output
**What:** Using TaskOutput to read screen source code after completion
**Why bad:** For 5 screens, could consume 50K+ tokens in the orchestrator
**Instead:** Read ONLY `{screen}-SUMMARY.md` -- the established Motif pattern

### Anti-Pattern 5: New Scripts or Templates for Batch
**What:** Creating batch-compose.js, batch-state.js, BATCH-SUMMARY.md, etc.
**Why bad:** Unnecessary complexity. The batch feature is an orchestration concern, not a new subsystem.
**Instead:** Modify compose-screen.md workflow + add one command to motif-state.js

---

## Context Budget Analysis

### Compose + Auto-Review in One Session

| Phase | Orchestrator Context | Notes |
|-------|---------------------|-------|
| Workflow loading | ~3,000 tokens | compose-screen.md instructions |
| STATE.md read | ~500 tokens | Frontmatter parsing |
| Context assembly | ~200 tokens | File path strings only |
| Batch result collection (5 screens) | ~2,500 tokens | 5 SUMMARY.md files |
| Auto-review transition | ~3,000 tokens | review.md workflow loading |
| Review result collection (5 screens) | ~5,000 tokens | 5 REVIEW.md files |
| **Total** | **~14,200 tokens** | **Well under 30% of 200K** |

For 10 screens, this doubles to ~25K tokens. Still under 15% of context. The limiting factor is not context but API rate limits on parallel Task() calls.

**Recommendation:** Cap batch size at 6 screens as a UX recommendation (not a hard limit). For 7+ screens, suggest two batches with `/clear` between them.

---

## `motif-state.js` Modification Detail

The `batch-update-screens` command reuses existing infrastructure:

```javascript
function cmdBatchUpdateScreens(jsonStr) {
  if (!jsonStr) {
    process.stderr.write('[Motif] Usage: motif-state.js batch-update-screens \'{"screen":"status",...}\'\n');
    process.exit(1);
  }

  let updates;
  try { updates = JSON.parse(jsonStr); }
  catch (err) { process.stderr.write(`[Motif] Invalid JSON: ${err.message}\n`); process.exit(1); }

  // Read current state
  let currentContent = '';
  let body = '';
  let state = {};
  try {
    if (fs.existsSync(statePath)) {
      currentContent = fs.readFileSync(statePath, 'utf8');
      state = parseFrontmatter(currentContent) || {};
      body = getMarkdownBody(currentContent);
    }
  } catch (err) { /* warn */ }

  // Update each screen's status
  const screens = state.screens || [];
  for (const [name, newStatus] of Object.entries(updates)) {
    const screen = screens.find(s => s && s.name === name);
    if (screen) { screen.status = newStatus; }
  }

  // Recalculate screens_composed
  state.screens_composed = screens.filter(
    s => s && s.status && s.status !== 'planned'
  ).length;

  // Atomic write
  const frontmatter = serializeFrontmatter(state);
  atomicWrite(statePath, frontmatter + '\n' + body);
  process.stdout.write(JSON.stringify({ ok: true, updated: Object.keys(updates).length }) + '\n');
}
```

Added to the CLI switch:
```javascript
case 'batch-update-screens':
  cmdBatchUpdateScreens(args.slice(1).join(' '));
  break;
```

**Total addition:** ~35 lines of code in an existing file.

---

## Build Order (Implementation Sequence)

Each step is independently testable. Dependencies are noted.

### Step 1: Argument Parsing (no dependencies)
Modify `compose-screen.md` Step 1 to handle multi-screen args and "all" keyword. Pure logic addition with clear branching on BATCH_MODE.

**Test:** Run `/motif:compose all` and `/motif:compose screen1 screen2` -- verify correct SCREEN_LIST resolution without spawning agents.

### Step 2: Batch State Update Command (no dependencies)
Add `batch-update-screens` to `motif-state.js`. Can be unit tested directly:
```bash
node .claude/get-motif/scripts/motif-state.js batch-update-screens '{"dashboard":"composed","settings":"composed"}'
```

### Step 3: Parallel Spawn + Collection (depends on Step 1)
Modify `compose-screen.md` Steps 3-4 to spawn multiple Task() calls when BATCH_MODE is true and collect results from all SUMMARY.md files.

**Test:** Compose 2-3 screens in parallel on a test project. Verify all screens compose, all SUMMARY.md files exist.

### Step 4: Deferred State Update (depends on Steps 2 and 3)
Modify `compose-screen.md` Step 5 to use `batch-update-screens` when BATCH_MODE is true. Replace per-screen `motif-state.js update` calls with one batch call.

**Test:** After batch compose, verify STATE.md has all screens marked as `composed` and `screens_composed` count is correct.

### Step 5: Auto-Review Trigger (depends on Step 3)
Add conditional auto-review prompt in `compose-screen.md` Step 6. When all batch screens pass, offer to run `/motif:review all`.

**Test:** Compose 3 screens, accept auto-review prompt, verify review workflow runs on all composed screens.

### Step 6: Command File Update (trivial, any time)
Update `.claude/commands/motif/compose.md`:
- `argument-hint: [screen-name... | all]`

### Step 7: End-to-End Validation
Full test: `/motif:compose all` on a project with 3+ planned screens. Verify:
- Parallel spawning
- All screens composed and committed
- STATE.md updated atomically
- Auto-review prompt appears
- Review runs on all screens

---

## Integration Points Summary

| Integration Point | File | Change Type | Risk |
|-------------------|------|-------------|------|
| Arg parsing (multi + all) | `compose-screen.md` Step 1 | Additive logic | LOW -- existing cases preserved |
| Parallel Task() spawning | `compose-screen.md` Step 3 | Pattern extension | LOW -- documented as possible, same Task() API |
| Batch result collection | `compose-screen.md` Step 4 | Loop over N summaries | LOW -- same read pattern repeated |
| Batch state update | `compose-screen.md` Step 5 | One call replaces N calls | MEDIUM -- must be atomic |
| Auto-review prompt | `compose-screen.md` Step 6 | New conditional | LOW -- calls existing review workflow |
| batch-update-screens | `motif-state.js` | New command (~35 lines) | LOW -- reuses existing parse/write functions |
| argument-hint update | `compose.md` | Text change | TRIVIAL |
| Review workflow | `review.md` | None | NONE |
| Composer agent | `motif-screen-composer.md` | None | NONE |
| Compose validator | `compose-validator.js` | None | NONE |
| STATE.md schema | `.planning/design/STATE.md` | None | NONE |

---

## Sources

All findings from direct codebase analysis (HIGH confidence):

| File | What Was Analyzed |
|------|-------------------|
| `.claude/get-motif/workflows/compose-screen.md` | Current orchestrator flow, parallel support docs, spawn pattern, state updates |
| `.claude/get-motif/agents/motif-screen-composer.md` | Subagent definition, context profile, anti-slop checks |
| `.claude/get-motif/references/state-machine.md` | Phase definitions, gate checks, STATE.md format |
| `.claude/get-motif/references/context-engine.md` | Context budgets, orchestrator rules, subagent spawning pattern |
| `.claude/get-motif/scripts/motif-state.js` | State utility implementation, CLI commands, atomic write |
| `scripts/compose-validator.js` | Validation implementation (import cycles, naming, props) |
| `.claude/get-motif/workflows/review.md` | Review workflow, "all" argument support |
| `.claude/get-motif/workflows/fix.md` | Fix workflow (post-review path) |
| `.claude/commands/motif/compose.md` | Command entry point, argument passing |
| `.claude/get-motif/templates/STATE-TEMPLATE.md` | STATE.md schema |
| `.claude/get-motif/templates/SUMMARY-TEMPLATE.md` | Summary format |
