#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');

const {
  resolveSessionPath,
  readSession,
  writeSession,
  updateSession,
  detectStaleSession,
  isPidAlive,
  markSessionStale,
  nowIso,
} = require('./runtime-session');

const sessionStore = require('./auto-run-session-store');

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
  console.log('  --signal <SIG>             Simulate a signal for cleanup testing (dry-run only)');
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
    signal: null,
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
    } else if (arg === '--signal' && args[i + 1]) {
      options.signal = args[++i];
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

function formatCommand(command, args) {
  const parts = [command].concat(args || []);
  return parts.filter(Boolean).join(' ');
}

function parsePortFromUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.port) return Number(parsed.port);
    if (parsed.protocol === 'https:') return 443;
    if (parsed.protocol === 'http:') return 80;
  } catch {
    return null;
  }
  return null;
}

function checkPortAvailability(port) {
  if (!port || typeof port !== 'number') {
    return Promise.resolve({ available: true, reason: null });
  }

  return new Promise((resolve) => {
    const server = net.createServer();
    const finalize = (available, reason) => {
      resolve({ available, reason: reason || null });
    };

    server.once('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        finalize(false, 'in-use');
      } else {
        finalize(false, error.code || 'error');
      }
    });

    server.once('listening', () => {
      server.close(() => finalize(true, null));
    });

    server.listen(port, '127.0.0.1');
  });
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

function logSessionHeader(sessionPath) {
  console.log(`[motif] Session file: ${sessionPath}`);
}

async function cleanupProcessTree(pid, signal) {
  if (!pid) {
    return { success: false, method: 'none', error: 'missing-pid' };
  }

  if (process.platform === 'win32') {
    return new Promise((resolve) => {
      const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
      killer.once('exit', (code) => {
        resolve({ success: code === 0, method: 'taskkill', code });
      });
      killer.once('error', (error) => {
        try {
          process.kill(pid, signal || 'SIGTERM');
          resolve({ success: true, method: 'process.kill' });
        } catch (killError) {
          resolve({ success: false, method: 'process.kill', error: killError.message || error.message });
        }
      });
    });
  }

  try {
    process.kill(-pid, signal || 'SIGTERM');
    return { success: true, method: 'process-group' };
  } catch (error) {
    try {
      process.kill(pid, signal || 'SIGTERM');
      return { success: true, method: 'process.kill' };
    } catch (killError) {
      return { success: false, method: 'process.kill', error: killError.message || error.message };
    }
  }
}

async function cleanupTrackedSession(projectDir, session, reason, signal) {
  if (!session || session.mode !== 'daemon' || !session.pid) {
    return { outcome: 'skipped', reason: 'missing-pid' };
  }

  const result = await cleanupProcessTree(session.pid, signal);
  const cleanup = {
    pid: session.pid,
    reason: reason || 'cleanup',
    signal: signal || 'SIGTERM',
    method: result.method,
    at: nowIso(),
    error: result.error || null,
  };

  updateSession(projectDir, {
    status: result.success ? 'stopped' : 'cleanup-failed',
    cleanup,
    lastSeen: nowIso(),
  });

  return { outcome: result.success ? 'stopped' : 'cleanup-failed', cleanup };
}

function shouldReuseSession(session, runtime, platform) {
  if (!session) return false;
  if (session.platform !== platform) return false;
  if (session.mode !== runtime.mode) return false;
  if (session.status === 'stopped' || session.status === 'cleanup-failed' || session.status === 'stale') {
    return false;
  }
  return true;
}

function runStaticPreview(runtime, projectDir, options, portConflict) {
  const previewTarget = resolvePreviewTarget(runtime, projectDir);
  const sessionPath = resolveSessionPath(projectDir);

  console.log(`[motif] Static preview target: ${previewTarget}`);
  logSessionHeader(sessionPath);

  if (options.dryRun) {
    // Record a dry-run entry in the session store for verification
    sessionStore.recordProcess(projectDir, {
      pid: process.pid,
      platform: options.platform,
      role: 'preview',
      url: previewTarget,
      port: null,
      source: options.source,
    });
    openPreview(previewTarget, runtime, true);
    console.log('[dry-run] Session metadata written to store');
    return;
  }

  writeSession(projectDir, {
    projectRoot: projectDir,
    platform: options.platform,
    mode: 'static-preview',
    status: 'starting',
    previewTarget,
    url: previewTarget,
    port: null,
    startedAt: nowIso(),
    source: options.source,
    portConflict: portConflict || null,
  });

  openPreview(previewTarget, runtime, false);

  // Record in session store for cleanup tracking
  sessionStore.recordProcess(projectDir, {
    pid: process.pid,
    platform: options.platform,
    role: 'preview',
    url: previewTarget,
    port: null,
    source: options.source,
  });

  updateSession(projectDir, {
    status: 'ready',
    previewTarget,
    url: previewTarget,
    openedAt: nowIso(),
    lastSeen: nowIso(),
    lastAction: 'launch',
  });
}

