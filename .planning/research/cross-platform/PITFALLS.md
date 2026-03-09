# Domain Pitfalls: Cross-Platform Scaffolding, Framework-Aware Output, and Auto-Run

**Domain:** Adding project scaffolding, framework-specific component generation (React/Next.js/React Native/Expo), and auto-run (dev server management) to existing Motif design-to-code tool
**Researched:** 2026-03-09
**Confidence:** HIGH for scaffolding and component output pitfalls (verified against official docs, RN layout docs, npm ecosystem behavior); MEDIUM for auto-run pitfalls (based on Node.js child_process docs and community patterns)

---

## Critical Pitfalls

Mistakes that cause broken scaffolds, apps that do not start, or silent design fidelity loss. Any one of these can make the feature worse than not having it -- a broken scaffold erodes trust faster than no scaffold at all.

---

### Pitfall 1: Scaffolded Project Fails on First Run Due to Node.js / Package Manager Version Mismatch

**What goes wrong:** Motif scaffolds a new Expo or Next.js project, installs dependencies, and tells the user "your app is ready." The user (or auto-run) runs `npm start` and gets a cryptic error: `EBADENGINE`, `ERR_MODULE_NOT_FOUND`, or Expo's `expo-doctor` reports SDK version incompatibility. The project was scaffolded with assumptions about Node 22 but the user has Node 18. Or the scaffold used `npm install` but the user's system resolves to `pnpm` via Corepack, and pnpm's strict `node_modules` layout breaks a transitive dependency that expects hoisted packages.

**Why it happens:** Motif itself is zero-dependency and runs on Node 22+. But the SCAFFOLDED projects are not Motif -- they are real Next.js/Expo apps with hundreds of transitive dependencies. These frameworks have their own Node.js version requirements. Expo SDK 52+ requires Node 18+. Next.js 15 requires Node 18.17+. React Native's Metro bundler has known issues with Node 22's changed module resolution. The scaffolder cannot control which Node.js version the user has, and `process.version` at scaffold time may differ from what's available at run time (nvm/fnm users switch versions between projects).

**Consequences:**
- User sees "Motif doesn't work" when the actual problem is environmental
- Auto-run starts the dev server, it crashes immediately, and the user sees a wall of error text with no actionable fix
- The zero-to-running promise is broken at the first step

**Prevention:**
- Before scaffolding, detect Node.js version (`process.version`) and the target framework's minimum requirement. If incompatible, fail early with a specific message: "Next.js 15 requires Node 18.17+. You have Node 16.14. Run `nvm use 18` and try again."
- Detect which package manager is active: check for `package-lock.json` (npm), `yarn.lock` (yarn), `pnpm-lock.yaml` (pnpm) in the parent directory, or check `npm_config_user_agent` env var. Use whatever the user already uses -- do not force npm on a pnpm user.
- Pin framework versions in scaffold templates. Do not use `@latest` -- use a known-good version that has been tested with the scaffold. Example: `create-next-app@14.2.5`, not `create-next-app@latest`.
- Run `npx expo-doctor` or equivalent health check as the last scaffold step, before declaring success.

**Detection:** Scaffold completes but `npm start` / `npx expo start` fails within the first 30 seconds. Error messages containing `EBADENGINE`, `peer dep`, `Cannot find module`, or Metro bundler crashes.

**Phase:** Scaffolding foundation -- this must be the first thing validated, before auto-run is even attempted.

---

### Pitfall 2: CSS-to-React-Native Translation Silently Drops Properties

**What goes wrong:** Motif's design system produces `tokens.css` with CSS custom properties (`--color-primary-500`, `--radius-lg`, `--shadow-md`). The component generator translates these into React Native `StyleSheet.create()` calls. But CSS and React Native's style system are fundamentally different, and the translator silently drops properties it cannot convert. The user gets a component that renders without errors but looks nothing like the design.

**Why it happens:** React Native's style engine is NOT CSS. It is a subset of Flexbox with platform-specific extensions. The following CSS properties have NO React Native equivalent and will be silently lost if not explicitly handled:

