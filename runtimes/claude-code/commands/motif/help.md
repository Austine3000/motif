---
description: Show all Design Forge commands
---
# Design Forge — Commands

## Core Workflow (run in order)
| Command | What it does |
|---|---|
| `/forge:init` | Interview → vertical detection → design brief |
| `/forge:research` | 4-agent parallel research → locked design decisions |
| `/forge:system` | Generate tokens + component specs + visual showcase |
| `/forge:compose [screen]` | Build screen with fresh agent context |
| `/forge:review [screen\|all]` | 4-lens heuristic evaluation, scored /100 |
| `/forge:fix [screen]` | Fix review findings systematically |

## Iteration
| `/forge:evolve` | Update design system based on learnings |
| `/forge:quick [desc]` | Ad-hoc task with design system consistency |

## Navigation
| `/forge:progress` | Current status + next steps |
| `/forge:help` | This reference |

## Typical flow
```
/forge:init → /forge:research → /forge:system → /forge:compose login →
/forge:compose dashboard → /forge:review all → /forge:fix dashboard →
/forge:review dashboard
```
