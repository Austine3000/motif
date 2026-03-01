# [Vertical Name] Design Intelligence

> This is a template. Replace all [bracketed content] with concrete, specific values.
> Each section should contain ACTIONABLE decisions, not generic advice.
> Target: 400-500 lines with real values a design system generator can use.

## Core Design Principle
**[One sentence: what is the #1 thing the UI must communicate in this vertical?]**

[2-3 sentences expanding on why this principle matters for THIS type of product.]

## Navigation Patterns

### Standard Models
[Describe 2-3 navigation patterns that users EXPECT in this vertical. Be specific about structure.]

### Vertical-Specific Navigation Rules
[3-5 rules about navigation unique to this vertical. e.g., "Primary CTA must be reachable within 1 tap from any screen."]

## Color System

### Recommended Palettes
Provide 2-3 complete palettes with actual hex values:

**Palette A: [Name/Mood]**
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-500 | #[hex] | #[hex] | Primary actions, brand |
| primary-600 | #[hex] | #[hex] | Hover states |
| surface-primary | #[hex] | #[hex] | Main background |
| surface-secondary | #[hex] | #[hex] | Cards, sections |
| text-primary | #[hex] | #[hex] | Body text |
| text-secondary | #[hex] | #[hex] | Supporting text |

**Palette B: [Name/Mood]**
[Same format]

### Semantic Colors (Vertical Standard)
| Semantic | Hex | Usage in this vertical |
|---|---|---|
| Success | #[hex] | [specific meaning, e.g., "Transaction complete, money received"] |
| Error | #[hex] | [specific meaning] |
| Warning | #[hex] | [specific meaning] |
| Info | #[hex] | [specific meaning] |

### Color Anti-Patterns
[3-5 specific color choices to AVOID with reasoning]

## Typography

### Recommended Font Pairings
Provide 2-3 complete pairings with exact specifications:

**Pairing A:**
- Display: [Font Name] [Weight] at [tracking] — [1-sentence personality]
- Body: [Font Name] [Weight] at [tracking] — [why it works here]
- Mono/Data: [Font Name] [Weight] with `font-variant-numeric: tabular-nums` — [when to use]

**Pairing B:**
[Same format]

### Type Scale
| Token | Size | Line Height | Use For |
|---|---|---|---|
| text-xs | 0.75rem (12px) | 1.4 | [specific uses in this vertical] |
| text-sm | 0.875rem (14px) | 1.45 | [specific uses] |
| text-base | 1rem (16px) | 1.5 | [specific uses] |
| text-lg | 1.125rem (18px) | 1.45 | [specific uses] |
| text-xl | 1.25rem (20px) | 1.35 | [specific uses] |
| text-2xl | 1.5rem (24px) | 1.3 | [specific uses] |
| text-3xl | 1.875rem (30px) | 1.2 | [specific uses] |

### Typography Anti-Patterns
[3-5 specific font/typography choices to AVOID]

## Spacing & Density

### Recommended Density
[compact | comfortable | spacious] — [reasoning]

### Concrete Spacing Values
| Context | Value | Token |
|---|---|---|
| Card internal padding | [X]px | --space-[N] |
| List item height | [X]px | — |
| Section gap | [X]px | --space-[N] |
| Form field gap | [X]px | --space-[N] |
| Button padding | [X]px [Y]px | --space-[N] --space-[M] |
| Touch target minimum | [X]×[X]px | — |

## Component Specifications

### [Vertical-Specific Component 1]
```xml
<component name="[Name]" category="[category]">
  <description>[What it is, when to use it]</description>
  <structure>
    [Describe the DOM structure: what elements, what order]
  </structure>
  <dimensions>
    height: [X]px, padding: [token], gap: [token]
  </dimensions>
  <states>
    default, hover, active, loading, empty, error
  </states>
</component>
```

### [Vertical-Specific Component 2]
[Same format]

### [Vertical-Specific Component 3]
[Same format]

## Interaction Patterns

### Core Flows
[Describe the 3-5 most critical user flows with specific UX patterns for each]

### States
**Loading:** [How loading should look/feel in this vertical]
**Empty:** [How empty states should look/feel — tone, visual approach]
**Error:** [How errors should be communicated — tone, recovery pattern]

### Motion
**Appropriate:** [3-5 specific animations that work in this vertical with timing]
**Inappropriate:** [3-5 animations to AVOID with reasoning]

## Accessibility Specifics
[Requirements specific to this vertical's user base — beyond general WCAG]

## Border Radius
| Token | Value | Reasoning |
|---|---|---|
| radius-sm | [X]px | [why this value for this vertical] |
| radius-md | [X]px | |
| radius-lg | [X]px | |

## Shadow Style
| Token | Value | Usage |
|---|---|---|
| shadow-sm | [full CSS value] | [when to use] |
| shadow-md | [full CSS value] | |
| shadow-lg | [full CSS value] | |
