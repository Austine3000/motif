# Fintech Design Intelligence

## Core Design Principle
**Trust is the product.** Users are handing you their money — every pixel either builds or erodes confidence. The UI must feel secure, precise, and in control before it can feel beautiful.

## Navigation Patterns

### Standard Models
- **Mobile:** Bottom tab bar, 4-5 items. Home/Dashboard, Activity/Transactions, Send/Pay, Cards/Assets, Profile/Settings. Primary action (Send) should be a prominent center tab or floating action.
- **Desktop:** Persistent left sidebar, 240px collapsed to 64px icon-only. Grouped: Overview, Accounts, Transfers, Cards, Settings. Top bar for search + notifications + profile.
- **Action sheets:** Bottom sheets for quick actions (send, request, scan QR). Half-sheet for simple actions, full-sheet for forms requiring input.

### Vertical-Specific Rules
- "Send money" or primary CTA: reachable within 1 tap from any screen
- Transaction detail: accessible via tap on any transaction row — no hunting
- Settings/Security: prominent placement signals you take security seriously
- Search: support searching by amount, recipient, date, reference number

## Color System

### Palette A: Institutional Trust (Blue-Teal)
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-50 | #ECFDF5 | #064E3B | Subtle backgrounds |
| primary-100 | #D1FAE5 | #065F46 | Hover states on light |
| primary-200 | #A7F3D0 | #047857 | Borders, dividers |
| primary-300 | #6EE7B7 | #059669 | Icons, decorative |
| primary-400 | #34D399 | #10B981 | Secondary actions |
| primary-500 | #10B981 | #34D399 | Primary actions, brand |
| primary-600 | #059669 | #6EE7B7 | Hover on primary |
| primary-700 | #047857 | #A7F3D0 | Active/pressed |
| primary-800 | #065F46 | #D1FAE5 | Text on light bg |
| primary-900 | #064E3B | #ECFDF5 | Headings |
| surface-primary | #FFFFFF | #0F172A | Main background |
| surface-secondary | #F8FAFC | #1E293B | Cards |
| surface-tertiary | #F1F5F9 | #334155 | Nested elements |
| text-primary | #0F172A | #F1F5F9 | Body text (14.5:1 ✓ AAA) |
| text-secondary | #475569 | #94A3B8 | Supporting (5.9:1 ✓ AA) |

### Palette B: Crypto Dark Premium
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-500 | #8B5CF6 | #A78BFA | Brand accent |
| surface-primary | #FAFAF9 | #09090B | Main background |
| surface-secondary | #F5F5F4 | #18181B | Cards |
| text-primary | #1C1917 | #FAFAF9 | Body (15.4:1 ✓ AAA) |
| text-secondary | #57534E | #A8A29E | Supporting (5.2:1 ✓ AA) |

### Semantic Colors
| Semantic | Hex (Light) | Hex (Dark) | Fintech Meaning |
|---|---|---|---|
| Success | #16A34A | #4ADE80 | Transaction complete, money received, positive P&L |
| Error | #DC2626 | #F87171 | Transaction failed, payment declined, negative P&L |
| Warning | #D97706 | #FBBF24 | Pending, processing, needs action |
| Info | #2563EB | #60A5FA | Informational, neutral notification |

### Color Anti-Patterns
- ❌ Bright gradients as primary backgrounds (looks unserious for money)
- ❌ Red as brand color in Western markets (anxiety-inducing for finance)
- ❌ More than 3 accent colors competing (cognitive overload scanning numbers)
- ❌ Low-saturation grays for transaction status (must be instantly scannable)
- ❌ Neon colors for financial data (eye strain during extended portfolio monitoring)

## Typography

### Pairing A: Modern Geometric
- **Display:** Plus Jakarta Sans 700 at -0.02em — confident, geometric, contemporary
- **Body:** Plus Jakarta Sans 400/500 at 0em — clean readability, professional
- **Numbers:** JetBrains Mono 500 with `font-variant-numeric: tabular-nums` — perfect column alignment, clear at small sizes

### Pairing B: Humanist Professional
- **Display:** DM Sans 700 at -0.015em — approachable yet authoritative
- **Body:** Source Sans 3 400/500 at 0em — designed for UI, excellent at 14px
- **Numbers:** IBM Plex Mono 500 with `tabular-nums` — IBM heritage signals institutional reliability

### Type Scale
| Token | Size | Line Height | Fintech Usage |
|---|---|---|---|
| text-xs | 0.75rem (12px) | 1.4 | Timestamps, badges, fine print, exchange rates |
| text-sm | 0.875rem (14px) | 1.45 | Transaction descriptions, labels, nav items |
| text-base | 1rem (16px) | 1.5 | Body copy, form inputs, list items |
| text-lg | 1.125rem (18px) | 1.45 | Section headings, card titles |
| text-xl | 1.25rem (20px) | 1.35 | Page subtitles, feature headers |
| text-2xl | 1.5rem (24px) | 1.3 | Account balance secondary |
| text-3xl | 1.875rem (30px) | 1.2 | Account balance primary, hero numbers |

