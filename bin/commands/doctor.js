'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs, styleText } = require('node:util');
const { findProjectRoot } = require('../lib/find-root.js');
const { readManifest, getPackageVersion, compareVersions, hashFile } = require('../lib/manifest.js');

// ─── Flag parsing ────────────────────────────────────────────────

function parseFlags(args) {
  const { values } = parseArgs({
    args,
    options: {
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: true,
  });
  return values;
}

function printHelp() {
  console.log(`
${styleText('bold', 'motif doctor')} - Check installation integrity and configuration

${styleText('bold', 'USAGE')}
  motif doctor [options]

${styleText('bold', 'OPTIONS')}
  -h, --help    Show this help message

${styleText('bold', 'CHECKS')}
  File Integrity     Verify all manifest files exist and match expected hashes
  Hook Config        Check CLAUDE.md sentinels and settings.json hooks
  Version            Compare project version with global package version
`);
}

// ─── Check result helpers ────────────────────────────────────────

function ok(msg) { return { status: 'OK', msg }; }
function warn(msg) { return { status: '!!', msg }; }
function fail(msg) { return { status: 'XX', msg }; }

function formatResult(result) {
  const label = `[${result.status}]`;
  if (result.status === 'OK') {
    return `  ${styleText('green', label)} ${result.msg}`;
  } else if (result.status === '!!') {
    return `  ${styleText('yellow', label)} ${result.msg}`;
  } else {
    return `  ${styleText('red', label)} ${result.msg}`;
  }
}

// ─── Checks ──────────────────────────────────────────────────────

function checkFileIntegrity(projectRoot, manifest) {
  const results = [];
  const files = manifest.files || {};
  const fileKeys = Object.keys(files);

  if (fileKeys.length === 0) {
    results.push(warn('No files recorded in manifest'));
    return results;
  }

  for (const relPath of fileKeys) {
    const fullPath = path.join(projectRoot, relPath);
    if (!fs.existsSync(fullPath)) {
      results.push(fail(`Missing: ${relPath}`));
    } else {
      try {
        const currentHash = hashFile(fullPath);
        const expectedHash = files[relPath].hash || files[relPath];
        if (currentHash === expectedHash) {
          results.push(ok(`${relPath}`));
        } else {
          results.push(warn(`Modified: ${relPath}`));
        }
      } catch {
        results.push(warn(`Could not hash: ${relPath}`));
      }
    }
  }

  return results;
}

function checkHookConfiguration(projectRoot) {
  const results = [];

  // Check CLAUDE.md sentinels
  const claudeMdPath = path.join(projectRoot, 'CLAUDE.md');
  if (fs.existsSync(claudeMdPath)) {
    const content = fs.readFileSync(claudeMdPath, 'utf8');
    const hasStart = content.includes('MOTIF-START');
    const hasEnd = content.includes('MOTIF-END');
    if (hasStart && hasEnd) {
      results.push(ok('CLAUDE.md sentinels present'));
    } else {
      results.push(fail('CLAUDE.md missing MOTIF sentinel markers'));
    }
  } else {
    results.push(fail('CLAUDE.md not found'));
  }

  // Check settings.json
  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    let settings;
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch {
      results.push(fail('settings.json is invalid JSON'));
      results.push(fail('PostToolUse hook not configured'));
      results.push(fail('SessionStart hook not configured'));
      results.push(fail('statusLine not configured'));
      return results;
    }

    // PostToolUse hook
    const postToolUse = settings.hooks?.PostToolUse;
    if (Array.isArray(postToolUse) && postToolUse.some(h => (h.command || '').includes('motif'))) {
      results.push(ok('PostToolUse hook configured'));
    } else {
      results.push(fail('PostToolUse hook not configured'));
    }

    // SessionStart hook
    const sessionStart = settings.hooks?.SessionStart;
    if (Array.isArray(sessionStart) && sessionStart.some(h => (h.command || '').includes('motif-session-start'))) {
      results.push(ok('SessionStart hook configured'));
    } else {
      results.push(fail('SessionStart hook not configured'));
    }

    // statusLine
    const statusLine = settings.statusLine;
    if (statusLine && (statusLine.command || '').includes('motif-context-monitor')) {
      results.push(ok('statusLine configured'));
    } else {
      results.push(fail('statusLine not configured'));
    }
  } else {
    results.push(fail('settings.json not found'));
    results.push(fail('PostToolUse hook not configured'));
    results.push(fail('SessionStart hook not configured'));
    results.push(fail('statusLine not configured'));
  }

  return results;
}

function checkVersionConsistency(manifest) {
  const results = [];
  const packageVersion = getPackageVersion();

  if (!packageVersion) {
    results.push(warn('Could not determine package version'));
    return results;
  }

  const cmp = compareVersions(manifest.version, packageVersion);

  if (cmp === 0) {
    results.push(ok(`Versions match (v${packageVersion})`));
  } else if (cmp === 1) {
    results.push(warn(`Project version (v${manifest.version}) newer than package (v${packageVersion})`));
  } else {
    results.push(warn(`Update available: v${packageVersion} (installed: v${manifest.version})`));
  }

  return results;
}

// ─── Main ────────────────────────────────────────────────────────

function run(args) {
  const flags = parseFlags(args);

  if (flags.help) {
    printHelp();
    process.exit(0);
  }

  // Find project root
  const projectRoot = findProjectRoot(process.cwd());
  if (!projectRoot) {
    console.error(styleText('red', 'Not inside a project directory.'));
    console.error('Run this command from a directory that contains .git/ or package.json');
    process.exit(1);
  }

  // Read manifest
  const manifest = readManifest(projectRoot);
  if (!manifest) {
    console.error(styleText('red', 'No Motif installation found. Run \'motif init\' to install.'));
    process.exit(1);
  }

  // Header
  console.log('');
  console.log(styleText('bold', 'Motif Doctor'));
  console.log('\u2500'.repeat(40));

  let totalOk = 0;
  let totalWarn = 0;
  let totalFail = 0;

  function printCategory(name, results) {
    console.log('');
    console.log(styleText('bold', `  ${name}`));
    for (const r of results) {
      console.log(formatResult(r));
      if (r.status === 'OK') totalOk++;
      else if (r.status === '!!') totalWarn++;
      else totalFail++;
    }
  }

  // Run all checks
  printCategory('File Integrity', checkFileIntegrity(projectRoot, manifest));
  printCategory('Hook Configuration', checkHookConfiguration(projectRoot));
  printCategory('Version Consistency', checkVersionConsistency(manifest));

  // Summary
  console.log('');
  console.log('\u2500'.repeat(40));
  const summaryParts = [];
  summaryParts.push(`${totalOk} passed`);
  if (totalWarn > 0) summaryParts.push(`${totalWarn} warnings`);
  if (totalFail > 0) summaryParts.push(`${totalFail} failed`);
  const summary = summaryParts.join(', ');

  if (totalFail > 0) {
    console.log(styleText('red', summary));
  } else if (totalWarn > 0) {
    console.log(styleText('yellow', summary));
  } else {
    console.log(styleText('green', summary));
  }
  console.log('');

  process.exit(totalFail > 0 ? 1 : 0);
}

module.exports = { run };
