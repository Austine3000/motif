# Motif State Machine

This file defines the legal state transitions for a Motif project. Every command MUST check state before executing and MUST update state after completing. No exceptions.

## Phases

```
UNINITALIZED → INITIALIZED → RESEARCHED → SYSTEM_GENERATED → COMPOSING → REVIEWING → ITERATING
                    ↑              ↑              ↑                                      │
                    └──────────────┴──────────────┴──────────────────────────────────────┘
                                              (evolve loops back)
```

## Phase Definitions

| Phase | Set By | Prerequisites | Artifacts Created |
|---|---|---|---|
| `UNINITIALIZED` | (default) | None | None |
| `INITIALIZED` | `/motif:init` | None | PROJECT.md, DESIGN-BRIEF.md, STATE.md |
| `RESEARCHED` | `/motif:research` | INITIALIZED | DESIGN-RESEARCH.md, research/*.md |
| `SYSTEM_GENERATED` | `/motif:system` | RESEARCHED | system/tokens.css, system/DESIGN-SYSTEM.md, system/COMPONENT-SPECS.md, system/token-showcase.html |
| `COMPOSING` | `/motif:compose` | SYSTEM_GENERATED | screens/[name].*, screens/[name]-SUMMARY.md |
| `REVIEWING` | `/motif:review` | ≥1 screen composed | reviews/[name]-REVIEW.md |
| `ITERATING` | `/motif:fix` | ≥1 review exists | Updated screen files, updated reviews |

## Gate Checks

Gate checks use the warn-then-obey pattern. They warn the user about missing prerequisites but do not block execution. In non-interactive contexts (subagent), warnings default to proceeding.

Every command reads STATE.md and validates before executing:

```xml
<gate_check>
  <command>/motif:init</command>
  <requires_phase>UNINITIALIZED</requires_phase>
  <warns_if>PROJECT.md already exists. Tell user to delete .planning/design/ to restart.</warns_if>
</gate_check>

<gate_check>
  <command>/motif:research</command>
  <requires_phase>INITIALIZED</requires_phase>
  <warns_if>PROJECT.md or DESIGN-BRIEF.md missing. Tell user to run /motif:init first.</warns_if>
</gate_check>

<gate_check>
  <command>/motif:system</command>
  <requires_phase>RESEARCHED</requires_phase>
  <warns_if>DESIGN-RESEARCH.md missing. Tell user to run /motif:research first.</warns_if>
</gate_check>

<gate_check>
  <command>/motif:compose</command>
  <requires_phase>SYSTEM_GENERATED or COMPOSING or ITERATING</requires_phase>
  <warns_if>tokens.css or COMPONENT-SPECS.md missing. Tell user to run /motif:system first.</warns_if>
</gate_check>

<gate_check>
  <command>/motif:review</command>
  <requires_phase>COMPOSING or REVIEWING or ITERATING</requires_phase>
  <warns_if>No composed screens exist. Tell user to run /motif:compose first.</warns_if>
</gate_check>

<gate_check>
  <command>/motif:fix</command>
  <requires_phase>REVIEWING or ITERATING</requires_phase>
  <warns_if>No reviews exist. Tell user to run /motif:review first.</warns_if>
</gate_check>

<gate_check>
  <command>/motif:evolve</command>
  <requires_phase>COMPOSING or REVIEWING or ITERATING</requires_phase>
  <warns_if>No composed screens exist. Need at least one screen to learn from.</warns_if>
</gate_check>

<gate_check>
  <command>/motif:quick</command>
  <requires_phase>ANY except UNINITIALIZED</requires_phase>
  <warns_if>No PROJECT.md. Tell user to run /motif:init first (or use without Motif).</warns_if>
  <note>Quick mode works with or without a full design system, but warns about consistency risk if tokens.css is missing.</note>
</gate_check>
```

## STATE.md Format

STATE.md uses YAML frontmatter for machine-readable state, followed by a markdown body for human-readable context:

```markdown
---
phase: COMPOSING
vertical: fintech
stack: React + TypeScript + Tailwind
screen_count: 3
screens_composed: 2
screens:
  - name: login
    status: composed
  - name: dashboard
    status: reviewed
  - name: settings
    status: planned
last_command: /motif:compose
last_outcome: success
updated: 2026-03-09
---

# Motif State

## Decisions Log
- 2026-03-09 Composed login screen
- 2026-03-08 Generated design system

## Context Budget
| File | Tokens (approx) | Budget |
|---|---|---|
| PROJECT.md | ~800 | <=1,000 |
| DESIGN-BRIEF.md | ~600 | <=1,000 |
| DESIGN-RESEARCH.md | ~2,500 | <=3,000 |
| tokens.css | ~2,000 | <=3,000 |
| COMPONENT-SPECS.md | ~3,000 | <=5,000 |
```

The YAML frontmatter (between `---` delimiters) is parsed by `motif-state.js`. The markdown body is preserved across updates.

## State Update Protocol

After any command completes:
0. If STATE.md is missing or corrupt, run recovery: `node .claude/get-motif/scripts/motif-state.js recover`
1. Read current STATE.md
2. Update the Phase field if phase changed
3. Update the Screens table if screen status changed
4. Append to Decisions Log if a design decision was made
5. Update Context Budget if files were created/modified
6. Write STATE.md back using motif-state.js (atomic write-then-rename)
7. Commit with appropriate prefix

## State Utility

All state operations go through a single script:

    node .claude/get-motif/scripts/motif-state.js <command>

Commands: read, update <key> <value>, write <json>, status-line, recover

Every /motif:* command MUST read state via this utility as its first action. This ensures state is always loaded from disk, surviving /clear and context compaction.
