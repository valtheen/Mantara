#!/usr/bin/env bash
# Hapus background hitam ikon -> PNG transparan (untuk UI game)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ICON_DIR="$ROOT/assets/icons"
FUZZ="${ICON_FUZZ:-15}"
SIZE="${ICON_SIZE:-512}"

for src in "$ICON_DIR"/*.jpeg "$ICON_DIR"/*.jpg; do
  [[ -f "$src" ]] || continue
  base="$(basename "$src" | sed 's/\.[^.]*$//')"
  out="$ICON_DIR/${base}.png"
  magick "$src" \
    -resize "${SIZE}x${SIZE}>" \
    -alpha set \
    -fuzz "${FUZZ}%" \
    -transparent black \
    "$out"
  echo "OK ${base}.png"
done
