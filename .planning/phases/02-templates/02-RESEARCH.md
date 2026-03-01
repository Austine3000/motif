# Phase 2: Templates - Research

**Researched:** 2026-03-01
**Domain:** Markdown output templates and standalone HTML for a design engineering system (no external libraries -- pure static files)
**Confidence:** HIGH

## Summary

Phase 2 creates three template files that formalize the output formats agents produce. Unlike Phase 1 (which created agent definitions from scratch), Phase 2's templates are almost entirely dictated by existing source-of-truth files: `core/references/state-machine.md` defines the STATE-TEMPLATE format, `core/workflows/compose-screen.md` defines the SUMMARY-TEMPLATE format, and `core/workflows/generate-system.md` defines what the token showcase must display. The creative freedom is narrow and constrained to the token showcase HTML's visual design.

The templates live in `core/templates/` alongside the existing `VERTICAL-TEMPLATE.md`. They are runtime-agnostic (pure markdown and HTML) and will be installed to the user's project via the installer in Phase 3. The templates are consumed by workflow orchestrators when initializing design state (STATE-TEMPLATE), by composer agents when creating screen summaries (SUMMARY-TEMPLATE), and by the system architect agent when generating the token showcase (token-showcase HTML as a structural starting point). All three requirements (TMPL-01, TMPL-02, TMPL-03) are essentially extraction and formalization tasks -- the formats already exist inline in other files; they just need to be pulled into standalone reusable templates.

**Primary recommendation:** Extract each template directly from its source-of-truth file. STATE-TEMPLATE.md from state-machine.md's "STATE.md Format" section. SUMMARY-TEMPLATE.md from compose-screen.md's "Create Summary" section. Token showcase HTML from generate-system.md's "Output 4" specification. Use placeholder syntax (`{VARIABLE}`) for values that get filled at runtime. Keep templates minimal -- they are structural blueprints, not comprehensive documentation.

## Standard Stack

### Core

| Technology | Format | Purpose | Why Standard |
|------------|--------|---------|--------------|
| Markdown (`.md`) | Standard markdown with placeholder variables | STATE-TEMPLATE.md and SUMMARY-TEMPLATE.md | Matches all existing project artifacts; agents produce markdown; no build step needed |
| HTML + CSS | Single `.html` file with inline `<style>` | Token showcase page | Self-contained requirement (success criterion 3); no bundler, no framework, no external dependencies except Google Fonts CDN |
| CSS Custom Properties | `var(--token-name)` references in HTML | Token showcase reads from `tokens.css` | The token format used throughout the entire project; showcase imports the generated `tokens.css` to display actual values |

### Supporting

| Technology | Purpose | When to Use |
|------------|---------|-------------|
| Google Fonts CDN | Font loading in token showcase | Only in token-showcase.html; the showcase must render the project's chosen fonts to be useful as a visual reference |
| `{VARIABLE}` placeholder syntax | Dynamic values in templates | Use `{UPPER_SNAKE}` for values the orchestrator or agent fills in at runtime (e.g., `{VERTICAL}`, `{SCREEN_NAME}`, `{ISO_DATE}`) |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Single HTML file with inline CSS | HTML + separate CSS file | Self-contained requirement rules this out; template must be one file that opens in any browser |
| JavaScript-driven token rendering | Pure CSS + HTML structure | JS would allow dynamic token reading from CSS, but adds complexity; the system architect agent fills in actual values when generating, so static HTML with CSS custom property references is sufficient |
| Jinja/Handlebars template syntax | Plain `{VARIABLE}` markers | Template engines add a dependency; simple string replacement in the agent's output is sufficient since agents generate the final file, not a build tool |

## Architecture Patterns

### Template File Placement

```
core/templates/
├── VERTICAL-TEMPLATE.md       # Already exists (read-only)
├── STATE-TEMPLATE.md           # TMPL-01: New
├── SUMMARY-TEMPLATE.md         # TMPL-02: New
└── token-showcase-template.html # TMPL-03: New
```

All templates install to `{FORGE_ROOT}/templates/` in the user project (e.g., `.claude/get-design-forge/templates/` for Claude Code). The installer mapping already handles this directory per `runtime-adapters.md`.

### Pattern 1: Extract-and-Formalize (Template Derivation)

**What:** Each template is derived directly from an existing source-of-truth file. The source file defines the format; the template file makes it reusable.

**When to use:** All three templates.

