// ============================================================
//  TAKDIR — PRIORITAS 4: Sekolah Berjenjang + Kuis + Kekayaan Ortu
// ============================================================

// ---------- KEKAYAAN ORTU bervariasi per origin ----------
// rentang [min,max] harta keluarga; di-roll saat lahir
const ORIGIN_WEALTH={
  peasant:[10,40], orphan:[0,15], mageborn:[60,140],
  noble:[400,900], merchant_kid:[200,500],
};

// ---------- JENIS SEKOLAH menurut origin ----------
// tiap origin punya jalur sekolah default; bisa beda nama tiap generate
const SCHOOL_TRACKS={
  mageborn:{type:"sihir",ico:"🔮",statFocus:"mana",
    names:[["Sanggar Tunas Arcane","Padepokan Mantra","Konservatorium Arcanum"],
           ["Surau Rune","Balai Sihir Muda","Kuil Aether"],
           ["Sekolah Aether Dasar","Lyceum Arcane","Akademi Bintang"]]},
  noble:{type:"bangsawan",ico:"👑",statFocus:"charm",
    names:[["Taman Kanak Ningrat","Sekolah Etiket","Pondok Tata Krama"],
           ["Balai Bangsawan","Kolese Istana","Sanggar Diplomasi"],
           ["Akademi Kerajaan","Lyceum Aurelia","Kolese Tinggi Aetheria"]]},
  merchant_kid:{type:"dagang",ico:"⚖️",statFocus:"mind",
    names:[["Sekolah Hitung Dasar","Surau Niaga","Balai Timbang"],
           ["Kolese Dagang","Sekolah Saudagar","Balai Bursa Muda"],
           ["Akademi Niaga Tinggi","Guild Saudagar Agung","Lyceum Perdagangan"]]},
  // peasant & orphan: jalur umum (rakyat) — sekolah desa lalu pilih spesialisasi
  _default:{type:"umum",ico:"📖",statFocus:"mind",
    names:[["Sekolah Desa","Surau Rakyat","Balai Belajar"],
           ["Sekolah Menengah Kota","Kolese Rakyat","Balai Ilmu"],
           ["Akademi Umum","Lyceum Kota","Kolese Tinggi"]]},
};

// jenjang: usia masuk & lulus (ambil tengah dari rentang yg user sebut)
const SCHOOL_LEVELS=[
  {tier:0,name:"Dasar",enterAge:5,gradAge:9},     // 4/5/6 -> 8/9/10
  {tier:1,name:"Menengah",enterAge:9,gradAge:12}, // 8/9/10 -> 11/12/13
  {tier:2,name:"Tinggi",enterAge:12,gradAge:16},  // 11/12/13 -> 15/16/17
];

function trackFor(origin){return SCHOOL_TRACKS[origin]||SCHOOL_TRACKS._default;}

// ---------- inisialisasi data sekolah saat karakter dibuat ----------
function initSchool(){
  const track=trackFor(C.origin);
  // randomize nama tiap jenjang
  C.school={
    track:track.type, ico:track.ico, statFocus:track.statFocus,
    levelNames:SCHOOL_LEVELS.map((lv,i)=>rand(track.names[i])),
    currentTier:-1,     // -1 = belum sekolah
    enrolled:false,
    failsThisYear:0,    // attempt kuis tahun ini (max 2)
    totalFails:0,       // gagal beruntun (3 = dropout)
    graduated:[],       // tier yg sudah lulus
    droppedOut:false,
    yearsInTier:0,
  };
}

// ---------- cek apakah waktunya masuk sekolah (dipanggil tiap tahun) ----------
function checkSchoolEnrollment(){
  if(!C.school||C.school.droppedOut)return;
  const s=C.school;
  // sudah di jenjang? skip
  if(s.enrolled)return;
  // cari jenjang yg cocok umur & belum lulus
  for(const lv of SCHOOL_LEVELS){
    if(s.graduated.includes(lv.tier))continue;
    // v24: jendela dilonggarkan (+5 th) supaya telat setahun tidak mengunci
    // seluruh jalur ijazah -> karir Ksatria/Penyihir selamanya.
    if(C.age>=lv.enterAge && C.age<lv.gradAge+5){
      // tawarkan masuk (otomatis untuk jenjang dasar; pilihan untuk tinggi)
      s.currentTier=lv.tier;s.enrolled=true;s.yearsInTier=0;s.failsThisYear=0;
      log(C.age,`📚 Kau masuk ${s.levelNames[lv.tier]} (Jenjang ${lv.name}).`,"e-good");
      return;
    }
  }
}

