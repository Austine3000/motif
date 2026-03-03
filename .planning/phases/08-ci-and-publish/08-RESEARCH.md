# Phase 8: CI and Publish - Research

**Researched:** 2026-03-03
**Domain:** GitHub Actions CI/CD, npm publishing, OIDC trusted publishing, package naming
**Confidence:** HIGH

## Summary

Phase 8 is the final phase of the Motif project. Its sole requirement (DIST-04) is a GitHub Actions workflow that triggers on git tag creation and publishes the package to npm automatically. The success criteria also require that `npx motif@latest` installs the published package and completes the installation flow.

There is a critical blocker: **the npm package name "motif" is already taken** by an existing package (`motif@0.1.6`, a "pattern composition mini-language for javascript" by justinvdm). The current `package.json` uses `"name": "motif"` which will fail on `npm publish`. The project must either use a scoped name (`@sailslab/motif`) or an alternative unscoped name. Research confirms that `@sailslab/motif`, `motif-design`, and `motif-ai` are all available.

The npm ecosystem underwent major security changes in late 2025: classic tokens were permanently revoked on December 9, 2025. The two paths for CI/CD publishing are now (1) **OIDC trusted publishing** (recommended, tokenless, requires npm >= 11.5.1) or (2) **granular access tokens** (max 90-day lifetime, requires periodic rotation). This research recommends OIDC trusted publishing as the primary approach, with granular token as a documented fallback.

Additionally, the project currently has **no GitHub remote configured** and **no `.gitignore` file**. Both must be set up before any CI workflow can function.

**Primary recommendation:** Resolve the package name conflict (recommend `@sailslab/motif`), create the GitHub repository, configure OIDC trusted publishing on npmjs.com, and write a simple tag-triggered GitHub Actions workflow that verifies the package and publishes with provenance.

## Standard Stack

### Core
| Library/Tool | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| GitHub Actions | N/A | CI/CD platform | Industry standard for GitHub-hosted repos; native OIDC support |
| `actions/checkout` | v6 | Check out repository code | Official GitHub action, latest stable |
| `actions/setup-node` | v6 | Configure Node.js + npm registry | Official GitHub action; creates `.npmrc` with registry auth |
| npm CLI | >= 11.5.1 | Package publishing | Required for OIDC trusted publishing; ships with Node.js 24.x |
| Node.js | 22.x | Runtime (matches project `engines` field) | Project requires `>=22.0.0`; workflow should test with same version |

### Supporting
| Tool | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `gh` CLI | Latest | Create GitHub repo, manage releases | One-time setup: repo creation, trusted publisher config verification |
| `npm pack --dry-run` | N/A | Pre-publish verification | Workflow step to verify package contents before actual publish |
| `npm version` | N/A | Bump version + create git tag | Local release workflow: `npm version patch/minor/major` creates tag |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| OIDC trusted publishing | Granular access token | Token requires rotation every 90 days max; OIDC is tokenless and more secure |
| Tag-triggered workflow | Release-triggered workflow | Tags are simpler; GitHub Releases add changelog UI but more ceremony |
| Manual `npm version` | semantic-release / changesets | Overkill for a solo-maintainer project at v0.x; adds dependencies |
| `@sailslab/motif` | `motif-design` or `motif-ai` | Scoped name matches org identity; unscoped names are simpler but less brandable |

## Architecture Patterns

### Recommended Project Structure (New Files)
```
.github/
└── workflows/
    └── publish.yml          # Tag-triggered npm publish workflow
.gitignore                   # Exclude .DS_Store, logs, node_modules, etc.
package.json                 # Updated: name, repository, publishConfig fields
```

