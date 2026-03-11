#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const FIXTURES_DIR = path.join(ROOT_DIR, '.claude', 'get-motif', 'fixtures', 'phase24');
const REGISTRY_PATH = path.join(ROOT_DIR, '.claude', 'get-motif', 'references', 'framework-registry.json');
const GENERATE_SYSTEM_PATH = path.join(ROOT_DIR, '.claude', 'get-motif', 'workflows', 'generate-system.md');
const COMPOSE_SCREEN_PATH = path.join(ROOT_DIR, '.claude', 'get-motif', 'workflows', 'compose-screen.md');
const COMPOSER_VITE_PATH = path.join(ROOT_DIR, '.claude', 'get-motif', 'references', 'composer-vite.md');
const SCAFFOLD_PROJECT_PATH = path.join(ROOT_DIR, '.claude', 'get-motif', 'scripts', 'scaffold-project.js');
const PROJECT_SCANNER_PATH = path.join(ROOT_DIR, '.claude', 'get-motif', 'scripts', 'project-scanner.js');
const INIT_WORKFLOW_PATH = path.join(ROOT_DIR, '.claude', 'commands', 'motif', 'init.md');

function printHelp() {
  console.log('Usage: node .claude/get-motif/scripts/phase24-fixture-check.js <quick|full> [--target <name>]');
  console.log('');
  console.log('Modes:');
  console.log('  quick                 Run a fast subset (or a single --target)');
  console.log('  full                  Run all targets (skips unfinished targets unless explicitly targeted)');
  console.log('');
  console.log('Targets:');
  console.log('  wave0-fixtures');
  console.log('  vite-scaffold-contract');
  console.log('  vite-system-hook');
  console.log('  vite-compose');
  console.log('  brownfield-detect');
  console.log('  brownfield-init');
  console.log('  static-scaffold');
  console.log('  static-compose-path');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const mode = args.find((arg) => !arg.startsWith('-'));
  if (!mode || (mode !== 'quick' && mode !== 'full')) {
    printHelp();
    process.exit(1);
  }

  let target = null;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--target' && args[i + 1]) {
      target = args[i + 1];
      break;
    }
  }

  return { mode, target };
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function readJson(filePath) {
  return JSON.parse(readText(filePath));
}

function exists(filePath) {
  return fs.existsSync(filePath);
}

function result(target, status, message) {
  return { target, status, message };
}

function pass(target, message) {
  return result(target, 'pass', message);
}

function fail(target, message) {
  return result(target, 'fail', message);
}

function skip(target, message) {
  return result(target, 'skip', message);
}

function enforceOrSkip(target, strict, condition, failureMessage, skipMessage) {
  if (condition) {
    return null;
  }
  if (strict) {
    return fail(target, failureMessage);
  }
  return skip(target, skipMessage || failureMessage);
}

function loadRegistry(target, strict) {
  if (!exists(REGISTRY_PATH)) {
    const soft = enforceOrSkip(
      target,
      strict,
      false,
      `Missing registry: ${REGISTRY_PATH}`,
      'Registry not available yet'
    );
    return { soft, registry: null };
  }

  try {
    return { soft: null, registry: readJson(REGISTRY_PATH) };
  } catch (error) {
    return {
      soft: fail(target, `Invalid JSON in framework registry: ${error.message}`),
      registry: null,
    };
  }
}

function dependencyExists(pkg, name) {
  const deps = pkg.dependencies || {};
  const devDeps = pkg.devDependencies || {};
  return Boolean(deps[name] || devDeps[name]);
}

