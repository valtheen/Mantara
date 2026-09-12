/* ==================================================================
   MANTARA v25 — BESTIARIUM
   ------------------------------------------------------------------
   Dari Rencana Fitur v25: "koleksi yang mengisi dirinya sendiri".

   Masalah yang diselesaikan: pemain yang sudah puluhan jam bermain tidak
   punya alasan memasuki dungeon yang sudah mereka kuasai. Semua imbalannya
   habis dalam satu nyawa, dan mati bersama karakternya.

   Bestiarium adalah milik WANGSA, bukan karakter. Ia disimpan di
   localStorage (`mantara_bestiarium_v1`) dan bertahan melewati kematian,
   pergantian ahli waris, bahkan mulai-baru. Tiap makhluk yang kau temui —
   dungeon, bestia peliharaan, boss arena — membuka satu entri: nama,
   asal, kelemahan, berapa kali kau temui, berapa kali kau taklukkan,
   dan siapa leluhur yang pertama kali mencatatnya.

   Yang belum ditemui tampil sebagai siluet. Itulah tujuan koleksinya:
   "masih ada 6 entri kosong."

   Ditulis sebagai modul bus. Dua fungsi dungeon lama dibungkus untuk
   mencatat perjumpaan — dibungkus DI SINI supaya jelas siapa penyadapnya
   (aturan 44-bus-hooks).
   ================================================================== */
