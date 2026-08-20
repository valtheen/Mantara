/* ==================================================================
   MANTARA — MINIGAME BARU: Balap Sapu Terbang & Ular Naga
   ================================================================== */
(function moreMinigames(){
  // CSS minigame
  const css=document.createElement("style");
  css.textContent=`
  .br-ov{position:fixed;inset:0;z-index:96;display:none;align-items:center;justify-content:center;background:rgba(8,5,2,.88);padding:16px;}
  .br-ov.show{display:flex;}
  .br-panel{background:linear-gradient(160deg,#2a2140,#171122 70%);border:1px solid rgba(139,156,255,.4);border-radius:18px;padding:14px;max-width:400px;width:100%;text-align:center;animation:rise .3s;}
  .br-title{font-size:14px;font-weight:700;color:var(--gold-bright);margin-bottom:8px;}
  .br-area{position:relative;height:320px;border-radius:12px;overflow:hidden;cursor:pointer;
    background:linear-gradient(180deg,#1a1433 0%,#241a3f 60%,#171029 100%);border:1px solid var(--line2);}
  .br-player{position:absolute;left:56px;font-size:26px;z-index:3;filter:drop-shadow(0 0 8px rgba(240,192,64,.6));transition:transform .1s;}
  .br-pipe{position:absolute;width:36px;z-index:2;background:linear-gradient(90deg,#4a3c6e,#5b6ee1 50%,#3a2c5e);border:1px solid rgba(139,156,255,.5);box-shadow:0 0 10px rgba(91,110,225,.35);}
  .br-score{position:absolute;top:8px;left:0;right:0;font-size:22px;font-weight:700;color:var(--gold-bright);z-index:4;text-shadow:0 2px 6px rgba(0,0,0,.6);}
  .br-hint{position:absolute;bottom:10px;left:0;right:0;font-size:11px;color:rgba(232,220,192,.75);z-index:4;}
  .br-star{position:absolute;color:rgba(240,192,64,.35);font-size:9px;z-index:1;}
  .un-board{display:grid;grid-template-columns:repeat(5,1fr);gap:4px;margin:10px 0;}
  .un-cell{position:relative;aspect-ratio:1;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid var(--line);
    display:flex;align-items:center;justify-content:center;font-size:15px;}
  .un-cell .n{position:absolute;top:2px;left:4px;font-size:7.5px;color:var(--ink-soft);filter:brightness(1.6);}
  .un-cell.lad{background:rgba(106,138,58,.18);border-color:rgba(168,212,154,.4);}
  .un-cell.snk{background:rgba(139,38,53,.16);border-color:rgba(224,154,154,.4);}
  .un-cell.fin{background:rgba(184,134,11,.22);border-color:var(--gold);}
  .un-info{font-size:11.5px;color:var(--parchment);margin:4px 0 8px;line-height:1.4;min-height:30px;}
  `;
  document.head.appendChild(css);

  /* ---------- 🧹 BALAP SAPU TERBANG (tap-to-flap) ---------- */
  let brState=null;
  function brBuild(){
    if(document.getElementById("brOv"))return;
    const ov=document.createElement("div");
    ov.id="brOv";ov.className="br-ov";
    document.body.appendChild(ov);
  }
  window.startBroomRace=function(){
    if(typeof C==="undefined"||!C||!C.alive)return;
    if(C.age<10){toast("Terlalu muda untuk balap sapu (min 10).");return;}
    if(!spendAction())return;
    brBuild();
    const ov=document.getElementById("brOv");
    const stars=Array.from({length:14},()=>`<span class="br-star" style="left:${Math.random()*96}%;top:${Math.random()*94}%">✦</span>`).join("");
    ov.innerHTML=`<div class="br-panel">
      <div class="br-title">🧹 Balap Sapu Terbang — Lintasan Arcane</div>
      <div class="br-area" id="brArea">${stars}
        <div class="br-score" id="brScore">0</div>
        <div class="br-player" id="brPlayer">🧹</div>
        <div class="br-hint">ketuk untuk mengepak ke atas!</div>
      </div></div>`;
    ov.classList.add("show");
    const area=document.getElementById("brArea"),player=document.getElementById("brPlayer");
    const H=320,W=area.clientWidth||368,PX=56,SZ=26;
    brState={py:H/2,vy:0,pipes:[],score:0,over:false,last:performance.now(),spawn:0,raf:null};
    function flap(){if(brState&&!brState.over){brState.vy=-235;player.style.transform="rotate(-14deg)";setTimeout(()=>{if(player)player.style.transform="rotate(6deg)";},140);}}
    area.onclick=flap;
    function end(){
      if(!brState||brState.over)return;
      brState.over=true;
      if(brState.raf)cancelAnimationFrame(brState.raf);
      const sc=brState.score;
      const g=sc*8+(sc>=10?60:0);
      C.coin+=g;
      if(C.isMage&&sc>=5)applyStats({mana:+3});
      applyStats({happy:sc>=5?+5:+1});
      setTimeout(()=>{
        ov.classList.remove("show");
        finishAct(sc>=10?`🧹 LEGENDARIS! ${sc} gerbang dilewati — penonton bersorak! +${g} keping.`
          :sc>0?`🧹 Balap selesai: ${sc} gerbang. +${g} keping.`
          :"🧹 Kau terjungkal di gerbang pertama. Penonton menahan tawa.",
          sc>=10?"e-epic":(sc>0?"e-good":"e-bad"));
      },800);
    }
    function tick(now){
      if(!brState||brState.over)return;
      const dt=Math.min(0.032,(now-brState.last)/1000);brState.last=now;
      brState.vy+=640*dt;brState.py+=brState.vy*dt;
      if(brState.py<4||brState.py>H-SZ-2)return end();
      player.style.top=brState.py+"px";
      brState.spawn-=dt;
      if(brState.spawn<=0){
        brState.spawn=1.55;
        const gap=105,gy=40+Math.random()*(H-gap-80);
        const top=document.createElement("div"),bot=document.createElement("div");
        top.className="br-pipe";top.style.cssText=`left:${W}px;top:0;height:${gy}px;border-radius:0 0 8px 8px`;
        bot.className="br-pipe";bot.style.cssText=`left:${W}px;top:${gy+gap}px;height:${H-gy-gap}px;border-radius:8px 8px 0 0`;
        area.appendChild(top);area.appendChild(bot);
        brState.pipes.push({x:W,top,bot,passed:false});
      }
      for(let i=brState.pipes.length-1;i>=0;i--){
        const p=brState.pipes[i];
        p.x-=135*dt;
        p.top.style.left=p.x+"px";p.bot.style.left=p.x+"px";
        if(!p.passed&&p.x+36<PX){p.passed=true;brState.score++;document.getElementById("brScore").textContent=brState.score;}
        if(p.x<-40){p.top.remove();p.bot.remove();brState.pipes.splice(i,1);continue;}
        // tabrakan
        if(p.x<PX+SZ-6&&p.x+36>PX+6){
          const gy=parseFloat(p.top.style.height),gap=105;
          if(brState.py<gy-4||brState.py+SZ>gy+gap+4)return end();
        }
      }
      brState.raf=requestAnimationFrame(tick);
    }
    brState.raf=requestAnimationFrame(tick);
  };

  /* ---------- 🐍 ULAR NAGA & TANGGA AWAN (papan vs lawan kedai) ---------- */
  const UN_LADDERS={2:13,7:16,15:25,21:28};
  const UN_SNAKES={11:4,18:8,24:14,29:17};
  let un=null;
  window.startUlarNaga=function(){
    if(typeof C==="undefined"||!C||!C.alive)return;
    if(C.age<13){toast("Minimal 13 tahun untuk main papan taruhan.");return;}
    const bet=10;
    if(C.coin<bet){toast("Butuh 10 keping taruhan.");return;}
    if(!spendAction())return;
    C.coin-=bet;
    un={me:0,foe:0,turn:"me",over:false,msg:"Taruhan 10 keping di meja. Giliranmu — lempar dadu!"};
    let ov=document.getElementById("unOv");
    if(!ov){ov=document.createElement("div");ov.id="unOv";ov.className="br-ov";document.body.appendChild(ov);}
    ov.classList.add("show");
    unRender();
  };
  function unCellNum(dr,col){const rb=5-dr;return rb%2===0?rb*5+col+1:rb*5+(5-col);}
  function unRender(){
    const ov=document.getElementById("unOv");if(!ov||!un)return;
    let cells="";
    for(let dr=0;dr<6;dr++)for(let col=0;col<5;col++){
      const n=unCellNum(dr,col);
      const lad=UN_LADDERS[n],snk=UN_SNAKES[n];
      let ico="";
      if(n===30)ico="🏆";else if(lad)ico="🪜";else if(snk)ico="🐉";
      let who="";
      if(un.me===n&&un.foe===n)who="🧍🤺";
      else if(un.me===n)who="🧍";else if(un.foe===n)who="🤺";
      cells+=`<div class="un-cell ${lad?'lad':''}${snk?' snk':''}${n===30?' fin':''}"><span class="n">${n}</span>${who||ico}</div>`;
    }
    ov.innerHTML=`<div class="br-panel">
      <div class="br-title">🐍 Ular Naga & Tangga Awan</div>
      <div style="font-size:10.5px;color:var(--ink-soft);filter:brightness(1.6)">🪜 tangga naik · 🐉 naga menelanmu turun · pertama ke 🏆 menang pot 25 keping</div>
      <div class="un-board">${cells}</div>
      <div class="un-info">${un.msg}</div>
      ${un.over
        ?`<button class="ss-btn" onclick="document.getElementById('unOv').classList.remove('show')">Selesai</button>`
        :`<button class="ss-btn" id="unRoll" ${un.turn==="me"?"":"disabled"} onclick="unRollMe()">🎲 Lempar Dadu</button>`}
    </div>`;
  }
  function unMove(who,d){
    let pos=un[who]+d;
    let note="";
    if(pos>=30){un[who]=30;return {pos:30,note:""};}
    if(UN_LADDERS[pos]){note=` — 🪜 naik ke ${UN_LADDERS[pos]}!`;pos=UN_LADDERS[pos];}
    else if(UN_SNAKES[pos]){note=` — 🐉 naga menelan, turun ke ${UN_SNAKES[pos]}!`;pos=UN_SNAKES[pos];}
    un[who]=pos;
    return {pos,note};
  }
  window.unRollMe=function(){
    if(!un||un.over||un.turn!=="me")return;
    const d=ri(1,6);
    const r=unMove("me",d);
    if(un.me>=30){
      un.over=true;un.msg=`🎲 Kau melempar ${d} — 🏆 <b>MENANG!</b> Pot 25 keping milikmu!`;
      C.coin+=25;applyStats({happy:+6});
      log(C.age,"Menang Ular Naga & Tangga di kedai (+15 bersih).","e-good");
      unRender();renderHidup();return;
    }
    un.msg=`🎲 Kau melempar <b>${d}</b>${r.note} (posisimu: ${un.me})`;
    un.turn="foe";unRender();
    setTimeout(()=>{
      if(!un||un.over)return;
      const df=ri(1,6);
      const rf=unMove("foe",df);
      if(un.foe>=30){
        un.over=true;un.msg=`🤺 Lawan melempar ${df} dan mencapai puncak. Taruhanmu melayang...`;
        applyStats({happy:-3});
        log(C.age,"Kalah Ular Naga & Tangga di kedai (-10).","e-bad");
        unRender();renderHidup();return;
      }
      un.msg=`🤺 Lawan melempar <b>${df}</b>${rf.note} (dia: ${un.foe}) — giliranmu!`;
      un.turn="me";unRender();
    },850);
  };

  // pasang ke Kedai Minum (semua kota) — SETELAH rotasi stok, jadi selalu ada
  const tav=STORES.find(s=>s.id==="tavern");
  if(tav){
    const _tb=tav.build;
    tav.build=function(){
      return _tb().concat([{label:"🐍 Ular Naga & Tangga",sub:"papan taruhan kedai · 10 keping · vs penantang",price:10,minAge:13,
        run:()=>startUlarNaga()}]);
    };
  }
})();
