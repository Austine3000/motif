# Project Research Summary

**Project:** Motif v1.2 — Brownfield Intelligence Features
**Domain:** AI design engineering system extension — project scanning, component cataloging, and brownfield-aware composition
**Researched:** 2026-03-04
**Confidence:** HIGH

## Executive Summary

Motif v1.2 adds brownfield intelligence to an existing AI design engineering CLI. The core insight from research is that brownfield awareness is not a single feature — it is a pipeline-wide capability that flows from a single scan artifact (SCAN-SUMMARY.md) through every existing workflow step. The approach is scan-present-decide-execute: the system scans the user's project, presents findings for confirmation, the user makes one top-level decision (respect / fresh / customize), and then every downstream agent (init, research, system generator, composer) operates with project-aware context. This is additive to the existing pipeline — greenfield projects skip scanning entirely and every existing workflow must continue to work unchanged when no scan artifact is present.

The recommended approach is a staged build in four phases: (1) scan infrastructure (new agents, new artifacts, state machine extension), (2) init and system generator integration (pre-fill init from scan, EXTRACT+EXTEND mode for token generation), (3) compose integration (existing component awareness, multi-file output to project directories), and (4) decomposition engine validation and polish. The critical constraint throughout is Motif's zero-dependency rule — all scanning is implemented in pure Node.js 22+ stdlib using regex-based heuristics, matching the existing hook pattern. No AST parsers, no npm packages.

The primary risk is context budget overrun. Scan artifacts that exceed their token ceilings crowd out COMPONENT-SPECS.md and tokens.css in downstream agent contexts, causing agents to ignore design system constraints. Every scan artifact must have a hard token budget enforced from day one: SCAN-SUMMARY.md under 2,000 tokens, component catalog under 1,500 tokens, raw scan files under 3,000 tokens each. The second major risk is decision fatigue — the brownfield init flow must collapse to a single user-facing question, not eight per-category choices. Both of these are architecture decisions that must be locked in Phase 1 before any implementation begins.

---

## Key Findings

### Recommended Stack

No new dependencies are introduced. All brownfield scanning runs on Node.js 22+ stdlib: `fs.globSync` for file discovery, `path.matchesGlob` for convention matching (stable since v22.20.0), `fs.readdirSync({ recursive: true })` as a fallback, and regex-based parsing for component and token extraction. This is identical to the approach used by all existing Motif hooks (`motif-token-check.js`, `motif-font-check.js`, `motif-aria-check.js`). The trade-off is parsing precision (~90% accuracy vs ~99% for AST-based tools), but the zero-dependency constraint is non-negotiable and the existing hooks prove this accuracy level is sufficient for catalog-quality output.

Three new scripts ship in the Motif package: `scripts/project-scanner.js`, `scripts/component-cataloger.js`, and `scripts/token-extractor.js`. These are invoked directly by agents (not triggered by PostToolUse hooks), write output to `.planning/design/scan/`, and follow the existing sync-API pattern for simplicity. All scan output is markdown, matching Motif's markdown-first architecture — this is the optimal format for Claude Code's Read tool context loading.

**Core technologies:**
- `node:fs` (globSync, readdirSync, readFileSync, writeFileSync): file discovery and reading — same APIs as existing Motif scripts, zero new packages
- `node:path` (matchesGlob, join, relative): convention pattern matching — stable Node 22+ built-in replacing the `minimatch` npm package
- `crypto.createHash('sha256')`: content hashing for scan freshness detection — already used in `install.js`
- Regex-based parsing: component prop extraction, CSS custom property detection, token extraction — proven by existing hooks
- Template string interpolation: component file generation — no templating library needed

### Expected Features

The feature dependency tree is clear: project scanning is the foundation that every other brownfield feature depends on. Nothing else is buildable until scanning works and produces confirmed artifacts.

