# Phase 24: Vite, Static, and Brownfield - Context

**Gathered:** 2026-03-11
**Status:** Ready for planning

<domain>
## Phase Boundary

Deliver the non-Next.js web paths for Motif: scaffold Vite/React projects with route-aware composition, preserve and improve the static HTML landing-page flow, and adopt existing web projects through brownfield detection so scaffolding is skipped when a framework is already present.

</domain>

<decisions>
## Implementation Decisions

### Vite app shape
- Vite should feel like a real app immediately, not a near-blank starter.
- Scaffold a routed app from day one. React Router conventions should be first-class, not deferred.
- Vite output should match the Next.js path in quality and system polish, while following Vite conventions instead of App Router conventions.
- Include a reusable app shell with navigation by default rather than only a bare route frame.

### Static landing path
- Static output should support a small site starter, not just a single throwaway page. It should leave room for realistic multi-page website composition.
- Keep the static path HTML/CSS-native and stable, but raise the quality toward a more intentional, design-forward mini-site system.
- Default JavaScript should stay light and enhancement-focused, not JS-heavy.
- Starter structure should be opinionated enough to include meaningful marketing sections, while still allowing the user to compose the site the way real multi-page websites are typically built.

### Brownfield adoption
- If framework detection is ambiguous in an existing web project, ask the user to confirm the adopted platform instead of guessing.
- If framework detection is clear, users may still override the adopted platform, but Motif should warn before doing so.
- Brownfield behavior should be balanced: respect existing conventions and reuse existing patterns, but do not treat the codebase as untouchable.
- Stale scan data should become a hard stop only when the project is ambiguous. In clear cases, stale scan handling can remain less strict.

### Claude's Discretion
- Exact Vite scaffold file layout, as long as it delivers a routed app shell and aligns with Vite/React Router conventions.
- Exact static starter section names and copy placeholders, as long as the result stays HTML/CSS-native and supports multi-page expansion.
- Exact heuristics and confidence thresholds for deciding when a brownfield project is "ambiguous."
- Exact warning copy and override UX around brownfield platform confirmation.

</decisions>

<specifics>
## Specific Ideas

- For Vite, the desired feeling is "same confidence and finish as the Next.js path, but for SPA-style projects."
- For static sites, the desired result is a hybrid of two goals: preserve stable HTML/CSS output and also make it feel closer to a polished, design-forward mini-site starter.
- Static scaffolding should still let the user compose the app/site in a way that mirrors real-world multi-page websites, not trap them in a one-page-only structure.

</specifics>

<code_context>
## Existing Code Insights

### Reusable Assets
- `.claude/get-motif/references/framework-registry.json`: already contains `web-vite` and `web-static` entries, including scaffold metadata, token formats, conventions, and overlay hooks.
- `.claude/commands/motif/init.md`: already contains framework recommendation logic, brownfield priority rules, and platform selection flow that Phase 24 should extend rather than replace.
- `.claude/get-motif/workflows/compose-screen.md`: already supports platform overlay injection and brownfield-aware composition inputs.
- `.claude/get-motif/workflows/scan.md` and `.claude/get-motif/scripts/project-scanner.js`: provide the existing brownfield scan pipeline, correction model, and artifact outputs.
- `.claude/get-motif/references/composer-nextjs.md`: serves as the reference pattern for creating a Vite-specific composition overlay.
- `.claude/get-motif/scripts/tailwind-config-generator.js`: already generates the Tailwind token bridge for `web-nextjs` and `web-vite`.

### Established Patterns
- Platform behavior is centralized in the framework registry as static JSON, not inferred ad hoc in each workflow.
- Overlay-based composition is the established pattern for platform-specific output. Overlay rules override base composition behavior.
- `web-static` is intentionally the no-overlay path today; backward compatibility for static HTML composition is a known requirement.
- Brownfield flows follow "Motif discovers, the user decides, the agents execute" rather than silent irreversible automation.
- Web token generation already supports both Next.js and Vite through the same Tailwind bridge path.

### Integration Points
- `init.md` is the entry point for platform recommendation, brownfield detection, and any user confirmation on ambiguous web projects.
- `framework-registry.json` is where Vite/static scaffold and composition defaults must stay aligned with planning decisions.
- `compose-screen.md` is where `composer-vite.md` will be resolved and where stale brownfield scan policy may need tightening.
- Scan artifacts (`PROJECT-SCAN.md`, `CONVENTIONS.md`, `COMPONENT-GAP.md`) are the handoff surface from brownfield detection into composition.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 24-vite-static-and-brownfield*
*Context gathered: 2026-03-11*
