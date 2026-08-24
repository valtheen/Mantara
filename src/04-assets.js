// ============================================================
//  TAKDIR v4 — Sistem Aset Baru (properti multi-unit, gear single, sewa)
// ============================================================

// ---------- GENERIC SUB-CHOICE POPUP ----------
// Semua aksi kompleks panggil ini. choices: [{label,sub,hint,cls,disabled,run}]
// run() boleh return string (pesan) atau {t,cls} atau {chain:newChoiceData} utk popup bertingkat
function openChoice(data){
  pendingChoice={data};
  setModalIco(document.getElementById("mico"),data.ico||"❓");
  document.getElementById("mprompt").innerHTML=data.prompt;
  document.getElementById("mchoices").innerHTML=data.choices.map((ch,i)=>{
    const dis=ch.disabled?'style="opacity:.4;pointer-events:none"':'';
    return `<button class="mchoice ${ch.cls||''}" ${dis} onclick="resolveChoice(${i})">
      <span class="mc-label">${ch.label}</span>
      ${ch.sub?`<span class="mc-sub">${ch.sub}</span>`:''}
      ${ch.hint?`<span class="hint">${ch.hint}</span>`:''}</button>`;}).join("")
    + (data.cancel!==false?`<button class="mchoice mc-cancel" onclick="closeModal()">↩ Batal</button>`:'');
  document.getElementById("modal").classList.add("show");
  document.getElementById("btnAge").disabled=true;
}
function showModal(data){openChoice(data);}
function openSubs(actId){
  const a=ACTIVITIES.find(x=>x.id===actId);if(!a)return;
  openChoice({ico:a.ico,prompt:a.name,_isActivity:true,
    choices:a.subs.map(s=>({label:s.label,hint:s.hint,run:()=>({t:s.run(),cls:"e-good"})}))});
}
function closeModal(){
  document.getElementById("modal").classList.remove("show");
  document.getElementById("btnAge").disabled=false;pendingChoice=null;
}

// ---------- PROPERTY CATALOG (multi-unit, tiap varian beda harga & sifat) ----------
// rentMode: 'auto' (income tetap tiap th) | 'active' (trader nego tiap th) | 'none'
const PROPERTY_CATALOG=[
  {key:"shack",ico:"🛖",name:"Gubuk Kayu",price:60,happy:1,rentAuto:8,rentMode:"auto",
    desc:"Tempat berteduh sederhana. Bisa disewakan ke petani."},
  {key:"cottage",ico:"🏠",name:"Pondok Batu",price:200,happy:3,health:1,rentAuto:22,rentMode:"auto",
    desc:"Hunian nyaman. Sewa stabil dari warga kota."},
  {key:"villa",ico:"🏡",name:"Vila Mewah",price:650,happy:6,health:2,rentActive:[40,110],rentMode:"active",
    desc:"Vila elegan. Bangsawan menyewa dengan tawaran bervariasi."},
  {key:"camp",ico:"⛺",name:"Camp Deret",price:350,happy:2,rentActive:[30,90],rentMode:"active",
    desc:"Deretan tenda dagang. Trader singgah & nego sewa tiap musim."},
  {key:"caravanserai",ico:"🏨",name:"Penginapan Kafilah",price:900,happy:4,reputation:1,rentActive:[70,180],rentMode:"active",
    desc:"Persinggahan kafilah besar. Pendapatan sewa tinggi tapi fluktuatif."},
  {key:"castle",ico:"🏰",name:"Kastil Pribadi",price:2500,happy:10,health:2,reputation:3,rentAuto:60,rentMode:"auto",
    desc:"Lambang kekuasaan. Memberi reputasi & sewa lahan dari rakyat."},
  {key:"tower",ico:"🗼",name:"Menara Arcane",price:1800,happy:5,mana:4,rentMode:"none",arcane:true,
    desc:"Menara pribadi penyihir. Tingkatkan mana, tak untuk disewakan."},
];

