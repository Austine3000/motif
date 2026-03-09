# Phase 17: Context Resilience - Research

**Researched:** 2026-03-09
**Domain:** Claude Code hooks API, state persistence, artifact-based recovery
**Confidence:** HIGH

## Summary

This phase makes Motif workflows survive `/clear` and context compaction by introducing a dedicated state file, artifact-based recovery, and a rich status line. The Claude Code hooks API provides all the primitives needed: `SessionStart` fires on `startup`, `resume`, `clear`, and `compact` with `additionalContext` injection; the `statusLine` command reads a file and displays it persistently; and `PreCompact` fires before compaction for state snapshot opportunities.

The current Motif STATE.md uses a pure markdown format (headings + tables) that is difficult for scripts to parse reliably. The upgrade path is YAML frontmatter for machine-readable fields plus a markdown body for human-readable details. Node.js can parse YAML frontmatter trivially with a regex split on `---` boundaries, avoiding npm dependencies.

**Primary recommendation:** Use YAML frontmatter + markdown body for STATE.md. Build recovery as a Node.js script that scans artifacts and rebuilds YAML frontmatter. Wire the status line to read STATE.md directly (no SessionStart dependency). Use SessionStart hooks only for `additionalContext` injection into Claude's prompt.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Motif gets its own state file, separate from GSD's `.planning/STATE.md`
- State file lives at the project level (not global)
- Required fields: phase + status, vertical + stack, screen progress (count and names), last command context (what ran and outcome)
- When state file is missing or corrupt: scan artifacts, rebuild state, and **notify** the user ("State recovered from artifacts — phase: COMPOSING, 3/5 screens") — don't ask for confirmation, but don't be silent either
- Full recovery depth: infer vertical from tokens.css patterns, stack from package.json/project files, and workflow phase from artifact presence
- When inferred state conflicts with user's explicit command: **warn then obey** — show what state says, then proceed with what user asked
- Rich status line format: phase + count + vertical + current/next screen
- When idle (no active work): show next action
- Commands validate state and **warn but allow** out-of-order execution

