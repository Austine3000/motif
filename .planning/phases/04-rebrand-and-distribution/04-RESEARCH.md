# Phase 4: Rebrand and Distribution - Research

**Researched:** 2026-03-02
**Domain:** Source file rebranding (string replacement), npm package identity, distribution artifacts (LICENSE, README)
**Confidence:** HIGH

## Summary

Phase 4 has two distinct workstreams: (1) a comprehensive rebrand of every shipped file from "Design Forge" / "forge" to "Motif" / "motif", and (2) creation of distribution artifacts (LICENSE, README.md). The rebrand is primarily a find-and-replace operation across 30 source files in `core/` and `runtimes/`, plus renaming the `runtimes/claude-code/commands/forge/` directory to `commands/motif/` and updating the installer's source path reference. The distribution artifacts are greenfield -- LICENSE is a standard MIT text, and README.md needs to be authored from scratch with pitch, install instructions, command reference, and architecture overview.

The package.json already meets DIST-01 requirements (name "motif", correct bin field, files whitelist, engines >=22.0.0). The installer (`bin/install.js`) is already fully Motif-branded -- it maps to `get-motif/`, `commands/motif/`, uses `.motif-manifest.json`, etc. The gap is entirely in source file *contents* and one source directory name.

**Primary recommendation:** Execute the rebrand as a systematic find-and-replace with a strict replacement map, verify with grep, then create LICENSE and README.md. The `{FORGE_ROOT}` template variable should also be renamed to `{MOTIF_ROOT}` for consistency, requiring a corresponding installer update.

## Standard Stack

This phase involves no new libraries or dependencies. The entire operation is file editing (markdown, JS, HTML) and two new file creations.

### Core Tools
| Tool | Purpose | Why Standard |
|------|---------|--------------|
| `grep -rn` | Verify zero remaining old-brand references post-rebrand | The success criterion is literally "zero references remain" |
| `git mv` | Rename `commands/forge/` to `commands/motif/` preserving history | Standard git operation for directory renames |
| Text editor | Find-and-replace across source files | The core operation of this phase |

### No Libraries Needed
This phase has zero dependencies. It is pure file editing and creation. No npm packages, no build tools, no test frameworks.

## Architecture Patterns

### Replacement Map

This is the core artifact driving the rebrand. Every old pattern maps to exactly one new pattern. The map is ordered from most-specific to least-specific to prevent partial replacements.

```
REPLACEMENT MAP (apply in this order):

1. "Design Forge"          -> "Motif"              (brand name)
2. "design-forge"          -> "motif"              (kebab-case in paths, package refs)
3. ".design-forge"         -> ".motif"             (Cursor/Windsurf install dir)
4. "get-design-forge"      -> "get-motif"          (install directories)
5. "/forge:"               -> "/motif:"            (slash commands)
6. "forge-researcher"      -> "motif-researcher"   (agent file names + name: fields)
7. "forge-system-architect" -> "motif-system-architect"
8. "forge-screen-composer" -> "motif-screen-composer"
9. "forge-design-reviewer" -> "motif-design-reviewer"
10. "forge-fix-agent"      -> "motif-fix-agent"
11. "forge-*"              -> "motif-*"            (any remaining agent refs)
12. "commands/forge/"      -> "commands/motif/"     (source directory paths in docs)
13. "{FORGE_ROOT}"         -> "{MOTIF_ROOT}"        (template variable)
14. "FORGE_ROOT"           -> "MOTIF_ROOT"          (template variable without braces, in docs)
15. "forgeRoot"            -> "motifRoot"           (JS variable in installer)
16. "npx design-forge"     -> "npx motif"           (CLI invocation examples)
17. "Forge Fix Agent"      -> "Motif Fix Agent"     (prose references)
18. "Design Forge State"   -> "Motif State"         (STATE-TEMPLATE.md heading)
```

### File Scope

**Files that need content changes (shipped files only):**

