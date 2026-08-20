/* ==================================================================
   MANTARA — ARENA & LAGA
   Duel taktis turn-based • Minigame judi • Lomba & boss • Peringkat
   Modul mandiri. Di-append; memakai gaya .exp-* & fungsi global game.
   ================================================================== */
(function(){
"use strict";
if(window.__MANTARA_ARENA__) return;
window.__MANTARA_ARENA__ = true;

/* ---------------- util aman (lokal) ---------------- */
function cl(v){ return Math.max(0, Math.min(100, Math.round(v))); }
function ri(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function rf(a,b){ return a+Math.random()*(b-a); }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function ch(p){ return Math.random()<p; }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]);}); }
function T(m){ try{ if(typeof toast==="function") toast(m); }catch(e){} }
function LOG(t,c){ try{ if(typeof log==="function" && typeof C!=="undefined" && C) log(C.age, t, c||""); }catch(e){} }
function alive(){ return typeof C!=="undefined" && C && C.alive; }
function REFRESH(){ try{ if(typeof renderAll==="function") renderAll(); }catch(e){} }
function stat(k){ return (alive() && C.stats && typeof C.stats[k]==="number") ? C.stats[k] : 0; }
function addStat(o){ try{ if(typeof applyStats==="function") applyStats(o); }catch(e){} }
function anim(t,o){ try{ if(typeof playAnim==="function") playAnim(t,o||{}); }catch(e){} }
function sfx(n){ try{ if(typeof playSFX==="function") playSFX(n); }catch(e){} }
function coinFmt(n){ return (n||0).toLocaleString("id-ID"); }
function Dyn(){ try{ return (window.MantaraExp&&window.MantaraExp.Dyn)?window.MantaraExp.Dyn:null; }catch(e){ return null; } }
function ascLvl(){ var d=Dyn(); return d?d.get().ascension:0; }
function awardLegacy(n,why){ try{ if(window.MantaraExp&&window.MantaraExp.awardLegacy) return window.MantaraExp.awardLegacy(n,why); }catch(e){} return 0; }
function emit(t,a){ try{ if(window.EXP&&window.EXP.emit) window.EXP.emit(t,a); }catch(e){} }
function spend(){ try{ return (typeof spendAction!=="function") || spendAction(); }catch(e){ return true; } }

/* ---------------- state per-karakter & dinasti ---------------- */
function ensureArena(){
  if(!alive()) return;
  if(!C._arena) C._arena={ wins:0, streak:0, bestStreak:0, points:0, belts:[], gauntletBest:0 };
  var d=Dyn(); if(d){ var dd=d.get(); if(!dd.arena) dd.arena={ points:0, bestStreak:0, belts:[], champions:[] }; }
}
function A(){ ensureArena(); return C._arena; }
function DA(){ var d=Dyn(); if(!d) return null; var dd=d.get(); if(!dd.arena) dd.arena={points:0,bestStreak:0,belts:[],champions:[]}; return dd.arena; }

var RANKS=[[0,"Petarung Baru"],[60,"Petarung"],[160,"Gladiator"],[360,"Jawara"],[720,"Juara Arena"],[1300,"Legenda Arena"]];
function rankTitle(p){ var t=RANKS[0][1]; for(var i=0;i<RANKS.length;i++){ if(p>=RANKS[i][0]) t=RANKS[i][1]; } return t; }
function streakMult(){ return 1 + Math.min(10, (A().streak||0))*0.08; }

function grantPoints(n){
  var a=A(); a.points=(a.points||0)+n;
  var d=Dyn(); if(d){ var da=DA(); da.points=(da.points||0)+n; d.save(); }
}
function recordWin(pts){
  var a=A();
  a.wins++; a.streak++; if(a.streak>a.bestStreak) a.bestStreak=a.streak;
  var d=Dyn(); if(d){ var da=DA(); if(a.bestStreak>(da.bestStreak||0)){ da.bestStreak=a.bestStreak; d.save(); } }
  grantPoints(Math.round(pts*streakMult()));
}
function recordLoss(){ var a=A(); a.streak=0; }
function grantBelt(id,name){
  var a=A(); if(a.belts.indexOf(id)<0) a.belts.push(id);
  var d=Dyn(); if(d){ var da=DA(); if(da.belts.indexOf(id)<0){ da.belts.push(id); da.champions.unshift({name:C.name,belt:name,age:C.age}); if(da.champions.length>15) da.champions.pop(); } d.save(); }
  LOG("🏅 Kau merebut <b>"+esc(name)+"</b>!","e-epic");
  T("🏅 "+name);
}

/* ---------------- showResult aman ---------------- */
function showRes(ico,title,cls,body){
  try{ if(typeof showResult==="function" && alive()){ showResult({ico:ico,title:title,cls:cls,body:body}); return; } }catch(e){}
  try{ if(typeof openChoice==="function"){ openChoice({ico:ico,cancel:false,prompt:"<b style='color:var(--gold)'>"+title+"</b><br>"+body,choices:[{label:"Lanjut ▸",run:function(){return {};}}]}); } }catch(e2){}
}

/* ==================================================================
   MESIN DUEL TAKTIS (turn-based)
   ================================================================== */
var BTL=null; // state pertarungan aktif

function meMaxHp(){ return Math.round(55 + stat("might")*0.5 + stat("health")*0.7 + ascLvl()*6); }
function meMaxMana(){ return Math.round(26 + stat("mana")*0.8); }

function startTacticalDuel(foe, opts){
  if(!alive()){ T("Perlu kehidupan aktif."); return; }
  opts=opts||{};
  BTL={
    foe:{ name:foe.name, ico:foe.ico||"🗡️", hp:foe.hp, maxHp:foe.hp,
          atk:foe.atk||20, mag:foe.mag||0, guard:false, critNext:false,
          boss:!!foe.boss, chargeIn:foe.boss?3:0, charging:false, special:foe.special||"Napas Api" },
    me:{ hp:meMaxHp(), maxHp:meMaxHp(), sta:100, maxSta:100, mana:meMaxMana(), maxMana:meMaxMana(), guard:false, critNext:false },
    turn:1, busy:false,
    title:opts.title||("Duel vs "+foe.name),
    allowFlee:opts.allowFlee!==false,
    onEnd:opts.onEnd||function(){},
    fleeReward:opts.fleeReward||null,
    log:[]
  };
  buildDuelOverlay();
  document.getElementById("duelOverlay").classList.add("show");
  btlLog(opts.intro||("⚔️ "+esc(foe.name)+" berdiri menantang di hadapanmu."),"");
  renderDuel();
}