// ---------- GEAR CATALOG (single-slot per kategori, pilih varian) ----------
const GEAR_CATALOG={
  mount:{ico:"🐴",name:"Tunggangan",arcane:false,variants:[
    {key:"none",name:"Jalan Kaki",price:0,perk:{},desc:"Tanpa tunggangan."},
    {key:"donkey",name:"Keledai",price:60,perk:{charm:1},desc:"Murah & setia."},
    {key:"horse",name:"Kuda",price:200,perk:{charm:2,happy:1},desc:"Cepat & terhormat."},
    {key:"warhorse",name:"Kuda Perang",price:600,perk:{might:3,charm:1},desc:"Tunggangan ksatria."},
    {key:"griffon",name:"Griffon",price:1900,perk:{might:4,reputation:1,charm:2},desc:"Makhluk legendaris."},
  ]},
  weapon:{ico:"⚔️",name:"Senjata",arcane:false,variants:[
    {key:"none",name:"Tangan Kosong",price:0,perk:{},desc:"Tanpa senjata."},
    {key:"knife",name:"Pisau Baja",price:50,perk:{might:1},desc:"Ringkas & tajam."},
    {key:"sword",name:"Pedang Panjang",price:180,perk:{might:3},desc:"Senjata prajurit."},
    {key:"enchanted",name:"Pedang Sihir",price:550,perk:{might:5,mana:1},desc:"Berpendar arcane."},
    {key:"dragonblade",name:"Bilah Naga",price:1600,perk:{might:8,reputation:1},desc:"Ditempa dari sisik naga."},
  ]},
  tome:{ico:"📕",name:"Grimoire",arcane:true,variants:[
    {key:"none",name:"Tanpa Buku",price:0,perk:{},desc:"Belum punya grimoire."},
    {key:"notes",name:"Catatan Lusuh",price:70,perk:{mana:1},desc:"Mantra dasar."},
    {key:"spellbook",name:"Kitab Mantra",price:220,perk:{mana:3},desc:"Koleksi mantra solid."},
    {key:"arcanum",name:"Tomus Arcanum",price:680,perk:{mana:5,mind:1},desc:"Pengetahuan tinggi."},
    {key:"codex",name:"Codex Abadi",price:1900,perk:{mana:9,mind:2},desc:"Grimoire legendaris."},
  ]},
};

// ---------- APPLY PERKS (dipanggil tiap tahun) ----------
function applyAssetPerksV4(){
  // properti multi-unit
  C.properties.forEach(p=>{
    const def=PROPERTY_CATALOG.find(x=>x.key===p.key);if(!def)return;
    if(def.happy)applyStats({happy:+def.happy});
    if(def.health)applyStats({health:+def.health});
    if(def.mana)applyStats({mana:+def.mana});
    if(def.reputation)C.reputation+=def.reputation;
    // sewa otomatis
    if(p.rented&&def.rentMode==="auto"&&def.rentAuto){C.coin+=def.rentAuto;p._income=def.rentAuto;}
  });
  // gear single
  for(const cat in C.gear){
    const v=GEAR_CATALOG[cat].variants.find(x=>x.key===C.gear[cat]);
    if(v&&v.perk)applyStats(v.perk);
  }
  // skill
  C.skills.forEach(sk=>{const def=SKILL_TYPES.find(t=>t.id===sk.id);if(def)applyStats({[def.stat]:+sk.level});});
}

// ---------- SEWA AKTIF: trader nego tiap tahun ----------
// dipanggil saat ageUp untuk tiap properti rentMode active yg di-set "disewakan"
function processActiveRentals(){
  const offers=[];
  C.properties.forEach(p=>{
    const def=PROPERTY_CATALOG.find(x=>x.key===p.key);
    if(p.rented&&def&&def.rentMode==="active"&&def.rentActive){
      const [lo,hi]=def.rentActive;
      const amt=ri(lo,hi);
      const trader=rand(["Trader Eldon","Saudagar Vex","Kafilah Mirae","Tuan Holloway","Nyonya Sable","Pedagang Quill"]);
      offers.push({propKey:p.key,propName:def.name,propIco:def.ico,trader,amt});
    }
  });
  return offers; // diproses lewat popup berantai di UI
}

// ============================================================
//  TAKDIR v4 — Patch (state, loop, render aset baru)
// ============================================================

// ---------- override newChar untuk struktur aset baru ----------
const _origNewChar=newChar;
newChar=function(originId){
  const c=_origNewChar(originId);
  c.properties=[];          // multi-unit: [{key,rented:bool,_income}]
  c.gear={mount:"none",weapon:"none",tome:"none"}; // single slot
  delete c.assets;          // ganti sistem lama
  return c;
};

