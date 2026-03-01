# Feature Research

**Domain:** AI design engineering system / npm-distributed developer CLI tool
**Researched:** 2026-03-01
**Confidence:** MEDIUM-HIGH

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **One-command install via npx** | shadcn, v0, create-react-app all set the bar: `npx tool@latest` and it works. Any friction here kills adoption immediately. Users will not read troubleshooting docs for a tool they have not tried yet. | MEDIUM | Installer must auto-detect runtime (Claude Code vs others), copy files to correct locations, handle existing config gracefully (backup before overwrite), and provide clear success/failure output. Zero npm dependencies is the right call -- keeps install fast and avoids supply chain concerns. |
| **Clear help/progress commands** | Every CLI tool has `--help`. AI agent tools specifically need progress tracking because multi-step workflows are opaque. Users need to know "where am I?" at any point. | LOW | `/motif:help` and `/motif:progress` already built. Table stakes that are already satisfied. |
| **Working end-to-end workflow** | If init -> research -> system -> compose -> review -> fix does not complete successfully, the tool is broken. Users will try the full flow on first use and abandon if any step fails. | HIGH | All 7 workflows are built but unvalidated. The gap is testing, not implementation. Battle testing on a real project is critical before any public release. |
| **Design token output (CSS custom properties)** | CSS custom properties are the standard for design token distribution in 2026. The W3C DTCG spec reached its first stable version in October 2025, and CSS custom properties are universally supported. Every design system tool outputs them. | MEDIUM | Already designed in generate-system.md. Tokens must include reasoning comments (why this color, why this font) because AI agents will read them. Framework-agnostic CSS custom properties is the right choice -- Tailwind export can come later as a separate command. |
| **Component specifications** | Users expect generated design systems to include component-level specs, not just tokens. Tokens alone are not enough -- agents need to know how a Button uses the tokens. | MEDIUM | COMPONENT-SPECS.md format (XML specs per component) is already designed. The XML format is a good choice because it is structured enough for AI consumption but readable by humans. |
| **README with clear pitch, install, and usage** | npm packages without READMEs have near-zero adoption. The README is the product's storefront on npmjs.com. Must answer "what is this, who is it for, how do I start" in under 30 seconds of scanning. | LOW | Not built yet. Should include: one-line pitch, 15-second install, screenshot/GIF of token showcase output, command reference table, architecture diagram (text-based), and "how it works" section. |
| **MIT License** | Open source npm packages without licenses are legally unusable for many developers and companies. | LOW | Not built. Trivial to add. |
| **Atomic git commits per operation** | AI coding tools that touch files should commit atomically. Users expect to be able to `git revert` any single operation cleanly. Already a constraint in the spec. | LOW | Already designed into all workflows with `design(...)` prefix. Implementation depends on agents being built correctly. |
| **Idempotent operations** | Running `/motif:init` twice should not corrupt state. Running `/motif:research` again should cleanly overwrite previous research. Users will re-run commands when results are unsatisfactory. | LOW | Gate checks in workflows handle this. Init has a guard ("already initialized"). Other commands check STATE.md phase. |
| **package.json with correct bin field** | npm distribution requires a properly configured package.json. The `bin` field maps the CLI command name to the installer script. Without this, `npx motif@latest` does not work. | LOW | Not built. Straightforward: `{ "name": "motif", "bin": { "motif": "bin/install.js" } }`. No dependencies. |

### Differentiators (Competitive Advantage)

