# Project Research Summary

**Project:** Motif v1.5 -- Batch Multi-Screen Composition
**Domain:** AI-powered design system tooling -- parallel orchestration
**Researched:** 2026-03-24
**Confidence:** HIGH

## Executive Summary

Motif currently composes one screen at a time via `/motif:compose [screen-name]`. Each invocation spawns a fresh 200K-token subagent via Claude Code's Task() primitive, validates the output with compose-validator.js, and commits atomically. For a 6-screen project, the user must issue 6 separate commands and wait for each to complete sequentially -- 12-30 minutes of wall-clock time. The batch compose feature eliminates this friction: a single `/motif:compose --all` command spawns multiple composer agents in parallel, collects results, and offers to chain into the review pipeline. Research confirms this is entirely achievable using existing Motif infrastructure with minimal additions.

The recommended approach is wave-based parallel Task() dispatch with a default concurrency of 3 agents per wave. The existing motif-screen-composer.md agent, compose-validator.js, and STATE.md schema require zero changes. All batch logic lives in two places: a modified argument-parsing and orchestration section in compose-screen.md, and a new `batch-update-screens` command (~35 lines) in motif-state.js. This minimal footprint is the finding with the highest confidence across all four research areas: the feature is an orchestration concern, not a new subsystem.

The most significant risks are architectural rather than algorithmic. Parallel git commits from concurrent subagents will trigger index.lock contention, and concurrent STATE.md reads will produce lost updates. Both are solved by the same design decision: defer all writes (commits and state updates) to the orchestrator, which executes them in a single atomic operation after all agents complete. This "batch-commit-by-orchestrator" strategy collapses three critical pitfalls into one resolved architectural choice and is the non-negotiable foundation of the implementation.

## Key Findings

### Recommended Stack

The batch feature requires no new dependencies and no new script files. Node.js >=22 (existing), Claude Code's Task() primitive (existing), motif-state.js (extended with one command), and compose-validator.js (unchanged) are the complete stack. Claude Code supports up to 10 concurrent Task() calls per message; the practical safe limit for Opus-class subagents is 3-5 due to concurrent request rate limits. All parallelism is managed by the Claude Code runtime -- no p-limit, no Worker Threads, no external orchestration libraries.

**Core technologies:**
- **Claude Code Task()**: parallel subagent spawning -- native support for multiple concurrent calls in a single message, no library needed
- **motif-state.js** (extended): STATE.md atomic read/write -- add `batch-update-screens` command for single-write batch state updates
- **compose-screen.md** (modified): batch orchestration -- argument parsing for multi-screen/all, wave management, result collection, auto-review trigger
- **compose-validator.js** (unchanged): per-screen validation -- already runs inside each subagent; no batch awareness required
- **STATE.md frontmatter**: batch configuration -- `batch_concurrency` (default 3) and `batch_auto_review` (default false) stored in existing state file

### Expected Features

Both researchers converge on the same MVP scope with consistent priorities.

**Must have (table stakes):**
- Multi-screen argument parsing (`/motif:compose dashboard settings profile`) -- entry point to the feature
- `--all` flag (compose every screen with status `planned`) -- the convenience shortcut; every batch tool has it
- Parallel Task() dispatch (default concurrency 3, max 5) -- core value proposition; sequential is 5x slower
- Per-screen success/failure reporting -- users need a clear pass/fail table after the batch
- Failure isolation -- failed screens must not block successful ones; STATE.md marks failures, others commit normally
- STATE.md batch update (atomic, single write after all agents complete) -- prevents corruption
- Auto-review offer after batch completion ("Run review? yes/no") -- natural pipeline continuation

**Should have (differentiators):**
- Live progress updates between waves ("Wave 1 complete: login OK, dashboard OK, settings OK. Starting wave 2...")
- Batch summary report (consolidated BATCH-SUMMARY.md aggregating all individual screen summaries)
- Context-aware screen ordering (compose foundation screens in wave 1, feature screens in wave 2 with wave 1 summaries available)
- Configurable concurrency via STATE.md frontmatter (`batch_concurrency: 3`)
- Smart auto-run offer once after full batch (not per screen)

