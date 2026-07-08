#!/usr/bin/env bash
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RES="$ROOT/resources"
WWW_ICONS="$ROOT/www/icons"

mkdir -p "$RES" "$WWW_ICONS"

SRC="$RES/icon-source.png"
ICON_PNG="$RES/icon.png"
if [[ -f "$ICON_PNG" ]]; then
  SRC="$ICON_PNG"
elif [[ ! -f "$SRC" ]]; then
  echo "Membuat icon-source.png (tanpa font eksternal)..."
  magick -size 1024x1024 xc:'#171019' \
    -fill '#2e2440' -draw "roundrectangle 80,80 944,944 120,120" \
    -fill '#f0c040' -draw "circle 512,512 512,200" \
    "$SRC"
  cp "$SRC" "$ICON_PNG"
fi

echo "-> PWA icons"
magick "$SRC" -resize 192x192 "$WWW_ICONS/icon-192.png"
magick "$SRC" -resize 512x512 "$WWW_ICONS/icon-512.png"
magick "$SRC" -resize 180x180 "$WWW_ICONS/apple-touch-icon.png"
magick "$SRC" -resize 1024x1024 "$WWW_ICONS/store-1024.png"

echo "OK Icons generated in www/icons/"
