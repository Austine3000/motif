# Phase 13: Scan Infrastructure - Research

**Researched:** 2026-03-05
**Domain:** File system scanning, component detection, convention extraction (pure Node.js)
**Confidence:** HIGH

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Scan Invocation
- Init auto-scans when it detects an existing project (package.json, src/ folder). No prompt to ask -- just scan.
- `/motif:scan` exists as a separate command for re-scanning later (after project changes).
- Full rescan every time -- no incremental updates. Simpler, always accurate.
- Smart defaults for skip directories: node_modules, .git, dist, build, .next, etc. No user-configurable excludes in v1.2.

#### Findings Presentation
- Summary + drill-down format: compact overview first, user can expand any section for details and corrections.
- Scan results saved to a markdown file (PROJECT-SCAN.md) that the user can manually edit before running /motif:system.
- Corrections are choice-based: present the finding with options ("I detected Tailwind CSS. Correct? [Yes / No, it's CSS Modules / Other]").
- Component catalog displayed grouped by directory: "src/components/ui/ (12 components), src/features/ (8 components)".

#### Component Cataloging Depth
- Detection uses both approaches: directory heuristics first (components/, ui/ directories), then verify with export detection (uppercase function exports, class components). Catches conventional and unconventional projects.
- Extract basic prop names and types from component signatures -- enough for the composer to generate correct imports.
- Ambiguous files included with confidence tags: HIGH (clearly a component), MEDIUM (might be), LOW (probably not). User can correct during confirmation.
- Categorize components: primitives (Button, Input), composites (Card, Modal), pages (Dashboard, Settings), layouts (Sidebar, Header).

#### Convention Extraction
- Extract both styling conventions (border-radius, spacing, shadows, color naming) AND code conventions (import patterns, file structure, naming case, export patterns, barrel files).
- Sample 3-5 representative component files to extract patterns. Pick by size and location for representativeness.
- Report inconsistencies to the user: "Your border-radius varies: 60% use rounded-lg, 40% use rounded-md." Let the user decide which to follow.
- Conventions stored as a separate CONVENTIONS.md file alongside PROJECT-SCAN.md. User can review and edit conventions independently.

### Claude's Discretion
- Exact heuristics for component detection (regex patterns, file size thresholds)
- How to select "representative" files for convention sampling
- Confidence threshold definitions for component categorization
- Exact format and sections of PROJECT-SCAN.md and CONVENTIONS.md

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

## Summary

Phase 13 builds a project scanner that runs as a pure Node.js script (zero external dependencies), consistent with the existing `scripts/` pattern in Motif (contrast-checker.js, token-counter.js). The scanner reads the file system, detects framework/stack from package.json, catalogs components via regex-based heuristics, extracts styling and code conventions, and outputs two markdown files: PROJECT-SCAN.md (structure + components) and CONVENTIONS.md (patterns + inconsistencies). These artifacts are consumed by downstream phases (14-16) and must stay under 2000 tokens combined to fit context budgets.

The scanner integrates into the existing Motif state machine by adding a new `SCANNED` phase between `UNINITIALIZED` and `INITIALIZED`, and a `/motif:scan` command. The init command gains auto-scan behavior: when it detects package.json + src/ (or equivalent), it runs the scanner automatically before proceeding with the interview. The scan workflow runs in the main context (not a subagent) because it requires user interaction for corrections.

**Primary recommendation:** Build a single `scripts/project-scanner.js` script that the `/motif:scan` command and modified `/motif:init` both invoke. Use regex-based detection (not AST parsing) to maintain zero dependencies. Structure as a pipeline: detect framework -> find components -> sample conventions -> output markdown.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js fs | Built-in | File system reading, directory walking | Zero dependencies, consistent with existing scripts |
| Node.js path | Built-in | Path resolution, extension detection | Standard for cross-platform paths |
| Node.js util | Built-in | `parseArgs` for CLI flags (if needed) | Already used in install.js |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none) | - | - | Zero external dependencies is the standard |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Regex component detection | TypeScript Compiler API | AST gives perfect accuracy but adds ~50MB dependency and significant complexity. Regex is sufficient for the detection depth needed (names, basic props, export patterns). |
| Regex CSS extraction | PostCSS parser | Would handle edge cases better but adds dependency. Regex works for the common patterns (border-radius values, color hex codes, spacing values). |
| Custom directory walker | glob / fast-glob | External dependency for marginal benefit. The existing walkFiles pattern in install.js handles this well. |

