#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const FIXTURES_DIR = path.join(ROOT_DIR, '.claude', 'get-motif', 'fixtures', 'phase25');
const LOGS_DIR = path.join(FIXTURES_DIR, 'logs');
const STATIC_DIR = path.join(FIXTURES_DIR, 'static');
const STUBS_DIR = path.join(FIXTURES_DIR, 'stubs');
const SESSIONS_DIR = path.join(FIXTURES_DIR, 'sessions');

const REGISTRY_PATH = path.join(ROOT_DIR, '.claude', 'get-motif', 'references', 'framework-registry.json');
const LAUNCHER_PATH = path.join(ROOT_DIR, '.claude', 'get-motif', 'scripts', 'runtime-launcher.js');
const COMPOSE_SCREEN_PATH = path.join(ROOT_DIR, '.claude', 'get-motif', 'workflows', 'compose-screen.md');

function printHelp() {
  console.log('Usage: node .claude/get-motif/scripts/phase25-auto-run-check.js <quick|full> [--target <name>]');
  console.log('');
  console.log('Modes:');
  console.log('  quick                 Run a fast subset (or a single --target)');
  console.log('  full                  Run all targets (skips unfinished targets unless explicitly targeted)');
  console.log('');
  console.log('Targets:');
  console.log('  wave0-fixtures');
  console.log('  launcher-contract');
  console.log('  compose-auto-run');
  console.log('  runtime-session');
  console.log('  cleanup-signal');
  console.log('  port-policy');
  console.log('  reuse-restart');
  console.log('  status-surface');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const mode = args.find((arg) => !arg.startsWith('-'));
  if (!mode || (mode !== 'quick' && mode !== 'full')) {
    printHelp();
    process.exit(1);
  }

  let target = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target' && args[i + 1]) {
      target = args[i + 1];
      break;
    }
  }

  return { mode, target };
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function result(target, status, message) {
  return { target, status, message };
}

function pass(target, message) {
  return result(target, 'pass', message);
}

function fail(target, message) {
  return result(target, 'fail', message);
}

function skip(target, message) {
  return result(target, 'skip', message);
}

function enforceOrSkip(target, strict, condition, failureMessage, skipMessage) {
  if (condition) {
    return null;
  }
  if (strict) {
    return fail(target, failureMessage);
  }
  return skip(target, skipMessage || failureMessage);
}

function loadRegistry(target, strict) {
  if (!exists(REGISTRY_PATH)) {
    const soft = enforceOrSkip(
      target,
      strict,
      false,
      `Missing registry: ${REGISTRY_PATH}`,
      'Registry not available yet'
    );
    return { soft, registry: null };
  }

  try {
    return { soft: null, registry: readJson(REGISTRY_PATH) };
  } catch (error) {
    return {
      soft: fail(target, `Invalid JSON in framework registry: ${error.message}`),
      registry: null,
    };
  }
}

