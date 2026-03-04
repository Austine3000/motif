# Phase 9: Foundation - Research

**Researched:** 2026-03-04
**Domain:** Icon library reference data, selection algorithm, icon size tokens
**Confidence:** HIGH

## Summary

Phase 9 creates the foundational data layer that all downstream icon integration phases depend on. It produces two primary deliverables: (1) an `icon-libraries.md` reference doc in `core/references/` containing CDN URLs, usage syntax, domain affinity mappings, and a deterministic selection algorithm; and (2) icon size tokens (`--icon-sm` through `--icon-2xl`) added to the token generation pipeline in `core/workflows/generate-system.md`.

This phase is data authoring, not code engineering. The four curated libraries (Phosphor Icons, Lucide, Material Symbols, Tabler Icons) have been thoroughly researched in the project-level research (`.planning/research/icon-libraries/`). The selection algorithm maps vertical + brand personality to library + weight using a deterministic lookup table -- mirroring how the existing Color Decision Algorithm and Typography Decision Algorithm work in `generate-system.md`. No new JavaScript, no new agent files, no installer changes -- just two additions to existing core reference/workflow files.

**Primary recommendation:** Model `icon-libraries.md` on the existing vertical reference files (`fintech.md`, `health.md`, etc.) as a flat, agent-readable markdown document. Add icon size tokens to the token template section of `generate-system.md` using rem units (consistent with existing spacing and typography tokens). Keep the selection algorithm as a simple lookup table, not a flowchart.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Algorithm uses both vertical AND brand personality as inputs (not vertical alone)
- Weight changes within the selected library come first for personality expression
- Extreme personality scores can switch from primary to secondary library entirely
- Users CAN explicitly override the algorithm's library choice (e.g., via motif:init preference)
- Secondary library = personality override pool (NOT gap fallback)
- One library per project -- no mixing libraries in the same output
- Vertical vocabularies use library-agnostic semantic roles (e.g., "merchant", "transfer") mapped to concrete icon names per library

### Claude's Discretion
- Which library maps to which vertical (fully deferred to research findings)
- How vocabulary adapts when user overrides the default library
- Whether to add a 36px token or round Health LogEntry to nearest
- Whether tokens define just icon size or also container dimensions
- Whether architect can adjust scale per project or keep it fixed
- rem vs px units -- should be consistent with existing token system
- Whether icon weight is part of algorithm output or composer-decided contextually

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Discretion Recommendations

Based on analysis of the existing codebase, project research, and the four curated icon libraries:

### Library-to-Vertical Pairing

Recommend the mapping from project research (confirmed by domain analysis of all four vertical files):

| Vertical | Primary Library | Secondary Library | Rationale |
|----------|----------------|-------------------|-----------|
| Fintech | Phosphor Icons | Lucide | Fintech needs weight variation for data density; Phosphor's 6 weights (thin for dashboards, bold for CTAs) match the fintech.md "comfortable-dense" spacing spec. Duotone adds dashboard hierarchy. |
| Health | Material Symbols | Phosphor Icons | Health has specialized iconography (vitals, medications, medical devices). Material Symbols has the broadest medical icon coverage (42+ medical icons). Rounded style matches health.md's "caring, not clinical" principle. |
| SaaS | Lucide | Phosphor Icons | SaaS products expect clean, minimal icons (Linear/Vercel/Notion style). Lucide's Feather heritage is the SaaS standard. saas.md's "efficiency is the product" aligns with Lucide's single consistent style. |
| E-commerce | Material Symbols | Tabler Icons | E-commerce needs action-oriented icons (cart, wishlist, shipping). Material Symbols Rounded with fill axis produces warm, tappable icons matching ecommerce.md's "desire drives conversion" principle. Tabler (6,038 icons) covers niche product-category icons. |

**Confidence:** HIGH -- mappings cross-referenced against all four vertical reference files and their component specifications.

### 36px Token Decision

**Recommend: Do NOT add a 36px token.** The Health LogEntry component spec uses `[CategoryIcon 36x36]` but this is a container dimension (36x36 includes padding), not the icon itself. Examining the LogEntry spec: the category icon has `--radius-md` and semantic color background at 10% opacity -- it is a container with an icon inside. The icon inside would be `--icon-lg` (24px) in a 36px padded container. This matches how the fintech TransactionRow uses `[MerchantIcon 40x40]` -- a 40px container with a 24px icon inside.

