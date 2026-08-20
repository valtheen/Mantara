// ============================================================
//  TAKDIR — PRODUCTION SILENCER + GLOBAL ERROR GUARD (paling awal)
// ============================================================
(function(){
  // Capacitor iOS menggambar WebView sampai ke bawah Dynamic Island. Tandai
  // dokumen agar CSS dapat memberi fallback safe-area pada perangkat nyata.
  try{
    if(window.Capacitor&&typeof window.Capacitor.getPlatform==="function"&&window.Capacitor.getPlatform()==="ios"){
      document.documentElement.classList.add("native-ios");
    }
  }catch(e){}

  // simpan log asli, senyapkan log produksi (sisakan error utk diagnosa)
  try{window._origConsoleLog=console.log;console.log=function(){};}catch(e){}

  // GLOBAL ERROR GUARD: cegah satu error kecil membuat layar putih.
  // Simpan error ke buffer agar bisa diperiksa, tapi jangan crash UI.
  try{
    window._takdirErrors=[];
    // handler klasik (paling universal, termasuk Safari lama)
    window.onerror=function(msg,src,line,col,err){
      try{window._takdirErrors.push({msg:String(msg),src:src||"",line:line||0,col:col||0,
        stack:err&&err.stack?String(err.stack).slice(0,300):""});}catch(e){}
      return true; // cegah "Uncaught" muncul & cegah crash
    };
    window.addEventListener("error",function(ev){
      try{
        window._takdirErrors.push({
          msg:ev.message||"(no message)",
          src:ev.filename||"",
          line:ev.lineno||0,col:ev.colno||0,
          stack:ev.error&&ev.error.stack?String(ev.error.stack).slice(0,300):"",
        });
      }catch(e){}
      return true;
    },true);
    window.addEventListener("unhandledrejection",function(ev){
      try{window._takdirErrors.push({msg:"promise: "+(ev.reason&&ev.reason.message||ev.reason||"?")});}catch(e){}
      ev.preventDefault&&ev.preventDefault();
    });
  }catch(e){}
})();

// utilitas debug: ketik takdirDebug() di console untuk lihat error tertangkap
function takdirDebug(){
  try{
    const errs=window._takdirErrors||[];
    if(window._origConsoleLog){
      window._origConsoleLog("=== TAKDIR captured errors ("+errs.length+") ===");
      errs.forEach((e,i)=>window._origConsoleLog((i+1)+".",e.msg,e.src?("@ "+e.src+":"+e.line):"",e.stack||""));
    }
    return errs;
  }catch(e){return [];}
}
const MANTARA_ASSETS={
  "skill_sorcery":"assets/icons/skill_sorcery.png",
  "skill_medicine":"assets/icons/skill_medicine.png",
  "skill_diplomacy":"assets/icons/skill_diplomacy.png",
  "skill_alchemy":"assets/icons/skill_alchemy.png",
  "skill_swordsmanship":"assets/icons/skill_swordsmanship.png",
  "gear_tome":"assets/icons/gear_tome.png",
  "gear_weapon":"assets/icons/gear_weapon.png",
  "gear_mount":"assets/icons/gear_mount.png",
  "biz_caravan":"assets/icons/biz_caravan.png",
  "biz_tavern":"assets/icons/biz_tavern.png",
  "biz_shop":"assets/icons/biz_shop.png",
  "biz_farm":"assets/icons/biz_farm.png",
  "biz_cattle":"assets/icons/biz_cattle.png",
  "wardrobe_head":"assets/icons/wardrobe_head.png",
  "wardrobe_feet":"assets/icons/wardrobe_feet.png",
  "wardrobe_legs":"assets/icons/wardrobe_legs.png",
  "wardrobe_body":"assets/icons/wardrobe_body.png",
  "icon_aksi":"assets/icons/icon_aksi.png",
  "tab_aksi":"assets/icons/tab_aksi.png",
  "origin_noble":"assets/icons/origin_noble.png",
  "origin_mage":"assets/icons/origin_mage.png",
  "city_saltmoor":"assets/icons/city_saltmoor.png",
  "stat_health":"assets/icons/stat_health.png",
  "origin_merchant":"assets/icons/origin_merchant.png",
  "stat_happy":"assets/icons/stat_happy.png",
  "origin_peasant":"assets/icons/origin_peasant.png",
  "city_aetheria":"assets/icons/city_aetheria.png",
  "logo":"assets/icons/mantara-sigil.svg",
  "tab_relasi":"assets/icons/tab_relasi.png",
  "stat_might":"assets/icons/stat_might.png",
  "tab_peta":"assets/icons/tab_peta.png",
  "origin_orphan":"assets/icons/origin_orphan.png",
  "city_frostspire":"assets/icons/city_frostspire.png",
  "city_thornvale":"assets/icons/city_thornvale.png",
};

