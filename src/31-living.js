/* ==================================================================
   MANTARA — HIDUP LEBIH HIDUP
   1) Aksi bebas (buang kuota aksi)
   2) Aset hidup (kondisi, penuaan, perawatan)
   3) Peliharaan fantasi (adopsi, rawat, latih, bonus pasif)
   4) Guild Petualang (papan bounty berjenjang)
   Modul mandiri. Memakai ulang util global & gaya .exp-* .
   ================================================================== */
(function(){
  "use strict";
  function hasC(){ return typeof C!=="undefined" && C && C.alive; }
  function _ri(a,b){ return (typeof ri==="function")?ri(a,b):Math.floor(Math.random()*(b-a+1))+a; }
  function _ch(p){ return (typeof chance==="function")?chance(p):Math.random()<p; }
  function _cl(v){ return (typeof clamp==="function")?clamp(v):Math.max(0,Math.min(100,v)); }
  function _rand(a){ return (typeof rand==="function")?rand(a):a[Math.floor(Math.random()*a.length)]; }
  function _log(t,cls){ try{ if(typeof log==="function") log(C.age,t,cls||""); }catch(e){} }
  function _toast(t){ try{ if(typeof toast==="function") toast(t); }catch(e){} }
  function _sfx(n){ try{ if(typeof playSFX==="function") playSFX(n); }catch(e){} }
  function _esc(s){ try{ return (typeof esc==="function")?esc(s):String(s); }catch(e){ return String(s); } }
  function _renderAll(){ try{ if(typeof renderAll==="function") renderAll(); }catch(e){} }
  function _reflow(){ _renderAll(); gldRender(); }

  /* ============================================================
     1) KUOTA AKSI  —  v24: DIPULIHKAN
     ------------------------------------------------------------
     Versi lama menimpa spendAction dengan `function(){return true;}`
     dan mengosongkan grantActionBonus. Akibatnya kuota aksi TIDAK PERNAH
     berlaku: pemain bisa melakukan tak terhingga aksi tiap tahun, sehingga
     tidak ada trade-off sama sekali dan seluruh ekonomi kehilangan taruhan.
     (Terbukti di uji otomatis: spendAction() true 1600x berturut-turut,
      C.actionsLeft tetap 8, usia tidak pernah bertambah.)
     Kuota kini kembali berlaku dengan angka baru: 8 aksi/tahun.
     ============================================================ */
  try{
    if(typeof spendAction==="function" && !window.__actionQuotaRestored){
      window.__actionQuotaRestored=1;
      spendAction=function(n){
        n=n||1;
        if(!hasC()) return true;
        if((C.actionsLeft||0)<n){
          _toast("Aksi tahun ini habis ("+ACTIONS_PER_YEAR+"/tahun). Lanjut ke tahun berikutnya.");
          return false;
        }
        C.actionsLeft-=n;
        try{ if(typeof updateTitle==="function") updateTitle(); }catch(e){}
        return true;
      };
      window.spendAction=spendAction;
      grantActionBonus=function(n){
        if(!hasC()) return;
        var room=(typeof ACTION_BONUS_CAP!=="undefined"?ACTION_BONUS_CAP:4)-(C.actionBonus||0);
        var give=Math.min(n||1,room);
        if(give>0){ C.actionBonus=(C.actionBonus||0)+give; C.actionsLeft+=give; _toast("+"+give+" aksi bonus tahun ini!"); }
      };
      window.grantActionBonus=grantActionBonus;
    }
  }catch(e){}

  function doTravelFree(cityId,withFamily){
    // v24: perjalanan tidak lagi gratis — biaya 1..3 aksi (lihat travelCost)
    try{
      if(hasC() && typeof travelCost==="function" && cityId!==C.cityId){
        var cost=travelCost(C.cityId,cityId)+(withFamily?1:0);
        if(!spendAction(cost)){ _toast("Butuh "+cost+" aksi untuk ke sana."); return; }
      }
    }catch(e){}
    C.cityId=cityId; C.location=cityId; C.subloc=null;
    if(withFamily){
      C.relations.filter(function(r){return r.role==="keluarga"||r.role==="pasangan";})
        .forEach(function(r){ r.bond=_cl(r.bond+_ri(1,3)); });
      C.yearsAwayFromHome=0; C.homeCityId=cityId;
    }
    var city=(typeof cityOf==="function")?cityOf(cityId):{name:cityId,tag:""};
    _log("Kau tiba di "+city.name+". "+(city.tag||"")+".","e-good");
    _toast("Tiba di "+city.name+"!");
    try{ if(typeof closeModal==="function") closeModal(); }catch(e){}
    try{ if(typeof updateTitle==="function") updateTitle(); }catch(e){}
    _renderAll();
  }
  try{
    if(typeof travelTo==="function"){
      travelTo=function(cityId){
        if(!hasC()) return;
        if(cityId===C.cityId){ _toast("Kau sudah di kota ini."); return; }
        var target=(typeof cityOf==="function")?cityOf(cityId):{name:cityId,tag:"",ico:"🧭",pros:[""],cons:[""]};
        var fam=C.relations.filter(function(r){return r.role==="keluarga"||r.role==="pasangan";});
        var choices=[{label:"Berangkat",sub:"perjalanan bebas",run:function(){ doTravelFree(cityId,false); return null; }}];
        if(fam.length) choices.unshift({label:"Ajak keluarga ("+fam.length+")",sub:"relasi tetap hangat",cls:"love",
          run:function(){ doTravelFree(cityId,true); return null; }});
        var sub=(target.pros&&target.cons)?("<br><span style='font-size:11px;color:var(--ink-soft);filter:brightness(1.6)'>"+target.pros[0]+" · tapi "+String(target.cons[0]).toLowerCase()+"</span>"):"";
        if(typeof openChoice==="function")
          openChoice({ico:target.ico||"🧭",prompt:"Bepergian ke <b>"+target.name+"</b> ("+target.tag+")?"+sub,choices:choices});
      };
    }
  }catch(e){}

  // sembunyikan penghitung "Aksi X/Y" di header Hidup
  try{
    if(typeof renderHidup==="function"){
      var _prevRH=renderHidup;
      renderHidup=function(){
        var r=_prevRH.apply(this,arguments);
        try{
          var el=document.querySelector("#viewHidup .coin");
          if(el && el.innerHTML.indexOf("⚡")>=0){
            el.innerHTML=el.innerHTML.replace(/\s*·\s*⚡[^<]*/,"");
          }
        }catch(e2){}
        return r;
      };
    }
  }catch(e){}

  /* ============================================================
     2) ASET HIDUP — kondisi, penuaan, perawatan
     ============================================================ */
  function ensureLiving(){
    if(typeof C==="undefined"||!C) return;
    if(!Array.isArray(C.pets)) C.pets=[];
    if(!C._guild) C._guild={xp:0,rank:0,done:0,fail:0};
    if(!C.gearCond) C.gearCond={};
    if(Array.isArray(C.properties)) C.properties.forEach(function(p){ if(p && p.cond==null) p.cond=100; });
    if(Array.isArray(C.businesses)) C.businesses.forEach(function(b){ if(b && b.cond==null) b.cond=100; });
    if(C.gear){ for(var cat in C.gear){ if(C.gearCond[cat]==null) C.gearCond[cat]=100; } }
  }

  function gearBaseKey(cat){
    try{
      var g=GEAR_CATALOG[cat];
      var free=g.variants.find(function(v){return (v.price||0)===0;});
      return free?free.key:g.variants[0].key;
    }catch(e){ return null; }
  }

  function degradeAssets(){
    if(!hasC()) return;
    ensureLiving();
    C.properties.forEach(function(p){
      p.cond=_cl(p.cond-_ri(2,5));
      if(p.rented && p.cond<30 && _ch(0.4)){
        p.rented=false;
        var def=(typeof PROPERTY_CATALOG!=="undefined")?PROPERTY_CATALOG.find(function(x){return x.key===p.key;}):null;
        _log("Penyewa "+(def?def.name:"propertimu")+" pergi — bangunan kurang terawat.","e-bad");
      }
    });
    C.businesses.forEach(function(b){ b.cond=_cl(b.cond-_ri(2,4)); });
    if(C.gear){
      for(var cat in C.gear){
        if(C.gearCond[cat]==null) C.gearCond[cat]=100;
        C.gearCond[cat]=_cl(C.gearCond[cat]-_ri(3,6));
        if(C.gearCond[cat]<=0){
          var base=gearBaseKey(cat);
          try{
            var g=GEAR_CATALOG[cat];
            var cur=g.variants.find(function(v){return v.key===C.gear[cat];});
            if(base && C.gear[cat]!==base){
              C.gear[cat]=base; C.gearCond[cat]=40;
              _log((cur?cur.name:g.name)+" rusak parah dan tak terpakai lagi. Kau kembali ke perlengkapan dasar.","e-bad");
            }else{ C.gearCond[cat]=15; }
          }catch(e){ C.gearCond[cat]=15; }
        }
      }
    }
  }

  function bizConditionPenalty(){
    if(!hasC()||!Array.isArray(C.businesses)) return;
    C.businesses.forEach(function(b){
      if(b.cond!=null && b.cond<45){
        var def=(typeof BUSINESS_TYPES!=="undefined")?BUSINESS_TYPES.find(function(x){return x.id===b.id;}):null;
        if(!def) return;
        var base=def.income[b.level]||0;
        var pen=Math.round(base*(b.cond<20?0.5:0.25));
        if(pen>0){ C.coin=Math.max(0,C.coin-pen); _log(def.name+" kurang terawat — untung berkurang "+pen+" keping.","e-bad"); }
      }
    });
  }

  function propRepairCost(p){
    var def=PROPERTY_CATALOG.find(function(x){return x.key===p.key;});
    var basePrice=def?def.price:100;
    return Math.max(4, Math.round((100-p.cond)*basePrice*0.004));
  }
  function bizRepairCost(b){
    var def=BUSINESS_TYPES.find(function(x){return x.id===b.id;});
    var basePrice=def?def.buy:150;
    return Math.max(4, Math.round((100-b.cond)*basePrice*0.004));
  }
  function gearRepairCost(cat){
    var g=GEAR_CATALOG[cat]; var cur=g.variants.find(function(v){return v.key===C.gear[cat];});
    var price=(cur&&cur.price)?cur.price:40;
    return Math.max(3, Math.round((100-(C.gearCond[cat]||100))*price*0.006));
  }

  window.mtRepairProp=function(idx){
    if(!hasC())return; ensureLiving();
    var p=C.properties[idx]; if(!p) return;
    if(p.cond>=100){ _toast("Kondisi sudah prima."); return; }
    var cost=propRepairCost(p);
    if(C.coin<cost){ _toast("Butuh "+cost+" keping untuk merawat."); return; }
    C.coin-=cost; p.cond=100; _sfx("coin");
    var def=PROPERTY_CATALOG.find(function(x){return x.key===p.key;});
    _log("Kau merawat "+(def?def.name:"properti")+" (-"+cost+" keping). Kondisi prima kembali.","e-good");
    _toast("Properti dirawat!"); _reflow();
  };
  window.mtRepairBiz=function(id){
    if(!hasC())return; ensureLiving();
    var b=C.businesses.find(function(x){return x.id===id;}); if(!b) return;
    if(b.cond>=100){ _toast("Kondisi sudah prima."); return; }
    var cost=bizRepairCost(b);
    if(C.coin<cost){ _toast("Butuh "+cost+" keping untuk merawat."); return; }
    C.coin-=cost; b.cond=100; _sfx("coin");
    var def=BUSINESS_TYPES.find(function(x){return x.id===b.id;});
    _log("Kau membenahi "+(def?def.name:"bisnis")+" (-"+cost+" keping).","e-good");
    _toast("Bisnis dibenahi!"); _reflow();
  };
  window.mtRepairGear=function(cat){
    if(!hasC())return; ensureLiving();
    if((C.gearCond[cat]||100)>=100){ _toast("Kondisi sudah prima."); return; }
    var cost=gearRepairCost(cat);
    if(C.coin<cost){ _toast("Butuh "+cost+" keping untuk memperbaiki."); return; }
    C.coin-=cost; C.gearCond[cat]=100; _sfx("coin");
    var g=GEAR_CATALOG[cat]; var cur=g.variants.find(function(v){return v.key===C.gear[cat];});
    _log("Kau memperbaiki "+(cur?cur.name:g.name)+" (-"+cost+" keping).","e-good");
    _toast("Perlengkapan diperbaiki!"); _reflow();
  };
  window.mtRepairAll=function(){
    if(!hasC())return; ensureLiving();
    var total=0;
    C.properties.forEach(function(p){ if(p.cond<100) total+=propRepairCost(p); });
    C.businesses.forEach(function(b){ if(b.cond<100) total+=bizRepairCost(b); });
    for(var cat in (C.gear||{})){ if((C.gearCond[cat]||100)<100) total+=gearRepairCost(cat); }
    if(total<=0){ _toast("Semua aset sudah prima."); return; }
    if(C.coin<total){ _toast("Butuh "+total+" keping untuk merawat semuanya."); return; }
    C.coin-=total;
    C.properties.forEach(function(p){ p.cond=100; });
    C.businesses.forEach(function(b){ b.cond=100; });
    for(var c2 in (C.gear||{})){ C.gearCond[c2]=100; }
    _sfx("coin"); _log("Kau merawat seluruh aset (-"+total+" keping).","e-epic");
    _toast("Semua aset dirawat!"); _reflow();
  };

  function condBar(v){
    v=Math.round(v||0);
    var col=v>=60?"#6a8a3a":(v>=30?"#b8860b":"#8b2635");
    return "<div class='exp-pbar' style='margin-top:6px'><div class='exp-pfill' style='width:"+v+"%;background:"+col+"'></div></div>"
      +"<div style='font-size:9px;color:var(--ink-soft);filter:brightness(1.7);margin-top:2px'>Kondisi "+v+"%</div>";
  }

  function maintenanceHTML(){
    if(!hasC()) return "";
    ensureLiving();
    var rows=[];
    function repairLabel(cost){
      if(typeof mantaraIcon==="function")return mantaraIcon("hammer","func-icon--pill")+" "+cost+" "+mantaraIcon("coin","func-icon--pill");
      return "Perbaiki "+cost+" koin";
    }
    C.properties.forEach(function(p,idx){
      var def=PROPERTY_CATALOG.find(function(x){return x.key===p.key;}); if(!def)return;
      rows.push("<div class='asset'><span class='assetico'>"+def.ico+"</span>"
        +"<div class='assetinfo'><div class='assetname'>"+def.name+"</div>"+condBar(p.cond)+"</div>"
        +(p.cond<100?"<button class='upbtn' onclick='mtRepairProp("+idx+")'>"+repairLabel(propRepairCost(p))+"</button>":"<span style='font-size:10px;color:var(--good)'>PRIMA</span>")+"</div>");
    });
    C.businesses.forEach(function(b){
      var def=BUSINESS_TYPES.find(function(x){return x.id===b.id;}); if(!def)return;
      rows.push("<div class='asset'><span class='assetico'>"+def.ico+"</span>"
        +"<div class='assetinfo'><div class='assetname'>"+def.name+"</div>"+condBar(b.cond)+"</div>"
        +(b.cond<100?"<button class='upbtn' onclick=\"mtRepairBiz('"+b.id+"')\">"+repairLabel(bizRepairCost(b))+"</button>":"<span style='font-size:10px;color:var(--good)'>PRIMA</span>")+"</div>");
    });
    for(var cat in (C.gear||{})){
      var g=GEAR_CATALOG[cat]; if(!g)continue; if(g.arcane&&!C.isMage)continue;
      var cur=g.variants.find(function(v){return v.key===C.gear[cat];}); if(!cur)continue;
      if((cur.price||0)===0 && (C.gearCond[cat]||100)>=100) continue;
      (function(cat,cur){
        rows.push("<div class='asset'><span class='assetico'>"+(typeof mantaraGearIcon==="function"?mantaraGearIcon(cat,cur.key):g.ico)+"</span>"
          +"<div class='assetinfo'><div class='assetname'>"+cur.name+"</div>"+condBar(C.gearCond[cat])+"</div>"
          +((C.gearCond[cat]||100)<100?"<button class='upbtn' onclick=\"mtRepairGear('"+cat+"')\">"+repairLabel(gearRepairCost(cat))+"</button>":"<span style='font-size:10px;color:var(--good)'>PRIMA</span>")+"</div>");
      })(cat,cur);
    }
    if(!rows.length) return "";
    return "<div class='sechead'>🔧 Perawatan Aset</div>"
      +"<p style='font-size:10.5px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 8px;line-height:1.5;'>Semua aset menua tiap tahun. Rawat agar income & bonus tetap penuh — kondisi rendah menurunkan hasil, gear bisa rusak.</p>"
      +rows.join("")
      +"<div class='tiles' style='margin-top:2px'><div class='tile fullrow' onclick='mtRepairAll()'><span class='ti'>✨</span><span class='tn'>Rawat Semua Aset</span><span class='td'>Bayar sekali, semua kembali prima.</span></div></div>";
  }

  try{
    if(typeof renderAset==="function"){
      var _prevRA=renderAset;
      renderAset=function(){
        var r=_prevRA.apply(this,arguments);
        try{
          var host=document.getElementById("viewAset");
          if(host){
            var mh=maintenanceHTML();
            var ph=petsSectionHTML();
            if(mh) host.innerHTML+=mh;
            if(ph) host.innerHTML+=ph;
          }
        }catch(e2){}
        return r;
      };
    }
  }catch(e){}

  /* ============================================================
     3) PELIHARAAN FANTASI
     ============================================================ */
  var PET_SPECIES=[
    {key:"moon_cat",ico:"🐈",name:"Kucing Bulan",cost:30,upkeep:4,bonus:{happy:2},arcane:false,desc:"Teman tenang yang menenangkan jiwa."},
    {key:"dire_wolf",ico:"🐺",name:"Serigala Dire",cost:70,upkeep:8,bonus:{might:2,health:1},arcane:false,desc:"Pemburu setia, memperkuat nyali bertarung."},
    {key:"war_hawk",ico:"🦅",name:"Elang Perang",cost:90,upkeep:8,bonus:{mind:1,charm:1},arcane:false,desc:"Mata dari langit, tajam membaca medan."},
    {key:"war_boar",ico:"🐗",name:"Babi Hutan Baja",cost:120,upkeep:10,bonus:{might:3},arcane:false,desc:"Tunggangan brutal untuk penyerbu garis depan."},
    {key:"unicorn",ico:"🦄",name:"Unicorn",cost:340,upkeep:22,bonus:{charm:3,mana:1},arcane:false,desc:"Makhluk suci, memancarkan pesona & berkah."},
    {key:"gryphon",ico:"🦁",name:"Gryphon",cost:420,upkeep:26,bonus:{might:2,mana:1,mind:1},arcane:false,desc:"Raja langit bersayap, kebanggaan para ksatria."},
    {key:"drakeling",ico:"🐉",name:"Naga Kecil",cost:260,upkeep:20,bonus:{might:3,mana:2},arcane:true,desc:"Anak naga — tumbuh menakutkan seiring waktu."},
    {key:"phoenix",ico:"🔥",name:"Anak Phoenix",cost:520,upkeep:30,bonus:{mana:3,health:2},arcane:true,desc:"Terlahir dari bara, memberi vitalitas abadi."},
    {key:"spirit_owl",ico:"🦉",name:"Burung Hantu Arwah",cost:200,upkeep:16,bonus:{mind:3,mana:1},arcane:true,desc:"Penjaga rahasia arcane & pengetahuan kuno."},
    {key:"slime",ico:"🟢",name:"Slime Peliharaan",cost:25,upkeep:3,bonus:{happy:1,mind:1},arcane:false,desc:"Menggemaskan, mudah dirawat, selalu ceria."}
  ];
  function petDef(key){ return PET_SPECIES.find(function(s){return s.key===key;}); }
  function petMax(){ return 4; }

  function petPower(p){
    var def=petDef(p.key); if(!def) return 0;
    var b=def.bonus, sum=0; for(var k in b) sum+=b[k];
    return Math.round(sum*(1+(p.level-1)*0.5)*(0.5+ (p.bond/100)*0.5) * (0.6+ (p.cond/100)*0.4));
  }
  function petsTotalCombat(){
    if(!hasC()||!Array.isArray(C.pets)) return 0;
    var t=0; C.pets.forEach(function(p){ t+=petPower(p); }); return t;
  }

  function processPetsYear(){
    if(!hasC()||!Array.isArray(C.pets)||!C.pets.length) return;
    var totalUpkeep=0;
    var survivors=[];
    C.pets.forEach(function(p){
      var def=petDef(p.key); if(!def){ return; }
      p.age=(p.age||0)+1;
      if(C.coin>=def.upkeep){ C.coin-=def.upkeep; totalUpkeep+=def.upkeep; p.cond=_cl((p.cond||100)+ _ri(2,6)); }
      else { p.cond=_cl((p.cond||100)- _ri(12,22)); p.bond=_cl((p.bond||60)- _ri(3,8)); }
      p.cond=_cl(p.cond-_ri(6,12));
      if(p.bond>=40){
        var scale=(p.level)*(0.4+(p.bond/100)*0.6);
        var gained={};
        for(var k in def.bonus){ var g=Math.round(def.bonus[k]*scale*0.5); if(g>0) gained[k]=(gained[k]||0)+g; }
        if(Object.keys(gained).length && typeof applyStats==="function") applyStats(gained);
      }
      if((def.key==="drakeling"||def.key==="phoenix"||def.key==="gryphon") && p.level<5 && p.age>0 && p.age%3===0 && p.bond>=55){
        p.level++; _log(p.name+" tumbuh makin perkasa! (Tingkat "+p.level+")","e-epic");
      }
      if(p.cond<=0 && p.bond<25 && _ch(0.5)){
        _log(p.name+" pergi meninggalkanmu karena terlantar.","e-bad");
      }else{
        survivors.push(p);
      }
    });
    C.pets=survivors;
    if(totalUpkeep>0) _log("Biaya merawat peliharaan tahun ini: "+totalUpkeep+" keping.","");
  }

  function petName(def){
    var pool=["Auron","Vayra","Kael","Nix","Ember","Sable","Luna","Fenrir","Zephyr","Onyx","Aria","Draco","Selka","Rune","Coral"];
    return _rand(pool);
  }
  window.petAdopt=function(key){
    if(!hasC())return; ensureLiving();
    var def=petDef(key); if(!def) return;
    if(def.arcane && !C.isMage){ _toast("Hanya penyihir yang bisa mengikat makhluk arcane."); return; }
    if(C.pets.length>=petMax()){ _toast("Kandangmu penuh (maks "+petMax()+")."); return; }
    if(C.coin<def.cost){ _toast("Butuh "+def.cost+" keping."); return; }
    C.coin-=def.cost; _sfx("coin");
    var nm=petName(def);
    C.pets.push({key:key,name:nm,level:1,bond:60,cond:100,age:0});
    _log("Kau mengangkat "+def.ico+" "+nm+" ("+def.name+") sebagai peliharaan!","e-epic");
    _toast(nm+" bergabung!"); _reflow();
  };
  window.petFeed=function(idx){
    if(!hasC())return; var p=C.pets[idx]; if(!p)return;
    var def=petDef(p.key); var cost=Math.max(3,Math.round((def?def.upkeep:6)*1.5));
    if(C.coin<cost){ _toast("Butuh "+cost+" keping."); return; }
    C.coin-=cost; p.cond=_cl(p.cond+_ri(15,28)); p.bond=_cl(p.bond+_ri(2,5)); _sfx("coin");
    _toast(p.name+" kenyang & senang."); _reflow();
  };
  window.petTrain=function(idx){
    if(!hasC())return; var p=C.pets[idx]; if(!p)return;
    if(p.cond<20){ _toast(p.name+" terlalu lemah untuk berlatih. Beri makan dulu."); return; }
    p.cond=_cl(p.cond-_ri(6,12)); p.bond=_cl(p.bond+_ri(6,12));
    var def=petDef(p.key);
    if(def && typeof applyStats==="function"){ var g={}; for(var k in def.bonus){ g[k]=1; break; } applyStats(g); }
    if(p.level<5 && p.bond>=70 && _ch(0.35)){ p.level++; _log(p.name+" naik ke Tingkat "+p.level+"!","e-epic"); _toast(p.name+" makin kuat!"); }
    else _toast(p.name+" berlatih bersamamu.");
    _reflow();
  };
  window.petPlay=function(idx){
    if(!hasC())return; var p=C.pets[idx]; if(!p)return;
    p.bond=_cl(p.bond+_ri(5,10)); if(typeof applyStats==="function") applyStats({happy:+_ri(2,5)});
    _toast("Kau bermain dengan "+p.name+". Ikatan menguat."); _reflow();
  };
  window.petRelease=function(idx){
    if(!hasC())return; var p=C.pets[idx]; if(!p)return;
    if(typeof openChoice==="function"){
      openChoice({ico:"💔",prompt:"Lepaskan <b>"+_esc(p.name)+"</b> ke alam liar?",choices:[
        {label:"Ya, lepaskan",cls:"danger",run:function(){ C.pets.splice(idx,1); _log("Kau melepas "+p.name+" ke kebebasan.",""); return {t:p.name+" kini bebas.",cls:""}; }},
        {label:"Batal",run:function(){ return null; }}
      ]});
    }
  };
  window.petManage=function(idx){
    if(!hasC())return; var p=C.pets[idx]; var def=petDef(p.key); if(!p||!def)return;
    if(typeof openChoice==="function"){
      openChoice({ico:def.ico,prompt:"<b>"+_esc(p.name)+"</b> · "+def.name+" · Tingkat "+p.level+"<br><span style='font-size:11px;color:var(--ink-soft);filter:brightness(1.6)'>Ikatan "+Math.round(p.bond)+"% · Kondisi "+Math.round(p.cond)+"%</span>",
        choices:[
          {label:"🍖 Beri makan",sub:"kondisi & ikatan naik",run:function(){ window.petFeed(idx); return null; }},
          {label:"⚔️ Latih",sub:"ikatan & kekuatan naik",run:function(){ window.petTrain(idx); return null; }},
          {label:"🎾 Bermain",sub:"ikatan & bahagia",run:function(){ window.petPlay(idx); return null; }},
          {label:"💔 Lepaskan",cls:"danger",run:function(){ window.petRelease(idx); return null; }}
        ]});
    }
  };

  function petsSectionHTML(){
    if(!hasC()) return "";
    ensureLiving();
    if(!C.pets.length) return "";
    var rows=C.pets.map(function(p,idx){
      var def=petDef(p.key); if(!def) return "";
      var pw=petPower(p);
      return "<div class='asset'><span class='assetico'>"+def.ico+"</span>"
        +"<div class='assetinfo'><div class='assetname'>"+_esc(p.name)+" <span style='font-size:9px;color:var(--gold)'>Tk."+p.level+"</span></div>"
        +"<div class='assetlvl'>"+def.name+" · ⚔️ +"+pw+" tempur</div>"
        +condBar(p.cond)
        +"<div style='font-size:9px;color:var(--arcane-glow);margin-top:1px'>Ikatan "+Math.round(p.bond)+"%</div></div>"
        +"<button class='upbtn' onclick='petManage("+idx+")'>Rawat</button></div>";
    }).join("");
    return "<div class='sechead'>🐾 Peliharaan ("+C.pets.length+"/"+petMax()+")</div>"
      +"<p style='font-size:10.5px;color:var(--ink-soft);filter:brightness(1.6);margin:0 4px 8px;line-height:1.5;'>Beri makan & latih untuk menaikkan ikatan, kekuatan, dan bonus stat pasif. Adopsi makhluk baru di <b>Guild 🛡️ → Kandang</b>.</p>"
      +rows;
  }

  /* ============================================================
     4) GUILD PETUALANG — papan bounty berjenjang
     ============================================================ */
  var GUILD_RANKS=["Perekrut","Petualang","Pemburu","Ksatria Guild","Pahlawan","Legenda"];
  function guildRank(){ return (hasC()&&C._guild)?Math.min(GUILD_RANKS.length-1,C._guild.rank):0; }
  function guildPower(){
    if(!hasC()) return 0;
    var s=C.stats||{};
    var p=(s.might||0) + (C.isMage?(s.mana||0)*0.9:0) + (s.mind||0)*0.25 + (C.reputation||0)*0.2;
    try{
      for(var cat in (C.gear||{})){
        var g=GEAR_CATALOG[cat]; if(!g)continue;
        var v=g.variants.find(function(x){return x.key===C.gear[cat];});
        if(v&&v.perk){ p+=(v.perk.might||0)+(v.perk.mana||0); }
      }
    }catch(e){}
    p+=petsTotalCombat();
    p+=guildRank()*6;
    return Math.round(p);
  }

  var BOUNTIES=[
    {tier:0,ico:"👺",name:"Basmi Kawanan Goblin",diff:"Mudah",req:20,coin:[30,60],rep:2,hurt:[2,8]},
    {tier:0,ico:"🐀",name:"Bersihkan Sarang Tikus Raksasa",diff:"Mudah",req:26,coin:[40,75],rep:2,hurt:[3,9]},
    {tier:1,ico:"🐺",name:"Buru Serigala Iblis",diff:"Sedang",req:40,coin:[70,130],rep:4,hurt:[5,14]},
    {tier:1,ico:"🕷️",name:"Basmi Ratu Laba-laba",diff:"Sedang",req:48,coin:[90,160],rep:5,hurt:[6,16]},
    {tier:2,ico:"🗿",name:"Hancurkan Golem Batu",diff:"Sulit",req:66,coin:[150,260],rep:7,hurt:[8,20],item:true},
    {tier:2,ico:"🧟",name:"Halau Gerombolan Mayat Hidup",diff:"Sulit",req:74,coin:[170,300],rep:8,hurt:[9,22],item:true},
    {tier:3,ico:"🐉",name:"Tumbangkan Naga Muda",diff:"Berbahaya",req:95,coin:[320,520],rep:12,hurt:[12,28],item:true},
    {tier:3,ico:"👹",name:"Kalahkan Raja Ogre",diff:"Berbahaya",req:104,coin:[350,560],rep:13,hurt:[13,30],item:true},
    {tier:4,ico:"💀",name:"Musnahkan Lich Kuno",diff:"Mematikan",req:135,coin:[600,950],rep:18,hurt:[16,34],item:true},
    {tier:4,ico:"👁️",name:"Segel Iblis Kegelapan",diff:"Mematikan",req:150,coin:[700,1100],rep:20,hurt:[18,36],item:true},
    {tier:5,ico:"🐲",name:"Bunuh Naga Hitam Purba",diff:"NERAKA",req:185,coin:[1400,2200],rep:30,hurt:[22,42],item:true,legend:true}
  ];
  function bountyPool(){
    var rk=guildRank();
    return BOUNTIES.filter(function(b){ return b.tier<=rk+1; });
  }
  function winChance(b){
    var pw=guildPower();
    var ratio=pw/b.req;
    var c=0.15 + (ratio-1)*0.55 + 0.15;
    return Math.max(0.05,Math.min(0.95,c));
  }

  window.guildAttempt=function(idx){
    if(!hasC()){ _toast("Mulai hidup dulu."); return; }
    if(C.age<15){ _toast("Guild menerima petualang usia 15+."); return; }
    ensureLiving();
    var pool=bountyPool(); var b=pool[idx]; if(!b) return;
    var wc=winChance(b);
    var win=_ch(wc);
    if(win){
      var reward=_ri(b.coin[0],b.coin[1]);
      C.coin+=reward; C.reputation=(C.reputation||0)+b.rep;
      C._guild.xp=(C._guild.xp||0)+ (b.tier+1)*10; C._guild.done=(C._guild.done||0)+1;
      var hurt=_ri(Math.max(1,Math.round(b.hurt[0]*0.4)),Math.max(2,Math.round(b.hurt[1]*0.5)));
      if(typeof applyStats==="function") applyStats({health:-hurt,might:+1,happy:+_ri(4,9)});
      var gotItem="";
      if(b.item && _ch(0.5) && typeof addItem==="function"){
        var it=_rand(["lucky_coin","ancient_scroll","training_manual","charm_perfume"]);
        addItem(it); gotItem=" Kau juga menjarah barang langka!";
      }
      guildCheckRank();
      _sfx("year");
      _log("Bounty selesai: "+b.name+"! +"+reward+" keping, +"+b.rep+" reputasi."+gotItem,"e-epic");
      if(b.legend){ _log("Kau menumbangkan Naga Hitam Purba — namamu terukir sebagai legenda!","e-epic"); }
      _toast("Bounty berhasil! +"+reward+" koin");
    }else{
      C._guild.fail=(C._guild.fail||0)+1;
      var hurt2=_ri(b.hurt[0],b.hurt[1]);
      if(typeof applyStats==="function") applyStats({health:-hurt2,happy:-_ri(3,7)});
      _sfx("death");
      _log("Bounty gagal: "+b.name+". Kau terluka (-"+hurt2+" nyawa) dan mundur.","e-bad");
      _toast("Bounty gagal — kau terluka.");
      if(C.stats && C.stats.health<=0 && typeof die==="function"){ die("Gugur menjalankan bounty "+b.name+"."); }
    }
    _reflow();
  };

  function guildCheckRank(){
    if(!C._guild) return;
    var need=(C._guild.rank+1)*40;
    while(C._guild.rank<GUILD_RANKS.length-1 && C._guild.xp>=need){
      C._guild.rank++;
      _log("Pangkat Guild naik: "+GUILD_RANKS[C._guild.rank]+"!","e-epic");
      _toast("Pangkat Guild: "+GUILD_RANKS[C._guild.rank]);
      need=(C._guild.rank+1)*40;
    }
  }

  /* ---------- overlay Guild (FAB terpisah) ---------- */
  var gldTab="Bounty";
  function ensureGuildUI(){
    if(document.getElementById("gldFab")) return;
    if(!document.getElementById("gld-style")){
      var st=document.createElement("style"); st.id="gld-style";
      st.textContent=".gld-fab{position:fixed;z-index:9990;top:calc(var(--app-safe-top,env(safe-area-inset-top,0px)) + 8px);right:60px;width:42px;height:42px;border-radius:50%;"
        +"border:1px solid var(--blood);background:radial-gradient(circle at 35% 30%,#3a1f22,#1c140d);color:#f0c040;font-size:20px;cursor:pointer;"
        +"box-shadow:0 0 14px rgba(139,38,53,.5);display:flex;align-items:center;justify-content:center;transition:transform .12s;}"
        +".gld-fab:active{transform:scale(.9);}";
      document.head.appendChild(st);
    }
    var b=document.createElement("button");
    b.id="gldFab"; b.className="gld-fab"; b.setAttribute("aria-label","Guild Petualang");
    b.innerHTML="🛡️";
    b.onclick=window.gldOpen;
    document.body.appendChild(b);
    var ov=document.createElement("div");
    ov.id="gldOverlay"; ov.className="exp-ov";
    ov.innerHTML="<div class='exp-panel'><div class='exp-head'><span class='exp-title'>🛡️ GUILD PETUALANG</span>"
      +"<span class='exp-crystals' id='gldRankLbl'></span>"
      +"<button class='exp-x' onclick='gldClose()'>✕</button></div>"
      +"<div class='exp-tabs' id='gldTabs'></div><div class='exp-body' id='gldBody'></div></div>";
    ov.addEventListener("click",function(e){ if(e.target===ov) window.gldClose(); });
    document.body.appendChild(ov);
  }
  window.gldOpen=function(){ ensureGuildUI(); ensureLiving(); document.getElementById("gldOverlay").classList.add("show"); gldRenderTabs(); gldRender(); };
  window.gldClose=function(){ var ov=document.getElementById("gldOverlay"); if(ov) ov.classList.remove("show"); };
  window.gldTabSet=function(t){ gldTab=t; gldRenderTabs(); gldRender(); };
  function gldRenderTabs(){
    var host=document.getElementById("gldTabs"); if(!host) return;
    var tabs=[["Bounty","📜"],["Peliharaan","🐾"],["Kandang","⛺"]];
    host.innerHTML=tabs.map(function(t){
      return "<button class='exp-tab "+(gldTab===t[0]?"on":"")+"' onclick=\"gldTabSet('"+t[0]+"')\">"+t[1]+" "+t[0]+"</button>";
    }).join("");
    var rl=document.getElementById("gldRankLbl");
    if(rl) rl.textContent = hasC()? ("🎖️ "+GUILD_RANKS[guildRank()]) : "";
  }
  function gldRender(){
    var body=document.getElementById("gldBody"); if(!body) return;
    if(gldTab==="Bounty") body.innerHTML=viewBounty();
    else if(gldTab==="Peliharaan") body.innerHTML=viewPetsTab();
    else body.innerHTML=viewKennel();
    var rl=document.getElementById("gldRankLbl");
    if(rl) rl.textContent = hasC()? ("🎖️ "+GUILD_RANKS[guildRank()]) : "";
  }

  function viewBounty(){
    if(!hasC()) return "<div class='exp-empty'>🛡️<br>Guild hanya melayani jiwa yang sedang menjalani hidup.<br>Mulai atau lanjutkan kehidupan dulu.</div>";
    if(C.age<15) return "<div class='exp-empty'>📜<br>Guild menerima petualang berusia 15+.<br>Usiamu kini "+C.age+".</div>";
    var pw=guildPower();
    var html="<div class='exp-hero' style='background:linear-gradient(150deg,#2a1f22,#16110c);border-color:var(--blood)'>"
      +"<div class='lg' style='color:#f0c040'>⚔️ "+pw+"</div><div class='lb'>Kekuatan Tempur</div>"
      +"<div class='sub'>Pangkat "+GUILD_RANKS[guildRank()]+" · Bounty tuntas: "+(C._guild.done||0)+"</div></div>";
    html+="<div class='exp-desc' style='margin:2px 2px 10px'>Ambil bounty untuk keping, reputasi & barang langka. Bebas diambil kapan saja — makin sulit, makin besar hadiah & risikonya. Perkuat stat, gear, dan peliharaanmu untuk menang.</div>";
    var pool=bountyPool();
    pool.forEach(function(b,idx){
      var wc=Math.round(winChance(b)*100);
      var col=wc>=60?"var(--good)":(wc>=35?"var(--gold-bright)":"var(--bad)");
      html+="<div class='exp-card'><div class='exp-row'>"
        +"<div class='exp-ico'>"+b.ico+"</div>"
        +"<div style='flex:1'><div class='exp-name'>"+b.name+(b.legend?" 👑":"")+"</div>"
        +"<div class='exp-desc'>Kesulitan: <b style='color:"+col+"'>"+b.diff+"</b> · Hadiah "+b.coin[0]+"–"+b.coin[1]+" koin · +"+b.rep+"⭐"+(b.item?" · 🎁 langka":"")+"</div>"
        +"<div class='exp-lvl'>Peluang menang: <b style='color:"+col+"'>"+wc+"%</b> (butuh kekuatan ~"+b.req+")</div></div>"
        +"<button class='exp-btn' onclick='guildAttempt("+idx+")'>Ambil</button></div></div>";
    });
    return html;
  }
  function viewPetsTab(){
    if(!hasC()) return "<div class='exp-empty'>🐾<br>Peliharaan menemani jiwa yang hidup.</div>";
    ensureLiving();
    if(!C.pets.length) return "<div class='exp-empty'>🐾<br>Kau belum punya peliharaan.<br>Adopsi makhluk di tab <b>Kandang ⛺</b>.</div>";
    var html="<div class='exp-desc' style='margin:2px 2px 10px'>Rawat peliharaanmu: beri makan agar tetap sehat, latih untuk naik tingkat & memperkuat bonus tempur/pasif. Ikatan tinggi = bonus lebih besar.</div>";
    C.pets.forEach(function(p,idx){
      var def=petDef(p.key); if(!def)return;
      var condCol=p.cond>=60?"#6a8a3a":(p.cond>=30?"#b8860b":"#8b2635");
      html+="<div class='exp-card'><div class='exp-row'>"
        +"<div class='exp-ico'>"+def.ico+"</div>"
        +"<div style='flex:1'><div class='exp-name'>"+_esc(p.name)+" <span style='font-size:9px;color:var(--gold)'>Tk."+p.level+"</span></div>"
        +"<div class='exp-desc'>"+def.name+" · ⚔️ +"+petPower(p)+" tempur · umur "+(p.age||0)+"th</div>"
        +"<div class='exp-pbar' style='margin-top:6px'><div class='exp-pfill' style='width:"+Math.round(p.cond)+"%;background:"+condCol+"'></div></div>"
        +"<div class='exp-lvl'>Kondisi "+Math.round(p.cond)+"% · Ikatan "+Math.round(p.bond)+"%</div></div></div>"
        +"<div style='display:flex;gap:6px;margin-top:9px'>"
        +"<button class='exp-btn' style='margin:0;flex:1;font-size:10px' onclick='petFeed("+idx+")'>🍖 Makan</button>"
        +"<button class='exp-btn' style='margin:0;flex:1;font-size:10px' onclick='petTrain("+idx+")'>⚔️ Latih</button>"
        +"<button class='exp-btn ghost' style='margin:0;flex:1;font-size:10px' onclick='petPlay("+idx+")'>🎾 Main</button>"
        +"<button class='exp-btn ghost' style='margin:0;font-size:10px' onclick='petRelease("+idx+")'>💔</button></div></div>";
    });
    return html;
  }
  function viewKennel(){
    if(!hasC()) return "<div class='exp-empty'>⛺<br>Kandang terbuka untuk jiwa yang hidup.</div>";
    ensureLiving();
    var html="<div class='exp-hero'><div class='lg'>🐾 "+C.pets.length+"/"+petMax()+"</div><div class='lb'>Peliharaan Dimiliki</div>"
      +"<div class='sub'>Adopsi makhluk fantasi untuk menemani & memperkuatmu.</div></div>";
    html+="<div class='exp-desc' style='margin:2px 2px 10px'>Tiap makhluk memberi bonus stat pasif tahunan & kekuatan tempur untuk bounty. Makhluk arcane butuh darah penyihir. Ada biaya rawat tiap tahun.</div>";
    PET_SPECIES.forEach(function(s){
      var locked=(s.arcane && !C.isMage);
      var full=C.pets.length>=petMax();
      var afford=C.coin>=s.cost;
      var bonusStr=Object.keys(s.bonus).map(function(k){ return ((typeof STAT_META!=="undefined"&&STAT_META[k])?STAT_META[k].name:k)+" +"+s.bonus[k]; }).join(", ");
      var dis=locked||full||!afford;
      html+="<div class='exp-card'><div class='exp-row'>"
        +"<div class='exp-ico'>"+s.ico+"</div>"
        +"<div style='flex:1'><div class='exp-name'>"+s.name+(s.arcane?" ✨":"")+"</div>"
        +"<div class='exp-desc'>"+s.desc+"</div>"
        +"<div class='exp-lvl'>💰"+s.cost+" · rawat "+s.upkeep+"/th · bonus "+bonusStr+"</div></div>"
        +"<button class='exp-btn "+(dis?"dis":"")+"' onclick=\"petAdopt('"+s.key+"')\">"+(locked?"🔒":"Adopsi")+"</button></div></div>";
    });
    return html;
  }

  /* ============================================================
     HOOKS TAHUNAN
     ============================================================ */
  try{
    if(typeof processYearly==="function"){
      var _prevPY=processYearly;
      processYearly=function(){
        var r=_prevPY.apply(this,arguments);
        try{ ensureLiving(); degradeAssets(); bizConditionPenalty(); processPetsYear(); }catch(e){}
        return r;
      };
    }
  }catch(e){}

  try{
    if(typeof myPower==="function"){
      var _prevMyPower=myPower;
      myPower=function(){
        var base=_prevMyPower.apply(this,arguments);
        try{ base+=petsTotalCombat()*0.6; }catch(e){}
        return base;
      };
    }
  }catch(e){}

  function mountGuild(){ try{ ensureGuildUI(); }catch(e){} }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",function(){ setTimeout(mountGuild,120); });
  else setTimeout(mountGuild,120);

  // v25: PET_SPECIES & helper peliharaan dulunya privat di dalam IIFE ini,
  // sehingga modul Bestia Terikat tidak bisa membacanya sama sekali.
  window.__mantaraLiving={petsTotalCombat:petsTotalCombat,guildPower:guildPower,ensureLiving:ensureLiving,
    PET_SPECIES:PET_SPECIES,petDef:petDef,petMax:petMax,petPower:petPower};
})();
