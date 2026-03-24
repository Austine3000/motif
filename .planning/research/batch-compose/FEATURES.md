# Feature Landscape: Batch Multi-Screen Composition

**Domain:** AI agent orchestration -- parallel subagent dispatch with progress reporting and automatic post-processing
**Researched:** 2026-03-24
**Confidence:** HIGH (grounded in existing compose-screen.md workflow analysis, Claude Code subagent documentation, and established batch processing patterns)

## Context

Motif currently composes one screen at a time via `/motif:compose [screen-name]`. Each screen spawns a fresh 200K context composer agent via Task(). The user must manually invoke compose for each screen, wait for completion, then invoke the next. For a 6-screen project, this means 6 separate commands with manual orchestration.

The batch compose feature enables: `/motif:compose screen1 screen2 screen3` or `/motif:compose --all` to compose multiple screens in a single invocation, with progress tracking and automatic review after the batch completes.

### Existing Infrastructure (Already Built)

These features exist and the batch feature builds on top of them:

- **Single-screen composition** -- `compose-screen.md` orchestrator spawns one Task() agent per screen
- **Parallel composition hint** -- Lines 429-437 of compose-screen.md already mention parallel Task() spawning "if screens are independent and user explicitly requests it"
- **STATE.md tracking** -- YAML frontmatter tracks `screens` array with per-screen `status` (planned/composed/reviewed/fixed)
- **motif-state.js utility** -- CLI tool for reading/writing state atomically
- **Review workflow** -- `/motif:review all` already supports batch review of all composed screens
- **Fix workflow** -- `/motif:fix` supports fixing review findings per screen
- **Auto-run post-compose** -- Optional dev server launch after composition (Step 4b in compose-screen.md)
- **Screen SUMMARY.md** -- Each composer agent produces a summary the orchestrator reads to confirm success
- **Compose validation** -- `compose-validator.js` validates decomposition, imports, and naming before commit

---

## Table Stakes

Features users expect from a batch compose command. Missing these = the feature feels broken or incomplete.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Multi-screen argument parsing** | Users expect `/motif:compose dashboard settings profile` to compose all three screens. This is the most basic form of batch invocation. Without it, there is no batch feature. | LOW | Modifies: compose-screen.md Step 1 | Parse $ARGUMENTS as space-separated screen names. Validate each name exists in STATE.md's screens array. Reject unknown names with "Screen '{name}' not found in STATE.md. Known screens: {list}." |
| **`--all` flag** | Users expect `/motif:compose --all` to compose every screen with status `planned`. This is the "just do everything" shortcut. Every batch tool has it (npm run all, jest --all, eslint .). | LOW | Requires: STATE.md screens array populated | Read STATE.md, filter screens where `status === 'planned'`, compose all of them. If no planned screens remain, report "All screens already composed. Run /motif:review all to evaluate." |
| **Parallel Task() dispatch** | Users invoking batch compose expect parallel execution, not sequential. The existing workflow already mentions this possibility (line 429). Claude Code's Task() tool supports multiple simultaneous invocations in a single message. Sequential composition of 6 screens would be painfully slow. | MEDIUM | Requires: screens to be independent (no shared unique components) | Spawn one Task() per screen in a single message. Each agent gets the same context profile (tokens.css, COMPONENT-SPECS.md, etc.) but composes a different screen. Claude Code handles the parallel execution natively -- the orchestrator just makes multiple Task() calls in one response. |
| **Per-screen status reporting** | After all agents complete, the orchestrator must report what happened to each screen: success/failure, files created, validation result. Without this, the user has no idea what just happened across 6 parallel agents. | LOW | Requires: SUMMARY.md from each agent | Read each screen's SUMMARY.md after completion. Present a consolidated table: Screen | Status | Files | Validation. This mirrors how the review workflow already presents batch results (lines 126-137 of review.md). |
| **STATE.md batch update** | All composed screens must have their status updated to `composed` in STATE.md. The current workflow updates one screen at a time. Batch compose must update all screens atomically to avoid partial state. | LOW | Requires: motif-state.js | Run motif-state.js update commands for each screen after all agents complete. Update `screens_composed` count. Update `phase` to COMPOSING if first batch. Existing script handles atomic writes. |
| **Failure isolation** | If screen 3 of 6 fails (validation error, context overflow, etc.), the other 5 should still succeed. The user should see which screens passed and which failed, with actionable next steps for failures. | MEDIUM | Requires: per-screen status reporting | Each Task() is independent. If one fails, others are unaffected. The orchestrator checks each SUMMARY.md and git log independently. Failed screens get status `failed` (new status value) in STATE.md. Report: "5/6 screens composed. Failed: settings (validation error -- see SUMMARY.md). Run /motif:compose settings to retry." |
| **Automatic review trigger** | After batch compose completes, the user expects an automatic review pass. The whole point of batch compose is "compose everything, then review everything." Forcing the user to manually run `/motif:review all` after batch compose defeats the purpose. | MEDIUM | Requires: all screens composed, review workflow | After all compose agents finish and results are collected, ask: "All screens composed. Run automatic review? (yes/no)". If yes, invoke the review workflow with `all` scope. This chains compose -> review in a single user interaction. |

