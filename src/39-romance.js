/* ==================================================================
   MANTARA — PERCINTAAN MENDALAM (tasteful, non-eksplisit)
   Hubungan lebih hidup & kompleks: Keintiman, Kepercayaan, & Kimia;
   kencan beragam, curahan hati, hadiah, surat cinta, bulan madu;
   komitmen bertahap (pacaran → berkomitmen → tunangan → menikah);
   konflik & rujuk, perselingkuhan berisiko, kenangan hubungan;
   reproduksi bertahap: kesuburan per usia, kehamilan, kembar.
   Semua elegan & tanpa konten dewasa eksplisit.
   Modul mandiri; halaman "Hubungan" via pushPage.
   ================================================================== */
(function(){
  "use strict";
  function hasC(){ return typeof C!=="undefined" && C && C.alive; }
  function _ri(a,b){ return (typeof ri==="function")?ri(a,b):Math.floor(Math.random()*(b-a+1))+a; }
  function _ch(p){ return (typeof chance==="function")?chance(p):Math.random()<p; }
  function _rand(a){ return (typeof rand==="function")?rand(a):a[Math.floor(Math.random()*a.length)]; }
  function _cl(v){ return (typeof clamp==="function")?clamp(v):Math.max(0,Math.min(100,v)); }
  function _log(t,cls){ try{ if(typeof log==="function") log(C.age,t,cls||""); }catch(e){} }
  function _toast(t){ try{ if(typeof toast==="function") toast(t); }catch(e){} }
  function _apply(o){ try{ if(typeof applyStats==="function") applyStats(o); }catch(e){} }
  function _music(m){ try{ if(typeof window.MusicMood==="function") window.MusicMood(m,{force:true,revert:"calm",after:50000}); }catch(e){} }
  function relById(id){ try{ return C.relations.find(function(x){return x.id===id;}); }catch(e){ return null; } }

  /* ---------- state per pasangan ---------- */
  function ensureRom(r){
    if(!r) return;
    if(r.intimacy==null) r.intimacy=Math.round((r.bond||40)*0.45);
    if(r.trust==null)    r.trust=Math.round((r.bond||40)*0.6);
    if(r.chemistry==null) r.chemistry=computeChem(r);
    if(!Array.isArray(r.memories)) r.memories=[];
    if(r._lastRomance==null) r._lastRomance=(C&&C.age)||0;
  }
  function computeChem(r){
    var spark=_ri(35,75);
    // sedikit dipengaruhi perangaimu & pesonamu
    try{ if(C.stats&&C.stats.charm>60) spark+=6; }catch(e){}
    // perangai pasangan yang "hangat" menambah kimia
    if(/penyayang|periang|setia|bijak|ceria|baik hati/i.test(r.trait||"")) spark+=_ri(4,12);
    if(/licik|pendiam|penakut/i.test(r.trait||"")) spark-=_ri(2,8);
    return _cl(spark);
  }
  function chemMul(r){ return 0.7 + (r.chemistry||50)/150; } // 0.7 .. 1.37
  function addMemory(r,t){ ensureRom(r); r.memories.unshift({age:C.age,t:t}); if(r.memories.length>14) r.memories.pop(); }
  function touch(r){ r._lastRomance=C.age; }

  function stageOf(r){
    if(r._spouse) return {key:"nikah",label:"Menikah",ico:"💒"};
    if(r._engaged) return {key:"tunangan",label:"Tunangan",ico:"💍"};
    if(r._committed) return {key:"komit",label:"Berkomitmen",ico:"💗"};
    return {key:"pacaran",label:"Pacaran",ico:"💞"};
  }

  /* ---------- helper aksi ---------- */
  function rmDo(relId,fn){
    var r=relById(relId); if(!r) return;
    ensureRom(r);
    var res=fn(r);
    if(res && res.t){ _log(res.t.replace(/<[^>]+>/g,""), res.cls||"e-good"); _toast(res.t.replace(/<[^>]+>/g,"")); }
    try{ if(typeof renderAll==="function") renderAll(); }catch(e){}
    try{ if(typeof mpRefresh==="function") mpRefresh(); }catch(e){}
  }

  var DATES=[
    {n:"makan malam romantis di kedai mewah",cost:[15,40],int:[4,8],hap:8},
    {n:"jalan-jalan menyusuri taman kota",cost:[0,8],int:[3,6],hap:6},
    {n:"piknik di bukit berbunga",cost:[6,18],int:[4,7],hap:7},
    {n:"menonton pertunjukan bard bersama",cost:[10,28],int:[3,6],hap:8,charm:2},
    {n:"berdansa di bawah taburan bintang",cost:[4,14],int:[5,9],hap:9},
    {n:"berperahu tenang di danau senja",cost:[12,26],int:[5,8],hap:8},
    {n:"menyaksikan kembang api festival",cost:[8,20],int:[5,9],hap:9}
  ];

  /* ===== aksi mesra ===== */
  window.rmDate=function(relId){ rmDo(relId,function(r){
    var d=_rand(DATES); var cost=_ri(d.cost[0],d.cost[1]);
    if(C.coin<cost) return {t:"Kas kurang untuk kencan ini.",cls:"e-bad"};
    C.coin-=cost; var m=chemMul(r);
    r.intimacy=_cl(r.intimacy+Math.round(_ri(d.int[0],d.int[1])*m));
    r.bond=_cl(r.bond+Math.round(_ri(3,6)*m)); r.trust=_cl(r.trust+_ri(1,3));
    _apply({happy:+d.hap, charm:+(d.charm||0)}); touch(r);
    return {t:"💞 Kau & "+r.name+" "+d.n+".",cls:"e-good"};
  }); };
  window.rmTalk=function(relId){ rmDo(relId,function(r){
    var m=chemMul(r);
    r.intimacy=_cl(r.intimacy+Math.round(_ri(4,8)*m)); r.trust=_cl(r.trust+_ri(3,7));
    _apply({happy:+4,mind:+1}); touch(r);
    var lines=["kalian berbagi mimpi & ketakutan terdalam.","kalian tertawa mengenang masa lalu.",""+r.name+" menceritakan luka lama yang belum sembuh.","kalian merencanakan masa depan bersama."];
    return {t:"🕯️ Curahan hati — "+_rand(lines),cls:"e-good"};
  }); };
  window.rmGift=function(relId){ rmDo(relId,function(r){
    var cost=_ri(20,60); if(C.coin<cost) return {t:"Kas kurang untuk hadiah.",cls:"e-bad"};
    C.coin-=cost; var m=chemMul(r);
    r.bond=_cl(r.bond+Math.round(_ri(4,8)*m)); r.intimacy=_cl(r.intimacy+_ri(2,5)); _apply({happy:+3}); touch(r);
    var g=_rand(["seikat bunga langka","kalung permata mungil","syal sutra hangat","parfum arcane wangi","buku puisi kesukaannya"]);
    return {t:"🎁 Kau memberi "+r.name+" "+g+". Matanya berbinar.",cls:"e-good"};
  }); };
  window.rmLetter=function(relId){ rmDo(relId,function(r){
    var q=(C.stats&&C.stats.charm)||40; var ok=_ch(0.4+q/200);
    touch(r);
    if(ok){ var m=chemMul(r); r.intimacy=_cl(r.intimacy+Math.round(_ri(5,9)*m)); r.trust=_cl(r.trust+_ri(2,5)); _apply({happy:+5,charm:+1});
      return {t:"✉️ Surat cintamu menyentuh hati "+r.name+" hingga menitik air mata.",cls:"e-good"}; }
    r.intimacy=_cl(r.intimacy+2);
    return {t:"✉️ Kata-katamu kaku, tapi "+r.name+" menghargai usahamu.",cls:""};
  }); };
  window.rmAffection=function(relId){ rmDo(relId,function(r){
    var m=chemMul(r); r.intimacy=_cl(r.intimacy+Math.round(_ri(2,5)*m)); _apply({happy:+_ri(2,5)}); touch(r);
    return {t:"💗 Kalian berpelukan hangat & menggenggam tangan erat.",cls:"e-good"};
  }); };
  window.rmGetaway=function(relId){ rmDo(relId,function(r){
    if(!r._spouse) return {t:"Bulan madu hanya untuk pasangan menikah.",cls:"e-bad"};
    var cost=_ri(120,260); if(C.coin<cost) return {t:"Butuh "+cost+" keping untuk liburan romantis.",cls:"e-bad"};
    C.coin-=cost; var m=chemMul(r);
    r.intimacy=_cl(r.intimacy+Math.round(_ri(10,18)*m)); r.trust=_cl(r.trust+_ri(5,10)); r.bond=_cl(r.bond+_ri(5,10));
    _apply({happy:+15,health:+8,charm:+2}); touch(r);
    addMemory(r,"Liburan romantis tak terlupakan ✨");
    return {t:"🌅 Kalian berlibur romantis ke pesisir — kenangan tak terlupakan.",cls:"e-epic"};
  }); };

  /* ===== komitmen bertahap ===== */
  window.rmCommit=function(relId){ rmDo(relId,function(r){
    if(r._committed||r._engaged||r._spouse) return {t:"Kalian sudah lebih dari sekadar pacaran.",cls:""};
    if(r.bond<55||r.intimacy<45) return {t:"Hubungan belum cukup dalam untuk komitmen serius. Pupuk dulu keintiman.",cls:"e-bad"};
    r._committed=true; r.bond=_cl(r.bond+6); r.intimacy=_cl(r.intimacy+5); _apply({happy:+10}); touch(r);
    addMemory(r,"Menjadikan hubungan resmi & berkomitmen 💗");
    return {t:"💗 Kau & "+r.name+" berkomitmen serius — hanya kalian berdua.",cls:"e-epic"};
  }); };
  window.rmPropose=function(relId){ rmDo(relId,function(r){
    if(C.married) return {t:"Kau sudah menikah.",cls:"e-bad"};
    if((C.age||0)<16) return {t:"Kau terlalu muda untuk bertunangan.",cls:"e-bad"};
    if(r._engaged) return {t:"Kalian sudah bertunangan.",cls:""};
    var RINGS=[["ring_dragon","Cincin Berlian Naga",25],["ring_gold","Cincin Emas",12],["ring_silver","Cincin Perak",5]];
    var have=RINGS.find(function(x){ return (C.inventory&&C.inventory[x[0]]||0)>0; });
    if(!have) return {t:"Kau butuh cincin! Beli di 💍 Tukang Permata (Dunia → Toko, di Aetheria/Saltmoor).",cls:"e-bad"};
    var score=r.bond*0.5+r.intimacy*0.4+have[2]+r.trust*0.1;
    if(score>=55){
      C.inventory[have[0]]--; r._engaged=true; r._committed=true;
      r.bond=_cl(r.bond+8); r.intimacy=_cl(r.intimacy+6); _apply({happy:+14}); touch(r);
      addMemory(r,"Bertunangan dengan "+have[1]+" 💍"); _music("ceremony");
      return {t:"💍 Kau berlutut menyodorkan "+have[1]+"... "+r.name+" MENERIMA! Kalian bertunangan!",cls:"e-epic"};
    }
    return {t:r.name+" tersentuh, tapi hatinya belum sepenuhnya yakin. (cincin tidak hilang)",cls:"e-bad"};
  }); };
  window.rmMarry=function(relId){ rmDo(relId,function(r){
    if(C.married) return {t:"Kau sudah menikah.",cls:"e-bad"};
    if((C.age||0)<18) return {t:"Kau harus berusia 18 tahun untuk menikah.",cls:"e-bad"};
    if(!r._engaged) return {t:"Bertunangan dulu sebelum menikah.",cls:"e-bad"};
    if(r.bond<65||r.intimacy<55) return {t:r.name+" belum sepenuhnya siap. Perkuat ikatan & keintiman.",cls:"e-bad"};
    var cost=_ri(30,80); C.coin=Math.max(0,C.coin-cost);
    C.married=true; r._spouse=true; r.anniversary=C.age;
    r.bond=_cl(r.bond+10); r.intimacy=_cl(r.intimacy+10); r.trust=_cl(r.trust+8); _apply({happy:+22}); touch(r);
    addMemory(r,"Menikah — awal babak baru bersama 💒"); _music("ceremony");
    return {t:"💒 Kau menikah dengan "+r.name+"! Pesta megah digelar, air mata bahagia mengalir.",cls:"e-epic"};
  }); };
  window.rmVows=function(relId){ rmDo(relId,function(r){
    if(!r._spouse) return {t:"Hanya pasangan menikah yang bisa memperbarui janji.",cls:"e-bad"};
    var cost=_ri(20,50); if(C.coin<cost) return {t:"Butuh "+cost+" keping untuk upacara.",cls:"e-bad"};
    C.coin-=cost; r.intimacy=_cl(r.intimacy+_ri(6,12)); r.trust=_cl(r.trust+_ri(6,12)); r._conflict=false; _apply({happy:+10}); touch(r);
    addMemory(r,"Memperbarui janji sehidup semati 💞");
    return {t:"💞 Kalian memperbarui janji setia — cinta menyala kembali.",cls:"e-epic"};
  }); };

  /* ===== dinamika ===== */
  window.rmReconcile=function(relId){ rmDo(relId,function(r){
    if(!r._conflict) return {t:"Hubungan kalian sedang baik-baik saja.",cls:""};
    var q=(C.stats&&C.stats.charm)||40;
    if(_ch(0.45+q/220+r.trust/300)){
      r._conflict=false; r.intimacy=_cl(r.intimacy+_ri(4,9)); r.trust=_cl(r.trust+_ri(4,8)); r.bond=_cl(r.bond+_ri(3,6)); _apply({happy:+8}); touch(r);
      return {t:"🕊️ Kalian bicara dari hati ke hati & berdamai. Pelukan mengakhiri perselisihan.",cls:"e-good"};
    }
    r.trust=_cl(r.trust-_ri(2,5));
    return {t:r.name+" masih terluka. Butuh waktu & ketulusan lebih.",cls:"e-bad"};
  }); };
  window.rmAffair=function(relId){ rmDo(relId,function(r){
    touch(r);
    if(_ch(0.45)){
      r.trust=_cl(r.trust-_ri(30,55)); r.bond=_cl(r.bond-_ri(25,45)); r.intimacy=_cl(r.intimacy-_ri(20,40));
      r._conflict=true; _apply({happy:-14,reputation:0}); C.reputation=Math.max(0,(C.reputation||0)-8);
      if(_ch(0.5)){ r.role="musuh"; r._spouse=false; r._engaged=false; C.married=false; return {t:"💔 "+r.name+" memergokimu berselingkuh! Cintanya berubah jadi benci — kalian berpisah.",cls:"e-bad"}; }
      return {t:"💔 "+r.name+" mengetahui pengkhianatanmu. Kepercayaan hancur berkeping.",cls:"e-bad"};
    }
    _apply({happy:+4});
    return {t:"🕶️ Perselingkuhanmu lolos... untuk kini. Rasa bersalah menghantui.",cls:""};
  }); };
  window.rmBreakup=function(relId){
    var r=relById(relId); if(!r) return;
    if(typeof openChoice==="function"){
      var word = r._spouse?"menceraikan":"mengakhiri hubungan dengan";
      openChoice({ico:"💔",prompt:"Yakin "+word+" <b>"+r.name+"</b>?",choices:[
        {label:"Ya, akhiri",cls:"danger",run:function(){
          rmDo(relId,function(rr){
            rr._spouse=false; rr._engaged=false; rr._committed=false; rr.role="teman";
            rr.bond=_cl(rr.bond-_ri(15,30)); rr.intimacy=_cl(rr.intimacy-30); C.married=false; _apply({happy:-14});
            addMemory(rr,"Berpisah — kisah kita usai 💔");
            return {t:"💔 Kau berpisah dengan "+rr.name+". Hatimu pedih, tapi hidup berlanjut.",cls:"e-bad"};
          });
          try{ if(typeof popPage==="function") popPage(); }catch(e){}
          return null;
        }},
        {label:"Batal",run:function(){ return null; }}
      ]});
    }
  };

  /* ===== reproduksi bertahap (non-eksplisit) ===== */
  function fertilityAt(age){
    if(age<18) return 0; if(age<28) return 0.72; if(age<34) return 0.58; if(age<40) return 0.38; if(age<45) return 0.18; if(age<50) return 0.06; return 0.01;
  }
  window.rmTryChild=function(relId){ rmDo(relId,function(r){
    if(!C.married||!r._spouse) return {t:"Hanya pasangan menikah yang bisa membina keluarga.",cls:"e-bad"};
    if(C._pregnancy) return {t:"Keluarga sudah menanti kehadiran buah hati. Bersabarlah.",cls:""};
    var heirs=C.relations.filter(function(x){return x.isChild;}).length;
    if(heirs>=6) return {t:"Kau sudah dikaruniai banyak keturunan.",cls:""};
    var f=fertilityAt(C.age||0);
    if(f<=0) return {t:"Usiamu sudah tak memungkinkan untuk punya anak.",cls:"e-bad"};
    // keintiman tinggi sedikit menaikkan peluang
    var p=Math.min(0.9, f*(0.85+ (r.intimacy||50)/300));
    touch(r);
    if(_ch(p)){
      C._pregnancy={partnerId:r.id, yearsLeft:1, twins:_ch(0.07)};
      _apply({happy:+10});
      return {t:"🕊️ Kabar bahagia menanti — keluargamu akan segera bertambah.",cls:"e-epic"};
    }
    return {t:"Belum ada kabar bahagia tahun ini. Kalian tetap berharap.",cls:""};
  }); };

  function progressPregnancy(){
    if(!hasC()||!C._pregnancy) return;
    C._pregnancy.yearsLeft--;
    // komplikasi kecil (tasteful)
    if(_ch(0.10)) _apply({health:-_ri(3,8)});
    if(C._pregnancy.yearsLeft<=0){
      var partner=relById(C._pregnancy.partnerId) || C.relations.find(function(x){return x.role==="pasangan";}) || {name:"pasanganmu"};
      var twins=C._pregnancy.twins;
      C._pregnancy=null;
      try{
        if(typeof bornChild==="function"){ bornChild(partner); if(twins) setTimeout(function(){ try{ bornChild(partner); _log("👶 Ternyata KEMBAR! Dua buah hati sekaligus.","e-epic"); }catch(e){} },400); }
      }catch(e){}
    }
  }

  /* ===== dinamika tahunan hubungan ===== */
  function romanceYearly(){
    if(!hasC()) return;
    (C.relations||[]).filter(function(r){return r.role==="pasangan";}).forEach(function(r){
      ensureRom(r);
      var since=(C.age||0)-(r._lastRomance||C.age);
      // keintiman meluntur bila diabaikan
      if(since>=2){
        r.intimacy=_cl(r.intimacy-_ri(2,6)); r.bond=_cl(r.bond-_ri(1,3));
        if(r.intimacy<28 && !r._conflict && _ch(0.3)){ r._conflict=true; _log("💢 Hubunganmu dengan "+r.name+" merenggang — kalian mulai sering berselisih.","e-bad"); }
      }
      // kebersamaan pernikahan
      if(r._spouse){
        if(r.intimacy>=60 && !r._conflict) _apply({happy:+_ri(2,5)});
        else if(r.intimacy<32 && _ch(0.25)){ r._conflict=true; _apply({happy:-_ri(2,5)}); }
        // hari jadi
        if(r.anniversary!=null){ var yrs=(C.age||0)-r.anniversary; if(yrs>0 && yrs%5===0){ _apply({happy:+8}); r.intimacy=_cl(r.intimacy+5); addMemory(r,"Merayakan "+yrs+" tahun pernikahan 💞"); _log("💞 Kau & "+r.name+" merayakan "+yrs+" tahun pernikahan.","e-good"); } }
      }
      // momen manis acak
      if(_ch(0.12)){ r.intimacy=_cl(r.intimacy+_ri(2,5)); if(_ch(0.4)) _log("💗 Momen kecil bersama "+r.name+" menghangatkan harimu.","e-good"); }
      // pertengkaran acak
      else if(!r._conflict && _ch(0.06)){ r._conflict=true; r.bond=_cl(r.bond-_ri(3,7)); _log("💢 Kau & "+r.name+" bertengkar soal hal sepele.","e-bad"); }
    });
    progressPregnancy();
  }
  try{
    if(typeof advanceYear==="function"){
      var _adv=advanceYear;
      advanceYear=function(){ var r=_adv.apply(this,arguments); try{ romanceYearly(); }catch(e){} return r; };
    }
  }catch(e){}

  /* ===== HALAMAN HUBUNGAN ===== */
  function bar(label,val,col){
    val=Math.round(val||0);
    return "<div class='statrow' style='display:flex;justify-content:space-between;font-size:10.5px;padding:2px 0'><span style='color:var(--ink-soft);filter:brightness(1.7)'>"+label+"</span><b>"+val+"</b></div>"
      +"<div class='exp-pbar' style='margin-top:0;margin-bottom:6px'><div class='exp-pfill' style='width:"+val+"%;background:"+col+"'></div></div>";
  }
  window.openRomance=function(relId){
    if(typeof pushPage!=="function") return;
    pushPage({title:"Hubungan", render:function(){
      /* QA v25: dulu ini menghasilkan halaman kosong tanpa jalan keluar
         selain panah kembali — misalnya kalau pasangan wafat sementara
         halamannya masih terbuka. Sekarang keadaan kosongnya menjelaskan
         apa yang terjadi dan menawarkan langkah berikutnya. */
      var r=relById(relId);
      if(!r){
        return "<div style='text-align:center;padding:26px 18px'>"
          +"<div style='font-size:34px;opacity:.55'>🕯️</div>"
          +"<div style='font-size:14px;font-weight:700;margin-top:8px'>Hubungan ini sudah berakhir</div>"
          +"<div style='font-size:11.5px;color:var(--ink-soft);filter:brightness(1.7);margin-top:6px;line-height:1.7'>"
          +"Ia tidak lagi ada dalam hidupmu — wafat, pergi, atau kalian berpisah.</div>"
          +"<button class='mchoice' style='margin-top:16px' onclick=\"try{popPage();}catch(e){};try{switchTab('Relasi');}catch(e){}\">"
          +"↩ Kembali ke Relasi</button></div>";
      }
      ensureRom(r); var st=stageOf(r);
      var chemLbl=r.chemistry>=70?"Menyala 🔥":r.chemistry>=45?"Hangat":"Datar";
      var h="<div class='pg-hero' style='text-align:center;padding:14px 12px;margin:2px 0 10px;background:linear-gradient(155deg,#2a1420,#16110c);border:1px solid #6e2a4a;border-radius:14px'>"
        +(typeof npcAvatar==="function"?npcAvatar(r,typeof relationAge==="function"?relationAge(r):Math.max(18,C.age),"npc-avatar--hero"):"<div style='font-size:34px'>"+(r.female?"👰":"🤵")+"</div>")
        +"<div style='font-size:16px;font-weight:700;color:#f0a0c0'>"+r.name+"</div>"
        +"<div style='font-size:11px;color:var(--arcane-glow)'>"+st.ico+" "+st.label+" · "+r.trait+"</div>"
        +"<div style='font-size:10.5px;color:var(--gold);margin-top:4px'>💘 Kimia: "+chemLbl+" ("+Math.round(r.chemistry)+")</div>"
        +(r._conflict?"<div style='font-size:10.5px;color:var(--bad);margin-top:3px'>💢 Sedang ada perselisihan — perlu didamaikan</div>":"")
        +(C._pregnancy&&C._pregnancy.partnerId===r.id?"<div style='font-size:10.5px;color:var(--good);margin-top:3px'>🕊️ Menanti kelahiran buah hati...</div>":"")
        +"<div style='margin-top:10px;text-align:left'>"
          +bar("💞 Ikatan", r.bond, "linear-gradient(90deg,#6e2a4a,#d06ea0)")
          +bar("💗 Keintiman", r.intimacy, "linear-gradient(90deg,#7a1f5a,#ff7ab5)")
          +bar("🤝 Kepercayaan", r.trust, "linear-gradient(90deg,#3a5a8a,#6ea0d0)")
        +"</div></div>";

      h+=pgSec("💞 Momen Mesra");
      h+=pgRow({ico:"🌹",title:"Ajak Kencan",sub:"kencan romantis acak · keintiman & bahagia",on:function(){window.rmDate(relId);}});
      h+=pgRow({ico:"🕯️",title:"Curahkan Hati",sub:"obrolan dalam · keintiman & kepercayaan",on:function(){window.rmTalk(relId);}});
      h+=pgRow({ico:"🎁",title:"Beri Hadiah Romantis",sub:"bunga/permata · ikatan naik · butuh koin",on:function(){window.rmGift(relId);}});
      h+=pgRow({ico:"✉️",title:"Tulis Surat Cinta",sub:"peluang dari Pesona · keintiman",on:function(){window.rmLetter(relId);}});
      h+=pgRow({ico:"💗",title:"Peluk & Genggam Tangan",sub:"kemesraan lembut",on:function(){window.rmAffection(relId);}});
      if(r._spouse) h+=pgRow({ico:"🌅",title:"Bulan Madu / Liburan Romantis",sub:"keintiman melonjak · 💰 besar",on:function(){window.rmGetaway(relId);}});

      h+=pgSec("💍 Komitmen");
      if(!r._committed&&!r._engaged&&!r._spouse) h+=pgRow({ico:"💗",title:"Jadikan Serius (Berkomitmen)",sub:"butuh Ikatan 55+ & Keintiman 45+",on:function(){window.rmCommit(relId);}});
      if(!r._engaged&&!r._spouse) h+=pgRow({ico:"💍",title:"Lamar (Tunangan)",sub:"butuh cincin & hubungan kuat",on:function(){window.rmPropose(relId);}});
      if(r._engaged&&!r._spouse) h+=pgRow({ico:"💒",title:"Menikah",sub:"usia 18+ · Ikatan 65+ & Keintiman 55+",on:function(){window.rmMarry(relId);}});
      if(r._spouse) h+=pgRow({ico:"💞",title:"Perbarui Janji Setia",sub:"keintiman & kepercayaan menyala kembali",on:function(){window.rmVows(relId);}});

      if(r._spouse){
        h+=pgSec("👶 Keluarga");
        var heirs=C.relations.filter(function(x){return x.isChild;}).length;
        if(C._pregnancy&&C._pregnancy.partnerId===r.id) h+=pgNote("🕊️ Keluargamu sedang menanti kelahiran — buah hati akan hadir tahun depan.");
        else h+=pgRow({ico:"🕊️",title:"Bina Keluarga (Coba Punya Anak)",sub:"peluang tergantung usia — "+heirs+"/6 keturunan",on:function(){window.rmTryChild(relId);}});
      }

      h+=pgSec("⚖️ Dinamika");
      if(r._conflict) h+=pgRow({ico:"🕊️",title:"Berdamai & Bicara dari Hati",sub:"redakan perselisihan",on:function(){window.rmReconcile(relId);}});
      h+=pgRow({ico:"🕶️",title:"Selingkuh",sub:"berisiko besar — kepercayaan & hubungan taruhannya",on:function(){window.rmAffair(relId);}});
      h+=pgRow({ico:"💔",title:(r._spouse?"Cerai":"Akhiri Hubungan"),sub:"akhiri kisah kalian",on:function(){window.rmBreakup(relId);}});

      if(r.memories&&r.memories.length){
        h+=pgSec("📖 Kenangan");
        r.memories.slice(0,8).forEach(function(m){ h+=pgRow({ico:"✨",title:m.t,sub:"saat usiamu "+m.age+" th"}); });
      }
      return h;
    }});
  };

  /* ---------- ganti aksi pasangan jadi pembuka halaman ---------- */
  try{
    if(typeof REL_ACTIONS!=="undefined"){
      REL_ACTIONS.pasangan=[
        {label:"💞 Buka Hubungan ▸", cls:"love", openRomance:true, run:function(){ return null; }}
      ];
    }
  }catch(e){}
  try{
    if(typeof doRelAction==="function"){
      var _dra=doRelAction;
      doRelAction=function(relId,actIdx){
        try{
          var r=relById(relId); var act=r&&(REL_ACTIONS[r.role]||[])[actIdx];
          if(act && act.openRomance){ window.openRomance(relId); return; }
        }catch(e){}
        return _dra.apply(this,arguments);
      };
    }
  }catch(e){}

  window.__mantaraRomance={ensureRom:ensureRom,stageOf:stageOf,fertilityAt:fertilityAt,romanceYearly:romanceYearly,progressPregnancy:progressPregnancy};
})();
