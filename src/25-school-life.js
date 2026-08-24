/* ==================================================================
   MANTARA — KEHIDUPAN SEKOLAH
   Interaksi teman & guru, Circle sosial, dan Ekstrakurikuler
   (sihir per aliran, pedang, panahan, brawl, musik, ramuan)
   dengan latihan bermini-game. Aktif selama bersekolah.
   ================================================================== */
const SCHOOL_CIRCLES=[
  {id:"noble",ico:"👑",name:"Lingkar Anak Bangsawan",desc:"Etiket, gosip istana & koneksi. Pesona +2/th, kadang dibagi uang saku.",stats:{charm:2},coin:[5,15]},
  {id:"scroll",ico:"📜",name:"Kutu Gulungan",desc:"Perpustakaan adalah rumah kedua. Akal +2/th.",stats:{mind:2}},
  {id:"yard",ico:"🗡️",name:"Geng Halaman Belakang",desc:"Anak-anak pemberani (dan nakal). Kekuatan +2/th, kadang kena hukuman.",stats:{might:2},trouble:true},
  {id:"forest",ico:"🌿",name:"Pengintai Hutan",desc:"Menjelajah rimba sepulang sekolah. Nyawa +2/th.",stats:{health:2}},
  {id:"stage",ico:"🎭",name:"Klub Panggung Bard",desc:"Drama, musik & sorak penonton. Pesona +1 & Bahagia +1/th.",stats:{charm:1,happy:1}},
  {id:"arcane",ico:"✨",name:"Lingkar Arcane Muda",desc:"Bisik-bisik mantra di lorong gelap. Mana +2/th.",stats:{mana:2},req:c=>c.isMage||c.stats.mind>=50},
];
const SCHOOL_EKSKUL=[
  {id:"sword",ico:"🤺",name:"Klub Pedang Kayu",desc:"Sparring duel taktis melawan kawan.",train:"duel",gain:{might:4}},
  {id:"brawl",ico:"🥊",name:"Gulat & Brawl",desc:"Adu banting di lumpur — duel taktis.",train:"duel",gain:{might:3,health:2}},
  {id:"archery",ico:"🏹",name:"Klub Panahan",desc:"Latihan pakai minigame Bidikan Takdir.",train:"shot",gain:{might:2,mind:2}},
  {id:"fire",ico:"🔥",name:"Sihir Api Dasar",desc:"Percikan & bola api kecil (penyihir).",train:"magic",gain:{mana:4,might:1},mage:true},
  {id:"heal",ico:"💚",name:"Sihir Penyembuhan Dasar",desc:"Membalut luka dengan cahaya (penyihir).",train:"magic",gain:{mana:3,health:2},mage:true},
  {id:"illusion",ico:"🌫️",name:"Sihir Ilusi Dasar",desc:"Trik cahaya & bayangan (penyihir).",train:"magic",gain:{mana:3,charm:2},mage:true},
  {id:"music",ico:"🎻",name:"Klub Musik Bard",desc:"Tampil di aula sekolah tiap purnama.",train:"plain",gain:{charm:3,happy:2}},
  {id:"potion",ico:"⚗️",name:"Ramuan Muda",desc:"Racik tonik sederhana di gudang herbalis.",train:"plain",gain:{mind:3,mana:1}},
];
function slState(){
  if(!C.schoolLife)C.schoolLife={circle:null,ekskul:null,teacher:0};
  return C.schoolLife;
}
function slEnrolled(){return C&&C.alive&&C.school&&C.school.enrolled&&!C.school.droppedOut;}
function slStatusLine(){
  if(!slEnrolled())return "";
  const sl=slState();
  const c=SCHOOL_CIRCLES.find(x=>x.id===sl.circle);
  const e=SCHOOL_EKSKUL.find(x=>x.id===sl.ekskul);
  const parts=[];
  if(c)parts.push(`${c.ico} ${c.name}`);
  if(e)parts.push(`${e.ico} ${e.name}`);
  if(sl.klass&&sl.klass.teacher&&sl.klass.teacher.bond>=70)parts.push("🍎 murid kesayangan");
  return parts.length?`<div class="cage" style="color:var(--arcane-glow)">${parts.join(" · ")}</div>`:"";
}
// ---------- INTERAKSI KELAS ----------
window.schoolInteractPopup=function(){
  if(!slEnrolled()){toast("Kau sedang tidak bersekolah.");return;}
  const sl=slState();
  openChoice({ico:"🤝",prompt:`<b>Interaksi Kelas</b><br><span style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6)">Kedekatan guru: ${"🍎".repeat(Math.min(5,sl.teacher))||"—"}</span>`,
    choices:[
      {label:"🗣️ Ngobrol dengan teman sekelas",hint:"Bahagia + · bisa dapat teman baru",run:()=>{
        if(!spendAction())return null;
        applyStats({happy:+ri(3,6)});
        if(chance(0.4)){const female=chance(0.5);const r=addRel("teman",{name:randName(female),female,bond:ri(40,60)});
          return{t:`Kau nyambung ngobrol dengan ${r.name} — teman baru! (cek Diri → Relasi)`,cls:"e-good"};}
        if(chance(0.2)){applyStats({happy:-2});return{t:"Ada yang mengejek logatmu. Kau pura-pura tak dengar.",cls:"e-bad"};}
        return{t:"Istirahat seru penuh tawa di halaman sekolah.",cls:"e-good"};}},
      {label:"📝 Bantu teman mengerjakan PR",hint:"Akal + · relasi teman menguat",run:()=>{
        if(!spendAction())return null;
        applyStats({mind:+2,happy:+2});
        const fr=C.relations.filter(r=>r.role==="teman");
        if(fr.length){const r=rand(fr);r.bond=clamp(r.bond+ri(5,10));return{t:`Kau membantu ${r.name} — ikatan kalian menguat.`,cls:"e-good"};}
        const female=chance(0.5);const r=addRel("teman",{name:randName(female),female,bond:ri(45,60)});
        return{t:`${r.name} berterima kasih atas bantuanmu — kalian berteman!`,cls:"e-good"};}},
      {label:"😜 Jahili teman sekelas",hint:"Bahagia ++ · berisiko",run:()=>{
        if(!spendAction())return null;
        if(chance(0.3)){slState().teacher=Math.max(0,slState().teacher-1);C.reputation=Math.max(0,C.reputation-1);applyStats({happy:+3});
          return{t:"Leluconmu ketahuan! Guru menyuruhmu menyalin gulungan 100 kali.",cls:"e-bad"};}
        applyStats({happy:+6,charm:+2});
        return{t:"Seisi kelas tertawa terpingkal — kau bintang hari ini.",cls:"e-good"};}},
      {label:"🍎 Beri apel & dekati guru",hint:"Pesona + · guru makin sayang",run:()=>{
        if(!spendAction())return null;
        slState().teacher=Math.min(5,slState().teacher+1);
        applyStats({charm:+2,happy:+1});
        return{t:slState().teacher>=3?"Guru tersenyum — kau resmi murid kesayangan. Nilai-nilaimu diperhatikan.":"Guru menerima apelmu dengan senang.",cls:"e-good"};}},
      {label:"❓ Tanya materi ke guru",hint:"Akal ++ · efektif",run:()=>{
        if(!spendAction())return null;
        const bonus=slState().teacher>=3?3:0;
        applyStats({mind:+ri(4,7)+bonus});
        slState().teacher=Math.min(5,slState().teacher+1);
        return{t:bonus?"Guru menjelaskan panjang lebar khusus untukmu. Akal melonjak!":"Guru menjawab pertanyaanmu dengan sabar.",cls:"e-good"};}},
    ]});
};
// ---------- CIRCLE SEKOLAH ----------
window.schoolCirclePopup=function(){
  if(!slEnrolled()){toast("Kau sedang tidak bersekolah.");return;}
  const sl=slState();
  const cur=SCHOOL_CIRCLES.find(x=>x.id===sl.circle);
  openChoice({ico:"🏰",prompt:`<b>Circle Sekolah</b><br><span style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6)">${cur?`Sekarang: ${cur.ico} ${cur.name}`:"Belum ikut circle mana pun"}</span>`,
    choices:SCHOOL_CIRCLES.map(c=>{
      const locked=c.req&&!c.req(C);
      const active=sl.circle===c.id;
      return {label:`${c.ico} ${c.name}${active?" ✓":""}`,sub:locked?"🔒 butuh bakat sihir/Akal 50+":c.desc,disabled:active||locked,
        run:()=>{
          if(!spendAction())return null;
          sl.circle=c.id;
          setTimeout(()=>{try{renderKarir();}catch(e){}},80);
          return{t:`Kau bergabung dengan ${c.ico} ${c.name}! Bonus circle berlaku tiap tahun.`,cls:"e-epic"};}};
    }).concat(cur?[{label:"🚪 Keluar dari circle",sub:"kembali jadi anak bebas",run:()=>{
      sl.circle=null;setTimeout(()=>{try{renderKarir();}catch(e){}},80);
      return{t:"Kau keluar dari circle. Kadang sendiri itu tenang.",cls:""};}}]:[])});
};
// ---------- EKSTRAKURIKULER ----------
window.schoolEkskulPopup=function(){
  if(!slEnrolled()){toast("Kau sedang tidak bersekolah.");return;}
  const sl=slState();
  const cur=SCHOOL_EKSKUL.find(x=>x.id===sl.ekskul);
  openChoice({ico:"🎯",prompt:`<b>Ekstrakurikuler</b><br><span style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6)">${cur?`Sekarang: ${cur.ico} ${cur.name}`:"Belum ikut klub"} · setelah gabung, tekan <b>Latihan Ekskul</b> untuk berlatih (ada minigame!)</span>`,
    choices:SCHOOL_EKSKUL.map(e=>{
      const locked=e.mage&&!C.isMage;
      const active=sl.ekskul===e.id;
      return {label:`${e.ico} ${e.name}${active?" ✓":""}`,sub:locked?"🔒 khusus penyihir":e.desc,disabled:active||locked,
        run:()=>{
          sl.ekskul=e.id;
          setTimeout(()=>{try{renderKarir();}catch(e2){}},80);
          return{t:`Kau mendaftar ${e.ico} ${e.name}! Latih rutin agar berkembang.`,cls:"e-epic"};}};
    })});
};
window.schoolEkskulTrain=function(){
  if(!slEnrolled()){toast("Kau sedang tidak bersekolah.");return;}
  const sl=slState();
  const e=SCHOOL_EKSKUL.find(x=>x.id===sl.ekskul);
  if(!e){toast("Pilih ekstrakurikuler dulu di menu 🎯.");schoolEkskulPopup();return;}
  if(e.train==="shot"){
    if(!spendAction())return;
    skillShotGame({title:`Latihan ${e.name}`,ico:e.ico,desc:"Bidik sasaran jerami — zona emas = tembakan pusat!",gold:12+C.stats.mind*0.08,speed:1.4},function(res){
      if(res==="perfect"){applyStats({might:+4,mind:+3,happy:+4});finishAct(`${e.ico} Tepat di pusat sasaran! Pelatih bersiul kagum.`,"e-epic","win");}
      else if(res==="good"){applyStats({might:+2,mind:+2,happy:+2});finishAct(`${e.ico} Tembakan bagus — terus berlatih.`,"e-good");}
      else{applyStats({happy:-1});finishAct(`${e.ico} Anak panahmu nyasar ke topi pelatih. Oops.`,"e-bad");}
    });
  }else if(e.train==="duel"){
    if(!(window.MantaraArena&&MantaraArena.startTacticalDuel)){
      if(!spendAction())return;
      applyStats(e.gain);finishAct(`${e.ico} Latihan keras di ${e.name}.`,"e-good","win");return;
    }
    if(!spendAction())return;
    const foe={name:"Kawan Sparring",ico:"🧒",hp:28+C.age*2,atk:8+Math.round(C.age/3),mag:0,special:"Serangan Kejutan"};
    MantaraArena.startTacticalDuel(foe,{
      title:`Sparring ${e.name}`,allowFlee:true,
      intro:`${e.ico} Sparring persahabatan dimulai — tunjukkan hasil latihanmu!`,
      onEnd:function(res){
        if(res&&res.win){applyStats({might:+(e.gain.might||3),health:+(e.gain.health||0),happy:+5});
          finishAct(`${e.ico} Kau memenangkan sparring! Pelatih mengangguk bangga.`,"e-epic","win");}
        else if(res&&!res.quit){applyStats({might:+1,health:-ri(2,5)});
          finishAct(`${e.ico} Kalah sparring, tapi tetap dapat pelajaran (dan memar).`,"e-bad");}
      }});
  }else if(e.train==="magic"){
    if(!C.isMage){toast("Khusus penyihir.");return;}
    if(!spendAction())return;
    applyStats(e.gain);applyStats({happy:+2});
    playAnim&&playAnim("win",{text:e.ico});
    finishAct(`${e.ico} Mantramu makin stabil — ${e.name} menempamu.`,"e-arcane","win");
  }else{
    if(!spendAction())return;
    applyStats(e.gain);
    finishAct(`${e.ico} Latihan ${e.name} berjalan seru.`,"e-good","win");
  }
};
// ---------- EFEK TAHUNAN CIRCLE & EKSKUL ----------
(function schoolLifeYearly(){
  const _slAY=advanceYear;
  advanceYear=function(){
    const r=_slAY.apply(this,arguments);
    try{
      if(slEnrolled()){
        const sl=slState();
        const c=SCHOOL_CIRCLES.find(x=>x.id===sl.circle);
        if(c){
          applyStats(c.stats);
          if(c.coin&&chance(0.4)){const g=ri(c.coin[0],c.coin[1]);C.coin+=g;log(C.age,`${c.ico} Teman circle-mu berbagi uang saku (+${g}).`,"e-good");}
          if(c.trouble&&chance(0.25)){applyStats({happy:-3});log(C.age,`${c.ico} Geng-mu kena hukuman guru — kau ikut menyalin gulungan.`,"e-bad");}
        }
        const e=SCHOOL_EKSKUL.find(x=>x.id===sl.ekskul);
        if(e&&chance(0.55)){
          const half={};for(const k in e.gain)half[k]=Math.max(1,Math.round(e.gain[k]/2));
          applyStats(half);
          if(chance(0.3))log(C.age,`${e.ico} Setahun rutin ${e.name} — tubuhku & pikiranku berkembang.`,"e-good");
        }
      }
    }catch(err){}
    return r;
  };
})();

