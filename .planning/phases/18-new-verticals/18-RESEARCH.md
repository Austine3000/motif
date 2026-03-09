# Phase 18: New Verticals - Research

**Researched:** 2026-03-09
**Domain:** Motif vertical reference authoring (Social, Education, Marketplace, DevTools)
**Confidence:** HIGH

## Summary

Phase 18 is a pure content authoring phase. The existing 4 verticals (ecommerce, fintech, health, saas) define a precise template that new verticals must replicate. Each vertical file is a self-contained markdown reference (~300 lines) containing domain-specific design intelligence: palettes, typography, spacing, components, interaction patterns, icon vocabularies, and accessibility guidance. The files are loaded by path convention (`.claude/get-motif/references/verticals/{vertical}.md`) with no registry -- dropping a file into the directory is sufficient for discovery.

Beyond the 4 vertical files themselves, there are 3 integration points that require updates: (1) the Domain Affinity Matrix in `icon-libraries.md` which maps verticals to primary/secondary icon libraries, (2) the `VERTICAL_COMPONENTS` object in `gap-analyzer.js` which lists vertical-specific components for brownfield gap analysis, and (3) the vertical detection list in `init.md` which already includes "social", "education", and "marketplace" as keywords but lacks "devtools" as a distinct entry (it is currently folded into "saas" with "developer tools").

**Primary recommendation:** Author 4 vertical files following the exact template structure of existing verticals, then update the 3 integration points. No architectural changes needed -- this is entirely additive.

## Existing Vertical Template Structure

### Exact Section Headings (from all 4 existing verticals)

Every vertical file MUST contain these sections in this order:

```
# [Vertical Name] Design Intelligence
## Core Design Principle
## Navigation Patterns
  ### Standard Models
  ### Vertical-Specific Rules
## Color System
  ### Palette A: [Name] ([Mood])
  ### Palette B: [Name]
  ### Semantic Colors
  ### Color Anti-Patterns
## Typography
  ### Pairing A: [Name]
  ### Pairing B: [Name]
  ### Data & Mono (if applicable)
  ### Type Scale
  ### Typography Rules
  ### Typography Anti-Patterns
## Spacing & Density
  ### Recommended Density: [Level]
  ### Concrete Values
## Component Specifications
  ### [Component 1] (XML format)
  ### [Component 2] (XML format)
  ### [Component 3] (XML format)
## Interaction Patterns
  ### Core Flows
  ### States (Loading, Empty, Error)
  ### Motion (Appropriate, Inappropriate)
## Accessibility Specifics
## Border Radius
## Shadow Style
## Icon Vocabulary (with HTML comment for verification source)
  ### Navigation (always present)
  ### [Domain-specific category]
  ### Status & Feedback (always present)
  ### Actions (always present)
## [Vertical]-Specific Additions
```

### Key Conventions Observed Across All 4 Verticals

**Confidence: HIGH** (verified by reading all 4 files)

1. **Core Design Principle:** Bold one-liner + 2-3 sentence expansion. Pattern: "**[Value] is the product.**"
2. **Color palettes:** Always 2 palettes (A and B) with full 50-900 primary scale + surface/text tokens. Both light and dark mode hex values. Contrast ratios annotated (e.g., "15.3:1 AAA").
3. **Semantic colors:** 4 semantics (Success, Error, Warning, Info) with domain-specific meanings.
4. **Typography:** Always 2 pairings (A and B) with Display/Body/Mono. Google Fonts preferred. Type scale uses 7 tokens (text-xs through text-3xl) with domain-specific usage descriptions.
5. **Component specs:** Exactly 3 XML component specs per vertical, each domain-specific. XML uses `<component>`, `<description>`, `<structure>`, `<dimensions>`, `<states>` tags.
6. **Icon vocabulary:** Tables with 4 columns mapping across ALL 4 icon libraries (Lucide, Phosphor, Material Symbols, Tabler). Primary library listed first. HTML comment above section notes verification source.
7. **Icon categories:** Always include Navigation (5 icons), Domain-specific (6-8 icons), Status & Feedback (4-5 icons), Actions (5-6 icons).
8. **Vertical-Specific Additions:** Bullet list of 4-7 domain-specific patterns at the end.
9. **Target length:** 400-500 lines per VERTICAL-TEMPLATE.md guidance; existing files are ~296 lines each.

## Integration Points

