#!/usr/bin/env node
'use strict';

/**
 * Motif A11y Check Hook (HOOK-03)
 *
 * PostToolUse hook that flags accessibility violations:
 * 1. div with onClick but missing role/tabIndex
 * 2. img without alt attribute
 * 3. input without label association (unless type="hidden")
 *
 * Reads PostToolUse JSON from stdin. Outputs decision JSON on stdout
 * when violations are found. Exits silently (code 0, no output) when clean.
 */

const TARGET_EXTENSIONS = ['tsx', 'jsx', 'vue', 'html'];

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
 * Truncate a string to maxLen characters, adding ellipsis if truncated.
 */
function truncate(str, maxLen) {
  if (str.length <= maxLen) return str;
  return str.substring(0, maxLen) + '...';
}

/**
 * Get line number for a given index in content.
 */
function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

/**
 * Check for accessibility violations in content.
 */
function checkForViolations(content) {
  const violations = [];

  // 1. div with onClick but missing role/tabIndex
  const divOnClickPattern = /<div[^>]*\bonClick\b[^>]*>/gi;
  let match;

  while ((match = divOnClickPattern.exec(content)) !== null) {
    const element = match[0];
    const hasRole = /\brole\s*=/i.test(element);
    const hasTabIndex = /\btab[Ii]ndex\s*=/i.test(element);

    if (!hasRole || !hasTabIndex) {
      const missing = [];
      if (!hasRole) missing.push('role');
      if (!hasTabIndex) missing.push('tabIndex');
      violations.push({
        line: getLineNumber(content, match.index),
        type: 'div-onclick-missing-a11y',
        element: truncate(element, 80),
        suggestion: `Add role="button" and tabIndex={0} to make this div keyboard-accessible, or use a <button> element instead (missing: ${missing.join(', ')})`,
      });
    }
  }

  // 2. img without alt
  const imgPattern = /<img\b[^>]*>/gi;

  while ((match = imgPattern.exec(content)) !== null) {
    const element = match[0];
    const hasAlt = /\balt\s*=/i.test(element);

    if (!hasAlt) {
      violations.push({
        line: getLineNumber(content, match.index),
        type: 'img-missing-alt',
        element: truncate(element, 80),
        suggestion: 'Add alt="description" to this img, or alt="" if decorative',
      });
    }
  }

  // 3. input without label association (skip type="hidden")
  const inputPattern = /<input\b[^>]*>/gi;

  while ((match = inputPattern.exec(content)) !== null) {
    const element = match[0];

    // Skip hidden inputs -- they don't need labels
    if (/\btype\s*=\s*["']hidden["']/i.test(element)) {
      continue;
    }

    const hasAriaLabel = /\baria-label\s*=/i.test(element);
    const hasAriaLabelledBy = /\baria-labelledby\s*=/i.test(element);
    const hasId = /\bid\s*=/i.test(element);

    if (!hasAriaLabel && !hasAriaLabelledBy && !hasId) {
      violations.push({
        line: getLineNumber(content, match.index),
        type: 'input-missing-label',
        element: truncate(element, 80),
        suggestion:
          'Add aria-label="description" or ensure a <label htmlFor="id"> exists',
      });
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

    // Check for violations
    const violations = checkForViolations(content);

    if (violations.length === 0) {
      process.exit(0);
    }

    // Format violation messages
    const messages = violations.map(
      (v) =>
        `- Line ${v.line}: [${v.type}] ${v.element} -- ${v.suggestion}`
    );

    const output = JSON.stringify({
      decision: 'block',
      reason: `Motif a11y-check: ${violations.length} accessibility violation(s):\n${messages.join('\n')}`,
    });

    process.stdout.write(output);
  } catch (e) {
    // If JSON parsing fails or any error, exit silently
    process.exit(0);
  }
});
