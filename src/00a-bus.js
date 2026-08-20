/* ==================================================================
   MANTARA — MODULE API & EVENT BUS   (v25)
   ------------------------------------------------------------------
   Kenapa ini ada:
   Sampai v24, setiap fitur baru menambah lapisan monkey-patch —
       var _prev = advanceYear;
       advanceYear = function(){ ... _prev.apply(this,arguments) ... };
   Pola itu dipakai 45 kali. Dua dari tiga blocker yang diperbaiki di v24
   (kelulusan sekolah berulang, log ganda) lahir persis dari lapisan patch
   yang saling menimpa: urutan eksekusi jadi tidak bisa ditebak, dan tidak
   ada satu tempat pun untuk melihat siapa saja yang menyadap sebuah fungsi.

   Mulai v25, fitur baru MENDAFTAR ke bus, bukan menimpa fungsi global:

       Mantara.module('bestia', function(M){
         M.on('year:end',  function(ctx){ ... });
         M.on('char:born', function(ctx){ ... });
       });

   Modul lama tidak diubah sama sekali — bus ini hanya menambah jalur baru.
   Satu wrapper resmi dipasang di 44-bus-hooks.js (paling akhir), jadi ada
   TEPAT SATU titik sadap untuk semua fitur v25 ke depan.
   ================================================================== */
(function(){
  "use strict";

  var listeners = Object.create(null);   // event -> [{id, fn, prio}]
  var modules   = Object.create(null);   // nama -> {name, api}
  var DEBUG     = false;

  function on(evt, fn, prio){
    if(typeof fn!=="function") return function(){};
    (listeners[evt] || (listeners[evt]=[])).push({fn:fn, prio:prio||0});
    listeners[evt].sort(function(a,b){ return b.prio-a.prio; });
    return function off(){
      var L=listeners[evt]; if(!L) return;
      for(var i=0;i<L.length;i++) if(L[i].fn===fn){ L.splice(i,1); break; }
    };
  }

  function once(evt, fn, prio){
    var off=on(evt, function(ctx){ off(); return fn(ctx); }, prio);
    return off;
  }

  /* emit tidak pernah melempar: satu modul rusak tidak boleh menjatuhkan
     giliran tahun pemain. Error dicatat ke Mantara.errors untuk diperiksa. */
  function emit(evt, ctx){
    var L=listeners[evt]; if(!L||!L.length) return ctx;
    ctx = ctx || {};
    for(var i=0;i<L.length;i++){
      try{ L[i].fn(ctx); }
      catch(e){
        Mantara.errors.push({evt:evt, msg:(e&&e.message)||String(e), stack:e&&e.stack});
        if(DEBUG && window._origConsoleLog) window._origConsoleLog("[bus] "+evt+" gagal:", e);
      }
    }
    return ctx;
  }

  /* Kumpulkan nilai dari semua pendengar (mis. "berapa bonus stat dari
     semua sumber?") tanpa satu pun modul perlu tahu modul lain. */
  function collect(evt, ctx){
    var out=[]; var L=listeners[evt]||[];
    for(var i=0;i<L.length;i++){
      try{ var v=L[i].fn(ctx||{}); if(v!==undefined && v!==null) out.push(v); }
      catch(e){ Mantara.errors.push({evt:evt, msg:(e&&e.message)||String(e)}); }
    }
    return out;
  }

  function module(name, factory){
    if(modules[name]) return modules[name].api;
    var api;
    try{ api = factory(Mantara) || {}; }
    catch(e){
      Mantara.errors.push({evt:"module:"+name, msg:(e&&e.message)||String(e), stack:e&&e.stack});
      api = {};
    }
    modules[name] = {name:name, api:api};
    return api;
  }

  function get(name){ return modules[name] ? modules[name].api : null; }

  /* ---- util yang dipakai lintas modul, supaya tiap modul tidak lagi
     mendefinisikan ulang _ri/_ch/_log/_toast sendiri (sekarang ada 12 salinan) ---- */
  var U = {
    alive:   function(){ return typeof C!=="undefined" && C && C.alive; },
    ri:      function(a,b){ return Math.floor(Math.random()*(b-a+1))+a; },
    chance:  function(p){ return Math.random()<p; },
    pick:    function(a){ return a[Math.floor(Math.random()*a.length)]; },
    clamp:   function(v,lo,hi){ return Math.max(lo===undefined?0:lo, Math.min(hi===undefined?100:hi, v)); },
    log:     function(t,cls){ try{ if(typeof log==="function"&&typeof C!=="undefined"&&C) log(C.age,t,cls||""); }catch(e){} },
    toast:   function(t){ try{ if(typeof toast==="function") toast(t); }catch(e){} },
    sfx:     function(n){ try{ if(typeof playSFX==="function") playSFX(n); }catch(e){} },
    anim:    function(t,o){ try{ if(typeof playAnim==="function") playAnim(t,o||{}); }catch(e){} },
    stats:   function(o){ try{ if(typeof applyStats==="function") applyStats(o); }catch(e){} },
    coin:    function(n){ try{ if(typeof C!=="undefined"&&C) C.coin=Math.max(0,(C.coin||0)+n); }catch(e){} },
    esc:     function(s){ try{ return (typeof window.esc==="function")?window.esc(s):String(s); }catch(e){ return String(s); } },
    refresh: function(){ try{ if(typeof renderAll==="function") renderAll(); }catch(e){} },
    money:   function(n){ return (n||0).toLocaleString("id-ID"); },
    spend:   function(n){ try{ return typeof spendAction!=="function" || spendAction(n||1); }catch(e){ return true; } },
    music:   function(m,o){ try{ if(typeof window.MusicMood==="function") window.MusicMood(m,o||{force:true,revert:"calm",after:40000}); }catch(e){} },
    ask:     function(data){ try{ if(typeof openChoice==="function") openChoice(data); }catch(e){} }
  };

  var Mantara = {
    version: "25.0",
    on: on, once: once, emit: emit, collect: collect,
    module: module, get: get,
    u: U,
    errors: [],
    /* daftar semua event & pendengarnya — untuk debug di console */
    inspect: function(){
      var out={};
      for(var k in listeners) out[k]=listeners[k].length;
      return {events:out, modules:Object.keys(modules), errors:Mantara.errors.length};
    },
    debug: function(on){ DEBUG=!!on; return DEBUG; }
  };

  window.Mantara = Mantara;
})();

/* ------------------------------------------------------------------
   DAFTAR EVENT RESMI (dipancarkan dari 44-bus-hooks.js)

     char:born      { }                 karakter baru lahir / warisan dimulai
     char:died      { reason }          sebelum layar kematian
     year:begin     { age }             sebelum advanceYear asli jalan
     year:end       { age }             sesudah advanceYear asli selesai
     stats:changed  { }                 sesudah applyStats
     tab:render     { tab }             sesudah render tab mana pun
     hidup:render   { host }            khusus tab Hidup — tempat menyisipkan panel
     save:write     { payload }         sebelum disimpan ke slot
     save:read      { payload }         sesudah dimuat dari slot
   ------------------------------------------------------------------ */
