# Phase 17: Context Resilience - Context

**Gathered:** 2026-03-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Make every Motif workflow survive `/clear` and context compaction without losing state or requiring manual re-orientation. This phase adds a dedicated Motif state file, artifact-based recovery, and a persistent status line. GSD planning state (`.planning/STATE.md`) remains separate and unchanged.

</domain>

<decisions>
## Implementation Decisions

### State file format
- Motif gets its own state file, separate from GSD's `.planning/STATE.md`
- State file lives at the project level (not global)
- Required fields: phase + status, vertical + stack, screen progress (count and names), last command context (what ran and outcome)
- Claude's Discretion: Whether to use YAML frontmatter + markdown body or pure YAML; the format choice should optimize for what scripts/hooks need to parse

### Recovery behavior
- When state file is missing or corrupt: scan artifacts, rebuild state, and **notify** the user ("State recovered from artifacts — phase: COMPOSING, 3/5 screens") — don't ask for confirmation, but don't be silent either
- Full recovery depth: infer vertical from tokens.css patterns, stack from package.json/project files, and workflow phase from artifact presence
- Claude's Discretion: Which artifacts count as minimum recovery anchors — pick what's reliably indicative vs guesswork
- When inferred state conflicts with user's explicit command: **warn then obey** — show what state says, then proceed with what user asked (e.g., "You're in COMPOSING phase — re-init will reset progress. Proceeding.")

### Status line content
- Rich format: phase + count + vertical + current/next screen — e.g., `Motif: fintech | COMPOSING 3/5 | next: dashboard`
- When idle (no active work): show next action — e.g., `Motif: fintech | next: /motif:compose`
- Claude's Discretion: Whether status line appears always in Motif projects vs only during Motif commands (based on what SessionStart hook can reliably deliver)
- Claude's Discretion: Whether format adapts per workflow phase (showing phase-relevant info) vs stays consistent
- Claude's Discretion: Fallback strategy for the known SessionStart hook bug (#15174 — stdout dropped after compaction)

### State update triggers
- Commands validate state and **warn but allow** out-of-order execution — e.g., "Can't find design system — running compose without /motif:system may produce inconsistent results. Continue?"
- Claude's Discretion: When state gets written (every command, on transitions, on screen completion) — pick the granularity that keeps state fresh after /clear
- Claude's Discretion: Atomic writes vs direct writes — pick based on corruption likelihood and recovery robustness

</decisions>

<specifics>
## Specific Ideas

- Status line should nudge toward next action when idle — acts as a lightweight progress guide
- "Warn then obey" pattern: state is advisory, not a gate. Power users can override, but newcomers get guidance
- Recovery notification should be brief and informative, not a confirmation dialog that blocks the workflow

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 17-context-resilience*
*Context gathered: 2026-03-09*
