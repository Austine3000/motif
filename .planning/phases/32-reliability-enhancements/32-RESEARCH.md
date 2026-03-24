# Phase 32: Reliability Enhancements - Research

**Researched:** 2026-03-24
**Domain:** Batch resume after /clear, smart screen ordering for wave-based composition
**Confidence:** HIGH

## Summary

Phase 32 delivers two reliability improvements to the batch composition system built in Phase 29: (1) resilient batch resume after `/clear`, and (2) smart screen ordering that places foundational screens in earlier waves. Both features modify compose-screen.md exclusively -- no new scripts, no new files, no new CLI commands.

The batch resume capability is largely already present by design. Phase 29's `--all` flag (Step 1 Case D) reads STATE.md and collects screens with status `planned` or `failed`. After a `/clear` mid-batch, STATE.md persists (it is a file on disk, not in-memory state). The `batch-update-screens` command atomically updates screen statuses after each wave, so STATE.md is always consistent. Running `/motif:compose --all` after `/clear` naturally resumes from incomplete screens because composed screens have status `composed` and are excluded. What is missing is: (a) explicit detection that this is a resume (not a fresh batch), (b) a user-facing message confirming which screens are being skipped, and (c) any stale-batch-state cleanup if the previous batch was interrupted mid-wave (screens that were being composed when the crash happened may have files on disk but status still `planned`).

Smart screen ordering requires classifying screens into "foundational" (layout, navigation, landing/home, shared component screens) and "feature" (everything else). Foundational screens compose in wave 1; feature screens compose in subsequent waves with access to wave 1's SUMMARY.md files for cross-screen consistency. The classification must be heuristic-based since STATE.md's screen objects only contain `{name, status}` -- there is no type or category field. The heuristic analyzes screen names and optionally DESIGN-RESEARCH.md for additional context.

**Primary recommendation:** Implement both features as modifications to compose-screen.md Step 1b (batch validation) and Step 3b (wave dispatch). Plan 1 handles batch resume detection and messaging. Plan 2 handles smart screen ordering with a name-based heuristic classification.

## Standard Stack

### Core (All Existing -- No New Dependencies)

| Technology | Version | Purpose | Why Standard |
|------------|---------|---------|--------------|
| compose-screen.md | Current (Step 1b and 3b modified) | Batch orchestration with resume detection and smart ordering | Single file owns all batch behavior |
| motif-state.js | Current (unchanged) | STATE.md atomic read/write | batch-update-screens already handles all state updates |
| STATE.md | Current format (unchanged) | Persistent batch state across /clear | YAML frontmatter survives context resets |

### New Additions

None. Both features are compose-screen.md workflow instruction changes only.

### Explicitly NOT Adding

| Technology | Why Not |
|------------|---------|
| New `batch_id` field in STATE.md | The milestone research suggested this for resume detection. However, it is unnecessary: the orchestrator can detect a resume scenario by checking if any screens have status `composed` when `--all` is invoked. A fresh batch would have all screens as `planned`. Adding batch_id creates state management overhead (clearing stale IDs, matching IDs across /clear) for no functional benefit. |
| Screen classification script (JS) | The classification heuristic is simple enough to express in workflow instructions (pattern matching on screen names). A separate script would add file I/O overhead and a maintenance surface for ~15 lines of logic. |
| New `type` or `category` field on screens in STATE.md | Would require modifying the init workflow (where screens are created), the recovery workflow, and all code that constructs screen objects. The heuristic approach classifies at composition time from names and research data, with zero schema changes. |
| `batch_concurrency` frontmatter in STATE.md | The milestone research mentioned this as a Phase 32 item. However, `--concurrency N` command argument already works (Phase 29). Frontmatter persistence is a convenience, not a reliability feature. Defer to avoid scope creep. |

## Architecture Patterns

### Pattern 1: Stateless Resume via Screen Status Filtering

