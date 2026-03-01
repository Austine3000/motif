# Phase 1: Agent Definitions - Research

**Researched:** 2026-03-01
**Domain:** Claude Code custom subagent definitions (YAML frontmatter + markdown personality files)
**Confidence:** HIGH

## Summary

Phase 1 creates five agent definition files that transform the existing workflow orchestrators from "designed but inert" to "fully executable." The existing workflows (`core/workflows/*.md`) already contain inline agent prompts inside `<agent_spawn>` blocks -- these tell agents WHAT to do. The agent definitions tell agents WHO they are: personality, model tier, tool restrictions, context loading profiles, and output format expectations. Without these files, every `Task()` call in the workflows spawns a generic agent with no domain expertise, no tool restrictions, and no context discipline.

Claude Code's custom subagent system uses markdown files with YAML frontmatter placed in `.claude/agents/`. The format is well-documented and stable: required fields are `name` and `description`; optional fields include `tools`, `disallowedTools`, `model`, `permissionMode`, `maxTurns`, `skills`, `mcpServers`, `hooks`, `memory`, `background`, and `isolation`. The markdown body becomes the system prompt. Model aliases (`sonnet`, `opus`, `haiku`, `inherit`) map to the latest versions -- currently Sonnet 4.6 and Opus 4.6. This maps cleanly to the user's decision for abstract tiers (high/medium/fast).

The key architectural insight is that agent definitions and workflow files serve complementary roles. Workflows define the task (what context to load, what output to produce, where to save it). Agent definitions define the persona (how to think about the task, what design concepts to reference, what quality bar to enforce). The orchestrator assembles both when constructing a `Task()` call. Each agent definition must be self-contained with its context-loading profile (extracted from `core/references/context-engine.md`), so a workflow orchestrator can read the agent file and know exactly what to pass to `Task()`.

**Primary recommendation:** Build five agent definition files using Claude Code's native `.claude/agents/*.md` format with YAML frontmatter for structured config (model, tools) and markdown body for personality/instructions. Use `model: opus` for composer and reviewer (high-impact, shape final output), `model: sonnet` for researcher and system-architect (mid-tier), and `model: haiku` for fix-agent (follows prescriptive review instructions). Include context-loading profiles inline in each definition so files are self-contained.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Personality depth:**
- Role-focused approach -- clear role descriptions with behavioral guidelines, not named characters
- Agents should lean into their roles: reviewer defaults to being strict/critical, composer defaults to being creative/bold, researcher defaults to being exhaustive
- Include both positive and negative instructions -- explicit "NEVER do X" alongside "ALWAYS do Y" where it matters for quality
- Domain-aware personas -- agents should reference design concepts explicitly (color theory, typography hierarchy, accessibility) since Motif is a design system

**Model assignment:**
- Tiered by impact -- composer and reviewer get top-tier models (they shape final output), researcher and fixer get mid-tier
- Configurable with defaults -- agent definitions specify a default model but allow override via a setting or flag
- All 4 research sub-agents use the same model for simplicity
- Use abstract tiers (high/medium/fast) so definitions stay valid as new models release; a separate config maps tiers to model IDs

**Definition file structure:**
- YAML frontmatter + markdown body -- frontmatter for structured data (model tier, tools, context profile), markdown body for personality and instructions. Matches existing workflow file conventions
- Context loading profiles moved into agent definitions -- each file is self-contained with personality, context, model, and tools in one place. Context-engine.md becomes the architectural reference, not the operational one
- Shared skeleton with unique sections -- common sections (model, tools, context) are standardized across all 5 agents, but each can have role-specific sections (e.g., reviewer has scoring rubric, researcher has dimension specifications)
- Claude Code only for now -- build for the current runtime, don't over-engineer for hypothetical runtimes

**Output format expectations:**
- Minimal in agent definitions -- agent definitions describe what artifact type to produce, but actual templates (Phase 2) define the format. Avoids duplication between phases
- Orchestrator decides output paths -- agent definitions describe what they produce, orchestrators pass output paths when spawning. More flexible and keeps agents reusable
- Summaries only where needed -- researcher and composer produce SUMMARY.md (large outputs), reviewer and fixer don't need them (output is already concise)
- Include short examples -- each agent definition has a brief example of what good output looks like to calibrate model behavior

### Claude's Discretion
- Exact personality wording and tone calibration per agent
- Specific tool restriction lists per agent
- Whether to include anti-patterns in each definition
- Internal section ordering within the shared skeleton

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

