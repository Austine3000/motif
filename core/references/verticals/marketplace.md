# Marketplace Design Intelligence

## Core Design Principle
**Trust between strangers is the product.** Users are buying from and selling to people they don't know -- the UI must build confidence in both the platform and individual sellers. Every element either verifies a seller's credibility, protects a buyer's investment, or facilitates transparent peer-to-peer communication. Unlike one-sided e-commerce (store-to-buyer), marketplace design must serve two audiences simultaneously: buyers browsing and evaluating, and sellers listing and managing.

## Navigation Patterns

### Standard Models
- **Mobile:** Bottom tab bar, 5 items. Browse/Home, Search, Sell/List [prominent center tab with accent color], Messages, Profile. The "Sell" tab should be visually elevated (larger icon, brand color fill) to encourage listing. Persistent search bar at top of browse.
- **Desktop:** Horizontal top nav with category mega-menus (organized by vertical: Electronics, Fashion, Home, etc.). Prominent search bar center-aligned with autocomplete and recent searches. Right-side utility: Messages (with unread badge), Sell button (primary CTA), Profile dropdown. Seller dashboard uses a left sidebar with icon-only collapse (64px).
- **Overlays:** Offer/bid sheets from bottom (mobile) or slide-in panel from right (desktop). Message threads in-context without leaving listing detail. Quick-view listing preview on hover (desktop grid).

### Vertical-Specific Rules
- Dual-mode interface: buyer view vs seller view, switchable via profile menu or top toggle
- "Sell" / "List an item" reachable within 1 tap from any screen
- Listing detail accessible via tap on any listing card -- no intermediate pages
- Search supports: keywords, category, price range, condition, location, seller rating
- Messages between buyer and seller always accessible from listing detail and from global messages tab
- Seller verification badges visible on every seller touchpoint (listing card, profile, message thread)

## Color System

### Palette A: Trustworthy Green (Marketplace Safety)
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-50 | #ECFDF5 | #064E3B | Subtle backgrounds, verified seller tint |
| primary-100 | #D1FAE5 | #065F46 | Hover states on light surfaces |
| primary-200 | #A7F3D0 | #047857 | Borders, dividers, verification outlines |
| primary-300 | #6EE7B7 | #059669 | Icons, decorative accents |
| primary-400 | #34D399 | #10B981 | Secondary actions, seller trust indicators |
| primary-500 | #059669 | #34D399 | Primary actions, brand (HSL 161 96% 31%) |
| primary-600 | #047857 | #6EE7B7 | Hover on primary buttons |
| primary-700 | #065F46 | #A7F3D0 | Active/pressed state |
| primary-800 | #064E3B | #D1FAE5 | Text on light backgrounds |
| primary-900 | #022C22 | #ECFDF5 | Headings on light backgrounds |
| surface-primary | #FFFFFF | #111827 | Main background |
| surface-secondary | #F9FAFB | #1F2937 | Cards, listing grid bg |
| surface-tertiary | #F3F4F6 | #374151 | Nested elements, filters panel |
| text-primary | #111827 | #F3F4F6 | Body text (15.3:1 AAA) |
| text-secondary | #6B7280 | #9CA3AF | Supporting text (5.4:1 AA) |

### Palette B: Neutral + Bold Blue (Premium Feel)
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-500 | #1D4ED8 | #60A5FA | Brand accent (bold blue) |
| surface-primary | #FFFFFF | #0F172A | Main background |
| surface-secondary | #F8FAFC | #1E293B | Cards, panels |
| text-primary | #0F172A | #F1F5F9 | Body text (14.5:1 AAA) |
| text-secondary | #475569 | #94A3B8 | Supporting text (5.9:1 AA) |

