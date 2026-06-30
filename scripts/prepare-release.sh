#!/usr/bin/env bash
# Satu perintah: build web + ikon + sync native
set -eu
cd "$(dirname "$0")/.."
npm run build
npm run icons:all
npx cap sync
npm run release:check
echo ""
echo "Langkah berikutnya:"
echo "  iOS:     npm run cap:ios      → Xcode → Archive"
echo "  Android: npm run cap:android  → Build → Generate Signed Bundle"