### Pattern 1: Tag-Triggered Publish Workflow
**What:** A GitHub Actions workflow that triggers when a semantic version tag (e.g., `v0.1.0`) is pushed, verifies the package, and publishes to npm using OIDC trusted publishing.
**When to use:** Every release.
**Example:**
```yaml
# Source: GitHub Docs + npm trusted publishing docs
name: Publish to npm

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v6

      - uses: actions/setup-node@v6
        with:
          node-version: '22.x'
          registry-url: 'https://registry.npmjs.org'

      - name: Verify package contents
        run: npm pack --dry-run

      - name: Verify tag matches package.json version
        run: |
          PKG_VERSION="v$(node -p "require('./package.json').version")"
          GIT_TAG="${GITHUB_REF#refs/tags/}"
          if [ "$PKG_VERSION" != "$GIT_TAG" ]; then
            echo "ERROR: package.json version ($PKG_VERSION) does not match git tag ($GIT_TAG)"
            exit 1
          fi

      - name: Publish to npm
        run: npm publish --provenance --access public
```

### Pattern 2: Local Release Workflow (Developer Side)
**What:** The developer bumps the version locally, which creates a git tag, then pushes the tag to trigger CI.
**When to use:** Every release.
**Steps:**
```bash
# 1. Bump version (creates git commit + tag automatically)
npm version patch   # or minor, major

# 2. Push commit and tag to trigger CI
git push origin main --follow-tags
```

### Pattern 3: Version-Tag Consistency Check
**What:** The CI workflow verifies that the git tag matches the version in `package.json` before publishing.
**When to use:** Always -- prevents accidental mismatches.
**Why:** Without this check, a tag `v1.0.0` could publish a package whose `package.json` says `0.9.0`.

### Anti-Patterns to Avoid
- **Publishing without tag-version verification:** If the git tag and `package.json` version disagree, the published package will have a confusing version.
- **Using classic npm tokens:** These were permanently revoked December 9, 2025. Any workflow using `NPM_TOKEN` with a classic token will fail.
- **Hardcoding npm credentials in workflow files:** Always use OIDC or GitHub secrets.
- **Skipping `npm pack --dry-run` before publish:** You might accidentally publish unwanted files (`.DS_Store`, `firebase-debug.log`, etc.).
- **Using `npm ci` when there is no `package-lock.json`:** This project has zero dependencies and no lockfile. Use `npm install` or skip install entirely.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OIDC authentication | Custom token exchange | `actions/setup-node` with `registry-url` + OIDC `id-token: write` permission | setup-node handles `.npmrc` creation and token injection automatically |
| Version bumping | Manual `package.json` edits | `npm version patch/minor/major` | Creates git commit + tag atomically; prevents version-tag drift |
| Tag-version matching | Custom comparison script | Inline shell comparison in workflow (3 lines) | Simple enough to inline; no external action needed |
| Package content verification | Manual file listing | `npm pack --dry-run` | Shows exactly what will be published; respects `files` whitelist in `package.json` |
| Provenance attestation | Custom signing | `npm publish --provenance` flag | Handled automatically by npm CLI + GitHub OIDC; cryptographic supply chain proof |

**Key insight:** This phase is almost entirely configuration, not code. The "stack" is YAML workflow files and npm/GitHub settings. The only code is a 3-line shell script for tag-version matching. Everything else uses existing tooling.

## Common Pitfalls

### Pitfall 1: Package Name Already Taken
**What goes wrong:** `npm publish` fails with `403 Forbidden` or `E403` because the package name "motif" is owned by another user.
**Why it happens:** The current `package.json` has `"name": "motif"` but `motif@0.1.6` already exists on npm, published by `justinvdm`.
**How to avoid:** Change the package name before the first publish. Options:
  - `@sailslab/motif` (recommended -- brand identity, no conflict possible)
  - `motif-design` (available, descriptive)
  - `motif-ai` (available, but less accurate)
**Warning signs:** Any `npm publish` attempt with the current name will fail immediately.

