# Phase 25: Auto-Run - Research

**Researched:** 2026-03-11
**Domain:** Post-compose dev server launch, ready detection, browser opening, and process lifecycle
**Confidence:** HIGH for codebase-grounded planning direction, MEDIUM for Windows runtime behavior because STATE.md still notes spawn compatibility as unverified

## Summary

Phase 25 should not invent a second execution system. Phase 24 already moved scaffold execution toward a centralized, registry-driven contract, and Phase 25 should extend that same contract into runtime launch.

The planning target is simple from the user’s perspective: after `/motif:compose`, Motif can optionally start the scaffolded app in the background, wait for a framework-specific ready signal, open the browser with native OS commands, and leave behind no orphaned process state.

The important planning conclusion is that auto-run belongs in a shared runtime launcher layer keyed by platform metadata already persisted through Phases 22 to 24:
- Phase 22 established platform as durable state and registry as the platform contract.
- Phase 23 established overlay-driven composition and post-scaffold user flow.
- Phase 24 established centralized scaffold execution and expanded platform coverage beyond Next.js.

**Primary recommendation:** plan Phase 25 as one shared launch/session architecture with two work tracks:
1. launch orchestration and framework-specific ready detection
2. session tracking, cleanup, and port-conflict handling

Do not plan auto-run as ad hoc `npm run dev` shelling from `/motif:compose`. That would bypass the platform registry, duplicate framework rules, and make Phase 26 harder.

## What Already Exists

### Reusable Foundation

| Surface | Current State | Planning Implication |
|---|---|---|
| `.planning/STATE.md` | Platform and milestone state are already persisted in planning artifacts | Runtime session state should follow the same artifact-first pattern instead of living only in process memory. |
| Phase 22 platform model | Supported platforms are already explicit: `web-nextjs`, `web-vite`, `web-static`, `mobile-expo` | Auto-run should resolve behavior from platform, not from package heuristics at launch time. |
| Framework registry pattern | Platform behavior is already centralized in registry metadata | Ready patterns, launch command defaults, preview URLs, and browser-open policy should be added to the registry contract rather than hardcoded in workflows. |
| Phase 23 compose flow | `/motif:compose` is the user-visible point after scaffolded output exists | Auto-run should be an optional post-compose step, not a separate user workflow. |
| Phase 24 scaffold centralization | Scaffold execution is now intended to be shared and registry-driven | The same executor family should own dev server spawn and teardown so scaffolded/runtime behavior stays aligned. |

### Constraints From Requirements

- `ARUN-01` requires background launch after composition.
- `ARUN-02` requires framework-specific stdout-based ready detection before opening a preview.
- `ARUN-03` requires PID tracking and cleanup on exit.
- `ARUN-04` requires OS-native browser opening with zero npm dependencies.

These requirements make Phase 25 primarily an integration and lifecycle phase, not a composition phase.

## Planning-Critical Gaps

### Gap 1: No Shared Runtime Launcher Contract Yet

Phase 24 established scaffold materialization, but there is no equivalent shared contract for starting a composed app afterward.

Why this matters:
- Phase 25 will otherwise couple launch rules to one command path.
- Next.js, Vite, static, and later Expo will drift into separate runtime behaviors.

### Gap 2: Ready Detection Cannot Stay Generic

The roadmap explicitly calls for framework-specific ready messages. A single `"localhost"` substring check is not enough for planning.

Why this matters:
- Next.js, Vite, Expo web, and any static preview path expose readiness differently.
- Browser opening before route/bootstrap completion creates flaky first-run UX and false failures.

### Gap 3: Browser Opening Must Be Platform-Native and Dependency-Free

Requirements rule out opener packages. The launcher must rely on native OS commands triggered from Node process APIs.

Why this matters:
- planning must cover command construction and failure surfaces for macOS, Linux, and Windows
- Windows is already called out in STATE.md as a concern, so validation cannot assume parity without explicit checks

### Gap 4: PID Tracking Needs a Real Session Artifact

Background spawn without durable tracking will fail `ARUN-03`. The user must be able to inspect running Motif-launched servers and Motif must be able to reap them on normal exit and interrupted runs.

Why this matters:
- terminal detach alone is not enough
- cleanup behavior must survive partial failures and repeated compose runs

### Gap 5: Port Conflict Strategy Must Be Decided Up Front

Auto-run becomes unreliable if the default port is already occupied by an old Motif process or another local server.

Why this matters:
- silent auto-increment can open the wrong app
- silent failure strands the user after composition
- planner needs a consistent policy for “reuse, kill tracked process, ask user, or fail”

## Standard Stack