**Installation:**
```bash
# No installation needed -- pure Node.js built-ins
```

## Architecture Patterns

### Recommended Project Structure
```
scripts/
  project-scanner.js      # Main scanner logic (CLI-invocable)

core/workflows/
  scan.md                 # Scan workflow (orchestrator instructions)

runtimes/claude-code/commands/motif/
  scan.md                 # /motif:scan command definition

.planning/design/
  PROJECT-SCAN.md         # Scan output (structure + components)
  CONVENTIONS.md          # Scan output (patterns + inconsistencies)
```

### Pattern 1: Pipeline Architecture
**What:** The scanner runs as a sequential pipeline: detect -> catalog -> sample -> output
**When to use:** Always -- this is the only scan architecture
**Example:**
```javascript
// Source: Derived from existing Motif script patterns (contrast-checker.js, token-counter.js)

async function scan(projectRoot) {
  // Phase 1: Detect framework and stack
  const framework = detectFramework(projectRoot);

  // Phase 2: Detect CSS approach
  const cssApproach = detectCSSApproach(projectRoot, framework);

  // Phase 3: Map directory structure
  const structure = mapDirectoryStructure(projectRoot);

  // Phase 4: Catalog components
  const components = catalogComponents(projectRoot, structure, framework);

  // Phase 5: Sample conventions
  const conventions = extractConventions(projectRoot, components);

  // Phase 6: Output markdown files
  writeProjectScan(projectRoot, { framework, cssApproach, structure, components });
  writeConventions(projectRoot, conventions);

  return { framework, cssApproach, structure, components, conventions };
}
```

### Pattern 2: Framework Detection from package.json
**What:** Read package.json dependencies to classify the project's framework
**When to use:** First step of every scan
**Example:**
```javascript
function detectFramework(projectRoot) {
  const pkgPath = path.join(projectRoot, 'package.json');
  if (!fs.existsSync(pkgPath)) return { name: 'unknown', confidence: 'LOW' };

  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Order matters: check meta-frameworks before base frameworks
  if (allDeps['next'])        return { name: 'next', version: allDeps['next'], confidence: 'HIGH' };
  if (allDeps['nuxt'])        return { name: 'nuxt', version: allDeps['nuxt'], confidence: 'HIGH' };
  if (allDeps['@remix-run/react']) return { name: 'remix', version: allDeps['@remix-run/react'], confidence: 'HIGH' };
  if (allDeps['astro'])       return { name: 'astro', version: allDeps['astro'], confidence: 'HIGH' };
  if (allDeps['svelte'])      return { name: 'svelte', version: allDeps['svelte'], confidence: 'HIGH' };
  if (allDeps['vue'])         return { name: 'vue', version: allDeps['vue'], confidence: 'HIGH' };
  if (allDeps['react'])       return { name: 'react', version: allDeps['react'], confidence: 'HIGH' };
  if (allDeps['@angular/core']) return { name: 'angular', version: allDeps['@angular/core'], confidence: 'HIGH' };

  return { name: 'html', confidence: 'MEDIUM' };
}
```

### Pattern 3: CSS Approach Detection
**What:** Detect styling methodology from config files and package.json
**When to use:** During framework detection phase
**Example:**
```javascript
function detectCSSApproach(projectRoot, framework) {
  const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
  const results = [];

  // Tailwind: check for config file OR dependency
  if (fs.existsSync(path.join(projectRoot, 'tailwind.config.js')) ||
      fs.existsSync(path.join(projectRoot, 'tailwind.config.ts')) ||
      fs.existsSync(path.join(projectRoot, 'tailwind.config.mjs')) ||
      allDeps['tailwindcss']) {
    results.push({ name: 'tailwind', confidence: 'HIGH' });
  }

  // CSS Modules: check for *.module.css files
  const hasModules = findFiles(projectRoot, /\.module\.(css|scss|less)$/, 3);
  if (hasModules.length > 0) {
    results.push({ name: 'css-modules', confidence: 'HIGH' });
  }

  // Styled Components / Emotion
  if (allDeps['styled-components']) results.push({ name: 'styled-components', confidence: 'HIGH' });
  if (allDeps['@emotion/react'] || allDeps['@emotion/styled']) results.push({ name: 'emotion', confidence: 'HIGH' });

  // Vanilla CSS: check for plain .css imports
  if (results.length === 0) results.push({ name: 'vanilla-css', confidence: 'MEDIUM' });

  return results;
}
```

