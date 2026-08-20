// ============================================================
//  TAKDIR — PRIORITAS 3: Wardrobe, Gift, Haggle, Lelang
// ============================================================

// ---------- WARDROBE: 4 slot, banyak varian, bonus stat ----------
const WARDROBE_CATALOG={
  body:{ico:"👕",name:"Baju Badan",slot:"body",variants:[
    {key:"none",name:"Tanpa Baju",price:0,perk:{},desc:"Belum berpakaian layak."},
    {key:"tunic",name:"Tunik Linen",price:40,perk:{charm:2},desc:"Pakaian rakyat yang rapi."},
    {key:"silk",name:"Jubah Sutra",price:160,perk:{charm:5},desc:"Mewah & memikat."},
    {key:"leather_armor",name:"Zirah Kulit",price:220,perk:{might:3,health:2},desc:"Pelindung ringan."},
    {key:"plate",name:"Zirah Plat Baja",price:600,perk:{might:6,health:4},desc:"Zirah ksatria sejati."},
    {key:"arcane_robe",name:"Jubah Arcane",price:700,perk:{mana:7,mind:2},desc:"Bertenun benang sihir.",arcane:true},
  ]},
  legs:{ico:"👖",name:"Celana",slot:"legs",variants:[
    {key:"none",name:"Tanpa Celana",price:0,perk:{},desc:"Belum punya celana layak."},
    {key:"cloth",name:"Celana Kain",price:25,perk:{charm:1},desc:"Sederhana & nyaman."},
    {key:"riding",name:"Celana Berkuda",price:90,perk:{might:2,charm:1},desc:"Cocok untuk menunggang."},
    {key:"greaves",name:"Pelindung Kaki Baja",price:280,perk:{might:4,health:2},desc:"Greaves prajurit."},
  ]},
  feet:{ico:"👢",name:"Sepatu",slot:"feet",variants:[
    {key:"none",name:"Telanjang Kaki",price:0,perk:{},desc:"Tanpa alas kaki."},
    {key:"sandals",name:"Sandal Kulit",price:20,perk:{health:1},desc:"Alas kaki dasar."},
    {key:"boots",name:"Bot Perjalanan",price:75,perk:{health:2,might:1},desc:"Tahan medan berat."},
    {key:"warboots",name:"Bot Perang",price:240,perk:{might:3,health:2},desc:"Kokoh di medan tempur."},
    {key:"swift",name:"Bot Bertuah",price:520,perk:{charm:2,might:2,health:2},desc:"Ringan & ber-enchant.",arcane:true},
  ]},
  head:{ico:"🪖",name:"Penutup Kepala",slot:"head",variants:[
    {key:"none",name:"Tanpa Penutup",price:0,perk:{},desc:"Kepala terbuka."},
    {key:"hood",name:"Tudung Kain",price:30,perk:{mind:1},desc:"Sederhana, sedikit misterius."},
    {key:"circlet",name:"Lingkar Perak",price:150,perk:{charm:3,mind:1},desc:"Perhiasan kepala anggun."},
    {key:"helm",name:"Helm Baja",price:300,perk:{might:3,health:3},desc:"Lindungi kepala di perang."},
    {key:"mage_hat",name:"Topi Penyihir",price:400,perk:{mana:5,mind:2},desc:"Lambang penyihir sejati.",arcane:true},
  ]},
};

// pasang ke state saat newChar (via patch di bawah)
function ensureWardrobe(){
  if(!C.wardrobe)C.wardrobe={body:"none",legs:"none",feet:"none",head:"none"};
  // kepemilikan: pakaian harus DIBELI di toko dulu, baru bisa dipakai
  if(!C.wardrobeOwned)C.wardrobeOwned={body:["none"],legs:["none"],feet:["none"],head:["none"]};
  // migrasi save lama: yang sedang dipakai dianggap dimiliki
  for(const slot in C.wardrobe){
    if(!C.wardrobeOwned[slot])C.wardrobeOwned[slot]=["none"];
    if(!C.wardrobeOwned[slot].includes(C.wardrobe[slot]))C.wardrobeOwned[slot].push(C.wardrobe[slot]);
  }
}

// perks wardrobe dipanggil tiap tahun
function applyWardrobePerks(){
  ensureWardrobe();
  for(const slot in C.wardrobe){
    const cat=WARDROBE_CATALOG[slot];if(!cat)continue;
    const v=cat.variants.find(x=>x.key===C.wardrobe[slot]);
    if(v&&v.perk)applyStats(v.perk);
  }
}

