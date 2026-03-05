#!/usr/bin/env node
'use strict';

/**
 * Project Scanner (SCAN-01)
 *
 * Usage: node scripts/project-scanner.js [project-root] [--output-dir <dir>]
 * Defaults to cwd if no project-root provided.
 * Defaults to project-root for output-dir.
 *
 * Scans a project to detect framework, CSS approach, directory structure,
 * components, and conventions. Outputs PROJECT-SCAN.md and CONVENTIONS.md.
 *
 * Zero external dependencies -- pure Node.js.
 */

const fs = require('node:fs');
const path = require('node:path');

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SKIP_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.nuxt', '.output',
  '.svelte-kit', 'coverage', '.cache', '.turbo', '.vercel',
  '__pycache__', '.pytest_cache', 'vendor', '.bundle',
  '.planning', '.claude', '.motif-backup',
]);

const TEXT_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
]);

const ALL_TEXT_EXTENSIONS = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.vue', '.svelte',
  '.css', '.scss', '.less', '.sass',
  '.json', '.md', '.html', '.astro',
]);

const COMPONENT_PATTERNS = {
  react: [
    /export\s+default\s+function\s+([A-Z]\w+)/,
    /export\s+function\s+([A-Z]\w+)/,
    /export\s+const\s+([A-Z]\w+)\s*[=:]/,
    /(?:const|let|var)\s+([A-Z]\w+)\s*=\s*(?:\([^)]*\)|[^=])*=>/,
    /export\s+default\s+class\s+([A-Z]\w+)\s+extends\s+(?:React\.)?(?:Component|PureComponent)/,
    /class\s+([A-Z]\w+)\s+extends\s+(?:React\.)?(?:Component|PureComponent)/,
  ],
  vue: [],
  svelte: [],
};

const CONVENTION_PATTERNS = {
  borderRadius: {
    tailwind: /rounded-(\w+)/g,
    css: /border-radius:\s*([^;}\n]+)/g,
    cssVar: /var\(--radius-([^)]+)\)/g,
  },
  spacing: {
    tailwind: /(?:p|m|gap|space)-(\d+(?:\.5)?)/g,
    css: /(?:padding|margin|gap):\s*([^;}\n]+)/g,
  },
  shadows: {
    tailwind: /shadow-(\w+)/g,
    css: /box-shadow:\s*([^;}\n]+)/g,
  },
  colors: {
    tailwind: /(?:bg|text|border)-(\w+-\d+)/g,
    hex: /#[0-9a-fA-F]{3,8}/g,
    cssVar: /var\(--color-([^)]+)\)/g,
  },
  importStyle: {
    namedImport: /import\s*\{[^}]+\}\s*from/g,
    defaultImport: /import\s+\w+\s+from/g,
    barrelImport: /from\s+['"]\.\/(?:index)?['"]/g,
  },
  exportStyle: {
    namedExport: /export\s+(?:const|function|class)\s+/g,
    defaultExport: /export\s+default\s+/g,
  },
};

const PRIMITIVE_NAMES = new Set([
  'button', 'input', 'badge', 'label', 'icon', 'avatar', 'checkbox',
  'radio', 'switch', 'toggle', 'text', 'heading', 'link', 'image',
  'spinner', 'skeleton', 'divider', 'tooltip', 'tag', 'chip',
]);

const COMPOSITE_NAMES = new Set([
  'modal', 'card', 'dropdown', 'dialog', 'popover', 'menu', 'tabs',
  'accordion', 'table', 'list', 'form', 'select', 'combobox', 'datepicker',
  'toast', 'alert', 'banner', 'carousel', 'pagination', 'breadcrumb',
  'navbar', 'toolbar',
]);

const PAGE_NAMES = new Set([
  'dashboard', 'settings', 'profile', 'home', 'login', 'signup', 'register',
  'checkout', 'cart', 'search', 'admin', 'analytics', 'overview', 'detail',
]);

const LAYOUT_NAMES = new Set([
  'sidebar', 'header', 'footer', 'nav', 'navigation', 'layout', 'shell',
  'container', 'wrapper', 'page', 'appbar', 'topbar',
]);

