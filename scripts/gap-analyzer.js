#!/usr/bin/env node

/**
 * gap-analyzer.js
 *
 * Component gap analysis: compares a scanned project's component catalog
 * against Motif's core and vertical-specific component lists.
 *
 * Usage:
 *   node scripts/gap-analyzer.js [project-root] [--vertical <name>] [--output-dir <dir>]
 *
 * Inputs:
 *   - .planning/design/PROJECT-SCAN.md (component catalog from project-scanner.js)
 *   - .planning/design/STATE.md (vertical name, if not provided via --vertical)
 *
 * Output:
 *   - .planning/design/COMPONENT-GAP.md
 *
 * Zero dependencies -- uses only Node.js built-ins.
 */

const fs = require('fs');
const path = require('path');

// ─── Core Component List ─────────────────────────────────────────────────────

const CORE_COMPONENTS = [
  { name: 'Button', description: 'Primary action trigger with variants' },
  { name: 'Input', description: 'Text input with validation states' },
  { name: 'Card', description: 'Content container with optional header/footer' },
  { name: 'Badge', description: 'Status indicator with color variants' },
  { name: 'Avatar', description: 'User/entity image with fallback' },
  { name: 'Toast', description: 'Temporary notification message' },
  { name: 'Modal', description: 'Overlay dialog for focused interactions' },
  { name: 'Dropdown', description: 'Selection menu or action menu' },
  { name: 'Table', description: 'Data table with sortable columns' },
  { name: 'Nav', description: 'Navigation bar or sidebar' },
];

// ─── Vertical-Specific Component Lists ───────────────────────────────────────

const VERTICAL_COMPONENTS = {
  fintech: [
    { name: 'TransactionRow', description: 'Transaction list item with amount and status' },
    { name: 'BalanceCard', description: 'Account balance display with trend' },
    { name: 'StatusChip', description: 'Transaction/account status indicator' },
  ],
  health: [
    { name: 'MetricCard', description: 'Health metric with value and trend' },
    { name: 'ProgressRing', description: 'Circular progress indicator' },
    { name: 'LogEntry', description: 'Health log item with timestamp' },
  ],
  saas: [
    { name: 'DataTable', description: 'Advanced data table with filters' },
    { name: 'CommandPalette', description: 'Keyboard-driven command search' },
    { name: 'FilterBar', description: 'Multi-criteria filter controls' },
  ],
  ecommerce: [
    { name: 'ProductCard', description: 'Product display with image and price' },
    { name: 'CartItem', description: 'Shopping cart line item' },
    { name: 'PriceDisplay', description: 'Price with currency formatting' },
  ],
};

// ─── Alias Table for Known Equivalents ───────────────────────────────────────

const ALIASES = {
  table: ['datatable', 'grid', 'datagrid'],
  nav: ['navbar', 'navigation', 'sidebar', 'sidenav', 'topbar', 'header'],
  dropdown: ['select', 'menu', 'popover', 'combobox', 'listbox'],
  toast: ['notification', 'snackbar', 'alert', 'banner'],
  modal: ['dialog', 'overlay', 'popup', 'drawer', 'sheet'],
  input: ['textfield', 'textinput', 'formfield', 'textbox'],
  badge: ['chip', 'tag', 'label', 'statuschip', 'indicator'],
  avatar: ['userpic', 'profileimage', 'userimage'],
  card: ['panel', 'tile', 'container'],
  button: ['btn', 'cta', 'action'],
};

// ─── File Reading Utilities ──────────────────────────────────────────────────

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

// ─── Parse PROJECT-SCAN.md Component Catalog ─────────────────────────────────

/**
 * Extracts components from PROJECT-SCAN.md's Component Catalog section.
 * Parses markdown tables with columns: Name, File, Type, Confidence.
 * Only returns components with HIGH or MEDIUM confidence.
 */
function parseProjectScan(projectRoot) {
  const scanPath = path.join(projectRoot, '.planning', 'design', 'PROJECT-SCAN.md');
  const content = safeReadFile(scanPath);

  if (!content) {
    return { error: 'no-scan-file' };
  }

  // Check for "No components detected" or empty catalog
  if (content.includes('No components detected')) {
    return { components: [], source: scanPath };
  }

  // Find the Component Catalog section
  const catalogMatch = content.match(/## Component Catalog\s*\n([\s\S]*?)(?=\n## |\n---|$)/);
  if (!catalogMatch) {
    return { components: [], source: scanPath };
  }

  const catalogSection = catalogMatch[1];

  // Parse markdown table rows
  // Expected format: | Name | File | Type | Confidence |
  const components = [];
  const lines = catalogSection.split('\n').filter(l => l.trim().startsWith('|'));

  // Skip header row (index 0) and separator row (index 1)
  const dataLines = lines.slice(2);

  for (const line of dataLines) {
    const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);
    if (cells.length < 4) continue;

    const name = cells[0];
    const file = cells[1];
    const type = cells[2];
    const confidence = cells[3].toUpperCase();

    // Skip separator rows that might appear
    if (name.startsWith('-') || name.startsWith(':')) {
      continue;
    }

    // Only include HIGH and MEDIUM confidence components
    if (confidence === 'HIGH' || confidence === 'MEDIUM') {
      components.push({
        name,
        file,
        type,
        confidence,
      });
    }
  }

  return { components, source: scanPath };
}