### 1. Vertical File Drop-In (Primary)
**File:** `.claude/get-motif/references/verticals/{vertical}.md`
**How it works:** Path-based convention. Workflows check `if file exists` and load it.
**Referenced by:**
- `workflows/research.md` -- loaded by research agent as context
- `workflows/generate-system.md` -- loaded by system generator; Icon Vocabulary section used for ICON-CATALOG.md
- `references/context-engine.md` -- listed in Research Agent and System Generator context profiles
- `agents/motif-researcher.md` -- reads vertical reference for domain patterns
- `agents/motif-system-architect.md` -- reads vertical reference for system generation

**Action needed:** Create 4 files: `social.md`, `education.md`, `marketplace.md`, `devtools.md`

### 2. Domain Affinity Matrix in icon-libraries.md
**File:** `.claude/get-motif/references/icon-libraries.md` (lines 88-96)
**Current state:** Only 4 entries: Fintech, Health, SaaS, E-commerce
**What it controls:** Icon library selection algorithm -- which icon library is primary/secondary for each vertical, default/emphasis weights

**Action needed:** Add 4 new rows to the affinity matrix table. Also add new verticals to the Selection Algorithm input list (line 109: currently `fintech | health | saas | ecommerce`).

**Recommended icon library assignments:**

| Vertical | Primary Library | Secondary Library | Rationale |
|----------|----------------|-------------------|-----------|
| Social | Phosphor Icons | Lucide | Phosphor has rich social/communication icons; duotone adds personality |
| Education | Material Symbols (Rounded) | Phosphor Icons | Material has broadest education icon set (school, quiz, book); Rounded feels approachable |
| Marketplace | Material Symbols (Rounded) | Tabler Icons | Same rationale as E-commerce (marketplace is a commerce variant); Tabler for niche |
| DevTools | Lucide | Phosphor Icons | Lucide is already SaaS/developer standard; Feather-derived, terminal-native aesthetic |

**Confidence: MEDIUM** -- based on existing affinity patterns and icon library strengths. The exact assignments should be validated by checking actual icon coverage in each library.

### 3. VERTICAL_COMPONENTS in gap-analyzer.js
**File:** `.claude/get-motif/scripts/gap-analyzer.js` (lines 42-63)
**Current state:** Only 4 entries matching existing verticals
**What it controls:** Component gap analysis for brownfield projects

**Action needed:** Add entries for social, education, marketplace, devtools with 3 components each (matching the component specs that will be defined in the vertical files).

### 4. Vertical Detection in init.md
**File:** `.claude/commands/motif/init.md` (lines 95-103)
**Current state:** Already lists "social", "education", "marketplace" as detection keywords. "developer tools" is grouped under "saas".
**Action needed:** Add "devtools" as a distinct vertical with keywords: `developer tools, CLI, SDK, API platform, code editor, IDE, debugging, monitoring, observability`. Separate it from "saas".

## Domain-Specific Design Intelligence

### Social Vertical

**Core principle:** Connection is the product. Users are sharing, discovering, and building relationships -- the UI must feel alive, personal, and socially aware.

**Navigation patterns:**
- Mobile: Bottom tab bar (Home/Feed, Search/Explore, Create [prominent center], Notifications, Profile)
- Desktop: Left sidebar with profile, feed, messages, notifications, groups
- Stories/reels horizontal carousel at top of feed

**Color system recommendations:**
- Palette A: Vibrant Blue-Violet (community, trust, energy) -- primary-500 around #7C3AED
- Palette B: Warm Coral (personal, expressive, energetic) -- primary-500 around #F43F5E
- Semantic: Success=posted, Error=failed to send, Warning=reported content, Info=new follower

**Typography recommendations:**
- Pairing A: General Sans 700 / DM Sans 400 -- modern, clean, social-native
- Pairing B: Plus Jakarta Sans 700 / Plus Jakarta Sans 400 -- friendly geometric
- No mono needed -- social doesn't deal with numerical data

**Components (3 domain-specific):**
1. **FeedPost** -- content card with author avatar, text/media, engagement actions (like/comment/share)
2. **StoryBubble** -- circular avatar with gradient ring for stories/status
3. **MessageBubble** -- chat message with sender alignment, timestamp, read receipts

**Empty/Error/Loading states:**
- Empty feed: "Follow people to see posts here" with suggested accounts
- No messages: "Start a conversation" with friend suggestions
- Error: "Couldn't load feed. Pull to refresh" -- casual, not alarming

**Icon vocabulary categories:** Navigation, Social & Communication, Status & Feedback, Actions

### Education Vertical

