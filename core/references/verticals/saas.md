# SaaS Design Intelligence

## Core Design Principle
**Efficiency is the product.** Users are working, not browsing — every pixel must minimize clicks, maximize information density, and stay out of the way. The UI should feel like a precision instrument: fast to navigate, predictable in behavior, and invisible when it's working well. Beautiful SaaS design is the kind you don't notice because it never interrupts your flow.

## Navigation Patterns

### Standard Models
- **Mobile:** Hamburger menu or bottom tab bar, 4-5 items. Home/Dashboard, Projects/Workspace, Inbox/Notifications, Search, Settings. SaaS on mobile is a companion view — prioritize read and triage over creation.
- **Desktop:** Persistent left sidebar, 240-280px expanded, 56-72px collapsed to icon-only. Grouped by product area (e.g., Projects, Teams, Analytics, Settings). Command palette (Cmd+K) for power users. Top bar for breadcrumbs + search + notifications + profile.
- **Action surfaces:** Command palette for quick navigation and actions. Contextual menus (right-click) for item-level operations. Inline editing over modal forms where possible.

### Vertical-Specific Rules
- Keyboard navigation for all primary actions — power users never leave the keyboard
- Breadcrumb trail for deep hierarchies (Workspace > Project > Board > Item)
- Workspace/project switcher always accessible (top-left or sidebar header)
- Search scoped to current context by default, with "Search all" expansion
- Cmd+K command palette: reachable from any screen, recent actions first

## Color System

### Palette A: Professional Indigo (Blue-Purple)
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-50 | #EEF2FF | #1E1B4B | Subtle backgrounds, selected row tint |
| primary-100 | #E0E7FF | #312E81 | Hover states on light surfaces |
| primary-200 | #C7D2FE | #3730A3 | Borders, focus rings (light) |
| primary-300 | #A5B4FC | #4338CA | Icons, decorative accents |
| primary-400 | #818CF8 | #6366F1 | Secondary actions, links |
| primary-500 | #6366F1 | #818CF8 | Primary actions, brand (HSL 239 84% 67%) |
| primary-600 | #4F46E5 | #A5B4FC | Hover on primary buttons |
| primary-700 | #4338CA | #C7D2FE | Active/pressed state |
| primary-800 | #3730A3 | #E0E7FF | Text on light backgrounds |
| primary-900 | #312E81 | #EEF2FF | Headings on light backgrounds |
| surface-primary | #FFFFFF | #0F1117 | Main background |
| surface-secondary | #F9FAFB | #1A1D27 | Cards, sidebar |
| surface-tertiary | #F3F4F6 | #252836 | Nested elements, table stripes |
| text-primary | #111827 | #F3F4F6 | Body text (15.3:1 AAA) |
| text-secondary | #6B7280 | #9CA3AF | Supporting text (5.4:1 AA) |

### Palette B: Neutral + Accent
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-500 | #6D28D9 | #A78BFA | Brand accent (violet) |
| surface-primary | #FFFFFF | #0A0A0B | Main background |
| surface-secondary | #F4F4F5 | #18181B | Cards, panels |
| text-primary | #18181B | #FAFAFA | Body text (16.1:1 AAA) |
| text-secondary | #71717A | #A1A1AA | Supporting text (4.8:1 AA) |

### Semantic Colors
| Semantic | Hex (Light) | Hex (Dark) | SaaS Meaning |
|---|---|---|---|
| Success | #16A34A | #4ADE80 | Action completed, deployment success, build passed |
| Error | #DC2626 | #F87171 | Operation failed, limit exceeded, build failed |
| Warning | #D97706 | #FBBF24 | Trial expiring, usage approaching limit, deprecation |
| Info | #2563EB | #60A5FA | New feature, changelog update, system notification |

### Color Anti-Patterns
- :x: Overly colorful dashboards — visual noise competes with data density
- :x: Warm surface tones in data contexts — SaaS users expect cool/neutral workspaces
- :x: Playful gradients on functional surfaces — undermines professional efficiency
- :x: Inconsistent chart color sequences — reuse the same ordered palette across all visualizations
- :x: Saturated backgrounds competing with data — surfaces should recede, data should pop

