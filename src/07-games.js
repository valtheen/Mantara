// ============================================================
//  TAKDIR — PRIORITAS 2: Minigame, Turnamen, Gambling, Animasi
// ============================================================

// ---------- ANIMASI PENDEK (overlay ringan 2-3 detik) ----------
// tipe: 'clash' (pedang), 'race' (kuda), 'dice', 'cards', 'cheer', 'sad'
function playAnim(type,opts={}){
  const layer=document.getElementById("animLayer");
  if(!layer)return;
  // jangan mainkan animasi "hasil" (win/lose/coin/win) jika popup sedang terbuka,
  // supaya tidak menimpa & menutupi teks result popup.
  const modal=document.getElementById("modal");
  const modalOpen=modal&&modal.classList&&modal.classList.contains("show");
  if(modalOpen&&(type==="win"||type==="lose"||type==="coin"))return;
  let inner="";
  if(type==="clash") inner=`<div class="anim-clash"><span class="ac-l">⚔️</span><span class="ac-spark">💥</span><span class="ac-r">🛡️</span></div>`;
  else if(type==="race") inner=`<div class="anim-race"><span class="ar-run">🐎</span><span class="ar-dust">💨</span></div>`;
  else if(type==="chariot") inner=`<div class="anim-race"><span class="ar-run">🛞</span><span class="ar-dust">💨</span></div>`;
  else if(type==="dice") inner=`<div class="anim-dice">🎲</div>`;
  else if(type==="cards") inner=`<div class="anim-cards">🃏</div>`;
  else if(type==="win") inner=`<div class="anim-burst">🎉<span class="ab-sub">${opts.text||'MENANG!'}</span></div>`;
  else if(type==="lose") inner=`<div class="anim-burst sad">💀<span class="ab-sub">${opts.text||'KALAH'}</span></div>`;
  else if(type==="coin") inner=`<div class="anim-burst">💰<span class="ab-sub">${opts.text||''}</span></div>`;
  else inner=`<div class="anim-burst">✨</div>`;
  layer.innerHTML=`<div class="anim-box">${inner}</div>`;
  layer.classList.add("show");
  clearTimeout(layer._tm);
  layer._tm=setTimeout(()=>{layer.classList.remove("show");layer.innerHTML="";},opts.dur||1500);
}

// ---------- skill check util: peluang menang berbasis stat vs kesulitan ----------
// return {win, margin} ; margin 0..1 seberapa telak
function skillRoll(statVal,difficulty){
  // statVal 0..100, difficulty 0..100
  const edge=(statVal-difficulty)/100;          // -1..1
  const p=clamp((0.5+edge*0.45)*100)/100;        // 0.05..0.95 kira2
  const roll=Math.random();
  const win=roll<p;
  const margin=win?(p-roll)/Math.max(p,0.01):(roll-p)/Math.max(1-p,0.01);
  return {win,margin:clamp(margin*100)/100,p};
}

// ============================================================
//  TURNAMEN
// ============================================================
// tier: ronde bertingkat; tiap ronde lebih sulit & hadiah lebih besar
const TOURNAMENTS=[
  {id:"sword",ico:"⚔️",name:"Turnamen Pedang",stat:"might",entry:30,anim:"clash",
    rounds:[{diff:35,prize:40},{diff:55,prize:90},{diff:75,prize:220}],
    desc:"Adu pedang melawan jawara. Andalkan Kekuatan."},
  {id:"duel",ico:"🤺",name:"Duel Kehormatan",stat:"might",entry:20,anim:"clash",altStat:"mana",
    rounds:[{diff:40,prize:50},{diff:65,prize:130}],
    desc:"Duel satu lawan satu. Kekuatan atau Sihir."},
  {id:"horserace",ico:"🐎",name:"Balap Kuda",stat:"charm",entry:25,anim:"race",reqMount:["horse","warhorse","griffon"],
    rounds:[{diff:40,prize:60},{diff:60,prize:140},{diff:80,prize:300}],
    desc:"Balapan cepat. Butuh kuda. Pengendalian (Pesona) & nasib."},
  {id:"chariot",ico:"🏎️",name:"Balap Chariot",stat:"might",entry:50,anim:"chariot",reqMount:["warhorse","griffon"],
    rounds:[{diff:50,prize:120},{diff:70,prize:280},{diff:88,prize:600}],
    desc:"Balap kereta perang brutal. Butuh kuda perang+."},
];

