/* ==================================================================
   MANTARA — SPLASH SCREEN + MINIGAME BIDIKAN + DUEL DUNIA
   Pembuka animasi khas Mantara, minigame timing "Bidikan Takdir",
   dan aktivitas bertarung dunia memakai duel taktis interaktif.
   ================================================================== */
// ---------- BRAND SPLASH (native launch → sigil animasi → permainan) ----------
(function mantaraSplash(){
  let reduce=false;
  try{reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){}
  const sp=document.createElement("div");
  sp.className="splash";sp.id="mantaraSplash";
  sp.innerHTML=`<div class="sp-stars" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <div class="sp-aura" aria-hidden="true"></div>
    <div class="sp-logo" aria-hidden="true">
      <svg class="sp-sigil" viewBox="0 0 96 112" fill="none">
        <path class="sp-shield" d="M48 4 84 18v33c0 27-15 45-36 57C27 96 12 78 12 51V18L48 4Z"/>
        <path class="sp-monogram" d="M25 76V34l23 25 23-25v42"/>
        <path class="sp-arc" d="M28 87c12 7 28 7 40 0"/>
        <g class="sp-cities">
          <circle cx="22" cy="21" r="3"/><circle cx="74" cy="21" r="3"/>
          <circle cx="22" cy="88" r="3"/><circle cx="74" cy="88" r="3"/>
        </g>
      </svg>
    </div>
    <div class="sp-title">MANTARA</div>
    <div class="sp-sub">Hikayat Dunia Sihir</div>`;
  document.body.appendChild(sp);
  requestAnimationFrame(()=>requestAnimationFrame(()=>sp.classList.add("play")));
  let gone=false;
  function dismiss(){
    if(gone)return;gone=true;
    sp.classList.add("out");
    setTimeout(()=>{try{sp.remove();}catch(e){}},550);
  }
  let canSkip=reduce;
  setTimeout(()=>{canSkip=true;},2100);
  sp.addEventListener("click",()=>{if(canSkip)dismiss();});
  setTimeout(dismiss,reduce?950:3200);
})();

// ---------- BIDIKAN TAKDIR: minigame timing universal ----------
// skillShotGame({title,ico,desc,gold:%lebarZonaEmas,speed}, cb("perfect"|"good"|"miss"))
window.skillShotGame=function(opts,cb){
  opts=opts||{};
  let ov=document.getElementById("ssOv");
  if(!ov){
    ov=document.createElement("div");ov.id="ssOv";ov.className="ss-ov";
    document.body.appendChild(ov);
  }
  const gold=Math.max(8,Math.min(26,opts.gold||14));   // % lebar zona emas
  const silver=Math.min(60,gold*2.4);                  // % lebar zona perak
  const speed=opts.speed||1.5;                         // ayunan per detik
  ov.innerHTML=`<div class="ss-panel">
    <div style="font-size:30px;margin-bottom:4px">${opts.ico||"🎯"}</div>
    <div class="ss-title">${opts.title||"Bidikan Takdir"}</div>
    <div class="ss-desc">${opts.desc||"Ketuk saat penanda berada di <b>zona emas</b>!"}</div>
    <div class="ss-track" id="ssTrack">
      <div class="ss-zone silver" style="left:${50-silver/2}%;width:${silver}%"></div>
      <div class="ss-zone gold" style="left:${50-gold/2}%;width:${gold}%"></div>
      <div class="ss-marker" id="ssMarker" style="left:0%"></div>
    </div>
    <div id="ssResult"></div>
    <button class="ss-btn" id="ssBtn">🎯 LEPASKAN!</button>
  </div>`;
  ov.classList.add("show");
  const marker=document.getElementById("ssMarker");
  let pos=0,dir=1,last=performance.now(),raf=null,done=false;
  let reduce=false;
  try{reduce=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;}catch(e){}
  const spd=reduce?speed*0.6:speed;
  function tick(now){
    if(done)return;
    const dt=(now-last)/1000;last=now;
    pos+=dir*spd*200*dt;                 // 200% per detik pada speed 1
    if(pos>=100){pos=100;dir=-1;}
    if(pos<=0){pos=0;dir=1;}
    marker.style.left=pos+"%";
    raf=requestAnimationFrame(tick);
  }
  raf=requestAnimationFrame(tick);
  function release(){
    if(done)return;done=true;
    if(raf)cancelAnimationFrame(raf);
    const d=Math.abs(pos-50);
    const res=d<=gold/2?"perfect":(d<=silver/2?"good":"miss");
    const lbl={perfect:"✨ SEMPURNA!",good:"👍 BAGUS",miss:"💨 MELESET"}[res];
    document.getElementById("ssResult").innerHTML=`<div class="ss-res ${res}">${lbl}</div>`;
    document.getElementById("ssBtn").disabled=true;
    setTimeout(()=>{ov.classList.remove("show");try{cb&&cb(res);}catch(e){}},700);
  }
  document.getElementById("ssBtn").onclick=release;
  document.getElementById("ssTrack").onclick=release;
};

