# Phase 14: Token and System Integration - Research

**Researched:** 2026-03-05
**Domain:** CSS custom property extraction, Tailwind config parsing, token merge strategies, component gap analysis
**Confidence:** HIGH

## Summary

Phase 14 bridges Phase 13's scan infrastructure with the existing `/motif:system` design system generator. It adds three capabilities: (1) a token extractor script that reads CSS custom properties and Tailwind config from a brownfield project and outputs a structured TOKEN-INVENTORY.md, (2) a token strategy decision point in the system generation workflow where the user chooses adopt/merge/fresh, and (3) a component gap analysis that compares the project's scanned component catalog against the vertical's required component list and Motif's core component list.

The core architectural pattern is: **scan artifacts in, enriched artifacts out**. Phase 13 produces PROJECT-SCAN.md (framework, components) and CONVENTIONS.md (styling patterns). Phase 14 adds TOKEN-INVENTORY.md (structured token findings) and COMPONENT-GAP.md (gap analysis), then modifies the system generator workflow to consume all four when they exist. The greenfield path remains unchanged -- when no scan artifacts exist, the system generator behaves identically to v1.1.

**Primary recommendation:** Build a `scripts/token-extractor.js` script (zero dependencies, same pattern as project-scanner.js) that parses CSS custom properties and Tailwind config. Integrate it into the scan workflow. Modify `core/workflows/generate-system.md` to add a brownfield decision step and conditional token generation logic.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js fs | Built-in | Read CSS files, Tailwind configs, package.json | Zero dependencies, consistent with project-scanner.js |
| Node.js path | Built-in | Path resolution | Standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | Zero external dependencies is the standard |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex CSS custom property extraction | PostCSS parser | PostCSS would handle edge cases (multi-line values, nested calc()) but adds a dependency. Regex handles 95%+ of real-world `--name: value;` patterns. |
| Manual Tailwind config parsing | Tailwind's resolveConfig() | Requires installing tailwindcss as a dependency. Manual parsing of the config object is sufficient for extracting theme values. |
| Static file analysis for tokens | Running Tailwind CLI | Would require the project's full Tailwind setup working. File analysis is dependency-free and works on any project state. |

**Installation:**
```bash
# No installation needed -- pure Node.js built-ins
```

## Architecture Patterns

### Recommended Project Structure
```
scripts/
  token-extractor.js       # Token extraction from CSS/Tailwind (new)
  project-scanner.js       # Existing scanner from Phase 13

core/workflows/
  generate-system.md       # Modified to add brownfield decision step
  scan.md                  # Modified to invoke token extractor after scanner

.planning/design/
  TOKEN-INVENTORY.md       # Token extraction output (new)
  COMPONENT-GAP.md         # Gap analysis output (new)
  PROJECT-SCAN.md          # Existing from Phase 13
  CONVENTIONS.md           # Existing from Phase 13
```

### Pattern 1: Token Extraction Pipeline
**What:** A script that reads CSS files for custom properties and Tailwind config for theme values, producing a structured inventory
**When to use:** During scan workflow, after project-scanner.js runs
**Example:**
```javascript
// Source: Derived from project-scanner.js patterns

async function extractTokens(projectRoot) {
  // Phase 1: Detect CSS custom properties from all .css files
  const cssTokens = extractCSSCustomProperties(projectRoot);

  // Phase 2: Detect Tailwind theme tokens from config
  const tailwindTokens = extractTailwindConfig(projectRoot);

  // Phase 3: Categorize tokens (colors, spacing, typography, radii, shadows)
  const categorized = categorizeTokens(cssTokens, tailwindTokens);

  // Phase 4: Map to Motif token categories for gap detection
  const mapped = mapToMotifCategories(categorized);

  // Phase 5: Output TOKEN-INVENTORY.md
  writeTokenInventory(projectRoot, mapped);

  return mapped;
}
```