Features that set Motif apart. Not required by users of generic tools, but these ARE Motif's reason to exist.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Vertical/domain intelligence databases** | **This is the core differentiator.** No other tool researches your product vertical's design patterns before generating anything. v0, Emergent, and generic AI tools produce "one-size-fits-all" UI. Motif's fintech vertical knows that monetary values need tabular-nums, that negative amounts should NOT be red (red = error, not spending), and that trust signals matter more than aesthetics. This domain knowledge is what prevents "AI slop." | HIGH | Fintech vertical is built (226 lines, concrete values). Health, SaaS, and e-commerce are planned. Each vertical needs: navigation patterns, color systems with concrete hex values, typography pairings, spacing/density rules, component specs (TransactionRow for fintech, MetricCard for health), interaction patterns, accessibility specifics, and anti-patterns. Building each vertical well requires genuine design research, not just template filling. |
| **Differentiation seed system** | Two fintech apps built with Motif should NOT look identical. The differentiation seed (personality, temperature, formality, density, era on 1-10 scales) shifts hue ranges, saturation, typography personality, and spacing density. A "rebellious" fintech app gets violet/magenta instead of standard blue-teal. An "institutional" one gets conservative blue. This is unique -- no other tool has a parameterized differentiation system for the same vertical. | MEDIUM | Already designed in detail in generate-system.md (color decision algorithm with seed-adjusted hue ranges). The anti-convergence check (comparing against named competitor colors) is a particularly clever touch. Implementation complexity is in the agent correctly following the algorithm, not in the algorithm itself. |
| **Fresh context per screen (anti-degradation)** | Screen 5 in a multi-screen compose workflow must be as good as screen 1. Other AI tools degrade as context fills up. Motif spawns a fresh 200K-token agent for each screen, loading only the tokens, component specs, and previous screen summaries. The orchestrator stays thin (30-40% context). This is architecturally novel for a design tool. | HIGH | Context engine is fully designed with profiles per agent type, token budgets per file, and anti-patterns. Implementation depends on agents being correctly built to follow these profiles. Claude Code's subagent system (Task() -> fresh context) is the enabling technology. This pattern is well-documented in Claude Code docs (2026). |
| **4-lens design review with scoring** | Automated design review that checks: (1) token compliance (are you using the design system?), (2) vertical pattern adherence (does this look like fintech?), (3) accessibility (WCAG AA), (4) visual hierarchy. Scored /100. No other tool reviews AI-generated UI against domain-specific heuristics. v0 and Emergent generate but do not review. | MEDIUM | Review workflow is built. The review -> fix loop is also built. Differentiation is that reviews are domain-aware (a fintech review checks for tabular-nums on monetary values; a health review checks for calming color ratios). |
| **PostToolUse enforcement hooks** | Hooks that fire after every file edit to catch hardcoded CSS values, banned fonts, accessibility violations, and context budget overruns in real-time. Unlike review (which happens after composition), hooks enforce during composition. This is preventive, not corrective. | MEDIUM | Claude Code's hook system (2026) supports PostToolUse with matcher patterns, JSON stdin input, and exit code control. The hook receives the edited file path, can parse the content, and return structured JSON to block or warn. Four hooks planned: token-check (flag hardcoded colors/spacing), font-check (flag Inter/Roboto unless user-locked), a11y-check (flag div+onClick, missing alt, missing labels), context-monitor (warn at 50% context usage). |
| **Visual token showcase (HTML)** | A self-contained HTML file that displays all generated tokens visually: color swatches with hex values, typography scale samples, spacing visualization, component previews. Users can open this in a browser and immediately see their design system. This makes the abstract (CSS custom properties) tangible. | LOW | Already specified in generate-system.md. Self-contained (imports tokens.css + Google Fonts, no other deps). This is low complexity but high perceived value -- it is the "wow moment" after system generation. |
| **Brand color lock-in** | When users provide existing brand colors, Motif NEVER overrides them. The color decision algorithm generates scales (50-950) around the locked value, derives complementary surface/semantic/text colors, and adjusts surfaces (not the brand color) if WCAG contrast fails. Respecting existing brand identity is critical for the target audience (founders who already have a logo/brand). | MEDIUM | Algorithm fully designed. The key insight: if the locked primary color fails contrast, you adjust the surface color, not the primary. This is the correct behavior that generic tools get wrong. |
| **Figma/screenshot input support** | Users can provide Figma files, screenshots, or reference products, and Motif extracts or references their design language. Four input types: (A) starting fresh, (B) brand constraints, (C) visual references, (D) design file with fidelity modes (pixel-perfect, capture spirit, extract tokens). | MEDIUM | Already designed in design-inputs.md. This bridges the gap between "starting from nothing" and "I already have designs." Most AI design tools assume you are starting from scratch. |
| **State machine with persistence** | STATE.md tracks phase, screen status, review scores, decisions log, and context budget. Survives `/clear` commands. Enables resuming work across sessions. This is invisible infrastructure but critical for multi-session workflows -- design system generation is not a one-shot operation. | LOW | Fully designed in state-machine.md. Gate checks in every workflow verify correct phase transitions. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem good but create problems. Deliberately NOT building these.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| **Runtime UI/visual editor** | "I want to drag-and-drop to adjust my design system" | Motif runs inside AI coding assistants (Claude Code, etc). Building a GUI is a completely different product. It would require a web app, design canvas, state management -- 10x the scope. Motif's audience uses terminals and code editors, not visual design tools. v0 and Figma already own the visual editor space. | Token showcase HTML provides visual preview. Users tweak tokens.css directly (which AI agents can do conversationally). |
| **Tailwind export in v1** | "I use Tailwind, give me a tailwind.config.js" | Tailwind export creates a second source of truth. Changes to tokens.css would need to sync to tailwind.config.js and vice versa. Supporting both doubles testing surface. CSS custom properties work with Tailwind (you can reference them in config), so the CSS-first approach is not blocking Tailwind users. | Ship CSS custom properties only in v1. Tailwind export as a separate future command (v2). |
| **Multi-runtime support in v1** | "I use Cursor/OpenCode/Gemini, support me too" | Spreading across runtimes before proving the concept on one runtime means shipping untested adapters. Each runtime has different subagent spawning, hook formats, and config injection. Testing four runtimes quadruples QA. | Ship Claude Code only in v1. The core/runtime architecture already supports adding runtimes later by just creating a `runtimes/{name}/` directory. Zero core changes needed. OpenCode in v1.1, Cursor in v1.2, Gemini in v1.3. |
| **AI-powered design from scratch (no workflow)** | "Just give me a beautiful dashboard" | Single-prompt design generation is exactly the "AI slop" that Motif exists to prevent. Without research, without domain intelligence, without a design system, the output is generic. The whole point is the multi-step workflow: research -> system -> compose -> review -> fix. | The workflow IS the feature. `/motif:quick` exists for ad-hoc needs but still loads the design system for consistency. |
| **Component library / npm UI components** | "Ship pre-built React/Vue components" | Motif generates specs and tokens, not runtime code. Shipping a component library means picking a framework (React? Vue? Svelte?), maintaining compatibility, handling bundling, tree-shaking, SSR. This is a separate product (like shadcn, Radix, Chakra). Motif's specs are framework-agnostic by design. | Generate COMPONENT-SPECS.md with XML specs that AI agents use to write framework-specific code. The specs are the reusable artifact, not pre-built components. |
| **Real-time collaboration** | "My team should see the design system updates live" | Motif operates within a single developer's AI coding session. Real-time collab requires infrastructure (WebSockets, conflict resolution, presence). The audience is solo developers and founders, not design teams. | Design artifacts live in git. Collaboration happens through PRs and shared repos. STATE.md and tokens.css are plain files that merge cleanly. |
| **Automatic deployment/hosting** | "Deploy my design system documentation" | Hosting is out of scope. The token-showcase.html is a local file. Adding deployment means managing cloud accounts, domains, CI/CD for docs. | token-showcase.html opens locally. Users can deploy it themselves if they want (it is self-contained HTML). |
| **LLM provider abstraction** | "Let me use GPT-4 or Gemini models instead of Claude" | Motif's workflows use Claude Code-specific features (Task() subagent spawning, PostToolUse hooks, slash commands). Abstracting the LLM provider means abstracting the runtime, which is already handled by the core/runtime adapter architecture. The adapters ARE the LLM abstraction. | Each runtime adapter handles its own LLM. Claude Code uses Claude. OpenCode uses whatever OpenCode supports. The core design intelligence (verticals, workflows, specs) is LLM-agnostic -- only the thin adapter layer is runtime-specific. |