**Must have (table stakes) — brownfield non-functional without these:**
- **Project structure scanning** — detect framework, directory layout, CSS approach, naming conventions, routing, existing components, tokens
- **Scan results presentation** — present to user, get confirmation (the trust contract; no AI tool should silently make structural decisions about an existing project)
- **File output convention matching** — composer writes files with correct naming and to correct directories
- **Composer output to project directories** — output goes to `src/app/dashboard/page.tsx`, not `.planning/design/screens/`
- **Existing component catalog** — file list with export names; composer knows what to import vs recreate
- **Import existing design tokens** — detect CSS custom properties and Tailwind colors; user decides whether to reuse

**Should have (differentiators) — makes Motif notably better than alternatives:**
- **Component gap analysis** — diff existing component inventory against vertical-required components (COMPONENT-SPECS.md); generate only what is missing
- **Reuse directive in COMPONENT-SPECS.md** — `<source type="existing" path="..." />` tells the composer to import, not recreate
- **Component decomposition planner** — plan multi-file output, user approves the file plan before writing
- **Selective token overlay** — generate `motif-extensions.css` for missing tokens only; preserve existing tokens

**Defer to v1.3+:**
- Convention extraction (analyzing existing components to teach the composer project-specific patterns — HIGH complexity, needs multiple analysis passes)
- Multi-file atomic commit with rollback (nice-to-have safety net; standard git patterns suffice for v1.2)
- Cross-framework component bridge (React/Vue/Svelte output adaptation)

### Architecture Approach

Brownfield scanning is implemented as a new optional phase (`SCANNED`) that sits between `UNINITIALIZED` and `INITIALIZED` in the state machine. The `/motif:scan` command spawns two parallel Task() subagents — a File Scanner agent and a Component Decomposer agent — which write raw artifacts to `.planning/design/scan/`. The scan orchestrator synthesizes these into a single compressed SCAN-SUMMARY.md (under 2,000 tokens) that all downstream agents load. Downstream workflows detect brownfield mode by checking whether SCAN-SUMMARY.md exists — no explicit mode flag needed. Artifact presence drives behavior, matching the existing Input Type D pattern. Every existing workflow continues to operate in standard greenfield mode when no scan artifact is present.

**Major components:**
1. `/motif:scan` command + `workflows/scan.md` — thin entry point plus scan orchestrator; spawns scanner and decomposer agents; synthesizes SCAN-SUMMARY.md; presents findings to user; sets STATE.md to SCANNED
2. `agents/motif-scanner.md` — File Scanner agent; walks project tree using Glob + Read tools only; writes PROJECT-SCAN.md (framework, structure, file inventory) — under 3,000 tokens
3. `agents/motif-decomposer.md` — Component Decomposer agent; reads component files identified by scanner; extracts component inventory and design token values; writes COMPONENT-SCAN.md and TOKEN-SCAN.md — under 3,000 tokens each
4. SCAN-SUMMARY.md — the compressed cross-pipeline artifact (under 2,000 tokens); loaded by init, research agents, system generator, and composer
5. Modified `workflows/generate-system.md` — adds EXTRACT+EXTEND mode; reads TOKEN-SCAN.md to formalize existing values rather than replace them; presents adopt/evolve/fresh choice to user
6. Modified `workflows/compose-screen.md` — passes COMPONENT-SCAN.md path to composer; composer knows which components exist and their prop interfaces; writes output to project directories

### Critical Pitfalls

1. **Over-scanning blows the context budget** — Hard token budgets must be locked in Phase 1: SCAN-SUMMARY.md under 2,000 tokens, component catalog under 1,500 tokens, raw scan files under 3,000 tokens each. Use tiered scanning (Tier 1: structure only; Tier 2: tokens; Tier 3: individual components on-demand only). Run existing `token-counter.js` against all scan artifacts before considering the scanner complete.

