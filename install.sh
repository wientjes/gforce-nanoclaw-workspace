#!/bin/bash
# Restore workspace files into a fresh install.
# Run after cloning both repos:
#   git clone https://github.com/qwibitai/nanoclaw ~/nanoclaw
#   git clone git@github.com:wientjes/gforce-nanoclaw-workspace ~/gforce-nanoclaw-workspace
#   cd ~/gforce-nanoclaw-workspace && ./install.sh

set -e

WORKSPACE="$(cd "$(dirname "$0")" && pwd)"
NANOCLAW="$HOME/nanoclaw"
SYSTEMD_DIR="$HOME/.config/systemd/user"

if [ ! -d "$NANOCLAW" ]; then
  echo "Error: $NANOCLAW not found. Clone nanoclaw first."
  exit 1
fi

echo "==> Restoring memory and persona files..."
cp "$WORKSPACE/groups/main/CLAUDE.md"     "$NANOCLAW/groups/main/"
cp "$WORKSPACE/groups/main/IDENTITY.md"   "$NANOCLAW/groups/main/"
cp "$WORKSPACE/groups/main/MEMORY.md"     "$NANOCLAW/groups/main/"
cp "$WORKSPACE/groups/main/SOUL.md"       "$NANOCLAW/groups/main/"
cp "$WORKSPACE/groups/main/USER.md"       "$NANOCLAW/groups/main/"

echo "==> Restoring global memory..."
cp "$WORKSPACE/groups/global/CLAUDE.md"   "$NANOCLAW/groups/global/"

echo "==> Restoring Telegram bot files..."
cp "$WORKSPACE/groups/main/ecosystem.config.js"      "$NANOCLAW/groups/main/"
cp "$WORKSPACE/groups/main/package.json"             "$NANOCLAW/groups/main/"
cp "$WORKSPACE/groups/main/send-telegram.js"         "$NANOCLAW/groups/main/"
cp "$WORKSPACE/groups/main/telegram-bot.js"          "$NANOCLAW/groups/main/"
cp "$WORKSPACE/groups/main/telegram-bot-ai.js"       "$NANOCLAW/groups/main/"
cp "$WORKSPACE/groups/main/telegram-bot-instant.js"  "$NANOCLAW/groups/main/"
cp "$WORKSPACE/groups/main/telegram-processor.js"    "$NANOCLAW/groups/main/"
echo "    Run 'npm install' in $NANOCLAW/groups/main/ to restore node_modules."

echo "==> Restoring shell aliases..."
cp "$WORKSPACE/.bash_aliases" "$HOME/.bash_aliases"
echo "    Run: source ~/.bash_aliases"

echo "==> Installing workspace auto-sync service..."
mkdir -p "$SYSTEMD_DIR"
cp "$WORKSPACE/scripts/nanoclaw-workspace-sync.service" "$SYSTEMD_DIR/"
systemctl --user daemon-reload
systemctl --user enable nanoclaw-workspace-sync
systemctl --user start nanoclaw-workspace-sync
echo "    nanoclaw-workspace-sync.service enabled and started."

echo ""
echo "Done. Don't forget to:"
echo "  1. cd $NANOCLAW/groups/main && npm install"
echo "  2. Re-authenticate WhatsApp and Telegram"
echo "  3. Add API keys to $NANOCLAW/groups/main/.telegram/.env"
