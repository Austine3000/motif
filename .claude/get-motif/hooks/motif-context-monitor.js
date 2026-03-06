#!/usr/bin/env node
'use strict';

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

  const GREEN = '\x1b[32m';
  const YELLOW = '\x1b[33m';
  const RED = '\x1b[31m';
  const RESET = '\x1b[0m';

  let color;
  let message;

  if (pct >= 90) {
    color = RED;
    message = `Motif context: ${pct}% -- CRITICAL: /clear now`;
  } else if (pct >= 70) {
    color = YELLOW;
    message = `Motif context: ${pct}% -- quality may degrade, /clear recommended`;
  } else if (pct >= 50) {
    color = YELLOW;
    message = `Motif context: ${pct}% -- recommend /clear`;
  } else {
    color = GREEN;
    message = `Motif context: ${pct}%`;
  }

  process.stdout.write(`${color}${message}${RESET}`);
});