function mountKey(){return C.gear?C.gear.mount:"none";}
function hasReqMount(t){return !t.reqMount||t.reqMount.includes(mountKey());}

function openTournament(tid){
  const t=TOURNAMENTS.find(x=>x.id===tid);if(!t)return;
  if(!hasReqMount(t)){toast(`Butuh tunggangan: ${t.reqMount.join("/")}. Beli di tab Aset.`);return;}
  if(C.coin<t.entry){toast(`Biaya masuk ${t.entry} keping, koin kurang.`);return;}
  // mulai dari ronde 0
  startTournamentRound(t,0,0);
}
function startTournamentRound(t,roundIdx,winnings){
  if(roundIdx===0){
    if(!spendAction()){toast("Aksi habis.");return;}
    C.coin-=t.entry;
  }
  const round=t.rounds[roundIdx];
  const statVal=Math.max(C.stats[t.stat], t.altStat?C.stats[t.altStat]:0);
  openChoice({ico:t.ico,
    prompt:`<b>${t.name}</b> — Ronde ${roundIdx+1}/${t.rounds.length}<br><span style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6)">Lawan tingkat kesulitan ${round.diff}. ${STAT_META[t.stat].name}mu: ${Math.round(statVal)}. Hadiah ronde: ${round.prize} keping.</span>`,
    cancel:false,
    choices:[
      {label:"Bertarung!",sub:`menang lanjut, kalah pulang dgn hadiah terkumpul`,cls:"love",run:()=>{
        const res=skillRoll(statVal,round.diff);
        playAnim(t.anim);
        setTimeout(()=>{
          if(res.win){
            const w=winnings+round.prize;
            applyStats({[t.stat]:+2,happy:+4});
            if(roundIdx+1<t.rounds.length){
              log(C.age,`🏆 ${t.name}: menang ronde ${roundIdx+1}! (+${round.prize})`,"e-good");
              playAnim("win",{text:`RONDE ${roundIdx+1} LOLOS`});
              setTimeout(()=>startTournamentRound(t,roundIdx+1,w),900);
            }else{
              C.coin+=w;C.reputation+=8;
              log(C.age,`👑 JUARA ${t.name}! Total hadiah ${w} keping & reputasi naik.`,"e-epic");
              playAnim("win",{text:`JUARA! +${w}💰`});
              checkMissions();updateTitle();renderAll();
            }
          }else{
            // kalah: tetap bawa hadiah terkumpul, tapi cedera
            C.coin+=winnings;
            const hurt=ri(8,22);applyStats({health:-hurt,happy:-5});
            log(C.age,`${t.name}: kalah di ronde ${roundIdx+1}. Cedera -${hurt} nyawa. Bawa pulang ${winnings} keping.`,"e-bad");
            playAnim("lose");
            if(C.stats.health<=0){setTimeout(()=>die("Tewas di arena turnamen."),500);return;}
            updateTitle();renderAll();
          }
        },700);
        return null; // animasi handle sisanya
      }},
      ...(roundIdx>0?[{label:"Mundur — ambil hadiah",sub:`bawa ${winnings} keping`,run:()=>{
        C.coin+=winnings;return{t:`Kau mundur dari ${t.name} membawa ${winnings} keping.`,cls:"e-good"};}}]:[]),
    ]});
}

