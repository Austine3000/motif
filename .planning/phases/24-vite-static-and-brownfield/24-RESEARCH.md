# Phase 24: Vite, Static, and Brownfield - Research

**Researched:** 2026-03-11
**Domain:** Vite scaffolding, static site scaffolding, brownfield platform adoption
**Confidence:** HIGH for codebase-grounded architecture and gap analysis, MEDIUM for exact scaffold UX because no executable scaffolder exists yet

## Summary

Phase 24 is not just "add one more overlay." In this codebase, it is the phase where platform metadata must become real scaffold/adoption behavior for non-Next web paths.

Phase 22 and 23 already established the correct extension points:
- platform is persisted in STATE.md
- platform behavior is centralized in `.claude/get-motif/references/framework-registry.json`
- Tailwind token bridging already works for both `web-nextjs` and `web-vite`
- `/motif:compose` already has generic overlay injection for any non-static platform
- brownfield scan artifacts already exist and already feed composition

But the codebase also has planning-critical gaps:
- there is no executable scaffold runner yet; the registry only documents commands
- `composer-vite.md` does not exist
- `web-static` still behaves like the legacy no-overlay path, not a real scaffolded site root
- `scripts/project-scanner.js` does not actually distinguish Vite or Expo today; it returns `react` for both
- brownfield entry gating in `/motif:init` is too narrow for common Expo projects and only partially expresses the adoption flow

**Primary recommendation:** plan Phase 24 as two implementation tracks over a shared execution layer:
1. Vite scaffold materialization + Vite composition overlay
2. Static scaffold materialization + brownfield platform adoption hardening

Do not plan this phase as "just update registry JSON." That would repeat the existing gap between documented scaffold intent and actual runnable/openable output.

## What Already Exists

### Reusable Foundation

| Surface | Current State | Planning Implication |
|---|---|---|
| `.claude/get-motif/references/framework-registry.json` | Already has `web-vite` and `web-static` entries | Keep registry as the single source of platform metadata. Extend it; do not fork logic into workflows. |
| `.claude/get-motif/workflows/compose-screen.md` | Already resolves overlays for any non-`web-static` platform | Vite composition should plug into the existing overlay mechanism, not invent a new orchestrator path. |
| `.claude/get-motif/references/composer-nextjs.md` | Working reference overlay pattern | Use it as the template for `composer-vite.md`, but change routing/import/file-placement rules. |
| `.claude/get-motif/scripts/tailwind-config-generator.js` | Already supports `web-nextjs` and `web-vite` | Vite does not need a new token bridge generator. It needs scaffold wiring that imports the generated CSS into the actual app. |
| `.claude/get-motif/scripts/token-transformer.js` + `generate-system.md` | Already produce `tokens.ts` for web platforms | Vite can reuse these artifacts directly. |
| `.claude/get-motif/workflows/scan.md` + `scripts/project-scanner.js` | Existing brownfield scan pipeline and artifacts | Brownfield work should harden framework detection and adoption logic, not replace scanning. |
| `.claude/commands/motif/init.md` | Already has recommendation logic and brownfield-first intent | Phase 24 should deepen this command into real adoption/scaffold decisions instead of moving the logic elsewhere. |

### Established Patterns From Phase 23

- Registry-driven platform behavior is the pattern.
- Overlay-driven composition is the pattern.
- `HAS_OVERLAY` preserves static backward compatibility today.
- The three-layer Tailwind bridge is already the web styling contract.
- Brownfield flow is intended to be "Motif discovers, user decides, agents execute."

## Planning-Critical Gaps

### Gap 1: No Real Scaffold Execution Layer Yet

The registry contains scaffold commands and sequences, but there is no script or workflow that actually executes them and then wires generated Motif artifacts into a runnable project.

Why this matters:
- Success criterion 1 requires a runnable Vite app.
- Success criterion 3 requires a static site that opens directly in a browser.
- If planning assumes scaffold metadata is already "implemented enough," the phase will under-scope the real work.

### Gap 2: Scanner Does Not Detect Vite or Expo as Platforms

`scripts/project-scanner.js` checks `next`, `nuxt`, `remix`, `astro`, `svelte`, `vue`, `react`, `angular` in that order. It never checks `vite`, `expo`, or `react-native`.

Current effect:
- a Vite project is detected as `react`, not `vite`
- an Expo project is detected as `react`, not `expo`
- `/motif:init` documentation says "Vite detected -> web-vite, Expo detected -> mobile-expo," but the scanner cannot currently produce those detections

Why this matters:
- SCAF-06 cannot be satisfied reliably without scanner fixes
- ambiguous React projects will be over-classified as brownfield web-react even when the actual platform cannot be inferred

