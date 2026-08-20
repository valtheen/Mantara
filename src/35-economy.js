/* ==================================================================
   MANTARA — EKONOMI & DUNIA DINAMIS
   Indeks pasar berfluktuasi (boom/bust) + peristiwa dunia (panen,
   wabah, perang, blokade, festival, dsb) yang menggeser harga &
   income usaha, dengan berita/notifikasi. Panel di tab Peta.
   Modul mandiri; menumpuk di atas mulCost (sudah dipengaruhi penguasa).
   ================================================================== */
(function(){
  "use strict";
  function hasC(){ return typeof C!=="undefined" && C && C.alive; }
  function _ri(a,b){ return (typeof ri==="function")?ri(a,b):Math.floor(Math.random()*(b-a+1))+a; }
  function _ch(p){ return (typeof chance==="function")?chance(p):Math.random()<p; }
  function _rand(a){ return (typeof rand==="function")?rand(a):a[Math.floor(Math.random()*a.length)]; }
  function _log(t,cls){ try{ if(typeof log==="function") log(C.age,t,cls||""); }catch(e){} }
  function _toast(t){ try{ if(typeof toast==="function") toast(t); }catch(e){} }
  function _news(t){ try{ if(typeof kAddNews==="function") kAddNews(t); }catch(e){} }
  function _apply(o){ try{ if(typeof applyStats==="function") applyStats(o); }catch(e){} }

  var WORLD_EVENTS=[
    {id:"harvest",name:"Panen Raya",ico:"🌾",dur:[2,4],price:0.85,income:1.15,cls:"e-good",
      news:"🌾 Panen raya melimpah di seluruh negeri — harga pangan anjlok, lumbung penuh.",note:"Harga turun, hasil bumi melimpah."},
    {id:"plague",name:"Wabah Pes",ico:"🦠",dur:[2,5],price:1.18,income:0.8,cls:"e-bad",health:[2,6],
      news:"🦠 Wabah menyebar dari kota ke kota — harga obat melonjak, banyak usaha lesu.",note:"Harga naik, nyawa terancam, usaha lesu."},
    {id:"war",name:"Perang Antar-Wangsa",ico:"⚔️",dur:[3,6],price:1.2,income:0.85,cls:"e-bad",
      news:"⚔️ Perang pecah antar wangsa! Barang langka, jasa prajurit & pandai besi dicari.",note:"Harga naik, permintaan senjata tinggi, bahaya."},
    {id:"blockade",name:"Blokade Dagang",ico:"⛔",dur:[2,4],price:1.25,income:0.75,cls:"e-bad",
      news:"⛔ Jalur dagang diblokade — barang impor langka, harga meroket.",note:"Harga meroket, dagang tersendat."},
    {id:"goldrush",name:"Demam Emas",ico:"⛏️",dur:[2,4],price:1.1,income:1.25,cls:"e-good",
      news:"⛏️ Demam emas! Tambang baru ditemukan — peluang kaya mendadak terbuka.",note:"Peluang untung besar, harga sedikit naik."},
    {id:"festival",name:"Festival Kerajaan",ico:"🎪",dur:[1,2],price:1.08,income:1.1,cls:"e-good",happy:[3,7],
      news:"🎪 Festival akbar kerajaan digelar! Rakyat bersuka cita, pasar ramai.",note:"Kota semarak, kebahagiaan naik."},
    {id:"winter",name:"Musim Dingin Panjang",ico:"❄️",dur:[2,4],price:1.15,income:0.85,cls:"e-bad",health:[1,4],
      news:"❄️ Musim dingin panjang mencekam negeri — kayu bakar & pangan mahal.",note:"Harga naik, nyawa tergerus dingin."},
    {id:"golden",name:"Zaman Keemasan",ico:"🌟",dur:[3,6],price:0.9,income:1.2,cls:"e-good",happy:[2,5],
      news:"🌟 Negeri memasuki Zaman Keemasan — kemakmuran & seni berkembang pesat.",note:"Makmur: harga turun, usaha subur."},
    {id:"bandit",name:"Serbuan Bandit",ico:"🏴",dur:[2,3],price:1.12,income:0.85,cls:"e-bad",
      news:"🏴 Gerombolan bandit merajalela di jalur kafilah — dagang jadi berisiko.",note:"Dagang berisiko, harga naik."},
    {id:"boom",name:"Ledakan Dagang",ico:"📦",dur:[2,4],price:1.05,income:1.3,cls:"e-good",
      news:"📦 Rute dagang baru dibuka ke pulau selatan — perputaran uang meledak!",note:"Usaha untung besar, pasar sibuk."}
  ];
  function evDef(id){ return WORLD_EVENTS.find(function(w){return w.id===id;}); }

  function ensureMarket(){
    if(typeof C==="undefined"||!C) return null;
    if(!C.market) C.market={climate:1.0, events:[]};
    return C.market;
  }
  function marketPriceMul(){
    var m=ensureMarket(); if(!m) return 1;
    var p=m.climate||1; m.events.forEach(function(e){ p*=(e.price||1); });
    return Math.max(0.7,Math.min(1.5,p));
  }
  function marketIncomeMul(){
    var m=ensureMarket(); if(!m) return 1;
    var p=1; m.events.forEach(function(e){ p*=(e.income||1); });
    return Math.max(0.4,Math.min(1.8,p));
  }

  function tickMarket(){
    var m=ensureMarket(); if(!m) return;
    // iklim ekonomi: random walk mean-reverting
    m.climate += (1.0-m.climate)*0.15 + (_ri(-4,4)/100);
    m.climate = Math.max(0.85, Math.min(1.18, m.climate));
    // kurangi durasi & akhiri
    m.events.forEach(function(e){ e.yearsLeft--; });
    m.events.filter(function(e){return e.yearsLeft<=0;}).forEach(function(e){
      _news(e.ico+" "+e.name+" berakhir. Keadaan berangsur normal.");
    });
    m.events=m.events.filter(function(e){ return e.yearsLeft>0; });
    // spawn baru (maks 2 bersamaan)
    if(m.events.length<2 && _ch(0.28)){
      var pool=WORLD_EVENTS.filter(function(w){ return !m.events.find(function(e){return e.id===w.id;}); });
      if(pool.length){
        var w=_rand(pool);
        m.events.push({id:w.id,name:w.name,ico:w.ico,price:w.price,income:w.income,note:w.note,yearsLeft:_ri(w.dur[0],w.dur[1])});
        _news(w.news);
        _log(w.ico+" "+w.name+" dimulai — "+w.note, w.cls==="e-bad"?"e-bad":"");
        _toast(w.ico+" "+w.name+"!");
      }
    }
    // efek samping tahunan peristiwa aktif
    if(hasC()){
      m.events.forEach(function(e){
        var def=evDef(e.id); if(!def) return;
        if(def.health) _apply({health:-_ri(def.health[0],def.health[1])});
        if(def.happy)  _apply({happy:+_ri(def.happy[0],def.happy[1])});
      });
    }
  }

  // ---------- HOOK: harga dipengaruhi pasar (menumpuk di atas penguasa) ----------
  try{
    if(typeof mulCost==="function"){
      var _mc=mulCost;
      mulCost=function(base){
        var v=_mc.apply(this,arguments);
        try{ v=Math.max(1, Math.round(v*marketPriceMul())); }catch(e){}
        return v;
      };
    }
  }catch(e){}

  // ---------- HOOK: income usaha dipengaruhi iklim ekonomi ----------
  try{
    if(typeof processBusinesses==="function"){
      var _pb=processBusinesses;
      processBusinesses=function(){
        var r=_pb.apply(this,arguments);
        try{
          if(hasC() && Array.isArray(C.businesses)){
            var mul=marketIncomeMul();
            if(Math.abs(mul-1)>0.01){
              C.businesses.forEach(function(b){
                var def=(typeof BUSINESS_TYPES!=="undefined")?BUSINESS_TYPES.find(function(x){return x.id===b.id;}):null;
                if(!def) return;
                var base=def.income[b.level]||0;
                var delta=Math.round(base*(mul-1));
                if(delta) C.coin=Math.max(0,C.coin+delta);
              });
            }
          }
        }catch(e){}
        return r;
      };
    }
  }catch(e){}

  // ---------- HOOK tahunan ----------
  try{
    if(typeof advanceYear==="function"){
      var _adv=advanceYear;
      advanceYear=function(){
        var r=_adv.apply(this,arguments);
        try{ if(hasC()){ ensureMarket(); tickMarket(); } }catch(e){}
        return r;
      };
    }
  }catch(e){}

  // ---------- PANEL di tab Peta ----------
  function marketSectionHTML(){
    if(!hasC()) return "";
    var m=ensureMarket(); if(!m) return "";
    var idx=Math.round(marketPriceMul()*100);
    var lbl = idx<95?"Murah (deflasi)": idx>112?"Mahal (inflasi)":"Stabil";
    var col = idx<95?"var(--good)": idx>112?"var(--bad)":"var(--gold-bright)";
    var html="<div class='sechead'>📈 Pasar & Peristiwa Dunia</div>"
      +"<div class='tiles'><div class='tile fullrow'><span class='ti'>📈</span>"
      +"<span class='tn'>Indeks Harga: <b style='color:"+col+"'>"+idx+"%</b> — "+lbl+"</span>"
      +"<span class='td'>"+(m.events.length? (m.events.length+" peristiwa aktif menggerakkan ekonomi") : "Pasar tenang — tak ada gejolak besar")+"</span></div></div>";
    if(m.events.length){
      html+="<div class='tiles'>";
      m.events.forEach(function(e){
        html+="<div class='tile'><span class='ti'>"+e.ico+"</span><span class='tn'>"+e.name+"</span>"
          +"<span class='td'>"+e.note+" · "+e.yearsLeft+" th lagi</span></div>";
      });
      html+="</div>";
    }
    return html;
  }
  try{
    if(typeof renderPeta==="function"){
      var _rp=renderPeta;
      renderPeta=function(){
        var r=_rp.apply(this,arguments);
        try{
          var host=document.getElementById("viewPeta");
          if(host && hasC()) host.insertAdjacentHTML("beforeend", marketSectionHTML());
        }catch(e){}
        return r;
      };
    }
  }catch(e){}

  window.__mantaraEconomy={ensureMarket:ensureMarket,tickMarket:tickMarket,marketPriceMul:marketPriceMul,marketIncomeMul:marketIncomeMul,WORLD_EVENTS:WORLD_EVENTS};
})();