| Category | File | Approx Forge Refs | Key Patterns |
|----------|------|-------------------|--------------|
| **Core References** | `core/references/runtime-adapters.md` | 27 | Design Forge, get-design-forge, /forge:, commands/forge, npx design-forge, .design-forge |
| | `core/references/design-inputs.md` | 30 | Design Forge, /forge: |
| | `core/references/state-machine.md` | 20 | Design Forge, /forge: |
| | `core/references/context-engine.md` | 2 | Design Forge |
| **Core Workflows** | `core/workflows/research.md` | 8 | Design Forge, /forge:, get-design-forge, {FORGE_ROOT} |
| | `core/workflows/generate-system.md` | 8 | Design Forge, /forge:, get-design-forge, {FORGE_ROOT} |
| | `core/workflows/compose-screen.md` | 6 | Design Forge, /forge: |
| | `core/workflows/review.md` | 3 | Design Forge, /forge: |
| | `core/workflows/fix.md` | 3 | Design Forge, /forge: |
| | `core/workflows/evolve.md` | 1 | Design Forge |
| | `core/workflows/quick.md` | 2 | /forge: |
| **Core Templates** | `core/templates/STATE-TEMPLATE.md` | 1 | "Design Forge State" heading |
| **Runtime Commands** | `runtimes/claude-code/commands/forge/help.md` | 13 | Design Forge, /forge: (all 10 commands) |
| | `runtimes/claude-code/commands/forge/init.md` | 6 | Design Forge, /forge:, get-design-forge |
| | `runtimes/claude-code/commands/forge/progress.md` | 1 | Design Forge, /forge: |
| | `runtimes/claude-code/commands/forge/compose.md` | 1 | get-design-forge |
| | `runtimes/claude-code/commands/forge/review.md` | 1 | get-design-forge |
| | `runtimes/claude-code/commands/forge/research.md` | 1 | get-design-forge |
| | `runtimes/claude-code/commands/forge/system.md` | 1 | get-design-forge |
| | `runtimes/claude-code/commands/forge/fix.md` | 1 | get-design-forge |
| | `runtimes/claude-code/commands/forge/evolve.md` | 1 | get-design-forge |
| | `runtimes/claude-code/commands/forge/quick.md` | 1 | get-design-forge |
| **Runtime Agents** | `runtimes/claude-code/agents/forge-researcher.md` | 3 | forge-researcher, /forge:, get-design-forge |
| | `runtimes/claude-code/agents/forge-system-architect.md` | 3 | forge-system-architect, /forge:, get-design-forge |
| | `runtimes/claude-code/agents/forge-screen-composer.md` | 2 | forge-screen-composer, /forge: |
| | `runtimes/claude-code/agents/forge-design-reviewer.md` | 2 | forge-design-reviewer, /forge: |
| | `runtimes/claude-code/agents/forge-fix-agent.md` | 2 | forge-fix-agent, Design Forge |
| **Runtime Config** | `runtimes/claude-code/CLAUDE-MD-SNIPPET.md` | 1 | "Design Forge Rules", /forge: |
| **Future Runtime READMEs** | `runtimes/opencode/README.md` | varies | commands/forge, get-design-forge |
| | `runtimes/gemini/README.md` | varies | commands/forge, get-design-forge |
| | `runtimes/cursor/README.md` | varies | .design-forge |

**Files that need renaming:**
- `runtimes/claude-code/commands/forge/` directory -> `runtimes/claude-code/commands/motif/`
- `runtimes/claude-code/agents/forge-researcher.md` -> `motif-researcher.md`
- `runtimes/claude-code/agents/forge-system-architect.md` -> `motif-system-architect.md`
- `runtimes/claude-code/agents/forge-screen-composer.md` -> `motif-screen-composer.md`
- `runtimes/claude-code/agents/forge-design-reviewer.md` -> `motif-design-reviewer.md`
- `runtimes/claude-code/agents/forge-fix-agent.md` -> `motif-fix-agent.md`

**Installer update required:**
- `bin/install.js` line 82: change `'commands', 'forge'` to `'commands', 'motif'`
- `bin/install.js` lines 87, 97-100: rename `forgeRoot` variable to `motifRoot`, rename `{FORGE_ROOT}` to `{MOTIF_ROOT}`, update `.claude/get-design-forge` replacement to match the old pattern
- `bin/install.js` line 373: update `{FORGE_ROOT}` verification to `{MOTIF_ROOT}`

**CLAUDE.md update required:**
- Root `CLAUDE.md` contains the Motif snippet with old branding (between `<!-- MOTIF-START -->` and `<!-- MOTIF-END -->` markers). This is sourced from `CLAUDE-MD-SNIPPET.md`, so updating the snippet source file is sufficient -- the installer will re-inject the correct content on next install. However, the local project's `CLAUDE.md` should also be updated directly.

### Source Directory Rename Strategy

