// ============================================================
//  TAKDIR — POLISH RILIS (production cleanup + audio)
// ============================================================

// ============================================================
//  2) SOUND EFFECT — Web Audio API (tanpa file eksternal)
// ============================================================
// nada-nada pendek di-generate; ringan, tak butuh aset, cocok utk web/iOS.
let _audioCtx=null;
let _soundOn=true;
let _audioUnlocked=false;   // baru true setelah gestur user pertama

function _ac(){
  // JANGAN buat AudioContext sebelum user berinteraksi (kebijakan Safari/iOS).
  if(!_audioUnlocked)return null;
  if(_audioCtx)return _audioCtx;
  try{
    const AC=window.AudioContext||window.webkitAudioContext;
    if(!AC)return null;
    _audioCtx=new AC();
  }catch(e){_audioCtx=null;}
  return _audioCtx;
}

// mainkan satu nada
function _tone(freq,dur,type,vol,delay){
  if(!_soundOn)return;
  const ac=_ac();if(!ac)return;
  try{
    const t0=ac.currentTime+(delay||0);
    const osc=ac.createOscillator();
    const gain=ac.createGain();
    osc.type=type||"sine";
    osc.frequency.setValueAtTime(freq,t0);
    gain.gain.setValueAtTime(0.0001,t0);
    gain.gain.exponentialRampToValueAtTime(vol||0.12,t0+0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001,t0+(dur||0.12));
    osc.connect(gain);gain.connect(ac.destination);
    osc.start(t0);osc.stop(t0+(dur||0.12)+0.02);
  }catch(e){}
}

// pustaka SFX
const SFX={
  tap:()=>_tone(420,0.06,"triangle",0.07),
  confirm:()=>{_tone(523,0.08,"sine",0.1);_tone(659,0.1,"sine",0.1,0.07);},
  win:()=>{_tone(523,0.1,"sine",0.12);_tone(659,0.1,"sine",0.12,0.09);_tone(784,0.16,"sine",0.12,0.18);},
  lose:()=>{_tone(330,0.14,"sawtooth",0.1);_tone(247,0.2,"sawtooth",0.1,0.12);},
  coin:()=>{_tone(880,0.05,"square",0.08);_tone(1175,0.08,"square",0.08,0.05);},
  levelup:()=>{_tone(523,0.09,"sine",0.12);_tone(659,0.09,"sine",0.12,0.08);_tone(784,0.09,"sine",0.12,0.16);_tone(1047,0.18,"sine",0.12,0.24);},
  death:()=>{_tone(294,0.2,"sawtooth",0.1);_tone(220,0.3,"sawtooth",0.1,0.18);_tone(147,0.4,"sawtooth",0.1,0.4);},
  year:()=>_tone(392,0.1,"sine",0.07),
};

function playSFX(name){try{if(SFX[name])SFX[name]();}catch(e){}}

// ----- hook SFX ke aksi game (non-invasif) -----
(function installSFX(){
  // klik pilihan
  if(typeof resolveChoice==="function"){
    const _sfx_prevResolve=resolveChoice;
    resolveChoice=function(i){playSFX("tap");return _sfx_prevResolve.apply(this,arguments);};
  }
  // hasil aktivitas (finishAct) -> bunyi sesuai cls
  if(typeof finishAct==="function"){
    const _sfx_prevFinish=finishAct;
    finishAct=function(msg,cls){
      if(cls==="e-bad")playSFX("lose");
      else if(cls==="e-epic")playSFX("win");
      else playSFX("confirm");
      return _sfx_prevFinish.apply(this,arguments);
    };
  }
  // ganti tahun
  if(typeof advanceYear==="function"){
    const _sfx_prevYear=advanceYear;
    advanceYear=function(){playSFX("year");return _sfx_prevYear.apply(this,arguments);};
  }
  // koin bertambah (lewat updateTitle yg sudah memantau coin)
  if(typeof flashCoin==="function"){
    const _sfx_prevFlash=flashCoin;
    flashCoin=function(){playSFX("coin");return _sfx_prevFlash.apply(this,arguments);};
  }
  // kematian
  if(typeof die==="function"){
    const _sfx_prevDie=die;
    die=function(){playSFX("death");return _sfx_prevDie.apply(this,arguments);};
  }
  // promosi karir / lulus -> level up (via log penanda) — hook ringan di applyCareer
  if(typeof applyCareer==="function"){
    const _sfx_prevCareer=applyCareer;
    applyCareer=function(){playSFX("levelup");return _sfx_prevCareer.apply(this,arguments);};
  }
})();

// ----- toggle suara (tombol di tab Hidup) -----
function toggleSound(){
  _soundOn=!_soundOn;
  if(_soundOn){try{const ac=_ac();if(ac&&ac.state==="suspended"&&ac.resume)ac.resume();}catch(e){}playSFX("confirm");}
  try{window.localStorage.setItem("takdir_sound",_soundOn?"1":"0");}catch(e){}
  if(typeof renderHidup==="function")renderHidup();
}
function loadSoundPref(){
  try{const v=window.localStorage.getItem("takdir_sound");if(v==="0")_soundOn=false;}catch(e){}
}
loadSoundPref();

// iOS butuh audio di-"unlock" oleh gestur user pertama
(function unlockAudioOnFirstTap(){
  function unlock(){
    _audioUnlocked=true;                 // izinkan pembuatan AudioContext
    try{const ac=_ac();if(ac&&ac.state==="suspended"&&ac.resume)ac.resume();}catch(e){}
    try{document.removeEventListener("touchstart",unlock);document.removeEventListener("click",unlock);}catch(e){}
  }
  try{
    document.addEventListener("touchstart",unlock,{once:true});
    document.addEventListener("click",unlock,{once:true});
  }catch(e){}
})();

