# QA Mantara v25 — Laporan Uji, Perbaikan, & Fitur Baru

Build diuji: `mantara v23.html` · 53 modul · sha `81491b50c6b3c43d` · 1.141.088 byte
Semua uji dijalankan headless (Chromium 1194, viewport iPhone 14 390×844, `hasTouch`, UA iOS 17).

---

## Ringkasan

| | |
|---|---|
| Modul diperiksa | 53 (51 sebelumnya + 2 baru) |
| Nyawa disimulasikan penuh | 30+ (lahir → mati, klik sungguhan di DOM) |
| Titik masuk UI ditelusuri | 99 fungsi `open*` / `render*` / `nav*` |
| Error runtime ditemukan | **0** |
| Bug/temuan dicatat | 7 (1 tinggi, 2 sedang, 4 rendah) — **semua diperbaiki** |
| Fitur v25 diselesaikan | 2 dari 4 sisa (Jalan Langka, Bestiarium) |

**Kesan umum: kode ini sehat.** Nol crash di 30 nyawa penuh, nol deklarasi ganda,
nol kunci objek duplikat, save/load bolak-balik identik 79 dari 79 field, dan nol
overflow horizontal di empat ukuran layar. Temuan terbesar bukan bug yang melempar
error — melainkan **satu sistem balancing yang sudah ditulis dengan benar tapi tidak
pernah benar-benar berpengaruh** karena dua lemparan kematian lama masih jalan di
sebelahnya.

---

## Cara pengujian

Bukan pengujian manual. Tiga lapis, semuanya otomatis dan bisa diulang:

1. **Analisis statik (AST, acorn).** Seluruh bundel 1,04 MB di-parse. Diperiksa:
   deklarasi top-level ganda (yang di skrip gabungan akan jadi `SyntaxError` dan
   mematikan seluruh game), kunci objek duplikat, identifier yang tidak pernah
   terdefinisi, `if(x = y)` yang seharusnya `==`.
2. **Bot pemain.** Menekan tombol sungguhan di DOM — bukan memanggil fungsi —
   dari layar asal-usul sampai batu nisan. `Math.random` di-seed supaya tiap
   temuan bisa direproduksi persis. Dijalankan paralel 6 proses.
3. **Penelusur UI.** Memanggil tiap fungsi pembuka halaman, lalu **mengklik semua
   tombol yang terlihat** di halaman yang terbuka, lalu menutup dan lanjut.

Semua skrip uji tersimpan di `qa/` (tidak ikut ke build).

---

## Temuan & perbaikan

### 🔴 BAL-01 — Tiga lemparan kematian usia tua saling menumpuk (TINGGI)

**Ini temuan terpenting sesi ini.**

Sistem vitalitas v24 dirancang membuat umur ditentukan gaya hidup, dengan target
tertulis di komentar kodenya sendiri: *"Rentang jadi ~45 s/d ~95."*

Yang sebenarnya terjadi: sistem itu **tidak pernah menentukan apa pun**. Dua lemparan
kematian usia tua yang lebih tua masih berjalan berdampingan dengannya:

| Sumber | Rumus | Melihat gaya hidup? |
|---|---|---|
| `19-balance-age.js` langkah (d) | `p = (umur−65) × 0,012`, +0,05 di 85+ | **tidak** |
| `06-world-time.js:215` | `chance((umur−60) × 0,015)` bila nyawa < 35 | **tidak** |
| `40-v24-balance.js` (vitalitas) | `1,094^(umur−pergeseran−35) × 0,0009` | ya |

Karena dua yang pertama memakai umur **datar**, merekalah yang mendominasi dari usia
~72 ke atas, dan vitalitas jadi hiasan.

**Diukur (model survival dari fungsi yang benar-benar dipakai game):**

| Profil | Median umur SEBELUM | Median umur SESUDAH |
|---|---|---|
| Melarat, sakit-sakitan, karir berbahaya | 67 | **67** |
| Miskin | — | 76 |
| Biasa | 71 | 80 |
| Mapan | — | 86 |
| Kaya & sehat | 74 | 92 |
| Segalanya maksimal | 74 | **96** |

Sebelumnya: **7 tahun** memisahkan pengemis sakit dari bangsawan yang sempurna.
Sekarang: **29 tahun**, dengan ekor 39–105. Persis rentang yang dijanjikan rancangannya.

