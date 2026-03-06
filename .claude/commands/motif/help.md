---
description: Show all Motif commands
---
# Motif — Commands

## Core Workflow (run in order)
| Command | What it does |
|---|---|
| `/motif:init` | Interview → vertical detection → design brief |
| `/motif:research` | 4-agent parallel research → locked design decisions |
| `/motif:system` | Generate tokens + component specs + visual showcase |
| `/motif:compose [screen]` | Build screen with fresh agent context |
| `/motif:review [screen\|all]` | 4-lens heuristic evaluation, scored /100 |
| `/motif:fix [screen]` | Fix review findings systematically |

## Iteration
| `/motif:evolve` | Update design system based on learnings |
| `/motif:quick [desc]` | Ad-hoc task with design system consistency |

## Navigation
| `/motif:progress` | Current status + next steps |
| `/motif:help` | This reference |

## Typical flow
```
/motif:init → /motif:research → /motif:system → /motif:compose login →
/motif:compose dashboard → /motif:review all → /motif:fix dashboard →
/motif:review dashboard
```
