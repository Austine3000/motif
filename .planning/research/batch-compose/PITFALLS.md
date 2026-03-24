# Domain Pitfalls: Batch Parallel Screen Composition

**Domain:** Adding batch multi-screen parallel composition to Motif's existing single-screen sequential composition system
**Researched:** 2026-03-24
**Confidence:** HIGH for git and state concurrency pitfalls (verified against codebase analysis, git documentation, Node.js concurrency patterns); MEDIUM for orchestrator context pressure (based on Claude Code subagent architecture patterns)

---

## Critical Pitfalls

Mistakes that cause data loss, corrupted state, or require manual recovery. Any of these can make batch compose worse than the existing sequential approach -- a batch feature that loses work is worse than no batch feature at all.

---

### Pitfall 1: Git Merge Conflicts from Parallel Atomic Commits

**What goes wrong:** Motif spawns 5 composer agents in parallel via `Task()`. Each agent creates files, stages them with `git add`, and commits with `git commit -m "design(compose): implement {screen} screen"`. Two agents finish at nearly the same time. Agent A commits successfully. Agent B's `git commit` fails because the HEAD has moved since B staged its files. Or worse: both agents modify `tokens.css` (adding a missing token) and one commit silently overwrites the other's token addition.

**Why it happens:** The current system assumes sequential execution. Each agent's commit flow (stage -> validate -> commit) is designed for an exclusive lock on the git index. Git's index (`.git/index`) is a single shared file. When two `git add` commands run concurrently, they race on the index lock file (`.git/index.lock`). One will get `fatal: Unable to create '.git/index.lock': File exists`. The current compose workflow has no retry logic because it never needed one -- sequential composition means no contention.

The existing compose-screen workflow explicitly instructs agents to: (1) stage files with `git add`, (2) run validation, (3) commit atomically. Steps 1 and 3 both acquire the git index lock. With parallel agents, this sequence becomes a critical section with no mutual exclusion.

**Consequences:**
- Agent commits fail with `index.lock` errors, causing the agent to report failure even though the files were generated correctly
- If two agents both add tokens to `tokens.css`, the second commit overwrites the first agent's additions (last-write-wins on a shared file)
- Partial commit state: some screens committed, others not, STATE.md does not reflect reality
- User sees confusing mix of "composed" and "failed" screens with no clear explanation

**Prevention:**
- **Option A (Recommended): Defer all commits to the orchestrator.** Agents write files and create summaries but do NOT stage or commit. The orchestrator collects results, stages all files from all successful agents in one batch, runs validation once, and makes a single atomic commit: `design(compose): batch compose 5 screens`. This eliminates git contention entirely.
- **Option B: Sequential commit queue.** Agents write files in parallel but signal completion to the orchestrator. The orchestrator commits each agent's files sequentially after all agents finish. This preserves per-screen commits but eliminates parallelism in the commit phase.
- **Never Option C: Let agents commit in parallel.** This is the naive approach and will fail under contention.
- For shared files like `tokens.css`: agents must NOT modify shared files during batch composition. If a token is missing, the agent should note it in SUMMARY.md and use a fallback. The orchestrator handles token additions after all agents complete.

**Detection:** `fatal: Unable to create '.git/index.lock'` in agent output. Missing token additions in `tokens.css`. Screen files exist on disk but are not committed.

**Phase:** Batch orchestration core -- this is the first problem to solve. The commit strategy must be decided before any parallel spawning is implemented.

---

### Pitfall 2: STATE.md Concurrent Write Corruption

**What goes wrong:** The orchestrator updates STATE.md after each screen completes (Step 5 of the current workflow: set screen status to `composed`, update `screens_composed` count). With parallel agents, multiple completion handlers fire within seconds. The orchestrator reads STATE.md, updates the `screens_composed` field from 2 to 3, and writes it back. Meanwhile another completion handler read the same STATE.md (still showing 2), updates to 3 for a different screen, and writes it back. The second write overwrites the first. Result: `screens_composed` says 3 but 4 screens were actually composed. One screen's status is lost.

