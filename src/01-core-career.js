// ============================================================
//  TAKDIR v3 — Engine (bagian 2: karir, bisnis, aset, relasi)
// ============================================================
const MIN_WORK_AGE=15;

// ---------- CAREERS (banyak variasi, ada syarat umur) ----------
const CAREERS=[
  {id:"farmer",ico:"🧑‍🌾",name:"Petani",req:c=>c.age>=MIN_WORK_AGE,basepay:24,
    ranks:["Buruh Tani","Petani","Tuan Tanah","Juragan Panen"],statGain:{health:+1,might:+1}},
  {id:"guard",ico:"🛡️",name:"Penjaga Kota",req:c=>c.age>=MIN_WORK_AGE&&c.stats.might>=45,basepay:30,
    ranks:["Rekrut","Penjaga","Sersan","Kapten Penjaga"],statGain:{might:+3,health:-1}},
  {id:"scholar",ico:"📖",name:"Cendekiawan",req:c=>c.age>=MIN_WORK_AGE&&c.stats.mind>=50,basepay:35,
    ranks:["Juru Tulis","Sarjana","Profesor","Maha Guru"],statGain:{mind:+3}},
  {id:"merchant",ico:"💰",name:"Saudagar",req:c=>c.age>=MIN_WORK_AGE&&c.coin>=80,basepay:45,
    ranks:["Pedagang Kecil","Saudagar","Tuan Dagang","Raja Dagang"],statGain:{charm:+2,mind:+1}},
  {id:"blacksmith",ico:"🔨",name:"Pandai Besi",req:c=>c.age>=MIN_WORK_AGE&&c.stats.might>=40,basepay:38,
    ranks:["Magang","Pandai Besi","Empu","Empu Agung"],statGain:{might:+2}},
  {id:"healer",ico:"⚕️",name:"Tabib",req:c=>c.age>=MIN_WORK_AGE&&c.stats.mind>=45,basepay:42,
    ranks:["Pembantu Tabib","Tabib","Tabib Ahli","Tabib Istana"],statGain:{mind:+2,health:+1}},
  {id:"bard",ico:"🎻",name:"Bard",req:c=>c.age>=MIN_WORK_AGE&&c.stats.charm>=45,basepay:32,
    ranks:["Pengamen","Bard","Bard Istana","Maestro"],statGain:{charm:+3,happy:+1}},
  {id:"thief",ico:"🗝️",name:"Pencuri",req:c=>c.age>=MIN_WORK_AGE&&c.stats.might>=30,basepay:50,
    ranks:["Copet","Maling","Pencuri Ulung","Raja Maling"],statGain:{might:+1,mind:+1},shady:true},
  {id:"mage",ico:"🪄",name:"Penyihir Istana",req:c=>c.age>=MIN_WORK_AGE&&c.isMage&&c.stats.mana>=55,basepay:65,
    ranks:["Apprentice","Penyihir","Penyihir Tinggi","Archmage"],statGain:{mana:+3,mind:+2},arcane:true},
  {id:"knight",ico:"⚔️",name:"Ksatria",req:c=>c.age>=18&&c.stats.might>=65&&c.reputation>=10,basepay:75,
    ranks:["Pengawal","Ksatria","Komandan","Marsekal"],statGain:{might:+4,charm:+1}},
  {id:"alchemist",ico:"⚗️",name:"Alkemis",req:c=>c.age>=MIN_WORK_AGE&&c.stats.mind>=55,basepay:48,
    ranks:["Pelajar","Alkemis","Master Alkemis","Alkemis Agung"],statGain:{mind:+3,mana:+1}},
];

// ---------- BUSINESSES (pasif income tahunan) ----------
const BUSINESS_TYPES=[
  {id:"cattle",ico:"🐄",name:"Peternakan",buy:130,income:[32,72,132],
    tiers:["Kandang Kecil","Peternakan","Ranch Besar"],upgrade:[0,220,700],
    risk:"Wabah ternak bisa kurangi income setahun."},
  {id:"farm",ico:"🥕",name:"Kebun Sayur",buy:80,income:[24,54,108],
    tiers:["Petak Kebun","Ladang","Perkebunan"],upgrade:[0,160,560],
    risk:"Gagal panen jika musim buruk."},
  {id:"shop",ico:"🏪",name:"Toko Dagang",buy:220,income:[52,108,204],
    tiers:["Lapak","Toko","Rumah Dagang"],upgrade:[0,340,950],
    risk:"Persaingan pasar bisa tekan untung."},
  {id:"tavern",ico:"🍻",name:"Kedai/Tavern",buy:360,income:[76,164,312],
    tiers:["Warung","Kedai","Tavern Megah"],upgrade:[0,540,1400],
    risk:"Keributan bisa rusak reputasi."},
  {id:"caravan",ico:"🐫",name:"Kafilah Dagang",buy:560,income:[112,232,456],
    tiers:["Satu Pedati","Kafilah","Armada Dagang"],upgrade:[0,800,2100],
    risk:"Bisa dirampok di jalan."},
];

