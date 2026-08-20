// ============================================================
//  TAKDIR v6 — FONDASI: Waktu Bulanan + Peta 4 Kota
// ============================================================
// v24 BALANCE: 50 aksi/tahun berarti pemain bisa melakukan SEMUANYA tiap tahun
// -> tidak ada trade-off, tidak ada penyesalan, tidak ada strategi.
// 8 aksi memaksa pemain memilih, dan membuat setiap aksi terasa berbobot.
const ACTIONS_PER_YEAR=8;
const ACTION_BONUS_CAP=4;   // bonus aksi maksimal per tahun dari aktivitas

// ---------- 4 KOTA ----------
// env: efek lingkungan tiap bulan {stat:delta}. Diredam jika skill tinggi.
// sublocs: sub-lokasi ikonik. exclusive: item/quest khas kota.
const CITIES=[
  {id:"aetheria",ico:"🏰",name:"Aetheria",tag:"Ibukota Kerajaan",
    pros:["Banyak karir & sekolah","Paling aman dari bandit"],
    cons:["Biaya hidup mahal","Polusi kota tinggi"],
    env:{happy:-1,health:-1},          // polusi
    costMul:1.4,                        // harga barang/jasa lebih mahal
    exclusive:"Barang Antik Kerajaan",
    sublocs:[
      {id:"ae_palace",ico:"👑",name:"Istana Aurelia",desc:"Pusat kekuasaan & intrik politik."},
      {id:"ae_market",ico:"🏛️",name:"Pasar Agung",desc:"Pasar termewah, barang antik langka."},
      {id:"ae_academy",ico:"🎓",name:"Akademi Kerajaan",desc:"Sekolah sihir, ksatria, & dagang."},
      {id:"ae_baths",ico:"♨️",name:"Pemandian Marmer",desc:"Baths mewah, pulihkan tubuh & pesona."},
    ]},
  {id:"thornvale",ico:"🌲",name:"Thornvale",tag:"Kota Hutan",
    pros:["Berburu & herbal melimpah","Biaya hidup murah"],
    cons:["Bandit mengintai","Jauh dari pusat"],
    env:{happy:+1,health:+1,coin:-0},  // alam sehat, tapi bandit (event)
    costMul:0.8,
    exclusive:"Kulit Buruan Langka",
    sublocs:[
      {id:"th_woods",ico:"🌳",name:"Hutan Whisperwood",desc:"Berburu buruan & makhluk buas."},
      {id:"th_camp",ico:"⛺",name:"Kamp Pemburu",desc:"Jual hasil buruan, rekrut pemburu."},
      {id:"th_herbalist",ico:"🌿",name:"Pondok Herbalis",desc:"Apothecary — ramuan & herbal."},
      {id:"th_market",ico:"🪵",name:"Pasar Kayu",desc:"Pasar sederhana barang hutan."},
    ]},
  {id:"saltmoor",ico:"⚓",name:"Saltmoor",tag:"Kota Pelabuhan",
    pros:["Perdagangan & judi ramai","Peluang trader besar"],
    cons:["Wabah sering melanda","Banyak kriminal"],
    env:{health:-2,coin:+0},           // wabah pelabuhan
    costMul:1.0,
    exclusive:"Harta Karun Bajak Laut",
    sublocs:[
      {id:"sa_docks",ico:"🚢",name:"Dermaga",desc:"Bongkar muat, kerja & dagang laut."},
      {id:"sa_den",ico:"🎲",name:"Sarang Judi",desc:"Gambling: dadu & kartu fantasi."},
      {id:"sa_black",ico:"🕯️",name:"Pasar Gelap",desc:"Barang ilegal & harta selundupan."},
      {id:"sa_grocer",ico:"🐟",name:"Pasar Ikan",desc:"Grocery — makanan laut segar."},
    ]},
  {id:"frostspire",ico:"🗼",name:"Frostspire",tag:"Kota Sihir Beku",
    pros:["Menara Arcane, mana melimpah","Pusat ilmu sihir"],
    cons:["Udara beku potong nyawa","Terisolasi & dingin"],
    env:{health:-2,mana:+1},           // beku tapi kaya arcane
    costMul:1.1,
    exclusive:"Artefak Arcane",
    sublocs:[
      {id:"fr_tower",ico:"🗼",name:"Menara Arcanum",desc:"Latihan sihir tingkat tinggi."},
      {id:"fr_library",ico:"📚",name:"Perpustakaan Beku",desc:"Gulungan & mantra kuno."},
      {id:"fr_forge",ico:"❄️",name:"Tempa Es",desc:"Senjata & zirah ber-enchant es."},
      {id:"fr_apoth",ico:"⚗️",name:"Apothecary Arcane",desc:"Ramuan mana & obat langka."},
    ]},
];