/* ==================================================================
   MANTARA — SISTEM SUB-HALAMAN (ala BitLife)
   Halaman penuh bertumpuk dengan tombol back. Menu = halaman,
   keputusan/event = modal. Dipakai: Kehidupan Sekolah (kelas dengan
   roster permanen, guru, circle, ekskul), Lowongan, & Aktivitas.
   ================================================================== */
const MP={stack:[]};
let _pgH=[];
window._pgRun=function(i){const f=_pgH[i];if(f)f();};
function pgSec(t){return `<div class="pg-sec">${t}</div>`;}
function pgNote(t){return `<div class="pg-note">${t}</div>`;}
function pgRow(o){
  const idx=o.on?(_pgH.push(o.on)-1):-1;
  return `<div class="pg-row ${o.dim?'dim':''}" ${idx>=0&&!o.dim?`onclick="_pgRun(${idx})"`:""}>
    <div class="pg-ico">${o.ico||""}</div>
    <div class="pg-main"><div class="pg-title">${o.title||""}</div>
    ${o.sub?`<div class="pg-sub">${o.sub}</div>`:""}
    ${o.bar!==undefined?`<div class="pg-bar"><div class="fill ${o.barCls||'f-happy'}" style="width:${Math.max(2,Math.min(100,Math.round(o.bar)))}%"></div></div>`:""}</div>
    ${o.right?`<div class="pg-right">${o.right}</div>`:""}
    ${o.chev?`<div class="pg-chev">›</div>`:""}</div>`;
}
function mpEnsure(){
  if(document.getElementById("mpage"))return;
  const el=document.createElement("div");
  el.id="mpage";el.className="mpage";
  el.innerHTML=`<div class="mp-head"><button class="mp-back" onclick="popPage()">‹</button><div class="mp-title" id="mpTitle"></div></div><div class="mp-body" id="mpBody"></div>`;
  const phone=document.querySelector(".phone")||document.body;
  phone.appendChild(el);
}
function mpRender(){
  mpEnsure();
  const el=document.getElementById("mpage");
  if(!MP.stack.length){el.classList.remove("show");return;}
  const p=MP.stack[MP.stack.length-1];
  _pgH=[];
  document.getElementById("mpTitle").textContent=p.title||"";
  document.getElementById("mpBody").innerHTML=p.render();
  el.classList.add("show");
}
window.pushPage=function(p){MP.stack.push(p);mpRender();};
window.popPage=function(){MP.stack.pop();mpRender();};
window.mpRefresh=function(){if(MP.stack.length)mpRender();};
window.mpCloseAll=function(){MP.stack=[];mpRender();};
// halaman tertutup saat pindah tab / mati / ke menu
(function mpHooks(){
  const _st=switchTab;switchTab=function(){try{mpCloseAll();}catch(e){}return _st.apply(this,arguments);};
  if(typeof die==="function"){const _d=die;die=function(){try{mpCloseAll();}catch(e){}return _d.apply(this,arguments);};}
})();
// helper aksi dalam halaman: jalankan lalu refresh halaman & HUD
function pgDo(fn){
  return function(){
    const r=fn();
    if(r&&r.t){log(C.age,r.t,r.cls||"e-good");toast(r.t);}
    try{updateTitle();renderHidup();}catch(e){}
    mpRefresh();
  };
}

