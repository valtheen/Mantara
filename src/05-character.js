// ============================================================
//  TAKDIR v5 — Kustomisasi, Appearance, Net Worth, Inventory
// ============================================================

// ---------- APPEARANCE OPTIONS ----------
// avatar dirakit dari komponen emoji; disimpan di C.appearance
const SKIN_TONES=[
  {key:"light",label:"Terang",mod:"🏻"},
  {key:"medium-light",label:"Sedang Terang",mod:"🏼"},
  {key:"medium",label:"Sedang",mod:"🏽"},
  {key:"medium-dark",label:"Sedang Gelap",mod:"🏾"},
  {key:"dark",label:"Gelap",mod:"🏿"},
];
const HAIR_STYLES=[
  {key:"none",label:"Biasa"},
  {key:"curly",label:"Keriting",emoji:"🦱"},
  {key:"straight",label:"Lurus",emoji:"🦰"},
  {key:"white",label:"Putih",emoji:"🦳"},
  {key:"bald",label:"Botak",emoji:"🦲"},
];

// builder: kembalikan emoji wajah sesuai umur+gender+skin
function buildAvatar(ap, age, isMage, alive){
  if(!alive)return "💀";
  const m = ap && ap.skin ? (SKIN_TONES.find(s=>s.key===ap.skin)||{}).mod || "" : "";
  const fem = ap ? ap.female : false;
  if(isMage && age>=16) return (fem?"🧙‍♀️":"🧙‍♂️"); // mage tidak pakai skin mod (ZWJ)
  if(age<3) return "👶"+m;
  if(age<13) return "🧒"+m;
  if(age<18) return (fem?"👧":"👦")+m;
  if(age<55) return (fem?"👩":"👨")+m;
  return (fem?"👵":"👴")+m;
}

// preview avatar besar di layar kustomisasi (selalu dewasa)
function previewAvatar(ap){
  const m=(SKIN_TONES.find(s=>s.key===ap.skin)||{}).mod||"";
  return (ap.female?"👩":"👨")+m;
}

// ---------- DRAFT (karakter yg sedang dikustomisasi) ----------
let draft=null;
const SKILL_POINTS_TOTAL=15; // poin awal yg bisa dialokasi
const DRAFT_SKILL_KEYS=["might","mind","charm","mana"]; // health & happy fixed base

function initDraft(originId){
  const o=ORIGINS.find(x=>x.id===originId);
  draft={
    originId, female:chance(0.5),
    name:randName(false),
    appearance:{female:false, skin:"medium", hair:"none"},
    // base dari origin, tapi 4 stat alokasi dimulai dari floor lalu user tambah
    baseStats:{...o.stats},
    alloc:{might:0,mind:0,charm:0,mana:0},
    pointsLeft:SKILL_POINTS_TOTAL,
  };
  draft.appearance.female=draft.female;
  draft.name=randName(draft.female);
}

// ============================================================
//  NET WORTH
// ============================================================
function netWorth(){
  let total=C.coin;
  C.properties.forEach(p=>{const def=PROPERTY_CATALOG.find(x=>x.key===p.key);if(def)total+=Math.round(def.price*0.6);});
  C.businesses.forEach(b=>{const def=BUSINESS_TYPES.find(x=>x.id===b.id);if(def)total+=Math.round(def.buy*0.5);});
  for(const cat in C.gear){const v=GEAR_CATALOG[cat].variants.find(x=>x.key===C.gear[cat]);if(v&&v.price)total+=Math.round(v.price*0.5);}
  return total;
}

