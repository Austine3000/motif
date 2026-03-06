# E-commerce Design Intelligence

## Core Design Principle
**Desire drives conversion.** Users are shopping — the UI must showcase products beautifully, reduce friction to purchase, and build enough trust to complete payment. Every element either moves the user closer to checkout or gets out of the way.

## Navigation Patterns

### Standard Models
- **Mobile:** Bottom tab bar, 4-5 items. Home/Discover, Search/Browse, Cart (with badge count), Wishlist/Saved, Account. Persistent cart icon top-right. Primary action (Cart) always visible with item count badge.
- **Desktop:** Horizontal top nav with mega-menus for product categories. Utility bar above (account, orders, language/currency). Prominent search bar (center or right). Sticky cart icon with count. Breadcrumb trail on product/category pages.
- **Overlays:** Slide-in cart drawer from right (don't navigate away from browsing). Quick-view modal for product details without leaving the grid. Filter drawer on mobile (full-sheet with apply/clear).

### Vertical-Specific Rules
- Cart accessible from every screen — 1 tap/click maximum
- Product category browsing within 2 taps from home
- Search with autocomplete, visual results (thumbnail + price), and recent/trending queries
- Back-to-results preserves scroll position and applied filters
- Checkout progress indicator visible at all steps (shipping → payment → review)

## Color System

### Palette A: Warm Commerce (Amber)
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-50 | #FFF7ED | #431407 | Subtle backgrounds |
| primary-100 | #FFEDD5 | #7C2D12 | Hover states on light |
| primary-200 | #FED7AA | #9A3412 | Borders, dividers |
| primary-300 | #FDBA74 | #C2410C | Icons, decorative |
| primary-400 | #FB923C | #EA580C | Secondary actions |
| primary-500 | #EA580C | #FB923C | Primary actions, brand (HSL 21°) |
| primary-600 | #C2410C | #FDBA74 | Hover on primary |
| primary-700 | #9A3412 | #FED7AA | Active/pressed |
| primary-800 | #7C2D12 | #FFEDD5 | Text on light bg |
| primary-900 | #431407 | #FFF7ED | Headings |
| surface-primary | #FFFFFF | #171717 | Main background |
| surface-secondary | #FAFAF9 | #262626 | Cards, product grid bg |
| surface-tertiary | #F5F5F4 | #404040 | Nested elements, filters |
| text-primary | #1C1917 | #F5F5F4 | Body text (13.1:1 ✓ AAA) |
| text-secondary | #57534E | #A8A29E | Supporting (5.6:1 ✓ AA) |

### Palette B: Clean Minimal (Achromatic)
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-500 | #171717 | #FAFAFA | Brand accent (monochrome) |
| surface-primary | #FFFFFF | #09090B | Main background |
| surface-secondary | #F5F5F5 | #18181B | Cards |
| text-primary | #171717 | #FAFAFA | Body (15.8:1 ✓ AAA) |
| text-secondary | #525252 | #A3A3A3 | Supporting (5.3:1 ✓ AA) |

### Semantic Colors
| Semantic | Hex (Light) | Hex (Dark) | E-commerce Meaning |
|---|---|---|---|
| Success | #16A34A | #4ADE80 | Order confirmed, item added to cart, delivery complete |
| Error | #DC2626 | #F87171 | Payment failed, out of stock, address invalid |
| Warning | #D97706 | #FBBF24 | Low stock, price increase pending, shipping delay |
| Info | #2563EB | #60A5FA | Free shipping threshold, new arrival, back in stock |

### Color Anti-Patterns
- ❌ Blue primary competing with product photography (draws eye away from products)
- ❌ Too many accent colors distracting from product imagery (max 1 accent + semantics)
- ❌ Dark backgrounds behind product images (reduces perceived quality, kills white-bg photography)
- ❌ Neon sale badges on premium brands (clashes with brand positioning)
- ❌ Saturated CTA buttons that clash with product imagery (CTA should complement, not fight)

## Typography

### Pairing A: Editorial Commerce
- **Display:** Syne 700 at -0.02em — distinctive geometric personality, stands out in hero banners and collection titles
- **Body:** Work Sans 400/500 at 0em — clean humanist readability, excellent at 14-16px for descriptions and UI
- **Prices:** JetBrains Mono 500 with `font-variant-numeric: tabular-nums` — perfect column alignment in grids

### Pairing B: Clean Commerce
- **Display:** Manrope 700 at -0.015em — modern geometric, warm roundness for approachable premium feel
- **Body:** Karla 400/500 at 0em — humanist warmth, slightly quirky character, excellent small-size rendering
- **Prices:** DM Mono 500 with `tabular-nums` — compact monospace suited for price-dense layouts
- Note: Clash Display (Fontshare) and Gambetta (Fontshare) are alternative display options per generate-system.md

### Type Scale
| Token | Size | Line Height | E-commerce Usage |
|---|---|---|---|
| text-xs | 0.75rem (12px) | 1.4 | Badge labels, stock count, trust seal text |
| text-sm | 0.875rem (14px) | 1.45 | Product titles in grid, price labels, filter chips |
| text-base | 1rem (16px) | 1.5 | Product descriptions, form inputs, cart item details |
| text-lg | 1.125rem (18px) | 1.45 | Category headings, cart totals, section titles |
| text-xl | 1.25rem (20px) | 1.35 | Collection titles, checkout step headings |
| text-2xl | 1.5rem (24px) | 1.3 | Featured product name, order total |
| text-3xl | 1.875rem (30px) | 1.2 | Hero product name, sale banner headline |

### Typography Rules
- ALL prices: --font-mono with `tabular-nums`. Non-negotiable for grid alignment.
- Currency symbols: 80% of number size, --weight-medium
- Original price: strike-through in --text-secondary (de-emphasized)
- Sale price: --color-error or primary accent, --weight-semibold
- Savings badge: percentage in --weight-bold, parenthetical or chip format

### Typography Anti-Patterns
- ❌ Ultra-lightweight display fonts that get lost against product imagery
- ❌ Monospaced fonts for product descriptions (feels technical, not retail)
- ❌ Too many font weights creating inconsistent visual hierarchy
- ❌ Price text below 14px (must be instantly scannable, especially on mobile)

## Spacing & Density

### Recommended Density: Dual — Spacious Browsing + Compact Cart
Product browsing needs breathing room for imagery. Cart and checkout need density for efficiency.

### Concrete Values
| Context | Value | Token |
|---|---|---|
| Product grid gap | 16-24px | --space-4 to --space-6 |
| Card internal padding | 16px | --space-4 |
| Cart item row height | 72-80px | — |
| Section gap | 32-48px | --space-8 to --space-12 |
| Form field gap | 16px | --space-4 |
| Button padding | 12px 24px | --space-3 --space-6 |
| Touch target minimum | 48×48px | — |
| Mega-menu column gap | 32px | --space-8 |

## Component Specifications

### ProductCard
```xml
<component name="ProductCard" category="data-display">
  <description>Product in a grid or list. The most-viewed component in any e-commerce app — drives browsing and discovery.</description>
  <structure>
    Image: aspect-ratio 3:4 or 1:1, object-fit: cover, lazy-loaded, --surface-secondary placeholder
    Title: --font-body --text-sm --weight-medium --text-primary, max 2 lines with ellipsis
    Price: --font-mono --text-sm --weight-semibold, tabular-nums
    Sale price: --color-error, original price --text-secondary with line-through
    Rating: star icons --text-xs, count in --text-secondary
    Quick-add: --text-xs --weight-medium, appears on hover (desktop) or always visible (mobile)
    Wishlist: heart icon top-right overlay, toggles fill on tap
  </structure>
  <dimensions>
    width: fluid (grid column), image height: aspect-ratio driven
    padding: --space-3 (below image for text content)
    gap: --space-1 between text lines
  </dimensions>
  <states>
    default: --shadow-sm, --radius-md on image
    hover: --shadow-md, image scale(1.03) with overflow hidden, quick-add slides up
    loading: skeleton shimmer matching image aspect ratio + 3 text lines
    out-of-stock: image at 60% opacity, "Sold Out" overlay badge, quick-add disabled
  </states>
  <tap-target>Full card for product detail, distinct targets for quick-add and wishlist (48×48px each)</tap-target>
</component>
```

### CartItem
```xml
<component name="CartItem" category="data-display">
  <description>Single item in cart — compact for sidebar drawer, scannable for cart page.</description>
  <structure>
    Thumbnail: 64×64px, --radius-sm, object-fit: cover
    Title: --font-body --text-sm --weight-medium --text-primary, max 1 line ellipsis
    Variant: --font-body --text-xs --text-secondary (e.g., "Size: M / Color: Navy")
    Quantity: [-] [count] [+] inline selector, --text-sm, buttons 32×32px
    Line total: --font-mono --text-sm --weight-semibold, right-aligned
    Remove: X icon or "Remove" text link, --text-secondary, --text-xs
  </structure>
  <dimensions>
    height: 72-80px, padding: --space-3, gap: --space-3
    Thumbnail: 64×64px fixed
    Compact variant (drawer): height 64px, thumbnail 48×48px
  </dimensions>
  <states>
    default: --surface-primary background, --border-primary bottom border
    updating-quantity: line total shows spinner (200ms debounce)
    removing: slide-left exit animation 250ms, height collapse 200ms
    error: --color-error border-left, "Price changed" or "Only X left" inline warning
  </states>
  <tap-target>Quantity buttons 32×32px minimum, remove button 48×48px touch area</tap-target>
</component>
```

### PriceDisplay
```xml
<component name="PriceDisplay" category="data-display">
  <description>Formatted price with optional sale, savings, and installment info.</description>
  <structure>
    Current price: --font-mono --text-base (or contextual size) --weight-semibold --text-primary
    Compare-at price: --font-mono --text-sm --weight-normal --text-secondary, text-decoration: line-through
    Savings badge: "--weight-bold percentage OFF" in --color-error bg at 10% opacity, --radius-sm, --text-xs
    Installment: "or 4x $X.XX with [provider]" --text-xs --text-secondary
    Currency symbol: 80% font-size, --weight-medium, no line-break between symbol and amount
  </structure>
  <dimensions>
    inline or stacked layout depending on context (grid card: stacked, cart: inline)
    gap: --space-1 between price elements
  </dimensions>
  <states>
    regular: current price only, --text-primary
    on-sale: current price in --color-error + compare-at struck through + savings badge
    sold-out: "Sold Out" replaces price, --text-secondary, --weight-medium
    loading: skeleton shimmer, width 80px
  </states>
  <formatting>
    tabular-nums always, currency before amount (locale-aware), 2 decimal places,
    thousands separator for amounts ≥1000, no trailing zeros on whole amounts optional
  </formatting>
</component>
```

## Interaction Patterns

### Core Flows
1. **Add to Cart:** Tap quick-add → micro-confirmation (button state change + cart badge bounce 250ms) → optional "View Cart" toast 3s → continue browsing. Never navigate away from the grid.
2. **Checkout:** Progressive disclosure — shipping → payment → review → confirm. Each step validates before advancing. Back button preserves all entered data.
3. **Product Gallery:** Swipe between images (mobile), thumbnail strip click (desktop), pinch-to-zoom or loupe on hover. Fullscreen lightbox on tap.

### States
**Loading:** Skeleton screens maintaining product grid layout and card aspect ratios. Shimmer animation left-to-right, 1.5s cycle. Show 8-12 skeleton cards matching expected grid density.
**Empty:** Cart empty: large illustration + "Your cart is empty" + "Continue Shopping" CTA + "You might like" product suggestions. Search no results: "No products found" + suggested categories + clear filters CTA.
**Error:** Payment error: specific reason (card declined, expired, insufficient funds) + retry button + alternative payment methods. NEVER lose cart contents on error. Network error: "Connection lost — your cart is saved. Retrying..."

### Motion
**Appropriate:** Add-to-cart fly animation or badge bounce (250-300ms), image zoom on hover (200ms ease-out), cart badge count increment (250ms spring), price update crossfade (200ms), drawer slide-in (300ms ease-out).
**Inappropriate:** ❌ Auto-playing product carousels (users want control), ❌ aggressive countdown timers with flashing (dark pattern), ❌ parallax scroll effects on mobile (performance and motion sensitivity), ❌ full-page transitions between product pages (breaks browsing flow).

## Accessibility Specifics
- Product images: descriptive alt text including product name, color, and key feature — never just "product image"
- Prices: announced with currency by screen reader (e.g., "twenty-four dollars and ninety-nine cents")
- Cart count: `aria-live="polite"` region, announces updates (e.g., "Cart updated, 3 items")
- Color/size selectors: `aria-pressed` or `aria-checked` state, announce "selected" and "unavailable"
- Checkout progress: `aria-current="step"` on active step, steps announced as "Step 2 of 4, Payment"
- Star ratings: `aria-label="4.5 out of 5 stars, 128 reviews"` — never rely on visual stars alone

## Border Radius
| Token | Value | Reasoning |
|---|---|---|
| radius-sm | 4px | Badges, chips, small elements — crisp and clean |
| radius-md | 8px | Buttons, inputs, cart items — modern and approachable |
| radius-lg | 12-16px | Product cards, modals — friendly without being childish |

## Shadow Style
| Token | Value | Usage |
|---|---|---|
| shadow-sm | 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04) | Default card resting state |
| shadow-md | 0 4px 8px -2px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04) | Card hover, elevated elements |
| shadow-lg | 0 12px 24px -4px rgba(0,0,0,0.10), 0 4px 8px -4px rgba(0,0,0,0.05) | Modals, cart drawer, mega-menu |
| shadow-xl | 0 20px 40px -8px rgba(0,0,0,0.12), 0 8px 16px -8px rgba(0,0,0,0.06) | Lightbox overlay, elevated popovers |

