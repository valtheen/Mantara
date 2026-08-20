// ============================================================
//  TAKDIR — PETA DUNIA VISUAL (SVG + animasi kecil)
// ============================================================

// koordinat kota di kanvas peta (viewBox 0 0 320 240)
const CITY_POS={
  aetheria:{x:160,y:90},    // tengah-atas (ibukota)
  thornvale:{x:70,y:150},   // kiri-bawah (hutan)
  saltmoor:{x:250,y:175},   // kanan-bawah (pelabuhan)
  frostspire:{x:230,y:55},  // kanan-atas (beku)
};

// warna aksen tema tiap kota
const CITY_THEME={
  aetheria:{c1:"#d4af37",c2:"#9a6f08",glow:"#ffe08a"},
  thornvale:{c1:"#4a8c4a",c2:"#2e5e2e",glow:"#7fd97f"},
  saltmoor:{c1:"#3a8fb0",c2:"#1e5e78",glow:"#6ecadf"},
  frostspire:{c1:"#7aa6d6",c2:"#3a5e8c",glow:"#bfe0ff"},
};

// jalur antar kota yg digambar (pasangan)
const MAP_ROUTES=[
  ["aetheria","thornvale"],["aetheria","saltmoor"],
  ["aetheria","frostspire"],["thornvale","saltmoor"],
  ["saltmoor","frostspire"],
];

// animasi tema per kota -> elemen SVG kecil yg beranimasi di sekitar titik
function cityDecor(id,pos){
  const t=CITY_THEME[id];
  if(id==="aetheria"){ // kilau bintang ibukota
    return `<g>
      ${[0,1,2].map(i=>`<circle cx="${pos.x+(i-1)*9}" cy="${pos.y-16-i*2}" r="1.4" fill="${t.glow}">
        <animate attributeName="opacity" values="0.2;1;0.2" dur="${1.5+i*0.4}s" repeatCount="indefinite" begin="${i*0.3}s"/>
      </circle>`).join("")}
    </g>`;
  }
  if(id==="thornvale"){ // daun bergoyang
    return `<g>
      ${[0,1].map(i=>`<path d="M${pos.x-8+i*16},${pos.y-14} q3,-5 6,0 q-3,3 -6,0Z" fill="${t.c1}" opacity="0.8">
        <animateTransform attributeName="transform" type="rotate" values="-8 ${pos.x-5+i*16} ${pos.y-14};8 ${pos.x-5+i*16} ${pos.y-14};-8 ${pos.x-5+i*16} ${pos.y-14}" dur="${2+i*0.5}s" repeatCount="indefinite"/>
      </path>`).join("")}
    </g>`;
  }
  if(id==="saltmoor"){ // ombak naik turun
    return `<g>
      ${[0,1,2].map(i=>`<path d="M${pos.x-12+i*8},${pos.y+15} q4,-3 8,0" stroke="${t.glow}" stroke-width="1.3" fill="none" opacity="0.7">
        <animateTransform attributeName="transform" type="translate" values="0 0;0 2.5;0 0" dur="${1.4+i*0.3}s" repeatCount="indefinite" begin="${i*0.2}s"/>
      </path>`).join("")}
    </g>`;
  }
  if(id==="frostspire"){ // salju turun
    return `<g>
      ${[0,1,2,3].map(i=>`<circle cx="${pos.x-10+i*7}" cy="${pos.y-16}" r="1.2" fill="${t.glow}">
        <animate attributeName="cy" values="${pos.y-16};${pos.y+6}" dur="${2+i*0.4}s" repeatCount="indefinite" begin="${i*0.5}s"/>
        <animate attributeName="opacity" values="1;0" dur="${2+i*0.4}s" repeatCount="indefinite" begin="${i*0.5}s"/>
      </circle>`).join("")}
    </g>`;
  }
  return "";
}

