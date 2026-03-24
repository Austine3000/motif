---
phase: 27-nextjs-scaffold-execution
verified: 2026-03-24T08:45:00Z
status: gaps_found
score: 3/4 success criteria verified
gaps:
  - truth: "/motif:init triggers a scaffold step that produces a Next.js project with app/package.json/Tailwind + shadcn dependencies"
    status: partial
    reason: "init.md explicitly documents that scaffold execution happens in generate-system, not init. The init workflow sets platform intent and primes the user with a message, but does not itself invoke scaffold-project.js. The success criterion's verb 'triggers' is ambiguous — the flow works end-to-end (init → system → scaffold), but init does not directly trigger scaffolding. The ROADMAP and REQUIREMENTS.md were never updated to mark Phase 27 or SCAF-02 as complete."
    artifacts:
      - path: ".planning/ROADMAP.md"
        issue: "Phase 27 line is still `[ ]` (incomplete), plan 27-01 line is still `[ ]`"
      - path: ".planning/REQUIREMENTS.md"
        issue: "SCAF-02 checkbox is still `- [ ]` and status table shows `Pending` at line 147"
    missing:
      - "Update ROADMAP.md: mark `- [x] Phase 27` and `- [x] 27-01` as complete"
      - "Update REQUIREMENTS.md: check `- [x] SCAF-02` checkbox and change status table entry from Pending to Complete"
---

# Phase 27: Next.js Scaffold Execution — Verification Report

**Phase Goal:** Run a real `create-next-app` (App Router + Tailwind + shadcn) and feed that project directly into the existing composition and auto-run conveyor belt so the Next.js flow is executable end-to-end.
**Verified:** 2026-03-24T08:45:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification (previous VERIFICATION.md was a placeholder plan, not a real report)

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `/motif:init` triggers a scaffold step producing a Next.js project with `app/package.json/Tailwind + shadcn` | PARTIAL | init.md sets platform intent and tells user scaffolding will happen after system generation; actual scaffold runs in generate-system Step 3d. Architecture is correct but documentation artifacts (ROADMAP, REQUIREMENTS) were not updated to reflect completion. |
| 2 | Registry-driven scaffold runner logs deterministic project path and drops `.motif-scaffolded` marker | VERIFIED | `scaffold-project.js` reads `web-nextjs` registry entry, runs `create-next-app` + `postInstall` (shadcn), writes `.motif-scaffolded` marker. Dry-run confirms: `[dry-run] write .motif-scaffolded`. Commits 5660ec7 and c87f198 confirmed real. |
| 3 | `compose-screen` recognizes the project via `.motif-scaffolded`, uses Next.js overlay, exposes same project path for auto-run | VERIFIED | Step 2d in compose-screen.md (lines 98–104) checks for `.motif-scaffolded` marker, routes composition to real project tree (`src/app/{route}/page.tsx`), resolves overlay via registry `composition.overlay = "composer-nextjs.md"`, and wires auto-run via Step 4b. |
| 4 | Next.js integration flow (scaffold → compose → auto-run) executable without manual steps | VERIFIED | Full pipeline: `init.md` → platform persisted to STATE.md → `generate-system.md` Step 3d invokes `scaffold-project.js` → materializes `src/app/page.tsx`, `src/theme/tokens.ts`, `src/app/globals.css`, `.motif-scaffolded` → compose-screen.md Step 2d detects marker → Step 4b offers auto-run via `runtime-launcher.js`. No manual steps required in any workflow step. |