// ---------- MATRIKS JARAK (aksi yg dipakai utk travel antar kota) ----------
// simetris; makin jauh makin mahal aksi
const CITY_DISTANCE={
  aetheria:   {aetheria:0, thornvale:8,  saltmoor:10, frostspire:14},
  thornvale:  {aetheria:8, thornvale:0,  saltmoor:12, frostspire:11},
  saltmoor:   {aetheria:10,thornvale:12, saltmoor:0,  frostspire:16},
  frostspire: {aetheria:14,thornvale:11, saltmoor:16, frostspire:0},
};

// ---------- HELPER WAKTU ----------
function timeLabel(){return `Tahun ke-${C.age}`;}
function cityOf(id){return CITIES.find(c=>c.id===id);}
function currentCity(){return cityOf(C.cityId);}

// redam efek negatif lingkungan kalau skill relevan tinggi
function envDamping(){
  // pedang & sihir tinggi -> tahan lingkungan keras
  const tough=Math.max(C.stats.might,C.stats.mana);
  return tough>=70?0.2 : tough>=50?0.5 : tough>=30?0.8 : 1.0;
}

// ============================================================
//  TAKDIR v6 — Engine waktu bulanan, travel, keluarga
// ============================================================

// ---------- override newChar: sistem tahunan, kota, kuota aksi ----------
const _v5NewChar=newChar;
newChar=function(originId){
  const c=_v5NewChar(originId);
  c.cityId="aetheria";               // default, ditimpa draft
  c.homeCityId="aetheria";           // kota asal (untuk rasa "jauh dari rumah")
  c.actionsLeft=ACTIONS_PER_YEAR;
  c.actionBonus=0;                   // bonus terkumpul tahun ini (cap 6)
  c.yearsAwayFromHome=0;             // berapa tahun jauh dari kota asal
  c.location=c.cityId;               // kompat lama
  return c;
};

// ---------- override createFromDraft: pasang kota pilihan ----------
const _v5CreateFromDraft=createFromDraft;
createFromDraft=function(){
  _v5CreateFromDraft();
  C.cityId=draft.cityId||"aetheria";
  C.homeCityId=C.cityId;
  C.location=C.cityId;
  C.subloc=null;
  C._visited=[C.cityId];
};

// ---------- KUOTA AKSI ----------
function spendAction(n=1){
  if(C.actionsLeft<n){toast("Aksi tahun ini habis. Lanjut ke tahun berikutnya.");return false;}
  C.actionsLeft-=n;return true;
}
function grantActionBonus(n){
  const room=ACTION_BONUS_CAP-C.actionBonus;
  const give=Math.min(n,room);
  if(give>0){C.actionBonus+=give;C.actionsLeft+=give;toast(`+${give} aksi bonus tahun ini!`);}
}

// ---------- ADVANCE YEAR (mengganti ageUp & advanceMonth) ----------
function teenAllowanceAmount(){
  const base=Math.round((C.familyWealth||0)*0.3);
  const mins={orphan:25,peasant:15};
  return Math.max(mins[C.origin]||20,base);
}
function maybeGrantTeenAllowance(wasChild){
  if(wasChild&&C.age>=13&&!C.allowance){
    C.allowance=true;
    const give=teenAllowanceAmount();
    if(give>0){
      C.coin+=give;
      log(C.age,`Kau cukup dewasa untuk mengelola uang. Keluarga memberimu ${give} keping sebagai bekal.`,"e-good");
    }
  }
}

