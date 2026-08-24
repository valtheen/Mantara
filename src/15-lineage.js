// ============================================================
//  TAKDIR — KETURUNAN & PEWARISAN HARTA
// ============================================================
// pendekatan non-eksplisit: "punya anak" hanya untuk pasangan MENIKAH 18+.
// fokus mekanik keluarga & warisan, bukan konten dewasa.

// ---------- perbaiki & perkaya REL_ACTIONS.pasangan ----------
// jenjang: pacar -> tunangan -> menikah -> punya anak (18+)
(function rebuildPasanganActions(){
  if(typeof REL_ACTIONS==="undefined")return;
  REL_ACTIONS.pasangan=[
    {label:"💞 Kencan",cls:"love",run:r=>{r.bond=clamp(r.bond+ri(5,10));applyStats({happy:+6});return `Kau & ${r.name} berkencan mesra.`;}},
    {label:"💍 Lamar (tunangan)",cls:"love",run:r=>{
      if(C.married)return "Kau sudah menikah.";
      if(C.age<16)return "Kau terlalu muda untuk bertunangan.";
      if(r._engaged)return `Kau sudah bertunangan dengan ${r.name}.`;
      // butuh cincin! beli di 💍 Ahli Permata (Dunia → Toko)
      const RING_DEF=[["ring_dragon","Cincin Berlian Naga",25],["ring_gold","Cincin Emas",12],["ring_silver","Cincin Perak",5]];
      const have=RING_DEF.find(x=>(C.inventory&&C.inventory[x[0]]||0)>0);
      if(!have)return "Melamar tanpa cincin? Beli dulu di 💍 TUKANG PERMATA (Dunia → Toko — hanya ada di Aetheria & Saltmoor).";
      if(r.bond+have[2]>=65){
        C.inventory[have[0]]--;
        r._engaged=true;r.bond=clamp(r.bond+8);applyStats({happy:+12});
        return `Kau berlutut menyodorkan ${have[1]}... ${r.name} MENERIMA! Kalian bertunangan! 💍`;}
      return `${r.name} tersentuh melihat ${have[1]}, tapi hubungan kalian belum cukup kuat. (cincin tidak hilang)`;}},
    {label:"💒 Menikah",cls:"love",run:r=>{
      if(C.married)return "Kau sudah menikah.";
      if(C.age<18)return "Kau harus berusia 18 tahun untuk menikah.";
      if(!r._engaged)return "Bertunangan dulu sebelum menikah.";
      if(r.bond>=70){C.married=true;r._spouse=true;applyStats({happy:+20});C.coin=Math.max(0,C.coin-ri(20,60));
        return `Kau menikah dengan ${r.name}! Pesta megah digelar. 💒`;}
      return `${r.name} belum siap menikah.`;}},
    {label:"👶 Bina keluarga (punya anak)",run:r=>{
      if(!C.married||!r._spouse)return "Hanya pasangan menikah yang bisa membina keluarga.";
      if(C.age<18)return "Kau harus dewasa (18+) untuk membina keluarga.";
      if(C.age>55)return "Usiamu sudah tak memungkinkan untuk punya anak.";
      const heirs=C.relations.filter(x=>x.isChild).length;
      if(heirs>=5)return "Kau sudah punya banyak keturunan.";
      // panggil prosedur lahir (non-eksplisit)
      setTimeout(()=>bornChild(r),100);
      return `Kalian memutuskan menambah anggota keluarga...`;}},
    {label:"💔 Berpisah",run:r=>{C.married=false;r._spouse=false;r._engaged=false;r.role="teman";r.bond=clamp(r.bond-ri(15,30));applyStats({happy:-12});return `Kau berpisah dengan ${r.name}. Hatimu pedih.`;}},
  ];
})();

// ---------- kelahiran anak (non-eksplisit) ----------
function bornChild(parentRel){
  const female=chance(0.5);
  const surname=C.name.split(" ").slice(1).join(" ")||"";
  const childName=typeof uniqueFamilyName==="function"?uniqueFamilyName(female,surname):randName(female);
  // anak warisi sebagian stat ortu (rata-rata + variasi)
  const inheritStat=k=>clamp(Math.round((C.stats[k]*0.4)+ri(5,20)));
  const ch=addRel("keluarga",{name:childName,female,bond:ri(70,90),isChild:true});
  ch._isHeir=true;
  ch._inherited={
    might:inheritStat("might"),mana:inheritStat("mana"),mind:inheritStat("mind"),charm:inheritStat("charm"),
  };
  ch._birthYear=C.age;
  applyStats({happy:+15,health:-3});
  C.coin=Math.max(0,C.coin-ri(10,30));
  if(typeof snapStats==="function")snapStats();
  if(typeof showResult==="function"){
    showResult({ico:"👶",title:"Kelahiran!",cls:"e-epic",
      body:`Selamat! ${childName} lahir ke dunia sebagai buah hatimu & ${parentRel.name}. Suatu hari ia bisa mewarisi namamu, hartamu, dan gelarmu.`});
  }
  if(typeof renderAll==="function")renderAll();
}

// ---------- PEWARISAN saat mati ----------
// dipanggil dari die(); cari ahli waris (anak hidup), wariskan stat/harta/gelar/aset.
function computeInheritance(){
  const heirs=C.relations.filter(r=>r.isChild&&r._isHeir!==false);
  return heirs;
}

