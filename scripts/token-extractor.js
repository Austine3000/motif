#!/usr/bin/env node
'use strict';

/**
 * Token Extractor (TOKN-01)
 *
 * Usage: node scripts/token-extractor.js [project-root] [--output-dir <dir>]
 * Defaults to cwd if no project-root provided.
 * Defaults to project-root for output-dir.
 *
 * Extracts design tokens from CSS custom properties, Tailwind config,
 * and JS theme files. Outputs TOKEN-INVENTORY.md if tokens are found.
 *
 * Zero external dependencies -- pure Node.js.
 */

const fs = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.output',
  '.svelte-kit', 'coverage', '.cache', '.turbo', '.vercel',
  '__pycache__', '.pytest_cache', 'vendor', '.bundle',
  '.planning', '.claude', '.motif-backup',
]);

const CSS_EXTENSIONS = new Set(['.css', '.scss']);

const CSS_VAR_PATTERN = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;

const MAX_FILE_SIZE = 50 * 1024; // 50KB
const MAX_DEPTH = 10;

const TAILWIND_CONFIG_FILES = [
  'tailwind.config.js', 'tailwind.config.ts',
  'tailwind.config.mjs', 'tailwind.config.cjs',
];

const JS_THEME_FILES = [
  'src/theme.ts', 'src/theme.js', 'src/theme.tsx', 'src/theme.jsx',
  'src/styles/theme.ts', 'src/styles/theme.js',
  'src/styles/theme.tsx', 'src/styles/theme.jsx',
  'src/lib/theme.ts', 'src/lib/theme.js',
  'theme.ts', 'theme.js',
  'styled.d.ts',
];

const MOTIF_TOKEN_CATEGORIES = {
  colors: {
    patterns: [/color/i, /bg/i, /text-/i, /border-/i, /surface/i, /primary/i, /secondary/i, /success/i, /error/i, /warning/i, /info/i, /brand/i, /accent/i, /neutral/i, /gray/i, /grey/i],
    valuePatterns: [/^#[0-9a-fA-F]{3,8}$/, /^rgb/, /^hsl/],
    required: [
      'color-primary-*', 'color-success', 'color-error', 'color-warning', 'color-info',
      'surface-primary', 'surface-secondary', 'text-primary', 'text-secondary', 'border-primary',
    ],
  },
  typography: {
    patterns: [/font/i, /text-size/i, /leading/i, /weight/i, /tracking/i, /letter-spacing/i, /line-height/i],
    valuePatterns: [/^\d+px$/, /^\d+rem$/, /^\d+$/, /^['"]/, /sans-serif/i, /serif/i, /mono/i],
    required: [
      'font-display', 'font-body', 'text-base', 'text-sm', 'text-lg',
      'weight-normal', 'weight-medium', 'weight-semibold', 'weight-bold',
    ],
  },
  spacing: {
    patterns: [/space/i, /gap/i, /padding/i, /margin/i, /size/i],
    valuePatterns: [/^\d+px$/, /^\d+rem$/, /^\d+(\.\d+)?em$/],
    required: ['space-1', 'space-2', 'space-3', 'space-4', 'space-6', 'space-8'],
  },
  radii: {
    patterns: [/radius/i, /rounded/i, /corner/i],
    valuePatterns: [/^\d+px$/, /^\d+rem$/],
    required: ['radius-sm', 'radius-md', 'radius-lg'],
  },
  shadows: {
    patterns: [/shadow/i, /elevation/i],
    valuePatterns: [/^\d+px\s/, /^none$/],
    required: ['shadow-sm', 'shadow-md', 'shadow-lg'],
  },
  transitions: {
    patterns: [/ease/i, /duration/i, /transition/i, /timing/i, /motion/i],
    valuePatterns: [/^\d+ms$/, /^\d+s$/, /^ease/, /^cubic-bezier/],
    required: ['ease-default', 'duration-fast', 'duration-normal'],
  },
};

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/token-extractor.js [project-root] [--output-dir <dir>]');
  console.log('');
  console.log('Extracts design tokens from CSS custom properties, Tailwind config,');
  console.log('and JS theme files. Outputs TOKEN-INVENTORY.md if tokens are found.');
  console.log('');
  console.log('Options:');
  console.log('  --output-dir <dir>  Directory for output files (default: project-root)');
  console.log('  --help, -h          Show this help message');
  process.exit(0);
}

let projectRoot = process.cwd();
let outputDir = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output-dir' && args[i + 1]) {
    outputDir = args[i + 1];
    i++;
  } else if (!args[i].startsWith('-')) {
    projectRoot = args[i];
  }
}

