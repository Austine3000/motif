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
| `INITIALIZED` | `/motif:init` | None | PROJECT.md, DESIGN-BRIEF.md, STATE.md, (optional: PROJECT-SCAN.md, CONVENTIONS.md if brownfield) |
| `RESEARCHED` | `/motif:research` | INITIALIZED | DESIGN-RESEARCH.md, research/*.md |
| `SYSTEM_GENERATED` | `/motif:system` | RESEARCHED | system/tokens.css, system/DESIGN-SYSTEM.md, system/COMPONENT-SPECS.md, system/token-showcase.html |
| `COMPOSING` | `/motif:compose` | SYSTEM_GENERATED | screens/[name].*, screens/[name]-SUMMARY.md |
| `REVIEWING` | `/motif:review` | ≥1 screen composed | reviews/[name]-REVIEW.md |
| `ITERATING` | `/motif:fix` | ≥1 review exists | Updated screen files, updated reviews |

## Gate Checks

Every command reads STATE.md and validates before executing:

```xml
<gate_check>
  <command>/motif:init</command>
  <requires_phase>UNINITIALIZED</requires_phase>
  <blocks_if>PROJECT.md already exists. Tell user to delete .planning/design/ to restart.</blocks_if>
</gate_check>

<gate_check>
  <command>/motif:research</command>
  <requires_phase>INITIALIZED</requires_phase>
  <blocks_if>PROJECT.md or DESIGN-BRIEF.md missing. Tell user to run /motif:init first.</blocks_if>
</gate_check>

<gate_check>
  <command>/motif:system</command>
  <requires_phase>RESEARCHED</requires_phase>
  <blocks_if>DESIGN-RESEARCH.md missing. Tell user to run /motif:research first.</blocks_if>
  <note>If PROJECT-SCAN.md exists, system generator uses brownfield mode (Phase 14 integration).</note>
</gate_check>

<gate_check>
  <command>/motif:compose</command>
  <requires_phase>SYSTEM_GENERATED or COMPOSING or ITERATING</requires_phase>
  <blocks_if>tokens.css or COMPONENT-SPECS.md missing. Tell user to run /motif:system first.</blocks_if>
</gate_check>

<gate_check>
  <command>/motif:review</command>
  <requires_phase>COMPOSING or REVIEWING or ITERATING</requires_phase>
  <blocks_if>No composed screens exist. Tell user to run /motif:compose first.</blocks_if>
</gate_check>

<gate_check>
  <command>/motif:fix</command>
  <requires_phase>REVIEWING or ITERATING</requires_phase>
  <blocks_if>No reviews exist. Tell user to run /motif:review first.</blocks_if>
</gate_check>

<gate_check>
  <command>/motif:evolve</command>
  <requires_phase>COMPOSING or REVIEWING or ITERATING</requires_phase>
  <blocks_if>No composed screens exist. Need at least one screen to learn from.</blocks_if>
</gate_check>

<gate_check>
  <command>/motif:quick</command>
  <requires_phase>ANY except UNINITIALIZED</requires_phase>
  <blocks_if>No PROJECT.md. Tell user to run /motif:init first (or use without Motif).</blocks_if>
  <note>Quick mode works with or without a full design system, but warns about consistency risk if tokens.css is missing.</note>
</gate_check>

<gate_check>
  <command>/motif:scan</command>
  <requires_phase>INITIALIZED or later</requires_phase>
  <blocks_if>PROJECT.md missing. Tell user to run /motif:init first.</blocks_if>
  <note>Can re-run at any phase to refresh scan artifacts. Overwrites existing PROJECT-SCAN.md and CONVENTIONS.md. If PROJECT-SCAN.md exists, system generator uses brownfield mode (Phase 14 integration).</note>
</gate_check>
```

## STATE.md Format

```markdown
# Motif State

## Phase
[UNINITIALIZED|INITIALIZED|RESEARCHED|SYSTEM_GENERATED|COMPOSING|REVIEWING|ITERATING]

## Vertical
[detected vertical]

## Stack
[technical stack]

## Screens
| # | Screen | Status | Review Score | Last Updated |
|---|--------|--------|-------------|-------------|
| 1 | login | composed | — | 2026-03-01 |
| 2 | dashboard | reviewed | 78/100 | 2026-03-01 |
| 3 | settings | planned | — | — |

## Decisions Log
- [ISO date] [decision description]

## Context Budget
| File | Tokens (approx) | Budget |
|---|---|---|
| PROJECT.md | ~800 | ≤1,000 |
| DESIGN-BRIEF.md | ~600 | ≤1,000 |
| DESIGN-RESEARCH.md | ~2,500 | ≤3,000 |
| tokens.css | ~2,000 | ≤3,000 |
| COMPONENT-SPECS.md | ~3,000 | ≤5,000 |
| PROJECT-SCAN.md | ~1,200 | ≤1,500 |
| CONVENTIONS.md | ~800 | ≤1,000 |
```

## State Update Protocol

After any command completes:
1. Read current STATE.md
2. Update the Phase field if phase changed
3. Update the Screens table if screen status changed
4. Append to Decisions Log if a design decision was made
5. Update Context Budget if files were created/modified
6. Write STATE.md back
7. Commit with appropriate prefix
