# Design Forge — Design Input System

This reference defines how Design Forge handles visual inputs, brand constraints, and design differentiation. Every workflow that generates visual decisions MUST consult this file.

---

## 1. Input Types

Design Forge accepts four types of design input. They're detected during `/forge:init` and stored in `DESIGN-BRIEF.md` under a structured `## Inputs` section.

### Type A: Starting Fresh (No Inputs)
User has no existing brand, no colors, no references. Design Forge makes all visual decisions based on vertical research + a differentiation algorithm.

### Type B: Brand Constraints
User provides specific values: "My brand color is #1A73E8" or "We use Poppins for our logo." These are hard constraints — the system builds AROUND them, never overrides them.

### Type C: Visual References
User provides screenshots, URLs, or product names as inspiration: "I want it to feel like Linear but warmer" or "Here's a screenshot of a UI I love." These are soft constraints — they inform direction but don't lock specific values.

### Type D: Figma/Design File
User has a Figma file, screenshot of a complete design, or an existing UI to implement faithfully. This is an implementation task — Design Forge extracts the design system from the file rather than generating one.

---

## 2. Detection During /forge:init

The init interview MUST include this question (Round 2):

```
Do you have any existing design assets?

a) Starting fresh — no colors, fonts, or designs yet
b) I have brand colors and/or fonts I want to use
c) I have screenshots or products I want to reference for inspiration
d) I have a Figma file or complete design to implement
e) Some combination of the above
```

Based on the answer, the DESIGN-BRIEF.md gets a structured Inputs section:

```markdown
## Inputs

### Input Type
[A: Fresh | B: Brand Constraints | C: Visual References | D: Design File | combination]

### Brand Constraints (if Type B)
- Primary color: #[hex] (user-provided, LOCKED)
- Secondary color: #[hex] (user-provided, LOCKED)
- Font: [name] (user-provided, LOCKED)
- Logo: [description or path]
- Other: [any additional brand rules]

### Visual References (if Type C)
- Reference 1: [product name or screenshot path]
  - What to take from it: [specific aspects — "the spacing", "the color warmth", "the navigation pattern"]
  - What to ignore: [what NOT to copy]
- Reference 2: [...]

### Design File (if Type D)
- Source: [Figma URL | screenshot path | existing codebase path]
- Fidelity: [pixel-perfect | spirit-of-the-design | extract-tokens-only]
- Coverage: [complete design | partial — which screens exist | tokens only]

### Differentiation Seed
[See Section 5 — always present, even for Type A]
```

---

## 3. How Brand Constraints Flow Through the System

When the user provides specific colors or fonts, they become LOCKED constraints that cascade through every downstream step.

### In /forge:research
Research agents are told: "The brand's primary color is #[hex]. Research must consider how this color works within [vertical] conventions. Do NOT suggest replacing it — suggest how to complement it."

### In /forge:system (Color Algorithm Override)

When brand colors are provided, the Color Decision Algorithm changes:

```
IF brand_primary_color PROVIDED:
  1. Accept the user's color as --color-primary-500 (LOCKED)
  2. Generate the primary scale (50-950) by adjusting lightness/saturation around the provided value
     - 50: lighten to ~97% luminance
     - 100-400: interpolate between 50 and 500
     - 500: USER'S EXACT VALUE (never modify)
     - 600-900: darken progressively
     - 950: darken to ~10% luminance
  3. Check if the user's color works for the vertical:
     - If yes: proceed normally
     - If potentially problematic (e.g., bright red for fintech): NOTE in tokens.css comment but DO NOT override. 
       Example: "/* Primary: #E53E3E — user-specified. Note: warm red is unconventional for fintech; 
       we've paired with cool neutral surfaces to maintain trust. */"
  4. Choose surface and semantic colors that COMPLEMENT the user's primary
  5. Ensure all contrast pairs pass WCAG AA

IF brand_font PROVIDED:
  1. Use as --font-display or --font-body (user specifies which)
  2. Choose complementary fonts for the other roles
  3. If the brand font is Inter/Roboto/system-default, STILL USE IT — the user chose it intentionally
     NOTE: The "never use Inter" rule applies only when Design Forge is choosing. User choice overrides.
  4. Ensure the brand font is available (Google Fonts, or user provides files)

IF brand_secondary_color PROVIDED:
  1. Use as accent/secondary color
  2. Derive the accent scale from it
  3. Ensure sufficient contrast between primary and secondary
```

