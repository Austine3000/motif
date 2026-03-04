# Feature Landscape: Icon Library Integration

**Domain:** Icon library integration for AI design engineering system (Motif v1.1)
**Researched:** 2026-03-04
**Overall confidence:** HIGH

## Context

Motif v1.0 generates design systems (tokens.css, COMPONENT-SPECS.md, DESIGN-SYSTEM.md, token-showcase.html) with placeholder icon references like `[MerchantIcon 40x40]`, `[Icon 20x20]`, `[CategoryIcon 36x36]`. The screen composer has an anti-slop check ("Am I using a generic icon set without checking the vertical?") but no mechanism to resolve icon names. This milestone replaces placeholder references with concrete, render-ready icon names from a real icon library, threaded through the entire pipeline: system architect picks a library, component specs name icons, composed screens render them.

---

## Table Stakes

Features the system MUST have for icon integration to work at all. Missing any of these means icons are still effectively placeholders.

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Icon library selection by system architect** | The architect already picks fonts, colors, spacing, radii, and shadows. Icons are the last unresolved visual primitive. Without library selection, composed screens cannot reference real icons. | LOW | Modifies: `generate-system.md` workflow, `motif-system-architect.md` agent | The architect must pick ONE library from a curated set, not invent icon names. Decision algorithm parallels the existing font/color algorithms: vertical + differentiation seed -> library choice. |
| **Icon size tokens in tokens.css** | Motif's design philosophy is "every visual value is a token." Icon sizes are visual values (16px, 20px, 24px, 32px, 40px). Without size tokens, icon dimensions get hardcoded -- violating the same principle that color/spacing tokens enforce. | LOW | Modifies: `generate-system.md` token file template | Token naming: `--icon-sm`, `--icon-md`, `--icon-lg`, `--icon-xl`. Based on 8px multiples like the Michelin Design System pattern. Values: 16px, 20px, 24px, 32px (map to existing component spec icon dimensions). |
| **CDN link in token showcase HTML** | The token-showcase.html is self-contained (imports only tokens.css + Google Fonts CDN). Icons must render in the showcase without a build step. This means a CDN `<script>` tag, not an npm import. | LOW | Modifies: `token-showcase-template.html` | Lucide: `<script src="https://unpkg.com/lucide@latest"></script>` + `lucide.createIcons()`. Phosphor: `<script src="https://unpkg.com/@phosphor-icons/web@2"></script>` + class-based. The showcase template needs a new Icons section displaying sample icons from the selected library at each size token. |
| **Concrete icon names in COMPONENT-SPECS.md** | `[MerchantIcon 40x40]` tells the composer nothing about which actual icon to render. Specs must use real icon names from the selected library so the composer can emit valid markup. Currently all 4 verticals use placeholder format. | MEDIUM | Modifies: all 4 vertical reference files (`fintech.md`, `health.md`, `saas.md`, `ecommerce.md`), `generate-system.md` component spec template | Each vertical needs a mapping from semantic role to concrete icon name. Example: fintech `[MerchantIcon]` -> `lucide:store` or `ph-storefront`. The vertical reference files define WHICH icons are appropriate per domain; the architect selects from this set. |
| **Composed screens use real icon markup** | The endpoint of the pipeline. If composed screens still emit placeholder text like `[Icon]`, the entire integration is invisible to end users. Screens must render actual SVG icons. | MEDIUM | Modifies: `motif-screen-composer.md` agent, `compose-screen.md` workflow | The composer needs: (1) knowledge of which library was selected (from tokens.css or DESIGN-SYSTEM.md), (2) correct markup pattern per library (e.g., `<i data-lucide="store"></i>` vs `<i class="ph ph-storefront"></i>`), (3) icon size token references. |
| **Icon library metadata in DESIGN-SYSTEM.md** | DESIGN-SYSTEM.md already documents color palette, typography scale, spacing, and motion. Icon library choice, CDN URL, and usage pattern must be documented here so downstream agents and human readers know which library is in use. | LOW | Modifies: `generate-system.md` Output 3 section | One new section: "Iconography" with library name, CDN URL, usage syntax, and vertical-specific icon mapping table. |

---

## Differentiators