### Semantic Colors
| Semantic | Hex (Light) | Hex (Dark) | Marketplace Meaning |
|---|---|---|---|
| Success | #16A34A | #4ADE80 | Item sold, payment received, shipped, delivery confirmed |
| Error | #DC2626 | #F87171 | Listing rejected, payment failed, dispute opened, seller banned |
| Warning | #D97706 | #FBBF24 | Price drop, bid ending soon, low seller rating, item reported |
| Info | #2563EB | #60A5FA | New message from buyer/seller, offer received, price alert |

### Color Anti-Patterns
- Never use aggressive red as brand color (creates anxiety in peer-to-peer transactions)
- Never use dark backgrounds behind product photos (reduces perceived product quality and seller professionalism)
- Never use more than 1 accent color competing with product imagery (listings are the content)
- Never use low-contrast seller rating indicators (trust signals must be instantly readable)
- Never use identical color treatment for buyer and seller actions (dual-mode requires visual distinction)

## Typography

### Pairing A: Syne + Work Sans
- **Display:** Syne 700 at -0.02em -- distinctive geometric personality, editorial feel for collection headers and category titles
- **Body:** Work Sans 400/500 at 0em -- clean humanist readability, excellent at 14-16px for listing descriptions and UI labels
- **Prices:** JetBrains Mono 500 with `font-variant-numeric: tabular-nums` -- perfect column alignment in listing grids

### Pairing B: Manrope + Karla
- **Display:** Manrope 700 at -0.015em -- modern geometric, warm roundness for approachable premium marketplace feel
- **Body:** Karla 400/500 at 0em -- humanist warmth, slightly quirky character, friendly for peer-to-peer context
- **Prices:** DM Mono 500 with `tabular-nums` -- compact monospace suited for price-dense browse views

### Data & Mono
- All prices: --font-mono with `font-variant-numeric: tabular-nums`. Non-negotiable for grid alignment.
- Offer amounts, shipping costs, seller metrics: always monospaced for scanability.

### Type Scale
| Token | Size | Line Height | Marketplace Usage |
|---|---|---|---|
| text-xs | 0.75rem (12px) | 1.4 | Condition badges, location labels, seller response time, listing age |
| text-sm | 0.875rem (14px) | 1.45 | Listing titles in grid, price labels, filter chips, seller name |
| text-base | 1rem (16px) | 1.5 | Listing descriptions, form inputs, message text |
| text-lg | 1.125rem (18px) | 1.45 | Category headings, offer summary, section titles |
| text-xl | 1.25rem (20px) | 1.35 | Listing detail title, seller profile heading |
| text-2xl | 1.5rem (24px) | 1.3 | Featured listing name, total price |
| text-3xl | 1.875rem (30px) | 1.2 | Hero category headline, promotional banner |

### Typography Rules
- ALL prices: --font-mono with tabular-nums. Non-negotiable for grid alignment.
- Currency symbols: 80% of number size, --weight-medium
- Original price (if reduced): strike-through in --text-secondary
- Offer/bid amounts: --weight-semibold, slightly larger than list price to draw attention
- Seller rating numbers: --font-mono for consistent star-count alignment

### Typography Anti-Patterns
- Never use decorative/script fonts (undermines trust in peer-to-peer context)
- Never use proportional figures in price grids (misalignment destroys scanability)
- Never use ultra-thin weights for prices or seller metrics (must be instantly readable)
- Never use all-caps for listing titles (feels aggressive, reduces readability)

## Spacing & Density

### Recommended Density: Moderate
Marketplace browsing needs breathing room for product imagery and seller trust signals, but should show enough listings per screen to enable comparison shopping.

### Concrete Values
| Context | Value | Token |
|---|---|---|
| Listing grid gap | 16-24px | --space-4 to --space-6 |
| Card internal padding | 16px | --space-4 |
| Listing row height (list view) | 80px | -- |
| Section gap | 24-32px | --space-6 to --space-8 |
| Form field gap | 16px | --space-4 |
| Button padding | 12px 24px | --space-3 --space-6 |
| Touch target minimum | 48x48px | -- |
| Seller profile section gap | 16px | --space-4 |

