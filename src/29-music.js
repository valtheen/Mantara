/* ==================================================================
   MANTARA — MUSIK LATAR ADAPTIF 🎵
   4 track sesuai suasana: 🌙 santai, ⚔️ duel/brawl, 🏟️ lomba/minigame,
   👑 momen agung (lamaran, menikah, naik takhta). Kontrol via tombol 🎵.
   ================================================================== */
(function mantaraMusic(){
if(typeof Audio==="undefined")return; // lingkungan tanpa audio (tes)
// v24: .mp3 -> .ogg (Vorbis q2). 480 MB WAV/MP3 -> 39 MB, setara di speaker HP.
const TRACKS={
  calm:{file:"assets/music/moonlit_keep.ogg",name:"Moonlit Keep",ico:"🌙",label:"Santai"},
  battle:{file:"assets/music/siege_of_blackwood.ogg",name:"Siege of Blackwood",ico:"⚔️",label:"Pertarungan"},
  event:{file:"assets/music/cathedral_of_ash.ogg",name:"Cathedral of Ash",ico:"🏟️",label:"Lomba & Minigame"},
  ceremony:{file:"assets/music/crown_of_ash_and_dawn.ogg",name:"Crown of Ash and Dawn",ico:"👑",label:"Momen Agung"},
  mourn:{file:"assets/music/ashen_chapel.ogg",name:"Ashen Chapel Echo",ico:"🕯️",label:"Duka & Kehilangan"},
  triumph:{file:"assets/music/banner_at_dawn.ogg",name:"Banner at Dawn",ico:"🎉",label:"Kemenangan & Prestasi"},
};
// v24: 8 track kota (dulu 466 MB WAV yang TIDAK PERNAH dirujuk kode sama sekali)
// kini hidup sebagai tema per-kota. Aetheria terdengar beda dari Frostspire.
const CITY_TRACKS={
  aetheria:  {theme:"assets/music/city/aetheria_theme.ogg",  act:"assets/music/city/aetheria_activity.ogg",  name:"Aetheria"},
  thornvale: {theme:"assets/music/city/thornvale_theme.ogg", act:"assets/music/city/thornvale_activity.ogg", name:"Thornvale"},
  saltmoor:  {theme:"assets/music/city/saltmoor_theme.ogg",  act:"assets/music/city/saltmoor_activity.ogg",  name:"Saltmoor"},
  frostspire:{theme:"assets/music/city/frostspire_theme.ogg",act:"assets/music/city/frostspire_activity.ogg",name:"Frostspire"},
};
function cityTrackFor(mood){
  try{
    var id=(typeof C!=="undefined"&&C&&C.cityId)?C.cityId:null;
    var ct=id&&CITY_TRACKS[id]; if(!ct) return null;
    if(mood==="calm")  return {file:ct.theme,name:ct.name+" — Tema Kota",ico:"🌙",label:"Santai · "+ct.name};
    if(mood==="event") return {file:ct.act,  name:ct.name+" — Denyut Kota",ico:"🏟️",label:"Aktivitas · "+ct.name};
  }catch(e){}
  return null;
}
const MKEY="mantara_music_v1";
function mLoad(){try{return Object.assign({on:1,vol:0.55,mode:"auto"},JSON.parse(localStorage.getItem(MKEY)||"{}"));}catch(e){return{on:1,vol:0.55,mode:"auto"};}}
function mSave(){try{localStorage.setItem(MKEY,JSON.stringify(MS));}catch(e){}}
const MS=mLoad();
let aud=null,cur=null,revertT=null,unlocked=false,fadeI=null,_curKey=null;
function ensureAud(){
  if(aud)return;
  aud=new Audio();aud.loop=true;aud.volume=MS.on?MS.vol:0;
  aud.addEventListener("error",()=>{});
}
function fadeTo(v,ms){
  if(!aud)return;clearInterval(fadeI);
  const steps=10,dv=(v-aud.volume)/steps;let n=0;
  fadeI=setInterval(()=>{n++;try{aud.volume=Math.max(0,Math.min(1,aud.volume+dv));}catch(e){}if(n>=steps)clearInterval(fadeI);},(ms||600)/steps);
}
function srcOf(t){return (typeof resolveAsset==="function")?resolveAsset(t.file):t.file;}
function tryPlay(){if(aud&&MS.on)aud.play().catch(()=>{});}
// mood: dipanggil hook otomatis (hormati mode manual) / UI (force)
window.MusicMood=function(mood,opts){
  opts=opts||{};
  if(!MS.on)return;
  if(MS.mode!=="auto"&&!opts.force)return;
  const t=cityTrackFor(mood)||TRACKS[mood]||TRACKS.calm;
  ensureAud();
  clearTimeout(revertT);
  const _key=mood+"|"+t.file;          // v24: ganti track juga saat pindah kota
  if(cur!==mood||_curKey!==_key){
    cur=mood;_curKey=_key;
    aud.src=srcOf(t);
    aud.loop=true;
    aud.volume=0;
    tryPlay();fadeTo(MS.vol,700);
  }else tryPlay();
  if(opts.revert)revertT=setTimeout(()=>window.MusicMood(opts.revert),opts.after||45000);
  try{window.__musicTrackNow=t;}catch(e){}
  try{const b=document.getElementById("musicBtn");if(b)b.textContent=MS.on?t.ico:"🔇";}catch(e){}
};
window.musicNow=function(){return {state:MS,mood:cur,track:(window.__musicTrackNow||(cur?TRACKS[cur]:null)),paused:!aud||aud.paused};};
window.musicSetOn=function(on){
  MS.on=on?1:0;mSave();ensureAud();
  if(!MS.on){fadeTo(0,400);setTimeout(()=>{try{aud.pause();}catch(e){}},450);}
  else{if(!cur)cur=null,window.MusicMood("calm",{force:true});else{tryPlay();fadeTo(MS.vol,400);}}
  try{const b=document.getElementById("musicBtn");if(b)b.textContent=MS.on?(cur?TRACKS[cur].ico:"🎵"):"🔇";}catch(e){}
};
window.musicSetVol=function(v){MS.vol=v;mSave();if(aud&&MS.on)fadeTo(v,300);};
window.musicSetMode=function(m){MS.mode=m;mSave();};
// buka kunci autoplay pada sentuhan pertama
document.addEventListener("pointerdown",function once(){
  unlocked=true;
  if(MS.on&&typeof C!=="undefined"&&C&&C.alive)window.MusicMood(cur||"calm",{force:MS.mode!=="auto"});
  document.removeEventListener("pointerdown",once);
},{passive:true});
/* ---------- TOMBOL 🎵 & HALAMAN KONTROL ---------- */
function buildMusicBtn(){
  if(document.getElementById("musicBtn"))return;
  const tb=document.querySelector(".topbar");if(!tb)return;
  const b=document.createElement("button");
  b.id="musicBtn";b.className="tut-help";b.style.left="94px";
  b.textContent=MS.on?"🎵":"🔇";b.title="Musik";
  b.onclick=()=>openMusicPage();
  tb.appendChild(b);
}
window.openMusicPage=function(){
  if(typeof pushPage!=="function")return;
  pushPage({title:"Musik",render:function(){
    const now=cur?TRACKS[cur]:null;
    let h=pgSec("Sedang Diputar");
    h+=pgRow({ico:now?now.ico:"🎵",title:now?now.name:"(belum ada — ketuk track di bawah)",
      sub:now?`suasana: ${now.label} · ${(!aud||aud.paused)?"⏸ jeda":"▶ berbunyi"}`:"musik menyala otomatis mengikuti suasana",
      on:()=>{if(aud&&!aud.paused){aud.pause();}else{tryPlay();}mpRefresh();}});
    h+=pgRow({ico:MS.on?"🔊":"🔇",title:MS.on?"Musik: NYALA":"Musik: MATI",sub:"ketuk untuk "+(MS.on?"matikan":"nyalakan"),
      on:()=>{musicSetOn(!MS.on);mpRefresh();}});
    h+=pgSec("Mode");
    h+=pgRow({ico:"✨",title:"Otomatis ikuti suasana"+(MS.mode==="auto"?" ✓":""),
      sub:"santai → duel → lomba → momen agung, berganti sendiri",dim:MS.mode==="auto",
      on:()=>{musicSetMode("auto");window.MusicMood(cur||"calm",{force:true});mpRefresh();}});
    h+=pgSec("Pilih Track (mode manual)");
    Object.keys(TRACKS).forEach(k=>{
      const t=TRACKS[k];
      h+=pgRow({ico:t.ico,title:t.name+(cur===k?"  ♪":""),sub:t.label,
        on:()=>{musicSetMode("manual");musicSetOn(true);window.MusicMood(k,{force:true});mpRefresh();}});
    });
    h+=pgSec("Volume");
    [["🔈","Pelan",0.3],["🔉","Sedang",0.55],["🔊","Keras",0.85]].forEach(v=>{
      h+=pgRow({ico:v[0],title:v[1]+(Math.abs(MS.vol-v[2])<0.01?" ✓":""),on:()=>{musicSetVol(v[2]);mpRefresh();}});
    });
    return h;
  }});
};
/* ---------- HOOK SUASANA ---------- */
// mulai hidup / lanjut save -> santai
if(typeof confirmCustomize==="function"){const _mc=confirmCustomize;confirmCustomize=function(){const r=_mc.apply(this,arguments);try{window.MusicMood("calm");}catch(e){}return r;};}
if(typeof loadSlot==="function"){const _mls=loadSlot;loadSlot=function(){const r=_mls.apply(this,arguments);try{window.MusicMood("calm");}catch(e){}return r;};}
// momen agung: lamaran diterima, menikah, kelahiran
(function hookRomance(){
  if(typeof REL_ACTIONS==="undefined"||!REL_ACTIONS.pasangan)return;
  REL_ACTIONS.pasangan.forEach(a=>{
    const _run=a.run;
    a.run=function(r){
      const res=_run.apply(this,arguments);
      try{
        if(typeof res==="string"&&(res.includes("MENERIMA")||res.includes("menikah dengan")||res.includes("menambah anggota")))
          window.MusicMood("ceremony",{revert:"calm",after:60000});
      }catch(e){}
      return res;
    };
  });
})();
// duel, arena, minigame — dibungkus setelah semua modul termuat
function hookLate(){
  try{
    if(window.MantaraArena&&MantaraArena.startTacticalDuel){
      const _std=MantaraArena.startTacticalDuel;
      MantaraArena.startTacticalDuel=function(foe,opts){
        opts=opts||{};
        const _end=opts.onEnd;
        opts.onEnd=function(res){try{window.MusicMood("calm");}catch(e){}if(_end)return _end.apply(this,arguments);};
        try{window.MusicMood("battle");}catch(e){}
        return _std.call(this,foe,opts);
      };
    }
    if(typeof window.openArena==="function"){const _oa=window.openArena;window.openArena=function(){try{window.MusicMood("event");}catch(e){}return _oa.apply(this,arguments);};}
    if(typeof window.arenaClose==="function"){const _ac=window.arenaClose;window.arenaClose=function(){try{if(cur==="event")window.MusicMood("calm");}catch(e){}return _ac.apply(this,arguments);};}
    ["skillShotGame","runeMemoryGame","parryGame","startBroomRace","startUlarNaga"].forEach(fn=>{
      if(typeof window[fn]==="function"){
        const _f=window[fn];
        window[fn]=function(){try{window.MusicMood("event",{revert:"calm",after:40000});}catch(e){}return _f.apply(this,arguments);};
      }
    });
    if(typeof kAddNews==="function"){
      const _kn=kAddNews;
      window.kAddNews=kAddNews=function(t){try{if(String(t).includes("KUDETA BERHASIL")||String(t).includes("naik takhta"))window.MusicMood("ceremony",{revert:"calm",after:60000});}catch(e){}return _kn.apply(this,arguments);};
    }
  }catch(e){}
}
function bootMusic(){try{buildMusicBtn();}catch(e){}try{hookLate();}catch(e){}}
if(document.readyState!=="loading")setTimeout(bootMusic,500);
else document.addEventListener("DOMContentLoaded",function(){setTimeout(bootMusic,500);});
})();
