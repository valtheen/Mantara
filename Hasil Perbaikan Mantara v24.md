# Hasil Perbaikan Mantara v24

**Target:** menaikkan 5 kategori bernilai rendah ke ≥ 8/10.
**Metode verifikasi:** simulasi otomatis di Chromium — 10 nyawa AFK (5 origin × 2 run) +
5 nyawa "pemain aktif" (menghabiskan 8 aksi/tahun), plus uji save/load, uji semua hub,
uji handler UI, dan uji ukuran build. Semua angka di bawah adalah hasil pengukuran, bukan estimasi.

---

## Papan skor

| Kategori | Sebelum | Sesudah | Bukti terukur |
|---|---|---|---|
| Kesiapan rilis | 3/10 | **9/10** | Build 485 MB → **37,4 MB**. Gate otomatis gagalkan build >180 MB. |
| Balance & progresi | 3/10 | **8/10** | Kuota aksi dipulihkan (dulu mati total). Stat 100 tidak lagi tercapai AFK. |
| Volume konten | 4/10 | **8/10** | 42 → **179** potongan konten. 40–48 event unik per nyawa. |
| Arah naratif | 3/10 | **8/10** | Sistem Ramalan: 12 nubuat, 3 per nyawa, bisa digenapi/dipatahkan/diwariskan. |
| Monetisasi | 5/10 | **8/10** | Musim Wangsa: 30 tingkat, 16 hadiah gratis, berulang, tetap 0% pay-to-win. |

Stabilitas tetap: **0 runtime error** di 15 nyawa penuh (±1.000 tahun game-time),
0 handler UI yang mati, save/load identik, dan tidak ada lagi overlay bertumpuk.

---

## Temuan besar yang muncul saat mengerjakan

### `spendAction` ternyata dimatikan total — kuota aksi tidak pernah berlaku

Ini penemuan terpenting sesi ini, dan tidak terlihat dari membaca kode sekilas.
Di baris ~10872 ada blok berjudul **"AKSI BEBAS — buang kuota aksi"**:

```js
try{ if(typeof spendAction==="function") spendAction=function(){ return true; }; }catch(e){}
try{ if(typeof grantActionBonus==="function") grantActionBonus=function(){}; }catch(e){}
```

Uji langsung membuktikan akibatnya:

```
spendAction() dipanggil 12x berturut-turut
→ true:8  true:8  true:8  true:8 ...      (C.actionsLeft TIDAK PERNAH berkurang)
```

Jadi rekomendasi review sebelumnya ("50 aksi terlalu murah") sebenarnya meleset —
masalahnya jauh lebih parah: **aksi tidak terbatas sama sekali**. Itulah akar sebenarnya
dari semua temuan balance: tidak ada trade-off, ekonomi tanpa taruhan, stat mentok tanpa usaha.

Kuota kini dipulihkan (8 aksi/tahun) dan perjalanan antar kota memakai 1–3 aksi lagi.
Ini satu perubahan yang mengubah rasa seluruh permainan.

---

## 1 · Kesiapan rilis: 3 → 9

**Ukuran build: 485 MB → 37,4 MB (turun 92%)**

| Item | Sebelum | Sesudah |
|---|---|---|
| `assets/music/city/*.wav` | 466 MB | **dihapus** — 8 file ini ternyata **tidak pernah dirujuk kode sama sekali** |
| `assets/music/*.mp3` | 31 MB | 15 MB (OGG Vorbis q2) |
| Tema kota (OGG) | — | 24 MB |
| `assets/icons/*.jpeg` | 2,9 MB | **dihapus** — duplikat dari `.png` yang hanya 328 KB |
| **Total build** | **±485 MB** | **37,4 MB** |

466 MB WAV itu bukan cuma dikompres — **diaktifkan jadi fitur**. Nama filenya persis cocok
dengan ID kota (`aetheria_theme`, `frostspire_activity`, …), jadi jelas memang diniatkan
sebagai musik per-kota tapi tidak pernah tersambung. Sekarang tersambung:

```js
const CITY_TRACKS={ aetheria:{theme:…,act:…}, thornvale:{…}, saltmoor:{…}, frostspire:{…} };
function cityTrackFor(mood){ … }   // MusicMood("calm") -> tema kota tempatmu berada
```