| CSS Property | React Native Status | What Breaks |
|---|---|---|
| `box-shadow` | iOS only (`shadowColor/Offset/Opacity/Radius`). Android uses `elevation` (no color/spread control). | Shadows look completely different across platforms, or disappear on Android. |
| `position: fixed` | Does not exist. Only `relative` and `absolute`. | Sticky headers, floating action buttons need complete reimplementation. |
| CSS Grid (`display: grid`, `grid-template-*`) | Does not exist. Flexbox only. | Any grid-based layout silently collapses to a single column. |
| `border-radius` on individual sides with different values | Partially supported but `borderStyle` cannot be applied per-side. | Complex border treatments break. |
| `::before` / `::after` pseudo-elements | Do not exist. | Decorative elements, badges, indicators disappear. |
| `:hover` / `:focus` / `:active` pseudo-classes | Do not exist natively. | Interactive states require explicit `Pressable` with callback-based styles. |
| `transform` (multiple) | Requires array syntax: `transform: [{ rotate: '45deg' }, { scale: 2 }]` | String-based `transform: rotate(45deg) scale(2)` crashes at runtime. |
| `calc()` | Does not exist. | Dynamic sizing needs `Dimensions` API or percentage + padding workarounds. |
| `rem` / `em` / `vh` / `vw` units | Do not exist. Only unitless numbers (dp). | All typographic and spacing scales must be converted to numeric dp values. |
| `var()` (CSS custom properties) | Does not exist in StyleSheet. | The entire token system cannot be used as-is -- must be JS constants. |
| `transition` / `animation` | Do not exist. Requires `Animated` API or `react-native-reanimated`. | Micro-interactions and transitions silently vanish. |
| `overflow: scroll` | Does not work on `View`. Requires `ScrollView` or `FlatList` component. | Scrollable containers silently clip content. |
| No style inheritance | Styles do NOT cascade from parent to child (unlike CSS). | Text color set on a parent `View` does not apply to child `Text` components. |

**Consequences:**
- Components render but look broken: no shadows on Android, collapsed grid layouts, missing decorative elements
- User blames Motif's design quality rather than the translation gap
- "Works in web preview but not in the app" erodes trust in the cross-platform story

**Prevention:**
- Build a property compatibility matrix into the component generator. For each CSS property being translated, the generator must know: (a) direct equivalent exists, (b) platform-specific workaround needed, (c) requires architectural change (e.g., Grid to nested Flexbox), or (d) not possible -- emit a comment.
- When a property cannot be translated, emit an inline comment in the generated code: `// TODO: CSS Grid layout not supported in RN -- converted to column Flexbox. Review layout.`
- Provide a "translation report" after component generation listing what was translated, what was approximated, and what was dropped.
- For the token system: generate `tokens.js` (a JS object with the same token names as keys and numeric dp values) alongside `tokens.css`. Both are generated from the same source of truth (the design system phase). Components import from the appropriate format.
- Default Flexbox differences must be compensated: React Native defaults `flexDirection: 'column'` (web defaults to `'row'`), `flexShrink: 0` (web defaults to `1`), `alignContent: 'flex-start'` (web defaults to `'stretch'`). The generator must explicitly set these when translating web-oriented layouts.

**Detection:** Visual diff between web HTML preview and React Native render. Any component with `display: grid`, `position: fixed`, `box-shadow`, or pseudo-elements in the source HTML.

**Phase:** Component output engine -- this is the core of the framework-aware generation feature. Must be deeply understood before writing any translator code.

---

### Pitfall 3: Auto-Run Dev Server Becomes Zombie Process After Crash or User Abort

**What goes wrong:** Motif spawns a child process (`npx expo start`, `npx next dev`) via `child_process.spawn()`. The user hits Ctrl+C, or the Claude Code session ends, or the parent Motif process crashes. The child process keeps running, holding the port. Next time the user (or auto-run) tries to start the dev server, it fails with `EADDRINUSE: address already in use :::3000`. The user does not know how to find and kill the orphaned process. On macOS they might not even realize a process is running in the background.

