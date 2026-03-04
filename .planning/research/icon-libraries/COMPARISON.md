# Comparison: Phosphor vs Lucide vs Material Symbols vs Tabler vs Heroicons

**Context:** Selecting 3-5 icon libraries for Motif's curated set. Libraries must work via CDN, use CSS classes, and pair with CSS custom properties.
**Recommendation:** Include Phosphor, Lucide, Material Symbols, and Tabler. Exclude Heroicons.

## Quick Comparison

| Criterion | Phosphor | Lucide | Material Symbols | Tabler | Heroicons |
|-----------|----------|--------|-----------------|--------|-----------|
| Icon Count | ~1,248 | ~1,702 | ~2,500+ | ~6,038 | ~316 |
| Weight Variants | 6 | 1 (adjustable stroke) | 3 styles + variable axes | 2 (outline bug for filled) | 4 styles |
| License | MIT | ISC | Apache 2.0 | MIT | MIT |
| Icon Font CDN | Yes | Yes (all icons) | Yes (Google Fonts) | Yes | No |
| JS Required | No | Optional | No | No | No (manual SVG) |
| CSS Custom Props | Good | Good | Excellent | Good | Good |
| Naming Convention | ph-kebab-case | kebab-case | underscore_case | ti-kebab-case | N/A |
| Release Frequency | Quarterly | Weekly | Ongoing | Weekly | Infrequent |
| Bundle (full load) | ~3MB all weights | ~large (full font) | ~295KB one style | ~large | N/A |
| Selective Loading | Per-weight CSS | No (font) / Yes (JS) | Per-style family | No | Individual SVGs |
| Best For | Fintech, data UIs | SaaS, minimal UIs | Health, e-commerce | Comprehensive needs | Tailwind projects |
| **IN CURATED SET** | **YES** | **YES** | **YES** | **YES** | **NO** |

## Detailed Analysis

### Phosphor Icons

**Strengths:**
- 6 weight variants (thin/light/regular/bold/fill/duotone) -- most of any library
- Duotone is unique -- no other library offers two-tone icons
- Per-weight CDN loading reduces bundle size
- Clean, geometric design language suits professional/fintech UIs
- True icon font -- zero JavaScript required
- CSS class syntax is intuitive: `<i class="ph-bold ph-chart-line"></i>`

**Weaknesses:**
- Moderate icon count (1,248) -- less than Lucide, Material Symbols, or Tabler
- Release frequency is lower than Lucide/Tabler (last release March 2025)
- Duotone styling documentation is sparse (secondary color opacity)

**Best for:** Fintech dashboards, data-dense UIs, brands that need weight variation.

### Lucide

**Strengths:**
- Largest actively-maintained open-source outline icon set (1,702)
- Most active development (weekly releases, strong community)
- Fork of Feather Icons -- the canonical SaaS icon aesthetic
- ISC license (equivalent to MIT for practical purposes)
- Clean, consistent 24x24 grid with 2px stroke
- Multiple usage modes (JS, icon font, individual SVGs, sprite)

**Weaknesses:**
- Pre-1.0 (v0.576.0) -- icon names may change between versions
- JS initialization required for the recommended usage mode (`lucide.createIcons()`)
- Icon font mode loads ALL 1,702 icons (no selective loading)
- Single style only (outline) -- no filled, bold, or weight variants
- Stroke width adjustment is per-icon, not per-design-system

**Best for:** SaaS products, developer tools, minimal/modern brands.

### Material Symbols

**Strengths:**
- Best CSS custom properties integration via variable font axes (fill, weight, grade, optical size)
- Three distinct style families (Outlined, Rounded, Sharp) from one provider
- Largest total icon count (2,500+) with best specialized coverage (medical, commerce)
- Google Fonts CDN is extremely reliable and fast
- Variable font means one file supports all weight/fill variations
- Apache 2.0 license permits commercial use without attribution

