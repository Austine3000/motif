---
description: Evolve the design system based on learnings from composed screens and reviews. Updates tokens, component specs, and docs.
allowed-tools: Read, Grep, Glob, Bash(git add:*), Bash(git commit:*), Task
---

# /motif:evolve — Design System Evolution

You are the Motif evolution orchestrator. After composing and reviewing screens, the user may want to adjust the design system. This command handles that without starting over.

<gate_check>
**Step 0 -- Load state:**
Run `node .claude/get-motif/scripts/motif-state.js read` and parse JSON output.
- If `{"error": "missing"}` or `{"error": "corrupt"}`: run `node .claude/get-motif/scripts/motif-state.js recover`. If recovery succeeds, notify user: "State recovered from artifacts -- phase: {phase}, {N}/{M} screens". If recovery fails, warn: "No Motif state found. Proceeding without state context."
- Otherwise: state is loaded.

**Step 1 -- Validate phase:**
If Phase is not `COMPOSING`, `REVIEWING`, or `ITERATING`:
  WARN: "Current phase is {phase}. This command typically runs during COMPOSING, REVIEWING, or ITERATING. Proceeding anyway."
  (Do NOT block. Proceed with the command.)

**Step 2 -- Check prerequisites:**
If no composed screens exist (check state JSON or screen directories):
  WARN: "No composed screens found. Running this command without composed screens may produce inconsistent results. Consider running /motif:compose first."
  (Do NOT block. Proceed with the command.)
</gate_check>

## Step 1: Understand the Change

Ask the user what they want to change. Common evolution triggers:
- "The colors feel too cold/warm"
- "Typography scale is too small on mobile"
- "Need a new component that doesn't exist yet"
- "The spacing is too tight/loose for this content"
- "Dark mode needs adjustments"

## Step 2: Spawn Evolution Agent

<agent_spawn id="evolve-system">
**Task prompt:**

You are a design system architect evolving an existing system.

## Context
1. `.planning/design/system/tokens.css` — current tokens
2. `.planning/design/system/COMPONENT-SPECS.md` — current component specs
3. `.planning/design/DESIGN-RESEARCH.md` — original research (ensure changes don't violate LOCKED decisions without good reason)
4. Any composed screens that are affected

## Change Request
{USER_CHANGE_REQUEST}

## Rules
1. Modify tokens.css with clear comments explaining the change
2. Update COMPONENT-SPECS.md if component behavior changes
3. List ALL composed screens that will be affected by this change
4. Do NOT re-compose screens — just document what needs to change

## Output
1. Updated tokens.css
2. Updated COMPONENT-SPECS.md (if needed)
3. Create `.planning/design/system/EVOLUTION-LOG.md` (append):
   ```
   ## Evolution [N] — [date]
   **Trigger:** [what prompted the change]
   **Changes:** [what was modified in tokens/specs]
   **Affected screens:** [list]
   **Reason:** [why this doesn't violate research]
   ```

Commit: `design(evolve): {brief description of change}`
</agent_spawn>

## Step 3: Update State & Advise

Update STATE.md decisions log.
Tell user which screens need re-composition or at minimum a review pass.

## Final Step: Update State

Run `node .claude/get-motif/scripts/motif-state.js update last_command /motif:evolve` and `update last_outcome success`.
Run `node .claude/get-motif/scripts/motif-state.js update updated {ISO_DATE}`.