**Why it happens:** The `motif-state.js` script uses `atomicWrite()` (write to `.tmp`, then `rename`). This prevents partial writes but does NOT prevent read-modify-write races. The `cmdUpdate` function reads the current file, parses frontmatter, updates one field, and writes the whole file back. If two `cmdUpdate` calls overlap, the second read happens before the first write, and the second write clobbers the first update.

The current `motif-state.js` has no locking mechanism -- no file locks, no mutex, no queue. This is perfectly fine for sequential composition where only one state update happens at a time. It is a data corruption bug for parallel composition.

**Consequences:**
- Screen status table becomes inconsistent: screens show as `planned` when they are actually `composed`
- `screens_composed` counter is wrong, causing the orchestrator to offer to compose already-composed screens
- State recovery (`motif-state.js recover`) may produce different results than the corrupted STATE.md
- User loses trust in the progress tracking system

**Prevention:**
- **Batch state update (recommended):** Do NOT update STATE.md after each agent completes. Instead, the orchestrator collects all results, then performs a SINGLE state update after all agents finish (or fail). One read, one write, no race.
- **Lock file approach (if incremental updates are needed):** Add a `.planning/design/STATE.md.lock` file. Before reading STATE.md, create the lock file. After writing, delete it. If lock exists, wait and retry. Use `fs.writeFileSync(lockPath, '', { flag: 'wx' })` which fails atomically if the file already exists.
- **In-memory state accumulator:** The orchestrator keeps an in-memory copy of state. Agent completion handlers update the in-memory copy (single-threaded in Node.js event loop, no race). After all agents complete, write once.

**Detection:** `screens_composed` count does not match the number of SUMMARY.md files. Screen status table shows `planned` for screens that have committed files.

**Phase:** Batch orchestration core -- state management strategy must be decided alongside the commit strategy (Pitfall 1). They are coupled: if you batch commits, you should also batch state updates.

---

### Pitfall 3: Partial Batch Failure with No Recovery Path

**What goes wrong:** The user requests batch compose of 5 screens. Three succeed, one fails validation (import cycle detected), and one agent crashes (context window exhausted, rate limit hit, or timeout). The orchestrator now has an inconsistent batch: some screens have files on disk, some have commits, some have neither. The user asks "what happened?" and the orchestrator cannot give a clear answer because it did not track per-agent outcomes systematically.

Worse: the user runs `/motif:compose` again. The orchestrator reads STATE.md, sees 3 composed screens and 2 planned screens. It offers to compose the 2 remaining screens. But one of the "composed" screens was actually committed with validation warnings that the user never saw. The other failed screen has files on disk but no commit and no SUMMARY.md.

**Why it happens:** The current single-screen workflow has a simple success/failure model: either the agent created a SUMMARY.md and committed, or it did not. The orchestrator checks for SUMMARY.md (Step 4) and updates state (Step 5). There is no concept of partial success because there is only one screen.

Batch composition introduces a results matrix: N screens x {success, validation_fail, agent_crash, timeout} = complex state. The current workflow has no data structure or reporting mechanism for this matrix.

**Consequences:**
- User does not know which screens succeeded and which failed
- Failed screens leave orphaned files on disk that confuse subsequent compose runs
- Validation warnings from successful screens are buried in parallel output
- Re-running compose for failed screens may produce different results if shared context changed (e.g., new SUMMARY.md files from the successful screens now influence the retry)

