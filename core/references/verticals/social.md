# Social Design Intelligence

## Core Design Principle
**Connection is the product.** Users are sharing, discovering, and building relationships -- the UI must feel alive, personal, and socially aware. Great social design disappears into the conversation: it makes posting effortless, discovery serendipitous, and interaction feel human rather than mechanical.

## Navigation Patterns

### Standard Models
- **Mobile:** Bottom tab bar, 5 items. Home/Feed, Search/Explore, Create (prominent center, raised or highlighted), Notifications, Profile. Stories/reels carousel sits above the feed, below the app bar.
- **Desktop:** Persistent left sidebar, 280px expanded. Profile card at top, then Feed, Messages, Notifications, Groups, Events, Settings. Right rail for trending/suggestions (320px). Top bar for search + compose + notifications.
- **Action surfaces:** Bottom sheets for compose/share actions. Full-screen modal for media creation (photo/video). Swipe gestures on cards for quick actions (like, save, dismiss).

### Vertical-Specific Rules
- "Create" or "Post" action: reachable within 1 tap from any screen -- center tab or floating action button
- Notifications: badge count on tab icon, real-time update without page refresh
- Profile: accessible from avatar tap anywhere in the app (author avatars, comment avatars)
- Search/Explore: dual-mode -- text search and visual grid discovery
- Direct messages: accessible from top-right icon or dedicated tab, unread count visible

## Color System

### Palette A: Vibrant Blue-Violet (Community)
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-50 | #F5F3FF | #2E1065 | Subtle backgrounds, selected states |
| primary-100 | #EDE9FE | #3B0764 | Hover states on light surfaces |
| primary-200 | #DDD6FE | #581C87 | Borders, focus rings |
| primary-300 | #C4B5FD | #6D28D9 | Icons, decorative accents |
| primary-400 | #A78BFA | #7C3AED | Secondary actions, links |
| primary-500 | #7C3AED | #A78BFA | Primary actions, brand (HSL 263 70% 58%) |
| primary-600 | #6D28D9 | #C4B5FD | Hover on primary buttons |
| primary-700 | #5B21B6 | #DDD6FE | Active/pressed state |
| primary-800 | #4C1D95 | #EDE9FE | Text on light backgrounds |
| primary-900 | #2E1065 | #F5F3FF | Headings on light backgrounds |
| surface-primary | #FFFFFF | #0C0A14 | Main background |
| surface-secondary | #FAFAFE | #161226 | Cards, sidebar |
| surface-tertiary | #F3F2F8 | #221D35 | Nested elements, input backgrounds |
| text-primary | #1A1523 | #F3F2F8 | Body text (15.1:1 AAA) |
| text-secondary | #65607A | #9E98B0 | Supporting text (5.6:1 AA) |

### Palette B: Warm Coral (Expressive)
| Token | Light Mode | Dark Mode | Usage |
|---|---|---|---|
| primary-500 | #F43F5E | #FB7185 | Brand accent, like/heart actions |
| surface-primary | #FFFFFF | #0F0B0C | Main background |
| surface-secondary | #FFF5F6 | #1C1517 | Cards, panels |
| text-primary | #1C1012 | #FFF1F2 | Body text (15.8:1 AAA) |
| text-secondary | #78616A | #A89198 | Supporting text (5.1:1 AA) |

### Semantic Colors
| Semantic | Hex (Light) | Hex (Dark) | Social Meaning |
|---|---|---|---|
| Success | #16A34A | #4ADE80 | Posted successfully, message sent, followed |
| Error | #DC2626 | #F87171 | Failed to send, upload error, post rejected |
| Warning | #D97706 | #FBBF24 | Reported content, account warning, rate limited |
| Info | #2563EB | #60A5FA | New follower, mention, tag notification |

### Color Anti-Patterns
- Never use red for likes/hearts in Palette A -- red is reserved for errors; use primary-500 or a dedicated pink/coral
- Never use harsh neon backgrounds -- social feeds are read for extended periods; eye comfort matters
- Never use more than 2 accent colors competing in one feed card -- dilutes engagement hierarchy
- Never use low-contrast text on media overlays without a gradient scrim or text shadow

## Typography

### Pairing A: General Sans + DM Sans
- **Display:** General Sans 700 at -0.02em -- modern, geometric, social-native personality (Fontshare)
- **Body:** DM Sans 400/500 at 0em -- clean geometric with optical sizing, excellent at 14-16px (Google Fonts)