Features that make Motif's icon integration notably better than "just pick an icon library." These leverage Motif's existing domain intelligence.

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Vertical-aware icon vocabulary** | Motif's core differentiator is domain intelligence. A fintech vertical's component specs should reference `credit-card`, `banknote`, `trending-up`, `shield-check` -- not generic `star`, `settings`, `home`. A health vertical should reference `heart-pulse`, `pill`, `activity`, `thermometer`. No other tool maps icons to domain semantics. This is the icon equivalent of "fintech knows monetary values need tabular-nums." | MEDIUM | Requires: curated icon vocabulary per vertical in each vertical reference file | Each of the 4 verticals needs a curated list of 15-25 domain-specific icon names mapped to their semantic roles. The system architect references this vocabulary when writing COMPONENT-SPECS.md. The composer then uses these exact names. This is NOT a full icon search -- it is a pre-researched dictionary. |
| **Icon style matching to differentiation seed** | Lucide has one style (outline). Phosphor has 6 weights (thin, light, regular, bold, fill, duotone). The differentiation seed's "personality" and "formality" dimensions should influence icon weight selection: formal/institutional products get regular weight; bold/rebellious products get bold or fill weight. This creates visual consistency between icon weight and typography weight choices. | LOW | Requires: icon weight decision algorithm in `generate-system.md` | Only applies when the selected library supports multiple weights (currently only Phosphor). Can be captured as a single token: `--icon-weight: regular` or a DESIGN-SYSTEM.md directive. |
| **Icon showcase section in token-showcase.html** | The token showcase is the "wow moment" after system generation. Adding an icon section with a grid of the vertical's key icons at each size, rendered from CDN, makes the showcase substantially more complete. Users see their icon vocabulary visually alongside colors and typography. | LOW | Requires: icon section in `token-showcase-template.html`, CDN script tag | Template adds a new section after Components: "Iconography" with icon grid showing each vertical icon at --icon-sm, --icon-md, --icon-lg sizes. The architect fills in the actual icon names from the vertical vocabulary. |
| **Anti-slop icon check (enforce real names)** | The existing anti-slop checklist item ("Am I using a generic icon set without checking the vertical?") is a mental prompt with no enforcement. A concrete check -- either in the composer agent's instructions or as a hook -- could verify that icon names in composed HTML actually exist in the selected library's vocabulary. | MEDIUM | Requires: knowledge of valid icon names per library, modification to composer anti-slop checklist or a new hook | The simplest version is an explicit instruction in the composer agent: "Icon names MUST come from the icon vocabulary in COMPONENT-SPECS.md or DESIGN-SYSTEM.md. Do NOT invent icon names." A hook-based version would grep composed HTML for icon markup and validate names against a known list. Start with the instruction-based version; hooks are v1.2. |
| **Icon color token integration** | Icons should use the same color tokens as text: `--text-primary`, `--text-secondary`, `--text-link`, semantic colors. This is already how most icon libraries work (they inherit `currentColor`), but explicitly documenting it in COMPONENT-SPECS.md prevents the composer from hardcoding icon colors. | LOW | Modifies: component spec template to include icon color directives | Both Lucide and Phosphor inherit `currentColor` by default, so setting `color: var(--text-secondary)` on the parent element colors the icon. Document this pattern; do not create separate `--icon-color-*` tokens. |

---

## Anti-Features

Features that seem like they belong in an icon integration but create problems for Motif specifically. Deliberately NOT building these.

