#!/usr/bin/env node
/**
 * Build www/ untuk Capacitor / PWA deploy.
 * Sumber: mantara v23.html → www/index.html + salin assets/
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "mantara v23.html");
const WWW = path.join(ROOT, "www");
const ASSETS_SRC = path.join(ROOT, "assets");
const ASSETS_DST = path.join(WWW, "assets");

function cpDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) cpDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function injectMobileHead(html) {
  const marker = "<!-- MANTARA_MOBILE_PACK -->";
  if (html.includes(marker)) {
    return html.replace(
      /<!-- MANTARA_MOBILE_PACK -->[\s\S]*?<!-- \/MANTARA_MOBILE_PACK -->/,
      mobileBlock()
    );
  }
  return html.replace("</head>", mobileBlock() + "\n</head>");
}

function mobileBlock() {
  return `<!-- MANTARA_MOBILE_PACK -->
<link rel="manifest" href="manifest.webmanifest">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="icon" type="image/png" sizes="192x192" href="icons/icon-192.png">
<link rel="icon" type="image/png" sizes="512x512" href="icons/icon-512.png">
<script src="js/capacitor-loader.js" defer></script>
<script src="js/native-bridge.js" defer></script>
<!-- /MANTARA_MOBILE_PACK -->`;
}

function main() {
  if (!fs.existsSync(SRC)) {
    console.error("Sumber tidak ditemukan:", SRC);
    process.exit(1);
  }
  let html = fs.readFileSync(SRC, "utf8");
  html = injectMobileHead(html);

  fs.mkdirSync(WWW, { recursive: true });
  fs.mkdirSync(path.join(WWW, "js"), { recursive: true });
  fs.writeFileSync(path.join(WWW, "index.html"), html);

  cpDir(ASSETS_SRC, ASSETS_DST);

  // salin manifest & js statis jika ada di www template
  for (const f of ["manifest.webmanifest"]) {
    const p = path.join(WWW, f);
    if (!fs.existsSync(p)) {
      console.warn("Peringatan: belum ada", f, "— jalankan npm run icons");
    }
  }

  const stat = fs.statSync(path.join(WWW, "index.html"));
  console.log("✓ www/index.html", Math.round(stat.size / 1024), "KB");
  if (fs.existsSync(ASSETS_DST)) console.log("✓ www/assets/ disalin");
  console.log("Build www selesai.");
}

main();
