# Phase 7: Validation - Research

**Researched:** 2026-03-02
**Domain:** End-to-end workflow validation, design system quality assurance, integration testing
**Confidence:** HIGH

## Summary

Phase 7 validates the complete Motif product by running the full workflow (init, research, system, compose, review, fix) on both controlled and real projects. Unlike prior phases that tested individual components in isolation (hooks via stdin piping, installer via e2e-installer.js, verticals via structural inspection), this phase tests the *integrated system* -- verifying that workflows chain correctly, subagents receive proper context, design outputs exhibit quality, and key guarantees (brand color preservation, differentiation, fresh context isolation) hold under real conditions.

The validation requirements are fundamentally different from prior testing because they require *running Claude Code workflows end-to-end*, which means driving slash commands (/motif:init through /motif:fix) through the actual Claude Code runtime. This presents a key constraint: the validation phase cannot fully automate AI-driven workflow execution in a headless test harness. Instead, validation must combine scripted infrastructure checks (file existence, token compliance, structural validation) with manual workflow execution (actually running /motif:init in a test project). The plans should clearly separate what can be scripted from what requires human-in-the-loop execution.

**Primary recommendation:** Structure validation as three plans: (1) a controlled test project with scripted fixtures and automated verification, (2) a real-world CryptoPay battle test with manual execution and automated post-checks, and (3) differentiation/brand-color/consistency tests that can be partially scripted with fixture tokens.css files.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js built-ins | >=22.0.0 | fs, path, child_process, crypto | Zero-dependency project policy; package.json has no dependencies |
| Custom test harness | N/A | test/e2e-installer.js pattern | Established pattern from Phase 3; assert() + console output, no framework |
| Claude Code CLI | Current | Running /motif:* workflows | The actual runtime being validated |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| scripts/contrast-checker.js | Existing | Verify WCAG contrast in generated tokens | Automated post-check on tokens.css |
| scripts/token-counter.js | Existing | Verify context budgets in generated files | Automated post-check on all artifacts |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom assert harness | Jest/Vitest | Would require adding devDependencies to a zero-dep project; not worth it for validation scripts |
| Headless AI workflow automation | Scripted simulation | Cannot simulate Task() subagent spawning outside Claude Code runtime; manual execution unavoidable |

## Architecture Patterns

### Validation Structure
```
test/
├── e2e-installer.js         # [EXISTING] Installer lifecycle tests
├── validation/
│   ├── validate-workflow.js  # Post-execution structural checks
│   ├── validate-tokens.js    # Token quality and compliance checks
│   ├── validate-diff.js      # Differentiation comparison tool
│   └── fixtures/
│       ├── cryptopay/        # CryptoPay project fixture data
│       └── controlled/       # Controlled test project data
```

### Pattern 1: Two-Phase Validation (Setup + Execute + Verify)
**What:** Each validation requirement follows a three-step pattern: create a controlled environment, execute the workflow (manually or scripted), then run automated verification scripts against the output.
**When to use:** Every VALD requirement.
**How it works:**
1. **Setup** -- Create a test project directory with .claude/ pre-created, run the installer to deploy Motif files
2. **Execute** -- Run /motif:init through /motif:fix either manually (real workflow) or by creating fixture files that simulate workflow output
3. **Verify** -- Run Node.js verification scripts that check file existence, token compliance, structural correctness, and quality metrics

### Pattern 2: Fixture-Based Token Validation
**What:** For VALD-03 (differentiation) and VALD-04 (brand colors), create fixture DESIGN-BRIEF.md files with specific seeds/constraints, run /motif:system, then programmatically compare the output tokens.css files.
**When to use:** Differentiation and brand color tests.
**Example:**
```javascript
// Compare two tokens.css files for visual distinctness
function compareTokenFiles(tokensA, tokensB) {
  const colorsA = extractPrimaryColors(tokensA);
  const colorsB = extractPrimaryColors(tokensB);
  const hueDiff = Math.abs(colorsA.primaryHue - colorsB.primaryHue);
  return {
    hueDifference: hueDiff,
    fontsDifferent: colorsA.displayFont !== colorsB.displayFont,
    radiusDifferent: colorsA.radiusMd !== colorsB.radiusMd,
  };
}
```