// ---------- RENDER WARDROBE (di tab Aset, section baru) ----------
function wardrobeHTML(){
  ensureWardrobe();
  let html=`<div class="sechead">👗 Wardrobe (pakai bonus stat)</div>
    <p style="font-size:10.5px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 10px;line-height:1.4;">Lemari pakaianmu — hanya berisi yang sudah dibeli. Cari busana baru di <b>Dunia → Toko</b> 🛒 (Butik, Pandai Besi, Tukang Tongkat).</p>`;
  for(const slot in WARDROBE_CATALOG){
    const cat=WARDROBE_CATALOG[slot];
    const cur=cat.variants.find(v=>v.key===C.wardrobe[slot]);
    const perkStr=Object.entries(cur.perk||{}).map(([k,v])=>`${STAT_META[k]?STAT_META[k].name:k}+${v}`).join(" ")||"—";
    html+=`<div class="asset"><span class="assetico">${cat.ico}</span>
      <div class="assetinfo"><div class="assetname">${cur.name}</div>
        <div class="assetlvl">${cat.name} · ${perkStr}/th</div>
        <div class="assetdesc">${cur.desc}</div></div>
      <button class="upbtn" onclick="chooseWardrobePopup('${slot}')">Ganti</button></div>`;
  }
  return html;
}
function chooseWardrobePopup(slot){
  ensureWardrobe();
  const cat=WARDROBE_CATALOG[slot];
  const ownedKeys=C.wardrobeOwned[slot]||["none"];
  const choices=cat.variants.filter(v=>ownedKeys.includes(v.key)).map(v=>{
    const wearing=C.wardrobe[slot]===v.key;
    const perks=Object.entries(v.perk||{}).map(([k,val])=>`${STAT_META[k]?STAT_META[k].name:k}+${val}`).join(" ")||"—";
    return {label:`${v.name}${wearing?' ✓ dipakai':''}`,sub:perks+"/th",hint:v.desc,
      disabled:wearing,
      run:()=>{C.wardrobe[slot]=v.key;applyWardrobePerks();
        return{t:`Kau kini mengenakan ${v.name}.`,cls:"e-good"};}};
  });
  choices.push({label:"🛒 Cari busana baru di Toko",sub:"Butik, Pandai Besi & Tukang Tongkat",
    run:()=>{setTimeout(()=>switchTab('Toko'),120);return null;}});
  openChoice({ico:cat.ico,prompt:`<b>Lemari ${cat.name}</b><br><span style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6)">Pilih yang mau dipakai (${ownedKeys.length} dimiliki)</span>`,
    choices});
}

// ============================================================
//  GIFT — beri barang/kulit ke relasi
// ============================================================
// nilai hadiah menaikkan bond/loyalty sesuai harga item
function giftItemPopup(itemKey){
  const it=ITEM_CATALOG.find(x=>x.key===itemKey);if(!it)return;
  if(!C.relations.length){toast("Belum ada relasi untuk diberi hadiah.");return;}
  openChoice({ico:"🎁",prompt:`Beri <b>${it.name}</b> kepada siapa?`,
    choices:C.relations.map(r=>({label:`${r.ico} ${r.name}`,sub:r.role,run:()=>{
      C.inventory[itemKey]--;
      const val=it.price||15;
      const boost=Math.min(20,Math.round(val/8)+ri(3,7));
      if(r.role==="pengikut")r.loyalty=clamp(r.loyalty+boost);
      else r.bond=clamp(r.bond+boost);
      applyStats({happy:+2});
      return{t:`Kau memberi ${it.name} pada ${r.name}. ${r.role==="pengikut"?"Loyalitas":"Ikatan"} +${boost}.`,cls:"e-good"};
    }}))});
}

// ============================================================
//  HAGGLE — tawar harga saat beli item
// ============================================================
// peluang sukses berbasis Pesona; sukses = diskon, gagal = harga naik/penjual marah
function haggleItem(itemKey){
  const it=ITEM_CATALOG.find(x=>x.key===itemKey);if(!it||it.price<=0)return;
  if(!spendAction())return;
  const res=skillRoll(C.stats.charm,45);
  playAnim(res.win?"win":"lose",{text:res.win?"NEGO!":"GAGAL"});
  setTimeout(()=>{
    if(res.win){
      const disc=Math.round(it.price*(0.15+res.margin*0.3));
      const price=it.price-disc;
      if(C.coin>=price){C.coin-=price;addItem(itemKey);
        finishAct(`Tawar berhasil! ${it.name} cuma ${price} (hemat ${disc}).`,"e-good");}
      else finishAct(`Nego berhasil (${price}) tapi koinmu tetap kurang.`,"e-bad");
    }else{
      finishAct(`Penjual tersinggung tawaranmu. ${it.name} tak jadi dibeli.`,"e-bad");
    }
  },700);
}