### In /forge:compose
Composer agents receive the brand constraints through tokens.css (which already encodes them). No additional handling needed — the token system IS the constraint carrier.

### In /forge:review
Reviewer checks: "Are brand-constrained tokens used correctly? Is the user's primary color actually showing up as the primary action color, or did the composer drift?"

---

## 4. How Visual References Flow Through the System

### Handling Screenshots/Images

When the user provides a screenshot or image:

1. **During /forge:init**: Save the image path to DESIGN-BRIEF.md under Inputs
2. **During /forge:research**: The visual language research agent is given the image and told:
   ```
   The user provided this screenshot as a reference. Analyze:
   - Color palette (extract approximate hex values for primary, secondary, surface, text)
   - Typography style (serif/sans/mono, weight, density)
   - Spacing density (compact/comfortable/spacious)
   - Border radius style (sharp/medium/rounded)
   - Shadow style (flat/subtle/layered)
   - Layout pattern (sidebar/tab/top-nav, grid/list/card)
   - Overall mood (clinical/warm/playful/dark/minimal)
   
   Output a structured extraction in the visual-language research file.
   These become SOFT CONSTRAINTS — inform the design direction, don't copy pixel-for-pixel.
   ```
3. **During /forge:system**: The system generator receives the extracted analysis as input alongside the research. It uses the reference's characteristics as starting points, then adapts for the project's vertical and differentiation seed.

### Handling Product Name References

When the user says "I want it to feel like Linear" or "Stripe's checkout is beautiful":

1. **During /forge:research**: The competitor audit agent is told to prioritize these products in its analysis. Extract specific design decisions from them.
2. **During /forge:system**: The "Reference Products" section of DESIGN-RESEARCH.md carries these forward with specific aspects to draw from.

### Handling Figma Files

This is the most complex input type. Three sub-modes:

#### D1: Pixel-Perfect Implementation
User has a complete Figma design and wants it built exactly.

```
Workflow changes:
- /forge:research → SKIP (design decisions are already made)
- /forge:system → EXTRACT mode:
  - Analyze the Figma file/screenshots
  - Extract: color palette, typography, spacing, radii, shadows
  - Generate tokens.css that matches the design, not the vertical conventions
  - Generate COMPONENT-SPECS.md from the components visible in the design
- /forge:compose → IMPLEMENT mode:
  - Reference the design file alongside tokens + specs
  - Goal is fidelity to the design, not vertical conventions
- /forge:review → Checks against the Figma, not against heuristics
  - "Does this match the design?" replaces "Does this follow vertical patterns?"
```

#### D2: Spirit of the Design
User has a partial Figma design or mood board and wants the system to extend it.

```
Workflow changes:
- /forge:research → RUNS but researcher is told "The user has an existing design direction. 
  Research should validate and extend it, not replace it."
- /forge:system → HYBRID mode:
  - Extract tokens from the design file
  - Fill gaps from vertical research (e.g., design shows colors but no error states → derive from vertical)
  - Generate missing component specs from vertical conventions
- /forge:compose → Normal but with design file as additional reference
- /forge:review → Normal (heuristics + vertical patterns apply where the design didn't specify)
```

#### D3: Extract Tokens Only
User has a design they like and wants the token system extracted, but will compose screens from scratch.

```
Workflow changes:
- /forge:system → EXTRACT mode only
- Everything else → Normal flow
```

### Figma MCP Integration (When Available)

If the user has Figma MCP connected:
```
1. /forge:init asks for the Figma file URL
2. Use Figma MCP to fetch:
   - Color styles → map to token palette
   - Text styles → map to typography tokens
   - Spacing patterns → infer spacing scale
   - Component instances → generate COMPONENT-SPECS.md
3. Generate tokens.css from the extracted Figma data
4. User can modify tokens and compose screens that faithfully implement the Figma design
```