const MAX_FILE_SIZE = 50 * 1024; // 50KB
const MAX_DEPTH = 10;
const MAX_TABLE_ROWS = 20;

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/project-scanner.js [project-root] [--output-dir <dir>]');
  console.log('');
  console.log('Scans a project to detect framework, CSS approach, directory structure,');
  console.log('components, and conventions. Outputs PROJECT-SCAN.md and CONVENTIONS.md.');
  console.log('');
  console.log('Options:');
  console.log('  --output-dir <dir>  Directory for output files (default: project-root)');
  console.log('  --help, -h          Show this help message');
  process.exit(0);
}

let projectRoot = process.cwd();
let outputDir = null;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--output-dir' && args[i + 1]) {
    outputDir = args[i + 1];
    i++;
  } else if (!args[i].startsWith('-')) {
    projectRoot = args[i];
  }
}

projectRoot = path.resolve(projectRoot);
outputDir = outputDir ? path.resolve(outputDir) : projectRoot;

if (!fs.existsSync(projectRoot)) {
  console.error(`Project root not found: ${projectRoot}`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Safely read a file as UTF-8. Returns null on any error.
 */
function safeReadFile(filePath) {
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > MAX_FILE_SIZE) return null;
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    return null;
  }
}

/**
 * Safely parse JSON from a file. Returns null on any error.
 */
function safeReadJSON(filePath) {
  const content = safeReadFile(filePath);
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch (e) {
    return null;
  }
}

/**
 * Walk project files with symlink protection and depth limiting.
 * Returns array of { relativePath, ext, size, lineCount }.
 */
function walkProject(dir, rootDir, results, depth, visited) {
  if (depth > MAX_DEPTH) return results;

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      // Symlink protection
      try {
        const lstat = fs.lstatSync(fullPath);
        if (lstat.isSymbolicLink()) continue;
        const realPath = fs.realpathSync(fullPath);
        if (visited.has(realPath)) continue;
        visited.add(realPath);
      } catch (e) {
        continue;
      }
      walkProject(fullPath, rootDir, results, depth + 1, visited);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (TEXT_EXTENSIONS.has(ext)) {
        try {
          const stat = fs.statSync(fullPath);
          if (stat.size > MAX_FILE_SIZE) continue;
          const content = fs.readFileSync(fullPath, 'utf8');
          const lineCount = content.split('\n').length;
          results.push({
            relativePath: path.relative(rootDir, fullPath),
            fullPath,
            ext,
            size: stat.size,
            lineCount,
            content,
          });
        } catch (e) {
          continue;
        }
      }
    }
  }

  return results;
}

/**
 * Find files matching a regex pattern, limited to a certain depth.
 */
function findFiles(dir, pattern, maxDepth, depth) {
  if (depth === undefined) depth = 0;
  if (depth > maxDepth) return [];

  const results = [];
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return results;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      try {
        const lstat = fs.lstatSync(fullPath);
        if (lstat.isSymbolicLink()) continue;
      } catch (e) {
        continue;
      }
      results.push(...findFiles(fullPath, pattern, maxDepth, depth + 1));
    } else if (entry.isFile() && pattern.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Walk directories for structure mapping (limited depth, counts files).
 */
function walkStructure(dir, rootDir, maxDepth, depth) {
  if (depth === undefined) depth = 0;
  if (depth > maxDepth) return null;

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    return null;
  }

  const node = {
    name: path.basename(dir),
    relativePath: path.relative(rootDir, dir),
    fileCount: 0,
    children: [],
  };

  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    if (SKIP_DIRS.has(entry.name)) continue;

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      try {
        const lstat = fs.lstatSync(fullPath);
        if (lstat.isSymbolicLink()) continue;
      } catch (e) {
        continue;
      }
      const child = walkStructure(fullPath, rootDir, maxDepth, depth + 1);
      if (child) node.children.push(child);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ALL_TEXT_EXTENSIONS.has(ext)) {
        node.fileCount++;
      }
    }
  }

  return node;
}

// ---------------------------------------------------------------------------
// Stage 1: Detect Framework
// ---------------------------------------------------------------------------