### Pattern 2: CSS Custom Property Extraction
**What:** Regex-based extraction of `--name: value;` declarations from CSS files
**When to use:** For any project using CSS custom properties (vanilla CSS, CSS modules, or alongside Tailwind)
**Example:**
```javascript
// Regex for CSS custom properties
const CSS_VAR_PATTERN = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+)\s*;/g;

function extractCSSCustomProperties(projectRoot) {
  const cssFiles = findCSSFiles(projectRoot);
  const tokens = {};

  for (const file of cssFiles) {
    const content = safeReadFile(file);
    if (!content) continue;

    let match;
    const regex = new RegExp(CSS_VAR_PATTERN.source, 'g');
    while ((match = regex.exec(content)) !== null) {
      const name = match[1].trim();
      const value = match[2].trim();
      // Track source file for provenance
      if (!tokens[name]) {
        tokens[name] = { value, source: path.relative(projectRoot, file), count: 1 };
      } else {
        tokens[name].count++;
        // If same name, different value, flag as inconsistent
        if (tokens[name].value !== value) {
          tokens[name].inconsistent = true;
          tokens[name].alternateValues = tokens[name].alternateValues || [tokens[name].value];
          tokens[name].alternateValues.push(value);
        }
      }
    }
  }

  return tokens;
}

function findCSSFiles(projectRoot) {
  const results = [];
  // Walk project looking for .css, .scss files (not in node_modules, dist, etc.)
  // Use same walkProject pattern from project-scanner.js but for CSS extensions
  walkForExtensions(projectRoot, projectRoot, ['.css', '.scss'], results, 0, new Set());
  return results;
}
```

### Pattern 3: Tailwind Config Extraction
**What:** Parse tailwind.config.js/ts to extract theme customizations
**When to use:** When project uses Tailwind CSS (detected in Phase 13 scan)
**Example:**
```javascript
function extractTailwindConfig(projectRoot) {
  const configPaths = [
    'tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs',
    'tailwind.config.cjs',
  ];

  let configPath = null;
  for (const cp of configPaths) {
    const full = path.join(projectRoot, cp);
    if (fs.existsSync(full)) {
      configPath = full;
      break;
    }
  }

  if (!configPath) return null;

  const content = safeReadFile(configPath);
  if (!content) return null;

  // Extract theme.extend and theme overrides via regex
  // We cannot require() the config (may have TS, ESM, or plugin dependencies)
  // Instead, extract the theme object structure textually
  const tokens = {
    colors: extractTailwindSection(content, 'colors'),
    spacing: extractTailwindSection(content, 'spacing'),
    borderRadius: extractTailwindSection(content, 'borderRadius'),
    fontSize: extractTailwindSection(content, 'fontSize'),
    fontFamily: extractTailwindSection(content, 'fontFamily'),
    boxShadow: extractTailwindSection(content, 'boxShadow'),
  };

  return tokens;
}

function extractTailwindSection(content, sectionName) {
  // Look for theme.extend.[section] or theme.[section]
  // Extract the object literal content between { }
  // This is regex-based -- handles 80%+ of real configs
  const patterns = [
    new RegExp(`extend\\s*:\\s*\\{[^}]*${sectionName}\\s*:\\s*\\{([^}]+)\\}`, 's'),
    new RegExp(`theme\\s*:\\s*\\{[^}]*${sectionName}\\s*:\\s*\\{([^}]+)\\}`, 's'),
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return parseObjectLiteral(match[1]);
    }
  }

  return null;
}

function parseObjectLiteral(str) {
  // Simple key-value extraction from JS object literal
  const entries = {};
  const kvPattern = /['"]?([a-zA-Z0-9-]+)['"]?\s*:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = kvPattern.exec(str)) !== null) {
    entries[match[1]] = match[2];
  }
  return Object.keys(entries).length > 0 ? entries : null;
}
```

### Pattern 4: Token Categorization and Motif Mapping
**What:** Map discovered tokens to Motif's token categories to identify coverage
**When to use:** After extraction, before gap analysis
**Example:**
```javascript
const MOTIF_TOKEN_CATEGORIES = {
  colors: {
    patterns: [/color/, /bg/, /text-/, /border-/, /surface/, /primary/, /secondary/, /success/, /error/, /warning/, /info/],
    required: ['color-primary-*', 'color-success', 'color-error', 'color-warning', 'color-info',
               'surface-primary', 'surface-secondary', 'text-primary', 'text-secondary', 'border-primary'],
  },
  typography: {
    patterns: [/font/, /text-/, /leading/, /weight/, /tracking/],
    required: ['font-display', 'font-body', 'text-base', 'text-sm', 'text-lg',
               'weight-normal', 'weight-medium', 'weight-semibold', 'weight-bold'],
  },
  spacing: {
    patterns: [/space/, /gap/, /padding/, /margin/],
    required: ['space-1', 'space-2', 'space-3', 'space-4', 'space-6', 'space-8'],
  },
  radii: {
    patterns: [/radius/, /rounded/],
    required: ['radius-sm', 'radius-md', 'radius-lg'],
  },
  shadows: {
    patterns: [/shadow/],
    required: ['shadow-sm', 'shadow-md', 'shadow-lg'],
  },
  transitions: {
    patterns: [/ease/, /duration/, /transition/],
    required: ['ease-default', 'duration-fast', 'duration-normal'],
  },
};

function mapToMotifCategories(tokens) {
  const coverage = {};

  for (const [category, config] of Object.entries(MOTIF_TOKEN_CATEGORIES)) {
    const matched = [];
    const missing = [];

    for (const req of config.required) {
      // Check if any extracted token matches this required token
      const reqPattern = req.includes('*')
        ? new RegExp(req.replace('*', '\\w+'))
        : new RegExp(`^${req}$`);

      const found = Object.keys(tokens).find(name => reqPattern.test(name));
      if (found) {
        matched.push({ required: req, found, value: tokens[found].value });
      } else {
        missing.push(req);
      }
    }

    coverage[category] = { matched, missing, total: config.required.length };
  }

  return coverage;
}
```

