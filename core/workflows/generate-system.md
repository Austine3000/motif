---
description: Generate a complete design system with tokens, primitives, and component specifications. Spawns a fresh system generator agent.
allowed-tools: Read, Grep, Glob, Bash(git add:*), Bash(git commit:*), Bash(mkdir:*), Task
---

<path_resolution>
{MOTIF_ROOT} resolves to the directory where Motif core files are installed.
Claude Code: .claude/get-motif
OpenCode: .opencode/get-motif
Gemini: .gemini/get-motif
Cursor: .motif
The installer sets this path. If unsure, check the project's config injection file for the correct path.
</path_resolution>

# /motif:system — Design System Generator Orchestrator

You are the Motif system generator orchestrator. You spawn a fresh agent to generate the design system.

<gate_check>
Read `.planning/design/STATE.md`.
If Phase is not `RESEARCHED`, stop: "Run /motif:research first."
If `.planning/design/DESIGN-RESEARCH.md` does not exist, stop: "Run /motif:research first."
</gate_check>

## Step 1: Read Context (Paths Only)

Check these exist:
- `.planning/design/PROJECT.md`
- `.planning/design/DESIGN-BRIEF.md`
- `.planning/design/DESIGN-RESEARCH.md`
- `.planning/design/research/02-visual-language.md`

Read STATE.md for: vertical name, stack.

Check if vertical reference exists: `{MOTIF_ROOT}/references/verticals/{VERTICAL}.md`

```bash
mkdir -p .planning/design/system
```

## Step 2: Spawn System Generator Agent

<agent_spawn id="generate-system">
**Task prompt:**

You are a design system architect. Generate a complete, production-ready design system based on domain research.

## Context — Read These First
1. `.planning/design/PROJECT.md`
2. `.planning/design/DESIGN-BRIEF.md`
3. `.planning/design/DESIGN-RESEARCH.md` — CRITICAL: follow all LOCKED decisions
4. `.planning/design/research/02-visual-language.md`
5. `.planning/design/research/03-accessibility.md`
{IF vertical ref exists: 6. `{MOTIF_ROOT}/references/verticals/{VERTICAL}.md`}

## Output 1: tokens.css (budget: ≤3000 tokens)

Generate CSS custom properties. EVERY value must be justified.

### Color Decision Algorithm

**FIRST: Check DESIGN-BRIEF.md for Input Type and Brand Constraints.**

```
IF Input Type D (Figma/Design File) with pixel-perfect fidelity:
  → EXTRACT colors from the design file. Do NOT generate.
  → Analyze screenshots/Figma data for: primary, secondary, surface, text, semantic colors
  → Map extracted values to token format
  → Skip the generation algorithm below
  → Note in tokens.css: "/* Extracted from design file — [source] */"

IF Brand Constraints contain LOCKED primary color:
  1. Use the user's exact value as --color-primary-500 (NEVER modify)
  2. Generate scale 50-950 by adjusting lightness around the locked value:
     - 50: set luminance to ~97%
     - 100-400: interpolate between 50 and 500
     - 500: USER'S EXACT HEX (locked)
     - 600-900: darken progressively
     - 950: set luminance to ~10%
  3. If the user also provided secondary color, lock that too
  4. Derive surface + semantic + text colors to COMPLEMENT locked colors
  5. Validate WCAG contrast; if locked color fails, adjust surfaces (not the locked color)
  6. NOTE in tokens.css: "/* Primary: [hex] — user-specified brand color (LOCKED) */"

IF Starting Fresh (Type A) or no color constraints:
  1. Read the Differentiation Seed from DESIGN-BRIEF.md
  2. Read the LOCKED color direction from DESIGN-RESEARCH.md
  3. Choose primary hue using seed-adjusted ranges:

     BASE ranges per vertical:
     - Fintech: 170-220° (blue-teal)
     - Health: 130-170° (green-teal) OR 340-20° (warm pink-coral)
     - SaaS: 220-280° (blue-purple) OR achromatic + accent
     - E-commerce: brand-dependent, 0-30° (warm) or achromatic

     SEED adjustments:
     - Personality ≥ 7 (rebellious): SHIFT hue ±60-120° from base range
       → Fintech rebels: 260-310° (violet/magenta) or 30-60° (amber/gold)
       → Health rebels: 260-290° (purple calm) or 10-40° (energetic coral)
     - Temperature ≥ 6 (warm): pull hue toward warm quadrant (300-60°)
       → Warm surfaces: use cream/warm gray instead of cool gray
     - Formality ≤ 4 (casual): increase saturation 10-15%
     - Era ≥ 7 (cutting-edge): consider dark-mode-first, monochrome + accent

  4. ANTI-CONVERGENCE: Check competitors mentioned in DESIGN-BRIEF.md
     → If generated hue is within 20° of a named competitor's primary, shift by 30-40°
     → e.g., if user mentioned "different from Revolut" and you generated teal, shift to deep blue or violet
  
  5. Generate full scale (50-950) using consistent lightness steps
  6. Derive semantic, surface, text, border colors
  7. CHECK all contrast pairs for WCAG AA
  8. NOTE in tokens.css: detailed reasoning including seed values and why this specific hue
```

