# Phase 29: Core Batch Orchestration - Research

**Researched:** 2026-03-24
**Domain:** Batch multi-screen composition orchestration -- parallel Task() dispatch, deferred commit strategy, STATE.md batch API, argument parsing
**Confidence:** HIGH

## Summary

Phase 29 implements the architectural foundation for batch screen composition: argument parsing for multi-screen and `--all`, wave-based parallel Task() dispatch, orchestrator-owned git commits, atomic STATE.md batch updates, and failure isolation. The milestone research (`.planning/research/`) established the high-level strategy; this phase research goes deeper into the exact modifications needed to existing files, the specific code patterns for the new `batch-update-screens` command in motif-state.js, and the precise changes to compose-screen.md's orchestrator flow.

The core architectural decision is "orchestrator owns all git commits." Today, each subagent (compose-screen.md Step F) does its own `git add`, `git commit`, and runs compose-validator.js. In batch mode, parallel subagents committing simultaneously will race on `.git/index.lock`. The solution: subagents in batch mode write files and run compose-validator.js but do NOT stage or commit. The orchestrator collects results, then stages and commits each successful screen sequentially. This requires a batch-mode flag passed to the subagent prompt that suppresses Step F's commit behavior.

The second critical piece is STATE.md integrity. Today, the orchestrator calls `motif-state.js update` multiple times sequentially (phase, screens_composed, last_command, last_outcome, updated). In batch mode, multiple waves would accumulate many separate read-modify-write cycles. The new `batch-update-screens` command performs a single atomic read-modify-write that updates all screen statuses and batch progress counters at once.

**Primary recommendation:** Modify compose-screen.md to support batch argument parsing and orchestrator-owned commits. Add one new command (`batch-update-screens`) to motif-state.js. Do NOT create a separate batch-compose.md workflow -- keep the single entry point at `/motif:compose` to avoid user confusion and slash command proliferation.

## Standard Stack

### Core (All Existing -- No New Dependencies)

| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| Node.js | >=22 | Runtime for scripts | Already required by Motif |
| Claude Code Task() | Current | Parallel subagent spawning | Native capability, up to 10 concurrent calls per message |
| motif-state.js | Current (extended) | STATE.md atomic read/write | Established state management pattern |
| compose-validator.js | Current (unchanged) | Per-screen file validation | Runs inside each subagent independently |
| compose-screen.md | Current (modified) | Batch orchestration entry point | Single `/motif:compose` command handles both single and batch |
| motif-screen-composer.md | Current (unchanged) | Single-screen composition agent | Batch is invisible to the composer |

### New Additions

| Component | Type | Purpose | Scope |
|-----------|------|---------|-------|
| `batch-update-screens` command | motif-state.js extension (~40 lines) | Single atomic write for all screen status updates | New `case` in CLI switch |
| Batch orchestration section in compose-screen.md | Workflow modification | Multi-screen argument parsing, wave dispatch, deferred commits | New steps between existing Step 1 and Step 3 |
| Batch-mode flag in subagent prompt | Prompt modification | Suppresses git staging/commit in subagent (Step F modified behavior) | Conditional text in agent_spawn block |

### Explicitly NOT Adding

| Technology | Why Not |
|------------|---------|
| Separate `batch-compose.md` workflow | Milestone research recommended this, but codebase analysis shows `/motif:compose` already has the entry point, gate checks, context assembly, and state update logic. Duplicating all of this into a new workflow creates maintenance burden. Instead, extend compose-screen.md with a batch path that reuses all existing steps. |
| p-limit / p-queue | Zero-dependency constraint. Wave batching is orchestrator logic, not JavaScript parallelism. |
| New batch-state.js script | motif-state.js already handles arbitrary key updates. One new command is sufficient. |
| BATCH-RESULT.md manifest file | Adds file I/O overhead. The orchestrator can track results in-memory within a wave and persist to STATE.md atomically after each wave. |

## Architecture Patterns

### Pattern 1: Single Entry Point with Batch Detection

**What:** `/motif:compose` detects whether the user provided multiple screen names or `--all` and branches into batch mode. Single-screen compose remains the default path.

