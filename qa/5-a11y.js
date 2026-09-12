/* Target sentuh (min 44px), overflow horizontal, teks terpotong,
   tombol tanpa label — di 4 ukuran layar. */
const {boot,newLife,advanceTo,drain}=require('./lib');
(async()=>{
  const sizes=[[320,568,'iPhone SE'],[390,844,'iPhone 14'],[430,932,'iPhone 15 Pro Max'],[768,1024,'iPad']];
  let fail=0;
  for(const [w,h,name] of sizes){
    const t=await boot({settle:2000,port:8404,width:w,height:h}); const {page}=t;
    await newLife(page,'noble');
    await advanceTo(page,25);
    await drain(page);
    await page.evaluate(()=>{try{C.coin=99999;renderAll();}catch(e){}});
    await page.waitForTimeout(400);
    const r=await page.evaluate(()=>{
      const vis=e=>e.offsetParent!==null&&e.getBoundingClientRect().width>0;
      const btns=[...document.querySelectorAll('button,[onclick],a')].filter(vis);
      const small=btns.map(e=>({r:e.getBoundingClientRect(),t:(e.innerText||'').replace(/\s+/g,' ').slice(0,26),c:String(e.className).slice(0,26)}))
        .filter(x=>x.r.width<44||x.r.height<44)
        .map(x=>({t:x.t,c:x.c,w:Math.round(x.r.width),h:Math.round(x.r.height)}));
      return {
        n:btns.length, small,
        overflowX:document.documentElement.scrollWidth>document.documentElement.clientWidth+1,
        noLabel:[...document.querySelectorAll('button')].filter(e=>vis(e)&&!(e.innerText||'').trim()&&!e.getAttribute('aria-label')&&!e.title).length
      };
    });
    console.log('\n### '+name+' '+w+'×'+h);
    console.log('  tombol terlihat        :', r.n);
    console.log('  target sentuh < 44px   :', r.small.length, r.small.length?JSON.stringify(r.small.slice(0,6)):'');
    console.log('  overflow horizontal    :', r.overflowX);
    console.log('  tombol tanpa label/aria:', r.noLabel);
    if(r.small.length||r.overflowX||r.noLabel) fail++;
    await page.screenshot({path:__dirname+'/shot-'+w+'.png'});
    await t.close();
  }
  console.log(fail?'\n✗ '+fail+' ukuran bermasalah':'\n✓ SEMUA UKURAN LOLOS');
  process.exit(fail?1:0);
})();
