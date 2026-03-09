#!/usr/bin/env node
'use strict';

/**
 * Tailwind Config Generator — Deterministic tokens.css to globals.css converter
 *
 * Usage: node scripts/tailwind-config-generator.js [tokens-css-path] [--output <path>]
 *
 * Reads tokens.css (the single source of truth) and produces a three-layer globals.css
 * compatible with Tailwind v4 + shadcn/ui. Same input always produces same output.
 *
 * Three layers:
 *   Layer 1: Motif design tokens as :root CSS custom properties
 *   Layer 2: shadcn/ui semantic variable mapping (references Layer 1)
 *   Layer 3: Tailwind @theme inline declarations (namespace-safe)
 *
 * Zero external dependencies — pure Node.js.
 */

const fs = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// CLI Argument Parsing (BEFORE requiring token-transformer, which has
// module-level arg parsing that would intercept --help)
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/tailwind-config-generator.js [tokens-css-path] [--output <path>]');
  console.log('');
  console.log('Converts Motif tokens.css into a Tailwind v4 + shadcn-compatible globals.css.');
  console.log('');
  console.log('Options:');
  console.log('  --output <path>    Output path (default: .planning/design/system/globals.css)');
  console.log('  --help, -h         Show this help message');
  console.log('');
  console.log('Output: globals.css with three layers:');
  console.log('  Layer 1: Motif tokens as :root CSS custom properties');
  console.log('  Layer 2: shadcn/ui semantic variable mapping');
  console.log('  Layer 3: Tailwind @theme inline declarations');
  process.exit(0);
}

// Require AFTER --help check to avoid token-transformer's module-level arg parsing
const { parseTokensCSS, categorizeTokens } = require('./token-transformer');

let tokensCSSPath = null;
let outputPath = null;

