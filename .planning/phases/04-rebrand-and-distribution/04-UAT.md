---
status: diagnosed
phase: 04-rebrand-and-distribution
source: [04-01-SUMMARY.md, 04-02-SUMMARY.md, 04-03-SUMMARY.md]
started: 2026-03-02T09:00:00Z
updated: 2026-03-02T09:15:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Command directory renamed to motif
expected: `runtimes/claude-code/commands/motif/` exists with 10 .md files (init, research, system, compose, review, fix, evolve, quick, progress, help). The old `commands/forge/` directory does not exist.
result: pass

### 2. Agent files renamed to motif
expected: 5 agent files exist as `motif-*.md` (motif-researcher, motif-system-architect, motif-screen-composer, motif-design-reviewer, motif-fix-agent) in `runtimes/claude-code/agents/`. No `forge-*.md` agent files exist.
result: pass

### 3. Zero old-brand references in shipped files
expected: Searching for "Design Forge", "/forge:", "design-forge", "FORGE_ROOT", "forgeRoot", or "commands/forge" across `core/`, `runtimes/`, `bin/` returns zero results. Every shipped file uses only Motif branding.
result: issue
reported: "I can see forge reference in runtime-adapters.md and also DESIGN FORGE in generate-system.md, also in BUILD-SPEC.MD, ALSO in e2e-installer.js"
severity: major

### 4. Installer dry-run completes with motif paths
expected: Running `node bin/install.js --dry-run` completes without errors. Output shows `.claude/get-motif/` and `commands/motif/` paths (not forge paths). Template variable is `{MOTIF_ROOT}`.
result: pass

### 5. CLAUDE.md sentinel block uses Motif branding
expected: The content between `<!-- MOTIF-START -->` and `<!-- MOTIF-END -->` in the root CLAUDE.md shows "Motif Rules" heading and `/motif:` command references. No `/forge:` or "Design Forge" text appears in the block.
result: pass

### 6. MIT LICENSE file exists
expected: A `LICENSE` file exists at project root containing "MIT License" on the first line and "Copyright (c) 2026 SailsLab" in the copyright line. Standard MIT permission text follows.
result: pass

### 7. README.md is complete for npm
expected: `README.md` at project root contains: a title and tagline for Motif, a pitch paragraph, Quick Start section with `npx motif@latest`, a Commands table referencing all 10 `/motif:` slash commands, a How It Works section, an Architecture section, Requirements (Node 22+), and License section.
result: pass

### 8. package.json has correct npm identity
expected: `package.json` has `"name": "motif"`, `"bin": { "motif": "bin/install.js" }`, `"files"` whitelist including bin/, core/, runtimes/, scripts/, `"engines": { "node": ">=22.0.0" }`, and `"license": "MIT"`.
result: pass

## Summary

total: 8
passed: 7
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Zero old-brand references in shipped files — searching for forge/Design Forge/FORGE_ROOT across core/, runtimes/, bin/ returns zero results"
  status: failed
  reason: "User reported: forge reference in runtime-adapters.md (forge-*.md agent refs in adapter table), DESIGN FORGE in generate-system.md (token comment example), BUILD-SPEC.md (docs/ — not shipped but stale), e2e-installer.js (test/ — stale forge-researcher.md expectation and FORGE_ROOT variable names)"
  severity: major
  test: 3
  root_cause: "Two shipped files had isolated single-line survivors in table rows and code examples that were missed during bulk replacement. Non-shipped files (docs/, test/) were out of rebrand scope but contain stale refs and one broken test assertion."
  artifacts:
    - path: "core/references/runtime-adapters.md"
      issue: "Line 23: forge-*.md agent refs in adapter table — factually wrong (actual files are motif-*.md)"
    - path: "core/workflows/generate-system.md"
      issue: "Line 153: DESIGN FORGE in CSS comment example — AI will write old branding into generated tokens.css"
    - path: "docs/BUILD-SPEC.md"
      issue: "14+ forge references throughout — not shipped but stale"
    - path: "test/e2e-installer.js"
      issue: "Line 112: forge-researcher.md expectation will FAIL (actual file is motif-researcher.md). Lines 136-147: stale variable names."
  missing:
    - "Replace forge-*.md with motif-*.md in runtime-adapters.md adapter table"
    - "Replace DESIGN FORGE with MOTIF in generate-system.md token comment"
    - "Rebrand docs/BUILD-SPEC.md or mark as deprecated"
    - "Fix test/e2e-installer.js agent filename expectation and stale variable names"
  debug_session: ""
