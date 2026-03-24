# Architecture Patterns: Batch Multi-Screen Composition

**Domain:** AI-powered design system tooling -- batch orchestration
**Researched:** 2026-03-24

## Recommended Architecture

### System Overview

```
User: /motif:batch-compose [all | screen1 screen2 ...]
        |
        v
  [Batch Orchestrator] (batch-compose.md workflow)
        |
        +-- Step 1: Gate checks (same as compose-screen.md)
        +-- Step 2: Build screen list from STATE.md or args
        +-- Step 3: Assemble shared context paths (read ONCE)
        +-- Step 4: Calculate waves (ceil(N / concurrency))
        |
        +-- Wave Loop:
        |     |
        |     +-- Spawn N Task() agents (parallel, one per screen)
        |     |     |
        |     |     +-- [Composer Agent 1] -- uses motif-screen-composer.md
        |     |     +-- [Composer Agent 2] -- uses motif-screen-composer.md
        |     |     +-- [Composer Agent 3] -- uses motif-screen-composer.md
        |     |
        |     +-- All agents complete (allSettled semantics)
        |     +-- Collect results: read SUMMARY.md per screen
        |     +-- Update STATE.md: batch progress, per-screen status
        |     +-- Report wave results to user
        |     |
        |     +-- Next wave (if screens remain)
        |
        +-- Step 5: Final batch report
        +-- Step 6: Offer auto-review (triggers /motif:review all)
        +-- Step 7: Update STATE.md final state
```

### Component Boundaries

| Component | Responsibility | Communicates With |
|-----------|---------------|-------------------|
| batch-compose.md (workflow) | Orchestrates waves, tracks batch state, reports progress | motif-state.js, SUMMARY.md files, composer agents via Task() |
| motif-screen-composer.md (agent) | Composes a single screen -- UNCHANGED | tokens.css, COMPONENT-SPECS.md, compose-validator.js |
| motif-state.js (script) | Reads/writes STATE.md frontmatter | STATE.md file on disk |
| compose-validator.js (script) | Validates decomposed output per screen -- UNCHANGED | Screen files on disk, git staging |
| compose-screen.md (workflow) | Single-screen compose -- UNCHANGED, still available | Same as batch but for one screen |

### Data Flow

1. **Input:** User provides screen names or `all`. Orchestrator reads STATE.md to get the full screen list with statuses.

2. **Context assembly (once):** Orchestrator reads file paths for tokens.css, COMPONENT-SPECS.md, DESIGN-RESEARCH.md, ICON-CATALOG.md, platform overlay. Passes paths (not contents) to each Task() prompt. This is identical to compose-screen.md Step 2 but done once for the entire batch.

3. **Wave execution:** Each Task() receives:
   - Screen name
   - List of context file paths
   - Stack identifier
   - Platform and overlay info
   - Previous screen summaries (from earlier waves or prior composes)

4. **Result collection:** Orchestrator reads ONLY `{SCREEN_NAME}-SUMMARY.md` per screen (never TaskOutput). Checks git log for commits.

5. **State update:** motif-state.js updates STATE.md with batch progress and per-screen status changes.

6. **Output:** Text-based progress reports between waves. Final summary after all waves.

## Patterns to Follow

### Pattern 1: Wave-Based Parallel Execution

**What:** Group screens into fixed-size waves. Execute all screens in a wave in parallel. Wait for wave completion before starting next wave.

**When:** Always -- this is the core orchestration pattern.

**Why:** Rate limit safety. Partial progress preservation. Natural progress reporting boundaries.

**Example (workflow pseudocode):**
```
screens = [login, dashboard, settings, profile, transactions, analytics]
concurrency = 3
waves = [[login, dashboard, settings], [profile, transactions, analytics]]

for wave_index, wave in waves:
  // Spawn all Task() agents for this wave in a single message
  for screen in wave:
    Task(motif-screen-composer, screen_name=screen, context_paths=shared_paths)

  // After all complete:
  for screen in wave:
    result = read_summary(screen)
    update_state(screen, result.status)

  report_wave_progress(wave_index, wave, results)
```

