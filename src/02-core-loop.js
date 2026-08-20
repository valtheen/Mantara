// ============================================================
//  TAKDIR v3 — Engine (bagian 3: core loop)
// ============================================================
function updateTitle(){
  if(!C.alive){C.title="Mendiang";return;}
  if(C.career){const car=CAREERS.find(x=>x.id===C.career);if(car){C.title=car.ranks[C.careerLevel];return;}}
  const s=C.stats;
  if(C.isMage&&s.mana>=85)C.title="Archmage Agung";
  else if(s.might>=85&&C.reputation>=40)C.title="Ksatria Agung";
  else if(s.charm>=80&&C.reputation>=40)C.title=C.female?"Bangsawati":"Bangsawan";
  else if(C.businesses.length>=3)C.title="Taipan";
  else if(C.isMage&&C.age>=16)C.title="Penyihir";
  else if(C.age>=18)C.title=C.female?"Wanita Biasa":"Rakyat Jelata";
  else if(C.age>=13)C.title="Remaja";
  else C.title="Bocah";
}

function processBusinesses(){
  C.businesses.forEach(b=>{
    const def=BUSINESS_TYPES.find(x=>x.id===b.id);if(!def)return;
    let inc=def.income[b.level];
    // risk event
    if(chance(0.15)){inc=Math.round(inc*0.3);C._bizRisk=`${def.name} terkena masalah tahun ini (income turun).`;}
    C.coin+=inc;b._lastIncome=inc;
  });
}

function processCareer(){
  if(!C.career)return;
  const car=CAREERS.find(x=>x.id===C.career);if(!car)return;
  const pay=Math.round(car.basepay+C.careerLevel*car.basepay*0.8);
  C.coin+=pay;applyStats(car.statGain);C.careerYears++;
  if(C.careerYears>=3&&C.careerLevel<car.ranks.length-1&&chance(0.5)){
    C.careerLevel++;C.careerYears=0;
    log(C.age,`Kau dipromosikan jadi ${car.ranks[C.careerLevel]}!`,"e-epic");
  }
}

