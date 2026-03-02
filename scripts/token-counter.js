#!/usr/bin/env node
'use strict';

/**
 * Approximate Token Counter (SCRP-02)
 *
 * Usage: node scripts/token-counter.js [directory]
 * Defaults to .planning/design/ if no argument provided.
 *
 * Walks the target directory recursively, reads all text files,
 * and reports an approximate token count using the ~4 chars/token heuristic.
 *
 * Zero external dependencies -- pure Node.js.
 */

const fs = require('node:fs');
const path = require('node:path');

const targetDir = process.argv[2] || '.planning/design/';

// Resolve to absolute path for display consistency
const resolvedDir = path.resolve(targetDir);

if (!fs.existsSync(resolvedDir)) {
  console.error(`Directory not found: ${targetDir}`);
  process.exit(1);
}

const stat = fs.statSync(resolvedDir);
if (!stat.isDirectory()) {
  console.error(`Not a directory: ${targetDir}`);
  process.exit(1);
}

/**
 * Check if a file appears to be binary by looking for null bytes
 * in the first 512 bytes.
 */
function isBinary(filePath) {
  const fd = fs.openSync(filePath, 'r');
  const buf = Buffer.alloc(512);
  const bytesRead = fs.readSync(fd, buf, 0, 512, 0);
  fs.closeSync(fd);
  for (let i = 0; i < bytesRead; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

/**
 * Recursively walk a directory, summing character counts of text files.
 * Returns { chars, files } totals.
 */
function walkDir(dir) {
  let totalChars = 0;
  let fileCount = 0;

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (e) {
    // Permission denied or other read error -- skip this directory
    return { chars: 0, files: 0 };
  }

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip .DS_Store
    if (entry.name === '.DS_Store') continue;

    if (entry.isDirectory()) {
      const sub = walkDir(fullPath);
      totalChars += sub.chars;
      fileCount += sub.files;
    } else if (entry.isFile()) {
      // Skip binary files
      try {
        if (isBinary(fullPath)) continue;
        const content = fs.readFileSync(fullPath, 'utf8');
        totalChars += content.length;
        fileCount++;
      } catch (e) {
        // Unreadable file -- skip
        continue;
      }
    }
  }

  return { chars: totalChars, files: fileCount };
}

/**
 * Format a number with commas for readability.
 * e.g. 48320 -> "48,320"
 */
function formatNumber(n) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const result = walkDir(resolvedDir);
const approxTokens = Math.ceil(result.chars / 4);

console.log(`Directory: ${targetDir}`);
console.log(`Files scanned: ${formatNumber(result.files)}`);
console.log(`Total characters: ${formatNumber(result.chars)}`);
console.log(`Approximate tokens: ~${formatNumber(approxTokens)}`);
