#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const SESSION_DIR_NAME = 'runtime';
const SESSION_FILE_NAME = 'active-session.json';

function nowIso() {
  return new Date().toISOString();
}

function resolveSessionDir(projectRoot) {
  return path.join(projectRoot, '.planning', SESSION_DIR_NAME);
}

function resolveSessionPath(projectRoot) {
  return path.join(resolveSessionDir(projectRoot), SESSION_FILE_NAME);
}

function ensureSessionDir(projectRoot) {
  fs.mkdirSync(resolveSessionDir(projectRoot), { recursive: true });
}

function readSession(projectRoot) {
  const sessionPath = resolveSessionPath(projectRoot);
  if (!fs.existsSync(sessionPath)) return null;
  try {
    const data = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
    if (!data || typeof data !== 'object') return null;
    return data;
  } catch {
    return null;
  }
}

function writeSession(projectRoot, session) {
  ensureSessionDir(projectRoot);
  const sessionPath = resolveSessionPath(projectRoot);
  const tmpPath = `${sessionPath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(session, null, 2));
  fs.renameSync(tmpPath, sessionPath);
  return session;
}

function updateSession(projectRoot, updates) {
  const existing = readSession(projectRoot) || {};
  const now = nowIso();
  const next = {
    ...existing,
    ...updates,
    createdAt: existing.createdAt || now,
    updatedAt: now,
  };
  return writeSession(projectRoot, next);
}

function removeSession(projectRoot) {
  const sessionPath = resolveSessionPath(projectRoot);
  if (fs.existsSync(sessionPath)) {
    fs.unlinkSync(sessionPath);
  }
  return sessionPath;
}

function markSessionStale(projectRoot, reason) {
  return updateSession(projectRoot, {
    stale: true,
    status: 'stale',
    staleReason: reason || 'unknown',
    lastSeen: nowIso(),
  });
}

function isPidAlive(pid) {
  if (!pid || typeof pid !== 'number') return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    if (error.code === 'EPERM') return true;
    return false;
  }
}

function detectStaleSession(session) {
  if (!session || session.mode !== 'daemon') {
    return { stale: false, reason: null, alive: false };
  }
  if (!session.pid || typeof session.pid !== 'number') {
    return { stale: true, reason: 'missing-pid', alive: false };
  }
  const alive = isPidAlive(session.pid);
  if (!alive) {
    return { stale: true, reason: 'pid-missing', alive: false };
  }
  if (session.status === 'stopped' || session.status === 'cleanup-failed' || session.status === 'stale') {
    return { stale: true, reason: 'stopped', alive };
  }
  return { stale: false, reason: null, alive };
}

module.exports = {
  SESSION_DIR_NAME,
  SESSION_FILE_NAME,
  resolveSessionDir,
  resolveSessionPath,
  readSession,
  writeSession,
  updateSession,
  removeSession,
  markSessionStale,
  isPidAlive,
  detectStaleSession,
  nowIso,
};