// ---------- EVENTS ----------
const EVENTS=[
  {id:"plague",minAge:5,maxAge:80,w:2,cond:c=>!c.flags.plagueImmune,auto:()=>{
    if(C.stats.health>50||chance(0.6)){C.flags.plagueImmune=1;applyStats({health:-15,happy:-8});
      return{t:"Wabah Hitam melanda! Kau selamat & kini kebal.",cls:"e-bad"};}
    applyStats({health:-55});return{t:"Wabah Hitam menggerogoti tubuhmu...",cls:"e-death"};}},
  {id:"war",minAge:18,maxAge:55,w:2,choice:()=>({ico:"⚔️",
    prompt:"Perang pecah! Kerajaan memanggil yang tangguh ke medan tempur.",
    choices:[
      {label:"Maju berperang",hint:"Bahaya besar, hadiah besar",run:()=>{
        if((C.stats.might+C.stats.mana)>90||chance(0.5)){applyStats({might:+15,happy:+8});C.coin+=ri(60,150);C.reputation+=15;
          return{t:"Kau pulang sebagai pahlawan perang!",cls:"e-epic"};}
        applyStats({health:-45,happy:-10});return{t:"Medan perang brutal. Kau pulang terluka.",cls:"e-bad"};}},
      {label:"Hindari wajib militer",hint:"Selamat tapi tercela",run:()=>{applyStats({happy:-15});C.reputation-=20;
        return{t:"Kau bersembunyi. Orang memandangmu pengecut.",cls:"e-bad"};}},
    ]})},
  {id:"magic_spark",minAge:6,maxAge:14,w:2,cond:c=>!c.isMage&&c.stats.mind>45,choice:()=>({ico:"✨",
    prompt:"Jarimu memercikkan cahaya aneh! Sihir terbangun.",
    choices:[
      {label:"Latih diam-diam",hint:"Jadi penyihir, berisiko",run:()=>{C.isMage=true;applyStats({mana:+30,mind:+10,happy:-5});
        return{t:"Darah arcane terbangun. Kau kini penyihir!",cls:"e-arcane"};}},
      {label:"Sembunyikan",hint:"Aman",run:()=>{applyStats({happy:-8,mind:+5});
        return{t:"Kau menekan bakat itu karena takut Inkuisisi.",cls:"e-bad"};}},
    ]})},
  // ---- ketemu orang (mudah, dari event) ----
  {id:"meet_friend",minAge:5,maxAge:75,w:3,auto:()=>{const r=addRel("teman",{bond:ri(40,60)});
    return{t:`Kau bertemu ${r.name} (${r.trait}). Pertemanan baru terjalin.`,cls:"e-good"};}},
  {id:"meet_love",minAge:14,maxAge:55,w:2,cond:c=>!c.married,auto:()=>{const r=addRel("teman",{bond:ri(50,70),female:!C.female});
    return{t:`Kau berjumpa ${r.name} yang menawan. Mungkin awal sebuah cinta? (lihat tab Relasi)`,cls:"e-good"};}},
  {id:"rival",minAge:12,maxAge:70,w:1,auto:()=>{const r=addRel("musuh",{bond:ri(10,25)});
    return{t:`${r.name} menjadi rival yang membencimu.`,cls:"e-bad"};}},
  {id:"old_friend",minAge:25,maxAge:75,w:1,cond:c=>c.relations.length>0,auto:()=>{const r=rand(C.relations);r.bond=clamp(r.bond+ri(8,18));
    return{t:`Kau bertemu kembali ${r.name}. Hubungan menghangat.`,cls:"e-good"};}},
  // ---- fortune (dari mana saja) ----
  {id:"treasure",minAge:10,maxAge:75,w:1,auto:()=>{const g=ri(30,90);C.coin+=g;applyStats({happy:+6});
    return{t:`Kau menemukan peti harta terkubur! +${g} keping.`,cls:"e-epic"};}},
  {id:"lottery",minAge:16,maxAge:75,w:1,auto:()=>{if(chance(0.4)){const g=ri(50,200);C.coin+=g;return{t:`Keberuntungan! Undian kerajaan memberimu ${g} keping.`,cls:"e-epic"};}C.coin=Math.max(0,C.coin-ri(5,20));return{t:"Kau membeli tiket undian, tapi kalah.",cls:"e-bad"};}},
  {id:"inheritance",minAge:18,maxAge:60,w:1,cond:c=>c.relations.some(r=>r.role==="keluarga"&&!r.isChild),auto:()=>{
    const g=ri(40,120);C.coin+=g;return{t:`Kerabat tua mewariskan ${g} keping padamu.`,cls:"e-good"};}},
  {id:"benefactor",minAge:10,maxAge:70,w:1,auto:()=>{const g=ri(20,60);C.coin+=g;applyStats({happy:+4});
    return{t:`Orang asing dermawan memberimu ${g} keping.`,cls:"e-good"};}},
  {id:"festival",minAge:5,maxAge:80,w:2,auto:()=>{applyStats({happy:+10});
    return{t:"Festival kerajaan! Kau menari hingga larut.",cls:"e-good"};}},
  {id:"sick",minAge:1,maxAge:80,w:2,auto:()=>{const d=ri(6,16);applyStats({health:-d});
    return{t:`Penyakit menyerang di musim dingin. Nyawa -${d}. (berobat di Hospice)`,cls:"e-bad"};}},
  {id:"injury",minAge:10,maxAge:70,w:1,auto:()=>{const d=ri(8,20);applyStats({health:-d});
    return{t:`Kau cedera dalam kecelakaan. Nyawa -${d}.`,cls:"e-bad"};}},
  // ---- pertengahan hidup & keluarga (30-60) ----
  {id:"midlife_doubt",minAge:30,maxAge:58,w:2,choice:()=>({ico:"🌓",
    prompt:"Di pertengahan hidup, kau mempertanyakan jalan yang kau tempuh.",
    choices:[
      {label:"Ubah hidup — cari makna baru",hint:"Bahagia +",run:()=>{applyStats({happy:+ri(6,12),mind:+4});if(chance(0.4))C.reputation-=5;return{t:"Kau mengubah arah hidup. Jiwa lebih ringan.",cls:"e-good"};}},
      {label:"Gali lebih dalam karirmu",hint:"stat karir +",run:()=>{const car=C.career?CAREERS.find(x=>x.id===C.career):null;if(car&&car.statGain)applyStats(car.statGain);else applyStats({mind:+5});return{t:"Kau memperdalam keahlian. Fokus membawa hasil.",cls:"e-good"};}},
      {label:"Abaikan — lanjutkan rutinitas",hint:"aman",run:()=>{applyStats({happy:-4});return{t:"Keraguan itu kau kubur dalam rutinitas.",cls:""};}},
    ]})},
  {id:"child_pride",minAge:25,maxAge:65,w:2,cond:c=>c.relations.some(r=>r.isChild),auto:()=>{const ch=rand(C.relations.filter(r=>r.isChild));ch.bond=clamp(ch.bond+ri(5,12));applyStats({happy:+8});return{t:`${ch.name} membuatmu bangga tahun ini. Ikatan keluarga menguat.`,cls:"e-good"};}},
  {id:"marriage_strain",minAge:20,maxAge:70,w:2,cond:c=>c.married,choice:()=>{const p=C.relations.find(r=>r.role==="pasangan");return {ico:"💔",
    prompt:`Hubungan dengan ${p?p.name:"pasanganmu"} sedang renggang.`,
    choices:[
      {label:"Ajak bicara jujur",hint:"ikatan +",run:()=>{if(p)p.bond=clamp(p.bond+ri(6,14));applyStats({happy:+5});return{t:"Percakapan panjang memulihkan kepercayaan.",cls:"e-good"};}},
      {label:"Beri hadiah & hadirkan diri",hint:"koin -, ikatan +",run:()=>{const cost=ri(15,40);if(C.coin<cost)return{t:"Kau tak punya cukup koin untuk hadiah.",cls:"e-bad"};C.coin-=cost;if(p)p.bond=clamp(p.bond+ri(8,16));applyStats({happy:+6});return{t:`Hadiah menyelamatkan suasana. (-${cost} keping)`,cls:"e-good"};}},
      {label:"Abaikan — fokus diri sendiri",hint:"ikatan -",run:()=>{if(p)p.bond=clamp(p.bond-ri(10,20));applyStats({happy:-6});return{t:"Diam bukan solusi. Pasanganmu makin jauh.",cls:"e-bad"};}},
    ]};}},
  {id:"promotion_chance",minAge:18,maxAge:60,w:2,cond:c=>{if(!c.career)return false;const car=CAREERS.find(x=>x.id===c.career);return car&&c.careerLevel<car.ranks.length-1;},choice:()=>{const car=CAREERS.find(x=>x.id===C.career);return {ico:"📈",
    prompt:`Atasan menawarkan promosi jadi ${car.ranks[car.careerLevel+1]}.`,
    choices:[
      {label:"Terima tantangan",hint:"promosi jika berhasil",run:()=>{if(C.stats.mind>45||C.stats.charm>45||chance(0.55)){C.careerLevel++;C.careerYears=0;C.reputation+=5;return{t:`Kau dipromosikan jadi ${car.ranks[C.careerLevel]}!`,cls:"e-epic"};}C.reputation-=3;return{t:"Usahamu gagal. Promosi ditunda.",cls:"e-bad"};}},
      {label:"Tolak — belum siap",hint:"aman",run:()=>{applyStats({happy:+2});return{t:"Kau menolak halus. Kesempatan itu berlalu.",cls:""};}},
    ]};}},
  {id:"biz_boom",minAge:20,maxAge:70,w:1,cond:c=>c.businesses.length>0,auto:()=>{const b=rand(C.businesses);const def=BUSINESS_TYPES.find(x=>x.id===b.id);const bonus=Math.round(def.income[b.level]*0.5);C.coin+=bonus;applyStats({happy:+4});return{t:`${def.name} untung besar! +${bonus} keping ekstra.`,cls:"e-good"};}},
  {id:"royal_decree",minAge:25,maxAge:75,w:1,cond:c=>c.reputation>=35,choice:()=>({ico:"📜",
    prompt:"Raja mengeluarkan dekrit. Bangsawan setia bisa menikmati hadiah.",
    choices:[
      {label:"Hadiri upacara istana",hint:"reputasi +, koin +",run:()=>{C.reputation+=ri(5,12);C.coin+=ri(30,80);applyStats({charm:+3});return{t:"Kau dihormati di hadapan istana.",cls:"e-epic"};}},
      {label:"Kirim utusan saja",hint:"lebih murah",run:()=>{C.coin-=ri(10,25);C.reputation+=ri(2,6);return{t:"Utusanmu mewakili namamu dengan cukup baik.",cls:"e-good"};}},
      {label:"Abaikan",hint:"reputasi -",run:()=>{C.reputation-=ri(5,10);return{t:"Mengabaikan dekrit dicatat sebagai ketidakhormatan.",cls:"e-bad"};}},
    ]})},
  {id:"mage_council",minAge:20,maxAge:75,w:1,cond:c=>c.isMage&&c.stats.mana>=50,choice:()=>({ico:"🔮",
    prompt:"Majelis Arcane mengundangmu. Ujian ini bisa mengangkat atau merendahkan namamu.",
    choices:[
      {label:"Tampilkan kekuatan",hint:"mana +, reputasi +",run:()=>{if(C.stats.mana>65||chance(0.5)){applyStats({mana:+ri(5,10)});C.reputation+=10;return{t:"Para penyihir tercengang. Namamu disebut di majelis.",cls:"e-arcane"};}applyStats({happy:-5});C.reputation-=5;return{t:"Ritualmu gagal di depan umum. Malu.",cls:"e-bad"};}},
      {label:"Menolak undangan",hint:"aman",run:()=>({t:"Kau menghindari sorotan majelis.",cls:""})},
    ]})},
  {id:"bandit_raid",minAge:14,maxAge:70,w:2,auto:()=>{if(C.stats.might>55&&chance(0.6)){C.reputation+=5;applyStats({might:+2});return{t:"Bandit menyerang, tetapi kau mengusir mereka!",cls:"e-good"};}const loss=Math.min(C.coin,ri(20,60));C.coin-=loss;applyStats({health:-ri(5,15),happy:-4});return{t:`Bandit merampokmu! -${loss} keping & luka.`,cls:"e-bad"};}},
  {id:"good_harvest",minAge:16,maxAge:75,w:2,cond:c=>c.career==="farmer"||c.businesses.some(b=>b.id==="farm"||b.id==="cattle"),auto:()=>{const g=ri(25,70);C.coin+=g;applyStats({happy:+5});return{t:`Musim panen melimpah! +${g} keping.`,cls:"e-good"};}},
  {id:"bad_season",minAge:16,maxAge:75,w:1,cond:c=>c.career==="farmer"||c.businesses.some(b=>b.id==="farm"||b.id==="cattle"),auto:()=>{const loss=Math.min(C.coin,ri(15,45));C.coin-=loss;applyStats({happy:-6});return{t:`Musim buruk! Kerugian ${loss} keping.`,cls:"e-bad"};}},
  {id:"destitute",minAge:16,maxAge:75,w:2,cond:c=>c.age>=16&&c.coin<=8,choice:()=>({ico:"🍞",
    prompt:"Kantongmu hampir kosong. Keputusan sulit menanti.",
    choices:[
      {label:"Minta sedekah di pasar",hint:"malu tapi bertahan",run:()=>{const g=ri(8,25);C.coin+=g;C.reputation-=ri(2,6);applyStats({happy:-5});return{t:`Kau mendapat ${g} keping, tapi harga diri terluka.`,cls:"e-bad"};}},
      {label:"Kerja keras serabutan",hint:"koin +, nyawa -",run:()=>{const g=ri(15,40);C.coin+=g;applyStats({health:-ri(4,10),might:+2});return{t:`Kau bertahan dengan kerja berat. +${g} keping.`,cls:""};}},
      {label:"Mencuri diam-diam",hint:"risiko",run:()=>{if(chance(0.55)){const g=ri(20,50);C.coin+=g;return{t:`Kau mencuri ${g} keping tanpa ketahuan.`,cls:""};}C.reputation-=8;applyStats({happy:-8});return{t:"Ketangkap! Namamu ternoda.",cls:"e-bad"};}},
    ]})},
  {id:"wise_elder",minAge:18,maxAge:70,w:2,auto:()=>{applyStats({mind:+ri(4,8),happy:+3});return{t:"Tetua berbagi kebijaksanaan. Akal bertambah.",cls:"e-good"};}},
  {id:"gossip",minAge:14,maxAge:75,w:2,auto:()=>{if(chance(0.5)){applyStats({charm:+3,happy:+2});return{t:"Gosip hangat membuatmu dikenal lebih ramah.",cls:"e-good"};}C.reputation-=ri(3,8);applyStats({happy:-4});return{t:"Gosip jahat menyebar tentangmu. Reputasi turun.",cls:"e-bad"};}},
  {id:"pilgrimage",minAge:18,maxAge:80,w:1,choice:()=>({ico:"🕯️",
    prompt:"Kafilah ziarah melewati kotamu. Ikut perjalanan spiritual?",
    choices:[
      {label:"Ikut (biaya sedikit)",hint:"happy +, nyawa +",run:()=>{const cost=ri(10,30);if(C.coin<cost){applyStats({happy:+3});return{t:"Kau ikut sebentar tanpa donasi besar. Hati tenang.",cls:"e-good"};}C.coin-=cost;applyStats({happy:+ri(6,12),health:+ri(3,8)});return{t:"Perjalanan ziarah memurnikan jiwamu.",cls:"e-good"};}},
      {label:"Tidak ikut",hint:"—",run:()=>({t:"Kau memilih tinggal. Hari berlalu biasa saja.",cls:""})},
    ]})},
  {id:"apprentice_offer",minAge:16,maxAge:45,w:1,cond:c=>!c.career&&c.age>=MIN_WORK_AGE,choice:()=>({ico:"🛠️",
    prompt:"Seorang master mengajakmu menjadi murid. Mau belajar profesi baru?",
    choices:[
      {label:"Murid pandai besi",hint:"karir blacksmith",run:()=>{const car=CAREERS.find(x=>x.id==="blacksmith");if(car&&car.req(C)){applyCareer("blacksmith");return{t:"Kau mulai magang di tempa besi!",cls:"e-good"};}applyStats({might:+4});return{t:"Magang singkat mengasah kekuatanmu.",cls:"e-good"};}},
      {label:"Murid tabib",hint:"karir healer",run:()=>{const car=CAREERS.find(x=>x.id==="healer");if(car&&car.req(C)){applyCareer("healer");return{t:"Kau mulai belajar ilmu pengobatan!",cls:"e-good"};}applyStats({mind:+4});return{t:"Kau belajar dasar-dasar pengobatan.",cls:"e-good"};}},
      {label:"Tolak",hint:"—",run:()=>({t:"Kau menolak. Jalan lain menantimu.",cls:""})},
    ]})},
  {id:"mentor_visit",minAge:22,maxAge:55,w:1,cond:c=>c.relations.some(r=>r.role==="keluarga"&&!r.isChild),auto:()=>{const fam=rand(C.relations.filter(r=>r.role==="keluarga"&&!r.isChild));fam.bond=clamp(fam.bond+ri(5,10));applyStats({mind:+3,happy:+4});return{t:`${fam.name} mengunjungimu & memberi nasihat berharga.`,cls:"e-good"};}},
  {id:"fire_disaster",minAge:12,maxAge:80,w:1,auto:()=>{if(C.properties.length&&chance(0.4)){const lost=C.properties.pop();const def=PROPERTY_CATALOG.find(x=>x.key===lost.key);applyStats({happy:-10});return{t:`Kebakaran menghanguskan ${def?def.name:"propertimu"}!`,cls:"e-bad"};}const loss=Math.min(C.coin,ri(10,35));C.coin-=loss;applyStats({happy:-5});return{t:`Kebakaran kecil merugikanmu ${loss} keping.`,cls:"e-bad"};}},
];