// ─── Read Vertical from STATE.md ─────────────────────────────────────────────

function readVerticalFromState(projectRoot) {
  const statePath = path.join(projectRoot, '.planning', 'design', 'STATE.md');
  const content = safeReadFile(statePath);

  if (!content) {
    return null;
  }

  // Look for Vertical field in various formats
  const patterns = [
    /\*\*Vertical:\*\*\s*(\S+)/i,
    /Vertical:\s*(\S+)/i,
    /vertical\s*[:=]\s*['"]?(\w+)['"]?/i,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1].toLowerCase();
    }
  }

  return null;
}

// ─── 3-Tier Matching Algorithm ───────────────────────────────────────────────

/**
 * Attempts to match a required component name against scanned components.
 * Returns { scanned, matchType } or null.
 *
 * Tier 1: Exact match (case-insensitive) -> HIGH confidence
 * Tier 2: Alias match -> MEDIUM confidence
 * Tier 3: Contains match -> MEDIUM confidence
 */
function findMatch(requiredName, scannedComponents) {
  const reqLower = requiredName.toLowerCase();

  // Tier 1: Exact match
  for (const comp of scannedComponents) {
    if (comp.name.toLowerCase() === reqLower) {
      return { scanned: comp, matchType: 'Exact' };
    }
  }

  // Tier 2: Alias match
  // Check if any alias of the required component matches a scanned component
  const reqAliases = ALIASES[reqLower] || [];

  // Also check reverse: if the scanned component's lowercase name is an alias of the required
  for (const comp of scannedComponents) {
    const compLower = comp.name.toLowerCase();

    // Forward: required component has aliases, check if scanned matches any
    if (reqAliases.includes(compLower)) {
      return {
        scanned: comp,
        matchType: `Alias (${requiredName}=${comp.name})`,
      };
    }

    // Reverse: check if scanned component is a key in ALIASES that lists reqLower
    for (const [canonical, aliasList] of Object.entries(ALIASES)) {
      if (compLower === canonical && aliasList.includes(reqLower)) {
        return {
          scanned: comp,
          matchType: `Alias (${comp.name}=${requiredName})`,
        };
      }
      if (aliasList.includes(compLower) && canonical === reqLower) {
        return {
          scanned: comp,
          matchType: `Alias (${requiredName}=${comp.name})`,
        };
      }
    }
  }

  // Tier 3: Contains match
  for (const comp of scannedComponents) {
    const compLower = comp.name.toLowerCase();
    if (compLower.includes(reqLower) || reqLower.includes(compLower)) {
      // Avoid spurious matches for very short names
      if (reqLower.length >= 3 && compLower.length >= 3) {
        return {
          scanned: comp,
          matchType: `Contains (${comp.name} ~ ${requiredName})`,
        };
      }
    }
  }

  return null;
}

// ─── Build Required Component List ───────────────────────────────────────────

function buildRequiredList(vertical) {
  const required = CORE_COMPONENTS.map(c => ({
    ...c,
    type: 'core',
  }));

  if (vertical && VERTICAL_COMPONENTS[vertical]) {
    for (const comp of VERTICAL_COMPONENTS[vertical]) {
      required.push({
        ...comp,
        type: `vertical (${vertical})`,
      });
    }
  }

  return required;
}

// ─── Run Gap Analysis ────────────────────────────────────────────────────────

function analyzeGap(requiredComponents, scannedComponents) {
  const existing = [];
  const missing = [];
  const partial = [];

  for (const req of requiredComponents) {
    const match = findMatch(req.name, scannedComponents);

    if (!match) {
      missing.push({
        component: req.name,
        type: req.type,
        description: req.description,
      });
      continue;
    }

    if (match.matchType === 'Exact') {
      existing.push({
        required: req.name,
        foundAs: match.scanned.name,
        file: match.scanned.file,
        matchQuality: 'Exact',
      });
    } else {
      // Alias or Contains matches are partial
      partial.push({
        required: req.name,
        foundAs: match.scanned.name,
        file: match.scanned.file,
        matchQuality: match.matchType,
      });
    }
  }

  return { existing, missing, partial };
}

// ─── Generate COMPONENT-GAP.md ──────────────────────────────────────────────

