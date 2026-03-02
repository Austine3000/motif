---
status: diagnosed
trigger: "Investigate root cause of UAT gap: installed files still reference old branding — get-design-forge, .design-forge, /forge: commands"
created: 2026-03-02T00:00:00Z
updated: 2026-03-02T00:00:00Z
---

## Current Focus

hypothesis: Source files in core/ and runtimes/ were never rebranded — they still contain Design Forge branding verbatim. The installer's resolveContent() only patches two patterns ({FORGE_ROOT} and .claude/get-design-forge) but leaves all other old references intact.
test: Read source files and count old-branding occurrences vs what resolveContent() replaces
expecting: confirmed — root cause is in source files, not installer logic gap
next_action: COMPLETE — diagnosis returned to caller

## Symptoms

expected: Installed files under .claude/get-motif/ and .claude/commands/motif/ reference Motif branding (/motif: commands, .claude/get-motif paths, "Motif" name)
actual: Installed files contain old Design Forge branding: /forge: commands, .opencode/get-design-forge, .design-forge, "Design Forge" name throughout
errors: UAT found in runtime-adapters.md, research.md, generate-system.md, design-inputs.md, help.md
started: Phase 3 Installer is complete; old references persisted because Phase 4 Rebrand has not run yet
reproduction: Run npx motif@latest, open .claude/get-motif/references/runtime-adapters.md, observe "get-design-forge" references

## Eliminated

- hypothesis: resolveContent() is buggy and failing to apply replacements it should apply
  evidence: resolveContent() only replaces {FORGE_ROOT} and .claude/get-design-forge. It does not claim to replace /forge:, .opencode/get-design-forge, .design-forge, or "Design Forge" strings. It is working as written.
  timestamp: 2026-03-02

- hypothesis: The installer maps commands to the wrong destination (forge vs motif)
  evidence: resolveMapping() correctly maps runtimes/claude-code/commands/forge/ -> .claude/commands/motif/. The directory rename is correct. The FILE CONTENTS however still say /forge: because source files were not rebranded.
  timestamp: 2026-03-02

- hypothesis: Phase 4 was supposed to handle runtime-adapter paths but missed them
  evidence: Phase 4 has not started yet (0/TBD plans). It explicitly owns BRND-01: "Zero references to Design Forge, design-forge, forge, or /forge: remain in any shipped file." The references remaining are expected at this stage.
  timestamp: 2026-03-02

## Evidence

- timestamp: 2026-03-02
  checked: bin/install.js resolveContent() function (lines 97-101)
  found: Only replaces two patterns — {FORGE_ROOT} (a template variable) and .claude/get-design-forge (one specific old path). Nothing replaces /forge: command names, .opencode/get-design-forge, .gemini/get-design-forge, .design-forge, or "Design Forge" brand name.
  implication: The installer was never designed to perform a full rebrand. resolveContent() is a path-resolution utility, not a brand-rename utility.

- timestamp: 2026-03-02
  checked: core/workflows/research.md and core/workflows/generate-system.md lines 6-13
  found: Both files contain a <path_resolution> block that hardcodes old paths: "Claude Code: .claude/get-design-forge", "OpenCode: .opencode/get-design-forge", "Gemini: .gemini/get-design-forge", "Cursor: .design-forge"
  implication: The installer copies these files verbatim (only replacing .claude/get-design-forge). The Claude Code path gets fixed, but .opencode/..., .gemini/..., and .design-forge paths remain wrong. AND the block still says "get-design-forge" conceptually.

- timestamp: 2026-03-02
  checked: core/references/runtime-adapters.md
  found: Entire document is written as "Design Forge" — title says "Design Forge — Runtime Adapter Reference", table shows .opencode/get-design-forge, .gemini/get-design-forge, .design-forge, install mapping shows core/references/ -> .claude/get-design-forge/, commands shown as /forge:*, CLI shown as "npx design-forge@latest"
  implication: This is a source file that predates the Motif rebrand. It was written for Design Forge and not updated.

- timestamp: 2026-03-02
  checked: core/references/design-inputs.md
  found: Contains /forge:init, /forge:research, /forge:system, /forge:compose, /forge:review throughout (7+ references in the summary table and workflow description sections)
  implication: Source file still uses old /forge: command namespace throughout.

- timestamp: 2026-03-02
  checked: runtimes/claude-code/commands/forge/help.md
  found: Title "Design Forge — Commands", all commands listed as /forge:init, /forge:research, /forge:system, /forge:compose, /forge:review, /forge:fix, /forge:evolve, /forge:quick, /forge:progress, /forge:help, example flow uses /forge: namespace
  implication: This is the source file that gets copied to .claude/commands/motif/help.md. The directory name changes to motif but the file contents still say /forge:.

- timestamp: 2026-03-02
  checked: ROADMAP.md Phase 4 scope (BRND-01)
  found: "Zero references to 'Design Forge', 'design-forge', 'forge', or '/forge:' remain in any shipped file — all replaced with 'Motif', 'motif', or '/motif:' equivalents." Phase 4 status: Not started.
  implication: The rebrand work is explicitly planned and scoped. The UAT gap is expected at this point in the roadmap. Phase 3 (Installer) completed its job correctly. Phase 4 (Rebrand) is the gap owner.

- timestamp: 2026-03-02
  checked: Grep across all of core/ and runtimes/ for old branding
  found: 12 files in core/ and 18 files in runtimes/ contain old Design Forge references. This covers workflows, references, templates, agents, and all command files.
  implication: The rebrand scope is large — every source file needs to be touched. This confirms Phase 4 is the right vehicle (not a patch to resolveContent()).

## Resolution

root_cause: The UAT gap is NOT a bug in resolveContent() — it is expected behavior of an incomplete rebrand. The source files in core/ and runtimes/ were written during the "Design Forge" era and never updated to "Motif". The installer copies them verbatim (with only the {FORGE_ROOT} path variable resolved), so old branding flows directly into installed output. Phase 4 (Rebrand and Distribution) owns fixing this and has not started yet.

fix: Not applied — this is a diagnose-only session. Fix belongs to Phase 4.

verification: N/A

files_changed: []
