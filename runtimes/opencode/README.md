# OpenCode Runtime Adapter

## Status: NOT BUILT (v1.1 target)

## What Needs to Be Created

1. **commands/motif/*.md** — Copy from `runtimes/claude-code/commands/motif/`, replace workflow paths:
   - `.claude/get-motif/` → `.opencode/get-motif/`
   - Adapt any Claude Code-specific syntax

2. **agents/*.md** — Copy from `runtimes/claude-code/agents/`, adapt:
   - Replace `Task()` spawning with OpenCode's `agent()` mechanism
   - Update model profile references to OpenCode's format

3. **config-snippet.md** — Adapt CLAUDE-MD-SNIPPET.md for OpenCode's AGENTS.md format

## Key Differences from Claude Code
- Subagent spawning uses different syntax
- Model profiles managed via `opencode.json` instead of Claude Code settings
- Agent definitions may use different frontmatter format
- No hooks support (or different hook format) — skip hooks for now

## Testing
Run full workflow on a test project using OpenCode to verify:
- Commands resolve correctly
- Subagents spawn with fresh context
- State management works
- Commits follow convention
