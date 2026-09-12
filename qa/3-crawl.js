/* Menelusuri setiap fungsi pembuka halaman, lalu MENGKLIK semua tombol
   yang terlihat di halaman yang terbuka. Menangkap error di mana pun. */
const {boot,newLife,advanceTo,drain,fmtErr}=require('./lib');
(async()=>{
  const t=await boot({settle:2200,port:8402}); const {page,log}=t;
  await newLife(page,'noble');
  await advanceTo(page,26);
  await drain(page);
  await page.evaluate(()=>{ try{
    C.coin=250000; C.reputation=400;
    for(const k of ['health','happy','might','mind','mana','charm']) if(C.stats[k]!==undefined) C.stats[k]=90;
    renderAll&&renderAll();
  }catch(e){} });
  await page.waitForTimeout(400);

  /* Fungsi yang MEMANG butuh argumen tapi `fn.length` 0 (pakai `arguments`
     atau destrukturisasi) — memanggilnya tanpa argumen wajar melempar. */
  const NEEDS_ARGS = new Set(['showResult','showModal','openChoice']);
  const fns=(await page.evaluate(()=>Object.keys(window)
    .filter(k=>typeof window[k]==='function'&&/^(open|render|show|nav|switchTab|exp|arena|gld|season|view)/.test(k))))
    .filter(k=>!NEEDS_ARGS.has(k));
  const bad=[];
  for(const fn of fns){
    const before=log.pageErrors.length;
    const thrown=await page.evaluate(async f=>{
      try{ const g=window[f]; if(g.length>0) return 'SKIP'; g(); }catch(e){ return e.message; }
      await new Promise(r=>setTimeout(r,110)); return null;
    },fn);
    const clickErr=await page.evaluate(async()=>{
      const stop=/restart|exitToMenu|deleteS|confirmDelete|NewGame|backToOrigins|purchase|restorePurchases|reload/i;
      const btns=[...document.querySelectorAll('button')].filter(e=>e.offsetParent!==null&&!stop.test(e.getAttribute('onclick')||''));
      const errs=[];
      for(const b of btns.slice(0,25)){ try{ b.click(); await new Promise(r=>setTimeout(r,25)); }catch(e){ errs.push(e.message); } }
      return errs;
    });
    const fresh=log.pageErrors.slice(before).map(fmtErr);
    if((thrown&&thrown!=='SKIP')||fresh.length||clickErr.length) bad.push({fn,thrown,fresh,clickErr});
    await drain(page);
    await page.evaluate(()=>{try{navGroup('Hidup');}catch(e){}});
  }
  console.log('ditelusuri', fns.length, 'titik masuk ·', bad.length, 'bermasalah\n');
  bad.forEach(b=>{
    console.log('### '+b.fn+(b.thrown?'  melempar: '+b.thrown:''));
    b.fresh.slice(0,3).forEach(e=>console.log('    '+e));
    b.clickErr.slice(0,3).forEach(e=>console.log('    klik: '+e));
  });
  console.log('\nMantara.errors:', await page.evaluate(()=>(window.Mantara&&Mantara.errors.length)||0));
  await t.close();
  process.exit(bad.length?1:0);
})();