// tombol toggle suara di tab Hidup (sisipkan ke save-row area)
(function installSoundButton(){
  if(typeof renderHidup!=="function")return;
  const _snd_prevRenderHidup=renderHidup;
  renderHidup=function(){
    _snd_prevRenderHidup.apply(this,arguments);
    const host=document.getElementById("viewHidup");
    if(!host||!C||!C.alive)return;
    host.innerHTML+=`<div class="save-row" style="margin-top:8px">
      <button class="save-btn" onclick="toggleSound()">${_soundOn?'🔊 Suara: ON':'🔇 Suara: OFF'}</button>
    </div>`;
  };
})();
// ============================================================
//  TAKDIR — FONDASI IAP (non-predatori, fair-to-free)
// ============================================================
// PRINSIP: game gratis tetap LENGKAP. IAP hanya menambah konten/kosmetik
// OPSIONAL. Tidak ada pay-to-win (tidak jual aksi/koin/stat/skip).
//
// CATATAN TEKNIS: IAP asli butuh StoreKit (native Xcode). Modul ini adalah
// LAPISAN LOGIKA (entitlement, katalog, UI). Pembelian sesungguhnya nanti
// disambungkan ke StoreKit native via jembatan `TakdirIAP.purchase(productId)`.
// Di web/preview, dipakai mode simulasi agar bisa dites.

// ---------- KATALOG PRODUK (product IDs harus cocok dgn App Store Connect) ----------
const IAP_PRODUCTS=[
  // === KOSMETIK (murni gaya, 0 dampak gameplay) ===
  {id:"takdir.theme.royal",type:"theme",ico:"👑",name:"Tema Kerajaan Emas",
   desc:"Palet emas-ungu mewah untuk seluruh antarmuka.",price:"Rp 15.000",
   theme:{gold:"#ffd700",goldBright:"#fff3a0",accent:"#7b4fb0",ink:"#1a0f2e"}},
  {id:"takdir.theme.crimson",type:"theme",ico:"🩸",name:"Tema Darah Naga",
   desc:"Palet merah-hitam dramatis bertema naga.",price:"Rp 15.000",
   theme:{gold:"#d4453a",goldBright:"#ff6b5a",accent:"#8b2020",ink:"#1a0808"}},
  {id:"takdir.theme.frost",type:"theme",ico:"❄️",name:"Tema Es Abadi",
   desc:"Palet biru-perak dingin bersalju.",price:"Rp 15.000",
   theme:{gold:"#7ab8e0",goldBright:"#bfe5ff",accent:"#3a6e9c",ink:"#0a1420"}},

  // === KONTEN EKSTRA OPSIONAL (game tanpa ini tetap komplit) ===
  {id:"takdir.origin.dragon",type:"origin",ico:"🐉",name:"Keturunan Naga",
   desc:"Origin bonus: lahir dengan darah naga — Mana & Kekuatan tinggi, jalur takdir unik.",price:"Rp 25.000"},
  {id:"takdir.bundle.all",type:"bundle",ico:"✨",name:"Paket Lengkap Takdir",
   desc:"Semua tema + origin bonus + slot simpan tambahan. Hemat 40%.",price:"Rp 45.000",
   grants:["takdir.theme.royal","takdir.theme.crimson","takdir.theme.frost","takdir.origin.dragon","takdir.saveslots"]},

  // === QUALITY OF LIFE (bukan pay-to-win) ===
  {id:"takdir.saveslots",type:"feature",ico:"💾",name:"Slot Simpan Ganda",
   desc:"Simpan hingga 3 garis keturunan berbeda secara bersamaan.",price:"Rp 20.000"},

  // === DUKUNGAN (opsional, buat yg mau support dev) ===
  {id:"takdir.tip.coffee",type:"tip",ico:"☕",name:"Traktir Kopi Developer",
   desc:"Dukung pengembangan Takdir. Tanpa imbalan dalam game — murni terima kasih.",price:"Rp 30.000"},
];

// ---------- ENTITLEMENT (kepemilikan, tersimpan) ----------
const ENTITLE_KEY="takdir_entitlements_v1";
let _entitlements=null;

function loadEntitlements(){
  if(_entitlements)return _entitlements;
  _entitlements={};
  try{
    const raw=window.localStorage.getItem(ENTITLE_KEY);
    if(raw)_entitlements=JSON.parse(raw)||{};
  }catch(e){_entitlements={};}
  return _entitlements;
}
function saveEntitlements(){
  try{window.localStorage.setItem(ENTITLE_KEY,JSON.stringify(_entitlements||{}));}catch(e){}
}
function owns(productId){
  const e=loadEntitlements();
  return !!e[productId];
}
function grantProduct(productId){
  loadEntitlements();
  _entitlements[productId]=true;
  // bundle: beri semua isinya
  const prod=IAP_PRODUCTS.find(p=>p.id===productId);
  if(prod&&prod.grants)prod.grants.forEach(g=>{_entitlements[g]=true;});
  saveEntitlements();
}