/* ---------- ROSTER KELAS PERMANEN (guru + teman sekelas) ---------- */
function slClass(){
  const sl=slState();
  const tier=C.school?C.school.currentTier:-1;
  if(!sl.klass||sl.klassTier!==tier){
    const tf=chance(0.5);
    sl.klassTier=tier;
    sl.klass={
      teacher:{id:`guru-${tier}-${Math.random().toString(36).slice(2,8)}`,name:randName(tf),female:tf,bond:ri(30,50),age:ri(27,58),metAt:C.age,role:"guru"},
      mates:Array.from({length:ri(6,8)},(_,i)=>{const f=chance(0.5);
        return {id:`murid-${tier}-${i}-${Math.random().toString(36).slice(2,7)}`,name:randName(f),female:f,bond:ri(15,55),age:C.age,role:"murid",
          trait:rand(["ceria","pendiam","jahil","rajin","sok jago","penakut","baik hati","tukang gosip"]),friended:false};})
    };
  }
  return sl.klass;
}
function classPopularity(){
  const k=slClass();
  return Math.round(k.mates.reduce((s,m)=>s+m.bond,0)/k.mates.length);
}

/* ---------- HALAMAN: KEHIDUPAN SEKOLAH ---------- */
window.openSchoolLifePage=function(){
  if(!slEnrolled()){toast("Kau sedang tidak bersekolah.");return;}
  pushPage({title:"Sekolah",render:function(){
    const s=C.school,sl=slState();
    const lvl=(s.currentTier>=0&&typeof SCHOOL_LEVELS!=="undefined")?SCHOOL_LEVELS[s.currentTier]:null;
    const nm=(s.currentTier>=0&&s.levelNames)?s.levelNames[s.currentTier]:"—";
    const c=SCHOOL_CIRCLES.find(x=>x.id===sl.circle);
    const e=SCHOOL_EKSKUL.find(x=>x.id===sl.ekskul);
    let h=pgSec("Sekolahku");
    h+=pgRow({ico:s.ico||"🏫",title:nm,sub:`Jenjang ${lvl?lvl.name:"?"} · jalur ${s.track||"umum"}`,bar:Math.min(100,C.stats.mind),barCls:"f-mind",chev:1,on:()=>openSchool()});
    h+=pgSec("Kehidupan Sekolah");
    h+=pgRow({ico:"🧑‍🤝‍🧑",title:"Kelas",sub:"guru & teman sekelasmu",bar:classPopularity(),right:`Populer ${classPopularity()}%`,chev:1,on:()=>openClassPage()});
    h+=pgRow({ico:c?c.ico:"🏰",title:"Circle Sekolah",sub:c?`${c.name} — ${c.desc}`:"belum ikut kelompok sosial",chev:1,on:()=>openCirclePage()});
    h+=pgRow({ico:e?e.ico:"🎯",title:"Ekstrakurikuler",sub:e?`${e.name} — ${e.desc}`:"sihir, pedang, panahan, brawl, musik...",chev:1,on:()=>openEkskulPage()});
    if(e)h+=pgRow({ico:"🔥",title:"Latihan Ekskul",sub:"sparring / bidikan / mantra — minigame",on:()=>{schoolEkskulTrain();}});
    h+=pgSec("Akademik");
    h+=pgRow({ico:"🏫",title:"Panel Sekolah",sub:"jurusan, belajar ekstra & ujian",chev:1,on:()=>openSchool()});
    h+=pgRow({ico:"📖",title:"Belajar Mandiri",sub:"aktivitas belajar di Dunia → Aksi",chev:1,on:()=>{mpCloseAll();switchTab("Aktivitas");}});
    return h;
  }});
};
/* ---------- HALAMAN: KELAS ---------- */
window.openClassPage=function(){
  pushPage({title:"Kelas",render:function(){
    const k=slClass();
    let h=pgSec("Wali Kelas");
    const teacherAge=(k.teacher.age||30)+Math.max(0,C.age-(k.teacher.metAt||C.age));
    h+=pgRow({ico:typeof npcAvatar==="function"?npcAvatar(k.teacher,teacherAge):k.teacher.female?"👩‍🏫":"🧑‍🏫",title:`${k.teacher.name} (Guru)`,sub:`usia ${teacherAge} · ${k.teacher.bond>=70?"kau murid kesayangannya":"hubungan"}`,bar:k.teacher.bond,barCls:"f-happy",chev:1,on:()=>openTeacherPage()});
    h+=pgSec(`Teman Sekelas · popularitasmu ${classPopularity()}%`);
    k.mates.forEach((m,i)=>{
      h+=pgRow({ico:typeof npcAvatar==="function"?npcAvatar(m,C.age):m.female?"👧":"👦",title:m.name+(m.friended?" 💛":""),sub:`usia ${C.age} · si ${m.trait}`,bar:m.bond,barCls:m.bond>=60?"f-happy":"f-might",chev:1,on:()=>openMatePage(i)});
    });
    return h;
  }});
};
window.openMatePage=function(i){
  pushPage({title:"Teman Sekelas",render:function(){
    const m=slClass().mates[i];
    let h=pgSec(m.name+" · si "+m.trait);
    h+=pgRow({ico:typeof npcAvatar==="function"?npcAvatar(m,C.age):m.female?"👧":"👦",title:m.name,sub:`usia ${C.age} · hubungan kalian`,bar:m.bond});
    h+=pgSec("Aksi");
    h+=pgRow({ico:"🗣️",title:"Ngobrol",sub:"hubungan + · Bahagia +",on:pgDo(()=>{
      if(!spendAction())return null;m.bond=clamp(m.bond+ri(4,9));applyStats({happy:+3});
      return{t:`Kau ngobrol seru dengan ${m.name}.`};})});
    h+=pgRow({ico:"📝",title:"Bantu PR-nya",sub:"hubungan ++ · Akal +",on:pgDo(()=>{
      if(!spendAction())return null;m.bond=clamp(m.bond+ri(6,12));applyStats({mind:+2});
      return{t:`${m.name} berterima kasih atas bantuanmu.`};})});
    h+=pgRow({ico:"🍬",title:"Beri camilan",sub:"hubungan ++ · 💰2",on:pgDo(()=>{
      if(C.coin<2)return{t:"Koinmu tak cukup untuk camilan.",cls:"e-bad"};
      if(!spendAction())return null;C.coin-=2;m.bond=clamp(m.bond+ri(7,13));applyStats({happy:+2});
      return{t:`${m.name} girang menerima camilan manismu.`};})});
    h+=pgRow({ico:"😜",title:"Jahili",sub:"Bahagia ++ · hubungan berisiko",on:pgDo(()=>{
      if(!spendAction())return null;
      if(chance(0.35)){m.bond=clamp(m.bond-ri(8,16));applyStats({happy:+3});
        return{t:`${m.name} tidak terima dijahili. Hubungan renggang.`,cls:"e-bad"};}
      m.bond=clamp(m.bond+ri(2,6));applyStats({happy:+6,charm:+1});
      return{t:`Kalian tertawa terpingkal — leluconmu sukses!`};})});
    h+=pgRow({ico:"🥊",title:"Tantang adu panco",sub:"Kekuatan + · seru-seruan",on:pgDo(()=>{
      if(!spendAction())return null;applyStats({might:+2});
      const win=chance(0.4+C.stats.might/200);
      m.bond=clamp(m.bond+ri(2,6));
      return{t:win?`Kau menang panco melawan ${m.name}! Anak-anak bersorak.`:`${m.name} menang panco — tapi kalian makin akrab.`};})});
    if(m.bond>=70&&!m.friended)
      h+=pgRow({ico:"💛",title:"Jadikan sahabat",sub:"masuk ke Relasi-mu (permanen)",on:pgDo(()=>{
        m.friended=true;const rel=addRel("teman",{id:m.id,name:m.name,female:m.female,bond:m.bond,appearance:m.appearance});rel.ageOffset=0;
        return{t:`${m.name} kini sahabatmu! (lihat Diri → Relasi)`,cls:"e-epic"};})});
    return h;
  }});
};
window.openTeacherPage=function(){
  pushPage({title:"Guru",render:function(){
    const t=slClass().teacher;
    const teacherAge=(t.age||30)+Math.max(0,C.age-(t.metAt||C.age));
    let h=pgSec("Wali Kelas "+t.name);
    h+=pgRow({ico:typeof npcAvatar==="function"?npcAvatar(t,teacherAge):t.female?"👩‍🏫":"🧑‍🏫",title:t.name,sub:`usia ${teacherAge} · ${t.bond>=70?"kau murid kesayangannya 🍎":"hubungan guru-murid"}`,bar:t.bond});
    h+=pgSec("Aksi");
    h+=pgRow({ico:"🍎",title:"Beri apel",sub:"hubungan + · Pesona +",on:pgDo(()=>{
      if(!spendAction())return null;t.bond=clamp(t.bond+ri(5,10));applyStats({charm:+2});
      return{t:`${t.name} tersenyum menerima apelmu.`};})});
    h+=pgRow({ico:"❓",title:"Tanya materi",sub:"Akal ++ (lebih ampuh jika guru sayang)",on:pgDo(()=>{
      if(!spendAction())return null;const bonus=t.bond>=70?3:0;
      applyStats({mind:+ri(4,7)+bonus});t.bond=clamp(t.bond+2);
      return{t:bonus?`${t.name} menjelaskan panjang lebar khusus untukmu!`:"Gurumu menjawab dengan sabar."};})});
    h+=pgRow({ico:"📚",title:"Minta bimbingan ekstra",sub:"Akal +++ · butuh hubungan 60+",dim:t.bond<60,on:pgDo(()=>{
      if(t.bond<60)return null;
      if(!spendAction())return null;applyStats({mind:+ri(7,11)});
      return{t:`Sesi bimbingan pribadi bersama ${t.name} — Akalmu melonjak.`,cls:"e-epic"};})});
    h+=pgRow({ico:"🎭",title:"Bercanda dengan guru",sub:"berisiko — guru bisa tersinggung",on:pgDo(()=>{
      if(!spendAction())return null;
      if(chance(0.4)){t.bond=clamp(t.bond-ri(5,12));return{t:`${t.name} tidak terhibur. "Kembali ke bangkumu."`,cls:"e-bad"};}
      t.bond=clamp(t.bond+ri(4,9));applyStats({happy:+4,charm:+2});
      return{t:"Seisi kelas (dan gurumu) tertawa!"};})});
    return h;
  }});
};
/* ---------- HALAMAN: CIRCLE & EKSKUL (ganti popup lama) ---------- */
window.openCirclePage=function(){
  pushPage({title:"Circle Sekolah",render:function(){
    const sl=slState();
    let h=pgNote("Kelompok sosial memberi bonus pasif tiap tahun.");
    h+=pgSec("Pilih Circle");
    SCHOOL_CIRCLES.forEach(c=>{
      const locked=c.req&&!c.req(C);
      const active=sl.circle===c.id;
      h+=pgRow({ico:c.ico,title:c.name+(active?" ✓":""),sub:locked?"🔒 butuh bakat sihir / Akal 50+":c.desc,dim:locked||active,
        on:pgDo(()=>{if(!spendAction())return null;sl.circle=c.id;
          return{t:`Kau bergabung dengan ${c.ico} ${c.name}!`,cls:"e-epic"};})});
    });
    if(sl.circle)h+=pgRow({ico:"🚪",title:"Keluar dari circle",sub:"kembali jadi anak bebas",on:pgDo(()=>{sl.circle=null;return{t:"Kau keluar dari circle."};})});
    return h;
  }});
};
window.openEkskulPage=function(){
  pushPage({title:"Ekstrakurikuler",render:function(){
    const sl=slState();
    const e=SCHOOL_EKSKUL.find(x=>x.id===sl.ekskul);
    let h=pgNote("Gabung klub lalu tekan <b>Latihan</b> — tiap klub punya minigame berbeda. Rutin ikut klub memberi bonus tahunan.");
    if(e)h+=pgRow({ico:"🔥",title:"Latihan "+e.name,sub:"minigame sesuai klub",on:()=>{schoolEkskulTrain();}});
    h+=pgSec("Klub Fisik");
    SCHOOL_EKSKUL.filter(x=>["sword","brawl","archery"].includes(x.id)).forEach(x=>h+=ekRow(x,sl));
    h+=pgSec("Klub Sihir (penyihir)");
    SCHOOL_EKSKUL.filter(x=>x.mage).forEach(x=>h+=ekRow(x,sl));
    h+=pgSec("Klub Seni & Ilmu");
    SCHOOL_EKSKUL.filter(x=>["music","potion"].includes(x.id)).forEach(x=>h+=ekRow(x,sl));
    return h;
  }});
  function ekRow(x,sl){
    const locked=x.mage&&!C.isMage;
    const active=sl.ekskul===x.id;
    return pgRow({ico:x.ico,title:x.name+(active?" ✓":""),sub:locked?"🔒 khusus penyihir":x.desc,dim:locked||active,
      on:pgDo(()=>{sl.ekskul=x.id;return{t:`Kau mendaftar ${x.ico} ${x.name}!`,cls:"e-epic"};})});
  }
};
// popup lama dialihkan ke halaman baru
window.schoolInteractPopup=function(){if(!slEnrolled()){toast("Kau sedang tidak bersekolah.");return;}openClassPage();};
window.schoolCirclePopup=function(){if(!slEnrolled()){toast("Kau sedang tidak bersekolah.");return;}openCirclePage();};
window.schoolEkskulPopup=function(){if(!slEnrolled()){toast("Kau sedang tidak bersekolah.");return;}openEkskulPage();};