function buildDuelOverlay(){
  if(document.getElementById("duelOverlay")) return;
  injectArenaStyle();
  var ov=document.createElement("div");
  ov.id="duelOverlay"; ov.className="exp-ov";
  ov.innerHTML=
  "<div class='exp-panel btl-panel'>"
  +"<div class='exp-head'><span class='exp-title' id='btlTitle'>⚔️ DUEL</span><button class='exp-x' onclick='arenaDuelQuit()'>✕</button></div>"
  +"<div class='btl-stage'>"
  +"  <div class='btl-foe'><div class='btl-ava' id='btlFoeAva'>🗡️</div>"
  +"    <div class='btl-name' id='btlFoeName'>Lawan</div>"
  +"    <div class='btl-bar hp'><div class='btl-fill hpf' id='btlFoeHp'></div><span class='btl-num' id='btlFoeHpN'></span></div>"
  +"    <div class='btl-warn' id='btlWarn'></div>"
  +"  </div>"
  +"  <div class='btl-vs'>⚔</div>"
  +"  <div class='btl-me'><div class='btl-ava me' id='btlMeAva'>🧙</div>"
  +"    <div class='btl-name'>Kau</div>"
  +"    <div class='btl-bar hp'><div class='btl-fill hpf' id='btlMeHp'></div><span class='btl-num' id='btlMeHpN'></span></div>"
  +"    <div class='btl-bar sta'><div class='btl-fill staf' id='btlMeSta'></div><span class='btl-lab'>STA</span></div>"
  +"    <div class='btl-bar mana'><div class='btl-fill manaf' id='btlMeMana'></div><span class='btl-lab'>MANA</span></div>"
  +"  </div>"
  +"</div>"
  +"<div class='btl-logbox' id='btlLog'></div>"
  +"<div class='btl-acts' id='btlActs'></div>"
  +"</div>";
  document.body.appendChild(ov);
}
function btlLog(t,c){ if(!BTL) return; BTL.log.unshift({t:t,c:c||""}); if(BTL.log.length>18) BTL.log.pop(); }
function bar(id,fillId,numId,cur,max,txt){
  var f=document.getElementById(fillId); if(f) f.style.width=Math.max(0,Math.round(cur/max*100))+"%";
  if(numId){ var n=document.getElementById(numId); if(n) n.textContent=txt!==undefined?txt:(Math.max(0,Math.round(cur))+"/"+Math.round(max)); }
}
function renderDuel(){
  if(!BTL) return;
  document.getElementById("btlTitle").textContent="⚔️ "+BTL.title;
  document.getElementById("btlFoeAva").textContent=BTL.foe.ico;
  document.getElementById("btlFoeName").textContent=BTL.foe.name+(BTL.foe.boss?" 🐉":"");
  bar(null,"btlFoeHp","btlFoeHpN",BTL.foe.hp,BTL.foe.maxHp);
  bar(null,"btlMeHp","btlMeHpN",BTL.me.hp,BTL.me.maxHp);
  bar(null,"btlMeSta",null,BTL.me.sta,BTL.me.maxSta);
  bar(null,"btlMeMana",null,BTL.me.mana,BTL.me.maxMana);
  var warn=document.getElementById("btlWarn");
  warn.textContent=BTL.foe.charging?("⚠ "+BTL.foe.name+" memusatkan "+BTL.foe.special+"! BERTAHAN!"):"";
  warn.style.display=BTL.foe.charging?"block":"none";
  var logHtml=BTL.log.map(function(e){ return "<div class='btl-line "+e.c+"'>"+e.t+"</div>"; }).join("");
  document.getElementById("btlLog").innerHTML=logHtml;
  var acts=[
    {k:"serang",ic:"⚔️",l:"Serang",s:"fisik · 16 sta"},
    {k:"sihir", ic:"🔮",l:"Sihir", s:"tembus tameng · 20 mana"},
    {k:"tahan", ic:"🛡️",l:"Bertahan",s:"−60% & pulih sta/mana"},
    {k:"tipu",  ic:"🎭",l:"Tipu",  s:"pancing kritikal · 10 sta"}
  ];
  document.getElementById("btlActs").innerHTML=acts.map(function(a){
    var dis=BTL.busy?"dis":"";
    return "<button class='btl-act "+dis+"' onclick=\"arenaAct('"+a.k+"')\"><span class='ba-ic'>"+a.ic+"</span><span class='ba-l'>"+a.l+"</span><span class='ba-s'>"+a.s+"</span></button>";
  }).join("")
  + (BTL.allowFlee?"<button class='btl-act flee "+(BTL.busy?"dis":"")+"' onclick='arenaFlee()'><span class='ba-ic'>🏃</span><span class='ba-l'>Kabur</span><span class='ba-s'>"+(BTL.fleeReward?"bawa hadiah":"selamatkan diri")+"</span></button>":"");
}

function foeAI(){
  var f=BTL.foe, me=BTL.me;
  if(f.boss && f.charging) return "unleash";      // lepaskan serangan besar
  if(f.hp < f.maxHp*0.28 && ch(0.4)) return "tahan";
  if(f.mag>0 && me.guard && ch(0.5)) return "sihir";
  var r=Math.random();
  if(f.mag>0){ if(r<0.45) return "serang"; if(r<0.7) return "sihir"; if(r<0.85) return "tipu"; return "tahan"; }
  if(r<0.6) return "serang"; if(r<0.78) return "tipu"; return "tahan";
}

window.arenaAct=function(k){
  if(!BTL || BTL.busy) return;
  BTL.busy=true; renderDuel();
  resolveTurn(k, foeAI());
};
window.arenaFlee=function(){
  if(!BTL || BTL.busy) return;
  var ok = !BTL.foe.boss || ch(0.6);
  if(!ok){ btlLog("🏃 Kau gagal kabur dari sang boss!","bad"); BTL.busy=true; renderDuel(); resolveTurn("__none__", "unleash"); return; }
  var res={win:false, fled:true};
  endDuel(res, "🏃 Kau mundur dari pertarungan.");
};

function actDamage(src, action, srcStats){
  // src: 'me'|'foe'
  if(action==="serang"){
    var base = src==="me" ? (8+stat("might")*0.35) : (srcStats.atk*0.5+6);
    var low = src==="me" && BTL.me.sta<16;
    return { dmg: Math.round(base*rf(0.85,1.15)*(low?0.5:1)), type:"fis" };
  }
  if(action==="sihir"){
    var mbase = src==="me" ? (10+stat("mana")*0.42) : (srcStats.mag*0.55+7);
    var fizz = src==="me" && BTL.me.mana<20;
    return { dmg: fizz?0 : Math.round(mbase*rf(0.85,1.15)), type:"mag", fizz:fizz };
  }
  if(action==="unleash"){ // boss special
    return { dmg: Math.round((srcStats.atk*0.9+18)*rf(0.9,1.2)), type:"boss" };
  }
  return { dmg:0, type:"none" };
}

function resolveTurn(myAct, foeAct){
  var me=BTL.me, f=BTL.foe;
  me.guard=false; f.guard=false;
  // biaya & efek "persiapan"
  var myNote="", foeNote="";
  // --- fase persiapan: tahan / tipu ---
  if(myAct==="tahan"){ me.guard=true; me.sta=Math.min(me.maxSta, me.sta+30); me.mana=Math.min(me.maxMana, me.mana+12); myNote="Kau memasang kuda-kuda bertahan."; }
  if(myAct==="tipu"){ me.sta=Math.max(0, me.sta-10); if(ch(0.55+stat("mind")/300+stat("charm")/400)){ me.critNext=true; myNote="Kau memancing — serangan berikutmu akan kritikal!"; } else { myNote="Tipuanmu tak termakan."; } }
  if(myAct==="serang"){ me.sta=Math.max(0, me.sta-16); }
  if(myAct==="sihir"){ if(me.mana>=20) me.mana-=20; }

  if(foeAct==="tahan"){ f.guard=true; foeNote=f.name+" bertahan."; }
  if(foeAct==="tipu"){ if(ch(0.5)){ f.critNext=true; foeNote=f.name+" mengincar celah..."; } }

  // --- fase serang: hitung damage ---
  var toFoe=0, toMe=0, msgs=[];
  if(myAct==="serang"||myAct==="sihir"){
    var d=actDamage("me", myAct, null);
    if(d.fizz){ msgs.push({t:"🔮 Mana tak cukup — sihirmu buyar.",c:"bad"}); }
    else{
      var crit = me.critNext || ch(0.10+stat("mind")/500);
      var raw=d.dmg*(crit?1.9:1);
      if(f.guard) raw*= (d.type==="mag"?0.8:0.4);
      toFoe=Math.round(raw);
      msgs.push({t:(d.type==="mag"?"🔮":"⚔️")+" Kau "+(d.type==="mag"?"merapal":"menyerang")+" — "+toFoe+" dmg"+(crit?" 💥KRITIS!":"")+(f.guard?" (tertahan)":""), c:"good"});
      me.critNext=false;
    }
  } else if(myNote){ msgs.push({t:myNote,c:""}); }

  if(foeAct==="serang"||foeAct==="sihir"||foeAct==="unleash"){
    var fd=actDamage("foe", foeAct, f);
    var fcrit = f.critNext || ch(0.08);
    var fraw=fd.dmg*(fcrit?1.8:1);
    if(foeAct==="unleash"){ fraw = me.guard ? fraw*0.35 : fraw*1.15; f.charging=false; f.chargeIn=3; }
    else if(me.guard){ fraw*= (fd.type==="mag"?0.8:0.4); }
    toMe=Math.round(fraw);
    var label = foeAct==="unleash" ? ("🔥 "+f.name+" melepas "+f.special+" — "+toMe+" dmg"+(me.guard?" (kau bertahan!)":"!")) : ((fd.type==="mag"?"🔮":"⚔️")+" "+f.name+" menyerang — "+toMe+" dmg"+(fcrit?" 💥":"")+(me.guard?" (tertahan)":""));
    msgs.push({t:label, c:"bad"});
    f.critNext=false;
  } else if(foeNote){ msgs.push({t:foeNote,c:""}); }

  f.hp=Math.max(0, f.hp-toFoe);
  me.hp=Math.max(0, me.hp-toMe);
  // regen pasif kecil
  me.sta=Math.min(me.maxSta, me.sta+6);

  // boss telegraph untuk giliran berikut
  if(f.boss && f.hp>0){
    if(!f.charging){ f.chargeIn--; if(f.chargeIn<=0){ f.charging=true; } }
    if(f.hp<f.maxHp*0.5 && !f._enraged){ f._enraged=true; f.atk=Math.round(f.atk*1.25); msgs.push({t:"🐉 "+f.name+" MENGAMUK! Serangannya menguat.",c:"bad"}); }
  }

  msgs.forEach(function(m){ btlLog(m.t,m.c); });
  if(toFoe>toMe) anim("clash",{dur:600});

  // animasi pukulan singkat lalu update
  var mePunch=document.getElementById("btlMeAva"), foePunch=document.getElementById("btlFoeAva");
  if(toFoe>0 && foePunch){ foePunch.classList.add("hit"); }
  if(toMe>0 && mePunch){ mePunch.classList.add("hit"); }
  renderDuel();
  setTimeout(function(){ if(foePunch)foePunch.classList.remove("hit"); if(mePunch)mePunch.classList.remove("hit"); },260);

  // cek akhir
  if(f.hp<=0){ setTimeout(function(){ endDuel({win:true}, "🏆 "+f.name+" tumbang!"); },420); return; }
  if(me.hp<=0){ setTimeout(function(){ endDuel({win:false}, "🩸 Kau tumbang..."); },420); return; }
  BTL.turn++;
  BTL.busy=false; renderDuel();
}

