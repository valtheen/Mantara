// ============================================================
//  TAKDIR — STORE BERKATEGORI DI PETA
// ============================================================
// tiap toko: {id,ico,name,cat,desc,city:[...] , build()->daftar item/jasa}
// item: {label, sub, price, minAge, run()}  (run pakai finishAct utk result popup)

// helper beli barang wardrobe/gear/item lewat store (dibeli = dimiliki + langsung dipakai)
function storeBuyWardrobe(slot,key,price,name){
  if(C.coin<price){toast("Koin tak cukup.");return;}
  ensureWardrobe();C.coin-=price;
  if(!C.wardrobeOwned[slot].includes(key))C.wardrobeOwned[slot].push(key);
  C.wardrobe[slot]=key;applyWardrobePerks();
  finishAct(`Kau membeli & memakai ${name}. Tersimpan di Wardrobe (Aset).`,"e-good");
}
function storeBuyGear(cat,key,price,name){
  if(C.coin<price){toast("Koin tak cukup.");return;}
  C.coin-=price;C.gear[cat]=key;
  finishAct(`Kau membeli ${name}.`,"e-good");
}
function storeService(cost,effect,msg,cls){
  if(C.coin<cost){toast("Koin tak cukup.");return;}
  if(!spendAction())return;
  C.coin-=cost;applyStats(effect);finishAct(msg,cls||"e-good");
}