| Anti-Feature | Why It Seems Useful | Why It Is Problematic for Motif | What to Do Instead |
|--------------|---------------------|--------------------------------|-------------------|
| **Full icon search/discovery engine** | "The agent should be able to search 1700+ icons to find the right one" | AI agents do not reliably search 1700 icons. They hallucinate icon names, pick visually wrong icons, and waste context tokens processing large icon catalogs. The strength of Motif is pre-researched domain knowledge, not runtime search. A curated vocabulary of 15-25 icons per vertical is far more reliable than an open-ended search across the full library. | Pre-curate a vertical-specific icon vocabulary (15-25 icons per vertical with semantic role mappings). The architect picks from this curated set; the composer uses exactly what the architect specified. No search needed. |
| **Multiple icon libraries simultaneously** | "Support Lucide AND Phosphor AND Heroicons in the same project" | Multiple libraries mean multiple CDN scripts, inconsistent visual styles, larger page weight, and confused agents. Design systems use ONE icon set for visual consistency. Fonts are not mixed arbitrarily and neither should icons. | Pick ONE library per project. The system architect selects it. The vertical reference files provide icon name mappings for each supported library so switching libraries is a vocabulary swap, not a system redesign. |
| **Custom icon upload/generation** | "Let users add their own SVG icons to the system" | Custom icons require validation (grid alignment, stroke width, visual consistency), hosting, and CDN management. This is a full icon design pipeline -- far beyond Motif's scope. Products that need custom icons (with logos, brand-specific glyphs) handle this outside the design system tool. | Document how to add custom icons alongside the selected library (e.g., "place SVGs in /public/icons/ and reference with `<img>`"). Do not build infrastructure for this. |
| **Animated icon support** | "Support animated/interactive icons for micro-interactions" | Animated icons require JavaScript controllers, interaction state management, and significantly increase showcase and composition complexity. The motion tokens (`--duration-fast`, `--ease-default`) handle transitions; animated icons are a separate concern. | Use CSS transitions on icon containers (opacity, transform) referenced via motion tokens. Animated SVG icons are a v2+ feature if ever. |
| **Icon font approach** | "Use icon fonts instead of inline SVG for simpler markup" | Icon fonts have well-documented accessibility problems (screen readers announce Unicode characters, no semantic meaning), cannot be styled per-path (no duotone), break when fonts fail to load, and are considered legacy practice in 2026. Both Lucide and Phosphor have moved to SVG-based approaches. | SVG-based approach only. Lucide uses `data-lucide` attributes resolved to inline SVGs. Phosphor uses web components or class-based SVGs. Both are accessible and stylable. |
| **Runtime icon switching** | "Let the user change icon library after system generation without regenerating" | Icon names are library-specific (`lucide:store` vs `ph-storefront` vs `heroicon:building-storefront`). Changing libraries means rewriting every component spec and every composed screen. This is a system-level decision, not a runtime toggle. | The library is selected during system generation. Changing it means re-running `/motif:system`. The vertical reference files already provide name mappings per library, so the system architect just generates with the new library's vocabulary. |

---

## Feature Dependencies

```
Vertical icon vocabularies (in vertical reference files)
    |
    v
Icon library selection algorithm (in generate-system.md)
    |
    +---> Icon size tokens in tokens.css
    |
    +---> CDN link in token-showcase-template.html
    |
    +---> Icon names in COMPONENT-SPECS.md
    |         |
    |         v
    |     Composer uses real icon markup (in compose-screen.md)
    |
    +---> Iconography section in DESIGN-SYSTEM.md
    |
    +---> Icon showcase section in token-showcase.html
```

The critical dependency chain is: **vertical vocabularies MUST exist before** the system architect can select icons, and **COMPONENT-SPECS.md MUST contain real icon names before** the composer can emit valid markup. This means vertical reference files are modified first, then the system generation pipeline, then the composition pipeline.

---

## Library Selection Criteria

The system architect needs a decision algorithm for icon library selection. Based on ecosystem research, the curated set should be:

### Recommended: Lucide (default)

- **Why:** 1700+ icons, clean consistent stroke style, kebab-case naming, excellent CDN support via unpkg, MIT-equivalent license (ISC), strong community (fork of Feather Icons with active maintenance), used as default by shadcn/ui. Categories include Finance (56 icons), Medical (42), Shopping (27), Charts (31) -- covering all 4 Motif verticals.
- **CDN pattern:** `<script src="https://unpkg.com/lucide@0.460.0"></script>` + `<i data-lucide="icon-name"></i>` + `lucide.createIcons()`
- **Icon naming:** kebab-case, descriptive. Examples: `credit-card`, `trending-up`, `heart-pulse`, `shopping-cart`, `layout-dashboard`.
- **Sizing:** Inherits from CSS `width`/`height`. Default 24x24.
- **Coloring:** Inherits `currentColor` from parent CSS `color` property.
- **Limitation:** Single style only (outline/stroke). No fill, bold, or duotone variants.

### Alternative: Phosphor Icons