// ---------- JEMBATAN PEMBELIAN (web simulasi / native StoreKit) ----------
// Saat di-deploy native, definisikan window.TakdirIAP = {purchase, restore}
// yang memanggil StoreKit. Di web, fallback ke simulasi konfirmasi.
function purchaseProduct(productId){
  const prod=IAP_PRODUCTS.find(p=>p.id===productId);
  if(!prod)return;
  if(owns(productId)){toast&&toast("Kamu sudah memilikinya.");return;}

  // jembatan native (diisi oleh wrapper Xcode/Capacitor)
  if(window.TakdirIAP&&typeof window.TakdirIAP.purchase==="function"){
    window.TakdirIAP.purchase(productId);  // hasil ditangani via onPurchaseResult
    return;
  }

  // ===== MODE SIMULASI (web/preview) =====
  if(typeof openChoice==="function"){
    openChoice({ico:prod.ico,
      prompt:`<b>${prod.name}</b><br><span style="font-size:11.5px;color:var(--ink-soft);filter:brightness(1.6)">${prod.desc}</span><br><br><span style="color:var(--gold-bright);font-weight:700">${prod.price}</span><br><span style="font-size:10px;color:var(--ink-soft);filter:brightness(1.5)">(mode demo — pembelian asli aktif di App Store)</span>`,
      choices:[
        {label:"Beli (simulasi)",cls:"love",run:()=>{onPurchaseResult(productId,true);return{t:`✓ ${prod.name} terbuka!`,cls:"e-epic"};}},
        {label:"Batal",run:()=>({t:"Dibatalkan.",cls:""})},
      ]});
  }
}

// dipanggil setelah pembelian sukses (dari StoreKit native atau simulasi)
function onPurchaseResult(productId,success){
  if(!success)return;
  grantProduct(productId);
  const prod=IAP_PRODUCTS.find(p=>p.id===productId);
  // terapkan langsung kalau tema
  if(prod&&prod.type==="theme")applyPremiumTheme(productId);
  if(typeof renderPremiumStore==="function"&&currentTab==="Aset")renderAset&&renderAset();
}
// pulihkan pembelian (wajib ada utk App Store)
function restorePurchases(){
  if(window.TakdirIAP&&typeof window.TakdirIAP.restore==="function"){
    window.TakdirIAP.restore();
    return;
  }
  toast&&toast("Pemulihan pembelian akan aktif di App Store.");
}

// ---------- TERAPKAN TEMA PREMIUM ----------
function applyPremiumTheme(productId){
  const prod=IAP_PRODUCTS.find(p=>p.id===productId);
  if(!prod||!prod.theme)return;
  const t=prod.theme;
  const root=document.documentElement;
  if(t.gold)root.style.setProperty("--gold",t.gold);
  if(t.goldBright)root.style.setProperty("--gold-bright",t.goldBright);
  if(t.accent)root.style.setProperty("--arcane-glow",t.accent);
  if(t.ink)root.style.setProperty("--ink",t.ink);
  try{window.localStorage.setItem("takdir_active_theme",productId);}catch(e){}
  toast&&toast(`Tema ${prod.name} aktif.`);
}
function applyActiveThemeOnBoot(){
  try{const id=window.localStorage.getItem("takdir_active_theme");
    if(id&&owns(id))applyPremiumTheme(id);}catch(e){}
}

// ---------- TOKO PREMIUM (UI, tab Aset bagian bawah) ----------
function premiumStoreHTML(){
  let html=`<div class="sechead">✨ Toko Premium (opsional)</div>
    <p style="font-size:10.5px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 10px;line-height:1.5;">Semua isi game ini <b>gratis & lengkap</b>. Item di bawah murni tambahan opsional untuk yang ingin mendukung & bergaya. Tidak ada yang memengaruhi keseimbangan permainan.</p>
    <div class="tiles">`;
  for(const p of IAP_PRODUCTS){
    const has=owns(p.id);
    const isActiveTheme=(()=>{try{return window.localStorage.getItem("takdir_active_theme")===p.id;}catch(e){return false;}})();
    html+=`<div class="tile prem-tile ${has?'owned':''}" onclick="${has?(p.type==='theme'?`applyPremiumTheme('${p.id}')`:''):`purchaseProduct('${p.id}')`}">
      <span class="ti">${p.ico}</span><span class="tn">${p.name}</span>
      <span class="td">${has?(p.type==='theme'?(isActiveTheme?'✓ Aktif — ketuk untuk pakai':'Dimiliki — ketuk untuk pakai'):'✓ Dimiliki'):p.price}</span></div>`;
  }
  html+=`</div>
    <div class="save-row" style="margin-top:8px">
      <button class="save-btn" onclick="restorePurchases()">↻ Pulihkan Pembelian</button>
    </div>`;
  return html;
}

// Toko Premium DINONAKTIFKAN — tidak disisipkan ke tab Aset.
// (fungsi purchaseProduct/owns/entitlement tetap ada agar referensi lain aman)

// ---------- integrasi origin bonus (Keturunan Naga) ----------
// origin dragon hanya muncul di pemilihan kalau dimiliki
(function installDragonOrigin(){
  if(typeof ORIGINS==="undefined")return;
  if(ORIGINS.find(o=>o.id==="dragonborn"))return;
  // definisi origin bonus (didaftarkan, tapi initOrigins akan memfilter kepemilikan)
  window._DRAGON_ORIGIN={id:"dragonborn",ico:"🐉",name:"Keturunan Naga",
    desc:"Darah naga mengalir — Mana & Kekuatan luar biasa, jalur takdir langka.",
    premium:true,
    start:{might:35,mana:40,mind:20,charm:18,health:90,coin:0},
    wealthRange:[80,180]};
})();