/* ==================================================================
   MANTARA — EKSPEDISI & DUNGEON (roguelike push-your-luck)
   Jelajah dungeon berjenjang ruang-demi-ruang: monster, jebakan,
   harta, altar, teka-teki, pedagang — makin dalam makin berbahaya &
   makin besar loot. Boss di dasar. Loot: koin, item langka, bahan,
   XP guild & reputasi. Nyambung ke Guild, Balai Tempa, inventory.
   Berbasis halaman (pushPage) — tanpa popup.
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
  function esc(s){ try{ return (typeof window.esc==="function")?window.esc(s):String(s);}catch(e){return String(s);} }

  // ---- item loot baru ----
  try{
    if(typeof ITEM_CATALOG!=="undefined"){
      [
        {key:"gemstone",ico:"💎",name:"Permata Kasar",price:0,reusable:false,use:function(){var g=_ri(80,200);C.coin+=g;return "Kau menjual permata seharga "+g+" keping.";}},
        {key:"relic",ico:"🏺",name:"Relik Kuno",price:0,reusable:false,use:function(){var g=_ri(180,420);C.coin+=g;return "Kolektor membeli relik kuno seharga "+g+" keping.";}},
        {key:"rune_shard",ico:"🔹",name:"Serpih Rune",price:0,reusable:false,use:function(){ if(C.isMage){ _apply({mana:8,mind:3}); return "Kau menyerap serpih rune — mana & akal meningkat."; } var g=_ri(120,260); C.coin+=g; return "Kau menjual serpih rune seharga "+g+" keping."; }},
        {key:"beast_core",ico:"🟣",name:"Inti Buas",price:0,reusable:false,use:function(){ _apply({might:5,health:4}); return "Kau menyerap inti buas — tubuhmu menguat."; }}
      ].forEach(function(it){ if(!ITEM_CATALOG.find(function(x){return x.key===it.key;})) ITEM_CATALOG.push(it); });
    }
  }catch(e){}

  var DUNGEONS=[
    {id:"goblin_cave",name:"Gua Goblin",ico:"👺",tier:0,minPow:16,depth:[3,4],boss:"Kepala Suku Goblin",flavor:"Sarang goblin dangkal di tepi hutan."},
    {id:"old_ruins",name:"Reruntuhan Kuno",ico:"🏛️",tier:1,minPow:34,depth:[3,5],boss:"Golem Penjaga",flavor:"Puing peradaban lama, penuh jebakan berkarat."},
    {id:"spider_nest",name:"Sarang Laba-laba",ico:"🕸️",tier:2,minPow:58,depth:[4,5],boss:"Ratu Laba-laba",flavor:"Lorong berselaput sutra & bisa mematikan."},
    {id:"cursed_crypt",name:"Kripta Terkutuk",ico:"⚰️",tier:3,minPow:88,depth:[4,6],boss:"Raja Lich",flavor:"Kripta bangsawan yang bangkit sebagai mayat hidup."},
    {id:"dragon_lair",name:"Liang Naga",ico:"🐉",tier:4,minPow:128,depth:[5,6],boss:"Naga Merah",flavor:"Gua belerang panas, tumpukan harta berkilau."},
    {id:"void_tower",name:"Menara Kehampaan",ico:"🌌",tier:5,minPow:172,depth:[6,7],boss:"Penyihir Kehampaan",flavor:"Menara arcane yang melengkung di luar realita."}
  ];
  function dunById(id){ return DUNGEONS.find(function(d){return d.id===id;}); }

  function power(){
    try{ if(window.__mantaraLiving&&window.__mantaraLiving.guildPower) return window.__mantaraLiving.guildPower(); }catch(e){}
    var s=(C&&C.stats)||{}; return Math.round((s.might||0)+((C&&C.isMage)?(s.mana||0)*0.8:0)+(s.mind||0)*0.2+((C&&C.reputation)||0)*0.15);
  }
  function addGuildXP(x){
    if(!C._guild) C._guild={xp:0,rank:0,done:0,fail:0};
    C._guild.xp=(C._guild.xp||0)+x;
    var need=(C._guild.rank+1)*40;
    while(C._guild.rank<5 && C._guild.xp>=need){ C._guild.rank++; need=(C._guild.rank+1)*40; _log("🎖️ Pangkat Guild naik berkat ekspedisi!","e-good"); }
  }
  function guildRank(){ return (C&&C._guild)?(C._guild.rank||0):0; }

  // ---- state run (module-scoped; loot hilang kalau kabur) ----
  var DR=null;

  function baseDiff(di){ return Math.round(DR.def.minPow*(0.72+di*0.16)+DR.def.tier*4); }
  function winChance(diff){ var pw=power(); return Math.max(0.08, Math.min(0.95, 0.5+(pw-diff)/Math.max(1,diff)*0.5)); }
  function dmg(di,heavy){ var base=4+DR.def.tier*3+di*2; if(heavy)base=Math.round(base*1.6); return _ri(Math.max(1,Math.round(base*0.5)),Math.max(2,base)); }
  function hurt(n){ _apply({health:-n}); if(C.stats.health<=0){ DR.phase="dead"; } }
  function lootItem(){
    var t=DR.def.tier;
    var common=["lucky_coin","training_manual","ancient_scroll","charm_perfume","gemstone"];
    var rare=["gemstone","relic","rune_shard","beast_core"];
    if(t>=3 && _ch(0.5)) return _rand(rare);
    if(t>=1 && _ch(0.25)) return _rand(rare);
    return _rand(common);
  }
  function gainLoot(coin,item,xp,rep){
    if(coin){ DR.loot.coin+=coin; }
    if(item){ DR.loot.items[item]=(DR.loot.items[item]||0)+1; }
    if(xp){ DR.loot.xp+=xp; }
    if(rep){ DR.loot.rep+=rep; }
  }
  function bankLoot(){
    if(!DR) return {coin:0,items:0};
    var itemCount=0;
    C.coin+=DR.loot.coin;
    Object.keys(DR.loot.items).forEach(function(k){ for(var i=0;i<DR.loot.items[k];i++){ _addItem(k); itemCount++; } });
    if(DR.loot.rep) C.reputation=(C.reputation||0)+DR.loot.rep;
    if(DR.loot.xp) addGuildXP(DR.loot.xp);
    return {coin:DR.loot.coin,items:itemCount};
  }

  var ROOM_META={
    monster:{ico:"👹",name:"Ruang Monster"},
    trap:{ico:"🪤",name:"Lorong Berjebakan"},
    treasure:{ico:"💰",name:"Bilik Harta"},
    shrine:{ico:"🛐",name:"Altar Kuno"},
    puzzle:{ico:"🧩",name:"Teka-teki Rune"},
    merchant:{ico:"🧙",name:"Pedagang Bayangan"},
    rest:{ico:"🔥",name:"Perapian Aman"},
    boss:{ico:"☠️",name:"Sarang Boss"}
  };
  function genRoom(di){
    if(di>=DR.target) return {type:"boss",resolved:false};
    var r=Math.random(), type;
    if(r<0.40) type="monster";
    else if(r<0.56) type="trap";
    else if(r<0.70) type="treasure";
    else if(r<0.80) type="shrine";
    else if(r<0.89) type="puzzle";
    else if(r<0.95) type="merchant";
    else type="rest";
    return {type:type,resolved:false};
  }

  // ---- resolusi tiap jenis ruang ----
  window.dunAct=function(kind){
    if(!DR||DR.phase==="dead") return;
    var di=DR.depth, room=DR.room, msg="", cls="e-good";
    if(room.type==="monster" || room.type==="boss"){
      var boss=(room.type==="boss");
      var diff=baseDiff(di)*(boss?1.5:1);
      var wc=winChance(diff);
      if(_ch(wc)){
        var mult=boss?2.6:1;
        var coin=Math.round(_ri(12,26)*(DR.def.tier+1)*mult);
        var xp=(DR.def.tier+1)*(boss?8:3);
        gainLoot(coin, _ch(boss?1:0.5)?lootItem():null, xp, boss?DR.def.tier+3:1);
        if(boss){ gainLoot(0, lootItem(), 0, 0); DR.clearedBoss=true; }
        _sfx("win");
        msg=(boss?"⚔️ Kau menumbangkan "+DR.def.boss+"! Jarahan besar kau rebut."
                 :"⚔️ Kau mengalahkan monster & merampas "+coin+" keping.");
        cls="e-epic";
        var scratch=dmg(di,false); if(!boss) scratch=Math.round(scratch*0.5); hurt(scratch);
      }else{
        var d=dmg(di,boss); hurt(d);
        _sfx("death");
        msg=(boss?"☠️ "+DR.def.boss+" terlalu perkasa! Kau terluka parah (−"+d+" nyawa) dan mundur."
                 :"🩸 Monster melukaimu (−"+d+" nyawa).");
        cls="e-bad";
        if(boss && DR.phase!=="dead"){ DR.phase="retreat"; }
      }
    } else if(room.type==="trap"){
      var diff2=baseDiff(di)*0.9;
      if(power()*(0.6+Math.random()*0.6) >= diff2*0.6){
        var g=_ri(6,16)*(DR.def.tier+1); gainLoot(g,null,1,0);
        msg="🪤 Kau melewati jebakan dengan lincah & menemukan "+g+" keping tersembunyi."; cls="e-good";
      }else{ var d2=dmg(di,false); hurt(d2); msg="🪤 Jebakan terpicu! (−"+d2+" nyawa)."; cls="e-bad"; }
    } else if(room.type==="treasure"){
      var coin2=Math.round(_ri(20,45)*(DR.def.tier+1)); var it=lootItem();
      gainLoot(coin2,it,2,0);
      msg="💰 Peti harta! +"+coin2+" keping"+(it?" & sebuah barang langka":"")+"."; cls="e-epic";
    } else if(room.type==="shrine"){
      if(kind==="heal"){ var h=_ri(12,26); _apply({health:+h}); msg="🛐 Altar memulihkan tubuhmu (+"+h+" nyawa)."; }
      else { var bstat = C.isMage? {mana:6,mind:2} : {might:5,charm:2}; _apply(bstat); msg="🛐 Berkah altar mengalir ke dirimu."; }
      cls="e-good";
    } else if(room.type==="puzzle"){
      if((C.stats.mind||0)*(0.6+Math.random()*0.7) >= baseDiff(di)*0.5){
        var g3=_ri(15,35)*(DR.def.tier+1); var it3=_ch(0.5)?lootItem():null; gainLoot(g3,it3,3,1);
        msg="🧩 Kau memecahkan teka-teki rune! +"+g3+" keping"+(it3?" & barang langka":"")+"."; cls="e-epic";
      }else{ msg="🧩 Rune itu membingungkan. Kau menyerah tanpa hasil."; cls=""; }
    } else if(room.type==="merchant"){
      if(kind==="buy"){
        var price=Math.round(_ri(40,90)*(DR.def.tier+1));
        if(C.coin>=price){ C.coin-=price; var it4=lootItem(); DR.loot.items[it4]=(DR.loot.items[it4]||0)+1; msg="🧙 Kau membeli barang langka dari pedagang bayangan (−"+price+" keping)."; cls="e-good"; }
        else { msg="🧙 Koinmu tak cukup untuk barang pedagang bayangan."; cls="e-bad"; }
      } else { msg="🧙 Kau melewati pedagang bayangan tanpa membeli."; cls=""; }
    } else if(room.type==="rest"){
      var h2=_ri(8,18); _apply({health:+h2}); msg="🔥 Kau beristirahat di perapian aman (+"+h2+" nyawa)."; cls="e-good";
    }
    DR.lastMsg=msg; DR.lastCls=cls; room.resolved=true;
    if(DR.phase!=="dead"){
      if(room.type==="boss" && DR.phase!=="retreat"){ DR.phase="done"; }
      else if(DR.phase!=="retreat"){ DR.phase="choice"; }
    }
    // kematian di dungeon
    if(DR.phase==="dead"){ finishDeath(); return; }
    if(DR.phase==="done"){ finishClear(); return; }
    if(DR.phase==="retreat"){ finishRetreat(true); return; }
    try{ if(typeof mpRefresh==="function") mpRefresh(); if(typeof renderHidup==="function") renderHidup(); }catch(e){}
  };

  window.dunDeeper=function(){
    if(!DR||DR.phase!=="choice") return;
    DR.depth++;
    DR.room=genRoom(DR.depth);
    DR.phase="room";
    try{ if(typeof mpRefresh==="function") mpRefresh(); }catch(e){}
  };
  window.dunRetreat=function(){ finishRetreat(false); };

  function finishRetreat(forced){
    if(!DR) return;
    var r=bankLoot();
    _log((forced?"Kau dipukul mundur dari ":"Kau mundur dari ")+DR.def.name+" membawa "+r.coin+" keping & "+r.items+" barang.","e-good");
    _toast("Ekspedisi selesai: +"+r.coin+" koin");
    endRun();
  }
  function finishClear(){
    if(!DR) return;
    var r=bankLoot();
    if(C._guild) C._guild.done=(C._guild.done||0)+1;
    _log("🏆 Kau menaklukkan "+DR.def.name+" & mengalahkan "+DR.def.boss+"! Total jarahan: "+r.coin+" keping, "+r.items+" barang.","e-epic");
    _toast("🏆 "+DR.def.name+" ditaklukkan!");
    endRun();
  }
  function finishDeath(){
    // loot hilang; kematian ditangani die()
    var nm=DR?DR.def.name:"dungeon";
    DR=null;
    try{ if(typeof mpCloseAll==="function") mpCloseAll(); }catch(e){}
    try{ if(typeof die==="function") die("Tewas di kedalaman "+nm+"."); }catch(e){}
  }
  function endRun(){
    DR=null;
    try{ if(typeof popPage==="function") popPage(); }catch(e){}
    try{ if(typeof renderAll==="function") renderAll(); }catch(e){}
  }

  // ---- HALAMAN RUN ----
  function hpBar(){
    var hp=Math.max(0,Math.round((C.stats&&C.stats.health)||0));
    var col=hp>=60?"var(--good)":hp>=30?"var(--gold)":"var(--bad)";
    return "<div class='exp-pbar' style='margin-top:6px'><div class='exp-pfill' style='width:"+hp+"%;background:"+col+"'></div></div>"
      +"<div style='font-size:9px;color:var(--ink-soft);filter:brightness(1.7);margin-top:2px'>❤️ Nyawa "+hp+"%</div>";
  }
  function lootSummary(){
    var items=Object.keys(DR.loot.items).reduce(function(a,k){return a+DR.loot.items[k];},0);
    return "💰 "+DR.loot.coin+" · 🎁 "+items+" barang · ✦ "+DR.loot.xp+" XP";
  }
  function runHTML(){
    if(!DR) return pgNote("Ekspedisi berakhir.");
    var d=DR.def, room=DR.room, di=DR.depth;
    var rm=ROOM_META[room.type]||ROOM_META.monster;
    var deepText=(room.type==="boss")?("SARANG BOSS — "+d.boss):("Kedalaman "+(di+1)+" / "+(DR.target+1));
    var h="<div class='pg-hero' style='text-align:center;padding:12px;margin:2px 0 10px;background:linear-gradient(155deg,#241a2e,#16110c);border:1px solid var(--line2);border-radius:14px'>"
      +"<div style='font-size:34px'>"+d.ico+"</div>"
      +"<div style='font-size:15px;font-weight:700;color:var(--gold-bright)'>"+d.name+"</div>"
      +"<div style='font-size:10.5px;color:var(--arcane-glow)'>"+deepText+"</div>"
      +hpBar()
      +"<div style='font-size:10px;color:var(--gold);margin-top:6px'>Jarahan: "+lootSummary()+"</div></div>";

    if(DR.lastMsg){ h+=pgNote(DR.lastMsg); }

    if(DR.phase==="room" || (DR.phase==="choice"&&!room.resolved)){
      h+=pgSec(rm.ico+" "+rm.name);
      if(room.type==="boss"){
        var wc=Math.round(winChance(baseDiff(di)*1.5)*100);
        h+=pgNote("Boss <b>"+d.boss+"</b> menghadangmu di dasar. Peluang menang ~"+wc+"%. Menang = jarahan besar; kalah = terluka parah & terpukul mundur.");
        h+=pgRow({ico:"⚔️",title:"Lawan "+d.boss,sub:"pertaruhkan segalanya",on:function(){window.dunAct("fight");}});
      } else if(room.type==="monster"){
        var wc2=Math.round(winChance(baseDiff(di))*100);
        h+=pgRow({ico:"⚔️",title:"Serang monster",sub:"peluang menang ~"+wc2+"%",on:function(){window.dunAct("fight");}});
      } else if(room.type==="shrine"){
        h+=pgRow({ico:"❤️",title:"Berdoa untuk pemulihan",sub:"pulihkan nyawa",on:function(){window.dunAct("heal");}});
        h+=pgRow({ico:"✨",title:"Mohon berkah kekuatan",sub:"bonus stat",on:function(){window.dunAct("bless");}});
      } else if(room.type==="merchant"){
        h+=pgRow({ico:"🛒",title:"Beli barang langka",sub:"bayar koin untuk item",on:function(){window.dunAct("buy");}});
        h+=pgRow({ico:"🚶",title:"Lewati saja",sub:"tanpa membeli",on:function(){window.dunAct("skip");}});
      } else {
        h+=pgRow({ico:rm.ico,title:"Selidiki",sub:"lihat apa yang menanti",on:function(){window.dunAct("go");}});
      }
    } else if(DR.phase==="choice"){
      h+=pgSec("Persimpangan");
      h+=pgNote("Lorong bercabang. Makin dalam makin berbahaya, tapi jarahan makin besar. Amankan jarahanmu sekarang atau lanjut turun?");
      h+=pgRow({ico:"⬇️",title:"Turun lebih dalam",sub:"risiko naik, hadiah lebih besar",on:function(){window.dunDeeper();}});
      h+=pgRow({ico:"🏃",title:"Mundur & amankan jarahan",sub:"keluar membawa "+lootSummary(),on:function(){window.dunRetreat();}});
    }
    h+=pgNote("⚠️ Kabur lewat tombol kembali = jarahan hangus. Waspadai nyawamu — mati di sini berarti tamat.");
    return h;
  }

  window.enterDungeon=function(id){
    if(!hasC()){ _toast("Mulai hidup dulu."); return; }
    if(C.age<15){ _toast("Ekspedisi untuk petualang usia 15+."); return; }
    var d=dunById(id); if(!d) return;
    if((C.stats.health||0)<25){ _toast("Nyawamu terlalu lemah untuk berekspedisi. Pulihkan dulu."); return; }
    var target=_ri(d.depth[0],d.depth[1]);
    DR={def:d,depth:0,target:target-1,loot:{coin:0,items:{},xp:0,rep:0},room:null,phase:"room",lastMsg:null,clearedBoss:false};
    DR.room=genRoom(0);
    _sfx("year");
    if(typeof pushPage==="function") pushPage({title:d.name, render:runHTML});
  };

  // ---- HALAMAN PILIH EKSPEDISI ----
  window.openExpeditions=function(){
    DR=null;
    if(typeof pushPage!=="function") return;
    pushPage({title:"Ekspedisi & Dungeon", render:function(){
      if(!hasC()) return pgNote("Mulai hidup dulu.");
      var pw=power(); var rk=guildRank();
      var h=pgNote("Kekuatan tempurmu: <b style='color:var(--gold-bright)'>⚔️ "+pw+"</b> · Pangkat Guild membuka dungeon lebih ganas. Perkuat stat, gear (Balai Tempa), & peliharaan sebelum turun.");
      h+=pgSec("Pilih Tujuan");
      DUNGEONS.forEach(function(d){
        var locked = d.tier > rk+1; // guild rank membuka tier
        var wc=Math.round(winChance(Math.round(d.minPow*0.72+d.tier*4))*100);
        var col=wc>=60?"var(--good)":wc>=35?"var(--gold-bright)":"var(--bad)";
        h+=pgRow({ico:d.ico,title:d.name+(locked?" 🔒":""),
          sub: locked ? ("terkunci — naikkan pangkat Guild dulu")
                      : (d.flavor+" · butuh kekuatan ~"+d.minPow+" · peluang awal "+wc+"%"),
          right: locked?"🔒":"›",
          dim: locked,
          on: locked?null:function(){ window.enterDungeon(d.id); }});
      });
      h+=pgNote("Boss di dasar tiap dungeon menjatuhkan jarahan terbesar. Loot: koin, barang langka, XP guild & reputasi. Nyawa habis di dalam = tamat riwayatmu.");
      return h;
    }});
  };

  // ---- pintu masuk di tab Peta ----
  function expeditionTileHTML(){
    if(!hasC()) return "";
    return "<div class='sechead'>🗺️ Ekspedisi</div>"
      +"<div class='tiles'><div class='tile fullrow' onclick='openExpeditions()'>"
      +"<span class='ti'>⚔️</span><span class='tn'>Ekspedisi & Dungeon</span>"
      +"<span class='td'>Jelajah dungeon berjenjang — monster, jebakan, harta, boss & loot langka</span></div></div>";
  }
  try{
    if(typeof renderPeta==="function"){
      var _rp=renderPeta;
      renderPeta=function(){
        var r=_rp.apply(this,arguments);
        try{ var host=document.getElementById("viewPeta"); if(host&&hasC()) host.insertAdjacentHTML("beforeend", expeditionTileHTML()); }catch(e){}
        return r;
      };
    }
  }catch(e){}

  window.__mantaraDungeon={DUNGEONS:DUNGEONS,enter:function(id){window.enterDungeon(id);},state:function(){return DR;},power:power};
})();
