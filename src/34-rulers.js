/* ==================================================================
   MANTARA — MUSIK EVENT (Duka & Kemenangan)
   • Ashen Chapel Echo (mourn): saat relasi (kerabat/pet/teman) wafat
     atau momen duka lain (perpisahan, kematian).
   • Banner at Dawn (triumph): saat dapat prestasi / momen membahagiakan
     & memuaskan (promosi, lulus, menang bounty, naik takhta, dll).
   Juga menambah EVENT tasteful: relasi bisa wafat seiring waktu,
   supaya momen duka benar-benar terjadi.
   Modul mandiri; men-hook log() & toast() dengan cooldown.
   ================================================================== */
(function(){
  "use strict";
  function hasC(){ return typeof C!=="undefined" && C && C.alive; }
  function _ri(a,b){ return (typeof ri==="function")?ri(a,b):Math.floor(Math.random()*(b-a+1))+a; }
  function _ch(p){ return (typeof chance==="function")?chance(p):Math.random()<p; }
  function _rand(a){ return (typeof rand==="function")?rand(a):a[Math.floor(Math.random()*a.length)]; }
  function mood(m,after){ try{ if(typeof window.MusicMood==="function") window.MusicMood(m,{force:true,revert:"calm",after:after||42000}); }catch(e){} }

  // kata kunci
  var HAPPY=[/prestasi/i,/🏅/,/dipromosikan/i,/promosi/i,/lulus/i,/naik takhta/i,/jadi raja/i,
    /bounty selesai/i,/juara/i,/kau menang/i,/memenangkan/i,/legenda/i,/terukir sebagai legenda/i,
    /menumbangkan/i,/menerima cintamu/i,/kalian bertunangan/i,/kau menikah/i,/naik ke tingkat/i,
    /pangkat guild naik/i,/kau dinobatkan/i,/gelar/i];
  var SAD=[/wafat/i,/meninggal/i,/berpulang/i,/\bgugur\b/i,/\btewas\b/i,/pergi meninggalkan/i,
    /kau berpisah/i,/berduka/i,/duka/i,/kabar duka/i,/menghembuskan napas/i,/telah tiada/i];

  var lastTrig={mourn:0,triumph:0};
  function fire(kind){
    var now=Date.now();
    if(now-(lastTrig[kind]||0) < 20000) return; // cooldown 20s biar tak thrash
    lastTrig[kind]=now;
    mood(kind==="sad"?"mourn":"triumph", kind==="sad"?46000:38000);
  }
  function scan(text,cls){
    if(!text) return;
    var s=String(text);
    if(cls==="e-death"){ fire("sad"); return; }
    for(var i=0;i<SAD.length;i++){ if(SAD[i].test(s)){ fire("sad"); return; } }
    if(cls==="e-epic"){
      // e-epic hampir selalu momen membahagiakan/memuaskan
      for(var b=0;b<SAD.length;b++){ if(SAD[b].test(s)) return; } // kecuali teks duka
      fire("happy"); return;
    }
    for(var j=0;j<HAPPY.length;j++){ if(HAPPY[j].test(s)){ fire("happy"); return; } }
  }

  // hook log()
  try{
    if(typeof log==="function"){
      var _log=log;
      log=function(yr,text,cls){
        var r=_log.apply(this,arguments);
        try{ scan(text,cls); }catch(e){}
        return r;
      };
    }
  }catch(e){}
  // hook toast() (prestasi kadang cuma toast)
  try{
    if(typeof toast==="function"){
      var _toast=toast;
      toast=function(msg){
        var r=_toast.apply(this,arguments);
        try{ scan(msg,null); }catch(e){}
        return r;
      };
    }
  }catch(e){}

  /* ============================================================
     EVENT TASTEFUL: relasi bisa wafat seiring waktu
     ============================================================ */
  function kinLabel(r){
    if(r.kin) return r.kin;
    if(r.role==="pasangan") return "pasanganmu";
    if(r.role==="bestie") return "sahabat karibmu";
    if(r.role==="teman") return "temanmu";
    if(r.role==="keluarga") return "kerabatmu";
    if(r.role==="pengikut") return "pengikut setiamu";
    return "orang terdekatmu";
  }
  function maybeRelationDeath(){
    if(!hasC() || !Array.isArray(C.relations) || !C.relations.length) return;
    if(C.age<16) return; // jarang saat sangat muda
    // kandidat: keluarga, sahabat, pasangan, teman, pengikut — TANPA anak kandung (ahli waris aman) & musuh
    var pool=C.relations.filter(function(r){
      return r && !r.isChild && (r.role==="keluarga"||r.role==="bestie"||r.role==="pasangan"||r.role==="teman"||r.role==="pengikut");
    });
    if(!pool.length) return;
    // peluang dasar kecil, naik seiring usia karakter (kerabat menua)
    var base=0.025 + Math.max(0,(C.age-30))*0.002; // ~2.5% di muda → ~10% di usia 60
    base=Math.min(0.10, base);
    if(!_ch(base)) return;
    // orang tua (Ibu/Ayah) & kakak lebih rentan lebih dulu; pilih dgn bobot
    var weighted=[];
    pool.forEach(function(r){
      var w=1;
      if(r.kin==="Ibu"||r.kin==="Ayah") w=3;
      else if(r.kin==="Kakak") w=2;
      else if(r.role==="pengikut") w=2;
      for(var i=0;i<w;i++) weighted.push(r);
    });
    var victim=_rand(weighted);
    // hapus dari relasi
    C.relations=C.relations.filter(function(r){ return r.id!==victim.id; });
    var causes=["karena usia tua","akibat wabah","dalam tidurnya dengan tenang","karena sakit berkepanjangan","dalam sebuah kecelakaan"];
    var cause=_rand(causes);
    var nm=victim.name||"Seseorang";
    try{ if(typeof log==="function") log(C.age, "🕯️ "+nm+" ("+kinLabel(victim)+") telah wafat "+cause+". Kau berduka.", "e-death"); }catch(e){}
    // dampak emosi
    var hit=(victim.role==="pasangan"||victim.kin==="Ibu"||victim.kin==="Ayah")? _ri(10,18): _ri(5,11);
    try{ if(typeof applyStats==="function") applyStats({happy:-hit}); }catch(e){}
    if(victim.role==="pasangan"){ C.married=false; }
    try{ if(typeof toast==="function") toast("🕯️ "+nm.split(" ")[0]+" telah wafat."); }catch(e){}
    // catatan: scan() akan menangkap "e-death" → memutar Ashen Chapel
  }

  try{
    if(typeof processYearly==="function"){
      var _prevPY=processYearly;
      processYearly=function(){
        var r=_prevPY.apply(this,arguments);
        try{ maybeRelationDeath(); }catch(e){}
        return r;
      };
    }
  }catch(e){}

  window.__mantaraEventMusic={scan:scan,maybeRelationDeath:maybeRelationDeath};
})();


