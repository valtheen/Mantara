// ============================================================
//  TAKDIR — KARIR BARU & LUAS + EVENT KHUSUS KARIR
// ============================================================

// tambahan karir; struktur sama: {id,ico,name,req,basepay,ranks,statGain,arcane?,shady?,
//   careerEvents:[{rank, build()}]}  -- careerEvents opsional, dipicu saat di rank itu
const NEW_CAREERS=[
  // ===== GURU SIHIR (butuh ijazah/mana, mengajar) =====
  {id:"mageteacher",ico:"🧙",name:"Guru Sihir",arcane:true,basepay:58,
    req:c=>c.age>=18&&c.isMage&&c.stats.mana>=50&&(c.flags.diploma_sihir||c.stats.mind>=55),
    ranks:["Asisten Dosen","Guru Sihir","Mahaguru","Rektor Akademi"],statGain:{mana:+2,mind:+3,charm:+1}},
  // ===== GLADIATOR (fisik, arena, risiko cedera) =====
  {id:"gladiator",ico:"🤺",name:"Gladiator",basepay:55,
    req:c=>c.age>=16&&c.stats.might>=55,
    ranks:["Budak Arena","Gladiator","Juara Arena","Legenda Kolosseum"],statGain:{might:+5,health:-2,charm:+1}},
  // ===== POLITIKUS (reputasi & akal) =====
  {id:"politician",ico:"🏛️",name:"Politikus",basepay:70,
    req:c=>c.age>=21&&c.stats.charm>=55&&c.reputation>=20,
    ranks:["Juru Bicara","Anggota Dewan","Menteri","Penasihat Raja"],statGain:{charm:+3,mind:+2}},
  // ===== PENELITI (akal murni) =====
  {id:"researcher",ico:"🔬",name:"Peneliti",basepay:50,
    req:c=>c.age>=18&&c.stats.mind>=60,
    ranks:["Asisten Riset","Peneliti","Ilmuwan","Penemu Agung"],statGain:{mind:+4,mana:+1}},
  // ===== PETUALANG (serba bisa, harta dari quest) =====
  {id:"adventurer",ico:"🗺️",name:"Petualang",basepay:40,
    req:c=>c.age>=16&&(c.stats.might>=45||c.stats.mana>=45),
    ranks:["Pemula","Petualang","Pemburu Harta","Pahlawan Legendaris"],statGain:{might:+2,mana:+1,charm:+1}},
  // ===== PEMIMPIN GUILD (butuh reputasi tinggi) =====
  {id:"guildmaster",ico:"⚜️",name:"Pemimpin Guild",basepay:80,
    req:c=>c.age>=25&&c.reputation>=35&&c.coin>=300,
    ranks:["Anggota Guild","Pengurus","Wakil Ketua","Ketua Guild"],statGain:{charm:+2,mind:+2,might:+1}},
  // ===== DIPLOMAT =====
  {id:"diplomat",ico:"🕊️",name:"Diplomat",basepay:62,
    req:c=>c.age>=20&&c.stats.charm>=58&&c.stats.mind>=45,
    ranks:["Utusan","Diplomat","Duta Besar","Diplomat Agung"],statGain:{charm:+3,mind:+2}},
  // ===== KAPTEN KAPAL (Saltmoor flavor) =====
  {id:"captain",ico:"⚓",name:"Kapten Kapal",basepay:54,
    req:c=>c.age>=18&&c.stats.might>=48&&c.stats.charm>=40,
    ranks:["Awak Kapal","Navigator","Kapten","Laksamana"],statGain:{might:+2,charm:+2,health:-1}},
  // ===== RAJA/RATU (puncak — butuh segalanya) =====
  {id:"monarch",ico:"👑",name:"Raja/Ratu",basepay:200,
    req:c=>c.age>=30&&c.reputation>=70&&c.coin>=2000&&c.stats.charm>=70,
    ranks:["Bangsawan Tinggi","Adipati","Raja/Ratu","Maharaja/Maharani"],statGain:{charm:+4,mind:+3,reputation:+5}},
];

// ---------- daftarkan ke CAREERS ----------
(function registerNewCareers(){
  for(const c of NEW_CAREERS){
    if(!CAREERS.find(x=>x.id===c.id))CAREERS.push(c);
  }
})();

