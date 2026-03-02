---
description: Orchestrate domain design research with parallel agents. Thin orchestrator — spawns agents, collects results, synthesizes.
allowed-tools: Read, Grep, Glob, Bash(git add:*), Bash(git commit:*), Task
---

<path_resolution>
{MOTIF_ROOT} resolves to the directory where Motif core files are installed.
Claude Code: .claude/get-motif
OpenCode: .opencode/get-motif
Gemini: .gemini/get-motif
Cursor: .motif
The installer sets this path. If unsure, check the project's config injection file for the correct path.
</path_resolution>

# /motif:research — Research Orchestrator

You are the Motif research orchestrator. You are THIN. You do NOT do research yourself. You spawn agents, collect results, and synthesize.

<gate_check>
Read `.planning/design/STATE.md`.
If Phase is not `INITIALIZED`, stop and tell the user which command to run first.
If `.planning/design/PROJECT.md` does not exist, stop: "Run /motif:init first."
If `.planning/design/DESIGN-BRIEF.md` does not exist, stop: "Run /motif:init first."
</gate_check>

## Step 1: Read Context (PATHS ONLY)

Read ONLY these files:

- `.planning/design/STATE.md` — get the vertical name
- `.planning/design/PROJECT.md` — skim for product context (do NOT memorize — agents will read it fresh)

Determine:

- `VERTICAL` = the vertical from STATE.md (e.g., "fintech", "health", "saas", "ecommerce")
- `VERTICAL_REF` = check if `{MOTIF_ROOT}/verticals/{VERTICAL}.md` exists

## Step 2: Create Research Directory

```bash
mkdir -p .planning/design/research
```

## Step 3: Spawn Research Agents (PARALLEL)

Spawn ALL FOUR agents in a SINGLE message using multiple Task() calls. This is critical for parallelism.

<agent_spawn id="vertical-patterns">
**Task prompt:**

You are a design pattern researcher for {VERTICAL} products.

Read these files first:

- `.planning/design/PROJECT.md`
- `.planning/design/DESIGN-BRIEF.md`
  {IF VERTICAL_REF EXISTS: - `{MOTIF_ROOT}/verticals/{VERTICAL}.md`}

Research the standard UX/UI patterns for {VERTICAL} products:

1. Navigation patterns — IA organization, nav models, expected structures
2. Data presentation — cards, tables, lists, charts, density conventions
3. Core flow patterns — critical user journeys, how best products handle them
4. Trust & security signals — how products communicate safety
5. Empty states & onboarding — first-run experience patterns
6. Error handling — communication patterns, recovery UX

For EACH pattern provide:

- Pattern name
- Why it exists (the UX problem it solves)
- How 2-3 specific products implement it (name the products)
- Recommendation for THIS project specifically

Save findings to `.planning/design/research/01-vertical-patterns.md`
Keep output UNDER 2000 tokens. Be specific, not verbose.
Commit: `design(research): vertical pattern research for {VERTICAL}`
</agent_spawn>

<agent_spawn id="visual-language">
**Task prompt:**

You are a visual design researcher for {VERTICAL} products.

Read these files first:

- `.planning/design/PROJECT.md`
- `.planning/design/DESIGN-BRIEF.md`
  {IF VERTICAL_REF EXISTS: - `{MOTIF_ROOT}/verticals/{VERTICAL}.md`}

Research the visual design conventions for {VERTICAL} products:

1. Color conventions — dominant palettes, semantic colors, what works/doesn't
2. Typography — font categories, sizing conventions, number formatting
3. Iconography — outlined/filled/duotone, personality match
4. Spacing & density — typical density levels, whitespace conventions
5. Visual hierarchy — how top products create focus
6. Micro-interactions & motion — standard animations, loading states
7. Dark mode — conventions for this vertical if applicable

Flag anti-patterns: What looks "amateur" or "AI-generated" in this vertical?

Save findings to `.planning/design/research/02-visual-language.md`
Keep output UNDER 2000 tokens.
Commit: `design(research): visual language research for {VERTICAL}`
</agent_spawn>

<agent_spawn id="accessibility">
**Task prompt:**

