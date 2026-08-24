# Review Mantara v23 — Hikayat Dunia Sihir

**Metode review:** file `mantara v23.html` (13.935 baris, 792 KB) dijalankan otomatis di Chromium.
Total **10 nyawa penuh disimulasikan** (5 origin × 2 run, lahir sampai mati), plus uji save/load,
uji semua hub, uji handler UI, dan profil performa. Temuan di bawah semuanya berbasis bukti eksekusi,
bukan pembacaan kode saja.

---

## Verdict singkat

**Fondasinya layak. Rilisnya belum.**

Ini bukan prototipe — ini game yang sudah punya kedalaman sistem di atas rata-rata game indie Indonesia.
Tapi ada **3 blocker keras** yang bikin build sekarang tidak bisa masuk App Store / Play Store, dan
**1 bug yang mematikan seluruh jalur progresi utama**. Semuanya bisa diperbaiki dalam hitungan hari, bukan bulan.

| Aspek | Nilai | Catatan |
|---|---|---|
| Stabilitas teknis | 9/10 | 10 nyawa penuh, **0 runtime error**. Ini luar biasa untuk 14k baris. |
| Performa | 9/10 | Boot 190 ms, `renderAll` 0,23 ms, heap 10 MB, 241 DOM node. Sangat ringan. |
| Kedalaman sistem | 8/10 | Sekolah, karir, bisnis, properti, guild, dungeon, duel taktis, romansa, politik, pasar, dinasti. |
| Kesiapan rilis | 3/10 | Build ±485 MB. Ditolak store. |
| Balance & progresi | 3/10 | Stat mentok 100 di usia 40 **tanpa main sama sekali**. |
| Volume konten | 4/10 | 31 event acak + 11 event usia. Habis dalam 2–3 nyawa. |
| Arah naratif | 3/10 | Tidak ada tujuan. Pemain tidak tahu sedang mengejar apa. |
| Monetisasi | 5/10 | Jujur (kosmetik murni, no pay-to-win) tapi tidak berulang. |

---

## Bagian 1 — Yang sudah bagus dan patut dipertahankan

**1. Kualitas rekayasanya diam-diam sangat tinggi.**
10 nyawa penuh dijalankan otomatis, sekitar 700 tahun game-time. Nol `pageerror`, nol exception.
Semua 146 handler `onclick` yang dirender ter-resolve ke fungsi yang ada — **tidak ada satu pun tombol mati**.
Save/load round-trip identik byte-for-byte. Untuk file 14 ribu baris dengan 57 modul IIFE dan 41 monkey-patch,
ini hasil yang jarang.

**2. Performa mobile sudah aman.**
190 ms sampai layar pertama, `renderAll()` rata-rata 0,23 ms. Tidak akan ada keluhan lag,
bahkan di Android kelas bawah. Arsitektur "innerHTML + rerender penuh" yang biasanya lambat,
di sini masih murah karena DOM-nya kecil (241 node).

**3. Ambisi dunianya jauh melampaui BitLife.**
BitLife itu daftar teks. Mantara punya 4 kota dengan efek lingkungan berbeda, penguasa yang mati
dan digantikan sendiri, berita kerajaan yang jalan sendiri, pasar dengan harga fluktuatif,
dungeon, duel taktis berbasis giliran, dan meta-progresi dinasti dengan 11 perk + ascension.
**Ini bahan mentah untuk sesuatu yang jauh lebih baik dari BitLife**, bukan tiruan.

**4. Rasa lokal + fantasi kerja.**
Bahasa Indonesia sastrawi ("Kau tiba di...", "Wangsa Aurelius", "keping") membangun nuansa hikayat
yang tidak dimiliki game manapun di genre ini. Palet ungu-emas, kartu stat, dan tipografi serif-nya
sudah terlihat mahal. Ini aset pembeda yang nyata.

**5. Monetisasi yang jujur.**
Semua IAP kosmetik atau QoL. Tidak ada pay-to-win, tidak ada gacha, tidak ada energy timer.
Ini keputusan yang layak dihormati — dan layak dipertahankan.

---

## Bagian 2 — Blocker rilis (wajib beres sebelum submit)

### BLOCKER 1 — Ukuran build ±485 MB. Store akan menolak.

```
assets/music/        480 MB   ← 8 file WAV @ 58 MB masing-masing
assets/icons/*.jpeg  2,9 MB   ← duplikat dari .png yang cuma 328 KB total
.git/                466 MB   ← WAV ikut ter-commit
```

