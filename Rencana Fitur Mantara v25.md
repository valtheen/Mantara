# Rencana Fitur Mantara v25 — Bestia, Langit, dan Karir Langka

Ditulis setelah menelusuri isi `GEAR_CATALOG`, `PET_SPECIES`, `TOURNAMENTS`, `CAREERS`, dan `ORDOS`
di build v24. Semua angka dan nama sistem di bawah mengacu ke kode yang benar-benar ada.

---

## Jawaban singkat untuk pertanyaanmu

**Ya, dan dugaanmu lebih tepat dari yang kamu kira.** Unicorn, gryphon, dan phoenix **sudah ada di
dalam game** — tapi hanya sebagai *peliharaan pasif*. Kamu tidak bisa menungganginya, tidak bisa
membalapnya, dan tidak ada satu pun karir yang menyentuhnya.

Ini pola yang sama persis dengan 466 MB file WAV kemarin: **aset yang ada tapi tidak tersambung ke mekanik apa pun.**

---

## Masalah sebenarnya: tiga sistem yang tidak saling bicara

| Sistem | Isi | Masalah |
|---|---|---|
| `PET_SPECIES` | 10 bestia — termasuk 🦄 Unicorn, 🦁 Gryphon, 🔥 Phoenix, 🐉 Naga Kecil | Cuma bonus stat pasif + biaya rawat. **Tidak bisa ditunggangi.** |
| `GEAR_CATALOG.mount` | Keledai, Kuda, Kuda Perang, **Griffon** | Perk statis. **Tidak bisa diikat, tidak tumbuh, tidak punya nama.** |
| `TOURNAMENTS` | 4 turnamen — semuanya **di darat** | Balap Kuda & Chariot butuh `reqMount`, tapi tidak ada satu pun lomba udara. |

Perhatikan yang paling aneh: **Griffon ada di dua tempat sekaligus.**
Sebagai `mount` (harga 1.900, perk statis) dan sebagai `pet` (harga 420, bisa naik level 1→5).
Makhluk yang sama, dua sistem terpisah, tidak ada hubungannya.

Dan `PET_SPECIES.drakeling` dideskripsikan *"tumbuh menakutkan seiring waktu"* — itu **benar
diimplementasi** (naik level tiap 3 tahun kalau bond ≥55), tapi pemain tidak pernah melihat
dampaknya karena naga level 5 pun tetap tidak bisa ditunggangi, tidak bisa bertarung sendiri,
dan mati bersama karaktermu tanpa jejak.

**Jadi bukan "tambah fitur baru". Yang dibutuhkan: sambungkan yang sudah ada, lalu bangun di atasnya.**

---

# PILAR 1 — BESTIA TERIKAT
### Gabungkan pet + mount jadi satu makhluk yang benar-benar milikmu

Satu bestia bisa jadi **peliharaan, tunggangan, dan rekan tarung** sekaligus. Hapus duplikasi Griffon.

**Yang berubah:**

- Tiap bestia punya **nama, umur, bond, kondisi, dan level 1–5** (sistem ini sudah ada — tinggal dipakai).
- Level menentukan **apa yang bisa dilakukan**, bukan cuma angka stat:

| Level | Nama tahap | Terbuka |
|---|---|---|
| 1 | Anakan | bonus stat pasif |
| 2 | Muda | bisa ditunggangi di darat (gantikan slot `mount`) |
| 3 | Dewasa | ikut bertarung di duel & dungeon (`petsTotalCombat` sudah ada) |
| 4 | Perkasa | **bisa terbang** (kalau spesiesnya bersayap) → buka Balap Langit |
| 5 | Legenda | punya gelar sendiri, muncul di Kronik Wangsa, **bisa diwariskan** |

- **Bestia menua dan mati.** Kucing Bulan hidup ~15 tahun, Naga ~200 (jadi diwariskan ke cucumu).
  Kematian bestia yang sudah level 5 harus jadi momen — bukan baris log biasa.
- **Bestia legenda diwariskan.** Naga kakekmu masih hidup saat kau lahir, sudah level 5,
  dan mengenali darahmu. Ini menyambung langsung ke **Kronik Wangsa**.
- **Ikatan bisa gagal.** Bestia arcane (naga, phoenix) yang bond-nya jatuh di bawah 25 bisa **liar**
  dan menyerang — kerugian besar, bukan sekadar "pergi meninggalkanmu".