// boot: terapkan tema aktif
setTimeout(applyActiveThemeOnBoot,0);
// ============================================================
//  MANTARA — MULTI-SLOT SAVE
// ============================================================
// Tiap karakter disimpan di slot terpisah (takdir_slot_N). Pemain bisa
// punya beberapa kehidupan paralel (mis. karakter A di Aetheria & karakter
// B dari bayi di Saltmoor) tanpa saling menimpa.
//
// Free: SLOTS_FREE slot. IAP "takdir.saveslots": SLOTS_PREMIUM slot.

const SLOT_PREFIX="takdir_slot_";
const SLOT_INDEX_KEY="takdir_slot_index_v1";   // daftar metadata slot
const ACTIVE_SLOT_KEY="takdir_active_slot_v1";  // slot yg sedang dimainkan
const SLOTS_FREE=2;
const SLOTS_PREMIUM=5;

function maxSlots(){
  try{if(typeof owns==="function"&&(owns("takdir.saveslots")||owns("takdir.bundle.all")))return SLOTS_PREMIUM;}catch(e){}
  return SLOTS_FREE;
}

// ---------- INDEX SLOT (ringkasan tiap slot utk start screen) ----------
function readSlotIndex(){
  try{const raw=window.localStorage.getItem(SLOT_INDEX_KEY);return raw?JSON.parse(raw):{};}catch(e){return {};}
}
function writeSlotIndex(idx){
  try{window.localStorage.setItem(SLOT_INDEX_KEY,JSON.stringify(idx||{}));}catch(e){}
}
function activeSlot(){
  try{const v=window.localStorage.getItem(ACTIVE_SLOT_KEY);return v!==null?parseInt(v,10):null;}catch(e){return null;}
}
function setActiveSlot(n){
  try{if(n===null)window.localStorage.removeItem(ACTIVE_SLOT_KEY);else window.localStorage.setItem(ACTIVE_SLOT_KEY,String(n));}catch(e){}
}

// cari slot kosong pertama; -1 jika penuh
function firstFreeSlot(){
  const idx=readSlotIndex();
  for(let i=0;i<maxSlots();i++){if(!idx[i])return i;}
  return -1;
}
function slotCount(){return Object.keys(readSlotIndex()).length;}

// ---------- MIGRASI save lama (single-slot v1) -> slot 0 ----------
(function migrateOldSave(){
  try{
    if(!window.localStorage)return;
    const old=window.localStorage.getItem("takdir_save_v1");
    if(old&&!window.localStorage.getItem(SLOT_PREFIX+"0")){
      window.localStorage.setItem(SLOT_PREFIX+"0",old);
      const p=JSON.parse(old);
      const idx=readSlotIndex();idx[0]=p.meta||{name:"?",age:0};writeSlotIndex(idx);
      // jangan hapus yg lama dulu (kompat mundur), tapi tandai active
      if(activeSlot()===null)setActiveSlot(0);
    }
  }catch(e){}
})();

// ---------- SIMPAN ke slot aktif ----------
function saveGameMulti(silent){
  if(typeof storageAvailable==="function"&&!storageAvailable())return false;
  if(typeof C==="undefined"||!C)return false;
  let slot=activeSlot();
  if(slot===null){ // karakter ini belum punya slot -> ambil slot kosong
    slot=firstFreeSlot();
    if(slot===-1)return false; // penuh (UI mencegah ini)
    setActiveSlot(slot);
  }
  try{
    const payload={v:1,ts:Date.now(),char:C,
      meta:{name:C.name,age:C.age,title:C.title,alive:C.alive,coin:C.coin,
        origin:C.origin,cityId:C.cityId,lineage:C._lineage||1}};
    window.localStorage.setItem(SLOT_PREFIX+slot,JSON.stringify(payload));
    const idx=readSlotIndex();idx[slot]=payload.meta;writeSlotIndex(idx);
    if(!silent&&typeof toast==="function")toast("💾 Tersimpan (slot "+(slot+1)+")");
    return true;
  }catch(e){return false;}
}

// ---------- MUAT dari slot tertentu ----------
function loadSlot(slot){
  try{
    const raw=window.localStorage.getItem(SLOT_PREFIX+slot);
    if(!raw){toast&&toast("Slot kosong.");return false;}
    const p=JSON.parse(raw);
    C=p.char;
    if(!C._visited)C._visited=C.cityId?[C.cityId]:[];
    else if(C.cityId&&!C._visited.includes(C.cityId))C._visited.push(C.cityId);
    setActiveSlot(slot);
    // tampilkan layar bermain
    ["startScreen","customizeScreen","overScreen"].forEach(id=>{
      const el=document.getElementById(id);if(el)el.classList.add("hidden");});
    ["viewHidup"].forEach(id=>{const el=document.getElementById(id);if(el)el.classList.remove("hidden");});
    const tb=document.getElementById("tabbar");if(tb)tb.classList.remove("hidden");
    const aw=document.getElementById("agewrap");if(aw)aw.classList.remove("hidden");
    if(typeof updateTitle==="function")updateTitle();
    if(typeof switchTab==="function")switchTab("Hidup");
    else if(typeof renderAll==="function")renderAll();
    toast&&toast("Memuat "+(p.meta?p.meta.name:"permainan")+".");
    return true;
  }catch(e){toast&&toast("Gagal memuat slot.");return false;}
}