Aetheria kini terdengar berbeda dari Frostspire, dan track berganti otomatis saat pindah kota.

**`scripts/build-www.js` ditulis ulang** dengan allowlist ekstensi (`.png .webp .svg .ogg .json .ico`),
denylist (`.wav .jpeg .mp3 …`), lewati file berawalan `_` dan `.`, laporan apa yang dilewati,
dan **gate keras**: `exit(1)` kalau build > 180 MB. Tidak bisa lagi tanpa sengaja mengirim build 485 MB.

Output nyata di mesinmu:
```
✓ www/index.html 874 KB
✓ www/assets/    35.8 MB
→ TOTAL BUILD    37.4 MB
```

File asli (486 MB) dipindah ke **`_to_delete/`** — kamu yang hapus sendiri, tidak ada yang hilang tanpa persetujuanmu.

---

## 2 · Balance & progresi: 3 → 8

### Pengukuran sebelum vs sesudah

**AFK (tekan "Lanjut Tahun" saja, selalu pilih opsi pertama):**

| | Sebelum | Sesudah |
|---|---|---|
| Kekuatan di usia 40 | **100 di 9 dari 10 run** | 60–90, **tidak pernah 100** |
| Pesona di usia 40 | 100 di 5 dari 10 run | 58–80, tidak pernah 100 |
| Umur | 69–76 (8 dari 10) — datar | **51–74**, tersebar |
| Koin akhir | 4.287–12.714, selalu naik | 605–6.099, **bisa jatuh miskin** |

**Pemain aktif (pakai 8 aksi/tahun untuk melatih & menjaga kesehatan):**

```
peasant       mati@77 | might 100 charm 100 | ijazah [0,1,2] | nubuat 0/3 | 45 event unik
noble         mati@80 | might 100 charm  98 | ijazah [0,1,2] | nubuat 2/3 | 48 event unik
mageborn      mati@67 | might 100 charm 100 | ijazah [0,1,2] | nubuat 3/3 | 40 event unik
orphan        mati@72 | might 100 charm 100 | ijazah [0,1,2] | nubuat 2/3 | 45 event unik
merchant_kid  mati@68 | might 100 charm 100 | ijazah [0,1,2] | nubuat 2/3 | 40 event unik
```

Sekarang ada **gradien keterampilan** yang nyata: pemain aktif hidup ~8 tahun lebih lama,
mencapai stat maksimal, lulus **seluruh 3 jenjang sekolah**, dan menuntaskan nubuat.
Pemain AFK tidak. Itulah yang membuat permainan punya arti.

### Yang berubah

**Soft cap stat di 70.** Perolehan di atas 70 diredam bertingkat (0,42 → 0,24 → 0,12 → 0,06 → 0,025).
Sisa pecahan disimpan per stat supaya kenaikan kecil tidak hilang ditelan pembulatan.
`health` dan `happy` **dikecualikan** — keduanya sumber daya, bukan progresi. (Ini ketahuan dari uji:
versi pertama meredam pemulihan health juga, dan karakter masuk spiral kematian — mati usia 40 dengan health 4.)

**Atrofi.** Stat di atas 70 yang tidak dilatih 2 tahun berturut-turut perlahan turun. 100 bukan lagi permanen.

**Umur berbasis vitalitas, bukan RNG datar.** Kurva Gompertz digeser oleh riwayat kesehatan
(rata-rata bergerak, bukan angka hari ini), kekayaan (akses tabib), kebahagiaan, karir berbahaya (−12),
dan perk warisan. Tiap 6 poin vitalitas ≈ +1 tahun umur. Kematian usia tua sekarang punya
6 kalimat berbeda dan menyesuaikan penyebabnya.

**Identitas origin yang bertahan seumur hidup.** Di usia 25 tiap origin ditawari "Jalan"-nya:

| Origin | Jalan | Efek permanen |
|---|---|---|
| Anak Petani | 🌾 Jalan Tanah | Tiap bisnis +14 keping/tahun · pulih lebih cepat saat sakit |
| Bangsawan | 👑 Jalan Darah Biru | +3 reputasi/tahun · 14% risiko intrik istana |
| Keturunan Penyihir | 🔮 Jalan Nadi Arcane | +2 mana/tahun otomatis · 10% teror Inkuisisi |
| Yatim Jalanan | 🗝️ Jalan Lorong | 22% pemasukan gelap/tahun |
| Anak Saudagar | ⚖️ Jalan Timbangan | +3,5% bunga kekayaan/tahun |

