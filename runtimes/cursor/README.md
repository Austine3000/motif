# Cursor / Windsurf Runtime Adapter

## Status: NOT BUILT (v1.2 target)

## What Needs to Be Created

1. **rules-snippet.md** — Condensed Design Forge instructions for `.cursorrules` / `.windsurfrules`
   - No slash commands (these editors don't support them)
   - No subagent spawning (single context only)
   - The entire Design Forge workflow compressed into rules-file instructions
   - Include: vertical detection, token generation logic, review checklist
   
2. **install mapping** — Simpler than Claude Code:
   - `core/*` → `.design-forge/` (just drop it in the project)
   - Append rules snippet to `.cursorrules` or `.windsurfrules`

## Limitations
- No fresh context per screen — quality will degrade on 5+ screen projects
- No parallel research agents — runs sequentially in main context
- No hooks — no automated enforcement
- User triggers workflows manually by referencing the files

## Value Proposition
Even without subagents, the vertical references, differentiation seed, token decision algorithms, and review framework still improve output quality significantly compared to no design system.
