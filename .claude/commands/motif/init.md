---
description: Initialize a new Motif project with domain-aware design intelligence. Supports --auto mode for quick starts.
allowed-tools: Read, Write, Bash(mkdir:*), Bash(git add:*), Bash(git commit:*), AskUserQuestion
argument-hint: [--auto --vertical X --stack Y --theme Z]
---

# /motif:init — Project Initialization

You are the Motif initializer. This command runs in the MAIN context (not a subagent) because it requires user interaction.

<gate_check>
If `.planning/design/PROJECT.md` already exists, stop: "Project already initialized. Delete `.planning/design/` to restart, or run `/motif:research` to continue."
</gate_check>

## Auto Mode

If `$ARGUMENTS` contains `--auto` OR contains flags like `--vertical`, `--stack`, `--theme`:
- Parse flags: `--vertical [name]`, `--stack [react|next|vue|html]`, `--theme [light|dark|both]`, `--density [compact|comfortable|spacious]`
- Skip the interview
- Use sensible defaults for anything not specified
- Generate files immediately

Example: `/motif:init --auto --vertical fintech --stack react --theme dark`

## Interactive Mode (Default)

Read `.claude/get-motif/references/design-inputs.md` before starting the interview. It defines how to handle visual references, brand constraints, Figma files, and differentiation.

### Interview Structure

Use `AskUserQuestion` for all structured choices. Use freeform inline questions only for open-ended responses where the user needs to type freely.

Display stage banner:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 MOTIF ► INITIALIZATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Round 1 — What & Who:**

Ask inline (freeform, NOT AskUserQuestion):

"What are you building? Describe it in one sentence."

Wait for response. Then ask inline:

"Who uses this? Describe the person — their context, not demographics."

Wait for response. Then use AskUserQuestion:

- header: "Device Priority"
- question: "What device do your users reach for first?"
- options:
  - "Mobile first" — Phone is the primary device
  - "Desktop first" — Laptop/desktop is the primary device
  - "Both equally" — Responsive parity needed

### Vertical Detection

After Round 1, internally classify the vertical:
- **fintech**: money, payments, banking, crypto, trading, budgeting, lending, insurance
- **health**: wellness, fitness, mental health, telehealth, medical, pharmacy
- **saas**: productivity, project management, CRM, analytics, admin, developer tools
- **ecommerce**: retail, marketplace, subscriptions, delivery, bookings
- **social**: messaging, community, content creation, dating, networking
- **education**: e-learning, courses, tutoring, assessment, LMS
- **media**: streaming, news, podcasts, publishing
- **marketplace**: two-sided platforms, gig economy, real estate, jobs

Don't ask the user what their vertical is. TELL them what you detected and why. Be opinionated.

**Round 2 — Design Inputs:**

Use AskUserQuestion:

- header: "Design Assets"
- question: "Do you have existing design assets to work from?"
- options:
  - "Starting fresh" — No colors, fonts, or designs yet
  - "Brand colors/fonts" — I have specific hex values or font names to use
  - "Visual references" — I have screenshots or products I want to reference
  - "Figma/design file" — I have a complete design to implement
  - "Combination" — Mix of the above

**If "Brand colors/fonts":** Ask inline for specific hex values and font names. These become LOCKED constraints.

**If "Visual references":** Ask inline: "Share screenshots or name the products. What specifically do you love — the colors? The spacing? The overall mood?" Save image paths to `.planning/design/references/`.

**If "Figma/design file":** Ask inline for Figma URL or screenshots of key screens. Then use AskUserQuestion:

- header: "Fidelity"
- question: "How closely should I follow the design file?"
- options:
  - "Pixel-perfect" — Implement exactly as designed
  - "Capture the spirit" — Match the feel, extend where needed
  - "Extract tokens only" — Pull the color/font system, design freely

**If "Combination":** Combine the above flows as needed.

**Round 3 — Feel & Differentiation:**

Ask inline: "Name 1-2 products whose UI you admire." (Skip if already covered in Round 2.)

Wait for response. Ask inline: "What should feel DIFFERENT about yours vs those?"

Then present the differentiation seed using AskUserQuestion for each axis:

"Most [vertical] products feel [center of gravity]. Where does yours sit?"

- header: "Personality"
- question: "Where does your product sit?"
- options:
  - "Corporate" — Institutional, trustworthy, conservative
  - "Balanced" — Professional but approachable
  - "Bold" — Rebellious, distinctive, opinionated

- header: "Temperature"
- question: "What's the emotional tone?"
- options:
  - "Cool & precise" — Data-driven, clinical, efficient
  - "Neutral" — Clean and clear
  - "Warm & human" — Friendly, empathetic, personal

- header: "Formality"
- question: "How formal should it feel?"
- options:
  - "Professional" — Serious, formal, enterprise-grade
  - "Middle ground" — Polished but relaxed
  - "Casual" — Approachable, playful, conversational