**Defer (v2+):**
- Full compose-review-fix pipeline (`/motif:compose --all --review --fix`) -- too ambitious for v1
- Dependency-aware ordering (graph scheduling to detect shared components) -- medium complexity, low marginal value
- Parallel auto-review waves (same orchestration pattern, adds scope for v1)

### Architecture Approach

The architecture is an orchestrator/subagent fan-out pattern. The batch orchestrator assembles a shared context profile once (file paths, not contents), calculates waves, and spawns N Task() calls in a single message. Subagents run in fully isolated 200K-token context windows and are screen-agnostic -- each receives only its screen name and the shared context paths. After all agents in a wave complete, the orchestrator reads only the SUMMARY.md from each screen (never TaskOutput), updates STATE.md in a single atomic write, reports wave results, and starts the next wave. The orchestrator stays thin (estimated peak ~14K tokens for a 5-screen batch with auto-review, well under the 30% context budget).

**Major components:**

1. **Batch Orchestrator** (`compose-screen.md` Step 1 + new batch section) -- argument parsing, wave calculation, parallel Task() dispatch, result collection, deferred state update, auto-review prompt
2. **Composer Agent** (`motif-screen-composer.md`, unchanged) -- single-screen composition; batch is invisible to it; receives screen name + context paths
3. **State Utility** (`motif-state.js`, +35 lines) -- adds `batch-update-screens` command; performs one atomic read/write for all screen status updates
4. **Wave Coordinator** (logic within compose-screen.md) -- groups screens into waves of N (default 3), reports progress between waves, rebuilds state from STATE.md on resume after `/clear`
5. **Result Collector** (logic within compose-screen.md) -- reads SUMMARY.md per screen, classifies as passed/warned/failed, aggregates into batch result table

### Critical Pitfalls

1. **Git index.lock contention from parallel commits** -- parallel agents committing simultaneously race on the git index lock file, causing `fatal: Unable to create '.git/index.lock'` failures even when files were generated correctly. Solution: agents write files but do NOT commit. The orchestrator stages and commits all successful screens in a single batch commit after all agents complete.

2. **STATE.md concurrent write corruption** -- if the orchestrator updates STATE.md after each individual agent completion, overlapping read-modify-write cycles silently drop updates (`screens_composed` becomes wrong; screen statuses are lost). Solution: single `batch-update-screens` call that reads once, updates all statuses, writes once atomically.

3. **Rate limit cascade failure** -- spawning 5+ concurrent Opus-class Task() agents exhausts the API's concurrent request cap, causing an entire wave to fail simultaneously. Solution: default concurrency of 3, hard cap at 5. Wave-based batching ensures partial progress is preserved if a wave fails.

4. **Orchestrator context bloat** -- reading full SUMMARY.md files and TaskOutput across multiple waves accumulates 1K+ tokens per wave. For 12+ screen batches the orchestrator may exhaust useful context mid-batch. Solution: read only the validation status line (PASSED/FAILED/WARN) from each SUMMARY.md; write a persistent BATCH-RESULT.md manifest so context loss does not mean result loss.

5. **Cross-screen shared component duplication** -- parallel agents composing related screens (e.g., dashboard + analytics) may both generate the same component (StatCard.tsx), resulting in naming conflicts or silent overwrites. Solution: compose foundation screens in wave 1 first; prohibit agents from modifying shared files like tokens.css during batch (note gaps in SUMMARY.md instead).

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Core Batch Orchestration Infrastructure

**Rationale:** The commit strategy and state update strategy are the architectural foundation. Both researchers independently identify these as "must solve first before any parallel spawning is implemented." Getting these wrong requires rewriting dependent phases. The batch-commit-by-orchestrator decision resolves the git lock pitfall, the state race pitfall, and the partial failure recovery pitfall simultaneously.

