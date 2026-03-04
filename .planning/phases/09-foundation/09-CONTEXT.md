# Phase 9: Foundation - Context

**Gathered:** 2026-03-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the foundational reference data for icon library integration: a curated icon library catalog (`icon-libraries.md`), domain affinity mapping, a deterministic selection algorithm, and icon size tokens for the token generation pipeline. All downstream phases (vertical vocabularies, pipeline integration, enforcement) read from this foundation.

</domain>

<decisions>
## Implementation Decisions

### Library-to-vertical pairing
- Claude's discretion on which library maps to which vertical — fully deferred to research findings
- User has no strong preference for any specific library; trusts research-based mapping
- Research suggested: Phosphor (fintech), Lucide (SaaS), Material Symbols (health, e-commerce), Tabler (fallback)

### Selection algorithm behavior
- Algorithm uses both vertical AND brand personality as inputs (not vertical alone)
- Weight changes within the selected library come first for personality expression
- Extreme personality scores can switch from primary to secondary library entirely
- Users CAN explicitly override the algorithm's library choice (e.g., via motif:init preference)
- Claude's discretion on how vocabulary adapts when user overrides the default library

### Icon size token scale
- Claude's discretion on whether to add a 36px token or round Health LogEntry to nearest
- Claude's discretion on whether tokens define just icon size or also container dimensions
- Claude's discretion on whether architect can adjust scale per project or keep it fixed
- Claude's discretion on rem vs px units — should be consistent with existing token system

### Secondary library role
- Secondary library = personality override pool (NOT gap fallback)
- One library per project — no mixing libraries in the same output
- Vertical vocabularies use library-agnostic semantic roles (e.g., "merchant", "transfer") mapped to concrete icon names per library
- Claude's discretion on whether icon weight is part of algorithm output or composer-decided contextually

</decisions>

<specifics>
## Specific Ideas

- Selection algorithm should mirror how font/color differentiation already works in Motif — vertical sets the baseline, personality shifts the expression
- "One library per project, no mixing" — visual consistency is more important than coverage breadth
- Library-agnostic semantic roles in vocabularies enable library swapping without rewriting the vocabulary itself

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-foundation*
*Context gathered: 2026-03-04*