---

## Differentiators

Features that make Motif's batch compose genuinely better than composing screens one at a time. Not expected, but valued.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Live progress reporting during execution** | While 6 agents run in parallel, the orchestrator reports progress as each completes: "2/6 composed: dashboard (pass), login (pass). 4 remaining..." This gives the user confidence that work is happening and surfaces failures early without waiting for the entire batch. | MEDIUM | Requires: ability to check Task() completion incrementally | Claude Code's Task() returns results when each agent completes. The orchestrator can emit progress updates between agent completions. This is natural in the agent model -- the orchestrator receives results asynchronously and reports as they arrive. Not all 6 complete at the same moment; the orchestrator speaks after each one finishes. |
| **Dependency-aware ordering** | If screen B depends on screen A (e.g., B needs a shared component that A creates), the orchestrator detects this and composes A first, then B. Prevents component conflicts where two agents try to create the same shared primitive. | HIGH | Requires: screen dependency analysis from STATE.md or PROJECT.md | Analyze screens for potential shared component overlap. Screens that share no unique components compose in parallel. Screens with shared dependencies compose sequentially (A first, then B in next batch). This is a graph scheduling problem -- identify independent sets, compose in waves. |
| **Batch summary report** | After all screens compose, produce a single consolidated report: total screens, pass/fail count, total files created, total components generated, any new tokens added, overall validation status. Saves the user from reading 6 individual SUMMARY.md files. | LOW | Requires: per-screen SUMMARY.md | Generate `.planning/design/screens/BATCH-SUMMARY.md` that aggregates all individual summaries. Include: file count per screen, shared components created, validation results, and the recommended next step (review or fix). |
| **Compose-then-review-then-fix pipeline** | Chain the entire quality loop: compose all -> review all -> auto-fix critical issues -> re-review. The user invokes one command and gets production-ready screens. This is the "just make it all work" experience. | HIGH | Requires: batch compose, batch review, batch fix all working | This is the full pipeline: `/motif:compose --all --review --fix`. After compose, automatically review all. After review, automatically fix all critical/major issues. After fix, re-review to confirm. Stop when all screens pass (score >= 80, zero criticals) or after 2 fix-review cycles. |
| **Smart auto-run after batch** | After batch compose, offer auto-run ONCE (not per screen). The dev server shows the entire app, not just one screen. Navigate between composed screens in the preview. | LOW | Requires: auto-run infrastructure (already built in Step 4b) | Current auto-run is per-screen. For batch, offer it once at the end: "All 6 screens composed. Start dev server to preview the full app? (yes/no)". The auto-run shows the app with all screens navigable. |
| **Context-aware screen ordering** | Compose "foundation" screens first (landing page, layout/nav) so that later screens can reference the summary for cross-screen consistency. Purely parallel composition means screen 6 cannot know what visual choices screen 1 made. | MEDIUM | Requires: screen classification (foundation vs feature vs detail) | Classify screens: foundation (landing, dashboard, nav layout), feature (specific pages), detail (settings, profile). Compose foundation screens first (wave 1), then feature screens (wave 2) with wave 1 summaries available, then detail screens (wave 3). This is 2-3 sequential waves, not N sequential screens. |