### Pattern 5: Component Gap Analysis
**What:** Compare scanned project components against Motif's core + vertical-specific component lists
**When to use:** After scan, when generating COMPONENT-GAP.md
**Example:**
```javascript
const CORE_COMPONENTS = [
  'Button', 'Input', 'Card', 'Badge', 'Avatar',
  'Toast', 'Modal', 'Dropdown', 'Table', 'Nav',
];

const VERTICAL_COMPONENTS = {
  fintech: ['TransactionRow', 'BalanceCard', 'StatusChip'],
  health: ['MetricCard', 'ProgressRing', 'LogEntry'],
  saas: ['DataTable', 'CommandPalette', 'FilterBar'],
  ecommerce: ['ProductCard', 'CartItem', 'PriceDisplay'],
};

function analyzeComponentGap(scannedComponents, vertical) {
  const required = [
    ...CORE_COMPONENTS.map(c => ({ name: c, type: 'core' })),
    ...(VERTICAL_COMPONENTS[vertical] || []).map(c => ({ name: c, type: 'vertical' })),
  ];

  const results = { existing: [], missing: [], partial: [] };

  for (const req of required) {
    // Fuzzy match: scanned component names may differ
    // e.g., "TransactionListItem" matches "TransactionRow"
    const match = findComponentMatch(req.name, scannedComponents);

    if (match && match.confidence === 'HIGH') {
      results.existing.push({
        required: req.name,
        found: match.name,
        file: match.relativePath,
        type: req.type,
      });
    } else if (match && match.confidence === 'MEDIUM') {
      results.partial.push({
        required: req.name,
        found: match.name,
        file: match.relativePath,
        type: req.type,
        note: 'Partial match -- may need enhancement',
      });
    } else {
      results.missing.push({
        required: req.name,
        type: req.type,
        note: 'Needs to be generated by Motif',
      });
    }
  }

  return results;
}

function findComponentMatch(requiredName, scannedComponents) {
  const reqLower = requiredName.toLowerCase();

  // Exact match first
  let match = scannedComponents.find(c =>
    c.name && c.name.toLowerCase() === reqLower
  );
  if (match) return match;

  // Contains match (e.g., "TransactionRow" matches "TransactionListRow")
  match = scannedComponents.find(c =>
    c.name && (c.name.toLowerCase().includes(reqLower) || reqLower.includes(c.name.toLowerCase()))
  );
  if (match) return { ...match, confidence: 'MEDIUM' };

  // Semantic match via known aliases
  const aliases = {
    'table': ['datatable', 'grid', 'datagrid'],
    'nav': ['navbar', 'navigation', 'sidebar', 'sidenav', 'topbar'],
    'dropdown': ['select', 'menu', 'popover', 'combobox'],
    'toast': ['notification', 'snackbar', 'alert'],
    'modal': ['dialog', 'overlay', 'popup'],
    'input': ['textfield', 'textinput', 'formfield'],
    'badge': ['chip', 'tag', 'label', 'statuschip'],
  };

  const reqAliases = aliases[reqLower] || [];
  for (const alias of reqAliases) {
    match = scannedComponents.find(c =>
      c.name && c.name.toLowerCase().includes(alias)
    );
    if (match) return { ...match, confidence: 'MEDIUM' };
  }

  return null;
}
```