// ---------- HAPUS slot ----------
function deleteSlot(slot){
  try{
    window.localStorage.removeItem(SLOT_PREFIX+slot);
    const idx=readSlotIndex();delete idx[slot];writeSlotIndex(idx);
    if(activeSlot()===slot)setActiveSlot(null);
  }catch(e){}
}

// ---------- mulai karakter baru di slot kosong ----------
function startNewCharacter(){
  // cek slot penuh dulu — cegah progress hilang diam-diam
  if(typeof firstFreeSlot==="function"&&firstFreeSlot()===-1){
    const max=maxSlots();
    const choices=[{label:"📜 Lihat Daftar Slot",run:()=>{if(typeof renderSlotList==="function")renderSlotList();}}];
    if(typeof IAP_PRODUCTS!=="undefined"&&max<5)
      choices.push({label:"🔓 Buka 5 Slot Karakter",run:()=>{if(typeof purchaseProduct==="function")purchaseProduct("takdir.saveslots");}});
    choices.push({label:"Tutup",run:()=>{}});
    if(typeof showModal==="function"){
      showModal({ico:"🗂️",prompt:`Semua ${max} slot karakter sudah terisi. Hapus salah satu karakter dulu lewat daftar slot${max<5?", atau buka slot tambahan":""}.`,choices});
    }else if(typeof toast==="function"){toast("Slot karakter penuh. Hapus satu dulu.");}
    return; // jangan mulai karakter baru
  }
  // lepaskan slot aktif agar karakter baru dapat slot sendiri saat save pertama
  setActiveSlot(null);
  if(typeof beginLife==="function")beginLife();
}

// ============================================================
//  OVERRIDE save system lama -> multi-slot
// ============================================================
saveGame=function(silent){return saveGameMulti(silent);};
hasSave=function(){return slotCount()>0;};
deleteSave=function(){const s=activeSlot();if(s!==null)deleteSlot(s);};
loadGame=function(){ // "Lanjutkan" -> muat slot aktif, atau slot pertama terisi
  let s=activeSlot();
  if(s===null||!window.localStorage.getItem(SLOT_PREFIX+s)){
    const idx=readSlotIndex();const keys=Object.keys(idx);if(!keys.length)return false;s=parseInt(keys[0],10);}
  return loadSlot(s);
};

// ---------- START SCREEN: daftar semua slot + tombol kelola ----------
function renderSlotList(){
  const host=document.getElementById("slotList");
  if(!host)return;
  const idx=readSlotIndex();
  const max=maxSlots();
  const entries=Object.keys(idx).map(k=>parseInt(k,10)).sort((a,b)=>a-b);
  if(!entries.length){host.innerHTML="";return;}
  let html=`<div class="slot-head">Karakter Tersimpan (${entries.length}/${max})</div>`;
  for(const s of entries){
    const m=idx[s];
    const cityName=({aetheria:"Aetheria",thornvale:"Thornvale",saltmoor:"Saltmoor",frostspire:"Frostspire"})[m.cityId]||"";
    html+=`<div class="slot-card">
      <div class="slot-info" onclick="loadSlot(${s})">
        <div class="slot-name">${m.name||"?"} ${m.alive===false?'<span class="slot-dead">†</span>':''}</div>
        <div class="slot-meta">usia ${m.age||0}${cityName?' · '+cityName:''}${m.lineage>1?' · gen '+m.lineage:''}</div>
      </div>
      <button class="slot-del" onclick="confirmDeleteSlot(${s})">🗑️</button>
    </div>`;
  }
  // tombol slot baru jika masih ada ruang
  if(entries.length<max){
    html+=`<button class="slot-new" onclick="startNewCharacter()">+ Karakter Baru (slot ${entries.length+1})</button>`;
  }else{
    const canBuy=(typeof owns==="function"&&!owns("takdir.saveslots")&&!owns("takdir.bundle.all"));
    html+=`<div class="slot-full">Semua ${max} slot terpakai.${canBuy?' <span onclick="purchaseProduct(\'takdir.saveslots\')" style="color:var(--gold-bright);text-decoration:underline">Buka 5 slot</span>':''}</div>`;
  }
  host.innerHTML=html;
}
function confirmDeleteSlot(slot){
  const idx=readSlotIndex();const m=idx[slot];
  if(typeof openChoice==="function"){
    openChoice({ico:"🗑️",prompt:`Hapus karakter <b>${m?m.name:'?'}</b> (usia ${m?m.age:0})? Progres slot ini hilang permanen.`,
      choices:[
        {label:"🗑️ Ya, hapus permanen",cls:"danger",run:()=>{
          deleteSlot(slot);
          setTimeout(()=>{renderSlotList();if(typeof setupContinueButton==="function")setupContinueButton();
            if(typeof toast==="function")toast("Slot dihapus.");},60);
          return null;}},
      ]});
  }else{deleteSlot(slot);renderSlotList();}
}

// override setupContinueButton -> sekarang render daftar slot
setupContinueButton=function(){
  const btn=document.getElementById("continueBtn");
  if(btn){
    if(slotCount()>0){
      const idx=readSlotIndex();
      let s=activeSlot();if(s===null||!idx[s])s=parseInt(Object.keys(idx)[0],10);
      const m=idx[s];
      btn.classList.remove("hidden");
      btn.textContent=`▸ Lanjutkan: ${m?m.name:'?'} (usia ${m?m.age:0})`;
      btn.onclick=function(){loadSlot(s);};
    }else if(btn){btn.classList.add("hidden");}
  }
  renderSlotList();
};