### Claude's Discretion
- Whether to use YAML frontmatter + markdown body or pure YAML (optimize for scripts/hooks parsing)
- Which artifacts count as minimum recovery anchors
- Whether status line appears always in Motif projects vs only during Motif commands
- Whether format adapts per workflow phase vs stays consistent
- Fallback strategy for SessionStart hook bug (#15174)
- When state gets written (every command, on transitions, on screen completion)
- Atomic writes vs direct writes

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js (built-in `fs`, `path`) | N/A | State file read/write, artifact scanning | Already used by all Motif scripts; zero deps |
| YAML frontmatter (hand-parsed) | N/A | Machine-readable state header | 10-line regex parser; no `js-yaml` dependency needed for the subset we use |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `jq` (CLI) | system | StatusLine JSON parsing | Already required by statusLine; used in Bash hook scripts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| YAML frontmatter (hand-parsed) | `js-yaml` npm package | Adds a dependency; full YAML spec is overkill for flat key-value frontmatter |
| Pure YAML | JSON | JSON is harder for humans to read/edit; YAML is more natural for state files |
| Pure markdown (current) | Keep as-is | Scripts cannot reliably parse markdown tables; defeats the machine-readable requirement |

**Installation:**
No new dependencies. All scripts use Node.js built-ins.

## Architecture Patterns

### Recommended File Layout
```
.planning/design/
├── STATE.md                    # YAML frontmatter + markdown (upgraded)
.claude/get-motif/
├── hooks/
│   ├── motif-context-monitor.js  # StatusLine hook (upgraded)
│   ├── motif-session-start.js    # NEW: SessionStart hook
│   └── motif-state-recovery.js   # NEW: Artifact scanner + state rebuilder
├── scripts/
│   └── motif-state.js            # NEW: State read/write/update utility
├── templates/
│   └── STATE-TEMPLATE.md         # Updated to YAML frontmatter format
```

### Pattern 1: YAML Frontmatter + Markdown Body
**What:** STATE.md has YAML between `---` delimiters for machine parsing, with markdown body for human context.
**When to use:** Always — this is the canonical state format.
**Recommendation:** Use YAML frontmatter + markdown body. This is the best choice because:
1. Scripts parse YAML frontmatter with a trivial regex split (no dependency)
2. Humans can read/edit the file naturally
3. YAML supports the flat key-value structure needed (phase, vertical, stack, screen list)
4. Markdown body preserves the decisions log and context budget for human reference
**Example:**
```markdown
---
phase: COMPOSING
vertical: fintech
stack: react
screen_count: 5
screens_composed: 3
screens:
  - name: login
    status: composed
  - name: dashboard
    status: composed
  - name: settings
    status: composed
  - name: transactions
    status: planned
  - name: profile
    status: planned
last_command: /motif:compose settings
last_outcome: success
updated: 2026-03-09T14:30:00Z
---

# Motif State

## Decisions Log
- 2026-03-09 Project initialized
- 2026-03-09 Vertical detected: fintech
- 2026-03-09 Design system generated

## Context Budget
| File | Tokens (approx) | Budget |
|---|---|---|
| PROJECT.md | ~800 | ≤1,000 |
| tokens.css | ~2,000 | ≤3,000 |
```

### Pattern 2: State Read/Write Utility Script
**What:** A single `motif-state.js` script that handles all state operations: read, write, update field, validate, and recover.
**When to use:** Every command and hook that touches state.
**Example:**
```javascript
// motif-state.js — state utility
// Usage from commands: node .claude/get-motif/scripts/motif-state.js read
// Usage from commands: node .claude/get-motif/scripts/motif-state.js update phase COMPOSING
// Usage from commands: node .claude/get-motif/scripts/motif-state.js recover
// Usage from hooks:    node .claude/get-motif/scripts/motif-state.js status-line

const fs = require('fs');
const path = require('path');

const STATE_PATH = '.planning/design/STATE.md';

function parseYamlFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;
  const yaml = {};
  // Simple YAML parser for flat + list values
  let currentKey = null;
  let currentList = null;
  for (const line of match[1].split('\n')) {
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    const listItemMatch = line.match(/^\s+-\s+(.*)$/);
    const listKvMatch = line.match(/^\s+(\w+):\s*(.*)$/);
    if (kvMatch && !listItemMatch) {
      if (currentList) { yaml[currentKey] = currentList; currentList = null; }
      const [, key, val] = kvMatch;
      if (val === '') { currentKey = key; currentList = []; }
      else { yaml[key] = val; currentKey = null; }
    } else if (listItemMatch && currentList !== null) {
      // Simple list item like "- login"
      currentList.push(listItemMatch[1]);
    } else if (listKvMatch && currentList !== null) {
      // Object list item like "  name: login"
      const last = currentList[currentList.length - 1];
      if (typeof last === 'object') {
        last[listKvMatch[1]] = listKvMatch[2];
      }
    }
  }
  if (currentList) yaml[currentKey] = currentList;
  return yaml;
}
```

### Pattern 3: Artifact-Based Recovery
**What:** When STATE.md is missing/corrupt, scan `.planning/design/` artifacts to infer current phase.
**When to use:** Every command start, before gate check.
**Recovery anchor mapping (HIGH reliability):**

| Artifact | Infers | Confidence |
|----------|--------|------------|
| `.planning/design/PROJECT.md` exists | >= INITIALIZED | HIGH |
| `.planning/design/DESIGN-RESEARCH.md` exists | >= RESEARCHED | HIGH |
| `.planning/design/system/tokens.css` exists | >= SYSTEM_GENERATED | HIGH |
| `.planning/design/screens/*-SUMMARY.md` count > 0 | COMPOSING | HIGH |
| `.planning/design/reviews/*-REVIEW.md` count > 0 | REVIEWING | HIGH |
| `tokens.css` header comment contains `Vertical:` | Vertical name | HIGH |
| `PROJECT.md` `## Technical Stack` section | Stack | HIGH |
| `PROJECT.md` `## Vertical` section | Vertical | HIGH |
| `PROJECT.md` `## Screens (v1)` section | Screen list | HIGH |
| `screens/*-SUMMARY.md` filenames | Which screens are composed | HIGH |

**Low reliability (avoid for recovery):**
| Artifact | Why Unreliable |
|----------|---------------|
| `DESIGN-BRIEF.md` differentiation seed | Multiple verticals could produce similar seeds |
| `package.json` dependencies | Could be non-Motif project dependencies |

### Pattern 4: SessionStart Hook for Context Injection
**What:** A hook that fires on `startup`, `resume`, `clear`, and `compact` to inject Motif state into Claude's context.
**When to use:** Every session start event.
**Key insight:** SessionStart stdout is added as context Claude can see. This is how the agent "remembers" after `/clear`.

```javascript
// motif-session-start.js
// Reads STATE.md, outputs additionalContext for Claude
const fs = require('fs');
const state = parseState(); // reuse motif-state.js logic

if (state) {
  const ctx = `[Motif State] Phase: ${state.phase} | Vertical: ${state.vertical} | ` +
    `Stack: ${state.stack} | Screens: ${state.screens_composed}/${state.screen_count} | ` +
    `Last: ${state.last_command} (${state.last_outcome})`;
  // Output JSON for structured injection
  console.log(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "SessionStart",
      additionalContext: ctx
    }
  }));
} else {
  // Attempt recovery
  const recovered = recoverFromArtifacts();
  if (recovered) {
    writeState(recovered);
    console.log(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "SessionStart",
        additionalContext: `[Motif State Recovered] ${formatState(recovered)}`
      }
    }));
  }
  // If no Motif project, exit silently
}
```

### Pattern 5: StatusLine Reading State File Directly
**What:** The statusLine hook reads STATE.md from disk on every refresh, independent of SessionStart.
**When to use:** This is the fallback-proof approach — statusLine never depends on SessionStart working.

```javascript
// motif-context-monitor.js (upgraded)
// Reads both stdin JSON (context %) AND STATE.md from disk
const fs = require('fs');
const STATE_PATH = path.join(process.env.CLAUDE_PROJECT_DIR || '.', '.planning/design/STATE.md');

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  const data = JSON.parse(input);
  const pct = Math.floor(data?.context_window?.used_percentage || 0);

  // Read Motif state from disk
  let motifLine = '';
  try {
    const content = fs.readFileSync(STATE_PATH, 'utf8');
    const state = parseYamlFrontmatter(content);
    if (state) {
      motifLine = `Motif: ${state.vertical} | ${state.phase} ${state.screens_composed}/${state.screen_count}`;
      // Add next action if idle
      if (state.phase === 'SYSTEM_GENERATED') motifLine += ' | next: /motif:compose';
      // etc.
    }
  } catch (e) { /* No Motif project — show context only */ }

  // Combine context % with Motif state
  const contextLine = formatContext(pct);
  if (motifLine) {
    process.stdout.write(`${motifLine} | ${contextLine}`);
  } else {
    process.stdout.write(contextLine);
  }
});
```

### Anti-Patterns to Avoid
- **Relying solely on SessionStart for state awareness:** Bug #15174 means stdout after compaction is unreliable. Always have commands read STATE.md directly as first action.
- **Blocking on state validation:** The "warn then obey" pattern means state checks NEVER block execution. They warn and proceed.
- **Parsing markdown tables with regex:** The current STATE.md screen table is fragile to parse. YAML frontmatter with a structured `screens` list eliminates this.
- **Writing state from hooks asynchronously:** State writes must be synchronous and atomic to avoid races between hook and command execution.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| YAML parsing | Full YAML spec parser | Simple frontmatter regex splitter | Motif state uses flat keys + simple lists only; 10 lines vs a dependency |
| File watching for state changes | Custom fs.watch setup | StatusLine's built-in refresh (runs on every message) | StatusLine already refreshes on every conversation turn |
| Context injection after /clear | Custom prompt manipulation | SessionStart hook `additionalContext` | Official API; survives Claude Code updates |
| State file locking | flock/lockfile | Write-then-rename (atomic rename) | Single writer at a time in Claude Code's sequential execution model |

**Key insight:** Claude Code commands execute sequentially — there is never concurrent state modification. This means atomic writes via rename are sufficient; no locking needed.

## Common Pitfalls

### Pitfall 1: SessionStart Hook Bug #15174
**What goes wrong:** SessionStart hooks with the `compact` matcher execute, but their stdout is silently dropped — `additionalContext` never reaches Claude's context after compaction.
**Why it happens:** Known Claude Code bug; compaction triggers SessionStart with `source: "compact"` but the output injection pathway is broken.
**How to avoid:** Do NOT rely on SessionStart as the sole recovery mechanism. Instead:
1. Every `/motif:*` command reads STATE.md as its first action (already in the existing design)
2. StatusLine reads STATE.md from disk directly (no SessionStart dependency)
3. SessionStart is a bonus — it works for `startup`, `resume`, and `clear`, but commands do not depend on it
**Warning signs:** After compaction, Claude doesn't mention Motif state in its first response.
**Fallback:** CLAUDE.md can include a rule: "When running any /motif:* command, always read .planning/design/STATE.md first." This survives compaction because CLAUDE.md is re-loaded.

### Pitfall 2: StatusLine Performance
**What goes wrong:** StatusLine script takes too long, causing UI lag.
**Why it happens:** Reading STATE.md from disk on every refresh (every 300ms debounced).
**How to avoid:** Keep the script fast — the file read is <1ms for a small file. Avoid spawning child processes (like `git` commands) in the statusLine script. The current motif-context-monitor.js is already Node.js and fast.
**Warning signs:** StatusLine flickers or shows stale data.

### Pitfall 3: State File Corruption During Crash
**What goes wrong:** Power failure or Ctrl+C during state write leaves STATE.md partially written.
**Why it happens:** Non-atomic write (fs.writeFileSync to the same path).
**How to avoid:** Write-then-rename pattern:
```javascript
const tmp = STATE_PATH + '.tmp';
fs.writeFileSync(tmp, content);
fs.renameSync(tmp, STATE_PATH);
```
On POSIX systems, `rename` is atomic at the filesystem level.
**Warning signs:** STATE.md has truncated YAML or missing `---` delimiter.

### Pitfall 4: Recovery Producing Wrong Phase
**What goes wrong:** Artifact scan infers COMPOSING when user actually deleted screens intentionally.
**Why it happens:** Artifact presence is not the same as intent.
**How to avoid:** The "warn then obey" pattern handles this. Recovery notifies the user what was inferred, and the user's next command takes precedence. If user runs `/motif:init`, the warning says "You're in COMPOSING phase — re-init will reset progress" but proceeds.
**Warning signs:** User confused by incorrect phase notification.

### Pitfall 5: Gate Checks Becoming Blockers
**What goes wrong:** Gate checks block command execution, frustrating power users.
**Why it happens:** Current design uses hard blocks (stop with error message).
**How to avoid:** Change gates from hard blocks to soft warnings. "Can't find design system — running compose without /motif:system may produce inconsistent results. Continue?" Crucially, in a CLI without interactive prompts (subagent contexts), the warning should default to proceeding.
**Warning signs:** Users reporting "Motif won't let me do X."

### Pitfall 6: Stale State After Subagent Execution
**What goes wrong:** Subagent composes a screen but orchestrator doesn't see updated state.
**Why it happens:** Subagent writes STATE.md, but orchestrator cached the old version in memory.
**How to avoid:** Orchestrator always re-reads STATE.md after Task() returns, before acting on state. This is already the pattern in compose-screen.md (Step 5: Update State reads first).
**Warning signs:** Screen count in state doesn't match actual screen files.

## Code Examples

### YAML Frontmatter Parser (no dependencies)
```javascript
// Source: Custom implementation for Motif — verified approach
function parseYamlFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const lines = match[1].split('\n');
  const result = {};
  let currentKey = null;
  let currentList = null;
  let currentObj = null;

  for (const line of lines) {
    // Top-level key: value
    const kv = line.match(/^([a-z_]+):\s*(.+)$/);
    // Top-level key with no value (start of list/map)
    const keyOnly = line.match(/^([a-z_]+):$/);
    // List item: "  - value"
    const listItem = line.match(/^\s+-\s+(\S.*)$/);
    // Nested key: "    key: value" (inside list object)
    const nestedKv = line.match(/^\s{4}(\w+):\s*(.*)$/);

    if (kv) {
      if (currentList) { result[currentKey] = currentList; currentList = null; }
      result[kv[1]] = kv[2];
    } else if (keyOnly) {
      if (currentList) { result[currentKey] = currentList; }
      currentKey = keyOnly[1];
      currentList = [];
    } else if (listItem && currentList !== null) {
      currentObj = {};
      // Check if it's "- name: value" format
      const inlineKv = listItem[1].match(/^(\w+):\s*(.*)$/);
      if (inlineKv) {
        currentObj[inlineKv[1]] = inlineKv[2];
        currentList.push(currentObj);
      } else {
        currentList.push(listItem[1]);
        currentObj = null;
      }
    } else if (nestedKv && currentObj) {
      currentObj[nestedKv[1]] = nestedKv[2];
    }
  }
  if (currentList) result[currentKey] = currentList;

  return result;
}
```

### Atomic State Write
```javascript
// Source: POSIX fs semantics — rename is atomic
function writeState(statePath, yamlObj, markdownBody) {
  const yaml = Object.entries(yamlObj)
    .map(([k, v]) => {
      if (Array.isArray(v)) {
        const items = v.map(item => {
          if (typeof item === 'object') {
            const first = Object.entries(item)[0];
            const rest = Object.entries(item).slice(1);
            return `  - ${first[0]}: ${first[1]}\n` +
              rest.map(([rk, rv]) => `    ${rk}: ${rv}`).join('\n');
          }
          return `  - ${item}`;
        }).join('\n');
        return `${k}:\n${items}`;
      }
      return `${k}: ${v}`;
    })
    .join('\n');

  const content = `---\n${yaml}\n---\n\n${markdownBody}`;
  const tmp = statePath + '.tmp';
  const fs = require('fs');
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, statePath);
}
```

### Artifact Recovery Scanner
```javascript
// Source: Custom implementation based on Motif artifact layout
function recoverFromArtifacts(designDir) {
  const fs = require('fs');
  const path = require('path');
  const state = { phase: 'UNINITIALIZED', vertical: '', stack: '', screens: [] };

  // Phase inference chain (most specific to least)
  const reviewGlob = glob(path.join(designDir, 'reviews', '*-REVIEW.md'));
  const screenGlob = glob(path.join(designDir, 'screens', '*-SUMMARY.md'));
  const hasTokens = fs.existsSync(path.join(designDir, 'system', 'tokens.css'));
  const hasResearch = fs.existsSync(path.join(designDir, 'DESIGN-RESEARCH.md'));
  const hasProject = fs.existsSync(path.join(designDir, 'PROJECT.md'));

  if (reviewGlob.length > 0) state.phase = 'REVIEWING';
  else if (screenGlob.length > 0) state.phase = 'COMPOSING';
  else if (hasTokens) state.phase = 'SYSTEM_GENERATED';
  else if (hasResearch) state.phase = 'RESEARCHED';
  else if (hasProject) state.phase = 'INITIALIZED';

  // Vertical from PROJECT.md
  if (hasProject) {
    const proj = fs.readFileSync(path.join(designDir, 'PROJECT.md'), 'utf8');
    const vertMatch = proj.match(/## Vertical\n(\w+)/);
    if (vertMatch) state.vertical = vertMatch[1].trim().toLowerCase();
    const stackMatch = proj.match(/## Technical Stack\n(.+)/);
    if (stackMatch) state.stack = stackMatch[1].trim();
    // Screen list
    const screenSection = proj.match(/## Screens \(v1\)\n([\s\S]*?)(?=\n##|$)/);
    if (screenSection) {
      const screenLines = screenSection[1].trim().split('\n');
      state.screens = screenLines.map(line => {
        const m = line.match(/\d+\.\s+(\S+)/);
        return m ? { name: m[1], status: 'planned' } : null;
      }).filter(Boolean);
    }
  }

  // Mark composed screens based on SUMMARY existence
  const composedScreens = screenGlob.map(f => path.basename(f).replace('-SUMMARY.md', ''));
  state.screens.forEach(s => {
    if (composedScreens.includes(s.name)) s.status = 'composed';
  });

  // Mark reviewed screens
  const reviewedScreens = reviewGlob.map(f => path.basename(f).replace('-REVIEW.md', ''));
  state.screens.forEach(s => {
    if (reviewedScreens.includes(s.name)) s.status = 'reviewed';
  });

  state.screen_count = state.screens.length;
  state.screens_composed = state.screens.filter(s => s.status !== 'planned').length;

  return state.phase !== 'UNINITIALIZED' ? state : null;
}
```

### StatusLine Hook (Upgraded)
```javascript
// Source: Claude Code statusLine docs + current motif-context-monitor.js
#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');

const STATE_PATH = path.join(
  process.env.CLAUDE_PROJECT_DIR || process.cwd(),
  '.planning', 'design', 'STATE.md'
);

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  let data;
  try { data = JSON.parse(input); } catch (e) { process.exit(0); }

  const pct = Math.floor(data?.context_window?.used_percentage || 0);
  const GREEN = '\x1b[32m', YELLOW = '\x1b[33m', RED = '\x1b[31m';
  const CYAN = '\x1b[36m', DIM = '\x1b[2m', RESET = '\x1b[0m';

  // Context color
  let ctxColor = pct >= 90 ? RED : pct >= 50 ? YELLOW : GREEN;
  let ctxPart = `${ctxColor}ctx:${pct}%${RESET}`;

  // Motif state from disk
  let motifPart = '';
  try {
    const content = fs.readFileSync(STATE_PATH, 'utf8');
    const fm = content.match(/^---\n([\s\S]*?)\n---/);
    if (fm) {
      const lines = fm[1].split('\n');
      const get = (key) => {
        const l = lines.find(l => l.startsWith(key + ':'));
        return l ? l.split(':').slice(1).join(':').trim() : '';
      };
      const phase = get('phase');
      const vertical = get('vertical');
      const composed = get('screens_composed');
      const total = get('screen_count');

      motifPart = `${CYAN}Motif${RESET}: ${vertical}`;
      if (phase && total) {
        motifPart += ` ${DIM}|${RESET} ${phase} ${composed}/${total}`;
      }
    }
  } catch (e) { /* Not a Motif project or no state */ }

  if (motifPart) {
    process.stdout.write(`${motifPart} ${DIM}|${RESET} ${ctxPart}`);
  } else {
    process.stdout.write(`${ctxPart}`);
  }
});
```

### SessionStart Hook Configuration
```json
{
  "hooks": {
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
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Markdown-only STATE.md | YAML frontmatter + markdown body | This phase | Scripts can reliably parse state; commands auto-recover |
| Hard gate blocks | Warn-then-obey soft gates | This phase | Power users not blocked; newcomers get guidance |
| No status line state | Rich status line from STATE.md | This phase | Persistent visibility across /clear and compaction |
| Context-only monitor | Context + Motif state in statusLine | This phase | User always knows where they are in the workflow |
| SessionStart for awareness | SessionStart + CLAUDE.md + direct reads | This phase | Resilient to bug #15174 |

**Claude Code Hook API status (as of 2026-03-09):**
- SessionStart: fires on `startup`, `resume`, `clear`, `compact` — stdout added as context (HIGH confidence)
- StatusLine: refreshes on every message, 300ms debounce, reads JSON from stdin, prints to stdout (HIGH confidence)
- PreCompact: fires before compaction, receives `trigger` (manual/auto) — no blocking, side-effects only (HIGH confidence)
- Bug #15174: SessionStart `compact` matcher stdout silently dropped (CONFIRMED — GitHub issue open)

## Discretion Recommendations

### State File Format: YAML Frontmatter + Markdown Body
**Recommendation:** YAML frontmatter + markdown body (not pure YAML).
**Reasoning:** Scripts only need the frontmatter (flat keys, simple lists). The markdown body preserves the human-readable decisions log and context budget. A pure YAML file would require converting the decisions log and context budget table into YAML, making them harder for humans to scan.

### Recovery Anchors
**Recommendation:** Use the HIGH reliability artifacts listed in Pattern 3 above. Specifically:
- **Phase inference:** PROJECT.md > DESIGN-RESEARCH.md > tokens.css > screen SUMMARYs > review files (chain of specificity)
- **Vertical:** PROJECT.md `## Vertical` section (primary), tokens.css header comment (backup)
- **Stack:** PROJECT.md `## Technical Stack` section
- **Screen list:** PROJECT.md `## Screens (v1)` section
- **Screen status:** SUMMARY file existence = composed, REVIEW file existence = reviewed
Do NOT use: package.json (may not be a Motif project), DESIGN-BRIEF.md seed values (ambiguous across verticals)

### Status Line: Always Show in Motif Projects
**Recommendation:** Always show when STATE.md exists, not only during Motif commands. The statusLine hook reads STATE.md from disk independently — it works whether or not the user is actively running `/motif:*` commands. When no STATE.md exists, show only context percentage (existing behavior).

### Status Line Format: Consistent with Phase-Relevant Detail
**Recommendation:** Use a single consistent template that includes the most relevant field per phase:
- `Motif: {vertical} | {PHASE} {composed}/{total} | next: {next_screen_or_command}`
- When composing: `next: dashboard` (next unbuilt screen)
- When reviewing: `next: /motif:fix` or `next: /motif:compose` if all reviewed
- When idle after init: `next: /motif:research`
This avoids the complexity of per-phase templates while still surfacing the most useful info.

### SessionStart Bug Fallback
**Recommendation:** Three-layer defense:
1. **CLAUDE.md rule** (survives everything): "When running any /motif:* command, always read .planning/design/STATE.md first." This is already in the existing design (gate checks read STATE.md).
2. **SessionStart hook** (works for startup/resume/clear, unreliable for compact): Inject state into `additionalContext`.
3. **StatusLine** (always works): Visual state on every turn, reads from disk.

The practical impact of #15174 is minimal because after compaction, the next user message triggers a command, and that command reads STATE.md directly. The gap is only the brief moment between compaction and the next command — the status line covers that.

### State Write Granularity: On Every Command Completion
**Recommendation:** Write state at the end of every command that modifies workflow state. Specifically:
- After `/motif:init` completes (phase -> INITIALIZED)
- After `/motif:research` completes (phase -> RESEARCHED)
- After `/motif:system` completes (phase -> SYSTEM_GENERATED)
- After each `/motif:compose {screen}` completes (screens table + phase)
- After each `/motif:review {screen}` completes (screens table + phase)
- After each `/motif:fix {screen}` completes (screens table)
- After `/motif:evolve` completes (no phase change, but log decision)
- `/motif:quick` and `/motif:progress` read but do not write state

This is coarser than "on every transition" but finer than "on every screen." It ensures that after any `/clear`, the state reflects the last completed command.

### Atomic Writes: Yes
**Recommendation:** Use write-then-rename for all state writes. The cost is negligible (one extra syscall), and it prevents corruption from crashes. See the "Atomic State Write" code example above.

## Open Questions

1. **How to handle multiple statusLine hooks?**
   - What we know: The project already has a statusLine in settings.json (motif-context-monitor.js). Claude Code only supports ONE statusLine command.
   - What's unclear: Whether the upgraded hook replaces or supplements the existing one.
   - Recommendation: Replace the existing motif-context-monitor.js with the upgraded version that includes both context % and Motif state. It's a single script that does both jobs.

2. **Should state recovery be a standalone script or embedded in each command?**
   - What we know: Every command does a gate check. Recovery could run as part of the gate check.
   - What's unclear: Whether a separate recovery script (called by SessionStart hook) duplicates the command's own read.
   - Recommendation: Make `motif-state.js` the single entry point. Commands call `node .claude/get-motif/scripts/motif-state.js read` — it handles recovery internally if STATE.md is missing/corrupt. SessionStart calls the same script. No duplication.

3. **PreCompact hook: should state be saved before compaction?**
   - What we know: PreCompact fires before compaction, but cannot block it. It runs as side-effect only.
   - What's unclear: Whether state could be stale at compaction time (e.g., mid-compose).
   - Recommendation: PreCompact is unnecessary. State is already written at command completion, which happens before compaction. Compaction only triggers when context is full, which is between commands. Adding PreCompact adds complexity for no benefit.

## Sources

### Primary (HIGH confidence)
- [Claude Code Hooks Reference](https://code.claude.com/docs/en/hooks) — Full hook API, all events, input/output schemas, matchers
- [Claude Code StatusLine Docs](https://code.claude.com/docs/en/statusline) — StatusLine configuration, JSON input schema, refresh behavior, examples
- Existing codebase files — state-machine.md, context-engine.md, all command .md files, hooks/*.js

### Secondary (MEDIUM confidence)
- [GitHub Issue #15174](https://github.com/anthropics/claude-code/issues/15174) — SessionStart compact matcher stdout dropped bug (confirmed, open)

### Tertiary (LOW confidence)
- None — all findings verified against official docs or existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — using existing Node.js built-ins, no new dependencies
- Architecture: HIGH — patterns directly derived from Claude Code official docs + existing Motif architecture
- Pitfalls: HIGH — Bug #15174 confirmed via GitHub issue; other pitfalls verified from filesystem semantics and existing code review
- Recovery: MEDIUM — artifact scanning approach is sound but exact regex patterns for vertical/stack extraction need testing against real artifacts

**Research date:** 2026-03-09
**Valid until:** 2026-04-09 (30 days — stable domain, but bug #15174 may be fixed sooner)
