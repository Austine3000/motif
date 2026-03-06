#!/usr/bin/env node
'use strict';

/**
 * Motif Font Check Hook (HOOK-02)
 *
 * PostToolUse hook that flags banned fonts (Inter, Roboto, Open Sans,
 * Arial, Helvetica, system-ui, etc.) unless the font has been user-locked
 * as a brand font via tokens.css.
 *
 * Reads PostToolUse JSON from stdin. Outputs decision JSON on stdout
 * when violations are found. Exits silently (code 0, no output) when clean.
 */

const fs = require('fs');
const path = require('path');

const TARGET_EXTENSIONS = ['css', 'tsx', 'jsx', 'vue', 'html'];

const BANNED_FONTS = [
  'inter',
  'roboto',
  'open sans',
  'opensans',
  'lato',
  'arial',
  'helvetica',
  'system-ui',
  '-apple-system',
  'blinkmacsystemfont',
  'segoe ui',
];

/**
 * Extract the content to check based on tool type.
 */
function getContentToCheck(data) {
  if (data.tool_name === 'Write') {
    return data.tool_input.content || '';
  }
  if (data.tool_name === 'Edit') {
    return data.tool_input.new_string || '';
  }
  return null;
}

/**
 * Read user-locked font names from tokens.css.
 * Returns an array of lowercase font names that the user has explicitly
 * set as brand fonts (via --font-display and --font-body tokens).
 */
function getUserLockedFonts() {
  try {
    const projectDir = process.env.CLAUDE_PROJECT_DIR || '.';
    const tokensPath = path.join(
      projectDir,
      '.planning',
      'design',
      'system',
      'tokens.css'
    );
    const tokensContent = fs.readFileSync(tokensPath, 'utf8');

    const lockedFonts = [];
    const tokenPattern = /--font-(?:display|body)\s*:\s*([^;]+)/g;
    let match;

    while ((match = tokenPattern.exec(tokensContent)) !== null) {
      const value = match[1].trim().toLowerCase();
      // Extract font name from value like '"Roboto", sans-serif'
      // Remove quotes and split on comma to get individual font names
      const fonts = value.split(',').map((f) =>
        f
          .trim()
          .replace(/["']/g, '')
          .trim()
      );

      for (const font of fonts) {
        // Skip generic family names
        if (
          [
            'serif',
            'sans-serif',
            'monospace',
            'cursive',
            'fantasy',
            'system-ui',
            'ui-serif',
            'ui-sans-serif',
            'ui-monospace',
            'ui-rounded',
          ].includes(font)
        ) {
          continue;
        }
        if (font) {
          lockedFonts.push(font.toLowerCase());
        }
      }
    }

    return lockedFonts;
  } catch (e) {
    // tokens.css doesn't exist or can't be read -- proceed with empty locked list
    return [];
  }
}

/**
 * Check content for banned font usage.
 */
function checkBannedFonts(content, userLockedFonts) {
  const violations = [];
  // Match both CSS font-family and JSX fontFamily property syntax
  const fontFamilyPattern = /(?:font-family|fontFamily)\s*:\s*([^;}\n]+)/gi;
  let match;

  while ((match = fontFamilyPattern.exec(content)) !== null) {
    const fontValue = match[1].toLowerCase();

    // Skip if value references a CSS variable (already tokenized)
    if (fontValue.includes('var(')) continue;

    for (const banned of BANNED_FONTS) {
      // Skip if this font has been user-locked as a brand font
      if (userLockedFonts.includes(banned)) continue;

      if (fontValue.includes(banned)) {
        const lineNumber =
          content.substring(0, match.index).split('\n').length;
        violations.push({
          line: lineNumber,
          font: banned,
          matched: match[0].trim(),
          suggestion:
            'Use var(--font-display) or var(--font-body) instead',
        });
      }
    }
  }

  return violations;
}

// Main: read JSON from stdin
let input = '';
process.stdin.on('data', (chunk) => (input += chunk));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);

    // Extract file path and check extension
    const filePath = data.tool_input && data.tool_input.file_path;
    if (!filePath) process.exit(0);

    const ext = filePath.split('.').pop().toLowerCase();
    if (!TARGET_EXTENSIONS.includes(ext)) {
      process.exit(0);
    }

    // Get content to check
    const content = getContentToCheck(data);
    if (!content) process.exit(0);

    // Read user-locked fonts from tokens.css
    const userLockedFonts = getUserLockedFonts();

    // Check for banned font usage
    const violations = checkBannedFonts(content, userLockedFonts);

    if (violations.length === 0) {
      process.exit(0);
    }

    // Format violation messages
    const messages = violations.map(
      (v) =>
        `- Line ${v.line}: Banned font "${v.font}" in \`${v.matched}\` -- ${v.suggestion}`
    );

    const output = JSON.stringify({
      decision: 'block',
      reason: `Motif font-check: ${violations.length} violation(s) found:\n${messages.join('\n')}`,
    });

    process.stdout.write(output);
  } catch (e) {
    // If JSON parsing fails or any error, exit silently
    process.exit(0);
  }
});
