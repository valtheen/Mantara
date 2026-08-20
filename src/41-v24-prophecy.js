/* ============================================================================
   MANTARA v24 — LAPIS B: RAMALAN (tiga nubuat tersegel)
   ----------------------------------------------------------------------------
   Menjawab temuan review paling penting: "pemain tidak tahu sedang mengejar apa".
   Saat lahir, peramal buta memberi 3 nubuat. Dua terbuka, satu tersegel sampai
   usia 40. Tiap nubuat bisa DIGENAPI (warisan besar) atau DIPATAHKAN (lebih
   besar lagi, jauh lebih sulit). Nubuat yang tak tuntas diwariskan ke ahli waris.
   ============================================================================ */
(function(){
  "use strict";
  function hasC(){ return typeof C!=="undefined" && C && C.alive; }
  function _ri(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
  function _ch(p){ return Math.random()<p; }
  function _log(t,cls){ try{ if(typeof log==="function"&&C) log(C.age,t,cls||""); }catch(e){} }
  function _toast(t){ try{ if(typeof toast==="function") toast(t); }catch(e){} }
  function _legacy(n,why){ try{ if(typeof window.MantaraExp!=="undefined"&&window.MantaraExp.awardLegacy) return window.MantaraExp.awardLegacy(n,why); }catch(e){} return 0; }
  function _music(m){ try{ if(typeof window.MusicMood==="function") window.MusicMood(m,{force:true,revert:"calm",after:40000}); }catch(e){} }
  function rel(role){ try{ return (C.relations||[]).filter(function(r){return r.role===role;}); }catch(e){ return []; } }

  /* --------------------------------------------------------------------------
     KATALOG NUBUAT
     check(): true = tergenapi.   break(): true = berhasil dipatahkan.
     Sebuah nubuat "dipatahkan" kalau kondisi pematah tercapai SEBELUM tergenapi.
     -------------------------------------------------------------------------- */
  var PROPHECIES=[
    { id:"darah_daging", tier:3, ico:"\u{1FA78}",
      text:"Kau akan mati di tangan darah dagingmu sendiri.",
      hint:"Anak yang membencimu adalah pisau yang kau asah sendiri.",
      breakText:"Setiap anakmu mencintaimu sampai akhir.",
      check:function(){ return C._prophKilledByKin===1; },
      brk:function(){
        var kids=rel("anak"); if(!kids.length||C.age<55) return false;
        return kids.every(function(k){ return (k.bond||0)>=75; });
      }},

    { id:"mahkota_muda", tier:3, ico:"\u{1F451}",
      text:"Mahkota akan jatuh ke pangkuanmu sebelum usia empat puluh.",
      hint:"Takhta tidak menunggu yang sabar.",
      breakText:"Kau menolak setiap mahkota yang ditawarkan padamu.",
      check:function(){ return C.age<40 && (C.polRole&&(C.polRole.role==="raja"||C.polRole.role==="adipati")); },
      brk:function(){ return C.age>=40 && C._prophRefusedCrown>=1; }},

    { id:"kota_terbakar", tier:3, ico:"\u{1F525}",
      text:"Kota tempatmu lahir akan terbakar, dan kau yang menyalakan apinya.",
      hint:"Api tidak selalu berupa api.",
      breakText:"Kota kelahiranmu berdiri lebih makmur karena kau.",
      check:function(){ return C._prophBurnedHome===1; },
      brk:function(){ return C.age>=50 && C.cityId===C.homeCityId && (C.reputation||0)>=90; }},

    { id:"tujuh_musim", tier:2, ico:"\u{1F342}",
      text:"Tujuh musim dingin, dan semua yang kau cintai akan pergi.",
      hint:"Hitung yang tersisa, bukan yang hilang.",
      breakText:"Kau menua dikelilingi orang-orang yang tidak pernah meninggalkanmu.",
      check:function(){ return C.age>=45 && rel("keluarga").length===0 && rel("pasangan").length===0; },
      brk:function(){ return C.age>=60 && (rel("keluarga").length+rel("pasangan").length+rel("anak").length)>=5; }},

    { id:"emas_hampa", tier:2, ico:"\u{1FA99}",
      text:"Kau akan mengumpulkan emas sebanyak pasir, dan mati tanpa seorang pun menangisimu.",
      hint:"Peti yang penuh tidak menghangatkan siapa-siapa.",
      breakText:"Kau kaya, dan tetap dicintai.",
      check:function(){ return (C.coin||0)>=25000 && (C.relations||[]).filter(function(r){return (r.bond||0)>=55;}).length<=1; },
      brk:function(){ return (C.coin||0)>=25000 && (C.relations||[]).filter(function(r){return (r.bond||0)>=70;}).length>=4; }},

    { id:"pedang_patah", tier:2, ico:"⚔️",
      text:"Pedangmu akan patah di tangan orang yang kau percaya.",
      hint:"Pengkhianatan datang dari dalam lingkaran, bukan luar.",
      breakText:"Tak seorang pun yang kau percaya pernah mengkhianatimu.",
      check:function(){ return C._prophBetrayed===1; },
      brk:function(){ return C.age>=55 && !C._prophBetrayed && (C.relations||[]).filter(function(r){return (r.bond||0)>=80;}).length>=3; }},

    { id:"nama_terhapus", tier:2, ico:"\u{1F5FF}",
      text:"Namamu akan dilupakan sebelum jasadmu dingin.",
      hint:"Reputasi adalah satu-satunya yang lebih lama dari daging.",
      breakText:"Namamu terukir di batu yang tidak akan runtuh.",
      check:function(){ return C.age>=50 && (C.reputation||0)<15; },
      brk:function(){ return (C.reputation||0)>=150; }},

    { id:"api_arcane", tier:2, ico:"\u{1F52E}",
      text:"Sihir yang kau kejar akan memakanmu dari dalam.",
      hint:"Mana yang terlalu penuh mencari jalan keluar.",
      breakText:"Kau menguasai mana tanpa dikuasai olehnya.",
      check:function(){ return C.isMage && (C.stats.mana||0)>=90 && (C.stats.health||100)<=25; },
      brk:function(){ return C.isMage && (C.stats.mana||0)>=90 && C.age>=60 && (C.stats.health||0)>=65; }},

    { id:"tiga_kota", tier:1, ico:"\u{1F5FA}️",
      text:"Kau akan menjejak tiga kota, dan tak satu pun jadi rumah.",
      hint:"Berjalan jauh belum tentu sampai.",
      breakText:"Kau berkelana jauh, lalu pulang dan tinggal.",
      check:function(){ return (C._visited||[]).length>=3 && C.cityId!==C.homeCityId && C.age>=45; },
      brk:function(){ return (C._visited||[]).length>=4 && C.cityId===C.homeCityId && C.age>=45; }},

    { id:"buku_tak_dibaca", tier:1, ico:"\u{1F4D6}",
      text:"Ilmu akan datang padamu, dan kau akan menolaknya.",
      hint:"Sekolah bukan satu-satunya guru, tapi ia yang pertama.",
      breakText:"Kau menuntaskan setiap jenjang yang dibuka untukmu.",
      check:function(){ return C.school&&C.school.droppedOut; },
      brk:function(){ return C.school&&C.school.graduated&&C.school.graduated.length>=3; }},

    { id:"darah_di_arena", tier:1, ico:"\u{1F3DF}️",
      text:"Kau akan menang seratus kali, lalu kalah sekali dan kehilangan segalanya.",
      hint:"Berhenti saat masih di puncak adalah kemenangan tersendiri.",
      breakText:"Kau pensiun dari arena sebagai juara yang tak terkalahkan.",
      check:function(){ try{ return C._arena && C._arena.lostAfterStreak===1; }catch(e){ return false; } },
      brk:function(){ try{ return C._arena && (C._arena.bestStreak||0)>=8 && C.age>=45; }catch(e){ return false; } }},

    { id:"cinta_sekali", tier:1, ico:"\u{1F494}",
      text:"Kau hanya akan mencintai satu kali, dan ia tidak akan tinggal.",
      hint:"Hati yang tertutup tidak pernah patah dua kali.",
      breakText:"Kau menua bersama orang yang sama.",
      check:function(){ return C.age>=45 && (C._prophLostSpouse>=1) && rel("pasangan").length===0; },
      brk:function(){ var p=rel("pasangan"); return C.age>=60 && p.length>0 && (p[0].bond||0)>=80; }},
  ];
  window.PROPHECIES=PROPHECIES;
  function pDef(id){ for(var i=0;i<PROPHECIES.length;i++) if(PROPHECIES[i].id===id) return PROPHECIES[i]; return null; }

  /* -------------------------------------------------------------------------- */
  function ensureProph(){
    if(!C) return null;
    if(C.prophecy) return C.prophecy;
    // 1 nubuat tier-3 (berat) + 1 tier-2 + 1 tier-1, ketiga tersegel sampai dibuka
    function pickTier(t,taken){
      var pool=PROPHECIES.filter(function(p){ return p.tier===t && taken.indexOf(p.id)<0; });
      if(!pool.length) pool=PROPHECIES.filter(function(p){ return taken.indexOf(p.id)<0; });
      return pool[Math.floor(Math.random()*pool.length)];
    }
    var taken=[];
    // nubuat yang belum tuntas dari leluhur ikut diwariskan
    try{
      var inh=(window.__prophInherit||[]);
      for(var i=0;i<inh.length&&taken.length<1;i++) if(pDef(inh[i])) taken.push(inh[i]);
      window.__prophInherit=null;
    }catch(e){}
    var a=taken[0]?pDef(taken[0]):pickTier(3,taken); taken.push(a.id);
    var b=pickTier(2,taken); taken.push(b.id);
    var c=pickTier(1,taken); taken.push(c.id);
    C.prophecy={
      list:[
        {id:a.id,state:"open",  sealed:false, inherited:taken.length&&!!(window.__prophWasInherited)},
        {id:b.id,state:"open",  sealed:false, inherited:false},
        {id:c.id,state:"open",  sealed:true,  inherited:false}   // tersegel sampai 40
      ],
      told:false, resolved:0
    };
    return C.prophecy;
  }
  window.__ensureProph=ensureProph;

  function seerLine(){
    var L=["Peramal buta itu menggenggam pergelangan tanganmu dan tidak melepaskannya.",
           "Ia tidak melihat wajahmu. Ia melihat sesuatu di belakangnya.",
           "\"Aku tidak meramal,\" katanya. \"Aku hanya membaca yang sudah tertulis.\""];
    return L[Math.floor(Math.random()*L.length)];
  }

  function showProphecyBirth(){
    if(!hasC()) return;
    var P=ensureProph(); if(!P||P.told) return;
    P.told=true;
    _music("ceremony");
    var open=P.list.filter(function(x){return !x.sealed;});
    var body=open.map(function(x){
      var d=pDef(x.id); if(!d) return "";
      return '<div style="margin:10px 0;padding:10px 12px;border:1px solid rgba(240,192,64,.28);border-radius:10px;background:rgba(20,12,32,.55)">'
        +'<div style="font-size:15px;line-height:1.5">'+d.ico+' <i>"'+d.text+'"</i></div>'
        +'<div style="font-size:10.5px;color:var(--ink-soft);filter:brightness(1.5);margin-top:5px">'+d.hint+'</div></div>';
    }).join("");
    try{
      openChoice({ico:"\u{1F56F}️",cancel:false,
        prompt:'<b>Ramalan Kelahiran</b><br><span style="font-size:11.5px;color:var(--ink-soft);filter:brightness(1.5)">'+seerLine()+'</span>'
          +body
          +'<div style="margin-top:10px;font-size:11px;color:var(--gold)">\u{1F512} Nubuat ketiga tetap tersegel sampai usiamu empat puluh.</div>',
        choices:[
          {label:"Aku akan menggenapinya",cls:"love",run:function(){
            C._prophStance="genapi";
            return {t:"\u{1F56F}️ Kau memilih berjalan menuju takdirmu.",cls:"e-epic"};
          }},
          {label:"Aku akan mematahkannya",run:function(){
            C._prophStance="patahkan";
            return {t:"\u{1F56F}️ Kau memilih melawan yang sudah tertulis. (patah = warisan 2x)",cls:"e-epic"};
          }}
        ]});
    }catch(e){}
  }
  window.__showProphecyBirth=showProphecyBirth;

  function unsealThird(){
    if(!hasC()||!C.prophecy) return;
    var third=C.prophecy.list[2];
    if(!third||!third.sealed||C.age<40) return;
    third.sealed=false;
    var d=pDef(third.id); if(!d) return;
    _music("mourn");
    try{
      openChoice({ico:"\u{1F513}",cancel:false,
        prompt:'<b>Nubuat Ketiga Terbuka</b><br><span style="font-size:11.5px;color:var(--ink-soft);filter:brightness(1.5)">Empat puluh tahun kau membawanya tanpa tahu isinya.</span>'
          +'<div style="margin:12px 0;padding:12px;border:1px solid rgba(240,192,64,.4);border-radius:10px;background:rgba(20,12,32,.6)">'
          +'<div style="font-size:15.5px;line-height:1.5">'+d.ico+' <i>"'+d.text+'"</i></div>'
          +'<div style="font-size:10.5px;color:var(--ink-soft);filter:brightness(1.5);margin-top:6px">'+d.hint+'</div></div>',
        choices:[{label:"Sekarang aku tahu",cls:"love",run:function(){
          return {t:"\u{1F513} Nubuat ketigamu terbuka: \""+d.text+"\"",cls:"e-epic"};
        }}]});
    }catch(e){}
  }

  var TIER_REWARD={1:70,2:140,3:260};
  function resolveOne(entry,how){
    var d=pDef(entry.id); if(!d) return;
    entry.state=how;
    C.prophecy.resolved=(C.prophecy.resolved||0)+1;
    var base=TIER_REWARD[d.tier]||100;
    var amt=how==="broken"?Math.round(base*2):base;
    if(C._prophStance==="patahkan"&&how==="broken") amt=Math.round(amt*1.2);
    if(C._prophStance==="genapi"&&how==="fulfilled") amt=Math.round(amt*1.2);
    _legacy(amt,how==="broken"?"mematahkan nubuat":"menggenapi nubuat");
    if(how==="broken"){
      _music("triumph");
      _log("\u{1F5A4}‍\u{1F525} NUBUAT DIPATAHKAN — "+d.ico+" \""+d.text+"\" → "+d.breakText+" (+"+amt+" Warisan Jiwa)","e-epic");
      C.reputation=(C.reputation||0)+18;
    }else{
      _music("ceremony");
      _log("\u{1F56F}️ NUBUAT TERGENAPI — "+d.ico+" \""+d.text+"\" (+"+amt+" Warisan Jiwa)","e-epic");
    }
    try{ if(typeof playAnim==="function") playAnim(how==="broken"?"win":"coin",{text:how==="broken"?"NUBUAT PATAH":"TAKDIR"}); }catch(e){}
  }

  function prophecyYearly(){
    if(!hasC()||!C.prophecy) return;
    unsealThird();
    var L=C.prophecy.list;
    for(var i=0;i<L.length;i++){
      var e=L[i];
      if(e.sealed||e.state!=="open") continue;
      var d=pDef(e.id); if(!d) continue;
      try{ if(d.brk&&d.brk()){ resolveOne(e,"broken"); continue; } }catch(err){}
      try{ if(d.check&&d.check()){ resolveOne(e,"fulfilled"); continue; } }catch(err){}
    }
  }

  /* --- penanda peristiwa yang dipakai nubuat (dipanggil sistem lain) --- */
  window.prophMark=function(key){
    if(!hasC()) return;
    if(key==="betrayed")     C._prophBetrayed=1;
    if(key==="killedByKin")  C._prophKilledByKin=1;
    if(key==="burnedHome")   C._prophBurnedHome=1;
    if(key==="refusedCrown") C._prophRefusedCrown=(C._prophRefusedCrown||0)+1;
    if(key==="lostSpouse")   C._prophLostSpouse=(C._prophLostSpouse||0)+1;
  };

  /* --- warisan nubuat yang belum tuntas ke ahli waris --- */
  function inheritUnresolved(){
    try{
      if(!C||!C.prophecy) return;
      var un=C.prophecy.list.filter(function(x){return x.state==="open";}).map(function(x){return x.id;});
      window.__prophInherit=un.slice(0,1);
      window.__prophWasInherited=un.length>0;
    }catch(e){}
  }

  /* --- panel Ramalan di tab Hidup --- */
  window.prophecyHTML=function(){
    if(!hasC()||!C.prophecy) return "";
    var L=C.prophecy.list, rows="";
    for(var i=0;i<L.length;i++){
      var e=L[i], d=pDef(e.id); if(!d) continue;
      if(e.sealed){
        rows+='<div class="pr-row sealed">\u{1F512} <i>Tersegel sampai usia 40</i></div>';
        continue;
      }
      var badge = e.state==="broken" ? '<span style="color:#7ee0a0">\u{1F5A4} DIPATAHKAN</span>'
               : e.state==="fulfilled" ? '<span style="color:#e0a07e">\u{1F56F}️ TERGENAPI</span>'
               : '<span style="color:var(--ink-soft)">belum tuntas</span>';
      rows+='<div class="pr-row'+(e.state!=="open"?' done':'')+'">'
          + '<div style="font-size:12.5px;line-height:1.5">'+d.ico+' <i>"'+d.text+'"</i></div>'
          + '<div style="font-size:10px;margin-top:3px">'+badge
          + (e.inherited?' · <span style="color:var(--gold)">warisan leluhur</span>':'')+'</div></div>';
    }
    return '<div class="proph-box"><div class="proph-head">\u{1F56F}️ Ramalan Kelahiran'
      + ' <span style="font-size:10px;opacity:.7">('+(C.prophecy.resolved||0)+'/3 tuntas)</span></div>'+rows+'</div>';
  };

  /* --- gaya --- */
  try{
    var st=document.createElement("style");
    st.textContent=".proph-box{margin:8px 4px 10px;padding:10px 12px;border:1px solid rgba(240,192,64,.22);"
      +"border-radius:12px;background:linear-gradient(160deg,rgba(30,18,48,.75),rgba(18,10,28,.75))}"
      +".proph-head{font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--gold);margin-bottom:7px}"
      +".pr-row{padding:7px 0;border-top:1px solid rgba(255,255,255,.05)}"
      +".pr-row:first-of-type{border-top:none}.pr-row.done{opacity:.62}.pr-row.sealed{opacity:.45;font-size:12px}";
    document.head.appendChild(st);
  }catch(e){}

  /* --- hook --- */
  if(typeof advanceYear==="function"){
    var _ayB=advanceYear;
    window.advanceYear=advanceYear=function(){
      var r=_ayB.apply(this,arguments);
      try{ if(hasC()) prophecyYearly(); }catch(e){}
      return r;
    };
  }
  if(typeof createFromDraft==="function"){
    var _cfdB=createFromDraft;
    window.createFromDraft=createFromDraft=function(){
      var r=_cfdB.apply(this,arguments);
      try{ ensureProph(); }catch(e){}
      try{ setTimeout(showProphecyBirth,900); }catch(e){}
      return r;
    };
  }
  if(typeof die==="function"){
    var _dieB=die;
    window.die=die=function(){
      try{ inheritUnresolved(); }catch(e){}
      // bonus warisan untuk tiap nubuat yang tuntas
      try{
        if(C&&C.prophecy&&C.prophecy.resolved>=3) _legacy(120,"menuntaskan seluruh ramalan");
      }catch(e){}
      return _dieB.apply(this,arguments);
    };
  }
  // sisipkan panel ramalan ke tab Hidup
  if(typeof renderHidup==="function"){
    var _rhB=renderHidup;
    window.renderHidup=renderHidup=function(){
      var r=_rhB.apply(this,arguments);
      try{
        if(!hasC()||!C.prophecy) return r;
        var host=document.getElementById("viewHidup");
        if(host&&host.innerHTML.indexOf('class="proph-box"')<0&&host.innerHTML.indexOf('<div class="logbox">')>=0){
          host.innerHTML=host.innerHTML.replace('<div class="logbox">', window.prophecyHTML()+'<div class="logbox">');
        }
      }catch(e){}
      return r;
    };
  }

  window.__mantaraProphecy={ensureProph:ensureProph,prophecyYearly:prophecyYearly,
    PROPHECIES:PROPHECIES,showProphecyBirth:showProphecyBirth,pDef:pDef};
})();