**Perbaikan (3 berkas):**
- `40-v24-balance.js` memasang bendera `window.__mantaraOldAgeOwner`; dua lemparan
  lama menepi kalau bendera itu ada (tetap jadi jaring pengaman kalau modul v24
  dilepas). Kerapuhan usia lanjut pindah ke `deathChance()` sebagai satu komponen
  yang **melihat kesehatan**, bukan pajak umur datar.
- Pemetaan vitalitas → umur dilebarkan: tiap **3,6** poin vitalitas ≈ 1 tahun (dulu 6).
- Ditambah ekor keras di usia 100+ supaya tidak ada yang abadi.

### 🟠 BAL-02 — Komponen kekayaan pada vitalitas praktis konstan (SEDANG)

Rumus lama: `Math.min(18, Math.log10(max(10, coin)) × 5)`.
Pada 1.000 keping nilainya sudah **+17 dari maksimal 18** — artinya hampir setiap
karakter yang pernah bekerja mendapat angka yang sama. Kekayaan tidak membedakan siapa pun.

Diperparah kalibrasi yang tidak cocok dengan ekonomi Mantara: gaji karir tertinggi
~75/tahun dan rumah termahal 3.500 keping, tapi kurvanya baru "penuh" di 80.000 keping.

**Perbaikan:** dikalibrasi ulang ke skala ekonomi yang sebenarnya — ~600 keping netral,
melarat −12, kaya-raya (50.000+) +14. Titik netral riwayat kesehatan juga digeser
dari 58 ke **52**, karena diukur dari permainan sungguhan `_healthAvg` seumur hidup
jatuh di 35–60 — dengan titik 58, hampir semua pemain dapat nilai minus.

### 🟠 UX-04 — Layar kematian tertimpa modal & panduan (SEDANG)

Ditemukan dengan memaksa `die()` pada usia 27. Batu nisan tampil, tapi di atasnya
masih menumpuk: kartu tur onboarding, popup "Tahap Hidup", **dan** modal kejadian
yang sedang terbuka. Teks batu nisan terbaca:
*"…Mulai takdir baru dari awal. Lahir Kembali **Kau menerima tongkat sihir. Masa Bayi (0–5)**"*

Ini bukan kasus buatan: `die()` sering dipanggil **dari dalam** resolusi pilihan
(`"Aktivitas berakibat fatal"`), jadi modalnya memang masih terbuka saat epitaf dilukis.

**Perbaikan:** satu fungsi `clearOverlaysForDeath()` di `30-onboarding.js` menyapu
semua lapisan (tur, panduan tahap, modal kejadian, tumpukan sub-halaman) sebelum
layar kematian muncul. Terverifikasi: layar kematian sekarang bersih.

### 🟡 A11Y-05 — Target sentuh di bawah 44 px (RENDAH)

Diukur di 4 viewport (320 / 390 / 430 / 768 px):

| Elemen | Tinggi lama | Sekarang |
|---|---|---|
| `.cage.trait-chips` (baris perangai, bisa diklik) | **13 px** | 44 px |
| `.gp-off` (tombol matikan panduan) | 33 px | 44 px |
| `.save-btn` | 36 px | 44 px |
| `.tut-help` (🧙 ⏻ ♫ di topbar) | 34–40 px | 44 px |
| `.mchoice` (semua pilihan modal) | 42 px | 44 px |

Baris perangai setinggi 13 px adalah yang paling parah — praktis mustahil ditekan
tepat di ponsel. Sekalian diubah dari `<div onclick>` jadi `<button>` dengan
`aria-label`, supaya bisa dijangkau keyboard & pembaca layar.

**Hasil: 0 target di bawah 44 px di keempat viewport.**

### 🟡 A11Y-06 — Popup panduan tetap terbaca pembaca layar saat tersembunyi (RENDAH)

`.guide-pop` hanya memakai `opacity:0; pointer-events:none`. Elemennya tetap ada di
pohon aksesibilitas, jadi VoiceOver membacakan panduan yang tidak terlihat.
**Perbaikan:** ditambah `visibility:hidden` (dan transisinya).

### 🟡 ROB-07 — Halaman Hubungan buntu (RENDAH)

`openRomance(relId)` dengan relasi yang sudah hilang (pasangan wafat sementara
halamannya terbuka) merender halaman kosong berisi satu kalimat *"Hubungan berakhir."*
— tanpa penjelasan dan tanpa jalan keluar selain panah kembali.

