/* ==================================================================
   MANTARA — ARENA = LOKASI (Colosseum Aurelia) + PASAR ASET KOTA
   Duel & lomba pindah ke Colosseum di Aetheria (FAB arena dihapus).
   Beli rumah/tunggangan/aset besar HARUS ke Pasar Aset di sub-lokasi
   kota — harga mengikuti kota. FAB ✦ berkah harian tetap.
   ================================================================== */
window.openAssetMarketPage=function(){
  pushPage({title:"Pasar Aset",render:function(){
    const city=currentCity();
    const mul=city.costMul||1;
    let h=pgNote(`🏘️ Pasar Aset <b>${city.name}</b> — harga mengikuti kota (×${mul}). Properti yang dibeli bisa <b>disewakan</b> lewat Diri → Aset.`);
    h+=pgSec("Properti (bisa punya banyak & disewakan)");
    PROPERTY_CATALOG.filter(p=>!p.arcane||C.isMage).forEach(p=>{
      const price=Math.round(p.price*mul);
      const afford=C.coin>=price;
      const rent=p.rentMode==="auto"?`sewa +${p.rentAuto}/th`:p.rentMode==="active"?`sewa nego ${p.rentActive[0]}-${p.rentActive[1]}/th`:"tak disewakan";
      const ownedN=C.properties.filter(x=>x.key===p.key).length;
      h+=pgRow({ico:p.ico,title:p.name+(ownedN?` ×${ownedN}`:""),sub:`${p.desc} · ${rent}`,right:`💰${price}`,dim:!afford,
        on:pgDo(()=>{
          if(C.coin<price)return{t:"Koinmu belum cukup.",cls:"e-bad"};
          C.coin-=price;C.properties.push({key:p.key,rented:false});
          try{checkMissions();}catch(e){}
          return{t:`Kau membeli ${p.name} di ${city.name}! Sewakan lewat Diri → Aset.`,cls:"e-epic"};})});
    });
    h+=pgSec("Tunggangan & Kendaraan");
    const hasStable=typeof storesInCity==="function"&&!!storesInCity().find(s=>s.id==="stable");
    h+=pgRow({ico:"🐎",title:"Kandang Tunggangan",sub:hasStable?"kuda, kuda perang, griffon...":"🔒 tak ada kandang di kota ini — coba kota lain",dim:!hasStable,chev:1,
      on:()=>openStore("stable")});
    h+=pgSec("Bisnis (income pasif — dikelola di Diri → Aset)");
    BUSINESS_TYPES.forEach(def=>{
      const owned=C.businesses.find(b=>b.id===def.id);
      const price=Math.round(def.buy*mul);
      const afford=C.coin>=price;
      h+=pgRow({ico:def.ico,title:def.name+(owned?" ✓ milikmu":""),sub:`Income +${def.income[0]}/th · ${def.risk}`,
        right:owned?"":`💰${price}`,dim:!!owned||!afford,
        on:pgDo(()=>{
          if(owned)return{t:"Sudah kau miliki — kelola di Diri → Aset.",cls:""};
          if(C.coin<price)return{t:"Koinmu belum cukup.",cls:"e-bad"};
          C.coin-=price;C.businesses.push({id:def.id,level:0});
          try{checkMissions();}catch(e){}
          return{t:`${def.ico} Kau membuka ${def.name} di ${city.name}! Income +${def.income[0]}/th. Kelola & upgrade di Diri → Aset.`,cls:"e-epic"};})});
    });
    h+=pgSec("Lainnya");
    h+=pgRow({ico:"🛒",title:"Distrik Toko "+city.name,sub:"barang, busana, perhiasan 💍, bimbel & perguruan",chev:1,on:()=>{mpCloseAll();switchTab("Toko");}});
    return h;
  }});
};
// tombol "Beli Properti Baru" di Aset -> kini lewat Pasar Aset kota (harga per kota)
buyPropertyPopup=function(){openAssetMarketPage();};
(function worldArenaMarket(){
  // ===== Colosseum Aurelia (Aetheria) — rumah baru untuk Arena Laga =====
  const ae=CITIES.find(c=>c.id==="aetheria");
  if(ae&&!ae.sublocs.find(s=>s.id==="ae_colosseum")){
    ae.sublocs.push({id:"ae_colosseum",ico:"🏟️",name:"Colosseum Aurelia",desc:"Jantung duel & lomba seantero negeri."});
    SUBLOC_ACTS.ae_colosseum=[
      {ico:"⚔️",label:"Masuk Arena Duel",hint:"duel taktis, gauntlet & rival",run:()=>{openArena();arenaGo("Duel");}},
      {ico:"🏟️",label:"Papan Lomba",hint:"panah, bard, balap sapu 🧹, buru naga",run:()=>{openArena();arenaGo("Lomba");}},
      {ico:"🏅",label:"Balai Peringkat",hint:"gelar, runtun & sabuk juaramu",run:()=>{openArena();arenaGo("Peringkat");}},
    ];
    SUBLOC_ACT_MIN_AGE.ae_colosseum=[10,10,0];
  }
  // ===== Pasar Aset di sub-lokasi pasar tiap kota =====
  [["ae_market",13],["th_market",13],["sa_docks",13],["fr_forge",13]].forEach(pair=>{
    const sid=pair[0];
    if(SUBLOC_ACTS[sid]&&!SUBLOC_ACTS[sid].some(a=>a._assetMarket)){
      SUBLOC_ACTS[sid].push({_assetMarket:true,ico:"🏘️",label:"Pasar Properti & Aset",hint:"rumah, tunggangan & aset besar",run:()=>openAssetMarketPage()});
      if(!SUBLOC_ACT_MIN_AGE[sid])SUBLOC_ACT_MIN_AGE[sid]=[];
      while(SUBLOC_ACT_MIN_AGE[sid].length<SUBLOC_ACTS[sid].length-1)SUBLOC_ACT_MIN_AGE[sid].push(0);
      SUBLOC_ACT_MIN_AGE[sid].push(pair[1]);
    }
  });
})();