**Prevention:**
- Create a batch result manifest: `.planning/design/screens/BATCH-RESULT.md` that records:
  ```
  # Batch Compose Result
  **Requested:** 5 screens
  **Succeeded:** 3
  **Failed:** 2
  **Timestamp:** 2026-03-24T10:30:00Z

  | Screen | Status | Detail |
  |--------|--------|--------|
  | dashboard | composed | Committed: abc1234 |
  | settings | composed | Committed: abc1234 (warnings: 1 missing prop) |
  | profile | composed | Committed: abc1234 |
  | analytics | validation_fail | Import cycle: Chart -> DataTable -> Chart |
  | onboarding | agent_crash | Context window exhausted at 95% |
  ```
- **Clean up on failure:** If using single-batch commit (Pitfall 1 Option A), failed agents' files are simply not staged. If using per-screen commits, failed screens' unstaged files should be moved to `.planning/design/screens/{screen}/_failed/` rather than left in the project tree.
- **Retry command:** Support `/motif:compose --retry-failed` that reads the batch result and re-attempts only failed screens.
- **Never silently skip failures.** Always surface the full results matrix to the user, even if 4/5 succeeded. The one failure matters.

**Detection:** SUMMARY.md exists for some screens but not others. Files on disk that are not committed. STATE.md shows fewer composed screens than expected.

**Phase:** Batch orchestration core -- the results manifest and failure handling must be designed before batch compose ships. This is not a "v2" feature -- it is table stakes for a batch operation.

---

## Moderate Pitfalls

Issues that degrade the batch experience or cause confusion but do not lose data.

---

### Pitfall 4: Orchestrator Context Window Pressure

**What goes wrong:** The current orchestrator is designed to be "thin" -- it reads only file paths, not contents. But with batch composition, the orchestrator must: (1) determine which screens to compose, (2) assemble context profiles for each, (3) spawn N agents, (4) collect N results by reading N SUMMARY.md files, (5) update state, (6) report to the user. Steps 1-3 happen before agents run. Steps 4-6 happen after. The orchestrator reads 5 SUMMARY.md files, each containing component lists, token references, validation results, and file manifests. At 200-400 tokens per summary, 5 summaries add 1000-2000 tokens to the orchestrator's context. Combined with the workflow instructions themselves (~3000 tokens), the gate check, state reading, and user interaction, the orchestrator approaches 50% context usage -- the threshold where it is supposed to suggest `/clear`.

With 8-10 screens in a batch, the orchestrator risks exceeding useful context before it finishes reporting results.

**Why it happens:** The "orchestrator stays at <=30% context" rule (from CLAUDE.md) was designed for single-screen composition where the orchestrator reads exactly one SUMMARY.md. Batch composition multiplies the post-completion work by N screens. The orchestrator instructions are ~3000 tokens. Each SUMMARY.md is ~300 tokens. The state update commands are ~200 tokens. For 8 screens: 3000 + (8 x 300) + 200 = 5600 tokens just for orchestrator overhead, before any user interaction.

**Consequences:**
- Orchestrator loses coherence when reporting results for later screens in a large batch
- Quality of state updates degrades as context fills
- User may need to `/clear` mid-batch, losing the results summary

**Prevention:**
- **Cap batch size at 5 screens.** This is not arbitrary -- it keeps the orchestrator under the 30% context budget. For projects with 8+ screens, run two batches.
- **Compress SUMMARY.md reading.** Instead of reading full summaries, extract only the status line (PASSED/FAILED/WARN) and file count. The user can read full summaries separately.
- **Write the batch result manifest (Pitfall 3) early.** The manifest is the persistent record. The orchestrator's in-context summary is ephemeral. If the orchestrator must `/clear`, the manifest survives.
- **Pre-calculate context budget:** Before spawning, estimate: `base_overhead + (N * summary_size) + state_update_size`. If this exceeds 30% of context, reduce N or warn the user.

**Detection:** Orchestrator suggesting `/clear` before finishing result reporting. Inconsistent or incomplete state updates for later screens in a batch. Orchestrator "forgetting" which screens were in the batch.

**Phase:** Batch orchestration core -- batch size limits should be enforced from the start. Easier to raise limits later than to debug context exhaustion.