**Perbaikan:** keadaan kosong yang menjelaskan apa yang terjadi + tombol kembali ke Relasi.

### 🟡 BEST-08 — Pesan naik tingkat bestia menelan kemampuan (RENDAH)

Rantai `else if` di `levelUp()` hanya mengumumkan satu kemampuan. Akibatnya naga &
phoenix (`ride:3`) yang mencapai tingkat 3 hanya diberi tahu *"bisa ditunggangi"* —
padahal pada tingkat itu ia **juga** mulai ikut bertarung. Tingkat 2 mereka bahkan
tidak mengumumkan apa pun.

**Perbaikan:** semua kemampuan yang terbuka di tingkat itu disebutkan sekaligus.

---

## Yang diperiksa dan ternyata BAIK

Layak dicatat, karena ini yang paling sering jadi sumber bug di proyek sebesar ini:

| Uji | Hasil |
|---|---|
| Parse bundel 1,04 MB | ✓ bersih |
| Deklarasi top-level ganda (`const` ganda = game mati total) | ✓ 0 dari 548 statement |
| Kunci objek duplikat | ✓ 0 |
| Identifier tak terdefinisi | ✓ 0 (14 "temuan" ternyata global implisit yang sah) |
| Boot | ✓ 0 error, 0 request gagal |
| 30+ nyawa penuh, klik acak & terarah | ✓ 0 error runtime |
| 99 titik masuk UI + klik semua tombol di dalamnya | ✓ 0 error |
| Save → reload halaman → load | ✓ **79 dari 79 field identik** |
| Overflow horizontal di 320/390/430/768 px | ✓ tidak ada |
| Tombol tanpa label/aria | ✓ 0 |
| Event bus (`Mantara.errors`) | ✓ 0 |

---

## Fitur v25 yang diselesaikan

Dari empat sisa di dokumen *"Mantara v25 — Refactor, Bestia, Langit"*, dua dikerjakan.
Keduanya ditulis sebagai **modul bus** (`Mantara.module`) — nol monkey-patch baru,
sesuai aturan yang ditetapkan di `44-bus-hooks.js`.

### `50-jalan-langka.js` — Pilar 3: Jalan Langka

Delapan karir tingkat kedua. Tiga aturan rancangannya diimplementasikan utuh:

1. **Diundang, bukan dilamar.** Tidak muncul di daftar lowongan sama sekali
   (ditandai `rare:true`; tiga penyaring daftar kerja lama diajari melewatinya).
   `req()`-nya hanya lulus saat modul menaruh tiket sekali pakai — jadi tidak ada
   jalan masuk lain selain undangan.
2. **Satu jalan per nyawa.** Menerima satu menutup tujuh sisanya. Keluar dari
   jalan = keluar selamanya.
3. **Ada harganya.** Tiap jalan punya risiko tahunan sungguhan, bukan sekadar gaji besar.

| Jalan | Syarat | Harganya |
|---|---|---|
| 🌀 Penunggang Langit | tunggangan terbang lv2+ · Pesona 60 | risiko jatuh 5–14%/tahun |
| 🦄 Penjinak Bestia | 3 bestia ikatan 80+ | biaya rawat naik; satu-satunya jalan dapat telur naga |
| 🐉 Pemburu Naga | Kekuatan 80 · pernah taklukkan bestia tingkat 4 | tiap kontrak bisa jadi yang terakhir |
| 🕯️ Pembaca Nubuat | tuntaskan 2 ramalan | melihat yang tak ingin dilihat |
| 🗝️ Tangan Kiri Raja | Reputasi 90 · pernah di jalur politik | jatuh bersama rajamu |
| ⚗️ Empu Pusaka | Pandai Besi jenjang maks · pusaka +5 | bahan seumur hidup, biayanya besar |
| 🌑 Penjaga Krip | Mana 75 · Reputasi < 20 | Inkuisisi memburu, keluarga menjauh |
| ⚕️ Tabib Wabah | ijazah tabib · selamat dari wabah | dipuja saat krisis, dicurigai saat damai |