### Pairing B: Plus Jakarta Sans
- **Display:** Plus Jakarta Sans 700 at -0.015em -- friendly, rounded geometry with warmth (Google Fonts)
- **Body:** Plus Jakarta Sans 400/500 at 0em -- consistent personality across hierarchy (Google Fonts)

### Type Scale
| Token | Size | Line Height | Social Usage |
|---|---|---|---|
| text-xs | 0.75rem (12px) | 1.4 | Timestamps, like/comment counts, "seen by" labels |
| text-sm | 0.875rem (14px) | 1.45 | Post body text, comment text, username mentions |
| text-base | 1rem (16px) | 1.5 | Primary post content, bio text, message bubbles |
| text-lg | 1.125rem (18px) | 1.45 | Profile display name, card titles |
| text-xl | 1.25rem (20px) | 1.35 | Section headers (Explore, Messages, Notifications) |
| text-2xl | 1.5rem (24px) | 1.3 | Profile hero name, feature headers |
| text-3xl | 1.875rem (30px) | 1.2 | Onboarding headlines, milestone celebrations |

### Typography Rules
- Usernames/handles: --weight-semibold for display name, --weight-regular --text-secondary for @handle
- Engagement counts (likes, comments): --text-xs --weight-medium, abbreviated (1.2K not 1,200)
- Hashtags and mentions: --weight-medium, --color-primary for tap targets
- Timestamps: --text-xs --text-secondary, relative format ("3h ago" not "2026-03-09 10:23")

### Typography Anti-Patterns
- Never use monospaced fonts for social content -- they feel technical, not conversational
- Never use ALL CAPS for usernames -- feels aggressive in social context
- Never use condensed typefaces in feeds -- sacrifices readability for density users don't need
- Never use more than 2 type sizes in a single feed card -- creates visual noise

## Spacing & Density

### Recommended Density: Comfortable
Social apps prioritize visual breathing room and media display over data density. Users scroll, not scan -- generous whitespace prevents fatigue.

### Concrete Values
| Context | Value | Token |
|---|---|---|
| Card internal padding | 16px | --space-4 |
| Feed card gap | 8-12px | --space-2 to --space-3 |
| Avatar to text gap | 12px | --space-3 |
| Engagement action bar padding | 8px 0 | --space-2 |
| Section gap | 24px | --space-6 |
| Comment thread indent | 40px | --space-10 |
| Touch target minimum | 48x48px | -- |
| Bottom tab bar height | 56px | -- |

## Component Specifications

### FeedPost
```xml
<component name="FeedPost" category="content-display">
  <description>Primary content card in the feed. Displays author, content (text/media), and engagement actions. The most-viewed component in any social app.</description>
  <structure>
    Header: [Avatar: 40x40 --radius-full] [Name --text-sm --weight-semibold + Handle --text-xs --text-secondary] [Timestamp --text-xs --text-secondary] [More menu ...]
    Content: [Text body --text-base --text-primary, max 3 lines collapsed with "...more"] [Media: image/video full-width, --radius-lg, 4:5 or 1:1 aspect ratio]
    Engagement bar: [Like icon + count] [Comment icon + count] [Share icon] [Save/Bookmark icon right-aligned]
    Engagement text: --text-xs --weight-medium --text-secondary
    Liked state: icon filled, --color-primary (Palette A) or --color-error (Palette B for heart)
  </structure>
  <dimensions>
    padding: --space-4, gap: --space-3
    Avatar: 40x40px --radius-full
    Media: 100% width, max-height 600px, object-fit cover
    Engagement icons: 24x24px, tap target 48x48px
  </dimensions>
  <states>
    default: --surface-primary background
    liked: heart icon filled with scale(1.2) pulse animation 200ms
    expanded: full text visible, "Show less" link
    media-loading: --surface-tertiary placeholder with shimmer
  </states>
</component>
```