/* ==================================================================
   MANTARA — PENGUASA KOTA & KEBIJAKAN (dunia politik hidup)
   • Tiap kota punya penguasa dengan KEPRIBADIAN (arketipe) yang
     memengaruhi harga & kehidupan seluruh aktivitas di kota itu.
   • Penguasa menua & berganti lintas generasi (wafat/kudeta) —
     tercantum di Berita + notifikasi.
   • Tiap pergantian mengumumkan KEBIJAKAN baru.
   • Aetheria mengikuti "Raja" dari sistem politik yang sudah ada.
   Modul mandiri; memakai ulang kAddNews/berita, mulCost, pushPage.
   ================================================================== */
(function(){
  "use strict";
  function hasC(){ return typeof C!=="undefined" && C && C.alive; }
  function _ri(a,b){ return (typeof ri==="function")?ri(a,b):Math.floor(Math.random()*(b-a+1))+a; }
  function _ch(p){ return (typeof chance==="function")?chance(p):Math.random()<p; }
  function _rand(a){ return (typeof rand==="function")?rand(a):a[Math.floor(Math.random()*a.length)]; }
  function _name(f){ try{ return (typeof randName==="function")?randName(f):"Roderic"; }catch(e){ return "Roderic"; } }
  function _log(t,cls){ try{ if(typeof log==="function") log(C.age,t,cls||""); }catch(e){} }
  function _toast(t){ try{ if(typeof toast==="function") toast(t); }catch(e){} }
  function _news(t){ try{ if(typeof kAddNews==="function") kAddNews(t); }catch(e){} }
  function _apply(o){ try{ if(typeof applyStats==="function") applyStats(o); }catch(e){} }
  function cityList(){ try{ return CITIES; }catch(e){ return []; } }
  function cityById(id){ return cityList().find(function(c){return c.id===id;})||{id:id,name:id,ico:"🏙️"}; }

  var CITY_RULER_TITLE={aetheria:"Raja",thornvale:"Adipati",saltmoor:"Bandar Agung",frostspire:"Magister"};

  // ---------- ARKETIPE KEPRIBADIAN ----------
  var ARCHES={
    ramah:{name:"Ramah & Dermawan",ico:"😊",cost:0.9,coinYr:[6,18],statYr:{happy:2},rep:1,
      blurb:"Penguasa yang mengasihi rakyat. Harga murah, hidup tenteram, sedekah mengalir.",
      effect:"Harga −10% · +kebahagiaan & sedikit koin tiap tahun · kota aman.",
      policies:["Pajak diringankan untuk rakyat kecil.","Lumbung kerajaan dibuka saat paceklik.","Sedekah bulanan bagi kaum papa.","Jalan & jembatan diperbaiki tanpa pungutan."],
      flavor:["Rakyat memuji kedermawanan sang penguasa.","Sedekah kerajaan sampai ke pintumu.","Pasar ramai, harga bersahabat."]},
    serius:{name:"Serius & Disiplin",ico:"⚖️",cost:1.0,coinYr:[0,6],statYr:{mind:2},rep:1,
      blurb:"Menjunjung hukum & ketertiban. Kota aman dan tertib, meski terasa kaku.",
      effect:"Harga normal · +akal tiap tahun · kejahatan ditekan.",
      policies:["Hukum ditegakkan tanpa pandang bulu.","Wajib belajar bagi anak-anak kota.","Jam malam diberlakukan demi keamanan.","Korupsi pejabat diberantas keras."],
      flavor:["Pengawal kota berpatroli tertib.","Pengumuman dekrit hukum dibacakan di alun-alun.","Segalanya berjalan sesuai aturan."]},
    flamboyan:{name:"Flamboyan",ico:"🎭",cost:1.15,coinYr:[-6,8],statYr:{charm:2,happy:1},rep:0,
      blurb:"Gemar pesta & kemewahan. Kota semarak dan penuh warna, tapi harga membumbung.",
      effect:"Harga +15% · +pesona & kebahagiaan · festival tanpa henti.",
      policies:["Festival kota digelar sepanjang musim.","Pajak kemewahan membiayai pesta akbar.","Seniman & bard mendapat naungan istana.","Pertunjukan megah tiap purnama."],
      flavor:["Musik & tawa memenuhi jalanan kota.","Parade warna-warni melintasi alun-alun.","Semua orang berdandan untuk pesta istana."]},
    bengis:{name:"Bengis & Lalim",ico:"😈",cost:1.25,coinYr:[-24,-8],statYr:{might:2,happy:-2},rep:-1,
      blurb:"Tiran kejam. Pajak mencekik & rakyat takut, tapi militer kota amat perkasa.",
      effect:"Harga +25% · pajak menggerus koin · +kekuatan · kota mencekam.",
      policies:["Wajib militer bagi seluruh pemuda.","Pajak upeti dinaikkan drastis.","Pembangkang dihukum di alun-alun.","Perbatasan ditutup, darurat perang diberlakukan."],
      flavor:["Pemungut pajak mengetuk keras pintu-pintu.","Tiang gantungan berdiri di alun-alun sebagai peringatan.","Latihan militer menggema hingga malam."]},
    licik:{name:"Licik & Culas",ico:"🦑",cost:1.05,coinYr:[-16,26],statYr:{},rep:-1,
      blurb:"Penguasa korup. Suap merajalela, pasar gelap subur, peruntungan naik-turun.",
      effect:"Harga fluktuatif · koin bisa untung/rugi tak terduga · pasar gelap subur.",
      policies:["Suap jadi pelicin segala urusan.","Pasar gelap dibiarkan berkembang.","Jabatan diperjualbelikan diam-diam.","Cukai dagang penuh celah & pungli."],
      flavor:["Koin berpindah tangan di lorong-lorong gelap.","Pejabat berbisik menawarkan 'jalan pintas'.","Entah untung entah buntung hari ini."]},
    arcane:{name:"Bijak Arcane",ico:"🔮",cost:1.05,coinYr:[0,6],statYr:{},mageBonus:{mana:2,mind:1},rep:0,
      blurb:"Pelindung ilmu sihir. Para penyihir makmur & dimuliakan di bawah naungannya.",
      effect:"Harga normal · penyihir dapat +mana/akal tiap tahun · riset arcane didanai.",
      policies:["Beasiswa bagi penyihir muda berbakat.","Menara arcane dibuka untuk umum.","Riset mantra didanai perbendaharaan kota.","Perpustakaan kuno dibuka bagi para pelajar."],
      flavor:["Cahaya arcane berpendar dari menara sihir.","Para penyihir berkumpul menukar mantra.","Aliran mana terasa lebih pekat di udara kota."]},
    inkuisitor:{name:"Inkuisitor Fanatik",ico:"⛪",cost:1.0,coinYr:[0,4],statYr:{},magePenalty:{mana:-3,happy:-2},rep:1,
      blurb:"Fanatik anti-sihir. Rakyat biasa taat & aman, namun penyihir diburu tanpa ampun.",
      effect:"Harga normal · penyihir menderita (−mana) & terancam · warga saleh dihormati.",
      policies:["Sihir dilarang keras di seluruh penjuru kota.","Inkuisisi memburu penyihir liar.","Ibadah wajib bagi seluruh warga.","Hadiah besar bagi pelapor penyihir."],
      flavor:["Lonceng inkuisisi berdentang memanggil ibadah.","Poster buruan penyihir tertempel di tembok kota.","Para penyihir menyembunyikan jati diri mereka."]},
  };
  var ARCH_KEYS=Object.keys(ARCHES);

  // ---------- DATA ----------
  function newRuler(cityId){
    var arch=_rand(ARCH_KEYS); var a=ARCHES[arch];
    return { name:_name(_ch(0.22)), dynasty:_rand((typeof DYNASTIES!=="undefined")?DYNASTIES:["Wangsa Aurelius"]),
      age:_ri(28,58), years:_ri(1,15), arch:arch, policy:_rand(a.policies), _kid:null };
  }
  function ensureRulers(){
    if(!hasC() && typeof C==="undefined") return;
    if(typeof C==="undefined"||!C) return;
    if(!C.rulers) C.rulers={};
    cityList().forEach(function(c){ if(!C.rulers[c.id]) C.rulers[c.id]=newRuler(c.id); });
    syncAetheria();
  }
  // Aetheria mengikuti Raja dari sistem politik yang ada
  function syncAetheria(){
    if(typeof ensureKingdom!=="function") return;
    var K; try{ K=ensureKingdom(); }catch(e){ return; }
    if(!K||!K.king) return;
    var rl=C.rulers&&C.rulers.aetheria; if(!rl) return;
    var idn=(K.king.name||"?")+"|"+(K.king.dynasty||"?");
    if(rl._kid!==idn){
      var wasFirst=(rl._kid==null);
      rl._kid=idn;
      rl.name=K.king.name||rl.name; rl.dynasty=K.king.dynasty||rl.dynasty;
      rl.age=K.king.age||rl.age; rl.years=K.king.years||1;
      rl.arch=_rand(ARCH_KEYS); rl.policy=_rand(ARCHES[rl.arch].policies);
      if(!wasFirst) announcePolicy("aetheria","natural");
    }
  }
  function rulerOf(cityId){ if(!C.rulers) ensureRulers(); return C.rulers?C.rulers[cityId]:null; }
  function archOf(cityId){ var rl=rulerOf(cityId); return rl?ARCHES[rl.arch]:null; }

  // ---------- PENGUMUMAN ----------
  function announcePolicy(cityId,mode){
    var c=cityById(cityId); var rl=C.rulers[cityId]; if(!rl) return;
    var a=ARCHES[rl.arch]; var title=CITY_RULER_TITLE[cityId]||"Penguasa";
    _news("📜 Kebijakan baru "+c.name+" — "+title+" "+rl.name+" ("+a.ico+" "+a.name+"): “"+rl.policy+"”");
    if(C.cityId===cityId){
      _log("📜 "+title+" "+rl.name.split(" ")[0]+" menerapkan kebijakan baru di "+c.name+": "+rl.policy,"");
      _toast(a.ico+" Kebijakan baru di "+c.name+"!");
    }
  }
  function succeed(cityId,mode){
    var c=cityById(cityId); var old=C.rulers[cityId];
    var title=CITY_RULER_TITLE[cityId]||"Penguasa";
    var coup=(mode==="coup");
    var fresh=newRuler(cityId);
    if(coup){ // dinasti berbeda
      var others=(typeof DYNASTIES!=="undefined")?DYNASTIES.filter(function(d){return d!==(old&&old.dynasty);}):null;
      if(others&&others.length) fresh.dynasty=_rand(others);
      fresh.age=_ri(24,42); fresh.years=0;
    } else { fresh.years=0; fresh.age=_ri(26,48); }
    C.rulers[cityId]=fresh;
    var head=coup
      ? "⚔️ KUDETA di "+c.name+"! "+fresh.dynasty+" merebut kuasa — "+title+" "+ (old?old.name:"lama") +" digulingkan."
      : "⚰️ "+title+" "+ (old?old.name:"") +" dari "+c.name+" mangkat. "+fresh.name+" ("+fresh.dynasty+") naik takhta.";
    _news(head);
    _log(head, coup?"e-bad":"e-good"); // notifikasi (hindari kelas e-epic/e-death agar musik tak salah picu)
    if(C.cityId===cityId) _toast((coup?"⚔️":"⚰️")+" Penguasa baru di "+c.name+"!");
    announcePolicy(cityId, mode);
  }

  // ---------- SUKSESI TAHUNAN ----------
  function tickRulers(){
    ensureRulers();
    cityList().forEach(function(c){
      if(c.id==="aetheria") return; // ikut sistem Raja politik (disinkron di syncAetheria)
      var rl=C.rulers[c.id]; if(!rl) return;
      rl.age++; rl.years++;
      var dc = rl.age>66?0.16 : rl.age>56?0.07 : 0.025;
      if(_ch(dc)) succeed(c.id, _ch(0.16)?"coup":"natural");
      else if(_ch(0.015)) succeed(c.id,"coup"); // gejolak politik langka
    });
    syncAetheria();
  }

  // ---------- EFEK KEPRIBADIAN pada kehidupan kota ----------
  function applyReign(){
    if(!hasC()) return;
    var rl=rulerOf(C.cityId); if(!rl) return;
    var a=ARCHES[rl.arch]; if(!a) return;
    if(a.coinYr){ var d=_ri(a.coinYr[0],a.coinYr[1]); if(d) C.coin=Math.max(0,(C.coin||0)+d); }
    if(a.statYr && Object.keys(a.statYr).length) _apply(a.statYr);
    if(C.isMage && a.mageBonus) _apply(a.mageBonus);
    if(C.isMage && a.magePenalty) _apply(a.magePenalty);
    if(a.rep) C.reputation=Math.max(0,(C.reputation||0)+a.rep);
    if(_ch(0.22)) _log("🏙️ "+_rand(a.flavor), a.rep<0?"e-bad":"");
  }

  // ---------- HOOK: harga kota dipengaruhi kepribadian penguasa ----------
  try{
    if(typeof mulCost==="function"){
      var _mc=mulCost;
      mulCost=function(base){
        var v=_mc.apply(this,arguments);
        try{ var a=archOf(C.cityId); if(a&&a.cost) v=Math.max(1,Math.round(v*a.cost)); }catch(e){}
        return v;
      };
    }
  }catch(e){}

  // ---------- HOOK tahunan ----------
  try{
    if(typeof advanceYear==="function"){
      var _adv=advanceYear;
      advanceYear=function(){
        var r=_adv.apply(this,arguments);
        try{ if(hasC()){ ensureRulers(); tickRulers(); applyReign(); } }catch(e){}
        return r;
      };
    }
  }catch(e){}

  /* ============================================================
     UI — panel & halaman penguasa di tab Peta
     ============================================================ */
  function effLine(a,isMage){
    var extra="";
    if(isMage && a.mageBonus) extra=" · penyihir +mana/akal";
    if(isMage && a.magePenalty) extra=" · ⚠️ penyihir diburu";
    return a.effect+extra;
  }
  window.openRulerPage=function(cityId){
    if(typeof pushPage!=="function") return;
    pushPage({title:"Penguasa "+cityById(cityId).name, render:function(){
      ensureRulers();
      var c=cityById(cityId); var rl=C.rulers[cityId]; var a=ARCHES[rl.arch];
      var title=CITY_RULER_TITLE[cityId]||"Penguasa";
      var here=(C.cityId===cityId);
      var h="<div class='pg-hero' style='text-align:center;padding:14px 12px;margin:2px 0 10px;background:linear-gradient(155deg,var(--card),var(--bg1));border:1px solid var(--line);border-radius:14px'>"
        +"<div style='font-size:40px;line-height:1'>"+a.ico+"</div>"
        +"<div style='font-size:16px;font-weight:700;color:var(--gold-bright);margin-top:6px'>"+title+" "+rl.name+"</div>"
        +"<div style='font-size:11px;color:var(--arcane-glow)'>"+rl.dynasty+" · "+c.ico+" "+c.name+"</div>"
        +"<div style='font-size:11px;color:var(--parchment);margin-top:6px'>Kepribadian: <b>"+a.name+"</b></div>"
        +"<div style='font-size:10px;color:var(--ink-soft);filter:brightness(1.7);margin-top:2px'>bertakhta "+rl.years+" th · usia "+rl.age+"</div>"
        +"</div>";
      h+=pgNote(a.blurb);
      h+=pgSec("Kebijakan Berlaku");
      h+=pgRow({ico:"📜",title:rl.policy,sub:"dekrit "+title+" "+rl.name.split(" ")[0]});
      h+=pgSec("Pengaruh ke Kota"+(here?" (kotamu kini)":""));
      h+=pgRow({ico:"⚖️",title:"Dampak sehari-hari",sub:effLine(a,C.isMage)});
      h+=pgSec("Wangsa & Takhta");
      h+=pgRow({ico:"👑",title:rl.dynasty,sub:"berkuasa di "+c.name+" · "+rl.years+" tahun"});
      if(here) h+=pgNote("Kamu tinggal di "+c.name+", jadi kebijakan & kepribadian "+title+" "+rl.name.split(" ")[0]+" memengaruhi harga & kehidupanmu tiap tahun. Pindah kota untuk merasakan penguasa lain.");
      return h;
    }});
  };

  function rulersSectionHTML(){
    if(!hasC()) return "";
    ensureRulers();
    var html="<div class='sechead'>👑 Penguasa Kota & Kebijakan</div>"
      +"<p style='font-size:10.5px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 10px;'>Tiap kota dipimpin penguasa berkepribadian berbeda yang memengaruhi harga & kehidupan di sana. Mereka menua & berganti seiring waktu — pantau di 📜 Berita.</p>"
      +"<div class='tiles'>";
    cityList().forEach(function(c){
      var rl=C.rulers[c.id]; if(!rl) return; var a=ARCHES[rl.arch];
      var title=CITY_RULER_TITLE[c.id]||"Penguasa"; var here=(c.id===C.cityId);
      html+="<div class='tile"+(here?" here":"")+"' onclick=\"openRulerPage('"+c.id+"')\">"
        +(here?"<span class='badge'>KOTAMU</span>":"")
        +"<span class='ti'>"+a.ico+"</span><span class='tn'>"+c.name+"</span>"
        +"<span class='td'>"+title+" "+rl.name.split(" ")[0]+" · "+a.name+"</span></div>";
    });
    html+="</div>";
    return html;
  }

  try{
    if(typeof renderPeta==="function"){
      var _rp=renderPeta;
      renderPeta=function(){
        var r=_rp.apply(this,arguments);
        try{
          var host=document.getElementById("viewPeta");
          if(host && hasC()) host.insertAdjacentHTML("beforeend", rulersSectionHTML());
        }catch(e){}
        return r;
      };
    }
  }catch(e){}

  window.__mantaraRulers={ensureRulers:ensureRulers,rulerOf:rulerOf,archOf:archOf,ARCHES:ARCHES,succeed:succeed,tickRulers:tickRulers};
})();