// ============================================================
//  GAMBLING MEDIEVAL
// ============================================================
// 1) Dadu Hazard: tebak tinggi/rendah dari 2 dadu
// 2) Kartu Sihir: tarik kartu, lebih tinggi dari bandar = menang
function openGambling(){
  openChoice({ico:"🎲",prompt:"Sarang Judi — pilih permainan:",
    choices:[
      {label:"🎲 Dadu Hazard",sub:"tebak hasil 2 dadu",run:()=>{closeModal();setTimeout(diceGame,150);return null;}},
      {label:"🃏 Kartu Tinggi",sub:"adu kartu lawan bandar",run:()=>{closeModal();setTimeout(cardGame,150);return null;}},
    ]});
}
function betPrompt(title,ico,onBet){
  const bets=[10,25,50,100].filter(b=>C.coin>=b);
  if(!bets.length){toast("Koin tak cukup untuk bertaruh.");return;}
  openChoice({ico,prompt:`${title}<br><span style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6)">Koinmu: ${C.coin}. Pilih taruhan:</span>`,
    choices:bets.map(b=>({label:`Taruh ${b}`,sub:`menang = +${b}`,run:()=>{onBet(b);return null;}}))});
}
function diceGame(){
  if(!spendAction()){toast("Aksi habis.");return;}
  betPrompt("🎲 Dadu Hazard — tebak hasil","🎲",(bet)=>{
    closeModal();
    setTimeout(()=>openChoice({ico:"🎲",prompt:`Taruhan ${bet}. Tebak total 2 dadu:`,cancel:false,
      choices:[
        {label:"Rendah (2-6)",sub:"bayar 2x",run:()=>{rollDice(bet,"low");return null;}},
        {label:"Tujuh (7)",sub:"bayar 4x (langka!)",run:()=>{rollDice(bet,"seven");return null;}},
        {label:"Tinggi (8-12)",sub:"bayar 2x",run:()=>{rollDice(bet,"high");return null;}},
      ]}),140);
  });
}
function rollDice(bet,guess){
  C.coin-=bet;
  closeModal();              // tutup popup tebak dulu agar animasi tampil bersih
  playAnim("dice");
  setTimeout(()=>{
    const d1=ri(1,6),d2=ri(1,6),sum=d1+d2;
    let win=false,mult=0;
    if(guess==="low"&&sum<=6){win=true;mult=2;}
    if(guess==="high"&&sum>=8){win=true;mult=2;}
    if(guess==="seven"&&sum===7){win=true;mult=4;}
    if(win){const gain=bet*mult;C.coin+=gain;
      finishAct(`🎲 Dadu ${d1}+${d2}=${sum}. MENANG! +${gain} keping.`,"e-epic");}
    else{finishAct(`🎲 Dadu ${d1}+${d2}=${sum}. Kalah taruhan ${bet}.`,"e-bad");}
  },800);
}
function cardGame(){
  if(!spendAction()){toast("Aksi habis.");return;}
  betPrompt("🃏 Kartu Tinggi — adu vs bandar","🃏",(bet)=>{
    C.coin-=bet;closeModal();
    playAnim("cards");
    setTimeout(()=>{
      // pesona sedikit menaikkan peluang (membaca bandar)
      const me=ri(1,13)+Math.round(C.stats.charm/40);
      const dealer=ri(1,13);
      const NAMES={1:"As",11:"Jack",12:"Ratu",13:"Raja"};
      const nm=v=>NAMES[v]||v;
      if(me>dealer){const gain=bet*2;C.coin+=gain;
        finishAct(`🃏 Kartumu ${nm(Math.min(me,13))} mengalahkan bandar ${nm(dealer)}. MENANG +${gain}!`,"e-epic");}
      else if(me===dealer){C.coin+=bet;
        finishAct(`🃏 Seri (${nm(dealer)}). Taruhan kembali.`,"e-good");}
      else{finishAct(`🃏 Kartumu ${nm(Math.min(me,13))} kalah dari bandar ${nm(dealer)}. Kehilangan ${bet}.`,"e-bad");}
    },800);
  });
}