// confirmNewGame: kini cukup mulai karakter baru (multi-slot, tak menimpa)
confirmNewGame=function(){
  if(slotCount()>=maxSlots()){
    toast&&toast("Semua slot penuh. Hapus satu karakter atau buka slot tambahan.");
    renderSlotList();return;
  }
  startNewCharacter();
};

// boot: tampilkan daftar slot di layar awal
if(typeof setupContinueButton==="function")setupContinueButton();

// auto-save saat advanceYear/die sudah di-hook installAutoSave (memanggil saveGame -> multi).
// ============================================================
//  MANTARA — PASANG ASET KUSTOM (ganti emoji -> gambar)
// ============================================================
// Mengganti emoji dengan gambar kustom di: logo header, origin, kota,
// stat, dan tab bar. Fallback ke emoji bila aset tidak ada (aman).

(function applyCustomAssets(){
  // ---------- 1) LOGO HEADER ----------
  // ganti <span class="logo-mark">🪄⚔️</span> dengan gambar logo
  function setHeaderLogo(){
    const mark=document.querySelector(".logo-mark");
    if(mark&&MANTARA_ASSETS.logo){
      mark.innerHTML=`<img src="${resolveAsset(MANTARA_ASSETS.logo)}" style="height:1.4em;vertical-align:middle;object-fit:contain" alt="">`;
    }
  }

  // ---------- 2) ORIGIN ICONS (data ORIGINS) ----------
  const ORIGIN_ASSET={
    peasant:"origin_peasant", noble:"origin_noble", mageborn:"origin_mage",
    orphan:"origin_orphan", merchant_kid:"origin_merchant",
  };
  if(typeof ORIGINS!=="undefined"&&Array.isArray(ORIGINS)){
    ORIGINS.forEach(o=>{
      const a=ORIGIN_ASSET[o.id];
      if(a&&MANTARA_ASSETS[a]){o._emoji=o.ico;o.ico=imgIcon(a,o.ico,"1.6em");}
    });
    // kartu origin sudah ter-render saat boot dgn emoji -> render ulang dgn gambar
    try{if(typeof initOrigins==="function")initOrigins();}catch(e){}
  }

  // ---------- 3) CITY ICONS ----------
  const CITY_ASSET={aetheria:"city_aetheria",saltmoor:"city_saltmoor",frostspire:"city_frostspire",thornvale:"city_thornvale"};
  if(typeof CITIES!=="undefined"&&Array.isArray(CITIES)){
    CITIES.forEach(c=>{
      const a=CITY_ASSET[c.id];
      if(a&&MANTARA_ASSETS[a]){c._emoji=c.ico;c.ico=imgIcon(a,c.ico,"1.5em");}
    });
  }

  // ---------- 4) STAT ICONS ----------
  // stat ditampilkan via METER_DEFS/STAT_META; kita patch labelnya saat render.
  // Cara aman: sediakan peta, lalu override fungsi render stat untuk menyisipkan gambar.
  window.STAT_ASSET={health:"stat_health",happy:"stat_happy",might:"stat_might"};

  // ---------- 5) TAB BAR ICONS ----------
  const TAB_ASSET={Peta:"tab_peta",Relasi:"tab_relasi",Aktivitas:"tab_aksi"};
  function setTabIcons(){
    document.querySelectorAll(".tab").forEach(t=>{
      const view=t.dataset&&t.dataset.view;
      const a=TAB_ASSET[view];
      if(a&&MANTARA_ASSETS[a]){
        const ico=t.querySelector(".tabi");
        if(ico)ico.innerHTML=`<img src="${resolveAsset(MANTARA_ASSETS[a])}" style="width:22px;height:22px;object-fit:contain;filter:drop-shadow(0 0 3px rgba(240,192,64,.4))" alt="">`;
      }
    });
  }

  // ---------- 6) BISNIS, SKILL, GEAR, WARDROBE ----------
  function patchIcoList(list,map,size){
    if(!list||!Array.isArray(list))return;
    list.forEach(item=>{
      const a=map[item.id];
      if(a&&MANTARA_ASSETS[a]){item._emoji=item.ico;item.ico=imgIcon(a,item._emoji,size||"30px");}
    });
  }
  function patchIcoCatalog(catalog,map,size){
    if(!catalog)return;
    Object.keys(catalog).forEach(key=>{
      const item=catalog[key];const a=map[key];
      if(a&&MANTARA_ASSETS[a]){item._emoji=item.ico;item.ico=imgIcon(a,item._emoji,size||"30px");}
    });
  }
  const BIZ_ASSET={cattle:"biz_cattle",farm:"biz_farm",shop:"biz_shop",tavern:"biz_tavern",caravan:"biz_caravan"};
  const SKILL_ASSET={swordsmanship:"skill_swordsmanship",alchemy:"skill_alchemy",diplomacy:"skill_diplomacy",medicine:"skill_medicine",sorcery:"skill_sorcery"};
  const GEAR_ASSET={mount:"gear_mount",weapon:"gear_weapon",tome:"gear_tome"};
  const WARDROBE_ASSET={body:"wardrobe_body",legs:"wardrobe_legs",feet:"wardrobe_feet",head:"wardrobe_head"};
  if(typeof BUSINESS_TYPES!=="undefined")patchIcoList(BUSINESS_TYPES,BIZ_ASSET);
  if(typeof SKILL_TYPES!=="undefined")patchIcoList(SKILL_TYPES,SKILL_ASSET);
  if(typeof GEAR_CATALOG!=="undefined")patchIcoCatalog(GEAR_CATALOG,GEAR_ASSET);
  if(typeof WARDROBE_CATALOG!=="undefined")patchIcoCatalog(WARDROBE_CATALOG,WARDROBE_ASSET);

  // jalankan saat DOM siap & setiap kembali ke start
  function applyAll(){try{setHeaderLogo();setTabIcons();}catch(e){}}
  if(document.readyState!=="loading")setTimeout(applyAll,0);
  else document.addEventListener("DOMContentLoaded",applyAll);
  // re-apply saat switchTab (header bisa re-render)
  if(typeof switchTab==="function"){
    const _ca_prevSwitch=switchTab;
    switchTab=function(){const r=_ca_prevSwitch.apply(this,arguments);try{setHeaderLogo();setTabIcons();}catch(e){}return r;};
  }
})();

