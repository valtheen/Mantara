/* ============================================================================
   MANTARA v24 — LAPIS A: Overlay, Kurva Stat, Umur, Identitas Origin
   ----------------------------------------------------------------------------
   Semua di sini membungkus fungsi lama; tidak ada modul lama yang dihapus.
   ============================================================================ */
(function(){
  "use strict";
  function hasC(){ return typeof C!=="undefined" && C && C.alive; }
  function _ri(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
  function _ch(p){ return Math.random()<p; }
  function _log(t,cls){ try{ if(typeof log==="function"&&C) log(C.age,t,cls||""); }catch(e){} }

  /* ==========================================================================
     A1. ANTREAN OVERLAY — modal / animasi / toast tidak boleh tumpuk
     Bug lama: animasi "LULUS!" (1500ms) menutupi modal kuis yang baru dibuka
     200ms kemudian oleh closeModal yang di-patch. Tiga lapis UI bersamaan.
     ========================================================================== */
  function clearAnimLayer(){
    try{ var l=document.getElementById("animLayer");
      if(l){ clearTimeout(l._tm); l.classList.remove("show"); l.innerHTML=""; } }catch(e){}
  }
  function clearToast(){
    try{ var t=document.getElementById("toast");
      if(t){ clearTimeout(t._tm); t.classList.remove("show"); } }catch(e){}
  }
  if(typeof openChoice==="function"){
    var _ocA=openChoice;
    window.openChoice=openChoice=function(){
      clearAnimLayer(); clearToast();
      return _ocA.apply(this,arguments);
    };
  }
  if(typeof showResult==="function"){
    var _srA=showResult;
    window.showResult=showResult=function(){
      clearAnimLayer(); clearToast();
      return _srA.apply(this,arguments);
    };
  }
  // playAnim: antre kalau modal terbuka, jangan dibuang diam-diam.
  var _animQueue=null;
  if(typeof playAnim==="function"){
    var _paA=playAnim;
    window.playAnim=playAnim=function(type,opts){
      var m=document.getElementById("modal");
      var open=m&&m.classList&&m.classList.contains("show");
      if(open&&(type==="win"||type==="lose"||type==="coin")){
        _animQueue={type:type,opts:opts||{}};
        return;
      }
      return _paA.apply(this,arguments);
    };
    if(typeof closeModal==="function"){
      var _cmA=closeModal;
      window.closeModal=closeModal=function(){
        var r=_cmA.apply(this,arguments);
        if(_animQueue){
          var q=_animQueue; _animQueue=null;
          setTimeout(function(){
            var m=document.getElementById("modal");
            if(!(m&&m.classList.contains("show"))) _paA(q.type,q.opts);
          },260);
        }
        return r;
      };
    }
  }

  /* ==========================================================================
     A2. KURVA STAT — soft cap di 70
     Temuan review: bot yang TIDAK melakukan apa-apa mencapai Kekuatan 100
     di usia 40 pada 9 dari 10 run. Separuh kedua tiap nyawa tanpa progresi.
     Sekarang perolehan di atas 70 diredam tajam; 100 harus benar-benar dikejar.
     Sisa pecahan disimpan supaya kenaikan kecil tidak hilang ditelan pembulatan.
     ========================================================================== */
  var SOFT_CAP=70;
  function gainMul(cur){
    if(cur<SOFT_CAP) return 1.0;
    if(cur<80)  return 0.42;
    if(cur<88)  return 0.24;
    if(cur<94)  return 0.12;
    if(cur<98)  return 0.06;
    return 0.025;
  }
  function earlyBoost(cur){ return cur<25 ? 1.25 : 1.0; }

  if(typeof applyStats==="function"){
    var _asA=applyStats;
    window.applyStats=applyStats=function(chg){
      if(!C||!C.stats||!chg) return _asA.apply(this,arguments);
      if(!C._statFrac) C._statFrac={};
      var out={};
      for(var k in chg){
        var d=chg[k];
        if(typeof C.stats[k]!=="number" || typeof d!=="number"){ out[k]=d; continue; }
        if(d<=0){ out[k]=d; continue; }              // penalti TIDAK diredam
        // health & happy adalah SUMBER DAYA, bukan progresi. Meredam pemulihannya
        // membuat karakter masuk spiral kematian (uji: mati usia 40 dengan health 4).
        if(k==="happy"||k==="health"){ out[k]=d; continue; }
        var cur=C.stats[k];
        var raw=d*gainMul(cur)*earlyBoost(cur) + (C._statFrac[k]||0);
        var whole=Math.floor(raw);
        C._statFrac[k]=raw-whole;
        out[k]=whole;
      }
      return _asA.call(this,out);
    };
  }

  /* --- Atrofi: stat yang tidak dilatih perlahan turun. 100 bukan permanen. --- */
  function statAtrophy(){
    if(!hasC()||!C.stats) return;
    if(!C._statUse) C._statUse={};
    var keys=["might","mind","mana","charm"];
    for(var i=0;i<keys.length;i++){
      var k=keys[i], v=C.stats[k]||0;
      var usedRecently=(C._statUse[k]||-99) >= C.age-2;
      if(v>SOFT_CAP && !usedRecently && _ch(0.55)){
        var drop=v>=95?2:1;
        C.stats[k]=Math.max(SOFT_CAP-5, v-drop);
      }
    }
  }
  window.__markStatUse=function(k){ if(hasC()){ if(!C._statUse)C._statUse={}; C._statUse[k]=C.age; } };

  /* ==========================================================================
     A3. UMUR YANG BERARTI — vitalitas, bukan RNG datar
     Temuan review: 8 dari 10 mati di rentang 69-76. Tidak ada ketegangan.
     Sekarang umur ditentukan gaya hidup: riwayat kesehatan, kekayaan (akses
     tabib), karir berbahaya, kebahagiaan, dan perk. Rentang jadi ~45 s/d ~95.
     ========================================================================== */
  var DANGEROUS=["knight","mercenary","hunter","sailor","miner","soldier","guard","adventurer","monsterhunter","executioner"];
  function vitality(){
    if(!C) return 0;
    var v=0;
    v += (C._healthAvg===undefined?(C.stats.health||60):C._healthAvg)*0.55;
    v += Math.min(18, Math.log10(Math.max(10,C.coin||0))*5);
    v += Math.min(10, (C.stats.happy||0)*0.10);
    if(C.properties&&C.properties.length) v+=4;
    if(DANGEROUS.indexOf(C.career)>=0) v-=12;
    if(C.flags&&C.flags.diploma_tabib) v+=6;
    try{ if(typeof hasTrait==="function"){ if(hasTrait("sehat"))v+=8; if(hasTrait("pemabuk"))v-=10; } }catch(e){}
    try{ if(typeof pv==="function") v+=pv("raga_tangguh")*3+pv("berkat_umur")*4; }catch(e){}
    return v;
  }
  function trackHealthAvg(){
    if(!C||!C.stats) return;
    var h=C.stats.health||0;
    C._healthAvg = (C._healthAvg===undefined) ? h : (C._healthAvg*0.88 + h*0.12);
  }
  function deathChance(){
    if(!C) return 0;
    var vt=vitality();                       // ~20..110
    var shift=(vt-62)/6;                     // tiap 6 poin vitalitas ~ +1 tahun umur
    var eff=C.age-shift;
    if(eff<35) return 0;
    var p=Math.pow(1.094, eff-35)*0.0009;
    if(C.stats.health<25) p*=2.2;
    if(C.stats.health<12) p*=2.0;
    return Math.min(0.45,p);
  }
  window.__mantaraVitality={vitality:vitality,deathChance:deathChance};

  var DEATH_LINES=[
    "Jantungmu berhenti di tengah tidur, tanpa pesan terakhir.",
    "Demam yang tak kunjung reda akhirnya merenggutmu.",
    "Tubuhmu menyerah di musim dingin yang terlalu panjang.",
    "Kau jatuh di tangga rumahmu sendiri, dan tidak bangun lagi.",
    "Nafas terakhirmu diambil dengan tenang, dikelilingi mereka yang menyayangimu.",
    "Luka lama yang tak pernah benar-benar sembuh akhirnya menang."
  ];
  function ageDeath(){
    var reason=DEATH_LINES[Math.floor(Math.random()*DEATH_LINES.length)];
    if(C.stats.health<20) reason="Tubuhmu sudah lama rapuh. Kali ini ia tidak bangkit lagi.";
    else if(DANGEROUS.indexOf(C.career)>=0 && _ch(0.35)) reason="Pekerjaanmu akhirnya menagih harganya.";
    try{ die(reason); }catch(e){}
  }

  /* ==========================================================================
     A4. IDENTITAS ORIGIN — origin harus tetap terasa di usia 40+
     Temuan review: Anak Petani dan Bangsawan berakhir hampir identik.
     Tiap origin kini punya "Jalan" yang terbuka di usia 25 dan memberi
     mekanik unik seumur hidup — bukan sekadar stat awal.
     ========================================================================== */
  var ORIGIN_PATHS={
    peasant:{ ico:"\u{1F33E}", name:"Jalan Tanah",
      desc:"Darah petani tidak pernah lupa cara bertahan. Ladang dan ternak menghasilkan lebih banyak — dan tahun paceklik tidak pernah benar-benar membunuhmu.",
      passive:"Tiap bisnis +14 keping/tahun · pulih lebih cepat saat sakit",
      yearly:function(){
        if(C.businesses&&C.businesses.length){ var b=C.businesses.length*14; C.coin+=b; return "\u{1F33E} Tanahmu menghasilkan "+b+" keping tambahan."; }
        if(C.stats.health<45){ C.stats.health=Math.min(100,C.stats.health+3); }
        return null;
      }},
    noble:{ ico:"\u{1F451}", name:"Jalan Darah Biru",
      desc:"Namamu membuka pintu yang tertutup bagi orang lain. Tapi setiap pintu yang terbuka mengundang mata yang mengawasi.",
      passive:"+3 reputasi/tahun · jalur politik lebih awal · 14% risiko intrik",
      yearly:function(){
        C.reputation=(C.reputation||0)+3;
        if(_ch(0.14)){ C.reputation=Math.max(0,C.reputation-_ri(6,14)); return "\u{1F5E1}️ Intrik istana menyerempet namamu."; }
        return null;
      }},
    mageborn:{ ico:"\u{1F52E}", name:"Jalan Nadi Arcane",
      desc:"Mana mengalir di darahmu tanpa perlu dipanggil. Inkuisisi tahu itu, dan mereka punya ingatan yang panjang.",
      passive:"+2 mana/tahun otomatis · 10% teror Inkuisisi",
      yearly:function(){
        if(C.stats.mana<95) C.stats.mana=Math.min(100,C.stats.mana+2);
        if(_ch(0.10)){ C.stats.happy=Math.max(0,C.stats.happy-8); return "\u{1F441}️ Kau merasa diawasi. Inkuisisi belum melupakanmu."; }
        return null;
      }},
    orphan:{ ico:"\u{1F5DD}️", name:"Jalan Lorong",
      desc:"Kau belajar sesuatu di jalanan yang tidak diajarkan sekolah manapun: cara jatuh tanpa mati.",
      passive:"22% pemasukan gelap/tahun · kerugian bencana dipotong 40%",
      yearly:function(){
        if(_ch(0.22)){ var g=_ri(20,70); C.coin+=g; return "\u{1F5DD}️ Koneksi lamamu di lorong kota membayar "+g+" keping."; }
        return null;
      }},
    merchant_kid:{ ico:"⚖️", name:"Jalan Timbangan",
      desc:"Kau bisa mencium harga yang salah dari seberang pasar. Kekayaan datang bukan dari kerja, tapi dari waktu.",
      passive:"+3,5% bunga kekayaan/tahun · harga beli -10%",
      yearly:function(){
        var g=Math.round(Math.max(0,C.coin||0)*0.035);
        if(g>0){ C.coin+=g; return "⚖️ Modalmu berbunga "+g+" keping."; }
        return null;
      }}
  };
  window.ORIGIN_PATHS=ORIGIN_PATHS;
  function myPath(){ return C?ORIGIN_PATHS[C.origin]:null; }
  window.__myOriginPath=myPath;

  function offerOriginPath(){
    if(!hasC()||C._pathTaken) return false;
    if(C.age<25) return false;
    var pth=myPath(); if(!pth) return false;
    C._pathTaken=1;
    try{
      openChoice({ico:pth.ico,cancel:false,
        prompt:"<b>"+pth.name+"</b><br><span style=\"font-size:12px;line-height:1.6;color:var(--ink-soft);filter:brightness(1.6)\">"+pth.desc+"</span><br><br><span style=\"font-size:11px;color:var(--gold)\">"+pth.passive+"</span>",
        choices:[
          {label:"Terima warisan asal-usulmu",cls:"love",run:function(){
            C._pathActive=1;
            return {t:pth.ico+" Kau menerima "+pth.name+". Asal-usulmu kini jadi kekuatan, bukan sekadar kenangan.",cls:"e-epic"};
          }},
          {label:"Tolak — aku bukan masa laluku",run:function(){
            C._pathActive=0;
            try{ if(window.MantaraExp&&window.MantaraExp.awardLegacy) window.MantaraExp.awardLegacy(25,"menolak takdir asal-usul"); }catch(e){}
            return {t:"\u{1F5FF} Kau memilih berdiri sendiri, lepas dari asal-usulmu. (+25 Warisan Jiwa)",cls:"e-good"};
          }}]});
      return true;
    }catch(e){ return false; }
  }
  function originYearly(){
    if(!hasC()||!C._pathActive) return;
    var pth=myPath(); if(!pth||!pth.yearly) return;
    try{ var msg=pth.yearly(); if(msg) _log(msg,"e-good"); }catch(e){}
  }

  /* ==========================================================================
     A5. HOOK TAHUNAN
     ========================================================================== */
  if(typeof advanceYear==="function"){
    var _ayA=advanceYear;
    window.advanceYear=advanceYear=function(){
      var r=_ayA.apply(this,arguments);
      if(!C||!C.alive) return r;
      try{ trackHealthAvg(); }catch(e){}
      try{ statAtrophy(); }catch(e){}
      try{ originYearly(); }catch(e){}
      try{ if(C.age>=35 && Math.random()<deathChance()){ ageDeath(); return r; } }catch(e){}
      try{ if(!C._pathTaken && C.age>=25 && typeof pendingChoice!=="undefined" && !pendingChoice) setTimeout(offerOriginPath,400); }catch(e){}
      return r;
    };
  }

  window.__mantaraBalance={SOFT_CAP:SOFT_CAP,gainMul:gainMul,vitality:vitality,
    deathChance:deathChance,statAtrophy:statAtrophy,offerOriginPath:offerOriginPath,
    ORIGIN_PATHS:ORIGIN_PATHS};
})();
