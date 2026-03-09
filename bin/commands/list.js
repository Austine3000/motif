'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs, styleText } = require('node:util');

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
${styleText('bold', 'motif list')} - Show available design verticals

${styleText('bold', 'USAGE')}
  motif list [options]

${styleText('bold', 'OPTIONS')}
  -h, --help    Show this help message

${styleText('bold', 'DESCRIPTION')}
  Lists all available design verticals included in the Motif package.
  Each vertical provides domain-specific design intelligence for a
  particular industry or application type.
`);
}

// ─── Extract description ─────────────────────────────────────────

function extractDescription(content) {
  // Find first bold markdown text: **some text**
  const match = content.match(/\*\*([^*]+)\*\*/);
  return match ? match[1] : 'No description available';
}

// ─── Main ────────────────────────────────────────────────────────

function run(args) {
  const flags = parseFlags(args);

  if (flags.help) {
    printHelp();
    process.exit(0);
  }

  // Resolve verticals directory from package source
  const verticalsDir = path.resolve(__dirname, '..', '..', 'core', 'references', 'verticals');

  if (!fs.existsSync(verticalsDir)) {
    console.error(styleText('red', 'Verticals directory not found.'));
    process.exit(1);
  }

  // Read all .md files, sorted alphabetically
  const files = fs.readdirSync(verticalsDir)
    .filter(f => f.endsWith('.md'))
    .sort();

  if (files.length === 0) {
    console.error(styleText('red', 'No verticals found.'));
    process.exit(1);
  }

  // Header
  console.log('');
  console.log(styleText('bold', 'Available Verticals'));
  console.log('');

  // List each vertical
  for (const file of files) {
    const name = file.replace(/\.md$/, '');
    const content = fs.readFileSync(path.join(verticalsDir, file), 'utf8');
    const description = extractDescription(content);
    const paddedName = name.padEnd(14);
    console.log(`  ${styleText('cyan', paddedName)}  ${description}`);
  }

  // Footer
  console.log('');
  console.log(`${files.length} verticals available. Use 'motif init' to start a project.`);
  console.log('');
}

module.exports = { run };