---

### Pitfall 5: Cross-Screen Dependency Breaks Parallel Composition

**What goes wrong:** The user requests batch compose of `dashboard`, `settings`, and `profile`. The dashboard screen creates a new shared component (`StatCard.tsx`). The settings screen also needs a stat card for usage metrics. In sequential composition, the settings agent would see `dashboard-SUMMARY.md` listing `StatCard.tsx` as a newly created component and import it. In parallel composition, the settings agent starts before dashboard finishes -- it has no SUMMARY.md to reference, so it generates its own `StatCard.tsx`. Now there are two conflicting `StatCard.tsx` files.

**Why it happens:** The compose workflow loads "the most recent 2-3 SUMMARY.md files" as optional context for cross-screen consistency. This creates a temporal dependency: Screen B benefits from Screen A's summary. In sequential composition, this works naturally. In parallel composition, no screen's summary exists when the other screens start.

The current "Parallel Composition" section in the workflow acknowledges this: "only do this if the screens are independent (don't share unique components)." But the determination of "independent" is made by the orchestrator, which does not have component-level knowledge before composition begins.

**Consequences:**
- Duplicate component files with different implementations
- Naming conflicts caught by compose-validator (if both files have the same path)
- Subtle inconsistencies if the duplicate components have slightly different styling or behavior
- The batch commit (Pitfall 1 Option A) will include both versions, one overwriting the other

**Prevention:**
- **Pre-composition dependency analysis:** Before spawning parallel agents, scan the screen list for likely shared components. Screens that share a domain area (e.g., `dashboard` and `analytics` both deal with data visualization) are likely to generate overlapping components. Flag these as sequential, not parallel.
- **Shared component pre-generation:** If the design system COMPONENT-SPECS.md defines shared components that multiple screens will use, generate them BEFORE spawning parallel composers. Pass the pre-generated component paths to all agents.
- **Simple heuristic for independence:** Screens are "independent enough" for parallel composition if they belong to different user flows (e.g., `onboarding` and `settings` are unlikely to share unique components). Screens in the same flow (e.g., `checkout` and `order-confirmation`) should be sequential.
- **Post-composition deduplication:** After all agents complete, scan generated files for duplicate component names. If found, keep the first occurrence and update imports in the second screen to reference the shared component. This is a cleanup step, not prevention, but it catches what the heuristics miss.

**Detection:** compose-validator reports naming conflicts. Two SUMMARY.md files list the same component name in "New (generated by Motif)" sections. `git status` shows both files as untracked.

**Phase:** Batch orchestration core -- the dependency analysis should be part of the "determine which screens to batch" step, before spawning.

---

### Pitfall 6: Progress Reporting Becomes Misleading

**What goes wrong:** In sequential composition, the user sees clear progress: "Composing dashboard... done. Composing settings... done. 2/5 complete." In batch composition, the user launches the batch and... silence. Five agents are running, but the orchestrator has no way to report intermediate progress because `Task()` does not stream partial results. After 2-5 minutes, all results arrive at once (or some arrive and others time out). The user has no idea if the system is working or stuck.

Alternatively, the orchestrator tries to report progress by polling for SUMMARY.md files in a loop. This wastes orchestrator context on polling logic and may report false negatives (a SUMMARY.md does not exist yet because the agent is still writing it, not because it failed).

**Why it happens:** `Task()` in Claude Code is a fire-and-forget API. The orchestrator spawns the task and gets the result when the task completes. There is no progress callback, no streaming, and no partial result mechanism. The orchestrator cannot observe agent progress without reading files that the agent may be in the middle of writing.

The current single-screen workflow does not have a progress problem because there is only one task, and the user knows it is running. With 5 parallel tasks, the silence is multiplied and anxiety-inducing.

