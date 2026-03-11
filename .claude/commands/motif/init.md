---
description: Initialize a new Motif project with domain-aware design intelligence. Supports --auto mode for quick starts. Auto-detects brownfield projects.
allowed-tools: Read, Write, Bash(node:*), Bash(mkdir:*), Bash(git add:*), Bash(git commit:*)
argument-hint: [--auto --vertical X --stack Y --theme Z]
---

# /motif:init — Project Initialization

You are the Motif initializer. This command runs in the MAIN context (not a subagent) because it requires user interaction.

<gate_check>
If `.planning/design/PROJECT.md` already exists, stop: "Project already initialized. Delete `.planning/design/` to restart, or run `/motif:research` to continue."
</gate_check>

## Brownfield Detection

Before starting the interview, classify the workspace as brownfield or greenfield using framework signatures, not just `package.json` plus source folders.

1. Check for brownfield framework signals:
   - Next.js signals: `next` dependency and/or `next.config.*`
   - Vite signals: `vite` dependency, `@vitejs/plugin-react`, and/or `vite.config.*`
   - Expo signals: `expo` or `react-native` dependency plus `app.json`/`app.config.js`/`app.config.ts` (including root-level Expo apps)
   - React-only signal: React exists but no clear supported framework signature
2. If at least one signal exists:
   - Run `node scripts/project-scanner.js [projectRoot]`
   - Read `.planning/design/PROJECT-SCAN.md` and `.planning/design/CONVENTIONS.md`
   - Use the scanner's `## Brownfield Adoption Signal` section to drive behavior:
     - `Action: auto-adopt` + `Platform: web-nextjs|web-vite|mobile-expo` -> adopt existing project automatically
     - `Action: confirm` -> ask for confirmation before adopting (ambiguous React or conflicting signatures)
     - `Action: greenfield` -> continue as greenfield
3. If no framework signals exist:
   - Treat as greenfield and skip brownfield scan/adoption.

When scan results exist, adapt the interview and decision flow:
- Pre-fill detected vertical from project type (e.g., fintech if financial dependencies detected)
- Pre-fill detected stack from framework detection
- If `Action: auto-adopt`:
  - Map detected platform exactly: Next.js -> `web-nextjs`, Vite -> `web-vite`, Expo -> `mobile-expo`
  - Tell the user Motif detected the platform and will adopt the existing project
  - Skip platform recommendation and skip greenfield scaffolding later in the workflow
- If `Action: confirm`:
  - Present a confirmation prompt instead of guessing
  - If scan data is stale or unclear, tell the user to run `/motif:scan` again before adopting
  - Continue as greenfield only if user declines adoption
- If user explicitly overrides a clear auto-adopt result:
  - Ask for confirmation with a warning that overriding may ignore existing project structure
  - Continue only after explicit confirmation

Persistence rule:
- The selected/adopted platform must be written to project outputs exactly like greenfield mode so downstream workflows use one source of truth.
- `init` decides adopt vs scaffold; scaffold execution still happens in `generate-system`.

## Auto Mode

If `$ARGUMENTS` contains `--auto` OR contains flags like `--vertical`, `--stack`, `--theme`:
- Parse flags: `--vertical [name]`, `--stack [react|next|vue|html]`, `--theme [light|dark|both]`, `--density [compact|comfortable|spacious]`, `--platform [web-nextjs|web-vite|web-static|mobile-expo]`
- Skip the interview
- Use sensible defaults for anything not specified
- Default platform to `web-static` if `--platform` is not specified in auto mode
- Generate files immediately

Example: `/motif:init --auto --vertical fintech --stack react --theme dark --platform web-nextjs`

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
- What platform are you targeting?
  - a) Web app with Next.js (SSR, App Router)
  - b) Web app with Vite + React (SPA)
  - c) Static HTML landing page
  - d) Mobile app with Expo / React Native

  Map selection to platform identifier: a -> web-nextjs, b -> web-vite, c -> web-static, d -> mobile-expo

- Technical stack? (React/Next.js/Vue/HTML — or whatever you prefer)
- What screens do you need for v1? (list them)
- Any screen that's especially complex or critical?

### Vertical Detection

After Round 1, internally classify the vertical:
- **fintech**: money, payments, banking, crypto, trading, budgeting, lending, insurance
- **health**: wellness, fitness, mental health, telehealth, medical, pharmacy
- **saas**: productivity, project management, CRM, analytics, admin, collaboration
- **ecommerce**: retail, subscriptions, delivery, bookings
- **social**: messaging, community, content creation, dating, networking
- **education**: e-learning, courses, tutoring, assessment, LMS
- **devtools**: developer tools, CLI, SDK, API platform, code editor, IDE, debugging, monitoring, observability
- **media**: streaming, news, podcasts, publishing
- **marketplace**: two-sided platforms, gig economy, real estate, jobs

Don't ask the user what their vertical is. TELL them what you detected and why. Be opinionated.

### Framework Recommendation

After vertical detection, internally assess the best platform fit using keyword matching on the user's Round 1 answer ("What are you building?"). Apply these rules:

| Keywords in description | Recommended platform | Reasoning |
|---|---|---|
| dashboard, admin panel, CRM, analytics, portfolio, blog, e-commerce store, marketplace, saas | `web-nextjs` | SSR benefits, SEO, App Router for complex routing |
| landing page, portfolio site, brochure site, one-page | `web-static` | Simplest, fastest for static content |
| single page app, SPA, tool, internal tool, calculator, widget | `web-vite` | Client-side rendering, fast dev iteration |
| mobile app, iOS, Android, cross-platform mobile, native app | `mobile-expo` | React Native for native mobile experience |
| ambiguous or unclear | `web-nextjs` | Most versatile default |

**Presentation:** At the START of Round 4, BEFORE showing the platform options, present the recommendation:

> "Based on what you're building, I'd recommend **{label}** ({reasoning from table}). Want to go with that, or prefer something else?"

Then show the platform options (a/b/c/d) so the user can accept or override.

- If the user accepts the recommendation, skip the platform question -- the answer is already determined.
- If the user says they want something else, show the full platform options and use their explicit choice.

**Brownfield override:** If brownfield detection already identified a clear platform from scan adoption signals, that detection takes priority over keyword matching. The brownfield-detected platform is pre-filled and the recommendation step is skipped. If the user insists on a different platform, warn about override risk and require explicit confirmation before continuing.

### Round 4 Post-Platform Note

After platform selection is finalized (whether by recommendation acceptance, override, or brownfield detection), if the platform is `web-nextjs`, `web-vite`, or `mobile-expo`, tell the user:

> "After design system generation, I'll scaffold your project with the right tooling."

This primes the user for the downstream scaffolding workflow.

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

## Platform
[platform identifier: web-nextjs | web-vite | web-static | mobile-expo]

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

## Platform
[platform identifier: web-nextjs | web-vite | web-static | mobile-expo]

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

### Persist Platform to STATE.md

After creating STATE.md, persist the platform field via the state management script:

```bash
node .claude/get-motif/scripts/motif-state.js update platform {platform-id}
```

Where `{platform-id}` is one of: `web-nextjs`, `web-vite`, `web-static`, `mobile-expo`.

This ensures the platform field survives `/clear` because it is written to STATE.md frontmatter on disk.

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
