// ============================================================
//  TAKDIR v3 — UI / RENDER
// ============================================================
function toast(msg){
  const t=document.getElementById("toast");t.textContent=typeof playerText==="function"?playerText(msg):String(msg).replace(/<[^>]*>/g,"");t.classList.add("show");
  clearTimeout(t._tm);t._tm=setTimeout(()=>t.classList.remove("show"),2200);
}
function log(yr,t,cls){if(!C._log)C._log=[];C._log.unshift({yr,t,cls});if(C._log.length>40)C._log.pop();}
function logHTML(){return C._log.map(e=>`<div class="entry"><span class="yr">${e.yr}th</span><span class="${e.cls||''}">${e.t}</span></div>`).join("");}

// ---------- RELASI ----------
function renderRelasi(){
  C.pendingDot=false;document.getElementById("dotRelasi").classList.remove("on");
  if(!C.relations.length){
    document.getElementById("viewRelasi").innerHTML=
      `<div class="sechead">Relasi</div><p style="font-size:13px;color:var(--ink-soft);filter:brightness(1.6);text-align:center;padding:30px 10px;line-height:1.6;">Belum ada relasi. Temui orang lewat aktivitas atau seiring waktu.</p>`;
    return;}
  // label hubungan yang spesifik (istri/suami, tunangan, ayah/ibu, putra/putri...)
  const relLabel=r=>{
    if(r.role==="pasangan"){
      if(r._spouse)return r.female?"Istri":"Suami";
      if(r._engaged)return "Tunangan 💍";
      return "Pacar";
    }
    if(r.isChild)return r.female?"Putri":"Putra";
    if(r.kin)return r.kin;
    if(r.role==="bestie")return "Sahabat Karib";
    if(r.role==="musuh")return "Musuh";
    return r.role.charAt(0).toUpperCase()+r.role.slice(1);
  };
  const relCard=r=>{
    const meter=r.role==="pengikut"?r.loyalty:r.bond;
    const meterLabel=r.role==="pengikut"?"Loyalitas":"Ikatan";
    const barColor=r.role==="musuh"?"linear-gradient(90deg,#7a1f2b,#c0392b)":
      r.role==="pasangan"?"linear-gradient(90deg,#6e2a4a,#d06ea0)":"linear-gradient(90deg,#6e5a1a,#d4af37)";
    const acts=REL_ACTIONS[r.role]||[];
    const profile=typeof ensureProfile==="function"?ensureProfile(r):null;
    const age=typeof relationAge==="function"?relationAge(r):Math.max(0,C.age-r.met);
    const job=typeof relationJob==="function"?relationJob(r):(profile&&profile.job||"Belum diketahui");
    const life=typeof relationLifeStatus==="function"?relationLifeStatus(r):"Belum diketahui";
    const origin=profile&&profile.origin?profile.origin:"Belum diketahui";
    return `<div class="relcard">
      <div class="reltop reltop-open" role="button" tabindex="0" aria-label="Buka profil ${r.name}" onclick="openOverview('${r.id}')" onkeydown="if(event.key==='Enter'||event.key===' '){event.preventDefault();openOverview('${r.id}')}" title="Ketuk untuk profil lengkap">
        <div class="relav">${typeof npcAvatar==="function"?npcAvatar(r,age):r.ico}</div>
        <div class="relinfo">
          <div class="relname">${r.name}</div>
          <div class="relrole role-${r.role}">${relLabel(r)} · ${r.trait}</div>
          <div class="reldetails"><span>Usia <b>${age} th</b></span><span>Kerja <b>${job}</b></span><span>Asal <b>${origin}</b></span><span>Status <b>${life}</b></span></div>
          <div class="relbar"><div class="relfill" style="width:${meter}%;background:${barColor}"></div></div>
          <div class="relmeta"><span>${meterLabel} ${Math.round(meter)}</span><span>kenal ${C.age-r.met}th</span></div>
        </div>
      </div>
      <div class="relacts">
        ${acts.map((act,i)=>`<button class="ra ${act.cls||''}" onclick="doRelAction('${r.id}',${i})">${act.label}</button>`).join("")}
      </div></div>`;
  };
  // KATEGORISASI: pasangan, orang tua, anak, sahabat, teman, pengikut, musuh
  const GROUPS=[
    {ico:"💞",title:"Pasangan & Cinta",f:r=>r.role==="pasangan"},
    {ico:"🏡",title:"Orang Tua & Kerabat",f:r=>r.role==="keluarga"&&!r.isChild},
    {ico:"👶",title:"Anak-Anak",f:r=>r.isChild},
    {ico:"🌟",title:"Sahabat Karib",f:r=>r.role==="bestie"},
    {ico:"🙂",title:"Teman & Rekan",f:r=>r.role==="teman"||r.role==="rekan"},
    {ico:"🐾",title:"Pengikut",f:r=>r.role==="pengikut"},
    {ico:"😠",title:"Musuh & Rival",f:r=>r.role==="musuh"},
  ];
  let html="";
  const used=new Set();
  GROUPS.forEach(g=>{
    const list=C.relations.filter(r=>!used.has(r.id)&&g.f(r));
    if(!list.length)return;
    list.sort((a,b)=>(b.role==="pengikut"?b.loyalty:b.bond)-(a.role==="pengikut"?a.loyalty:a.bond));
    list.forEach(r=>used.add(r.id));
    html+=`<div class="sechead">${g.ico} ${g.title} (${list.length})</div>`;
    list.forEach(r=>{html+=relCard(r);});
  });
  const rest=C.relations.filter(r=>!used.has(r.id));
  if(rest.length){
    html+=`<div class="sechead">🤝 Lainnya (${rest.length})</div>`;
    rest.forEach(r=>{html+=relCard(r);});
  }
  document.getElementById("viewRelasi").innerHTML=html;
}
function doRelAction(relId,actIdx){
  if(!spendAction()){renderHidup();return;}
  const r=C.relations.find(x=>x.id===relId);if(!r)return;
  const act=(REL_ACTIONS[r.role]||[])[actIdx];if(!act)return;
  const msg=act.run(r);log(C.age,msg,"e-good");toast(msg);
  if(C.stats.health<=0){die("Pilihanmu berakibat fatal.");return;}
  checkMissions();updateTitle();renderAll();
}