### Pattern 6: Token Strategy Decision in System Generator
**What:** Add a brownfield decision step to the generate-system workflow
**When to use:** When PROJECT-SCAN.md and TOKEN-INVENTORY.md exist
**Example (workflow modification):**
```markdown
## Brownfield Token Decision (NEW -- before agent spawn)

If `.planning/design/TOKEN-INVENTORY.md` exists:

Present token inventory summary to user:
"I found existing design tokens in your project:
- Colors: [N] tokens defined ([coverage]% of Motif's standard set)
- Typography: [N] tokens defined
- Spacing: [N] tokens defined
- Total coverage: [X]% of what Motif would generate

Choose your token strategy:
1. **Adopt existing** -- Keep all your current tokens as-is. Motif generates only what's missing.
2. **Merge with Motif** -- Use your tokens as starting values. Motif fills gaps and adds vertical-specific tokens.
3. **Start fresh** -- Ignore existing tokens entirely. Generate a complete new system (your existing tokens remain in your codebase untouched).

[Default: 2 (Merge)]"

Record the user's choice in STATE.md decisions log.
Pass the strategy choice + TOKEN-INVENTORY.md path to the system generator agent.
```

### Pattern 7: Selective Token Overlay (Merge Strategy)
**What:** System generator produces tokens that fill gaps without overwriting existing ones
**When to use:** When user chooses "merge" strategy
**Example (agent instruction):**
```markdown
## Brownfield Token Generation (Merge Strategy)

Read TOKEN-INVENTORY.md. For each Motif token category:

1. **Colors:** If user has --color-primary-* tokens, KEEP them. Generate only missing
   scale stops. If user has no semantic colors (success/error/warning/info), generate
   those. If user has surfaces, keep them. Comment each preserved token:
   `/* Preserved from project: [source file] */`

2. **Typography:** If user has --font-display or --font-body, keep them (even if they're
   "banned" fonts like Inter -- user's project, user's choice). Generate missing scale
   entries. If user has no --font-mono, add it.

3. **Spacing:** If user has a spacing scale, adopt it. Fill missing steps to complete
   the 4px grid. If user's scale uses a different base (e.g., 5px), note it but use
   their scale.

4. **Radii, Shadows, Transitions:** If user has them, preserve. Generate missing entries.

Output format: tokens.css with TWO sections:
```css
/* ═══════════════════════════════════════
   MOTIF — [Product] Design Tokens
   Strategy: MERGE (preserving existing + filling gaps)
   ═══════════════════════════════════════ */

:root {
  /* ── Preserved from Project ── */
  /* These tokens match your existing project values */
  --color-primary-500: #2563EB; /* Preserved from src/styles/globals.css */

  /* ── Generated by Motif ── */
  /* These tokens fill gaps in your existing system */
  --color-primary-50: #EFF6FF; /* Generated: scale stop, hsl(217, 91%, 97%) */
}
```

### Anti-Patterns to Avoid
- **Overwriting user tokens in merge mode:** The entire point of merge is preservation. Never replace a user's existing `--color-primary-500` with Motif's generated value. The user chose merge because they want to keep their tokens.
- **Running token extraction on node_modules:** Only scan project source files. The skip-dir list from project-scanner.js applies here too.
- **Parsing Tailwind config via require():** Cannot safely require() a user's Tailwind config -- it may import plugins, use TypeScript, or have ESM syntax. Use regex extraction instead.
- **Making gap analysis judgmental:** Present facts, not opinions. "Missing: Modal" not "You're missing a Modal component and should build one." The user decides what to act on.
- **Blocking greenfield on new artifacts:** If TOKEN-INVENTORY.md or COMPONENT-GAP.md don't exist, every downstream command must work identically to v1.1. These are optional enrichments.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| CSS file walking | Custom walker | Reuse `walkProject` / `findFiles` from project-scanner.js | Already battle-tested, handles symlinks/depth/encoding |
| Token name normalization | Custom normalizer | Pattern matching against MOTIF_TOKEN_CATEGORIES | Motif has a fixed token namespace; map to it, don't invent a new one |
| Component name fuzzy matching | Levenshtein distance | Alias table + contains-check | Simple, deterministic, covers the actual use cases (modal vs dialog, toast vs notification) |
| Tailwind default values | Hardcoded Tailwind defaults | Only extract user customizations from config | Tailwind defaults change across versions; extracting only user overrides is more reliable |

**Key insight:** Token extraction is a read-only analysis problem. The extractor reads files and produces a structured report. The system generator reads the report and adjusts its output. These are two separate concerns -- keep them separate.

## Common Pitfalls

### Pitfall 1: Tailwind Config Regex Fails on Complex Configs
**What goes wrong:** Regex extraction misses nested objects, function calls, or spread operators in Tailwind config.
**Why it happens:** Real Tailwind configs use `require()`, plugins, `...defaultTheme.colors`, and TypeScript.
**How to avoid:** Extract only simple key-value pairs. For complex configs, report "Tailwind config detected but theme customizations could not be fully parsed" and let the user provide clarification. Flag confidence as LOW for Tailwind tokens when the config uses dynamic values. The user confirmation step in the scan workflow handles this.
**Warning signs:** Extracted Tailwind tokens contain function calls or variable references instead of actual values.

### Pitfall 2: Token Naming Mismatch Between User and Motif
**What goes wrong:** User has `--brand-blue` but Motif expects `--color-primary-500`. The gap analysis says "colors: 0% coverage" even though the user has a full color system.
**Why it happens:** Token naming is arbitrary; different projects use different conventions.
**How to avoid:** Map by VALUE semantics, not just name matching. A `--brand-blue` that's `#2563EB` is clearly a primary color. Use heuristics: any CSS variable containing "primary", "brand", "main", or "accent" in the name is likely a primary color. Any variable with a hex value in the blue range could be primary. Present findings with the mapping for user confirmation: "I mapped your `--brand-blue` to Motif's `--color-primary-500`. Correct?"
**Warning signs:** Coverage percentages seem unrealistically low for projects that clearly have a design system.

