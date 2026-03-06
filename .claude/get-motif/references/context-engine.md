# Motif Context Engine

This file defines the context management strategy for Motif. Every orchestrator and agent MUST follow these rules. Context discipline is what separates Motif from a long-form prompt.

## Core Principle

**The orchestrator stays thin. Agents get fresh context. Work happens in clean windows.**

The main Claude Code session (the orchestrator) should NEVER exceed 30-40% context usage. All heavy work — research, screen composition, design review — happens in spawned subagents with fresh 200K token windows.

## Orchestrator Rules

1. **Read STATE.md** — determine what to do
2. **Read ONLY the file paths needed** — assemble context for the subagent
3. **Spawn subagent with Task()** — pass the assembled context as the prompt
4. **Collect result** — read the SUMMARY.md the subagent creates
5. **Update STATE.md** — track progress
6. **NEVER read full file contents into main context** — pass file PATHS to subagents, let them read in their fresh window

## Context Budgets

Every planning/design file has a maximum token budget. If a file exceeds its budget, it must be split or summarized.

| File | Max Tokens | Purpose |
|---|---|---|
| STATE.md | 500 | Phase tracking, screen status |
| PROJECT.md | 1,000 | Product context, vertical, stack |
| DESIGN-BRIEF.md | 1,000 | Aesthetic direction, constraints |
| DESIGN-RESEARCH.md | 3,000 | Synthesized research findings |
| research/*.md | 2,000 each | Raw research per dimension |
| tokens.css | 3,000 | Design tokens |
| DESIGN-SYSTEM.md | 3,000 | System documentation |
| COMPONENT-SPECS.md | 5,000 | Component XML specs |
| [screen]-SUMMARY.md | 500 each | Per-screen summary |
| [screen]-REVIEW.md | 1,000 each | Per-screen review |
| ICON-CATALOG.md | 1,000 | Per-project icon name lookup for composer |
| TOKEN-INVENTORY.md | 1,500 | Existing token inventory (brownfield) |
| COMPONENT-GAP.md | 800 | Component gap analysis (brownfield) |

**Total context budget for a fully-loaded subagent**: ~15,000 tokens of context files, leaving ~185,000 tokens for the actual work.

**Note:** The fully-loaded brownfield composer budget (with PROJECT-SCAN.md, CONVENTIONS.md, and COMPONENT-GAP.md) is ~15,000 tokens, well within budget. These artifacts are loaded conditionally via `load_if_exists` and add zero overhead in greenfield projects.

## Context Loading Profiles

Different commands need different slices of context. These profiles define exactly what each subagent type loads.

### Profile: Research Agent
```xml
<context_profile name="researcher">
  <always_load>
    .planning/design/PROJECT.md
    .planning/design/DESIGN-BRIEF.md
  </always_load>
  <load_if_exists>
    .claude/get-motif/references/verticals/{vertical}.md
  </load_if_exists>
  <never_load>
    tokens.css
    COMPONENT-SPECS.md
    Any screen source code
  </never_load>
</context_profile>
```

### Profile: System Generator
```xml
<context_profile name="system-generator">
  <always_load>
    .planning/design/PROJECT.md
    .planning/design/DESIGN-BRIEF.md
    .planning/design/DESIGN-RESEARCH.md
  </always_load>
  <load_if_exists>
    .planning/design/research/02-visual-language.md
    .planning/design/research/03-accessibility.md
    .claude/get-motif/references/verticals/{vertical}.md
    .claude/get-motif/references/icon-libraries.md
    .planning/design/TOKEN-INVENTORY.md
    .planning/design/COMPONENT-GAP.md
    .planning/design/PROJECT-SCAN.md
    .planning/design/CONVENTIONS.md
  </load_if_exists>
  <never_load>
    research/01-vertical-patterns.md (already synthesized in DESIGN-RESEARCH.md)
    research/04-competitor-audit.md (already synthesized)
    Any screen source code
  </never_load>
</context_profile>
```

### Profile: Screen Composer
```xml
<context_profile name="composer">
  <always_load>
    .planning/design/PROJECT.md
    .planning/design/system/tokens.css
    .planning/design/system/COMPONENT-SPECS.md
    .planning/design/system/ICON-CATALOG.md
  </always_load>
  <load_if_exists>
    .planning/design/DESIGN-RESEARCH.md
    .planning/design/screens/{previous-screen}-SUMMARY.md (for consistency)
    .planning/design/PROJECT-SCAN.md
    .planning/design/CONVENTIONS.md
    .planning/design/COMPONENT-GAP.md
  </load_if_exists>
  <never_load>
    DESIGN-BRIEF.md (decisions already encoded in tokens + research)
    Raw research files (already synthesized)
    Other screen source code (only summaries)
    DESIGN-SYSTEM.md (tokens.css + COMPONENT-SPECS.md are sufficient)
    icon-libraries.md (already distilled into ICON-CATALOG.md)
    TOKEN-INVENTORY.md (composer doesn't need token inventory -- tokens.css has the final tokens)
  </never_load>
</context_profile>
```

### Profile: Design Reviewer
```xml
<context_profile name="reviewer">
  <always_load>
    .planning/design/system/tokens.css
    .planning/design/system/COMPONENT-SPECS.md
    .planning/design/DESIGN-RESEARCH.md
    The actual source code of the screen being reviewed
  </always_load>
  <load_if_exists>
    .planning/design/PROJECT.md
    .planning/design/screens/{screen}-SUMMARY.md
    .planning/design/system/ICON-CATALOG.md
  </load_if_exists>
  <never_load>
    DESIGN-BRIEF.md
    Raw research files
    Other screens (unless checking cross-screen consistency)
  </never_load>
</context_profile>
```

### Profile: Fix Agent
```xml
<context_profile name="fixer">
  <always_load>
    .planning/design/reviews/{screen}-REVIEW.md
    .planning/design/system/tokens.css
    .planning/design/system/COMPONENT-SPECS.md
    The actual source code of the screen being fixed
  </always_load>
  <never_load>
    Research files
    DESIGN-BRIEF.md
    Other screen source code
  </never_load>
</context_profile>
```

## Subagent Spawning Pattern

This is the exact pattern every orchestrator workflow uses to spawn a subagent:

```
## Step 1: Assemble context (orchestrator reads file PATHS, not contents)

Read STATE.md to determine:
- Current phase
- Which screen to work on
- Vertical name (for loading vertical reference)

## Step 2: Build the subagent prompt

The orchestrator constructs an XML prompt with:
- The agent's role and instructions (from agents/*.md)
- File paths the agent should read (NOT inlined content)
- The specific task to perform
- Where to save output
- Commit message to use

## Step 3: Spawn with Task()

Use Task() to spawn a fresh subagent. The prompt tells the agent to:
1. Read the files at the specified paths
2. Execute the task
3. Save output to the specified locations
4. Create a SUMMARY.md for the orchestrator
5. Commit with the specified message

## Step 4: Collect results

The orchestrator reads ONLY the SUMMARY.md — never the full output.
Updates STATE.md.
Decides what to do next.
```

## Anti-Patterns

These MUST be avoided:

1. **NEVER inline file contents in the orchestrator prompt.** Pass paths. Let the subagent read.
2. **NEVER use TaskOutput to read full subagent output.** Read the SUMMARY.md instead.
3. **NEVER accumulate context across multiple compose operations.** Each screen gets a fresh agent.
4. **NEVER load all research files when only the synthesis is needed.** DESIGN-RESEARCH.md exists to be the compressed version.
5. **NEVER load the full DESIGN-SYSTEM.md when tokens.css + COMPONENT-SPECS.md suffice.** The system doc is for humans, the tokens + specs are for agents.

## Context Monitoring

The orchestrator should check context usage after each subagent spawn cycle. If main context exceeds 50%, recommend the user run `/clear` before continuing. STATE.md preserves all progress — nothing is lost on clear.
