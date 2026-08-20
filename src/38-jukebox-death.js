/* ==================================================================
   MANTARA — JUKEBOX MUSIK (rotasi otomatis tiap 30–45 detik)
   Mengganti lagu latar otomatis setiap 30–45 detik dari playlist
   (tema tenang + tema tiap kota + musik aktivitas), diacak agar
   bervariasi. Tidak mengganggu momen kontekstual (duel, duka,
   kemenangan, upacara) & tidak mengganggu pilihan manual. Tiba di
   kota baru memainkan tema kota itu sekali sebagai sambutan.
   ================================================================== */
(function(){
  "use strict";
  function hasC(){ return typeof C!=="undefined" && C && C.alive; }
  var CONTEXTUAL={battle:1,mourn:1,triumph:1};
  var BG=["calm","event","ceremony"];  // hanya lagu komposisi bawaan (bukan sintetis)
  var order=[], oi=0, jt=null, lastSwitch=0;
  var MIN_GAP=90000;    // minimal 90 detik sebelum lagu boleh berganti (jangan terlalu cepat)
  var FALLBACK=270000;  // fallback: kalau tak ada momen, ganti tiap ~4,5–6 menit
  function shuffle(a){ a=a.slice(); for(var i=a.length-1;i>0;i--){ var j=(Math.random()*(i+1))|0; var t=a[i];a[i]=a[j];a[j]=t; } return a; }
  function nextTrack(prev){
    if(!order.length || oi>=order.length){ order=shuffle(BG); oi=0; }
    var t=order[oi++];
    if(t===prev){ t=order[oi++]||order[0]; }
    return t;
  }
  function state(){ try{ return window.musicNow?window.musicNow():null; }catch(e){ return null; } }
  function canSwitch(){
    var st=state();
    if(st&&st.state){
      if(!st.state.on) return false;                 // musik dimatikan
      if(st.state.mode!=="auto") return false;       // mode manual — hormati pilihan user
      if(st.mood&&CONTEXTUAL[st.mood]) return false; // sedang momen kontekstual (duel/duka/kemenangan)
    }
    return (Date.now()-lastSwitch) >= MIN_GAP;        // jeda minimum agar tak ganti terlalu cepat
  }
  function switchTrack(){
    if(!canSwitch()) return false;
    var st=state();
    var trk=nextTrack(st?st.mood:null);
    if(typeof window.MusicMood==="function"){ window.MusicMood(trk); lastSwitch=Date.now(); }
    scheduleFallback();
    return true;
  }
  function scheduleFallback(){ clearTimeout(jt); jt=setTimeout(switchTrack, FALLBACK+((Math.random()*90000)|0)); }
  function startJuke(){ if(!lastSwitch) lastSwitch=Date.now(); scheduleFallback(); }
  document.addEventListener("pointerdown", startJuke, {passive:true, once:true});
  setTimeout(startJuke, 2500);

  // GANTI LAGU HANYA DI MOMEN TERTENTU (bukan timer cepat), tetap hormati jeda minimum:
  //  • saat berpindah kota (suasana baru)  • kadang saat berganti tahun (babak baru)
  try{ if(typeof travelTo==="function"){ var _tt=travelTo; travelTo=function(){ var r=_tt.apply(this,arguments); try{ setTimeout(switchTrack,400); }catch(e){} return r; }; } }catch(e){}
  try{ if(typeof advanceYear==="function"){ var _av=advanceYear; advanceYear=function(){ var r=_av.apply(this,arguments); try{ if(Math.random()<0.5) setTimeout(switchTrack,300); }catch(e){} return r; }; } }catch(e){}

  window.__mantaraJukebox={next:nextTrack,switchTrack:switchTrack,canSwitch:canSwitch,BG:BG,MIN_GAP:MIN_GAP};
})();


/* ==================================================================
   MANTARA — KARIR TERFOKUS + ALASAN WAFAT
   1) Naik pangkat tiap profesi bergantung STAT FOKUS-nya sendiri:
      gladiator → Kekuatan, politikus → Pesona & Akal, penyihir → Mana,
      dsb. Syaratnya ditampilkan jelas di tombol "Minta Promosi".
   2) Layar kematian menampilkan PENYEBAB wafat (usia tua / penyakit /
      peristiwa terakhir / dsb), bukan sekadar generik.
   Modul mandiri.
   ================================================================== */
