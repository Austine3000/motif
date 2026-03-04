#!/usr/bin/env node
'use strict';

/**
 * Motif A11y Check Hook (HOOK-03)
 *
 * PostToolUse hook that flags accessibility violations:
 * 1. div with onClick but missing role/tabIndex
 * 2. img without alt attribute
 * 3. input without label association (unless type="hidden")
 * 4. icon-only <button> without aria-label
 * 5. icon-only <a> without aria-label
 * 6. decorative icon element without aria-hidden="true"
 *
 * Icon detection covers all 4 curated libraries:
 * - Phosphor Icons: <i class="ph ph-{name}"></i>
 * - Lucide: <i data-lucide="{name}"></i>
 * - Material Symbols: <span class="material-symbols-{style}">{name}</span>
 * - Tabler Icons: <i class="ti ti-{name}"></i>
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
 * Detect icon elements across all 4 curated libraries.
 * Returns array of { index, element, library } objects.
 * Handles both class= (HTML) and className= (JSX) attribute syntaxes.
 */
function findIconElements(content) {
  const icons = [];
  const patterns = [
    { library: 'phosphor',  pattern: /<i\b[^>]*(?:class|className)="[^"]*\bph(?:-\w+)?\s+ph-[\w-]+[^"]*"[^>]*>[^<]*<\/i>/gi },
    { library: 'lucide',    pattern: /<i\b[^>]*data-lucide="[\w-]+"[^>]*>[^<]*<\/i>/gi },
    { library: 'material',  pattern: /<span\b[^>]*(?:class|className)="[^"]*material-symbols-[\w]+[^"]*"[^>]*>[\w_]+<\/span>/gi },
    { library: 'tabler',    pattern: /<i\b[^>]*(?:class|className)="[^"]*\bti\s+ti-[\w-]+[^"]*"[^>]*>[^<]*<\/i>/gi },
  ];

  for (const { library, pattern } of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      icons.push({ index: match.index, element: match[0], library });
    }
  }

  return icons;
}

/**
 * Check if an interactive element (button or anchor) containing an icon
 * has NO visible text -- making it icon-only.
 * Returns true if the container has no visible text besides the icon element.
 */