**Why it happens:** Node.js child processes spawned with `spawn()` default to being attached to the parent. But if the parent crashes (not a clean exit), the OS does not always propagate SIGTERM to children. On macOS, orphaned Node.js processes continue running. On Linux with systemd, behavior depends on KillMode. The `detached: true` option in `spawn()` explicitly detaches the child, making orphaning MORE likely, not less. There is no universal "kill my children when I die" mechanism in Node.js.

**Consequences:**
- Port locked by orphan process: `Error: listen EADDRINUSE :::3000`
- User must manually find and kill the process (`lsof -i :3000`, then `kill`)
- Multiple orphaned dev servers consume memory and CPU
- On CI or remote environments, orphans accumulate until the container is restarted

**Prevention:**
- Write a PID file when spawning: `.motif-dev-server.pid` in the project root. Before spawning, check if the PID file exists and if that process is still alive (`process.kill(pid, 0)` -- signal 0 checks existence without killing).
- If a stale PID is found, kill it before starting a new server.
- Use `spawn()` with `detached: false` (the default). Register cleanup on `process.on('exit')`, `process.on('SIGINT')`, `process.on('SIGTERM')`, and `process.on('uncaughtException')` to kill the child.
- Before binding to a port, check if the port is available: `net.createServer().listen(port)` wrapped in a try/catch. If unavailable, offer to kill the process on that port or use an alternative port.
- Use `tree-kill` pattern (kill process group, not just the PID) to catch sub-children (Metro spawns its own workers, Next.js spawns its own processes). The process group can be killed with `process.kill(-pid)` on Unix.
- On Windows, use `taskkill /PID <pid> /T /F` for tree-kill since Unix signals do not work.

**Detection:** `EADDRINUSE` error on auto-run. PID file exists but no corresponding process. Multiple `node` processes visible in Activity Monitor/htop that the user did not start.

**Phase:** Auto-run implementation -- must be solved before auto-run ships. This is the most common failure mode for dev server management.

---

### Pitfall 4: Scaffolding Assumes macOS Environment, Breaks on Windows and Linux

**What goes wrong:** Motif developers use macOS. The scaffolder works perfectly on macOS. A Windows user runs it and hits: backslash path separators breaking template string interpolation, `spawn` failing because `npx` is not directly executable (it is `npx.cmd` on Windows), file permissions not being set correctly (no `chmod` on Windows), and symlinks failing without admin privileges. A Linux user hits: missing `watchman` for React Native file watching, different default shell (`sh` vs `bash`), case-sensitive filesystem exposing import case mismatches that macOS hides.

