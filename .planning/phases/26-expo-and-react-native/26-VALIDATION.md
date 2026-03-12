---
phase: 26
slug: expo-and-react-native
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-12
---

# Phase 26 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | none — manual verification |
| **Config file** | none |
| **Quick run command** | `none` |
| **Full suite command** | `none` |
| **Estimated runtime** | n/a |

---

## Sampling Rate

- **After every task commit:** Manual spot-check of touched files
- **After every plan wave:** Manual review using checklist below
- **Before `$gsd-verify-work`:** Manual checklist must be green
- **Max feedback latency:** n/a

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 26-01-01 | 01 | 1 | SCAF-04 | manual | `none` | ✅ W0 | ⬜ pending |
| 26-02-01 | 02 | 1 | COMP-03 | manual | `none` | ✅ W0 | ⬜ pending |
| 26-03-01 | 03 | 2 | COMP-06 | manual | `none` | ✅ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- Existing infrastructure covers all phase requirements.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Expo scaffolding produces runnable project | SCAF-04 | CLI scaffolding output | Run `node .claude/get-motif/scripts/scaffold-project.js --platform mobile-expo --project-root /tmp/motif-expo-test --project-name expo-test --design-system-dir .planning/design/system` and confirm `package.json`, `App.tsx`, and tokens file exist. |
| RN composition uses primitives + StyleSheet | COMP-03 | Agent output inspection | Run `/motif:compose` in an Expo project, confirm files use `View/Text/ScrollView` and `StyleSheet.create` with `tokens.native.ts` imports. |
| Cross-platform consistency preserved | COMP-06 | Visual/semantic comparison | Use `.claude/get-motif/references/cross-platform-consistency.md` (cross-platform-consistency checklist). Compare a web screen and its RN counterpart: token names, typography scale, spacing rhythm, and component hierarchy align. Check TODOs for unsupported CSS. |

*If none: "All phase behaviors have automated verification."*

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < n/a
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