## Component Specifications

### ListingCard
```xml
<component name="ListingCard" category="data-display">
  <description>Product listing in a grid or list. The primary browse component -- must convey product, price, seller trust, and condition at a glance.</description>
  <structure>
    Image: aspect-ratio 1:1, object-fit: cover, lazy-loaded, --surface-secondary placeholder
    Title: --font-body --text-sm --weight-medium --text-primary, max 2 lines with ellipsis
    Price: --font-mono --text-sm --weight-semibold, tabular-nums
    Condition badge: --text-xs --weight-medium, chip format (New/Like New/Good/Fair)
    Seller info: [avatar 24x24 --radius-full] [name --text-xs] [rating stars --text-xs]
    Location: --text-xs --text-secondary, pin icon prefix
    Wishlist: heart icon top-right overlay, toggles fill on tap
  </structure>
  <dimensions>
    width: fluid (grid column), image height: aspect-ratio driven
    padding: --space-3 (below image for text content)
    gap: --space-1 between text lines
    Condition badge: padding --space-1 --space-2, --radius-sm
  </dimensions>
  <states>
    default: --shadow-sm, --radius-md on image
    hover: --shadow-md, image scale(1.03) with overflow hidden
    loading: skeleton shimmer matching image aspect ratio + 4 text lines
    sold: image at 50% opacity, "SOLD" overlay badge in --color-success bg, price struck through
  </states>
  <tap-target>Full card for listing detail, distinct targets for wishlist and seller profile (48x48px each)</tap-target>
</component>
```

### SellerProfile
```xml
<component name="SellerProfile" category="data-display">
  <description>Seller identity and trust signals. Appears on listing detail, seller page, and message threads. Must build buyer confidence.</description>
  <structure>
    Avatar: 56x56px, --radius-full, object-fit: cover, --surface-secondary fallback with initials
    Name: --font-body --text-base --weight-semibold --text-primary
    Verification badge: checkmark icon in --color-success, positioned adjacent to name
    Rating: [filled/empty star icons --text-sm] [numeric score --font-mono --text-sm] [review count --text-xs --text-secondary]
    Response time: --text-xs --text-secondary, clock icon prefix (e.g., "Usually responds within 1 hour")
    Member since: --text-xs --text-secondary (e.g., "Member since 2024")
    Stats row: [Items sold count] [Rating percentage] [Response rate]
  </structure>
  <dimensions>
    padding: --space-4, gap: --space-3 between rows
    Avatar: 56x56px fixed
    Compact variant (listing card inline): avatar 24x24px, name + rating only
  </dimensions>
  <states>
    default: --surface-secondary background, --radius-lg
    verified: --color-success left border accent (3px), badge visible
    new-seller: "New Seller" chip in --color-info, no rating yet placeholder
    suspended: dimmed at 60% opacity, "Account under review" label
  </states>
  <tap-target>Full profile card links to seller page, 48x48px tap area on avatar and name</tap-target>
</component>
```

### OfferPanel
```xml
<component name="OfferPanel" category="action">
  <description>Price and offer interface on listing detail. Handles both fixed-price and negotiable listings.</description>
  <structure>
    Current price: --font-mono --text-2xl --weight-bold --text-primary, tabular-nums
    Original price (if reduced): --font-mono --text-sm --text-secondary, line-through
    Offer input: text field with currency prefix, --font-mono, placeholder "Enter your offer"
    Buy Now CTA: full-width primary button, --weight-semibold
    Make Offer CTA: full-width secondary/outline button, --weight-medium
    Shipping estimate: --text-xs --text-secondary, truck icon prefix (e.g., "Estimated $5.99 shipping")
    Buyer protection: --text-xs --text-secondary, shield icon prefix ("Protected by Marketplace Guarantee")
  </structure>
  <dimensions>
    padding: --space-5, gap: --space-3 between elements
    CTA buttons: height 48px, --radius-md
    Offer input: height 44px, --radius-md
  </dimensions>
  <states>
    fixed-price: Buy Now only, no offer input
    negotiable: Both Buy Now and Make Offer visible, offer input active
    offer-sent: "Offer sent" confirmation with checkmark, awaiting seller response
    offer-accepted: --color-success highlight, "Proceed to checkout" CTA replaces offer input
    sold: all inputs disabled, "This item has been sold" message
  </states>
  <tap-target>CTA buttons full-width, minimum 48px height</tap-target>
</component>
```

