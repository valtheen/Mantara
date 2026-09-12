/* ==================================================================
   MANTARA v25 — KOTA BERJALAN (peta 2D yang bisa dijalani)
   ------------------------------------------------------------------
   Masalah yang diperbaiki:
   Tab Peta dan tab Aksi sampai v25 melakukan hal yang sama persis —
   menampilkan daftar sub-lokasi sebagai kotak, lalu kau menekannya.
   Petanya cuma gambar; tidak ada bedanya menekan "Istana Aurelia" di
   Peta atau di Aksi. Jadi salah satu dari dua tab itu mubazir.

   Sekarang kota adalah tempat, bukan daftar. Karaktermu — avatar yang
   kau bangun sendiri — berdiri di jalanan kota dan berjalan ke mana
   pun. Bangunan adalah sub-lokasi yang SUDAH ADA; berdiri di pintunya
   memunculkan tombol masuk, dan masuk memanggil gotoSubloc() +
   openSublocPage() yang lama. Nol perubahan pada sistem aksi.

   Tata letak tiap kota disusun dari city.sublocs yang ada — tidak ada
   data lokasi baru yang perlu dijaga sinkron. Menambah sub-lokasi di
   06-world-time.js otomatis menambah bangunan di peta.

   Kendali: stik virtual (kiri bawah) + ketuk untuk jalan otomatis.
   Keduanya hidup bersamaan — yang santai cukup mengetuk, yang mau
   menjelajah bisa jalan sendiri.

   Catatan performa: gelung render hanya hidup saat tab Peta terlihat.
   Berhenti saat tab pindah, halaman disembunyikan, modal terbuka,
   atau karakter wafat.
   ================================================================== */
