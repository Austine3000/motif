# Project Research Summary

**Project:** Motif v1.3 -- Global Install, Context Resilience, New Verticals
**Domain:** CLI tooling for AI-assisted design engineering (npm package distribution, LLM state persistence, domain-specific design intelligence)
**Researched:** 2026-03-09
**Confidence:** HIGH

## Executive Summary

Motif v1.3 delivers three capabilities that address distinct adoption blockers: global CLI install (`npm install -g motif-design`), context-resilient state recovery after `/clear` and compaction, and four new vertical design references (Social, Education, Marketplace, DevTools). The research confirms that the existing zero-dependency, markdown-first architecture handles all three without fundamental changes. Global install works today mechanically -- npm's `bin` field already symlinks correctly -- and requires only project-root detection, a `--version` flag, and removal of the self-referencing dependency bug in `package.json`. New verticals are pure data files that slot into the existing template-driven loading system with zero code changes.

The hardest problem is context resilience. The state machine relies on an AI agent voluntarily reading STATE.md, which breaks after `/clear` because the agent starts fresh with no memory that STATE.md exists. The recommended approach avoids the broken SessionStart compact/clear hooks (confirmed bug, stdout silently dropped, issue #15174) and instead layers three reliable mechanisms: a CLAUDE.md recovery directive (always re-read after context loss), STATE.md as the durable state file, and an enhanced statusLine hook that displays current phase on every turn. Artifact-based state inference provides defense-in-depth when STATE.md is missing, but must be conservative -- inferring minimum phase, not maximum -- to avoid phantom progress from partial or copied files.

The primary risks are: (1) global install from subdirectories silently installing to the wrong location (no project-root detection exists today), (2) concurrent JSON file writes corrupting manifests (the same class of bug that hit Claude Code's own `.claude.json`), and (3) version downgrade when a stale global install overwrites newer per-project files. All three have straightforward mitigations. The new verticals carry the least risk -- they are additive data files -- but must be validated against the existing template structure to prevent drift that would cause inconsistent design system generation.

## Key Findings

### Recommended Stack

No new dependencies. The zero-dependency constraint is maintained across all three capabilities. The entire stack remains Node.js built-ins: `node:fs`, `node:path`, `node:util` (parseArgs, styleText), and `node:crypto` (createHash). The `--version` flag is the only addition to the CLI surface.

**Core technologies (unchanged):**
- **Node.js >=22.0.0**: Runtime for installer, hooks, and scripts -- no change
- **node:util.parseArgs**: CLI flag parsing -- add `--version` flag only
- **Markdown files**: Workflows, agents, verticals, and state are all `.md` consumed by LLMs -- this is the architecture, not a limitation
- **CSS custom properties**: Design tokens via `tokens.css` -- no change
- **Claude Code hooks**: PostToolUse validation, statusLine monitoring -- enhance statusLine to show phase

**Critical fix:** Remove `"motif-design": "^0.1.0"` self-referencing dependency from `package.json`. This is a bug that causes npm to nest an old version of the package inside itself during global install.

### Expected Features

**Must have (table stakes):**
- `npm install -g motif-design` with `motif init` per-project -- the standard global CLI pattern
- Dual-mode support (both `npx` and global install must work)
- Auto-read STATE.md on every `/motif:*` command after context loss
- Artifact-based state inference as fallback when STATE.md is missing
- YAML frontmatter in STATE.md for reliable machine parsing
- Complete vertical reference files (~400-500 lines each) for Social, Education, Marketplace, DevTools with exact hex values, font names, component XML specs, and icon vocabulary

**Should have (differentiators):**
- `motif status` and `motif doctor` commands for installation diagnostics
- State continuity display in statusLine (`Motif: COMPOSING | 3/5 screens | ctx 42%`)
- Checkpoint commits with phase tags for git-based state recovery
- Richer decision logging (WHAT + WHY + SOURCE) for cross-session memory
- Vertical-specific empty/error/loading state patterns

**Defer (v2+):**
- Cross-vertical composition (blending two verticals) -- HIGH complexity, needs dedicated research
- Vertical migration path (switching vertical mid-project) -- MEDIUM complexity, defer to v0.4+
- Plugin/extension system -- premature before v1.0 stability
- Global config file (`~/.motifrc`) -- per-project config is correct, global preferences create cookie-cutter designs

### Architecture Approach

The architecture extends the existing core/runtime split without restructuring. Global install copies files to `~/.motif/` and `~/.claude/commands/motif/` instead of per-project directories. The key pattern is dual-mode path resolution: the installer replaces `{MOTIF_ROOT}` with either a relative project path (local) or an absolute home-directory path (global) at install time. Workflows never know the difference. State recovery uses filesystem-as-state: deterministic mapping from artifact presence to minimum phase. CLAUDE.md injection remains per-project regardless of install mode.

**Major components:**
1. **Global Installer Mode** -- Adds `--global` flag to `bin/install.js`, copies to `~/.motif/` and `~/.claude/`, resolves `{MOTIF_ROOT}` to absolute paths
2. **Context-Resilient State Reader** -- CLAUDE.md recovery directive + STATE.md with YAML frontmatter + enhanced statusLine + artifact-based inference fallback
3. **Path Resolver** -- `resolveMotifRoot()` function that returns different base paths per install mode, transparent to downstream workflows
4. **4 New Verticals** -- Pure markdown data files in `core/references/verticals/`, following existing template exactly

### Critical Pitfalls

1. **Global install from subdirectories installs to wrong location (CRITICAL)** -- `process.cwd()` is trusted unconditionally. Add project-root detection: walk up looking for `.git/`, `package.json`, or `.claude/`. Fail loudly if no root found.

2. **STATE.md not read after context clear (CRITICAL)** -- Gate checks are advisory markdown, not enforced scripts. Add CLAUDE.md recovery directive as mandatory first action, enhance statusLine to show phase, and add context restoration preamble to every command file.

3. **Manifest corruption from concurrent writes (CRITICAL)** -- `writeFileSync` is not atomic. Use write-to-temp-then-rename pattern for all JSON state files. Add lockfile guard.

4. **Silent version downgrade via stale global install (CRITICAL)** -- No semver comparison exists. Add downgrade detection that refuses to proceed without `--force`.

5. **New verticals drift from template structure (MODERATE)** -- Build a `validate-vertical.js` script before authoring verticals. Run it against all 8 files to ensure consistent section headings, token naming, palette tables, and component XML format.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation Fixes and New Verticals
**Rationale:** Zero dependencies on other work. Verticals are pure data files that can be authored in parallel. Foundation fixes (self-dependency removal, atomic writes) are prerequisites for everything else.
**Delivers:** 4 new vertical reference files (social, education, marketplace, devtools), self-dependency bug fix, atomic write utility, vertical validation script
**Addresses:** Table-stakes vertical coverage, package.json bug, concurrent write protection
**Avoids:** Vertical structural drift (Pitfall 6) by building validator first; manifest corruption (Pitfall 3) by implementing atomic writes early

### Phase 2: Context-Resilient State Machine
**Rationale:** Fixes a current user pain point that affects every session. Must be done before global install because global users will hit the same `/clear` problem, and state resilience should be validated in the simpler local-install context first.
**Delivers:** CLAUDE.md recovery directive, YAML frontmatter in STATE.md, auto-read preamble in all commands, enhanced statusLine with phase display, artifact-based state inference fallback
**Addresses:** Auto-read STATE.md, artifact inference, context restoration prompt, state continuity in statusLine
**Avoids:** STATE.md not read after clear (Pitfall 2), phantom progress from naive inference (Pitfall 11), state file git conflicts (Pitfall 13)

### Phase 3: Global CLI Install
**Rationale:** Most complex change. Touches installer, manifest, hooks, and path resolution. Benefits from having all 8 verticals available for testing and state resilience in place for edge case recovery.
**Delivers:** `npm install -g motif-design` support, `motif init`/`motif status`/`motif update` commands, project-root detection, downgrade protection, stale file cleanup
**Addresses:** Global install UX, dual-mode support, `--version` flag, help text updates
**Avoids:** Wrong install directory (Pitfall 1), silent downgrade (Pitfall 4), stale files after update (Pitfall 7), Windows hook path failures (Pitfall 5)

### Phase 4: Polish and Differentiators
**Rationale:** Nice-to-haves that build on the foundation. Only worth doing after core functionality is stable.
**Delivers:** `motif doctor` diagnostics, `motif list` verticals, checkpoint commits with phase tags, richer decision logging, vertical-specific empty/error states
**Addresses:** Differentiator features from FEATURES.md
**Avoids:** Scope creep into deferred features (cross-vertical composition, plugin system)

### Phase Ordering Rationale

- **Verticals first** because they are zero-risk additive data with no dependencies on other work. They also provide test material for the later phases.
- **State resilience before global install** because state recovery must work in the simpler local-install context before adding the complexity of global path resolution. Global install introduces new edge cases for state (different `{MOTIF_ROOT}` paths, stale global versions) that compound with state resilience bugs.
- **Global install last among core features** because it is the highest-complexity change and depends on both verticals (for complete testing) and state resilience (for robust recovery in global-install edge cases).
- **Polish deferred** because differentiator features do not block adoption. The three core capabilities (verticals, state resilience, global install) are the milestone.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 2 (Context Resilience):** The CLAUDE.md recovery directive is well-understood, but the exact YAML frontmatter schema for STATE.md needs design. The artifact-inference logic needs explicit rules for edge cases (partial files, files from other projects). Needs phase research.
- **Phase 3 (Global Install):** Windows compatibility for hook paths is flagged but not deeply tested. The `$HOME` variable behavior in Claude Code hook commands on Windows needs verification. The dual-hook-firing risk (global + local hooks both executing) needs testing. Needs phase research for Windows support specifically.

Phases with standard patterns (skip research-phase):
- **Phase 1 (Verticals + Fixes):** Verticals follow an established template with 4 existing examples. The validation script and atomic write pattern are well-documented Node.js patterns. Standard implementation.
- **Phase 4 (Polish):** All differentiator features are incremental additions to existing infrastructure. No architectural decisions needed.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified against npm docs, Claude Code docs, and existing codebase. Zero new dependencies confirmed. Self-referencing dependency bug identified and fix verified. |
| Features | MEDIUM-HIGH | Feature landscape well-mapped across all three domains. Vertical design patterns sourced from multiple references. Some typography/spacing values are opinionated rather than empirical. |
| Architecture | HIGH | Dual-mode path resolution, filesystem-as-state, and hook mechanisms verified against official Claude Code documentation. Global command/hook scoping and array merging behavior confirmed. |
| Pitfalls | HIGH | Critical pitfalls identified from deep codebase analysis (install.js line-level review) and real-world bug reports (Claude Code JSON corruption issues #29036, #29153). Integration gotchas between the three features explicitly mapped. |

**Overall confidence:** HIGH

### Gaps to Address

- **SessionStart hook bug timeline:** The compact/clear hook stdout injection bug (#15174, #13650) is confirmed broken as of March 2026. If Claude Code fixes this, the context resilience approach could be simplified. Monitor the upstream issue during implementation.
- **Windows hook compatibility:** Hook commands using `$CLAUDE_PROJECT_DIR` and `$HOME` are verified on Unix but not tested on Windows. Global install makes Windows support more likely. Needs explicit testing before Phase 3 ships.
- **Vertical token budgets:** Existing verticals (ecommerce, fintech, health, saas) have not been audited for token count. New verticals should target the same size, but if existing ones exceed the 3,000-token budget from context-engine.md, all 8 need trimming. Run `token-counter.js` against existing verticals during Phase 1.
- **Cross-vertical loading prevention:** The context engine does not explicitly prevent loading multiple verticals for ambiguous descriptions ("educational marketplace"). The init flow must enforce single-vertical selection, but this guard is not yet implemented in the detection logic.
- **Global + local hook deduplication:** When both global and local Motif hooks exist, Claude Code merges arrays by concatenation. The deduplication logic in `injectHookSettings()` handles this for project-level, but the interaction with global-level hooks needs testing to confirm hooks do not fire twice.

## Sources

### Primary (HIGH confidence)
- [npm package.json bin field](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) -- global install mechanics, bin symlink behavior
- [Claude Code Settings documentation](https://code.claude.com/docs/en/settings) -- settings scopes, hook configuration, array merging, CLAUDE.md reload behavior
- [Claude Code Hooks reference](https://code.claude.com/docs/en/hooks) -- hook types, environment variables, statusLine behavior
- [Claude Code Slash Commands](https://code.claude.com/docs/en/slash-commands) -- global vs project command scope, discovery rules, precedence
- Existing Motif codebase: `bin/install.js`, `state-machine.md`, `context-engine.md`, `VERTICAL-TEMPLATE.md`, `package.json`, `.motif-manifest.json` -- reviewed 2026-03-09

### Secondary (MEDIUM confidence)
- [SessionStart hook bug #15174](https://github.com/anthropics/claude-code/issues/15174) -- stdout silently dropped after compaction
- [Claude Code JSON corruption #29036, #29153](https://github.com/anthropics/claude-code/issues/29036) -- concurrent write corruption pattern
- [Evil Martians: Developer tool design](https://evilmartians.com/chronicles/devs-in-mind-how-to-design-interfaces-for-developer-tools) -- DevTools vertical patterns
- [Node.js CLI best practices (lirantal)](https://github.com/lirantal/nodejs-cli-apps-best-practices) -- CLI state persistence patterns
- Multiple vertical design sources: Rigby marketplace UX, Viartisan eLearning, Riseapps LMS, BricxLabs chat UI, Tech-stack social media guide

### Tertiary (LOW confidence)
- [SessionStart stdout dropped #13650](https://github.com/anthropics/claude-code/issues/13650) -- referenced but not directly verified
- Windows-specific npm behavior for global installs -- inferred from npm docs, not tested
- [npm CLI issue #5189](https://github.com/npm/cli/issues/5189) -- Windows junctions vs symlinks, relevant to global install but not validated

---
*Research completed: 2026-03-09*
*Ready for roadmap: yes*