## Feature Dependencies

```
[package.json + LICENSE]
    |
    v
[Installer (bin/install.js)]
    |-- requires --> [package.json bin field]
    |-- requires --> [All core/ files to exist]
    |-- requires --> [All runtimes/claude-code/ files to exist]
    |-- copies ----> [commands, agents, hooks, core to target dirs]
    |
    v
[/motif:init (already built)]
    |-- requires --> [Installer completed successfully]
    |-- creates ---> [STATE.md, PROJECT.md, DESIGN-BRIEF.md]
    |
    v
[/motif:research (already built)]
    |-- requires --> [init completed (STATE = INITIALIZED)]
    |-- requires --> [Agents: forge-researcher.md]
    |-- uses ------> [Vertical database (e.g., fintech.md)]
    |-- creates ---> [DESIGN-RESEARCH.md, research/*.md]
    |
    v
[/motif:system (already built)]
    |-- requires --> [research completed (STATE = RESEARCHED)]
    |-- requires --> [Agent: forge-system-architect.md]
    |-- creates ---> [tokens.css, COMPONENT-SPECS.md, DESIGN-SYSTEM.md, token-showcase.html]
    |
    v
[/motif:compose (already built)]
    |-- requires --> [system generated (STATE = SYSTEM_GENERATED)]
    |-- requires --> [Agent: forge-screen-composer.md]
    |-- uses ------> [Hooks: token-check, font-check, a11y-check (enforcement during compose)]
    |-- creates ---> [Screen files, screen-SUMMARY.md]
    |
    v
[/motif:review (already built)]
    |-- requires --> [at least one screen composed]
    |-- requires --> [Agent: forge-design-reviewer.md]
    |-- creates ---> [screen-REVIEW.md with score /100]
    |
    v
[/motif:fix (already built)]
    |-- requires --> [review completed with issues]
    |-- requires --> [Agent: forge-fix-agent.md]
```