### Gap 3: Brownfield Gate Is Too Narrow

`/motif:init` currently treats a project as brownfield only if `package.json` exists and one of `src/`, `app/`, `lib/`, `pages/` exists.

Current effect:
- common Expo projects with root-level `App.tsx` and no `src/` are easy to miss
- brownfield detection is more "web source folder present" than "existing framework project present"

Why this matters:
- SCAF-06 explicitly covers existing Next.js, Vite, and Expo projects
- the gate should align with framework signatures, not only directory names

### Gap 4: Vite Registry Entry Is Only Partial

The `web-vite` registry entry currently gives:
- create-vite scaffold command
- dev server metadata
- token formats
- a future overlay filename

It does not yet express:
- React Router installation/bootstrap
- Tailwind CSS installation/bootstrap into the real Vite app
- shadcn parity, even though `SCAF-07` is marked satisfied globally in requirements traceability

Why this matters:
- success criterion 1 explicitly requires React Router + TypeScript + Tailwind CSS
- success criterion 2 requires route-aware composition conventions
- there is a traceability mismatch around `SCAF-07` that planning should resolve, not ignore

### Gap 5: Static Path Is Still Legacy Composition, Not Real Site Scaffolding

`web-static` intentionally has no overlay today, and the greenfield non-overlay fallback in `compose-screen.md` still writes to `.planning/design/screens/{SCREEN_NAME}/`.

Why this matters:
- that preserves old HTML composition behavior, but it does not produce a browser-openable site scaffold
- the phase must decide how static composition lands in actual project files without breaking backward compatibility for older flows

## Standard Stack

### Vite

Use:
- official Vite React TypeScript scaffold from the existing registry entry
- React Router as the required routing layer
- Tailwind CSS using the existing Motif token bridge output
- existing token transformer and `globals.css` generator outputs from `/motif:system`
- the same Lucide-based icon story already used by web overlays

Recommended Vite runtime shape:
- `src/main.tsx` bootstraps React and routing
- `src/app/router.tsx` or `src/router.tsx` defines the route tree
- `src/pages/{RouteName}.tsx` holds route pages
- `src/components/` holds shared reusable components
- `src/index.css` imports the generated token bridge CSS

Do not treat Vite as "Next.js but without App Router." The overlay must be explicit about client-side routing, standard `<img>`, and non-Next imports.

### Static

Use:
- plain HTML/CSS/JS generated structure from the registry
- `css/tokens.css` as the design-token contract
- `css/styles.css` for the starter site shell
- `js/main.js` only for progressive enhancement

Recommended static runtime shape:
- `index.html` as the landing page entry
- optional additional HTML pages when composition expands beyond one page
- shared token-linked CSS under `css/`
- enhancement-only JS under `js/`

Do not introduce a JS-heavy SPA path for static. The phase boundary is HTML/CSS-native output.

### Brownfield

Use:
- existing scanner artifacts: `PROJECT-SCAN.md`, `CONVENTIONS.md`, `COMPONENT-GAP.md`
- init as the entry point for deciding whether to scaffold or adopt
- compose-screen as the brownfield-aware downstream consumer

## Architecture Patterns

### Pattern 1: Add a Shared Scaffold Materialization Layer

This phase needs a concrete runner that turns registry metadata plus generated Motif design artifacts into real project files.

That layer should:
- execute CLI scaffolds for framework projects
- write generated files for static projects
- copy or materialize generated Motif artifacts into the project
- perform ordered post-install steps
- be reusable by Next.js, Vite, and later Expo

Planning implication:
- even if Phase 24 only verifies Vite/static/brownfield outcomes, the implementation should avoid creating a Vite-only scaffolder
- otherwise Phase 25 and 26 will inherit three parallel scaffold implementations

### Pattern 2: Keep Registry as the Contract, Not the Executor

The registry should remain declarative:
- scaffold command/args
- post-install sequence
- conventions
- overlay filename
- generated structure for non-CLI platforms

The executor should consume registry entries. Do not add platform-specific shell logic directly into `init.md`.

### Pattern 3: Vite Composition Should Be Overlay-Driven

The existing compose orchestrator is already ready for `composer-vite.md`.

Planning should create a Vite overlay that defines:
- file output rules for route pages and shared components
- import rules for React Router, Lucide, and standard React
- Tailwind-only styling rules matching the existing token bridge
- image and font rules appropriate to Vite
- anti-slop additions specific to SPA/router conventions

Recommended Vite file output rules:
- page: `src/pages/{RouteName}.tsx`
- route-scoped sections: `src/pages/{route}/components/{Name}.tsx` or `src/components/{screen}/`
- shared components: `src/components/{Name}.tsx`
- router bootstrap: `src/app/router.tsx` or `src/router.tsx`