### Typography Decision Algorithm
1. Read the LOCKED typography direction from DESIGN-BRIEF.md
2. **IF brand font is LOCKED:** Use it. Even if it's Inter. User choice overrides Motif preferences. Choose complementary fonts for remaining roles.
3. **IF starting fresh:** NEVER use Inter, Roboto, Open Sans, Lato, Arial, Helvetica, system-ui
4. Choose from Google Fonts based on vertical + differentiation seed:
   - **Fintech display:** DM Sans, Plus Jakarta Sans, Satoshi, General Sans
   - **Fintech numbers:** JetBrains Mono, IBM Plex Mono, Fira Code
   - **Health display:** Fraunces, Newsreader, Literata, Outfit
   - **Health body:** Nunito, Quicksand, DM Sans
   - **SaaS display:** Bricolage Grotesque, Cabinet Grotesk, General Sans
   - **SaaS body/data:** IBM Plex Sans, Source Sans 3, Geist
   - **E-commerce display:** Clash Display, Syne, Gambetta
   - **E-commerce body:** Work Sans, Karla, Manrope
4. Set type scale using a consistent ratio (1.2 minor third OR 1.25 major third)
5. Add `font-variant-numeric: tabular-nums` token for fintech/data-heavy products

### Spacing Decision Algorithm
1. Base unit: 4px (0.25rem)
2. Scale: 0, 1(4), 2(8), 3(12), 4(16), 5(20), 6(24), 8(32), 10(40), 12(48), 16(64), 20(80), 24(96)
3. Density adjustment based on LOCKED density decision:
   - Compact: default component padding = space-3 (12px)
   - Comfortable: default component padding = space-4 (16px)
   - Spacious: default component padding = space-5-6 (20-24px)

### Border Radius Decision Algorithm
- Clinical/professional: sm=2px, md=4px, lg=8px
- Modern/balanced: sm=4px, md=8px, lg=12px
- Friendly/approachable: sm=6px, md=12px, lg=16px, with full rounding on pills/chips
- If vertical reference specifies, use that

### Shadow Decision Algorithm
- Minimal (SaaS/fintech): subtle, low-spread, neutral shadows
- Layered (e-commerce/dashboards): multi-layer shadows for depth
- Soft (health/wellness): large spread, low opacity, diffuse

