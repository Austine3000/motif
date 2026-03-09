#!/usr/bin/env node
'use strict';

/**
 * Token Transformer — Deterministic CSS-to-TypeScript token converter
 *
 * Usage: node scripts/token-transformer.js [tokens-css-path] [--platform <id>] [--output-dir <dir>]
 *
 * Reads tokens.css (the single source of truth) and produces platform-specific
 * TypeScript token files. Same input always produces same output.
 *
 * Zero external dependencies — pure Node.js.
 */

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execSync } = require('node:child_process');

// ---------------------------------------------------------------------------
// CLI Argument Parsing
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/token-transformer.js [tokens-css-path] [--platform <id>] [--output-dir <dir>]');
  console.log('');
  console.log('Converts tokens.css into platform-specific TypeScript token files.');
  console.log('');
  console.log('Options:');
  console.log('  --platform <id>    Platform ID (web-nextjs, web-vite, web-static, mobile-expo)');
  console.log('                     Reads from STATE.md if not provided');
  console.log('  --output-dir <dir> Output directory (default: same as tokens.css)');
  console.log('  --help, -h         Show this help message');
  process.exit(0);
}

let tokensCSSPath = null;
let platformFlag = null;
let outputDir = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--platform' && args[i + 1]) {
    platformFlag = args[i + 1];
    i++;
  } else if (args[i] === '--output-dir' && args[i + 1]) {
    outputDir = args[i + 1];
    i++;
  } else if (!args[i].startsWith('-')) {
    tokensCSSPath = args[i];
  }
}

// Default tokens.css path
if (!tokensCSSPath) {
  tokensCSSPath = path.join(process.cwd(), '.planning', 'design', 'system', 'tokens.css');
}
tokensCSSPath = path.resolve(tokensCSSPath);

