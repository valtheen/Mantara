/* ==================================================================
   MANTARA — IDENTITAS KOTA (tiap kota unik & khas)
   Aetheria   👑 Intrik Istana   — sumber daya: Segel Kerajaan 📜
   Thornvale  🌲 Perburuan Rimba — sumber daya: Herba Langka 🌿
   Saltmoor   ⚓ Ventura Laut     — sumber daya: Doubloon 🪙
   Frostspire 🗼 Riset Arcane     — sumber daya: Kristal Mana 💠
   Tiap kota punya aktivitas khas (berbasis halaman), sumber daya
   lokal yang dibelanjakan untuk hadiah unik, dan event khusus kota.
   Modul mandiri; pushPage/pgRow. Nyambung ke ekonomi, gear, dungeon.
   ================================================================== */
(function(){
  "use strict";
  function hasC(){ return typeof C!=="undefined" && C && C.alive; }
  function _ri(a,b){ return (typeof ri==="function")?ri(a,b):Math.floor(Math.random()*(b-a+1))+a; }
  function _ch(p){ return (typeof chance==="function")?chance(p):Math.random()<p; }
  function _rand(a){ return (typeof rand==="function")?rand(a):a[Math.floor(Math.random()*a.length)]; }
  function _log(t,cls){ try{ if(typeof log==="function") log(C.age,t,cls||""); }catch(e){} }
  function _toast(t){ try{ if(typeof toast==="function") toast(t); }catch(e){} }
  function _sfx(n){ try{ if(typeof playSFX==="function") playSFX(n); }catch(e){} }
  function _apply(o){ try{ if(typeof applyStats==="function") applyStats(o); }catch(e){} }
  function _addItem(k){ try{ if(typeof addItem==="function") addItem(k); }catch(e){} }
  function _news(t){ try{ if(typeof kAddNews==="function") kAddNews(t); }catch(e){} }
  function cityName(id){ try{ return (typeof cityOf==="function")?cityOf(id).name:id; }catch(e){ return id; } }

  var RES={ seal:{ico:"📜",name:"Segel Kerajaan"}, herb:{ico:"🌿",name:"Herba Langka"},
            doubloon:{ico:"🪙",name:"Doubloon"}, crystal:{ico:"💠",name:"Kristal Mana"} };
  function ensureRes(){ if(!hasC())return; if(!C.cityRes) C.cityRes={seal:0,herb:0,doubloon:0,crystal:0};
    ["seal","herb","doubloon","crystal"].forEach(function(k){ if(C.cityRes[k]==null)C.cityRes[k]=0; }); }
  function res(k){ ensureRes(); return C.cityRes[k]||0; }
  function addRes(k,n){ ensureRes(); C.cityRes[k]=Math.max(0,(C.cityRes[k]||0)+n); }
  function spendRes(k,n){ ensureRes(); if((C.cityRes[k]||0)<n) return false; C.cityRes[k]-=n; return true; }
  function resLine(){ ensureRes(); return "📜"+res("seal")+"  🌿"+res("herb")+"  🪙"+res("doubloon")+"  💠"+res("crystal"); }
  function power(){ try{ if(window.__mantaraLiving&&window.__mantaraLiving.guildPower) return window.__mantaraLiving.guildPower(); }catch(e){} var s=(C&&C.stats)||{}; return Math.round((s.might||0)+((C&&C.isMage)?(s.mana||0)*0.8:0)); }
  function refresh(){ try{ if(typeof renderAll==="function")renderAll(); }catch(e){} try{ if(typeof mpRefresh==="function")mpRefresh(); }catch(e){} }
  function doAct(fn){ return function(){ if(!hasC())return; var r=fn(); if(r){ _log(r.t,r.cls||"e-good"); _toast(r.t.replace(/<[^>]+>/g,"")); } refresh(); }; }

  /* ============================================================
     AETHERIA — INTRIK ISTANA (👑 Segel Kerajaan)
     ============================================================ */
  function aetheriaPage(){
    var h=pgNote("Kota tahta & intrik. Jalin kuasa di balik singgasana — kumpulkan <b>Segel Kerajaan 📜</b> dari pengaruhmu, tukar jadi gelar & keistimewaan. "+resLine());
    h+=pgSec("Balairung Intrik");
    h+=pgRow({ico:"🎩",title:"Hadir di Jamuan Istana",sub:"jalin relasi bangsawan · reputasi & segel",on:doAct(function(){
      if(_ch(0.15)){ _apply({happy:-4}); C.reputation=Math.max(0,C.reputation-3); return {t:"Kau tersandung etiket & jadi bahan gunjingan istana.",cls:"e-bad"}; }
      C.reputation+=_ri(2,5); addRes("seal",_ri(1,2)); _apply({charm:+1});
      return {t:"Kau berbaur anggun di jamuan istana. +reputasi & 📜 segel."};
    })});
    h+=pgRow({ico:"🍷",title:"Gelar Perjamuan Mewah",sub:"💰120 · pesona & banyak segel",on:doAct(function(){
      if(C.coin<120) return {t:"Kas kurang untuk perjamuan.",cls:"e-bad"};
      C.coin-=120; addRes("seal",_ri(2,4)); _apply({charm:+3,happy:+4}); C.reputation+=3;
      return {t:"Perjamuanmu jadi buah bibir kaum ningrat! +📜 segel & pesona."};
    })});
    h+=pgRow({ico:"🤝",title:"Sponsori Ningrat Muda",sub:"💰250 · investasi pengaruh besar",on:doAct(function(){
      if(C.coin<250) return {t:"Butuh 250 keping.",cls:"e-bad"};
      C.coin-=250; addRes("seal",_ri(4,7)); C.reputation+=_ri(5,9);
      return {t:"Ningrat yang kau sokong berhutang budi. Pengaruhmu meluas. +📜 banyak segel."};
    })});
    h+=pgRow({ico:"🗡️",title:"Sebar Intrik Politik",sub:"berisiko — bisa naik/hancur reputasi",on:doAct(function(){
      if(_ch(0.5)){ C.reputation+=_ri(8,15); addRes("seal",_ri(1,3)); return {t:"Intrikmu berhasil menjatuhkan saingan! Reputasi melonjak.",cls:"e-epic"}; }
      C.reputation=Math.max(0,C.reputation-_ri(6,12)); _apply({happy:-6}); return {t:"Intrikmu terbongkar! Namamu tercoreng di istana.",cls:"e-bad"};
    })});
    h+=pgSec("Tukar Segel Kerajaan 📜");
    h+=pgRow({ico:"🎖️",title:"Beli Gelar Kehormatan",sub:"5 📜 → reputasi besar",dim:res("seal")<5,on:res("seal")<5?null:doAct(function(){
      if(!spendRes("seal",5)) return {t:"Segel kurang.",cls:"e-bad"};
      C.reputation+=_ri(12,20); return {t:"Raja menganugerahkan gelar kehormatan padamu! Reputasi melambung.",cls:"e-epic"};
    })});
    h+=pgRow({ico:"💰",title:"Tebus Upeti Kerajaan",sub:"4 📜 → 💰 besar",dim:res("seal")<4,on:res("seal")<4?null:doAct(function(){
      if(!spendRes("seal",4)) return {t:"Segel kurang.",cls:"e-bad"};
      var g=_ri(150,320); C.coin+=g; return {t:"Segelmu ditukar upeti "+g+" keping dari kas kerajaan."};
    })});
    return h;
  }

  /* ============================================================
     THORNVALE — PERBURUAN RIMBA (🌲 Herba Langka)
     ============================================================ */
  function thornvalePage(){
    var h=pgNote("Rimba luas penuh buruan & tumbuhan langka. Buru bestia, ramu <b>Herba Langka 🌿</b> jadi ramuan sakti. "+resLine());
    h+=pgSec("Perburuan");
    h+=pgRow({ico:"🏹",title:"Buru Buruan Liar",sub:"kekuatan menentukan · koin, kulit & kadang herba",on:doAct(function(){
      var wc=Math.min(0.9,0.45+power()/160);
      if(_ch(wc)){ var g=_ri(15,40); C.coin+=g; _addItem("hide"); if(_ch(0.4))addRes("herb",1); _apply({might:+2,happy:+3});
        return {t:"Buruan sukses! +"+g+" keping, kulit buruan"+(_ch(0.4)?" & 🌿 herba":"")+".",cls:"e-good"}; }
      _apply({health:-_ri(4,12)}); return {t:"Buruan lolos & kau tergores dalam pengejaran.",cls:"e-bad"};
    })});
    h+=pgRow({ico:"🐺",title:"Buru Bestia Buas",sub:"berbahaya — trofi & herba langka",on:doAct(function(){
      var wc=Math.min(0.85,0.30+power()/150);
      if(_ch(wc)){ var g=_ri(40,90); C.coin+=g; addRes("herb",_ri(1,3)); if(_ch(0.5))_addItem("beast_core"); _apply({might:+3,reputation:0}); C.reputation+=2;
        return {t:"Kau menumbangkan bestia buas! +"+g+" keping & 🌿 herba langka.",cls:"e-epic"}; }
      _apply({health:-_ri(10,24),happy:-4}); return {t:"Bestia itu terlalu ganas — kau nyaris jadi mangsa.",cls:"e-bad"};
    })});
    h+=pgRow({ico:"🌿",title:"Meramu Herba Hutan",sub:"jelajah & kumpulkan tumbuhan langka",on:doAct(function(){
      var n=_ri(1,3); addRes("herb",n); if(_ch(0.3))_apply({mind:+2});
      return {t:"Kau mengumpulkan "+n+" 🌿 herba langka dari rimba."};
    })});
    h+=pgSec("Ramuan dari Herba 🌿");
    h+=pgRow({ico:"🧪",title:"Racik Ramuan Nyawa",sub:"2 🌿 → pulih nyawa besar",dim:res("herb")<2,on:res("herb")<2?null:doAct(function(){
      if(!spendRes("herb",2))return{t:"Herba kurang.",cls:"e-bad"}; _apply({health:+_ri(18,32)}); return {t:"Ramuanmu memulihkan tubuh secara ajaib."};
    })});
    h+=pgRow({ico:"💪",title:"Racik Tonik Perkasa",sub:"3 🌿 → Kekuatan permanen",dim:res("herb")<3,on:res("herb")<3?null:doAct(function(){
      if(!spendRes("herb",3))return{t:"Herba kurang.",cls:"e-bad"}; _apply({might:+_ri(4,8)}); return {t:"Tonik herbal membakar ototmu — Kekuatan naik!",cls:"e-epic"};
    })});
    h+=pgRow({ico:"💰",title:"Jual Herba ke Tabib Kota",sub:"1 🌿 → koin",dim:res("herb")<1,on:res("herb")<1?null:doAct(function(){
      if(!spendRes("herb",1))return{t:"Tak ada herba.",cls:"e-bad"}; var g=_ri(25,55); C.coin+=g; return {t:"Tabib membeli herbamu seharga "+g+" keping."};
    })});
    return h;
  }

  /* ============================================================
     SALTMOOR — VENTURA LAUT (⚓ Doubloon)
     ============================================================ */
  function ensureVoyages(){ if(!C.voyages)C.voyages=[]; }
  function saltmoorPage(){
    ensureVoyages();
    var h=pgNote("Pelabuhan dagang & sarang penyelundup. Danai pelayaran berisiko, selundupkan barang, raih <b>Doubloon 🪙</b> untuk pasar gelap. "+resLine());
    if(C.voyages.length){
      h+=pgSec("Pelayaran Berjalan");
      C.voyages.forEach(function(v){ h+=pgRow({ico:"⛵",title:"Modal "+v.amt+" keping",sub:"tiba "+v.yearsLeft+" th lagi · risiko "+(v.risk>0.3?"tinggi":"sedang")}); });
    }
    h+=pgSec("Ventura & Selundup");
    [["Kecil",120,1,0.22],["Sedang",300,2,0.3],["Besar",700,2,0.38]].forEach(function(t){
      h+=pgRow({ico:"⛵",title:"Danai Pelayaran "+t[0],sub:"💰"+t[1]+" · untung "+Math.round(t[1]*1.6)+"–"+Math.round(t[1]*2.6)+" + 🪙 · "+t[2]+" th",dim:C.coin<t[1],
        on:C.coin<t[1]?null:doAct(function(){ C.coin-=t[1]; ensureVoyages(); C.voyages.push({amt:t[1],yearsLeft:t[2],risk:t[3]}); return {t:"Kapalmu berlayar membawa modal "+t[1]+" keping. Nantikan hasilnya."}; })});
    });
    h+=pgRow({ico:"🏴",title:"Selundupkan Barang Gelap",sub:"risiko reputasi · doubloon + koin",on:doAct(function(){
      if(_ch(0.25)){ C.reputation=Math.max(0,C.reputation-_ri(5,10)); var loss=Math.min(C.coin,_ri(20,60)); C.coin-=loss; return {t:"Penjaga pelabuhan menggerebek! Kau kehilangan "+loss+" keping & nama.",cls:"e-bad"}; }
      var g=_ri(30,80); C.coin+=g; addRes("doubloon",_ri(2,4)); return {t:"Penyelundupanmu mulus. +"+g+" keping & 🪙 doubloon.",cls:"e-good"};
    })});
    h+=pgSec("Pasar Gelap Doubloon 🪙");
    h+=pgRow({ico:"🗡️",title:"Beli Senjata Selundupan",sub:"6 🪙 → tingkatkan senjata (+1 tempa)",dim:res("doubloon")<6,on:res("doubloon")<6?null:doAct(function(){
      if(!spendRes("doubloon",6))return{t:"Doubloon kurang.",cls:"e-bad"};
      try{ if(!C.gearPlus)C.gearPlus={}; C.gearPlus.weapon=Math.min(8,(C.gearPlus.weapon||0)+1); }catch(e){}
      return {t:"Senjatamu ditempa ulang dengan logam selundupan — makin tajam!",cls:"e-epic"};
    })});
    h+=pgRow({ico:"🎁",title:"Beli Peti Misteri",sub:"4 🪙 → barang langka acak",dim:res("doubloon")<4,on:res("doubloon")<4?null:doAct(function(){
      if(!spendRes("doubloon",4))return{t:"Doubloon kurang.",cls:"e-bad"};
      _addItem(_rand(["lucky_coin","ancient_scroll","gemstone","relic","rune_shard"]));
      return {t:"Peti misteri berisi barang langka!",cls:"e-good"};
    })});
    return h;
  }
  function resolveVoyages(){
    if(!hasC()||!C.voyages||!C.voyages.length) return;
    var keep=[];
    C.voyages.forEach(function(v){ v.yearsLeft--; if(v.yearsLeft>0){ keep.push(v); return; }
      if(_ch(v.risk)){ var lost=Math.round(v.amt*(_ch(0.5)?0.5:1)); _log("⛵ Pelayaranmu diterjang "+(_ch(0.5)?"badai":"bajak laut")+"! Modal "+v.amt+" hilang sebagian ("+lost+").","e-bad"); if(lost<v.amt){ C.coin+=(v.amt-lost); } }
      else { var ret=Math.round(v.amt*(1.6+Math.random())); C.coin+=ret; addRes("doubloon",_ri(2,5)); _log("⛵ Kapalmu pulang membawa untung "+ret+" keping & 🪙 doubloon!","e-epic"); }
    });
    C.voyages=keep;
  }

  /* ============================================================
     FROSTSPIRE — RISET ARCANE (🗼 Kristal Mana)
     ============================================================ */
  function frostspirePage(){
    var h=pgNote("Menara sihir beku, pusat ilmu arcane. Tambang <b>Kristal Mana 💠</b>, riset mantra, & enchant perlengkapan. "+(C.isMage?"":"<br><span style='color:var(--bad)'>Non-penyihir bisa meditasi & enchant, tapi riset mantra tinggi butuh darah arcane.</span>")+" "+resLine());
    h+=pgSec("Menara Arcanum");
    h+=pgRow({ico:"❄️",title:"Meditasi Ley-line",sub:"serap energi beku · kristal + mana",on:doAct(function(){
      addRes("crystal",_ri(1,3)); _apply(C.isMage?{mana:+_ri(3,7),mind:+1}:{mind:+2,happy:+2});
      return {t:"Kau menyelaraskan diri dengan ley-line. +💠 kristal"+(C.isMage?" & mana":"")+"."};
    })});
    h+=pgRow({ico:"🔮",title:"Riset Mantra",sub:(C.isMage?"2 💠 + 💰80 · buka kekuatan arcane (berisiko)":"🔒 khusus penyihir"),dim:!C.isMage||res("crystal")<2||C.coin<80,
      on:(!C.isMage||res("crystal")<2||C.coin<80)?null:doAct(function(){
        spendRes("crystal",2); C.coin-=80;
        if(_ch(0.68)){ _apply({mana:+_ri(6,12),mind:+_ri(2,4)}); return {t:"Risetmu berhasil! Mantra baru terukir & mana melonjak.",cls:"e-epic"}; }
        _apply({health:-_ri(6,14),mana:-3}); return {t:"Eksperimenmu meledak! Arcane liar menghantam balik.",cls:"e-bad"};
      })});
    h+=pgRow({ico:"💠",title:"Enchant Perlengkapan",sub:"3 💠 → tingkatkan senjata (+1 tempa arcane)",dim:res("crystal")<3,on:res("crystal")<3?null:doAct(function(){
      if(!spendRes("crystal",3))return{t:"Kristal kurang.",cls:"e-bad"};
      try{ if(!C.gearPlus)C.gearPlus={}; var cat=(C.isMage&&C.gear&&C.gear.tome&&C.gear.tome!=="none")?"tome":"weapon"; C.gearPlus[cat]=Math.min(8,(C.gearPlus[cat]||0)+1); }catch(e){}
      return {t:"Perlengkapanmu berpendar dengan enchant arcane!",cls:"e-epic"};
    })});
    h+=pgRow({ico:"📖",title:"Pelajari Tomus Terlarang",sub:"berisiko Inkuisisi · pengetahuan besar",on:doAct(function(){
      var inkuis=false; try{ var a=window.__mantaraRulers&&window.__mantaraRulers.archOf&&window.__mantaraRulers.archOf("frostspire"); inkuis=a&&a.magePenalty; }catch(e){}
      if(C.isMage && inkuis && _ch(0.4)){ _apply({health:-_ri(8,18),happy:-6}); C.reputation=Math.max(0,C.reputation-5); return {t:"Inkuisisi memergokimu membaca tomus terlarang! Kau nyaris ditangkap.",cls:"e-bad"}; }
      _apply(C.isMage?{mana:+_ri(4,9),mind:+_ri(3,6)}:{mind:+_ri(3,6)}); addRes("crystal",1);
      return {t:"Pengetahuan kuno mengalir ke benakmu.",cls:"e-arcane"};
    })});
    h+=pgSec("Tukar Kristal 💠");
    h+=pgRow({ico:"💰",title:"Jual Kristal ke Kolektor",sub:"1 💠 → koin",dim:res("crystal")<1,on:res("crystal")<1?null:doAct(function(){
      if(!spendRes("crystal",1))return{t:"Tak ada kristal.",cls:"e-bad"}; var g=_ri(40,90); C.coin+=g; return {t:"Kolektor arcane membayar "+g+" keping untuk kristalmu."};
    })});
    return h;
  }

  /* ============================================================
     REGISTRASI & PINTU MASUK
     ============================================================ */
  var CITY_SIG={
    aetheria:{ico:"👑",name:"Intrik Istana",res:"seal",page:aetheriaPage,
      blurb:"Panjat tangga kekuasaan lewat jamuan, sponsor & intrik. Kumpulkan Segel Kerajaan."},
    thornvale:{ico:"🏹",name:"Perburuan Rimba",res:"herb",page:thornvalePage,
      blurb:"Buru bestia & ramu herba langka jadi ramuan sakti."},
    saltmoor:{ico:"⛵",name:"Ventura Laut",res:"doubloon",page:saltmoorPage,
      blurb:"Danai pelayaran dagang berisiko & selundupkan barang demi Doubloon."},
    frostspire:{ico:"🔮",name:"Riset Arcane",res:"crystal",page:frostspirePage,
      blurb:"Tambang Kristal Mana, riset mantra & enchant perlengkapan."}
  };
  window.openCitySignature=function(cityId){
    var sig=CITY_SIG[cityId]; if(!sig||typeof pushPage!=="function") return;
    pushPage({title:sig.name+" — "+cityName(cityId), render:function(){ if(!hasC())return pgNote("Mulai hidup dulu."); return sig.page(); }});
  };

  // panel "Ciri Khas Kota" di tab Peta (untuk kota tempatmu berada)
  function sigSectionHTML(){
    if(!hasC()) return "";
    ensureRes();
    var id=C.cityId, sig=CITY_SIG[id]; if(!sig) return "";
    return "<div class='sechead'>"+sig.ico+" Ciri Khas "+cityName(id)+"</div>"
      +"<p style='font-size:10.5px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 8px;line-height:1.5;'>"+sig.blurb+"<br>Sumber dayamu: "+resLine()+"</p>"
      +"<div class='tiles'><div class='tile fullrow arcane' onclick=\"openCitySignature('"+id+"')\">"
      +"<span class='ti'>"+sig.ico+"</span><span class='tn'>"+sig.name+" ▸</span>"
      +"<span class='td'>aktivitas khas hanya ada di "+cityName(id)+"</span></div></div>";
  }
  try{
    if(typeof renderPeta==="function"){
      var _rp=renderPeta;
      renderPeta=function(){
        var r=_rp.apply(this,arguments);
        try{ var host=document.getElementById("viewPeta"); if(host&&hasC()) host.insertAdjacentHTML("beforeend", sigSectionHTML()); }catch(e){}
        return r;
      };
    }
  }catch(e){}

  /* ---- EVENT UNIK PER KOTA (hanya saat berada di kota itu) ---- */
  var CITY_EVENTS={
    aetheria:[
      function(){ C.reputation+=_ri(2,5); addRes("seal",1); return "🎪 Kau diundang ke pesta topeng istana — namamu makin dikenal ningrat. +📜"; },
      function(){ if(_ch(0.5)){C.reputation=Math.max(0,C.reputation-4);return "🗣️ Gosip miring tentangmu beredar di koridor istana.";} var g=_ri(40,100);C.coin+=g;return "👑 Raja berkenan memberimu hadiah "+g+" keping."; }
    ],
    thornvale:[
      function(){ addRes("herb",_ri(1,2)); return "🦌 Kau menemukan padang herba tersembunyi di rimba. +🌿"; },
      function(){ if(power()>40){_addItem("hide");C.coin+=_ri(20,50);return "🐗 Bestia menyerang kampmu — kau mengusirnya & mengambil rampasannya.";} _apply({health:-_ri(5,12)});return "🐗 Bestia buas menyerang di malam hari — kau terluka mempertahankan diri."; }
    ],
    saltmoor:[
      function(){ addRes("doubloon",_ri(1,3)); return "🏴‍☠️ Kau memenangkan taruhan dengan pelaut mabuk. +🪙 doubloon."; },
      function(){ if(_ch(0.4)){_apply({health:-_ri(4,10)});return "🦠 Wabah pelabuhan menjangkitimu sebentar.";} var g=_ri(30,80);C.coin+=g;return "🚢 Kapal dagang butuh kuli mendadak — upah "+g+" keping."; }
    ],
    frostspire:[
      function(){ addRes("crystal",_ri(1,2)); _apply(C.isMage?{mana:+4}:{mind:+2}); return "❄️ Badai mana melanda menara — kau memanen 💠 kristal dari sisa-sisanya."; },
      function(){ if(C.isMage){_apply({mana:+_ri(4,8)});return "🔮 Ley-line bergolak — mana di tubuhmu meluap.";} _apply({health:-_ri(3,8)});return "🥶 Udara beku Frostspire menggerus tenagamu."; }
    ]
  };
  try{
    if(typeof advanceYear==="function"){
      var _adv=advanceYear;
      advanceYear=function(){
        var r=_adv.apply(this,arguments);
        try{
          if(hasC()){
            resolveVoyages();
            if(_ch(0.22)){ var pool=CITY_EVENTS[C.cityId]; if(pool){ var msg=_rand(pool)(); if(msg) _log(msg, /terluka|wabah|gosip|menggerus|menyerang/.test(msg)?"e-bad":"e-good"); } }
          }
        }catch(e){}
        return r;
      };
    }
  }catch(e){}

  window.__mantaraCityId={CITY_SIG:CITY_SIG,res:res,addRes:addRes,resolveVoyages:resolveVoyages};
})();