function endDuel(res, msg){
  if(!BTL) return;
  var cb=BTL.onEnd; var wasBoss=BTL.foe.boss;
  btlLog(msg, res.win?"good":"bad");
  renderDuel();
  if(res.win){ anim("win",{text:"MENANG!"}); sfx("win"); } else if(!res.fled){ anim("lose",{text:"KALAH"}); sfx("lose"); }
  setTimeout(function(){
    var ov=document.getElementById("duelOverlay"); if(ov) ov.classList.remove("show");
    BTL=null;
    try{ cb(res); }catch(e){}
  }, res.win?900:(res.fled?200:900));
}
window.arenaDuelQuit=function(){
  if(!BTL) return;
  if(BTL.foe.boss){ T("Tak bisa keluar dari perburuan boss — kabur dulu!"); return; }
  var ov=document.getElementById("duelOverlay"); if(ov) ov.classList.remove("show");
  var cb=BTL.onEnd; BTL=null; try{ cb({win:false,quit:true}); }catch(e){}
};

/* ==================================================================
   INTEGRASI RIVAL (override duel instan -> taktis)
   ================================================================== */
function rivalFoe(rv){
  var hp=Math.round(46 + rv.might*0.5 + (rv.level||1)*5);
  return { name:rv.name, ico:rv.female?"🦹‍♀️":"🦹‍♂️", hp:hp, atk:rv.might*0.8+10, mag:rv.mana*0.6, special:"Amukan" };
}
function startRivalDuel(wager){
  if(!alive() || !C._rival){ T("Kau tak punya rival."); return; }
  if(!spend()){ T("Aksi tahun ini habis."); return; }
  var rv=C._rival;
  startTacticalDuel(rivalFoe(rv), {
    title:"Duel Rival — "+rv.name,
    intro:"😤 "+esc(rv.name)+" mencabut senjata. "+(wager?("Taruhan "+coinFmt(wager)+" keping di atas meja!"):"Kehormatan dipertaruhkan."),
    onEnd:function(res){ rivalOutcome(res, wager); }
  });
}
function rivalOutcome(res, wager){
  if(!alive()) return;
  var rv=C._rival;
  if(res.quit){ return; }
  if(res.win && rv){
    var rep=ri(16,32)+ (rv.level||1)*3;
    C.reputation=(C.reputation||0)+rep;
    var lg=ri(9,17)+(rv.level||1)*3;
    awardLegacy(lg,"menang duel rival");
    addStat({might:2,happy:7});
    C._rivalsBeat=(C._rivalsBeat||0)+1;
    var d=Dyn(); if(d){ var dd=d.get(); dd.rivals=(dd.rivals||0)+1; if(C._rivalsBeat>=3 && !dd.ach["penakluk"]){ dd.ach["penakluk"]=true; dd.legacy+=40; dd.earned+=40; T("🏅 Prestasi: Sang Penakluk (+40 Warisan)"); } d.save(); }
    recordWin(20+(rv.level||1)*4);
    emit("duel_win",1);
    var extra="";
    if(wager){ C.coin=(C.coin||0)+wager; extra="<br>💰 Kau memenangkan taruhan +"+coinFmt(wager)+" keping!"; }
    rv.beaten=(rv.beaten||0)+1;
    if(rv.beaten>=2 || ch(0.5)){
      C._rival=null;
      showRes("⚔️","Rival Ditumbangkan!","e-epic","Kau mengalahkan <b>"+esc(rv.name)+"</b> untuk selamanya. (+"+rep+" reputasi, +"+lg+" Warisan)"+extra);
      setTimeout(function(){ if(alive()&&C.age>=15&&ch(0.6)&&window.MantaraExp&&window.MantaraExp.spawnRival) window.MantaraExp.spawnRival(); },500);
    }else{
      rv.hostility=cl((rv.hostility||50)+10);
      if(rv.might!==undefined){ rv.might=cl(rv.might+3); rv.mana=cl(rv.mana+2); rv.level=(rv.level||1)+1; }
      showRes("⚔️","Kau Menang!","e-good","Kau memukul mundur <b>"+esc(rv.name)+"</b> — ia bangkit lebih kuat & haus balas. (+"+rep+" reputasi, +"+lg+" Warisan)"+extra);
    }
  } else if(!res.fled && rv){
    var lc = wager ? wager : ri(25,70);
    C.coin=Math.max(0,(C.coin||0)-lc);
    var hd=ri(8,16); addStat({health:-hd,happy:-9});
    rv.hostility=cl((rv.hostility||50)+8);
    recordLoss();
    showRes("🩸","Kau Kalah","e-bad","<b>"+esc(rv.name)+"</b> mengalahkanmu. Kau kehilangan "+coinFmt(lc)+" keping"+(wager?" (taruhan)":"")+" & terluka. Bangkitlah.");
    if(alive() && C.stats.health<=0 && typeof die==="function") die("Kau gugur di tangan rivalmu, "+rv.name+".");
  }
  REFRESH(); renderArena(); try{ if(window.expTab && document.getElementById("expOverlay") && document.getElementById("expOverlay").classList.contains("show")) window.expTab("Rival"); }catch(e){}
}
// override tombol duel rival dari Balai Takdir
window.expDuelRival=function(){ if(document.getElementById("expOverlay")) document.getElementById("expOverlay").classList.remove("show"); openRivalWager(); };

function openRivalWager(){
  if(!alive() || !C._rival){ T("Kau tak punya rival."); return; }
  var opts=[ {label:"⚔️ Duel biasa", sub:"tanpa taruhan", run:function(){ startRivalDuel(0); return null; }} ];
  [100,300].forEach(function(b){ if((C.coin||0)>=b) opts.push({label:"💰 Taruhan "+b, sub:"menang +"+b+", kalah −"+b, run:function(){ startRivalDuel(b); return null; }}); });
  if((C.coin||0)>=600) opts.push({label:"🔥 All-in "+Math.min(1500,C.coin), sub:"pertaruhkan besar", cls:"danger", run:function(){ startRivalDuel(Math.min(1500,C.coin)); return null; }});
  if(typeof openChoice==="function") openChoice({ico:"😤",cancel:true,prompt:"<b>Duel "+esc(C._rival.name)+"</b><br><span style='font-size:11px;color:var(--ink-soft);filter:brightness(1.6)'>Pilih taruhan sebelum bertarung:</span>",choices:opts});
}