function checkWave0Fixtures(strict) {
  const target = 'wave0-fixtures';
  const results = [];

  if (!exists(FIXTURES_DIR)) {
    return [
      strict
        ? fail(target, `Missing fixture directory: ${FIXTURES_DIR}`)
        : skip(target, 'Fixture directory not created yet'),
    ];
  }

  const requiredPaths = [
    path.join(LOGS_DIR, 'nextjs-ready.txt'),
    path.join(LOGS_DIR, 'vite-ready.txt'),
    path.join(LOGS_DIR, 'unknown-output.txt'),
    path.join(STATIC_DIR, 'index.html'),
    path.join(STUBS_DIR, 'mock-dev-server.js'),
    path.join(STUBS_DIR, 'port-holder.js'),
    path.join(SESSIONS_DIR, 'active-session.json'),
    path.join(SESSIONS_DIR, 'stale-session.json'),
    path.join(SESSIONS_DIR, 'untracked-port.json'),
  ];

  for (const filePath of requiredPaths) {
    if (!exists(filePath)) {
      results.push(fail(target, `Missing fixture file: ${filePath}`));
    }
  }

  if (results.length > 0) return results;

  const nextLog = readText(path.join(LOGS_DIR, 'nextjs-ready.txt'));
  if (/Ready in/i.test(nextLog) && /https?:\/\/localhost:\d+/.test(nextLog)) {
    results.push(pass(target, 'Next.js ready log includes readiness and URL output'));
  } else {
    results.push(fail(target, 'Next.js ready log missing readiness signal or URL'));
  }

  const viteLog = readText(path.join(LOGS_DIR, 'vite-ready.txt'));
  if (/Local:\s+http:\/\/localhost:\d+\//.test(viteLog)) {
    results.push(pass(target, 'Vite ready log includes Local URL output'));
  } else {
    results.push(fail(target, 'Vite ready log missing Local URL output'));
  }

  const unknownLog = readText(path.join(LOGS_DIR, 'unknown-output.txt'));
  if (/https?:\/\//.test(unknownLog)) {
    results.push(fail(target, 'Unknown log should not include URL-like output'));
  } else {
    results.push(pass(target, 'Unknown log contains no URL-like output'));
  }

  const staticHtml = readText(path.join(STATIC_DIR, 'index.html'));
  if (/Motif Static Preview/.test(staticHtml)) {
    results.push(pass(target, 'Static preview target contains expected marker text'));
  } else {
    results.push(fail(target, 'Static preview target missing expected marker text'));
  }

  const sessionFiles = ['active-session.json', 'stale-session.json', 'untracked-port.json'];
  for (const fileName of sessionFiles) {
    const data = readJson(path.join(SESSIONS_DIR, fileName));
    if (!data || typeof data !== 'object') {
      results.push(fail(target, `Session fixture ${fileName} is not valid JSON`));
      continue;
    }
    if (fileName === 'untracked-port.json') {
      const required = ['port', 'pid', 'status', 'decision'];
      const missing = required.filter((key) => !(key in data));
      if (missing.length === 0) {
        results.push(pass(target, `${fileName} includes untracked-port decision fields`));
      } else {
        results.push(fail(target, `${fileName} missing fields: ${missing.join(', ')}`));
      }
    } else {
      const required = ['platform', 'pid', 'status', 'port', 'url', 'mode'];
      const missing = required.filter((key) => !(key in data));
      if (missing.length === 0) {
        results.push(pass(target, `${fileName} includes session tracking fields`));
      } else {
        results.push(fail(target, `${fileName} missing fields: ${missing.join(', ')}`));
      }
    }
  }

  return results;
}

function loadLauncher(target, strict) {
  if (!exists(LAUNCHER_PATH)) {
    const soft = enforceOrSkip(
      target,
      strict,
      false,
      `Missing launcher: ${LAUNCHER_PATH}`,
      'Launcher not implemented yet'
    );
    return { soft, launcher: null };
  }

  try {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const launcher = require(LAUNCHER_PATH);
    return { soft: null, launcher };
  } catch (error) {
    return { soft: fail(target, `Failed to load runtime launcher: ${error.message}`), launcher: null };
  }
}