### Pitfall 2: Missing `repository` Field in package.json
**What goes wrong:** `npm publish --provenance` fails with `E422` error because npm cannot verify the provenance attestation without knowing the source repository.
**Why it happens:** The provenance system cross-references the GitHub OIDC token with the `repository.url` in `package.json`. If missing or mismatched, publishing fails.
**How to avoid:** Add the `repository` field to `package.json`:
```json
{
  "repository": {
    "type": "git",
    "url": "git+https://github.com/SailsLab/motif.git"
  }
}
```
**Warning signs:** The current `package.json` has no `repository` field at all.

### Pitfall 3: npm CLI Version Too Old for Trusted Publishing
**What goes wrong:** OIDC trusted publishing requires npm >= 11.5.1. Older npm versions do not support the OIDC token exchange.
**Why it happens:** Node.js 22.x ships with npm 10.x by default, which does not support trusted publishing.
**How to avoid:** Add `npm install -g npm@latest` as a workflow step, or use Node.js 24.x which ships with npm >= 11.x.
**Warning signs:** Authentication errors during publish despite correct OIDC configuration.

### Pitfall 4: No `.gitignore` File
**What goes wrong:** `.DS_Store`, `firebase-debug.log`, `node_modules/`, npm debug logs, and other artifacts get committed to the repository.
**Why it happens:** The project currently has no `.gitignore` file.
**How to avoid:** Create a `.gitignore` before the GitHub repository setup.
**Warning signs:** `git status` already shows `.DS_Store` files as modified/untracked.

### Pitfall 5: No GitHub Remote Configured
**What goes wrong:** Cannot push tags, cannot trigger GitHub Actions workflows.
**Why it happens:** The project is currently a local-only git repository with no remote origin.
**How to avoid:** Create a GitHub repository and add it as the remote origin before setting up CI.
**Warning signs:** `git remote -v` returns nothing.

### Pitfall 6: Scoped Package Requires `--access public` on First Publish
**What goes wrong:** If using `@sailslab/motif`, the first publish defaults to private (which requires a paid npm org plan).
**Why it happens:** npm scoped packages default to restricted (private) access.
**How to avoid:** Include `--access public` in the publish command, or set `"publishConfig": { "access": "public" }` in `package.json`.
**Warning signs:** `npm ERR! 402 Payment Required` on first publish.

### Pitfall 7: Trusted Publisher Configuration Must Match Exactly
**What goes wrong:** OIDC authentication fails silently or with cryptic errors.
**Why it happens:** The trusted publisher config on npmjs.com must exactly match (case-sensitive) the GitHub org/user, repository name, and workflow filename. Errors are only surfaced at publish time, not during configuration.
**How to avoid:** Double-check all fields after configuration. The workflow filename must include the `.yml` extension and match exactly.
**Warning signs:** Publishing fails with OIDC authentication errors despite correct workflow permissions.

## Code Examples

### Complete package.json Update (for @sailslab/motif)
```json
{
  "name": "@sailslab/motif",
  "version": "0.1.0",
  "description": "Domain-intelligent design system for AI coding assistants",
  "bin": {
    "motif": "bin/install.js"
  },
  "files": [
    "bin/",
    "core/",
    "runtimes/",
    "scripts/"
  ],
  "engines": {
    "node": ">=22.0.0"
  },
  "repository": {
    "type": "git",
    "url": "git+https://github.com/SailsLab/motif.git"
  },
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "license": "MIT",
  "keywords": ["design-system", "ai", "cli", "design-tokens", "motif"]
}
```

### Complete GitHub Actions Workflow
```yaml
# .github/workflows/publish.yml
# Source: GitHub Docs (publishing-nodejs-packages) + npm trusted publishing docs
name: Publish to npm

on:
  push:
    tags:
      - 'v*.*.*'

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - name: Checkout
        uses: actions/checkout@v6

      - name: Setup Node.js
        uses: actions/setup-node@v6
        with:
          node-version: '22.x'
          registry-url: 'https://registry.npmjs.org'

      - name: Install latest npm (for trusted publishing)
        run: npm install -g npm@latest

      - name: Verify package contents
        run: npm pack --dry-run

      - name: Verify tag matches package.json version
        run: |
          PKG_VERSION="v$(node -p "require('./package.json').version")"
          GIT_TAG="${GITHUB_REF#refs/tags/}"
          if [ "$PKG_VERSION" != "$GIT_TAG" ]; then
            echo "::error::package.json version ($PKG_VERSION) does not match git tag ($GIT_TAG)"
            exit 1
          fi

      - name: Publish to npm
        run: npm publish --provenance --access public
```