/* ==================================================================
   ARENA GAUNTLET (bertahan gelombang)
   ================================================================== */
var GAUNTLET_FOES=[
  {name:"Bandit Jalanan",ico:"🦰"},{name:"Prajurit Sewaan",ico:"🪖"},{name:"Gladiator Veteran",ico:"🗡️"},
  {name:"Penyihir Kelana",ico:"🧙"},{name:"Ksatria Hitam",ico:"⚫"},{name:"Juara Bertahan",ico:"👑"},
  {name:"Iblis Arena",ico:"👹"},{name:"Raja Gladiator",ico:"🛡️"}
];
function startGauntlet(wave, purse){
  wave=wave||0; purse=purse||0;
  if(wave===0){ if(!spend()){ T("Aksi tahun ini habis."); return; } if((C.coin||0)<20){ T("Biaya masuk 20 keping."); return; } C.coin-=20; }
  var base=wave;
  var foeName=GAUNTLET_FOES[Math.min(wave,GAUNTLET_FOES.length-1)];
  var hp=Math.round(40 + wave*16 + stat("might")*0.2);
  var foe={ name:foeName.name+" (Gel."+(wave+1)+")", ico:foeName.ico, hp:hp, atk:14+wave*4, mag:wave>2?(8+wave*3):0, special:"Hantaman" };
  var prize=30+wave*35;
  startTacticalDuel(foe, {
    title:"Arena Bertahan · Gelombang "+(wave+1),
    allowFlee:true, fleeReward:purse,
    intro:"🏟️ Gelombang "+(wave+1)+": "+esc(foe.name)+" memasuki arena! Hadiah gelombang "+prize+" keping.",
    onEnd:function(res){
      if(res.win){
        var np=purse+prize;
        recordWin(10+wave*4);
        var a=A(); if(wave+1>a.gauntletBest) a.gauntletBest=wave+1;
        if(wave+1>=GAUNTLET_FOES.length){
          C.coin+=np+200; C.reputation=(C.reputation||0)+20; awardLegacy(25,"menuntaskan gauntlet");
          grantBelt("gauntlet","Sabuk Sang Bertahan");
          showRes("👑","ARENA DITAKLUKKAN!","e-epic","Kau bertahan hingga gelombang terakhir! Total "+coinFmt(np+200)+" keping, +Sabuk Sang Bertahan.");
          REFRESH(); renderArena(); return;
        }
        showRes("🏟️","Gelombang "+(wave+1)+" Lolos!","e-good","Kemenangan! Simpanan hadiah kini <b>"+coinFmt(np)+" keping</b>. Lanjut ke gelombang berikut, atau kabur untuk mengamankannya.",0);
        setTimeout(function(){ contPrompt(np, wave+1); }, 300);
      } else if(res.fled){
        C.coin+=purse; recordLoss();
        showRes("🏃","Mundur Aman","e-good","Kau keluar arena membawa "+coinFmt(purse)+" keping.");
        REFRESH(); renderArena();
      } else {
        recordLoss(); var hd=ri(6,14); addStat({health:-hd});
        showRes("🩸","Tumbang di Arena","e-bad","Kau kalah di gelombang "+(wave+1)+". Hadiah "+coinFmt(purse)+" keping hangus. (−"+hd+" nyawa)");
        REFRESH(); renderArena();
        if(alive() && C.stats.health<=0 && typeof die==="function") die("Tewas di arena.");
      }
    }
  });
}
function contPrompt(purse, nextWave){
  if(typeof openChoice!=="function") return;
  openChoice({ico:"🏟️",cancel:false,prompt:"Simpanan hadiah: <b>"+coinFmt(purse)+" keping</b>.<br>Lanjut ke gelombang "+(nextWave+1)+" (risiko lebih besar) atau amankan sekarang?",
    choices:[
      {label:"⚔️ Lanjut gelombang "+(nextWave+1),cls:"love",run:function(){ setTimeout(function(){ startGauntlet(nextWave, purse); },120); return null; }},
      {label:"💰 Amankan "+coinFmt(purse),run:function(){ C.coin+=purse; REFRESH(); renderArena(); return {t:"Kau mengamankan "+coinFmt(purse)+" keping dari arena.",cls:"e-good"}; }}
    ]});
}

/* ==================================================================
   ADU SIHIR (duel mage)
   ================================================================== */
function startAduSihir(){
  if(!alive()){ return; }
  if(stat("mana")<20){ T("Butuh Mana ≥ 20 untuk Adu Sihir."); return; }
  if(!spend()){ T("Aksi tahun ini habis."); return; }
  var lvl=Math.round(stat("mana")*0.6)+ri(10,25);
  var foe={ name:pick(["Magus Kelam","Penyihir Menara","Arch-Sihir","Nekromanser"]), ico:"🧙‍♂️", hp:50+lvl, atk:8+lvl*0.3, mag:20+lvl*0.6, special:"Ledakan Arkana" };
  startTacticalDuel(foe, {
    title:"Adu Sihir", intro:"🔮 "+esc(foe.name)+" mengangkat tongkat. Duel mantra dimulai!",
    onEnd:function(res){
      if(res.win){ var g=ri(120,280); C.coin+=g; addStat({mana:4}); recordWin(18); awardLegacy(8,"menang adu sihir"); if(!A().belts.length||ch(0.3)) grantBelt("arcane","Sabuk Arkana"); showRes("🔮","Menang Adu Sihir!","e-epic","Mantra terakhirmu telak! +"+g+" keping, +4 Mana."); }
      else if(!res.fled){ recordLoss(); var h=ri(8,16); addStat({health:-h,mana:-5}); showRes("🔮","Kalah Adu Sihir","e-bad","Mantranya mengungguli. −"+h+" nyawa."); if(alive()&&C.stats.health<=0&&typeof die==="function") die("Hangus dalam duel sihir."); }
      REFRESH(); renderArena();
    }
  });
}

/* ==================================================================
   BURU NAGA (boss)
   ================================================================== */
function startBuruNaga(){
  if(!alive()){ return; }
  if(C.age<18 || stat("might")+stat("mana")<70){ T("Perlu usia 18+ & Kekuatan+Mana ≥ 70. Berlatih dulu!"); return; }
  if(!spend()){ T("Aksi tahun ini habis."); return; }
  var foe={ name:pick(["Naga Api Vermillion","Wyrm Frostspire","Naga Bayang"]), ico:"🐉",
    hp:180+ri(0,40)+stat("might"), atk:24, mag:16, boss:true, special:"Napas Api" };
  startTacticalDuel(foe, {
    title:"Buru Naga", allowFlee:true,
    intro:"🐉 "+esc(foe.name)+" mengaum! Ini pertarungan hidup-mati. Perhatikan telegraf napasnya — BERTAHAN saat ia memusat!",
    onEnd:function(res){
      if(res.win){
        var g=ri(500,1100); C.coin+=g; C.reputation=(C.reputation||0)+40;
        addStat({might:5,mana:5,happy:12}); recordWin(60);
        awardLegacy(40,"menaklukkan naga");
        grantBelt("naga","Sabuk Penakluk Naga");
        try{ if(typeof addItem==="function"){ addItem("relic_dragon",1); } }catch(e){}
        var d=Dyn(); if(d){ var dd=d.get(); if(!dd.ach["penakluk_naga"]){ dd.ach["penakluk_naga"]=true; dd.legacy+=60; dd.earned+=60; d.save(); T("🏅 Prestasi: Penakluk Naga (+60 Warisan)"); } }
        showRes("🐉","NAGA TUMBANG!","e-epic","Legenda lahir! Kau menaklukkan <b>"+esc(foe.name)+"</b>. +"+coinFmt(g)+" keping, +40 reputasi, Sabuk Penakluk Naga, & pusaka naga.");
      } else if(res.fled){ addStat({happy:-5}); showRes("🏃","Kau Kabur dari Naga","e-bad","Bijak mundur untuk bertarung di hari lain."); }
      else { recordLoss(); var h=ri(25,45); addStat({health:-h}); showRes("💀","Dilalap Naga","e-death","Napas naga membakarmu. −"+h+" nyawa. Naga terlalu perkasa... untuk kini."); if(alive()&&C.stats.health<=0&&typeof die==="function") die("Tewas di cengkeraman naga."); }
      REFRESH(); renderArena();
    }
  });
}

