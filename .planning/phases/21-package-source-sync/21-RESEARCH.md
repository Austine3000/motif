# Phase 21: Package Source Sync - Research

**Researched:** 2026-03-09
**Domain:** npm package source synchronization, file copy propagation, hook registration
**Confidence:** HIGH

## Summary

Phase 21 is a gap closure phase that addresses a systematic problem discovered by the v1.3 milestone audit: Phase 17 (context resilience) and Phase 18 (new verticals) modified files in the locally installed `.claude/get-motif/` directory but never propagated those changes back to the package source directories (`runtimes/`, `scripts/`, `core/`). Since `motif init` copies FROM package source TO project, new installs miss all Phase 17/18 artifacts entirely.

The fix is straightforward file synchronization -- copying the working installed versions to their package source counterparts, plus one code change to `init.js` to register SessionStart hooks. No new libraries, no architectural changes, no new patterns. This is mechanical sync work with a verification test to prevent regression.

**Primary recommendation:** Copy 5 files from installed locations to package source, add SessionStart hook registration to `init.js injectHookSettings()`, and write an E2E test that verifies a fresh install gets all v1.3 artifacts.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js | >=22.0.0 | Runtime (per package.json engines) | Project requirement |
| node:fs | built-in | File operations for copy/sync | Standard library |
| node:path | built-in | Path resolution | Standard library |
| node:child_process | built-in | execSync for test assertions | Standard library |
| node:crypto | built-in | SHA-256 hashing for manifest | Standard library |

### Supporting
No additional libraries needed. This phase uses only Node.js built-ins already in use by the project.

**Installation:**
```bash
# No new packages needed
```

## Architecture Patterns

### Package Source Layout (Critical Context)