// ============================================================
//  PRIORITAS 2 — Aktivitas khas Sub-Lokasi (sambung minigame)
// ============================================================
// tiap sub-lokasi id -> daftar aktivitas. run() boleh buka minigame/popup.
const SUBLOC_ACTS={
  // --- Aetheria ---
  ae_palace:[
    {ico:"🎭",label:"Politik istana",hint:"Reputasi (butuh akal/pesona)",run:()=>{if(!spendAction())return;
      if(C.stats.mind>55||C.stats.charm>60){C.reputation+=ri(5,12);finishAct("Kau memenangkan simpati bangsawan.","e-good","win");}
      else{C.reputation-=ri(2,6);finishAct("Manuvermu gagal, dipermalukan di istana.","e-bad","lose");}}},
    {ico:"⚔️",label:"Turnamen Pedang",hint:"adu jawara, hadiah besar",run:()=>openTournament("sword")},
    {ico:"🤺",label:"Duel Kehormatan",hint:"1 lawan 1",run:()=>openTournament("duel")},
    {ico:"🏎️",label:"Balap Chariot",hint:"butuh kuda perang+",run:()=>openTournament("chariot")},
  ],
  ae_market:[
    {ico:"⚖️",label:"Spekulasi bursa",hint:"untung/rugi besar",run:()=>{if(!spendAction())return;
      if(chance(0.55)){const g=ri(25,90);C.coin+=g;finishAct(`Spekulasi untung +${g}!`,"e-good","coin",`+${g}💰`);}
      else{const l=ri(15,55);C.coin=Math.max(0,C.coin-l);finishAct(`Pasar anjlok, rugi -${l}.`,"e-bad","lose");}}},
    {ico:"🛍️",label:"Belanja barang langka",hint:"buka toko/inventory",run:()=>{switchTab("Inventory");}},
  ],
  ae_academy:[
    {ico:"📚",label:"Belajar di akademi",hint:"Akal ++",run:()=>{if(!spendAction())return;applyStats({mind:+ri(4,9)});finishAct("Kau menyerap ilmu di akademi.","e-good","win");}},
    {ico:"🎓",label:"Lihat program sekolah",hint:"(segera hadir)",run:()=>toast("Sekolah formal hadir di update berikutnya!")},
  ],
  ae_baths:[
    {ico:"♨️",label:"Berendam mewah",hint:"Nyawa + Bahagia + Pesona",run:()=>{if(!spendAction())return;const c=mulCost(15);if(C.coin<c){toast("Koin kurang.");return;}C.coin-=c;applyStats({health:+8,happy:+8,charm:+4});finishAct("Berendam di pemandian marmer, segar total.","e-good","win");}},
    {ico:"💆",label:"Pijat & rawat diri",hint:"Pesona ++",run:()=>{if(!spendAction())return;const c=mulCost(25);if(C.coin<c){toast("Koin kurang.");return;}C.coin-=c;applyStats({charm:+6,happy:+5});grantActionBonus(1);finishAct("Perawatan membuatmu segar & bersemangat.","e-good","win");}},
  ],
  // --- Thornvale ---
  th_woods:[
    {ico:"🏹",label:"Berburu buruan",hint:"Koin + Kekuatan + (kulit buruan)",run:()=>{if(!spendAction())return;
      const res=skillRoll(C.stats.might,40);
      if(res.win){const g=ri(15,45);C.coin+=g;applyStats({might:+2});addItem("hide");finishAct(`Buruan sukses! +${g} keping & kulit buruan.`,"e-good","win",`+${g}💰`);}
      else{applyStats({health:-ri(5,15)});finishAct("Buruan gagal, kau tergores semak & taring.","e-bad","lose");}}},
    {ico:"🐺",label:"Jinakkan makhluk buas",hint:"companion (butuh kekuatan)",run:()=>{if(!spendAction())return;
      if(C.stats.might>55&&chance(0.5)){const r=addRel("pengikut",{loyalty:ri(60,80),name:rand(["Serigala Bayangan","Griffon Muda","Rubah Arcane"]),ico:"🐾"});finishAct(`Kau menjinakkan ${r.name}!`,"e-good","win");}
      else{applyStats({health:-ri(15,30)});finishAct("Makhluk itu melukaimu & kabur.","e-bad","lose");}}},
  ],
  th_camp:[
    {ico:"💰",label:"Jual hasil buruan",hint:"butuh kulit di tas",run:()=>{if((C.inventory.hide||0)<1){toast("Tak ada kulit buruan di tas.");return;}if(!spendAction())return;const q=C.inventory.hide;const g=q*ri(12,25);C.coin+=g;C.inventory.hide=0;finishAct(`Kau menjual ${q} kulit buruan (+${g}).`,"e-good","coin",`+${g}💰`);}},
    {ico:"🧑‍🌾",label:"Rekrut pemburu",hint:"pengikut",run:()=>{if(!spendAction())return;if(C.coin>=40){C.coin-=40;const r=addRel("pengikut",{loyalty:ri(50,70)});finishAct(`${r.name} bergabung sebagai pemburu pengikut.`,"e-good","win");}else toast("Butuh 40 keping.");}},
    {ico:"🐎",label:"Balap Kuda",hint:"butuh kuda, hadiah besar",run:()=>openTournament("horserace")},
  ],
  th_herbalist:[
    {ico:"🌿",label:"Beli ramuan (apothecary)",hint:"buka tas/toko",run:()=>switchTab("Inventory")},
    {ico:"⚗️",label:"Racik herbal",hint:"Akal +, mungkin koin",run:()=>{if(!spendAction())return;applyStats({mind:+3});if(chance(0.5)){const g=ri(10,30);C.coin+=g;finishAct(`Racikanmu laku +${g}.`,"e-good","coin");}else finishAct("Kau belajar meracik herbal.","e-good","win");}},
  ],
  th_market:[
    {ico:"🪵",label:"Dagang barang hutan",hint:"Koin +",run:()=>{if(!spendAction())return;const g=ri(8,25);C.coin+=g;finishAct(`Kau berdagang kayu & hasil hutan (+${g}).`,"e-good","coin");}},
  ],
  // --- Saltmoor ---
  sa_docks:[
    {ico:"🚢",label:"Kerja bongkar muat",hint:"Koin + Kekuatan +",run:()=>{if(!spendAction())return;const g=ri(12,28);C.coin+=g;applyStats({might:+2,health:-2});finishAct(`Kerja di dermaga (+${g}).`,"e-good","coin");}},
    {ico:"🗺️",label:"Cari harta bajak laut",hint:"eksklusif Saltmoor!",run:()=>{if(!spendAction())return;
      if(chance(0.25)){C.flags.pirateTreasure=1;const g=ri(80,200);C.coin+=g;C.reputation+=6;finishAct(`Kau menemukan Harta Karun Bajak Laut! +${g}!`,"e-epic","win",`+${g}💰`);}
      else finishAct("Kau menyelami dermaga tua, tak menemukan apa-apa.","e-bad","lose");}},
  ],
  sa_den:[
    {ico:"🎲",label:"Berjudi",hint:"dadu / kartu fantasi",run:()=>openGambling()},
  ],
  sa_black:[
    {ico:"🕯️",label:"Beli barang gelap",hint:"murah tapi berisiko",run:()=>{if(!spendAction())return;if(chance(0.7)){addItem(rand(["lucky_coin","training_manual","ancient_scroll"]));finishAct("Kau mendapat barang langka dari pasar gelap.","e-good","win");}else{C.reputation-=5;finishAct("Penipuan! Kau ditipu pedagang gelap.","e-bad","lose");}}},
  ],
  sa_grocer:[
    {ico:"🐟",label:"Beli makanan laut",hint:"Nyawa +",run:()=>{if(!spendAction())return;const c=mulCost(10);if(C.coin<c){toast("Koin kurang.");return;}C.coin-=c;applyStats({health:+6,happy:+3});finishAct("Makan seafood segar, tubuh pulih.","e-good","win");}},
  ],
  // --- Frostspire ---
  fr_tower:[
    {ico:"🔮",label:"Latihan sihir tinggi",hint:"Mana ++ (penyihir)",run:()=>{if(!C.isMage){toast("Hanya untuk penyihir.");return;}if(!spendAction())return;applyStats({mana:+ri(5,11),mind:+2});finishAct("Kau berlatih mantra tingkat tinggi.","e-arcane","win");}},
    {ico:"✨",label:"Enchant barang",hint:"koin besar (butuh mana)",run:()=>{if(!spendAction())return;if(C.stats.mana>50){const g=ri(30,90);C.coin+=g;applyStats({mana:-5});finishAct(`Jasa enchant dibayar +${g}.`,"e-good","coin");}else toast("Mana belum cukup.");}},
  ],
  fr_library:[
    {ico:"📚",label:"Baca gulungan kuno",hint:"Akal ++ Mana +",run:()=>{if(!spendAction())return;applyStats({mind:+ri(4,8),mana:+2});finishAct("Pengetahuan kuno mengalir ke benakmu.","e-arcane","win");}},
    {ico:"🗿",label:"Cari artefak arcane",hint:"eksklusif Frostspire!",run:()=>{if(!spendAction())return;if(chance(0.28)){C.flags.arcaneArtifact=1;applyStats({mana:+15});C.reputation+=8;finishAct("Kau menemukan Artefak Arcane! Mana melonjak.","e-epic","win");}else finishAct("Rak-rak beku itu tak menyerahkan rahasianya.","e-bad","lose");}},
  ],
  fr_forge:[
    {ico:"❄️",label:"Tempa senjata es",hint:"buka toko senjata",run:()=>switchTab("Aset")},
  ],
  fr_apoth:[
    {ico:"⚗️",label:"Beli ramuan arcane",hint:"buka tas",run:()=>switchTab("Inventory")},
    {ico:"🧪",label:"Racik obat langka",hint:"Nyawa + Mana +",run:()=>{if(!spendAction())return;applyStats({health:+8,mana:+4});finishAct("Kau meracik obat penyembuh langka.","e-good","win");}},
  ],
};

