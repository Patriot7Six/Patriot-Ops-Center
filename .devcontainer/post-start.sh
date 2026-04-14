#!/bin/bash
# .devcontainer/post-start.sh
# Runs every time the Codespace container starts.
# Checks Doppler auth status and prints next steps if not logged in.

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🇺🇸  Patriot Ops Center — Codespace Ready"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ── Check Doppler auth ───────────────────────────────────────
if doppler me &>/dev/null; then
  echo "✅ Doppler: authenticated"
  # Check if project is configured
  if doppler secrets &>/dev/null; then
    echo "✅ Doppler: project configured — secrets ready"
    echo ""
    echo "  Run: npm run dev"
  else
    echo "⚠️  Doppler: logged in but project not set up yet"
    echo ""
    echo "  Run: doppler setup"
    echo "  Then select: patriot-ops-center → dev"
  fi
else
  echo "⚠️  Doppler: not authenticated"
  echo ""
  echo "  To use Doppler for secrets (recommended):"
  echo "  1. Run: doppler login"
  echo "  2. Run: doppler setup"
  echo "  3. Select: patriot-ops-center → dev"
  echo "  4. Run: npm run dev"
  echo ""
  echo "  To run without Doppler (manual .env.local):"
  echo "  1. Copy .env.example → .env.local"
  echo "  2. Fill in all values"
  echo "  3. Run: npm run dev:no-doppler"
fi

echo ""
echo "  Ports:  App → 3000  |  Storybook → 6006"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