## E-commerce-Specific Additions
- **Product image gallery:** Thumbnail strip below main image (desktop), swipe carousel with dot indicators (mobile), pinch-to-zoom, fullscreen lightbox with arrow navigation
- **Size/variant selectors:** Chip group layout, selected chip gets primary border + fill, out-of-stock chips show diagonal strike-through and reduced opacity, size guide link adjacent
- **Cart count badge:** Circular badge on cart icon, --color-error bg, --text-inverse text, scales with bounce animation (250ms spring) on increment, minimum 20×20px
- **Sale price formatting:** Original price in --text-secondary with line-through, sale price in --color-error or accent, savings as percentage badge or "(Save $X.XX)" suffix
- **Star rating display:** Half-star precision using filled/half/empty star icons, count displayed as "(128)" in --text-secondary --text-xs, minimum touch target 48px for "write review"
- **Free shipping progress bar:** Horizontal bar showing progress toward threshold, "--color-success fill, "$X.XX away from free shipping" label, celebrates on completion
- **Trust badges:** Row of payment method icons (Visa, Mastercard, PayPal, Apple Pay) + security seal, placed near checkout CTA, monochrome or subtle color, 24-32px icon height
- **Breadcrumb navigation:** Home > Category > Subcategory > Product, --text-xs, --text-secondary with --text-primary on current, separator "/" or "›", truncate middle on mobile