**Core principle:** Clarity enables learning. Users are studying, progressing, and achieving -- the UI must feel structured, encouraging, and never overwhelming.

**Navigation patterns:**
- Mobile: Bottom tab bar (Home/Dashboard, Courses, Assignments, Progress, Profile)
- Desktop: Left sidebar with course catalog, my courses, calendar, grades, resources
- Course detail with module accordion/sidebar navigation

**Color system recommendations:**
- Palette A: Deep Teal-Blue (knowledge, trust, focus) -- primary-500 around #0D9488
- Palette B: Warm Amber-Orange (encouragement, achievement, energy) -- primary-500 around #D97706
- Semantic: Success=completed/passed, Error=failed/overdue, Warning=due soon, Info=new content available

**Typography recommendations:**
- Pairing A: Outfit 700 / Source Sans 3 400 -- clean geometric, readable for long content
- Pairing B: Fraunces 700 / Nunito 400 -- warm authority with friendly body text
- Mono for code snippets in technical courses

**Components (3 domain-specific):**
1. **CourseCard** -- course image, title, instructor, progress bar, enrollment count
2. **LessonProgress** -- vertical stepper/timeline showing module completion
3. **QuizQuestion** -- question text, answer options (radio/checkbox), submit, result feedback

**Empty/Error/Loading states:**
- No courses: "Browse our catalog to find your first course" with categories
- No assignments: "You're all caught up! No pending assignments"
- Error: "We couldn't load your progress. Your work is saved -- we'll sync when reconnected."

**Icon vocabulary categories:** Navigation, Education & Learning, Status & Feedback, Actions

### Marketplace Vertical

**Core principle:** Trust between strangers is the product. Users are buying from and selling to people they don't know -- the UI must build confidence in both the platform and individual sellers.

**Navigation patterns:**
- Mobile: Bottom tab bar (Home/Browse, Search, Sell/List [prominent], Messages, Profile)
- Desktop: Top nav with category mega-menus, prominent search bar, seller dashboard sidebar
- Dual-mode interface: buyer view vs seller view

**Color system recommendations:**
- Palette A: Trustworthy Green (marketplace safety, transaction confidence) -- primary-500 around #059669
- Palette B: Neutral + Bold Accent (premium marketplace feel) -- primary-500 around #1D4ED8
- Semantic: Success=sold/shipped, Error=listing rejected/payment failed, Warning=price drop/bid ending, Info=new message from buyer

**Typography recommendations:**
- Pairing A: Syne 700 / Work Sans 400 -- editorial personality for listings
- Pairing B: Manrope 700 / Karla 400 -- warm, modern, approachable
- Mono for prices with tabular-nums

**Components (3 domain-specific):**
1. **ListingCard** -- product image, price, seller rating, condition badge, location
2. **SellerProfile** -- avatar, rating stars, review count, response time, verification badge
3. **OfferPanel** -- current price, offer input, "Make Offer" / "Buy Now" CTAs, shipping estimate

**Empty/Error/Loading states:**
- No listings: "Be the first to list in this category" with sell CTA
- No messages: "When you buy or sell, conversations appear here"
- Error: "Payment couldn't be processed. Your funds are safe. Try again or use a different method."

**Icon vocabulary categories:** Navigation, Marketplace & Commerce, Status & Feedback, Actions

### DevTools Vertical

**Core principle:** Speed is the product. Developers measure tools in keystrokes saved -- every pixel must serve functionality, reduce cognitive load, and respect the user's expertise.

**Navigation patterns:**
- Mobile: Minimal -- devtools are desktop-first. Mobile is read-only monitoring at best
- Desktop: Dense left sidebar with icon-only collapse (56px). Tabs for multi-entity views. Command palette (Cmd+K) as primary navigation
- Terminal/console panel at bottom, resizable

**Color system recommendations:**
- Palette A: Deep Navy-Slate (code editor heritage, professional depth) -- primary-500 around #6366F1
- Palette B: Dark Mode Native (developers prefer dark) -- surface-primary #0A0A0B, primary-500 #22D3EE
- Semantic: Success=build passed/deploy success, Error=build failed/error, Warning=deprecation/rate limit, Info=new release/changelog

**Typography recommendations:**
- Pairing A: Space Grotesk 700 / IBM Plex Sans 400 -- engineering precision (same as SaaS Pairing A)
- Pairing B: JetBrains Mono 700 / IBM Plex Sans 400 -- monospace-first, code-native
- Mono is CRITICAL: JetBrains Mono or Fira Code for code, logs, terminal output, API responses

