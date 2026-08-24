// ============================================================
//  TAKDIR — BALANCING UMUR (perbaikan mortalitas)
// ============================================================
// Masalah lama: 78% mati sebelum 20 thn (median 9). Penyebab: efek lingkungan
// kota menggerus health balita yang tak berdaya + tak ada regenerasi.

// ----- 1) EFEK LINGKUNGAN: anak-anak sangat dilindungi -----
(function softenEnv(){
  if(typeof envDamping!=="function")return;
  const _bal_prevEnvDamping=envDamping;
  envDamping=function(){
    let d=_bal_prevEnvDamping.apply(this,arguments);
    if(typeof C!=="undefined"&&C){
      if(C.age<13)d=d*0.15;       // balita/anak: efek negatif ~85% lebih ringan
      else if(C.age<18)d=d*0.45;  // remaja: ~55% lebih ringan
    }
    return d;
  };
})();

// ----- 2) SATU override processYearly: regenerasi + lantai + kematian tua -----
(function installBalance(){
  if(typeof processYearly!=="function")return;
  const _bal_prevProcessYearly=processYearly;
  processYearly=function(){
    _bal_prevProcessYearly.apply(this,arguments);
    if(!C||!C.alive)return;

    // (a) REGENERASI HEALTH ALAMI — tubuh muda & sehat pulih perlahan
    if(C.age<55 && C.stats.health<100){
      const base=C.age<13?ri(3,6) : C.age<30?ri(2,4) : ri(1,3);
      applyStats({health:+base});
    }

    // (b) PENUAAN BERTAHAP setelah paruh baya
    if(C.age>=55 && C.age<70){if(chance(0.5))applyStats({health:-ri(1,3)});}
    else if(C.age>=70 && C.age<85){applyStats({health:-ri(2,4)});}
    else if(C.age>=85){applyStats({health:-ri(3,6)});}

    // (c) LANTAI PERLINDUNGAN anak/remaja — cegah mati konyol karena RNG
    if(C.age<13 && C.stats.health<35)C.stats.health=35;
    else if(C.age<18 && C.stats.health<15)C.stats.health=15;

    // (d) KEMATIAN USIA TUA realistis & bertahap (mulai relevan ~65+)
    if(C.age>=65){
      let p=(C.age-65)*0.012;          // 65→0% naik ke ~30% di usia 90
      if(C.age>=85)p+=0.05;
      if(C.stats.health<25)p+=0.10;    // sakit mempercepat
      if(chance(Math.min(p,0.6))){die("Usia tua menjemputmu dengan tenang.");return;}
    }

    // (e) KEMISKINAN BERTAHUN: tanpa uang, hidup makin berat
    if(C.age>=16){
      if(C.coin<=5){
        C._brokeYears=(C._brokeYears||0)+1;
        if(C._brokeYears===2)log(C.age,"Hidup serba kekurangan. Kebahagiaan terkikis.","e-bad");
        if(C._brokeYears>=2)applyStats({happy:-ri(2,5)});
        if(C._brokeYears>=3)applyStats({health:-ri(2,4)});
        if(C._brokeYears>=4&&chance(0.35)){
          C.reputation=Math.max(0,C.reputation-5);
          log(C.age,"Kemiskinan merusak namamu di mata orang.","e-bad");
        }
      }else if(C.coin>=25){
        C._brokeYears=0;
      }
    }
  };
})();

// ============================================================
//  MANTARA — SEKOLAH KOTA-SPESIALIS (jurusan + interaksi belajar)
// ============================================================
// Tiap kota besar punya sekolah dengan SPESIALISASI & nama unik.
// Pemain bisa: pilih jurusan, belajar ekstra (boost stat), ikut ujian,
// dan lihat karir yang dibuka jurusan tsb. Lulus -> syarat karir terkait.
//
// Tidak menggantikan sistem sekolah otomatis (enroll & naik kelas by umur);
// ini menambah LAPISAN interaksi + identitas kota.

