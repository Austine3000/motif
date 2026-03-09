#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

// --- Path Resolution ---

const projectDir = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const statePath = path.join(projectDir, '.planning', 'design', 'STATE.md');
const designDir = path.join(projectDir, '.planning', 'design');

// --- YAML Frontmatter Parser ---

function parseFrontmatter(content) {
  if (!content || typeof content !== 'string') return null;
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const yaml = match[1];
  const lines = yaml.split('\n');
  const result = {};
  let currentKey = null;
  let currentList = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Nested object list item continuation: "    key: value"
    if (currentList && /^    \w+:/.test(line)) {
      const obj = currentList[currentList.length - 1];
      const colonIdx = line.indexOf(':');
      const k = line.substring(0, colonIdx).trim();
      const v = line.substring(colonIdx + 1).trim();
      obj[k] = parseScalar(v);
      continue;
    }

    // List item: "  - value" or "  - key: value" (start of object)
    if (currentList && /^  - /.test(line)) {
      const itemContent = line.substring(4);
      if (itemContent.includes(':')) {
        const colonIdx = itemContent.indexOf(':');
        const k = itemContent.substring(0, colonIdx).trim();
        const v = itemContent.substring(colonIdx + 1).trim();
        currentList.push({ [k]: parseScalar(v) });
      } else {
        currentList.push(parseScalar(itemContent));
      }
      continue;
    }

    // Top-level key: value
    if (/^\w/.test(line) && line.includes(':')) {
      const colonIdx = line.indexOf(':');
      const key = line.substring(0, colonIdx).trim();
      const rawValue = line.substring(colonIdx + 1).trim();

      if (rawValue === '' || rawValue === '[]') {
        // Could be start of a list, or empty value
        // Check if next line is a list item
        if (rawValue === '[]') {
          result[key] = [];
          currentKey = null;
          currentList = null;
        } else if (i + 1 < lines.length && /^  - /.test(lines[i + 1])) {
          result[key] = [];
          currentKey = key;
          currentList = result[key];
        } else {
          result[key] = '';
          currentKey = null;
          currentList = null;
        }
      } else {
        result[key] = parseScalar(rawValue);
        currentKey = null;
        currentList = null;
      }
    }
  }

  return result;
}

function parseScalar(v) {
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 'null' || v === '~') return null;
  if (/^-?\d+$/.test(v)) return parseInt(v, 10);
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v);
  // Remove surrounding quotes if present
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    return v.slice(1, -1);
  }
  return v;
}

// --- YAML Frontmatter Serializer ---