projectRoot = path.resolve(projectRoot);
outputDir = outputDir ? path.resolve(outputDir) : projectRoot;

if (!fs.existsSync(projectRoot)) {
  console.error(`Project root not found: ${projectRoot}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely read a file as UTF-8. Returns null on any error.
 */
function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) return null;
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}

/**
 * Walk project for files matching specific extensions.
 * Returns array of { relativePath, fullPath, ext }.
 */
function walkForExtensions(dir, rootDir, extensions, results, depth, visited) {
  if (depth > MAX_DEPTH) return results;

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      try {
        const lstat = fs.lstatSync(fullPath);
        if (lstat.isSymbolicLink()) continue;
        const realPath = fs.realpathSync(fullPath);
        if (visited.has(realPath)) continue;
        visited.add(realPath);
      } catch (e) {
        continue;
      }
      walkForExtensions(fullPath, rootDir, extensions, results, depth + 1, visited);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (extensions.has(ext)) {
        results.push({
          relativePath: path.relative(rootDir, fullPath),
          fullPath,
          ext,
        });
      }
    }
  }

  return results;
}

// ---------------------------------------------------------------------------
// Pipeline 1: CSS Custom Property Extraction
// ---------------------------------------------------------------------------

/**
 * Check if a match position is inside a global scope (:root, html, :host).
 */
function isInGlobalScope(content, matchIndex) {
  const before = content.substring(0, matchIndex);
  const lastRoot = Math.max(
    before.lastIndexOf(':root'),
    before.lastIndexOf('html {'),
    before.lastIndexOf('html{'),
    before.lastIndexOf(':host {'),
    before.lastIndexOf(':host{')
  );
  if (lastRoot === -1) return false;

  const between = before.substring(lastRoot);
  const opens = (between.match(/\{/g) || []).length;
  const closes = (between.match(/\}/g) || []).length;
  return opens > closes;
}

function extractCSSCustomProperties(projectRoot) {
  const visited = new Set();
  try {
    visited.add(fs.realpathSync(projectRoot));
  } catch (e) {
    // Continue
  }

  const cssFiles = walkForExtensions(projectRoot, projectRoot, CSS_EXTENSIONS, [], 0, visited);
  const tokens = {};
  const fileCount = cssFiles.length;

  for (const file of cssFiles) {
    const content = safeReadFile(file.fullPath);
    if (!content) continue;

    const regex = new RegExp(CSS_VAR_PATTERN.source, 'g');
    let match;
    while ((match = regex.exec(content)) !== null) {
      const name = match[1].trim();
      const value = match[2].trim();
      const isGlobal = isInGlobalScope(content, match.index);

      if (!tokens[name]) {
        tokens[name] = {
          value,
          source: file.relativePath,
          isGlobal,
          count: 1,
        };
      } else {
        tokens[name].count++;
        if (tokens[name].value !== value) {
          tokens[name].inconsistent = true;
          if (!tokens[name].alternateValues) {
            tokens[name].alternateValues = [tokens[name].value];
          }
          tokens[name].alternateValues.push(value);
        }
      }
    }
  }

  return { tokens, fileCount };
}

// ---------------------------------------------------------------------------
// Pipeline 2: Tailwind Config Extraction
// ---------------------------------------------------------------------------

function extractTailwindConfig(projectRoot) {
  let configPath = null;
  for (const cp of TAILWIND_CONFIG_FILES) {
    const full = path.join(projectRoot, cp);
    if (fs.existsSync(full)) {
      configPath = full;
      break;
    }
  }

  if (!configPath) return null;

  const content = safeReadFile(configPath);
  if (!content) return null;

  // Check for dynamic values that lower confidence
  const hasDynamicValues = /require\s*\(/.test(content) ||
    /\.\.\./.test(content) ||
    /\bfunction\b/.test(content) ||
    /=>\s*\{/.test(content);

  const confidence = hasDynamicValues ? 'LOW' : 'HIGH';

  const sections = {};
  const sectionNames = ['colors', 'spacing', 'borderRadius', 'fontSize', 'fontFamily', 'boxShadow'];

  for (const sectionName of sectionNames) {
    const extracted = extractTailwindSection(content, sectionName);
    if (extracted && Object.keys(extracted).length > 0) {
      sections[sectionName] = extracted;
    }
  }

  if (Object.keys(sections).length === 0) {
    return { detected: true, parsed: false, confidence, configFile: path.basename(configPath) };
  }

  return { detected: true, parsed: true, confidence, sections, configFile: path.basename(configPath) };
}

function extractTailwindSection(content, sectionName) {
  // Try theme.extend.[section] first, then theme.[section]
  const patterns = [
    new RegExp(`extend\\s*:\\s*\\{[^}]*?${sectionName}\\s*:\\s*\\{([^}]+)\\}`, 's'),
    new RegExp(`theme\\s*:\\s*\\{[^}]*?${sectionName}\\s*:\\s*\\{([^}]+)\\}`, 's'),
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
  const entries = {};
  // Match both quoted and unquoted keys with quoted values
  const kvPattern = /['"]?([a-zA-Z0-9_-]+)['"]?\s*:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = kvPattern.exec(str)) !== null) {
    entries[match[1]] = match[2];
  }
  return Object.keys(entries).length > 0 ? entries : null;
}

// ---------------------------------------------------------------------------
// Pipeline 3: JS Theme File Extraction (best-effort)
// ---------------------------------------------------------------------------

function extractJSThemeTokens(projectRoot) {
  // Only run if PROJECT-SCAN.md indicates styled-components or Emotion
  const scanPath = path.join(projectRoot, '.planning', 'design', 'PROJECT-SCAN.md');
  const scanContent = safeReadFile(scanPath);

  if (!scanContent) return null;

  const hasCSSinJS = /styled-components/i.test(scanContent) || /emotion/i.test(scanContent);
  if (!hasCSSinJS) return null;

  // Look for theme files
  let themeContent = null;
  let themeFile = null;

  for (const tf of JS_THEME_FILES) {
    const full = path.join(projectRoot, tf);
    if (fs.existsSync(full)) {
      themeContent = safeReadFile(full);
      if (themeContent) {
        themeFile = tf;
        break;
      }
    }
  }

  if (!themeContent) {
    return { detected: true, parsed: false, note: 'CSS-in-JS detected but no theme file found at common locations' };
  }

  // Extract key-value pairs from exported objects
  const tokens = {};
  const kvPattern = /['"]?([a-zA-Z0-9_-]+)['"]?\s*:\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = kvPattern.exec(themeContent)) !== null) {
    tokens[match[1]] = { value: match[2], source: themeFile, confidence: 'LOW' };
  }

  if (Object.keys(tokens).length === 0) {
    return { detected: true, parsed: false, note: 'Theme file found but could not extract token values' };
  }

  return { detected: true, parsed: true, tokens, themeFile, confidence: 'LOW' };
}

// ---------------------------------------------------------------------------
// Token Categorization
// ---------------------------------------------------------------------------

function categorizeToken(name, value) {
  const normalizedName = name.toLowerCase();

  for (const [category, config] of Object.entries(MOTIF_TOKEN_CATEGORIES)) {
    // Check name patterns
    for (const pattern of config.patterns) {
      if (pattern.test(normalizedName)) {
        return category;
      }
    }
  }

  // Check value-based heuristics
  const trimmedValue = value.trim();
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmedValue) || /^rgb/.test(trimmedValue) || /^hsl/.test(trimmedValue)) {
    return 'colors';
  }
  if (/^['"].*sans|serif|mono/i.test(trimmedValue)) {
    return 'typography';
  }

  return 'uncategorized';
}

function findMotifEquivalent(name, category) {
  const normalizedName = name.toLowerCase();
  const config = MOTIF_TOKEN_CATEGORIES[category];
  if (!config) return null;

  for (const req of config.required) {
    const reqNormalized = req.replace(/-/g, '').replace(/\*/g, '');
    const nameNormalized = normalizedName.replace(/-/g, '').replace(/_/g, '');

    // Direct match
    if (normalizedName === req || normalizedName === req.replace(/\*/g, '')) {
      return req;
    }

    // Partial match via keywords
    if (req.includes('*')) {
      const prefix = req.split('*')[0].replace(/-$/, '');
      if (normalizedName.includes(prefix.replace(/-/g, ''))) {
        return req;
      }
    }

    // Heuristic mappings
    if (category === 'colors') {
      if (/primary|brand|main|accent/.test(normalizedName) && req.includes('primary')) return req;
      if (/success|green/.test(normalizedName) && req === 'color-success') return req;
      if (/error|red|danger/.test(normalizedName) && req === 'color-error') return req;
      if (/warning|yellow|amber/.test(normalizedName) && req === 'color-warning') return req;
      if (/info|blue|notice/.test(normalizedName) && req === 'color-info') return req;
      if (/surface|background/.test(normalizedName) && req.includes('surface')) return req;
      if (/text|foreground/.test(normalizedName) && req.includes('text')) return req;
      if (/border/.test(normalizedName) && req === 'border-primary') return req;
    }
    if (category === 'typography') {
      if (/display|heading|title/.test(normalizedName) && req === 'font-display') return req;
      if (/body|sans|base/.test(normalizedName) && req === 'font-body') return req;
      if (/base|default/.test(normalizedName) && req === 'text-base') return req;
      if (/sm|small/.test(normalizedName) && req === 'text-sm') return req;
      if (/lg|large/.test(normalizedName) && req === 'text-lg') return req;
      if (/normal/.test(normalizedName) && req === 'weight-normal') return req;
      if (/medium/.test(normalizedName) && req === 'weight-medium') return req;
      if (/semi/.test(normalizedName) && req === 'weight-semibold') return req;
      if (/bold/.test(normalizedName) && req === 'weight-bold') return req;
    }
    if (category === 'spacing') {
      const numMatch = normalizedName.match(/(\d+)/);
      const reqNumMatch = req.match(/(\d+)/);
      if (numMatch && reqNumMatch && numMatch[1] === reqNumMatch[1]) return req;
    }
    if (category === 'radii') {
      if (/sm|small/.test(normalizedName) && req === 'radius-sm') return req;
      if (/md|medium|default/.test(normalizedName) && req === 'radius-md') return req;
      if (/lg|large/.test(normalizedName) && req === 'radius-lg') return req;
    }
    if (category === 'shadows') {
      if (/sm|small/.test(normalizedName) && req === 'shadow-sm') return req;
      if (/md|medium|default/.test(normalizedName) && req === 'shadow-md') return req;
      if (/lg|large/.test(normalizedName) && req === 'shadow-lg') return req;
    }
    if (category === 'transitions') {
      if (/default|ease/.test(normalizedName) && req === 'ease-default') return req;
      if (/fast|quick/.test(normalizedName) && req === 'duration-fast') return req;
      if (/normal|base/.test(normalizedName) && req === 'duration-normal') return req;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Coverage Calculation
// ---------------------------------------------------------------------------

function calculateCoverage(categorizedTokens) {
  const coverage = {};

  for (const [category, config] of Object.entries(MOTIF_TOKEN_CATEGORIES)) {
    const categoryTokens = categorizedTokens[category] || [];
    const matched = [];
    const missing = [];
    const matchedReqs = new Set();

    for (const req of config.required) {
      let found = false;
      for (const token of categoryTokens) {
        if (token.motifEquivalent === req && !matchedReqs.has(req)) {
          matched.push({ required: req, found: token.name, value: token.value });
          matchedReqs.add(req);
          found = true;
          break;
        }
      }
      if (!found) {
        missing.push(req);
      }
    }

    const total = config.required.length;
    const pct = total > 0 ? Math.round((matched.length / total) * 100) : 0;

    coverage[category] = { matched, missing, total, percentage: pct };
  }

  return coverage;
}

// ---------------------------------------------------------------------------
// Output: TOKEN-INVENTORY.md
// ---------------------------------------------------------------------------

function writeTokenInventory(outputDir, data) {
  const { cssResult, tailwindResult, jsThemeResult, categorized, coverage, totalTokenCount } = data;
  const date = new Date().toISOString().split('T')[0];

  const lines = [];
  lines.push('# Token Inventory');
  lines.push('');
  lines.push(`**Extracted:** ${date}`);
  lines.push(`**Source:** ${projectRoot}`);
  lines.push('');

  // Summary
  lines.push('## Summary');
  const cssCount = Object.keys(cssResult.tokens).length;
  lines.push(`- **CSS Custom Properties:** ${cssCount} found across ${cssResult.fileCount} files`);

  if (tailwindResult) {
    if (tailwindResult.parsed) {
      const twCount = Object.values(tailwindResult.sections).reduce((sum, s) => sum + Object.keys(s).length, 0);
      lines.push(`- **Tailwind Config:** Detected (${tailwindResult.configFile}), ${twCount} theme customizations parsed (confidence: ${tailwindResult.confidence})`);
    } else {
      lines.push(`- **Tailwind Config:** Detected (${tailwindResult.configFile}) but could not fully parse (confidence: ${tailwindResult.confidence})`);
    }
  } else {
    lines.push('- **Tailwind Config:** Not detected');
  }

  if (jsThemeResult) {
    if (jsThemeResult.parsed) {
      lines.push(`- **JS Theme:** ${Object.keys(jsThemeResult.tokens).length} tokens from ${jsThemeResult.themeFile} (confidence: LOW)`);
    } else {
      lines.push(`- **JS Theme:** ${jsThemeResult.note}`);
    }
  }

  // Overall coverage
  const totalRequired = Object.values(coverage).reduce((sum, c) => sum + c.total, 0);
  const totalMatched = Object.values(coverage).reduce((sum, c) => sum + c.matched.length, 0);
  const overallPct = totalRequired > 0 ? Math.round((totalMatched / totalRequired) * 100) : 0;
  lines.push(`- **Coverage vs Motif:** ${overallPct}% of standard token set covered (${totalMatched}/${totalRequired})`);
  lines.push('');

  // Per-category sections
  const categoryDisplayNames = {
    colors: 'Colors',
    typography: 'Typography',
    spacing: 'Spacing',
    radii: 'Radii',
    shadows: 'Shadows',
    transitions: 'Transitions',
  };

  for (const [category, displayName] of Object.entries(categoryDisplayNames)) {
    const tokens = categorized[category] || [];
    const cov = coverage[category];

    lines.push(`## ${displayName}`);

    if (tokens.length > 0) {
      lines.push('| Token | Value | Source | Motif Equivalent |');
      lines.push('|-------|-------|--------|-----------------|');

      // Cap table rows at 20 to stay within token budget
      const display = tokens.slice(0, 20);
      for (const token of display) {
        const equiv = token.motifEquivalent || '(unmapped)';
        const inconsistentFlag = token.inconsistent ? ' [INCONSISTENT]' : '';
        lines.push(`| --${token.name} | ${token.value}${inconsistentFlag} | ${token.source} | ${equiv} |`);
      }
      if (tokens.length > 20) {
        lines.push(`| ... | ...and ${tokens.length - 20} more | | |`);
      }
    } else {
      lines.push('No tokens detected for this category.');
    }

    lines.push('');
    lines.push(`**Coverage:** ${cov.matched.length}/${cov.total} Motif ${displayName.toLowerCase()} tokens matched`);
    if (cov.missing.length > 0) {
      lines.push(`**Missing:** ${cov.missing.join(', ')}`);
    }
    lines.push('');
  }

  // Uncategorized tokens
  const uncategorized = categorized['uncategorized'] || [];
  if (uncategorized.length > 0) {
    lines.push('## Uncategorized');
    lines.push('| Token | Value | Source |');
    lines.push('|-------|-------|--------|');
    const display = uncategorized.slice(0, 10);
    for (const token of display) {
      lines.push(`| --${token.name} | ${token.value} | ${token.source} |`);
    }
    if (uncategorized.length > 10) {
      lines.push(`| ... | ...and ${uncategorized.length - 10} more | |`);
    }
    lines.push('');
  }

  // Tailwind theme customizations table
  if (tailwindResult && tailwindResult.parsed) {
    lines.push('## Tailwind Theme Customizations');
    lines.push('| Category | Key | Value |');
    lines.push('|----------|-----|-------|');

    for (const [sectionName, entries] of Object.entries(tailwindResult.sections)) {
      for (const [key, value] of Object.entries(entries)) {
        lines.push(`| ${sectionName} | ${key} | ${value} |`);
      }
    }
    lines.push('');
  }

  const content = lines.join('\n');
  const inventoryDir = path.join(outputDir, '.planning', 'design');
  fs.mkdirSync(inventoryDir, { recursive: true });
  fs.writeFileSync(path.join(inventoryDir, 'TOKEN-INVENTORY.md'), content, 'utf8');
  return content;
}

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