**What:** The orchestrator detects a resume scenario by reading STATE.md screen statuses. If any screens are already `composed` or `reviewed` when the user runs `--all`, this is a resume. The orchestrator reports which screens are being skipped and composes only the remaining `planned`/`failed` screens.

**When to use:** Every time `--all` is invoked. The detection is a side effect of normal screen filtering -- no special resume mode is needed.

**Why this works:** Phase 29 designed the orchestrator to be stateless between invocations. STATE.md is the single source of truth. The `batch-update-screens` command updates screen statuses atomically after each wave. If a batch is interrupted mid-wave:
- Screens from completed waves: status `composed` (safe, will be skipped)
- Screens in the interrupted wave: status still `planned` (will be recomposed)
- Screens in future waves: status `planned` (will be composed)

The only data loss is the work-in-progress of the interrupted wave's subagents. Their files may be on disk but uncommitted. This is acceptable -- the resume recomposes those screens from scratch.

**Implementation in compose-screen.md Step 1b:**

After collecting screens with status `planned` or `failed` (existing logic), add:

```
If any screens in STATE.md have status `composed` or `reviewed`:
  SKIPPED_SCREENS = screens with status `composed` or `reviewed`
  Print: "Resuming batch -- {SKIPPED_SCREENS.length} screen(s) already composed: {comma-separated names}. Composing remaining {SCREEN_LIST.length} screen(s)."
```

**Stale file cleanup for interrupted waves:**

Before spawning wave 1, check if any screens in SCREEN_LIST have SUMMARY.md files on disk (from a previous interrupted attempt). If found, warn:

```
"Note: {screen_name} has files from a previous attempt on disk. These will be overwritten by the new composition."
```

This is informational only -- no automatic cleanup. The subagent will overwrite the files naturally.

### Pattern 2: Name-Based Foundational Screen Classification

**What:** Before wave assignment, classify each screen in SCREEN_LIST as "foundational" or "feature" using a heuristic based on screen names and optionally DESIGN-RESEARCH.md content. Foundational screens go in wave 1; feature screens fill subsequent waves.

**When to use:** In Step 3b, after Step 1b validation and before the wave loop begins. Only applies when SCREEN_LIST has more screens than CONCURRENCY (otherwise everything is in one wave anyway).

**Classification heuristic:**

A screen is **foundational** if its name matches any of these patterns (case-insensitive):

| Pattern | Examples | Rationale |
|---------|----------|-----------|
| Contains "layout" | `layout`, `app-layout`, `main-layout` | Layout screens define the shell (header, sidebar, footer) that wraps all other screens |
| Contains "nav" or "navigation" | `navigation`, `nav`, `sidebar-nav` | Navigation defines the routing and menu structure |
| Contains "home" or "landing" | `home`, `landing`, `landing-page` | Landing/home screens establish the visual identity and primary CTA patterns |
| Contains "shell" or "frame" | `app-shell`, `frame` | Shell/frame screens wrap content areas |
| Exact match: "header", "footer", "sidebar" | `header`, `footer`, `sidebar` | Structural components used by all other screens |

Everything else is a **feature** screen.

**Why name-based heuristics work:** Screen names in Motif are chosen by the user during `/motif:init` and reflect the screen's purpose. The patterns above are nearly universal in web application design -- "layout", "navigation", "home", and "landing" are consistently used for foundational screens across all verticals (fintech, healthcare, e-commerce, SaaS). The heuristic does not need to be perfect -- false negatives (a foundational screen misclassified as feature) only mean it composes in a later wave, which is the current default behavior. False positives (a feature screen in wave 1) are harmless -- it composes earlier, which is fine.

**Wave assignment algorithm:**

```
1. Classify all screens in SCREEN_LIST as foundational or feature
2. FOUNDATION_SCREENS = screens classified as foundational
3. FEATURE_SCREENS = screens classified as feature
4. If FOUNDATION_SCREENS is empty: no reordering needed; use default ordering
5. If FOUNDATION_SCREENS.length > CONCURRENCY: split foundational screens into multiple waves
6. Build ordered screen list: FOUNDATION_SCREENS first, then FEATURE_SCREENS
7. Split into waves of CONCURRENCY size (existing logic)
8. Report ordering: "Smart ordering: composing {N} foundational screen(s) first: {names}"
```