// ---------- DATA: sekolah per kota ----------
// tiap kota: nama institusi, jurusan (major) dengan stat fokus & karir terkait
const CITY_SCHOOLS={
  aetheria:{
    name:"Kolese Tinggi Aurelia", ico:"👑", mark:"bangsawan", spec:"Bangsawan & Diplomasi",
    blurb:"Pusat pendidikan elit kerajaan. Tempat lahirnya diplomat, bangsawan, dan negarawan.",
    majors:[
      {id:"diplomacy", name:"Diplomasi & Tata Negara", ico:"🤝", stat:"charm",
        desc:"Seni bernegosiasi & memimpin.", careers:["diplomat","politician"]},
      {id:"etiquette", name:"Etiket & Seni Istana", ico:"🎭", stat:"charm",
        desc:"Tata krama, musik, sastra bangsawan.", careers:["bard","politician"]},
      {id:"law", name:"Hukum Kerajaan", ico:"⚖️", stat:"mind",
        desc:"Hukum, administrasi, & peradilan.", careers:["scholar","diplomat"]},
    ],
  },
  saltmoor:{
    name:"Guild Niaga Saltmoor", ico:"⚖️", mark:"dagang", spec:"Dagang & Pelayaran",
    blurb:"Tempa saudagar ulung & nakhoda tangguh. Belajar dari denyut pelabuhan tersibuk.",
    majors:[
      {id:"trade", name:"Niaga & Akuntansi", ico:"💰", stat:"mind",
        desc:"Hitung untung, kelola dagang, tawar.", careers:["merchant","politician"]},
      {id:"seafaring", name:"Pelayaran & Navigasi", ico:"⚓", stat:"might",
        desc:"Berlayar, navigasi, pimpin kapal.", careers:["captain","adventurer"]},
      {id:"appraisal", name:"Penaksiran Harta", ico:"💎", stat:"mind",
        desc:"Nilai barang langka & artefak.", careers:["merchant","thief"]},
    ],
  },
  frostspire:{
    name:"Akademi Arcanum Frostspire", ico:"🔮", mark:"sihir", spec:"Sihir & Arcane",
    blurb:"Menara ilmu sihir paling disegani. Mana mengalir deras di udara beku.",
    majors:[
      {id:"elemental", name:"Sihir Elemental", ico:"🔥", stat:"mana",
        desc:"Api, es, petir — sihir tempur.", careers:["adventurer","knight"]},
      {id:"alchemy", name:"Alkimia & Ramuan", ico:"⚗️", stat:"mana",
        desc:"Racik ramuan, transmutasi.", careers:["alchemist","healer"]},
      {id:"runes", name:"Rune & Enkripsi Kuno", ico:"📜", stat:"mind",
        desc:"Baca mantra kuno, enchant.", careers:["scholar","alchemist"]},
    ],
  },
  thornvale:{
    name:"Sanggar Rimba Whisperwood", ico:"🏹", mark:"rimba", spec:"Berburu & Survival",
    blurb:"Sekolah alam liar. Bertahan hidup, berburu, & meramu obat dari hutan.",
    majors:[
      {id:"hunting", name:"Berburu & Memanah", ico:"🏹", stat:"might",
        desc:"Lacak & taklukkan buruan.", careers:["adventurer","guard"]},
      {id:"herbalism", name:"Herbal & Pengobatan", ico:"🌿", stat:"mind",
        desc:"Kenali tanaman, obati luka.", careers:["healer","alchemist"]},
      {id:"survival", name:"Bela Diri Rimba", ico:"🗡️", stat:"might",
        desc:"Tangguh di alam keras.", careers:["gladiator","guard"]},
    ],
  },
};

// sub-lokasi sekolah ditambahkan ke tiap kota (muncul di peta)
(function injectSchoolSublocs(){
  if(typeof CITIES==="undefined")return;
  const SUB={
    aetheria:{id:"ae_school", ico:"🎓"},
    saltmoor:{id:"sa_school", ico:"🎓"},
    frostspire:{id:"fr_school",ico:"🎓"},
    thornvale:{id:"th_school",ico:"🎓"},
  };
  CITIES.forEach(c=>{
    const sc=CITY_SCHOOLS[c.id]; const sub=SUB[c.id];
    if(!sc||!sub)return;
    // jangan duplikat
    if(c.sublocs.some(s=>s.id===sub.id))return;
    c.sublocs.push({id:sub.id, ico:sub.ico, name:sc.name, desc:sc.spec+" — masuk untuk belajar.", _school:true});
  });
})();

