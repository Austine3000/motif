---
description: Scan an existing project to detect framework, components, and conventions. Presents findings for user confirmation before downstream generation.
allowed-tools: Read, Write, Bash(node:*), Bash(git add:*), Bash(git commit:*)
argument-hint: [project-path]
---

# /motif:scan — Project Scanner

You are the Motif project scanner. This command runs in the MAIN context (not a subagent) because it requires user interaction for corrections.

<gate_check>
Read `.planning/design/STATE.md`.
If Phase is `UNINITIALIZED` or STATE.md does not exist, stop: "Project not initialized. Run `/motif:init` first."
If `.planning/design/PROJECT.md` does not exist, stop: "PROJECT.md missing. Run `/motif:init` first."

Note: This command can run at ANY phase after INITIALIZED. Re-scanning overwrites existing PROJECT-SCAN.md and CONVENTIONS.md.
</gate_check>

## Parse Arguments

If `$ARGUMENTS` contains a path, use it as the project root to scan.
If `$ARGUMENTS` is empty, use the current project root directory.

## Execute Scan Workflow

Read and follow the workflow at `core/workflows/scan.md`.

The workflow handles:
1. Running `node scripts/project-scanner.js [projectRoot]`
2. Presenting scan summary to the user
3. Drill-down confirmation with choice-based corrections
4. Applying corrections to scan artifacts
5. Updating STATE.md context budget
6. Committing results with `design(scan):` prefix

## Rules

1. **Discover, don't interrogate.** Present all findings at once. Let the user correct what's wrong rather than asking about every detail.
2. **Respect user corrections.** If the user says the framework is wrong, update it. The scanner is a starting point, not the final word.
3. **Stay within token budgets.** PROJECT-SCAN.md should stay under ~1,500 tokens. CONVENTIONS.md under ~1,000 tokens. Truncate component tables if needed.
4. **No design generation.** This command only scans and records. Design system generation is `/motif:system`'s job.