2. **Stale scans cause ghost component references** — Scan artifacts are snapshots of external state Motif does not control. Treat scan data as "hints," not "source of truth." Add freshness metadata (timestamp and file count at scan time). Before loading the scan artifact, run a drift check against 5 key file paths. Instruct subagents to verify paths before importing.

3. **Wrong framework assumptions cascade downstream** — Detecting "React" is not sufficient. The scanner must produce a structured framework profile: router type (App Router vs Pages Router vs React Router), rendering model (RSC vs client-only), styling approach (Tailwind-only vs Tailwind+CSS Modules vs CSS-in-JS), import conventions (tsconfig path aliases). Validate the profile against 3 heuristic checks and present it to the user during init before acting on it.

4. **Decision fatigue from too many adopt/merge/fresh choices** — Collapse to one top-level user question: "Respect your existing system / Fresh start / Let me choose per category." Option A maps to "evolve" for everything with smart defaults applied automatically. Never present more than 2 brownfield-specific questions beyond the existing init interview.

5. **Token merge produces Franken-systems** — Make the merge decision explicit and traceable. Every token in output must be labeled as "kept from project," "derived from project," or "generated new." Use "evolve" as the default (respect brand, improve quality, fill gaps). Never silently drop a project token.

---

## Implications for Roadmap

Based on combined research, the dependency chain is unambiguous. Scan infrastructure must be built first and independently — nothing downstream can function correctly until scanning produces validated artifacts. The suggested four-phase structure follows this dependency chain with clear handoff points between phases.

### Phase 1: Scan Infrastructure

**Rationale:** Every brownfield feature depends on scan artifacts. Build this first, in isolation. The token budget ceilings and catalog format decisions made here are load-bearing — every downstream agent encodes assumptions about these formats. Getting them wrong requires touching every consumer. Lock them once.

**Delivers:** `/motif:scan` command, File Scanner agent (`motif-scanner.md`), Component Decomposer agent (`motif-decomposer.md`), scan orchestrator workflow (`workflows/scan.md`), SCAN-SUMMARY.md format, PROJECT-SCAN.md, COMPONENT-SCAN.md, TOKEN-SCAN.md, SCANNED phase in state machine, `references/scan-heuristics.md`, scan directory exclusion list (node_modules, .next, dist, coverage, .env*, server-side code).

**Addresses:** Project structure scanning, scan results presentation.

**Avoids:** Over-scanning context dump (hard budgets from day one), stale scan references (freshness metadata and drift check design), wrong framework detection (structured framework profile with 3-heuristic validation), security exposure (hardcoded exclusion list for .env*, credentials, server code), monorepo misdetection (detect workspaces/turbo.json, ask user which package to scope), scanning performance on large projects (depth limits, file count ceiling at 5,000 files).

---

### Phase 2: Init and System Generator Integration

**Rationale:** Once scan artifacts exist, init and system generator are the first consumers. Init is modified to pre-fill from SCAN-SUMMARY.md. System generator gains EXTRACT+EXTEND mode. These two modifications are independent of the compose changes in Phase 3 and must be stable before Phase 3 builds on them.

**Delivers:** Modified `/motif:init` that accepts SCANNED state and pre-fills answers from scan findings; user confirmation/override flow for scan results; single top-level brownfield decision (respect/fresh/customize); EXTRACT+EXTEND mode in `generate-system.md` reading TOKEN-SCAN.md and COMPONENT-SCAN.md; `motif-extensions.css` output for selective token overlay; GAP-ANALYSIS.md (which components exist vs which are needed per vertical); reuse directives in COMPONENT-SPECS.md (`<source type="existing" path="..." />`).

**Addresses:** Import existing design tokens, component gap analysis, selective token overlay, reuse directive in COMPONENT-SPECS.md.

**Avoids:** Decision fatigue (single top-level choice in init, at most 2 brownfield questions total), Franken-systems from bad token merge (adopt/evolve/fresh with full traceability, evolve as default), token format mismatch (CSS custom properties only for v1.2; Tailwind config translation deferred to v1.3).