### Dependency Notes

- **Agents require the installer to place them**: All 5 agents must be built before the installer can copy them. However, during development they can be tested by placing files manually.
- **Hooks enhance compose but do not block it**: The compose workflow works without hooks. Hooks add enforcement (catching hardcoded values, banned fonts, a11y issues) but are not a hard dependency. This means hooks can ship in a later phase without blocking the core workflow.
- **Verticals enhance research but do not block it**: The research workflow works without a vertical reference file -- agents will research the vertical from general knowledge. Vertical databases add depth and specificity (concrete hex values, specific component specs) but are not required for the workflow to function.
- **Templates are consumed by agents**: STATE-TEMPLATE.md and SUMMARY-TEMPLATE.md define the format for agent outputs. Agents need to know these formats, but the formats are already defined in the reference docs (state-machine.md and compose-screen.md), so templates formalize what is already specified.
- **Token showcase enhances system generation**: The HTML file is generated alongside tokens.css. It is the visual verification artifact. Not strictly necessary for the workflow but dramatically improves user experience ("see your design system" vs "read CSS custom properties").
- **README and LICENSE are publishing dependencies**: Required for npm publish, not for functionality. Can be built last.
- **CI/publish automation depends on everything else**: GitHub Actions for npm publishing only makes sense once the package is complete and tested.

## MVP Definition

### Launch With (v1.0-alpha)

Minimum viable product -- what is needed to validate the concept with early adopters.

- [ ] **5 Claude Code agent definitions** -- Without agents, no workflow step can spawn subagents. This is the critical gap between "designed" and "functional."
- [ ] **3 core templates (STATE, SUMMARY, token-showcase)** -- Formalize output formats for agents.
- [ ] **Installer (bin/install.js)** -- Without this, users cannot install. Must handle Claude Code runtime detection and file placement.
- [ ] **package.json + LICENSE** -- Without these, npm publish is impossible.
- [ ] **Fintech vertical (already built)** -- Proves the concept with one vertical.
- [ ] **README** -- npm storefront. Must be good enough to convince someone to try `npx motif@latest`.
- [ ] **Full rebrand from Design Forge to Motif** -- Package name, commands, install dirs, all references. Ship with a clean identity.

### Add After Validation (v1.0-beta)

Features to add once the core workflow is proven end-to-end.

