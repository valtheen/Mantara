// ============================================================
//  TAKDIR — SAVE SYSTEM (localStorage, robust)
// ============================================================
// Di lingkungan artifact claude.ai, localStorage mungkin diblokir.
// Semua akses dibungkus try/catch -> game tetap jalan tanpa save.
// Saat di-deploy ke Safari/WKWebView (App Store), save berfungsi penuh.

const SAVE_KEY="takdir_save_v1";
let _storageOK=null;

function storageAvailable(){
  if(_storageOK!==null)return _storageOK;
  try{
    const t="__takdir_test__";
    window.localStorage.setItem(t,"1");
    window.localStorage.removeItem(t);
    _storageOK=true;
  }catch(e){_storageOK=false;}
  return _storageOK;
}

// ---------- AUTO-SAVE: hook ke advanceYear & momen penting ----------
function installAutoSave(){
  if(typeof advanceYear==="function"){
    const _sv_prevAdvance=advanceYear;
    advanceYear=function(){_sv_prevAdvance.apply(this,arguments);
      if(C&&C.alive)saveGame(true);};
  }
  // simpan juga saat mati (agar layar over bisa di-restore -> tahu sudah mati)
  if(typeof die==="function"){
    const _sv_prevDie=die;
    die=function(){_sv_prevDie.apply(this,arguments);saveGame(true);};
  }
  // simpan saat menutup/menyembunyikan app (mobile background)
  try{
    window.addEventListener&&window.addEventListener("pagehide",()=>{if(C&&C.alive)saveGame(true);});
    document.addEventListener&&document.addEventListener("visibilitychange",()=>{
      if(document.hidden&&C&&C.alive)saveGame(true);});
  }catch(e){}
}

// ---------- inisialisasi save system saat boot ----------
(function initSaveSystem(){
  // tunggu sampai fungsi game siap (defer ringan)
  function go(){
    try{installAutoSave();setupContinueButton();installSaveButton();}catch(e){}
  }
  if(typeof advanceYear!=="undefined")go();
  else setTimeout(go,0);
})();

// ---------- tombol Simpan manual di tab Hidup ----------
function installSaveButton(){
  if(typeof renderHidup!=="function")return;
  const _sv_prevRenderHidup=renderHidup;
  renderHidup=function(){
    _sv_prevRenderHidup.apply(this,arguments);
    const host=document.getElementById("viewHidup");
    if(!host||!C||!C.alive)return;
    if(storageAvailable()){
      host.innerHTML+=`<div class="save-row">
        <button class="save-btn" onclick="saveGame()">💾 Simpan</button>
        <button class="save-btn danger" onclick="confirmDeleteSave()">🗑️ Hapus Simpanan</button>
      </div>`;
    }
  };
}
function confirmDeleteSave(){
  if(typeof openChoice==="function"){
    openChoice({ico:"🗑️",prompt:"Hapus simpanan permanen? Progress yang tersimpan akan hilang.",
      choices:[
        {label:"Ya, hapus",cls:"",run:()=>{deleteSave();return{t:"Simpanan dihapus.",cls:"e-bad"};}},
        {label:"Batal",run:()=>({t:"Dibatalkan.",cls:""})},
      ]});
  }else{deleteSave();}
}