function serializeFrontmatter(obj) {
  const lines = ['---'];

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else if (typeof value[0] === 'object' && value[0] !== null) {
        lines.push(`${key}:`);
        for (const item of value) {
          const entries = Object.entries(item);
          if (entries.length > 0) {
            lines.push(`  - ${entries[0][0]}: ${serializeScalar(entries[0][1])}`);
            for (let i = 1; i < entries.length; i++) {
              lines.push(`    ${entries[i][0]}: ${serializeScalar(entries[i][1])}`);
            }
          }
        }
      } else {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${serializeScalar(item)}`);
        }
      }
    } else {
      lines.push(`${key}: ${serializeScalar(value)}`);
    }
  }

  lines.push('---');
  return lines.join('\n');
}

function serializeScalar(v) {
  if (v === null || v === undefined) return 'null';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  return String(v);
}

// --- File Operations ---

function readState() {
  try {
    if (!fs.existsSync(statePath)) {
      return { error: 'missing' };
    }
    const content = fs.readFileSync(statePath, 'utf8');
    const frontmatter = parseFrontmatter(content);
    if (!frontmatter) {
      return { error: 'corrupt' };
    }
    return frontmatter;
  } catch (err) {
    process.stderr.write(`[Motif] Error reading state: ${err.message}\n`);
    return { error: 'corrupt' };
  }
}

function getMarkdownBody(content) {
  const match = content.match(/^---\n[\s\S]*?\n---\n?([\s\S]*)$/);
  return match ? match[1] : '';
}

function atomicWrite(filePath, content) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const tmp = filePath + '.tmp';
  fs.writeFileSync(tmp, content, 'utf8');
  fs.renameSync(tmp, filePath);
}

// --- Commands ---

function cmdRead() {
  const state = readState();
  process.stdout.write(JSON.stringify(state) + '\n');
}

function cmdUpdate(key, value) {
  if (!key) {
    process.stderr.write('[Motif] Usage: motif-state.js update <key> <value>\n');
    process.exit(1);
  }

  let currentContent = '';
  let body = '';
  let state = {};

  try {
    if (fs.existsSync(statePath)) {
      currentContent = fs.readFileSync(statePath, 'utf8');
      state = parseFrontmatter(currentContent) || {};
      body = getMarkdownBody(currentContent);
    }
  } catch (err) {
    process.stderr.write(`[Motif] Warning: could not read current state: ${err.message}\n`);
  }

  // Parse value: try JSON first (for screens array etc), fall back to scalar
  let parsedValue;
  try {
    parsedValue = JSON.parse(value);
  } catch (e) {
    parsedValue = parseScalar(value);
  }

  state[key] = parsedValue;
  const frontmatter = serializeFrontmatter(state);
  const output = frontmatter + '\n' + body;
  atomicWrite(statePath, output);
  process.stdout.write(JSON.stringify({ ok: true, key, value: parsedValue }) + '\n');
}

function cmdWrite(jsonStr) {
  if (!jsonStr) {
    process.stderr.write('[Motif] Usage: motif-state.js write <json>\n');
    process.exit(1);
  }

  let state;
  try {
    state = JSON.parse(jsonStr);
  } catch (err) {
    process.stderr.write(`[Motif] Invalid JSON: ${err.message}\n`);
    process.exit(1);
  }

  // Preserve markdown body if STATE.md exists
  let body = '';
  try {
    if (fs.existsSync(statePath)) {
      const currentContent = fs.readFileSync(statePath, 'utf8');
      body = getMarkdownBody(currentContent);
    }
  } catch (err) {
    // Ignore — fresh write
  }

  if (!body) {
    body = '\n# Motif State\n\n## Decisions Log\n- ' +
      new Date().toISOString().split('T')[0] + ' State written\n\n' +
      '## Context Budget\n| File | Tokens (approx) | Budget |\n|---|---|---|\n' +
      '| PROJECT.md | ~800 | <=1,000 |\n| DESIGN-BRIEF.md | ~600 | <=1,000 |\n' +
      '| DESIGN-RESEARCH.md | -- | <=3,000 |\n| tokens.css | -- | <=3,000 |\n' +
      '| COMPONENT-SPECS.md | -- | <=5,000 |\n';
  }

  const frontmatter = serializeFrontmatter(state);
  const output = frontmatter + '\n' + body;
  atomicWrite(statePath, output);
  process.stdout.write(JSON.stringify({ ok: true }) + '\n');
}

function cmdStatusLine() {
  const state = readState();
  if (state.error) {
    // No state — output empty string (statusLine hook handles gracefully)
    process.stdout.write('');
    return;
  }

  const vertical = state.vertical || '?';
  const phase = state.phase || '?';
  const composed = state.screens_composed || 0;
  const total = state.screen_count || 0;

  let line = `Motif: ${vertical} | ${phase} ${composed}/${total}`;

  // Add next action hint based on phase
  switch (phase) {
    case 'INITIALIZED':
      line += ' | next: /motif:research';
      break;
    case 'RESEARCHED':
      line += ' | next: /motif:system';
      break;
    case 'SYSTEM_GENERATED':
      line += ' | next: /motif:compose';
      break;
    case 'COMPOSING': {
      const screens = state.screens;
      if (Array.isArray(screens)) {
        const planned = screens.find(s => s && s.status === 'planned');
        if (planned && planned.name) {
          line += ` | next: ${planned.name}`;
        } else {
          line += ' | next: /motif:review';
        }
      } else {
        line += ' | next: /motif:compose';
      }
      break;
    }
    case 'REVIEWING':
      line += ' | next: /motif:fix';
      break;
    case 'ITERATING':
      line += ' | next: /motif:compose';
      break;
    default:
      break;
  }

  process.stdout.write(line);
}

function cmdRecover() {
  try {
    if (!fs.existsSync(designDir)) {
      process.stdout.write(JSON.stringify({ error: 'no_project', message: 'No .planning/design/ directory found' }) + '\n');
      return;
    }

    // Phase inference chain
    let phase = null;
    const reviewsDir = path.join(designDir, 'reviews');
    const screensDir = path.join(designDir, 'screens');
    const systemDir = path.join(designDir, 'system');

    const dirHasFiles = (dir, pattern) => {
      try {
        const files = fs.readdirSync(dir);
        return files.filter(f => f.match(pattern));
      } catch (e) {
        return [];
      }
    };

    const reviewFiles = dirHasFiles(reviewsDir, /-REVIEW\.md$/);
    const screenSummaryFiles = dirHasFiles(screensDir, /-SUMMARY\.md$/);

    if (reviewFiles.length > 0) {
      phase = 'REVIEWING';
    } else if (screenSummaryFiles.length > 0) {
      phase = 'COMPOSING';
    } else if (fs.existsSync(path.join(systemDir, 'tokens.css'))) {
      phase = 'SYSTEM_GENERATED';
    } else if (fs.existsSync(path.join(designDir, 'DESIGN-RESEARCH.md'))) {
      phase = 'RESEARCHED';
    } else if (fs.existsSync(path.join(designDir, 'PROJECT.md'))) {
      phase = 'INITIALIZED';
    } else {
      process.stdout.write(JSON.stringify({ error: 'no_project', message: 'No Motif artifacts found' }) + '\n');
      return;
    }

    // Vertical and stack from PROJECT.md
    let vertical = 'unknown';
    let stack = 'unknown';
    const projectPath = path.join(designDir, 'PROJECT.md');

    if (fs.existsSync(projectPath)) {
      const projectContent = fs.readFileSync(projectPath, 'utf8');

      const vertMatch = projectContent.match(/## Vertical\n(\w+)/) ||
                         projectContent.match(/vertical:\s*(\w+)/i);
      if (vertMatch) vertical = vertMatch[1];

      const stackMatch = projectContent.match(/## Technical Stack\n(.+)/) ||
                          projectContent.match(/stack:\s*(.+)/i);
      if (stackMatch) stack = stackMatch[1].trim();
    }

    // Screen list from PROJECT.md
    const screens = [];
    if (fs.existsSync(projectPath)) {
      const projectContent = fs.readFileSync(projectPath, 'utf8');
      const screensSection = projectContent.match(/## Screens \(v1\)\n([\s\S]*?)(?=\n##|$)/);
      if (screensSection) {
        const screenLines = screensSection[1].split('\n').filter(l => /^\d+\./.test(l.trim()));
        for (const line of screenLines) {
          const nameMatch = line.match(/^\d+\.\s*\*\*(.+?)\*\*/) || line.match(/^\d+\.\s*(.+?)(?:\s*[-—]|$)/);
          if (nameMatch) {
            const name = nameMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
            let status = 'planned';

            // Check if composed
            const composedNames = screenSummaryFiles.map(f => f.replace(/-SUMMARY\.md$/, '').toLowerCase());
            if (composedNames.includes(name)) status = 'composed';

            // Check if reviewed
            const reviewedNames = reviewFiles.map(f => f.replace(/-REVIEW\.md$/, '').toLowerCase());
            if (reviewedNames.includes(name)) status = 'reviewed';

            screens.push({ name, status });
          }
        }
      }
    }

    const screensComposed = screens.filter(s => s.status === 'composed' || s.status === 'reviewed').length;

    const recovered = {
      phase,
      vertical,
      stack,
      screen_count: screens.length,
      screens_composed: screensComposed,
      screens,
      last_command: 'recover',
      last_outcome: 'recovered',
      updated: new Date().toISOString().split('T')[0]
    };

    // Write recovered state
    const frontmatter = serializeFrontmatter(recovered);
    const body = '\n# Motif State\n\n## Decisions Log\n- ' +
      recovered.updated + ' State recovered from artifacts\n\n' +
      '## Context Budget\n| File | Tokens (approx) | Budget |\n|---|---|---|\n' +
      '| PROJECT.md | ~800 | <=1,000 |\n| DESIGN-BRIEF.md | ~600 | <=1,000 |\n' +
      '| DESIGN-RESEARCH.md | -- | <=3,000 |\n| tokens.css | -- | <=3,000 |\n' +
      '| COMPONENT-SPECS.md | -- | <=5,000 |\n';
    atomicWrite(statePath, frontmatter + '\n' + body);

    process.stderr.write(`[Motif] State recovered from artifacts -- phase: ${phase}, ${screensComposed}/${screens.length} screens\n`);
    process.stdout.write(JSON.stringify(recovered) + '\n');
  } catch (err) {
    process.stderr.write(`[Motif] Recovery error: ${err.message}\n`);
    process.stdout.write(JSON.stringify({ error: 'recovery_failed', message: err.message }) + '\n');
  }
}

function cmdHelp() {
  const usage = `motif-state.js — Motif state management utility

Usage:
  node motif-state.js <command> [args]

Commands:
  read                   Read STATE.md, output JSON
  update <key> <value>   Update a single field in STATE.md
  write <json>           Full state write from JSON
  status-line            Output formatted status for hook
  recover                Rebuild state from artifacts

State file: .planning/design/STATE.md
`;
  process.stdout.write(usage);
}

// --- CLI Entry Point ---

const args = process.argv.slice(2);
const command = args[0];

switch (command) {
  case 'read':
    cmdRead();
    break;
  case 'update':
    cmdUpdate(args[1], args.slice(2).join(' '));
    break;
  case 'write':
    cmdWrite(args.slice(1).join(' '));
    break;
  case 'status-line':
    cmdStatusLine();
    break;
  case 'recover':
    cmdRecover();
    break;
  case '--help':
  case '-h':
  case undefined:
    cmdHelp();
    break;
  default:
    process.stderr.write(`[Motif] Unknown command: ${command}\n`);
    cmdHelp();
    process.exit(1);
}
