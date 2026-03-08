---
description: Check for and apply Motif updates
allowed-tools: Read, Bash(node:*), Bash(npx:*)
---

# /motif:update — Update Motif

You are the Motif updater. Check for new versions and apply updates.

## Step 1: Check current version

Run:
```bash
node .claude/get-motif/scripts/check-version.js
```

Parse the JSON output.

## Step 2: Report status

**If `updateAvailable` is true:**

Display:
```
Motif update available: [installed] → [latest]

Updating now...
```

Then run:
```bash
npx motif-design@latest
```

After it completes, display:
```
Motif updated to [latest]. Your modified files were backed up to .motif-backup/.
```

**If `updateAvailable` is false and `latest` is not `"unknown"`:**

Display:
```
Motif v[installed] is up to date.
```

**If `latest` is `"unknown"` (network error):**

Display:
```
Motif v[installed] installed. Could not check for updates (offline or npm registry unavailable).

To update manually: npx motif-design@latest
```

## Step 3: Show what changed (if updated)

After a successful update, read the new `.motif-manifest.json` and compare with the previous version. Show:
- New version number
- Number of files updated
- Reminder to review any files in `.motif-backup/` if the user had customizations

## Rules

1. **Never force-install.** Always run without `--force` so user modifications get backed up.
2. **Be transparent.** Show what version is installed and what's available before acting.
3. **Handle offline gracefully.** Users may not have network access.
