#!/usr/bin/env node
/** Cek kesiapan deploy sebelum upload ke App Store / Play Store */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const checks = [];

function ok(msg) { checks.push({ ok: true, msg }); }
function fail(msg) { checks.push({ ok: false, msg }); }

function exists(p) { return fs.existsSync(path.join(ROOT, p)); }

if (!exists("www/index.html")) fail("www/index.html — jalankan: npm run build");
else ok("www/index.html ada");

if (!exists("www/manifest.webmanifest")) fail("manifest.webmanifest hilang");
else ok("PWA manifest ada");

for (const ic of ["www/icons/icon-512.png", "www/icons/apple-touch-icon.png", "www/icons/store-1024.png"]) {
  if (!exists(ic)) fail(`${ic} — jalankan: npm run icons`);
  else ok(ic);
}

if (!exists("www/privacy.html")) fail("privacy.html — wajib untuk store listing");
else ok("Kebijakan privasi (privacy.html)");

if (!exists("capacitor.config.json")) fail("capacitor.config.json");
else ok("Capacitor config");

if (!exists("ios")) fail("Folder ios/ — jalankan: npx cap add ios");
else ok("Proyek iOS");

if (!exists("android")) fail("Folder android/ — jalankan: npx cap add android");
else ok("Proyek Android");

if (!exists("android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png"))
  fail("Ikon launcher Android — jalankan: npm run icons:native");
else ok("Ikon launcher Android");

if (!exists("ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png"))
  fail("Ikon App Store iOS — jalankan: npm run icons:native");
else ok("Ikon App Store iOS");

if (!exists("resources/icon.png"))
  fail("resources/icon.png — sumber ikon store (1024×1024)");
else ok("Sumber ikon store (resources/icon.png)");

const html = fs.readFileSync(path.join(ROOT, "www/index.html"), "utf8");
if (!html.includes("MANTARA_MOBILE_PACK")) fail("Mobile pack belum diinjeksi — npm run build");
else ok("Mobile meta terinjeksi");

if (html.includes("mantara v23.html")) fail("Masih ada referensi ke mantara v23.html di build");
else ok("Tidak ada referensi file dev");

console.log("\n=== Mantara Release Check ===\n");
let pass = 0;
for (const c of checks) {
  console.log((c.ok ? "✓" : "✗"), c.msg);
  if (c.ok) pass++;
}
console.log(`\n${pass}/${checks.length} lulus`);
if (pass < checks.length) {
  console.log("\nPerbaiki item yang gagal sebelum submit ke store.");
  process.exit(1);
}
console.log("\nSiap lanjut ke signing & upload store.\n");
