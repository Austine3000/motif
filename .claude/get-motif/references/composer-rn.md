# Expo / React Native — Composer Overlay

> **CRITICAL:** This document OVERRIDES default HTML composition behavior. When this overlay is active, ALL output must follow the rules below. If any base composition rule conflicts with this overlay, THIS OVERLAY WINS.

---

## 1. File Output Rules (Greenfield Expo)

| File Type | Path Pattern | Notes |
|-----------|--------------|-------|
| Screen | `screens/{ScreenName}Screen.tsx` | Named export: `export function {ScreenName}Screen()` |
| Screen section | `screens/{ScreenName}/components/{Name}.tsx` | Optional; use for screen-only sections |
| Shared component | `components/{Name}.tsx` | Reusable across screens |
| UI primitive | `components/ui/{Name}.tsx` | Optional; keep primitives isolated |

- Do NOT modify `App.tsx` or entry files unless explicitly asked.
- Keep output decomposed into screen + section + shared components (no monolithic files).

---

## 2. Import Rules

```tsx
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  SafeAreaView,
  Pressable,
  Image,
  TextInput,
  FlatList,
  StyleSheet,
} from 'react-native';
import { theme } from '../theme';
```

- Use React Native primitives only (`react-native`).
- Import tokens from `theme/index.ts` (`theme/tokens.native.ts` is re-exported).
  - Screens: `import { theme } from '../theme';`
  - Nested screen components: `import { theme } from '../../theme';`
- Use `Pressable` for interactive elements.
- For icons, prefer `@expo/vector-icons` (registry default).

---

## 3. Styling Rules (StyleSheet + Tokens Only)

**CRITICAL — overrides default HTML/CSS styling.**

- All styles MUST be defined via `StyleSheet.create`.
- `style` props must reference StyleSheet entries (`style={styles.container}`).
- Arrays are allowed for composition (`style={[styles.card, styles.cardActive]}`).
- NEVER use `className`.
- NEVER use inline style objects (`style={{ ... }}`).
- NEVER use CSS variables (`var(--color-...)`) or raw CSS values.
- All visual values must come from `theme.*` tokens.

**Token access notes:**
- Colors: `theme.colors.surfacePrimary`, `theme.colors.textPrimary`, `theme.colors.primary500`
- Spacing/radii/typography may use numeric keys; use bracket access:
  - `theme.spacing[4]`, `theme.radii[2]`, `theme.typography[16]`
- Shadows: spread RN shadow objects from `theme.shadows.*`:
  - `...theme.shadows.md`

---

## 4. Element Mapping (HTML → React Native)

| HTML / Web Concept | React Native Primitive |
|--------------------|------------------------|
| `div`, `section`, `main`, `header`, `footer`, `nav` | `View` |
| `p`, `span`, `label`, `small` | `Text` |
| `h1`–`h6` | `Text` (use typography tokens) |
| `button` | `Pressable` |
| `a` (link) | `Pressable` + TODO for navigation |
| `img` | `Image` |
| `input` | `TextInput` |
| `textarea` | `TextInput` with `multiline` |
| `ul`/`ol` | `View` + map items |
| `li` | `View` (or `Text` if inline) |
| `hr` | `View` with height + backgroundColor |
| `table` | `View` layout + TODO (no native table) |

---

## 5. Unsupported CSS Handling (REQUIRED)

If a design calls for unsupported CSS, add an inline TODO comment near the style or layout in question. Do NOT silently drop.

Examples of unsupported or non-native features:
- CSS Grid (`display: grid`, `grid-template-*`)
- `position: fixed`
- Pseudo-elements (`::before`, `::after`)
- `box-shadow` (use `theme.shadows.*` where possible; otherwise TODO)
- Filters / backdrop-filter
- CSS variables or custom properties

Reference the **CSS-to-RN property matrix**: `.claude/get-motif/references/css-to-rn.md`.

---

## 6. Anti-Slop Checklist (RN-Specific)

Before finalizing each component:

- No HTML tags (`div`, `span`, `img`, `button`, `input`)
- No `className`
- No inline style objects
- No CSS variables or raw CSS values
- No `rem`/`em`/`px` hardcoding
- Uses `StyleSheet.create` + `theme.*` tokens only
- Unsupported CSS flagged with `// TODO` inline comments

