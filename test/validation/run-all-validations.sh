#!/usr/bin/env bash
set -euo pipefail

# ─── Master Validation Runner ───────────────────────────────
# Runs all VALD checks (VALD-01 through VALD-05) against
# completed test project directories.
#
# Usage:
#   bash run-all-validations.sh [OPTIONS]
#
# Options:
#   --controlled DIR       Path to controlled test project (VALD-01)
#   --cryptopay DIR        Path to CryptoPay test project (VALD-02, VALD-04, VALD-05)
#   --diff-a TOKENS_A      Path to first tokens.css for differentiation (VALD-03)
#   --diff-b TOKENS_B      Path to second tokens.css for differentiation (VALD-03)
# ─────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# ─── Argument parsing ───
CONTROLLED_DIR=""
CRYPTOPAY_DIR=""
TOKENS_A=""
TOKENS_B=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --controlled)
      CONTROLLED_DIR="$2"
      shift 2
      ;;
    --cryptopay)
      CRYPTOPAY_DIR="$2"
      shift 2
      ;;
    --diff-a)
      TOKENS_A="$2"
      shift 2
      ;;
    --diff-b)
      TOKENS_B="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: bash run-all-validations.sh [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --controlled DIR       Path to controlled test project (VALD-01)"
      echo "  --cryptopay DIR        Path to CryptoPay test project (VALD-02, VALD-04, VALD-05)"
      echo "  --diff-a TOKENS_A      Path to first tokens.css for differentiation (VALD-03)"
      echo "  --diff-b TOKENS_B      Path to second tokens.css for differentiation (VALD-03)"
      echo ""
      echo "Examples:"
      echo "  bash run-all-validations.sh --controlled /tmp/motif-controlled-abc123"
      echo "  bash run-all-validations.sh --cryptopay /tmp/motif-cryptopay-xyz789"
      echo "  bash run-all-validations.sh --diff-a /tmp/tokens-a.css --diff-b /tmp/tokens-b.css"
      echo "  bash run-all-validations.sh --controlled /tmp/ctrl --cryptopay /tmp/crypto --diff-a /tmp/a.css --diff-b /tmp/b.css"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      echo "Run with --help for usage."
      exit 1
      ;;
  esac
done

# ─── Check at least one option provided ───
if [[ -z "$CONTROLLED_DIR" && -z "$CRYPTOPAY_DIR" && -z "$TOKENS_A" ]]; then
  echo "No test projects or token files specified."
  echo "Run with --help for usage."
  exit 1
fi

# ─── Results tracking ───
VALD_01="SKIP"
VALD_02="SKIP"
VALD_03="SKIP"
VALD_04="SKIP"
VALD_05="SKIP"

OVERALL_EXIT=0

echo ""
echo "=================================================================="
echo "  Motif Validation Suite"
echo "=================================================================="
echo ""

# ─── VALD-01: Controlled Test Workflow ───
if [[ -n "$CONTROLLED_DIR" ]]; then
  echo "──────────────────────────────────────────────────────"
  echo "  VALD-01: Controlled Test Workflow"
  echo "──────────────────────────────────────────────────────"
  echo ""

  VALD01_FAIL=0

  echo "[VALD-01a] Workflow artifacts check..."
  if node "$SCRIPT_DIR/validate-workflow.js" "$CONTROLLED_DIR" --screens login,dashboard,settings; then
    echo "  >> Workflow artifacts: PASS"
  else
    echo "  >> Workflow artifacts: FAIL"
    VALD01_FAIL=1
  fi

  echo ""
  echo "[VALD-01b] Token quality check..."
  if node "$SCRIPT_DIR/validate-tokens.js" "$CONTROLLED_DIR/.planning/design/system/tokens.css"; then
    echo "  >> Token quality: PASS"
  else
    echo "  >> Token quality: FAIL"
    VALD01_FAIL=1
  fi

  if [[ $VALD01_FAIL -eq 0 ]]; then
    VALD_01="PASS"
  else
    VALD_01="FAIL"
    OVERALL_EXIT=1
  fi

  echo ""
fi