`scripts/build-www.js` baris `cpDir(ASSETS_SRC, ASSETS_DST)` menyalin **seluruh** folder assets
apa adanya ke `www/` — termasuk `_test.wav` (5 MB) dan file kosong `_wtest`.

**Dampak:** APK/AAB dan IPA jadi ±485 MB. Play Store batas AAB 200 MB. App Store bakal
menolak download seluler. Ini bukan optimasi, ini syarat rilis.

**Perbaikan (±1 jam, dampak 99%):**
```bash
# 58 MB WAV → ~3 MB OGG, kualitas tidak terdengar bedanya di speaker HP
for f in assets/music/city/*.wav; do
  ffmpeg -i "$f" -c:a libvorbis -q:a 4 -ar 44100 "${f%.wav}.ogg" && rm "$f"
done
rm -f assets/music/city/_test.wav assets/music/_wtest
rm -f assets/icons/*.jpeg
```
Lalu tambahkan filter di `build-www.js` agar `cpDir` melewati `.wav`, `.jpeg`, dan file berawalan `_`.
Estimasi hasil akhir: **±30 MB.** Untuk `.git`, jalankan `git filter-repo` atau mulai repo bersih.

---

### BLOCKER 2 — Sistem sekolah rusak. Seluruh jalur karir tinggi terkunci permanen.

Ini temuan paling serius. Hasil simulasi karakter bangsawan sampai usia 26:

```json
"school": {
  "currentTier": 0,
  "graduated": [0, 0, 0],     ← tier 0 lulus TIGA KALI, tier 1 & 2 tidak pernah
  "yearsInTier": 20,          ← 20 tahun di TK
  "enrolled": false
}
```

Karakter usia 26 masih tercatat lulus **"Taman Kanak Ningrat (Jenjang Dasar)"** berulang kali.
Di layar Hidup tertulis **"Lulus 7 jenjang"** padahal cuma ada 3 jenjang.
Log tahunan tenggelam oleh 6 baris "Kau LULUS..." identik di usia yang sama.

**Akar masalah** — race condition di `gradeQuiz()` (baris 3269):
```js
closeModal();                              // ← memicu patch closeModal (baris 3363)
...                                        //    yang memanggil startQuiz() lagi
setTimeout(()=>{
  s.graduated.push(s.currentTier);         // ← baru dieksekusi 800 ms kemudian
  s.enrolled=false;
}, 800);
```
`closeModal()` yang di-patch di baris 3363 langsung memicu kuis berikutnya, sementara
`graduated.push()` masih menunggu 800 ms. Jadi beberapa kelulusan untuk tier yang sama
resolve sebelum `graduated` sempat terisi. `push()` juga tanpa dedupe.

**Konsekuensi berantai:** karena tier 0 baru benar-benar selesai lewat usia 10+,
jendela usia tier 1 (9–13) dan tier 2 (12–17) sudah lewat → `flags.diploma_*` tidak pernah di-set →
**karir Ksatria dan Penyihir terkunci selamanya**. Cabang progresi terbesar di game ini mati.

**Perbaikan:**
```js
// 1. set state SINKRON, sebelum closeModal
if(C.age>=lv.gradAge && !s.graduated.includes(s.currentTier)){
  s.graduated.push(s.currentTier);
  s.enrolled=false;
}
closeModal();
// 2. tambah guard di patch closeModal: jangan startQuiz kalau s.enrolled false
// 3. longgarkan jendela: `C.age < lv.gradAge + 4` agar telat setahun tidak fatal
```

---

### BLOCKER 3 — Setiap event pilihan tercatat dua kali di log.

Dari 40 entri log, **9 adalah duplikat persis** (22%). Stack trace membuktikan sumbernya:

`rollAgingEvent()` baris 3676 membungkus tiap pilihan, memanggil `log()` sendiri,
lalu **tetap me-return `res`** — dan `resolveChoice()` baris 1686 mencatat `res.t` lagi.

```js
// baris 3676 — rollAgingEvent
const res=ch.run();
if(res&&res.t){ log(C.age,res.t,res.cls); }   // ← log #1
return res;                                    // ← diteruskan ke resolveChoice

// baris 1686 — resolveChoice
if(res.t) log(C.age,res.t,res.cls);            // ← log #2
```

**Perbaikan satu baris:** di `rollAgingEvent`, ganti `return res;` menjadi
`return res ? {...res, t:null} : res;` — biarkan `resolveChoice` yang mencatat, atau
hapus `log()` internal di 3676. Pilih satu, jangan dua.