// ---------- DAFTAR TOKO ----------
// city: daftar kota tempat toko muncul (semua kota kalau "all")
const STORES=[
  // ===== WAND SMITH (penyihir) =====
  {id:"wandsmith",ico:"🪄",name:"Tukang Tongkat",cat:"Sihir",city:["frostspire","aetheria"],
    desc:"Tongkat & staf sihir bertenaga arcane.",
    build:()=>[
      {label:"🪄 Tongkat Terpahat",sub:"senjata sihir · 💰120",price:120,minAge:10,run:()=>storeBuyGear("weapon","enchanted",120,"Tongkat Terpahat")},
      {label:"🔮 Staf Arcanum",sub:"senjata sihir kuat · 💰780",price:780,minAge:16,run:()=>storeBuyGear("weapon","dragonblade",780,"Staf Arcanum")},
      {label:"✨ Isi ulang mana",sub:"Mana +8 · 💰30",price:30,minAge:8,run:()=>storeService(30,{mana:+8},"Tongkatmu diisi ulang energi arcane.","e-arcane")},
      {label:"📖 Beli Kodeks Sihir",sub:"Mana +5 Akal +3 · 💰200",price:200,minAge:13,run:()=>storeService(200,{mana:+5,mind:+3},"Kau mempelajari kodeks mantra langka.","e-arcane")},
    ]},
  // ===== SWORD SMITH =====
  {id:"swordsmith",ico:"⚔️",name:"Pandai Pedang",cat:"Senjata",city:["aetheria","thornvale","frostspire"],
    desc:"Pedang & bilah tempa terbaik.",
    build:()=>[
      {label:"🔪 Belati Baja",sub:"senjata ringan · 💰50",price:50,minAge:10,run:()=>storeBuyGear("weapon","knife",50,"Belati Baja")},
      {label:"🗡️ Pedang Tempa",sub:"senjata tempur · 💰300",price:300,minAge:14,run:()=>storeBuyGear("weapon","sword",300,"Pedang Tempa")},
      {label:"⚔️ Pedang Terkutuk",sub:"senjata sakti · 💰750",price:750,minAge:16,run:()=>storeBuyGear("weapon","dragonblade",750,"Pedang Terkutuk")},
      {label:"🔧 Asah pedang",sub:"Kekuatan +3 · 💰25",price:25,minAge:12,run:()=>storeService(25,{might:+3},"Pedangmu diasah hingga tajam berkilau.")},
    ]},
  // ===== BLACKSMITH (zirah) =====
  {id:"blacksmith",ico:"🛡️",name:"Pandai Besi",cat:"Zirah",city:["all"],
    desc:"Zirah, perisai, & perkakas logam.",
    build:()=>[
      {label:"🛡️ Zirah Kulit",sub:"badan · Kekuatan+3 Nyawa+2 · 💰220",price:220,minAge:13,run:()=>storeBuyWardrobe("body","leather_armor",220,"Zirah Kulit")},
      {label:"⚙️ Zirah Plat Baja",sub:"badan · Kekuatan+6 Nyawa+4 · 💰600",price:600,minAge:15,run:()=>storeBuyWardrobe("body","plate",600,"Zirah Plat Baja")},
      {label:"🪖 Helm Baja",sub:"kepala · Kekuatan+3 Nyawa+3 · 💰300",price:300,minAge:14,run:()=>storeBuyWardrobe("head","helm",300,"Helm Baja")},
      {label:"🦵 Pelindung Kaki Baja",sub:"celana · Kekuatan+4 Nyawa+2 · 💰280",price:280,minAge:14,run:()=>storeBuyWardrobe("legs","greaves",280,"Pelindung Kaki Baja")},
      {label:"👢 Bot Perang",sub:"sepatu · Kekuatan+3 Nyawa+2 · 💰240",price:240,minAge:14,run:()=>storeBuyWardrobe("feet","warboots",240,"Bot Perang")},
    ]},
  // ===== SALON / TUKANG RIAS =====
  {id:"salon",ico:"💇",name:"Salon Tata Rias",cat:"Gaya",city:["aetheria","saltmoor"],
    desc:"Perawatan & gaya untuk pesona maksimal.",
    build:()=>[
      {label:"✂️ Potong rambut",sub:"Pesona +3 · 💰20",price:20,minAge:5,run:()=>storeService(20,{charm:+3},"Rambutmu ditata rapi & modis.")},
      {label:"💆 Perawatan wajah",sub:"Pesona +5 Bahagia +3 · 💰45",price:45,minAge:10,run:()=>storeService(45,{charm:+5,happy:+3},"Wajahmu segar berseri.")},
      {label:"💅 Rias lengkap pesta",sub:"Pesona +8 · 💰90",price:90,minAge:13,run:()=>storeService(90,{charm:+8,happy:+4},"Kau tampil memukau siap menghadiri pesta bangsawan.","e-epic")},
      {label:"👑 Lingkar Perak",sub:"kepala · Pesona+3 Akal+1 · 💰150",price:150,minAge:12,run:()=>storeBuyWardrobe("head","circlet",150,"Lingkar Perak")},
    ]},
  // ===== TAILOR / PENJAHIT =====
  {id:"tailor",ico:"🧵",name:"Penjahit",cat:"Pakaian",city:["all"],
    desc:"Busana dari linen sederhana hingga sutra mewah.",
    build:()=>[
      {label:"👕 Tunik Linen",sub:"badan · Pesona+2 · 💰40",price:40,minAge:5,run:()=>storeBuyWardrobe("body","tunic",40,"Tunik Linen")},
      {label:"🧥 Jubah Sutra",sub:"badan · Pesona+5 · 💰160",price:160,minAge:10,run:()=>storeBuyWardrobe("body","silk",160,"Jubah Sutra")},
      {label:"👖 Celana Berkuda",sub:"celana · Kekuatan+2 Pesona+1 · 💰90",price:90,minAge:10,run:()=>storeBuyWardrobe("legs","riding",90,"Celana Berkuda")},
      {label:"👢 Bot Perjalanan",sub:"sepatu · Nyawa+2 Kekuatan+1 · 💰75",price:75,minAge:8,run:()=>storeBuyWardrobe("feet","boots",75,"Bot Perjalanan")},
      {label:"🎩 Tudung Kain",sub:"kepala · Akal+1 · 💰30",price:30,minAge:5,run:()=>storeBuyWardrobe("head","hood",30,"Tudung Kain")},
    ]},
  // ===== APOTHECARY =====
  {id:"apothecary",ico:"⚗️",name:"Apotek Ramuan",cat:"Ramuan",city:["all"],
    desc:"Ramuan penyembuh & tonik penguat.",
    build:()=>[
      {label:"🧪 Ramuan Nyawa",sub:"Nyawa +15 · 💰40",price:40,minAge:6,run:()=>storeService(40,{health:+15},"Kau meneguk ramuan, luka pulih.")},
      {label:"💪 Tonik Kekuatan",sub:"Kekuatan +5 · 💰60",price:60,minAge:10,run:()=>storeService(60,{might:+5},"Tonik membuat ototmu membara.")},
      {label:"🧠 Eliksir Akal",sub:"Akal +5 · 💰60",price:60,minAge:10,run:()=>storeService(60,{mind:+5},"Pikiranmu menjadi tajam.")},
      {label:"💜 Ramuan Mana",sub:"Mana +6 · 💰70",price:70,minAge:10,run:()=>storeService(70,{mana:+6},"Energi arcane mengalir di nadimu.","e-arcane")},
    ]},
  // ===== JEWELER / TUKANG PERMATA =====
  {id:"jeweler",ico:"💎",name:"Tukang Permata",cat:"Perhiasan",city:["aetheria","saltmoor"],
    desc:"Perhiasan mewah penanda status.",
    build:()=>[
      {label:"💍 Cincin Perak",sub:"Pesona +3 · 💰120",price:120,minAge:13,run:()=>storeService(120,{charm:+3,happy:+2},"Cincin perak melingkar anggun di jarimu.")},
      {label:"📿 Kalung Permata",sub:"Pesona +5 Reputasi +2 · 💰320",price:320,minAge:15,run:()=>storeService(320,{charm:+5},"Kalung permata menambah wibawamu.","e-epic")},
      {label:"👑 Mahkota Kecil",sub:"Reputasi +5 Pesona +4 · 💰600",price:600,minAge:18,run:()=>{if(C.coin<600){toast("Koin kurang.");return;}if(!spendAction())return;C.coin-=600;C.reputation+=5;applyStats({charm:+4});finishAct("Kau mengenakan mahkota kecil — lambang kebangsawanan.","e-epic");}},
    ]},
  // ===== TRAINING GROUND =====
  {id:"training",ico:"🏋️",name:"Lapangan Latih",cat:"Latihan",city:["aetheria","thornvale"],
    desc:"Tempa fisik & teknik bertarung.",
    build:()=>[
      {label:"💪 Latihan kekuatan",sub:"Kekuatan +4 · 💰15",price:15,minAge:8,run:()=>storeService(15,{might:+4,health:-1},"Kau berlatih keras, otot menguat.")},
      {label:"⚔️ Latihan pedang",sub:"Kekuatan +6 · 💰35",price:35,minAge:12,run:()=>storeService(35,{might:+6},"Pelatih mengajarimu jurus pedang.")},
      {label:"🏃 Latihan stamina",sub:"Nyawa +8 Kekuatan +2 · 💰25",price:25,minAge:8,run:()=>storeService(25,{health:+8,might:+2},"Lari & latihan napas memperkuat tubuhmu.")},
      {label:"🥋 Spar dengan master",sub:"Kekuatan +8 tapi Nyawa - · 💰60",price:60,minAge:14,run:()=>{if(C.coin<60){toast("Koin kurang.");return;}if(!spendAction())return;C.coin-=60;applyStats({might:+8,health:-ri(3,8)});finishAct("Spar sengit dengan master! Kuat tapi babak belur.","e-good");}},
    ]},
  // ===== CARAVAN / KAFILAH DAGANG =====
  {id:"caravan",ico:"🐫",name:"Kafilah Dagang",cat:"Dagang",city:["all"],
    desc:"Pedagang keliling dengan barang dari penjuru negeri.",
    build:()=>[
      {label:"🗺️ Beli peta harta",sub:"buka petualangan · 💰50",price:50,minAge:13,run:()=>{if(C.coin<50){toast("Koin kurang.");return;}if(!spendAction())return;C.coin-=50;if(chance(0.5)){const g=ri(60,160);C.coin+=g;finishAct(`Peta menuntunmu ke harta! +${g} keping.`,"e-epic");}else finishAct("Peta itu palsu. Kau tertipu.","e-bad");}},
      {label:"🐫 Sewa unta angkut",sub:"dagang untung · 💰40",price:40,minAge:15,run:()=>{if(C.coin<40){toast("Koin kurang.");return;}if(!spendAction())return;C.coin-=40;const g=ri(50,120);C.coin+=g;finishAct(`Kau ikut karavan dagang & untung +${g}.`,"e-good");}},
      {label:"🎁 Barang eksotis acak",sub:"kejutan · 💰80",price:80,minAge:13,run:()=>{if(C.coin<80){toast("Koin kurang.");return;}C.coin-=80;const it=rand(["lucky_coin","ancient_scroll","training_manual","charm_perfume"]);if(typeof addItem==="function")addItem(it);finishAct("Kau membeli barang eksotis dari kafilah!","e-good");}},
    ]},
  // ===== STABLE / KANDANG TUNGGANGAN =====
  {id:"stable",ico:"🐎",name:"Kandang Tunggangan",cat:"Tunggangan",city:["thornvale","aetheria","frostspire"],
    desc:"Kuda hingga makhluk tunggangan langka.",
    build:()=>[
      {label:"🐴 Kuda Biasa",sub:"perjalanan & balap · 💰200",price:200,minAge:13,run:()=>storeBuyGear("mount","horse",200,"Kuda Biasa")},
      {label:"🐎 Kuda Perang",sub:"chariot & tempur · 💰500",price:500,minAge:15,run:()=>storeBuyGear("mount","warhorse",500,"Kuda Perang")},
      {label:"🦅 Griffon",sub:"langka & gagah · 💰1500",price:1500,minAge:18,run:()=>storeBuyGear("mount","griffon",1500,"Griffon")},
    ]},
  // ===== TAVERN / KEDAI =====
  {id:"tavern",ico:"🍺",name:"Kedai Minum",cat:"Sosial",city:["all"],
    desc:"Tempat bersantai, bertemu orang, & dengar kabar.",
    build:()=>[
      {label:"🍺 Minum & bersantai",sub:"Bahagia +6 · 💰10",price:10,minAge:16,run:()=>storeService(10,{happy:+6,health:-1},"Kau bersantai menikmati bir hangat.")},
      {label:"🍲 Makan besar",sub:"Nyawa +8 Bahagia +3 · 💰20",price:20,minAge:5,run:()=>storeService(20,{health:+8,happy:+3},"Kau menyantap hidangan lezat.")},
      {label:"👂 Dengar kabar kota",sub:"info & peluang · 💰5",price:5,minAge:10,run:()=>{if(C.coin<5){toast("Koin kurang.");return;}if(!spendAction())return;C.coin-=5;C.reputation+=1;finishAct(rand(["Kau dengar gosip bangsawan berkhianat.","Ada kabar harta karun di Saltmoor.","Konon raja mencari ksatria baru.","Wabah melanda kota seberang."]),"e-good");}},
      {label:"🤝 Cari kenalan baru",sub:"dapat relasi",price:0,minAge:13,run:()=>{if(!spendAction())return;const female=chance(0.5);const r=addRel("teman",{name:randName(female),female,bond:ri(35,55)});finishAct(`Kau berkenalan dengan ${r.name} di kedai.`,"e-good");}},
    ]},
];