function checkLauncherContract(strict) {
  const target = 'launcher-contract';
  const results = [];

  const { soft: registrySoft, registry } = loadRegistry(target, strict);
  if (registrySoft) return [registrySoft];

  const { soft: launcherSoft, launcher } = loadLauncher(target, strict);
  if (launcherSoft) return [launcherSoft];

  const requiredFunctions = ['buildOpenCommand', 'parseOutputForReady'];
  for (const fn of requiredFunctions) {
    if (launcher && typeof launcher[fn] === 'function') {
      results.push(pass(target, `runtime-launcher exports ${fn}()`));
    } else {
      results.push(fail(target, `runtime-launcher missing export: ${fn}()`));
    }
  }

  const platforms = ['web-nextjs', 'web-vite', 'web-static'];
  for (const platform of platforms) {
    const entry = registry[platform];
    if (!entry || !entry.devServer) {
      results.push(fail(target, `${platform} is missing devServer runtime metadata`));
      continue;
    }

    const devServer = entry.devServer;
    const required = ['mode', 'cwdPolicy', 'openStrategy'];
    const missing = required.filter((key) => !(key in devServer));
    if (missing.length > 0) {
      results.push(fail(target, `${platform}.devServer missing fields: ${missing.join(', ')}`));
    } else {
      results.push(pass(target, `${platform}.devServer contains mode/cwdPolicy/openStrategy`));
    }

    if (platform === 'web-static') {
      if (devServer.mode !== 'static-preview') {
        results.push(fail(target, 'web-static devServer.mode must be static-preview'));
      }
      if (!devServer.previewTarget) {
        results.push(fail(target, 'web-static devServer.previewTarget is required'));
      }
    } else {
      if (devServer.mode !== 'daemon') {
        results.push(fail(target, `${platform} devServer.mode must be daemon`));
      }
      if (!Array.isArray(devServer.readyMatchers) || devServer.readyMatchers.length === 0) {
        results.push(fail(target, `${platform} devServer.readyMatchers must be a non-empty array`));
      } else {
        results.push(pass(target, `${platform} devServer.readyMatchers declared`));
      }
      if (!devServer.defaultUrl) {
        results.push(fail(target, `${platform} devServer.defaultUrl is required`));
      }
    }
  }

  if (launcher && typeof launcher.buildOpenCommand === 'function') {
    const targetUrl = 'http://localhost:3000';
    const mac = launcher.buildOpenCommand(targetUrl, 'darwin');
    const linux = launcher.buildOpenCommand(targetUrl, 'linux');
    const windows = launcher.buildOpenCommand(targetUrl, 'win32');

    if (mac && mac.command === 'open') {
      results.push(pass(target, 'macOS opener uses `open`'));
    } else {
      results.push(fail(target, 'macOS opener must use `open`'));
    }

    if (linux && linux.command === 'xdg-open') {
      results.push(pass(target, 'Linux opener uses `xdg-open`'));
    } else {
      results.push(fail(target, 'Linux opener must use `xdg-open`'));
    }

    if (windows && windows.command === 'cmd' && Array.isArray(windows.args) && windows.args.includes('/c')) {
      results.push(pass(target, 'Windows opener uses `cmd /c start`'));
    } else {
      results.push(fail(target, 'Windows opener must use `cmd /c start`'));
    }
  }

  if (launcher && typeof launcher.parseOutputForReady === 'function') {
    const nextLog = readText(path.join(LOGS_DIR, 'nextjs-ready.txt'));
    const viteLog = readText(path.join(LOGS_DIR, 'vite-ready.txt'));
    const unknownLog = readText(path.join(LOGS_DIR, 'unknown-output.txt'));

    const nextEntry = registry['web-nextjs'];
    const viteEntry = registry['web-vite'];

    const nextResult = launcher.parseOutputForReady(nextLog, nextEntry.devServer);
    const viteResult = launcher.parseOutputForReady(viteLog, viteEntry.devServer);
    const unknownResult = launcher.parseOutputForReady(unknownLog, nextEntry.devServer);

    if (nextResult.ready && nextResult.url) {
      results.push(pass(target, 'Next.js ready output parses and extracts URL'));
    } else {
      results.push(fail(target, 'Next.js ready output did not parse as ready with URL'));
    }

    if (viteResult.ready && viteResult.url) {
      results.push(pass(target, 'Vite ready output parses and extracts URL'));
    } else {
      results.push(fail(target, 'Vite ready output did not parse as ready with URL'));
    }

    if (!unknownResult.ready) {
      results.push(pass(target, 'Unknown output does not trigger readiness'));
    } else {
      results.push(fail(target, 'Unknown output incorrectly triggers readiness'));
    }
  }

  return results;
}

function checkComposeAutoRun(strict) {
  const target = 'compose-auto-run';
  if (!exists(COMPOSE_SCREEN_PATH)) {
    return [
      strict
        ? fail(target, `Missing compose-screen workflow: ${COMPOSE_SCREEN_PATH}`)
        : skip(target, 'compose-screen workflow not available'),
    ];
  }

  const text = readText(COMPOSE_SCREEN_PATH);
  const results = [];

  const hasLauncher = /runtime-launcher\.js/.test(text);
  const hasAutoRun = /auto-run|auto run|autorun/i.test(text);
  const hasRegistry = /framework-registry\.json/.test(text);

  if (!strict && (!hasLauncher || !hasAutoRun || !hasRegistry)) {
    return [skip(target, 'compose-screen auto-run branch not implemented yet')];
  }

  if (hasLauncher) {
    results.push(pass(target, 'compose-screen delegates to runtime-launcher.js'));
  } else {
    results.push(fail(target, 'compose-screen must invoke runtime-launcher.js'));
  }

  if (hasAutoRun) {
    results.push(pass(target, 'compose-screen references auto-run option'));
  } else {
    results.push(fail(target, 'compose-screen missing auto-run prompt language'));
  }

  if (hasRegistry) {
    results.push(pass(target, 'compose-screen references framework registry for runtime checks'));
  } else {
    results.push(fail(target, 'compose-screen must reference framework registry for runtime checks'));
  }

  if (/warning/i.test(text) || /warn/i.test(text)) {
    results.push(pass(target, 'compose-screen includes warning path for launcher failures'));
  } else {
    results.push(fail(target, 'compose-screen should warn (not fail) on launcher errors'));
  }

  return results;
}