// gambar 1 kota di peta
function cityNode(c){
  const pos=CITY_POS[c.id];const t=CITY_THEME[c.id];
  const here=c.id===C.cityId;
  const r=here?15:12;
  // marker pemain berdenyut kalau di sini
  const playerPulse=here?`
    <circle cx="${pos.x}" cy="${pos.y}" r="${r+4}" fill="none" stroke="${t.glow}" stroke-width="1.5" opacity="0.8">
      <animate attributeName="r" values="${r+2};${r+12}" dur="1.8s" repeatCount="indefinite"/>
      <animate attributeName="opacity" values="0.7;0" dur="1.8s" repeatCount="indefinite"/>
    </circle>`:"";
  return `<g class="map-city" onclick="${here?'viewCity()':`travelTo('${c.id}')`}" style="cursor:pointer">
    ${playerPulse}
    <circle cx="${pos.x}" cy="${pos.y}" r="${r}" fill="url(#grad_${c.id})" stroke="${here?t.glow:'#2a2018'}" stroke-width="${here?2.2:1.4}"/>
    <text x="${pos.x}" y="${pos.y+5}" text-anchor="middle" font-size="${here?15:13}">${c._emoji||c.ico}</text>
    ${cityDecor(c.id,pos)}
    <text x="${pos.x}" y="${pos.y+r+12}" text-anchor="middle" font-size="9" fill="${here?t.glow:'#c9b896'}" font-weight="${here?'700':'500'}" style="letter-spacing:.03em">${c.name}</text>
    ${here?`<text x="${pos.x}" y="${pos.y-r-6}" text-anchor="middle" font-size="7.5" fill="${t.glow}" style="letter-spacing:.08em">◆ KAMU DI SINI ◆</text>`:`<text x="${pos.x}" y="${pos.y-r-5}" text-anchor="middle" font-size="7" fill="#8a7a5a">${CITY_DISTANCE[C.cityId][c.id]}⚡</text>`}
  </g>`;
}

// SVG peta lengkap
function worldMapSVG(){
  // gradien per kota
  const grads=Object.keys(CITY_THEME).map(id=>{
    const t=CITY_THEME[id];
    return `<radialGradient id="grad_${id}" cx="40%" cy="35%">
      <stop offset="0%" stop-color="${t.c1}"/><stop offset="100%" stop-color="${t.c2}"/>
    </radialGradient>`;
  }).join("");

  // jalur antar kota
  const routes=MAP_ROUTES.map(([a,b])=>{
    const pa=CITY_POS[a],pb=CITY_POS[b];
    const onPath=(a===C.cityId||b===C.cityId);
    return `<line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}"
      stroke="${onPath?'#b8860b':'#3a2e1e'}" stroke-width="${onPath?1.6:1}"
      stroke-dasharray="4 3" opacity="${onPath?0.7:0.4}">
      ${onPath?`<animate attributeName="stroke-dashoffset" values="14;0" dur="1.2s" repeatCount="indefinite"/>`:''}
    </line>`;
  }).join("");

  return `<svg viewBox="0 0 320 240" class="world-map" xmlns="http://www.w3.org/2000/svg">
    <defs>${grads}
      <radialGradient id="mapbg" cx="50%" cy="45%">
        <stop offset="0%" stop-color="#2a2030"/><stop offset="100%" stop-color="#171019"/>
      </radialGradient>
      <filter id="soft"><feGaussianBlur stdDeviation="0.4"/></filter>
    </defs>
    <rect x="0" y="0" width="320" height="240" rx="14" fill="url(#mapbg)"/>
    <!-- hiasan daratan samar -->
    <path d="M20,200 Q80,160 140,190 T300,180" stroke="#2e2418" stroke-width="1" fill="none" opacity="0.5"/>
    <path d="M30,60 Q120,30 200,55 T300,40" stroke="#2e2418" stroke-width="1" fill="none" opacity="0.4"/>
    <g opacity="0.9">${routes}</g>
    ${CITIES.map(cityNode).join("")}
  </svg>`;
}