// Path ikon file: absolut dari root saat di-serve (npm start), relatif saat file://
(function normalizeAssetPaths(){
  const isFile=location.protocol==="file:";
  Object.keys(MANTARA_ASSETS).forEach(k=>{
    const v=MANTARA_ASSETS[k];
    if(typeof v!=="string"||v.startsWith("data:")||v.startsWith("http")||v.startsWith("/"))return;
    MANTARA_ASSETS[k]=isFile?v:("/"+v.replace(/^\.\//,""));
  });
})();
function resolveAsset(src){
  if(!src||src.startsWith("data:")||src.startsWith("http")||src.startsWith("/"))return src;
  return location.protocol==="file:"?src:("/"+src.replace(/^\.\//,""));
}

function imgIcon(name, fallbackEmoji, sizePx){
  const src=MANTARA_ASSETS[name];
  if(!src)return fallbackEmoji||"";
  const s=sizePx||"1em";
  return `<img src="${resolveAsset(src)}" class="m-ico" loading="lazy" decoding="async" style="width:${s};height:${s};vertical-align:middle;object-fit:contain" alt="">`;
}
function setModalIco(el,ico){
  if(!el)return;
  if(ico&&String(ico).includes("<img"))el.innerHTML=ico;
  else el.textContent=ico||"❓";
}// ============================================================
//  TAKDIR v3 — Engine (bagian 1: inti + lokasi + perjumpaan)
// ============================================================
const rand=a=>a[Math.floor(Math.random()*a.length)];
const ri=(min,max)=>Math.floor(Math.random()*(max-min+1))+min;
const clamp=v=>Math.max(0,Math.min(100,v));
const chance=p=>Math.random()<p;

const STAT_META={
  health:{name:"Nyawa",cls:"f-health"}, happy:{name:"Bahagia",cls:"f-happy"},
  might:{name:"Kekuatan",cls:"f-might"}, mind:{name:"Akal",cls:"f-mind"},
  mana:{name:"Mana",cls:"f-mana"}, charm:{name:"Pesona",cls:"f-charm"},
};
const STAT_ORDER=["health","happy","might","mind","mana","charm"];

const ORIGINS=[
  {id:"peasant",ico:"🌾",name:"Anak Petani",desc:"Lahir miskin di desa terpencil. Jalan panjang menuju kejayaan.",
    title:"Bocah Desa",coin:20,stats:{health:80,happy:60,might:40,mind:40,mana:15,charm:45}},
  {id:"noble",ico:"👑",name:"Bangsawan Muda",desc:"Lahir di istana. Harta melimpah, tapi intrik mengintai.",
    title:"Ningrat Cilik",coin:600,stats:{health:70,happy:70,might:35,mind:55,mana:20,charm:65}},
  {id:"mageborn",ico:"🔮",name:"Keturunan Penyihir",desc:"Darah arcane mengalir. Mana tinggi, tapi diburu Inkuisisi.",
    title:"Tunas Arcane",coin:100,stats:{health:60,happy:55,might:25,mind:70,mana:75,charm:40},mage:true},
  {id:"orphan",ico:"🗡️",name:"Yatim Jalanan",desc:"Tumbuh keras di lorong kota. Licik dan tangguh sejak kecil.",
    title:"Gelandangan",coin:5,stats:{health:75,happy:45,might:55,mind:50,mana:10,charm:50}},
  {id:"merchant_kid",ico:"⚖️",name:"Anak Saudagar",desc:"Tumbuh di antara timbangan & koin. Berbakat dagang sejak dini.",
    title:"Bocah Pasar",coin:300,stats:{health:70,happy:65,might:30,mind:60,mana:15,charm:60}},
];

const FIRST_M=["Aldric","Garran","Roderic","Tobias","Cael","Bram","Edric","Ulric","Doran","Wystan","Kaelen","Sorin","Fenwick","Albon","Theron"];
const FIRST_F=["Elara","Mirae","Seraphine","Rowena","Isolde","Brenna","Lyra","Maeve","Cassia","Wren","Nyssa","Thalia","Ondine","Verena","Sable"];
const SURNAME=["Blackwood","Thornfield","Greymoor","Ravenhall","Ashford","Stormwind","Holloway","Duskbane","Eldridge","Vexley","Frostmere","Emberlyn","Wyndhollow","Marsh","Quill"];
const randName=f=>rand(f?FIRST_F:FIRST_M)+" "+rand(SURNAME);

let C, currentTab="Hidup", pendingChoice=null;

function newChar(originId){
  const o=ORIGINS.find(x=>x.id===originId);
  const female=chance(0.5);
  return {
    name:randName(female), female, age:0, origin:o.id, title:o.title,
    stats:{...o.stats}, coin:o.coin, alive:true, isMage:!!o.mage,
    reputation:0, location:"desa",
    career:null, careerLevel:0, careerYears:0,
    relations:[], assets:[], skills:[], businesses:[], missions:[],
    flags:{}, married:false, _log:[], pendingDot:false,
    actionsLeft:2, // jatah aksi manual per tahun (selain age up)
  };
}

// ---------- RELATIONS ----------
function makeRel(role,opts={}){
  const female=opts.female!==undefined?opts.female:chance(0.5);
  return {
    id:"r"+Math.random().toString(36).slice(2,8),
    name:opts.name||randName(female), female, role,
    bond:opts.bond!==undefined?opts.bond:ri(35,55),
    ico:opts.ico||relIcon(role,female),
    loyalty:opts.loyalty||50, met:C?C.age:0,
    trait:opts.trait||rand(["periang","pendiam","ambisius","setia","licik","pemberani","bijak"]),
    isChild:opts.isChild||false,
  };
}
function relIcon(role,female){
  if(role==="pasangan")return female?"💃":"🤵";
  if(role==="musuh")return "😡";
  if(role==="pengikut")return "🧑‍🌾";
  if(role==="bestie")return female?"👯‍♀️":"🧑‍🤝‍🧑";
  if(role==="keluarga")return female?"👩":"👨";
  if(role==="rekan")return female?"👩‍💼":"👨‍💼";
  return female?"👩":"👨";
}
function addRel(role,opts={}){
  const r=makeRel(role,opts);C.relations.push(r);C.pendingDot=true;return r;
}