The exact directory name is flexible, but planning should pick one convention and encode it in both the registry and overlay.

### Pattern 4: Static Should Stay Overlay-Free if Possible

The codebase already treats `web-static` as the no-overlay path, and Phase 23 explicitly preserved that.

Recommended approach:
- keep static output format HTML/CSS-native
- keep no-overlay composition if the output rules can still be satisfied
- add static-specific scaffold destination logic so composed files land in real site files instead of only `.planning/design/screens/`

Only introduce a static overlay if file placement and HTML conventions cannot be expressed cleanly without it.

### Pattern 5: Brownfield Adoption Must Be Confidence-Based

Adoption should not be a binary "scan exists -> skip scaffold."

Recommended decision model:
- if framework confidence is clear and maps to a supported platform: adopt automatically, then inform the user
- if framework is ambiguous: ask the user to confirm the platform before skipping scaffolding
- if scan data is stale and detection is ambiguous: hard stop and re-scan
- if scan data is stale but detection is clear: warn and proceed

This matches the phase context and the existing brownfield philosophy.

### Pattern 6: Materialize Design Artifacts Into the App, Do Not Import From `.planning/`

Generated files in `.planning/design/system/` are planning artifacts. Real scaffolded apps should receive project-facing copies or generated equivalents.

For Vite:
- import a project-local CSS entry such as `src/index.css`
- include the generated token bridge there
- keep runtime imports inside the actual app tree

For static:
- copy `tokens.css` into `css/tokens.css`
- ensure HTML links reference browser-resolvable relative paths

Do not make the user’s runtime app depend on `.planning/` paths.

## Don't Hand-Roll

- Do not hand-roll framework detection logic in multiple places. Fix `project-scanner.js` and let init consume its result.
- Do not hand-roll a custom router abstraction for Vite. Use React Router directly.
- Do not invent a second token-bridge generator for Vite. Reuse `tailwind-config-generator.js`.
- Do not create a separate Vite composition orchestration flow. Reuse overlay injection already in `compose-screen.md`.
- Do not convert static into a mini-SPA just to reuse React code. Keep HTML/CSS/JS-native output.
- Do not make platform decisions from directory heuristics alone. Use package/config signatures first, directory structure second.

## Common Pitfalls

### Pitfall 1: Treating `react` Detection as Vite Detection

What goes wrong:
- brownfield adoption classifies any React app as Vite-compatible

Why it happens:
- the scanner does not look for `vite` dependencies or `vite.config.*`

How to avoid:
- add explicit Vite signatures before generic React detection
- keep generic React as ambiguous, not auto-adopted

### Pitfall 2: Missing Expo From Brownfield Detection

What goes wrong:
- `/motif:init` fails to recognize existing Expo projects and falls back to greenfield

Why it happens:
- the scanner never checks `expo` or `react-native`
- the brownfield gate expects source directories that Expo may not use

How to avoid:
- add Expo-specific detection
- widen brownfield entry checks to common mobile project signatures

### Pitfall 3: Planning Vite as "Registry Update Only"

What goes wrong:
- the codebase can describe Vite but still cannot produce a runnable Vite app

Why it happens:
- current scaffolding is declarative, not executable

How to avoid:
- include scaffold execution/materialization in plan scope

### Pitfall 4: Forgetting Router Bootstrap in Vite

What goes wrong:
- composed pages exist, but no router imports them, so the app still renders the starter screen or fails

Why it happens:
- Vite’s registry entry has a pages pattern but no router bootstrap contract yet

How to avoid:
- make router setup an explicit artifact in the scaffold plan
- validate that `/motif:compose` output aligns with the chosen route file convention

### Pitfall 5: Static Scaffold Exists but Composition Still Writes Only to Planning Artifacts

What goes wrong:
- users get an `index.html`, but later composition does not update the actual site

Why it happens:
- `web-static` currently falls back to the legacy no-overlay compose path

How to avoid:
- decide up front where static composed pages should land after scaffolding
- verify actual site files change, not only `.planning/design/screens/`

### Pitfall 6: Requirement Traceability Drift Around `SCAF-07`

What goes wrong:
- Vite is presented as parity with Next.js, but its registry entry still lacks shadcn setup while `SCAF-07` is already marked satisfied

Why it happens:
- Phase 23 satisfied the Next.js side but the requirement label covers both Next.js and Vite

How to avoid:
- either extend Vite scaffold parity in Phase 24 or explicitly repair the traceability record during planning

## Code Examples

### Example 1: Brownfield Platform Resolution

