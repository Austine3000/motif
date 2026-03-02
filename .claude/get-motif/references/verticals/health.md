# Health Design Intelligence

## Core Design Principle
**Care and clarity are the product.** Users are managing their health -- every element must feel supportive, trustworthy, and never anxiety-inducing. The UI should empower users with clear data while maintaining warmth that encourages daily engagement without clinical coldness.

## Navigation Patterns

### Standard Models
- **Mobile:** Bottom tab bar, 5 items. Today, Metrics, Log (prominent center), Insights, Profile. Primary logging action should be a raised center tab or floating action button for one-tap access.
- **Desktop:** Persistent left sidebar, 240px collapsed to 64px icon-only. Grouped by health category: Vitals, Activity, Nutrition, Medications, Mental Health. Top bar for search + notifications + profile.
- **Action sheets:** Bottom sheets for quick logging (mood, water, symptom). Half-sheet for single-entry logging, full-sheet for detailed entries requiring multiple fields.

### Vertical-Specific Rules
- Primary logging action: reachable within 1 tap from any screen
- Metric detail: accessible via tap on any metric card -- no hunting through menus
- Medication reminders: prominent placement in Today view, never buried in settings
- Search: support searching by metric type, date range, symptom keyword, medication name

## Color System

### Palette A: Calming Nature (Green-Teal)
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-50 | #ECFDF5 | #064E3B | Subtle backgrounds, metric card tints |
| primary-100 | #D1FAE5 | #065F46 | Hover states on light surfaces |
| primary-200 | #A7F3D0 | #047857 | Borders, progress ring tracks |
| primary-300 | #6EE7B7 | #059669 | Icons, decorative elements |
| primary-400 | #34D399 | #10B981 | Secondary actions, sparkline |
| primary-500 | #10B981 | #34D399 | Primary actions, brand (HSL 155, 84%, 40%) |
| primary-600 | #059669 | #6EE7B7 | Hover on primary buttons |
| primary-700 | #047857 | #A7F3D0 | Active/pressed states |
| primary-800 | #065F46 | #D1FAE5 | Text on light backgrounds |
| primary-900 | #064E3B | #ECFDF5 | Headings, high-emphasis text |
| surface-primary | #FEFDFB | #0F1A14 | Main background (warm white) |
| surface-secondary | #F7FAF8 | #1A2B22 | Cards, metric containers |
| surface-tertiary | #EFF5F1 | #2A3D32 | Nested elements, input fields |
| text-primary | #1A2E22 | #EFF5F1 | Body text (12.8:1 AAA) |
| text-secondary | #4A6354 | #8FAA9A | Supporting text (5.7:1 AA) |

### Palette B: Warm Wellness (Coral-Pink)
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-500 | #E8655A | #F0908A | Brand accent (HSL 5, 76%, 63%) |
| surface-primary | #FFFBFA | #1A0F0E | Main background (warm cream) |
| surface-secondary | #FFF5F3 | #2B1C1A | Cards |
| text-primary | #2D1512 | #FFF5F3 | Body (13.1:1 AAA) |
| text-secondary | #6B4A45 | #BF9490 | Supporting (5.4:1 AA) |

### Semantic Colors
| Semantic | Hex (Light) | Hex (Dark) | Health Meaning |
|---|---|---|---|
| Success | #16A34A | #4ADE80 | Goal achieved, healthy range, medication taken |
| Error | #DC2626 | #F87171 | Critical reading, missed medication, alert threshold |
| Warning | #D97706 | #FBBF24 | Approaching limit, needs attention, pending check-in |
| Info | #2563EB | #60A5FA | New insight available, educational content, sync complete |

### Color Anti-Patterns
- :x: Clinical white without warmth (feels institutional, not caring)
- :x: Harsh red for non-critical health data (induces unnecessary anxiety)
- :x: High-saturation neon colors (feels gamified, undermines medical credibility)
- :x: Competing accent colors in health data visualizations (obscures trends)
- :x: Dark/moody backgrounds for health data (reduces readability of critical metrics)

## Typography

### Pairing A: Warm Authority
- **Display:** Fraunces 700 at -0.02em -- warm serif with optical sizing, conveys credibility and approachability
- **Body:** Nunito 400/500 at 0em -- rounded sans-serif, friendly and highly legible at all sizes
- **Numbers:** IBM Plex Mono 500 with `font-variant-numeric: tabular-nums` -- clear metric alignment, clinical precision

### Pairing B: Modern Wellness
- **Display:** Outfit 700 at -0.015em -- geometric sans with soft curves, feels contemporary and clean
- **Body:** DM Sans 400/500 at 0em -- open apertures, excellent readability at 14-16px body sizes
- **Numbers:** IBM Plex Mono 500 with `tabular-nums` -- consistent metric column alignment