---

## Anti-Features

Features to explicitly NOT build for batch compose.

| Anti-Feature | Why It Seems Useful | Why It Is Problematic | What to Do Instead |
|--------------|---------------------|----------------------|-------------------|
| **Inter-agent communication during composition** | "Screen 2's agent should see screen 1's component choices in real-time so they stay consistent." | Claude Code subagents are context-isolated. They cannot see each other during execution. Attempting real-time sync between parallel agents requires either: (a) sequential execution (defeating the purpose of parallel), or (b) a shared state store that agents poll (adding enormous complexity and race conditions). The existing cross-screen consistency mechanism (reading previous SUMMARY.md files) works fine for sequential composition. | Use wave-based composition: compose foundation screens first, make their SUMMARY.md available to subsequent waves. This provides consistency without real-time inter-agent communication. 2-3 waves is fast enough. |
| **Unlimited parallel agent count** | "Let users compose 20 screens at once for maximum speed." | Claude Code API rate limits apply per account. Spawning 20 simultaneous subagents will likely hit rate limits (token throughput or concurrent request caps), causing failures that look like bugs. Each agent also consumes significant compute resources. Additionally, collecting results from 20 agents produces a huge amount of output that can overwhelm the orchestrator's context. | Cap parallel agents at 5 per wave. For projects with 6+ screens, compose in waves of 5. This balances speed with rate limit safety. Document the cap clearly: "Composing in batches of 5 to stay within API limits." |
| **Resume/retry individual screens mid-batch** | "If screen 3 fails, retry just screen 3 while screens 4-6 continue." | This adds complex state management: the orchestrator must track which agents are still running, which have completed, and which need retry, all within a single message turn. The natural agent model is simpler: batch completes, report results, user retries failures with a new invocation. | Report failures clearly with retry instructions: "Failed: settings. Run /motif:compose settings to retry." The user runs one more command. This is simpler, more predictable, and requires no mid-batch state management. |
| **Per-screen progress bars or spinners** | "Show a spinner for each screen being composed, like docker-compose up." | Claude Code is a text-based agent. It does not have a persistent terminal UI with updating progress bars. The agent speaks in messages. Attempting to simulate a multi-line updating progress display would produce garbage output. | Report completions as they arrive: "Composed 3/6: dashboard (pass), login (pass), pricing (pass). Waiting for 3 more..." This is natural agent communication, not a fake TUI. |
| **Automatic screen list generation** | "Infer screens from the design system and compose them all without the user defining them." | Screen selection is a product decision, not a technical one. The user defines screens during /motif:init because they know their product scope. Auto-inferring screens from component specs would generate meaningless pages ("ButtonShowcase", "InputDemo") that the user does not want. | Require screens to be defined in STATE.md before batch compose. The `--all` flag composes all DEFINED screens, not all POSSIBLE screens. |
| **Granular per-file commit during batch** | "Each agent should commit each file individually for better git history." | The existing validation pipeline (compose-validator.js) validates ALL files for a screen together, then commits atomically. Per-file commits would bypass validation and create an unrollbackable mess if validation later fails. Additionally, 6 screens x 6 files = 36 individual commits, which is noise. | Keep the current pattern: one atomic commit per screen after validation passes. For a 6-screen batch, this produces 6 clean commits (one per screen), each validated. |

---

## Feature Dependencies