The 5-token scale (16/20/24/32/40px) cleanly maps to all existing component specs:
- SaaS CommandPalette `[Icon 20x20]` -> `--icon-md` (20px)
- Health MetricCard `[MetricIcon 32x32]` -> `--icon-xl` (32px)
- Fintech TransactionRow `[MerchantIcon 40x40]` -> `--icon-2xl` (40px) or 40px container with `--icon-lg` inside

### Token Scope: Icon Size Only (Not Container)

**Recommend: Icon size tokens define just icon dimensions, not container dimensions.** Container dimensions vary per component (36px, 40px, 48px) and are already defined in COMPONENT-SPECS.md. Icon tokens control the `font-size` / `width+height` of the icon glyph itself. Container sizing remains a component-level concern using existing `--space-*` tokens.

### Fixed Scale (Not Adjustable Per Project)

**Recommend: Fixed scale, not architect-adjustable.** The icon size scale (16/20/24/32/40px) is a system invariant like the spacing base unit (4px) and type scale ratios. Making it per-project-adjustable would break the deterministic pipeline -- component specs reference specific size tokens, and changing the scale would invalidate those specs. The existing spacing, typography, and radius tokens are also fixed scales.

### rem Units

**Recommend: Use rem units.** The existing token system uses rem for spacing (`--space-1: 0.25rem`) and typography (`--text-xs: 0.75rem`), but uses px for radii (`--radius-sm: [X]px`). Icon sizes are more analogous to spacing/typography than to radii -- they scale with the user's font-size preference and affect content flow. Using rem:

| Token | rem | px (at 16px root) |
|-------|-----|-------------------|
| `--icon-sm` | 1rem | 16px |
| `--icon-md` | 1.25rem | 20px |
| `--icon-lg` | 1.5rem | 24px |
| `--icon-xl` | 2rem | 32px |
| `--icon-2xl` | 2.5rem | 40px |

### Icon Weight: Part of Algorithm Output

**Recommend: Icon weight IS part of the selection algorithm output, not left to composer discretion.** The algorithm produces `library + weight` as a pair (per the locked decision that "weight changes within the selected library come first for personality expression"). The weight is a system-level decision that applies consistently across all composed screens. Making it composer-decided would produce inconsistent weight usage across screens within the same project.

The algorithm should output a default weight and an emphasis weight:
- **Default weight:** Used for most UI icons (navigation, labels, inline)
- **Emphasis weight:** Used for prominent/CTAs (primary buttons, hero icons)

### Vocabulary Adaptation on User Override

**Recommend: When the user overrides the library choice, the vocabulary mapping for the overridden library is loaded instead of the default vertical's mapping.** Each semantic role (e.g., "merchant", "transfer") has concrete icon names mapped for ALL four libraries, not just the primary. The override swaps which library-specific column is read from the vocabulary -- no vocabulary rewriting needed. This is why the locked decision says "library-agnostic semantic roles" -- the vocabulary is designed for exactly this scenario.

## Standard Stack

### Core

This phase produces no code -- only markdown reference files and token template additions.

| File | Location | Purpose | Why Standard |
|------|----------|---------|--------------|
| `icon-libraries.md` | `core/references/` | Curated library catalog + domain affinity + selection algorithm | Same pattern as existing `verticals/*.md` reference files |
| `generate-system.md` (modified) | `core/workflows/` | Icon size token template + icon selection algorithm | Extends existing token generation pipeline |

### Supporting Reference Data (Pre-Researched)

| Source | Location | Content |
|--------|----------|---------|
| STACK.md | `.planning/research/icon-libraries/` | CDN URLs, version pins, usage syntax for all 4 libraries |
| COMPARISON.md | `.planning/research/icon-libraries/` | Library comparison matrix and domain affinity rationale |
| PITFALLS.md | `.planning/research/icon-libraries/` | 10 documented pitfalls with prevention strategies |
| SUMMARY.md | `.planning/research/` | Executive summary with selection algorithm and build order |

### Curated Library Versions

| Library | Pinned Version | CDN | License |
|---------|---------------|-----|---------|
| Phosphor Icons | @phosphor-icons/web@2.1.2 | jsDelivr | MIT |
| Lucide | lucide@0.576.0 | unpkg | ISC |
| Material Symbols | Google Fonts (evergreen) | Google Fonts | Apache 2.0 |
| Tabler Icons | @tabler/icons-webfont@3.36.1 | jsDelivr | MIT |

