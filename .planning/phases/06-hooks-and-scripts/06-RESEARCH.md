# Phase 6: Hooks and Scripts - Research

**Researched:** 2026-03-02
**Domain:** Claude Code hooks API (PostToolUse, statusLine), WCAG contrast algorithms, token counting
**Confidence:** HIGH

## Summary

Phase 6 implements automated design system compliance enforcement through Claude Code hooks and utility scripts. The phase produces 4 hook scripts (token-check, font-check, a11y-check, context-monitor) and 2 utility scripts (contrast-checker, token-counter). All files are pure Node.js with zero dependencies, consistent with the project's technical constraints.

Claude Code hooks are configured via `settings.json` and fire at lifecycle events. The three compliance hooks (HOOK-01, HOOK-02, HOOK-03) are **PostToolUse** command hooks that match `Write|Edit` tool events -- they inspect file content after Claude writes/edits files and provide feedback via stdout JSON. The context monitor (HOOK-04) is a **statusLine** command, not a hook -- it is a separate configuration that runs a script receiving session JSON on stdin. This is an important architectural distinction: HOOK-04 uses a fundamentally different mechanism than HOOK-01 through HOOK-03.

The installer (`bin/install.js`) currently has no mapping for hooks and no mechanism to inject hook configuration into `.claude/settings.json`. Phase 6 must either (a) add hook installation logic to the installer, or (b) document that hook setup requires manual settings.json configuration. The recommended approach is to ship the hook scripts in `runtimes/claude-code/hooks/` and update the installer to both copy them and inject the settings.json configuration.

**Primary recommendation:** Build hooks as simple Node.js scripts that read JSON from stdin, inspect `tool_input.content` or `tool_input.file_path` for violations, and output feedback JSON on stdout. Use PostToolUse with `Write|Edit` matcher for compliance hooks. Use the separate `statusLine` configuration for the context monitor.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-in `fs` | N/A | File reading in scripts | Zero deps requirement |
| Node.js built-in `path` | N/A | Path manipulation | Zero deps requirement |
| Node.js built-in `process.stdin` | N/A | Read hook JSON input | Claude Code hooks pipe JSON via stdin |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| None | N/A | N/A | Project constraint: zero external dependencies |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw stdin parsing | `jq` in bash | Bash+jq is simpler for trivial hooks but Node.js is better for regex-heavy content analysis; project spec mandates JS |
| PostToolUse hooks | PreToolUse hooks | PreToolUse can block before write, but PostToolUse is correct here -- we want to flag violations AFTER the file is written, not prevent writing |
| Prompt-type hooks | Command-type hooks | Prompt hooks use an LLM for semantic eval, but our checks are deterministic regex patterns -- command hooks are faster, free, and more reliable |

**Installation:**
```bash
# No npm install needed -- pure Node.js, zero dependencies
```

## Architecture Patterns

### Recommended Project Structure
```
runtimes/claude-code/hooks/
  motif-token-check.js       # HOOK-01: PostToolUse - flags hardcoded CSS values
  motif-font-check.js        # HOOK-02: PostToolUse - flags banned fonts
  motif-aria-check.js        # HOOK-03: PostToolUse - flags a11y violations
  motif-context-monitor.js   # HOOK-04: statusLine - displays context %

scripts/
  contrast-checker.js        # SCRP-01: WCAG contrast ratio calculator
  token-counter.js           # SCRP-02: Approximate token counter
```

### Pattern 1: PostToolUse Hook Structure
**What:** A hook script that reads tool event JSON from stdin, inspects the written/edited file content, and outputs violation feedback via JSON on stdout.
**When to use:** For HOOK-01, HOOK-02, HOOK-03 (all three compliance checks).

```javascript
// Source: https://code.claude.com/docs/en/hooks (PostToolUse reference)
#!/usr/bin/env node
'use strict';

// 1. Read JSON from stdin
let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const data = JSON.parse(input);
  const toolName = data.tool_name;       // "Write" or "Edit"
  const filePath = data.tool_input.file_path;
  const content = data.tool_input.content;  // Full content for Write
  // For Edit: data.tool_input.new_string contains the replacement text

  // 2. Check if this is a file type we care about
  const ext = filePath.split('.').pop().toLowerCase();
  const targetExts = ['css', 'tsx', 'jsx', 'vue', 'html'];
  if (!targetExts.includes(ext)) {
    process.exit(0);  // Not a target file, allow silently
  }

  // 3. Run violation checks on content
  const violations = checkForViolations(content);

  if (violations.length === 0) {
    process.exit(0);  // No violations, allow silently
  }

  // 4. Output feedback JSON -- shown to Claude
  const output = JSON.stringify({
    decision: 'block',
    reason: `Motif design system violations found:\n${violations.join('\n')}`
  });
  process.stdout.write(output);
  process.exit(0);
});
```

