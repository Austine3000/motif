#!/usr/bin/env node
'use strict';

/**
 * Phase 28 Runtime Cleanup Check
 *
 * Wave-0 harness that exercises the session store cleanup logic without
 * requiring real dev-server runtimes. It spawns lightweight stub processes
 * (sleep loops), records them in the session store, sends signals, and
 * verifies the PIDs are gone and the store reflects the cleanup.
 *
 * Exit codes:
 *   0 = all checks passed
 *   1 = one or more checks failed
 */

const { spawn } = require('node:child_process');
const path = require('node:path');
const net = require('node:net');

const sessionStore = require('./auto-run-session-store');
const { isPidAlive } = require('./runtime-session');

const PROJECT_ROOT = process.cwd();
const PASS = 'PASS';
const FAIL = 'FAIL';
const results = [];

function log(label, status, detail) {
  const tag = status === PASS ? '[PASS]' : '[FAIL]';
  console.log(`  ${tag} ${label}${detail ? ': ' + detail : ''}`);
  results.push({ label, status, detail });
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Spawn a lightweight stub process that sleeps for a while.
 * Returns the child process object.
 */
function spawnStub(label) {
  // Use node -e to run a blocking sleep (cross-platform)
  const child = spawn(process.execPath, ['-e', 'setTimeout(()=>{},120000)'], {
    stdio: 'ignore',
    detached: false,
  });
  return child;
}

/**
 * Check if a port is free by attempting to listen on it.
 */
function isPortFree(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

// ---------------------------------------------------------------------------
// Test: Record stub processes, then clean them up via signal simulation
// ---------------------------------------------------------------------------

async function testCleanupFlow() {
  console.log('\n--- Test: Cleanup flow with stub processes ---\n');

  // Clear any prior state
  sessionStore.clearStore(PROJECT_ROOT);

  // 1. Spawn two stub processes
  const stub1 = spawnStub('stub-server-1');
  const stub2 = spawnStub('stub-server-2');

  if (!stub1.pid || !stub2.pid) {
    log('Spawn stubs', FAIL, 'Could not spawn stub processes');
    return;
  }

  log('Spawn stubs', PASS, `PIDs: ${stub1.pid}, ${stub2.pid}`);

  // 2. Record them in the session store
  sessionStore.recordProcess(PROJECT_ROOT, {
    pid: stub1.pid,
    platform: 'web-nextjs',
    role: 'dev-server',
    url: 'http://localhost:3000',
    port: 3000,
    source: 'test-harness',
  });

  sessionStore.recordProcess(PROJECT_ROOT, {
    pid: stub2.pid,
    platform: 'web-nextjs',
    role: 'browser-opener',
    url: null,
    port: null,
    source: 'test-harness',
  });

  const active = sessionStore.getActiveSessions(PROJECT_ROOT);
  log('Record sessions', active.length === 2 ? PASS : FAIL, `${active.length} active sessions`);

  // 3. Verify PIDs are alive
  const alive1 = isPidAlive(stub1.pid);
  const alive2 = isPidAlive(stub2.pid);
  log('PIDs alive before cleanup', (alive1 && alive2) ? PASS : FAIL, `stub1=${alive1} stub2=${alive2}`);

  // 4. Kill them in reverse order (simulating cleanup handler logic)
  const allActive = sessionStore.getActiveSessions(PROJECT_ROOT);
  for (let i = allActive.length - 1; i >= 0; i--) {
    const s = allActive[i];
    try {
      process.kill(s.pid, 'SIGTERM');
      sessionStore.markStopped(PROJECT_ROOT, s.pid, 'SIGTERM', null);
    } catch (err) {
      sessionStore.markStopped(PROJECT_ROOT, s.pid, 'SIGTERM', err.message);
    }
  }

  // Wait briefly for processes to exit
  await sleep(300);

  // 5. Verify PIDs are dead
  const dead1 = !isPidAlive(stub1.pid);
  const dead2 = !isPidAlive(stub2.pid);
  log('PIDs dead after cleanup', (dead1 && dead2) ? PASS : FAIL, `stub1-dead=${dead1} stub2-dead=${dead2}`);

  // 6. Verify session store reflects cleanup
  const remaining = sessionStore.getActiveSessions(PROJECT_ROOT);
  log('No active sessions remain', remaining.length === 0 ? PASS : FAIL, `${remaining.length} active`);

  const all = sessionStore.getAllSessions(PROJECT_ROOT);
  const allStopped = all.every((s) => s.status === 'stopped');
  log('All sessions marked stopped', allStopped ? PASS : FAIL, `${all.filter(s => s.status === 'stopped').length}/${all.length} stopped`);
}

// ---------------------------------------------------------------------------
// Test: Stale session detection via refreshLiveness
// ---------------------------------------------------------------------------

async function testRefreshLiveness() {
  console.log('\n--- Test: Refresh liveness marks dead PIDs ---\n');

  sessionStore.clearStore(PROJECT_ROOT);

  // Spawn a stub, record it, then kill it without marking in store
  const stub = spawnStub('liveness-test');
  sessionStore.recordProcess(PROJECT_ROOT, {
    pid: stub.pid,
    platform: 'web-vite',
    role: 'dev-server',
    url: 'http://localhost:5173',
    port: 5173,
    source: 'test-harness',
  });

  // Kill the process manually
  try { process.kill(stub.pid, 'SIGTERM'); } catch { /* ignore */ }
  await sleep(300);

  // Store still thinks it is running
  const beforeRefresh = sessionStore.getActiveSessions(PROJECT_ROOT);
  log('Before refresh: active', beforeRefresh.length === 1 ? PASS : FAIL, `${beforeRefresh.length} active`);

  // Refresh liveness
  const changed = sessionStore.refreshLiveness(PROJECT_ROOT);
  log('Refresh detected change', changed ? PASS : FAIL, `changed=${changed}`);

  const afterRefresh = sessionStore.getActiveSessions(PROJECT_ROOT);
  log('After refresh: no active', afterRefresh.length === 0 ? PASS : FAIL, `${afterRefresh.length} active`);
}

// ---------------------------------------------------------------------------
// Test: Dry-run with --signal simulates cleanup
// ---------------------------------------------------------------------------

async function testDryRunSignal() {
  console.log('\n--- Test: Launcher dry-run with --signal SIGINT ---\n');

  sessionStore.clearStore(PROJECT_ROOT);

  // Run the launcher in dry-run + signal mode
  const child = spawn(process.execPath, [
    path.resolve(__dirname, 'runtime-launcher.js'),
    '--platform', 'web-nextjs',
    '--dry-run',
    '--signal', 'SIGINT',
  ], {
    cwd: PROJECT_ROOT,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: process.env,
  });

  let output = '';
  child.stdout.on('data', (chunk) => { output += chunk.toString(); });
  child.stderr.on('data', (chunk) => { output += chunk.toString(); });

  await new Promise((resolve) => child.on('exit', resolve));

  const hasMetadataWrite = output.includes('Session metadata written to store');
  log('Dry-run writes session metadata', hasMetadataWrite ? PASS : FAIL, '');

  const hasCleanupMsg = output.includes('Simulating SIGINT cleanup');
  log('Dry-run simulates SIGINT cleanup', hasCleanupMsg ? PASS : FAIL, '');

  const hasCleanupComplete = output.includes('Cleanup complete');
  log('Dry-run cleanup completes', hasCleanupComplete ? PASS : FAIL, '');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('Phase 28 Runtime Cleanup Check');
  console.log('==============================');

  await testCleanupFlow();
  await testRefreshLiveness();
  await testDryRunSignal();

  // Clean up test artifacts
  sessionStore.clearStore(PROJECT_ROOT);

  console.log('\n--- Summary ---\n');
  const passed = results.filter((r) => r.status === PASS).length;
  const failed = results.filter((r) => r.status === FAIL).length;
  console.log(`  ${passed} passed, ${failed} failed, ${results.length} total`);

  if (failed > 0) {
    console.log('\n  Failed checks:');
    for (const r of results.filter((r) => r.status === FAIL)) {
      console.log(`    - ${r.label}: ${r.detail || 'no detail'}`);
    }
    process.exit(1);
  }

  console.log('\n  All checks passed.');
  process.exit(0);
}

main().catch((err) => {
  console.error(`Harness failed: ${err.message}`);
  process.exit(1);
});
