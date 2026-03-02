#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Thresholds for "visibly distinct"
const HUE_THRESHOLD = 30; // degrees -- hue shift >= 30 means visibly distinct

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
// Color conversion (self-contained, no imports)
// ─────────────────────────────────────────────────────────────

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
// Token extraction utilities
// ─────────────────────────────────────────────────────────────

function extractPrimaryHue(content) {
  const match = content.match(/--color-primary-500:\s*#([0-9a-fA-F]{6})/);
  if (!match) return null;
  const hsl = hexToHsl(`#${match[1]}`);
  return hsl.h;
}

function extractFont(content, tokenName) {
  const pattern = new RegExp(`--${tokenName}:\\s*([^;]+);`);
  const match = content.match(pattern);
  if (!match) return null;

  const value = match[1].trim();
  // Extract first font in the list, strip quotes
  const firstFont = value.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
  return firstFont;
}

function extractRadius(content) {
  const match = content.match(/--radius-md:\s*([^;]+);/);
  if (!match) return null;

  const value = match[1].trim();
  const numMatch = value.match(/([\d.]+)/);
  return numMatch ? parseFloat(numMatch[1]) : null;
}

function extractSurface(content) {
  const match = content.match(/--color-surface:\s*([^;]+);/);
  if (!match) return null;
  return match[1].trim().toLowerCase();
}

// ─────────────────────────────────────────────────────────────
// Comparison functions
// ─────────────────────────────────────────────────────────────

function compareSystems(contentA, contentB) {
  const hueA = extractPrimaryHue(contentA);
  const hueB = extractPrimaryHue(contentB);

  let hueDifference = null;
  if (hueA !== null && hueB !== null) {
    const rawDiff = Math.abs(hueA - hueB);
    // Handle hue wraparound (e.g., 350 vs 10 = 20 degrees, not 340)
    hueDifference = Math.min(rawDiff, 360 - rawDiff);
  }

  const fontA = extractFont(contentA, 'font-display');
  const fontB = extractFont(contentB, 'font-display');
  const fontsDifferent = fontA !== null && fontB !== null && fontA !== fontB;

  const radiusA = extractRadius(contentA);
  const radiusB = extractRadius(contentB);
  const radiusDifferent = radiusA !== null && radiusB !== null && radiusA !== radiusB;

  const surfaceA = extractSurface(contentA);
  const surfaceB = extractSurface(contentB);
  const surfaceDifferent = surfaceA !== null && surfaceB !== null && surfaceA !== surfaceB;

  return {
    hueDifference,
    hueA,
    hueB,
    fontA,
    fontB,
    fontsDifferent,
    radiusA,
    radiusB,
    radiusDifferent,
    surfaceA,
    surfaceB,
    surfaceDifferent,
  };
}

function assessDistinctness(comparison) {
  const reasons = [];
  const failures = [];

  // Required: hue difference >= threshold
  if (comparison.hueDifference !== null) {
    if (comparison.hueDifference >= HUE_THRESHOLD) {
      reasons.push(`Hue difference: ${comparison.hueDifference} degrees (>= ${HUE_THRESHOLD} threshold)`);
    } else {
      failures.push(`Hue difference: ${comparison.hueDifference} degrees (< ${HUE_THRESHOLD} threshold)`);
    }
  } else {
    failures.push('Could not extract primary hue from one or both files');
  }

  // Required: fonts must be different families
  if (comparison.fontsDifferent) {
    reasons.push(`Display fonts differ: "${comparison.fontA}" vs "${comparison.fontB}"`);
  } else if (comparison.fontA === null || comparison.fontB === null) {
    failures.push('Could not extract --font-display from one or both files');
  } else {
    failures.push(`Display fonts identical: "${comparison.fontA}"`);
  }

  // Bonus: radius difference (reported but not required for pass)
  if (comparison.radiusDifferent) {
    reasons.push(`Radius differs: ${comparison.radiusA}px vs ${comparison.radiusB}px`);
  } else if (comparison.radiusA !== null && comparison.radiusB !== null) {
    reasons.push(`Radius identical: ${comparison.radiusA}px (bonus check -- not required)`);
  }

  // Bonus: surface difference (reported but not required for pass)
  if (comparison.surfaceDifferent) {
    reasons.push(`Surface differs: ${comparison.surfaceA} vs ${comparison.surfaceB}`);
  } else if (comparison.surfaceA !== null && comparison.surfaceB !== null) {
    reasons.push(`Surface identical: ${comparison.surfaceA} (bonus check -- not required)`);
  }

  // Distinct requires: hue >= threshold AND fonts different
  const huePass = comparison.hueDifference !== null && comparison.hueDifference >= HUE_THRESHOLD;
  const fontsPass = comparison.fontsDifferent;
  const distinct = huePass && fontsPass;

  return { distinct, reasons, failures };
}

// ─────────────────────────────────────────────────────────────
// CLI argument parsing
// ─────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log('Usage: node validate-diff.js <tokens-a.css> <tokens-b.css>');
    console.log('');
    console.log('Compares two tokens.css files and reports whether they are "visibly distinct."');
    console.log('');
    console.log('Distinctness criteria:');
    console.log(`  - Primary hue difference >= ${HUE_THRESHOLD} degrees`);
    console.log('  - Display fonts are different families');
    console.log('  - Radius and surface differences are reported as bonus checks');
    process.exit(1);
  }

  return {
    tokensPathA: path.resolve(args[0]),
    tokensPathB: path.resolve(args[1]),
  };
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