async function runDaemon(runtime, projectDir, options, portConflict) {
  if (!runtime.command) {
    throw new Error('Runtime command is missing for daemon mode');
  }

  const command = runtime.command;
  const args = Array.isArray(runtime.args) ? runtime.args : [];
  const cwd = resolveCwd(runtime, projectDir);
  const sessionPath = resolveSessionPath(projectDir);

  if (options.dryRun) {
    console.log(`[dry-run] (${cwd}) ${command} ${args.join(' ')}`);
    const previewUrl = runtime.defaultUrl || 'http://localhost';
    // Record a dry-run entry in the session store for verification
    sessionStore.recordProcess(projectDir, {
      pid: process.pid,
      platform: options.platform,
      role: 'dev-server',
      url: previewUrl,
      port: runtime.defaultPort || null,
      source: options.source,
    });
    openPreview(previewUrl, runtime, true);
    console.log('[dry-run] Session metadata written to store');

    // If --signal was passed, simulate cleanup of tracked PIDs
    if (options.signal) {
      console.log(`[dry-run] Simulating ${options.signal} cleanup`);
      const active = sessionStore.getActiveSessions(projectDir);
      for (const s of active) {
        sessionStore.markStopped(projectDir, s.pid, `simulated-${options.signal}`, null);
        console.log(`[dry-run] Cleaned up PID ${s.pid} (${s.role})`);
      }
      console.log(`[dry-run] Cleanup complete: ${active.length} session(s) stopped`);
    }
    return;
  }

  writeSession(projectDir, {
    projectRoot: projectDir,
    platform: options.platform,
    mode: 'daemon',
    status: 'starting',
    port: runtime.defaultPort || null,
    url: runtime.defaultUrl || null,
    startedAt: nowIso(),
    source: options.source,
    launch: {
      command,
      args,
      cwd,
    },
    portConflict: portConflict || null,
  });

  const child = spawn(command, args, {
    cwd,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
    detached: true,
  });

  console.log(`[motif] Launched ${formatCommand(command, args)} (pid ${child.pid})`);
  logSessionHeader(sessionPath);

  updateSession(projectDir, {
    pid: child.pid,
    lastSeen: nowIso(),
  });

  // Record in session store for multi-PID cleanup tracking
  sessionStore.recordProcess(projectDir, {
    pid: child.pid,
    platform: options.platform,
    role: 'dev-server',
    url: runtime.defaultUrl || null,
    port: runtime.defaultPort || null,
    source: options.source,
  });

  let outputBuffer = '';
  let readyResolved = false;
  let cleanupInProgress = false;

  const cleanupLauncher = async (signal, reason) => {
    if (cleanupInProgress) return;
    cleanupInProgress = true;

    // Kill all tracked PIDs in reverse order via session store
    const activeSessions = sessionStore.getActiveSessions(projectDir);
    for (let i = activeSessions.length - 1; i >= 0; i--) {
      const s = activeSessions[i];
      if (s.pid && isPidAlive(s.pid)) {
        try {
          process.kill(s.pid, signal || 'SIGTERM');
          sessionStore.markStopped(projectDir, s.pid, `signal-${signal}`, null);
        } catch (err) {
          sessionStore.markStopped(projectDir, s.pid, `signal-${signal}`, err.message);
        }
      } else {
        sessionStore.markStopped(projectDir, s.pid, 'already-dead', null);
      }
    }

    // Also run the existing single-session cleanup
    const currentSession = readSession(projectDir) || {};
    const outcome = await cleanupTrackedSession(
      projectDir,
      { ...currentSession, pid: child.pid, mode: 'daemon' },
      reason,
      signal
    );
    if (outcome.outcome === 'cleanup-failed') {
      console.warn('[motif] Cleanup failed. Manual process termination may be required.');
    }
  };

  const handleOutput = (chunk) => {
    if (readyResolved) return;
    outputBuffer += chunk.toString();
    const result = parseOutputForReady(outputBuffer, runtime);
    if (result.ready) {
      readyResolved = true;
      const previewUrl = result.url || runtime.defaultUrl;
      const resolvedPort = parsePortFromUrl(previewUrl) || runtime.defaultPort || null;
      if (previewUrl) {
        console.log(`[motif] Ready. Opening preview at ${previewUrl}`);
        openPreview(previewUrl, runtime, false);
      } else {
        console.warn('[motif] Ready signal detected but no preview URL found');
      }

      updateSession(projectDir, {
        status: 'ready',
        url: previewUrl || null,
        port: resolvedPort,
        openedAt: nowIso(),
        lastSeen: nowIso(),
        lastAction: 'launch',
      });

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
      updateSession(projectDir, {
        status: 'stopped',
        lastSeen: nowIso(),
        error: error.message,
      });
      console.error(`[motif] Runtime launch failed: ${error.message}`);
      process.exit(1);
    }
  });

  child.on('exit', (code, signal) => {
    if (!readyResolved) {
      updateSession(projectDir, {
        status: 'stopped',
        lastSeen: nowIso(),
        exitCode: code,
        exitSignal: signal,
      });
      console.error(`[motif] Runtime exited before readiness (code ${code})`);
      process.exit(code || 1);
    }
  });

  process.once('SIGINT', async () => {
    await cleanupLauncher('SIGINT', 'sigint');
    process.exit(1);
  });

  process.once('SIGTERM', async () => {
    await cleanupLauncher('SIGTERM', 'sigterm');
    process.exit(1);
  });

  // Synchronous exit handler -- best-effort cleanup for unclean exits
  process.once('exit', () => {
    if (cleanupInProgress) return;
    const activeSessions = sessionStore.getActiveSessions(projectDir);
    for (let i = activeSessions.length - 1; i >= 0; i--) {
      const s = activeSessions[i];
      if (s.pid && isPidAlive(s.pid)) {
        try {
          process.kill(s.pid, 'SIGTERM');
        } catch {
          // best-effort in exit handler
        }
        sessionStore.markStopped(projectDir, s.pid, 'exit-handler', null);
      }
    }
  });
}