### Pattern 2: Idempotent Screen Status

**What:** A screen's status in STATE.md determines whether it should be composed. Only `planned` and `failed` screens are eligible for batch composition.

**When:** Always -- prevents re-composing already-composed screens.

**Why:** Enables resume-after-interrupt and partial retries without wasted work.

**Status flow:**
```
planned -> composed (success) -> reviewed -> fixed
planned -> failed (compose error) -> planned (user resets) -> composed
```

### Pattern 3: Context Path Passing (Not Content Passing)

**What:** Orchestrator assembles a list of file paths, passes paths to each Task() agent. Each agent reads the files independently in its own context.

**When:** Always -- this is the existing Motif pattern from compose-screen.md.

**Why:** The orchestrator must stay thin (under 30% context usage per CLAUDE.md). Passing file contents would balloon orchestrator context with each wave.

### Pattern 4: Summary-Based Result Collection

**What:** Orchestrator reads SUMMARY.md files to determine success/failure. Never reads TaskOutput.

**When:** After each wave completes.

**Why:** CLAUDE.md explicitly prohibits using TaskOutput. SUMMARY.md is the contract between composer and orchestrator.

## Anti-Patterns to Avoid

### Anti-Pattern 1: Shared Mutable State Between Composers

**What:** Allowing parallel composers to read/write the same files simultaneously (e.g., updating a shared component file).

**Why bad:** Race conditions. One composer's changes overwrite another's. Git conflicts on commit.

**Instead:** Each composer writes to its own screen directory or route path. Shared components are read-only inputs (from COMPONENT-SPECS.md or existing project).

### Anti-Pattern 2: Orchestrator Context Bloat

**What:** The orchestrator reading full screen source code, validation output, or TaskOutput to "check" results.

**Why bad:** With 6+ screens across multiple waves, orchestrator context fills up fast. Quality degrades for later waves.

**Instead:** Read only SUMMARY.md (small file) and git log (one line). Trust the composer's self-validation and compose-validator.js.

### Anti-Pattern 3: Greedy Concurrency

**What:** Spawning all screens at once (e.g., 8 parallel Task() agents).

**Why bad:** Rate limiting kills multiple agents simultaneously. All work in that wave is wasted. User waits longer for failure than they would for two sequential waves.

**Instead:** Conservative waves of 3. The 30-second wave overhead is negligible compared to rate-limit-induced retry cycles.

### Anti-Pattern 4: Tight Coupling Between Batch and Single-Screen Workflows

**What:** Merging batch logic into compose-screen.md, making it handle both single and batch modes.

**Why bad:** compose-screen.md is validated across 58 plans and 5 milestones. Adding conditional batch logic creates regression risk.

**Instead:** batch-compose.md is a separate workflow that reuses compose-screen.md's agent definition and validation scripts without modifying them.

## Scalability Considerations

| Concern | 3 screens | 6 screens | 12+ screens |
|---------|-----------|-----------|-------------|
| Wave count | 1 wave | 2 waves | 4+ waves |
| Wall-clock time | ~5 min | ~10 min | ~20 min |
| Rate limit risk | Low | Low-Medium | Medium-High |
| Orchestrator context | Minimal | Low | Moderate (many SUMMARY.md reads) |
| Git history | 3 commits | 6 commits | 12+ commits (consider squash offer) |

For 12+ screens: consider offering a git squash at the end, and suggest the user increase concurrency only if their API tier supports it.

## Sources

- Existing Motif compose-screen.md workflow (primary architectural reference)
- Existing Motif CLAUDE.md (orchestrator context constraints, TaskOutput prohibition)
- Claude Code subagent documentation (Task() parallelism model)
