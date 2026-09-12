/* World navigation and input lifecycle regressions. */
const assert=require('node:assert/strict');
const {boot,newLife,drain}=require('./lib');
(async()=>{
  const t=await boot({port:8407});
  const {page,log}=t;
  try{
    await newLife(page,'noble');await drain(page);
    await page.evaluate(()=>switchTab('Peta'));await drain(page);
    await page.waitForTimeout(500);
    const initial=await page.evaluate(()=>{
      const s=Mantara.get('kotajalan').state();
      return {count:s.bl.length,expected:currentCity().sublocs.length,x:s.px,y:s.py};
    });
    assert.equal(initial.count,initial.expected);
    assert(initial.x>=1000,'Expanded world spawns at the new plaza');
    await page.locator('#kjCanvas').focus();
    await page.keyboard.down('ArrowRight');await page.waitForTimeout(350);
    await page.keyboard.up('ArrowRight');
    const moved=await page.evaluate(()=>Mantara.get('kotajalan').state().px);
    assert(moved>initial.x+15,'Keyboard moves focused map');
    await page.evaluate(()=>{for(let i=0;i<6;i++)renderPeta();});
    await page.waitForTimeout(200);
    assert(Math.abs(await page.evaluate(()=>Mantara.get('kotajalan').state().px)-moved)<2,'Rerender retains position');
    await page.locator('#kjCanvas').focus();
    await page.keyboard.down('d');await page.waitForTimeout(150);
    await page.locator('#kjDestination').focus();await page.keyboard.up('d');
    assert.equal(await page.evaluate(()=>Mantara.get('kotajalan').state().stick),null,'Focus loss stops movement');
    // Start behind a building; the destination door lies on its opposite face.
    const door=await page.evaluate(()=>{
      const s=Mantara.get('kotajalan').state(), b=s.bl[0];
      s.px=b.x+b.w/2;s.py=b.y-35;s.cameraReady=false;
      return {id:b.id,x:b.stand.x,y:b.stand.y};
    });
    assert(await page.evaluate(()=>{
      const s=Mantara.get('kotajalan').state(),b=s.bl[0],x=s.px,y=s.py;
      s.px=b.x-11;s.py=b.y+b.h/2;kjNavigate(b.id);
      const ok=!!s.target;s.target=null;s.route=[];s.px=x;s.py=y;return ok;
    }),'Auto navigation recovers from contact with a wall');
    await page.selectOption('#kjDestination',door.id);
    assert(await page.evaluate(()=>Mantara.get('kotajalan').state().route.length>0),'Path bends around the building');
    await page.waitForFunction(({x,y})=>{const s=Mantara.get('kotajalan').state();return Math.hypot(s.px-x,s.py-y)<4;},door,{timeout:12000});
    assert(await page.locator('#kjEnter').isVisible(),'Arrival exposes enter action');
    await page.locator('#kjEnter').click();
    assert(await page.locator('#mpage').evaluate(e=>e.classList.contains('show')),'Door opens actual location');
    await drain(page);await page.waitForTimeout(600);
    // A real pointer release must retain the navigation target.
    const cv=page.locator('#kjCanvas'); await cv.scrollIntoViewIfNeeded();
    const box=await cv.boundingBox();
    await page.mouse.click(box.x+box.width*0.7,box.y+box.height*0.6);
    assert(await page.evaluate(()=>!!Mantara.get('kotajalan').state().target),'Pointer capture release does not cancel a tap route');
    await cv.dispatchEvent('pointercancel',{pointerId:1});
    assert.equal(await page.evaluate(()=>Mantara.get('kotajalan').state().target),null,'Cancelled gesture stops movement');
    for(const width of [320,390,768]){
      await page.setViewportSize({width,height:844});await page.waitForTimeout(150);
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'No overflow at '+width);
    }
    await page.setViewportSize({width:390,height:844});
    await page.emulateMedia({reducedMotion:'reduce'});
    await cv.scrollIntoViewIfNeeded();await page.waitForTimeout(200);
    await page.waitForTimeout(2200);
    await page.screenshot({path:__dirname+'/world-mobile.png'});
    // Every city retains its full location list and can route from its plaza.
    for(const city of ['aetheria','thornvale','saltmoor','frostspire']){
      const result=await page.evaluate(id=>{
        C.cityId=id;renderPeta();const s=Mantara.get('kotajalan').state();
        return {city:s.city,count:s.bl.length,expected:currentCity().sublocs.length,
          reachable:s.bl.every(b=>{kjNavigate(b.id);return !!s.target;})};
      },city);
      assert.equal(result.city,city);assert.equal(result.count,result.expected);
      assert(result.reachable,'Every destination reachable in '+city);
    }
    assert.equal(log.pageErrors.length,0,log.pageErrors.join('\n'));
    assert.deepEqual(await page.evaluate(()=>Mantara.errors),[]);
    console.log('✓ World: navigation around walls, entry/resume, focus, remount, pointer cancellation, responsive layouts');
  }finally{await t.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