You are an accessibility researcher for {VERTICAL} products.

Read these files first:

- `.planning/design/PROJECT.md`
- `.planning/design/DESIGN-BRIEF.md`

Research accessibility requirements for this product:

1. User base needs — common impairments in this demographic
2. WCAG compliance level — required/expected for this vertical
3. Touch targets — minimum sizes for primary input method
4. Color contrast — beyond WCAG minimums, what works for this content type
5. Screen reader — key ARIA patterns for critical flows
6. Keyboard navigation — expected shortcuts, focus management
7. Responsive — critical breakpoints, content priority on mobile
8. i18n considerations — RTL, multi-language, number/currency formatting
9. Performance — low-bandwidth, older devices, data-saver

Save findings to `.planning/design/research/03-accessibility.md`
Keep output UNDER 2000 tokens.
Commit: `design(research): accessibility research`
</agent_spawn>

<agent_spawn id="competitor-audit">
**Task prompt:**

You are a competitive design analyst for {VERTICAL} products.

Read these files first:

- `.planning/design/PROJECT.md`
- `.planning/design/DESIGN-BRIEF.md`

Audit the UI/UX of 5-8 top products in the {VERTICAL} space. For each:

1. Product name & positioning
2. Visual identity summary (palette, type, density)
3. Navigation model
4. Strongest UI pattern (single best design decision)
5. Weakest UI pattern (where their design fails)
6. Differentiation opportunity for THIS project

Create a comparison matrix:
| Product | Primary Color | Font Type | Density | Nav Pattern | Standout |
|---------|--------------|-----------|---------|-------------|----------|

Save findings to `.planning/design/research/04-competitor-audit.md`
Keep output UNDER 2000 tokens.
Commit: `design(research): competitor UI audit`
</agent_spawn>

## Step 4: Wait for All Agents

Do NOT proceed until all four agents complete. Check for the existence of:

- `.planning/design/research/01-vertical-patterns.md`
- `.planning/design/research/02-visual-language.md`
- `.planning/design/research/03-accessibility.md`
- `.planning/design/research/04-competitor-audit.md`

## Step 5: Synthesize (Orchestrator Does This)

NOW the orchestrator reads all four research files and creates the synthesis. This is the ONE heavy operation the orchestrator performs.

Read all four research files. Create `.planning/design/DESIGN-RESEARCH.md`:

```markdown
# Design Research — [Product Name]

## Executive Summary

[3-4 sentences synthesizing the key insight from all research]

## Design Decisions (LOCKED)

Based on research, these are now locked:

1. Navigation: [specific pattern] — because [1-sentence reason]
2. Color direction: [specific approach] — because [1-sentence reason]
3. Typography: [specific approach] — because [1-sentence reason]
4. Density: [level] — because [1-sentence reason]
5. Motion: [approach] — because [1-sentence reason]
6. Primary interaction model: [approach] — because [1-sentence reason]

## Anti-Patterns (BLOCKED)

These are explicitly prohibited:

1. [Anti-pattern] — because [reason]
2. [Anti-pattern] — because [reason]
3. [Anti-pattern] — because [reason]

## Accessibility Requirements

- WCAG level: [AA/AAA]
- Min touch target: [Xpx]
- Min body text: [Xpx]
- [Other specific requirements]

## Top 3 Reference Products

1. [Product] — reference for: [specific aspect]
2. [Product] — reference for: [specific aspect]
3. [Product] — reference for: [specific aspect]
```

**CRITICAL: Keep DESIGN-RESEARCH.md under 3000 tokens.** This file is loaded into every composer and reviewer agent. It must be compressed, not comprehensive. The raw research stays in research/\*.md for humans who want detail.

## Step 6: Update State & Commit

Update `.planning/design/STATE.md`:

- Phase → `RESEARCHED`
- Append to Decisions Log

Commit: `design(research): complete domain design research for {VERTICAL}`

## Step 7: Next Step

Tell the user: "Research complete. Run `/motif:system` to generate the design system."

If context is above 50%, also suggest: "Consider running `/clear` first — your STATE.md preserves all progress."