**Diwariskan.** Jalan yang pernah ditempuh leluhur tersimpan di
`mantara_jalan_langka_v1`; ahli warismu lahir dengan keuntungan kecil yang sesuai
(cucu Pemburu Naga lahir dengan Kekuatan +3; cucu Tabib Wabah lahir kebal wabah).
Sambungan langsung ke Kronik Wangsa nanti.

**Kalibrasi ekonomi.** Gaji pokok 85–115 (karir biasa tertinggi: 75), jadi terasa
naik kelas tanpa mematahkan ekonomi. Selisih pendapatan total sekitar 1,5–2× karir
puncak biasa — bukan 8×, seperti pada versi pertama yang saya buang setelah diukur.

> **Catatan uji:** versi pertama Pemburu Naga tidak pernah gagal sekali pun dengan
> Kekuatan 99 + senjata +5 (kekuatan efektif 119 vs beban maksimal 100) — risikonya
> cuma hiasan. Sekarang ada 8% nasib buruk yang tidak bisa dibeli dengan angka.

### `51-bestiarium.js` — Bestiarium

Koleksi **milik wangsa**, bukan milik karakter. Tersimpan di `mantara_bestiarium_v1`
dan bertahan melewati kematian, pergantian ahli waris, bahkan mulai-baru
(terverifikasi: 3 entri sebelum `die()`, 3 entri sesudah `restart()`).

19 entri, semuanya makhluk yang **sudah ada di game** — bukan konten karangan baru:
6 boss dungeon, 10 bestia peliharaan, 3 makhluk perjumpaan. Tiap entri punya asal,
kelemahan, jumlah perjumpaan, jumlah penaklukan, dan **siapa leluhur yang pertama
kali mencatatnya**. Yang belum ditemui tampil sebagai siluet bergaris putus-putus.

Terisi otomatis dari tiga sumber: bestia yang kau ikat (`year:end`), masuk & menamatkan
dungeon (`enterDungeon` / `dunAct`), dan lawan bertipe makhluk di arena.

Ini yang memberi pemain 30 jam alasan memasuki dungeon yang sudah mereka kuasai:
*masih ada 11 entri kosong.*

---

## Yang belum dikerjakan

Dua sisa dari rencana v25, keduanya masih relevan:

1. **Balai Sekolah** — 4 balai berpoin, diwariskan ke anak. Biaya kecil (sistem
   sekolah sudah lengkap), dampaknya sekolah punya identitas.
2. **Kronik Wangsa** — muara semuanya. Fondasinya sekarang **sudah lengkap**:
   `mantara_bestia_legends_v1` (bestia Legenda) dan `mantara_jalan_langka_v1`
   (jalan leluhur) sudah terisi. Tinggal ditampilkan.

## Catatan lingkungan (bukan bug kode)

`npm run build` gagal di mesinmu pada tahap `build-www.js`, dengan
`Unknown system error -35` saat menyalin `assets/icons/*.png`. Penyebabnya bukan
kode: sebagian berkas di `assets/` dan `src/` berstatus *cloud-only* (belum
diunduh ke disk oleh iCloud/penyimpanan awan), jadi `fs.copyFileSync` menolaknya.

`node scripts/bundle.js` sendiri berjalan normal. `www/index.html` sudah saya
perbarui dari bundel baru (dengan blok `MANTARA_MOBILE_PACK` yang sama persis),
dan `www/assets/` tidak tersentuh — isinya tetap 35 ikon, 7 trek musik, 1 gambar.

Untuk membuat `npm run build` jalan lagi: buka Finder → folder `Mantara` →
klik kanan → **Download Now** (atau centang "Keep Downloaded"), lalu ulangi.

---

## Verifikasi akhir

| Uji | Hasil |
|---|---|
| `node scripts/bundle.js --check` | ✓ IDENTIK — `src/` dan file terbangun sinkron |
| Bundel di container == bundel di mesinmu | ✓ sha `81491b50c6b3c43d`, 1.141.088 byte, byte-per-byte sama |
| Boot | ✓ 0 error |
| 12 nyawa penuh setelah semua perubahan | ✓ 0 error · umur wafat 44–74 (sebelumnya 36–70) |
| 99 titik masuk UI | ✓ 0 error |
| Save/load | ✓ 79/79 field identik |
| Target sentuh 4 viewport | ✓ 0 di bawah 44 px |
| `Mantara.errors` | ✓ 0 |
| Modul bus aktif | bestia · langit · jalanlangka · bestiarium |
