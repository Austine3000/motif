#!/usr/bin/env node
'use strict';

/**
 * Compose Validator (VALID-01)
 *
 * Usage: node scripts/compose-validator.js --screen <name> --files <f1> <f2> ...
 *        [--scan-dir <dir>]  (default: .planning/design)
 *
 * Validates decomposed compose output:
 * 1. Import cycle detection (ERROR -- blocks commit)
 * 2. Naming conflict detection (ERROR -- blocks commit, brownfield only)
 * 3. Missing prop warnings (WARN -- does not block, brownfield only)
 *
 * Outputs JSON result to stdout.
 * Exit code 0 = pass or warn-only, exit code 1 = errors found.
 *
 * Zero external dependencies -- pure Node.js.
 */

const fs = require('node:fs');
const path = require('node:path');
const { execSync } = require('node:child_process');

// ---------------------------------------------------------------------------
// CLI Argument Parsing
// ---------------------------------------------------------------------------

function parseArgs(argv) {
  const args = argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node scripts/compose-validator.js --screen <name> --files <f1> <f2> ... [--scan-dir <dir>]');
    console.log('');
    console.log('Validates decomposed compose output for import cycles, naming conflicts,');
    console.log('and missing props. Outputs JSON result to stdout.');
    console.log('');
    console.log('Options:');
    console.log('  --screen <name>     Screen name (for reporting)');
    console.log('  --files <f1> <f2>   List of generated file paths');
    console.log('  --scan-dir <dir>    Directory containing PROJECT-SCAN.md (default: .planning/design)');
    console.log('  --help, -h          Show this help message');
    process.exit(0);
  }

  let screen = null;
  const files = [];
  let scanDir = '.planning/design';
  let mode = null;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--screen' && args[i + 1]) {
      screen = args[i + 1];
      i++;
    } else if (args[i] === '--scan-dir' && args[i + 1]) {
      scanDir = args[i + 1];
      i++;
    } else if (args[i] === '--files') {
      mode = 'files';
    } else if (mode === 'files' && !args[i].startsWith('--')) {
      files.push(path.resolve(args[i]));
    } else if (args[i].startsWith('--')) {
      mode = null;
    }
  }

  if (!screen) {
    console.error('Error: --screen is required');
    process.exit(1);
  }
  if (files.length === 0) {
    console.error('Error: --files requires at least one file path');
    process.exit(1);
  }

  return { screen, files, scanDir: path.resolve(scanDir) };
}

// ---------------------------------------------------------------------------
// 1. Import Cycle Detection
// ---------------------------------------------------------------------------

function extractLocalImports(filePath, generatedFileSet) {
  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return [];
  }

  const imports = [];
  const importPattern = /import\s+(?:\{[^}]+\}|\w+)\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importPattern.exec(content)) !== null) {
    const importPath = match[1];
    if (!importPath.startsWith('.') && !importPath.startsWith('@/')) continue;

    // Resolve relative imports against the file's directory
    const dir = path.dirname(filePath);
    let resolved;
    if (importPath.startsWith('@/')) {
      resolved = path.resolve(importPath.replace(/^@\//, './'));
    } else {
      resolved = path.resolve(dir, importPath);
    }

    // Try common extensions if no extension specified
    const candidates = [resolved];
    if (!path.extname(resolved)) {
      candidates.push(resolved + '.tsx', resolved + '.ts', resolved + '.jsx', resolved + '.js');
    }

    for (const candidate of candidates) {
      if (generatedFileSet.has(candidate)) {
        imports.push(candidate);
        break;
      }
    }
  }

  return imports;
}

function detectCycles(adjacencyList) {
  const visited = new Set();
  const recursionStack = new Set();
  const cycles = [];

  function dfs(node, trail) {
    visited.add(node);
    recursionStack.add(node);
    trail.push(node);

    const neighbors = adjacencyList.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        dfs(neighbor, trail);
      } else if (recursionStack.has(neighbor)) {
        const cycleStart = trail.indexOf(neighbor);
        cycles.push(trail.slice(cycleStart).concat(neighbor));
      }
    }

    trail.pop();
    recursionStack.delete(node);
  }

  for (const node of adjacencyList.keys()) {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  }

  return cycles;
}

function checkImportCycles(files) {
  const errors = [];
  const fileSet = new Set(files);
  const adjacencyList = new Map();

  for (const file of files) {
    const imports = extractLocalImports(file, fileSet);
    adjacencyList.set(file, imports);
  }

  const cycles = detectCycles(adjacencyList);

  for (const cycle of cycles) {
    const names = cycle.map(f => path.basename(f));
    errors.push({
      type: 'import-cycle',
      detail: names.join(' -> '),
      severity: 'error',
    });
  }

  return errors;
}

// ---------------------------------------------------------------------------
// 2. Naming Conflict Detection (brownfield only)
// ---------------------------------------------------------------------------

