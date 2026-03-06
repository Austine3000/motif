# Feature Landscape: Icon Library Integration

**Domain:** Icon library integration for AI design engineering system (Motif)
**Researched:** 2026-03-04

## Table Stakes

Features the icon integration must have. Missing = the feature is unusable.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Library selection by vertical | Architect must auto-pick the right library for fintech vs health vs SaaS vs e-commerce | Low | Static lookup table: vertical -> primary + secondary library |
| CDN link emission | token-showcase.html needs a `<link>` or `<script>` in `<head>` | Low | One CDN URL per library, version-pinned |
| Concrete icon names in screens | Composed screens must use real icon names, not placeholders | Medium | Requires icon name reference data per library |
| Icon sizing tokens | `--icon-size-sm`, `--icon-size-md`, `--icon-size-lg` in tokens.css | Low | Standard token additions |
| Icon color tokens | `--color-icon-primary`, `--color-icon-secondary`, etc. referencing existing color tokens | Low | Derive from existing `--color-text-*` tokens |
| CSS class markup | Icons must use CSS classes, not inline SVG blobs | Low | All 4 curated libraries support CSS class usage |

## Differentiators

Features that elevate the icon integration beyond basic functionality.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Brand personality override | Bold brands get Phosphor Bold, minimal brands get Lucide, etc. | Low | Extends selection logic with personality -> library mapping |
| Weight variant selection | Architect picks not just library but weight (thin/light/regular/bold/fill) | Medium | Only applicable to Phosphor (6 weights) and Material Symbols (variable axes) |
| Material Symbols variable axes | Map icon fill/weight/grade to CSS custom properties | Medium | Unique to Material Symbols; most CSS-native approach |
| Per-weight CDN loading | Load only the icon weights actually used, not the full set | Low | Phosphor supports per-weight CSS files; reduces load from ~3MB to ~500KB |
| Duotone icon support | Phosphor's duotone weight adds visual hierarchy in dashboards | Medium | Requires understanding duotone CSS styling (secondary color at 20% opacity) |
| Icon name validation | Warn when composed screens reference icon names that don't exist | High | Requires maintaining a name list per library per version |
| Vertical-specific icon catalogs | Curated lists of 50-100 icons per vertical with semantic groupings (navigation, actions, data, status) | Medium | Dramatically improves icon name accuracy in composed screens |

## Anti-Features

Features to explicitly NOT build.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Icon search/browser UI | Motif is CLI/agent-based, not a GUI tool. Building an icon browser adds complexity with no value for the AI workflow. | Provide static reference data files the agents read. |
| Custom icon upload | Users adding their own SVGs breaks the curated, consistent design system promise. | Support all 4 libraries; if none fit, user manually overrides. |
| Inline SVG emission | Inlining raw SVG markup bloats composed HTML, makes it harder to read, and breaks the icon font approach. | Always use CSS class-based icon references. |
| Icon animation | Animated icons add JS complexity, increase bundle size, and are rarely needed in the verticals Motif targets. | Use CSS transitions on icon containers if needed, not animated icon libraries. |
| Iconify meta-library | Accessing 200,000+ icons from 100+ sets creates choice paralysis and inconsistency. The value of curation is constraint. | Stick with 4 curated libraries. |
| Automatic icon suggestion | Having the architect "guess" which icon fits a button label is unreliable. | Provide icon name catalogs organized by semantic category (navigation, actions, etc.) for the architect to select from. |

## Feature Dependencies

```
Icon sizing tokens -> Icon color tokens (both needed before CDN integration)
CDN link emission -> Library selection logic (must select before emitting)
Library selection logic -> Domain affinity data (static reference data)
Concrete icon names -> Icon name reference data (per-library catalogs)
Brand personality override -> Library selection logic (extends base selection)
Weight variant selection -> CDN link emission (affects which CSS file to load)
Material Symbols axes -> Icon tokens in tokens.css (axes map to custom properties)
```

## MVP Recommendation

Prioritize:
1. **Library selection by vertical** -- Core value proposition. Static lookup, low complexity.
2. **CDN link emission** -- Enables token-showcase.html to display icons. Depends on selection.
3. **Icon sizing + color tokens** -- Tokens.css additions. Small, well-defined.
4. **Concrete icon names** -- Requires reference data but is the difference between useful and useless output.
5. **Brand personality override** -- Low complexity extension of selection logic, high impact on output quality.

Defer:
- **Icon name validation:** High complexity, requires maintaining name lists. Better to invest in good reference catalogs.
- **Vertical-specific icon catalogs:** Valuable but time-intensive to curate properly. Can ship v1.1 with a smaller common-icons table and expand later.
- **Duotone/variable axes CSS:** Nice-to-have refinements. The base icon integration works without them.

---
*Feature landscape for: Motif icon library integration*
*Researched: 2026-03-04*
