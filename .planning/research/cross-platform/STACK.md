# Technology Stack: Cross-Platform Scaffolding, Framework Output, Auto-Run

**Project:** Motif v1.4 -- Cross-Platform App Builder
**Researched:** 2026-03-09
**Overall Confidence:** HIGH

## Scope

This document covers stack additions/changes for three new capabilities:
1. **Project scaffolding** per framework (Next.js, Vite/React, Expo/React Native, static HTML)
2. **Framework-specific component output** (JSX components, React Native Views, HTML/CSS)
3. **Auto-run** (dev server launch, browser/simulator opening)

**Critical constraint:** Motif itself remains zero npm dependencies. Scaffolded projects will have their own dependencies managed by their own package managers. Motif generates files and spawns CLI commands -- it does not import framework libraries.

Existing stack is validated and not re-researched: pure Node.js >=22, CSS custom properties, Claude Code slash commands/hooks, markdown-first architecture.

---

## 1. Project Scaffolding

### Approach: Shell Out to Official CLI Tools via `child_process.spawn`

Motif does NOT need programmatic APIs from these tools. None of them expose stable programmatic Node.js APIs for project creation. The correct pattern is: spawn the official CLI command as a child process with non-interactive flags.

**Why `spawn` not `execSync`:** Scaffolding commands install dependencies (can take 30-60s). `spawn` streams output to the user in real-time. `execSync` blocks and shows nothing until complete.

### Framework CLI Commands (Verified)

#### Next.js (via create-next-app)