The source directory `runtimes/claude-code/commands/forge/` should be renamed to `runtimes/claude-code/commands/motif/` because:

1. **Consistency:** Everything else in the codebase says "motif" -- having a `forge/` directory in source is confusing
2. **Installer simplicity:** After rename, the installer maps `commands/motif` -> `.claude/commands/motif/` which is more intuitive
3. **Future contributors:** New contributors should never see "forge" anywhere

Use `git mv` to preserve history:
```bash
git mv runtimes/claude-code/commands/forge runtimes/claude-code/commands/motif
```

Similarly, rename agent files:
```bash
git mv runtimes/claude-code/agents/forge-researcher.md runtimes/claude-code/agents/motif-researcher.md
git mv runtimes/claude-code/agents/forge-system-architect.md runtimes/claude-code/agents/motif-system-architect.md
git mv runtimes/claude-code/agents/forge-screen-composer.md runtimes/claude-code/agents/motif-screen-composer.md
git mv runtimes/claude-code/agents/forge-design-reviewer.md runtimes/claude-code/agents/motif-design-reviewer.md
git mv runtimes/claude-code/agents/forge-fix-agent.md runtimes/claude-code/agents/motif-fix-agent.md
```

### Installer Adaptation

After renaming source directories/files, the installer needs these updates:

1. **Source path for commands:** `'commands', 'forge'` -> `'commands', 'motif'` (line 82)
2. **Template variable:** `{FORGE_ROOT}` -> `{MOTIF_ROOT}` throughout `resolveContent()` and verification
3. **JS variable name:** `forgeRoot` -> `motifRoot` (cosmetic but improves clarity)
4. **Backward-compatible replacement:** The `.claude/get-design-forge` replacement in `resolveContent()` can be removed since source files will no longer contain that string after rebrand

### Anti-Patterns to Avoid
- **Partial replacement:** Replacing "forge" globally without context-awareness could break words containing "forge" (though none exist in this codebase). Always use the full replacement map above.
- **Forgetting file renames:** Changing file contents but leaving filenames as `forge-*` creates inconsistency.
- **Not updating the installer:** Source file changes without corresponding installer updates will break installation.
- **Leaving `{FORGE_ROOT}` in source:** Even though the installer resolves it, renaming to `{MOTIF_ROOT}` prevents confusion for anyone reading source files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| MIT LICENSE text | Custom license wording | Standard MIT template from choosealicense.com | Legal correctness matters; use the canonical text |
| README structure | Freeform README | Follow the npm package README conventions: pitch, install, usage, architecture | npm shows README on the package page; structure matters for discoverability |
| Replacement verification | Manual spot-checking | `grep -rn` sweep for all old patterns post-rebrand | The success criterion is ZERO remaining references; only grep can verify this exhaustively |

## Common Pitfalls

### Pitfall 1: Installer Breaks After Source Rename
**What goes wrong:** Renaming `commands/forge/` to `commands/motif/` in source without updating installer line 82 causes install to silently skip commands (source directory not found).
**Why it happens:** The installer uses hardcoded relative paths to source directories.
**How to avoid:** Update installer source paths in the SAME commit as the directory rename.
**Warning signs:** `--dry-run` shows "[skip] Source not found" for commands.

### Pitfall 2: Path Resolution Block Has Multi-Runtime References
**What goes wrong:** The `<path_resolution>` blocks in workflows list paths for all runtimes (Claude Code, OpenCode, Gemini, Cursor). Rebrand must update ALL of them, not just the Claude Code line.
**Why it happens:** Easy to search for `.claude/get-design-forge` and miss `.opencode/get-design-forge`, `.gemini/get-design-forge`, and `.design-forge`.
**How to avoid:** The replacement map covers this: `get-design-forge` -> `get-motif` and `.design-forge` -> `.motif` are separate entries applied globally.
**Warning signs:** Post-rebrand grep finds `design-forge` in workflow files.

### Pitfall 3: Agent Name References in Workflows
**What goes wrong:** Agent filenames are referenced inside workflow spawn blocks and context loading profiles. If agent files are renamed but the references in workflow files still say `forge-researcher.md`, spawning fails.
**Why it happens:** The agent filename appears in multiple places: the filename itself, the `name:` frontmatter field, and any workflow/command that references it.
**How to avoid:** Grep for every old agent name after rename and update all references.
**Warning signs:** Workflows cannot find agent definitions at the expected paths.