function checkNamingConflicts(files, scanDir) {
  const errors = [];
  const projectScanPath = path.join(scanDir, 'PROJECT-SCAN.md');

  if (!fs.existsSync(projectScanPath)) return errors;

  // Run git status once and parse output
  let gitOutput;
  try {
    gitOutput = execSync('git status --porcelain', { encoding: 'utf8' });
  } catch (e) {
    return errors;
  }

  const statusMap = new Map();
  for (const line of gitOutput.split('\n')) {
    if (!line.trim()) continue;
    const status = line.substring(0, 2).trim();
    const filePath = path.resolve(line.substring(3).trim());
    statusMap.set(filePath, status);
  }

  for (const file of files) {
    // Skip files in .planning/ -- greenfield output path
    const rel = path.relative(process.cwd(), file);
    if (rel.startsWith('.planning')) continue;

    const status = statusMap.get(file);
    if (status === 'M' || status === 'MM') {
      errors.push({
        type: 'naming-conflict',
        detail: `${path.basename(file)} overwrites existing project file: ${rel}`,
        severity: 'error',
      });
    }
  }

  return errors;
}

// ---------------------------------------------------------------------------
// 3. Missing Prop Detection (brownfield only)
// ---------------------------------------------------------------------------

function parsePropsFromScan(scanDir) {
  const scanPath = path.join(scanDir, 'PROJECT-SCAN.md');
  if (!fs.existsSync(scanPath)) return new Map();

  let content;
  try {
    content = fs.readFileSync(scanPath, 'utf8');
  } catch (e) {
    return new Map();
  }

  const propsMap = new Map();
  const lines = content.split('\n');
  let inPropsSection = false;

  for (const line of lines) {
    if (line.startsWith('## Props Summary')) {
      inPropsSection = true;
      continue;
    }
    if (inPropsSection && line.startsWith('## ')) {
      break;
    }
    if (!inPropsSection || !line.startsWith('|') || line.includes('---')) continue;
    if (line.includes('Component') && line.includes('Props')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 2) {
      const name = cells[0];
      const props = cells[1].split(',').map(p => p.trim()).filter(Boolean);
      if (name && name !== '...') {
        propsMap.set(name, new Set(props));
      }
    }
  }

  return propsMap;
}

function parseExistingComponents(scanDir) {
  const gapPath = path.join(scanDir, 'COMPONENT-GAP.md');
  if (!fs.existsSync(gapPath)) return new Set();

  let content;
  try {
    content = fs.readFileSync(gapPath, 'utf8');
  } catch (e) {
    return new Set();
  }

  const components = new Set();
  const lines = content.split('\n');
  let inTable = false;

  for (const line of lines) {
    if (line.includes('Existing') || line.includes('Partial Match')) {
      inTable = true;
      continue;
    }
    if (inTable && (line.startsWith('## ') || line.startsWith('### '))) {
      inTable = false;
      continue;
    }
    if (!inTable || !line.startsWith('|') || line.includes('---')) continue;
    if (line.includes('Component') && line.includes('Path')) continue;

    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 1 && cells[0] !== '...') {
      components.add(cells[0]);
    }
  }

  return components;
}

function checkMissingProps(files, scanDir) {
  const warnings = [];
  const gapPath = path.join(scanDir, 'COMPONENT-GAP.md');
  if (!fs.existsSync(gapPath)) return warnings;

  const existingComponents = parseExistingComponents(scanDir);
  if (existingComponents.size === 0) return warnings;

  const propsMap = parsePropsFromScan(scanDir);
  if (propsMap.size === 0) return warnings;

  for (const file of files) {
    let content;
    try {
      content = fs.readFileSync(file, 'utf8');
    } catch (e) {
      continue;
    }

    for (const compName of existingComponents) {
      // Find JSX usage: <ComponentName followed by space, / or >
      const usagePattern = new RegExp('<' + compName + '[\\s/>]', 'g');
      if (!usagePattern.test(content)) continue;

      // Extract props from JSX usage
      const jsxPattern = new RegExp('<' + compName + '\\s+([^>]*?)\\s*/?>', 'g');
      let jsxMatch;
      while ((jsxMatch = jsxPattern.exec(content)) !== null) {
        const propsStr = jsxMatch[1];
        const propNames = [];
        const propPattern = /(\w+)\s*=/g;
        let propMatch;
        while ((propMatch = propPattern.exec(propsStr)) !== null) {
          propNames.push(propMatch[1]);
        }

        const knownProps = propsMap.get(compName);
        if (!knownProps) continue;

        for (const prop of propNames) {
          if (!knownProps.has(prop)) {
            warnings.push({
              type: 'missing-prop',
              detail: `${compName}: '${prop}' prop not found in scanned props (used in ${path.basename(file)})`,
              severity: 'warn',
            });
          }
        }
      }
    }
  }

  return warnings;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function main() {
  const { screen, files, scanDir } = parseArgs(process.argv);

  const errors = [];
  const warnings = [];

  // 1. Import cycle detection (always runs)
  errors.push(...checkImportCycles(files));

  // 2. Naming conflict detection (brownfield only)
  errors.push(...checkNamingConflicts(files, scanDir));

  // 3. Missing prop detection (brownfield only)
  warnings.push(...checkMissingProps(files, scanDir));

  // Determine status
  let status = 'pass';
  if (errors.length > 0) status = 'fail';
  else if (warnings.length > 0) status = 'warn';

  const result = { status, screen, errors, warnings };
  console.log(JSON.stringify(result, null, 2));

  process.exit(status === 'fail' ? 1 : 0);
}

main();