// ============================================================
//  LELANG — jual barang via lelang (hasil bervariasi)
// ============================================================
function auctionItem(itemKey){
  const it=ITEM_CATALOG.find(x=>x.key===itemKey);if(!it)return;
  if((C.inventory[itemKey]||0)<1){toast("Barang tak ada di tas.");return;}
  if(!spendAction())return;
  playAnim("coin");
  setTimeout(()=>{
    C.inventory[itemKey]--;
    const base=it.price||15;
    // lelang: 0.5x - 2.2x harga dasar, dipengaruhi pesona & keberuntungan
    const roll=0.5+Math.random()*1.4+C.stats.charm/200;
    const sale=Math.max(1,Math.round(base*roll));
    C.coin+=sale;
    finishAct(`Lelang ${it.name} laku ${sale} keping!`,"e-good","coin",`+${sale}💰`);
  },700);
}

// jual cepat (setengah harga, tanpa aksi)
function sellItem(itemKey){
  const it=ITEM_CATALOG.find(x=>x.key===itemKey);if(!it)return;
  if((C.inventory[itemKey]||0)<1)return;
  C.inventory[itemKey]--;
  const g=Math.max(1,Math.round((it.price||15)*0.5));
  C.coin+=g;
  finishAct(`Kau menjual cepat ${it.name} (+${g}).`,"e-good","coin");
}

// jadikan bahan sihir (jika mage & mana cukup) -> mana +
function enchantItem(itemKey){
  const it=ITEM_CATALOG.find(x=>x.key===itemKey);if(!it)return;
  if(!C.isMage){toast("Hanya penyihir bisa.");return;}
  if((C.inventory[itemKey]||0)<1)return;
  C.inventory[itemKey]--;
  applyStats({mana:+ri(4,9)});
  finishAct(`Kau menyerap esensi ${it.name} jadi mana.`,"e-arcane","win");
}

// ---------- POPUP aksi item (dipanggil dari tab Tas) ----------
function itemActionPopup(itemKey){
  const it=ITEM_CATALOG.find(x=>x.key===itemKey);if(!it)return;
  const choices=[];
  if(it.use&&!it.noBuy)choices.push({label:"Pakai",sub:it.desc,cls:"love",run:()=>{closeModal();setTimeout(()=>useItem(itemKey),100);return null;}});
  choices.push({label:"🎁 Hadiahkan",sub:"beri ke relasi (naikkan ikatan)",run:()=>{closeModal();setTimeout(()=>giftItemPopup(itemKey),120);return null;}});
  choices.push({label:"⚖️ Lelang",sub:"jual via lelang (hasil bervariasi)",run:()=>{closeModal();setTimeout(()=>auctionItem(itemKey),120);return null;}});
  choices.push({label:"💰 Jual cepat",sub:"setengah harga, instan",run:()=>{sellItem(itemKey);return null;}});
  if(C.isMage)choices.push({label:"✨ Jadikan bahan sihir",sub:"ubah jadi mana",cls:"arcane",run:()=>{enchantItem(itemKey);return null;}});
  openChoice({ico:it.ico,prompt:`<b>${it.name}</b> ×${C.inventory[itemKey]}:`,choices});
}

// ============================================================
//  PRIORITAS 3 — Patch integrasi
// ============================================================

// ---------- wardrobe ke state ----------
const _p3NewChar=newChar;
newChar=function(originId){
  const c=_p3NewChar(originId);
  c.wardrobe={body:"none",legs:"none",feet:"none",head:"none"};
  return c;
};

// ---------- wardrobe perks tiap tahun (sisipkan ke processYearly) ----------
const _p3ProcessYearly=processYearly;
processYearly=function(){
  if(typeof applyWardrobePerks==="function")applyWardrobePerks();
  _p3ProcessYearly();
};

// ---------- render wardrobe di tab Aset (sisipkan di akhir) ----------
const _p3RenderAset=renderAset;
renderAset=function(){
  _p3RenderAset();
  const host=document.getElementById("viewAset");
  if(host&&typeof wardrobeHTML==="function")host.innerHTML+=wardrobeHTML();
};

// ---------- tab Tas: barang -> popup aksi (pakai/gift/lelang/jual/sihir) ----------
const _p3RenderInventory=renderInventory;
renderInventory=function(){
  // bangun ulang bagian "Tas" dgn tombol Kelola (popup aksi)
  _p3RenderInventory();
  const host=document.getElementById("viewInventory");
  if(!host)return;
  // ganti tombol "Pakai" lama menjadi "Kelola" via re-render khusus bagian tas
  // (lebih simpel: tambahkan instruksi di atas)
};