const SKILL_TYPES=[
  {id:"swordsmanship",ico:"🤺",name:"Ilmu Pedang",stat:"might"},
  {id:"alchemy",ico:"⚗️",name:"Alkimia",stat:"mind"},
  {id:"diplomacy",ico:"🎭",name:"Diplomasi",stat:"charm"},
  {id:"medicine",ico:"⚕️",name:"Pengobatan",stat:"health"},
  {id:"sorcery",ico:"✨",name:"Sihir Tempur",stat:"mana",arcane:true},
];

// ---------- GENERAL ACTIVITIES (di mana saja) ----------
const ACTIVITIES=[
  {id:"train",ico:"💪",name:"Latihan Fisik",desc:"Asah tubuh",
    subs:[
      {label:"Angkat batu",hint:"Kekuatan ++, Nyawa -",run:()=>{applyStats({might:+ri(3,7),health:-2});return "Kau mengangkat bongkahan batu hingga lelah.";}},
      {label:"Lari maraton",hint:"Nyawa +, Kekuatan +",run:()=>{applyStats({health:+ri(3,6),might:+2});return "Kau berlari menyusuri bukit.";}},
      {label:"Latih pedang",hint:"Kekuatan +++",run:()=>{applyStats({might:+ri(5,9),happy:-2});return "Ayunan pedangmu makin tajam.";}},
    ]},
  {id:"study",ico:"📚",name:"Belajar",desc:"Tingkatkan akal",
    subs:[
      {label:"Baca gulungan kuno",hint:"Akal ++",run:()=>{applyStats({mind:+ri(4,8)});return "Kau melahap gulungan kuno.";}},
      {label:"Pelajari taktik perang",hint:"Akal +, Kekuatan +",run:()=>{applyStats({mind:+ri(3,6),might:+2});return "Kau mempelajari taktik panglima legendaris.";}},
      {label:"Belajar etika bangsawan",hint:"Pesona ++",run:()=>{applyStats({charm:+ri(4,8)});return "Kau menguasai tata krama istana.";}},
    ]},
  {id:"magic",ico:"🔮",name:"Latihan Arcane",desc:"Khusus penyihir",arcane:true,cond:()=>C.isMage,
    subs:[
      {label:"Meditasi mana",hint:"Mana ++",run:()=>{applyStats({mana:+ri(5,10)});return "Kau menyelaraskan diri dengan arcane.";}},
      {label:"Rapal mantra baru",hint:"Mana +, Akal +",run:()=>{applyStats({mana:+ri(3,6),mind:+3});return "Mantra baru terukir di ingatanmu.";}},
    ]},
  {id:"reflect",ico:"🧘",name:"Bersantai",desc:"Pulihkan jiwa",
    subs:[
      {label:"Berdoa di kuil",hint:"Bahagia +",run:()=>{applyStats({happy:+ri(4,8)});return "Kau berdoa & merasa tenang.";}},
      {label:"Tidur panjang",hint:"Nyawa +",run:()=>{applyStats({health:+ri(3,7)});return "Istirahat memulihkan tubuhmu.";}},
    ]},
];

function applyStats(ch){for(const k in ch)if(C.stats[k]!==undefined)C.stats[k]=clamp(C.stats[k]+ch[k]);}

