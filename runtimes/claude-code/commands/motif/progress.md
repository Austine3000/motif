---
description: Show current Motif project status and next steps
allowed-tools: Read, Bash(node:*)
---

# /motif:progress — Project Status

## Step 1: Version check

Run:
```bash
node .claude/get-motif/scripts/check-version.js
```

Parse the JSON output. If `updateAvailable` is true, display at the top:

```
⬆ Motif update available: [installed] → [latest]. Run /motif:update to upgrade.
```

If the check fails or latest is unknown, just show the installed version silently.

## Step 2: Project status

Read `.planning/design/STATE.md` and display:
1. Current phase
2. Screen status table
3. Context budget usage
4. Recent decisions
5. Recommended next command

If STATE.md doesn't exist: "No project initialized. Run /motif:init."

## Step 3: Footer

Always show at the bottom:
```
Motif v[installed] | /motif:help for commands
```