- **Why:** 6000+ icons, 6 weight variants (thin/light/regular/bold/fill/duotone), excellent for projects where the differentiation seed calls for varied icon weight. Web components approach via CDN.
- **CDN pattern:** `<script src="https://unpkg.com/@phosphor-icons/web@2.1.1"></script>` + `<i class="ph ph-icon-name"></i>`
- **Icon naming:** kebab-case with `ph-` prefix. Examples: `ph-credit-card`, `ph-trend-up`, `ph-heartbeat`, `ph-shopping-cart`, `ph-squares-four`.
- **Sizing:** Via `font-size` CSS property (font-based) or `size` attribute (web components).
- **Coloring:** Inherits `color` CSS property.
- **Advantage:** Weight variants map cleanly to differentiation seed personality axis.

### Selection Algorithm

```
DEFAULT: Lucide (widest adoption, shadcn ecosystem, single style = visual consistency)

IF differentiation seed personality >= 7 (rebellious) AND seed formality <= 4 (casual):
  CONSIDER: Phosphor with bold or duotone weight
  RATIONALE: Visual personality through icon weight variation

IF vertical is health AND seed temperature >= 6 (warm):
  CONSIDER: Phosphor with light weight
  RATIONALE: Thinner strokes feel gentler, more caring

OTHERWISE: Lucide
  RATIONALE: Consistency, ecosystem alignment, simplest integration
```

---

## Icon Size Token Specification

Based on the Michelin Design System pattern (8px multiples) and existing Motif component spec dimensions:

| Token | Value | Pixel | Usage in Existing Component Specs |
|-------|-------|-------|-----------------------------------|
| `--icon-sm` | `1rem` | 16px | Inline text icons, badges, breadcrumb separators, shortcut hints |
| `--icon-md` | `1.25rem` | 20px | Navigation items, filter chips, button icons, command palette results (`[Icon 20x20]` in SaaS CommandPalette) |
| `--icon-lg` | `1.5rem` | 24px | Default standalone icons, card header icons, action buttons |
| `--icon-xl` | `2rem` | 32px | Health MetricCard icons (`[MetricIcon 32x32]`), feature highlights |
| `--icon-2xl` | `2.5rem` | 40px | Fintech TransactionRow merchant icons (`[MerchantIcon 40x40]`), profile avatars with icon fallback |

These map directly to the placeholder dimensions already in the vertical reference files:
- `[Icon 20x20]` in SaaS CommandPalette -> `--icon-md`
- `[MetricIcon 32x32]` in Health MetricCard -> `--icon-xl`
- `[CategoryIcon 36x36]` in Health LogEntry -> between `--icon-xl` and `--icon-2xl` (use `--icon-xl` with padding or add `--icon-xxl: 2.25rem` for 36px)
- `[MerchantIcon 40x40]` in Fintech TransactionRow -> `--icon-2xl`

---

## Vertical Icon Vocabulary (Preliminary)

Each vertical needs a curated vocabulary. These are initial mappings using Lucide icon names (Phosphor alternatives in parentheses):

### Fintech (15-20 icons)
| Semantic Role | Lucide Name | Phosphor Name | Used In |
|---------------|-------------|---------------|---------|
| Merchant/store | `store` | `ph-storefront` | TransactionRow |
| Credit card | `credit-card` | `ph-credit-card` | Cards, payment |
| Send money | `send` | `ph-paper-plane-tilt` | Primary CTA |
| Receive money | `download` | `ph-arrow-down` | Receive flow |
| Trending up | `trending-up` | `ph-trend-up` | Positive change |
| Trending down | `trending-down` | `ph-trend-down` | Negative change |
| Shield/security | `shield-check` | `ph-shield-check` | Security settings |
| Bank | `landmark` | `ph-bank` | Bank accounts |
| Wallet | `wallet` | `ph-wallet` | Wallet/balance |
| QR code | `qr-code` | `ph-qr-code` | Scan/receive |
| Receipt | `receipt` | `ph-receipt` | Transaction detail |
| Bell/notification | `bell` | `ph-bell` | Notifications |
| Settings | `settings` | `ph-gear` | Settings |
| User profile | `user` | `ph-user` | Profile |
| Search | `search` | `ph-magnifying-glass` | Search |
| Eye (show/hide) | `eye` / `eye-off` | `ph-eye` / `ph-eye-slash` | Balance visibility |

