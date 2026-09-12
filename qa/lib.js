/* ==================================================================
   MANTARA — HARNESS QA
   ------------------------------------------------------------------
   Menyajikan www/ lewat HTTP lokal, membukanya di Chromium headless
   dengan viewport iPhone, dan menangkap SEMUA error: pageerror,
   console.error, dan request gagal.

   Jalankan `npm run build` dulu supaya www/index.html mutakhir.
   Butuh sekali: npm i -D playwright && npx playwright install chromium
   ================================================================== */
const {chromium}=require('playwright');
const fs=require('fs'), path=require('path'), http=require('http');

const ROOT = path.join(__dirname,'..','www');
const MIME={'.html':'text/html','.js':'text/javascript','.json':'application/json','.png':'image/png',
  '.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml','.mp3':'audio/mpeg','.ogg':'audio/ogg',
  '.wav':'audio/wav','.webmanifest':'application/manifest+json','.css':'text/css'};

function serve(port){
  return new Promise(res=>{
    const s=http.createServer((rq,rs)=>{
      let p=decodeURIComponent(rq.url.split('?')[0]); if(p==='/')p='/index.html';
      const f=path.join(ROOT,p);
      if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){rs.writeHead(404);return rs.end('nf');}
      rs.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'application/octet-stream'});
      rs.end(fs.readFileSync(f));
    });
    s.listen(port,()=>res(s));
  });
}

/* Peta baris HTML -> modul src/, supaya stack trace menyebut nama modul
   dan bukan "index.html:9421". Dibangun ulang tiap kali dipanggil. */
function moduleMap(){
  const SRC=path.join(__dirname,'..','src');
  const order=JSON.parse(fs.readFileSync(path.join(SRC,'order.json'),'utf8'));
  const shell=fs.readFileSync(path.join(SRC,'index.shell.html'),'utf8');
  const shellOffset=shell.slice(0,shell.indexOf('/* MANTARA_BUNDLE */')).split('\n').length-1;
  let line=1; const map=[];
  for(const n of order){
    const lc=fs.readFileSync(path.join(SRC,n),'utf8').split('\n').length;
    map.push({mod:n,start:line,end:line+lc-1}); line+=lc;
  }
  return {shellOffset,map};
}
let MM=null;
function modOf(htmlLine){
  if(!MM){ try{ MM=moduleMap(); }catch(e){ MM={shellOffset:0,map:[]}; } }
  const l=htmlLine-MM.shellOffset;
  const m=MM.map.find(x=>l>=x.start&&l<=x.end);
  return m ? (m.mod+':'+(l-m.start+1)) : ('shell:'+htmlLine);
}
function fmtErr(stack){
  return String(stack).split('\n').slice(0,4)
    .map(l=>l.replace(/https?:\/\/localhost:\d+\/index\.html:(\d+):(\d+)/g,(_,a,b)=>'['+modOf(+a)+':'+b+']'))
    .join(' ⏎ ');
}

async function boot(opts={}){
  const port=opts.port||8099;
  const server=await serve(port);
  /* CHROMIUM_PATH bisa diisi kalau Chromium ada di lokasi tidak standar. */
  const launch={args:['--no-sandbox','--autoplay-policy=no-user-gesture-required','--mute-audio']};
  if(process.env.CHROMIUM_PATH) launch.executablePath=process.env.CHROMIUM_PATH;
  const browser=await chromium.launch(launch);
  const ctx=await browser.newContext({
    viewport:{width:opts.width||390,height:opts.height||844}, deviceScaleFactor:2,
    hasTouch:true, isMobile:true,
    userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  });
  const page=await ctx.newPage();
  const log={errors:[],warns:[],pageErrors:[],net404:[]};
  page.on('console',m=>{const t=m.type();if(t==='error')log.errors.push(m.text());else if(t==='warning')log.warns.push(m.text());});
  page.on('pageerror',e=>log.pageErrors.push((e&&e.stack)||String(e)));
  page.on('requestfailed',r=>log.net404.push(r.url()));
  page.on('response',r=>{if(r.status()>=400)log.net404.push(r.status()+' '+r.url());});
  await page.goto('http://localhost:'+port+'/index.html',{waitUntil:'load'});
  await page.waitForTimeout(opts.settle||2000);
  return {server,browser,ctx,page,log,close:async()=>{await browser.close();server.close();}};
}

/* Melewati layar awal sampai karakter lahir. */
async function newLife(page,origin){
  await page.evaluate(()=>{try{tutSkip();tutGuideOff();}catch(e){}});
  await page.evaluate(o=>{selOrigin(o);confirmNewGame();},origin||'peasant');
  await page.waitForTimeout(250);
  await page.evaluate(()=>confirmCustomize());
  await page.waitForTimeout(700);
  await page.evaluate(()=>{try{tutSkip();tutGuideOff();}catch(e){}});
}

/* Maju sampai usia target (atau mati), memilih pilihan pertama. */
async function advanceTo(page,age){
  await page.evaluate(async(age)=>{
    const s=ms=>new Promise(r=>setTimeout(r,ms));
    for(let i=0;i<5000;i++){
      if(typeof C==='undefined'||!C||!C.alive||C.age>=age) break;
      const v=[...document.querySelectorAll('#mchoices .mchoice')].filter(e=>e.offsetParent!==null);
      if(v.length){ v[0].click(); await s(0); continue; }
      const b=document.getElementById('btnAge');
      if(b&&!b.disabled){ b.click(); await s(0); }
      else { try{mpCloseAll();closeModal();}catch(e){} await s(0); }
      if(i%500===499) await s(1);
    }
  },age);
  await page.waitForTimeout(350);
}

/* Menutup semua lapisan (modal berantai, sub-halaman, panel). */
async function drain(page){
  for(let k=0;k<12;k++){
    const n=await page.evaluate(()=>{
      const v=[...document.querySelectorAll('#mchoices .mchoice')].filter(e=>e.offsetParent!==null);
      if(v.length){v[0].click();return v.length;}
      for(const f of ['closeSeason','expClose','arenaClose','gldClose','mpCloseAll','closeModal'])
        {try{typeof window[f]==='function'&&window[f]();}catch(e){}}
      return 0;
    });
    await page.waitForTimeout(240);
    if(!n) break;
  }
}

module.exports={boot,serve,newLife,advanceTo,drain,fmtErr,modOf};
