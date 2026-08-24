// ============================================================
//  TAKDIR — OVERVIEW KARAKTER LENGKAP + AKSI BER-SUBMENU
// ============================================================

// perkaya profil: tambah estimasi kekayaan koin, nama pasangan & anak NPC
function enrichProfile(r){
  const p=ensureProfile(r);
  if(p._enriched)return p;
  // estimasi kekayaan dalam koin (dari tier)
  const wealthCoin={"miskin":[5,40],"pas-pasan":[40,150],"berkecukupan":[150,500],"kaya":[500,2000],"sangat kaya":[2000,8000]};
  const wr=wealthCoin[p.wealth]||[10,100];
  p.wealthCoin=ri(wr[0],wr[1]);
  // nama pasangan & anak (kalau ada)
  if(p.married&&!p.spouseName)p.spouseName=randName(!r.female).split(" ")[0];
  if(p.children>0&&!p.childNames){p.childNames=[];for(let i=0;i<p.children;i++)p.childNames.push(randName(chance(0.5)).split(" ")[0]);}
  // status sosial
  p.social=p.wealth==="sangat kaya"||p.wealth==="kaya"?"kelas atas":p.wealth==="berkecukupan"?"kelas menengah":"rakyat biasa";
  p._enriched=true;
  return p;
}

// ---------- OVERVIEW LENGKAP (kartu diklik membuka ini) ----------
function openOverview(relId){
  const r=C.relations.find(x=>x.id===relId);if(!r)return;
  const p=enrichProfile(r);
  const known=r._known||0;
  const meter=r.role==="pengikut"?r.loyalty:r.bond;

  // bangun baris info berlapis sesuai known
  const rows=[];
  const lock=`<span style="color:var(--ink-soft);filter:brightness(1.5)">🔒 ngobrol lebih dalam untuk tahu</span>`;

  rows.push([`Status`,`${r.role}${r.isChild?" (anak)":""} · ${r.female?"Perempuan":"Lelaki"} · sifat ${r.trait}`]);
  rows.push([`Ikatan`,`${Math.round(meter)}/100 · kenal ${C.age-r.met} tahun`]);
  // lv1: umur, pekerjaan, asal
  rows.push([`Umur`, known>=1?`${relationAge(r)} tahun`:lock]);
  rows.push([`Pekerjaan`, known>=1?relationJob(r):lock]);
  rows.push([`Asal`, known>=1?p.origin:lock]);
  // lv2: kekayaan & status sosial
  rows.push([`Kekayaan`, known>=2?`${p.wealth} (~${p.wealthCoin} keping)`:lock]);
  rows.push([`Status sosial`, known>=2?p.social:lock]);
  // lv2: keluarga inti — papa & ibu
  rows.push([`Ayah`, known>=2?p.parents[0]:lock]);
  rows.push([`Ibu`, known>=2?p.parents[1]:lock]);
  // lv3: pasangan & anak
  rows.push([`Pasangan`, known>=3?(p.married?(p.spouseName||"—"):"belum menikah"):lock]);
  rows.push([`Anak`, known>=3?(p.children>0?`${p.children} (${(p.childNames||[]).join(", ")})`:"belum punya"):lock]);
  // lv2: saudara
  rows.push([`Saudara`, known>=2?(p.siblings.length?p.siblings.join(", "):"anak tunggal"):lock]);
  // lv4: ambisi
  rows.push([`Ambisi`, known>=4?p.ambition:lock]);
  // lv6: rahasia
  rows.push([`Rahasia`, known>=6?`<span style="color:var(--arcane-glow)">${p.secret}</span>`:`<span style="color:var(--ink-soft)">🔒 hanya terbuka bila sangat dekat</span>`]);

  const tableHTML=`<div class="ov-table">${rows.map(([k,v])=>
    `<div class="ov-row"><span class="ov-k">${k}</span><span class="ov-v">${v}</span></div>`).join("")}</div>`;
  const progress=`<div class="ov-progress">Keterbukaan: ${Math.min(known,6)}/6 lapis · ngobrol lebih sering untuk membuka lebih banyak</div>`;

  snapStats&&snapStats();
  openChoice({ico:typeof npcAvatar==="function"?npcAvatar(r,relationAge(r),"npc-avatar--hero"):r.ico,
    prompt:`<div class="ov-name">${r.name}</div>${tableHTML}${progress}`,
    choices:[
      {label:"💬 Ngobrol (pilih topik)",sub:"buka info lebih dalam",cls:"love",run:()=>{closeModal();setTimeout(()=>openConversation(relId),140);return null;}},
      ...(r.role==="keluarga"||r.role==="pasangan"?[{label:"🎁 Beri hadiah",sub:"naikkan ikatan",run:()=>{closeModal();setTimeout(()=>giftToSpecific(relId),140);return null;}}]:[]),
    ]});
}

