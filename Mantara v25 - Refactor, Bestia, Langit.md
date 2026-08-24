# Mantara v25 — Refactor Modul, Bestia Terikat, Langit

Tiga pekerjaan selesai: file monolit dipecah jadi modul, event bus dipasang, lalu Pilar 1 & 2
dibangun di atasnya sebagai modul sungguhan — bukan lapis monkey-patch ke-46.

---

## 1 · Refactor: monolit → 48 modul

**Cara yang dipakai:** sumber jadi modular, **hasil build tetap satu file**.

`src/*.js` disambung ulang oleh `scripts/bundle.js` ke dalam satu blok `<script>` dengan urutan
yang sama persis. Ini bukan detail teknis kecil — inilah yang membuat refactor ini **nol risiko**:

- Kode v23/v24 mengandalkan *hoisting* deklarasi fungsi lintas seluruh script, dan urutan 45 lapis
  monkey-patch yang tepat. Kalau dipecah jadi `<script src>` terpisah, keduanya rusak.
- Dengan disambung ulang, perilaku runtime **identik byte-per-byte**. Pemisahan modul murni soal
  organisasi sumber.

Skrip pemecah memverifikasi ini secara otomatis:

```
modul       : 48
total baris : 14.683
sambung ulang identik dengan asli : True
```

Dan `npm run bundle:check` membandingkan hash `src/` dengan file terbangun kapan saja:

```
hash lama : ceed2e39d24f785a
hash baru : ceed2e39d24f785a
✓ IDENTIK — bundel cocok dengan file terbangun.
```

### Isi `src/`

| Modul | Isi |
|---|---|
| `00-boot` → `03-ui-render` | Error guard, aset, karir dasar, loop inti, render |
| `04-assets` → `09-school` | Properti, karakter, dunia & waktu, minigame, dagang, sekolah |
| `10-popup` → `19-balance-age` | Popup, aging event, sosial, toko, keturunan, peta, save |
| `20-platform` → `29-music` | Audio, IAP, slot, navigasi, ekspansi dinasti, arena, musik |
| `30-onboarding` → `39-romance` | Tutorial, aset hidup, tempa, penguasa, dungeon, percintaan |
| `40-v24-*` (4 modul) | Lapis v24: balance, Ramalan, konten, Musim Wangsa |
| `44-bus-hooks` | **Titik sadap tunggal** untuk semua fitur v25+ |
| `45-bestia`, `46-langit` | **Pilar 1 & 2 (baru)** |

Modul terbesar: `21-expansion` (58,9 KB), `22-arena` (49,2 KB), `25-school-life` (39,1 KB).
Itu kandidat pemecahan berikutnya kalau nanti disentuh lagi.

### Perintah baru

```bash
npm run bundle         # src/ → mantara v23.html
npm run bundle:check   # verifikasi src/ dan file terbangun sinkron
npm run build          # bundle + paket www/ (dengan gate 180 MB)
```

`bundle.js` juga memperingatkan kalau ada file `.js` di `src/` yang **lupa didaftarkan** di
`order.json` — kegagalan senyap yang paling mungkin terjadi pada pola ini.

---

## 2 · Event bus — mengakhiri monkey-patch berlapis

**Masalahnya:** sampai v24 setiap fitur baru menambah lapisan

```js
var _prev = advanceYear;
advanceYear = function(){ ... _prev.apply(this, arguments) ... };
```

45 kali. Urutan eksekusi jadi tak bisa ditebak, dan tidak ada satu tempat pun untuk melihat siapa
saja yang menyadap sebuah fungsi. **Dua dari tiga blocker yang diperbaiki di v24 lahir persis dari
pola ini.**

**Sekarang** fitur baru mendaftar ke bus:

```js
Mantara.module('bestia', function(M){
  M.on('year:end',   function(ctx){ ... });
  M.on('char:born',  function(ctx){ ... });
  M.on('hidup:render', function(ctx){ ctx.blocks.push('<div>...</div>'); });
});
```

Event resmi: `char:born` · `char:died` · `year:begin` · `year:end` · `tab:render` ·
`hidup:render` · `save:write` · `save:read` · `boot`.