**How it works:**
1. Identify the source-of-truth file that defines the format
2. Extract the format/structure from that file
3. Replace concrete values with `{PLACEHOLDER}` variables
4. Add brief usage comments at the top of the template
5. Verify the template can regenerate the example shown in the source file

**Source mapping:**

| Template | Source of Truth | Section to Extract From |
|----------|----------------|------------------------|
| STATE-TEMPLATE.md | `core/references/state-machine.md` | "STATE.md Format" (lines 83-113) |
| SUMMARY-TEMPLATE.md | `core/workflows/compose-screen.md` | "Create Summary" section E (lines 106-127) |
| token-showcase-template.html | `core/workflows/generate-system.md` | "Output 4: token-showcase.html" (lines 302-311) + token file format (lines 151-251) |

### Pattern 2: Placeholder Variable Convention

**What:** Templates use `{UPPER_SNAKE_CASE}` for values filled at runtime and `[description]` for sections where the agent provides content.

**When to use:** STATE-TEMPLATE.md and SUMMARY-TEMPLATE.md.

**Convention:**
- `{VARIABLE}` -- replaced by the orchestrator/workflow with a known value (e.g., `{VERTICAL}`, `{ISO_DATE}`, `{SCREEN_NAME}`)
- `[description text]` -- the agent writes original content here (e.g., `[detected vertical]`, `[List all design system components]`)
- Static text -- copied verbatim into the output

**Rationale:** This matches the convention already used in the workflow files (e.g., `{SCREEN_NAME}` in compose-screen.md and review.md).

### Pattern 3: Self-Contained HTML (Token Showcase)

**What:** The token showcase is a single HTML file with all CSS inline in a `<style>` block. It imports two external resources: `tokens.css` (relative path) and Google Fonts CDN (for font rendering). No JavaScript frameworks, no build tools, no other external dependencies.

**When to use:** TMPL-03 only.

**Structure:**
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{PRODUCT_NAME} Design Tokens</title>
  <link rel="stylesheet" href="tokens.css">
  <link href="https://fonts.googleapis.com/css2?family={FONT_FAMILIES}" rel="stylesheet">
  <style>
    /* All showcase layout/presentation styles inline here */
  </style>
</head>
<body>
  <!-- Color swatches section -->
  <!-- Typography scale section -->
  <!-- Spacing visualization section -->
  <!-- Component previews section -->