// ---------- AKTIVITAS DUNIA LEBIH INTERAKTIF ----------
(function interactiveActs(){
  // 1) BERBURU (Whisperwood) -> minigame bidikan; Kekuatan melebarkan zona emas
  const woods=SUBLOC_ACTS.th_woods;
  if(woods&&woods[0]){
    woods[0].hint="🎯 minigame bidikan!";
    woods[0].run=function(){
      if(!spendAction())return;
      skillShotGame({
        title:"Berburu di Whisperwood",ico:"🏹",
        desc:"Bidik buruan — ketuk saat penanda di <b>zona emas</b>! (Kekuatan tinggi = zona lebih lebar)",
        gold:11+C.stats.might*0.12,speed:1.5,
      },function(res){
        if(res==="perfect"){
          const g=ri(35,75);C.coin+=g;applyStats({might:+3});addItem("hide");addItem("hide");
          finishAct(`Bidikan sempurna! Buruan besar tumbang — +${g} keping & 2 kulit buruan.`,"e-epic","win",`+${g}💰`);
        }else if(res==="good"){
          const g=ri(15,45);C.coin+=g;applyStats({might:+2});addItem("hide");
          finishAct(`Buruan sukses! +${g} keping & kulit buruan.`,"e-good","win",`+${g}💰`);
        }else{
          applyStats({health:-ri(5,15)});
          finishAct("Bidikan meleset — buruan kabur & kau tergores semak.","e-bad","lose");
        }
      });
    };
  }
  // 2) JINAKKAN MAKHLUK BUAS -> duel taktis interaktif (kalahkan = companion)
  if(woods&&woods[1]){
    woods[1].hint="⚔️ duel taktis vs makhluk buas";
    woods[1].run=function(){
      if(!(window.MantaraArena&&MantaraArena.startTacticalDuel)){ // fallback lama
        if(!spendAction())return;
        if(C.stats.might>55&&chance(0.5)){const r=addRel("pengikut",{loyalty:ri(60,80),name:"Serigala Bayangan",ico:"🐾"});finishAct(`Kau menjinakkan ${r.name}!`,"e-good","win");}
        else{applyStats({health:-ri(15,30)});finishAct("Makhluk itu melukaimu & kabur.","e-bad","lose");}
        return;
      }
      if(!spendAction())return;
      const beast=rand([{name:"Serigala Bayangan",ico:"🐺"},{name:"Griffon Muda",ico:"🦅"},{name:"Beruang Whisperwood",ico:"🐻"},{name:"Rubah Arcane",ico:"🦊"}]);
      MantaraArena.startTacticalDuel(
        {name:beast.name,ico:beast.ico,hp:55+ri(0,25)+Math.round(C.stats.might*0.3),
         atk:15+ri(0,8),mag:beast.name==="Rubah Arcane"?12:0,special:"Cakaran Liar"},
        {title:"Menjinakkan "+beast.name,
         intro:"🐾 "+beast.name+" menggeram dari balik semak... Taklukkan tanpa membunuhnya, dan ia akan mengikutimu!",
         onEnd:function(res){
           if(res&&res.win){
             const r=addRel("pengikut",{loyalty:ri(60,85),name:beast.name,ico:"🐾"});
             finishAct(`Kau menaklukkan & menjinakkan ${r.name}! Ia kini pengikut setiamu.`,"e-epic","win");
           }else if(res&&!res.quit){
             applyStats({health:-ri(10,22)});
             finishAct(beast.name+" melukaimu lalu menghilang ke dalam hutan.","e-bad","lose");
           }
         }});
    };
  }
  // 3) link belanja lama -> arahkan ke tab Toko (etalase sudah pindah)
  const A2=SUBLOC_ACTS;
  if(A2.ae_market&&A2.ae_market[1]){A2.ae_market[1].hint="buka distrik toko";A2.ae_market[1].run=()=>switchTab("Toko");}
  if(A2.th_herbalist&&A2.th_herbalist[0]){A2.th_herbalist[0].hint="buka distrik toko";A2.th_herbalist[0].run=()=>switchTab("Toko");}
  if(A2.fr_apoth&&A2.fr_apoth[0]){A2.fr_apoth[0].hint="buka distrik toko";A2.fr_apoth[0].run=()=>switchTab("Toko");}
  if(A2.fr_forge&&A2.fr_forge[0]){A2.fr_forge[0].hint="buka distrik toko (pandai besi)";A2.fr_forge[0].run=()=>switchTab("Toko");}
  // 4) SATU pintu judi: Sarang Judi Saltmoor -> menu judi arena (sistem yang sama)
  if(A2.sa_den&&A2.sa_den[0]){
    A2.sa_den[0].hint="meja judi Saltmoor (18+)";
    A2.sa_den[0].run=()=>{
      if(C.age<18){toast("Penjaga pintu menghadangmu — khusus 18 tahun ke atas.");return;}
      if(typeof openArena==="function"&&typeof arenaGo==="function"){openArena();arenaGo("Judi");}
      else if(typeof openGambling==="function")openGambling();
    };
  }
})();

