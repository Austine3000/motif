# Stack Research: Icon Library Curated Set

**Domain:** Icon library selection for AI design engineering system (Motif)
**Researched:** 2026-03-04
**Confidence:** HIGH (verified via official repos, CDN endpoints, and npm registry)

---

## Executive Summary

Motif needs a curated set of 3-5 icon libraries that the system architect agent can select from based on vertical (fintech, health, SaaS, e-commerce) and brand personality. Each library must work via CDN (no build step), support CSS-class or inline-SVG usage in static HTML files like `token-showcase.html`, and pair well with CSS custom properties for theming.

**Recommendation: 4 libraries** -- Phosphor Icons, Lucide, Material Symbols, and Tabler Icons.

Heroicons is excluded from the curated set despite its quality. Rationale below.

---

## The Curated Set

### 1. Phosphor Icons (Primary Recommendation)

| Property | Value |
|----------|-------|
| **Version** | @phosphor-icons/web v2.1.2 |
| **Icon Count** | ~1,248 base icons x 6 weights = ~7,488 total variants |
| **License** | MIT |
| **Weights/Styles** | Thin, Light, Regular, Bold, Fill, Duotone (6 variants) |
| **CDN (jsDelivr)** | `https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/regular/style.css` |
| **CDN (unpkg)** | `https://unpkg.com/@phosphor-icons/web@2.1.2` |
| **CDN (all weights)** | Script tag: `https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2` (~3MB, all weights) |

**Usage (CSS class / icon font):**
```html
<!-- Load one weight at a time (recommended) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/regular/style.css" />

<!-- Use with CSS class -->
<i class="ph ph-house"></i>           <!-- Regular -->
<i class="ph-bold ph-house"></i>      <!-- Bold -->
<i class="ph-light ph-house"></i>     <!-- Light -->
<i class="ph-thin ph-house"></i>      <!-- Thin -->
<i class="ph-fill ph-house"></i>      <!-- Fill -->
<i class="ph-duotone ph-house"></i>   <!-- Duotone -->
```

**CSS Custom Properties Compatibility:**
Phosphor uses icon fonts under the hood. Icons inherit `color` and `font-size` from CSS, so they respond to:
```css
.icon-wrapper {
  color: var(--color-icon-primary);
  font-size: var(--icon-size-md);
}
```
Duotone weight is unique -- the secondary layer renders at 20% opacity by default, which can be styled. No other library in this set offers duotone.

**Domain Affinity:**
- **Fintech:** Strong. Clean geometric shapes, duotone adds visual hierarchy for dashboards. Icons like `ph-chart-line`, `ph-bank`, `ph-currency-dollar`, `ph-wallet`, `ph-shield-check`.
- **SaaS:** Strong. 6 weight variants let the architect match any brand weight from lightweight to heavy. Icons like `ph-gear`, `ph-users`, `ph-chart-bar`, `ph-cloud`.
- **E-commerce:** Strong. Fill variant works well for action buttons (cart, heart). Icons like `ph-shopping-cart`, `ph-tag`, `ph-package`, `ph-credit-card`.
- **Health:** Moderate. Has medical icons (`ph-first-aid`, `ph-heartbeat`, `ph-pill`) but coverage is thinner than SaaS/fintech.

**Why Primary:** Most weight variants of any library (6). Single CDN link per weight. Icon font means zero JS required. Duotone is a differentiator no other library offers. MIT license.

**Confidence:** HIGH -- Verified via GitHub repo (phosphor-icons/web), jsDelivr CDN, and npm registry.

---

### 2. Lucide

| Property | Value |
|----------|-------|
| **Version** | v0.576.0 (actively maintained, releases every few days) |
| **Icon Count** | ~1,702 icons |
| **License** | ISC (functionally equivalent to MIT, permits commercial use) |
| **Weights/Styles** | Single outline style only. Stroke width adjustable via attribute. |
| **CDN (unpkg)** | `https://unpkg.com/lucide@0.576.0` |
| **CDN (jsDelivr)** | `https://cdn.jsdelivr.net/npm/lucide@0.576.0/dist/umd/lucide.min.js` |
| **CDN (icon font)** | `https://unpkg.com/lucide-static@latest/font/lucide.css` |
| **CDN (SVG sprite)** | `https://unpkg.com/lucide-static@latest/sprite.svg` |