## Standard Stack

### Core

| Technology | Version/Format | Purpose | Why Standard |
|------------|---------------|---------|--------------|
| Claude Code custom subagents | `.claude/agents/*.md` | Agent definition format | Official Claude Code subagent system; YAML frontmatter + markdown body; loaded at session start; supports model, tools, permissions |
| YAML frontmatter | Standard YAML | Structured config (name, description, model, tools) | Required by Claude Code agent format; `name` and `description` are required fields |
| Markdown body | Standard markdown | System prompt / personality definition | Becomes the agent's system prompt; supports all markdown formatting |

### Supporting

| Technology | Purpose | When to Use |
|------------|---------|-------------|
| Model aliases (`sonnet`, `opus`, `haiku`) | Abstract model selection that maps to latest versions | Always use aliases, never pin to specific model IDs -- aliases auto-update when new models release |
| `tools` / `disallowedTools` fields | Control which Claude Code tools an agent can access | Use `tools` for allowlist (restrictive), `disallowedTools` for denylist (permissive) |
| `permissionMode` field | Control how agent handles permission prompts | Use `bypassPermissions` for agents that need to write files without asking; use `default` for read-only agents |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Model aliases (`opus`, `sonnet`, `haiku`) | Full model IDs (`claude-opus-4-6`) | Aliases auto-update but lose version pinning; user decided on abstract tiers, so aliases are correct |
| Inline context profiles in agent files | Keep profiles in context-engine.md only | User decided agent files should be self-contained; context-engine.md becomes architectural reference |
| Separate config file for model tier mapping | Inline model field in each agent | User wants abstract tiers mapped by a separate config; use comments in agent files to document the tier, use model alias in the field |

## Architecture Patterns

### Agent Definition File Placement

```
runtimes/claude-code/agents/           # Source (in repo)
  forge-researcher.md
  forge-system-architect.md
  forge-screen-composer.md
  forge-design-reviewer.md
  forge-fix-agent.md

.claude/agents/                        # Installed (in user project, via installer)
  forge-researcher.md
  forge-system-architect.md
  forge-screen-composer.md
  forge-design-reviewer.md
  forge-fix-agent.md
```

Note: The installer (Phase 3) copies from `runtimes/claude-code/agents/` to `.claude/agents/` per the install mapping in `runtime-adapters.md`. During development/testing, files are placed directly in `.claude/agents/` in the user project.

**Update on install path:** The existing `runtime-adapters.md` maps agents to `.claude/get-design-forge/agents/`, but Claude Code's native agent system expects files in `.claude/agents/`. Agent definition files MUST be placed in `.claude/agents/` to be discovered by Claude Code's subagent system. The installer mapping in `runtime-adapters.md` may need updating in Phase 3.

### Pattern 1: YAML Frontmatter + Markdown Body (Agent File Format)

**What:** Each agent definition is a single markdown file with YAML frontmatter for machine-readable config and a markdown body for the system prompt.

**When to use:** Every agent definition file.

**Format:**
```markdown
---
name: forge-[role]
description: [When Claude should delegate to this agent]
model: [opus|sonnet|haiku]
tools: [tool list]
---

[System prompt / personality / instructions]
```

