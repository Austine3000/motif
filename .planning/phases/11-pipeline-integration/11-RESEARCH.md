# Phase 11: Pipeline Integration - Research

**Researched:** 2026-03-04
**Domain:** Agent pipeline modifications for icon library integration (system architect, screen composer, token showcase)
**Confidence:** HIGH

## Summary

Phase 11 is the integration phase that connects Phase 9's foundation (icon-libraries.md reference doc, selection algorithm, icon size tokens) and Phase 10's vocabularies (per-vertical icon mappings in all 4 vertical files) into the live agent pipeline. The phase touches 5 core files across 3 subsystems: the system generation workflow (generate-system.md), the screen composition workflow (compose-screen.md), the context engine (context-engine.md), the system architect agent definition, and the token showcase template.

The core deliverable is making icons flow through the pipeline end-to-end: (1) the system architect runs the selection algorithm during `/motif:system` and outputs the selected library/CDN in DESIGN-SYSTEM.md plus generates an ICON-CATALOG.md with the vertical's concrete icon mappings; (2) the screen composer reads ICON-CATALOG.md during `/motif:compose` and uses concrete icon class names instead of bracket placeholders or hallucinated names; (3) the token showcase template includes the icon CDN link and renders an iconography preview section.

There are two critical architectural decisions: where to place ICON-CATALOG.md in context loading profiles (it must be in the composer's `always_load` list since every composed screen uses icons), and how to keep the installed `.claude/get-motif/` copies in sync with modified `core/` source files (the installer must be re-run after Phase 11 modifications, or Phase 11 must modify both locations).

**Primary recommendation:** Modify the 5 `core/` source files directly (generate-system.md, compose-screen.md, context-engine.md, the system architect agent, and the token showcase template). All changes are additive -- no existing behavior is removed. After modification, either re-run the installer or manually sync to `.claude/get-motif/`. The ICON-CATALOG.md generation should be added as Output 5 in the generate-system.md workflow, and the context engine should add it to the composer's `always_load` profile.

## Standard Stack

### Core

This phase modifies existing markdown files and one HTML template. No new libraries, no new code.

| File | Location | Purpose | Modification Type |
|------|----------|---------|-------------------|
| `generate-system.md` | `core/workflows/` | Add ICON-CATALOG.md as Output 5; expand DESIGN-SYSTEM.md iconography instructions; add icon CDN to token-showcase | Additive sections |
| `compose-screen.md` | `core/workflows/` | Instruct composer to read ICON-CATALOG.md and use concrete icon names | Additive rules |
| `context-engine.md` | `core/references/` | Add ICON-CATALOG.md to context loading profiles | Additive entries |
| `motif-system-architect.md` | `runtimes/claude-code/agents/` | Add icon awareness to domain expertise and quality checklist | Additive sections |
| `token-showcase-template.html` | `core/templates/` | Add iconography section and CDN link placeholder | Additive HTML |

### Supporting (Read-Only References)

| File | Location | Purpose |
|------|----------|---------|
| `icon-libraries.md` | `core/references/` | Library metadata, CDN URLs, selection algorithm (Phase 9) |
| `verticals/*.md` | `core/references/verticals/` | Icon vocabularies with cross-library mappings (Phase 10) |

### Sync Requirement

The installer (`bin/install.js`) copies `core/` to `.claude/get-motif/` and `runtimes/claude-code/agents/` to `.claude/get-motif/agents/`. After Phase 11 modifications, either:
- Re-run `node bin/install.js --force` to sync, OR
- Manually copy modified files to their `.claude/get-motif/` counterparts

This is the same pattern Phase 9 used. The `.claude/get-motif/` copies are currently out of sync (missing Phase 9's icon tokens and algorithm). Phase 11 should sync ALL accumulated changes.

## Architecture Patterns

### File Modification Map

```
core/
  references/
    context-engine.md          # MODIFIED -- add ICON-CATALOG.md to profiles
    icon-libraries.md          # READ ONLY (Phase 9)
    verticals/                 # READ ONLY (Phase 10)
  workflows/
    generate-system.md         # MODIFIED -- Output 5 (ICON-CATALOG.md), iconography in DESIGN-SYSTEM.md, showcase updates
    compose-screen.md          # MODIFIED -- add ICON-CATALOG.md to context, icon usage rules
  templates/
    token-showcase-template.html  # MODIFIED -- add iconography section + CDN placeholder

runtimes/claude-code/agents/
    motif-system-architect.md  # MODIFIED -- add icon domain expertise + quality checklist items

Output at runtime:
.planning/design/system/
    ICON-CATALOG.md            # NEW (generated per project by system architect)
    tokens.css                 # EXISTING (already has icon size tokens from Phase 9 algorithm)
    DESIGN-SYSTEM.md           # EXISTING (will now include iconography section)
    token-showcase.html        # EXISTING (will now include icon CDN + iconography preview)
```

### Pattern 1: ICON-CATALOG.md Generation (Output 5 in generate-system.md)

**What:** A new output artifact generated by the system architect during `/motif:system`. It extracts the selected library's icon column from the vertical's Icon Vocabulary tables and produces a project-specific catalog with concrete icon class names.

**When generated:** After the selection algorithm runs (library + weight determined), the architect reads the vertical reference file's `## Icon Vocabulary` section and extracts the column matching the selected library.

**Format:**

```markdown
# Icon Catalog

Library: [Selected Library Name]
CDN: [CDN URL]
Weight: [default_weight] (emphasis: [emphasis_weight])
Usage: [class syntax]

## Navigation
| Role | Icon Name | Class |
|------|-----------|-------|
| home | [name] | [full class string] |
| search | [name] | [full class string] |

## [Domain Category]
| Role | Icon Name | Class |
|------|-----------|-------|
| [role] | [name] | [full class string] |

## Status & Feedback
[same format]

## Actions
[same format]
```

**Why this structure:**
1. The composer agent needs only the selected library's names -- not all 4 columns from the vocabulary. ICON-CATALOG.md is the distilled, project-specific view.
2. Including the full class string (e.g., `<i class="ph ph-house"></i>` or `<span class="material-symbols-rounded">home</span>`) eliminates the composer needing to know library syntax.
3. Token budget: ~500-800 tokens (20-25 icon entries), well within the context engine's budget constraints.

**Context budget addition:**

| File | Max Tokens | Purpose |
|------|------------|---------|
| ICON-CATALOG.md | 1,000 | Per-project icon name lookup for composer |

### Pattern 2: Composer Agent Icon Lookup

**What:** The composer agent reads ICON-CATALOG.md as part of its always-load context. When composing a screen, it looks up icon names by semantic role from the catalog instead of inventing names or using bracket placeholders.

**Lookup flow:**
```
1. Composer reads ICON-CATALOG.md (loaded as context)
2. When placing an icon: find the semantic role (e.g., "home", "search", "send")
3. Copy the exact Class string from the catalog
4. Set icon size using --icon-{scale} token from tokens.css
5. Set icon color via parent element's color property (currentColor inheritance)
```

**Example output (Phosphor fintech):**
```html
<nav>
  <a href="/" class="nav-item active">
    <i class="ph ph-house" style="font-size: var(--icon-md);"></i>
    <span>Home</span>
  </a>
  <a href="/send" class="nav-item">
    <i class="ph ph-paper-plane-tilt" style="font-size: var(--icon-md);"></i>
    <span>Send</span>
  </a>
</nav>
```

**Example output (Material Symbols health):**
```html
<div class="metric-card">
  <span class="material-symbols-rounded" style="font-size: var(--icon-xl);">monitor_heart</span>
  <div class="metric-value">72 <span class="unit">bpm</span></div>
</div>
```

**Example output (Lucide SaaS):**
```html
<!-- Lucide requires JS initialization -->
<button class="btn btn-ghost">
  <i data-lucide="settings" style="width: var(--icon-md); height: var(--icon-md);"></i>
  <span>Settings</span>
</button>
```

### Pattern 3: Token Showcase Iconography Section

**What:** A new section in the token-showcase-template.html that renders the vertical's key icons at each icon size token. The CDN link for the selected library is added to the `<head>`.

**Template structure:**

```html
<!-- In <head>, after Google Fonts link -->
{ICON_CDN_LINK}
{ICON_INIT_SCRIPT} <!-- Only for Lucide -->

<!-- New section after Component Previews -->
<section id="iconography">
  <h2>Iconography</h2>

  <div class="subsection">
    <p class="subsection-title">Icon Library</p>
    <p class="icon-meta">{LIBRARY_NAME} | {WEIGHT} | {ICON_COUNT} icons</p>
  </div>

  <div class="subsection">
    <p class="subsection-title">Size Scale</p>
    <div class="icon-size-grid">
      <!-- Agent fills: same icon at each size token -->
      <div class="icon-size-item">
        <{ICON_ELEMENT} style="font-size: var(--icon-sm);">{SAMPLE_ICON}</{ICON_ELEMENT}>
        <span class="swatch-label">--icon-sm<br>16px</span>
      </div>
      <!-- ... --icon-md, --icon-lg, --icon-xl, --icon-2xl ... -->
    </div>
  </div>

  <div class="subsection">
    <p class="subsection-title">Domain Icons</p>
    <div class="icon-preview-grid">
      <!-- Agent fills: key icons from the vertical vocabulary -->
      <div class="icon-preview-item">
        <{ICON_ELEMENT} style="font-size: var(--icon-lg);">{ICON_NAME}</{ICON_ELEMENT}>
        <span class="swatch-label">{semantic-role}</span>
      </div>
    </div>
  </div>
</section>
```

**CSS additions for the template:**

```css
/* --- Icon Preview --- */
.icon-meta {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--text-secondary);
  margin-bottom: var(--space-4);
}
.icon-size-grid {
  display: flex;
  align-items: flex-end;
  gap: var(--space-8);
  margin-bottom: var(--space-6);
}
.icon-size-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
}
.icon-preview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-6);
}
.icon-preview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  min-width: 80px;
}
```

### Pattern 4: DESIGN-SYSTEM.md Iconography Section

**What:** An `## Iconography` section added to the DESIGN-SYSTEM.md output. This is the human-readable documentation of the icon system selection.

**Format:**

```markdown
## Iconography

**Library:** [Selected Library Name]
**CDN:** `[CDN URL]`
**Weight:** [default_weight] (emphasis: [emphasis_weight])

### Usage
[Library-specific usage syntax with example]

### Size Scale
| Token | Size | Usage |
|-------|------|-------|
| --icon-sm | 16px (1rem) | Inline text, badges, status indicators |
| --icon-md | 20px (1.25rem) | Navigation, form labels, list items |
| --icon-lg | 24px (1.5rem) | Primary UI icons, cards, buttons |
| --icon-xl | 32px (2rem) | Feature highlights, metric cards |
| --icon-2xl | 40px (2.5rem) | Hero sections, empty states |

### Color
Icons inherit color via CSS `currentColor`. Apply color to the parent element:
- Default: `color: var(--text-secondary)`
- Active: `color: var(--color-primary-500)`
- Semantic: `color: var(--color-success)` / `var(--color-error)` / `var(--color-warning)`
```

### Anti-Patterns to Avoid

- **Modifying `.claude/get-motif/` directly instead of `core/`:** The `core/` directory is the source of truth. The installer syncs from `core/` to `.claude/get-motif/`. Direct edits to `.claude/get-motif/` will be overwritten on next install. Always modify `core/` first, then sync.
- **Making ICON-CATALOG.md too verbose:** It should be a lookup table, not documentation. The composer agent needs role -> class string. Keep it under 1,000 tokens. Full icon documentation belongs in DESIGN-SYSTEM.md (for humans) and icon-libraries.md (for reference).
- **Adding ICON-CATALOG.md to the system generator's always_load:** The system generator creates ICON-CATALOG.md -- it doesn't read it. Only the composer and reviewer need to load it.
- **Putting library-specific logic in the composer agent:** The composer should not know which library was selected. It reads ICON-CATALOG.md for the class strings. Library-specific knowledge (CDN URLs, initialization requirements, naming conventions) stays in the system architect and generate-system.md workflow.
- **Forgetting Lucide's JS initialization in the showcase template:** The token showcase must include `<script>lucide.createIcons()</script>` when Lucide is the selected library. The other 3 libraries are pure CSS.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon name lookup | Custom parsing of vertical files at compose time | Pre-generated ICON-CATALOG.md | Composer agent should read a flat lookup table, not parse nested vocabulary tables from vertical files. Reduces context cost and eliminates parsing errors. |
| Library CDN management | Dynamic CDN URL construction in compose workflow | CDN URL copied from ICON-CATALOG.md header | CDN URLs are static, version-pinned strings. Dynamic construction introduces version drift risk. |
| Icon class syntax | Composer constructing class strings from library name + icon name | Full class strings pre-built in ICON-CATALOG.md | Each library has different syntax (CSS class vs data attribute vs span text content). Pre-building eliminates syntax errors. |
| Showcase icon rendering | Manual HTML construction per library | Template placeholders filled by system architect | The architect knows which library was selected; the template provides the structural scaffold. |

**Key insight:** ICON-CATALOG.md is the distillation layer. The vertical vocabulary has 4 columns (all libraries). The catalog has 1 column (the selected library, with complete class strings). This simplification is what makes the composer agent's job tractable.

## Common Pitfalls

### Pitfall 1: Context Engine Desync

**What goes wrong:** ICON-CATALOG.md is generated but not added to the composer's context loading profile. The composer agent never reads it, continues inventing icon names.
**Why it happens:** context-engine.md defines the loading profiles, but there are TWO copies: `core/references/context-engine.md` and `.claude/get-motif/references/context-engine.md`. If only one is updated, the runtime copy (which agents actually read) may not include the new profile entry.
**How to avoid:** Modify `core/references/context-engine.md` first. Then sync to `.claude/get-motif/references/context-engine.md` (via installer or manual copy). Verify by grepping the installed copy for "ICON-CATALOG".
**Warning signs:** Composed screens still use bracket placeholders or hallucinated icon names after Phase 11 is deployed.

### Pitfall 2: Composer Agent Missing Icon Instructions

**What goes wrong:** compose-screen.md workflow is updated to pass ICON-CATALOG.md as context, but the composer agent's behavioral instructions (in motif-screen-composer.md) don't mention using it. The agent loads the file but doesn't know what to do with it.
**Why it happens:** Context loading (workflow) and behavior instructions (agent definition) are separate files. Both must be updated.
**How to avoid:** Update both files:
1. `compose-screen.md` -- add ICON-CATALOG.md to the REQUIRED_FILES list and the agent spawn context section
2. `motif-screen-composer.md` (in `runtimes/claude-code/agents/`) -- add icon usage rules to the anti-slop checklist and positive instructions

### Pitfall 3: Lucide Showcase Rendering Failure

**What goes wrong:** Token showcase renders blank squares for Lucide icons because `lucide.createIcons()` was not called.
**Why it happens:** Lucide is the only library requiring JS initialization. The system architect adds the CDN script but forgets the initialization call, or places it before the DOM is ready.
**How to avoid:** The showcase template must include BOTH the CDN script AND the initialization:
```html
<script src="https://unpkg.com/lucide@0.576.0"></script>
<script>document.addEventListener('DOMContentLoaded', () => lucide.createIcons());</script>
```
The template should use a conditional placeholder that the architect fills only when Lucide is selected.
**Warning signs:** Opening token-showcase.html shows an iconography section with blank icon slots.

### Pitfall 4: ICON-CATALOG.md Not Listed in Step 3 Validation

**What goes wrong:** generate-system.md Step 3 ("Collect & Validate") checks that tokens.css, COMPONENT-SPECS.md, DESIGN-SYSTEM.md, and token-showcase.html exist. ICON-CATALOG.md is missing from the check list. Orchestrator doesn't detect when the catalog generation fails silently.
**Why it happens:** Step 3 was written before ICON-CATALOG.md existed. It must be updated to include the new artifact.
**How to avoid:** Add `.planning/design/system/ICON-CATALOG.md` to the Step 3 verification list in generate-system.md.

### Pitfall 5: Material Symbols CSS Not Included in Showcase

**What goes wrong:** Material Symbols icons render at 48px (the default optical size) because the required CSS override for font-size and opsz is missing from the showcase template.
**Why it happens:** Material Symbols is a variable font that defaults to 48px optical size. Without explicit `font-variation-settings`, icons appear oversized.
**How to avoid:** The showcase template must include the Material Symbols CSS setup from icon-libraries.md (the `.material-symbols-*` class with explicit `font-variation-settings`). The system architect must inject this CSS when Material Symbols is the selected library.
**Warning signs:** Icons in the showcase appear much larger than intended size tokens.

### Pitfall 6: Dual-File Modification Scope

**What goes wrong:** Modifying only `core/` files without syncing to `.claude/get-motif/`, or vice versa. The runtime behavior doesn't match the source of truth.
**Why it happens:** The project has a build/install step (bin/install.js) that copies core/ -> .claude/get-motif/. Without re-running it, the two copies diverge. Phase 9 already created this divergence (icon tokens exist in core/ but not in .claude/get-motif/).
**How to avoid:** Phase 11 should include a final task that runs the installer or manually syncs all modified files. This also resolves the Phase 9 divergence.

## Code Examples

### ICON-CATALOG.md Generation Template (for generate-system.md Output 5)

```markdown
<!-- Source: Pattern derived from vertical Icon Vocabulary tables -->
# Icon Catalog

Library: Phosphor Icons
CDN: https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/regular/style.css
Weight: regular (emphasis: bold)
Usage: <i class="ph ph-{name}"></i>

## Navigation
| Role | Icon Name | Class |
|------|-----------|-------|
| home | house | `<i class="ph ph-house"></i>` |
| search | magnifying-glass | `<i class="ph ph-magnifying-glass"></i>` |
| settings | gear | `<i class="ph ph-gear"></i>` |
| profile | user | `<i class="ph ph-user"></i>` |
| notifications | bell | `<i class="ph ph-bell"></i>` |

## Finance
| Role | Icon Name | Class |
|------|-----------|-------|
| bank | bank | `<i class="ph ph-bank"></i>` |
| wallet | wallet | `<i class="ph ph-wallet"></i>` |
| credit-card | credit-card | `<i class="ph ph-credit-card"></i>` |
| money | currency-dollar | `<i class="ph ph-currency-dollar"></i>` |
| transfer | arrows-left-right | `<i class="ph ph-arrows-left-right"></i>` |
[... remaining domain + status + action icons ...]
```

### Material Symbols ICON-CATALOG.md Example (Health)

```markdown
# Icon Catalog

Library: Material Symbols Rounded
CDN: https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded
Weight: wght:400 (emphasis: FILL:1)
Usage: <span class="material-symbols-rounded">{icon_name}</span>

## Navigation
| Role | Icon Name | Class |
|------|-----------|-------|
| home | home | `<span class="material-symbols-rounded">home</span>` |
| search | search | `<span class="material-symbols-rounded">search</span>` |

## Health & Medical
| Role | Icon Name | Class |
|------|-----------|-------|
| vitals | monitor_heart | `<span class="material-symbols-rounded">monitor_heart</span>` |
| medication | medication | `<span class="material-symbols-rounded">medication</span>` |
| stethoscope | stethoscope | `<span class="material-symbols-rounded">stethoscope</span>` |
[...]
```

### Lucide ICON-CATALOG.md Example (SaaS)

```markdown
# Icon Catalog

Library: Lucide
CDN: https://unpkg.com/lucide@0.576.0
Weight: default (stroke width adjustable)
Usage: <i data-lucide="{name}"></i> + lucide.createIcons()
Requires JS: YES

## Navigation
| Role | Icon Name | Class |
|------|-----------|-------|
| home | house | `<i data-lucide="house"></i>` |
| search | search | `<i data-lucide="search"></i>` |

## SaaS & Productivity
| Role | Icon Name | Class |
|------|-----------|-------|
| dashboard | layout-dashboard | `<i data-lucide="layout-dashboard"></i>` |
| layers | layers | `<i data-lucide="layers"></i>` |
[...]
```

### Context Engine Modification (composer profile)

```xml
<!-- Source: core/references/context-engine.md, Profile: Screen Composer -->
<context_profile name="composer">
  <always_load>
    .planning/design/PROJECT.md
    .planning/design/system/tokens.css
    .planning/design/system/COMPONENT-SPECS.md
    .planning/design/system/ICON-CATALOG.md  <!-- NEW: icon name lookup -->
  </always_load>
  <load_if_exists>
    .planning/design/DESIGN-RESEARCH.md
    .planning/design/screens/{previous-screen}-SUMMARY.md (for consistency)
  </load_if_exists>
  <never_load>
    DESIGN-BRIEF.md (decisions already encoded in tokens + research)
    Raw research files (already synthesized)
    Other screen source code (only summaries)
    DESIGN-SYSTEM.md (tokens.css + COMPONENT-SPECS.md are sufficient)
    icon-libraries.md (already distilled into ICON-CATALOG.md)
  </never_load>
</context_profile>
```

### Compose Workflow Icon Rules (for compose-screen.md)

```markdown
<!-- Source: Addition to compose-screen.md Step 3 agent spawn prompt -->

### B.9 Icon Compliance
9. **Icon compliance:** Use ONLY icon names from ICON-CATALOG.md. Every icon must use:
   - The exact class/syntax from the catalog's "Class" column
   - An --icon-{scale} token for sizing (--icon-sm through --icon-2xl)
   - currentColor for color (set via parent element's `color` property)
   - NEVER invent icon names. If a needed icon isn't in the catalog, use the closest match and note it in SUMMARY.md.
   - NEVER use bracket placeholders like [icon] or [MerchantIcon].
```

### Composer Anti-Slop Addition (for motif-screen-composer.md)

```markdown
<!-- Source: Addition to Anti-Slop Checklist in motif-screen-composer.md -->

9. **Am I using an icon name not in ICON-CATALOG.md?** STOP. Look up the semantic role in the catalog. Use the exact Class string.
10. **Am I hardcoding an icon size?** STOP. Use var(--icon-sm) through var(--icon-2xl).
11. **Am I using a bracket placeholder like [icon: ...]?** STOP. Replace with the actual icon element from the catalog.
```

### Generate-system.md Output 5 Addition

```markdown
<!-- Source: New output section for generate-system.md, after Output 4 -->

## Output 5: ICON-CATALOG.md (budget: <=1000 tokens)

Generate a project-specific icon catalog by:
1. Run the Icon Library Decision Algorithm (above) to determine: library, weight, CDN URL, usage syntax
2. Read the vertical reference file's `## Icon Vocabulary` section ({MOTIF_ROOT}/references/verticals/{VERTICAL}.md)
3. Extract ONLY the column for the selected library
4. For each icon, construct the full class/element string using the library's usage syntax
5. Organize by the same semantic categories as the vocabulary (Navigation, Domain, Status, Actions)

Save to `.planning/design/system/ICON-CATALOG.md`

Format:
```
# Icon Catalog
Library: [name]
CDN: [url]
Weight: [default] (emphasis: [emphasis])
Usage: [syntax pattern]
{IF Lucide: Requires JS: YES}

## [Category]
| Role | Icon Name | Class |
|------|-----------|-------|
| [role] | [name] | [full element/class string] |
```

Include ALL icons from the vertical vocabulary (typically 20-25 icons).
Do NOT add icons not in the vocabulary. The vocabulary is the curated, validated set.
```

### System Architect Quality Checklist Additions

```markdown
<!-- Source: Addition to motif-system-architect.md Quality Checklist -->

- [ ] Icon Library Decision Algorithm executed -- selected library and weight documented in tokens.css comment
- [ ] DESIGN-SYSTEM.md includes Iconography section with library name, CDN link, usage syntax, size scale
- [ ] ICON-CATALOG.md generated with all icons from vertical vocabulary, correct library column, full class strings
- [ ] Token showcase HTML includes CDN link for selected icon library in <head>
- [ ] Token showcase HTML includes Iconography section with size scale preview and domain icon samples
- [ ] IF Lucide selected: showcase includes both CDN script AND lucide.createIcons() initialization
- [ ] IF Material Symbols selected: showcase includes CSS font-variation-settings for proper rendering
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| No icon library selection | Deterministic algorithm in generate-system.md | Phase 9 (algorithm documented) -> Phase 11 (integrated into workflow) | System architect runs algorithm, selects library, records in outputs |
| No ICON-CATALOG.md | Per-project catalog generated during /motif:system | Phase 11 (this phase) | Composer agent has a concrete lookup table for icon names |
| Composer invents icon names | Composer reads from ICON-CATALOG.md | Phase 11 (this phase) | Zero hallucinated icon names in composed screens |
| Token showcase has no icons | Showcase includes iconography section with CDN rendering | Phase 11 (this phase) | Design system preview includes visual icon samples |
| DESIGN-SYSTEM.md mentions "icon style recommendation" | DESIGN-SYSTEM.md has structured Iconography section | Phase 11 (this phase) | Human-readable icon documentation with library, CDN, usage, sizes |

**Deprecated/outdated:**
- Bracket placeholders (`[MerchantIcon 40x40]`) in composed screens -- replaced by concrete icon elements from ICON-CATALOG.md
- Generic "icon style recommendation" in DESIGN-SYSTEM.md -- replaced by structured Iconography section

## Detailed Modification Specifications

### 1. generate-system.md Modifications

**Location:** `core/workflows/generate-system.md`

**Changes:**

A. **Output 3 (DESIGN-SYSTEM.md)** -- Line ~327: Change "icon style recommendation" to explicit iconography section instructions:
```
Before: Include: color palette with contrast table, typography scale with usage, spacing guidelines, motion principles, icon style recommendation.
After:  Include: color palette with contrast table, typography scale with usage, spacing guidelines, motion principles, iconography (library name, CDN link, usage syntax, size scale, color rules).
```

B. **Output 4 (token-showcase.html)** -- Add icon CDN link and iconography section requirements:
```
Before:
- Color swatches with hex values
- Typography scale samples
- Spacing visualization
- Component previews

After:
- Color swatches with hex values
- Typography scale samples
- Spacing visualization
- Component previews
- Iconography: CDN link in <head>, size scale preview (one icon at each --icon-* token), domain icon samples (8-10 key icons from vocabulary)
```

C. **New Output 5 (ICON-CATALOG.md)** -- Add after Output 4 (see Code Examples above).

D. **Step 3 (Collect & Validate)** -- Add ICON-CATALOG.md to the verification list:
```
After agent completes, verify these files exist:
- .planning/design/system/tokens.css
- .planning/design/system/COMPONENT-SPECS.md
- .planning/design/system/DESIGN-SYSTEM.md
- .planning/design/system/token-showcase.html
- .planning/design/system/ICON-CATALOG.md    ← NEW
```

E. **System Generator Context Loading (Step 2 or agent_spawn context)** -- Add icon-libraries.md and vertical reference to the system generator's context:
The agent_spawn block already loads `{MOTIF_ROOT}/references/verticals/{VERTICAL}.md` as item 6 (if exists). It also needs `{MOTIF_ROOT}/references/icon-libraries.md` for the selection algorithm and CDN data. Add:
```
7. `{MOTIF_ROOT}/references/icon-libraries.md` — icon library metadata, selection algorithm, CDN URLs
```

### 2. compose-screen.md Modifications

**Location:** `core/workflows/compose-screen.md`

**Changes:**

A. **Step 2 (Assemble Context Profile)** -- Add ICON-CATALOG.md to REQUIRED_FILES:
```
REQUIRED_FILES:
  - .planning/design/PROJECT.md
  - .planning/design/system/tokens.css
  - .planning/design/system/COMPONENT-SPECS.md
  - .planning/design/DESIGN-RESEARCH.md
  - .planning/design/system/ICON-CATALOG.md  ← NEW

OPTIONAL_FILES (load if they exist):
  - .planning/design/screens/*-SUMMARY.md (only the most recent 2-3)
```

B. **Step 3 (Agent Spawn Prompt)** -- Add ICON-CATALOG.md to context files list:
```
## Context Files — Read These First
1. .planning/design/PROJECT.md
2. .planning/design/system/tokens.css
3. .planning/design/system/COMPONENT-SPECS.md
4. .planning/design/DESIGN-RESEARCH.md
5. .planning/design/system/ICON-CATALOG.md — icon name lookup. Use ONLY these icon names.  ← NEW
```

C. **Implementation Rules** -- Add icon compliance rule (B.9, see Code Examples above).

D. **Anti-Slop Check** -- Add icon-related checks:
```
- Am I using an icon name not in ICON-CATALOG.md? → STOP. Look up the role.
- Am I hardcoding an icon size in px? → STOP. Use var(--icon-*).
- Am I using a bracket placeholder? → STOP. Use actual icon elements.
```

E. **Self-Review Checklist** -- Add icon verification:
```
- [ ] All icon names exist in ICON-CATALOG.md (no invented names)
- [ ] All icon sizes use --icon-* tokens (no hardcoded font-size for icons)
- [ ] Icon CDN link present in <head> (or inherited from framework)
- [ ] IF Lucide: createIcons() called after DOM load
```

### 3. context-engine.md Modifications

**Location:** `core/references/context-engine.md`

**Changes:**

A. **Context Budgets table** -- Add ICON-CATALOG.md entry:
```
| ICON-CATALOG.md | 1,000 | Per-project icon name lookup |
```

B. **System Generator profile** -- Add icon-libraries.md to load_if_exists:
```xml
<load_if_exists>
  .planning/design/research/02-visual-language.md
  .planning/design/research/03-accessibility.md
  {MOTIF_ROOT}/references/verticals/{vertical}.md
  {MOTIF_ROOT}/references/icon-libraries.md  <!-- NEW -->
</load_if_exists>
```

C. **Composer profile** -- Add ICON-CATALOG.md to always_load:
```xml
<always_load>
  .planning/design/PROJECT.md
  .planning/design/system/tokens.css
  .planning/design/system/COMPONENT-SPECS.md
  .planning/design/system/ICON-CATALOG.md  <!-- NEW -->
</always_load>
```

D. **Reviewer profile** -- Add ICON-CATALOG.md to load_if_exists (Phase 12 will make this always_load):
```xml
<load_if_exists>
  .planning/design/PROJECT.md
  .planning/design/screens/{screen}-SUMMARY.md
  .planning/design/system/ICON-CATALOG.md  <!-- NEW -->
</load_if_exists>
```

### 4. motif-system-architect.md Modifications

**Location:** `runtimes/claude-code/agents/motif-system-architect.md`

**Changes:**

A. **Context Loading Profile** -- Add icon-libraries.md to Load If Exists:
```
### Load If Exists
- .planning/design/research/02-visual-language.md
- .planning/design/research/03-accessibility.md
- {MOTIF_ROOT}/references/verticals/{vertical}.md
- {MOTIF_ROOT}/references/icon-libraries.md  ← NEW: icon library metadata and selection algorithm
```

B. **Domain Expertise** -- Add iconography knowledge section:
```markdown
### Iconography
- **Icon library selection:** Deterministic algorithm from icon-libraries.md maps vertical + personality seed to library + weight. User overrides take priority.
- **ICON-CATALOG.md generation:** Extract the selected library's column from the vertical's Icon Vocabulary tables. Build full class strings. Organize by semantic category.
- **Icon sizing:** Fixed 8px-multiple scale via --icon-sm through --icon-2xl tokens. Icons inherit color via currentColor.
- **Library-specific requirements:** Lucide requires JS initialization. Material Symbols requires explicit font-variation-settings CSS.
```

C. **Output Format Expectations** -- Add ICON-CATALOG.md:
```
- **`ICON-CATALOG.md`** (max 1000 tokens) -- Per-project icon name lookup table generated from vertical vocabulary
```

D. **Quality Checklist** -- Add icon-related checks (see Code Examples above).

### 5. token-showcase-template.html Modifications

**Location:** `core/templates/token-showcase-template.html`

**Changes:**

A. **`<head>` section** -- Add placeholder for icon CDN link after Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family={FONT_FAMILIES}" rel="stylesheet">
<!-- Icon library CDN — agent fills based on selection algorithm -->
{ICON_CDN_LINK}
{ICON_INIT_SCRIPT}
```

B. **`<style>` section** -- Add iconography CSS (see Pattern 3 above).

C. **`<body>` section** -- Add Iconography section before the Vertical-Specific section:
```html
<!-- SECTION: ICONOGRAPHY -->
<section id="iconography">
  <h2>Iconography</h2>

  <div class="subsection">
    <p class="subsection-title">Icon Library</p>
    <!-- Agent fills: library name, weight, icon count -->
  </div>

  <div class="subsection">
    <p class="subsection-title">Size Scale</p>
    <div class="icon-size-grid">
      <!-- Agent fills: same reference icon at each size token -->
    </div>
  </div>

  <div class="subsection">
    <p class="subsection-title">Domain Icons</p>
    <div class="icon-preview-grid">
      <!-- Agent fills: 8-10 key icons from vertical vocabulary -->
    </div>
  </div>
</section>
```

## Open Questions

1. **Composer behavior when ICON-CATALOG.md is missing**
   - What we know: ICON-CATALOG.md is generated during /motif:system. If a project was initialized before Phase 11, running /motif:compose without re-running /motif:system would mean no catalog exists.
   - What's unclear: Should the compose workflow fail (gate check), warn, or gracefully degrade?
   - Recommendation: Add ICON-CATALOG.md to the compose workflow's REQUIRED_FILES, but since the compose gate check currently only validates tokens.css and COMPONENT-SPECS.md, this would break backward compatibility. Instead: add it as a conditional check -- if ICON-CATALOG.md exists, composer MUST use it; if absent, composer warns "No icon catalog found -- icon names may be inconsistent. Re-run /motif:system to generate."

2. **Sync strategy for core/ -> .claude/get-motif/**
   - What we know: Phase 9 modified core/ files but didn't sync to .claude/get-motif/. Phase 11 will modify more files.
   - What's unclear: Should Phase 11 include a sync task (run installer), or should it modify both copies directly?
   - Recommendation: Add a final task that runs `node bin/install.js --force` or manually copies the specific modified files. This resolves both Phase 9 and Phase 11 divergence in one step. The installer's hash-based backup mechanism protects any user modifications.

3. **Composer agent definition location**
   - What we know: The composer agent definition lives in `runtimes/claude-code/agents/motif-screen-composer.md`. The installer copies it to `.claude/get-motif/agents/motif-screen-composer.md`.
   - What's unclear: Should Phase 11 also add icon anti-slop rules to the composer agent, or is the compose-screen.md workflow sufficient (since the workflow's agent_spawn prompt carries the instructions)?
   - Recommendation: Add icon rules to BOTH the workflow (for the spawn prompt) AND the agent definition (for the behavioral guidelines). The agent definition is loaded as the agent's identity; the workflow provides task-specific instructions. Both should reinforce icon compliance.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `core/workflows/generate-system.md` -- current structure, icon algorithm (Phase 9), output sections, agent_spawn prompt format
- Codebase analysis: `core/workflows/compose-screen.md` -- current structure, REQUIRED_FILES, anti-slop checklist, context profile
- Codebase analysis: `core/references/context-engine.md` -- all 5 context loading profiles, budget table, anti-patterns
- Codebase analysis: `runtimes/claude-code/agents/motif-system-architect.md` -- domain expertise, quality checklist, context loading profile
- Codebase analysis: `core/templates/token-showcase-template.html` -- current sections, CSS structure, placeholder patterns
- Codebase analysis: `bin/install.js` -- copy mechanism (core/ -> .claude/get-motif/), {MOTIF_ROOT} resolution, manifest tracking
- Phase 9 research: `.planning/phases/09-foundation/09-RESEARCH.md` -- icon size tokens, selection algorithm, CDN data
- Phase 10 research: `.planning/phases/10-vertical-migration/10-RESEARCH.md` -- vocabulary structure, bracket placeholder replacement
- Phase 9 deliverables: `core/references/icon-libraries.md` -- verified library metadata, selection algorithm, CDN snippets
- Phase 10 deliverables: `core/references/verticals/*.md` -- icon vocabulary sections in all 4 verticals

### Secondary (MEDIUM confidence)
- `.planning/REQUIREMENTS.md` -- IPIP-01 through IPIP-05 requirement definitions
- `.planning/ROADMAP.md` -- Phase 11 success criteria
- Phase 9/10 summaries -- delivered artifacts, decisions, patterns established

### Tertiary (LOW confidence)
- None -- all findings verified against codebase analysis

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all modifications are to existing files with well-understood structure; no new libraries or dependencies
- Architecture: HIGH -- ICON-CATALOG.md pattern follows existing artifact patterns (COMPONENT-SPECS.md, DESIGN-SYSTEM.md); context loading changes follow established profile pattern
- Pitfalls: HIGH -- all pitfalls identified from direct codebase analysis (core/installed desync, Lucide JS requirement, Material Symbols CSS, missing validation step)

**Research date:** 2026-03-04
**Valid until:** 2026-06-04 (90 days -- stable domain; modifications to well-established pipeline)