## Typography

### Pairing A: Engineering Precision
- **Display:** Space Grotesk 700 at -0.02em — geometric, futuristic precision, designed for technical contexts (Google Fonts)
- **Body:** IBM Plex Sans 400/500 at 0em — IBM data heritage, excellent at small sizes, optimized for UI (Google Fonts)

### Pairing B: Modern Clarity
- **Display:** Manrope 700 at -0.015em — distinctive semi-rounded geometry, modern and confident (Google Fonts primary; Bricolage Grotesque on Fontshare as alternative)
- **Body:** Source Sans 3 400/500 at 0em — designed by Paul Hunt for Adobe, optimal UI readability at 14-16px (Google Fonts)

### Data & Mono
- JetBrains Mono 500 or IBM Plex Mono with `font-variant-numeric: tabular-nums` for dashboards, metrics, code snippets, and API references

### Type Scale
| Token | Size | Line Height | SaaS Usage |
|---|---|---|---|
| text-xs | 0.75rem (12px) | 1.4 | Timestamps, badges, table metadata, keyboard shortcut hints |
| text-sm | 0.875rem (14px) | 1.45 | Table cells, sidebar labels, form labels, nav items |
| text-base | 1rem (16px) | 1.5 | Body copy, form inputs, list items, descriptions |
| text-lg | 1.125rem (18px) | 1.45 | Section headings, card titles, modal headings |
| text-xl | 1.25rem (20px) | 1.35 | Page titles, workspace headers |
| text-2xl | 1.5rem (24px) | 1.3 | Feature headers, settings page titles |
| text-3xl | 1.875rem (30px) | 1.2 | Dashboard hero metrics, KPI numbers |

### Typography Rules
- Dashboard metrics: --font-mono with tabular-nums for aligned number columns
- Code snippets, API keys, commit hashes: always --font-mono
- Table headers: uppercase, tracking-wider, --text-xs, --weight-medium
- Status labels: --text-xs, --weight-medium, semantic color

### Typography Anti-Patterns
- :x: Serif fonts for UI labels — feels editorial, not functional
- :x: Rounded/friendly consumer fonts (e.g., Quicksand, Nunito) — feels consumer app, not B2B tool
- :x: Decorative display fonts — distracts from content density
- :x: More than 3 font weights on one screen — dilutes hierarchy, increases load

## Spacing & Density

### Recommended Density: Comfortable-Dense
Information density matters — SaaS users scan tables, lists, and dashboards — but not at the cost of scannability. Compact enough to show data, spacious enough to click accurately.

### Concrete Values
| Context | Value | Token |
|---|---|---|
| Card internal padding | 16px | --space-4 |
| Table row height | 40-48px | — |
| Table cell padding | 8px 12px | --space-2 --space-3 |
| Section gap | 24px | --space-6 |
| Form field gap | 12-16px | --space-3 to --space-4 |
| Button padding | 8px 16px | --space-2 --space-4 |
| Touch target minimum | 44x44px | — |
| Sidebar width (expanded) | 240px | — |
| Sidebar width (collapsed) | 56px | — |

## Component Specifications

### DataTable
```xml
<component name="DataTable" category="data-display">
  <description>Sortable, filterable table with column management. The most critical SaaS component — users spend 60%+ of time in tables.</description>
  <structure>
    Header row: [Checkbox] [Column headers with sort indicators] [Actions column]
    Column header: --font-body --text-xs --weight-medium --text-secondary uppercase tracking-wider
    Data row: [Checkbox] [Cell values] [Row action menu ...]
    Cell text: --font-body --text-sm --text-primary
    Numeric cells: --font-mono --text-sm tabular-nums right-aligned
    Pagination: [Page info] [Rows per page selector] [Prev/Next]
  </structure>
  <dimensions>
    header-height: 40px, row-height: 44px, cell-padding: --space-2 --space-3
    Checkbox column: 40px fixed width
    Minimum column width: 80px, resizable via drag handle
  </dimensions>
  <states>
    default: --surface-primary background, --border-primary bottom border on rows
    hover: --surface-secondary background on row
    selected: --primary-50 background, checkbox checked, bulk action bar appears
    loading: skeleton shimmer rows (show 8-10 rows), column headers remain visible
    empty: centered illustration + "No results" + suggested action CTA
  </states>
  <keyboard>Tab through cells, Enter to open row, Space to select, Arrow keys for navigation</keyboard>
</component>
```