/* ==================================================================
   LOMBA PANAH (archery — minigame ringan)
   ================================================================== */
function startPanah(){
  if(!alive()){ return; }
  if(!spend()){ T("Aksi tahun ini habis."); return; }
  var skill=(stat("mind")+stat("might"))/2;
  var round=0, score=0;
  function shot(){
    if(round>=3){
      var reward = score>=24?ri(180,300) : score>=15?ri(80,150) : ri(0,40);
      C.coin+=reward;
      if(score>=27){ recordWin(16); grantBelt("panah","Sabuk Pemanah Ulung"); }
      else if(score>=15) recordWin(6);
      else recordLoss();
      showRes("🏹","Lomba Panah Selesai","score"+score, "Skor akhir: <b>"+score+"/30</b>. Hadiah +"+coinFmt(reward)+" keping."+(score>=27?"<br>🏅 Sabuk Pemanah Ulung!":""));
      REFRESH(); renderArena(); return;
    }
    openChoice({ico:"🏹",cancel:false,prompt:"Anak panah "+(round+1)+"/3. Skor: "+score+"<br><span style='font-size:11px;color:var(--ink-soft);filter:brightness(1.6)'>Angin bertiup. Pilih bidikanmu:</span>",
      choices:[
        {label:"🎯 Bidik tengah",sub:"berisiko, poin besar",run:function(){ round++; var hit=rf(0,1)<(0.4+skill/220); var p=hit?ri(8,10):ri(0,4); score+=p; anim(hit?"win":"lose",{text:hit?"TELAK! +"+p:"meleset +"+p,dur:800}); setTimeout(shot,650); return null; }},
        {label:"🎯 Bidik aman",sub:"stabil, poin sedang",run:function(){ round++; var p=Math.min(10, Math.round(4+skill/25+ri(0,3))); score+=p; anim("coin",{text:"+"+p,dur:600}); setTimeout(shot,600); return null; }}
      ]});
  }
  shot();
}

/* ==================================================================
   TURNAMEN BARD (charm performance)
   ================================================================== */
function startBard(){
  if(!alive()){ return; }
  if(!spend()){ T("Aksi tahun ini habis."); return; }
  var round=0, approval=50;
  var MOVES=[
    {l:"🎵 Balada Sendu",base:8,sw:"charm"},
    {l:"🔥 Kidung Epik",base:6,sw:"might"},
    {l:"😂 Sindiran Jenaka",base:7,sw:"mind"}
  ];
  function perform(){
    if(round>=3){
      var reward = approval>=80?ri(150,260) : approval>=55?ri(60,120) : ri(0,30);
      C.coin+=reward; C.reputation=(C.reputation||0)+(approval>=80?12:approval>=55?5:0);
      if(approval>=90){ recordWin(16); grantBelt("bard","Mahkota Bard Agung"); }
      else if(approval>=55) recordWin(6); else recordLoss();
      showRes("🎻","Penampilan Selesai","e-good","Persetujuan penonton: <b>"+Math.round(approval)+"%</b>. Hadiah +"+coinFmt(reward)+" keping."+(approval>=90?"<br>🏅 Mahkota Bard Agung!":""));
      REFRESH(); renderArena(); return;
    }
    openChoice({ico:"🎻",cancel:false,prompt:"Babak "+(round+1)+"/3 · Persetujuan "+Math.round(approval)+"%<br><span style='font-size:11px;color:var(--ink-soft);filter:brightness(1.6)'>Pukau penonton — pilih pertunjukan:</span>",
      choices:MOVES.map(function(m){ return {label:m.l,run:function(){ round++; var bonus=stat(m.sw)/12; var delta=Math.round(m.base+bonus-8+rf(0,10)); approval=Math.max(0,Math.min(100,approval+delta)); anim(delta>=0?"win":"lose",{text:(delta>=0?"+":"")+delta+"% penonton",dur:750}); setTimeout(perform,600); return null; }}; })});
  }
  perform();
}

/* ==================================================================
   MINIGAME JUDI BARU (+ override openGambling)
   ================================================================== */
function bet(title,ico,cb){
  if(typeof betPrompt==="function"){ betPrompt(title,ico,cb); return; }
  var bets=[10,25,50,100].filter(function(b){return (C.coin||0)>=b;});
  if(!bets.length){ T("Koin tak cukup."); return; }
  if(typeof openChoice==="function") openChoice({ico:ico,prompt:title+"<br>Koin: "+C.coin,choices:bets.map(function(b){return {label:"Taruh "+b,run:function(){ cb(b); return null; }};})});
}
function done(msg,cls,animt,txt){ if(typeof finishAct==="function"){ finishAct(msg,cls,animt,txt); } else { LOG(msg,cls); REFRESH(); } }