**Kenapa ini duluan:** biaya implementasinya paling kecil (sistem level, bond, cond sudah jalan),
tapi langsung menghidupkan 10 bestia + 5 mount yang sekarang mati suri.

---

# PILAR 2 — LANGIT
### Tunggangan terbang, sapu, dan Balap Cincin

Ini usulanmu, dan Mantara sudah setengah jalan ke sana tanpa sadar: `TOURNAMENTS` sudah punya
sistem ronde bertingkat + `reqMount`. Tinggal ditambah dimensi vertikal.

### 2a. Tunggangan terbang

```js
// tambahan ke GEAR_CATALOG.mount — tier "langit"
{key:"broom_ash",  name:"Sapu Abu",        price:420,  fly:1, perk:{mana:2,charm:1},
 desc:"Sapu kayu abu buatan tukang desa. Goyah, tapi terbang."},
{key:"broom_storm",name:"Sapu Badai",      price:1400, fly:2, perk:{mana:4,charm:2,mind:1},
 desc:"Ditempa di Frostspire. Menembus badai tanpa oleng.", arcane:true},
{key:"hippogriff", name:"Hipogrif",        price:1100, fly:2, perk:{charm:3,might:2}},
{key:"wyvern",     name:"Wyvern",          price:2400, fly:3, perk:{might:6,reputation:2}},
{key:"phoenix_mnt",name:"Phoenix Dewasa",  price:3800, fly:3, perk:{mana:7,health:3}, arcane:true},
{key:"unicorn_mnt",name:"Unicorn",         price:2600, fly:1, perk:{charm:6,mana:3,happy:2}},
```

Poin desain penting: **sapu terbang harus jadi jalur murah**. Griffon 1.900 keping itu mustahil
untuk anak petani. Sapu Abu 420 keping membuat langit terbuka untuk semua origin — dan itu yang
membuat cabang ini terasa adil, bukan konten khusus orang kaya.

### 2b. Balap Cincin Langit

```js
{id:"skyring", ico:"🌀", name:"Balap Cincin Langit", stat:"charm", altStat:"mana",
 entry:80, anim:"race", reqFly:1,
 rounds:[{diff:45,prize:180},{diff:65,prize:420},{diff:85,prize:900}],
 desc:"Menembus cincin melayang di atas kota. Butuh tunggangan terbang."},

{id:"stormrun", ico:"🌩️", name:"Lari Badai Frostspire", stat:"mana", altStat:"might",
 entry:200, anim:"race", reqFly:3, city:"frostspire",
 rounds:[{diff:60,prize:500},{diff:80,prize:1200},{diff:93,prize:2800}],
 desc:"Balapan menembus badai mana. Hanya tunggangan terbang tingkat tertinggi."},
```

Saya sarankan **balap lintasan cincin**, bukan olahraga bola tim di udara. Dua alasan:
lomba cincin cocok dengan struktur turnamen-berronde yang sudah ada (tinggal tambah entri array),
dan olahraga bola di atas sapu terbang itu terlalu dekat dengan satu properti tertentu —
saya bahas ini di bagian referensi.

### 2c. Dimensi vertikal untuk yang sudah ada

- **Perjalanan antar kota jadi 1 aksi** kalau punya tunggangan terbang (sekarang 1–3).
  Ini membuat 2.400 keping untuk Wyvern terasa berharga.
- **Dungeon punya ruang yang hanya bisa dicapai dari udara** — loot lebih baik.
- **Frostspire jadi kota langit.** Ley-line + badai mana = ibu kota penerbangan.
  Ini akhirnya memberi Frostspire identitas selain "dingin dan menyakitkan".

---

# PILAR 3 — JALAN LANGKA
### Karir spesial yang tidak bisa sekadar dipilih

Ini inti pertanyaanmu. Sekarang ada 11 karir, semuanya duniawi: petani, penjaga, pandai besi,
tabib, bard, pencuri… Syarat tertingginya cuma `might>=65 && reputation>=10`.

**Tidak ada karir yang terasa seperti pencapaian.**

Usulan: tier kedua di atas `CAREERS` — **Jalan Langka**. Tidak muncul di daftar kerja biasa.
Kamu *diundang*, setelah memenuhi syarat yang berat.