### Pattern 4: Regex-Based Component Detection
**What:** Use regex patterns to identify React/Vue/Svelte components without AST parsing
**When to use:** Component cataloging phase
**Example:**
```javascript
// Component detection patterns by framework
const COMPONENT_PATTERNS = {
  react: [
    // export default function ComponentName
    /export\s+default\s+function\s+([A-Z]\w+)/,
    // export function ComponentName
    /export\s+function\s+([A-Z]\w+)/,
    // export const ComponentName =
    /export\s+const\s+([A-Z]\w+)\s*[=:]/,
    // const ComponentName = ... (then check for JSX)
    /(?:const|let|var)\s+([A-Z]\w+)\s*=\s*(?:\([^)]*\)|[^=])*=>/,
    // export default class ComponentName
    /export\s+default\s+class\s+([A-Z]\w+)\s+extends\s+(?:React\.)?(?:Component|PureComponent)/,
    // class ComponentName extends Component
    /class\s+([A-Z]\w+)\s+extends\s+(?:React\.)?(?:Component|PureComponent)/,
  ],
  vue: [
    // .vue files are always components (SFC)
  ],
  svelte: [
    // .svelte files are always components
  ],
};

// Confidence scoring
function scoreComponentConfidence(filePath, content, dirHints) {
  let score = 0;

  // Directory heuristics (+30 each)
  if (/\/(components?|ui|widgets|elements|atoms|molecules)\//i.test(filePath)) score += 30;
  if (/\/(pages?|views?|screens?|routes?)\//i.test(filePath)) score += 20;
  if (/\/(layouts?|templates?)\//i.test(filePath)) score += 20;

  // Export pattern (+25)
  if (COMPONENT_PATTERNS.react.some(p => p.test(content))) score += 25;

  // JSX presence (+20)
  if (/<[A-Z]/.test(content) || /return\s*\(?\s*</.test(content)) score += 20;

  // File naming: PascalCase filename (+15)
  const basename = path.basename(filePath, path.extname(filePath));
  if (/^[A-Z][a-zA-Z0-9]+$/.test(basename)) score += 15;

  // Negative signals
  if (/\.(test|spec|story|stories)\./i.test(filePath)) score -= 50;
  if (/\/(test|__tests__|__mocks__|\.storybook)\//i.test(filePath)) score -= 50;
  if (basename === 'index' || basename === 'types' || basename === 'utils') score -= 20;

  // Map to confidence level
  if (score >= 50) return 'HIGH';
  if (score >= 25) return 'MEDIUM';
  return 'LOW';
}
```

### Pattern 5: Representative File Selection for Convention Sampling
**What:** Select 3-5 files that best represent the project's conventions
**When to use:** Before convention extraction
**Example:**
```javascript
function selectRepresentativeFiles(components) {
  // Strategy: pick files from different directories, preferring medium-sized ones
  // (too small = trivial wrappers, too large = complex one-offs)

  const highConfidence = components.filter(c => c.confidence === 'HIGH');
  if (highConfidence.length === 0) return components.slice(0, 3);

  // Group by directory
  const byDir = {};
  for (const comp of highConfidence) {
    const dir = path.dirname(comp.filePath);
    if (!byDir[dir]) byDir[dir] = [];
    byDir[dir].push(comp);
  }

  const selected = [];
  const dirs = Object.keys(byDir).sort();

  // Pick one from each unique directory (up to 3)
  for (const dir of dirs) {
    if (selected.length >= 3) break;
    // Prefer median-sized file in each directory
    const sorted = byDir[dir].sort((a, b) => a.lineCount - b.lineCount);
    const median = sorted[Math.floor(sorted.length / 2)];
    selected.push(median);
  }

  // Fill remaining slots from the largest directory
  const largestDir = dirs.sort((a, b) => byDir[b].length - byDir[a].length)[0];
  for (const comp of byDir[largestDir]) {
    if (selected.length >= 5) break;
    if (!selected.includes(comp)) selected.push(comp);
  }

  return selected;
}
```

