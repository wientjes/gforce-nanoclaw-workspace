# NanoClaw git workflow shortcuts

NANOCLAW_DIR="$HOME/nanoclaw"

# Pull latest upstream NanoClaw changes, rebasing local customizations on top
nc-pull() {
    git -C "$NANOCLAW_DIR" pull --rebase origin main
}

# Push current state (customizations) to personal fork
nc-push() {
    git -C "$NANOCLAW_DIR" push --force gforce main
}

# Full sync: pull upstream + push to personal fork
nc-sync() {
    echo "==> Pulling upstream changes..."
    git -C "$NANOCLAW_DIR" pull --rebase origin main || return 1
    echo "==> Pushing to personal fork..."
    git -C "$NANOCLAW_DIR" push --force gforce main
}

# Show divergence status between upstream and personal fork
nc-status() {
    echo "==> Local vs origin/main:"
    git -C "$NANOCLAW_DIR" log --oneline origin/main..HEAD
    echo "==> Local vs gforce/main:"
    git -C "$NANOCLAW_DIR" log --oneline gforce/main..HEAD 2>/dev/null || echo "(fetch gforce first)"
    git -C "$NANOCLAW_DIR" status
}
