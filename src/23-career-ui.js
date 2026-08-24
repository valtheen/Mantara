/* ==================================================================
   MANTARA — BIMBEL SIHIR & PERGURUAN BELA DIRI (kursus spesialis)
   Menaikkan Keahlian (SKILL_TYPES, maks Tingkat 5) + bonus stat.
   Muncul otomatis di tab Toko (kategori Bimbel / Perguruan).
   ================================================================== */
function trainSkillCourse(skillId,cost,stats,msg,cls){
  const owned=C.skills.find(s=>s.id===skillId);
  const lvl=owned?owned.level:0;
  if(lvl>=5){toast("Kau sudah Mahaguru aliran ini (Tingkat 5) — tak ada lagi yang bisa diajarkan.");return;}
  if(C.coin<cost){toast("Koin kurang.");return;}
  if(!spendAction())return;
  C.coin-=cost;
  if(owned)owned.level++;else C.skills.push({id:skillId,level:1});
  applyStats(stats);
  finishAct(`${msg} (Keahlian naik ke Tingkat ${lvl+1}/5)`,cls||"e-good");
}
(function addSpecialistSchools(){
  const lvl=id=>{const s=C&&C.skills?C.skills.find(x=>x.id===id):null;return s?s.level:0;};
  const tarif=(base,id)=>base+lvl(id)*45; // makin tinggi tingkat, makin mahal
  STORES.push(
  // ===== SANGGAR SIHIR (bimbel arcane per aliran) =====
  {id:"magetutor",ico:"🔮",name:"Sanggar Sihir",cat:"Bimbel",city:["aetheria","frostspire"],
    desc:"Bimbingan privat para guru arcane — pilih aliranmu.",
    build:()=>[
      {ico:typeof courseIconHTML==="function"?courseIconHTML("fireFlow"):"🔥",label:`Aliran Api — Sihir Tempur`,sub:`Tk.${lvl('sorcery')}/5 → Mana+6 Kekuatan+2 · 💰${tarif(90,'sorcery')} (khusus penyihir)`,
        price:tarif(90,'sorcery'),minAge:10,
        run:()=>{if(!C.isMage){toast("Hanya darah penyihir yang mampu menahan aliran api.");return;}
          trainSkillCourse('sorcery',tarif(90,'sorcery'),{mana:+6,might:+2},"Bola apimu meledak sempurna! Gurumu tersenyum bangga.","e-arcane");}},
      {ico:typeof courseIconHTML==="function"?courseIconHTML("healingFlow"):"💚",label:`Aliran Penyembuhan`,sub:`Pengobatan Tk.${lvl('medicine')}/5 → Nyawa+5 Mana+3 · 💰${tarif(80,'medicine')}`,
        price:tarif(80,'medicine'),minAge:10,
        run:()=>trainSkillCourse('medicine',tarif(80,'medicine'),{health:+5,mana:+3},"Kau menutup luka dengan cahaya hangat. Ilmu penyembuhanmu bertambah.","e-arcane")},
      {ico:typeof courseIconHTML==="function"?courseIconHTML("illusionFlow"):"🎭",label:`Aliran Ilusi & Pikat`,sub:`Diplomasi Tk.${lvl('diplomacy')}/5 → Pesona+6 Mana+2 · 💰${tarif(85,'diplomacy')}`,
        price:tarif(85,'diplomacy'),minAge:12,
        run:()=>trainSkillCourse('diplomacy',tarif(85,'diplomacy'),{charm:+6,mana:+2},"Kata-katamu kini berkilau bagai mantra — sulit ditolak.","e-arcane")},
      {ico:typeof courseIconHTML==="function"?courseIconHTML("runeFlow"):"⚗️",label:`Aliran Rune & Ramuan`,sub:`Alkimia Tk.${lvl('alchemy')}/5 → Akal+6 · 💰${tarif(85,'alchemy')}`,
        price:tarif(85,'alchemy'),minAge:10,
        run:()=>trainSkillCourse('alchemy',tarif(85,'alchemy'),{mind:+6},"Rune yang kau ukir menyala biru — formulamu berhasil!","e-arcane")},
      {ico:typeof courseIconHTML==="function"?courseIconHTML("manaMeditation"):"🧘",label:"Meditasi Mana",sub:"Mana+8 · 💰40 (terbuka untuk semua)",price:40,minAge:8,
        run:()=>storeService(40,{mana:+8},"Kau bermeditasi di lingkaran rune, energi mengalir tenang.","e-arcane")},
    ]},
  // ===== PERGURUAN BELA DIRI (martial arts per aliran) =====
  {id:"dojo",ico:"🥋",name:"Perguruan Bela Diri",cat:"Perguruan",city:["all"],
    desc:"Empat aliran bela diri legendaris — berlatih bersama master.",
    build:()=>[
      {ico:typeof courseIconHTML==="function"?courseIconHTML("southSword"):"🤺",label:`Aliran Pedang Selatan`,sub:`Ilmu Pedang Tk.${lvl('swordsmanship')}/5 → Kekuatan+5 · 💰${tarif(75,'swordsmanship')}`,
        price:tarif(75,'swordsmanship'),minAge:12,
        run:()=>trainSkillCourse('swordsmanship',tarif(75,'swordsmanship'),{might:+5},"Master mengajarimu jurus Pedang Selatan yang mematikan.")},
      {ico:typeof courseIconHTML==="function"?courseIconHTML("ironFist"):"🥊",label:"Tinju Naga Besi",sub:"Kekuatan+6 Nyawa+2 · 💰60",price:60,minAge:10,
        run:()=>storeService(60,{might:+6,health:+2},"Kepalan tanganmu kini keras bagai besi tempa.")},
      {ico:typeof courseIconHTML==="function"?courseIconHTML("bearGrapple"):"🤼",label:"Gulat Beruang Utara",sub:"Kekuatan+4 Nyawa+4 · 💰55",price:55,minAge:10,
        run:()=>storeService(55,{might:+4,health:+4},"Kuncian gulatmu membuat lawan menyerah sebelum bertarung.")},
      {ico:typeof courseIconHTML==="function"?courseIconHTML("windBow"):"🏹",label:"Panahan Angin Timur",sub:"Kekuatan+3 Akal+4 · 💰65",price:65,minAge:10,
        run:()=>storeService(65,{might:+3,mind:+4},"Anak panahmu membelah angin — tepat di pusat sasaran.")},
      {ico:typeof courseIconHTML==="function"?courseIconHTML("martialMeditation"):"🧘",label:"Meditasi Bela Diri",sub:"Bahagia+4 Nyawa+3 · 💰30",price:30,minAge:8,
        run:()=>storeService(30,{happy:+4,health:+3},"Napas & fokusmu selaras. Tubuh dan pikiran menyatu.")},
    ]}
  );
})();