function advanceYear(){
  if(!C.alive)return;
  const wasChild=C.age<13;
  C.age++;
  maybeGrantTeenAllowance(wasChild);

  // reset kuota aksi tahunan
  C.actionsLeft=ACTIONS_PER_YEAR;
  C.actionBonus=0;

  // efek lingkungan kota (diredam skill) — skala tahunan
  const city=currentCity();const damp=envDamping();
  if(city.env){
    for(const k in city.env){
      let d=city.env[k]*3;                     // efek setahun ~3x sebulan
      if(d<0)d=Math.round(d*damp);             // negatif diredam
      if(k==="coin")C.coin=Math.max(0,C.coin+d);
      else applyStats({[k]:d});
    }
  }

  // jauh dari rumah & keluarga
  if(C.cityId!==C.homeCityId){
    C.yearsAwayFromHome++;
    const fam=C.relations.filter(r=>r.role==="keluarga"||r.role==="pasangan");
    if(fam.length){
      fam.forEach(r=>{r.bond=clamp(r.bond-ri(3,7));});
      if(C.yearsAwayFromHome>=2&&chance(0.5))
        log(C.age,`Kau rindu & khawatir pada keluarga di ${cityOf(C.homeCityId).name}. (relasi menurun)`,"e-bad");
    }
  }else{
    C.yearsAwayFromHome=0;
  }

  // proses tahunan: gaji, bisnis, aset, umur
  processYearly();
  if(!C.alive)return;

  if(C.stats.health<=0)return die("Tubuhmu menyerah.");

  // event tahunan (~72% seperti semula)
  if(chance(0.72)){
    // v24: saring event yang baru muncul (<12 tahun) supaya tidak berulang.
    // Temuan review: "Ekspedisi berbahaya" muncul 8x dalam 45 tahun.
    let pool=EVENTS.filter(e=>C.age>=e.minAge&&C.age<=e.maxAge&&(!e.cond||e.cond(C)));
    if(typeof window.__eventCooldownOK==="function"){
      const fresh=pool.filter(e=>window.__eventCooldownOK(e));
      if(fresh.length>=3) pool=fresh;       // fallback kalau kolam terlalu tipis
    }
    if(pool.length){
      const tot=pool.reduce((s,e)=>s+(e.w||1),0);let r=Math.random()*tot,ev;
      for(const e of pool){r-=(e.w||1);if(r<=0){ev=e;break;}}
      ev=ev||pool[0];
      if(typeof window.__eventMarkSeen==="function")window.__eventMarkSeen(ev);
      if(ev.choice){openChoice(ev.choice());updateTitle();render();return;}
      const res=ev.auto();if(res&&res.t)log(C.age,res.t,res.cls);
    }
  }else{
    log(C.age,rand(["Tahun tenang berlalu.","Musim berganti damai.","Hanya rutinitas sehari-hari.","Hidup berjalan tanpa kejutan."]),"");
  }

  if(C.stats.health<=0)return die("Lukamu terlalu parah.");
  checkMissions();updateTitle();render();
  if(typeof flushRentQueue==="function")flushRentQueue();
}

// proses yg jalan tiap tahun (gaji, bisnis, aset, umur)
function processYearly(){
  if(typeof applyAssetPerksV4==="function")applyAssetPerksV4();
  processCareer();
  processBusinesses();
  if(C._bizRisk)log(C.age,C._bizRisk,"e-bad");
  if(C.age>50)applyStats({health:-ri(1,3)});
  if(C.age>65)applyStats({health:-ri(3,6)});
  if(C.age>60&&chance((C.age-60)*0.015)&&C.stats.health<35){die("Usia tua menjemputmu.");return;}
  if(typeof processActiveRentals==="function")C._rentQueue=processActiveRentals();
}