### Health (15-20 icons)
| Semantic Role | Lucide Name | Phosphor Name | Used In |
|---------------|-------------|---------------|---------|
| Heart/vitals | `heart-pulse` | `ph-heartbeat` | MetricCard (heart rate) |
| Activity | `activity` | `ph-activity` | MetricCard (activity) |
| Pill/medication | `pill` | `ph-pill` | Medication tracking |
| Thermometer | `thermometer` | `ph-thermometer` | Temperature |
| Droplet/water | `droplets` | `ph-drop` | Hydration |
| Weight/scale | `scale` | `ph-scales` | Weight tracking |
| Moon/sleep | `moon` | `ph-moon` | Sleep tracking |
| Footprints/steps | `footprints` | `ph-footprints` | Step counter |
| Apple/nutrition | `apple` | `ph-apple` | Nutrition |
| Calendar | `calendar` | `ph-calendar` | Scheduling |
| Plus/log entry | `plus` | `ph-plus` | Add log entry |
| Chart/insights | `bar-chart-3` | `ph-chart-bar` | Insights |
| Clock | `clock` | `ph-clock` | Timestamps |
| User profile | `user` | `ph-user` | Profile |
| Bell | `bell` | `ph-bell` | Reminders |

### SaaS (15-20 icons)
| Semantic Role | Lucide Name | Phosphor Name | Used In |
|---------------|-------------|---------------|---------|
| Dashboard | `layout-dashboard` | `ph-squares-four` | Dashboard nav |
| Search | `search` | `ph-magnifying-glass` | CommandPalette, FilterBar |
| Filter | `filter` | `ph-funnel` | FilterBar |
| Sort ascending | `arrow-up-narrow-wide` | `ph-sort-ascending` | DataTable |
| Sort descending | `arrow-down-wide-narrow` | `ph-sort-descending` | DataTable |
| Checkbox | `check-square` | `ph-check-square` | DataTable selection |
| More/actions | `more-horizontal` | `ph-dots-three` | Row actions |
| Settings/gear | `settings` | `ph-gear` | Settings |
| Users/team | `users` | `ph-users` | Team management |
| Key/API | `key` | `ph-key` | API keys |
| Bell | `bell` | `ph-bell` | Notifications |
| Sidebar | `panel-left` | `ph-sidebar` | Sidebar toggle |
| Command | `terminal` | `ph-terminal` | Command palette trigger |
| Plus/create | `plus` | `ph-plus` | Create new |
| Trash/delete | `trash-2` | `ph-trash` | Delete action |
| External link | `external-link` | `ph-arrow-square-out` | External navigation |

### E-commerce (15-20 icons)
| Semantic Role | Lucide Name | Phosphor Name | Used In |
|---------------|-------------|---------------|---------|
| Shopping cart | `shopping-cart` | `ph-shopping-cart` | Cart, nav |
| Heart/wishlist | `heart` | `ph-heart` | Wishlist toggle |
| Search | `search` | `ph-magnifying-glass` | Product search |
| Star/rating | `star` | `ph-star` | Product ratings |
| Package/order | `package` | `ph-package` | Order tracking |
| Truck/shipping | `truck` | `ph-truck` | Shipping status |
| Tag/sale | `tag` | `ph-tag` | Sale badges |
| Filter | `sliders-horizontal` | `ph-sliders-horizontal` | Product filters |
| Grid/list view | `grid-3x3` / `list` | `ph-grid-four` / `ph-list` | View toggle |
| Minus/plus | `minus` / `plus` | `ph-minus` / `ph-plus` | Quantity selector |
| X/remove | `x` | `ph-x` | Remove from cart |
| Chevron | `chevron-right` | `ph-caret-right` | Breadcrumbs, navigation |
| Credit card | `credit-card` | `ph-credit-card` | Payment |
| Check/success | `check-circle` | `ph-check-circle` | Order confirmed |
| User | `user` | `ph-user` | Account |
| Image | `image` | `ph-image` | Product image placeholder |

---

## MVP Recommendation

### Must Ship (Table Stakes)

1. **Vertical icon vocabularies** in all 4 vertical reference files -- the foundation everything else depends on
2. **Icon library selection algorithm** in `generate-system.md` -- Lucide as default, Phosphor as alternative
3. **Icon size tokens** in the token file template (`--icon-sm` through `--icon-2xl`)
4. **CDN link** in `token-showcase-template.html`
5. **Concrete icon names** in COMPONENT-SPECS.md component spec template
6. **Composer icon markup** instructions in `motif-screen-composer.md`

### Should Ship (Differentiators)