### CommandPalette
```xml
<component name="CommandPalette" category="navigation">
  <description>Cmd+K triggered overlay for quick navigation, actions, and search. Power user accelerator.</description>
  <structure>
    Overlay: centered modal, 640px max-width, --surface-primary background
    Search input: --font-body --text-base, placeholder "Type a command or search...", auto-focused
    Results: categorized list [Category label] [Result items with icon + title + shortcut hint]
    Category label: --text-xs --weight-medium --text-secondary uppercase
    Result item: [icon: contextual --icon-sm] [Title --text-sm] [Shortcut badge --text-xs --surface-tertiary]
    Footer: navigation hints "↑↓ Navigate  ↵ Open  esc Close"
  </structure>
  <dimensions>
    width: min(640px, 90vw), max-height: 480px
    input-padding: --space-4, result-item-height: 40px, result-padding: --space-2 --space-3
    backdrop: rgba(0,0,0,0.5)
  </dimensions>
  <states>
    open: fade-in backdrop + scale input from 95% to 100%, 150ms ease-out
    searching: spinner in input right, debounce 200ms
    results: categorized list, first item auto-highlighted
    empty: "No results for [query]" + suggested actions
    error: "Search unavailable" + retry link
  </states>
  <animation>appear: opacity 0→1 + scale 0.95→1, 150ms ease-out; dismiss: opacity 1→0, 100ms</animation>
</component>
```

### FilterBar
```xml
<component name="FilterBar" category="navigation">
  <description>Horizontal bar for filtering, searching, and organizing table/list data.</description>
  <structure>
    Bar: [Search input] [Filter chips] [Saved views dropdown] [Sort toggle] [Active filter count badge]
    Search input: icon-left (magnifying glass), --text-sm, placeholder "Filter..."
    Filter chip: --text-xs --weight-medium, --surface-tertiary bg, --radius-sm, removable (x icon)
    Active chip: --primary-50 bg, --primary-700 text, --primary-200 border
    Saved views: dropdown with saved filter combinations, "Save current view" option
    Sort toggle: icon button, current sort field + direction indicator (▲/▼)
    Count badge: --text-xs --primary-500 bg --text-inverse, circular, shows number of active filters
  </structure>
  <dimensions>
    bar-height: 48px, padding: --space-2 --space-3
    search-input-width: 200-280px, chip-padding: --space-1 --space-2, chip-gap: --space-2
  </dimensions>
  <states>
    default: search input + "Add filter" button, no active chips
    active-filters: chips displayed inline, count badge visible, "Clear all" link appears
    expanded: filter dropdown open with column options, operators, value inputs
  </states>
  <tap-target>Each chip and control meets 44x44px minimum</tap-target>
</component>
```

## Interaction Patterns

### Core Flows
1. **Creating a new resource:** Cmd+K or "New" button → inline form or slide-over panel (not full-page navigation). Auto-save draft. Submit returns to list with new item highlighted.
2. **Filtering and searching data:** FilterBar search is instant (client-side for <1000 rows, debounced server for larger sets). Filter chips are additive. Saved views persist across sessions.
3. **Keyboard-driven navigation:** Cmd+K opens command palette → type action → arrow to select → Enter to execute. All primary CRUD actions have keyboard shortcuts displayed in tooltips and command palette.

### States
**Loading:** Skeleton shimmer for tables and cards (left-to-right, 1.5s cycle). Inline spinners (16px) for individual actions (save, delete). Never block the entire page for a single operation.
**Empty:** First-time: "Welcome to [Workspace]. Create your first [resource] to get started →" with illustration and primary CTA. No-results: "No items match your filters" with "Clear filters" link. Never just blank space.
**Error:** Inline error messages with retry button for recoverable errors — never modal. Toast notifications for background operation failures. Include error code for support reference.