function detectFixturePlatform(fixturePath) {
  const pkgPath = path.join(fixturePath, 'package.json');
  const appJsonPath = path.join(fixturePath, 'app.json');
  const viteConfigPath = path.join(fixturePath, 'vite.config.ts');
  const viteConfigJsPath = path.join(fixturePath, 'vite.config.js');

  let pkg = {};
  if (exists(pkgPath)) {
    try {
      pkg = readJson(pkgPath);
    } catch {
      pkg = {};
    }
  }

  const hasNext = dependencyExists(pkg, 'next');
  const hasExpo = dependencyExists(pkg, 'expo');
  const hasVite = dependencyExists(pkg, 'vite');
  const hasReact = dependencyExists(pkg, 'react');

  let appJson = {};
  if (exists(appJsonPath)) {
    try {
      appJson = readJson(appJsonPath);
    } catch {
      appJson = {};
    }
  }

  if (hasNext) return 'web-nextjs';
  if (hasExpo || appJson.expo) return 'mobile-expo';
  if (hasVite || exists(viteConfigPath) || exists(viteConfigJsPath)) return 'web-vite';
  if (hasReact) return 'react-ambiguous';
  return 'unknown';
}

function checkWave0Fixtures(strict) {
  const target = 'wave0-fixtures';
  const results = [];
  const fixtures = [
    { name: 'next-app', expected: 'web-nextjs', requiredFiles: ['package.json'] },
    { name: 'vite-app', expected: 'web-vite', requiredFiles: ['package.json', 'vite.config.ts'] },
    { name: 'expo-app', expected: 'mobile-expo', requiredFiles: ['package.json', 'app.json'] },
    { name: 'react-ambiguous', expected: 'react-ambiguous', requiredFiles: ['package.json'] },
  ];

  if (!exists(FIXTURES_DIR)) {
    results.push(
      strict
        ? fail(target, `Missing fixture directory: ${FIXTURES_DIR}`)
        : skip(target, 'Fixture directory not created yet')
    );
    return results;
  }

  for (const fixture of fixtures) {
    const fixturePath = path.join(FIXTURES_DIR, fixture.name);
    if (!exists(fixturePath)) {
      results.push(fail(target, `Missing fixture: ${fixture.name}`));
      continue;
    }

    const missingFiles = fixture.requiredFiles.filter((file) => !exists(path.join(fixturePath, file)));
    if (missingFiles.length > 0) {
      results.push(
        fail(
          target,
          `${fixture.name} is missing required files: ${missingFiles.join(', ')}`
        )
      );
      continue;
    }

    const detected = detectFixturePlatform(fixturePath);
    if (detected !== fixture.expected) {
      results.push(
        fail(
          target,
          `${fixture.name} expected ${fixture.expected} but detected ${detected}`
        )
      );
    } else {
      results.push(pass(target, `${fixture.name} detection resolved to ${detected}`));
    }
  }

  return results;
}