Mantara.module("bestiarium", function(M){
  "use strict";
  var U = M.u;
  var KEY = "mantara_bestiarium_v1";

  /* ---------------------------------------------------------------
     KATALOG — sumbernya makhluk yang MEMANG sudah ada di game
     (DUNGEONS boss, PET_SPECIES, lawan arena), bukan konten karangan baru.
     --------------------------------------------------------------- */
  var CATALOG = [
    /* --- boss dungeon --- */
    {id:"goblin_chief", ico:"👺", name:"Kepala Suku Goblin", asal:"Gua Goblin",       tier:0, kelemahan:"Kekuatan mentah — ia mengandalkan jumlah, bukan keahlian."},
    {id:"guard_golem",  ico:"🗿", name:"Golem Penjaga",      asal:"Reruntuhan Kuno",  tier:1, kelemahan:"Sendi batunya retak oleh pukulan berat berulang."},
    {id:"spider_queen", ico:"🕷️", name:"Ratu Laba-laba",     asal:"Sarang Laba-laba", tier:2, kelemahan:"Api membakar sutranya; bisanya dinetralkan tabib."},
    {id:"lich_king",    ico:"⚰️", name:"Raja Lich",          asal:"Kripta Terkutuk",  tier:3, kelemahan:"Terikat pada jimat jiwanya. Mana tinggi mematahkannya."},
    {id:"red_dragon",   ico:"🐉", name:"Naga Merah",         asal:"Liang Naga",       tier:4, kelemahan:"Sisik perutnya lunak — dan ia terlalu percaya diri."},
    {id:"void_warlock", ico:"🌌", name:"Penyihir Kehampaan", asal:"Menara Kehampaan", tier:5, kelemahan:"Realita di sekitarnya rapuh. Akal jernih menembusnya."},
    /* --- bestia yang bisa diikat (PET_SPECIES) --- */
    {id:"moon_cat",   ico:"🐈", name:"Kucing Bulan",   asal:"Atap kota, malam hari",   tier:0, kelemahan:"Tak melawan — ia memilih siapa yang ia ikuti.", pet:true},
    {id:"slime",      ico:"🟢", name:"Slime",           asal:"Selokan & gudang lembap", tier:0, kelemahan:"Terbelah kalau dipukul, tapi tidak berbahaya.", pet:true},
    {id:"war_hawk",   ico:"🦅", name:"Elang Perang",    asal:"Tebing Frostspire",       tier:1, kelemahan:"Sulit dijinakkan sebelum tahun keduanya.", pet:true},
    {id:"dire_wolf",  ico:"🐺", name:"Serigala Dire",   asal:"Rimba utara Thornvale",   tier:2, kelemahan:"Setia sampai ikatannya runtuh — lalu berbalik.", pet:true},
    {id:"war_boar",   ico:"🐗", name:"Babi Perang",     asal:"Ladang berlumpur",        tier:2, kelemahan:"Menyerang lurus. Bisa dihindari, sulit dihentikan.", pet:true},
    {id:"spirit_owl", ico:"🦉", name:"Burung Hantu Roh",asal:"Perpustakaan terlarang",  tier:3, kelemahan:"Hanya menampakkan diri pada yang bermana tinggi.", pet:true},
    {id:"unicorn",    ico:"🦄", name:"Unicorn",         asal:"Rimba Cahaya",            tier:3, kelemahan:"Menolak siapa pun yang tangannya berlumur darah.", pet:true},
    {id:"gryphon",    ico:"🦁", name:"Gryphon",         asal:"Sarang puncak batu",      tier:4, kelemahan:"Bangga. Ikatan yang retak membuatnya liar.", pet:true},
    {id:"drakeling",  ico:"🐲", name:"Naga Kecil",      asal:"Telur curian dari liang", tier:4, kelemahan:"Tumbuh 210 tahun — melampaui tuannya.", pet:true},
    {id:"phoenix",    ico:"🔥", name:"Phoenix",         asal:"Abu yang tak pernah dingin", tier:5, kelemahan:"Tidak punya. Ia hanya bangkit kembali.", pet:true},
    /* --- makhluk arena / perjumpaan --- */
    {id:"storm_beast", ico:"🌩️", name:"Makhluk Badai", asal:"Pusaran mana Frostspire", tier:3, kelemahan:"Padam kalau badainya reda."},
    {id:"revenant",    ico:"👻", name:"Roh Penunggu",  asal:"Reruntuhan & kripta",     tier:2, kelemahan:"Terikat pada satu tempat. Tinggalkan, ia tak mengejar."},
    {id:"demon",       ico:"👹", name:"Iblis Kontrak", asal:"Ritual yang gagal",       tier:4, kelemahan:"Terikat kata-katanya sendiri."}
  ];
  function defOf(id){ for(var i=0;i<CATALOG.length;i++) if(CATALOG[i].id===id) return CATALOG[i]; return null; }
  M.CATALOG = CATALOG;

  /* ---------------------------------------------------------------
     PENYIMPANAN — milik wangsa, bertahan melewati kematian
     --------------------------------------------------------------- */
  function load(){
    try{ var raw=localStorage.getItem(KEY); return raw?JSON.parse(raw):{}; }catch(e){ return {}; }
  }
  function save(db){ try{ localStorage.setItem(KEY, JSON.stringify(db)); }catch(e){} }

  /* Catat perjumpaan. kind: "temu" (bertemu) atau "takluk" (mengalahkan). */
  function record(id, kind){
    var d=defOf(id); if(!d) return false;
    var db=load(), baru=!db[id];
    var e = db[id] || {temu:0, takluk:0, oleh:null, usia:null, pertama:null};
    e.temu++;
    if(kind==="takluk") e.takluk++;
    if(baru){
      try{ e.oleh = C && C.name; e.usia = C && C.age; e.pertama = Date.now(); }catch(x){}
    }
    db[id]=e; save(db);
    if(baru){
      U.sfx("confirm");
      U.log("📖 <b>Bestiarium</b>: entri baru terbuka — "+d.ico+" "+d.name+".","e-epic");
      U.toast("📖 Bestiarium: "+d.name);
    }
    return baru;
  }
  window.mantaraBestiaryRecord = record;
  M.record = record;

  function stats(){
    var db=load(), known=0, killed=0;
    for(var i=0;i<CATALOG.length;i++){
      var e=db[CATALOG[i].id];
      if(e){ known++; if(e.takluk>0) killed++; }
    }
    return {known:known, total:CATALOG.length, killed:killed, db:db};
  }
  M.stats = stats;

  /* ---------------------------------------------------------------
     PENGISI OTOMATIS
     --------------------------------------------------------------- */
  /* 1) bestia yang kau ikat */
  M.on("year:end", function(){
    if(!U.alive()) return;
    try{
      (C.pets||[]).forEach(function(p){ if(defOf(p.key)) record(p.key, "temu"); });
    }catch(e){}
  }, -30);

  /* 2) dungeon — masuk = bertemu bossnya; clearedBoss = menaklukkan.
        Dua fungsi lama dibungkus, DI SINI, supaya penyadapnya jelas. */
  var DUN_BOSS = {
    goblin_cave:"goblin_chief", old_ruins:"guard_golem", spider_nest:"spider_queen",
    cursed_crypt:"lich_king", dragon_lair:"red_dragon", void_tower:"void_warlock"
  };
  M.on("boot", function(){
    try{
      if(typeof window.enterDungeon==="function"){
        var _ed = window.enterDungeon;
        window.enterDungeon = function(id){
          var r=_ed.apply(this, arguments);
          try{ if(DUN_BOSS[id]) record(DUN_BOSS[id], "temu"); }catch(e){}
          return r;
        };
      }
      if(typeof window.dunAct==="function"){
        var _da = window.dunAct;
        window.dunAct = function(){
          var r=_da.apply(this, arguments);
          try{
            var st=window.__mantaraDungeon && window.__mantaraDungeon.state && window.__mantaraDungeon.state();
            if(st && st.clearedBoss && !st._bstLogged){
              st._bstLogged=true;
              var bid=DUN_BOSS[st.def && st.def.id];
              if(bid) record(bid, "takluk");
            }
          }catch(e){}
          return r;
        };
      }
    }catch(e){}
  }, -50);

  /* 3) lawan bertipe makhluk di arena/duel */
  M.on("boot", function(){
    try{
      if(typeof window.arenaAct!=="function") return;
      var seen={};
      var _aa = window.arenaAct;
      window.arenaAct = function(){
        var r=_aa.apply(this, arguments);
        try{
          var txt=(document.body.innerText||"");
          var map=[[/naga|wyrm/i,"red_dragon"],[/badai|storm/i,"storm_beast"],
                   [/roh|hantu|penunggu|arwah/i,"revenant"],[/golem/i,"guard_golem"],
                   [/laba-laba/i,"spider_queen"],[/iblis|demon/i,"demon"]];
          for(var i=0;i<map.length;i++){
            if(map[i][0].test(txt) && !seen[map[i][1]]){ seen[map[i][1]]=1; record(map[i][1], "temu"); break; }
          }
        }catch(e){}
        return r;
      };
    }catch(e){}
  }, -50);

  /* ---------------------------------------------------------------
     HALAMAN
     --------------------------------------------------------------- */
  window.openBestiarium = function(){
    if(typeof pushPage!=="function") return;
    pushPage({title:"Bestiarium", render:function(){
      var s=stats();
      var h="<div class='bstr-hero'>"
        +"<div class='bstr-count'>"+s.known+" <span>/ "+s.total+"</span></div>"
        +"<div class='bstr-cap'>entri terbuka · "+s.killed+" ditaklukkan</div>"
        +"<div class='bstr-bar'><div style='width:"+Math.round(s.known/s.total*100)+"%'></div></div>"
        +"<div class='bstr-note'>Bestiarium milik wangsamu. Ia tidak ikut mati bersamamu.</div></div>";

      var tiers=[[0,"Makhluk Kecil"],[1,"Makhluk Liar"],[2,"Makhluk Berbahaya"],[3,"Makhluk Arcane"],[4,"Makhluk Agung"],[5,"Legenda"]];
      tiers.forEach(function(t){
        var list=CATALOG.filter(function(c){ return c.tier===t[0]; });
        if(!list.length) return;
        h+="<div class='pg-sec'>"+t[1]+"</div>";
        list.forEach(function(c){
          var e=s.db[c.id];
          if(!e){
            h+="<div class='bstr-row unknown'><div class='bstr-ico'>?</div>"
              /* QA: dulu memakai asal.toLowerCase() sehingga nama tempat ikut
                 turun huruf ("tebing frostspire"). Sekarang kalimatnya dibentuk
                 tanpa merusak nama diri. */
              +"<div class='bstr-mid'><b>Belum ditemui</b>"
              +"<span class='bstr-sub'>Konon ada sesuatu di "+U.esc(c.asal)+".</span></div></div>";
          }else{
            h+="<div class='bstr-row'><div class='bstr-ico'>"+c.ico+"</div>"
              +"<div class='bstr-mid'><b>"+U.esc(c.name)+"</b>"
              +"<span class='bstr-sub'>"+U.esc(c.asal)+"</span>"
              +"<span class='bstr-weak'>Kelemahan: "+U.esc(c.kelemahan)+"</span>"
              +"<span class='bstr-tally'>ditemui "+e.temu+"×"+(e.takluk?" · ditaklukkan "+e.takluk+"×":"")
              +(e.oleh?" · pertama dicatat "+U.esc(e.oleh)+" (usia "+e.usia+")":"")+"</span>"
              +"</div></div>";
          }
        });
      });
      return h;
    }});
  };

  /* pintu masuk di tab Hidup */
  M.on("hidup:render", function(ctx){
    if(!U.alive()) return;
    var s=stats(); if(!s.known) return;
    ctx.blocks.push(
      "<div class='bstr-box' onclick=\"openBestiarium()\" role='button' tabindex='0'>"
      +"<div class='bstr-head'>📖 Bestiarium <span class='bstr-chev'>›</span></div>"
      +"<div class='bstr-line'>"+s.known+" dari "+s.total+" entri terbuka"
      +(s.known<s.total?(" · masih ada "+(s.total-s.known)+" yang belum kau temui"):" · lengkap")+"</div>"
      +"<div class='bstr-bar'><div style='width:"+Math.round(s.known/s.total*100)+"%'></div></div></div>");
  });

  M.on("boot", function(){
    if(document.getElementById("bestiariumStyle")) return;
    var el=document.createElement("style"); el.id="bestiariumStyle";
    el.textContent =
      ".bstr-box{margin:8px 4px 10px;padding:9px 11px;border:1px solid rgba(139,156,255,.22);border-radius:12px;"
     +"background:linear-gradient(160deg,rgba(20,24,44,.8),rgba(12,14,24,.8));cursor:pointer;min-height:44px}"
     +".bstr-head{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--arcane-glow);"
     +"display:flex;justify-content:space-between;align-items:center}"
     +".bstr-chev{font-size:15px;opacity:.6}"
     +".bstr-line{font-size:11px;color:var(--ink-soft);filter:brightness(1.7);margin-top:3px}"
     +".bstr-bar{height:4px;border-radius:3px;background:rgba(255,255,255,.07);margin-top:6px;overflow:hidden}"
     +".bstr-bar>div{height:100%;background:linear-gradient(90deg,var(--arcane),var(--gold));border-radius:3px}"
     +".bstr-hero{text-align:center;padding:16px 12px 14px;margin:2px 0 10px;border-radius:14px;"
     +"background:linear-gradient(155deg,#1a2036,#12100c);border:1px solid rgba(139,156,255,.3)}"
     +".bstr-count{font-size:30px;font-weight:700;color:var(--gold-bright);line-height:1}"
     +".bstr-count span{font-size:15px;color:var(--ink-soft);filter:brightness(1.7)}"
     +".bstr-cap{font-size:11px;color:var(--arcane-glow);margin-top:4px}"
     +".bstr-hero .bstr-bar{margin:10px 4px 0}"
     +".bstr-note{font-size:10px;color:var(--ink-soft);filter:brightness(1.6);margin-top:8px;line-height:1.6}"
     +".bstr-row{display:flex;gap:10px;align-items:flex-start;padding:9px 10px;margin:5px 0;border-radius:11px;"
     +"background:rgba(255,255,255,.03);border:1px solid var(--line)}"
     +".bstr-row.unknown{opacity:.45;border-style:dashed}"
     +".bstr-ico{font-size:22px;width:30px;text-align:center;flex:none}"
     +".bstr-mid{display:flex;flex-direction:column;gap:1px;font-size:12.5px;min-width:0}"
     +".bstr-sub{font-size:10.5px;color:var(--arcane-glow)}"
     +".bstr-weak{font-size:10.5px;color:var(--ink-soft);filter:brightness(1.7);line-height:1.5;margin-top:2px}"
     +".bstr-tally{font-size:10px;color:var(--gold);margin-top:3px}";
    document.head.appendChild(el);
  });

  return {CATALOG:CATALOG, record:record, stats:stats, open:function(){ window.openBestiarium(); }};
});