</body>
</html>
```

**Key constraint:** The success criterion says "no external dependencies." Google Fonts CDN is the one exception documented in the system architect's agent definition (line 88: "imports tokens.css and Google Fonts CDN only, no other external dependencies") and the quality checklist (line 103: "Token showcase HTML is self-contained (no external dependencies except Google Fonts CDN)"). The `tokens.css` import is a relative sibling file (both live in `.planning/design/system/`), not an external dependency.

### Anti-Patterns to Avoid

- **Do NOT create templates that duplicate workflow instructions.** Templates define OUTPUT FORMAT only, not process steps. The workflow already tells the agent what to do; the template shows the agent what the output should look like.
- **Do NOT add sections beyond what the source-of-truth defines.** STATE-TEMPLATE.md must match state-machine.md's format. SUMMARY-TEMPLATE.md must match compose-screen.md's format. Adding extra sections creates drift between the template and its source.
- **Do NOT use JavaScript in the token showcase template.** The system architect agent fills in actual token values when generating. The template provides HTML/CSS structure; the agent populates concrete values. No runtime JavaScript needed.
- **Do NOT hardcode specific token values in the showcase template.** Use CSS custom property references (`var(--color-primary-500)`) so the showcase automatically reflects whatever tokens the system architect generates.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Token color swatch rendering | JavaScript-based color extraction | CSS `background-color: var(--token-name)` with `::after` pseudo-elements for hex labels | Pure CSS approach; the system architect writes actual hex values into the showcase; no JS needed |
| Contrast ratio display in showcase | Runtime contrast calculation | Pre-calculated ratios in HTML comments by the system architect agent | The system architect already calculates contrast ratios for tokens.css comments; it can embed them in the showcase too |
| Template variable expansion | Custom template engine | Agent string replacement during file generation | Agents generate the final files; templates are reference structures, not processed through a build pipeline |

**Key insight:** These templates are consumed by AI agents, not by build tools. The agents read the template to understand the expected format, then generate the output file. The "variable expansion" happens in the agent's reasoning, not in code. Templates must be clear to an LLM reader, not machine-parseable.

## Common Pitfalls

### Pitfall 1: Token Showcase Breaks When Opened Without tokens.css

**What goes wrong:** The HTML file references `tokens.css` via relative path. If someone moves the HTML file or opens it from a different directory, `tokens.css` is not found and the entire showcase renders with missing styles.
**Why it happens:** The HTML uses `<link rel="stylesheet" href="tokens.css">` assuming both files are siblings in `.planning/design/system/`.
**How to avoid:** Include a `<noscript>` / fallback message: "This showcase requires tokens.css in the same directory." Add a CSS fallback that shows a visible warning if custom properties are undefined (e.g., `body::before { content: "tokens.css not found"; }` with `@supports` to hide when tokens load). The system architect agent generates both files to the same directory, so in normal operation this is not an issue.
**Warning signs:** Showcase page appears with no colors, no fonts, or completely unstyled content.

### Pitfall 2: STATE-TEMPLATE Drifts from State Machine Reference

**What goes wrong:** STATE-TEMPLATE.md evolves independently from `state-machine.md`, creating an inconsistency where the template produces STATE.md files that don't match what gate checks expect.
**Why it happens:** Two files defining the same format without a single source of truth.
**How to avoid:** Add a comment at the top of STATE-TEMPLATE.md: `<!-- Source of truth: core/references/state-machine.md — keep in sync -->`. During Phase 7 validation, verify that a STATE.md generated from the template passes all gate checks in the workflows.
**Warning signs:** Gate checks failing with unexpected format errors.

### Pitfall 3: SUMMARY-TEMPLATE Missing Fields That Reviewer Expects

**What goes wrong:** SUMMARY-TEMPLATE.md defines a format, but the reviewer agent (which reads summaries for context) expects specific fields that are missing.
**Why it happens:** The template is derived from compose-screen.md, but the reviewer's context loading profile also references summaries. If the template omits a field the reviewer depends on, reviews become less accurate.
**How to avoid:** Cross-reference the reviewer agent's context profile with the summary format. The reviewer loads `{screen}-SUMMARY.md` to compare "intent vs. implementation." Ensure the summary template includes: components used, key tokens referenced, vertical patterns applied, states implemented, and files created -- exactly as specified in compose-screen.md section E.
**Warning signs:** Reviewer makes incorrect assumptions about screen intent because summary is incomplete.

### Pitfall 4: Token Showcase Template Too Rigid for Different Verticals

**What goes wrong:** The showcase template assumes a fixed set of token categories. When a vertical adds vertical-specific tokens (e.g., fintech's `font-variant-numeric: tabular-nums`), they are not displayed.
**Why it happens:** The template hardcodes sections for colors, typography, spacing, and radii but doesn't include a "vertical-specific" section.
**How to avoid:** Include a "Vertical-Specific Tokens" section in the showcase template. The token file format in generate-system.md already has a `/* -- Vertical-Specific -- */` section at the bottom. The showcase template should mirror this with a catch-all display section. The system architect agent fills it in based on the actual vertical.
**Warning signs:** Token showcase does not display vertical-specific tokens that exist in tokens.css.

### Pitfall 5: Google Fonts CDN Link Hardcoded with Wrong Families

**What goes wrong:** The showcase template includes a Google Fonts link with placeholder font families, but the system architect generates different fonts.
**Why it happens:** Template has a static `<link>` tag that doesn't match the dynamically chosen fonts.
**How to avoid:** The template should use a clear placeholder: `<link href="https://fonts.googleapis.com/css2?family={FONT_FAMILIES_ENCODED}" rel="stylesheet">`. The system architect agent replaces this with the actual font families chosen during system generation. Document this placeholder clearly in the template.
**Warning signs:** Showcase renders in fallback system fonts instead of the design system's chosen fonts.

## Code Examples

### STATE-TEMPLATE.md Structure (derived from state-machine.md lines 83-113)

```markdown
# Design Forge State

## Phase
INITIALIZED

## Vertical
{VERTICAL}

## Stack
{STACK}

## Screens
| # | Screen | Status | Review Score | Last Updated |
|---|--------|--------|-------------|-------------|

## Decisions Log
- {ISO_DATE} Project initialized

## Context Budget
| File | Tokens (approx) | Budget |
|---|---|---|
| PROJECT.md | ~800 | <=1,000 |
| DESIGN-BRIEF.md | ~600 | <=1,000 |
| DESIGN-RESEARCH.md | — | <=3,000 |
| tokens.css | — | <=3,000 |
| COMPONENT-SPECS.md | — | <=5,000 |
```

**Source:** `core/references/state-machine.md` "STATE.md Format" section. Note: the initial phase is `INITIALIZED` because STATE.md is created by `/forge:init` which transitions from `UNINITIALIZED` to `INITIALIZED`.

### SUMMARY-TEMPLATE.md Structure (derived from compose-screen.md lines 107-127)

```markdown
# Screen: {SCREEN_NAME}