// ---------- proses antrian tawaran sewa (popup berantai) ----------
function flushRentQueue(){
  if(!C._rentQueue||!C._rentQueue.length)return;
  const offer=C._rentQueue.shift();
  openChoice({
    ico:offer.propIco,
    prompt:`<b>${offer.trader}</b> ingin menyewa <b>${offer.propName}</b>-mu tahun ini, menawarkan <b>${offer.amt} keping</b>.`,
    cancel:false,
    choices:[
      {label:"Terima tawaran",sub:`+${offer.amt} keping`,cls:"love",run:()=>{C.coin+=offer.amt;return{t:`${offer.trader} menyewa ${offer.propName} (+${offer.amt} keping).`,cls:"e-good",_then:flushRentQueue};}},
      {label:"Tolak — tahan harga",sub:"berharap tawaran lebih baik",run:()=>{return{t:`Kau menolak tawaran ${offer.trader}. ${offer.propName} kosong tahun ini.`,cls:"",_then:flushRentQueue};}},
    ]
  });
}

// ============================================================
//  RENDER ASET v4
// ============================================================
function renderAset(){
  let html=`<div class="sechead">Properti (bisa punya banyak)</div>`;
  // daftar properti dimiliki
  if(C.properties.length){
    C.properties.forEach((p,idx)=>{
      const def=PROPERTY_CATALOG.find(x=>x.key===p.key);
      const rentInfo=def.rentMode==="none"?"Tak bisa disewakan":
        p.rented?(def.rentMode==="auto"?`Disewakan (+${def.rentAuto}/th otomatis)`:`Disewakan (trader nego tiap th)`):"Tidak disewakan";
      html+=`<div class="asset">
        <span class="assetico">${def.ico}</span>
        <div class="assetinfo"><div class="assetname">${def.name}</div>
          <div class="assetlvl">${rentInfo}</div>
          <div class="assetdesc">${def.desc}</div></div>
        <button class="upbtn" onclick="managePropertyPopup(${idx})">Kelola</button>
      </div>`;
    });
  }else{
    html+=`<p style="font-size:11.5px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 8px;">Belum punya properti.</p>`;
  }
  html+=`<div class="tiles" style="margin-top:4px"><div class="tile fullrow" onclick="buyPropertyPopup()">
    <span class="ti">🏗️</span><span class="tn">Beli Properti Baru</span>
    <span class="td">Pilih dari katalog — banyak varian & harga.</span></div></div>`;

  // GEAR single-slot
  html+=`<div class="sechead">Perlengkapan (1 slot tiap jenis)</div>`;
  for(const cat in GEAR_CATALOG){
    const g=GEAR_CATALOG[cat];if(g.arcane&&!C.isMage)continue;
    const cur=g.variants.find(v=>v.key===C.gear[cat]);
    const perkStr=Object.entries(cur.perk||{}).map(([k,v])=>`${STAT_META[k]?STAT_META[k].name:k} +${v}`).join(", ")||"—";
    const gearGraphic=typeof mantaraGearIcon==="function"?mantaraGearIcon(cat,cur.key):g.ico;
    html+=`<div class="asset"><span class="assetico">${gearGraphic}</span>
      <div class="assetinfo"><div class="assetname">${cur.name}</div>
        <div class="assetlvl">${g.name} · ${perkStr}/th</div>
        <div class="assetdesc">${cur.desc}</div></div>
      <button class="upbtn" onclick="chooseGearPopup('${cat}')">Ganti</button></div>`;
  }

  // BISNIS: hanya yang DIMILIKI (beli bisnis baru di Pasar Aset kota)
  html+=`<div class="sechead">Bisnis (Income Pasif)</div>`;
  let anyBiz=false;
  BUSINESS_TYPES.forEach(def=>{
    const owned=C.businesses.find(b=>b.id===def.id);
    if(!owned)return;
    anyBiz=true;
    const next=owned.level+1;const canUp=next<def.tiers.length;
    html+=`<div class="asset"><span class="assetico">${def.ico}</span>
      <div class="assetinfo"><div class="assetname">${def.tiers[owned.level]}</div>
        <div class="assetlvl">${def.name} · +${def.income[owned.level]}/th</div>
        <div class="assetdesc">${def.risk}</div></div>
      ${canUp?`<button class="upbtn" onclick="bizPopup('${def.id}')">Kelola</button>`:`<span style="font-size:10px;color:var(--gold)">MAX</span>`}
    </div>`;
  });
  if(!anyBiz)html+=`<p style="font-size:11.5px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 8px;">Belum punya bisnis.</p>`;
  html+=`<div class="tiles" style="margin-top:4px"><div class="tile fullrow" onclick="typeof openAssetMarketPage==='function'?openAssetMarketPage():buyPropertyPopup()">
    <span class="ti">🏗️</span><span class="tn">Mulai Bisnis Baru</span>
    <span class="td">Buka usaha lewat Pasar Aset di kota — harga ikut kota tempatmu.</span></div></div>`;

  // SKILL: hanya menampilkan tingkat — LATIHAN dilakukan di kota
  // (Sanggar Sihir & Perguruan Bela Diri di Dunia → Toko)
  html+=`<div class="sechead">Keahlian</div>
    <p style="font-size:10.5px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 8px;line-height:1.5;">Latih keahlian di <b>Bimbel & Perguruan</b> kota (Dunia → Toko 🛒) — Sanggar Sihir 🔮 & Perguruan Bela Diri 🥋.</p>`;
  const skillGroups=[
    {name:"Tempur",icon:"sword",ids:["swordsmanship"]},
    {name:"Ilmu & Riset",icon:"alchemy",ids:["alchemy"]},
    {name:"Sosial & Pemulihan",icon:"heart",ids:["diplomacy","medicine"]},
    {name:"Arcane",icon:"magic",ids:["sorcery"]},
  ];
  skillGroups.forEach(group=>{
    const skills=group.ids.map(id=>SKILL_TYPES.find(t=>t.id===id)).filter(def=>def&&(!def.arcane||C.isMage));
    if(!skills.length)return;
    html+=`<div class="skill-group-title">${typeof mantaraIcon==="function"?mantaraIcon(group.icon):""}${group.name}</div>`;
    skills.forEach(def=>{
      const owned=C.skills.find(s=>s.id===def.id);const lvl=owned?owned.level:0;
      const skillGraphic=typeof skillIconHTML==="function"?skillIconHTML(def.id):def.ico;
      html+=`<div class="asset" ${lvl<5?`onclick="switchTab('Toko')" style="cursor:pointer"`:''}><span class="assetico">${skillGraphic}</span>
        <div class="assetinfo"><div class="assetname">${def.name}</div>
          <div class="assetlvl">Tingkat ${lvl}/5</div>
          <div class="assetdesc">${STAT_META[def.stat].name} +${lvl}/tahun pasif${lvl<5?' · ketuk untuk ke distrik toko':''}</div></div>
        ${lvl>=5?`<span style="font-size:10px;color:var(--gold)">MAX</span>`:''}
      </div>`;
    });
  });
  document.getElementById("viewAset").innerHTML=html;
}