```
Batch Argument Parsing
    Multi-name parsing ──> Screen name validation against STATE.md
    --all flag parsing ──> Filter screens where status === 'planned'
                                    │
                                    v
Parallel Dispatch
    Validated screen list ──> Task() per screen (max 5 parallel)
    Context profile assembly ──> Same as single-screen (tokens.css, COMPONENT-SPECS.md, etc.)
                                    │
                                    v
Progress Reporting
    Each Task() completion ──> Orchestrator reads SUMMARY.md
    Running tally ──> "X/N composed so far"
                                    │
                                    v
Result Collection
    All tasks complete ──> Per-screen pass/fail assessment
    Git log check ──> Confirm commits landed
    STATE.md batch update ──> All statuses set atomically
                                    │
                                    v
Batch Summary
    Individual SUMMARY.md files ──> Consolidated BATCH-SUMMARY.md
    Pass/fail counts ──> Next-step recommendation
                                    │
                                    v
Automatic Review (optional)
    All screens composed ──> "Run review? (yes/no)"
    Review workflow ──> /motif:review all (existing)
                                    │
                                    v
Auto-Run (optional)
    All screens pass ──> "Start dev server? (yes/no)"
    Runtime launcher ──> Existing auto-run infrastructure
```

### Dependency Notes

- **Argument parsing is a prerequisite for everything.** Without knowing WHICH screens to compose, nothing else can run.
- **Parallel dispatch is independent of progress reporting.** Dispatch can work without progress; progress just improves the UX.
- **Result collection is the critical integration point.** It reads SUMMARY.md from each agent (like single-screen does), but must handle the possibility that some agents failed.
- **Automatic review is optional and decoupled.** The compose batch works without auto-review. Auto-review is an enhancement triggered by a user prompt after compose completes.
- **Auto-run depends on everything else.** It is the last step -- only offered when all screens are composed (or at least some are).
- **Wave-based ordering (differentiator) modifies parallel dispatch.** Instead of one wave of N screens, it becomes 2-3 waves with SUMMARY.md from earlier waves fed to later wave agents.

---

## MVP Recommendation

### Must Have for Batch Compose v1

Prioritize these. Without them, the feature is not useful.

1. **Multi-screen argument parsing** (`/motif:compose dash login settings`) -- LOW complexity, the entry point
2. **`--all` flag** (`/motif:compose --all`) -- LOW complexity, the convenience shortcut
3. **Parallel Task() dispatch** (up to 5 concurrent) -- MEDIUM complexity, the core value
4. **Per-screen status reporting** (success/fail table after completion) -- LOW complexity, essential feedback
5. **Failure isolation** (failed screens do not block successful ones) -- MEDIUM complexity, reliability
6. **STATE.md batch update** (all statuses updated after batch) -- LOW complexity, state consistency
7. **Automatic review prompt** ("Run review? yes/no" after batch) -- MEDIUM complexity, completes the workflow

### Defer to v2

These improve the experience but are not required for the feature to be useful.

- **Wave-based ordering** -- Adds consistency but requires screen classification logic
- **Live progress reporting** -- Nice UX but the batch result table after completion is sufficient
- **Batch summary report** -- Individual SUMMARY.md files are readable; consolidation is convenience
- **Compose-then-review-then-fix pipeline** -- Too ambitious for v1; let users trigger each step

### Defer to v3 or Never

- **Dependency-aware ordering** -- Complex graph scheduling for marginal benefit; manual ordering suffices
- **Inter-agent communication** -- Architecturally impractical in Claude Code's subagent model
- **Unlimited parallelism** -- Rate limit hazard; cap at 5

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Risk | Priority |
|---------|------------|---------------------|------|----------|
| Multi-screen argument parsing | HIGH | LOW | LOW | P1 |
| `--all` flag | HIGH | LOW | LOW | P1 |
| Parallel Task() dispatch (cap 5) | HIGH | MEDIUM | MEDIUM (rate limits) | P1 |
| Per-screen status reporting | HIGH | LOW | LOW | P1 |
| Failure isolation | HIGH | MEDIUM | LOW | P1 |
| STATE.md batch update | HIGH | LOW | LOW | P1 |
| Automatic review prompt | MEDIUM | MEDIUM | LOW | P1 |
| Live progress reporting | MEDIUM | MEDIUM | LOW | P2 |
| Batch summary report | LOW | LOW | LOW | P2 |
| Smart auto-run (once after batch) | MEDIUM | LOW | LOW | P2 |
| Wave-based ordering | MEDIUM | MEDIUM | MEDIUM | P2 |
| Compose-review-fix pipeline | HIGH | HIGH | HIGH | P3 |
| Dependency-aware ordering | LOW | HIGH | HIGH | P3 |