```js
function resolvePlatform(scan) {
  const framework = scan.framework?.name;

  if (framework === 'next') return { platform: 'web-nextjs', confidence: 'clear' };
  if (framework === 'vite') return { platform: 'web-vite', confidence: 'clear' };
  if (framework === 'expo') return { platform: 'mobile-expo', confidence: 'clear' };

  if (framework === 'react') {
    return { platform: null, confidence: 'ambiguous' };
  }

  return { platform: null, confidence: 'unknown' };
}
```

Planning note:
- generic React should not silently map to Vite

### Example 2: Recommended Vite Scaffold Shape

```text
{project}/
  src/
    main.tsx
    index.css
    app/
      router.tsx
      AppShell.tsx
    pages/
      HomePage.tsx
      DashboardPage.tsx
    components/
      ui/
      marketing/
  public/
  package.json
  vite.config.ts
  tsconfig.json
```

Key rule:
- `main.tsx` mounts the router
- `index.css` is the place where the generated Motif Tailwind bridge becomes runtime CSS

### Example 3: Recommended Static Scaffold Shape

```text
{project}/
  index.html
  about.html
  css/
    tokens.css
    styles.css
  js/
    main.js
  assets/
```

Key rule:
- every HTML file must link browser-resolvable relative CSS paths
- the starter must still open via file:// without a dev server

## Planning Implications

### Recommended Plan Split

#### Plan A: Vite Scaffold + Vite Overlay

Should cover:
- shared scaffold executor/materializer introduction
- Vite scaffold execution from registry
- React Router bootstrap
- Tailwind CSS wiring using existing Motif-generated CSS artifacts
- `composer-vite.md`
- any required Vite registry expansion

#### Plan B: Static Scaffold + Brownfield Adoption

Should cover:
- static generated structure materialization
- token-linked HTML/CSS starter
- static compose destination rules
- scanner detection hardening for Vite and Expo
- init adoption logic for clear vs ambiguous brownfield cases

### Scope Decision You Should Make Before Planning

Decide whether Phase 24 also closes the Vite half of `SCAF-07`.

Recommendation:
- yes, if "same scaffolding and composition quality as Next.js" is taken literally
- no, only if you explicitly note that Vite shadcn parity is deferred and repair requirement traceability

Without this decision, the phase plan will be internally inconsistent.

## Validation Architecture

Validation should drive Nyquist planning here because most failure modes are integration failures, not syntax failures.

### Deterministic Verification

- scanner fixture tests:
  - Next.js fixture -> `next`
  - Vite fixture -> `vite`
  - Expo fixture -> `expo`
  - generic React fixture -> ambiguous, not auto-adopted
- init decision tests:
  - clear brownfield -> scaffold skipped, platform adopted
  - ambiguous brownfield -> user confirmation required
- registry/executor tests:
  - Vite command generation from registry is correct
  - static generated structure is written exactly as declared
- compose integration tests:
  - `web-vite` resolves `composer-vite.md`
  - `web-static` preserves no-overlay behavior unless explicitly changed

### Artifact Verification

- Vite scaffold produces:
  - router bootstrap file
  - Tailwind CSS entry file
  - package scripts that run
- static scaffold produces:
  - `index.html`
  - `css/tokens.css`
  - `css/styles.css`
  - `js/main.js`
- brownfield adoption produces:
  - platform persisted in STATE.md
  - no scaffold execution when clear detection exists

### Human / E2E Verification

- run `/motif:init` for a greenfield Vite project and verify the result is immediately runnable with `npm run dev`
- run `/motif:compose` on that Vite project and verify output uses React Router conventions rather than Next.js App Router conventions
- run `/motif:init` for a static landing project and verify `index.html` opens directly in a browser with tokens linked
- run `/motif:init` inside existing Next.js, Vite, and Expo fixtures and verify scaffolding is skipped and the correct platform is adopted
- run `/motif:init` inside an ambiguous React project and verify the user is asked to confirm instead of Motif guessing

### Nyquist-Planning Consequence

Do not leave validation until the end of the phase. Plan fixture-based scanner/adoption tests alongside implementation. Brownfield detection is the highest-risk logic in this phase because false positives create destructive or confusing behavior.

## Open Questions

1. Should Vite receive shadcn parity in this phase, or should requirement traceability be corrected?
2. Should static composition remain fully overlay-free, or does actual file placement justify a lightweight static overlay?
3. Where should the shared scaffold executor live so later Expo work can reuse it cleanly?

## Recommended Planning Baseline

If planning starts today, assume:
- shared scaffold execution is part of Phase 24 scope
- Vite requires both scaffold work and overlay work
- static requires real project-file destinations, not only planning artifacts
- brownfield adoption requires scanner fixes before init UX changes are trustworthy
- validation must include fixture-based platform detection
