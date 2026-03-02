#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs, styleText } = require('node:util');
const { createHash } = require('node:crypto');

// ─── Stage 1: Parse CLI flags ──────────────────────────────────

function parseFlags() {
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      runtime: { type: 'string', short: 'r' },
      force: { type: 'boolean', short: 'f', default: false },
      'dry-run': { type: 'boolean', default: false },
      uninstall: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h', default: false },
    },
    strict: true,
  });
  return values;
}

function printHelp() {
  console.log(`
${styleText('bold', 'motif')} - Domain-intelligent design system for AI coding assistants

${styleText('bold', 'USAGE')}
  npx motif@latest [options]

${styleText('bold', 'OPTIONS')}
  -r, --runtime <name>   Override runtime auto-detection (supported: claude-code)
  -f, --force            Overwrite all files without backup checks
      --dry-run          Print what would happen without writing any files
      --uninstall        Remove Motif installation
  -h, --help             Show this help message

${styleText('bold', 'EXAMPLES')}
  npx motif@latest                    Auto-detect runtime and install
  npx motif@latest --runtime claude-code   Explicit runtime selection
  npx motif@latest --dry-run          Preview installation without changes
  npx motif@latest --force            Overwrite all existing files
`);
}

// ─── Stage 2: Detect runtime ───────────────────────────────────

function detectRuntime(flags) {
  const validRuntimes = ['claude-code'];

  if (flags.runtime) {
    if (!validRuntimes.includes(flags.runtime)) {
      console.error(styleText('red', `Unknown runtime: ${flags.runtime}`));
      console.error(`Supported runtimes: ${validRuntimes.join(', ')}`);
      process.exit(1);
    }
    return flags.runtime;
  }

  const cwd = process.cwd();
  if (fs.existsSync(path.join(cwd, '.claude'))) return 'claude-code';

  console.error(styleText('red', 'Could not detect AI runtime.'));
  console.error('No .claude/ directory found. Create it or specify --runtime claude-code');
  process.exit(1);
}

// ─── Stage 3: Resolve source-to-target mapping ─────────────────

function resolveMapping(runtime) {
  const pkgDir = path.dirname(__dirname);
  const cwd = process.cwd();

  if (runtime === 'claude-code') {
    const copies = [
      { src: path.join(pkgDir, 'core', 'references'), dest: path.join(cwd, '.claude', 'get-motif', 'references') },
      { src: path.join(pkgDir, 'core', 'workflows'), dest: path.join(cwd, '.claude', 'get-motif', 'workflows') },
      { src: path.join(pkgDir, 'core', 'templates'), dest: path.join(cwd, '.claude', 'get-motif', 'templates') },
      { src: path.join(pkgDir, 'runtimes', 'claude-code', 'agents'), dest: path.join(cwd, '.claude', 'get-motif', 'agents') },
      { src: path.join(pkgDir, 'runtimes', 'claude-code', 'commands', 'motif'), dest: path.join(cwd, '.claude', 'commands', 'motif') },
      { src: path.join(pkgDir, 'scripts'), dest: path.join(cwd, '.claude', 'get-motif', 'scripts') },
    ];

    return {
      motifRoot: '.claude/get-motif',
      copies,
      snippet: path.join(pkgDir, 'runtimes', 'claude-code', 'CLAUDE-MD-SNIPPET.md'),
      configTarget: path.join(cwd, 'CLAUDE.md'),
    };
  }
}

// ─── Stage 4: Copy files with {MOTIF_ROOT} resolution ──────────

function resolveContent(content, motifRoot) {
  return content
    .replaceAll('{MOTIF_ROOT}', motifRoot);
}

function shouldBackup(destPath, existingManifest) {
  if (!fs.existsSync(destPath)) return false;
  if (!existingManifest) return true; // No manifest = unknown state, back up to be safe

  const relPath = path.relative(process.cwd(), destPath);
  const entry = existingManifest.files[relPath];
  if (!entry) return true; // File not in manifest = unknown, back up

  const currentHash = hashFile(destPath);
  // If current hash matches what we installed, user hasn't modified it -- safe to overwrite
  if (currentHash === entry.hash) return false;
  // User modified this file -- back up before overwriting
  return true;
}