### Pattern 6: Convention Extraction via Regex
**What:** Extract recurring CSS values and code patterns from sampled files
**When to use:** After representative file selection
**Example:**
```javascript
const CONVENTION_PATTERNS = {
  // Styling conventions
  borderRadius: {
    tailwind: /rounded-(\w+)/g,
    css: /border-radius:\s*([^;}\n]+)/g,
    cssVar: /var\(--radius-([^)]+)\)/g,
  },
  spacing: {
    tailwind: /(?:p|m|gap|space)-(\d+(?:\.5)?)/g,
    css: /(?:padding|margin|gap):\s*([^;}\n]+)/g,
  },
  shadows: {
    tailwind: /shadow-(\w+)/g,
    css: /box-shadow:\s*([^;}\n]+)/g,
  },
  colors: {
    tailwind: /(?:bg|text|border)-(\w+-\d+)/g,
    hex: /#[0-9a-fA-F]{3,8}/g,
    cssVar: /var\(--color-([^)]+)\)/g,
  },

  // Code conventions
  importStyle: {
    namedImport: /import\s*\{[^}]+\}\s*from/g,
    defaultImport: /import\s+\w+\s+from/g,
    barrelImport: /from\s+['"]\.\/(?:index)?['"]/g,
  },
  exportStyle: {
    namedExport: /export\s+(?:const|function|class)\s+/g,
    defaultExport: /export\s+default\s+/g,
  },
  namingCase: {
    kebab: /[a-z]+-[a-z]+\.(tsx?|jsx?|vue|svelte)$/,
    pascal: /[A-Z][a-z]+[A-Z]\w*\.(tsx?|jsx?|vue|svelte)$/,
    camel: /[a-z]+[A-Z]\w*\.(tsx?|jsx?|vue|svelte)$/,
  },
};

function extractConventions(projectRoot, representativeFiles) {
  const findings = {};

  for (const file of representativeFiles) {
    const content = fs.readFileSync(path.join(projectRoot, file.filePath), 'utf8');

    // Extract border-radius values
    for (const [patternType, regex] of Object.entries(CONVENTION_PATTERNS.borderRadius)) {
      let match;
      while ((match = regex.exec(content)) !== null) {
        if (!findings.borderRadius) findings.borderRadius = {};
        const val = match[1];
        findings.borderRadius[val] = (findings.borderRadius[val] || 0) + 1;
      }
    }
    // ... repeat for other patterns
  }

  return findings;
}
```

### Pattern 7: Prop Extraction via Regex
**What:** Extract basic prop names and types from component signatures
**When to use:** During component cataloging for HIGH-confidence components
**Example:**
```javascript
function extractProps(content, componentName) {
  const props = [];

  // Pattern 1: Destructured props -- function Component({ prop1, prop2 }: Props)
  const destructuredMatch = content.match(
    new RegExp(`(?:function\\s+${componentName}|const\\s+${componentName}\\s*=)\\s*\\(?\\s*\\{\\s*([^}]+)\\}`)
  );
  if (destructuredMatch) {
    const propStr = destructuredMatch[1];
    // Split on commas, handling default values
    const propNames = propStr.split(',').map(p => {
      const name = p.trim().split(/[=:]/)[0].trim();
      return name.replace(/^\.\.\./, ''); // Handle rest props
    }).filter(Boolean);
    props.push(...propNames.map(n => ({ name: n, required: !propStr.includes(`${n}?`) && !propStr.includes(`${n} =`) })));
  }

  // Pattern 2: Interface/Type definition -- interface ComponentProps { prop1: string; }
  const interfaceMatch = content.match(
    /(?:interface|type)\s+\w*Props\w*\s*(?:=\s*)?{([^}]+)}/
  );
  if (interfaceMatch) {
    const typeStr = interfaceMatch[1];
    const lines = typeStr.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const propMatch = line.match(/^(\w+)(\?)?\s*:/);
      if (propMatch) {
        props.push({ name: propMatch[1], required: !propMatch[2] });
      }
    }
  }

  return props;
}
```