**Priority key:**
- P1: Must have for batch compose launch
- P2: Add after P1 is validated and working
- P3: Future consideration, likely a separate milestone

---

## UX Expectations

### What Batch Compose Looks Like

```
/motif:compose --all

Reading STATE.md... 6 screens planned.

Composing 5 screens in parallel (wave 1 of 2):
  - dashboard
  - login
  - pricing
  - onboarding
  - settings

Composed 1/5: login (pass, 4 files)
Composed 2/5: pricing (pass, 3 files)
Composed 3/5: dashboard (pass, 6 files)
Composed 4/5: settings (pass, 5 files)
Composed 5/5: onboarding (pass, 4 files)

Composing 1 screen (wave 2 of 2):
  - profile

Composed 1/1: profile (pass, 4 files)

Batch Complete
-----------------------------------------------
Screen       Status   Files   Validation
dashboard    pass     6       pass
login        pass     4       pass
pricing      pass     3       pass
onboarding   pass     4       pass
settings     pass     5       pass
profile      pass     4       pass
-----------------------------------------------
Total: 6/6 composed, 26 files created

Run automatic review of all screens? (yes/no)
```

### What Failure Looks Like

```
Batch Complete
-----------------------------------------------
Screen       Status   Files   Validation
dashboard    pass     6       pass
login        pass     4       pass
pricing      pass     3       pass
settings     FAIL     0       --
onboarding   pass     4       pass
-----------------------------------------------
Total: 4/5 composed, 17 files created

settings failed: Validation error -- circular import detected.
See .planning/design/screens/settings-SUMMARY.md for details.

Run /motif:compose settings to retry after fixing the issue.

Run automatic review of composed screens? (yes/no)
```

---

## Sources

### Claude Code Subagent Documentation
- [Create custom subagents -- Claude Code Docs](https://code.claude.com/docs/en/sub-agents) -- HIGH confidence. Verified: parallel Task() dispatch supported, each subagent gets independent context, subagents cannot spawn other subagents, orchestrator collects results.
- [Claude Code Sub-Agents: Parallel vs Sequential Patterns](https://claudefa.st/blog/guide/agents/sub-agent-best-practices) -- MEDIUM confidence. Confirms: parallel subagents are context-isolated, cost is per-context-window, sequential chaining needed for dependencies.

### Batch Processing Patterns
- [CLI UX Best Practices: Progress Displays (Evil Martians)](https://evilmartians.com/chronicles/cli-ux-best-practices-3-patterns-for-improving-progress-displays) -- MEDIUM confidence. Recommends: single progress indicator for batch operations rather than per-item bars.
- [Agentic Patterns: Parallel Tool Execution](https://agentic-patterns.com/patterns/parallel-tool-execution/) -- MEDIUM confidence. Pattern: classify tools as read-only vs state-modifying; execute read-only in parallel.

### Existing Codebase Analysis
- `compose-screen.md` lines 429-437 -- HIGH confidence. Already documents parallel Task() support with conditions: screens must be independent, user must explicitly request, rate limit implications understood.
- `review.md` lines 126-137 -- HIGH confidence. Batch review result table format already established; batch compose should match this pattern.
- `motif-state.js` -- HIGH confidence. Supports atomic state updates; can be called multiple times after batch completion.

---
*Feature research for: Batch Multi-Screen Composition*
*Researched: 2026-03-24*
