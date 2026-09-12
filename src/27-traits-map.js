/* ==================================================================
   MANTARA — PETA HIDUP + PERANGAI (traits ala CK3) + EKSPEDISI
   Peta dunia beranimasi: laut berombak & kapal berlayar, hutan
   berkunang, gunung bersalju, asap ibukota, awan & burung. Ada
   TEMPAT TERSEMBUNYI acak untuk dieksplorasi. Karakter lahir dengan
   PERANGAI yang mempengaruhi hidup & bisa menurun ke ahli waris.
   ================================================================== */
/* ---------- PERANGAI (traits) ---------- */
const TRAITS=[
  {id:"brave",ico:"🦁",name:"Pemberani",d:"Kekuatan +1/th · unggul saat bahaya & ekspedisi",y:{might:1}},
  {id:"ambitious",ico:"🔥",name:"Ambisius",d:"Reputasi +1/th, tapi Bahagia -1/th",y:{happy:-1},rep:1},
  {id:"scholar",ico:"📖",name:"Kutu Buku",d:"Akal +1/th · pandai membaca rune kuno",y:{mind:1}},
  {id:"charming",ico:"🌹",name:"Menawan",d:"Pesona +1/th",y:{charm:1}},
  {id:"greedy",ico:"🪙",name:"Tamak",d:"Menemukan koin lebih banyak, kadang reputasi tergores",coin:[3,8]},
  {id:"kind",ico:"🕊️",name:"Baik Hati",d:"Bahagia +1/th · relasi menguat perlahan",y:{happy:1},bond:true},
  {id:"lazy",ico:"😴",name:"Pemalas",d:"Nyawa +1/th",y:{health:1},lazy:true},
  {id:"gifted",ico:"✨",name:"Berbakat Arcane",d:"Mana +1/th",y:{mana:1}},
];
function ensureTraits(){
  if(C.traits&&C.traits.length)return C.traits;
  const pool=TRAITS.slice();
  C.traits=[];
  for(let i=0;i<2;i++){const t=rand(pool);C.traits.push(t.id);pool.splice(pool.indexOf(t),1);}
  return C.traits;
}
function hasTrait(id){return C.traits&&C.traits.includes(id);}
function traitOf(id){return TRAITS.find(t=>t.id===id);}
window.openTraitsPage=function(){
  ensureTraits();
  pushPage({title:"Perangai",render:function(){
    let h=pgNote("Perangai terbentuk sejak lahir — mewarnai hidupmu tiap tahun & membuka jalan di peristiwa tertentu. Sebagian menurun ke ahli warismu.");
    h+=pgSec("Perangaimu");
    C.traits.forEach(id=>{const t=traitOf(id);if(t)h+=pgRow({ico:t.ico,title:t.name,sub:t.d});});
    return h;
  }});
};
// efek tahunan perangai + pewarisan ke ahli waris
(function traitHooks(){
  const _tAY=advanceYear;
  advanceYear=function(){
    const r=_tAY.apply(this,arguments);
    try{
      if(!C||!C.alive)return r;
      ensureTraits();
      C.traits.forEach(id=>{
        const t=traitOf(id);if(!t)return;
        if(t.y)applyStats(t.y);
        if(t.rep)C.reputation+=t.rep;
        if(t.coin){const g=ri(t.coin[0],t.coin[1]);C.coin+=g;if(chance(0.12)){C.reputation=Math.max(0,C.reputation-1);}}
        if(t.bond&&C.relations.length&&chance(0.5)){const r2=rand(C.relations);r2.bond=clamp((r2.bond||50)+2);}
        if(t.lazy&&chance(0.25)){C.actionsLeft=Math.max(0,C.actionsLeft-1);}
      });
    }catch(e){}
    return r;
  };
  if(typeof buildHeirCharacter==="function"){
    const _bh=buildHeirCharacter;
    buildHeirCharacter=function(){
      const parentTraits=(C&&C.traits)?C.traits.slice():[];
      const r=_bh.apply(this,arguments);
      try{
        if(C&&parentTraits.length){
          const inherited=rand(parentTraits);
          const pool=TRAITS.filter(t=>t.id!==inherited);
          C.traits=[inherited,rand(pool).id];
          log(C.age,`${traitOf(inherited).ico} Kau mewarisi perangai "${traitOf(inherited).name}" dari orang tuamu.`,"e-arcane");
        }
      }catch(e){}
      return r;
    };
  }
})();
// tampilkan chip perangai di kartu karakter (tap untuk detail)
(function traitChips(){
  const _rh=renderHidup;
  renderHidup=function(){
    _rh.apply(this,arguments);
    try{
      ensureTraits();
      const el=document.querySelector("#viewHidup .charcard .cinfo");
      if(el&&!el.querySelector(".trait-chips")){
        const chips=C.traits.map(id=>{const t=traitOf(id);return t?`${t.ico} ${t.name}`:"";}).join(" · ");
        /* QA v25: dulu barisnya cuma setinggi 13px — jauh di bawah ambang
           sentuh 44px, sulit ditekan di ponsel. Sekarang dibuat tombol
           sungguhan dengan tinggi minimum & area sentuh layak. */
        el.insertAdjacentHTML("beforeend",`<button type="button" class="cage trait-chips" onclick="openTraitsPage()" aria-label="Lihat semua perangai" style="display:flex;align-items:center;justify-content:flex-start;gap:4px;width:100%;min-height:44px;padding:6px 8px;margin-top:2px;background:none;border:0;text-align:left;color:var(--gold);cursor:pointer;font:inherit">${chips} ›</button>`);
      }
    }catch(e){}
  };
})();
/* ---------- TEMPAT TERSEMBUNYI (ekspedisi ala event CK3) ---------- */
const MAP_POIS=[
  {id:"ruins",ico:"🏚️",name:"Reruntuhan Kuno",x:112,y:196,desc:"Sisa peradaban era Peperangan Kuno. Konon hartanya belum habis dijarah.",minAge:13},
  {id:"shrine",ico:"⛩️",name:"Altar Rimba",x:38,y:108,desc:"Altar tua berlumut di jantung hutan. Ada yang berbisik di sana.",minAge:10},
  {id:"cave",ico:"💎",name:"Gua Kristal",x:120,y:38,desc:"Gua berkilau di kaki gunung — cahayanya memanggil.",minAge:13},
  {id:"wreck",ico:"🚢",name:"Bangkai Kapal",x:288,y:222,desc:"Kerangka kapal dagang tua di pesisir berkabut.",minAge:13},
  {id:"tower",ico:"🗼",name:"Menara Sunyi",x:196,y:120,desc:"Menara penyihir yang ditinggalkan... atau tidak?",minAge:15},
];
function ensureMapPOI(){
  if(C.mapPOI)return C.mapPOI;
  const pool=MAP_POIS.slice();C.mapPOI=[];
  for(let i=0;i<3;i++){const p=rand(pool);C.mapPOI.push(p.id);pool.splice(pool.indexOf(p),1);}
  return C.mapPOI;
}
window.openPOIPage=function(pid){
  const p=MAP_POIS.find(x=>x.id===pid);if(!p)return;
  pushPage({title:p.name,render:function(){
    const explored=C._poiYr&&C._poiYr[pid]===C.age;
    let h=pgNote(`${p.ico} ${p.desc}`);
    h+=pgSec("Ekspedisi");
    h+=pgRow({ico:"🧭",title:explored?"Sudah dijelajahi tahun ini":"Jelajahi tempat ini",
      sub:explored?"kembalilah tahun depan — tempat ini menyimpan lebih banyak rahasia":(C.age<p.minAge?`🔒 min ${p.minAge} th`:"2 ⚡ · hasil tak terduga — perangaimu berpengaruh"),
      dim:explored||C.age<p.minAge,
      on:()=>explorePOI(pid)});
    return h;
  }});
};
window.explorePOI=function(pid){
  const p=MAP_POIS.find(x=>x.id===pid);if(!p)return;
  if(C.actionsLeft<2){toast("Butuh 2 aksi untuk ekspedisi.");return;}
  C.actionsLeft-=2;
  if(!C._poiYr)C._poiYr={};
  C._poiYr[pid]=C.age;
  ensureTraits();
  const roll=Math.random();
  if(roll<0.3){ // harta
    let g=ri(20,60);
    if(hasTrait("greedy")){g=Math.round(g*1.5);}
    C.coin+=g;
    finishAct(`${p.ico} ${hasTrait("greedy")?"Nalurimu mencium emas — ":""}Kau menemukan ${g} keping tersembunyi di ${p.name}!`,"e-epic","coin",`+${g}💰`);
  }else if(roll<0.5){ // pengetahuan/rune
    if(hasTrait("scholar")){applyStats({mind:+8,mana:+3});
      finishAct(`${p.ico} Sebagai kutu buku, kau membaca rune kuno dengan mudah — rahasianya terbuka!`,"e-arcane","win");}
    else{applyStats({mind:+4});
      finishAct(`${p.ico} Kau menyalin ukiran aneh untuk dipelajari. Akal bertambah.`,"e-good","win");}
  }else if(roll<0.68){ // barang
    addItem(rand(["health_potion","ancient_scroll","lucky_coin"]));
    finishAct(`${p.ico} Di antara puing kau menemukan barang berharga (masuk Tas 🎒)!`,"e-epic","win");
  }else if(roll<0.88){ // PENUNGGU — duel!
    if(window.MantaraArena&&MantaraArena.startTacticalDuel){
      const guard={name:"Penunggu "+p.name,ico:"👻",hp:60+C.age,atk:14+ri(0,8),mag:12,special:"Jerit Kelam"};
      MantaraArena.startTacticalDuel(guard,{
        title:"Ekspedisi "+p.name,allowFlee:true,
        intro:`${p.ico} Bayangan bangkit dari kegelapan... Penunggu tempat ini tak suka tamu!`,
        onEnd:function(res){
          if(res&&res.win){const g=ri(40,90);C.coin+=g;applyStats({might:+3,happy:+5});
            finishAct(`${p.ico} Penunggu ditaklukkan! Hartanya jadi milikmu (+${g}).`,"e-epic","win");}
          else if(res&&!res.quit){applyStats({health:-ri(10,20)});
            finishAct(`${p.ico} Kau lari terbirit-birit dari penunggu itu...`,"e-bad");}
        }});
    }else{applyStats({health:-ri(5,15)});finishAct(`${p.ico} Sesuatu menyerangmu dari kegelapan!`,"e-bad");}
  }else{ // nihil / berani dapat bonus kecil
    if(hasTrait("brave")){applyStats({might:+3,happy:+3});
      finishAct(`${p.ico} Tempat itu sunyi — tapi menjelajah sendirian menempa nyalimu.`,"e-good","win");}
    else finishAct(`${p.ico} Kau hanya menemukan debu & gema langkahmu sendiri.`,"");
  }
  mpCloseAll();
};
/* ---------- PETA DUNIA HIDUP (override worldMapSVG) ---------- */
worldMapSVG=function(){
  const grads=Object.keys(CITY_THEME).map(id=>{
    const t=CITY_THEME[id];
    return `<radialGradient id="grad_${id}" cx="40%" cy="35%">
      <stop offset="0%" stop-color="${t.c1}"/><stop offset="100%" stop-color="${t.c2}"/>
    </radialGradient>`;}).join("");
  const routes=MAP_ROUTES.map(([a,b])=>{
    const pa=CITY_POS[a],pb=CITY_POS[b];
    const onPath=(a===C.cityId||b===C.cityId);
    return `<line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}"
      stroke="${onPath?'#b8860b':'#3a2e1e'}" stroke-width="${onPath?1.6:1}"
      stroke-dasharray="4 3" opacity="${onPath?0.7:0.4}">
      ${onPath?`<animate attributeName="stroke-dashoffset" values="14;0" dur="1.2s" repeatCount="indefinite"/>`:''}
    </line>`;}).join("");
  // tempat tersembunyi
  ensureMapPOI();
  const pois=C.mapPOI.map(pid=>{
    const p=MAP_POIS.find(x=>x.id===pid);if(!p)return "";
    return `<g class="map-city" onclick="openPOIPage('${p.id}')" style="cursor:pointer">
      <circle cx="${p.x}" cy="${p.y}" r="9" fill="rgba(139,156,255,.12)" stroke="rgba(139,156,255,.5)" stroke-width="0.8">
        <animate attributeName="r" values="7;11;7" dur="2.6s" repeatCount="indefinite"/>
      </circle>
      <text x="${p.x}" y="${p.y+3.5}" text-anchor="middle" font-size="9">${p.ico}</text>
      <text x="${p.x}" y="${p.y+17}" text-anchor="middle" font-size="6" fill="#8b9cff" opacity="0.9">${p.name}</text>
    </g>`;}).join("");
  // hutan pinus (sekitar Thornvale)
  const pine=(x,y,s,c)=>`<g transform="translate(${x},${y}) scale(${s})">
    <polygon points="0,-9 5,2 -5,2" fill="${c}"/><polygon points="0,-4 6,7 -6,7" fill="${c}"/>
    <rect x="-1" y="7" width="2" height="3" fill="#3a2a18"/></g>`;
  const forest=[[38,140,1,"#2e5e2e"],[52,168,1.15,"#26522f"],[92,178,0.9,"#2e5e2e"],[34,185,1,"#1f4527"],
    [98,142,0.85,"#26522f"],[64,128,0.8,"#2e5e2e"],[110,165,1.05,"#1f4527"]].map(a=>pine(...a)).join("");
  // kunang-kunang hutan
  const fireflies=[[58,150,"0s"],[86,168,"0.9s"],[44,172,"1.7s"],[102,152,"2.4s"]].map(f=>
    `<circle cx="${f[0]}" cy="${f[1]}" r="1" fill="#d8f77f" opacity="0">
      <animate attributeName="opacity" values="0;0.9;0" dur="3s" begin="${f[2]}" repeatCount="indefinite"/>
      <animate attributeName="cy" values="${f[1]};${f[1]-4};${f[1]}" dur="3s" begin="${f[2]}" repeatCount="indefinite"/>
    </circle>`).join("");
  // pegunungan bersalju (sekitar Frostspire)
  const mounts=`
    <polygon points="192,52 210,18 228,52" fill="#4a5468"/><polygon points="205,30 210,18 216,30" fill="#e8eef7"/>
    <polygon points="220,58 242,20 264,58" fill="#3c4658"/><polygon points="236,32 242,20 249,32" fill="#e8eef7"/>
    <polygon points="252,54 268,28 285,54" fill="#4a5468"/><polygon points="263,36 268,28 274,36" fill="#e8eef7"/>`;
  const snow=[[214,34,"0s"],[240,28,"1.1s"],[262,40,"0.5s"],[228,46,"1.8s"],[252,32,"2.3s"]].map(s=>
    `<circle cx="${s[0]}" cy="${s[1]}" r="0.9" fill="#eef4ff" opacity="0.85">
      <animate attributeName="cy" values="${s[1]};${s[1]+26}" dur="4.5s" begin="${s[2]}" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.9;0" dur="4.5s" begin="${s[2]}" repeatCount="indefinite"/>
    </circle>`).join("");
  // laut & pesisir (kanan-bawah, Saltmoor)
  const sea=`
    <path d="M212,240 C220,214 250,208 275,214 C298,219 312,212 320,208 L320,240 Z" fill="#1c3a4d"/>
    <path d="M222,226 q10,-4 20,0 t20,0 t20,0" stroke="#3a7a9a" stroke-width="1" fill="none" opacity="0.7" stroke-dasharray="6 5">
      <animate attributeName="stroke-dashoffset" values="0;22" dur="3.4s" repeatCount="indefinite"/></path>
    <path d="M240,234 q10,-4 20,0 t20,0 t20,0" stroke="#2e6a88" stroke-width="1" fill="none" opacity="0.6" stroke-dasharray="5 6">
      <animate attributeName="stroke-dashoffset" values="22;0" dur="4.2s" repeatCount="indefinite"/></path>`;
  // kapal berlayar bolak-balik
  const ship=`<g transform="translate(300,219)">
    <g>
      <animateTransform attributeName="transform" type="translate" values="0,0;-66,4;0,0" dur="17s" repeatCount="indefinite"/>
      <path d="M-6,2 L6,2 L4,6 L-4,6 Z" fill="#6a4a28"/>
      <line x1="0" y1="2" x2="0" y2="-7" stroke="#4a3418" stroke-width="0.9"/>
      <path d="M0,-7 L5,-1.5 L0,-1.5 Z" fill="#e8dcc0">
        <animate attributeName="opacity" values="1;0.85;1" dur="2.2s" repeatCount="indefinite"/></path>
    </g></g>`;
  // ladang emas & asap ibukota (Aetheria)
  const fields=[[128,112],[136,118],[122,120],[143,111]].map(f=>
    `<path d="M${f[0]},${f[1]} q2,-3 4,0 M${f[0]+5},${f[1]} q2,-3 4,0" stroke="#b8962e" stroke-width="0.8" fill="none" opacity="0.7"/>`).join("");
  const smoke=[0,1,2].map(i=>
    `<circle cx="${168+i*2}" cy="72" r="${1.2+i*0.4}" fill="#c9b896" opacity="0">
      <animate attributeName="cy" values="74;58" dur="4s" begin="${i*1.3}s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.5;0" dur="4s" begin="${i*1.3}s" repeatCount="indefinite"/>
    </circle>`).join("");
  // awan & burung
  const clouds=`
    <g opacity="0.5"><ellipse cx="0" cy="26" rx="16" ry="5" fill="#4a4258"/><ellipse cx="12" cy="23" rx="10" ry="4" fill="#4a4258"/>
      <animateTransform attributeName="transform" type="translate" values="-40,0;360,0" dur="46s" repeatCount="indefinite"/></g>
    <g opacity="0.35"><ellipse cx="0" cy="150" rx="13" ry="4" fill="#4a4258"/>
      <animateTransform attributeName="transform" type="translate" values="360,0;-40,0" dur="62s" repeatCount="indefinite"/></g>`;
  const birds=`<g stroke="#c9b896" stroke-width="0.8" fill="none" opacity="0.7">
    <path d="M0,0 q2.5,-2.5 5,0 M5,0 q2.5,-2.5 5,0">
      <animateMotion dur="24s" repeatCount="indefinite" path="M40,44 C120,30 220,52 300,36 C220,52 120,30 40,44"/>
    </path></g>`;
  return `<svg viewBox="0 0 320 240" class="world-map" xmlns="http://www.w3.org/2000/svg">
    <defs>${grads}
      <radialGradient id="mapbg" cx="50%" cy="45%">
        <stop offset="0%" stop-color="#242033"/><stop offset="100%" stop-color="#141019"/>
      </radialGradient>
    </defs>
    <rect x="0" y="0" width="320" height="240" rx="14" fill="url(#mapbg)"/>
    ${sea}${ship}
    ${mounts}${snow}
    ${forest}${fireflies}
    ${fields}${smoke}
    ${clouds}${birds}
    <g opacity="0.9">${routes}</g>
    ${pois}
    ${CITIES.map(cityNode).join("")}
  </svg>`;
};

