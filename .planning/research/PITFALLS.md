# Domain Pitfalls: Batch Multi-Screen Composition

**Domain:** AI-powered design system tooling -- batch orchestration
**Researched:** 2026-03-24

## Critical Pitfalls

Mistakes that cause rewrites or major issues.

### Pitfall 1: Rate Limit Cascade Failure

**What goes wrong:** Spawning too many parallel Opus-class Task() agents (5+) triggers API rate limits. When rate-limited, all agents in the wave fail simultaneously, wasting all in-progress work.

**Why it happens:** Claude Code's concurrent request cap is independent of token utilization. Three Opus agents each making tool calls can exceed the concurrent request limit even with plenty of token budget remaining.

**Consequences:** Entire wave fails. User must retry all screens in that wave. Context window may be partially consumed by the failed attempt, reducing available space for retry.

**Prevention:** Default concurrency of 3 agents per wave. Never exceed 5. Document concurrency setting so power users on higher API tiers can increase.

**Detection:** Wave takes abnormally long, then all screens report failure simultaneously. Error messages mention rate limits or API errors.

### Pitfall 2: Orchestrator Context Exhaustion

**What goes wrong:** The orchestrator (batch-compose.md) reads too much data between waves -- full SUMMARY.md files, git diffs, validation output -- and runs out of context before completing all waves.

**Why it happens:** Each wave requires reading N SUMMARY.md files (each ~50-80 lines), updating STATE.md, and reporting progress. With 4+ waves, the orchestrator accumulates 1000+ lines of results.

**Consequences:** Later waves produce degraded output or orchestrator hits context limit and stops mid-batch.

**Prevention:**
1. Read ONLY the Validation section of each SUMMARY.md (status: PASSED/FAILED), not the full file
2. Update STATE.md via motif-state.js CLI (short command, small output)
3. Keep wave reports to 2-3 lines per screen
4. If context exceeds 50% after a wave, warn user to /clear and resume (batch state persists in STATE.md)

**Detection:** Monitor orchestrator context usage. If approaching 50% after wave 2, the batch should pause and suggest /clear + resume.

### Pitfall 3: Git Merge Conflicts Between Parallel Composers

**What goes wrong:** Two parallel composers in the same wave create files at the same path, or both modify the same file (e.g., tokens.css, a shared component).

**Why it happens:** Screen compositions for related screens (e.g., "dashboard" and "analytics") might both create a shared component like `StatCard.tsx` at the same path.

**Consequences:** Second composer's git commit fails due to conflict. Screen marked as failed even though code was generated correctly.

**Prevention:**
1. Each composer's files should be scoped to screen-specific paths (existing compose-screen.md already places files in screen-specific directories or route-specific paths)
2. For platform compositions (Next.js App Router), route paths are naturally isolated (`src/app/dashboard/` vs `src/app/analytics/`)
3. If two screens need the same component, the first to create it wins; the second should import it (existing COMPONENT-GAP.md pattern)

**Detection:** Git commit failure in a composer's Step F (validate and commit). SUMMARY.md will show `Validation: FAILED` with git error context.

## Moderate Pitfalls

### Pitfall 1: Cross-Screen Inconsistency in Same Wave

**What goes wrong:** Screens composed in the same wave cannot reference each other's SUMMARY.md files (they don't exist yet). This removes the cross-screen consistency signal.

**Prevention:** The orchestrator should order screens so that foundational screens (layout, navigation, landing) are in wave 1. Later waves can reference wave 1's SUMMARY.md files for consistency. Within a wave, composers rely on shared design system (tokens.css, COMPONENT-SPECS.md) for consistency -- which is the primary consistency mechanism anyway.

### Pitfall 2: Partial Batch State After /clear

**What goes wrong:** User runs /clear mid-batch. STATE.md frontmatter persists (batch_id, batch_completed, etc.) but the orchestrator loses its in-memory state (which wave it was on, which screens were in each wave).

**Prevention:** The orchestrator should be stateless between waves. When resuming after /clear, it re-reads STATE.md, identifies screens with `planned` or `failed` status, and rebuilds the wave plan from scratch. The batch_id field lets it detect it is resuming a previous batch.

### Pitfall 3: Auto-Review Consuming Remaining Rate Budget

**What goes wrong:** Batch compose uses significant API budget. User accepts auto-review offer, which spawns more Opus agents, and hits rate limits during review.

**Prevention:** Report estimated review cost before offering: "6 screens to review (estimated 6 reviewer agents). Proceed?" If the batch had rate limit issues, explicitly warn: "Batch had rate limit issues. Consider waiting before reviewing."

### Pitfall 4: Large Project Git History Pollution

**What goes wrong:** A 6-screen batch creates 6 individual commits (one per screen). With compose + review + fix cycles, a single batch run can create 18+ commits.

**Prevention:** Each commit is atomic and correctly attributed (existing pattern). Offer an optional squash at the end: "Batch created 6 compose commits. Squash into one? (yes/no)". Default: no squash (preserves per-screen git blame).

## Minor Pitfalls

### Pitfall 1: Screen Name Typo in Batch Args

**What goes wrong:** User types `/motif:batch-compose login dashbord settings` (typo in "dashboard"). Orchestrator cannot find "dashbord" in STATE.md screen list.

**Prevention:** Validate all screen names against STATE.md screen list before starting any waves. Report unrecognized names and ask for confirmation before proceeding with valid names only.

### Pitfall 2: Stale Context Files

**What goes wrong:** Batch starts with wave 1. While wave 1 is running, tokens.css or COMPONENT-SPECS.md do not exist yet (user skipped /motif:system).

**Prevention:** Existing gate check in compose-screen.md already warns about missing prerequisites. The batch orchestrator runs these checks ONCE before starting any waves. If critical files are missing, warn and offer to abort.

### Pitfall 3: Summary Report Overwhelm

**What goes wrong:** For 8+ screen batches, the final summary report is too long and the user cannot parse what needs attention.

**Prevention:** Final report should have a "needs attention" section first (failed screens, validation warnings), followed by a "succeeded" section. Lead with problems, not successes.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Wave orchestration | Rate limit cascade | Default concurrency of 3, never exceed 5 |
| Progress tracking | Orchestrator context bloat | Read minimal data from SUMMARY.md; warn at 50% context |
| STATE.md extensions | Breaking existing state parsing | Add new fields only; never modify existing field semantics |
| Git integration | Parallel commit conflicts | Platform-scoped file paths provide natural isolation |
| Auto-review offer | Rate budget exhaustion | Warn if batch had rate issues; report estimated review cost |
| Resume after /clear | Lost wave plan | Rebuild from STATE.md screen statuses; stateless orchestrator design |

## Sources

- Claude Code rate limit observations: [Claude Code Rate Limits Explained](https://www.clawport.dev/blog/claude-code-rate-limits-explained)
- Claude Code parallel subagent patterns: [Sub-Agent Best Practices](https://claudefa.st/blog/guide/agents/sub-agent-best-practices)
- Existing Motif compose-screen.md (git conflict scenarios, validation flow)
- Existing Motif CLAUDE.md (context budget constraints)
