#!/usr/bin/env node
'use strict';

/**
 * Auto-Run Session Store
 *
 * Manages tracked PIDs (spawned dev servers, browser opener tokens) and
 * persists them near .planning/STATE.md. Provides an API to query the
 * store so cleanup logic can enumerate live sessions.
 *
 * Storage location: .planning/runtime/session-store.json
 */

const fs = require('node:fs');
const path = require('node:path');

const { isPidAlive, nowIso } = require('./runtime-session');

const STORE_DIR_NAME = 'runtime';
const STORE_FILE_NAME = 'session-store.json';

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

function resolveStoreDir(projectRoot) {
  return path.join(projectRoot, '.planning', STORE_DIR_NAME);
}

function resolveStorePath(projectRoot) {
  return path.join(resolveStoreDir(projectRoot), STORE_FILE_NAME);
}

function ensureStoreDir(projectRoot) {
  fs.mkdirSync(resolveStoreDir(projectRoot), { recursive: true });
}

// ---------------------------------------------------------------------------
// Store CRUD
// ---------------------------------------------------------------------------

function readStore(projectRoot) {
  const storePath = resolveStorePath(projectRoot);
  if (!fs.existsSync(storePath)) {
    return { sessions: [], updatedAt: null };
  }
  try {
    const raw = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    if (!raw || typeof raw !== 'object') return { sessions: [], updatedAt: null };
    if (!Array.isArray(raw.sessions)) raw.sessions = [];
    return raw;
  } catch {
    return { sessions: [], updatedAt: null };
  }
}

function writeStore(projectRoot, store) {
  ensureStoreDir(projectRoot);
  const storePath = resolveStorePath(projectRoot);
  const tmpPath = `${storePath}.tmp`;
  const data = {
    ...store,
    updatedAt: nowIso(),
  };
  fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2));
  fs.renameSync(tmpPath, storePath);
  return data;
}

// ---------------------------------------------------------------------------
// Session entry management
// ---------------------------------------------------------------------------

/**
 * Record a spawned process in the session store.
 *
 * @param {string} projectRoot
 * @param {object} entry
 * @param {number} entry.pid - OS process ID
 * @param {string} entry.platform - e.g. "web-nextjs"
 * @param {string} entry.role - "dev-server" | "browser-opener" | "preview"
 * @param {string|null} entry.url - preview URL if known
 * @param {number|null} entry.port - port if known
 * @param {string} entry.source - launch source label
 * @returns {object} the recorded entry
 */
function recordProcess(projectRoot, entry) {
  const store = readStore(projectRoot);
  const record = {
    pid: entry.pid,
    platform: entry.platform || 'unknown',
    role: entry.role || 'dev-server',
    url: entry.url || null,
    port: entry.port || null,
    source: entry.source || 'unknown',
    osPlatform: process.platform,
    startedAt: nowIso(),
    status: 'running',
    stoppedAt: null,
    cleanupMethod: null,
    cleanupError: null,
  };

  store.sessions.push(record);
  writeStore(projectRoot, store);
  return record;
}

/**
 * Mark a tracked PID as stopped in the store.
 */
function markStopped(projectRoot, pid, method, error) {
  const store = readStore(projectRoot);
  let found = false;
  for (const session of store.sessions) {
    if (session.pid === pid && session.status === 'running') {
      session.status = 'stopped';
      session.stoppedAt = nowIso();
      session.cleanupMethod = method || 'unknown';
      session.cleanupError = error || null;
      found = true;
      break;
    }
  }
  if (found) writeStore(projectRoot, store);
  return found;
}

/**
 * Return all sessions currently marked as running.
 */
function getActiveSessions(projectRoot) {
  const store = readStore(projectRoot);
  return store.sessions.filter((s) => s.status === 'running');
}

/**
 * Return all sessions (active and stopped).
 */
function getAllSessions(projectRoot) {
  const store = readStore(projectRoot);
  return store.sessions;
}

/**
 * Refresh running status by checking if PIDs are actually alive.
 * Marks dead PIDs as stopped with reason "pid-dead".
 */
