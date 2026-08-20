/* ==================================================================
   MANTARA v25 — PILAR 2: LANGIT
   ------------------------------------------------------------------
   Sampai v24, keempat turnamen semuanya di darat, padahal sistem
   reqMount sudah mendukung syarat tunggangan. Dimensi vertikal tidak
   pernah ada.

   Modul ini menambah:
     · 6 tunggangan terbang, termasuk sapu terbang tingkat murah
     · 2 balapan udara (Balap Cincin Langit, Lari Badai Frostspire)
     · perjalanan antar kota lebih murah kalau bisa terbang
     · Frostspire jadi kota langit (identitas yang selama ini kosong)

   Catatan desain penting:
   Sapu Abu sengaja dihargai 420 keping. Griffon 1.900 keping berarti
   langit hanya milik pemain kaya. Dengan sapu murah, anak petani pun
   bisa masuk cabang ini — itu yang membuatnya terasa adil, bukan
   konten eksklusif.

   Balapannya lintasan cincin, bukan olahraga bola tim di udara:
   lebih pas dengan struktur turnamen-berronde yang sudah ada, dan
   menjauh dari properti fantasi tertentu.
   ================================================================== */
Mantara.module("langit", function(M){
  "use strict";
  var U = M.u;

  /* ---------------------------------------------------------------
     1) TUNGGANGAN TERBANG — ditambahkan ke GEAR_CATALOG yang sudah ada
     fly: 1 = melayang rendah · 2 = terbang mantap · 3 = menembus badai
     --------------------------------------------------------------- */
  var SKY_MOUNTS = [
    {key:"broom_ash",   name:"Sapu Abu",       price:420,  fly:1, perk:{mana:2,charm:1},
     desc:"Sapu kayu abu buatan tukang desa. Goyah di angin kencang, tapi ia terbang — dan itu cukup."},
    {key:"hippogriff",  name:"Hipogrif",       price:1100, fly:2, perk:{charm:3,might:2},
     desc:"Setengah elang, setengah kuda. Menuntut hormat sebelum menuruti."},
    {key:"broom_storm", name:"Sapu Badai",     price:1400, fly:2, perk:{mana:4,charm:2,mind:1}, arcane:true,
     desc:"Ditempa di Menara Frostspire. Menembus badai tanpa oleng."},
    {key:"wyvern",      name:"Wyvern",         price:2400, fly:3, perk:{might:6,reputation:2},
     desc:"Sepupu naga yang bisa dijinakkan. Nyaris."},
    {key:"unicorn_mnt", name:"Unicorn",        price:2600, fly:1, perk:{charm:6,mana:3,happy:2},
     desc:"Melangkah di udara seolah tanah masih ada di bawahnya."},
    {key:"phoenix_mnt", name:"Phoenix Dewasa", price:3800, fly:3, perk:{mana:7,health:3}, arcane:true,
     desc:"Api yang membawamu, dan api yang menolak membakarmu."}
  ];

  try{
    if(typeof GEAR_CATALOG!=="undefined" && GEAR_CATALOG.mount){
      SKY_MOUNTS.forEach(function(v){
        if(!GEAR_CATALOG.mount.variants.some(function(x){ return x.key===v.key; }))
          GEAR_CATALOG.mount.variants.push(v);
      });
      /* griffon lama ikut dianggap bisa terbang */
      var g = GEAR_CATALOG.mount.variants.find(function(x){ return x.key==="griffon"; });
      if(g && !g.fly) g.fly = 2;
    }
  }catch(e){}

  var FLY_KEYS = SKY_MOUNTS.map(function(v){ return v.key; }).concat(["griffon"]);

  function gearFlyLevel(){
    try{
      var k = C.gear && C.gear.mount;
      if(!k) return 0;
      var v = GEAR_CATALOG.mount.variants.find(function(x){ return x.key===k; });
      return (v && v.fly) ? v.fly : 0;
    }catch(e){ return 0; }
  }

  /* tingkat terbang efektif = yang tertinggi antara gear & bestia terikat */
  function flyLevel(){
    var a = gearFlyLevel();
    var b = 0;
    try{ var bst = M.get("bestia"); if(bst && M.flyLevelFromBestia) b = M.flyLevelFromBestia(); }catch(e){}
    return Math.max(a, b);
  }
  M.flyLevel = flyLevel;
  window.mantaraFlyLevel = flyLevel;

  /* ---------------------------------------------------------------
     2) BALAPAN UDARA — memakai struktur TOURNAMENTS yang sudah ada.
     reqMount diisi kunci tunggangan terbang, jadi hasReqMount() lama
     bekerja tanpa perlu diubah sama sekali.
     --------------------------------------------------------------- */
  var SKY_RACES = [
    {id:"skyring", ico:"🌀", name:"Balap Cincin Langit", stat:"charm", altStat:"mana",
     entry:80, anim:"race", reqMount:FLY_KEYS,
     rounds:[{diff:45,prize:180},{diff:65,prize:420},{diff:85,prize:900}],
     desc:"Menembus cincin melayang di atas kota. Butuh tunggangan terbang."},
    {id:"stormrun", ico:"🌩️", name:"Lari Badai Frostspire", stat:"mana", altStat:"might",
     entry:200, anim:"race", reqMount:["broom_storm","wyvern","phoenix_mnt"],
     rounds:[{diff:60,prize:500},{diff:80,prize:1200},{diff:93,prize:2800}],
     desc:"Menembus badai mana di atas Menara. Hanya tunggangan terbang tingkat tertinggi."}
  ];

  try{
    if(typeof TOURNAMENTS!=="undefined"){
      SKY_RACES.forEach(function(t){
        if(!TOURNAMENTS.some(function(x){ return x.id===t.id; })) TOURNAMENTS.push(t);
      });
    }
  }catch(e){}

  /* ---------------------------------------------------------------
     3) PERJALANAN — terbang memangkas biaya aksi
     travelCost() diperkenalkan di v24; dibungkus sekali di sini.
     --------------------------------------------------------------- */
  if(typeof travelCost==="function"){
    var _skyTravel = travelCost;
    window.travelCost = travelCost = function(from, to){
      var base = _skyTravel.apply(this, arguments);
      var f = flyLevel();
      if(f >= 3) return 1;
      if(f >= 2) return Math.max(1, base - 1);
      if(f >= 1 && base > 2) return base - 1;
      return base;
    };
  }

  /* ---------------------------------------------------------------
     4) KEJADIAN UDARA — risiko & imbalan khas terbang
     --------------------------------------------------------------- */
  M.on("year:end", function(){
    if(!U.alive()) return;
    var f = flyLevel(); if(f <= 0) return;

    /* jatuh — makin rendah tingkat terbang, makin sering */
    var risk = f===1 ? 0.10 : f===2 ? 0.05 : 0.025;
    if(U.chance(risk)){
      var luka = U.ri(8, 22) - f*3;
      U.stats({health: -Math.max(4, luka)});
      U.music("mourn");
      U.log("🪂 Angin menghantammu di ketinggian. Kau jatuh, dan beruntung masih bisa bercerita.", "e-bad");
      return;
    }
    /* pemandangan & peluang khas langit */
    if(U.chance(0.20)){
      var roll = U.ri(1,3);
      if(roll===1){
        var g = U.ri(40, 60*f);
        U.coin(g);
        U.log("🕊️ Kau mengantar pesan mendesak lewat udara. Upah "+U.money(g)+" keping.", "e-good");
      }else if(roll===2){
        U.stats({happy:+7, mind:+2});
        U.log("☁️ Kau terbang di atas awan saat fajar. Dunia terlihat kecil, dan masalahmu ikut mengecil.", "e-good");
      }else if(f>=2){
        U.stats({charm:+2});
        try{ if(C) C.reputation=(C.reputation||0)+4; }catch(e){}
        U.log("🌀 Anak-anak kota menunjuk ke langit saat kau lewat. Namamu ikut naik.", "e-good");
      }
    }
  });

  /* ---------------------------------------------------------------
     5) FROSTSPIRE = KOTA LANGIT
     Selama ini Frostspire cuma "dingin dan menyakitkan". Sekarang ia
     punya alasan untuk didatangi.
     --------------------------------------------------------------- */
  M.on("year:end", function(){
    if(!U.alive() || C.cityId!=="frostspire") return;
    if(flyLevel() <= 0) return;
    if(!U.chance(0.25)) return;
    try{
      if(typeof addRes==="function"){ /* kalau modul kota menyediakannya */ }
      if(C.cityRes){ C.cityRes.crystal = (C.cityRes.crystal||0) + U.ri(1,2); }
    }catch(e){}
    U.stats({mana: C.isMage ? +3 : +1});
    U.log("❄️ Kau memanen kristal mana langsung dari pusaran badai di atas Menara. 💠", "e-good");
  });

  /* ---------------------------------------------------------------
     6) PANEL LANGIT di tab Hidup
     --------------------------------------------------------------- */
  var LABEL = ["", "melayang rendah", "terbang mantap", "menembus badai"];
  M.on("hidup:render", function(ctx){
    if(!U.alive()) return;
    var f = flyLevel(); if(f <= 0) return;
    var src = "";
    try{
      var bst = M.get("bestia"); var r = bst && bst.flying && bst.flying();
      if(r) src = r.name;
      else {
        var v = GEAR_CATALOG.mount.variants.find(function(x){ return x.key===C.gear.mount; });
        src = v ? v.name : "";
      }
    }catch(e){}
    var races = [];
    try{
      SKY_RACES.forEach(function(t){
        if(t.reqMount.indexOf(mountKey())>=0 || (t.id==="skyring" && f>=1)) races.push(t.ico+" "+t.name);
      });
    }catch(e){}
    ctx.blocks.push(
      "<div class='sky-box'><div class='sky-head'>🌀 Langit</div>"
      + "<div class='sky-line'><b>"+U.esc(src)+"</b> · "+LABEL[f]+" (tingkat "+f+"/3)</div>"
      + (races.length ? "<div class='sky-sub'>Terbuka: "+races.join(" · ")+"</div>" : "")
      + "<div class='sky-sub'>Perjalanan antar kota lebih murah.</div></div>");
  });

  M.on("boot", function(){
    if(document.getElementById("langitStyle")) return;
    var st = document.createElement("style"); st.id="langitStyle";
    st.textContent =
      ".sky-box{margin:8px 4px 10px;padding:9px 11px;border:1px solid rgba(120,190,255,.24);border-radius:12px;"
     +"background:linear-gradient(160deg,rgba(18,32,54,.75),rgba(10,16,30,.75))}"
     +".sky-head{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:#8fd0ff;margin-bottom:5px}"
     +".sky-line{font-size:12.5px;line-height:1.5}"
     +".sky-sub{font-size:10px;color:var(--ink-soft);filter:brightness(1.5);margin-top:2px}";
    document.head.appendChild(st);
  });

  return { SKY_MOUNTS: SKY_MOUNTS, SKY_RACES: SKY_RACES, flyLevel: flyLevel, FLY_KEYS: FLY_KEYS };
});
