# Domain Pitfalls: Global Install, Context-Resilient State, and New Verticals

**Domain:** Adding global CLI install, context-resilient state machine, and 4 new verticals to existing per-project npm design tool (Motif)
**Researched:** 2026-03-09
**Confidence:** HIGH (based on deep codebase analysis of install.js, state-machine.md, context-engine.md, vertical files, and verified npm/Node.js ecosystem patterns)

---

## Critical Pitfalls

Mistakes that cause broken installations, data loss, or silent corruption.

---

### Pitfall 1: Global Install Breaks `process.cwd()` Assumptions

**What goes wrong:** The current installer (`bin/install.js`) uses `process.cwd()` as the target project directory (line 62: `const cwd = process.cwd()`). With npx, users naturally run it from the project root. With a globally installed `motif` command, users invoke it from anywhere -- subdirectories, home directory, or unrelated paths. Running `motif` from `src/components/` installs all files into `src/components/.claude/` instead of the project root. No error is thrown. The installation silently succeeds in the wrong location.

**Why it happens:** The npx workflow masks this problem because npx users almost always `cd` to the project root before running `npx motif-design@latest`. Global install removes that implicit constraint. The installer has zero project-root detection -- it trusts `process.cwd()` unconditionally. There is no check for `package.json`, `.git`, or any other project root signal.

**Consequences:**
- `.claude/` directory created in a subdirectory, not the project root
- CLAUDE.md created in the wrong location (ignored by Claude Code)
- `.motif-manifest.json` written to the wrong directory (future upgrades fail to find it)
- Hooks reference paths relative to the wrong root, causing silent failures
- User runs `motif` again from the correct directory, creating a second parallel installation

**Prevention:**
- Add project root detection: walk up from `process.cwd()` looking for `.git/`, `package.json`, or `.claude/` directory (in that priority order)
- If no project root found within 10 parent directories, fail with: "Could not find project root. Run `motif` from your project directory, or use `--project-dir <path>`."
- Add `--project-dir` flag for explicit override
- Print the resolved project directory at the start of installation: "Installing to: /Users/user/my-project"
- Add a confirmation prompt when `process.cwd()` differs from detected root: "You are in src/components/ but the project root appears to be /Users/user/my-project. Install there? [Y/n]"

**Detection:** Files appearing in unexpected directories. `motif-context-monitor.js` (statusLine hook) failing because STATE.md is not at the expected path. Multiple `.motif-manifest.json` files in the project tree.

**Phase:** Global Install -- must be solved before shipping. This is the first code change.

---

### Pitfall 2: STATE.md Not Read After Context Window Clear

**What goes wrong:** Motif's state machine stores workflow state in `.planning/design/STATE.md`, a markdown file the AI reads to determine the current phase. When the user clears their AI context (new conversation, `/clear`, context limit reached, machine restart), the AI loses all memory of what phase the project is in. STATE.md exists on disk but the AI does not automatically read it. The CLAUDE.md snippet says workflows should check state, but after a context clear the AI may not process CLAUDE.md instructions strictly -- it sees the user's command and starts executing without checking prerequisites.

**Why it happens:** The state machine's gate checks are documented in `state-machine.md` as rules for the AI to follow, but they are ADVISORY, not ENFORCED. There is no programmatic check -- no script that runs before a command and returns pass/fail. The AI must voluntarily read STATE.md, parse a markdown table, determine the current phase, compare it against the gate check rules, and decide whether to proceed. After a context clear, this chain breaks at the first link: the AI does not voluntarily read STATE.md because it has no memory that STATE.md exists or matters.

**Consequences:**
- Commands run out of order (compose before system generation)
- Work duplicated (re-running research that was already completed)
- AI creates a new STATE.md over the existing one (resetting to INITIALIZED)
- Screens composed without referencing design system tokens
- User gets inconsistent results depending on whether they cleared context mid-workflow

**Prevention:**
- Create a machine-readable state file: `.motif-state.json` with structured fields:
  ```json
  {
    "phase": "SYSTEM_GENERATED",
    "vertical": "saas",
    "screens": [{"name": "dashboard", "status": "composed"}],
    "lastCommand": "system",
    "timestamp": "2026-03-09T10:00:00Z"
  }
  ```
