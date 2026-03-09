#!/usr/bin/env node
'use strict';

const { parseArgs, styleText } = require('node:util');
const path = require('node:path');

// ─── Subcommand registry ────────────────────────────────────────
const COMMANDS = {
  init:   './commands/init.js',
  status: './commands/status.js',
  update: './commands/update.js',
  doctor: './commands/doctor.js',
  list:   './commands/list.js',
};

// ─── Parse top-level args ───────────────────────────────────────

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  strict: false,
});

// ─── Handle --version / -v ──────────────────────────────────────

if (values.version || values.v) {
  const pkg = require(path.join(__dirname, '..', 'package.json'));
  console.log(pkg.version);
  process.exit(0);
}

// ─── Help text ──────────────────────────────────────────────────

function printHelp() {
  console.log(`
${styleText('bold', 'motif')} - Domain-intelligent design system for AI coding assistants

${styleText('bold', 'USAGE')}
  motif <command> [options]
  npx motif-design@latest [options]

${styleText('bold', 'COMMANDS')}
  ${styleText('cyan', 'init')}       Install Motif into the current project
  ${styleText('cyan', 'status')}     Show version, workflow phase, and screens composed
  ${styleText('cyan', 'update')}     Sync project files from updated global package
  ${styleText('cyan', 'doctor')}     Check installation integrity and configuration
  ${styleText('cyan', 'list')}       Show available design verticals
  ${styleText('cyan', 'help')}       Show this help message

${styleText('bold', 'OPTIONS')}
  -v, --version    Show version number
  -h, --help       Show this help message

${styleText('bold', 'EXAMPLES')}
  motif init                              Install with auto-detected runtime
  motif init --runtime claude-code        Explicit runtime selection
  motif status                            Check installation status
  motif list                              Browse available verticals
  motif doctor                            Diagnose installation issues
  motif update                            Update to latest version
`);
}

// ─── Handle --help / -h / help subcommand ───────────────────────

if (values.help || values.h || positionals[0] === 'help') {
  printHelp();
  process.exit(0);
}

// ─── Route subcommand ───────────────────────────────────────────

const subcommand = positionals[0];

if (subcommand && COMMANDS[subcommand]) {
  // Known subcommand: route to handler with remaining args
  require(COMMANDS[subcommand]).run(process.argv.slice(3));
} else {
  // No subcommand or unrecognized first arg: backward-compat init mode
  // Passes all args through so `npx motif-design@latest --force` still works
  require(COMMANDS.init).run(process.argv.slice(2));
}