function main() {
  const { tokensPathA, tokensPathB } = parseArgs();

  console.log(`\nComparing design systems for visual distinctness`);
  console.log(`  System A: ${tokensPathA}`);
  console.log(`  System B: ${tokensPathB}`);
  console.log('');

  // Check files exist
  if (!fs.existsSync(tokensPathA)) {
    console.log(`  FAIL: File A not found: ${tokensPathA}`);
    process.exit(1);
  }
  if (!fs.existsSync(tokensPathB)) {
    console.log(`  FAIL: File B not found: ${tokensPathB}`);
    process.exit(1);
  }

  const contentA = fs.readFileSync(tokensPathA, 'utf8');
  const contentB = fs.readFileSync(tokensPathB, 'utf8');

  // ─── Comparison ───
  console.log('System Comparison');
  console.log('─'.repeat(50));

  const comparison = compareSystems(contentA, contentB);

  // Report raw values
  console.log(`\n  Primary hue A: ${comparison.hueA !== null ? comparison.hueA + ' degrees' : 'not found'}`);
  console.log(`  Primary hue B: ${comparison.hueB !== null ? comparison.hueB + ' degrees' : 'not found'}`);
  if (comparison.hueDifference !== null) {
    console.log(`  Hue difference: ${comparison.hueDifference} degrees`);
  }
  console.log(`  Display font A: ${comparison.fontA || 'not found'}`);
  console.log(`  Display font B: ${comparison.fontB || 'not found'}`);
  console.log(`  Radius-md A: ${comparison.radiusA !== null ? comparison.radiusA + 'px' : 'not found'}`);
  console.log(`  Radius-md B: ${comparison.radiusB !== null ? comparison.radiusB + 'px' : 'not found'}`);
  console.log(`  Surface A: ${comparison.surfaceA || 'not found'}`);
  console.log(`  Surface B: ${comparison.surfaceB || 'not found'}`);

  // ─── Distinctness assessment ───
  console.log('\nDistinctness Assessment');
  console.log('─'.repeat(50));

  const assessment = assessDistinctness(comparison);

  // Required checks
  assert(
    comparison.hueDifference !== null && comparison.hueDifference >= HUE_THRESHOLD,
    `Hue difference >= ${HUE_THRESHOLD} degrees (actual: ${comparison.hueDifference || 'N/A'})`
  );
  assert(
    comparison.fontsDifferent,
    'Display fonts are different families'
  );

  // Bonus checks (informational)
  console.log('\n  Bonus checks:');
  if (comparison.radiusDifferent) {
    console.log(`    INFO: Radius values differ (${comparison.radiusA}px vs ${comparison.radiusB}px)`);
  } else {
    console.log(`    INFO: Radius values same or unavailable`);
  }
  if (comparison.surfaceDifferent) {
    console.log(`    INFO: Surface colors differ (${comparison.surfaceA} vs ${comparison.surfaceB})`);
  } else {
    console.log(`    INFO: Surface colors same or unavailable`);
  }

  // ─── Verdict ───
  console.log('\n' + '═'.repeat(50));
  if (assessment.distinct) {
    console.log('\n  VERDICT: Systems are VISIBLY DISTINCT');
  } else {
    console.log('\n  VERDICT: Systems are NOT visibly distinct');
  }

  if (assessment.reasons.length > 0) {
    console.log('\n  Reasons:');
    for (const reason of assessment.reasons) {
      console.log(`    + ${reason}`);
    }
  }
  if (assessment.failures.length > 0) {
    console.log('\n  Failures:');
    for (const failure of assessment.failures) {
      console.log(`    - ${failure}`);
    }
  }

  console.log(`\n${totalPass} passed, ${totalFail} failed\n`);

  process.exit(assessment.distinct ? 0 : 1);
}

main();