## Architecture Patterns

### Recommended File Structure

No new directories. Two file touches:

```
core/
  references/
    icon-libraries.md       # NEW -- curated library catalog + algorithm
    verticals/
      fintech.md            # UNCHANGED in this phase (Phase 10 migrates)
      health.md             # UNCHANGED
      saas.md               # UNCHANGED
      ecommerce.md          # UNCHANGED
  workflows/
    generate-system.md      # MODIFIED -- add icon token template + algorithm section
```

### Pattern 1: Reference Doc Structure (icon-libraries.md)

**What:** A flat, agent-readable markdown file containing all icon library metadata, domain affinity matrix, and the selection algorithm. Organized as sequential sections, not nested JSON.

**When to use:** This is the sole source of truth for all icon library data in the pipeline.

**Structure (modeled on vertical reference files):**

```markdown
# Icon Library Reference

## Curated Libraries
### Phosphor Icons
| Property | Value |
| Version | @phosphor-icons/web@2.1.2 |
| CDN (per-weight) | [URL] |
| Usage | <i class="ph ph-{name}"></i> |
| Weights | thin, light, regular, bold, fill, duotone |
[etc.]

### Lucide
[etc.]

## Domain Affinity Matrix
| Vertical | Primary | Secondary | Default Weight | Emphasis Weight |
[lookup table]

## Selection Algorithm
[deterministic pseudocode: vertical + personality -> library + weight]

## Icon Name Conventions
| Concept | Phosphor | Lucide | Material Symbols | Tabler |
[mapping table]

## CDN Reference
[copy-paste-ready HTML for each library]
```

**Why this structure:** Agents consume markdown as context tokens. Flat tables are cheaper (fewer tokens) and easier to parse than JSON blobs. The vertical files use the same pattern successfully.

### Pattern 2: Token Template Addition (generate-system.md)

**What:** Add icon size tokens to the `:root` block template in the Token File Format section of `generate-system.md`, and add an Icon Library Decision Algorithm section parallel to the existing Color/Typography/Spacing algorithms.

**When to use:** The system architect agent reads `generate-system.md` to know what tokens to emit. Adding icon tokens here makes them part of every generated `tokens.css`.

**Example of the token template addition:**

```css
  /* -- Icon Sizes -- */
  /* 8px-multiple scale for consistent icon rendering */
  --icon-sm: 1rem;     /* 16px -- inline text icons, badges */
  --icon-md: 1.25rem;  /* 20px -- navigation, form labels, list items */
  --icon-lg: 1.5rem;   /* 24px -- primary UI icons, cards, buttons */
  --icon-xl: 2rem;     /* 32px -- feature icons, metric cards */
  --icon-2xl: 2.5rem;  /* 40px -- hero icons, empty states */
```

**Example of the algorithm section:**

```
### Icon Library Decision Algorithm
1. Read vertical from PROJECT.md / STATE.md
2. Look up primary library in icon-libraries.md domain affinity matrix
3. Read Differentiation Seed from DESIGN-BRIEF.md
4. Apply personality overrides:
   IF personality >= 7 (rebellious/bold):
     Use secondary library with bold/fill weight
   IF personality <= 3 AND temperature <= 3 (corporate/clinical):
     Use primary library with light/thin weight
   ELSE:
     Use primary library with regular weight
5. Emit CDN link for selected library + weight in token-showcase.html <head>
6. Record selection in tokens.css comment: /* Icon: [library] [weight] */
```

### Pattern 3: Selection Algorithm as Deterministic Lookup

**What:** The algorithm is a lookup table with override rules, not a decision tree or scoring system. It mirrors how color selection already works: vertical sets baseline, personality shifts expression.

**Key insight from locked decisions:** Weight changes come FIRST for personality expression. Only extreme personality scores (>=7 or <=3) switch libraries entirely. The default case is: same library, different weight.

