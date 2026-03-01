# Design Forge Rules

## Workflow
- Design work follows: `/forge:init` → `/forge:research` → `/forge:system` → `/forge:compose` → `/forge:review` → `/forge:fix`
- NEVER compose a screen without a design system (`tokens.css` + `COMPONENT-SPECS.md`)
- NEVER skip research. Domain patterns inform every design decision.

## Subagent Execution
- Screen composition runs in fresh subagent contexts via Task()
- Orchestrator stays at ≤30% context — passes file paths, not contents
- Each subagent commits its own work and creates SUMMARY.md
- NEVER use TaskOutput to read full subagent output

## Design System Compliance
- ALL colors, fonts, spacing, radii, shadows MUST reference tokens from `.planning/design/system/tokens.css`
- NEVER hardcode CSS values. If a token doesn't exist, add it to tokens.css first.
- NEVER use Inter, Roboto, Open Sans, Arial, or system-ui as font choices
- ALL components MUST match specs in `.planning/design/system/COMPONENT-SPECS.md`

## File Locations
- Design planning: `.planning/design/`
- Design tokens: `.planning/design/system/tokens.css`
- Screen summaries: `.planning/design/screens/`
- Review reports: `.planning/design/reviews/`

## Commit Prefixes
- `design(init):` — project initialization
- `design(research):` — domain research
- `design(system):` — design system generation/updates
- `design(compose):` — screen composition
- `design(review):` — design review
- `design(fix):` — review-driven fixes
- `design(evolve):` — design system evolution
- `design(quick):` — quick-mode tasks
