#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const REGISTRY_PATH = path.resolve(__dirname, '..', 'references', 'framework-registry.json');

function printHelp() {
  console.log('Usage: node .claude/get-motif/scripts/runtime-launcher.js --platform <id> [options]');
  console.log('');
  console.log('Registry-driven runtime launcher for post-compose auto-run.');
  console.log('');
  console.log('Required:');
  console.log('  --platform <id>            Platform ID from framework-registry.json');
  console.log('');
  console.log('Options:');
  console.log('  --project-root <path>      Project root or parent path (default: current directory)');
  console.log('  --project-name <name>      Project directory name (default: basename(project-root))');
  console.log('  --source <name>            Launch source label (default: compose)');
  console.log('  --dry-run                  Print launch/open actions without spawning processes');
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
    source: 'compose',
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
    } else if (arg === '--source' && args[i + 1]) {
      options.source = args[++i];
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

function buildOpenCommand(target, platform = process.platform) {
  if (platform === 'darwin') {
    return { command: 'open', args: [target] };
  }
  if (platform === 'win32') {
    return { command: 'cmd', args: ['/c', 'start', '""', target] };
  }
  return { command: 'xdg-open', args: [target] };
}

function compileMatchers(matchers) {
  if (!Array.isArray(matchers)) return [];
  return matchers
    .map((matcher) => {
      if (!matcher) return null;
      if (typeof matcher === 'string') {
        return new RegExp(matcher, 'i');
      }
      if (typeof matcher === 'object' && matcher.pattern) {
        return new RegExp(matcher.pattern, matcher.flags || 'i');
      }
      return null;
    })
    .filter(Boolean);
}

function extractUrl(output, runtime) {
  if (!output) return null;
  if (runtime && runtime.urlPattern) {
    try {
      const regex = new RegExp(runtime.urlPattern, 'i');
      const match = output.match(regex);
      if (match) {
        return match[1] || match[0];
      }
    } catch {
      // ignore invalid regex
    }
  }

  const fallbackMatch = output.match(/https?:\/\/[^\s]+/i);
  if (fallbackMatch) {
    return fallbackMatch[0];
  }

  if (runtime && runtime.defaultUrl) {
    return runtime.defaultUrl;
  }

  return null;
}

function parseOutputForReady(output, runtime) {
  const matchers = compileMatchers(runtime ? runtime.readyMatchers : []);
  const ready = matchers.some((regex) => regex.test(output || ''));
  const url = ready ? extractUrl(output, runtime) : null;
  return { ready, url };
}

function resolvePreviewTarget(runtime, projectDir) {
  const previewTarget = runtime && runtime.previewTarget ? runtime.previewTarget : 'index.html';
  if (/^https?:\/\//i.test(previewTarget)) {
    return previewTarget;
  }
  if (path.isAbsolute(previewTarget)) {
    return previewTarget;
  }
  return path.join(projectDir, previewTarget);
}

function resolveCwd(runtime, projectDir) {
  if (!runtime || !runtime.cwdPolicy || runtime.cwdPolicy === 'project-root') {
    return projectDir;
  }
  return projectDir;
}

function openPreview(target, runtime, dryRun) {
  if (runtime && runtime.openStrategy === 'none') {
    console.log('[motif] Preview open skipped (openStrategy=none)');
    return;
  }

  const openCommand = buildOpenCommand(target);
  if (dryRun) {
    console.log(`[dry-run] open ${target}`);
    console.log(`[dry-run] ${openCommand.command} ${openCommand.args.join(' ')}`);
    return;
  }

  const child = spawn(openCommand.command, openCommand.args, {
    stdio: 'ignore',
    detached: true,
  });
  child.unref();
}

function runStaticPreview(runtime, projectDir, options) {
  const previewTarget = resolvePreviewTarget(runtime, projectDir);
  console.log(`[motif] Static preview target: ${previewTarget}`);

  if (options.dryRun) {
    openPreview(previewTarget, runtime, true);
    return;
  }

  openPreview(previewTarget, runtime, false);
}

function runDaemon(runtime, projectDir, options) {
  if (!runtime.command) {
    throw new Error('Runtime command is missing for daemon mode');
  }

  const command = runtime.command;
  const args = Array.isArray(runtime.args) ? runtime.args : [];
  const cwd = resolveCwd(runtime, projectDir);

  if (options.dryRun) {
    console.log(`[dry-run] (${cwd}) ${command} ${args.join(' ')}`);
    const previewUrl = runtime.defaultUrl || 'http://localhost';
    openPreview(previewUrl, runtime, true);
    return;
  }

  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });

  console.log(`[motif] Launched ${command} ${args.join(' ')} (pid ${child.pid})`);

  let outputBuffer = '';
  let readyResolved = false;

  const handleOutput = (chunk) => {
    if (readyResolved) return;
    outputBuffer += chunk.toString();
    const result = parseOutputForReady(outputBuffer, runtime);
    if (result.ready) {
      readyResolved = true;
      const previewUrl = result.url || runtime.defaultUrl;
      if (previewUrl) {
        console.log(`[motif] Ready. Opening preview at ${previewUrl}`);
        openPreview(previewUrl, runtime, false);
      } else {
        console.warn('[motif] Ready signal detected but no preview URL found');
      }
      if (child.stdout) {
        child.stdout.removeAllListeners();
        child.stdout.destroy();
      }
      if (child.stderr) {
        child.stderr.removeAllListeners();
        child.stderr.destroy();
      }
      child.unref();
      process.exit(0);
    }
  };

  child.stdout.on('data', handleOutput);
  child.stderr.on('data', handleOutput);

  child.on('error', (error) => {
    if (!readyResolved) {
      console.error(`[motif] Runtime launch failed: ${error.message}`);
      process.exit(1);
    }
  });

  child.on('exit', (code) => {
    if (!readyResolved) {
      console.error(`[motif] Runtime exited before readiness (code ${code})`);
      process.exit(code || 1);
    }
  });
}

function main() {
  const options = parseArgs(process.argv);
  if (!exists(REGISTRY_PATH)) {
    throw new Error(`Framework registry not found: ${REGISTRY_PATH}`);
  }

  const registry = readJson(REGISTRY_PATH);
  const entry = registry[options.platform];
  if (!entry) {
    const known = Object.keys(registry).join(', ');
    throw new Error(`Unknown platform "${options.platform}". Known platforms: ${known}`);
  }

  const runtime = entry.devServer;
  if (!runtime || !runtime.mode) {
    throw new Error(`Platform "${options.platform}" is not runnable via auto-run yet.`);
  }

  const resolved = resolveProjectDirectory(options.projectRoot, options.projectName);
  const projectDir = resolved.projectDir;

  console.log(`[motif] Platform: ${options.platform}`);
  console.log(`[motif] Project: ${projectDir}`);
  console.log(`[motif] Source: ${options.source}`);

  if (runtime.mode === 'static-preview') {
    runStaticPreview(runtime, projectDir, options);
    return;
  }

  if (runtime.mode !== 'daemon') {
    throw new Error(`Unsupported runtime mode: ${runtime.mode}`);
  }

  runDaemon(runtime, projectDir, options);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(`Runtime launcher failed: ${error.message}`);
    process.exit(1);
  }
}

module.exports = {
  buildOpenCommand,
  parseOutputForReady,
  resolvePreviewTarget,
  resolveProjectDirectory,
};
