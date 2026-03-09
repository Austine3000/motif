'use strict';

const { parseArgs, styleText } = require('node:util');
const { findProjectRoot } = require('../lib/find-root.js');
const { readManifest, getPackageVersion, compareVersions } = require('../lib/manifest.js');

// ─── Flag parsing ────────────────────────────────────────────────

function parseFlags(args) {
  const { values } = parseArgs({
    args,
    options: {
      help: { type: 'boolean', short: 'h', default: false },
      force: { type: 'boolean', short: 'f', default: false },
    },
    strict: true,
  });
  return values;
}

function printHelp() {
  console.log(`
${styleText('bold', 'motif update')} - Sync project files from updated global package

${styleText('bold', 'USAGE')}
  motif update [options]

${styleText('bold', 'OPTIONS')}
  -f, --force   Force update even if project version is newer (downgrade)
  -h, --help    Show this help message

${styleText('bold', 'DESCRIPTION')}
  Compares your project's installed Motif version with the global package
  version. If the package is newer, syncs all files using the init command.
  Modified files are backed up to .motif-backup/ before overwriting.
`);
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

  // Get package version
  const packageVersion = getPackageVersion();
  if (!packageVersion) {
    console.error(styleText('red', 'Could not determine package version.'));
    process.exit(1);
  }

  const cmp = compareVersions(manifest.version, packageVersion);

  // Already up to date
  if (cmp === 0) {
    console.log(styleText('green', `Already up to date (v${packageVersion})`));
    process.exit(0);
  }

  // Installed is NEWER than package (would be a downgrade)
  if (cmp === 1 && !flags.force) {
    console.log(styleText('yellow', `Project version (v${manifest.version}) is newer than package (v${packageVersion}).`));
    console.log(styleText('yellow', 'This would downgrade your installation.'));
    console.log('');
    console.log(`  To get the latest package:  ${styleText('cyan', 'npm install -g motif-design@latest')}`);
    console.log(`  To force downgrade:         ${styleText('cyan', 'motif update --force')}`);
    process.exit(1);
  }

  // Proceed with update
  console.log(styleText('cyan', `Updating Motif: v${manifest.version} -> v${packageVersion}`));
  console.log('');

  // Delegate to init --force for actual file sync
  require('./init.js').run(['--force']);
}

module.exports = { run };