function walkAndCopy(srcDir, destDir, motifRoot, existingManifest, flags) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  const cwd = process.cwd();
  const results = { copied: 0, skipped: 0, backedUp: 0, errors: [] };

  if (!flags['dry-run']) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  for (const entry of entries) {
    if (entry.name === '.DS_Store' || entry.name.startsWith('.')) continue;

    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      const subResult = walkAndCopy(srcPath, destPath, motifRoot, existingManifest, flags);
      results.copied += subResult.copied;
      results.skipped += subResult.skipped;
      results.backedUp += subResult.backedUp;
      results.errors.push(...subResult.errors);
      continue;
    }

    // Validate target path is within project root
    const resolved = path.resolve(destPath);
    if (!resolved.startsWith(cwd + path.sep) && resolved !== cwd) {
      console.error(styleText('red', `Path traversal detected: ${resolved}`));
      process.exit(1);
    }

    const relPath = path.relative(cwd, destPath);

    // Backup check for re-install (skip if --force)
    if (!flags.force && shouldBackup(destPath, existingManifest)) {
      if (flags['dry-run']) {
        console.log(`  Would back up: ${relPath}`);
      } else {
        const backupDir = path.join(cwd, '.motif-backup');
        fs.mkdirSync(backupDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupName = `${entry.name}.${timestamp}`;
        fs.copyFileSync(destPath, path.join(backupDir, backupName));
        console.log(`  Backed up: ${relPath} -> .motif-backup/${backupName}`);
        results.backedUp++;
      }
    }

    if (flags['dry-run']) {
      console.log(`  Would copy: ${relPath}`);
      results.skipped++;
      continue;
    }

    try {
      const ext = path.extname(srcPath).toLowerCase();
      if (ext === '.md') {
        const content = fs.readFileSync(srcPath, 'utf8');
        const resolvedText = resolveContent(content, motifRoot);
        fs.writeFileSync(destPath, resolvedText, 'utf8');
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
      results.copied++;
    } catch (err) {
      results.errors.push(`Failed to copy ${relPath}: ${err.message}`);
    }
  }

  return results;
}

function copyFiles(mapping, existingManifest, flags) {
  const totals = { copied: 0, skipped: 0, backedUp: 0, errors: [] };

  if (flags['dry-run']) {
    console.log('');
    console.log(styleText('bold', 'Dry run — files that would be copied:'));
    console.log('');
  }

  for (const { src, dest } of mapping.copies) {
    if (!fs.existsSync(src)) {
      if (flags['dry-run']) {
        console.log(`  [skip] Source not found: ${path.relative(path.dirname(__dirname), src)}`);
      }
      continue;
    }

    const result = walkAndCopy(src, dest, mapping.motifRoot, existingManifest, flags);
    totals.copied += result.copied;
    totals.skipped += result.skipped;
    totals.backedUp += result.backedUp;
    totals.errors.push(...result.errors);
  }

  return totals;
}

// ─── Stage 5: Inject config into CLAUDE.md ─────────────────────

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function injectConfig(mapping, flags) {
  const START = '<!-- MOTIF-START -->';
  const END = '<!-- MOTIF-END -->';
  const cwd = process.cwd();

  const snippetContent = fs.readFileSync(mapping.snippet, 'utf8');
  const resolvedSnippet = resolveContent(snippetContent, mapping.motifRoot);
  const block = `${START}\n${resolvedSnippet}\n${END}`;

  // Determine config target path
  let configPath = mapping.configTarget;
  const altPath = path.join(cwd, '.claude', 'CLAUDE.md');

  if (!fs.existsSync(configPath) && fs.existsSync(altPath)) {
    configPath = altPath;
  }

  if (flags['dry-run']) {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      if (content.includes(START) && content.includes(END)) {
        console.log(`  Would replace: Motif config in ${path.relative(cwd, configPath)}`);
        return { action: 'replaced', path: configPath };
      }
      console.log(`  Would append: Motif config to ${path.relative(cwd, configPath)}`);
      return { action: 'appended', path: configPath };
    }
    console.log(`  Would create: ${path.relative(cwd, configPath)}`);
    return { action: 'created', path: configPath };
  }

  if (fs.existsSync(configPath)) {
    let content = fs.readFileSync(configPath, 'utf8');

    if (content.includes(START) && content.includes(END)) {
      const regex = new RegExp(
        `${escapeRegex(START)}[\\s\\S]*?${escapeRegex(END)}`,
        'g'
      );
      content = content.replace(regex, block);
      fs.writeFileSync(configPath, content, 'utf8');
      return { action: 'replaced', path: configPath };
    }

    content += '\n\n' + block + '\n';
    fs.writeFileSync(configPath, content, 'utf8');
    return { action: 'appended', path: configPath };
  }

  // Create new file
  fs.writeFileSync(configPath, block + '\n', 'utf8');
  return { action: 'created', path: configPath };
}

// ─── Stage 6: Hash file helper ─────────────────────────────────

function hashFile(filePath) {
  const content = fs.readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

// ─── Stage 7: Write manifest ───────────────────────────────────

function walkFiles(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === '.DS_Store' || entry.name.startsWith('.')) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(fullPath));
    } else {
      results.push(fullPath);
    }
  }
  return results;
}