/* ==================================================================
   MANTARA — PENUNJUK TAKDIR
   Tutorial navigasi interaktif (spotlight) untuk pemain baru
   + panduan tahap hidup (bayi → dewasa), semuanya bisa di-skip.
   Modul mandiri; di-append paling akhir; memonkeypatch fungsi global.
   ================================================================== */
(function mantaraTutorial(){
"use strict";
var TKEY="mantara_tut_v1";
function tGet(){try{return JSON.parse(localStorage.getItem(TKEY)||"{}")||{};}catch(e){return {};}}
function tSet(p){try{var s=tGet();for(var k in p)s[k]=p[k];localStorage.setItem(TKEY,JSON.stringify(s));}catch(e){}}

/* ---------------- LANGKAH TUR NAVIGASI ---------------- */
var STEPS=[
 {center:true,ico:"🧙",title:"Selamat Datang di Aetheria!",
  txt:"Aku <b>Penunjuk Takdir</b>. Kau baru saja lahir ke dunia sihir ini 👶. Ikuti tur singkat (±1 menit) untuk mengenal duniamu — atau lewati dan jelajahi sendiri.",
  next:"Mulai Tur ✨",skip:"Lewati"},
 {sel:".charcard .chartop",title:"Kartu Jati Diri",
  txt:"Nama, gelar, usia & lokasi 📍 karaktermu. Perhatikan <b>⚡ Aksi</b> — jatah 50 per tahun untuk aktivitas, kerja, dan perjalanan antar kota."},
 {sel:".charcard .stats",title:"Enam Takdirmu",
  txt:"<b>Nyawa, Bahagia, Kekuatan, Akal, Mana, Pesona.</b> Setiap pilihan hidup menggerakkan bar ini. Jika Nyawa habis… riwayatmu tamat ⚰️."},
 {sel:".logbox",title:"Gulungan Riwayat",
  txt:"Semua peristiwa hidupmu tercatat di gulungan ini — dari tangis pertama hingga akhir hayat. Cerita terbaru selalu di atas."},
 {sel:"#btnAge",title:"Tombol Terpenting!",
  txt:"<b>Lanjut Tahun ▸</b> memajukan usiamu. Event takdir datang, gaji dibayar, jatah ⚡ Aksi kembali penuh. Saat masih bayi, cukup tekan ini dan jawab event yang muncul."},
 {sel:'.tab3[data-group="Dunia"]',pre:function(){navGroup("Dunia");navSub("Dunia","Peta");},title:"Tab Dunia 🗺️",
  txt:"Peta 4 kota Aetheria. Tap kota untuk pindah (memakan ⚡ sesuai jarak), lalu kunjungi sub-lokasi ikonik di tiap kota."},
 {sel:"#globalSubbar",pre:function(){navSub("Dunia","Aktivitas");},title:"Sub-menu: Aksi ⚔️",
  txt:"<b>Aksi</b> = lokasimu: 🏠 <b>Rumah keluargamu</b> (tiap keluarga punya fasilitas unik — kolam, aula pedang, altar arcane...) dan sub-lokasi kota, masing-masing dengan kegiatan khasnya. Di sebelahnya ada <b>Toko</b> 🛒 — beda kota, beda isi!"},
 {sel:'.tab3[data-group="Diri"]',pre:function(){navGroup("Diri");},title:"Tab Diri 👤",
  txt:"<b>Karir</b> 💼: sekolah saat muda, lalu pekerjaan dengan <b>Gaya Profesi</b>, performa & keahlian yang kau latih sendiri. <b>Relasi</b> 💞, <b>Aset</b> 🏰 & <b>Tas</b> 🎒 juga di sini."},
 {center:true,ico:"🏟️",title:"Dunia = Tempatnya!",
  txt:"Semua ada lokasinya: duel & lomba (balap sapu 🧹, buru naga 🐉) di <b>Colosseum Aurelia</b>, judi 🎲 hanya di <b>Saltmoor</b> (18+), aset dibeli di <b>Pasar Aset</b> tiap kota — harga beda-beda!"},
 {sel:'.tab3[data-group="Dunia"]',pre:function(){navGroup("Dunia");navSub("Dunia","Peta");},title:"Kerajaan & Politik 👑",
  txt:"Di Peta ada <b>Kerajaan</b>: lihat siapa Raja yang bertakhta, baca 📜 <b>Berita Dunia</b>, gabung 🏛️ <b>Guild</b>. Saat dewasa kau bisa jadi <b>Kanselir</b>, <b>Gubernur</b>... bahkan merebut takhta lewat <b>KUDETA</b> 🗡️!"},
 {center:true,pre:function(){navGroup("Hidup");},ico:"✨",title:"Takdirmu Menanti!",
  txt:"Mulailah sebagai bayi — dunia terbuka seiring kau tumbuh: sekolah di usia 6, uang saku di 13, kerja di 15, dewasa penuh di 18. Aku akan muncul di tiap tahap. Tekan tombol 🧙 di kiri atas kapan pun butuh panduan, dan ⏻ untuk ganti karakter.<br><br><i>Selamat berhikayat! ✦</i>",
  next:"Mulai Hidupku ✦",skip:null},
];

/* ---------------- PANDUAN TAHAP HIDUP ---------------- */
var MILES=[
 {age:1,id:"m1",ico:"👶",tag:"Tahap Hidup · Bayi",title:"Masa Bayi (0–5)",
  d:"Tugasmu satu: tumbuh! Tekan <b>Lanjut Tahun ▸</b> dan hadapi event takdir yang datang. Tenang — efek buruk masih ringan bagi balita."},
 {age:6,id:"m6",ico:"🧒",tag:"Tahap Hidup · Anak",title:"Masa Kanak (6–12)",
  d:"Kau mulai bersekolah 📖! Di <b>Diri → Karir</b> kau bisa <b>berinteraksi dengan teman & guru</b> 🤝, gabung <b>Circle</b> sosial 🏰, dan ikut <b>Ekstrakurikuler</b> 🎯 (sihir, pedang, panahan, brawl...) lengkap dengan minigame latihan!"},
 {age:13,id:"m13",ico:"🧑",tag:"Tahap Hidup · Remaja",title:"Masa Remaja (13–17)",
  d:"Uang saku pertamamu 💰! Kini kau bisa <b>berbaur mencari teman</b> (Dunia → Aksi) dan menjaga hubungan di <b>Diri → Relasi</b>. Pilih sekolah lanjutan dengan bijak."},
 {age:15,id:"m15",ico:"💼",tag:"Tahap Hidup · Siap Kerja",title:"Usia Kerja!",
  d:"Kau sudah boleh bekerja! Buka <b>Diri → Karir</b>: pilih lowongan, lalu latih <b>Keahlian Profesi</b> & jaga <b>Performa</b> untuk gaji bonus dan promosi. Menu itu juga tempat status sekolahmu."},
 {age:18,id:"m18",ico:"👑",tag:"Tahap Hidup · Dewasa",title:"Dewasa Penuh (18+)",
  d:"Semua pintu terbuka: karir dengan <b>Gaya Profesi</b> pilihanmu (Diri → Karir), <b>bisnis & properti</b> (Pasar Aset kota), cinta 💞, Colosseum ⚔️🧹, meja judi Saltmoor 🎲, dan <b>Guild</b> 🏛️ di Peta. Bangun warisan untuk keturunanmu!"},
 {age:21,id:"m21",ico:"🏛️",tag:"Tahap Hidup · Panggung Politik",title:"Panggung Politik (21+)",
  d:"Dunia politik memanggil! Buka <b>Peta → Kerajaan</b>: bangun reputasi lalu melamar jadi <b>Kanselir</b>, menangkan kampanye <b>Gubernur</b>, dan jika cukup berani... rebut takhta lewat <b>KUDETA</b> 🗡️ — menang jadi Raja, gagal kehilangan segalanya."},
];

/* ---------------- ENGINE SPOTLIGHT ---------------- */
var ov=null,hole=null,card=null,cur=0,active=false;
function ensureDom(){
  if(ov)return;
  ov=document.createElement("div");ov.className="tut-overlay";ov.id="tutOverlay";
  ov.innerHTML='<div class="tut-hole" id="tutHole"></div><div class="tut-card" id="tutCard"></div>';
  document.body.appendChild(ov);
  hole=document.getElementById("tutHole");card=document.getElementById("tutCard");
  window.addEventListener("resize",function(){if(active)place(cur);});
}
function startTour(){ensureDom();active=true;cur=0;ov.classList.add("show");show(0);}
function endTour(done){
  active=false;if(ov)ov.classList.remove("show");
  tSet({tour:1});
  try{navGroup("Hidup");}catch(e){}
  if(typeof toast==="function")
    toast(done?"🧙 Tur selesai! Tekan tombol 🧙 di kiri atas kapan pun butuh panduan.":"Tur dilewati. Buka lagi lewat tombol 🧙 di kiri atas.");
}
function show(i){
  cur=i;var st=STEPS[i];
  try{if(st.pre)st.pre();}catch(e){}
  setTimeout(function(){place(i);},st.pre?200:20);
}
function place(i){
  var st=STEPS[i];
  var el=st.sel?document.querySelector(st.sel):null;
  if(el){try{el.scrollIntoView({block:"nearest"});}catch(e){}}
  setTimeout(function(){renderCard(i,st,el?el.getBoundingClientRect():null);},el?130:0);
}
function renderCard(i,st,r){
  var last=i>=STEPS.length-1;
  var dots=STEPS.map(function(_,j){return "<span class='tut-dot"+(j===i?" on":"")+"'></span>";}).join("");
  card.innerHTML=
    "<div class='tut-head'><span class='tut-mascot'>"+(st.ico||"🧙")+"</span><div>"
    +"<div class='tut-title'>"+st.title+"</div>"
    +"<div class='tut-step'>LANGKAH "+(i+1)+" / "+STEPS.length+"</div></div></div>"
    +"<div class='tut-body'>"+st.txt+"</div>"
    +"<div class='tut-dots'>"+dots+"</div>"
    +"<div class='tut-btns'>"
    +(st.skip===null?"":"<button class='tut-skip' onclick='tutSkip()'>"+(st.skip||"Lewati ✕")+"</button>")
    +"<button class='tut-next' onclick='tutNext()'>"+(st.next||(last?"Selesai ✦":"Lanjut ▸"))+"</button></div>";
  if(r&&r.width>0){
    hole.classList.remove("tut-center");
    hole.style.left=(r.left-6)+"px";hole.style.top=(r.top-6)+"px";
    hole.style.width=(r.width+12)+"px";hole.style.height=(r.height+12)+"px";
    card.classList.remove("centered");
    var vw=window.innerWidth,vh=window.innerHeight;
    var cw=Math.min(330,vw-36);
    card.style.width=cw+"px";card.style.transform="none";
    var ch=card.offsetHeight||190;
    var top=r.bottom+14;
    if(top+ch>vh-12)top=r.top-14-ch;
    if(top<10)top=Math.max(10,Math.min(vh-ch-10,(vh-ch)/2));
    var left=r.left+r.width/2-cw/2;
    left=Math.max(8,Math.min(vw-cw-8,left));
    card.style.top=top+"px";card.style.left=left+"px";
  }else{
    hole.classList.add("tut-center");
    hole.style.left="50%";hole.style.top="50%";hole.style.width="0px";hole.style.height="0px";
    card.classList.add("centered");
    card.style.width="";card.style.top="";card.style.left="";card.style.transform="";
  }
}
window.tutNext=function(){if(cur>=STEPS.length-1)return endTour(true);show(cur+1);};
window.tutSkip=function(){endTour(false);};

/* ---------------- POPUP TAHAP HIDUP ---------------- */
var gp=null;
function ensureGp(){
  if(gp)return;
  gp=document.createElement("div");gp.className="guide-pop";gp.id="guidePop";
  document.body.appendChild(gp);
}
function showGuide(m){
  ensureGp();
  gp.innerHTML=
    "<div class='gp-head'><span class='gp-ico'>"+m.ico+"</span><div>"
    +"<div class='gp-title'>"+m.title+"</div><div class='gp-tag'>"+m.tag+"</div></div></div>"
    +"<div class='gp-body'>"+m.d+"</div>"
    +"<div class='gp-btns'><button class='gp-off' onclick='tutGuideOff()'>🔕 Jangan tampilkan lagi</button>"
    +"<button class='gp-ok' onclick=\"tutGuideOk('"+m.id+"')\">Mengerti ▸</button></div>";
  gp.classList.add("show");
}
window.tutGuideOk=function(id){var p={};p["seen_"+id]=1;tSet(p);if(gp)gp.classList.remove("show");};
window.tutGuideOff=function(){tSet({off:1});if(gp)gp.classList.remove("show");
  if(typeof toast==="function")toast("🔕 Panduan tahap dimatikan. Nyalakan lagi lewat tombol 🧙.");};
function hideGuide(){if(gp)gp.classList.remove("show");}
function maybeMilestone(){
  var s=tGet();
  if(s.off||active)return;
  if(typeof C==="undefined"||!C||!C.alive)return;
  var modal=document.getElementById("modal");
  if(modal&&modal.classList.contains("show"))return; // event sedang tampil; coba tahun depan
  for(var i=0;i<MILES.length;i++){
    var m=MILES[i];
    if(!s["seen_"+m.id]&&C.age>=m.age&&C.age-m.age<=3){showGuide(m);return;}
  }
}

/* ---------------- TOMBOL BANTUAN 🧙 + KELUAR ⏻ ---------------- */
function buildHelpBtn(){
  var tb=document.querySelector(".topbar");if(!tb)return;
  if(!document.getElementById("tutHelp")){
    var b=document.createElement("button");
    b.id="tutHelp";b.className="tut-help";b.textContent="🧙";b.title="Panduan";
    b.onclick=openGuideMenu;
    tb.appendChild(b);
  }
  if(!document.getElementById("tutExit")){
    var x=document.createElement("button");
    x.id="tutExit";x.className="tut-help tut-exit";x.textContent="⏻";x.title="Menu Utama";
    x.onclick=confirmExit;
    tb.appendChild(x);
  }
}

/* ---------------- KELUAR KE MENU UTAMA (ganti/buat karakter) ---------------- */
function gameActive(){
  return typeof C!=="undefined"&&C&&!document.getElementById("tabbar").classList.contains("hidden");
}
function confirmExit(){
  if(!gameActive()){
    if(typeof toast==="function")toast("Kau sudah di menu utama ✨");return;
  }
  openChoice({ico:"⏻",prompt:"<b>Kembali ke Menu Utama?</b><br><span style='font-size:11px;color:var(--ink-soft);filter:brightness(1.6)'>Progres disimpan otomatis. Dari menu kau bisa ganti karakter atau membuat kisah baru.</span>",
    choices:[
      {label:"💾 Simpan & ke Menu Utama",sub:"Ganti karakter / karakter baru",run:function(){setTimeout(exitToMenu,150);return null;}},
    ]});
}
window.exitToMenu=function(){
  try{if(typeof C!=="undefined"&&C&&C.alive&&typeof saveGame==="function")saveGame(true);}catch(e){}
  hideGuide();
  if(active){active=false;if(ov)ov.classList.remove("show");}
  var sb=document.getElementById("globalSubbar");
  if(sb){sb.innerHTML="";sb.classList.add("hidden");}
  document.querySelectorAll(".view").forEach(function(v){v.classList.add("hidden");});
  document.getElementById("tabbar").classList.add("hidden");
  document.getElementById("agewrap").classList.add("hidden");
  document.getElementById("startScreen").classList.remove("hidden");
  try{initOrigins();}catch(e){}
  try{setupContinueButton();}catch(e){}
  if(typeof toast==="function")toast("💾 Tersimpan. Pilih karakter atau mulai kisah baru ✨");
};

/* ---------------- SURAT KELAHIRAN (narasi pembuka per asal-usul) ---------------- */
var BIRTH_TALES={
  peasant:{ico:"🌾",t:"Malam itu hujan rinai membasahi atap jerami. Di bilik sempit beraroma tanah basah, ibumu mendekapmu erat dan berbisik:<br><br>\"Kau lahir tanpa emas, <b>{name}</b>… tapi ladang mengajari kami satu hal — segala yang agung tumbuh dari benih paling kecil.\""},
  noble:{ico:"👑",t:"Lonceng istana berdentang dua belas kali saat kau lahir di atas kain sutra. Ayahmu menatapmu lama sekali, lalu berkata pelan:<br><br>\"Mahkota bisa diwariskan, <b>{name}</b>. Tapi kehormatan… harus kau tempa sendiri.\""},
  mageborn:{ico:"🔮",t:"Saat tangis pertamamu pecah, seluruh lilin di ruangan menyala biru. Ibumu memelukmu dengan gemetar — antara bangga dan takut:<br><br>\"Sembunyikan cahayamu, <b>{name}</b>… sampai kau cukup kuat untuk menyalakannya di hadapan dunia.\""},
  orphan:{ico:"🗡️",t:"Tak ada yang tahu siapa yang meletakkanmu di depan kedai malam itu. Hanya selimut lusuh, dan secarik kain bertuliskan <b>{name}</b>.<br><br>Kota yang keras ini akan menjadi ibumu. Dan kelak kau buktikan: darah bukan satu-satunya takdir."},
  merchant_kid:{ico:"⚖️",t:"Kau lahir di gudang beraroma kayu manis, di antara peti rempah dan gulungan sutra. Ayahmu menimbangmu di timbangan dagang sambil tertawa:<br><br>\"Tiga kati, <b>{name}</b>! Kelak kau akan paham — kepercayaan lebih mahal dari semua emas di gudang ini.\""},
};
function showBirthTale(){
  var o=(typeof C!=="undefined"&&C&&C.origin)||"peasant";
  var tale=BIRTH_TALES[o]||BIRTH_TALES.peasant;
  var nm=(typeof C!=="undefined"&&C&&C.name)||"Anakku";
  openChoice({ico:tale.ico,cancel:false,
    prompt:"<div class='birth-tale'>"+tale.t.split("{name}").join(nm)+"</div>",
    choices:[{label:"Buka mata & mulai hidup ✨",cls:"mc-ok",
      run:function(){if(!tGet().tour)setTimeout(startTour,450);return null;}}]});
}
function openGuideMenu(){
  if(typeof C==="undefined"||!C||!C.alive){
    if(typeof toast==="function")toast("Mulai sebuah kehidupan dulu, baru aku bisa memandumu ✨");return;
  }
  var s=tGet();
  openChoice({ico:"🧙",prompt:"<b>Penunjuk Takdir</b><br><span style='font-size:11px;color:var(--ink-soft);filter:brightness(1.6)'>Butuh bantuan apa, Petualang?</span>",
    choices:[
      {label:"🔁 Ulangi Tur Navigasi",sub:"Kenali ulang semua menu",run:function(){setTimeout(startTour,250);return null;}},
      {label:"📜 Tips Tahap Hidup",sub:"Bayi → Dewasa",run:function(){setTimeout(showAllTips,250);return null;}},
      {label:(s.off?"🔔 Nyalakan":"🔕 Matikan")+" Penunjuk Tahap",
       sub:s.off?"Panduan muncul lagi di tiap tahap hidup":"Tak ada lagi popup panduan tahap",
       run:function(){tSet({off:s.off?0:1});
         if(typeof toast==="function")toast(s.off?"🔔 Penunjuk tahap dinyalakan.":"🔕 Penunjuk tahap dimatikan.");
         return null;}},
    ]});
}
function showAllTips(){
  var html="<div style='text-align:left'>"+MILES.map(function(m){
    return "<div style='margin-bottom:10px'><div style='font-size:12.5px;font-weight:700;color:var(--gold-bright)'>"+m.ico+" "+m.title+"</div>"
      +"<div style='font-size:11px;line-height:1.5;margin-top:2px'>"+m.d+"</div></div>";}).join("")+"</div>";
  openChoice({ico:"📜",prompt:html,cancel:false,
    choices:[{label:"Mengerti ✦",cls:"mc-ok",run:function(){return null;}}]});
}

/* ---------------- INTEGRASI (monkeypatch) ---------------- */
// karakter baru lahir -> surat kelahiran, lalu tawarkan tur (sekali saja)
if(typeof confirmCustomize==="function"){
  var _tutCC=confirmCustomize;
  confirmCustomize=function(){
    var r=_tutCC.apply(this,arguments);
    try{hideGuide();setTimeout(showBirthTale,550);}catch(e){}
    return r;
  };
}
// load save lama -> jangan ganggu: tandai tur & tahap yang sudah lewat
function afterLoad(){
  if(typeof C==="undefined"||!C)return;
  var p={};
  MILES.forEach(function(m){if(C.age>m.age+3)p["seen_"+m.id]=1;});
  if(C.age>5)p.tour=1;
  tSet(p);hideGuide();
}
if(typeof loadSlot==="function"){var _tutLS=loadSlot;loadSlot=function(){var r=_tutLS.apply(this,arguments);try{afterLoad();}catch(e){}return r;};}
if(typeof loadGame==="function"){var _tutLG=loadGame;loadGame=function(){var r=_tutLG.apply(this,arguments);try{afterLoad();}catch(e){}return r;};}
if(typeof restart==="function"){var _tutRS=restart;restart=function(){try{hideAllTut();}catch(e){}return _tutRS.apply(this,arguments);};}

/* QA v25: kalau pemain mati saat popup "Tahap Hidup" atau kartu tur masih
   terbuka, keduanya menumpuk di atas layar epitaf — dan bertahan sampai
   layar mulai baru. Ditemukan lewat uji otomatis (die() pada usia 27:
   teks "Masa Bayi (0-5)" ikut muncul di batu nisan).
   Sekarang kematian menutup semua lapisan panduan. */
function hideAllTut(){
  try{hideGuide();}catch(e){}
  try{ active=false; if(ov)ov.classList.remove("show"); }catch(e){}
}
window.__mantaraHideTut=hideAllTut;

/* Semua lapisan yang boleh menutupi batu nisan disapu di satu tempat.
   Selain panduan, modal kejadian juga ikut: die() sering dipanggil DARI
   dalam resolusi pilihan (mis. "Aktivitas berakibat fatal"), sehingga
   modalnya masih terbuka saat layar kematian dilukis di belakangnya. */
function clearOverlaysForDeath(){
  hideAllTut();
  try{ if(typeof mpCloseAll==="function") mpCloseAll(); }catch(e){}
  try{
    var m=document.getElementById("modal");
    if(m) m.classList.remove("show");
    if(typeof pendingChoice!=="undefined") pendingChoice=null;
  }catch(e){}
  try{ for(var i=0;i<8;i++){ if(typeof popPage==="function") popPage(); else break; } }catch(e){}
}
if(typeof die==="function"){var _tutDie=die;window.die=die=function(){try{clearOverlaysForDeath();}catch(e){}return _tutDie.apply(this,arguments);};}

// tiap tahun berlalu -> cek tahap hidup baru (di-defer agar membungkus patch lain)
function hookYear(){
  if(typeof advanceYear!=="function")return;
  var _tutAY=advanceYear;
  advanceYear=function(){
    var r=_tutAY.apply(this,arguments);
    try{maybeMilestone();}catch(e){}
    return r;
  };
}
// modal event ditutup -> cek lagi (agar panduan tahap tak tertunda setahun)
function hookModal(){
  if(typeof closeModal!=="function")return;
  var _tutCM=closeModal;
  closeModal=function(){
    var r=_tutCM.apply(this,arguments);
    try{setTimeout(maybeMilestone,350);}catch(e){}
    return r;
  };
}
function boot(){
  try{buildHelpBtn();}catch(e){}
  try{hookYear();}catch(e){}
  try{hookModal();}catch(e){}
}
if(document.readyState!=="loading")setTimeout(boot,250);
else document.addEventListener("DOMContentLoaded",function(){setTimeout(boot,250);});
})();