function checkViteScaffoldContract(strict) {
  const target = 'vite-scaffold-contract';
  const results = [];
  const scriptGuard = enforceOrSkip(
    target,
    strict,
    exists(SCAFFOLD_PROJECT_PATH),
    `Missing scaffold runner: ${SCAFFOLD_PROJECT_PATH}`,
    'Scaffold runner not implemented yet'
  );
  if (scriptGuard) return [scriptGuard];

  const { soft, registry } = loadRegistry(target, strict);
  if (soft) return [soft];

  const vite = registry['web-vite'];
  const viteGuard = enforceOrSkip(
    target,
    strict,
    Boolean(vite),
    'Missing web-vite entry in framework registry',
    'web-vite contract is not available yet'
  );
  if (viteGuard) return [viteGuard];

  const requiredSections = ['scaffold', 'devServer', 'tokens', 'conventions', 'composition', 'materialization', 'scaffoldSequence'];
  for (const section of requiredSections) {
    if (!vite[section]) {
      results.push(fail(target, `web-vite is missing section: ${section}`));
    }
  }

  if (vite.composition && vite.composition.overlay === 'composer-vite.md') {
    results.push(pass(target, 'web-vite composition overlay resolves to composer-vite.md'));
  } else {
    results.push(fail(target, 'web-vite composition overlay must be composer-vite.md'));
  }

  const conventionChecks = [
    ['mainEntry', 'src/main.tsx'],
    ['routerFile', 'src/app/router.tsx'],
    ['appShellFile', 'src/app/AppShell.tsx'],
    ['pagesPattern', 'src/pages/{RouteName}Page.tsx'],
  ];

  for (const [key, expected] of conventionChecks) {
    if (vite.conventions && vite.conventions[key] === expected) {
      results.push(pass(target, `conventions.${key} = ${expected}`));
    } else {
      results.push(fail(target, `Expected conventions.${key} = ${expected}`));
    }
  }

  const runtimeDestinations = vite.tokens && vite.tokens.runtimeDestinations;
  if (!runtimeDestinations) {
    results.push(fail(target, 'web-vite.tokens.runtimeDestinations is required'));
  } else {
    const requiredDestinations = ['tokensTs', 'globalsCss', 'cssEntry'];
    for (const key of requiredDestinations) {
      if (runtimeDestinations[key]) {
        results.push(pass(target, `tokens.runtimeDestinations.${key} declared`));
      } else {
        results.push(fail(target, `Missing tokens.runtimeDestinations.${key}`));
      }
    }
  }

  const materialization = vite.materialization || {};
  const ownedFiles = materialization.ownedFiles || [];
  const requiredOwned = ['src/main.tsx', 'src/app/router.tsx', 'src/app/AppShell.tsx', 'src/pages/HomePage.tsx'];
  for (const file of requiredOwned) {
    if (ownedFiles.includes(file)) {
      results.push(pass(target, `materialization owns ${file}`));
    } else {
      results.push(fail(target, `materialization.ownedFiles missing ${file}`));
    }
  }

  const sequenceText = Array.isArray(vite.scaffoldSequence) ? vite.scaffoldSequence.join(' | ') : '';
  const sequenceGuards = [
    /vite/i,
    /react router/i,
    /tailwind/i,
    /material/i,
  ];
  for (const guard of sequenceGuards) {
    if (guard.test(sequenceText)) {
      results.push(pass(target, `scaffoldSequence includes ${guard}`));
    } else {
      results.push(fail(target, `scaffoldSequence missing step matching ${guard}`));
    }
  }

  return results;
}

function checkViteSystemHook(strict) {
  const target = 'vite-system-hook';
  if (!exists(GENERATE_SYSTEM_PATH)) {
    return [
      strict
        ? fail(target, `Missing generate-system workflow: ${GENERATE_SYSTEM_PATH}`)
        : skip(target, 'generate-system workflow not available yet'),
    ];
  }

  const text = readText(GENERATE_SYSTEM_PATH);
  const results = [];

  const hasScaffoldHook = /scaffold-project\.js/.test(text);
  if (!hasScaffoldHook) {
    return [
      strict
        ? fail(target, 'generate-system does not reference scaffold-project.js yet')
        : skip(target, 'Scaffold hook not added yet'),
    ];
  }

  const requiredFlags = ['--platform', '--project-root', '--project-name', '--design-system-dir'];
  for (const flag of requiredFlags) {
    if (text.includes(flag)) {
      results.push(pass(target, `generate-system includes ${flag} flag`));
    } else {
      results.push(fail(target, `generate-system missing ${flag} in scaffold invocation`));
    }
  }

  if (/PROJECT-SCAN\.md/.test(text) && /brownfield/i.test(text) && /greenfield/i.test(text)) {
    results.push(pass(target, 'generate-system documents greenfield/brownfield scaffold gating'));
  } else {
    results.push(fail(target, 'generate-system must describe brownfield skip vs greenfield scaffold behavior'));
  }

  const tailwindIndex = text.indexOf('tailwind-config-generator.js');
  const scaffoldIndex = text.indexOf('scaffold-project.js');
  if (tailwindIndex >= 0 && scaffoldIndex > tailwindIndex) {
    results.push(pass(target, 'scaffold hook is ordered after token/globals generation steps'));
  } else {
    results.push(fail(target, 'scaffold hook must appear after token/globals generation steps'));
  }

  return results;
}