// ---------- POPUP: beli properti (katalog varian) ----------
function buyPropertyPopup(){
  const cat=PROPERTY_CATALOG.filter(p=>!p.arcane||C.isMage);
  openChoice({ico:"🏗️",prompt:"Pilih properti untuk dibeli:",
    choices:cat.map(p=>{
      const afford=C.coin>=p.price;
      const perks=[p.happy&&`Bahagia+${p.happy}`,p.health&&`Nyawa+${p.health}`,p.mana&&`Mana+${p.mana}`,p.reputation&&`Rep+${p.reputation}`].filter(Boolean).join(" ");
      const rent=p.rentMode==="auto"?`sewa auto +${p.rentAuto}/th`:p.rentMode==="active"?`sewa nego ${p.rentActive[0]}-${p.rentActive[1]}/th`:"tak disewakan";
      return {label:`${p.ico} ${p.name}`,sub:`💰${p.price} · ${perks||'—'} · ${rent}`,hint:p.desc,disabled:!afford,
        run:()=>{C.coin-=p.price;C.properties.push({key:p.key,rented:false});
          checkMissions();return{t:`Kau membeli ${p.name}! Kelola di tab Aset untuk menyewakannya.`,cls:"e-epic"};}};
    })});
}

// ---------- POPUP: kelola properti (sewakan / jual) ----------
function managePropertyPopup(idx){
  const p=C.properties[idx];const def=PROPERTY_CATALOG.find(x=>x.key===p.key);
  const choices=[];
  if(def.rentMode!=="none"){
    if(!p.rented)choices.push({label:"Sewakan properti",sub:def.rentMode==="auto"?`+${def.rentAuto}/th otomatis`:"trader akan nego tiap tahun",cls:"love",
      run:()=>{p.rented=true;return{t:`${def.name} kini disewakan.`,cls:"e-good"};}});
    else choices.push({label:"Hentikan sewa",sub:"properti jadi kosong",
      run:()=>{p.rented=false;return{t:`Kau menghentikan sewa ${def.name}.`,cls:""};}});
  }
  choices.push({label:"Jual properti",sub:`dapat ~${Math.round(def.price*0.6)} keping`,cls:"danger",
    run:()=>{const g=Math.round(def.price*0.6);C.coin+=g;C.properties.splice(idx,1);
      return{t:`Kau menjual ${def.name} seharga ${g} keping.`,cls:"e-bad"};}});
  openChoice({ico:def.ico,prompt:`Kelola <b>${def.name}</b>:`,choices});
}