function extract(projectRoot, outputDir) {
  console.log(`Token Extractor: ${projectRoot}`);
  console.log('');

  // Pipeline 1: CSS Custom Properties
  const cssResult = extractCSSCustomProperties(projectRoot);
  const cssCount = Object.keys(cssResult.tokens).length;
  console.log(`CSS tokens: ${cssCount} found across ${cssResult.fileCount} files`);

  // Pipeline 2: Tailwind Config
  const tailwindResult = extractTailwindConfig(projectRoot);
  if (tailwindResult) {
    if (tailwindResult.parsed) {
      const twCount = Object.values(tailwindResult.sections).reduce((sum, s) => sum + Object.keys(s).length, 0);
      console.log(`Tailwind: ${twCount} theme customizations from ${tailwindResult.configFile} (${tailwindResult.confidence})`);
    } else {
      console.log(`Tailwind: Detected (${tailwindResult.configFile}) but could not fully parse (${tailwindResult.confidence})`);
    }
  } else {
    console.log('Tailwind: Not detected');
  }

  // Pipeline 3: JS Theme (best-effort)
  const jsThemeResult = extractJSThemeTokens(projectRoot);
  if (jsThemeResult) {
    if (jsThemeResult.parsed) {
      console.log(`JS Theme: ${Object.keys(jsThemeResult.tokens).length} tokens from ${jsThemeResult.themeFile} (LOW)`);
    } else {
      console.log(`JS Theme: ${jsThemeResult.note}`);
    }
  }

  // Merge all tokens
  const allTokens = { ...cssResult.tokens };

  // Add Tailwind tokens as CSS-equivalent entries
  if (tailwindResult && tailwindResult.parsed) {
    for (const [section, entries] of Object.entries(tailwindResult.sections)) {
      for (const [key, value] of Object.entries(entries)) {
        const tokenName = `tw-${section}-${key}`;
        if (!allTokens[tokenName]) {
          allTokens[tokenName] = {
            value,
            source: `tailwind.config (${tailwindResult.configFile})`,
            isGlobal: true,
            count: 1,
            fromTailwind: true,
          };
        }
      }
    }
  }

  // Add JS theme tokens
  if (jsThemeResult && jsThemeResult.parsed) {
    for (const [key, tokenData] of Object.entries(jsThemeResult.tokens)) {
      const tokenName = `theme-${key}`;
      if (!allTokens[tokenName]) {
        allTokens[tokenName] = {
          value: tokenData.value,
          source: tokenData.source,
          isGlobal: true,
          count: 1,
          fromJSTheme: true,
        };
      }
    }
  }

  const totalTokenCount = Object.keys(allTokens).length;

  // Zero tokens: exit cleanly
  if (totalTokenCount === 0) {
    console.log('');
    console.log('No design tokens found.');
    console.log('TOKEN-INVENTORY.md not created (no tokens to report).');
    process.exit(0);
  }

  // Categorize tokens
  const categorized = {};
  for (const [name, data] of Object.entries(allTokens)) {
    const category = categorizeToken(name, data.value);
    const motifEquivalent = findMotifEquivalent(name, category);

    if (!categorized[category]) categorized[category] = [];
    categorized[category].push({
      name,
      value: data.value,
      source: data.source,
      isGlobal: data.isGlobal,
      inconsistent: data.inconsistent || false,
      motifEquivalent,
    });
  }

  // Calculate coverage
  const coverage = calculateCoverage(categorized);

  // Write TOKEN-INVENTORY.md
  writeTokenInventory(outputDir, {
    cssResult,
    tailwindResult,
    jsThemeResult,
    categorized,
    coverage,
    totalTokenCount,
  });

  // Print summary
  const totalRequired = Object.values(coverage).reduce((sum, c) => sum + c.total, 0);
  const totalMatched = Object.values(coverage).reduce((sum, c) => sum + c.matched.length, 0);
  const overallPct = totalRequired > 0 ? Math.round((totalMatched / totalRequired) * 100) : 0;

  console.log('');
  console.log(`Total tokens: ${totalTokenCount}`);
  console.log(`Motif coverage: ${overallPct}% (${totalMatched}/${totalRequired})`);

  const inventoryPath = path.join(outputDir, '.planning', 'design', 'TOKEN-INVENTORY.md');
  console.log(`Output: ${inventoryPath}`);
  console.log('');
  console.log('Token extraction complete.');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

try {
  extract(projectRoot, outputDir);
} catch (err) {
  console.error(`Token extraction failed: ${err.message}`);
  process.exit(1);
}
