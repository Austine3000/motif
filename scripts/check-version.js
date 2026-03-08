#!/usr/bin/env node
'use strict';

/**
 * Checks if a newer version of motif-design is available on npm.
 * Outputs JSON: { "installed": "0.2.0", "latest": "0.3.0", "updateAvailable": true }
 * Exits 0 on success, 1 on error (prints error JSON).
 */

const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');

function getInstalledVersion() {
  const manifestPath = path.join(process.cwd(), '.motif-manifest.json');
  if (!fs.existsSync(manifestPath)) return null;

  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    return manifest.version || null;
  } catch {
    return null;
  }
}

function fetchLatestVersion() {
  return new Promise((resolve, reject) => {
    const req = https.get('https://registry.npmjs.org/motif-design/latest', {
      headers: { 'Accept': 'application/json' },
      timeout: 5000,
    }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const pkg = JSON.parse(data);
          resolve(pkg.version || null);
        } catch {
          reject(new Error('Failed to parse npm registry response'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('npm registry request timed out'));
    });
  });
}

function compareVersions(a, b) {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) < (pb[i] || 0)) return -1;
    if ((pa[i] || 0) > (pb[i] || 0)) return 1;
  }
  return 0;
}

async function main() {
  const installed = getInstalledVersion();

  if (!installed) {
    console.log(JSON.stringify({ error: 'No Motif installation found' }));
    process.exit(1);
  }

  try {
    const latest = await fetchLatestVersion();
    const updateAvailable = latest ? compareVersions(installed, latest) < 0 : false;

    console.log(JSON.stringify({
      installed,
      latest: latest || 'unknown',
      updateAvailable,
    }));
  } catch (err) {
    // Network failure is non-fatal — report installed version
    console.log(JSON.stringify({
      installed,
      latest: 'unknown',
      updateAvailable: false,
      warning: err.message,
    }));
  }
}

main();
