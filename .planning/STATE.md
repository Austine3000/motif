# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-04)

**Core value:** Domain-intelligent design delivered through fresh context -- a fintech app must look like fintech, not meditation, and screen 5 must be as good as screen 1.
**Current focus:** Phase 11 in progress -- pipeline icon integration

## Current Position

Phase: 11 of 12 (Pipeline Integration)
Plan: 2 of 3 in current phase
Status: Plan 11-02 complete -- pipeline icon integration done
Last activity: 2026-03-04 -- Plan 11-02 complete (compose workflow + composer agent + token showcase icon-aware)

Progress: [============================........] 83%
(v1.0 complete: 24/24 plans | v1.1: 5/7 plans)

## Performance Metrics

**Velocity:**
- Total plans completed: 28 (v1.0: 24, v1.1: 4)
- Average duration: ~2.5 min
- Total execution time: ~1 hour 10 min

**By Phase (v1.0):**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1. Agent Definitions | 3 | ~8 min | ~2.7 min |
| 2. Templates | 2 | ~5 min | ~2.5 min |
| 3. Installer | 3 | ~8 min | ~2.7 min |
| 4. Rebrand and Distribution | 4 | ~10 min | ~2.5 min |
| 5. Verticals | 3 | ~8 min | ~2.7 min |
| 6. Hooks and Scripts | 3 | ~8 min | ~2.7 min |
| 7. Validation | 3 | ~8 min | ~2.7 min |
| 8. CI and Publish | 2 | ~5 min | ~2.5 min |
| 8.1 Pre-Publish Fixes | 1 | ~2 min | ~2 min |
| 9. Foundation | 1 | ~4 min | ~4 min |
| 10. Vertical Migration | 2 | ~4 min | ~2 min |
| 11. Pipeline Integration | 2/3 | ~4 min | ~2 min |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v1.0 shipped 2026-03-04 as motif-design@0.1.0 on npm
- npm package name: motif-design (motif was taken)
- OIDC trusted publishing for npm auth
- 4 curated icon libraries: Phosphor, Lucide, Material Symbols, Tabler (Heroicons excluded -- 316 icons insufficient)
- Default recommendation: Lucide (widest adoption, shadcn/ui alignment)
- Deterministic selection algorithm: vertical + brand personality -> library + weight (no agent guesswork)
- Icon name hallucination prevention: curated per-vertical manifest of 15-25 validated names
- CDN version pinning mandatory -- never use @latest
- CSS class + CDN delivery (inline SVG is an anti-pattern for agents)
- Icon size tokens follow 8px-multiple scale: 16/20/24/32/40px
- Fixed icon size scale (not project-adjustable) -- system invariant like spacing base unit
- rem units for icon tokens -- matches --space-* and --text-* convention
- Token naming --icon-{scale} (not --icon-size-{scale}) -- follows --text-sm, --radius-md pattern
- Icon weight is part of algorithm output, not composer-decided
- No 36px token -- Health LogEntry 36x36 is a container dimension, not icon size
- currentColor inheritance for icon color -- no --icon-color-* tokens needed
- Material Symbols primary column first in health/ecommerce vocabulary tables (primary library per domain affinity)
- Bracket placeholder replacement uses vocabulary-referencing notation [icon: {role} --icon-{size}] not hardcoded names
- Primary library column listed first in vocabulary tables (Phosphor for fintech, Lucide for SaaS)
- 23 icons per vertical: 5 navigation + domain-specific + status/feedback + actions
- Ecommerce descriptive icon references left unchanged (not bracket placeholders)
- ICON-CATALOG.md is REQUIRED (not optional) for screen composition -- icon compliance is mandatory
- icon-libraries.md in never_load for composer -- only distilled catalog, not raw library metadata
- Icon anti-slop triad: validate name against catalog, validate size token, reject bracket placeholders

### Pending Todos

None yet.

### Blockers/Concerns

- ~~Phase 11: Context engine loading pattern for ICON-CATALOG.md needs review during planning~~ (resolved in 11-02: always_load in composer, REQUIRED_FILES in workflow)
- Phase 12: aria-check hook icon detection must avoid false positives on text buttons with adjacent icons

## Session Continuity

Last session: 2026-03-04
Stopped at: Completed 11-02-PLAN.md -- pipeline icon integration. Plan 11-03 next.
Resume file: --
