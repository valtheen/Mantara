/* ==================================================================
   MANTARA — TOKO HALAMAN + BALAI TEMPA
   • Toko tak lagi popup: jadi halaman penuh (pushPage) di Dunia/kota.
   • Item bukan sekadar "beli": tiap perlengkapan punya halaman detail
     dengan Beli varian, Tempa (enhance berjenjang), Modifikasi (reforge
     keajaiban), Perbaiki kondisi, dan Jual kembali.
   Modul mandiri. Memakai ulang sistem halaman (pgRow/pushPage) & util.
   ================================================================== */
(function(){
  "use strict";
  var MAXPLUS=8;
  function hasC(){ return typeof C!=="undefined" && C && C.alive; }
  function _ri(a,b){ return (typeof ri==="function")?ri(a,b):Math.floor(Math.random()*(b-a+1))+a; }
  function _rand(a){ return (typeof rand==="function")?rand(a):a[Math.floor(Math.random()*a.length)]; }
  function _toast(t){ try{ if(typeof toast==="function") toast(t); }catch(e){} }
  function _sfx(n){ try{ if(typeof playSFX==="function") playSFX(n); }catch(e){} }
  function _log(t,cls){ try{ if(typeof log==="function") log(C.age,t,cls||""); }catch(e){} }
  function statName(k){ try{ return (typeof STAT_META!=="undefined"&&STAT_META[k])?STAT_META[k].name:k; }catch(e){ return k; } }
  function hud(){ try{ if(typeof updateTitle==="function")updateTitle(); if(typeof renderHidup==="function")renderHidup(); if(typeof renderAset==="function")renderAset(); }catch(e){} }
  function refresh(){ hud(); try{ if(typeof mpRefresh==="function") mpRefresh(); }catch(e){} }

  var AFFIXES=[
    {name:"Berapi",perk:{might:2}},
    {name:"Beku",perk:{mana:2}},
    {name:"Tajam",perk:{might:1,mind:1}},
    {name:"Agung",perk:{charm:2}},
    {name:"Kokoh",perk:{health:2}},
    {name:"Arcane",perk:{mana:1,mind:1}},
    {name:"Bercahaya",perk:{charm:1,happy:1}},
    {name:"Ganas",perk:{might:3}},
    {name:"Bijak",perk:{mind:2}},
    {name:"Lincah",perk:{might:1,charm:1}}
  ];

  function ensureGearMeta(){
    if(!hasC()) return;
    if(!C.gearPlus) C.gearPlus={};
    if(!C.gearAffix) C.gearAffix={};
    if(!C.gearCond) C.gearCond={};
    if(C.gear){ for(var cat in C.gear){
      if(C.gearPlus[cat]==null) C.gearPlus[cat]=0;
      if(C.gearCond[cat]==null) C.gearCond[cat]=100;
    } }
  }

  function variantOf(cat){ try{ var g=GEAR_CATALOG[cat]; return g.variants.find(function(v){return v.key===C.gear[cat];}); }catch(e){ return null; } }
  function basePrice(cat){ var v=variantOf(cat); return (v&&v.price)?v.price:60; }

  // ---- perk efektif (bonus di atas base variant) ----
  function gearBonusPerk(cat){
    if(!hasC()) return {};
    var g=GEAR_CATALOG[cat]; if(!g) return {};
    var v=g.variants.find(function(x){return x.key===C.gear[cat];}); if(!v) return {};
    var out={}; var plus=(C.gearPlus&&C.gearPlus[cat])||0; var k;
    if(v.perk){ for(k in v.perk){ var add=Math.round(v.perk[k]*0.25*plus); if(add) out[k]=(out[k]||0)+add; } }
    var af=C.gearAffix&&C.gearAffix[cat];
    if(af&&af.perk){ for(k in af.perk){ if(typeof af.perk[k]==="number") out[k]=(out[k]||0)+af.perk[k]; } }
    return out;
  }
  function effPerk(cat){
    var v=variantOf(cat); var out={}; var k;
    if(v&&v.perk){ for(k in v.perk) out[k]=(out[k]||0)+v.perk[k]; }
    var b=gearBonusPerk(cat); for(k in b) out[k]=(out[k]||0)+b[k];
    return out;
  }
  function perkStr(perk){
    var s=Object.keys(perk||{}).map(function(k){ return statName(k)+" +"+perk[k]; }).join(", ");
    return s||"—";
  }

  // ---- biaya ----
  function enhanceCost(cat){ var plus=(C.gearPlus[cat]||0); return Math.max(20, Math.round(basePrice(cat)*0.18*(plus+1))); }
  function reforgeCost(cat){ return Math.max(25, Math.round(basePrice(cat)*0.22)+15); }
  function gearRepairCostPub(cat){
    var v=variantOf(cat); var price=(v&&v.price)?v.price:40;
    var cond=(C.gearCond[cat]!=null)?C.gearCond[cat]:100;
    return Math.max(3, Math.round((100-cond)*price*0.006));
  }
  function sellPrice(cat){
    var v=variantOf(cat); if(!v||!v.price) return 0;
    var cond=(C.gearCond[cat]!=null)?C.gearCond[cat]:100;
    var plus=(C.gearPlus[cat]||0);
    var af=C.gearAffix&&C.gearAffix[cat]?1:0;
    return Math.round(v.price*0.5*(cond/100) + plus*v.price*0.12 + af*v.price*0.08);
  }

  // ---- aksi ----
  function enhanceGear(cat){
    ensureGearMeta();
    var plus=(C.gearPlus[cat]||0);
    if(plus>=MAXPLUS){ _toast("Sudah maksimal (+"+MAXPLUS+")."); return; }
    var cost=enhanceCost(cat);
    if(C.coin<cost){ _toast("Butuh "+cost+" keping untuk menempa."); return; }
    C.coin-=cost; C.gearPlus[cat]=plus+1; _sfx("coin");
    var v=variantOf(cat);
    _log("Kau menempa "+(v?v.name:GEAR_CATALOG[cat].name)+" ke +"+(plus+1)+" (-"+cost+" keping). Kekuatannya meningkat!","e-epic");
    _toast((v?v.name:"Perlengkapan")+" +"+(plus+1)+"!");
    refresh();
  }
  function reforgeGear(cat){
    ensureGearMeta();
    var cost=reforgeCost(cat);
    if(C.coin<cost){ _toast("Butuh "+cost+" keping untuk reforge."); return; }
    C.coin-=cost;
    var af=_rand(AFFIXES);
    C.gearAffix[cat]={name:af.name,perk:af.perk}; _sfx("coin");
    var v=variantOf(cat);
    _log("Reforge berhasil! "+(v?v.name:"Perlengkapan")+" kini menyandang keajaiban «"+af.name+"» ("+perkStr(af.perk)+").","e-epic");
    _toast("Keajaiban baru: «"+af.name+"»");
    refresh();
  }
  function sellGear(cat){
    ensureGearMeta();
    var v=variantOf(cat);
    if(!v||v.key==="none"||!v.price){ _toast("Tak ada yang bisa dijual."); return; }
    var g=Math.max(1,sellPrice(cat));
    var name=v.name;
    // kembali ke varian dasar (none/gratis)
    var baseV=GEAR_CATALOG[cat].variants.find(function(x){return (x.price||0)===0;});
    C.gear[cat]=baseV?baseV.key:GEAR_CATALOG[cat].variants[0].key;
    C.gearPlus[cat]=0; C.gearAffix[cat]=null; C.gearCond[cat]=100;
    C.coin+=g; _sfx("coin");
    _log("Kau menjual "+name+" seharga "+g+" keping.","e-good");
    _toast("Terjual +"+g+" koin");
    refresh();
  }
  function buyVariant(cat,vkey){
    ensureGearMeta();
    var g=GEAR_CATALOG[cat]; var v=g.variants.find(function(x){return x.key===vkey;}); if(!v) return;
    if(C.gear[cat]===vkey){ _toast("Sudah dipakai."); return; }
    if((v.price||0)>0 && C.coin<v.price){ _toast("Koin tak cukup ("+v.price+")."); return; }
    if(v.price) C.coin-=v.price;
    C.gear[cat]=vkey; C.gearPlus[cat]=0; C.gearAffix[cat]=null; C.gearCond[cat]=100; _sfx("coin");
    _log("Kau memperoleh & memakai "+v.name+(v.price?" (-"+v.price+" keping)":"")+".","e-good");
    _toast(v.name+" dipakai.");
    refresh();
  }
  window.mtRepairGearPage=function(cat){ try{ if(typeof window.mtRepairGear==="function"){ window.mtRepairGear(cat); refresh(); } }catch(e){} };

  // ---- halaman detail satu slot gear ----
  function gearSlotHTML(cat){
    ensureGearMeta();
    var g=GEAR_CATALOG[cat]; if(!g) return "";
    var v=variantOf(cat); var plus=C.gearPlus[cat]||0; var af=C.gearAffix&&C.gearAffix[cat];
    var cond=(C.gearCond[cat]!=null)?C.gearCond[cat]:100;
    var owned=v && v.key!=="none";
    var html="";
    // kartu status
    var eff=effPerk(cat);
    var condCol=cond>=60?"var(--good)":(cond>=30?"var(--gold)":"var(--bad)");
    html+="<div class='pg-hero' style='text-align:center;padding:14px 12px;margin:2px 0 10px;background:linear-gradient(155deg,var(--card),var(--bg1));border:1px solid var(--line);border-radius:14px'>"
      +"<div style='font-size:40px;line-height:1'>"+(typeof mantaraGearIcon==="function"?mantaraGearIcon(cat,v?v.key:"none"):g.ico)+"</div>"
      +"<div style='font-size:16px;font-weight:700;color:var(--gold-bright);margin-top:6px'>"+(v?v.name:"—")+(plus>0?" <span style='color:var(--gold)'>+"+plus+"</span>":"")+"</div>"
      +(af?"<div style='font-size:11px;color:var(--arcane-glow)'>«"+af.name+"»</div>":"")
      +"<div style='font-size:11.5px;color:var(--parchment);margin-top:6px'>Stat: <b>"+perkStr(eff)+"</b>/tahun</div>"
      +(owned?"<div style='font-size:10px;color:"+condCol+";margin-top:3px'>Kondisi "+Math.round(cond)+"%</div>":"")
      +"</div>";

    if(owned){
      html+=pgSec("⚒️ Balai Tempa");
      // Tempa
      if(plus<MAXPLUS){
        var nextPerk={}; var k; var bp=v.perk||{};
        for(k in bp){ nextPerk[k]=bp[k]+Math.round(bp[k]*0.25*(plus+1)); }
        html+=pgRow({ico:"🔨",title:"Tempa → +"+(plus+1),sub:"Stat "+perkStr(v.perk)+" → "+perkStr(nextPerk)+" · 💰"+enhanceCost(cat),right:C.coin>=enhanceCost(cat)?"":"🔒",on:(C.coin>=enhanceCost(cat))?function(){enhanceGear(cat);}:null,dim:C.coin<enhanceCost(cat)});
      }else{
        html+=pgRow({ico:"🔨",title:"Tempa (MAKS +"+MAXPLUS+")",sub:"Perlengkapan sudah ditempa sempurna.",dim:true});
      }
      // Reforge
      html+=pgRow({ico:"✨",title:af?"Reforge Ulang Keajaiban":"Modifikasi (Reforge)",sub:(af?"Ganti «"+af.name+"» dengan keajaiban acak":"Tambahkan keajaiban acak")+" · 💰"+reforgeCost(cat),right:C.coin>=reforgeCost(cat)?"":"🔒",on:(C.coin>=reforgeCost(cat))?function(){reforgeGear(cat);}:null,dim:C.coin<reforgeCost(cat)});
      // Repair
      if(cond<100){
        var rc=gearRepairCostPub(cat);
        html+=pgRow({ico:"🛠️",title:"Perbaiki Kondisi → 100%",sub:"💰"+rc,right:C.coin>=rc?"":"🔒",on:(C.coin>=rc)?function(){window.mtRepairGearPage(cat);}:null,dim:C.coin<rc});
      }
      // Sell
      html+=pgRow({ico:"💰",title:"Jual Kembali",sub:"dapat ~"+sellPrice(cat)+" koin (kembali ke dasar)",on:function(){ sellGear(cat); }});
    }else{
      html+=pgNote("Belum ada "+g.name.toLowerCase()+" terpasang. Beli salah satu di bawah untuk mulai menempa & memodifikasi.");
    }

    html+=pgSec("🛒 Beli / Ganti "+g.name);
    g.variants.forEach(function(vr){
      if(vr.key==="none") return;
      var isOwned=(C.gear[cat]===vr.key);
      var afford=(vr.price||0)===0||C.coin>=vr.price;
      html+=pgRow({ico:typeof mantaraGearIcon==="function"?mantaraGearIcon(cat,vr.key):g.ico,title:vr.name+(isOwned?" ✓":""),sub:(vr.price?"💰"+vr.price+" · ":"")+perkStr(vr.perk)+" · "+vr.desc,
        right:isOwned?"dipakai":(afford?"":"🔒"),
        dim:isOwned||!afford,
        on:(isOwned||!afford)?null:function(){ buyVariant(cat,vr.key); }});
    });
    return html;
  }
  function gearSlotPage(cat){ return { title:(GEAR_CATALOG[cat]?GEAR_CATALOG[cat].name:"Perlengkapan"), render:function(){ return gearSlotHTML(cat); } }; }

  // ---- hub semua slot ----
  function forgeHubHTML(){
    if(!hasC()) return pgNote("Mulai hidup dulu.");
    ensureGearMeta();
    var html=pgNote("Kelola tiap perlengkapanmu: beli, tempa untuk menaikkan stat, modifikasi (reforge) untuk keajaiban acak, perbaiki, atau jual kembali. Koinmu: "+C.coin);
    var cats=["weapon","mount","tome"];
    cats.forEach(function(cat){
      var g=GEAR_CATALOG[cat]; if(!g) return; if(g.arcane&&!C.isMage) return;
      var v=variantOf(cat); var plus=C.gearPlus[cat]||0; var af=C.gearAffix&&C.gearAffix[cat];
      html+=pgRow({ico:typeof mantaraGearIcon==="function"?mantaraGearIcon(cat,v?v.key:"none"):g.ico,title:g.name,sub:(v?v.name:"—")+(plus>0?" +"+plus:"")+(af?" «"+af.name+"»":""),chev:true,
        right:"⚒️",on:function(){ if(typeof pushPage==="function") pushPage(gearSlotPage(cat)); }});
    });
    return html;
  }
  window.openForgeHub=function(){ if(typeof pushPage==="function") pushPage({title:"Balai Tempa",render:forgeHubHTML}); };
  window.openGearSlot=function(cat){ if(typeof pushPage==="function") pushPage(gearSlotPage(cat)); };

  // ---- store category -> gear cat (untuk shortcut Balai Tempa di toko) ----
  function storeGearCat(s){
    if(!s) return null;
    if(s.id==="swordsmith") return "weapon";
    if(s.id==="wandsmith") return C&&C.isMage?"tome":"weapon";
    if(s.id==="stable") return "mount";
    return null;
  }

  /* ============================================================
     TOKO SEBAGAI HALAMAN (bukan popup)
     ============================================================ */
  function storePageHTML(s){
    if(!hasC()) return pgNote("Mulai hidup dulu.");
    var items=[]; try{ items=s.build()||[]; }catch(e){ items=[]; }
    var isEdu=(s.cat==="Bimbel"||s.cat==="Perguruan");
    var html=pgNote(s.desc+" · <b style='color:var(--gold-bright)'>Koinmu: "+C.coin+"</b>"+(isEdu?"":" · 📦 Stok berganti tiap tahun & beda tiap kota"));
    var gcat=storeGearCat(s);
    if(gcat && GEAR_CATALOG[gcat]){
      html+=pgSec("⚒️ Balai Tempa");
      var v=variantOf(gcat); var plus=(C.gearPlus&&C.gearPlus[gcat])||0;
      html+=pgRow({ico:"⚒️",title:"Kelola & Tingkatkan "+GEAR_CATALOG[gcat].name,sub:"Sekarang: "+(v?v.name:"—")+(plus>0?" +"+plus:"")+" · tempa · modif · perbaiki · jual",chev:true,
        on:function(){ if(typeof pushPage==="function") pushPage(gearSlotPage(gcat)); }});
    }
    html+=pgSec("🛒 Barang & Jasa");
    items.forEach(function(it){
      var locked=C.age<(it.minAge||0);
      var afford=(it.price===0)||(C.coin>=it.price);
      var ico=it.ico||"";var title=String(it.label||"");
      if(!ico){
        var probe=document.createElement("div");probe.innerHTML=title;
        var first=probe.firstElementChild;
        if(first&&first.matches("img,.func-icon,.glyph-icon,.m-ico,.wardrobe-glyph,.gear-variant-glyph,.school-crest")){
          ico=first.outerHTML;first.remove();title=probe.innerHTML.trim();
        }else{
          var parts=title.split(" ");ico=parts.shift()||"";title=parts.join(" ")||String(it.label||"");
        }
      }
      html+=pgRow({ico:ico,title:title,sub:locked?("🔒 tersedia usia "+it.minAge+"+"):(it.sub||""),
        right:locked?"":(afford?"":"🔒"),
        dim:locked||!afford,
        on:(locked||!afford)?null:function(){
          try{ if(typeof snapStats==="function") snapStats(); }catch(e){}
          try{ it.run(); }catch(e2){}
          try{
            if(typeof recordActivity==="function"){
              recordActivity("Kembali ke "+s.name,function(){
                if(typeof openStore==="function")openStore(s.id);
              });
            }
          }catch(e3){}
          setTimeout(refresh,60);
        }});
    });
    return html;
  }

  try{
    if(typeof openStore==="function"){
      openStore=function(storeId){
        var s=(typeof STORES!=="undefined")?STORES.find(function(x){return x.id===storeId;}):null;
        if(!s) return;
        try{ if(typeof snapStats==="function") snapStats(); }catch(e){}
        if(typeof pushPage==="function") pushPage({ title:s.name, render:function(){ return storePageHTML(s); } });
      };
    }
  }catch(e){}

  // arahkan tombol "Ganti" gear di tab Aset ke halaman Balai Tempa (bukan popup)
  try{
    if(typeof chooseGearPopup==="function"){
      chooseGearPopup=function(cat){ if(typeof pushPage==="function") pushPage(gearSlotPage(cat)); };
    }
  }catch(e){}

  /* ============================================================
     HOOK: perk enhance/affix benar-benar berpengaruh tiap tahun
     ============================================================ */
  try{
    if(typeof applyAssetPerksV4==="function"){
      var _prevAP=applyAssetPerksV4;
      applyAssetPerksV4=function(){
        var r=_prevAP.apply(this,arguments);
        try{
          if(hasC() && C.gear){
            for(var cat in C.gear){
              var bonus=gearBonusPerk(cat);
              if(Object.keys(bonus).length && typeof applyStats==="function") applyStats(bonus);
            }
          }
        }catch(e){}
        return r;
      };
    }
  }catch(e){}

  // netWorth mencerminkan investasi tempa
  try{
    if(typeof netWorth==="function"){
      var _prevNW=netWorth;
      netWorth=function(){
        var t=_prevNW.apply(this,arguments);
        try{
          if(hasC()){
            for(var cat in (C.gearPlus||{})){
              var v=variantOf(cat); if(v&&v.price){ t+=Math.round((C.gearPlus[cat]||0)*v.price*0.1); }
            }
          }
        }catch(e){}
        return t;
      };
    }
  }catch(e){}

  // sisipkan pintu Balai Tempa ke tab Aset (di bawah, setelah render biasa)
  try{
    if(typeof renderAset==="function"){
      var _prevRA2=renderAset;
      renderAset=function(){
        var r=_prevRA2.apply(this,arguments);
        try{
          var host=document.getElementById("viewAset");
          if(host && hasC()){
            host.innerHTML+="<div class='tiles' style='margin-top:6px'><div class='tile fullrow' onclick='openForgeHub()'>"
              +"<span class='ti'>⚒️</span><span class='tn'>Balai Tempa Perlengkapan</span>"
              +"<span class='td'>Beli · tempa (enhance) · modifikasi · perbaiki · jual kembali</span></div></div>";
          }
        }catch(e2){}
        return r;
      };
    }
  }catch(e){}

  window.__mantaraForge={gearBonusPerk:gearBonusPerk,effPerk:effPerk,enhanceCost:enhanceCost,sellPrice:sellPrice};
})();