// ============================================================
//  ANIMASI PERJALANAN — traveler menyusuri jalur antar kota
// ============================================================
function playTravelAnim(fromId,toId,onArrive){
  const layer=document.getElementById("animLayer");
  if(!layer){onArrive&&onArrive();return;}
  const pa=CITY_POS[fromId],pb=CITY_POS[toId];
  if(!pa||!pb){onArrive&&onArrive();return;}
  const from=cityOf(fromId),to=cityOf(toId);
  const goingLeft=pb.x<pa.x;
  const dur=1.3;
  layer.innerHTML=`
    <div class="travel-box">
      <div class="travel-cap">Perjalanan ke ${to.name}…</div>
      <svg viewBox="0 0 320 240" class="travel-map" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="tgrad_from" cx="40%" cy="35%"><stop offset="0%" stop-color="${CITY_THEME[fromId].c1}"/><stop offset="100%" stop-color="${CITY_THEME[fromId].c2}"/></radialGradient>
          <radialGradient id="tgrad_to" cx="40%" cy="35%"><stop offset="0%" stop-color="${CITY_THEME[toId].c1}"/><stop offset="100%" stop-color="${CITY_THEME[toId].c2}"/></radialGradient>
          <radialGradient id="tmapbg" cx="50%" cy="45%"><stop offset="0%" stop-color="#2a2030"/><stop offset="100%" stop-color="#171019"/></radialGradient>
        </defs>
        <rect x="0" y="0" width="320" height="240" rx="14" fill="url(#tmapbg)"/>
        <line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" stroke="#3a2e1e" stroke-width="2" stroke-dasharray="4 3"/>
        <line x1="${pa.x}" y1="${pa.y}" x2="${pb.x}" y2="${pb.y}" stroke="${CITY_THEME[toId].glow}" stroke-width="2" stroke-dasharray="4 3" opacity="0.8">
          <animate attributeName="stroke-dashoffset" values="14;0" dur="0.8s" repeatCount="indefinite"/>
        </line>
        <circle cx="${pa.x}" cy="${pa.y}" r="12" fill="url(#tgrad_from)" stroke="#2a2018" stroke-width="1.4"/>
        <text x="${pa.x}" y="${pa.y+5}" text-anchor="middle" font-size="13">${from._emoji||from.ico}</text>
        <text x="${pa.x}" y="${pa.y+24}" text-anchor="middle" font-size="8.5" fill="#c9b896">${from.name}</text>
        <circle cx="${pb.x}" cy="${pb.y}" r="13" fill="url(#tgrad_to)" stroke="${CITY_THEME[toId].glow}" stroke-width="2"/>
        <text x="${pb.x}" y="${pb.y+5}" text-anchor="middle" font-size="14">${to._emoji||to.ico}</text>
        <text x="${pb.x}" y="${pb.y+25}" text-anchor="middle" font-size="9" fill="${CITY_THEME[toId].glow}" font-weight="700">${to.name}</text>
        <g>
          <text text-anchor="middle" font-size="18" transform="scale(${goingLeft?-1:1},1)">
            <animateMotion path="M${goingLeft?-pa.x:pa.x},${pa.y-4} L${goingLeft?-pb.x:pb.x},${pb.y-4}" dur="${dur}s" fill="freeze"/>
            🚶
          </text>
          <circle r="2" fill="#8a7a5a" opacity="0.5">
            <animateMotion path="M${pa.x},${pa.y+2} L${pb.x},${pb.y+2}" dur="${dur}s" fill="freeze"/>
            <animate attributeName="opacity" values="0.5;0.1;0.5" dur="0.4s" repeatCount="indefinite"/>
          </circle>
        </g>
      </svg>
    </div>`;
  layer.classList.add("show");
  clearTimeout(layer._tm);
  layer._tm=setTimeout(()=>{
    layer.classList.remove("show");layer.innerHTML="";
    onArrive&&onArrive();
  },dur*1000+250);
}


// ---------- bungkus doTravel: mainkan animasi perjalanan dulu ----------
if(typeof doTravel==="function"){
  const _wm_prevDoTravel=doTravel;
  doTravel=function(cityId,cost,withFamily){
    const fromId=C.cityId;
    // tutup popup konfirmasi dulu agar animasi tampil bersih
    closeModal();
    // animasi jalan dari kota asal -> tujuan, lalu eksekusi perpindahan asli
    playTravelAnim(fromId,cityId,()=>{
      _wm_prevDoTravel(cityId,cost,withFamily);
    });
  };
}