| Karir | Syarat | Yang membuatnya khas |
|---|---|---|
| 🌀 **Penunggang Langit** | tunggangan terbang lvl 2+ · pesona 60 | Kurir & pengintai udara. Gaji tinggi, risiko jatuh nyata. Buka Balap Langit tingkat elit. |
| 🦄 **Penjinak Bestia** | 3 bestia bond 80+ | Bisa **membiakkan** bestia & menjualnya. Satu-satunya jalan mendapat telur naga. |
| 🐉 **Pemburu Naga** | kekuatan 80 · pernah bunuh bestia tingkat 4 | Kontrak berbayar besar. Tiap kontrak bisa jadi kematianmu. |
| 🕯️ **Pembaca Nubuat** | tuntaskan 2 nubuat seumur hidup | **Bisa melihat nubuat orang lain** — dan menjual ramalan. Langsung nyambung ke sistem Ramalan. |
| 🗝️ **Tangan Kiri Raja** | reputasi 90 · pernah di jalur politik | Jaringan mata-mata. Bisa menjatuhkan penguasa kota. |
| ⚗️ **Empu Pusaka** | pandai besi tingkat maks · 1 pusaka +5 | Menempa senjata bernama yang diwariskan lintas generasi. |
| 🌑 **Penjaga Krip** | mana 75 · reputasi < 20 | Seni terlarang. Bayaran besar, Inkuisisi memburu, keluarga menjauh. |
| ⚕️ **Tabib Wabah** | ijazah tabib · selamat dari 1 tahun wabah | Kebal wabah. Dipuja saat krisis, dicurigai saat damai. |

**Aturan desain yang membuat tier ini bekerja:**

1. **Diundang, bukan dilamar.** Syarat terpenuhi → NPC mendatangimu. Itu momen, bukan menu.
2. **Satu Jalan Langka per nyawa.** Memilih satu menutup yang lain sampai kau mati.
   Ini yang membuat pilihannya berat dan membuat nyawa berikutnya terasa berbeda.
3. **Ada harganya.** Penjaga Krip kehilangan keluarga. Pemburu Naga bisa mati tiap kontrak.
   Tangan Kiri Raja jatuh bersama rajanya.
4. **Tercatat di Kronik Wangsa.** "Kakekmu seorang Pemburu Naga" harus punya arti mekanis
   bagi cucumu — misal harga bestia lebih murah, atau musuh lama yang mengenali nama keluargamu.

---

# Referensi dari fantasi lain — apa yang layak diambil

Saya pisahkan **struktur** (ide yang bebas dipakai) dari **ekspresi** (nama, karakter, tempat —
ini yang dilindungi hak cipta dan bisa membuat aplikasimu ditarik dari store).

| Sumber | Struktur yang layak diambil | Versi Mantara | Jangan disentuh |
|---|---|---|---|
| **Harry Potter** | Asrama sekolah dengan poin & rivalitas · turnamen antar-sekolah · olahraga di atas tunggangan terbang · ikatan dengan hewan/tongkat · seni terlarang | **Balai Sekolah** (4 balai, poin tahunan, ikut kelulusan) · **Turnamen Empat Menara** · Balap Cincin Langit · Bestia Terikat · jalur Penjaga Krip | Nama olahraga, nama sekolah & asrama, nama turnamen, mantra spesifik, karakter |
| **Game of Thrones** | Suksesi dinasti & wangsa berlambang · dewan penasihat · **anak titipan** antar wangsa · pertunangan politik · anak haram & pengesahan · musim panjang yang menakutkan | **Kronik Wangsa** (sudah direncanakan) · **Dewan Raja** · anak titipan sebagai jaminan damai · **Tahun Bertanda** | Nama wangsa, karakter, peta Westeros, kalimat ikonik |
| **The Witcher** | Kontrak monster dengan riset & persiapan · bestiarium yang terisi seiring main | **Kontrak Bestia** — perluasan `bountyPool` yang sudah ada, + **Bestiarium** yang terbuka tiap kali kau bertemu makhluk baru | Nama karakter & lore spesifik |
| **Eragon / How to Train Your Dragon** | Makhluk yang tumbuh bersamamu, menua, dan mati bersamamu | **Bestia Terikat** (Pilar 1) | — |
| **Mulan / Kingdom of Heaven** | Wajib militer, kehormatan keluarga, naik pangkat dari bawah | Sudah ada di dilema `dl_perang_wajib` — bisa diperdalam jadi jalur karir militer | — |

