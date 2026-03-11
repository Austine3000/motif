---
phase: 24
slug: vite-static-and-brownfield
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-11
---

# Phase 24 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | custom Node fixture harness |
| **Config file** | none — Wave 0 task `24-W0-01` creates the harness and fixtures |
| **Quick run command** | `node .claude/get-motif/scripts/phase24-fixture-check.js quick` |
| **Full suite command** | `node .claude/get-motif/scripts/phase24-fixture-check.js full` |
| **Estimated runtime** | ~20 seconds |

---

## Sampling Rate

- **After every task commit:** Run `node .claude/get-motif/scripts/phase24-fixture-check.js quick`
- **After every plan wave:** Run `node .claude/get-motif/scripts/phase24-fixture-check.js full`
- **Before `$gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 24-01-01 | 01 | 1 | SCAF-03 | integration | `node .claude/get-motif/scripts/phase24-fixture-check.js quick --target vite-scaffold-contract` | ❌ W0 | ⬜ pending |
| 24-01-02 | 01 | 1 | SCAF-03, COMP-02 | integration | `node .claude/get-motif/scripts/phase24-fixture-check.js quick --target vite-system-hook && node .claude/get-motif/scripts/phase24-fixture-check.js quick --target vite-compose` | ❌ W0 | ⬜ pending |
| 24-02-01 | 02 | 2 | SCAF-06 | integration | `node .claude/get-motif/scripts/phase24-fixture-check.js quick --target brownfield-detect` | ❌ W0 | ⬜ pending |
| 24-02-02 | 02 | 2 | SCAF-06 | integration | `node .claude/get-motif/scripts/phase24-fixture-check.js quick --target brownfield-init` | ❌ W0 | ⬜ pending |
| 24-02-03 | 02 | 2 | SCAF-05, COMP-04 | integration | `node .claude/get-motif/scripts/phase24-fixture-check.js quick --target static-scaffold && node .claude/get-motif/scripts/phase24-fixture-check.js quick --target static-compose-path` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

**Planned owner:** `24-W0-01` in `24-01-PLAN.md`

- [ ] `.claude/get-motif/scripts/phase24-fixture-check.js` — fixture runner for quick/full verification
- [ ] `.claude/get-motif/fixtures/phase24/next-app/` — clear Next.js detection fixture
- [ ] `.claude/get-motif/fixtures/phase24/vite-app/` — clear Vite detection + scaffold target fixture
- [ ] `.claude/get-motif/fixtures/phase24/expo-app/` — clear Expo detection fixture
- [ ] `.claude/get-motif/fixtures/phase24/react-ambiguous/` — ambiguous React project that must not auto-adopt
- [ ] fixture assertions for generated static structure and Vite router/bootstrap outputs

## Wave 0 Dependency Contract

- `24-W0-01` must complete before any implementation task in Plans `01` or `02`
- `24-01-01` and `24-01-02` depend on the Wave 0 harness and fixtures
- `24-02-01`, `24-02-02`, and `24-02-03` depend on both Plan `24-01` and Wave 0 coverage being available

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Vite scaffold is immediately runnable with a believable app-shell starting point | SCAF-03 | Requires human judgment on starter quality and real CLI run behavior | Run `/motif:init` for a greenfield Vite project, then run `npm run dev` and confirm the project boots with routed app-shell structure. |
| Vite composition follows React Router conventions instead of Next.js App Router conventions | COMP-02 | File/output quality and framework idioms need human review | Run `/motif:compose` in a Vite project and confirm page/component placement, imports, and routing semantics match the Vite overlay contract. |
| Static starter feels like a polished mini-site while staying HTML/CSS-native | SCAF-05, COMP-04 | Design quality and “light enhancement only” behavior are not fully automatable | Generate a static project, open `index.html` directly in a browser, and confirm tokens are linked, sections render cleanly, and JS remains enhancement-only. |
| Ambiguous brownfield UX asks for confirmation only when confidence is low | SCAF-06 | Prompt behavior and risk messaging are user-experience checks | Run `/motif:init` inside the ambiguous fixture and confirm Motif asks for confirmation rather than silently adopting a platform. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
