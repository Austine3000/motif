# Domain Pitfalls: Icon Library Integration

**Domain:** Icon library integration for AI design engineering system (Motif)
**Researched:** 2026-03-04

## Critical Pitfalls

Mistakes that cause broken output or require rework.

### Pitfall 1: AI Agents Hallucinate Icon Names

**What goes wrong:** The composer agent emits icon names that don't exist in the selected library. For example, using `ph-dashboard` (doesn't exist) instead of `ph-chart-line` (exists), or `settings_gear` (Material Symbols uses `settings`, not `settings_gear`).

**Why it happens:** LLMs generate plausible-sounding icon names from training data. Different libraries have different naming conventions (Phosphor uses `ph-magnifying-glass`, Lucide uses `search`, Material Symbols uses `search`). The agent "guesses" based on what seems right.

**Consequences:** Broken icons in composed screens. Empty spaces where icons should be. User sees the design is incomplete and loses trust in the tool.

**Prevention:**
1. Provide icon name catalogs organized by semantic category (navigation, actions, status, data, commerce, etc.) in the reference data the agent reads.
2. Document the naming convention differences explicitly (Material Symbols uses underscores, others use hyphens).
3. Include a "common icons" mapping table in COMPONENT-SPECS.md so the composer has a lookup source.

**Detection:** Icons not rendering in token-showcase.html or composed screens. Browser dev tools will show the icon font glyph as a blank square or missing character.

### Pitfall 2: CDN URL Versioning with @latest

**What goes wrong:** Using `@latest` in CDN URLs. A composed design works on day 1. Three months later, the library updates, icon names change or are removed, and the same HTML now has broken icons.

**Why it happens:** `@latest` is convenient and shown in many library docs as the quick-start approach. Developers (and agents) default to it.

**Consequences:** Non-reproducible output. The same design system produces different results at different times. Debugging is difficult because the breakage is silent (missing icon, no error).

**Prevention:** Always pin to specific versions in all CDN URLs. Store pinned versions in the icon library registry. Update versions deliberately, not implicitly.

**Detection:** Periodic: re-render a known-good design and visually compare. Automated: check if CDN URLs contain `@latest` in generated output.

### Pitfall 3: Lucide Requires JavaScript Initialization

**What goes wrong:** Including the Lucide CDN script but forgetting to call `lucide.createIcons()` after the DOM loads. Icons render as empty `<i data-lucide="..."></i>` elements -- nothing visible.

**Why it happens:** Every other library in the curated set (Phosphor, Material Symbols, Tabler) uses icon fonts that work with just a CSS `<link>`. Lucide's JS-based approach is the exception. The architect or composer agent may follow the pattern from other libraries and omit the initialization script.

**Consequences:** All Lucide icons are invisible on the page. The HTML looks correct but nothing renders.

**Prevention:**
1. When Lucide is selected, the architect MUST emit both the script tag AND a DOMContentLoaded handler calling `lucide.createIcons()`.
2. Alternatively, use `lucide-static` icon font mode (CSS-only, no JS) at the cost of loading all icons.
3. Document this exception prominently in the icon library registry.

**Detection:** Page loads with no visible icons despite correct HTML markup.

## Moderate Pitfalls

### Pitfall 4: Material Symbols Icon Names Use Underscores

**What goes wrong:** Using `shopping-cart` (hyphenated, like every other library) instead of `shopping_cart` (underscored, Material Symbols convention).

**Prevention:** Include a naming convention note in the registry and in every Material Symbols reference: "Material Symbols uses underscores, not hyphens. Write `shopping_cart`, not `shopping-cart`."

### Pitfall 5: Tabler Filled Webfont Bug

**What goes wrong:** Trying to use outline and filled Tabler icons simultaneously via the webfont CDN. The filled webfont CSS replaces outline icon definitions rather than adding filled variants alongside them.

**Prevention:** Treat Tabler webfont as outline-only. If filled icons are needed, use a different library (Phosphor's `ph-fill` or Material Symbols with `FILL: 1`). This is a known bug (GitHub issue #1452, January 2026).

### Pitfall 6: Loading All Phosphor Weights (~3MB)

**What goes wrong:** Using the convenience script tag `<script src=".../@phosphor-icons/web@2.1.2"></script>` which loads all 6 weights (~3MB of fonts + CSS). Token-showcase.html takes 5+ seconds to load.

**Prevention:** Load individual weight CSS files. A typical design needs 1-2 weights (e.g., Regular + Fill). Each weight is ~500KB. The architect should select weights deliberately, not load everything.

### Pitfall 7: Material Symbols Default Font Size Is Too Large

**What goes wrong:** Material Symbols defaults to 48px optical size, which makes icons appear oversized compared to 24px icons from other libraries.

**Prevention:** Always set explicit sizing via CSS:
```css
.material-symbols-outlined {
  font-size: 24px;
  font-variation-settings: 'opsz' 24;
}
```
The `opsz` (optical size) axis MUST match the display size for correct rendering. A 24px icon with `opsz: 48` looks wrong -- strokes are too thin for the size.

### Pitfall 8: Icon Font Color Inheritance Surprises

**What goes wrong:** An icon inherits `color` from a parent element the developer didn't intend. For example, a red error message container makes all icons inside it red, including a green success checkmark.

**Prevention:** Use explicit icon color tokens:
```css
.icon-success { color: var(--color-icon-success); }
.icon-error { color: var(--color-icon-error); }
```
Don't rely on color inheritance for icon semantics.

## Minor Pitfalls

### Pitfall 9: Lucide Icon Font Loads All Icons

**What goes wrong:** Using `lucide-static/font/lucide.css` via CDN is convenient (no JS) but includes ALL 1,702 icons in the font file. This is larger than necessary.

**Prevention:** For token-showcase.html (which shows a few sample icons), this is acceptable. For production composed screens, prefer the JS approach with `lucide.createIcons()` which only renders icons present in the DOM. Document the tradeoff.

### Pitfall 10: Cross-Library Icon Name Confusion

**What goes wrong:** After switching a design from Phosphor to Lucide, the composer continues using Phosphor names (`ph-house`) instead of Lucide names (`house`).

**Prevention:** The selected library name should be prominently documented in COMPONENT-SPECS.md. The composer agent should read the library selection before emitting any icon markup.

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Icon registry data modeling | Over-engineering the JSON schema | Keep it flat and readable. Agents read this as context -- deeply nested JSON wastes tokens. |
| Architect agent enhancement | Agent ignores registry and hardcodes a library | Include registry file path in agent instructions. Verify output CDN URL matches registry. |
| Composer agent enhancement | Hallucinated icon names | Provide semantic icon catalogs. Include the icon name mapping table in COMPONENT-SPECS.md. |
| Version updates | Forgetting to update pinned versions | Add a version check note in the registry with "last verified" dates. |
| Multi-library support | Mixing libraries in one design | Enforce one-library-per-design in architect agent instructions. |

## Sources

- [Tabler Icons filled webfont bug (GitHub issue #1452)](https://github.com/tabler/tabler-icons/issues/1452) -- Filled variant webfont conflict
- [Lucide documentation](https://lucide.dev/guide/packages/lucide) -- JS initialization requirement
- [Lucide Static documentation](https://lucide.dev/guide/packages/lucide-static) -- Font size warning
- [Material Symbols guide](https://developers.google.com/fonts/docs/material_symbols) -- Variable font axes, optical size behavior
- [Phosphor Icons web](https://github.com/phosphor-icons/web) -- Bundle size warning (~3MB all weights)

---
*Pitfalls research for: Motif icon library integration*
*Researched: 2026-03-04*
