# Project Research Summary

**Project:** Motif v1.4 -- Cross-Platform App Builder
**Domain:** AI-powered design-to-code with framework-aware output, project scaffolding, and auto-run
**Researched:** 2026-03-09
**Confidence:** HIGH

## Executive Summary

Motif v1.4 transforms the tool from a design system generator that outputs HTML/CSS into a cross-platform app builder that scaffolds real framework projects (Next.js, Vite+React, Expo/React Native), outputs framework-native components, and auto-runs the result. The core architectural insight is that Motif's design intelligence -- vertical references, research workflows, COMPONENT-SPECS.md -- is entirely platform-agnostic. Only the final output layer (token delivery format and component code format) needs to change. This means the upgrade is a FORMAT change at the edges, not a fundamental restructuring.

The recommended approach is a "Platform Adapter" pattern: tokens.css remains the canonical source of truth for all design decisions. A deterministic transformer script (not LLM-generated) produces platform-specific token files (tokens.ts for React, tokens.native.ts for React Native). Composer agent prompts receive platform-specific overlays (composer-react.md, composer-rn.md) that teach the agent correct output patterns without forking the agent definition. Scaffolding delegates to official CLI tools (create-next-app, create-expo-app, create-vite) via child_process.spawn, keeping Motif at zero npm dependencies. This "canonical + derived" pattern is the single most important architectural decision -- it prevents token drift, keeps the design architect focused on design, and makes adding new platforms a matter of writing one overlay file.

The primary risks are: (1) CSS-to-React-Native translation silently dropping unsupported properties (grid, box-shadow, pseudo-elements, position:fixed), producing components that render but look broken; (2) zombie dev server processes after crashes or aborts, locking ports; and (3) cross-platform path/spawn issues breaking Windows and Linux users. Mitigation for each is well-understood: a property compatibility matrix with inline TODO comments for untranslatable CSS, PID file management with cleanup handlers for dev servers, and path.posix for generated source code with shell:true for Windows spawning.

## Key Findings

### Recommended Stack

Motif itself adds zero new npm dependencies. All new capabilities use Node.js built-ins (child_process.spawn, node:fs, node:path) and CLI tool spawning. Three new scripts are needed: `scripts/scaffold.js` (~120 lines, framework project scaffolding), `scripts/tokens-to-rn.js` (~60 lines, CSS-to-TypeScript token transpilation), and `scripts/auto-run.js` (~80 lines, dev server launch + browser opening).

**Core technologies (spawned, not imported):**
- `create-next-app@latest` (Next.js 16.1.x): Web app scaffolding with App Router, TypeScript, Tailwind -- the primary target framework
- `create-expo-app@latest` (Expo SDK 55, RN 0.83): Mobile app scaffolding with blank-typescript template
- `npm create vite@latest` (Vite 7.3.x): Lightweight web alternative with react-ts template
- `npx serve .`: Static HTML serving for non-framework projects

**Critical version note:** All frameworks require Node.js >=18 or >=20. Motif requires >=22. No conflicts -- Motif's requirement is the strictest and satisfies all frameworks.

### Expected Features

**Must have (table stakes):**
- Framework recommendation during /motif:init -- conversational, domain-aware, with override support
- Project scaffolding via official create-X tools with non-interactive flags
- JSX/TSX component output -- compose-screen.md branches on framework for correct output format
- Tailwind config extension with semantic token mapping (bg-primary, not bg-[var(--color-primary)])
- Next.js framework reference file -- import patterns, file placement, "use client" directive rules
- launch.json generation for Claude Code Desktop preview
- Auto-run offer after composition with dev server management