function checkViteCompose(strict) {
  const target = 'vite-compose';
  const results = [];
  const { soft, registry } = loadRegistry(target, strict);
  if (soft) return [soft];

  const vite = registry['web-vite'];
  const overlayGuard = enforceOrSkip(
    target,
    strict,
    Boolean(vite && vite.composition && vite.composition.overlay === 'composer-vite.md'),
    'web-vite must declare composition.overlay = composer-vite.md',
    'Vite overlay mapping not complete yet'
  );
  if (overlayGuard) return [overlayGuard];

  if (!exists(COMPOSER_VITE_PATH)) {
    return [
      strict
        ? fail(target, `Missing composer-vite overlay: ${COMPOSER_VITE_PATH}`)
        : skip(target, 'composer-vite overlay is not created yet'),
    ];
  }

  const text = readText(COMPOSER_VITE_PATH);
  const requiredPatterns = [
    { regex: /src\/pages\/\{RouteName\}Page\.tsx/, label: 'Vite page output convention' },
    { regex: /src\/app\//, label: 'router/bootstrap helper path' },
    { regex: /react-router-dom/, label: 'React Router import rules' },
    { regex: /createBrowserRouter/, label: 'createBrowserRouter guidance' },
    { regex: /RouterProvider/, label: 'RouterProvider guidance' },
    { regex: /next\/image/, label: 'anti-Next image guard' },
    { regex: /next\/link/, label: 'anti-Next link guard' },
    { regex: /next\/font/, label: 'anti-Next font guard' },
    { regex: /no inline style/i, label: 'no inline style rule' },
    { regex: /no raw CSS custom-property references in JSX/i, label: 'no var(--*) in JSX rule' },
    { regex: /no \.planning\//i, label: 'no .planning import rule' },
  ];

  for (const entry of requiredPatterns) {
    if (entry.regex.test(text)) {
      results.push(pass(target, `${entry.label} present`));
    } else {
      results.push(fail(target, `${entry.label} missing`));
    }
  }

  return results;
}

function checkBrownfieldDetect(strict) {
  const target = 'brownfield-detect';
  if (!exists(PROJECT_SCANNER_PATH)) {
    return [
      strict
        ? fail(target, `Missing scanner script: ${PROJECT_SCANNER_PATH}`)
        : skip(target, 'Scanner script not available'),
    ];
  }

  const text = readText(PROJECT_SCANNER_PATH);
  const hasViteSignal = /vite/.test(text);
  const hasExpoSignal = /expo/.test(text);

  if (!hasViteSignal || !hasExpoSignal) {
    return [
      strict
        ? fail(target, 'Scanner must include explicit Vite and Expo detection signals')
        : skip(target, 'Brownfield Vite/Expo detection not implemented yet'),
    ];
  }

  return [pass(target, 'Scanner includes explicit Vite and Expo detection signals')];
}

function checkBrownfieldInit(strict) {
  const target = 'brownfield-init';
  if (!exists(INIT_WORKFLOW_PATH)) {
    return [
      strict
        ? fail(target, `Missing init workflow: ${INIT_WORKFLOW_PATH}`)
        : skip(target, 'Init workflow not available'),
    ];
  }

  const text = readText(INIT_WORKFLOW_PATH);
  const hasAmbiguousPrompt = /ambiguous/i.test(text) && /confirm/i.test(text);
  const hasPlatformTargets = /web-vite/.test(text) && /mobile-expo/.test(text);

  if (!hasAmbiguousPrompt || !hasPlatformTargets) {
    return [
      strict
        ? fail(target, 'Init workflow must include ambiguous-platform confirmation for brownfield projects')
        : skip(target, 'Brownfield adoption confirmation not implemented yet'),
    ];
  }

  return [pass(target, 'Init workflow contains ambiguous brownfield platform confirmation flow')];
}

function checkStaticScaffold(strict) {
  const target = 'static-scaffold';
  const { soft, registry } = loadRegistry(target, strict);
  if (soft) return [soft];

  const staticEntry = registry['web-static'];
  const staticGuard = enforceOrSkip(
    target,
    strict,
    Boolean(staticEntry && staticEntry.scaffold),
    'Missing web-static scaffold contract',
    'web-static scaffold contract not available yet'
  );
  if (staticGuard) return [staticGuard];

  const generated = staticEntry.scaffold.generatedStructure || [];
  const required = ['index.html', 'css/tokens.css', 'css/styles.css', 'js/main.js'];
  const results = [];
  for (const item of required) {
    if (generated.includes(item)) {
      results.push(pass(target, `web-static generatedStructure includes ${item}`));
    } else {
      results.push(fail(target, `web-static generatedStructure missing ${item}`));
    }
  }

  if (exists(SCAFFOLD_PROJECT_PATH)) {
    const scriptText = readText(SCAFFOLD_PROJECT_PATH);
    if (/generatedStructure/.test(scriptText)) {
      results.push(pass(target, 'Scaffold runner supports generatedStructure flow'));
    } else {
      results.push(fail(target, 'Scaffold runner must support generatedStructure flow'));
    }
  } else {
    results.push(
      strict
        ? fail(target, 'Scaffold runner missing; cannot validate generatedStructure support')
        : skip(target, 'Scaffold runner not implemented yet')
    );
  }

  return results;
}

function checkStaticComposePath(strict) {
  const target = 'static-compose-path';
  if (!exists(COMPOSE_SCREEN_PATH)) {
    return [
      strict
        ? fail(target, `Missing compose-screen workflow: ${COMPOSE_SCREEN_PATH}`)
        : skip(target, 'compose-screen workflow not available'),
    ];
  }

  const text = readText(COMPOSE_SCREEN_PATH);
  const hasStaticMarker = /Static compose destination/i.test(text);
  const hasStaticPathRule = /index\.html/.test(text) && /web-static/.test(text);

  if (!hasStaticMarker || !hasStaticPathRule) {
    return [
      strict
        ? fail(target, 'compose-screen must declare explicit static compose destination behavior')
        : skip(target, 'Static compose destination behavior not implemented yet'),
    ];
  }

  return [pass(target, 'compose-screen contains static compose destination behavior')];
}

const TARGET_CHECKS = {
  'wave0-fixtures': checkWave0Fixtures,
  'vite-scaffold-contract': checkViteScaffoldContract,
  'vite-system-hook': checkViteSystemHook,
  'vite-compose': checkViteCompose,
  'brownfield-detect': checkBrownfieldDetect,
  'brownfield-init': checkBrownfieldInit,
  'static-scaffold': checkStaticScaffold,
  'static-compose-path': checkStaticComposePath,
};

function run(mode, targetArg) {
  if (targetArg && !TARGET_CHECKS[targetArg]) {
    console.error(`Unknown target: ${targetArg}`);
    process.exit(1);
  }

  let targets;
  let strict = false;

  if (targetArg) {
    targets = [targetArg];
    strict = true;
  } else if (mode === 'quick') {
    targets = ['wave0-fixtures', 'vite-scaffold-contract', 'vite-system-hook', 'vite-compose'];
  } else {
    targets = Object.keys(TARGET_CHECKS);
  }

  const results = [];
  for (const target of targets) {
    const targetResults = TARGET_CHECKS[target](strict);
    results.push(...targetResults);
  }

  const counts = { pass: 0, fail: 0, skip: 0 };
  for (const item of results) {
    counts[item.status] += 1;
    const tag = item.status.toUpperCase().padEnd(4, ' ');
    console.log(`[${tag}] ${item.target}: ${item.message}`);
  }

  console.log('');
  console.log(
    `Summary: ${counts.pass} passed, ${counts.fail} failed, ${counts.skip} skipped`
  );
  if (counts.fail > 0) {
    process.exit(1);
  }
}

const { mode, target } = parseArgs(process.argv);
run(mode, target);
