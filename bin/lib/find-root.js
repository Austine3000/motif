'use strict';

const fs = require('node:fs');
const path = require('node:path');

/**
 * Walk up from startDir looking for .git (file or directory) or package.json.
 * Returns the directory path where a project root indicator was found,
 * or null if the filesystem root is reached without finding one.
 */
function findProjectRoot(startDir) {
  let dir = path.resolve(startDir);
  const root = path.parse(dir).root;

  while (true) {
    // Check for .git (directory for normal repos, file for worktrees)
    const gitPath = path.join(dir, '.git');
    if (fs.existsSync(gitPath)) return dir;

    // Check for package.json
    const pkgPath = path.join(dir, 'package.json');
    if (fs.existsSync(pkgPath)) return dir;

    // Reached filesystem root without finding anything
    if (dir === root) return null;

    dir = path.dirname(dir);
  }
}

module.exports = { findProjectRoot };
