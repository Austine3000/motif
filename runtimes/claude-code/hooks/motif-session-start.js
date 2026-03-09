#!/usr/bin/env node
'use strict';

/**
 * Motif SessionStart Hook
 *
 * Fires on startup, resume, clear, and compact events.
 * Injects Motif state into Claude's context via additionalContext.
 * Triggers artifact recovery when STATE.md is missing or corrupt.
 *
 * NEVER crashes — a crashed hook blocks Claude Code.
 * Bug #15174: Output silently dropped on compact. CLAUDE.md rule provides backup.
 */

try {
  const { execSync } = require('child_process');
  const path = require('path');

  const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
  const stateScript = path.join(projectDir, '.claude', 'get-motif', 'scripts', 'motif-state.js');

  // Read current state
  let stateJson;
  try {
    stateJson = execSync(`node "${stateScript}" read`, {
      cwd: projectDir,
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (err) {
    // motif-state.js not found or failed — not a Motif project
    process.exit(0);
  }

  let state;
  try {
    state = JSON.parse(stateJson);
  } catch (err) {
    // Invalid JSON output — exit silently
    process.exit(0);
  }

  let recovered = false;

  // If state is missing or corrupt, attempt recovery
  if (state.error === 'missing' || state.error === 'corrupt') {
    let recoveryJson;
    try {
      recoveryJson = execSync(`node "${stateScript}" recover`, {
        cwd: projectDir,
        encoding: 'utf8',
        timeout: 10000,
        stdio: ['pipe', 'pipe', 'pipe']
      }).trim();
    } catch (err) {
      // Recovery failed — not a Motif project or no artifacts
      process.exit(0);
    }

    try {
      state = JSON.parse(recoveryJson);
    } catch (err) {
      process.exit(0);
    }

    // If recovery also returned an error, exit silently
    if (state.error) {
      process.exit(0);
    }

    recovered = true;
  }

  // If we still have an error state, exit silently
  if (state.error) {
    process.exit(0);
  }

  // Build context string
  const phase = state.phase || '?';
  const vertical = state.vertical || '?';
  const stack = state.stack || '?';
  const screensComposed = state.screens_composed || 0;
  const screenCount = state.screen_count || 0;
  const lastCommand = state.last_command || 'none';
  const lastOutcome = state.last_outcome || 'unknown';

  let context = `[Motif State] Phase: ${phase} | Vertical: ${vertical} | Stack: ${stack} | Screens: ${screensComposed}/${screenCount} | Last: ${lastCommand} (${lastOutcome})`;

  if (recovered) {
    context = `[Motif State RECOVERED from artifacts] ${context}`;
  }

  // Output Claude Code SessionStart response format
  const output = {
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: context
    }
  };

  console.log(JSON.stringify(output));
} catch (err) {
  // Top-level catch — NEVER crash
  process.stderr.write(`[Motif SessionStart] Error: ${err.message}\n`);
  process.exit(0);
}
