# Phase 26: Expo and React Native — Research

**Date:** 2026-03-12
**Phase:** 26
**Goal:** Users building mobile apps get the same zero-to-running experience as web — Expo scaffolding, React Native component output, and consistent design language across platforms.

## Scope Recap (from Roadmap)
- **SCAF-04:** Scaffold an Expo/React Native project via `create-expo-app` (TypeScript, ready to run).
- **COMP-03:** `/motif:compose` outputs React Native components (View/Text/ScrollView/StyleSheet.create) — no CSS, no HTML.
- **COMP-06:** Cross-platform design consistency (colors, typography scale, spacing rhythm, component patterns) between web and mobile.

## Baseline: What Already Exists
- **Framework registry** (`.claude/get-motif/references/framework-registry.json`) includes `mobile-expo` with scaffold command and composition overlay pointer (`composer-rn.md`).
- **Scaffold runner** (`.claude/get-motif/scripts/scaffold-project.js`) runs registry-defined scaffold command + materialization.
- **Token transformer** (`.claude/get-motif/scripts/token-transformer.js`) generates `tokens.native.ts` for `mobile-expo`.
- **Compose orchestrator** (`.claude/get-motif/workflows/compose-screen.md`) resolves platform overlay from registry and injects it into composer prompt.

## Gaps vs Phase 26 Requirements
1. **No React Native composer overlay file** (`composer-rn.md` is referenced but missing).
2. **Mobile materialization missing:** `mobile-expo` registry entry lacks `runtimeDestinations`/materialization for `tokens.native.ts`, so RN projects won't receive token file inside the scaffolded project.
3. **CSS-to-RN property compatibility guidance missing:** roadmap calls for a property matrix to prevent silent drops.
4. **Cross-platform consistency validation steps missing:** need explicit checks to verify COMP-06.
5. **Expo runtime metadata incomplete:** mobile registry uses `readyPattern` (legacy) instead of `readyMatchers` + `urlPattern` contract used by runtime-launcher; likely needs alignment for future auto-run parity.

## Architectural Decisions to Preserve
- **Canonical + derived tokens:** `tokens.css` is source of truth; `tokens.native.ts` must be derived deterministically, not LLM-generated.
- **Overlay pattern:** platform-specific composition rules live in overlay files, not in agent definitions.
- **Registry-driven behavior:** scaffold and runtime behavior should be expressed declaratively in `framework-registry.json`.

## Key Design Decisions Needed
- **Expo template choice:**
  - Current registry uses `blank-typescript`. This yields an `App.tsx` root and no Expo Router. Composition should avoid overwriting existing files.
  - If we want file-based routes, switch to a `tabs` template (Expo Router) and direct composition into `app/` routes.
  - Recommendation: keep `blank-typescript` to minimize moving pieces, but define screen output to `screens/` and `components/` without touching `App.tsx` (user can wire in). This satisfies COMP-03 without modifying existing files.
- **Token file placement:** introduce `runtimeDestinations` for `mobile-expo` so `tokens.native.ts` materializes into the scaffolded project (e.g., `src/theme/tokens.native.ts` or `theme/tokens.native.ts`).
- **Icon strategy for RN:**
  - Web icon pipeline uses `ICON-CATALOG.md` with web libraries.
  - For RN, prefer `lucide-react-native` to preserve Lucide naming. If the catalog uses a different library, instruct the composer to note the mismatch in SUMMARY and use text-only placeholders or Expo vector icons as fallback.

## Implementation Notes (By Requirement)
### SCAF-04 — Expo Scaffolding
- Ensure scaffold runner can execute `npx create-expo-app@latest {name} --template blank-typescript --yes`.
- Add a `scaffoldSequence` entry for mobile-expo to document the intended steps (parity with web platforms).
- Add `materialization.runtimeDestinations` for `tokens.native.ts` (and optional `theme/index.ts`) to ensure RN token import exists in project output.

### COMP-03 — React Native Composition Output
- Create `.claude/get-motif/references/composer-rn.md` with:
  - File placement rules (e.g., `screens/{ScreenName}Screen.tsx`, `components/{Name}.tsx`, `components/ui/` for primitives).
  - Token usage via `tokens.native.ts` imports.
  - Strict RN element mappings (View/Text/ScrollView/Pressable/Image/TextInput/FlatList).
  - StyleSheet.create for all styles (no inline objects, no className).
  - “Unsupported CSS” handling: add inline `// TODO` comments when a design requires unsupported CSS (grid, box-shadow, pseudo-elements, position:fixed).
  - Explicit prohibition of HTML tags and CSS custom properties.

### COMP-06 — Cross-Platform Consistency
- Add a lightweight validation checklist that compares:
  - **Token usage:** RN components import from `tokens.native.ts` and use the same token names as web (colors, spacing, typography scale).
  - **Component patterns:** shared component archetypes (cards, buttons, list items) reflect the same spacing rhythm and typography hierarchy.
  - **Unsupported CSS handling:** RN output includes inline TODOs for non-RN properties.
- Add a reference “CSS-to-RN property matrix” so composers know what maps cleanly and what must be flagged.

## Risks / Pitfalls
- **Silent CSS drops:** without a matrix + TODO policy, RN output can omit layout/shadow logic silently.
- **Token drift:** RN token files must be copied from design system artifacts, not regenerated by LLM.
- **Icon mismatch:** ICON-CATALOG is web-oriented; RN needs a strategy to avoid hallucinated icons.
- **File integration:** blank Expo template requires users to wire the screen into `App.tsx`. This is acceptable if documented clearly in SUMMARY outputs.

## Validation Architecture
- **Scaffolding check:** Run scaffold runner in a temp dir for `mobile-expo` and verify:
  - `package.json` exists
  - `App.tsx` exists (from template)
  - `tokens.native.ts` materializes into the defined runtime destination
- **Composition check:** Run `/motif:compose` in a mobile-expo project and verify:
  - Output files use RN primitives + `StyleSheet.create`
  - No `className`, `div`, `span`, or CSS custom properties
  - `tokens.native.ts` is imported and used for color/spacing/typography
- **Consistency check:** Compare a web screen and its RN counterpart:
  - Token names used for colors/spacing/typography match
  - Spacing scale and typography hierarchy are preserved
- **Unsupported CSS handling:** Ensure any non-RN properties (grid, box-shadow, pseudo-elements, position:fixed) are explicitly annotated with inline TODOs.

## Recommended Plan Shape
- **26-01:** Expo scaffolding + tokens.native.ts materialization
- **26-02:** Composer RN overlay + CSS-to-RN matrix + RN output compliance rules
- **26-03:** Cross-platform consistency verification + COMP-06 validation checklist

