# Feature Landscape: Batch Multi-Screen Composition

**Domain:** AI-powered design system tooling -- batch orchestration
**Researched:** 2026-03-24

## Table Stakes

Features users expect from a "batch compose" command. Missing = feature feels incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Compose all planned screens in one command | Core value proposition of batch mode | Medium | Wave-based parallel Task() spawning |
| Compose a named subset of screens | User may want partial batch (e.g., only new screens) | Low | Filter STATE.md screens table by args |
| Per-screen success/failure reporting | Must know which screens worked and which failed | Low | Read SUMMARY.md existence + validation status |
| Progress updates between waves | User needs feedback during multi-minute batch | Low | Text output between wave completions |
| Failed screen retry without re-composing successes | Don't redo work that already succeeded | Low | Only compose screens with `planned` or `failed` status |
| Batch state survives /clear | Context resets happen; batch progress must persist | Low | Already solved -- STATE.md frontmatter persists across /clear |
| Auto-review offer after batch | Natural next step in the pipeline | Low | Trigger existing /motif:review all |

## Differentiators

Features that set this apart from "just run compose N times." Not expected, but valuable.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Smart screen ordering | Compose shared/foundational screens first (e.g., layout, navigation) so later screens can reference their summaries for cross-screen consistency | Medium | Analyze screen names + design research for dependency hints |
| Configurable concurrency | Users on different API tiers have different rate limits | Low | `batch_concurrency` in STATE.md frontmatter |
| Batch summary report | Single consolidated report at end: all screens, statuses, files created, token compliance | Low | Aggregate SUMMARY.md data |
| Parallel auto-review | Review screens in parallel waves (same pattern as compose) | Medium | Reuses wave orchestration logic |
| Resume interrupted batch | If user aborts mid-batch or /clear, resume from where it stopped | Low | STATE.md batch state already tracks progress |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Inter-screen communication during compose | Destroys context isolation -- Motif's core quality mechanism | Each composer reads previous SUMMARY.md files (existing pattern), not live state from sibling agents |
| Real-time streaming progress bar | Claude Code CLI does not support persistent UI widgets; would require terminal manipulation hacks | Print text updates between waves |
| Automatic retry on failure | Rate limit failures should pause, not hammer the API harder | Report failure, let user decide when to retry |
| Batch compose with custom per-screen overrides | Complexity explosion; batch is for uniform composition | User should compose individually for custom cases via existing /motif:compose |
| Priority queue for "important" screens | Premature optimization; all screens matter equally | Simple ordered list, optionally with smart ordering |
| Background/daemon batch process | Motif runs inside Claude Code session; backgrounding breaks the agent model | Run in foreground with wave-based progress |

## Feature Dependencies

```
STATE.md batch fields -> Wave orchestration -> Per-screen Task() spawning
                      -> Progress tracking
                      -> Batch summary report
                      -> Resume interrupted batch

Smart screen ordering -> Wave orchestration (determines wave composition)

Batch summary report -> Per-screen success/failure reporting (aggregates results)

Parallel auto-review -> Wave orchestration (reuses same wave pattern)
                     -> /motif:review all (existing pipeline)
```

## MVP Recommendation

Prioritize (Phase 1 of batch compose):
1. Compose all planned screens in one command (core capability)
2. Wave-based parallel spawning with default concurrency of 3
3. Per-screen success/failure reporting
4. Progress updates between waves
5. Failed screen retry
6. Batch state in STATE.md
7. Auto-review offer after batch

Defer:
- Smart screen ordering: medium complexity, can add in follow-up phase
- Parallel auto-review: same wave pattern, but adds scope; let batch compose prove the pattern first
- Configurable concurrency: default of 3 works for most users; configuration can come later

## Sources

- Existing Motif compose-screen.md workflow (validated pipeline)
- Existing Motif review.md workflow (validated pipeline)
- Claude Code parallel Task() documentation and community concurrency observations