### Pitfall 3: COMPONENT-GAP.md Exceeds Context Budget
**What goes wrong:** Gap analysis output is too large when a project has many components.
**Why it happens:** Listing every scanned component alongside every required component creates combinatorial output.
**How to avoid:** COMPONENT-GAP.md should focus on the gap, not the full inventory. Show: (1) summary counts (X of Y required components found), (2) the specific missing components, (3) the matches. Cap at ~800 tokens. The full component catalog is already in PROJECT-SCAN.md.
**Warning signs:** COMPONENT-GAP.md exceeds 1000 tokens.

### Pitfall 4: Merge Strategy Produces Inconsistent Token System
**What goes wrong:** User's existing tokens use 8px spacing base, Motif generates gaps using 4px base. The merged system has two competing scales.
**Why it happens:** Merge blindly fills gaps without checking compatibility of the user's scale.
**How to avoid:** In merge mode, detect the user's scale base before generating gaps. If user spacing is on 8px grid, generate gap-fill tokens on 8px grid too. If the scales are truly incompatible (e.g., user uses rem with non-standard base), warn the user and suggest "start fresh" instead. Document the detected scale in TOKEN-INVENTORY.md.
**Warning signs:** Generated spacing tokens don't align with the user's existing spacing steps.

### Pitfall 5: Breaking the Greenfield System Generator
**What goes wrong:** Modifications to generate-system.md break the flow for greenfield projects that have no scan artifacts.
**Why it happens:** Conditional logic for brownfield is added without sufficient guards.
**How to avoid:** Every brownfield-specific step in the workflow must be gated behind file existence checks: `If TOKEN-INVENTORY.md exists:` / `If COMPONENT-GAP.md exists:`. When these files don't exist, the workflow must execute identically to the current v1.1 code. Test the greenfield path after every modification.
**Warning signs:** `/motif:system` on a greenfield project asks about token strategy or shows gap analysis.

### Pitfall 6: Token Extractor Fails on CSS-in-JS Projects
**What goes wrong:** Projects using styled-components or Emotion define tokens in JavaScript, not CSS files. The extractor finds nothing.
**Why it happens:** Token extractor only reads .css/.scss files.
**How to avoid:** Check the CSS approach from PROJECT-SCAN.md. If styled-components or Emotion detected, look for theme objects in common locations (e.g., `src/theme.ts`, `src/styles/theme.js`, `styled.d.ts`). Extract from JavaScript object literals using the same regex approach as Tailwind config parsing. If nothing found, report: "CSS-in-JS detected but token extraction from JavaScript theme files is limited. Consider providing your token values manually."
**Warning signs:** PROJECT-SCAN.md says "styled-components" but TOKEN-INVENTORY.md shows zero tokens.

## Code Examples