**Usage (JavaScript / data attributes):**
```html
<!-- Option A: JS-based (recommended for Motif) -->
<script src="https://unpkg.com/lucide@0.576.0"></script>
<i data-lucide="house"></i>
<i data-lucide="settings"></i>
<script>lucide.createIcons();</script>

<!-- Option B: Icon font via lucide-static (no JS, but loads ALL icons) -->
<link rel="stylesheet" href="https://unpkg.com/lucide-static@latest/font/lucide.css" />
<i class="icon-house"></i>

<!-- Option C: Individual SVG via CDN -->
<img src="https://unpkg.com/lucide-static@latest/icons/house.svg" width="24" height="24" />
```

**CSS Custom Properties Compatibility:**
With the JS approach, Lucide renders inline SVGs that use `stroke="currentColor"`, so they inherit color from CSS:
```css
[data-lucide] {
  color: var(--color-icon-primary);
  width: var(--icon-size-md);
  height: var(--icon-size-md);
}
```
Stroke width is controllable per-icon via attributes: `<i data-lucide="house" stroke-width="1.5"></i>`.

**Domain Affinity:**
- **SaaS:** Excellent. Clean, minimal, consistent stroke weight. Fork of Feather Icons -- the most popular SaaS icon style. Icons like `settings`, `users`, `bar-chart`, `cloud`, `layers`.
- **Health:** Good. Clean legibility at small sizes. Icons like `heart-pulse`, `pill`, `stethoscope`, `activity`, `clipboard`.
- **Fintech:** Good. Professional but lighter feel than Phosphor. Icons like `trending-up`, `wallet`, `banknote`, `shield`.
- **E-commerce:** Moderate. Has essentials (`shopping-cart`, `tag`, `package`) but the outline-only style may feel too minimal for e-commerce CTAs.

**Why Included:** Largest icon count (1,702). Most actively maintained (releases every few days). Clean SaaS aesthetic that pairs well with modern design systems. Feather Icons successor with strong community.

**Confidence:** HIGH -- Verified via GitHub (lucide-icons/lucide), npm registry, unpkg CDN.

---

### 3. Material Symbols

| Property | Value |
|----------|-------|
| **Version** | npm: material-symbols v0.40.2; CDN: Google Fonts (always latest) |
| **Icon Count** | 2,500+ icons |
| **License** | Apache License 2.0 |
| **Weights/Styles** | 3 style families (Outlined, Rounded, Sharp) x variable font axes (Fill 0-1, Weight 100-700, Grade -50 to 200, Optical Size 20-48) |
| **CDN (Google Fonts)** | `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined` |
| **CDN (Google Fonts, Rounded)** | `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded` |
| **CDN (Google Fonts, Sharp)** | `https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp` |

**Usage (CSS class / web font):**
```html
<!-- Load from Google Fonts CDN -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />

<!-- Use with CSS class -->
<span class="material-symbols-outlined">home</span>
<span class="material-symbols-outlined">settings</span>
<span class="material-symbols-outlined">shopping_cart</span>
```

**CSS Custom Properties Compatibility:**
This is the most CSS-custom-property-friendly library. Variable font axes are controlled entirely via CSS `font-variation-settings`:
```css
.material-symbols-outlined {
  color: var(--color-icon-primary);
  font-size: var(--icon-size-md);
  font-variation-settings:
    'FILL' var(--icon-fill, 0),
    'wght' var(--icon-weight, 400),
    'GRAD' var(--icon-grade, 0),
    'opsz' var(--icon-optical-size, 24);
}
```
This means a single CSS rule can control fill, weight, grade, and optical size -- all through custom properties. No other library offers this level of CSS-driven configurability.

