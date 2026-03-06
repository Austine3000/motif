# Requirements: Motif

**Defined:** 2026-03-04
**Core Value:** Domain-intelligent design delivered through fresh context — a fintech app must look like fintech, not meditation, and screen 5 must be as good as screen 1.

## v1.2 Requirements

Requirements for Brownfield Intelligence milestone. Each maps to roadmap phases.

### Scanning

- [x] **SCAN-01**: User can run a project scan that detects framework, directory layout, CSS approach, and naming conventions
- [x] **SCAN-02**: User can see a catalog of existing components found in the project (file path, export name)
- [x] **SCAN-03**: User can see a gap analysis comparing existing components against vertical-required components
- [x] **SCAN-04**: User can review and confirm/correct scan findings before any generation happens
- [x] **SCAN-05**: User can see extracted conventions from existing components (recurring patterns like border-radius, spacing, shadow usage)

### Tokens

- [x] **TOKN-01**: User can have existing CSS custom properties or Tailwind config tokens detected and presented
- [x] **TOKN-02**: User can choose token strategy: adopt existing, merge with Motif, or start fresh
- [x] **TOKN-03**: User can receive a selective token overlay that fills gaps without overwriting existing tokens

### Composition

- [x] **COMP-01**: User can receive decomposed screen output with one component per file
- [x] **COMP-02**: User can have composed files written to the project's actual directories (not just `.planning/`)
- [x] **COMP-03**: User can have existing project components imported and reused instead of recreated
- [x] **COMP-04**: User can have all decomposed files committed atomically with rollback on validation failure

## Future Requirements

### Convention Learning (v1.3+)

Convention extraction is included in v1.2 (SCAN-05). Deeper convention learning features deferred:

- **CONV-01**: User can have conventions automatically applied to all future compositions without re-scanning
- **CONV-02**: User can override extracted conventions with explicit preferences

### Multi-Runtime (v1.3+)

- **RUNT-01**: User can install Motif for OpenCode runtime
- **RUNT-02**: User can install Motif for Cursor runtime
- **RUNT-03**: User can install Motif for Gemini CLI runtime

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full AST parsing of existing components | Framework-specific parsers are npm dependencies; AI agents read source files better than parsed ASTs |
| Automatic code migration/refactoring | Touching existing working code destroys user trust; Motif is additive, not destructive |
| Runtime component discovery | Requires running dev server + browser automation; Motif operates at design-time via file analysis |
| Design system migration assistant | Motif coexists with existing design systems, does not replace them |
| Intelligent merge conflict resolution | Design decisions require human judgment; auto-merge is wrong as often as right |
| Cross-project design system sharing | Monorepo distribution is a separate concern from brownfield awareness |
| Storybook/docs generation | Separate tool category; existing tools (react-docgen, auto-docs) do this better |

## Traceability

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

**Coverage:**
- v1.2 requirements: 12 total
- Mapped to phases: 12
- Unmapped: 0

---
*Requirements defined: 2026-03-04*
*Last updated: 2026-03-06 after v1.2 milestone audit (all requirements satisfied)*