// ---------- TRAVEL antar kota ----------
// v24: CITY_DISTANCE dikalibrasi untuk 50 aksi/tahun. Dengan 8 aksi, biaya lama
// membuat perjalanan mustahil. Diskalakan ke 1..3 aksi -> tetap terasa mahal
// (1 perjalanan = 12-37% jatah tahunmu) tapi tidak mengunci pemain di satu kota.
function travelCost(from,to){
  try{
    const raw=CITY_DISTANCE[from][to];
    return Math.max(1,Math.min(3,Math.round(raw/4)));
  }catch(e){ return 2; }
}
function travelTo(cityId){
  if(cityId===C.cityId){toast("Kau sudah di kota ini.");return;}
  const dist=travelCost(C.cityId,cityId);
  if(C.actionsLeft<dist){toast(`Butuh ${dist} aksi untuk ke sana (sisa ${C.actionsLeft}). Lanjut tahun dulu.`);return;}
  // popup konfirmasi + opsi ajak keluarga
  const fam=C.relations.filter(r=>r.role==="keluarga"||r.role==="pasangan");
  const target=cityOf(cityId);
  const choices=[
    {label:`Berangkat sendiri`,sub:`${dist} aksi`,run:()=>{doTravel(cityId,dist,false);return null;}},
  ];
  if(fam.length){
    choices.unshift({label:`Ajak keluarga (${fam.length})`,sub:`${dist+1} aksi · relasi aman`,cls:"love",
      disabled:C.actionsLeft<dist+1,
      run:()=>{doTravel(cityId,dist+1,true);return null;}});
  }
  openChoice({ico:target.ico,prompt:`Bepergian ke <b>${target.name}</b> (${target.tag})?<br><span style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6)">${target.pros[0]} · tapi ${target.cons[0].toLowerCase()}</span>`,choices});
}
function doTravel(cityId,cost,withFamily){
  C.actionsLeft-=cost;
  C.cityId=cityId;C.location=cityId;C.subloc=null;
  if(withFamily){
    C.relations.filter(r=>r.role==="keluarga"||r.role==="pasangan").forEach(r=>r.bond=clamp(r.bond+ri(1,3)));
    C.yearsAwayFromHome=0;C.homeCityId=cityId;
  }
  const city=cityOf(cityId);
  log(C.age,`Kau tiba di ${city.name}. ${city.tag}.`,"e-good");
  toast(`Tiba di ${city.name}!`);
  closeModal();updateTitle();renderAll();
}

// ============================================================
//  TAKDIR v6 — UI: pilih kota, peta interaktif, header bulanan
// ============================================================

// ---------- extend initDraft: tambah pilihan kota ----------
const _v5InitDraft=initDraft;
initDraft=function(originId){
  _v5InitDraft(originId);
  draft.cityId="aetheria";
};

// ---------- render kustomisasi: sisipkan pemilihan kota ----------
const _v5RenderCustomize=renderCustomize;
renderCustomize=function(){
  _v5RenderCustomize();
  // sisipkan blok pilih kota sebelum tombol "Lahir ke Dunia"
  const wrap=document.querySelector("#customizeScreen .cust-wrap");
  if(!wrap)return;
  const cityBlock=document.createElement("div");
  cityBlock.className="cust-field";
  cityBlock.innerHTML=`<label>Kota Awal</label><div class="city-pick">`+
    CITIES.map(c=>`
      <button class="city-card ${draft.cityId===c.id?'sel':''}" onclick="setCity('${c.id}')">
        <div class="cc-top"><span class="cc-ico">${c.ico}</span>
          <span class="cc-name">${c.name}</span><span class="cc-tag">${c.tag}</span></div>
        <div class="cc-pros">✓ ${c.pros.join(" · ")}</div>
        <div class="cc-cons">✗ ${c.cons.join(" · ")}</div>
      </button>`).join("")+`</div>`;
  // taruh sebelum tombol lahir (tombol pertama .btn-age di wrap)
  const birthBtn=wrap.querySelector(".btn-age");
  wrap.insertBefore(cityBlock,birthBtn);
};
function setCity(id){draft.cityId=id;renderCustomize();}