**Domain Affinity:**
- **E-commerce:** Excellent. Largest icon count with comprehensive coverage: `shopping_cart`, `storefront`, `payments`, `local_shipping`, `inventory`, `loyalty`. Rounded style feels approachable for consumer-facing UIs.
- **Health:** Excellent. Extensive medical/health icons: `health_and_safety`, `medical_services`, `medication`, `monitor_heart`, `vaccines`. Google's investment in icon diversity shows here.
- **SaaS:** Good. Sharp style works for enterprise SaaS. But can feel "Google-y" -- less distinctive than Phosphor or Lucide.
- **Fintech:** Moderate. Has finance icons but the style is recognizably Material Design, which may not suit fintech brands seeking differentiation.

**Why Included:** Largest icon count (2,500+). Variable font technology is the most advanced CSS integration story. Three distinct style families (Outlined/Rounded/Sharp) cover different brand personalities from one library. Google Fonts CDN is the most reliable CDN in existence. Apache 2.0 license.

**Critical Note:** Default font file is ~295KB. For production, subset to needed icons using the Google Fonts `&icon_names=` parameter or the `text=` parameter.

**Confidence:** HIGH -- Verified via Google Developers documentation and Google Fonts CDN.

---

### 4. Tabler Icons

| Property | Value |
|----------|-------|
| **Version** | @tabler/icons v3.38.0; @tabler/icons-webfont v3.36.1 |
| **Icon Count** | 6,038 total (4,985 outline + 1,053 filled) |
| **License** | MIT |
| **Weights/Styles** | Outline (default), Filled |
| **CDN (jsDelivr, webfont)** | `https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.36.1/dist/tabler-icons.min.css` |
| **CDN (cdnjs)** | Available on cdnjs.com/libraries/tabler-icons |
| **CDN (unpkg)** | `https://unpkg.com/@tabler/icons-webfont@3.36.1/dist/tabler-icons.min.css` |

**Usage (CSS class / icon font):**
```html
<!-- Load webfont -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.36.1/dist/tabler-icons.min.css" />

<!-- Use with CSS class -->
<i class="ti ti-home"></i>
<i class="ti ti-settings"></i>
<i class="ti ti-shopping-cart"></i>
```

**CSS Custom Properties Compatibility:**
Same as Phosphor -- icon font approach means `color` and `font-size` work:
```css
.ti {
  color: var(--color-icon-primary);
  font-size: var(--icon-size-md);
}
```

**Known Issue (Filled Variant):** As of January 2026, the webfont has a bug where outline and filled icons cannot be used simultaneously via CDN. The filled webfont replaces outline classes rather than adding new ones. The SVG package works fine, but the webfont `ti-xxx-filled` classes are unreliable. This means Motif should treat Tabler as outline-only for webfont/CDN usage.

**Domain Affinity:**
- **SaaS:** Excellent. Largest icon count of any library in the set (6,038). Designed on 24x24 grid with 2px stroke -- consistent and professional. When the architect needs a niche icon, Tabler almost certainly has it.
- **E-commerce:** Good. Comprehensive coverage. Icons like `ti-shopping-cart`, `ti-brand-shopify`, `ti-truck`, `ti-receipt`, `ti-discount`.
- **Fintech:** Good. Icons like `ti-chart-line`, `ti-building-bank`, `ti-credit-card`, `ti-currency-dollar`, `ti-report-money`.
- **Health:** Moderate. Has basics but health-specific coverage is thinner.

**Why Included:** By far the largest icon count (6,038). When Phosphor or Lucide lacks a specific icon, Tabler is the safety net. MIT license. Active development (releases every few days). The 24x24 / 2px stroke is a clean, universal style.