**When to use:** Always -- this is how the user interacts with batch compose.

**Why:** The existing `/motif:compose` command already handles argument parsing (Step 1), gate checks, context assembly, scaffold detection, and state updates. Creating a separate `/motif:batch-compose` would duplicate all of this. The review workflow already demonstrates this pattern -- `/motif:review all` handles multi-screen review within the same workflow file.

**Argument parsing logic:**
```
$ARGUMENTS parsing:
  - No args          -> single-screen mode (pick next planned from STATE.md)
  - "login"          -> single-screen mode (compose "login")
  - "login dashboard settings" -> BATCH MODE (3 named screens)
  - "--all"           -> BATCH MODE (all screens with status "planned")
  - "--all --concurrency 2" -> BATCH MODE with custom concurrency cap
  - "login --concurrency 2" -> single-screen mode (ignore concurrency for single)
```

### Pattern 2: Orchestrator-Owned Commits (Deferred Commit Strategy)

**What:** In batch mode, subagents write files and run compose-validator.js but do NOT run `git add` or `git commit`. The orchestrator stages and commits each successful screen after all subagents in a wave complete.

**When to use:** Only in batch mode. Single-screen compose retains the existing self-committing behavior.

**Why:** Parallel `git commit` calls race on `.git/index.lock`. This is not a theoretical risk -- it is a guaranteed failure when two agents try to commit within the same second.

**Implementation detail -- what changes in the subagent prompt:**

The compose-screen.md agent_spawn block currently includes Step F (Validate and Commit). In batch mode, the orchestrator adds this instruction to the Task() prompt:

```
## BATCH MODE -- Commit Rules
You are composing in batch mode. After validation:
- If compose-validator.js returns "pass" or "warn": leave files on disk, staged but NOT committed. Write "Validation: PASSED" (or "WARNED") in SUMMARY.md.
- If compose-validator.js returns "fail": unstage files (`git reset HEAD [files]`). Write "Validation: FAILED" in SUMMARY.md.
- Do NOT run `git commit`. The orchestrator will commit your files.
```

The orchestrator then commits each screen sequentially:
```
For each screen with Validation: PASSED/WARNED in SUMMARY.md:
  1. git add [all files listed in SUMMARY.md "Files Created" section]
  2. git commit -m "design(compose): implement {SCREEN_NAME} screen"
```

**Critical detail:** The orchestrator must parse the "Files Created" section of each SUMMARY.md to know which files to stage. This section is already part of the SUMMARY.md format (compose-screen.md Step E).

### Pattern 3: Wave-Based Parallel Dispatch

**What:** Group screens into waves of N (default 3). Spawn all screens in a wave as parallel Task() calls in a single message. Wait for all to complete. Process results. Start next wave.

**When to use:** Whenever batch mode processes more than `concurrency` screens.

**Example -- 5 screens with concurrency 3:**
```
Wave 1: [login, dashboard, settings]
  -> 3 parallel Task() calls in one message
  -> All 3 complete (allSettled semantics)
  -> Orchestrator reads 3 SUMMARY.md files
  -> Orchestrator commits 3 screens sequentially
  -> Orchestrator updates STATE.md via batch-update-screens

Wave 2: [profile, transactions]
  -> 2 parallel Task() calls
  -> Same collection and commit process
```

### Pattern 4: Atomic Batch State Update

**What:** After each wave, the orchestrator calls `motif-state.js batch-update-screens` with a JSON payload containing all screen status changes. This performs a single read-modify-write cycle on STATE.md.

**When to use:** After each wave completes, and once at the end of the full batch.

**Why:** Today's `motif-state.js update` changes one key at a time. Updating 3 screens individually means 3 separate file reads and writes. If the orchestrator crashes between updates, STATE.md is partially updated. The batch command updates all screens atomically.

**Command format:**
```bash
node .claude/get-motif/scripts/motif-state.js batch-update-screens '{"updates":[{"name":"login","status":"composed"},{"name":"dashboard","status":"composed"},{"name":"settings","status":"failed"}],"screens_composed":5,"phase":"COMPOSING"}'
```

### Pattern 5: Failure Isolation via Summary-Based Detection