**Why it happens:** `path.join()` produces `\` separators on Windows. Template files may embed `/`-separated paths as strings. `child_process.spawn('npx', [...])` throws `ENOENT` on Windows because `npx` is a CMD script, not an executable -- you need `spawn('npx', [...], { shell: true })` or `cross-spawn`. React Native's Metro bundler requires `watchman` on Linux for file watching (macOS has FSEvents built in). Case-insensitive macOS filesystem hides `import Dashboard from './dashboard'` when the file is `Dashboard.tsx`, but Linux will throw `MODULE_NOT_FOUND`.

**Consequences:**
- Scaffolded project created with broken paths on Windows
- Dev server spawn fails with cryptic `ENOENT` on Windows
- Components with case-mismatched imports work on macOS, fail on Linux/CI
- File watchers do not work on Linux without `watchman`, causing dev server to miss changes

**Prevention:**
- Use `path.posix.join()` for paths that will be written into generated source code (import statements, config files). Use `path.join()` only for filesystem operations.
- Use `cross-spawn` (or implement its logic: `shell: true` on Windows) for ALL child process spawning. This is the one exception to the zero-dependency rule that is worth making for scaffolded project management, OR implement the Windows detection inline: `const isWindows = process.platform === 'win32'; spawn(cmd, args, { shell: isWindows })`.
- Normalize all generated import paths to use `/` separators.
- In generated component code, ensure filenames and import references match case exactly. Validate at generation time: if a component file is `DashboardScreen.tsx`, the import must be `'./DashboardScreen'`, not `'./dashboardScreen'`.
- For Linux users, detect missing `watchman` and print: "React Native file watching requires watchman on Linux. Install with: `sudo apt install watchman`" before attempting to start a dev server.
- Test scaffold output with `path.sep` assertions: no `\` characters should appear in any generated source file.

**Detection:** `ENOENT` errors from `spawn()` on Windows. `MODULE_NOT_FOUND` on Linux/CI for imports that work locally on macOS. File watcher warnings from Metro on Linux.

**Phase:** Scaffolding foundation -- cross-platform path handling must be baked in from the start, not patched later.

---

## Moderate Pitfalls

Issues that degrade quality or cause user confusion but do not break the core flow.

---

### Pitfall 5: React Native Responsive Design Requires Fundamentally Different Approach

**What goes wrong:** The design system generates responsive breakpoints using CSS media queries (`@media (min-width: 768px)`). The web component generator uses these breakpoints correctly. The React Native generator tries to translate them into... nothing. React Native has no CSS media queries. The generated components either ignore responsive behavior entirely (phone-only layouts on tablets) or use `Dimensions.get('window').width` with hardcoded breakpoints that do not update on rotation or split-screen.

**Why it happens:** Web responsive design is declarative (CSS media queries). React Native responsive design is imperative (JavaScript dimension checks). They are not translatable -- they require different architectural approaches. On the web, a `<div>` becomes a 2-column grid above 768px via CSS alone. In React Native, you need `useWindowDimensions()` hook, conditional rendering in JSX, and potentially different component hierarchies for phone vs tablet.

**Prevention:**
- Do NOT try to translate CSS media queries into React Native. Instead, generate a `useResponsiveLayout()` hook per screen that reads `useWindowDimensions()` and returns a layout variant (`'phone' | 'tablet' | 'desktop'`).
- Generate separate layout configurations per variant, not separate components. The component renders the same data but with different `style` arrays based on the variant.
- Use NativeWind (Tailwind for React Native) as the recommended styling approach for scaffolded React Native projects. NativeWind supports responsive variants (`md:flex-row`, `lg:w-1/2`) that work like media queries. This is the closest to CSS responsive design that React Native gets.
- Document the limitation clearly: "Responsive layouts are approximated in React Native. Review tablet/landscape layouts manually."

**Detection:** Components that look correct on phone-width simulators but break on iPad or landscape orientation.

**Phase:** Component output engine -- responsive handling must be part of the initial RN generator design, not added later.

---

### Pitfall 6: Token Delivery Creates Two Sources of Truth

**What goes wrong:** Motif's design system generates `tokens.css` with CSS custom properties. For React Native, it also needs to generate `tokens.js` (or `tokens.ts`) with the same values as JavaScript constants. Now there are two files representing the same design decisions. A designer updates a color in the design system phase. The regenerated `tokens.css` is correct, but `tokens.js` still has the old value because the regeneration only updated the CSS file. Components on web use the new color; components in React Native use the old one.

**Why it happens:** The design system phase currently generates only `tokens.css`. Adding `tokens.js` means the generation step must produce BOTH files from the SAME intermediate representation. If the generation is done by an LLM (which it is -- the system architect agent generates tokens), there is no guarantee it generates both files identically. One might have a typo, a missing token, or a stale value.

**Prevention:**
- Generate `tokens.css` as the single source of truth. Then run a DETERMINISTIC script (not LLM-generated) that parses `tokens.css` and produces `tokens.js`. This script is pure string parsing: extract `--token-name: value;` lines, convert to `export const tokenName = 'value';`.
- The script (`scripts/token-transformer.js`) runs as a post-generation step. It is part of Motif's codebase, not user code.
- Never let the LLM generate `tokens.js` directly. It will drift from `tokens.css`.
- For React Native numeric values: the transformer converts `16px` to `16`, `1rem` to `16` (assuming 16px base), `0.5rem` to `8`. Color values pass through as strings. This conversion is mechanical and must be a script, not an LLM judgment call.
- Include a hash of `tokens.css` in a comment at the top of `tokens.js`: `// Generated from tokens.css (hash: abc123). Do not edit manually.`