Mantara.module("kotajalan", function(M){
  "use strict";
  var U = M.u;

  /* ---------------- dunia ---------------- */
  var W = 2000, H = 1440;              // satuan dunia
  var PLAZA = {x:1000, y:690};         // pusat kota — pintu selalu menghadap ke sini
  var PR = 11;                        // jari-jari tabrakan pemain
  var SPEED = 190;                    // satuan per detik
  /* Skala menjaga avatar terbaca; minimap menyediakan orientasi kota. */
  var ZOOM = 0.82;
  var reducedMotion=window.matchMedia("(prefers-reduced-motion: reduce)");
  var cleanupInput=null;

  /* Slot bangunan mengelilingi alun-alun. Sub-lokasi diisi berurutan,
     jadi kota dengan 4 sub-lokasi memakai 4 slot pertama. */
  var SLOTS = [
    {x:110, y: 95, w:215, h:135},
    {x:625, y: 85, w:245, h:145},
    {x: 95, y:450, w:225, h:145},
    {x:645, y:460, w:235, h:150},
    {x:385, y: 55, w:215, h:120},
    {x:395, y:530, w:205, h:120}
  ];

  /* Palet & watak tiap kota. Warnanya mengikuti CITY_THEME yang sudah
     dipakai peta SVG lama, supaya dua peta terasa satu dunia. */
  var SKIN = {
    aetheria:  {ground:"#2b2117", road:"#3d3121", wall:"#4a3a24", roof:"#6d5324",
                accent:"#e8c05a", trim:"#b8860b", decor:"pillar", sky:"#1a1410"},
    thornvale: {ground:"#1e2a18", road:"#33291a", wall:"#3b3122", roof:"#4a6a34",
                accent:"#8fd07a", trim:"#5f8a3a", decor:"tree",   sky:"#121a10"},
    saltmoor:  {ground:"#232a30", road:"#333a3e", wall:"#3a4149", roof:"#3f6f86",
                accent:"#7fd0e8", trim:"#3a8fb0", decor:"water",  sky:"#101619"},
    frostspire:{ground:"#28303a", road:"#3b4450", wall:"#414c5b", roof:"#5a7ba6",
                accent:"#bfe0ff", trim:"#7aa6d6", decor:"ice",    sky:"#141a22"}
  };
  function skin(){ var c=cityId(); return SKIN[c]||SKIN.aetheria; }
  function cityId(){ try{ return C.cityId || C.location || "aetheria"; }catch(e){ return "aetheria"; } }
  function cityObj(){ try{ return (typeof currentCity==="function") ? currentCity() : null; }catch(e){ return null; } }

  /* acak stabil — dekorasi tidak boleh loncat-loncat tiap frame */
  function seeded(seed){
    var a = 0; seed=String(seed);
    for(var i=0;i<seed.length;i++){ a = (a*31 + seed.charCodeAt(i))|0; }
    return function(){ a|=0; a=a+0x6D2B79F5|0; var t=Math.imul(a^a>>>15,1|a);
      t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; };
  }

  /* ---------------- keadaan ---------------- */
  var S = null;    // keadaan peta aktif
  var canvas=null, ctx=null, raf=0, lastT=0;
  var avatarImg=null, avatarKey="";

  function buildings(){
    var city=cityObj(); if(!city||!city.sublocs) return [];
    return city.sublocs.map(function(s, i){
      var slot=SLOTS[i%SLOTS.length];
      var sl={x:slot.x*2, y:slot.y*2, w:slot.w, h:slot.h};
      if(i>=SLOTS.length){ sl.x=70+(i-SLOTS.length)%6*310; sl.y=H-190-Math.floor((i-SLOTS.length)/6)*180; }
      var b={id:s.id, name:s.name, ico:s.ico, desc:s.desc,
             x:sl.x, y:sl.y, w:sl.w, h:sl.h};
      /* pintu = titik di tepi bangunan yang paling dekat alun-alun */
      var cx=b.x+b.w/2, cy=b.y+b.h/2;
      var dx=PLAZA.x-cx, dy=PLAZA.y-cy;
      if(Math.abs(dx)/b.w > Math.abs(dy)/b.h){
        b.door = {x: dx>0 ? b.x+b.w : b.x, y: cy, side: dx>0?"e":"w"};
      }else{
        b.door = {x: cx, y: dy>0 ? b.y+b.h : b.y, side: dy>0?"s":"n"};
      }
      /* titik berdiri di depan pintu */
      b.stand = {x: b.door.x + (b.door.side==="e"?22:b.door.side==="w"?-22:0),
                 y: b.door.y + (b.door.side==="s"?22:b.door.side==="n"?-22:0)};
      return b;
    });
  }

  function decorFor(id){
    var rnd=seeded("decor-"+id), out=[], i;
    for(i=0;i<140;i++){
      var x=40+rnd()*(W-80), y=40+rnd()*(H-80);
      /* jangan menaruh dekorasi di jalan utama atau alun-alun */
      if(Math.abs(y-PLAZA.y)<70 || Math.abs(x-PLAZA.x)<70) continue;
      out.push({x:x, y:y, s:0.6+rnd()*0.8, r:rnd()});
    }
    return out;
  }

  /* Titik yang tidak berada di dalam bangunan mana pun. Dipakai untuk
     melahirkan NPC dan memilih tujuan jalan mereka — tanpa ini NPC bisa
     lahir di dalam tembok lalu terjebak selamanya di sana. */
  function freeSpot(rnd, bl, pad){
    pad = pad || 14;
    for(var tries=0; tries<40; tries++){
      var x=70+rnd()*(W-140), y=70+rnd()*(H-140), ok=true;
      for(var i=0;i<bl.length;i++){
        var b=bl[i];
        if(x>b.x-pad && x<b.x+b.w+pad && y>b.y-pad && y<b.y+b.h+pad){ ok=false; break; }
      }
      if(ok) return {x:x, y:y};
    }
    return {x:PLAZA.x, y:PLAZA.y+90};
  }

  function makeNPCs(bl){
    var rnd=seeded("npc-"+cityId()+"-"+(C&&C.age||0)), out=[], i;
    var rels=[];
    try{
      rels=(C.relations||[]).filter(function(r){ return r.alive!==false && r.name; }).slice(0,3);
    }catch(e){}
    for(i=0;i<9;i++){
      var rel = rels[i] || null;
      var p = freeSpot(rnd, bl);
      out.push({
        x:p.x, y:p.y, tx:p.x, ty:p.y,
        spd: 26+rnd()*22, hue: rnd(),
        rel: rel, name: rel?rel.name:null, wait: rnd()*3
      });
    }
    return out;
  }

  function reset(){
    var b=buildings();
    S = {
      city: cityId(),
      bl: b,
      decor: decorFor(cityId()).filter(function(d){ return !b.some(function(v){ return d.x>v.x-25&&d.x<v.x+v.w+25&&d.y>v.y-35&&d.y<v.y+v.h+25; }); }),
      npc: makeNPCs(b),
      px: PLAZA.x, py: PLAZA.y+70,
      vx: 0, vy: 0, face: 1, walk: 0,
      target: null,           // {x,y} tujuan ketuk
      near: null,             // bangunan yang pintunya terjangkau
      stick: null,            // {ox,oy,dx,dy,id}
      cam: {x:0, y:0}, cameraReady:false, route:[]
    };
  }

  /* ---------------- avatar pemain sebagai sprite ---------------- */
  function avatarSprite(){
    if(!U.alive()) return null;
    var key = JSON.stringify(C.appearance||{}) + "|" + (C.age|0) + "|" + (C.isMage?1:0);
    if(avatarImg && avatarKey===key) return avatarImg.complete ? avatarImg : null;
    try{
      if(!window.MantaraAvatar || !MantaraAvatar.render) return null;
      var svg = MantaraAvatar.render(C.appearance, C.age, C.isMage, true);
      /* MantaraAvatar.render menghasilkan SVG untuk ditempel INLINE di HTML.
         Dimuat lewat <img> ia harus jadi dokumen yang berdiri sendiri:
         - tanpa xmlns, gambarnya gagal dimuat sama sekali (onerror);
         - tanpa width/height, drawImage menggambarnya 0x0.
         Keduanya disuntikkan di sini, bukan diubah di modul avatar,
         supaya pemakaian inline yang lama tidak tersentuh. */
      if(svg.indexOf("xmlns=")<0)
        svg = svg.replace("<svg", "<svg xmlns=\"http://www.w3.org/2000/svg\"");
      if(!/<svg[^>]*\swidth=/.test(svg))
        svg = svg.replace("<svg", "<svg width=\"120\" height=\"120\"");
      var img = new Image();
      img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      avatarImg = img; avatarKey = key;
      return null;   // dipakai frame berikutnya setelah termuat
    }catch(e){ return null; }
  }

  /* ---------------- tabrakan ---------------- */
  function collide(nx, ny){
    var i, b;
    for(i=0;i<S.bl.length;i++){
      b=S.bl[i];
      var cx=Math.max(b.x, Math.min(nx, b.x+b.w));
      var cy=Math.max(b.y, Math.min(ny, b.y+b.h));
      var dx=nx-cx, dy=ny-cy, d2=dx*dx+dy*dy;
      if(d2 < PR*PR){
        if(d2===0){
          var edges=[{d:nx-b.x,x:b.x-PR,y:ny},{d:b.x+b.w-nx,x:b.x+b.w+PR,y:ny},{d:ny-b.y,x:nx,y:b.y-PR},{d:b.y+b.h-ny,x:nx,y:b.y+b.h+PR}];
          edges.sort(function(a,b){return a.d-b.d;}); nx=edges[0].x; ny=edges[0].y; continue;
        }
        var d=Math.sqrt(d2);
        nx = cx + dx/d*PR; ny = cy + dy/d*PR;
      }
    }
    return {x: Math.max(PR, Math.min(W-PR, nx)), y: Math.max(PR, Math.min(H-PR, ny))};
  }

  /* Visibility graph: routes pass outside inflated building corners. */
  function clearPath(a,b){
    return !S.bl.some(function(v){
      var pad=PR+3, lo=0, hi=1;
      var axes=[[a.x,b.x-a.x,v.x-pad,v.x+v.w+pad],[a.y,b.y-a.y,v.y-pad,v.y+v.h+pad]];
      for(var i=0;i<2;i++){
        var q=axes[i];
        if(Math.abs(q[1])<1e-8){ if(q[0]<q[2]||q[0]>q[3]) return false; }
        else { var t1=(q[2]-q[0])/q[1], t2=(q[3]-q[0])/q[1];
          lo=Math.max(lo,Math.min(t1,t2)); hi=Math.min(hi,Math.max(t1,t2)); }
      }
      return lo<=hi;
    });
  }
  function navigate(point){
    if(!S) return;
    var end=collide(Math.max(PR,Math.min(W-PR,point.x)),Math.max(PR,Math.min(H-PR,point.y)));
    var origin={x:S.px,y:S.py}, safe={x:S.px,y:S.py}, pad=PR+5;
    // Manual movement can stop against a wall, inside routing clearance.
    // First step out of that margin so the graph can find an onward route.
    S.bl.forEach(function(b){
      if(safe.x>b.x-pad&&safe.x<b.x+b.w+pad&&safe.y>b.y-pad&&safe.y<b.y+b.h+pad){
        var exits=[{x:b.x-pad,y:safe.y},{x:b.x+b.w+pad,y:safe.y},{x:safe.x,y:b.y-pad},{x:safe.x,y:b.y+b.h+pad}];
        exits.sort(function(a,b){return Math.hypot(a.x-safe.x,a.y-safe.y)-Math.hypot(b.x-safe.x,b.y-safe.y);});
        safe=exits[0];
      }
    });
    var nodes=[safe,end];
    S.bl.forEach(function(b){
      [b.x-pad,b.x+b.w+pad].forEach(function(x){
        [b.y-pad,b.y+b.h+pad].forEach(function(y){nodes.push({x:x,y:y});});
      });
    });
    var dist=nodes.map(function(){return Infinity;}), prev=[], done=[]; dist[0]=0;
    for(var k=0;k<nodes.length;k++){
      var u=-1;
      for(var i=0;i<nodes.length;i++) if(!done[i]&&(u<0||dist[i]<dist[u])) u=i;
      if(u<0||!isFinite(dist[u])||u===1) break;
      done[u]=true;
      for(var j=0;j<nodes.length;j++) if(!done[j]&&clearPath(nodes[u],nodes[j])){
        var d=dist[u]+Math.hypot(nodes[u].x-nodes[j].x,nodes[u].y-nodes[j].y);
        if(d<dist[j]){dist[j]=d;prev[j]=u;}
      }
    }
    S.route=[]; S.target=null;
    if(!isFinite(dist[1])){ U.toast("Tujuan belum dapat dijangkau."); return; }
    for(var n=1;n!==0;n=prev[n]) S.route.unshift(nodes[n]);
    if(Math.hypot(origin.x-safe.x,origin.y-safe.y)>0.1) S.route.unshift(safe);
    S.target=S.route.shift(); S.ping={x:end.x,y:end.y,t:1};
  }
  window.kjNavigate=function(id){
    if(!S) return;
    var b=S.bl.find(function(v){return v.id===id;});
    if(b) navigate(b.stand);
  };

  /* ---------------- langkah simulasi ---------------- */
  function step(dt){
    var ax=0, ay=0;
    if(S.stick){
      ax=S.stick.dx; ay=S.stick.dy;
      var m=Math.hypot(ax,ay); if(m>1){ ax/=m; ay/=m; }
      S.target=null; S.route=[];
    } else if(S.target){
      var tdx=S.target.x-S.px, tdy=S.target.y-S.py, td=Math.hypot(tdx,tdy);
      if(td<3){ S.target=S.route.shift()||null; }
      else { ax=tdx/td; ay=tdy/td; }
    }

    var moving = (ax||ay);
    if(moving){
      var travel=S.target?Math.min(SPEED*dt,td):SPEED*dt;
      var np=collide(S.px + ax*travel, S.py + ay*travel);
      /* kalau auto-jalan mentok bangunan, batalkan supaya tidak macet */
      if(S.target && Math.hypot(np.x-S.px, np.y-S.py) < SPEED*dt*0.25) S.target=null;
      S.walk += Math.hypot(np.x-S.px,np.y-S.py)*0.09;
      S.px=np.x; S.py=np.y;
      if(ax) S.face = ax>0 ? 1 : -1;
    } else {
      S.walk = 0;
    }

    /* pintu terdekat */
    S.near=null;
    var best=1e9;
    for(var i=0;i<S.bl.length;i++){
      var b=S.bl[i], d=Math.hypot(S.px-b.stand.x, S.py-b.stand.y);
      if(d<44 && d<best){ best=d; S.near=b; }
    }

    /* NPC berkeliaran */
    for(var k=0;k<S.npc.length;k++){
      var n=S.npc[k];
      n.wait-=dt;
      if(n.wait<=0){
        var sp=freeSpot(Math.random, S.bl);
        n.tx=sp.x; n.ty=sp.y;
        n.wait = 3 + Math.random()*5;
      }
      var ndx=n.tx-n.x, ndy=n.ty-n.y, nd=Math.hypot(ndx,ndy);
      if(nd>3){
        var nn=n.spd*dt/nd;
        var cand={x:n.x+ndx*nn, y:n.y+ndy*nn};
        /* NPC juga tidak menembus bangunan */
        var blocked=false;
        for(var j=0;j<S.bl.length;j++){
          var bb=S.bl[j];
          if(cand.x>bb.x-8&&cand.x<bb.x+bb.w+8&&cand.y>bb.y-8&&cand.y<bb.y+bb.h+8){ blocked=true; break; }
        }
        if(blocked){ n.wait=0; } else { n.x=cand.x; n.y=cand.y; }
      }
    }

    if(S.ping && S.ping.t>0) S.ping.t=Math.max(0, S.ping.t-dt*1.6);

    /* kamera mengikuti, ditahan di tepi dunia (dalam satuan dunia) */
    var vw=canvas.clientWidth/ZOOM, vh=canvas.clientHeight/ZOOM;
    var oldX=S.cam.x, oldY=S.cam.y;
    S.cam.x = Math.max(0, Math.min(W-vw, S.px - vw/2));
    /* pemain ditaruh sedikit di atas tengah: tombol "Masuk" menempati
       tepi bawah kanvas dan akan menutupi karakter kalau ia pas di tengah */
    S.cam.y = Math.max(0, Math.min(H-vh, S.py - vh*0.42));
    if(W<vw) S.cam.x=(W-vw)/2;
    if(H<vh) S.cam.y=(H-vh)/2;
    if(S.cameraReady&&!reducedMotion.matches){var blend=1-Math.exp(-dt*10); S.cam.x=oldX+(S.cam.x-oldX)*blend; S.cam.y=oldY+(S.cam.y-oldY)*blend;}
    S.cameraReady=true;
  }

  /* ---------------- gambar ---------------- */
  function draw(){
    var sk=skin(), vw=canvas.clientWidth, vh=canvas.clientHeight;
    var dpr=Math.min(2, window.devicePixelRatio||1);
    if(canvas.width!==Math.round(vw*dpr) || canvas.height!==Math.round(vh*dpr)){
      canvas.width=Math.round(vw*dpr); canvas.height=Math.round(vh*dpr);
    }
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.clearRect(0,0,vw,vh);
    ctx.save();
    ctx.scale(ZOOM, ZOOM);
    ctx.translate(-S.cam.x, -S.cam.y);

    /* tanah */
    ctx.fillStyle=sk.ground; ctx.fillRect(0,0,W,H);

    /* jalan: salib besar + cincin alun-alun */
    ctx.fillStyle=sk.road;
    S.bl.forEach(function(b){
      ctx.strokeStyle=sk.road; ctx.lineWidth=42; ctx.lineJoin="round";
      ctx.beginPath();ctx.moveTo(b.stand.x,b.stand.y);ctx.lineTo(b.stand.x,PLAZA.y);ctx.lineTo(PLAZA.x,PLAZA.y);ctx.stroke();
    });
    ctx.fillRect(0, PLAZA.y-46, W, 92);
    ctx.fillRect(PLAZA.x-46, 0, 92, H);
    ctx.beginPath(); ctx.arc(PLAZA.x, PLAZA.y, 118, 0, 6.2832); ctx.fill();

    /* garis tepi jalan */
    ctx.strokeStyle="rgba(255,255,255,.05)"; ctx.lineWidth=2;
    ctx.strokeRect(0.5, PLAZA.y-46.5, W, 92);
    ctx.strokeRect(PLAZA.x-46.5, 0.5, 92, H);

    /* Batu jalan dan taman memakai koordinat tetap, tanpa kedip acak. */
    ctx.strokeStyle="rgba(235,220,195,.07)";ctx.lineWidth=1;
    for(var tile=0;tile<W;tile+=48){
      ctx.beginPath();ctx.moveTo(tile,PLAZA.y-40);ctx.lineTo(tile+20,PLAZA.y+40);ctx.stroke();
    }
    ctx.strokeStyle=sk.trim;ctx.globalAlpha=.25;ctx.lineWidth=4;
    ctx.strokeRect(28,28,W-56,H-56);ctx.globalAlpha=1;

    /* dekorasi khas kota */
    drawDecor(sk);

    /* penanda alun-alun */
    ctx.save();
    ctx.globalAlpha=.5; ctx.strokeStyle=sk.trim; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(PLAZA.x, PLAZA.y, 34, 0, 6.2832); ctx.stroke();
    ctx.globalAlpha=.25;
    ctx.beginPath(); ctx.arc(PLAZA.x, PLAZA.y, 20, 0, 6.2832); ctx.fillStyle=sk.accent; ctx.fill();
    ctx.restore();

    ctx.fillStyle=sk.wall;ctx.beginPath();ctx.ellipse(PLAZA.x,PLAZA.y,46,28,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle=sk.trim;ctx.lineWidth=4;ctx.stroke();
    ctx.fillStyle=sk.accent;ctx.globalAlpha=.35;
    ctx.beginPath();ctx.ellipse(PLAZA.x,PLAZA.y-3,36,19,0,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;
    ctx.fillStyle=sk.roof;ctx.fillRect(PLAZA.x-6,PLAZA.y-35,12,34);
    ctx.fillStyle=sk.accent;ctx.beginPath();ctx.arc(PLAZA.x,PLAZA.y-37,7,0,Math.PI*2);ctx.fill();
    if(S.target){
      ctx.save();ctx.strokeStyle=sk.accent;ctx.globalAlpha=.55;ctx.lineWidth=2;ctx.setLineDash([5,8]);
      ctx.beginPath();ctx.moveTo(S.px,S.py);ctx.lineTo(S.target.x,S.target.y);
      S.route.forEach(function(p){ctx.lineTo(p.x,p.y);});ctx.stroke();ctx.restore();
    }

    /* bangunan (urut y supaya yang depan menimpa yang belakang) */


    /* penanda tujuan: tanpa ini ketukan terasa tidak terbaca sama sekali */
    if(S.ping && S.ping.t>0){
      var pr=(1-S.ping.t)*26+8;
      ctx.strokeStyle=sk.accent; ctx.globalAlpha=S.ping.t*0.9; ctx.lineWidth=2.5;
      ctx.beginPath(); ctx.arc(S.ping.x, S.ping.y, pr, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha=S.ping.t*0.5;
      ctx.beginPath(); ctx.arc(S.ping.x, S.ping.y, 3.5, 0, 6.2832); ctx.fillStyle=sk.accent; ctx.fill();
      ctx.globalAlpha=1;
    }

    /* NPC & pemain, juga urut y */
    var actors=S.npc.map(function(n){ return {y:n.y, f:function(){ drawNPC(n, sk); }}; });
    S.bl.forEach(function(b){if(inView(b.x,b.y,b.w,b.h))actors.push({y:b.y+b.h,f:function(){drawBuilding(b,sk);}});});
    actors.push({y:S.py, f:function(){ drawPlayer(sk); }});
    actors.sort(function(a,b){ return a.y-b.y; }).forEach(function(a){ a.f(); });

    ctx.restore();

    /* vignette supaya fokus ke tengah */
    var g=ctx.createRadialGradient(vw/2,vh/2,vh*0.35, vw/2,vh/2,vh*0.95);
    g.addColorStop(0,"rgba(0,0,0,0)"); g.addColorStop(1,"rgba(0,0,0,.45)");
    ctx.fillStyle=g; ctx.fillRect(0,0,vw,vh);

    drawStick(vw,vh);
    var mw=100, mh=72, mx=vw-mw-12, my=12;
    ctx.fillStyle="rgba(15,12,22,.88)"; roundRect(mx-5,my-5,mw+10,mh+10,9);ctx.fill();
    ctx.fillStyle=sk.road;ctx.fillRect(mx,my,mw,mh);
    ctx.fillStyle=sk.trim; S.bl.forEach(function(b){ctx.fillRect(mx+b.x/W*mw,my+b.y/H*mh,b.w/W*mw,b.h/H*mh);});
    ctx.strokeStyle="rgba(255,255,255,.5)";ctx.lineWidth=1;
    ctx.strokeRect(mx+S.cam.x/W*mw,my+S.cam.y/H*mh,Math.min(W,vw/ZOOM)/W*mw,Math.min(H,vh/ZOOM)/H*mh);
    ctx.fillStyle="#fff";ctx.beginPath();ctx.arc(mx+S.px/W*mw,my+S.py/H*mh,3,0,Math.PI*2);ctx.fill();
  }

  function inView(x,y,w,h){
    return x+w>S.cam.x-80&&x<S.cam.x+canvas.clientWidth/ZOOM+80&&y+h>S.cam.y-80&&y<S.cam.y+canvas.clientHeight/ZOOM+80;
  }
  function drawDecor(sk){
    S.decor.forEach(function(d){
      if(!inView(d.x,d.y,30,30))return;
      ctx.save(); ctx.translate(d.x, d.y); ctx.scale(d.s, d.s);
      if(sk.decor==="tree"){
        ctx.fillStyle="rgba(0,0,0,.28)"; ctx.beginPath(); ctx.ellipse(0,4,13,5,0,0,6.2832); ctx.fill();
        ctx.fillStyle="#3a2c1c"; ctx.fillRect(-2.5,-6,5,10);
        ctx.fillStyle=sk.roof; ctx.beginPath(); ctx.arc(0,-14,13,0,6.2832); ctx.fill();
        ctx.fillStyle="rgba(255,255,255,.06)"; ctx.beginPath(); ctx.arc(-4,-18,6,0,6.2832); ctx.fill();
      } else if(sk.decor==="pillar"){
        ctx.fillStyle="rgba(0,0,0,.3)"; ctx.beginPath(); ctx.ellipse(0,4,9,4,0,0,6.2832); ctx.fill();
        ctx.fillStyle=sk.wall; ctx.fillRect(-5,-22,10,26);
        ctx.fillStyle=sk.accent; ctx.globalAlpha=.55; ctx.fillRect(-7,-25,14,4); ctx.fillRect(-7,2,14,3);
      } else if(sk.decor==="water"){
        ctx.fillStyle="rgba(70,140,170,.16)"; ctx.beginPath(); ctx.ellipse(0,0,16,7,0,0,6.2832); ctx.fill();
        ctx.strokeStyle="rgba(160,220,240,.22)"; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.moveTo(-10,0); ctx.quadraticCurveTo(0,-4,10,0); ctx.stroke();
      } else {
        ctx.fillStyle="rgba(200,225,255,.14)";
        ctx.beginPath(); ctx.moveTo(0,-13); ctx.lineTo(9,5); ctx.lineTo(-9,5); ctx.closePath(); ctx.fill();
        ctx.fillStyle="rgba(255,255,255,.2)";
        ctx.beginPath(); ctx.moveTo(0,-13); ctx.lineTo(4,-2); ctx.lineTo(-4,-2); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    });
  }

  /* Sebagian ico sub-lokasi BUKAN emoji: 37-city-identity & 25-school-life
     menggantinya dengan markup SVG untuk dipakai di HTML (lambang sekolah,
     misalnya, panjangnya 463 karakter). fillText() menggambar markup itu
     apa adanya — sumber SVG-nya muncul sebagai teks raksasa di tengah peta.
     Di kanvas kita hanya menerima emoji; sisanya diganti lambang yang
     ditebak dari namanya. */
  function plainIco(b){
    var ico=String(b.ico||"");
    if(ico && ico.indexOf("<")<0 && ico.length<=6) return ico;
    var n=String(b.name||"");
    if(/kolese|akademi|sekolah|balai sihir/i.test(n)) return "🎓";
    if(/colosseum|arena|laga/i.test(n))               return "⚔️";
    if(/pasar|toko|dagang/i.test(n))                  return "🏪";
    if(/istana|puri|takhta/i.test(n))                 return "👑";
    if(/menara|arcanum/i.test(n))                     return "🗼";
    if(/hutan|rimba|kebun/i.test(n))                  return "🌲";
    if(/dermaga|pelabuhan|kapal/i.test(n))            return "⚓";
    return "🏛️";
  }
  function plainText(v){ return String(v==null?"":v).replace(/<[^>]*>/g,"").trim(); }

  function roundRect(x,y,w,h,r){
    ctx.beginPath();
    ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
    ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);
    ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r);
    ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
  }

  function drawBuilding(b, sk){
    var here = (C.subloc===b.id);
    /* bayangan */
    ctx.fillStyle="rgba(0,0,0,.35)";
    ctx.fillRect(b.x+5, b.y+9, b.w, b.h);
    /* badan */
    var g=ctx.createLinearGradient(b.x, b.y, b.x, b.y+b.h);
    g.addColorStop(0, sk.roof); g.addColorStop(0.42, sk.wall); g.addColorStop(1, sk.ground);
    ctx.fillStyle=g; ctx.fillRect(b.x, b.y, b.w, b.h);
    /* atap */
    ctx.fillStyle=sk.roof;
    ctx.beginPath();ctx.moveTo(b.x-7,b.y+24);ctx.lineTo(b.x+20,b.y-7);
    ctx.lineTo(b.x+b.w-20,b.y-7);ctx.lineTo(b.x+b.w+7,b.y+24);ctx.closePath();ctx.fill();
    ctx.strokeStyle=sk.trim;ctx.lineWidth=2;ctx.stroke();
    ctx.strokeStyle="rgba(255,255,255,.09)";ctx.lineWidth=1;
    for(var rib=28;rib<b.w-15;rib+=24){ctx.beginPath();ctx.moveTo(b.x+rib,b.y-3);ctx.lineTo(b.x+rib-10,b.y+20);ctx.stroke();}
    /* garis tepi */
    ctx.strokeStyle = (S.near===b||here) ? sk.accent : "rgba(0,0,0,.45)";
    ctx.lineWidth = (S.near===b||here) ? 2.5 : 1.5;
    ctx.strokeRect(b.x+0.5, b.y+0.5, b.w-1, b.h-1);
    /* jendela */
    ctx.fillStyle="rgba(255,220,150,.32)";
    for(var r=0;r<2;r++) for(var c2=0;c2<3;c2++)
      ctx.fillRect(b.x+18+c2*(b.w-46)/2.4, b.y+34+r*32, 16, 18);
    /* pintu */
    var d=b.door;
    ctx.fillStyle= S.near===b ? sk.accent : sk.trim;
    if(d.side==="n"||d.side==="s") ctx.fillRect(d.x-15, d.y-5, 30, 10);
    else ctx.fillRect(d.x-5, d.y-15, 10, 30);
    /* papan nama di atap — di tengah badan bangunan ia bertabrakan
       dengan NPC yang lewat di depannya */
    ctx.font="700 13px -apple-system,system-ui,sans-serif";
    ctx.textAlign="center"; ctx.textBaseline="middle";
    var label=plainText(b.name);
    var tw=ctx.measureText(label).width;
    var by=b.y-15;
    ctx.fillStyle="rgba(12,9,6,.9)";
    roundRect(b.x+b.w/2-tw/2-9, by-11, tw+18, 23, 7); ctx.fill();
    ctx.strokeStyle=(S.near===b||here)?sk.accent:"rgba(255,255,255,.12)";
    ctx.lineWidth=1.2; ctx.stroke();
    ctx.fillStyle= (S.near===b||here) ? sk.accent : "rgba(235,225,200,.88)";
    ctx.fillText(label, b.x+b.w/2, by);
    /* ikon besar di badan bangunan, menggantikan teks */
    ctx.font="30px -apple-system,system-ui,sans-serif";
    ctx.globalAlpha=.5; ctx.fillText(plainIco(b), b.x+b.w/2, b.y+b.h/2); ctx.globalAlpha=1;
    if(here){
      ctx.font="700 9.5px -apple-system,system-ui,sans-serif";
      ctx.fillStyle=sk.accent; ctx.fillText("KAMU DI SINI", b.x+b.w/2, b.y+b.h-14);
    }
  }

  function figure(x, y, bob, bodyCol, headCol, face){
    ctx.fillStyle="rgba(0,0,0,.34)";
    ctx.beginPath(); ctx.ellipse(x, y+9, 11, 4.5, 0, 0, 6.2832); ctx.fill();
    /* jubah */
    ctx.fillStyle=bodyCol;
    ctx.beginPath();
    ctx.moveTo(x, y-10+bob);
    ctx.lineTo(x+9, y+8);
    ctx.lineTo(x-9, y+8);
    ctx.closePath(); ctx.fill();
    /* kepala */
    ctx.fillStyle=headCol;
    ctx.beginPath(); ctx.arc(x+face*1.2, y-14+bob, 7, 0, 6.2832); ctx.fill();
  }

  function drawPlayer(sk){
    var bob = reducedMotion.matches?0:Math.sin(S.walk)*1.8;
    ctx.save();ctx.translate(S.px,S.py);ctx.scale(1.65,1.65);ctx.translate(-S.px,-S.py);
    var img = avatarSprite();
    figure(S.px, S.py, bob, C.appearance&&C.appearance.female?"#58406a":"#3c4d66", "#bd7957", S.face);
    ctx.strokeStyle="#211b2d";ctx.lineWidth=4;ctx.lineCap="round";
    var stride=reducedMotion.matches?0:Math.sin(S.walk)*4;
    ctx.beginPath();ctx.moveTo(S.px-4,S.py+5);ctx.lineTo(S.px-4+stride,S.py+13);
    ctx.moveTo(S.px+4,S.py+5);ctx.lineTo(S.px+4-stride,S.py+13);ctx.stroke();
    if(img && img.complete && img.naturalWidth){
      /* kepala diganti potret avatar yang dibangun pemain */
      ctx.save();
      ctx.beginPath(); ctx.arc(S.px+S.face*1.2, S.py-14.5+bob, 9.5, 0, 6.2832); ctx.clip();
      ctx.drawImage(img, S.px+S.face*1.2-11.5, S.py-26+bob, 23, 23);
      ctx.restore();
      ctx.strokeStyle=sk.accent; ctx.lineWidth=1.4; ctx.globalAlpha=.85;
      ctx.beginPath(); ctx.arc(S.px+S.face*1.2, S.py-14.5+bob, 9.5, 0, 6.2832); ctx.stroke();
      ctx.globalAlpha=1;
    }
    /* cincin penanda */
    ctx.strokeStyle=sk.accent; ctx.globalAlpha=.35; ctx.lineWidth=1.5;
    ctx.beginPath(); ctx.ellipse(S.px, S.py+9, 15, 6, 0, 0, 6.2832); ctx.stroke();
    ctx.globalAlpha=1;
    ctx.restore();
  }

  function drawNPC(n, sk){
    var bob=reducedMotion.matches?0:Math.sin((n.x+n.y)*0.12)*1.2;
    var hue=Math.round(20+n.hue*300);
    figure(n.x, n.y, bob, "hsla("+hue+",22%,38%,.9)", "#c2a37e", 1);
    /* label hanya saat pemain mendekat — kalau selalu tampil, layar penuh
       nama yang tak relevan dan menutupi papan nama bangunan */
    if(n.name && Math.hypot(n.x-S.px, n.y-S.py) < 130){
      var nlabel=plainText(n.name);
      ctx.font="600 9.5px -apple-system,system-ui,sans-serif";
      ctx.textAlign="center"; ctx.textBaseline="middle";
      var tw=ctx.measureText(nlabel).width;
      ctx.fillStyle="rgba(0,0,0,.55)"; roundRect(n.x-tw/2-6, n.y-33, tw+12, 17, 5); ctx.fill();
      ctx.fillStyle=sk.accent; ctx.fillText(nlabel, n.x, n.y-24.5);
    }
  }

  function drawStick(vw, vh){
    if(!S.stick) return;
    var s=S.stick;
    ctx.save();
    ctx.globalAlpha=.28; ctx.fillStyle="#000";
    ctx.beginPath(); ctx.arc(s.ox, s.oy, 46, 0, 6.2832); ctx.fill();
    ctx.globalAlpha=.5; ctx.strokeStyle=skin().accent; ctx.lineWidth=2;
    ctx.beginPath(); ctx.arc(s.ox, s.oy, 46, 0, 6.2832); ctx.stroke();
    ctx.globalAlpha=.85; ctx.fillStyle=skin().accent;
    ctx.beginPath(); ctx.arc(s.ox+s.dx*30, s.oy+s.dy*30, 17, 0, 6.2832); ctx.fill();
    ctx.restore();
  }

  /* ---------------- gelung ---------------- */
  function visible(){
    if(!canvas || !canvas.isConnected) return false;
    if(document.hidden) return false;
    if(!U.alive()) return false;
    var v=document.getElementById("viewPeta");
    if(!v || v.offsetParent===null) return false;
    /* jangan boros saat modal / sub-halaman menutupi peta */
    var m=document.getElementById("modal");
    if(m && m.classList.contains("show")) return false;
    var mp=document.getElementById("mpage");
    if(mp && mp.classList.contains("show")) return false;
    return true;
  }
  var watch=0;
  function loop(t){
    raf=0;
    if(!visible()){
      /* Jangan mati total. Dulu gelung ini cuma `return` ketika ada modal
         di atas peta — begitu modalnya ditutup tidak ada satu pun yang
         menyalakannya lagi, jadi peta membeku permanen sampai tab
         Peta di-render ulang. Sekarang ia menunggu pelan (4/detik,
         praktis nol biaya) lalu melanjutkan sendiri. */
      lastT=0; if(cleanupInput) cleanupInput.clear(); hud();
      if(!watch) watch=setTimeout(function(){ watch=0; if(canvas&&canvas.isConnected) start(); }, 260);
      return;
    }
    var dt = lastT ? Math.min(0.05, (t-lastT)/1000) : 0.016;
    lastT=t;
    try{ if(!S||S.city!==cityId()) reset(); step(dt); draw(); hud(); }
    catch(e){
      Mantara.errors.push({evt:"kotajalan:loop", msg:e.message, stack:e.stack});
      stop(); return;   /* satu modul rusak tidak boleh membakar baterai */
    }
    raf=requestAnimationFrame(loop);
  }
  function start(){ if(!raf){ lastT=0; raf=requestAnimationFrame(loop); } }
  function stop(){
    if(raf){ cancelAnimationFrame(raf); raf=0; }
    if(watch){ clearTimeout(watch); watch=0; }
    lastT=0;
  }

  /* ---------------- HUD tombol masuk ---------------- */
  function hud(){
    var el=document.getElementById("kjEnter"); if(!el) return;
    if(S && S.near){
      if(el.dataset.for!==S.near.id){
        el.dataset.for=S.near.id;
        el.innerHTML="<span class='kj-ico'>"+plainIco(S.near)+"</span><span><b>Masuk "+U.esc(plainText(S.near.name))+"</b>"
          +"<span class='kj-sub'>"+U.esc(plainText(S.near.desc))+"</span></span><span class='kj-go'>▸</span>";
      }
      el.classList.add("on");
    } else {
      el.classList.remove("on"); el.dataset.for="";
    }
  }

  window.kjEnterNow = function(){
    if(!S || !S.near) return;
    var b=S.near;
    if(cleanupInput) cleanupInput.clear();
    try{ if(typeof gotoSubloc==="function") gotoSubloc(b.id); }catch(e){}
    try{ if(typeof openSublocPage==="function") openSublocPage(b.id); }catch(e){}
  };

  /* ---------------- masukan ---------------- */
  function toWorld(ev){
    var r=canvas.getBoundingClientRect();
    var lx=ev.clientX-r.left, ly=ev.clientY-r.top;
    return {x: lx/ZOOM + S.cam.x, y: ly/ZOOM + S.cam.y, lx:lx, ly:ly};
  }
  function bindInput(){
    var stickId=null, tapStart=null;

    /* Dulu pointerdown di kuadran kiri-bawah LANGSUNG diklaim sebagai stik,
       jadi ketukan pada bangunan yang kebetulan ada di sana tidak pernah
       jadi ketukan — pemain menekan gedungnya dan seolah tak terjadi apa-apa.
       Sekarang tiap sentuhan mulai sebagai KANDIDAT KETUKAN; ia baru
       menjadi stik setelah jarinya benar-benar digeser >9px. */
    var STICK_ARM = 9;

    canvas.addEventListener("pointerdown", function(ev){
      if(!S||!visible()) return;
      if(tapStart||ev.button>0) return;
      canvas.focus({preventScroll:true});
      var p=toWorld(ev);
      var vw=canvas.clientWidth, vh=canvas.clientHeight;
      tapStart={x:p.lx, y:p.ly, t:performance.now(), wx:p.x, wy:p.y,
                id:ev.pointerId, zone:(p.lx < vw*0.5 && p.ly > vh*0.45)};
      try{ canvas.setPointerCapture(ev.pointerId); }catch(e){}
      ev.preventDefault();
    }, {passive:false});

    canvas.addEventListener("pointermove", function(ev){
      if(!S) return;
      var p=toWorld(ev);
      /* naikkan jadi stik begitu jarinya digeser cukup jauh di zona stik */
      if(!S.stick && tapStart && tapStart.id===ev.pointerId && tapStart.zone){
        if(Math.hypot(p.lx-tapStart.x, p.ly-tapStart.y) > STICK_ARM){
          stickId=ev.pointerId;
          S.stick={ox:tapStart.x, oy:tapStart.y, dx:0, dy:0};
          S.target=null;
        }
      }
      if(stickId===ev.pointerId && S.stick){
        var dx=p.lx-S.stick.ox, dy=p.ly-S.stick.oy;
        var m=Math.hypot(dx,dy)||1, k=Math.min(1, m/42);
        S.stick.dx=dx/m*k; S.stick.dy=dy/m*k;
        ev.preventDefault();
      }
    }, {passive:false});

    function release(ev){
      if(!S) return;
      if(stickId===ev.pointerId){ stickId=null; S.stick=null; tapStart=null; return; }
      if(tapStart && tapStart.id===ev.pointerId){
        var p=toWorld(ev);
        var moved=Math.hypot(p.lx-tapStart.x, p.ly-tapStart.y);
        var quick=performance.now()-tapStart.t < 700;
        if(moved<16 && quick){
          /* ketuk bangunan -> jalan ke pintunya; ketuk tanah -> jalan ke sana */
          var hit=null;
          for(var i=0;i<S.bl.length;i++){
            var b=S.bl[i];
            if(p.x>b.x && p.x<b.x+b.w && p.y>b.y && p.y<b.y+b.h){ hit=b; break; }
          }
          /* ketuk NPC yang punya relasi -> buka profilnya */
          if(!hit){
            for(var k=0;k<S.npc.length;k++){
              var n=S.npc[k];
              if(n.rel && Math.hypot(p.x-n.x, p.y-n.y)<22){
                try{ if(typeof openRelActionMenu==="function"){ tapStart=null; openRelActionMenu(n.rel.id); return; } }catch(e){}
              }
            }
          }
          if(hit){
            /* sudah berdiri di depannya -> ketukan kedua langsung masuk,
               tidak perlu menunggu jalan lagi */
            if(Math.hypot(S.px-hit.stand.x, S.py-hit.stand.y) < 44){
              tapStart=null; S.near=hit; kjEnterNow(); return;
            }
            navigate(hit.stand);
            S.ping={x:hit.stand.x, y:hit.stand.y, t:1};
            U.toast("Menuju "+plainText(hit.name)+"…");
          } else {
            navigate(p);
            S.ping={x:p.x, y:p.y, t:1};
          }
        }
        tapStart=null;
      }
    }
    canvas.addEventListener("pointerup", release);
    canvas.addEventListener("pointercancel", clearInput);
    canvas.addEventListener("lostpointercapture", function(){if(stickId!==null||tapStart)clearInput();});

    /* papan ketik, untuk yang mencoba di desktop */
    var keys={};
    function keyVec(){
      var dx=(keys.d||keys.ArrowRight?1:0)-(keys.a||keys.ArrowLeft?1:0);
      var dy=(keys.s||keys.ArrowDown?1:0)-(keys.w||keys.ArrowUp?1:0);
      if(!dx&&!dy) return null;
      var m=Math.hypot(dx,dy); return {dx:dx/m, dy:dy/m};
    }
    function sync(){
      var v=keyVec();
      if(v) S.stick={ox:60,oy:canvas.clientHeight-60,dx:v.dx,dy:v.dy,kb:true};
      else if(S.stick && S.stick.kb) S.stick=null;

    }
    function clearInput(){ keys={}; stickId=null; tapStart=null; if(S){S.stick=null;S.target=null;S.route=[];} }
    function keydown(e){
      if(!S||!visible()||document.activeElement!==canvas||e.ctrlKey||e.metaKey||e.altKey) return;
      var key=e.key.length===1?e.key.toLowerCase():e.key;
      if(key==="Enter"||key===" "){if(S.near){e.preventDefault();kjEnterNow();}return;}
      if(!/^(w|a|s|d|ArrowUp|ArrowDown|ArrowLeft|ArrowRight)$/.test(key))return;
      e.preventDefault(); keys[key]=1; sync();
    }
    function keyup(e){var key=e.key.length===1?e.key.toLowerCase():e.key;delete keys[key];if(S)sync();}
    window.addEventListener("keydown",keydown);
    window.addEventListener("keyup",keyup);
    window.addEventListener("blur",clearInput);
    canvas.addEventListener("blur",clearInput);
    cleanupInput=function(){window.removeEventListener("keydown",keydown);window.removeEventListener("keyup",keyup);window.removeEventListener("blur",clearInput);clearInput();};
    cleanupInput.clear=clearInput;
  }

  /* ---------------- pemasangan ke tab Peta ---------------- */
  function panelHTML(){
    var city=cityObj(); if(!city) return "";
    return ""
      + "<div class='sechead'>🏙️ Jalanan " + U.esc(plainText(city.name)) + "</div>"
      + "<div class='kj-toolbar'><span>JELAJAH KOTA</span><label>Tujuan <select id='kjDestination' onchange='kjNavigate(this.value)'><option value=''>Pilih lokasi…</option>"
      + city.sublocs.map(function(b){return "<option value='"+U.esc(b.id)+"'>"+U.esc(plainText(b.name))+"</option>";}).join("") + "</select></label></div>"
      + "<div class='kj-wrap'>"
      +   "<canvas id='kjCanvas' tabindex='0' aria-describedby='kjHelp' class='kj-canvas' aria-label='Peta kota yang bisa dijalani'></canvas>"

      +   "<button type='button' id='kjEnter' class='kj-enter' onclick='kjEnterNow()'></button>"
      + "</div><p id='kjHelp' class='kj-help'>Ketuk lokasi untuk berjalan · Seret kiri bawah untuk kendali bebas.<br>Keyboard: fokuskan peta, lalu WASD / panah · Enter untuk masuk.</p>";
  }

  function mount(){
    var host=document.getElementById("viewPeta");
    if(!host || !U.alive()) { stop(); return; }
    if(host.querySelector(".kj-wrap")) { /* sudah ada */ }
    else host.insertAdjacentHTML("afterbegin", panelHTML());

    var cv=document.getElementById("kjCanvas");
    if(!cv) { stop(); return; }
    var fresh = (cv!==canvas);
    if(fresh){stop();if(cleanupInput)cleanupInput();}
    canvas=cv; ctx=canvas.getContext("2d");
    if(fresh) bindInput();
    if(!S || S.city!==cityId()) reset();
    start();
  }

  M.on("boot", function(){
    if(document.getElementById("kjStyle")) return;
    var st=document.createElement("style"); st.id="kjStyle";
    st.textContent =
      ".kj-toolbar{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 6px;color:var(--gold);font-size:10px;letter-spacing:.08em}"
     +".kj-toolbar label{display:flex;align-items:center;gap:8px;min-width:0}.kj-toolbar select{min-height:44px;max-width:190px;width:100%;background:#211b29;color:#f3e6cb;border:1px solid #66516d;border-radius:10px;padding:8px;font:inherit;font-size:12px}"
     +".kj-help{font-size:11px;line-height:1.7;color:#b9acbd;padding:0 8px 12px;margin:0}.kj-canvas:focus-visible{outline:3px solid #c8a1ef;outline-offset:-3px}"
     +"@media(prefers-reduced-motion:reduce){.kj-enter{transition:none!important;transform:none!important}}"
     +
      ".kj-wrap{position:relative;margin:0 4px 14px;border-radius:14px;overflow:hidden;"
     +"border:1px solid var(--line);background:#15110c;box-shadow:inset 0 0 30px rgba(0,0,0,.5)}"
     +".kj-canvas{display:block;width:100%;height:clamp(320px,58vh,560px);touch-action:none;cursor:grab}"
     +".kj-enter{position:absolute;left:10px;right:10px;bottom:10px;display:flex;align-items:center;gap:9px;"
     +"min-height:52px;padding:9px 12px;border-radius:13px;border:1px solid var(--gold);"
     +"background:linear-gradient(160deg,rgba(60,45,20,.96),rgba(28,21,13,.96));color:var(--parchment);"
     +"font-family:inherit;text-align:left;cursor:pointer;opacity:0;visibility:hidden;transform:translateY(10px);"
     +"transition:opacity .18s,transform .18s,visibility .18s;box-shadow:0 8px 22px rgba(0,0,0,.5)}"
     +".kj-enter.on{opacity:1;visibility:visible;transform:translateY(0)}"
     +".kj-enter .kj-ico{font-size:21px;flex:0 0 auto}"
     +".kj-enter b{display:block;font-size:13px;color:var(--gold-bright)}"
     +".kj-enter .kj-sub{display:block;font-size:9.5px;color:var(--ink-soft);filter:brightness(1.7);"
     +"margin-top:2px;line-height:1.35}"
     +".kj-enter .kj-go{margin-left:auto;font-size:17px;color:var(--gold)}"
     +"@media (max-height:700px){.kj-canvas{height:310px}}";
    document.head.appendChild(st);
  });

  /* renderPeta dibungkus DI SINI (satu titik sadap, aturan 44-bus-hooks) */
  M.on("boot", function(){
    if(typeof renderPeta!=="function") return;
    var _rp = renderPeta;
    window.renderPeta = renderPeta = function(){
      var r=_rp.apply(this, arguments);
      try{ mount(); }catch(e){ Mantara.errors.push({evt:"kotajalan:mount", msg:e.message}); }
      return r;
    };
  }, -80);

  /* tata letak ikut berubah saat pindah kota / ganti karakter */
  M.on("year:end",  function(){ if(S && S.city!==cityId()) S=null; });
  M.on("char:born", function(){ S=null; avatarImg=null; avatarKey=""; });
  M.on("char:died", function(){ stop(); if(cleanupInput)cleanupInput.clear(); S=null; });
  M.on("save:read", function(){ S=null; avatarImg=null; avatarKey=""; if(canvas&&canvas.isConnected)start(); });

  /* hemat baterai */
  document.addEventListener("visibilitychange", function(){ if(document.hidden){stop();if(cleanupInput)cleanupInput.clear();} else if(canvas) start(); });

  return {mount:mount, stop:stop, state:function(){ return S; }, reset:function(){ S=null; }};
});
