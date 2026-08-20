/* ==================================================================
   MANTARA — DUNIA HIDUP & RUMAH USAHA
   Encounter lokal, quest bertahap, dan manajemen bisnis mendalam.
   Seluruh state disimpan di C agar kompatibel dengan sistem save lama.
   ================================================================== */
(function(){
  "use strict";
  if(!window.Mantara) return;

  var M=window.Mantara, U=M.u;
  var CITY_META={
    aetheria:{tone:"Mahkota, akademi, dan lorong intrik bergerak bersamaan.",faction:"Mahkota",accent:"#e8b83d"},
    thornvale:{tone:"Hutan mengingat setiap janji, bahkan yang dilupakan manusia.",faction:"Heartwood",accent:"#77a85b"},
    saltmoor:{tone:"Setiap kapal membawa kabar, utang, dan rahasia baru.",faction:"Serikat Pasang",accent:"#57a9bd"},
    frostspire:{tone:"Arus mana berubah di balik dinding es dan menara tua.",faction:"Konklaf",accent:"#8d8ce0"}
  };

  var PATHS={
    person:'<circle cx="12" cy="7" r="3.5"/><path d="M4.5 21c.4-5 3-8 7.5-8s7.1 3 7.5 8M8 13l4 3 4-3"/>',
    creature:'<path d="M5 10 3.5 5 8 7c2-1 6-1 8 0l4.5-2-1.5 5v4c0 4-3 7-7 7s-7-3-7-7z"/><path d="m8 13 2 1m6-1-2 1M9 18h6"/>',
    mystery:'<path d="M12 2.5 15 9l6.5 3-6.5 3-3 6.5L9 15l-6.5-3L9 9z"/><circle cx="12" cy="12" r="2"/>',
    quest:'<path d="M6 3h10l3 3v15H6zM16 3v4h4M9 11h7M9 15h5"/><path d="m3 17 2 2 4-5"/>',
    crown:'<path d="m3 7 4.5 3L12 4l4.5 6L21 7l-2 11H5zM5 18h14"/>',
    leaf:'<path d="M20 4C10 4 5 9 5 16c5 1 12-2 15-12Z"/><path d="M4 21c3-6 7-9 13-13"/>',
    wave:'<path d="M3 8c3-3 5 3 8 0s5 3 8 0M3 14c3-3 5 3 8 0s5 3 8 0M3 20c3-3 5 3 8 0s5 3 8 0"/>',
    crystal:'<path d="m8 3-4 6 8 12 8-12-4-6zM4 9h16M8 3l4 6 4-6M12 9v12"/>',
    shop:'<path d="M4 9h16l-1.5-5h-13zM5 9v11h14V9M9 20v-6h5v6"/><path d="M4 9c0 1.5 1 2.5 2.5 2.5S9 10.5 9 9c0 1.5 1 2.5 2.5 2.5S14 10.5 14 9c0 1.5 1 2.5 2.5 2.5S19 10.5 19 9"/>',
    staff:'<circle cx="8" cy="8" r="3"/><path d="M2 20c.4-4 2.4-6 6-6s5.6 2 6 6M16 4v16M13 7h6"/>',
    box:'<path d="m3 7 9-4 9 4-9 4zM3 7v10l9 4 9-4V7M12 11v10"/>',
    star:'<path d="m12 3 2.7 5.5 6 .9-4.4 4.2 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.2 6-.9z"/>',
    coin:'<circle cx="12" cy="12" r="8.5"/><path d="M15 8.5c-.8-.6-1.7-1-3-1-1.8 0-3 .8-3 2s1 1.8 3 2.2 3 1.1 3 2.4-1.2 2.4-3.2 2.4c-1.2 0-2.4-.4-3.2-1.2M12 5.5v13"/>',
    check:'<path d="m4 12 5 5L20 6"/>',
    arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',
    map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
    pulse:'<path d="M3 12h4l2-5 4 10 2-5h6"/>'
  };
  function icon(n,extra){return '<span class="lw-icon '+(extra||'')+'"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(PATHS[n]||PATHS.mystery)+'</svg></span>';}
  function logoIco(){return typeof imgIcon==="function"?imgIcon("logo","","34px"):"";}
  function esc(s){return U.esc(String(s==null?"":s));}
  function clamp(v,a,b){return U.clamp(Number(v)||0,a,b);}
  function city(){return typeof currentCity==="function"?currentCity():null;}
  function sublocName(id){var c=city(),s=c&&c.sublocs&&c.sublocs.find(function(x){return x.id===id;});return s?s.name:"lokasi terkait";}
  function statName(key){var m=typeof STAT_META!=="undefined"&&STAT_META[key];return m?m.name:key;}

  var QUESTS={
    aetheria:{id:"clockwork",title:"Jam yang Berhenti",giver:"Ilyra, Juru Arsip Mahkota",summary:"Satu jam kerajaan berhenti berdetak, sementara seluruh istana kehilangan satu menit ingatan.",
      stages:[
        {loc:"ae_academy",title:"Jejak di Akademi",text:"Bandingkan serpihan roda gigi dengan rancangan terlarang.",stat:"mind",diff:50},
        {loc:"ae_palace",title:"Menara Jam Terkunci",text:"Masuk melewati penjaga dan segel kerajaan.",stat:"charm",diff:58}
      ],final:"Pusat jam menyimpan satu menit yang dicuri dari ribuan warga.",endings:[
        {label:"Kembalikan menit kepada warga",sub:"Reputasi tinggi; hadiah sedang",reward:90,rep:12,influence:{crown:-4,folk:12},text:"Kota serentak mengingat satu menit yang hilang. Mahkota tidak senang, tetapi rakyat mengingat namamu."},
        {label:"Serahkan mekanisme ke Mahkota",sub:"Hadiah besar; Mahkota menguat",reward:180,rep:4,influence:{crown:14},text:"Mesin itu disegel di bawah istana. Kau dibayar mahal dan kini Mahkota berutang budi."}
      ]},
    thornvale:{id:"heartwood",title:"Sumpah Heartwood",giver:"Maelin, Penjaga Lumut",summary:"Akar purba menutup jalan dan menuntut pemenuhan janji manusia tiga generasi lalu.",
      stages:[
        {loc:"th_herbalist",title:"Ramuan Ingatan",text:"Racik getah yang dapat membuat akar berbicara.",stat:"mind",diff:46},
        {loc:"th_woods",title:"Jantung Hutan",text:"Hadapi roh akar tanpa melukainya.",stat:"mana",alt:"charm",diff:56}
      ],final:"Heartwood meminta tanah permukiman lama dikembalikan kepada hutan.",endings:[
        {label:"Pulihkan wilayah hutan",sub:"Heartwood menguat; pemasukan kecil",reward:70,rep:13,influence:{wild:16},text:"Pagar tua dibongkar. Hutan membuka jalur rahasia dan para penjaga alam menganggapmu saudara."},
        {label:"Tawar perjanjian hidup berdampingan",sub:"Sulit, tetapi seimbang",reward:120,rep:9,influence:{wild:7,folk:7},text:"Akar menjadi jembatan, bukan tembok. Manusia dan hutan menyusun sumpah baru."}
      ]},
    saltmoor:{id:"drowned-ledger",title:"Buku Besar yang Tenggelam",giver:"Orven, Juru Hitung Dermaga",summary:"Buku utang Serikat Pasang muncul kembali, menulis sendiri nama orang yang belum berutang.",
      stages:[
        {loc:"sa_docks",title:"Peti dari Kapal Kosong",text:"Selidiki kapal yang berlabuh tanpa awak.",stat:"might",alt:"mind",diff:49},
        {loc:"sa_black",title:"Tinta dari Laut Dalam",text:"Temukan siapa yang memperdagangkan tinta hidup.",stat:"charm",diff:57}
      ],final:"Daftar itu dapat menghapus utang warga atau menjadikanmu pengendali perdagangan pelabuhan.",endings:[
        {label:"Musnahkan seluruh utang palsu",sub:"Warga mendukungmu",reward:80,rep:15,influence:{tide:-3,folk:14},text:"Nama-nama menguap dari halaman. Para buruh pelabuhan mengangkat gelas untukmu."},
        {label:"Ambil alih buku besar",sub:"Laba tinggi; Serikat menguat",reward:210,rep:2,influence:{tide:16},text:"Arus perdagangan kini mengikuti satu goresan penamu. Menguntungkan, sekaligus berbahaya."}
      ]},
    frostspire:{id:"frozen-star",title:"Bintang Beku",giver:"Sera Vey, Magister Rasi",summary:"Sebuah bintang jatuh membeku di udara dan membuat mantra di menara bertingkah liar.",
      stages:[
        {loc:"fr_library",title:"Peta Langit Terlarang",text:"Terjemahkan konstelasi yang berubah setiap kali dilihat.",stat:"mind",diff:54},
        {loc:"fr_tower",title:"Tangga Tanpa Ujung",text:"Capai puncak menara saat gravitasi patah.",stat:"mana",alt:"might",diff:62}
      ],final:"Inti bintang dapat menstabilkan kota atau menjadi sumber sihir pribadimu.",endings:[
        {label:"Jadikan mercusuar bagi kota",sub:"Konklaf dan warga terbantu",reward:110,rep:14,influence:{arcane:11,folk:5},text:"Cahaya baru berdenyut di atas Frostspire dan menuntun penyihir pulang dari badai mana."},
        {label:"Simpan satu pecahan inti",sub:"Mana besar; risiko reputasi",reward:165,rep:3,stats:{mana:10},influence:{arcane:16},text:"Pecahan itu menyatu dengan auramu. Konklaf curiga, tetapi kekuatanmu bertambah."}
      ]}
  };

  var ENCOUNTERS={
    aetheria:[
      {id:"archive",type:"person",name:"Ilyra, Juru Arsip",where:"Tangga Akademi",desc:"Ia membawa roda gigi emas yang terus memutar mundur.",quest:"clockwork"},
      {id:"griffin",type:"creature",name:"Anak Griffin Tersesat",where:"Atap Pasar",desc:"Sayapnya tersangkut pita upacara kerajaan.",choices:[
        {label:"Tenangkan perlahan",stat:"charm",diff:42,good:"Griffin itu mempercayaimu dan penjaga istana memberi imbalan.",reward:34,rep:4},
        {label:"Panjat dan bebaskan",stat:"might",diff:48,good:"Kau membebaskannya di hadapan kerumunan yang bersorak.",reward:24,rep:7}
      ]},
      {id:"envoy",type:"mystery",name:"Utusan Bertopeng",where:"Gang Marmer",desc:"Ia menawarkan surat tanpa nama dengan cap yang masih hangat.",choices:[
        {label:"Baca pola cap",stat:"mind",diff:56,good:"Kau mengenali pemalsuan dan menjual informasi itu kepada pengawal.",reward:58,rep:3},
        {label:"Ikuti dari kejauhan",stat:"charm",diff:53,good:"Jejaknya membawamu ke pertemuan rahasia para bangsawan.",reward:45,rep:5}
      ]},
      {id:"statue",type:"mystery",name:"Patung yang Berbisik",where:"Taman Istana",desc:"Patung pendiri kota menyebut nama kecilmu.",choices:[
        {label:"Jawab teka-tekinya",stat:"mind",diff:60,good:"Sebuah laci batu terbuka, menyimpan mata uang kuno.",reward:72,statGain:{mind:2}},
        {label:"Tawarkan kenangan",stat:"mana",diff:52,good:"Patung membagikan satu ingatan pendiri kota.",reward:20,statGain:{mana:4,mind:2}}
      ]}
    ],
    thornvale:[
      {id:"warden",type:"person",name:"Maelin, Penjaga Lumut",where:"Pondok Herbalis",desc:"Akar-akar kecil mengeja pesan di sekeliling langkahnya.",quest:"heartwood"},
      {id:"direwolf",type:"creature",name:"Direwolf Terluka",where:"Batas Whisperwood",desc:"Makhluk besar itu menjaga kaki yang tertusuk perangkap besi.",choices:[
        {label:"Rawat luka",stat:"mind",diff:43,good:"Direwolf itu mengingat aromamu dan membiarkanmu mengambil herbal langka.",reward:28,rep:5,statGain:{health:3}},
        {label:"Patahkan perangkap",stat:"might",diff:50,good:"Besi patah dan serigala menghilang tanpa menyerang.",reward:18,rep:7}
      ]},
      {id:"goblin-map",type:"person",name:"Kartografer Goblin",where:"Jalur Kanopi",desc:"Ia menjual peta yang berubah mengikuti arah angin.",choices:[
        {label:"Uji keaslian peta",stat:"mind",diff:51,good:"Peta itu asli; kau menemukan jalan ke simpanan pemburu lama.",reward:61,rep:2},
        {label:"Tukar cerita perjalanan",stat:"charm",diff:45,good:"Ia tertawa dan memberi salinan tanpa meminta koin.",reward:38,rep:5}
      ]},
      {id:"moss-golem",type:"creature",name:"Golem Lumut Mengantuk",where:"Jembatan Akar",desc:"Ia tertidur tepat di atas satu-satunya jembatan.",choices:[
        {label:"Bangunkan dengan mantra",stat:"mana",diff:50,good:"Golem bergeser dan menghadiahimu batu rune.",reward:42,statGain:{mana:2}},
        {label:"Buat jalur baru",stat:"might",diff:55,good:"Jalur buatanmu kemudian dipakai para pedagang.",reward:47,rep:4}
      ]}
    ],
    saltmoor:[
      {id:"ledger",type:"person",name:"Orven, Juru Hitung",where:"Gudang Dermaga",desc:"Tinta hitam menetes ke atas dari buku yang ia bawa.",quest:"drowned-ledger"},
      {id:"oracle",type:"mystery",name:"Peramal Pasang",where:"Tiang Mercusuar",desc:"Ia mengatakan laut akan mengembalikan sesuatu yang tidak pernah kau miliki.",choices:[
        {label:"Minta tafsir",stat:"charm",diff:47,good:"Tafsirnya menuntunmu ke kantong koin di bawah dermaga.",reward:49,statGain:{happy:2}},
        {label:"Baca arus sendiri",stat:"mind",diff:54,good:"Kau menemukan pola perdagangan yang menguntungkan.",reward:67,rep:2}
      ]},
      {id:"mimic",type:"creature",name:"Peti Mimic Kelaparan",where:"Lorong Pasar Ikan",desc:"Peti bergigi itu mengejar aroma ikan asin, bukan manusia.",choices:[
        {label:"Pancing ke gudang kosong",stat:"mind",diff:49,good:"Mimic kenyang lalu memuntahkan barang dagangan lama.",reward:55,rep:3},
        {label:"Tundukkan dengan paksa",stat:"might",diff:58,good:"Mimic menyerah dan pedagang membayarmu.",reward:73,rep:4}
      ]},
      {id:"sailor",type:"person",name:"Pelaut dari Badai Diam",where:"Ujung Dermaga",desc:"Tak seorang pun mengenal bendera kapalnya.",choices:[
        {label:"Dengarkan kisahnya",stat:"charm",diff:40,good:"Ia memberimu koin asing dan satu nama untuk dicari.",reward:44,rep:3},
        {label:"Periksa kapalnya",stat:"mind",diff:57,good:"Kapal itu berasal dari masa lalu; satu artefak dapat diselamatkan.",reward:76,statGain:{mind:2}}
      ]}
    ],
    frostspire:[
      {id:"magister",type:"person",name:"Sera Vey, Magister Rasi",where:"Perpustakaan Beku",desc:"Bayangannya menunjuk ke bintang yang berbeda dari tangannya.",quest:"frozen-star"},
      {id:"wisp",type:"creature",name:"Wisp Es Nakal",where:"Tangga Arcanum",desc:"Ia mencuri kata terakhir dari setiap mantra yang lewat.",choices:[
        {label:"Jebak dalam lingkaran",stat:"mana",diff:53,good:"Wisp mengembalikan kata-kata dan menyisakan debu mana.",reward:46,statGain:{mana:3}},
        {label:"Pelajari polanya",stat:"mind",diff:55,good:"Kau menemukan cara membuat mantra lebih ringkas.",reward:31,statGain:{mind:3,mana:2}}
      ]},
      {id:"golem",type:"creature",name:"Golem Mana Retak",where:"Tempa Es",desc:"Energi bocor dari retakan dadanya seperti kilat biru.",choices:[
        {label:"Stabilkan intinya",stat:"mana",diff:62,good:"Golem pulih dan pandai besi memberi imbalan besar.",reward:92,rep:5},
        {label:"Tempa penyangga",stat:"might",diff:59,good:"Penyangga bertahan; teknikmu dipuji para empu.",reward:78,rep:6}
      ]},
      {id:"drake",type:"creature",name:"Drake Salju Muda",where:"Atap Perpustakaan",desc:"Ia mengumpulkan halaman buku untuk membangun sarang.",choices:[
        {label:"Tukar dengan kain hangat",stat:"charm",diff:48,good:"Drake menerima pertukaran dan halaman langka kembali utuh.",reward:63,rep:5},
        {label:"Ambil saat ia terbang",stat:"mind",diff:56,good:"Perhitunganmu tepat dan satu manuskrip berhasil diselamatkan.",reward:74,rep:3}
      ]}
    ]
  };

  function ensure(){
    if(typeof C==="undefined"||!C) return null;
    var w=C._livingWorld;
    if(!w||typeof w!=="object") w=C._livingWorld={version:1,signature:"",encounters:[],quests:[],history:[],influence:{crown:50,wild:50,tide:50,arcane:50,folk:50},cycle:0};
    w.encounters=Array.isArray(w.encounters)?w.encounters:[];
    w.quests=Array.isArray(w.quests)?w.quests:[];
    w.history=Array.isArray(w.history)?w.history:[];
    w.influence=w.influence||{crown:50,wild:50,tide:50,arcane:50,folk:50};
    ["crown","wild","tide","arcane","folk"].forEach(function(k){if(w.influence[k]==null)w.influence[k]=50;});
    ensureBusinesses();
    var sig=(C.cityId||"aetheria")+"|"+(C.subloc||"city")+"|"+(C.age||0);
    if(w.signature!==sig){w.signature=sig;w.cycle=(w.cycle||0)+1;spawnEncounters(w);}
    return w;
  }

  function questState(def){var w=ensure();return w&&w.quests.find(function(q){return q.id===def.id;});}
  function spawnEncounters(w){
    var cid=C.cityId||"aetheria",pool=(ENCOUNTERS[cid]||[]).slice(),qdef=QUESTS[cid],q=questStateSafe(w,qdef&&qdef.id),out=[];
    if(qdef&&(!q||q.status==="available")){var giver=pool.find(function(e){return e.quest===qdef.id;});if(giver)out.push(giver);}
    pool=pool.filter(function(e){return !out.some(function(o){return o.id===e.id;});});
    while(out.length<3&&pool.length){var i=Math.floor(Math.random()*pool.length);out.push(pool.splice(i,1)[0]);}
    w.encounters=out.map(function(e,i){return{uid:e.id+"-"+w.cycle+"-"+i,defId:e.id,resolved:false};});
  }
  function questStateSafe(w,id){return w&&id?w.quests.find(function(q){return q.id===id;}):null;}
  function encounterDef(defId){var pool=ENCOUNTERS[C.cityId]||[];return pool.find(function(e){return e.id===defId;});}
  function influence(delta){var w=ensure();if(!w||!delta)return;Object.keys(delta).forEach(function(k){w.influence[k]=clamp((w.influence[k]||50)+delta[k],0,100);});}
  function addHistory(text,type){var w=ensure();if(!w)return;w.history.unshift({age:C.age,city:C.cityId,text:text,type:type||"world"});w.history=w.history.slice(0,16);}
  function rewardFrom(ch){
    if(ch.reward)U.coin(ch.reward);
    if(ch.rep)C.reputation=(C.reputation||0)+ch.rep;
    if(ch.statGain)U.stats(ch.statGain);
    if(ch.influence)influence(ch.influence);
  }
  function checkChance(ch){var key=ch.stat,score=(C.stats&&C.stats[key])||0;if(key==="mana"&&!C.isMage)score=Math.round(score*.45);return clamp(42+(score-(ch.diff||50))*.75+(C.reputation||0)*.08,18,88);}
  function refresh(){U.refresh();setTimeout(function(){mountWorld();mountBusiness();},0);}
  function ripple(ok){var el=document.createElement("span");el.className="lw-ripple "+(ok?"good":"bad");document.body.appendChild(el);setTimeout(function(){el.remove();},850);}

  window.lwOpenEncounter=function(uid){
    var w=ensure(),item=w&&w.encounters.find(function(x){return x.uid===uid;});if(!item||item.resolved)return;
    var def=encounterDef(item.defId);if(!def)return;
    if(def.quest){
      var qdef=QUESTS[C.cityId],q=questState(qdef);
      if(q&&q.status==="active"){U.toast("Quest ini sudah berjalan.");return;}
      if(q&&q.status==="complete"){item.resolved=true;refresh();return;}
      M.u.ask({ico:logoIco(),prompt:'<div class="lw-modal-head">'+icon("quest")+'<span><small>QUEST DUNIA</small><b>'+esc(qdef.title)+'</b></span></div><p>'+esc(qdef.summary)+'</p><p class="lw-dialog">“Aku butuh seseorang yang dapat bergerak di luar aturan kota.” — '+esc(qdef.giver)+'</p>',choices:[
        {label:"Terima quest",sub:"Rantai cerita tiga bagian",cls:"love",run:function(){startQuest(qdef);item.resolved=true;ripple(true);refresh();return{t:"Quest dimulai: "+qdef.title,cls:"e-epic"};}},
        {label:"Tanyakan imbalan",sub:"Dapatkan sedikit informasi awal",run:function(){U.stats({mind:1});return{t:qdef.giver+" menjelaskan risiko dan kemungkinan imbalannya.",cls:"e-good"};}}
      ]});return;
    }
    var choices=(def.choices||[]).map(function(ch){var pct=Math.round(checkChance(ch));return{label:ch.label,sub:statName(ch.stat)+" · peluang "+pct+"%",run:function(){
      if(!U.spend(1))return{t:"Aksi tahun ini sudah habis.",cls:"e-bad"};
      var ok=Math.random()*100<pct;item.resolved=true;
      if(ok){rewardFrom(ch);addHistory(ch.good,"encounter");ripple(true);refresh();return{t:ch.good+(ch.reward?" (+"+ch.reward+" keping)":""),cls:"e-good"};}
      var hurt=Math.max(2,Math.round((ch.diff||50)/9));U.stats({health:-hurt,happy:-2});var bad="Upayamu gagal. Situasi mereda, tetapi kau pulang dengan luka dan cerita yang tidak selesai.";addHistory(bad,"encounter");ripple(false);refresh();return{t:bad,cls:"e-bad"};
    }};});
    M.u.ask({ico:logoIco(),prompt:'<div class="lw-modal-head">'+icon(def.type)+'<span><small>'+esc(def.where)+'</small><b>'+esc(def.name)+'</b></span></div><p>'+esc(def.desc)+'</p>',choices:choices});
  };

  function startQuest(def){var w=ensure();var existing=questStateSafe(w,def.id);if(existing){existing.stage=0;existing.status="active";existing.failures=0;}else w.quests.push({id:def.id,city:C.cityId,stage:0,status:"active",failures:0,started:C.age});addHistory("Quest dimulai: "+def.title,"quest");}
  function activeQuest(){var w=ensure();return w&&w.quests.find(function(q){return q.status==="active";});}
  window.lwAdvanceQuest=function(id){
    var w=ensure(),q=w&&w.quests.find(function(x){return x.id===id;}),def=Object.keys(QUESTS).map(function(k){return QUESTS[k];}).find(function(x){return x.id===id;});
    if(!q||!def||q.status!=="active")return;
    if(C.cityId!==q.city){U.toast("Quest ini berada di "+cityOf(q.city).name+".");return;}
    if(q.stage>=def.stages.length){openQuestEnding(q,def);return;}
    var st=def.stages[q.stage];
    if(C.subloc!==st.loc){C.subloc=st.loc;U.toast("Menuju "+sublocName(st.loc)+".");refresh();return;}
    var key=st.stat;if(st.alt&&((C.stats[st.alt]||0)>(C.stats[key]||0)))key=st.alt;
    var pct=clamp(44+((C.stats[key]||0)-st.diff)*.7+(C.reputation||0)*.08,20,87);
    M.u.ask({ico:logoIco(),prompt:'<div class="lw-modal-head">'+icon("quest")+'<span><small>'+esc(sublocName(st.loc))+'</small><b>'+esc(st.title)+'</b></span></div><p>'+esc(st.text)+'</p>',choices:[
      {label:"Lanjutkan penyelidikan",sub:statName(key)+" · peluang "+Math.round(pct)+"%",cls:"love",run:function(){
        if(!U.spend(1))return{t:"Aksi tahun ini sudah habis.",cls:"e-bad"};
        var ok=Math.random()*100<pct;if(ok){q.stage++;U.stats({[key]:2,happy:2});addHistory("Tahap quest selesai: "+st.title,"quest");ripple(true);refresh();return{t:"Petunjuk penting ditemukan. Tahap “"+st.title+"” selesai.",cls:"e-epic"};}
        q.failures=(q.failures||0)+1;U.stats({health:-5,happy:-3});addHistory("Penyelidikan tersendat di "+st.title,"quest");ripple(false);refresh();return{t:"Penyelidikan tersendat, tetapi petunjuknya tetap ada untuk dicoba lagi.",cls:"e-bad"};
      }}
    ]});
  };
  function openQuestEnding(q,def){M.u.ask({ico:logoIco(),prompt:'<div class="lw-modal-head">'+icon("quest")+'<span><small>KEPUTUSAN AKHIR</small><b>'+esc(def.title)+'</b></span></div><p>'+esc(def.final)+'</p>',choices:def.endings.map(function(e){return{label:e.label,sub:e.sub,cls:"love",run:function(){
      q.status="complete";q.ending=e.label;q.completed=C.age;U.coin(e.reward||0);C.reputation=(C.reputation||0)+(e.rep||0);if(e.stats)U.stats(e.stats);influence(e.influence);addHistory(e.text,"quest");ripple(true);refresh();return{t:e.text+" (+"+(e.reward||0)+" keping)",cls:"e-epic"};
    }};})});}

  function questCard(q){var def=Object.keys(QUESTS).map(function(k){return QUESTS[k];}).find(function(x){return x.id===q.id;});if(!def)return"";
    var complete=q.status==="complete",stage=complete?def.stages.length+1:q.stage,steps=def.stages.length+1,dots="";for(var i=0;i<steps;i++)dots+='<i class="'+(i<stage?"done":i===stage?"now":"")+'"></i>';
    var st=!complete&&q.stage<def.stages.length?def.stages[q.stage]:null;
    var action=complete?'<span class="lw-complete">'+icon("check")+' Selesai</span>':'<button onclick="lwAdvanceQuest(\''+q.id+'\')">'+icon(st&&C.subloc!==st.loc?"map":"arrow")+(st&&C.subloc!==st.loc?"Menuju lokasi":"Lanjutkan")+'</button>';
    return '<article class="lw-quest '+(complete?"is-complete":"")+'"><div class="lw-quest-top"><div>'+icon("quest")+'<span><small>QUEST '+(complete?"SELESAI":"AKTIF")+'</small><b>'+esc(def.title)+'</b></span></div><div class="lw-progress">'+dots+'</div></div><p>'+(complete?esc(q.ending||"Kisah selesai."):esc(st?st.text:def.final))+'</p><div class="lw-objective"><span>'+(complete?"Warisan kisah tercatat":st?esc(sublocName(st.loc))+" · "+esc(st.title):"Saatnya menentukan akhir")+'</span>'+action+'</div></article>';
  }
  function encounterCard(item){var def=encounterDef(item.defId);if(!def)return"";return '<button class="lw-encounter '+(item.resolved?"resolved":"")+'" '+(item.resolved?'disabled':'onclick="lwOpenEncounter(\''+item.uid+'\')"')+'><span class="lw-enc-visual">'+icon(def.type)+'</span><span class="lw-enc-copy"><small>'+esc(def.where)+'</small><b>'+esc(def.name)+'</b><em>'+esc(item.resolved?"Interaksi selesai":def.desc)+'</em></span><span class="lw-enc-tag">'+(def.quest?"QUEST":def.type==="creature"?"CREATURE":"ENCOUNTER")+'</span></button>';}
  function influenceIcon(cid){return cid==="aetheria"?"crown":cid==="thornvale"?"leaf":cid==="saltmoor"?"wave":"crystal";}
  function worldHTML(){var w=ensure(),c=city(),meta=CITY_META[C.cityId]||CITY_META.aetheria,q=activeQuest();if(!w||!c)return"";
    var local=q&&q.city===C.cityId?q:null,infKey=C.cityId==="aetheria"?"crown":C.cityId==="thornvale"?"wild":C.cityId==="saltmoor"?"tide":"arcane",inf=Math.round(w.influence[infKey]||50);
    return '<section class="lw-world" style="--lw-accent:'+meta.accent+'"><header><div>'+icon(influenceIcon(C.cityId))+'<span><small>DUNIA YANG HIDUP</small><h3>'+esc(c.name)+' bergerak tanpamu</h3></span></div><span class="lw-live"><i></i> '+w.encounters.filter(function(e){return!e.resolved;}).length+' kejadian dekatmu</span></header><p class="lw-tone">'+esc(meta.tone)+'</p><div class="lw-world-grid"><div class="lw-encounters">'+w.encounters.map(encounterCard).join("")+'</div><aside><div class="lw-faction"><span>'+icon(influenceIcon(C.cityId))+' Pengaruh '+esc(meta.faction)+'</span><b>'+inf+'%</b><div><i style="width:'+inf+'%"></i></div><small>Keputusan quest dan encounter mengubah siapa yang berpengaruh di kota.</small></div>'+(local?questCard(local):'<div class="lw-rumor">'+icon("mystery")+'<span><small>DESAS-DESUS</small><b>Tokoh tertentu dapat membuka kisah panjang.</b><em>Cari penanda quest di antara penduduk kota.</em></span></div>')+'</aside></div></section>';
  }
  function mountWorld(){if(typeof C==="undefined"||!C||!C.alive)return;var host=document.getElementById("viewPeta");if(!host)return;var old=host.querySelector(".lw-world");if(old)old.remove();host.insertAdjacentHTML("beforeend",worldHTML());}

  function ensureBusinesses(){if(typeof C==="undefined"||!C||!Array.isArray(C.businesses))return;C.businesses.forEach(function(b){if(!b.dev)b.dev={staff:1,quality:52,supply:72,renown:12,strategy:"balanced",manager:false,lastReport:null};var d=b.dev;d.staff=clamp(d.staff||1,1,12);d.quality=clamp(d.quality==null?52:d.quality,0,100);d.supply=clamp(d.supply==null?72:d.supply,0,100);d.renown=clamp(d.renown==null?12:d.renown,0,100);d.strategy=d.strategy||"balanced";});}
  var STRATEGIES={balanced:{name:"Seimbang",desc:"Operasi stabil, risiko rendah.",income:1,supply:1,quality:0},artisan:{name:"Artisan",desc:"Kualitas dan nama besar diutamakan.",income:.92,supply:.8,quality:5},volume:{name:"Volume",desc:"Jual lebih banyak, stok cepat habis.",income:1.22,supply:1.35,quality:-3},luxury:{name:"Premium",desc:"Margin besar bila kualitas tinggi.",income:1.34,supply:.9,quality:-1}};
  function bizDef(id){return typeof BUSINESS_TYPES!=="undefined"&&BUSINESS_TYPES.find(function(x){return x.id===id;});}
  function projected(b){var def=bizDef(b.id),d=b.dev,s=STRATEGIES[d.strategy]||STRATEGIES.balanced;if(!def)return 0;var base=def.income[b.level]||0,staffMul=.82+Math.min(10,d.staff)*.07,qualityMul=.72+d.quality*.005,renownMul=.86+d.renown*.0035,supplyMul=.45+d.supply*.006;return Math.max(0,Math.round(base*staffMul*qualityMul*renownMul*s.income*supplyMul));}
  function bar(label,val,kind){return '<div class="lw-bizbar"><span>'+label+' <b>'+Math.round(val)+'</b></span><div><i class="'+kind+'" style="width:'+clamp(val,0,100)+'%"></i></div></div>';}
  function businessHTML(){ensureBusinesses();var list=C.businesses||[];var body=list.length?list.map(function(b){var def=bizDef(b.id),d=b.dev,s=STRATEGIES[d.strategy]||STRATEGIES.balanced;if(!def)return"";var report=d.lastReport;
    return '<article class="lw-business"><div class="lw-biz-head"><div>'+icon("shop")+'<span><small>'+esc(def.name).toUpperCase()+'</small><b>'+esc(def.tiers[b.level])+'</b></span></div><button onclick="lwManageBusiness(\''+b.id+'\')">Kelola</button></div><div class="lw-biz-metrics"><div><small>PROYEKSI KOTOR</small><b>'+icon("coin")+U.money(projected(b))+'</b><em>sebelum upah</em></div><div><small>TIM</small><b>'+icon("staff")+d.staff+(d.manager?" + manajer":" pekerja")+'</b><em>'+esc(s.name)+'</em></div></div><div class="lw-bars">'+bar("Kualitas",d.quality,"quality")+bar("Stok",d.supply,"supply")+bar("Nama usaha",d.renown,"renown")+'</div>'+(report?'<div class="lw-report"><span>Laporan tahun '+report.age+'</span><b class="'+(report.net>=0?"plus":"minus")+'">'+(report.net>=0?"+":"")+report.net+' keping</b><em>'+esc(report.note)+'</em></div>':'<div class="lw-report empty">Laporan pertama tersedia setelah pergantian tahun.</div>')+'</article>';}).join(""):'<div class="lw-empty">'+icon("shop")+'<div><b>Belum ada rumah usaha</b><span>Beli bisnis melalui Pasar Aset kota, lalu kelola staf, stok, kualitas, dan strateginya di sini.</span></div></div>';
    return '<section class="lw-enterprise"><header><div>'+icon("shop")+'<span><small>RUMAH USAHA</small><h3>Bangun bisnis, bukan sekadar menunggu income</h3></span></div><p>Operasi berubah setiap tahun mengikuti tim, stok, kualitas, strategi, dan kejadian pasar.</p></header><div class="lw-business-list">'+body+'</div></section>';}
  function mountBusiness(){if(typeof C==="undefined"||!C||!C.alive)return;var host=document.getElementById("viewAset");if(!host)return;var old=host.querySelector(".lw-enterprise");if(old)old.remove();host.insertAdjacentHTML("beforeend",businessHTML());}

  function bizAction(id,cost,apply,text){var b=C.businesses.find(function(x){return x.id===id;});if(!b)return{t:"Usaha tidak ditemukan.",cls:"e-bad"};if(C.coin<cost)return{t:"Koin tidak cukup untuk keputusan ini.",cls:"e-bad"};if(!U.spend(1))return{t:"Aksi tahun ini sudah habis.",cls:"e-bad"};C.coin-=cost;apply(b.dev);addHistory(text,"business");ripple(true);refresh();return{t:text,cls:"e-good"};}
  window.lwManageBusiness=function(id){ensureBusinesses();var b=C.businesses.find(function(x){return x.id===id;}),def=bizDef(id);if(!b||!def)return;var d=b.dev,recruit=35+d.staff*12,train=44+d.staff*8,stock=32+b.level*18,campaign=50+b.level*22;
    M.u.ask({ico:logoIco(),prompt:'<div class="lw-modal-head">'+icon("shop")+'<span><small>MANAJEMEN USAHA</small><b>'+esc(def.tiers[b.level])+'</b></span></div><div class="lw-modal-stats">'+bar("Kualitas",d.quality,"quality")+bar("Stok",d.supply,"supply")+bar("Nama usaha",d.renown,"renown")+'</div>',choices:[
      {label:"Rekrut pekerja",sub:recruit+" keping · kapasitas tim bertambah",disabled:d.staff>=12,run:function(){return bizAction(id,recruit,function(x){x.staff++;x.quality=clamp(x.quality+2,0,100);},"Seorang pekerja baru bergabung dengan "+def.tiers[b.level]+".");}},
      {label:"Latih tim",sub:train+" keping · kualitas +10",run:function(){return bizAction(id,train,function(x){x.quality=clamp(x.quality+10,0,100);},"Tim "+def.tiers[b.level]+" menyelesaikan pelatihan intensif.");}},
      {label:"Amankan pasokan",sub:stock+" keping · stok +28",run:function(){return bizAction(id,stock,function(x){x.supply=clamp(x.supply+28,0,100);},"Gudang "+def.tiers[b.level]+" kembali terisi.");}},
      {label:"Bangun nama usaha",sub:campaign+" keping · nama +14",run:function(){return bizAction(id,campaign,function(x){x.renown=clamp(x.renown+14,0,100);},"Kampanye baru membuat "+def.tiers[b.level]+" ramai dibicarakan.");}},
      {label:"Ubah strategi",sub:"Saat ini: "+STRATEGIES[d.strategy].name,run:function(){setTimeout(function(){openStrategy(id);},80);return{t:"Pilih arah operasi berikutnya.",cls:""};}},
      {label:d.manager?"Manajer sudah bertugas":"Rekrut manajer",sub:d.manager?"Otomatis menjaga stok dan kualitas":"120 keping · usaha minimal tingkat 2",disabled:d.manager||b.level<1||C.coin<120,run:function(){return bizAction(id,120,function(x){x.manager=true;},"Seorang manajer kini menangani operasi harian "+def.tiers[b.level]+".");}}
    ]});
  };
  function openStrategy(id){var b=C.businesses.find(function(x){return x.id===id;});if(!b)return;M.u.ask({ico:logoIco(),prompt:'<div class="lw-modal-head">'+icon("pulse")+'<span><small>STRATEGI OPERASI</small><b>Pilih arah usaha</b></span></div>',choices:Object.keys(STRATEGIES).map(function(k){var s=STRATEGIES[k];return{label:s.name,sub:s.desc,cls:b.dev.strategy===k?"love":"",run:function(){b.dev.strategy=k;refresh();return{t:"Strategi usaha diubah menjadi "+s.name+".",cls:"e-good"};}};})});}

  function processEnterpriseYear(){ensureBusinesses();if(!C.businesses||!C.businesses.length)return;var total=0;
    C.businesses.forEach(function(b){var def=bizDef(b.id);if(!def)return;var d=b.dev,s=STRATEGIES[d.strategy]||STRATEGIES.balanced,base=def.income[b.level]||0,gross=projected(b),wages=d.staff*(7+b.level*3)+(d.manager?22:0),event="Operasi berjalan stabil.";
      var roll=Math.random();if(roll<.11){var loss=Math.round(gross*.22);gross-=loss;d.quality=clamp(d.quality-6,0,100);event="Keluhan pelanggan menekan pemasukan.";}else if(roll>.9&&d.renown>35){var bonus=Math.round(gross*.2);gross+=bonus;d.renown=clamp(d.renown+3,0,100);event="Nama usaha menarik gelombang pelanggan baru.";}
      var net=gross-wages,delta=net-base;C.coin=Math.max(0,(C.coin||0)+delta);total+=delta;d.supply=clamp(d.supply-Math.round((13+d.staff*2)*s.supply)+(d.manager?14:0),0,100);d.quality=clamp(d.quality+s.quality+(d.manager?3:-1),0,100);d.renown=clamp(d.renown+(gross>base?3:-2),0,100);d.lastReport={age:C.age,gross:gross,wages:wages,net:net,note:event};
    });
    if(total!==0)U.log("Manajemen usaha menghasilkan penyesuaian "+(total>0?"+":"")+total+" keping setelah upah dan operasi.",total>=0?"e-good":"e-bad");
  }

  function lifeBlock(){var w=ensure(),q=activeQuest();if(!w)return"";var open=w.encounters.filter(function(e){return!e.resolved;}).length;return '<button class="lw-life-strip" onclick="switchTab(\'Peta\')">'+icon("map")+'<span><small>DUNIA BERGERAK</small><b>'+(q?esc(QUESTS[q.city].title)+" · quest aktif":open+" pertemuan menantimu di "+esc(city().name))+'</b></span>'+icon("arrow")+'</button>';}

  function addStyles(){if(document.getElementById("lw-styles"))return;var st=document.createElement("style");st.id="lw-styles";st.textContent=`
    .lw-icon{display:inline-grid;place-items:center;width:24px;height:24px;flex:none;color:var(--gold,#e7b52c)}.lw-icon svg{width:100%;height:100%;overflow:visible}
    .logo-mark img{filter:drop-shadow(0 0 9px rgba(232,184,61,.28));animation:lwSigil 5s ease-in-out infinite}.lw-world,.lw-enterprise{margin:28px 0 10px;padding:20px;border:1px solid color-mix(in srgb,var(--lw-accent,var(--gold)) 48%,transparent);border-radius:22px;background:linear-gradient(145deg,rgba(45,32,24,.94),rgba(20,16,24,.97));box-shadow:0 18px 46px rgba(0,0,0,.24);animation:lwRise .45s ease both}.lw-world>header,.lw-enterprise>header{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:9px}.lw-world>header>div,.lw-enterprise>header>div{display:flex;align-items:center;gap:12px}.lw-world h3,.lw-enterprise h3{margin:2px 0 0;color:var(--paper,#f4ead5);font-size:18px}.lw-world header small,.lw-enterprise header small{display:block;color:var(--lw-accent,var(--gold));font-size:9px;letter-spacing:2px}.lw-live{font:700 10px/1 sans-serif;color:#d9c8ad;padding:8px 10px;border:1px solid rgba(255,255,255,.1);border-radius:999px;white-space:nowrap}.lw-live i{display:inline-block;width:7px;height:7px;border-radius:50%;background:#79c98a;box-shadow:0 0 0 4px rgba(121,201,138,.12);margin-right:4px;animation:lwLive 1.7s infinite}.lw-tone{color:#a98b68;font-style:italic;margin:0 0 18px;font-size:13px}.lw-world-grid{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,.75fr);gap:16px}.lw-encounters{display:grid;gap:10px}.lw-encounter{position:relative;width:100%;min-height:94px;display:flex;align-items:center;gap:14px;padding:14px;text-align:left;color:inherit;border:1px solid rgba(232,184,61,.18);border-radius:16px;background:rgba(255,255,255,.025);cursor:pointer;overflow:hidden;transition:transform .2s,border-color .2s,background .2s}.lw-encounter:hover{transform:translateY(-2px);border-color:var(--lw-accent);background:rgba(255,255,255,.05)}.lw-enc-visual{display:grid;place-items:center;width:62px;height:62px;border-radius:18px;background:radial-gradient(circle at 35% 30%,color-mix(in srgb,var(--lw-accent) 26%,transparent),rgba(0,0,0,.28));border:1px solid color-mix(in srgb,var(--lw-accent) 48%,transparent);color:var(--lw-accent);animation:lwFloat 3.8s ease-in-out infinite}.lw-enc-visual .lw-icon{width:34px;height:34px;color:inherit}.lw-enc-copy{display:flex;min-width:0;flex:1;flex-direction:column;gap:3px}.lw-enc-copy small{font-size:9px;letter-spacing:1.3px;color:var(--lw-accent);text-transform:uppercase}.lw-enc-copy b{font-size:15px;color:#f1e6cf}.lw-enc-copy em{font-size:11px;line-height:1.4;color:#a98d6c;font-style:normal}.lw-enc-tag{position:absolute;right:8px;top:8px;font:700 7px sans-serif;letter-spacing:1px;color:var(--lw-accent);opacity:.75}.lw-encounter.resolved{opacity:.45;filter:saturate(.4);cursor:default}.lw-world aside{display:grid;align-content:start;gap:12px}.lw-faction,.lw-rumor,.lw-quest{padding:15px;border:1px solid rgba(255,255,255,.09);border-radius:16px;background:rgba(0,0,0,.16)}.lw-faction>span{display:flex;align-items:center;gap:8px;color:#dbc9aa;font-size:11px}.lw-faction>b{display:block;margin:8px 0 5px;font-size:26px;color:var(--lw-accent)}.lw-faction>div,.lw-bizbar>div{height:5px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}.lw-faction>div i,.lw-bizbar>div i{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--lw-accent,var(--gold)),#ffe079);transition:width .7s ease}.lw-faction>small{display:block;margin-top:8px;color:#8f765c;line-height:1.4}.lw-rumor{display:flex;gap:10px}.lw-rumor span{display:flex;flex-direction:column;gap:3px}.lw-rumor small,.lw-quest small{font:700 8px sans-serif;letter-spacing:1.5px;color:var(--lw-accent)}.lw-rumor b{font-size:12px;color:#e9dcc4}.lw-rumor em{font-size:10px;color:#8f765c;font-style:normal}.lw-quest{border-color:color-mix(in srgb,var(--lw-accent) 42%,transparent)}.lw-quest-top,.lw-quest-top>div,.lw-objective{display:flex;align-items:center;justify-content:space-between;gap:9px}.lw-quest-top>div>span{display:flex;flex-direction:column}.lw-quest-top b{color:#f3e7cd;font-size:13px}.lw-progress{display:flex!important;gap:4px!important}.lw-progress i{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.12)}.lw-progress i.done{background:var(--lw-accent)}.lw-progress i.now{border:1px solid var(--lw-accent);animation:lwLive 1.5s infinite}.lw-quest p{font-size:11px;line-height:1.45;color:#a98d6c}.lw-objective{border-top:1px solid rgba(255,255,255,.07);padding-top:10px}.lw-objective>span{font-size:9px;color:#b99d78;max-width:55%}.lw-objective button,.lw-business button{display:flex;align-items:center;gap:5px;border:1px solid var(--lw-accent,var(--gold));border-radius:10px;padding:7px 9px;background:rgba(232,184,61,.08);color:var(--lw-accent,var(--gold));font:700 9px inherit;cursor:pointer}.lw-objective button .lw-icon,.lw-business button .lw-icon{width:14px;height:14px}.lw-complete{display:flex;align-items:center;gap:4px;color:#79c98a;font-size:9px}.lw-complete .lw-icon{width:14px;height:14px;color:#79c98a}
    .lw-enterprise{--lw-accent:#d39a37}.lw-enterprise>header>p{max-width:400px;margin:0;color:#9c8265;font-size:11px;line-height:1.45}.lw-business-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(285px,1fr));gap:12px}.lw-business{padding:16px;border:1px solid rgba(211,154,55,.24);border-radius:17px;background:rgba(255,255,255,.025);transition:transform .2s,border-color .2s}.lw-business:hover{transform:translateY(-2px);border-color:rgba(211,154,55,.55)}.lw-biz-head,.lw-biz-head>div{display:flex;align-items:center;justify-content:space-between;gap:9px}.lw-biz-head>div>span{display:flex;flex-direction:column}.lw-biz-head small{font-size:8px;letter-spacing:1.4px;color:#bd8e42}.lw-biz-head b{color:#efe1c8}.lw-biz-metrics{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:14px 0}.lw-biz-metrics>div{display:flex;flex-direction:column;padding:9px;border-radius:11px;background:rgba(0,0,0,.16)}.lw-biz-metrics small{font:700 7px sans-serif;letter-spacing:1px;color:#8f775e}.lw-biz-metrics b{display:flex;align-items:center;gap:4px;color:#e6bd54;font-size:13px;margin-top:3px}.lw-biz-metrics b .lw-icon{width:15px;height:15px}.lw-biz-metrics em{font-size:8px;color:#7f6a54;font-style:normal}.lw-bars{display:grid;gap:7px}.lw-bizbar>span{display:flex;justify-content:space-between;margin-bottom:3px;color:#9f8567;font-size:9px}.lw-bizbar i.quality{background:linear-gradient(90deg,#9f7eea,#d2b6ff)}.lw-bizbar i.supply{background:linear-gradient(90deg,#4c9d8c,#79d0ad)}.lw-bizbar i.renown{background:linear-gradient(90deg,#b77724,#f1bf49)}.lw-report{display:grid;grid-template-columns:1fr auto;gap:3px 8px;margin-top:13px;padding-top:10px;border-top:1px solid rgba(255,255,255,.06);font-size:9px;color:#8e765c}.lw-report em{grid-column:1/-1;font-style:normal}.lw-report b.plus{color:#74be85}.lw-report b.minus{color:#d26f6f}.lw-report.empty{display:block}.lw-empty{display:flex;align-items:center;gap:14px;padding:22px;border:1px dashed rgba(211,154,55,.28);border-radius:16px;color:#9c8265}.lw-empty>.lw-icon{width:38px;height:38px}.lw-empty div{display:flex;flex-direction:column}.lw-empty b{color:#dfc9a7}.lw-empty span{font-size:11px;margin-top:3px}.lw-life-strip{width:100%;display:flex;align-items:center;gap:11px;margin:12px 0;padding:12px 14px;border:1px solid rgba(232,184,61,.25);border-radius:14px;background:linear-gradient(90deg,rgba(232,184,61,.08),rgba(82,66,119,.06));color:#d9c39d;text-align:left;cursor:pointer}.lw-life-strip>span{display:flex;flex:1;flex-direction:column}.lw-life-strip small{font:700 8px sans-serif;letter-spacing:1.5px;color:#bd8d32}.lw-life-strip b{font-size:11px;color:#e9dcc4}.lw-life-strip>.lw-icon:last-child{width:17px;height:17px}.lw-modal-head{display:flex;align-items:center;gap:12px;margin-bottom:12px}.lw-modal-head>.lw-icon{width:36px;height:36px}.lw-modal-head span{display:flex;flex-direction:column;text-align:left}.lw-modal-head small{font:700 9px sans-serif;letter-spacing:1.5px;color:var(--gold)}.lw-modal-head b{font-size:17px}.lw-dialog{padding:10px;border-left:2px solid var(--gold);background:rgba(232,184,61,.06);font-style:italic}.lw-modal-stats{display:grid;gap:8px;margin-top:15px}.lw-ripple{position:fixed;z-index:9999;left:50%;top:50%;width:20px;height:20px;border:2px solid #e9ba43;border-radius:50%;pointer-events:none;transform:translate(-50%,-50%);animation:lwRipple .8s ease-out forwards}.lw-ripple.bad{border-color:#c95f68}
    @keyframes lwRise{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}@keyframes lwFloat{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-4px) rotate(1deg)}}@keyframes lwLive{0%,100%{opacity:.45;transform:scale(.8)}50%{opacity:1;transform:scale(1.1)}}@keyframes lwSigil{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}@keyframes lwRipple{to{width:70vmax;height:70vmax;opacity:0}}
    @media(max-width:720px){.lw-world-grid{grid-template-columns:1fr}.lw-world>header,.lw-enterprise>header{flex-direction:column}.lw-enterprise>header>p{max-width:none}.lw-business-list{grid-template-columns:1fr}}@media(prefers-reduced-motion:reduce){.lw-world,.lw-enterprise,.lw-live i,.lw-progress i.now,.logo-mark img,.lw-enc-visual,.lw-ripple{animation:none!important}.lw-bizbar i{transition:none}}
  `;document.head.appendChild(st);}

  M.on("boot",function(){addStyles();ensure();setTimeout(function(){mountWorld();mountBusiness();},80);});
  M.on("char:born",function(){if(C)delete C._livingWorld;ensure();});
  M.on("save:read",function(){ensure();});
  M.on("year:end",function(){processEnterpriseYear();ensure();});
  M.on("tab:render",function(ctx){if(ctx.tab==="Peta")mountWorld();if(ctx.tab==="Aset")mountBusiness();});
  M.on("hidup:render",function(ctx){if(C&&C.alive)ctx.blocks.push(lifeBlock());});

  window.MantaraLivingWorld={ensure:ensure,mountWorld:mountWorld,mountBusiness:mountBusiness,questDefs:QUESTS,encounterDefs:ENCOUNTERS};
})();