// ---------- KUIS KENAIKAN (dipanggil tiap tahun saat bersekolah) ----------
// soal acak sesuai statFocus; jawab benar = lulus tahun; salah = gagal attempt
const QUIZ_BANK={
  mana:[
    {q:"Elemen apa yang melawan Api dalam sihir dasar?",opts:["Air","Tanah","Logam"],a:0},
    {q:"Sumber kekuatan penyihir disebut?",opts:["Stamina","Mana","Iman"],a:1},
    {q:"Mantra perisai termasuk sihir...",opts:["Serangan","Pertahanan","Penyembuhan"],a:1},
    {q:"Kristal apa yang memperkuat mana?",opts:["Batu bara","Kristal Aether","Garam"],a:1},
  ],
  mind:[
    {q:"3 ditambah 4 dikali 2 = ?",opts:["14","11","10"],a:1},
    {q:"Jika beli 5 keping/buah, 6 buah harganya?",opts:["30","25","36"],a:0},
    {q:"Lawan kata 'untung' adalah?",opts:["Laba","Rugi","Modal"],a:1},
    {q:"Pasar paling ramai biasanya pada?",opts:["Tengah malam","Pagi hari","Subuh buta"],a:1},
  ],
  charm:[
    {q:"Saat bertemu Raja, kita harus?",opts:["Menunduk hormat","Menepuk pundak","Berteriak"],a:0},
    {q:"Etika makan bangsawan: sendok dipegang?",opts:["Tangan kiri saja","Sesuai aturan meja","Tidak pakai sendok"],a:1},
    {q:"Cara terbaik memenangkan hati orang?",opts:["Memaksa","Mendengarkan","Mengabaikan"],a:1},
    {q:"Pakaian ke pesta istana sebaiknya?",opts:["Lusuh","Rapi & anggun","Zirah perang"],a:1},
  ],
};

function startQuiz(){
  const s=C.school;
  const bank=QUIZ_BANK[s.statFocus]||QUIZ_BANK.mind;
  const soal=rand(bank);
  // bonus: stat tinggi kadang kasih "petunjuk" (auto-pass chance kecil)
  const lvName=s.levelNames[s.currentTier];
  openChoice({ico:"📝",cancel:false,
    prompt:`<b>Kuis Kenaikan — ${lvName}</b><br><span style="font-size:12px">${soal.q}</span><br><span style="font-size:10.5px;color:var(--ink-soft);filter:brightness(1.6)">Attempt ${s.failsThisYear+1}/2 · ${s.statFocus==="mana"?"Mana":s.statFocus==="charm"?"Pesona":"Akal"}mu bantu sedikit</span>`,
    choices:soal.opts.map((opt,i)=>({label:opt,run:()=>{
      gradeQuiz(i===soal.a);return null;
    }}))});
}
function gradeQuiz(correct){
  const s=C.school;const lv=SCHOOL_LEVELS[s.currentTier];
  // stat tinggi bisa "selamatkan" jawaban salah dgn peluang kecil
  const statVal=C.stats[s.statFocus]||0;
  const saved=!correct && chance(statVal/300); // maks ~33% di stat 100
  if(correct||saved){
    // === v24 FIX: mutasi state SINKRON sebelum closeModal() ===
    // closeModal() yang di-patch memicu startQuiz() berikutnya. Kalau graduated
    // baru di-push di dalam setTimeout(800), beberapa kelulusan untuk tier yang
    // sama bisa resolve duluan -> graduated:[0,0,0] & jenjang 1/2 tak pernah dimasuki.
    s.failsThisYear=0;s.totalFails=0;
    const _gradNow = (C.age>=lv.gradAge) && !s.graduated.includes(s.currentTier);
    const _tier = s.currentTier;
    if(_gradNow){
      s.graduated.push(_tier);       // dedupe dijamin oleh guard includes() di atas
      s.enrolled=false;
      s.yearsInTier=0;
      if(_tier===2){C.flags["diploma_"+s.track]=1;C.reputation+=10;}
    }
    C._quizPending=false;            // cegah closeModal memicu kuis lagi tahun ini
    closeModal();
    playAnim("win",{text:"LULUS!"});
    applyStats({[s.statFocus]:+ri(3,6),happy:+4});
    setTimeout(()=>{
      if(_gradNow){
        log(C.age,`🎓 Kau LULUS ${s.levelNames[_tier]} (Jenjang ${lv.name})! ${saved?'(terselamatkan ilmu)':''}`,"e-epic");
        if(_tier===2)log(C.age,`Ijazah ${s.track} kini menjadi syarat karir tingkat tinggi.`,"e-good");
      }else{
        log(C.age,`Kau naik kelas di ${s.levelNames[_tier]}. ${saved?'(nyaris gagal, tapi ilmumu menyelamatkan)':'Bagus!'}`,"e-good");
      }
      updateTitle();renderAll();
    },800);
  }else{
    closeModal();
    s.failsThisYear++;
    if(s.failsThisYear>=2){
      // gagal tahun ini -> ulang setahun
      s.totalFails++;s.failsThisYear=0;
      playAnim("lose",{text:"TIDAK NAIK"});
      if(s.totalFails>=3){
        s.droppedOut=true;s.enrolled=false;
        log(C.age,`💔 Kau gagal 3 kali & DROPOUT dari ${s.levelNames[s.currentTier]}. Pilih jalan hidup lain.`,"e-bad");
        applyStats({happy:-10});
      }else{
        log(C.age,`Kau gagal kuis tahun ini & harus mengulang. (gagal ${s.totalFails}/3)`,"e-bad");
        applyStats({happy:-5});
      }
      setTimeout(()=>{updateTitle();renderAll();},800);
    }else{
      // masih ada attempt ke-2
      log(C.age,`Jawaban salah! Sisa 1 attempt.`,"e-bad");
      setTimeout(()=>startQuiz(),600);
    }
  }
}

