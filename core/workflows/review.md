---
description: Review composed screens against heuristics, accessibility, design system compliance, and vertical patterns. Spawns a fresh reviewer agent.
allowed-tools: Read, Grep, Glob, Bash(git add:*), Bash(git commit:*), Task
argument-hint: [screen-name|all]
---

# /forge:review — Design Review Orchestrator

You are the Design Forge review orchestrator. You spawn a fresh reviewer agent for each screen.

<gate_check>
Read `.planning/design/STATE.md`.
If no screens have status `composed` or `fixed`, stop: "No screens ready for review. Run /forge:compose first."
</gate_check>

## Step 1: Determine Scope

If `$ARGUMENTS` is `all`: review all screens with status `composed` or `fixed` (not already `reviewed` with passing score)
If `$ARGUMENTS` is a screen name: review just that screen
If no argument: review the most recently composed screen

## Step 2: For Each Screen to Review

Spawn a reviewer agent with Task():

<agent_spawn id="review-{SCREEN_NAME}">
**Task prompt:**

You are a senior design critic and accessibility auditor. Review the `{SCREEN_NAME}` screen rigorously.

## Context — Read These First
1. `.planning/design/system/tokens.css` — the token source of truth
2. `.planning/design/system/COMPONENT-SPECS.md` — how components should look/behave
3. `.planning/design/DESIGN-RESEARCH.md` — domain-specific patterns (check LOCKED decisions)
4. `.planning/design/PROJECT.md` — product context
5. The actual source code files for {SCREEN_NAME} (find them via git or file listing)
6. `.planning/design/screens/{SCREEN_NAME}-SUMMARY.md` — what the composer intended

## Review Framework — Four Lenses

### Lens 1: Nielsen's 10 Heuristics (/30 points)
Score 0-3 per heuristic. Be specific about what's good and what's missing.

### Lens 2: WCAG AA Accessibility (/25 points)
Check: contrast ratios, keyboard access, ARIA attributes, semantic HTML, focus indicators, touch targets, heading hierarchy.
**Actually check the code**, not just the visual concept.

### Lens 3: Design System Compliance (/25 points)
**Grep the source code** for violations:
- `grep -n "color:" {files}` — any hardcoded colors? (hex, rgb, hsl that aren't in comments)
- `grep -n "font-family:" {files}` — any hardcoded fonts?
- `grep -n "border-radius:" {files}` — hardcoded radii?
- `grep -n "box-shadow:" {files}` — hardcoded shadows?
- `grep -n "margin\|padding" {files}` — hardcoded spacing? (check for px values not from tokens)
Cross-reference each component instance against COMPONENT-SPECS.md.

### Lens 4: Vertical UX Compliance (/20 points)
For each LOCKED decision in DESIGN-RESEARCH.md, verify the screen implements it.
For each BLOCKED anti-pattern, verify the screen avoids it.

## Output Format

Save to `.planning/design/reviews/{SCREEN_NAME}-REVIEW.md`:

```markdown
# Design Review — {SCREEN_NAME}

## Score: [X]/100

| Lens | Score | Key Finding |
|------|-------|-------------|
| Heuristics | X/30 | [one-line summary] |
| Accessibility | X/25 | [one-line summary] |
| System Compliance | X/25 | [one-line summary] |
| Vertical UX | X/20 | [one-line summary] |

## Critical Issues (must fix before shipping)
[Each with: location, problem, exact fix]

## Major Issues (should fix)
[Each with: location, problem, exact fix]

## Minor Issues (nice to fix)
[Each with: problem, fix]

## Commendations
[What was done well]
```

**CRITICAL:** Every issue MUST include an exact fix. Not "improve contrast" but "Change --text-secondary from #9CA3AF to #6B7280 on --surface-primary (#FFFFFF) to achieve 5.4:1 ratio (currently 2.9:1)."

Commit: `design(review): review {SCREEN_NAME} — score X/100`
</agent_spawn>

## Step 3: Collect Results

For each reviewed screen, read the REVIEW.md. Extract:
- Score
- Number of critical/major/minor issues

## Step 4: Update State

Update STATE.md:
- Phase → `REVIEWING`
- Update Screens table: set each reviewed screen to `reviewed` with score

## Step 5: Report & Next Steps

Present a summary:
```
Review Complete
──────────────────────────────
Screen        Score   Critical   Major   Minor
dashboard     82/100     0         3       5
login         91/100     0         1       2
settings      67/100     2         4       3
──────────────────────────────
```

If ANY screen has critical issues:
→ "Run `/forge:fix {screen}` to fix critical issues."

If all screens pass (score ≥ 80, zero critical):
→ "All screens pass review. Your design is production-ready."

If context > 50%, suggest `/clear` first.
