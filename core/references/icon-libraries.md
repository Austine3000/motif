# Icon Library Reference

Single source of truth for icon library metadata, domain affinity, and the selection algorithm. All downstream phases (vertical vocabularies, pipeline integration, enforcement) read from this file.

---

## Curated Libraries

### Phosphor Icons

| Property | Value |
|----------|-------|
| Version | @phosphor-icons/web@2.1.2 |
| CDN (per-weight) | `https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/{weight}/style.css` |
| Usage Syntax | `<i class="ph ph-{name}"></i>` (regular) / `<i class="ph-{weight} ph-{name}"></i>` (other weights) |
| Icon Count | ~1,248 base icons (x6 weights = ~7,488 variants) |
| Weights/Variants | thin, light, regular, bold, fill, duotone (6 weights) |
| License | MIT |
| Requires JS | No |
| Last Verified | 2026-03-04 |

**Weight class mapping:** `ph` (regular), `ph-thin`, `ph-light`, `ph-bold`, `ph-fill`, `ph-duotone`

**Duotone note:** Secondary layer renders at 20% opacity by default. Detailed duotone styling is deferred to v1.2+ (REQUIREMENTS.md ICON-02). This phase documents duotone as a weight option only.

---

### Lucide

| Property | Value |
|----------|-------|
| Version | lucide@0.576.0 |
| CDN | `https://unpkg.com/lucide@0.576.0` |
| Usage Syntax | `<i data-lucide="{name}"></i>` + `lucide.createIcons()` |
| Icon Count | ~1,702 icons |
| Weights/Variants | Single outline style only (stroke width adjustable via attribute) |
| License | ISC |
| Requires JS | **Yes** -- must call `lucide.createIcons()` after DOM load |
| Last Verified | 2026-03-04 |

**IMPORTANT:** Lucide is the only library in the curated set that requires JavaScript initialization. The CDN script exposes a global `lucide` object; call `lucide.createIcons()` after the DOM is ready to render all `[data-lucide]` elements as inline SVGs.

**Version caveat:** Lucide is pre-1.0 (v0.576.0). Icon names may change between minor versions. Pin to this version and review quarterly. When Lucide reaches 1.0, update the pin and document the migration.

---

### Material Symbols

| Property | Value |
|----------|-------|
| Version | Google Fonts CDN (evergreen -- no version pin) |
| npm Version (self-hosting) | material-symbols@0.40.2 |
| CDN (Outlined) | `https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined` |
| CDN (Rounded) | `https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded` |
| CDN (Sharp) | `https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp` |
| Usage Syntax | `<span class="material-symbols-{style}">{icon_name}</span>` |
| Icon Count | ~2,500+ icons |
| Weights/Variants | 3 style families (Outlined, Rounded, Sharp) x variable font axes (FILL 0-1, wght 100-700, GRAD -50 to 200, opsz 20-48) |
| License | Apache 2.0 |
| Requires JS | No |
| Last Verified | 2026-03-04 |

**Version-pinning exception:** Material Symbols via Google Fonts is evergreen -- there is no `@0.40.2` in the Google Fonts URL. The font family name ("Material+Symbols+Outlined") is the stable identifier. For self-hosting with a pinned version, use the npm package `material-symbols@0.40.2`. This is the ONE exception to the CDN version-pinning rule.

**Naming convention:** Material Symbols uses underscores (`shopping_cart`), not hyphens. This is the most common source of icon name errors.

**Critical CSS requirement:** Always set explicit `font-size` AND matching `opsz` value. Default optical size is 48px, which renders icons oversized if not overridden.

---

### Tabler Icons

| Property | Value |
|----------|-------|
| Version | @tabler/icons-webfont@3.36.1 |
| CDN | `https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.36.1/dist/tabler-icons.min.css` |
| Usage Syntax | `<i class="ti ti-{name}"></i>` |
| Icon Count | ~6,038 total (4,985 outline + 1,053 filled) |
| Weights/Variants | Outline only via webfont (filled webfont has known bug -- see below) |
| License | MIT |
| Requires JS | No |
| Last Verified | 2026-03-04 |

