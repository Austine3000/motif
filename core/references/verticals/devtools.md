# DevTools Design Intelligence

## Core Design Principle
**Speed is the product.** Developers measure tools in keystrokes saved and milliseconds shaved -- every pixel must serve functionality, reduce cognitive load, and respect the user's expertise. The UI should feel like a precision instrument: fast to navigate, dense with information, and invisible when it's working well. Unlike general SaaS (collaborative workspaces), DevTools design is code-centric, terminal-native, and unapologetically dense. Dark mode is not a feature -- it is the default.

## Navigation Patterns

### Standard Models
- **Mobile:** Minimal -- DevTools are desktop-first. Mobile is read-only monitoring at best: build status, deployment logs, alerts. No creation or editing flows on mobile.
- **Desktop:** Dense left sidebar with icon-only collapse (56px). Multi-entity views use horizontal tabs. Terminal/console panel at bottom, resizable via drag handle. Command palette (Cmd+K) is the PRIMARY navigation mechanism -- power users never touch the sidebar. Split-pane layouts for code + preview or code + logs.
- **Action surfaces:** Command palette for all navigation, actions, and search. Contextual right-click menus on code blocks, log entries, and pipeline stages. Inline editing everywhere -- modals are a last resort.

### Vertical-Specific Rules
- Command palette (Cmd+K) reachable from any screen -- recent actions first, fuzzy search on all entities
- Keyboard shortcuts for ALL primary actions, displayed in tooltips and command palette
- Terminal/console always accessible via keyboard shortcut (Ctrl+`), persists across navigation
- Breadcrumb navigation for deep hierarchies: Org > Project > Environment > Service > Logs
- Multi-tab workspace: open multiple entities (files, logs, pipelines) simultaneously, tab overflow with dropdown
- No onboarding wizards -- developers prefer "Getting Started" docs and quick-start CLI commands

## Color System

### Palette A: Deep Navy-Slate (Code Editor)
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-50 | #EEF2FF | #1E1B4B | Subtle backgrounds, selected line tint |
| primary-100 | #E0E7FF | #312E81 | Hover states on light surfaces |
| primary-200 | #C7D2FE | #3730A3 | Borders, focus rings |
| primary-300 | #A5B4FC | #4338CA | Icons, decorative accents |
| primary-400 | #818CF8 | #6366F1 | Secondary actions, links |
| primary-500 | #6366F1 | #818CF8 | Primary actions, brand (HSL 239 84% 67%) |
| primary-600 | #4F46E5 | #A5B4FC | Hover on primary buttons |
| primary-700 | #4338CA | #C7D2FE | Active/pressed state |
| primary-800 | #3730A3 | #E0E7FF | Text on light backgrounds |
| primary-900 | #312E81 | #EEF2FF | Headings on light backgrounds |
| surface-primary | #FFFFFF | #0F1117 | Main background |
| surface-secondary | #F9FAFB | #1A1D27 | Cards, sidebar, panels |
| surface-tertiary | #F3F4F6 | #252836 | Nested elements, code block bg |
| text-primary | #111827 | #E5E7EB | Body text (14.8:1 AAA) |
| text-secondary | #6B7280 | #9CA3AF | Supporting text (5.4:1 AA) |

### Palette B: Dark Mode Native (Developer)
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-500 | #06B6D4 | #22D3EE | Brand accent (cyan -- terminal-native) |
| surface-primary | #F8FAFC | #0A0A0B | Main background (near-black) |
| surface-secondary | #F1F5F9 | #141416 | Cards, panels, editor surface |
| surface-tertiary | #E2E8F0 | #1E1E22 | Nested elements, code blocks |
| text-primary | #0F172A | #E4E4E7 | Body text (15.1:1 AAA) |
| text-secondary | #64748B | #A1A1AA | Supporting text (5.1:1 AA) |

### Semantic Colors
| Semantic | Hex (Light) | Hex (Dark) | DevTools Meaning |
|---|---|---|---|
| Success | #16A34A | #4ADE80 | Build passed, deploy success, test green, health check OK |
| Error | #DC2626 | #F87171 | Build failed, deploy error, test red, service down |
| Warning | #D97706 | #FBBF24 | Deprecation notice, rate limit approaching, flaky test, high latency |
| Info | #2563EB | #60A5FA | New release, changelog update, pull request opened |

### Color Anti-Patterns
- Never use low-contrast syntax highlighting (code readability is non-negotiable -- minimum 4.5:1 on all token colors)
- Never use warm surface tones in code contexts (developers expect cool/neutral editor surfaces)
- Never use playful gradients on functional surfaces (undermines tool credibility)
- Never use identical colors for different log severity levels (instant visual parsing is critical)
- Never use light mode as default (developers overwhelmingly prefer dark -- light should work but dark is primary)

## Typography

### Pairing A: Space Grotesk + IBM Plex Sans
- **Display:** Space Grotesk 700 at -0.02em -- geometric, futuristic precision, designed for technical contexts (Google Fonts)
- **Body:** IBM Plex Sans 400/500 at 0em -- IBM data heritage, excellent at small sizes, optimized for dense UI (Google Fonts)
- **Code:** JetBrains Mono 500 with `font-variant-numeric: tabular-nums` and `font-feature-settings: "liga" 1` -- ligatures for code readability

### Pairing B: JetBrains Mono + IBM Plex Sans
- **Display:** JetBrains Mono 700 at -0.01em -- monospace-first, code-native, unmistakably developer-oriented
- **Body:** IBM Plex Sans 400/500 at 0em -- pairs cleanly with monospace display, provides contrast for non-code UI
- **Code:** JetBrains Mono 500 -- same as display, creating a unified monospace-dominant aesthetic

### Data & Mono
**CRITICAL:** Monospace is not secondary in DevTools -- it is dominant. JetBrains Mono or Fira Code for ALL code blocks, terminal output, log viewers, API responses, commit hashes, branch names, environment variables, CLI commands, and configuration files. Proportional fonts are reserved for UI chrome (navigation labels, headings, descriptions) only.
- `font-variant-numeric: tabular-nums` always enabled
- `font-feature-settings: "liga" 1` for code ligatures (=>, !==, <=, ->)
- Minimum 13px for monospace text to ensure readability in dense log views

### Type Scale
| Token | Size | Line Height | DevTools Usage |
|---|---|---|---|
| text-xs | 0.75rem (12px) | 1.4 | Timestamps, badge labels, keyboard shortcut hints, line numbers |
| text-sm | 0.875rem (14px) | 1.45 | Log entries, sidebar labels, table cells, terminal output |
| text-base | 1rem (16px) | 1.5 | Body copy, form inputs, descriptions, code blocks |
| text-lg | 1.125rem (18px) | 1.45 | Section headings, panel titles, modal headings |
| text-xl | 1.25rem (20px) | 1.35 | Page titles, project headers |
| text-2xl | 1.5rem (24px) | 1.3 | Dashboard hero metrics, deployment count |
| text-3xl | 1.875rem (30px) | 1.2 | KPI numbers, status overview hero |

### Typography Rules
- Code blocks, terminal output, log entries: ALWAYS --font-mono, no exceptions
- Dashboard metrics and build numbers: --font-mono with tabular-nums
- API endpoints and URLs: --font-mono, truncated with ellipsis if overflow
- Table headers: uppercase, tracking-wider, --text-xs, --weight-medium
- Status labels: --text-xs, --weight-medium, semantic color
- Commit hashes, branch names, env vars: --font-mono at 90% size

### Typography Anti-Patterns
- Never use proportional fonts for code or data (misalignment in logs/terminal is unacceptable)
- Never use rounded/friendly consumer fonts (Quicksand, Nunito -- feels consumer app, not dev tool)
- Never use serif fonts for UI elements (feels editorial, not technical)
- Never use decorative display fonts (developers distrust tools that prioritize style over function)
- Never use font sizes below 12px for code/logs (eye strain during extended debugging sessions)

## Spacing & Density

### Recommended Density: Dense
DevTools users need maximum information density. Developers expect IDE-level density -- compact rows, tight padding, minimal whitespace. Spacious layouts waste screen real estate that should show more code, more logs, more data.

### Concrete Values
| Context | Value | Token |
|---|---|---|
| Card internal padding | 12px | --space-3 |
| Table row height | 32-36px | -- |
| Table cell padding | 4px 8px | --space-1 --space-2 |
| Section gap | 16px | --space-4 |
| Form field gap | 8-12px | --space-2 to --space-3 |
| Button padding | 6px 12px | --space-1.5 --space-3 |
| Touch target minimum | 32x32px | -- (mouse-first, not touch) |
| Sidebar width (expanded) | 220px | -- |
| Sidebar width (collapsed) | 56px | -- |
| Log entry row height | 24-28px | -- |

## Component Specifications

### CodeBlock
```xml
<component name="CodeBlock" category="data-display">
  <description>Syntax-highlighted code display with line numbers, copy functionality, and language badge. The most-viewed component in any DevTools product.</description>
  <structure>
    Header bar: [language badge --text-xs --weight-medium --surface-tertiary] [file path --text-xs --font-mono --text-secondary] [copy button icon-only] [expand/collapse toggle]
    Code area: --font-mono --text-sm, syntax-highlighted, line numbers in --text-secondary right-aligned in gutter
    Line numbers: --font-mono --text-xs --text-secondary, 48px gutter width, right-aligned, non-selectable
    Highlight: active line gets --surface-tertiary background, error lines get --color-error bg at 10% opacity
    Scrollbar: thin custom scrollbar matching --surface-tertiary
  </structure>
  <dimensions>
    padding: 0 (code area uses gutter + content padding internally)
    header-height: 36px, header-padding: --space-2 --space-3
    code-padding: --space-3 (left of line numbers), --space-4 (right)
    max-height: 400px with vertical scroll, full-width horizontal scroll
    border-radius: --radius-md on container
  </dimensions>
  <states>
    default: --surface-tertiary background, --border-primary border
    hover-line: --surface-secondary on hovered line (subtle)
    copied: copy button shows checkmark icon (1.5s), tooltip "Copied!"
    collapsed: header only visible, code hidden, "[N lines]" indicator
    loading: skeleton shimmer matching expected line count
    error: --color-error border, "Syntax error on line N" inline annotation
  </states>
  <keyboard>Tab indentation preserved, Cmd+A selects all code (not page), Escape unfocuses</keyboard>
</component>
```

### StatusPipeline
```xml
<component name="StatusPipeline" category="data-display">
  <description>Horizontal build/deploy pipeline showing sequential stages with pass/fail/running status. Core DevOps visibility component.</description>
  <structure>
    Pipeline: horizontal sequence of [Stage nodes] connected by [Connector lines]
    Stage node: [status icon 20x20] [stage name --text-xs --weight-medium] [duration --text-xs --font-mono --text-secondary]
    Connector: horizontal line between nodes, 2px, color matches status of preceding stage
    Stage names: Build, Test, Lint, Security Scan, Deploy (configurable)
    Summary: total duration --font-mono --text-sm right-aligned, trigger info (commit hash, branch) left-aligned
  </structure>
  <dimensions>
    pipeline-height: 48px, stage-node: 80-100px wide, connector: 24-32px wide
    padding: --space-3 --space-4
    Container: full-width, --surface-secondary background, --radius-md
  </dimensions>
  <states>
    queued: all nodes --text-secondary, connectors dashed --border-primary
    running: current node pulsing --color-info, previous nodes --color-success, upcoming nodes --text-secondary
    passed: all nodes --color-success, connectors solid --color-success, checkmark icons
    failed: failed node --color-error with X icon, subsequent nodes --text-secondary (skipped), connector turns --color-error at failure point
    cancelled: stop icon on cancelled stage, --text-secondary for remaining
  </states>
  <keyboard>Arrow keys navigate between stages, Enter opens stage detail/logs</keyboard>
</component>
```

### LogViewer
```xml
<component name="LogViewer" category="data-display">
  <description>Scrollable log output with severity coloring, timestamps, filtering, and search. Developers live in this component during debugging.</description>
  <structure>
    Toolbar: [severity filter chips: ALL|ERROR|WARN|INFO|DEBUG] [search input --font-mono] [auto-scroll toggle] [clear button]
    Log entries: [timestamp --font-mono --text-xs --text-secondary] [severity badge --text-xs --weight-medium] [message --font-mono --text-sm]
    Severity colors: ERROR=--color-error, WARN=--color-warning, INFO=--color-info, DEBUG=--text-secondary
    Search highlight: matched text gets --color-warning bg at 30% opacity
    Line count: --text-xs --text-secondary in toolbar right (e.g., "1,247 lines")
  </structure>
  <dimensions>
    toolbar-height: 36px, toolbar-padding: --space-1 --space-2
    entry-height: 24px (single-line), auto-height (multi-line with wrap)
    timestamp-width: 100px fixed, severity-badge-width: 56px fixed
    Container: fills available height (flex-grow), min-height 200px
  </dimensions>
  <states>
    streaming: auto-scroll active, new entries append at bottom with slide-in (50ms)
    paused: user scrolled up, "New logs below" indicator at bottom, auto-scroll disabled
    filtered: non-matching entries hidden, filter count shown (e.g., "Showing 42 of 1,247")
    searching: matched lines highlighted, match count in toolbar (e.g., "3 of 12 matches"), up/down arrows to navigate matches
    empty: "No logs yet. Trigger a build to see output here."
    error: "Log stream disconnected. Reconnecting..." with retry
  </states>
  <keyboard>Cmd+F opens search, G jumps to bottom, Shift+G jumps to top, arrow keys navigate matches</keyboard>
</component>
```

## Interaction Patterns

### Core Flows
1. **Triggering a build/deploy:** Cmd+K → "Deploy to staging" → confirm environment + branch → pipeline starts → auto-navigate to pipeline view with live log streaming. Or: git push triggers webhook → notification badge → click to view pipeline.
2. **Debugging via logs:** Pipeline stage fails → click failed stage → LogViewer opens with auto-filtered ERROR entries → click log entry for stack trace expansion → copy trace → search codebase. All within one view, no navigation.
3. **Keyboard-driven navigation:** Cmd+K opens command palette → type action → arrow to select → Enter to execute. All CRUD actions have keyboard shortcuts. Tab between panes. Vim-style keybindings as opt-in.

### States
**Loading:** Skeleton shimmer for code blocks and tables (left-to-right, 1.5s cycle). Inline spinners (16px) for individual operations. Never block the entire UI for a single API call. Terminal/log areas show blinking cursor during connection.
**Empty:** No projects: "Create your first project or connect a repository" with quick-start CLI snippet (copyable). No logs: "Deploy your first build to see logs here." No API keys: "Generate an API key to get started" with code example.
**Error:** API errors: include HTTP status, request ID, and link to status page. Build errors: show exact failure line with log context. Connection errors: "Log stream disconnected. Reconnecting..." with auto-retry. Never show generic "Something went wrong."

### Motion
**Appropriate:** Pipeline stage transition (150ms ease-out), log entry append (50ms slide-in), sidebar collapse/expand (200ms ease-out), command palette appear (100ms ease-out), toast notification slide-in (200ms).
**Inappropriate:** Bouncy/spring animations anywhere (developers find them distracting and unprofessional), slow page transitions (latency is the enemy), decorative loading animations (use skeleton or spinner, nothing more), parallax effects, confetti, celebration animations of any kind.

## Accessibility Specifics
- Full keyboard navigation for ALL features -- developers expect this as a baseline, not a bonus
- Visible focus ring (2px solid --border-focus, 2px offset) on all interactive elements
- Code blocks: screen reader announces language and line count, navigable by line
- Pipeline status: `aria-label` on each stage (e.g., "Build stage: passed in 2 minutes 14 seconds")
- Log severity: conveyed by text label AND color (never color alone)
- Minimum 13px font size for all monospace text, 12px only for line numbers and timestamps
- High contrast mode: code syntax highlighting adjusts to meet 4.5:1 minimum on all tokens
- Command palette: results announced via `aria-live="polite"` as they update

## Border Radius
| Token | Value | Reasoning |
|---|---|---|
| radius-sm | 2px | Badges, inline code, small elements -- sharp, code-editor aesthetic |
| radius-md | 4-6px | Buttons, inputs, cards -- minimal rounding, tool-like |
| radius-lg | 8px | Modals, panels -- slight softness without being friendly |

## Shadow Style
| Token | Value | Usage |
|---|---|---|
| shadow-sm | 0 1px 2px rgba(0,0,0,0.06) | Subtle panel elevation, toolbar separation |
| shadow-md | 0 2px 4px rgba(0,0,0,0.08) | Command palette, dropdowns |
| shadow-lg | 0 8px 16px rgba(0,0,0,0.12) | Modals only -- shadows are rare in DevTools |

Dark mode note: In dark mode, prefer border separation (1px --surface-tertiary) over shadows. Shadows on dark backgrounds are nearly invisible and add no visual information.

<!-- Icon names verified against: Lucide v0.400+, Phosphor Icons v2.1+, Material Symbols, Tabler Icons v3.0+ -->

## Icon Vocabulary

Primary library: Lucide (from icon-libraries.md domain affinity matrix)

Lucide uses bare kebab-case names with no prefix.

### Navigation
| Semantic Role | Lucide | Phosphor | Material Symbols | Tabler |
|---------------|--------|----------|-----------------|--------|
| home | house | ph-house | home | ti-home |
| search | search | ph-magnifying-glass | search | ti-search |
| settings | settings | ph-gear | settings | ti-settings |
| profile | user | ph-user | person | ti-user |
| notifications | bell | ph-bell | notifications | ti-bell |

### Developer & Infrastructure
| Semantic Role | Lucide | Phosphor | Material Symbols | Tabler |
|---------------|--------|----------|-----------------|--------|
| terminal | terminal | ph-terminal-window | terminal | ti-terminal-2 |
| code | code | ph-code | code | ti-code |
| git-branch | git-branch | ph-git-branch | fork_right | ti-git-branch |
| git-commit | git-commit-horizontal | ph-git-commit | commit | ti-git-commit |
| webhook | webhook | ph-webhooks-logo | webhook | ti-webhook |
| api-key | key | ph-key | key | ti-key |
| database | database | ph-database | storage | ti-database |
| server | server | ph-hard-drives | dns | ti-server |

### Status & Feedback
| Semantic Role | Lucide | Phosphor | Material Symbols | Tabler |
|---------------|--------|----------|-----------------|--------|
| success | check-circle | ph-check-circle | check_circle | ti-circle-check |
| error | x-circle | ph-x-circle | cancel | ti-circle-x |
| warning | alert-triangle | ph-warning | warning | ti-alert-triangle |
| info | info | ph-info | info | ti-info-circle |
| loading | loader | ph-spinner | progress_activity | ti-loader |

### Actions
| Semantic Role | Lucide | Phosphor | Material Symbols | Tabler |
|---------------|--------|----------|-----------------|--------|
| play | play | ph-play | play_arrow | ti-player-play |
| stop | square | ph-stop | stop | ti-player-stop |
| copy | copy | ph-copy | content_copy | ti-copy |
| filter | filter | ph-funnel | filter_list | ti-filter |
| download | download | ph-download-simple | download | ti-download |
| add | plus | ph-plus | add | ti-plus |

## DevTools-Specific Additions
- **Command palette as primary nav:** Cmd+K is not supplementary -- it is the PRIMARY navigation. Recent actions, fuzzy search across all entities (projects, files, deployments, logs, settings). Keyboard shortcut hints on every result. This is what distinguishes DevTools from SaaS where sidebar is primary.
- **Terminal/console panel:** Persistent bottom panel with resizable drag handle. Supports multiple tabs (terminal sessions, build output, test results). Vim/Emacs keybinding modes. Auto-scrolling with pause-on-scroll behavior. This panel is always available -- it never fully closes.
- **Build pipeline visualization:** Horizontal stage graph (Build > Test > Lint > Deploy) with real-time status updates. Click any stage to see its logs. Failed stages show inline error summary without navigating away. Duration per stage in monospace.
- **API documentation patterns:** Endpoint reference with method badge (GET green, POST blue, PUT orange, DELETE red), path in monospace, expandable request/response examples, "Try it" interactive panel, curl command generation with copy button.
- **Log-first debugging:** LogViewer is not secondary -- it is a primary workspace view. Severity filtering, regex search, time-range selection, log correlation across services. Auto-scroll with "pause on scroll-up" behavior. Keyboard navigation between matches.
- **Dark mode as default:** Unlike SaaS where dark mode is an accessibility feature, DevTools ships dark-mode-first. Light mode exists for edge cases (outdoor use, projector presentations) but all design decisions optimize for dark backgrounds first.
- **Monospace-dominant typography:** JetBrains Mono is not relegated to code snippets -- it appears in headings (Pairing B), metrics, navigation labels, and anywhere data precision matters. This visual density signals "this is a tool for developers" at first glance.