**Consequences:**
- User thinks the system is frozen and interrupts (Ctrl+C), killing in-progress agents
- User re-runs the command, spawning duplicate agents for the same screens
- Orchestrator's polling (if attempted) wastes context and may produce incorrect intermediate reports

**Prevention:**
- **Set expectations upfront.** Before spawning, tell the user: "Composing 5 screens in parallel. This typically takes 2-4 minutes. You will see results when all screens complete. Do not interrupt."
- **Estimated completion time.** Based on historical single-screen compose times (if tracked), multiply by the batch size and divide by concurrency: "Estimated: ~3 minutes for 5 screens."
- **Do NOT poll for intermediate progress.** It wastes context and produces unreliable results. Accept that batch composition is not interactive.
- **Quick acknowledgment after spawn.** Immediately after spawning all agents, output: "5 composer agents spawned: dashboard, settings, profile, analytics, onboarding. Waiting for completion..." This confirms the batch started.
- **Consider sequential-with-speed as an alternative to full parallelism.** Instead of spawning all agents at once, spawn 2-3 at a time (concurrent-but-bounded). Report results as each sub-batch completes. This gives the user intermediate feedback without the complexity of fully parallel state management.

**Detection:** User interrupts batch compose midway. User re-runs `/motif:compose` while agents are still running. No output from the orchestrator for more than 3 minutes.

**Phase:** UX and reporting layer -- this is a polish concern but should be addressed in the initial batch implementation to prevent user-facing confusion.

---

### Pitfall 7: Rate Limits Hit When Spawning Multiple Agents

**What goes wrong:** The orchestrator spawns 5 `Task()` agents simultaneously. Each agent reads 5-6 context files (PROJECT.md, tokens.css, COMPONENT-SPECS.md, DESIGN-RESEARCH.md, ICON-CATALOG.md, overlay). Each agent then generates 5-15 component files, runs validation, and commits. The combined API usage from 5 concurrent agents exceeds the user's rate limit. Agents start failing with rate limit errors partway through composition. Some screens are half-generated: the analysis file exists but no component code.

**Why it happens:** Claude Code rate limits are per-user, not per-agent. Five parallel agents consume API tokens at 5x the rate of one agent. A single screen composition might use 30,000-50,000 tokens (input + output). Five parallel compositions use 150,000-250,000 tokens in a burst. Users on lower-tier plans may hit rate limits within the first minute of batch composition.

The current workflow's note ("they understand the rate limit implications") is insufficient -- users do not know their token consumption per screen.

**Consequences:**
- Agents fail mid-composition, leaving partial files
- Rate limit errors are cryptic and do not clearly indicate "you ran too many screens at once"
- User blames Motif for the failure, not the rate limit
- Partial compositions are harder to recover from than complete failures

**Prevention:**
- **Default concurrency of 2-3, not unlimited.** Even if 5 screens are requested, spawn only 2-3 at a time. When one completes, start the next. This bounds API consumption rate.
- **Expose concurrency as a flag:** `/motif:compose --batch --concurrency 3`. Default to 2 for safety. Power users can increase.
- **Detect rate limit errors in agent output.** If an agent fails with a rate limit error, do not spawn more agents. Wait, then retry.
- **Estimate cost before spawning.** "Batch composing 5 screens will use approximately 200K tokens. Your plan allows 500K/hour. Proceed? (y/n)"

**Detection:** Agent failures with "rate limit" or "429" in error messages. Partial screen files (analysis exists, no components). Multiple agents failing simultaneously.

**Phase:** Batch orchestration core -- concurrency limits are infrastructure, not UX polish. Must be in the first implementation.

---

## Minor Pitfalls

Issues that cause friction but have straightforward fixes.

---

### Pitfall 8: Compose Validator Runs Fail on Parallel File Sets

