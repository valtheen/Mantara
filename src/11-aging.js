// ============================================================
//  TAKDIR — AGING EVENTS (event tak terduga tiap tambah umur)
// ============================================================
// tiap event: {id, min, max, once, cond, build()->{ico,prompt,choices}}
// choices: {label, sub, run()->{t,cls}}  (run boleh ubah stats/relasi/aset)
// once=true: hanya sekali seumur hidup

const AGING_EVENTS=[
  // ---------- BAYI / BALITA ----------
  {id:"baptism",min:0,max:1,once:true,build:()=>({ico:"⛪",
    prompt:`Hari pembaptisanmu di kuil. Pendeta mengangkatmu tinggi di hadapan keluarga. Apa yang kau lakukan sebagai bayi?`,
    choices:[
      {label:"Menangis kencang",sub:"semua tertawa haru",run:()=>{applyStats({happy:+3});return{t:"Tangismu menggema — pertanda jiwa yang kuat, kata para tetua.",cls:"e-good"};}},
      {label:"Menggigit jari pendeta",sub:"kacau tapi lucu",run:()=>{applyStats({might:+2,happy:+2});return{t:"Kau menggigit jari pendeta! Keluarga malu tapi tertawa. Pertanda pemberani.",cls:"e-good"};}},
      {label:"Tertawa riang",sub:"dianggap berkah",run:()=>{applyStats({charm:+3});return{t:"Tawamu membuat seisi kuil terpesona. Konon pertanda pesona alami.",cls:"e-good"};}},
      {label:"Tertidur pulas",sub:"tenang",run:()=>{applyStats({health:+3});return{t:"Kau tidur nyenyak sepanjang upacara. Bayi yang damai.",cls:"e-good"};}},
    ]})},
  {id:"first_word",min:1,max:3,once:true,build:()=>({ico:"👶",
    prompt:`Kau mulai bisa bicara! Kata pertama apa yang keluar dari mulutmu?`,
    choices:[
      {label:'"Mama/Papa"',sub:"keluarga terharu",run:()=>{const fam=C.relations.filter(r=>r.role==="keluarga");fam.forEach(r=>r.bond=clamp(r.bond+ri(4,8)));applyStats({happy:+4});return{t:"Orang tuamu menangis bahagia. Ikatan keluarga menguat.",cls:"e-good"};}},
      {label:'"Emas!"',sub:"pertanda saudagar?",run:()=>{applyStats({mind:+3});return{t:"Kata pertamamu 'emas'! Para tetangga bercanda kau akan jadi saudagar kaya.",cls:"e-good"};}},
      {label:'Mantra acak',sub:"aneh & magis",run:()=>{applyStats({mana:+4});return{t:"Kau menggumamkan kata yang tak dikenal — beraura arcane. Pertanda bakat sihir?",cls:"e-arcane"};}},
    ]})},
  // ---------- ANAK ----------
  {id:"peer_friend",min:5,max:11,cond:c=>true,build:()=>{const female=chance(0.5);const nm=randName(female);const npc={id:"anak-"+Math.random().toString(36).slice(2,8),name:nm,female,role:"teman",age:C.age};
    return {ico:"🧒",_npc:npc,
    prompt:`Seorang anak sebaya bernama <b>${nm}</b> mengajakmu berteman di alun-alun.`,
    choices:[
      {label:"Terima pertemanan",sub:"dapat teman baru",run:()=>{const r=addRel("teman",{id:npc.id,name:nm,female,bond:ri(45,65),appearance:npc.appearance});r.ageOffset=0;applyStats({happy:+5});return{t:`Kau & ${nm} kini berteman akrab.`,cls:"e-good"};}},
      {label:"Tolak — pemalu",sub:"Bahagia -",run:()=>{applyStats({happy:-4,mind:+1});return{t:`Kau menolak dengan malu. ${nm} pergi kecewa.`,cls:"e-bad"};}},
      {label:"Ajak berkelahi dulu",sub:"uji nyali",run:()=>{if(chance(0.5)){const r=addRel("teman",{id:npc.id,name:nm,female,bond:ri(50,70),appearance:npc.appearance});r.ageOffset=0;applyStats({might:+2});return{t:`Kalian berkelahi lalu malah jadi sahabat! Khas anak-anak.`,cls:"e-good"};}const r=addRel("musuh",{id:npc.id,name:nm,female,bond:ri(15,30),appearance:npc.appearance});r.ageOffset=0;return{t:`Perkelahian bikin ${nm} membencimu sejak kecil.`,cls:"e-bad"};}},
    ]};}},
  {id:"school_bully",min:7,max:13,cond:c=>c.school&&c.school.enrolled,build:()=>{const female=chance(0.5);const nm=randName(female);const npc={id:"perundung-"+Math.random().toString(36).slice(2,8),name:nm,female,role:"perundung",age:C.age};
    return {ico:"😠",_npc:npc,prompt:`<b>${nm}</b>, anak nakal di sekolah, merebut bekal makananmu.`,
    choices:[
      {label:"Lawan!",sub:"Kekuatan menentukan",run:()=>{if(C.stats.might>30||chance(0.5)){applyStats({might:+3,happy:+3});C.reputation+=2;return{t:`Kau melawan & menang! ${nm} tak berani lagi.`,cls:"e-good"};}applyStats({health:-8,happy:-5});return{t:`Kau dipukuli ${nm}. Hari yang menyakitkan.`,cls:"e-bad"};}},
      {label:"Lapor guru",sub:"aman tapi dicap pengadu",run:()=>{applyStats({happy:-2,mind:+2});return{t:`Guru menghukum ${nm}, tapi kau dicap pengadu.`,cls:""};}},
      {label:"Beri saja",sub:"hindari masalah",run:()=>{applyStats({happy:-4});return{t:`Kau menyerahkan bekalmu. ${nm} tertawa puas.`,cls:"e-bad"};}},
    ]};}},
  // ---------- REMAJA ----------
  {id:"first_kiss",min:13,max:17,once:true,cond:c=>!c.flags.firstKiss,build:()=>{const female=!C.female;const nm=randName(female);const npc={id:"cinta-"+Math.random().toString(36).slice(2,8),name:nm,female,role:"teman",age:C.age};
    return {ico:"💗",_npc:npc,
    prompt:`Di bawah pohon willow saat senja, <b>${nm}</b> menatapmu penuh arti. Momen pertama yang canggung & manis.`,
    choices:[
      {label:"Beranikan diri, cium",sub:"first kiss!",run:()=>{C.flags.firstKiss=1;const r=addRel("teman",{id:npc.id,name:nm,female,bond:ri(55,75),appearance:npc.appearance});r.ageOffset=0;applyStats({happy:+10,charm:+3});return{t:`Ciuman pertamamu dengan ${nm}! Jantungmu berdebar. (bisa dilanjut di tab Relasi)`,cls:"e-epic"};}},
      {label:"Gugup, mundur",sub:"momen berlalu",run:()=>{applyStats({happy:-3,charm:-1});return{t:`Kau terlalu gugup & menunduk. Momen itu berlalu begitu saja.`,cls:"e-bad"};}},
      {label:"Bercanda cairkan suasana",sub:"jadi teman dekat",run:()=>{const r=addRel("teman",{id:npc.id,name:nm,female,bond:ri(50,65),appearance:npc.appearance});r.ageOffset=0;applyStats({charm:+2,happy:+4});return{t:`Kau melempar candaan — kalian tertawa & jadi teman dekat.`,cls:"e-good"};}},
    ]};}},
  {id:"rebel_phase",min:14,max:17,once:true,build:()=>({ico:"🔥",
    prompt:`Masa pemberontakan remaja! Kau ingin melakukan sesuatu yang nekat.`,
    choices:[
      {label:"Kabur petualangan",sub:"Kekuatan + tapi relasi -",run:()=>{applyStats({might:+5,happy:+5});const fam=C.relations.filter(r=>r.role==="keluarga");fam.forEach(r=>r.bond=clamp(r.bond-ri(4,8)));return{t:"Kau kabur seminggu berpetualang. Seru, tapi keluarga marah.",cls:""};}},
      {label:"Belajar sihir terlarang",sub:"Mana + tapi berisiko",run:()=>{applyStats({mana:+8,happy:-3});return{t:"Kau diam-diam mempelajari mantra terlarang. Kuat tapi berbahaya.",cls:"e-arcane"};}},
      {label:"Tetap anak baik",sub:"relasi keluarga +",run:()=>{const fam=C.relations.filter(r=>r.role==="keluarga");fam.forEach(r=>r.bond=clamp(r.bond+ri(3,6)));applyStats({mind:+3});return{t:"Kau memilih jalan lurus. Orang tua bangga padamu.",cls:"e-good"};}},
    ]})},
  // ---------- LULUS SEKOLAH: ortu beliin hadiah ----------
  {id:"grad_gift",min:9,max:17,cond:c=>c._justGraduated,build:()=>{
    const gifts=[{n:"kuda muda",ico:"🐴",perk:{charm:3}},{n:"set buku langka",ico:"📚",perk:{mind:5}},
      {n:"pedang latihan",ico:"⚔️",perk:{might:4}},{n:"jubah indah",ico:"🧥",perk:{charm:4}},
      {n:"tongkat sihir",ico:"🪄",perk:{mana:5}}];
    const g=rand(gifts);C._gradGift=g;
    return {ico:g.ico,prompt:`Selamat lulus! Orang tuamu menghadiahkan <b>${g.n}</b> sebagai tanda bangga.`,
    choices:[
      {label:"Terima dengan senang",sub:`bonus stat`,run:()=>{applyStats(g.perk);applyStats({happy:+6});const fam=C.relations.filter(r=>r.role==="keluarga");fam.forEach(r=>r.bond=clamp(r.bond+ri(3,6)));return{t:`Kau menerima ${g.n}. Orang tuamu tersenyum bangga.`,cls:"e-good"};}},
      {label:"Tolak — terlalu mahal",sub:"relasi +, no bonus",run:()=>{const fam=C.relations.filter(r=>r.role==="keluarga");fam.forEach(r=>r.bond=clamp(r.bond+ri(5,9)));applyStats({happy:+3});return{t:`Kau menolak demi menghemat uang keluarga. Mereka makin sayang padamu.`,cls:"e-good"};}},
      {label:"Minta yang lebih bagus",sub:"berisiko",run:()=>{if(chance(0.4)){const better={...g.perk};for(const k in better)better[k]*=2;applyStats(better);return{t:`Orang tuamu mengabulkan & memberi versi terbaik! Beruntung.`,cls:"e-epic"};}const fam=C.relations.filter(r=>r.role==="keluarga");fam.forEach(r=>r.bond=clamp(r.bond-ri(4,8)));applyStats({happy:-4});return{t:`Orang tuamu kecewa kau serakah. Kau tak dapat apa-apa.`,cls:"e-bad"};}},
    ]};}},
  // ---------- DEWASA: peluang & konflik ----------
  {id:"stranger_deal",min:18,max:70,build:()=>{const female=chance(0.5);const nm=randName(female);const npc={id:"pedagang-"+Math.random().toString(36).slice(2,8),name:nm,female,role:"pedagang misterius",age:ri(24,60)};
    return {ico:"🧳",_npc:npc,prompt:`Orang asing misterius, <b>${nm}</b>, menawarkan kesepakatan dagang yang mencurigakan.`,
    choices:[
      {label:"Terima taruhan",sub:"untung/rugi besar",run:()=>{if(chance(0.5)){const g=ri(60,180);C.coin+=g;return{t:`Kesepakatan menguntungkan! +${g} keping.`,cls:"e-epic"};}const l=ri(30,90);C.coin=Math.max(0,C.coin-l);return{t:`Kau ditipu ${nm}! Rugi ${l} keping.`,cls:"e-bad"};}},
      {label:"Tolak baik-baik",sub:"aman",run:()=>{applyStats({mind:+2});return{t:`Kau menolak dengan bijak. Naluri menyelamatkanmu.`,cls:"e-good"};}},
      {label:"Laporkan ke penjaga",sub:"reputasi +",run:()=>{C.reputation+=5;return{t:`${nm} ternyata penipu buron! Kau dapat pujian penjaga kota.`,cls:"e-good"};}},
    ]};}},
  {id:"political_intrigue",min:20,max:75,cond:c=>c.reputation>=20,build:()=>({ico:"🏛️",
    prompt:`Seorang bangsawan mengajakmu terlibat intrik politik melawan saingannya.`,
    choices:[
      {label:"Dukung dia",sub:"reputasi naik/turun",run:()=>{if(C.stats.mind>50||chance(0.5)){C.reputation+=12;C.coin+=ri(40,100);return{t:"Pihakmu menang! Reputasi & harta meningkat.",cls:"e-epic"};}C.reputation-=10;return{t:"Pihakmu kalah. Kau kena getahnya.",cls:"e-bad"};}},
      {label:"Tetap netral",sub:"aman",run:()=>{applyStats({mind:+3});return{t:"Kau menolak terlibat. Kadang diam itu emas.",cls:"e-good"};}},
      {label:"Khianati demi bayaran",sub:"koin + reputasi -",run:()=>{C.coin+=ri(80,200);C.reputation-=15;return{t:"Kau membocorkan rahasia demi emas. Kaya tapi tercela.",cls:""};}},
    ]})},
  {id:"illness_adult",min:25,max:80,build:()=>({ico:"🤒",
    prompt:`Kau jatuh sakit parah. Bagaimana kau menghadapinya?`,
    choices:[
      {label:"Berobat ke tabib",sub:"butuh koin",run:()=>{if(C.coin>=30){C.coin-=30;applyStats({health:+15});return{t:"Tabib menyembuhkanmu. Nyawa pulih.",cls:"e-good"};}applyStats({health:-15});return{t:"Kau tak mampu bayar tabib. Sakitmu memburuk.",cls:"e-bad"};}},
      {label:"Ramuan herbal sendiri",sub:"Akal menentukan",run:()=>{if(C.stats.mind>50){applyStats({health:+10});return{t:"Ramuan racikanmu manjur!",cls:"e-good"};}applyStats({health:-10});return{t:"Ramuanmu gagal, kau makin lemah.",cls:"e-bad"};}},
      {label:"Pasrah & istirahat",sub:"untung-untungan",run:()=>{if(chance(0.5)){applyStats({health:+5});return{t:"Tubuhmu pulih sendiri perlahan.",cls:""};}applyStats({health:-20});return{t:"Tanpa pengobatan, kondisimu menurun drastis.",cls:"e-bad"};}},
    ]})},
  {id:"rare_opportunity",min:18,max:75,build:()=>({ico:"🌟",
    prompt:`Kesempatan langka! Sebuah ekspedisi ke reruntuhan kuno mencari rekrut pemberani.`,
    choices:[
      {label:"Ikut ekspedisi",sub:"harta besar / bahaya",run:()=>{if(C.stats.might>50||C.stats.mana>50){const g=ri(100,300);C.coin+=g;C.reputation+=10;applyStats({might:+3});return{t:`Ekspedisi sukses! Kau pulang dengan ${g} keping & ketenaran.`,cls:"e-epic"};}applyStats({health:-ri(20,40)});return{t:"Ekspedisi berbahaya melukaimu parah. Kau nyaris tak pulang.",cls:"e-bad"};}},
      {label:"Tolak — terlalu bahaya",sub:"aman",run:()=>{return{t:"Kau memilih hidup aman. Kesempatan berlalu.",cls:""};}},
    ]})},
];

