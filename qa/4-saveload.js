/* Save → muat ulang halaman → load. Membandingkan SETIAP field C. */
const {boot,newLife,advanceTo,fmtErr}=require('./lib');
(async()=>{
  const t=await boot({settle:2000,port:8403}); const {page,log}=t;
  await newLife(page,'merchant_kid');
  await advanceTo(page,55);
  const pre=await page.evaluate(()=>{ saveGame(true); return JSON.parse(JSON.stringify(C)); });
  console.log('disimpan pada usia', pre.age, '·', Object.keys(pre).length, 'field');
  await page.reload({waitUntil:'load'}); await page.waitForTimeout(1800);
  await page.evaluate(()=>{ try{loadGame();}catch(e){} }); await page.waitForTimeout(1000);
  const post=await page.evaluate(()=>typeof C!=='undefined'&&C?JSON.parse(JSON.stringify(C)):null);
  if(!post){ console.log('✗ C kosong setelah load'); await t.close(); process.exit(1); }
  const keys=new Set([...Object.keys(pre),...Object.keys(post)]);
  const diff=[...keys].filter(k=>JSON.stringify(pre[k])!==JSON.stringify(post[k]));
  console.log('\nfield berbeda:', diff.length, 'dari', keys.size);
  diff.forEach(k=>{
    console.log(' •',k);
    console.log('   sebelum:',String(JSON.stringify(pre[k])).slice(0,120));
    console.log('   sesudah:',String(JSON.stringify(post[k])).slice(0,120));
  });
  console.log('\npageerror:',log.pageErrors.map(fmtErr));
  await t.close(); process.exit(diff.length>1?1:0);
})();