## Components Used
[List all design system components used in this screen]

## Key Tokens Referenced
[List the primary tokens this screen depends on]

## Vertical Patterns Applied
[Which LOCKED decisions from DESIGN-RESEARCH.md were implemented]

## States
- Default [checkmark_or_x]
- Loading [checkmark_or_x]
- Empty [checkmark_or_x]
- Error [checkmark_or_x]

## Files Created
[List all files created/modified for this screen]
```

**Source:** `core/workflows/compose-screen.md` section E "Create Summary." This is the exact format the compose orchestrator expects to read in Step 4 to verify the agent completed successfully.

### Token Showcase HTML Structure (derived from generate-system.md lines 302-311)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{PRODUCT_NAME} — Design Tokens</title>
  <link rel="stylesheet" href="tokens.css">
  <link href="https://fonts.googleapis.com/css2?family={FONT_FAMILIES}" rel="stylesheet">
  <style>
    /* Reset + showcase layout styles */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--font-body);
      background: var(--surface-primary);
      color: var(--text-primary);
      padding: var(--space-8);
      line-height: var(--leading-normal);
    }
    h1, h2, h3 { font-family: var(--font-display); }
    /* ... section layout styles ... */
    .swatch {
      width: 80px; height: 80px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-primary);
    }
    .swatch-label { font-family: var(--font-mono); font-size: var(--text-xs); }
    /* ... typography scale preview styles ... */
    /* ... spacing visualization styles ... */
    /* ... component preview styles ... */
  </style>
</head>
<body>
  <header>
    <h1>{PRODUCT_NAME} Design Tokens</h1>
    <p>Vertical: {VERTICAL} | Generated: {ISO_DATE}</p>
  </header>

  <section id="colors">
    <h2>Color Palette</h2>
    <!-- Primary scale: 50-950 swatches with hex labels -->
    <!-- Semantic colors: success, error, warning, info -->
    <!-- Surface colors: primary, secondary, tertiary, elevated -->
    <!-- Text colors: primary, secondary, tertiary, inverse, link -->
    <!-- Border colors: primary, focus -->
  </section>

  <section id="typography">
    <h2>Typography Scale</h2>
    <!-- Font family display -->
    <!-- Each scale step rendered at its actual size -->
    <!-- Weight samples -->
  </section>

  <section id="spacing">
    <h2>Spacing Scale</h2>
    <!-- Visual bars showing each spacing value -->
  </section>

  <section id="radii">
    <h2>Border Radius</h2>
    <!-- Boxes with each radius applied -->
  </section>

  <section id="shadows">
    <h2>Shadows</h2>
    <!-- Boxes with each shadow applied -->
  </section>

  <section id="components">
    <h2>Component Previews</h2>
    <!-- One preview per core component: Button, Input, Card, Badge -->
  </section>

  <section id="vertical-specific">
    <h2>Vertical-Specific Tokens</h2>
    <!-- Any tokens unique to this vertical -->
  </section>
</body>
</html>
```

**Source:** `core/workflows/generate-system.md` "Output 4" + token file format. The system architect agent uses this template as a structural starting point and fills in actual values, swatches, and component previews based on the generated tokens.

## Relationship to Consumers

### Who Consumes Each Template

| Template | Primary Consumer | How It's Used |
|----------|-----------------|---------------|
| STATE-TEMPLATE.md | `/forge:init` workflow (orchestrator) | Copies template, replaces `{VERTICAL}` and `{STACK}` and `{ISO_DATE}`, saves as `.planning/design/STATE.md` |
| SUMMARY-TEMPLATE.md | Screen composer agent (via compose-screen.md workflow) | Agent reads template to understand expected output format, generates `{screen}-SUMMARY.md` matching the structure |
| token-showcase-template.html | System architect agent (via generate-system.md workflow) | Agent reads template for HTML structure, fills in actual token swatches/previews, saves as `token-showcase.html` |

### Who Reads the Generated Output