/* ==================================================================
   MANTARA — KERAJAAN, POLITIK, GUILD & BERITA DUNIA
   Raja yang memerintah (bisa mati/suksesi), gubernur per kota,
   jalur politik pemain: Kanselir → Gubernur → KUDETA → Raja.
   Guild dengan pangkat & perks tahunan. Berita dunia tiap tahun.
   ================================================================== */
const DYNASTIES=["Wangsa Aurelius","Wangsa Valemont","Wangsa Drakenhart","Wangsa Sylvaran","Wangsa Morvane"];
const WORLD_NEWS_POOL=[
  "🐉 Seekor naga terlihat melintasi langit Frostspire — para tetua menyebutnya pertanda.",
  "🌾 Panen raya di Thornvale! Harga gandum turun di seluruh negeri.",
  "⚔️ Bentrokan di perbatasan utara — kerajaan mengirim pasukan tambahan.",
  "🚢 Kapal dagang asing berlabuh di Saltmoor membawa rempah tak dikenal.",
  "🎭 Skandal! Seorang bangsawan tertangkap menyamar jadi bard keliling.",
  "🔮 Menara Arcanum mengumumkan penerimaan murid berbakat baru.",
  "🏰 Renovasi besar Istana Aurelia — pajak sedikit dinaikkan.",
  "🐺 Kawanan serigala bayangan mengganggu jalur kafilah Whisperwood.",
  "🎪 Festival Purnama akan digelar di ibukota! Rakyat bersuka cita.",
  "💰 Guild Saudagar mengumumkan rute dagang baru ke pulau selatan.",
  "🌊 Badai besar menghantam pesisir Saltmoor, dermaga diperbaiki.",
  "⚗️ Alkemis istana mengklaim hampir menemukan ramuan awet muda.",
  "🗡️ Turnamen pedang kerajaan mencetak jawara baru yang misterius.",
  "🪄 Inkuisisi memperketat pengawasan penyihir liar di kota-kota.",
  "📚 Perpustakaan Frostspire menemukan gulungan era Peperangan Kuno.",
  "🐎 Kuda perang wangsa kerajaan melahirkan anak kembar — pertanda baik!",
];
function ensureKingdom(){
  if(C.kingdom)return C.kingdom;
  const dyn=rand(DYNASTIES);
  C.kingdom={
    king:{name:randName(chance(0.25)),age:ri(32,58),years:ri(2,18),dynasty:dyn,isPlayer:false},
    chancellor:randName(chance(0.4)),
    governors:{aetheria:randName(chance(0.3)),thornvale:randName(chance(0.3)),saltmoor:randName(chance(0.3)),frostspire:randName(chance(0.3))},
    news:[{yr:C.age,t:"👑 "+dyn+" memerintah Aetheria dalam damai yang rapuh."}],
  };
  return C.kingdom;
}
function kAddNews(t){
  const K=ensureKingdom();
  K.news.unshift({yr:C.age,t});
  if(K.news.length>40)K.news.pop();
}
function polRole(){return C.polRole&&C.polRole.role;}
function polIsKing(){return polRole()==="raja";}
/* ---------- tick dunia tiap tahun ---------- */
(function kingdomYearly(){
  const _kAY=advanceYear;
  advanceYear=function(){
    const r=_kAY.apply(this,arguments);
    try{
      if(!C||!C.alive)return r;
      const K=ensureKingdom();
      // berita acak
      if(chance(0.6))kAddNews(rand(WORLD_NEWS_POOL));
      // raja menua & suksesi (kecuali kau rajanya)
      if(!K.king.isPlayer){
        K.king.age++;K.king.years++;
        const deathChance=K.king.age>65?0.18:(K.king.age>55?0.07:0.02);
        if(chance(deathChance)){
          const coup=chance(0.12);
          const newDyn=coup?rand(DYNASTIES.filter(d=>d!==K.king.dynasty)):K.king.dynasty;
          kAddNews(coup
            ?`⚔️ GEMPAR! ${K.king.dynasty} digulingkan — ${newDyn} merebut takhta lewat kudeta berdarah!`
            :`⚰️ Raja ${K.king.name} wafat. Pewaris ${K.king.dynasty} naik takhta.`);
          K.king={name:randName(chance(0.25)),age:ri(20,40),years:0,dynasty:newDyn,isPlayer:false};
          if(polRole()&&chance(0.3)){
            kAddNews(`🏛️ Perombakan istana: ${C.name} kehilangan jabatannya.`);
            log(C.age,"Raja baru merombak istana — jabatan politikmu dicopot!","e-bad");
            C.polRole=null;
          }
        }
        if(chance(0.06)){const city=rand(CITIES.filter(c=>!(C.polRole&&C.polRole.role==="gubernur"&&C.polRole.city===c.id)));
          K.governors[city.id]=randName(chance(0.3));
          kAddNews(`🏛️ ${city.name} melantik gubernur baru: ${K.governors[city.id]}.`);}
      }else{
        K.king.age=C.age;K.king.years++;
        if(chance(0.1)){C.reputation=Math.max(0,C.reputation-ri(2,5));
          kAddNews("🔥 Riak pemberontakan kecil dipadamkan pengawal kerajaan.");
          log(C.age,"Sebagian rakyat menggerutu atas kekuasaanmu.","e-bad");}
      }
      // stipend jabatan politik
      const pr=polRole();
      if(pr==="kanselir"){C.coin+=60;C.reputation+=2;log(C.age,"🏛️ Tunjangan Kanselir +60 keping.","e-good");}
      else if(pr==="gubernur"){C.coin+=90;C.reputation+=3;log(C.age,`🏛️ Tunjangan Gubernur ${cityOf(C.polRole.city).name} +90 keping.`,"e-good");}
      else if(pr==="raja"){C.coin+=150;C.reputation+=5;log(C.age,"👑 Upeti kerajaan +150 keping.","e-epic");}
      // guild tahunan
      if(C.guild){
        const g=GUILDS.find(x=>x.id===C.guild.id);
        if(g){
          C.guild.years++;
          if(C.coin>=5)C.coin-=5;else if(chance(0.5)){log(C.age,`${g.ico} Kau dikeluarkan dari ${g.name} karena menunggak iuran.`,"e-bad");C.guild=null;}
          if(C.guild){
            g.perk();
            if(C.guild.rank<g.ranks.length-1&&chance(0.25)){C.guild.rank++;
              log(C.age,`${g.ico} Kau naik pangkat di ${g.name}: ${g.ranks[C.guild.rank]}!`,"e-epic");}
          }
        }
      }
    }catch(e){}
    return r;
  };
})();
/* ---------- GUILD ---------- */
const GUILDS=[
  {id:"merchant",ico:"⚖️",name:"Guild Saudagar",desc:"Jaringan dagang seantero negeri. Perk: koin tiap tahun.",fee:50,req:c=>c.age>=15,
    ranks:["Anggota","Rekanan","Juragan","Tetua Guild"],perk:()=>{const g=ri(8,20)*((C.guild.rank||0)+1);C.coin+=g;}},
  {id:"adventurer",ico:"🗺️",name:"Guild Petualang",desc:"Pemburu peluang & pembasmi bahaya. Perk: Kekuatan & Nyawa.",fee:30,req:c=>c.age>=15&&c.stats.might>=35,
    ranks:["Perunggu","Perak","Emas","Mithril"],perk:()=>applyStats({might:+1+(C.guild.rank||0),health:+1})},
  {id:"arcanum",ico:"🔮",name:"Lingkar Arcanum",desc:"Persaudaraan penyihir terpelajar. Perk: Mana & Akal.",fee:60,req:c=>c.age>=15&&(c.isMage||c.stats.mind>=55),
    ranks:["Inisiat","Adeptus","Magus","Arch-Magus"],perk:()=>applyStats({mana:+1+(C.guild.rank||0),mind:+1})},
  {id:"artisan",ico:"⚒️",name:"Guild Pengrajin",desc:"Penempa, penjahit & pembangun. Perk: Akal & koin.",fee:35,req:c=>c.age>=15,
    ranks:["Magang","Tukang","Ahli","Mahaguru"],perk:()=>{applyStats({mind:+1});C.coin+=ri(4,10)*((C.guild.rank||0)+1);}},
];
window.openGuildPage=function(){
  ensureKingdom();
  pushPage({title:"Guild",render:function(){
    let h;
    if(C.guild){
      const g=GUILDS.find(x=>x.id===C.guild.id);
      h=pgSec("Keanggotaanmu");
      h+=pgRow({ico:g.ico,title:g.name,sub:`${g.ranks[C.guild.rank]} · ${C.guild.years} th · iuran 5/th · naik pangkat tiap tahun (peluang)`,bar:(C.guild.rank+1)/g.ranks.length*100,barCls:"f-mind"});
      h+=pgRow({ico:"💪",title:"Kerja untuk Guild",sub:"tugas guild: koin & reputasi",on:pgDo(()=>{
        if(!spendAction())return null;
        const g2=ri(10,25)*((C.guild.rank||0)+1);C.coin+=g2;C.reputation+=1;
        return{t:`${g.ico} Tugas guild selesai — +${g2} keping.`,cls:"e-good"};})});
      h+=pgRow({ico:"🚪",title:"Keluar dari guild",sub:"pangkat hangus",on:pgDo(()=>{C.guild=null;return{t:"Kau meninggalkan guild.",cls:""};})});
    }else{
      h=pgNote("Gabung guild untuk perks tahunan & pangkat. Iuran 5 keping/tahun — jangan menunggak!");
      h+=pgSec("Pilih Guild");
      GUILDS.forEach(g=>{
        const ok=g.req(C)&&C.coin>=g.fee;
        h+=pgRow({ico:g.ico,title:g.name,sub:g.req(C)?`${g.desc} · pendaftaran 💰${g.fee}`:"🔒 syarat belum terpenuhi",right:`💰${g.fee}`,dim:!ok,
          on:pgDo(()=>{
            if(!g.req(C)||C.coin<g.fee)return{t:"Belum memenuhi syarat guild ini.",cls:"e-bad"};
            C.coin-=g.fee;C.guild={id:g.id,rank:0,years:0};
            kAddNews(`${g.ico} ${C.name} resmi bergabung dengan ${g.name}.`);
            return{t:`${g.ico} Selamat datang di ${g.name}, ${g.ranks[0]}!`,cls:"e-epic"};})});
      });
    }
    return h;
  }});
};
/* ---------- HALAMAN KERAJAAN & POLITIK ---------- */
window.openNewsPage=function(){
  ensureKingdom();
  pushPage({title:"Berita Dunia",render:function(){
    let h=pgSec("Kabar dari Penjuru Negeri");
    C.kingdom.news.forEach(n=>{h+=pgRow({ico:"📜",title:n.t,sub:`saat usiamu ${n.yr} th`});});
    return h;
  }});
};
window.openKingdomPage=function(){
  ensureKingdom();
  pushPage({title:"Kerajaan",render:function(){
    const K=C.kingdom;
    let h=pgSec("Takhta Aetheria");
    if(K.king.isPlayer){
      h+=pgRow({ico:"👑",title:`Raja ${C.name} — KAU!`,sub:`${K.king.dynasty} · bertakhta ${K.king.years} th · upeti +150/th`,bar:100,barCls:"f-happy"});
      h+=pgRow({ico:"📯",title:"Keluarkan Dekrit",sub:"reputasi ++ · 💰100",on:pgDo(()=>{
        if(C.coin<100)return{t:"Kas pribadimu kurang.",cls:"e-bad"};
        if(!spendAction())return null;
        C.coin-=100;C.reputation+=ri(6,12);
        kAddNews(`📯 Raja ${C.name} mengeluarkan dekrit yang disambut rakyat.`);
        return{t:"Dekritmu dielu-elukan di alun-alun!",cls:"e-epic"};})});
      h+=pgRow({ico:"🎪",title:"Gelar Pesta Rakyat",sub:"Bahagia ++ · 💰150",on:pgDo(()=>{
        if(C.coin<150)return{t:"Kas pribadimu kurang.",cls:"e-bad"};
        if(!spendAction())return null;
        C.coin-=150;applyStats({happy:+10,charm:+3});
        kAddNews(`🎪 Pesta rakyat digelar Raja ${C.name} — seluruh negeri bersuka!`);
        return{t:"Rakyat mengelu-elukan namamu!",cls:"e-epic"};})});
    }else{
      h+=pgRow({ico:"👑",title:`Raja ${K.king.name}`,sub:`${K.king.dynasty} · usia ${K.king.age} · bertakhta ${K.king.years} th`,chev:0});
    }
    h+=pgRow({ico:"🏛️",title:"Kanselir: "+(polRole()==="kanselir"?C.name+" (KAU)":K.chancellor),sub:"tangan kanan raja"});
    h+=pgSec("Gubernur Kota");
    CITIES.forEach(c=>{
      const isMe=polRole()==="gubernur"&&C.polRole.city===c.id;
      h+=pgRow({ico:c.ico,title:c.name,sub:"Gubernur: "+(isMe?C.name+" (KAU)":K.governors[c.id])});
    });
    if(!K.king.isPlayer){
      h+=pgSec("Jalur Politik (18+)");
      const canKanselir=C.age>=18&&polRole()!=="kanselir"&&(C.reputation>=30&&C.stats.charm>=50);
      h+=pgRow({ico:"🏛️",title:"Melamar jadi Kanselir",sub:canKanselir?"butuh Reputasi 30+ & Pesona 50+ · peluang dari Pesona":"🔒 usia 18+, Reputasi 30+ & Pesona 50+",dim:!canKanselir,
        on:pgDo(()=>{
          if(!spendAction())return null;
          if(chance(0.35+C.stats.charm/300+C.stats.mind/400)){
            C.polRole={role:"kanselir"};C.kingdom.chancellor=C.name;C.reputation+=10;
            kAddNews(`🏛️ ${C.name} dilantik sebagai Kanselir Kerajaan!`);
            return{t:"👑 Raja menjabat tanganmu — kau Kanselir baru! Tunjangan +60/th.",cls:"e-epic"};}
          C.reputation=Math.max(0,C.reputation-3);
          return{t:"Dewan istana menolak lamaranmu. Bangun reputasi lagi.",cls:"e-bad"};})});
      const canGub=C.age>=18&&polRole()!=="gubernur"&&C.reputation>=50&&C.coin>=300;
      h+=pgRow({ico:"🏙️",title:`Kampanye Gubernur ${currentCity().name}`,sub:canGub?"biaya kampanye 💰300 · peluang dari Reputasi & Pesona":"🔒 Reputasi 50+ & 💰300",dim:!canGub,
        on:pgDo(()=>{
          if(!spendAction())return null;
          C.coin-=300;
          if(chance(0.3+C.reputation/300+C.stats.charm/350)){
            C.polRole={role:"gubernur",city:C.cityId};C.kingdom.governors[C.cityId]=C.name;C.reputation+=15;
            kAddNews(`🏙️ ${C.name} memenangkan kursi Gubernur ${currentCity().name}!`);
            return{t:`🏙️ Kau Gubernur ${currentCity().name}! Tunjangan +90/th.`,cls:"e-epic"};}
          C.coin+=120; // sebagian dana kembali
          return{t:"Kampanyemu kalah suara. Sebagian dana kembali (120).",cls:"e-bad"};})});
      const canCoup=C.age>=21&&(polRole()==="kanselir"||polRole()==="gubernur")&&(C.stats.might+C.stats.mana)>=90&&C.coin>=500;
      h+=pgRow({ico:"🗡️",title:"RENCANAKAN KUDETA",sub:canCoup?"taklukkan Kapten Pengawal (duel!) · 💰500 · nyawa taruhannya":"🔒 jabatan politik + Might+Mana 90+ + 💰500 (usia 21+)",dim:!canCoup,
        on:()=>{startCoup();}});
    }
    return h;
  }});
};
window.startCoup=function(){
  if(!(window.MantaraArena&&MantaraArena.startTacticalDuel)){toast("Pengawal terlalu kuat malam ini.");return;}
  if(C.coin<500){toast("Butuh 500 keping menyuap penjaga gerbang.");return;}
  if(!spendAction())return;
  C.coin-=500;
  mpCloseAll();
  MantaraArena.startTacticalDuel(
    {name:"Kapten Pengawal Kerajaan",ico:"💂",hp:130+ri(0,40),atk:22,mag:10,boss:true,special:"Formasi Tombak"},
    {title:"KUDETA — Malam Pisau Panjang",allowFlee:false,
     intro:"🗡️ Kau menyelinap ke istana bersama pengikutmu... Kapten Pengawal menghadang di depan takhta!",
     onEnd:function(res){
       const K=ensureKingdom();
       if(res&&res.win){
         C.polRole={role:"raja"};
         K.king={name:C.name,age:C.age,years:0,dynasty:"Wangsa "+(C.name.split(" ").pop()||C.name),isPlayer:true};
         K.chancellor=randName(chance(0.4));
         C.reputation+=40;applyStats({happy:+15});
         kAddNews(`👑 KUDETA BERHASIL! ${C.name} naik takhta — lahirlah ${K.king.dynasty}!`);
         finishAct("👑 TAKHTA MILIKMU! Kau kini Raja Aetheria. Perintah dunia dari halaman Kerajaan.","e-epic","win");
       }else if(res&&!res.quit){
         C.polRole=null;C.reputation=Math.max(0,C.reputation-30);
         applyStats({health:-ri(15,30),happy:-10});
         kAddNews(`⚔️ Kudeta ${C.name} GAGAL — sang pengkhianat dicopot dari semua jabatan!`);
         finishAct("Kudetamu gagal! Kau lolos dari tiang gantungan, tapi kehilangan segalanya.","e-death");
       }
     }});
};
/* ---------- PETA: kartu Kerajaan, Guild & Berita ---------- */
(function petaKingdom(){
  const _rpK=renderPeta;
  renderPeta=function(){
    _rpK.apply(this,arguments);
    try{
      ensureKingdom();
      const K=C.kingdom;
      const g=C.guild?GUILDS.find(x=>x.id===C.guild.id):null;
      const latest=K.news[0]?K.news[0].t:"Dunia tenang... untuk saat ini.";
      const html=`<div class="sechead">👑 Kerajaan Aetheria</div>
      <div class="tiles">
        <div class="tile" onclick="openKingdomPage()"><span class="ti">👑</span>
          <span class="tn">${K.king.isPlayer?"Raja "+C.name+" (KAU!)":"Raja "+K.king.name}</span>
          <span class="td">${K.king.dynasty} · takhta ${K.king.years} th — politik, jabatan & kudeta</span></div>
        <div class="tile ${C.guild?'':'arcane'}" onclick="openGuildPage()"><span class="ti">${g?g.ico:"🏛️"}</span>
          <span class="tn">${g?g.name:"Guild"}</span>
          <span class="td">${g?g.ranks[C.guild.rank]+" · "+C.guild.years+" th":"gabung persaudaraan — perks tiap tahun"}</span></div>
        <div class="tile fullrow" onclick="openNewsPage()"><span class="ti">📜</span><span class="tn">Berita Dunia</span>
          <span class="td">${latest}</span></div>
      </div>`;
      document.getElementById("viewPeta").insertAdjacentHTML("afterbegin",html);
    }catch(e){}
  };
})();
