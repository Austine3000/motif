# Phase 31: Auto-Review Integration - Research

**Researched:** 2026-03-24
**Domain:** Motif workflow orchestration (compose-screen.md batch flow modification)
**Confidence:** HIGH

## Summary

This phase inserts an automatic review step into the batch compose workflow, between the batch summary (Step 3b.8/3b.8b) and the auto-run offer (Step 3b.9). The existing `/motif:review all` workflow already supports multi-screen review with scoring and pass/fail criteria. The integration requires: (1) triggering review automatically after batch compose, (2) collecting review results with pass/fail determination, and (3) gating the auto-run offer on review results.

The modification is entirely within `compose-screen.md`. No new scripts are needed. The review workflow's pass criteria (score >= 80, zero critical issues) is already well-defined. The key design question is how to invoke the review logic from within the compose orchestrator -- the review workflow is a separate `/motif:review` command, so the compose orchestrator will need to either inline the review spawning logic or invoke the review workflow as a sub-step.

**Primary recommendation:** Insert new Steps 3b.8c (auto-review dispatch), 3b.8d (review result collection), and 3b.8e (review gate) between the existing 3b.8b (batch manifest) and 3b.9 (auto-run offer). Reuse the review.md agent_spawn template directly -- spawn reviewer Task() agents the same way review.md Step 2 does.

## Standard Stack

### Core
| Component | Location | Purpose | Why Standard |
|-----------|----------|---------|--------------|
| compose-screen.md | `.claude/get-motif/workflows/compose-screen.md` | Batch compose orchestrator | Only file that needs modification |
| review.md | `.claude/get-motif/workflows/review.md` | Review agent template | Source of truth for reviewer agent prompt |
| motif-state.js | `.claude/get-motif/scripts/motif-state.js` | State management | Used to update screen statuses post-review |

### Supporting
| Component | Location | Purpose |
|-----------|----------|---------|
| BATCH-RESULT.md | `.planning/design/BATCH-RESULT.md` | Batch manifest (updated with review results) |
| runtime-launcher.js | `.claude/get-motif/scripts/runtime-launcher.js` | Auto-run launcher (gated by review) |
| STATE.md | `.planning/design/STATE.md` | Tracks screen statuses and phase |

## Architecture Patterns

### Current Batch Flow (Steps 3b.8 through 3b.10)

```
3b.8:  Print batch summary table
3b.8b: Write BATCH-RESULT.md manifest, commit it
3b.9:  Offer auto-run ONCE (unconditional)
3b.10: Next step guidance
```

### Proposed Modified Flow

```
3b.8:   Print batch summary table (unchanged)
3b.8b:  Write BATCH-RESULT.md manifest, commit it (unchanged)
3b.8c:  AUTO-REVIEW DISPATCH (NEW)
        - Only for screens with PASSED/WARNED status
        - Spawn reviewer Task() agents using review.md's agent_spawn template
        - Same concurrency model as compose waves (reuse CONCURRENCY var)
3b.8d:  REVIEW RESULT COLLECTION (NEW)
        - Read each {SCREEN_NAME}-REVIEW.md
        - Extract score and critical issue count
        - Determine pass/fail per screen (score >= 80 AND zero critical)
        - Commit review files
        - Print review summary table
3b.8e:  REVIEW GATE (NEW)
        - REVIEW_PASSED = all reviewed screens pass
        - If REVIEW_PASSED: proceed to 3b.9 (auto-run offer) normally
        - If NOT REVIEW_PASSED: print failure explanation, list failing screens
          with scores, suggest `/motif:fix`, offer override ("proceed anyway? yes/no")
        - If user overrides: proceed to 3b.9
        - If user declines: skip 3b.9, go to 3b.10
3b.9:   Offer auto-run ONCE (unchanged, but only reached if review passes or override)
3b.10:  Next step guidance (updated to reflect review status)
```

### Pattern: Reviewer Agent Spawn (from review.md)

The reviewer agent is spawned via Task() with the exact template from review.md Step 2. Key elements:

1. Reads design system files (tokens.css, COMPONENT-SPECS.md, DESIGN-RESEARCH.md, PROJECT.md)
2. Reviews source code files for the screen
3. Scores across 4 lenses: Heuristics (/30), Accessibility (/25), System Compliance (/25), Vertical UX (/20)
4. Writes output to `.planning/design/reviews/{SCREEN_NAME}-REVIEW.md`
5. Commits with `design(review): review {SCREEN_NAME} -- score X/100`

**In batch auto-review context:** reviewer agents should NOT commit individually (same pattern as batch compose). The orchestrator commits review files after collecting all results.

### Pattern: State Update After Review

