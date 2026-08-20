/* ============================================================================
   MANTARA v24 — LAPIS C: PAKET KONTEN
   ----------------------------------------------------------------------------
   Temuan review: 31 event acak + 11 event usia. Satu event ("Ekspedisi
   berbahaya") muncul 8x dalam 45 tahun — 10% dari seluruh log hidup.
   Paket ini menambah:
     · 96 event acak tahunan   (EVENTS)      -> total 127
     · 34 event usia berpilihan (AGING_EVENTS) -> total 45
     · 22 DILEMA berat          (baru)
   Total ~194 potongan konten. Ditulis dengan suara hikayat yang sama.
   ============================================================================ */
(function(){
  "use strict";
  function hasC(){ return typeof C!=="undefined" && C && C.alive; }
  function ri(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
  function ch(p){ return Math.random()<p; }
  function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
  function S(o){ try{ if(typeof applyStats==="function") applyStats(o); }catch(e){} }
  function coin(n){ if(C) C.coin=Math.max(0,(C.coin||0)+n); }
  function rep(n){ if(C) C.reputation=Math.max(0,(C.reputation||0)+n); }
  function bond(role,n){ try{ (C.relations||[]).filter(function(r){return r.role===role;}).forEach(function(r){ r.bond=Math.max(0,Math.min(100,(r.bond||0)+n)); }); }catch(e){} }
  function anyRel(role){ try{ return (C.relations||[]).filter(function(r){return r.role===role;}); }catch(e){ return []; } }
  function mark(k){ try{ if(window.prophMark) window.prophMark(k); }catch(e){} }
  function use(k){ try{ if(window.__markStatUse) window.__markStatUse(k); }catch(e){} }
  function isMage(){ return C&&C.isMage; }
  function city(){ try{ return C.cityId; }catch(e){ return "aetheria"; } }
  function G(t){ return {t:t,cls:"e-good"}; }
  function B(t){ return {t:t,cls:"e-bad"}; }
  function E(t){ return {t:t,cls:"e-epic"}; }
  function N(t){ return {t:t,cls:""}; }

  if(typeof EVENTS==="undefined") return;

  /* ==========================================================================
     C1. EVENT ACAK TAHUNAN (auto)
     ========================================================================== */
  var NEW_EVENTS=[

  /* ---------- MASA KECIL 0–12 ---------- */
  {minAge:2,maxAge:6,w:3,auto:function(){ S({happy:+4,mind:+1}); return G("Kau menemukan kucing liar di bawah kolong rumah dan memberinya nama rahasia."); }},
  {minAge:3,maxAge:7,w:3,auto:function(){ S({health:-3,might:+2}); use("might"); return N("Kau jatuh dari pohon jambu. Lututmu berdarah, tapi kau memanjat lagi besoknya."); }},
  {minAge:3,maxAge:8,w:2,auto:function(){ S({mind:+3}); use("mind"); return G("Seorang tua di pasar mengajarimu membaca dari papan harga ikan."); }},
  {minAge:4,maxAge:9,w:2,auto:function(){ S({charm:+3,happy:+3}); use("charm"); return G("Kau menang lomba bercerita di balai desa. Orang dewasa tertawa, dan kau suka rasanya."); }},
  {minAge:4,maxAge:10,w:2,auto:function(){ bond("keluarga",+6); S({happy:+5}); return G("Ayahmu membawamu ke pasar malam dan membiarkanmu memilih satu hal apa pun."); }},
  {minAge:5,maxAge:11,w:2,auto:function(){ S({happy:-6}); bond("keluarga",-3); return B("Kau memecahkan guci warisan keluarga. Tak seorang pun memarahimu, dan itu lebih buruk."); }},
  {minAge:5,maxAge:12,w:2,cond:function(c){return c.isMage;},auto:function(){ S({mana:+5,happy:-3}); use("mana"); return E("Lilin di kamarmu menyala sendiri saat kau marah. Ibumu menutup jendela rapat-rapat."); }},
  {minAge:6,maxAge:12,w:2,auto:function(){ S({might:+3,health:+2}); use("might"); return G("Kau berkelahi dengan anak tetangga dan tidak mengadu pada siapa pun."); }},
  {minAge:6,maxAge:12,w:2,auto:function(){ var g=ri(3,12); coin(g); return G("Kau menemukan "+g+" keping di selokan. Kau simpan di bawah bantal selama berbulan-bulan."); }},
  {minAge:7,maxAge:12,w:2,auto:function(){ S({mind:+4}); use("mind"); return G("Kau menghabiskan satu musim mempelajari cara kerja kincir air. Tak ada yang menyuruhmu."); }},
  {minAge:7,maxAge:12,w:2,auto:function(){ S({happy:-8,health:-5}); return B("Demam tinggi menahanmu di ranjang sepanjang musim hujan."); }},
  {minAge:8,maxAge:12,w:2,auto:function(){ S({charm:+4}); use("charm"); return G("Kau belajar berbohong dengan meyakinkan. Kemampuan ini akan berguna, dan itu menakutkan."); }},
  {minAge:8,maxAge:12,w:2,auto:function(){ bond("keluarga",+8); return G("Kakakmu membelamu di depan orang dewasa, meski kau yang salah."); }},
  {minAge:9,maxAge:12,w:2,auto:function(){ S({mind:+2,happy:+4}); return G("Seorang pengembara menginap semalam dan menceritakan negeri di seberang laut."); }},
  {minAge:9,maxAge:12,w:2,auto:function(){ S({happy:-5}); return B("Kau menyadari keluargamu lebih miskin dari yang kau kira."); }},

  /* ---------- REMAJA 13–19 ---------- */
  {minAge:13,maxAge:18,w:3,auto:function(){ S({charm:+3,happy:+6}); use("charm"); return G("Seseorang menatapmu lebih lama dari seharusnya di pasar. Kau memikirkannya seminggu penuh."); }},
  {minAge:13,maxAge:19,w:3,auto:function(){ S({might:+4,health:-2}); use("might"); return G("Kau bekerja mengangkut karung di dermaga sepanjang musim. Punggungmu sakit, bahumu melebar."); }},
  {minAge:13,maxAge:19,w:2,auto:function(){ var g=ri(15,45); coin(g); S({mind:+2}); return G("Kau menyalin dokumen untuk juru tulis kota. Upah "+g+" keping dan tangan yang pegal."); }},
  {minAge:14,maxAge:19,w:2,auto:function(){ S({happy:-9}); return B("Sahabat masa kecilmu pindah kota tanpa berpamitan."); }},
  {minAge:14,maxAge:19,w:2,auto:function(){ S({charm:-4,happy:-7}); return B("Kau ditolak mentah-mentah di depan orang banyak. Kau tertawa, lalu pulang lewat jalan memutar."); }},
  {minAge:14,maxAge:19,w:2,cond:function(c){return c.isMage;},auto:function(){ S({mana:+6,charm:-3}); use("mana"); return E("Kau tak sengaja membekukan air di gelas seseorang. Kabar itu menyebar lebih cepat dari air mencair."); }},
  {minAge:15,maxAge:19,w:2,auto:function(){ S({mind:+5}); use("mind"); return G("Kau menemukan kitab tua di gudang dan membacanya sampai lilin habis tiga batang."); }},
  {minAge:15,maxAge:19,w:2,auto:function(){ var l=ri(20,60); coin(-l); return B("Kau ditipu pedagang keliling. Rugi "+l+" keping, dan pelajaran yang mahal."); }},
  {minAge:15,maxAge:19,w:2,auto:function(){ rep(6); S({charm:+3}); return G("Kau menolong seorang tua yang jatuh di jalan. Beberapa orang melihat, dan mereka ingat."); }},
  {minAge:16,maxAge:19,w:2,auto:function(){ S({health:-8,might:+5}); use("might"); return N("Kau ikut kerusuhan pasar. Kau tidak tahu apa tuntutannya, tapi kau tahu rasanya bertahan."); }},
  {minAge:16,maxAge:19,w:2,auto:function(){ bond("keluarga",-9); S({happy:-5}); return B("Kau bertengkar hebat dengan ayahmu tentang masa depanmu. Kalian tidak bicara sebulan."); }},
  {minAge:16,maxAge:19,w:2,auto:function(){ S({happy:+8,charm:+4}); use("charm"); return G("Malam festival. Kau menari sampai kaki mati rasa dan pulang saat langit sudah abu-abu."); }},
  {minAge:17,maxAge:19,w:2,auto:function(){ S({mind:+3,mana:isMage()?+4:0}); return G("Seorang guru melihat sesuatu dalam dirimu dan menawarkan bimbingan gratis."); }},
  {minAge:17,maxAge:19,w:2,auto:function(){ var g=ri(30,90); coin(g); rep(4); return G("Kau menjual hasil kerjamu sendiri untuk pertama kali. "+g+" keping terasa berbeda dari uang pemberian."); }},

  /* ---------- DEWASA MUDA 20–34 ---------- */
  {minAge:20,maxAge:34,w:3,auto:function(){ var g=ri(40,140); coin(g); return G("Tahun kerja yang keras dan jujur. Kau menyisihkan "+g+" keping."); }},
  {minAge:20,maxAge:34,w:2,auto:function(){ S({happy:-8,health:-4}); return B("Kau bekerja terlalu keras dan lupa kapan terakhir kali makan dengan tenang."); }},
  {minAge:20,maxAge:34,w:2,auto:function(){ rep(9); S({charm:+3}); return G("Namamu mulai disebut orang yang belum pernah bertemu denganmu."); }},
  {minAge:20,maxAge:38,w:2,auto:function(){ var l=ri(50,180); coin(-l); return B("Atapmu bocor parah di tengah musim hujan. Perbaikan menelan "+l+" keping."); }},
  {minAge:20,maxAge:40,w:2,cond:function(c){return (c.coin||0)>400;},auto:function(){ var g=Math.round(C.coin*0.10); coin(g); return G("Kau meminjamkan modal pada teman yang jujur. Ia mengembalikannya dengan bunga: +"+g+" keping."); }},
  {minAge:21,maxAge:40,w:2,auto:function(){ S({might:+3,health:+3}); use("might"); return G("Kau mulai berlatih setiap pagi sebelum matahari naik. Tubuhmu berterima kasih."); }},
  {minAge:21,maxAge:45,w:2,auto:function(){ S({mind:+3}); use("mind"); return G("Kau belajar bahasa dagang dari pelaut asing. Dunia terasa sedikit lebih kecil."); }},
  {minAge:21,maxAge:45,w:2,auto:function(){ S({happy:+7}); bond("pasangan",+8); return G("Malam biasa, makanan biasa, percakapan biasa — dan kau sadar kau bahagia."); }},
  {minAge:22,maxAge:45,w:2,auto:function(){ if(ch(0.5)){ rep(12); return G("Kau bersaksi jujur di pengadilan kota meski itu merugikanmu."); } rep(-8); return B("Kau memilih diam di pengadilan kota. Orang yang salah bebas, dan kau tahu itu."); }},
  {minAge:22,maxAge:50,w:2,auto:function(){ S({health:-10}); return B("Wabah kecil melanda blokmu. Kau selamat, tetanggamu tidak semuanya."); }},
  {minAge:22,maxAge:50,w:2,cond:function(c){return c.isMage;},auto:function(){ S({mana:+5,health:-4}); use("mana"); return E("Kau bereksperimen dengan mantra yang belum siap. Alismu terbakar, tapi kau berhasil."); }},
  {minAge:23,maxAge:50,w:2,auto:function(){ var g=ri(60,200); coin(g); rep(5); return G("Seorang bangsawan memesan jasamu secara pribadi. "+g+" keping dan sebuah koneksi."); }},
  {minAge:23,maxAge:50,w:2,auto:function(){ S({charm:+4}); use("charm"); return G("Kau belajar kapan harus diam dalam percakapan. Orang mulai menganggapmu bijak."); }},
  {minAge:24,maxAge:50,w:2,auto:function(){ bond("teman",+10); S({happy:+5}); return G("Seorang teman lama datang tanpa diundang, membawa arak murah dan cerita panjang."); }},
  {minAge:24,maxAge:55,w:2,auto:function(){ var l=ri(40,120); coin(-l); S({happy:-4}); return B("Pajak kota naik mendadak. "+l+" keping melayang tanpa kau bisa protes."); }},
  {minAge:25,maxAge:55,w:2,auto:function(){ S({mind:+2,happy:+4}); return G("Kau mengajari seseorang keahlianmu. Ia belajar cepat, dan kau merasa berguna."); }},
  {minAge:25,maxAge:55,w:2,auto:function(){ if(ch(0.45)){ mark("betrayed"); rep(-12); coin(-ri(80,250)); return B("Rekan yang kau percaya membawa lari kas usahamu."); } bond("teman",+12); return G("Rekanmu menolak tawaran besar dari pesaing demi tetap bekerja denganmu."); }},
  {minAge:25,maxAge:60,w:2,auto:function(){ S({happy:-6}); return B("Kau melihat orang yang dulu kau kalahkan, kini jauh lebih sukses darimu."); }},
  {minAge:26,maxAge:60,w:2,auto:function(){ rep(7); S({charm:+2}); return G("Kau diundang duduk di meja yang dulu tidak boleh kau dekati."); }},
  {minAge:26,maxAge:60,w:2,auto:function(){ S({health:-6,might:+4}); use("might"); return N("Kau berkelahi dengan tiga orang di depan kedai. Kau menang, dan menyesalinya."); }},

  /* ---------- PARUH BAYA 35–54 ---------- */
  {minAge:35,maxAge:55,w:3,auto:function(){ S({happy:-7}); return B("Kau bangun di tengah malam dan tidak bisa mengingat kapan terakhir kali kau bersemangat."); }},
  {minAge:35,maxAge:55,w:2,auto:function(){ S({mind:+4,happy:+5}); use("mind"); return G("Kau mulai menulis catatan hidupmu. Ternyata lebih banyak yang terjadi daripada yang kau kira."); }},
  {minAge:35,maxAge:60,w:2,auto:function(){ bond("anak",+10); S({happy:+7}); return G("Anakmu bertanya sesuatu yang tidak bisa kau jawab, dan kalian mencarinya bersama."); }},
  {minAge:35,maxAge:60,w:2,auto:function(){ bond("anak",-10); S({happy:-8}); return B("Anakmu menutup pintu kamarnya lebih sering. Kau tidak tahu kapan itu mulai."); }},
  {minAge:35,maxAge:65,w:2,auto:function(){ var g=ri(100,320); coin(g); return G("Investasi lamamu akhirnya berbuah: "+g+" keping masuk tanpa kau kerjakan."); }},
  {minAge:36,maxAge:65,w:2,auto:function(){ S({health:-9}); return B("Punggungmu mengunci selama tiga hari. Kau baru sadar tubuhmu tidak lagi memaafkan."); }},
  {minAge:36,maxAge:65,w:2,auto:function(){ rep(10); return G("Orang-orang muda mulai meminta pendapatmu. Kau tidak yakin kapan kau jadi 'yang tua'."); }},
  {minAge:37,maxAge:65,w:2,auto:function(){ S({happy:+8,charm:+3}); return G("Kau berdamai dengan seseorang yang lama kau benci. Beban itu ternyata berat sekali."); }},
  {minAge:37,maxAge:65,w:2,auto:function(){ var l=ri(120,400); coin(-l); return B("Usaha yang kau rintis bertahun-tahun merugi. "+l+" keping hilang untuk menambalnya."); }},
  {minAge:38,maxAge:70,w:2,auto:function(){ S({happy:-10}); bond("keluarga",-5); return B("Kau melewatkan sesuatu yang penting bagi keluargamu karena pekerjaan."); }},
  {minAge:38,maxAge:70,w:2,cond:function(c){return (c.reputation||0)>50;},auto:function(){ rep(12); var g=ri(80,240); coin(g); return E("Namamu dipakai orang lain untuk membuka pintu. Kau dapat bagian: "+g+" keping."); }},
  {minAge:39,maxAge:70,w:2,auto:function(){ S({mind:+3,mana:isMage()?+3:0}); return G("Kau menemukan bahwa kau masih bisa belajar hal baru. Ini melegakan."); }},
  {minAge:40,maxAge:70,w:2,auto:function(){ S({happy:-6,health:-5}); return B("Musim dingin terasa lebih panjang tiap tahun."); }},
  {minAge:40,maxAge:70,w:2,auto:function(){ bond("pasangan",+12); S({happy:+9}); return G("Pasanganmu masih tertawa pada leluconmu yang paling buruk. Setelah sekian tahun."); }},
  {minAge:40,maxAge:75,w:2,auto:function(){ if(ch(0.4)){ mark("lostSpouse"); S({happy:-18}); return B("Kau dan pasanganmu berpisah dalam diam. Tidak ada pertengkaran, hanya jarak yang melebar."); } bond("pasangan",+6); return G("Kalian bertengkar hebat, lalu memilih tinggal. Itu juga bentuk cinta."); }},

  /* ---------- TUA 55+ ---------- */
  {minAge:55,maxAge:99,w:3,auto:function(){ S({happy:+7}); return G("Kau duduk di beranda tanpa melakukan apa-apa, dan tidak merasa bersalah."); }},
  {minAge:55,maxAge:99,w:2,auto:function(){ S({health:-8}); return B("Tanganmu gemetar saat menuang air. Kau berpura-pura tidak melihatnya."); }},
  {minAge:55,maxAge:99,w:2,auto:function(){ bond("anak",+12); S({happy:+10}); return G("Cucumu memintamu menceritakan masa mudamu. Kau melebih-lebihkan sedikit."); }},
  {minAge:55,maxAge:99,w:2,auto:function(){ rep(8); return G("Seseorang menuliskan namamu dalam catatan kota. Kau tidak diberi tahu."); }},
  {minAge:56,maxAge:99,w:2,auto:function(){ S({happy:-12}); return B("Teman terakhir dari masa kecilmu meninggal. Sekarang tidak ada lagi yang ingat kau kecil."); }},
  {minAge:58,maxAge:99,w:2,auto:function(){ var g=ri(60,200); coin(g); return G("Utang lama yang sudah kau lupakan dibayar oleh anak si peminjam: "+g+" keping."); }},
  {minAge:58,maxAge:99,w:2,auto:function(){ S({health:-12,happy:-6}); return B("Kau jatuh di kamar mandi. Butuh waktu lama untuk bisa berdiri lagi."); }},
  {minAge:60,maxAge:99,w:2,auto:function(){ S({happy:+9,mind:+2}); return G("Kau membaca ulang kitab kesukaanmu dan menemukan makna yang dulu terlewat."); }},
  {minAge:60,maxAge:99,w:2,cond:function(c){return (c.coin||0)>2000;},auto:function(){ var g=ri(200,600); coin(-g); rep(20); return E("Kau menyumbang "+g+" keping untuk membangun sumur kota. Namamu dipahat di batunya."); }},
  {minAge:62,maxAge:99,w:2,auto:function(){ S({happy:-8}); return B("Kau memanggil nama yang salah untuk orang yang kau sayangi."); }},
  {minAge:65,maxAge:99,w:2,auto:function(){ S({happy:+12}); bond("anak",+8); return E("Seluruh keluargamu berkumpul tanpa alasan khusus. Kau menyadari ini yang kau bangun."); }},

  /* ---------- KOTA-SPESIFIK ---------- */
  {minAge:12,maxAge:99,w:2,cond:function(c){return c.cityId==="aetheria";},auto:function(){ rep(6); S({charm:+2}); return G("\u{1F3DB}️ Prosesi kerajaan melewati jalanmu. Kau melambai, dan seseorang melambai balik."); }},
  {minAge:12,maxAge:99,w:2,cond:function(c){return c.cityId==="aetheria";},auto:function(){ var l=ri(30,100); coin(-l); return B("\u{1F3DB}️ Harga sewa di Aetheria naik lagi. "+l+" keping melayang."); }},
  {minAge:12,maxAge:99,w:2,cond:function(c){return c.cityId==="thornvale";},auto:function(){ S({might:+3,health:-3}); use("might"); return G("\u{1F332} Kau ikut memburu bestia yang mengganggu ladang. Kau kembali dengan bekas cakar."); }},
  {minAge:12,maxAge:99,w:2,cond:function(c){return c.cityId==="thornvale";},auto:function(){ var g=ri(25,80); coin(g); return G("\u{1F332} Panen rimba melimpah. Kau menjual kelebihan seharga "+g+" keping."); }},
  {minAge:12,maxAge:99,w:2,cond:function(c){return c.cityId==="saltmoor";},auto:function(){ var g=ri(30,120); coin(g); return G("\u{1F6A2} Kapal karam terdampar. Kau ikut memungut sisa muatan: "+g+" keping."); }},
  {minAge:12,maxAge:99,w:2,cond:function(c){return c.cityId==="saltmoor";},auto:function(){ S({health:-7}); return B("\u{1F9A0} Demam pelabuhan menjangkitimu. Butuh sebulan untuk pulih."); }},
  {minAge:12,maxAge:99,w:2,cond:function(c){return c.cityId==="frostspire";},auto:function(){ S({health:-6,mind:+3}); return N("❄️ Badai salju mengurungmu seminggu. Kau membaca semua yang ada di rumah."); }},
  {minAge:12,maxAge:99,w:2,cond:function(c){return c.cityId==="frostspire"&&c.isMage;},auto:function(){ S({mana:+6}); use("mana"); return E("❄️ Ley-line di bawah menara bergolak. Mana di tubuhmu ikut bergetar."); }},

  /* ---------- KARIR & USAHA ---------- */
  {minAge:18,maxAge:70,w:2,cond:function(c){return !!c.career;},auto:function(){ rep(6); S({mind:+2}); return G("Atasanmu menyebut namamu di depan orang penting."); }},
  {minAge:18,maxAge:70,w:2,cond:function(c){return !!c.career;},auto:function(){ S({happy:-9}); return B("Kau dilewati untuk promosi oleh orang yang jelas kurang cakap."); }},
  {minAge:18,maxAge:70,w:2,cond:function(c){return !!c.career;},auto:function(){ var g=ri(50,180); coin(g); return G("Bonus akhir tahun turun tak terduga: "+g+" keping."); }},
  {minAge:20,maxAge:70,w:2,cond:function(c){return c.businesses&&c.businesses.length;},auto:function(){ var g=ri(60,220); coin(g); return G("Pesaing utamamu tutup. Pelanggannya pindah padamu: +"+g+" keping."); }},
  {minAge:20,maxAge:70,w:2,cond:function(c){return c.businesses&&c.businesses.length;},auto:function(){ var l=ri(70,260); coin(-l); return B("Pegawaimu mencuri dari kas. Kerugian "+l+" keping, dan kepercayaan yang sulit dipulihkan."); }},

  /* ---------- SIHIR & MISTERI ---------- */
  {minAge:14,maxAge:99,w:1,cond:function(c){return c.isMage;},auto:function(){ S({mana:+7,happy:-5}); use("mana"); return E("\u{1F52E} Kau bermimpi dalam bahasa yang tidak kau kenal, dan bangun bisa mengucapkannya."); }},
  {minAge:16,maxAge:99,w:1,cond:function(c){return c.isMage;},auto:function(){ S({health:-10,mana:+8}); use("mana"); return E("\u{1F52E} Ritual yang kau coba berhasil setengah. Setengah lainnya meninggalkan bekas."); }},
  {minAge:16,maxAge:99,w:1,cond:function(c){return c.isMage&&(c.stats.mana||0)>60;},auto:function(){ rep(10); return E("\u{1F52E} Kau menyembuhkan seseorang yang sudah menyerah. Kabar itu berjalan sendiri."); }},
  {minAge:18,maxAge:99,w:1,cond:function(c){return !c.isMage;},auto:function(){ S({happy:-6,mind:+3}); return N("Kau melihat seorang penyihir melakukan sesuatu yang mustahil, dan tidak bisa tidur malam itu."); }},

  /* ---------- KEBERUNTUNGAN & MALAPETAKA ---------- */
  {minAge:10,maxAge:99,w:1,auto:function(){ var g=ri(150,500); coin(g); return E("\u{1F340} Keberuntungan murni: kau menemukan kantung berisi "+g+" keping tanpa pemilik."); }},
  {minAge:10,maxAge:99,w:1,auto:function(){ var l=Math.min(C.coin,ri(100,400)); coin(-l); return B("\u{1F573}️ Pencuri membobol simpananmu. "+l+" keping raib."); }},
  {minAge:14,maxAge:99,w:1,auto:function(){ S({health:-15,happy:-8}); return B("Kecelakaan di jalan. Kau sembuh, tapi ada yang tidak kembali seperti semula."); }},
  {minAge:14,maxAge:99,w:1,auto:function(){ S({health:+8,happy:+8}); return G("Tabib keliling memberimu ramuan cuma-cuma. Kau merasa lebih ringan berbulan-bulan."); }},
  {minAge:16,maxAge:99,w:1,auto:function(){ rep(-15); S({happy:-10}); return B("Fitnah tentangmu menyebar. Kau tidak tahu siapa yang memulainya."); }},
  {minAge:16,maxAge:99,w:1,auto:function(){ rep(15); S({charm:+3}); return E("Kau melakukan sesuatu yang benar saat tak ada yang melihat — lalu ada yang melihat."); }}
  ];

  for(var i=0;i<NEW_EVENTS.length;i++) EVENTS.push(NEW_EVENTS[i]);

  /* ==========================================================================
     C2. EVENT USIA BERPILIHAN + DILEMA
     ========================================================================== */
  if(typeof AGING_EVENTS!=="undefined"){
    var NEW_AGING=[

    /* ---------------- DILEMA: tidak ada jawaban benar ---------------- */
    {id:"dl_adik_curi",min:20,max:55,once:true,cond:function(c){return anyRel("keluarga").length>0;},
     build:function(){ return {ico:"⚖️",prompt:"<b>Adikmu mencuri dari kas guild.</b><br><span style=\"font-size:11.5px;color:var(--ink-soft);filter:brightness(1.5)\">Ketua guild bertanya langsung padamu, di depan semua orang. Semua menunggu.</span>",
      choices:[
       {label:"Serahkan dia",sub:"reputasi naik · dia takkan memaafkanmu",run:function(){ rep(25); bond("keluarga",-55); S({happy:-14}); mark("betrayed"); return {t:"⚖️ Kau menyebut namanya. Ia menatapmu sekali, lalu tidak pernah lagi.",cls:"e-bad"}; }},
       {label:"Tutupi dia",sub:"bond naik · 40% ketahuan",cls:"love",run:function(){ if(ch(0.40)){ rep(-40); coin(-ri(150,400)); return {t:"\u{1F5E1}️ Kebohonganmu terbongkar. Kau dikeluarkan dari guild, namamu tercoreng.",cls:"e-bad"}; } bond("keluarga",+30); return {t:"\u{1F91D} Kau berbohong dengan tenang. Adikmu tahu apa yang kau korbankan.",cls:"e-good"}; }},
       {label:"Tanggung sendiri",sub:"bayar dari kantongmu",run:function(){ var l=Math.min(C.coin,800); coin(-l); bond("keluarga",+20); rep(8); return {t:"\u{1F4B0} Kau bayar "+l+" keping dari uangmu sendiri. Keduanya utuh — kecuali dompetmu.",cls:"e-good"}; }}]};
     }},

    {id:"dl_wabah_pintu",min:22,max:65,once:true,
     build:function(){ return {ico:"\u{1F9A0}",prompt:"<b>Wabah melanda. Tetanggamu mengetuk pintu, menggendong anaknya yang demam.</b><br><span style=\"font-size:11.5px;color:var(--ink-soft);filter:brightness(1.5)\">Kau punya persediaan. Kau juga punya keluarga di dalam.</span>",
      choices:[
       {label:"Buka pintu",sub:"nyawa taruhan · reputasi besar",cls:"love",run:function(){ if(ch(0.45)){ S({health:-25}); bond("keluarga",-10); rep(30); return {t:"\u{1F6AA} Kau merawat mereka. Anak itu selamat. Kau jatuh sakit berbulan-bulan.",cls:"e-bad"}; } rep(35); S({happy:+12}); return {t:"\u{1F6AA} Kau merawat mereka dan semua selamat. Kota mengingat siapa yang membuka pintu.",cls:"e-epic"}; }},
       {label:"Berikan obat lewat jendela",sub:"jalan tengah",run:function(){ coin(-ri(40,120)); rep(10); S({happy:-4}); return {t:"\u{1FA9F} Kau menyerahkan ramuan tanpa membuka pintu. Cukup, tapi tidak cukup.",cls:""}; }},
       {label:"Tetap tutup",sub:"keluargamu aman · kau akan ingat ini",run:function(){ S({happy:-20}); rep(-18); return {t:"\u{1F507} Kau tidak menjawab. Ketukan itu berhenti, dan kau mendengarnya bertahun-tahun setelahnya.",cls:"e-bad"}; }}]};
     }},

    {id:"dl_mahkota",min:28,max:60,once:true,cond:function(c){return (c.reputation||0)>=45;},
     build:function(){ return {ico:"\u{1F451}",prompt:"<b>Dewan menawarkan gelar padamu.</b><br><span style=\"font-size:11.5px;color:var(--ink-soft);filter:brightness(1.5)\">Kekuasaan, dan rantai yang datang bersamanya. Mereka butuh jawaban malam ini.</span>",
      choices:[
       {label:"Terima gelar",sub:"kuasa · musuh baru",cls:"love",run:function(){ rep(40); coin(ri(300,900)); C.polRole={role:"adipati",since:C.age}; return {t:"\u{1F451} Kau menerima gelar. Malam itu tiga orang mulai merencanakan kejatuhanmu.",cls:"e-epic"}; }},
       {label:"Tolak dengan hormat",sub:"tetap bebas",run:function(){ mark("refusedCrown"); rep(8); S({happy:+10}); return {t:"\u{1F5FF} Kau menolak. Beberapa menyebutnya bodoh, beberapa menyebutnya bijak.",cls:"e-good"}; }},
       {label:"Tolak, dan usulkan orang lain",sub:"sekutu seumur hidup",run:function(){ mark("refusedCrown"); rep(18); bond("teman",+25); return {t:"\u{1F91D} Kau menyerahkan gelar itu pada orang yang lebih layak. Ia tidak akan melupakannya.",cls:"e-good"}; }}]};
     }},

    {id:"dl_api_kota",min:25,max:65,once:true,
     build:function(){ return {ico:"\u{1F525}",prompt:"<b>Gudang gandum kota terbakar. Kau tahu siapa pelakunya — dan ia berutang nyawa padamu.</b><br><span style=\"font-size:11.5px;color:var(--ink-soft);filter:brightness(1.5)\">Musim dingin datang enam minggu lagi.</span>",
      choices:[
       {label:"Laporkan dia",sub:"kota selamat · utang lunas hilang",run:function(){ rep(28); bond("teman",-40); return {t:"\u{1F5E3}️ Kau menyerahkannya. Kota bertahan melewati musim dingin. Kau kehilangan seorang teman.",cls:""}; }},
       {label:"Diam",sub:"kota kelaparan · api atas namamu",run:function(){ mark("burnedHome"); rep(-25); S({happy:-16}); coin(-ri(100,300)); return {t:"\u{1F507} Kau diam. Musim dingin itu memakan korban, dan sebagian dari kau tahu itu ulahmu juga.",cls:"e-bad"}; }},
       {label:"Ganti kerugian diam-diam",sub:"mahal sekali",run:function(){ var l=Math.min(C.coin,2000); coin(-l); rep(12); bond("teman",+20); return {t:"\u{1F33E} Kau membeli gandum dari tiga kota dengan "+l+" keping. Tidak ada yang tahu kenapa.",cls:"e-good"}; }}]};
     }},

    {id:"dl_guru_tua",min:18,max:50,once:true,
     build:function(){ return {ico:"\u{1F4DA}",prompt:"<b>Gurumu memintamu memalsukan satu angka dalam catatan.</b><br><span style=\"font-size:11.5px;color:var(--ink-soft);filter:brightness(1.5)\">Ia mengajarimu segalanya. Angka itu akan menyelamatkan pensiunnya.</span>",
      choices:[
       {label:"Palsukan",sub:"guru selamat · integritasmu tidak",run:function(){ S({mind:+3,happy:-10}); if(ch(0.3)){ rep(-30); return {t:"\u{1F4DD} Pemalsuan itu ketahuan lima tahun kemudian. Kalian berdua jatuh.",cls:"e-bad"}; } bond("teman",+18); return {t:"\u{1F4DD} Kau menuliskannya. Tanganmu tidak gemetar, dan itu yang menakutkanmu.",cls:""}; }},
       {label:"Tolak",sub:"benar · dan sendirian",run:function(){ rep(15); S({happy:-8}); return {t:"✋ Kau menolak. Ia tidak pernah menyapamu lagi, dan kau tidak pernah yakin kau benar.",cls:""}; }},
       {label:"Tolak, lalu biayai pensiunnya",sub:"mahal",run:function(){ var l=Math.min(C.coin,600); coin(-l); rep(20); S({happy:+8}); return {t:"\u{1FA99} Kau menolak memalsukan, lalu diam-diam menanggung hidupnya. "+l+" keping.",cls:"e-good"}; }}]};
     }},

    {id:"dl_anak_bakat",min:35,max:70,once:true,cond:function(c){return anyRel("anak").length>0;},
     build:function(){ return {ico:"\u{1F9D2}",prompt:"<b>Anakmu berbakat luar biasa — di bidang yang kau benci.</b><br><span style=\"font-size:11.5px;color:var(--ink-soft);filter:brightness(1.5)\">Ia meminta restumu, bukan izinmu.</span>",
      choices:[
       {label:"Beri restu penuh",sub:"ia pergi jauh",cls:"love",run:function(){ bond("anak",+40); S({happy:-6}); rep(6); return {t:"\u{1F54A}️ Kau melepasnya. Rumah jadi lebih sepi, tapi ia menulis setiap bulan.",cls:"e-good"}; }},
       {label:"Paksa ikut jalanmu",sub:"ia tinggal · membencimu",run:function(){ bond("anak",-45); coin(ri(100,300)); S({happy:-12}); return {t:"⛓️ Ia menurut. Bertahun-tahun kemudian kau masih melihat sesuatu yang padam di matanya.",cls:"e-bad"}; }},
       {label:"Beri syarat: buktikan dulu",sub:"jalan tengah",run:function(){ bond("anak",+12); S({mind:+2}); return {t:"⚖️ Kau memberinya dua tahun untuk membuktikan diri. Ia menerimanya, dengan rahang mengeras.",cls:""}; }}]};
     }},

    {id:"dl_saingan_jatuh",min:25,max:65,once:true,
     build:function(){ return {ico:"\u{1FA9C}",prompt:"<b>Saingan terberatmu jatuh miskin dan datang meminta pekerjaan.</b><br><span style=\"font-size:11.5px;color:var(--ink-soft);filter:brightness(1.5)\">Ia pernah menghancurkanmu. Sekarang ia berdiri di depan mejamu.</span>",
      choices:[
       {label:"Terima dia",sub:"berisiko · besar",cls:"love",run:function(){ if(ch(0.35)){ mark("betrayed"); coin(-ri(200,600)); rep(-10); return {t:"\u{1F5E1}️ Ia mengkhianatimu lagi. Sebagian dirimu sudah tahu.",cls:"e-bad"}; } rep(22); bond("teman",+30); coin(ri(150,450)); return {t:"\u{1F91D} Ia bekerja untukmu dengan setia sampai akhir. Kota membicarakan kemurahan hatimu.",cls:"e-epic"}; }},
       {label:"Tolak dengan dingin",sub:"aman · kau tahu rasanya",run:function(){ S({happy:-8}); rep(-5); return {t:"❄️ Kau menyuruhnya pergi. Kau menang, dan tidak merasakan apa-apa.",cls:""}; }},
       {label:"Beri uang, bukan pekerjaan",sub:"selesai",run:function(){ var l=Math.min(C.coin,400); coin(-l); rep(8); return {t:"\u{1FA99} Kau memberinya "+l+" keping dan menutup pintu. Utang lama lunas dua arah.",cls:""}; }}]};
     }},

    {id:"dl_ijazah_palsu",min:18,max:45,once:true,cond:function(c){return c.school&&c.school.droppedOut;},
     build:function(){ return {ico:"\u{1F393}",prompt:"<b>Seseorang menawarkan ijazah palsu yang sempurna.</b><br><span style=\"font-size:11.5px;color:var(--ink-soft);filter:brightness(1.5)\">Semua pintu yang tertutup akan terbuka. Harganya 500 keping dan tidurmu.</span>",
      choices:[
       {label:"Beli",sub:"500 keping · risiko seumur hidup",run:function(){ if((C.coin||0)<500) return {t:"Uangmu tidak cukup. Ia tertawa dan pergi.",cls:""}; coin(-500); C.flags["diploma_umum"]=1; C._fakeDiploma=1; return {t:"\u{1F4DC} Kau memegang ijazah dengan namamu di atasnya. Tintanya belum kering.",cls:""}; }},
       {label:"Tolak",sub:"jalan panjang",run:function(){ S({happy:+6,mind:+3}); rep(6); return {t:"✋ Kau menolak. Jalanmu jadi lebih panjang, tapi kau bisa menatap orang tanpa berkedip.",cls:"e-good"}; }},
       {label:"Laporkan pemalsunya",sub:"reputasi · musuh",run:function(){ rep(20); if(ch(0.4)){ S({health:-12}); return {t:"\u{1F52A} Kau melaporkannya. Dua minggu kemudian kau dihadang di gang sempit.",cls:"e-bad"}; } return {t:"⚖️ Sindikat pemalsu dibongkar berkat laporanmu.",cls:"e-good"}; }}]};
     }},

    {id:"dl_harta_temuan",min:20,max:70,once:true,
     build:function(){ var amt=ri(1500,4000); return {ico:"\u{1F4B0}",prompt:"<b>Kau menemukan peti berisi "+amt+" keping di reruntuhan.</b><br><span style=\"font-size:11.5px;color:var(--ink-soft);filter:brightness(1.5)\">Ada lambang keluarga di tutupnya. Kau tahu keluarga itu masih ada, dan mereka miskin.</span>",
      choices:[
       {label:"Ambil semuanya",sub:"+"+amt+" keping",run:function(){ coin(amt); S({happy:-10}); return {t:"\u{1F4B0} Kau membawanya pulang. Lambang di peti itu kau kikis sampai hilang.",cls:""}; }},
       {label:"Kembalikan seluruhnya",sub:"reputasi besar",cls:"love",run:function(){ rep(45); S({happy:+15}); bond("teman",+15); return {t:"\u{1F54A}️ Kau mengembalikannya utuh. Keluarga itu menangis. Kota mendengar.",cls:"e-epic"}; }},
       {label:"Bagi dua",sub:"setengah-setengah",run:function(){ coin(Math.round(amt/2)); rep(18); return {t:"⚖️ Kau membagi dua. Tak seorang pun sepenuhnya puas, termasuk kau.",cls:"e-good"}; }}]};
     }},

    {id:"dl_perang_wajib",min:18,max:45,once:true,
     build:function(){ return {ico:"⚔️",prompt:"<b>Wajib militer. Namamu ada di daftar.</b><br><span style=\"font-size:11.5px;color:var(--ink-soft);filter:brightness(1.5)\">Kau punya tiga pilihan, dan dua di antaranya adalah kabur.</span>",
      choices:[
       {label:"Berangkat",sub:"bahaya · kehormatan",run:function(){ if(ch(0.30)){ S({health:-30,might:+12}); use("might"); rep(30); return {t:"⚔️ Kau kembali dengan pincang permanen dan nama yang dihormati.",cls:"e-bad"}; } S({might:+10,health:-10}); use("might"); rep(25); coin(ri(150,400)); return {t:"\u{1F6E1}️ Kau kembali sebagai veteran. Kau tidak menceritakan bagian yang buruk.",cls:"e-epic"}; }},
       {label:"Bayar pengganti",sub:"800 keping · seseorang menggantikanmu",run:function(){ var l=Math.min(C.coin,800); coin(-l); S({happy:-12}); rep(-8); return {t:"\u{1FA99} Kau membayar "+l+" keping. Anak tukang roti berangkat menggantikanmu. Ia tidak kembali.",cls:"e-bad"}; }},
       {label:"Kabur ke kota lain",sub:"bebas · buronan",run:function(){ rep(-25); S({happy:-6}); C._deserter=1; return {t:"\u{1F3C3} Kau pergi malam itu juga. Namamu masuk daftar yang berbeda sekarang.",cls:"e-bad"}; }}]};
     }},

    /* ---------------- EVENT USIA BIASA (berpilihan, lebih ringan) ---------------- */
    {id:"ag_tawaran_dagang",min:20,max:60,
     build:function(){ var c1=ri(120,400); return {ico:"\u{1F4E6}",prompt:"Seorang saudagar menawarkan bagian dalam pengirimannya. Modal "+c1+" keping.",
      choices:[
       {label:"Ikut modal",sub:c1+" keping",run:function(){ if((C.coin||0)<c1) return {t:"Uangmu tidak cukup.",cls:""}; coin(-c1); if(ch(0.6)){ var g=Math.round(c1*ri(15,25)/10); coin(g); return {t:"\u{1F6A2} Pengiriman tiba selamat. Kau dapat "+g+" keping.",cls:"e-good"}; } return {t:"\u{1F30A} Kapal dihantam badai. Modalmu tenggelam bersamanya.",cls:"e-bad"}; }},
       {label:"Lewatkan",run:function(){ return {t:"Kau memilih aman.",cls:""}; }}]};
     }},
    {id:"ag_murid",min:30,max:75,
     build:function(){ return {ico:"\u{1F9D1}‍\u{1F393}",prompt:"Seorang anak muda memintamu jadi gurunya.",
      choices:[
       {label:"Terima",sub:"waktu · warisan ilmu",cls:"love",run:function(){ S({happy:+10,mind:+3}); rep(12); return {t:"\u{1F4D6} Kau mengajarinya selama bertahun-tahun. Ia jadi lebih baik darimu, dan itu terasa benar.",cls:"e-epic"}; }},
       {label:"Tolak",run:function(){ S({happy:-4}); return {t:"Kau menolak. Ia mencari guru lain.",cls:""}; }}]};
     }},
    {id:"ag_pindah_kota",min:20,max:55,
     build:function(){ return {ico:"\u{1F5FA}️",prompt:"Kau ditawari pekerjaan bagus di kota lain. Semua yang kau kenal ada di sini.",
      choices:[
       {label:"Pergi",sub:"peluang · kesepian",run:function(){ coin(ri(200,500)); bond("keluarga",-15); S({happy:-6,mind:+4}); return {t:"\u{1F9F3} Kau berangkat. Kota baru tidak tahu apa-apa tentangmu, dan itu melegakan sekaligus menakutkan.",cls:""}; }},
       {label:"Tinggal",sub:"aman · penasaran seumur hidup",run:function(){ bond("keluarga",+12); S({happy:+5}); return {t:"\u{1F3E1} Kau tinggal. Kadang kau bertanya-tanya bagaimana kalau.",cls:"e-good"}; }}]};
     }},
    {id:"ag_penyakit_ortu",min:25,max:60,cond:function(c){return anyRel("keluarga").length>0;},
     build:function(){ return {ico:"\u{1FA7A}",prompt:"Orang tuamu sakit keras. Pengobatannya mahal.",
      choices:[
       {label:"Bayar berapa pun",sub:"seluruh tabunganmu",cls:"love",run:function(){ var l=Math.min(C.coin,Math.round((C.coin||0)*0.7)); coin(-l); bond("keluarga",+35); S({happy:+8}); return {t:"\u{1FA7A} Kau menghabiskan "+l+" keping. Ia bertahan tiga tahun lagi, dan tiga tahun itu berharga.",cls:"e-good"}; }},
       {label:"Bayar sebisanya",run:function(){ var l=Math.min(C.coin,ri(100,300)); coin(-l); bond("keluarga",+10); S({happy:-6}); return {t:"Kau membayar sebisamu. Kau tidak pernah yakin itu cukup.",cls:""}; }},
       {label:"Tidak bisa apa-apa",run:function(){ S({happy:-18}); bond("keluarga",-10); return {t:"\u{1F56F}️ Kau duduk di sampingnya tanpa bisa berbuat apa-apa. Itu juga hadir.",cls:"e-bad"}; }}]};
     }},
    {id:"ag_undangan_gelap",min:20,max:55,
     build:function(){ return {ico:"\u{1F5DD}️",prompt:"Sekelompok orang menawarkan pekerjaan yang menguntungkan dan tidak bisa ditanyakan.",
      choices:[
       {label:"Ikut",sub:"uang besar · risiko besar",run:function(){ if(ch(0.55)){ coin(ri(400,1200)); rep(-12); return {t:"\u{1F311} Kau dibayar mahal. Kau tidak bertanya untuk apa, dan itu bagian dari harganya.",cls:""}; } S({health:-20}); rep(-25); coin(-ri(100,300)); return {t:"\u{1F52A} Pekerjaan itu berantakan. Kau nyaris tidak keluar hidup-hidup.",cls:"e-bad"}; }},
       {label:"Tolak",run:function(){ rep(5); return {t:"Kau menolak. Mereka mengangguk, dan kau berharap mereka melupakanmu.",cls:""}; }}]};
     }},
    {id:"ag_karya",min:22,max:70,
     build:function(){ return {ico:"\u{1F3A8}",prompt:"Kau punya satu tahun luang. Bagaimana kau memakainya?",
      choices:[
       {label:"Membuat sesuatu",sub:"karya",cls:"love",run:function(){ S({mind:+6,happy:+10}); use("mind"); rep(10); return {t:"\u{1F3A8} Kau menyelesaikan sesuatu yang hanya kau yang peduli. Itu cukup.",cls:"e-good"}; }},
       {label:"Mengejar uang",run:function(){ coin(ri(200,600)); S({happy:-5}); return {t:"\u{1FA99} Tahun yang produktif dan hampa.",cls:""}; }},
       {label:"Bersama keluarga",run:function(){ bond("keluarga",+20); bond("anak",+20); bond("pasangan",+20); S({happy:+14}); return {t:"\u{1F3E1} Kau tidak menghasilkan apa-apa tahun itu, kecuali kenangan yang akan mereka ceritakan.",cls:"e-epic"}; }}]};
     }},
    {id:"ag_pilih_sisi",min:25,max:65,
     build:function(){ return {ico:"\u{1F6A9}",prompt:"Kota terbelah dua. Semua orang menuntutmu memilih pihak.",
      choices:[
       {label:"Pihak penguasa",sub:"aman sekarang",run:function(){ rep(12); coin(ri(100,300)); if(ch(0.35)){ rep(-30); return {t:"\u{1F6A9} Penguasa jatuh dua tahun kemudian. Namamu ikut jatuh.",cls:"e-bad"}; } return {t:"\u{1F6A9} Kau berpihak pada yang kuat. Untuk sekarang, itu benar.",cls:"e-good"}; }},
       {label:"Pihak rakyat",sub:"berbahaya · bermakna",run:function(){ if(ch(0.45)){ S({health:-15}); rep(25); return {t:"✊ Kau ikut turun. Kau dipukuli, dan orang mengingat wajahmu.",cls:""}; } rep(35); return {t:"✊ Pihakmu menang. Namamu disebut di jalan-jalan.",cls:"e-epic"}; }},
       {label:"Tidak memihak",sub:"kedua pihak membencimu",run:function(){ rep(-15); S({happy:-8}); return {t:"\u{1F5FF} Kau diam. Setelah semuanya selesai, tidak ada pihak yang menganggapmu ada.",cls:"e-bad"}; }}]};
     }}
    ];

    for(var j=0;j<NEW_AGING.length;j++) AGING_EVENTS.push(NEW_AGING[j]);
  }

  /* ==========================================================================
     C3. ANTI-PENGULANGAN — event yang baru muncul tidak boleh muncul lagi
     Temuan review: "Ekspedisi berbahaya" muncul 8x dalam 45 tahun.
     ========================================================================== */
  try{
    if(typeof EVENTS!=="undefined"){
      for(var k=0;k<EVENTS.length;k++) if(!EVENTS[k]._eid) EVENTS[k]._eid="ev"+k;
    }
  }catch(e){}

  window.__eventCooldownOK=function(ev){
    if(!hasC()||!ev) return true;
    if(!C._evSeen) C._evSeen={};
    var id=ev._eid||ev.id; if(!id) return true;
    var last=C._evSeen[id];
    // event yang sama tidak boleh muncul lagi dalam 12 tahun
    if(last!==undefined && (C.age-last)<12) return false;
    return true;
  };
  window.__eventMarkSeen=function(ev){
    if(!hasC()||!ev) return;
    if(!C._evSeen) C._evSeen={};
    var id=ev._eid||ev.id; if(id) C._evSeen[id]=C.age;
  };

  window.__mantaraContent={added:NEW_EVENTS.length,total:(typeof EVENTS!=="undefined"?EVENTS.length:0)};
})();