### Recommended .gitignore
```gitignore
# OS
.DS_Store
Thumbs.db

# Node
node_modules/
npm-debug.log*

# Logs
firebase-debug.log

# Editor
.vscode/
.idea/
*.swp
*.swo

# npm pack artifact
*.tgz

# Planning artifacts (keep in repo but ignore temp files)
.planning/debug/
```

### Local Release Workflow
```bash
# Ensure working directory is clean
git status

# Bump version (creates commit + tag)
npm version patch  # 0.1.0 -> 0.1.1
# or: npm version minor  # 0.1.0 -> 0.2.0
# or: npm version major  # 0.1.0 -> 1.0.0

# Push commit and tag (triggers CI publish)
git push origin main --follow-tags
```

### GitHub Repository Setup (One-Time)
```bash
# Create GitHub repo from existing local repo
gh repo create SailsLab/motif --public --source=. --remote=origin --push

# Verify remote is set
git remote -v
```

### npm Trusted Publisher Setup (One-Time, on npmjs.com)
```
1. Go to https://www.npmjs.com/package/@sailslab/motif/access
   (After first manual publish or after package creation)
2. Under "Trusted Publisher", select "GitHub Actions"
3. Fill in:
   - Organization or user: SailsLab
   - Repository: motif
   - Workflow filename: publish.yml
4. Click "Set up connection"
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| npm classic tokens for CI | OIDC trusted publishing | Dec 9, 2025 | Classic tokens permanently revoked; must use OIDC or granular tokens |
| `NPM_TOKEN` secret in GitHub | Tokenless OIDC with `id-token: write` | July 2025 (GA) | No secrets to manage, rotate, or leak |
| `npm publish` (plain) | `npm publish --provenance` | 2023+ | Supply chain attestation; automatic with OIDC trusted publishing |
| `actions/checkout@v4` | `actions/checkout@v6` | Jan 2026 | Latest stable; v4 still works but v6 is current |
| `actions/setup-node@v4` | `actions/setup-node@v6` | 2025 | Latest stable; supports Node.js 22/24 |
| Granular tokens (7-day default) | OIDC trusted publishing | 2025 | Granular tokens now max 90-day lifetime; OIDC preferred for CI |

**Deprecated/outdated:**
- **npm classic tokens:** Permanently revoked December 9, 2025. Cannot be created or recovered.
- **`actions/checkout@v4` / `actions/setup-node@v4`:** Still functional but superseded by v6.
- **`NODE_AUTH_TOKEN` with classic token:** Will fail authentication. Use OIDC or granular token instead.

## Pre-Publish Checklist

Before the first publish, these must all be true:

1. **Package name resolved** -- either scoped `@sailslab/motif` or alternative unscoped name
2. **GitHub repository exists** -- with remote origin configured
3. **`package.json` updated** -- name, repository, publishConfig fields
4. **`.gitignore` created** -- exclude OS files, logs, build artifacts
5. **`.github/workflows/publish.yml` created** -- tag-triggered workflow
6. **README updated** -- install command matches new package name
7. **npm account/org set up** -- SailsLab org on npmjs.com (if using scoped name)
8. **Trusted publisher configured** -- on npmjs.com package settings
9. **First version tagged** -- `npm version patch` or manual tag creation
10. **Tag pushed** -- `git push origin main --follow-tags`

## Open Questions

1. **Package name decision**
   - What we know: "motif" is taken. `@sailslab/motif`, `motif-design`, `motif-ai` are available.
   - What's unclear: User preference between scoped (`@sailslab/motif`) and unscoped (`motif-design`).
   - Recommendation: Use `@sailslab/motif` -- scoped names are standard practice, match the copyright holder "SailsLab", and the install command becomes `npx @sailslab/motif@latest` which is clear. Update README accordingly.

2. **GitHub repository name and organization**
   - What we know: Copyright is "SailsLab". No GitHub remote exists yet.
   - What's unclear: Whether a "SailsLab" GitHub organization exists, or if this should be under a personal account.
   - Recommendation: Use `SailsLab/motif` as the repo path if the org exists, otherwise create the org or use a personal account. The `repository.url` in `package.json` must match exactly.

3. **First publish: manual or CI?**
   - What we know: OIDC trusted publishing must be configured on npmjs.com, which requires the package to exist first (or be configured during first publish).
   - What's unclear: Whether trusted publishing can be set up before the first publish.
   - Recommendation: Do the first publish manually with `npm publish --access public` using a granular token, then configure trusted publishing for all subsequent releases. Alternatively, npm may allow configuring trusted publishing for a new package -- this should be verified during execution.

4. **Version for first publish**
   - What we know: Current version is `0.1.0`. All phases are complete.
   - What's unclear: Whether to publish as `0.1.0` (pre-1.0 signal) or `1.0.0` (production-ready signal).
   - Recommendation: Publish as `0.1.0` first (matching current package.json). This signals "functional but early". Bump to `1.0.0` when battle-tested by external users.

## Sources

### Primary (HIGH confidence)
- [GitHub Docs: Publishing Node.js packages](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages) -- workflow structure, permissions, setup-node usage
- [npm Docs: Trusted publishing](https://docs.npmjs.com/trusted-publishers/) -- OIDC setup, permissions, requirements
- [npm Docs: Generating provenance statements](https://docs.npmjs.com/generating-provenance-statements/) -- provenance flag, repository field requirement
- [GitHub Blog: npm classic tokens revoked](https://github.blog/changelog/2025-12-09-npm-classic-tokens-revoked-session-based-auth-and-cli-token-management-now-available/) -- classic token deprecation timeline
- [GitHub Blog: npm trusted publishing GA](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/) -- OIDC GA announcement
- npm registry direct query: `npm view motif` -- confirmed name conflict

### Secondary (MEDIUM confidence)
- [philna.sh: Things you need to do for npm trusted publishing to work](https://philna.sh/blog/2026/01/28/trusted-publishing-npm/) -- gotchas, npm version requirements, provenance flag still needed
- [remarkablemark.org: How to set up trusted publishing for npm](https://remarkablemark.org/blog/2025/12/19/npm-trusted-publishing/) -- step-by-step OIDC setup
- [blog.robino.dev: NPM Trusted Publishing](https://blog.robino.dev/posts/npm-trusted-publishing) -- workflow example with permissions
- [GitHub Blog: npm security update](https://github.blog/changelog/2025-11-05-npm-security-update-classic-token-creation-disabled-and-granular-token-changes/) -- granular token changes, 90-day max lifetime

### Tertiary (LOW confidence)
- actions/checkout and actions/setup-node version numbers (v6) -- verified via multiple sources but not directly from GitHub releases page

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- GitHub Actions + npm publishing is extremely well-documented; official docs + multiple verified sources agree
- Architecture: HIGH -- workflow pattern is simple (tag trigger -> verify -> publish); well-established convention
- Pitfalls: HIGH -- name conflict verified directly via `npm view`; token deprecation verified via official GitHub changelog; missing fields verified via local `package.json` inspection
- OIDC setup: MEDIUM -- exact UI steps on npmjs.com could not be directly verified (CSS-only page render); multiple secondary sources agree on the process

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable domain; npm OIDC is GA and unlikely to change significantly)
