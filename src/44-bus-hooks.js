/* ==================================================================
   MANTARA — TITIK SADAP TUNGGAL untuk event bus   (v25)
   ------------------------------------------------------------------
   Ini SATU-SATUNYA tempat di v25 yang membungkus fungsi global.
   Dipasang paling akhir, jadi ia membungkus rantai patch v23/v24 yang
   sudah jadi — bukan menyelipkan diri di tengahnya.

   Semua fitur v25 mendengarkan bus, tidak menimpa fungsi apa pun.
   Kalau suatu hari ada bug urutan eksekusi, cukup baca file ini.
   ================================================================== */
(function(){
  "use strict";
  if(!window.Mantara) return;
  var M = window.Mantara;

  function hasC(){ return typeof C!=="undefined" && C; }

  /* ---- year:begin / year:end ---- */
  if(typeof advanceYear==="function"){
    var _busYear = advanceYear;
    window.advanceYear = advanceYear = function(){
      M.emit("year:begin", {age: hasC()?C.age:0});
      var r = _busYear.apply(this, arguments);
      if(hasC() && C.alive) M.emit("year:end", {age:C.age});
      return r;
    };
  }

  /* ---- char:born ---- */
  if(typeof createFromDraft==="function"){
    var _busBorn = createFromDraft;
    window.createFromDraft = createFromDraft = function(){
      var r = _busBorn.apply(this, arguments);
      M.emit("char:born", {heir:false});
      return r;
    };
  }
  if(typeof window.buildHeirCharacter==="function"){
    var _busHeir = window.buildHeirCharacter;
    window.buildHeirCharacter = function(){
      var r = _busHeir.apply(this, arguments);
      M.emit("char:born", {heir:true});
      return r;
    };
  }

  /* ---- char:died ---- */
  if(typeof die==="function"){
    var _busDie = die;
    window.die = die = function(reason){
      M.emit("char:died", {reason:reason, age:hasC()?C.age:0});
      return _busDie.apply(this, arguments);
    };
  }

  /* ---- hidup:render — tempat modul menyisipkan panel di tab Hidup ----
     Modul mengembalikan HTML lewat ctx.blocks; disisipkan sebelum .logbox. */
  if(typeof renderHidup==="function"){
    var _busHidup = renderHidup;
    window.renderHidup = renderHidup = function(){
      var r = _busHidup.apply(this, arguments);
      try{
        var host = document.getElementById("viewHidup");
        if(host && host.innerHTML.indexOf('<div class="logbox">')>=0){
          var ctx = {host:host, blocks:[]};
          M.emit("hidup:render", ctx);
          if(ctx.blocks.length){
            host.innerHTML = host.innerHTML.replace('<div class="logbox">',
              ctx.blocks.join("") + '<div class="logbox">');
          }
        }
      }catch(e){}
      return r;
    };
  }

  /* ---- tab:render ---- */
  if(typeof switchTab==="function"){
    var _busTab = switchTab;
    window.switchTab = switchTab = function(name){
      var r = _busTab.apply(this, arguments);
      M.emit("tab:render", {tab:name});
      return r;
    };
  }

  /* ---- save:write / save:read ----
     Modul v25 menyimpan state-nya di C, jadi otomatis ikut tersimpan.
     Event ini untuk state yang perlu migrasi/normalisasi saat dimuat. */
  if(typeof saveGameMulti==="function"){
    var _busSave = saveGameMulti;
    window.saveGameMulti = saveGameMulti = function(){
      M.emit("save:write", {});
      return _busSave.apply(this, arguments);
    };
  }
  if(typeof loadSlot==="function"){
    var _busLoad = loadSlot;
    window.loadSlot = loadSlot = function(){
      var r = _busLoad.apply(this, arguments);
      if(r) M.emit("save:read", {});
      return r;
    };
  }

  /* ---- boot: beri modul kesempatan memasang UI setelah DOM siap ---- */
  function boot(){ M.emit("boot", {}); }
  try{
    if(document.readyState==="loading") document.addEventListener("DOMContentLoaded", function(){ setTimeout(boot,300); });
    else setTimeout(boot, 300);
  }catch(e){}
})();
