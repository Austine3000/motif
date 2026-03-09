# Feature Landscape: Global Install, Context Resilience, and New Verticals

**Domain:** Global CLI distribution, state persistence across AI context resets, and domain-specific design intelligence for Social, Education, Marketplace, and DevTools verticals
**Researched:** 2026-03-09
**Overall confidence:** MEDIUM-HIGH (web research verified against ecosystem patterns; vertical design patterns based on multiple sources)

## Context

Motif v0.2.2 installs per-project via `npx motif-design@latest`, copying files into `.claude/get-motif/`. Three gaps block adoption:

1. **No global install**: Users must re-run `npx motif-design@latest` in every project. Power users expect `npm install -g motif-design` then `motif init` from any directory.
2. **State breaks on /clear**: The state machine relies on STATE.md being read back by the AI agent. When a user runs `/clear` (which wipes agent context), the agent loses awareness of the current phase. STATE.md exists on disk but the agent does not automatically re-read it on the next message.
3. **Only 4 verticals**: E-commerce, fintech, health, and SaaS cover B2B/B2C basics but miss major categories -- social apps, education platforms, marketplaces, and developer tools each have dramatically different design vocabularies.

This research maps what features are expected (table stakes), what would differentiate Motif (differentiators), and what to explicitly avoid (anti-features) across all three domains.

---

## Table Stakes

Features users expect. Missing = product feels incomplete or broken.

### A. Global CLI UX

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **`npm install -g motif-design`** | Every major CLI tool (ESLint, TypeScript, Angular CLI, Create React App) supports global install. Users expect `motif` to be available as a system command after one install. The current `npx` flow requires users to remember the package name every time. | MEDIUM | Modifies: `package.json` bin field (already has `"motif": "bin/install.js"`), adds: new CLI entry point for global mode | The `bin` field already maps `motif` to `bin/install.js`. Global install already works mechanically -- `npm install -g motif-design` links the binary. The issue is that `install.js` currently runs the full per-project copy flow. Global mode needs a different entry point that detects whether it is running as a global tool vs npx one-shot. |
| **`motif init` command (global mode)** | When installed globally, users expect `motif init` in any directory to scaffold Motif into that project. This is the Angular CLI / Create React App pattern -- one global install, per-project initialization. Without this, global install has no value. | MEDIUM | Requires: global install, modifies: `install.js` or adds new entry point | Global `motif init` should: (1) detect the runtime (Claude Code, etc.), (2) copy files to the current project (same as current npx flow), (3) write `.motif-manifest.json`. The key difference from npx: global mode should NOT re-download on every run. |
| **`motif update` command** | Users who install globally expect a way to check for and apply updates without reinstalling. `npm update -g motif-design` handles the package itself, but Motif also has per-project installed files that need updating. Users expect `motif update` to re-sync project files from the updated global package. | LOW | Requires: global install, uses: existing manifest hash comparison | Already partially built -- `check-version.js` exists. `motif update` in global mode should: (1) compare global package version against `.motif-manifest.json` version, (2) re-run the file copy for changed files, (3) backup user-modified files (existing behavior). |
| **`motif status` command** | Users expect to quickly check: "Is Motif installed in this project? What version? What phase am I in?" This is table stakes for any CLI tool with per-project state. `git status`, `npm ls`, `docker ps` all follow this pattern. | LOW | Requires: reads `.motif-manifest.json` + `STATE.md` | Print: version installed, current phase, screens composed, last activity date. This is the global CLI's equivalent of `git status` -- quick orientation. |
| **Dual-mode support (global + npx)** | Both `npx motif-design@latest` (current) and `npm install -g motif-design && motif init` (new) must work. Dropping npx support would break existing users and documentation. Modern npm tools universally support both modes. | LOW | Modifies: CLI entry point to detect execution mode | Detect mode via: if `process.argv` includes `init`/`status`/`update`, run as global CLI subcommand. If no subcommand (bare `motif` / `npx motif-design`), run current install flow. This preserves backward compatibility. |

