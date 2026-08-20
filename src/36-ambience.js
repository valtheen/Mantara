/* ==================================================================
   MANTARA — AMBIENCE ADAPTIF PROSEDURAL (Web Audio, tanpa file)
   Bed suasana yang di-generate real-time & berganti mengikuti
   biome/sub-lokasi: hutan berangin, dermaga berombak, menara beku,
   aula istana, keramaian pasar, sarang judi, & lorong dungeon.
   Berlapis di bawah musik; crossfade halus saat berpindah tempat.
   Nol aset — semua disintesis; hemat ukuran.
   ================================================================== */
(function(){
  "use strict";
  if(typeof window==="undefined") return;
  var AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return;

  var ctx=null, master=null, bed=null, curBiome=null, sparkleT=null, unlocked=false;
  var AMB_KEY="mantara_amb_on";
  function ambOn(){ try{ var v=localStorage.getItem(AMB_KEY); return v===null?true:v==="1"; }catch(e){ return true; } }
  function setAmbFlag(on){ try{ localStorage.setItem(AMB_KEY,on?"1":"0"); }catch(e){} }

  function ensureCtx(){
    if(ctx) return true;
    try{
      ctx=new AC();
      master=ctx.createGain(); master.gain.value=0; master.connect(ctx.destination);
      return true;
    }catch(e){ ctx=null; return false; }
  }
  function noiseBuffer(){
    var len=Math.floor(ctx.sampleRate*2), buf=ctx.createBuffer(1,len,ctx.sampleRate), d=buf.getChannelData(0);
    var last=0;
    for(var i=0;i<len;i++){ var w=Math.random()*2-1; last=(last+0.02*w)/1.02; d[i]=last*3.5; } // pink-ish
    return buf;
  }

  // ---------- param per biome ----------
  var BIOMES={
    forest:{filt:"lowpass",freq:900,noise:0.5,lfo:0.08,lfoDepth:0.4,pads:[110,164.8],padGain:0.05,
      sparkle:{every:[2200,5200],freqs:[1800,2600,3200],dur:0.09,gain:0.05,type:"sine"}}, // burung
    harbor:{filt:"lowpass",freq:500,noise:0.6,lfo:0.14,lfoDepth:0.6,pads:[73.4,110],padGain:0.05,
      sparkle:{every:[3500,7000],freqs:[900,700],dur:0.5,gain:0.05,type:"sine",slide:-300}}, // camar
    frozen:{filt:"bandpass",freq:1600,noise:0.45,lfo:0.1,lfoDepth:0.5,pads:[196,261.6,392],padGain:0.035,
      sparkle:{every:[3000,6500],freqs:[2600,3100,3600],dur:0.3,gain:0.04,type:"triangle"}}, // kilau
    palace:{filt:"lowpass",freq:600,noise:0.18,lfo:0.05,lfoDepth:0.2,pads:[130.8,196,261.6],padGain:0.06,
      sparkle:{every:[6000,11000],freqs:[523,659],dur:0.6,gain:0.04,type:"sine"}}, // dentang halus
    market:{filt:"bandpass",freq:1000,noise:0.4,lfo:0.2,lfoDepth:0.5,pads:[146.8],padGain:0.03,
      sparkle:{every:[1500,3500],freqs:[500,650,800,430],dur:0.12,gain:0.045,type:"square"}}, // keramaian
    den:{filt:"bandpass",freq:800,noise:0.35,lfo:0.18,lfoDepth:0.4,pads:[98],padGain:0.03,
      sparkle:{every:[900,2200],freqs:[1200,1500],dur:0.05,gain:0.05,type:"square"}}, // klik dadu
    dungeon:{filt:"lowpass",freq:320,noise:0.4,lfo:0.06,lfoDepth:0.3,pads:[55,58.3],padGain:0.07,
      sparkle:{every:[2500,6000],freqs:[420,300],dur:0.15,gain:0.055,type:"sine",slide:-120}}, // tetesan
    calm:{filt:"lowpass",freq:700,noise:0.25,lfo:0.07,lfoDepth:0.3,pads:[130.8,196],padGain:0.045,
      sparkle:{every:[5000,9000],freqs:[880,988],dur:0.4,gain:0.03,type:"sine"}}
  };

  function stopBed(b,fade){
    if(!b) return;
    try{ b.g.gain.cancelScheduledValues(ctx.currentTime); b.g.gain.setValueAtTime(b.g.gain.value,ctx.currentTime); b.g.gain.linearRampToValueAtTime(0,ctx.currentTime+(fade||0.8)); }catch(e){}
    setTimeout(function(){ try{ b.nodes.forEach(function(n){ try{ n.stop&&n.stop(); }catch(e){} try{ n.disconnect&&n.disconnect(); }catch(e){} }); }catch(e){} }, (fade||0.8)*1000+120);
  }
  function buildBed(key){
    var p=BIOMES[key]||BIOMES.calm;
    var g=ctx.createGain(); g.gain.value=0; g.connect(master);
    var nodes=[];
    // noise bed
    try{
      var src=ctx.createBufferSource(); src.buffer=noiseBuffer(); src.loop=true;
      var filt=ctx.createBiquadFilter(); filt.type=p.filt; filt.frequency.value=p.freq;
      var ng=ctx.createGain(); ng.gain.value=p.noise;
      src.connect(filt); filt.connect(ng); ng.connect(g);
      // LFO amplitudo (angin/ombak)
      var lfo=ctx.createOscillator(); lfo.frequency.value=p.lfo;
      var lg=ctx.createGain(); lg.gain.value=p.noise*p.lfoDepth;
      lfo.connect(lg); lg.connect(ng.gain);
      src.start(); lfo.start();
      nodes.push(src,lfo);
    }catch(e){}
    // pad nada rendah
    try{
      (p.pads||[]).forEach(function(fr){
        var o=ctx.createOscillator(); o.type="sine"; o.frequency.value=fr;
        var og=ctx.createGain(); og.gain.value=p.padGain;
        o.connect(og); og.connect(g); o.start(); nodes.push(o);
      });
    }catch(e){}
    return {g:g,nodes:nodes,p:p};
  }

  function scheduleSparkle(){
    clearTimeout(sparkleT);
    if(!bed||!ctx) return;
    var p=bed.p, sp=p.sparkle; if(!sp) return;
    var wait=sp.every[0]+Math.random()*(sp.every[1]-sp.every[0]);
    sparkleT=setTimeout(function(){
      try{
        var o=ctx.createOscillator(); o.type=sp.type||"sine";
        var f=sp.freqs[Math.floor(Math.random()*sp.freqs.length)];
        o.frequency.setValueAtTime(f,ctx.currentTime);
        if(sp.slide) o.frequency.linearRampToValueAtTime(Math.max(80,f+sp.slide),ctx.currentTime+sp.dur);
        var g=ctx.createGain(); g.gain.setValueAtTime(0,ctx.currentTime);
        g.gain.linearRampToValueAtTime(sp.gain,ctx.currentTime+0.02);
        g.gain.exponentialRampToValueAtTime(0.0001,ctx.currentTime+sp.dur);
        o.connect(g); g.connect(master); o.start(); o.stop(ctx.currentTime+sp.dur+0.05);
      }catch(e){}
      scheduleSparkle();
    }, wait);
  }

  function setBiome(key){
    if(!ambOn()){ return; }
    if(!ensureCtx()) return;
    try{ if(ctx.state==="suspended") ctx.resume(); }catch(e){}
    if(key===curBiome && bed) return;
    curBiome=key;
    var old=bed;
    bed=buildBed(key);
    try{ bed.g.gain.setValueAtTime(0,ctx.currentTime); bed.g.gain.linearRampToValueAtTime(1,ctx.currentTime+1.0); }catch(e){}
    try{ master.gain.cancelScheduledValues(ctx.currentTime); master.gain.linearRampToValueAtTime(0.20,ctx.currentTime+1.0); }catch(e){}
    stopBed(old,0.9);
    scheduleSparkle();
  }
  function stopAll(){
    clearTimeout(sparkleT);
    if(master&&ctx){ try{ master.gain.linearRampToValueAtTime(0,ctx.currentTime+0.5); }catch(e){} }
    stopBed(bed,0.5); bed=null; curBiome=null;
  }

  // ---------- pilih biome dari lokasi ----------
  function biomeForLocation(){
    try{
      if(window.__mantaraDungeon && window.__mantaraDungeon.state && window.__mantaraDungeon.state()) return "dungeon";
    }catch(e){}
    if(typeof C==="undefined"||!C||!C.alive) return "calm";
    var sub=C.subloc||"", city=C.cityId||"";
    if(/den|judi/.test(sub)) return "den";
    if(/market|pasar|grocer/.test(sub)) return "market";
    if(sub.indexOf("th_")===0 || city==="thornvale") return "forest";
    if(sub.indexOf("sa_")===0 || city==="saltmoor") return "harbor";
    if(sub.indexOf("fr_")===0 || city==="frostspire") return "frozen";
    if(sub.indexOf("ae_")===0 || city==="aetheria") return "palace";
    return "calm";
  }
  window.updateAmbience=function(){
    try{ if(!ambOn()){ stopAll(); return; } setBiome(biomeForLocation()); }catch(e){}
  };
  window.setAmbienceOn=function(on){
    setAmbFlag(!!on);
    if(on){ unlocked=true; window.updateAmbience(); }
    else stopAll();
  };

  // ---------- hooks ----------
  document.addEventListener("pointerdown",function(){
    if(unlocked) return; unlocked=true;
    if(ambOn()) window.updateAmbience();
  },{passive:true});

  function wrap(name){
    try{
      if(typeof window[name]==="function"){
        var _f=window[name];
        window[name]=function(){ var r=_f.apply(this,arguments); try{ setTimeout(window.updateAmbience,80); }catch(e){} return r; };
      }
    }catch(e){}
  }
  // fungsi global (bukan window.*) di-wrap lewat eval-safe pengecekan
  try{ if(typeof gotoSubloc==="function"){ var _gs=gotoSubloc; gotoSubloc=function(){ var r=_gs.apply(this,arguments); try{setTimeout(window.updateAmbience,80);}catch(e){} return r; }; } }catch(e){}
  try{ if(typeof switchTab==="function"){ var _st=switchTab; switchTab=function(){ var r=_st.apply(this,arguments); try{setTimeout(window.updateAmbience,80);}catch(e){} return r; }; } }catch(e){}
  wrap("travelTo"); wrap("enterDungeon"); wrap("popPage"); wrap("openExpeditions");
  // mirror ke tombol musik: kalau musik dimatikan, ambience ikut; dinyalakan, ikut
  try{ if(typeof window.musicSetOn==="function"){ var _ms=window.musicSetOn; window.musicSetOn=function(on){ var r=_ms.apply(this,arguments); try{ window.setAmbienceOn(!!on); }catch(e){} return r; }; } }catch(e){}

  // ---------- kontrol di tab Peta (opsional, ringan) ----------
  try{
    if(typeof renderPeta==="function"){
      var _rp=renderPeta;
      renderPeta=function(){
        var r=_rp.apply(this,arguments);
        try{
          var host=document.getElementById("viewPeta");
          if(host && typeof C!=="undefined" && C && C.alive){
            host.insertAdjacentHTML("beforeend",
              "<div class='tiles' style='margin-top:6px'><div class='tile fullrow' onclick=\"setAmbienceOn("+(ambOn()?"false":"true")+")\">"
              +"<span class='ti'>"+(ambOn()?"🔊":"🔇")+"</span><span class='tn'>Ambience Suasana: "+(ambOn()?"NYALA":"MATI")+"</span>"
              +"<span class='td'>Bunyi latar hidup mengikuti tempatmu (hutan, dermaga, dungeon…)</span></div></div>");
          }
        }catch(e){}
        return r;
      };
    }
  }catch(e){}

  window.__mantaraAmbience={setBiome:setBiome,updateAmbience:function(){window.updateAmbience();},biomeFor:biomeForLocation};
})();