### Typography Rules
- ALL monetary values: --font-mono with tabular-nums. Non-negotiable.
- Currency symbols: 80% of number size, --weight-medium (not bold)
- Decimals in portfolio views: --text-secondary color (de-emphasized when cents don't matter)
- Percentage changes: color-coded (success/error) AND include ▲/▼ arrow — never color alone

### Typography Anti-Patterns
- ❌ Decorative/script fonts anywhere (undermines trust)
- ❌ Proportional figures in financial tables (misalignment destroys scanability)
- ❌ ALL CAPS for large numbers (harder to parse quickly)
- ❌ Bold weight for all numbers (reduces the hierarchy between primary balance and detail amounts)

## Spacing & Density

### Recommended Density: Comfortable-Dense
Users need enough data to make decisions without excessive scrolling, but not so dense that numbers blur together.

### Concrete Values
| Context | Value | Token |
|---|---|---|
| Card internal padding | 16-20px | --space-4 to --space-5 |
| Transaction row height | 64px | — |
| Transaction row padding | 12px 16px | --space-3 --space-4 |
| Section gap | 24-32px | --space-6 to --space-8 |
| Form field gap | 16px | --space-4 |
| Button padding | 12px 20px | --space-3 --space-5 |
| Touch target minimum | 48×48px | — |
| Bottom tab bar height | 56-64px | — |

## Component Specifications

### TransactionRow
```xml
<component name="TransactionRow" category="data-display">
  <description>Single transaction in a list. Most-viewed component in any fintech app.</description>
  <structure>
    Row: [icon: merchant category --icon-lg in 40x40 --radius-full container] [Description + Subtitle stack] [Amount right-aligned]
    Description: --font-body --text-sm --weight-medium --text-primary
    Subtitle: --font-body --text-xs --text-secondary (date, category, reference)
    Amount: --font-mono --text-sm --weight-semibold, right-aligned
    Positive amount: --color-success
    Negative amount: --text-primary (NOT red — red is for errors, not spending)
    Status chip: 6px radius, semantic color bg at 10% opacity, text at full
  </structure>
  <dimensions>
    height: 64px, padding: --space-3 --space-4, gap: --space-3
    Merchant icon: 40×40px, --radius-full (circular), --surface-secondary bg
  </dimensions>
  <states>
    hover: --surface-secondary background
    pressed: --surface-tertiary background, scale(0.99)
    pending: amount in --color-warning, pulsing status chip
  </states>
  <tap-target>Full row, not just the amount</tap-target>
</component>
```

### BalanceCard
```xml
<component name="BalanceCard" category="data-display">
  <description>Primary balance display. Usually the largest element on the dashboard.</description>
  <structure>
    Label: "Total Balance" or account name, --text-xs --weight-medium --text-secondary uppercase tracking-wider
    Amount: --font-mono --text-3xl --weight-bold --text-primary, tabular-nums
    Change: --text-sm, color-coded (success/error), includes ▲/▼ + percentage + absolute value
    Subtext: "Updated just now" or time period, --text-xs --text-tertiary
  </structure>
  <dimensions>
    padding: --space-6, border-radius: --radius-lg
    background: --surface-secondary or subtle gradient using primary-50
  </dimensions>
</component>
```

### StatusChip
```xml
<component name="StatusChip" category="indicator">
  <description>Transaction/payment status indicator.</description>
  <variants>
    completed: bg success at 10% opacity, text success, "Completed"
    pending: bg warning at 10% opacity, text warning, "Pending"
    failed: bg error at 10% opacity, text error, "Failed"
    processing: bg info at 10% opacity, text info, animated pulse
  </variants>
  <dimensions>
    padding: --space-1 --space-2, border-radius: --radius-sm
    font: --text-xs --weight-medium
  </dimensions>
</component>
```

## Interaction Patterns

### Transaction Confirmation Flow
1. User enters amount + recipient → show clear summary
2. Summary screen: amount (large), recipient (with verification badge), fees itemized, total
3. "Confirm" button with biometric/PIN
4. Processing state (skeleton or spinner with "Processing...")
5. Success screen: checkmark animation (300ms), reference number, "Share receipt" + "Done"
- ❌ NEVER one-tap sending without confirmation
- ❌ NEVER hide fees until the last step

### States
**Loading:** Skeleton screens with shimmer (left-to-right, 1.5s cycle). Match the density of the expected content. For transaction lists, show 5-7 skeleton rows.
**Empty:** First-time: "Welcome! Send your first payment to get started →". No-results: "No transactions this month" with suggested action. Never just blank space.
**Error:** Transaction errors MUST show: what happened, reference number, "Your funds are safe", retry or contact support. Network errors: "Connection lost — your data is safe. Retrying..."

### Motion
**Appropriate:** Balance count-up (500ms ease-out), transaction success checkmark (300ms), pull-to-refresh, card number reveal flip, chart data transition (400ms).
**Inappropriate:** ❌ Bouncy/playful springs, ❌ slow page transitions (users check balance frequently), ❌ confetti/particles (except maybe first transaction, briefly), ❌ decorative animations that delay task completion.

## Accessibility Specifics
- Financial figures: minimum 14px, monospaced, sufficient contrast for extended reading
- Color-blind safety: never convey gain/loss by color alone — always include ▲/▼ arrows
- Biometric prompts: always offer PIN/password fallback
- Transaction confirmations: must work with screen readers (announce amount, recipient, status)

## Border Radius
| Token | Value | Reasoning |
|---|---|---|
| radius-sm | 4px | Chips, badges, small elements — crisp but not sharp |
| radius-md | 8px | Buttons, inputs, cards — modern without being playful |
| radius-lg | 12px | Large cards, modals — approachable but professional |
| radius-xl | 16px | Hero cards, bottom sheets — soft for primary containers |

## Shadow Style
| Token | Value | Usage |
|---|---|---|
| shadow-sm | 0 1px 2px rgba(0,0,0,0.05) | Subtle card elevation |
| shadow-md | 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05) | Elevated cards, dropdowns |
| shadow-lg | 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04) | Modals, popovers |

