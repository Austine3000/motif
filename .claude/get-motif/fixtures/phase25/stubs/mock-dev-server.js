#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const http = require('node:http');

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = {
    mode: 'nextjs',
    port: 3000,
    readyDelay: 250,
    logFile: null,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--mode' && args[i + 1]) {
      options.mode = args[++i];
    } else if (arg === '--port' && args[i + 1]) {
      options.port = Number(args[++i]);
    } else if (arg === '--ready-delay' && args[i + 1]) {
      options.readyDelay = Number(args[++i]);
    } else if (arg === '--log-file' && args[i + 1]) {
      options.logFile = args[++i];
    }
  }

  return options;
}

function printLines(lines) {
  for (const line of lines) {
    process.stdout.write(`${line}\n`);
  }
}

function logsForMode(mode, port) {
  if (mode === 'vite') {
    return [
      'VITE v5.1.0  ready in 412 ms',
      '',
      `  Local:   http://localhost:${port}/`,
      '  Network: use --host to expose',
    ];
  }
  if (mode === 'noise') {
    return ['Starting background process...', 'No ready signal here.'];
  }
  return [
    '▲ Next.js 14.1.0',
    `- Local:        http://localhost:${port}`,
    `- Network:      http://192.168.1.20:${port}`,
    '✓ Ready in 2.4s',
  ];
}

const options = parseArgs(process.argv);
const server = http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ok');
});

server.listen(options.port, () => {
  setTimeout(() => {
    if (options.logFile && fs.existsSync(options.logFile)) {
      const content = fs.readFileSync(options.logFile, 'utf8');
      const lines = content.split(/\r?\n/).filter(Boolean);
      printLines(lines);
    } else {
      printLines(logsForMode(options.mode, options.port));
    }
  }, options.readyDelay);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