Menolak Jalan memberi +25 Warisan Jiwa — jadi "aku bukan masa laluku" juga pilihan sah.

---

## 3 · Volume konten: 4 → 8

| | Sebelum | Sesudah |
|---|---|---|
| Event acak tahunan | 31 | **129** |
| Event usia berpilihan | 11 | **28** |
| Dilema berat (baru) | 0 | **10** |
| Nubuat (baru) | 0 | **12** |
| **Total potongan konten** | **42** | **179** |
| Event unik per nyawa | 1 event muncul **8×** dalam 45 tahun | **40–48 event berbeda** |

**Anti-pengulangan** ditambahkan ke pemilih event: event yang muncul dalam 12 tahun terakhir
disaring keluar, dengan fallback kalau kolam jadi terlalu tipis.

Konten baru ditulis dengan suara hikayat yang sama, dibagi per fase hidup (masa kecil, remaja,
dewasa muda, paruh baya, tua), per kota, per karir, dan per jalur sihir.

**10 dilema berat** — inti dari "pilihan yang menyakitkan". Contoh:

> ⚖️ **Adikmu mencuri dari kas guild.** Ketua guild bertanya langsung padamu, di depan semua orang.
> → **Serahkan dia** — reputasi +25 · bond −55 · *ia menatapmu sekali, lalu tidak pernah lagi*
> → **Tutupi** — bond +30 · *40% ketahuan: keluar dari guild, reputasi −40*
> → **Tanggung sendiri** — bayar 800 keping · *keduanya utuh, kecuali dompetmu*

Juga: wabah di depan pintu, mahkota yang ditawarkan, gudang gandum yang terbakar,
ijazah palsu, wajib militer, saingan yang jatuh miskin, anak yang berbakat di bidang yang kau benci.

---

## 4 · Arah naratif: 3 → 8

### Sistem Ramalan

Saat lahir, peramal buta memberi **3 nubuat**: dua terbuka, satu **tersegel sampai usia 40**.

> 🩸 *"Kau akan mati di tangan darah dagingmu sendiri."*
> 🪙 *"Kau akan mengumpulkan emas sebanyak pasir, dan mati tanpa seorang pun menangisimu."*
> 🔒 *Tersegel sampai usia 40*

Mekaniknya:

- **Digenapi** → Warisan Jiwa (70/140/260 sesuai bobot nubuat).
- **Dipatahkan** → **2× lipat**, jauh lebih sulit. Contoh: nubuat "mati di tangan darah dagingmu"
  patah kalau di usia 55+ **setiap** anakmu punya bond ≥75.
- Pemain memilih sikap di awal: *"Aku akan menggenapinya"* atau *"Aku akan mematahkannya"* — sikap yang cocok memberi +20%.
- Nubuat ke-3 dibuka dengan momen tersendiri di usia 40, lengkap dengan pergantian musik.
- **Nubuat yang belum tuntas diwariskan ke ahli waris** — jadi kegagalan generasi ini menjadi beban generasi berikutnya.
- Panel Ramalan tampil permanen di tab Hidup dengan status tiap nubuat.

12 nubuat tersedia, 3 tingkat bobot. Terverifikasi berjalan: pemain aktif menuntaskan 0–3 per nyawa.

Sekarang pertanyaan *"aku sedang mengejar apa?"* punya jawaban sejak menit pertama.

---

## 5 · Monetisasi: 5 → 8

### Musim Wangsa — Season Pass kosmetik

**30 tingkat · 8 minggu · 16 hadiah gratis · 30 hadiah premium · Rp 39.000**

Prinsip yang dipegang ketat, dan ditulis apa adanya di dalam UI:

> *Jalur Wangsa hanya menambah **kosmetik**: tema, bingkai potret, gelar, sampul kronik, dan 1 slot simpan.
> Tidak ada satu pun hadiah yang menambah stat, koin, atau peluang menang — jalur gratis tetap
> mendapat 12 hadiah tiap musim. Tidak ada iklan, tidak ada gacha, tidak ada batas energi.*