function isIconOnlyInteractive(containerHtml, iconElement) {
  // Extract inner content between opening and closing tag
  const openTagEnd = containerHtml.indexOf('>') + 1;
  const closeTagStart = containerHtml.lastIndexOf('</');
  if (openTagEnd <= 0 || closeTagStart < 0) return false;
  const inner = containerHtml.substring(openTagEnd, closeTagStart);
  // Remove the icon element
  const withoutIcon = inner.replace(iconElement, '');
  // Remove HTML comments and remaining tags
  const textOnly = withoutIcon
    .replace(/<!--.*?-->/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  return textOnly.length === 0;
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

  // Find all icon elements once for checks 4, 5, and 6
  const allIcons = findIconElements(content);

  // Track icons that are inside icon-only buttons/links (flagged by checks 4/5)
  // These should be skipped by check 6 since the parent needs the fix, not the icon
  const iconsInIconOnlyContainers = new Set();

  // 4. Icon-only buttons missing aria-label
  const buttonPattern = /<button\b[^>]*>[\s\S]*?<\/button>/gi;

  while ((match = buttonPattern.exec(content)) !== null) {
    const buttonHtml = match[0];
    const buttonStart = match.index;
    const buttonEnd = buttonStart + buttonHtml.length;

    // Find icons inside this button
    const iconsInButton = allIcons.filter(
      (icon) => icon.index >= buttonStart && icon.index < buttonEnd
    );

    if (iconsInButton.length === 0) continue;

    // Check if button is icon-only (no visible text besides icons)
    let isIconOnly = true;
    let testHtml = buttonHtml;
    for (const icon of iconsInButton) {
      testHtml = testHtml.replace(icon.element, '');
    }
    // Extract inner content and check for visible text
    const btnOpenEnd = testHtml.indexOf('>') + 1;
    const btnCloseStart = testHtml.lastIndexOf('</');
    if (btnOpenEnd > 0 && btnCloseStart >= 0) {
      const inner = testHtml.substring(btnOpenEnd, btnCloseStart);
      const textOnly = inner
        .replace(/<!--.*?-->/g, '')
        .replace(/<[^>]*>/g, '')
        .trim();
      isIconOnly = textOnly.length === 0;
    } else {
      isIconOnly = false;
    }

    if (isIconOnly) {
      // Check if button has aria-label
      const buttonOpenTag = buttonHtml.match(/^<button\b[^>]*>/i);
      const hasAriaLabel = buttonOpenTag && /\baria-label\s*=/i.test(buttonOpenTag[0]);

      if (!hasAriaLabel) {
        violations.push({
          line: getLineNumber(content, match.index),
          type: 'icon-button-missing-label',
          element: truncate(buttonHtml, 80),
          suggestion:
            'Add aria-label="description" to this icon-only button for screen reader accessibility',
        });
      }

      // Track these icons so check 6 skips them
      for (const icon of iconsInButton) {
        iconsInIconOnlyContainers.add(icon.index);
      }
    }
  }

  // 5. Icon-only links missing aria-label
  const anchorPattern = /<a\b[^>]*>[\s\S]*?<\/a>/gi;

  while ((match = anchorPattern.exec(content)) !== null) {
    const anchorHtml = match[0];
    const anchorStart = match.index;
    const anchorEnd = anchorStart + anchorHtml.length;

    // Find icons inside this anchor
    const iconsInAnchor = allIcons.filter(
      (icon) => icon.index >= anchorStart && icon.index < anchorEnd
    );

    if (iconsInAnchor.length === 0) continue;

    // Check if anchor is icon-only (no visible text besides icons)
    let isIconOnly = true;
    let testHtml = anchorHtml;
    for (const icon of iconsInAnchor) {
      testHtml = testHtml.replace(icon.element, '');
    }
    // Extract inner content and check for visible text
    const aOpenEnd = testHtml.indexOf('>') + 1;
    const aCloseStart = testHtml.lastIndexOf('</');
    if (aOpenEnd > 0 && aCloseStart >= 0) {
      const inner = testHtml.substring(aOpenEnd, aCloseStart);
      const textOnly = inner
        .replace(/<!--.*?-->/g, '')
        .replace(/<[^>]*>/g, '')
        .trim();
      isIconOnly = textOnly.length === 0;
    } else {
      isIconOnly = false;
    }

    if (isIconOnly) {
      // Check if anchor has aria-label
      const anchorOpenTag = anchorHtml.match(/^<a\b[^>]*>/i);
      const hasAriaLabel = anchorOpenTag && /\baria-label\s*=/i.test(anchorOpenTag[0]);

      if (!hasAriaLabel) {
        violations.push({
          line: getLineNumber(content, match.index),
          type: 'icon-link-missing-label',
          element: truncate(anchorHtml, 80),
          suggestion:
            'Add aria-label="description" to this icon-only link for screen reader accessibility',
        });
      }

      // Track these icons so check 6 skips them
      for (const icon of iconsInAnchor) {
        iconsInIconOnlyContainers.add(icon.index);
      }
    }
  }

  // 6. Decorative icons missing aria-hidden
  for (const icon of allIcons) {
    // Skip icons inside icon-only buttons/links (already flagged by checks 4/5)
    if (iconsInIconOnlyContainers.has(icon.index)) continue;

    // Check if the icon element has aria-hidden="true" or aria-hidden={true} (JSX)
    const hasAriaHidden =
      /aria-hidden\s*=\s*["']true["']/i.test(icon.element) ||
      /aria-hidden\s*=\s*\{true\}/i.test(icon.element);

    if (!hasAriaHidden) {
      violations.push({
        line: getLineNumber(content, icon.index),
        type: 'icon-missing-aria-hidden',
        element: truncate(icon.element, 80),
        suggestion:
          'Add aria-hidden="true" to this decorative icon element (screen readers should skip decorative icons)',
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