### Anti-Patterns to Avoid
- **Scanning binary files:** Always check file extensions and skip non-text files. The existing isBinary() function from token-counter.js is a good reference but extension-based filtering is faster.
- **Reading huge files:** Cap file reading at 50KB for convention extraction. Huge files are typically generated code, not representative.
- **Scanning everything:** The skip-directory list must include ALL common artifact directories to avoid processing node_modules (which can contain thousands of files).
- **Over-parsing:** Do NOT attempt to resolve imports across files or build a dependency graph. Regex on individual files is sufficient for the detection depth needed.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Directory walking with exclusions | Custom recursive walker | Adapt the `walkFiles()` pattern from install.js, adding exclusion set | Already battle-tested in this codebase |
| Binary file detection | Custom binary detector | Extension-based allowlist (.js, .jsx, .ts, .tsx, .vue, .svelte, .css, .scss, .json) | Faster and more reliable than content sniffing for this use case |
| Markdown output formatting | String concatenation | Template-based approach with a formatter function | Prevents budget overruns and ensures consistent output |
| Token counting for budget compliance | Custom counter | Use existing `scripts/token-counter.js` to validate output size | Already exists, validated |

**Key insight:** The scanner is fundamentally a read-only file system analysis tool. Every piece of logic is pattern matching on text files. Resist the urge to add AST parsing or external dependencies -- regex gets 90% accuracy with 10% of the complexity, and user confirmation handles the remaining 10%.

## Common Pitfalls

### Pitfall 1: Token Budget Overrun
**What goes wrong:** PROJECT-SCAN.md exceeds 2000 tokens when a project has 100+ components, making downstream agents run out of context.
**Why it happens:** Naive output writes one line per component with full paths and all props.
**How to avoid:** GROUP components by directory with counts. Only list individual components in the drill-down sections. Cap the component list at the directory-summary level in PROJECT-SCAN.md. Full component details go in a separate section that downstream agents can skip.
**Warning signs:** Output file exceeds 8KB before conventions section.

### Pitfall 2: Symlink Loops
**What goes wrong:** The scanner follows symlinks and enters an infinite recursion, hanging or crashing.
**Why it happens:** Some monorepos use symlinks for workspace packages.
**How to avoid:** Track visited directories by inode/realpath. Use `fs.lstatSync()` instead of `fs.statSync()` to detect symlinks without following them. Skip symlinked directories entirely.
**Warning signs:** Scanner takes more than 5 seconds on any project.

### Pitfall 3: False Positive Components
**What goes wrong:** Utility files, hooks, context providers, and type definition files are classified as components.
**Why it happens:** They may have uppercase exports and even return JSX (context providers).
**How to avoid:** Apply negative signals: files in `hooks/`, `utils/`, `helpers/`, `lib/` directories get score penalties. Files named `use*.ts` are hooks, not components. Files with only type exports are type definitions. Context providers that wrap `<Context.Provider>` are infrastructure, not UI components. Use the confidence tag system (HIGH/MEDIUM/LOW) so the user can correct these.
**Warning signs:** More MEDIUM-confidence results than HIGH-confidence results.

### Pitfall 4: Encoding Issues
**What goes wrong:** The scanner crashes on files with non-UTF-8 encoding.
**Why it happens:** Some projects contain legacy files, generated code, or binary files with text extensions.
**How to avoid:** Wrap all `fs.readFileSync` in try/catch. If a file can't be read as UTF-8, skip it silently. Never crash the scan for a single unreadable file.
**Warning signs:** Errors during development testing on diverse projects.

### Pitfall 5: Breaking the Greenfield Workflow
**What goes wrong:** The scan integration changes the init flow in a way that breaks existing greenfield projects (no package.json, no src/).
**Why it happens:** Init conditionally auto-scans, but the condition is too broad or the scan output changes downstream expectations.
**How to avoid:** The greenfield path MUST remain the default. Auto-scan ONLY triggers when package.json AND a source directory (src/, app/, lib/, pages/) exist. When no scan runs, no scan artifacts exist, and all downstream commands work exactly as before. Gate the scan behind a clear conditional that defaults to "no scan."
**Warning signs:** `/motif:init` on a brand-new project behaves differently than v1.1.

