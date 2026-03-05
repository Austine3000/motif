# Phase 13: Scan Infrastructure - Context

**Gathered:** 2026-03-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Build a project scanner that detects an existing codebase's structure, catalogs its components, extracts its conventions, and presents findings to the user for confirmation. This phase produces scan artifacts consumed by all downstream phases (token integration, system generation, composition). No design generation happens in this phase — scan only.

</domain>

<decisions>
## Implementation Decisions

### Scan Invocation
- Init auto-scans when it detects an existing project (package.json, src/ folder). No prompt to ask — just scan.
- `/motif:scan` exists as a separate command for re-scanning later (after project changes).
- Full rescan every time — no incremental updates. Simpler, always accurate.
- Smart defaults for skip directories: node_modules, .git, dist, build, .next, etc. No user-configurable excludes in v1.2.

### Findings Presentation
- Summary + drill-down format: compact overview first, user can expand any section for details and corrections.
- Scan results saved to a markdown file (PROJECT-SCAN.md) that the user can manually edit before running /motif:system.
- Corrections are choice-based: present the finding with options ("I detected Tailwind CSS. Correct? [Yes / No, it's CSS Modules / Other]").
- Component catalog displayed grouped by directory: "src/components/ui/ (12 components), src/features/ (8 components)".

### Component Cataloging Depth
- Detection uses both approaches: directory heuristics first (components/, ui/ directories), then verify with export detection (uppercase function exports, class components). Catches conventional and unconventional projects.
- Extract basic prop names and types from component signatures — enough for the composer to generate correct imports.
- Ambiguous files included with confidence tags: HIGH (clearly a component), MEDIUM (might be), LOW (probably not). User can correct during confirmation.
- Categorize components: primitives (Button, Input), composites (Card, Modal), pages (Dashboard, Settings), layouts (Sidebar, Header).

### Convention Extraction
- Extract both styling conventions (border-radius, spacing, shadows, color naming) AND code conventions (import patterns, file structure, naming case, export patterns, barrel files).
- Sample 3-5 representative component files to extract patterns. Pick by size and location for representativeness.
- Report inconsistencies to the user: "Your border-radius varies: 60% use rounded-lg, 40% use rounded-md." Let the user decide which to follow.
- Conventions stored as a separate CONVENTIONS.md file alongside PROJECT-SCAN.md. User can review and edit conventions independently.

### Claude's Discretion
- Exact heuristics for component detection (regex patterns, file size thresholds)
- How to select "representative" files for convention sampling
- Confidence threshold definitions for component categorization
- Exact format and sections of PROJECT-SCAN.md and CONVENTIONS.md

</decisions>

<specifics>
## Specific Ideas

- The scan should feel instant and informative — detect, present, confirm. Not a long interrogation.
- The core principle throughout: "Motif discovers, the user decides, the agents execute."
- Scan results must stay under 2000 tokens (from research) to fit within context budgets for downstream agents.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 13-scan-infrastructure*
*Context gathered: 2026-03-05*