**What:** The orchestrator determines success/failure by reading each screen's SUMMARY.md. Missing SUMMARY.md = agent crashed. SUMMARY.md with `Validation: FAILED` = validation failure. SUMMARY.md with `Validation: PASSED` = ready to commit.

**When to use:** After every wave.

**Detection matrix:**

| SUMMARY.md exists? | Validation field | Files on disk? | Verdict | Orchestrator action |
|---------------------|-----------------|----------------|---------|---------------------|
| Yes | PASSED or WARNED | Yes, staged | SUCCESS | Commit files |
| Yes | FAILED | Yes, unstaged | VALIDATION FAILURE | Report to user, mark `failed` |
| No | N/A | Maybe | AGENT CRASH | Report to user, mark `failed` |

### Anti-Patterns to Avoid

- **Modifying motif-screen-composer.md for batch awareness:** The composer agent must remain batch-agnostic. Batch behavior is injected via the Task() prompt in compose-screen.md, not by changing the agent definition.
- **Reading TaskOutput for result collection:** CLAUDE.md explicitly prohibits this. Use SUMMARY.md files only.
- **Committing all screens in one mega-commit:** Each screen gets its own commit with `design(compose): implement {SCREEN_NAME} screen` for granular git blame. The orchestrator commits them sequentially (not in parallel).
- **Allowing subagents to modify tokens.css in batch mode:** Parallel token additions create merge conflicts. The batch prompt must include: "Do NOT add new tokens to tokens.css. If a needed token is missing, note it in SUMMARY.md under a '## Missing Tokens' section."
- **Using `git add .` or `git add -A` for batch commits:** The orchestrator must stage only the specific files listed in each screen's SUMMARY.md to avoid cross-screen contamination.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Argument parsing with flags | Custom regex parser | Simple string split + flag detection in workflow markdown | The orchestrator is a workflow document, not a script. Arguments are `$ARGUMENTS` strings. Keep parsing to 5-6 if/else branches. |
| Concurrency management | Custom promise pool in JS | Claude Code's native multiple Task() calls per message | Claude Code handles parallel dispatch natively. The orchestrator just issues N Task() calls. |
| Atomic file writes | Manual fs.writeFileSync with tmp-rename | Existing `atomicWrite()` in motif-state.js | Already handles the tmp-write-then-rename pattern. |
| Screen status tracking | Custom batch-state.json | STATE.md frontmatter via motif-state.js | Markdown-first architecture. Single source of truth. |
| Git conflict prevention | git worktrees or stash-based isolation | Deferred commit strategy (orchestrator-only commits) | Simpler, proven pattern. No need for worktree complexity. |

**Key insight:** This phase is almost entirely orchestration logic in a workflow markdown file. The only JavaScript code change is ~40 lines added to motif-state.js. Everything else is workflow instructions that Claude Code's orchestrator follows.

## Common Pitfalls

### Pitfall 1: Git index.lock Contention

**What goes wrong:** Two parallel subagents both run `git add` and `git commit` at the same time. The second one fails with `fatal: Unable to create '.git/index.lock': File exists.`

**Why it happens:** Git uses a lockfile to serialize access to the index. Parallel processes cannot commit simultaneously.

**How to avoid:** Subagents in batch mode NEVER commit. Only the orchestrator commits, and it does so sequentially (one screen at a time).

**Warning signs:** `index.lock` error in subagent output. SUMMARY.md shows validation passed but no git commit was created.

### Pitfall 2: STATE.md Race Condition

**What goes wrong:** After a wave of 3 screens completes, the orchestrator runs 3 separate `motif-state.js update` calls. If the orchestrator is interrupted between calls, STATE.md has partial updates (e.g., screen 1 is marked `composed` but screens 2 and 3 are still `planned` even though they succeeded).

**Why it happens:** Each `update` call is an independent read-modify-write. No transactional guarantee across multiple calls.

**How to avoid:** Use the new `batch-update-screens` command that accepts all screen updates as a single JSON payload and performs one atomic read-modify-write.

**Warning signs:** `screens_composed` count disagrees with the number of screens marked `composed` in the screens array.

