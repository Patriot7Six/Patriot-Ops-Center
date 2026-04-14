#!/bin/bash
# .devcontainer/install-tools.sh
# Runs ONCE on first container creation (postCreateCommand).
# Installs Doppler CLI and Stripe CLI using their official install scripts.
# These are not available as verified devcontainer features, so we install
# them directly — the same way their docs recommend.

set -e

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Installing dev tools..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# ── Doppler CLI ───────────────────────────────────────────────────────────────
echo ""
echo "▸ Installing Doppler CLI..."
if command -v doppler &>/dev/null; then
  echo "  ✅ Doppler already installed: $(doppler --version)"
else
  (curl -Ls --tlsv1.2 --proto "=https" --retry 3 https://cli.doppler.com/install.sh \
    || wget -t 3 -qO- https://cli.doppler.com/install.sh) | sudo sh
  echo "  ✅ Doppler installed: $(doppler --version)"
fi

# ── Stripe CLI ────────────────────────────────────────────────────────────────
echo ""
echo "▸ Installing Stripe CLI..."
if command -v stripe &>/dev/null; then
  echo "  ✅ Stripe CLI already installed: $(stripe --version)"
else
  # Official Stripe CLI install for Debian/Ubuntu
  curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public \
    | gpg --dearmor \
    | sudo tee /usr/share/keyrings/stripe.gpg > /dev/null

  echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] \
https://packages.stripe.dev/stripe-cli-debian-local stable main" \
    | sudo tee /etc/apt/sources.list.d/stripe.list > /dev/null

  sudo apt-get update -qq
  sudo apt-get install -y -qq stripe
  echo "  ✅ Stripe CLI installed: $(stripe --version)"
fi

echo ""
echo "  All tools installed successfully."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