/* ==================================================================
   MANTARA — BUSANA DI TOKO + STOK BERPUTAR
   Pakaian dibeli di toko (Butik/Pandai Besi/Tukang Tongkat), lalu
   dipakai lewat Wardrobe. Stok semua toko berganti tiap tahun & kota.
   ================================================================== */
// item busana untuk katalog toko — status ✓ dimiliki tampil dinamis
function wardrobeShopItem(slot,key,price,minAge){
  const cat=WARDROBE_CATALOG[slot];
  const v=cat.variants.find(x=>x.key===key);
  if(!v)return null;
  ensureWardrobe();
  const owned=(C.wardrobeOwned[slot]||[]).includes(key);
  const perks=Object.entries(v.perk||{}).map(([k,val])=>`${STAT_META[k]?STAT_META[k].name:k}+${val}`).join(" ")||"—";
  const graphic=(typeof wardrobeIconHTML==="function")?wardrobeIconHTML(slot,key):(cat.graphic||cat.ico);
  return {ico:graphic,label:`${v.name}${owned?' ✓':''}`,
    sub:owned?"sudah dimiliki · pakai di Aset → Wardrobe":`${cat.name} · ${perks}/th · 💰${price}`,
    price:owned?0:price,minAge:minAge||8,
    run:()=>{
      if(owned){toast("Sudah kau miliki — pakai lewat Aset → Wardrobe.");return;}
      storeBuyWardrobe(slot,key,price,v.name);
    }};
}
(function fashionAndStock(){
  // ===== BUTIK PENJAHIT (busana kain & gaya) =====
  STORES.push({id:"butik",ico:"🧵",name:"Butik Penjahit",cat:"Busana",city:["all"],
    desc:"Busana jahitan halus — tampil menawan tiap musim.",
    build:()=>[
      wardrobeShopItem("body","tunic",40,5),
      wardrobeShopItem("body","silk",160,12),
      wardrobeShopItem("legs","cloth",25,5),
      wardrobeShopItem("legs","riding",90,10),
      wardrobeShopItem("feet","sandals",20,5),
      wardrobeShopItem("feet","boots",75,8),
      wardrobeShopItem("head","hood",30,5),
      wardrobeShopItem("head","circlet",150,12),
    ].filter(Boolean)});
  // ===== TUKANG TONGKAT: tambah busana arcane =====
  const ws=STORES.find(s=>s.id==="wandsmith");
  if(ws){const _wb=ws.build;
    ws.build=()=>_wb().concat([
      wardrobeShopItem("body","arcane_robe",700,16),
      wardrobeShopItem("head","mage_hat",400,13),
      wardrobeShopItem("feet","swift",520,14),
    ].filter(Boolean));}

  // ===== STOK BERPUTAR =====
  // deterministik per (toko + kota + usia): buka ulang di tahun sama = stok sama
  // (anti reroll), tapi tahun/kota berbeda = stok berbeda -> selalu ada yg baru.
  window.mantaraStockRng=function(tag){
    let h=2166136261;const s=tag+"|"+(C?C.cityId:"")+"|"+(C?C.age:0);
    for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)>>>0;}
    return function(){h=Math.imul(h,1103515245)+12345>>>0;return h/4294967296;};
  };
  STORES.forEach(s=>{
    if(s.cat==="Bimbel"||s.cat==="Perguruan")return; // kursus selalu lengkap
    const _b=s.build;
    s.build=function(){
      const items=_b();
      const rng=mantaraStockRng(s.id);
      const kept=items.filter(()=>rng()<0.68);
      const minKeep=Math.min(3,items.length);
      for(let i=0;kept.length<minKeep&&i<items.length*3;i++){
        const cand=items[Math.floor(rng()*items.length)];
        if(!kept.includes(cand))kept.push(cand);
      }
      return kept;
    };
  });
})();