async function main() {
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

  // Refresh liveness and prune stale sessions before launching
  sessionStore.refreshLiveness(projectDir);
  const pruned = sessionStore.pruneStale(projectDir);
  if (pruned > 0) {
    console.log(`[motif] Pruned ${pruned} stale session(s) from store`);
  }

  console.log(`[motif] Platform: ${options.platform}`);
  console.log(`[motif] Project: ${projectDir}`);
  console.log(`[motif] Source: ${options.source}`);

  const sessionPath = resolveSessionPath(projectDir);
  const existingSession = readSession(projectDir);

  if (existingSession) {
    if (existingSession.mode === 'daemon') {
      const staleInfo = detectStaleSession(existingSession);
      if (staleInfo.stale) {
        markSessionStale(projectDir, staleInfo.reason || 'stale');
        console.warn(`[motif] Found stale session (${staleInfo.reason}). Clearing before launch.`);
      } else if (shouldReuseSession(existingSession, runtime, options.platform)) {
        console.log(`[motif] Active session detected (pid ${existingSession.pid}). Reusing.`);
        logSessionHeader(sessionPath);
        const previewUrl = existingSession.url || runtime.defaultUrl;
        if (previewUrl) {
          openPreview(previewUrl, runtime, options.dryRun);
        } else {
          console.warn('[motif] Active session has no URL. Reopen manually if needed.');
        }
        updateSession(projectDir, {
          status: 'ready',
          lastSeen: nowIso(),
          lastAction: 'reuse',
          reopenedAt: nowIso(),
        });
        return;
      } else {
        console.log('[motif] Active session found for a different runtime. Restarting.');
        await cleanupTrackedSession(projectDir, existingSession, 'restart', 'SIGTERM');
      }
    } else if (shouldReuseSession(existingSession, runtime, options.platform)) {
      console.log('[motif] Static preview already recorded. Reopening preview.');
      logSessionHeader(sessionPath);
      const previewTarget = existingSession.previewTarget || resolvePreviewTarget(runtime, projectDir);
      openPreview(previewTarget, runtime, options.dryRun);
      updateSession(projectDir, {
        status: 'ready',
        lastSeen: nowIso(),
        lastAction: 'reuse',
        reopenedAt: nowIso(),
      });
      return;
    }
  }

  let portConflict = null;
  if (runtime.mode === 'daemon' && runtime.defaultPort) {
    const portStatus = await checkPortAvailability(runtime.defaultPort);
    if (!portStatus.available) {
      portConflict = {
        port: runtime.defaultPort,
        owner: 'external',
        status: 'busy',
        decision: 'continue',
        reason: portStatus.reason || 'in-use',
      };
      console.warn(`[motif] Port ${runtime.defaultPort} is busy. Leaving it untouched and continuing.`);
    }
  }

  if (runtime.mode === 'static-preview') {
    runStaticPreview(runtime, projectDir, options, portConflict);
    return;
  }

  if (runtime.mode !== 'daemon') {
    throw new Error(`Unsupported runtime mode: ${runtime.mode}`);
  }

  await runDaemon(runtime, projectDir, options, portConflict);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Runtime launcher failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  buildOpenCommand,
  parseOutputForReady,
  resolvePreviewTarget,
  resolveProjectDirectory,
};
