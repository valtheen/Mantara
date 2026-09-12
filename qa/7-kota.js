/* Peta kota berjalan: kanvas termuat, bangunan dibangkitkan dari sublocs,
   kendali menggerakkan pemain, pintu memicu tombol masuk, dan masuk
   membuka halaman aksi yang asli.
   Juga menjaga regresi "markup mentah tergambar di kanvas" — sebagian
   ico sub-lokasi berisi SVG, dan fillText akan menggambar sumbernya. */
const {boot,newLife,advanceTo,drain,fmtErr}=require('./lib');
(async()=>{
  const t=await boot({settle:2300,port:8406}); const {page,log}=t;
  await newLife(page,'noble'); await advanceTo(page,22); await drain(page);
  await page.evaluate(()=>switchTab('Peta')); await page.waitForTimeout(500);
  await drain(page); await page.waitForTimeout(700);

  const r=await page.evaluate(()=>{
    const cv=document.getElementById('kjCanvas');
    const K=Mantara.get('kotajalan'), S=K&&K.state();
    return {canvas:!!cv, w:cv&&cv.clientWidth, px:cv&&cv.width,
      city:S&&S.city, bl:S&&S.bl.map(b=>b.name), npc:S&&S.npc.length};
  });
  console.log('kanvas   :', r.canvas, r.w+'px (buffer '+r.px+')');
  console.log('kota     :', r.city, '·', r.npc, 'NPC');
  console.log('bangunan :', (r.bl||[]).join(', '));

  const moved=await page.evaluate(async()=>{
    const S=Mantara.get('kotajalan').state(); const a=S.px;
    S.stick={ox:60,oy:200,dx:1,dy:0};
    await new Promise(r=>setTimeout(r,600)); S.stick=null;
    return {from:Math.round(a), to:Math.round(S.px)};
  });
  console.log('kendali  :', JSON.stringify(moved), moved.to>moved.from?'✓ bergerak':'✗ diam');

  const markup=await page.evaluate(async()=>{
    const ctx=document.getElementById('kjCanvas').getContext('2d');
    const seen=[], od=ctx.fillText.bind(ctx);
    ctx.fillText=function(t,x,y){ seen.push(String(t)); return od(t,x,y); };
    await new Promise(r=>setTimeout(r,500));
    return seen.filter(t=>/[<>]|stroke-|class=/.test(t)).slice(0,3);
  });
  console.log('markup mentah di kanvas:', markup.length, JSON.stringify(markup));

  const enter=await page.evaluate(async()=>{
    const S=Mantara.get('kotajalan').state(); const b=S.bl[0];
    S.px=b.stand.x; S.py=b.stand.y;
    await new Promise(r=>setTimeout(r,350));
    const el=document.getElementById('kjEnter');
    const on=el&&el.classList.contains('on');
    kjEnterNow(); await new Promise(r=>setTimeout(r,500));
    return {near:S.near&&S.near.name, tombol:on, subloc:C.subloc,
      halaman:!!document.querySelector('#mpage.show'),
      judul:(document.getElementById('mpTitle')||{}).textContent};
  });
  console.log('masuk    :', JSON.stringify(enter));

  const errs=await page.evaluate(()=>Mantara.errors.slice(0,4));
  console.log('Mantara.errors:', errs.length, JSON.stringify(errs));
  console.log('pageerror     :', log.pageErrors.map(fmtErr));

  const ok = r.canvas && r.bl.length>0 && moved.to>moved.from && !markup.length
          && enter.tombol && enter.subloc && enter.halaman
          && !errs.length && !log.pageErrors.length;
  console.log(ok?'\n✓ PETA KOTA BERFUNGSI':'\n✗ ADA MASALAH');
  await t.close(); process.exit(ok?0:1);
})();