**Delivers:** Working batch compose with correct git history and STATE.md integrity; deferred atomic commits; `batch-update-screens` command in motif-state.js; argument parsing for multi-screen and `--all`; parallel Task() dispatch in waves of 3

**Addresses:** Multi-screen argument parsing, `--all` flag, parallel Task() dispatch, STATE.md batch update, failure isolation

**Avoids:** Git index.lock contention (Critical Pitfall 1), STATE.md concurrent write corruption (Critical Pitfall 2), partial batch failure with no recovery (Critical Pitfall 3)

### Phase 2: Progress Reporting and UX

**Rationale:** With correct infrastructure in place, the user experience layer can be built safely. Wave-based progress feedback prevents users from interrupting batches they think are frozen. Research notes that silent batch execution is a moderate UX pitfall that causes users to abort mid-batch and spawn duplicate agents for the same screens.

**Delivers:** Wave progress reports between Task() completions, pre-spawn expectation setting ("Composing 5 screens in parallel. This typically takes 2-4 minutes. Do not interrupt."), final batch result table (pass/fail per screen), persistent BATCH-RESULT.md manifest

**Addresses:** Per-screen success/failure reporting, progress updates between waves

**Avoids:** Silent batch execution causing user interruption (Moderate Pitfall 6), orphaned files from premature aborts

### Phase 3: Auto-Review Integration and Pipeline Completion

**Rationale:** The review workflow already supports `/motif:review all`. Wiring it to batch compose is additive logic -- a prompt and a trigger. This phase is low risk because it calls existing, validated infrastructure. Research consensus: offer auto-review as opt-in after batch completion (never auto-trigger) due to API budget implications.

**Delivers:** Post-batch auto-review prompt, context budget check before offering review, smart auto-run offer once after full batch (never per-screen)

**Addresses:** Automatic review trigger, auto-run after batch

**Avoids:** Rate budget exhaustion from automatic review (Moderate Pitfall 3), auto-run offered before batch fully resolves (Minor Pitfall 9)

### Phase 4: Reliability Enhancements

**Rationale:** Context-aware screen ordering (wave 1 = foundation screens, wave 2 = feature screens with wave 1 summaries available) and configurable concurrency improve quality and safety for power users but are not required for the core feature to work. These are differentiators that can ship independently after core functionality is validated.

**Delivers:** Wave-aware screen ordering (classify foundation vs feature screens), `batch_concurrency` frontmatter configuration, batch state resume after `/clear` (stateless orchestrator design that rebuilds wave plan from STATE.md screen statuses)

**Addresses:** Context-aware screen ordering, configurable concurrency, resume interrupted batch

**Avoids:** Cross-screen inconsistency within same wave (Moderate Pitfall 1), stale context files (Minor Pitfall 2)

### Phase Ordering Rationale

- Phase 1 must precede everything because the commit and state strategies dictate all subsequent design choices. Getting these wrong requires rewriting dependent phases.
- Phase 2 can begin as soon as Phase 1's Task() spawning is wired up -- progress reporting is purely additive output logic with no state impact.
- Phase 3 depends on Phase 2's result collection being accurate (auto-review should only be offered when the pass/fail table is complete and correct).
- Phase 4 is decoupled from 1-3 and could ship incrementally or be deferred entirely without breaking the core feature.

### Research Flags

Phases likely needing deeper research during planning:

- **Phase 1 (commit strategy):** The "batch commit by orchestrator" pattern has not been validated against compose-validator.js's current per-screen file expectations. Verify that the validator can be run per-screen by each subagent before the orchestrator stages files, and that the orchestrator's batch commit includes correct `design(compose):` attribution format.
- **Phase 1 (shared file writes):** The tokens.css concurrent modification scenario needs a concrete rule about what agents are permitted to write during batch mode. The existing composer agent instructions allow token creation -- this must be explicitly overridden in the batch prompt without breaking single-screen composition behavior.

Phases with standard patterns (skip research-phase):