**Score:** 3/4 truths verified (Truth 1 is partial — code is correct, documentation not updated)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.claude/get-motif/references/framework-registry.json` | `web-nextjs` scaffold block with `create-next-app` command, `postInstall` (shadcn), `materialization` with `ownedFiles`, `.motif-scaffolded` template | VERIFIED | Lines 1–91: complete block with `scaffold.command = "npx"`, `args = ["create-next-app@latest", "{name}", "--ts", "--tailwind", "--app", ...]`, `postInstall` with shadcn init + add, `materialization.templates[".motif-scaffolded"]`, `composition.overlay = "composer-nextjs.md"` |
| `.claude/get-motif/scripts/scaffold-project.js` | Registry-driven runner that spawns `create-next-app`, runs postInstall, writes templates including `.motif-scaffolded` | VERIFIED | 395-line substantive script. `applyScaffoldCommands()` spawns registry commands via `spawnSync`. `applyInlineTemplates()` writes `.motif-scaffolded`. Dry-run output confirms all steps. |
| `.claude/get-motif/workflows/generate-system.md` | Step 3d invokes `scaffold-project.js` for `web-nextjs`, verifies `package.json`, `src/app/`, shadcn components, `.motif-scaffolded` | VERIFIED | Lines 499–542: Step 3d present with `node .claude/get-motif/scripts/scaffold-project.js --platform {platform} ...` invocation. Web-nextjs verification checklist includes all expected artifacts. |
| `.claude/get-motif/workflows/compose-screen.md` | Step 2d scaffold detection: checks `.motif-scaffolded`, routes to real project tree, warns if missing | VERIFIED | Lines 96–104: Step 2d present. Checks `.motif-scaffolded` marker, confirms `package.json` and `src/app/` for `web-nextjs`, warns on missing marker with fallback. |
| `.claude/get-motif/references/composer-nextjs.md` | Overlay intact: file output rules, import rules, Tailwind styling, `next/font`, `next/image`, `"use client"` guidance | VERIFIED | 270-line overlay. All required sections present: File Output Rules (App Router patterns), Import Rules (`next/image`, `next/link`, shadcn), Styling Rules (Tailwind only, no inline styles), Font Usage (`next/font/google` in `layout.tsx`), Component Format (`"use client"` rules), anti-slop additions. |
| `.planning/ROADMAP.md` | Phase 27 and plan 27-01 marked complete | FAILED | Line 78: `- [ ] Phase 27` still unchecked. Line 173: `- [ ] 27-01` still unchecked. |
| `.planning/REQUIREMENTS.md` | SCAF-02 checkbox checked and status table shows Complete | FAILED | Line 29: `- [ ] **SCAF-02**` unchecked. Line 147: `\| SCAF-02 \| Phase 27 \| Pending \|` — not updated. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `init.md` | `generate-system.md` Step 3d | platform written to STATE.md → system workflow reads STATE.md | WIRED | init.md line 51: "scaffold execution still happens in generate-system". Platform persisted via `motif-state.js update platform`. |
| `generate-system.md` Step 3d | `scaffold-project.js` | `node .claude/get-motif/scripts/scaffold-project.js --platform {platform} ...` | WIRED | Lines 513–517 in generate-system.md. Command template present with all required flags. |
| `scaffold-project.js` | framework-registry.json `web-nextjs` block | `readJson(REGISTRY_PATH)` → `registry[options.platform]` | WIRED | Lines 339–344 in scaffold-project.js. Registry read is unconditional before any scaffold logic. |
| `framework-registry.json` | `.motif-scaffolded` marker | `materialization.templates[".motif-scaffolded"]` → `applyInlineTemplates()` | WIRED | Registry has `".motif-scaffolded": "platform=web-nextjs\n"`. `applyInlineTemplates` at line 371 writes all templates. |
| `compose-screen.md` Step 2d | `.motif-scaffolded` marker | File check in project root | WIRED | Lines 99–102: checks `cwd` and parent for `.motif-scaffolded`. Routes composition to `src/app/{route}/page.tsx` when found. |
| `compose-screen.md` Step 2c | `composer-nextjs.md` | `registry[platform].composition.overlay` | WIRED | Lines 85–95: reads registry, resolves `overlay` filename, sets `OVERLAY_PATH`. Warns if overlay missing. |
| `compose-screen.md` Step 4b | `runtime-launcher.js` | `node .claude/get-motif/scripts/runtime-launcher.js --platform {platform} ...` | WIRED | Lines 393–402: auto-run offer post-composition. Reads devServer metadata from registry. |

### Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| SCAF-02: User can scaffold a Next.js project with `create-next-app` — correct App Router structure, dependencies installed, ready to run | SATISFIED IN CODE — NOT UPDATED IN DOCS | Registry declares `create-next-app@latest` with `--ts --tailwind --app --src-dir`. shadcn postInstall wired. Materialization produces `src/app/`, `src/theme/tokens.ts`, `.motif-scaffolded`. REQUIREMENTS.md checkbox and status table not updated. |
| COMP-01: Screen composition outputs real JSX components for Next.js projects (proper imports, App Router file conventions, next/font, next/image) | SATISFIED (was already satisfied in Phase 23) | composer-nextjs.md intact: App Router file placement (`src/app/{route}/page.tsx`), `next/image`, `next/font` in layout, shadcn imports, Tailwind styling. compose-screen.md Step 2d routes to real project when scaffold detected. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `.planning/ROADMAP.md` | 78, 173 | Unchecked `[ ]` for Phase 27 and plan 27-01 — implementation complete but not marked | Warning | Planning/tracking only — no code impact |
| `.planning/REQUIREMENTS.md` | 29, 147 | SCAF-02 checkbox unchecked, status still "Pending" | Warning | Planning/tracking only — no code impact |

### Human Verification Required

#### 1. End-to-end Next.js scaffold execution

**Test:** Run `node .claude/get-motif/scripts/scaffold-project.js --platform web-nextjs --project-root /tmp/test-motif-nextjs --project-name my-app` (without `--dry-run`)
**Expected:** Creates `/tmp/test-motif-nextjs/my-app/` with `package.json`, `src/app/`, Tailwind/shadcn dependencies installed, `.motif-scaffolded` marker present
**Why human:** Requires running `npx create-next-app@latest` and `npx shadcn@latest init` which touch the network and take real time. Dry-run confirms logic but not actual CLI execution.

#### 2. Scaffold → compose integration with real project

**Test:** After scaffolding, run `/motif:compose` with platform set to `web-nextjs` in STATE.md and `.motif-scaffolded` present
**Expected:** Compose agent writes to `src/app/{screen}/page.tsx` (not `.planning/design/screens/`) and uses composer-nextjs.md overlay
**Why human:** Requires a live Claude Code session to confirm the orchestrator correctly reads the marker and routes composition.

## Gaps Summary

One gap prevents full verification: the ROADMAP.md and REQUIREMENTS.md documentation artifacts were not updated as part of the phase implementation. The code fully implements the Next.js scaffold flow — `framework-registry.json` has a complete `web-nextjs` materialization contract, `scaffold-project.js` is a substantive 395-line registry-driven runner, `generate-system.md` Step 3d invokes the runner for Next.js projects, `compose-screen.md` Step 2d detects the `.motif-scaffolded` marker and routes composition correctly, and `composer-nextjs.md` remains intact. All four success criteria are met in the code.

The gap is purely documentation: ROADMAP.md still shows `[ ] Phase 27` and `[ ] 27-01`, and REQUIREMENTS.md still shows `- [ ] SCAF-02` with `Pending` status. These two files need two targeted line edits to reflect that the phase is complete.

---

_Verified: 2026-03-24T08:45:00Z_
_Verifier: Claude (gsd-verifier)_