**Key insight on PostToolUse decision control:**
- `decision: "block"` with a `reason` field prompts Claude with the reason (the tool already ran, so "block" here means "flag and tell Claude to fix it")
- Exit code 0 + JSON output = Claude sees the feedback
- Exit code 2 = stderr is shown to Claude as error
- Exit code 0 with no output = silent pass

### Pattern 2: StatusLine Script Structure
**What:** A script configured as `statusLine` in settings.json that reads session JSON from stdin and prints formatted output.
**When to use:** For HOOK-04 (context monitor).

```javascript
// Source: https://code.claude.com/docs/en/statusline
#!/usr/bin/env node
'use strict';

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const data = JSON.parse(input);
  const pct = Math.floor(data.context_window?.used_percentage || 0);

  // Color-coded output using ANSI escape codes
  const GREEN = '\x1b[32m';
  const YELLOW = '\x1b[33m';
  const RED = '\x1b[31m';
  const RESET = '\x1b[0m';

  let color = GREEN;
  let warning = '';
  if (pct >= 50) {
    color = pct >= 80 ? RED : YELLOW;
    warning = ' -- recommend /clear';
  }

  console.log(`${color}Motif context: ${pct}%${RESET}${warning}`);
});
```

### Pattern 3: settings.json Hook Configuration
**What:** The JSON configuration that tells Claude Code when to run hooks.
**When to use:** Must be installed alongside the hook scripts.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/get-motif/hooks/motif-token-check.js"
          },
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/get-motif/hooks/motif-font-check.js"
          },
          {
            "type": "command",
            "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/get-motif/hooks/motif-aria-check.js"
          }
        ]
      }
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/get-motif/hooks/motif-context-monitor.js"
  }
}
```

### Pattern 4: Content Inspection for Write vs Edit
**What:** Write tool provides full `content`; Edit tool provides `old_string` and `new_string`. Hooks must handle both.
**When to use:** All three compliance hooks.

```javascript
// Source: https://code.claude.com/docs/en/hooks (PreToolUse input schemas)
function getContentToCheck(data) {
  if (data.tool_name === 'Write') {
    // Write: full file content available
    return data.tool_input.content;
  }
  if (data.tool_name === 'Edit') {
    // Edit: only the new replacement text
    return data.tool_input.new_string;
  }
  return null;
}
```

**Important:** For Edit events, we can only check the `new_string` (the replacement text), not the full file. This is sufficient because we are checking whether Claude is INTRODUCING violations, not auditing the entire file.

### Anti-Patterns to Avoid
- **Reading the file from disk in PostToolUse:** Do NOT `fs.readFileSync(filePath)` in a PostToolUse hook. The `tool_input.content` already contains the content for Write. For Edit, use `new_string`. Reading from disk adds latency and the file may not be flushed yet.
- **Using exit code 2 for violations:** Exit 2 means "error" and stderr is shown. For design violations, use exit 0 + JSON `decision: "block"` with `reason` -- this is the standard pattern for providing corrective feedback to Claude.
- **Heavy processing in statusLine scripts:** The status line runs after every assistant message. Keep it fast. The context monitor should just read JSON and print -- no file I/O, no git commands, no network calls.
- **Blocking on stdin with `readFileSync`:** Use the async `process.stdin.on('data/end')` pattern. stdin may arrive in chunks.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WCAG contrast ratio | Custom luminance formula | W3C's published sRGB linearization + contrast formula | The formula has a specific threshold (0.04045) and gamma (2.4) that are easy to get wrong |
| CSS value parsing | Full CSS parser | Targeted regex patterns for hex/rgb/hsl/font-family | Full parsing is massive scope; regex catches 95%+ of hardcoded values the agent produces |
| Token counting | Exact tokenizer | Character-count heuristic (chars / 4) | Exact tokenization requires tiktoken or similar; the heuristic is standard practice and close enough for budgets |
| JSON stdin reading | Custom stream parser | `JSON.parse(concatenated chunks)` | Claude Code sends complete JSON on stdin; no streaming parser needed |

**Key insight:** These hooks are lint-like checks, not full parsers. They catch the most common violations an AI agent would produce. They do NOT need to handle every edge case in CSS/HTML -- just the patterns Claude Code actually generates.

## Common Pitfalls

### Pitfall 1: Hooks Not Registering Because settings.json Missing
**What goes wrong:** Hook scripts exist but Claude Code doesn't run them because no settings.json configuration points to them.
**Why it happens:** The current installer copies files but doesn't create/modify `.claude/settings.json`.
**How to avoid:** The installer must either: (a) create/merge `.claude/settings.json` with hook config, or (b) the CLAUDE-MD-SNIPPET must instruct the user to set up hooks manually. Option (a) is strongly recommended.
**Warning signs:** Hooks exist in the file tree but violations still go uncaught.

### Pitfall 2: Checking ALL Files Instead of Target Extensions
**What goes wrong:** Hooks fire on every Write/Edit, including .md, .json, .txt files, causing false positives and slowdowns.
**Why it happens:** PostToolUse with `Write|Edit` matcher fires for ALL file writes, not just CSS/HTML.
**How to avoid:** First check `file_path` extension. Only inspect `.css`, `.tsx`, `.jsx`, `.vue`, `.html` files. Exit 0 immediately for non-target files.
**Warning signs:** Violations reported in markdown files, README files, or config files.

### Pitfall 3: False Positives in CSS Comments and Strings
**What goes wrong:** Hook flags `#` in CSS comments (like `/* Primary color #3B82F6 */`) or hex colors in data attributes.
**Why it happens:** Naive regex matches color patterns everywhere, not just in property values.
**How to avoid:** Use regex patterns that match the property context: `color:\s*#`, `background:\s*#`, not just `#[0-9a-fA-F]{3,8}`. Also skip lines that start with `//` or are inside `/* */` blocks.
**Warning signs:** Violations reported for comments, documentation strings, or SVG data.