The project has a clear separation between **package source** (what ships via npm) and **installed artifacts** (what gets copied into a user's project):

```
Package source (ships via npm):
├── bin/                    # CLI entry points
│   ├── cli.js              # Main CLI router
│   ├── commands/init.js    # Init command (copies from package source to project)
│   └── lib/                # Shared utilities
├── core/                   # Cross-runtime references, templates, workflows
│   └── references/
│       └── icon-libraries.md   # <-- STALE: missing 4 new verticals
├── runtimes/
│   └── claude-code/
│       ├── CLAUDE-MD-SNIPPET.md  # <-- STALE: missing State Awareness section
│       ├── hooks/
│       │   ├── motif-context-monitor.js  # <-- STALE: 40 lines vs 125 needed
│       │   └── (missing motif-session-start.js)  # <-- MISSING
│       ├── agents/
│       └── commands/motif/
└── scripts/                # <-- MISSING motif-state.js
    ├── check-version.js
    ├── compose-validator.js
    └── ...

Installed artifacts (in user's project):
├── .claude/get-motif/
│   ├── hooks/
│   │   ├── motif-context-monitor.js  # 125 lines (correct)
│   │   └── motif-session-start.js    # present (correct)
│   ├── scripts/
│   │   └── motif-state.js            # present (correct)
│   └── references/
│       └── icon-libraries.md         # 8 verticals (correct)
└── CLAUDE.md                         # Has State Awareness section (correct)
```

### Pattern 1: Source-of-Truth Flow
**What:** Package source is authoritative. `motif init` copies from package source to project. Local dev modifications must be back-propagated to package source before publish.
**When to use:** Always -- this is the core invariant that was violated.

### Pattern 2: init.js resolveMapping() Copy List
**What:** `resolveMapping()` at line 74-95 of init.js defines the exact source-to-destination mapping. The `scripts/` directory maps to `.claude/get-motif/scripts/` and `runtimes/claude-code/hooks/` maps to `.claude/get-motif/hooks/`. No mapping changes are needed -- the directories are already mapped, the files just need to exist in the source.

### Pattern 3: Hook Registration in settings.json
**What:** `injectHookSettings()` at line 279-331 of init.js programmatically writes hook configuration to `.claude/settings.json`. Currently registers PostToolUse hooks and statusLine, but NOT SessionStart hooks.
**Required structure for SessionStart:**
```javascript
// Current local settings.json structure (line 22-32):
"SessionStart": [
  {
    "matcher": "startup|resume|clear|compact",
    "hooks": [
      {
        "type": "command",
        "command": "node \"$CLAUDE_PROJECT_DIR\"/.claude/get-motif/hooks/motif-session-start.js"
      }
    ]
  }
]
```

### Anti-Patterns to Avoid
- **Modifying installed files without back-propagating to source:** This is exactly how Phase 17/18 introduced the gaps. The fix must update the canonical package source, not the local install.
- **Adding new copy mappings to init.js:** Not needed. The existing `scripts/` and `runtimes/claude-code/hooks/` directories are already in the copy list. Just add the missing files.
- **Forgetting to update the `package.json files` array:** The `files` array already includes `bin/`, `core/`, `runtimes/`, `scripts/` -- all directories that need fixes are already listed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| File sync validation | Custom diff tooling | Direct file comparison in E2E test | Line-count and content checks are sufficient |
| Hook registration testing | Manual settings.json inspection | Parse JSON in E2E test and assert structure | Deterministic, automatable |

**Key insight:** This phase is purely mechanical. The "hard work" was done in Phase 17/18. This phase just moves the results to the right locations.

## Common Pitfalls

### Pitfall 1: Forgetting the CLAUDE-MD-SNIPPET.md State Awareness Section
**What goes wrong:** The snippet file is what gets injected into CLAUDE.md during install. If State Awareness is missing from the snippet, new installs won't have the first-layer defense even though init.js correctly copies the file.
**Why it happens:** CLAUDE.md was manually edited in Phase 17 but the snippet source wasn't updated.
**How to avoid:** Compare current CLAUDE.md content between markers with the snippet file. The snippet should contain the exact same content.
**Warning signs:** `diff` between CLAUDE.md (between MOTIF-START/END markers) and CLAUDE-MD-SNIPPET.md shows differences.

### Pitfall 2: injectHookSettings() Cleanup Logic
**What goes wrong:** The function has idempotent cleanup logic (lines 310-312) that removes existing Motif PostToolUse matchers before re-adding. The SessionStart registration must follow the same pattern -- remove existing Motif SessionStart matchers before adding.
**Why it happens:** Without cleanup, re-installs would duplicate SessionStart hooks.
**How to avoid:** Follow the exact same pattern as PostToolUse: filter out existing Motif matchers, then push new ones.
**Warning signs:** Running `motif init` twice creates duplicate SessionStart entries.

### Pitfall 3: removeHookSettings() Must Also Handle SessionStart
**What goes wrong:** The uninstall path (`removeHookSettings()` at line 530-568) removes PostToolUse hooks and statusLine. It must also remove SessionStart hooks for clean uninstall.
**Why it happens:** SessionStart registration is new -- the uninstall code predates it.
**How to avoid:** Add SessionStart cleanup to `removeHookSettings()` using the same filter pattern.
**Warning signs:** After `motif init --uninstall`, settings.json still has SessionStart hooks.

### Pitfall 4: E2E Test Must Verify Hook Registration
**What goes wrong:** The existing E2E test checks file existence and manifest integrity but does NOT verify settings.json hook registration beyond PostToolUse and statusLine.
**Why it happens:** SessionStart hooks didn't exist when the E2E test was written.
**How to avoid:** Add assertions for SessionStart hooks in settings.json after fresh install.
**Warning signs:** E2E passes but doctor fails on SessionStart check.

### Pitfall 5: icon-libraries.md Selection Algorithm Input List
**What goes wrong:** The icon-libraries.md diff shows the Domain Affinity Matrix needs 4 new rows AND the Selection Algorithm `vertical` input list needs updating from `fintech | health | saas | ecommerce` to include `social | education | marketplace | devtools`.
**Why it happens:** Easy to copy only the matrix rows and miss the algorithm input spec.
**How to avoid:** Full diff of both files; apply all hunks.

## Code Examples

### SessionStart Hook Registration (to add to injectHookSettings)
```javascript
// Source: Existing pattern from PostToolUse registration (init.js lines 305-322)
// Add after PostToolUse registration, before statusLine:

// Ensure SessionStart hooks structure exists
if (!settings.hooks.SessionStart) settings.hooks.SessionStart = [];

// Remove existing Motif SessionStart matcher group (for idempotent re-install)
settings.hooks.SessionStart = settings.hooks.SessionStart.filter(
  g => !(g.matcher === 'startup|resume|clear|compact' && g.hooks?.some(h => h.command?.includes('motif')))
);

// Add Motif SessionStart hooks
settings.hooks.SessionStart.push({
  matcher: 'startup|resume|clear|compact',
  hooks: [
    { type: 'command', command: 'node "$CLAUDE_PROJECT_DIR"/.claude/get-motif/hooks/motif-session-start.js' },
  ],
});
```

### SessionStart Cleanup for Uninstall (to add to removeHookSettings)
```javascript
// Source: Pattern from PostToolUse cleanup (init.js lines 548-554)
// Add after PostToolUse cleanup:

if (settings.hooks?.SessionStart) {
  settings.hooks.SessionStart = settings.hooks.SessionStart.filter(
    g => !(g.matcher === 'startup|resume|clear|compact' && g.hooks?.some(h => h.command?.includes('motif')))
  );
  if (settings.hooks.SessionStart.length === 0) delete settings.hooks.SessionStart;
}
```

### E2E Fresh Install Verification Pattern
```javascript
// Source: Existing E2E test patterns (test/e2e-installer.js)
// New assertions for Phase 21 artifacts:

// 1. motif-state.js installed
assert(fs.existsSync(path.join(tmpBase, '.claude', 'get-motif', 'scripts', 'motif-state.js')),
  'motif-state.js installed in scripts/');

// 2. motif-session-start.js installed
assert(fs.existsSync(path.join(tmpBase, '.claude', 'get-motif', 'hooks', 'motif-session-start.js')),
  'motif-session-start.js installed in hooks/');

// 3. motif-context-monitor.js is the 125-line version
const monitorContent = fs.readFileSync(
  path.join(tmpBase, '.claude', 'get-motif', 'hooks', 'motif-context-monitor.js'), 'utf8');
const monitorLines = monitorContent.split('\n').length;
assert(monitorLines >= 100, `motif-context-monitor.js has rich display (${monitorLines} lines, expected 100+)`);

// 4. CLAUDE.md has State Awareness section
const claudeContent = fs.readFileSync(path.join(tmpBase, 'CLAUDE.md'), 'utf8');
assert(claudeContent.includes('State Awareness'), 'CLAUDE.md contains State Awareness section');

// 5. settings.json has SessionStart hooks
const settings = JSON.parse(fs.readFileSync(path.join(tmpBase, '.claude', 'settings.json'), 'utf8'));
const hasSessionStart = settings.hooks?.SessionStart?.some(
  g => g.hooks?.some(h => h.command?.includes('motif-session-start'))
);
assert(hasSessionStart, 'settings.json has SessionStart hook registration');

// 6. icon-libraries.md has 8 verticals in affinity matrix
const iconLibs = fs.readFileSync(
  path.join(tmpBase, '.claude', 'get-motif', 'references', 'icon-libraries.md'), 'utf8');
const verticals = ['Fintech', 'Health', 'SaaS', 'E-commerce', 'Social', 'Education', 'Marketplace', 'DevTools'];
for (const v of verticals) {
  assert(iconLibs.includes(v), `icon-libraries.md contains ${v} vertical`);
}
```

## Exact File Operations Required

| # | Operation | Source (Installed) | Destination (Package Source) | Notes |
|---|-----------|-------------------|------------------------------|-------|
| 1 | Copy | `.claude/get-motif/scripts/motif-state.js` | `scripts/motif-state.js` | 475 lines, state management utility |
| 2 | Copy | `.claude/get-motif/hooks/motif-session-start.js` | `runtimes/claude-code/hooks/motif-session-start.js` | 109 lines, SessionStart hook |
| 3 | Overwrite | `.claude/get-motif/hooks/motif-context-monitor.js` | `runtimes/claude-code/hooks/motif-context-monitor.js` | 125 lines replaces 40-line version |
| 4 | Update | Current CLAUDE.md (State Awareness section) | `runtimes/claude-code/CLAUDE-MD-SNIPPET.md` | Add State Awareness section |
| 5 | Overwrite | `.claude/get-motif/references/icon-libraries.md` | `core/references/icon-libraries.md` | Add 4 vertical rows + update algorithm input |
| 6 | Modify | N/A | `bin/commands/init.js` | Add SessionStart to `injectHookSettings()` and `removeHookSettings()` |

## Verification Checklist (for E2E test)

After `motif init` in a clean temp directory:

1. `.claude/get-motif/scripts/motif-state.js` exists and has `cmdRecover` function
2. `.claude/get-motif/hooks/motif-session-start.js` exists and outputs `hookEventName: 'SessionStart'`
3. `.claude/get-motif/hooks/motif-context-monitor.js` has 100+ lines (rich Motif state display)
4. `CLAUDE.md` between MOTIF-START/END markers contains "State Awareness"
5. `.claude/get-motif/references/icon-libraries.md` contains all 8 verticals
6. `.claude/settings.json` contains `SessionStart` hook group with `motif-session-start` command
7. `motif status` can shell out to motif-state.js without error
8. `motif doctor` passes all checks including SessionStart hook verification

## Open Questions

None. The audit is thorough, the file operations are well-defined, and the code patterns are established. This is purely mechanical sync work.

## Sources

### Primary (HIGH confidence)
- `bin/commands/init.js` -- Full source read, lines 1-754. Copy mapping, hook registration, uninstall logic all verified.
- `runtimes/claude-code/hooks/motif-context-monitor.js` -- 40-line stale version verified.
- `.claude/get-motif/hooks/motif-context-monitor.js` -- 125-line correct version verified.
- `.claude/get-motif/hooks/motif-session-start.js` -- 109-line SessionStart hook verified.
- `.claude/get-motif/scripts/motif-state.js` -- 475-line state management utility verified.
- `core/references/icon-libraries.md` vs `.claude/get-motif/references/icon-libraries.md` -- diff shows exactly 4 missing vertical rows + algorithm input update.
- `runtimes/claude-code/CLAUDE-MD-SNIPPET.md` vs `CLAUDE.md` -- diff confirms State Awareness section is missing from snippet.
- `.claude/settings.json` -- Local settings confirm SessionStart hook structure (lines 22-32).
- `.planning/v1.3-MILESTONE-AUDIT.md` -- Root cause analysis, all 6 file fixes enumerated.
- `test/e2e-installer.js` -- Existing E2E test patterns for fresh install verification (619 lines).
- `package.json` -- `files` array confirms `bin/`, `core/`, `runtimes/`, `scripts/` all ship.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - No new dependencies, all Node.js built-ins already in use
- Architecture: HIGH - Pattern is established (copy from source to install), just need to add missing files
- Pitfalls: HIGH - All pitfalls derived from direct source code reading (init.js, removeHookSettings, E2E test)
- File operations: HIGH - Exact file paths, line counts, and content verified via read and diff

**Research date:** 2026-03-09
**Valid until:** Indefinite (project-specific knowledge, not library versioning)