### CSS Custom Property Extraction (Complete)
```javascript
// Source: Derived from project-scanner.js patterns

const CSS_VAR_PATTERN = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;

function extractCSSCustomProperties(projectRoot) {
  const cssExtensions = new Set(['.css', '.scss']);
  const results = [];

  // Reuse walkProject pattern but for CSS files
  walkForExtensions(projectRoot, projectRoot, cssExtensions, results, 0, new Set());

  const tokens = {};
  for (const file of results) {
    const content = safeReadFile(file.fullPath);
    if (!content) continue;

    // Only extract from :root or html selectors for global tokens
    // Also extract from any selector for component-scoped tokens
    const regex = new RegExp(CSS_VAR_PATTERN.source, 'g');
    let match;
    while ((match = regex.exec(content)) !== null) {
      const name = match[1].trim();
      const value = match[2].trim();

      if (!tokens[name]) {
        tokens[name] = {
          value,
          source: path.relative(projectRoot, file.fullPath),
          isGlobal: isInGlobalScope(content, match.index),
        };
      }
    }
  }

  return tokens;
}

function isInGlobalScope(content, matchIndex) {
  // Check if the match is inside :root { } or html { }
  const before = content.substring(0, matchIndex);
  const lastRoot = Math.max(
    before.lastIndexOf(':root'),
    before.lastIndexOf('html {'),
    before.lastIndexOf(':host {')
  );
  if (lastRoot === -1) return false;

  // Count braces between the selector and the match
  const between = before.substring(lastRoot);
  const opens = (between.match(/\{/g) || []).length;
  const closes = (between.match(/\}/g) || []).length;
  return opens > closes; // Still inside the block
}
```

### TOKEN-INVENTORY.md Output Format
```markdown
# Token Inventory

**Extracted:** [date]
**Source:** [project root]
**CSS Approach:** [from PROJECT-SCAN.md]

## Summary
- **CSS Custom Properties:** [N] found across [M] files
- **Tailwind Config:** [detected/not detected]
- **Coverage vs Motif:** [X]% of standard token set covered

## Colors
| Token | Value | Source | Motif Equivalent |
|-------|-------|--------|-----------------|
| --brand-blue | #2563EB | globals.css | color-primary-500 |
| --brand-light | #DBEAFE | globals.css | color-primary-100 |
| --error | #DC2626 | globals.css | color-error |
| ... | ... | ... | ... |

**Coverage:** [N]/[M] Motif color tokens matched
**Missing:** color-primary-50, color-primary-200, ..., surface-primary, surface-secondary, text-tertiary

## Typography
| Token | Value | Source | Motif Equivalent |
|-------|-------|--------|-----------------|
| --font-sans | 'Inter', sans-serif | globals.css | font-body |
| ... | ... | ... | ... |

**Coverage:** [N]/[M] Motif typography tokens matched
**Missing:** font-display, font-mono, text-xs, text-sm, ...

## Spacing
[same format]

## Radii
[same format]

## Shadows
[same format]

## Tailwind Theme Customizations
[If Tailwind config detected, show extracted theme overrides]
| Category | Key | Value |
|----------|-----|-------|
| colors.primary | 500 | #2563EB |
| borderRadius | lg | 12px |
| ... | ... | ... |
```

### COMPONENT-GAP.md Output Format
```markdown
# Component Gap Analysis

**Analyzed:** [date]
**Vertical:** [vertical name]
**Project components:** [N] found (from PROJECT-SCAN.md)

## Summary
- **Core components (Motif standard):** [X]/10 found
- **Vertical components ([vertical]):** [Y]/3 found
- **Total coverage:** [Z]/13 required components exist
- **To generate:** [13-Z] components

## Existing (No Generation Needed)
| Required | Found As | File | Match Quality |
|----------|----------|------|---------------|
| Button | Button | src/components/ui/Button.tsx | Exact |
| Modal | Dialog | src/components/Dialog.tsx | Alias (Modal=Dialog) |
| ... | ... | ... | ... |

## Missing (Motif Will Generate)
| Component | Type | Description |
|-----------|------|-------------|
| Badge | core | Status indicator with variants |
| TransactionRow | vertical (fintech) | Transaction list item |
| ... | ... | ... |

## Partial Matches (May Need Enhancement)
| Required | Found As | File | Note |
|----------|----------|------|------|
| Table | DataGrid | src/components/DataGrid.tsx | Has basic table but missing sort/filter |
| ... | ... | ... | ... |
```

## Integration Points

### Scan Workflow Modification (core/workflows/scan.md)
After Step 1 (run project-scanner.js), add:

```markdown
## Step 1b: Run Token Extractor

If PROJECT-SCAN.md reports a CSS approach other than "vanilla-css" with zero files,
OR if any .css files exist in the project:

Run: `node scripts/token-extractor.js [projectRoot]`

This generates `.planning/design/TOKEN-INVENTORY.md`.

If the extractor finds zero tokens, skip TOKEN-INVENTORY.md creation.
```

### System Generator Workflow Modification (core/workflows/generate-system.md)

Add between gate_check and Step 2 (agent spawn):

```markdown
## Step 1b: Brownfield Decision (NEW)

Check if `.planning/design/TOKEN-INVENTORY.md` exists.

If YES:
  1. Read TOKEN-INVENTORY.md summary section
  2. Present coverage summary to user
  3. Ask for strategy choice (adopt/merge/fresh)
  4. Record decision in STATE.md
  5. Pass strategy + TOKEN-INVENTORY.md path to system generator agent

If NO:
  Continue to Step 2 as before (greenfield path unchanged)

## Step 1c: Component Gap Analysis (NEW)

Check if `.planning/design/PROJECT-SCAN.md` exists AND has a component catalog.

If YES:
  1. Read STATE.md for vertical name
  2. Read PROJECT-SCAN.md component catalog
  3. Compare against core + vertical component lists
  4. Generate `.planning/design/COMPONENT-GAP.md`
  5. Present gap summary to user:
     "Your project has X of Y required components. Motif will generate specs for the Z missing ones."

If NO:
  Continue (greenfield path unchanged)
```

### Context Engine Modification
Add to system-generator context profile:

```xml
<load_if_exists>
  .planning/design/TOKEN-INVENTORY.md
  .planning/design/COMPONENT-GAP.md
  .planning/design/PROJECT-SCAN.md
  .planning/design/CONVENTIONS.md
</load_if_exists>
```

### Context Budget Additions
| File | Tokens (approx) | Budget |
|------|-----------------|--------|
| TOKEN-INVENTORY.md | ~1,000 | <=1,500 |
| COMPONENT-GAP.md | ~600 | <=800 |

### System Generator Agent Modifications
The agent definition (`motif-system-architect.md`) needs a new section:

