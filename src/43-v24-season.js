/* ============================================================================
   MANTARA v24 — LAPIS D: MUSIM WANGSA (Season Pass kosmetik)
   ----------------------------------------------------------------------------
   Temuan review: monetisasi jujur (0% pay-to-win) tapi tidak berulang — sekali
   beli tema, selesai. Musim Wangsa memberi pendapatan berulang TANPA melanggar
   prinsip itu: setiap hadiah adalah kosmetik atau QoL. Tidak ada satu pun
   hadiah yang menambah stat, koin, atau peluang menang.

   ATURAN YANG DIPEGANG:
     · Jalur gratis punya 12 hadiah. Pemain gratis tetap dapat isi tiap musim.
     · Jalur premium hanya menambah kosmetik: tema, bingkai, gelar, sampul kronik.
     · Tidak ada energy timer, tidak ada gacha, tidak ada iklan.
     · Musim berakhir -> kosmetik yang sudah dibuka TETAP milik pemain selamanya.
   ============================================================================ */
(function(){
  "use strict";
  var SKEY="mantara_season_v1";
  var SEASON_DAYS=56;                 // 8 minggu
  var PREMIUM_ID="mantara.season.wangsa";

  function today(){ var d=new Date(); return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0"); }
  function dayNum(){ return Math.floor(Date.now()/86400000); }
  function hasC(){ return typeof C!=="undefined" && C && C.alive; }
  function _toast(t){ try{ if(typeof toast==="function") toast(t); }catch(e){} }
  function esc(s){ try{ return (typeof window.esc==="function")?window.esc(s):String(s); }catch(e){ return String(s); } }

  /* -------------------------------------------------------------------------
     KATALOG MUSIM — semua kosmetik. Tidak ada yang menyentuh gameplay.
     ------------------------------------------------------------------------- */
  var SEASONS=[
    { id:"s1", name:"Musim Wangsa: Abu & Fajar", ico:"\u{1F326}️",
      blurb:"Musim pertama. Untuk mereka yang membangun nama dari abu.",
      theme:{gold:"#e8b45a",goldBright:"#ffe6a8",accent:"#6b4a86",ink:"#170f21"} }
  ];
  function curSeason(){ return SEASONS[0]; }

  // tier: 1..30 ; free = hadiah jalur gratis ; prem = jalur premium
  // type: title (gelar) | frame (bingkai potret) | theme | cover (sampul kronik) | slot | emote
  var TIERS=[
    {t:1,  free:{type:"title",id:"tl_anak_abu",  name:"Anak Abu",            ico:"\u{1F526}"}, prem:{type:"frame",id:"fr_emas_tipis", name:"Bingkai Emas Tipis", ico:"\u{1F5BC}️"}},
    {t:2,  free:null,                                                                          prem:{type:"cover",id:"cv_fajar",     name:"Sampul Kronik: Fajar", ico:"\u{1F304}"}},
    {t:3,  free:{type:"title",id:"tl_pejalan",   name:"Pejalan Jauh",        ico:"\u{1F97E}"}, prem:{type:"title",id:"tl_pewaris_abu",name:"Pewaris Abu",        ico:"\u{1FAB6}"}},
    {t:4,  free:null,                                                                          prem:{type:"frame",id:"fr_duri",      name:"Bingkai Duri",       ico:"\u{1F33F}"}},
    {t:5,  free:{type:"frame",id:"fr_kayu",      name:"Bingkai Kayu Tua",    ico:"\u{1FAB5}"}, prem:{type:"emote", id:"em_mahkota",   name:"Emote Mahkota",      ico:"\u{1F451}"}},
    {t:6,  free:null,                                                                          prem:{type:"cover",id:"cv_badai",     name:"Sampul Kronik: Badai", ico:"\u{1F329}️"}},
    {t:7,  free:{type:"title",id:"tl_tangan_kasar",name:"Tangan Kasar",      ico:"\u{1F91A}"}, prem:{type:"title",id:"tl_lidah_perak",name:"Lidah Perak",       ico:"\u{1F5E3}️"}},
    {t:8,  free:null,                                                                          prem:{type:"frame",id:"fr_arcane",    name:"Bingkai Arcane",     ico:"\u{1F52E}"}},
    {t:9,  free:{type:"cover",id:"cv_sederhana", name:"Sampul Kronik: Kertas",ico:"\u{1F4C4}"},prem:{type:"emote", id:"em_pedang",    name:"Emote Pedang Patah", ico:"⚔️"}},
    {t:10, free:null,                                                                          prem:{type:"theme", id:"th_abu_fajar", name:"TEMA: Abu & Fajar",  ico:"\u{1F326}️"}},
    {t:11, free:{type:"title",id:"tl_penjaga",   name:"Penjaga Ambang",      ico:"\u{1F6AA}"}, prem:{type:"frame",id:"fr_perak",     name:"Bingkai Perak",      ico:"\u{1F948}"}},
    {t:12, free:null,                                                                          prem:{type:"cover",id:"cv_darah",     name:"Sampul Kronik: Darah",ico:"\u{1FA78}"}},
    {t:13, free:{type:"frame",id:"fr_tali",      name:"Bingkai Tali",        ico:"\u{1FAA2}"}, prem:{type:"title",id:"tl_pemecah",   name:"Pemecah Nubuat",     ico:"\u{1F5A4}"}},
    {t:14, free:null,                                                                          prem:{type:"emote", id:"em_ramalan",   name:"Emote Mata Peramal", ico:"\u{1F441}️"}},
    {t:15, free:{type:"title",id:"tl_pulang",    name:"Yang Selalu Pulang",  ico:"\u{1F3E1}"}, prem:{type:"frame",id:"fr_rune",      name:"Bingkai Rune",       ico:"\u{1F531}"}},
    {t:16, free:null,                                                                          prem:{type:"cover",id:"cv_salju",     name:"Sampul Kronik: Salju",ico:"❄️"}},
    {t:17, free:{type:"cover",id:"cv_ladang",    name:"Sampul Kronik: Ladang",ico:"\u{1F33E}"},prem:{type:"title",id:"tl_tak_tunduk",name:"Yang Tak Tunduk",   ico:"\u{1F9CD}"}},
    {t:18, free:null,                                                                          prem:{type:"frame",id:"fr_naga",      name:"Bingkai Sisik Naga", ico:"\u{1F409}"}},
    {t:19, free:{type:"title",id:"tl_tiga_kota", name:"Penjejak Tiga Kota",  ico:"\u{1F5FA}️"},prem:{type:"emote", id:"em_kronik",    name:"Emote Kitab Terbuka",ico:"\u{1F4D6}"}},
    {t:20, free:null,                                                                          prem:{type:"slot",  id:"sl_extra",     name:"+1 Slot Simpan",     ico:"\u{1F4BE}"}},
    {t:21, free:{type:"frame",id:"fr_batu",      name:"Bingkai Batu",        ico:"\u{1FAA8}"}, prem:{type:"cover",id:"cv_takhta",    name:"Sampul Kronik: Takhta",ico:"\u{1FA91}"}},
    {t:22, free:null,                                                                          prem:{type:"title",id:"tl_nama_batu", name:"Nama di Batu",       ico:"\u{1F5FF}"}},
    {t:23, free:{type:"title",id:"tl_penyintas", name:"Penyintas",           ico:"\u{1F331}"}, prem:{type:"frame",id:"fr_ungu",      name:"Bingkai Ungu Kerajaan",ico:"\u{1F7EA}"}},
    {t:24, free:null,                                                                          prem:{type:"emote", id:"em_wangsa",    name:"Emote Lambang Wangsa",ico:"\u{1F6E1}️"}},
    {t:25, free:{type:"cover",id:"cv_wangsa",    name:"Sampul Kronik: Wangsa",ico:"\u{1F3F0}"},prem:{type:"title",id:"tl_hikayat",   name:"Hikayat Berjalan",   ico:"\u{1F4DC}"}},
    {t:26, free:null,                                                                          prem:{type:"frame",id:"fr_api",       name:"Bingkai Api Abadi",  ico:"\u{1F525}"}},
    {t:27, free:{type:"title",id:"tl_yang_ingat",name:"Yang Selalu Diingat", ico:"\u{1F56F}️"},prem:{type:"cover",id:"cv_gerhana",   name:"Sampul Kronik: Gerhana",ico:"\u{1F311}"}},
    {t:28, free:null,                                                                          prem:{type:"frame",id:"fr_kristal",   name:"Bingkai Kristal",    ico:"\u{1F48E}"}},
    {t:29, free:{type:"frame",id:"fr_emas_tua",  name:"Bingkai Emas Tua",    ico:"\u{1F947}"}, prem:{type:"title",id:"tl_pendiri",   name:"Pendiri Wangsa",     ico:"\u{1F3F3}️"}},
    {t:30, free:{type:"title",id:"tl_tuntas",    name:"Yang Menuntaskan",    ico:"✅"},        prem:{type:"theme", id:"th_gerhana",   name:"TEMA: Gerhana Wangsa",ico:"\u{1F311}"}}
  ];
  var XP_PER_TIER=100;

  /* -------------------------------------------------------------------------
     MISI MUSIM — sumber XP. Semuanya berbasis MAIN, bukan membayar.
     ------------------------------------------------------------------------- */
  var SEASON_QUESTS=[
    {id:"sq_years",   ico:"\u{1F4C5}", name:"Jalani 25 tahun",            need:25, xp:60,  type:"year"},
    {id:"sq_proph",   ico:"\u{1F56F}️",name:"Tuntaskan 1 nubuat",         need:1,  xp:120, type:"proph"},
    {id:"sq_grad",    ico:"\u{1F393}", name:"Lulus 1 jenjang sekolah",    need:1,  xp:80,  type:"grad"},
    {id:"sq_travel",  ico:"\u{1F5FA}️",name:"Kunjungi 2 kota berbeda",    need:2,  xp:70,  type:"city"},
    {id:"sq_rel",     ico:"\u{2764}️", name:"Capai 3 relasi bond 70+",    need:3,  xp:90,  type:"bond"},
    {id:"sq_coin",    ico:"\u{1FA99}", name:"Kumpulkan 3.000 keping",     need:3000,xp:80, type:"coin"},
    {id:"sq_path",    ico:"\u{1F6E4}️",name:"Terima Jalan asal-usulmu",   need:1,  xp:60,  type:"path"},
    {id:"sq_life",    ico:"\u{1FAA6}", name:"Tuntaskan 1 nyawa penuh",    need:1,  xp:150, type:"life"},
    {id:"sq_old",     ico:"\u{1F9D3}", name:"Hidup sampai usia 70",       need:70, xp:130, type:"age"},
    {id:"sq_dilema",  ico:"⚖️",       name:"Hadapi 3 dilema berat",      need:3,  xp:100, type:"dilema"}
  ];

  /* ------------------------------------------------------------------------- */
  function load(){
    var d;
    try{ d=JSON.parse(localStorage.getItem(SKEY)||"null"); }catch(e){ d=null; }
    if(!d||d.season!==curSeason().id||!d.startDay){
      d={season:curSeason().id,startDay:dayNum(),xp:0,claimedFree:[],claimedPrem:[],
         owned:[],prog:{},questDone:[],premium:false};
    }
    if(!d.owned)d.owned=[];
    if(!d.prog)d.prog={};
    if(!d.questDone)d.questDone=[];
    return d;
  }
  function save(d){ try{ localStorage.setItem(SKEY,JSON.stringify(d)); }catch(e){} }
  var SS=load();
  window.__season=function(){ return SS; };

  function daysLeft(){ return Math.max(0, SEASON_DAYS-(dayNum()-SS.startDay)); }
  function tierNow(){ return Math.max(0, Math.min(30, Math.floor(SS.xp/XP_PER_TIER))); }
  function isPremium(){
    if(SS.premium) return true;
    try{ if(typeof owns==="function" && owns(PREMIUM_ID)) { SS.premium=true; save(SS); return true; } }catch(e){}
    return false;
  }
  window.__seasonIsPremium=isPremium;
  function ownsCos(id){ return SS.owned.indexOf(id)>=0; }
  window.__seasonOwns=ownsCos;

  function addXP(n,why){
    if(n<=0) return;
    var before=tierNow();
    SS.xp+=n; save(SS);
    var after=tierNow();
    if(after>before) _toast("\u{1F326}️ Musim Wangsa — Tingkat "+after+" terbuka!");
    else _toast("+"+n+" XP Musim"+(why?" ("+why+")":""));
    try{ updateSeasonBadge(); }catch(e){}
  }
  window.seasonAddXP=addXP;

  /* --- pelacakan progres misi --- */
  function bump(type,val,absolute){
    var q=null;
    for(var i=0;i<SEASON_QUESTS.length;i++) if(SEASON_QUESTS[i].type===type){ q=SEASON_QUESTS[i];
      if(SS.questDone.indexOf(q.id)>=0) continue;
      var cur=SS.prog[q.id]||0;
      var nv=absolute?Math.max(cur,val):(cur+val);
      SS.prog[q.id]=nv;
      if(nv>=q.need){
        SS.questDone.push(q.id);
        addXP(q.xp, q.name);
      }
    }
    save(SS);
  }
  window.__seasonBump=bump;

  function scanProgress(){
    if(!hasC()) return;
    try{
      bump("year",1,false);
      bump("age",C.age,true);
      bump("coin",C.coin||0,true);
      bump("city",(C._visited||[]).length,true);
      var b=(C.relations||[]).filter(function(r){return (r.bond||0)>=70;}).length;
      bump("bond",b,true);
      if(C.school&&C.school.graduated) bump("grad",C.school.graduated.length,true);
      if(C.prophecy) bump("proph",C.prophecy.resolved||0,true);
      if(C._pathTaken) bump("path",1,true);
      if(C._agingDone){
        var dl=0; for(var k in C._agingDone) if(k.indexOf("dl_")===0) dl++;
        bump("dilema",dl,true);
      }
    }catch(e){}
  }

  /* --- klaim hadiah --- */
  function grant(r){
    if(!r) return;
    if(SS.owned.indexOf(r.id)<0) SS.owned.push(r.id);
    if(r.type==="theme"){
      // tema musim disimpan; dipasang lewat tombol "Pakai"
    }
    save(SS);
  }
  window.seasonClaim=function(tier,track){
    var row=null; for(var i=0;i<TIERS.length;i++) if(TIERS[i].t===tier) row=TIERS[i];
    if(!row) return;
    if(tierNow()<tier){ _toast("Tingkat "+tier+" belum terbuka."); return; }
    if(track==="prem"&&!isPremium()){ _toast("Butuh Jalur Wangsa (premium)."); return; }
    var list=track==="prem"?SS.claimedPrem:SS.claimedFree;
    if(list.indexOf(tier)>=0){ _toast("Sudah diklaim."); return; }
    var r=track==="prem"?row.prem:row.free;
    if(!r){ _toast("Tidak ada hadiah di jalur ini."); return; }
    list.push(tier); grant(r); save(SS);
    _toast(r.ico+" "+r.name+" diperoleh!");
    try{ if(typeof playAnim==="function") playAnim("coin",{text:"MUSIM"}); }catch(e){}
    renderSeason();
  };
  window.seasonClaimAll=function(){
    var n=0, max=tierNow();
    for(var t=1;t<=max;t++){
      var row=null; for(var i=0;i<TIERS.length;i++) if(TIERS[i].t===t) row=TIERS[i];
      if(!row) continue;
      if(row.free && SS.claimedFree.indexOf(t)<0){ SS.claimedFree.push(t); grant(row.free); n++; }
      if(row.prem && isPremium() && SS.claimedPrem.indexOf(t)<0){ SS.claimedPrem.push(t); grant(row.prem); n++; }
    }
    save(SS);
    _toast(n?("\u{1F381} "+n+" hadiah diklaim."):"Belum ada yang bisa diklaim.");
    renderSeason();
  };

  /* --- gelar & bingkai yang dipakai --- */
  window.seasonEquip=function(kind,id){
    SS["eq_"+kind]=(SS["eq_"+kind]===id)?null:id;
    save(SS);
    _toast(SS["eq_"+kind]?"Dipakai.":"Dilepas.");
    try{ if(typeof renderAll==="function") renderAll(); }catch(e){}
    renderSeason();
  };
  window.__seasonEquipped=function(kind){ return SS["eq_"+kind]||null; };
  function cosById(id){
    for(var i=0;i<TIERS.length;i++){
      if(TIERS[i].free&&TIERS[i].free.id===id) return TIERS[i].free;
      if(TIERS[i].prem&&TIERS[i].prem.id===id) return TIERS[i].prem;
    }
    return null;
  }
  window.__seasonCos=cosById;

  /* --- pembelian jalur premium --- */
  window.seasonBuyPremium=function(){
    try{
      if(typeof purchaseProduct==="function"){ purchaseProduct(PREMIUM_ID); return; }
    }catch(e){}
    _toast("Pembelian belum tersedia di build ini.");
  };
  // daftarkan produk ke katalog IAP yang sudah ada
  try{
    if(typeof IAP_PRODUCTS!=="undefined" && !IAP_PRODUCTS.find(function(p){return p.id===PREMIUM_ID;})){
      IAP_PRODUCTS.push({
        id:PREMIUM_ID,type:"season",ico:"\u{1F326}️",name:"Jalur Wangsa — Musim 1",
        desc:"Buka 18 hadiah kosmetik tambahan musim ini: 2 tema, 8 bingkai potret, 6 gelar, sampul kronik, +1 slot simpan. Tidak ada satu pun yang menambah stat, koin, atau peluang menang. Kosmetik yang sudah dibuka tetap milikmu selamanya.",
        price:"Rp 39.000"
      });
    }
  }catch(e){}
  // hormati pembelian yang sudah tercatat
  try{
    if(typeof onPurchaseResult==="function"){
      var _opr=onPurchaseResult;
      window.onPurchaseResult=onPurchaseResult=function(pid,ok){
        if(pid===PREMIUM_ID&&ok){ SS.premium=true; save(SS); _toast("\u{1F326}️ Jalur Wangsa aktif!"); try{renderSeason();}catch(e){} }
        return _opr.apply(this,arguments);
      };
    }
  }catch(e){}

  /* -------------------------------------------------------------------------
     UI
     ------------------------------------------------------------------------- */
  function injectSeasonStyle(){
    if(document.getElementById("seasonStyle")) return;
    var st=document.createElement("style"); st.id="seasonStyle";
    st.textContent=
     "#seasonOv{position:fixed;inset:0;z-index:9400;display:none;overflow-y:auto;-webkit-overflow-scrolling:touch;"
    +"background:#0b0611;background-image:radial-gradient(ellipse at 50% 0%,rgba(60,36,92,.55),transparent 60%)}"
    +"#seasonOv.show{display:block}"
    +".sn-wrap{max-width:520px;margin:0 auto;padding:calc(14px + var(--app-safe-top,env(safe-area-inset-top,0px))) 12px 90px}"
    +".sn-head{display:flex;align-items:center;gap:10px;margin:6px 0 10px}"
    +".sn-head h3{margin:0;font-size:17px;color:var(--gold)}"
    +".sn-sub{font-size:11px;color:var(--ink-soft);filter:brightness(1.5)}"
    +".sn-bar{height:9px;border-radius:6px;background:rgba(255,255,255,.08);overflow:hidden;margin:6px 0 3px}"
    +".sn-bar i{display:block;height:100%;background:linear-gradient(90deg,#8a5fc0,#f0c040)}"
    +".sn-buy{display:block;width:100%;margin:10px 0 14px;padding:12px;border-radius:12px;border:1px solid rgba(240,192,64,.5);"
    +"background:linear-gradient(135deg,rgba(120,80,180,.35),rgba(240,192,64,.18));color:var(--gold-bright);font-weight:700;font-size:13.5px}"
    +".sn-note{font-size:10.5px;line-height:1.55;color:var(--ink-soft);filter:brightness(1.45);margin:0 2px 12px}"
    +".sn-q{display:flex;align-items:center;gap:9px;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.035);margin-bottom:6px;font-size:12px}"
    +".sn-q.done{opacity:.5}"
    +".sn-q .qn{flex:1}.sn-q .qx{color:var(--gold);font-size:11px;white-space:nowrap}"
    +".sn-row{display:grid;grid-template-columns:34px 1fr 1fr;gap:7px;align-items:stretch;margin-bottom:7px}"
    +".sn-t{display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;border-radius:9px;"
    +"background:rgba(255,255,255,.05);color:var(--ink-soft)}"
    +".sn-t.on{background:linear-gradient(160deg,#8a5fc0,#5a3a80);color:#fff}"
    +".sn-c{padding:8px;border-radius:10px;border:1px solid rgba(255,255,255,.07);background:rgba(255,255,255,.03);"
    +"font-size:10.5px;line-height:1.35;text-align:center;min-height:52px;display:flex;flex-direction:column;justify-content:center;gap:3px}"
    +".sn-c.prem{border-color:rgba(240,192,64,.3);background:linear-gradient(160deg,rgba(240,192,64,.10),rgba(120,80,180,.10))}"
    +".sn-c.locked{opacity:.32}.sn-c.claimed{opacity:.5;border-style:dashed}"
    +".sn-c b{font-size:16px;display:block}"
    +".sn-c button{margin-top:4px;padding:4px 6px;font-size:10px;border-radius:7px;border:1px solid rgba(240,192,64,.4);"
    +"background:rgba(240,192,64,.14);color:var(--gold-bright)}"
    +".sn-c.empty{border-style:dotted;opacity:.25}"
    +".sn-tabs{display:flex;gap:6px;margin:10px 0}"
    +".sn-tabs button{flex:1;padding:8px;font-size:12px;border-radius:9px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);color:var(--ink-soft)}"
    +".sn-tabs button.on{background:rgba(240,192,64,.16);color:var(--gold-bright);border-color:rgba(240,192,64,.4)}"
    +".sn-close{position:sticky;top:var(--app-safe-top,env(safe-area-inset-top,0px));float:right;padding:7px 12px;border-radius:9px;border:1px solid rgba(255,255,255,.12);"
    +"background:rgba(20,12,30,.9);color:var(--ink-soft);font-size:13px;z-index:2}"
    +".sn-eqrow{display:flex;flex-wrap:wrap;gap:6px;margin:4px 0 12px}"
    +".sn-eq{padding:6px 9px;border-radius:9px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.04);font-size:11px}"
    +".sn-eq.on{border-color:var(--gold);background:rgba(240,192,64,.16);color:var(--gold-bright)}"
    +"#seasonFab{position:fixed;right:12px;bottom:150px;z-index:8000;width:46px;height:46px;border-radius:50%;"
    +"border:1px solid rgba(240,192,64,.45);background:linear-gradient(160deg,rgba(40,24,60,.96),rgba(20,12,30,.96));font-size:19px}"
    +"#seasonFab .sn-dot{position:absolute;top:-2px;right:-2px;width:11px;height:11px;border-radius:50%;background:#e05a5a;border:2px solid #140c1e}";
    document.head.appendChild(st);
  }

  function buildFab(){
    if(document.getElementById("seasonFab")) return;
    var b=document.createElement("button");
    b.id="seasonFab"; b.title="Musim Wangsa";
    b.innerHTML="\u{1F326}️<span class='sn-dot' id='snDot' style='display:none'></span>";
    b.onclick=function(){ openSeason(); };
    document.body.appendChild(b);
    updateSeasonBadge();
  }
  function anyClaimable(){
    var max=tierNow();
    for(var t=1;t<=max;t++){
      var row=null; for(var i=0;i<TIERS.length;i++) if(TIERS[i].t===t) row=TIERS[i];
      if(!row) continue;
      if(row.free && SS.claimedFree.indexOf(t)<0) return true;
      if(row.prem && isPremium() && SS.claimedPrem.indexOf(t)<0) return true;
    }
    return false;
  }
  function updateSeasonBadge(){
    try{
      var d=document.getElementById("snDot");
      if(d) d.style.display=anyClaimable()?"block":"none";
      var f=document.getElementById("seasonFab");
      if(f) f.style.display=(typeof C!=="undefined"&&C)?"block":"none";
    }catch(e){}
  }
  window.updateSeasonBadge=updateSeasonBadge;

  var snTab="hadiah";
  window.seasonTab=function(t){ snTab=t; renderSeason(); };

  function questsHTML(){
    var h="";
    for(var i=0;i<SEASON_QUESTS.length;i++){
      var q=SEASON_QUESTS[i];
      var done=SS.questDone.indexOf(q.id)>=0;
      var cur=Math.min(q.need, SS.prog[q.id]||0);
      h+="<div class='sn-q"+(done?" done":"")+"'><span>"+q.ico+"</span>"
       + "<span class='qn'>"+esc(q.name)+"<br><span style='font-size:10px;opacity:.65'>"+cur+" / "+q.need+"</span></span>"
       + "<span class='qx'>"+(done?"✓ +"+q.xp:"+"+q.xp+" XP")+"</span></div>";
    }
    return h;
  }

  function rewardCell(r,tier,track){
    if(!r) return "<div class='sn-c empty'>—</div>";
    var claimed=(track==="prem"?SS.claimedPrem:SS.claimedFree).indexOf(tier)>=0;
    var unlocked=tierNow()>=tier;
    var gated=(track==="prem"&&!isPremium());
    var cls="sn-c"+(track==="prem"?" prem":"")+(claimed?" claimed":"")+((!unlocked||gated)?" locked":"");
    var btn="";
    if(claimed) btn="<span style='font-size:9.5px;opacity:.8'>✓ dimiliki</span>";
    else if(gated) btn="<span style='font-size:9.5px;opacity:.8'>\u{1F512} premium</span>";
    else if(!unlocked) btn="<span style='font-size:9.5px;opacity:.8'>tingkat "+tier+"</span>";
    else btn="<button onclick=\"seasonClaim("+tier+",'"+track+"')\">Klaim</button>";
    return "<div class='"+cls+"'><b>"+r.ico+"</b>"+esc(r.name)+btn+"</div>";
  }

  function rewardsHTML(){
    var h="<div class='sn-row' style='font-size:10px;color:var(--ink-soft);margin-bottom:9px'>"
      + "<div></div><div style='text-align:center'>GRATIS</div>"
      + "<div style='text-align:center;color:var(--gold)'>JALUR WANGSA</div></div>";
    for(var i=0;i<TIERS.length;i++){
      var row=TIERS[i];
      h+="<div class='sn-row'><div class='sn-t"+(tierNow()>=row.t?" on":"")+"'>"+row.t+"</div>"
       + rewardCell(row.free,row.t,"free") + rewardCell(row.prem,row.t,"prem") + "</div>";
    }
    return h;
  }

  function equipHTML(){
    if(!SS.owned.length) return "<div class='sn-note'>Belum ada kosmetik. Mainkan untuk membuka tingkat.</div>";
    function group(type,label){
      var items=SS.owned.map(cosById).filter(function(c){ return c&&c.type===type; });
      if(!items.length) return "";
      var eq=SS["eq_"+type];
      var h="<div class='sn-sub' style='margin-top:8px'>"+label+"</div><div class='sn-eqrow'>";
      for(var i=0;i<items.length;i++){
        var c=items[i];
        h+="<button class='sn-eq"+(eq===c.id?" on":"")+"' onclick=\"seasonEquip('"+type+"','"+c.id+"')\">"+c.ico+" "+esc(c.name)+"</button>";
      }
      return h+"</div>";
    }
    return group("title","GELAR")+group("frame","BINGKAI POTRET")+group("cover","SAMPUL KRONIK")+group("theme","TEMA")
      + "<div class='sn-note'>Kosmetik yang sudah dibuka tetap milikmu selamanya, bahkan setelah musim berakhir.</div>";
  }

  function renderSeason(){
    var ov=document.getElementById("seasonOv"); if(!ov) return;
    var s=curSeason();
    var tn=tierNow(), inTier=SS.xp%XP_PER_TIER, pct=Math.round(inTier/XP_PER_TIER*100);
    var body =
      "<button class='sn-close' onclick=\"closeSeason()\">✕</button>"
    + "<div class='sn-head'><div style='font-size:28px'>"+s.ico+"</div>"
    + "<div><h3>"+esc(s.name)+"</h3>"
    + "<div class='sn-sub'>"+esc(s.blurb)+"</div></div></div>"
    + "<div class='sn-sub'>Tingkat <b style='color:var(--gold);font-size:14px'>"+tn+"</b> / 30 · "
    + inTier+"/"+XP_PER_TIER+" XP · berakhir dalam <b>"+daysLeft()+" hari</b></div>"
    + "<div class='sn-bar'><i style='width:"+pct+"%'></i></div>";

    if(!isPremium()){
      body += "<button class='sn-buy' onclick='seasonBuyPremium()'>\u{1F326}️ Buka Jalur Wangsa — Rp 39.000</button>"
        + "<div class='sn-note'>Jalur Wangsa hanya menambah <b>kosmetik</b>: tema, bingkai potret, gelar, sampul kronik, dan 1 slot simpan. "
        + "Tidak ada satu pun hadiah yang menambah stat, koin, atau peluang menang — jalur gratis tetap mendapat 12 hadiah tiap musim. "
        + "Tidak ada iklan, tidak ada gacha, tidak ada batas energi.</div>";
    }else{
      body += "<div class='sn-note' style='color:var(--gold)'>✓ Jalur Wangsa aktif musim ini.</div>";
    }

    body += "<div class='sn-tabs'>"
      + "<button class='"+(snTab==="hadiah"?"on":"")+"' onclick=\"seasonTab('hadiah')\">Hadiah</button>"
      + "<button class='"+(snTab==="misi"?"on":"")+"' onclick=\"seasonTab('misi')\">Misi Musim</button>"
      + "<button class='"+(snTab==="pakai"?"on":"")+"' onclick=\"seasonTab('pakai')\">Koleksi</button>"
      + "</div>";

    if(snTab==="hadiah"){
      body += (anyClaimable()?"<button class='sn-buy' style='background:rgba(240,192,64,.18)' onclick='seasonClaimAll()'>\u{1F381} Klaim Semua</button>":"")
            + rewardsHTML();
    }else if(snTab==="misi"){
      body += "<div class='sn-note'>Semua XP musim didapat dengan <b>bermain</b>. Tidak ada XP yang bisa dibeli.</div>" + questsHTML();
    }else{
      body += equipHTML();
    }

    ov.innerHTML="<div class='sn-wrap'>"+body+"</div>";
  }
  window.renderSeason=renderSeason;

  window.openSeason=function(){
    injectSeasonStyle();
    var ov=document.getElementById("seasonOv");
    if(!ov){ ov=document.createElement("div"); ov.id="seasonOv"; document.body.appendChild(ov); }
    scanProgress();
    renderSeason();
    ov.classList.add("show");
  };
  window.closeSeason=function(){
    var ov=document.getElementById("seasonOv"); if(ov) ov.classList.remove("show");
    updateSeasonBadge();
  };

  /* --- gelar musim tampil di kartu karakter --- */
  if(typeof renderHidup==="function"){
    var _rhD=renderHidup;
    window.renderHidup=renderHidup=function(){
      var r=_rhD.apply(this,arguments);
      try{
        var tid=SS.eq_title; if(!tid) return r;
        var c=cosById(tid); if(!c) return r;
        var host=document.getElementById("viewHidup");
        if(host&&host.innerHTML.indexOf("sn-title-chip")<0){
          host.innerHTML=host.innerHTML.replace('<div class="logbox">',
            '<div class="sn-title-chip" style="margin:0 4px 8px;padding:6px 10px;border-radius:9px;'
            +'border:1px solid rgba(240,192,64,.3);background:rgba(240,192,64,.08);font-size:11.5px;color:var(--gold-bright)">'
            + c.ico+' '+esc(c.name)+'</div><div class="logbox">');
        }
      }catch(e){}
      return r;
    };
  }

  /* --- hook progres --- */
  if(typeof advanceYear==="function"){
    var _ayD=advanceYear;
    window.advanceYear=advanceYear=function(){
      var r=_ayD.apply(this,arguments);
      try{ scanProgress(); updateSeasonBadge(); }catch(e){}
      return r;
    };
  }
  if(typeof die==="function"){
    var _dieD=die;
    window.die=die=function(){
      try{ bump("life",1,false); bump("age",C?C.age:0,true); }catch(e){}
      return _dieD.apply(this,arguments);
    };
  }
  if(typeof createFromDraft==="function"){
    var _cfdD=createFromDraft;
    window.createFromDraft=createFromDraft=function(){
      var r=_cfdD.apply(this,arguments);
      try{ setTimeout(function(){ injectSeasonStyle(); buildFab(); },600); }catch(e){}
      return r;
    };
  }
  try{ if(document.readyState!=="loading") setTimeout(function(){injectSeasonStyle();buildFab();},1200);
       else document.addEventListener("DOMContentLoaded",function(){setTimeout(function(){injectSeasonStyle();buildFab();},1200);}); }catch(e){}

  window.__mantaraSeason={SEASONS:SEASONS,TIERS:TIERS,SEASON_QUESTS:SEASON_QUESTS,
    tierNow:tierNow,addXP:addXP,isPremium:isPremium,daysLeft:daysLeft,state:function(){return SS;}};
})();
