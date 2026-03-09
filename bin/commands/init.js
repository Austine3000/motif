#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { parseArgs, styleText } = require('node:util');
const { createHash } = require('node:crypto');
const { findProjectRoot } = require('../lib/find-root.js');

// ─── Stage 1: Parse CLI flags ──────────────────────────────────

function parseFlags(args) {
  const { values } = parseArgs({
    args,
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
${styleText('bold', 'motif init')} - Install Motif into the current project

${styleText('bold', 'USAGE')}
  motif init [options]
  npx motif-design@latest [options]

${styleText('bold', 'OPTIONS')}
  -r, --runtime <name>   Override runtime auto-detection (supported: claude-code)
  -f, --force            Overwrite all files without backup checks
      --dry-run          Print what would happen without writing any files
      --uninstall        Remove Motif installation
  -h, --help             Show this help message

${styleText('bold', 'EXAMPLES')}
  motif init                              Auto-detect runtime and install
  motif init --runtime claude-code        Explicit runtime selection
  motif init --dry-run                    Preview installation without changes
  motif init --force                      Overwrite all existing files
  npx motif-design@latest                 Legacy one-shot install
`);
}

// ─── Stage 2: Detect runtime ───────────────────────────────────

function detectRuntime(flags, projectRoot) {
  const validRuntimes = ['claude-code'];

  if (flags.runtime) {
    if (!validRuntimes.includes(flags.runtime)) {
      console.error(styleText('red', `Unknown runtime: ${flags.runtime}`));
      console.error(`Supported runtimes: ${validRuntimes.join(', ')}`);
      process.exit(1);
    }
    return flags.runtime;
  }

  if (fs.existsSync(path.join(projectRoot, '.claude'))) return 'claude-code';

  console.error(styleText('red', 'Could not detect AI runtime.'));
  console.error('No .claude/ directory found. Create it or specify --runtime claude-code');
  process.exit(1);
}

// ─── Stage 3: Resolve source-to-target mapping ─────────────────

function resolveMapping(runtime, projectRoot) {
  const pkgDir = path.resolve(__dirname, '..', '..');

  if (runtime === 'claude-code') {
    const copies = [
      { src: path.join(pkgDir, 'core', 'references'), dest: path.join(projectRoot, '.claude', 'get-motif', 'references') },
      { src: path.join(pkgDir, 'core', 'workflows'), dest: path.join(projectRoot, '.claude', 'get-motif', 'workflows') },
      { src: path.join(pkgDir, 'core', 'templates'), dest: path.join(projectRoot, '.claude', 'get-motif', 'templates') },
      { src: path.join(pkgDir, 'runtimes', 'claude-code', 'agents'), dest: path.join(projectRoot, '.claude', 'get-motif', 'agents') },
      { src: path.join(pkgDir, 'runtimes', 'claude-code', 'commands', 'motif'), dest: path.join(projectRoot, '.claude', 'commands', 'motif') },
      { src: path.join(pkgDir, 'runtimes', 'claude-code', 'hooks'), dest: path.join(projectRoot, '.claude', 'get-motif', 'hooks') },
      { src: path.join(pkgDir, 'scripts'), dest: path.join(projectRoot, '.claude', 'get-motif', 'scripts') },
    ];

    return {
      motifRoot: '.claude/get-motif',
      copies,
      snippet: path.join(pkgDir, 'runtimes', 'claude-code', 'CLAUDE-MD-SNIPPET.md'),
      configTarget: path.join(projectRoot, 'CLAUDE.md'),
    };
  }
}

// ─── Stage 4: Copy files with {MOTIF_ROOT} resolution ──────────

function resolveContent(content, motifRoot) {
  return content
    .replaceAll('{MOTIF_ROOT}', motifRoot);
}

function shouldBackup(destPath, existingManifest, projectRoot) {
  if (!fs.existsSync(destPath)) return false;
  if (!existingManifest) return true; // No manifest = unknown state, back up to be safe

  const relPath = path.relative(projectRoot, destPath);
  const entry = existingManifest.files[relPath];
  if (!entry) return true; // File not in manifest = unknown, back up

  const currentHash = hashFile(destPath);
  // If current hash matches what we installed, user hasn't modified it -- safe to overwrite
  if (currentHash === entry.hash) return false;
  // User modified this file -- back up before overwriting
  return true;
}

function walkAndCopy(srcDir, destDir, motifRoot, existingManifest, flags, projectRoot) {
  const entries = fs.readdirSync(srcDir, { withFileTypes: true });
  const results = { copied: 0, skipped: 0, backedUp: 0, errors: [] };

  if (!flags['dry-run']) {
    fs.mkdirSync(destDir, { recursive: true });
  }

  for (const entry of entries) {
    if (entry.name === '.DS_Store' || entry.name.startsWith('.')) continue;

    const srcPath = path.join(srcDir, entry.name);
    const destPath = path.join(destDir, entry.name);

    if (entry.isDirectory()) {
      const subResult = walkAndCopy(srcPath, destPath, motifRoot, existingManifest, flags, projectRoot);
      results.copied += subResult.copied;
      results.skipped += subResult.skipped;
      results.backedUp += subResult.backedUp;
      results.errors.push(...subResult.errors);
      continue;
    }

    // Validate target path is within project root
    const resolved = path.resolve(destPath);
    if (!resolved.startsWith(projectRoot + path.sep) && resolved !== projectRoot) {
      console.error(styleText('red', `Path traversal detected: ${resolved}`));
      process.exit(1);
    }

    const relPath = path.relative(projectRoot, destPath);

    // Backup check for re-install (skip if --force)
    if (!flags.force && shouldBackup(destPath, existingManifest, projectRoot)) {
      if (flags['dry-run']) {
        console.log(`  Would back up: ${relPath}`);
      } else {
        const backupDir = path.join(projectRoot, '.motif-backup');
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

function copyFiles(mapping, existingManifest, flags, projectRoot) {
  const totals = { copied: 0, skipped: 0, backedUp: 0, errors: [] };

  if (flags['dry-run']) {
    console.log('');
    console.log(styleText('bold', 'Dry run — files that would be copied:'));
    console.log('');
  }

  for (const { src, dest } of mapping.copies) {
    if (!fs.existsSync(src)) {
      if (flags['dry-run']) {
        const pkgDir = path.resolve(__dirname, '..', '..');
        console.log(`  [skip] Source not found: ${path.relative(pkgDir, src)}`);
      }
      continue;
    }

    const result = walkAndCopy(src, dest, mapping.motifRoot, existingManifest, flags, projectRoot);
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

function injectConfig(mapping, flags, projectRoot) {
  const START = '<!-- MOTIF-START -->';
  const END = '<!-- MOTIF-END -->';

  const snippetContent = fs.readFileSync(mapping.snippet, 'utf8');
  const resolvedSnippet = resolveContent(snippetContent, mapping.motifRoot);
  const block = `${START}\n${resolvedSnippet}\n${END}`;

  // Determine config target path
  let configPath = mapping.configTarget;
  const altPath = path.join(projectRoot, '.claude', 'CLAUDE.md');

  if (!fs.existsSync(configPath) && fs.existsSync(altPath)) {
    configPath = altPath;
  }

  if (flags['dry-run']) {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, 'utf8');
      if (content.includes(START) && content.includes(END)) {
        console.log(`  Would replace: Motif config in ${path.relative(projectRoot, configPath)}`);
        return { action: 'replaced', path: configPath };
      }
      console.log(`  Would append: Motif config to ${path.relative(projectRoot, configPath)}`);
      return { action: 'appended', path: configPath };
    }
    console.log(`  Would create: ${path.relative(projectRoot, configPath)}`);
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

// ─── Stage 5b: Inject hook settings into .claude/settings.json ──

function injectHookSettings(mapping, flags, projectRoot) {
  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
  let settings = {};

  // Load existing settings if present
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    } catch (_) {
      // Corrupted settings -- start fresh for hooks section
      settings = {};
    }
  }

  if (flags['dry-run']) {
    const hasMotifHooks = settings.hooks?.PostToolUse?.some(
      g => g.matcher === 'Write|Edit' && g.hooks?.some(h => h.command?.includes('motif'))
    );
    if (hasMotifHooks) {
      console.log('  Would update: Motif hooks in .claude/settings.json');
    } else {
      console.log('  Would add: Motif hooks to .claude/settings.json');
    }
    return;
  }

  // Ensure hooks structure exists
  if (!settings.hooks) settings.hooks = {};
  if (!settings.hooks.PostToolUse) settings.hooks.PostToolUse = [];

  // Remove existing Motif matcher group (for idempotent re-install)
  settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(
    g => !(g.matcher === 'Write|Edit' && g.hooks?.some(h => h.command?.includes('motif')))
  );

  // Add Motif PostToolUse hooks
  settings.hooks.PostToolUse.push({
    matcher: 'Write|Edit',
    hooks: [
      { type: 'command', command: 'node "$CLAUDE_PROJECT_DIR"/.claude/get-motif/hooks/motif-token-check.js' },
      { type: 'command', command: 'node "$CLAUDE_PROJECT_DIR"/.claude/get-motif/hooks/motif-font-check.js' },
      { type: 'command', command: 'node "$CLAUDE_PROJECT_DIR"/.claude/get-motif/hooks/motif-aria-check.js' },
    ],
  });

  // Ensure SessionStart hooks structure exists
  if (!settings.hooks.SessionStart) settings.hooks.SessionStart = [];

  // Remove existing Motif SessionStart matcher group (idempotent re-install)
  settings.hooks.SessionStart = settings.hooks.SessionStart.filter(
    g => !(g.matcher === 'startup|resume|clear|compact' && g.hooks?.some(h => h.command?.includes('motif')))
  );

  // Add Motif SessionStart hooks
  settings.hooks.SessionStart.push({
    matcher: 'startup|resume|clear|compact',
    hooks: [
      { type: 'command', command: 'node "$CLAUDE_PROJECT_DIR"/.claude/get-motif/hooks/motif-session-start.js' },
    ],
  });

  // Add or update statusLine (Motif context monitor)
  settings.statusLine = {
    type: 'command',
    command: 'node "$CLAUDE_PROJECT_DIR"/.claude/get-motif/hooks/motif-context-monitor.js',
  };

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
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

function writeManifest(mapping, copyResult, flags, projectRoot) {
  if (flags['dry-run']) return;

  const pkgDir = path.resolve(__dirname, '..', '..');
  const pkgJson = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8'));
  const manifest = {
    version: pkgJson.version,
    runtime: 'claude-code',
    installedAt: new Date().toISOString(),
    files: {},
  };

  // Walk all installed destination directories
  for (const { src, dest } of mapping.copies) {
    if (!fs.existsSync(dest)) continue;
    const files = walkFiles(dest);
    for (const file of files) {
      const relPath = path.relative(projectRoot, file);
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
  const altPath = path.join(projectRoot, '.claude', 'CLAUDE.md');
  const actualConfig = fs.existsSync(configPath) ? configPath : (fs.existsSync(altPath) ? altPath : null);
  if (actualConfig) {
    manifest.files[path.relative(projectRoot, actualConfig)] = {
      hash: hashFile(actualConfig),
      source: path.relative(pkgDir, mapping.snippet),
    };
  }

  const manifestPath = path.join(projectRoot, '.motif-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
}

// ─── Stage 8: Post-install verification ────────────────────────

function verify(mapping, projectRoot) {
  const errors = [];

  // 1. Check expected directories exist
  for (const { dest } of mapping.copies) {
    const srcExists = mapping.copies.find(c => c.dest === dest);
    if (srcExists && fs.existsSync(srcExists.src) && !fs.existsSync(dest)) {
      errors.push(`Missing directory: ${path.relative(projectRoot, dest)}`);
    }
  }

  // 2. Check for unresolved {MOTIF_ROOT} in installed .md files
  const dirsToCheck = [
    path.join(projectRoot, '.claude', 'get-motif'),
    path.join(projectRoot, '.claude', 'commands', 'motif'),
  ];

  for (const dir of dirsToCheck) {
    if (!fs.existsSync(dir)) continue;
    const files = walkFiles(dir);
    for (const file of files) {
      if (path.extname(file) !== '.md') continue;
      const content = fs.readFileSync(file, 'utf8');
      if (content.includes('{MOTIF_ROOT}')) {
        errors.push(`Unresolved {MOTIF_ROOT} in: ${path.relative(projectRoot, file)}`);
      }
    }
  }

  // 3. Check CLAUDE.md has sentinel markers
  const configPath = mapping.configTarget;
  const altPath = path.join(projectRoot, '.claude', 'CLAUDE.md');
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
  if (!fs.existsSync(path.join(projectRoot, '.motif-manifest.json'))) {
    errors.push('Manifest file not written');
  }

  // 5. Check settings.json has hook configuration
  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');
  if (fs.existsSync(settingsPath)) {
    try {
      const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
      if (!settings.hooks?.PostToolUse?.some(g => g.hooks?.some(h => h.command?.includes('motif')))) {
        errors.push('settings.json missing Motif PostToolUse hooks');
      }
      if (!settings.statusLine?.command?.includes('motif')) {
        errors.push('settings.json missing Motif statusLine');
      }
    } catch (_) {
      errors.push('settings.json is not valid JSON');
    }
  } else {
    errors.push('.claude/settings.json not found after installation');
  }

  return errors;
}

// ─── Stage 9: Print summary ───────────────────────────────────

function printSummary(copyResult, injectResult, verifyErrors, projectRoot) {
  console.log('');
  console.log(styleText('bold', 'Motif Installation Summary'));
  console.log('\u2500'.repeat(40));
  console.log(`  Files copied:    ${copyResult.copied}`);
  console.log(`  Files backed up: ${copyResult.backedUp}`);
  console.log(`  Files skipped:   ${copyResult.skipped}`);
  console.log(`  Config:          ${injectResult.action} (${path.relative(projectRoot, injectResult.path)})`);

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

function removeHookSettings(flags, projectRoot) {
  const settingsPath = path.join(projectRoot, '.claude', 'settings.json');

  if (!fs.existsSync(settingsPath)) return;

  let settings;
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch (_) {
    return; // Can't parse, leave it alone
  }

  if (flags['dry-run']) {
    console.log('  Would remove: Motif hooks from .claude/settings.json');
    return;
  }

  // Remove Motif PostToolUse matcher group
  if (settings.hooks?.PostToolUse) {
    settings.hooks.PostToolUse = settings.hooks.PostToolUse.filter(
      g => !(g.matcher === 'Write|Edit' && g.hooks?.some(h => h.command?.includes('motif')))
    );
    // Clean up empty arrays
    if (settings.hooks.PostToolUse.length === 0) delete settings.hooks.PostToolUse;
  }

  // Remove Motif SessionStart matcher group
  if (settings.hooks?.SessionStart) {
    settings.hooks.SessionStart = settings.hooks.SessionStart.filter(
      g => !(g.matcher === 'startup|resume|clear|compact' && g.hooks?.some(h => h.command?.includes('motif')))
    );
    if (settings.hooks.SessionStart.length === 0) delete settings.hooks.SessionStart;
  }

  // Clean up empty hooks object
  if (settings.hooks && Object.keys(settings.hooks).length === 0) delete settings.hooks;

  // Remove Motif statusLine (only if it's the Motif one)
  if (settings.statusLine?.command?.includes('motif')) {
    delete settings.statusLine;
  }

  // If settings is now empty, delete the file
  if (Object.keys(settings).length === 0) {
    fs.unlinkSync(settingsPath);
  } else {
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  }
}

function removeConfigSnippet(projectRoot) {
  const START = '<!-- MOTIF-START -->';
  const END = '<!-- MOTIF-END -->';

  // Check both possible locations
  const candidates = [
    path.join(projectRoot, 'CLAUDE.md'),
    path.join(projectRoot, '.claude', 'CLAUDE.md'),
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

function uninstall(flags, projectRoot) {
  const manifestPath = path.join(projectRoot, '.motif-manifest.json');

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

    const fullPath = path.join(projectRoot, filePath);

    // Validate path is within project root
    const resolved = path.resolve(fullPath);
    if (!resolved.startsWith(projectRoot + path.sep) && resolved !== projectRoot) {
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
    console.log(`  Would remove: Motif hooks from .claude/settings.json`);
    console.log(`  Would remove: CLAUDE.md sentinel block`);
    console.log(`  Would remove: .motif-manifest.json`);
    const backupDir = path.join(projectRoot, '.motif-backup');
    if (fs.existsSync(backupDir)) {
      console.log(`  Would remove: .motif-backup/`);
    }
    console.log('');
    console.log(`Dry run complete. Would remove ${removedCount} files.`);
    process.exit(0);
  }

  // 2. Clean up empty directories
  const getMotifDir = path.join(projectRoot, '.claude', 'get-motif');
  const commandsMotifDir = path.join(projectRoot, '.claude', 'commands', 'motif');
  cleanEmptyDirs(getMotifDir);
  cleanEmptyDirs(commandsMotifDir);

  // 2.5 Remove hook settings from settings.json
  removeHookSettings(flags, projectRoot);

  // 3. Remove CLAUDE.md sentinel block
  removeConfigSnippet(projectRoot);

  // 4. Remove manifest
  fs.unlinkSync(manifestPath);

  // 5. Remove .motif-backup/ if it exists
  const backupDir = path.join(projectRoot, '.motif-backup');
  if (fs.existsSync(backupDir)) {
    fs.rmSync(backupDir, { recursive: true });
  }

  console.log(styleText('green', `Motif uninstalled successfully. Removed ${removedCount} files.`));
}

// ─── Main: run(args) ────────────────────────────────────────────

function run(args) {
  const flags = parseFlags(args);

  if (flags.help) {
    printHelp();
    process.exit(0);
  }

  // Detect project root
  const projectRoot = findProjectRoot(process.cwd());
  if (!projectRoot) {
    console.error(styleText('red', 'Not inside a project directory.'));
    console.error('Run this command from a directory that contains .git/ or package.json');
    process.exit(1);
  }

  if (projectRoot !== process.cwd()) {
    console.log(styleText('cyan', `Installing to project root: ${projectRoot}`));
  }

  if (flags.uninstall) {
    uninstall(flags, projectRoot);
    process.exit(0);
  }

  const runtime = detectRuntime(flags, projectRoot);
  const mapping = resolveMapping(runtime, projectRoot);

  // Read current package version
  const pkgDir = path.resolve(__dirname, '..', '..');
  const currentVersion = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json'), 'utf8')).version;

  // Load existing manifest for upgrade tracking (re-install detection)
  const manifestPath = path.join(projectRoot, '.motif-manifest.json');
  let existingManifest = null;
  if (fs.existsSync(manifestPath)) {
    try {
      existingManifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    } catch (_) {
      // Corrupted manifest -- treat as fresh install (will back up all existing files)
      existingManifest = null;
    }
  }

  // Detect install type: fresh install vs upgrade vs re-install
  if (existingManifest) {
    const prevVersion = existingManifest.version;
    if (prevVersion !== currentVersion) {
      console.log('');
      console.log(styleText('cyan', `Upgrading Motif: ${prevVersion} \u2192 ${currentVersion}`));
      console.log('Modified files will be backed up to .motif-backup/');
    } else {
      console.log('');
      console.log(styleText('cyan', `Re-installing Motif v${currentVersion}`));
    }
  } else {
    console.log('');
    console.log(styleText('cyan', `Installing Motif v${currentVersion}`));
  }

  const copyResult = copyFiles(mapping, existingManifest, flags, projectRoot);
  const injectResult = injectConfig(mapping, flags, projectRoot);
  injectHookSettings(mapping, flags, projectRoot);

  if (!flags['dry-run']) {
    writeManifest(mapping, copyResult, flags, projectRoot);
  }

  const verifyErrors = flags['dry-run'] ? [] : verify(mapping, projectRoot);
  printSummary(copyResult, injectResult, verifyErrors, projectRoot);
}

module.exports = { run };
