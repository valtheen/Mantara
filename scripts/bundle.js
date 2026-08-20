#!/usr/bin/env node
/**
 * MANTARA — BUNDLER  (v25)
 *
 * Menyambung src/*.js (urutan dari src/order.json) ke dalam SATU blok <script>
 * di src/index.shell.html, lalu menulis "mantara v23.html".
 *
 * Kenapa disambung, bukan dimuat sebagai <script src> terpisah:
 * kode v23/v24 mengandalkan hoisting deklarasi fungsi lintas-seluruh-script
 * dan urutan monkey-patch yang tepat. Menyambung ulang menjamin perilaku
 * runtime IDENTIK dengan monolit lama — pemisahan modul murni soal sumber.
 *
 * Pakai:
 *   node scripts/bundle.js            # bangun
 *   node scripts/bundle.js --check    # bangun ke memori, bandingkan, jangan tulis
 */
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");
const SHELL = path.join(SRC, "index.shell.html");
const ORDER = path.join(SRC, "order.json");
const OUT = path.join(ROOT, "mantara v23.html");
const MARK = "/* MANTARA_BUNDLE */";

const sha = (s) => crypto.createHash("sha256").update(s).digest("hex").slice(0, 16);

function build() {
  if (!fs.existsSync(SHELL)) throw new Error("src/index.shell.html tidak ada");
  if (!fs.existsSync(ORDER)) throw new Error("src/order.json tidak ada");

  const order = JSON.parse(fs.readFileSync(ORDER, "utf8"));
  const parts = [];
  let missing = [];

  for (const name of order) {
    const p = path.join(SRC, name);
    if (!fs.existsSync(p)) { missing.push(name); continue; }
    parts.push(fs.readFileSync(p, "utf8"));
  }
  if (missing.length) throw new Error("modul hilang: " + missing.join(", "));

  // Modul yang ada di disk tapi tidak terdaftar di order.json = kemungkinan lupa didaftarkan.
  const onDisk = fs.readdirSync(SRC).filter((f) => f.endsWith(".js"));
  const unlisted = onDisk.filter((f) => !order.includes(f));
  if (unlisted.length) {
    console.warn("⚠️  modul tidak terdaftar di order.json (TIDAK ikut dibundel):");
    unlisted.forEach((f) => console.warn("     - " + f));
  }

  const shell = fs.readFileSync(SHELL, "utf8");
  if (!shell.includes(MARK)) throw new Error("penanda " + MARK + " tidak ditemukan di shell");

  const bundle = parts.join("\n");
  const html = shell.replace(MARK, bundle);
  return { html, bundle, order, parts };
}

function main() {
  const check = process.argv.includes("--check");
  const { html, bundle, order, parts } = build();

  if (check) {
    if (!fs.existsSync(OUT)) { console.error("belum ada", OUT, "— jalankan tanpa --check dulu"); process.exit(1); }
    const cur = fs.readFileSync(OUT, "utf8");
    const same = cur === html;
    console.log("modul     :", order.length);
    console.log("hash lama :", sha(cur));
    console.log("hash baru :", sha(html));
    console.log(same ? "✓ IDENTIK — bundel cocok dengan file terbangun." :
                       "✗ BERBEDA — src/ dan mantara v23.html tidak sinkron.");
    process.exit(same ? 0 : 1);
  }

  fs.writeFileSync(OUT, html);
  const kb = (n) => (n / 1024).toFixed(1) + " KB";
  console.log("✓ mantara v23.html", kb(html.length), "· " + order.length + " modul · sha " + sha(html));
  const big = order.map((n, i) => ({ n, b: parts[i].length })).sort((a, b) => b.b - a.b).slice(0, 5);
  console.log("  modul terbesar:", big.map((x) => x.n + " (" + kb(x.b) + ")").join(", "));
}

main();