### B. Context-Resilient State Machine

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Auto-read STATE.md on every command** | When a user runs `/clear` then `/motif:compose`, the agent starts fresh with no memory. The compose command MUST read STATE.md as its FIRST action before gate checks. Currently, commands check state but may not consistently re-read from disk after context loss. Users expect the tool to "just work" after /clear -- they should not need to manually tell the agent to read state. | MEDIUM | Modifies: every command markdown file (init, research, system, compose, review, fix, evolve, quick), modifies: state-machine.md reference | Every command's first instruction must be: "Read `.planning/design/STATE.md`. If it does not exist, check if `.planning/design/PROJECT.md` exists to infer phase. Parse the Phase field and validate before proceeding." This is a documentation/instruction change, not a code change -- Motif runs inside AI agents, so "code" means prompt instructions. |
| **Artifact-based state inference** | If STATE.md is missing or corrupted, the system should infer state from what artifacts exist on disk. `tokens.css` exists? Phase >= SYSTEM_GENERATED. Screen files exist? Phase >= COMPOSING. Review files exist? Phase >= REVIEWING. This is defense-in-depth for state recovery. | MEDIUM | Modifies: state-machine.md, adds: state inference rules to each command | Inference order: (1) Read STATE.md if present, (2) If absent/corrupt, scan `.planning/design/` for artifacts, (3) Infer highest valid phase from artifacts, (4) Create/recreate STATE.md with inferred state, (5) Inform user: "STATE.md was missing. Inferred phase: SYSTEM_GENERATED based on existing artifacts. Continuing." |
| **STATE.md as structured, parseable format** | The current STATE.md uses markdown tables and headings that an AI agent must interpret. If the format is ambiguous, the agent may misread state after /clear. A stricter format (e.g., YAML frontmatter or well-defined markdown with exact field names) reduces parsing errors. | LOW | Modifies: STATE-TEMPLATE.md, modifies: state update protocol in state-machine.md | Add YAML frontmatter to STATE.md: `---\nphase: SYSTEM_GENERATED\nvertical: fintech\nstack: Next.js + Tailwind\n---` followed by markdown body for screens table and decisions log. YAML frontmatter is trivially parseable and survives agent context loss better than "read the heading after ## Phase". |
| **Context restoration prompt** | After /clear, the next user message triggers a fresh agent context. The agent needs a "boot sequence" that reads project state and restores awareness. This should happen automatically via the command prompt, not require user action. | LOW | Modifies: all command `.md` files in `.claude/commands/motif/` | Each command file already has instructions. Add a preamble block to every command: "CONTEXT RESTORATION: Read the following files in order: (1) `.planning/design/STATE.md`, (2) `.planning/design/PROJECT.md`, (3) `.planning/design/DESIGN-BRIEF.md`. Extract: current phase, vertical, stack, screens status. Do NOT proceed until you have confirmed the current phase." |

### C. Vertical Design Patterns (Shared Requirements)

| Feature | Why Expected | Complexity | Dependencies | Notes |
|---------|--------------|------------|--------------|-------|
| **Complete vertical reference file per domain** | Each existing vertical (saas.md, fintech.md, etc.) provides ~300 lines of design intelligence: palettes, typography pairings, spacing, component specs, icon vocabulary, accessibility rules. New verticals MUST match this depth. Shallow verticals that say "use bright colors for social" are useless -- the system architect agent needs exact hex values, font names, and component XML specs to generate a real design system. | HIGH | Uses: VERTICAL-TEMPLATE.md as skeleton, produces: 4 new files in `core/references/verticals/` | Each vertical file must contain: Core Design Principle, Navigation Patterns, 2-3 Color Palettes with full token tables, 2-3 Typography Pairings with specific Google Fonts names, Type Scale, Spacing & Density values, 3-5 Component Specifications in XML format, Interaction Patterns, Accessibility rules, Border Radius, Shadow Style, and Icon Vocabulary mapped across all 4 icon libraries. |
| **Icon vocabulary per vertical** | Every existing vertical maps ~25 semantic icon roles to specific icon names across Lucide, Phosphor, Material Symbols, and Tabler. New verticals need the same. The composer agents use these tables to select contextually appropriate icons. | MEDIUM | Uses: icon-libraries.md for cross-reference, integrates into each vertical file | Social needs: heart/like, comment, share, repost, story-ring, live-indicator, follow, message, group, trending. Education needs: book, graduation-cap, video, quiz/clipboard, certificate, streak/flame, progress-circle, lecture, assignment. Marketplace needs: shopping-cart, listing, bid/gavel, seller-badge, star-rating, shipping-truck, filter, compare, wishlist. DevTools needs: terminal, git-branch, bug, deploy/rocket, log/scroll, api/plug, pipeline, container, monitoring/activity. |

