#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

let input = '';
process.stdin.on('data', chunk => input += chunk);
process.stdin.on('end', () => {
  let data;
  try {
    data = JSON.parse(input);
  } catch (e) {
    // Malformed JSON -- exit silently, never crash the status line
    process.exit(0);
  }

  const pct = Math.floor((data && data.context_window && data.context_window.used_percentage) || 0);

  // ANSI color codes
  const CYAN = '\x1b[36m';
  const DIM = '\x1b[2m';
  const GREEN = '\x1b[32m';
  const YELLOW = '\x1b[33m';
  const RED = '\x1b[31m';
  const RESET = '\x1b[0m';

  // Determine context color based on percentage
  let ctxColor;
  if (pct >= 90) {
    ctxColor = RED;
  } else if (pct >= 50) {
    ctxColor = YELLOW;
  } else {
    ctxColor = GREEN;
  }

  // Attempt to read Motif STATE.md from disk
  let motifState = null;
  try {
    const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
    const statePath = path.join(projectDir, '.planning', 'design', 'STATE.md');
    const content = fs.readFileSync(statePath, 'utf8');

    // Parse YAML frontmatter inline (self-contained, no external deps)
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const yml = fmMatch[1];
      const get = (key) => {
        const m = yml.match(new RegExp('^' + key + ':\\s*(.+)$', 'm'));
        return m ? m[1].trim() : null;
      };

      const phase = get('phase');
      const vertical = get('vertical');
      const screensComposed = parseInt(get('screens_composed') || '0', 10);
      const screenCount = parseInt(get('screen_count') || '0', 10);

      if (phase && vertical) {
        // Build next-action hint based on phase
        let hint = '';
        switch (phase) {
          case 'INITIALIZED':
            hint = '/motif:research';
            break;
          case 'RESEARCHED':
            hint = '/motif:system';
            break;
          case 'SYSTEM_GENERATED':
            hint = '/motif:compose';
            break;
          case 'COMPOSING': {
            // Find first planned screen from the screens list
            const screensMatch = yml.match(/^screens:\s*\n((?:\s+-\s+.*\n)*)/m);
            let nextScreen = null;
            if (screensMatch) {
              const lines = screensMatch[1].split('\n');
              for (const line of lines) {
                const sm = line.match(/name:\s*(\S+).*status:\s*planned/);
                if (sm) { nextScreen = sm[1]; break; }
              }
            }
            hint = nextScreen || '/motif:review';
            break;
          }
          case 'REVIEWING':
            hint = '/motif:fix';
            break;
          case 'ITERATING':
            hint = '/motif:compose';
            break;
          default:
            hint = '/motif:init';
        }

        motifState = { phase, vertical, screensComposed, screenCount, hint };
      }
    }
  } catch (e) {
    // STATE.md missing or unreadable -- fall back to context-only display
  }

  // Build output
  let output = '';

  if (motifState) {
    // Rich Motif state display
    const { phase, vertical, screensComposed, screenCount, hint } = motifState;
    output = `${CYAN}Motif:${RESET} ${vertical} ${DIM}|${RESET} ${phase} ${screensComposed}/${screenCount} ${DIM}|${RESET} next: ${hint} ${DIM}|${RESET} ${ctxColor}ctx:${pct}%${RESET}`;
  } else {
    // Context-only display (no Motif project)
    output = `${ctxColor}Motif context: ${pct}%${RESET}`;
  }

  // Append context warnings for high usage
  if (pct >= 90) {
    output += ` ${RED}-- CRITICAL: /clear now${RESET}`;
  } else if (pct >= 70) {
    output += ` ${YELLOW}-- quality may degrade, /clear recommended${RESET}`;
  } else if (pct >= 50) {
    output += ` ${YELLOW}-- recommend /clear${RESET}`;
  }

  process.stdout.write(output);
});
