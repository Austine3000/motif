#!/usr/bin/env node
'use strict';

/**
 * Motif Token Check Hook (HOOK-01)
 *
 * PostToolUse hook that flags hardcoded CSS values (colors, spacing,
 * font-size, border-radius, box-shadow) and suggests design token
 * alternatives from tokens.css.
 *
 * Reads PostToolUse JSON from stdin. Outputs decision JSON on stdout
 * when violations are found. Exits silently (code 0, no output) when clean.
 */

const TARGET_EXTENSIONS = ['css', 'tsx', 'jsx', 'vue', 'html'];

/**
 * Extract the content to check based on tool type.
 * Write provides full content; Edit provides new_string only.
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
 * Remove comment lines from content to avoid false positives.
 * Strips single-line comments (//), block comments, and HTML comments.
 */
function stripComments(content) {
  const lines = content.split('\n');
  const result = [];
  let inBlockComment = false;

  for (const line of lines) {
    const trimmed = line.trim();

    // Track block comment state
    if (inBlockComment) {
      if (trimmed.includes('*/')) {
        inBlockComment = false;
      }
      result.push(''); // Replace with empty line to preserve line numbers
      continue;
    }

    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) {
        inBlockComment = true;
      }
      result.push('');
      continue;
    }

    if (trimmed.startsWith('//') || trimmed.startsWith('*')) {
      result.push('');
      continue;
    }

    // Strip inline block comments
    let cleaned = line.replace(/\/\*.*?\*\//g, '');
    // Strip HTML comments
    cleaned = cleaned.replace(/<!--.*?-->/g, '');

    result.push(cleaned);
  }

  return result;
}

/**
 * Check content lines for hardcoded CSS values that should use tokens.
 */
function checkForViolations(contentLines) {
  const violations = [];

  const checks = [
    {
      name: 'hardcoded color',
      pattern: /(color|background(?:-color)?|border(?:-color)?|outline-color|fill|stroke)\s*:\s*(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\()/g,
      skip: (line) => line.includes('var('),
      suggestion: 'Use var(--color-*) or appropriate color token from tokens.css',
    },
    {
      name: 'hardcoded spacing',
      pattern: /(margin|padding)(?:-(top|right|bottom|left))?\s*:\s*(\d+)px/g,
      skip: (line, match) => {
        // Allow 0px and 1px (common resets)
        const pxMatch = match.match(/:\s*(\d+)px/);
        if (pxMatch) {
          const val = parseInt(pxMatch[1], 10);
          if (val <= 1) return true;
        }
        return line.includes('var(');
      },
      suggestion: 'Use var(--space-*) or appropriate spacing token from tokens.css',
    },
    {
      name: 'hardcoded gap',
      pattern: /gap\s*:\s*(\d+)px/g,
      skip: (line, match) => {
        const pxMatch = match.match(/:\s*(\d+)px/);
        if (pxMatch) {
          const val = parseInt(pxMatch[1], 10);
          if (val <= 1) return true;
        }
        return line.includes('var(');
      },
      suggestion: 'Use var(--space-*) or appropriate spacing token from tokens.css',
    },
    {
      name: 'hardcoded font-size',
      pattern: /font-size\s*:\s*\d+(?:px|rem|em)/g,
      skip: (line) => line.includes('var('),
      suggestion: 'Use var(--text-*) or appropriate font-size token from tokens.css',
    },
    {
      name: 'hardcoded border-radius',
      pattern: /border-radius\s*:\s*(\d+)(px|%)/g,
      skip: (line, match) => {
        // Allow 0px (reset), 50% and 9999px (circles)
        const radiusMatch = match.match(/:\s*(\d+)(px|%)/);
        if (radiusMatch) {
          const val = parseInt(radiusMatch[1], 10);
          const unit = radiusMatch[2];
          if (val === 0 && unit === 'px') return true;
          if (val === 50 && unit === '%') return true;
          if (val === 9999 && unit === 'px') return true;
        }
        return line.includes('var(');
      },
      suggestion: 'Use var(--radius-*) or appropriate radius token from tokens.css',
    },
    {
      name: 'hardcoded box-shadow',
      pattern: /box-shadow\s*:\s*\S/g,
      skip: (line) => {
        // Allow var() references and 'none'
        const shadowMatch = line.match(/box-shadow\s*:\s*([^;}\n]+)/);
        if (shadowMatch) {
          const val = shadowMatch[1].trim().toLowerCase();
          if (val.startsWith('var(') || val === 'none') return true;
        }
        return false;
      },
      suggestion: 'Use var(--shadow-*) or appropriate shadow token from tokens.css',
    },
  ];

  for (let i = 0; i < contentLines.length; i++) {
    const line = contentLines[i];
    if (!line.trim()) continue;

    for (const check of checks) {
      // Reset regex lastIndex for each line
      check.pattern.lastIndex = 0;
      let match;
      while ((match = check.pattern.exec(line)) !== null) {
        if (check.skip && check.skip(line, match[0])) continue;
        violations.push({
          line: i + 1,
          type: check.name,
          matched: match[0],
          suggestion: check.suggestion,
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

    // Strip comments and check for violations
    const contentLines = stripComments(content);
    const violations = checkForViolations(contentLines);

    if (violations.length === 0) {
      process.exit(0);
    }

    // Format violation messages
    const messages = violations.map(
      (v) => `- Line ${v.line}: [${v.type}] \`${v.matched}\` -- ${v.suggestion}`
    );

    const output = JSON.stringify({
      decision: 'block',
      reason: `Motif token-check: ${violations.length} violation(s) found:\n${messages.join('\n')}`,
    });

    process.stdout.write(output);
  } catch (e) {
    // If JSON parsing fails or any error, exit silently
    process.exit(0);
  }
});