// Blackjack / 21
function game21(){
  if(!spend()){ T("Aksi habis."); return; }
  bet("🂡 Angka Sakti (21) — dekati 21 tanpa lewat","🂡",function(b){
    C.coin-=b;
    var draw=function(){ return Math.min(11, ri(1,11)); };
    var me=[draw(),draw()], dealer=[draw()];
    var sum=function(a){ var s=a.reduce(function(x,y){return x+y;},0); var aces=a.filter(function(v){return v===11;}).length; while(s>21&&aces>0){ s-=10; aces--; } return s; };
    if(typeof closeModal==="function") closeModal();
    var step=function(){
      var ms=sum(me);
      if(ms>21){ settle(); return; }
      openChoice({ico:"🂡",cancel:false,prompt:"Kartumu: <b>"+me.join("+")+" = "+ms+"</b><br>Bandar buka: "+dealer[0]+"<br>Taruhan "+b,
        choices:[
          {label:"➕ Tarik (Hit)",run:function(){ me.push(draw()); if(sum(me)>21){ setTimeout(settle,120);} else setTimeout(step,120); return null; }},
          {label:"✋ Cukup (Stand)",run:function(){ setTimeout(settle,120); return null; }}
        ]});
    };
    var settle=function(){
      var ms=sum(me);
      while(sum(dealer)<17){ dealer.push(draw()); }
      var ds=sum(dealer);
      if(typeof closeModal==="function") closeModal();
      if(ms>21){ done("🂡 Kau melewati 21 ("+ms+"). Kalah "+b+".","e-bad","lose"); }
      else if(ms===21 && me.length===2){ var g=Math.round(b*2.5); C.coin+=g; done("🂡 BLACKJACK! ("+ms+") Menang +"+g+"!","e-epic","win","BLACKJACK"); }
      else if(ds>21 || ms>ds){ var w=b*2; C.coin+=w; done("🂡 Kau "+ms+" vs bandar "+ds+". MENANG +"+w+"!","e-epic","win"); }
      else if(ms===ds){ C.coin+=b; done("🂡 Seri ("+ms+"). Taruhan kembali.","e-good"); }
      else { done("🂡 Kau "+ms+" vs bandar "+ds+". Kalah "+b+".","e-bad","lose"); }
    };
    step();
  });
}
// Roda Takdir (wheel)
function gameWheel(){
  if(!spend()){ T("Aksi habis."); return; }
  bet("☸️ Roda Takdir — putar untuk pengganda","☸️",function(b){
    C.coin-=b; if(typeof closeModal==="function") closeModal(); anim("dice",{text:"☸️",dur:900});
    setTimeout(function(){
      var seg=[[0,0.16],[0.5,0.18],[1,0.20],[2,0.24],[3,0.13],[5,0.07],[10,0.02]];
      var r=Math.random(), acc=0, mult=0;
      for(var i=0;i<seg.length;i++){ acc+=seg[i][1]; if(r<=acc){ mult=seg[i][0]; break; } }
      var g=Math.round(b*mult);
      if(mult>=5){ C.coin+=g; done("☸️ Roda berhenti di ×"+mult+" — JACKPOT +"+g+"!","e-epic","win","×"+mult); }
      else if(mult>=1){ C.coin+=g; done("☸️ Roda ×"+mult+". "+(mult===1?"Taruhan kembali.":"Menang +"+g+"!"),"e-good","win"); }
      else { done("☸️ Roda ×"+mult+". Kalah "+(b-g)+".","e-bad","lose"); }
    },900);
  });
}
// Tebak Cangkir (cups, ladder)
function gameCups(prevWin){
  if(prevWin===undefined){ if(!spend()){ T("Aksi habis."); return; } }
  var stake=prevWin||0;
  var play=function(b){
    if(!prevWin){ C.coin-=b; stake=b; }
    if(typeof closeModal==="function") closeModal();
    var gem=ri(0,2);
    openChoice({ico:"🥤",cancel:false,prompt:"🥤🥤🥤 Permata di bawah salah satu cangkir. Taruhan "+coinFmt(stake)+".<br>Tebak (peluang ~"+(Math.round((0.34+stat("mind")/500)*100))+"%):",
      choices:[0,1,2].map(function(i){ return {label:"Cangkir "+(i+1),run:function(){
        if(typeof closeModal==="function") closeModal();
        var win = (i===gem) || ch(stat("mind")/900);
        if(win){ var g=Math.round(stake*2.6); done("🥤 Benar! Permata di cangkir "+(gem+1)+". Menang "+coinFmt(g)+"!","e-epic","win"); setTimeout(function(){ cupLadder(g); },500); }
        else { done("🥤 Salah! Permata di cangkir "+(gem+1)+". Kehilangan "+coinFmt(stake)+".","e-bad","lose"); REFRESH(); }
        return null;
      }}; })});
  };
  if(prevWin){ play(); } else { bet("🥤 Tebak Cangkir — permata di antara 3 cangkir","🥤",play); }
}
function cupLadder(winnings){
  C.coin+=winnings;
  if(typeof openChoice!=="function") return;
  openChoice({ico:"🥤",cancel:false,prompt:"Kau pegang <b>"+coinFmt(winnings)+" keping</b>. Pertaruhkan lagi untuk ×2.6, atau simpan?",
    choices:[
      {label:"🔁 Gandakan (risiko)",cls:"love",run:function(){ C.coin-=winnings; setTimeout(function(){ gameCups(winnings); },120); return null; }},
      {label:"💰 Simpan "+coinFmt(winnings),run:function(){ REFRESH(); return {t:"Kau menyimpan "+coinFmt(winnings)+" keping.",cls:"e-good"}; }}
    ]});
}
// Double or Nothing (coin ladder)
function gameDouble(){
  if(!spend()){ T("Aksi habis."); return; }
  bet("🪙 Lipat Ganda — lempar koin, menang ×2 beruntun","🪙",function(b){
    C.coin-=b;
    var pot=b*2, round=1;
    var flip=function(){
      if(typeof closeModal==="function") closeModal();
      openChoice({ico:"🪙",cancel:false,prompt:"Putaran "+round+" · Pot: <b>"+coinFmt(pot)+"</b>.<br>Lempar lagi (×2) atau ambil?",
        choices:[
          {label:"🪙 Lempar (50/50)",cls:"love",run:function(){ if(typeof closeModal==="function") closeModal(); anim("coin",{text:"🪙",dur:600}); setTimeout(function(){
              if(ch(0.5-(round*0.01))){ pot*=2; round++; done("🪙 Sisi keberuntungan! Pot jadi "+coinFmt(pot)+".","e-good",null); setTimeout(flip,250); }
              else { done("🪙 Sisi sial! Kau kehilangan seluruh pot "+coinFmt(pot/2)+".","e-bad","lose"); REFRESH(); }
            },600); return null; }},
          {label:"💰 Ambil "+coinFmt(pot),run:function(){ C.coin+=pot; done("🪙 Kau mengambil "+coinFmt(pot)+" keping.","e-epic","win"); return null; }}
        ]});
    };
    flip();
  });
}
// Mesin Rune (3-reel slot)
function gameRune(){
  if(!spend()){ T("Aksi habis."); return; }
  bet("🎰 Mesin Rune — cocokkan 3 gulungan","🎰",function(b){
    C.coin-=b; if(typeof closeModal==="function") closeModal(); anim("dice",{text:"🎰",dur:900});
    setTimeout(function(){
      var S=["🔥","⚡","🌙","💎","⭐","🍀"];
      var r=[pick(S),pick(S),pick(S)];
      var g=0, cls="e-bad", txt="";
      if(r[0]===r[1] && r[1]===r[2]){ var m = r[0]==="💎"?25 : r[0]==="⭐"?12 : 8; g=b*m; cls="e-epic"; txt="TRIPEL "+r[0]+"! ×"+m; }
      else if(r[0]===r[1] || r[1]===r[2] || r[0]===r[2]){ g=Math.round(b*1.5); cls="e-good"; txt="pasangan"; }
      var line=r.join(" ");
      if(g>0){ C.coin+=g; done("🎰 "+line+" — "+txt+" +"+coinFmt(g)+"!",cls,"win",txt); }
      else { done("🎰 "+line+" — tak cocok. Kalah "+b+".","e-bad","lose"); }
    },900);
  });
}

// override openGambling: gabungkan game lama + baru
if(typeof window.openGambling==="function"){
  window.openGambling=function(){
    if(typeof openChoice!=="function") return;
    openChoice({ico:"🎲",cancel:true,prompt:"<b>Sarang Judi</b> — pilih permainan:",
      choices:[
        {label:"🎲 Dadu Hazard",sub:"tebak 2 dadu",run:function(){ if(typeof closeModal==="function")closeModal(); setTimeout(function(){ if(typeof diceGame==="function") diceGame(); },140); return null; }},
        {label:"🃏 Kartu Tinggi",sub:"adu vs bandar",run:function(){ if(typeof closeModal==="function")closeModal(); setTimeout(function(){ if(typeof cardGame==="function") cardGame(); },140); return null; }},
        {label:"🂡 Angka Sakti (21)",sub:"blackjack hit/stand",run:function(){ if(typeof closeModal==="function")closeModal(); setTimeout(game21,140); return null; }},
        {label:"☸️ Roda Takdir",sub:"putar pengganda",run:function(){ if(typeof closeModal==="function")closeModal(); setTimeout(gameWheel,140); return null; }},
        {label:"🥤 Tebak Cangkir",sub:"ladder ×2.6",run:function(){ if(typeof closeModal==="function")closeModal(); setTimeout(function(){ gameCups(); },140); return null; }},
        {label:"🪙 Lipat Ganda",sub:"double-or-nothing",run:function(){ if(typeof closeModal==="function")closeModal(); setTimeout(gameDouble,140); return null; }},
        {label:"🎰 Mesin Rune",sub:"slot 3 gulungan",run:function(){ if(typeof closeModal==="function")closeModal(); setTimeout(gameRune,140); return null; }}
      ]});
  };
}

/* ==================================================================
   OVERLAY ARENA (FAB ⚔️ + tab)
   ================================================================== */
