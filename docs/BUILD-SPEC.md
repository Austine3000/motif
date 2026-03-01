# Design Forge — Build Specification

> Complete roadmap for building Design Forge to production quality.
> Architecture: core + runtime adapters. v1.0 ships Claude Code only.
> Status: ██████░░░░ ~55% — Core architecture + workflows designed, needs agents + installer + verticals.

---

## File Status Summary

### Core (shared across all runtimes)

| File | Status | Priority |
|---|---|---|
| `core/references/state-machine.md` | ★ BUILT | P0 |
| `core/references/context-engine.md` | ★ BUILT | P0 |
| `core/references/design-inputs.md` | ★ BUILT | P0 |
| `core/references/runtime-adapters.md` | ★ BUILT | P0 |
| `core/references/verticals/fintech.md` | ★ BUILT (v2) | P0 |
| `core/references/verticals/health.md` | ○ NOT BUILT | P1 |
| `core/references/verticals/saas.md` | ○ NOT BUILT | P1 |
| `core/references/verticals/ecommerce.md` | ○ NOT BUILT | P1 |
| `core/references/verticals/social.md` | ○ NOT BUILT | P2 |
| `core/references/verticals/education.md` | ○ NOT BUILT | P2 |
| `core/references/verticals/marketplace.md` | ○ NOT BUILT | P2 |
| `core/references/verticals/devtools.md` | ○ NOT BUILT | P2 |
| `core/workflows/research.md` | ★ BUILT | P0 |
| `core/workflows/generate-system.md` | ★ BUILT | P0 |
| `core/workflows/compose-screen.md` | ★ BUILT | P0 |
| `core/workflows/review.md` | ★ BUILT | P0 |
| `core/workflows/fix.md` | ★ BUILT | P0 |
| `core/workflows/evolve.md` | ★ BUILT | P1 |
| `core/workflows/quick.md` | ★ BUILT | P1 |
| `core/templates/VERTICAL-TEMPLATE.md` | ★ BUILT | P1 |
| `core/templates/STATE-TEMPLATE.md` | ○ NOT BUILT | P1 |
| `core/templates/SUMMARY-TEMPLATE.md` | ○ NOT BUILT | P1 |
| `core/templates/token-showcase.html` | ○ NOT BUILT | P1 |

### Runtime: Claude Code (v1.0)

| File | Status | Priority |
|---|---|---|
| `runtimes/claude-code/commands/forge/init.md` | ★ BUILT | P0 |
| `runtimes/claude-code/commands/forge/*.md` (9 others) | ★ BUILT | P0 |
| `runtimes/claude-code/CLAUDE-MD-SNIPPET.md` | ★ BUILT | P0 |
| `runtimes/claude-code/agents/forge-researcher.md` | ○ NOT BUILT | P1 |
| `runtimes/claude-code/agents/forge-system-architect.md` | ○ NOT BUILT | P1 |
| `runtimes/claude-code/agents/forge-screen-composer.md` | ○ NOT BUILT | P1 |
| `runtimes/claude-code/agents/forge-design-reviewer.md` | ○ NOT BUILT | P1 |
| `runtimes/claude-code/agents/forge-fix-agent.md` | ○ NOT BUILT | P1 |
| `runtimes/claude-code/hooks/forge-token-check.js` | ○ NOT BUILT | P2 |
| `runtimes/claude-code/hooks/forge-font-check.js` | ○ NOT BUILT | P2 |
| `runtimes/claude-code/hooks/forge-aria-check.js` | ○ NOT BUILT | P2 |
| `runtimes/claude-code/hooks/forge-context-monitor.js` | ○ NOT BUILT | P2 |

### Runtime: Other (future)

| File | Status | Target |
|---|---|---|
| `runtimes/opencode/` | README only | v1.1 |
| `runtimes/gemini/` | README only | v1.3 |
| `runtimes/cursor/` | README only | v1.2 |

### Distribution

| File | Status | Priority |
|---|---|---|
| `bin/install.js` | ○ NOT BUILT | P1 |
| `package.json` | ○ NOT BUILT | P1 |
| `README.md` | ○ NOT BUILT | P1 |
| `LICENSE` | ○ NOT BUILT | P1 |
| `CHANGELOG.md` | ○ NOT BUILT | P2 |
| `scripts/contrast-checker.js` | ○ NOT BUILT | P2 |
| `scripts/token-counter.js` | ○ NOT BUILT | P2 |

---

## Milestone Roadmap

### Milestone 1: Make It Work (Phases 1-2)
Complete agents, templates, installer. Get a single end-to-end flow:
`/forge:init` → `/forge:research` → `/forge:system` → `/forge:compose` → `/forge:review`

### Milestone 2: Make It Smart (Phase 3)
Expand to 4 verticals (fintech + health + saas + ecommerce).

### Milestone 3: Make It Enforced (Phase 4)
Add hooks and scripts for automated quality gates.

### Milestone 4: Make It Proven (Phase 5)
End-to-end test on CryptoPay. Fix bugs. Verify differentiation.

### Milestone 5: Make It Multi-Runtime (future)
Add OpenCode, Cursor, Gemini adapters.

### Milestone 6: Make It Known (future)
Showcase projects, before/after comparisons, community building, npm publish.
