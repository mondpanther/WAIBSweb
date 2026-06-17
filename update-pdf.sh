#!/usr/bin/env bash
#
# Copy the latest build of main_direction.pdf from the Chatting-about-Innovation
# repo into this site, then commit & push so it goes live on GitHub Pages.
#
# Live URL once pushed:
#   https://mondpanther.github.io/WAIBSweb/main_direction.pdf
#
# Usage (from anywhere):
#   bash update-pdf.sh
#
set -euo pipefail

# Resolve this script's directory (the WAIBSweb site root).
SITE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Source PDF: sibling repo next to WAIBSweb.
SRC="$SITE_DIR/../Chatting-about-Innovation/main_direction.pdf"
DEST="$SITE_DIR/main_direction.pdf"

if [[ ! -f "$SRC" ]]; then
  echo "ERROR: source PDF not found at: $SRC" >&2
  exit 1
fi

cp "$SRC" "$DEST"
echo "Copied $(basename "$SRC") -> $DEST"

cd "$SITE_DIR"
if git diff --quiet -- main_direction.pdf; then
  echo "No change in main_direction.pdf — nothing to commit."
  exit 0
fi

git add main_direction.pdf
git commit -m "Update main_direction.pdf"
git push
echo "Pushed. It will be live shortly at:"
echo "  https://mondpanther.github.io/WAIBSweb/main_direction.pdf"