// ---------- helper ----------
function citySchool(cityId){return CITY_SCHOOLS[cityId||C.cityId];}
function myMajor(){return C.schoolMajor||null;}
function majorData(cityId, majorId){
  const sc=citySchool(cityId); if(!sc)return null;
  return sc.majors.find(m=>m.id===majorId)||null;
}
// jenjang Tinggi (tier 2) = syarat minimal pilih jurusan, belajar ekstra, ikut ujian
const SCHOOL_MAJOR_TIER=2;
function highSchoolUnlocked(){
  const s=C&&C.school;
  return !!(s && !s.droppedOut && s.currentTier>=SCHOOL_MAJOR_TIER);
}
// pesan kenapa belum bisa (berdasarkan kondisi sekolah saat ini)
function schoolLockReason(){
  const s=C&&C.school;
  if(!s||s.currentTier<0){
    const hi=(typeof SCHOOL_LEVELS!=="undefined")?SCHOOL_LEVELS[SCHOOL_MAJOR_TIER]:null;
    return `Kau belum bersekolah. Jurusan & ujian baru terbuka saat masuk jenjang Tinggi (umur ~${hi?hi.enterAge:12}).`;
  }
  if(s.droppedOut)return "Kau putus sekolah. Jurusan tak tersedia.";
  if(s.currentTier<SCHOOL_MAJOR_TIER){
    const lv=(typeof SCHOOL_LEVELS!=="undefined")?SCHOOL_LEVELS[s.currentTier]:null;
    const hi=(typeof SCHOOL_LEVELS!=="undefined")?SCHOOL_LEVELS[SCHOOL_MAJOR_TIER]:null;
    return `Kau masih di jenjang ${lv?lv.name:"awal"}. Pilih jurusan & ujian terbuka di jenjang Tinggi (umur ~${hi?hi.enterAge:12}).`;
  }
  return null;
}

// ---------- PANEL SEKOLAH (dibuka dari sub-lokasi) ----------
function openSchool(){
  const sc=citySchool(); if(!sc){toast("Tak ada sekolah di kota ini.");return;}
  const s=C.school;
  const tier=s?s.currentTier:-1;
  const inSchool=s&&s.enrolled&&!s.droppedOut;
  const major=myMajor();
  const majorObj=major?majorData(C.cityId,major.id):null;

  // header + status (HTML utk prompt)
  const lvl=(typeof SCHOOL_LEVELS!=="undefined"&&tier>=0)?SCHOOL_LEVELS[tier]:null;
  const statusLine=s?`📚 ${tier<0?"Belum bersekolah":(lvl?`Jenjang ${lvl.name}`:"—")}${s.graduated&&s.graduated.length?` · lulus ${s.graduated.length} jenjang`:""}`:"";
  const schoolLogo=typeof schoolCrestHTML==="function"?schoolCrestHTML(sc.mark||"umum",2,C.cityId,sc.name):sc.ico;
  let info=`<div class="sch-name">${schoolLogo} ${sc.name}</div>
    <div class="sch-spec">${sc.spec}</div>
    <div class="sch-blurb">${sc.blurb}</div>
    <div class="sch-status">${statusLine}</div>`;
  if(major){
    const names=majorObj&&majorObj.careers?majorObj.careers.map(careerName).join(", "):"";
    info+=`<div class="sch-major">🎯 Jurusan: <b>${major.ico} ${major.name}</b><br><span class="sch-careers">🔓 ${names}</span></div>`;
  }else if(highSchoolUnlocked()){
    info+=`<div class="sch-major" style="text-align:center;color:var(--ink-soft);filter:brightness(1.5)">Pilih jurusan di bawah untuk fokus belajar.</div>`;
  }

  // pilihan
  const choices=[];
  const locked=!highSchoolUnlocked();
  const reason=schoolLockReason();

  if(locked){
    // belum jenjang Tinggi: tampilkan alasan, tak ada aksi belajar/jurusan
    info+=`<div class="sch-locked">🔒 ${reason}</div>`;
    choices.push({label:"💼 Program Karir",sub:"lihat prospek lulusan",run:()=>{closeModal();setTimeout(()=>viewSchoolCareers(),140);return null;}});
    choices.push({label:"Keluar",run:()=>null});
  }else if(!major){
    // udah jenjang Tinggi tapi belum pilih jurusan
    sc.majors.forEach(m=>{
      const names=(m.careers||[]).map(careerName).join(", ");
      choices.push({label:`${m.ico} Ambil Jurusan: ${m.name}`,sub:`${m.desc} · 🔓 ${names}`,run:()=>{chooseMajor(m.id);return null;}});
    });
    choices.push({label:"💼 Program Karir",sub:"lihat prospek lulusan",run:()=>{closeModal();setTimeout(()=>viewSchoolCareers(),140);return null;}});
    choices.push({label:"Keluar",run:()=>null});
  }else{
    // udah jenjang Tinggi & udah pilih jurusan: bisa belajar & ujian
    choices.push({label:"📖 Belajar Ekstra",sub:`+${statLabel(major.stat)}`,run:()=>{
      if(typeof spendAction==="function"&&!spendAction()){closeModal();toast("Aksi habis tahun ini.");return null;}
      const r=studyExtraRun();closeModal();if(r&&typeof log==="function")log(C.age,r.t,r.cls);if(r)toast(r.t);if(typeof renderHidup==="function")renderHidup();return null;}});
    choices.push({label:"📝 Ikut Ujian",sub:`uji ${statLabel(major.stat)}`,run:()=>{
      if(typeof spendAction==="function"&&!spendAction()){closeModal();toast("Aksi habis tahun ini.");return null;}
      const r=takeExamRun();closeModal();if(r&&typeof log==="function")log(C.age,r.t,r.cls);if(r)toast(r.t);if(typeof renderHidup==="function")renderHidup();return null;}});
    choices.push({label:"💼 Program Karir",sub:"lihat prospek lulusan",run:()=>{closeModal();setTimeout(()=>viewSchoolCareers(),140);return null;}});
    choices.push({label:"Keluar",run:()=>null});
  }

  if(typeof openChoice==="function"){openChoice({ico:sc.ico,prompt:info,choices});}
  else if(typeof showModal==="function"){showModal({ico:sc.ico,prompt:sc.name+" — "+sc.spec,choices});}
}