<!-- Verified against Phosphor Icons @phosphor-icons/web@2.1.2 via GitHub phosphor-icons/core/assets/regular/ -->

## Icon Vocabulary

Primary library: Phosphor Icons (from icon-libraries.md domain affinity matrix)

### Navigation
| Semantic Role | Phosphor | Lucide | Material Symbols | Tabler |
|---------------|----------|--------|-----------------|--------|
| home | ph-house | house | home | ti-home |
| search | ph-magnifying-glass | search | search | ti-search |
| settings | ph-gear | settings | settings | ti-settings |
| profile | ph-user | user | person | ti-user |
| notifications | ph-bell | bell | notifications | ti-bell |

### Finance
| Semantic Role | Phosphor | Lucide | Material Symbols | Tabler |
|---------------|----------|--------|-----------------|--------|
| bank | ph-bank | landmark | account_balance | ti-building-bank |
| wallet | ph-wallet | wallet | account_balance_wallet | ti-wallet |
| credit-card | ph-credit-card | credit-card | credit_card | ti-credit-card |
| money | ph-currency-dollar | dollar-sign | payments | ti-currency-dollar |
| transfer | ph-arrows-left-right | arrow-left-right | swap_horiz | ti-transfer |
| chart | ph-chart-line-up | trending-up | trending_up | ti-trending-up |
| receipt | ph-receipt | receipt | receipt_long | ti-receipt |
| coins | ph-coins | coins | toll | ti-coins |

### Status & Feedback
| Semantic Role | Phosphor | Lucide | Material Symbols | Tabler |
|---------------|----------|--------|-----------------|--------|
| success | ph-check-circle | check-circle | check_circle | ti-circle-check |
| error | ph-x-circle | x-circle | cancel | ti-circle-x |
| warning | ph-warning | alert-triangle | warning | ti-alert-triangle |
| pending | ph-clock | clock | schedule | ti-clock |

### Actions
| Semantic Role | Phosphor | Lucide | Material Symbols | Tabler |
|---------------|----------|--------|-----------------|--------|
| send | ph-paper-plane-tilt | send | send | ti-send |
| scan-qr | ph-qr-code | qr-code | qr_code_scanner | ti-qr-code |
| security | ph-shield-check | shield-check | verified_user | ti-shield-check |
| biometric | ph-fingerprint | fingerprint | fingerprint | ti-fingerprint |
| copy | ph-copy | copy | content_copy | ti-copy |
| close | ph-x | x | close | ti-x |

## Crypto-Specific Additions
- Always show BOTH crypto amount AND fiat equivalent
- Network/chain indicator on all addresses (tiny chip: "TRC-20", "ERC-20", "SOL")
- Gas/network fee estimation before confirmation
- Wallet addresses: first 6 + last 4 chars, monospaced, with copy button
- QR code generation for receive addresses
- Real-time price with "Updated Xs ago" timestamp
- Portfolio donut chart: max 5 segments visible, "Other" bucket for remainder