| Aspect | Value | Confidence |
|--------|-------|------------|
| Current version | Next.js 16.1 (latest stable: 16.1.6) | HIGH -- [official docs](https://nextjs.org/docs/app/api-reference/cli/create-next-app) |
| Node.js requirement | >=20.9 (compatible with Motif's >=22) | HIGH |
| Scaffolding command | `npx create-next-app@latest {name} --ts --tailwind --app --eslint --src-dir --use-npm --yes` | HIGH |
| Key non-interactive flag | `--yes` skips all prompts, uses defaults or previous prefs | HIGH |
| Skip install flag | `--skip-install` (useful for dry-run or custom install) | HIGH |
| Disable git flag | `--disable-git` (Motif manages git separately) | HIGH |

**Recommended Motif command:**
```bash
npx create-next-app@latest {project-name} \
  --ts \
  --tailwind \
  --app \
  --eslint \
  --src-dir \
  --use-npm \
  --yes \
  --disable-git
```

**Rationale:** TypeScript is default in Next.js 16. App Router is the recommended architecture. Tailwind is default. `--src-dir` gives clean separation for Motif to place components. `--disable-git` because Motif projects already have git.

#### Vite + React (via create-vite)

| Aspect | Value | Confidence |
|--------|-------|------------|
| Current version | Vite 7.3.1 | HIGH -- [official docs](https://vite.dev/guide/) |
| Node.js requirement | >=22 (Vite 7 raised baseline) | HIGH |
| Scaffolding command | `npm create vite@latest {name} -- --template react-ts` | HIGH |
| Available React templates | `react`, `react-ts`, `react-swc`, `react-swc-ts` | HIGH |
| Non-interactive | Template flag makes it non-interactive | HIGH |

**Recommended Motif command:**
```bash
npm create vite@latest {project-name} -- --template react-ts
```

Then separately:
```bash
cd {project-name} && npm install
```

**Rationale:** `react-ts` for TypeScript. SWC variant (`react-swc-ts`) is faster but adds complexity. Standard `react-ts` is sufficient. Vite does not install dependencies automatically like create-next-app -- requires separate `npm install`.

#### Expo / React Native (via create-expo-app)

| Aspect | Value | Confidence |
|--------|-------|------------|
| Current SDK | Expo SDK 55 (React Native 0.83, React 19.2) | HIGH -- [official changelog](https://expo.dev/changelog/sdk-55) |
| Node.js requirement | >=18 (compatible with Motif's >=22) | MEDIUM |
| Scaffolding command | `npx create-expo-app@latest {name} --template blank-typescript --yes` | HIGH -- [official docs](https://docs.expo.dev/more/create-expo/) |
| Key flags | `--yes` (defaults), `--no-install` (skip deps), `--template` (template selection) | HIGH |
| Available templates | `default` (Router+TS), `blank`, `blank-typescript`, `tabs`, `bare-minimum` | HIGH |

**Recommended Motif command:**
```bash
npx create-expo-app@latest {project-name} --template blank-typescript --yes
```

**Rationale:** `blank-typescript` for minimal setup. The `default` template includes Expo Router which adds opinions Motif should not impose. `tabs` template is too opinionated. `blank-typescript` gives a clean canvas for Motif-generated components.

**Alternative for navigation-heavy apps:**
```bash
npx create-expo-app@latest {project-name} --template default --yes
```

The `default` template includes Expo Router (file-based routing) and TypeScript by default. Use when the project needs navigation.

#### Static HTML (no CLI tool needed)

| Aspect | Value | Confidence |
|--------|-------|------------|
| Scaffolding | Motif generates directory structure directly | HIGH |
| No external CLI | Pure `node:fs` mkdir + writeFile | HIGH |

**Recommended structure:**
```
{project-name}/
  index.html
  css/
    tokens.css
    styles.css
  js/
    main.js
  assets/
```

**Rationale:** Static HTML is the current Motif output format (greenfield mode already writes to `.planning/design/screens/`). For v1.4, the scaffolder creates a proper project directory with separated concerns instead of dumping everything in `.planning/`.

### Scaffolding Architecture Decision

**Motif scaffolding is a Node.js script that spawns CLI commands.** It is NOT a framework-specific template system. The script:

1. Reads PROJECT.md to determine the target framework
2. Spawns the appropriate `create-*` CLI via `child_process.spawn`
3. Waits for completion
4. Post-processes the scaffolded project (injects tokens, creates component directories)

**Implementation location:** `scripts/scaffold.js` (new file, pure Node.js)

**Why NOT use framework-specific template repos:**
- Templates go stale (version drift)
- Official CLIs handle dependency resolution, boilerplate, and config
- Motif adds value AFTER scaffolding (tokens, components, design system) not DURING

---

## 2. Framework-Specific Component Output

### Token Format Per Platform

Motif currently generates `tokens.css` with CSS custom properties. For cross-platform support, the same design tokens must be output in platform-appropriate formats.

| Platform | Token Format | File | Example |
|----------|-------------|------|---------|
| Next.js / Vite / HTML | CSS Custom Properties | `tokens.css` | `--color-primary: #2563eb;` |
| React Native | TypeScript constants object | `tokens.ts` | `export const colors = { primary: '#2563eb' } as const;` |

**Token transpilation approach:** Generate `tokens.ts` FROM `tokens.css` as a build step. `tokens.css` remains the source of truth. A new script `scripts/tokens-to-rn.js` parses CSS custom properties and outputs a TypeScript constants file.

**Confidence: HIGH** -- This is a straightforward text transformation. CSS custom properties follow `--{category}-{name}: {value};` pattern. The script reads this and outputs `export const {category} = { {name}: '{value}' } as const;`.

**Why NOT use Style Dictionary or design token tools:** Zero-dependency constraint. The transformation is simple enough that a 50-line Node.js script handles it. Style Dictionary would add a dependency and complexity for a problem that is essentially string parsing.

#### CSS Custom Properties (Web platforms: Next.js, Vite, HTML)

Current format, no changes needed:

```css
:root {
  /* Colors */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-bg: #ffffff;

  /* Typography */
  --font-display: 'Playfair Display', serif;
  --font-body: 'Source Sans 3', sans-serif;
  --font-size-base: 1rem;

  /* Spacing */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
}
```

**Integration:**
- Next.js: Import in `globals.css` or `layout.tsx` via `import './tokens.css'`
- Vite: Import in `main.tsx` via `import './tokens.css'`
- HTML: `<link rel="stylesheet" href="css/tokens.css">`

#### React Native StyleSheet Constants (Expo)

Generated from tokens.css by `scripts/tokens-to-rn.js`:

```typescript
// Auto-generated from tokens.css by Motif. Do not edit manually.

export const colors = {
  primary: '#2563eb',
  primaryHover: '#1d4ed8',
  bg: '#ffffff',
} as const;

export const typography = {
  fontDisplay: 'Playfair Display',
  fontBody: 'Source Sans 3',
  fontSizeBase: 16,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
} as const;

// Composed theme object for convenience
export const theme = { colors, typography, spacing } as const;
```

**Key transformations:**
- `rem` -> `px` (multiply by 16, React Native uses unitless numbers = dp)
- Kebab-case -> camelCase (`color-primary` -> `colorPrimary`, but grouped: `colors.primary`)
- Font families stripped of fallbacks (`'Playfair Display', serif` -> `'Playfair Display'`)
- CSS variable syntax removed (no `var()`)

### Component Output Patterns Per Platform

#### Web Components (Next.js, Vite, HTML)

**JSX + CSS Custom Properties (inline styles or CSS Modules):**

```tsx
// components/StatCard.tsx
import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ label, value, trend = 'neutral' }: StatCardProps) {
  return (
    <div style={{
      padding: 'var(--space-lg)',
      borderRadius: 'var(--radius-md)',
      backgroundColor: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
    }}>
      <span style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
      }}>
        {label}
      </span>
      <p style={{
        fontSize: 'var(--font-size-2xl)',
        fontFamily: 'var(--font-display)',
        color: 'var(--color-text)',
      }}>
        {value}
      </p>
    </div>
  );
}
```

**This is already close to what Motif outputs today** for brownfield React projects. The compose-screen workflow checks `{STACK}` and adapts. For v1.4, the key change is: greenfield output goes into the scaffolded project directory, not `.planning/design/screens/`.

#### Next.js-Specific Patterns

| Pattern | Implementation | Notes |
|---------|---------------|-------|
| App Router pages | `src/app/{route}/page.tsx` | Default export, server component by default |
| Client components | `'use client'` directive at top | For interactive components with state/effects |
| Layouts | `src/app/{route}/layout.tsx` | Shared UI between routes |
| Loading states | `src/app/{route}/loading.tsx` | Streaming/Suspense boundary |
| Metadata | `export const metadata: Metadata = {...}` | SEO, in page.tsx or layout.tsx |
| Image handling | `import Image from 'next/image'` | Optimization built-in |
| Font loading | `import { FontName } from 'next/font/google'` | Zero-layout-shift fonts |

**Next.js font loading replaces CDN links.** Current Motif outputs Google Fonts CDN `<link>` tags. For Next.js, use `next/font/google`:

```tsx
// src/app/layout.tsx
import { Playfair_Display, Source_Sans_3 } from 'next/font/google';

const display = Playfair_Display({ subsets: ['latin'], variable: '--font-display' });
const body = Source_Sans_3({ subsets: ['latin'], variable: '--font-body' });

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${display.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

**Confidence: HIGH** -- This is documented Next.js pattern, verified via [official docs](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

#### React Native Components (Expo)

```tsx
// components/StatCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme/tokens';

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'neutral';
}

export function StatCard({ label, value, trend = 'neutral' }: StatCardProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontSize: typography.fontSizeSm,
    color: colors.textSecondary,
  },
  value: {
    fontSize: typography.fontSize2xl,
    fontFamily: typography.fontDisplay,
    color: colors.text,
  },
});
```

**Key differences from web components:**
- `View` instead of `div`, `Text` instead of `span`/`p`
- `StyleSheet.create()` instead of inline CSS or CSS Modules
- Import token constants instead of `var(--token-name)`
- No CSS units (React Native uses density-independent pixels)
- `flexDirection` defaults to `column` (opposite of web)
- No cascading styles (each component must be explicit)
- `borderRadius` is a number, not a string
- Font loading handled by Expo (expo-font or config plugin)

**Confidence: HIGH** -- Standard React Native patterns, verified via [official StyleSheet docs](https://reactnative.dev/docs/stylesheet).

### Compose Workflow Changes

The existing `compose-screen.md` workflow already reads `{STACK}` from PROJECT.md and adapts output. For v1.4, the key changes:

| Current Behavior | v1.4 Behavior |
|------------------|---------------|
| Greenfield output -> `.planning/design/screens/` | Greenfield output -> scaffolded project directory |
| Stack detection from PROJECT.md | Stack detection determines output format (JSX, RN, HTML) |
| Tokens always CSS custom properties | Tokens format matches platform (CSS vars or TS constants) |
| Font loading via CDN `<link>` | Font loading via platform mechanism (next/font, expo-font, CDN) |
| Icons via CDN class names | Icons via platform mechanism (lucide-react, @expo/vector-icons, CDN) |

**Implementation:** Update the agent spawn prompt in `compose-screen.md` to include platform-specific rules based on `{STACK}`. No new scripts needed -- the LLM composes correctly given the right instructions and token format.

---

## 3. Auto-Run (Dev Server Launch + Browser/Simulator Opening)

### Dev Server Launch

Each framework has a standard dev command. Motif spawns it via `child_process.spawn` with `stdio: 'inherit'` so the user sees dev server output.

| Framework | Dev Command | Default Port | Confidence |
|-----------|------------|--------------|------------|
| Next.js 16 | `npx next dev --turbopack` | 3000 | HIGH |
| Vite 7 | `npx vite` | 5173 | HIGH |
| Expo | `npx expo start` | 8081 | HIGH |
| Static HTML | `npx serve .` OR built-in Node.js | 3000 | MEDIUM |

**For static HTML:** Two options:
1. `npx serve .` -- uses the `serve` package via npx (no install needed, downloads on demand)
2. Built-in: Node.js >=22 does not have a built-in static file server CLI. A 20-line script using `node:http` and `node:fs` could serve files, but `npx serve .` is simpler and well-known.

**Recommendation:** Use `npx serve .` for static HTML. It requires no dependency installation and is the community standard.

**Implementation location:** `scripts/dev-server.js` (new file) or inline in the workflow. Reads PROJECT.md for framework, spawns the appropriate command.

### Browser Opening (Web Platforms)

**Use platform-specific OS commands via `child_process.spawn`. No npm package needed.**

```javascript
function openBrowser(url) {
  const { spawn } = require('node:child_process');
  const platform = process.platform;

  const commands = {
    darwin: ['open', [url]],           // macOS
    win32: ['cmd', ['/c', 'start', url]], // Windows
    linux: ['xdg-open', [url]],        // Linux
  };

  const [cmd, args] = commands[platform] || commands.linux;
  spawn(cmd, args, { detached: true, stdio: 'ignore' }).unref();
}
```

**Why NOT use the `open` npm package:** Zero-dependency constraint. The three-platform switch above handles all cases Motif users encounter. The `open` package adds WSL detection, app-specific opening, and other features Motif does not need.

**Confidence: HIGH** -- `open` (macOS), `start` (Windows), `xdg-open` (Linux) are OS-level commands that have been stable for decades. This is the exact approach the `open` npm package uses internally.

### Simulator/Emulator Opening (Expo)

| Target | Command | Pre-requisite |
|--------|---------|---------------|
| iOS Simulator | `npx expo start --ios` | Xcode + Simulator installed |
| Android Emulator | `npx expo start --android` | Android Studio + emulator configured |
| Expo Go (phone) | `npx expo start` (shows QR code) | Expo Go app on device |

**Recommendation:** Default to `npx expo start` which shows the interactive terminal with options (press `i` for iOS, `a` for Android). Do NOT auto-launch a specific simulator -- the user should choose.

**However, if the user explicitly requests iOS or Android:**
```bash
npx expo start --ios     # launches iOS Simulator
npx expo start --android # launches Android Emulator
```

**Confidence: HIGH** -- verified via [Expo CLI docs](https://docs.expo.dev/more/expo-cli/).

### Auto-Run Architecture

Auto-run is a post-scaffold, post-compose action. The flow:

```
/motif:compose completes all screens
    |
    v
User runs /motif:run (new command)
    |
    v
scripts/auto-run.js reads PROJECT.md for {STACK}
    |
    +-- Next.js:  spawn 'npx next dev --turbopack'  -> wait for "Ready" -> openBrowser('http://localhost:3000')
    +-- Vite:     spawn 'npx vite'                   -> wait for "Local:" -> openBrowser(parsed URL)
    +-- Expo:     spawn 'npx expo start'             -> (user picks platform from interactive menu)
    +-- HTML:     spawn 'npx serve .'                 -> wait for "Accepting" -> openBrowser(parsed URL)
```

**"Wait for ready" pattern:** Parse stdout from the dev server child process. Each framework prints a distinctive ready message:
- Next.js: `Ready in Xms` or `Local: http://...`
- Vite: `Local:   http://localhost:5173/`
- Expo: `Metro waiting on http://...`
- serve: `Accepting connections at http://...`

Use `child.stdout.on('data', ...)` to detect the ready message, then open the browser.

**Implementation:** `scripts/auto-run.js` -- a single Node.js script (~80 lines) that reads the stack from PROJECT.md and spawns the right command.

---

## 4. What Motif Does NOT Add (Explicit Anti-Scope)

| Do NOT Add | Why |
|------------|-----|
| State management (Redux, Zustand, Jotai) | Motif generates design, not application logic |
| Backend / API layer | Out of scope -- Motif is frontend design |
| Testing frameworks (Jest, Vitest, Playwright) | Adds complexity, not core to design system output |
| CSS-in-JS libraries (styled-components, Emotion) | Motif uses CSS custom properties (web) or StyleSheet (RN) -- no extra deps |
| NativeWind / Tailwind for React Native | Adds a dependency to scaffolded projects. StyleSheet.create is sufficient for design system output |
| Expo Router in blank template | Too opinionated. User can add later. Blank template is cleanest starting point |
| Framework version pinning | Always use `@latest` in create commands. Motif adapts to whatever version is installed |
| Package manager opinions | Default to npm. Respect user's existing lockfile if detected |
| Docker / containerization | Deployment is out of scope |
| CI/CD configuration | Deployment is out of scope |

---

## Recommended Stack (Complete Summary)

### Motif's Own Dependencies: Still Zero

All new capabilities use Node.js built-ins and CLI tool spawning. No npm dependencies added to `motif-design`.

| Technology | Version | Purpose | Status |
|------------|---------|---------|--------|
| Node.js | >=22.0.0 | Runtime for all scripts | No change |
| `node:child_process` (spawn) | built-in | Scaffold CLI execution, dev server launch, browser open | NEW usage |
| `node:fs` | built-in | Token transpilation, directory creation | Expanded usage |
| `node:path` | built-in | Cross-platform path handling | No change |
| `node:http` | built-in | Potential static file serving (fallback only) | NEW usage (optional) |

### CLI Tools Spawned by Motif (Not Dependencies)

These are invoked via `child_process.spawn`. They are dependencies of the SCAFFOLDED PROJECT, not of Motif itself.

| Tool | Invocation | Version | Purpose |
|------|-----------|---------|---------|
| create-next-app | `npx create-next-app@latest` | Latest (currently 16.1.x) | Next.js project scaffolding |
| create-vite | `npm create vite@latest` | Latest (currently 7.3.x) | Vite + React project scaffolding |
| create-expo-app | `npx create-expo-app@latest` | Latest (SDK 55) | Expo/React Native scaffolding |
| next (dev server) | `npx next dev --turbopack` | Installed by scaffold | Next.js dev server |
| vite (dev server) | `npx vite` | Installed by scaffold | Vite dev server |
| expo (dev server) | `npx expo start` | Installed by scaffold | Expo dev server |
| serve | `npx serve .` | Latest | Static file serving (HTML projects) |

### New Motif Scripts

| File | Purpose | Size Estimate | Dependencies |
|------|---------|---------------|--------------|
| `scripts/scaffold.js` | Framework project scaffolding via CLI spawn | ~120 lines | node:child_process, node:fs, node:path |
| `scripts/tokens-to-rn.js` | Transpile tokens.css to tokens.ts for React Native | ~60 lines | node:fs, node:path |
| `scripts/auto-run.js` | Dev server launch + browser/simulator opening | ~80 lines | node:child_process, node:fs |

### Modified Motif Files

| File | Change | Purpose |
|------|--------|---------|
| `core/workflows/compose-screen.md` | Add platform-specific output rules per {STACK} | Framework-aware component generation |
| `core/workflows/generate-system.md` | Generate tokens.ts alongside tokens.css when stack is Expo | React Native token format |
| `core/templates/STATE-TEMPLATE.md` | Add `## Platform` field (web/mobile/both) | Platform awareness in state |
| `runtimes/claude-code/commands/motif/run.md` | NEW: /motif:run command | Auto-run workflow |
| `runtimes/claude-code/commands/motif/init.md` | Add framework selection to init flow | Scaffold trigger |

### New Motif Command

| Command | Purpose | Invokes |
|---------|---------|---------|
| `/motif:run` | Launch dev server and open browser/simulator | `scripts/auto-run.js` |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Scaffolding method | Spawn official CLIs (`create-next-app`, etc.) | Custom template directories | Templates go stale with framework updates. Official CLIs handle version-specific boilerplate, dependency resolution, and config correctly. |
| Token format (RN) | Custom `tokens-to-rn.js` script | Style Dictionary | Zero-dependency constraint. The transformation is a simple parse-and-emit (~60 lines). Style Dictionary is a full build tool designed for multi-platform enterprise token pipelines -- massive overkill. |
| Browser opening | Platform-detect `open`/`start`/`xdg-open` | `open` npm package (sindresorhus) | Zero-dependency constraint. The 3-platform switch is ~10 lines and covers all Motif use cases. The npm package adds WSL detection, app-specific opening, and error handling Motif does not need. |
| React Native styling | `StyleSheet.create` + token constants | NativeWind (Tailwind for RN) | Adding NativeWind to scaffolded projects imposes an opinion. StyleSheet is built into React Native -- zero additional deps in scaffolded projects. |
| Expo template | `blank-typescript` | `default` (with Expo Router) | Blank gives Motif full control over project structure. Router template adds file-based routing that may conflict with Motif's screen composition. User can always upgrade. |
| Static server | `npx serve .` | Custom Node.js http server | `serve` is well-known, works via npx without install, handles MIME types and edge cases. A custom server would need to handle MIME type mapping, directory listing, 404s -- not worth it. |
| Dev server detection | Parse stdout for "ready" messages | Fixed timeout + open | Timeout-based approach either opens too early (server not ready) or waits too long. Stdout parsing is deterministic -- open when the server says it is ready. |
| Vite template | `react-ts` | `react-swc-ts` (SWC compiler) | SWC is faster but adds toolchain complexity. Standard `react-ts` uses the React Compiler (Vite 7 default) which is the ecosystem direction. |

---

## Version Matrix (Verified March 2026)

| Framework | Latest Stable | Release Date | Node.js Req | Source |
|-----------|--------------|--------------|-------------|--------|
| Next.js | 16.1.6 | Feb 2026 | >=20.9 | [nextjs.org](https://nextjs.org/docs/app/api-reference/cli/create-next-app) |
| Vite | 7.3.1 | Jan 2026 | >=22 | [vite.dev](https://vite.dev/guide/) |
| Expo SDK | 55 | Jan 2026 | >=18 | [expo.dev](https://expo.dev/changelog/sdk-55) |
| React | 19.2 | Dec 2025 | >=18 | Via Expo SDK 55 |
| React Native | 0.83 | Dec 2025 | >=18 | Via Expo SDK 55 |

**Node.js compatibility:** All frameworks require >=18 or >=20. Motif requires >=22. No conflicts -- Motif's requirement is the strictest and satisfies all frameworks.

---

## Sources

- [Next.js create-next-app CLI Reference](https://nextjs.org/docs/app/api-reference/cli/create-next-app) -- Full flag list, version 16.1.6 (HIGH confidence)
- [Vite Getting Started Guide](https://vite.dev/guide/) -- Scaffolding, templates, version 7.3.1 (HIGH confidence)
- [Vite Releases](https://vite.dev/releases) -- Version history, Vite 7 announcement (HIGH confidence)
- [Expo create-expo-app Documentation](https://docs.expo.dev/more/create-expo/) -- Flags, templates, SDK 55 (HIGH confidence)
- [Expo SDK 55 Changelog](https://expo.dev/changelog/sdk-55) -- React Native 0.83, React 19.2 (HIGH confidence)
- [Expo CLI Reference](https://docs.expo.dev/more/expo-cli/) -- start, run:ios, run:android commands (HIGH confidence)
- [React Native StyleSheet Documentation](https://reactnative.dev/docs/stylesheet) -- StyleSheet.create patterns (HIGH confidence)
- [Node.js child_process Documentation](https://nodejs.org/api/child_process.html) -- spawn, execSync, stdio options (HIGH confidence)
- [sindresorhus/open GitHub](https://github.com/sindresorhus/open) -- Cross-platform browser opening patterns (HIGH confidence, used as reference not dependency)
- Existing Motif codebase: `compose-screen.md`, `generate-system.md`, `STATE-TEMPLATE.md`, `package.json` -- reviewed 2026-03-09 (HIGH confidence)

---
*Stack research for: Cross-platform scaffolding, framework-specific component output, auto-run*
*Researched: 2026-03-09*
