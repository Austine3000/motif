---
description: Scan an existing project to detect framework, components, and conventions. Presents findings for user confirmation.
allowed-tools: Read, Write, Bash(node:*), Bash(git add:*), Bash(git commit:*)
---

<path_resolution>
{MOTIF_ROOT} resolves to the directory where Motif core files are installed.
Claude Code: .claude/get-motif
OpenCode: .opencode/get-motif
Gemini: .gemini/get-motif
Cursor: .motif
The installer sets this path. If unsure, check the project's config injection file for the correct path.
</path_resolution>

# Scan Workflow — Project Scanner Orchestrator

You are running the scan workflow. This runs in the MAIN context (not a subagent) because it requires user interaction for corrections.

Core principle: **"Motif discovers, the user decides, the agents execute."**

The scan should feel instant and informative — detect, present, confirm. Not a long interrogation. Present everything at once, let the user correct what's wrong.

## Step 1: Run Scanner

Determine the project root from `$ARGUMENTS` (if provided) or use the current working directory.

```bash
node scripts/project-scanner.js [projectRoot]
```

This generates two files:
- `.planning/design/PROJECT-SCAN.md` — framework, CSS approach, directory structure, component catalog
- `.planning/design/CONVENTIONS.md` — styling and code conventions with inconsistency reporting

If the scanner fails, stop and report the error. Do NOT proceed with empty results.

## Step 1b: Run Token Extractor

After project-scanner.js completes successfully, run the token extractor:

```bash
node scripts/token-extractor.js [projectRoot]
```

This generates `.planning/design/TOKEN-INVENTORY.md` if design tokens are found in the project (CSS custom properties, Tailwind config theme customizations, or JS theme files).

If the extractor finds zero tokens, no file is created — this is normal for projects without custom design tokens. Do NOT treat this as an error.

If the extractor fails, log the error but continue with the scan — token extraction is optional enrichment, not a blocking requirement.

## Step 2: Read Scanner Output

Read the generated files:
- `.planning/design/PROJECT-SCAN.md`
- `.planning/design/CONVENTIONS.md`
- `.planning/design/TOKEN-INVENTORY.md` (if it exists)

Parse the key findings for presentation.

## Step 3: Present Summary

Show a compact overview to the user:

```
## Scan Results

- **Framework:** [name] [version] (confidence: [HIGH/MEDIUM/LOW])
- **CSS Approach:** [approaches] (confidence: [HIGH/MEDIUM/LOW])
- **Components:** [N] found across [M] directories
- **Conventions:** [key findings summary]
- **Design Tokens:** [N] found ([X]% Motif coverage) OR "None detected"
```

Keep this brief — the user sees the big picture first.

**Note:** The "Design Tokens" line only appears if `.planning/design/TOKEN-INVENTORY.md` exists. If no tokens were found, show "None detected" — do NOT omit the line entirely when the extractor ran.

## Step 4: Drill-Down Confirmation

For each major section, present findings with choice-based corrections. The user decides.

### 4a. Framework Detection

"I detected **[framework]** [version]. Correct?"
- Yes
- No, it's [Y]
- Other

If the user corrects, note the correction for Step 5.

### 4b. CSS Approach

"I detected **[CSS approach]**. Correct?"
- Yes
- No, it's [Y]
- Other

### 4c. Component Catalog

Show the component catalog grouped by directory:

```
### Components Found

**src/components/ui/** — [N] components
| Name | Type | Confidence | Props |
|------|------|-----------|-------|
| Button | primitive | HIGH | variant, size, children |
| ... | ... | ... | ... |

**src/features/** — [N] components
| ... |
```

"Review the component catalog above. Any corrections?"
- Looks good
- I want to adjust some

If adjusting: let the user reclassify confidence or category for specific components. Example: "Change DataChart from LOW to HIGH" or "Remove TestWrapper — it's not a real component."

### 4d. Conventions

Show key findings with any inconsistencies (if TOKEN-INVENTORY.md does not exist, skip to Step 4d conventions below):

```
### Conventions Detected

- **Border radius:** 60% use rounded-lg, 40% use rounded-md
- **Spacing:** Consistent 4px base unit
- **Colors:** Tailwind defaults with custom primary palette
- **Import style:** 80% named imports, 20% default
- **Naming:** PascalCase components, camelCase utils
```

"These are the patterns I found. Any corrections?"
- Looks good
- Override: [X should be Y]

### 4e. Token Review

**Only show this section if `.planning/design/TOKEN-INVENTORY.md` exists.**

Present the token summary with per-category coverage:

```
### Tokens Detected

- **Colors:** [N] tokens ([X]% coverage) — mapped: [list], missing: [list]
- **Typography:** [N] tokens ([X]% coverage)
- **Spacing:** [N] tokens ([X]% coverage)
- **Radii:** [N] tokens ([X]% coverage)
- **Shadows:** [N] tokens ([X]% coverage)
- **Transitions:** [N] tokens ([X]% coverage)

"These are the token mappings I found. Any corrections?"
- Looks good
- Override: [mapping X should be Y]
```

If the user provides overrides, note them for Step 5.

**If TOKEN-INVENTORY.md does NOT exist, skip this section entirely.** Do not mention tokens to the user if no tokens were found.

## Step 5: Apply Corrections

If the user made any corrections in Step 4:

1. Read the current PROJECT-SCAN.md, CONVENTIONS.md, and TOKEN-INVENTORY.md (if it exists)
2. Apply each correction:
   - Framework/CSS changes: update the detection section
   - Component reclassification: update confidence or category
   - Component removal: remove from catalog
   - Convention overrides: update the relevant convention entry
   - Token mapping overrides: update the Motif Equivalent column in TOKEN-INVENTORY.md
3. Write the corrected files back

If no corrections were made, skip this step.

## Step 6: Confirm Completion

Tell the user:

"Scan complete. Results saved to:
- `.planning/design/PROJECT-SCAN.md`
- `.planning/design/CONVENTIONS.md`
- `.planning/design/TOKEN-INVENTORY.md` (if tokens were found)

You can manually edit these files before running `/motif:system`. The design system generator will use these findings for brownfield-aware token generation."

## Step 7: Update STATE.md

Read `.planning/design/STATE.md` and update it:

1. Add PROJECT-SCAN.md and CONVENTIONS.md to the Context Budget table:
   ```
   | PROJECT-SCAN.md | ~1,200 | <=1,500 |
   | CONVENTIONS.md | ~800 | <=1,000 |
   | TOKEN-INVENTORY.md | ~1,000 | <=1,500 |
   ```

   **Note:** Only add TOKEN-INVENTORY.md to the table if the file was generated. If no tokens were found, omit it.

2. Append to Decisions Log:
   - `[date] Project scanned: [framework] detected, [N] components cataloged`

3. Do NOT change the Phase field — scan is a pre-step, not a state change.

## Step 8: Commit

```bash
git add .planning/design/PROJECT-SCAN.md .planning/design/CONVENTIONS.md .planning/design/STATE.md
# Only add TOKEN-INVENTORY.md if it exists
[ -f .planning/design/TOKEN-INVENTORY.md ] && git add .planning/design/TOKEN-INVENTORY.md
git commit -m "design(scan): scan project — [framework], [N] components found"
```

## Step 9: Next Step

"You can now run `/motif:research` or `/motif:system`. Scan findings will inform design system generation."

If the user just came from `/motif:init` (brownfield auto-scan), this step is handled by init — do NOT suggest next steps.
