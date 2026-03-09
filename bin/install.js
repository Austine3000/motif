#!/usr/bin/env node
'use strict';

// Backward-compatibility shim: delegates to the extracted init command.
// Ensures `npx motif-design@latest` and any external references to
// bin/install.js (e.g., e2e tests) continue to work during transition.

require('./commands/init.js').run(process.argv.slice(2));