**Detection:** Visual color/spacing differences between web and React Native versions of the same screen. `tokens.js` file modification date older than `tokens.css`.

**Phase:** Design system output -- must be implemented when framework-aware token delivery is built.

---

### Pitfall 7: Expo/React Native Simulator Setup Is a Major Hidden Prerequisite

**What goes wrong:** Auto-run starts the Expo dev server successfully. The terminal shows "Metro bundler ready." But the user has no simulator installed, no Xcode, no Android Studio. Expo opens a QR code for Expo Go on a physical device, but the user does not have Expo Go installed. Or the user expects to see the app in a browser-like preview (like they do with web HTML), but React Native apps do not render in a browser by default. The user stares at a terminal and thinks nothing happened.

**Why it happens:** Web scaffolding has a near-zero prerequisite: Node.js + a browser. Every developer has a browser. React Native scaffolding has massive hidden prerequisites: Xcode (6GB+), Android Studio (2GB+), simulator setup, Xcode command line tools, CocoaPods, Java JDK. Expo Go reduces this (run on physical device), but still requires the Expo Go app installed on a phone. The gap between "scaffold complete" and "seeing your app" is enormous for React Native compared to web.

**Prevention:**
- Before scaffolding a React Native/Expo project, run a prerequisite check:
  - Is Xcode installed? (`xcode-select -p`)
  - Is an iOS simulator available? (`xcrun simctl list devices available`)
  - Is Android Studio installed? (check `ANDROID_HOME` or `ANDROID_SDK_ROOT` env var)
  - Is Expo Go available? (cannot check -- inform the user)
- Present findings BEFORE scaffolding, not after: "To run this app, you will need: [Xcode with iOS Simulator] OR [Expo Go on your phone]. Missing: Xcode. Install it from the App Store (6GB) or switch to web-only scaffolding."
- Default to Expo with `--web` support enabled. This adds `expo-router` web support so the app CAN render in a browser as a fallback. Not identical to native, but it means the user sees SOMETHING immediately.
- For auto-run on Expo: prefer `npx expo start --web` as the default, with `--ios` or `--android` as explicit flags. Web start has near-zero prerequisites and gives instant feedback.

**Detection:** Auto-run reports "server started" but user sees nothing rendered. Terminal shows QR code with no instructions. User asks "where is my app?"

**Phase:** Auto-run implementation -- prerequisite checking must happen before the dev server is started.

---

### Pitfall 8: Scaffolded Projects Have Dependencies but Motif Has Zero

**What goes wrong:** Motif's zero-dependency constraint is a feature -- it installs instantly, has no `node_modules`, and never breaks due to dependency conflicts. But scaffolded projects ARE dependency-heavy (Next.js has 200+ transitive deps, Expo has 500+). The user runs `motif` and expects the same instant, reliable experience. Instead, they wait 60+ seconds for `npm install`, see deprecation warnings, and potentially hit `ERESOLVE` peer dependency conflicts. The contrast between Motif's reliability and the scaffolded project's fragility makes Motif look bad.

**Why it happens:** Motif cannot control the dependency graphs of Next.js, Expo, React, or React Native. These ecosystems move fast and break peer dependency contracts regularly. `npm install` for a fresh Expo project routinely produces 5-10 deprecation warnings and occasional peer dep conflicts that require `--legacy-peer-deps`.