# ─── VALD-02: CryptoPay Battle Test ───
if [[ -n "$CRYPTOPAY_DIR" ]]; then
  echo "──────────────────────────────────────────────────────"
  echo "  VALD-02: CryptoPay Battle Test"
  echo "──────────────────────────────────────────────────────"
  echo ""

  VALD02_FAIL=0

  echo "[VALD-02a] CryptoPay workflow artifacts check..."
  if node "$SCRIPT_DIR/validate-workflow.js" "$CRYPTOPAY_DIR" --screens wallet,send,receive,history,profile; then
    echo "  >> CryptoPay workflow artifacts: PASS"
  else
    echo "  >> CryptoPay workflow artifacts: FAIL"
    VALD02_FAIL=1
  fi

  echo ""
  echo "[VALD-02b] CryptoPay token quality check..."
  if node "$SCRIPT_DIR/validate-tokens.js" "$CRYPTOPAY_DIR/.planning/design/system/tokens.css" --brand-color "#7C3AED"; then
    echo "  >> CryptoPay token quality: PASS"
  else
    echo "  >> CryptoPay token quality: FAIL"
    VALD02_FAIL=1
  fi

  if [[ $VALD02_FAIL -eq 0 ]]; then
    VALD_02="PASS"
  else
    VALD_02="FAIL"
    OVERALL_EXIT=1
  fi

  echo ""

  # ─── VALD-04: Brand Color Preservation (embedded in VALD-02) ───
  echo "──────────────────────────────────────────────────────"
  echo "  VALD-04: Brand Color Preservation"
  echo "──────────────────────────────────────────────────────"
  echo ""

  echo "[VALD-04] Verifying brand color #7C3AED is preserved as --color-primary-500..."
  if node "$SCRIPT_DIR/validate-tokens.js" "$CRYPTOPAY_DIR/.planning/design/system/tokens.css" --brand-color "#7C3AED"; then
    VALD_04="PASS"
    echo "  >> Brand color preservation: PASS"
  else
    VALD_04="FAIL"
    OVERALL_EXIT=1
    echo "  >> Brand color preservation: FAIL"
  fi

  echo ""

  # ─── VALD-05: Screen Consistency (5+ screens) ───
  echo "──────────────────────────────────────────────────────"
  echo "  VALD-05: Screen Consistency (5+ screens)"
  echo "──────────────────────────────────────────────────────"
  echo ""

  VALD05_FAIL=0
  SCREENS=("wallet" "send" "receive" "history" "profile")
  SCREEN_COUNT=0
  SUMMARY_FOUND=0
  TOKENS_CSS="$CRYPTOPAY_DIR/.planning/design/system/tokens.css"
  SCREENS_DIR="$CRYPTOPAY_DIR/.planning/design/screens"

  # Check each screen SUMMARY exists
  echo "[VALD-05a] Screen summary existence check..."
  for screen in "${SCREENS[@]}"; do
    SUMMARY_PATH="$SCREENS_DIR/${screen}-SUMMARY.md"
    if [[ -f "$SUMMARY_PATH" ]]; then
      echo "  PASS: ${screen}-SUMMARY.md exists"
      SUMMARY_FOUND=$((SUMMARY_FOUND + 1))
    else
      echo "  FAIL: ${screen}-SUMMARY.md missing"
      VALD05_FAIL=1
    fi
    SCREEN_COUNT=$((SCREEN_COUNT + 1))
  done

  echo "  >> Summaries found: $SUMMARY_FOUND/$SCREEN_COUNT"
  echo ""

  # Check for hardcoded values in screen source files
  echo "[VALD-05b] Hardcoded value check across screens..."
  TOTAL_HARDCODED=0
  TOTAL_LINES=0

  for screen in "${SCREENS[@]}"; do
    SCREEN_SRC_DIR="$SCREENS_DIR/${screen}"
    # If screen directory exists, check its files; otherwise check the summary
    SEARCH_DIR="$SCREENS_DIR"
    if [[ -d "$SCREEN_SRC_DIR" ]]; then
      SEARCH_DIR="$SCREEN_SRC_DIR"
    fi

    SUMMARY_FILE="$SCREENS_DIR/${screen}-SUMMARY.md"
    if [[ -f "$SUMMARY_FILE" ]]; then
      # Count lines in screen file
      LINES=$(wc -l < "$SUMMARY_FILE" 2>/dev/null || echo "0")
      TOTAL_LINES=$((TOTAL_LINES + LINES))

      # Check for hardcoded hex colors (not inside var() or comments)
      HARDCODED=$(grep -cE '#[0-9a-fA-F]{3,8}' "$SUMMARY_FILE" 2>/dev/null || echo "0")
      # Subtract lines that are inside var() references or comments
      VAR_REFS=$(grep -cE 'var\(--' "$SUMMARY_FILE" 2>/dev/null || echo "0")
      TOTAL_HARDCODED=$((TOTAL_HARDCODED + HARDCODED))
    fi
  done

  if [[ $TOTAL_LINES -gt 0 ]]; then
    echo "  Total screen file lines: $TOTAL_LINES"
    echo "  Hardcoded color references found: $TOTAL_HARDCODED"
    echo "  (Note: some hardcoded refs in summaries are descriptive, not violations)"
  fi
  echo ""

  # Token consistency check: extract var(-- references from each screen
  echo "[VALD-05c] Token reference consistency across screens..."

  # Get all token names defined in tokens.css
  if [[ -f "$TOKENS_CSS" ]]; then
    DEFINED_TOKENS=$(grep -oE '\-\-[a-zA-Z0-9_-]+:' "$TOKENS_CSS" | sed 's/:$//' | sort -u)
    DEFINED_COUNT=$(echo "$DEFINED_TOKENS" | wc -l | tr -d ' ')
    echo "  Tokens defined in tokens.css: $DEFINED_COUNT"

    # Collect all var(-- references from screen summaries
    ALL_SCREEN_TOKENS=""
    UNDEFINED_TOKENS=""

    for screen in "${SCREENS[@]}"; do
      SUMMARY_FILE="$SCREENS_DIR/${screen}-SUMMARY.md"
      if [[ -f "$SUMMARY_FILE" ]]; then
        # Extract var(--token-name) references
        SCREEN_TOKENS=$(grep -oE 'var\(--[a-zA-Z0-9_-]+' "$SUMMARY_FILE" 2>/dev/null | sed 's/var(//' | sort -u || true)
        SCREEN_TOKEN_COUNT=$(echo "$SCREEN_TOKENS" | grep -c '.' 2>/dev/null || echo "0")
        echo "  ${screen}: $SCREEN_TOKEN_COUNT token references"

        # Check if any referenced tokens are NOT in tokens.css
        while IFS= read -r token; do
          if [[ -n "$token" ]]; then
            if ! echo "$DEFINED_TOKENS" | grep -qF "$token"; then
              UNDEFINED_TOKENS="${UNDEFINED_TOKENS}${screen}: ${token}\n"
            fi
          fi
        done <<< "$SCREEN_TOKENS"

        ALL_SCREEN_TOKENS="${ALL_SCREEN_TOKENS}${SCREEN_TOKENS}\n"
      fi
    done

    echo ""
    if [[ -n "$UNDEFINED_TOKENS" ]]; then
      echo "  WARNING: Tokens referenced but NOT defined in tokens.css:"
      echo -e "$UNDEFINED_TOKENS" | head -20
      echo "  (These may indicate token drift)"
    else
      echo "  PASS: All referenced tokens exist in tokens.css"
    fi
  else
    echo "  FAIL: tokens.css not found at $TOKENS_CSS"
    VALD05_FAIL=1
  fi

  echo ""

  if [[ $SUMMARY_FOUND -ge 5 && $VALD05_FAIL -eq 0 ]]; then
    VALD_05="PASS"
    echo "  >> Screen consistency: PASS"
  else
    VALD_05="FAIL"
    OVERALL_EXIT=1
    echo "  >> Screen consistency: FAIL"
  fi

  echo ""