Without Figma MCP (screenshot-based):
```
1. User provides screenshots of key screens
2. System analyzes screenshots visually during /forge:system
3. Extracts approximate values (less precise than MCP, but functional)
4. Notes uncertainty: "Color extracted approximately as #2563EB — verify against your design file"
```

---

## 5. Differentiation System

This is the solution to "every fintech app looks the same." The differentiation system ensures that even when two products share a vertical, their design systems diverge.

### The Differentiation Seed

Every project gets a differentiation seed during /forge:init. It's a set of attributes that push the design away from the vertical's center of gravity.

```markdown
### Differentiation Seed
- **Personality axis:** [corporate ←→ rebellious] — position: [1-10]
- **Temperature axis:** [cool/clinical ←→ warm/human] — position: [1-10]  
- **Density axis:** [spacious/breathing ←→ dense/information-rich] — position: [1-10]
- **Formality axis:** [buttoned-up ←→ casual] — position: [1-10]
- **Era axis:** [timeless/classic ←→ cutting-edge/trendy] — position: [1-10]
```

### How the Seed is Determined

During init, after detecting the vertical, ask:

```
I've identified this as a [vertical] product. Most [vertical] products feel [description of the center of gravity].

Where does YOUR product sit on these spectrums?

1. Personality: Corporate and institutional ←→ Bold and rebellious
   [Most fintech: 3-4. Crypto/neobanks: 6-8]
   
2. Temperature: Cool and precise ←→ Warm and human
   [Most fintech: 2-4. Personal finance: 5-7]
   
3. Density: Spacious and calm ←→ Dense and data-rich
   [Most fintech: 5-6. Trading platforms: 8-9]
   
4. Formality: Professional and serious ←→ Casual and approachable
   [Most fintech: 2-4. Gen-Z neobanks: 6-8]

5. Era: Timeless and proven ←→ Cutting-edge and experimental
   [Most fintech: 3-5. Crypto/DeFi: 7-9]
```

If the user doesn't want to answer all of these, detect from context:
- "Crypto payments for Nigerian users" → personality: 7, temperature: 6, density: 5, formality: 5, era: 8
- "Enterprise treasury management" → personality: 2, temperature: 3, density: 7, formality: 2, era: 4

### How the Seed Affects Color Selection

The Color Decision Algorithm in `/forge:system` uses the seed to SHIFT the hue, saturation, and approach:

```
Fintech base: HSL 170-220° (blue-teal)

Adjustments based on seed:
- Personality ≥ 7 (rebellious): shift hue toward unconventional ranges
  → Consider: 260-290° (violet/purple), 30-50° (amber/gold), 330-350° (magenta)
  → Reasoning: "This is a crypto product targeting young Nigerians. The teal-blue 
    convention signals traditional banking — the opposite of the product's positioning."
    
- Temperature ≥ 6 (warm): shift toward warm hues, increase saturation
  → Pull hue toward 0-60° or 300-360° range
  → Warmer surface colors (cream/warm gray instead of cool gray)
  
- Formality ≥ 7 (casual): allow more saturated, playful palettes
  → Higher saturation primary
  → Consider accent colors
  → More rounded radii
  
- Era ≥ 7 (cutting-edge): allow non-traditional palettes
  → Dark-mode-first consideration
  → Gradient accents (subtle, not AI-slop gradients)
  → Monochrome + single vibrant accent

COMBINATION EXAMPLE:
"CryptoPay" — fintech, personality:7, temperature:6, era:8

Instead of the default fintech teal (#10B981):
→ Primary: HSL 270° 65% 55% → #7C3AED (violet — signals crypto/web3 identity)
→ Warm surfaces: #FFFBEB (warm cream) instead of #F8FAFC (cool slate)  
→ Dark mode primary: use lighter violet on near-black with warm undertone
→ Reasoning captured in tokens.css comments

vs. "First National Mobile Banking" — fintech, personality:2, temperature:3, era:3
→ Primary: HSL 210° 55% 45% → #2563A8 (deep institutional blue)
→ Cool surfaces: #F8FAFC (standard cool gray)
→ Conservative radii, minimal shadow, no gradients
```

### How the Seed Affects Typography