/* ---------- HALAMAN: LOWONGAN KERJA (ganti popup) ---------- */
window.jobOpenListings=function(){
  pushPage({title:"Lowongan Kerja",render:function(){
    let h=pgNote("Tiap profesi punya jenjang pangkat, gaya & keahlian sendiri. Pindah karir me-reset jenjangmu.");
    const groups=[["⚔️ Jalur Tempur","combat"],["🔮 Jalur Arcane","arcane"],["🎭 Jalur Sosial","social"],["🌾 Jalur Kriya","labor"]];
    groups.forEach(g=>{
      const list=CAREERS.filter(c=>(!c.arcane||C.isMage)&&c.id!==C.career&&(typeof jobClassOf==="function"?jobClassOf(c.id)===g[1]:true));
      if(!list.length)return;
      h+=pgSec(g[0]);
      list.forEach(c=>{
        const ok=c.req(C);
        h+=pgRow({ico:c.ico,title:c.name+(c.shady?" 🕶️":""),sub:ok?`${c.ranks[0]} → ${c.ranks[c.ranks.length-1]}`:"🔒 syarat belum terpenuhi",
          right:`💰${c.basepay}/th`,dim:!ok,chev:1,
          on:()=>{applyCareer(c.id);mpCloseAll();try{renderKarir();}catch(e){}}});
      });
    });
    return h;
  }});
};