function detectFramework(projectRoot) {
  const pkg = safeReadJSON(path.join(projectRoot, 'package.json'));
  if (!pkg) return { name: 'unknown', version: null, confidence: 'LOW', language: 'javascript' };

  const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Detect language
  const hasTsConfig = fs.existsSync(path.join(projectRoot, 'tsconfig.json'));
  const language = hasTsConfig ? 'typescript' : 'javascript';

  // Check meta-frameworks before base frameworks
  const checks = [
    ['next', allDeps['next']],
    ['nuxt', allDeps['nuxt']],
    ['remix', allDeps['@remix-run/react']],
    ['astro', allDeps['astro']],
    ['svelte', allDeps['svelte']],
    ['vue', allDeps['vue']],
    ['react', allDeps['react']],
    ['angular', allDeps['@angular/core']],
  ];

  for (const [name, version] of checks) {
    if (version) {
      return { name, version, confidence: 'HIGH', language };
    }
  }

  // Has package.json but no recognized framework
  return { name: 'node', version: null, confidence: 'MEDIUM', language };
}

// ---------------------------------------------------------------------------
// Stage 2: Detect CSS Approach
// ---------------------------------------------------------------------------

function detectCSSApproach(projectRoot) {
  const results = [];
  const pkg = safeReadJSON(path.join(projectRoot, 'package.json'));
  const allDeps = pkg ? { ...pkg.dependencies, ...pkg.devDependencies } : {};

  // Tailwind
  const tailwindConfigs = [
    'tailwind.config.js', 'tailwind.config.ts', 'tailwind.config.mjs',
  ];
  const hasTailwindConfig = tailwindConfigs.some(f =>
    fs.existsSync(path.join(projectRoot, f))
  );
  if (hasTailwindConfig || allDeps['tailwindcss']) {
    results.push({ name: 'tailwind', confidence: 'HIGH' });
  }

  // CSS Modules
  const moduleFiles = findFiles(projectRoot, /\.module\.(css|scss|less)$/, 3);
  if (moduleFiles.length > 0) {
    results.push({ name: 'css-modules', confidence: 'HIGH', fileCount: moduleFiles.length });
  }

  // Styled Components / Emotion
  if (allDeps['styled-components']) {
    results.push({ name: 'styled-components', confidence: 'HIGH' });
  }
  if (allDeps['@emotion/react'] || allDeps['@emotion/styled']) {
    results.push({ name: 'emotion', confidence: 'HIGH' });
  }

  // Fallback
  if (results.length === 0) {
    results.push({ name: 'vanilla-css', confidence: 'MEDIUM' });
  }

  return results;
}

// ---------------------------------------------------------------------------
// Stage 3: Map Directory Structure
// ---------------------------------------------------------------------------

function mapDirectoryStructure(projectRoot) {
  // Check for known source directories
  const sourceDirs = ['src', 'app', 'lib', 'pages', 'components'];
  const found = [];

  for (const dir of sourceDirs) {
    const fullPath = path.join(projectRoot, dir);
    if (fs.existsSync(fullPath)) {
      try {
        const lstat = fs.lstatSync(fullPath);
        if (lstat.isDirectory() && !lstat.isSymbolicLink()) {
          const structure = walkStructure(fullPath, projectRoot, 3);
          if (structure) found.push(structure);
        }
      } catch (e) {
        // Skip
      }
    }
  }

  // Also check for scripts/ and other top-level directories
  const otherDirs = ['scripts', 'public', 'styles', 'assets', 'config'];
  for (const dir of otherDirs) {
    const fullPath = path.join(projectRoot, dir);
    if (fs.existsSync(fullPath)) {
      try {
        const lstat = fs.lstatSync(fullPath);
        if (lstat.isDirectory() && !lstat.isSymbolicLink()) {
          const structure = walkStructure(fullPath, projectRoot, 1);
          if (structure) found.push(structure);
        }
      } catch (e) {
        // Skip
      }
    }
  }

  return found;
}

// ---------------------------------------------------------------------------
// Stage 4: Catalog Components
// ---------------------------------------------------------------------------