// helper: harga ikut biaya hidup kota
function mulCost(base){return Math.round(base*(currentCity().costMul||1));}

// helper: selesaikan aktivitas instan dgn animasi + render
function finishAct(msg,cls,anim,animText){
  log(C.age,msg,cls||"e-good");toast(msg);
  if(anim)playAnim(anim,{text:animText});
  if(C.stats.health<=0){die("Aktivitas berakibat fatal.");return;}
  checkMissions();updateTitle();renderAll();
}

// tambah item kulit buruan ke katalog inventory kalau belum ada
if(typeof ITEM_CATALOG!=="undefined" && !ITEM_CATALOG.find(i=>i.key==="hide")){
  ITEM_CATALOG.push({key:"hide",ico:"🦫",name:"Kulit Buruan",price:0,reusable:false,noBuy:true,
    desc:"Hasil berburu. Jual di Kamp Pemburu atau jadikan hadiah.",use:()=>"Kulit buruan hanya bisa dijual/dihadiahkan."});
}

// ---------- render aktivitas sub-lokasi (dipanggil dari renderAktivitas) ----------
function sublocActsHTML(){
  if(!C.subloc)return "";
  const acts=SUBLOC_ACTS[C.subloc];
  if(!acts||!acts.length)return "";
  const sub=currentCity().sublocs.find(s=>s.id===C.subloc);
  let html=`<div class="sechead">✦ Khas ${sub.name}</div><div class="tiles">`;
  acts.forEach((a,i)=>{
    html+=`<div class="tile" onclick="runSublocAct('${C.subloc}',${i})">
      <span class="ti">${a.ico}</span><span class="tn">${a.label}</span>
      <span class="td">${a.hint}</span></div>`;});
  html+=`</div>`;
  return html;
}
function runSublocAct(sublocId,idx){
  const acts=SUBLOC_ACTS[sublocId];if(!acts)return;
  const a=acts[idx];if(!a)return;
  a.run();
}