**Algorithm flow:**
```
INPUT: vertical (string), personality (1-10), temperature (1-10), formality (1-10)

STEP 1: Base lookup
  primary_library = AFFINITY_MATRIX[vertical].primary
  secondary_library = AFFINITY_MATRIX[vertical].secondary
  default_weight = AFFINITY_MATRIX[vertical].default_weight
  emphasis_weight = AFFINITY_MATRIX[vertical].emphasis_weight

STEP 2: Personality weight adjustment (within primary library)
  IF personality >= 7:
    default_weight = "bold"  (or FILL:1 for Material Symbols)
    emphasis_weight = "fill"
  IF personality <= 3:
    default_weight = "light" (or wght:300 for Material Symbols)
    emphasis_weight = "regular"

STEP 3: Extreme personality library switch
  IF personality >= 8 AND primary != Phosphor:
    switch to secondary_library (if Phosphor, use bold weight)
  IF personality <= 2 AND primary != Lucide:
    switch to secondary_library (if Lucide, use its default stroke)

STEP 4: User override
  IF user_preference IS SET in DESIGN-BRIEF.md:
    use user_preference library
    keep weight from Step 2

OUTPUT: { library, default_weight, emphasis_weight, cdn_url, usage_syntax }
```

### Anti-Patterns to Avoid

- **Over-engineering the reference doc as JSON/YAML:** Agents consume markdown. JSON wastes tokens on structural characters. Use tables and sections.
- **Including icon name vocabularies in this phase:** Phase 10 handles per-vertical icon vocabularies. Phase 9's `icon-libraries.md` documents naming conventions (how names are formed) but NOT curated icon name lists.
- **Making icon color a separate token system:** Icons inherit color via `currentColor`. No `--icon-color-*` tokens needed. Document the pattern in `icon-libraries.md`: "Icons use `color: var(--text-secondary)` via currentColor inheritance."
- **Adding an `--icon-library` documentation token to tokens.css:** This is tempting but useless -- CSS custom properties can store strings but nothing reads them programmatically. Document the selection in a comment instead.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Icon library metadata | Custom JSON registry with scripts | Flat markdown reference doc | Agents read markdown as context. No parsing needed. Existing vertical files prove this pattern works. |
| Selection algorithm | Scoring/ranking engine | Deterministic lookup table with override rules | AI agents need unambiguous answers. Scoring produces ties and ambiguity. Lookup tables are deterministic. |
| Icon size scale | Custom calculation from base unit | Fixed 8px-multiple scale (16/20/24/32/40) | Industry standard (Michelin Design System, Material Design). Matches existing component spec dimensions exactly. |
| CDN version tracking | Version check script | Pinned versions with "last verified" dates in the reference doc | No runtime dependency checking. Versions are design-time constants updated manually on a quarterly cadence. |

**Key insight:** This phase is 100% static data authoring. There is no code to write, no scripts to create, no packages to install. The deliverables are two markdown file modifications.

## Common Pitfalls

### Pitfall 1: Inconsistent Token Naming

**What goes wrong:** Using `--icon-size-sm` instead of `--icon-sm`, or mixing naming styles.
**Why it happens:** The existing project research uses `--icon-size-*` naming, but the existing token system uses shorter names: `--text-sm`, `--space-4`, `--radius-md` -- NOT `--text-size-sm`, `--space-size-4`.
**How to avoid:** Follow the established pattern. The token naming convention is `--{category}-{scale}`: `--icon-sm`, `--icon-md`, `--icon-lg`, `--icon-xl`, `--icon-2xl`.
**Warning signs:** Grep for `--icon-size` vs `--icon-` in generated output.

### Pitfall 2: Material Symbols Version Pinning

**What goes wrong:** Material Symbols uses Google Fonts CDN which auto-updates (no version pin). Other libraries pin to explicit npm versions.
**Why it happens:** Google Fonts is evergreen by design. There is no `@0.40.2` in the Google Fonts URL.
**How to avoid:** Document that Material Symbols via Google Fonts is the ONE exception to version pinning. The npm package (`material-symbols@0.40.2`) can be pinned for self-hosting. For CDN usage, the Google Fonts URL is effectively pinned by font family name ("Material+Symbols+Outlined" is the stable identifier).
**Warning signs:** The reference doc should explicitly note this exception rather than pretending all libraries are equally pinnable.

### Pitfall 3: Algorithm Ambiguity at Boundary Values

**What goes wrong:** The algorithm doesn't specify what happens at personality=7 exactly (is it "bold" or "switch library"?).
**Why it happens:** Threshold values need explicit boundary definitions (inclusive vs exclusive).
**How to avoid:** Use clear boundary rules: "personality >= 7" for weight override, "personality >= 8" for library switch. Document these as inclusive lower bounds. The architect agent should never face ambiguity.
**Warning signs:** If the algorithm pseudocode uses ranges like "7-10" without specifying inclusive/exclusive bounds.