### Pitfall 4: Forgetting Edit Tool Only Has new_string
**What goes wrong:** Hook tries to access `data.tool_input.content` for Edit events, gets `undefined`.
**Why it happens:** Write and Edit have different `tool_input` schemas.
**How to avoid:** Always check `data.tool_name` and use the appropriate field: `content` for Write, `new_string` for Edit.
**Warning signs:** Hook silently passes all Edit events without checking anything.

### Pitfall 5: StatusLine vs Hook Confusion
**What goes wrong:** Context monitor is configured as a PostToolUse hook instead of a statusLine.
**Why it happens:** The project spec calls it "HOOK-04" and puts it alongside the other hooks.
**How to avoid:** Understand that `statusLine` is a separate settings.json field, not part of `hooks`. It receives different JSON (session data with `context_window`, `cost`, `model` fields) and outputs plain text, not decision JSON.
**Warning signs:** Context percentage never shows, or the hook fires on every tool call instead of displaying persistently.

### Pitfall 6: User-Locked Fonts Not Respected
**What goes wrong:** Font-check hook flags fonts that the user has explicitly chosen as brand fonts.
**Why it happens:** Hook has a hardcoded banned list without checking for user overrides.
**How to avoid:** Read `tokens.css` (or a brand config file) at hook runtime to check if the font has been set as `--font-display` or `--font-body`. If a "banned" font appears as a token value, it's been user-locked and should be allowed.
**Warning signs:** Users who intentionally chose Inter or Roboto get false warnings after every file write.

### Pitfall 7: Contrast Checker Using Wrong Linearization Threshold
**What goes wrong:** Contrast ratios are slightly off, causing incorrect pass/fail judgments near the 4.5:1 boundary.
**Why it happens:** WCAG 2.0 used threshold 0.03928, WCAG 2.1 updated to 0.04045. Some implementations use the old value.
**How to avoid:** Use 0.04045 as the linearization threshold (current WCAG 2.1 standard). The difference is negligible in practice but using the current standard is correct.
**Warning signs:** Edge-case colors that barely pass/fail show different results than online WCAG checkers.