**Components (3 domain-specific):**
1. **CodeBlock** -- syntax-highlighted code with line numbers, copy button, language badge, expand/collapse
2. **StatusPipeline** -- horizontal pipeline stages (build/test/deploy) with pass/fail/running states
3. **LogViewer** -- scrollable log output with severity coloring, timestamp, filter by level, search

**Empty/Error/Loading states:**
- No projects: "Create your first project or connect a repository" with quick-start templates
- No logs: "Deploy your first build to see logs here"
- Error: "API request failed (HTTP 502). Request ID: abc123. Retry or check status page."

**Icon vocabulary categories:** Navigation, Developer & Infrastructure, Status & Feedback, Actions

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Vertical file structure | Custom template per vertical | Follow VERTICAL-TEMPLATE.md exactly | Consistency is enforced by section heading order; downstream parsers expect specific headings |
| Icon name mappings | Guessing icon names | Verify against official icon library repos/docs | Icon names are the #1 source of hallucination; wrong names cause silent rendering failures |
| Color contrast ratios | Manual calculation | Use contrast-checker.js already in the codebase | WCAG contrast compliance requires precise math |
| Component XML format | Prose component descriptions | Use XML `<component>` format matching existing verticals | generate-system.md parses these for COMPONENT-SPECS.md generation |

## Common Pitfalls

### Pitfall 1: Inconsistent Section Headings
**What goes wrong:** A new vertical file has slightly different heading names (e.g., "## Colors" instead of "## Color System"), causing downstream parsers/agents to miss the section.
**Why it happens:** Authoring from memory instead of referencing the template.
**How to avoid:** Use VERTICAL-TEMPLATE.md as the skeleton. Validate by diffing section headings against an existing vertical (e.g., `grep "^##" fintech.md` vs `grep "^##" social.md`).
**Warning signs:** Icon vocabulary not appearing in ICON-CATALOG.md; system generator missing palette data.

### Pitfall 2: Hallucinated Icon Names
**What goes wrong:** Icon names in the vocabulary table don't exist in the actual icon library (e.g., `ph-message` instead of `ph-chat-circle`).
**Why it happens:** LLM generates plausible but incorrect icon names. Each library has its own naming conventions.
**How to avoid:** Each icon name MUST be verified against the library's official icon set. Include an HTML comment above the Icon Vocabulary section noting the verification source and version (e.g., `<!-- Verified against Phosphor Icons @phosphor-icons/web@2.1.2 -->`). All existing verticals follow this pattern.
**Warning signs:** Icons not rendering in token-showcase.html; broken `<i>` elements in composed screens.

### Pitfall 3: Missing Dark Mode Values
**What goes wrong:** Palette tables only include light mode hex values, leaving dark mode columns empty or with placeholder values.
**Why it happens:** Light mode is designed first and dark mode is forgotten.
**How to avoid:** All 4 existing verticals provide BOTH light and dark mode hex values in every palette row. Enforce the same.

### Pitfall 4: Forgetting Integration Point Updates
**What goes wrong:** Vertical files are created but icon-libraries.md affinity matrix and gap-analyzer.js VERTICAL_COMPONENTS are not updated. New verticals work for basic design generation but icon selection algorithm falls through and brownfield gap analysis ignores vertical-specific components.
**Why it happens:** The vertical file itself is the visible deliverable; the integration points are less obvious.
**How to avoid:** Treat integration point updates as required tasks in the plan, not optional follow-ups.

### Pitfall 5: DevTools vs SaaS Overlap
**What goes wrong:** DevTools vertical is too similar to SaaS, offering little differentiation.
**Why it happens:** DevTools and SaaS share audience (technical users) and some patterns (dashboards, tables, command palettes).
**How to avoid:** DevTools must emphasize: code/terminal-centric components, dark-mode-first design, monospace-heavy typography, build pipeline patterns, log viewing, API documentation patterns. SaaS emphasizes: data tables, collaboration, workspace management, onboarding checklists.

## Architecture Patterns

### Recommended File Structure (No Changes to Existing)
```
.claude/get-motif/references/verticals/
  ecommerce.md      # existing
  fintech.md         # existing
  health.md          # existing
  saas.md            # existing
  social.md          # NEW
  education.md       # NEW
  marketplace.md     # NEW
  devtools.md        # NEW
```