function writeManifest(mapping, copyResult, flags) {
  if (flags['dry-run']) return;

  const cwd = process.cwd();
  const pkgDir = path.dirname(__dirname);
  const manifest = {
    version: '0.1.0',
    runtime: 'claude-code',
    installedAt: new Date().toISOString(),
    files: {},
  };

  // Walk all installed destination directories
  for (const { src, dest } of mapping.copies) {
    if (!fs.existsSync(dest)) continue;
    const files = walkFiles(dest);
    for (const file of files) {
      const relPath = path.relative(cwd, file);
      // Derive source relative path
      const relInDest = path.relative(dest, file);
      const srcFile = path.join(src, relInDest);
      manifest.files[relPath] = {
        hash: hashFile(file),
        source: path.relative(pkgDir, srcFile),
      };
    }
  }

  // Include config target if it exists
  const configPath = mapping.configTarget;
  const altPath = path.join(cwd, '.claude', 'CLAUDE.md');
  const actualConfig = fs.existsSync(configPath) ? configPath : (fs.existsSync(altPath) ? altPath : null);
  if (actualConfig) {
    manifest.files[path.relative(cwd, actualConfig)] = {
      hash: hashFile(actualConfig),
      source: path.relative(pkgDir, mapping.snippet),
    };
  }

  const manifestPath = path.join(cwd, '.motif-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

// ─── Stage 8: Post-install verification ────────────────────────

function verify(mapping) {
  const cwd = process.cwd();
  const errors = [];

  // 1. Check expected directories exist
  for (const { dest } of mapping.copies) {
    // Only check directories whose source existed (skip scripts/, hooks/)
    const srcExists = mapping.copies.find(c => c.dest === dest);
    if (srcExists && fs.existsSync(srcExists.src) && !fs.existsSync(dest)) {
      errors.push(`Missing directory: ${path.relative(cwd, dest)}`);
    }
  }

  // 2. Check for unresolved {MOTIF_ROOT} in installed .md files
  const dirsToCheck = [
    path.join(cwd, '.claude', 'get-motif'),
    path.join(cwd, '.claude', 'commands', 'motif'),
  ];

  for (const dir of dirsToCheck) {
    if (!fs.existsSync(dir)) continue;
    const files = walkFiles(dir);
    for (const file of files) {
      if (path.extname(file) !== '.md') continue;
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('{MOTIF_ROOT}')) {
        errors.push(`Unresolved {MOTIF_ROOT} in: ${path.relative(cwd, file)}`);
      }
    }
  }

  // 3. Check CLAUDE.md has sentinel markers
  const configPath = mapping.configTarget;
  const altPath = path.join(cwd, '.claude', 'CLAUDE.md');
  const actualConfig = fs.existsSync(configPath) ? configPath : (fs.existsSync(altPath) ? altPath : null);

  if (actualConfig) {
    const content = fs.readFileSync(actualConfig, 'utf8');
    if (!content.includes('<!-- MOTIF-START -->') || !content.includes('<!-- MOTIF-END -->')) {
      errors.push('CLAUDE.md missing Motif sentinel markers');
    }
  } else {
    errors.push('CLAUDE.md not found after installation');
  }

  // 4. Check manifest was written
  if (!fs.existsSync(path.join(cwd, '.motif-manifest.json'))) {
    errors.push('Manifest file not written');
  }

  return errors;
}

// ─── Stage 9: Print summary ───────────────────────────────────

function printSummary(copyResult, injectResult, verifyErrors) {
  console.log('');
  console.log(styleText('bold', 'Motif Installation Summary'));
  console.log('\u2500'.repeat(40));
  console.log(`  Files copied:    ${copyResult.copied}`);
  console.log(`  Files backed up: ${copyResult.backedUp}`);
  console.log(`  Files skipped:   ${copyResult.skipped}`);
  console.log(`  Config:          ${injectResult.action} (${path.relative(process.cwd(), injectResult.path)})`);

  if (copyResult.errors.length > 0) {
    console.log('');
    console.log(styleText('red', `File errors (${copyResult.errors.length}):`));
    for (const err of copyResult.errors) {
      console.log(styleText('red', `  - ${err}`));
    }
  }

  if (verifyErrors.length === 0) {
    console.log('');
    console.log(styleText('green', 'Installation verified successfully.'));
    console.log('');
    console.log('Get started:');
    console.log(`  ${styleText('cyan', '/motif:init')}    Initialize a design project`);
    console.log(`  ${styleText('cyan', '/motif:help')}    See all commands`);
  } else {
    console.log('');
    console.log(styleText('red', `Verification failed (${verifyErrors.length} errors):`));
    for (const err of verifyErrors) {
      console.log(styleText('red', `  - ${err}`));
    }
    process.exit(1);
  }

  console.log('');
}

// ─── Uninstall ──────────────────────────────────────────────────

function cleanEmptyDirs(dir) {
  if (!fs.existsSync(dir)) return;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      cleanEmptyDirs(path.join(dir, entry.name));
    }
  }

  // Re-read after recursive cleanup (children may have been removed)
  const remaining = fs.readdirSync(dir);
  if (remaining.length === 0) {
    fs.rmdirSync(dir);
  }
}