**Confidence:** HIGH (icon count, CDN, license verified via GitHub and npm). MEDIUM (filled webfont bug verified via GitHub issue #1452 but may be fixed in future releases).

---

## Excluded: Heroicons

| Property | Value |
|----------|-------|
| **Version** | v2.1.5 |
| **Icon Count** | ~316 icons |
| **License** | MIT |
| **Weights/Styles** | Outline (24x24), Solid (24x24), Mini (20x20), Micro (16x16) |

**Why Excluded:**

1. **Too few icons (316).** Phosphor has 1,248, Lucide has 1,702, Tabler has 6,038. For an architect agent that needs to map specific UI elements to icon names, 316 is constraining. The agent will frequently need icons that don't exist.

2. **No icon font / CSS class approach.** Heroicons is SVG-first. The official packages are `@heroicons/react` and `@heroicons/vue`. For vanilla HTML (token-showcase.html), usage requires either copying raw SVG markup inline or using a third-party web component wrapper (`hero-icon-js`). Neither is as clean as `<i class="ph ph-house"></i>`.

3. **Tailwind coupling.** Heroicons is designed by the Tailwind CSS team and optimized for Tailwind projects. Motif uses CSS custom properties, not Tailwind utility classes. The documentation and examples assume Tailwind styling patterns.

4. **The curated set already covers its niche.** Lucide serves the same clean/minimal aesthetic with 5x the icon count and better vanilla HTML support.

**When to reconsider:** If Motif adds a Tailwind-specific vertical or if Heroicons grows to 500+ icons with an icon font package.

---

## Comparison Matrix

| Criterion | Phosphor | Lucide | Material Symbols | Tabler | Heroicons |
|-----------|----------|--------|-----------------|--------|-----------|
| **Icon Count** | ~1,248 | ~1,702 | ~2,500+ | ~6,038 | ~316 |
| **Weight Variants** | 6 (thin/light/regular/bold/fill/duotone) | 1 (adjustable stroke) | 3 styles x variable axes | 2 (outline/filled) | 4 (outline/solid/mini/micro) |
| **License** | MIT | ISC | Apache 2.0 | MIT | MIT |
| **CDN Icon Font** | Yes | Yes (lucide-static) | Yes (Google Fonts) | Yes | No |
| **CSS Class Usage** | `<i class="ph ph-X">` | `<i class="icon-X">` | `<span class="material-symbols-outlined">X</span>` | `<i class="ti ti-X">` | N/A (SVG only) |
| **JS Required** | No | Optional (JS or font) | No | No | No (but manual SVG) |
| **CSS Custom Props** | Good (color, font-size) | Good (color, width, stroke) | Excellent (font-variation-settings) | Good (color, font-size) | Good (stroke, fill) |
| **Bundle Size (all)** | ~3MB (all weights) | ~large (full font) | ~295KB (one style) | ~large (full font) | N/A |
| **Per-Weight Load** | Yes (individual CSS) | No (all or nothing for font) | Yes (per style family) | No (all or nothing) | N/A |
| **Active Maintenance** | Moderate (last release Mar 2025) | Very active (weekly releases) | Active (Google-backed) | Very active (weekly releases) | Low-moderate |
| **In Curated Set** | YES | YES | YES | YES | NO |

---

## Domain Affinity Matrix (Architect Selection Guide)

This is the key output for the system architect agent. Given a vertical and brand personality, which library should it select?

| Vertical | Primary Pick | Secondary Pick | Rationale |
|----------|-------------|----------------|-----------|
| **Fintech** | Phosphor Icons | Lucide | Fintech needs weight variation (thin for data-dense dashboards, bold for CTAs). Phosphor's 6 weights let the architect tune density. Duotone adds visual hierarchy. |
| **Health** | Material Symbols | Phosphor Icons | Health has specialized iconography (medical devices, vitals, medications). Material Symbols has the broadest medical icon coverage. Rounded style feels trustworthy/approachable for patient-facing UIs. |
| **SaaS** | Lucide | Phosphor Icons | SaaS products need clean, minimal, professional icons. Lucide's Feather-derived aesthetic is the industry standard for SaaS (used by Vercel, Linear, Notion-likes). Phosphor is backup when more weight control is needed. |
| **E-commerce** | Material Symbols | Tabler Icons | E-commerce needs action-oriented icons (add to cart, wishlist, shipping). Material Symbols Rounded with fill axis = warm, tappable feel. Tabler is backup for niche product category icons. |

### Brand Personality Overrides

The architect should also consider brand personality tokens when selecting:

| Brand Personality | Preferred Library | Why |
|-------------------|-------------------|-----|
| **Minimal / Clean** | Lucide | Thin consistent strokes, Feather heritage |
| **Bold / Energetic** | Phosphor (Bold weight) | Bold weight is heavier than other libraries' defaults |
| **Trustworthy / Institutional** | Material Symbols (Outlined) | Recognized, established, Google-backed |
| **Friendly / Approachable** | Material Symbols (Rounded) | Soft corners, warm feel |
| **Technical / Precise** | Phosphor (Light/Thin) | Thin weight feels engineered, data-oriented |
| **Comprehensive / Feature-rich** | Tabler Icons | When you need icons for every feature |

---

## CDN Reference (Copy-Paste Ready)

These are the exact CDN links the architect agent should embed in `token-showcase.html` and composed screens.

### Phosphor Icons
```html
<!-- Regular weight only (recommended starting point) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/regular/style.css" />

<!-- Individual weights (load only what you need) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/thin/style.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/light/style.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/bold/style.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/fill/style.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/duotone/style.css" />

<!-- All weights (convenience, ~3MB) -->
<script src="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2"></script>
```

### Lucide
```html
<!-- Option A: JS-based (renders inline SVGs, best quality) -->
<script src="https://unpkg.com/lucide@0.576.0"></script>
<!-- Then call lucide.createIcons() after DOM ready -->

<!-- Option B: Icon font (no JS, but loads all icons) -->
<link rel="stylesheet" href="https://unpkg.com/lucide-static@0.576.0/font/lucide.css" />

<!-- Option C: Individual SVG (for specific icons) -->
<!-- <img src="https://unpkg.com/lucide-static@0.576.0/icons/house.svg" /> -->
```

### Material Symbols
```html
<!-- Outlined (default) -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />

<!-- Rounded -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded" rel="stylesheet" />

<!-- Sharp -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp" rel="stylesheet" />
```

### Tabler Icons
```html
<!-- Webfont (outline icons only -- filled webfont has known issues) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.36.1/dist/tabler-icons.min.css" />
```

---

## Usage Syntax Reference (For Architect Agent)

The architect agent needs to emit concrete icon markup in composed screens. Here is the exact syntax for each library.

### Phosphor Icons
```html
<!-- Pattern: <i class="{weight-class} ph-{icon-name}"></i> -->
<i class="ph ph-house"></i>                    <!-- Regular -->
<i class="ph-bold ph-arrow-right"></i>         <!-- Bold -->
<i class="ph-fill ph-heart"></i>               <!-- Fill -->
<i class="ph-duotone ph-chart-line"></i>       <!-- Duotone -->

<!-- Sizing classes -->
<i class="ph ph-house ph-lg"></i>              <!-- 1.33x -->
<i class="ph ph-house ph-xl"></i>              <!-- 1.5x -->
<i class="ph ph-house ph-2x"></i>              <!-- 2x -->

<!-- CSS styling -->
<i class="ph ph-house" style="color: var(--color-primary); font-size: 24px;"></i>
```

### Lucide (JS mode)
```html
<!-- Pattern: <i data-lucide="{icon-name}"></i> + lucide.createIcons() -->
<i data-lucide="house"></i>
<i data-lucide="arrow-right"></i>
<i data-lucide="heart"></i>
<i data-lucide="bar-chart-2"></i>

<!-- With attributes -->
<i data-lucide="house" stroke-width="1.5" width="24" height="24"></i>

<!-- CSS styling (after createIcons renders SVGs) -->
<style>
  [data-lucide] svg {
    color: var(--color-primary);
    width: var(--icon-size-md);
    height: var(--icon-size-md);
  }
</style>
```

### Lucide (Icon Font mode)
```html
<!-- Pattern: <i class="icon-{icon-name}"></i> -->
<i class="icon-house"></i>
<i class="icon-arrow-right"></i>
<i class="icon-heart"></i>
```

### Material Symbols
```html
<!-- Pattern: <span class="material-symbols-{style}">{icon_name}</span> -->
<span class="material-symbols-outlined">home</span>
<span class="material-symbols-rounded">settings</span>
<span class="material-symbols-sharp">search</span>

<!-- CSS styling with variable font axes -->
<style>
  .material-symbols-outlined {
    color: var(--color-icon-primary);
    font-size: var(--icon-size-md);
    font-variation-settings:
      'FILL' 0,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
  }
  /* Filled variant */
  .material-symbols-outlined.filled {
    font-variation-settings:
      'FILL' 1,
      'wght' 400,
      'GRAD' 0,
      'opsz' 24;
  }
</style>
```

### Tabler Icons
```html
<!-- Pattern: <i class="ti ti-{icon-name}"></i> -->
<i class="ti ti-home"></i>
<i class="ti ti-arrow-right"></i>
<i class="ti ti-heart"></i>
<i class="ti ti-chart-line"></i>

<!-- CSS styling -->
<i class="ti ti-home" style="color: var(--color-primary); font-size: 24px;"></i>
```

---

## Icon Name Conventions (For Architect Agent Reference Data)

Each library uses different naming conventions. The architect must use the correct names.

| Concept | Phosphor | Lucide | Material Symbols | Tabler |
|---------|----------|--------|-----------------|--------|
| Home | `ph-house` | `house` | `home` | `ti-home` |
| Search | `ph-magnifying-glass` | `search` | `search` | `ti-search` |
| Settings | `ph-gear` | `settings` | `settings` | `ti-settings` |
| User | `ph-user` | `user` | `person` | `ti-user` |
| Cart | `ph-shopping-cart` | `shopping-cart` | `shopping_cart` | `ti-shopping-cart` |
| Heart | `ph-heart` | `heart` | `favorite` | `ti-heart` |
| Arrow Right | `ph-arrow-right` | `arrow-right` | `arrow_forward` | `ti-arrow-right` |
| Chart | `ph-chart-line` | `bar-chart-2` | `bar_chart` | `ti-chart-line` |
| Notification | `ph-bell` | `bell` | `notifications` | `ti-bell` |
| Menu | `ph-list` | `menu` | `menu` | `ti-menu-2` |
| Close | `ph-x` | `x` | `close` | `ti-x` |
| Check | `ph-check` | `check` | `check` | `ti-check` |
| Mail | `ph-envelope` | `mail` | `mail` | `ti-mail` |
| Calendar | `ph-calendar` | `calendar` | `calendar_month` | `ti-calendar` |
| Lock | `ph-lock` | `lock` | `lock` | `ti-lock` |

**Note:** Material Symbols uses underscores (`shopping_cart`), not hyphens. This is the most common source of errors.

---

## What NOT to Include

| Library | Why Not | Use Instead |
|---------|---------|-------------|
| **Font Awesome** | Freemium model -- free tier has limited icons, pro tier is paid. Motif is MIT-licensed and should only recommend fully free libraries. Also, Font Awesome's CSS is heavy and opinionated. | Tabler Icons (similar count, fully free, MIT) |
| **Heroicons** | Only 316 icons. No icon font. Tailwind-coupled. Lucide covers the same niche with 5x icons. | Lucide |
| **Feather Icons** | Unmaintained since 2020. Lucide is its official community fork with active development. | Lucide |
| **Bootstrap Icons** | Tightly coupled to Bootstrap design language. Would make Motif outputs look like Bootstrap templates. | Phosphor Icons or Tabler Icons |
| **Ionicons** | Ionic/mobile-first aesthetic. Doesn't pair well with web-focused design systems. | Material Symbols |
| **Material Icons (legacy)** | Superseded by Material Symbols. Legacy package is deprecated. | Material Symbols |
| **Iconify** | Meta-library (aggregates 200,000+ icons from 100+ sets). Too broad -- the architect needs a curated, consistent set, not access to everything. Iconify also requires JS runtime. | Pick a specific library |
| **Remix Icons** | Good library but overlaps significantly with Phosphor (similar weight system, similar count). Adding it creates choice paralysis without meaningful differentiation. | Phosphor Icons |

---

## Integration Architecture Notes

### How the Architect Agent Should Select

The architect agent receives vertical + brand personality tokens and selects an icon library. The selection logic should be:

```
1. Look up vertical in domain affinity matrix -> get primary + secondary
2. Check brand personality tokens -> check for overrides
3. Select primary unless personality override applies
4. Emit CDN link in <head> of token-showcase.html
5. Use icon names from the selected library in all composed screens
```

### Token Integration

The architect should add icon-related tokens to `tokens.css`:

```css
:root {
  /* Icon library selection (set by architect) */
  --icon-library: 'phosphor';  /* phosphor | lucide | material-symbols | tabler */

  /* Icon sizing tokens */
  --icon-size-xs: 14px;
  --icon-size-sm: 16px;
  --icon-size-md: 20px;
  --icon-size-lg: 24px;
  --icon-size-xl: 32px;

  /* Icon color tokens (reference existing color tokens) */
  --color-icon-primary: var(--color-text-primary);
  --color-icon-secondary: var(--color-text-secondary);
  --color-icon-accent: var(--color-primary);
  --color-icon-success: var(--color-success);
  --color-icon-warning: var(--color-warning);
  --color-icon-error: var(--color-error);
}
```

### Per-Weight CDN Loading Strategy

Loading all weights/icons is wasteful. The architect should load only what the design needs:

| Library | Recommended CDN Strategy |
|---------|-------------------------|
| Phosphor | Load 1-2 weights only (e.g., Regular + Fill, or Light + Bold) |
| Lucide | Use JS mode with `lucide.createIcons()` -- only renders icons present in DOM |
| Material Symbols | Use Google Fonts with `&text=` parameter to subset, or accept 295KB for full set |
| Tabler | Load webfont (includes all outline icons) -- no per-icon loading available |

---

## Version Pinning

All CDN references MUST pin to specific versions, never `@latest`. Reasons:
1. Breaking changes in icon names between versions
2. CDN cache behavior differs for `@latest` vs pinned versions
3. Reproducible builds -- the same HTML should render the same icons in 6 months

| Library | Pin To | Next Check |
|---------|--------|------------|
| Phosphor | @2.1.2 | Check quarterly (low release frequency) |
| Lucide | @0.576.0 | Check monthly (very high release frequency, still pre-1.0) |
| Material Symbols | Google Fonts auto-updates | Pin npm version if self-hosting |
| Tabler | @3.36.1 (webfont) | Check quarterly |

**Lucide version caveat:** Lucide is pre-1.0 (v0.576.0). Icon names may change between minor versions. The architect should document which version was used in each design system it generates.

---

## Sources

- [Phosphor Icons GitHub (web package)](https://github.com/phosphor-icons/web) -- version, weights, CDN usage, MIT license confirmed
- [Phosphor Icons homepage](https://phosphoricons.com/) -- icon count, weight descriptions
- [Lucide GitHub](https://github.com/lucide-icons/lucide) -- version, ISC license, icon count
- [Lucide documentation (vanilla JS)](https://lucide.dev/guide/packages/lucide) -- CDN usage, data-attribute API
- [Lucide Static documentation](https://lucide.dev/guide/packages/lucide-static) -- icon font, SVG sprite options
- [Heroicons homepage](https://heroicons.com/) -- icon count (316), styles, v2.1.5
- [Heroicons GitHub](https://github.com/tailwindlabs/heroicons) -- MIT license
- [Material Symbols guide (Google Developers)](https://developers.google.com/fonts/docs/material_symbols) -- variable font axes, CDN, Apache 2.0 license
- [Google Fonts - Material Symbols](https://fonts.google.com/icons) -- icon count (2,500+)
- [Tabler Icons GitHub](https://github.com/tabler/tabler-icons) -- icon count (6,038), MIT license
- [Tabler Icons webfont docs](https://docs.tabler.io/icons/libraries/webfont) -- CDN usage, CSS class syntax
- [Tabler Icons webfont filled bug (GitHub issue #1452)](https://github.com/tabler/tabler-icons/issues/1452) -- filled variant webfont issue
- [jsDelivr CDN](https://www.jsdelivr.com/) -- CDN availability for Phosphor, Lucide, Tabler
- [unpkg CDN](https://unpkg.com/) -- CDN availability for Lucide, Phosphor

---

*Stack research for: Motif icon library curated set*
*Researched: 2026-03-04*