```
Fintech base: geometric sans-serif (DM Sans, Plus Jakarta Sans)

Adjustments:
- Personality ≥ 7: consider more distinctive display fonts
  → Clash Display, Syne, Space Grotesk — fonts with personality
  → Still pair with a readable body font
  
- Formality ≤ 4 (casual): rounder, friendlier fonts
  → Outfit, Nunito Sans, Quicksand for body
  
- Era ≥ 7: consider newer/trending fonts
  → Geist, General Sans, Satoshi — fonts released in last 2 years
  → Avoid: fonts that have become overused in the AI/startup space
```

### How the Seed Affects Other Decisions

```
Border Radius:
- Formality 1-3: sm=2, md=4, lg=8 (sharp, institutional)
- Formality 4-6: sm=4, md=8, lg=12 (balanced)
- Formality 7-10: sm=6, md=12, lg=16+ (rounded, friendly)

Shadows:
- Temperature 1-4: cool shadows (blue-tinted, e.g., rgba(0,0,30,0.08))
- Temperature 5-7: neutral shadows
- Temperature 8-10: warm shadows (amber-tinted, e.g., rgba(30,15,0,0.06))

Motion:
- Formality 1-4: minimal, functional transitions only
- Formality 5-7: subtle micro-interactions
- Formality 8-10: expressive animations, playful feedback
```

### Anti-Convergence Rules

Even with the same vertical and similar seeds, two projects must not converge. The system ensures this by:

1. **Never defaulting to the first option in any list.** If the font recommendation list is [DM Sans, Plus Jakarta Sans, Satoshi], the system doesn't always pick DM Sans. It considers the full seed and makes a justified selection.

2. **Requiring unique reasoning in every tokens.css.** The comment explaining each choice must reference THIS project's specific context, not generic advice. If two projects can't be distinguished by their token comments, the differentiation failed.

3. **Hue randomization within ranges.** Instead of "fintech → 180°", it's "fintech with seed personality:7 → 250-290° range → randomly select within range, then fine-tune." The range narrows the possibilities; the seed + project context picks the specific value.

4. **Explicit anti-clone check.** During /forge:system, if the user mentioned competitor products during init, the system checks: "Would my generated palette be confused with [competitor]? If yes, shift."

---

## 6. Updated DESIGN-BRIEF.md Format

The brief now includes structured input and differentiation data:

```markdown
# Design Brief — [Product Name]

## Inputs
### Input Type
[A/B/C/D/combination]

### Brand Constraints
[Specific locked values, or "none — starting fresh"]

### Visual References  
[Products, screenshots, or "none"]

### Design File
[Figma URL, screenshot paths, or "none"]

## Differentiation Seed
- Personality: [1-10] — [reasoning]
- Temperature: [1-10] — [reasoning]
- Density: [1-10] — [reasoning]
- Formality: [1-10] — [reasoning]
- Era: [1-10] — [reasoning]

## Aesthetic Direction
[Informed by seed + vertical + inputs]

## This Is NOT
[Explicit anti-patterns INCLUDING named competitors to differentiate from]

## Typography Direction
[Informed by seed]

## Color Direction
[Informed by seed + brand constraints if any]

## Spatial Philosophy
[Informed by density axis]

## Motion Philosophy
[Informed by formality axis]

## Interaction Model
[From research]

## Accessibility
[WCAG level + specific needs]
```

---

## 7. Summary: How Each Input Type Changes the Workflow

| Step | Type A (Fresh) | Type B (Brand) | Type C (References) | Type D (Figma) |
|---|---|---|---|---|
| `/forge:init` | Full interview + seed | Interview + lock colors/fonts | Interview + save refs | Interview + set fidelity mode |
| `/forge:research` | Full research | Research considers brand | Refs prioritized in audit | Skip (D1) or validate (D2) |
| `/forge:system` | Generate from seed + research | Build around locked values | Use refs as starting points | Extract from design file |
| `/forge:compose` | Normal | Normal (tokens carry constraints) | Normal (tokens carry direction) | Implement against design |
| `/forge:review` | Full 4-lens | Full + brand compliance check | Full 4-lens | Fidelity check (D1) or full (D2) |