var arenaTab="Duel";
function injectArenaStyle(){
  if(document.getElementById("arena-style")) return;
  var css=
  ".exp-fab.arena{top:calc(var(--app-safe-top,env(safe-area-inset-top,0px)) + 56px);}"
  +".btl-panel{height:auto;max-height:94vh;}"
  +".btl-stage{display:flex;align-items:stretch;justify-content:space-between;gap:8px;padding:8px 14px 4px;}"
  +".btl-foe,.btl-me{flex:1;min-width:0;text-align:center;}"
  +".btl-vs{align-self:center;font-size:16px;color:var(--gold);opacity:.6;}"
  +".btl-ava{font-size:40px;line-height:1;transition:transform .12s;display:inline-block;}"
  +".btl-ava.hit{animation:btlHit .26s;}"
  +"@keyframes btlHit{0%{transform:translateX(0)}25%{transform:translateX(-6px) scale(1.1)}50%{transform:translateX(6px)}100%{transform:translateX(0)}}"
  +".btl-name{font-size:12px;font-weight:700;margin:4px 0 6px;color:var(--parchment);}"
  +".btl-bar{position:relative;height:12px;border-radius:7px;background:rgba(0,0,0,.45);overflow:hidden;margin:4px 0;border:1px solid var(--line);}"
  +".btl-fill{height:100%;border-radius:7px;transition:width .35s cubic-bezier(.4,0,.2,1);}"
  +".hpf{background:linear-gradient(90deg,#7a1f2b,#e0524a);}"
  +".staf{background:linear-gradient(90deg,#5a3a1a,#d4af37);}"
  +".manaf{background:linear-gradient(90deg,#3a2c6e,#8b9cff);}"
  +".btl-num{position:absolute;right:5px;top:-1px;font-size:8.5px;color:#fff;font-weight:700;text-shadow:0 1px 2px #000;font-family:sans-serif;}"
  +".btl-lab{position:absolute;left:5px;top:-1px;font-size:7.5px;color:rgba(255,255,255,.8);font-weight:700;letter-spacing:.05em;font-family:sans-serif;}"
  +".btl-warn{font-size:10px;color:var(--bad);font-weight:700;margin-top:6px;min-height:12px;animation:btlPulse 1s infinite;}"
  +"@keyframes btlPulse{0%,100%{opacity:1}50%{opacity:.5}}"
  +".btl-logbox{margin:6px 14px;padding:8px 10px;background:rgba(12,8,4,.55);border:1px solid var(--line);border-radius:10px;height:120px;overflow-y:auto;display:flex;flex-direction:column-reverse;}"
  +".btl-line{font-size:11.5px;line-height:1.5;padding:2px 0;border-bottom:1px solid rgba(184,134,11,.07);}"
  +".btl-line.good{color:var(--good);} .btl-line.bad{color:var(--bad);}"
  +".btl-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px 14px calc(env(safe-area-inset-bottom,0px) + 16px);}"
  +".btl-act{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:10px 12px;border-radius:12px;border:1px solid var(--gold);background:linear-gradient(155deg,var(--card),var(--bg1));color:var(--parchment);font-family:inherit;cursor:pointer;transition:transform .1s;}"
  +".btl-act:active{transform:scale(.96);}"
  +".btl-act.dis{opacity:.4;pointer-events:none;}"
  +".btl-act.flee{grid-column:1/-1;border-color:var(--line);align-items:center;flex-direction:row;justify-content:center;gap:8px;}"
  +".ba-ic{font-size:18px;} .ba-l{font-size:13px;font-weight:700;} .ba-s{font-size:8.5px;color:var(--ink-soft);filter:brightness(1.7);}";
  var st=document.createElement("style"); st.id="arena-style"; st.textContent=css; document.head.appendChild(st);
}
function buildArenaFab(){
  if(document.getElementById("arenaFab")) return;
  injectArenaStyle();
  var b=document.createElement("button");
  b.id="arenaFab"; b.className="exp-fab arena"; b.setAttribute("aria-label","Arena Laga");
  b.innerHTML="⚔️";
  b.onclick=openArena;
  document.body.appendChild(b);
  var ov=document.createElement("div");
  ov.id="arenaOverlay"; ov.className="exp-ov";
  ov.innerHTML="<div class='exp-panel'><div class='exp-head'><span class='exp-title'>⚔️ ARENA LAGA</span>"
    +"<span class='exp-crystals' id='arenaRank'></span>"
    +"<button class='exp-x' onclick='arenaClose()'>✕</button></div>"
    +"<div class='exp-tabs' id='arenaTabs'></div><div class='exp-body' id='arenaBody'></div></div>";
  ov.addEventListener("click",function(e){ if(e.target===ov) arenaClose(); });
  document.body.appendChild(ov);
}
var ARENA_TABS=[["Duel","⚔️"],["Lomba","🏟️"],["Judi","🎲"],["Peringkat","🏅"]];
function renderArenaTabs(){
  var host=document.getElementById("arenaTabs"); if(!host) return;
  host.innerHTML=ARENA_TABS.map(function(t){
    // terikat lokasi: Judi hanya di Saltmoor (18+); Duel & Lomba hanya di Colosseum Aurelia
    var lock="";
    if(t[0]==="Judi"&&(typeof C==="undefined"||!C||C.age<18||C.cityId!=="saltmoor"))lock=" 🔒";
    if((t[0]==="Duel"||t[0]==="Lomba")&&(typeof C==="undefined"||!C||C.cityId!=="aetheria"))lock=" 🔒";
    return "<button class='exp-tab "+(arenaTab===t[0]?"on":"")+"' onclick=\"arenaGo('"+t[0]+"')\">"+t[1]+" "+t[0]+lock+"</button>"; }).join("");
}
window.openArena=function(){ buildArenaFab(); document.getElementById("arenaOverlay").classList.add("show"); renderArenaTabs(); renderArena(); };
window.arenaClose=function(){ var o=document.getElementById("arenaOverlay"); if(o) o.classList.remove("show"); };
window.arenaGo=function(t){ arenaTab=t; renderArenaTabs(); renderArena(); };