### Motion
**Appropriate:** Sidebar collapse/expand (200ms ease-out), command palette appear (150ms ease-out), row selection highlight (100ms), toast slide-in from top-right (250ms ease-out), dropdown open (150ms).
**Inappropriate:** :x: Full page transitions between views, :x: bouncy/spring animations, :x: decorative motion on functional elements, :x: auto-playing feature demos, :x: parallax scrolling in dashboards.

## Accessibility Specifics
- Full keyboard navigation for all features — tab order follows visual layout
- Visible focus ring (2px solid --border-focus, 2px offset) on all interactive elements
- aria-labels on icon-only buttons (e.g., "Sort ascending", "Open row actions", "Collapse sidebar")
- Table column sort state announced to screen readers via aria-sort attribute
- Command palette results announced as aria-live="polite" region as results update
- Filter state changes announced via aria-live for screen reader users
- Minimum 14px font size for all interactive text, 12px only for supplementary metadata

## Border Radius
| Token | Value | Reasoning |
|---|---|---|
| radius-sm | 4px | Chips, badges, small inputs — crisp and precise |
| radius-md | 8px | Buttons, cards, dropdowns — modern without being playful |
| radius-lg | 12px | Modals, panels, large containers — professional, balanced |

## Shadow Style
| Token | Value | Usage |
|---|---|---|
| shadow-sm | 0 1px 2px rgba(0,0,0,0.05) | Subtle card elevation, table header sticky |
| shadow-md | 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05) | Dropdowns, popovers, filter bar |
| shadow-lg | 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04) | Command palette, modals, slide-over panels |

<!-- Verified against Lucide lucide@0.576.0 via GitHub lucide-icons/lucide/icons/ -->

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

### SaaS & Productivity
| Semantic Role | Lucide | Phosphor | Material Symbols | Tabler |
|---------------|--------|----------|-----------------|--------|
| dashboard | layout-dashboard | ph-squares-four | dashboard | ti-layout-dashboard |
| layers | layers | ph-stack | layers | ti-stack-2 |
| inbox | inbox | ph-tray | inbox | ti-inbox |
| kanban | columns-3 | ph-kanban | view_column | ti-columns-3 |
| terminal | terminal | ph-terminal-window | terminal | ti-terminal-2 |
| webhook | webhook | ph-webhooks-logo | webhook | ti-webhook |
| api-key | key | ph-key | key | ti-key |
| git-branch | git-branch | ph-git-branch | fork_right | ti-git-branch |

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
| filter | filter | ph-funnel | filter_list | ti-filter |
| sort | arrow-up-down | ph-arrows-down-up | sort | ti-arrows-sort |
| add | plus | ph-plus | add | ti-plus |
| edit | pencil | ph-pencil-simple | edit | ti-pencil |
| close | x | ph-x | close | ti-x |

## SaaS-Specific Additions
- **Keyboard shortcuts display:** Footer hint bar showing context-sensitive shortcuts (e.g., "? Help  N New  / Search"). Full shortcut reference via "?" key press in modal overlay.
- **Onboarding checklists:** Dismissible card with progress bar (e.g., "3 of 5 steps complete"). Steps: Create workspace, invite team, connect integration, create first project, customize settings.
- **Usage meters / quota bars:** Horizontal progress bar with current/limit label (e.g., "8,420 / 10,000 API calls"). Color transitions: --color-success below 75%, --color-warning at 75-90%, --color-error above 90%.
- **Changelog / notification patterns:** Badge count on bell icon (top-right). Notification drawer slides in from right (250ms). Unread items: --primary-50 background. Changelog entries: version tag + date + summary.
- **Settings architecture:** Three-tier hierarchy: Workspace settings (billing, integrations, security) > Team settings (permissions, defaults) > Personal settings (profile, preferences, API keys). Left sidebar sub-navigation within settings.
- **API key display:** Masked by default (sk-****...****abcd). "Reveal" button with re-authentication. "Copy" button with toast confirmation. "Revoke" with confirmation dialog: "This action cannot be undone. Any integrations using this key will stop working."
