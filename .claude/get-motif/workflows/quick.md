---
description: Execute ad-hoc UI tasks with design system consistency
allowed-tools: Read, Write, Grep, Glob, Bash(git add:*), Bash(git commit:*), Task
---

# /motif:quick — Quick Mode

For ad-hoc tasks that don't need the full workflow. Spawns a fresh agent with the design system loaded.

<gate_check>
**Step 0 -- Load state:**
Run `node .claude/get-motif/scripts/motif-state.js read` and parse JSON output.
- If `{"error": "missing"}` or `{"error": "corrupt"}`: run `node .claude/get-motif/scripts/motif-state.js recover`. If recovery succeeds, notify user: "State recovered from artifacts -- phase: {phase}, {N}/{M} screens". If recovery fails, warn: "No Motif state found. Proceeding without state context."
- Otherwise: state is loaded.

**Step 1 -- Validate phase:**
If Phase is `UNINITIALIZED` or state could not be loaded:
  WARN: "No initialized Motif project found. This command typically runs after /motif:init. Proceeding anyway."
  (Do NOT block. Proceed with the command.)

**Step 2 -- Check prerequisites:**
If `.planning/design/PROJECT.md` does not exist:
  WARN: "Missing PROJECT.md. Running this command without it may produce inconsistent results. Consider running /motif:init first."
  (Do NOT block. Proceed with the command.)
If `.planning/design/system/tokens.css` does not exist:
  WARN: "No design system found -- quick mode will use inline styles. Run /motif:init + /motif:research + /motif:system for consistent results."
  (Do NOT block. Proceed with the command.)
If tokens.css exists, load it for consistency.
</gate_check>

## Process

1. Parse $ARGUMENTS for the task description
2. If no arguments, ask: "What do you want to do?"
3. Spawn a task agent with design system context (tokens.css + COMPONENT-SPECS.md if they exist)
4. Agent executes, commits with `design(quick): [description]`
5. Track in `.planning/design/quick/` directory

Quick mode provides design system compliance without the research/planning overhead.

## Final Step: Update State

Run `node .claude/get-motif/scripts/motif-state.js update last_command /motif:quick` and `update last_outcome success`.
Run `node .claude/get-motif/scripts/motif-state.js update updated {ISO_DATE}`.
