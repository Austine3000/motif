# Requirements: Motif

**Defined:** 2026-03-04
**Core Value:** Domain-intelligent design delivered through fresh context — a fintech app must look like fintech, not meditation, and screen 5 must be as good as screen 1.

## v1.2 Requirements (Complete)

All v1.2 Brownfield Intelligence requirements satisfied. See MILESTONES.md for details.

## v1.3 Requirements (Complete)

All v1.3 Global Reach requirements satisfied. See MILESTONES.md for details.

## v1.4 Requirements

Requirements for Cross-Platform App Builder milestone. Each maps to roadmap phases.

### Platform Foundation

- [ ] **PLAT-01**: STATE.md includes a `platform` field (web-nextjs, web-vite, web-static, mobile-expo) that persists across /clear
- [ ] **PLAT-02**: Token transformer script deterministically converts tokens.css to platform-specific files (tokens.ts for React, tokens.native.ts for React Native)
- [ ] **PLAT-03**: Design system generation pipeline calls token transformer after tokens.css creation, producing platform-appropriate token files
- [ ] **PLAT-04**: Framework registry maps platform identifiers to scaffolding commands, file conventions, and component patterns
- [ ] **PLAT-05**: Token transformer generates tailwind.config.ts extending Tailwind's theme with Motif design tokens (colors, spacing, typography, radii, shadows) for web projects

### Scaffolding

- [ ] **SCAF-01**: `motif init` asks what the user is building and recommends a framework (Next.js, Vite/React, Expo, static HTML) based on project type and vertical
- [ ] **SCAF-02**: User can scaffold a Next.js project with `create-next-app` — correct App Router structure, dependencies installed, ready to run
- [ ] **SCAF-03**: User can scaffold a Vite/React project with `create-vite` — React template, dependencies installed, ready to run
- [ ] **SCAF-04**: User can scaffold an Expo/React Native project with `create-expo-app` — Expo SDK, dependencies installed, ready to run
- [ ] **SCAF-05**: User can scaffold a static HTML landing page — minimal structure with design tokens linked, ready to open in browser
- [ ] **SCAF-06**: Brownfield detection — if an existing framework project is detected (package.json with next/vite/expo), skip scaffolding and adopt the existing framework
- [ ] **SCAF-07**: Scaffolded Next.js and Vite/React projects get shadcn/ui installed and configured with Motif's design tokens mapped to the shadcn theme

### Composition

- [ ] **COMP-01**: Screen composition outputs real JSX components for Next.js projects (proper imports, App Router file conventions, next/font, next/image)
- [ ] **COMP-02**: Screen composition outputs real JSX components for Vite/React projects (proper imports, React Router conventions)
- [ ] **COMP-03**: Screen composition outputs React Native Views/StyleSheet for Expo projects (no CSS, Flexbox-only layout, platform-appropriate primitives)
- [ ] **COMP-04**: Screen composition outputs static HTML/CSS for landing page projects (current behavior preserved)
- [ ] **COMP-05**: Composer agent receives platform-specific overlay instructions (composer-nextjs.md, composer-vite.md, composer-rn.md) injected by orchestrator based on platform field
- [ ] **COMP-07**: Web composition uses Tailwind utility classes and shadcn/ui primitives where appropriate — composed components import from shadcn and use Tailwind for styling
- [ ] **COMP-06**: Cross-platform design consistency — shared design values (colors, typography scale, spacing scale, component patterns) produce visually consistent results across web and mobile

### Auto-Run

- [ ] **ARUN-01**: After composition, Motif can launch the project's dev server (`npm run dev`, `npx expo start --web`) as a background process
- [ ] **ARUN-02**: Dev server ready-detection via stdout parsing (framework-specific ready messages) — opens browser/preview only after server is ready
- [ ] **ARUN-03**: PID tracking for launched dev servers — Motif records PIDs and cleans up zombie processes on exit
- [ ] **ARUN-04**: Browser/simulator opening uses OS-native commands (open/xdg-open/cmd start) — zero npm dependencies

## Future Requirements

### Cross-Vertical (v1.5+)

- **XVERT-01**: System can blend design patterns from two verticals for hybrid projects
- **XVERT-02**: User can migrate from one vertical to another without losing composed screens

### State Enhancements (v1.5+)

- **STATE-01**: Checkpoint commits with state tags (motif/phase/SYSTEM_GENERATED) for git-based recovery
- **STATE-02**: Rich decision logging with reasoning, source, and date per entry

