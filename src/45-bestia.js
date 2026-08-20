/* ==================================================================
   MANTARA v25 — PILAR 1: BESTIA TERIKAT
   ------------------------------------------------------------------
   Masalah yang diperbaiki:
   Sampai v24, unicorn/gryphon/phoenix/naga ADA di PET_SPECIES tapi hanya
   memberi bonus stat pasif. Tidak bisa ditunggangi, tidak bisa dibalap,
   tidak menua, tidak mati, tidak diwariskan. Sementara GEAR_CATALOG.mount
   punya "griffon" TERPISAH dengan perk statis — makhluk yang sama, dua
   sistem yang tidak saling kenal.

   Sekarang satu bestia bisa jadi peliharaan, tunggangan, DAN rekan tarung.
   Tingkat 1-5 (yang sudah ada di kode lama) menentukan APA yang terbuka,
   bukan sekadar mengalikan angka.

   Ditulis sebagai modul bus — mendengarkan year:end / char:born /
   hidup:render, bukan menimpa fungsi global. Satu-satunya pengecualian
   adalah mountKey() (dijelaskan di bawah).
   ================================================================== */
Mantara.module("bestia", function(M){
  "use strict";
  var U = M.u;

  /* ---------------------------------------------------------------
     METADATA — melengkapi PET_SPECIES yang sudah ada, tanpa menggantinya
     lifespan : umur maksimal (tahun)
     ride     : tingkat minimum untuk ditunggangi (0 = tidak pernah)
     fly      : tingkat minimum untuk terbang (0 = tidak pernah)
     mountAs  : kunci tunggangan yang diwakilinya (untuk syarat turnamen)
     feral    : bisa jadi liar kalau ikatan runtuh
     --------------------------------------------------------------- */
  var META = {
    moon_cat:   {lifespan:16,  ride:0, fly:0, mountAs:null,          feral:false, gelar:"Bayangan Rumah"},
    slime:      {lifespan:8,   ride:0, fly:0, mountAs:null,          feral:false, gelar:"Si Bulat"},
    war_hawk:   {lifespan:22,  ride:0, fly:0, mountAs:null,          feral:false, gelar:"Mata Langit",  scout:true},
    spirit_owl: {lifespan:45,  ride:0, fly:0, mountAs:null,          feral:false, gelar:"Penjaga Rahasia", scout:true},
    dire_wolf:  {lifespan:15,  ride:2, fly:0, mountAs:"warhorse",    feral:true,  gelar:"Taring Utara"},
    war_boar:   {lifespan:18,  ride:2, fly:0, mountAs:"warhorse",    feral:true,  gelar:"Baja Berkaki"},
    unicorn:    {lifespan:65,  ride:2, fly:4, mountAs:"unicorn_mnt", feral:false, gelar:"Cahaya Rimba"},
    gryphon:    {lifespan:70,  ride:2, fly:4, mountAs:"griffon",     feral:true,  gelar:"Raja Langit"},
    drakeling:  {lifespan:210, ride:3, fly:4, mountAs:"wyvern",      feral:true,  gelar:"Sang Naga"},
    phoenix:    {lifespan:999, ride:3, fly:4, mountAs:"phoenix_mnt", feral:false, gelar:"Bara Abadi"}
  };

  var TAHAP = ["Anakan","Muda","Dewasa","Perkasa","Legenda"];

  function meta(key){ return META[key] || {lifespan:20, ride:0, fly:0, mountAs:null, feral:false, gelar:""}; }
  /* PET_SPECIES hidup di dalam IIFE modul living — diakses lewat ekspornya,
     bukan sebagai global (karena memang bukan global). */
  function species(){
    try{ return (window.__mantaraLiving && window.__mantaraLiving.PET_SPECIES) || []; }catch(e){ return []; }
  }
  function defOf(key){
    var L=species();
    for(var i=0;i<L.length;i++) if(L[i].key===key) return L[i];
    return null;
  }
  function pets(){ return (U.alive() && Array.isArray(C.pets)) ? C.pets : []; }
  function byId(id){
    var L=pets(); for(var i=0;i<L.length;i++) if(petId(L[i])===id) return L[i];
    return null;
  }
  /* pet lama tidak punya id — beri id stabil saat pertama kali disentuh */
  function petId(p){
    if(!p._bid) p._bid = p.key + "_" + Math.floor(Math.random()*1e6).toString(36);
    return p._bid;
  }

  function canRide(p){ var m=meta(p.key); return m.ride>0 && (p.level||1)>=m.ride; }
  function canFly(p){  var m=meta(p.key); return m.fly>0  && (p.level||1)>=m.fly; }
  function canFight(p){ return (p.level||1)>=3; }
  function isLegend(p){ return (p.level||1)>=5; }

  /* ---------------------------------------------------------------
     TUNGGANGAN — bestia yang ditunggangi menggantikan slot mount
     Ini SATU-SATUNYA fungsi global yang dibungkus modul ini. Alasannya:
     mountKey() dibaca oleh sistem turnamen untuk memeriksa syarat, dan
     tidak ada event bus yang lewat sana. Dibungkus sekali, di sini,
     supaya jelas siapa yang menyadapnya.
     --------------------------------------------------------------- */
  if(typeof mountKey==="function"){
    var _bestiaMountKey = mountKey;
    window.mountKey = mountKey = function(){
      try{
        var r = ridden();
        if(r){ var m=meta(r.key); if(m.mountAs) return m.mountAs; }
      }catch(e){}
      return _bestiaMountKey.apply(this, arguments);
    };
  }

  function ridden(){
    if(!U.alive() || !C._bestiaMount) return null;
    var p = byId(C._bestiaMount);
    if(!p || !canRide(p)) return null;
    return p;
  }
  function flying(){ var r=ridden(); return (r && canFly(r)) ? r : null; }

  /* dipakai modul Langit untuk tahu apakah pemain bisa terbang */
  M.flyLevelFromBestia = function(){
    var f = flying(); if(!f) return 0;
    var m = meta(f.key);
    return f.key==="unicorn" ? 1 : (f.key==="drakeling"||f.key==="phoenix" ? 3 : 2);
  };

  window.bestiaMount = function(id){
    var p = byId(id); if(!p) return;
    if(!canRide(p)){
      var d=defOf(p.key), m=meta(p.key);
      U.toast((d?d.name:p.name)+(m.ride?(" belum cukup besar untuk ditunggangi (butuh tingkat "+m.ride+")."):" tidak bisa ditunggangi."));
      return;
    }
    C._bestiaMount = (C._bestiaMount===id) ? null : id;
    U.sfx("confirm");
    U.toast(C._bestiaMount ? ("Kau menunggangi "+p.name+".") : ("Kau turun dari "+p.name+"."));
    U.refresh();
  };

  window.bestiaRename = function(id){
    var p = byId(id); if(!p) return;
    var nm = null;
    try{ nm = window.prompt("Nama baru untuk "+p.name+":", p.name); }catch(e){}
    if(nm && nm.trim()){ p.name = nm.trim().slice(0,18); U.toast("Kini bernama "+p.name+"."); U.refresh(); }
  };

  /* latihan — satu-satunya cara mempercepat kenaikan tingkat */
  window.bestiaTrain = function(id){
    var p = byId(id); if(!p || !U.alive()) return;
    var def = defOf(p.key); if(!def) return;
    var cost = 12 + (p.level||1)*10;
    if((C.coin||0) < cost){ U.toast("Butuh "+cost+" keping."); return; }
    if(!U.spend(1)) return;
    C.coin -= cost;
    p.bond = U.clamp((p.bond||60) + U.ri(4,9));
    p.xp   = (p.xp||0) + U.ri(2,5) + Math.round((C.stats.charm||0)/25);
    p.cond = U.clamp((p.cond||100) - U.ri(2,5));
    U.sfx("confirm");
    var need = xpNeeded(p.level||1);
    if(p.xp >= need && (p.level||1) < 5 && p.bond >= 55){
      levelUp(p);
    }else{
      U.toast(p.name+" berlatih. Ikatan "+p.bond+" · "+p.xp+"/"+need+" pengalaman.");
    }
    U.refresh();
  };
  function xpNeeded(lvl){ return [0,12,26,48,80][lvl] || 999; }

  function levelUp(p){
    var def = defOf(p.key); var m = meta(p.key);
    p.level = (p.level||1) + 1; p.xp = 0;
    var tahap = TAHAP[p.level-1] || "?";
    U.anim("win", {text:"TINGKAT "+p.level});
    U.music("triumph");
    var buka = "";
    if(p.level===m.ride)      buka = " — kini bisa <b>ditunggangi</b>!";
    else if(p.level===3)      buka = " — kini <b>ikut bertarung</b> bersamamu!";
    else if(p.level===m.fly)  buka = " — kini bisa <b>TERBANG</b>!";
    else if(p.level===5)      buka = " — kini bergelar <b>"+m.gelar+"</b>, dan akan diingat wangsamu.";
    U.log("🐾 "+def.ico+" "+p.name+" tumbuh jadi "+tahap+buka, "e-epic");
    if(p.level===5){ p.gelar = m.gelar; if(!C._bestiaLegends) C._bestiaLegends=[]; }
  }

  /* ---------------------------------------------------------------
     SIKLUS TAHUNAN — menua, mati, jadi liar
     --------------------------------------------------------------- */
  M.on("year:end", function(){
    if(!U.alive()) return;
    var L = pets(); if(!L.length) return;
    var keep = [];
    for(var i=0;i<L.length;i++){
      var p = L[i], def = defOf(p.key), m = meta(p.key);
      if(!def){ keep.push(p); continue; }
      petId(p);

      /* pertumbuhan alami (lambat) — latihan tetap jalan tercepat */
      if((p.level||1) < 5 && (p.bond||0) >= 55){
        p.xp = (p.xp||0) + 1;
        if(p.xp >= xpNeeded(p.level||1)) levelUp(p);
      }

      /* ikatan runtuh -> bestia buas jadi LIAR, bukan sekadar pergi */
      if(m.feral && (p.bond||60) < 22 && (p.level||1) >= 3 && U.chance(0.30)){
        var rugi = Math.min(C.coin, U.ri(120, 400));
        U.coin(-rugi);
        U.stats({health:-U.ri(8,18)});
        U.music("mourn");
        U.log("🩸 "+def.ico+" "+p.name+" berbalik liar dan menyerang sebelum menghilang ke rimba. Rugi "+U.money(rugi)+" keping.", "e-bad");
        if(C._bestiaMount===petId(p)) C._bestiaMount=null;
        continue;   // hilang
      }

      /* umur */
      if((p.age||0) > m.lifespan){
        if(p.key==="phoenix"){
          p.age = 0; p.cond = 100;
          U.music("ceremony");
          U.log("🔥 "+p.name+" terbakar habis — lalu bangkit dari abunya sendiri. Ikatan kalian tak putus.", "e-epic");
          keep.push(p); continue;
        }
        U.music("mourn");
        if(isLegend(p)){
          U.log("⚰️ "+def.ico+" <b>"+p.name+" "+(p.gelar||"")+"</b> mati di usia "+p.age+". Kau menguburnya sendiri. Namanya masuk Kronik Wangsa.", "e-bad");
          rememberLegend(p);
        }else{
          U.log("⚰️ "+def.ico+" "+p.name+" mati karena usia.", "e-bad");
        }
        U.stats({happy: -(isLegend(p)?18:9)});
        if(C._bestiaMount===petId(p)) C._bestiaMount=null;
        continue;
      }
      keep.push(p);
    }
    C.pets = keep;
  }, -5);   // prioritas rendah: jalan setelah processPetsYear lama

  /* ---------------------------------------------------------------
     WARISAN — bestia Legenda hidup melewati tuannya
     --------------------------------------------------------------- */
  function rememberLegend(p){
    try{
      var rec = {key:p.key, name:p.name, gelar:p.gelar||meta(p.key).gelar, age:p.age, by:C.name};
      var raw = localStorage.getItem("mantara_bestia_legends_v1");
      var arr = raw ? JSON.parse(raw) : [];
      arr.unshift(rec); if(arr.length>12) arr.pop();
      localStorage.setItem("mantara_bestia_legends_v1", JSON.stringify(arr));
    }catch(e){}
  }

  M.on("char:died", function(){
    /* bestia berumur panjang & sudah Legenda menunggu ahli waris */
    try{
      if(!C || !Array.isArray(C.pets)) return;
      var heirloom = C.pets.filter(function(p){
        var m = meta(p.key);
        return (p.level||1) >= 4 && m.lifespan > 60 && (p.age||0) < m.lifespan - 20;
      }).slice(0,1);
      window.__bestiaInherit = heirloom.length ? JSON.parse(JSON.stringify(heirloom)) : null;
    }catch(e){ window.__bestiaInherit = null; }
  });

  M.on("char:born", function(ctx){
    if(!ctx.heir) { window.__bestiaInherit = null; return; }
    var inh = window.__bestiaInherit; window.__bestiaInherit = null;
    if(!inh || !inh.length || !U.alive()) return;
    try{
      if(!Array.isArray(C.pets)) C.pets = [];
      var p = inh[0];
      p.bond = Math.max(35, (p.bond||60) - 25);   // ia belum mengenalmu
      C.pets.push(p);
      var def = defOf(p.key);
      setTimeout(function(){
        U.ask({ico:def?def.ico:"🐾", cancel:false,
          prompt:"<b>"+p.name+"</b> masih hidup.<br><span style='font-size:12px;line-height:1.6;color:var(--ink-soft);filter:brightness(1.6)'>"
            +(def?def.name:"Bestia")+" milik leluhurmu, kini berusia "+(p.age||0)+" tahun. Ia mengendus darahmu dan mengenali sesuatu — "
            +"tapi ikatan kalian harus dibangun dari awal.</span>",
          choices:[{label:"Terima warisan bernyawa", cls:"love", run:function(){
            return {t:"🐾 "+(def?def.ico:"")+" "+p.name+" kini milikmu. Ikatan "+p.bond+"/100.", cls:"e-epic"};
          }}]});
      }, 1600);
    }catch(e){}
  });

  /* ---------------------------------------------------------------
     PANEL DI TAB HIDUP
     --------------------------------------------------------------- */
  M.on("hidup:render", function(ctx){
    if(!U.alive()) return;
    var L = pets(); if(!L.length) return;
    var r = ridden();
    var rows = L.map(function(p){
      var def = defOf(p.key); if(!def) return "";
      var m = meta(p.key), lvl = p.level||1, id = petId(p);
      var tag = [];
      if(canFly(p))        tag.push("<span style='color:#8fd0ff'>terbang</span>");
      else if(canRide(p))  tag.push("<span style='color:#c9a0ff'>tunggangan</span>");
      if(canFight(p))      tag.push("<span style='color:#ff9a7e'>petarung</span>");
      if(isLegend(p))      tag.push("<span style='color:var(--gold)'>"+(p.gelar||m.gelar)+"</span>");
      var mounted = r && petId(r)===id;
      return "<div class='bst-row"+(mounted?" on":"")+"'>"
        + "<span class='bst-ico'>"+def.ico+"</span>"
        + "<span class='bst-mid'><b>"+U.esc(p.name)+"</b> <span class='bst-sub'>"+TAHAP[lvl-1]+" · "+(p.age||0)+"th · ikatan "+(p.bond||0)+"</span>"
        + (tag.length?"<span class='bst-tag'>"+tag.join(" · ")+"</span>":"")
        + "</span>"
        + (canRide(p) ? "<button class='bst-btn' onclick=\"bestiaMount('"+id+"')\">"+(mounted?"turun":"naik")+"</button>" : "")
        + "</div>";
    }).join("");
    ctx.blocks.push(
      "<div class='bst-box'><div class='bst-head'>🐾 Bestia Terikat"
      + (r ? " <span style='font-size:10px;opacity:.75'>· menunggangi "+U.esc(r.name)+"</span>" : "")
      + "</div>" + rows + "</div>");
  });

  /* gaya */
  M.on("boot", function(){
    if(document.getElementById("bestiaStyle")) return;
    var st = document.createElement("style"); st.id="bestiaStyle";
    st.textContent =
      ".bst-box{margin:8px 4px 10px;padding:9px 11px;border:1px solid rgba(160,120,255,.22);border-radius:12px;"
     +"background:linear-gradient(160deg,rgba(28,20,48,.75),rgba(16,10,26,.75))}"
     +".bst-head{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#c9a0ff;margin-bottom:6px}"
     +".bst-row{display:flex;align-items:center;gap:9px;padding:6px 0;border-top:1px solid rgba(255,255,255,.05)}"
     +".bst-row:first-of-type{border-top:none}"
     +".bst-row.on{background:rgba(160,120,255,.09);border-radius:8px;padding-left:6px;padding-right:6px}"
     +".bst-ico{font-size:20px}.bst-mid{flex:1;font-size:12.5px;line-height:1.45}"
     +".bst-sub{font-size:10px;color:var(--ink-soft);filter:brightness(1.5)}"
     +".bst-tag{display:block;font-size:9.5px;margin-top:1px}"
     +".bst-btn{padding:4px 9px;font-size:10.5px;border-radius:8px;border:1px solid rgba(200,160,255,.4);"
     +"background:rgba(160,120,255,.14);color:#dcc8ff}";
    document.head.appendChild(st);
  });

  /* ---------------------------------------------------------------
     KANDANG — perluas UI lama dengan tombol latih & tunggang
     --------------------------------------------------------------- */
  window.bestiaKennelExtra = function(){
    var L = pets(); if(!L.length) return "";
    var h = "<div class='exp-desc' style='margin:10px 2px 6px;color:var(--gold)'>Bestiamu</div>";
    L.forEach(function(p){
      var def = defOf(p.key); if(!def) return;
      var m = meta(p.key), lvl = p.level||1, id = petId(p);
      var next = lvl<5 ? ((p.xp||0)+"/"+xpNeeded(lvl)+" menuju "+TAHAP[lvl]) : "tingkat tertinggi";
      var unlock = [];
      if(m.ride) unlock.push("tunggangan lv"+m.ride);
      if(m.fly)  unlock.push("terbang lv"+m.fly);
      unlock.push("petarung lv3");
      h += "<div class='exp-card'><div class='exp-row'>"
        + "<div class='exp-ico'>"+def.ico+"</div>"
        + "<div style='flex:1'><div class='exp-name'>"+U.esc(p.name)+" · "+TAHAP[lvl-1]+"</div>"
        + "<div class='exp-desc'>usia "+(p.age||0)+"/"+m.lifespan+" · ikatan "+(p.bond||0)+" · kondisi "+(p.cond||0)+"</div>"
        + "<div class='exp-lvl'>"+next+" · buka: "+unlock.join(", ")+"</div></div>"
        + "<button class='exp-btn' onclick=\"bestiaTrain('"+id+"')\">Latih</button></div>"
        + "<div style='display:flex;gap:6px;margin-top:6px'>"
        + (canRide(p)?"<button class='exp-btn' style='flex:1' onclick=\"bestiaMount('"+id+"')\">Tunggangi</button>":"")
        + "<button class='exp-btn' style='flex:1' onclick=\"bestiaRename('"+id+"')\">Ganti Nama</button></div></div>";
    });
    return h;
  };

  return {
    META: META, meta: meta, canRide: canRide, canFly: canFly, canFight: canFight,
    ridden: ridden, flying: flying, petId: petId, levelUp: levelUp
  };
});
