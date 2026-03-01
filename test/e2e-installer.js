#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');
const { createHash } = require('node:crypto');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const INSTALLER = path.join(PROJECT_ROOT, 'bin', 'install.js');

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

function runInstaller(tmpDir, args = '') {
  return execSync(`node ${INSTALLER} ${args}`, {
    cwd: tmpDir,
    encoding: 'utf8',
    timeout: 30000,
  });
}

function hashFileSha256(filePath) {
  const content = fs.readFileSync(filePath);
  return createHash('sha256').update(content).digest('hex');
}

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

function grepFiles(dir, pattern) {
  const matches = [];
  const files = walkFiles(dir);
  for (const file of files) {
    if (path.extname(file) !== '.md') continue;
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes(pattern)) {
      matches.push(path.relative(dir, file));
    }
  }
  return matches;
}

// Create temp directory
const tmpBase = fs.mkdtempSync(path.join('/tmp', 'motif-e2e-'));
console.log(`\nTest directory: ${tmpBase}\n`);

let keepTmpDir = false;

try {
  // ═══════════════════════════════════════════════════════════════
  // TEST 1: Fresh install
  // ═══════════════════════════════════════════════════════════════
  console.log('━'.repeat(60));
  console.log('TEST 1: Fresh install');
  console.log('━'.repeat(60));

  // Create .claude/ subdirectory (simulates Claude Code project)
  fs.mkdirSync(path.join(tmpBase, '.claude'), { recursive: true });

  // Run installer
  const installOutput = runInstaller(tmpBase);
  console.log('  Install output:');
  installOutput.split('\n').forEach(line => {
    if (line.trim()) console.log(`    ${line}`);
  });

  // Assert directories exist
  const expectedDirs = [
    '.claude/get-motif/references/',
    '.claude/get-motif/workflows/',
    '.claude/get-motif/templates/',
    '.claude/get-motif/agents/',
    '.claude/commands/motif/',
  ];

  for (const dir of expectedDirs) {
    assert(fs.existsSync(path.join(tmpBase, dir)), `Directory exists: ${dir}`);
  }

  // Assert specific files exist
  const expectedFiles = [
    '.claude/get-motif/references/state-machine.md',
    '.claude/get-motif/references/verticals/fintech.md',
    '.claude/get-motif/workflows/research.md',
    '.claude/get-motif/agents/forge-researcher.md',
    '.claude/commands/motif/init.md',
    '.claude/get-motif/templates/STATE-TEMPLATE.md',
    '.claude/get-motif/templates/token-showcase-template.html',
    'CLAUDE.md',
    '.motif-manifest.json',
  ];

  for (const file of expectedFiles) {
    assert(fs.existsSync(path.join(tmpBase, file)), `File exists: ${file}`);
  }

  const test1Pass = testResults.every(r => r.result === 'PASS');
  console.log(`\n  Test 1 result: ${test1Pass ? 'PASS' : 'FAIL'}\n`);

  // ═══════════════════════════════════════════════════════════════
  // TEST 2: Path resolution verification
  // ═══════════════════════════════════════════════════════════════
  console.log('━'.repeat(60));
  console.log('TEST 2: Path resolution verification');
  console.log('━'.repeat(60));

  const test2StartIdx = testResults.length;

  // Grep for {FORGE_ROOT} in all .md files
  const forgeRootMatches1 = grepFiles(path.join(tmpBase, '.claude', 'get-motif'), '{FORGE_ROOT}');
  const forgeRootMatches2 = grepFiles(path.join(tmpBase, '.claude', 'commands', 'motif'), '{FORGE_ROOT}');
  const allForgeRootMatches = [...forgeRootMatches1, ...forgeRootMatches2];

  assert(allForgeRootMatches.length === 0, `Zero {FORGE_ROOT} occurrences (found: ${allForgeRootMatches.length})`);
  if (allForgeRootMatches.length > 0) {
    console.log(`    Files with {FORGE_ROOT}: ${allForgeRootMatches.join(', ')}`);
  }

  // Grep for .claude/get-design-forge
  const oldPathMatches1 = grepFiles(path.join(tmpBase, '.claude', 'get-motif'), '.claude/get-design-forge');
  const oldPathMatches2 = grepFiles(path.join(tmpBase, '.claude', 'commands', 'motif'), '.claude/get-design-forge');
  const allOldPathMatches = [...oldPathMatches1, ...oldPathMatches2];

  assert(allOldPathMatches.length === 0, `Zero .claude/get-design-forge occurrences (found: ${allOldPathMatches.length})`);
  if (allOldPathMatches.length > 0) {
    console.log(`    Files with old path: ${allOldPathMatches.join(', ')}`);
  }

  // Spot-check: workflows/research.md contains .claude/get-motif
  const researchPath = path.join(tmpBase, '.claude', 'get-motif', 'workflows', 'research.md');
  if (fs.existsSync(researchPath)) {
    const researchContent = fs.readFileSync(researchPath, 'utf8');
    assert(researchContent.includes('.claude/get-motif'), 'research.md contains .claude/get-motif');
  } else {
    assert(false, 'research.md exists for spot-check');
  }

  // Spot-check: commands/motif/init.md contains .claude/get-motif
  const initPath = path.join(tmpBase, '.claude', 'commands', 'motif', 'init.md');
  if (fs.existsSync(initPath)) {
    const initContent = fs.readFileSync(initPath, 'utf8');
    assert(initContent.includes('.claude/get-motif'), 'init.md contains .claude/get-motif');
  } else {
    assert(false, 'init.md exists for spot-check');
  }

  const test2Pass = testResults.slice(test2StartIdx).every(r => r.result === 'PASS');
  console.log(`\n  Test 2 result: ${test2Pass ? 'PASS' : 'FAIL'}\n`);

  // ═══════════════════════════════════════════════════════════════
  // TEST 3: CLAUDE.md sentinel markers
  // ═══════════════════════════════════════════════════════════════
  console.log('━'.repeat(60));
  console.log('TEST 3: CLAUDE.md sentinel markers');
  console.log('━'.repeat(60));

  const test3StartIdx = testResults.length;
  const claudeMdPath = path.join(tmpBase, 'CLAUDE.md');
  const claudeContent = fs.readFileSync(claudeMdPath, 'utf8');

  assert(claudeContent.includes('<!-- MOTIF-START -->'), 'CLAUDE.md contains <!-- MOTIF-START -->');
  assert(claudeContent.includes('<!-- MOTIF-END -->'), 'CLAUDE.md contains <!-- MOTIF-END -->');

  const startIdx = claudeContent.indexOf('<!-- MOTIF-START -->');
  const endIdx = claudeContent.indexOf('<!-- MOTIF-END -->');
  assert(startIdx < endIdx, 'START appears before END');

  // Check snippet content is between markers
  const snippetPath = path.join(PROJECT_ROOT, 'runtimes', 'claude-code', 'CLAUDE-MD-SNIPPET.md');
  const snippetContent = fs.readFileSync(snippetPath, 'utf8');
  // The snippet content gets {FORGE_ROOT} resolved to .claude/get-motif
  const resolvedSnippet = snippetContent
    .replaceAll('{FORGE_ROOT}', '.claude/get-motif')
    .replaceAll('.claude/get-design-forge', '.claude/get-motif');
  const betweenMarkers = claudeContent.substring(
    startIdx + '<!-- MOTIF-START -->'.length + 1,
    endIdx - 1
  );
  assert(betweenMarkers.trim() === resolvedSnippet.trim(), 'Snippet content is between markers');

  const test3Pass = testResults.slice(test3StartIdx).every(r => r.result === 'PASS');
  console.log(`\n  Test 3 result: ${test3Pass ? 'PASS' : 'FAIL'}\n`);

  // ═══════════════════════════════════════════════════════════════
  // TEST 4: Manifest integrity
  // ═══════════════════════════════════════════════════════════════
  console.log('━'.repeat(60));
  console.log('TEST 4: Manifest integrity');
  console.log('━'.repeat(60));

  const test4StartIdx = testResults.length;
  const manifestPath = path.join(tmpBase, '.motif-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  assert('version' in manifest, 'Manifest has version field');
  assert('runtime' in manifest, 'Manifest has runtime field');
  assert('installedAt' in manifest, 'Manifest has installedAt field');
  assert('files' in manifest, 'Manifest has files field');

  const manifestFiles = Object.keys(manifest.files);
  assert(manifestFiles.length > 0, `Manifest has file entries (count: ${manifestFiles.length})`);

  // Pick 3 random files and verify hashes
  const filesToCheck = manifestFiles
    .filter(f => f !== 'CLAUDE.md') // CLAUDE.md hash includes sentinel markers
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);

  for (const relFile of filesToCheck) {
    const fullPath = path.join(tmpBase, relFile);
    if (fs.existsSync(fullPath)) {
      const computed = hashFileSha256(fullPath);
      const expected = manifest.files[relFile].hash;
      assert(computed === expected, `Hash matches for ${relFile}`);
      if (computed !== expected) {
        console.log(`    Expected: ${expected}`);
        console.log(`    Got:      ${computed}`);
      }
    } else {
      assert(false, `File in manifest exists: ${relFile}`);
    }
  }

  const test4Pass = testResults.slice(test4StartIdx).every(r => r.result === 'PASS');
  console.log(`\n  Test 4 result: ${test4Pass ? 'PASS' : 'FAIL'}\n`);

  // ═══════════════════════════════════════════════════════════════
  // TEST 5: Re-install with backup
  // ═══════════════════════════════════════════════════════════════
  console.log('━'.repeat(60));
  console.log('TEST 5: Re-install with backup');
  console.log('━'.repeat(60));

  const test5StartIdx = testResults.length;

  // Modify one installed file
  const modifyPath = path.join(tmpBase, '.claude', 'get-motif', 'workflows', 'research.md');
  const originalContent = fs.readFileSync(modifyPath, 'utf8');
  fs.writeFileSync(modifyPath, originalContent + '\n<!-- user edit -->\n', 'utf8');

  // Run installer again
  const reinstallOutput = runInstaller(tmpBase);
  console.log('  Re-install output:');
  reinstallOutput.split('\n').forEach(line => {
    if (line.trim()) console.log(`    ${line}`);
  });

  // Assert backup directory was created
  const backupDir = path.join(tmpBase, '.motif-backup');
  assert(fs.existsSync(backupDir), '.motif-backup/ directory was created');

  // Assert backup contains timestamped copy
  if (fs.existsSync(backupDir)) {
    const backupFiles = fs.readdirSync(backupDir);
    const researchBackups = backupFiles.filter(f => f.startsWith('research.md.'));
    assert(researchBackups.length > 0, 'Backup contains timestamped copy of research.md');
  } else {
    assert(false, 'Backup contains timestamped copy of research.md');
  }

  // Assert installed file has been overwritten (no user edit)
  const afterReinstall = fs.readFileSync(modifyPath, 'utf8');
  assert(!afterReinstall.includes('<!-- user edit -->'), 'Installed file overwritten with fresh version (no user edit)');

  const test5Pass = testResults.slice(test5StartIdx).every(r => r.result === 'PASS');
  console.log(`\n  Test 5 result: ${test5Pass ? 'PASS' : 'FAIL'}\n`);

  // ═══════════════════════════════════════════════════════════════
  // TEST 6: Uninstall
  // ═══════════════════════════════════════════════════════════════
  console.log('━'.repeat(60));
  console.log('TEST 6: Uninstall');
  console.log('━'.repeat(60));

  const test6StartIdx = testResults.length;

  const uninstallOutput = runInstaller(tmpBase, '--uninstall');
  console.log('  Uninstall output:');
  uninstallOutput.split('\n').forEach(line => {
    if (line.trim()) console.log(`    ${line}`);
  });

  assert(!fs.existsSync(path.join(tmpBase, '.claude', 'get-motif')), '.claude/get-motif/ does not exist');
  assert(!fs.existsSync(path.join(tmpBase, '.claude', 'commands', 'motif')), '.claude/commands/motif/ does not exist');

  // CLAUDE.md either doesn't exist or doesn't have MOTIF-START
  const claudeAfterUninstall = path.join(tmpBase, 'CLAUDE.md');
  if (fs.existsSync(claudeAfterUninstall)) {
    const content = fs.readFileSync(claudeAfterUninstall, 'utf8');
    assert(!content.includes('<!-- MOTIF-START -->'), 'CLAUDE.md does not contain <!-- MOTIF-START -->');
  } else {
    assert(true, 'CLAUDE.md does not exist (removed because empty)');
  }

  assert(!fs.existsSync(path.join(tmpBase, '.motif-manifest.json')), '.motif-manifest.json does not exist');
  assert(fs.existsSync(path.join(tmpBase, '.claude')), '.claude/ directory still exists');

  const test6Pass = testResults.slice(test6StartIdx).every(r => r.result === 'PASS');
  console.log(`\n  Test 6 result: ${test6Pass ? 'PASS' : 'FAIL'}\n`);

  // ═══════════════════════════════════════════════════════════════
  // TEST 7: --dry-run
  // ═══════════════════════════════════════════════════════════════
  console.log('━'.repeat(60));
  console.log('TEST 7: --dry-run');
  console.log('━'.repeat(60));

  const test7StartIdx = testResults.length;

  const dryRunOutput = runInstaller(tmpBase, '--dry-run');
  console.log('  Dry-run output:');
  dryRunOutput.split('\n').forEach(line => {
    if (line.trim()) console.log(`    ${line}`);
  });

  // Assert no files were created
  assert(!fs.existsSync(path.join(tmpBase, '.claude', 'get-motif')), 'No .claude/get-motif/ created');
  assert(!fs.existsSync(path.join(tmpBase, '.motif-manifest.json')), 'No .motif-manifest.json created');

  // Assert output contains "Would copy:" messages
  assert(dryRunOutput.includes('Would copy:'), 'Output contains "Would copy:" messages');

  const test7Pass = testResults.slice(test7StartIdx).every(r => r.result === 'PASS');
  console.log(`\n  Test 7 result: ${test7Pass ? 'PASS' : 'FAIL'}\n`);

  // ═══════════════════════════════════════════════════════════════
  // FINAL SUMMARY
  // ═══════════════════════════════════════════════════════════════
  console.log('═'.repeat(60));
  const testCount = 7;
  const testsPassed = [test1Pass, test2Pass, test3Pass, test4Pass, test5Pass, test6Pass, test7Pass].filter(Boolean).length;
  console.log(`\n${testsPassed}/${testCount} tests passed\n`);

  if (testsPassed < testCount) {
    keepTmpDir = true;
    console.log(`Test directory preserved for debugging: ${tmpBase}`);
    const failedTests = testResults.filter(r => r.result === 'FAIL');
    console.log(`\nFailed assertions:`);
    for (const f of failedTests) {
      console.log(`  - ${f.label}`);
    }
  }

} catch (err) {
  console.error(`\nFATAL ERROR: ${err.message}`);
  if (err.stdout) console.error(`stdout: ${err.stdout}`);
  if (err.stderr) console.error(`stderr: ${err.stderr}`);
  keepTmpDir = true;
  console.log(`\nTest directory preserved for debugging: ${tmpBase}`);
  process.exit(1);
} finally {
  if (!keepTmpDir) {
    fs.rmSync(tmpBase, { recursive: true, force: true });
    console.log('Test directory cleaned up.');
  }
}