// ---------- proses sekolah tiap tahun ----------
function processSchool(){
  if(!C.school||C.school.droppedOut)return;
  checkSchoolEnrollment();
  const s=C.school;
  if(s.enrolled){
    s.yearsInTier++;
    // picu kuis (ditampilkan setelah event tahunan via antrian)
    C._quizPending=true;
  }
}

// ============================================================
//  PRIORITAS 4 — Patch integrasi (sekolah, kekayaan ortu)
// ============================================================

// ---------- kekayaan ortu bervariasi: roll saat lahir ----------
const _p4CreateFromDraft=createFromDraft;
createFromDraft=function(){
  _p4CreateFromDraft();
  // roll familyWealth dari rentang origin
  const range=ORIGIN_WEALTH[C.origin]||[10,40];
  C.familyWealth=ri(range[0],range[1]);
  // bayi tetap mulai 0, allowance dari familyWealth saat 13 (logika lama)
  initSchool();
};

// ---------- jadwalkan kuis & sekolah dalam advanceYear ----------
// kita bungkus advanceYear: jalankan asli, lalu kalau ada kuis pending -> tampilkan
const _p4AdvanceYear=advanceYear;
advanceYear=function(){
  C._quizPending=false;
  _p4AdvanceYear.call(this);
  // setelah render & rent queue, kalau ada kuis pending dan tak ada modal terbuka
  if(C&&C.alive&&C._quizPending&&!pendingChoice){
    C._quizPending=false;
    setTimeout(()=>{if(C.alive&&C.school&&C.school.enrolled&&!pendingChoice)startQuiz();},250);
  }
};

// ---------- sisipkan processSchool ke processYearly ----------
const _p4ProcessYearly=processYearly;
processYearly=function(){
  _p4ProcessYearly();
  if(typeof processSchool==="function")processSchool();
};

// ---------- jika ada kuis pending tapi event/sewa nutup, pancing setelah modal ditutup ----------
const _p4CloseModal=closeModal;
closeModal=function(){
  _p4CloseModal();
  // v24: hanya pancing kuis kalau memang masih terdaftar & belum lulus tier ini
  if(C&&C.alive&&C._quizPending&&!pendingChoice&&C.school&&C.school.enrolled
     &&!C.school.graduated.includes(C.school.currentTier)){
    C._quizPending=false;
    setTimeout(()=>{if(C.alive&&C.school&&C.school.enrolled&&!pendingChoice)startQuiz();},200);
  }
};