// Default output directory: same as tokens.css
if (!outputDir) {
  outputDir = path.dirname(tokensCSSPath);
} else {
  outputDir = path.resolve(outputDir);
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * 1. parseTokensCSS(cssContent) — Extract all CSS custom properties from :root {} block.
 * Only parses properties inside :root { } blocks. Ignores media queries, .dark class, etc.
 */
function parseTokensCSS(cssContent) {
  const tokens = {};

  // Find all :root blocks (not inside media queries or other selectors)
  // We need to extract only top-level :root blocks
  const lines = cssContent.split('\n');
  let inRoot = false;
  let braceDepth = 0;
  let rootStartDepth = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Detect :root { opening — must be at top level (braceDepth === 0)
    if (!inRoot && braceDepth === 0 && /^:root\s*\{/.test(trimmed)) {
      inRoot = true;
      rootStartDepth = 0;
      // Count braces on this line
      const opens = (trimmed.match(/\{/g) || []).length;
      const closes = (trimmed.match(/\}/g) || []).length;
      braceDepth += opens - closes;
      // Extract any properties on the same line as :root {
      const propMatch = trimmed.match(/--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g);
      if (propMatch) {
        for (const m of propMatch) {
          const pm = m.match(/--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/);
          if (pm) tokens[pm[1]] = pm[2].trim();
        }
      }
      continue;
    }

    if (inRoot) {
      const opens = (trimmed.match(/\{/g) || []).length;
      const closes = (trimmed.match(/\}/g) || []).length;
      braceDepth += opens - closes;

      // If we've closed back to 0, we've exited :root
      if (braceDepth <= 0) {
        inRoot = false;
        braceDepth = 0;
        continue;
      }

      // Extract property from this line
      const propRegex = /--([a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g;
      let match;
      while ((match = propRegex.exec(trimmed)) !== null) {
        tokens[match[1]] = match[2].trim();
      }
    } else {
      // Track brace depth outside :root to ignore nested blocks (media queries, etc.)
      const opens = (trimmed.match(/\{/g) || []).length;
      const closes = (trimmed.match(/\}/g) || []).length;
      braceDepth += opens - closes;
      if (braceDepth < 0) braceDepth = 0;
    }
  }

  return tokens;
}

/**
 * 2. categorizeTokens(tokens) — Sort tokens into categories using Motif's naming conventions.
 *
 * CRITICAL: --text-* naming collision handling:
 *   - Size suffixes (xs, sm, base, lg, xl, 2xl, 3xl, 4xl) => typography
 *   - Everything else (primary, secondary, tertiary, inverse, link) => colors
 */
function categorizeTokens(tokens) {
  const categories = {
    colors: {},
    typography: {},
    spacing: {},
    radii: {},
    shadows: {},
    transitions: {},
    zIndex: {},
    icons: {},
    other: {},
  };

  const typographySizeSuffixes = /^(xs|sm|base|lg|xl|2xl|3xl|4xl)$/;

  for (const [name, value] of Object.entries(tokens)) {
    // Determine category based on prefix
    if (name.startsWith('color-') || name.startsWith('surface-') || name.startsWith('border-')) {
      categories.colors[name] = value;
    } else if (name.startsWith('text-')) {
      // Critical: disambiguate text-* tokens
      const suffix = name.replace('text-', '');
      if (typographySizeSuffixes.test(suffix)) {
        categories.typography[name] = value;
      } else {
        categories.colors[name] = value;
      }
    } else if (name.startsWith('font-') || name.startsWith('leading-') || name.startsWith('weight-')) {
      categories.typography[name] = value;
    } else if (name.startsWith('space-')) {
      categories.spacing[name] = value;
    } else if (name.startsWith('radius-')) {
      categories.radii[name] = value;
    } else if (name.startsWith('shadow-')) {
      categories.shadows[name] = value;
    } else if (name.startsWith('ease-') || name.startsWith('duration-')) {
      categories.transitions[name] = value;
    } else if (name.startsWith('z-')) {
      categories.zIndex[name] = value;
    } else if (name.startsWith('icon-')) {
      categories.icons[name] = value;
    } else {
      categories.other[name] = value;
    }
  }

  // Remove empty categories
  for (const key of Object.keys(categories)) {
    if (Object.keys(categories[key]).length === 0) {
      delete categories[key];
    }
  }

  return categories;
}

/**
 * 3. kebabToCamel(str) — Convert kebab-case to camelCase.
 * "primary-500" -> "primary500", "font-display" -> "fontDisplay"
 */
function kebabToCamel(str) {
  return str.replace(/-([a-zA-Z0-9])/g, (_, char) => char.toUpperCase());
}

/**
 * 4. stripPrefix(name, category) — Remove category prefix for cleaner keys.
 * "color-primary-500" -> "primary-500", "space-4" -> "4"
 */
function stripPrefix(name, category) {
  const prefixMap = {
    colors: /^color-/,
    typography: /^(font-|leading-|weight-|text-)/,
    spacing: /^space-/,
    radii: /^radius-/,
    shadows: /^shadow-/,
    transitions: /^(ease-|duration-)/,
    zIndex: /^z-/,
    icons: /^icon-/,
  };

  const prefix = prefixMap[category];
  if (prefix) {
    return name.replace(prefix, '');
  }
  return name;
}

/**
 * 5. generateWebTS(categories, hash) — Emit tokens.ts for React web platforms.
 */
function generateWebTS(categories, hash) {
  const lines = [];
  lines.push('// Auto-generated from tokens.css by Motif. Do not edit manually.');
  lines.push(`// Source hash: ${hash}`);
  lines.push('');

  const categoryExports = [];

  for (const [category, tokens] of Object.entries(categories)) {
    const constName = category;
    categoryExports.push(constName);

    lines.push(`export const ${constName} = {`);
    for (const [name, value] of Object.entries(tokens)) {
      const key = kebabToCamel(stripPrefix(name, category));
      // Escape single quotes in value
      const escapedValue = value.replace(/'/g, "\\'");
      lines.push(`  ${key}: '${escapedValue}',`);
    }
    lines.push('} as const;');
    lines.push('');
  }

  // Aggregate export
  lines.push(`export const tokens = { ${categoryExports.join(', ')} } as const;`);
  lines.push('');
  lines.push('export type Tokens = typeof tokens;');
  lines.push('');

  return lines.join('\n');
}

/**
 * 6. convertToNativeValue(value, tokenName) — Convert CSS values to React Native-compatible values.
 */
function convertToNativeValue(value, tokenName) {
  const trimmed = value.trim();

  // rem -> number (x16)
  const remMatch = trimmed.match(/^(-?\d+\.?\d*)rem$/);
  if (remMatch) {
    return parseFloat(remMatch[1]) * 16;
  }

  // px -> number
  const pxMatch = trimmed.match(/^(-?\d+\.?\d*)px$/);
  if (pxMatch) {
    return parseFloat(pxMatch[1]);
  }

  // em -> number (x16)
  const emMatch = trimmed.match(/^(-?\d+\.?\d*)em$/);
  if (emMatch) {
    return parseFloat(emMatch[1]) * 16;
  }

  // Bare numbers (weights, z-index, line-height ratios)
  if (/^-?\d+\.?\d*$/.test(trimmed)) {
    return parseFloat(trimmed);
  }

  // Colors: pass through as strings
  if (/^#[0-9a-fA-F]{3,8}$/.test(trimmed) || /^rgb/.test(trimmed) || /^hsl/.test(trimmed)) {
    return trimmed;
  }

  // Font families: strip fallbacks, keep only primary font name, remove quotes
  if (/^['"]/.test(trimmed) || /,\s*(sans-serif|serif|monospace|system-ui)/.test(trimmed)) {
    const primary = trimmed.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
    return primary;
  }

  // cubic-bezier: pass through as string
  if (/^cubic-bezier/.test(trimmed)) {
    return trimmed;
  }

  // Duration values (ms, s): pass through as string
  if (/^\d+\.?\d*(ms|s)$/.test(trimmed)) {
    return trimmed;
  }

  // Everything else: pass through as string
  return trimmed;
}

/**
 * 7. parseShadowForNative(shadowValue) — Decompose CSS shadow into RN shadow properties.
 */
function parseShadowForNative(shadowValue) {
  const trimmed = shadowValue.trim();

  if (trimmed === 'none' || trimmed === '') {
    return null;
  }

  // Split on commas that are NOT inside parentheses (handle multi-shadow)
  const shadows = [];
  let current = '';
  let parenDepth = 0;

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch === '(') parenDepth++;
    else if (ch === ')') parenDepth--;
    else if (ch === ',' && parenDepth === 0) {
      shadows.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim()) shadows.push(current.trim());

  // Use first shadow only (RN supports one shadow)
  const shadow = shadows[0];
  if (!shadow) return null;

  // Parse: X Y blur [spread] color
  // Color can be #hex, rgb(...), rgba(...), hsl(...), hsla(...), or named color
  // Strategy: extract color first (it's the most identifiable), then parse numbers

  let color = 'rgba(0,0,0,0.1)';
  let remaining = shadow;

  // Try to extract color patterns
  const colorPatterns = [
    /rgba?\([^)]+\)/,
    /hsla?\([^)]+\)/,
    /#[0-9a-fA-F]{3,8}/,
  ];

  for (const pattern of colorPatterns) {
    const match = remaining.match(pattern);
    if (match) {
      color = match[0];
      remaining = remaining.replace(match[0], '').trim();
      break;
    }
  }

  // Parse remaining numbers (X Y blur [spread])
  const nums = remaining.match(/-?\d+\.?\d*/g);
  if (!nums || nums.length < 2) {
    // Can't parse — return a basic fallback
    return {
      shadowColor: color,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 2,
    };
  }

  const x = parseFloat(nums[0]);
  const y = parseFloat(nums[1]);
  const blur = nums.length >= 3 ? parseFloat(nums[2]) : 0;
  // spread is optional, nums[3] if present

  // Extract opacity from rgba if possible
  let opacity = 1;
  const rgbaMatch = color.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*([\d.]+)\s*\)/);
  if (rgbaMatch) {
    opacity = parseFloat(rgbaMatch[1]);
    // Convert rgba to rgb for shadowColor (opacity is separate in RN)
    color = color.replace(/,\s*[\d.]+\s*\)/, ')').replace('rgba', 'rgb');
  }

  const elevation = Math.min(Math.ceil(blur / 2), 24);

  return {
    shadowColor: color,
    shadowOffset: { width: x, height: y },
    shadowOpacity: opacity,
    shadowRadius: blur,
    elevation,
  };
}