## Code Examples

Verified patterns from official sources:

### WCAG Contrast Ratio Calculator (Pure Node.js)
```javascript
// Source: https://www.w3.org/WAI/GL/wiki/Relative_luminance + https://www.w3.org/WAI/GL/wiki/Contrast_ratio

/**
 * Parse hex color to [r, g, b] in 0-255 range
 */
function parseHex(hex) {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

/**
 * Convert sRGB channel (0-255) to linear value
 * Uses WCAG 2.1 threshold of 0.04045
 */
function linearize(channel) {
  const sRGB = channel / 255;
  return sRGB <= 0.04045
    ? sRGB / 12.92
    : Math.pow((sRGB + 0.055) / 1.055, 2.4);
}

/**
 * Calculate relative luminance per WCAG 2.1
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
function relativeLuminance(r, g, b) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Calculate contrast ratio between two colors
 * Returns ratio like 4.5, 7.0, 21.0 etc.
 */
function contrastRatio(hex1, hex2) {
  const [r1, g1, b1] = parseHex(hex1);
  const [r2, g2, b2] = parseHex(hex2);
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}
```

### Token Check Regex Patterns
```javascript
// Patterns that catch hardcoded CSS values an AI agent would generate

// Hardcoded colors (hex, rgb, rgba, hsl, hsla)
const COLOR_PATTERNS = [
  /(?:color|background(?:-color)?|border(?:-color)?|outline-color|fill|stroke)\s*:\s*#[0-9a-fA-F]{3,8}/g,
  /(?:color|background(?:-color)?|border(?:-color)?|outline-color|fill|stroke)\s*:\s*rgba?\(/g,
  /(?:color|background(?:-color)?|border(?:-color)?|outline-color|fill|stroke)\s*:\s*hsla?\(/g,
];

// Hardcoded spacing (px values in margin/padding)
const SPACING_PATTERNS = [
  /(?:margin|padding)(?:-(?:top|right|bottom|left))?\s*:\s*\d+px/g,
  /gap\s*:\s*\d+px/g,
];

// Hardcoded radii
const RADIUS_PATTERNS = [
  /border-radius\s*:\s*\d+px/g,
];

// Hardcoded shadows
const SHADOW_PATTERNS = [
  /box-shadow\s*:\s*(?!var\()/g,
];

// Hardcoded font sizes
const FONT_SIZE_PATTERNS = [
  /font-size\s*:\s*\d+(?:px|rem|em)/g,
];
```

### Banned Font Detection
```javascript
// Source: CLAUDE-MD-SNIPPET.md banned fonts list
const BANNED_FONTS = [
  'inter',
  'roboto',
  'open sans',
  'opensans',
  'lato',
  'arial',
  'helvetica',
  'system-ui',
  '-apple-system',
  'blinkmacsystemfont',
  'segoe ui',
];

// Match font-family declarations
const FONT_FAMILY_PATTERN = /font-family\s*:\s*([^;}\n]+)/gi;

function checkBannedFonts(content, userLockedFonts) {
  const violations = [];
  let match;
  while ((match = FONT_FAMILY_PATTERN.exec(content)) !== null) {
    const fontValue = match[1].toLowerCase();
    // Skip if it references a CSS variable (token)
    if (fontValue.includes('var(')) continue;

    for (const banned of BANNED_FONTS) {
      // Skip if this font has been user-locked as a brand font
      if (userLockedFonts.includes(banned)) continue;

      if (fontValue.includes(banned)) {
        violations.push({
          font: banned,
          line: content.substring(0, match.index).split('\n').length,
          suggestion: 'Use var(--font-display) or var(--font-body) instead',
        });
      }
    }
  }
  return violations;
}
```

