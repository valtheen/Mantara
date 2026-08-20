/* ==================================================================
   MANTARA — PERHIASAN & LAMARAN
   Cincin lamaran dibeli di 💍 Ahli Permata (Aetheria & Saltmoor).
   Cincin lebih mewah = peluang lamaran lebih besar.
   ================================================================== */
(function jewelrySystem(){
  const RINGS=[
    {key:"ring_silver",ico:"💍",name:"Cincin Perak",price:120,desc:"Sederhana namun tulus — untuk melamar (+5 peluang)."},
    {key:"ring_gold",ico:"💛",name:"Cincin Emas",price:300,desc:"Berkilau anggun — lamaran makin meyakinkan (+12)."},
    {key:"ring_dragon",ico:"💎",name:"Cincin Berlian Naga",price:800,desc:"Legendaris — hampir mustahil ditolak (+25)."},
    {key:"necklace",ico:"📿",name:"Kalung Permata",price:250,desc:"Hadiah mewah untuk siapa pun — ikatan melonjak."},
  ];
  RINGS.forEach(rg=>{
    if(ITEM_CATALOG.find(i=>i.key===rg.key))return;
    ITEM_CATALOG.push({key:rg.key,ico:rg.ico,name:rg.name,price:rg.price,reusable:true,noBuy:true,
      desc:rg.desc,use:()=>rg.key==="necklace"
        ?"Hadiahkan lewat tombol Kelola → Hadiah, atau aksi relasi."
        :"Simpan baik-baik — gunakan lewat aksi 💍 Lamar pada pasanganmu (Diri → Relasi)."});
  });
  // gabungkan koleksi CINCIN LAMARAN ke toko Tukang Permata yang sudah ada
  const jw=STORES.find(s=>s.id==="jeweler");
  if(jw){
    const _jb=jw.build;
    jw.desc="Perhiasan penanda status & cincin lamaran 💍.";
    jw.build=()=>_jb().concat(RINGS.map(rg=>{
      const ownedN=(C.inventory&&C.inventory[rg.key])||0;
      return {label:`${rg.ico} ${rg.name} [lamaran]${ownedN?" ×"+ownedN:""}`,sub:`${rg.desc} · 💰${rg.price}`,price:rg.price,minAge:15,
        run:()=>{
          if(C.coin<rg.price){toast("Koin kurang.");return;}
          if(!spendAction())return;
          C.coin-=rg.price;addItem(rg.key);
          finishAct(`${rg.ico} Kau membeli ${rg.name}. Tersimpan di Tas 🎒 — siap untuk momen besar.`,"e-good");
        }};
    }));
  }
})();

/* ==================================================================
   MANTARA — ORDO BERJENJANG + PROFESI BARU + MINIGAME SKILL
   Lingkaran Arcane (5 tingkat penyihir) & Ordo Kesatria (5 tingkat)
   dengan UJIAN KENAIKAN berbasis skill: Hafalan Rune (memori) dan
   Refleks Tangkis (reaksi) — bukan sekadar klik & untung-untungan.
   + 9 profesi fantasi abad pertengahan baru.
   ================================================================== */