- **Phase 2 (progress reporting):** Text output between waves is documented and straightforward; no new API surface or script changes required.
- **Phase 3 (auto-review):** The review workflow's `all` argument is already validated. Triggering it is a one-line workflow transition.
- **Phase 4 (STATE.md config):** Adding frontmatter keys follows the established Motif pattern exactly; no research needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | No new dependencies. All tools are existing and validated in production across 58+ compose plans. The only addition is ~35 lines to motif-state.js. Zero ambiguity about what is needed. |
| Features | HIGH | Two independent researchers converged on identical MVP scope and identical defer list with no conflicting signals. Prioritization matrix is well-reasoned. |
| Architecture | HIGH | Both architecture research files are grounded in direct codebase analysis (not inference). Component boundaries, data flow, and integration points are specified at file/function level. |
| Pitfalls | HIGH (critical), MEDIUM (moderate) | Critical pitfalls (git lock, state race, partial failure) are verified against git documentation and Node.js concurrency patterns. Moderate pitfalls (context pressure, rate limits) are based on Claude Code subagent architecture patterns, which are less formally documented. |

**Overall confidence:** HIGH

### Gaps to Address

- **tokens.css write prohibition during batch:** The existing composer agent instructions allow adding missing tokens during composition. For batch mode this must be explicitly overridden in the batch prompt. Validate during Phase 1 planning that the override does not inadvertently affect single-screen composition.
- **compose-validator.js batch mode behavior:** The validator was designed for per-screen file sets. Research identifies potential cross-screen naming conflict false positives when run on combined file sets. The per-screen-only approach is safe for MVP but a cross-screen conflict detection pass should be scoped before batch compose ships to users.
- **Rate limit detection threshold:** No concrete API for detecting rate limit proximity was identified in research. The concurrency cap (3 default) is the primary mitigation. Proactive detection would require access to usage metrics that may not be available in Claude Code context.
- **6-screen batch size UX cap:** Research suggests capping batch at 6 screens as a UX recommendation, but this threshold is an estimate based on context budget math, not empirical measurement. Validate against a real 6-screen compose run before publishing the cap as user-facing guidance.

## Sources

### Primary (HIGH confidence)
- `compose-screen.md` workflow (codebase) -- orchestrator flow, parallel Task() support documentation (lines 429-437), context budget rules
- `motif-screen-composer.md` agent spec (codebase) -- subagent definition, context profile, existing anti-patterns
- `motif-state.js` implementation (codebase) -- atomic write behavior, existing CLI command patterns, `atomicWrite`/`parseFrontmatter`/`serializeFrontmatter` functions
- `compose-validator.js` (codebase) -- validation scope, import cycle detection, naming conflict checks
- Claude Code Subagents Documentation (code.claude.com/docs/en/sub-agents) -- Task() parallelism model, subagent isolation, concurrency behavior
- MDN Promise.allSettled() (developer.mozilla.org) -- conceptual model for failure-tolerant parallel execution

### Secondary (MEDIUM confidence)
- Claude Code Sub-Agents: Parallel vs Sequential Patterns (claudefa.st/blog) -- concurrency limits, rate limit observations from community testing
- Claude Code Rate Limits Explained (clawport.dev) -- concurrent request cap behavior with multiple agents
- CLI UX Best Practices: Progress Displays (evilmartians.com) -- batch progress reporting patterns
- Git worktrees with Claude Code (docs.bswen.com) -- parallel agent patterns, conflict rates
- Error handling in distributed systems (temporal.io) -- fan-out/fan-in orchestration, partial failure handling
- AI Agent Orchestration Patterns (Microsoft Azure) -- concurrent agent patterns, graceful degradation

### Tertiary (LOW confidence)
- Clash (github.com/clash-sh/clash) -- 3.1% git conflict rate with parallel AI agents; used as supporting evidence for the index.lock pitfall, not primary source

---
*Research completed: 2026-03-24*
*Ready for roadmap: yes*
