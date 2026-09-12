# Harness QA Mantara

Uji otomatis pakai Chromium headless. Menjalankan game sungguhan — menekan tombol
di DOM, bukan memanggil fungsi — dan menangkap semua `pageerror`, `console.error`,
request gagal, dan `Mantara.errors`.

Stack trace diterjemahkan ke **nama modul**: `[22-arena.js:418:9]`, bukan
`index.html:9421:9`.

## Sekali saja

```bash
npm i -D playwright
npx playwright install chromium
```

## Menjalankan

Selalu `npm run build` dulu — harness menyajikan `www/`, bukan `src/`.

```bash
npm run build

node qa/1-smoke.js               # boot bersih? (± 5 detik)
node qa/2-soak.js 10 130 5       # 10 nyawa penuh, 5 paralel (± 4 menit)
node qa/3-crawl.js               # ~99 halaman + klik semua tombol (± 2 menit)
node qa/4-saveload.js            # save → reload → load, banding tiap field
node qa/5-a11y.js                # target sentuh & overflow di 4 ukuran layar
node qa/6-lifespan.js            # regresi balancing umur (BAL-01)
```

Semua keluar dengan kode 0 kalau lolos, 1 kalau gagal — jadi bisa dirantai:

```bash
npm run build && for f in qa/[1-6]-*.js; do node "$f" || exit 1; done
```

## Yang ditangkap tiap skrip

| Skrip | Menangkap |
|---|---|
| `1-smoke` | error saat boot, aset gagal dimuat, modul bus yang gagal daftar |
| `2-soak` | crash di tengah permainan, keadaan macet (umur tidak maju), sebaran umur wafat |
| `3-crawl` | halaman yang melempar error saat dibuka, tombol yang error saat diklik |
| `4-saveload` | field yang hilang/berubah saat save→load (paling sering: `Map`/`Set`/fungsi) |
| `5-a11y` | target sentuh < 44px, overflow horizontal, tombol tanpa label |
| `6-lifespan` | regresi BAL-01 — kalau lemparan kematian datar dipasang lagi, ini gagal |
| `8-world-regression` | rute mengitari bangunan, fokus keyboard, remount, pointer cancel, semua kota, dan layout responsif |
| `7-kota` | peta berjalan: kanvas, bangunan dari sublocs, kendali, pintu → halaman aksi. Juga menjaga agar markup SVG tidak pernah digambar sebagai teks di kanvas |

`2-soak` men-seed `Math.random`, jadi `node qa/2-soak.js 1 130 1` selalu
menghasilkan nyawa yang sama persis — dipakai untuk mereproduksi temuan.

## Menambah uji

`lib.js` menyediakan:

```js
const {boot,newLife,advanceTo,drain,fmtErr} = require('./lib');

const t = await boot({settle:2000, port:8410});   // + width/height
await newLife(t.page, 'mageborn');                // lewati layar awal
await advanceTo(t.page, 30);                      // maju ke usia 30
await drain(t.page);                              // tutup semua modal & sub-halaman
// ... t.page.evaluate(...) ...
console.log(t.log.pageErrors.map(fmtErr));
await t.close();
```

Pakai port berbeda per skrip supaya bisa jalan paralel.

Untuk memakai Chrome lokal tanpa mengunduh Chromium:

```bash
CHROMIUM_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" npm run qa
```