```markdown
## Brownfield Mode

When TOKEN-INVENTORY.md is provided with a strategy:

### Strategy: Adopt Existing
- Read all tokens from TOKEN-INVENTORY.md
- Map them to Motif token names using the provided Motif Equivalent column
- Generate ONLY tokens that have no equivalent in the inventory
- Preserve user token NAMES (not just values) -- if user has --brand-blue, keep it as --brand-blue AND add --color-primary-500 as an alias: `--color-primary-500: var(--brand-blue);`
- Note in tokens.css header: "Strategy: ADOPT -- preserving all existing tokens"

### Strategy: Merge (Default)
- Read all tokens from TOKEN-INVENTORY.md
- For each Motif category, check coverage percentage
- Generate missing tokens to complete the system
- Preserve existing values for matched tokens
- Use existing token values to DERIVE compatible new tokens (e.g., if user's primary is blue, generate a blue-based scale, not a random teal)
- Note preserved vs generated tokens with comments

### Strategy: Fresh
- Ignore TOKEN-INVENTORY.md entirely
- Generate as if greenfield
- Note in tokens.css header: "Strategy: FRESH -- existing project tokens not incorporated"

When COMPONENT-GAP.md is provided:
- Generate COMPONENT-SPECS.md with specs for ALL required components
- For "existing" components: generate a lighter spec (reference only, marked as "existing in project")
- For "missing" components: generate full spec (variants, states, accessibility)
- For "partial" components: generate full spec with note about existing partial implementation
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generate all tokens from scratch | Detect existing, offer merge strategy | Phase 14 (new) | Brownfield projects keep their identity |
| Generate all component specs | Gap analysis, only spec what's missing | Phase 14 (new) | Less redundant output, respects existing work |
| System generator ignores project context | System generator reads scan artifacts | Phase 14 (new) | Project-aware design systems |

**Tailwind v3 vs v4 note:** Tailwind v4 (released Feb 2025) uses CSS-first configuration with `@theme` directive instead of JavaScript config. The token extractor should handle BOTH: (1) tailwind.config.js/ts for v3 projects, and (2) `@theme` blocks in CSS files for v4 projects. The CSS custom property extractor already handles v4's `@theme` output since it generates standard CSS custom properties. The Tailwind config regex parser handles v3. This covers both cases without version detection.

## Open Questions

1. **Should token-extractor.js be a separate script or integrated into project-scanner.js?**
   - What we know: project-scanner.js is already 1072 lines. Token extraction is a distinct concern. Both run during the scan workflow.
   - What's unclear: Whether two script invocations add unnecessary overhead vs. one combined script.
   - Recommendation: **Separate script.** Token extraction is conceptually distinct from component scanning. A separate script keeps each file focused and maintainable. The scan workflow invokes both sequentially. The overhead of two Node.js process starts is negligible (~50ms each).

2. **Should COMPONENT-GAP.md be generated by a script or by the system generator agent?**
   - What we know: Gap analysis requires knowing the vertical (from STATE.md) and the component list (hardcoded in generate-system.md). The scan provides the existing component list.
   - What's unclear: Whether to put this logic in a script (deterministic) or let the agent do it (more flexible matching).
   - Recommendation: **Script generates it during scan workflow, not during system generation.** The gap analysis is deterministic (compare two lists) and should not consume agent context. Generate COMPONENT-GAP.md in the scan workflow (Step 1c addition) by reading PROJECT-SCAN.md and STATE.md for vertical. This means the gap analysis script needs access to the hardcoded component lists. Put the component lists in a shared data file or inline them in the script.

3. **How to handle CSS-in-JS token extraction?**
   - What we know: styled-components and Emotion store tokens in JavaScript theme objects, not CSS files.
   - What's unclear: Whether regex extraction from JS theme files is reliable enough.
   - Recommendation: **Best-effort extraction with honest reporting.** Look for common theme file patterns (ThemeProvider, createTheme, theme object exports). Extract key-value pairs from object literals. Flag as LOW confidence. The user confirmation step handles inaccuracies. Do NOT block on getting this perfect for v1.2.

4. **Should the gap analysis script be invoked during scan or during system generation?**
   - What we know: Gap analysis needs vertical from STATE.md (set during init) and components from PROJECT-SCAN.md (set during scan).
   - What's unclear: Both pieces of data exist after init+scan, but the scan may run before init sets the vertical.
   - Recommendation: **Generate COMPONENT-GAP.md during system generation, not during scan.** The scan workflow runs during or just after init, and the vertical may not be confirmed yet. The system generator workflow already has the vertical from STATE.md and runs after research. Add gap analysis as a pre-step in generate-system.md, not in scan.md. This is a revision from Open Question 2 above -- the sequencing matters.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `scripts/project-scanner.js` (1072 lines) -- patterns for file walking, regex extraction, convention detection, output formatting
- Existing codebase: `core/workflows/generate-system.md` -- current system generator workflow, token format, component spec format, decision algorithms
- Existing codebase: `.claude/get-motif/agents/motif-system-architect.md` -- agent instructions, context profile, quality checklist
- Existing codebase: `.claude/get-motif/references/state-machine.md` -- state transitions, brownfield notes, context budget
- Existing codebase: `.claude/get-motif/references/context-engine.md` -- context loading profiles, budget constraints
- Existing codebase: `.claude/get-motif/references/verticals/*.md` -- vertical-specific component specifications (fintech, saas, health, ecommerce)
- Existing codebase: `core/workflows/scan.md` -- scan workflow orchestration, user confirmation flow
- Existing codebase: `runtimes/claude-code/commands/motif/init.md` -- brownfield detection, auto-scan integration

### Secondary (MEDIUM confidence)
- CSS Custom Properties spec (MDN) -- `--name: value;` syntax is stable and well-defined
- Tailwind CSS v3 config format -- `module.exports = { theme: { extend: { ... } } }` is documented and stable
- Tailwind CSS v4 `@theme` directive -- newer approach, less widespread adoption but documented

### Tertiary (LOW confidence)
- CSS-in-JS theme extraction patterns -- varies greatly across projects, regex reliability is uncertain

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero dependencies, extends proven project-scanner.js patterns
- Architecture: HIGH -- clear integration points with existing scan and system generation workflows
- Token extraction patterns: HIGH for CSS custom properties, MEDIUM for Tailwind config, LOW for CSS-in-JS
- Component gap analysis: HIGH -- deterministic comparison of two known lists
- Pitfalls: HIGH -- derived from known CSS parsing edge cases and existing codebase integration points

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable -- Node.js built-ins, established CSS patterns)