/* ---------- HALAMAN: AKTIVITAS UMUM (ganti popup openSubs) ---------- */
(function pageActs(){
  const _os=openSubs;
  openSubs=function(actId){
    const a=ACTIVITIES.find(x=>x.id===actId);
    if(!a)return _os.apply(this,arguments);
    pushPage({title:a.name,render:function(){
      let h=pgNote(`${a.desc||""}`);
      h+=pgSec("Pilih Kegiatan");
      a.subs.forEach(s=>{
        h+=pgRow({ico:a.ico,title:s.label,sub:s.hint||"",on:pgDo(()=>{
          if(!spendAction())return null;
          const t=s.run();
          return t?{t:t,cls:"e-good"}:null;})});
      });
      return h;
    }});
  };
})();

/* ==================================================================
   MANTARA — RUMAH KELUARGA (household unik per karakter)
   Tiap karakter lahir di rumah dengan FASILITAS acak (dipengaruhi
   asal-usul + keberuntungan): lapangan bidik sihir, lintasan kuda,
   jacuzzi, kolam, bengkel tempa, aula pedang, altar arcane, dll.
   Tab Aksi = lokasi: Rumah + sub-lokasi kota (halaman sendiri-sendiri).
   ================================================================== */
const HOME_FACILITIES=[
  // dasar — semua rumah punya
  {id:"bed",ico:"🛏️",name:"Kamar Tidur",desc:"Istirahat, berdoa & pulihkan jiwa",base:true,acts:"reflect",minAge:0},
  {id:"yard",ico:"🏋️",name:"Halaman Rumah",desc:"Latihan fisik sederhana",base:true,acts:"train",minAge:8},
  {id:"desk",ico:"📖",name:"Meja Belajar",desc:"Belajar mandiri di rumah",base:true,acts:"study",minAge:6},
  // spesial — acak per keluarga
  {id:"range",ico:"🎯",name:"Lapangan Bidik Sihir",desc:"Latihan bidik rune — minigame!",w:{mageborn:3,noble:1},minAge:8,run:"range"},
  {id:"track",ico:"🐎",name:"Lintasan Kuda Halaman",desc:"Balapan kuda lawan tetangga",w:{noble:3,merchant_kid:2},minAge:8,run:"track"},
  {id:"jacuzzi",ico:"♨️",name:"Jacuzzi Mata Air",desc:"Berendam air panas beruap",w:{noble:3},minAge:0,run:"jacuzzi"},
  {id:"pool",ico:"🏊",name:"Kolam Renang",desc:"Berenang menyegarkan badan",w:{noble:2,merchant_kid:2},minAge:5,run:"pool"},
  {id:"forge",ico:"⚒️",name:"Bengkel Tempa Kecil",desc:"Menempa & menerima reparasi tetangga",w:{peasant:2,orphan:1},minAge:10,run:"forge"},
  {id:"swordhall",ico:"🗡️",name:"Aula Latihan Pedang",desc:"Sparring dengan pelatih keluarga — duel!",w:{noble:2},minAge:8,run:"swordhall"},
  {id:"library",ico:"📚",name:"Perpustakaan Keluarga",desc:"Rak gulungan tua turun-temurun",w:{noble:2,merchant_kid:2,mageborn:2},minAge:6,run:"library"},
  {id:"herb",ico:"🌿",name:"Kebun Herbal",desc:"Panen herba & racik ramuan",w:{peasant:3,mageborn:2},minAge:6,run:"herb"},
  {id:"altar",ico:"🔮",name:"Altar Arcane",desc:"Meditasi mana warisan keluarga",w:{mageborn:4},minAge:6,run:"altar"},
  {id:"music",ico:"🎻",name:"Ruang Musik",desc:"Latih nada, pukau keluarga",w:{noble:2,merchant_kid:1},minAge:5,run:"music"},
  {id:"pigeon",ico:"🕊️",name:"Menara Merpati",desc:"Kirim surat ke kenalan jauh",w:{merchant_kid:3},minAge:8,run:"pigeon"},
  {id:"games",ico:"🎲",name:"Ruang Permainan",desc:"Papan & kartu bersama keluarga",w:{merchant_kid:2,noble:1},minAge:5,run:"games"},
  {id:"secret",ico:"🕯️",name:"Sudut Rahasia",desc:"Persembunyian di loteng — harta kecil?",w:{orphan:4},minAge:0,run:"secret"},
  {id:"dragon",ico:"🐉",name:"Patung Naga Leluhur",desc:"Pusaka legendaris — berkat setahun sekali",rare:true,minAge:0,run:"dragon"},
];
const HOME_NAMES={
  peasant:["Pondok Jerami Keluarga","Gubuk Ladang Keluarga","Rumah Panggung Keluarga"],
  noble:["Manor Keluarga","Puri Kecil Keluarga","Wisma Bangsawan Keluarga"],
  mageborn:["Menara Kecil Keluarga","Rumah Rune Keluarga","Pondok Arcane Keluarga"],
  merchant_kid:["Rumah Toko Keluarga","Loji Dagang Keluarga","Griya Saudagar Keluarga"],
  orphan:["Loteng Penampungan","Sudut Gudang Pelabuhan","Loteng Kedai Tua"],
};
const HOME_ICON={peasant:"🛖",noble:"🏛️",mageborn:"🗼",merchant_kid:"🏘️",orphan:"🏚️"};
function ensureHousehold(){
  if(C.household)return C.household;
  const o=C.origin||"peasant";
  const nExtra=o==="noble"?ri(3,4):(o==="orphan"?ri(1,2):ri(2,3));
  const pool=HOME_FACILITIES.filter(f=>!f.base&&!f.rare);
  // undian berbobot sesuai asal-usul + keberuntungan
  const picked=[];
  for(let i=0;i<nExtra&&pool.length;i++){
    const tot=pool.reduce((s,f)=>s+((f.w&&f.w[o])||1),0);
    let r=Math.random()*tot,sel=pool[0];
    for(const f of pool){r-=((f.w&&f.w[o])||1);if(r<=0){sel=f;break;}}
    picked.push(sel.id);pool.splice(pool.indexOf(sel),1);
  }
  if(chance(0.06))picked.push("dragon"); // keberuntungan legendaris!
  C.household={
    name:rand(HOME_NAMES[o]||HOME_NAMES.peasant)+(o==="orphan"?"":" "+(C.name.split(" ").pop()||"")),
    ico:HOME_ICON[o]||"🏠",
    facilities:["bed","yard","desk"].concat(picked),
  };
  return C.household;
}
/* ---------- aksi fasilitas spesial ---------- */
window.homeFacAct=function(fid){
  const f=HOME_FACILITIES.find(x=>x.id===fid);if(!f)return;
  if(C.age<(f.minAge||0)){toast(`Masih terlalu muda (min ${f.minAge} th).`);return;}
  switch(f.run){
    case "range":
      if(!spendAction())return;
      skillShotGame({title:"Lapangan Bidik Sihir",ico:"🎯",desc:"Bidik rune melayang di halaman rumahmu!",gold:12+C.stats.mind*0.1,speed:1.45},function(res){
        if(res==="perfect"){applyStats({mind:+3,might:+2,mana:C.isMage?+4:0,happy:+4});finishAct("🎯 Rune pecah tepat di pusat — bakatmu terasah!","e-epic","win");}
        else if(res==="good"){applyStats({mind:+2,might:+1,mana:C.isMage?+2:0});finishAct("🎯 Bidikan bagus. Terus berlatih di halaman.","e-good");}
        else{applyStats({happy:-1});finishAct("🎯 Rune melesat lolos. Besok coba lagi.","e-bad");}
      });return;
    case "track":
      if(!spendAction())return;
      playAnim&&playAnim("race");
      setTimeout(()=>{
        if(chance(0.45+C.stats.might/250)){const g=ri(10,30);C.coin+=g;applyStats({might:+3,happy:+5});
          finishAct(`🐎 Kau menang balapan halaman melawan anak tetangga! +${g} keping taruhan kecil.`,"e-epic","win");}
        else{applyStats({might:+2,happy:-1});finishAct("🐎 Kalah tipis di tikungan terakhir. Kudamu butuh latihan.","e-bad");}
      },900);return;
    case "jacuzzi":
      if(!spendAction())return;
      applyStats({health:+7,happy:+6});finishAct("♨️ Berendam di mata air panas — penat lenyap.","e-good","win");return;
    case "pool":
      if(!spendAction())return;
      applyStats({health:+5,might:+3,happy:+3});finishAct("🏊 Berenang bolak-balik hingga lengan pegal.","e-good","win");return;
    case "forge":
      if(!spendAction())return;
      applyStats({might:+4});
      if(chance(0.4)){const g=ri(5,15);C.coin+=g;finishAct(`⚒️ Kau menempa & memperbaiki alat tetangga (+${g} keping).`,"e-good","coin");}
      else finishAct("⚒️ Palu berdentang hingga senja — lenganmu mengeras.","e-good","win");return;
    case "swordhall":
      if(window.MantaraArena&&MantaraArena.startTacticalDuel){
        if(!spendAction())return;
        MantaraArena.startTacticalDuel(
          {name:"Pelatih Keluarga",ico:"🧔",hp:30+C.age*2,atk:9+Math.round(C.age/3),mag:0,special:"Tebasan Mengunci"},
          {title:"Sparring Aula Pedang",allowFlee:true,
           intro:"🗡️ Pelatih keluargamu mengangkat pedang kayu. \"Tunjukkan perkembanganmu!\"",
           onEnd:function(res){
             if(res&&res.win){applyStats({might:+5,happy:+4});finishAct("🗡️ Pelatih mengangguk: \"Kau melampaui hari kemarin.\"","e-epic","win");}
             else if(res&&!res.quit){applyStats({might:+2,health:-ri(2,5)});finishAct("🗡️ Kalah sparring — tapi tiap memar adalah pelajaran.","e-bad");}
           }});
      }else{if(!spendAction())return;applyStats({might:+4});finishAct("🗡️ Latihan pedang hingga peluh bercucuran.","e-good","win");}
      return;
    case "library":
      if(!spendAction())return;
      applyStats({mind:+ri(4,8)});
      if(chance(0.12)){applyStats({mana:+2});finishAct("📚 Kau menemukan catatan arcane tersembunyi di rak tua!","e-arcane","win");}
      else finishAct("📚 Gulungan demi gulungan — wawasanmu meluas.","e-good","win");return;
    case "herb":
      if(!spendAction())return;
      applyStats({health:+4});
      if(chance(0.35)){addItem("health_potion");finishAct("🌿 Panen bagus! Kau meracik Ramuan Nyawa (masuk Tas).","e-epic","win");}
      else finishAct("🌿 Kau merawat bedeng herbal, aromanya menenangkan.","e-good","win");return;
    case "altar":
      if(!spendAction())return;
      if(C.isMage){applyStats({mana:+ri(5,9),mind:+2});finishAct("🔮 Altar keluarga berpendar — manamu mengalir deras.","e-arcane","win");}
      else{applyStats({mind:+2,happy:+3});finishAct("🔮 Kau berdoa di altar leluhur. Batinmu tenang.","e-good","win");}return;
    case "music":
      if(!spendAction())return;
      applyStats({charm:+ri(3,6),happy:+2});finishAct("🎻 Gesekan biolamu membuat seisi rumah terdiam kagum.","e-good","win");return;
    case "pigeon":
      if(!spendAction())return;
      const rels=C.relations.filter(r=>r.role!=="musuh");
      if(rels.length){const r2=rand(rels);r2.bond=clamp((r2.bond||50)+ri(4,9));
        finishAct(`🕊️ Suratmu sampai ke ${r2.name} — ikatan kalian menguat.`,"e-good","win");}
      else{applyStats({charm:+2});finishAct("🕊️ Kau melatih merpati pos. Kelak berguna.","e-good");}return;
    case "games":
      if(!spendAction())return;
      applyStats({happy:+ri(4,7)});
      const fam=C.relations.filter(r=>r.role==="keluarga");
      if(fam.length){const fr=rand(fam);fr.bond=clamp(fr.bond+3);
        finishAct(`🎲 Malam permainan seru bersama ${fr.name}!`,"e-good","win");}
      else finishAct("🎲 Kau bermain kartu sendirian — tetap seru.","e-good");return;
    case "secret":
      if(!spendAction())return;
      applyStats({happy:+3,mind:+2});
      if(chance(0.2)){const g=ri(3,10);C.coin+=g;finishAct(`🕯️ Kau menemukan ${g} keping terselip di papan lantai!`,"e-epic","coin");}
      else finishAct("🕯️ Kau melamun di sudut rahasiamu, menyusun rencana besar.","e-good");return;
    case "dragon":
      if(C._dragonYr===C.age){toast("🐉 Patung itu diam. Berkatnya setahun sekali.");return;}
      if(!spendAction())return;
      C._dragonYr=C.age;
      applyStats({health:+2,happy:+2,might:+1,mind:+1,mana:+2,charm:+1});
      finishAct("🐉 Mata patung naga berpendar — berkat leluhur mengalir ke seluruh tubuhmu!","e-epic","win");return;
  }
};
/* ---------- HALAMAN: RUMAH ---------- */
window.openHomePage=function(){
  ensureHousehold();
  pushPage({title:"Rumah",render:function(){
    const hh=C.household;
    let h=(typeof homeHeroSVG==="function")?`<div style="padding:10px 12px 0">${homeHeroSVG()}</div>`:"";
    h+=pgSec("Kediaman");
    h+=pgRow({ico:hh.ico,title:hh.name,sub:`${hh.facilities.length} fasilitas · warisan asal-usulmu & keberuntungan`,bar:Math.min(100,hh.facilities.length*12),barCls:"f-happy"});
    if(C.age<13&&typeof CHILD_ACTS!=="undefined"){
      const kid=CHILD_ACTS.filter(a=>C.age>=a.minAge&&C.age<=a.maxAge);
      if(kid.length){
        h+=pgSec("🧒 Masa Kecil");
        kid.forEach(a=>{h+=pgRow({ico:a.ico,title:a.label,sub:a.hint,on:()=>{a.run();mpRefresh();}});});
      }
    }
    h+=pgSec("Fasilitas Rumah");
    hh.facilities.forEach(fid=>{
      const f=HOME_FACILITIES.find(x=>x.id===fid);if(!f)return;
      const locked=C.age<(f.minAge||0);
      const art=(typeof facSVG==="function"&&facSVG(f.id))||f.ico;
      if(f.acts){
        h+=pgRow({ico:art,title:f.name,sub:locked?`🔒 min ${f.minAge} th`:f.desc,dim:locked,chev:1,on:()=>openSubs(f.acts)});
      }else{
        h+=pgRow({ico:art,title:f.name,sub:locked?`🔒 min ${f.minAge} th`:f.desc,dim:locked,on:()=>homeFacAct(f.id)});
      }
    });
    if(C.isMage&&!hh.facilities.includes("altar"))
      h+=pgRow({ico:"✨",title:"Latihan Arcane",sub:"asah sihir di kamarmu diam-diam",chev:1,on:()=>openSubs("magic")});
    return h;
  }});
};
/* ---------- HALAMAN: SUB-LOKASI ---------- */
window.openSublocPage=function(sid){
  const city=currentCity();
  const sub=city.sublocs.find(s=>s.id===sid);if(!sub)return;
  C.subloc=sid;
  try{renderHidup();}catch(e){}
  pushPage({title:sub.name,render:function(){
    const acts=SUBLOC_ACTS[sid]||[];
    const ages=SUBLOC_ACT_MIN_AGE[sid]||[];
    let h=pgNote(`${sub.ico} ${sub.desc}`);
    h+=pgSec("Kegiatan di sini");
    if(!acts.length)h+=pgNote("Belum ada kegiatan khusus di tempat ini.");
    acts.forEach((a,i)=>{
      const minA=ages[i]||0;const locked=C.age<minA;
      h+=pgRow({ico:a.ico,title:a.label,sub:locked?`🔒 min ${minA} th`:a.hint,dim:locked,on:()=>{a.run();setTimeout(mpRefresh,80);}});
    });
    return h;
  }});
};
/* ---------- TAB AKSI = LOKASI (Rumah + sub-lokasi kota) ---------- */
renderAktivitas=function(){
  const host=document.getElementById("viewAktivitas");if(!host)return;
  ensureHousehold();
  const city=currentCity();
  const hh=C.household;
  const facPreview=hh.facilities.filter(id=>!HOME_FACILITIES.find(f=>f.id===id).base)
    .map(id=>{const f=HOME_FACILITIES.find(x=>x.id===id);return f?f.ico+" "+f.name:"";}).slice(0,3).join(" · ");
  let html=`<div class="sechead">🏠 Kediaman</div>
    <div class="tiles"><div class="tile fullrow arcane" onclick="openHomePage()">
      <span class="ti">${hh.ico}</span><span class="tn">${hh.name} ▸</span>
      <span class="td">${facPreview||"rumah sederhana penuh kenangan"} — ${hh.facilities.length} fasilitas</span></div></div>`;
  html+=`<div class="sechead">📍 Jelajah ${city.name}</div>
    <p style="font-size:10.5px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 10px;">Tiap sub-lokasi punya kegiatan khasnya sendiri. Pindah kota lewat Peta.</p>
    <div class="tiles">`;
  city.sublocs.forEach(s=>{
    const here=C.subloc===s.id;
    html+=`<div class="tile ${here?'here':''}" onclick="openSublocPage('${s.id}')">
      ${here?'<span class="badge">DI SINI</span>':''}
      <span class="ti">${s.ico}</span><span class="tn">${s.name}</span>
      <span class="td">${s.desc}</span></div>`;});
  html+=`</div>`;
  // LATIH KEAHLIAN — akses langsung ke bimbel/perguruan kota ini
  const eduStores=(typeof storesInCity==="function")?storesInCity().filter(s=>s.cat==="Bimbel"||s.cat==="Perguruan"):[];
  html+=`<div class="sechead">📈 Latih Keahlian (Tingkat 1-5)</div>
    <p style="font-size:10.5px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 10px;">Ilmu Pedang, Alkimia, Diplomasi, Pengobatan${C.isMage?', Sihir Tempur':''} — kursus menaikkan Keahlian + bonus stat.</p>
    <div class="tiles">`;
  if(eduStores.length){
    eduStores.forEach(s=>{
      html+=`<div class="tile arcane" onclick="openStore('${s.id}')">
        <span class="ti">${s.ico}</span><span class="tn">${s.name}</span>
        <span class="td">${s.cat} · ${s.desc}</span></div>`;});
  }
  if(!eduStores.find(s=>s.id==="magetutor")){
    html+=`<div class="tile locked"><span class="ti">🔮</span><span class="tn">Sanggar Sihir</span>
      <span class="td">🔒 hanya di Aetheria & Frostspire — pindah lewat Peta</span></div>`;
  }
  html+=`</div>`;
  html+=`<div class="sechead">🎓💼 Sekolah & Karir</div>
    <div class="tiles"><div class="tile fullrow" onclick="switchTab('Karir')">
      <span class="ti">💼</span><span class="tn">Buka Menu Karir</span>
      <span class="td">${C.age<MIN_WORK_AGE?'Status sekolah, kelas & persiapan kerja':'Pekerjaan, performa, keahlian & lowongan'} — semua di satu tempat</span></div></div>`;
  html+=`<div class="sechead">Misi & Tujuan</div>`;
  C.missions.forEach(ms=>{const def=MISSION_POOL.find(m=>m.id===ms.id);if(!def)return;
    html+=`<div class="mission" style="${ms.done?'opacity:.55':''}">
      <div class="mtitle">${ms.done?'✅ ':''}${def.title}</div>
      <div class="mdesc">${def.desc}</div></div>`;});
  host.innerHTML=html;
};