### Pattern 3: Controlled Test Project
**What:** A pre-defined test project with known inputs (vertical: fintech, stack: React, differentiation seed with specific values) so outputs are predictable and verifiable.
**When to use:** VALD-01 (controlled test).
**Key property:** The controlled project uses --auto mode for /motif:init to skip the interactive interview, making the setup reproducible.

### Pattern 4: Post-Execution Checklist Verification
**What:** After manual workflow execution, run a verification script that checks all expected artifacts exist with correct structure.
**When to use:** VALD-01, VALD-02 (workflow completion checks).
**Example:**
```javascript
// Expected artifacts after full workflow
const WORKFLOW_ARTIFACTS = {
  init: ['PROJECT.md', 'DESIGN-BRIEF.md', 'STATE.md'],
  research: ['DESIGN-RESEARCH.md', 'research/01-vertical-patterns.md', 'research/02-visual-language.md',
             'research/03-accessibility.md', 'research/04-competitor-audit.md'],
  system: ['system/tokens.css', 'system/COMPONENT-SPECS.md', 'system/DESIGN-SYSTEM.md',
           'system/token-showcase.html'],
  compose: (screen) => [`screens/${screen}-ANALYSIS.md`, `screens/${screen}-SUMMARY.md`],
  review: (screen) => [`reviews/${screen}-REVIEW.md`],
};
```

### Anti-Patterns to Avoid
- **Trying to automate AI workflow execution:** The /motif:* commands run through Claude Code's slash command system with Task() subagent spawning. There is no way to script this outside the runtime. Accept manual execution and automate the verification.
- **Testing in the source repo:** All test projects must be created in /tmp or a clean directory to avoid polluting the Motif source tree with .planning/design/ artifacts.
- **Conflating unit tests with validation:** Phase 7 validates the *integrated system*, not individual components. The hooks, installer, and verticals already have unit-level verification from Phases 3-6.
- **Expecting pixel-perfect reproducibility from AI outputs:** Two runs of /motif:system with identical inputs will produce different tokens.css files because AI generation is non-deterministic. Validate properties (contrast ratios pass WCAG, font is not banned, structure matches template) not exact values.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| WCAG contrast checking | Custom contrast calculation | scripts/contrast-checker.js | Already exists, already verified in Phase 6 UAT |
| Token counting / budget validation | Custom char counter | scripts/token-counter.js | Already exists, verified in Phase 6 UAT |
| CSS value extraction from tokens.css | Complex regex parser | Simple line-by-line extraction targeting `:root { --var-name: value; }` | tokens.css follows a strict format defined in generate-system.md |
| Hex-to-HSL conversion | Manual math | Simple function (3 formulas) | Need this for hue comparison in differentiation test |
| File hash comparison | Custom hash logic | Already in e2e-installer.js (hashFileSha256) | Reuse existing pattern |

**Key insight:** Most verification tooling already exists from prior phases. The new validation scripts are *orchestrators* of existing tools, not novel implementations.

## Common Pitfalls

### Pitfall 1: Attempting to Script Claude Code Slash Commands
**What goes wrong:** Trying to programmatically invoke /motif:init, /motif:research etc. from a Node.js script. These commands require the Claude Code runtime with Task() support.
**Why it happens:** Natural instinct to automate everything.
**How to avoid:** Clearly separate validation into "setup + manual execution + automated verification" steps. The manual execution IS the test; the scripts verify the results.
**Warning signs:** Plan contains steps like "run /motif:init programmatically" or "invoke Task() from test harness."

### Pitfall 2: Non-Deterministic AI Output Comparison
**What goes wrong:** Asserting exact equality on AI-generated content (tokens.css, DESIGN-RESEARCH.md, screen code).
**Why it happens:** Treating AI-generated artifacts like deterministic program output.
**How to avoid:** Test *properties*, not *values*. Assert "primary color has WCAG AA contrast against surface" not "primary color is #10B981". Assert "display font is not in banned list" not "display font is DM Sans".
**Warning signs:** Tests that compare exact hex values, exact font names, or exact token counts.