---

### Bug tambahan (bukan blocker, tapi kelihatan)

**Overlay bertumpuk.** Screenshot uji menunjukkan animasi "LULUS!" menutupi modal kuis yang
masih aktif, sekaligus toast muncul di bawahnya — tiga lapis UI bersamaan, teks soal tidak terbaca.
Tidak ada manajer antrean overlay. Perlu satu `overlayQueue` sederhana: modal, animasi, dan toast
antre, tidak tumpuk.

**State modul tidak ikut tersimpan.** `saveGameMulti` hanya menserialisasi objek `C`.
State closure seperti `BTL` (duel), `DR` (dungeon run), dan `MP.stack` (page stack) tidak ikut.
Kalau app di-kill Android di tengah dungeon, run-nya hilang tanpa jejak. Simpan state aktif ke `C._active`.

---

## Bagian 3 — Masalah desain (kenapa game ini belum "nagih")

Ini bagian yang lebih penting daripada bug, karena bug bisa diperbaiki sore ini.

### Temuan simulasi: **AFK play mengalahkan permainan aktif**

10 nyawa disimulasikan **tanpa menghabiskan satu aksi pun** — cuma tekan "Lanjut Tahun" dan
pilih opsi pertama tiap modal. Hasilnya:

| Origin | Mati usia | Stat usia 40 | Koin akhir |
|---|---|---|---|
| Anak Petani | 70 | might **100**, charm 62 | 8.239 |
| Bangsawan | 69 | might **100**, charm **100** | 8.822 |
| Keturunan Penyihir | 84 | might **100**, charm 62 | 11.244 |
| Yatim Jalanan | 75 | might **100**, charm **100** | 12.714 |
| Anak Saudagar | 69 | might **100**, charm 81 | 5.182 |

**Empat kesimpulan yang menyakitkan:**

**a. Stat mentok 100 di usia 40 tanpa usaha.** Kekuatan mencapai cap di **9 dari 10 run**.
Artinya separuh kedua setiap nyawa (usia 40–75, sekitar 35 tahun) **tidak punya progresi sama sekali**.
Pemain menekan tombol tanpa angka yang bergerak. Ini penyebab utama kenapa game terasa hambar di late-game.

**b. Origin tidak berarti apa-apa setelah usia 30.** Anak Petani dan Bangsawan berakhir hampir identik.
Padahal pilihan origin adalah keputusan pertama dan paling terasa penting bagi pemain. Sekarang cuma kosmetik.

**c. Umur terlalu bisa ditebak.** 8 dari 10 mati di rentang 69–76. Tidak ada ketegangan.
Tidak ada rasa "aku harus hati-hati tahun ini."

**d. Ekonomi tidak pernah menekan.** Koin selalu naik, tidak pernah ada krisis, tidak pernah
ada keputusan "beli ini atau itu". Uang jadi angka hiasan.

### 50 aksi per tahun terlalu murah

`ACTIONS_PER_YEAR = 50`. Dengan 50 aksi, pemain bisa melakukan **semuanya** setiap tahun —
tidak ada trade-off, tidak ada penyesalan, tidak ada strategi. Aksi seharusnya langka.
**Rekomendasi: turunkan ke 6–10 per tahun** dan buat setiap aksi terasa berbobot.
Ini satu perubahan angka yang mengubah seluruh rasa permainan.

### Konten habis dalam 2–3 nyawa

31 event acak + 11 event usia + 7 misi + 7 quest harian + 12 soal kuis.
Dalam simulasi, satu event ("Ekspedisi berbahaya") muncul **8 kali dalam 45 tahun** —
sekitar 10% dari seluruh log hidup. Sebagai pembanding kasar, game sejenis punya ratusan event.
**Target realistis: 150–200 event** sebelum rilis. Ini pekerjaan menulis, bukan koding —
dan ini bagian yang paling menentukan retensi.

### Tidak ada tujuan

Setelah 700 tahun game-time yang disimulasikan, pertanyaan yang tidak pernah terjawab:
**"aku sedang mengejar apa?"** Tidak ada goal jangka panjang, tidak ada antagonis,
tidak ada ending yang bisa dituju. Pemain hanya menonton angka naik lalu mati.

### Tutorial 11 langkah di menit pertama

Onboarding-nya 11 langkah sebelum pemain sempat menyentuh apapun. Ini titik drop-off terbesar
di game mobile. **Potong jadi 3 langkah**, sisanya munculkan kontekstual saat fitur pertama kali dibuka.