// ---------- EVENT KHUSUS KARIR (dipicu acak saat bekerja di karir tertentu) ----------
// dipanggil dari processCareer wrapper; peluang per tahun
const CAREER_EVENTS={
  gladiator:()=>({ico:"🤺",prompt:`Pertarungan arena besar! Penonton bersorak menanti aksimu.`,
    choices:[
      {label:"Bertarung habis-habisan",sub:"hadiah besar / cedera",run:()=>{if(C.stats.might>60||chance(0.55)){const g=ri(60,150);C.coin+=g;C.reputation+=6;applyStats({might:+3});return{t:`Kau menang telak! Penonton meneriakkan namamu. +${g} keping.`,cls:"e-epic"};}applyStats({health:-ri(15,30)});return{t:"Kau kalah & terluka parah di arena.",cls:"e-bad"};}},
      {label:"Bertarung hati-hati",sub:"aman, hadiah kecil",run:()=>{const g=ri(20,50);C.coin+=g;return{t:`Kau bermain aman & menang tipis. +${g} keping.`,cls:"e-good"};}},
      {label:"Pura-pura cedera",sub:"hindari risiko",run:()=>{C.reputation-=4;return{t:"Kau mundur pura-pura cedera. Penonton mencemooh.",cls:"e-bad"};}},
    ]}),
  mage:()=>({ico:"🔮",prompt:`Raja memintamu melakukan ritual sihir berbahaya untuk kerajaan.`,
    choices:[
      {label:"Lakukan ritual",sub:"Mana besar / risiko",run:()=>{if(C.stats.mana>60||chance(0.5)){applyStats({mana:+8});C.reputation+=8;C.coin+=ri(50,120);return{t:"Ritual sukses! Raja menghadiahimu emas & gelar.",cls:"e-epic"};}applyStats({health:-ri(10,25),mana:-5});return{t:"Ritual gagal & energi liar melukaimu.",cls:"e-bad"};}},
      {label:"Tolak — terlalu bahaya",sub:"reputasi -",run:()=>{C.reputation-=6;return{t:"Kau menolak. Raja kecewa pada penyihirnya.",cls:"e-bad"};}},
    ]}),
  mageteacher:()=>({ico:"🧙",prompt:`Seorang murid berbakat tapi nakal menantang otoritasmu di kelas.`,
    choices:[
      {label:"Bimbing dengan sabar",sub:"relasi + akal",run:()=>{applyStats({mind:+3,charm:+2});const r=addRel("teman",{name:randName(chance(0.5)),bond:ri(40,60)});return{t:`Kau membimbing ${r.name} jadi murid setia.`,cls:"e-good"};}},
      {label:"Hukum tegas",sub:"reputasi naik",run:()=>{C.reputation+=4;applyStats({happy:-2});return{t:"Kau menegakkan disiplin. Murid lain segan padamu.",cls:""};}},
    ]}),
  politician:()=>({ico:"🏛️",prompt:`Ada kesempatan korupsi besar di balik proyek kerajaan.`,
    choices:[
      {label:"Ambil suap diam-diam",sub:"kaya / risiko ketahuan",run:()=>{if(chance(0.6)){const g=ri(100,300);C.coin+=g;return{t:`Suap mengalir ke kantongmu. +${g} keping, tanpa ketahuan.`,cls:""};}C.reputation-=20;C.coin=Math.max(0,C.coin-100);return{t:"Korupsimu terbongkar! Reputasi hancur & kena denda.",cls:"e-bad"};}},
      {label:"Tolak, tetap bersih",sub:"reputasi +",run:()=>{C.reputation+=10;return{t:"Kau menolak suap. Rakyat memujimu sebagai politikus jujur.",cls:"e-epic"};}},
    ]}),
  monarch:()=>({ico:"👑",prompt:`Kerajaan tetangga mengancam perang. Sebagai penguasa, apa keputusanmu?`,
    choices:[
      {label:"Hadapi dengan perang",sub:"Kekuatan menentukan",run:()=>{if(C.stats.might>50||chance(0.5)){C.reputation+=15;C.coin+=ri(200,500);return{t:"Pasukanmu menang! Wilayah & harta bertambah.",cls:"e-epic"};}C.coin=Math.max(0,C.coin-ri(200,400));C.reputation-=10;return{t:"Perang merugikan kerajaanmu.",cls:"e-bad"};}},
      {label:"Diplomasi damai",sub:"Pesona menentukan",run:()=>{if(C.stats.charm>60||chance(0.6)){C.reputation+=10;return{t:"Perjanjian damai tercapai. Rakyat bersyukur.",cls:"e-good"};}C.reputation-=5;return{t:"Diplomasi gagal, ketegangan berlanjut.",cls:"e-bad"};}},
      {label:"Bayar upeti",sub:"koin - tapi aman",run:()=>{C.coin=Math.max(0,C.coin-ri(150,300));return{t:"Kau membayar upeti demi perdamaian. Mahal tapi aman.",cls:""};}},
    ]}),
  adventurer:()=>({ico:"🗺️",prompt:`Peta tua menuntunmu ke sarang naga berisi harta legendaris.`,
    choices:[
      {label:"Masuki sarang naga",sub:"harta besar / maut",run:()=>{if(C.stats.might>60||C.stats.mana>60||chance(0.4)){const g=ri(200,500);C.coin+=g;C.reputation+=12;return{t:`Kau mengalahkan sang naga! Harta ${g} keping jadi milikmu.`,cls:"e-epic"};}applyStats({health:-ri(30,60)});return{t:"Naga nyaris membakarmu hidup-hidup. Kau kabur terluka.",cls:"e-bad"};}},
      {label:"Curi diam-diam",sub:"Akal menentukan",run:()=>{if(C.stats.mind>55||chance(0.5)){const g=ri(80,200);C.coin+=g;return{t:`Kau menyelinap & mencuri ${g} keping tanpa membangunkan naga!`,cls:"e-good"};}applyStats({health:-ri(15,35)});return{t:"Kau terbangun naga & nyaris tewas.",cls:"e-bad"};}},
      {label:"Mundur",sub:"aman",run:()=>{return{t:"Kau memilih hidup. Harta itu terlalu berbahaya.",cls:""};}},
    ]}),
  thief:()=>({ico:"🗝️",prompt:`Kesempatan merampok rumah saudagar kaya yang sedang kosong.`,
    choices:[
      {label:"Rampok!",sub:"untung / penjara",run:()=>{if(C.stats.might>40||chance(0.6)){const g=ri(80,250);C.coin+=g;return{t:`Rampokan sukses! +${g} keping tanpa jejak.`,cls:""};}C.reputation-=15;applyStats({happy:-10});return{t:"Kau tertangkap & dipenjara! Reputasi anjlok.",cls:"e-bad"};}},
      {label:"Batalkan",sub:"aman",run:()=>{return{t:"Nuranimu menang. Kau pergi tanpa mencuri.",cls:"e-good"};}},
    ]}),
};