// ---------- render status sekolah di tab Hidup (sisipkan ke log/charcard) ----------
const _p4RenderHidup=renderHidup;
renderHidup=function(){
  _p4RenderHidup();
  if(!C.school)return;
  const s=C.school;
  let status="";
  if(s.droppedOut)status=`🚫 Dropout dari sekolah`;
  else if(s.enrolled){const lv=SCHOOL_LEVELS[s.currentTier];
    status=`📚 ${s.levelNames[s.currentTier]} · Jenjang ${lv.name}${s.totalFails>0?` · gagal ${s.totalFails}/3`:''}`;}
  else if(s.graduated.length===3)status=`🎓 Lulus semua jenjang ${s.track}`;
  else if(s.graduated.length)status=`🎓 Lulus ${s.graduated.length} jenjang`;
  if(status){
    const host=document.getElementById("viewHidup");
    const card=host&&host.querySelector?host.querySelector(".charcard"):null;
    // sisipkan baris kecil di networth strip
    if(host){host.innerHTML=host.innerHTML.replace('<div class="logbox">',
      `<div class="school-strip">${status}</div><div class="logbox">`);}
  }
};

// ---------- syarat karir tinggi butuh ijazah (knight, mage) ----------
(function(){
  const knight=CAREERS.find(c=>c.id==="knight");
  if(knight){const orig=knight.req;knight.req=c=>orig(c)&&(c.flags["diploma_bangsawan"]||c.flags["diploma_umum"]||c.reputation>=25);}
  const mage=CAREERS.find(c=>c.id==="mage");
  if(mage){const orig=mage.req;mage.req=c=>orig(c)&&(c.flags["diploma_sihir"]||c.stats.mana>=70);}
})();

// ---------- LISENSI DAGANG (bonus prio4): butuh ijazah dagang/umum ----------
// sederhana: tambah misi & cek; lisensi buka bonus income bisnis
const TRADE_LICENSES=[
  {id:"hide",ico:"🦫",name:"Lisensi Kulit Buruan",cost:80},
  {id:"fruit",ico:"🍎",name:"Lisensi Buah",cost:60},
  {id:"antique",ico:"🏺",name:"Lisensi Barang Antik",cost:200},
  {id:"gold",ico:"🥇",name:"Lisensi Emas",cost:350},
  {id:"veg",ico:"🥬",name:"Lisensi Sayur",cost:50},
];
function licenseAvailable(){return C.flags["diploma_dagang"]||C.flags["diploma_umum"]||C.career==="merchant";}
function openLicensePopup(){
  if(!licenseAvailable()){toast("Butuh ijazah dagang/umum atau karir Saudagar dulu.");return;}
  if(!C.licenses)C.licenses=[];
  openChoice({ico:"📜",prompt:"Lisensi Dagang — izin jual produk khusus (bonus income):",
    choices:TRADE_LICENSES.map(l=>{
      const owned=C.licenses.includes(l.id);const afford=C.coin>=l.cost;
      return {label:`${l.ico} ${l.name}${owned?' ✓':''}`,sub:owned?'dimiliki':`💰${l.cost}`,disabled:owned||!afford,
        run:()=>{C.coin-=l.cost;C.licenses.push(l.id);C.reputation+=3;
          return{t:`Kau memperoleh ${l.name}! Bisnis terkait kini lebih untung.`,cls:"e-epic"};}};
    })});
}


// ---------- tombol Lisensi Dagang di tab Aset ----------
const _p4RenderAset=renderAset;
renderAset=function(){
  _p4RenderAset();
  const host=document.getElementById("viewAset");
  if(!host)return;
  if(!C.licenses)C.licenses=[];
  const owned=C.licenses.length;
  host.innerHTML+=`<div class="sechead">📜 Lisensi Dagang</div>
    <div class="tiles"><div class="tile fullrow" onclick="openLicensePopup()">
      <span class="ti">📜</span><span class="tn">Kelola Lisensi (${owned}/${TRADE_LICENSES.length})</span>
      <span class="td">${licenseAvailable()?'Beli izin jual produk khusus untuk bonus income.':'🔒 Butuh ijazah dagang/umum atau karir Saudagar.'}</span></div></div>`;
};