| Generated File | Read By | Purpose |
|----------------|---------|---------|
| STATE.md | Every workflow orchestrator | Gate checks (phase validation), screen tracking, context budget monitoring |
| {screen}-SUMMARY.md | Compose orchestrator (Step 4), Reviewer (load_if_exists), Future composer agents (cross-screen consistency) | Verify composition complete, compare intent vs implementation, maintain consistency |
| token-showcase.html | User (opens in browser) | Visual verification of the design system |

## Open Questions

1. **Should the token showcase template use JavaScript for dynamic rendering?**
   - What we know: The success criterion says "self-contained page (no external dependencies)." The system architect's quality checklist says "no external dependencies except Google Fonts CDN." The generate-system.md workflow says "Self-contained, no dependencies."
   - What's unclear: Whether a small inline `<script>` block to dynamically read CSS custom properties and render them would be acceptable, vs. the agent statically writing all values.
   - Recommendation: No JavaScript. The system architect agent writes concrete values into the HTML when generating. This is simpler, more reliable (works even if tokens.css path breaks), and matches the "self-contained" requirement more strictly. The template provides HTML/CSS structure; the agent fills in concrete content. **Confidence: HIGH** -- all source documents point to agent-generated static content.

2. **Template naming: `token-showcase-template.html` vs `TOKEN-SHOWCASE-TEMPLATE.html`**
   - What we know: Existing template uses UPPER_CASE (`VERTICAL-TEMPLATE.md`). STATE and SUMMARY templates follow this convention. But HTML files in the project use lowercase (`token-showcase.html`).
   - What's unclear: Whether to use HTML naming convention (lowercase) or project template convention (UPPER_CASE).
   - Recommendation: Use lowercase `token-showcase-template.html` for the template file. Reason: the generated output file is `token-showcase.html` (lowercase, as specified in generate-system.md). Using the same casing but with `-template` suffix makes the relationship clear. The markdown templates use UPPER_CASE because their outputs are UPPER_CASE (`STATE.md`, `SUMMARY.md`). **Confidence: HIGH** -- follows existing naming patterns in both conventions.

3. **How much visual design goes into the token showcase template?**
   - What we know: The template is a structural starting point. The system architect agent generates the final file with actual values. The showcase needs to display colors, typography, spacing, and component previews.
   - What's unclear: Should the template have a polished visual design, or should it be a minimal skeleton that the agent enhances?
   - Recommendation: Include a complete, polished layout in the template. The system architect agent (model: sonnet, medium tier) should not need to make layout/design decisions for the showcase -- it should focus on filling in token values. A well-designed template means the showcase looks good regardless of which tokens are generated. Include responsive layout, clear section headers, swatch grid, typography scale samples, spacing bars, and component preview containers. **Confidence: MEDIUM** -- this is a judgment call, but erring toward completeness reduces agent burden.

## Sources

### Primary (HIGH confidence)
- `core/references/state-machine.md` -- STATE.md format definition (lines 83-113), phase definitions, gate check requirements
- `core/workflows/compose-screen.md` -- SUMMARY.md format definition (section E, lines 106-127), orchestrator verification steps
- `core/workflows/generate-system.md` -- Token showcase specification (Output 4, lines 302-311), token file format (lines 151-251)
- `core/references/context-engine.md` -- Context budgets per file type, context loading profiles per agent
- `core/templates/VERTICAL-TEMPLATE.md` -- Existing template precedent for file structure and naming

### Secondary (MEDIUM confidence)
- `runtimes/claude-code/agents/forge-system-architect.md` -- Agent's output format expectations and quality checklist for token showcase
- `runtimes/claude-code/agents/forge-screen-composer.md` -- Agent's output format expectations referencing SUMMARY.md
- `runtimes/claude-code/agents/forge-design-reviewer.md` -- Reviewer reads SUMMARY.md (confirms required fields)
- `core/references/runtime-adapters.md` -- Install mapping for `core/templates/` directory

### Tertiary (LOW confidence)
- None -- all findings derived from existing project source files.

## Metadata

**Confidence breakdown:**
- Template formats: HIGH -- directly extracted from existing source-of-truth files with no ambiguity
- File placement: HIGH -- `core/templates/` already exists with `VERTICAL-TEMPLATE.md`; install mapping covers this directory
- Token showcase structure: HIGH -- generate-system.md specifies exactly what to display; agent definitions confirm self-contained requirement
- Token showcase visual design: MEDIUM -- structural requirements are clear, but exact CSS styling is discretionary
- Pitfalls: HIGH -- derived from analyzing file relationships and consumer expectations across the codebase

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (30 days -- this phase works with stable, local file formats; no external dependencies to go stale)