**Should have (differentiators):**
- Domain-intelligent framework recommendation (fintech -> Next.js for SSR, social -> Expo for native scroll)
- Token-first Tailwind integration (semantic classes backed by CSS variables, like shadcn/ui)
- Unified token file for web + mobile (single tokens.css source, mechanical derivation)
- Design-system-then-components pipeline (Motif's unique advantage over v0/Bolt.new/Lovable)

**Defer (v2+):**
- shadcn/ui component library integration
- Cross-platform single project (web + mobile from one design system simultaneously)
- Pre-built project templates (SaaS dashboard, social feed, marketplace)
- Additional frameworks (Svelte, Angular, Flutter, SwiftUI)
- Full-stack scaffolding (database, auth, API routes)
- Visual drag-and-drop editor
- Framework migration tooling

### Architecture Approach

The architecture follows three core patterns: (1) **Canonical + Derived** -- tokens.css is always generated first by the design architect, then mechanically transformed to platform-specific formats by a deterministic script; (2) **Overlay, Don't Fork** -- platform-specific composition rules are appended to the composer agent prompt as overlay files, not baked into separate agent definitions; (3) **Platform Detection Flows Down** -- platform is detected once at init, stored in STATE.md, and read by all downstream workflows. This minimizes changes to existing components: only 8 files are modified (mostly small changes), 7-8 new files are added, and the entire design intelligence layer (verticals, research, COMPONENT-SPECS.md, review) remains untouched.

**Major components:**
1. **Platform Adapters Reference** (core/references/platform-adapters.md) -- registry of supported platforms, token format specs, element mapping tables
2. **Token Transformer Script** (scripts/token-transformer.js) -- deterministic CSS-to-platform token conversion, ~300 lines
3. **Composer Platform Overlays** (core/templates/composer-react.md, composer-rn.md) -- platform-specific composition rules injected into agent prompts
4. **Scaffolding Script** (scripts/scaffold.js) -- spawns official CLI tools, post-processes with Motif file overlay
5. **Auto-Run Script** (scripts/auto-run.js) -- dev server launch, stdout-based ready detection, browser/simulator opening

### Critical Pitfalls

1. **CSS-to-RN silent property drops** -- Grid, box-shadow, pseudo-elements, position:fixed, calc(), CSS variables all have no React Native equivalent. Build a property compatibility matrix; emit inline TODO comments for untranslatable properties; never silently drop.
2. **Zombie dev server processes** -- Spawned child processes survive parent crashes, locking ports. Use PID files, cleanup handlers on exit/SIGINT/SIGTERM, and tree-kill (process.kill(-pid)) to kill process groups.
3. **Cross-platform spawn failures** -- `npx` is `npx.cmd` on Windows; path.join produces backslashes; case-insensitive macOS hides import case mismatches that crash on Linux. Use shell:true on Windows, path.posix for generated code, exact case matching in imports.
4. **Token file drift (two sources of truth)** -- tokens.css and tokens.ts/tokens.native.ts can diverge if the LLM generates them independently. Always derive platform files from tokens.css via deterministic script, never LLM-generated.
5. **Port conflicts on auto-run** -- Port 3000 is commonly in use; framework prompts for alternative port hang in non-TTY child processes. Pre-check port availability, auto-increment, pass explicit --port flag, set CI=true to suppress prompts.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Platform Foundation
**Rationale:** Everything downstream depends on platform detection and token transformation. This is pure infrastructure with no user-facing output, but without it, no other phase can function correctly.
**Delivers:** Platform detection in init, STATE.md platform field, token-transformer.js script, platform-adapters.md reference
**Addresses:** Stack persistence to PROJECT.md/STATE.md (table stakes), token delivery format per platform
**Avoids:** Token drift (Pitfall 6) by establishing canonical+derived pattern from the start

### Phase 2: Next.js Scaffolding and Output
**Rationale:** Next.js is the highest-demand framework and the simplest cross-platform target (web-only, no RN translation complexity). Validates the entire platform adapter pattern with the least-risky framework first.
**Delivers:** create-next-app scaffolding via spawn, Next.js framework reference file, composer-react.md overlay, Tailwind config extension with token mapping, JSX/TSX component output from /motif:compose
**Addresses:** Framework recommendation (table stakes), project scaffolding (table stakes), JSX component output (table stakes), Tailwind token integration (table stakes + differentiator)
**Avoids:** Interactive prompt hanging (Pitfall 12) via non-interactive flags; cross-platform spawn issues (Pitfall 4) via shell:true on Windows

### Phase 3: Auto-Run and Preview
**Rationale:** Auto-run depends on a scaffolded, composable project (Phase 2). It is the "wow moment" that completes the zero-to-running story but is useless without working scaffolding and component output.
**Delivers:** scripts/auto-run.js, dev server management with PID tracking, browser opening, launch.json generation, port conflict resolution
**Addresses:** Auto-run offer after composition (table stakes), launch.json for Claude Code Desktop (table stakes)
**Avoids:** Zombie processes (Pitfall 3) via PID files and cleanup handlers; port conflicts (Pitfall 9) via pre-check and auto-increment

### Phase 4: Expo / React Native Support
**Rationale:** Mobile is the second platform and involves the hardest translation challenges (CSS-to-RN property gaps, different responsive paradigm, simulator prerequisites). Shipping this AFTER Next.js is proven reduces risk.
**Delivers:** create-expo-app scaffolding, tokens.native.ts generation, composer-rn.md overlay, React Native component output, icon delivery via lucide-react-native
**Addresses:** Expo/RN scaffolding and output (P2 feature), tokens.ts for React Native (P2), NativeWind configuration (P2)
**Avoids:** CSS-to-RN silent drops (Pitfall 2) via property compatibility matrix; Text-in-View crashes (Pitfall 13) via strict Text wrapping; incorrect imports (Pitfall 10) via curated import map

### Phase 5: Vite + React and Polish
**Rationale:** Vite+React is a lightweight web alternative that reuses nearly all of Phase 2's web-react infrastructure. Low incremental cost, broadens framework coverage.
**Delivers:** Vite scaffolding, Vite-specific dev server handling in auto-run, hook updates for platform-aware validation
**Addresses:** Vite+React support (P2 feature)
**Avoids:** Version mismatch (Pitfall 1) -- by this phase, the environment detection pattern is battle-tested

### Phase Ordering Rationale

- **Foundation first:** Platform detection and token transformation are dependencies for every subsequent phase. Building them first prevents rework.
- **Next.js before Expo:** Web output is simpler (no CSS-to-RN translation), higher demand, and validates the platform adapter pattern with lower risk. If the pattern works for Next.js, it will work for RN with predictable additions.
- **Auto-run after scaffolding:** Cannot start a dev server without a scaffolded project. Auto-run is also the most isolated capability -- it can be developed and tested independently once scaffolding works.
- **Expo last among major platforms:** RN has the most pitfalls (4 of 13 are RN-specific), the hardest translation challenges, and the heaviest prerequisites (Xcode, simulators). Deferring it de-risks the milestone.
- **Vite last:** Near-zero incremental cost given web-react infrastructure from Phase 2. Can be squeezed in or deferred without affecting the milestone story.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Next.js Scaffolding):** Needs research on exact file placement conventions for Next.js 16 App Router, especially the co-location pattern for _components/ directories and how next/font/google integrates with Motif's token-based font selection.
- **Phase 4 (Expo/RN):** Needs significant research on CSS property compatibility matrix, RN font loading (expo-font vs config plugin), and NativeWind v5 configuration specifics. The responsive design paradigm shift (CSS media queries to useWindowDimensions) requires careful design.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Platform Foundation):** Well-documented patterns -- STATE.md field addition, CSS parsing via regex, TypeScript code generation. No unknowns.
- **Phase 3 (Auto-Run):** child_process.spawn, stdout parsing, PID file management -- all standard Node.js patterns with extensive documentation.
- **Phase 5 (Vite):** Reuses Phase 2 infrastructure. Vite scaffolding is simpler than Next.js (fewer flags, no App Router complexity).

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All framework versions verified against official docs (March 2026). CLI flags confirmed. Zero-dependency constraint validated. |
| Features | MEDIUM-HIGH | Feature set grounded in real competitor analysis (v0, Bolt.new, Lovable). MVP scoping is opinionated and clear. NativeWind v5 status is "preview" which adds uncertainty to Expo+Tailwind path. |
| Architecture | HIGH | Platform adapter pattern is well-established in cross-platform tooling. Canonical+derived token approach prevents the most dangerous pitfall (token drift). Codebase analysis confirms minimal modification footprint. |
| Pitfalls | HIGH | Critical pitfalls verified against official RN docs, Node.js child_process docs, and npm ecosystem behavior. CSS-to-RN gap is extensively documented. Auto-run pitfalls follow known patterns from the Node.js community. |