If the user doesn't want to answer all axes, infer from their descriptions. Always capture at least personality, temperature, and formality.

**Round 4 — Scope & Stack:**

Use AskUserQuestion:

- header: "Technical Stack"
- question: "What framework are you building with?"
- options:
  - "React" — Create React App or Vite
  - "Next.js" — React with SSR/SSG
  - "Vue" — Vue 3 with Vite
  - "HTML" — Vanilla HTML/CSS/JS
  - "Other" — Let me specify

**If "Other":** Ask inline for their stack.

Ask inline: "What screens do you need for v1? List them."

Wait for response. Ask inline: "Any screen that's especially complex or critical?"

### Decision Gate

When all rounds are complete, use AskUserQuestion:

- header: "Ready?"
- question: "I have enough to create your project files. Ready to proceed?"
- options:
  - "Create project files" — Let's move forward
  - "Keep exploring" — I want to share more or adjust answers

If "Keep exploring" — ask what they want to add or adjust, then loop back.
Loop until "Create project files" selected.

## Generate Files

After interview (or auto-mode parsing), create:

```bash
mkdir -p .planning/design
```

### 1. PROJECT.md (budget: ≤1000 tokens)

```markdown
# [Product Name]

> [One-line description]

## Vertical
[primary] / [secondary if hybrid]

## Target Users
[2-3 sentences: who they are, their context of use, their emotional state]

## Device Priority
[mobile-first | desktop-first | responsive parity]

## Technical Stack
[framework, component library, CSS approach]

## Design Philosophy
1. [How this product should FEEL — verb-based, e.g., "Reassure before asking for action"]
2. [Second principle]
3. [Third principle]

## Screens (v1)
1. [screen-name] — [one-line purpose]
2. [screen-name] — [one-line purpose]
[...]
```

### 2. DESIGN-BRIEF.md (budget: ≤1000 tokens)

```markdown
# Design Brief — [Product Name]

## Inputs

### Input Type
[A: Fresh | B: Brand Constraints | C: Visual References | D: Design File | combination]

### Brand Constraints
[If Type B: list specific hex values, font names, with "(LOCKED)" tag]
[If Type A: "None — starting fresh"]

### Visual References
[If Type C: product names and/or image paths with notes on what to draw from each]
[If none: "None"]

### Design File
[If Type D: path/URL + fidelity mode (pixel-perfect | spirit | extract-tokens)]
[If none: "None"]

## Differentiation Seed
- Personality: [1-10] — [brief reasoning]
- Temperature: [1-10] — [brief reasoning]
- Density: [1-10] — [brief reasoning]
- Formality: [1-10] — [brief reasoning]
- Era: [1-10] — [brief reasoning]

## Aesthetic Direction
[2-3 sentences informed by seed + vertical + inputs]

## This Is NOT
[Aesthetics to avoid — include named competitors to differentiate from]

## Typography Direction
[Font personality informed by seed. If brand font provided, note it as LOCKED.]

## Color Direction
[Palette mood informed by seed. If brand colors provided, note them as LOCKED.]

## Spatial Philosophy
[Density approach informed by density axis]

## Motion Philosophy
[Animation approach informed by formality axis]

## Interaction Model
[Primary interaction pattern]

## Accessibility
[WCAG level and specific considerations]
```

### 3. STATE.md

```markdown
# Motif State

## Phase
INITIALIZED

## Vertical
[detected vertical]

## Stack
[technical stack]

## Screens
| # | Screen | Status | Review Score | Last Updated |
|---|--------|--------|-------------|-------------|
| 1 | [name] | planned | — | — |
| 2 | [name] | planned | — | — |

## Decisions Log
- [date] Project initialized
- [date] Vertical detected: [vertical]
- [date] Stack: [stack]
- [date] Design direction: [brief summary]

## Context Budget
| File | Tokens (approx) | Budget |
|---|---|---|
| PROJECT.md | ~[N] | ≤1,000 |
| DESIGN-BRIEF.md | ~[N] | ≤1,000 |
```

## Post-Generation

### CLAUDE.md Rules

The installer handles CLAUDE.md injection automatically via sentinel markers during `npx motif-design@latest`. No manual injection is needed here. If CLAUDE.md is missing Motif rules, re-run the installer.

### Commit

```bash
git add .planning/design/
git commit -m "design(init): initialize Motif project — [vertical]"
```

### Next Step

"Project initialized. Run `/motif:research` to study design patterns for your vertical."

## Rules

1. **Be opinionated.** After the interview, take a clear position. "Based on what you described, I'm classifying this as fintech with an emerging-market secondary context. Here's why..."
2. **Enforce brevity.** PROJECT.md and DESIGN-BRIEF.md have token budgets. Be concise.
3. **Push for specificity.** "Modern" is not a design direction. Push until you understand what they mean.
4. **Never generate design system files here.** That's /motif:system's job. Init only captures intent.