### Convention Learning (v1.5+)

- **CONV-01**: User can have conventions automatically applied to all future compositions without re-scanning
- **CONV-02**: User can override extracted conventions with explicit preferences

### Multi-Runtime (v1.5+)

- **RUNT-01**: User can install Motif for OpenCode runtime
- **RUNT-02**: User can install Motif for Cursor runtime
- **RUNT-03**: User can install Motif for Gemini CLI runtime

### Desktop (v1.5+)

- **DESK-01**: User can scaffold Electron desktop apps
- **DESK-02**: User can scaffold Tauri desktop apps

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend/API scaffolding | Motif is frontend/UI only — backend is user's choice |
| State management setup (Redux, Zustand) | User choice, not Motif's domain |
| shadcn/ui for non-web platforms | shadcn is web-only — React Native projects use direct StyleSheet |
| NativeWind for React Native | Still in preview (v5) — use direct StyleSheet for stability |
| Vue/Nuxt framework support | Defer to v1.5+ — React ecosystem first |
| Desktop apps (Electron/Tauri) | Defer to v1.5+ — web + mobile covers primary use cases |
| Custom icon creation/generation | Use established libraries only |
| OpenCode/Cursor/Gemini CLI runtime support | v1.5+, same core/runtime arch |
| Global config file (~/.motifrc) | Per-project design prevents cookie-cutter output |
| Plugin/extension system | Premature before v2.0 stability |

## Traceability

### v1.2 (Complete)

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCAN-01 | Phase 13 | Satisfied |
| SCAN-02 | Phase 13 | Satisfied |
| SCAN-03 | Phase 14 | Satisfied |
| SCAN-04 | Phase 13 | Satisfied |
| SCAN-05 | Phase 13 | Satisfied |
| TOKN-01 | Phase 14 | Satisfied |
| TOKN-02 | Phase 14 | Satisfied |
| TOKN-03 | Phase 14 | Satisfied |
| COMP-01 | Phase 15 | Satisfied |
| COMP-02 | Phase 15 | Satisfied |
| COMP-03 | Phase 15 | Satisfied |
| COMP-04 | Phase 16 | Satisfied |

### v1.3 (Complete)

| Requirement | Phase | Status |
|-------------|-------|--------|
| CTXR-01 | Phase 17 | Satisfied |
| CTXR-02 | Phase 17 | Satisfied |
| CTXR-03 | Phase 17 | Satisfied |
| CTXR-04 | Phase 17 | Satisfied |
| VERT-01 | Phase 18 | Satisfied |
| VERT-02 | Phase 18 | Satisfied |
| VERT-03 | Phase 18 | Satisfied |
| VERT-04 | Phase 18 | Satisfied |
| VERT-05 | Phase 18 | Satisfied |
| VERT-06 | Phase 18 | Satisfied |
| GCLI-01 | Phase 19 | Satisfied |
| GCLI-02 | Phase 19 | Satisfied |
| GCLI-06 | Phase 19 | Satisfied |
| GCLI-03 | Phase 20 | Satisfied |
| GCLI-04 | Phase 20 | Satisfied |
| GCLI-05 | Phase 20 | Satisfied |
| VERT-07 | Phase 20 | Satisfied |

### v1.4

| Requirement | Phase | Status |
|-------------|-------|--------|
| PLAT-01 | — | Pending |
| PLAT-02 | — | Pending |
| PLAT-03 | — | Pending |
| PLAT-04 | — | Pending |
| SCAF-01 | — | Pending |
| SCAF-02 | — | Pending |
| SCAF-03 | — | Pending |
| SCAF-04 | — | Pending |
| SCAF-05 | — | Pending |
| SCAF-06 | — | Pending |
| COMP-01 | — | Pending |
| COMP-02 | — | Pending |
| COMP-03 | — | Pending |
| COMP-04 | — | Pending |
| COMP-05 | — | Pending |
| COMP-06 | — | Pending |
| ARUN-01 | — | Pending |
| ARUN-02 | — | Pending |
| ARUN-03 | — | Pending |
| ARUN-04 | — | Pending |
| PLAT-05 | — | Pending |
| SCAF-07 | — | Pending |
| COMP-07 | — | Pending |

**Coverage:**
- v1.4 requirements: 23 total
- Mapped to phases: 0 (awaiting roadmap)
- Unmapped: 23

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-09 after v1.4 requirements defined*