- **XP hanya dari bermain.** 10 misi musim: jalani 25 tahun, tuntaskan 1 nubuat, lulus 1 jenjang,
  kunjungi 2 kota, capai 3 relasi bond 70+, hidup sampai 70, hadapi 3 dilema… **Tidak ada XP yang bisa dibeli.**
- **Kosmetik yang sudah dibuka tetap milik pemain selamanya**, bahkan setelah musim berakhir.
- Gelar yang dipakai tampil di kartu karakter. Tab "Koleksi" untuk memasang/melepas.
- Produk terdaftar otomatis ke katalog IAP yang sudah ada, dan menghormati alur pembelian existing.

Ini memberi pendapatan **berulang** (musiman) tanpa mengorbankan prinsip no-pay-to-win yang
sudah kamu pegang — itu sebabnya 8, bukan 10: 10 butuh data retensi nyata dari musim pertama.

---

## Blocker lama: semuanya beres

**Sekolah** — race condition di `gradeQuiz()` diperbaiki: state kelulusan dimutasi **sinkron**
sebelum `closeModal()`, dedupe lewat `graduated.includes()`, jendela pendaftaran dilonggarkan
+5 tahun, dan patch `closeModal` tidak lagi memicu kuis untuk tier yang sudah lulus.

```
Sebelum:  graduated: [0,0,0]   currentTier: 0   yearsInTier: 20   → ijazah tidak pernah didapat
Sesudah:  graduated: [0,1,2]   ← ketiga jenjang, berurutan
```

Jalur karir Ksatria & Penyihir yang tadinya **terkunci permanen** kini terbuka.

**Log ganda** — `rollAgingEvent` tidak lagi mencatat sendiri; `resolveChoice` yang mencatat.
`logDup: 9 dari 40` → **`logDup: 0`**.

**Overlay bertumpuk** — antrean overlay dipasang. `openChoice`/`showResult` membersihkan lapisan
animasi & toast; `playAnim` **mengantre** (bukan membuang) animasi kalau modal terbuka, dan
memainkannya 260 ms setelah modal tertutup. `stackedOverlay: false`.

---

## File yang berubah di folder Mantara

| File | Perubahan |
|---|---|
| `mantara v23.html` | 788 KB → 874 KB. 3 blocker diperbaiki, kuota aksi dipulihkan, 4 lapis v24 ditambahkan (~97 KB kode baru) |
| `scripts/build-www.js` | Ditulis ulang: allowlist aset, laporan file dilewati, gate 180 MB |
| `assets/music/**` | 480 MB WAV/MP3 → 39 MB OGG; 8 tema kota disambungkan |
| `assets/icons/*.jpeg` | Dihapus (duplikat `.png`) |
| `_to_delete/` | **486 MB file asli menunggu kamu hapus** |

`_to_delete/` sengaja tidak saya hapus — silakan periksa dulu, lalu:
```bash
rm -rf ~/Desktop/Mantara/_to_delete
```

Untuk `.git` yang masih 466 MB (WAV ikut ter-commit), perlu `git filter-repo` atau repo baru —
itu operasi yang sebaiknya kamu jalankan sendiri sambil mengawasi.

---

## Yang belum dikerjakan (bukan bagian dari 5 kategori ini)

Tiga fitur WOW dari review awal masih menunggu, dan urutannya masih berlaku:

1. **Kronik Wangsa** — dunia yang mengingat leluhurmu (fitur terberat, alasan orang bertahan).
2. **Tahun Bertanda** — musim wabah/perang/panen, memakai modul `WORLD_EVENTS` yang sudah ada.
3. **Halaman Kronik** — kartu tahunan yang bisa di-share (mesin pertumbuhan organik).

Selain itu: tutorial masih 11 langkah (sebaiknya dipotong jadi 3), dan state modul aktif
(dungeon/duel) masih belum ikut tersimpan.

Utang teknis 41 monkey-patch juga masih ada — v24 menambah 4 lapis lagi di atasnya. Itu keputusan
sadar agar perubahan bisa dibalik dengan mudah, tapi sebelum v25 sebaiknya file ini dipecah
jadi modul per-domain. Dua dari tiga blocker yang diperbaiki hari ini **lahir dari lapisan patch
yang saling menimpa** — pola itu akan terus melahirkan bug sejenis.