### Pitfall 6: Component Category Misclassification
**What goes wrong:** A Card component is classified as a "page" or a Sidebar as a "primitive."
**Why it happens:** Category assignment based on filename alone is unreliable.
**How to avoid:** Use a multi-signal approach:
- Directory location: `pages/` -> page, `layouts/` -> layout, `components/ui/` -> primitive
- Size heuristic: very small files (< 30 lines) are more likely primitives, very large files (> 200 lines) are more likely pages or composites
- Import count: files that import many other components are likely composites/pages
- Common name matching: Button/Input/Badge -> primitive, Modal/Card/Dropdown -> composite, Dashboard/Settings -> page, Sidebar/Header/Footer -> layout
Present categories as suggestions, not facts. The user corrects during confirmation.

## Code Examples

### Directory Walking with Skip List
```javascript
// Source: Adapted from install.js walkFiles() + token-counter.js walkDir()
const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.output',
  '.svelte-kit', 'coverage', '.cache', '.turbo', '.vercel',
  '__pycache__', '.pytest_cache', 'vendor', '.bundle',
  '.planning', '.claude', '.motif-backup',
]);

const TEXT_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
  '.css', '.scss', '.less', '.sass',
  '.json', '.md', '.html', '.astro',
]);

function walkProject(dir, results = [], depth = 0) {
  if (depth > 10) return results; // Safety: max recursion depth

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return results; // Permission denied -- skip
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.') && entry.name !== '.env.example') continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Skip symlinks to prevent loops
      try {
        const stat = fs.lstatSync(fullPath);
        if (stat.isSymbolicLink()) continue;
      } catch (e) { continue; }

      walkProject(fullPath, results, depth + 1);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (TEXT_EXTENSIONS.has(ext)) {
        results.push({
          path: path.relative(dir, fullPath),
          ext,
          size: fs.statSync(fullPath).size,
        });
      }
    }
  }

  return results;
}
```

### PROJECT-SCAN.md Output Format
```markdown
# Project Scan

**Scanned:** [date]
**Root:** [project root path]

## Framework
- **Framework:** Next.js 14.x
- **Language:** TypeScript
- **Confidence:** HIGH

## CSS Approach
- **Primary:** Tailwind CSS
- **Secondary:** CSS Modules (3 files detected)
- **Confidence:** HIGH

## Directory Structure
```
src/
  app/           # Next.js App Router (12 routes)
  components/
    ui/          # 14 components (primitives)
    features/    # 8 components (composites)
  lib/           # 6 utility files
  hooks/         # 4 custom hooks
  types/         # 3 type definition files
```

## Component Catalog

### src/components/ui/ (14 components)
| Component | File | Export | Category | Confidence |
|-----------|------|--------|----------|------------|
| Button | Button.tsx | named | primitive | HIGH |
| Input | Input.tsx | named | primitive | HIGH |
| Card | Card.tsx | named | composite | HIGH |
| ... | ... | ... | ... | ... |

### src/components/features/ (8 components)
| Component | File | Export | Category | Confidence |
|-----------|------|--------|----------|------------|
| TransactionList | TransactionList.tsx | default | composite | HIGH |
| ... | ... | ... | ... | ... |

## Props Summary
[Only for HIGH-confidence components with detected props]
| Component | Props |
|-----------|-------|
| Button | variant, size, disabled, onClick, children |
| Input | type, placeholder, value, onChange, error |
```