### Pitfall 3: tokens.css Concurrent Modification

**What goes wrong:** Two parallel composers both detect a missing token (e.g., `--surface-card-hover`) and both add it to tokens.css. The second commit overwrites the first's addition, or git detects a merge conflict.

**Why it happens:** Existing compose-screen.md Step B rule 2 says: "If you need a token that doesn't exist, create it in tokens.css first and commit separately." This is fine for single-screen compose but dangerous in parallel.

**How to avoid:** The batch-mode prompt addendum must explicitly prohibit tokens.css modification: "Do NOT modify tokens.css or COMPONENT-SPECS.md during batch composition. If a token is missing, note it in SUMMARY.md under '## Missing Tokens' and continue using a close alternative."

**Warning signs:** Git merge conflict on tokens.css. Two SUMMARY.md files reference the same new token with different values.

### Pitfall 4: Orchestrator Context Bloat Across Waves

**What goes wrong:** The orchestrator reads full SUMMARY.md files (50-80 lines each) after each wave. With 4 waves of 3 screens, that is 12 SUMMARY.md reads (600-960 lines). Combined with the wave-reporting text, the orchestrator approaches context limits.

**Why it happens:** SUMMARY.md contains component lists, token references, vertical patterns, states, and file paths. Most of this is irrelevant to the orchestrator's needs (it only needs: did it pass? what files were created?).

**How to avoid:** The orchestrator reads only TWO sections from each SUMMARY.md: `## Validation` (status line) and `## Files Created` (file paths for committing). Use targeted Grep or Read with line offsets, not full file reads.

**Warning signs:** Context usage exceeds 40% after wave 2. Later waves produce degraded orchestrator behavior.

### Pitfall 5: Screen Name Validation Gaps

**What goes wrong:** User types `/motif:compose login dashbord settings` (typo: "dashbord"). The orchestrator spawns 3 agents. The "dashbord" agent cannot find any screen definition and either fails silently or composes a screen with no design context.

**Why it happens:** No validation of screen names against STATE.md's screen list before spawning agents.

**How to avoid:** Before entering wave dispatch, validate every provided screen name against STATE.md's screens array. Report unrecognized names and ask for confirmation: "Screen 'dashbord' not found in STATE.md. Did you mean 'dashboard'? Proceeding with: login, settings."

**Warning signs:** SUMMARY.md for an unknown screen references no vertical patterns and has minimal component usage.

### Pitfall 6: Stale Subagent Files After Validation Failure

**What goes wrong:** A subagent writes 6 files, runs compose-validator.js, gets `fail` (import cycle), unstages files with `git reset HEAD`, but the files remain on disk. The next wave's agents see these files and may import from them or conflict with them.

**Why it happens:** The compose workflow intentionally leaves failed files on disk for user inspection (compose-screen.md Step F: "Do NOT delete the files -- leave them on disk for user inspection").

**How to avoid:** The orchestrator, after collecting wave results, should warn if any failed screens left files on disk: "Screen 'settings' failed validation. Files remain on disk at [paths] for inspection. They will NOT be committed." This is informational, not a blocking issue.

**Warning signs:** Next wave's agents import from uncommitted files of a failed screen.

## Code Examples

### Example 1: batch-update-screens Command for motif-state.js