### Pitfall 4: npm Package Name Collision
**What goes wrong:** The "motif" package name already exists on npm (v0.1.6, last published ~5 years ago, a pattern composition mini-language).
**Why it happens:** Short, common English words are often taken on npm.
**How to avoid:** Two options: (a) contact the current owner about transfer since it is unmaintained, (b) use a scoped name like `@motif-design/cli` or `@motif/cli`, or (c) try to publish as "motif" since npm allows republishing over abandoned packages in some cases. The package.json already uses "motif" as the name, suggesting this was an intentional decision. If npm publish fails, the name can be adjusted in Phase 8 (CI/Publish). This is not a blocker for Phase 4.
**Warning signs:** `npm publish` returns 403 on the package name.

### Pitfall 5: CLAUDE.md Gets Stale
**What goes wrong:** The local project's `CLAUDE.md` contains the old Motif snippet (with `/forge:` references) between sentinel markers. After rebranding `CLAUDE-MD-SNIPPET.md`, the local `CLAUDE.md` still has the old content until someone re-runs the installer.
**How to avoid:** Update the local `CLAUDE.md` directly in addition to updating the source snippet file. Both need to change.
**Warning signs:** Running the project locally still shows `/forge:` commands in the CLAUDE.md rules.

### Pitfall 6: `{FORGE_ROOT}` Verification in Installer
**What goes wrong:** The installer's post-install verification checks for unresolved `{FORGE_ROOT}`. If we rename to `{MOTIF_ROOT}` in source files, but forget to update the installer's verification check, it will pass verification even when `{MOTIF_ROOT}` is unresolved.
**How to avoid:** Update the verification function to check for `{MOTIF_ROOT}` instead of (or in addition to) `{FORGE_ROOT}`.
**Warning signs:** Test install succeeds verification but installed files contain literal `{MOTIF_ROOT}` strings.

## Code Examples

### Example 1: Before/After for Workflow Path Resolution Block

**Before:**
```markdown
<path_resolution>
{FORGE_ROOT} resolves to the directory where Design Forge core files are installed.
Claude Code: .claude/get-design-forge
OpenCode: .opencode/get-design-forge
Gemini: .gemini/get-design-forge
Cursor: .design-forge
The installer sets this path. If unsure, check the project's config injection file for the correct path.
</path_resolution>
```

**After:**
```markdown
<path_resolution>
{MOTIF_ROOT} resolves to the directory where Motif core files are installed.
Claude Code: .claude/get-motif
OpenCode: .opencode/get-motif
Gemini: .gemini/get-motif
Cursor: .motif
The installer sets this path. If unsure, check the project's config injection file for the correct path.
</path_resolution>
```

### Example 2: Before/After for Command File

**Before (`runtimes/claude-code/commands/forge/compose.md`):**
```markdown
---
description: Build a production screen using the design system. Fresh context per screen.
argument-hint: [screen-name]
---
Load and follow the workflow at `.claude/get-design-forge/workflows/compose-screen.md`

Screen to compose: $ARGUMENTS
```

**After (`runtimes/claude-code/commands/motif/compose.md`):**
```markdown
---
description: Build a production screen using the design system. Fresh context per screen.
argument-hint: [screen-name]
---
Load and follow the workflow at `.claude/get-motif/workflows/compose-screen.md`

Screen to compose: $ARGUMENTS
```

Note: After rebrand, the installer's `resolveContent()` replacement of `.claude/get-design-forge` is no longer needed since source files will already say `.claude/get-motif`. The `{MOTIF_ROOT}` template variable still gets resolved by the installer for runtime portability.

### Example 3: Before/After for CLAUDE-MD-SNIPPET.md

**Before:**
```markdown
# Design Forge Rules

## Workflow
- Design work follows: `/forge:init` -> `/forge:research` -> ...
```

**After:**
```markdown
# Motif Rules

## Workflow
- Design work follows: `/motif:init` -> `/motif:research` -> ...
```

### Example 4: Before/After for Agent Frontmatter

**Before (`runtimes/claude-code/agents/forge-researcher.md`):**
```yaml
---
name: forge-researcher
description: Design pattern researcher... Spawned by /forge:research workflow...
---
```

**After (`runtimes/claude-code/agents/motif-researcher.md`):**
```yaml
---
name: motif-researcher
description: Design pattern researcher... Spawned by /motif:research workflow...
---
```

### Example 5: Updated Installer resolveContent()