### Type Scale
| Token | Size | Line Height | Health Usage |
|---|---|---|---|
| text-xs | 0.75rem (12px) | 1.4 | Timestamps, units, normal range labels, source attribution |
| text-sm | 0.875rem (14px) | 1.45 | Metric descriptions, log details, nav items, form labels |
| text-base | 1rem (16px) | 1.5 | Body copy, log entries, form inputs (minimum body size) |
| text-lg | 1.125rem (18px) | 1.45 | Section headings, card titles, insight headers |
| text-xl | 1.25rem (20px) | 1.35 | Page subtitles, goal summaries |
| text-2xl | 1.5rem (24px) | 1.3 | Daily summary values, secondary metrics |
| text-3xl | 1.875rem (30px) | 1.2 | Primary health metric display, hero numbers |

### Typography Rules
- ALL health metric values: --font-mono with tabular-nums. Non-negotiable for data alignment.
- Units displayed at 80% of number size (e.g., "bpm", "mg/dL"), --weight-medium
- Trend indicators: ALWAYS include arrows (up-arrow/down-arrow) alongside color -- never color alone
- Normal range labels: --text-xs --text-secondary, positioned below or beside the metric value

### Typography Anti-Patterns
- :x: Decorative or script fonts anywhere (undermines medical credibility)
- :x: Ultra-thin weights below 400 (readability fails for older users, a key health demographic)
- :x: ALL CAPS for metric labels (harder to scan quickly in data-dense views)
- :x: Proportional figures in health data tables (column misalignment destroys scanability)

## Spacing & Density

### Recommended Density: Comfortable
Health data needs breathing room to avoid feeling overwhelming. Users should never feel bombarded by numbers.

### Concrete Values
| Context | Value | Token |
|---|---|---|
| Card internal padding | 20-24px | --space-5 to --space-6 |
| Metric card height | 80-96px | -- |
| Section gap | 24-32px | --space-6 to --space-8 |
| Form field gap | 16px | --space-4 |
| Button padding | 12px 24px | --space-3 --space-6 |
| Touch target minimum | 48x48px | -- |
| Log entry row height | 64-72px | -- |

## Component Specifications

### MetricCard
```xml
<component name="MetricCard" category="data-display">
  <description>Health metric with current value, trend, and context. The primary data display in any health app.</description>
  <structure>
    Card: [MetricIcon 32x32] [Label + Value stack] [Trend + Sparkline right-aligned]
    Label: --font-body --text-sm --weight-medium --text-secondary
    Value: --font-mono --text-2xl --weight-bold --text-primary, tabular-nums
    Unit: --font-mono --text-sm --weight-medium --text-secondary (80% of value size)
    Trend arrow: --text-sm, color-coded (success/error) with directional arrow
    Sparkline: 64x24px, --color-primary-400 stroke, no fill
    Normal range: --text-xs --text-secondary, bar indicator below value
  </structure>
  <dimensions>
    height: 80-96px, padding: --space-5 --space-5, gap: --space-3
    Metric icon: 32x32px, --radius-md, --surface-tertiary bg, --color-primary-500 icon
  </dimensions>
  <states>
    default: --surface-secondary background, --shadow-sm
    hover: --shadow-md, scale(1.01)
    pressed: --surface-tertiary background, scale(0.99)
    alert: --color-error border-left 3px, pulsing icon
  </states>
  <tap-target>Full card, opens metric detail view</tap-target>
</component>
```

### ProgressRing
```xml
<component name="ProgressRing" category="data-display">
  <description>Circular progress for daily goals. Steps, water intake, medication adherence.</description>
  <structure>
    Ring: SVG circle, stroke-dasharray for progress, --color-primary-500 fill stroke
    Track: --surface-tertiary stroke at 20% opacity
    Center: --font-mono --text-xl --weight-bold current value, --text-xs label below
    Label: goal name --text-sm --weight-medium --text-secondary below ring
  </structure>
  <dimensions>
    Single ring: 96x96px, stroke-width: 8px
    Compact ring: 64x64px, stroke-width: 6px
    Multiple rings: concentric, 8px gap between rings, max 3 rings
  </dimensions>
  <states>
    in-progress: --color-primary-400 stroke, percentage visible in center
    complete: --color-success stroke, checkmark replaces percentage, subtle scale pulse
    missed: --color-error stroke at 40% opacity, "Missed" label in center
  </states>
</component>
```