// ============================================================
//  INVENTORY — barang sekali beli, bisa dipakai ulang
// ============================================================
// konsumabel & item dipakai-ulang. C.inventory: {key:qty}
const ITEM_CATALOG=[
  {key:"health_potion",ico:"🧪",name:"Ramuan Nyawa",price:40,reusable:false,
    desc:"Pulihkan Nyawa +25.",use:()=>{applyStats({health:+25});return "Kau meminum ramuan, Nyawa +25.";}},
  {key:"mana_potion",ico:"🔵",name:"Ramuan Mana",price:45,reusable:false,arcane:true,
    desc:"Pulihkan Mana +25.",use:()=>{applyStats({mana:+25});return "Kau meminum ramuan mana, Mana +25.";}},
  {key:"charm_perfume",ico:"🌸",name:"Parfum Pesona",price:60,reusable:true,
    desc:"Pakai untuk Pesona +5 (bisa dipakai ulang).",use:()=>{applyStats({charm:+5});return "Aroma memikat menyelimutimu, Pesona +5.";}},
  {key:"lucky_coin",ico:"🪙",name:"Koin Keberuntungan",price:120,reusable:true,
    desc:"Pakai: 50% dapat 30-100 keping.",use:()=>{if(chance(0.5)){const g=ri(30,100);C.coin+=g;return `Keberuntungan! +${g} keping.`;}return "Koin tak membawa hoki kali ini.";}},
  {key:"training_manual",ico:"📓",name:"Manual Latihan",price:80,reusable:true,
    desc:"Pakai: Kekuatan +4.",use:()=>{applyStats({might:+4});return "Kau berlatih dari manual, Kekuatan +4.";}},
  {key:"ancient_scroll",ico:"📜",name:"Gulungan Kuno",price:90,reusable:true,
    desc:"Pakai: Akal +5.",use:()=>{applyStats({mind:+5});return "Pengetahuan kuno menyerap ke pikiranmu, Akal +5.";}},
];

function addItem(key,qty=1){C.inventory[key]=(C.inventory[key]||0)+qty;}
function useItem(key){
  if(!C.inventory[key]||C.inventory[key]<=0)return;
  const def=ITEM_CATALOG.find(x=>x.key===key);if(!def)return;
  const msg=def.use();
  if(!def.reusable)C.inventory[key]--;
  log(C.age,msg,"e-good");toast(msg);
  if(C.stats.health<=0){die("Akibat fatal.");return;}
  updateTitle();renderAll();
}

// ============================================================
//  TAKDIR v5 — Patch (kustomisasi, bayi-mulai-0, net worth, inventory)
// ============================================================

// ---------- override newChar: terima draft, bayi mulai 0 ----------
const _v4NewChar=newChar;
newChar=function(originId){
  const c=_v4NewChar(originId);
  c.appearance={female:c.female,skin:"medium",hair:"none"};
  c.inventory={};
  c.familyWealth=c.coin;   // harta keluarga (konteks origin)
  c.coin=0;                // BAYI mulai dari 0 — tak punya uang sendiri
  c.allowance=false;       // belum dapat akses harta keluarga
  return c;
};

// ---------- buat karakter dari draft kustomisasi ----------
function createFromDraft(){
  C=newChar(draft.originId);
  C.female=draft.female;
  C.name=draft.name;
  C.appearance={...draft.appearance,female:draft.female};
  // terapkan alokasi skill ke base
  for(const k of DRAFT_SKILL_KEYS) C.stats[k]=clamp(C.stats[k]+draft.alloc[k]);
  initMissions();C._log=[];
  const o=ORIGINS.find(x=>x.id===draft.originId);
  log(0,`${C.name} lahir sebagai ${o.name}. ${o.desc}`,"e-epic");
  // orang tua: nama depan acak + nama marga keluarga (surname karakter)
  const famSurname=C.name.split(" ").slice(1).join(" ")||rand(SURNAME);
  const mom=makeRel("keluarga",{female:true,bond:ri(60,80)});mom.name=uniqueFamilyName(true,famSurname);mom.kin="Ibu";C.relations.push(mom);
  const dad=makeRel("keluarga",{female:false,bond:ri(55,75)});dad.name=uniqueFamilyName(false,famSurname);dad.kin="Ayah";C.relations.push(dad);
}

// ---------- override buildAvatar usage di render ----------
function portraitEmoji(){return buildAvatar(C.appearance,C.age,C.isMage,C.alive);}

