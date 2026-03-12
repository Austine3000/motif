#!/usr/bin/env node
'use strict';

const http = require('node:http');

function parseArgs(argv) {
  const args = argv.slice(2);
  const options = { port: 3000 };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && args[i + 1]) {
      options.port = Number(args[++i]);
    }
  }
  return options;
}

const options = parseArgs(process.argv);
const server = http.createServer((_, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('held');
});

server.listen(options.port, () => {
  console.log(`port-holder listening on ${options.port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
