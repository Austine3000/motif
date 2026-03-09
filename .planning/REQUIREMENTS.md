# Requirements: Motif

**Defined:** 2026-03-04
**Core Value:** Domain-intelligent design delivered through fresh context — a fintech app must look like fintech, not meditation, and screen 5 must be as good as screen 1.

## v1.2 Requirements (Complete)

All v1.2 Brownfield Intelligence requirements satisfied. See MILESTONES.md for details.

## v1.3 Requirements

Requirements for Global Reach milestone. Each maps to roadmap phases.

### Context Resilience

- [ ] **CTXR-01**: Every command auto-reads STATE.md as first action before gate checks, surviving /clear
- [ ] **CTXR-02**: STATE.md uses YAML frontmatter for machine-parseable phase, vertical, and stack fields
- [ ] **CTXR-03**: System infers phase from artifact presence when STATE.md is missing or corrupt
- [ ] **CTXR-04**: Status line displays current Motif phase and screen count on every agent turn

### Global CLI

- [ ] **GCLI-01**: User can install globally via `npm install -g motif-design`
- [ ] **GCLI-02**: User can run `motif init` to scaffold Motif into the current project from global install
- [ ] **GCLI-03**: User can run `motif status` to check version, phase, and screens composed
- [ ] **GCLI-04**: User can run `motif update` to sync project files from updated global package
- [ ] **GCLI-05**: User can run `motif doctor` to validate installation integrity (files, hooks, CLAUDE.md)
- [ ] **GCLI-06**: Both `npm install -g` and `npx motif-design@latest` install paths work correctly

### Verticals

- [ ] **VERT-01**: Social vertical reference with full design intelligence (palettes, typography, components, spacing, interaction patterns, accessibility)
- [ ] **VERT-02**: Education vertical reference with full design intelligence
- [ ] **VERT-03**: Marketplace vertical reference with full design intelligence
- [ ] **VERT-04**: DevTools vertical reference with full design intelligence
- [ ] **VERT-05**: Each new vertical includes icon vocabulary mapped across all 4 icon libraries (Lucide, Phosphor, Material Symbols, Tabler)
- [ ] **VERT-06**: Each new vertical includes domain-specific empty/error/loading state patterns
- [ ] **VERT-07**: User can run `motif list` to see available verticals with descriptions

## Future Requirements

### Cross-Vertical (v1.4+)

- **XVERT-01**: System can blend design patterns from two verticals for hybrid projects
- **XVERT-02**: User can migrate from one vertical to another without losing composed screens

### State Enhancements (v1.4+)

- **STATE-01**: Checkpoint commits with state tags (motif/phase/SYSTEM_GENERATED) for git-based recovery
- **STATE-02**: Rich decision logging with reasoning, source, and date per entry

### Convention Learning (v1.4+)

- **CONV-01**: User can have conventions automatically applied to all future compositions without re-scanning
- **CONV-02**: User can override extracted conventions with explicit preferences

### Multi-Runtime (v1.4+)

- **RUNT-01**: User can install Motif for OpenCode runtime
- **RUNT-02**: User can install Motif for Cursor runtime
- **RUNT-03**: User can install Motif for Gemini CLI runtime

## Out of Scope

| Feature | Reason |
|---------|--------|
| Global config file (~/.motifrc) | Per-project design prevents cookie-cutter output across unrelated projects |
| Auto-detect vertical from codebase | Vertical is user intent, not tech stack — package.json can't determine domain |
| Plugin/extension system | Premature before v2.0 stability — community verticals via PRs instead |
| Database-backed state (SQLite) | AI agents read files, not databases — markdown is the native format |
| Real-time multi-session sync | Single-session per project is sufficient — filesystem provides eventual consistency |
| Exhaustive vertical coverage (20+) | 8 excellent verticals cover 80% of use cases — quality over quantity |
| Vertical-specific code generation templates | Verticals define DESIGN patterns, not code — AI agent handles framework translation |
| Daemon/background process | Hook-based architecture is zero-overhead when agent isn't writing files |
| Full AST parsing of existing components | Framework-specific parsers are npm dependencies; AI agents read source files better |
| Automatic code migration/refactoring | Touching existing working code destroys user trust; Motif is additive |

## Traceability

### v1.2 (Complete)

| Requirement | Phase | Status |
|-------------|-------|--------|
| SCAN-01 | Phase 13 | Satisfied |
| SCAN-02 | Phase 13 | Satisfied |
| SCAN-03 | Phase 14 | Satisfied |
| SCAN-04 | Phase 13 | Satisfied |
| SCAN-05 | Phase 13 | Satisfied |
| TOKN-01 | Phase 14 | Satisfied |
| TOKN-02 | Phase 14 | Satisfied |
| TOKN-03 | Phase 14 | Satisfied |
| COMP-01 | Phase 15 | Satisfied |
| COMP-02 | Phase 15 | Satisfied |
| COMP-03 | Phase 15 | Satisfied |
| COMP-04 | Phase 16 | Satisfied |

### v1.3

| Requirement | Phase | Status |
|-------------|-------|--------|
| CTXR-01 | Phase 17 | Pending |
| CTXR-02 | Phase 17 | Pending |
| CTXR-03 | Phase 17 | Pending |
| CTXR-04 | Phase 17 | Pending |
| VERT-01 | Phase 18 | Pending |
| VERT-02 | Phase 18 | Pending |
| VERT-03 | Phase 18 | Pending |
| VERT-04 | Phase 18 | Pending |
| VERT-05 | Phase 18 | Pending |
| VERT-06 | Phase 18 | Pending |
| GCLI-01 | Phase 19 | Pending |
| GCLI-02 | Phase 19 | Pending |
| GCLI-06 | Phase 19 | Pending |
| GCLI-03 | Phase 20 | Pending |
| GCLI-04 | Phase 20 | Pending |
| GCLI-05 | Phase 20 | Pending |
| VERT-07 | Phase 20 | Pending |

**Coverage:**
- v1.3 requirements: 17 total
- Mapped to phases: 17
- Unmapped: 0

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-09 after v1.3 roadmap created*