## Interaction Patterns

### Core Flows
1. **Listing an item:** Sell tab → photo capture/upload (multi-photo, drag to reorder) → title + description → category + condition → set price (fixed or negotiable) → shipping options → review → publish. Progressive disclosure, auto-save draft.
2. **Making an offer:** Listing detail → tap "Make Offer" → enter amount → optional message to seller → confirm offer → wait for seller response (push notification). Seller sees offer in dashboard + notification.
3. **Buyer-seller messaging:** Listing detail → "Message Seller" → contextual thread (listing attached at top) → text + image messages → offer negotiation inline. Never lose listing context in conversation.

### States
**Loading:** Skeleton screens maintaining listing grid layout and card aspect ratios. Shimmer animation left-to-right, 1.5s cycle. Show 8-12 skeleton cards matching expected grid density.
**Empty:** No listings in category: "Be the first to list in this category" with prominent Sell CTA. No messages: "When you buy or sell, conversations appear here." No search results: "No items match your search" + suggested categories + clear filters CTA.
**Error:** Payment error: "Payment couldn't be processed. Your funds are safe. Try again or use a different method." Listing error: "We couldn't publish your listing. Your draft is saved -- try again." Network error: "Connection lost -- your data is saved. Retrying..."

### Motion
**Appropriate:** Add-to-wishlist heart fill animation (250ms ease-out), listing card hover lift (200ms), offer sent checkmark (300ms), message send slide-up (200ms), image carousel swipe (300ms spring), seller verification badge pulse on first view (500ms once).
**Inappropriate:** Auto-scrolling featured listings (users want control), aggressive countdown timers on offers (dark pattern), heavy parallax on listing images (performance), confetti on sale completion (marketplace is transactional, not celebratory), page transitions between grid and detail (breaks browsing flow).

## Accessibility Specifics
- Product images: descriptive alt text including item name, condition, and key feature -- never just "listing image"
- Prices: announced with currency by screen reader (e.g., "twenty-four dollars and ninety-nine cents")
- Seller ratings: `aria-label="4.5 out of 5 stars, 128 reviews"` -- never rely on visual stars alone
- Verification badges: `aria-label="Verified seller"` on badge icon, not just visual
- Offer status updates: `aria-live="polite"` region for offer accepted/declined notifications
- Condition badges: color + text label (never color alone for New/Good/Fair)
- Dual-mode toggle: `aria-pressed` state, announces "Switched to seller view" / "Switched to buyer view"

## Border Radius
| Token | Value | Reasoning |
|---|---|---|
| radius-sm | 4px | Condition badges, filter chips -- crisp and scannable |
| radius-md | 8-10px | Buttons, inputs, listing cards -- modern, commercial |
| radius-lg | 12-16px | Modals, seller profile cards, image containers -- friendly |

## Shadow Style
| Token | Value | Usage |
|---|---|---|
| shadow-sm | 0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04) | Default listing card resting state |
| shadow-md | 0 4px 8px -2px rgba(0,0,0,0.08), 0 2px 4px -2px rgba(0,0,0,0.04) | Card hover, elevated panels, offer panel |
| shadow-lg | 0 12px 24px -4px rgba(0,0,0,0.10), 0 4px 8px -4px rgba(0,0,0,0.05) | Modals, message drawer, image lightbox |