// ---------- pemicu aging event (dipanggil tiap advanceYear) ----------
function rollAgingEvent(){
  if(!C||!C.alive)return false;
  if(!C._agingDone)C._agingDone={};
  const pool=AGING_EVENTS.filter(e=>{
    if(C.age<e.min||C.age>e.max)return false;
    if(e.once&&C._agingDone[e.id])return false;
    if(e.cond&&!e.cond(C))return false;
    return true;
  });
  if(!pool.length)return false;
  const ev=rand(pool);
  if(ev.once)C._agingDone[ev.id]=1;
  const data=ev.build();
  // bungkus choices supaya hasil tampil via result-style (log + render)
  const wrapped={ico:data._npc&&typeof npcAvatar==="function"?npcAvatar(data._npc,data._npc.age,"npc-avatar--hero"):data.ico,prompt:data.prompt,cancel:false,
    choices:data.choices.map(ch=>({label:ch.label,sub:ch.sub,cls:ch.cls,run:()=>{
      // v24 FIX: JANGAN log di sini. resolveChoice() sudah mencatat res.t.
      // Dulu keduanya mencatat -> 22% entri log duplikat.
      return ch.run();
    }}))};
  // snapshot utk delta, lalu buka
  if(typeof snapStats==="function")snapStats();
  openChoice(wrapped);
  return true;
}