### LogEntry
```xml
<component name="LogEntry" category="data-display">
  <description>Single health event in a timeline. Meals, workouts, symptoms, medications.</description>
  <structure>
    Row: [CategoryIcon 36x36] [Title + Details stack] [Timestamp right-aligned]
    Title: --font-body --text-base --weight-medium --text-primary (e.g., "Morning Walk")
    Details: --font-body --text-sm --text-secondary (e.g., "32 min, 2.1 km, 187 cal")
    Timestamp: --font-mono --text-xs --text-secondary right-aligned (e.g., "8:32 AM")
    Category icon: colored by type (activity=primary, nutrition=warning, medication=info)
  </structure>
  <dimensions>
    height: 64-72px, padding: --space-4 --space-5, gap: --space-3
    Category icon: 36x36px, --radius-md, semantic color bg at 10% opacity
  </dimensions>
  <states>
    default: transparent background, --border-primary bottom border 1px
    hover: --surface-secondary background
    editing: --surface-tertiary background, inline edit fields visible
  </states>
  <tap-target>Full row, opens entry detail/edit view</tap-target>
</component>
```

## Interaction Patterns

### Core Flows
1. **Logging a health metric:** Quick-log via FAB or center tab -> select metric type -> enter value (large numeric keypad) -> optional note -> save with confirmation animation. Under 5 seconds for repeat entries.
2. **Viewing trend data:** Tap metric card -> detail view with 7/30/90-day chart -> tap data points for specifics -> pinch to zoom timeframe. Always show normal range bands on charts.
3. **Setting a health goal:** Profile or Insights -> "Set Goal" -> choose metric -> set target value -> set frequency (daily/weekly) -> confirmation with ProgressRing preview.

### States
**Loading:** Skeleton screens with shimmer (left-to-right, 1.5s cycle). Metric cards show shimmer blocks matching value + sparkline layout. Progress rings show track without fill.
**Empty:** First-time: "Welcome! Log your first health entry to start tracking your progress." with friendly illustration. No-results: "No entries for this day -- tap + to add one." Never blank space.
**Error:** Reassuring tone always. "We could not save your entry -- your data is safe locally. We will retry automatically." Sync errors: "Offline -- your logs are saved and will sync when you are back online."

### Motion
**Appropriate:** Progress ring fill animation (600ms ease-out), metric count-up (400ms), sparkline draw (500ms staggered), card entrance (200ms fade-up), goal complete celebration (subtle confetti, 800ms, once).
**Inappropriate:** :x: Bouncy/playful springs on health data (trivializes serious metrics), :x: fast aggressive transitions (creates urgency around health data), :x: gamification effects like combo streaks or level-ups (health is not a game), :x: shake animations on missed goals (punitive, discouraging).

## Accessibility Specifics
- Minimum body font size: 16px (--text-base) -- health apps skew toward older demographics
- Color-blind safe metric ranges: use pattern fills or labels in addition to green/yellow/red bands -- never color alone
- Screen reader: announce metric values with units and trend direction (e.g., "Heart rate 72 beats per minute, down 3 from yesterday")
- Medication reminders: support visual notification + audio alert + haptic feedback -- users may have impaired vision or hearing
- Touch targets: strict 48x48px minimum -- no exceptions for health-critical actions like medication confirmation
- High contrast mode: all metric values must maintain 7:1 contrast ratio minimum (AAA)

## Border Radius
| Token | Value | Reasoning |
|---|---|---|
| radius-sm | 6px | Chips, badges, small elements -- softer than fintech, friendlier feel |
| radius-md | 12px | Buttons, inputs, metric cards -- rounded enough to feel caring, not clinical |
| radius-lg | 16px | Large cards, modals -- approachable, warm container feel |
| radius-xl | 20px | Hero cards, bottom sheets -- soft, inviting primary containers |

## Shadow Style
| Token | Value | Usage |
|---|---|---|
| shadow-sm | 0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03) | Subtle metric card elevation |
| shadow-md | 0 4px 16px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.03) | Elevated cards, active states |
| shadow-lg | 0 8px 32px rgba(0,0,0,0.08), 0 4px 8px rgba(0,0,0,0.03) | Modals, popovers, overlays |

## Health-Specific Additions
- **Medication reminders:** Persistent banner in Today view when medication is due. Dismiss requires explicit "Taken" or "Skip" -- no passive dismissal. Show next dose countdown.
- **Normal range indicators:** Green/yellow/red bands on metric charts with labeled thresholds (e.g., "Normal: 60-100 bpm"). Bands use pattern fills for color-blind users.
- **HIPAA-awareness:** No PHI (Protected Health Information) in push notification previews -- show "Health update available" not "Blood pressure 140/90." Lock screen shows only app icon and generic message.
- **Date/time formatting:** Medical events use 24h or 12h per user preference. Always show day-of-week for medication schedules. Relative time for recent entries ("2h ago"), absolute for older ("Mar 1, 8:30 AM").
- **Wearable data sync:** Sync status indicator in header (last synced time, connection status). Distinguish between manual entries and device-synced data with subtle source badge. Handle sync conflicts gracefully -- prefer device data, flag manual overrides.