for (let i = 0; i < args.length; i++) {
  if ((args[i] === '--output' || args[i] === '-o') && args[i + 1]) {
    outputPath = args[i + 1];
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

// Default output path
if (!outputPath) {
  outputPath = path.join(path.dirname(tokensCSSPath), 'globals.css');
} else {
  outputPath = path.resolve(outputPath);
}

// ---------------------------------------------------------------------------
// Token Classification Helpers
// ---------------------------------------------------------------------------

/**
 * Size suffixes that indicate a --text-* token is typography, NOT a color.
 */
const TYPOGRAPHY_SIZE_SUFFIXES = new Set(['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl']);

/**
 * Font family token names that should be EXCLUDED from Layer 1 :root
 * (next/font provides them at runtime via CSS variable className).
 */
const FONT_FAMILY_TOKENS = new Set(['font-display', 'font-body', 'font-mono']);

/**
 * Check if a token name is a typography size token (e.g., text-xs, text-lg).
 */
function isTypographySizeToken(name) {
  if (!name.startsWith('text-')) return false;
  const suffix = name.replace('text-', '');
  return TYPOGRAPHY_SIZE_SUFFIXES.has(suffix);
}

/**
 * Check if a token name is a font family token.
 */
function isFontFamilyToken(name) {
  return FONT_FAMILY_TOKENS.has(name);
}

// ---------------------------------------------------------------------------
// Layer 1: Motif Design Tokens (:root)
// ---------------------------------------------------------------------------

/**
 * Generate Layer 1 — All Motif tokens as :root CSS custom properties.
 * Font family tokens are EXCLUDED (next/font provides them at runtime).
 */
function generateLayer1(categories) {
  const lines = [];
  lines.push('/* === Layer 1: Motif Design Tokens (source of truth) === */');
  lines.push(':root {');

  const categoryOrder = ['colors', 'typography', 'spacing', 'radii', 'shadows', 'transitions', 'zIndex', 'icons', 'other'];

  const categoryLabels = {
    colors: 'Colors',
    typography: 'Typography',
    spacing: 'Spacing',
    radii: 'Radii',
    shadows: 'Shadows',
    transitions: 'Transitions',
    zIndex: 'Z-Index',
    icons: 'Icons',
    other: 'Other',
  };

  let firstCategory = true;

  for (const category of categoryOrder) {
    const tokens = categories[category];
    if (!tokens || Object.keys(tokens).length === 0) continue;

    if (!firstCategory) {
      lines.push('');
    }
    firstCategory = false;

    lines.push(`  /* ${categoryLabels[category] || category} */`);

    for (const [name, value] of Object.entries(tokens)) {
      // Skip font family tokens — next/font provides them at runtime
      if (isFontFamilyToken(name)) continue;

      lines.push(`  --${name}: ${value};`);
    }
  }

  lines.push('}');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Layer 2: shadcn/ui Semantic Mapping
// ---------------------------------------------------------------------------

/**
 * Generate Layer 2 — shadcn/ui semantic variable mapping.
 * These are stable contracts; shadcn variable names do not change.
 * Uses fallback values for tokens that may not exist in every tokens.css.
 */
function generateLayer2(allTokens) {
  const lines = [];
  lines.push('');
  lines.push('/* === Layer 2: shadcn/ui Semantic Mapping === */');
  lines.push(':root {');

  // Helper: produce var() with optional fallback if token doesn't exist
  function v(tokenName, fallback) {
    if (allTokens[tokenName]) {
      return `var(--${tokenName})`;
    }
    if (fallback) {
      return `var(--${tokenName}, ${fallback})`;
    }
    return `var(--${tokenName})`;
  }

  const mappings = [
    ['--background', v('surface-primary', '#ffffff')],
    ['--foreground', v('text-primary', '#0a0a0a')],
    ['--card', v('surface-elevated', 'var(--surface-primary)')],
    ['--card-foreground', v('text-primary', '#0a0a0a')],
    ['--popover', v('surface-elevated', 'var(--surface-primary)')],
    ['--popover-foreground', v('text-primary', '#0a0a0a')],
    ['--primary', v('color-primary-500', '#6366f1')],
    ['--primary-foreground', v('text-inverse', '#ffffff')],
    ['--secondary', v('surface-tertiary', 'var(--surface-secondary)')],
    ['--secondary-foreground', v('text-primary', '#0a0a0a')],
    ['--muted', v('surface-tertiary', 'var(--surface-secondary)')],
    ['--muted-foreground', v('text-secondary', '#6b7280')],
    ['--accent', v('surface-secondary', '#f5f5f5')],
    ['--accent-foreground', v('text-primary', '#0a0a0a')],
    ['--destructive', v('color-error', '#ef4444')],
    ['--destructive-foreground', v('text-inverse', '#ffffff')],
    ['--border', v('border-primary', '#e5e7eb')],
    ['--input', v('border-primary', '#e5e7eb')],
    ['--ring', v('border-focus', 'var(--color-primary-500)')],
    ['--radius', v('radius-md', '8px')],
  ];

  for (const [name, value] of mappings) {
    lines.push(`  ${name}: ${value};`);
  }

  lines.push('}');
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// Layer 3: Tailwind @theme Inline Declarations
// ---------------------------------------------------------------------------

/**
 * Generate Layer 3 — Tailwind @theme inline declarations.
 * Maps Motif tokens to Tailwind's namespace so utility classes work.
 *
 * Critical namespace rules:
 * 1. --color-* tokens go as-is (already in color namespace)
 * 2. --surface-*, --text-* (colors), --border-* remap to --color-surface-*, --color-text-*, --color-border-*
 * 3. --text-* size tokens (xs, sm, base, etc.) are NOT included (Tailwind has its own --text-*)
 * 4. Font families included as var references (actual values from next/font at runtime)
 * 5. --spacing base set to 0.25rem to match Motif's 4px base
 */
function generateLayer3(categories) {
  const lines = [];
  lines.push('');
  lines.push('/* === Layer 3: Tailwind @theme — Motif tokens as utility classes === */');
  lines.push('@theme inline {');

  // --- Colors ---
  if (categories.colors) {
    lines.push('  /* Colors */');

    // Separate tokens by prefix for organized output
    const colorTokens = [];     // --color-*
    const surfaceTokens = [];   // --surface-*
    const textColorTokens = []; // --text-* (color tokens, not sizes)
    const borderTokens = [];    // --border-*

    for (const name of Object.keys(categories.colors)) {
      if (name.startsWith('color-')) {
        colorTokens.push(name);
      } else if (name.startsWith('surface-')) {
        surfaceTokens.push(name);
      } else if (name.startsWith('text-')) {
        // Only color tokens (not size suffixes — those are typography)
        if (!isTypographySizeToken(name)) {
          textColorTokens.push(name);
        }
      } else if (name.startsWith('border-')) {
        borderTokens.push(name);
      }
    }

    // color-* tokens: already in Tailwind color namespace, use as-is
    // e.g., --color-primary-50 stays --color-primary-50 (no double prefix)
    for (const name of colorTokens) {
      lines.push(`  --${name}: var(--${name});`);
    }

    if (colorTokens.length > 0 && surfaceTokens.length > 0) {
      lines.push('');
      lines.push('  /* Surface colors: bg-surface-primary, bg-surface-secondary, etc. */');
    }

    // surface-* -> --color-surface-* (avoids Tailwind collision)
    for (const name of surfaceTokens) {
      lines.push(`  --color-${name}: var(--${name});`);
    }

    if (textColorTokens.length > 0) {
      lines.push('');
      lines.push('  /* Text colors: text-text-primary, text-text-secondary, etc. */');
    }

    // text-* (colors) -> --color-text-* (avoids collision with Tailwind text-* font sizes)
    for (const name of textColorTokens) {
      lines.push(`  --color-${name}: var(--${name});`);
    }

    if (borderTokens.length > 0) {
      lines.push('');
      lines.push('  /* Border colors: border-border-primary, border-border-focus */');
    }

    // border-* -> --color-border-*
    for (const name of borderTokens) {
      lines.push(`  --color-${name}: var(--${name});`);
    }
  }

  // --- Spacing ---
  lines.push('');
  lines.push('  /* Spacing: base 0.25rem (4px) — p-4 = 1rem = 16px = Motif --space-4 */');
  lines.push('  --spacing: 0.25rem;');

  // --- Fonts (var references — actual values from next/font at runtime) ---
  lines.push('');
  lines.push('  /* Fonts (CSS variable references — actual values from next/font at runtime) */');
  lines.push('  --font-display: var(--font-display);');
  lines.push('  --font-body: var(--font-body);');
  lines.push('  --font-mono: var(--font-mono);');

  // --- Radii ---
  if (categories.radii) {
    lines.push('');
    lines.push('  /* Radii */');
    for (const name of Object.keys(categories.radii)) {
      lines.push(`  --${name}: var(--${name});`);
    }
  }

  // --- Shadows ---
  if (categories.shadows) {
    lines.push('');
    lines.push('  /* Shadows */');
    for (const name of Object.keys(categories.shadows)) {
      lines.push(`  --${name}: var(--${name});`);
    }
  }

  lines.push('}');
  return lines.join('\n');
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

  if (!cssContent.trim()) {
    process.stderr.write('Error: tokens.css is empty.\n');
    process.exit(1);
  }

  // 2. Parse tokens
  const allTokens = parseTokensCSS(cssContent);
  const tokenCount = Object.keys(allTokens).length;

  if (tokenCount === 0) {
    process.stderr.write('Error: No tokens found in tokens.css :root block.\n');
    process.exit(1);
  }

  // 3. Categorize tokens
  const categories = categorizeTokens(allTokens);

  // 4. Generate three-layer globals.css
  const parts = [];

  // Import Tailwind
  parts.push('@import "tailwindcss";');
  parts.push('');

  // Layer 1: Motif tokens as :root vars (skip font-family tokens)
  parts.push(generateLayer1(categories));

  // Layer 2: shadcn semantic mapping
  parts.push(generateLayer2(allTokens));

  // Layer 3: Tailwind @theme inline declarations
  parts.push(generateLayer3(categories));

  // Final newline
  parts.push('');

  const output = parts.join('\n');

  // 5. Ensure output directory exists
  const outDir = path.dirname(outputPath);
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  // 6. Write output
  fs.writeFileSync(outputPath, output, 'utf8');
  console.log(outputPath);

  process.exit(0);
}

// ---------------------------------------------------------------------------
// Module exports (for testing) and CLI entry
// ---------------------------------------------------------------------------

module.exports = {
  generateLayer1,
  generateLayer2,
  generateLayer3,
  isTypographySizeToken,
  isFontFamilyToken,
};

// Run CLI if invoked directly
if (require.main === module) {
  main();
}