**Key constraint:** The reordering ONLY affects wave assignment. Within a wave, screens still compose in parallel. The reordering ensures foundational screens finish before feature screens start, making foundation SUMMARY.md files available to feature screen composers.

**Feeding foundation summaries to feature waves:**

In Step 3b.2 (spawn parallel Task() agents), when composing a feature screen in wave 2+, add the foundation screen SUMMARY.md files to the Task prompt's context files list:

```
{IF this is wave 2+ AND foundation screens were composed in earlier waves:}
Also read these foundation screen summaries for cross-screen consistency:
- .planning/design/screens/{foundation_screen_1}-SUMMARY.md
- .planning/design/screens/{foundation_screen_2}-SUMMARY.md
```

This gives feature screen composers knowledge of the layout structure, navigation patterns, and visual choices made by the foundational screens.

### Anti-Patterns to Avoid

- **Modifying STATE.md schema for screen classification:** Adding a `type` field to screens requires changes to init, recovery, and every state mutation path. Name-based heuristics achieve the same result with zero schema changes.
- **Blocking on perfect classification:** The heuristic does not need to classify every screen correctly. Worst case (all screens classified as feature), the system behaves identically to Phase 29's default ordering. There is no degradation.
- **Complex dependency graph analysis:** The milestone research mentions "dependency-aware ordering" as HIGH complexity. Screen dependencies are not explicitly declared and inferring them from content analysis is unreliable. Wave-based ordering (foundation first, then features) is the right level of sophistication -- it captures the main dependency pattern (feature screens depend on layout/nav) without the complexity of a full dependency graph.
- **Cleaning up stale files from interrupted batches:** The subagents overwrite files naturally. Automatic deletion risks destroying user work if they manually edited the files between the interruption and resume.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Resume detection | Explicit batch_id tracking with start/end lifecycle | Screen status filtering (composed vs planned) | STATUS.md already encodes resume state implicitly. Every screen that completed has status `composed`. |
| Screen classification | ML-based or NLP-based analysis of screen purposes | Simple name pattern matching | Screen names are user-chosen descriptors that reliably indicate purpose. Accuracy only needs to be "good enough" -- misclassification is not harmful. |
| Foundation summary injection | New context aggregation script | Add file paths to Task() prompt context list | The existing agent_spawn template already supports conditional context file references. Adding 1-2 more SUMMARY.md paths is trivial. |
| Stale file detection | Custom cleanup script | Check SUMMARY.md existence with Bash test | The orchestrator already checks for SUMMARY.md in Step 3b.4. Reusing the same check before wave 1 is natural. |

**Key insight:** Both REL-02 and REL-03 are achievable through workflow instruction changes in compose-screen.md alone. The infrastructure (STATE.md persistence, batch-update-screens, wave dispatch) already supports both features. This phase is about adding intelligence to the orchestration layer, not building new infrastructure.

## Common Pitfalls

### Pitfall 1: Stale Files from Interrupted Wave Causing Conflicts

**What goes wrong:** User runs `/motif:compose --all` with 6 screens. Wave 1 (screens A, B, C) completes. Wave 2 starts. User hits `/clear` during wave 2. Screens D and E have partial files on disk from their subagents. User runs `/motif:compose --all` to resume. Wave 1 (now screens D, E, F) starts. Subagents for D and E encounter existing files from the interrupted attempt.

**Why it happens:** Subagents write files to disk before validation. If the batch is interrupted mid-subagent, files remain on disk in an unknown state.

**How to avoid:** The subagent already handles file conflicts per existing Step B2 rules: "Before writing any file, check if a file already exists at that path. If it does, use a different name." For batch resume, this is sufficient. The SUMMARY.md check at the start of resume (Pattern 1 above) warns the user about stale files. The subagent will either overwrite (if same path) or coexist (if different path). Post-composition, the old stale files remain but are not staged or committed since the orchestrator only stages files listed in the new SUMMARY.md.

