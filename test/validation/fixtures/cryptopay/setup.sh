#!/usr/bin/env bash
set -euo pipefail

# ─── CryptoPay Battle Test Setup (VALD-02) ──────────────────
# Creates an isolated test project in /tmp with Motif installed,
# configured for a CryptoPay fintech workflow.
#
# Brand color: #7C3AED (violet -- crypto/web3 identity)
# Vertical: fintech
# Differentiation seed: personality:7, temperature:6, density:5, formality:5, era:8
# ─────────────────────────────────────────────────────────────

# 1. Create isolated temp directory
TESTDIR=$(mktemp -d /tmp/motif-validation-cryptopay-XXXXXX)
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

# 5. Print instructions for CryptoPay workflow
echo ""
echo "=================================================================="
echo ""
echo "CryptoPay Battle Test project ready at: $TESTDIR"
echo ""
echo "Next: Open a NEW Claude Code session in this directory and run"
echo "the full CryptoPay workflow step-by-step:"
echo ""
echo "  1. /motif:init --auto --vertical fintech --stack react --theme dark --density comfortable"
echo ""
echo "  2. MANUALLY EDIT .planning/design/DESIGN-BRIEF.md:"
echo "     - Under Brand Constraints, add:"
echo "       Primary color: #7C3AED (user-provided, LOCKED)"
echo "     - Set differentiation seed values:"
echo "       personality: 7  (rebellious/crypto)"
echo "       temperature: 6  (warm/Nigerian market)"
echo "       density: 5"
echo "       formality: 5"
echo "       era: 8          (cutting-edge/web3)"
echo ""
echo "  3. /motif:research"
echo ""
echo "  4. /motif:system"
echo ""
echo "  5. Compose 5+ screens for VALD-05 consistency test:"
echo "     /motif:compose wallet"
echo "     /motif:compose send"
echo "     /motif:compose receive"
echo "     /motif:compose history"
echo "     /motif:compose profile"
echo ""
echo "  6. /motif:review wallet"
echo ""
echo "  7. /motif:fix  (if review finds critical issues)"
echo ""
echo "=================================================================="
echo ""
echo "After workflow completes, run verification commands:"
echo ""
echo "  # VALD-02: CryptoPay workflow artifacts"
echo "  node $SCRIPT_DIR/../../validate-workflow.js $TESTDIR --screens wallet,send,receive,history,profile"
echo ""
echo "  # VALD-04: Brand color preservation"
echo "  node $SCRIPT_DIR/../../validate-tokens.js $TESTDIR/.planning/design/system/tokens.css --brand-color \"#7C3AED\""
echo ""
echo "  # VALD-03: Differentiation (requires controlled project tokens too)"
echo "  # cp $TESTDIR/.planning/design/system/tokens.css /tmp/tokens-cryptopay.css"
echo "  # node $SCRIPT_DIR/../../validate-diff.js /tmp/tokens-controlled.css /tmp/tokens-cryptopay.css"
echo ""
echo "  # VALD-05: Full validation run"
echo "  # bash $SCRIPT_DIR/../../run-all-validations.sh --cryptopay $TESTDIR"
echo ""
echo "=================================================================="