```javascript
// Source: Derived from existing motif-state.js patterns (cmdUpdate, atomicWrite)
function cmdBatchUpdateScreens(jsonStr) {
  if (!jsonStr) {
    process.stderr.write('[Motif] Usage: motif-state.js batch-update-screens <json>\n');
    process.exit(1);
  }

  let payload;
  try {
    payload = JSON.parse(jsonStr);
  } catch (err) {
    process.stderr.write(`[Motif] Invalid JSON: ${err.message}\n`);
    process.exit(1);
  }

  const { updates, screens_composed, phase } = payload;
  if (!Array.isArray(updates)) {
    process.stderr.write('[Motif] "updates" must be an array of {name, status} objects\n');
    process.exit(1);
  }

  // Single atomic read
  let currentContent = '';
  let body = '';
  let state = {};
  try {
    if (fs.existsSync(statePath)) {
      currentContent = fs.readFileSync(statePath, 'utf8');
      state = parseFrontmatter(currentContent) || {};
      body = getMarkdownBody(currentContent);
    }
  } catch (err) {
    process.stderr.write(`[Motif] Warning: could not read state: ${err.message}\n`);
  }

  // Apply screen status updates
  if (Array.isArray(state.screens)) {
    for (const update of updates) {
      const screen = state.screens.find(s => s && s.name === update.name);
      if (screen) {
        screen.status = update.status;
      }
    }
  }

  // Apply scalar updates
  if (screens_composed !== undefined) state.screens_composed = screens_composed;
  if (phase) state.phase = phase;
  state.updated = new Date().toISOString().split('T')[0];
  state.last_command = '/motif:compose';
  state.last_outcome = 'batch';

  // Single atomic write
  const frontmatter = serializeFrontmatter(state);
  atomicWrite(statePath, frontmatter + '\n' + body);
  process.stdout.write(JSON.stringify({ ok: true, updated: updates.length }) + '\n');
}
```

### Example 2: Argument Parsing in compose-screen.md

```markdown
## Step 1: Determine Screen(s)

Parse `$ARGUMENTS`:

**Case A -- No arguments:**
Single-screen mode. Read STATE.md screens, find next `planned`. If none remain, suggest `/motif:review all`.

**Case B -- Single screen name (no spaces, no flags):**
Single-screen mode for that screen name.

**Case C -- Multiple screen names or --all flag:**
BATCH MODE.

If `$ARGUMENTS` contains `--all`:
  - Read STATE.md screens array
  - Collect all screens with status `planned` or `failed`
  - If none found: "No screens with status 'planned' or 'failed'. Nothing to compose."

If `$ARGUMENTS` contains multiple space-separated words (excluding flags):
  - Split on spaces, filter out `--concurrency` and its value, filter out `--all`
  - The remaining words are screen names
  - Validate each against STATE.md screens array
  - Reject unrecognized names with fuzzy suggestion

Parse `--concurrency N` if present (default: 3, max: 5).

Set BATCH_MODE = true, SCREEN_LIST = [...], CONCURRENCY = N.
```

### Example 3: Wave Dispatch Logic in compose-screen.md

```markdown
## Step 3b: Batch Wave Dispatch (BATCH MODE only)

Calculate waves:
- WAVE_COUNT = ceil(SCREEN_LIST.length / CONCURRENCY)
- WAVES = split SCREEN_LIST into chunks of CONCURRENCY size

For each wave (wave_index from 0 to WAVE_COUNT-1):

  **Report wave start:**
  "Starting wave {wave_index + 1}/{WAVE_COUNT}: {comma-separated screen names}"

  **Spawn Task() agents -- ALL in a single message:**
  For each screen in this wave, spawn one Task() using the SAME agent_spawn
  template from Step 3, but with this ADDITIONAL instruction prepended:

  ```
  ## BATCH MODE INSTRUCTIONS
  You are composing in batch mode (wave {wave_index + 1} of {WAVE_COUNT}).

  CRITICAL DIFFERENCES from single-screen mode:
  1. After validation, do NOT run `git commit`. Leave validated files staged.
     The orchestrator will commit your work.
  2. Do NOT modify tokens.css or COMPONENT-SPECS.md. If a token is missing,
     note it in SUMMARY.md under "## Missing Tokens" and use the closest
     existing alternative.
  3. Your SUMMARY.md "## Files Created" section MUST list every file with
     its full path. The orchestrator uses this list to stage files for commit.
  ```

  **Wait for all agents in wave to complete.**

  **Collect wave results:**
  For each screen in this wave:
    1. Check if `.planning/design/screens/{SCREEN_NAME}-SUMMARY.md` exists
    2. If exists: read ONLY the `## Validation` and `## Files Created` sections
    3. Classify: PASSED, WARNED, FAILED, or CRASHED (no summary)

  **Commit successful screens (sequentially):**
  For each screen with PASSED or WARNED status:
    1. Parse file paths from "## Files Created" section
    2. `git add {file1} {file2} ...` (explicit paths, never `git add .`)
    3. Also stage the SUMMARY.md and ANALYSIS.md for this screen
    4. `git commit -m "design(compose): implement {SCREEN_NAME} screen"`

  **Update STATE.md atomically:**
  Build JSON payload with all screen status changes from this wave.
  Run: `node .claude/get-motif/scripts/motif-state.js batch-update-screens '{...}'`

  **Report wave results:**
  "Wave {N} complete: login (OK), dashboard (OK), settings (FAILED - import cycle)"
