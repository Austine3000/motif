# CSS-to-RN Property Matrix

Purpose: prevent silent drops when composing React Native screens. If a CSS feature is unsupported, add an inline `// TODO` comment in the component.

---

## Layout

| CSS Feature | RN Support | RN Guidance |
|-------------|------------|-------------|
| `display: flex` | Supported (default) | Use `flexDirection`, `alignItems`, `justifyContent` |
| `display: grid` | Unsupported | Replace with nested `View` + flex; add `// TODO` if grid is required |
| `position: relative/absolute` | Supported | Use `position: 'absolute'` and offsets |
| `position:fixed` | Unsupported | Add `// TODO` and consider portal strategy |
| `gap` | Limited | Prefer margins; if gap is critical, add `// TODO` |
| `overflow: hidden` | Supported | Use `overflow: 'hidden'` |

---

## Spacing

| CSS Feature | RN Support | RN Guidance |
|-------------|------------|-------------|
| `margin` | Supported | Use numeric values from `theme.spacing[...]` |
| `padding` | Supported | Use numeric values from `theme.spacing[...]` |

---

## Typography

| CSS Feature | RN Support | RN Guidance |
|-------------|------------|-------------|
| `font-size` | Supported | Use `theme.typography[...]` values |
| `font-weight` | Supported | Use `theme.typography[...]` values |
| `line-height` | Supported | Use `theme.typography[...]` values |
| `letter-spacing` | Supported | Use `theme.typography[...]` values |
| `text-transform` | Supported | Use `textTransform` |

---

## Borders & Radius

| CSS Feature | RN Support | RN Guidance |
|-------------|------------|-------------|
| `border-width` | Supported | Use numeric values from `theme.spacing[...]` or explicit token values |
| `border-color` | Supported | Use `theme.colors.*` |
| `border-radius` | Supported | Use `theme.radii[...]` |

---

## Shadows

| CSS Feature | RN Support | RN Guidance |
|-------------|------------|-------------|
| `box-shadow` | Partial | Use `theme.shadows.*` (iOS shadow props + Android `elevation`) |

---

## Unsupported / Web-Only

| CSS Feature | RN Support | RN Guidance |
|-------------|------------|-------------|
| Pseudo-elements (`::before`, `::after`) | Unsupported | Add `// TODO` |
| CSS variables (`var(--token)`) | Unsupported | Use `theme.*` tokens |
| Filters / `backdrop-filter` | Unsupported | Add `// TODO` |
| `position:fixed` | Unsupported | Add `// TODO` |

---

## TODO Policy

If a design calls for any unsupported feature, add an inline `// TODO` comment next to the related style or component block. Do NOT silently drop the requirement.