**Soal ini secara praktis:** struktur seperti "sekolah dengan asrama berpoin" atau "turnamen antar
sekolah" itu sudah jadi genre — banyak game memakainya tanpa masalah. Yang berisiko adalah menyalin
nama dan detail khas. Karena kamu menargetkan App Store dan Play Store, dua-duanya punya jalur
takedown hak cipta yang cepat, jadi pakai nama Mantara sendiri untuk semuanya. Kebetulan itu juga
sejalan dengan instruksi proyekmu sendiri: *"jangan terlalu jiplak"*.

---

# Dua ide tambahan yang menurut saya paling kuat

### 🏛️ Balai Sekolah — memberi sekolah taruhan sosial

Sistem sekolah sekarang sudah jalan (3 jenjang, kuis, ijazah) tapi terasa sendirian.
Tambahkan **4 Balai** yang dipilih saat masuk jenjang dasar:

| Balai | Watak | Bonus |
|---|---|---|
| 🦌 Balai Rusa | ketekunan | +Akal, ijazah lebih mudah |
| 🐍 Balai Ular | ambisi | +Pesona, akses jalur politik lebih awal |
| 🔥 Balai Nyala | keberanian | +Kekuatan, buka turnamen remaja |
| 🌙 Balai Bulan | rahasia | +Mana, buka perpustakaan terlarang |

Balai mengumpulkan poin dari kuis, turnamen, dan perilakumu. Balai juaralah yang namanya
tercatat tiap tahun. **Balai diwariskan** — anakmu masuk balai yang sama secara default,
dan memilih balai berbeda dari orang tuamu adalah momen kecil yang terasa besar.

Biayanya kecil (sistem sekolah sudah ada), dampaknya: sekolah berubah dari rangkaian kuis
jadi tempat pemain punya identitas.

### 📖 Bestiarium — koleksi yang mengisi dirinya sendiri

Tiap kali kau bertemu makhluk (dungeon, kontrak, event, bestia peliharaan), entri terbuka:
nama, ilustrasi, kelemahan, di mana ditemukan, berapa kali kau kalahkan.

Ini murah sekali dibuat dan memberi **tujuan koleksi jangka panjang lintas nyawa** —
Bestiarium milik wangsa, bukan milik karakter. Pemain yang sudah 30 jam main punya alasan
memasuki dungeon yang sudah mereka kuasai: *masih ada 6 entri kosong.*

---

# Urutan yang saya sarankan

| # | Fitur | Biaya | Dampak | Catatan |
|---|---|---|---|---|
| 1 | **Bestia Terikat** (gabung pet+mount) | Kecil | Sangat besar | Sistem level/bond/cond sudah ada. Menghidupkan 15 aset mati. |
| 2 | **Tunggangan terbang + Balap Cincin** | Kecil | Besar | Tambah entri array ke `GEAR_CATALOG` & `TOURNAMENTS`. Ini permintaanmu. |
| 3 | **Jalan Langka** (8 karir) | Sedang | Sangat besar | Memberi tujuan jangka panjang yang sekarang tidak ada. |
| 4 | **Balai Sekolah** | Kecil | Sedang | Sekolah akhirnya punya rasa. |
| 5 | **Bestiarium** | Kecil | Sedang | Koleksi lintas nyawa. |
| 6 | **Kronik Wangsa** | Besar | Sangat besar | Dari review awal. Semua di atas bermuara ke sini. |

Kalau harus memilih **satu**: nomor 1 dan 2 sebaiknya dikerjakan bersama sebagai satu paket —
keduanya menyentuh sistem yang sama, dan hasilnya langsung terlihat oleh pemain.

---

## Satu peringatan jujur

v24 sudah menumpuk **45 lapis monkey-patch** di satu file 874 KB. Semua di atas bisa saya
tambahkan dengan pola yang sama dan akan jalan — tapi Bestia Terikat menyentuh `PET_SPECIES`,
`GEAR_CATALOG`, `TOURNAMENTS`, sistem duel, dungeon, **dan** pewarisan sekaligus. Itu lintas-sistem,
bukan tempelan.

Saran saya: **sebelum Pilar 1, pecah file jadi modul per-domain.** Sekitar satu hari kerja.
Kalau tidak, fitur ini akan jadi lapis ke-46 yang menimpa lima sistem lain — dan dua dari tiga
blocker yang saya perbaiki kemarin lahir persis dari pola itu.
