# Phase 1: Agent Definitions - Context

**Gathered:** 2026-03-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Create the 5 subagent personality definitions (researcher, system-architect, screen-composer, design-reviewer, fix-agent) as markdown files in `runtimes/claude-code/agents/`. Each definition tells the workflow orchestrator exactly how to spawn that agent — context loading profile, model selection, tool restrictions, personality, and output format expectations. The context-engine.md and workflow files are read-only inputs; this phase produces the agent definition files they reference.

</domain>

<decisions>
## Implementation Decisions

### Personality depth
- Role-focused approach — clear role descriptions with behavioral guidelines, not named characters
- Agents should lean into their roles: reviewer defaults to being strict/critical, composer defaults to being creative/bold, researcher defaults to being exhaustive
- Include both positive and negative instructions — explicit "NEVER do X" alongside "ALWAYS do Y" where it matters for quality
- Domain-aware personas — agents should reference design concepts explicitly (color theory, typography hierarchy, accessibility) since Motif is a design system

### Model assignment
- Tiered by impact — composer and reviewer get top-tier models (they shape final output), researcher and fixer get mid-tier
- Configurable with defaults — agent definitions specify a default model but allow override via a setting or flag
- All 4 research sub-agents use the same model for simplicity
- Use abstract tiers (high/medium/fast) so definitions stay valid as new models release; a separate config maps tiers to model IDs

### Definition file structure
- YAML frontmatter + markdown body — frontmatter for structured data (model tier, tools, context profile), markdown body for personality and instructions. Matches existing workflow file conventions
- Context loading profiles moved into agent definitions — each file is self-contained with personality, context, model, and tools in one place. Context-engine.md becomes the architectural reference, not the operational one
- Shared skeleton with unique sections — common sections (model, tools, context) are standardized across all 5 agents, but each can have role-specific sections (e.g., reviewer has scoring rubric, researcher has dimension specifications)
- Claude Code only for now — build for the current runtime, don't over-engineer for hypothetical runtimes

### Output format expectations
- Minimal in agent definitions — agent definitions describe what artifact type to produce, but actual templates (Phase 2) define the format. Avoids duplication between phases
- Orchestrator decides output paths — agent definitions describe what they produce, orchestrators pass output paths when spawning. More flexible and keeps agents reusable
- Summaries only where needed — researcher and composer produce SUMMARY.md (large outputs), reviewer and fixer don't need them (output is already concise)
- Include short examples — each agent definition has a brief example of what good output looks like to calibrate model behavior

### Claude's Discretion
- Exact personality wording and tone calibration per agent
- Specific tool restriction lists per agent
- Whether to include anti-patterns in each definition
- Internal section ordering within the shared skeleton

</decisions>

<specifics>
## Specific Ideas

- Existing workflow files (research.md, compose-screen.md, review.md, fix.md, generate-system.md) already contain inline agent prompts — agent definitions should extract and formalize these, not duplicate them
- Context-engine.md context loading profiles should be consolidated into agent definitions so each file is self-contained
- YAML frontmatter should mirror the style already used in workflow files (see `allowed-tools` and `description` fields in existing workflows)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-agent-definitions*
*Context gathered: 2026-03-01*