function careerName(cid){const cr=(typeof CAREERS!=="undefined")?CAREERS.find(x=>x.id===cid):null;return cr?cr.name:cid;}

// ---------- AKSI: pilih jurusan ----------
function chooseMajor(majorId){
  if(!highSchoolUnlocked()){
    if(typeof toast==="function")toast("Belum bisa pilih jurusan — masuk jenjang Tinggi dulu.");
    return;
  }
  const sc=citySchool(); if(!sc)return;
  const m=sc.majors.find(x=>x.id===majorId); if(!m)return;
  C.schoolMajor={id:m.id, name:m.name, ico:m.ico, stat:m.stat, careers:m.careers, city:C.cityId};
  if(typeof log==="function")log(C.age,`Kau mengambil jurusan ${m.name} di ${sc.name}.`,"e-good");
  if(typeof toast==="function")toast(`Jurusan: ${m.name}`);
  if(typeof closeModal==="function")closeModal();
  if(typeof renderHidup==="function")renderHidup();
}

// ---------- AKSI: belajar ekstra ----------
function studyExtraRun(){
  const major=myMajor();
  const stat=major?major.stat:"mind";
  if(typeof applyStats==="function"){const d={};d[stat]=ri(2,5);applyStats(d);}
  return {t:`Kau belajar tekun. ${statLabel(stat)} meningkat.`,cls:"e-good"};
}
function studyExtra(){
  if(typeof spendAction==="function"&&!spendAction()){toast("Aksi habis tahun ini.");return;}
  const r=studyExtraRun();
  if(r&&typeof log==="function")log(C.age,r.t,r.cls);
  if(r&&typeof toast==="function")toast(r.t);
  if(typeof renderHidup==="function")renderHidup();
}

