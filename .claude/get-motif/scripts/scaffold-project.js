#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const REGISTRY_PATH = path.resolve(__dirname, '..', 'references', 'framework-registry.json');

function printHelp() {
  console.log('Usage: node .claude/get-motif/scripts/scaffold-project.js --platform <id> [options]');
  console.log('');
  console.log('Registry-driven scaffold/materialization runner for Motif platforms.');
  console.log('');
  console.log('Required:');
  console.log('  --platform <id>            Platform ID from framework-registry.json');
  console.log('');
  console.log('Options:');
  console.log('  --project-root <path>      Project root or parent path (default: current directory)');
  console.log('  --project-name <name>      Project directory name (default: basename(project-root))');
  console.log('  --design-system-dir <path> Design system artifact directory (default: .planning/design/system)');
  console.log('  --dry-run                  Print actions without writing files or running commands');
  console.log('  --help, -h                 Show this help message');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const options = {
    platform: null,
    projectRoot: process.cwd(),
    projectName: null,
    designSystemDir: path.resolve(process.cwd(), '.planning', 'design', 'system'),
    dryRun: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--platform' && args[i + 1]) {
      options.platform = args[++i];
    } else if (arg === '--project-root' && args[i + 1]) {
      options.projectRoot = path.resolve(args[++i]);
    } else if (arg === '--project-name' && args[i + 1]) {
      options.projectName = args[++i];
    } else if (arg === '--design-system-dir' && args[i + 1]) {
      options.designSystemDir = path.resolve(args[++i]);
    } else if (arg === '--dry-run') {
      options.dryRun = true;
    }
  }

  if (!options.platform) {
    console.error('Error: --platform is required');
    printHelp();
    process.exit(1);
  }

  return options;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function ensureDirectory(dirPath, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] mkdir -p ${dirPath}`);
    return;
  }
  fs.mkdirSync(dirPath, { recursive: true });
}

function listFilesRecursive(baseDir) {
  const files = [];
  if (!exists(baseDir)) return files;

  const stack = [baseDir];
  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
      } else {
        files.push(fullPath);
      }
    }
  }
  return files;
}

function runCommand(spec, cwd, dryRun) {
  let command;
  let args;
  let shell = false;

  if (typeof spec === 'string') {
    command = spec;
    args = [];
    shell = true;
  } else if (spec && typeof spec === 'object' && spec.command) {
    command = spec.command;
    args = Array.isArray(spec.args) ? spec.args : [];
  } else {
    throw new Error(`Unsupported command spec: ${JSON.stringify(spec)}`);
  }

  if (dryRun) {
    const rendered = shell ? command : [command, ...args].join(' ');
    console.log(`[dry-run] (${cwd}) ${rendered}`);
    return;
  }

  const result = spawnSync(command, args, {
    cwd,
    shell,
    stdio: 'inherit',
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed in ${cwd}: ${shell ? command : [command, ...args].join(' ')}`);
  }
}

function resolveProjectDirectory(projectRoot, projectName) {
  const root = path.resolve(projectRoot);
  const name = projectName || path.basename(root);

  if (path.basename(root) === name) {
    return { projectDir: root, projectName: name };
  }

  return {
    projectDir: path.join(root, name),
    projectName: name,
  };
}

function renderTemplate(template, replacements) {
  return template.replace(/\{([a-zA-Z0-9_-]+)\}/g, (_, key) => {
    return Object.prototype.hasOwnProperty.call(replacements, key) ? replacements[key] : `{${key}}`;
  });
}

function normalizeOwnedFiles(platformEntry) {
  const owned = new Set();
  const materialization = platformEntry.materialization || {};

  if (Array.isArray(materialization.ownedFiles)) {
    for (const relPath of materialization.ownedFiles) {
      owned.add(relPath);
    }
  }

  if (materialization.templates && typeof materialization.templates === 'object') {
    for (const relPath of Object.keys(materialization.templates)) {
      owned.add(relPath);
    }
  }

  if (materialization.designArtifacts && typeof materialization.designArtifacts === 'object') {
    for (const spec of Object.values(materialization.designArtifacts)) {
      if (spec && spec.destination) {
        owned.add(spec.destination);
      }
    }
  }

  const generated = platformEntry.scaffold && platformEntry.scaffold.generatedStructure;
  if (Array.isArray(generated)) {
    for (const relPath of generated) {
      if (!relPath.endsWith('/')) {
        owned.add(relPath);
      }
    }
  }

  return owned;
}