### Pitfall 4: Forgetting Lucide's JS Initialization in Algorithm Output

**What goes wrong:** The algorithm outputs a CDN URL for Lucide but doesn't note that Lucide requires `lucide.createIcons()` after DOM load. Other libraries (Phosphor, Material Symbols, Tabler) are pure CSS.
**Why it happens:** Lucide is the exception in the curated set -- the only library requiring JavaScript initialization.
**How to avoid:** The algorithm output must include not just the CDN URL but the initialization pattern. `icon-libraries.md` should have a "requires JS" flag per library. The CDN Reference section should include the full initialization snippet for Lucide.
**Warning signs:** Lucide CDN URL without accompanying script initialization in the reference doc.

### Pitfall 5: Breaking Existing generate-system.md Structure

**What goes wrong:** The icon token template addition or algorithm section disrupts the existing file structure, causing the system architect agent to misparse the workflow.
**Why it happens:** `generate-system.md` is a carefully structured file with sequential sections. Inserting new content in the wrong location breaks the agent's reading flow.
**How to avoid:** Add icon tokens to the Token File Format template section (after z-index, before the closing `}`), and add the Icon Library Decision Algorithm section parallel to existing algorithm sections (after Shadow Decision Algorithm, before Token File Format). Read the file structure carefully before modification.
**Warning signs:** Diff the modified file against the original to verify only additive changes.

## Code Examples

### Icon Size Token Template (for generate-system.md)

```css
/* Source: Michelin Design System 8px-multiple pattern, adapted for Motif rem convention */

  /* -- Icon Sizes -- */
  /* 8px-multiple scale (16/20/24/32/40px) */
  --icon-sm: 1rem;     /* 16px -- inline text, badges, status indicators */
  --icon-md: 1.25rem;  /* 20px -- navigation items, form labels, list icons */
  --icon-lg: 1.5rem;   /* 24px -- primary UI icons, card headers, buttons */
  --icon-xl: 2rem;     /* 32px -- feature highlights, metric cards */
  --icon-2xl: 2.5rem;  /* 40px -- hero sections, empty state illustrations */
```

### Domain Affinity Matrix (for icon-libraries.md)

```markdown
<!-- Source: Cross-reference of project research SUMMARY.md + vertical component specs -->

| Vertical | Primary Library | Secondary Library | Default Weight | Emphasis Weight | Rationale |
|----------|----------------|-------------------|----------------|-----------------|-----------|
| Fintech | Phosphor Icons | Lucide | regular | bold | Weight variation for data-dense dashboards; duotone for hierarchy |
| Health | Material Symbols (Rounded) | Phosphor Icons | regular (wght:400) | filled (FILL:1) | Broadest medical icon coverage; Rounded style is warm, not clinical |
| SaaS | Lucide | Phosphor Icons | default (2px stroke) | default (2px stroke) | Feather-derived SaaS standard; single style means no weight decision |
| E-commerce | Material Symbols (Rounded) | Tabler Icons | regular (wght:400) | filled (FILL:1) | Action-oriented icons with fill for CTAs; Tabler for niche categories |
```

### Selection Algorithm Pseudocode (for icon-libraries.md)

```
<!-- Source: Locked decisions from CONTEXT.md + existing differentiation system in design-inputs.md -->

SELECTION ALGORITHM
===================
Inputs: vertical, personality (1-10), temperature (1-10), formality (1-10)
Optional: user_library_override (from DESIGN-BRIEF.md)

Step 1 -- User override check
  IF user_library_override IS SET:
    selected_library = user_library_override
    GOTO Step 2 (still apply weight rules)

  ELSE:
    selected_library = AFFINITY_MATRIX[vertical].primary

Step 2 -- Weight selection based on personality
  IF selected_library supports weights (Phosphor or Material Symbols):
    IF personality >= 7 (bold/rebellious):
      default_weight = bold (Phosphor) OR wght:600 (Material Symbols)
      emphasis_weight = fill (Phosphor) OR FILL:1,wght:700 (Material Symbols)
    ELIF personality <= 3 (corporate/conservative):
      default_weight = light (Phosphor) OR wght:300 (Material Symbols)
      emphasis_weight = regular (Phosphor) OR wght:400 (Material Symbols)
    ELSE (personality 4-6, balanced):
      default_weight = regular (Phosphor) OR wght:400 (Material Symbols)
      emphasis_weight = bold (Phosphor) OR FILL:1 (Material Symbols)
  ELSE (Lucide or Tabler -- no weight variants):
    default_weight = default
    emphasis_weight = default

Step 3 -- Extreme personality library switch
  IF personality >= 8 AND NOT user_library_override:
    selected_library = AFFINITY_MATRIX[vertical].secondary
    Recalculate weights for new library (repeat Step 2)
  IF personality <= 2 AND NOT user_library_override:
    selected_library = AFFINITY_MATRIX[vertical].secondary
    Recalculate weights for new library (repeat Step 2)

Step 4 -- Material Symbols style family selection
  IF selected_library = Material Symbols:
    IF formality <= 4 (casual/approachable):
      style_family = Rounded
    ELIF formality >= 7 (formal/institutional):
      style_family = Sharp
    ELSE:
      style_family = Outlined

Step 5 -- Emit output
  OUTPUT: {
    library: selected_library,
    default_weight: default_weight,
    emphasis_weight: emphasis_weight,
    style_family: style_family (Material Symbols only),
    cdn_url: LIBRARY_CDN[selected_library][default_weight],
    usage_syntax: LIBRARY_SYNTAX[selected_library]
  }
```