### Token File Format
```css
/* ═══════════════════════════════════════
   MOTIF — [Product] Design Tokens
   Vertical: [vertical] | Generated: [date]
   ═══════════════════════════════════════ */

:root {
  /* ── Colors ── */
  /* Primary: [1-sentence reasoning] */
  --color-primary-50: #[hex];
  /* ... full scale ... */

  /* Semantic */
  --color-success: #[hex];  /* [reasoning] */
  --color-error: #[hex];    /* [reasoning] */
  --color-warning: #[hex];
  --color-info: #[hex];

  /* Surfaces */
  --surface-primary: #[hex];
  --surface-secondary: #[hex];
  --surface-tertiary: #[hex];
  --surface-elevated: #[hex];

  /* Text */
  --text-primary: #[hex];   /* Contrast on surface-primary: [X]:1 ✓ AA */
  --text-secondary: #[hex]; /* Contrast: [X]:1 ✓ AA */
  --text-tertiary: #[hex];
  --text-inverse: #[hex];
  --text-link: #[hex];

  /* Borders */
  --border-primary: #[hex];
  --border-focus: #[hex];

  /* ── Typography ── */
  /* [1-sentence font choice reasoning] */
  --font-display: '[Font]', [fallbacks];
  --font-body: '[Font]', [fallbacks];
  --font-mono: '[Font]', [fallbacks];

  /* Scale ([ratio] ratio) */
  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-lg: 1.125rem;
  --text-xl: 1.25rem;
  --text-2xl: 1.5rem;
  --text-3xl: 1.875rem;
  --text-4xl: 2.25rem;

  --leading-tight: 1.15;
  --leading-normal: 1.5;
  --leading-relaxed: 1.65;

  --weight-normal: 400;
  --weight-medium: 500;
  --weight-semibold: 600;
  --weight-bold: 700;

  /* ── Spacing ── */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.25rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* ── Radii ── */
  --radius-sm: [X]px;
  --radius-md: [X]px;
  --radius-lg: [X]px;
  --radius-xl: [X]px;
  --radius-full: 9999px;

  /* ── Shadows ── */
  --shadow-sm: [value];
  --shadow-md: [value];
  --shadow-lg: [value];

  /* ── Transitions ── */
  --ease-default: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;

  /* ── Z-Index ── */
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 400;
  --z-toast: 600;
  --z-tooltip: 700;

  /* ── Vertical-Specific ── */
  /* [Add any tokens specific to this vertical] */
}
```

## Output 2: COMPONENT-SPECS.md (budget: ≤5000 tokens)

For each core component, generate an XML specification:

Components to specify: Button, Input, Card, Badge, Avatar, Toast, Modal, Dropdown, Table row, Nav item.

Plus vertical-specific components:
- Fintech: TransactionRow, BalanceCard, StatusChip
- Health: MetricCard, ProgressRing, LogEntry
- SaaS: DataTable, CommandPalette, FilterBar
- E-commerce: ProductCard, CartItem, PriceDisplay

Format per component:
```xml
<component name="Button" category="action">
  <variants>
    <variant name="primary">
      background: var(--color-primary-500);
      color: var(--text-inverse);
      padding: var(--space-3) var(--space-5);
      border-radius: var(--radius-md);
      font: var(--weight-semibold) var(--text-sm) var(--font-body);
      transition: background var(--duration-fast) var(--ease-default);
    </variant>
    <variant name="secondary">...</variant>
    <variant name="ghost">...</variant>
    <variant name="destructive">...</variant>
  </variants>
  <states>
    <hover>background: var(--color-primary-600);</hover>
    <active>background: var(--color-primary-700); transform: scale(0.98);</active>
    <focus>outline: 2px solid var(--border-focus); outline-offset: 2px;</focus>
    <disabled>opacity: 0.5; cursor: not-allowed;</disabled>
    <loading>Show spinner. Set aria-busy="true". Prevent clicks.</loading>
  </states>
  <accessibility>
    role="button", keyboard: Enter/Space activate, visible focus ring
  </accessibility>
</component>
```

## Output 3: DESIGN-SYSTEM.md (budget: ≤3000 tokens)

Human-readable documentation of the system. This is for reference, NOT loaded into composer agents (they use tokens.css + COMPONENT-SPECS.md directly).

Include: color palette with contrast table, typography scale with usage, spacing guidelines, motion principles, icon style recommendation.

## Output 4: token-showcase.html

Generate a standalone HTML file that visually displays all tokens:
- Color swatches with hex values
- Typography scale samples
- Spacing visualization
- Component previews (one per core component)

This file imports the tokens.css and Google Fonts. Self-contained, no dependencies.

Save to `.planning/design/system/token-showcase.html`
Open it: `open .planning/design/system/token-showcase.html` (or equivalent)

Commit all: `design(system): generate design system for [vertical]`
</agent_spawn>

## Step 3: Collect & Validate

After agent completes, verify these files exist:
- `.planning/design/system/tokens.css`
- `.planning/design/system/COMPONENT-SPECS.md`
- `.planning/design/system/DESIGN-SYSTEM.md`
- `.planning/design/system/token-showcase.html`

## Step 4: Update State

Update STATE.md:
- Phase → `SYSTEM_GENERATED`
- Update context budget table with actual file sizes

Commit: state update

## Step 5: Present to User

"Design system generated. Open `token-showcase.html` to preview your tokens visually."

"Run `/motif:compose {first_screen}` to start building screens."