function writeOwnedFile(projectDir, relPath, content, ownedFiles, state, dryRun) {
  const normalizedRelPath = relPath.replace(/\\/g, '/');
  const absolutePath = path.join(projectDir, normalizedRelPath);

  if (!ownedFiles.has(normalizedRelPath)) {
    state.conflicts.push(`Refused to write non-owned file: ${normalizedRelPath}`);
    return;
  }

  ensureDirectory(path.dirname(absolutePath), dryRun);

  if (exists(absolutePath)) {
    const existing = fs.readFileSync(absolutePath, 'utf8');
    if (existing === content) {
      state.skipped.push(`${normalizedRelPath} (unchanged)`);
      return;
    }
    state.overwritten.push(normalizedRelPath);
  } else {
    state.created.push(normalizedRelPath);
  }

  if (dryRun) {
    console.log(`[dry-run] write ${normalizedRelPath}`);
    return;
  }

  fs.writeFileSync(absolutePath, content, 'utf8');
}

function copyOwnedFile(projectDir, relPath, sourcePath, ownedFiles, state, dryRun) {
  if (!exists(sourcePath)) {
    state.skipped.push(`${relPath} (missing source: ${sourcePath})`);
    return;
  }

  const content = fs.readFileSync(sourcePath, 'utf8');
  writeOwnedFile(projectDir, relPath, content, ownedFiles, state, dryRun);
}

function applyGeneratedStructure(projectDir, platformEntry, ownedFiles, state, dryRun) {
  const scaffold = platformEntry.scaffold || {};
  const generated = Array.isArray(scaffold.generatedStructure) ? scaffold.generatedStructure : [];
  if (generated.length === 0) return;

  const templates = (platformEntry.materialization && platformEntry.materialization.templates) || {};

  for (const item of generated) {
    const normalized = item.replace(/\\/g, '/');
    const absolutePath = path.join(projectDir, normalized);
    const isDirectory = normalized.endsWith('/');

    if (isDirectory) {
      ensureDirectory(absolutePath, dryRun);
      continue;
    }

    const template = templates[normalized];
    const content = typeof template === 'string' ? template : '';
    writeOwnedFile(projectDir, normalized, content, ownedFiles, state, dryRun);
  }
}

function applyTemplateDirectory(projectDir, platformEntry, ownedFiles, state, dryRun) {
  const materialization = platformEntry.materialization || {};
  if (!materialization.templateDir) return;

  const templateDir = path.resolve(path.dirname(REGISTRY_PATH), materialization.templateDir);
  if (!exists(templateDir)) {
    state.conflicts.push(`Template directory not found: ${templateDir}`);
    return;
  }

  const files = listFilesRecursive(templateDir);
  for (const filePath of files) {
    const relFromTemplate = path.relative(templateDir, filePath).replace(/\\/g, '/');
    copyOwnedFile(projectDir, relFromTemplate, filePath, ownedFiles, state, dryRun);
  }
}

function applyInlineTemplates(projectDir, platformEntry, ownedFiles, replacements, state, dryRun) {
  const materialization = platformEntry.materialization || {};
  const templates = materialization.templates || {};
  for (const [relPath, template] of Object.entries(templates)) {
    const content = renderTemplate(String(template), replacements);
    writeOwnedFile(projectDir, relPath, content, ownedFiles, state, dryRun);
  }
}