---

### Phase 3: Compose Integration

**Rationale:** With scan artifacts available and the system generator brownfield-aware, the composer can now write files to project directories, import existing components, and plan multi-file output. This phase represents the highest user-visible change in v1.2 — the difference between output going to `.planning/design/screens/` vs `src/app/dashboard/page.tsx`.

**Delivers:** Modified `compose-screen.md` that resolves target file paths from scan results and screen name; modified composer agent context profile loading COMPONENT-SCAN.md; compatibility map mechanism (Motif spec prop names vs project component prop names); component decomposition planner (DECOMPOSITION-PLAN.md output; user approves before writing); multi-file output to project directories following detected naming conventions.

**Addresses:** File output convention matching, composer output to project directories, existing component catalog (compose-time usage), component decomposition planner.

**Avoids:** Hallucinated component reuse with wrong prop APIs (compatibility map), framework-specific decomposition patterns (inject framework profile; use existing component as style reference), component naming conflicts (namespace prefix or compatibility mapping), over-decomposition (8-component-per-screen limit, 2-level depth limit, minimum 2 meaningful props per extraction).

---

### Phase 4: Decomposition Engine Validation and Polish

**Rationale:** The decomposition engine is partially delivered in Phase 3 but validation, cycle detection, and edge case handling warrant a dedicated phase. This phase completes the "looks done but isn't" checklist.

**Delivers:** Post-decomposition validation (component count check, prop count check, import cycle detection using DAG check, naming conflict check); stale scan drift check implementation; `token-counter.js` integration into scan pipeline for automated budget enforcement; monorepo detection and scope selection; framework-specific decomposition templates (React functional, Next.js App Router with `'use client'`, Vue 3 SFC, Svelte).

**Addresses:** No new table stakes or differentiators — this phase hardens Phase 3 deliverables against edge cases.

**Avoids:** Import cycles in decomposed output (cycle detection), decomposition producing components nobody can reuse (depth limit and prop count enforcement), framework-specific pattern failures (`'use client'` directives, Vue `<script setup>`, Svelte format).

---

### Phase Ordering Rationale

- **Phases are strictly ordered by dependency:** Scan infrastructure produces artifacts that every other phase consumes. No Phase 2, 3, or 4 work is possible without Phase 1 artifacts. This is a dependency chain, not a preference.
- **Phase 1 decisions are irreversible:** Token budget ceilings, catalog format (index vs dump), and user decision UX (single question vs per-category) must be locked in Phase 1 because every downstream agent encodes assumptions about these formats.
- **Phase 2 (init and system) before Phase 3 (compose) prevents a common mistake:** If compose integration is built before the system generator is brownfield-aware, composed screens will reference tokens and components that the system generator may overwrite or conflict with.
- **Greenfield mode must work throughout:** Every phase modification must preserve the no-scan path. Greenfield regression tests should run against every phase deliverable.

### Research Flags

Phases likely needing deeper investigation during planning:
- **Phase 3 (compose integration):** The compatibility map design — how the composer distinguishes "use project's Button API (variant='filled')" from "Motif spec says variant='primary'" — has no established pattern in the existing codebase. Needs a design spike before Phase 3 implementation begins.
- **Phase 2 (token merge algorithm):** The "evolve" mode logic (which existing tokens to keep, which to improve, how to generate a full scale around an existing anchor color) warrants an explicit algorithm design artifact before coding begins.

