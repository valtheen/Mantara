/* ==================================================================
   MANTARA v25 — PILAR 3: JALAN LANGKA
   ------------------------------------------------------------------
   Masalah yang diperbaiki (dari Rencana Fitur v25):
   Ada 11 karir, semuanya duniawi — petani, penjaga, pandai besi, tabib,
   bard, pencuri. Syarat tertingginya cuma `might>=65 && reputation>=10`.
   Tidak ada satu pun karir yang terasa seperti PENCAPAIAN, dan tidak ada
   tujuan jangka panjang yang menarik pemain melewati usia 30.

   Delapan Jalan Langka duduk sebagai tingkat kedua di atas CAREERS.
   Tiga aturan yang membuatnya bekerja:

     1. DIUNDANG, BUKAN DILAMAR. Syarat terpenuhi -> seseorang mendatangimu.
        Jalan Langka sengaja TIDAK muncul di daftar lowongan (ditandai
        `rare:true`; tiga penyaring daftar kerja lama melewatinya).
     2. SATU JALAN PER NYAWA. Memilih satu menutup semua yang lain sampai
        kau mati. Itu yang membuat pilihannya berat — dan nyawa berikutnya
        terasa berbeda.
     3. ADA HARGANYA. Tiap jalan punya risiko tahunan sungguhan, bukan
        sekadar gaji lebih besar. Penjaga Krip diburu Inkuisisi; Pemburu
        Naga bisa mati tiap kontrak; Tangan Kiri Raja jatuh bersama rajanya.

   Yang dicatat wangsa: jalan yang pernah ditempuh leluhur tersimpan di
   `mantara_jalan_langka_v1` dan memberi keturunanmu keuntungan kecil —
   sambungan ke Kronik Wangsa nanti.

   Ditulis sebagai modul bus: tidak menimpa satu fungsi global pun kecuali
   menambah entri ke CAREERS (supaya gaji, promosi, jenjang, dan seluruh
   UI karir lama bekerja tanpa diubah).
   ================================================================== */