function scoreComponentConfidence(relativePath, content) {
  let score = 0;

  // Directory heuristics
  if (/\/(components?|ui|widgets|elements|atoms|molecules)\//i.test(relativePath)) score += 30;
  if (/\/(pages?|views?|screens?|routes?)\//i.test(relativePath)) score += 20;
  if (/\/(layouts?|templates?)\//i.test(relativePath)) score += 20;

  // Export pattern
  if (COMPONENT_PATTERNS.react.some(p => p.test(content))) score += 25;

  // JSX presence
  if (/<[A-Z]/.test(content) || /return\s*\(?\s*</.test(content)) score += 20;

  // PascalCase filename
  const basename = path.basename(relativePath, path.extname(relativePath));
  if (/^[A-Z][a-zA-Z0-9]+$/.test(basename)) score += 15;

  // Negative signals
  if (/\.(test|spec|story|stories)\./i.test(relativePath)) score -= 50;
  if (/\/(test|__tests__|__mocks__|\.storybook)\//i.test(relativePath)) score -= 50;
  if (/\/(hooks?|utils?|helpers?|lib|services?|api)\//i.test(relativePath)) score -= 20;
  if (/^(index|types|utils|constants|config|helpers)$/i.test(basename)) score -= 20;

  if (score >= 50) return { confidence: 'HIGH', score };
  if (score >= 25) return { confidence: 'MEDIUM', score };
  return { confidence: 'LOW', score };
}

function extractComponentName(relativePath, content, framework) {
  const ext = path.extname(relativePath).toLowerCase();

  // Vue/Svelte: filename is component name
  if (ext === '.vue' || ext === '.svelte') {
    return path.basename(relativePath, ext);
  }

  // Try to extract from export patterns
  for (const pattern of COMPONENT_PATTERNS.react) {
    const match = content.match(pattern);
    if (match && match[1]) return match[1];
  }

  // Fallback to filename
  const basename = path.basename(relativePath, ext);
  if (/^[A-Z]/.test(basename)) return basename;

  return null;
}

function detectExportStyle(content) {
  if (/export\s+default\s+/.test(content)) return 'default';
  if (/export\s+(?:const|function|class)\s+/.test(content)) return 'named';
  return 'unknown';
}

function categorizeComponent(relativePath, lineCount, content, componentName) {
  const lowerName = (componentName || '').toLowerCase();
  const lowerPath = relativePath.toLowerCase();

  // Directory-based
  if (/\/(pages?|views?|screens?|routes?)\//i.test(lowerPath)) return 'page';
  if (/\/(layouts?)\//i.test(lowerPath)) return 'layout';
  if (/\/(components?\/ui|primitives?|atoms?)\//i.test(lowerPath)) return 'primitive';

  // Name-based
  if (PAGE_NAMES.has(lowerName)) return 'page';
  if (LAYOUT_NAMES.has(lowerName)) return 'layout';
  if (PRIMITIVE_NAMES.has(lowerName)) return 'primitive';
  if (COMPOSITE_NAMES.has(lowerName)) return 'composite';

  // Size-based
  if (lineCount < 30) return 'primitive';
  if (lineCount > 200) return 'page';

  // Import count heuristic
  const importCount = (content.match(/import\s+/g) || []).length;
  if (importCount > 5) return 'composite';

  return 'composite';
}

function extractProps(content, componentName) {
  const props = [];
  if (!componentName) return props;

  // Pattern 1: Destructured props
  const destructuredMatch = content.match(
    new RegExp(
      '(?:function\\s+' + escapeRegex(componentName) +
      '|const\\s+' + escapeRegex(componentName) +
      '\\s*[=:])\\s*\\(?\\s*\\{\\s*([^}]{1,500})\\}'
    )
  );
  if (destructuredMatch) {
    const propStr = destructuredMatch[1];
    const propNames = propStr.split(',').map(p => {
      const trimmed = p.trim().split(/[=:]/)[0].trim();
      return trimmed.replace(/^\.\.\./, '');
    }).filter(n => n && /^[a-zA-Z_$]/.test(n));
    for (const name of propNames) {
      const required = !propStr.includes(name + '?') && !propStr.includes(name + ' =');
      props.push({ name, required });
    }
  }

  // Pattern 2: Interface/Type definition
  const interfaceMatch = content.match(
    /(?:interface|type)\s+\w*Props\w*\s*(?:=\s*)?{([^}]{1,1000})}/
  );
  if (interfaceMatch && props.length === 0) {
    const typeStr = interfaceMatch[1];
    const lines = typeStr.split('\n').map(l => l.trim()).filter(Boolean);
    for (const line of lines) {
      const propMatch = line.match(/^(\w+)(\?)?\s*:/);
      if (propMatch) {
        props.push({ name: propMatch[1], required: !propMatch[2] });
      }
    }
  }

  return props;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function catalogComponents(projectRoot, structure, framework) {
  const visited = new Set();
  try {
    visited.add(fs.realpathSync(projectRoot));
  } catch (e) {
    // Continue without realpath
  }

  const files = walkProject(projectRoot, projectRoot, [], 0, visited);
  const components = [];

  for (const file of files) {
    const ext = file.ext;

    // Vue/Svelte files are always components
    if (ext === '.vue' || ext === '.svelte') {
      const name = path.basename(file.relativePath, ext);
      const category = categorizeComponent(file.relativePath, file.lineCount, file.content, name);
      const props = extractProps(file.content, name);
      components.push({
        name,
        relativePath: file.relativePath,
        ext,
        exportStyle: 'default',
        confidence: 'HIGH',
        category,
        lineCount: file.lineCount,
        props,
      });
      continue;
    }

    // Score confidence
    const { confidence, score } = scoreComponentConfidence(file.relativePath, file.content);
    if (confidence === 'LOW') continue; // Skip LOW confidence

    const name = extractComponentName(file.relativePath, file.content, framework);
    if (!name) continue;

    const exportStyle = detectExportStyle(file.content);
    const category = categorizeComponent(file.relativePath, file.lineCount, file.content, name);
    const props = confidence === 'HIGH' ? extractProps(file.content, name) : [];

    components.push({
      name,
      relativePath: file.relativePath,
      ext,
      exportStyle,
      confidence,
      category,
      lineCount: file.lineCount,
      props,
    });
  }

  return components;
}

// ---------------------------------------------------------------------------
// Stage 5: Select Representative Files
// ---------------------------------------------------------------------------

function selectRepresentativeFiles(components) {
  const highConfidence = components.filter(c => c.confidence === 'HIGH');
  const source = highConfidence.length > 0 ? highConfidence : components;

  if (source.length === 0) return [];

  // Group by directory
  const byDir = {};
  for (const comp of source) {
    const dir = path.dirname(comp.relativePath);
    if (!byDir[dir]) byDir[dir] = [];
    byDir[dir].push(comp);
  }

  const selected = [];
  const dirs = Object.keys(byDir).sort();

  // Pick median-sized from each directory (up to 3)
  for (const dir of dirs) {
    if (selected.length >= 3) break;
    const sorted = byDir[dir].sort((a, b) => a.lineCount - b.lineCount);
    const median = sorted[Math.floor(sorted.length / 2)];
    selected.push(median);
  }

  // Fill remaining from largest directory
  if (selected.length < 5) {
    const sortedDirs = Object.keys(byDir).sort((a, b) => byDir[b].length - byDir[a].length);
    const largestDir = sortedDirs[0];
    if (largestDir) {
      for (const comp of byDir[largestDir]) {
        if (selected.length >= 5) break;
        if (!selected.includes(comp)) selected.push(comp);
      }
    }
  }

  return selected;
}

// ---------------------------------------------------------------------------
// Stage 6: Extract Conventions
// ---------------------------------------------------------------------------

function extractConventions(projectRoot, representativeFiles) {
  const findings = {
    borderRadius: {},
    spacing: {},
    shadows: {},
    colors: {},
    importStyle: { named: 0, default: 0, barrel: 0 },
    exportStyle: { named: 0, default: 0 },
    namingCase: { kebab: 0, pascal: 0, camel: 0 },
    pathAliases: [],
    barrelFiles: false,
  };

  // Check tsconfig for path aliases
  const tsconfig = safeReadJSON(path.join(projectRoot, 'tsconfig.json'));
  if (tsconfig && tsconfig.compilerOptions && tsconfig.compilerOptions.paths) {
    const paths = tsconfig.compilerOptions.paths;
    for (const [alias, targets] of Object.entries(paths)) {
      findings.pathAliases.push({
        alias: alias.replace('/*', '/'),
        target: (targets[0] || '').replace('/*', '/'),
      });
    }
  }

  // Check for barrel files
  const componentDirs = ['src/components', 'components', 'src/ui', 'ui'];
  for (const dir of componentDirs) {
    const indexPath = path.join(projectRoot, dir, 'index.ts');
    const indexPathJs = path.join(projectRoot, dir, 'index.js');
    if (fs.existsSync(indexPath) || fs.existsSync(indexPathJs)) {
      findings.barrelFiles = true;
      break;
    }
  }

  // Analyze naming case from all component files
  for (const comp of representativeFiles) {
    const basename = path.basename(comp.relativePath, comp.ext);
    if (/^[a-z]+-[a-z]/.test(basename)) findings.namingCase.kebab++;
    else if (/^[A-Z][a-z]+[A-Z]/.test(basename)) findings.namingCase.pascal++;
    else if (/^[a-z]+[A-Z]/.test(basename)) findings.namingCase.camel++;
    else if (/^[A-Z]/.test(basename)) findings.namingCase.pascal++;
  }

  // Extract patterns from file contents
  for (const comp of representativeFiles) {
    const content = safeReadFile(path.join(projectRoot, comp.relativePath));
    if (!content) continue;

    // Styling conventions
    extractPatternMatches(content, CONVENTION_PATTERNS.borderRadius, findings.borderRadius);
    extractPatternMatches(content, CONVENTION_PATTERNS.spacing, findings.spacing);
    extractPatternMatches(content, CONVENTION_PATTERNS.shadows, findings.shadows);
    extractPatternMatches(content, CONVENTION_PATTERNS.colors, findings.colors);

    // Import style
    const namedImports = (content.match(/import\s*\{[^}]+\}\s*from/g) || []).length;
    const defaultImports = (content.match(/import\s+[A-Za-z]\w*\s+from/g) || []).length;
    const barrelImports = (content.match(/from\s+['"]\.\/(?:index)?['"]/g) || []).length;
    findings.importStyle.named += namedImports;
    findings.importStyle.default += defaultImports;
    findings.importStyle.barrel += barrelImports;

    // Export style
    const namedExports = (content.match(/export\s+(?:const|function|class)\s+/g) || []).length;
    const defaultExports = (content.match(/export\s+default\s+/g) || []).length;
    findings.exportStyle.named += namedExports;
    findings.exportStyle.default += defaultExports;
  }

  return findings;
}

function extractPatternMatches(content, patterns, bucket) {
  for (const [type, regex] of Object.entries(patterns)) {
    // Reset regex lastIndex
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(content)) !== null) {
      const val = match[1] || match[0];
      bucket[val] = (bucket[val] || 0) + 1;
    }
  }
}

// ---------------------------------------------------------------------------
// Output: PROJECT-SCAN.md
// ---------------------------------------------------------------------------

function formatStructureTree(nodes, indent) {
  if (!indent) indent = '';
  const lines = [];
  for (const node of nodes) {
    const annotation = node.fileCount > 0 ? ` (${node.fileCount} files)` : '';
    const childCount = countTotalFiles(node);
    const displayAnnotation = node.children.length > 0
      ? ` # ${childCount} files total`
      : annotation;
    lines.push(`${indent}${node.name}/${displayAnnotation}`);
    if (node.children.length > 0) {
      lines.push(formatStructureTree(node.children, indent + '  '));
    }
  }
  return lines.join('\n');
}

function countTotalFiles(node) {
  let count = node.fileCount;
  for (const child of node.children) {
    count += countTotalFiles(child);
  }
  return count;
}

function writeProjectScan(outputDir, scanData) {
  const { framework, cssApproach, structure, components } = scanData;
  const date = new Date().toISOString().split('T')[0];

  const lines = [];
  lines.push('# Project Scan');
  lines.push('');
  lines.push(`**Scanned:** ${date}`);
  lines.push(`**Root:** ${projectRoot}`);
  lines.push('');

  // Framework
  lines.push('## Framework');
  lines.push(`- **Framework:** ${framework.name}${framework.version ? ' ' + framework.version : ''}`);
  lines.push(`- **Language:** ${framework.language}`);
  lines.push(`- **Confidence:** ${framework.confidence}`);
  lines.push('');

  // CSS Approach
  lines.push('## CSS Approach');
  for (let i = 0; i < cssApproach.length; i++) {
    const label = i === 0 ? 'Primary' : 'Secondary';
    const extra = cssApproach[i].fileCount ? ` (${cssApproach[i].fileCount} files detected)` : '';
    lines.push(`- **${label}:** ${cssApproach[i].name}${extra}`);
  }
  lines.push('');

  // Directory Structure
  lines.push('## Directory Structure');
  lines.push('```');
  if (structure.length > 0) {
    lines.push(formatStructureTree(structure));
  } else {
    lines.push('(no recognized source directories found)');
  }
  lines.push('```');
  lines.push('');

  // Component Catalog
  lines.push('## Component Catalog');
  lines.push('');
  if (components.length === 0) {
    lines.push('No components detected.');
  } else {
    // Group by directory
    const byDir = {};
    for (const comp of components) {
      const dir = path.dirname(comp.relativePath);
      if (!byDir[dir]) byDir[dir] = [];
      byDir[dir].push(comp);
    }

    const dirs = Object.keys(byDir).sort();
    for (const dir of dirs) {
      const comps = byDir[dir];
      lines.push(`### ${dir}/ (${comps.length} component${comps.length !== 1 ? 's' : ''})`);
      lines.push('| Component | File | Export | Category | Confidence |');
      lines.push('|-----------|------|--------|----------|------------|');
      const display = comps.slice(0, MAX_TABLE_ROWS);
      for (const c of display) {
        const filename = path.basename(c.relativePath);
        lines.push(`| ${c.name} | ${filename} | ${c.exportStyle} | ${c.category} | ${c.confidence} |`);
      }
      if (comps.length > MAX_TABLE_ROWS) {
        lines.push(`| ... | ...and ${comps.length - MAX_TABLE_ROWS} more | | | |`);
      }
      lines.push('');
    }
  }

  // Props Summary
  const withProps = components.filter(c => c.confidence === 'HIGH' && c.props.length > 0);
  if (withProps.length > 0) {
    lines.push('## Props Summary');
    lines.push('| Component | Props |');
    lines.push('|-----------|-------|');
    const display = withProps.slice(0, MAX_TABLE_ROWS);
    for (const c of display) {
      const propNames = c.props.map(p => p.name).join(', ');
      lines.push(`| ${c.name} | ${propNames} |`);
    }
    if (withProps.length > MAX_TABLE_ROWS) {
      lines.push(`| ... | ...and ${withProps.length - MAX_TABLE_ROWS} more |`);
    }
    lines.push('');
  }

  const content = lines.join('\n');
  const scanOutputDir = path.join(outputDir, '.planning', 'design');
  fs.mkdirSync(scanOutputDir, { recursive: true });
  fs.writeFileSync(path.join(scanOutputDir, 'PROJECT-SCAN.md'), content, 'utf8');
  return content;
}

// ---------------------------------------------------------------------------
// Output: CONVENTIONS.md
// ---------------------------------------------------------------------------

function formatTopValues(bucket, maxItems) {
  if (!maxItems) maxItems = 3;
  const entries = Object.entries(bucket).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) return null;

  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const lines = [];
  const top = entries.slice(0, maxItems);

  for (let i = 0; i < top.length; i++) {
    const [value, count] = top[i];
    const pct = Math.round((count / total) * 100);
    const label = i === 0 ? 'Dominant' : i === 1 ? 'Secondary' : 'Other';
    lines.push(`- **${label}:** ${value} (${pct}% usage, ${count} occurrence${count !== 1 ? 's' : ''})`);
  }

  // Inconsistency flag
  if (entries.length > 1) {
    const dominantPct = Math.round((entries[0][1] / total) * 100);
    if (dominantPct < 70) {
      lines.push(`- **Inconsistency:** YES -- ${entries[0][0]} vs ${entries[1][0]} usage is split`);
    }
  }

  return lines.join('\n');
}

function writeConventions(outputDir, conventions, representativeCount) {
  const date = new Date().toISOString().split('T')[0];
  const lines = [];

  lines.push('# Project Conventions');
  lines.push('');
  lines.push(`**Extracted from:** ${representativeCount} representative files`);
  lines.push(`**Scanned:** ${date}`);
  lines.push('');

  // Styling Conventions
  lines.push('## Styling Conventions');
  lines.push('');

  const stylingCategories = [
    ['Border Radius', conventions.borderRadius],
    ['Spacing', conventions.spacing],
    ['Shadows', conventions.shadows],
    ['Colors', conventions.colors],
  ];

  let hasStyling = false;
  for (const [title, bucket] of stylingCategories) {
    const total = Object.values(bucket).reduce((s, c) => s + c, 0);
    if (total < 2) continue; // Skip categories with < 2 occurrences
    hasStyling = true;
    lines.push(`### ${title}`);
    lines.push(formatTopValues(bucket));
    lines.push('');
  }

  if (!hasStyling) {
    lines.push('No significant styling patterns detected.');
    lines.push('');
  }

  // Code Conventions
  lines.push('## Code Conventions');
  lines.push('');

  // Imports
  lines.push('### Imports');
  const totalImports = conventions.importStyle.named + conventions.importStyle.default;
  if (totalImports > 0) {
    const namedPct = Math.round((conventions.importStyle.named / totalImports) * 100);
    const defaultPct = 100 - namedPct;
    lines.push(`- **Style:** Named imports (${namedPct}%), default imports (${defaultPct}%)`);
  } else {
    lines.push('- **Style:** No imports detected');
  }

  if (conventions.pathAliases.length > 0) {
    const aliases = conventions.pathAliases.map(a => `${a.alias} maps to ${a.target}`).join(', ');
    lines.push(`- **Path aliases:** ${aliases}`);
  }

  if (conventions.barrelFiles) {
    lines.push('- **Barrel files:** YES (index.ts in component directories)');
  }
  lines.push('');

  // File naming
  lines.push('### File Structure');
  const caseCounts = conventions.namingCase;
  const dominantCase = Object.entries(caseCounts).sort((a, b) => b[1] - a[1]);
  if (dominantCase.length > 0 && dominantCase[0][1] > 0) {
    lines.push(`- **Naming:** ${dominantCase[0][0]}Case for components`);
  }
  lines.push('');

  // Exports
  lines.push('### Exports');
  const totalExports = conventions.exportStyle.named + conventions.exportStyle.default;
  if (totalExports > 0) {
    const namedPct = Math.round((conventions.exportStyle.named / totalExports) * 100);
    if (namedPct > 60) {
      lines.push(`- **Dominant:** Named exports (${namedPct}%)`);
    } else if (namedPct < 40) {
      lines.push(`- **Dominant:** Default exports (${100 - namedPct}%)`);
    } else {
      lines.push(`- **Mixed:** Named (${namedPct}%) and default (${100 - namedPct}%) exports`);
    }
  } else {
    lines.push('- No exports detected');
  }
  lines.push('');

  const content = lines.join('\n');
  const scanOutputDir = path.join(outputDir, '.planning', 'design');
  fs.mkdirSync(scanOutputDir, { recursive: true });
  fs.writeFileSync(path.join(scanOutputDir, 'CONVENTIONS.md'), content, 'utf8');
  return content;
}

// ---------------------------------------------------------------------------
// Main Pipeline
// ---------------------------------------------------------------------------

function scan(projectRoot, outputDir) {
  console.log(`Scanning: ${projectRoot}`);
  console.log('');

  // Stage 1: Detect framework
  const framework = detectFramework(projectRoot);
  console.log(`Framework: ${framework.name}${framework.version ? ' ' + framework.version : ''} (${framework.confidence})`);
  console.log(`Language: ${framework.language}`);

  // Stage 2: Detect CSS approach
  const cssApproach = detectCSSApproach(projectRoot);
  console.log(`CSS: ${cssApproach.map(c => c.name).join(', ')}`);

  // Stage 3: Map directory structure
  const structure = mapDirectoryStructure(projectRoot);
  console.log(`Directories: ${structure.length} source directories found`);

  // Stage 4: Catalog components
  const components = catalogComponents(projectRoot, structure, framework);
  const highCount = components.filter(c => c.confidence === 'HIGH').length;
  const medCount = components.filter(c => c.confidence === 'MEDIUM').length;
  console.log(`Components: ${components.length} total (${highCount} HIGH, ${medCount} MEDIUM)`);

  // Stage 5: Select representative files
  const representativeFiles = selectRepresentativeFiles(components);
  console.log(`Representatives: ${representativeFiles.length} files selected`);

  // Stage 6: Extract conventions
  const conventions = extractConventions(projectRoot, representativeFiles);

  // Output
  writeProjectScan(outputDir, { framework, cssApproach, structure, components });
  writeConventions(outputDir, conventions, representativeFiles.length);

  const scanPath = path.join(outputDir, '.planning', 'design', 'PROJECT-SCAN.md');
  const convPath = path.join(outputDir, '.planning', 'design', 'CONVENTIONS.md');
  console.log('');
  console.log(`Output: ${scanPath}`);
  console.log(`Output: ${convPath}`);
  console.log('');
  console.log('Scan complete.');
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

try {
  scan(projectRoot, outputDir);
} catch (err) {
  console.error(`Scan failed: ${err.message}`);
  process.exit(1);
}