**Before:**
```javascript
function resolveContent(content, forgeRoot) {
  return content
    .replaceAll('{FORGE_ROOT}', forgeRoot)
    .replaceAll('.claude/get-design-forge', forgeRoot);
}
```

**After:**
```javascript
function resolveContent(content, motifRoot) {
  return content
    .replaceAll('{MOTIF_ROOT}', motifRoot);
}
```

The `.claude/get-design-forge` replacement is no longer needed because source files will already say `.claude/get-motif` (the Claude Code path) or `{MOTIF_ROOT}` (for runtime portability). The `{MOTIF_ROOT}` template variable is still resolved for non-Claude runtimes in future versions.

### Example 6: MIT LICENSE File

```
MIT License

Copyright (c) 2026 SailsLab

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Example 7: README.md Structure

The README must contain these sections per DIST-03:

```markdown
# Motif

> Domain-intelligent design system for AI coding assistants

[Pitch paragraph: What it does, why it matters, the core insight about AI slop]

## Quick Start

\`\`\`bash
npx motif@latest
\`\`\`

[One-command install. Explain what happens.]

## Commands

| Command | What it does |
|---------|-------------|
| `/motif:init` | Interview -> vertical detection -> design brief |
| `/motif:research` | 4-agent parallel research -> locked design decisions |
| `/motif:system` | Generate tokens + component specs + visual showcase |
| `/motif:compose [screen]` | Build screen with fresh agent context |
| `/motif:review [screen|all]` | 4-lens heuristic evaluation, scored /100 |
| `/motif:fix [screen]` | Fix review findings systematically |
| `/motif:evolve` | Update design system based on learnings |
| `/motif:quick [desc]` | Ad-hoc task with design system consistency |
| `/motif:progress` | Current status + next steps |
| `/motif:help` | Command reference |

## How It Works

[Explain the core + adapters architecture, fresh context per screen,
 domain intelligence from vertical databases]

## Architecture

\`\`\`
[ASCII diagram of core + adapters + installer flow]
\`\`\`

## Requirements

- Node.js >= 22.0.0
- Claude Code (v1.0 — more runtimes coming)

## License

MIT
```

## State of the Art

| Old State | Current State | When Changed | Impact |
|-----------|---------------|--------------|--------|
| Package named "design-forge" in spec | package.json already says "motif" | Phase 3 | DIST-01 is already satisfied |
| Installer uses `get-design-forge` paths | Installer already maps to `get-motif` | Phase 3 | Installer is already branded; only source files lag |
| `resolveContent()` patches two old patterns | After rebrand, only `{MOTIF_ROOT}` resolution needed | Phase 4 | Simplifies installer |
| Source uses `{FORGE_ROOT}` template var | Will use `{MOTIF_ROOT}` | Phase 4 | Clearer intent for contributors |

## Verification Strategy

### Post-Rebrand Grep Sweep

The definitive verification for BRND-01 success. Run after all changes:

```bash
# Must return ZERO results for each pattern in shipped files:
grep -rn "Design Forge" core/ runtimes/ bin/ scripts/
grep -rn "/forge:" core/ runtimes/ bin/ scripts/
grep -rn "design-forge" core/ runtimes/ bin/ scripts/
grep -rn "get-design-forge" core/ runtimes/ bin/ scripts/
grep -rn "\.design-forge" core/ runtimes/ bin/ scripts/
grep -rn "forge-researcher\|forge-system-architect\|forge-screen-composer\|forge-design-reviewer\|forge-fix-agent" core/ runtimes/ bin/ scripts/
grep -rn "FORGE_ROOT" core/ runtimes/ bin/ scripts/
grep -rn "forgeRoot" bin/
grep -rn "commands/forge" core/ runtimes/ bin/

# Must return zero results for directory existence:
ls runtimes/claude-code/commands/forge 2>/dev/null   # should fail
ls runtimes/claude-code/agents/forge-* 2>/dev/null   # should fail
```

### Post-Rebrand Install Test

After rebrand, run the installer in dry-run mode to verify it still works:

```bash
node bin/install.js --dry-run
```

This validates that:
- Source paths still resolve correctly after directory renames
- No crash from changed variable names
- Output shows expected `commands/motif/` destinations

### Package.json Verification

Verify DIST-01 with direct inspection:
```bash
node -e "const p = require('./package.json'); console.log(JSON.stringify({name:p.name, bin:p.bin, files:p.files, engines:p.engines, license:p.license}, null, 2))"
```