// ============================================================
//  REVISI — Batas Umur Aktivitas (logika dunia nyata)
// ============================================================
// kategori umur:
//  balita 0-5: hanya main/istirahat pasif
//  anak 6-12: belajar & latihan ringan
//  remaja 13-17: hampir semua, kecuali judi & kejahatan berat
//  dewasa 18+: semua

// ---------- minAge untuk AKTIVITAS UMUM ----------
const ACT_MIN_AGE={
  train:8,    // latihan fisik: mulai 8 th (ringan)
  study:6,    // belajar: 6 th
  magic:10,   // latihan arcane: 10 th
  reflect:0,  // bersantai/berdoa: semua umur
};

// ---------- minAge untuk AKTIVITAS SUB-LOKASI ----------
// key = sublocId, value = array minAge per aktivitas (urutan sama dgn SUBLOC_ACTS)
const SUBLOC_ACT_MIN_AGE={
  ae_palace:[16,16,16,18],        // politik 16, turnamen pedang 16, duel 16, chariot 18
  ae_market:[18,13],              // spekulasi 18, belanja 13
  ae_academy:[6,13],              // belajar 6, lihat sekolah 13
  ae_baths:[10,13],               // berendam 10, pijat 13
  th_woods:[12,16],               // berburu 12, jinakkan buas 16
  th_camp:[13,16,13],             // jual buruan 13, rekrut 16, balap kuda 13
  th_herbalist:[10,10],           // beli ramuan 10, racik 10
  th_market:[12],                 // dagang 12
  sa_docks:[14,16],               // kerja dermaga 14, cari harta 16
  sa_den:[18],                    // judi 18
  sa_black:[16],                  // pasar gelap 16
  sa_grocer:[8],                  // beli makanan 8
  fr_tower:[12,16],               // sihir 12, enchant 16
  fr_library:[8,14],              // baca 8, cari artefak 14
  fr_forge:[14],                  // tempa 14
  fr_apoth:[10,12],               // beli ramuan 10, racik obat 12
};

