// ============================================================
//  TAKDIR — FONDASI POPUP KONSISTEN + BACK
// ============================================================

// snapshot stat sebelum aksi, untuk hitung delta yg ditampilkan di result popup
let _statSnapshot=null;
function snapStats(){
  if(typeof C==="undefined"||!C||!C.stats){_statSnapshot=null;return;}
  _statSnapshot={...C.stats,coin:C.coin,reputation:C.reputation};
}
function statDeltas(){
  if(!_statSnapshot)return [];
  const out=[];
  for(const k of STAT_ORDER){
    const d=Math.round(C.stats[k])-Math.round(_statSnapshot[k]);
    if(d!==0)out.push({label:STAT_META[k].name,d});
  }
  const dc=C.coin-_statSnapshot.coin; if(dc!==0)out.push({label:"Koin",d:dc,coin:true});
  const dr=C.reputation-_statSnapshot.reputation; if(dr!==0)out.push({label:"Reputasi",d:dr});
  return out;
}

// ---------- RESULT POPUP: untuk aksi tanpa pilihan ----------
// tampilkan hasil + ringkasan dampak yg rapi. opts:{ico,title,body,cls,anim,animText}
function showResult(opts){
  const deltas=statDeltas();
  const deltaHTML=deltas.length?`<div class="res-deltas">`+
    deltas.map(x=>{
      const pos=x.d>0;
      return `<span class="res-delta ${pos?'up':'down'}">${x.coin?'💰':''}${x.label} ${pos?'+':''}${x.d}</span>`;
    }).join("")+`</div>`:'';
  pendingChoice={data:{_isResult:true}};
  setModalIco(document.getElementById("mico"),opts.ico||"✨");
  document.getElementById("mprompt").innerHTML=
    `${opts.title?`<div class="res-title ${opts.cls||''}">${opts.title}</div>`:''}
     <div class="res-body">${opts.body||''}</div>${deltaHTML}`;
  document.getElementById("mchoices").innerHTML=
    `<button class="mchoice mc-ok" onclick="closeModal()">Lanjut ▸</button>`;
  document.getElementById("modal").classList.add("show");
  document.getElementById("btnAge").disabled=true;
  // catatan: animasi overlay sengaja TIDAK diputar di sini supaya tidak menimpa
  // teks result popup. Animasi standalone (turnamen/gambling) tetap diputar di tempatnya.
}

// ---------- HISTORY STACK untuk tombol BACK ----------
// simpan "aktivitas terakhir" sebagai fungsi yg bisa dipanggil ulang
let _lastActivity=null;
function recordActivity(label,fn){
  _lastActivity={label,fn};
  const btn=document.getElementById("backBtn");
  if(btn){btn.classList.add("show");btn.querySelector(".bb-label").textContent=label;}
}
function repeatLastActivity(){
  if(_lastActivity&&_lastActivity.fn){
    const f=_lastActivity.fn;
    f();
  }
}

// ============================================================
//  PATCH — Integrasi Popup Konsisten + Back
// ============================================================

// ---------- finishAct: sekarang munculkan RESULT POPUP dgn ringkasan dampak ----------
// (versi lama cuma log+toast). Kita override jadi popup yg enak dibaca.
finishAct=function(msg,cls,anim,animText){
  log(C.age,msg,cls||"e-good");
  if(C.stats.health<=0){
    showResult({ico:"💀",title:"Nasib Buruk",body:msg,cls:"e-death"});
    setTimeout(()=>{closeModal();die("Aktivitas berakibat fatal.");},50);
    return;
  }
  checkMissions();updateTitle();
  showResult({
    ico:cls==="e-bad"?"⚠️":cls==="e-epic"?"🌟":cls==="e-arcane"?"🔮":"✨",
    title:cls==="e-bad"?"Hasil Kurang Baik":cls==="e-epic"?"Luar Biasa!":"Selesai",
    body:msg,cls
  });
  // render di belakang modal
  renderAll();
};

// ---------- snapshot otomatis sebelum aktivitas sub-lokasi & umum ----------
const _bk_runSublocAct=runSublocAct;
runSublocAct=function(sublocId,idx){
  snapStats();
  const sub=currentCity().sublocs.find(s=>s.id===C.subloc);
  const acts=SUBLOC_ACTS[sublocId];
  const a=acts&&acts[idx];
  if(a)recordActivity(a.label,()=>{snapStats();_bk_runSublocAct(sublocId,idx);});
  _bk_runSublocAct(sublocId,idx);
};

const _bk_openSubs=openSubs;
openSubs=function(actId){
  snapStats();
  const a=ACTIVITIES.find(x=>x.id===actId);
  if(a)recordActivity(a.name,()=>openSubs(actId));
  _bk_openSubs(actId);
};

const _bk_runChildAct=typeof runChildAct!=="undefined"?runChildAct:null;
if(_bk_runChildAct){
  runChildAct=function(i){
    snapStats();
    const kid=CHILD_ACTS.filter(a=>C.age>=a.minAge&&C.age<=a.maxAge);
    const a=kid[i];
    if(a)recordActivity(a.label,()=>runChildAct(i));
    _bk_runChildAct(i);
  };
}

// ---------- closeModal: sembunyikan jika result, pulihkan tombol ----------
const _bk_closeModal=closeModal;
closeModal=function(){
  _bk_closeModal();
};

// ---------- snapshot juga untuk aktivitas yg lewat openChoice langsung ----------
// (resolveChoice sudah render; cukup snapshot di openChoice supaya delta benar)
const _bk_openChoice=openChoice;
openChoice=function(data){
  snapStats();
  _bk_openChoice(data);
};