**Overall confidence:** HIGH

### Gaps to Address

- **NativeWind v5 stability:** NativeWind v5 is in preview as of March 2026. If it ships unstable, the Expo+Tailwind path may need to fall back to StyleSheet.create with raw token imports. Monitor before Phase 4 planning.
- **Windows testing:** All research was conducted on macOS. The cross-platform spawn and path pitfalls are well-documented but need actual Windows testing before claiming Windows support. Consider deferring Windows support to a patch release with dedicated testing.
- **Next.js 16 App Router conventions:** Next.js 16.1 is recent. Some community conventions around co-location and route groups may still be evolving. Validate file placement patterns against real Next.js 16 projects before finalizing the framework reference file.
- **Expo SDK 55 + React 19.2 maturity:** Expo SDK 55 shipped January 2026 with React 19.2. Some third-party Expo libraries may not yet be fully compatible. Run expo-doctor as part of scaffold validation.
- **Nuxt/Vue support scope:** FEATURES.md lists Nuxt/Vue as P3, but STACK.md does not research it. If Vue support is desired for v1.4.x, a separate stack research pass is needed for Nuxt 4 scaffolding and Vue SFC composition patterns.

## Sources

### Primary (HIGH confidence)
- [Next.js create-next-app CLI Reference](https://nextjs.org/docs/app/api-reference/cli/create-next-app) -- scaffolding flags, version 16.1.6
- [Vite Getting Started Guide](https://vite.dev/guide/) -- scaffolding, templates, version 7.3.1
- [Expo create-expo-app Documentation](https://docs.expo.dev/more/create-expo/) -- flags, templates, SDK 55
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) -- React Native 0.83, React 19.2
- [React Native StyleSheet Documentation](https://reactnative.dev/docs/stylesheet) -- styling API, platform differences
- [React Native Flexbox Layout](https://reactnative.dev/docs/flexbox) -- flexDirection defaults, flex behavior
- [Node.js child_process Documentation](https://nodejs.org/api/child_process.html) -- spawn, stdio, process groups
- [Expo CLI Documentation](https://docs.expo.dev/more/expo-cli/) -- start, run:ios, run:android commands
- Existing Motif codebase analysis (direct source code inspection, March 2026)

### Secondary (MEDIUM confidence)
- [NativeWind v5 overview](https://www.nativewind.dev/v5) -- Tailwind CSS for React Native (preview status)
- [cross-spawn npm package](https://www.npmjs.com/package/cross-spawn) -- Windows spawn patterns
- [css-to-react-native](https://github.com/styled-components/css-to-react-native) -- property compatibility reference
- [Bolt.new GitHub repository](https://github.com/stackblitz/bolt.new) -- competitor architecture patterns
- [Claude Code Desktop documentation](https://code.claude.com/docs/en/desktop) -- launch.json configuration
- Competitor analysis sources (v0, Lovable, Replit comparisons)

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*