/* ==================================================================
   MANTARA — MENU KARIR TERPADU (Diri → Karir)
   Satu menu yang berubah sesuai tahap hidup: sekolah saat muda,
   pekerjaan saat dewasa. Tiap profesi punya SELF-DEVELOPMENT sendiri
   (Keahlian Profesi Tk.0-5) yang mempengaruhi gaji, promosi & stat.
   ================================================================== */
const JOB_DEV={
  farmer:{name:"Ilmu Tani",ico:"🌾",stat:"might"},
  guard:{name:"Kedisiplinan Baja",ico:"🛡️",stat:"might"},
  scholar:{name:"Metode Riset",ico:"📚",stat:"mind"},
  merchant:{name:"Seni Negosiasi",ico:"🤝",stat:"charm"},
  blacksmith:{name:"Teknik Tempa",ico:"⚒️",stat:"might"},
  healer:{name:"Anatomi & Herbal",ico:"⚕️",stat:"mind"},
  bard:{name:"Panggung & Nada",ico:"🎻",stat:"charm"},
  thief:{name:"Langkah Senyap",ico:"🕶️",stat:"mind"},
  mage:{name:"Fokus Arcane",ico:"🔮",stat:"mana"},
  knight:{name:"Seni Perang",ico:"⚔️",stat:"might"},
  alchemist:{name:"Formula Rahasia",ico:"⚗️",stat:"mind"},
  mageteacher:{name:"Pedagogi Arcane",ico:"🧙",stat:"mana"},
  gladiator:{name:"Insting Arena",ico:"🏟️",stat:"might"},
  politician:{name:"Retorika",ico:"🎭",stat:"charm"},
  researcher:{name:"Eksperimen",ico:"🔬",stat:"mind"},
  adventurer:{name:"Jejak Rimba",ico:"🗺️",stat:"health"},
  guildmaster:{name:"Tata Kelola Guild",ico:"🏛️",stat:"charm"},
  diplomat:{name:"Etiket Kerajaan",ico:"🤝",stat:"charm"},
  captain:{name:"Navigasi Samudra",ico:"⚓",stat:"mind"},
  monarch:{name:"Seni Memerintah",ico:"👑",stat:"charm"},
};
function jobDevOf(id){
  const car=CAREERS.find(x=>x.id===id);
  return JOB_DEV[id]||{name:"Keahlian "+(car?car.name:"Profesi"),ico:"💼",stat:"mind"};
}
function ensureJobState(){
  if(C.jobPerf===undefined)C.jobPerf=50;
  if(!C.jobDev||C.jobDev.id!==C.career)C.jobDev={id:C.career,level:0};
}
function renderKarir(){
  const host=document.getElementById("viewKarir");if(!host)return;
  let html="";
  const s=C.school;
  // ===== PENDIDIKAN (berubah sesuai tahap) =====
  if(C.age<5){
    html+=`<div class="sechead">🎓 Pendidikan</div>
      <div class="charcard" style="text-align:center;padding:22px 14px;margin-bottom:12px">
        <div style="font-size:34px;margin-bottom:6px">🌱</div>
        <div style="font-size:12.5px;color:var(--ink-soft);filter:brightness(1.7);line-height:1.5">Masih masa kecil — sekolah dimulai sekitar usia 5-6.<br>Nikmati masa bermainmu!</div></div>`;
  }else if(s&&s.enrolled&&!s.droppedOut){
    const lvl=(s.currentTier>=0&&typeof SCHOOL_LEVELS!=="undefined")?SCHOOL_LEVELS[s.currentTier]:null;
    const nm=(s.currentTier>=0&&s.levelNames)?s.levelNames[s.currentTier]:"—";
    const slInfo=(typeof slStatusLine==="function")?slStatusLine():"";
    html+=`<div class="sechead">🎓 Pendidikan</div>
      <div class="charcard" style="margin-bottom:10px"><div class="chartop">
        <div class="portrait">${typeof schoolCrestHTML==="function"?schoolCrestHTML(s.track,s.currentTier,null,nm):(s.ico||"📖")}</div>
        <div class="cinfo"><div class="cname">${nm}</div>
          <div class="ctitle">Jenjang ${lvl?lvl.name:"?"} · jalur ${s.track||"umum"}</div>
          <div class="cage">Kuis kenaikan tiap tahun — rajin belajar & jaga Akal!</div>
          ${slInfo}</div></div></div>
      <div class="tiles">
        <div class="tile fullrow arcane" onclick="openSchoolLifePage()"><span class="ti">${typeof schoolLifeIconHTML==="function"?schoolLifeIconHTML():"🏫"}</span><span class="tn">Kehidupan Sekolah ▸</span><span class="td">kelas & teman sekelas, guru, circle, ekstrakurikuler, panel akademik — jelajahi!</span></div>
      </div>`;
  }else if(s&&s.droppedOut){
    html+=`<div class="sechead">🎓 Pendidikan</div>
      <p style="font-size:11.5px;color:var(--bad);margin:0 4px 12px;">🚫 Kau dropout dari sekolah. Beberapa karir tertutup, tapi jalan lain selalu ada.</p>`;
  }else if(s&&s.graduated&&s.graduated.length){
    html+=`<div class="sechead">🎓 Pendidikan</div>
      <p style="font-size:11.5px;color:var(--good);margin:0 4px 12px;">✅ Lulus ${s.graduated.length} jenjang pendidikan. Ilmu itu kini modal karirmu.</p>`;
  }else if(C.age>=5&&C.age<=20){
    html+=`<div class="sechead">🎓 Pendidikan</div>
      <div class="tiles" style="margin-bottom:4px"><div class="tile fullrow" onclick="openSchool()">
        <span class="ti">${typeof schoolCrestHTML==="function"?schoolCrestHTML("umum",0,C.cityId,"Sekolah kota"):"🏫"}</span><span class="tn">Sekolah</span>
        <span class="td">Pendaftaran berjalan otomatis saat tahun berganti — ketuk untuk lihat panel sekolah kotamu</span></div></div>`;
  }
  // ===== PEKERJAAN (berubah: belum umur → lowongan → karir aktif) =====
  if(C.age<MIN_WORK_AGE){
    html+=`<div class="sechead">💼 Pekerjaan</div>
      <p style="font-size:11.5px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 8px;">Usia kerja dimulai ${MIN_WORK_AGE} tahun. Fokus sekolah & asah statmu — itu menentukan lowongan yang terbuka nanti.</p>`;
  }else if(C.career){
    const car=CAREERS.find(x=>x.id===C.career);
    if(car){
      ensureJobState();
      const d=jobDevOf(C.career);
      const basePay=Math.round(car.basepay+C.careerLevel*car.basepay*0.8);
      const bonus=C.jobDev.level?Math.round(car.basepay*0.1*C.jobDev.level):0;
      html+=`<div class="sechead">💼 Pekerjaanmu</div>
      <div class="charcard" style="margin-bottom:10px">
        <div class="chartop"><div class="portrait">${car.ico}</div>
          <div class="cinfo"><div class="cname">${car.ranks[C.careerLevel]}</div>
            <div class="ctitle">${car.name} · Jenjang ${C.careerLevel+1}/${car.ranks.length}</div>
            <div class="cage">Gaji ${basePay}${bonus?` <span style="color:var(--good)">+${bonus} bonus keahlian</span>`:""}/th · ${C.careerYears} th di jenjang ini</div></div></div>
        <div style="margin-top:11px">
          <div class="statrow"><span class="statname">Performa Kerja</span><span class="statval">${Math.round(C.jobPerf)}</span></div>
          <div class="bar"><div class="fill f-happy" style="width:${C.jobPerf}%"></div></div>
          <div class="statrow" style="margin-top:8px"><span class="statname">${d.ico} ${d.name}</span><span class="statval">Tk.${C.jobDev.level}/5</span></div>
          <div class="bar"><div class="fill f-mind" style="width:${C.jobDev.level*20}%"></div></div>
          ${(()=>{const st=typeof currentJobStyle==="function"?currentJobStyle():null;
            return `<div class="statrow" style="margin-top:8px"><span class="statname">🎭 Gaya Kerja</span><span class="statval">${st?st.ico+" "+st.name:"— belum dipilih"}</span></div>
            ${st?`<div style="font-size:9.5px;color:var(--arcane-glow);margin-top:2px">${st.desc}</div>`:""}`;})()}
        </div>
      </div>
      <div class="tiles">
        ${(()=>{const st=typeof currentJobStyle==="function"?currentJobStyle():null;
          return `<div class="tile ${st?'':'arcane'}" onclick="chooseJobStyle(${st?'true':'false'})"><span class="ti">${st?st.ico:"🎭"}</span><span class="tn">${st?"Ganti Gaya Kerja":"Pilih Gaya Kerja!"}</span><span class="td">${st?"ubah arah pengembangan":"tentukan spesialisasi profesimu — gratis"}</span></div>`;})()}
        <div class="tile" onclick="jobWorkHard()"><span class="ti">💪</span><span class="tn">Kerja Keras</span><span class="td">+koin & performa</span></div>
        <div class="tile" onclick="jobTrainDev()"><span class="ti">${d.ico}</span><span class="tn">Latih ${d.name}</span><span class="td">+gaji, promosi & ${STAT_META[d.stat]?STAT_META[d.stat].name:d.stat} · 💰${10+C.jobDev.level*25}</span></div>
        <div class="tile" onclick="jobAskPromotion()"><span class="ti">📈</span><span class="tn">Minta Promosi</span><span class="td">peluang dari performa & keahlian</span></div>
        <div class="tile" onclick="jobOpenListings()"><span class="ti">📋</span><span class="tn">Lowongan Lain</span><span class="td">lirik karir berbeda</span></div>
        <div class="tile fullrow" onclick="quitCareer();renderKarir()"><span class="ti">🚪</span><span class="tn">Berhenti Kerja</span><span class="td">tinggalkan ${car.name}</span></div>
      </div>`;
    }
  }else{
    html+=`<div class="sechead">📋 Lowongan Kerja</div>
      <p style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 10px;line-height:1.5;">Tiap profesi punya jenjang pangkat & <b>keahlian profesinya sendiri</b> untuk dilatih. Stat & ijazah membuka lowongan lebih baik.</p>
      <div class="tiles">`;
    CAREERS.filter(c=>!c.arcane||C.isMage).forEach(c=>{
      const ok=c.req(C);
      html+=`<div class="tile ${ok?'':'locked'} ${c.arcane?'arcane':''}" ${ok?`onclick="applyCareer('${c.id}');renderKarir()"`:''}>
        <span class="ti">${c.ico}</span><span class="tn">${c.name}${c.shady?' 🕶️':''}</span>
        <span class="td">${ok?'Gaji '+c.basepay+'/th · '+c.ranks.length+' jenjang':'🔒 Syarat kurang'}</span></div>`;});
    html+=`</div>`;
  }
  host.innerHTML=html;
}
window.jobWorkHard=function(){
  if(!C.career)return;
  if(!spendAction())return;
  ensureJobState();
  const g=ri(6,14)+C.careerLevel*4;C.coin+=g;
  C.jobPerf=clamp(C.jobPerf+ri(8,15));
  applyStats({happy:-2,health:-1});
  finishAct(`Kau bekerja ekstra keras. +${g} keping & performa naik.`,"e-good");
};
window.jobTrainDev=function(){
  if(!C.career)return;ensureJobState();
  const dev=C.jobDev,d=jobDevOf(C.career);
  if(dev.level>=5){toast(`${d.name} sudah maksimal (Tk.5) — kau pakar sejati.`);return;}
  const cost=10+dev.level*25;
  if(C.coin<cost){toast(`Butuh ${cost} keping untuk pelatihan.`);return;}
  if(!spendAction())return;
  C.coin-=cost;dev.level++;
  applyStats({[d.stat]:+3});C.jobPerf=clamp((C.jobPerf||50)+6);
  finishAct(`${d.ico} ${d.name} naik ke Tingkat ${dev.level}/5! Gaji bonus & peluang promosi meningkat.`,"e-epic");
};
window.jobAskPromotion=function(){
  if(!C.career)return;ensureJobState();
  const car=CAREERS.find(x=>x.id===C.career);if(!car)return;
  if(C.careerLevel>=car.ranks.length-1){toast("Kau sudah di puncak karir ini! 👑");return;}
  if(!spendAction())return;
  const _st=typeof currentJobStyle==="function"?currentJobStyle():null;
  const p=(C.jobPerf||50)/140+(C.jobDev.level*0.06)+(C.stats.charm/400)+(_st&&_st.promo?_st.promo:0);
  if(Math.random()<p){
    C.careerLevel++;C.careerYears=0;C.jobPerf=clamp(C.jobPerf-20);
    finishAct(`📈 Promosi! Kau kini ${car.ranks[C.careerLevel]}.`,"e-epic","win");
  }else{
    C.jobPerf=clamp(C.jobPerf-ri(5,12));
    finishAct("Atasanmu belum terkesan. Naikkan performa & keahlian profesimu dulu.","e-bad");
  }
};
window.jobOpenListings=function(){
  const eligible=CAREERS.filter(c=>(!c.arcane||C.isMage)&&c.id!==C.career);
  openChoice({ico:"📋",prompt:"<b>Lowongan Kerja</b><br><span style='font-size:11px;color:var(--ink-soft);filter:brightness(1.6)'>Pindah karir me-reset jenjang & keahlian profesi.</span>",
    choices:eligible.map(c=>{
      const ok=c.req(C);
      return {label:`${c.ico} ${c.name}${c.shady?' 🕶️':''}`,sub:ok?`Gaji ${c.basepay}/th · ${c.ranks.length} jenjang`:"🔒 syarat kurang",disabled:!ok,
        run:()=>{applyCareer(c.id);setTimeout(()=>{try{renderKarir();}catch(e){}},80);return null;}};
    })});
};
/* ---------- GAYA PROFESI: 1 karir, banyak jalur pengembangan ----------
   Saat mulai kerja, pilih Gaya (spesialisasi). Gaya menentukan bonus
   tahunan, gaji, risiko & peluang promosi — layaknya "fighting style". */