function checkRuntimeSession(strict) {
  const target = 'runtime-session';
  const guard = enforceOrSkip(
    target,
    strict,
    exists(SESSIONS_DIR),
    `Missing session fixtures: ${SESSIONS_DIR}`,
    'Session fixtures not ready'
  );
  if (guard) return [guard];

  const active = readJson(path.join(SESSIONS_DIR, 'active-session.json'));
  if (active && active.status && active.pid) {
    return [pass(target, 'Active session fixture contains tracked runtime data')];
  }

  return [fail(target, 'Active session fixture missing required runtime data')];
}

function checkCleanupSignal(strict) {
  const target = 'cleanup-signal';
  const guard = enforceOrSkip(
    target,
    strict,
    exists(path.join(STUBS_DIR, 'port-holder.js')),
    `Missing cleanup stub: ${STUBS_DIR}/port-holder.js`,
    'Cleanup stub not ready'
  );
  if (guard) return [guard];
  return [pass(target, 'Cleanup stub script exists for signal tests')];
}

function checkPortPolicy(strict) {
  const target = 'port-policy';
  const guard = enforceOrSkip(
    target,
    strict,
    exists(path.join(SESSIONS_DIR, 'untracked-port.json')),
    `Missing untracked port fixture: ${SESSIONS_DIR}/untracked-port.json`,
    'Port-policy fixtures not ready'
  );
  if (guard) return [guard];
  return [pass(target, 'Untracked-port fixture available for port-policy tests')];
}

function checkReuseRestart(strict) {
  const target = 'reuse-restart';
  const guard = enforceOrSkip(
    target,
    strict,
    exists(path.join(SESSIONS_DIR, 'active-session.json')),
    `Missing active session fixture: ${SESSIONS_DIR}/active-session.json`,
    'Reuse/restart fixtures not ready'
  );
  if (guard) return [guard];
  return [pass(target, 'Active session fixture available for reuse/restart tests')];
}

function checkStatusSurface(strict) {
  const target = 'status-surface';
  const guard = enforceOrSkip(
    target,
    strict,
    exists(path.join(SESSIONS_DIR, 'active-session.json')),
    `Missing status fixture: ${SESSIONS_DIR}/active-session.json`,
    'Status fixtures not ready'
  );
  if (guard) return [guard];
  return [pass(target, 'Status fixture available for runtime status surface')];
}

const TARGET_CHECKS = {
  'wave0-fixtures': checkWave0Fixtures,
  'launcher-contract': checkLauncherContract,
  'compose-auto-run': checkComposeAutoRun,
  'runtime-session': checkRuntimeSession,
  'cleanup-signal': checkCleanupSignal,
  'port-policy': checkPortPolicy,
  'reuse-restart': checkReuseRestart,
  'status-surface': checkStatusSurface,
};

function run(mode, targetArg) {
  if (targetArg && !TARGET_CHECKS[targetArg]) {
    console.error(`Unknown target: ${targetArg}`);
    process.exit(1);
  }

  let targets;
  let strict = false;

  if (targetArg) {
    targets = [targetArg];
    strict = true;
  } else if (mode === 'quick') {
    targets = ['wave0-fixtures', 'launcher-contract', 'compose-auto-run'];
  } else {
    targets = Object.keys(TARGET_CHECKS);
  }

  const results = [];
  for (const target of targets) {
    const targetResults = TARGET_CHECKS[target](strict);
    results.push(...targetResults);
  }

  const counts = { pass: 0, fail: 0, skip: 0 };
  for (const item of results) {
    counts[item.status] += 1;
    const tag = item.status.toUpperCase().padEnd(4, ' ');
    console.log(`[${tag}] ${item.target}: ${item.message}`);
  }

  console.log('');
  console.log(`Summary: ${counts.pass} passed, ${counts.fail} failed, ${counts.skip} skipped`);
  if (counts.fail > 0) {
    process.exit(1);
  }
}

const { mode, target } = parseArgs(process.argv);
run(mode, target);