**Weaknesses:**
- Icons are recognizably "Material Design" -- may not suit brands seeking differentiation
- Naming convention uses underscores (`shopping_cart`) unlike every other library (hyphens)
- Default optical size (48px) is too large -- must explicitly set `opsz: 24`
- ~295KB per style family (larger than a single Phosphor weight)
- No individual icon loading via CDN (Google Fonts loads the full variable font)

**Best for:** Health products (medical icon coverage), e-commerce (commerce icon coverage), brands that want Rounded/approachable feel.

### Tabler Icons

**Strengths:**
- By far the largest icon count (6,038 total: 4,985 outline + 1,053 filled)
- When you need a niche icon, Tabler almost certainly has it
- Very active development (weekly releases)
- Consistent 24x24 grid with 2px stroke
- MIT license
- Simple CSS class syntax: `<i class="ti ti-home"></i>`

**Weaknesses:**
- Filled variant webfont is buggy (cannot use outline + filled simultaneously via CDN, as of Jan 2026)
- No weight variants beyond outline/filled
- Full webfont loads all 4,985 outline icons (no selective loading)
- Design style is competent but unremarkable -- doesn't have a distinctive personality

**Best for:** Safety net when other libraries lack specific icons. Feature-rich SaaS with many distinct features.

### Heroicons (Excluded)

**Strengths:**
- High-quality, hand-crafted icons by the Tailwind CSS team
- 4 size/style variants (outline/solid/mini/micro)
- Clean, professional aesthetic
- MIT license

**Weaknesses:**
- Only 316 icons -- constraining for an AI agent that needs to map UI elements to icons
- No icon font package -- requires inline SVG or third-party web component wrappers
- Designed for and tightly coupled with Tailwind CSS
- Lucide covers the same aesthetic with 5x the icon count

**Best for:** Tailwind CSS projects only.

## Recommendation

**Include all four: Phosphor, Lucide, Material Symbols, Tabler.**

Each serves a distinct purpose:

1. **Phosphor** is the weight champion -- 6 variants let the architect precisely tune visual density. Primary for fintech.

2. **Lucide** is the SaaS standard -- the Feather-derived aesthetic is what users of Linear, Vercel, and Notion-like products expect. Primary for SaaS.

3. **Material Symbols** has the deepest CSS custom properties integration and the broadest specialized icon coverage. Primary for health and e-commerce.

4. **Tabler** is the comprehensive fallback -- when the primary library lacks a needed icon, Tabler's 6,038 icons almost certainly have it.

**Exclude Heroicons** because 316 icons is insufficient for an AI agent doing automatic icon selection, it lacks icon font support, and Lucide covers the same niche better.

**Choose Phosphor when:** You need weight variation, duotone, or a fintech/data-dense aesthetic.
**Choose Lucide when:** You need clean SaaS aesthetics, the most active community, or developer-tool vibes.
**Choose Material Symbols when:** You need specialized icons (medical, commerce), variable font axes, or an approachable Rounded style.
**Choose Tabler when:** You need comprehensive coverage or the primary library lacks a critical icon.

## Sources

- [Phosphor Icons (web)](https://github.com/phosphor-icons/web) -- v2.1.2, MIT, CDN, weights
- [Lucide](https://github.com/lucide-icons/lucide) -- v0.576.0, ISC, icon count
- [Material Symbols guide](https://developers.google.com/fonts/docs/material_symbols) -- variable axes, CDN, Apache 2.0
- [Tabler Icons](https://github.com/tabler/tabler-icons) -- v3.38.0, MIT, 6,038 icons
- [Heroicons](https://github.com/tailwindlabs/heroicons) -- v2.1.5, MIT, 316 icons
- [Tabler filled webfont bug](https://github.com/tabler/tabler-icons/issues/1452) -- verified Jan 2026

---
*Comparison research for: Motif icon library curated set*
*Researched: 2026-03-04*