Mantara.module("jalanlangka", function(M){
  "use strict";
  var U = M.u;

  function st(){
    if(!U.alive()) return null;
    if(!C._jalan) C._jalan = {taken:null, offered:[], declined:[], since:0, tally:{}};
    if(!C._jalan.tally) C._jalan.tally = {};
    return C._jalan;
  }

  /* ---------- pembacaan keadaan yang dipakai syarat ---------- */
  function flyLv(){ try{ return (typeof mantaraFlyLevel==="function") ? (mantaraFlyLevel()||0) : 0; }catch(e){ return 0; } }
  function petsBonded(min){
    try{ return (C.pets||[]).filter(function(p){ return (p.bond||0)>=min; }).length; }catch(e){ return 0; }
  }
  function propheciesDone(){ try{ return (C.prophecy && C.prophecy.resolved) || 0; }catch(e){ return 0; } }
  function gearPlusMax(){
    try{ var g=C.gearPlus||{}, m=0; for(var k in g) if(g[k]>m) m=g[k]; return m; }catch(e){ return 0; }
  }
  function wasPolitician(){
    try{ return !!(C.polRole && C.polRole.role) || !!(C._jalan && C._jalan.tally.politik); }catch(e){ return false; }
  }

  /* ==================================================================
     DELAPAN JALAN
     Bentuknya sengaja sama dengan CAREERS (id/ico/name/basepay/ranks/
     statGain) supaya processCareer, promosi, Gaya Profesi, dan halaman
     Karir lama memperlakukannya seperti karir biasa.
     ================================================================== */
  var PATHS = [
    {
      id:"skyrider", ico:"🌀", name:"Penunggang Langit", basepay:95,
      ranks:["Kurir Angin","Penunggang Langit","Pengintai Awan","Panglima Langit"],
      statGain:{charm:+2, might:+1},
      needText:"tunggangan terbang tingkat 2+ · Pesona 60",
      need:function(){ return flyLv()>=2 && (C.stats.charm||0)>=60; },
      hook:"Seorang perempuan berjubah kulit mendarat di halamanmu tanpa suara. "
          +"“Kami melihat caramu terbang,” katanya. “Kami butuh yang begitu.”",
      harga:"Langit tidak mengampuni kesalahan. Tiap tahun ada risiko jatuh.",
      /* biaya: jatuh dari ketinggian */
      yearly:function(){
        var lv=flyLv();
        if(lv<=0){ U.log("🌀 Tanpa tunggangan terbang, tugasmu sebagai Penunggang Langit mandek. Gaji dipotong.","e-bad"); U.coin(-40); return; }
        var p = lv>=3 ? 0.05 : (lv>=2 ? 0.09 : 0.14);
        if(U.chance(p)){
          U.stats({health:-U.ri(10,26)});
          U.log("🌀 Angin geser merenggut kendalimu di atas jurang. Kau selamat — nyaris.","e-bad");
          if((C.stats.health||0)<=0 && typeof die==="function") die("Kau jatuh dari langit Aetheria.");
        }else if(U.chance(0.22)){
          var upah=U.ri(40,120);
          U.coin(upah); C.reputation=(C.reputation||0)+2;
          U.log("🌀 Kau mengantar titah mendesak lintas kota dalam satu malam. +"+U.money(upah)+" keping.","e-good");
        }
      }
    },
    {
      id:"beastmaster", ico:"🦄", name:"Penjinak Bestia", basepay:85,
      ranks:["Perawat Kandang","Penjinak","Empu Bestia","Penutur Bestia"],
      statGain:{charm:+3, health:+1},
      needText:"3 bestia dengan ikatan 80+",
      need:function(){ return petsBonded(80)>=3; },
      hook:"Seorang tua berbau jerami dan belerang mengamati kandangmu lama sekali. "
          +"“Mereka mendengarkanmu,” katanya. “Itu tidak bisa diajarkan.”",
      harga:"Kandangmu jadi tanggung jawab, bukan hiasan — biaya rawat naik.",
      yearly:function(){
        var n=(C.pets||[]).length;
        var rawat=n*U.ri(4,9);
        if(rawat) U.coin(-rawat);
        /* satu-satunya jalan mendapat telur naga */
        if(U.chance(0.10) && n < 6){
          U.log("🥚 Salah satu bestiamu bertelur. Kau merawatnya diam-diam.","e-epic");
          if(!C._jalan.tally.telur) C._jalan.tally.telur=0;
          C._jalan.tally.telur++;
        }
        if(U.chance(0.20)){
          var jual=U.ri(50,150)+n*8;
          U.coin(jual);
          U.log("🦄 Kau membiakkan dan menjual seekor bestia terlatih. +"+U.money(jual)+" keping.","e-good");
        }
      }
    },
    {
      id:"dragonhunter", ico:"🐉", name:"Pemburu Naga", basepay:110,
      ranks:["Pemikul Tombak","Pemburu Naga","Pemburu Ulung","Pembunuh Wyrm"],
      statGain:{might:+4, health:-2}, dangerous:true,
      needText:"Kekuatan 80 · pernah menaklukkan bestia tingkat 4",
      need:function(){
        if((C.stats.might||0)<80) return false;
        try{ if((C.pets||[]).some(function(p){ return (p.level||1)>=4; })) return true; }catch(e){}
        return (C._jalan && C._jalan.tally.bestiaBesar)>=1;
      },
      hook:"Kontrak berpaku di pintu kedai, ditulis dengan tangan gemetar. "
          +"Angkanya cukup untuk hidup setahun. Yang meminta tidak menyebut nama.",
      harga:"Tiap kontrak bisa jadi kontrak terakhirmu.",
      yearly:function(){
        if(!U.chance(0.55)) return;
        var kuat=(C.stats.might||0) + ((C.gearPlus&&C.gearPlus.weapon||0)*4);
        var berat=U.ri(55,115);
        /* QA: dengan Kekuatan 99 + senjata +5 (kuat 119) kontrak dulu TIDAK
           PERNAH gagal — risiko yang cuma jadi hiasan. 8% nasib buruk tidak
           bisa dibeli dengan angka, jadi tiap kontrak tetap taruhan. */
        if(kuat >= berat && !U.chance(0.08)){
          var bayar=U.ri(120,320);
          U.coin(bayar); C.reputation=(C.reputation||0)+4;
          U.stats({might:+1});
          C._jalan.tally.naga=(C._jalan.tally.naga||0)+1;
          U.log("🐉 Kontrak tuntas. Kepalanya kau serahkan, bayarannya kau bawa pulang. +"+U.money(bayar)+" keping.","e-epic");
        }else{
          var luka=U.ri(14,34);
          U.stats({health:-luka});
          U.log("🐉 Ia lebih besar dari yang tertulis di kontrak. Kau pulang berdarah.","e-bad");
          if((C.stats.health||0)<=0 && typeof die==="function") die("Kontrak terakhirmu ternyata benar-benar yang terakhir.");
        }
      }
    },
    {
      id:"seer", ico:"🕯️", name:"Pembaca Nubuat", basepay:90,
      ranks:["Pembaca Tanda","Pembaca Nubuat","Penafsir Agung","Suara Takdir"],
      statGain:{mind:+3, mana:+2},
      needText:"tuntaskan 2 ramalan seumur hidup",
      need:function(){ return propheciesDone()>=2; },
      hook:"Perempuan bermata putih menunggumu di ambang pintu. “Kau sudah dua kali "
          +"menepati yang tertulis,” katanya. “Sekarang bacakan untuk orang lain.”",
      harga:"Yang kau lihat tidak selalu ingin kau lihat.",
      yearly:function(){
        if(U.chance(0.35)){
          var upah=U.ri(35,105)+propheciesDone()*15;
          U.coin(upah); C.reputation=(C.reputation||0)+2;
          U.log("🕯️ Kau membacakan takdir seorang bangsawan. Ia membayar mahal untuk tidur nyenyak. +"+U.money(upah)+" keping.","e-good");
        }
        if(U.chance(0.12)){
          U.stats({happy:-U.ri(4,11)});
          U.log("🕯️ Kau melihat akhir hidup seseorang yang kau sayangi — dan tidak boleh mengatakannya.","e-bad");
        }
      }
    },
    {
      id:"lefthand", ico:"🗝️", name:"Tangan Kiri Raja", basepay:105,
      ranks:["Telinga di Dinding","Tangan Kiri","Kepala Bayangan","Bayangan Takhta"],
      statGain:{mind:+3, charm:+2},
      needText:"Reputasi 90 · pernah menjabat di jalur politik",
      need:function(){ return (C.reputation||0)>=90 && wasPolitician(); },
      hook:"Sepucuk surat tanpa segel. Isinya satu kalimat: “Raja tidak butuh pedang lagi. "
          +"Ia butuh seseorang yang tahu siapa yang berbisik.”",
      harga:"Kau jatuh bersama rajamu.",
      yearly:function(){
        if(U.chance(0.30)){
          var suap=U.ri(55,175);
          U.coin(suap);
          U.log("🗝️ Sebuah rahasia berpindah tangan. Kau tidak bertanya untuk apa. +"+U.money(suap)+" keping.","e-good");
        }
        /* jaringan mata-mata: bisa menjatuhkan penguasa kota */
        if(U.chance(0.08)){
          C._jalan.tally.jatuh=(C._jalan.tally.jatuh||0)+1;
          C.reputation=(C.reputation||0)+6;
          U.log("🗝️ Seorang gubernur turun dari kursinya pagi ini. Tidak ada yang tahu sebabnya. Kau tahu.","e-epic");
        }
        if(U.chance(0.07)){
          C.reputation=Math.max(0,(C.reputation||0)-U.ri(10,22));
          U.stats({happy:-U.ri(3,9)});
          U.log("🗝️ Rajamu goyah — dan semua yang berdiri di bayangannya ikut goyah.","e-bad");
        }
      }
    },
    {
      id:"relicsmith", ico:"⚗️", name:"Empu Pusaka", basepay:100,
      ranks:["Penempa Nama","Empu Pusaka","Empu Wangsa","Empu Legenda"],
      statGain:{might:+2, mind:+2},
      needText:"Pandai Besi jenjang tertinggi · satu pusaka +5",
      need:function(){
        var maxRank = (C.career==="blacksmith" && (C.careerLevel||0)>=3);
        return (maxRank || (C._jalan && C._jalan.tally.empu)) && gearPlusMax()>=5;
      },
      hook:"Palumu berhenti sendiri di tengah ayunan. Seorang empu tua yang kau kira sudah mati "
          +"berdiri di ambang bengkel. “Yang kau tempa tadi punya nama,” katanya.",
      harga:"Karya seumur hidup butuh bahan seumur hidup — biayanya besar.",
      yearly:function(){
        var bahan=U.ri(30,90);
        U.coin(-bahan);
        if(U.chance(0.28)){
          var bayar=U.ri(130,360);
          U.coin(bayar); C.reputation=(C.reputation||0)+3;
          C._jalan.tally.pusaka=(C._jalan.tally.pusaka||0)+1;
          U.log("⚗️ Sebuah wangsa memesan pusaka bernama darimu. Ia akan diwariskan lebih lama dari kita berdua. +"+U.money(bayar)+" keping.","e-epic");
        }
      }
    },
    {
      id:"cryptkeeper", ico:"🌑", name:"Penjaga Krip", basepay:115,
      ranks:["Penjaga Pintu","Penjaga Krip","Pewaris Bisikan","Suara di Bawah"],
      statGain:{mana:+4, happy:-2}, shady:true,
      needText:"Mana 75 · Reputasi di bawah 20",
      need:function(){ return (C.stats.mana||0)>=75 && (C.reputation||0)<20; },
      hook:"Tidak ada yang mengetuk. Pintumu hanya terbuka, dan sebuah kunci besi dingin "
          +"tergeletak di lantai. Kau tahu krip mana yang dibukanya.",
      harga:"Inkuisisi memburu. Keluargamu menjauh.",
      yearly:function(){
        var bayar=U.ri(85,230);
        U.coin(bayar);
        if(U.chance(0.30)){
          C.reputation=Math.max(0,(C.reputation||0)-U.ri(4,10));
          U.log("🌑 Desas-desus soal apa yang kau simpan di bawah tanah menyebar.","e-bad");
        }
        if(U.chance(0.13)){
          U.stats({health:-U.ri(8,20), happy:-U.ri(5,12)});
          U.log("🌑 Inkuisisi menggeledah rumahmu. Kau lolos — kali ini.","e-bad");
        }
        /* keluarga menjauh: ikatan relasi terkikis */
        if(U.chance(0.25)){
          try{
            var fam=(C.relations||[]).filter(function(r){ return r.role==="keluarga"; });
            if(fam.length){ var r=U.pick(fam); r.bond=Math.max(0,(r.bond||50)-U.ri(4,11)); }
          }catch(e){}
        }
      }
    },
    {
      id:"plaguedoctor", ico:"⚕️", name:"Tabib Wabah", basepay:95,
      ranks:["Pembawa Kapur","Tabib Wabah","Tabib Kota","Tabib Agung Wabah"],
      statGain:{mind:+3, health:+1},
      needText:"ijazah tabib · selamat dari satu tahun wabah",
      need:function(){
        var ijazah=!!(C.flags && (C.flags.diploma_tabib || C.flags.diploma_healer));
        return (ijazah || C.career==="healer") && !!(C.flags && C.flags.plagueImmune);
      },
      hook:"Topeng berparuh panjang tergeletak di meja periksamu, entah oleh siapa. "
          +"Di dalamnya sepucuk daftar: nama-nama kota yang belum punya siapa pun.",
      harga:"Dipuja saat krisis, dicurigai saat damai.",
      yearly:function(){
        if(!C.flags) C.flags={};
        C.flags.plagueImmune=1;                    /* kebal wabah, selamanya */
        if(U.chance(0.30)){
          var upah=U.ri(45,140);
          U.coin(upah); C.reputation=(C.reputation||0)+5;
          U.log("⚕️ Kau menahan wabah di satu distrik sebelum menyebar. Kota mengingatnya. +"+U.money(upah)+" keping.","e-good");
        }else if(U.chance(0.18)){
          C.reputation=Math.max(0,(C.reputation||0)-U.ri(2,6));
          U.log("⚕️ Damai membuat orang lupa. Topengmu kini hanya menakutkan anak-anak.","e-bad");
        }
      }
    }
  ];

  function pathOf(id){ for(var i=0;i<PATHS.length;i++) if(PATHS[i].id===id) return PATHS[i]; return null; }
  M.PATHS = PATHS;

  /* ---------------------------------------------------------------
     Didaftarkan ke CAREERS supaya seluruh mesin karir lama (gaji,
     jenjang, promosi, Gaya Profesi, halaman Karir) bekerja apa adanya.
     `rare:true` menandai agar TIDAK muncul di daftar lowongan —
     tiga penyaring lama sudah diajari melewatinya.
     `req` selalu false: satu-satunya pintu masuk adalah undangan.
     --------------------------------------------------------------- */
  M.on("boot", function(){
    try{
      if(typeof CAREERS==="undefined" || !Array.isArray(CAREERS)) return;
      PATHS.forEach(function(p){
        if(CAREERS.some(function(c){ return c.id===p.id; })) return;
        CAREERS.push((function(pid){
          return {
            id:p.id, ico:p.ico, name:p.name, basepay:p.basepay,
            ranks:p.ranks, statGain:p.statGain, rare:true, shady:!!p.shady,
            /* Satu-satunya pintu masuk adalah undangan: applyCareer() lama
               menolak kalau req() gagal, jadi req di sini hanya lulus ketika
               modul ini menaruh tiket sekali pakai di C._jalan.grantId. */
            req:function(c){ try{ return !!(c && c._jalan && c._jalan.grantId===pid); }catch(e){ return false; } }
          };
        })(p.id));
      });
    }catch(e){}
  }, 10);

  /* ---------------------------------------------------------------
     UNDANGAN — satu tawaran per tahun, maksimal; ditolak boleh datang lagi
     --------------------------------------------------------------- */
  function eligible(){
    var s=st(); if(!s) return [];
    return PATHS.filter(function(p){
      if(s.taken) return false;
      try{ return !!p.need(); }catch(e){ return false; }
    });
  }

  function invite(p){
    var s=st(); if(!s) return;
    s.offered.push(p.id);
    U.music("ceremony");
    U.ask({
      ico:p.ico, cancel:false,
      prompt:"<b>Jalan Langka — "+p.name+"</b><br>"
        +"<span style='font-size:12px;line-height:1.65;color:var(--ink-soft);filter:brightness(1.6)'>"+p.hook+"</span>"
        +"<div style='margin-top:9px;font-size:11px;color:var(--gold)'>Harganya: "+p.harga+"</div>"
        +"<div style='margin-top:5px;font-size:10.5px;color:var(--ink-soft);filter:brightness(1.5)'>"
        +"Menerima satu Jalan Langka menutup tujuh sisanya sampai akhir hayatmu.</div>",
      choices:[
        {label:"Terima "+p.ico+" "+p.name, cls:"", run:function(){
          take(p);
          return {t:p.ico+" Kau menempuh Jalan Langka: <b>"+p.name+"</b>.", cls:"e-epic"};
        }},
        {label:"Belum — aku punya jalanku sendiri", cls:"danger", run:function(){
          s.declined.push(p.id);
          return {t:"Kau menolak. Tawaran seperti itu jarang datang dua kali — tapi bukan tidak pernah.", cls:""};
        }}
      ]
    });
  }

  function take(p){
    var s=st(); if(!s) return;
    s.taken=p.id; s.since=C.age;
    s.grantId=p.id;                                   /* tiket sekali pakai */
    try{ if(typeof applyCareer==="function") applyCareer(p.id); }catch(e){}
    s.grantId=null;
    U.anim("win", {text:"JALAN LANGKA"});
    U.sfx("levelup");
    rememberPath(p);
  }

  function rememberPath(p){
    try{
      var raw=localStorage.getItem("mantara_jalan_langka_v1");
      var arr=raw?JSON.parse(raw):[];
      arr.unshift({id:p.id, name:p.name, ico:p.ico, by:C.name, age:C.age});
      if(arr.length>12) arr.pop();
      localStorage.setItem("mantara_jalan_langka_v1", JSON.stringify(arr));
    }catch(e){}
  }
  function ancestorPaths(){
    try{ var raw=localStorage.getItem("mantara_jalan_langka_v1"); return raw?JSON.parse(raw):[]; }catch(e){ return []; }
  }
  M.ancestorPaths = ancestorPaths;

  /* ---------------------------------------------------------------
     SIKLUS TAHUNAN
     --------------------------------------------------------------- */
  M.on("year:end", function(){
    var s=st(); if(!s) return;

    /* jejak untuk syarat yang butuh riwayat, bukan keadaan saat ini */
    try{
      if(C.polRole && C.polRole.role) s.tally.politik=1;
      if(C.career==="blacksmith" && (C.careerLevel||0)>=3) s.tally.empu=1;
      if((C.pets||[]).some(function(p){ return (p.level||1)>=4; })) s.tally.bestiaBesar=1;
    }catch(e){}

    /* harga tahunan dari jalan yang sedang ditempuh */
    if(s.taken){
      if(C.career!==s.taken){
        /* keluar dari Jalan Langka = keluar untuk selamanya (sekali catat) */
        var lepas=pathOf(s.taken);
        U.log("Kau meninggalkan Jalan "+(lepas?lepas.name:"Langka")+". Pintu itu tidak terbuka dua kali.","e-bad");
        s.taken="__lepas";
      }else{
        var p=pathOf(s.taken);
        if(p && p.yearly){ try{ p.yearly(); }catch(e){} }
      }
      return;
    }
    if(s.taken==="__lepas") return;

    /* undangan: butuh usia kerja, dan tidak menimpa modal lain */
    if(C.age < 18) return;
    var kandidat = eligible();
    if(!kandidat.length) return;
    /* yang belum pernah ditawarkan didahulukan; yang ditolak menunggu 4 tahun */
    var baru = kandidat.filter(function(p){ return s.offered.indexOf(p.id)<0; });
    var pilih = baru.length ? U.pick(baru)
              : (U.chance(0.25) ? U.pick(kandidat) : null);
    if(!pilih) return;
    setTimeout(function(){ try{ if(U.alive() && !st().taken) invite(pilih); }catch(e){} }, 900);
  }, -20);

  /* ---------------------------------------------------------------
     WARISAN — jalan leluhur memberi keturunan awal yang sedikit lebih baik
     --------------------------------------------------------------- */
  M.on("char:born", function(ctx){
    if(!ctx.heir || !U.alive()) return;
    var arr=ancestorPaths(); if(!arr.length) return;
    var leluhur=arr[0];
    setTimeout(function(){
      try{
        if(!U.alive()) return;
        var bonus="";
        if(leluhur.id==="beastmaster"){ C._jalan=st(); C._jalan.tally.bestiaMurah=1; bonus="Pedagang bestia mengenali nama keluargamu — harganya lebih lunak."; }
        else if(leluhur.id==="dragonhunter"){ U.stats({might:+3}); bonus="Darah pemburu mengalir. Kekuatan +3."; }
        else if(leluhur.id==="seer"){ U.stats({mana:+3}); bonus="Mata leluhurmu ikut terbuka. Mana +3."; }
        else if(leluhur.id==="relicsmith"){ U.stats({might:+2, mind:+2}); bonus="Tangan empu diwariskan. Kekuatan & Akal +2."; }
        else if(leluhur.id==="lefthand"){ C.reputation=(C.reputation||0)+12; bonus="Jaringan lama masih mengingat wangsamu. Reputasi +12."; }
        else if(leluhur.id==="cryptkeeper"){ U.stats({mana:+4}); C.reputation=Math.max(0,(C.reputation||0)-8); bonus="Sesuatu di bawah tanah masih mengenalmu. Mana +4, Reputasi -8."; }
        else if(leluhur.id==="plaguedoctor"){ if(!C.flags)C.flags={}; C.flags.plagueImmune=1; bonus="Kau lahir kebal wabah."; }
        else if(leluhur.id==="skyrider"){ U.stats({charm:+3}); bonus="Nama keluargamu masih disebut di pos-pos langit. Pesona +3."; }
        if(bonus) U.log(leluhur.ico+" Leluhurmu <b>"+U.esc(leluhur.by||"")+"</b> menempuh Jalan "+leluhur.name+". "+bonus, "e-epic");
      }catch(e){}
    }, 2400);
  });

  /* ---------------------------------------------------------------
     PANEL DI TAB HIDUP
     --------------------------------------------------------------- */
  M.on("hidup:render", function(ctx){
    var s=st(); if(!s) return;
    if(!s.taken || s.taken==="__lepas"){
      /* tampilkan progres hanya kalau ada yang sudah hampir tercapai */
      if(C.age<18) return;
      var dekat=PATHS.filter(function(p){ try{ return p.need(); }catch(e){ return false; } });
      if(!dekat.length) return;
      ctx.blocks.push(
        "<div class='jl-box'><div class='jl-head'>✦ Jalan Langka</div>"
        + "<div class='jl-sub'>Syaratmu sudah terpenuhi untuk "+dekat.length+" jalan. Seseorang akan datang.</div>"
        + dekat.map(function(p){ return "<div class='jl-row'><span class='jl-ico'>"+p.ico+"</span><span><b>"+p.name+"</b><span class='jl-need'>"+p.needText+"</span></span></div>"; }).join("")
        + "</div>");
      return;
    }
    var p=pathOf(s.taken); if(!p) return;
    var rank=(p.ranks[C.careerLevel||0])||p.ranks[0];
    ctx.blocks.push(
      "<div class='jl-box on'><div class='jl-head'>"+p.ico+" Jalan Langka · "+p.name+"</div>"
      + "<div class='jl-sub'><b>"+rank+"</b> · sejak usia "+s.since+"</div>"
      + "<div class='jl-need' style='margin-top:5px'>"+p.harga+"</div></div>");
  });

  /* gaya */
  M.on("boot", function(){
    if(document.getElementById("jalanStyle")) return;
    var el=document.createElement("style"); el.id="jalanStyle";
    el.textContent =
      ".jl-box{margin:8px 4px 10px;padding:9px 11px;border:1px solid rgba(240,192,64,.22);border-radius:12px;"
     +"background:linear-gradient(160deg,rgba(46,34,18,.8),rgba(22,17,12,.8))}"
     +".jl-box.on{border-color:rgba(240,192,64,.5);box-shadow:inset 0 0 22px rgba(240,192,64,.05)}"
     +".jl-head{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold-bright);margin-bottom:5px}"
     +".jl-sub{font-size:11.5px;color:var(--parchment)}"
     +".jl-need{display:block;font-size:10px;color:var(--ink-soft);filter:brightness(1.7);margin-top:1px}"
     +".jl-row{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:11.5px}"
     +".jl-ico{font-size:16px;width:20px;text-align:center}";
    document.head.appendChild(el);
  });

  return {PATHS:PATHS, state:st, ancestorPaths:ancestorPaths};
});
