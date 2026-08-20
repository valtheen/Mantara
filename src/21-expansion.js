/* ==================================================================
   MANTARA — EKSPANSI TAKDIR
   Dinasti (meta-progres) • Berkah Harian • Sosial & Takdir • Optimasi
   Modul mandiri. Di-append di akhir <script>; memonkeypatch fungsi global.
   ================================================================== */
(function(){
"use strict";
if(window.__MANTARA_EXP__) return;
window.__MANTARA_EXP__ = true;

/* ------------------------------------------------------------------ */
/*  UTIL AMAN                                                          */
/* ------------------------------------------------------------------ */
var LS = {
  get: function(k,d){ try{ var v=localStorage.getItem(k); return v?JSON.parse(v):d; }catch(e){ return d; } },
  set: function(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} }
};
function cl(v){ return Math.max(0, Math.min(100, Math.round(v))); }
function ri(a,b){ return Math.floor(Math.random()*(b-a+1))+a; }
function pick(a){ return a[Math.floor(Math.random()*a.length)]; }
function ch(p){ return Math.random()<p; }
function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]);}); }
function T(m){ try{ if(typeof toast==="function") toast(m); }catch(e){} }
function LOG(t,c){ try{ if(typeof log==="function" && typeof C!=="undefined" && C) log(C.age, t, c||""); }catch(e){} }
function alive(){ return typeof C!=="undefined" && C && C.alive; }
function hasC(){ return typeof C!=="undefined" && C; }
function REFRESH(){ try{ if(typeof renderAll==="function") renderAll(); else if(typeof render==="function") render(); }catch(e){} }
function modalOpen(){ var m=document.getElementById("modal"); return !!(m && m.classList && m.classList.contains("show")); }
function stat(k){ return (hasC() && C.stats && typeof C.stats[k]==="number") ? C.stats[k] : 0; }
function addStat(o){ try{ if(typeof applyStats==="function") applyStats(o); }catch(e){} }
function todayStr(){ var d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
function daysBetween(a,b){ // a,b = "YYYY-MM-DD"
  try{ var da=new Date(a+"T00:00:00"), db=new Date(b+"T00:00:00"); return Math.round((db-da)/86400000); }catch(e){ return 999; }
}
function coinFmt(n){ return (n||0).toLocaleString("id-ID"); }

/* ------------------------------------------------------------------ */
/*  PENYIMPANAN DINASTI (persist antar-kehidupan)                      */
/* ------------------------------------------------------------------ */
var DKEY = "mantara_dynasty_v1";
var Dyn = {
  d: null,
  load: function(){
    this.d = LS.get(DKEY, null) || {
      legacy:0, earned:0, crystals:0, perks:{}, ascension:0,
      lives:0, best:{age:0,coin:0,gen:0,rep:0,networth:0}, hall:[], ach:{}, rivals:0
    };
    if(!this.d.best) this.d.best={age:0,coin:0,gen:0,rep:0,networth:0};
    if(!this.d.perks) this.d.perks={};
    if(!this.d.hall) this.d.hall=[];
    if(!this.d.ach) this.d.ach={};
    if(typeof this.d.rivals!=="number") this.d.rivals=0;
    return this.d;
  },
  save: function(){ LS.set(DKEY, this.d); },
  get: function(){ if(!this.d) this.load(); return this.d; }
};
Dyn.load();
function pv(id){ return Dyn.get().perks[id]||0; }         // level perk
function bloodlineBonus(){ return Math.min(10, Math.floor(Dyn.get().lives/3)); }
function asc(){ return Dyn.get().ascension; }

/* ---------- Pohon Warisan (perk permanen) ---------- */
var PERKS = [
  {id:"warisan_emas",  cat:"Harta", ico:"💰", name:"Harta Leluhur",  max:8, desc:"Mulai hidup dengan +150 keping / tingkat.",         cost:function(l){return 20+l*25;}},
  {id:"tuah_dagang",   cat:"Harta", ico:"⚖️", name:"Tuah Dagang",    max:6, desc:"+18 keping pasif tiap tahun / tingkat.",           cost:function(l){return 35+l*35;}},
  {id:"darah_juara",   cat:"Raga",  ico:"⚔️", name:"Darah Juara",    max:6, desc:"+3 Kekuatan awal / tingkat.",                       cost:function(l){return 30+l*30;}},
  {id:"raga_tangguh",  cat:"Raga",  ico:"❤️", name:"Raga Tangguh",   max:6, desc:"+4 Nyawa awal & +1 Nyawa/tahun / tingkat.",         cost:function(l){return 30+l*30;}},
  {id:"benak_bijak",   cat:"Raga",  ico:"📖", name:"Benak Bijak",    max:6, desc:"+3 Akal awal / tingkat.",                            cost:function(l){return 30+l*30;}},
  {id:"nadi_arcane",   cat:"Arcane",ico:"🔮", name:"Nadi Arcane",    max:6, desc:"+3 Mana awal / tingkat.",                            cost:function(l){return 35+l*35;}},
  {id:"pesona_bangsawan",cat:"Arcane",ico:"💠",name:"Pesona Bangsawan",max:6,desc:"+3 Pesona awal / tingkat.",                          cost:function(l){return 30+l*30;}},
  {id:"restu_leluhur", cat:"Takdir",ico:"✋", name:"Restu Leluhur",  max:4, desc:"Berkah leluhur: keberuntungan kecil tiap tahun / tingkat.",               cost:function(l){return 60+l*60;}},
  {id:"mata_takdir",   cat:"Takdir",ico:"👁️", name:"Mata Takdir",   max:5, desc:"+Keberuntungan di Kartu Takdir & duel.",           cost:function(l){return 45+l*45;}},
  {id:"berkat_umur",   cat:"Takdir",ico:"⏳", name:"Berkat Umur",    max:5, desc:"+2 Nyawa/tahun setelah tua (perlambat maut).",     cost:function(l){return 40+l*45;}},
  {id:"karisma_waris", cat:"Takdir",ico:"🌟", name:"Karisma Waris",  max:5, desc:"+12% perolehan Warisan Jiwa / tingkat.",            cost:function(l){return 50+l*55;}}
];
function perkById(id){ for(var i=0;i<PERKS.length;i++) if(PERKS[i].id===id) return PERKS[i]; return null; }

/* ---------- terapkan perk ke karakter baru ---------- */
function applyDynastyPerks(addCoin){
  if(!hasC()) return;
  var bb = bloodlineBonus();
  var a  = asc();
  C.stats.might = cl(C.stats.might + pv("darah_juara")*3 + bb + a);
  C.stats.mind  = cl(C.stats.mind  + pv("benak_bijak")*3 + bb + a);
  C.stats.mana  = cl(C.stats.mana  + pv("nadi_arcane")*3 + bb + a);
  C.stats.charm = cl(C.stats.charm + pv("pesona_bangsawan")*3 + bb + a);
  C.stats.health= cl(C.stats.health+ pv("raga_tangguh")*4 + a);
  if(addCoin) C.coin = (C.coin||0) + perkCoinBonus();
  C._perkAction = pv("restu_leluhur");
  C._perkIncome = pv("tuah_dagang")*18;
  C._perkLong   = pv("raga_tangguh") + pv("berkat_umur")*2;
  C._perkLuck   = pv("mata_takdir") + a;
}
function perkCoinBonus(){ return pv("warisan_emas")*150; }
function legacyMult(){ return 1 + pv("karisma_waris")*0.12 + asc()*0.25; }
function luck(){ return (hasC() && C._perkLuck) ? C._perkLuck : 0; }

/* ------------------------------------------------------------------ */
/*  STATE PER-KARAKTER (rival, faksi, takdir)                          */
/* ------------------------------------------------------------------ */
function ensureCharExp(reset){
  if(!hasC()) return;
  if(reset || !C._expInit){
    C._faction = reset ? null : (C._faction||null);
    C._rival   = reset ? null : (C._rival||null);
    C._fate    = reset ? {} : (C._fate||{});
    C._rivalsBeat = reset ? 0 : (C._rivalsBeat||0);
    C._fateAges  = reset ? [] : (C._fateAges||[]);
    C._destinyCount = reset ? 0 : (C._destinyCount||0);
    C._expInit = true;
  }
  if(!C._faction && C._faction!==null) C._faction=null;
  if(!C._fate) C._fate={};
  if(!C._fateAges) C._fateAges=[];
}

/* ------------------------------------------------------------------ */
/*  FAKSI / GUILD                                                      */
/* ------------------------------------------------------------------ */
var FACTIONS = {
  arcanum:  {name:"Ordo Arcanum",   ico:"🔮", desc:"Persaudaraan penyihir & cendekia arcane.",   stat:"mana",  color:"var(--arcane-glow)"},
  serikat:  {name:"Serikat Dagang", ico:"⚖️", desc:"Jaringan saudagar & rentenir lintas kota.",  stat:"coin",  color:"var(--gold-bright)"},
  baja:     {name:"Kesatria Baja",  ico:"🛡️", desc:"Ordo kehormatan para petarung & pelindung.", stat:"might", color:"#d0a060"},
  bayangan: {name:"Sekte Bayangan", ico:"🗡️", desc:"Sindikat mata-mata, licik & tak terlihat.",  stat:"charm", color:"#b07ad0"}
};
var FACTION_RANKS = ["Rekrut","Anggota","Ksatria","Tetua","Pemimpin Agung"];
function factionRank(rep){ return Math.min(4, Math.floor(rep/25)); } // 0..4 pada rep 0,25,50,75,100
function joinFaction(id){
  if(!alive()){ T("Belum ada kehidupan yang berjalan."); return; }
  if(C.age<15){ T("Harus berusia 15+ untuk bergabung faksi."); return; }
  if(C._faction){ T("Kau sudah terikat pada satu faksi."); return; }
  C._faction = {id:id, rep:5, rank:0};
  var f=FACTIONS[id];
  LOG("Kau bersumpah setia pada "+f.name+" "+f.ico+".","e-arcane");
  T(f.ico+" Bergabung dengan "+f.name);
  if(typeof updateTitle==="function") updateTitle();
  EXP.emit("faction",5);
  REFRESH(); renderExp();
}
function leaveFaction(){
  if(!alive() || !C._faction) return;
  var f=FACTIONS[C._faction.id];
  LOG("Kau meninggalkan "+f.name+". Reputasi faksi hangus.","e-bad");
  C._faction=null; T("Kau keluar dari faksi.");
  REFRESH(); renderExp();
}
function serveFaction(){
  if(!alive() || !C._faction){ T("Kau belum punya faksi."); return; }
  if(typeof spendAction==="function" && !spendAction()){ T("Aksi tahun ini habis."); return; }
  var f=FACTIONS[C._faction.id];
  var gain=ri(6,12)+Math.floor(stat(f.stat==="coin"?"charm":f.stat)/20);
  gainFactionRep(gain);
  var sb={}; if(f.stat!=="coin"){ sb[f.stat]=ri(1,3); addStat(sb);} else { C.coin+=ri(20,60); }
  LOG("Kau menjalankan tugas untuk "+f.name+" (+"+gain+" reputasi faksi).","e-good");
  T(f.ico+" +"+gain+" reputasi "+f.name);
  REFRESH(); renderExp();
}
function gainFactionRep(n){
  if(!alive() || !C._faction) return;
  var before=factionRank(C._faction.rep);
  C._faction.rep=Math.min(100, C._faction.rep+n);
  var after=factionRank(C._faction.rep);
  EXP.emit("faction", n);
  if(after>before){
    C._faction.rank=after;
    var f=FACTIONS[C._faction.id];
    var reward=100+after*150;
    C.coin+=reward;
    if(typeof updateTitle==="function") updateTitle();
    LOG("⬆ Kau naik pangkat "+f.name+" menjadi "+FACTION_RANKS[after]+"! (+"+reward+" keping)","e-epic");
    T("⬆ Pangkat baru: "+FACTION_RANKS[after]);
    if(after===4) unlockAch("legenda_faksi");
    if(typeof playSFX==="function") try{ playSFX("win"); }catch(e){}
  }
}
function factionYearly(){
  if(!alive() || !C._faction) return;
  var f=FACTIONS[C._faction.id], r=C._faction.rank+1;
  if(f.stat==="coin"){ C.coin += 8*r; }
  else { var o={}; o[f.stat]= (ch(0.6)?1:0)*r>0?1:0; if(ch(0.55)){ o[f.stat]=1; addStat(o);} }
}

/* ------------------------------------------------------------------ */
/*  RIVAL / NEMESIS                                                    */
/* ------------------------------------------------------------------ */
function spawnRival(){
  if(!alive() || C._rival) return;
  var female=ch(0.5);
  var FM=(typeof FIRST_F!=="undefined"&&typeof FIRST_M!=="undefined")?(female?FIRST_F:FIRST_M):["Kael","Vex","Mora","Sable"];
  var SN=(typeof SURNAME!=="undefined")?SURNAME:["Duskbane","Vexley"];
  var name=pick(FM)+" "+pick(SN);
  var base=Math.max(20, Math.round((stat("might")+stat("mana")+stat("mind"))/3));
  C._rival={
    name:name, female:female, level:1,
    might: cl(base+ri(-5,10)), mana: cl(base+ri(-8,8)),
    mind: cl(base+ri(-8,8)), charm: cl(base+ri(-8,8)),
    hostility: ri(45,70), beaten:0, spawnAge:C.age
  };
  LOG("😤 Seorang rival muncul dalam hidupmu: <b>"+esc(name)+"</b>. Takdir kalian kini bertaut.","e-arcane");
  T("😤 Rival baru: "+name);
  renderExp(); updateFab();
}
function rivalPower(rv){ return rv.might + rv.mana*0.8 + rv.mind*0.5 + rv.charm*0.4; }
function myPower(){ return stat("might") + stat("mana")*0.8 + stat("mind")*0.5 + stat("charm")*0.4 + luck()*3; }
function growRival(){
  var rv=C._rival; if(!rv) return;
  var g=ri(0,3);
  rv.might=cl(rv.might+g); rv.mana=cl(rv.mana+ri(0,2));
  rv.mind=cl(rv.mind+ri(0,2)); rv.charm=cl(rv.charm+ri(0,2));
  if(ch(0.25)) rv.level++;
}
function duelRival(fromHub){
  if(!alive() || !C._rival){ T("Kau tak punya rival saat ini."); return; }
  if(fromHub){ if(typeof spendAction==="function" && !spendAction()){ T("Aksi tahun ini habis."); return; } expClose(); }
  var rv=C._rival;
  if(typeof playAnim==="function") try{ playAnim("clash",{dur:1100}); }catch(e){}
  var mp=myPower()*(0.85+Math.random()*0.3);
  var rp=rivalPower(rv)*(0.85+Math.random()*0.3);
  setTimeout(function(){
    if(mp>=rp){
      var rep=ri(15,30)+rv.level*3;
      C.reputation=(C.reputation||0)+rep;
      var lg=ri(8,16)+rv.level*3;
      awardLegacy(lg,"mengalahkan rival "+rv.name);
      addStat({might:2,happy:6});
      rv.beaten++; C._rivalsBeat=(C._rivalsBeat||0)+1;
      Dyn.get().rivals=(Dyn.get().rivals||0)+1; Dyn.save();
      EXP.emit("duel_win",1);
      if(typeof playAnim==="function") try{ playAnim("win",{text:"MENANG!"}); }catch(e){}
      if(C._rivalsBeat>=3) unlockAch("penakluk");
      if(rv.beaten>=2 || ch(0.5)){
        showResultSafe("⚔️","Rival Ditumbangkan!","e-epic",
          "Kau mengalahkan <b>"+esc(rv.name)+"</b> untuk selamanya. Namamu ditakuti. <br>(+"+rep+" reputasi, +"+lg+" Warisan Jiwa)");
        C._rival=null;
        setTimeout(function(){ if(alive()&&C.age>=15&&ch(0.6)) spawnRival(); }, 400);
      }else{
        rv.hostility=cl(rv.hostility+10);
        showResultSafe("⚔️","Kau Menang!","e-good",
          "Kau memukul mundur <b>"+esc(rv.name)+"</b>, tapi ia bersumpah balas dendam — kian kuat. <br>(+"+rep+" reputasi, +"+lg+" Warisan Jiwa)");
      }
    }else{
      var lc=ri(20,60), hd=ri(6,14);
      C.coin=Math.max(0,(C.coin||0)-lc);
      addStat({health:-hd,happy:-8});
      rv.hostility=cl(rv.hostility+8);
      if(typeof playAnim==="function") try{ playAnim("lose",{text:"KALAH"}); }catch(e){}
      showResultSafe("🩸","Kau Kalah","e-bad",
        "<b>"+esc(rv.name)+"</b> mengungguli kau. Kau kehilangan "+lc+" keping & terluka. Bangkitlah lebih kuat.");
    }
    REFRESH(); renderExp(); updateFab();
    if(hasC() && C.stats && C.stats.health<=0 && typeof die==="function") die("Kau gugur di tangan rivalmu, "+rv.name+".");
  }, fromHub?600:1150);
}
var RIVAL_EVENTS = [
  function(rv){ return {
    ico:"😤", prompt:"<b>"+esc(rv.name)+"</b> menantangmu duel terbuka di alun-alun. Seluruh kota menyaksikan.",
    choices:[
      {label:"⚔️ Terima duel", sub:"adu kekuatan langsung", run:function(){ setTimeout(duelRival,60); return {t:"Kau menerima tantangan!",cls:"e-arcane"}; }},
      {label:"🕊️ Coba berdamai", sub:"pesona menentukan", run:function(){
          if(ch(0.4+stat("charm")/200+luck()*0.03)){ rv.hostility=cl(rv.hostility-25); C.reputation=(C.reputation||0)+8;
            return {t:esc(rv.name)+" menurunkan pedangnya. Ketegangan mereda.",cls:"e-good"}; }
          rv.hostility=cl(rv.hostility+10); addStat({happy:-5});
          return {t:esc(rv.name)+" menolak damai & makin membencimu.",cls:"e-bad"}; }},
      {label:"🏃 Hindari", sub:"reputasi tercoreng", run:function(){ C.reputation=Math.max(0,(C.reputation||0)-6); rv.hostility=cl(rv.hostility+6);
          return {t:"Kau mundur. Orang-orang berbisik kau pengecut.",cls:"e-bad"}; }}
    ]}; },
  function(rv){ return {
    ico:"🗡️", prompt:"<b>"+esc(rv.name)+"</b> menyebar fitnah tentangmu di seluruh kota.",
    choices:[
      {label:"🎭 Balas fitnah", sub:"akal & pesona", run:function(){
          if(ch(0.45+stat("mind")/200+luck()*0.03)){ C.reputation=(C.reputation||0)+12; rv.hostility=cl(rv.hostility+6);
            return {t:"Balasanmu telak — nama "+esc(rv.name)+" yang justru tercoreng.",cls:"e-good"}; }
          C.reputation=Math.max(0,(C.reputation||0)-10);
          return {t:"Rencanamu bumerang. Reputasimu turun.",cls:"e-bad"}; }},
      {label:"🤝 Rangkul jadi sekutu", sub:"ubah musuh jadi kawan", run:function(){
          if(ch(0.3+stat("charm")/220+luck()*0.04)){
            if(typeof addRel==="function") addRel("rekan",{name:rv.name,female:rv.female,bond:55});
            C._rival=null;
            return {t:esc(rv.name)+" terkesan & kini menjadi sekutumu! Rivalitas usai.",cls:"e-epic"}; }
          return {t:esc(rv.name)+" menertawakan uluran tanganmu.",cls:"e-bad"}; }},
      {label:"😶 Abaikan", run:function(){ addStat({happy:-4}); return {t:"Kau menahan amarah.",cls:""}; }}
    ]}; }
];
function triggerRivalEvent(){
  var rv=C._rival; if(!rv) return false;
  var data=pick(RIVAL_EVENTS)(rv);
  data.cancel=false;
  if(typeof openChoice==="function"){ openChoice(data); return true; }
  return false;
}

/* ------------------------------------------------------------------ */
/*  KARTU TAKDIR (destiny cards)                                       */
/* ------------------------------------------------------------------ */
var DESTINY = [
  {id:"nubuat", ico:"🔮", title:"Sang Peramal", prompt:"Seorang peramal buta mencengkeram tanganmu: <i>“Takdir agung menantimu — bila kau berani membayar harganya.”</i>",
    choices:[
      {label:"💫 Terima ramalan", sub:"berkah panjang, risiko kecil", run:function(){
        C._fate.blessing=(C._fate.blessing||0)+5; awardLegacy(6,"menerima nubuat");
        return {t:"Cahaya hangat menyelimutimu. Kau diberkati 5 tahun ke depan.",cls:"e-epic"}; }},
      {label:"🩸 Tolak & tantang takdir", sub:"judi besar", run:function(){
        if(ch(0.5+luck()*0.05)){ awardLegacy(18,"menantang takdir"); addStat({might:5,mana:5});
          return {t:"Kau menentang takdir & menang! Jiwamu menguat luar biasa.",cls:"e-epic"}; }
        C._fate.curse=(C._fate.curse||0)+4;
        return {t:"Takdir membalas. Kutukan membayangi 4 tahun ke depan.",cls:"e-death"}; }}
    ]},
  {id:"artefak", ico:"🗝️", title:"Artefak Terkubur", prompt:"Kau menemukan peti tua bersegel rune. Denyut mana bocor dari celahnya.",
    choices:[
      {label:"🔓 Buka paksa", sub:"mana menentukan", run:function(){
        if(ch(0.45+stat("mana")/200+luck()*0.05)){ var g=ri(150,400); C.coin+=g; addStat({mana:6});
          return {t:"Peti terbuka! Harta arcane senilai "+g+" keping & lonjakan mana.",cls:"e-epic"}; }
        addStat({health:-15}); return {t:"Jebakan rune meledak! Kau terluka parah.",cls:"e-bad"}; }},
      {label:"📿 Jual tersegel", sub:"aman", run:function(){ var g=ri(80,180); C.coin+=g;
        return {t:"Kau menjual peti utuh seharga "+g+" keping.",cls:"e-good"}; }},
      {label:"⚱️ Kubur kembali", run:function(){ awardLegacy(4,"menahan godaan");
        return {t:"Kau memilih tak mengusik kekuatan tak dikenal. Leluhur menghormatinya.",cls:""}; }}
    ]},
  {id:"pertemuan", ico:"🌒", title:"Orang Asing di Persimpangan", prompt:"Di bawah dua bulan, sosok berjubah menawarkan kesepakatan yang tak masuk akal.",
    choices:[
      {label:"🤝 Sepakati pakta", sub:"kekuatan kini, harga nanti", run:function(){
        addStat({might:8,mana:8,charm:5}); C._fate.debt=(C._fate.debt||0)+ri(3,5);
        return {t:"Kekuatan mengalir deras — namun kau berutang pada takdir.",cls:"e-arcane"}; }},
      {label:"🙏 Tolak dengan hormat", run:function(){ addStat({mind:4}); awardLegacy(5,"kebijaksanaan");
        return {t:"Kau menolak. Kebijaksanaanmu tumbuh.",cls:"e-good"}; }}
    ]},
  {id:"wabah", ico:"☠️", title:"Wabah Melanda", prompt:"Wabah menyebar di kotamu. Tabib kewalahan, ketakutan merajalela.",
    choices:[
      {label:"❤️ Bantu merawat", sub:"mulia tapi berisiko", run:function(){
        C.reputation=(C.reputation||0)+15; awardLegacy(10,"menolong sesama");
        if(ch(0.35-stat("health")/300)){ addStat({health:-20}); return {t:"Kau menolong banyak jiwa, tapi tertular. Reputasimu melambung.",cls:"e-bad"}; }
        addStat({happy:8}); return {t:"Kau menjadi pahlawan wabah. Kota mengelu-elukanmu.",cls:"e-epic"}; }},
      {label:"🚪 Kurung diri", sub:"selamat tapi dingin", run:function(){ addStat({happy:-6});
        return {t:"Kau selamat dalam isolasi, tapi hatimu terasa hampa.",cls:""}; }},
      {label:"💰 Timbun & jual obat", sub:"licik", run:function(){ var g=ri(200,500); C.coin+=g; C.reputation=Math.max(0,(C.reputation||0)-20);
        return {t:"Kau kaya "+g+" keping dari derita orang. Nuranimu tergadai.",cls:"e-bad"}; }}
    ]},
  {id:"warisan_hilang", ico:"📜", title:"Surat dari Masa Lalu", prompt:"Sepucuk surat menguak harta karun leluhurmu tersembunyi di reruntuhan berbahaya.",
    choices:[
      {label:"🗺️ Berangkat mencari", sub:"petualangan", run:function(){
        if(ch(0.5+stat("might")/250+luck()*0.05)){ var g=ri(250,600); C.coin+=g; awardLegacy(12,"harta leluhur");
          return {t:"Kau menaklukkan reruntuhan & pulang membawa "+g+" keping!",cls:"e-epic"}; }
        addStat({health:-18}); return {t:"Reruntuhan nyaris merenggut nyawamu. Kau pulang dengan tangan hampa.",cls:"e-bad"}; }},
      {label:"🔥 Bakar surat", run:function(){ addStat({happy:3}); return {t:"Kau memilih hidup tenang tanpa obsesi harta.",cls:""}; }}
    ]}
];
function triggerDestiny(force){
  if(!alive()) return false;
  if(modalOpen()) return false;
  var pool=DESTINY.filter(function(d){ return C._lastDestiny!==d.id; });
  if(!pool.length) pool=DESTINY;
  var card=pick(pool);
  C._lastDestiny=card.id;
  C._destinyCount=(C._destinyCount||0)+1;
  Dyn.get(); // ensure
  var data={ ico:card.ico, cancel:false,
    prompt:"<div style='color:var(--gold);font-weight:700;letter-spacing:.06em;margin-bottom:6px'>✦ KARTU TAKDIR — "+esc(card.title)+"</div>"+card.prompt,
    choices:card.choices.map(function(cc){
      return {label:cc.label, sub:cc.sub, run:function(){ var r=cc.run(); EXP.emit("destiny",1); afterDestiny(); return r; }};
    })
  };
  if(typeof openChoice==="function"){ openChoice(data); return true; }
  return false;
}
function afterDestiny(){
  if((C._destinyCount||0)>=10) unlockAch("tersentuh_takdir");
}

/* ---------- efek takdir per tahun ---------- */
function fateYearly(){
  if(!alive() || !C._fate) return;
  if(C._fate.blessing>0){ C._fate.blessing--; addStat({happy:2,health:1}); C._perkLuck=(C._perkLuck||0); }
  if(C._fate.curse>0){ C._fate.curse--; addStat({health:-ri(2,5),happy:-3});
    if(C._fate.curse===0) LOG("Kutukan yang membayangimu akhirnya sirna.","e-good"); }
  if(C._fate.debt>0){ C._fate.debt--; if(C._fate.debt===0){ var d=ri(80,200); C.coin=Math.max(0,(C.coin||0)-d);
      addStat({health:-10}); LOG("💀 Utang takdirmu jatuh tempo! Kau kehilangan "+d+" keping & tenaga.","e-death"); } }
}

/* ------------------------------------------------------------------ */
/*  WARISAN JIWA (legacy) & ASCENSION                                  */
/* ------------------------------------------------------------------ */
function awardLegacy(n,reason){
  n=Math.max(1, Math.round(n*legacyMult()));
  var d=Dyn.get(); d.legacy+=n; d.earned+=n; Dyn.save();
  if(reason) T("✦ +"+n+" Warisan Jiwa ("+reason+")");
  updateFab(); renderExp();
  return n;
}
function computeDeathLegacy(){
  if(!hasC()) return 0;
  var nw = (typeof netWorth==="function") ? netWorth() : (C.coin||0);
  var props=(C.properties?C.properties.length:0), biz=(C.businesses?C.businesses.length:0);
  var g = C.age*1.1 + Math.sqrt(Math.max(0,nw))*0.7 + (C.reputation||0)*0.5
        + (C._lineage||1)*12 + (props+biz)*7 + (C._rivalsBeat||0)*20
        + (C._faction?(C._faction.rank+1)*10:0) + (C._destinyCount||0)*3;
  return Math.max(10, Math.round(g*legacyMult()));
}
function ascendCost(){ return 800*(asc()+1); }
function canAscend(){ return Dyn.get().earned >= ascendCost(); }
function doAscend(){
  if(!canAscend()){ T("Belum cukup total Warisan Jiwa untuk Reinkarnasi Agung."); return; }
  var d=Dyn.get();
  d.ascension++; d.crystals+=15; d.legacy+=200; Dyn.save();
  unlockAch("reinkarnasi");
  showResultSafe("🌌","REINKARNASI AGUNG","e-epic",
    "Trah-mu menembus tabir kehidupan. Ascension tingkat <b>"+d.ascension+"</b>!<br>Semua keturunan kini +"+d.ascension+" seluruh stat awal, +25% Warisan Jiwa, & keberuntungan takdir. (+200 Warisan, +15 Kristal)");
  renderExp(); updateFab();
}

/* ------------------------------------------------------------------ */
/*  PRESTASI (achievements)                                            */
/* ------------------------------------------------------------------ */
var ACHS = [
  {id:"pendiri",        ico:"🌱", name:"Pendiri Dinasti",  desc:"Selesaikan kehidupan pertamamu.",      lg:15},
  {id:"ahli_waris",     ico:"👑", name:"Estafet Darah",    desc:"Wariskan takhta ke keturunan.",        lg:25},
  {id:"sesepuh",        ico:"⏳", name:"Sesepuh",          desc:"Capai usia 80 tahun.",                 lg:30},
  {id:"naga_emas",      ico:"🐉", name:"Naga Emas",        desc:"Miliki 5.000 keping.",                 lg:30},
  {id:"trah_abadi",     ico:"♾️", name:"Trah Abadi",       desc:"Capai generasi ke-5.",                 lg:50},
  {id:"penakluk",       ico:"⚔️", name:"Sang Penakluk",    desc:"Kalahkan 3 rival selamanya.",          lg:40},
  {id:"legenda_faksi",  ico:"🏛️", name:"Legenda Faksi",   desc:"Capai pangkat tertinggi sebuah faksi.",lg:45},
  {id:"tersentuh_takdir",ico:"🔮",name:"Tersentuh Takdir", desc:"Hadapi 10 Kartu Takdir.",              lg:35},
  {id:"arcanis",        ico:"🌟", name:"Arcanis",          desc:"Capai Mana 90+.",                      lg:35},
  {id:"sang_juara",     ico:"🏆", name:"Sang Juara",       desc:"Capai Kekuatan 90+.",                  lg:35},
  {id:"reinkarnasi",    ico:"🌌", name:"Reinkarnasi",      desc:"Lakukan Reinkarnasi Agung.",           lg:80}
];
function achById(id){ for(var i=0;i<ACHS.length;i++) if(ACHS[i].id===id) return ACHS[i]; return null; }
function unlockAch(id){
  var d=Dyn.get(); if(d.ach[id]) return; var a=achById(id); if(!a) return;
  d.ach[id]=true; d.legacy+=a.lg; d.earned+=a.lg; Dyn.save();
  T("🏅 Prestasi: "+a.name+" (+"+a.lg+" Warisan)");
  if(typeof playSFX==="function") try{ playSFX("win"); }catch(e){}
  updateFab(); renderExp();
}
function checkAchLive(){
  if(!alive()) return;
  if(stat("mana")>=90) unlockAch("arcanis");
  if(stat("might")>=90) unlockAch("sang_juara");
  if((C.coin||0)>=5000) unlockAch("naga_emas");
  if((C._lineage||1)>=5) unlockAch("trah_abadi");
  if(C.age>=80) unlockAch("sesepuh");
}

/* ------------------------------------------------------------------ */
/*  BERKAH HARIAN (daily streak + misi harian)                         */
/* ------------------------------------------------------------------ */
var DAYKEY="mantara_daily_v1";
var Daily = LS.get(DAYKEY, null) || {lastClaim:"", streak:0, questDate:"", quests:[]};
function daySave(){ LS.set(DAYKEY, Daily); }
var DAILY_REWARDS=[
  {coin:80,  crystal:1, act:0, lg:0},
  {coin:120, crystal:1, act:0, lg:0},
  {coin:180, crystal:2, act:1, lg:0},
  {coin:250, crystal:2, act:0, lg:3},
  {coin:350, crystal:3, act:1, lg:0},
  {coin:500, crystal:4, act:0, lg:5},
  {coin:800, crystal:6, act:1, lg:15}  // JACKPOT hari ke-7
];
function claimedToday(){ return Daily.lastClaim===todayStr(); }
function dailyReady(){ return !claimedToday(); }
function claimDaily(){
  if(claimedToday()){ T("Berkah hari ini sudah kau klaim."); return; }
  var today=todayStr();
  if(Daily.lastClaim && daysBetween(Daily.lastClaim,today)===1) Daily.streak++;
  else Daily.streak=1;
  Daily.lastClaim=today;
  var idx=(Daily.streak-1)%7;
  var rw=DAILY_REWARDS[idx];
  var d=Dyn.get();
  d.crystals+=rw.crystal;
  if(rw.lg){ d.legacy+=rw.lg; d.earned+=rw.lg; }
  Dyn.save();
  var applied="+"+rw.crystal+" Kristal";
  if(alive()){
    C.coin=(C.coin||0)+rw.coin; applied="+"+coinFmt(rw.coin)+" keping, "+applied;
    if(rw.act && typeof grantActionBonus==="function"){ grantActionBonus(rw.act); applied+=", +"+rw.act+" aksi"; }
  }else{
    d.crystals+=Math.ceil(rw.coin/120); Dyn.save(); applied="+"+(rw.crystal+Math.ceil(rw.coin/120))+" Kristal (tanpa kehidupan aktif)";
  }
  if(rw.lg) applied+=", +"+rw.lg+" Warisan";
  daySave();
  var jackpot=(idx===6);
  showResultSafe("🎁", jackpot?"BERKAH AGUNG! (Runtun "+Daily.streak+")":"Berkah Harian (Runtun "+Daily.streak+")",
    jackpot?"e-epic":"e-good",
    "Kau mengklaim berkah hari ini.<br><b>"+applied+"</b>"+(jackpot?"<br>🌟 Runtun 7 hari — jackpot leluhur!":""));
  if(typeof playSFX==="function") try{ playSFX(jackpot?"win":"coin"); }catch(e){}
  REFRESH(); renderExp(); updateFab();
}
/* --- misi harian --- */
var QUEST_POOL=[
  {id:"age",     type:"age",      target:4, ico:"📜", text:"Jalani 4 musim (Lanjut 4 tahun)", coin:150, crystal:1, lg:0},
  {id:"act",     type:"activity", target:5, ico:"⚔️", text:"Lakukan 5 aktivitas",            coin:120, crystal:1, lg:0},
  {id:"rel",     type:"relation", target:2, ico:"🤝", text:"Jalin 2 relasi baru",           coin:130, crystal:1, lg:0},
  {id:"rich",    type:"coin_have",target:800,ico:"💰", text:"Miliki 800 keping",             coin:0,   crystal:2, lg:2},
  {id:"duel",    type:"duel_win", target:1, ico:"🗡️", text:"Kalahkan rival 1 kali",         coin:200, crystal:2, lg:3},
  {id:"faksi",   type:"faction",  target:20,ico:"🏛️", text:"Kumpulkan 20 reputasi faksi",   coin:150, crystal:1, lg:2},
  {id:"takdir",  type:"destiny",  target:1, ico:"🔮", text:"Hadapi 1 Kartu Takdir",         coin:0,   crystal:2, lg:4}
];
function seededPick(arr,n,seed){
  var a=arr.slice(), out=[], s=seed;
  function rng(){ s=(s*9301+49297)%233280; return s/233280; }
  while(out.length<n && a.length){ var i=Math.floor(rng()*a.length); out.push(a.splice(i,1)[0]); }
  return out;
}
function ensureQuests(){
  var today=todayStr();
  if(Daily.questDate!==today || !Daily.quests || !Daily.quests.length){
    var seed=parseInt(today.replace(/-/g,""),10)||1;
    var chosen=seededPick(QUEST_POOL,3,seed);
    Daily.questDate=today;
    Daily.quests=chosen.map(function(q){ return {id:q.id,prog:0,done:false,claimed:false}; });
    daySave();
  }
}
function questDef(id){ for(var i=0;i<QUEST_POOL.length;i++) if(QUEST_POOL[i].id===id) return QUEST_POOL[i]; return null; }
function questProgress(type,amount){
  ensureQuests();
  var changed=false;
  Daily.quests.forEach(function(q){
    var def=questDef(q.id); if(!def || q.done) return;
    if(def.type===type){ q.prog=Math.min(def.target, q.prog+amount); if(q.prog>=def.target){ q.done=true; changed=true; } }
  });
  if(changed){ daySave(); T("✅ Misi harian selesai! Klaim di Balai Takdir."); updateFab(); renderExp(); }
}
function questCoinCheck(){
  ensureQuests();
  Daily.quests.forEach(function(q){
    var def=questDef(q.id); if(!def||q.done||def.type!=="coin_have") return;
    q.prog=Math.min(def.target, (hasC()?(C.coin||0):0));
    if(q.prog>=def.target) q.done=true;
  });
  daySave();
}
function claimQuest(id){
  ensureQuests();
  var q=Daily.quests.find(function(x){return x.id===id;}); var def=questDef(id);
  if(!q||!def||!q.done||q.claimed){ return; }
  q.claimed=true; daySave();
  var d=Dyn.get(); d.crystals+=def.crystal; if(def.lg){ d.legacy+=def.lg; d.earned+=def.lg; } Dyn.save();
  if(alive() && def.coin){ C.coin+=def.coin; }
  T("🎁 Hadiah misi diklaim!");
  if(Daily.quests.every(function(x){return x.claimed;})){
    var bonus=3+asc(); d.crystals+=bonus; d.legacy+=5; d.earned+=5; Dyn.save();
    T("🌟 Semua misi harian tuntas! Bonus +"+bonus+" Kristal, +5 Warisan.");
  }
  REFRESH(); renderExp(); updateFab();
}
/* --- tukar kristal --- */
function spendCrystal(kind){
  var d=Dyn.get();
  if(kind==="coin"){ if(d.crystals<3){ T("Butuh 3 Kristal."); return; } if(!alive()){ T("Perlu kehidupan aktif."); return; }
    d.crystals-=3; C.coin+=600; Dyn.save(); T("💰 +600 keping"); }
  else if(kind==="legacy"){ if(d.crystals<2){ T("Butuh 2 Kristal."); return; } d.crystals-=2; d.legacy+=10; d.earned+=10; Dyn.save(); T("✦ +10 Warisan Jiwa"); }
  else if(kind==="heal"){ if(d.crystals<4){ T("Butuh 4 Kristal."); return; } if(!alive()){ T("Perlu kehidupan aktif."); return; }
    d.crystals-=4; addStat({health:35,happy:15}); Dyn.save(); T("❤️ Nyawa & suka pulih"); }
  REFRESH(); renderExp(); updateFab();
}

/* ------------------------------------------------------------------ */
/*  showResult aman                                                    */
/* ------------------------------------------------------------------ */
function showResultSafe(ico,title,cls,body){
  try{
    if(typeof showResult==="function" && alive()){ showResult({ico:ico,title:title,cls:cls,body:body}); return; }
  }catch(e){}
  try{
    if(typeof openChoice==="function"){
      openChoice({ico:ico,cancel:false,prompt:"<div style='color:var(--gold);font-weight:700'>"+title+"</div><div style='margin-top:6px'>"+body+"</div>",
        choices:[{label:"Lanjut ▸",run:function(){return {};}}]});
    }
  }catch(e2){}
}

/* ==================================================================
   EVENT BUS
   ================================================================== */
var EXP = {
  emit:function(type,amount){
    try{
      if(type==="relation"){ if(alive() && C.age>0) questProgress("relation",amount); return; }
      questProgress(type,amount);
    }catch(e){}
  }
};
window.EXP=EXP;

/* ==================================================================
   UI — BALAI TAKDIR (overlay + FAB)
   ================================================================== */
var expActiveTab="Harian";
function injectStyle(){
  if(document.getElementById("exp-style")) return;
  var css=
  ".exp-fab{position:fixed;z-index:9990;top:calc(var(--app-safe-top,env(safe-area-inset-top,0px)) + 8px);right:10px;width:42px;height:42px;border-radius:50%;"
  +"border:1px solid var(--gold);background:radial-gradient(circle at 35% 30%,#3a2c1e,#1c140d);color:var(--gold-bright);font-size:20px;"
  +"cursor:pointer;box-shadow:0 0 14px rgba(240,192,64,.35);display:flex;align-items:center;justify-content:center;transition:transform .12s;}"
  +".exp-fab:active{transform:scale(.9);}"
  +".exp-fab-badge{position:absolute;top:-3px;right:-3px;min-width:16px;height:16px;padding:0 3px;border-radius:9px;background:var(--blood);"
  +"color:#fff;font-size:9px;font-weight:700;display:none;align-items:center;justify-content:center;box-shadow:0 0 6px rgba(139,38,53,.8);font-family:sans-serif;}"
  +".exp-fab-badge.on{display:flex;}"
  +".exp-ov{position:fixed;inset:0;z-index:9999;background:rgba(8,5,3,.72);backdrop-filter:blur(3px);-webkit-backdrop-filter:blur(3px);"
  +"display:none;justify-content:center;align-items:flex-end;}"
  +".exp-ov.show{display:flex;animation:expFade .2s;}"
  +"@keyframes expFade{from{opacity:0;}to{opacity:1;}}"
  +".exp-panel{width:100%;max-width:430px;height:92vh;background:linear-gradient(170deg,var(--card),var(--bg0));border-top:2px solid var(--gold);"
  +"border-radius:20px 20px 0 0;display:flex;flex-direction:column;box-shadow:0 -8px 40px rgba(0,0,0,.6);animation:expUp .26s cubic-bezier(.2,.8,.2,1);overflow:hidden;}"
  +"@keyframes expUp{from{transform:translateY(40px);opacity:.4;}to{transform:translateY(0);opacity:1;}}"
  +".exp-head{display:flex;align-items:center;justify-content:space-between;padding:calc(var(--app-safe-top,env(safe-area-inset-top,0px)) + 12px) 16px 8px;flex-shrink:0;}"
  +".exp-title{font-size:15px;letter-spacing:.14em;color:var(--gold);font-weight:700;}"
  +".exp-x{background:none;border:1px solid var(--line);color:var(--parchment);width:30px;height:30px;border-radius:9px;font-size:15px;cursor:pointer;}"
  +".exp-crystals{font-size:11px;color:var(--arcane-glow);font-weight:700;margin-left:auto;margin-right:10px;}"
  +".exp-tabs{display:flex;gap:6px;padding:2px 12px 8px;overflow-x:auto;flex-shrink:0;}"
  +".exp-tab{white-space:nowrap;padding:7px 12px;border-radius:20px;border:1px solid var(--line);background:rgba(0,0,0,.25);color:var(--parchment);"
  +"font-family:inherit;font-size:11.5px;cursor:pointer;transition:.15s;}"
  +".exp-tab.on{background:linear-gradient(90deg,var(--gold),var(--gold-bright));color:#1c140d;font-weight:700;border-color:var(--gold);}"
  +".exp-body{flex:1;overflow-y:auto;padding:6px 14px 26px;-webkit-overflow-scrolling:touch;}"
  +".exp-body::-webkit-scrollbar{width:0;}"
  +".exp-hero{background:linear-gradient(150deg,#2a1f3a,#16110c);border:1px solid var(--line2);border-radius:14px;padding:14px;margin-bottom:12px;text-align:center;}"
  +".exp-hero .lg{font-size:30px;font-weight:800;color:var(--gold-bright);font-variant-numeric:tabular-nums;line-height:1;}"
  +".exp-hero .lb{font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:var(--ink-soft);filter:brightness(1.7);margin-top:4px;}"
  +".exp-hero .sub{font-size:10.5px;color:var(--arcane-glow);margin-top:8px;}"
  +".exp-sec{font-size:10.5px;letter-spacing:.14em;text-transform:uppercase;color:var(--gold);margin:14px 2px 8px;display:flex;align-items:center;gap:8px;}"
  +".exp-sec::after{content:'';flex:1;height:1px;background:var(--line);}"
  +".exp-card{background:linear-gradient(155deg,var(--card),var(--bg1));border:1px solid var(--line);border-radius:12px;padding:11px 12px;margin-bottom:9px;}"
  +".exp-row{display:flex;align-items:center;gap:11px;}"
  +".exp-ico{font-size:22px;width:30px;text-align:center;flex-shrink:0;}"
  +".exp-name{font-size:13px;font-weight:700;}"
  +".exp-desc{font-size:10px;color:var(--ink-soft);filter:brightness(1.7);margin-top:2px;line-height:1.4;}"
  +".exp-btn{margin-left:auto;flex-shrink:0;padding:7px 12px;border-radius:10px;border:1px solid var(--gold);background:rgba(184,134,11,.16);"
  +"color:var(--gold-bright);font-family:inherit;font-size:11px;font-weight:700;cursor:pointer;transition:.12s;}"
  +".exp-btn:active{transform:scale(.94);}"
  +".exp-btn.arc{border-color:var(--arcane);background:rgba(91,110,225,.18);color:var(--arcane-glow);}"
  +".exp-btn.dis{opacity:.4;pointer-events:none;filter:grayscale(.6);}"
  +".exp-btn.ghost{border-color:var(--line);background:transparent;color:var(--ink-soft);filter:brightness(1.6);}"
  +".exp-lvl{font-size:9px;color:var(--arcane-glow);margin-top:3px;letter-spacing:.05em;}"
  +".exp-pbar{height:6px;border-radius:4px;background:rgba(0,0,0,.4);overflow:hidden;margin-top:7px;}"
  +".exp-pfill{height:100%;border-radius:4px;background:linear-gradient(90deg,var(--gold),var(--gold-bright));transition:width .4s;}"
  +".exp-streak{display:flex;gap:5px;justify-content:space-between;margin:4px 0 2px;}"
  +".exp-day{flex:1;text-align:center;padding:7px 0;border-radius:9px;border:1px solid var(--line);background:rgba(0,0,0,.25);font-size:9px;color:var(--ink-soft);filter:brightness(1.6);}"
  +".exp-day .dc{font-size:13px;display:block;margin-bottom:2px;filter:none;}"
  +".exp-day.done{border-color:var(--good);background:rgba(106,138,58,.2);color:var(--good);filter:none;}"
  +".exp-day.today{border-color:var(--gold);background:rgba(240,192,64,.18);color:var(--gold-bright);box-shadow:0 0 8px rgba(240,192,64,.3);filter:none;}"
  +".exp-day.jp{border-color:var(--gold-bright);}"
  +".exp-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px;}"
  +".exp-ach{background:linear-gradient(155deg,var(--card),var(--bg1));border:1px solid var(--line);border-radius:11px;padding:10px;text-align:center;}"
  +".exp-ach.locked{opacity:.4;filter:grayscale(.8);}"
  +".exp-ach .ai{font-size:24px;}"
  +".exp-ach .an{font-size:10.5px;font-weight:700;margin-top:4px;}"
  +".exp-ach .ad{font-size:8.5px;color:var(--ink-soft);filter:brightness(1.7);margin-top:2px;line-height:1.3;}"
  +".exp-ach .al{font-size:8.5px;color:var(--gold-bright);margin-top:4px;font-weight:700;}"
  +".exp-fac{border-radius:13px;padding:12px;margin-bottom:9px;border:1px solid var(--line2);background:linear-gradient(150deg,#241a30,#16110c);}"
  +".exp-fac .fh{display:flex;align-items:center;gap:10px;}"
  +".exp-fac .fn{font-size:13.5px;font-weight:700;}"
  +".exp-empty{text-align:center;color:var(--ink-soft);filter:brightness(1.6);font-size:11.5px;padding:24px 10px;line-height:1.6;}"
  +".exp-tag{display:inline-block;font-size:8.5px;padding:2px 7px;border-radius:9px;background:rgba(91,110,225,.2);color:var(--arcane-glow);font-weight:700;margin-left:6px;vertical-align:middle;}";
  var st=document.createElement("style"); st.id="exp-style"; st.textContent=css; document.head.appendChild(st);
}
function buildFab(){
  if(document.getElementById("expFab")) return;
  var b=document.createElement("button");
  b.id="expFab"; b.className="exp-fab"; b.setAttribute("aria-label","Balai Takdir");
  b.innerHTML="✦<span class='exp-fab-badge' id='expFabBadge'></span>";
  b.onclick=expOpenHub;
  document.body.appendChild(b);
  var ov=document.createElement("div");
  ov.id="expOverlay"; ov.className="exp-ov";
  ov.innerHTML="<div class='exp-panel'><div class='exp-head'><span class='exp-title'>✦ BALAI TAKDIR</span>"
    +"<span class='exp-crystals' id='expCrystals'></span>"
    +"<button class='exp-x' onclick='expClose()'>✕</button></div>"
    +"<div class='exp-tabs' id='expTabs'></div><div class='exp-body' id='expBody'></div></div>";
  ov.addEventListener("click",function(e){ if(e.target===ov) expClose(); });
  document.body.appendChild(ov);
  updateFab();
}
var EXP_TABS=[["Harian","🎁"],["Warisan","✦"],["Faksi","🏛️"],["Rival","😤"],["Prestasi","🏅"]];
function renderTabs(){
  var host=document.getElementById("expTabs"); if(!host) return;
  host.innerHTML=EXP_TABS.map(function(t){
    var badge=(t[0]==="Harian"&&(dailyReady()||anyQuestClaimable()))?" •":"";
    return "<button class='exp-tab "+(expActiveTab===t[0]?"on":"")+"' onclick=\"expTab('"+t[0]+"')\">"+t[1]+" "+t[0]+badge+"</button>";
  }).join("");
}
function anyQuestClaimable(){ ensureQuests(); return Daily.quests.some(function(q){return q.done&&!q.claimed;}); }
function expOpenHub(){ injectStyle(); buildFab(); ensureQuests(); document.getElementById("expOverlay").classList.add("show"); renderTabs(); renderExp(); }
function expClose(){ var o=document.getElementById("overlay"); var ov=document.getElementById("expOverlay"); if(ov) ov.classList.remove("show"); updateFab(); }
function expTab(name){ expActiveTab=name; renderTabs(); renderExp(); }
window.expOpenHub=expOpenHub; window.expClose=expClose; window.expTab=expTab;
window.expBuyPerk=function(id){ buyPerk(id); };
window.expJoinFaction=joinFaction; window.expLeaveFaction=leaveFaction; window.expServeFaction=serveFaction;
window.expDuelRival=function(){ duelRival(true); };
window.expClaimDaily=claimDaily; window.expClaimQuest=claimQuest; window.expSpendCrystal=spendCrystal;
window.expAscend=doAscend;

function updateFab(){
  var badge=document.getElementById("expFabBadge");
  if(!badge) return;
  var n=0;
  if(dailyReady()) n++;
  if(anyQuestClaimable()) n++;
  badge.textContent=n>0?n:"";
  badge.classList.toggle("on", n>0);
  var cr=document.getElementById("expCrystals");
  if(cr) cr.textContent="🔷 "+Dyn.get().crystals+" Kristal";
}

/* ---------- render isi tab ---------- */
function renderExp(){
  var body=document.getElementById("expBody"); if(!body) return;
  var cr=document.getElementById("expCrystals"); if(cr) cr.textContent="🔷 "+Dyn.get().crystals+" Kristal";
  if(expActiveTab==="Harian")    body.innerHTML=viewDaily();
  else if(expActiveTab==="Warisan") body.innerHTML=viewLegacy();
  else if(expActiveTab==="Faksi")   body.innerHTML=viewFaction();
  else if(expActiveTab==="Rival")   body.innerHTML=viewRival();
  else if(expActiveTab==="Prestasi")body.innerHTML=viewAch();
}

function viewDaily(){
  ensureQuests();
  var streak=Daily.streak||0;
  var claimed=claimedToday();
  var curIdx=claimed?((streak-1)%7):(streak%7);
  var html="";
  html+="<div class='exp-hero'><div class='lg'>🔥 "+streak+"</div><div class='lb'>Runtun Hari</div>"
      +"<div class='sub'>"+(claimed?"Berkah hari ini sudah diklaim. Kembalilah besok!":"Berkah hari ini menantimu.")+"</div></div>";
  html+="<div class='exp-sec'>Kalender Berkah 7 Hari</div><div class='exp-streak'>";
  for(var i=0;i<7;i++){
    var rw=DAILY_REWARDS[i];
    var cls=""; if(i<curIdx || (claimed&&i===curIdx)) cls="done";
    if(!claimed && i===curIdx) cls="today";
    if(i===6) cls+=" jp";
    html+="<div class='exp-day "+cls+"'><span class='dc'>"+(i===6?"🌟":"🎁")+"</span>H"+(i+1)+"<br>+"+rw.crystal+"🔷</div>";
  }
  html+="</div>";
  html+="<div style='text-align:center;margin:10px 0 4px'>"
      +"<button class='exp-btn "+(claimed?"dis":"")+"' style='margin:0;font-size:13px;padding:10px 26px' onclick='expClaimDaily()'>"
      +(claimed?"✓ Sudah Diklaim":"🎁 Klaim Berkah Hari Ini")+"</button></div>";
  html+="<div class='exp-sec'>Misi Harian</div>";
  Daily.quests.forEach(function(q){
    var def=questDef(q.id); if(!def) return;
    var prog=q.prog, pct=Math.min(100,Math.round(prog/def.target*100));
    var rwtxt=(def.coin?"💰"+def.coin+" ":"")+"🔷"+def.crystal+(def.lg?" ✦"+def.lg:"");
    html+="<div class='exp-card'><div class='exp-row'><div class='exp-ico'>"+def.ico+"</div>"
      +"<div style='flex:1;min-width:0'><div class='exp-name'>"+def.text+"</div>"
      +"<div class='exp-desc'>Hadiah: "+rwtxt+"</div></div>";
    if(q.claimed) html+="<span class='exp-btn ghost dis'>✓</span>";
    else if(q.done) html+="<button class='exp-btn' onclick=\"expClaimQuest('"+q.id+"')\">Klaim</button>";
    else html+="<span style='font-size:10px;color:var(--ink-soft);filter:brightness(1.7)'>"+prog+"/"+def.target+"</span>";
    html+="</div><div class='exp-pbar'><div class='exp-pfill' style='width:"+pct+"%'></div></div></div>";
  });
  html+="<div class='exp-sec'>Tukar Kristal 🔷</div>";
  html+="<div class='exp-card'><div class='exp-row'><div class='exp-ico'>💰</div><div style='flex:1'><div class='exp-name'>600 Keping</div><div class='exp-desc'>Butuh 3 Kristal · perlu kehidupan aktif</div></div><button class='exp-btn' onclick=\"expSpendCrystal('coin')\">Tukar</button></div></div>";
  html+="<div class='exp-card'><div class='exp-row'><div class='exp-ico'>✦</div><div style='flex:1'><div class='exp-name'>10 Warisan Jiwa</div><div class='exp-desc'>Butuh 2 Kristal</div></div><button class='exp-btn arc' onclick=\"expSpendCrystal('legacy')\">Tukar</button></div></div>";
  html+="<div class='exp-card'><div class='exp-row'><div class='exp-ico'>❤️</div><div style='flex:1'><div class='exp-name'>Pulihkan Raga</div><div class='exp-desc'>+35 Nyawa, +15 Suka · Butuh 4 Kristal</div></div><button class='exp-btn' onclick=\"expSpendCrystal('heal')\">Tukar</button></div></div>";
  return html;
}

function viewLegacy(){
  var d=Dyn.get();
  var html="";
  html+="<div class='exp-hero'><div class='lg'>✦ "+coinFmt(d.legacy)+"</div><div class='lb'>Warisan Jiwa</div>"
      +"<div class='sub'>Total sepanjang masa: "+coinFmt(d.earned)+" · Ascension "+d.ascension+" · Kehidupan "+d.lives+"</div></div>";
  // ascension
  var eligible=canAscend();
  html+="<div class='exp-card' style='border-color:var(--arcane)'><div class='exp-row'><div class='exp-ico'>🌌</div>"
    +"<div style='flex:1'><div class='exp-name'>Reinkarnasi Agung <span class='exp-tag'>Tingkat "+d.ascension+"</span></div>"
    +"<div class='exp-desc'>Tembus tabir kehidupan: semua keturunan +1 seluruh stat awal, +25% Warisan, +keberuntungan. Perlu total "+coinFmt(ascendCost())+" Warisan (kini "+coinFmt(d.earned)+").</div></div>"
    +"<button class='exp-btn arc "+(eligible?"":"dis")+"' onclick='expAscend()'>Ascend</button></div></div>";
  // perk tree by category
  var cats=["Harta","Raga","Arcane","Takdir"];
  html+="<div class='exp-desc' style='margin:2px 2px 6px'>Bonus permanen di bawah berlaku untuk <b>setiap</b> keturunan barumu. Trah panjang juga memberi <b>+"+bloodlineBonus()+"</b> stat awal (dari "+d.lives+" kehidupan).</div>";
  cats.forEach(function(cat){
    html+="<div class='exp-sec'>"+cat+"</div>";
    PERKS.filter(function(p){return p.cat===cat;}).forEach(function(p){
      var lvl=pv(p.id), maxed=lvl>=p.max, cost=maxed?0:p.cost(lvl), afford=d.legacy>=cost;
      html+="<div class='exp-card'><div class='exp-row'><div class='exp-ico'>"+p.ico+"</div>"
        +"<div style='flex:1;min-width:0'><div class='exp-name'>"+p.name+" <span style='color:var(--gold-bright);font-size:10px'>Lv "+lvl+"/"+p.max+"</span></div>"
        +"<div class='exp-desc'>"+p.desc+"</div>"
        +(maxed?"<div class='exp-lvl'>✓ Maksimal</div>":"<div class='exp-lvl'>Biaya naik: ✦ "+cost+"</div>")+"</div>";
      if(maxed) html+="<span class='exp-btn ghost dis'>MAX</span>";
      else html+="<button class='exp-btn "+(afford?"":"dis")+"' onclick=\"expBuyPerk('"+p.id+"')\">✦"+cost+"</button>";
      html+="</div><div class='exp-pbar'><div class='exp-pfill' style='width:"+Math.round(lvl/p.max*100)+"%'></div></div></div>";
    });
  });
  // hall of fame
  if(d.hall && d.hall.length){
    html+="<div class='exp-sec'>Balai Kenangan Leluhur</div>";
    d.hall.slice(0,8).forEach(function(h){
      html+="<div class='exp-card'><div class='exp-row'><div class='exp-ico'>⚱️</div><div style='flex:1'>"
        +"<div class='exp-name'>"+esc(h.name)+"</div>"
        +"<div class='exp-desc'>"+esc(h.title||"")+" · wafat "+h.age+" th · gen "+h.gen+" · "+coinFmt(h.coin)+" keping · +"+h.lg+" ✦</div></div></div></div>";
    });
  }
  return html;
}

function viewFaction(){
  var html="";
  if(!alive()){ return "<div class='exp-empty'>🏛️<br>Faksi hanya bisa diikuti oleh jiwa yang sedang menjalani hidup.<br>Mulai atau lanjutkan sebuah kehidupan dulu.</div>"; }
  if(C._faction){
    var f=FACTIONS[C._faction.id], rep=C._faction.rep, rank=factionRank(rep);
    var nextRep=(rank<4)?(rank+1)*25:100, pct=Math.min(100,Math.round(rep/ (rank<4?nextRep:100) *100));
    html+="<div class='exp-fac'><div class='fh'><div class='exp-ico' style='font-size:28px'>"+f.ico+"</div>"
      +"<div style='flex:1'><div class='fn'>"+f.name+"</div><div class='exp-desc'>Pangkat: <b style='color:"+f.color+"'>"+FACTION_RANKS[rank]+"</b> · Reputasi "+rep+"/100</div></div></div>"
      +"<div class='exp-pbar'><div class='exp-pfill' style='width:"+pct+"%;background:linear-gradient(90deg,var(--arcane),"+f.color+")'></div></div>"
      +"<div class='exp-desc' style='margin-top:8px'>Bonus pasif tahunan: memperkuat "+(f.stat==="coin"?"pundi-pundi":f.stat)+" seiring pangkat. Layani faksi untuk naik pangkat & raih gelar.</div>"
      +"<div style='display:flex;gap:8px;margin-top:10px'>"
      +"<button class='exp-btn' style='margin:0;flex:1' onclick='expServeFaction()'>⚔️ Layani Faksi</button>"
      +"<button class='exp-btn ghost' style='margin:0' onclick='expLeaveFaction()'>Keluar</button></div></div>";
    html+="<div class='exp-desc' style='margin:10px 2px'>Naik pangkat memberi keping besar & gelar kehormatan. Pangkat tertinggi membuka prestasi <b>Legenda Faksi</b>.</div>";
    return html;
  }
  html+="<div class='exp-desc' style='margin:4px 2px 10px'>Bergabunglah dengan satu faksi (usia 15+). Setiap faksi memberi bonus & jalur gelar berbeda. Kau hanya bisa memilih satu — pilih dengan bijak.</div>";
  Object.keys(FACTIONS).forEach(function(id){
    var f=FACTIONS[id];
    html+="<div class='exp-fac'><div class='fh'><div class='exp-ico' style='font-size:26px'>"+f.ico+"</div>"
      +"<div style='flex:1'><div class='fn'>"+f.name+"</div><div class='exp-desc'>"+f.desc+" · fokus "+(f.stat==="coin"?"harta":f.stat)+"</div></div>"
      +"<button class='exp-btn "+(C.age>=15?"":"dis")+"' onclick=\"expJoinFaction('"+id+"')\">Gabung</button></div></div>";
  });
  return html;
}

function viewRival(){
  if(!alive()){ return "<div class='exp-empty'>😤<br>Rival muncul dalam perjalanan hidup.<br>Mulai atau lanjutkan kehidupan.</div>"; }
  ensureCharExp(false);
  if(!C._rival){
    return "<div class='exp-empty'>🕊️<br>Kau belum punya rival saat ini.<br>"
      +(C.age<15?"Rival biasanya muncul setelah usia 15.":"Jalani hidupmu — takdir akan menautkanmu dengan seorang rival.")
      +"<br><br><span style='color:var(--gold-bright)'>Rival dikalahkan: "+(C._rivalsBeat||0)+"</span></div>";
  }
  var rv=C._rival;
  var mp=Math.round(myPower()), rp=Math.round(rivalPower(rv));
  var edge=mp>=rp?"Kau unggul":"Rival unggul";
  var html="";
  html+="<div class='exp-hero' style='background:linear-gradient(150deg,#3a1f22,#16110c);border-color:var(--blood)'>"
    +"<div style='font-size:34px'>"+(rv.female?"🦹‍♀️":"🦹‍♂️")+"</div>"
    +"<div class='lg' style='font-size:19px;color:var(--bad)'>"+esc(rv.name)+"</div>"
    +"<div class='lb'>Rival · Tingkat "+rv.level+" · Permusuhan "+rv.hostility+"%</div>"
    +"<div class='sub' style='color:"+(mp>=rp?"var(--good)":"var(--bad)")+"'>"+edge+" ("+mp+" vs "+rp+")</div></div>";
  html+="<div class='exp-sec'>Kekuatan Rival</div><div class='exp-card'>"
    +statLine("⚔️ Kekuatan",rv.might)+statLine("🔮 Mana",rv.mana)+statLine("📖 Akal",rv.mind)+statLine("💠 Pesona",rv.charm)+"</div>";
  html+="<div style='text-align:center;margin:12px 0'>"
    +"<button class='exp-btn' style='margin:0;font-size:13px;padding:11px 30px' onclick='expDuelRival()'>⚔️ Tantang Duel</button></div>";
  html+="<div class='exp-desc' style='text-align:center'>Menang duel memberi reputasi & Warisan Jiwa besar. Kalahkan ia berulang untuk menumbangkannya selamanya — lalu nemesis baru yang lebih kuat akan bangkit.</div>";
  html+="<div class='exp-desc' style='text-align:center;margin-top:8px;color:var(--gold-bright)'>Total rival ditumbangkan trah ini: "+(C._rivalsBeat||0)+"</div>";
  return html;
}
function statLine(label,val){
  return "<div class='statrow' style='display:flex;justify-content:space-between;font-size:10.5px;padding:3px 0'><span style='color:var(--ink-soft);filter:brightness(1.7)'>"+label+"</span><b>"+val+"</b></div>"
    +"<div class='exp-pbar' style='margin-top:0 0 6px 0;margin-bottom:6px'><div class='exp-pfill' style='width:"+val+"%;background:linear-gradient(90deg,#7a1f2b,#c0392b)'></div></div>";
}

function viewAch(){
  var d=Dyn.get();
  var unlocked=ACHS.filter(function(a){return d.ach[a.id];}).length;
  var html="<div class='exp-hero'><div class='lg'>🏅 "+unlocked+"/"+ACHS.length+"</div><div class='lb'>Prestasi Terkumpul</div>"
    +"<div class='sub'>Tiap prestasi memberi Warisan Jiwa permanen.</div></div>";
  html+="<div class='exp-grid'>";
  ACHS.forEach(function(a){
    var on=d.ach[a.id];
    html+="<div class='exp-ach "+(on?"":"locked")+"'><div class='ai'>"+(on?a.ico:"🔒")+"</div>"
      +"<div class='an'>"+a.name+"</div><div class='ad'>"+a.desc+"</div><div class='al'>+"+a.lg+" ✦</div></div>";
  });
  html+="</div>";
  return html;
}

/* ---------- beli perk ---------- */
function buyPerk(id){
  var p=perkById(id); if(!p) return;
  var lvl=pv(id); if(lvl>=p.max){ return; }
  var cost=p.cost(lvl), d=Dyn.get();
  if(d.legacy<cost){ T("Warisan Jiwa belum cukup."); return; }
  d.legacy-=cost; d.perks[id]=lvl+1; Dyn.save();
  T(p.ico+" "+p.name+" → Lv "+(lvl+1));
  if(typeof playSFX==="function") try{ playSFX("coin"); }catch(e){}
  renderExp(); updateFab();
}

/* ==================================================================
   HOOKS — bungkus fungsi global
   ================================================================== */
function wrap(name, makeWrapper){
  if(typeof window[name]==="function"){ window[name]=makeWrapper(window[name]); return true; }
  return false;
}

/* --- karakter baru (new game) --- */
if(typeof window.createFromDraft==="function"){
  var _cfd=window.createFromDraft;
  window.createFromDraft=function(){
    var r=_cfd.apply(this,arguments);
    try{ ensureCharExp(true); applyDynastyPerks(true); }catch(e){}
    return r;
  };
}
/* --- pewaris (heir) --- */
if(typeof window.buildHeirCharacter==="function"){
  var _bhc=window.buildHeirCharacter;
  window.buildHeirCharacter=function(){
    var r=_bhc.apply(this,arguments);
    try{ ensureCharExp(true); C.coin=(C.coin||0)+perkCoinBonus(); unlockAch("ahli_waris"); }catch(e){}
    return r;
  };
}
/* --- loadSlot: isi field yang hilang --- */
if(typeof window.loadSlot==="function"){
  var _ls=window.loadSlot;
  window.loadSlot=function(){
    var r=_ls.apply(this,arguments);
    try{ ensureCharExp(false); if(!C._perkAction&&C._perkAction!==0) applyDynastyPerks(false); updateFab(); }catch(e){}
    return r;
  };
}
/* --- advanceYear: proses tahunan ekspansi --- */
if(typeof window.advanceYear==="function"){
  var _ay=window.advanceYear;
  window.advanceYear=function(){
    var r=_ay.apply(this,arguments);
    try{
      if(!alive()) return r;
      ensureCharExp(false);
      // perk & faksi & takdir tahunan
      if(C._perkAction && typeof grantActionBonus==="function") grantActionBonus(C._perkAction);
      if(C._perkIncome) C.coin=(C.coin||0)+C._perkIncome;
      if(C._perkLong) addStat({health:C._perkLong});
      factionYearly();
      fateYearly();
      // misi harian
      questProgress("age",1);
      questCoinCheck();
      checkAchLive();
      // rival muncul & tumbuh
      if(!C._rival && C.age>=15 && C.age<=60 && ch(0.14)) spawnRival();
      if(C._rival) growRival();
      // pemicu event (satu per tahun, hanya bila tak ada modal terbuka)
      if(!modalOpen() && alive()){
        var milestone=[18,30,45,60].indexOf(C.age)>=0 && (C._fateAges.indexOf(C.age)<0);
        if(milestone){ C._fateAges.push(C.age); setTimeout(function(){ triggerDestiny(true); },420); }
        else if(C._rival && ch(0.10 + (C._rival.hostility/700))){ setTimeout(triggerRivalEvent,420); }
        else if(C.age>=16 && ch(0.06)){ setTimeout(function(){ triggerDestiny(false); },420); }
      }
      updateFab();
    }catch(e){}
    return r;
  };
}
/* --- die: hadiah Warisan Jiwa + hall of fame --- */
if(typeof window.die==="function"){
  var _die=window.die;
  window.die=function(reason){
    var wasAlive=alive();
    var gain=0, snapshot=null;
    try{
      if(wasAlive){
        gain=computeDeathLegacy();
        snapshot={name:C.name,title:C.title,age:C.age,coin:C.coin||0,gen:C._lineage||1,lg:gain};
      }
    }catch(e){}
    var r=_die.apply(this,arguments);
    try{
      if(wasAlive){
        var d=Dyn.get();
        d.legacy+=gain; d.earned+=gain; d.lives++;
        if(snapshot){
          d.hall.unshift(snapshot); if(d.hall.length>20) d.hall.pop();
          d.best.age=Math.max(d.best.age,snapshot.age);
          d.best.coin=Math.max(d.best.coin,snapshot.coin);
          d.best.gen=Math.max(d.best.gen,snapshot.gen);
        }
        Dyn.save();
        unlockAch("pendiri");
        checkAchLive();
        // sisipkan banner Warisan ke epitaph
        setTimeout(function(){ injectDeathBanner(gain); }, 1550);
        updateFab();
      }
    }catch(e){}
    return r;
  };
}
function injectDeathBanner(gain){
  var ep=document.getElementById("epitaph"); if(!ep) return;
  var d=Dyn.get();
  var el=document.createElement("div");
  el.style.cssText="margin-top:14px;padding:12px;border:1px solid var(--gold);border-radius:12px;background:rgba(184,134,11,.12);text-align:center";
  el.innerHTML="<div style='color:var(--gold-bright);font-weight:700;font-size:13px;letter-spacing:.06em'>✦ WARISAN JIWA +"+coinFmt(gain)+"</div>"
    +"<div style='font-size:10.5px;color:var(--parchment);margin-top:5px'>Total Warisan: <b>"+coinFmt(d.legacy)+"</b> · Ascension "+d.ascension+" · Kristal "+d.crystals+"</div>"
    +"<div style='font-size:10px;color:var(--ink-soft);filter:brightness(1.7);margin-top:5px'>Buka <b style='color:var(--gold)'>✦ Balai Takdir</b> untuk tingkatkan bonus permanen sebelum lahir kembali.</div>"
    +"<button class='exp-btn' style='margin-top:9px' onclick='expOpenHub()'>✦ Buka Balai Takdir</button>";
  ep.appendChild(el);
}

/* --- recordActivity → misi 'activity' --- */
if(typeof window.recordActivity==="function"){
  var _ra=window.recordActivity;
  window.recordActivity=function(){
    var r=_ra.apply(this,arguments);
    try{ EXP.emit("activity",1); }catch(e){}
    return r;
  };
}
/* --- addRel → misi 'relation' --- */
if(typeof window.addRel==="function"){
  var _ar=window.addRel;
  window.addRel=function(){
    var r=_ar.apply(this,arguments);
    try{ EXP.emit("relation",1); }catch(e){}
    return r;
  };
}
/* --- boot: FAB + daily prompt --- */
function bootExp(){
  try{
    injectStyle(); buildFab(); ensureQuests(); updateFab();
    // FIX: jangan auto-buka panel (dulu menutupi splash/menu/tutorial!).
    // Cukup badge di tombol ✦ + toast pengingat setelah game tenang.
    if(!window.__expDailyPrompted && dailyReady()){
      window.__expDailyPrompted=true;
      setTimeout(function(){
        if(dailyReady()&&typeof toast==="function")
          toast("✦ Berkah harian menantimu — ketuk tombol ✦ di kanan atas.");
      }, 3400);
    }
  }catch(e){}
}
if(document.readyState!=="loading") setTimeout(bootExp,60);
else document.addEventListener("DOMContentLoaded", function(){ setTimeout(bootExp,60); });

/* expose sedikit util utk debug */
window.MantaraExp={Dyn:Dyn, Daily:Daily, awardLegacy:awardLegacy, spawnRival:spawnRival, triggerDestiny:triggerDestiny};

})();


/* MANTARA_ARENA_INJECTED */