**Warning signs:** Git status shows untracked files from the interrupted attempt alongside newly composed files.

### Pitfall 2: Classification Heuristic Missing Vertical-Specific Foundation Screens

**What goes wrong:** In a healthcare vertical, the screen named "patient-portal" is foundational (it is the main entry point), but the heuristic does not match it because it does not contain "home", "landing", "layout", or "nav".

**Why it happens:** Different verticals use different naming conventions for their primary screens. The name-based heuristic covers the most common patterns but cannot cover all verticals.

**How to avoid:** Two mitigations:
1. The heuristic includes "home" and "landing" which cover the vast majority of primary entry points across verticals.
2. If DESIGN-RESEARCH.md mentions specific screens as "primary" or "foundation" in its LOCKED decisions, the orchestrator can use that as a secondary signal. However, this is a best-effort enhancement, not a hard requirement -- misclassification only means the screen composes in a later wave, which is the pre-Phase-32 default.

**Warning signs:** Feature screens in wave 2 reference a navigation pattern that has not been established yet because the de-facto navigation screen composed in wave 2 alongside them.

### Pitfall 3: Resume Recomposing Screens with Stale Status

**What goes wrong:** Batch interrupted mid-wave. Two screens in the wave had their subagents complete and files written, but the orchestrator was interrupted before calling `batch-update-screens`. Those screens have status `planned` in STATE.md despite having files and SUMMARY.md on disk. Resume recomposes them unnecessarily.

**Why it happens:** The `batch-update-screens` call happens after ALL screens in a wave complete (Step 3b.6). If the interruption happens between the last subagent completing and the state update, the state is stale.

**How to avoid:** This is an acceptable trade-off. Recomposing a screen that already has files is wasted work but not incorrect -- the new composition overwrites the old one. The alternative (checking for SUMMARY.md existence to skip "planned" screens that actually completed) adds complexity and risks skipping screens whose SUMMARY.md is from a different, incompatible batch. The simple approach: trust STATE.md status as the source of truth. Screens marked `planned` get recomposed. If this creates noticeable waste, the user can manually update STATE.md via `motif-state.js update` or compose only specific screens by name instead of `--all`.

**Warning signs:** Resume takes longer than expected because screens from the interrupted wave are being recomposed.

### Pitfall 4: Foundation Summary Context Bloat in Feature Waves

**What goes wrong:** Wave 1 composes 3 foundational screens. Each SUMMARY.md is 50-80 lines. Wave 2 feature screen agents receive 3 additional SUMMARY.md paths in their context. Each agent reads all 3 summaries (150-240 lines) plus the standard context files, pushing closer to context limits.

**Why it happens:** Foundation summaries are valuable for cross-screen consistency but add to each agent's context load.

**How to avoid:** Cap the number of foundation summaries passed to feature agents at 3. If more than 3 foundational screens exist, pass only the most important ones (layout first, then navigation, then home/landing). The agent_spawn template already lists context files by priority -- foundation summaries go at the end, after the core design system files.

**Warning signs:** Feature screen agents produce degraded output or hit context limits.

## Code Examples

### Example 1: Resume Detection and Messaging in Step 1b