// ---------- AKSI RELASI BER-SUBMENU (ganti aksi satu-klik) ----------
// override doRelAction supaya tiap aksi buka sub-opsi dulu, bukan langsung jalan
if(typeof doRelAction!=="undefined"){
  const _ov_prevDoRelAction=doRelAction;
  // kita tidak pakai prev; kita buat submenu sendiri berdasar label aksi
}

// submenu untuk aksi keluarga/umum
function openRelActionMenu(relId,actIdx){
  const r=C.relations.find(x=>x.id===relId);if(!r)return;
  const acts=REL_ACTIONS[r.role]||[];
  const act=acts[actIdx];if(!act)return;
  const label=act.label;

  // BERBURU BARENG -> sub-opsi gaya berburu
  if(label.includes("Berburu")){
    if(C.age<12){toast("Kamu terlalu muda untuk berburu.");return;}
    snapStats&&snapStats();
    openChoice({ico:"🏹",prompt:`Berburu bersama <b>${r.name}</b> — pilih cara:`,
      choices:[
        {label:"🦌 Buruan kecil",sub:"aman, hasil sedikit",run:()=>{r.bond=clamp(r.bond+ri(4,8));const g=ri(8,20);C.coin+=g;applyStats({happy:+3});return{t:`Kau & ${r.name} berburu rusa kecil. +${g} keping, ikatan menguat.`,cls:"e-good"};}},
        {label:"🐗 Buruan besar",sub:"berisiko, hasil besar",run:()=>{if(C.stats.might>40||chance(0.5)){r.bond=clamp(r.bond+ri(8,14));const g=ri(25,60);C.coin+=g;if(typeof addItem==="function")addItem("hide");applyStats({might:+2});return{t:`Buruan babi hutan sukses! +${g} keping & kulit. ${r.name} terkesan.`,cls:"e-epic"};}applyStats({health:-ri(8,18)});return{t:`Buruan besar gagal — kalian terluka & pulang dengan tangan kosong.`,cls:"e-bad"};}},
        {label:"🗣️ Sekadar menemani",sub:"ikatan + tanpa risiko",run:()=>{r.bond=clamp(r.bond+ri(6,10));applyStats({happy:+4});return{t:`Kau menemani ${r.name} berburu sambil mengobrol. Ikatan erat.`,cls:"e-good"};}},
      ]});
    return;
  }

  // MINTA WARISAN -> sub-opsi cara meminta
  if(label.includes("warisan")||label.includes("Warisan")){
    snapStats&&snapStats();
    const p=enrichProfile(r);
    openChoice({ico:"💰",prompt:`Minta warisan dari <b>${r.name}</b><br><span style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6)">${(r._known||0)>=2?`Estimasi kekayaannya: ${p.wealth} (~${p.wealthCoin} keping)`:"Kau belum tahu pasti kekayaannya — ngobrol dulu."}</span>`,
      choices:[
        {label:"🙏 Memohon baik-baik",sub:"sedikit, ikatan aman",run:()=>{const g=ri(20,60);C.coin+=g;r.bond=clamp(r.bond-ri(2,5));return{t:`${r.name} memberimu ${g} keping dengan ikhlas.`,cls:"e-good"};}},
        {label:"😢 Merengek memaksa",sub:"lebih banyak, ikatan turun",run:()=>{const base=(r._known||0)>=2?p.wealthCoin:120;const g=Math.round(base*0.2)+ri(20,50);C.coin+=g;r.bond=clamp(r.bond-ri(8,16));return{t:`Setelah kau merengek, ${r.name} memberi ${g} keping — tapi kecewa padamu.`,cls:""};}},
        {label:"📜 Bicara soal warisan masa depan",sub:"tandai sbg pewaris",run:()=>{r._willInherit=true;r.bond=clamp(r.bond+ri(2,5));return{t:`${r.name} berjanji mewariskan hartanya padamu kelak. (kau ditandai pewaris)`,cls:"e-good"};}},
      ]});
    return;
  }

  // MENGOBROL -> langsung ke conversation pilih topik (sudah submenu)
  if(label.includes("Mengobrol")||label.includes("Ngobrol")){
    openConversation(relId);return;
  }

  // BERI HADIAH -> pilih item (sudah submenu via giftToSpecific)
  if(label.includes("hadiah")||label.includes("Hadiah")){
    giftToSpecific(relId);return;
  }

  // default: jalankan aksi asli (fallback)
  _origDoRelAction(relId,actIdx);
}