// ---------- HEADER bulanan di tab Hidup (mandiri, ganti versi lama) ----------
renderHidup=function(){
  const city=currentCity();
  const statsHTML=STAT_ORDER.map(k=>{
    if(k==="mana"&&!C.isMage&&C.stats.mana<5)return "";
    const v=Math.round(C.stats[k]),m=STAT_META[k];
    return `<div><div class="statrow"><span class="statname">${m.name}</span><span class="statval">${v}</span></div>
      <div class="bar"><div class="fill ${m.cls}" style="width:${v}%"></div></div></div>`;}).join("");
  const nw=netWorth();
  const childMoney=C.age<13?`<span style="color:var(--ink-soft);filter:brightness(1.5)">Anak-anak (belum punya uang)</span>`:`💰 ${C.coin}`;
  const sublocName=C.subloc?' › '+((city.sublocs.find(s=>s.id===C.subloc)||{}).name||''):'';
  document.getElementById("viewHidup").innerHTML=`
    <div class="charcard">
      <div class="chartop">
        <div class="portrait ${C.isMage&&C.age>=16?'mage':''}">${portraitEmoji()}</div>
        <div class="cinfo">
          <div class="cname">${C.name}</div>
          <div class="ctitle">${C.title}</div>
          <div class="cage">Usia ${C.age} · ${C.female?"Perempuan":"Lelaki"}${C.married?" · Menikah":""} · 📍${city.name}${sublocName}</div>
          <div class="coin">${childMoney} · ⚡ Aksi ${C.actionsLeft}/${ACTIONS_PER_YEAR}${C.actionBonus?` (+${C.actionBonus})`:''}</div>
        </div>
      </div>
      <div class="networth">
        <div class="nw-item"><span class="nw-lbl">Kekayaan</span><span class="nw-val">💎 ${nw}</span></div>
        <div class="nw-item"><span class="nw-lbl">Reputasi</span><span class="nw-val">⭐ ${C.reputation}</span></div>
        <div class="nw-item"><span class="nw-lbl">Properti</span><span class="nw-val">🏠 ${C.properties.length}</span></div>
        <div class="nw-item"><span class="nw-lbl">Bisnis</span><span class="nw-val">🏪 ${C.businesses.length}</span></div>
      </div>
      <div class="stats">${statsHTML}</div>
    </div>
    <div class="logbox">${logHTML()}</div>`;
};

// ---------- PETA INTERAKTIF (klik kota -> sub-lokasi) ----------
function renderPeta(){
  const city=currentCity();
  let html=`<div class="sechead">🗺️ Dunia Aetheria — 4 Kota</div>`;

  // PETA VISUAL SVG dengan animasi
  if(typeof worldMapSVG==="function")html+=`<div class="map-wrap">${worldMapSVG()}</div>`;

  html+=`<p style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 12px;line-height:1.5;">Tap kota di peta untuk berpindah (atau lihat daftar di bawah). Kamu di <b>${city.name}</b>.</p>
    <div class="tiles">`;
  CITIES.forEach(c=>{
    const here=c.id===C.cityId;
    const dist=CITY_DISTANCE[C.cityId][c.id];
    html+=`<div class="tile city-tile ${here?'here':''}" onclick="${here?`viewCity()`:`travelTo('${c.id}')`}">
      ${here?'<span class="badge">DI SINI</span>':`<span class="badge dist">${dist}⚡</span>`}
      <span class="ti">${c.ico}</span><span class="tn">${c.name}</span>
      <span class="td">${c.tag}</span></div>`;
  });
  html+=`</div>`;

  // sub-lokasi kota saat ini
  html+=`<div class="sechead">📍 Sub-Lokasi ${city.name}</div>
    <p style="font-size:10.5px;color:var(--gold);filter:brightness(1.1);margin:0 4px 10px;">Eksklusif di sini: ${city.exclusive}</p>
    <div class="tiles">`;
  city.sublocs.forEach(s=>{
    const at=C.subloc===s.id;
    html+=`<div class="tile ${at?'here':''}" onclick="gotoSubloc('${s.id}')">
      ${at?'<span class="badge">DI SINI</span>':''}
      <span class="ti">${s.ico}</span><span class="tn">${s.name}</span>
      <span class="td">${s.desc}</span></div>`;
  });
  html+=`</div>`;

  // distrik toko pindah ke tab Toko — beri pintasan
  html+=`<div class="sechead">🛒 Distrik Perbelanjaan</div>
    <div class="tiles"><div class="tile fullrow" onclick="switchTab('Toko')">
      <span class="ti">🛒</span><span class="tn">Kunjungi Distrik Toko ${city.name}</span>
      <span class="td">Toko-toko khusus, bimbel sihir & perguruan bela diri — buka tab Toko</span></div></div>`;

  document.getElementById("viewPeta").innerHTML=html;
}
function viewCity(){toast(`Kamu sudah di ${currentCity().name}. Pilih sub-lokasi di bawah.`);}
function gotoSubloc(id){
  C.subloc=id;
  const s=currentCity().sublocs.find(x=>x.id===id);
  toast(`Menuju ${s.name}.`);
  renderPeta();renderHidup();
}