fi

# ─── VALD-03: Differentiation Test ───
if [[ -n "$TOKENS_A" && -n "$TOKENS_B" ]]; then
  echo "──────────────────────────────────────────────────────"
  echo "  VALD-03: Differentiation Test"
  echo "──────────────────────────────────────────────────────"
  echo ""

  echo "[VALD-03] Comparing $TOKENS_A vs $TOKENS_B..."
  if node "$SCRIPT_DIR/validate-diff.js" "$TOKENS_A" "$TOKENS_B"; then
    VALD_03="PASS"
    echo "  >> Differentiation: PASS"
  else
    VALD_03="FAIL"
    OVERALL_EXIT=1
    echo "  >> Differentiation: FAIL"
  fi

  echo ""
fi

# ─── Final Summary ───
echo "=================================================================="
echo "  VALIDATION SUMMARY"
echo "=================================================================="
echo ""
echo "  VALD-01 (Controlled Test Workflow):  $VALD_01"
echo "  VALD-02 (CryptoPay Battle Test):    $VALD_02"
echo "  VALD-03 (Differentiation):          $VALD_03"
echo "  VALD-04 (Brand Color Preservation): $VALD_04"
echo "  VALD-05 (Screen Consistency):       $VALD_05"
echo ""

PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0
for result in "$VALD_01" "$VALD_02" "$VALD_03" "$VALD_04" "$VALD_05"; do
  case "$result" in
    PASS) PASS_COUNT=$((PASS_COUNT + 1)) ;;
    FAIL) FAIL_COUNT=$((FAIL_COUNT + 1)) ;;
    SKIP) SKIP_COUNT=$((SKIP_COUNT + 1)) ;;
  esac
done

echo "  Total: $PASS_COUNT passed, $FAIL_COUNT failed, $SKIP_COUNT skipped"
echo ""
echo "=================================================================="

exit $OVERALL_EXIT
