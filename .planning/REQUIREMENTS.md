# Requirements: Motif

**Defined:** 2026-03-01
**Core Value:** Domain-intelligent design delivered through fresh context — a fintech app must look like fintech, not meditation, and screen 5 must be as good as screen 1.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Agents

- [x] **AGNT-01**: Researcher agent definition with explicit context-loading profile and model selection
- [x] **AGNT-02**: System Architect agent definition for design system generation with context profile
- [x] **AGNT-03**: Screen Composer agent definition enforcing token compliance with fresh 200K context
- [x] **AGNT-04**: Design Reviewer agent definition for 4-lens evaluation with context profile
- [x] **AGNT-05**: Fix Agent definition for systematically fixing review findings with context profile

### Templates

- [x] **TMPL-01**: STATE-TEMPLATE.md matching format defined in state-machine.md
- [x] **TMPL-02**: SUMMARY-TEMPLATE.md matching format defined in compose-screen.md
- [x] **TMPL-03**: Token showcase HTML — self-contained page displaying all design tokens visually

### Installer

- [x] **INST-01**: `npx motif@latest` auto-detects Claude Code runtime and installs
- [x] **INST-02**: Copies core/ to `.claude/get-motif/` and commands to `.claude/commands/motif/`
- [x] **INST-03**: Injects config snippet into CLAUDE.md with sentinel markers (`<!-- MOTIF-START/END -->`)
- [x] **INST-04**: Backs up existing files before overwrite on re-install
- [x] **INST-05**: Manifest-based upgrade tracking (`.motif-manifest.json`) with content-hash diffing
- [x] **INST-06**: Supports `--runtime`, `--force`, `--dry-run`, `--uninstall` CLI flags
- [x] **INST-07**: Post-install verification confirms zero unresolved `{FORGE_ROOT}` path variables
- [x] **INST-08**: Resolves `{FORGE_ROOT}` to correct runtime path at install time

### Distribution

- [x] **DIST-01**: `package.json` with name "motif", bin field, files whitelist, engines >=22.0.0
- [x] **DIST-02**: MIT LICENSE file
- [x] **DIST-03**: README with pitch, install command, command reference, architecture diagram, how it works
- [ ] **DIST-04**: GitHub Actions CI workflow for automated npm publish on git tag

### Verticals

- [x] **VERT-01**: Health vertical following fintech.md structure exactly
- [x] **VERT-02**: SaaS vertical following fintech.md structure exactly
- [x] **VERT-03**: E-commerce vertical following fintech.md structure exactly

### Hooks

- [x] **HOOK-01**: Token-check PostToolUse hook flags hardcoded CSS values in .css/.tsx/.jsx/.vue/.html
- [x] **HOOK-02**: Font-check PostToolUse hook flags banned fonts (unless user-locked)
- [x] **HOOK-03**: A11y-check PostToolUse hook flags div+onClick, img without alt, inputs without labels
- [x] **HOOK-04**: Context-monitor statusline hook displays context %, warns at 50%

### Scripts

- [x] **SCRP-01**: Contrast checker — WCAG contrast ratio calculator, pure Node.js
- [x] **SCRP-02**: Token counter — approximate token count in .planning/design/ files

### Rebrand

- [x] **BRND-01**: Rename package, commands (`/forge:*` → `/motif:*`), install dirs, all references to "Motif"

### Validation

- [x] **VALD-01**: End-to-end workflow completes on controlled test project (init → research → system → compose → review → fix)
- [x] **VALD-02**: Battle test on real project (CryptoPay fintech) — full workflow succeeds
- [x] **VALD-03**: Differentiation seed produces visibly different designs for same vertical
- [x] **VALD-04**: Brand colors flow through token generation without being overridden
- [x] **VALD-05**: Screen quality remains consistent across 5+ screens (fresh context works)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Multi-Runtime Support

- **RUNT-01**: OpenCode runtime adapter (commands, agents, config snippet)
- **RUNT-02**: Cursor/Windsurf runtime adapter
- **RUNT-03**: Gemini CLI runtime adapter

### Token Formats

- **TOKN-01**: Tailwind token export command
- **TOKN-02**: W3C DTCG JSON token format export

### Vertical Expansion

- **VERT-04**: Social vertical
- **VERT-05**: Education vertical
- **VERT-06**: Marketplace vertical
- **VERT-07**: DevTools vertical

### Integrations

- **INTG-01**: Figma MCP integration for design-to-code pipeline

### Polish

- **PLSH-01**: CHANGELOG.md with release tracking

## Out of Scope

| Feature | Reason |
|---------|--------|
| Component library / pre-built UI components | Motif generates specs, not components. Framework-agnostic. |
| Runtime UI / visual editor | CLI-first tool. Visual editing adds complexity without core value. |
| Real-time collaboration | Single-user tool for solo devs/founders. |
| CSS-in-JS token output | CSS custom properties are framework-agnostic. CSS-in-JS fragments the approach. |
| Figma plugin | MCP integration is the modern path. Plugin adds maintenance burden. |
| Windows CI testing | macOS-only v1. Windows support deferred to community feedback. |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AGNT-01 | Phase 1 | Complete |
| AGNT-02 | Phase 1 | Complete |
| AGNT-03 | Phase 1 | Complete |
| AGNT-04 | Phase 1 | Complete |
| AGNT-05 | Phase 1 | Complete |
| TMPL-01 | Phase 2 | Complete |
| TMPL-02 | Phase 2 | Complete |
| TMPL-03 | Phase 2 | Complete |
| INST-01 | Phase 3 | Complete |
| INST-02 | Phase 3 | Complete |
| INST-03 | Phase 3 | Complete |
| INST-04 | Phase 3 | Complete |
| INST-05 | Phase 3 | Complete |
| INST-06 | Phase 3 | Complete |
| INST-07 | Phase 3 | Complete |
| INST-08 | Phase 3 | Complete |
| DIST-01 | Phase 4 | Complete |
| DIST-02 | Phase 4 | Complete |
| DIST-03 | Phase 4 | Complete |
| DIST-04 | Phase 8 | Pending |
| VERT-01 | Phase 5 | Complete |
| VERT-02 | Phase 5 | Complete |
| VERT-03 | Phase 5 | Complete |
| HOOK-01 | Phase 6 | Complete |
| HOOK-02 | Phase 6 | Complete |
| HOOK-03 | Phase 6 | Complete |
| HOOK-04 | Phase 6 | Complete |
| SCRP-01 | Phase 6 | Complete |
| SCRP-02 | Phase 6 | Complete |
| BRND-01 | Phase 4 | Complete |
| VALD-01 | Phase 7 | Complete |
| VALD-02 | Phase 7 | Complete |
| VALD-03 | Phase 7 | Complete |
| VALD-04 | Phase 7 | Complete |
| VALD-05 | Phase 7 | Complete |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-03 after Phase 7 completion*