// ---------- ganti tombol "Tambah Usia" jadi "Lanjut Bulan" ----------
function setupMonthlyButton(){
  const btn=document.getElementById("btnAge");
  if(btn){btn.textContent="Lanjut Tahun ▸";btn.setAttribute("onclick","advanceYear()");}
}

// ---------- override switchTab supaya tombol bulanan & label benar ----------
const _v5SwitchTab=switchTab;
switchTab=function(name){
  _v5SwitchTab(name);
  setupMonthlyButton();
};

// override confirmCustomize agar pasang tombol bulanan
const _v5Confirm=confirmCustomize;
confirmCustomize=function(){
  _v5Confirm();
  setupMonthlyButton();
};

// ---------- override renderAktivitas v6 (pakai kota/sub-lokasi, bukan LOCATIONS lama) ----------
renderAktivitas=function(){
  const city=currentCity();
  let html="";
  // konteks lokasi
  const sub=C.subloc?city.sublocs.find(s=>s.id===C.subloc):null;
  html+=`<div class="sechead">📍 ${city.name}${sub?' › '+sub.name:''}</div>`;
  html+=`<p style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 10px;line-height:1.5;">${sub?sub.desc:'Pilih sub-lokasi di tab Peta untuk aktivitas khusus. Aktivitas umum bisa di mana saja.'}</p>`;

  // aktivitas khas sub-lokasi (Prioritas 2)
  if(typeof sublocActsHTML==="function")html+=sublocActsHTML();

  // karir & sekolah kini SATU menu di Diri → Karir (minim menu luar)
  html+=`<div class="sechead">🎓💼 Sekolah & Karir</div>
    <div class="tiles"><div class="tile fullrow" onclick="switchTab('Karir')">
      <span class="ti">💼</span><span class="tn">Buka Menu Karir</span>
      <span class="td">${C.age<MIN_WORK_AGE?'Status sekolah, jurusan & persiapan kerja':'Pekerjaan, performa, keahlian profesi & lowongan'} — semua di satu tempat</span></div></div>`;

  // aktivitas umum
  html+=`<div class="sechead">Aktivitas Umum</div><div class="tiles">`;
  ACTIVITIES.filter(a=>!a.cond||a.cond(C)).forEach(a=>{
    const minA=(typeof ACT_MIN_AGE!=="undefined"&&ACT_MIN_AGE[a.id])||0;
    const locked=C.age<minA;
    html+=`<div class="tile ${a.arcane?'arcane':''} ${locked?'locked':''}" ${locked?'':`onclick="openSubs('${a.id}')"`}>
      <span class="ti">${a.ico}</span><span class="tn">${a.name}</span>
      <span class="td">${locked?`🔒 min ${minA} th`:a.desc}</span></div>`;});
  html+=`</div>`;

  // misi
  html+=`<div class="sechead">Misi & Tujuan</div>`;
  C.missions.forEach(ms=>{const def=MISSION_POOL.find(m=>m.id===ms.id);
    html+=`<div class="mission" style="${ms.done?'opacity:.55':''}">
      <div class="mtitle">${ms.done?'✅ ':''}${def.title}</div>
      <div class="mdesc">${def.desc}</div></div>`;});
  document.getElementById("viewAktivitas").innerHTML=html;
};

// catat kota dikunjungi saat travel
const _v6DoTravel=doTravel;
doTravel=function(cityId,cost,withFamily){
  _v6DoTravel(cityId,cost,withFamily);
  if(!C._visited)C._visited=[];
  if(!C._visited.includes(cityId))C._visited.push(cityId);
  checkMissions();
};