// simpan aksi asli & ganti doRelAction global -> pakai submenu
var _origDoRelAction=(typeof doRelAction!=="undefined")?doRelAction:function(){};
doRelAction=function(relId,actIdx){
  openRelActionMenu(relId,actIdx);
};
// ============================================================
//  TAKDIR — OPTIMASI PERFORMA + ANIMASI HALUS
// ============================================================

// ---------- 1) OPTIMASI: bekukan animasi peta saat tab bukan Peta ----------
// SVG <animate> tetap memakan CPU/baterai di Safari meski display:none.
// Solusi: kosongkan isi SVG peta saat keluar tab Peta, isi ulang saat masuk.
let _mapActive=false;
function freezeMap(){
  const wrap=document.getElementById("viewPeta");
  if(!wrap)return;
  // simpan & kosongkan elemen peta agar animasi berhenti total
  _mapActive=false;
}
const _opt_prevSwitchTab=switchTab;
switchTab=function(name){
  _opt_prevSwitchTab(name);
  _mapActive=(name==="Peta");
  // OPTIMASI iPhone/Safari: saat keluar tab Peta, kosongkan SVG agar animasi
  // SVG (bintang/salju/ombak) benar-benar berhenti & tak memakan baterai.
  if(name!=="Peta"){
    const wrap=document.querySelector(".map-wrap");
    if(wrap)wrap.innerHTML="";   // hapus SVG beranimasi
  }
  // (saat masuk tab Peta, renderPeta() sudah membangun ulang SVG segar)
  animatePanelIn(name);
};

// ---------- 2) ANIMASI: panel masuk halus saat ganti tab ----------
function animatePanelIn(name){
  if(_reducedMotion())return;
  const el=document.getElementById("view"+name);
  if(!el)return;
  el.style.animation="none";
  // force reflow lalu animasikan
  void el.offsetWidth;
  el.style.animation="panelIn .28s ease-out";
}

// ---------- 3) ANIMASI: transisi fade saat ganti tahun ----------
const _opt_prevAdvanceYear=(typeof advanceYear!=="undefined")?advanceYear:null;
if(_opt_prevAdvanceYear){
  advanceYear=function(){
    // fade ringan pada area log/hidup
    if(!_reducedMotion()){
      const v=document.getElementById("viewHidup");
      if(v){v.style.animation="none";void v.offsetWidth;v.style.animation="yearFade .4s ease-out";}
    }
    _opt_prevAdvanceYear.call(this);
  };
}

// ---------- 4) ANIMASI: stat bar mengalir (CSS transition di width) ----------
// ditangani via CSS (.relfill, .statfill transition). Di sini pastikan koin berkedip.
let _lastCoin=null;
const _opt_prevUpdateTitle=(typeof updateTitle!=="undefined")?updateTitle:null;
if(_opt_prevUpdateTitle){
  updateTitle=function(){
    _opt_prevUpdateTitle.call(this);
    if(typeof C!=="undefined"&&C&&_lastCoin!==null&&C.coin>_lastCoin&&!_reducedMotion()){
      flashCoin();
    }
    if(typeof C!=="undefined"&&C)_lastCoin=C.coin;
  };
}
function flashCoin(){
  const el=document.querySelector(".coin");
  if(!el)return;
  el.style.animation="none";void el.offsetWidth;el.style.animation="coinFlash .6s ease-out";
}

// ---------- util: hormati prefers-reduced-motion ----------
function _reducedMotion(){
  try{return window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;}
  catch(e){return false;}
}

// ---------- 5) OPTIMASI: (throttle renderAll dihapus — berisiko UI tak update) ----------
// renderAll dibiarkan sinkron; game logic mengandalkan render yang pasti jalan.