---

## Differentiators

Features that set Motif apart. Not expected, but valued.

### A. Global CLI UX

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **`motif doctor` diagnostic command** | Validate the Motif installation: check file integrity against manifest hashes, verify CLAUDE.md sentinel markers, confirm hooks are registered in settings.json, check for version mismatches. No competitor CLI tool for AI assistants offers installation diagnostics. This builds trust -- "something feels wrong" has a concrete answer. | LOW | Requires: global install, reads: `.motif-manifest.json`, `.claude/settings.json`, `CLAUDE.md` | Run all checks from the existing `verify()` function in `install.js`, plus: check STATE.md parse-ability, check that referenced vertical files exist, check that token file paths in state are valid. Output a checklist: "7/7 checks passed" or "FAIL: motif-token-check.js missing (re-run motif init to fix)". |
| **`motif list` available verticals** | Show all available verticals with descriptions. When Motif has 8+ verticals, users need discoverability. "Which vertical should I pick for my dating app?" -- `motif list` shows: "social: Feed-centric apps with engagement loops, stories, and messaging." | LOW | Reads: vertical files from global package directory | Simple feature, high UX value. Reads vertical file headers and prints a formatted list. Helps users who are unsure which vertical matches their project. |
| **Offline-first global mode** | Global install means all files are already on disk -- no network needed for `motif init`. Unlike `npx motif-design@latest` which downloads every time, global mode works on planes, in restricted networks, and in CI environments. This is an inherent advantage of global install worth marketing. | FREE | Already true once global install works | No implementation needed -- just communicate the benefit. Global install bundles all verticals, templates, and agents locally. |

### B. Context-Resilient State Machine

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **State continuity score in status line** | The existing context monitor shows context window percentage. Enhance it to also show state health: "Motif: COMPOSING | 3 screens | ctx 42%". After /clear, the status line immediately shows where the project stands without the user asking. This is unique -- no AI coding tool shows project workflow state in its status line. | LOW | Modifies: `motif-context-monitor.js` to also read STATE.md | The hook already runs on every message. Add: read STATE.md, extract phase and screen count, append to status line output. The agent sees this on every turn, reinforcing state awareness even without explicit re-reading instructions. |
| **Checkpoint commits with state tags** | After each phase transition (INITIALIZED, RESEARCHED, SYSTEM_GENERATED, etc.), create a git commit with a known tag format: `motif/phase/SYSTEM_GENERATED`. After /clear, the agent can `git log --grep="motif/phase"` to find the last state transition even if STATE.md is corrupted. Git becomes the backup state store. | MEDIUM | Modifies: state update protocol, uses: existing git commit patterns | Commit message format: `design(state): RESEARCHED -> SYSTEM_GENERATED`. The agent can grep commit history to reconstruct the phase timeline. This is defense-in-depth -- not the primary state mechanism, but a recovery path. |
| **Cross-session decision memory** | STATE.md already has a Decisions Log section. Enhance it to capture WHY decisions were made, not just WHAT. "Chose dark mode primary because client brand is midnight blue" survives /clear and informs future agents. Current log entries are terse. Richer entries prevent agents from re-asking settled questions. | LOW | Modifies: state update protocol, modifies: command instructions to log reasoning | Each decision log entry becomes: `- [ISO date] [DECISION]: [what] | [REASON]: [why] | [SOURCE]: [user input / research / vertical default]`. After /clear, the agent reads this and knows not to re-ask "should we support dark mode?" |

### C. Vertical Design Patterns