After reviews complete, update STATE.md:
- Each reviewed screen: status changes from `composed` to `reviewed` (with score)
- Phase changes to `REVIEWING`
- Use `batch-update-screens` for atomic updates (same as 3b.6)

### Anti-Patterns to Avoid

- **Running review.md as a separate command:** Do NOT tell the user to run `/motif:review` or try to invoke the workflow file. Instead, inline the reviewer agent spawn logic directly in compose-screen.md. The review workflow has its own gate checks, state reads, etc. that would be redundant.
- **Reviewing FAILED/CRASHED screens:** Only review screens that passed composition validation (PASSED or WARNED status).
- **Blocking indefinitely on review failure:** Always offer an override path. The user should be able to proceed to auto-run even if review fails, with a clear acknowledgment.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Review agent prompt | New reviewer logic | Copy review.md's agent_spawn template verbatim | Consistency with standalone review |
| Pass/fail criteria | Custom scoring logic | `score >= 80 AND zero critical` from review.md | Already defined and tested |
| State batch updates | Manual STATE.md editing | `motif-state.js batch-update-screens` | Atomic, tested, handles edge cases |
| Review file format | Custom output format | review.md's output format (REVIEW.md template) | Consistency with standalone review |

## Common Pitfalls

### Pitfall 1: Reviewer Agents Committing Individually
**What goes wrong:** If reviewer agents commit their own REVIEW.md files (as review.md Step 2 instructs), this conflicts with the batch orchestrator's sequential commit pattern.
**Why it happens:** The reviewer agent_spawn template includes a commit instruction.
**How to avoid:** Add BATCH MODE INSTRUCTIONS to the reviewer agent prompt (same pattern as compose batch mode) telling agents NOT to commit, just write the file.
**Warning signs:** Merge conflicts or duplicate commits during batch review.

### Pitfall 2: Context Bloat from Reading Full REVIEW.md Files
**What goes wrong:** The orchestrator reads full review files into context, causing context overflow with many screens.
**Why it happens:** REVIEW.md files can be lengthy (detailed issue descriptions with fixes).
**How to avoid:** Only read the score line and critical issues count. Use Grep for `## Score:` and count occurrences of `## Critical Issues`.
**Warning signs:** Orchestrator hitting context limits after 4-5 screen reviews.

### Pitfall 3: Review Timing Extending Batch Duration
**What goes wrong:** Users expect batch compose to be fast; adding full review doubles the time.
**Why it happens:** Each reviewer agent reads design system files, greps source code, and writes detailed reports.
**How to avoid:** Set user expectations in the batch plan output: "Composing N screens... then auto-reviewing." Use the same concurrency for review waves as compose waves. The review summary should show review timing separately from compose timing.
**Warning signs:** User confusion about why the batch is "still running" after seeing the compose summary.

### Pitfall 4: Forgetting to Update 3b.10 Next Steps
**What goes wrong:** After review, the next-step guidance still only mentions `/motif:review all` for composed screens, which is redundant since review already happened.
**Why it happens:** 3b.10 was written before auto-review existed.
**How to avoid:** Update 3b.10 to be review-aware: if review passed, suggest auto-run or proceed; if review found issues, suggest `/motif:fix`.

### Pitfall 5: Single-Screen Flow Not Getting Auto-Review
**What goes wrong:** Only batch mode gets auto-review; single-screen compose skips it.
**Why it happens:** Phase 31 focuses on batch flow (Step 3b), but single-screen has its own flow (Steps 4-6).
**How to avoid:** Consider whether single-screen compose should also auto-review. The requirements say "after a batch compose completes" -- so single-screen may be intentionally excluded. Document this decision clearly.

## Code Examples

### New Step 3b.8c: Auto-Review Dispatch

```markdown
### 3b.8c: Auto-review dispatch

Automatically review all successfully composed screens from this batch.

1. **Collect reviewable screens:** Filter ALL_RESULTS for screens with status PASSED or WARNED. Store as REVIEWABLE_SCREENS.
2. **Skip if none:** If REVIEWABLE_SCREENS is empty, skip to 3b.9.
3. **Announce:** "Auto-reviewing {N} composed screens..."
4. **Calculate review waves:** REVIEW_WAVE_COUNT = ceil(REVIEWABLE_SCREENS.length / CONCURRENCY). REVIEW_WAVES = split into chunks.
5. **For each review wave:** Spawn reviewer Task() agents using the template from review.md Step 2, but with BATCH MODE INSTRUCTIONS prepended:

\```
## BATCH AUTO-REVIEW INSTRUCTIONS
You are reviewing in auto-review mode (triggered automatically after batch compose).

CRITICAL DIFFERENCES from standalone /motif:review:
1. After writing {SCREEN_NAME}-REVIEW.md, do NOT run `git commit`. Leave the file on disk. The orchestrator commits.
2. Do NOT modify STATE.md. The orchestrator handles state updates.
3. Write REVIEW.md to `.planning/design/reviews/{SCREEN_NAME}-REVIEW.md` as normal.
\```
```