### StoryBubble
```xml
<component name="StoryBubble" category="navigation">
  <description>Circular avatar with gradient ring indicating unviewed story/status content. Displayed in horizontal scrollable row at top of feed.</description>
  <structure>
    Container: [Ring: 2px gradient border (primary-400 to primary-600)] [Avatar: circular image --radius-full] [Username: --text-xs --weight-medium, truncated to 1 line, centered below]
    Gradient ring: linear-gradient(135deg, primary-400, primary-600) as border
    Unseen indicator: gradient ring visible
    Seen indicator: ring becomes --border-secondary (muted gray)
    Own story: "+" badge overlay at bottom-right of avatar
  </structure>
  <dimensions>
    outer-ring: 68x68px, ring-thickness: 2px, gap: 2px
    avatar: 60x60px --radius-full
    username-width: 72px max, text-align center
    horizontal-gap: --space-3 between bubbles
    row-padding: --space-4 horizontal, --space-3 vertical
  </dimensions>
  <states>
    unseen: gradient ring visible, avatar full opacity
    seen: gray ring, avatar 80% opacity
    loading: pulsing ring animation (1.5s cycle)
    own-empty: dashed ring, "+" badge, "Add story" label
  </states>
</component>
```

### MessageBubble
```xml
<component name="MessageBubble" category="communication">
  <description>Chat message bubble with sender alignment, timestamps, and read receipts. Used in direct message conversations.</description>
  <structure>
    Sent (right-aligned): [Bubble: --primary-500 bg, --text-inverse text, --radius-lg with bottom-right --radius-sm]
    Received (left-aligned): [Avatar 32x32 --radius-full] [Bubble: --surface-secondary bg, --text-primary text, --radius-lg with bottom-left --radius-sm]
    Message text: --text-sm --weight-regular
    Timestamp: --text-xs --text-secondary, below bubble, aligned to bubble edge
    Read receipt: double-check icon, --text-xs, below timestamp (sent messages only)
    Media message: image/video inline with --radius-md, max-width 260px
  </structure>
  <dimensions>
    max-width: 75% of container
    padding: --space-2 --space-3 (10px 12px)
    border-radius: --radius-lg (12px) with directional override to --radius-sm (4px)
    avatar: 32x32px --radius-full (received messages only)
    gap-between-messages: --space-1 (same sender), --space-3 (different sender)
  </dimensions>
  <states>
    sent: right-aligned, primary background
    received: left-aligned, surface-secondary background
    sending: opacity 70%, spinner icon replacing timestamp
    failed: error icon, "Tap to retry" label, --color-error border
    read: double-check icon in --primary-300
  </states>
</component>
```

## Interaction Patterns

### Core Flows
1. **Posting content:** Tap "Create" → compose screen (text input auto-focused, media picker accessible) → add text/media/hashtags → "Post" button. Processing state with progress bar for media upload. Success: toast "Posted!" with view link.
2. **Engaging with content:** Like = single tap (instant, optimistic update). Comment = tap comment icon → inline comment input appears below post. Share = bottom sheet with options (repost, send to DM, copy link, share externally).
3. **Discovering content:** Explore tab shows grid of trending media. Search bar with recent searches and suggested topics. Tap category chip to filter. Infinite scroll with pull-to-refresh.

### States
**Loading:** Skeleton screens with shimmer (left-to-right, 1.5s cycle). Feed shows 3-4 skeleton cards matching FeedPost structure. Stories row shows 5-6 circular skeleton bubbles.
**Empty:** No posts in feed: "Follow people to see posts here" with suggested accounts carousel and "Find Friends" CTA. No messages: "Start a conversation" with friend suggestion list. No notifications: "When people interact with your posts, you'll see it here."
**Error:** Feed load failure: "Couldn't load your feed. Pull to refresh" -- casual tone, not alarming. Message send failure: "Message not sent. Tap to retry." Network error: "You're offline. We'll refresh when you're back."

### Motion
**Appropriate:** Like heart scale-up pulse (200ms ease-out), pull-to-refresh spinner, story ring progress animation, message send slide-up (200ms), double-tap like overlay heart (400ms scale + fade), smooth scroll momentum.
**Inappropriate:** Bouncy/spring animations on feed cards, slow page transitions between tabs, confetti on every like, parallax effects in feeds, auto-playing video with sound, decorative loading animations that delay content display.

## Accessibility Specifics
- User-uploaded images: prompt for alt text during upload, provide AI-suggested descriptions as fallback
- Engagement counts: screen reader announces "42 likes, 7 comments" not just the number
- Video content: auto-generated captions, manual caption editing, captions on by default
- Color-coded indicators (online status, story rings): supplement with shape or icon, never color alone
- Swipe gestures: always provide button alternatives for the same actions
- Feed auto-scroll: respect "reduce motion" preference, pause auto-advance