### Pitfall 3: Context Pollution Between Test Runs
**What goes wrong:** Running multiple validation tests in the same directory, causing STATE.md from a previous run to interfere with gate checks.
**Why it happens:** Not cleaning up or isolating test environments.
**How to avoid:** Each validation test creates a fresh /tmp directory. Clean up after tests unless failure requires debugging.
**Warning signs:** "Phase is not INITIALIZED, stop" errors when they shouldn't occur.

### Pitfall 4: Skipping the Full Workflow for Speed
**What goes wrong:** Testing init and system in isolation but never running the complete init->research->system->compose->review->fix chain.
**Why it happens:** Each workflow step requires waiting for AI generation (minutes per step).
**How to avoid:** VALD-01 explicitly requires the FULL chain. Budget time accordingly. At minimum 30-60 minutes for a complete workflow run.
**Warning signs:** "We'll test compose separately" -- no, test the chain.

### Pitfall 5: Brand Color Validation Without Exact-Match Check
**What goes wrong:** Checking that tokens.css contains brand colors somewhere, but not verifying they appear as the exact --color-primary-500 value.
**Why it happens:** Fuzzy validation that only checks "color is present."
**How to avoid:** For VALD-04, the check must be exact: user provided #1A73E8, and --color-primary-500 in generated tokens.css must be exactly #1A73E8 (case-insensitive). The scale values (50-400, 600-950) should differ but 500 must be locked.
**Warning signs:** grep for the hex value anywhere in the file instead of specifically on the --color-primary-500 line.

### Pitfall 6: Confusing "Visibly Distinct" with "Any Difference"
**What goes wrong:** VALD-03 requires "visibly distinct" differentiation, but the test only checks "values are not identical."
**Why it happens:** Weak assertion criteria.
**How to avoid:** Define thresholds: primary hue difference >= 30 degrees, display fonts are different font families, border-radius scales differ by at least one step. "Visibly distinct" means a human would notice the difference at a glance.
**Warning signs:** Tests that only assert `colorA !== colorB` without quantifying the difference.

## Code Examples

### Extracting Primary Color HSL from tokens.css
```javascript
// Source: tokens.css format defined in generate-system.md workflow
function extractPrimaryHue(tokensContent) {
  const match = tokensContent.match(/--color-primary-500:\s*#([0-9a-fA-F]{6})/);
  if (!match) return null;
  const hex = match[1];
  const r = parseInt(hex.slice(0, 2), 16) / 255;
  const g = parseInt(hex.slice(2, 4), 16) / 255;
  const b = parseInt(hex.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return Math.round(h * 360);
}
```

### Verifying Brand Color Preservation (VALD-04)
```javascript
function verifyBrandColorPreservation(tokensContent, expectedHex) {
  const normalized = expectedHex.replace('#', '').toLowerCase();
  const lines = tokensContent.split('\n');
  for (const line of lines) {
    if (line.includes('--color-primary-500:')) {
      const match = line.match(/#([0-9a-fA-F]{6})/);
      if (match && match[1].toLowerCase() === normalized) {
        return { preserved: true, line: line.trim() };
      }
      return { preserved: false, actual: match ? match[1] : 'not found', expected: normalized };
    }
  }
  return { preserved: false, actual: 'token not found', expected: normalized };
}
```

### Verifying Workflow Artifact Completeness
```javascript
const DESIGN_DIR = '.planning/design';
const REQUIRED_AFTER_FULL_WORKFLOW = [
  'PROJECT.md', 'DESIGN-BRIEF.md', 'STATE.md', 'DESIGN-RESEARCH.md',
  'research/01-vertical-patterns.md', 'research/02-visual-language.md',
  'research/03-accessibility.md', 'research/04-competitor-audit.md',
  'system/tokens.css', 'system/COMPONENT-SPECS.md',
  'system/DESIGN-SYSTEM.md', 'system/token-showcase.html',
];

function verifyWorkflowArtifacts(projectDir, screens) {
  const designDir = path.join(projectDir, DESIGN_DIR);
  const missing = [];
  for (const file of REQUIRED_AFTER_FULL_WORKFLOW) {
    if (!fs.existsSync(path.join(designDir, file))) {
      missing.push(file);
    }
  }
  for (const screen of screens) {
    const summaryPath = path.join(designDir, 'screens', `${screen}-SUMMARY.md`);
    if (!fs.existsSync(summaryPath)) missing.push(`screens/${screen}-SUMMARY.md`);
  }
  return missing;
}
```