**Prevention:**
- Use `create-next-app` and `create-expo-app` for scaffolding rather than assembling `package.json` manually. These official scaffolders are tested by their respective teams to produce installable projects.
- Pin specific versions of the scaffolding tools in Motif's configuration: `npx create-next-app@14.2.5`, not `npx create-next-app@latest`. Test these pinned versions before each Motif release.
- If `npm install` fails, retry with `--legacy-peer-deps` automatically and log the warning: "Installed with --legacy-peer-deps due to peer dependency conflicts. This is usually harmless."
- Show a clear phase distinction to the user: "Step 1: Setting up project (this downloads ~200 packages and may take 30-60 seconds)..." so they know the wait is expected.
- Capture and filter `npm install` output: suppress deprecation warnings, surface only errors. Show a progress indicator instead of raw npm output.

**Detection:** `npm install` taking over 60 seconds with no feedback. `ERESOLVE` errors. User confusion about the difference between Motif installing (instant) and project dependencies installing (slow).

**Phase:** Scaffolding foundation -- dependency installation strategy must be designed upfront.

---

### Pitfall 9: Port 3000 Conflict Is the Most Common Auto-Run Failure

**What goes wrong:** Auto-run tries to start the dev server on port 3000 (Next.js default) or 8081 (Metro/Expo default). The port is already in use -- by another dev server, by a previous Motif auto-run that was not cleaned up, or by an unrelated service. The dev server either fails to start or prompts "Port 3000 is in use. Use a different port? (Y/n)" -- but since it is a child process with no TTY, the prompt hangs forever.

**Why it happens:** Port 3000 is the most commonly used development port. Developers often have multiple projects running. Next.js and Expo both prompt interactively when the port is in use, but child processes spawned by Motif do not have an interactive TTY, so the prompt blocks indefinitely.

**Prevention:**
- Before spawning the dev server, check if the target port is available using a simple TCP connection test. If unavailable, auto-increment: try 3001, 3002, etc.
- Pass the port explicitly to the dev server: `npx next dev --port 3001` or `npx expo start --port 8082`. Never rely on the framework's default port.
- For Next.js: pass `--port` flag. For Expo: pass `--port` flag. For Vite: pass `--port` flag. Each framework has a different flag -- the scaffolder must know the correct one.
- Disable interactive prompts in child processes: set environment variable `CI=true` for Next.js (skips "use different port?" prompt), or use framework-specific non-interactive flags.
- Write the chosen port to `.motif-dev-server.json`: `{ "pid": 12345, "port": 3001, "framework": "nextjs", "started": "2026-03-09T..." }`. This lets subsequent Motif commands know where the dev server is running.

**Detection:** Auto-run hangs with no output (blocked on interactive prompt). `EADDRINUSE` error in spawn output.

**Phase:** Auto-run implementation -- port management is core auto-run infrastructure.

---

## Minor Pitfalls

Issues that cause friction but have straightforward fixes.

---

### Pitfall 10: Generated React Native Components Use Incorrect Import Patterns

**What goes wrong:** The component generator outputs `import { View, Text, Image } from 'react-native'` for every component. But some components need `SafeAreaView` (from `react-native-safe-area-context`, not from `react-native`), `ScrollView` vs `FlatList` (performance difference at scale), or `Pressable` instead of the deprecated `TouchableOpacity`. Generated imports reference the wrong package or use deprecated APIs.

**Prevention:**
- Maintain a curated import map in the component generator: `SafeAreaView` comes from `react-native-safe-area-context` (not `react-native`), `LinearGradient` comes from `expo-linear-gradient`, `BlurView` comes from `expo-blur`.
- Use `Pressable` for all touchable elements. Never generate `TouchableOpacity`, `TouchableHighlight`, or `TouchableWithoutFeedback` -- they are soft-deprecated.
- For lists of items, generate `FlatList` (not `ScrollView` with `.map()`). This is a React Native performance requirement, not a preference.

**Detection:** Deprecation warnings in Metro console. Runtime errors from wrong package imports.

**Phase:** Component output engine.

---

### Pitfall 11: Icon Delivery Differs Completely Between Web and React Native

**What goes wrong:** Motif's web output uses Lucide icons via CDN (`<i data-lucide="home"></i>` or SVG inline). The React Native generator tries the same approach. SVG does not render natively in React Native. CDN-based icon loading does not work. The icons are either missing or cause runtime errors.

