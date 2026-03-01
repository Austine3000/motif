# Requirements: Motif

**Defined:** 2026-03-01
**Core Value:** Domain-intelligent design delivered through fresh context — a fintech app must look like fintech, not meditation, and screen 5 must be as good as screen 1.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Agents

- [ ] **AGNT-01**: Researcher agent definition with explicit context-loading profile and model selection
- [ ] **AGNT-02**: System Architect agent definition for design system generation with context profile
- [ ] **AGNT-03**: Screen Composer agent definition enforcing token compliance with fresh 200K context
- [ ] **AGNT-04**: Design Reviewer agent definition for 4-lens evaluation with context profile
- [ ] **AGNT-05**: Fix Agent definition for systematically fixing review findings with context profile

### Templates

- [ ] **TMPL-01**: STATE-TEMPLATE.md matching format defined in state-machine.md
- [ ] **TMPL-02**: SUMMARY-TEMPLATE.md matching format defined in compose-screen.md
- [ ] **TMPL-03**: Token showcase HTML — self-contained page displaying all design tokens visually

### Installer

- [ ] **INST-01**: `npx motif@latest` auto-detects Claude Code runtime and installs
- [ ] **INST-02**: Copies core/ to `.claude/get-motif/` and commands to `.claude/commands/motif/`
- [ ] **INST-03**: Injects config snippet into CLAUDE.md with sentinel markers (`<!-- MOTIF-START/END -->`)
- [ ] **INST-04**: Backs up existing files before overwrite on re-install
- [ ] **INST-05**: Manifest-based upgrade tracking (`.motif-manifest.json`) with content-hash diffing
- [ ] **INST-06**: Supports `--runtime`, `--force`, `--dry-run`, `--uninstall` CLI flags
- [ ] **INST-07**: Post-install verification confirms zero unresolved `{FORGE_ROOT}` path variables
- [ ] **INST-08**: Resolves `{FORGE_ROOT}` to correct runtime path at install time

### Distribution

- [ ] **DIST-01**: `package.json` with name "motif", bin field, files whitelist, engines >=22.0.0
- [ ] **DIST-02**: MIT LICENSE file
- [ ] **DIST-03**: README with pitch, install command, command reference, architecture diagram, how it works
- [ ] **DIST-04**: GitHub Actions CI workflow for automated npm publish on git tag

### Verticals

- [ ] **VERT-01**: Health vertical following fintech.md structure exactly
- [ ] **VERT-02**: SaaS vertical following fintech.md structure exactly
- [ ] **VERT-03**: E-commerce vertical following fintech.md structure exactly

### Hooks

- [ ] **HOOK-01**: Token-check PostToolUse hook flags hardcoded CSS values in .css/.tsx/.jsx/.vue/.html
- [ ] **HOOK-02**: Font-check PostToolUse hook flags banned fonts (unless user-locked)
- [ ] **HOOK-03**: A11y-check PostToolUse hook flags div+onClick, img without alt, inputs without labels
- [ ] **HOOK-04**: Context-monitor statusline hook displays context %, warns at 50%

### Scripts

- [ ] **SCRP-01**: Contrast checker — WCAG contrast ratio calculator, pure Node.js
- [ ] **SCRP-02**: Token counter — approximate token count in .planning/design/ files

### Rebrand

- [ ] **BRND-01**: Rename package, commands (`/forge:*` → `/motif:*`), install dirs, all references to "Motif"

### Validation

- [ ] **VALD-01**: End-to-end workflow completes on controlled test project (init → research → system → compose → review → fix)
- [ ] **VALD-02**: Battle test on real project (CryptoPay fintech) — full workflow succeeds
- [ ] **VALD-03**: Differentiation seed produces visibly different designs for same vertical
- [ ] **VALD-04**: Brand colors flow through token generation without being overridden
- [ ] **VALD-05**: Screen quality remains consistent across 5+ screens (fresh context works)

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
| AGNT-01 | Phase 1 | Pending |
| AGNT-02 | Phase 1 | Pending |
| AGNT-03 | Phase 1 | Pending |
| AGNT-04 | Phase 1 | Pending |
| AGNT-05 | Phase 1 | Pending |
| TMPL-01 | Phase 2 | Pending |
| TMPL-02 | Phase 2 | Pending |
| TMPL-03 | Phase 2 | Pending |
| INST-01 | Phase 3 | Pending |
| INST-02 | Phase 3 | Pending |
| INST-03 | Phase 3 | Pending |
| INST-04 | Phase 3 | Pending |
| INST-05 | Phase 3 | Pending |
| INST-06 | Phase 3 | Pending |
| INST-07 | Phase 3 | Pending |
| INST-08 | Phase 3 | Pending |
| DIST-01 | Phase 4 | Pending |
| DIST-02 | Phase 4 | Pending |
| DIST-03 | Phase 4 | Pending |
| DIST-04 | Phase 8 | Pending |
| VERT-01 | Phase 5 | Pending |
| VERT-02 | Phase 5 | Pending |
| VERT-03 | Phase 5 | Pending |
| HOOK-01 | Phase 6 | Pending |
| HOOK-02 | Phase 6 | Pending |
| HOOK-03 | Phase 6 | Pending |
| HOOK-04 | Phase 6 | Pending |
| SCRP-01 | Phase 6 | Pending |
| SCRP-02 | Phase 6 | Pending |
| BRND-01 | Phase 4 | Pending |
| VALD-01 | Phase 7 | Pending |
| VALD-02 | Phase 7 | Pending |
| VALD-03 | Phase 7 | Pending |
| VALD-04 | Phase 7 | Pending |
| VALD-05 | Phase 7 | Pending |

**Coverage:**
- v1 requirements: 35 total
- Mapped to phases: 35
- Unmapped: 0

---
*Requirements defined: 2026-03-01*
*Last updated: 2026-03-01 after roadmap creation*