// ============================================================
//  MANTARA — SAFE WRAPPER untuk entry-point (anti-crash UI)
// ============================================================
// Membungkus fungsi entry-point (dipanggil dari onclick/setTimeout) agar
// error apa pun tidak membuat "Uncaught"/layar putih. Error dicatat ke
// buffer (takdirDebug()) & game lanjut dengan pesan ramah.
// Re-assign eksplisit (bukan via window[name]) agar andal di semua lingkungan.

function _guard(name,fn){
  if(typeof fn!=="function")return fn;
  const w=function(){
    try{return fn.apply(this,arguments);}
    catch(e){
      try{(window._takdirErrors=window._takdirErrors||[]).push({
        msg:"["+name+"] "+(e&&e.message||e),
        stack:e&&e.stack?String(e.stack).slice(0,400):"",});}catch(_){}
      try{if(typeof toast==="function")toast("Terjadi gangguan kecil — permainan tetap berjalan.");}catch(_){}
      return undefined;
    }
  };
  w.__guarded=true;
  return w;
}

// re-assign eksplisit tiap entry point (fungsi sudah terdefinisi di atas)
beginLife        = _guard("beginLife", beginLife);
confirmNewGame   = _guard("confirmNewGame", confirmNewGame);
confirmCustomize = _guard("confirmCustomize", confirmCustomize);
loadGame         = _guard("loadGame", loadGame);
selOrigin        = _guard("selOrigin", selOrigin);
resolveChoice    = _guard("resolveChoice", resolveChoice);
openChoice       = _guard("openChoice", openChoice);
renderCustomize  = _guard("renderCustomize", renderCustomize);
if(typeof initDraft==="function")        initDraft        = _guard("initDraft", initDraft);
if(typeof initOrigins==="function")      initOrigins      = _guard("initOrigins", initOrigins);
if(typeof setupContinueButton==="function") setupContinueButton = _guard("setupContinueButton", setupContinueButton);
// ============================================================
//  MANTARA — NAVIGASI 3-TAB (Hidup / Dunia / Diri)
// ============================================================
// Memadatkan 6 tab jadi 3 tab utama berikon besar, dengan sub-tab pill
// di dalam tab gabungan. Semua render lama tetap dipakai via switchTab asli.
//
//  Hidup  -> log umur (tetap)
//  Dunia  -> Peta + Aksi (sub-tab)
//  Diri   -> Relasi + Aset + Tas (sub-tab)