(function(){
  "use strict";
  function hasC(){ return typeof C!=="undefined" && C && C.alive; }
  function _ri(a,b){ return (typeof ri==="function")?ri(a,b):Math.floor(Math.random()*(b-a+1))+a; }
  function clamp01(v){ return Math.max(0,Math.min(1,v)); }
  function statName(k){ try{ return (typeof STAT_META!=="undefined"&&STAT_META[k])?STAT_META[k].name:k; }catch(e){ return k; } }

  /* ---------- FOKUS PROMOSI PER PROFESI ---------- */
  var CLASS_SECONDARY={combat:"health",arcane:"mind",social:"mind",labor:"might"};
  function jobStat(id){ try{ if(typeof jobDevOf==="function"){ var d=jobDevOf(id); if(d&&d.stat) return d.stat; } }catch(e){} return "mind"; }
  function careerFocus(id){
    var primary=jobStat(id);
    var cls=(typeof jobClassOf==="function")?jobClassOf(id):"labor";
    var secondary=CLASS_SECONDARY[cls]||"mind";
    if(secondary===primary){ secondary = primary==="might"?"mind":(primary==="mind"?"charm":(primary==="charm"?"might":"mind")); }
    return {primary:primary, secondary:secondary};
  }
  // ambang stat fokus utk naik ke pangkat berikutnya (naik tiap jenjang)
  function promoThreshold(level){ return 30 + (level+1)*13; }  // lv0->1:43, 1->2:56, 2->3:69

  window.promoFocusOK=function(){
    try{
      if(!hasC()||!C.career) return true;
      var f=careerFocus(C.career); var thr=promoThreshold(C.careerLevel||0);
      return (C.stats[f.primary]||0) >= thr-8; // gerbang lunak utk promosi otomatis
    }catch(e){ return true; }
  };

  function promoChance(){
    var f=careerFocus(C.career); var thr=promoThreshold(C.careerLevel||0);
    var primVal=C.stats[f.primary]||0, secVal=C.stats[f.secondary]||0;
    var perf=((C.jobPerf||50))/170;
    var dev=((C.jobDev&&C.jobDev.level)||0)*0.05;
    var st=(typeof currentJobStyle==="function")?currentJobStyle():null;
    var stp=(st&&st.promo)||0;
    var focusEdge=(primVal-thr)/75;               // stat fokus utama sangat menentukan
    var secBonus=Math.max(0,(secVal-thr)/460);    // stat pendukung pengaruh kecil
    return clamp01(perf*0.9+dev+stp+focusEdge*1.15+secBonus);
  }
  function promoReqText(){
    if(!hasC()||!C.career) return "";
    var car=(typeof CAREERS!=="undefined")?CAREERS.find(function(x){return x.id===C.career;}):null;
    if(!car) return "";
    if(C.careerLevel>=car.ranks.length-1) return "Kau di puncak profesi ini 👑";
    var f=careerFocus(C.career); var thr=promoThreshold(C.careerLevel||0);
    var primVal=Math.round(C.stats[f.primary]||0);
    var ready=primVal>=thr;
    return "Fokus "+statName(f.primary)+" "+primVal+"/"+thr+(ready?" ✓ siap naik":" — asah dulu")+" · dibantu "+statName(f.secondary);
  }

  /* ---------- override jobAskPromotion: berbasis fokus ---------- */
  try{
    if(typeof window.jobAskPromotion==="function"){
      window.jobAskPromotion=function(){
        if(!hasC()||!C.career) return;
        try{ if(typeof ensureJobState==="function") ensureJobState(); }catch(e){}
        var car=(typeof CAREERS!=="undefined")?CAREERS.find(function(x){return x.id===C.career;}):null; if(!car) return;
        if(C.careerLevel>=car.ranks.length-1){ if(typeof toast==="function") toast("Kau sudah di puncak karir ini! 👑"); return; }
        var f=careerFocus(C.career); var thr=promoThreshold(C.careerLevel||0);
        var primVal=C.stats[f.primary]||0;
        var p=promoChance();
        if(Math.random()<p){
          C.careerLevel++; C.careerYears=0; C.jobPerf=Math.max(0,(C.jobPerf||50)-20);
          if(typeof finishAct==="function") finishAct("📈 Promosi! Kau kini "+car.ranks[C.careerLevel]+" — "+statName(f.primary)+"mu membuka jalan.","e-epic","win");
        }else{
          C.jobPerf=Math.max(0,(C.jobPerf||50)-_ri(4,10));
          var need = primVal<thr
            ? "Naik pangkat "+car.name+" menuntut "+statName(f.primary)+" tinggi (kini "+Math.round(primVal)+", butuh ≥"+thr+"). Latih keahlian profesimu."
            : "Atasan belum terkesan — tingkatkan performa & keahlian profesimu.";
          if(typeof finishAct==="function") finishAct(need,"e-bad");
        }
      };
    }
  }catch(e){}

  /* ---------- tampilkan syarat di tombol "Minta Promosi" ---------- */
  try{
    if(typeof renderKarir==="function"){
      var _rk=renderKarir;
      renderKarir=function(){
        var r=_rk.apply(this,arguments);
        try{
          if(hasC()&&C.career){
            var host=document.getElementById("viewKarir");
            if(host){
              var tile=host.querySelector('[onclick*="jobAskPromotion"] .td');
              if(tile){ tile.textContent=promoReqText(); }
            }
          }
        }catch(e){}
        return r;
      };
    }
  }catch(e){}

  /* ============================================================
     2) ALASAN / PENYEBAB WAFAT
     ============================================================ */
  function enrichDeath(reason){
    var r=String(reason||""); var age=(hasC()||C)?((C&&C.age)||0):0;
    // usia tua
    if(/usia tua|old age/i.test(r) || age>=70) return {ico:"⏳",text:"Usia tua — kau wafat dengan tenang di umur "+age+"."};
    // penyakit / wabah / dingin
    var plague=false;
    try{ plague=C&&C.market&&C.market.events&&C.market.events.some(function(e){return e.id==="plague"||e.id==="winter";}); }catch(e){}
    if(/wabah|hitam|sakit|penyakit|beku|dingin|\bpes\b/i.test(r) || plague) return {ico:"🤒",text:"Penyakit merenggut nyawamu di umur "+age+"."};
    // peristiwa/pertarungan dengan alasan spesifik
    if(r && !/menyerah|fatal|parah|akibat|pilihanmu|tubuhmu|lukamu/i.test(r)) return {ico:"⚔️",text:r+(/\d/.test(r)?"":" (umur "+age+")")};
    // luka berat (peristiwa terakhir)
    if(/luka|parah/i.test(r)) return {ico:"🩸",text:"Luka dari peristiwa terakhir terlalu parah — kau gugur di umur "+age+"."};
    // kemiskinan
    try{ if(C && C.coin<=5) return {ico:"🥀",text:"Tubuh yang letih karena kekurangan akhirnya menyerah (umur "+age+")."}; }catch(e){}
    // penuaan bertahap
    if(age>=55) return {ico:"⏳",text:"Tubuh yang menua akhirnya menyerah di umur "+age+"."};
    return {ico:"💔",text:"Tubuhmu menyerah di umur "+age+"."};
  }
  window.deathCauseLine=function(reason){
    try{
      var c = (C && C._deathReason) ? C._deathReason : enrichDeath(reason);
      return "<span style='color:var(--bad);filter:brightness(1.3)'>"+c.ico+" "+c.text+"</span>";
    }catch(e){ return ""; }
  };
  // tangkap alasan tepat sebelum die menampilkan epitaf
  try{
    if(typeof die==="function"){
      var _die=die;
      die=function(reason){
        try{ if(typeof C!=="undefined"&&C) C._deathReason=enrichDeath(reason); }catch(e){}
        return _die.apply(this,arguments);
      };
    }
  }catch(e){}

  window.__mantaraJobDeath={careerFocus:careerFocus,promoThreshold:promoThreshold,promoChance:promoChance,promoReqText:promoReqText,enrichDeath:enrichDeath};
})();