### CONVENTIONS.md Output Format
```markdown
# Project Conventions

**Extracted from:** [N] representative files
**Scanned:** [date]

## Styling Conventions

### Border Radius
- **Dominant:** rounded-lg (60% usage, 12 occurrences)
- **Secondary:** rounded-md (30% usage, 6 occurrences)
- **Other:** rounded-full (10% usage, 2 occurrences -- pills/badges)
- **Inconsistency:** YES -- rounded-lg vs rounded-md for card-like elements

### Spacing Scale
- **Common padding:** p-4 (16px), p-6 (24px)
- **Common gap:** gap-4 (16px), gap-2 (8px)
- **Density impression:** comfortable

### Shadows
- **Usage:** shadow-sm on cards, shadow-md on modals
- **Frequency:** Low (3 occurrences)

### Colors
- **Named variables detected:** 0
- **Tailwind color usage:** blue-600, gray-100, gray-900
- **Custom theme colors:** primary, secondary (from tailwind.config)

## Code Conventions

### Imports
- **Style:** Named imports (85%), default imports (15%)
- **Path aliases:** @/ maps to src/ (detected in tsconfig.json)
- **Barrel files:** YES (index.ts in components/ui/)

### File Structure
- **Naming:** PascalCase for components, camelCase for utilities
- **Co-location:** Styles alongside components (*.module.css)
- **Test co-location:** Tests in __tests__/ directories

### Exports
- **Dominant:** Named exports (export const Component)
- **Secondary:** Default exports (some page components)
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| AST parsing for component detection | Regex + heuristics with confidence tags | N/A (design decision) | Zero dependencies, user-correctable results, faster execution |
| Full project index | Sampled convention extraction (3-5 files) | N/A (design decision) | Fits context budget, representative enough for downstream |

**Project-specific notes:**
- The existing Motif state machine needs a new `SCANNED` state, or scan artifacts are checked as a conditional within `INITIALIZED`
- The context engine needs a new profile for the scanner (though it runs in main context, not subagent)
- PROJECT-SCAN.md and CONVENTIONS.md need entries in the context budget table

## Open Questions

1. **State Machine Integration: New State vs. Conditional?**
   - What we know: The state machine currently goes UNINITIALIZED -> INITIALIZED. Scanning happens before or during init for brownfield projects.
   - What's unclear: Whether to add a SCANNED state between UNINITIALIZED and INITIALIZED, or treat scan as a sub-step within init that produces additional artifacts
   - Recommendation: Do NOT add a new state. Keep scan as a pre-step within init that produces PROJECT-SCAN.md and CONVENTIONS.md. The `/motif:scan` command can re-run the scan at any phase >= INITIALIZED. This avoids breaking the state machine for greenfield projects. The system generator checks for PROJECT-SCAN.md existence to decide brownfield vs. greenfield behavior.

2. **Combined Token Budget: Where Do Scan Artifacts Sit?**
   - What we know: Context budget is ~15K tokens total for a fully-loaded subagent. Scan results must stay under 2000 tokens.
   - What's unclear: Whether the 2000 token budget is for PROJECT-SCAN.md alone or combined with CONVENTIONS.md
   - Recommendation: Split as ~1200 tokens for PROJECT-SCAN.md, ~800 tokens for CONVENTIONS.md. The scanner should enforce these limits by truncating component lists and convention detail sections. Add both files to the context budget table in STATE.md.

3. **How Does /motif:system Consume Scan Artifacts?**
   - What we know: Phase 14 handles token integration. Phase 13 only produces scan artifacts.
   - What's unclear: Whether /motif:system needs any changes in this phase or if that's entirely Phase 14's concern
   - Recommendation: Phase 13 does NOT modify /motif:system. It only produces the files. Phase 14 will modify the system generator to consume them. Phase 13's responsibility ends at: scan -> user confirmation -> write files.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `bin/install.js` -- walkFiles(), file system patterns, zero-dependency approach
- Existing codebase: `scripts/token-counter.js` -- directory walking, binary detection
- Existing codebase: `scripts/contrast-checker.js` -- CLI script pattern
- Existing codebase: `.claude/get-motif/references/state-machine.md` -- state transitions
- Existing codebase: `.claude/get-motif/references/context-engine.md` -- context budgets
- Existing codebase: `.claude/get-motif/hooks/motif-token-check.js` -- regex pattern matching on CSS

### Secondary (MEDIUM confidence)
- [PreviewJS component detection](https://fwouts.com/articles/previewjs-detecting-components) -- TypeScript Compiler API vs regex tradeoffs (verified approach aligns with our decision to use regex)
- [Tailwind CSS class detection](https://tailwindcss.com/docs/detecting-classes-in-source-files) -- how Tailwind scans source files as plain text

### Tertiary (LOW confidence)
- None -- all findings verified against existing codebase patterns or official documentation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- zero dependencies, consistent with existing scripts pattern
- Architecture: HIGH -- pipeline pattern directly derived from existing codebase conventions
- Pitfalls: HIGH -- derived from known file system scanning edge cases and Motif-specific integration points
- Code examples: MEDIUM -- regex patterns are custom-designed for this use case, will need testing against real projects

**Research date:** 2026-03-05
**Valid until:** 2026-04-05 (stable -- Node.js built-ins, no external dependencies to change)