**Why it happens:** React Native has no native SVG support. Icons require `react-native-svg` + a specific icon library component: `import { Home } from 'lucide-react-native'`. This is a completely different API from the web CDN approach. The icon name mapping is the same, but the delivery mechanism is fundamentally different.

**Prevention:**
- Map icon names (already chosen during design system phase) to the correct import for each platform:
  - Web: `<i data-lucide="home"></i>` or inline SVG (current behavior)
  - React Native: `import { Home } from 'lucide-react-native'` (component-based)
- Include `lucide-react-native` and `react-native-svg` in the scaffolded project's dependencies when the target is React Native.
- The icon name is the shared contract between platforms. Store it in the design system. The delivery mechanism is platform-specific and handled by the component generator.

**Detection:** Missing icons in React Native render. `SvgXml is not defined` or similar SVG-related runtime errors.

**Phase:** Component output engine -- must be handled alongside the icon library integration from the current milestone.

---

### Pitfall 12: `create-next-app` and `create-expo-app` Have Interactive Prompts That Block Automation

**What goes wrong:** Motif's scaffolder runs `npx create-next-app my-app` as a child process. The scaffolding tool asks: "Would you like to use TypeScript? (Y/n)", "Would you like to use ESLint? (Y/n)", "Would you like to use Tailwind CSS? (Y/n)". Since the child process has no interactive TTY, it either hangs waiting for input or uses defaults that may not match what Motif intended.

**Prevention:**
- Use non-interactive flags for ALL scaffolding commands:
  - Next.js: `npx create-next-app my-app --typescript --eslint --tailwind --app --src-dir --no-import-alias --yes`
  - Expo: `npx create-expo-app my-app --template blank-typescript`
  - Vite: `npx create-vite my-app --template react-ts`
- The `--yes` flag (or equivalent) skips all interactive prompts. Every scaffolding tool has one -- find and use it.
- Test each scaffolding command in a non-interactive shell (`spawn` with no `stdio: 'inherit'`) to confirm it completes without hanging.

**Detection:** Scaffold process hangs indefinitely. No project files created after 120 seconds.

**Phase:** Scaffolding foundation -- non-interactive invocation is day-one requirement.

---

### Pitfall 13: React Native Text Must Be Wrapped in `<Text>` Components

**What goes wrong:** The component generator produces JSX where raw strings appear inside `<View>` containers (like they would in `<div>` on web). React Native crashes at runtime: "Text strings must be rendered within a <Text> component." This is a hard crash, not a warning. Every single string, including spaces and line breaks in JSX, must be inside `<Text>`.

**Prevention:**
- The React Native component generator must enforce a strict rule: NO bare strings inside `<View>`. Every string literal, interpolated value, or conditional text expression must be wrapped in `<Text>`.
- This is not a "nice to have" lint rule -- it is a runtime crash. Test generated components by checking the JSX AST (or string pattern matching) for any text node that is a direct child of a non-Text component.

**Detection:** Immediate runtime crash with the error message above. This will be caught on first render.

