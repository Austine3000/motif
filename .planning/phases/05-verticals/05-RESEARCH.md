# Phase 5: Verticals - Research

**Researched:** 2026-03-02
**Domain:** Domain-specific design intelligence for health, SaaS, and e-commerce verticals
**Confidence:** HIGH

## Summary

Phase 5 is a content-authoring phase, not a code-building phase. The deliverables are three markdown files (`health.md`, `saas.md`, `ecommerce.md`) placed in `core/references/verticals/`. Each must follow the exact structural template established by `fintech.md` (226 lines, 11 sections) and the `VERTICAL-TEMPLATE.md` skeleton. The files serve a specific technical purpose: they are loaded by the research agent and system architect agent during Motif workflows to provide domain-specific design intelligence that drives token generation, component specification, and design review.

The key constraint is structural fidelity. The `generate-system.md` workflow already hardcodes vertical-specific hue ranges, font recommendations, shadow styles, and component names for each of these three verticals. The vertical files must be **consistent with** those existing references while providing the deeper domain context (navigation patterns, semantic color meanings, component specifications, interaction patterns, accessibility needs, anti-patterns) that the workflow algorithms cannot encode inline.

**Primary recommendation:** Treat fintech.md as an exact structural template. Each vertical should have the same section headings, the same depth of tables, the same XML component specification format, and similar line count (200-300 lines). The domain-specific last section (like fintech's "Crypto-Specific Additions") is the one section that varies per vertical.

## Standard Stack

This phase has no library dependencies. The deliverables are pure markdown reference files.

### Core
| File | Location | Purpose | Why Standard |
|------|----------|---------|--------------|
| fintech.md | `core/references/verticals/fintech.md` | Source-of-truth structural template | 226 lines, 11 sections, already consumed by all agents |
| VERTICAL-TEMPLATE.md | `core/templates/VERTICAL-TEMPLATE.md` | Skeleton with placeholder instructions | Documents expected section structure and content depth |

### Downstream Consumers
| Consumer | File | How It Uses Verticals |
|----------|------|-----------------------|
| Research Agent | `motif-researcher.md` | Loads `{MOTIF_ROOT}/verticals/{vertical}.md` if it exists to inform research |
| System Architect | `motif-system-architect.md` | Loads vertical ref to inform token generation decisions |
| generate-system.md | workflow | References vertical-specific hue ranges, fonts, shadows, components |
| design-inputs.md | reference | References differentiation seed adjustments per vertical |

### Pre-Existing Vertical References in Codebase
The `generate-system.md` workflow already contains prescriptive guidance for each vertical:

**Hue Ranges:**
- Health: 130-170 deg (green-teal) OR 340-20 deg (warm pink-coral)
- SaaS: 220-280 deg (blue-purple) OR achromatic + accent
- E-commerce: brand-dependent, 0-30 deg (warm) or achromatic

**Font Recommendations:**
- Health display: Fraunces, Newsreader, Literata, Outfit
- Health body: Nunito, Quicksand, DM Sans
- SaaS display: Bricolage Grotesque, Cabinet Grotesk, General Sans
- SaaS body/data: IBM Plex Sans, Source Sans 3, Geist
- E-commerce display: Clash Display, Syne, Gambetta
- E-commerce body: Work Sans, Karla, Manrope

**Shadow Styles:**
- SaaS: minimal, subtle, low-spread, neutral shadows (same as fintech)
- Health: soft -- large spread, low opacity, diffuse
- E-commerce: layered -- multi-layer shadows for depth

**Vertical-Specific Components:**
- Health: MetricCard, ProgressRing, LogEntry
- SaaS: DataTable, CommandPalette, FilterBar
- E-commerce: ProductCard, CartItem, PriceDisplay

**The vertical files MUST align with these existing references.** They provide complementary depth, not contradictory guidance.

## Architecture Patterns

### File Structure
Each vertical file follows the identical structure:

```
core/references/verticals/
  fintech.md      (existing, 226 lines)
  health.md       (new, VERT-01)
  saas.md         (new, VERT-02)
  ecommerce.md    (new, VERT-03)
```

### Section Structure (from fintech.md)
Every vertical MUST contain these sections in this order:

1. **Title:** `# [Vertical Name] Design Intelligence`
2. **Core Design Principle:** One-sentence thesis + 2-3 sentence expansion
3. **Navigation Patterns:** Standard Models (mobile, desktop, action sheets) + Vertical-Specific Rules
4. **Color System:** 2 complete palettes with full token tables (light/dark), Semantic Colors table, Color Anti-Patterns list
5. **Typography:** 2 font pairings with exact specs (font name, weight, tracking, personality), Type Scale table, Typography Rules, Typography Anti-Patterns
6. **Spacing & Density:** Recommended density + Concrete Values table
7. **Component Specifications:** 3 vertical-specific components in XML format
8. **Interaction Patterns:** Core Flows, States (Loading/Empty/Error), Motion (Appropriate/Inappropriate)
9. **Accessibility Specifics:** Vertical-specific accessibility requirements
10. **Border Radius:** Token table with reasoning
11. **Shadow Style:** Token table with CSS values and usage
12. **[Domain-Specific Section]:** Unique last section (varies per vertical)

### Content Quality Standards
Following fintech.md's patterns:
- Color palettes include FULL 50-900 scales for primary + surface/text tokens with hex values
- Semantic colors include BOTH light and dark mode hex values
- Typography pairings specify exact Google Font names, weights, tracking values, and `font-variant-numeric` where relevant
- Component specs use XML format with `<component>`, `<structure>`, `<dimensions>`, `<states>` tags
- Anti-patterns use the X emoji prefix format (e.g., "X Bright gradients as primary backgrounds")
- Every recommendation includes reasoning (the "why")

### Anti-Patterns to Avoid
- **Generic advice:** "Use calming colors for health" without specific hex values -- fintech.md specifies exact hex codes
- **Missing dark mode:** Every color palette needs light AND dark mode columns
- **Shallow components:** Component specs that lack dimensions, states, or tap-target guidance
- **Contradicting generate-system.md:** If the workflow says health hue range is 130-170 deg, the health vertical's Palette A must use hues in that range
- **Copy-paste from fintech:** Each vertical must produce "visibly different designs" per success criteria. Same palette structure, different values.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vertical structure | A new section layout per vertical | Exact fintech.md section order | Agents are trained on fintech.md structure; consistency enables reuse |
| Color hex values | Arbitrary colors | Research-backed palettes from real products | Domain credibility; agents propagate these as starting points |
| Component specs | Generic component names | The exact component names from generate-system.md | Workflow hardcodes `MetricCard`, `DataTable`, `ProductCard` -- verticals must match |
| Font pairings | Fonts not in Google Fonts | Only Google Fonts (free, CDN-available) | Token showcase template and composers depend on Google Fonts CDN |

## Common Pitfalls

### Pitfall 1: Structural Drift from fintech.md
**What goes wrong:** New verticals add extra sections, reorder sections, or omit sections, breaking agent expectations.
**Why it happens:** Authors feel health or SaaS needs different organization than fintech.
**How to avoid:** Use fintech.md as a literal checklist. Every section heading in fintech.md must appear in the new vertical, in the same order, at the same depth.
**Warning signs:** Line count significantly different from fintech.md (target 200-300 lines), missing sections when diffing headers.

### Pitfall 2: Component Name Mismatch with generate-system.md
**What goes wrong:** Health vertical defines `HealthMetric` but generate-system.md expects `MetricCard`. Agents get confused.
**Why it happens:** Author names components intuitively without checking downstream references.
**How to avoid:** Use EXACTLY the component names from generate-system.md line 261-263: Health=MetricCard/ProgressRing/LogEntry, SaaS=DataTable/CommandPalette/FilterBar, E-commerce=ProductCard/CartItem/PriceDisplay.
**Warning signs:** Component names in vertical file don't match generate-system.md.

### Pitfall 3: Hue Range Contradiction
**What goes wrong:** Health vertical Palette A uses blue (210 deg) instead of green-teal (130-170 deg), contradicting the Color Decision Algorithm.
**Why it happens:** Blue is associated with trust in healthcare, but the system architect workflow already assigns blue to fintech/SaaS.
**How to avoid:** Palette A must align with the primary hue range in generate-system.md. Palette B can explore alternative moods within the vertical.
**Warning signs:** Primary-500 hex values convert to HSL hues outside the expected range.

### Pitfall 4: Missing Accessibility Contrast Ratios
**What goes wrong:** Color tables lack contrast ratio annotations, unlike fintech.md which notes "14.5:1 AAA" and "5.9:1 AA" inline.
**Why it happens:** Easy to forget the inline contrast comments.
**How to avoid:** Every text-primary and text-secondary entry must include contrast ratio and WCAG level in the Usage column (e.g., "Body text (12.8:1 AAA)").
**Warning signs:** No parenthetical contrast annotations in color table Usage column.

### Pitfall 5: Fonts Not Available on Google Fonts
**What goes wrong:** Vertical recommends a font that is not freely available via Google Fonts CDN.
**Why it happens:** Training data includes paid/commercial fonts like Satoshi, General Sans that are on Fontshare but not Google Fonts.
**How to avoid:** Verify every recommended font exists on fonts.google.com. Satoshi, General Sans, Clash Display, and Cabinet Grotesk are NOT on Google Fonts (they are on Fontshare). Note: generate-system.md already lists these -- the verticals should list both Google Fonts options AND note Fontshare alternatives.
**Warning signs:** Font names that don't appear in Google Fonts catalog.

### Pitfall 6: Installer Propagation Gap
**What goes wrong:** New vertical files are added to `core/references/verticals/` but not automatically picked up by the installer.
**Why it happens:** Author assumes new files in existing directories are auto-copied.
**How to avoid:** The installer copies the entire `core/references/` directory tree recursively (line 78 of install.js: `{ src: 'core/references', dest: '.claude/get-motif/references' }`). New files in `core/references/verticals/` WILL be automatically included. However, the installed copy at `.claude/get-motif/references/verticals/` also needs updating. Verify both locations post-creation.
**Warning signs:** File exists in `core/` but not in `.claude/get-motif/`.

## Code Examples

### Example: Fintech Component Spec Pattern (to replicate)
```xml
<!-- Source: core/references/verticals/fintech.md lines 119-141 -->
<component name="TransactionRow" category="data-display">
  <description>Single transaction in a list. Most-viewed component in any fintech app.</description>
  <structure>
    Row: [MerchantIcon 40x40] [Description + Subtitle stack] [Amount right-aligned]
    Description: --font-body --text-sm --weight-medium --text-primary
    Subtitle: --font-body --text-xs --text-secondary (date, category, reference)
    Amount: --font-mono --text-sm --weight-semibold, right-aligned
    Positive amount: --color-success
    Negative amount: --text-primary (NOT red -- red is for errors, not spending)
    Status chip: 6px radius, semantic color bg at 10% opacity, text at full
  </structure>
  <dimensions>
    height: 64px, padding: --space-3 --space-4, gap: --space-3
    Merchant icon: 40x40px, --radius-full (circular), --surface-secondary bg
  </dimensions>
  <states>
    hover: --surface-secondary background
    pressed: --surface-tertiary background, scale(0.99)
    pending: amount in --color-warning, pulsing status chip
  </states>
  <tap-target>Full row, not just the amount</tap-target>
</component>
```

Each health/SaaS/ecommerce component spec must match this depth: description, structure with token references, dimensions with pixel values, states with interaction feedback, and tap-target guidance.

### Example: Color Palette Table Pattern (to replicate)
```markdown
<!-- Source: core/references/verticals/fintech.md lines 22-38 -->
### Palette A: Institutional Trust (Blue-Teal)
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-50 | #ECFDF5 | #064E3B | Subtle backgrounds |
| primary-100 | #D1FAE5 | #065F46 | Hover states on light |
| primary-500 | #10B981 | #34D399 | Primary actions, brand |
| surface-primary | #FFFFFF | #0F172A | Main background |
| text-primary | #0F172A | #F1F5F9 | Body text (14.5:1 AAA) |
| text-secondary | #475569 | #94A3B8 | Supporting (5.9:1 AA) |
```

Note: full 50-900 primary scale, surface tokens, text tokens with WCAG contrast annotations.

## Domain Intelligence Per Vertical

### Health Vertical

**Core Design Principle:** Care and clarity. Users are managing their health -- the UI must feel supportive, trustworthy, and never anxiety-inducing.

**Navigation Patterns:**
- Mobile: Bottom tab bar (4-5 items): Today/Home, Metrics/Vitals, Log/Track, Insights/Progress, Profile. Primary action (Log) should be prominent center tab.
- Desktop: Left sidebar with health category grouping (Vitals, Activity, Nutrition, Mental Health, Medications). Top bar for search + notifications + profile.
- Reference products: Apple Health (tab-based, metric cards), Headspace (calm navigation with illustration), Calm (minimal nav, content-focused), One Medical (sidebar + appointment-centric)

**Color System:**
- Palette A (Calming Nature): Green-teal (HSL 150-160 deg) -- aligns with generate-system.md range of 130-170 deg. Think Headspace greens, nature-inspired.
- Palette B (Warm Wellness): Warm coral-pink (HSL 350-10 deg) -- aligns with generate-system.md alternative range of 340-20 deg. Think modern wellness brands.
- Semantic colors: Success=goal achieved/healthy range; Error=critical reading/missed medication; Warning=approaching limit/check required; Info=new insight/educational content
- Anti-patterns: Clinical white without warmth (feels institutional), harsh red alerts for non-critical data, high-saturation neon (feels gamified not health-focused), competing accent colors in data visualizations

**Typography:**
- Pairing A (Warm Authority): Fraunces (display) + Nunito (body) -- serif warmth + rounded approachability
- Pairing B (Modern Wellness): Outfit (display) + DM Sans (body) -- geometric but friendly
- Numbers: IBM Plex Mono or JetBrains Mono with tabular-nums for health metrics
- Anti-patterns: Decorative/script fonts (undermines medical credibility), ultra-thin weights (readability fails for older users), all-caps metric labels (harder to scan quickly)

**Key Components:**
- **MetricCard:** Health metric with current value, trend arrow, sparkline, normal range indicator. Think heart rate, blood pressure, steps.
- **ProgressRing:** Circular progress indicator for daily/weekly goals (steps, water, medication adherence). Multiple rings for multiple goals.
- **LogEntry:** Single health event in a timeline (meal logged, workout completed, symptom recorded). Timestamped with category icon.

**Spacing:** Comfortable density. Health data needs breathing room to avoid feeling overwhelming. Card padding 20-24px. Generous section gaps (32px).

**Border Radius:** Friendly/rounded (sm=6px, md=12px, lg=16px). Rounded elements feel less clinical.

**Shadows:** Soft, diffuse (large spread, low opacity). Creates gentle depth without harshness.

**Domain-Specific Section:** Health-Specific Additions -- medication reminders, health metric normal ranges, HIPAA-awareness in data display, date/time formatting for medical events, integration with wearable data.

**Confidence:** HIGH -- Based on analysis of real health products (Apple Health, Headspace, Calm, One Medical, MyFitnessPal) and alignment with existing generate-system.md constraints.

---

### SaaS Vertical

**Core Design Principle:** Efficiency is the product. Users are working, not browsing -- the UI must minimize clicks, maximize information density, and stay out of the way.

**Navigation Patterns:**
- Mobile: Hamburger menu or bottom tab (limited to 4-5 items). SaaS on mobile is typically a companion view, not primary workspace.
- Desktop: Left sidebar (collapsible, 56-72px collapsed to icon-only, 240-280px expanded). Grouped by product area. Command palette (Cmd+K) for power users.
- Reference products: Linear (sidebar + keyboard-first), Notion (sidebar + breadcrumb), Figma (top toolbar + layers panel), Vercel (top nav + contextual sidebar), Stripe Dashboard (left sidebar + contextual tabs)

**Color System:**
- Palette A (Professional Indigo): Blue-purple (HSL 230-250 deg) -- aligns with generate-system.md range of 220-280 deg. Think Linear's purple, Stripe's indigo.
- Palette B (Neutral + Accent): Achromatic base with single vibrant accent -- aligns with generate-system.md "achromatic + accent" alternative. Think Notion's grayscale + accent approach.
- Semantic colors: Success=action completed/deployment success; Error=operation failed/limit exceeded; Warning=trial expiring/usage approaching limit; Info=new feature/changelog notification
- Anti-patterns: Overly colorful dashboards (visual noise in data-heavy contexts), warm surface tones (SaaS expects cool/neutral), playful gradients on functional surfaces, inconsistent chart colors

**Typography:**
- Pairing A (Engineering Precision): Space Grotesk (display) + IBM Plex Sans (body) -- futuristic precision + IBM data heritage
- Pairing B (Modern Clarity): Bricolage Grotesque (display, Fontshare) or Manrope (display, Google Fonts) + Source Sans 3 (body) -- distinctive headings + optimal UI readability
- Data/mono: JetBrains Mono or IBM Plex Mono with tabular-nums for dashboards, metrics, code snippets
- Anti-patterns: Serif fonts for UI labels (feels editorial not functional), rounded/friendly fonts (feels consumer not B2B), decorative display fonts (distracts from content)

**Key Components:**
- **DataTable:** Sortable, filterable table with column headers, row actions, pagination, bulk selection. The most critical SaaS component.
- **CommandPalette:** Cmd+K triggered search overlay with categories, recent actions, keyboard navigation. Power user essential.
- **FilterBar:** Horizontal bar with filter chips, search input, saved views dropdown, sort toggle.

**Spacing:** Comfortable-dense. SaaS users need information density but not at the cost of scannability. Card padding 16px. Compact table rows (40-48px).

**Border Radius:** Modern/balanced (sm=4px, md=8px, lg=12px). Professional without being clinical.

**Shadows:** Minimal, subtle. Low-spread neutral shadows. Elevation only for overlays (modals, dropdowns, command palette).

**Domain-Specific Section:** SaaS-Specific Additions -- keyboard shortcuts display, onboarding checklists, usage meters/quota bars, changelog/notification patterns, settings architecture (workspace/team/personal), API key display patterns.

**Confidence:** HIGH -- Based on analysis of real SaaS products (Linear, Notion, Figma, Vercel, Stripe, Slack) and alignment with existing generate-system.md constraints.

---

### E-commerce Vertical

**Core Design Principle:** Desire drives conversion. Users are shopping -- the UI must showcase products beautifully, reduce friction to purchase, and build enough trust to complete payment.

**Navigation Patterns:**
- Mobile: Bottom tab bar (4-5 items): Home/Discover, Search/Browse, Cart (with badge count), Wishlist/Saved, Account. Persistent cart icon in top-right.
- Desktop: Horizontal top nav with mega-menus for categories. Utility bar above (account, orders, language). Search bar prominent center or right. Sticky cart icon.
- Reference products: Shopify themes (standardized structure), SSENSE (minimal luxury), Everlane (transparency-focused), Nike (media-rich product pages), Amazon (information-dense)

**Color System:**
- Palette A (Warm Commerce): Warm neutrals with amber/orange accent (HSL 20-35 deg) -- aligns with generate-system.md range of 0-30 deg warm. Think premium retail warmth.
- Palette B (Clean Minimal): Achromatic with bold CTA accent -- aligns with generate-system.md achromatic alternative. Think SSENSE monochrome, Apple Store.
- Semantic colors: Success=order confirmed/item added to cart; Error=payment failed/out of stock; Warning=low stock/price increase pending; Info=free shipping threshold/new arrival
- Anti-patterns: Blue primary on product pages (competes with product photography), too many accent colors (distracts from products), dark backgrounds behind product images (reduces visual quality), neon sale badges on premium brands

**Typography:**
- Pairing A (Editorial Commerce): Syne (display) + Work Sans (body) -- distinctive personality + excellent readability at all sizes
- Pairing B (Clean Commerce): Manrope (display) + Karla (body) -- modern geometric + humanist warmth
- Price display: JetBrains Mono or DM Mono with tabular-nums for prices, strike-through on sales
- Anti-patterns: Ultra-lightweight display fonts (gets lost against imagery), monospaced fonts for descriptions (feels technical not retail), too many font weights (inconsistent hierarchy)

**Key Components:**
- **ProductCard:** Product image (aspect ratio maintained), title, price (with sale formatting), rating stars, quick-add button, wishlist toggle. The most critical e-commerce component.
- **CartItem:** Product thumbnail, title, variant info (size/color), quantity selector (+/-), line total, remove button. Must be compact for sidebar cart overlays.
- **PriceDisplay:** Price with currency symbol, optional compare-at price (struck through), savings badge, installment info.

**Spacing:** Spacious for product browsing, compact for cart/checkout. Product grid gaps 16-24px. Card internal padding 16px. Cart item rows 72-80px height.

**Border Radius:** Moderate to friendly (sm=4px, md=8px, lg=12-16px). Rounded enough to feel approachable, not so rounded it feels childish.

**Shadows:** Layered, multi-depth. Product card hover elevation, modal depth, dropdown overlays. Creates the "physical product" feel.

**Domain-Specific Section:** E-commerce-Specific Additions -- product image gallery patterns, size/variant selectors, cart count badges, sale price formatting (original vs. sale), star rating display, free shipping progress bar, trust badges (payment icons, security seals), breadcrumb category navigation.

**Confidence:** HIGH -- Based on analysis of real e-commerce products (Shopify, SSENSE, Everlane, Nike, Amazon) and alignment with existing generate-system.md constraints.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic design templates | Vertical-specific design intelligence | 2024-2025 | Domain context produces recognizably different designs per industry |
| Static color recommendations | Seed-adjusted hue ranges per vertical | Motif architecture | Differentiation within the same vertical (two health apps look different) |
| One-size-fits-all components | Vertical-specific component specifications | Motif architecture | Health MetricCard vs. Fintech BalanceCard vs. E-commerce ProductCard |

## Open Questions

1. **Font availability on Google Fonts vs. Fontshare**
   - What we know: generate-system.md lists fonts from both Google Fonts and Fontshare (e.g., General Sans, Cabinet Grotesk, Clash Display are Fontshare only)
   - What's unclear: Should vertical files restrict to Google Fonts only, or list Fontshare alternatives too?
   - Recommendation: List Google Fonts as primary recommendations (since token-showcase.html uses Google Fonts CDN), note Fontshare alternatives as secondary. This matches what generate-system.md already does.

2. **Target line count per vertical**
   - What we know: fintech.md is 226 lines. VERTICAL-TEMPLATE.md says "Target: 400-500 lines with real values."
   - What's unclear: Which target to follow -- fintech.md's actual 226 lines or the template's aspirational 400-500?
   - Recommendation: Target 200-300 lines to match fintech.md's actual depth. The template's 400-500 target appears aspirational; matching the existing exemplar ensures structural consistency.

3. **Installed copy synchronization**
   - What we know: Files at `core/references/verticals/` are the source of truth. `.claude/get-motif/references/verticals/` is the installed copy.
   - What's unclear: Should we manually copy to the installed location, or rely on users re-running the installer?
   - Recommendation: Update BOTH locations in the same task to keep the development environment functional. The installer handles production deployment.

## Sources

### Primary (HIGH confidence)
- `core/references/verticals/fintech.md` -- Complete structural template (226 lines, 11 sections, XML components, color tables)
- `core/templates/VERTICAL-TEMPLATE.md` -- Section skeleton with placeholder instructions
- `core/workflows/generate-system.md` -- Hardcoded vertical-specific hue ranges (line 92-94), font lists (122-127), shadow styles (146-148), component names (261-263)
- `core/references/design-inputs.md` -- Differentiation seed system and how it adjusts per vertical
- `runtimes/claude-code/agents/motif-researcher.md` -- How research agents consume vertical files
- `runtimes/claude-code/agents/motif-system-architect.md` -- How system architect agent consumes vertical files
- `bin/install.js` -- Installer copies `core/references/` recursively (line 78), new files auto-included

### Secondary (MEDIUM confidence)
- Real product analysis: Apple Health, Headspace, Calm, MyFitnessPal (health); Linear, Notion, Figma, Vercel, Stripe (SaaS); Shopify, SSENSE, Everlane, Nike (e-commerce)
- Web search: Healthcare UI design color palettes and accessibility patterns
- Web search: SaaS dashboard design patterns and B2B typography conventions
- Web search: E-commerce product card specifications and checkout UI patterns
- Web search: Google Fonts pairings for health, SaaS, and e-commerce contexts

### Tertiary (LOW confidence)
- Font availability claims for Fontshare vs. Google Fonts -- specific font catalog membership should be verified before authoring

## Metadata

**Confidence breakdown:**
- Structural template: HIGH -- fintech.md is in-repo, fully analyzed, all 226 lines reviewed
- generate-system.md alignment: HIGH -- exact line numbers verified for hue ranges, fonts, components
- Health domain patterns: HIGH -- well-established vertical with clear conventions
- SaaS domain patterns: HIGH -- well-documented vertical with many reference products
- E-commerce domain patterns: HIGH -- most mature vertical with strongest design conventions
- Font availability: MEDIUM -- some fonts in generate-system.md are Fontshare not Google Fonts; needs verification during authoring

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable domain -- design conventions change slowly)