/* ==================================================================
   MANTARA — ILUSTRASI RUMAH & FASILITAS (SVG beranimasi)
   Scene rumah malam hari sesuai asal-usul (manor/pondok/menara/
   ruko/loteng) + vignette animasi kecil untuk tiap fasilitas.
   ================================================================== */
function _fsvg(inner){return `<svg width="34" height="34" viewBox="0 0 36 36" xmlns="http://www.w3.org/2000/svg" style="border-radius:8px;background:radial-gradient(circle at 40% 30%,#2a2140,#171022)">${inner}</svg>`;}
window.facSVG=function(id){
  const flame=(x,y,s)=>`<path d="M${x},${y} q${1.5*s},-${2*s} 0,-${4*s} q-${1.5*s},${2*s} 0,${4*s}" fill="#f0a840">
    <animate attributeName="opacity" values="1;0.6;1" dur="0.9s" repeatCount="indefinite"/></path>`;
  const steam=(x,y,b)=>`<circle cx="${x}" cy="${y}" r="1.6" fill="#cfd8e8" opacity="0">
    <animate attributeName="cy" values="${y};${y-9}" dur="2.6s" begin="${b}" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.7;0" dur="2.6s" begin="${b}" repeatCount="indefinite"/></circle>`;
  switch(id){
    case "bed":return _fsvg(`<rect x="6" y="20" width="24" height="7" rx="2" fill="#6a4a28"/><rect x="7" y="16" width="9" height="5" rx="2" fill="#e8dcc0"/><rect x="6" y="27" width="3" height="4" fill="#4a3418"/><rect x="27" y="27" width="3" height="4" fill="#4a3418"/>
      <text x="25" y="14" font-size="7" fill="#8b9cff">z<animate attributeName="y" values="14;8" dur="2.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="2.4s" repeatCount="indefinite"/></text>`);
    case "yard":return _fsvg(`<rect x="4" y="28" width="28" height="3" rx="1.5" fill="#3a4a2a"/><circle cx="18" cy="14" r="3.4" fill="#d8b088"/><rect x="15.5" y="17" width="5" height="8" rx="2" fill="#8b5a2b"/>
      <g><rect x="8" y="10" width="20" height="2.4" rx="1.2" fill="#888"/><circle cx="8" cy="11" r="3" fill="#555"/><circle cx="28" cy="11" r="3" fill="#555"/>
      <animateTransform attributeName="transform" type="translate" values="0,0;0,-5;0,0" dur="1.6s" repeatCount="indefinite"/></g>`);
    case "desk":return _fsvg(`<rect x="6" y="22" width="24" height="3" fill="#6a4a28"/><path d="M10,20 L18,17.5 L26,20 L18,22 Z" fill="#e8dcc0"/><line x1="18" y1="17.5" x2="18" y2="22" stroke="#b8a888" stroke-width="0.7"/>
      <rect x="26.4" y="13" width="1.8" height="6" fill="#e8dcc0"/>${flame(27.3,13,1)}`);
    case "range":return _fsvg(`<circle cx="24" cy="16" r="7.5" fill="#e8dcc0"/><circle cx="24" cy="16" r="5" fill="#b03030"/><circle cx="24" cy="16" r="2.4" fill="#f0c040"/>
      <g><line x1="2" y1="16" x2="14" y2="16" stroke="#8b9cff" stroke-width="1.6"/><animateTransform attributeName="transform" type="translate" values="0,0;8,0" dur="1.1s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.1s" repeatCount="indefinite"/></g>`);
    case "track":return _fsvg(`<rect x="3" y="26" width="30" height="2.4" rx="1" fill="#6a5230"/>
      <g><text x="10" y="24" font-size="13">🐎</text><animateTransform attributeName="transform" type="translate" values="0,0;0,-2.5;0,0" dur="0.5s" repeatCount="indefinite"/></g>
      <circle cx="7" cy="26" r="1.4" fill="#b8a070" opacity="0.6"><animate attributeName="cx" values="7;2" dur="0.9s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.6;0" dur="0.9s" repeatCount="indefinite"/></circle>`);
    case "jacuzzi":return _fsvg(`<ellipse cx="18" cy="24" rx="12" ry="5.5" fill="#3a8fb0"/><path d="M6,24 a12,5.5 0 0 0 24,0 l0,4 a12,5.5 0 0 1 -24,0 Z" fill="#6a4a28"/>${steam(12,19,"0s")}${steam(18,18,"0.9s")}${steam(24,19,"1.7s")}`);
    case "pool":return _fsvg(`<rect x="5" y="16" width="26" height="12" rx="4" fill="#2a6f96"/>
      <path d="M8,20 q3,-2 6,0 t6,0 t6,0" stroke="#7fd0ea" stroke-width="1.1" fill="none" stroke-dasharray="4 3"><animate attributeName="stroke-dashoffset" values="0;14" dur="2s" repeatCount="indefinite"/></path>
      <path d="M8,24 q3,-2 6,0 t6,0 t6,0" stroke="#5ab0d0" stroke-width="1" fill="none" stroke-dasharray="3 4"><animate attributeName="stroke-dashoffset" values="14;0" dur="2.6s" repeatCount="indefinite"/></path>`);
    case "forge":return _fsvg(`<rect x="6" y="22" width="12" height="7" rx="1" fill="#444"/><path d="M20,24 h9 l-2,5 h-5 Z" fill="#333"/>
      <circle cx="12" cy="20" r="4" fill="#f07030"><animate attributeName="r" values="3.4;4.6;3.4" dur="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;1;0.8" dur="1.2s" repeatCount="indefinite"/></circle>
      <circle cx="24" cy="18" r="0.9" fill="#ffd070"><animate attributeName="cy" values="20;12" dur="1.4s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="1.4s" repeatCount="indefinite"/></circle>`);
    case "swordhall":return _fsvg(`<g transform="rotate(-24 18 18)"><rect x="17" y="6" width="2.4" height="17" rx="1" fill="#cfd8e8"/><rect x="14" y="21" width="8.4" height="2.2" rx="1" fill="#b8860b"/></g>
      <g transform="rotate(24 18 18)"><rect x="17" y="6" width="2.4" height="17" rx="1" fill="#cfd8e8"/><rect x="14" y="21" width="8.4" height="2.2" rx="1" fill="#b8860b"/>
      <animateTransform attributeName="transform" type="rotate" values="24 18 18;30 18 18;24 18 18" dur="1.4s" repeatCount="indefinite"/></g>
      <text x="16" y="14" font-size="6" fill="#ffe08a" opacity="0"><animate attributeName="opacity" values="0;1;0" dur="1.4s" repeatCount="indefinite"/>✦</text>`);
    case "library":return _fsvg(`<rect x="6" y="8" width="24" height="20" rx="2" fill="#4a3418"/>
      ${[9,14,19,24].map(x=>`<rect x="${x}" y="10" width="3" height="7" fill="${["#8b3a3a","#3a5e8c","#6a8a3a","#b8860b"][((x-9)/5)|0]}"/>`).join("")}
      <rect x="8" y="19" width="20" height="1.4" fill="#2a1e10"/><rect x="26" y="21" width="1.6" height="5" fill="#e8dcc0"/>${flame(26.8,21,0.9)}`);
    case "herb":return _fsvg(`<rect x="4" y="27" width="28" height="4" rx="2" fill="#3a2a18"/>
      ${[8,15,22,28].map((x,i)=>`<path d="M${x},27 q-2,-6 0,-9 q2,3 0,9" fill="#4a8c4a" transform="rotate(${i%2?6:-6} ${x} 27)"/>`).join("")}
      <g><text x="10" y="14" font-size="6">🦋</text><animateMotion dur="5s" repeatCount="indefinite" path="M0,0 q6,-4 12,0 q-6,4 -12,0"/></g>`);
    case "altar":return _fsvg(`<path d="M12,28 h12 l-2,-4 h-8 Z" fill="#4a3c6e"/><path d="M18,10 l4,7 -4,5 -4,-5 Z" fill="#8b9cff">
      <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite"/></path>
      <circle cx="18" cy="16" r="8" fill="none" stroke="#8b9cff" stroke-width="0.6" opacity="0.5"><animate attributeName="r" values="7;10" dur="2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.5;0" dur="2s" repeatCount="indefinite"/></circle>`);
    case "music":return _fsvg(`<text x="8" y="26" font-size="14">🎻</text>
      <text x="24" y="18" font-size="8" fill="#ffe08a">♪<animate attributeName="y" values="20;9" dur="2.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="2.2s" repeatCount="indefinite"/></text>
      <text x="28" y="22" font-size="6" fill="#8b9cff">♫<animate attributeName="y" values="24;12" dur="2.8s" begin="0.8s" repeatCount="indefinite"/><animate attributeName="opacity" values="1;0" dur="2.8s" begin="0.8s" repeatCount="indefinite"/></text>`);
    case "pigeon":return _fsvg(`<rect x="13" y="10" width="10" height="18" fill="#8a7a5a"/><path d="M11,10 h14 l-7,-6 Z" fill="#6a4a28"/><rect x="16" y="14" width="4" height="4" rx="2" fill="#2a2140"/>
      <g stroke="#e8dcc0" stroke-width="1" fill="none"><path d="M0,0 q2,-2 4,0 q2,2 4,0"/><animateMotion dur="4.5s" repeatCount="indefinite" path="M6,8 q10,-6 22,2 q-12,-2 -22,-2"/></g>`);
    case "games":return _fsvg(`<g transform="rotate(-8 14 20)"><rect x="9" y="15" width="10" height="10" rx="2.5" fill="#e8dcc0"/><circle cx="12" cy="18" r="1.1" fill="#222"/><circle cx="16" cy="22" r="1.1" fill="#222"/><circle cx="14" cy="20" r="1.1" fill="#222"/>
      <animateTransform attributeName="transform" type="rotate" values="-8 14 20;4 14 20;-8 14 20" dur="2.2s" repeatCount="indefinite"/></g>
      <rect x="21" y="13" width="8" height="12" rx="1.5" fill="#8b2635"/><text x="23" y="21" font-size="6" fill="#ffe08a">♛</text>`);
    case "secret":return _fsvg(`<rect x="0" y="0" width="36" height="36" fill="#0e0a16"/><rect x="15" y="18" width="6" height="9" rx="1" fill="#e8dcc0"/>${flame(18,18,1.4)}
      <circle cx="18" cy="20" r="10" fill="#f0a840" opacity="0.12"><animate attributeName="opacity" values="0.08;0.2;0.08" dur="0.9s" repeatCount="indefinite"/></circle>
      <text x="26" y="12" font-size="6" fill="#ffe08a" opacity="0.5">✦<animate attributeName="opacity" values="0.2;0.9;0.2" dur="2.4s" repeatCount="indefinite"/></text>`);
    case "dragon":return _fsvg(`<path d="M18,6 q7,4 6,13 q-1,7 -6,9 q-5,-2 -6,-9 q-1,-9 6,-13 Z" fill="#4a5468"/><path d="M18,10 q4,3 3,9 h-6 q-1,-6 3,-9 Z" fill="#3c4658"/>
      <circle cx="15.5" cy="17" r="1" fill="#ff4040"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.4s" repeatCount="indefinite"/></circle>
      <circle cx="20.5" cy="17" r="1" fill="#ff4040"><animate attributeName="opacity" values="0.2;1;0.2" dur="2.4s" repeatCount="indefinite"/></circle>`);
  }
  return null;
};
/* ---------- SCENE RUMAH (header halaman Rumah) ---------- */
window.homeHeroSVG=function(){
  const o=C.origin||"peasant";
  const stars=[[30,16,"0s"],[80,10,"1s"],[250,14,"0.5s"],[290,22,"1.6s"],[190,8,"2.2s"]].map(s=>
    `<circle cx="${s[0]}" cy="${s[1]}" r="1" fill="#e8dcc0"><animate attributeName="opacity" values="0.2;1;0.2" dur="3s" begin="${s[2]}" repeatCount="indefinite"/></circle>`).join("");
  const smoke=(x,y)=>[0,1,2].map(i=>`<circle cx="${x+i*2}" cy="${y}" r="${1.5+i*0.5}" fill="#c9b896" opacity="0">
    <animate attributeName="cy" values="${y};${y-16}" dur="4s" begin="${i*1.3}s" repeatCount="indefinite"/>
    <animate attributeName="opacity" values="0.5;0" dur="4s" begin="${i*1.3}s" repeatCount="indefinite"/></circle>`).join("");
  const win=(x,y,w2,h2)=>`<rect x="${x}" y="${y}" width="${w2}" height="${h2}" rx="1" fill="#f0c040">
    <animate attributeName="opacity" values="0.9;0.5;0.9" dur="${(2+Math.random()*2).toFixed(1)}s" repeatCount="indefinite"/></rect>`;
  const firefly=(x,y,b)=>`<circle cx="${x}" cy="${y}" r="1" fill="#d8f77f" opacity="0">
    <animate attributeName="opacity" values="0;0.9;0" dur="3.2s" begin="${b}" repeatCount="indefinite"/>
    <animate attributeName="cy" values="${y};${y-5};${y}" dur="3.2s" begin="${b}" repeatCount="indefinite"/></circle>`;
  let house="";
  if(o==="noble"){
    house=`<rect x="100" y="52" width="120" height="42" rx="2" fill="#4a3c50"/>
      <rect x="88" y="42" width="22" height="52" fill="#3c3044"/><polygon points="88,42 99,26 110,42" fill="#8b2635"/>
      <rect x="210" y="42" width="22" height="52" fill="#3c3044"/><polygon points="210,42 221,26 232,42" fill="#8b2635"/>
      <polygon points="98,52 160,32 222,52" fill="#5a2a35"/>
      ${win(120,62,9,12)}${win(140,62,9,12)}${win(170,62,9,12)}${win(190,62,9,12)}
      <rect x="153" y="72" width="14" height="22" rx="6" fill="#2a1e26"/>
      <g><polygon points="99,26 99,18 112,21 99,24" fill="#f0c040"><animateTransform attributeName="transform" type="skewY" values="0;4;0" dur="1.6s" repeatCount="indefinite"/></polygon></g>
      ${smoke(214,40)}`;
  }else if(o==="mageborn"){
    house=`<rect x="146" y="30" width="28" height="64" rx="3" fill="#3c3450"/>
      <polygon points="142,30 160,10 178,30" fill="#4a3c6e"/>
      ${win(154,44,7,9)}${win(154,62,7,9)}
      <circle cx="160" cy="8" r="4" fill="#8b9cff"><animate attributeName="opacity" values="0.5;1;0.5" dur="2s" repeatCount="indefinite"/><animate attributeName="r" values="3.4;4.6;3.4" dur="2s" repeatCount="indefinite"/></circle>
      <text x="132" y="50" font-size="7" fill="#8b9cff" opacity="0.7">✦<animate attributeName="y" values="52;38" dur="4s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0" dur="4s" repeatCount="indefinite"/></text>
      <text x="184" y="60" font-size="6" fill="#8b9cff" opacity="0.7">⟡<animate attributeName="y" values="62;46" dur="5s" begin="1.2s" repeatCount="indefinite"/><animate attributeName="opacity" values="0.8;0" dur="5s" begin="1.2s" repeatCount="indefinite"/></text>`;
  }else if(o==="merchant_kid"){
    house=`<rect x="112" y="50" width="96" height="44" rx="2" fill="#5a4632"/>
      <polygon points="106,50 160,34 214,50" fill="#3c2e1e"/>
      ${[0,1,2,3,4].map(i=>`<path d="M${118+i*17},58 h15 l-2.5,8 h-10 Z" fill="${i%2?"#8b2635":"#e8dcc0"}"/>`).join("")}
      ${win(122,74,10,12)}${win(150,74,10,12)}<rect x="178,74" y="74" width="0" height="0"/>
      <rect x="176" y="72" width="13" height="22" rx="5" fill="#2a2018"/>
      <g><rect x="196" y="56" width="12" height="9" rx="1" fill="#b8860b"/><text x="198.5" y="63" font-size="6" fill="#2a1e10">⚖</text>
      <animateTransform attributeName="transform" type="rotate" values="-4 202 56;4 202 56;-4 202 56" dur="2.6s" repeatCount="indefinite"/></g>
      <rect x="94" y="82" width="12" height="12" fill="#6a4a28"/><rect x="97" y="72" width="12" height="10" fill="#7a5a34"/>
      ${smoke(126,48)}`;
  }else if(o==="orphan"){
    house=`<rect x="118" y="58" width="84" height="36" rx="2" fill="#4a3c30"/>
      <polygon points="112,58 160,40 208,58" fill="#3a2c20"/>
      <path d="M138,47 h18 l-2,7 h-14 Z" fill="#5a4632"/>
      ${win(150,46,8,8)}
      <rect x="128,70" y="70" width="0" height="0"/><rect x="128" y="70" width="9" height="10" rx="1" fill="#2a2018"/><rect x="168" y="70" width="9" height="10" rx="1" fill="#2a2018"/>
      <g><circle cx="206" cy="66" r="2.6" fill="#f0c040"><animate attributeName="opacity" values="0.9;0.5;0.9" dur="1.3s" repeatCount="indefinite"/></circle><line x1="206" y1="58" x2="206" y2="63" stroke="#6a5a48" stroke-width="1"/>
      <animateTransform attributeName="transform" type="rotate" values="-6 206 58;6 206 58;-6 206 58" dur="2.2s" repeatCount="indefinite"/></g>`;
  }else{ // peasant
    house=`<rect x="126" y="58" width="68" height="36" rx="2" fill="#6a5238"/>
      <polygon points="118,58 160,34 202,58" fill="#8a7444"/>
      <path d="M120,56 q40,-8 80,0" stroke="#9a8450" stroke-width="3" fill="none"/>
      ${win(138,68,9,10)}<rect x="164" y="70" width="12" height="24" rx="5" fill="#3a2c1c"/>
      <ellipse cx="222" cy="88" rx="14" ry="8" fill="#8a7444"/><ellipse cx="222" cy="82" rx="9" ry="6" fill="#9a8450"/>
      ${[104,110,116].map(x=>`<line x1="${x}" y1="80" x2="${x}" y2="94" stroke="#5a4632" stroke-width="2"/>`).join("")}
      <line x1="100" y1="84" x2="120" y2="84" stroke="#5a4632" stroke-width="1.6"/>
      ${smoke(182,56)}`;
  }
  return `<svg viewBox="0 0 320 110" style="display:block;width:100%;height:auto;border-radius:14px;border:1px solid var(--line2)" xmlns="http://www.w3.org/2000/svg">
    <defs><radialGradient id="homesky" cx="50%" cy="0%"><stop offset="0%" stop-color="#2e2748"/><stop offset="100%" stop-color="#151020"/></radialGradient></defs>
    <rect width="320" height="110" rx="13" fill="url(#homesky)"/>
    <circle cx="272" cy="20" r="9" fill="#e8e0c8" opacity="0.9"/><circle cx="268" cy="17" r="8" fill="#1f1a30"/>
    ${stars}
    <rect x="0" y="92" width="320" height="18" fill="#232c1c"/>
    ${house}
    ${firefly(60,86,"0s")}${firefly(250,84,"1.4s")}${firefly(30,80,"2.3s")}
  </svg>`;
};