// ============================================================
//  PATCH — Career Events + Encounter System
// ============================================================

// ---------- picu career event saat processCareer ----------
const _car_prevProcessCareer=processCareer;
processCareer=function(){
  _car_prevProcessCareer();
  // peluang event khusus karir ~25%/tahun kalau punya karir & ada eventnya
  if(C.career&&CAREER_EVENTS[C.career]&&chance(0.25)){
    C._careerEventPending=C.career;
  }
};

// ---------- jalankan career event setelah advanceYear (di-queue) ----------
const _car_prevAdvance=advanceYear;
advanceYear=function(){
  C._careerEventPending=null;
  _car_prevAdvance.call(this);
  if(C&&C.alive&&C._careerEventPending&&!pendingChoice){
    const ev=CAREER_EVENTS[C._careerEventPending];C._careerEventPending=null;
    if(ev){snapStats&&snapStats();
      const data=ev();
      openChoice({ico:data.ico,prompt:data.prompt,cancel:false,choices:data.choices});}
  }
};

// kalau ada modal lain, jalankan setelah ditutup
const _car_prevClose=closeModal;
closeModal=function(){
  _car_prevClose();
  if(C&&C.alive&&C._careerEventPending&&!pendingChoice){
    const id=C._careerEventPending;C._careerEventPending=null;
    const ev=CAREER_EVENTS[id];
    if(ev)setTimeout(()=>{if(C.alive&&!pendingChoice){snapStats&&snapStats();const data=ev();
      openChoice({ico:data.ico,prompt:data.prompt,cancel:false,choices:data.choices});}},220);
  }
};

// ============================================================
//  ENCOUNTER SYSTEM — ketemu karakter beda latar belakang
// ============================================================
// tiap tipe punya latar; encounter mempertemukan 2 latar berbeda dgn dinamika unik
const ENCOUNTER_TYPES=[
  {bg:"penyihir",ico:"🧙",jobs:["Penyihir","Murid Akademi","Peramal"]},
  {bg:"bangsawan",ico:"👑",jobs:["Bangsawan","Pewaris","Adipati"]},
  {bg:"saudagar",ico:"💰",jobs:["Saudagar","Pedagang","Rentenir"]},
  {bg:"gladiator",ico:"🤺",jobs:["Gladiator","Petarung","Juara Arena"]},
  {bg:"kriminal",ico:"🗡️",jobs:["Pencuri","Penyelundup","Bandit"]},
  {bg:"diplomat",ico:"🕊️",jobs:["Diplomat","Utusan","Duta"]},
  {bg:"petualang",ico:"🗺️",jobs:["Petualang","Pemburu Harta","Penjelajah"]},
  {bg:"raja",ico:"👑",jobs:["Bangsawan Tinggi","Penasihat Raja"]},
];