// bangun karakter ahli waris baru dari anak terpilih
function buildHeirCharacter(heir){
  // pastikan tidak ada popup/modal nyangkut dari hidup sebelumnya
  if(typeof pendingChoice!=="undefined")pendingChoice=null;
  const modalEl=document.getElementById("modal");
  if(modalEl&&modalEl.classList)modalEl.classList.remove("show");
  // mulai karakter baru tapi warisi sebagian
  const inh=heir._inherited||{might:20,mana:20,mind:20,charm:20};
  // gunakan origin pemain (garis keturunan)
  chosenOrigin=C.origin;
  const oldName=C.name;
  const oldTitle=C.title;
  const inheritCoin=Math.round(C.coin*0.6);          // 60% harta diwariskan
  const inheritProps=C.properties.slice();           // properti diwariskan
  const inheritBiz=C.businesses.slice();             // bisnis diwariskan
  const inheritRep=Math.round(C.reputation*0.3);
  // buat karakter baru
  beginLife();
  draft.cityId=C.cityId||"aetheria";
  draft.name=heir.name;
  draft.female=heir.female;
  confirmCustomize();
  // terapkan warisan
  C.name=heir.name;
  C.female=heir.female;
  C.stats.might=clamp(C.stats.might+Math.round(inh.might*0.5));
  C.stats.mana=clamp(C.stats.mana+Math.round(inh.mana*0.5));
  C.stats.mind=clamp(C.stats.mind+Math.round(inh.mind*0.5));
  C.stats.charm=clamp(C.stats.charm+Math.round(inh.charm*0.5));
  C.coin=inheritCoin;
  C.familyWealth=inheritCoin;
  C.properties=inheritProps;
  C.businesses=inheritBiz;
  C.reputation=inheritRep;
  C._lineage=(heir._lineage||1)+1;  // generasi ke-berapa
  C._ancestorName=oldName;
  C._ancestorTitle=oldTitle;
  C._visited=[C.cityId];
  log(C.age,`🩸 Kau adalah ${heir.name}, pewaris ${oldName}. Warisan: ${inheritCoin} keping, ${inheritProps.length} properti, ${inheritBiz.length} bisnis.`,"e-epic");
  updateTitle();
  // tampilkan UI bermain lagi
  document.getElementById("overScreen").classList.add("hidden");
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("hidden"));
  document.getElementById("agewrap").classList.remove("hidden");
  document.getElementById("tabbar").classList.remove("hidden");
  switchTab("Hidup");
  if(typeof setupMonthlyButton==="function")setupMonthlyButton();
  renderAll&&renderAll();
}

// ============================================================
//  PATCH — Kematian & Pewarisan (UI game over + pilihan ahli waris)
// ============================================================

die=function(reason){
  C.alive=false;updateTitle();log(C.age,reason,"e-death");
  setTimeout(()=>{
    document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));
    document.getElementById("agewrap").classList.add("hidden");
    document.getElementById("tabbar").classList.add("hidden");
    document.getElementById("overScreen").classList.remove("hidden");

    const heirs=computeInheritance();
    const totalAset=C.properties.length+C.businesses.length;
    let legacy,inheritBlock="";

    if(heirs.length){
      const inheritCoin=Math.round(C.coin*0.6);
      legacy=`${heirs.length} keturunan melanjutkan garis darahmu. 🩸`;
      inheritBlock=`<div class="inherit-box">
        <div class="inherit-title">⚜ Garis Keturunan Berlanjut</div>
        <div class="inherit-desc">Ahli warismu dapat melanjutkan kisah ini — mewarisi <b>${inheritCoin} keping</b>, <b>${C.properties.length} properti</b>, <b>${C.businesses.length} bisnis</b>, sebagian statistik, & reputasi.</div>
        <div class="inherit-heirs">${heirs.map((h,i)=>`<button class="heir-btn" onclick="chooseHeir(${i})">${h.female?'👧':'👦'} ${h.name}<span class="heir-sub">lanjut sebagai dia</span></button>`).join("")}</div>
      </div>`;
      window._deadHeirs=heirs;
    }else{
      // TIDAK ADA AHLI WARIS — harta hilang
      legacy=totalAset>0
        ? `Tanpa ahli waris, seluruh hartamu — ${C.properties.length} properti & ${C.businesses.length} bisnis — terbengkalai & lenyap ditelan zaman. ⚱️`
        : `Kau berlalu nyaris tanpa jejak.`;
      inheritBlock=`<div class="inherit-box noheir">
        <div class="inherit-title">⚱ Tak Ada Ahli Waris</div>
        <div class="inherit-desc">Semua harta & gelar yang kau kumpulkan hilang bersama kepergianmu. Mulai takdir baru dari awal.</div>
      </div>`;
      window._deadHeirs=null;
    }

    document.getElementById("epitaph").innerHTML=
      `<b>${C.name}</b><br>${C.title} · wafat usia ${C.age}${C._lineage?` · generasi ke-${C._lineage}`:''}<br>
       📍 ${typeof currentCity==="function"?currentCity().name:(C.cityId||"Aetheria")}<br>
       ${typeof deathCauseLine==="function"?deathCauseLine(reason):""}<br>
       Harta: ${C.coin} keping · Reputasi: ${C.reputation}<br>
       Relasi: ${C.relations.length} · Properti: ${C.properties.length} · Bisnis: ${C.businesses.length}<br>
       <i>${legacy}</i>${inheritBlock}`;
  },1400);
};

// pilih ahli waris -> lanjut main sebagai dia
function chooseHeir(idx){
  const heirs=window._deadHeirs;
  if(!heirs||!heirs[idx])return;
  const chosen=heirs[idx];
  window._deadHeirs=null;        // bersihkan agar tidak bocor ke hidup berikutnya
  buildHeirCharacter(chosen);
}