/* ==================================================================
   MANTARA — SINKRONISASI JABATAN & STRUKTUR
   • Jabatan politik (Raja/Gubernur/Kanselir) kini muncul sebagai
     "pekerjaan saat ini" di tab Karir (Diri).
   • Gelar karakter ikut jabatan politik tertinggi.
   • Nama Gubernur (halaman Kerajaan) disinkronkan dengan Penguasa
     Kota (sistem rulers) agar tak ada nama berbeda utk kota sama.
   Modul mandiri.
   ================================================================== */
(function(){
  "use strict";
  function hasC(){ return typeof C!=="undefined" && C && C.alive; }
  function cityName(id){ try{ return (typeof cityOf==="function")?cityOf(id).name:id; }catch(e){ return id; } }
  function polRoleNow(){ return (hasC() && C.polRole && C.polRole.role) ? C.polRole.role : null; }

  function polInfo(){
    var pr=polRoleNow(); if(!pr) return null;
    if(pr==="raja")     return {ico:"👑",name:(C.female?"Ratu":"Raja")+" Aetheria", role:"Penguasa Kerajaan", pay:150,
      title:(C.female?"Ratu":"Raja")+" Aetheria"};
    if(pr==="gubernur") return {ico:"🏙️",name:"Gubernur "+cityName(C.polRole.city), role:"Pemimpin Kota", pay:90,
      title:"Gubernur "+cityName(C.polRole.city)};
    if(pr==="kanselir") return {ico:"🏛️",name:"Kanselir Kerajaan", role:"Tangan Kanan Raja", pay:60,
      title:"Kanselir Kerajaan"};
    return null;
  }

  /* ---- 1) GELAR ikut jabatan politik (menimpa gelar karir) ---- */
  try{
    if(typeof updateTitle==="function"){
      var _ut=updateTitle;
      updateTitle=function(){
        var r=_ut.apply(this,arguments);
        try{ var p=polInfo(); if(p) C.title=p.title; }catch(e){}
        return r;
      };
    }
  }catch(e){}

  /* ---- 2) JABATAN POLITIK tampil di tab Karir ---- */
  function polCardHTML(){
    var p=polInfo(); if(!p) return "";
    return "<div class='sechead'>🏛️ Jabatan Negara</div>"
      +"<div class='charcard' style='margin-bottom:10px'><div class='chartop'>"
      +"<div class='portrait'>"+p.ico+"</div>"
      +"<div class='cinfo'><div class='cname'>"+p.name+"</div>"
      +"<div class='ctitle'>"+p.role+" · tunjangan +"+p.pay+"/th</div>"
      +"<div class='cage'>Jabatan resmi kerajaan — kelola di Balairung Kerajaan.</div></div></div>"
      +"<div class='tiles'><div class='tile fullrow' onclick=\"switchTab('Peta');setTimeout(function(){try{openKingdomPage()}catch(e){}},140)\">"
      +"<span class='ti'>🏛️</span><span class='tn'>Buka Balairung Kerajaan ▸</span>"
      +"<span class='td'>dekrit, kampanye, jabatan, kudeta & politik</span></div></div>";
  }
  try{
    if(typeof renderKarir==="function"){
      var _rk=renderKarir;
      renderKarir=function(){
        var r=_rk.apply(this,arguments);
        try{
          if(polRoleNow()){
            var host=document.getElementById("viewKarir");
            if(host){
              var card=polCardHTML();
              // sisipkan sebelum bagian Pekerjaan/Lowongan agar terkelompok rapi
              var heads=host.querySelectorAll(".sechead");
              var target=null;
              for(var i=0;i<heads.length;i++){
                var t=heads[i].textContent||"";
                if(/Pekerja|Lowongan/.test(t) || t.indexOf("💼")>=0 || t.indexOf("📋")>=0){ target=heads[i]; break; }
              }
              if(target) target.insertAdjacentHTML("beforebegin", card);
              else host.insertAdjacentHTML("afterbegin", card);
            }
          }
        }catch(e){}
        return r;
      };
    }
  }catch(e){}

  /* ---- 3) SINKRON Gubernur (Kerajaan) ↔ Penguasa Kota (rulers) ---- */
  // Kota non-ibukota: nama "Gubernur" di halaman Kerajaan = nama penguasa
  // kota dari sistem rulers, supaya tak ada dua nama untuk kota yang sama.
  function syncGovernors(){
    if(!hasC()) return;
    try{
      var K = (typeof ensureKingdom==="function")?ensureKingdom():C.kingdom;
      if(!K||!K.governors) return;
      if(window.__mantaraRulers && window.__mantaraRulers.ensureRulers) window.__mantaraRulers.ensureRulers();
      if(!C.rulers) return;
      ["thornvale","saltmoor","frostspire"].forEach(function(id){
        var rl=C.rulers[id]; if(!rl) return;
        var playerGov = (C.polRole && C.polRole.role==="gubernur" && C.polRole.city===id);
        if(playerGov){ rl.name=C.name; K.governors[id]=C.name+" (KAU)"; }
        else { K.governors[id]=rl.name; }
      });
    }catch(e){}
  }
  try{
    if(typeof advanceYear==="function"){
      var _adv=advanceYear;
      advanceYear=function(){ var r=_adv.apply(this,arguments); try{ syncGovernors(); }catch(e){} return r; };
    }
  }catch(e){}
  try{
    if(typeof renderPeta==="function"){
      var _rp=renderPeta;
      renderPeta=function(){ try{ syncGovernors(); }catch(e){} return _rp.apply(this,arguments); };
    }
  }catch(e){}
  // sinkron sekali saat halaman Kerajaan dibuka
  try{
    if(typeof window.openKingdomPage==="function"){
      var _okp=window.openKingdomPage;
      window.openKingdomPage=function(){ try{ syncGovernors(); }catch(e){} return _okp.apply(this,arguments); };
    }
  }catch(e){}

  window.__mantaraSync={polInfo:polInfo,syncGovernors:syncGovernors};
})();