Expected output:
```json
{
  "name": "motif",
  "bin": { "motif": "bin/install.js" },
  "files": ["bin/", "core/", "runtimes/", "scripts/"],
  "engines": { "node": ">=22.0.0" },
  "license": "MIT"
}
```

## Plan Structure Recommendation

The phase naturally splits into 3 plans:

### Plan 1: Source File Rebrand (BRND-01)
- Apply replacement map to all ~30 source files in `core/` and `runtimes/`
- Rename `commands/forge/` directory to `commands/motif/` via `git mv`
- Rename 5 agent files from `forge-*` to `motif-*` via `git mv`
- Update installer source path and variable names
- Update local `CLAUDE.md`
- Verify with exhaustive grep sweep (zero old references)
- Verify installer still works with `--dry-run`

### Plan 2: Distribution Artifacts (DIST-02, DIST-03)
- Create MIT LICENSE file at project root
- Create README.md with all required sections (pitch, install, command reference, architecture, how-it-works)
- Verify LICENSE exists and is valid MIT text
- Verify README contains all DIST-03 required sections

### Plan 3: End-to-End Verification (all Phase 4 requirements)
- Run full grep sweep confirming BRND-01 (zero old references)
- Verify DIST-01 (package.json fields)
- Verify DIST-02 (LICENSE exists)
- Verify DIST-03 (README sections)
- Run `--dry-run` install to confirm installer integrity post-rebrand
- Test that the installer's resolveContent correctly resolves `{MOTIF_ROOT}` in installed files

## Open Questions

1. **npm package name "motif" availability**
   - What we know: The "motif" package exists on npm (v0.1.6, published ~5 years ago, pattern composition mini-language). It is very likely abandoned.
   - What's unclear: Whether npm will allow publishing over it, or if name transfer/dispute is needed.
   - Recommendation: This is a Phase 8 concern (CI/Publish). Phase 4 keeps "motif" in package.json as-is. If publish fails, the name can be scoped (`@motif-design/cli`) at that time. Do not let this block Phase 4.

2. **Copyright holder for LICENSE**
   - What we know: The project is built under "SailsLab" organization.
   - What's unclear: Whether the copyright should say "SailsLab", a personal name, or something else.
   - Recommendation: Use "SailsLab" as the copyright holder. The planner should note this is adjustable and can be changed before publish.

3. **Should `runtimes/claude-code/commands/forge/` be renamed in source?**
   - What we know: The installer already maps `commands/forge` -> `commands/motif`. Renaming source is cosmetic for the repo but prevents confusion.
   - What's unclear: Whether git history preservation matters enough to avoid renames.
   - Recommendation: YES, rename. `git mv` preserves history. Having "forge" in the source tree after a rebrand is confusing. The one-line installer update is trivial.

## Sources

### Primary (HIGH confidence)
- Direct file inspection of all 30+ source files in the repository
- `bin/install.js` source code review (604 lines)
- `.planning/debug/uat-gap-old-branding-references.md` -- prior Phase 3 diagnosis confirming rebrand scope
- `package.json` -- confirmed DIST-01 already satisfied
- `.planning/ROADMAP.md` -- Phase 4 requirements and success criteria
- `.planning/REQUIREMENTS.md` -- BRND-01, DIST-01, DIST-02, DIST-03 definitions

### Secondary (MEDIUM confidence)
- [npm registry: motif package](https://www.npmjs.com/package/motif) -- package exists, last published ~5 years ago
- [choosealicense.com MIT template](https://choosealicense.com/licenses/mit/) -- canonical MIT license text
- [npm README docs](https://docs.npmjs.com/about-package-readme-files/) -- README best practices for npm packages

### Tertiary (LOW confidence)
- npm package name availability for "motif" -- need to verify whether publish will succeed at Phase 8 time

## Metadata

**Confidence breakdown:**
- Rebrand scope (BRND-01): HIGH -- every file inspected, all patterns catalogued, replacement map verified
- Package identity (DIST-01): HIGH -- package.json already meets requirements, confirmed by direct inspection
- LICENSE (DIST-02): HIGH -- standard MIT text, no ambiguity
- README (DIST-03): HIGH -- requirements are explicit, structure is well-defined
- Installer adaptation: HIGH -- installer code reviewed line-by-line, changes are minimal and well-understood

**Research date:** 2026-03-02
**Valid until:** No expiry -- this is a one-time rebrand operation against a fixed codebase