const JOB_CLASS={
  combat:["guard","knight","gladiator","thief","adventurer","captain"],
  arcane:["mage","mageteacher","alchemist","researcher","healer"],
  social:["merchant","bard","politician","diplomat","guildmaster","monarch","scholar"],
  labor:["farmer","blacksmith","cattle","farm"],
};
const JOB_STYLES={
  combat:[
    {id:"striker",ico:"🔥",name:"Penyerang",desc:"Gaji +15% & Kekuatan +2/th, tapi Nyawa -1/th",pay:0.15,stats:{might:2,health:-1}},
    {id:"tank",ico:"🛡️",name:"Benteng",desc:"Nyawa +2/th & performa kerja lebih awet",pay:0,stats:{health:2},perfGuard:true},
    {id:"swift",ico:"⚡",name:"Kilat",desc:"Pesona +1/th",pay:0,stats:{charm:1},bonusAct:true},
  ],
  arcane:[
    {id:"sage",ico:"📘",name:"Cendekia",desc:"Akal +2/th & gaji +10%",pay:0.10,stats:{mind:2}},
    {id:"wild",ico:"⚗️",name:"Eksperimental",desc:"Mana +3/th, tapi eksperimen kadang meledak!",pay:0,stats:{mana:3},risky:true},
    {id:"mentor",ico:"🕯️",name:"Pembimbing",desc:"Pesona +2/th & promosi lebih mudah",pay:0,stats:{charm:2},promo:0.1},
  ],
  social:[
    {id:"charmer",ico:"😊",name:"Karismatik",desc:"Pesona +2/th & promosi lebih mudah",pay:0,stats:{charm:2},promo:0.1},
    {id:"cunning",ico:"🕶️",name:"Licik",desc:"Gaji +20%, tapi reputasi kadang tergores",pay:0.20,stats:{},shady:true},
    {id:"honest",ico:"🤝",name:"Terpercaya",desc:"Reputasi +2/th & Bahagia +1/th",pay:0,stats:{happy:1},rep:2},
  ],
  labor:[
    {id:"hard",ico:"💪",name:"Banteng Kerja",desc:"Gaji +15% & Kekuatan +2/th, Bahagia -1/th",pay:0.15,stats:{might:2,happy:-1}},
    {id:"smart",ico:"🧠",name:"Efisien",desc:"Akal +2/th & performa kerja lebih awet",pay:0,stats:{mind:2},perfGuard:true},
    {id:"zen",ico:"🌿",name:"Seimbang",desc:"Nyawa +1 & Bahagia +2/th",pay:0,stats:{health:1,happy:2}},
  ],
};
function jobClassOf(id){for(const k in JOB_CLASS)if(JOB_CLASS[k].includes(id))return k;return "labor";}
function currentJobStyle(){
  if(!C||!C.career||!C.jobStyle||C.jobStyle.career!==C.career)return null;
  const set=JOB_STYLES[jobClassOf(C.career)]||[];
  return set.find(s=>s.id===C.jobStyle.id)||null;
}
window.chooseJobStyle=function(isChange){
  if(!C.career){toast("Kau belum bekerja.");return;}
  if(isChange&&!spendAction())return;
  const car=CAREERS.find(x=>x.id===C.career);
  const set=JOB_STYLES[jobClassOf(C.career)]||[];
  openChoice({ico:"🎭",cancel:!!isChange,
    prompt:`<b>Pilih Gaya Kerjamu</b> — ${car?car.name:""}<br><span style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6)">Gaya menentukan arah pengembangan: bonus tahunan, gaji & risiko. Bisa diganti nanti.</span>`,
    choices:set.map(s=>({label:`${s.ico} ${s.name}`,sub:s.desc,run:()=>{
      C.jobStyle={career:C.career,id:s.id};
      setTimeout(()=>{try{renderKarir();}catch(e){}},80);
      return{t:`Kau memilih gaya ${s.ico} ${s.name}. Jalan karirmu kini khas milikmu.`,cls:"e-epic"};
    }}))});
};

