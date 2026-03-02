---
phase: 06-hooks-and-scripts
verified: 2026-03-02T11:29:11Z
status: passed
score: 5/5 must-haves verified
re_verification: false
gaps: []
human_verification: []
---

# Phase 6: Hooks and Scripts Verification Report

**Phase Goal:** Design system compliance is enforced automatically during composition, and utility scripts support agent workflows
**Verified:** 2026-03-02T11:29:11Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #   | Truth                                                                                                         | Status     | Evidence                                                                                 |
| --- | ------------------------------------------------------------------------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------- |
| 1   | Token-check hook flags hardcoded CSS color/spacing/font-size values in .css/.tsx/.jsx/.vue/.html files        | ✓ VERIFIED | Live test: `color: #3B82F6` blocked; `color: var(--color-primary)` passes; .md silent   |
| 2   | Font-check hook flags banned fonts unless user-locked via tokens.css                                          | ✓ VERIFIED | Live test: `font-family: Inter` blocked; `font-family: var(--font-display)` passes       |
| 3   | A11y-check hook flags div+onClick without role/tabindex, img without alt, input without label                 | ✓ VERIFIED | Live tests: all three violation types caught; role+tabIndex present passes; hidden input passes; CSS files ignored |
| 4   | Context-monitor displays context usage percentage with ANSI color-coding and warns at 50% and 90% thresholds  | ✓ VERIFIED | Live tests: 35% green, 55% yellow+warn, 92% red+CRITICAL, malformed input silent exit 0 |
| 5   | Contrast checker calculates correct WCAG 2.1 contrast ratios using pure Node.js                               | ✓ VERIFIED | Live test: #000000 vs #FFFFFF = 21:1 all PASS; #777777 vs #FFFFFF = 4.48:1 correct PASS/FAIL |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact                                                      | Expected                                    | Status     | Details                                                                           |
| ------------------------------------------------------------- | ------------------------------------------- | ---------- | --------------------------------------------------------------------------------- |
| `runtimes/claude-code/hooks/motif-token-check.js`             | PostToolUse hook flagging hardcoded CSS     | ✓ VERIFIED | 222 lines; contains `decision.*block`, stdin pattern, 6 violation check types     |
| `runtimes/claude-code/hooks/motif-font-check.js`              | PostToolUse hook flagging banned fonts      | ✓ VERIFIED | 193 lines; contains `BANNED_FONTS` list, `tokens.css` runtime read, JSX support  |
| `runtimes/claude-code/hooks/motif-aria-check.js`              | PostToolUse hook flagging a11y violations   | ✓ VERIFIED | 165 lines; checks div+onClick, img alt, input label; skips hidden inputs          |
| `runtimes/claude-code/hooks/motif-context-monitor.js`         | StatusLine script displaying context %      | ✓ VERIFIED | 41 lines; contains `context_window`, ANSI color codes, 3 threshold levels         |
| `scripts/contrast-checker.js`                                 | WCAG contrast ratio calculator              | ✓ VERIFIED | 115 lines; contains `0.04045` linearization, `linearize` function, 4 WCAG levels |
| `scripts/token-counter.js`                                    | Approximate token counter for design files  | ✓ VERIFIED | 108 lines; contains `walkDir`, binary detection, chars/4 heuristic                |
| `bin/install.js` (hooks integration)                          | Installer copies hooks and writes settings.json | ✓ VERIFIED | `resolveMapping()` has hooks entry; `injectHookSettings()` + `removeHookSettings()` present; `PostToolUse` wired |

### Key Link Verification

| From                              | To                     | Via                                      | Status     | Details                                                              |
| --------------------------------- | ---------------------- | ---------------------------------------- | ---------- | -------------------------------------------------------------------- |
| all three compliance hooks        | `process.stdin`        | `process.stdin.on('data'/'end')` pattern | ✓ WIRED    | All three hooks collect stdin chunks and parse JSON on 'end'         |
| `motif-font-check.js`             | `tokens.css`           | `fs.readFileSync` on `$CLAUDE_PROJECT_DIR` path | ✓ WIRED | `getUserLockedFonts()` reads tokens.css via `CLAUDE_PROJECT_DIR` env var |
| `motif-context-monitor.js`        | statusLine session JSON | `used_percentage` extraction             | ✓ WIRED    | Reads `data.context_window.used_percentage` from stdin JSON          |
| `contrast-checker.js`             | WCAG 2.1 spec          | `linearize` with 0.04045 threshold       | ✓ WIRED    | `linearize()` uses 0.04045 threshold; produces exact 21:1 for #000/#fff |
| `bin/install.js resolveMapping()` | `runtimes/claude-code/hooks/` | `copies` array entry with dest `.claude/get-motif/hooks/` | ✓ WIRED | Line 83 in install.js |
| `bin/install.js injectHookSettings()` | `.claude/settings.json` | JSON merge creating PostToolUse entries  | ✓ WIRED    | Lines 279-333; write|Edit matcher with 3 hook commands + statusLine  |
| `bin/install.js uninstall()`      | `.claude/settings.json` | `removeHookSettings()` called at line 669 | ✓ WIRED   | `removeHookSettings` filters Motif entries, deletes file if empty    |

### Requirements Coverage

| Requirement                                                                                               | Status       | Notes                                                                    |
| --------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------------------------------ |
| Token-check hook flags hardcoded CSS color/spacing/font-size values in .css/.tsx/.jsx/.vue/.html files    | ✓ SATISFIED  | Also flags border-radius and box-shadow; allows var() and 0px/1px resets |
| Font-check hook flags banned fonts unless user has explicitly locked them as brand fonts                  | ✓ SATISFIED  | Reads tokens.css at runtime; supports both CSS `font-family` and JSX `fontFamily` |
| A11y-check hook flags div+onClick without role/tabindex, img without alt, input without label             | ✓ SATISFIED  | All three violation types live-verified; hidden inputs and CSS files skipped |
| Context-monitor hook displays context usage percentage and warns when context exceeds 50%                 | ✓ SATISFIED  | Three tiers: green <50%, yellow 50-89%, red 90%+; uses process.stdout.write |
| Contrast checker script calculates WCAG contrast ratios for any two colors using pure Node.js             | ✓ SATISFIED  | Zero external deps; correct 21:1 black/white; 4-level AA/AAA reporting  |

### Anti-Patterns Found

None detected. Scanned all 6 artifact files for: TODO/FIXME/XXX/HACK, placeholder text, empty implementations, console.log-only handlers.

### Human Verification Required

None — all success criteria are programmatically verifiable. Functional tests against live Node.js execution confirmed correct behavior for every defined test case from the plan.

### Gaps Summary

No gaps. All 5 observable truths verified, all 7 key artifacts confirmed substantive and wired, all 6 task commits present in git history (ef3c885, e1e74ca, 3b67182, b0b0d2f, 998b2aa, d421a60). Zero anti-patterns detected.

---

_Verified: 2026-03-02T11:29:11Z_
_Verifier: Claude (gsd-verifier)_