Use:
- Node `child_process.spawn` for background launch and signal handling
- Node filesystem APIs for a single durable session artifact under `.planning/`
- OS-native openers only: `open` on macOS, `xdg-open` on Linux, `cmd /c start ""` on Windows
- registry-declared launch metadata keyed by platform
- stdout/stderr stream parsing for readiness, not HTTP polling as the primary signal

Recommended registry additions for each runnable platform:
- default launch command and arguments
- expected working directory
- preferred preview URL pattern
- ready regex list or token list
- whether browser opening is supported
- whether the platform is long-running (`dev-server`) or one-shot (`static-preview` / file open)

## Architecture Patterns

### Pattern 1: Keep Auto-Run as a Post-Compose Service, Not Compose Logic

`/motif:compose` should remain responsible for writing app artifacts. A separate shared runtime launcher should be invoked after composition succeeds.

Planning implication:
- composition failures remain isolated from runtime failures
- auto-run can be reused later by non-compose entry points if needed

### Pattern 2: Extend the Registry Contract Instead of Forking Rules

Phase 25 should reuse the same registry/scaffold discipline introduced in Phases 22 to 24.

Recommended metadata additions:
- `devServer.command`
- `devServer.args`
- `devServer.cwdPolicy`
- `devServer.readyMatchers`
- `devServer.defaultUrl`
- `devServer.openStrategy`

Planning implication:
- Next.js and Vite can share one launcher with different metadata
- Expo in Phase 26 can plug in without inventing a new launch path

### Pattern 3: Persist Runtime Sessions Beside Other Planning State

Motif already uses `.planning` as its durable project memory. Auto-run should add one runtime session artifact there instead of depending on in-memory handles only.

Recommended shape:
- one active session record per project
- PID
- platform
- command
- working directory
- expected port / resolved URL
- start timestamp
- status (`starting`, `ready`, `stopped`, `cleanup-failed`)

Planning implication:
- the CLI can show tracked processes
- repeated runs can detect and reconcile existing Motif-owned servers

### Pattern 4: Ready Detection Should Be Registry-Led With a Fallback Ladder

Do not plan one universal readiness parser. Use platform-declared matchers first, then controlled fallbacks.

Recommended order:
1. exact regex/token match from registry
2. captured URL from stdout if provided by framework
3. fallback to known default URL only if the process is still alive and the platform contract allows it

Planning implication:
- “framework-specific ready detection” stays explicit and testable
- Phase 26 can add Expo-specific patterns without changing the launcher core

### Pattern 5: Port Conflict Policy Must Prefer Motif-Owned State First

The launcher should distinguish between:
- a port already occupied by a tracked Motif process
- a port occupied by something else
- a framework that auto-selected a different port and printed it

Recommended planning policy:
- if an existing tracked Motif PID is still alive for the same project, offer reuse or stop-and-restart
- if a tracked PID is stale, clean the record and proceed
- if an untracked external process owns the port, do not kill it automatically
- if the framework prints a new URL, trust the printed URL and persist it

### Pattern 6: Static Should Use the Same Session Interface Even if It Does Not Spawn a Server

`web-static` is already a special case from earlier phases. Keep the interface uniform, but let the execution mode differ.

Recommended approach:
- static path opens `index.html` or the generated preview target directly
- no background dev server PID is created
- session record can still capture the opened URL/path and mark the mode as non-daemon

Planning implication:
- callers do not need a second preview API for static
- validation can still assert a consistent post-compose outcome

## Don't Hand-Roll

- Do not infer launch commands from `package.json` scripts when the platform is already known; use registry metadata first.
- Do not add browser-opening npm packages; requirement `ARUN-04` explicitly forbids them.
- Do not make HTTP polling the only readiness mechanism; the roadmap requires stdout-based framework signals.
- Do not put PID tracking only in memory; cleanup must work across interrupted runs.
- Do not kill arbitrary processes on a busy port; only Motif-tracked processes are safe to manage automatically.
- Do not bolt auto-run directly into one framework overlay; Phase 25 must stay reusable across scaffolded platforms.

## Common Pitfalls

### Pitfall 1: Opening the Browser on First URL-Like Output

What goes wrong:
- logs can mention localhost before the app is actually serving the composed result

How to avoid:
- treat readiness as a platform contract with explicit ready matchers

### Pitfall 2: Assuming PID Equals Entire Process Tree

What goes wrong:
- wrappers such as `npm run dev` may spawn child processes that survive a naive parent-only cleanup

How to avoid:
- planning should explicitly cover process-group or platform-appropriate child cleanup behavior
- validation must check for orphaned listeners, not only dead parent PIDs

### Pitfall 3: Treating Port Conflicts as Always Recoverable

What goes wrong:
- the launcher silently chooses another port or opens the wrong app