/**
 * 8. generateNativeTS(categories, hash) — Emit tokens.native.ts for React Native.
 */
function generateNativeTS(categories, hash) {
  const lines = [];
  lines.push('// Auto-generated from tokens.css by Motif. Do not edit manually.');
  lines.push(`// Source hash: ${hash}`);
  lines.push('');

  const categoryExports = [];

  for (const [category, tokens] of Object.entries(categories)) {
    const constName = category;
    categoryExports.push(constName);

    if (category === 'shadows') {
      // Shadow category: decompose into RN shadow objects
      lines.push(`export const ${constName} = {`);
      for (const [name, value] of Object.entries(tokens)) {
        const key = kebabToCamel(stripPrefix(name, category));
        const parsed = parseShadowForNative(value);
        if (parsed === null) {
          lines.push(`  ${key}: null,`);
        } else {
          lines.push(`  ${key}: {`);
          lines.push(`    shadowColor: '${parsed.shadowColor}',`);
          lines.push(`    shadowOffset: { width: ${parsed.shadowOffset.width}, height: ${parsed.shadowOffset.height} },`);
          lines.push(`    shadowOpacity: ${parsed.shadowOpacity},`);
          lines.push(`    shadowRadius: ${parsed.shadowRadius},`);
          lines.push(`    elevation: ${parsed.elevation},`);
          lines.push(`  },`);
        }
      }
      lines.push('} as const;');
      lines.push('');
    } else {
      lines.push(`export const ${constName} = {`);
      for (const [name, value] of Object.entries(tokens)) {
        const key = kebabToCamel(stripPrefix(name, category));
        const nativeValue = convertToNativeValue(value, name);

        if (typeof nativeValue === 'number') {
          lines.push(`  ${key}: ${nativeValue},`);
        } else {
          const escaped = String(nativeValue).replace(/'/g, "\\'");
          lines.push(`  ${key}: '${escaped}',`);
        }
      }
      lines.push('} as const;');
      lines.push('');
    }
  }

  // Export as theme (RN convention)
  lines.push(`export const theme = { ${categoryExports.join(', ')} } as const;`);
  lines.push('');
  lines.push('export type Theme = typeof theme;');
  lines.push('');

  return lines.join('\n');
}

/**
 * 9. generateHash(content) — SHA-256 hash of tokens.css content (first 12 chars).
 */
function generateHash(content) {
  return crypto.createHash('sha256').update(content).digest('hex').substring(0, 12);
}

// ---------------------------------------------------------------------------
// Platform Resolution
// ---------------------------------------------------------------------------

/**
 * Determine platform from --platform flag or STATE.md.
 * Returns platform string or null.
 */
function resolvePlatform() {
  if (platformFlag) return platformFlag;

  // Try reading from STATE.md via motif-state.js
  const stateScriptPath = path.join(__dirname, 'motif-state.js');
  if (fs.existsSync(stateScriptPath)) {
    try {
      const result = execSync(`node "${stateScriptPath}" read`, {
        cwd: process.cwd(),
        encoding: 'utf8',
        timeout: 5000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      const state = JSON.parse(result.trim());
      if (state.platform) return state.platform;
    } catch (e) {
      process.stderr.write(`Warning: Could not read platform from STATE.md: ${e.message}\n`);
    }
  }

  return null;
}

/**
 * Get token formats for a platform from framework-registry.json.
 * Returns array of format strings (e.g., ["css", "ts"]).
 */
function getTokenFormats(platform) {
  const registryPath = path.join(__dirname, '..', 'references', 'framework-registry.json');
  if (!fs.existsSync(registryPath)) {
    process.stderr.write('Warning: framework-registry.json not found. Generating both formats as fallback.\n');
    return ['css', 'ts', 'native-ts'];
  }

  try {
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
    if (platform && registry[platform] && registry[platform].tokens) {
      return registry[platform].tokens.formats || ['css', 'ts', 'native-ts'];
    }
  } catch (e) {
    process.stderr.write(`Warning: Could not parse framework-registry.json: ${e.message}\n`);
  }

  // Unknown platform: generate both formats as fallback
  return ['css', 'ts', 'native-ts'];
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  // 1. Read tokens.css
  if (!fs.existsSync(tokensCSSPath)) {
    process.stderr.write(`Error: tokens.css not found at ${tokensCSSPath}\n`);
    process.exit(1);
  }

  const cssContent = fs.readFileSync(tokensCSSPath, 'utf8');

  // 2. Determine platform
  const platform = resolvePlatform();
  if (!platform) {
    process.stderr.write('Warning: Platform not set. Generating both web and native formats as fallback.\n');
  }

  // 3. Read framework-registry.json to get formats
  const formats = getTokenFormats(platform);

  // 4. Parse tokens, categorize, generate hash
  const tokens = parseTokensCSS(cssContent);
  const tokenCount = Object.keys(tokens).length;

  if (tokenCount === 0) {
    process.stderr.write('Warning: No tokens found in tokens.css :root block.\n');
    process.exit(1);
  }

  const categories = categorizeTokens(tokens);
  const hash = generateHash(cssContent);

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 5. Generate files based on formats
  const generated = [];

  for (const format of formats) {
    if (format === 'ts') {
      const webTS = generateWebTS(categories, hash);
      const outPath = path.join(outputDir, 'tokens.ts');
      fs.writeFileSync(outPath, webTS, 'utf8');
      const exportCount = Object.keys(categories).length;
      generated.push(`tokens.ts (${exportCount} categories, ${tokenCount} tokens)`);
    } else if (format === 'native-ts') {
      const nativeTS = generateNativeTS(categories, hash);
      const outPath = path.join(outputDir, 'tokens.native.ts');
      fs.writeFileSync(outPath, nativeTS, 'utf8');
      const exportCount = Object.keys(categories).length;
      generated.push(`tokens.native.ts (${exportCount} categories, ${tokenCount} tokens)`);
    }
    // format === 'css' -> skip (already exists as source)
  }

  // 6. Print summary
  if (generated.length > 0) {
    console.log(`Token Transformer: ${tokensCSSPath}`);
    console.log(`Platform: ${platform || '(unknown — fallback mode)'}`);
    console.log(`Source hash: ${hash}`);
    console.log(`Generated: ${generated.join(', ')}`);
  } else {
    console.log('Token Transformer: No TypeScript files needed for this platform.');
  }

  process.exit(0);
}

// ---------------------------------------------------------------------------
// Module exports (for testing) and CLI entry
// ---------------------------------------------------------------------------

module.exports = {
  parseTokensCSS,
  categorizeTokens,
  generateWebTS,
  generateNativeTS,
  kebabToCamel,
  stripPrefix,
  convertToNativeValue,
  parseShadowForNative,
  generateHash,
};

// Run CLI if invoked directly
if (require.main === module) {
  main();
}