function removeConfigSnippet() {
  const cwd = process.cwd();
  const START = '<!-- MOTIF-START -->';
  const END = '<!-- MOTIF-END -->';

  // Check both possible locations
  const candidates = [
    path.join(cwd, 'CLAUDE.md'),
    path.join(cwd, '.claude', 'CLAUDE.md'),
  ];

  for (const configPath of candidates) {
    if (!fs.existsSync(configPath)) continue;

    let content = fs.readFileSync(configPath, 'utf8');
    if (!content.includes(START) || !content.includes(END)) continue;

    const regex = new RegExp(
      `${escapeRegex(START)}[\\s\\S]*?${escapeRegex(END)}`,
      'g'
    );
    content = content.replace(regex, '');

    // Clean up extra blank lines (3+ consecutive newlines -> 2)
    content = content.replace(/\n{3,}/g, '\n\n');
    content = content.trim();

    if (content.length === 0) {
      fs.unlinkSync(configPath);
    } else {
      fs.writeFileSync(configPath, content + '\n', 'utf8');
    }
  }
}

function uninstall(flags) {
  const cwd = process.cwd();
  const manifestPath = path.join(cwd, '.motif-manifest.json');

  if (!fs.existsSync(manifestPath)) {
    console.error(styleText('red', 'No Motif installation found (missing .motif-manifest.json)'));
    process.exit(1);
  }

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  let removedCount = 0;

  // 1. Remove installed files (skip CLAUDE.md -- handled separately via sentinel removal)
  const claudeMdPaths = ['CLAUDE.md', path.join('.claude', 'CLAUDE.md')];

  for (const filePath of Object.keys(manifest.files)) {
    // Skip CLAUDE.md -- sentinel block removal handles it in step 3
    if (claudeMdPaths.includes(filePath)) continue;

    const fullPath = path.join(cwd, filePath);

    // Validate path is within project root
    const resolved = path.resolve(fullPath);
    if (!resolved.startsWith(cwd + path.sep) && resolved !== cwd) {
      console.error(styleText('red', `Path traversal detected: ${resolved}`));
      continue;
    }

    if (!fs.existsSync(fullPath)) continue;

    if (flags['dry-run']) {
      console.log(`  Would remove: ${filePath}`);
      removedCount++;
      continue;
    }

    fs.unlinkSync(fullPath);
    removedCount++;
  }

  if (flags['dry-run']) {
    console.log(`  Would remove: CLAUDE.md sentinel block`);
    console.log(`  Would remove: .motif-manifest.json`);
    const backupDir = path.join(cwd, '.motif-backup');
    if (fs.existsSync(backupDir)) {
      console.log(`  Would remove: .motif-backup/`);
    }
    console.log('');
    console.log(`Dry run complete. Would remove ${removedCount} files.`);
    process.exit(0);
  }

  // 2. Clean up empty directories
  const getMotifDir = path.join(cwd, '.claude', 'get-motif');
  const commandsMotifDir = path.join(cwd, '.claude', 'commands', 'motif');
  cleanEmptyDirs(getMotifDir);
  cleanEmptyDirs(commandsMotifDir);

  // 3. Remove CLAUDE.md sentinel block
  removeConfigSnippet();

  // 4. Remove manifest
  fs.unlinkSync(manifestPath);

  // 5. Remove .motif-backup/ if it exists
  const backupDir = path.join(cwd, '.motif-backup');
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true });
  }

  console.log(styleText('green', `Motif uninstalled successfully. Removed ${removedCount} files.`));
}

// ─── Main ──────────────────────────────────────────────────────

const flags = parseFlags();

if (flags.help) {
  printHelp();
  process.exit(0);
}

if (flags.uninstall) {
  uninstall(flags);
  process.exit(0);
}

const runtime = detectRuntime(flags);
const mapping = resolveMapping(runtime);

// Load existing manifest for upgrade tracking (re-install detection)
const manifestPath = path.join(process.cwd(), '.motif-manifest.json');
let existingManifest = null;
if (fs.existsSync(manifestPath)) {
  try {
    existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (_) {
    // Corrupted manifest -- treat as fresh install (will back up all existing files)
    existingManifest = null;
  }
}

const copyResult = copyFiles(mapping, existingManifest, flags);
const injectResult = injectConfig(mapping, flags);

if (!flags['dry-run']) {
  writeManifest(mapping, copyResult, flags);
}

const verifyErrors = flags['dry-run'] ? [] : verify(mapping);
printSummary(copyResult, injectResult, verifyErrors);