// latar belakang pemain (dari origin/karir)
function myBackground(){
  if(C.career){
    const map={mage:"penyihir",mageteacher:"penyihir",knight:"bangsawan",merchant:"saudagar",
      gladiator:"gladiator",thief:"kriminal",diplomat:"diplomat",adventurer:"petualang",
      monarch:"raja",politician:"bangsawan"};
    if(map[C.career])return map[C.career];
  }
  const omap={mageborn:"penyihir",noble:"bangsawan",merchant_kid:"saudagar",orphan:"kriminal",peasant:"petualang"};
  return omap[C.origin]||"petualang";
}

// dinamika antar latar: pasangan latar -> teks pembuka & efek
function encounterDynamic(myBg,theirBg){
  const key=[myBg,theirBg].sort().join("+");
  const dyn={
    "bangsawan+penyihir":"Bangsawan & penyihir — perpaduan kuasa & misteri.",
    "bangsawan+saudagar":"Bangsawan & saudagar saling membutuhkan: gengsi & emas.",
    "gladiator+kriminal":"Gladiator & kriminal — dunia keras saling mengenali.",
    "diplomat+raja":"Diplomat menghadap petinggi kerajaan.",
    "penyihir+saudagar":"Penyihir & saudagar menawar jasa sihir.",
    "petualang+saudagar":"Petualang menjual hasil jelajah ke saudagar.",
  };
  return dyn[key]||`Pertemuan ${myBg} dengan ${theirBg} memicu percakapan menarik.`;
}

// buka encounter (dipanggil dari aktivitas sosial / kedai / jalan-jalan)
function openEncounter(){
  const myBg=myBackground();
  // pilih latar lawan yg BERBEDA
  let pool=ENCOUNTER_TYPES.filter(t=>t.bg!==myBg);
  const them=rand(pool);
  const female=chance(0.5);
  const nm=randName(female);
  const job=rand(them.jobs);
  const dyn=encounterDynamic(myBg,them.bg);
  snapStats&&snapStats();
  openChoice({ico:them.ico,prompt:`Kau bertemu <b>${nm}</b>, seorang ${job}.<br><span style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6)">${dyn}</span>`,
    cancel:true,
    choices:[
      {label:"🤝 Berkenalan",sub:"jadikan relasi",run:()=>{
        const r=addRel("teman",{name:nm,female,bond:ri(35,55)});
        // simpan latar utk profil
        if(typeof ensureProfile==="function"){const p=ensureProfile(r);p.job=job;p.background=them.bg;}
        applyStats({charm:+1,happy:+3});
        return{t:`Kau berkenalan dengan ${nm} sang ${job}.`,cls:"e-good"};}},
      {label:"💼 Tawar kerja sama",sub:"untung bila cocok",run:()=>{
        if(C.stats.charm>45||chance(0.5)){const g=ri(30,90);C.coin+=g;C.reputation+=3;
          return{t:`Kerja sama dengan ${nm} membuahkan +${g} keping.`,cls:"e-good"};}
        return{t:`${nm} menolak tawaranmu dengan sopan.`,cls:""};}},
      {label:"⚔️ Tantang/uji",sub:`adu ${them.bg==='gladiator'||them.bg==='kriminal'?'kekuatan':'kecerdasan'}`,run:()=>{
        const useStat=them.bg==='gladiator'||them.bg==='kriminal'?C.stats.might:C.stats.mind;
        if(useStat>50||chance(0.5)){C.reputation+=5;applyStats({happy:+4});
          return{t:`Kau unggul dalam adu melawan ${nm}! Reputasi naik.`,cls:"e-good"};}
        applyStats({happy:-3});return{t:`${nm} mengalahkanmu. Kau belajar dari kekalahan.`,cls:"e-bad"};}},
    ]});
}

// ---------- sambungkan encounter ke aktivitas: tambah ke kedai & aktivitas umum ----------
// (kedai sudah ada "cari kenalan"; encounter lebih kaya. Tambah aktivitas "Berkelana sosial")
if(typeof ACTIVITIES!=="undefined"&&!ACTIVITIES.find(a=>a.id==="encounter")){
  ACTIVITIES.push({id:"encounter",ico:"👥",name:"Berbaur & Berkenalan",
    desc:"Temui tokoh dari latar belakang lain",cond:c=>c.age>=13});
}
// ACT_MIN_AGE utk encounter
if(typeof ACT_MIN_AGE!=="undefined")ACT_MIN_AGE.encounter=13;

// hook: openSubs('encounter') -> openEncounter
const _enc_prevOpenSubs=openSubs;
openSubs=function(actId){
  if(actId==="encounter"){
    if(C.age<13){toast("Terlalu muda untuk berbaur sendiri.");return;}
    if(!spendAction()){toast("Aksi habis.");return;}
    recordActivity&&recordActivity("Berbaur & Berkenalan",()=>{if(spendAction()){snapStats&&snapStats();openEncounter();}});
    snapStats&&snapStats();
    openEncounter();
    return;
  }
  _enc_prevOpenSubs(actId);
};