Phases with standard patterns (skip additional research):
- **Phase 1:** Node.js 22+ file system APIs, regex-based parsing, and markdown output are all established Motif patterns. The scan heuristics reference file captures all needed detection rules.
- **Phase 4:** Import cycle detection (DAG check), prop count validation, and framework-specific component templates are well-documented. No novel territory.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Zero-dependency constraint is established project policy. Node.js 22+ APIs verified via official docs (WebFetch 2026-03-04). All new scripts follow proven patterns from existing hooks. No new technologies to evaluate. |
| Features | HIGH for table stakes; MEDIUM for differentiators | Table stakes derived from direct analysis of Motif's pipeline gaps and observable patterns in AI coding tools. Differentiators (gap analysis, reuse directives, decomposition planner) are novel — well-reasoned from existing architecture but without external comparators. Competitive landscape analysis (Cursor, v0, Bolt, Lovable) is training data only (LOW confidence on specific competitor capabilities). |
| Architecture | HIGH | Based on deep analysis of existing Motif workflows, agents, context engine, and state machine. New components follow existing patterns directly. Context budget calculations are precise (derived from current context-engine.md figures). The layered scan with compression pattern is novel but sound. |
| Pitfalls | HIGH | Pitfalls derived from concrete Motif architectural constraints (context budgets, orchestrator 30% ceiling, subagent fresh context, zero npm deps). Each pitfall references specific existing system constraints that would cause the failure — not theoretical. |

**Overall confidence:** HIGH

### Gaps to Address

- **Compatibility map design (Phase 3 spike):** How the composer distinguishes project component APIs from Motif spec APIs is not fully specified. Propose as an explicit planning spike at the start of Phase 3. Without this, the "import existing components" feature risks wrong-prop-name bugs that silently render incorrectly.

- **Token merge algorithm (Phase 2 design):** The "evolve" mode — anchor an existing color, generate a full scale around it, fill semantic gaps — needs an explicit algorithm document before coding. Motif's current token generation is greenfield; the brownfield extension has not been written.

- **`fs.globSync` stability status:** Confirmed available in Node 22 but stability level (stable vs experimental) needs runtime verification. Fallback strategy is documented (`readdirSync({ recursive: true })` + `path.matchesGlob` filter) and both fallback APIs are confirmed stable.

- **Scan accuracy floor:** Regex-based prop extraction claims ~90% accuracy but has not been tested against real projects. If accuracy drops significantly for unusual component patterns (HOCs, compound components, render props), catalog quality degrades. Recommend testing against 2-3 real brownfield projects before Phase 3.

- **Competitive landscape specifics:** Claims about Cursor, v0, Bolt.new, and Lovable brownfield behavior are training data (last updated August 2025). Does not affect implementation decisions but should be validated before any positioning or marketing use.

---

## Sources

### Primary (HIGH confidence)
- Existing Motif codebase — `install.js`, `motif-token-check.js`, `motif-font-check.js`, `motif-aria-check.js`, `token-counter.js`, `contrast-checker.js`. Reviewed 2026-03-04. Proven regex patterns and zero-dep approach.
- Existing Motif workflow files — `workflows/init.md`, `workflows/compose-screen.md`, `workflows/generate-system.md`, `workflows/research.md`, `references/context-engine.md`, `references/state-machine.md`, `references/design-inputs.md`. Reviewed 2026-03-04. Direct source for integration points, context budgets, and state machine gates.
- Node.js 22.x official documentation — `fs.globSync`, `fs.readdirSync({ recursive })`, `path.matchesGlob`. Verified via WebFetch 2026-03-04. `path.matchesGlob` confirmed stable since v22.20.0.

### Secondary (MEDIUM confidence)
- Training data — React/Next.js/Vue project structure conventions, Tailwind CSS configuration patterns, CSS custom property detection methods. Well-established patterns, consistent across training data.
- Training data — AI coding assistant brownfield behavior patterns (Cursor, Claude Code, v0, Bolt.new, Lovable). Consistent across training data but may not reflect current tool capabilities.

### Tertiary (LOW confidence)
- Training data — Brownfield migration tool patterns (codemod, jscodeshift), design system adoption literature (Storybook migration guides, design token specification patterns). Used for pitfall identification only, not implementation decisions.

---
*Research completed: 2026-03-04*
*Ready for roadmap: yes*