### CDN Reference Snippets (for icon-libraries.md)

```html
<!-- Source: Verified via jsDelivr, unpkg, Google Fonts CDN endpoints -->

<!-- Phosphor Icons (per-weight, recommended) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/regular/style.css" />
<!-- Additional weight as needed -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/bold/style.css" />

<!-- Lucide (JS mode, renders only icons present in DOM) -->
<script src="https://unpkg.com/lucide@0.576.0"></script>
<script>document.addEventListener('DOMContentLoaded', () => lucide.createIcons());</script>

<!-- Material Symbols (Google Fonts, Outlined) -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
<!-- Material Symbols (Rounded) -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded" rel="stylesheet" />

<!-- Tabler Icons (outline only -- filled webfont has known bug) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.36.1/dist/tabler-icons.min.css" />
```

### Icon Name Convention Table (for icon-libraries.md)

```markdown
<!-- Source: Verified via official library documentation and search endpoints -->

| Concept | Phosphor | Lucide | Material Symbols | Tabler |
|---------|----------|--------|-----------------|--------|
| Home | ph-house | house | home | ti-home |
| Search | ph-magnifying-glass | search | search | ti-search |
| Settings | ph-gear | settings | settings | ti-settings |
| User/Profile | ph-user | user | person | ti-user |
| Cart | ph-shopping-cart | shopping-cart | shopping_cart | ti-shopping-cart |
| Heart/Favorite | ph-heart | heart | favorite | ti-heart |
| Arrow Right | ph-arrow-right | arrow-right | arrow_forward | ti-arrow-right |
| Chart/Analytics | ph-chart-line | bar-chart-2 | bar_chart | ti-chart-line |
| Notification | ph-bell | bell | notifications | ti-bell |
| Close | ph-x | x | close | ti-x |
| Check/Done | ph-check | check | check | ti-check |
| Mail | ph-envelope | mail | mail | ti-mail |
| Calendar | ph-calendar | calendar | calendar_month | ti-calendar |
| Lock/Security | ph-lock | lock | lock | ti-lock |
| Credit Card | ph-credit-card | credit-card | credit_card | ti-credit-card |
```

### Material Symbols CSS Setup (for icon-libraries.md)