Sifat penting:

- **`emit` tidak pernah melempar.** Satu modul rusak tidak menjatuhkan giliran tahun pemain;
  error masuk `Mantara.errors` untuk diperiksa.
- **Prioritas pendengar** (`M.on(evt, fn, prio)`) — modul bisa memastikan jalan setelah kode lama.
- **`Mantara.inspect()`** di console menampilkan semua event, jumlah pendengarnya, dan modul aktif.
- **`M.u`** berisi util bersama (`ri`, `chance`, `log`, `toast`, `stats`, `coin`, `spend`, …) —
  menggantikan 12 salinan helper yang sama yang tersebar di modul-modul lama.

Semua wrapper hidup di **satu file**: `44-bus-hooks.js`. Kalau nanti ada bug urutan eksekusi,
cukup baca file itu.

Terverifikasi: seluruh event terpicu, panel modul tersisip ke tab Hidup, `Mantara.errors` = 0.

---

## 3 · Pilar 1 — Bestia Terikat

**Bug yang ditemukan saat mengerjakan:** `PET_SPECIES` ternyata dideklarasikan `var` **di dalam
IIFE** modul living — jadi bukan global, dan tidak bisa dibaca modul mana pun dari luar. Itu
sebagian alasan kenapa sistem peliharaan selama ini terisolasi total. Sekarang diekspor lewat
`window.__mantaraLiving`.

### Tingkat membuka kemampuan, bukan sekadar mengalikan angka

| Tingkat | Tahap | Terbuka |
|---|---|---|
| 1 | Anakan | bonus stat pasif |
| 2 | Muda | **bisa ditunggangi** (menggantikan slot mount) |
| 3 | Dewasa | **ikut bertarung** di duel & bounty |
| 4 | Perkasa | **bisa terbang** (spesies bersayap) |
| 5 | Legenda | punya **gelar**, dan **diwariskan** ke ahli waris |

Metadata per spesies: umur maksimal, tingkat tunggang, tingkat terbang, dan `mountAs` — kunci
tunggangan yang diwakilinya, supaya syarat turnamen yang sudah ada bekerja **tanpa diubah**.

| Bestia | Umur | Tunggang | Terbang | Gelar |
|---|---|---|---|---|
| 🦄 Unicorn | 65 | lv2 | lv4 | Cahaya Rimba |
| 🦁 Gryphon | 70 | lv2 | lv4 | Raja Langit |
| 🐉 Naga Kecil | 210 | lv3 | lv4 | Sang Naga |
| 🔥 Phoenix | ∞ | lv3 | lv4 | Bara Abadi |
| 🐺 Serigala Dire | 15 | lv2 | — | Taring Utara |

### Yang membuatnya hidup

- **Menua dan mati.** Kucing Bulan ~16 tahun, Naga ~210 (jadi melewati tuannya).
  Kematian bestia Legenda dapat momen tersendiri, bukan baris log biasa.
- **Phoenix bangkit dari abunya** saat umurnya habis — ikatannya tidak pernah putus.
- **Bestia buas bisa jadi LIAR.** Ikatan di bawah 22 pada bestia tingkat 3+ → 30% ia berbalik
  menyerang lalu menghilang ke rimba. Kerugian nyata, bukan sekadar "pergi meninggalkanmu".
- **Diwariskan.** Bestia tingkat 4+ berumur panjang menunggu ahli warismu — dengan ikatan
  dipotong 25, karena ia belum mengenalmu. Ini menyambung langsung ke Kronik Wangsa nanti.
- **Latihan** (`bestiaTrain`) memakai 1 aksi + koin, menaikkan ikatan & pengalaman.
  Ini satu-satunya cara mempercepat; pertumbuhan alami sangat lambat.

### Duplikasi Griffon selesai

Griffon dulu ada di dua tempat — `mount` (1.900 keping, perk statis) dan `pet` (420 keping, bisa
naik tingkat). Sekarang gryphon peliharaan yang mencapai tingkat 2 **menjadi** tunggangan griffon
lewat `mountAs`. Satu makhluk, satu sistem.

