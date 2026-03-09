'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs, styleText } = require('node:util');
const { execSync } = require('node:child_process');
const { findProjectRoot } = require('../lib/find-root.js');
const { readManifest, getPackageVersion, compareVersions } = require('../lib/manifest.js');

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
${styleText('bold', 'motif status')} - Show Motif installation and project status

${styleText('bold', 'USAGE')}
  motif status [options]

${styleText('bold', 'OPTIONS')}
  -h, --help    Show this help message

${styleText('bold', 'OUTPUT')}
  Version       Installed Motif version (with update notice if newer available)
  Runtime       Detected AI runtime
  Installed     Installation date
  Phase         Current design workflow phase (if active)
  Screens       Composed/total screen count (if active)
`);
}

// ─── State reading ───────────────────────────────────────────────

function readDesignState(projectRoot) {
  const stateScript = path.join(projectRoot, '.claude', 'get-motif', 'scripts', 'motif-state.js');

  if (!fs.existsSync(stateScript)) {
    return null;
  }

  try {
    const output = execSync(`node "${stateScript}" read`, {
      encoding: 'utf8',
      timeout: 5000,
      cwd: projectRoot,
    });
    const state = JSON.parse(output.trim());
    if (state.error) return null;
    return state;
  } catch {
    return null;
  }
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
  console.log(styleText('bold', 'Motif Status'));
  console.log('\u2500'.repeat(40));

  // Version line with update check
  const pkgVersion = getPackageVersion();
  let versionLine = `  Version:     ${styleText('cyan', manifest.version)}`;
  if (pkgVersion && compareVersions(manifest.version, pkgVersion) < 0) {
    versionLine += `  ${styleText('yellow', `(update available: v${pkgVersion})`)}`;
  } else {
    versionLine += `  ${styleText('green', '(up to date)')}`;
  }
  console.log(versionLine);

  // Runtime and install date
  console.log(`  Runtime:     ${styleText('cyan', manifest.runtime || 'unknown')}`);
  const installedDate = manifest.installedAt
    ? new Date(manifest.installedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : 'unknown';
  console.log(`  Installed:   ${styleText('cyan', installedDate)}`);

  // Design workflow state
  console.log('');
  const state = readDesignState(projectRoot);
  if (state && state.phase) {
    console.log(`  Phase:       ${styleText('cyan', state.phase)}`);
    const composed = state.screens_composed ?? state.screensComposed ?? '--';
    const total = state.screens_total ?? state.screensTotal ?? '--';
    console.log(`  Screens:     ${styleText('cyan', `${composed}/${total}`)}`);
  } else {
    console.log(`  Phase:       ${styleText('yellow', 'No active design project')}`);
    console.log(`  Screens:     ${styleText('yellow', '--')}`);
  }

  console.log('');
}

module.exports = { run };