function materializeDesignArtifacts(projectDir, designSystemDir, platformEntry, ownedFiles, state, dryRun) {
  const materialization = platformEntry.materialization || {};

  let artifactMap = materialization.designArtifacts || null;
  if (!artifactMap) {
    const runtimeDestinations = (platformEntry.tokens && platformEntry.tokens.runtimeDestinations) || {};
    artifactMap = {};
    if (runtimeDestinations.tokensTs) {
      artifactMap.tokensTs = { source: 'tokens.ts', destination: runtimeDestinations.tokensTs };
    }
    if (runtimeDestinations.globalsCss) {
      artifactMap.globalsCss = { source: 'globals.css', destination: runtimeDestinations.globalsCss };
    }
    if (runtimeDestinations.tokensCss) {
      artifactMap.tokensCss = { source: 'tokens.css', destination: runtimeDestinations.tokensCss };
    }
  }

  for (const spec of Object.values(artifactMap)) {
    if (!spec || !spec.source || !spec.destination) continue;
    const sourcePath = path.join(designSystemDir, spec.source);
    copyOwnedFile(projectDir, spec.destination, sourcePath, ownedFiles, state, dryRun);
  }
}

function applyScaffoldCommands(projectDir, projectName, platformEntry, dryRun) {
  const scaffold = platformEntry.scaffold || {};
  if (!scaffold.command) return;

  const alreadyScaffolded = exists(path.join(projectDir, 'package.json'));
  const hasGeneratedStructure = Array.isArray(scaffold.generatedStructure) && scaffold.generatedStructure.length > 0;
  if (alreadyScaffolded && !hasGeneratedStructure) {
    console.log(`Scaffold command skipped: project already has package.json at ${projectDir}`);
    return;
  }

  const scaffoldArgs = Array.isArray(scaffold.args) ? scaffold.args : [];
  const resolvedArgs = scaffoldArgs.map((arg) => String(arg).replaceAll('{name}', projectName));

  const runInParent = scaffoldArgs.some((arg) => String(arg).includes('{name}'));
  const commandCwd = runInParent ? path.dirname(projectDir) : projectDir;
  if (!runInParent) {
    ensureDirectory(projectDir, dryRun);
  }

  runCommand({ command: scaffold.command, args: resolvedArgs }, commandCwd, dryRun);

  const postInstall = Array.isArray(scaffold.postInstall) ? scaffold.postInstall : [];
  for (const step of postInstall) {
    runCommand(step, projectDir, dryRun);
  }
}

function main() {
  const options = parseArgs(process.argv);
  if (!exists(REGISTRY_PATH)) {
    throw new Error(`Framework registry not found: ${REGISTRY_PATH}`);
  }

  const registry = readJson(REGISTRY_PATH);
  const platformEntry = registry[options.platform];
  if (!platformEntry) {
    const known = Object.keys(registry).join(', ');
    throw new Error(`Unknown platform "${options.platform}". Known platforms: ${known}`);
  }

  const resolved = resolveProjectDirectory(options.projectRoot, options.projectName);
  const projectDir = resolved.projectDir;
  const projectName = resolved.projectName;
  const designSystemDir = path.resolve(options.designSystemDir);
  const ownedFiles = normalizeOwnedFiles(platformEntry);
  const state = {
    created: [],
    overwritten: [],
    skipped: [],
    conflicts: [],
  };

  console.log(`Platform: ${options.platform}`);
  console.log(`Project: ${projectDir}`);
  console.log(`Design system: ${designSystemDir}`);

  ensureDirectory(projectDir, options.dryRun);
  applyScaffoldCommands(projectDir, projectName, platformEntry, options.dryRun);
  applyGeneratedStructure(projectDir, platformEntry, ownedFiles, state, options.dryRun);
  applyTemplateDirectory(projectDir, platformEntry, ownedFiles, state, options.dryRun);

  const replacements = {
    projectName,
    platform: options.platform,
  };
  applyInlineTemplates(projectDir, platformEntry, ownedFiles, replacements, state, options.dryRun);
  materializeDesignArtifacts(projectDir, designSystemDir, platformEntry, ownedFiles, state, options.dryRun);

  console.log('');
  console.log(`Created files: ${state.created.length}`);
  console.log(`Overwritten owned files: ${state.overwritten.length}`);
  console.log(`Skipped files: ${state.skipped.length}`);
  console.log(`Conflicts: ${state.conflicts.length}`);

  if (state.conflicts.length > 0) {
    console.log('');
    console.log('Conflicts:');
    for (const item of state.conflicts) {
      console.log(`- ${item}`);
    }
  }
}

try {
  main();
} catch (error) {
  console.error(`Scaffold runner failed: ${error.message}`);
  process.exit(1);
}
