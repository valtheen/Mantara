#!/usr/bin/env bash
set -eu
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RES="$ROOT/resources"
WWW_ICONS="$ROOT/www/icons"

mkdir -p "$RES" "$WWW_ICONS"

SVG="$RES/mantara-app-icon.svg"
ICON_PNG="$RES/icon.png"
SRC="$ICON_PNG"

if [[ -f "$SVG" ]]; then
  if command -v magick >/dev/null 2>&1; then
    magick -background none "$SVG" -resize 1024x1024 "$ICON_PNG"
  else
    TMP_ICON_DIR="$(mktemp -d)"
    qlmanage -t -s 1024 -o "$TMP_ICON_DIR" "$SVG" >/dev/null
    sips -s format png "$TMP_ICON_DIR/mantara-app-icon.svg.png" --out "$ICON_PNG" >/dev/null
  fi
elif [[ ! -f "$ICON_PNG" ]]; then
  echo "Gagal: $SVG dan $ICON_PNG tidak ditemukan." >&2
  exit 1
fi

echo "-> PWA icons"
if command -v magick >/dev/null 2>&1; then
  magick "$SRC" -resize 192x192 "$WWW_ICONS/icon-192.png"
  magick "$SRC" -resize 512x512 "$WWW_ICONS/icon-512.png"
  magick "$SRC" -resize 180x180 "$WWW_ICONS/apple-touch-icon.png"
  magick "$SRC" -resize 1024x1024 "$WWW_ICONS/store-1024.png"
else
  sips -z 192 192 "$SRC" --out "$WWW_ICONS/icon-192.png" >/dev/null
  sips -z 512 512 "$SRC" --out "$WWW_ICONS/icon-512.png" >/dev/null
  sips -z 180 180 "$SRC" --out "$WWW_ICONS/apple-touch-icon.png" >/dev/null
  sips -z 1024 1024 "$SRC" --out "$WWW_ICONS/store-1024.png" >/dev/null
fi

IOS_ICON="$ROOT/ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"
if [[ -d "$(dirname "$IOS_ICON")" ]]; then
  sips -z 1024 1024 "$SRC" --out "$IOS_ICON" >/dev/null
  echo "-> iOS AppIcon"
fi

LAUNCH_SVG="$RES/mantara-launch.svg"
IOS_SPLASH_DIR="$ROOT/ios/App/App/Assets.xcassets/Splash.imageset"
if [[ -f "$LAUNCH_SVG" && -d "$IOS_SPLASH_DIR" ]]; then
  TMP_SPLASH_DIR="$(mktemp -d)"
  qlmanage -t -s 2732 -o "$TMP_SPLASH_DIR" "$LAUNCH_SVG" >/dev/null
  sips -s format png "$TMP_SPLASH_DIR/mantara-launch.svg.png" --out "$RES/splash.png" >/dev/null
  for file in splash-2732x2732.png splash-2732x2732-1.png splash-2732x2732-2.png; do
    sips -z 2732 2732 "$RES/splash.png" --out "$IOS_SPLASH_DIR/$file" >/dev/null
  done
  echo "-> iOS Splash"
fi

echo "OK Icons generated in www/icons/"