### New Step 3b.8d: Review Result Collection

```markdown
### 3b.8d: Review result collection

For each screen in REVIEWABLE_SCREENS:
1. Check if `.planning/design/reviews/{SCREEN_NAME}-REVIEW.md` exists
2. If exists: Grep for `## Score:` line, extract numeric score. Grep for `## Critical Issues` section, check if it contains items or says "None".
3. Classify: REVIEW_PASSED if score >= 80 AND zero critical issues. REVIEW_FAILED otherwise.
4. Track: {name, score, critical_count, review_status}

Commit all review files:
\```bash
git add .planning/design/reviews/*-REVIEW.md
git commit -m "design(review): auto-review batch -- {N} screens reviewed"
\```

Update STATE.md via batch-update-screens: set each reviewed screen to status `reviewed`.

Print review summary:
"Auto-Review Results
| Screen | Score | Critical | Status |
|--------|-------|----------|--------|
| login | 87/100 | 0 | PASS |
| dashboard | 72/100 | 2 | FAIL |
"
```

### New Step 3b.8e: Review Gate

```markdown
### 3b.8e: Review gate (auto-run decision)

Set REVIEW_ALL_PASSED = true if ALL screens in review results have REVIEW_PASSED status.

**If REVIEW_ALL_PASSED:**
  "All screens passed review. Proceeding to auto-run."
  → Continue to Step 3b.9

**If NOT REVIEW_ALL_PASSED:**
  List failing screens with scores and critical issue counts.
  "Review found issues that should be fixed before running:
    - dashboard: 72/100 (2 critical issues)
    - settings: 65/100 (1 critical issue)

  Recommended: Run `/motif:fix {failing_screens}` to address critical issues.

  Override: Would you like to launch the preview anyway? (yes/no)"

  If user says yes: → Continue to Step 3b.9
  If user says no: → Skip 3b.9, go to 3b.10
```

## State of the Art

| Old Approach (current) | New Approach (phase 31) | Impact |
|------------------------|------------------------|--------|
| Batch compose -> manual `/motif:review all` | Batch compose -> auto-review -> gated auto-run | Eliminates manual step, enforces quality gate |
| Auto-run offered unconditionally after batch | Auto-run gated on review pass (with override) | Prevents running broken designs |
| Review and compose are fully separate workflows | Review is embedded in compose batch flow | Tighter feedback loop |

## Open Questions

1. **Should single-screen compose also auto-review?**
   - What we know: Requirements specify "after a batch compose completes" (REV-01)
   - What's unclear: Whether single-screen compose (Steps 4-6) should also trigger review
   - Recommendation: Start with batch only per requirements. Single-screen already suggests `/motif:review` in Step 6. Can be added later if desired.

2. **Should BATCH-RESULT.md (3b.8b) be updated with review results?**
   - What we know: BATCH-RESULT.md currently only has compose results
   - What's unclear: Whether to append review data to the same file or keep separate
   - Recommendation: Append a `## Review Results` section to BATCH-RESULT.md after reviews complete. Amend the manifest commit or make a new commit.

3. **Review concurrency -- same as compose concurrency?**
   - What we know: Compose uses user-specified CONCURRENCY (default 3, max 5)
   - What's unclear: Whether review agents are lighter and could use higher concurrency
   - Recommendation: Reuse the same CONCURRENCY value for simplicity. Review agents are lighter but context7 rate limits still apply.

## Sources

### Primary (HIGH confidence)
- `compose-screen.md` -- full batch flow (Steps 3b.1-3b.10), auto-run logic (3b.9), batch manifest (3b.8b)
- `review.md` -- reviewer agent spawn template, scoring framework (4 lenses, /100), pass criteria (score >= 80, zero critical), output format (REVIEW.md)
- `motif-state.js` -- batch-update-screens command, state structure

### Secondary (MEDIUM confidence)
- Phase 30 summary -- confirms batch flow structure, timing, BATCH-RESULT.md

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all components are existing Motif workflow files, fully read and understood
- Architecture: HIGH -- insertion point is clear (between 3b.8b and 3b.9), patterns are established
- Pitfalls: HIGH -- derived from direct analysis of existing code patterns and batch mode constraints

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable -- internal workflow modification)