// TAS: hanya barang yang sudah dimiliki (etalase pindah ke Dunia -> Toko)
renderInventory=function(){
  let html=`<div class="sechead">Tas (${Object.values(C.inventory).reduce((a,b)=>a+b,0)})</div>
    <p style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 10px;line-height:1.5;">Barangmu bisa dipakai, dihadiahkan, dilelang, dijual, atau (penyihir) jadi bahan sihir. Belanja barang baru di <b>Dunia → Toko</b> 🛒.</p>`;
  const owned=Object.keys(C.inventory).filter(k=>C.inventory[k]>0);
  if(!owned.length){
    html+=`<div style="text-align:center;padding:26px 10px;">
      <div style="font-size:34px;margin-bottom:8px;">🎒</div>
      <p style="font-size:12px;color:var(--ink-soft);filter:brightness(1.6);margin-bottom:14px;">Tasmu masih kosong.</p>
      <button class="upbtn" onclick="switchTab('Toko')">🛒 Kunjungi Toko</button></div>`;
  }else{
    owned.forEach(k=>{const it=ITEM_CATALOG.find(x=>x.key===k);if(!it)return;
      html+=`<div class="asset"><span class="assetico">${it.ico}</span>
        <div class="assetinfo"><div class="assetname">${it.name} <span style="color:var(--gold)">×${C.inventory[k]}</span></div>
          <div class="assetlvl">${it.reusable?'♻️ Reusable':'Sekali pakai'}</div>
          <div class="assetdesc">${it.desc}</div></div>
        <button class="upbtn" onclick="itemActionPopup('${k}')">Kelola</button></div>`;});
  }
  document.getElementById("viewInventory").innerHTML=html;
};

// TOKO: distrik perbelanjaan — hub toko-toko spesialis (view di bawah tab Dunia)
function renderToko(){
  const host=document.getElementById("viewToko");if(!host)return;
  const city=typeof currentCity==="function"?currentCity():{name:""};
  const stores=(typeof storesInCity==="function")?storesInCity():[];
  const shops=stores.filter(s=>s.cat!=="Bimbel"&&s.cat!=="Perguruan");
  const edu=stores.filter(s=>s.cat==="Bimbel"||s.cat==="Perguruan");
  window._tokoSub=null;
  let html=`<div class="sechead">🛒 Distrik Perbelanjaan — ${city.name}</div>
    <p style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 10px;line-height:1.5;">Tiap kota punya toko berbeda & 📦 <b>stok berganti tiap tahun</b> — mampirlah rutin, selalu ada yang baru! Busana dibeli di sini lalu dipakai lewat <b>Aset → Wardrobe</b> 👗.</p>
    <div class="tiles">
      <div class="tile" onclick="openKelontong()"><span class="badge">UMUM</span>
        <span class="ti">🏪</span><span class="tn">Toko Kelontong</span>
        <span class="td">Ramuan, jimat & barang serbaguna — bisa ditawar</span></div>`;
  shops.forEach(s=>{
    html+=`<div class="tile" onclick="openStore('${s.id}')">
      <span class="ti">${s.ico}</span><span class="tn">${s.name}</span>
      <span class="td">${s.cat} · ${s.desc}</span></div>`;});
  html+=`</div>`;
  if(!shops.find(s=>s.id==="jeweler")){
    html+=`<div class="tiles" style="margin-top:9px"><div class="tile locked fullrow">
      <span class="ti">💍</span><span class="tn">Tukang Permata (cincin lamaran)</span>
      <span class="td">🔒 hanya di Aetheria & Saltmoor — berlayar lewat Peta untuk membeli cincin</span></div></div>`;
  }
  if(edu.length){
    html+=`<div class="sechead">🎓 Bimbel & Perguruan</div>
      <p style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 10px;line-height:1.5;">Kursus spesialis menaikkan <b>Keahlian</b> bertingkat (maks. Tingkat 5, bonus stat pasif tiap tahun). Memakai ⚡ aksi.</p>
      <div class="tiles">`;
    edu.forEach(s=>{
      html+=`<div class="tile arcane" onclick="openStore('${s.id}')">
        <span class="ti">${s.ico}</span><span class="tn">${s.name}</span>
        <span class="td">${s.cat} · ${s.desc}</span></div>`;});
    html+=`</div>`;
  }
  host.innerHTML=html;
}