### File Authoring Pattern
1. Copy VERTICAL-TEMPLATE.md as the skeleton
2. Fill each section with domain-specific content, matching the depth/specificity of existing verticals
3. Verify icon names against official library documentation
4. Add HTML verification comment above Icon Vocabulary section
5. Validate section heading consistency with `grep "^##" {vertical}.md`

### Integration Update Pattern
1. Add row to Domain Affinity Matrix in icon-libraries.md
2. Add vertical to Selection Algorithm input list in icon-libraries.md
3. Add vertical-specific components to gap-analyzer.js VERTICAL_COMPONENTS
4. Update init.md vertical detection keywords (devtools separation from saas)

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic vertical support | Domain-specific reference files | v1.0 (Phase 10) | Each vertical gets curated palettes, typography, components |
| Icon names in component specs | Centralized Icon Vocabulary per vertical | v1.2 (Phase 14) | Prevents hallucinated icon names; single source of truth |
| Manual icon library selection | Algorithmic selection via affinity matrix | v1.2 (Phase 14) | Deterministic library choice based on vertical + personality seed |

## Validation Strategy

There are no automated validation scripts that check vertical file structure. Validation must be manual or built as part of this phase.

**Recommended validation approach:**
1. **Section heading check:** Extract `## ` headings from each new vertical and compare against existing vertical (e.g., fintech.md). All required sections must be present.
2. **Icon name verification:** For each icon in the vocabulary tables, verify the name exists in the library's official icon set.
3. **Palette completeness:** Each palette must have: primary-50 through primary-900, surface-primary/secondary/tertiary, text-primary/secondary -- all with both light and dark mode values.
4. **Component XML validity:** Each component spec must use the `<component>` XML format with `name`, `category`, `description`, `structure`, `dimensions`, `states` elements.
5. **Integration test:** After all files are created, run `/motif:init --auto --vertical social` (and others) and verify the full pipeline works through `/motif:system`.

## Open Questions

1. **Marketplace vs E-commerce overlap:**
   - What we know: Marketplace is a two-sided platform (buyers + sellers); E-commerce is one-sided (store to buyer). init.md already separates them.
   - What's unclear: How much palette/component overlap is acceptable? Should marketplace explicitly reference e-commerce patterns?
   - Recommendation: Keep marketplace distinct. Focus on seller trust, peer-to-peer communication, offer/bid mechanics, and dual-mode (buyer/seller) interfaces.

2. **DevTools vertical naming in detection:**
   - What we know: init.md currently groups "developer tools" under "saas". DevTools needs its own entry.
   - What's unclear: Should "devtools" be the canonical name or "developer-tools"? File naming uses no hyphens in existing verticals.
   - Recommendation: Use `devtools` (no hyphen) as the canonical name and filename (`devtools.md`), matching the pattern of single-word filenames (saas, health, fintech, ecommerce).

## Sources

### Primary (HIGH confidence)
- `.claude/get-motif/references/verticals/saas.md` -- full template structure analysis
- `.claude/get-motif/references/verticals/fintech.md` -- full template structure analysis
- `.claude/get-motif/references/verticals/ecommerce.md` -- full template structure analysis
- `.claude/get-motif/references/verticals/health.md` -- full template structure analysis
- `.claude/get-motif/templates/VERTICAL-TEMPLATE.md` -- official template skeleton
- `.claude/get-motif/references/icon-libraries.md` -- Domain Affinity Matrix, Selection Algorithm
- `.claude/get-motif/scripts/gap-analyzer.js` -- VERTICAL_COMPONENTS integration point
- `.claude/commands/motif/init.md` -- vertical detection keywords
- `.claude/get-motif/workflows/generate-system.md` -- how verticals feed into system generation
- `.claude/get-motif/workflows/research.md` -- how verticals feed into research
- `.claude/get-motif/references/context-engine.md` -- context loading profiles referencing verticals

### Secondary (MEDIUM confidence)
- Domain-specific design intelligence for Social/Education/Marketplace/DevTools based on established UX patterns and industry conventions
- Icon library assignments for new verticals (based on existing affinity patterns)

## Metadata

**Confidence breakdown:**
- Template structure: HIGH -- verified by reading all 4 existing verticals and the template
- Integration points: HIGH -- verified by grepping all references to `verticals/` across codebase
- Domain design intelligence: MEDIUM -- based on established UX conventions, not verified against specific products
- Icon library assignments: MEDIUM -- inferred from existing affinity patterns, not verified against icon coverage

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (stable -- vertical template structure unlikely to change)
