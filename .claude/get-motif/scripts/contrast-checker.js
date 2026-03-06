#!/usr/bin/env node
'use strict';

/**
 * WCAG 2.1 Contrast Ratio Calculator (SCRP-01)
 *
 * Usage: node scripts/contrast-checker.js <color1> <color2>
 * Colors: hex values with or without # (supports 3-char and 6-char)
 *
 * Zero external dependencies -- pure Node.js.
 */

const args = process.argv.slice(2);

if (args.length < 2) {
  console.error('Usage: node scripts/contrast-checker.js <color1> <color2>');
  console.error('  Colors are hex values, e.g. "#000000" "#FFFFFF" or "000" "fff"');
  process.exit(1);
}

/**
 * Parse hex color string to [r, g, b] in 0-255 range.
 * Supports 3-char (#abc) and 6-char (#abcdef) formats, with or without #.
 */
function parseHex(hex) {
  hex = hex.replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(hex)) {
    console.error(`Invalid color format: "${hex}". Use 3 or 6 hex digits (e.g. #abc or #abcdef).`);
    process.exit(1);
  }
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return [
    parseInt(hex.slice(0, 2), 16),
    parseInt(hex.slice(2, 4), 16),
    parseInt(hex.slice(4, 6), 16),
  ];
}

/**
 * Convert sRGB channel (0-255) to linear value.
 * Uses WCAG 2.1 threshold of 0.04045 (NOT the old 0.03928).
 */
function linearize(channel) {
  const sRGB = channel / 255;
  return sRGB <= 0.04045
    ? sRGB / 12.92
    : Math.pow((sRGB + 0.055) / 1.055, 2.4);
}

/**
 * Calculate relative luminance per WCAG 2.1.
 * L = 0.2126 * R + 0.7152 * G + 0.0722 * B
 */
function relativeLuminance(r, g, b) {
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
}

/**
 * Calculate contrast ratio between two hex colors.
 * Returns a number (e.g. 21.0, 4.5, etc.)
 */
function contrastRatio(hex1, hex2) {
  const [r1, g1, b1] = parseHex(hex1);
  const [r2, g2, b2] = parseHex(hex2);
  const l1 = relativeLuminance(r1, g1, b1);
  const l2 = relativeLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Format contrast ratio for display.
 * Rounds to 2 decimal places, removes trailing zeros.
 */
function formatRatio(ratio) {
  // Round to 2 decimals
  const rounded = Math.round(ratio * 100) / 100;
  // If it's a whole number, show as N:1
  if (rounded === Math.floor(rounded)) {
    return `${rounded}:1`;
  }
  return `${rounded}:1`;
}

// Normalize input colors to have # prefix for display
function normalizeForDisplay(hex) {
  hex = hex.replace(/^#/, '').toUpperCase();
  if (hex.length === 3) {
    hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
  }
  return '#' + hex;
}

const color1 = args[0];
const color2 = args[1];
const ratio = contrastRatio(color1, color2);

const aaNormal = ratio >= 4.5;    // WCAG AA normal text (4.5:1)
const aaLarge  = ratio >= 3;      // WCAG AA large text (3:1)
const aaaNormal = ratio >= 7;     // WCAG AAA normal text (7:1)
const aaaLarge  = ratio >= 4.5;   // WCAG AAA large text (4.5:1)

const pass = '\x1b[32mPASS\x1b[0m';
const fail = '\x1b[31mFAIL\x1b[0m';

console.log(`Colors: ${normalizeForDisplay(color1)} vs ${normalizeForDisplay(color2)}`);
console.log(`Contrast ratio: ${formatRatio(ratio)}`);
console.log(`WCAG AA normal text (4.5:1): ${aaNormal ? pass : fail}`);
console.log(`WCAG AA large text (3:1):    ${aaLarge ? pass : fail}`);
console.log(`WCAG AAA normal text (7:1):  ${aaaNormal ? pass : fail}`);
console.log(`WCAG AAA large text (4.5:1): ${aaaLarge ? pass : fail}`);
