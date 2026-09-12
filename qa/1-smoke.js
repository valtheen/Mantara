/* Uji boot: memuat game, memastikan nol error & nol request gagal. */
const {boot,fmtErr}=require('./lib');
(async()=>{
  const t=await boot({settle:2500,port:8401});
  const s=await t.page.evaluate(()=>({
    title:document.title,
    fnCount:Object.keys(window).filter(k=>typeof window[k]==='function').length,
    busModules:(window.Mantara&&Mantara.inspect().modules)||[],
    busErrors:(window.Mantara&&Mantara.errors.length)||0
  }));
  console.log('judul        :',s.title);
  console.log('fungsi global:',s.fnCount);
  console.log('modul bus    :',s.busModules.join(', '));
  console.log('Mantara.errors:',s.busErrors);
  console.log('pageerror    :',t.log.pageErrors.length, t.log.pageErrors.map(fmtErr));
  console.log('console.error:',t.log.errors.length);
  console.log('request gagal:',[...new Set(t.log.net404)]);
  const ok=!t.log.pageErrors.length && !s.busErrors;
  console.log(ok?'\n✓ BOOT BERSIH':'\n✗ ADA MASALAH');
  await t.close(); process.exit(ok?0:1);
})();