| Feature | Value Proposition | Complexity | Dependencies | Notes |
|---------|-------------------|------------|--------------|-------|
| **Cross-vertical composition** | Some apps span verticals: an EdTech marketplace (Education + Marketplace), a developer community (DevTools + Social). Motif could detect multi-vertical projects and blend design patterns intelligently. "Your project combines Education content delivery with Marketplace trust signals. Blending palettes and component sets." No other design tool handles cross-vertical intelligence. | HIGH | Requires: all verticals complete, modifies: system architect agent, modifies: init workflow | DEFER to future milestone. Document the concept now but do not build. The vertical blending logic is complex (which vertical's palette wins? how do conflicting spacing values resolve?) and needs dedicated research. For now, users pick ONE primary vertical. |
| **Vertical-specific empty/error/loading states** | Each vertical has domain-appropriate empty states. Social: "No posts yet. Follow people to see their updates." Education: "No courses enrolled. Browse the catalog to start learning." Marketplace: "No listings match your filters. Try broadening your search." Generic empty states feel lazy -- vertical-specific ones feel intentional. | LOW | Integrates into each vertical reference file | Add an "Empty & Error States" section to each vertical file with 3-5 contextual messages and recommended visual treatments. The composer uses these when generating screens with empty/loading/error states. |
| **Vertical migration path** | When a user realizes they picked the wrong vertical (started with SaaS but it is really a Marketplace), provide a path to switch without losing composed screens. Re-run `/motif:system` with the new vertical, regenerate tokens, but preserve screen compositions and just flag token mismatches for review. | MEDIUM | Requires: state machine resilience, modifies: `/motif:system` and `/motif:evolve` workflows | The evolve command already supports design system iteration. Vertical migration is a special case: regenerate tokens.css and COMPONENT-SPECS.md from new vertical, run token-check hooks against existing screens to flag mismatches, present a migration report. User decides what to update. |

---

## Anti-Features

Features to explicitly NOT build. Each seems useful but creates problems for Motif specifically.

### A. Global CLI UX

| Anti-Feature | Why It Seems Useful | Why It Is Problematic for Motif | What to Do Instead |
|--------------|---------------------|--------------------------------|-------------------|
| **Global config file (~/.motifrc)** | "Store user preferences globally: default vertical, preferred font pairings, color preferences." | Motif generates design systems per-project based on domain research and user input. Global preferences would override project-specific decisions, leading to cookie-cutter designs across unrelated projects. A healthcare app and a social app should NOT share default preferences. Global state also creates a debugging nightmare: "why does my project look like this?" -- "because ~/.motifrc set your palette 6 months ago and you forgot." | Keep all configuration per-project in `.planning/design/`. If a user wants consistent preferences, they copy their STATE.md or tokens.css between projects explicitly. |
| **Auto-update on npx run** | "When running `npx motif-design@latest`, automatically update per-project files if a new version is available." | npx already fetches the latest version. The issue is silently overwriting per-project files. If a user customized their COMPONENT-SPECS.md (allowed and expected), an auto-update could destroy their customizations without warning. The current backup-then-overwrite behavior in install.js is correct. | Keep current behavior: npx always runs latest, install.js backs up modified files, user sees what changed. Add a `motif update --dry-run` to preview changes before applying. |
| **Daemon/background process** | "Run a Motif daemon that watches for file changes and auto-validates token usage." | Motif runs inside AI agent context, not as a standalone process. Adding a daemon creates a dependency on a running process that users must manage, adds system resource usage, and creates "is the daemon running?" debugging problems. The hook-based architecture (PostToolUse hooks) is the right pattern -- it runs only when the agent writes files. | Continue using Claude Code hooks for validation. Hooks are zero-overhead when the agent is not writing files and require no daemon management. |
| **Plugin/extension system** | "Let community members create Motif plugins for custom verticals, hooks, or generators." | Motif is in early adoption (v0.2.x). A plugin system before the core is stable means: (1) plugins break on every version, (2) support burden for third-party code, (3) architecture locked by plugin API compatibility. Premature abstraction. | Focus on built-in verticals until v1.0 stability. The vertical template already provides a standardized format -- community verticals can be contributed as PRs and vetted before inclusion. Plugin system is a v2.0 consideration. |

### B. Context-Resilient State Machine

| Anti-Feature | Why It Seems Useful | Why It Is Problematic for Motif | What to Do Instead |
|--------------|---------------------|--------------------------------|-------------------|
| **Database-backed state (SQLite, JSON DB)** | "Use a proper database for state persistence instead of a markdown file." | STATE.md must be readable by AI agents. AI agents read files -- they do not query databases. Markdown is the native format AI agents understand. A database adds: a dependency, a query layer, a schema, migration concerns, and debugging complexity ("why is the DB saying COMPOSING when the screens are reviewed?"). The entire value of file-based state is that it is human-readable AND agent-readable. | Keep STATE.md as the source of truth. Add YAML frontmatter for machine-parseable fields. The markdown body remains human-readable narrative. |
| **Real-time state sync across terminals** | "If two terminal sessions have Motif running, sync state between them." | Motif runs inside a single Claude Code session per project. Multi-session is an edge case that introduces file locking, merge conflicts on STATE.md, and race conditions on git commits. The complexity is enormous for a scenario that barely exists. | Document that Motif is single-session per project. If a user opens two terminals, the second one reads STATE.md fresh and sees the latest state -- eventual consistency via filesystem is sufficient. |
| **Undo/rollback state transitions** | "Allow users to go back to a previous phase, e.g., from COMPOSING back to RESEARCHED." | The state machine already allows re-running earlier phases (evolve loops back). But arbitrary rollback implies reverting artifacts: deleting tokens.css to go from SYSTEM_GENERATED back to RESEARCHED. This is destructive and confusing. Users who want to redo research can run `/motif:research` again -- the command is idempotent by design. | Make commands idempotent: running `/motif:research` when already in SYSTEM_GENERATED should re-run research and update DESIGN-RESEARCH.md. The phase stays at the higher level unless the user explicitly deletes artifacts. |

### C. Vertical Design Patterns

| Anti-Feature | Why It Seems Useful | Why It Is Problematic for Motif | What to Do Instead |
|--------------|---------------------|--------------------------------|-------------------|
| **Auto-detect vertical from codebase** | "Scan package.json dependencies and file structure to automatically determine the vertical." | Verticals are about user INTENT, not technology. A Next.js app could be social, education, marketplace, or SaaS. Package dependencies tell you the framework, not the domain. Auto-detection would frequently guess wrong, and a wrong vertical means wrong palettes, wrong component specs, wrong icon vocabulary -- the entire design system is misaligned. | Keep vertical selection as an explicit user choice during `/motif:init`. The user knows their domain better than any heuristic. Present the vertical list with descriptions and let them pick. |
| **Exhaustive vertical coverage (20+ verticals)** | "Cover every possible app category: music, travel, fitness, food, real estate, legal, automotive..." | Each vertical requires ~300 lines of carefully researched, opinionated design intelligence with exact hex values, font names, component XML specs, and icon mappings. Maintaining 20+ verticals means updating 20+ files for every template change. Quality drops as quantity increases. Better to have 8 excellent verticals that cover 80% of use cases than 20 shallow ones. | Ship 8 verticals (current 4 + new 4) that cover the major categories. Projects that do not fit a vertical perfectly can use the closest match and customize via `/motif:evolve`. |
| **Vertical-specific code generation templates** | "Generate React/Vue/Svelte component code specific to each vertical." | Verticals define DESIGN patterns (colors, typography, spacing, components), not CODE patterns. Mixing design intelligence with framework-specific code generation doubles the maintenance surface and creates a combinatorial explosion (8 verticals x 5 frameworks = 40 template sets). Motif's value is design intelligence; code generation is the AI agent's job. | Verticals provide design specs. The AI agent (composer) translates specs into code for whatever framework the project uses. The vertical file never contains framework-specific code. |

---

## Feature Dependencies

```
Global Install
  motif init (global mode) --> motif status --> motif update
  motif init (global mode) --> motif doctor
  Dual-mode detection --> all global subcommands

Context Resilience
  YAML frontmatter in STATE.md --> Auto-read on every command
  Auto-read on every command --> Artifact-based state inference (fallback)
  Context restoration prompt --> All command .md file updates
  State continuity in status line --> motif-context-monitor.js update

New Verticals (each independent, can be parallelized)
  social.md --> Icon vocabulary (social-specific)
  education.md --> Icon vocabulary (education-specific)
  marketplace.md --> Icon vocabulary (marketplace-specific)
  devtools.md --> Icon vocabulary (devtools-specific)
  All verticals complete --> Cross-vertical composition (DEFERRED)
```

---

## Vertical-Specific Feature Details

### Social Vertical

| Feature Category | Key Patterns | Confidence |
|-----------------|-------------|------------|
| **Navigation** | Bottom tab bar (Home/Feed, Search/Explore, Create/+, Activity, Profile). Stories bar at top of feed. Swipe between tabs on mobile. | HIGH -- universal pattern across Instagram, TikTok, Twitter/X, Threads |
| **Core Components** | FeedCard (post with author avatar, media, engagement bar), StoryRing (circular avatar with gradient ring for unread), MessageBubble (left/right aligned with tail), EngagementBar (like/comment/share/save row), UserProfileHeader (avatar + stats + follow CTA) | HIGH |
| **Color System** | Vibrant accent on neutral base. Primary: gradient or saturated accent (pink-red for engagement, blue for trust). Surfaces: near-white or true-dark. Engagement metrics use warm colors (heart = red, not green). Dark mode is not optional -- social apps are used at night. | HIGH |
| **Typography** | Compact, high-density. Body at 14-15px for comment threads. Display font with personality (not corporate). Mono for timestamps only. | MEDIUM |
| **Density** | COMPACT. Social feeds optimize for content-per-scroll. Card padding 12px, avatar size 40px in lists / 80-120px on profiles, comment thread indentation 32px. | HIGH |
| **Key Interaction** | Pull-to-refresh, infinite scroll, double-tap to like, swipe to reply, long-press for options menu. Stories auto-advance with tap-to-pause. | HIGH |
| **Accessibility** | Alt text on all media (critical for social). Reduced motion preference must disable auto-play. Screen reader announcements for engagement counts. High contrast mode for outdoor use. | MEDIUM |

### Education Vertical

| Feature Category | Key Patterns | Confidence |
|-----------------|-------------|------------|
| **Navigation** | Left sidebar with course catalog + enrolled courses + progress. Top bar for search + notifications + profile. Course detail pages use tabbed navigation (Overview, Curriculum, Discussion, Notes). Mobile: bottom tabs (Home, My Courses, Search, Profile). | HIGH -- consistent across Coursera, Udemy, Duolingo, Khan Academy |
| **Core Components** | CourseCard (thumbnail + title + instructor + progress bar + rating), LessonPlayer (video with transcript sidebar), ProgressTracker (linear or circular progress indicator with milestone markers), QuizCard (question + answer options with feedback states), StreakCounter (flame icon + day count + calendar view) | HIGH |
| **Color System** | Warm, encouraging tones. Primary: deep blue or teal (trust + focus). Accent: warm orange or green (achievement + progress). Success states are prominent (celebrations for completion). Avoid clinical/cold palettes -- learning should feel inviting, not sterile. | MEDIUM |
| **Typography** | Readable at extended viewing. Body at 16-18px for lesson content (users read for minutes, not seconds). Display font that feels approachable but not childish. Mono for code lessons only. Strong hierarchy: lesson title > section heading > body > caption. | HIGH |
| **Density** | COMFORTABLE. Users spend 15-30 minutes per session reading and watching. Card padding 16-20px, generous line height (1.6-1.7 for body text), clear section breaks. Content breathes. | HIGH |
| **Key Interaction** | Video player with speed controls (0.5x-2x), keyboard shortcuts for play/pause/skip. Progress auto-saves on every meaningful action. Quiz answers show immediate feedback with explanation. Certificate generation on completion. | HIGH |
| **Accessibility** | WCAG 2.1 AA minimum (education serves diverse populations). Closed captions on all video. Adjustable text size. Dyslexia-friendly font option. Keyboard navigation through lessons. Screen reader support for quizzes. | HIGH -- regulatory requirements in educational contexts |

### Marketplace Vertical

| Feature Category | Key Patterns | Confidence |
|-----------------|-------------|------------|
| **Navigation** | Two-sided: BUYER side has category browsing + search + cart + orders. SELLER side has dashboard + listings + orders + earnings. Top bar: search (prominent, 40-60% width), category dropdown, cart icon with badge, user menu. Mobile: bottom tabs (Home, Categories, Sell, Messages, Account). | HIGH -- consistent across Etsy, Amazon, eBay, Airbnb, Uber |
| **Core Components** | ProductCard (image + price + rating + seller badge + quick-action), FilterPanel (sidebar or modal with faceted filters: price range slider, category checkboxes, rating stars, location), ListingForm (multi-step: photos > details > pricing > shipping), SellerDashboard (earnings chart + recent orders + listing stats), TrustBadge (verified seller, top-rated, money-back guarantee), ReviewCard (star rating + text + author + date + helpful count) | HIGH |
| **Color System** | Trust-first palette. Primary: blue or teal (trust, reliability). Accent: warm action color for CTAs (orange/amber for "Buy Now", green for "Add to Cart"). Seller-side uses distinct accent to differentiate from buyer experience. Price displays: bold, dark, never colored (color implies sale/discount). Sale/discount: red. | HIGH |
| **Typography** | Price is king -- prices must be the most scannable element. Price font: bold, slightly larger than surrounding text, tabular-nums. Body at 14-15px for listings. Display font that feels trustworthy (not playful). | HIGH |
| **Density** | MODERATE. Product grids need breathing room for images but listings need scannability. Card padding 12-16px, image aspect ratio 4:3 or 1:1 for grid uniformity, 8-12px gap between cards. Filter sidebar 240-280px. | HIGH |
| **Key Interaction** | Faceted filtering with active filter chips above results. Sort by: relevance, price low/high, rating, newest. Image gallery with zoom on hover/tap. Add-to-cart with quantity without leaving page. Wishlist/save for later. Compare mode (side-by-side). | HIGH |
| **Accessibility** | Product images need descriptive alt text (not just "product photo"). Price screen reader formatting ("$49.99" not "dollar sign four nine period nine nine"). Filter state announced via aria-live. Focus management in modals (checkout, image gallery). | MEDIUM |

### DevTools Vertical

| Feature Category | Key Patterns | Confidence |
|-----------------|-------------|------------|
| **Navigation** | Persistent left sidebar with resizable panels. Command palette (Cmd+K) as primary navigation accelerator. Tab-based workspace for multi-context viewing. Top bar minimal: breadcrumbs + status indicators. Mobile: NOT a priority -- DevTools are desktop-first. | HIGH -- consistent across VS Code, GitHub, Vercel, Linear, Raycast |
| **Core Components** | CodeBlock (syntax-highlighted with copy button + language badge), LogViewer (timestamped scrolling log with severity filters), PipelineStatus (multi-stage horizontal pipeline with pass/fail/running per stage), MetricCard (large number + trend arrow + sparkline), TerminalEmbed (dark-background inline terminal output), DiffViewer (side-by-side or unified diff with line numbers) | HIGH |
| **Color System** | Dark mode is the DEFAULT (developers overwhelmingly prefer dark). Light mode is secondary. Primary: cool blue or violet (VS Code influence). Syntax highlighting colors are part of the palette -- not an afterthought. Semantic colors are critical: green=pass, red=fail, yellow=warning, blue=info must be instantly recognizable. Surfaces: near-black with subtle elevation differences (GitHub dark, Linear, Vercel). | HIGH |
| **Typography** | Mono font is a FIRST-CLASS citizen, not an afterthought. Body in a technical sans-serif. Code at 13-14px with 1.5 line height. JetBrains Mono or Fira Code with ligatures for code. UI text at 13-14px (developers prefer dense). Display headings are rare -- most DevTools interfaces are flat hierarchy. | HIGH |
| **Density** | DENSE. Developers want maximum information per pixel. Card padding 12px, table row height 32-36px, sidebar items 28-32px tall, minimal decorative spacing. Information density is a feature, not a compromise. Whitespace is used for grouping, not aesthetics. | HIGH |
| **Key Interaction** | Keyboard-first: every action has a shortcut. Command palette for search + actions. Copy-to-clipboard on code blocks and terminal output. Expandable/collapsible panels. Real-time updates for logs, builds, deployments (WebSocket-style streaming). Tooltip-revealed keyboard shortcuts. | HIGH |
| **Accessibility** | Syntax highlighting must maintain contrast ratios (common failure point). Focus indicators visible against dark backgrounds. Screen reader support for status changes (build passed/failed). Reduced motion for real-time log streaming. Color-blind-safe status indicators (use icons + color, not color alone). | MEDIUM |

---

## MVP Recommendation

### Must Ship Together (Atomic Release)
1. **Context-resilient state machine** -- Fixes a CURRENT user pain point (/clear breaks workflow). Ship this first or simultaneously with everything else, because it improves the experience for existing users immediately.
2. **YAML frontmatter in STATE.md** -- Required foundation for reliable state restoration.
3. **Auto-read + artifact inference** -- The two mechanisms that make /clear non-destructive.

### Ship Next (Global CLI)
4. **Global install with `motif init`** -- Requires the state resilience work to be done first, otherwise global users will hit the same /clear problem.
5. **`motif status`** -- Trivial to add once global CLI structure exists.
6. **`motif update`** -- Builds on existing version check infrastructure.

### Ship After (Verticals -- Parallelizable)
7. **Social vertical** -- Highest demand; most consumer apps are social-adjacent.
8. **Marketplace vertical** -- Second highest demand; two-sided platforms are common.
9. **Education vertical** -- Growing EdTech market; clear differentiation from SaaS vertical.
10. **DevTools vertical** -- Meta-relevant (Motif IS a dev tool); validates that the vertical system handles developer-audience products.

### Defer
- Cross-vertical composition (v0.4+)
- Vertical migration path (v0.4+)
- Plugin system (v2.0)

---

## Sources

### Global CLI & npm Patterns
- [npm docs: Global installation](https://docs.npmjs.com/downloading-and-installing-packages-globally/) -- HIGH confidence
- [Jim Nielsen: Local CLI tools in Node](https://blog.jim-nielsen.com/2025/local-cli-tools-in-node/) -- MEDIUM confidence
- [Global vs Local packages best practices](https://medium.com/@ruben.alapont/global-vs-local-packages-in-npm-best-practices-and-use-cases-ae0489c9e52e) -- MEDIUM confidence

### State Persistence
- [egghead.io: Conf library for CLI state](https://egghead.io/lessons/javascript-store-state-on-filesystem-in-node-js-clis-with-conf) -- MEDIUM confidence
- [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir/latest/) -- HIGH confidence
- [Node.js CLI best practices (lirantal)](https://github.com/lirantal/nodejs-cli-apps-best-practices) -- HIGH confidence

### Vertical Design Research
- [Evil Martians: Designing for developer tools](https://evilmartians.com/chronicles/devs-in-mind-how-to-design-interfaces-for-developer-tools) -- HIGH confidence
- [Rigby: Marketplace UX feature guide](https://www.rigbyjs.com/blog/marketplace-ux) -- MEDIUM confidence
- [Viartisan: eLearning UI/UX design guide 2025](https://viartisan.com/2025/05/27/elearning-ui-ux-design/) -- MEDIUM confidence
- [Techstack: Social media app guide 2026](https://tech-stack.com/blog/how-to-make-a-social-media-app-complete-guide-for-2025/) -- MEDIUM confidence
- [BricxLabs: Chat UI design patterns 2025](https://bricxlabs.com/blogs/message-screen-ui-deisgn) -- MEDIUM confidence
- [Riseapps: LMS UI/UX design 2025](https://riseapps.co/lms-ui-ux-design/) -- MEDIUM confidence
- [Excited Agency: Marketplace UX best practices](https://excited.agency/blog/marketplace-ux-design) -- MEDIUM confidence