**Known bug:** The filled variant webfont has a conflict where outline and filled icons cannot be used simultaneously via CDN. The filled webfont replaces outline classes rather than adding new ones (GitHub issue #1452, verified January 2026). **Use outline only for webfont/CDN usage.** The SVG package works fine for filled icons.

---

## Domain Affinity Matrix

| Vertical | Primary Library | Secondary Library | Default Weight | Emphasis Weight | Rationale |
|----------|----------------|-------------------|----------------|-----------------|-----------|
| Fintech | Phosphor Icons | Lucide | regular | bold | Weight variation for data-dense dashboards; duotone for hierarchy |
| Health | Material Symbols (Rounded) | Phosphor Icons | regular (wght:400) | filled (FILL:1) | Broadest medical icon coverage; Rounded style is warm, not clinical |
| SaaS | Lucide | Phosphor Icons | default (2px stroke) | default (2px stroke) | Feather-derived SaaS standard; single style means no weight variation |
| E-commerce | Material Symbols (Rounded) | Tabler Icons | regular (wght:400) | filled (FILL:1) | Action-oriented icons with fill for CTAs; Tabler for niche categories |

**Key rules:**
- One library per project -- no mixing libraries in the same output
- Secondary library = personality override pool, NOT a gap fallback
- Weight is a system-level decision applied consistently across all composed screens

---

## Selection Algorithm

Deterministic lookup: vertical + brand personality seed produces library + weight with zero ambiguity. Mirrors how Color and Typography Decision Algorithms work in `generate-system.md`.

**Inputs:**
- `vertical` (string): fintech | health | saas | ecommerce
- `personality` (integer, 1-10): from Differentiation Seed in DESIGN-BRIEF.md (see `core/references/design-inputs.md`)
- `formality` (integer, 1-10): from Differentiation Seed in DESIGN-BRIEF.md
- `user_library_override` (string, optional): explicit library choice from DESIGN-BRIEF.md

**Algorithm:**

```
STEP 1 -- User override check
  IF user_library_override IS SET in DESIGN-BRIEF.md:
    selected_library = user_library_override
    GOTO STEP 2 (still apply weight rules)
  ELSE:
    selected_library = AFFINITY_MATRIX[vertical].primary

STEP 2 -- Base weight assignment
  default_weight = AFFINITY_MATRIX[vertical].default_weight
  emphasis_weight = AFFINITY_MATRIX[vertical].emphasis_weight

STEP 3 -- Personality-based weight selection
  IF selected_library supports weights (Phosphor Icons OR Material Symbols):
    IF personality >= 7 (bold/rebellious):
      Phosphor:          default_weight = bold,     emphasis_weight = fill
      Material Symbols:  default_weight = wght:600, emphasis_weight = FILL:1,wght:700
    ELIF personality <= 3 (corporate/conservative):
      Phosphor:          default_weight = light,    emphasis_weight = regular
      Material Symbols:  default_weight = wght:300, emphasis_weight = wght:400
    ELSE (personality 4-6, balanced):
      Phosphor:          default_weight = regular,  emphasis_weight = bold
      Material Symbols:  default_weight = wght:400, emphasis_weight = FILL:1
  ELSE (Lucide OR Tabler -- no weight variants):
    default_weight = default
    emphasis_weight = default

STEP 4 -- Extreme personality library switch
  IF personality >= 8 AND NOT user_library_override:
    selected_library = AFFINITY_MATRIX[vertical].secondary
    Recalculate weights for new library (repeat STEP 3 logic)
  IF personality <= 2 AND NOT user_library_override:
    selected_library = AFFINITY_MATRIX[vertical].secondary
    Recalculate weights for new library (repeat STEP 3 logic)

STEP 5 -- Material Symbols style family selection
  IF selected_library = Material Symbols:
    IF formality <= 4 (casual/approachable):
      style_family = Rounded
    ELIF formality >= 7 (formal/institutional):
      style_family = Sharp
    ELSE (formality 5-6):
      style_family = Outlined

STEP 6 -- Emit output
  OUTPUT: {
    library: selected_library,
    default_weight: default_weight,
    emphasis_weight: emphasis_weight,
    style_family: style_family (Material Symbols only, omit otherwise),
    cdn_url: look up in Curated Libraries section above,
    usage_syntax: look up in Curated Libraries section above
  }
```

**Boundary values (inclusive):**
- `personality >= 7` triggers bold weights (7, 8, 9, 10 are all bold)
- `personality <= 3` triggers light weights (1, 2, 3 are all light)
- `personality >= 8` triggers library switch (8, 9, 10 switch to secondary)
- `personality <= 2` triggers library switch (1, 2 switch to secondary)
- `formality <= 4` selects Rounded (1, 2, 3, 4)
- `formality >= 7` selects Sharp (7, 8, 9, 10)
- Personality 4-6 are balanced (default weights, primary library)
- Formality 5-6 selects Outlined

---

## Icon Color

Icons use `currentColor` inheritance. No `--icon-color-*` tokens are needed.

Apply color via `color: var(--text-secondary)` on the parent or icon element. Icons inherit via CSS `currentColor`. For semantic colors, use existing tokens: `var(--color-success)`, `var(--color-error)`, `var(--color-warning)`.

```css
/* Example: icon inherits color from parent */
.nav-item {
  color: var(--text-secondary);
}
.nav-item.active {
  color: var(--color-primary-500);
}
/* The icon inside inherits automatically via currentColor */
```

---

## Icon Name Conventions

Common UI concepts mapped across all four libraries. Use these verified names to prevent hallucination.

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

**Note:** Material Symbols uses underscores (`shopping_cart`, `arrow_forward`, `calendar_month`), not hyphens. Phosphor prefixes with `ph-`. Tabler prefixes with `ti-`. Lucide uses bare kebab-case names.

**This table covers common UI concepts only.** Curated per-vertical icon name vocabularies (e.g., fintech-specific icons like "bank", "transfer", "wallet") are defined in Phase 10.

---

## CDN Reference

Copy-paste-ready HTML snippets for each library.

### Phosphor Icons

```html
<!-- Regular weight (recommended starting point) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/regular/style.css" />

<!-- Additional weights (load only what the design needs) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/thin/style.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/light/style.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/bold/style.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/fill/style.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.2/src/duotone/style.css" />

<!-- Usage -->
<i class="ph ph-house"></i>           <!-- Regular -->
<i class="ph-bold ph-house"></i>      <!-- Bold -->
<i class="ph-light ph-house"></i>     <!-- Light -->
<i class="ph-thin ph-house"></i>      <!-- Thin -->
<i class="ph-fill ph-house"></i>      <!-- Fill -->
<i class="ph-duotone ph-house"></i>   <!-- Duotone -->
```

### Lucide

```html
<!-- JS mode (recommended -- renders only icons present in DOM) -->
<script src="https://unpkg.com/lucide@0.576.0"></script>
<script>
  document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
  });
</script>

<!-- Usage -->
<i data-lucide="house"></i>
<i data-lucide="settings"></i>
<i data-lucide="search"></i>
```

**Lucide requires JS initialization.** Unlike Phosphor, Material Symbols, and Tabler, the icons will not render without calling `lucide.createIcons()`. This is the only library in the curated set with this requirement.

### Material Symbols

```html
<!-- Load one style family -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined" rel="stylesheet" />
<!-- OR Rounded -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded" rel="stylesheet" />
<!-- OR Sharp -->
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Sharp" rel="stylesheet" />

<!-- Usage -->
<span class="material-symbols-outlined">home</span>
<span class="material-symbols-rounded">settings</span>
<span class="material-symbols-sharp">search</span>
```

**Required CSS setup for Material Symbols:**

```css
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

### Tabler Icons

```html
<!-- Outline only -- filled webfont has known bug (GitHub #1452) -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@3.36.1/dist/tabler-icons.min.css" />

<!-- Usage -->
<i class="ti ti-home"></i>
<i class="ti ti-settings"></i>
<i class="ti ti-search"></i>
```

---

*Icon Library Reference for Motif Design System Pipeline*
*Created: 2026-03-04*