**Source:** [Claude Code subagent docs](https://code.claude.com/docs/en/sub-agents)

### Pattern 2: Shared Skeleton with Role-Specific Sections

**What:** All 5 agent definitions follow a common section structure but each includes role-specific additions.

**When to use:** Every agent definition.

**Shared sections (in order):**
1. YAML frontmatter (name, description, model, tools)
2. Role identity and behavioral guidelines
3. Context loading profile (always_load, load_if_exists, never_load)
4. Domain expertise (design concepts the agent should reference)
5. Output format expectations (artifact type, summary requirements)
6. Quality checklist / self-review
7. Brief example of good output

**Role-specific additions:**
- Researcher: research dimension specifications, exhaustiveness requirements
- System Architect: decision algorithms, token format rules
- Screen Composer: anti-slop checklist, state coverage requirements, token compliance rules
- Design Reviewer: 4-lens scoring rubric, issue format, exact-fix requirements
- Fix Agent: fix priority order, scope restrictions

### Pattern 3: Context Loading Profiles Inline

**What:** Each agent definition includes its own context loading profile (extracted from `context-engine.md`), specifying `always_load`, `load_if_exists`, and `never_load` file lists.

**When to use:** Every agent definition.

**Why:** User decided agent files should be self-contained. The orchestrator reads the agent definition and knows exactly what files to pass to `Task()`. This eliminates the need to cross-reference `context-engine.md` at runtime.

**Example:**
```markdown
## Context Loading Profile

**Always load:**
- `.planning/design/PROJECT.md`
- `.planning/design/DESIGN-BRIEF.md`

**Load if exists:**
- `.claude/get-design-forge/verticals/{vertical}.md`

**Never load:**
- `tokens.css`
- `COMPONENT-SPECS.md`
- Any screen source code
```

### Pattern 4: Model Tier Abstraction

**What:** Agent definitions use Claude Code model aliases (`opus`, `sonnet`, `haiku`) which naturally provide abstract tiers.

**When to use:** The `model` field in every agent definition.

**Mapping (locked by user decision):**
| Tier | Alias | Used By | Rationale |
|------|-------|---------|-----------|
| High | `opus` | Screen Composer, Design Reviewer | Shape final output quality; complex creative/analytical reasoning |
| Medium | `sonnet` | Researcher (all 4 sub-agents), System Architect | Good reasoning at lower cost; research and system generation are important but follow prescriptive patterns |
| Fast | `haiku` | Fix Agent | Follows explicit review instructions; no creative judgment needed; fastest execution |

**Override mechanism:** Users can override via:
1. `CLAUDE_CODE_SUBAGENT_MODEL` env var (applies to all subagents)
2. `/model` command to change the main session model (affects `inherit` agents)
3. `ANTHROPIC_DEFAULT_OPUS_MODEL` / `ANTHROPIC_DEFAULT_SONNET_MODEL` / `ANTHROPIC_DEFAULT_HAIKU_MODEL` env vars to remap what each alias resolves to

This gives the user configurability WITHOUT needing a separate config file -- the Claude Code runtime already provides the override mechanisms.

### Anti-Patterns to Avoid

- **Do NOT put Task() syntax in agent definitions.** Agent definitions define WHO the agent is, not HOW it is spawned. The workflow orchestrator handles spawning.
- **Do NOT inline full file contents in agent definitions.** List file PATHS in the context profile. The agent reads files in its fresh context window.
- **Do NOT duplicate template formats.** Agent definitions describe WHAT artifact type to produce. Phase 2 templates define the exact format.
- **Do NOT include workflow logic.** Agent definitions have personality and rules. Workflows have steps and sequencing. Keep them separate.
- **Do NOT use `inherit` as the model alias.** User decided on explicit tiering. `inherit` would make agent behavior depend on whatever model the user's main session is using, which defeats the purpose of tiered quality.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Model tier abstraction | Custom config file mapping tiers to model IDs | Claude Code's built-in model aliases (`opus`, `sonnet`, `haiku`) + env var overrides | Aliases auto-update with new releases; env vars provide the override mechanism the user wants; zero custom code |
| Tool restriction enforcement | Custom tool validation logic | Claude Code's `tools` and `disallowedTools` frontmatter fields | Built into the runtime; enforced at the system level |
| Agent file discovery | Custom agent loading system | Claude Code's native `.claude/agents/` directory scanning | Files in `.claude/agents/` are auto-discovered at session start |
| Permission management | Custom permission system in agent prompts | Claude Code's `permissionMode` frontmatter field | Built-in modes: `default`, `acceptEdits`, `dontAsk`, `bypassPermissions`, `plan` |

**Key insight:** Claude Code's native subagent system provides model selection, tool restriction, and permission management out of the box. The agent definition files are just configuration + personality -- no custom infrastructure needed.

## Common Pitfalls

### Pitfall 1: Agent Files Not Discovered

**What goes wrong:** Agent definitions placed in `runtimes/claude-code/agents/` are not picked up by Claude Code because the runtime looks in `.claude/agents/`.
**Why it happens:** Confusion between source location (repo) and installed location (user project).
**How to avoid:** During development, place files in `.claude/agents/` for testing. The installer (Phase 3) handles copying from `runtimes/claude-code/agents/` to `.claude/agents/`. Also note: subagents are loaded at session start; after adding a file manually, restart the session or use `/agents` to reload.
**Warning signs:** Claude spawns a generic agent instead of the specialized one; agent doesn't follow the personality definition.

### Pitfall 2: Context Profile Drift from context-engine.md

**What goes wrong:** The inline context profiles in agent definitions diverge from what `context-engine.md` specifies, causing inconsistency.
**Why it happens:** Context profiles are now in two places (the agent file and the reference doc). When one is updated, the other may be forgotten.
**How to avoid:** Treat `context-engine.md` as the architectural REFERENCE (documents the WHY and the budgets). Agent definitions are the OPERATIONAL truth (documents the WHAT). Add a comment in each agent file noting the source: `<!-- Context profile extracted from context-engine.md -->`. During Phase 7 validation, verify they match.
**Warning signs:** Agents loading files they shouldn't (context bloat) or missing files they need (incomplete context).

### Pitfall 3: Personality Wording That's Too Vague

**What goes wrong:** Agent personality says "be thorough" or "produce quality output" -- generic instructions that don't change behavior.
**Why it happens:** Writing prompts that sound good but don't constrain behavior.
**How to avoid:** User decided on role-focused approach with domain-aware personas. Every instruction should reference specific design concepts. Not "review carefully" but "check that every color value references a CSS custom property from tokens.css; grep the source for hex values, rgb, hsl." Not "be creative" but "compose screens that feel domain-appropriate -- a fintech dashboard should feel precise and trustworthy, not playful."
**Warning signs:** Agent output is indistinguishable from what a generic agent would produce.

### Pitfall 4: Overlapping Responsibilities Between Agent and Workflow

**What goes wrong:** The agent definition repeats step-by-step workflow instructions, or the workflow repeats personality guidance. Changes must be made in two places.
**Why it happens:** Unclear boundary between "who you are" (agent) and "what to do" (workflow).
**How to avoid:** Clear rule: Agent definitions contain personality, domain expertise, quality rules, anti-patterns, and context profiles. Workflows contain step sequences, gate checks, output paths, and commit messages. The orchestrator COMBINES them when spawning.
**Warning signs:** Same instruction appears in both the agent definition and the workflow file.

### Pitfall 5: Tool Restrictions Too Permissive or Too Restrictive

**What goes wrong:** An agent gets tools it shouldn't have (reviewer accidentally editing files) or lacks tools it needs (composer can't write files).
**Why it happens:** Not mapping each agent's actual workflow needs to a precise tool set.
**How to avoid:** For each agent, trace through its workflow to determine exactly what tools it needs. See the tool mapping in the Code Examples section below.
**Warning signs:** Agent fails with "tool not available" errors, or agent modifies files it was supposed to only review.