- [ ] **3 additional verticals (health, SaaS, e-commerce)** -- "Any vertical" is the pitch. One vertical does not prove generalizability. Trigger: after battle test confirms the vertical database pattern works.
- [ ] **4 PostToolUse hooks** -- Enforcement layer. Trigger: after compose workflow is tested and produces good output WITHOUT hooks (hooks should improve quality, not be load-bearing).
- [ ] **2 utility scripts (contrast-checker, token-counter)** -- Developer convenience. Trigger: after tokens.css generation is validated.
- [ ] **End-to-end battle test on real project** -- CryptoPay fintech vertical. Must prove: differentiation seed produces distinct outputs, brand colors lock in correctly, fresh context maintains quality across screens.

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] **OpenCode runtime support** -- v1.1. Core/runtime architecture already supports it. Just add `runtimes/opencode/` directory.
- [ ] **Cursor/Windsurf runtime support** -- v1.2. Note: no subagent support means degraded quality on multi-screen projects.
- [ ] **Gemini CLI runtime support** -- v1.3. Wait for Gemini CLI to stabilize.
- [ ] **Tailwind token export** -- v2. Separate command that generates tailwind.config.js from tokens.css.
- [ ] **Additional verticals (social, education, marketplace, devtools)** -- v2. Proves broader generalizability.
- [ ] **CHANGELOG** -- Post-v1 release cycle.
- [ ] **Figma MCP integration** -- v2. Figma's MCP server (beta 2025, evolving in 2026) could allow Motif to read design tokens directly from Figma files. This is a natural extension of the "design file input" (Type D) but requires MCP server stability.
- [ ] **W3C DTCG token format export** -- v2. The W3C Design Tokens Community Group spec reached first stable version in October 2025. Exporting tokens in DTCG JSON format alongside CSS custom properties would enable interoperability with tools like Style Dictionary, Penpot, and Tokens Studio.

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Agent definitions (5 agents) | HIGH | MEDIUM | P1 |
| Installer (bin/install.js) | HIGH | MEDIUM | P1 |
| package.json + LICENSE | HIGH | LOW | P1 |
| Rebrand to Motif | HIGH | MEDIUM | P1 |
| README | HIGH | LOW | P1 |
| Core templates (3) | MEDIUM | LOW | P1 |
| End-to-end test (controlled) | HIGH | MEDIUM | P1 |
| Health vertical | MEDIUM | MEDIUM | P2 |
| SaaS vertical | MEDIUM | MEDIUM | P2 |
| E-commerce vertical | MEDIUM | MEDIUM | P2 |
| PostToolUse hooks (4) | MEDIUM | MEDIUM | P2 |
| Utility scripts (2) | LOW | LOW | P2 |
| Battle test (real project) | HIGH | HIGH | P2 |
| CI/publish automation | MEDIUM | LOW | P2 |
| OpenCode adapter | LOW | MEDIUM | P3 |
| Cursor adapter | LOW | MEDIUM | P3 |
| Tailwind export | LOW | MEDIUM | P3 |
| DTCG JSON export | LOW | MEDIUM | P3 |
| Additional verticals (4+) | LOW | HIGH | P3 |

**Priority key:**
- P1: Must have for v1.0-alpha launch
- P2: Should have for v1.0-beta, add before public release
- P3: Nice to have, future consideration

## Competitor Feature Analysis

| Feature | v0 (Vercel) | shadcn/ui CLI | Figma MCP | Emergent | Motif |
|---------|-------------|---------------|-----------|----------|-------|
| **Install method** | Web app (no install) | `npx shadcn@latest init` | MCP server config | Web app | `npx motif@latest` |
| **Domain intelligence** | None -- generic | None -- generic | Reads existing Figma tokens | None -- generic | **Vertical databases with concrete values** |
| **Design token generation** | Generates with components | Copies pre-built tokens | Reads, does not generate | Generates with UI | **Generates with domain reasoning + differentiation** |
| **Component output** | Full React + Tailwind code | Copies full component source | Code Connect references | Full application code | **XML specs for AI agents to implement** |
| **Design review** | None | None | QA scanning (beta) | None | **4-lens domain-aware review scored /100** |
| **Context management** | N/A (web app) | N/A (one-shot) | N/A (MCP read) | Unknown | **Fresh 200K context per screen, orchestrator stays thin** |
| **Multi-screen quality** | Degrades | N/A | N/A | Unknown | **Consistent via fresh context isolation** |
| **Brand color support** | Limited | Theme selection only | Reads existing | Basic | **Lock-in with scale generation + contrast adjustment** |
| **Differentiation** | None -- same prompt = same output | 5 base color presets | N/A | None | **Parameterized seed (personality, temperature, formality, density, era)** |
| **Vertical specialization** | None | None | None | None | **Fintech, health, SaaS, e-commerce (and extensible)** |
| **Target user** | Developers wanting quick UI | Developers building component libraries | Developers with Figma designs | Non-technical founders | **Developers using AI coding tools who want domain-appropriate UI** |
| **Runtime dependency** | Browser | Node.js project | MCP-compatible editor | Browser | **AI coding assistant (Claude Code v1)** |