### Utang teknis: 41 monkey-patch berlapis

Pola `const _v5X = X; X = function(){...}` dipakai 41 kali, dengan 57 modul IIFE.
`advanceYear` saja dibungkus minimal 4 lapis. Ini sumber langsung dari Blocker 2 dan 3 —
dua bug itu **lahir dari lapisan patch yang saling menimpa**. Selama pola ini dipakai,
setiap fitur baru akan menambah bug seperti ini. Sebelum v24, pertimbangkan memecah file
jadi modul per-domain dengan event bus, bukan menimpa fungsi global.

---

## Bagian 4 — Fitur "SANGAT WOW" yang saya rekomendasikan

Prinsip yang saya pakai: **Mantara tidak butuh sistem baru.** Sudah ada 57 modul.
Yang dibutuhkan adalah membuat sistem yang sudah ada **saling berbicara** dan
**menghasilkan cerita yang layak diceritakan ulang**. Semua ide di bawah memakai kode yang sudah ada.

---

### ⭐ WOW #1 — KRONIK WANGSA: dunia yang mengingat leluhurmu

**Ini pembeda terbesar dari BitLife, dan BitLife tidak bisa menirunya.**

Sekarang, mati = reset + poin perk. Dunia lupa. Padahal Mantara **sudah punya** `C.kingdom`,
`C.rulers`, `kAddNews()`, dan sistem properti/bisnis. Tinggal dipersistenkan lintas generasi.

Yang berubah:

- **Bangunanmu tetap berdiri.** Kedai yang kau bangun sebagai kakek masih ada saat kau main
  sebagai cucu — dengan nama keluargamu di papannya, kondisi bangunan sudah lapuk, dan pemilik
  baru yang bisa kau rebut kembali.
- **Musuhmu punya keturunan.** Rival yang kau bunuh di nyawa lalu meninggalkan anak yang
  memburu ahli warismu. Sistem `spawnRival()` sudah ada — tinggal diberi memori.
- **Hukummu masih berlaku.** Kalau kau jadi Raja dan menaikkan pajak, cucumu lahir di kota
  yang miskin karena kebijakan kakeknya. Sistem `applyReign()` sudah ada.
- **NPC menyebut namamu.** "Kau Ashford? Kakekmu yang bakar Thornvale itu?"
  Reputasi keluarga jadi stat tersendiri: dicintai, ditakuti, atau dilupakan.
- **Silsilah visual** yang bisa di-screenshot dan dibagikan — 5 generasi dengan judul tiap orang
  ("Nyssa Ashford, Ratu Pengkhianat, 1024–1071").

**Kenapa WOW:** setiap kematian jadi *investasi*, bukan reset. Ini alasan orang main nyawa ke-20.
Dan ini secara fundamental tidak bisa dilakukan BitLife karena dunianya tidak punya state.

---

### ⭐ WOW #2 — RAMALAN: tiga nubuat tersegel saat lahir

Ini jawaban langsung untuk masalah **"tidak ada tujuan"**, dan implementasinya murah.

Saat lahir, seorang peramal buta memberi **3 nubuat tersegel**:

> 🕯️ *"Kau akan mati di tangan darah dagingmu sendiri."*
> 🕯️ *"Mahkota akan jatuh ke pangkuanmu sebelum usia empat puluh."*
> 🕯️ *"Kota tempatmu lahir akan terbakar, dan kau yang menyalakan apinya."*

Mekaniknya:
- Nubuat bisa **digenapi** (bonus Warisan Jiwa besar) atau **dipatahkan** (bonus lebih besar lagi, jauh lebih sulit).
- Nubuat ke-3 tetap **tersembunyi** sampai usia 40 — pemain main dengan rasa was-was.
- Kalau kau punya anak dan nubuat bilang "darah dagingmu", tiba-tiba setiap interaksi
  dengan anakmu jadi menegangkan. Sistem relasi yang sudah ada langsung dapat bobot dramatis.
- Nubuat yang gagal digenapi diwariskan ke ahli waris — "nubuat yang belum tuntas".

**Kenapa WOW:** mengubah game dari "lihat apa yang terjadi" jadi "aku punya misi rahasia".
Biaya implementasi: satu array nubuat + pengecekan kondisi di `advanceYear`. Mungkin 200 baris.
Dampak naratifnya besar sekali dibanding biayanya.

---

### ⭐ WOW #3 — TAHUN BERTANDA: musim, wabah, dan perang