**Phase:** Component output engine -- fundamental RN constraint.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Severity | Mitigation |
|---|---|---|---|
| **Scaffolding foundation** | Version mismatches between Node.js, framework, and package manager (Pitfall 1) | Critical | Pre-scaffold environment detection, pinned framework versions |
| **Scaffolding foundation** | Interactive prompts blocking automation (Pitfall 12) | Moderate | Non-interactive flags for all scaffold commands |
| **Scaffolding foundation** | Cross-platform path and spawn issues (Pitfall 4) | Critical | `path.posix` for source code, `cross-spawn` or `shell: true` for Windows |
| **Scaffolding foundation** | Dependency installation UX mismatch (Pitfall 8) | Moderate | Use official `create-*` tools, progress indicators, filtered output |
| **Component output engine** | CSS-to-RN silent property drops (Pitfall 2) | Critical | Property compatibility matrix, translation report, inline TODO comments |
| **Component output engine** | Responsive design paradigm mismatch (Pitfall 5) | Moderate | Generate `useResponsiveLayout()` hook, do not translate media queries |
| **Component output engine** | Text-in-View crashes (Pitfall 13) | Moderate | Strict `<Text>` wrapping enforcement in generator |
| **Component output engine** | Icon delivery differences (Pitfall 11) | Minor | Platform-specific icon import map |
| **Component output engine** | Incorrect imports and deprecated APIs (Pitfall 10) | Minor | Curated import map, prefer Pressable over TouchableOpacity |
| **Token delivery** | Two sources of truth drift (Pitfall 6) | Moderate | Deterministic `tokens.css` to `tokens.js` script, never LLM-generated |
| **Auto-run** | Zombie processes on crash/abort (Pitfall 3) | Critical | PID file, cleanup handlers, tree-kill pattern |
| **Auto-run** | Port 3000 conflicts (Pitfall 9) | Moderate | Pre-check port availability, auto-increment, explicit `--port` flag |
| **Auto-run** | Simulator prerequisites not met (Pitfall 7) | Moderate | Pre-scaffold prerequisite check, default to `--web` for Expo |

---

## Sources

- [React Native Flexbox Layout](https://reactnative.dev/docs/flexbox) -- flexDirection defaults to column, flexShrink defaults to 0, flex only supports single number (HIGH confidence)
- [React Native Style reference](https://reactnative.dev/docs/style) -- no CSS inheritance, StyleSheet.create() typing (HIGH confidence)
- [css-to-react-native (styled-components)](https://github.com/styled-components/css-to-react-native) -- unsupported shorthand properties, border limitations (HIGH confidence)
- [React Native styling limitations](https://gtcsys.com/faq/what-are-the-limitations-of-styling-and-customization-in-react-native/) -- no float, no position:fixed, no z-index parity, shadow platform differences (MEDIUM confidence)
- [cross-spawn npm package](https://www.npmjs.com/package/cross-spawn) -- Windows spawn issues with .cmd files, path separator differences (HIGH confidence)
- [Node.js child_process documentation](https://nodejs.org/api/child_process.html) -- spawn options, detached behavior, process group killing (HIGH confidence)
- [Port-Nuker: Cross-Platform Process Management](https://medium.com/@alexgutscher.career/building-port-nuker-a-deep-dive-into-cross-platform-process-management-531fbf5b1e95) -- orphan process patterns, tree-kill approach (MEDIUM confidence)
- [Expo Common Development Errors](https://docs.expo.dev/workflow/common-development-errors/) -- Metro bundler errors, SDK compatibility, expo-doctor (HIGH confidence)
- [Expo CLI Documentation](https://docs.expo.dev/more/expo-cli/) -- CLI flags, non-interactive mode (HIGH confidence)
- [Solving Common React Native + Expo Setup Errors (2025)](https://medium.com/@jagritisrvstv/solving-common-react-native-expo-setup-errors-2025-guide-9622d5772318) -- Node version issues, zsh/IntelliJ conflicts (MEDIUM confidence)
- [Unistyles 3.0](https://expo.dev/blog/unistyles-3-0-beyond-react-native-stylesheet) -- CSS variables in RN, dynamic themes, NativeWind alternative (MEDIUM confidence)
- [NativeWind v5](https://www.nativewind.dev/v5) -- Tailwind CSS for React Native, responsive variants (MEDIUM confidence)
- [Responsive Design in React Native](https://dev.to/aomuiz/responsive-design-in-react-native-building-apps-for-multiple-screen-sizes-1fnf) -- useWindowDimensions, no CSS media queries, PixelRatio API (MEDIUM confidence)
- Existing Motif codebase analysis: `bin/install.js`, `tokens.css` generation, HTML component output, Lucide CDN icon integration (HIGH confidence)

---
*Pitfalls research for: Cross-platform scaffolding, framework-aware component output, auto-run*
*Researched: 2026-03-09*
