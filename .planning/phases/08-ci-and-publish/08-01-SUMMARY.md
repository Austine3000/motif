---
phase: 08-ci-and-publish
plan: 01
subsystem: infra
tags: [npm, github-actions, oidc, ci-cd, publishing, provenance]

# Dependency graph
requires:
  - phase: 04-rebrand-and-distribution
    provides: "package.json with bin/files/engines fields, LICENSE with SailsLab copyright, README"
provides:
  - ".gitignore covering OS, Node, editor, npm artifacts, and planning debug files"
  - "package.json with motif-design name, repository field, and publishConfig for provenance"
  - "GitHub Actions workflow for tag-triggered OIDC trusted publishing"
  - "README with correct npx motif-design@latest install command"
affects: [08-02-PLAN]

# Tech tracking
tech-stack:
  added: [github-actions, actions/checkout@v6, actions/setup-node@v6, npm-oidc-trusted-publishing]
  patterns: [tag-triggered-ci, oidc-trusted-publishing, version-tag-consistency-check, npm-provenance]

key-files:
  created:
    - ".gitignore"
    - ".github/workflows/publish.yml"
  modified:
    - "package.json"
    - "README.md"

key-decisions:
  - "Package name motif-design (unscoped) chosen over @sailslab/motif and motif-ai"
  - "Repository URL uses SailsLab/motif (repo name stays motif, npm name is motif-design)"
  - "OIDC trusted publishing as primary auth with commented-out NODE_AUTH_TOKEN fallback"
  - "environment: npm-publish required in workflow for OIDC token scoping"

patterns-established:
  - "Tag-triggered publish: push v*.*.* tag triggers npm publish workflow"
  - "Version-tag consistency: CI verifies git tag matches package.json version before publishing"
  - "npm pack --dry-run pre-verification: always verify package contents before publish"

# Metrics
duration: 1min
completed: 2026-03-03
---

# Phase 8 Plan 1: Pre-Publish Package Preparation Summary

**Resolved npm name conflict to motif-design, created .gitignore, added repository/publishConfig to package.json, built GitHub Actions OIDC publish workflow, updated README install command**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-03T20:11:21Z
- **Completed:** 2026-03-03T20:12:35Z
- **Tasks:** 2 (1 decision checkpoint + 1 auto)
- **Files modified:** 4

## Accomplishments
- Resolved npm package name conflict: "motif" was taken (motif@0.1.6 by justinvdm), renamed to "motif-design"
- Created .gitignore covering OS files, node_modules, editor artifacts, npm pack artifacts, and planning debug files
- Updated package.json with repository field (SailsLab/motif) and publishConfig (access: public, provenance: true)
- Created .github/workflows/publish.yml with tag-triggered OIDC trusted publishing, version-tag consistency check, and commented-out NPM_TOKEN fallback
- Updated README install command from `npx motif@latest` to `npx motif-design@latest`

## Task Commits

Each task was committed atomically:

1. **Task 1: Decide npm package name** - (checkpoint:decision, no commit -- user selected `motif-design`)
2. **Task 2: Create .gitignore, update package.json, create CI workflow, update README** - `093a3de` (feat)

**Plan metadata:** (pending final commit)

## Files Created/Modified
- `.gitignore` - Git ignore rules for OS, Node, editor, npm artifacts, and planning debug files
- `package.json` - Updated name to motif-design, added repository and publishConfig fields
- `.github/workflows/publish.yml` - Tag-triggered npm publish workflow with OIDC trusted publishing
- `README.md` - Updated install command to npx motif-design@latest

## Decisions Made
- **Package name: motif-design** -- user chose unscoped name over @sailslab/motif. Simpler install command, descriptive, available on npm.
- **Repository URL: SailsLab/motif** -- repo name stays "motif" (the project name), npm package name "motif-design" does not need to match.
- **OIDC trusted publishing as primary** -- tokenless, more secure than granular tokens (which have 90-day max lifetime). Commented-out NODE_AUTH_TOKEN fallback included for non-OIDC scenarios.
- **environment: npm-publish** -- required in workflow to scope the OIDC token exchange to a named GitHub environment. Must be created in GitHub repo settings after repo creation.
- **npm install -g npm@latest in workflow** -- Node 22.x ships npm 10.x which does not support trusted publishing; upgrading to npm >= 11.5.1 is required.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

Before the first publish, the following manual setup is needed:
1. **Create GitHub repository:** `gh repo create SailsLab/motif --public --source=. --remote=origin --push`
2. **Create npm-publish environment:** GitHub repo Settings -> Environments -> New environment -> name "npm-publish"
3. **Configure trusted publisher on npmjs.com:** Package settings -> Trusted Publisher -> GitHub Actions -> org: SailsLab, repo: motif, workflow: publish.yml
4. **First release:** `npm version patch` then `git push origin main --follow-tags`

## Next Phase Readiness
- All four pre-publish files ready (.gitignore, package.json, publish.yml, README.md)
- npm pack --dry-run succeeds with 48 files (bin/, core/, runtimes/, scripts/)
- Ready for Plan 08-02: GitHub repository creation, trusted publisher configuration, and first publish

## Self-Check: PASSED

All files verified on disk:
- `.gitignore` -- FOUND
- `package.json` -- FOUND
- `.github/workflows/publish.yml` -- FOUND
- `README.md` -- FOUND
- `08-01-SUMMARY.md` -- FOUND

All commits verified in git log:
- `093a3de` (Task 2) -- FOUND

---
*Phase: 08-ci-and-publish*
*Completed: 2026-03-03*