### Pitfall 6: Description Field Not Specific Enough for Auto-Delegation

**What goes wrong:** Claude doesn't delegate to the correct agent because the `description` field is too vague.
**Why it happens:** In this project, agents are explicitly invoked by workflow orchestrators (not auto-delegated), but the description still matters for the `/agents` listing and for Claude's routing logic.
**How to avoid:** Write descriptions that match the language used in workflow files. For example, the research workflow says "You are a design pattern researcher" -- the agent description should echo this: "Design pattern researcher for domain-specific vertical research."
**Warning signs:** Claude routes tasks to the wrong agent or falls back to the generic agent.

## Code Examples

Verified patterns from official Claude Code documentation and existing project files.

### Agent Definition File Format (from Claude Code docs)

```markdown
---
name: forge-researcher
description: Design pattern researcher for domain-specific vertical research. Spawned by /forge:research workflow.
model: sonnet
tools: Read, Grep, Glob, WebFetch, WebSearch
---

[System prompt / personality / instructions go here]
```

**Source:** [Claude Code subagent docs](https://code.claude.com/docs/en/sub-agents) -- "Supported frontmatter fields" table

### Tool Restriction Mapping Per Agent

Based on tracing each agent's workflow requirements:

```
Researcher (forge-researcher):
  tools: Read, Grep, Glob, WebFetch, WebSearch
  Rationale: Read-only exploration + web research. No file creation needed
  (orchestrator passes output paths; agent writes via Bash git commands).
  NOTE: Needs Bash for git commits. Add: Bash

  Revised tools: Read, Grep, Glob, Bash, WebFetch, WebSearch
  disallowedTools: Write, Edit
  NOTE: Actually the researcher needs to WRITE research output files.

  Final tools: Read, Write, Grep, Glob, Bash, WebFetch, WebSearch
  disallowedTools: Edit
  Rationale: Writes new research files, commits with git. Does not edit
  existing files (creates new ones each time).

System Architect (forge-system-architect):
  tools: Read, Write, Grep, Glob, Bash
  Rationale: Reads context files, writes tokens.css + COMPONENT-SPECS.md +
  DESIGN-SYSTEM.md + token-showcase.html. Commits with git. No web research
  needed (research is already done). No Edit (creates new files).

Screen Composer (forge-screen-composer):
  tools: Read, Write, Edit, Grep, Glob, Bash
  Rationale: Full code authoring capabilities. Reads design system, writes
  screen source code, may need to edit tokens.css to add missing tokens.
  Commits with git.

Design Reviewer (forge-design-reviewer):
  tools: Read, Write, Grep, Glob, Bash
  disallowedTools: Edit
  Rationale: Reads source code and design system. Writes review report.
  Runs grep to detect violations (critical for Lens 3: System Compliance).
  Does NOT edit source code -- that's the fix agent's job. Commits review.

Fix Agent (forge-fix-agent):
  tools: Read, Write, Edit, Grep, Glob, Bash
  Rationale: Full code authoring. Reads review findings, edits source code
  to fix issues, may need to add tokens to tokens.css. Commits fixes.
```

### Existing Inline Agent Prompts (to extract and formalize)

The workflow files contain inline agent prompts that define WHAT each agent does. These become the operational portion of the agent definition. Key excerpts:

**From research.md (researcher):**
```
You are a design pattern researcher for {VERTICAL} products.
[...research instructions per dimension...]
Keep output UNDER 2000 tokens. Be specific, not verbose.
```

**From generate-system.md (system architect):**
```
You are a design system architect. Generate a complete, production-ready
design system based on domain research.
[...decision algorithms for color, typography, spacing, radii, shadows...]
```

**From compose-screen.md (screen composer):**
```
You are a senior frontend engineer and design system implementer. You
build production-ready screens that are design-system-consistent,
accessible, and follow domain-specific patterns.
[...anti-slop checklist, self-review checklist...]
```

**From review.md (design reviewer):**
```
You are a senior design critic and accessibility auditor. Review the
{SCREEN_NAME} screen rigorously.
[...4-lens framework with point allocation...]
CRITICAL: Every issue MUST include an exact fix.
```

**From fix.md (fix agent):**
```
You are a senior frontend engineer fixing design review findings.
[...follows review instructions exactly, maintains compliance...]
Do NOT refactor or restyle beyond what the review asks for.
```

### Context Loading Profile Format (from context-engine.md)

The profiles are currently in XML format in `context-engine.md`. For agent definitions, convert to a simpler markdown list format:

```markdown
## Context Loading Profile

### Always Load
- `.planning/design/system/tokens.css` -- design token source of truth
- `.planning/design/system/COMPONENT-SPECS.md` -- component specifications
- `.planning/design/DESIGN-RESEARCH.md` -- domain patterns (check LOCKED decisions)

### Load If Exists
- `.planning/design/PROJECT.md` -- product context
- `.planning/design/screens/{screen}-SUMMARY.md` -- what the composer intended

### Never Load
- `DESIGN-BRIEF.md` -- decisions already encoded in tokens + research
- Raw research files -- already synthesized
- Other screens (unless checking cross-screen consistency)
```

### Model Tier Comment Convention

Since the user wants abstract tiers but Claude Code uses concrete aliases, document the mapping in a comment within each agent file:

```markdown
---
name: forge-screen-composer
description: ...
model: opus  # Tier: HIGH -- shapes final screen output quality
tools: Read, Write, Edit, Grep, Glob, Bash
---
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Task() with inline prompts only | `.claude/agents/*.md` custom subagent files | Claude Code 2025-2026 | Agent definitions are now first-class; Task tool renamed to Agent tool (v2.1.63); `Task(...)` references still work as aliases |
| `allowed-tools` in workflow frontmatter | `tools` / `disallowedTools` in agent frontmatter | Claude Code subagent system | Tool restrictions are per-agent, not per-workflow; enforcement is at runtime level |
| Model specified via env var only | `model` field in agent frontmatter | Claude Code subagent system | Each agent can specify its own model tier; aliases auto-update |
| Manual agent routing | `description` field enables auto-delegation | Claude Code subagent system | Claude uses description to decide when to delegate; but for Motif, orchestrators invoke explicitly |

**Deprecated/outdated:**
- The `Task` tool was renamed to `Agent` in Claude Code v2.1.63. Existing `Task(...)` references still work as aliases, so the existing workflow files remain valid.
- `allowed-tools` in workflow frontmatter is the OLD pattern. The new pattern is `tools` in agent definition frontmatter. However, workflow files use `allowed-tools` for the ORCHESTRATOR (the main session), not for subagents. Both patterns coexist.

## Detailed Agent Specifications

### Agent 1: Researcher (forge-researcher.md)

**Requirement:** AGNT-01
**Role:** Researches domain-specific design patterns across 4 dimensions (vertical patterns, visual language, accessibility, competitor audit). The research workflow spawns 4 instances of this agent in parallel.
**Model tier:** Medium (`sonnet`) -- all 4 research sub-agents use the same model
**Key behavior:** Exhaustive, specific, cite examples from real products. Keep output under 2000 tokens per dimension.
**Context profile source:** `context-engine.md` "Profile: Research Agent"
**Unique section:** Research dimension specifications (what to investigate per dimension)
**Output:** Research findings file (e.g., `01-vertical-patterns.md`). Produces no SUMMARY.md -- the orchestrator reads the full research file for synthesis.
**Correction:** User decided researcher DOES produce SUMMARY.md for large outputs. However, looking at the workflow, the orchestrator reads all four research files directly for synthesis (Step 5). The research files themselves ARE the output (max 2000 tokens each). No separate SUMMARY.md needed -- the files are already compressed.

### Agent 2: System Architect (forge-system-architect.md)

**Requirement:** AGNT-02
**Role:** Generates complete design system (tokens.css, COMPONENT-SPECS.md, DESIGN-SYSTEM.md, token-showcase.html) from research findings.
**Model tier:** Medium (`sonnet`) -- follows prescriptive decision algorithms
**Key behavior:** Precise, justified. Every token value has a reasoning comment. Follows color/typography/spacing decision algorithms.
**Context profile source:** `context-engine.md` "Profile: System Generator"
**Unique section:** References to decision algorithms in `generate-system.md` workflow
**Output:** 4 files in `.planning/design/system/`

### Agent 3: Screen Composer (forge-screen-composer.md)

**Requirement:** AGNT-03
**Role:** Builds production-ready screens using the design system. One fresh agent per screen.
**Model tier:** High (`opus`) -- shapes final user-visible output; creative judgment needed
**Key behavior:** Creative but disciplined. Bold design choices within design system constraints. Zero hardcoded values.
**Context profile source:** `context-engine.md` "Profile: Screen Composer"
**Unique sections:** Anti-slop checklist, self-review checklist, state coverage requirements (default + loading + empty + error)
**Output:** Screen source code files + SUMMARY.md

### Agent 4: Design Reviewer (forge-design-reviewer.md)

**Requirement:** AGNT-04
**Role:** Reviews composed screens against 4 lenses: Nielsen's heuristics, WCAG accessibility, design system compliance, vertical UX compliance.
**Model tier:** High (`opus`) -- analytical judgment; shapes quality bar
**Key behavior:** Strict, critical, evidence-based. Must grep source code for violations. Every issue includes an exact fix.
**Context profile source:** `context-engine.md` "Profile: Design Reviewer"
**Unique sections:** 4-lens scoring rubric with point allocations, issue format specification, exact-fix requirement
**Output:** Review report (`{screen}-REVIEW.md`). No SUMMARY.md needed (review is already concise, max 1000 tokens).

### Agent 5: Fix Agent (forge-fix-agent.md)

**Requirement:** AGNT-05
**Role:** Systematically fixes review findings by following the reviewer's exact instructions.
**Model tier:** Fast (`haiku`) -- follows prescriptive fix instructions; no creative judgment
**Key behavior:** Mechanical, precise, scope-limited. Fix exactly what the review says. Do not refactor beyond the review scope.
**Context profile source:** `context-engine.md` "Profile: Fix Agent"
**Unique section:** Fix priority order (critical first, then major, then minor if time permits)
**Output:** Updated source code files + updated SUMMARY.md. No separate fix report (reviewer will re-review).

## Open Questions

1. **Agent file discovery path vs. installer path**
   - What we know: Claude Code discovers agents from `.claude/agents/`. The existing `runtime-adapters.md` maps agents to `.claude/get-design-forge/agents/`.
   - What's unclear: Do agent files in `.claude/get-design-forge/agents/` get discovered? Or must they be in `.claude/agents/`?
   - Recommendation: Place files in `.claude/agents/` for discovery. Update the installer mapping in Phase 3 to copy to `.claude/agents/` instead of `.claude/get-design-forge/agents/`. The source files in the repo stay at `runtimes/claude-code/agents/`.

2. **How orchestrators reference agent definitions**
   - What we know: Claude Code auto-delegates based on `description`. Orchestrators can also explicitly say "Use the forge-researcher subagent."
   - What's unclear: Do the existing workflow files need updating to reference agents by name? Currently they use inline prompts.
   - Recommendation: The workflow files are marked "do not modify" per the project spec. The orchestrator (workflow) constructs a Task() prompt that INCLUDES the inline instructions PLUS the agent personality. No workflow changes needed in Phase 1 -- the agent definitions AUGMENT the inline prompts, they don't replace them. In Phase 7 (validation), test whether explicit agent invocation produces better results than relying on auto-delegation.

3. **Fix Agent model tier: haiku vs. sonnet**
   - What we know: User said "researcher and fixer get mid-tier." But the fix agent follows prescriptive review instructions -- it doesn't need creative reasoning.
   - What's unclear: Whether `haiku` is sufficient for the fix agent's code editing tasks.
   - Recommendation: Start with `sonnet` (matching the user's "mid-tier" decision for fixer). If Phase 7 testing shows haiku produces equivalent results, downgrade then. The model field is trivially changeable.

4. **Naming convention: `forge-` prefix**
   - What we know: The project spec uses `forge-researcher.md`, `forge-system-architect.md`, etc. But the project is rebranding to "Motif" in Phase 4.
   - What's unclear: Should we use `forge-` prefix now and rename in Phase 4, or use `motif-` prefix now?
   - Recommendation: Use `forge-` prefix now, matching the existing naming convention in the project spec and the command prefix (`/forge:*`). Phase 4 rebrand will rename all files systematically.

## Sources

### Primary (HIGH confidence)
- [Claude Code subagent documentation](https://code.claude.com/docs/en/sub-agents) -- Complete reference for YAML frontmatter fields, model aliases, tool restrictions, file placement, and subagent capabilities. Verified 2026-03-01.
- [Claude Code model configuration](https://code.claude.com/docs/en/model-config) -- Model aliases (`sonnet`, `opus`, `haiku`), env var overrides, alias-to-version mapping. Verified 2026-03-01.
- Project file `core/references/context-engine.md` -- Context loading profiles per agent type (researcher, system-generator, composer, reviewer, fixer). Source of truth for what files each agent loads.
- Project file `core/workflows/research.md` -- Inline researcher agent prompt, parallel spawn pattern, output format.
- Project file `core/workflows/generate-system.md` -- Inline system architect agent prompt, decision algorithms, output specifications.
- Project file `core/workflows/compose-screen.md` -- Inline composer agent prompt, anti-slop checklist, self-review checklist.
- Project file `core/workflows/review.md` -- Inline reviewer agent prompt, 4-lens scoring rubric, exact-fix requirement.
- Project file `core/workflows/fix.md` -- Inline fix agent prompt, fix priority rules.
- Project file `GSD-PROJECT-SPEC.md` -- File naming conventions, architecture overview, file placement rules.

### Secondary (MEDIUM confidence)
- [Claude Code complete guide 2026](https://www.jitendrazaa.com/blog/ai/claude-code-complete-guide-2026-from-basics-to-advanced-mcp-2/) -- Practical guide on subagent configuration patterns.
- [VoltAgent awesome-claude-code-subagents](https://github.com/VoltAgent/awesome-claude-code-subagents) -- Collection of 100+ example subagent definitions showing community patterns.
- [Claude Code Deep Dive: Subagents in Action](https://medium.com/@the.gigi/claude-code-deep-dive-subagents-in-action-703cd8745769) -- Practical patterns for subagent usage.

### Tertiary (LOW confidence)
- None -- all findings verified against official documentation.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Claude Code subagent format is well-documented official API
- Architecture: HIGH -- File format, placement, and tool restrictions verified against official docs
- Pitfalls: HIGH -- Based on documented Claude Code behavior and analysis of existing project files
- Agent specifications: MEDIUM-HIGH -- Based on existing workflow inline prompts (verified) + user decisions (locked); exact personality wording is Claude's discretion

**Research date:** 2026-03-01
**Valid until:** 2026-04-01 (30 days -- Claude Code subagent system is stable)