```markdown
## Step 1b: Batch Validation (BATCH MODE only) -- Updated

[... existing validation steps 1-3 remain unchanged ...]

4. **Detect resume scenario.**
   Read the full screens array from STATE.md. If any screens have status `composed`, `reviewed`, or `fixed`:
   - SKIPPED_SCREENS = [names of screens not in SCREEN_LIST because they are already composed/reviewed/fixed]
   - If SKIPPED_SCREENS is not empty:
     Print: "Resuming batch -- skipping {SKIPPED_SCREENS.length} already-composed screen(s): {comma-separated names}"
     Print: "Composing remaining {SCREEN_LIST.length} screen(s): {comma-separated names}"

5. **Check for stale files from previous attempt.**
   For each screen in SCREEN_LIST:
   - If `.planning/design/screens/{screen_name}-SUMMARY.md` exists on disk:
     Add to STALE_SCREENS list
   - If STALE_SCREENS is not empty:
     Print: "Note: {STALE_SCREENS.length} screen(s) have files from a previous attempt: {names}. These will be overwritten."

6. **Display batch plan:**
   "Composing {N} screens in {WAVE_COUNT} wave(s) (concurrency: {CONCURRENCY}): {comma-separated screen names}"

[Proceed to smart ordering in Step 3b...]
```

### Example 2: Smart Screen Ordering Before Wave Loop

```markdown
## Step 3b: Batch Wave Dispatch -- Smart Ordering (inserted before wave loop)

**Pre-wave screen ordering (run ONCE before calculating waves):**

Classify each screen in SCREEN_LIST:

FOUNDATION_PATTERNS = ["layout", "nav", "navigation", "home", "landing", "shell", "frame"]
FOUNDATION_EXACT = ["header", "footer", "sidebar"]

For each screen name in SCREEN_LIST:
  - name_lower = screen name lowercased
  - If name_lower is in FOUNDATION_EXACT, OR any pattern in FOUNDATION_PATTERNS is a substring of name_lower:
    -> classify as FOUNDATIONAL
  - Else:
    -> classify as FEATURE

FOUNDATION_SCREENS = all screens classified as FOUNDATIONAL
FEATURE_SCREENS = all screens classified as FEATURE

If FOUNDATION_SCREENS is not empty AND SCREEN_LIST.length > CONCURRENCY:
  Print: "Smart ordering: {FOUNDATION_SCREENS.length} foundational screen(s) will compose first: {names}"
  ORDERED_LIST = FOUNDATION_SCREENS + FEATURE_SCREENS
Else:
  ORDERED_LIST = SCREEN_LIST (unchanged)

Recalculate waves from ORDERED_LIST:
  WAVE_COUNT = ceil(ORDERED_LIST.length / CONCURRENCY)
  WAVES = split ORDERED_LIST into chunks of CONCURRENCY size

Track which wave(s) contain foundational screens:
  FOUNDATION_WAVE_INDICES = [indices of waves that contain at least one foundational screen]
```

### Example 3: Foundation Summary Injection in Feature Waves

```markdown
### 3b.2 modification: Foundation summary injection

When spawning Task() agents for wave_index > max(FOUNDATION_WAVE_INDICES):

Identify FOUNDATION_SUMMARIES = list of SUMMARY.md paths from foundational screens that were composed in earlier waves (status PASSED or WARNED):
  - .planning/design/screens/{foundation_screen_1}-SUMMARY.md
  - .planning/design/screens/{foundation_screen_2}-SUMMARY.md
  (cap at 3 summaries maximum)

Add to the Task prompt's context files section:

```
{IF FOUNDATION_SUMMARIES is not empty:}
## Foundation Screen Summaries (for cross-screen consistency)
These foundational screens were composed in earlier waves. Reference them for layout structure, navigation patterns, and visual consistency:
{for each path in FOUNDATION_SUMMARIES:}
- `{path}` -- read this for the established patterns
{endfor}
```
```

## State of the Art

| Pre-Phase-32 | Post-Phase-32 | What Changes |
|--------------|---------------|--------------|
| `/motif:compose --all` after `/clear` silently recomposes only planned/failed screens | `/motif:compose --all` after `/clear` explicitly detects resume, reports skipped screens, warns about stale files | Step 1b gets resume detection (steps 4-5) |
| Screens compose in arbitrary order across waves | Foundational screens automatically compose in wave 1; feature screens compose in subsequent waves | Step 3b gets pre-wave ordering logic |
| Feature screen agents have no knowledge of foundation screen choices | Feature screen agents receive foundation SUMMARY.md files as additional context | Step 3b.2 gets conditional foundation summary injection |
| No messaging about which screens are skipped on resume | Clear "Resuming batch" messaging with skip list | User knows exactly what is happening |

