#!/usr/bin/env bash
set -euo pipefail

# ─── Controlled Test Project Setup ──────────────────────────────
# Creates an isolated test project in /tmp with Motif installed,
# ready for full workflow validation (VALD-01).
# ────────────────────────────────────────────────────────────────

# 1. Create isolated temp directory
TESTDIR=$(mktemp -d /tmp/motif-validation-controlled-XXXXXX)
echo "Created test directory: $TESTDIR"

# 2. Create .claude/ directory (simulates Claude Code project)
mkdir -p "$TESTDIR/.claude"
echo "  Created .claude/ directory"

# 3. Run the Motif installer from the test directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_SCRIPT="$SCRIPT_DIR/../../../../bin/install.js"

if [ ! -f "$INSTALL_SCRIPT" ]; then
  echo "ERROR: Installer not found at: $INSTALL_SCRIPT"
  echo "Make sure you run this script from the Motif project root."
  rm -rf "$TESTDIR"
  exit 1
fi

echo "  Running Motif installer..."
(cd "$TESTDIR" && node "$INSTALL_SCRIPT")

# 4. Verify installation succeeded
if [ ! -f "$TESTDIR/.motif-manifest.json" ]; then
  echo ""
  echo "ERROR: Installation failed -- .motif-manifest.json not found."
  echo "Check installer output above for errors."
  rm -rf "$TESTDIR"
  exit 1
fi

echo ""
echo "Motif installation verified (.motif-manifest.json exists)."

# 5. Print instructions for next steps
echo ""
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Controlled test project ready at: $TESTDIR"
echo ""
echo "Next: cd into the project and run the full Motif workflow:"
echo ""
echo "  1. /motif:init --auto --vertical fintech --stack react --theme light --density comfortable"
echo "  2. /motif:research"
echo "  3. /motif:system"
echo "  4. /motif:compose login"
echo "  5. /motif:compose dashboard"
echo "  6. /motif:compose settings"
echo "  7. /motif:review login"
echo "  8. /motif:review dashboard"
echo "  9. /motif:review settings"
echo "  10. /motif:fix (if any review finds critical issues)"
echo ""
echo "After workflow completes, run verification:"
echo "  node $SCRIPT_DIR/../../validate-workflow.js $TESTDIR --screens login,dashboard,settings"
echo "  node $SCRIPT_DIR/../../validate-tokens.js $TESTDIR/.planning/design/system/tokens.css"
echo ""
echo "═══════════════════════════════════════════════════════════"