(function ordoStyle(){
  const css=document.createElement("style");
  css.textContent=`
  .rn-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:12px 0;}
  .rn-btn{padding:16px;font-size:30px;border-radius:14px;background:rgba(255,255,255,.05);
    border:1px solid var(--line2);cursor:pointer;transition:transform .08s,box-shadow .15s,background .15s;}
  .rn-btn.lit{background:rgba(139,156,255,.4);box-shadow:0 0 20px rgba(139,156,255,.8);transform:scale(1.07);}
  .rn-btn.good{background:rgba(106,138,58,.4);}
  .rn-btn.bad{background:rgba(139,38,53,.5);}
  .rn-status{font-size:12px;color:var(--arcane-glow);min-height:18px;margin-top:2px;}
  .parry-zone{height:170px;border-radius:14px;display:flex;flex-direction:column;gap:6px;align-items:center;justify-content:center;
    font-size:24px;font-weight:700;cursor:pointer;border:1px solid var(--line);background:rgba(0,0,0,.35);
    user-select:none;-webkit-user-select:none;margin:12px 0;transition:background .1s;}
  .parry-zone.go{background:rgba(184,134,11,.4);border-color:var(--gold);box-shadow:0 0 24px rgba(240,192,64,.4);}
  .parry-zone .pz-sub{font-size:11px;font-weight:400;color:var(--ink-soft);filter:brightness(1.7);}`;
  document.head.appendChild(css);
})();
/* ---------- MINIGAME: HAFALAN RUNE (memori ala Simon) ---------- */
window.runeMemoryGame=function(opts,cb){
  opts=opts||{};
  const RUNES=["🔥","💧","🌪️","🌑"];
  const len=Math.max(3,Math.min(9,opts.length||4));
  const seq=Array.from({length:len},()=>ri(0,3));
  let ov=document.getElementById("rnOv");
  if(!ov){ov=document.createElement("div");ov.id="rnOv";ov.className="ss-ov";document.body.appendChild(ov);}
  let idx=0,phase="show",done=false;
  ov.innerHTML=`<div class="ss-panel">
    <div style="font-size:30px;margin-bottom:4px">📿</div>
    <div class="ss-title">${opts.title||"Hafalan Rune"}</div>
    <div class="ss-desc">${opts.desc||`Hafalkan urutan <b>${len} rune</b> yang menyala, lalu ulangi!`}</div>
    <div class="rn-grid">${RUNES.map((r,i)=>`<button class="rn-btn" id="rnB${i}">${r}</button>`).join("")}</div>
    <div class="rn-status" id="rnStatus">Perhatikan baik-baik...</div>
  </div>`;
  ov.classList.add("show");
  const btn=i=>document.getElementById("rnB"+i);
  const status=t=>{const s=document.getElementById("rnStatus");if(s)s.textContent=t;};
  function finish(ok){
    if(done)return;done=true;
    status(ok?"✨ SEMPURNA — rune tunduk padamu!":"💨 Urutan buyar dari ingatanmu...");
    setTimeout(()=>{ov.classList.remove("show");try{cb&&cb(ok);}catch(e){}},900);
  }
  seq.forEach((r,i)=>{
    setTimeout(()=>{const b=btn(r);if(b){b.classList.add("lit");setTimeout(()=>b.classList.remove("lit"),420);}},700+i*640);
  });
  setTimeout(()=>{
    phase="input";status(`Giliranmu — ulangi ${len} rune!`);
    RUNES.forEach((r,i)=>{
      btn(i).onclick=()=>{
        if(phase!=="input"||done)return;
        if(i===seq[idx]){
          btn(i).classList.add("good");setTimeout(()=>btn(i).classList.remove("good"),260);
          idx++;status(`${idx}/${len} benar...`);
          if(idx>=len)finish(true);
        }else{
          btn(i).classList.add("bad");
          finish(false);
        }
      };
    });
  },700+len*640+250);
};
/* ---------- MINIGAME: REFLEKS TANGKIS (reaction) ---------- */
window.parryGame=function(opts,cb){
  opts=opts||{};
  const rounds=opts.rounds||3;
  let ov=document.getElementById("pyOv");
  if(!ov){ov=document.createElement("div");ov.id="pyOv";ov.className="ss-ov";document.body.appendChild(ov);}
  let round=0,score=0,goAt=0,state="idle",timer=null,done=false;
  ov.innerHTML=`<div class="ss-panel">
    <div style="font-size:30px;margin-bottom:4px">🛡️</div>
    <div class="ss-title">${opts.title||"Refleks Tangkis"}</div>
    <div class="ss-desc">Tunggu aba-aba <b>TANGKIS!</b> lalu ketuk secepat kilat. Ketuk terlalu dini = kena tebas. ${rounds} serangan!</div>
    <div class="parry-zone" id="pyZone"><span id="pyMain">Bersiap...</span><span class="pz-sub" id="pySub">jangan ketuk dulu</span></div>
    <div class="rn-status" id="pyStatus"></div>
  </div>`;
  ov.classList.add("show");
  const zone=document.getElementById("pyZone");
  const main=t=>{const e=document.getElementById("pyMain");if(e)e.textContent=t;};
  const sub=t=>{const e=document.getElementById("pySub");if(e)e.textContent=t;};
  const stat=t=>{const e=document.getElementById("pyStatus");if(e)e.textContent=t;};
  function nextRound(){
    if(done)return;
    round++;state="wait";zone.classList.remove("go");
    main("Bersiap...");sub(`serangan ${round}/${rounds} — jangan ketuk dulu`);
    timer=setTimeout(()=>{
      if(done)return;
      state="go";goAt=performance.now();
      zone.classList.add("go");main("⚔️ TANGKIS!");sub("KETUK SEKARANG!");
      timer=setTimeout(()=>{if(state==="go"&&!done){state="idle";stat("💥 Terlambat! Seranganmu lolos.");after();}},900);
    },800+Math.random()*1900);
  }
  function after(){
    zone.classList.remove("go");
    if(round>=rounds){
      done=true;
      const ok=score>=Math.ceil(rounds*0.66);
      main(ok?"🛡️ LULUS!":"💀 Gagal...");sub(`${score}/${rounds} tangkisan berhasil`);
      setTimeout(()=>{ov.classList.remove("show");try{cb&&cb(ok,score);}catch(e){}},1000);
    }else setTimeout(nextRound,700);
  }
  zone.onclick=()=>{
    if(done)return;
    if(state==="wait"){clearTimeout(timer);state="idle";stat("😖 Terlalu dini — pedang lawan menyambar!");after();}
    else if(state==="go"){
      clearTimeout(timer);state="idle";
      const dt=performance.now()-goAt;
      if(dt<=380){score++;stat(`⚡ SEMPURNA! (${Math.round(dt)}ms)`);}
      else if(dt<=680){score++;stat(`👍 Tangkisan bagus (${Math.round(dt)}ms)`);}
      else stat(`💥 Terlalu lambat (${Math.round(dt)}ms)`);
      after();
    }
  };
  nextRound();
};
/* ---------- ORDO BERJENJANG ---------- */
const ORDOS={
  mage:{ico:"🔮",name:"Lingkaran Arcane",place:"Menara Frostspire",
    ranks:["Inisiat","Adeptus","Magus","Magus Agung","Penyihir Bintang"],
    join:c=>c.isMage&&c.age>=16,joinHint:"khusus penyihir · usia 16+",
    perkDesc:"Mana & honorarium tiap tahun — makin tinggi tingkat, makin besar."},
  knight:{ico:"🛡️",name:"Ordo Kesatria Aurelia",place:"Colosseum Aurelia",
    ranks:["Squire","Kesatria","Kapten Kesatria","Paladin","Mahapatih Pedang"],
    join:c=>c.age>=16&&c.stats.might>=50,joinHint:"Kekuatan 50+ · usia 16+",
    perkDesc:"Kekuatan, Nyawa & upah patroli tiap tahun."},
};
function ensureOrdo(){if(!C.ordo)C.ordo={mage:-1,knight:-1};return C.ordo;}
window.openOrdoPage=function(type){
  const O=ORDOS[type];if(!O)return;
  ensureOrdo();
  pushPage({title:O.name,render:function(){
    const r=C.ordo[type];
    let h=pgNote(`${O.ico} ${O.name} — ${O.place}. ${O.perkDesc} Kenaikan tingkat lewat <b>ujian keterampilan</b>, bukan keberuntungan!`);
    h+=pgSec("Jenjang Tingkatan");
    O.ranks.forEach((nm,i)=>{
      h+=pgRow({ico:i<=r?"⭐":"☆",title:nm,sub:i<=r?(i===r?"tingkatmu saat ini":"telah dilalui"):`tingkat ${i+1}`,
        bar:i<=r?100:0,barCls:"f-happy",dim:i>r});
    });
    h+=pgSec("Aksi");
    if(r<0){
      const ok=O.join(C)&&C.coin>=80;
      h+=pgRow({ico:O.ico,title:"Bergabung dengan Ordo",sub:O.join(C)?`iuran perdana 💰80 · ${O.joinHint}`:"🔒 "+O.joinHint,right:"💰80",dim:!ok,
        on:pgDo(()=>{
          if(!O.join(C)||C.coin<80)return{t:"Syarat belum terpenuhi.",cls:"e-bad"};
          C.coin-=80;C.ordo[type]=0;
          if(typeof kAddNews==="function")kAddNews(`${O.ico} ${C.name} diterima sebagai ${O.ranks[0]} ${O.name}.`);
          return{t:`${O.ico} Selamat datang, ${O.ranks[0]}! Ujilah dirimu untuk naik tingkat.`,cls:"e-epic"};})});
    }else if(r<O.ranks.length-1){
      const fee=100*(r+1);
      h+=pgRow({ico:"⚡",title:`UJIAN KENAIKAN → ${O.ranks[r+1]}`,
        sub:`${type==="mage"?`hafalan ${3+r+1} rune`:"refleks tangkis"}${r+1>=3?" + duel penguji ⚔️":""} · 💰${fee}`,
        right:`💰${fee}`,dim:C.coin<fee,
        on:()=>startOrdoTrial(type)});
    }else{
      h+=pgRow({ico:"👑",title:"Puncak Ordo tercapai!",sub:`Kau adalah ${O.ranks[r]} — namamu dikenang sejarah.`});
    }
    return h;
  }});
};
window.startOrdoTrial=function(type){
  const O=ORDOS[type];ensureOrdo();
  const r=C.ordo[type];const next=r+1;
  const fee=100*next;
  if(C.coin<fee){toast(`Butuh ${fee} keping untuk ujian.`);return;}
  if(!spendAction())return;
  C.coin-=fee;
  mpCloseAll();
  function promote(){
    C.ordo[type]=next;C.reputation+=6+next*3;
    if(typeof kAddNews==="function")kAddNews(`${O.ico} ${C.name} naik tingkat menjadi ${O.ranks[next]} ${O.name}!`);
    finishAct(`${O.ico} LULUS UJIAN! Kau kini ${O.ranks[next]} — seluruh ordo memberi hormat.`,"e-epic","win");
  }
  function failed(msg){finishAct(msg||"Ujian gagal — berlatihlah & coba lagi.","e-bad");}
  function maybeDuel(){
    if(next<3)return promote();
    const foe=type==="mage"
      ?{name:"Magus Penguji",ico:"🧙‍♂️",hp:80+next*25,atk:12,mag:20+next*6,special:"Ledakan Arkana"}
      :{name:"Paladin Penguji",ico:"💂",hp:90+next*25,atk:18+next*4,mag:0,special:"Tebasan Sumpah"};
    (window.MantaraArena&&MantaraArena.startTacticalDuel)?MantaraArena.startTacticalDuel(foe,{
      title:`Ujian ${O.ranks[next]}`,allowFlee:false,
      intro:`${O.ico} Tahap akhir: kalahkan sang penguji di hadapan seluruh ordo!`,
      onEnd:function(res){
        if(res&&res.win)promote();
        else if(res&&!res.quit){applyStats({health:-ri(5,12)});failed("Sang penguji mengungguli. Buktikan lagi lain kali.");}
      }}):promote();
  }
  if(type==="mage"){
    runeMemoryGame({length:3+next,title:`Ujian ${O.ranks[next]}`,desc:`Ulangi urutan <b>${3+next} rune</b> tanpa cela — para Magus mengawasi.`},
      ok=>{ if(ok){applyStats({mana:+4,mind:+2});maybeDuel(); } else {applyStats({mana:-2});failed("Rune buyar dari ingatanmu di hadapan dewan...");} });
  }else{
    parryGame({rounds:3+Math.floor(next/2),title:`Ujian ${O.ranks[next]}`},
      (ok,score)=>{ if(ok){applyStats({might:+3,health:+2});maybeDuel(); } else failed(`Hanya ${score} tangkisan — pelatih menggeleng.`); });
  }
};
// perks ordo tiap tahun + badge di kartu karakter
(function ordoYearly(){
  const _oAY=advanceYear;
  advanceYear=function(){
    const r=_oAY.apply(this,arguments);
    try{
      if(!C||!C.alive)return r;
      ensureOrdo();
      if(C.ordo.mage>=0){const g=(C.ordo.mage+1)*8;C.coin+=g;applyStats({mana:+Math.ceil((C.ordo.mage+1)/2)});
        if(chance(0.25))log(C.age,`🔮 Honorarium ${ORDOS.mage.ranks[C.ordo.mage]} +${g} keping.`,"e-arcane");}
      if(C.ordo.knight>=0){const g=(C.ordo.knight+1)*8;C.coin+=g;applyStats({might:+1,health:+Math.ceil((C.ordo.knight+1)/3)});
        if(chance(0.25))log(C.age,`🛡️ Upah patroli ${ORDOS.knight.ranks[C.ordo.knight]} +${g} keping.`,"e-good");}
    }catch(e){}
    return r;
  };
  const _rhO=renderHidup;
  renderHidup=function(){
    _rhO.apply(this,arguments);
    try{
      ensureOrdo();
      const parts=[];
      if(C.ordo.mage>=0)parts.push(`🔮 ${ORDOS.mage.ranks[C.ordo.mage]}`);
      if(C.ordo.knight>=0)parts.push(`🛡️ ${ORDOS.knight.ranks[C.ordo.knight]}`);
      if(parts.length){
        const el=document.querySelector("#viewHidup .charcard .cinfo");
        if(el&&!el.querySelector(".ordo-chips"))
          el.insertAdjacentHTML("beforeend",`<div class="cage ordo-chips" style="color:var(--arcane-glow)">${parts.join(" · ")}</div>`);
      }
    }catch(e){}
  };
})();
// pintu ordo di dunia: Colosseum (kesatria) & Menara Frostspire (penyihir)
(function ordoDoors(){
  if(SUBLOC_ACTS.ae_colosseum&&!SUBLOC_ACTS.ae_colosseum.some(a=>a._ordo)){
    SUBLOC_ACTS.ae_colosseum.push({_ordo:true,ico:"🛡️",label:"Balai Ordo Kesatria",hint:"5 tingkatan — ujian refleks & duel",run:()=>openOrdoPage("knight")});
    (SUBLOC_ACT_MIN_AGE.ae_colosseum||(SUBLOC_ACT_MIN_AGE.ae_colosseum=[])).push(16);
  }
  if(SUBLOC_ACTS.fr_tower&&!SUBLOC_ACTS.fr_tower.some(a=>a._ordo)){
    SUBLOC_ACTS.fr_tower.push({_ordo:true,ico:"🔮",label:"Lingkaran Arcane",hint:"5 tingkatan penyihir — ujian hafalan rune",run:()=>openOrdoPage("mage")});
    if(!SUBLOC_ACT_MIN_AGE.fr_tower)SUBLOC_ACT_MIN_AGE.fr_tower=[];
    while(SUBLOC_ACT_MIN_AGE.fr_tower.length<SUBLOC_ACTS.fr_tower.length-1)SUBLOC_ACT_MIN_AGE.fr_tower.push(0);
    SUBLOC_ACT_MIN_AGE.fr_tower.push(16);
  }
  // latihan sihir tinggi di menara -> minigame rune (bukan klik saja)
  if(SUBLOC_ACTS.fr_tower&&SUBLOC_ACTS.fr_tower[0]){
    SUBLOC_ACTS.fr_tower[0].hint="📿 minigame hafalan rune!";
    SUBLOC_ACTS.fr_tower[0].run=()=>{
      if(!C.isMage){toast("Hanya untuk penyihir.");return;}
      if(!spendAction())return;
      runeMemoryGame({length:4,title:"Latihan Sihir Tinggi",desc:"Rangkai mantra: ulangi 4 rune tanpa cela!"},ok=>{
        if(ok){applyStats({mana:+ri(7,12),mind:+3});finishAct("🔮 Mantramu mengalir sempurna — mana melonjak!","e-arcane","win");}
        else{applyStats({mana:+2});finishAct("🔮 Mantra buyar di tengah jalan. Sedikit kemajuan.","e-bad");}
      });
    };
  }
})();
/* ---------- 9 PROFESI FANTASI BARU ---------- */
(function extraCareers(){
  const EXTRA=[
    {id:"monsterhunter",ico:"🐺",name:"Pemburu Monster",req:c=>c.age>=17&&c.stats.might>=55,basepay:55,
      ranks:["Pelacak","Pemburu","Pemburu Ulung","Legenda Rimba"],statGain:{might:+3,health:+1}},
    {id:"cartographer",ico:"🗺️",name:"Kartografer",req:c=>c.age>=16&&c.stats.mind>=50,basepay:38,
      ranks:["Juru Sketsa","Kartografer","Penjelajah","Master Atlas"],statGain:{mind:+3}},
    {id:"executioner",ico:"🪓",name:"Algojo Kota",shady:true,req:c=>c.age>=18&&c.stats.might>=50,basepay:48,
      ranks:["Asisten Algojo","Algojo","Algojo Agung"],statGain:{might:+2,happy:-1}},
    {id:"fisher",ico:"🎣",name:"Nelayan",req:c=>c.age>=15,basepay:26,
      ranks:["Nelayan Pantai","Nelayan Laut","Nakhoda Kecil","Raja Ikan"],statGain:{health:+2}},
    {id:"miner",ico:"⛏️",name:"Penambang",req:c=>c.age>=16&&c.stats.might>=40,basepay:35,
      ranks:["Kuli Tambang","Penambang","Mandor","Baron Tambang"],statGain:{might:+2,health:-1}},
    {id:"beastmaster",ico:"🐎",name:"Penjinak Hewan",req:c=>c.age>=16&&c.stats.charm>=45,basepay:40,
      ranks:["Perawat Kandang","Penjinak","Penunggang Ulung","Beastmaster"],statGain:{charm:+2,health:+1}},
    {id:"cook",ico:"🍲",name:"Juru Masak Istana",req:c=>c.age>=16&&c.stats.mind>=40,basepay:42,
      ranks:["Pencuci Panci","Koki","Koki Kepala","Koki Kerajaan"],statGain:{happy:+2,charm:+1}},
    {id:"gravekeeper",ico:"🪦",name:"Penjaga Makam",req:c=>c.age>=16,basepay:28,
      ranks:["Penggali","Penjaga Makam","Kustos Krip"],statGain:{mind:+1,happy:-1}},
    {id:"herald",ico:"📯",name:"Juru Warta Kerajaan",req:c=>c.age>=16&&c.stats.charm>=50,basepay:36,
      ranks:["Kurir","Juru Warta","Suara Raja"],statGain:{charm:+2,mind:+1}},
  ];
  EXTRA.forEach(c=>{if(!CAREERS.find(x=>x.id===c.id))CAREERS.push(c);});
  Object.assign(JOB_DEV,{
    monsterhunter:{name:"Ilmu Jejak Buas",ico:"🐾",stat:"might"},
    cartographer:{name:"Proyeksi Peta",ico:"📐",stat:"mind"},
    executioner:{name:"Ayunan Tepat",ico:"🪓",stat:"might"},
    fisher:{name:"Baca Arus",ico:"🌊",stat:"health"},
    miner:{name:"Baca Urat Batu",ico:"⛏️",stat:"might"},
    beastmaster:{name:"Bahasa Hewan",ico:"🐴",stat:"charm"},
    cook:{name:"Resep Rahasia",ico:"🍲",stat:"mind"},
    gravekeeper:{name:"Ketenangan Krip",ico:"🕯️",stat:"mind"},
    herald:{name:"Suara Lantang",ico:"📯",stat:"charm"},
  });
  JOB_CLASS.combat.push("monsterhunter","executioner");
  JOB_CLASS.arcane.push("cartographer","gravekeeper");
  JOB_CLASS.social.push("beastmaster","cook","herald");
  JOB_CLASS.labor.push("fisher","miner");
})();
