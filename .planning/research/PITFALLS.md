# Pitfalls Research

**Domain:** npm-distributed AI design engineering CLI tool (Design Forge / Motif)
**Researched:** 2026-03-01
**Confidence:** HIGH (verified against Claude Code official docs, Node.js docs, npm ecosystem patterns, and project spec)

---

## Critical Pitfalls

Mistakes that cause rewrites, data loss, or broken installations.

### Pitfall 1: Installer Overwrites User Files Without Backup or Merge

**What goes wrong:**
The installer (`bin/install.js`) copies files into `.claude/commands/forge/`, `.claude/get-design-forge/`, and appends to `.claude/CLAUDE.md`. If the user has existing commands, custom CLAUDE.md rules, or a prior Design Forge installation, the installer silently overwrites or double-appends content. Users lose custom configuration, or end up with duplicate Design Forge rule blocks in CLAUDE.md.

**Why it happens:**
File-copying installers default to "write and forget." Developers implement the happy path (fresh install) and treat re-install as an edge case. The `npx design-forge@latest` pattern specifically encourages re-running the installer for updates, making this the *primary* path, not an edge case.

**How to avoid:**
1. Before ANY file write, check if the target exists. If it does, create a `.backup` timestamped copy (e.g., `CLAUDE.md.backup.2026-03-01T14-30`).
2. For CLAUDE.md injection, search for the sentinel string `"# Design Forge Rules"` before appending. If found, replace the block between sentinels rather than appending again. Use start/end markers:
   ```
   <!-- DESIGN-FORGE-START -->
   ...rules...
   <!-- DESIGN-FORGE-END -->
   ```
3. For command files, compare content hashes before overwriting. Skip identical files.
4. Print a summary of what was changed: "Updated 3 files, backed up 1 file, skipped 12 unchanged files."