---

## 4 · Pilar 2 — Langit

### 6 tunggangan terbang

| Tunggangan | Harga | Tingkat terbang |
|---|---|---|
| 🧹 Sapu Abu | 420 | 1 — melayang rendah |
| 🦅 Hipogrif | 1.100 | 2 — terbang mantap |
| 🧹 Sapu Badai | 1.400 | 2 |
| 🐲 Wyvern | 2.400 | 3 — menembus badai |
| 🦄 Unicorn | 2.600 | 1 |
| 🔥 Phoenix Dewasa | 3.800 | 3 |

**Sapu Abu sengaja 420 keping.** Griffon 1.900 berarti langit hanya milik pemain kaya. Dengan sapu
murah, anak petani pun bisa masuk cabang ini — itu yang membuatnya terasa adil, bukan konten eksklusif.

### 2 balapan udara

- 🌀 **Balap Cincin Langit** — 3 ronde, hadiah 180 / 420 / 900. Butuh tunggangan terbang apa pun.
- 🌩️ **Lari Badai Frostspire** — 3 ronde, hadiah 500 / 1.200 / 2.800. Hanya tingkat 3.

Keduanya memakai struktur `TOURNAMENTS` dan `reqMount` yang sudah ada — **nol perubahan** pada
sistem turnamen lama.

### Dimensi vertikal untuk yang sudah ada

- **Perjalanan lebih murah**: tingkat 3 → selalu 1 aksi; tingkat 2 → −1 aksi. Terukur: Aetheria→Frostspire 4 → 2 aksi.
- **Risiko jatuh** tiap tahun: 10% di tingkat 1, turun ke 2,5% di tingkat 3. Terbang murah ada harganya.
- **Kejadian khas udara**: kurir mendesak berbayar, fajar di atas awan, nama naik karena terlihat terbang.
- **Frostspire jadi kota langit** — memanen kristal mana langsung dari pusaran badai. Akhirnya
  Frostspire punya alasan didatangi selain "dingin dan menyakitkan".

---

## Verifikasi

| Uji | Hasil |
|---|---|
| Bundel identik dengan sumber | ✓ hash `ceed2e39d24f785a` cocok di container & mesinmu |
| Boot | 0 error |
| Event bus | semua event terpicu · `Mantara.errors` 0 |
| Bestia dilatih ke Legenda | lv5 · gelar "Raja Langit" · tunggang/terbang/tarung semua aktif |
| Menunggangi gryphon | `mountKey()` → `griffon` · terbang tingkat 2 · Balap Cincin terbuka |
| Sapu Abu | terbang tingkat 1 · Balap Cincin terbuka · Lari Badai **terkunci** (benar) |
| Panel tab Hidup | Bestia Terikat & Langit dua-duanya tampil |
| Regresi v24 | 129 event · 28 aging · 10 dilema · 12 nubuat · 30 tingkat musim — semua utuh |
| Log ganda / overlay tumpuk / handler mati | 0 / tidak ada / tidak ada |
| Save/load | identik · Ramalan bertahan |
| Build www | 37,5 MB — lolos gate 180 MB |

---

## Yang belum dikerjakan

Dari rencana v25, tiga pilar sisanya masih menunggu — dan sekarang jauh lebih murah dibuat karena
tinggal `Mantara.module(...)`:

1. **Jalan Langka** — 8 karir yang diundang, bukan dipilih (termasuk Penunggang Langit yang
   sekarang sudah punya fondasi tunggangan terbangnya).
2. **Balai Sekolah** — 4 balai berpoin.
3. **Bestiarium** — koleksi lintas nyawa.
4. **Kronik Wangsa** — muara semuanya. Bestia Legenda sudah menulis namanya ke
   `mantara_bestia_legends_v1`, tinggal ditampilkan.

Catatan jujur: modul `21-expansion` (58,9 KB), `22-arena` (49,2 KB), dan `25-school-life` (39,1 KB)
masih monolit kecil di dalam monolit. Belum perlu dipecah sekarang — tapi kalau salah satunya
disentuh untuk fitur baru, pecah dulu sebelum menambah.
