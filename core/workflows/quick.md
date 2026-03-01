---
description: Execute ad-hoc UI tasks with design system consistency
allowed-tools: Read, Write, Grep, Glob, Bash(git add:*), Bash(git commit:*), Task
---

# /forge:quick — Quick Mode

For ad-hoc tasks that don't need the full workflow. Spawns a fresh agent with the design system loaded.

<gate_check>
If `.planning/design/system/tokens.css` exists, load it for consistency.
If not, warn: "No design system found. Working without token constraints. Run /forge:init + /forge:research + /forge:system for consistent results."
</gate_check>

## Process

1. Parse $ARGUMENTS for the task description
2. If no arguments, ask: "What do you want to do?"
3. Spawn a task agent with design system context (tokens.css + COMPONENT-SPECS.md if they exist)
4. Agent executes, commits with `design(quick): [description]`
5. Track in `.planning/design/quick/` directory

Quick mode provides design system compliance without the research/planning overhead.
