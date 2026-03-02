---
description: Initialize a new Motif project with domain-aware design intelligence. Supports --auto mode for quick starts.
allowed-tools: Read, Write, Bash(mkdir:*), Bash(git add:*), Bash(git commit:*)
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

Ask questions in **4 rounds**, 2-3 questions per round. Adapt based on answers.

**Round 1 — What & Who:**
- What are you building? (one sentence)
- Who uses it? (describe the person, not demographics)
- What device do they reach for? (phone/laptop/both equally)

**Round 2 — Design Inputs:**
- Do you have existing design assets?
  - a) Starting fresh — no colors, fonts, or designs yet
  - b) I have brand colors and/or fonts to use
  - c) I have screenshots or products I want to reference
  - d) I have a Figma file or complete design to implement
  - e) Some combination

If (b): Ask for specific hex values, font names. These become LOCKED constraints.
If (c): Ask user to share screenshots or name the products. Ask: "What specifically do you love about it — the colors? The spacing? The overall mood?" Save image paths to `.planning/design/references/`.
If (d): Ask for Figma URL or ask user to share screenshots of key screens. Ask fidelity: "Should I implement this pixel-perfect, capture the spirit and extend it, or just extract the color/font system?"
If (e): Combine the above flows.

**Round 3 — Feel & Differentiation:**
- Name 1-2 products whose UI you admire (if not already covered in Round 2)
- What should feel DIFFERENT about yours vs those?

Then present the differentiation seed (adapted from design-inputs.md):
"Most [vertical] products feel [center of gravity]. Where does yours sit?"
- Personality: Corporate ←→ Bold/rebellious
- Temperature: Cool/precise ←→ Warm/human
- Formality: Professional/serious ←→ Casual/approachable

If the user doesn't want to rate all axes, infer from their descriptions. Always capture at least personality, temperature, and formality.

**Round 4 — Scope & Stack:**
- Technical stack? (React/Next.js/Vue/HTML — or whatever you prefer)
- What screens do you need for v1? (list them)
- Any screen that's especially complex or critical?

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

### Inject CLAUDE.md Rules

Check if `.claude/CLAUDE.md` or `CLAUDE.md` exists in the project root.
- If it exists: check if Motif rules already present (search for "Motif"). If not, append the snippet from `templates/CLAUDE-MD-SNIPPET.md`.
- If it doesn't exist: create it with the Motif snippet.

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