How to avoid:
- preserve a clear distinction between tracked Motif sessions, external occupants, and framework-selected alternative ports

### Pitfall 4: Letting Static Bypass the Shared Contract

What goes wrong:
- static preview becomes a one-off code path with different prompting and no artifact trail

How to avoid:
- keep a single launcher interface even when static does not spawn a daemon

### Pitfall 5: Encoding Next.js and Vite Rules in the Workflow Layer

What goes wrong:
- every new platform change requires editing command workflows instead of data contracts

How to avoid:
- keep platform-specific ready/open metadata in registry entries and keep launcher logic generic

## Code Examples

### Example 1: Recommended Launch Metadata Shape

```json
{
  "platform": "web-vite",
  "devServer": {
    "command": "npm",
    "args": ["run", "dev"],
    "defaultUrl": "http://localhost:5173",
    "readyMatchers": [
      "Local:\\s+http://localhost:\\d+",
      "ready in \\d+ms"
    ],
    "openStrategy": "browser"
  }
}
```

Planning note:
- the launcher should consume this data, not hardcode Vite strings internally

### Example 2: Recommended Session Artifact Shape

```json
{
  "projectId": "current-project",
  "platform": "web-nextjs",
  "pid": 12345,
  "status": "ready",
  "url": "http://localhost:3000",
  "startedAt": "2026-03-11T22:30:00Z",
  "source": "motif-compose"
}
```

Planning note:
- one small durable record is enough to support cleanup, inspection, and repeated-run decisions

## Planning Implications

### Recommended Plan Split

#### Plan A: Shared Launcher + Ready Detection

Should cover:
- shared post-compose launcher entry point
- registry metadata expansion for runnable platforms
- background spawn behavior
- framework-specific ready matcher handling
- OS-native browser opening

#### Plan B: Session Lifecycle + Conflict Handling

Should cover:
- durable session artifact
- PID/process-tree cleanup on normal exit and signals
- repeated-run reconciliation
- stale PID cleanup
- busy-port policy and user-facing behavior

### Scope Decision To Make Before Planning

Decide whether Phase 25 covers only web runtimes now or also lays the metadata path for Expo.

Recommendation:
- implement and validate Next.js, Vite, and static behavior in this phase
- define the registry/session contract broadly enough that Expo can plug in during Phase 26 without redesign

## Validation Architecture

Phase 25 needs explicit validation planning because most failures are lifecycle regressions that unit tests alone will miss.

### Deterministic Verification

- registry contract tests:
  - runnable platforms expose launch metadata
  - static exposes preview/open metadata without pretending to be a dev server
- ready detection tests:
  - Next.js sample stdout matches ready and extracts URL
  - Vite sample stdout matches ready and extracts URL
  - unknown output does not falsely trigger browser open
- session artifact tests:
  - start writes a session record
  - stop/cleanup clears or marks the record correctly
  - stale PID records are detected and reconciled
- port policy tests:
  - tracked Motif process on target port triggers reuse or controlled restart logic
  - untracked external process does not get killed automatically

### Artifact Verification

- after compose + auto-run, there is a durable session artifact with PID or static-preview status
- the resolved preview URL is persisted when readiness succeeds
- cleanup updates the artifact instead of leaving ambiguous state

### Human / E2E Verification

- compose a Next.js project, opt into auto-run, confirm the terminal returns while the server keeps running and the browser opens only after readiness
- compose a Vite project, opt into auto-run, confirm the opened URL matches the actual printed Vite URL
- compose a static project, confirm the browser opens the generated page without starting a background daemon
- interrupt an active auto-run session with `SIGINT` and verify no orphaned port listener remains
- rerun auto-run with an existing Motif-owned session and verify the user sees deterministic reuse/restart behavior

### Nyquist-Planning Consequence

Do not treat Phase 25 as “small glue.” The highest-risk bugs are orphaned processes, false readiness, and wrong-browser targets. The plan should include both isolated contract tests and at least one end-to-end launched-session verification per supported web platform.

## Open Questions

1. Where should the runtime session artifact live under `.planning/` so it is durable but clearly separate from milestone state?
2. Should repeated auto-run default to reusing an existing Motif-owned server or restarting it after compose?
3. For static preview, should the opened target be direct `index.html` or a lightweight local preview command if one already exists in the scaffold contract?

## Recommended Planning Baseline

If planning starts now, assume:
- auto-run is a shared launcher service layered after compose
- registry metadata, not workflow branching, owns framework-specific launch behavior
- ready detection is stdout-driven and platform-specific
- browser opening is native-command based with zero npm dependencies
- session tracking is durable and project-scoped
- port-conflict handling is conservative for external processes and explicit for Motif-owned processes
