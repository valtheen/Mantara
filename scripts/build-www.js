#!/usr/bin/env node
/**
 * Build www/ untuk Capacitor / PWA deploy.
 * Sumber: mantara v23.html → www/index.html + salin assets/
 *
 * v24: cpDir dulu menyalin SELURUH folder assets apa adanya — termasuk 466 MB
 * file .wav yang tidak pernah dirujuk kode, 2,9 MB .jpeg duplikat dari .png,
 * dan file uji (_test.wav, _wtest). Hasilnya build ±485 MB: ditolak Play Store
 * (batas AAB 200 MB) dan App Store. Sekarang aset disaring lewat allowlist.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "mantara v23.html");
const WWW = path.join(ROOT, "www");
const ASSETS_SRC = path.join(ROOT, "assets");
const ASSETS_DST = path.join(WWW, "assets");

/* ---------- filter aset ---------- */
// Hanya ekstensi ini yang ikut ke build.
const ALLOW_EXT = new Set([".png", ".webp", ".svg", ".ogg", ".json", ".ico"]);
// Ditolak apa pun ekstensinya.
const DENY_EXT  = new Set([".wav", ".jpeg", ".jpg", ".aiff", ".flac", ".mp3", ".zip", ".psd"]);

let skipped = { count: 0, bytes: 0, samples: [] };

function shouldCopy(name) {
  if (name.startsWith("_")) return false;          // _test.wav, _wtest, dsb
  if (name.startsWith(".")) return false;          // .DS_Store, .fuse_hidden*
  const ext = path.extname(name).toLowerCase();
  if (DENY_EXT.has(ext)) return false;
  if (!ALLOW_EXT.has(ext)) return false;
  return true;
}

function cpDir(src, dst) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dst, { recursive: true });
  for (const ent of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, ent.name);
    const d = path.join(dst, ent.name);
    if (ent.isDirectory()) {
      if (ent.name.startsWith("_") || ent.name.startsWith(".")) continue;
      cpDir(s, d);
    } else if (shouldCopy(ent.name)) {
      fs.copyFileSync(s, d);
    } else {
      try {
        const st = fs.statSync(s);
        skipped.count++;
        skipped.bytes += st.size;
        if (skipped.samples.length < 6) skipped.samples.push(ent.name);
      } catch (e) { skipped.count++; }
    }
  }
}

function dirSize(p) {
  if (!fs.existsSync(p)) return 0;
  let total = 0;
  for (const ent of fs.readdirSync(p, { withFileTypes: true })) {
    const f = path.join(p, ent.name);
    total += ent.isDirectory() ? dirSize(f) : fs.statSync(f).size;
  }
  return total;
}
const mb = (n) => (n / 1048576).toFixed(1) + " MB";

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

  // Build bersih: buang assets lama supaya sisa .wav/.jpeg tidak menumpuk.
  // Sebagian lingkungan (sandbox / volume read-only) melarang unlink — jangan
  // gagalkan build karenanya, cukup peringatkan lalu timpa di tempat.
  let pruned = true;
  if (fs.existsSync(ASSETS_DST)) {
    try {
      fs.rmSync(ASSETS_DST, { recursive: true, force: true });
    } catch (e) {
      pruned = false;
      console.warn("↷ tidak bisa menghapus www/assets lama (" + e.code + ") — menimpa di tempat.");
      console.warn("  Kalau pernah build dengan versi lama, hapus www/assets manual sekali:");
      console.warn("  rm -rf www/assets && npm run build");
    }
  }
  cpDir(ASSETS_SRC, ASSETS_DST);

  for (const f of ["manifest.webmanifest"]) {
    const p = path.join(WWW, f);
    if (!fs.existsSync(p)) console.warn("Peringatan: belum ada", f, "— jalankan npm run icons");
  }

  const stat = fs.statSync(path.join(WWW, "index.html"));
  const total = dirSize(WWW);
  console.log("✓ www/index.html", Math.round(stat.size / 1024), "KB");
  console.log("✓ www/assets/  ", mb(dirSize(ASSETS_DST)));
  if (skipped.count) {
    console.log("↷ dilewati     ", skipped.count, "file /", mb(skipped.bytes),
      "(" + skipped.samples.join(", ") + (skipped.count > 6 ? ", …" : "") + ")");
  }
  console.log("→ TOTAL BUILD  ", mb(total));
  if (total > 180 * 1048576) {
    console.error("\n⚠️  BUILD > 180 MB — Play Store menolak AAB di atas 200 MB.");
    if (!pruned) console.error("   (www/assets lama tidak terhapus — jalankan: rm -rf www/assets && npm run build)");
    process.exit(1);
  }
  console.log("Build www selesai.");
}

main();
