#!/bin/bash
# Watch ~/gforce-nanoclaw-workspace for changes and auto-commit/push to GitHub.
# Debounces: waits 30s of inactivity before committing.

WORKSPACE_DIR="$HOME/gforce-nanoclaw-workspace"
DEBOUNCE_SECS=30
TRIGGER_FILE="/tmp/workspace-changed"

echo "Watching $WORKSPACE_DIR for changes..."

# Background watcher: touches trigger file on any change
inotifywait -m -r -e close_write,moved_to,create,delete \
    --exclude '(\.git|node_modules|logs|conversations)' \
    "$WORKSPACE_DIR" 2>/dev/null | while read -r dir event file; do
    touch "$TRIGGER_FILE"
done &

INOTIFY_PID=$!

cleanup() {
    kill "$INOTIFY_PID" 2>/dev/null
    rm -f "$TRIGGER_FILE"
    exit 0
}
trap cleanup SIGTERM SIGINT

# Main loop: commit when trigger file is older than DEBOUNCE_SECS
while true; do
    if [ -f "$TRIGGER_FILE" ]; then
        AGE=$(( $(date +%s) - $(stat -c %Y "$TRIGGER_FILE") ))
        if [ "$AGE" -ge "$DEBOUNCE_SECS" ]; then
            rm -f "$TRIGGER_FILE"
            echo "Change detected, committing..."
            cd "$WORKSPACE_DIR"
            git add -A
            if git diff --cached --quiet; then
                echo "No tracked changes to commit."
            else
                git commit -m "auto-sync $(date '+%Y-%m-%d %H:%M')"
                git push origin main && echo "Pushed to GitHub."
            fi
        fi
    fi
    sleep 5
done