function itemCard(ico,name,desc,btnLabel,fn,dis){
  return "<div class='exp-card'><div class='exp-row'><div class='exp-ico'>"+ico+"</div>"
    +"<div style='flex:1;min-width:0'><div class='exp-name'>"+name+"</div><div class='exp-desc'>"+desc+"</div></div>"
    +"<button class='exp-btn "+(dis?"dis":"")+"' onclick=\""+fn+"\">"+btnLabel+"</button></div></div>";
}
function renderArena(){
  var body=document.getElementById("arenaBody"); if(!body) return;
  var rk=document.getElementById("arenaRank");
  if(alive()){ var a=A(); if(rk) rk.textContent="🏅 "+rankTitle(a.points)+(a.streak>1?(" · 🔥"+a.streak):""); }
  else if(rk) rk.textContent="";
  if(!alive()){ body.innerHTML="<div class='exp-empty'>⚔️<br>Arena menanti jiwa yang hidup.<br>Mulai atau lanjutkan sebuah kehidupan.</div>"; return; }
  var _atColosseum=(C.cityId==="aetheria");
  var _lockColo="<div class='exp-empty'>🏟️<br>Duel & lomba digelar di <b>Colosseum Aurelia</b>, Aetheria.<br>Berangkatlah ke ibukota lewat Peta.<br><br><button class='exp-btn' onclick=\"arenaClose();switchTab('Peta')\">🗺️ Buka Peta</button></div>";
  if(arenaTab==="Duel") body.innerHTML=_atColosseum?viewArenaDuel():_lockColo;
  else if(arenaTab==="Lomba") body.innerHTML=_atColosseum?viewArenaLomba():_lockColo;
  else if(arenaTab==="Judi"){
    // KOHERENSI DUNIA: meja judi hanya ada di Sarang Judi, Saltmoor — dan khusus 18+
    if(C.age<18)
      body.innerHTML="<div class='exp-empty'>🎲<br>Sarang Judi khusus 18 tahun ke atas.<br>Penjaga pintu menggelengkan kepala.</div>";
    else if(C.cityId!=="saltmoor")
      body.innerHTML="<div class='exp-empty'>🎲<br>Meja judi hanya ada di <b>Sarang Judi, Saltmoor</b> ⚓<br>Berlayarlah ke sana lewat Peta.<br><br><button class='exp-btn' onclick=\"arenaClose();switchTab('Peta')\">🗺️ Buka Peta</button></div>";
    else body.innerHTML=viewArenaJudi();
  }
  else if(arenaTab==="Peringkat") body.innerHTML=viewArenaRank();
}
function viewArenaDuel(){
  var h="<div class='exp-desc' style='margin:4px 2px 10px'>Pertarungan giliran: pilih Serang, Sihir, Bertahan, atau Tipu. Kelola stamina & mana, pancing kritikal, dan baca gerakan lawan.</div>";
  if(C._rival){ h+="<div class='exp-sec'>Rivalmu</div>"+itemCard(C._rival.female?"🦹‍♀️":"🦹‍♂️","Duel "+esc(C._rival.name),"Tingkat "+(C._rival.level||1)+" · permusuhan "+(C._rival.hostility||0)+"% · bisa pasang taruhan","Duel","arenaClose();expDuelRival()"); }
  else h+="<div class='exp-sec'>Rivalmu</div><div class='exp-card'><div class='exp-desc' style='text-align:center;padding:6px'>Belum ada rival. Jalani hidup — takdir akan menautkanmu.</div></div>";
  h+="<div class='exp-sec'>Arena Bertahan</div>"+itemCard("🏟️","Gauntlet Gelombang","Lawan gelombang demi gelombang, hadiah menumpuk. Kabur kapan saja untuk mengamankannya. (biaya masuk 20)","Masuk","arenaClose();arenaStartGauntlet()");
  var a=A(); if(a.gauntletBest) h+="<div class='exp-desc' style='text-align:center'>Rekor gelombang terjauh: <b>"+a.gauntletBest+"</b></div>";
  return h;
}
function viewArenaLomba(){
  var h="<div class='exp-desc' style='margin:4px 2px 10px'>Uji keahlian di berbagai lomba. Menang memberi keping, reputasi, sabuk juara & Warisan Jiwa.</div>";
  h+="<div class='exp-sec'>Duel Keahlian</div>";
  h+=itemCard("🔮","Adu Sihir","Duel mantra melawan penyihir. Perlu Mana ≥ 20.","Mulai","arenaClose();arenaStartSihir()", stat("mana")<20);
  h+=itemCard("🏹","Lomba Panah","3 tembakan — bidik tengah (risiko) atau aman.","Mulai","arenaClose();arenaStartPanah()");
  h+=itemCard("🎻","Turnamen Bard","Pukau penonton lewat 3 penampilan (Pesona).","Mulai","arenaClose();arenaStartBard()");
  h+=itemCard("🧹","Balap Sapu Terbang","Minigame: ketuk untuk mengepak, terbang lewati gerbang arcane! Hadiah per gerbang.","Terbang","arenaClose();startBroomRace()", C.age<10);
  h+="<div class='exp-sec'>Perburuan Legenda</div>";
  var canNaga = C.age>=18 && (stat("might")+stat("mana"))>=70;
  h+=itemCard("🐉","Buru Naga","Boss bertahap — telegraf napas api, BERTAHAN saat memusat. Hadiah legendaris. Perlu usia 18+ & Might+Mana ≥ 70."+(canNaga?"":" <span style='color:var(--bad)'>(belum memenuhi syarat)</span>"),"Buru","arenaClose();arenaStartNaga()", !canNaga);
  return h;
}
function viewArenaJudi(){
  var h="<div class='exp-desc' style='margin:4px 2px 10px'>Sarang judi cepat. Peringatan: keberuntungan bisa berbalik — main secukupnya.</div>";
  h+=itemCard("🂡","Angka Sakti (21)","Blackjack: tarik/berhenti, dekati 21.","Main","arenaClose();arenaG21()");
  h+=itemCard("☸️","Roda Takdir","Putar roda pengganda hingga ×10.","Main","arenaClose();arenaGWheel()");
  h+=itemCard("🥤","Tebak Cangkir","Tebak permata, gandakan ×2.6 beruntun.","Main","arenaClose();arenaGCups()");
  h+=itemCard("🪙","Lipat Ganda","Double-or-nothing — nyali diuji.","Main","arenaClose();arenaGDouble()");
  h+=itemCard("🎰","Mesin Rune","Slot 3 gulungan, tripel 💎 jackpot ×25.","Main","arenaClose();arenaGRune()");
  return h;
}
function viewArenaRank(){
  var a=A(); var da=DA();
  var h="<div class='exp-hero'><div class='lg' style='font-size:18px'>🏅 "+rankTitle(a.points)+"</div><div class='lb'>Peringkat Arena</div>"
    +"<div class='sub'>Poin "+coinFmt(a.points)+" · Menang "+a.wins+" · Runtun terbaik 🔥"+a.bestStreak+"</div></div>";
  // progress ke rank berikut
  var next=null; for(var i=0;i<RANKS.length;i++){ if(a.points<RANKS[i][0]){ next=RANKS[i]; break; } }
  if(next){ var prevP=0; for(var j=0;j<RANKS.length;j++){ if(RANKS[j][0]<=a.points) prevP=RANKS[j][0]; } var pct=Math.round((a.points-prevP)/(next[0]-prevP)*100);
    h+="<div class='exp-card'><div class='exp-desc'>Menuju <b>"+next[1]+"</b> ("+a.points+"/"+next[0]+")</div><div class='exp-pbar'><div class='exp-pfill' style='width:"+pct+"%'></div></div></div>"; }
  h+="<div class='exp-sec'>Runtun Kemenangan</div><div class='exp-card'><div class='exp-desc' style='text-align:center'>Runtun saat ini: <b style='color:var(--gold-bright)'>🔥 "+a.streak+"</b> · pengganda hadiah ×"+streakMult().toFixed(2)+"</div></div>";
  h+="<div class='exp-sec'>Sabuk Juara ("+a.belts.length+")</div>";
  var BELT={gauntlet:"🏟️ Sabuk Sang Bertahan",arcane:"🔮 Sabuk Arkana",naga:"🐉 Sabuk Penakluk Naga",panah:"🏹 Sabuk Pemanah Ulung",bard:"🎻 Mahkota Bard Agung"};
  if(a.belts.length){ h+="<div class='exp-grid'>"+a.belts.map(function(id){ return "<div class='exp-ach'><div class='ai'>"+(BELT[id]||"🏅").split(" ")[0]+"</div><div class='an'>"+((BELT[id]||"Sabuk").split(" ").slice(1).join(" "))+"</div></div>"; }).join("")+"</div>"; }
  else h+="<div class='exp-card'><div class='exp-desc' style='text-align:center;padding:6px'>Belum ada sabuk. Menangkan gauntlet, adu sihir, panah, bard, atau buru naga untuk merebutnya.</div></div>";
  if(da && da.champions && da.champions.length){ h+="<div class='exp-sec'>Balai Juara Dinasti</div>"; da.champions.slice(0,8).forEach(function(c){ h+="<div class='exp-card'><div class='exp-row'><div class='exp-ico'>👑</div><div style='flex:1'><div class='exp-name'>"+esc(c.name)+"</div><div class='exp-desc'>"+esc(c.belt)+" · usia "+c.age+"</div></div></div></div>"; }); }
  return h;
}

// wire tombol arena
window.arenaStartGauntlet=function(){ startGauntlet(0,0); };
window.arenaStartSihir=function(){ startAduSihir(); };
window.arenaStartPanah=function(){ startPanah(); };
window.arenaStartBard=function(){ startBard(); };
window.arenaStartNaga=function(){ startBuruNaga(); };
window.arenaG21=function(){ game21(); };
window.arenaGWheel=function(){ gameWheel(); };
window.arenaGCups=function(){ gameCups(); };
window.arenaGDouble=function(){ gameDouble(); };
window.arenaGRune=function(){ gameRune(); };
window.MantaraArena={ startTacticalDuel:startTacticalDuel, startGauntlet:startGauntlet, startBuruNaga:startBuruNaga, A:A };

/* ---------------- boot ---------------- */
function bootArena(){ try{ injectArenaStyle(); buildArenaFab(); }catch(e){} }
if(document.readyState!=="loading") setTimeout(bootArena,120);
else document.addEventListener("DOMContentLoaded", function(){ setTimeout(bootArena,120); });

})();