(function nav3(){
  // peta tab utama -> daftar sub-view (view asli yg sudah ada)
  const GROUPS={
    Hidup: {sub:[{view:"Hidup", label:"Hidup", ico:"📜"}]},
    Dunia: {sub:[
      {view:"Peta",      label:"Peta",  ico:"tab_peta",  emoji:"🗺️"},
      {view:"Aktivitas", label:"Aksi",  ico:"tab_aksi", emoji:"⚔️"},
      {view:"Toko",      label:"Toko",  ico:"🛒"},
    ]},
    Diri:  {sub:[
      {view:"Karir",     label:"Karir",  ico:"💼"},
      {view:"Relasi",    label:"Relasi", ico:"tab_relasi", emoji:"👥", dot:true},
      {view:"Aset",      label:"Aset",   ico:"🏰"},
      {view:"Inventory", label:"Tas",    ico:"🎒"},
    ]},
  };
  // view -> tab utama (kebalikan), utk highlight saat switchTab dipanggil langsung
  const VIEW2GROUP={};
  Object.entries(GROUPS).forEach(([g,o])=>o.sub.forEach(s=>VIEW2GROUP[s.view]=g));

  // sub-view aktif terakhir per grup (biar balik ke tab inget posisi)
  const lastSub={Dunia:"Peta", Diri:"Karir"};

  let _realSwitch=null;     // switchTab asli (pemnuh render)
  let _activeGroup="Hidup";

  // ---------- bangun ulang tabbar jadi 3 ----------
  function buildTabbar(){
    const bar=document.getElementById("tabbar");
    if(!bar)return;
    const mainTabs=[
      {group:"Hidup", label:"Hidup", ico:"📜"},
      {group:"Dunia", label:"Dunia", ico:"🗺️"},
      {group:"Diri",  label:"Diri",  ico:"👤"},
    ];
    bar.innerHTML=mainTabs.map(t=>
      `<button class="tab tab3 ${t.group===_activeGroup?'active':''}" data-group="${t.group}" onclick="navGroup('${t.group}')">
        <span class="tabi">${t.ico}</span><span class="tabt">${t.label}</span>
        ${t.group==="Diri"?'<span class="dot" id="dotRelasi"></span>':''}
      </button>`).join("");
    applyTabImages();
  }

  // ikon gambar kustom utk tab utama (kalau ada): Dunia pakai peta, Diri pakai orang
  function applyTabImages(){
    if(typeof MANTARA_ASSETS==="undefined")return;
    const map={Dunia:"tab_peta", Diri:"tab_relasi"};
    document.querySelectorAll(".tab3").forEach(t=>{
      const g=t.dataset.group, a=map[g];
      if(a&&MANTARA_ASSETS[a]){
        const ico=t.querySelector(".tabi");
        if(ico)ico.innerHTML=`<img src="${resolveAsset(MANTARA_ASSETS[a])}" style="width:30px;height:30px;object-fit:contain;filter:drop-shadow(0 0 4px rgba(240,192,64,.45))" alt="">`;
      }
    });
  }

  // ---------- render sub-tab pill di atas konten grup ----------
  function renderSubbar(group, activeView){
    const g=GROUPS[group];
    if(!g||g.sub.length<2)return ""; // Hidup tak perlu sub-tab
    return `<div class="subbar">${g.sub.map(s=>
      `<button class="subpill ${s.view===activeView?'active':''}" onclick="navSub('${group}','${s.view}')">
        <span class="subpill-ico">${subIco(s)}</span>${s.label}${s.dot?'<span class="dot" id="dotRelasi"></span>':''}
      </button>`).join("")}</div>`;
  }
  function subIco(s){
    if(s.ico&&typeof MANTARA_ASSETS!=="undefined"&&MANTARA_ASSETS[s.ico]){
      return `<img src="${resolveAsset(MANTARA_ASSETS[s.ico])}" style="width:16px;height:16px;object-fit:contain;vertical-align:-2px" alt="">`;
    }
    return s.emoji||s.ico||"";
  }

  // sisipkan/ubah sub-bar PERMANEN (#globalSubbar) di luar view -> tak terhapus render konten
  function updateGlobalSubbar(group, view){
    const host=document.getElementById("globalSubbar");
    if(!host)return;
    const html=renderSubbar(group, view);
    if(html){
      host.innerHTML=html;
      host.classList.remove("hidden");
    }else{
      host.innerHTML="";
      host.classList.add("hidden");   // Hidup: tak ada sub-bar
    }
  }

  // ---------- klik tab utama ----------
  window.navGroup=function(group){
    _activeGroup=group;
    // highlight tab utama
    document.querySelectorAll(".tab3").forEach(t=>t.classList.toggle("active",t.dataset.group===group));
    // tentukan view yg ditampilkan
    let view;
    if(group==="Hidup")view="Hidup";
    else view=lastSub[group]||GROUPS[group].sub[0].view;
    gotoView(group, view);
  };

  // ---------- klik sub-tab ----------
  window.navSub=function(group, view){
    lastSub[group]=view;
    gotoView(group, view);
  };

  // ---------- pindah ke view (delegasi ke switchTab asli) ----------
  function gotoView(group, view){
    if(_realSwitch)_realSwitch(view);     // jalankan render asli + tampil/sembunyi
    // setelah render, sisipkan subbar
    updateGlobalSubbar(group, view);
    // pastikan tab utama tetap ke-highlight (switchTab asli mungkin ubah .tab lama, tp tab3 kita pakai data-group)
    document.querySelectorAll(".tab3").forEach(t=>t.classList.toggle("active",t.dataset.group===group));
  }

  // ---------- pasang: bungkus switchTab supaya:
  //   (a) tetap bisa dipanggil kode lama (mis. openChoice menutup & switchTab)
  //   (b) highlight tab utama yg sesuai
  function install(){
    if(typeof switchTab!=="function")return;
    _realSwitch=switchTab;
    switchTab=function(name){
      const r=_realSwitch.apply(this,arguments);
      const group=VIEW2GROUP[name]||"Hidup";
      _activeGroup=group;
      if(group!=="Hidup")lastSub[group]=name;
      try{updateGlobalSubbar(group,name);}catch(e){}
      document.querySelectorAll(".tab3").forEach(t=>t.classList.toggle("active",t.dataset.group===group));
      return r;
    };
    buildTabbar();
  }

  // sembunyikan sub-bar saat kembali ke layar non-game
  function hideSubbar(){const h=document.getElementById("globalSubbar");if(h){h.innerHTML="";h.classList.add("hidden");}}
  if(typeof showStart==="function"){const _ps=showStart;showStart=function(){hideSubbar();return _ps.apply(this,arguments);};}
  if(typeof beginLife==="function"){const _pb=beginLife;beginLife=function(){hideSubbar();return _pb.apply(this,arguments);};}

  // jalankan saat siap & tiap mulai hidup (tabbar di-show)
  function boot(){try{install();}catch(e){}}
  if(document.readyState!=="loading")setTimeout(boot,0);
  else document.addEventListener("DOMContentLoaded",boot);

  // re-build tabbar tiap confirmCustomize (saat game mulai, tabbar baru muncul)
  if(typeof confirmCustomize==="function"){
    const _prevCC=confirmCustomize;
    confirmCustomize=function(){const r=_prevCC.apply(this,arguments);try{buildTabbar();navGroup("Hidup");}catch(e){}return r;};
  }
  if(typeof loadSlot==="function"){
    const _prevLS=loadSlot;
    loadSlot=function(){const r=_prevLS.apply(this,arguments);try{buildTabbar();navGroup("Hidup");}catch(e){}return r;};
  }
})();



/* MANTARA_EXPANSION_INJECTED */