// ---------- MISSIONS ----------
const MISSION_POOL=[
  {id:"rich",title:"Sang Hartawan",desc:"Kumpulkan 1000 keping emas.",check:c=>c.coin>=1000,reward:()=>{C.reputation+=15;return "Reputasi +15";}},
  {id:"married",title:"Ikatan Suci",desc:"Menikahlah dengan seseorang.",check:c=>c.married,reward:()=>{applyStats({happy:+15});return "Bahagia +15";}},
  {id:"knight",title:"Jalan Ksatria",desc:"Capai Kekuatan 80.",check:c=>c.stats.might>=80,reward:()=>{C.coin+=200;return "+200 keping";}},
  {id:"castle",title:"Tuan Tanah",desc:"Miliki Kastil Pribadi.",check:c=>c.properties&&c.properties.some(p=>p.key==="castle"),reward:()=>{C.reputation+=25;return "Reputasi +25";}},
  {id:"social",title:"Pusat Perhatian",desc:"Punya 5 relasi sekaligus.",check:c=>c.relations.length>=5,reward:()=>{applyStats({charm:+10});return "Pesona +10";}},
  {id:"tycoon",title:"Sang Taipan",desc:"Miliki 3 bisnis.",check:c=>c.businesses.length>=3,reward:()=>{C.coin+=300;return "+300 keping";}},
  {id:"explorer",title:"Penjelajah",desc:"Kunjungi semua 4 kota.",check:c=>{const seen=new Set([...(c._visited||[]),c.cityId,c.homeCityId].filter(Boolean));return typeof CITIES!=="undefined"&&CITIES.every(ct=>seen.has(ct.id));},reward:()=>{C.reputation+=20;return "Reputasi +20";}},
];
function initMissions(){C.missions=MISSION_POOL.map(m=>({id:m.id,done:false}));}
function checkMissions(){
  C.missions.forEach(ms=>{
    if(ms.done)return;const def=MISSION_POOL.find(m=>m.id===ms.id);
    if(def&&def.check(C)){ms.done=true;const rw=def.reward();
      log(C.age,`🏆 Misi selesai: ${def.title}! (${rw})`,"e-epic");}
  });
}