7. **Icon showcase section** in token-showcase.html
8. **Iconography section** in DESIGN-SYSTEM.md
9. **Anti-slop icon instruction** in composer agent (instruction-based, not hook-based)

### Defer

- Icon weight matching to differentiation seed (Phosphor-only, low priority)
- Hook-based icon name validation (v1.2)
- Lucide MCP server integration for icon discovery (v2.0 -- interesting but premature)

---

## Pipeline Integration Map

This shows exactly where each feature modifies the existing Motif pipeline, in execution order:

```
STEP 1: /motif:research
  No changes. Research does not involve icons.

STEP 2: /motif:system (system architect generates design system)
  MODIFIED FILES:
    generate-system.md          -- Add icon library decision algorithm
                                -- Add icon size tokens to token file template
                                -- Add iconography section to DESIGN-SYSTEM.md template
                                -- Add icon vocabulary reference to COMPONENT-SPECS.md template
    motif-system-architect.md   -- Add icon awareness to domain expertise section
    token-showcase-template.html -- Add CDN script tag + icon showcase section
    verticals/fintech.md        -- Replace [MerchantIcon] placeholders with Lucide/Phosphor names
    verticals/health.md         -- Replace [MetricIcon], [CategoryIcon] placeholders
    verticals/saas.md           -- Replace [Icon 20x20] placeholders
    verticals/ecommerce.md      -- Add icon names to ProductCard, CartItem specs

STEP 3: /motif:compose (screen composer builds screens)
  MODIFIED FILES:
    compose-screen.md           -- Add icon markup instructions to agent spawn prompt
    motif-screen-composer.md    -- Add icon section to domain expertise
                                -- Update anti-slop checklist item 8 with enforcement
                                -- Add icon self-review checklist item
```

---

## Confidence Assessment

| Area | Confidence | Reason |
|------|------------|--------|
| Library selection (Lucide vs Phosphor) | HIGH | Verified via official docs, CDN availability confirmed, shadcn/ui ecosystem alignment confirmed, Chakra UI v3 dropped internal icons in favor of lucide-react |
| CDN integration pattern | HIGH | Lucide unpkg CDN usage verified via official docs and multiple sources. `data-lucide` attribute pattern confirmed. Phosphor web components CDN also confirmed. |
| Icon size token naming | MEDIUM | Modeled on Michelin Design System (8px multiples) pattern verified via official docs. Token names (`--icon-sm` etc.) follow Motif's existing naming conventions (`--text-sm`, `--radius-sm`). No precedent within Motif specifically for icon tokens. |
| Vertical icon vocabularies | MEDIUM | Icon names verified against Lucide categories page (Finance: 56, Medical: 42, Shopping: 27). Specific names like `credit-card`, `heart-pulse`, `shopping-cart` confirmed to exist. Full vocabulary coverage per vertical needs validation against the live Lucide search. |
| Composer markup integration | HIGH | The composer already handles fonts (CDN link in head) and tokens (CSS custom properties). Icons follow the same pattern: CDN in head, markup in body, styling via tokens. |

---

## Sources

- [Lucide Icons Official Docs](https://lucide.dev/guide/packages/lucide) -- CDN usage, data-lucide attribute pattern
- [Lucide Categories](https://lucide.dev/icons/categories) -- 45 categories, icon counts per category
- [Phosphor Icons GitHub](https://github.com/phosphor-icons/web) -- Web components CDN, weight variants
- [Phosphor Icons Web Components](https://github.com/phosphor-icons/webcomponents) -- Web component approach
- [shadcn/ui Icon Library Comparison](https://www.shadcndesign.com/blog/comparing-icon-libraries-shadcn-ui) -- Lucide as default, comparison with Heroicons/Material/Radix
- [Michelin Design System Icon Size Tokens](https://designsystem.michelin.com/tokens/icon-size) -- 8px multiple sizing pattern
- [Duet Design System Icon Component](https://www.duetds.com/components/icon/) -- Size variants, semantic naming, framework-agnostic approach
- [Chakra UI v3 Announcement](https://www.chakra-ui.com/blog/00-announcing-v3) -- Dropped internal icons, recommends lucide-react
- [Lucide MCP Server](https://deepwiki.com/SeeYangZhi/lucide-icons-mcp) -- MCP-based icon discovery (future reference)