// ============================================================
//  PATCH — Integrasi Aging Events
// ============================================================

// ---------- bungkus advanceYear: SELALU coba aging event tiap tambah umur ----------
// urutan: proses tahunan & event lama jalan dulu (via _aging_prevAdvance),
// LALU kalau tak ada modal terbuka, picu aging event.
const _aging_prevAdvance=advanceYear;
advanceYear=function(){
  // reset penanda lulus tahun ini
  C._justGraduated=false;
  _aging_prevAdvance.call(this);
  // setelah semua proses, kalau hidup & layar bebas, picu aging event
  if(C&&C.alive){
    if(!pendingChoice){
      rollAgingEvent();
    }else{
      // ada modal (event/kuis/sewa) — antrekan aging event setelah modal ditutup
      C._agingQueued=true;
    }
  }
};

// ---------- saat modal ditutup, jalankan aging event yg terantre ----------
const _aging_prevClose=closeModal;
closeModal=function(){
  _aging_prevClose();
  if(C&&C.alive&&C._agingQueued&&!pendingChoice){
    C._agingQueued=false;
    setTimeout(()=>{if(C.alive&&!pendingChoice)rollAgingEvent();},200);
  }
};

// ---------- tandai _justGraduated saat lulus jenjang (untuk grad_gift) ----------
// gradeQuiz menambah ke s.graduated; kita pantau lewat wrapper
if(typeof gradeQuiz==="function"){
  const _aging_prevGrade=gradeQuiz;
  gradeQuiz=function(correct){
    const before=C.school?C.school.graduated.length:0;
    _aging_prevGrade(correct);
    // cek apakah jumlah lulus bertambah (lulus jenjang)
    setTimeout(()=>{
      if(C.school&&C.school.graduated.length>before){C._justGraduated=true;
        // picu grad_gift segera kalau layar bebas
        if(!pendingChoice){const ev=AGING_EVENTS.find(e=>e.id==="grad_gift");
          if(ev&&ev.cond(C)){const data=ev.build();
            if(typeof snapStats==="function")snapStats();
            openChoice({ico:data.ico,prompt:data.prompt,cancel:false,choices:data.choices});}}}
    },900);
  };
}