### A11y Check Patterns
```javascript
// Source: WCAG 2.1 success criteria 4.1.2, 1.1.1, 1.3.1

// div with onClick but no role/tabindex (non-semantic interactive element)
const DIV_ONCLICK_PATTERN = /<div[^>]*\bonClick\b[^>]*>/gi;
function checkDivOnClick(match) {
  const hasRole = /\brole\s*=/.test(match);
  const hasTabIndex = /\btabIndex\s*=|\btabindex\s*=/.test(match);
  return !(hasRole && hasTabIndex);
  // If div has onClick, it MUST have both role AND tabIndex
}

// img without alt attribute
const IMG_PATTERN = /<img\b[^>]*>/gi;
function checkImgAlt(match) {
  return !/\balt\s*=/.test(match);
  // true = violation (missing alt)
}

// input without associated label
// This checks for input elements and whether they have:
// - An aria-label attribute, OR
// - An aria-labelledby attribute, OR
// - Are wrapped in a <label>, OR
// - Have an id that matches a <label for="">
const INPUT_PATTERN = /<input\b[^>]*>/gi;
function checkInputLabel(match) {
  const hasAriaLabel = /\baria-label\s*=/.test(match);
  const hasAriaLabelledBy = /\baria-labelledby\s*=/.test(match);
  // Note: checking for wrapping <label> or <label for=""> requires
  // broader context than just the input element. For hook purposes,
  // flag inputs without aria-label/aria-labelledby as potential violations.
  return !(hasAriaLabel || hasAriaLabelledBy);
}
```

