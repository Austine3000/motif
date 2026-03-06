---
phase: 16-validation-and-hardening
verified: 2026-03-06T09:00:00Z
status: passed
score: 7/7 must-haves verified
re_verification: false
---

# Phase 16: Validation and Hardening Verification Report

**Phase Goal:** Users can trust that all decomposed output passes validation checks and is committed atomically with automatic rollback on failure
**Verified:** 2026-03-06T09:00:00Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Validator detects import cycles between generated files and reports them as errors | VERIFIED | Tested with /tmp/test-cycle-a.tsx and test-cycle-b.tsx -- outputs JSON with status "fail", type "import-cycle", exit code 1. DFS algorithm at lines 125-156. |
| 2 | Validator detects naming conflicts (overwrites of existing project files) in brownfield mode | VERIFIED | checkNamingConflicts() at lines 186-224 uses git status --porcelain, checks for 'M' status, gated behind PROJECT-SCAN.md existence. |
| 3 | Validator warns on unknown props passed to existing components without blocking commit | VERIFIED | checkMissingProps() at lines 305-358 parses COMPONENT-GAP.md and PROJECT-SCAN.md Props Summary, adds to warnings (not errors). Warnings produce exit code 0. |
| 4 | Compose subagent stages all files before committing, runs validation, and only commits if validation passes | VERIFIED | compose-screen.md Step F has F1 (git add), F2 (node scripts/compose-validator.js), F3 (commit only on pass/warn). Line 278-304. |
| 5 | Compose subagent rolls back staging on validation failure without deleting files | VERIFIED | compose-screen.md line 300: "git reset HEAD" on fail, line 301: "Do NOT delete the files". |
| 6 | Orchestrator warns user when PROJECT-SCAN.md scan date is not today before spawning composer | VERIFIED | compose-screen.md Step 2b (lines 55-67) reads Scanned date, compares to today, offers continue/rescan choice. |
| 7 | Greenfield compositions skip staleness check and validator runs with only cycle detection | VERIFIED | Step 2b: "If BROWNFIELD is false: skip this step entirely." Validator: checkNamingConflicts and checkMissingProps both return empty arrays when PROJECT-SCAN.md/COMPONENT-GAP.md are absent. |

**Score:** 7/7 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `scripts/compose-validator.js` | Post-decomposition validation script with detectCycles | VERIFIED | 390 lines, contains parseArgs, extractLocalImports, detectCycles, checkNamingConflicts, checkMissingProps, main. Zero external dependencies. Outputs JSON. |
| `core/workflows/compose-screen.md` | Canonical compose workflow with validation gate and staleness check | VERIFIED | Contains Step 2b (staleness), Step F (validate-then-commit-or-rollback), Validation section in Step E summary template, self-review checklist item. |
| `.claude/get-motif/workflows/compose-screen.md` | Live copy, byte-identical to canonical | VERIFIED | diff produces no output -- files are byte-identical. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| compose-screen.md (Step F) | scripts/compose-validator.js | `node scripts/compose-validator.js` | WIRED | Line 287 contains exact invocation with --screen and --files args. |
| compose-screen.md (Step 2b) | PROJECT-SCAN.md | Read Scanned date | WIRED | Line 58 references `**Scanned:** YYYY-MM-DD` line in PROJECT-SCAN.md. |
| compose-screen.md (Step E) | SUMMARY.md | Validation section | WIRED | Lines 271-276 contain `## Validation` section with status, cycles, conflicts, warnings. |
| compose-validator.js | stdout | JSON output | WIRED | Line 385: `console.log(JSON.stringify(result, null, 2))` -- confirmed via live test. |

### Requirements Coverage

| Requirement | Status | Blocking Issue |
|-------------|--------|----------------|
| COMP-04: User can have all decomposed files committed atomically with rollback on validation failure | SATISFIED | None -- Step F implements stage-validate-commit-or-rollback pattern. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| scripts/compose-validator.js | 88 | `return []` | Info | Correct error-handling path in extractLocalImports when file unreadable. Not a stub. |

No blocker or warning anti-patterns found.

### Human Verification Required

### 1. End-to-End Composition with Validation

**Test:** Run `/motif:compose` on a screen in a brownfield project and verify the subagent follows the validation gate (stages, validates, commits or rolls back).
**Expected:** JSON validation output appears in agent log, commit happens only on pass/warn, SUMMARY.md contains Validation section.
**Why human:** Requires running the full agent pipeline -- cannot simulate subagent behavior programmatically.

### 2. Staleness Warning UX

**Test:** Set up a brownfield project with PROJECT-SCAN.md dated yesterday, then run `/motif:compose`.
**Expected:** Orchestrator warns about stale scan data and offers continue/rescan choice before spawning composer.
**Why human:** Requires interactive orchestrator prompt and user response.

### 3. Validation Failure Rollback

**Test:** Compose a screen that produces import cycles, verify rollback behavior.
**Expected:** Files remain on disk but are unstaged. SUMMARY.md records failure. No commit created.
**Why human:** Requires triggering a validation failure during actual composition.

### Gaps Summary

No gaps found. All must-haves verified across all three levels (existence, substantive implementation, wiring). The validator script runs correctly with proper exit codes and JSON output. The compose workflow properly references the validator with stage-validate-commit-or-rollback semantics. Both copies of compose-screen.md are in sync. Greenfield mode gracefully degrades. Commits are verified in git history.

---

_Verified: 2026-03-06T09:00:00Z_
_Verifier: Claude (gsd-verifier)_