function generateGapMarkdown(results, vertical, scannedCount, totalRequired) {
  const { existing, missing, partial } = results;
  const date = new Date().toISOString().split('T')[0];

  const coreRequired = CORE_COMPONENTS.length;
  const verticalRequired = (vertical && VERTICAL_COMPONENTS[vertical])
    ? VERTICAL_COMPONENTS[vertical].length
    : 0;

  const coreFound = existing.filter((_, i) => i < coreRequired).length
    + partial.filter(p => {
      return CORE_COMPONENTS.some(c => c.name === p.required);
    }).length;

  const verticalFound = verticalRequired > 0
    ? existing.filter(e => {
        return VERTICAL_COMPONENTS[vertical].some(c => c.name === e.required);
      }).length
      + partial.filter(p => {
        return VERTICAL_COMPONENTS[vertical].some(c => c.name === p.required);
      }).length
    : 0;

  const totalFound = existing.length + partial.length;
  const toGenerate = missing.length;

  const verticalLabel = vertical || 'unknown';

  let md = `# Component Gap Analysis

**Analyzed:** ${date}
**Vertical:** ${verticalLabel}
**Project components:** ${scannedCount} found (from PROJECT-SCAN.md)

## Summary
- **Core components (Motif standard):** ${coreFound}/${coreRequired} found
`;

  if (verticalRequired > 0) {
    md += `- **Vertical components (${vertical}):** ${verticalFound}/${verticalRequired} found\n`;
  }

  md += `- **Total coverage:** ${totalFound}/${totalRequired} required components exist
- **To generate:** ${toGenerate} components

`;

  // Existing table
  if (existing.length > 0) {
    md += `## Existing (No Generation Needed)
| Required | Found As | File | Match Quality |
|----------|----------|------|---------------|
`;
    for (const e of existing) {
      md += `| ${e.required} | ${e.foundAs} | ${e.file} | ${e.matchQuality} |\n`;
    }
    md += '\n';
  }

  // Missing table
  if (missing.length > 0) {
    md += `## Missing (Motif Will Generate)
| Component | Type | Description |
|-----------|------|-------------|
`;
    for (const m of missing) {
      md += `| ${m.component} | ${m.type} | ${m.description} |\n`;
    }
    md += '\n';
  }

  // Partial matches table
  if (partial.length > 0) {
    md += `## Partial Matches (May Need Enhancement)
| Required | Found As | File | Match Quality |
|----------|----------|------|---------------|
`;
    for (const p of partial) {
      md += `| ${p.required} | ${p.foundAs} | ${p.file} | ${p.matchQuality} |\n`;
    }
    md += '\n';
  }

  return md;
}

// ─── CLI Argument Parsing ────────────────────────────────────────────────────

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    projectRoot: null,
    vertical: null,
    outputDir: null,
  };

  let i = 0;
  while (i < args.length) {
    if (args[i] === '--vertical' && i + 1 < args.length) {
      options.vertical = args[i + 1].toLowerCase();
      i += 2;
    } else if (args[i] === '--output-dir' && i + 1 < args.length) {
      options.outputDir = args[i + 1];
      i += 2;
    } else if (!args[i].startsWith('--') && !options.projectRoot) {
      options.projectRoot = args[i];
      i += 1;
    } else {
      i += 1;
    }
  }

  if (!options.projectRoot) {
    options.projectRoot = process.cwd();
  }

  // Resolve to absolute
  options.projectRoot = path.resolve(options.projectRoot);

  if (!options.outputDir) {
    options.outputDir = options.projectRoot;
  } else {
    options.outputDir = path.resolve(options.outputDir);
  }

  return options;
}

// ─── Main ────────────────────────────────────────────────────────────────────

function main() {
  const options = parseArgs(process.argv);
  const { projectRoot, outputDir } = options;

  // Step 1: Parse PROJECT-SCAN.md
  const scanResult = parseProjectScan(projectRoot);

  if (scanResult.error === 'no-scan-file') {
    console.log('No PROJECT-SCAN.md found. Run /motif:scan first.');
    process.exit(0);
  }

  const scannedComponents = scanResult.components;

  if (!scannedComponents) {
    console.log('No components found in PROJECT-SCAN.md');
    process.exit(0);
  }

  // Step 2: Determine vertical
  let vertical = options.vertical;
  let verticalWarning = null;

  if (!vertical) {
    vertical = readVerticalFromState(projectRoot);
  }

  if (!vertical) {
    verticalWarning = 'Vertical unknown -- using core components only.';
    console.log(verticalWarning);
  } else if (!VERTICAL_COMPONENTS[vertical]) {
    verticalWarning = `Unrecognized vertical "${vertical}" -- using core components only.`;
    console.log(verticalWarning);
    vertical = null;
  }

  // Step 3: Build required component list
  const requiredComponents = buildRequiredList(vertical);
  const totalRequired = requiredComponents.length;

  // Step 4: Run gap analysis
  const results = analyzeGap(requiredComponents, scannedComponents);

  // Step 5: Generate COMPONENT-GAP.md
  const markdown = generateGapMarkdown(
    results,
    vertical,
    scannedComponents.length,
    totalRequired
  );

  // Step 6: Write output
  const outputPath = path.join(outputDir, '.planning', 'design', 'COMPONENT-GAP.md');
  const outputDirPath = path.dirname(outputPath);

  if (!fs.existsSync(outputDirPath)) {
    fs.mkdirSync(outputDirPath, { recursive: true });
  }

  fs.writeFileSync(outputPath, markdown, 'utf-8');

  // Step 7: Print summary
  const totalFound = results.existing.length + results.partial.length;
  const toGenerate = results.missing.length;
  console.log(`${totalFound} of ${totalRequired} required components found. ${toGenerate} to generate.`);
  console.log(`Output: ${outputPath}`);
}

main();