**Warning signs:**
- CLAUDE.md grows larger with each `npx design-forge@latest` run.
- Users report "my custom CLAUDE.md rules disappeared."
- Hook configurations duplicate during sessions (documented Claude Code bug: [Issue #3523](https://github.com/anthropics/claude-code/issues/3523)).

**Phase to address:**
Phase 2 (Installer + Distribution). The backup/merge logic must be in `bin/install.js` from day one. This is not a "polish later" feature -- it is a data-loss prevention mechanism.

---

### Pitfall 2: `{FORGE_ROOT}` Path Variable Not Resolved Consistently Across Runtimes and OS

**What goes wrong:**
Workflow files (e.g., `core/workflows/research.md`) reference `{FORGE_ROOT}/verticals/{VERTICAL}.md`. This path variable must resolve to `.claude/get-design-forge` for Claude Code, `.opencode/get-design-forge` for OpenCode, etc. If the installer uses string replacement in markdown files but misses a reference, or if the path uses backslashes on Windows, the AI agent receives broken file paths and silently fails to load critical context (verticals, references). The agent then hallucinates design decisions instead of using the curated vertical intelligence.

**Why it happens:**
Three compounding issues: (a) markdown files are not code -- there is no compiler to catch unresolved variables; (b) string replacement is fragile when the same variable appears in code blocks, examples, and comments; (c) path separators differ across OS (forward slash vs backslash), and Windows path handling in Node.js requires explicit `path.join()` usage.

**How to avoid:**
1. Choose Option 1 from `runtime-adapters.md`: generate command files at install time with resolved paths. Do NOT ship `{FORGE_ROOT}` in installed files.
2. Use `path.join()` and `path.resolve()` for ALL path construction in `bin/install.js`. Never concatenate strings with `/`.
3. After installation, run a verification pass that reads every installed `.md` file and checks for any remaining `{FORGE_ROOT}` literals. Fail loudly if found.
4. In workflow files that the AI reads at runtime, use paths relative to a known anchor (e.g., "Read the file at `.claude/get-design-forge/verticals/fintech.md`") rather than variable substitution.

**Warning signs:**
- Agent output references "the fintech vertical" but with generic content (it never loaded the file).
- Error messages about "file not found" in subagent output.
- Different behavior on macOS vs Windows for the same command.

**Phase to address:**
Phase 2 (Installer + Distribution). Path resolution is an installer responsibility. The post-install verification check should be part of the installer's final step.

---

### Pitfall 3: Context Budget Exceeded -- Orchestrator Accumulates Context and Agents Hallucinate

**What goes wrong:**
The orchestrator (main Claude Code session) reads files it should only pass paths to. After 3-4 `/forge:compose` cycles, the orchestrator's context fills to 70%+. At this point, the agent begins dropping information, misinterpreting STATE.md, or hallucinating design decisions. The user sees quality degrade on screen 4-5 and does not understand why.

This is the #1 failure mode identified in the context-engine.md spec: "The orchestrator stays thin. Agents get fresh context. Work happens in clean windows."

**Why it happens:**
The AI agent does not natively track its own context usage. Without explicit guardrails, it will read files "to be helpful." The anti-patterns listed in `context-engine.md` are easy to violate because reading a file feels like the right thing to do. Additionally, each subagent spawning cycle returns results to the main context -- even SUMMARY.md files accumulate over multiple screens.

Per Claude Code docs: "When subagents complete, their results return to your main conversation. Running many subagents that each return detailed results can consume significant context." And separately: "Referencing five medium-sized files in one session can consume upwards of 30,000 tokens."

**How to avoid:**
1. Agent definitions (Phase 1) must contain explicit context-loading profiles from `context-engine.md`. Each agent md file should list exactly which files to read and which to NEVER read.
2. Orchestrator workflows must include a context check step after each subagent cycle: "If context > 50%, tell the user to run `/clear` before continuing."
3. Design SUMMARY.md files to be extremely concise (budget: 500 tokens max). The orchestrator reads these -- bloated summaries are a direct attack on orchestrator context.
4. Use the `SessionStart` hook with `compact` matcher to re-inject critical context (Design Forge rules, current STATE.md) after compaction events.
5. Consider implementing a `forge-context-monitor` hook (P2) that displays context % in the statusline and warns at 50%.

**Warning signs:**
- Screen 5 uses different fonts than screen 1 despite same tokens.css.
- The orchestrator "forgets" the vertical and asks the user what they are building.
- `/forge:compose` starts producing generic UI ("AI slop") instead of vertical-specific patterns.
- The agent fails to update STATE.md after a compose cycle.

**Phase to address:**
Phase 1 (Agents + Templates) -- the agent definitions must encode context discipline. Phase 4 (Hooks) -- the context monitor hook provides runtime detection.

---

### Pitfall 4: Subagent Spawning Costs Token Budget Rapidly, Hitting Rate Limits

**What goes wrong:**
Each subagent Task() spawn creates a fresh 200K context window. The `/forge:research` workflow spawns 4 parallel agents. Each reads PROJECT.md, DESIGN-BRIEF.md, and potentially a vertical reference file. That is 4 x (system prompt + files + work output) = potentially 100K+ tokens consumed in a single command. Users on standard Claude plans hit rate limits and get throttled mid-workflow. The research phase dies halfway through with 2 of 4 agents complete.

Per community observation: "the token cost catches up fast if you are not watching /cost between runs." And: "Each sub-agent gets its own 200K token context window. That is 10 parallel research sessions without polluting your main conversation" -- but at corresponding token cost.

**Why it happens:**
The 4-agent parallel research pattern is architecturally correct (fresh context per agent) but economically aggressive. Users do not expect a single slash command to consume 100K+ tokens. Additionally, when a subagent fails partway, there is no checkpoint/resume mechanism -- the entire agent's work is lost.

**How to avoid:**
1. Document expected token costs per command in the README and `/forge:help` output. Example: "/forge:research: approximately 80-120K tokens (4 parallel agents)."
2. In `/forge:research`, check whether the user wants parallel (faster, more tokens) or sequential (slower, fewer tokens) execution. Default to sequential for safety.
3. Agent prompts must enforce the 2000-token output cap per research file. Verbose agents waste tokens.
4. If a subagent fails, its partial output should be committed before the failure so it is not lost. The orchestrator should detect which agents completed and allow re-running only the failed ones.
5. Consider using `model: haiku` for research subagents (cheaper) and `model: inherit` for compose/review subagents (need quality). The Claude Code subagent system supports per-agent model selection.

**Warning signs:**
- Users report "I ran out of tokens" or "Claude stopped responding" during `/forge:research`.
- Partial research files (only 2 of 4 exist after research command).
- User cost dashboard shows large spike for a single session.

**Phase to address:**
Phase 1 (Agents) -- agent definitions should specify model selection and output caps. Phase 5 (E2E Test) -- measure actual token consumption per command.

---

### Pitfall 5: Core/Runtime Boundary Violation -- Design Intelligence Leaks Into Runtime Files

**What goes wrong:**
A developer adding a new feature puts domain-specific logic (e.g., "fintech apps should use tabbed navigation") into a runtime-specific file like `runtimes/claude-code/commands/forge/compose.md` instead of the shared `core/workflows/compose-screen.md`. When OpenCode support is added later, this intelligence is missing. The OpenCode version produces inferior output, and nobody understands why because the workflows appear identical.

**Why it happens:**
The core/runtime boundary is an architectural rule, not an enforced constraint. When working on Claude Code commands, it is faster to add logic directly to the command file than to update the shared workflow and then reference it. The "thin command, heavy workflow" pattern requires discipline that erodes under delivery pressure.

**How to avoid:**
1. Establish a bright-line rule: runtime files (commands, agents, hooks) can ONLY contain (a) runtime-specific spawning syntax (Task(), agent()), (b) file path prefixes, (c) tool permissions. If it contains the word "design," "color," "font," "spacing," "vertical," or "pattern," it belongs in core/.
2. Add a CI/lint check that greps runtime files for design-vocabulary keywords. Any match is a build failure.
3. In the CONTRIBUTING guide, include examples of correct vs incorrect placement:
   - WRONG: `runtimes/claude-code/commands/forge/compose.md` says "For fintech, prefer tab navigation"
   - RIGHT: `core/workflows/compose-screen.md` says "Apply LOCKED decisions from DESIGN-RESEARCH.md" and the fintech vertical file contains the tab navigation guidance.
4. When building future runtime adapters, start by diffing the runtime files against each other. Any content difference beyond path prefixes and spawn syntax signals a boundary violation.

**Warning signs:**
- Claude Code produces better designs than OpenCode for the same vertical.
- A runtime command file exceeds 50 lines (commands should be thin wrappers).
- A developer says "I added the fix to the Claude Code command" instead of "I added the fix to the workflow."

**Phase to address:**
Phase 1 and ongoing. Every phase should include a boundary audit step. Phase 5 (E2E Test) should verify identical outputs across simulated runtimes.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcoding `.claude/` paths in workflow files instead of using `{FORGE_ROOT}` | Works immediately for v1.0 | Every new runtime requires editing every workflow file; defeats the core/adapter split | Never -- use resolved paths from install time |
| Skipping the post-install verification step | Faster install, simpler code | Silent failures when files are missing or paths unresolved; users blame Design Forge quality instead of installation | Never -- 50 lines of verification code prevents hours of debugging |
| Using `fs.writeFileSync` without checking existence | Simpler install code | Overwrites user customizations, loses backups | Only on first install of a brand-new project with no existing `.claude/` directory |
| Putting all vertical intelligence in one mega-file instead of per-vertical files | Fewer files to manage | Context budget blown when agent loads 5 verticals worth of data to use 1; also makes community contribution harder | Never -- the per-vertical file pattern is already designed correctly |
| Using `postinstall` npm script instead of bin entry point | Automatic execution on `npm install` | Breaks `npx` workflow (postinstall does not run for npx); confuses CI environments; known to cause recursion on Windows ([Issue #15964](https://github.com/npm/npm/issues/15964)) | Never -- the bin entry point with `npx` execution is the correct pattern |
| Embedding token values directly in COMPONENT-SPECS.md instead of referencing tokens.css variable names | Easier to read component specs | When tokens change, specs are stale; agents use the hardcoded values instead of the tokens | Never -- always reference `var(--token-name)` in specs |

## Integration Gotchas

Common mistakes when connecting Design Forge to external systems.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Claude Code CLAUDE.md injection | Appending the Design Forge snippet without checking for existing content, causing duplicates | Use sentinel markers (`<!-- DESIGN-FORGE-START -->` / `<!-- DESIGN-FORGE-END -->`). Check for markers before appending. Replace between markers on re-install. |
| Claude Code hooks registration | Adding hooks to `.claude/settings.json` by overwriting the file, destroying user's existing hooks | Read existing settings.json, parse as JSON, merge the `hooks` key (array concat, not replace), write back. Never overwrite the entire file. |
| Git integration (agent commits) | Agents commit without checking git status, committing unrelated staged files | Each agent should `git add` only the specific files it created, then commit. Never use `git add -A` or `git add .` in agent prompts. |
| npm registry | Publishing without `.npmignore` or `files` field, shipping `docs/`, `firebase-debug.log`, `.DS_Store`, `.planning/` | Use `"files"` field in package.json to whitelist: `["bin/", "core/", "runtimes/", "scripts/"]`. Test with `npm pack --dry-run` before publishing. |
| Node.js version compatibility | Using `fs.cpSync()` without checking Node version, failing on Node 14/16 early versions | `fs.cpSync()` was added in Node 16.7.0 and is stable as of Node 22+. Set `"engines": { "node": ">=16.7.0" }` in package.json. Implement a version check at the top of `bin/install.js` with a clear error message. |
| Claude Code settings.json | Writing hooks directly to `.claude/settings.json` which requires session restart to take effect | Per Claude Code docs: "hook settings are cached and changes don't take effect until session restart" ([Issue #22679](https://github.com/anthropics/claude-code/issues/22679)). Inform the user to restart their Claude Code session after installation. |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| PostToolUse hooks running on EVERY file edit | Each `/forge:compose` triggers dozens of file writes. 4 hooks x dozens of writes = hundreds of hook executions per screen. Known progressive duplication bug compounds this. | Use narrow matchers (`"matcher": "Edit\|Write"`) and filter by file extension in the hook script itself. Skip non-CSS/non-component files. Move heavy checks to async hooks. | At 3+ hooks active: noticeable 1-2s delay per file edit. At 5+ screens composed in one session: hooks may duplicate and run 10+ times per edit. |
| Loading full vertical reference file into every subagent | Vertical files (fintech.md = 226 lines) loaded by every research agent, every composer, every reviewer. 4 research agents = 4 copies of fintech.md in context. | Only load vertical reference in agents that need it (researcher, system generator). Composers should use DESIGN-RESEARCH.md (the synthesis) instead. Follow context-engine.md profiles exactly. | When vertical files grow beyond 300 lines or when composing 5+ screens in a session. Context waste compounds. |
| Orchestrator reading all SUMMARY.md files for "consistency check" | After composing 5 screens, the orchestrator reads 5 summary files to "check consistency" before spawning screen 6. That is 2500+ tokens of summaries in the orchestrator context. | Only load the 2-3 most recent summaries (as specified in compose-screen.md). The design system tokens.css IS the consistency mechanism, not cross-referencing summaries. | At 5+ screens composed. Orchestrator context approaches 50% from summaries alone. |
| Token showcase HTML including all tokens inline | Self-contained HTML that imports tokens.css AND inlines all token values for display. As the design system grows, this file balloons. | Generate the showcase HTML at display time with a script that reads tokens.css, not as a static file that must be kept in sync. The `scripts/token-counter.js` and `scripts/contrast-checker.js` pattern (runtime generation) is correct. | At 100+ design tokens. File exceeds 3000 tokens and becomes a context burden if loaded. |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Installer modifying files outside the project directory | A path traversal bug in `{FORGE_ROOT}` resolution could write files to `~/.claude/` (global config) or worse. npm packages should NEVER write outside `process.cwd()`. | Validate that all resolved paths start with `process.cwd()`. Use `path.resolve()` and check the result with `resolvedPath.startsWith(process.cwd())`. Reject any path that escapes the project root. |
| Shipping API keys or tokens in vertical reference files | If vertical files are community-contributed, a PR could embed API keys, tracking pixels, or prompt injection attacks in markdown content. | Review all community-contributed vertical files for non-design content. Establish a content schema: verticals should only contain design tokens, color values, font names, and pattern descriptions. Reject files with URLs, scripts, or code blocks that are not CSS. |
| Agent prompts containing executable code suggestions | If a malicious vertical file says "run this bash command to check contrast," the AI agent will execute it. Markdown content becomes executable when AI agents interpret it. | Agent definitions should restrict tool access. Research agents should NOT have Bash access. Only the composer and fixer need write access. Use `tools` field in agent frontmatter to enforce least privilege. |
| CLAUDE.md injection allowing prompt override | If Design Forge appends rules to CLAUDE.md and a user (or another tool) modifies the same CLAUDE.md, the rules could be altered to override Design Forge behavior. | Use sentinel markers so Design Forge can detect tampering. On each run, verify the content between markers matches the expected snippet. Warn the user if modifications are detected. |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Silent installation failures | User runs `npx design-forge@latest`, installer fails to copy 3 files due to permissions, exits with code 0. User runs `/forge:init` and gets cryptic "file not found" errors. | Print a clear summary on install: "Installed: 42 files. Commands: 10. Agents: 5. Config: injected." On ANY failure, exit with code 1 and print the specific file that failed. |
| No uninstall mechanism | User wants to remove Design Forge from their project. No `npx design-forge uninstall` command. They must manually delete `.claude/commands/forge/`, `.claude/get-design-forge/`, and edit CLAUDE.md. | Ship an `--uninstall` flag that reverses installation: removes copied files, removes the CLAUDE.md section between sentinel markers, restores backups if they exist. |
| Forcing sequential workflow when user knows what they want | User has existing brand colors and wants to go straight to `/forge:system`. But the state machine requires INITIALIZED -> RESEARCHED -> SYSTEM_GENERATED. User must run `/forge:research` even though they already know their design direction. | The `/forge:init --auto` mode addresses this partially. Consider a `--skip-research` flag or allowing `/forge:system` to run from INITIALIZED state with a warning: "No research data found. System will be generated from DESIGN-BRIEF.md only." |
| Opaque agent failures | A subagent fails silently. The orchestrator says "something went wrong" but does not explain what. The user re-runs the command, hitting rate limits again. | Orchestrator should check for specific failure artifacts: Did SUMMARY.md get created? Did a git commit happen? Report which step failed: "The composer agent completed but did not create a SUMMARY.md. This usually means it ran out of context. Try running /clear first." |
| Differentiation seed feels arbitrary to users | The "Personality: Corporate <-> Bold/rebellious" scale is meaningful to designers but meaningless to solo devs. They pick 5 for everything and get generic output. | Provide concrete examples with each axis: "Corporate = Stripe, JP Morgan. Bold = Cash App, Robinhood. Where does yours sit?" Use product names the user recognizes as anchors. |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Installer:** Works on macOS -- verify Windows path handling (backslashes, `.claude\` vs `.claude/`), `#!/usr/bin/env node` shebang handling via npm cmd shimmer, and `/tmp` execute permissions for npx ([Issue #5139](https://github.com/npm/cli/issues/5139))
- [ ] **CLAUDE.md injection:** Appends correctly -- verify it does not double-append on re-install, handles both `.claude/CLAUDE.md` and project-root `CLAUDE.md` locations, and does not break existing CLAUDE.md formatting
- [ ] **Agent definitions:** Agents have instructions -- verify they include explicit context-loading profiles (which files to read, which to NEVER read), output token budgets, and commit message formats
- [ ] **State machine:** Gate checks work -- verify STATE.md survives `/clear` (it should, since it is on disk), verify state transitions handle edge cases (user runs `/forge:compose` twice on same screen)
- [ ] **Vertical files:** Content exists -- verify token budgets are respected (each vertical < 2000 tokens when loaded), naming conventions match what workflows expect, and the vertical template format is followed exactly
- [ ] **Hooks:** Hooks fire correctly -- verify they do not fire on non-Design-Forge files (matcher specificity), do not progressively duplicate during sessions, and do not block the main coding workflow with latency
- [ ] **Token showcase:** HTML renders -- verify it loads fonts from Google Fonts CDN, handles dark mode, and works as a standalone file (no server required)
- [ ] **npm package:** Publishes cleanly -- verify with `npm pack --dry-run` that only intended files are included, `bin` field points to the correct entry, and `"engines"` field specifies minimum Node version

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Installer overwrote user files | LOW | Restore from `.backup` files if backup was implemented. If not, user must recover from git history (`git checkout HEAD -- .claude/CLAUDE.md`). Lesson: always implement backups. |
| `{FORGE_ROOT}` paths broken in installed files | MEDIUM | Re-run installer (`npx design-forge@latest`). If the installer itself has the bug, publish a patch version. Users cannot manually fix dozens of markdown files. |
| Context budget blown mid-workflow | LOW | Run `/clear`. STATE.md on disk preserves all progress. Re-run the last command. No data loss if agents commit their work before the context overflows. |
| Subagent failed partway through research | MEDIUM | Check which research files exist (01 through 04). Manually run `/forge:research` with a modified workflow that only spawns missing agents. If no partial-retry mechanism exists, delete all research files and re-run from scratch. |
| Core/runtime boundary violated | HIGH | Must audit all runtime files, extract design logic back to core workflows, and re-test. The longer the violation persists, the more runtime-specific behavior accumulates. Prevent rather than recover. |
| Vertical template drift (verticals diverge from fintech model) | MEDIUM | Diff each vertical against fintech.md structure. Missing sections are the drift. Create a vertical linter script that checks for required sections/headings. |
| Hooks slow down the coding experience | LOW | Disable hooks temporarily via `/hooks` toggle or `"disableAllHooks": true` in settings. Investigate which hook is slow. Move slow hooks to async execution. |
| npm publish includes sensitive/large files | LOW | Unpublish within 72 hours (npm policy). Fix `"files"` field in package.json. Republish with patch version bump. |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Installer overwrites user files | Phase 2 (Installer) | Run installer twice on same project. Second run should produce "0 files changed" if nothing updated. CLAUDE.md should not grow. |
| `{FORGE_ROOT}` path resolution | Phase 2 (Installer) | After install, `grep -r '{FORGE_ROOT}' .claude/` should return zero matches. All paths should be resolved. |
| Context budget exceeded | Phase 1 (Agents) | Run full workflow (init through review). After 5 screens, check orchestrator context with `/context`. Should be under 50%. |
| Subagent token costs | Phase 1 (Agents) + Phase 5 (E2E) | Run `/forge:research` and check `/cost`. Document expected range in help text. |
| Core/runtime boundary violation | Phase 1 (Agents) + Phase 3 (Verticals) | `wc -l runtimes/claude-code/commands/forge/*.md` -- no command file should exceed 50 lines. `grep -l 'color\|font\|spacing\|vertical' runtimes/` should return zero matches outside of path references. |
| Vertical template drift | Phase 3 (Vertical Expansion) | Diff each new vertical's heading structure against fintech.md. All required sections must be present. Run a heading-extraction script to compare. |
| Hooks performance degradation | Phase 4 (Hooks) | Compose 3 screens in a single session with all hooks active. No perceptible delay (< 500ms per hook execution). Check for hook duplication. |
| Silent installation failures | Phase 2 (Installer) | Test installer with (a) fresh project, (b) existing `.claude/` directory, (c) existing Design Forge install, (d) read-only directory (should fail loudly). |
| No uninstall mechanism | Phase 2 (Installer) | Run install, verify files exist, run `npx design-forge --uninstall`, verify files removed and CLAUDE.md cleaned. |
| npm package ships wrong files | Phase 2 (Installer) | Run `npm pack --dry-run` in CI. Assert the file list matches expected files. Fail if `.DS_Store`, `firebase-debug.log`, or `.planning/` appear. |

## Sources

- [Claude Code Hooks Documentation](https://code.claude.com/docs/en/hooks-guide) -- lifecycle events, performance considerations, progressive duplication bug -- HIGH confidence
- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents) -- Task() limitations, context management, model selection, token costs -- HIGH confidence
- [Claude Code Hook Duplication Bug (Issue #3523)](https://github.com/anthropics/claude-code/issues/3523) -- confirmed performance issue with hook accumulation -- HIGH confidence
- [Claude Code Hook Settings Cache (Issue #22679)](https://github.com/anthropics/claude-code/issues/22679) -- settings changes require session restart -- HIGH confidence
- [Node.js fs.cpSync Documentation](https://nodejs.org/api/fs.html) -- stable as of Node 22+, added in 16.7.0 -- HIGH confidence
- [npm/cli path resolution issues on Windows](https://github.com/npm/cli/issues/13789) -- Windows path separator problems -- HIGH confidence
- [npx /tmp execute permission bug (Issue #5139)](https://github.com/npm/cli/issues/5139) -- npx assumes /tmp is executable -- MEDIUM confidence
- [npm postinstall recursion on Windows (Issue #15964)](https://github.com/npm/npm/issues/15964) -- postinstall scripts break on Windows -- HIGH confidence
- [Design System Governance: Preventing Design Drift (UXPin)](https://www.uxpin.com/studio/blog/design-system-governance/) -- vertical/variant drift patterns -- MEDIUM confidence
- [The Problem(s) with Design Tokens (Andre Torgal, 2025)](https://andretorgal.com/posts/2025-01/the-problem-with-design-tokens) -- token management pitfalls -- MEDIUM confidence
- [Writing Cross-Platform Node.js (George Ornbo)](https://shapeshed.com/writing-cross-platform-node/) -- path.join, shebang handling, OS differences -- MEDIUM confidence
- [Claude Code Subagents Token Cost (DEV Community)](https://dev.to/onlineeric/claude-code-sub-agents-burn-out-your-tokens-4cd8) -- real-world token consumption observations -- LOW confidence
- [Composio: Why AI Agent Pilots Fail in Production](https://composio.dev/blog/why-ai-agent-pilots-fail-2026-integration-roadmap) -- AI orchestration failure patterns -- MEDIUM confidence
- Design Forge project spec (`GSD-PROJECT-SPEC.md`) -- architecture, constraints, identified risks -- HIGH confidence (primary source)
- Design Forge context engine (`core/references/context-engine.md`) -- context budgets, anti-patterns -- HIGH confidence (primary source)
- Design Forge runtime adapters (`core/references/runtime-adapters.md`) -- path resolution, install mapping -- HIGH confidence (primary source)

---
*Pitfalls research for: npm-distributed AI design engineering CLI tool*
*Researched: 2026-03-01*
