#!/bin/bash

REPO_DIR="/home/greg_capmus_app/nanoclaw"
WATCH_DIR="$REPO_DIR/groups/main"
WATCH_FILENAME="CLAUDE.md"

echo "Watching $WATCH_DIR/$WATCH_FILENAME for changes..."

inotifywait -m -e close_write,moved_to,create --format '%e %f' "$WATCH_DIR" | while read -r event filename; do
  if [ "$filename" = "$WATCH_FILENAME" ]; then
    echo "Change detected ($event on $filename), committing and pushing..."
    cd "$REPO_DIR"
    git add "groups/main/$WATCH_FILENAME"
    if git diff --cached --quiet; then
      echo "No changes to commit."
    else
      git commit -m "Auto-update groups/main/CLAUDE.md"
      git push gforce main
      echo "Pushed to gforce."
    fi
  fi
done