```css
/* Source: Google Developers Material Symbols guide */
/* CRITICAL: Always set explicit font-size AND matching opsz to prevent oversized rendering */
.material-symbols-outlined,
.material-symbols-rounded,
.material-symbols-sharp {
  font-size: var(--icon-lg);  /* Default 24px */
  font-variation-settings:
    'FILL' 0,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}

/* Filled variant (emphasis weight) */
.material-symbols-outlined.filled,
.material-symbols-rounded.filled,
.material-symbols-sharp.filled {
  font-variation-settings:
    'FILL' 1,
    'wght' 400,
    'GRAD' 0,
    'opsz' 24;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Bracket placeholders `[MerchantIcon 40x40]` | Concrete icon names from curated libraries | Phase 9+ (this milestone) | Composed screens render real icons instead of text placeholders |
| No icon sizing tokens | `--icon-sm` through `--icon-2xl` in tokens.css | Phase 9 (this phase) | Icon dimensions use tokens, not hardcoded px values |
| Agent chooses library ad-hoc | Deterministic algorithm: vertical + personality -> library | Phase 9 (this phase) | Eliminates agent guesswork, ensures consistency |
| Material Icons (legacy) | Material Symbols (variable font) | Google transition 2022-2023 | Variable font axes (fill, weight, grade, opsz) replace separate icon families |
| Feather Icons (unmaintained since 2020) | Lucide (active fork, 1,702 icons) | Community fork 2020+ | Lucide is the maintained successor; Feather should never be recommended |

**Deprecated/outdated:**
- Material Icons (legacy) -- superseded by Material Symbols; legacy package is deprecated
- Feather Icons -- unmaintained since 2020; use Lucide
- `@latest` CDN URLs -- pin to specific versions always
- Font Awesome (free tier) -- freemium model conflicts with Motif's MIT license

## Open Questions

1. **Lucide version volatility (pre-1.0)**
   - What we know: Lucide is v0.576.0 (pre-1.0), releases weekly, icon names can change between minor versions
   - What's unclear: Whether the pinned v0.576.0 will still be the best pin target when Phase 10/11 execute
   - Recommendation: Pin at v0.576.0 now. Add a "last verified" date in the reference doc. Review quarterly. When Lucide reaches 1.0, update the pin and document the migration.

2. **Material Symbols CDN subsetting**
   - What we know: Full font is ~295KB per style family. Google Fonts supports `&text=` parameter for subsetting.
   - What's unclear: Whether subsetting is practical for composed screens (dynamic icon usage vs fixed showcase)
   - Recommendation: Accept full font load for now. The 295KB is comparable to a web font file. Document the subsetting option in `icon-libraries.md` for future optimization.

3. **Phosphor duotone secondary color control**
   - What we know: Duotone renders secondary layer at 20% opacity by default
   - What's unclear: Exact CSS mechanism for overriding the secondary color
   - Recommendation: Document duotone as a Phosphor differentiator in `icon-libraries.md` but defer detailed duotone styling to v1.2+ (per REQUIREMENTS.md "Advanced Icons" section ICON-02). Phase 9 only needs to document that duotone EXISTS as a weight option.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `core/workflows/generate-system.md` -- token template format, algorithm section pattern, rem unit convention
- Codebase analysis: `core/references/verticals/fintech.md`, `health.md`, `saas.md`, `ecommerce.md` -- component spec icon placeholders, domain affinity signals
- Codebase analysis: `core/references/design-inputs.md` -- differentiation seed (personality/temperature/formality axes)
- Project research: `.planning/research/icon-libraries/STACK.md` -- all 4 library specs verified via official repos
- Project research: `.planning/research/SUMMARY.md` -- selection algorithm and domain affinity matrix
- [@phosphor-icons/web npm](https://www.npmjs.com/package/@phosphor-icons/web) -- v2.1.2 confirmed current
- [Lucide npm](https://www.npmjs.com/package/lucide) -- v0.576.0 confirmed current
- [@tabler/icons-webfont npm](https://www.npmjs.com/package/@tabler/icons-webfont) -- v3.36.1 confirmed current
- [material-symbols npm](https://www.npmjs.com/package/material-symbols) -- v0.40.2 confirmed current
- [Michelin Design System icon size tokens](https://designsystem.michelin.com/tokens/icon-size) -- 8px-multiple pattern confirmed

### Secondary (MEDIUM confidence)
- [Tabler Icons filled webfont bug (GitHub #1452)](https://github.com/tabler/tabler-icons/issues/1452) -- filled variant conflict, verified January 2026
- [Lucide documentation](https://lucide.dev/guide/packages/lucide) -- JS initialization requirement
- [Material Symbols guide (Google Developers)](https://developers.google.com/fonts/docs/material_symbols) -- variable font axes, optical size default

### Tertiary (LOW confidence)
- Material Symbols CDN subsetting via `&text=` parameter -- documented but not independently tested

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all library versions verified via npm registry on 2026-03-04; CDN endpoints confirmed live in project research
- Architecture: HIGH -- follows existing patterns (vertical reference files, token template, algorithm sections) already proven in v1.0
- Pitfalls: HIGH -- all critical pitfalls verified via official documentation and GitHub issues; icon name hallucination risk confirmed by domain analysis

**Research date:** 2026-03-04
**Valid until:** 2026-06-04 (90 days -- stable domain; quarterly version review for Lucide)
