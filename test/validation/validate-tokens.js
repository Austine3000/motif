#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const BANNED_FONTS = ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Arial', 'Helvetica', 'system-ui'];

let totalPass = 0;
let totalFail = 0;
let testResults = [];

function assert(condition, label) {
  if (condition) {
    console.log(`  PASS: ${label}`);
    totalPass++;
    testResults.push({ label, result: 'PASS' });
  } else {
    console.log(`  FAIL: ${label}`);
    totalFail++;
    testResults.push({ label, result: 'FAIL' });
  }
}

// ─────────────────────────────────────────────────────────────
// Token extraction utilities
// ─────────────────────────────────────────────────────────────

function extractTokenValue(content, tokenName) {
  const pattern = new RegExp(`--${tokenName}:\\s*([^;]+);`);
  const match = content.match(pattern);
  return match ? match[1].trim() : null;
}

function hexToHsl(hex) {
  const cleaned = hex.replace('#', '');
  const r = parseInt(cleaned.slice(0, 2), 16) / 255;
  const g = parseInt(cleaned.slice(2, 4), 16) / 255;
  const b = parseInt(cleaned.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

// ─────────────────────────────────────────────────────────────
// Validation checks
// ─────────────────────────────────────────────────────────────

function checkBannedFonts(content) {
  const issues = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Only check font-display and font-body token lines
    if (!line.includes('--font-display:') && !line.includes('--font-body:')) {
      continue;
    }

    // Skip lines with LOCKED comment (user chose intentionally)
    if (line.includes('LOCKED')) {
      continue;
    }

    for (const banned of BANNED_FONTS) {
      // Check if the banned font appears in the value (case-insensitive for system-ui)
      if (banned === 'system-ui') {
        if (line.toLowerCase().includes(banned.toLowerCase())) {
          issues.push(`Banned font "${banned}" found in: ${line.trim()}`);
        }
      } else {
        // Match the font name with word boundaries to avoid false positives
        const fontPattern = new RegExp(`['"]?${banned}['"]?`, 'i');
        if (fontPattern.test(line)) {
          issues.push(`Banned font "${banned}" found in: ${line.trim()}`);
        }
      }
    }
  }

  return issues;
}

function checkPrimaryExists(content) {
  if (!content.includes('--color-primary-500:')) {
    return ['Missing required token: --color-primary-500'];
  }
  return [];
}

function checkContrastAnnotations(content) {
  const lower = content.toLowerCase();
  const hasAnnotations = lower.includes('aa') ||
    lower.includes('contrast') ||
    lower.includes('ratio') ||
    lower.includes('wcag');

  if (!hasAnnotations) {
    return ['No WCAG contrast annotations found (expected "AA", "contrast", "ratio", or "wcag" comments)'];
  }
  return [];
}

function verifyBrandColor(content, expectedHex) {
  const normalizedExpected = expectedHex.replace('#', '').toLowerCase();
  const primaryValue = extractTokenValue(content, 'color-primary-500');

  if (!primaryValue) {
    return { preserved: false, actual: 'token not found', expected: normalizedExpected };
  }

  const hexMatch = primaryValue.match(/#([0-9a-fA-F]{6})/);
  if (!hexMatch) {
    return { preserved: false, actual: primaryValue, expected: normalizedExpected };
  }

  const actualNormalized = hexMatch[1].toLowerCase();
  return {
    preserved: actualNormalized === normalizedExpected,
    actual: `#${actualNormalized}`,
    expected: `#${normalizedExpected}`,
  };
}

function checkTokenStructure(content) {
  const issues = [];

  // Check for :root block
  if (!content.includes(':root')) {
    issues.push('Missing :root block');
  }

  // Count custom properties
  const customProps = content.match(/--[\w-]+:/g) || [];
  if (customProps.length < 20) {
    issues.push(`Insufficient custom properties: found ${customProps.length}, expected at least 20`);
  }

  // Check for required token categories
  const categories = {
    color: /--color-/,
    font: /--font-/,
    spacing: /--(?:spacing|space)-/,
    radius: /--radius-/,
  };

  for (const [category, pattern] of Object.entries(categories)) {
    if (!pattern.test(content)) {
      issues.push(`Missing token category: ${category} (no ${pattern.source} tokens found)`);
    }
  }

  return issues;
}

// ─────────────────────────────────────────────────────────────
// CLI argument parsing
// ─────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node validate-tokens.js <tokens.css> [--brand-color #HEXVAL]');
    console.log('');
    console.log('Validates token quality: banned fonts, required tokens, WCAG annotations, structure.');
    console.log('');
    console.log('Options:');
    console.log('  --brand-color <hex>  Verify brand color is preserved as --color-primary-500');
    process.exit(1);
  }

  const tokensPath = path.resolve(args[0]);
  let brandColor = null;

  const brandIdx = args.indexOf('--brand-color');
  if (brandIdx !== -1 && args[brandIdx + 1]) {
    brandColor = args[brandIdx + 1];
  }

  return { tokensPath, brandColor };
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

function main() {
  const { tokensPath, brandColor } = parseArgs();

  console.log(`\nValidating tokens.css: ${tokensPath}`);
  if (brandColor) {
    console.log(`Brand color to verify: ${brandColor}`);
  }
  console.log('');

  // Check file exists
  if (!fs.existsSync(tokensPath)) {
    console.log(`  FAIL: tokens.css not found at: ${tokensPath}`);
    process.exit(1);
  }

  const content = fs.readFileSync(tokensPath, 'utf8');

  // ─── Structure checks ───
  console.log('Token Structure');
  console.log('─'.repeat(50));

  const structureIssues = checkTokenStructure(content);
  assert(structureIssues.length === 0, 'Token structure is valid');
  for (const issue of structureIssues) {
    console.log(`    Issue: ${issue}`);
  }

  // ─── Primary token check ───
  console.log('\nRequired Tokens');
  console.log('─'.repeat(50));

  const primaryIssues = checkPrimaryExists(content);
  assert(primaryIssues.length === 0, '--color-primary-500 token exists');
  for (const issue of primaryIssues) {
    console.log(`    Issue: ${issue}`);
  }

  // ─── Banned fonts check ───
  console.log('\nFont Compliance');
  console.log('─'.repeat(50));

  const fontIssues = checkBannedFonts(content);
  assert(fontIssues.length === 0, 'No banned fonts used');
  for (const issue of fontIssues) {
    console.log(`    Issue: ${issue}`);
  }

  // ─── WCAG annotations check ───
  console.log('\nWCAG Annotations');
  console.log('─'.repeat(50));

  const contrastIssues = checkContrastAnnotations(content);
  assert(contrastIssues.length === 0, 'WCAG contrast annotations present');
  for (const issue of contrastIssues) {
    console.log(`    Issue: ${issue}`);
  }

  // ─── Brand color verification (optional) ───
  if (brandColor) {
    console.log('\nBrand Color Preservation');
    console.log('─'.repeat(50));

    const brandResult = verifyBrandColor(content, brandColor);
    assert(brandResult.preserved, `Brand color preserved as --color-primary-500`);
    if (!brandResult.preserved) {
      console.log(`    Expected: ${brandResult.expected}`);
      console.log(`    Actual:   ${brandResult.actual}`);
    }
  }

  // ─── Extra info: HSL of primary ───
  const primaryHex = extractTokenValue(content, 'color-primary-500');
  if (primaryHex) {
    const hexMatch = primaryHex.match(/#([0-9a-fA-F]{6})/);
    if (hexMatch) {
      const hsl = hexToHsl(hexMatch[0]);
      console.log(`\n  Info: --color-primary-500 = ${hexMatch[0]} (HSL: ${hsl.h}deg, ${hsl.s}%, ${hsl.l}%)`);
    }
  }

  // ─── Summary ───
  console.log('\n' + '═'.repeat(50));
  console.log(`\n${totalPass} passed, ${totalFail} failed\n`);

  process.exit(totalFail > 0 ? 1 : 0);
}

main();
