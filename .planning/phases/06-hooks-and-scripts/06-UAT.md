---
status: complete
phase: 06-hooks-and-scripts
source: [06-01-SUMMARY.md, 06-02-SUMMARY.md, 06-03-SUMMARY.md]
started: 2026-03-02T12:30:00Z
updated: 2026-03-02T12:44:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Token-check flags hardcoded CSS color
expected: Run `echo '{"tool_name":"Write","tool_input":{"file_path":"test.css","content":"body { color: #3B82F6; }"}}' | node runtimes/claude-code/hooks/motif-token-check.js` — should output JSON with `"decision":"block"` mentioning the hardcoded color and suggesting a token alternative.
result: pass

### 2. Token-check passes var() references and non-target files
expected: Run `echo '{"tool_name":"Write","tool_input":{"file_path":"test.css","content":"body { color: var(--color-primary); }"}}' | node runtimes/claude-code/hooks/motif-token-check.js` — should produce NO output (silent pass). Then run with `"file_path":"test.md"` and hardcoded color — should also produce no output (markdown is not a target extension).
result: pass

### 3. Token-check handles Edit events
expected: Run `echo '{"tool_name":"Edit","tool_input":{"file_path":"style.css","old_string":"x","new_string":"margin: 24px;"}}' | node runtimes/claude-code/hooks/motif-token-check.js` — should output JSON with `"decision":"block"` flagging the hardcoded spacing `margin: 24px`.
result: pass

### 4. Font-check flags banned font
expected: Run `echo '{"tool_name":"Write","tool_input":{"file_path":"test.css","content":"body { font-family: Inter, sans-serif; }"}}' | node runtimes/claude-code/hooks/motif-font-check.js` — should output JSON with `"decision":"block"` identifying Inter as a banned font and suggesting `var(--font-display)` or `var(--font-body)`.
result: pass

### 5. Font-check passes tokenized fonts
expected: Run `echo '{"tool_name":"Write","tool_input":{"file_path":"test.css","content":"body { font-family: var(--font-display); }"}}' | node runtimes/claude-code/hooks/motif-font-check.js` — should produce NO output (silent pass, font is tokenized).
result: pass

### 6. A11y-check flags div+onClick without role/tabIndex
expected: Run `echo '{"tool_name":"Write","tool_input":{"file_path":"App.tsx","content":"<div onClick={handleClick}>Click me</div>"}}' | node runtimes/claude-code/hooks/motif-aria-check.js` — should output JSON with `"decision":"block"` mentioning missing `role` and `tabIndex` and suggesting `role="button" tabIndex={0}` or using `<button>`.
result: pass

### 7. A11y-check flags img without alt, passes with alt
expected: Run `echo '{"tool_name":"Write","tool_input":{"file_path":"App.tsx","content":"<img src=\"photo.jpg\" />"}}' | node runtimes/claude-code/hooks/motif-aria-check.js` — should output block decision for missing alt. Then run with `alt=""` added — should produce no output (alt="" is valid for decorative images).
result: pass

### 8. A11y-check skips hidden inputs and CSS files
expected: Run `echo '{"tool_name":"Write","tool_input":{"file_path":"App.tsx","content":"<input type=\"hidden\" name=\"csrf\" />"}}' | node runtimes/claude-code/hooks/motif-aria-check.js` — should produce NO output (hidden inputs don't need labels). Also run with `"file_path":"styles.css"` — should produce no output (CSS is not a target for a11y checks).
result: pass

### 9. Context monitor color-coded thresholds
expected: Run these three commands: (1) `echo '{"context_window":{"used_percentage":35}}' | node runtimes/claude-code/hooks/motif-context-monitor.js` — green text showing "35%". (2) `echo '{"context_window":{"used_percentage":55}}' | node runtimes/claude-code/hooks/motif-context-monitor.js` — yellow text showing "55%" with "/clear" recommendation. (3) `echo '{"context_window":{"used_percentage":92}}' | node runtimes/claude-code/hooks/motif-context-monitor.js` — red text showing "92%" with "CRITICAL" warning.
result: pass

### 10. Contrast checker WCAG accuracy
expected: Run `node scripts/contrast-checker.js "#000000" "#FFFFFF"` — should output contrast ratio of exactly 21:1 and all four WCAG levels (AA normal, AA large, AAA normal, AAA large) showing PASS. Then run `node scripts/contrast-checker.js "#777777" "#FFFFFF"` — ratio should be ~4.48:1, AA large PASS, AA normal FAIL.
result: pass

### 11. Token counter directory walk
expected: Run `node scripts/token-counter.js .planning/` — should output directory path, file count, total characters (comma-formatted), and approximate token count. Run `node scripts/token-counter.js /nonexistent` — should print error message and exit with code 1.
result: pass

### 12. Installer copies hooks and creates settings.json
expected: Run `cd /tmp && rm -rf test-uat-hooks && mkdir -p test-uat-hooks/.claude && cd test-uat-hooks && node /Users/austineogbuanya/Documents/SailsLab/designforge/design-forge-final/bin/install.js && ls .claude/get-motif/hooks/ && cat .claude/settings.json`. Hooks directory should contain motif-token-check.js, motif-font-check.js, motif-aria-check.js, motif-context-monitor.js. settings.json should have PostToolUse with Write|Edit matcher and three hook commands, plus a statusLine entry.
result: pass

### 13. Installer uninstall removes Motif settings
expected: From the same /tmp test directory, run `node /Users/austineogbuanya/Documents/SailsLab/designforge/design-forge-final/bin/install.js --uninstall && cat .claude/settings.json 2>/dev/null || echo "settings.json removed"`. settings.json should be removed (or have Motif entries stripped if non-Motif entries existed).
result: pass

## Summary

total: 13
passed: 13
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]