// ============================================================
//  TAB INVENTORY (barang dipakai ulang)
// ============================================================
function renderInventory(){
  let html=`<div class="sechead">Toko Barang</div><p style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 10px;line-height:1.5;">Beli barang sekali. Barang reusable bisa dipakai berkali-kali; konsumabel habis sekali pakai.</p>`;
  ITEM_CATALOG.filter(it=>(!it.arcane||C.isMage)&&!it.noBuy).forEach(it=>{
    const owned=C.inventory[it.key]||0;const afford=C.coin>=it.price;
    html+=`<div class="asset"><span class="assetico">${it.ico}</span>
      <div class="assetinfo"><div class="assetname">${it.name} ${owned?`<span style="color:var(--gold)">×${owned}</span>`:''}</div>
        <div class="assetlvl">${it.reusable?'♻️ Bisa dipakai ulang':'Sekali pakai'}</div>
        <div class="assetdesc">${it.desc}</div></div>
      <button class="upbtn" ${afford?`onclick="buyItem('${it.key}')"`:'disabled'}>Beli<br>💰${it.price}</button>
    </div>`;});

  html+=`<div class="sechead">Tas (${Object.values(C.inventory).reduce((a,b)=>a+b,0)})</div>`;
  const owned=Object.keys(C.inventory).filter(k=>C.inventory[k]>0);
  if(!owned.length){
    html+=`<p style="font-size:12px;color:var(--ink-soft);filter:brightness(1.6);text-align:center;padding:20px 10px;">Tas kosong. Beli barang di atas.</p>`;
  }else{
    owned.forEach(k=>{const it=ITEM_CATALOG.find(x=>x.key===k);
      html+=`<div class="asset"><span class="assetico">${it.ico}</span>
        <div class="assetinfo"><div class="assetname">${it.name} <span style="color:var(--gold)">×${C.inventory[k]}</span></div>
          <div class="assetlvl">${it.reusable?'♻️ Reusable':'Sekali pakai'}</div>
          <div class="assetdesc">${it.desc}</div></div>
        <button class="upbtn" onclick="useItem('${k}')">Pakai</button></div>`;});
  }
  document.getElementById("viewInventory").innerHTML=html;
}
function buyItem(key){
  const it=ITEM_CATALOG.find(x=>x.key===key);if(C.coin<it.price){toast("Koin tidak cukup.");return;}
  C.coin-=it.price;addItem(key);toast(`${it.name} dibeli & masuk tas 🎒.`);
  renderInventory();renderHidup();
  // refresh layar toko yang sedang terbuka (etalase kelontong / hub distrik)
  if(window._tokoSub==="kelontong"&&typeof openKelontong==="function")openKelontong();
  else if(typeof renderToko==="function")renderToko();
}

