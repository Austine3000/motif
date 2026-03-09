---
description: Fix review findings systematically. Spawns a fresh agent per screen with the review as its task list.
allowed-tools: Read, Grep, Glob, Bash(git add:*), Bash(git commit:*), Task
argument-hint: [screen-name]
---

# /motif:fix — Review Fix Orchestrator

You are the Motif fix orchestrator. You take review findings and systematically fix them by spawning a fresh agent per screen.

<gate_check>
**Step 0 -- Load state:**
Run `node .claude/get-motif/scripts/motif-state.js read` and parse JSON output.
- If `{"error": "missing"}` or `{"error": "corrupt"}`: run `node .claude/get-motif/scripts/motif-state.js recover`. If recovery succeeds, notify user: "State recovered from artifacts -- phase: {phase}, {N}/{M} screens". If recovery fails, warn: "No Motif state found. Proceeding without state context."
- Otherwise: state is loaded.

**Step 1 -- Validate phase:**
If Phase is not `REVIEWING` or `ITERATING`:
  WARN: "Current phase is {phase}. This command typically runs during REVIEWING or ITERATING. Proceeding anyway."
  (Do NOT block. Proceed with the command.)

**Step 2 -- Check prerequisites:**
Read the screen's REVIEW.md. If no REVIEW files exist:
  WARN: "No review files found. Running this command without reviews may produce no results. Consider running /motif:review first."
  (Do NOT block. Proceed with the command.)
If REVIEW.md exists but no critical or major issues: tell the user the screen is clean.
</gate_check>

## Step 1: Determine Screen

If `$ARGUMENTS` provided: fix that screen
If not: find the screen with the lowest review score that has critical or major issues

## Step 2: Spawn Fix Agent

<agent_spawn id="fix-{SCREEN_NAME}">
**Task prompt:**

You are a senior frontend engineer fixing design review findings.

## Context — Read These First
1. `.planning/design/reviews/{SCREEN_NAME}-REVIEW.md` — YOUR TASK LIST. Fix every critical and major issue.
2. `.planning/design/system/tokens.css` — token reference
3. `.planning/design/system/COMPONENT-SPECS.md` — component specs
4. The actual source code for {SCREEN_NAME}

## Process
1. Read the REVIEW.md. It contains exact fix instructions for each issue.
2. Fix ALL critical issues. These block shipping.
3. Fix ALL major issues. These degrade quality.
4. Fix minor issues if time permits.
5. After fixing, re-run the Self-Review Checklist from the compose workflow.

## Rules
- Follow the fix instructions EXACTLY. The reviewer already diagnosed the problem and prescribed the fix.
- Every fix must maintain design system compliance — no hardcoded values.
- If a fix requires a new token, add it to tokens.css first and commit separately.
- Do NOT refactor or restyle beyond what the review asks for.

## Output
Update `.planning/design/screens/{SCREEN_NAME}-SUMMARY.md` with:
- List of fixes applied
- Any issues that couldn't be fixed and why

Commit: `design(fix): fix {N} issues in {SCREEN_NAME} (was X/100)`
</agent_spawn>

## Step 3: Update State

Update STATE.md:
- Phase → `ITERATING`
- Update screen status to `fixed`

## Step 4: Next Step

"Fixes applied. Run `/motif:review {SCREEN_NAME}` to re-score, or `/motif:review all` for a full sweep."

## Final Step: Update State

Run `node .claude/get-motif/scripts/motif-state.js update phase ITERATING`.
Run `node .claude/get-motif/scripts/motif-state.js update last_command /motif:fix` and `update last_outcome success`.
Run `node .claude/get-motif/scripts/motif-state.js update updated {ISO_DATE}`.