### Verifying Token Quality (WCAG, No Banned Fonts)
```javascript
const BANNED_FONTS = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Arial', 'Helvetica', 'system-ui'];

function validateTokenQuality(tokensContent) {
  const issues = [];

  // Check banned fonts (unless LOCKED by user)
  const fontLines = tokensContent.match(/--font-(display|body):\s*'([^']+)'/g) || [];
  for (const line of fontLines) {
    const fontMatch = line.match(/'([^']+)'/);
    if (fontMatch && BANNED_FONTS.includes(fontMatch[1])) {
      // Only flag if no LOCKED comment on same line
      if (!tokensContent.includes(`${fontMatch[1]}`) || !tokensContent.includes('LOCKED')) {
        issues.push(`Banned font: ${fontMatch[1]}`);
      }
    }
  }

  // Check that --color-primary-500 exists
  if (!tokensContent.includes('--color-primary-500:')) {
    issues.push('Missing --color-primary-500 token');
  }

  // Check contrast comments exist (system architect must document ratios)
  if (!tokensContent.includes('AA') && !tokensContent.includes('contrast')) {
    issues.push('No WCAG contrast annotations found in tokens.css');
  }

  return issues;
}
```

### STATE.md Phase Verification
```javascript
function verifyStatePhase(stateContent, expectedPhase) {
  const match = stateContent.match(/## Phase\n(\w+)/);
  if (!match) return { valid: false, error: 'Could not parse Phase from STATE.md' };
  return { valid: match[1] === expectedPhase, actual: match[1], expected: expectedPhase };
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual testing only | Scripted e2e-installer.js + manual UAT | Phase 3 (2026-03-02) | Established the test harness pattern used throughout |
| Trust that AI outputs are correct | PostToolUse hooks enforce compliance in real-time | Phase 6 (2026-03-02) | Hooks catch violations during compose/fix, reducing review burden |
| No differentiation system | Seed-based differentiation algorithm | Phase 5 (design-inputs.md) | VALD-03 validates this new system |
| No brand color preservation | LOCKED constraint flow-through | Phases 1-2 (design-inputs.md) | VALD-04 validates brand colors survive the full pipeline |

## Validation-Specific Insights

### What Can Be Automated vs. Manual

| Requirement | Can Automate | Must Be Manual | Reasoning |
|-------------|-------------|----------------|-----------|
| VALD-01: Controlled test | Post-execution verification (file checks, token quality) | Running /motif:init through /motif:fix | Workflow commands require Claude Code runtime |
| VALD-02: CryptoPay battle test | Post-execution verification | Full workflow execution | Real project requires real AI interaction |
| VALD-03: Differentiation | HSL comparison, font comparison, radius comparison | Running /motif:system twice with different seeds | Need AI to generate the tokens |
| VALD-04: Brand color preservation | Exact hex match on --color-primary-500 | Running /motif:init with brand colors then /motif:system | Need AI to generate with constraint |
| VALD-05: Screen consistency | Token compliance grep across 5+ screens | Composing 5+ screens sequentially | Need AI to compose each screen |

### The /motif:init --auto Shortcut
The init command supports --auto mode with flags: `--vertical fintech --stack react --theme dark`. This enables reproducible test setup without interactive interview. Controlled test projects SHOULD use this mode. Example:
```
/motif:init --auto --vertical fintech --stack react --theme light --density comfortable
```

### CryptoPay Project Specifics
Based on the fintech vertical and differentiation seed example in design-inputs.md, the CryptoPay test project should use:
- Vertical: fintech
- Personality: 7 (rebellious -- crypto/neobank)
- Temperature: 6 (warm -- Nigerian market, human feel)
- Era: 8 (cutting-edge -- crypto/web3)
- Expected behavior: Primary color should NOT be standard fintech teal; should shift toward violet/magenta per seed algorithm

### Screen Consistency Test Design (VALD-05)
The fresh context isolation test (5+ screens) should verify:
1. Each screen's SUMMARY.md exists and follows template structure
2. Token compliance: grep each screen's source for hardcoded values (same logic as motif-token-check.js)
3. Font compliance: no banned fonts appear in screen code
4. Design coherence: all screens reference the same tokens.css (token names match)
5. State machine integrity: STATE.md shows correct progression (COMPOSING -> REVIEWING)

### Controlled Test Screen List
For the controlled test project (VALD-01), define exactly these screens to keep scope manageable but comprehensive:
- login (auth flow -- form, validation states)
- dashboard (data display -- balance card, transaction list)
- settings (form-heavy -- inputs, toggles, sections)
This tests three distinct UI patterns in the minimum number of screens.

## Open Questions

1. **How to handle CryptoPay project definition?**
   - What we know: CryptoPay is referenced as a "real fintech project" in the requirements
   - What's unclear: Whether a CryptoPay project already exists somewhere, or if it needs to be defined as part of validation
   - Recommendation: Define CryptoPay as a test fixture with specific project details (crypto payments for Nigerian users, mobile-first, React), then run the full workflow against it

2. **Token showcase HTML visual verification**
   - What we know: generate-system.md produces a token-showcase.html that should be self-contained
   - What's unclear: Whether visual correctness can be verified programmatically or requires human inspection
   - Recommendation: Programmatically verify the HTML file exists, contains the expected CSS custom property references (var(--*)), and has no external dependencies (no CDN links except Google Fonts). Visual inspection is a human UAT step.

3. **Review score thresholds**
   - What we know: /motif:review scores screens 0-100 across 4 lenses. Score >= 80 with zero critical issues = "pass"
   - What's unclear: What score range to expect from AI-composed screens on first pass
   - Recommendation: Do not set a minimum score threshold for the validation test. Instead verify that the review produces a valid REVIEW.md with scores in all four lenses, and that /motif:fix can address critical issues if found.

## Sources

### Primary (HIGH confidence)
- `core/workflows/research.md` -- full workflow definition for research orchestrator
- `core/workflows/generate-system.md` -- system generation with color/typography algorithms
- `core/workflows/compose-screen.md` -- screen composition with fresh agent pattern
- `core/workflows/review.md` -- 4-lens review framework
- `core/workflows/fix.md` -- fix agent pattern
- `runtimes/claude-code/commands/motif/init.md` -- init workflow with --auto support
- `core/references/design-inputs.md` -- differentiation seed system, brand color flow
- `core/references/context-engine.md` -- fresh context isolation architecture
- `core/references/state-machine.md` -- phase transitions and gate checks
- `test/e2e-installer.js` -- existing test harness pattern
- `bin/install.js` -- installer flow (needed for test setup)
- `core/references/verticals/fintech.md` -- fintech domain intelligence (CryptoPay reference)

### Secondary (MEDIUM confidence)
- `.planning/phases/06-hooks-and-scripts/06-UAT.md` -- UAT pattern from Phase 6 (13 tests, all passed)
- `.planning/phases/05-verticals/05-UAT.md` -- UAT pattern from Phase 5 (8 tests, all passed)
- `.planning/phases/03-installer/03-UAT.md` -- UAT pattern from Phase 3 (8 tests, 1 gap found -> fixed in Phase 4)

### Tertiary (LOW confidence)
- None. All findings derived from reading the actual source code and planning documents.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero-dependency project with established test patterns; no new libraries needed
- Architecture: HIGH -- validation structure follows established e2e-installer.js pattern and UAT format from prior phases
- Pitfalls: HIGH -- pitfalls derived directly from studying the workflow code and understanding AI non-determinism
- Code examples: MEDIUM -- extraction functions untested but based on documented tokens.css format

**Research date:** 2026-03-02
**Valid until:** 2026-04-02 (stable -- validation patterns unlikely to change)
