/* Soak test: N nyawa penuh (lahir → mati) dengan klik sungguhan di DOM.
   Math.random di-seed supaya tiap temuan bisa direproduksi.
   Pakai: node qa/2-soak.js [jumlahNyawa] [umurMaks] [paralel]        */
const {boot,fmtErr}=require('./lib');

function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}

async function oneLife(seed,years,port){
  const rnd=mulberry(seed);
  const t=await boot({settle:2000,port});
  const {page,log}=t;
  await page.evaluate(s=>{let a=s|0;Math.random=function(){a|=0;a=a+0x6D2B79F5|0;let x=Math.imul(a^a>>>15,1|a);x=x+Math.imul(x^x>>>7,61|x)^x;return((x^x>>>14)>>>0)/4294967296;};},seed);
  const origins=['peasant','noble','mageborn','orphan','merchant_kid'];
  const org=origins[Math.floor(rnd()*origins.length)];
  await page.evaluate(o=>{try{tutSkip();tutGuideOff();}catch(e){}selOrigin(o);confirmNewGame();},org);
  await page.waitForTimeout(250);
  await page.evaluate(()=>confirmCustomize());
  await page.waitForTimeout(700);

  let lastAge=-1, stuck=0; const events=[];
  for(let step=0; step<6000; step++){
    const s=await page.evaluate(()=>{
      const vis=e=>e&&e.offsetParent!==null;
      const ch=[...document.querySelectorAll('#mchoices .mchoice')].filter(vis);
      return {age:C?C.age:null, alive:C?C.alive:null, n:ch.length};
    });
    if(s.alive===false) break;
    if(s.age===null) break;
    if(s.age>=years) break;
    if(s.age!==lastAge){lastAge=s.age;stuck=0;} else if(++stuck>50){events.push({type:'MACET',age:s.age});break;}

    if(s.n>0){
      const i=Math.floor(rnd()*s.n);
      await page.evaluate(i=>{const v=[...document.querySelectorAll('#mchoices .mchoice')].filter(e=>e.offsetParent!==null);if(v[i])v[i].click();},i);
    } else if(rnd()<0.35){
      await page.evaluate(()=>{
        const bad=/restart|exitToMenu|deleteS|confirmDelete|NewGame|backToOrigins|purchase|restorePurchases/i;
        const v=[...document.querySelectorAll('button')].filter(e=>e.offsetParent!==null&&!bad.test(e.getAttribute('onclick')||'')&&e.id!=='btnAge');
        if(v.length)v[Math.floor(Math.random()*v.length)].click();
      });
    } else {
      await page.evaluate(()=>{const b=document.getElementById('btnAge');if(b&&!b.disabled)b.click();});
    }
    await page.waitForTimeout(60);
    if(step%25===24) await page.evaluate(()=>{try{mpCloseAll();}catch(e){}});
  }
  const fin=await page.evaluate(()=>({age:C?C.age:null,alive:C?C.alive:null,coin:C?C.coin:null,
    busErrors:(window.Mantara&&Mantara.errors.length)||0}));
  await t.close();
  return {seed,origin:org,fin,events,errors:log.pageErrors.map(fmtErr)};
}

(async()=>{
  const N=+(process.argv[2]||10), YEARS=+(process.argv[3]||130), CONC=+(process.argv[4]||5);
  let idx=0; const results=[];
  await Promise.all(Array.from({length:CONC},(_,w)=>(async()=>{
    while(idx<N){ const seed=++idx;
      try{ const r=await oneLife(seed,YEARS,8410+w); results.push(r);
        process.stderr.write(`  seed ${seed} (${r.origin}) wafat ${r.fin.age} · error ${r.errors.length}\n`);
      }catch(e){ results.push({seed,fatal:String(e).slice(0,200)}); }
    }
  })()));
  const uniq={};
  results.forEach(r=>(r.errors||[]).forEach(e=>{const k=e.split(' ⏎ ')[0];(uniq[k]=uniq[k]||{n:0,full:e}).n++;}));
  const ages=results.filter(r=>r.fin).map(r=>r.fin.age).sort((a,b)=>a-b);
  console.log('\n===== SOAK: '+results.length+' nyawa =====');
  if(ages.length) console.log('umur wafat: min '+ages[0]+' · median '+ages[Math.floor(ages.length/2)]+' · maks '+ages[ages.length-1]);
  console.log('error unik :', Object.keys(uniq).length);
  Object.values(uniq).forEach(v=>console.log('  ['+v.n+'x] '+v.full));
  results.filter(r=>r.events&&r.events.length).forEach(r=>console.log('  MACET seed '+r.seed+': '+JSON.stringify(r.events)));
  const ok=!Object.keys(uniq).length && !results.some(r=>r.fatal);
  console.log(ok?'\n✓ TIDAK ADA ERROR':'\n✗ ADA ERROR');
  process.exit(ok?0:1);
})();