### Approximate Token Counter
```javascript
// Source: Common heuristic used by OpenAI/Anthropic tooling
// ~4 characters per token for English text, ~3.5 for code

const fs = require('node:fs');
const path = require('node:path');

function countTokensApprox(text) {
  // Heuristic: ~4 characters per token for mixed content
  return Math.ceil(text.length / 4);
}

function walkDir(dir) {
  let totalChars = 0;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      totalChars += walkDir(fullPath);
    } else {
      totalChars += fs.readFileSync(fullPath, 'utf8').length;
    }
  }
  return totalChars;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| 7 hook lifecycle events | 14+ lifecycle events (SessionStart, PreToolUse, PostToolUse, PostToolUseFailure, Notification, SubagentStart, SubagentStop, Stop, TeammateIdle, TaskCompleted, ConfigChange, WorktreeCreate, WorktreeRemove, PreCompact, SessionEnd) | Jan-Feb 2026 | More granular control, but we only need PostToolUse |
| Command hooks only | Command, HTTP, Prompt, and Agent hook types | Jan 2026 | Prompt/agent hooks add LLM-based evaluation, but our checks are deterministic so command hooks are appropriate |
| `decision/reason` for PreToolUse | `hookSpecificOutput.permissionDecision` for PreToolUse | Recent | Top-level `decision/reason` still used by PostToolUse. PreToolUse deprecated top-level pattern |
| Status line via hooks | Separate `statusLine` configuration field | Established | Context monitor uses statusLine, NOT a PostToolUse hook |
| WCAG 2.0 threshold 0.03928 | WCAG 2.1 threshold 0.04045 | May 2021 | Negligible practical difference, but use current value |

**Deprecated/outdated:**
- PreToolUse top-level `decision: "approve"/"block"` is deprecated -- use `hookSpecificOutput.permissionDecision` instead
- However, PostToolUse STILL uses top-level `decision: "block"` and `reason` -- this is current, not deprecated

## Installer Integration Considerations

The current installer (`bin/install.js`) needs updates to support hooks:

### What Needs to Change
1. **Add hooks copy mapping:** `runtimes/claude-code/hooks/` -> `.claude/get-motif/hooks/`
2. **Create/merge settings.json:** The installer must create `.claude/settings.json` with hook configuration or merge into an existing one
3. **Settings.json merge strategy:** Use the same sentinel pattern as CLAUDE.md (`<!-- MOTIF-START -->`) but for JSON, OR use a separate identifiable key structure

### Recommended Settings.json Strategy
```javascript
// In installer: create or merge .claude/settings.json
function injectHookSettings(cwd) {
  const settingsPath = path.join(cwd, '.claude', 'settings.json');
  let settings = {};

  if (fs.existsSync(settingsPath)) {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  }

  // Merge hooks (don't overwrite existing hooks)
  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.PostToolUse) settings.hooks.PostToolUse = [];

  // Add Motif hooks if not already present
  const motifMatcher = settings.hooks.PostToolUse.find(
    g => g.matcher === 'Write|Edit' && g.hooks?.some(h => h.command?.includes('motif'))
  );

  if (!motifMatcher) {
    settings.hooks.PostToolUse.push({
      matcher: 'Write|Edit',
      hooks: [
        { type: 'command', command: 'node "$CLAUDE_PROJECT_DIR"/.claude/get-motif/hooks/motif-token-check.js' },
        { type: 'command', command: 'node "$CLAUDE_PROJECT_DIR"/.claude/get-motif/hooks/motif-font-check.js' },
        { type: 'command', command: 'node "$CLAUDE_PROJECT_DIR"/.claude/get-motif/hooks/motif-aria-check.js' },
      ],
    });
  }

  // Add statusLine
  if (!settings.statusLine) {
    settings.statusLine = {
      type: 'command',
      command: 'node "$CLAUDE_PROJECT_DIR"/.claude/get-motif/hooks/motif-context-monitor.js',
    };
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
}
```

### Uninstall Consideration
The uninstall function must also remove hook entries from `.claude/settings.json`, not just delete files.

## Open Questions

1. **Where should hook scripts be installed?**
   - What we know: `runtime-adapters.md` says `.claude/hooks/` but the installer currently maps everything else to `.claude/get-motif/`
   - What's unclear: Should hooks go to `.claude/get-motif/hooks/` (consistent with other Motif files) or `.claude/hooks/` (shorter path)?
   - Recommendation: Use `.claude/get-motif/hooks/` for consistency. The `settings.json` command path handles the reference regardless.

2. **Should installer update settings.json?**
   - What we know: Hooks REQUIRE settings.json configuration to function. Without it, scripts are dead files.
   - What's unclear: Whether modifying settings.json is within Phase 6 scope or Phase 8 (installer improvements)
   - Recommendation: Include minimal settings.json injection in Phase 6. The hooks are useless without it.

3. **How to handle the user-locked font exception?**
   - What we know: Font-check must allow fonts if user has explicitly locked them as brand fonts
   - What's unclear: Where to read the lock state -- from `tokens.css` font token values? From a separate config?
   - Recommendation: Read `.planning/design/system/tokens.css` at hook runtime, parse `--font-display` and `--font-body` values. If a "banned" font appears as a token value, consider it user-locked. Fall back to the banned list if tokens.css doesn't exist.

4. **PostToolUse `decision: "block"` behavior:**
   - What we know: PostToolUse cannot actually block (the tool already ran). Per docs, `decision: "block"` with `reason` "prompts Claude with the reason"
   - What's unclear: Whether this creates a strong enough signal for Claude to fix the violation immediately
   - Recommendation: Use `decision: "block"` + `reason` as the primary mechanism. The reason text should be prescriptive: "VIOLATION: Found hardcoded color #3B82F6. Replace with var(--color-primary). Motif requires all values reference tokens.css."

## Sources

### Primary (HIGH confidence)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) - Complete hook event schemas, PostToolUse input/output format, matcher patterns, decision control, settings.json structure
- [Claude Code StatusLine Reference](https://code.claude.com/docs/en/statusline) - StatusLine configuration, JSON input schema (context_window, model, cost fields), script examples
- [Claude Code Settings Reference](https://code.claude.com/docs/en/settings) - Settings file locations, hook configuration placement, statusLine configuration

### Secondary (MEDIUM confidence)
- [WCAG 2.1 Relative Luminance](https://www.w3.org/WAI/GL/wiki/Relative_luminance) - sRGB linearization formula with 0.04045 threshold
- [WCAG 2.1 Contrast Ratio](https://www.w3.org/WAI/GL/wiki/Contrast_ratio) - (L1 + 0.05) / (L2 + 0.05) formula
- [WCAG Understanding 1.4.3](https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html) - 4.5:1 normal text, 3:1 large text thresholds

### Tertiary (LOW confidence)
- None -- all findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - zero deps, pure Node.js is mandated by project spec
- Architecture (hook format): HIGH - verified against official Claude Code docs, PostToolUse schema documented with examples
- Architecture (statusLine): HIGH - verified against official statusLine docs, separate from hooks system
- Pitfalls: HIGH - derived from official docs (Write vs Edit schemas, settings.json requirement) and project-specific analysis (installer gap)
- Code examples (WCAG): HIGH - formula from W3C official wiki
- Code examples (regex patterns): MEDIUM - patterns designed for AI-generated CSS, may need tuning during battle testing
- Installer integration: MEDIUM - proposed approach is sound but touches existing code (installer) that may have Phase 4 changes in flight

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (30 days -- Claude Code hooks API is stable, WCAG standards are stable)
