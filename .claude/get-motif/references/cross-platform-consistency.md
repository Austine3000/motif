# Cross-Platform Consistency Checklist (Web + React Native)

Use this checklist to confirm web and RN outputs align for COMP-06. The goal is structural and token-level parity, not pixel-perfect reproduction.

## Token Parity
- [ ] Token names match for primary brand colors (no platform-only renames).
- [ ] Token names match for text colors (e.g., `text-primary`, `text-muted`).
- [ ] Token names match for surface/background colors (e.g., `surface-1`, `surface-2`).
- [ ] Spacing tokens use the same scale and naming across platforms.

## Typography Scale Alignment
- [ ] Typography tokens map consistently to headline/body sizes.
- [ ] Font weights are consistent for shared roles (headline, subtitle, body, caption).
- [ ] Line-height and letter-spacing intent is preserved (or explicitly noted if platform-limited).

## Spacing Rhythm
- [ ] Padding values use the same token steps in equivalent components.
- [ ] Gaps between elements follow the shared spacing scale.
- [ ] Vertical rhythm (stack spacing) matches between web and RN.

## Component Pattern Parity
- [ ] Cards share the same structure (header, body, actions) and hierarchy.
- [ ] Buttons follow the same variant set and emphasis levels.
- [ ] List items share leading/trailing layout, dividers, and density.
- [ ] Navigation patterns (tabs, headers, back actions) are structurally aligned.

## Unsupported CSS Handling
- [ ] Grid layouts have explicit RN TODOs describing the fallback structure.
- [ ] Box-shadow usage is either mapped to RN equivalents or flagged with TODOs.
- [ ] Pseudo-elements are replaced with RN-safe patterns or documented as TODOs.
- [ ] `position: fixed` behaviors are replaced or documented with TODOs.

## Notes
- Record any deviations and whether they are intentional or limitations.
- If a mismatch is found, fix the token mapping or component structure first.
