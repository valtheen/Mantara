/* ==================================================================
   MANTARA — HUB KE PETA + SAUDARA
   1) Buang FAB pojok kanan (Balai Takdir ✦ & Guild 🛡️) — pindahkan
      aksesnya jadi tile di tab Peta Dunia.
   2) Saudara acak: saat lahir bisa punya kakak (tak selalu sulung),
      dan orang tua bisa melahirkan adik selama kita masih kecil.
   Modul mandiri.
   ================================================================== */
(function(){
  "use strict";
  function hasC(){ return typeof C!=="undefined" && C && C.alive; }
  function _ch(p){ return (typeof chance==="function")?chance(p):Math.random()<p; }
  function _ri(a,b){ return (typeof ri==="function")?ri(a,b):Math.floor(Math.random()*(b-a+1))+a; }
  function _rand(a){ return (typeof rand==="function")?rand(a):a[Math.floor(Math.random()*a.length)]; }
  function _log(t,cls){ try{ if(typeof log==="function") log(C.age,t,cls||""); }catch(e){} }
  function _toast(t){ try{ if(typeof toast==="function") toast(t); }catch(e){} }

  /* ============================================================
     1) SEMBUNYIKAN FAB POJOK KANAN + AKSES LEWAT PETA
     ============================================================ */
  function hideFabs(){
    if(document.getElementById("hub-nofab-style")) return;
    var st=document.createElement("style"); st.id="hub-nofab-style";
    st.textContent="#expFab,#gldFab{display:none!important;}";
    (document.head||document.documentElement).appendChild(st);
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",hideFabs);
  else hideFabs();
  setTimeout(hideFabs,300);

  // badge kecil kalau berkah harian / bounty siap (best-effort, aman kalau fungsi tak ada)
  function dailyBadge(){
    try{ if(typeof dailyReady==="function" && dailyReady()) return " <span style='color:var(--blood)'>●</span>"; }catch(e){}
    return "";
  }

  function hubSectionHTML(){
    return "<div class='sechead'>⚜️ Balai Petualang</div>"
      +"<p style='font-size:10.5px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 10px;'>Pusat takdir & petualanganmu — kini menyatu di peta dunia.</p>"
      +"<div class='tiles'>"
      +"<div class='tile' onclick=\"(window.expOpenHub&&expOpenHub())\"><span class='ti'>✦</span>"
      +"<span class='tn'>Balai Takdir"+dailyBadge()+"</span>"
      +"<span class='td'>Berkah harian · faksi · rival · prestasi · dinasti</span></div>"
      +"<div class='tile arcane' onclick=\"(window.gldOpen&&gldOpen())\"><span class='ti'>🛡️</span>"
      +"<span class='tn'>Guild Petualang</span>"
      +"<span class='td'>Papan bounty · peliharaan · kandang makhluk</span></div>"
      +"</div>";
  }

  try{
    if(typeof renderPeta==="function"){
      var _prevRP=renderPeta;
      renderPeta=function(){
        var r=_prevRP.apply(this,arguments);
        try{
          hideFabs();
          var host=document.getElementById("viewPeta");
          if(host && hasC()) host.insertAdjacentHTML("beforeend", hubSectionHTML());
        }catch(e){}
        return r;
      };
    }
  }catch(e){}

  /* ============================================================
     2) SAUDARA ACAK (kakak saat lahir + adik lahir kemudian)
     ============================================================ */
  function famSurname(){
    try{ return C.name.split(" ").slice(1).join(" ") || ""; }catch(e){ return ""; }
  }
  function makeSibling(kin,bondLo,bondHi){
    var f=_ch(0.5);
    var s=(typeof makeRel==="function")?makeRel("keluarga",{female:f,bond:_ri(bondLo,bondHi)}):null;
    if(!s) return null;
    var sn = famSurname();
    s.name = typeof uniqueFamilyName==="function"?uniqueFamilyName(f,sn):((f?"Sable":"Aldric")+(sn?" "+sn:""));
    s.kin=kin; s.sibling=true;
    s.trait=_rand(["periang","pendiam","ambisius","setia","licik","pemberani","bijak","penyayang","jahil","rajin"]);
    return s;
  }

  function addStartingSiblings(){
    if(!C || !Array.isArray(C.relations)) return;
    // jumlah kakak — sering, supaya tak selalu sulung/anak tunggal
    var roll=Math.random();
    var nOlder = roll<0.42 ? 0 : roll<0.70 ? 1 : roll<0.88 ? 2 : 3;
    for(var i=0;i<nOlder;i++){
      var s=makeSibling("Kakak",45,72);
      if(s){ s.ageOffset=_ri(2,15); C.relations.push(s); }
    }
    if(nOlder>0){
      // catat di log kelahiran bahwa ia lahir di tengah keluarga
      var kakak=C.relations.filter(function(r){return r.kin==="Kakak";});
      _log("Kau lahir sebagai anak "+(nOlder+1)+" dari keluarga — kakakmu: "+kakak.map(function(r){return r.name.split(" ")[0];}).join(", ")+".","");
    }
  }

  function maybeNewSibling(){
    if(!hasC()) return;
    if(C.age<1 || C.age>15) return;
    var sibs=C.relations.filter(function(r){return r.sibling;}).length;
    if(sibs>=5) return;
    var mom=C.relations.find(function(r){return r.kin==="Ibu";});
    if(!mom) return; // ibu sudah tiada / tak ada
    if(_ch(0.10)){
      var s=makeSibling("Adik",55,78);
      if(!s) return;
      s.ageOffset=-C.age;
      C.relations.push(s);
      _log("Ibumu melahirkan "+(s.female?"adik perempuan":"adik laki-laki")+"mu, "+s.name+"!","e-good");
      _toast("Kau punya adik baru: "+s.name.split(" ")[0]+"!");
    }
  }

  // hook: tambah kakak sesudah createFromDraft
  try{
    if(typeof createFromDraft==="function"){
      var _prevCFD=createFromDraft;
      createFromDraft=function(){
        var r=_prevCFD.apply(this,arguments);
        try{ addStartingSiblings(); }catch(e){}
        return r;
      };
    }
  }catch(e){}

  // hook: adik lahir acak tiap tahun (saat masih kecil)
  try{
    if(typeof processYearly==="function"){
      var _prevPY=processYearly;
      processYearly=function(){
        var r=_prevPY.apply(this,arguments);
        try{ maybeNewSibling(); }catch(e){}
        return r;
      };
    }
  }catch(e){}

  window.__mantaraPlace={addStartingSiblings:addStartingSiblings,maybeNewSibling:maybeNewSibling};
})();