// ---------- REL ACTIONS ----------
const REL_ACTIONS={
  keluarga:[
    {label:"Mengobrol",run:r=>{r.bond=clamp(r.bond+ri(4,9));applyStats({happy:+4});return `Kau mengobrol hangat dengan ${r.name}.`;}},
    {label:"Minta warisan",run:r=>{const g=ri(30,90);C.coin+=g;r.bond=clamp(r.bond-ri(6,14));return `${r.name} memberimu ${g} keping, meski enggan.`;}},
  ],
  teman:[
    {label:"Petualangan bareng",run:r=>{r.bond=clamp(r.bond+ri(6,12));applyStats({might:+3,happy:+5});return `Kau & ${r.name} menjelajah seharian.`;}},
    {label:"Pinjam koin",run:r=>{if(r.bond>50){const g=ri(10,40);C.coin+=g;r.bond=clamp(r.bond-ri(3,8));return `${r.name} meminjamkan ${g} keping.`;}r.bond=clamp(r.bond-5);return `${r.name} menolak membantu.`;}},
    {label:"Jadikan bestie",cls:"love",run:r=>{if(r.bond>=75){r.role="bestie";return `${r.name} kini sahabat karibmu!`;}return "Hubungan belum cukup erat.";}},
    {label:"Tembak jadi pacar",cls:"love",run:r=>{if(C.married)return "Kau sudah menikah!";if(C.age<14)return "Kau terlalu muda.";if(r.bond>=65&&chance(0.6)){r.role="pasangan";applyStats({happy:+12});return `${r.name} menerima cintamu!`;}r.bond=clamp(r.bond-ri(4,10));return `${r.name} menolak. Canggung...`;}},
  ],
  rekan:[
    {label:"Misi bareng",run:r=>{r.bond=clamp(r.bond+ri(5,10));const g=ri(15,45);C.coin+=g;applyStats({might:+2});return `Kau & ${r.name} menuntaskan kontrak (+${g} keping).`;}},
    {label:"Rekrut jadi pengikut",run:r=>{if(r.bond>=60){r.role="pengikut";r.loyalty=r.bond;return `${r.name} setuju mengabdi padamu.`;}return `${r.name} belum cukup percaya.`;}},
    {label:"Jadikan teman",cls:"love",run:r=>{r.role="teman";return `${r.name} kini temanmu.`;}},
  ],
  bestie:[
    {label:"Bertualang epik",run:r=>{r.bond=clamp(r.bond+ri(5,10));applyStats({might:+4,mind:+3,happy:+8});return `Kau & sahabatmu ${r.name} menaklukkan tantangan.`;}},
    {label:"Pinjam koin besar",run:r=>{const g=ri(40,120);C.coin+=g;r.bond=clamp(r.bond-ri(2,5));return `${r.name} meminjamkan ${g} keping.`;}},
    {label:"Nyatakan cinta",cls:"love",run:r=>{if(C.married)return "Kau sudah menikah!";if(r.bond>=80&&chance(0.7)){r.role="pasangan";applyStats({happy:+15});return `${r.name} menerima cintamu!`;}r.bond=clamp(r.bond-ri(5,12));return `${r.name} menolak. Persahabatan retak.`;}},
  ],
  pasangan:[
    {label:"Kencan romantis",cls:"love",run:r=>{r.bond=clamp(r.bond+ri(5,11));applyStats({happy:+10,charm:+2});C.coin-=ri(5,20);return `Malam romantis bersama ${r.name}.`;}},
    {label:"Menikah",cls:"love",run:r=>{if(C.married)return "Kau sudah menikah.";if(C.age<16)return "Kau terlalu muda.";if(r.bond>=70){C.married=true;applyStats({happy:+20});C.coin-=ri(20,60);return `Kau menikah dengan ${r.name}! Pesta megah.`;}return `${r.name} belum siap menikah.`;}},
    {label:"Punya anak",run:r=>{if(!C.married)return "Menikahlah dulu.";if(C.age<16||C.age>50)return "Bukan waktu tepat.";const ch=addRel("keluarga",{female:chance(0.5),bond:ri(60,80),isChild:true});ch.name=uniqueFamilyName(ch.female,C.name.split(" ").slice(1).join(" "));applyStats({happy:+12,health:-3});C.coin-=ri(10,30);return `Anakmu, ${ch.name}, lahir!`;}},
    {label:"Selingkuh",cls:"danger",run:r=>{if(chance(0.5)){r.bond=clamp(r.bond-ri(30,50));r.role="musuh";return `${r.name} memergokimu! Cinta jadi benci.`;}applyStats({happy:+5});return "Perselingkuhanmu lolos... untuk kini.";}},
  ],
  musuh:[
    {label:"Berdamai",run:r=>{if(C.stats.charm>55&&chance(0.6)){r.role="teman";r.bond=ri(35,50);return `Kau berdamai dengan ${r.name}.`;}r.bond=clamp(r.bond-5);return `${r.name} menolak uluran tanganmu.`;}},
    {label:"Sebar fitnah",cls:"danger",run:r=>{r.bond=clamp(r.bond-ri(8,16));C.reputation+=chance(0.4)?-5:3;return `Kau menyebar desas-desus tentang ${r.name}.`;}},
    {label:"Tantang duel",cls:"danger",run:r=>{if(C.stats.might>60||(C.isMage&&C.stats.mana>70)){C.reputation+=12;applyStats({might:+5,happy:+8});C.relations=C.relations.filter(x=>x.id!==r.id);return `Kau mengalahkan ${r.name} dalam duel!`;}applyStats({health:-ri(20,40)});return `${r.name} mengalahkanmu telak.`;}},
  ],
  pengikut:[
    {label:"Beri tugas",run:r=>{const g=Math.round(ri(8,20)*(r.loyalty/50));C.coin+=g;r.loyalty=clamp(r.loyalty-ri(2,6));return `${r.name} bekerja untukmu (+${g} keping).`;}},
    {label:"Beri hadiah",run:r=>{C.coin-=ri(10,25);r.loyalty=clamp(r.loyalty+ri(8,16));return `Kau memberi hadiah pada ${r.name}. Makin setia.`;}},
    {label:"Bebaskan & angkat",cls:"love",run:r=>{r.role="teman";r.bond=clamp(r.loyalty+10);C.reputation+=8;applyStats({happy:+8});return `Kau membebaskan ${r.name}. Ia berterima kasih seumur hidup.`;}},
  ],
};