// ============================================================
//  LAYAR KUSTOMISASI
// ============================================================
function renderCustomize(){
  const o=ORIGINS.find(x=>x.id===draft.originId);
  const skinBtns=SKIN_TONES.map(s=>`<button class="optbtn ${draft.appearance.skin===s.key?'sel':''}" onclick="setSkin('${s.key}')">${(draft.female?'👩':'👨')+s.mod}</button>`).join("");
  const skillRows=DRAFT_SKILL_KEYS.map(k=>{
    const base=draft.baseStats[k];const add=draft.alloc[k];const tot=clamp(base+add);
    return `<div class="skillrow">
      <span class="sk-name">${STAT_META[k].name}</span>
      <div class="sk-ctrl">
        <button class="sk-btn" onclick="allocSkill('${k}',-1)">−</button>
        <span class="sk-val">${tot}</span>
        <button class="sk-btn" onclick="allocSkill('${k}',1)">+</button>
      </div>
      <div class="bar" style="margin-top:5px"><div class="fill ${STAT_META[k].cls}" style="width:${tot}%"></div></div>
    </div>`;}).join("");
  document.getElementById("customizeScreen").innerHTML=`
    <div class="cust-wrap">
      <div class="sechead">${o.ico} ${o.name}</div>
      <div class="cust-avatar">
        <div class="cust-face">${previewAvatar(draft.appearance)}</div>
      </div>

      <div class="cust-field">
        <label>Nama</label>
        <div class="name-row">
          <input id="nameInput" class="nameinput" value="${draft.name}" oninput="draft.name=this.value" maxlength="28"/>
          <button class="mini-btn" onclick="rerollName()">🎲</button>
        </div>
      </div>

      <div class="cust-field">
        <label>Jenis Kelamin</label>
        <div class="seg">
          <button class="seg-btn ${!draft.female?'sel':''}" onclick="setGender(false)">♂ Lelaki</button>
          <button class="seg-btn ${draft.female?'sel':''}" onclick="setGender(true)">♀ Perempuan</button>
        </div>
      </div>

      <div class="cust-field">
        <label>Warna Kulit</label>
        <div class="opt-row">${skinBtns}</div>
      </div>

      <div class="cust-field">
        <label>Alokasi Keahlian Awal · sisa poin: <b id="ptsLeft">${draft.pointsLeft}</b></label>
        <div class="skill-alloc">${skillRows}</div>
      </div>

      <button class="btn-age" style="margin-top:6px" onclick="confirmCustomize()">Lahir ke Dunia ▸</button>
      <button class="mchoice mc-cancel" style="margin-top:8px;width:100%" onclick="backToOrigins()">↩ Ganti Asal-usul</button>
    </div>`;
}
function setSkin(k){draft.appearance.skin=k;renderCustomize();}
function setGender(f){draft.female=f;draft.appearance.female=f;draft.name=randName(f);renderCustomize();}
function rerollName(){draft.name=randName(draft.female);document.getElementById("nameInput").value=draft.name;}
function allocSkill(k,dir){
  if(dir>0){if(draft.pointsLeft<=0){toast("Poin habis.");return;}draft.alloc[k]++;draft.pointsLeft--;}
  else{if(draft.alloc[k]<=0)return;draft.alloc[k]--;draft.pointsLeft++;}
  renderCustomize();
}
function confirmCustomize(){
  createFromDraft();
  document.getElementById("customizeScreen").classList.add("hidden");
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("overScreen").classList.add("hidden");
  document.getElementById("tabbar").classList.remove("hidden");
  document.getElementById("agewrap").classList.remove("hidden");
  switchTab("Hidup");
}
function backToOrigins(){
  document.getElementById("customizeScreen").classList.add("hidden");
  document.getElementById("startScreen").classList.remove("hidden");
}

// origin dipilih -> buka kustomisasi (bukan langsung mulai)
function beginLife(){
  initDraft(chosenOrigin);
  document.getElementById("startScreen").classList.add("hidden");
  document.getElementById("customizeScreen").classList.remove("hidden");
  renderCustomize();
}

// ---------- override switchTab untuk tab Inventory + nav baru ----------
switchTab=function(name){
  currentTab=name;
  document.querySelectorAll(".tab").forEach(t=>t.classList.toggle("active",t.dataset.view===name));
  ["Hidup","Aktivitas","Relasi","Peta","Aset","Inventory","Toko","Karir"].forEach(v=>{
    const el=document.getElementById("view"+v);if(el)el.classList.toggle("hidden",v!==name);});
  document.getElementById("agewrap").classList.toggle("hidden",name!=="Hidup");
  if(name==="Hidup")renderHidup();if(name==="Aktivitas")renderAktivitas();
  if(name==="Relasi")renderRelasi();if(name==="Peta")renderPeta();
  if(name==="Aset")renderAset();if(name==="Inventory")renderInventory();
  if(name==="Toko")renderToko();
  if(name==="Karir"&&typeof renderKarir==="function")renderKarir();
};
const _v4RenderAll=renderAll;
renderAll=function(){renderHidup();
  if(currentTab==="Aktivitas")renderAktivitas();if(currentTab==="Relasi")renderRelasi();
  if(currentTab==="Peta")renderPeta();if(currentTab==="Aset")renderAset();
  if(currentTab==="Inventory")renderInventory();if(currentTab==="Toko")renderToko();
  if(currentTab==="Karir"&&typeof renderKarir==="function")renderKarir();};