// ---------- AKSI: ikut ujian ----------
function takeExamRun(){
  const major=myMajor();
  const stat=major?major.stat:"mind";
  const sv=(C.stats&&C.stats[stat])||30;
  const pass=Math.random()*100 < (40+sv*0.5);
  if(pass){
    if(typeof applyStats==="function"){const d={};d[stat]=ri(3,7);d.happy=4;applyStats(d);}
    return {t:`Kau lulus ujian dengan baik! ${statLabel(stat)} & kepercayaan diri naik.`,cls:"e-good"};
  }else{
    if(typeof applyStats==="function")applyStats({happy:-5});
    return {t:`Ujian terasa berat. Kau perlu lebih giat belajar.`,cls:"e-bad"};
  }
}
function takeExam(){
  if(typeof spendAction==="function"&&!spendAction()){toast("Aksi habis tahun ini.");return;}
  const r=takeExamRun();
  if(r&&typeof log==="function")log(C.age,r.t,r.cls);
  if(r&&typeof toast==="function")toast(r.t);
  if(typeof renderHidup==="function")renderHidup();
}

// ---------- LIHAT PROGRAM KARIR ----------
function viewSchoolCareers(){
  const sc=citySchool(); if(!sc)return;
  let lines=[`💼 Prospek karir dari ${sc.name}:`,""];
  sc.majors.forEach(m=>{
    const names=(m.careers||[]).map(cid=>{const cr=(typeof CAREERS!=="undefined")?CAREERS.find(x=>x.id===cid):null;return cr?cr.name:cid;});
    lines.push(`${m.ico} ${m.name} → ${names.join(", ")}`);
  });
  lines.push("","Lulus jurusan memudahkan masuk karir terkait.");
  if(typeof showModal==="function"){
    showModal({ico:"💼",prompt:lines.join("\n"),choices:[{label:"Mengerti",run:()=>null}]});
  }else if(typeof toast==="function")toast("Lihat program karir di sekolah.");
}

// ---------- helper label stat ----------
function statLabel(s){
  return ({mana:"Mana",mind:"Akal",might:"Kekuatan",charm:"Pesona",health:"Nyawa",happy:"Bahagia"})[s]||s;
}

// ---------- LINK lulus jurusan -> bonus syarat karir ----------
// jika pemain punya jurusan yg cocok, anggap "berpendidikan" utk karir terkait
function majorBoostsCareer(careerId){
  const m=myMajor();
  return !!(m&&m.careers&&m.careers.includes(careerId));
}

// ---------- INTEGRASI: klik sub-lokasi sekolah buka panel ----------
(function hookSubloc(){
  if(typeof gotoSubloc!=="function")return;
  const _prevGoto=gotoSubloc;
  gotoSubloc=function(id){
    const city=(typeof currentCity==="function")?currentCity():null;
    const sub=city&&city.sublocs?city.sublocs.find(x=>x.id===id):null;
    const r=_prevGoto.apply(this,arguments);
    if(sub&&sub._school){try{openSchool();}catch(e){}}
    return r;
  };
})();


// ---------- LINK: jurusan cocok -> longgarkan syarat karir terkait ----------
// jika pemain lulusan jurusan yg membuka karir X, beri keringanan req X.
(function linkMajorToCareer(){
  if(typeof applyCareer!=="function")return;
  const _prevApply=applyCareer;
  applyCareer=function(id){
    // jika jurusan membuka karir ini & req normal gagal hanya karena stat, beri kelonggaran
    const car=(typeof CAREERS!=="undefined")?CAREERS.find(x=>x.id===id):null;
    if(car&&majorBoostsCareer(id)&&typeof C!=="undefined"&&C){
      const okNormal=car.req(C);
      if(!okNormal){
        // cek apakah cuma gagal di umur (umur tetap wajib) atau di stat/coin
        const ageOK = C.age>=(typeof MIN_WORK_AGE!=="undefined"?MIN_WORK_AGE:15);
        if(ageOK){
          // lulusan jurusan terkait -> diterima meski stat/coin kurang sedikit
          C.career=id;C.careerLevel=0;C.careerYears=0;
          if(typeof log==="function")log(C.age,`Berkat pendidikan ${myMajor().name}, kau diterima sebagai ${car.ranks?car.ranks[0]:car.name}.`,"e-good");
          if(typeof toast==="function")toast(`Karir: ${car.name} (jalur pendidikan)`);
          if(typeof updateTitle==="function")updateTitle();
          if(typeof renderAktivitas==="function")renderAktivitas();
          if(typeof renderHidup==="function")renderHidup();
          return;
        }
      }
    }
    return _prevApply.apply(this,arguments);
  };
})();