- Create a `state-check.js` script that validates prerequisites for any command:
  ```
  node .claude/get-motif/scripts/state-check.js compose
  # Output: PASS (phase: SYSTEM_GENERATED, tokens.css exists, COMPONENT-SPECS.md exists)
  # or: FAIL (phase: INITIALIZED, missing: DESIGN-RESEARCH.md. Run /motif:research first.)
  ```
- Make the existing `motif-context-monitor.js` statusLine hook output the current phase prominently (it already exists but may not report phase)
- Add the state check as a PreToolUse hook or as the first step in every command's markdown file, using a script call rather than AI-parsed markdown rules

**Detection:** AI attempting to run `/motif:init` on an already-initialized project. Duplicate STATE.md files. STATE.md showing an earlier phase than the artifacts on disk suggest.

**Phase:** Context Resilience -- the core problem this milestone exists to solve.

---

### Pitfall 3: .motif-manifest.json Corruption from Concurrent Writes

**What goes wrong:** Two terminal sessions (or two Claude Code instances) run Motif commands simultaneously against the same project. Both read `.motif-manifest.json`, both modify it, and the last write wins -- destroying the first write's changes. This is the exact bug documented in Claude Code's own `.claude.json` corruption (GitHub issues #29036 and #29153), where running multiple Claude Code windows simultaneously causes repeated config file corruption.

**Why it happens:** The current `writeManifest()` function (install.js line 360-401) performs a plain `fs.writeFileSync()` with no locking, no atomic write, no conflict detection. `writeFileSync` is NOT atomic -- it truncates the file then writes new content. A concurrent read during the truncation phase gets empty or partial content. `JSON.parse` on partial content throws, and the installer's catch block (line 714-717) treats corrupted manifest as `null` (fresh install), triggering a full re-install that may overwrite user-modified files.

**Consequences:**
- Manifest data loss (file list, version, hashes gone)
- Next install treats project as fresh, overwriting user-modified files without backup (since the manifest that tracks modifications is destroyed)
- `.motif-state.json` (new state file) will have the same vulnerability if written the same way
- STATE.md concurrent writes produce garbled markdown

**Prevention:**
- Atomic writes for all JSON state files: write to `filename.tmp` then `fs.renameSync()` over the original (`rename` is atomic on POSIX and Windows NTFS)
- Add a lockfile guard: create `.motif-manifest.lock` before writing, remove after. If lock exists and is less than 60 seconds old, wait 1 second and retry (3 attempts max)
- Validate JSON integrity after write: read back and `JSON.parse` to confirm
- Apply the same pattern to `.motif-state.json` from day one

**Detection:** `JSON.parse` errors in install.js or state-check.js. Manifest showing fewer files than expected. Unexpected "fresh install" behavior on an established project.

**Phase:** Context Resilience -- same phase as state resilience, since both manifest and state files need atomic write protection.

---

### Pitfall 4: Global and Local Versions Diverge Silently (Downgrade on Re-install)

**What goes wrong:** User installs `motif-design@0.3.0` globally. Later, they (or a teammate) run `npx motif-design@latest` (now 0.4.0) on the same project. The project files are now at 0.4.0. The first user continues using the globally installed 0.3.0. When they run `motif` (which invokes the global 0.3.0), it copies 0.3.0 source files over the 0.4.0 files, silently DOWNGRADING the project. The installer prints "Re-installing Motif v0.3.0" (line 728-729) but does not warn that this is a downgrade.

**Why it happens:** Global npm packages do not auto-update. The installer compares `existingManifest.version` against the running package version (lines 721-733) but only distinguishes "upgrade" vs "re-install" based on whether versions differ. It never checks whether the running version is OLDER than the manifest version. There is no downgrade detection.

**Consequences:**
- Design system files silently reverted to older versions
- New vertical files (added in 0.4.0) deleted by 0.3.0's file list (if 0.3.0 has stale file cleanup)
- New workflows, hooks, or agent files overwritten with older versions
- User gets different behavior depending on which install method they use
- Team members get different results for the same project

**Prevention:**
- Add semver comparison in installer: if `existingManifest.version` is NEWER than the running package version, print a warning and require `--force` to proceed:
  ```
  WARNING: This project was last installed with Motif v0.4.0, but you are running v0.3.0.
  This would DOWNGRADE the installation. Run `npm update -g motif-design` to update,
  or use `motif --force` to downgrade intentionally.
  ```
- Run `check-version.js` on every `motif` invocation (not just `/motif:progress`) to alert about available updates
- Document clearly that npx is the recommended method; global install is a convenience shortcut that requires manual updates

**Detection:** `check-version.js` already exists but is only invoked by the `/motif:progress` command. Should run during every install/re-install.

**Phase:** Global Install -- must be implemented before shipping global install.

---

## Moderate Pitfalls

---

### Pitfall 5: Windows PATH and Shell Differences Break Hook Commands

**What goes wrong:** Hook commands in `.claude/settings.json` use Unix-style environment variables: `node "$CLAUDE_PROJECT_DIR"/.claude/get-motif/hooks/motif-token-check.js`. On macOS/Linux, this works because shells expand `$CLAUDE_PROJECT_DIR`. On Windows with cmd.exe, environment variables use `%CLAUDE_PROJECT_DIR%` syntax. The `$` syntax is silently ignored, causing the path to resolve incorrectly. The hooks fail silently (no error shown to user, just no enforcement).

**Why it happens:** The hook injection code (install.js lines 316-322) hardcodes Unix shell syntax. npm global installs on Windows create `.cmd` shim files that run in cmd.exe by default. Claude Code on Windows may invoke hooks through different shell contexts depending on configuration. The existing per-project npx install has the same potential issue, but global install makes Windows usage more likely (global install is the more "permanent" workflow that Windows developers expect).

**Consequences:**
- Token checks, font checks, and ARIA checks silently disabled on Windows
- Context monitor statusLine shows nothing (or errors)
- State check hooks (new in this milestone) fail, undermining the entire context resilience system
- Windows users get a degraded experience with no indication anything is wrong

**Prevention:**
- Test all hook commands on Windows (PowerShell and cmd.exe) before release
- Use cross-platform path construction in hooks: detect `process.platform` and emit appropriate variable syntax, or use Node.js to resolve paths rather than shell expansion
- Consider requiring PowerShell on Windows (Claude Code likely uses PowerShell already -- verify)
- Add a post-install verification step that actually runs each hook command and checks for non-zero exit

**Phase:** Global Install -- must be tested before release.

---

### Pitfall 6: New Verticals Drift from Existing Vertical Structure

**What goes wrong:** The 4 existing verticals (ecommerce, fintech, health, saas) follow a specific structure defined in `VERTICAL-TEMPLATE.md` -- a 145-line template with exact section headings, table formats, palette structures, component spec XML format, and spacing value formats. When authoring 4 new verticals (Social, Education, Marketplace, DevTools), the new files gradually drift from this structure: missing sections, different token naming, inconsistent palette table columns, different component spec XML attributes, or using different heading levels.

**Why it happens:** Each vertical file is 400-500 lines of highly specific content (hex values, component specs, spacing values, accessibility rules). Manual authoring without automated validation inevitably introduces inconsistencies. The template exists as a reference but there is no runtime or CI check that a vertical file conforms to it. Additionally, each new vertical is likely authored in a separate session, and the AI may not load the template or existing verticals for cross-reference.

**Consequences:**
- System architect agent produces inconsistent design systems depending on which vertical is loaded
- Token names in one vertical (`primary-500`) don't match another (`brand-primary`), causing the architect to reference nonexistent tokens
- Component specs use different XML structures, causing the screen composer to misinterpret specs
- Palette tables have different column counts, so AI parsing extracts wrong values
- Users perceive quality as inconsistent between verticals

**Prevention:**
- Create a `validate-vertical.js` script that checks:
  - All required sections from VERTICAL-TEMPLATE.md are present (using heading matching)
  - All token names match the standard set (primary-50 through primary-900, surface-*, text-*, semantic colors)
  - All palettes have both Light Mode and Dark Mode columns
  - All component specs use valid XML structure with required attributes (name, category)
  - Contrast ratios are documented for text-primary and text-secondary
  - File is between 350-600 lines (not too sparse, not bloated)
- Run the validator as part of the build/CI and as a pre-publish check
- Author new verticals one at a time, validate, then proceed -- not all 4 simultaneously
- When authoring each new vertical, explicitly load 1-2 existing verticals as structural references

**Detection:** `validate-vertical.js` failures. System architect referencing token names not found in the vertical. Missing sections when the architect tries to read spacing or component specs.

**Phase:** New Verticals -- validation script should be built BEFORE writing the vertical files.

---

### Pitfall 7: Stale Files Persist After Global Package Update

**What goes wrong:** User has `motif-design@0.3.0` globally installed, which installed files including a workflow file like `.claude/get-motif/workflows/legacy-flow.md`. They update to `motif-design@0.4.0` which removes or renames that file. Running `motif` again copies new files but does NOT remove files that were deleted from the package. The stale `legacy-flow.md` remains in the project, and the AI may read and follow it (it is in the `.claude/get-motif/` directory that AI agents load from).

**Why it happens:** The installer is additive only -- `walkAndCopy` (install.js lines 118-188) adds and overwrites files but never deletes. The manifest tracks what was installed, but the upgrade logic does not diff the old manifest file list against the new package contents to detect removals.

**Consequences:**
- Stale workflow files cause the AI to follow outdated instructions
- Stale vertical files (if a vertical is renamed or restructured) cause the system architect to load incorrect patterns
- Stale hook scripts may conflict with new hook scripts
- The project accumulates cruft over multiple upgrades

**Prevention:**
- During upgrade, compare existing manifest file list against the new package's file list. Files in old manifest but NOT in new package should be flagged:
  ```
  The following files from v0.3.0 are no longer in v0.4.0:
    .claude/get-motif/workflows/legacy-flow.md
    .claude/get-motif/references/verticals/old-vertical.md
  Remove them? [Y/n] (or use motif --clean to auto-remove)
  ```
- Add a `--clean` flag that removes files no longer in the current package version
- At minimum, print a warning about orphaned files so the user can decide

**Phase:** Global Install -- stale file cleanup is a basic upgrade hygiene requirement.

---

### Pitfall 8: Context Budget Explosion with 8 Verticals

**What goes wrong:** The context engine loads the vertical file for the detected project type. Each vertical is ~400-500 lines. The context-engine.md budget table allocates a general 2,000 tokens per research file, but vertical files are not explicitly budgeted. Examining the existing `ecommerce.md` (which has detailed palettes, component specs, interaction patterns, and accessibility rules), it likely exceeds 3,000 tokens. With 8 verticals, the system is fine IF only one loads at a time. But edge cases arise:
- A project described as "educational marketplace" triggers loading of both `education.md` and `marketplace.md`
- The system architect loads the vertical file AND all 4 research files, exceeding the ~15,000 token subagent budget
- Multi-vertical loading is not explicitly prevented in the context engine profiles

**Prevention:**
- Enforce single-vertical selection in the init flow: one project = one primary vertical
- Audit existing vertical file sizes with `token-counter.js` and establish a hard budget (3,000 tokens max per vertical)
- If existing verticals exceed the budget, trim them (remove redundant palette options, condense component specs)
- Add an explicit guard in context engine profiles: `<load_exactly_one>` directive for verticals
- If multi-vertical support is desired later, create a "vertical blender" that extracts only the relevant sections from each, producing a merged file under budget

**Phase:** New Verticals -- audit existing file sizes before adding more.

---

### Pitfall 9: Self-Dependency in package.json Causes npm Warnings

**What goes wrong:** The current `package.json` lists `"motif-design": "^0.1.0"` as a dependency of itself. This circular dependency causes npm warnings during install, unexpected `node_modules` nesting (npm may install an older version of the package inside its own `node_modules`), and confusing behavior during global install where npm tries to resolve the self-reference.

**Why it happens:** Likely a leftover from development or testing. The package is designed as zero-dependency (`"description"` says "zero deps"), but the dependencies field contradicts this.

**Consequences:**
- `npm install -g motif-design` downloads and nests an older version of itself
- Package size increases unnecessarily
- npm audit may flag circular dependency
- Confusing for contributors examining the package

**Prevention:**
- Remove the self-dependency from package.json before publishing the global install version
- Verify with `npm pack --dry-run` that the published package contains only the intended files
- Add a CI check that `dependencies` is empty (or absent) in package.json

**Phase:** Global Install -- must be fixed before publishing. Trivial fix, high impact.

---

## Minor Pitfalls

---

### Pitfall 10: Vertical File Naming Convention Ambiguity

**What goes wrong:** Existing verticals use lowercase single-word names: `ecommerce.md`, `fintech.md`, `health.md`, `saas.md`. New verticals include potentially multi-word names: "DevTools" could be `devtools.md`, `dev-tools.md`, or `dev_tools.md`. The vertical detection logic (in init and research commands) uses string matching on the vertical name to load the corresponding file. If the naming convention is not locked down, the file path construction fails silently (file not found -> vertical not loaded -> system architect works without domain intelligence).

**Prevention:**
- Define naming convention: lowercase, no hyphens, no underscores. Names: `devtools.md`, `social.md`, `education.md`, `marketplace.md`
- Add a vertical registry (array constant) in the context engine or a shared constants file listing all valid vertical identifiers
- The init flow should present verticals from this registry, not accept freeform input
- Validate at install time that all vertical files in the package match the registry

**Phase:** New Verticals -- decide convention before creating files.

---

### Pitfall 11: State Recovery Creates Phantom Progress via Filesystem Inference

**What goes wrong:** When building context-resilient state recovery, the natural approach is to infer state from filesystem artifacts: "tokens.css exists, so we must be in SYSTEM_GENERATED phase." But a user might have manually created tokens.css, copied it from another project, or have a partial file from a failed generation. The state recovery incorrectly advances the phase, and the AI skips prerequisite steps (like research) because it believes they were already completed.

**Why it happens:** Filesystem inference feels robust because it checks "real" artifacts. But it confuses "file exists" with "step completed successfully." A tokens.css file created by a crashed system generation is technically present but may be incomplete or invalid. Research files from a previous project copied into the directory trigger false RESEARCHED state.

**Prevention:**
- State recovery should trust the explicit state file (`.motif-state.json`) as the primary source of truth
- Filesystem checks should only serve as VALIDATION ("state says SYSTEM_GENERATED, and tokens.css exists -- confirmed") not as DISCOVERY ("tokens.css exists, so state must be SYSTEM_GENERATED")
- If state file is missing but artifacts exist, present findings to the user and ASK rather than auto-advancing: "I found tokens.css and COMPONENT-SPECS.md but no state file. It looks like the design system was already generated. Should I set the phase to SYSTEM_GENERATED? [Y/n]"
- Include a checksum or generation timestamp in `.motif-state.json` that can be validated against the actual file

**Phase:** Context Resilience -- design the recovery hierarchy carefully.

---

### Pitfall 12: Hook Paths Assume Per-Project File Layout

**What goes wrong:** Hook commands in `.claude/settings.json` reference files at `"$CLAUDE_PROJECT_DIR"/.claude/get-motif/hooks/...`. This works because both npx and global install copy files into the project. However, a future optimization might try to reference hooks from the global install location (avoiding file duplication across projects). This would fundamentally break the path model and require different hook command syntax per install method.

**Prevention:**
- Keep the current architecture: global install copies files to the project, identical to npx install. The `motif` command is just a convenience entry point, not a different file layout.
- Document this decision explicitly: "Global install does NOT change where files are stored. Files are always project-local. The global `motif` command is equivalent to `npx motif-design@latest`."
- Resist the temptation to add "run from global" mode -- it introduces a completely different file resolution model and breaks the hook path contract.

**Phase:** Global Install -- architectural decision to document, not code to write.

---

### Pitfall 13: New State File (.motif-state.json) Not Added to .gitignore Guidance

**What goes wrong:** The new `.motif-state.json` file contains ephemeral session state (current phase, last command, timestamp). If committed to git, it creates merge conflicts when teammates are at different workflow phases. One person is at COMPOSING, another at RESEARCHED -- git cannot merge these. Alternatively, if NOT committed, a teammate cloning the repo has no state file and the recovery mechanism cannot determine where the project is.

**Prevention:**
- Decide and document: `.motif-state.json` should be GITIGNORED (it is session-local state, like `.DS_Store`)
- The recovery mechanism should reconstruct state from committed artifacts (STATE.md, which IS committed) when `.motif-state.json` is missing
- STATE.md remains the git-committed human-readable state. `.motif-state.json` is the machine-readable session-local accelerator.
- Add `.motif-state.json` to the recommended .gitignore entries in the init flow or README

**Phase:** Context Resilience -- decide the git strategy for the new file before implementing it.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Global Install | Wrong `process.cwd()` from subdirectory (Pitfall 1) | Project root detection: walk up to find .git/package.json |
| Global Install | Silent version downgrade (Pitfall 4) | Semver comparison, refuse downgrade without --force |
| Global Install | Windows hook path failures (Pitfall 5) | Test on Windows, cross-platform variable syntax |
| Global Install | Stale files after update (Pitfall 7) | Diff old manifest against new package, flag removals |
| Global Install | Self-dependency in package.json (Pitfall 9) | Remove before publishing |
| Context Resilience | STATE.md not read after context clear (Pitfall 2) | Machine-readable .motif-state.json + state-check.js script |
| Context Resilience | JSON file corruption from concurrent writes (Pitfall 3) | Atomic write (tmp + rename) + lockfile |
| Context Resilience | Phantom progress from filesystem inference (Pitfall 11) | Trust state file over artifact detection |
| Context Resilience | New state file git strategy (Pitfall 13) | Gitignore .motif-state.json, reconstruct from STATE.md |
| New Verticals | Structural drift between old and new (Pitfall 6) | validate-vertical.js script before authoring |
| New Verticals | Naming convention ambiguity (Pitfall 10) | Enforce lowercase single-word names + registry |
| New Verticals | Context budget explosion (Pitfall 8) | Audit sizes, enforce single-vertical loading |

## Integration Gotchas Between Features

These pitfalls arise from the INTERACTION between the three features, not from any single feature alone.

| Integration Point | What Goes Wrong | Correct Approach |
|-------------------|-----------------|------------------|
| Global install + state resilience | Global install overwrites `.motif-state.json` on re-install, losing current workflow phase | Exclude `.motif-state.json` from the install manifest. It is not a package-delivered file. |
| Global install + new verticals | Global install at v0.3.0 does not have new vertical files. Running `motif` on a project that selected a new vertical (education) produces "vertical not found" | State check should validate that the vertical file exists. If missing, advise: "Your Motif installation does not include the 'education' vertical. Run `npm update -g motif-design`." |
| State resilience + new verticals | State file records `"vertical": "education"` but the vertical file was deleted or renamed in an update | State validation should check that the recorded vertical has a corresponding file on disk. Warn if mismatch. |
| All three features | User installs globally (v0.3.0), inits a project with `education` vertical, clears context, updates globally to v0.4.0 (which renames education.md to edu.md), runs `motif` to re-install, then resumes workflow | The state file references a vertical name that no longer maps to a file. State check must detect this: "Your project uses the 'education' vertical, but this version uses 'edu'. Update your state? [Y/n]" |

## "Looks Done But Isn't" Checklist

- [ ] **Project root detection works from subdirectories:** Run `motif` from `src/`, `test/`, and home directory. Verify it finds (or rejects) the correct root.
- [ ] **State check enforces prerequisites programmatically:** A script (not markdown rules) returns pass/fail for each command. Test after context clear.
- [ ] **All JSON writes are atomic:** Write to .tmp then rename. Verify by killing the process mid-write and checking file integrity.
- [ ] **Downgrade detection works:** Install v0.4.0 via npx, then run global v0.3.0. Verify warning and refusal.
- [ ] **Stale file detection works:** Install v0.3.0, add a file manually to the manifest, install v0.4.0. Verify orphan warning.
- [ ] **New verticals pass validation:** Run `validate-vertical.js` against all 8 verticals. Zero failures.
- [ ] **Single vertical loading enforced:** Init with an ambiguous description. Verify only one vertical file loads.
- [ ] **Windows hooks work:** Test token-check, font-check, and state-check hooks on Windows PowerShell.
- [ ] **Self-dependency removed:** `npm pack --dry-run` shows zero runtime dependencies.
- [ ] **State file survives context clear:** Clear AI context, invoke `/motif:compose`. Verify the AI reads `.motif-state.json` and knows the current phase.

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Wrong install directory (Pitfall 1) | LOW | Delete misplaced `.claude/` and `.motif-manifest.json`. Re-run from correct directory. |
| Lost state after context clear (Pitfall 2) | MEDIUM | If STATE.md exists on disk, read it manually and create `.motif-state.json`. If not, check for artifacts (tokens.css, research files) and reconstruct. |
| Manifest corruption (Pitfall 3) | MEDIUM | Delete `.motif-manifest.json`. Re-run `motif --force` to re-install and regenerate manifest. User modifications to installed files will be lost. |
| Version downgrade (Pitfall 4) | LOW-MEDIUM | Run `npx motif-design@latest --force` to restore latest version. Verify with manifest version. |
| Windows hook failures (Pitfall 5) | LOW | Update hook commands to use cross-platform syntax. Re-run `motif` to re-inject hooks. |
| Vertical drift (Pitfall 6) | MEDIUM | Run validator, fix non-conforming sections. May require re-running system generation for affected projects. |
| Stale files (Pitfall 7) | LOW | Run `motif --clean` (once implemented) or manually delete orphaned files using old manifest as reference. |
| Context budget exceeded (Pitfall 8) | MEDIUM | Trim vertical files to budget. Re-run system generation. Composed screens may need re-composition if architect output changed. |

## Sources

- Codebase analysis: `bin/install.js` (complete install flow, path resolution, manifest handling, hook injection), `core/references/state-machine.md` (phase definitions, gate checks, STATE.md format), `core/references/context-engine.md` (context budgets, loading profiles, orchestrator rules), `core/templates/VERTICAL-TEMPLATE.md` (vertical file structure contract), `core/references/verticals/ecommerce.md` (reference vertical implementation), `.motif-manifest.json` (current manifest structure), `package.json` (self-dependency issue, bin field, engine requirements)
- [Claude Code .claude.json corruption -- GitHub #29036](https://github.com/anthropics/claude-code/issues/29036) -- concurrent write corruption in a similar JSON state file
- [Claude Code .claude.json corruption -- GitHub #29153](https://github.com/anthropics/claude-code/issues/29153) -- Windows + OneDrive concurrent write cascade failure
- [npm Docs: Folders](https://docs.npmjs.com/cli/v11/configuring-npm/folders/) -- global vs local install paths, bin symlink behavior
- [npm Docs: package.json](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) -- bin field behavior for global and local installs
- [npm CLI issue #5189](https://github.com/npm/cli/issues/5189) -- Windows junctions vs symlinks in npm install
- [Persistence Patterns for AI Agents](https://dev.to/aureus_c_b3ba7f87cc34d74d49/persistence-patterns-for-ai-agents-that-survive-restarts-59ck) -- handoff protocols and boot sequences for state resilience
- [Context Rot in Claude Code](https://vincentvandeth.nl/blog/context-rot-claude-code-automatic-rotation) -- automatic context rotation and state recovery patterns
- [Advanced AI Agents: Context Offloading](https://www.flowhunt.io/blog/advanced-ai-agents-with-file-access-mastering-context-offloading-and-state-management/) -- file-based state management for AI agents
- [SitePoint: Global npm Module Dependency Problem](https://www.sitepoint.com/solve-global-npm-module-dependency-problem/) -- global version mismatch patterns
- [Alternatives to Global npm Install](https://2ality.com/2022/06/global-npm-install-alternatives.html) -- why npx is preferred over global install
- [writeFile corrupts data -- Node.js #2346](https://github.com/nodejs/help/issues/2346) -- Node.js writeFile is not atomic under concurrent load

---
*Pitfalls research for: Global Install, Context-Resilient State, and New Verticals -- Motif milestone*
*Researched: 2026-03-09*