Ini memperbaiki temuan **"setiap tahun terasa sama"** dengan modul yang sudah ada (`WORLD_EVENTS`, `tickMarket`).

Setiap tahun punya **karakter**, diumumkan di awal tahun dengan kartu penuh layar:

| Tahun | Efek |
|---|---|
| 🦠 **Tahun Wabah** | Nyawa terkuras tiap tahun · harga tabib naik 4× · Tabib jadi karir emas · relasi bisa mati |
| ⚔️ **Tahun Perang** | Karir Ksatria gaji 3× · wajib militer · bisnis rugi · properti bisa hangus |
| 🌾 **Tahun Panen Raya** | Ladang & ternak untung besar · harga pangan jatuh · pesta di semua kota |
| ❄️ **Musim Dingin Panjang** | Frostspire hampir mematikan · perjalanan +2 aksi · bahan bakar mahal |
| 👑 **Tahun Suksesi** | Raja mangkat · intrik istana · peluang naik takhta terbuka lebar |
| 🌑 **Tahun Gerhana** | Mana melonjak · Inkuisisi memburu penyihir · dungeon memberi loot langka |

**Kenapa WOW:** pemain mulai **merencanakan**. "Simpan uang, tahun wabah biasanya datang tiap 8 tahun."
Ini yang membuat ekonomi punya arti. Dan tiap nyawa jadi punya tekstur berbeda —
"nyawa itu aku lahir tepat sebelum perang" jadi cerita yang layak diceritakan.

---

### ⭐ WOW #4 — HALAMAN KRONIK: satu tahun, satu gambar yang bisa dibagikan

Sekarang, satu tahun = satu baris teks di log yang panjang dan (karena Blocker 3) sering dobel.

Ganti dengan **kartu kronik** di akhir tiap tahun — ilustrasi terstilasi berisi
1–2 momen penentu, delta stat, dan satu kalimat naratif. Bisa disimpan sebagai gambar.

> **TAHUN KE-34 · Musim Gugur Berdarah**
> *"Kau menolak menyerahkan adikmu pada Inkuisisi. Malam itu Thornvale membakar rumahmu."*
> 💔 Bahagia −18 · ⭐ Reputasi +22 · 🏠 Kehilangan Rumah Keluarga
> `#Mantara #WangsaAshford`

**Kenapa WOW:** BitLife tumbuh besar karena screenshot. Ini mesin pertumbuhan organik,
bukan sekadar fitur. Satu kartu bagus yang viral di TikTok bernilai lebih dari
sebulan iklan berbayar. Dan biaya implementasinya cuma render canvas + tombol share —
data naratifnya sudah ada di `C._log`.

---

### ⭐ WOW #5 — PUSAKA: benda yang hidup lebih lama darimu

Sistem gear (`enhanceGear`, `reforgeGear`) sudah ada, tapi barangnya anonim.

Beri **memori** pada satu benda per generasi:

> **⚔️ Pedang Ashford** — *Pusaka Wangsa, ditempa 3 generasi lalu*
> · Ditempa oleh Bram Ashford (1002)
> · Membunuh Adipati Theron Wyndhollow (1041)
> · Patah dan ditempa ulang di Frostspire (1067)
> · **+14 Kekuatan · Musuh dengan darah Wyndhollow gentar melihatnya**

Bonusnya bertambah tiap generasi, tapi **bisa hilang selamanya** — dicuri, digadaikan saat
kau miskin, atau dikubur bersama ahli waris yang mati muda. Kehilangan pusaka 5 generasi
adalah tragedi yang akan diingat pemain.

**Kenapa WOW:** menciptakan keterikatan emosional pada objek. Kombinasi dengan WOW #1
membuat pemain punya sesuatu yang benar-benar miliknya.

---

### ⭐ WOW #6 — PILIHAN YANG MENYAKITKAN

Temuan simulasi: bot yang **selalu memilih opsi pertama** hidup sampai 75 tahun dengan stat maksimal.
Artinya pilihan di game ini tidak punya konsekuensi nyata.

Tambahkan kelas event **Dilema** — tidak ada jawaban benar, keduanya sakit, keduanya diingat:

> ⚖️ **Adikmu mencuri dari kas guild.**
> Ketua guild bertanya langsung padamu, di depan semua orang.
> → **Serahkan dia** — Reputasi +25, Guild naik pangkat · *adikmu dipenjara, bond −60, dia tidak akan memaafkanmu*
> → **Tutupi** — bond +30 · *risiko 40% ketahuan: keluar dari guild, reputasi −40, akses bounty hilang*
> → **Tanggung sendiri** — bayar 800 keping dari kantongmu · *kau jatuh miskin, tapi keduanya utuh*