## Border Radius
| Token | Value | Reasoning |
|---|---|---|
| radius-sm | 4px | Chips, badges, small buttons -- subtle rounding |
| radius-md | 8px | Input fields, comment bubbles -- approachable |
| radius-lg | 12px | Feed cards, media containers -- friendly, modern |
| radius-xl | 16px | Bottom sheets, modals -- soft, inviting |
| radius-full | 9999px | Avatars, story bubbles, pill buttons -- circular identity elements |

## Shadow Style
| Token | Value | Usage |
|---|---|---|
| shadow-sm | 0 1px 2px rgba(0,0,0,0.05) | Subtle card elevation, floating action button rest |
| shadow-md | 0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -2px rgba(0,0,0,0.05) | Elevated cards, compose modal, dropdown menus |
| shadow-lg | 0 10px 15px -3px rgba(0,0,0,0.08), 0 4px 6px -4px rgba(0,0,0,0.04) | Bottom sheets, image viewer overlay, story viewer |

<!-- Icon names verified against: Lucide v0.400+, Phosphor Icons v2.1+, Material Symbols, Tabler Icons v3.0+ -->

## Icon Vocabulary

Primary library: Phosphor Icons (from icon-libraries.md domain affinity matrix)

### Navigation
| Semantic Role | Lucide | Phosphor | Material Symbols | Tabler |
|---------------|--------|----------|-----------------|--------|
| home | house | ph-house | home | ti-home |
| search | search | ph-magnifying-glass | search | ti-search |
| notifications | bell | ph-bell | notifications | ti-bell |
| profile | user | ph-user | person | ti-user |
| settings | settings | ph-gear | settings | ti-settings |

### Social & Communication
| Semantic Role | Lucide | Phosphor | Material Symbols | Tabler |
|---------------|--------|----------|-----------------|--------|
| message | message-circle | ph-chat-circle | chat_bubble | ti-message-circle |
| group | users | ph-users-three | group | ti-users-group |
| follow | user-plus | ph-user-plus | person_add | ti-user-plus |
| share | share-2 | ph-share-network | share | ti-share |
| camera | camera | ph-camera | photo_camera | ti-camera |
| image | image | ph-image | image | ti-photo |
| video | video | ph-video-camera | videocam | ti-video |
| live | radio | ph-broadcast | cast | ti-broadcast |

### Status & Feedback
| Semantic Role | Lucide | Phosphor | Material Symbols | Tabler |
|---------------|--------|----------|-----------------|--------|
| like | heart | ph-heart | favorite | ti-heart |
| comment | message-square | ph-chat-text | comment | ti-message |
| bookmark | bookmark | ph-bookmark-simple | bookmark | ti-bookmark |
| verified | badge-check | ph-seal-check | verified | ti-rosette-discount-check |
| online | circle | ph-circle | circle | ti-circle-filled |

### Actions
| Semantic Role | Lucide | Phosphor | Material Symbols | Tabler |
|---------------|--------|----------|-----------------|--------|
| create | plus-circle | ph-plus-circle | add_circle | ti-circle-plus |
| edit | pencil | ph-pencil-simple | edit | ti-pencil |
| delete | trash-2 | ph-trash | delete | ti-trash |
| report | flag | ph-flag | flag | ti-flag |
| block | ban | ph-prohibit | block | ti-ban |
| mute | bell-off | ph-bell-slash | notifications_off | ti-bell-off |

## Social-Specific Additions
- **Story/status lifecycle:** Stories expire after 24h with a visible countdown ring. "Close friends" stories use a different ring color (green). Story highlights persist on profile as categorized collections.
- **Engagement hierarchy:** Like (lowest friction, single tap) < Comment (medium, text input) < Share (highest intent, choice of method). Display counts in descending order of social proof.
- **Content moderation indicators:** Reported content shows "Under review" overlay. Sensitive content behind "Show anyway" tap gate. Blocked users hidden from all surfaces with no trace.
- **Real-time presence:** Online dot (green, 8px) on avatars in messages. "Active Xm ago" in profile and message list. Typing indicator (three-dot pulse animation) in conversations.
- **Infinite scroll with anchor:** Feed uses infinite scroll with pull-to-refresh. "New posts" pill notification appears when new content arrives while reading, tapping scrolls to top. Scroll position preserved on back navigation.
- **Media-first layout:** Images and videos should dominate feed cards. Text-only posts use a subtle background tint or larger type to compensate for missing visual weight.