**What goes wrong:** The `compose-validator.js` script checks for import cycles and naming conflicts by reading the list of generated files passed via `--files`. In sequential composition, each validator run sees only the current screen's files. In batch composition with a single batch commit (Pitfall 1 Option A), the validator should run on ALL files from ALL screens at once to catch cross-screen import cycles and naming conflicts. But the validator was designed for single-screen file sets -- running it with 30+ files from 5 screens may produce false positives (it flags cross-screen imports as "cycles" because it does not understand screen boundaries).

**Prevention:**
- Run the validator per-screen even in batch mode (each screen's files are independent). This preserves the current behavior.
- Add a second validation pass on the combined file set to catch cross-screen conflicts. This is the "naming conflict" check that matters for batch: two screens generating the same component name.
- Update `compose-validator.js` to accept a `--batch` flag that groups files by screen prefix and validates each group independently, then runs cross-group conflict detection.

**Detection:** Validator reports false positive import cycles between screens that legitimately import shared components. Or: validator misses cross-screen naming conflicts because it ran per-screen.

**Phase:** Validation extension -- can be built after core batch orchestration works, but before batch compose ships to users.

---

### Pitfall 9: Auto-Run After Batch Compose Triggers on Partial Results

**What goes wrong:** The current post-compose flow (Step 4b) offers auto-run after successful composition. In batch mode, auto-run should only be offered after ALL screens in the batch complete successfully. If the orchestrator offers auto-run after the first screen completes (because it processes results as they arrive), the user sees a half-built app. Or if 3/5 screens succeed and the orchestrator offers auto-run, the app may crash because a screen references components from a failed screen.

**Prevention:**
- **Gate auto-run on full batch completion.** Only offer auto-run when all screens in the batch have a definitive status (composed or failed). Never offer auto-run before the batch is fully resolved.
- If any screen in the batch failed, warn before auto-run: "2 screens failed composition. The app may show errors for those routes. Run auto-run anyway? (y/n)"
- Auto-run offer should reference the batch result manifest (Pitfall 3) so the user sees the full picture before deciding.

**Detection:** Auto-run offered before all screens complete. App crashes on routes for failed screens. User confusion about which screens are ready.

**Phase:** Auto-run integration -- this is a gating check, not new auto-run logic. Add it when wiring batch compose to the existing auto-run flow.

---

### Pitfall 10: Brownfield Token Conflict on Shared `tokens.css`

**What goes wrong:** Two parallel agents both discover they need a token that does not exist in `tokens.css`. Agent A adds `--color-warning-100: #FFF3CD;` and Agent B adds `--color-info-100: #D1ECF1;`. If using sequential commits (Pitfall 1 Option B), the second commit's `tokens.css` may not include the first agent's addition (because the agent read the file before the first commit). If using batch commit (Pitfall 1 Option A), both agents wrote their own version of `tokens.css`, and the orchestrator must merge them.

**Prevention:**
- **Forbid agents from modifying `tokens.css` during batch composition.** This is the cleanest solution. If a token is missing, the agent should: (1) use the closest existing token, (2) note the missing token in SUMMARY.md under a "Token Gaps" section. After the batch completes, the orchestrator adds all missing tokens in a single commit.
- This is already partially supported by the existing rules: "If you need a token that doesn't exist, create it in tokens.css first and commit separately." In batch mode, the "commit separately" step is the conflict point. Changing the rule to "note it, don't create it" during batch mode is the safe path.

**Detection:** Multiple agents modifying `tokens.css` in the same batch. Merge conflicts on `tokens.css`. Missing tokens in the final `tokens.css` that one agent added but another agent's write overwrote.

**Phase:** Batch orchestration core -- the "no shared file modification" rule must be communicated to agents in the batch prompt.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|---|---|---|---|
| **Batch orchestration core** | Git index.lock contention from parallel commits (Pitfall 1) | Critical | Defer all commits to orchestrator; single batch commit |
| **Batch orchestration core** | STATE.md read-modify-write race (Pitfall 2) | Critical | Batch state update after all agents complete |
| **Batch orchestration core** | No recovery path for partial failures (Pitfall 3) | Critical | Batch result manifest with per-screen status |
| **Batch orchestration core** | Rate limit exhaustion from concurrent agents (Pitfall 7) | Moderate | Default concurrency cap of 2-3; expose as flag |
| **Batch orchestration core** | Cross-screen component duplication (Pitfall 5) | Moderate | Pre-composition dependency analysis; sequential for related screens |
| **Batch orchestration core** | Shared file (tokens.css) concurrent modification (Pitfall 10) | Moderate | Forbid shared file writes during batch; note gaps in SUMMARY.md |
| **Orchestrator design** | Context window exhaustion from N summaries (Pitfall 4) | Moderate | Cap batch size at 5; compress summary reading |
| **UX and reporting** | Silent batch execution with no progress feedback (Pitfall 6) | Moderate | Set expectations upfront; bounded concurrency for intermediate feedback |
| **Validation extension** | Validator false positives on cross-screen file sets (Pitfall 8) | Minor | Per-screen validation + cross-screen conflict pass |
| **Auto-run integration** | Auto-run offered before batch fully resolves (Pitfall 9) | Minor | Gate auto-run on full batch completion |

---

## Integration Risk Summary

The biggest risk in adding batch compose is not any single pitfall -- it is the interaction between them. Pitfalls 1, 2, and 3 are tightly coupled:

1. **Commit strategy** (Pitfall 1) determines whether you need git locking
2. **State update strategy** (Pitfall 2) must align with the commit strategy
3. **Failure handling** (Pitfall 3) depends on both

If you solve Pitfall 1 with "batch commit by orchestrator," then Pitfall 2 is also solved (batch state update) and Pitfall 3 becomes simpler (uncommitted files for failed screens are just not staged). This is why Option A in Pitfall 1 is recommended: it collapses three critical pitfalls into one architectural decision.

The second cluster is Pitfalls 5 and 10 (shared resources): screens that create shared components or modify shared files. The solution for both is the same: batch composition should be treated as a read-only operation on shared resources, with the orchestrator handling all shared-resource writes after agents complete.

---

## Sources

- Motif codebase analysis: `compose-screen.md` workflow, `motif-state.js` state management, `compose-validator.js` validation, `motif-screen-composer.md` agent spec (HIGH confidence -- direct code review)
- [Git documentation: index.lock mechanism](https://git-scm.com/docs/git-merge) -- concurrent git operations and lock file behavior (HIGH confidence)
- [Node.js race conditions in file operations](https://nodejsdesignpatterns.com/blog/node-js-race-conditions/) -- read-modify-write races, fs.writeFileSync atomicity limitations (HIGH confidence)
- [Clash: Avoid merge conflicts for parallel AI coding agents](https://github.com/clash-sh/clash) -- git worktree approach for parallel agents, 3.1% conflict rate with task isolation (MEDIUM confidence)
- [Claude Code worktree support for parallel agents](https://www.threads.com/@boris_cherny/post/DVAAnexgRUj/) -- built-in worktree support, per-agent isolation (MEDIUM confidence)
- [Git worktrees with Claude Code](https://docs.bswen.com/blog/2026-03-21-git-worktrees-parallel-claude-code/) -- parallel agent patterns, conflict rates, port conflicts (MEDIUM confidence)
- [Error handling in distributed systems (Temporal)](https://temporal.io/blog/error-handling-in-distributed-systems) -- partial failure patterns, fan-out/fan-in orchestration (MEDIUM confidence)
- [AI Agent Orchestration Patterns (Microsoft)](https://learn.microsoft.com/en-us/azure/architecture/ai-ml/guide/ai-agent-design-patterns) -- concurrent agent patterns, timeout/retry mechanisms, graceful degradation (MEDIUM confidence)

---
*Pitfalls research for: Batch parallel screen composition*
*Researched: 2026-03-24*