<!-- Icon names verified against: Lucide v0.400+, Phosphor Icons v2.1+, Material Symbols, Tabler Icons v3.0+ -->

## Icon Vocabulary

Primary library: Material Symbols Rounded (from icon-libraries.md domain affinity matrix)

Note: Material Symbols uses underscores, not hyphens. Double-check every name.

### Navigation
| Semantic Role | Material Symbols | Phosphor | Lucide | Tabler |
|---------------|-----------------|----------|--------|--------|
| home | home | ph-house | house | ti-home |
| search | search | ph-magnifying-glass | search | ti-search |
| sell | sell | ph-tag | tag | ti-tag |
| messages | chat | ph-chat-circle | message-circle | ti-message-circle |
| profile | person | ph-user | user | ti-user |

### Marketplace & Commerce
| Semantic Role | Material Symbols | Phosphor | Lucide | Tabler |
|---------------|-----------------|----------|--------|--------|
| listing | storefront | ph-storefront | store | ti-building-store |
| favorite | favorite | ph-heart | heart | ti-heart |
| star-rating | star | ph-star | star | ti-star |
| shipping | local_shipping | ph-truck | truck | ti-truck |
| offer | local_offer | ph-hand-coins | hand-coins | ti-coin |
| verified | verified_user | ph-seal-check | badge-check | ti-rosette-discount-check |
| location | location_on | ph-map-pin | map-pin | ti-map-pin |
| condition | new_releases | ph-sparkle | sparkles | ti-sparkles |

### Status & Feedback
| Semantic Role | Material Symbols | Phosphor | Lucide | Tabler |
|---------------|-----------------|----------|--------|--------|
| success | check_circle | ph-check-circle | check-circle | ti-circle-check |
| error | cancel | ph-x-circle | x-circle | ti-circle-x |
| warning | warning | ph-warning | alert-triangle | ti-alert-triangle |
| pending | schedule | ph-clock | clock | ti-clock |
| sold | shopping_bag | ph-shopping-bag | shopping-bag | ti-shopping-bag |

### Actions
| Semantic Role | Material Symbols | Phosphor | Lucide | Tabler |
|---------------|-----------------|----------|--------|--------|
| add-listing | add_circle | ph-plus-circle | plus-circle | ti-circle-plus |
| edit | edit | ph-pencil-simple | pencil | ti-pencil |
| share | share | ph-share-network | share-2 | ti-share |
| filter | filter_list | ph-funnel | filter | ti-filter |
| camera | photo_camera | ph-camera | camera | ti-camera |
| close | close | ph-x | x | ti-x |

## Marketplace-Specific Additions
- **Seller verification badges:** Tiered verification (Email verified, ID verified, Top Seller) with distinct badge icons and colors. Display on every seller touchpoint. Verification level affects listing prominence in search.
- **Condition grading system:** Standardized condition chips (New, Like New, Good, Fair, For Parts) with color coding and tooltip definitions. Consistent across all listing cards and detail pages.
- **Dual-mode dashboard:** Buyer view shows purchases, watchlist, saved searches, offers made. Seller view shows active listings, sales history, earnings, offers received. Toggle accessible from profile menu.
- **Offer negotiation flow:** Threaded offer history showing original price, buyer offer, seller counter, with clear accept/decline/counter CTAs at each step. Price changes highlighted with directional arrows.
- **Buyer protection indicators:** Shield icon + "Protected" label on eligible listings. Protection details in expandable section on listing detail. Consistent visual language builds platform trust.
- **Location-aware browsing:** Distance badge on listing cards ("2.3 mi away"), local pickup option toggle in filters, map view for nearby listings. Location permissions requested contextually, not on first launch.
- **Rating and review system:** Post-transaction mutual rating (buyer rates seller, seller rates buyer). Star rating + text review + optional photos. Aggregate displayed on profile with breakdown by category.