function refreshLiveness(projectRoot) {
  const store = readStore(projectRoot);
  let changed = false;
  for (const session of store.sessions) {
    if (session.status === 'running' && session.pid) {
      if (!isPidAlive(session.pid)) {
        session.status = 'stopped';
        session.stoppedAt = nowIso();
        session.cleanupMethod = 'pid-dead';
        changed = true;
      }
    }
  }
  if (changed) writeStore(projectRoot, store);
  return changed;
}

/**
 * Remove all stopped sessions older than the given age (ms).
 * Defaults to 24 hours.
 */
function pruneStale(projectRoot, maxAgeMs) {
  const cutoff = Date.now() - (maxAgeMs || 24 * 60 * 60 * 1000);
  const store = readStore(projectRoot);
  const before = store.sessions.length;
  store.sessions = store.sessions.filter((s) => {
    if (s.status !== 'stopped') return true;
    const ts = s.stoppedAt || s.startedAt;
    if (!ts) return false;
    return new Date(ts).getTime() > cutoff;
  });
  if (store.sessions.length !== before) {
    writeStore(projectRoot, store);
  }
  return before - store.sessions.length;
}

/**
 * Clear the entire store (all sessions).
 */
function clearStore(projectRoot) {
  const storePath = resolveStorePath(projectRoot);
  if (fs.existsSync(storePath)) {
    fs.unlinkSync(storePath);
  }
}

// ---------------------------------------------------------------------------
// CLI: --report flag
// ---------------------------------------------------------------------------

function printReport(projectRoot) {
  refreshLiveness(projectRoot);
  const store = readStore(projectRoot);
  const sessions = store.sessions;

  console.log(`Session store: ${resolveStorePath(projectRoot)}`);
  console.log(`Total sessions: ${sessions.length}`);
  console.log(`Updated at: ${store.updatedAt || 'never'}`);
  console.log('');

  if (sessions.length === 0) {
    console.log('No sessions recorded.');
    return;
  }

  const active = sessions.filter((s) => s.status === 'running');
  const stopped = sessions.filter((s) => s.status === 'stopped');

  if (active.length > 0) {
    console.log(`Active sessions (${active.length}):`);
    for (const s of active) {
      const alive = isPidAlive(s.pid) ? 'alive' : 'dead';
      console.log(`  PID ${s.pid} [${s.platform}] ${s.role} port=${s.port || '-'} (${alive}) started=${s.startedAt}`);
    }
    console.log('');
  }

  if (stopped.length > 0) {
    console.log(`Stopped sessions (${stopped.length}):`);
    for (const s of stopped) {
      console.log(`  PID ${s.pid} [${s.platform}] ${s.role} method=${s.cleanupMethod || '-'} stopped=${s.stoppedAt || '-'}`);
    }
  }
}

// ---------------------------------------------------------------------------
// CLI entrypoint
// ---------------------------------------------------------------------------

if (require.main === module) {
  const args = process.argv.slice(2);
  const projectRoot = process.cwd();

  if (args.includes('--report')) {
    printReport(projectRoot);
  } else if (args.includes('--clear')) {
    clearStore(projectRoot);
    console.log('Session store cleared.');
  } else if (args.includes('--prune')) {
    const removed = pruneStale(projectRoot);
    console.log(`Pruned ${removed} stale session(s).`);
  } else {
    console.log('Usage: node auto-run-session-store.js [--report | --clear | --prune]');
    console.log('');
    console.log('  --report   Show all tracked sessions with liveness check');
    console.log('  --clear    Remove the session store entirely');
    console.log('  --prune    Remove stopped sessions older than 24h');
  }
}

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

module.exports = {
  STORE_DIR_NAME,
  STORE_FILE_NAME,
  resolveStoreDir,
  resolveStorePath,
  readStore,
  writeStore,
  recordProcess,
  markStopped,
  getActiveSessions,
  getAllSessions,
  refreshLiveness,
  pruneStale,
  clearStore,
};
