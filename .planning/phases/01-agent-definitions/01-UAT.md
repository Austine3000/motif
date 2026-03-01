---
status: complete
phase: 01-agent-definitions
source: [01-01-SUMMARY.md, 01-02-SUMMARY.md, 01-03-SUMMARY.md]
started: 2026-03-01T14:35:00Z
updated: 2026-03-01T14:50:00Z
---

## Current Test

[testing complete]

## Tests

### 1. All 5 agent files exist with valid YAML frontmatter
expected: `runtimes/claude-code/agents/` contains exactly 5 files: forge-researcher.md, forge-system-architect.md, forge-screen-composer.md, forge-design-reviewer.md, forge-fix-agent.md. Each starts with `---` YAML frontmatter containing name, description, model, and tools fields.
result: pass

### 2. Model tiers match user decisions
expected: forge-researcher.md and forge-system-architect.md and forge-fix-agent.md all have `model: sonnet`. forge-screen-composer.md and forge-design-reviewer.md have `model: opus`. Each model line includes a tier comment (e.g., `# Tier: MEDIUM` or `# Tier: HIGH`).
result: pass

### 3. Tool restrictions enforce separation of concerns
expected: forge-researcher.md has `disallowedTools: [Edit]` (creates files, never edits). forge-design-reviewer.md has `disallowedTools: [Edit]` (diagnoses, never fixes). forge-screen-composer.md has Edit in tools (needs to modify tokens.css). forge-fix-agent.md has Edit in tools (needs to edit source code).
result: pass

### 4. Context loading profiles are self-contained
expected: Each agent file has "Always Load", "Load If Exists", and "Never Load" sections (or a subset -- fix agent correctly omits "Load If Exists"). Profiles match context-engine.md without requiring runtime cross-reference. The composer loads tokens.css and COMPONENT-SPECS.md; the reviewer loads tokens.css, COMPONENT-SPECS.md, DESIGN-RESEARCH.md, and screen source; the fix agent loads REVIEW.md as primary input.
result: pass

### 5. Behavioral instructions use ALWAYS/NEVER pattern with domain specificity
expected: Each agent has positive (ALWAYS) and negative (NEVER) instructions. Instructions reference specific design concepts, not generic advice. For example, researcher references "color temperature, saturation levels, contrast strategies" -- not just "be thorough." Composer references token compliance. Reviewer references grep-based verification. Fix agent references scope limitations.
result: pass

### 6. Role-specific sections differentiate each agent
expected: Composer has an "Anti-Slop Checklist" and "Self-Review Checklist". Reviewer has a "4-Lens Scoring Rubric" (Nielsen /30, WCAG /25, System Compliance /25, Vertical UX /20) and "Issue Format Specification". Fix agent has "Fix Priority Order" and "Scope Restrictions". These sections are unique to each agent's role.
result: pass

### 7. Brief examples calibrate expected output quality
expected: Each agent file includes a brief example (5-8 lines) demonstrating what good output looks like. Researcher example shows a real-product-backed pattern entry. System architect example shows a well-justified CSS token with comments. Composer example shows token-compliant JSX. Reviewer example shows a finding with Location/Problem/Impact/Fix. Fix agent example shows mechanical fix behavior.
result: pass

### 8. Shared skeleton pattern is consistent across all 5 files
expected: All 5 agent files follow the same structural skeleton: YAML frontmatter → Role Identity → Context Loading Profile → Domain Expertise → Output Format → Quality Checklist → Brief Example. Section ordering and naming is consistent, making any agent file predictable to read.
result: pass

## Summary

total: 8
passed: 8
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
