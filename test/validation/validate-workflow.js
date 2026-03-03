#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const DESIGN_DIR = '.planning/design';

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
// Artifact definitions by workflow phase
// ─────────────────────────────────────────────────────────────

const PHASE_ARTIFACTS = {
  init: [
    'PROJECT.md',
    'DESIGN-BRIEF.md',
    'STATE.md',
  ],
  research: [
    'DESIGN-RESEARCH.md',
    'research/01-vertical-patterns.md',
    'research/02-visual-language.md',
    'research/03-accessibility.md',
    'research/04-competitor-audit.md',
  ],
  system: [
    'system/tokens.css',
    'system/COMPONENT-SPECS.md',
    'system/DESIGN-SYSTEM.md',
    'system/token-showcase.html',
  ],
};

function getScreenArtifacts(screen, phase) {
  if (phase === 'compose') {
    return [`screens/${screen}-SUMMARY.md`];
  }
  if (phase === 'review') {
    return [`reviews/${screen}-REVIEW.md`];
  }
  return [];
}

// ─────────────────────────────────────────────────────────────
// Verification functions
// ─────────────────────────────────────────────────────────────

function verifyPhase(projectDir, phase, screens) {
  const designDir = path.join(projectDir, DESIGN_DIR);
  const passed = [];
  const missing = [];

  let artifacts;
  if (phase === 'compose' || phase === 'review') {
    artifacts = [];
    for (const screen of screens) {
      artifacts.push(...getScreenArtifacts(screen, phase));
    }
  } else {
    artifacts = PHASE_ARTIFACTS[phase] || [];
  }

  for (const artifact of artifacts) {
    const fullPath = path.join(designDir, artifact);
    if (fs.existsSync(fullPath)) {
      passed.push(artifact);
    } else {
      missing.push(artifact);
    }
  }

  return { phase, passed, missing };
}

function verifyFullWorkflow(projectDir, screens) {
  const phases = ['init', 'research', 'system'];
  if (screens.length > 0) {
    phases.push('compose', 'review');
  }

  const results = [];
  for (const phase of phases) {
    results.push(verifyPhase(projectDir, phase, screens));
  }
  return results;
}

function verifyStateProgression(projectDir) {
  const designDir = path.join(projectDir, DESIGN_DIR);
  const statePath = path.join(designDir, 'STATE.md');

  if (!fs.existsSync(statePath)) {
    return { valid: false, error: 'STATE.md not found' };
  }

  const content = fs.readFileSync(statePath, 'utf8');
  const match = content.match(/## Phase\s*\n\s*(\w+)/);
  if (!match) {
    return { valid: false, error: 'Could not parse Phase from STATE.md' };
  }

  const phase = match[1];
  const isInitialized = phase !== 'UNINITIALIZED';
  return { valid: isInitialized, phase, error: isInitialized ? null : 'Phase is UNINITIALIZED' };
}

function verifyTokenShowcase(projectDir) {
  const designDir = path.join(projectDir, DESIGN_DIR);
  const showcasePath = path.join(designDir, 'system', 'token-showcase.html');

  if (!fs.existsSync(showcasePath)) {
    return { exists: false, hasVarRefs: false, hasDisallowedCDN: false };
  }

  const content = fs.readFileSync(showcasePath, 'utf8');
  const hasVarRefs = content.includes('var(--');

  // Check for CDN links other than fonts.google.com
  const cdnPattern = /https?:\/\/[^\s"'<>]+/g;
  const urls = content.match(cdnPattern) || [];
  const disallowedCDN = urls.filter(url => {
    return !url.includes('fonts.google.com') && !url.includes('fonts.googleapis.com') && !url.includes('fonts.gstatic.com');
  });

  return {
    exists: true,
    hasVarRefs,
    hasDisallowedCDN: disallowedCDN.length > 0,
    disallowedUrls: disallowedCDN,
  };
}

// ─────────────────────────────────────────────────────────────
// CLI argument parsing
// ─────────────────────────────────────────────────────────────

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage: node validate-workflow.js <project-dir> [--screens login,dashboard,settings]');
    console.log('');
    console.log('Verifies all expected Motif workflow artifacts exist in the given project directory.');
    console.log('');
    console.log('Options:');
    console.log('  --screens <names>  Comma-separated screen names to check (default: none)');
    process.exit(1);
  }

  const projectDir = path.resolve(args[0]);
  let screens = [];

  const screensIdx = args.indexOf('--screens');
  if (screensIdx !== -1 && args[screensIdx + 1]) {
    screens = args[screensIdx + 1].split(',').map(s => s.trim()).filter(Boolean);
  }

  return { projectDir, screens };
}

// ─────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────

function main() {
  const { projectDir, screens } = parseArgs();

  console.log(`\nValidating Motif workflow artifacts in: ${projectDir}`);
  if (screens.length > 0) {
    console.log(`Screens to check: ${screens.join(', ')}`);
  }
  console.log('');

  // Verify project directory exists
  if (!fs.existsSync(projectDir)) {
    console.log(`  FAIL: Project directory does not exist: ${projectDir}`);
    process.exit(1);
  }

  // ─── Phase artifact checks ───
  console.log('Phase Artifact Checks');
  console.log('─'.repeat(50));

  const results = verifyFullWorkflow(projectDir, screens);
  for (const result of results) {
    console.log(`\n  [${result.phase.toUpperCase()}]`);
    for (const file of result.passed) {
      assert(true, `${result.phase}/${file} exists`);
    }
    for (const file of result.missing) {
      assert(false, `${result.phase}/${file} exists`);
    }
  }

  // ─── State progression check ───
  console.log('\nState Progression');
  console.log('─'.repeat(50));

  const stateResult = verifyStateProgression(projectDir);
  if (stateResult.valid) {
    assert(true, `STATE.md phase is beyond UNINITIALIZED (current: ${stateResult.phase})`);
  } else {
    assert(false, `STATE.md phase check: ${stateResult.error}`);
  }

  // ─── Token showcase check ───
  console.log('\nToken Showcase');
  console.log('─'.repeat(50));

  const showcaseResult = verifyTokenShowcase(projectDir);
  assert(showcaseResult.exists, 'token-showcase.html exists');
  if (showcaseResult.exists) {
    assert(showcaseResult.hasVarRefs, 'token-showcase.html contains var(-- references');
    assert(!showcaseResult.hasDisallowedCDN, 'token-showcase.html has no disallowed CDN links');
    if (showcaseResult.hasDisallowedCDN) {
      console.log(`    Disallowed URLs: ${showcaseResult.disallowedUrls.join(', ')}`);
    }
  }

  // ─── Summary ───
  console.log('\n' + '═'.repeat(50));
  console.log(`\n${totalPass} passed, ${totalFail} failed\n`);

  process.exit(totalFail > 0 ? 1 : 0);
}

main();