// ---------- POPUP: pilih gear varian ----------
function chooseGearPopup(cat){
  const g=GEAR_CATALOG[cat];
  openChoice({ico:typeof mantaraGearIcon==="function"?mantaraGearIcon(cat,C.gear[cat]):g.ico,prompt:`Pilih ${g.name}:`,
    choices:g.variants.map(v=>{
      const owned=C.gear[cat]===v.key;
      const afford=v.price===0||C.coin>=v.price||owned;
      const perks=Object.entries(v.perk||{}).map(([k,val])=>`${STAT_META[k]?STAT_META[k].name:k}+${val}`).join(" ")||"—";
      return {label:`${typeof mantaraGearIcon==="function"?mantaraGearIcon(cat,v.key):""} ${v.name}${owned?' ✓':''}`,sub:`${v.price>0?'💰'+v.price+' · ':''}${perks}`,hint:v.desc,
        disabled:owned||!afford,
        run:()=>{if(v.price>0)C.coin-=v.price;C.gear[cat]=v.key;
          return{t:`Kau kini memakai ${v.name}.`,cls:"e-good"};}};
    })});
}

// ---------- POPUP: kelola bisnis ----------
function bizPopup(id){
  const def=BUSINESS_TYPES.find(b=>b.id===id);const owned=C.businesses.find(b=>b.id===id);
  const next=owned.level+1;const canUp=next<def.tiers.length;const cost=canUp?def.upgrade[next]:0;
  const choices=[];
  if(canUp)choices.push({label:`Perluas jadi ${def.tiers[next]}`,sub:`💰${cost} · income jadi +${def.income[next]}/th`,cls:"love",disabled:C.coin<cost,
    run:()=>{C.coin-=cost;owned.level=next;return{t:`${def.name} diperluas jadi ${def.tiers[next]}!`,cls:"e-epic"};}});
  choices.push({label:"Jual bisnis",sub:`dapat ~${Math.round(def.buy*0.5)} keping`,cls:"danger",
    run:()=>{const g=Math.round(def.buy*0.5);C.coin+=g;C.businesses=C.businesses.filter(b=>b.id!==id);
      return{t:`Kau menjual ${def.name} seharga ${g} keping.`,cls:"e-bad"};}});
  openChoice({ico:def.ico,prompt:`Kelola <b>${def.name}</b>:`,choices});
}

// ---------- override resolveChoice: dukung _then (popup berantai) & non-activity popups ----------
resolveChoice=function(i){
  if(!pendingChoice)return; // guard: modal sudah tertutup (double-tap)
  const {data}=pendingChoice;
  if(data._isActivity&&!spendAction()){closeModal();return;}
  const res=data.choices[i].run();
  // MODE MENU: belum ada karakter aktif (mis. hapus slot di layar awal)
  // -> jangan sentuh logika game (log/stats/render) agar tak error
  if(!C||!C.stats){
    if(res&&res.t&&typeof toast==="function")toast(res.t);
    if(res&&res.chain){closeModal();openChoice(res.chain);return;}
    closeModal();return;
  }
  let then=null;
  if(res){
    if(res.t)log(C.age,res.t,res.cls);
    if(res.t)toast(res.t);
    if(res._then)then=res._then;
    if(res.chain){closeModal();openChoice(res.chain);return;}
  }
  closeModal();
  if(C.stats.health<=0){die("Pilihanmu membawamu pada ajal.");return;}
  checkMissions();updateTitle();renderAll();
  if(C.pendingDot&&currentTab!=="Relasi")document.getElementById("dotRelasi").classList.add("on");
  if(then)setTimeout(then,180); // lanjut popup berantai (sewa)
};
