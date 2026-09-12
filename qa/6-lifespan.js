/* Mengukur langsung rentang umur dari deathChance() yang dipakai game.
   Ini uji regresi untuk BAL-01: kalau ada lemparan kematian datar
   dipasang lagi, sebaran ini akan mengempis dan uji ini gagal.       */
const {boot,newLife}=require('./lib');
(async()=>{
  const t=await boot({settle:2000,port:8405}); const {page}=t;
  await newLife(page,'peasant');
  const r=await page.evaluate(()=>{
    const V=window.__mantaraVitality;
    if(!V) return {err:'__mantaraVitality tidak ada'};
    const out={owner:window.__mantaraOldAgeOwner||null, profiles:{}};
    const P={
      melarat :{h:35,coin:30,     happy:25,props:0,biz:0,career:'knight'},
      miskin  :{h:45,coin:300,    happy:45,props:0,biz:0,career:null},
      biasa   :{h:52,coin:1500,   happy:60,props:0,biz:0,career:null},
      mapan   :{h:62,coin:8000,   happy:75,props:1,biz:1,career:null},
      kaya    :{h:72,coin:40000,  happy:85,props:3,biz:3,career:null},
      maksimal:{h:85,coin:200000, happy:95,props:5,biz:5,career:null}
    };
    for(const [nm,p] of Object.entries(P)){
      C._healthAvg=p.h; C.stats.health=p.h; C.coin=p.coin; C.stats.happy=p.happy;
      C.properties=Array(p.props).fill({}); C.businesses=Array(p.biz).fill({}); C.career=p.career;
      const vit=V.vitality(); const ages=[];
      for(let n=0;n<4000;n++){
        for(let a=1;a<=140;a++){ C.age=a; if(Math.random()<V.deathChance()){ages.push(a);break;} if(a===140)ages.push(140); }
      }
      ages.sort((a,b)=>a-b); const q=x=>ages[Math.floor(x*(ages.length-1))];
      out.profiles[nm]={vit:+vit.toFixed(1),p5:q(.05),median:q(.5),p95:q(.95)};
    }
    return out;
  });
  if(r.err){ console.log('✗',r.err); await t.close(); process.exit(1); }
  console.log('pemilik kematian usia tua:', r.owner);
  console.log('\nprofil        vitalitas    p5   MEDIAN    p95');
  for(const [n,v] of Object.entries(r.profiles))
    console.log(n.padEnd(13)+String(v.vit).padStart(9)+String(v.p5).padStart(6)+String(v.median).padStart(9)+String(v.p95).padStart(7));
  const med=Object.values(r.profiles).map(v=>v.median);
  const spread=Math.max(...med)-Math.min(...med);
  console.log('\nsebaran median melarat→maksimal:', spread, 'tahun');
  console.log(spread>=22 ? '✓ gaya hidup benar-benar menentukan umur' : '✗ REGRESI — sebaran mengempis (cek BAL-01 di QA Mantara v25.md)');
  await t.close(); process.exit(spread>=22?0:1);
})();
