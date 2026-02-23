# NanoClaw git workflow shortcuts

NANOCLAW_DIR="$HOME/nanoclaw"
WORKSPACE_DIR="$HOME/gforce-nanoclaw-workspace"

# Pull latest upstream NanoClaw changes
nc-update() {
    git -C "$NANOCLAW_DIR" pull origin main
}

# Show NanoClaw status
nc-status() {
    git -C "$NANOCLAW_DIR" status
}

# Save workspace changes (memory, persona, bot files) to GitHub
# Usage: ws-save "what changed"
ws-save() {
    local msg="${1:-Update workspace files}"
    git -C "$WORKSPACE_DIR" add -A
    if git -C "$WORKSPACE_DIR" diff --cached --quiet; then
        echo "Nothing to save."
    else
        git -C "$WORKSPACE_DIR" commit -m "$msg"
        git -C "$WORKSPACE_DIR" push origin main
        echo "Saved to gforce-nanoclaw-workspace."
    fi
}

# Show workspace status
ws-status() {
    git -C "$WORKSPACE_DIR" status
}

# Pull workspace from GitHub (e.g. after editing on another machine)
ws-pull() {
    git -C "$WORKSPACE_DIR" pull origin main
}