Setiap dilema mengunci **trait permanen** (sistem `TRAITS` sudah ada, baru 8 trait) yang
mengubah cara NPC memperlakukanmu seumur hidup — dan, dengan WOW #1, cara mereka memperlakukan cucumu.

**Kenapa WOW:** ini yang bikin pemain berhenti, mikir, lalu cerita ke temannya.
Momen "aku menyerahkan adikku sendiri" jauh lebih kuat daripada "aku dapat +5 kekuatan".

---

### Ide pendukung (lebih kecil, tetap kuat)

- **Reputasi berlapis per kota.** Sekarang reputasi satu angka global. Pecah jadi per-kota:
  bisa jadi santo di Aetheria dan buronan di Saltmoor. Ini akhirnya membuat 4 kota punya arti
  strategis — sekarang travel cuma biaya aksi tanpa keputusan.
- **Mode Legenda (ironman).** Satu nyawa, tanpa save-scum, skor masuk papan peringkat mingguan.
- **Museum Wangsa.** Galeri semua leluhur, pusaka, dan nubuat yang pernah digenapi. Ini yang
  membuat progres 50 jam terasa nyata.
- **Kematian yang bermakna.** Sekarang 8 dari 10 mati usia 69–76 karena penuaan generik.
  Kematian seharusnya jadi klimaks: mati di duel, mati diracun rival, mati saat wabah
  karena menolak minggat — bukan sekadar "usia tua menjemputmu".

---

## Bagian 5 — Urutan pengerjaan yang saya sarankan

**Sprint 1 — Perbaikan wajib (2–3 hari)**
1. Kompres WAV → OGG, hapus JPEG duplikat, filter `build-www.js`. *(485 MB → ±30 MB)*
2. Perbaiki race condition sekolah + dedupe `graduated`. *(buka kembali jalur karir tinggi)*
3. Perbaiki double-log di `rollAgingEvent`.
4. Antrean overlay agar modal/animasi/toast tidak tumpuk.

**Sprint 2 — Balance (3–5 hari)**
5. `ACTIONS_PER_YEAR`: 50 → 8.
6. Kurva stat: soft-cap di 70, tiap poin di atas itu butuh biaya eksponensial.
7. Origin harus tetap terasa di usia 40+ (kunci beberapa jalur, buka yang lain).
8. Umur harus bervariasi berdasarkan pilihan hidup, bukan RNG datar.

**Sprint 3 — Arah naratif (1–2 minggu)**
9. **WOW #2 Ramalan** — paling murah, dampak paling besar. Kerjakan ini dulu.
10. **WOW #3 Tahun Bertanda** — pakai modul `WORLD_EVENTS` yang sudah ada.
11. **WOW #6 Dilema** — mulai dari 15 dilema berkualitas.

**Sprint 4 — Retensi & pertumbuhan (2–3 minggu)**
12. **WOW #1 Kronik Wangsa** — fitur terberat, tapi ini alasan orang bertahan.
13. **WOW #4 Halaman Kronik + share** — mesin pertumbuhan organik.
14. **WOW #5 Pusaka**.
15. Tulis konten sampai **150+ event**. Ini yang paling menentukan, dan paling sering ditunda.

**Sebelum submit**
16. Potong tutorial 11 → 3 langkah.
17. Simpan state modul aktif (dungeon/duel) ke `C`.
18. Uji di device Android low-end asli.

---

## Penutup

Yang paling mengesankan dari Mantara bukan jumlah fiturnya — tapi bahwa 14 ribu baris kode
dengan 57 modul dan 41 lapis patch bisa berjalan **700 tahun game-time tanpa satu pun error**.
Itu menunjukkan ketelitian yang serius.

Masalahnya sekarang bukan "kurang fitur". Justru sebaliknya: ada begitu banyak sistem yang
masing-masing berjalan sendiri tanpa saling berbicara, sehingga tidak ada satu pun yang terasa penting.
Game ini butuh **arah**, bukan tambahan.

Kalau harus memilih **satu** hal untuk dikerjakan setelah tiga blocker beres:
**buat Ramalan (WOW #2).** Murah, cepat, dan langsung menjawab pertanyaan yang selama ini
menggantung — *"aku sedang mengejar apa?"*

Setelah pemain punya jawaban untuk itu, semua sistem lain di game ini tiba-tiba jadi bermakna.