## Open Questions

1. **Should the classification heuristic be configurable by the user?**
   - What we know: The name-based patterns cover the vast majority of cases across verticals. Users cannot currently annotate screens with types in STATE.md.
   - What's unclear: Whether users would want to override the heuristic (e.g., force a specific screen into wave 1).
   - Recommendation: Do NOT make it configurable for Phase 32. The heuristic is a best-effort improvement. If a user needs specific ordering, they can compose in two invocations: `/motif:compose layout navigation` then `/motif:compose --all` (which resumes from the remaining screens). This is an adequate manual override.

2. **Should stale files from an interrupted batch be automatically deleted before resume?**
   - What we know: Stale files are from a partial, interrupted composition. They may be incomplete or inconsistent. The subagent will overwrite them.
   - What's unclear: Whether the user might have manually edited them between the interruption and resume.
   - Recommendation: Do NOT auto-delete. Warn about stale files (informational) and let the subagent overwrite naturally. If the user wants clean slate, they can delete manually.

3. **Should DESIGN-RESEARCH.md be consulted for screen classification?**
   - What we know: DESIGN-RESEARCH.md contains LOCKED decisions that may reference specific screens as foundational. Reading it adds ~2500 tokens to the orchestrator's context.
   - What's unclear: How often DESIGN-RESEARCH.md contains explicit screen categorization.
   - Recommendation: Do NOT read DESIGN-RESEARCH.md for classification in Phase 32. The name-based heuristic is sufficient and keeps the orchestrator thin. If a future iteration needs more sophisticated classification, DESIGN-RESEARCH.md analysis can be added then.

## Sources

### Primary (HIGH confidence)

- `compose-screen.md` workflow (codebase) -- current Step 1 (Cases A-D), Step 1b (batch validation), Step 3b (wave dispatch loop), Step 3b.2 (agent_spawn with batch mode instructions)
- `motif-state.js` implementation (codebase) -- `batch-update-screens` command, `cmdRecover()` screen status reconstruction, STATE.md schema
- `.planning/research/PITFALLS.md` (codebase) -- Pitfall 1 (cross-screen inconsistency in same wave), Pitfall 2 (partial batch state after /clear)
- `.planning/research/FEATURES.md` (codebase) -- smart screen ordering as differentiator, resume interrupted batch as table-stakes
- `.planning/research/SUMMARY.md` (codebase) -- Phase 4 reliability enhancements specification
- `.planning/research/batch-compose/FEATURES.md` (codebase) -- context-aware screen ordering, heuristic classification approach
- `.planning/ROADMAP.md` (codebase) -- Phase 32 success criteria, dependency on Phase 29
- `.planning/REQUIREMENTS.md` (codebase) -- REL-02, REL-03 requirement definitions
- Phase 29 research and summaries (codebase) -- batch state infrastructure, deferred commit strategy, wave dispatch pattern
- `state-machine.md` reference (codebase) -- STATE.md schema, screen object format (`{name, status}`)

### Secondary (MEDIUM confidence)

- Milestone research batch-compose/ARCHITECTURE.md -- stateless orchestrator design principle, screen classification suggestions
- Milestone research batch-compose/PITFALLS.md -- shared component overlap heuristics, pre-composition dependency analysis approaches

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero new dependencies, all changes to existing compose-screen.md workflow instructions
- Architecture: HIGH -- resume pattern derived from existing --all behavior; classification heuristic derived from universal web app naming conventions
- Pitfalls: HIGH -- stale file conflicts and classification misses are well-understood edge cases with clear mitigations
- Code examples: HIGH -- based on direct analysis of compose-screen.md Step 1b and Step 3b structure

**Research date:** 2026-03-24
**Valid until:** 2026-04-23 (stable -- no external dependency changes expected)