```

### Example 4: Concurrency Argument Parsing

```markdown
## Concurrency Parsing

If `$ARGUMENTS` contains `--concurrency`:
  - Extract the number following `--concurrency` (e.g., `--concurrency 2` -> 2)
  - Validate: must be integer between 1 and 5
  - If invalid: WARN "Invalid concurrency value. Using default (3)."
  - If > 5: WARN "Concurrency capped at 5 to avoid rate limiting."

If not present: use default of 3.

Store as CONCURRENCY variable for wave calculation.
```

## State of the Art

| Old Approach (Single-Screen) | New Approach (Batch Mode) | What Changes |
|------------------------------|---------------------------|--------------|
| Subagent commits its own work | Orchestrator commits after wave | compose-screen.md Step F behavior conditional on batch flag |
| One `motif-state.js update` call per field | Single `batch-update-screens` call per wave | New command in motif-state.js |
| User runs `/motif:compose` N times | User runs `/motif:compose --all` once | Argument parsing in compose-screen.md Step 1 |
| No wave concept | Wave-based dispatch with configurable concurrency | New Step 3b in compose-screen.md |
| Composer can add tokens | Composer cannot modify shared files in batch | Batch prompt addendum |

## Detailed File Change Map

### File 1: `.claude/get-motif/workflows/compose-screen.md`

**Changes needed:**

1. **Step 1 (Determine Screen):** Expand to detect batch arguments (`--all`, multiple names, `--concurrency N`). Add screen name validation against STATE.md.

2. **New Step 1b (Batch Validation):** If BATCH_MODE, validate all screen names, report unrecognized ones, calculate waves, and display plan: "Composing 5 screens in 2 waves (concurrency: 3)."

3. **Step 3 (Spawn Composer Agent):** Add conditional batch-mode instructions to the agent_spawn prompt. The existing prompt stays identical for single-screen mode. Batch mode prepends the "BATCH MODE INSTRUCTIONS" block that suppresses git commit and tokens.css modification.

4. **New Step 3b (Batch Wave Dispatch):** The core batch orchestration loop. Only executes if BATCH_MODE is true.

5. **Step 4 (Collect Result):** Works unchanged for single-screen. For batch, result collection is embedded in Step 3b's wave loop.

6. **Step 4b (Auto-Run):** In batch mode, auto-run is offered ONCE after all waves complete, not per-screen.

7. **Step 5 (Update State):** In batch mode, state updates happen via `batch-update-screens` in Step 3b. The Final Step section is skipped (already handled by wave loop).

8. **Step 6 (Next Step):** In batch mode, replace with batch summary report showing all screens and their statuses.

9. **Lines 429-436 (Parallel Composition section):** Replace with reference to the new batch mode. The current text says parallel is only for explicit user request -- batch mode makes it the default for multi-screen.

### File 2: `.claude/get-motif/scripts/motif-state.js`

**Changes needed:**

1. **New function `cmdBatchUpdateScreens(jsonStr)`:** Accepts JSON with `updates` array (screen status changes) and optional scalar fields (`screens_composed`, `phase`). Single atomic read-modify-write.

2. **CLI switch case:** Add `case 'batch-update-screens':` to the existing switch block.

3. **Help text:** Update `cmdHelp()` to document the new command.

**Estimated size:** ~40 lines of new code. Zero changes to existing functions.

### File 3: `.claude/get-motif/agents/motif-screen-composer.md` -- NO CHANGES

The composer agent remains batch-agnostic. Batch behavior is injected via the Task() prompt, not the agent definition. This is critical for maintaining the single-screen compose path.

### File 4: `scripts/compose-validator.js` -- NO CHANGES

Validation runs per-screen inside each subagent. No batch awareness needed. The existing `--screen` and `--files` arguments work identically in batch mode.

## Open Questions

1. **What happens if the orchestrator crashes mid-batch after committing some screens?**
   - What we know: STATE.md is updated atomically after each wave via `batch-update-screens`. Committed screens stay committed. Uncommitted screens from the interrupted wave have files on disk but no commit.
   - What's unclear: Should the orchestrator detect a previously interrupted batch on startup (via batch_id in STATE.md)?
   - Recommendation: For Phase 29, do not implement batch resume. If the batch is interrupted, the user re-runs `/motif:compose --all` which picks up screens with status `planned` or `failed`. The `batch-update-screens` command ensures STATE.md is always consistent after each completed wave. Batch resume is a Phase 32 (Reliability Enhancements) concern.

2. **Should `--concurrency` be a command argument or STATE.md frontmatter?**
   - What we know: The roadmap says "command argument or config" (BATCH-05). The milestone research recommends STATE.md frontmatter.
   - What's unclear: Whether both are needed.
   - Recommendation: Support `--concurrency N` as a command argument (takes precedence) with fallback to `batch_concurrency` in STATE.md frontmatter (persistent default). Command argument is the primary interface for Phase 29; frontmatter persistence can be added trivially later.

3. **Should the orchestrator validate that all screens in a wave write to non-overlapping file paths before spawning?**
   - What we know: Platform-scoped paths (Next.js App Router routes, Vite page routes) provide natural isolation. Shared component duplication is the risk scenario.
   - What's unclear: Whether pre-spawn validation is worth the orchestrator context cost.
   - Recommendation: Do NOT pre-validate. The compose-validator.js already catches naming conflicts (brownfield only). Cross-screen component duplication is a quality issue, not a crash issue -- defer to Phase 32 (compose-validator cross-screen naming conflict detection, as noted in the roadmap).

4. **How does the `--all` flag interact with screens that have status `failed` from a previous batch?**
   - What we know: The milestone research says only `planned` screens are eligible. But failed screens are screens the user wants composed.
   - Recommendation: `--all` composes screens with status `planned` OR `failed`. This enables retry without the user manually listing failed screens. Document this clearly in the workflow.

## Sources

### Primary (HIGH confidence)
- `compose-screen.md` workflow (codebase) -- complete orchestrator flow, Steps 1-6, agent_spawn template, parallel composition section (lines 429-436)
- `motif-state.js` implementation (codebase) -- `parseFrontmatter()`, `serializeFrontmatter()`, `atomicWrite()`, `cmdUpdate()` patterns, CLI switch structure
- `compose-validator.js` implementation (codebase) -- argument parsing (`--screen`, `--files`), exit codes, per-screen scope
- `motif-screen-composer.md` agent spec (codebase) -- context loading profile, output format expectations, self-review checklist
- `review.md` workflow (codebase) -- existing multi-screen pattern (`all` argument), sequential agent spawning per screen
- `.planning/research/SUMMARY.md` (codebase) -- milestone-level architecture decisions, commit strategy, state update strategy
- `.planning/research/ARCHITECTURE.md` (codebase) -- wave-based dispatch pattern, data flow, anti-patterns
- `.planning/research/PITFALLS.md` (codebase) -- git index.lock, STATE.md race, rate limit cascade, context bloat
- `.planning/research/STACK.md` (codebase) -- technology decisions, explicitly not adding items

### Secondary (MEDIUM confidence)
- Claude Code parallel Task() documentation -- up to 10 concurrent calls per message, subagent isolation
- Community rate limit observations -- practical safe limit of 3-5 concurrent Opus agents

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all technologies are existing codebase components with zero new dependencies
- Architecture: HIGH -- patterns derived from direct codebase analysis of compose-screen.md, review.md, and motif-state.js
- Pitfalls: HIGH -- git index.lock and STATE.md race conditions are verified against git documentation and Node.js I/O patterns
- Code examples: HIGH -- based on existing motif-state.js function patterns and compose-screen.md prompt structure

**Research date:** 2026-03-24
**Valid until:** 2026-04-23 (stable -- no external dependency changes expected)