// integrasi: reset state saat ganti/berhenti kerja, bonus & decay tiap tahun
(function jobHooks(){
  const _acJob=applyCareer;
  applyCareer=function(id){
    const before=C?C.career:null;
    const r=_acJob.apply(this,arguments);
    if(C&&C.career&&C.career!==before){
      C.jobPerf=50;C.jobDev={id:C.career,level:0};C.jobStyle=null;
      setTimeout(()=>{try{chooseJobStyle(false);}catch(e){}},400); // pilih gaya saat mulai
    }
    return r;
  };
  const _pcJob=processCareer;
  processCareer=function(){
    const had=C.career;
    const r=_pcJob.apply(this,arguments);
    if(!had||!C.career)return r;
    ensureJobState();
    const car=CAREERS.find(x=>x.id===C.career);if(!car)return r;
    if(C.jobDev.level>0){
      const bonus=Math.round(car.basepay*0.1*C.jobDev.level);
      C.coin+=bonus;
      log(C.age,`Bonus keahlian ${jobDevOf(C.career).name}: +${bonus} keping.`,"e-good");
    }
    // efek Gaya Profesi tahunan
    const st=currentJobStyle();
    if(st){
      if(st.pay){const p=Math.round(car.basepay*st.pay);C.coin+=p;log(C.age,`Gaya ${st.name}: gaji ekstra +${p}.`,"e-good");}
      if(st.stats)applyStats(st.stats);
      if(st.rep)C.reputation+=st.rep;
      if(st.bonusAct&&typeof grantActionBonus==="function")grantActionBonus(1);
      if(st.risky&&chance(0.15)){applyStats({health:-ri(3,9)});log(C.age,"⚗️ Eksperimenmu meledak! Untung hanya alis yang hangus.","e-bad");}
      if(st.shady&&chance(0.15)){C.reputation-=ri(2,5);log(C.age,"🕶️ Gosip liar soal caramu bekerja menyebar...","e-bad");}
    }
    if((C.jobPerf>=75)&&C.careerLevel<car.ranks.length-1&&(typeof window.promoFocusOK!=="function"||window.promoFocusOK())&&chance(0.3+(st&&st.promo?st.promo:0))){
      C.careerLevel++;C.careerYears=0;C.jobPerf=clamp(C.jobPerf-15);
      log(C.age,`Performamu diakui — promosi jadi ${car.ranks[C.careerLevel]}!`,"e-epic");
    }
    C.jobPerf=clamp(C.jobPerf-((st&&st.perfGuard)?ri(1,3):ri(2,6)));
    return r;
  };
})();