### Key Competitive Insights

1. **No tool does domain-specific design intelligence.** This is a genuine white space. v0, Emergent, and generic AI tools generate UI without understanding that fintech needs trust signals, health needs calming palettes, or e-commerce needs conversion patterns. Motif's vertical databases are the primary competitive moat.

2. **No tool reviews its own output against domain heuristics.** Code review tools (CodeRabbit, Qodo) review code quality. Design tools generate but do not review. Motif's 4-lens review that includes domain pattern adherence is unique.

3. **Context management is an unsolved problem for multi-screen generation.** v0 handles single screens well. No tool handles "build me 7 screens that are all consistent and all high quality." Motif's fresh-context-per-screen architecture directly addresses this.

4. **The shadcn install pattern is the gold standard for developer CLI tools.** `npx tool@latest init` with auto-detection, sensible defaults, and `--yes` for skipping prompts. Motif's installer should follow this pattern exactly.

5. **Figma MCP is a future convergence point, not a current competitor.** Figma's MCP server lets AI agents read design systems from Figma. Motif generates design systems for projects that do not have Figma files. They are complementary -- Motif could eventually read from Figma MCP as an input source (Type D: design file input).

## Sources

### Verified (MEDIUM-HIGH confidence)
- [Claude Code Hooks Documentation](https://code.claude.com/docs/en/hooks-guide) -- Official docs, verified PostToolUse format, JSON stdin, exit code control, matcher patterns, settings.json placement
- [Claude Code Subagents Documentation](https://code.claude.com/docs/en/sub-agents) -- Official docs, verified Task() spawning, fresh context per agent, agent file format, tool restrictions, permission modes
- [shadcn/ui CLI Documentation](https://ui.shadcn.com/docs/cli) -- Official docs, verified init command pattern, flags (--yes, --force, --template), package manager support
- [W3C DTCG Design Tokens Spec](https://www.designtokens.org/) -- Official site, first stable version October 2025, 10+ tools supporting the standard
- [Style Dictionary DTCG Support](https://styledictionary.com/info/dtcg/) -- Official docs, v4 first-class DTCG support
- [Figma MCP Server Blog](https://www.figma.com/blog/design-systems-ai-mcp/) -- Official Figma blog, MCP server for design system context
- [v0 by Vercel](https://v0.app/) -- Official site, AI UI generation capabilities

### WebSearch-sourced (MEDIUM confidence)
- [Fintech design patterns 2026](https://www.eleken.co/blog-posts/modern-fintech-design-guide) -- Domain-specific design conventions
- [AI coding agents comparison 2026](https://www.faros.ai/blog/best-ai-coding-agents-2026) -- Context management trends
- [Context engineering for coding agents](https://martinfowler.com/articles/exploring-gen-ai/context-engineering-coding-agents.html) -- Martin Fowler on context curation
- [Node.js CLI best practices](https://github.com/lirantal/nodejs-cli-apps-best-practices) -- GitHub, comprehensive CLI patterns
- [Vertical AI agents](https://www.ibm.com/think/topics/vertical-ai-agents) -- IBM, domain-specific AI specialization

### Project-internal (HIGH confidence)
- `core/references/context-engine.md` -- Context profiles, token budgets, anti-patterns
- `core/references/runtime-adapters.md` -- Install mapping, runtime detection, path resolution
- `core/workflows/generate-system.md` -- Color/typography/spacing decision algorithms
- `core/references/verticals/fintech.md` -- Concrete vertical database example (226 lines)
- `core/workflows/research.md` -- 4-agent parallel research orchestration
- `runtimes/claude-code/commands/forge/init.md` -- Interactive interview flow, auto-mode, vertical detection
- `GSD-PROJECT-SPEC.md` -- Full project architecture, what is built vs not built

---
*Feature research for: AI design engineering system (Motif)*
*Researched: 2026-03-01*