function buyBiz(id){
  const def=BUSINESS_TYPES.find(b=>b.id===id);if(C.coin<def.buy){toast("Koin tidak cukup.");return;}
  C.coin-=def.buy;C.businesses.push({id,level:0});
  log(C.age,`Kau membuka ${def.name}! Income +${def.income[0]}/tahun.`,"e-epic");toast(`${def.name} dibuka!`);
  checkMissions();updateTitle();renderAset();renderHidup();
}
function upgradeSkill(id){
  const def=SKILL_TYPES.find(t=>t.id===id);let owned=C.skills.find(s=>s.id===id);
  const lvl=owned?owned.level:0;if(lvl>=5)return;const cost=(lvl+1)*60;
  if(C.coin<cost){toast("Koin tidak cukup.");return;}
  C.coin-=cost;if(owned)owned.level++;else C.skills.push({id,level:1});
  toast(`${def.name} naik ke tingkat ${lvl+1}!`);renderAset();renderHidup();
}

// ---------- CAREER ----------
function applyCareer(id){
  const car=CAREERS.find(x=>x.id===id);if(!car||!car.req(C)){toast("Syarat belum cukup.");return;}
  C.career=id;C.careerLevel=0;C.careerYears=0;
  log(C.age,`Kau memulai karir sebagai ${car.ranks[0]} (${car.name}).`,"e-good");toast(`Karir: ${car.name}`);
  updateTitle();renderAktivitas();renderHidup();
}
function quitCareer(){
  const car=CAREERS.find(x=>x.id===C.career);
  log(C.age,`Kau berhenti dari ${car.name}.`,"");C.career=null;C.careerLevel=0;C.careerYears=0;
  updateTitle();renderAktivitas();renderHidup();
}

// ---------- NAV (legacy switchTab di-override v5+) ----------
function renderAll(){renderHidup();
  if(currentTab==="Aktivitas")renderAktivitas();if(currentTab==="Relasi")renderRelasi();
  if(currentTab==="Peta")renderPeta();if(currentTab==="Aset")renderAset();}
function render(){renderHidup();
  if(C.pendingDot&&currentTab!=="Relasi")document.getElementById("dotRelasi").classList.add("on");}

// ---------- START ----------
let chosenOrigin="peasant";
function initOrigins(){
  document.getElementById("origins").innerHTML=ORIGINS.map(o=>`
    <button class="origin ${o.id===chosenOrigin?'sel':''}" data-id="${o.id}" onclick="selOrigin('${o.id}')">
      <span class="oico">${o.ico}</span>
      <span style="flex:1"><span class="oname">${o.name}</span>
      <span class="odesc">${o.desc}</span></span></button>`).join("");
}
function selOrigin(id){chosenOrigin=id;
  document.querySelectorAll(".origin").forEach(e=>e.classList.toggle("sel",e.dataset.id===id));}
function restart(){
  document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
  document.getElementById("tabbar").classList.add("hidden");
  document.getElementById("agewrap").classList.add("hidden");
  document.getElementById("startScreen").classList.remove("hidden");initOrigins();
}

// ---------- AMBIENT ----------
(function(){const a=document.getElementById("ambient");if(!a)return;const glyphs=["✦","✧","·","⟡","∴"];
  // Optimasi: hormati prefers-reduced-motion (tanpa ember) & sesuaikan jumlah dgn lebar layar (hemat GPU di HP kentang)
  let reduce=false;try{reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){}
  if(reduce)return;
  const N=Math.max(6,Math.min(14,Math.round((window.innerWidth||360)/32)));
  const frag=document.createDocumentFragment();
  for(let i=0;i<N;i++){const e=document.createElement("div");e.className="ember";
    e.textContent=glyphs[Math.floor(Math.random()*glyphs.length)];
    e.style.left=Math.random()*100+"%";e.style.fontSize=(8+Math.random()*11)+"px";
    e.style.color=Math.random()>0.5?"#b8860b":"#8b9cff";e.style.opacity=0.4;
    e.style.willChange="transform,opacity";
    e.style.animationDuration=(11+Math.random()*12)+"s";e.style.animationDelay=(-Math.random()*12)+"s";
    frag.appendChild(e);}
  a.appendChild(frag);})();
initOrigins();