// ---------- aktivitas khusus BALITA & ANAK (selalu tersedia di umur muda) ----------
const CHILD_ACTS=[
  {minAge:0,maxAge:12,ico:"🧸",label:"Bermain",hint:"Bahagia + (anak-anak)",run:()=>{if(!spendAction())return;applyStats({happy:+ri(4,8)});finishAct("Kau bermain riang sepanjang hari.","e-good","win");}},
  {minAge:0,maxAge:12,ico:"😴",label:"Istirahat",hint:"Nyawa +",run:()=>{if(!spendAction())return;applyStats({health:+ri(3,6)});finishAct("Kau tidur nyenyak & tumbuh sehat.","e-good","win");}},
  {minAge:4,maxAge:12,ico:"🤗",label:"Bermain dgn keluarga",hint:"Relasi keluarga +",run:()=>{if(!spendAction())return;
    const fam=C.relations.filter(r=>r.role==="keluarga"&&!r.isChild);
    if(fam.length){fam.forEach(r=>r.bond=clamp(r.bond+ri(3,7)));applyStats({happy:+5});finishAct("Kau bermain bersama keluarga, ikatan menguat.","e-good","win");}
    else{applyStats({happy:+3});finishAct("Kau bermain sendirian.","e-good","win");}}},
];

// ---------- helper cek umur ----------
function actAllowed(minAge){return C.age>=(minAge||0);}

// ---------- override openSubs: cek umur aktivitas umum ----------
const _preAgeOpenSubs=openSubs;
openSubs=function(actId){
  const minA=ACT_MIN_AGE[actId]||0;
  if(!actAllowed(minA)){toast(`Kamu harus berusia minimal ${minA} tahun untuk ini.`);return;}
  _preAgeOpenSubs(actId);
};

// ---------- override runSublocAct: cek umur per aktivitas ----------
const _preAgeRunSubloc=runSublocAct;
runSublocAct=function(sublocId,idx){
  const ages=SUBLOC_ACT_MIN_AGE[sublocId];
  const minA=ages?(ages[idx]||0):0;
  if(!actAllowed(minA)){toast(`Perlu usia minimal ${minA} tahun untuk aktivitas ini.`);return;}
  _preAgeRunSubloc(sublocId,idx);
};

// ---------- override renderAktivitas: tampilkan child-acts utk anak, filter umur ----------
const _preAgeRenderAktivitas=renderAktivitas;
renderAktivitas=function(){
  _preAgeRenderAktivitas();
  const host=document.getElementById("viewAktivitas");
  if(!host)return;

  // 1) sisipkan kartu aktivitas anak di paling atas kalau masih muda
  if(C.age<13){
    const kid=CHILD_ACTS.filter(a=>C.age>=a.minAge&&C.age<=a.maxAge);
    if(kid.length){
      let kh=`<div class="sechead">🧒 Masa Kecil</div><div class="tiles">`;
      kid.forEach((a,i)=>{kh+=`<div class="tile" onclick="runChildAct(${i})">
        <span class="ti">${a.ico}</span><span class="tn">${a.label}</span>
        <span class="td">${a.hint}</span></div>`;});
      kh+=`</div>`;
      host.innerHTML=kh+host.innerHTML;
    }
  }

  // 2) redam (locked) kartu yg belum cukup umur — tandai visual
  //    (filter dilakukan saat klik via guard; di sini kita beri catatan)
  if(C.age<18){
    const note=document.createElement("div");
  }
};
function runChildAct(i){
  const kid=CHILD_ACTS.filter(a=>C.age>=a.minAge&&C.age<=a.maxAge);
  const a=kid[i];if(!a)return;a.run();
}

// ---------- filter visual: sembunyikan aktivitas sub-lokasi yg belum cukup umur ----------
// override sublocActsHTML supaya aktivitas terkunci tampil redup + label umur
const _preAgeSublocHTML=sublocActsHTML;
sublocActsHTML=function(){
  if(!C.subloc)return "";
  const acts=SUBLOC_ACTS[C.subloc];
  if(!acts||!acts.length)return "";
  const ages=SUBLOC_ACT_MIN_AGE[C.subloc]||[];
  const sub=currentCity().sublocs.find(s=>s.id===C.subloc);
  let html=`<div class="sechead">✦ Khas ${sub.name}</div><div class="tiles">`;
  acts.forEach((a,i)=>{
    const minA=ages[i]||0;
    const locked=C.age<minA;
    html+=`<div class="tile ${locked?'locked':''}" ${locked?'':`onclick="runSublocAct('${C.subloc}',${i})"`}>
      <span class="ti">${a.ico}</span><span class="tn">${a.label}</span>
      <span class="td">${locked?`🔒 min ${minA} th`:a.hint}</span></div>`;});
  html+=`</div>`;
  return html;
};