// KELONTONG: etalase barang umum (Beli / Tawar) dengan tombol kembali
function openKelontong(){
  const host=document.getElementById("viewToko");if(!host)return;
  window._tokoSub="kelontong";
  let html=`<button class="save-btn" style="margin:2px 2px 10px;width:auto;padding:8px 14px" onclick="renderToko()">← Distrik Perbelanjaan</button>
    <div class="sechead">🏪 Toko Kelontong</div>
    <p style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 10px;line-height:1.5;">Beli langsung, atau <b>tawar</b> (haggle) pakai Pesona untuk diskon. 📦 Stok berganti tiap tahun.</p>`;
  let goods=ITEM_CATALOG.filter(it=>(!it.arcane||C.isMage)&&!it.noBuy);
  if(typeof mantaraStockRng==="function"){
    const rng=mantaraStockRng("kelontong");
    const kept=goods.filter(()=>rng()<0.72);
    if(kept.length>=3)goods=kept;
  }
  goods.forEach(it=>{
    const owned=C.inventory[it.key]||0;const afford=C.coin>=it.price;
    html+=`<div class="asset"><span class="assetico">${it.ico}</span>
      <div class="assetinfo"><div class="assetname">${it.name} ${owned?`<span style="color:var(--gold)">×${owned}</span>`:''}</div>
        <div class="assetlvl">${it.reusable?'♻️ Reusable':'Sekali pakai'} · 💰${it.price}</div>
        <div class="assetdesc">${it.desc}</div></div>
      <div style="display:flex;flex-direction:column;gap:5px">
        <button class="upbtn" ${afford?`onclick="buyItem('${it.key}')"`:'disabled'}>Beli</button>
        <button class="upbtn" style="background:rgba(255,255,255,.08);color:var(--parchment)" onclick="haggleItem('${it.key}')">Tawar</button>
      </div></div>`;});
  host.innerHTML=html;
}

// ---------- perkaya aksi relasi KELUARGA ----------
// tambah: berburu bareng, beri hadiah (buka inventory gift), rawat saat tua
(function(){
  REL_ACTIONS.keluarga=[
    {label:"Mengobrol",run:r=>{r.bond=clamp(r.bond+ri(4,9));applyStats({happy:+4});return `Kau mengobrol hangat dengan ${r.name}.`;}},
    {label:"Berburu bareng",run:r=>{if(C.age<12)return "Kamu masih terlalu muda untuk berburu.";r.bond=clamp(r.bond+ri(6,12));
      if(C.stats.might>40&&chance(0.6)){const g=ri(15,40);C.coin+=g;if(typeof addItem==="function")addItem("hide");applyStats({might:+2});return `Kau & ${r.name} berburu sukses! +${g} keping & kulit. Ikatan menguat.`;}
      applyStats({happy:+4});return `Kau & ${r.name} berburu bareng, walau hasil sedikit. Ikatan menguat.`;}},
    {label:"Beri hadiah",run:r=>{const items=Object.keys(C.inventory).filter(k=>C.inventory[k]>0);
      if(!items.length){return "Tasmu kosong — beli barang dulu di Dunia → Toko.";}
      // buka popup pilih item utk dihadiahkan ke r ini
      setTimeout(()=>giftToSpecific(r.id),120);return `Pilih hadiah untuk ${r.name}...`;}},
    {label:"Minta warisan",run:r=>{const g=ri(30,90);C.coin+=g;r.bond=clamp(r.bond-ri(6,14));return `${r.name} memberimu ${g} keping, meski enggan.`;}},
  ];
})();

// gift ke relasi spesifik (dipakai dari aksi keluarga "beri hadiah")
function giftToSpecific(relId){
  const r=C.relations.find(x=>x.id===relId);if(!r)return;
  const items=Object.keys(C.inventory).filter(k=>C.inventory[k]>0);
  if(!items.length){toast("Tas kosong.");return;}
  openChoice({ico:"🎁",prompt:`Beri hadiah apa untuk <b>${r.name}</b>?`,
    choices:items.map(k=>{const it=ITEM_CATALOG.find(x=>x.key===k);
      return {label:`${it.ico} ${it.name}`,sub:`×${C.inventory[k]}`,run:()=>{
        C.inventory[k]--;const val=it.price||15;const boost=Math.min(20,Math.round(val/8)+ri(3,7));
        if(r.role==="pengikut")r.loyalty=clamp(r.loyalty+boost);else r.bond=clamp(r.bond+boost);
        applyStats({happy:+2});
        return{t:`Kau memberi ${it.name} pada ${r.name}. ${r.role==="pengikut"?"Loyalitas":"Ikatan"} +${boost}.`,cls:"e-good"};
      }};})});
}