// ---------- toko mana yang ada di kota saat ini ----------
function storesInCity(){
  return STORES.filter(s=>s.city.includes("all")||s.city.includes(C.cityId));
}

// ---------- buka katalog toko ----------
function openStore(storeId){
  const s=STORES.find(x=>x.id===storeId);if(!s)return;
  const items=s.build();
  snapStats&&snapStats();
  const stockNote=(s.cat==="Bimbel"||s.cat==="Perguruan")?"":`<br><span style="font-size:10px;color:var(--gold);filter:brightness(1.1)">📦 Stok berganti tiap tahun & beda tiap kota</span>`;
  openChoice({ico:s.ico,prompt:`<b>${s.name}</b> — ${s.cat}<br><span style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6)">${s.desc} · Koinmu: ${C.coin}</span>${stockNote}`,
    choices:items.map(it=>{
      const locked=C.age<(it.minAge||0);
      const afford=it.price===0||C.coin>=it.price;
      return {label:it.label,sub:locked?`🔒 min ${it.minAge} th`:it.sub,disabled:locked||!afford,
        run:()=>{closeModal();setTimeout(()=>{recordActivity&&recordActivity(`${s.name}: ${it.label}`,()=>{snapStats&&snapStats();it.run();});it.run();},120);return null;}};
    })});
}

// ---------- render distrik toko (dipanggil di renderPeta) ----------
function storeDistrictHTML(){
  const stores=storesInCity();
  if(!stores.length)return "";
  let html=`<div class="sechead">🏪 Distrik Toko ${currentCity().name}</div>
    <p style="font-size:10.5px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 10px;">Tiap toko punya barang & jasa khas. Klik untuk lihat katalog.</p>
    <div class="tiles">`;
  stores.forEach(s=>{
    html+=`<div class="tile store-tile" onclick="openStore('${s.id}')">
      <span class="ti">${s.ico}</span><span class="tn">${s.name}</span>
      <span class="td">${s.cat}</span></div>`;
  });
  html+=`</div>`;
  return html;
}
