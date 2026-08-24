// ============================================================
//  MANTARA — SVG AVATAR BUILDER
//  Wajah berlapis tanpa emoji: gender, wajah, kulit, rambut,
//  mata, alis, kacamata, janggut, dan kumis.
// ============================================================
(function(){
  const FACE_SHAPES=[
    {key:"oval",label:"Oval"},{key:"round",label:"Bulat"},
    {key:"angular",label:"Tegas"},{key:"heart",label:"Hati"}
  ];
  const AVATAR_SKINS=[
    {key:"porcelain",label:"Porselen",color:"#f6d8c4"},
    {key:"light",label:"Terang",color:"#eec4a5"},
    {key:"medium-light",label:"Hangat",color:"#dca27d"},
    {key:"medium",label:"Sawo",color:"#bd7957"},
    {key:"tan",label:"Tan",color:"#a96243"},
    {key:"medium-dark",label:"Cokelat",color:"#824a35"},
    {key:"dark",label:"Gelap",color:"#603526"},
    {key:"deep",label:"Pekat",color:"#3d241d"}
  ];
  const HAIR_STYLES=[
    {key:"crop",label:"Pendek",gender:"both"},{key:"side",label:"Belah Samping",gender:"both"},
    {key:"quiff",label:"Jambul",gender:"male"},{key:"waves",label:"Bergelombang",gender:"both"},
    {key:"curls",label:"Keriting",gender:"both"},{key:"long",label:"Panjang",gender:"both"},
    {key:"undercut",label:"Undercut",gender:"male"},{key:"slickback",label:"Sisir Belakang",gender:"male"},
    {key:"buzz",label:"Cepak",gender:"male"},{key:"bald",label:"Botak",gender:"male"},
    {key:"bob",label:"Bob",gender:"female"},{key:"ponytail",label:"Kuncir",gender:"female"},
    {key:"bun",label:"Sanggul",gender:"female"},{key:"braids",label:"Kepang",gender:"female"},
    {key:"pixie",label:"Pixie",gender:"female"}
  ];
  const HAIR_COLORS=[
    {key:"raven",label:"Hitam",color:"#17141b"},
    {key:"espresso",label:"Espresso",color:"#332018"},
    {key:"brown",label:"Cokelat",color:"#5a3626"},
    {key:"chestnut",label:"Chestnut",color:"#7a4028"},
    {key:"auburn",label:"Auburn",color:"#873a26"},
    {key:"copper",label:"Tembaga",color:"#b65c2f"},
    {key:"blonde",label:"Pirang",color:"#d9b866"},
    {key:"ash",label:"Abu Pirang",color:"#a69a86"},
    {key:"silver",label:"Perak",color:"#d5d1ca"},
    {key:"midnight",label:"Biru Malam",color:"#222841"}
  ];
  const EYE_SHAPES=[
    {key:"almond",label:"Almond"},{key:"round",label:"Bulat"},
    {key:"narrow",label:"Tajam"},{key:"wide",label:"Lebar"},
    {key:"hooded",label:"Teduh"}
  ];
  const EYE_COLORS=[
    {key:"brown",label:"Cokelat",color:"#5c3425"},
    {key:"amber",label:"Amber",color:"#b97822"},
    {key:"hazel",label:"Hazel",color:"#7d7136"},
    {key:"green",label:"Hijau",color:"#4f7654"},
    {key:"blue",label:"Biru",color:"#527fa5"},
    {key:"gray",label:"Abu",color:"#7d8892"},
    {key:"violet",label:"Violet",color:"#725987"}
  ];
  const BROW_STYLES=[
    {key:"natural",label:"Natural"},{key:"straight",label:"Lurus"},
    {key:"arched",label:"Melengkung"},{key:"bold",label:"Tebal"},
    {key:"soft",label:"Lembut"}
  ];
  const BEARD_STYLES=[
    {key:"none",label:"Tanpa Janggut"},{key:"stubble",label:"Tipis"},
    {key:"short",label:"Pendek"},{key:"full",label:"Penuh"},
    {key:"goatee",label:"Goatee"}
  ];
  const MUSTACHE_STYLES=[
    {key:"none",label:"Tanpa Kumis"},{key:"pencil",label:"Garis"},
    {key:"classic",label:"Klasik"},{key:"handlebar",label:"Melintir"}
  ];
  const GLASSES_STYLES=[
    {key:"none",label:"Tanpa Kacamata"},{key:"round",label:"Bulat Klasik"},
    {key:"square",label:"Kotak Tipis"},{key:"half",label:"Setengah Bingkai"},
    {key:"cat",label:"Cat Eye"},{key:"aviator",label:"Aviator"},
    {key:"monocle",label:"Monokel"},{key:"arcane",label:"Lensa Arcane"}
  ];
  const AVATAR_FOLDERS=[
    {key:"identity",label:"Identitas",desc:"Atur nama dan jenis kelamin karakter."},
    {key:"face",label:"Wajah",desc:"Bentuk wajah, kulit, mata, alis, dan kacamata."},
    {key:"hair",label:"Rambut",desc:"Gaya, warna, serta rambut wajah lelaki."},
    {key:"skills",label:"Keahlian",desc:"Bagikan poin kemampuan awal."},
    {key:"city",label:"Kota",desc:"Pilih kota tempat kisahmu dimulai."}
  ];

  const oldHair={none:"crop",curly:"curls",straight:"long",white:"side",bald:"bald"};
  function has(list,key){return list.some(x=>x.key===key);}
  function pick(list,key){return list.find(x=>x.key===key)||list[0];}
  function hairStylesFor(female){
    const gender=female?"female":"male";
    return HAIR_STYLES.filter(style=>style.gender==="both"||style.gender===gender).map(style=>style.key==="long"?{...style,label:female?"Panjang":"Gondrong"}:style);
  }
  function normalizeAppearance(ap,female){
    ap=ap||{};
    ap.female=typeof female==="boolean"?female:!!ap.female;
    if(!has(AVATAR_SKINS,ap.skin))ap.skin="medium";
    ap.hair=oldHair[ap.hair]||ap.hair||(ap.female?"long":"crop");
    if(!has(hairStylesFor(ap.female),ap.hair))ap.hair=ap.female?"long":"crop";
    if(!has(HAIR_COLORS,ap.hairColor))ap.hairColor=ap.hair==="white"?"silver":"raven";
    if(!has(FACE_SHAPES,ap.faceShape))ap.faceShape="oval";
    if(!has(EYE_SHAPES,ap.eyeShape))ap.eyeShape="almond";
    if(!has(EYE_COLORS,ap.eyeColor))ap.eyeColor="brown";
    if(!has(BROW_STYLES,ap.brows))ap.brows="natural";
    if(!has(GLASSES_STYLES,ap.glasses))ap.glasses="none";
    if(!has(BEARD_STYLES,ap.beard))ap.beard="none";
    if(!has(MUSTACHE_STYLES,ap.mustache))ap.mustache="none";
    if(ap.female){ap.beard="none";ap.mustache="none";}
    return ap;
  }

  function facePath(shape,female){
    const femalePaths={
      oval:"M60 19C78 19 88 34 87 58C85 82 74 100 60 104C46 100 35 82 33 58C32 34 42 19 60 19Z",
      round:"M60 20C81 20 90 37 88 61C85 85 74 99 60 101C46 99 35 85 32 61C30 37 39 20 60 20Z",
      angular:"M60 17L76 22C86 31 90 45 86 66L76 91L60 105L44 91L34 66C30 45 34 31 44 22Z",
      heart:"M60 21C75 13 89 26 87 49C85 74 72 99 60 106C48 99 35 74 33 49C31 26 45 13 60 21Z"
    };
    const malePaths={
      oval:"M60 16C83 16 94 33 92 58L88 78Q84 96 60 105Q36 96 32 78L28 58C26 33 37 16 60 16Z",
      round:"M60 17C86 17 95 36 92 62Q89 91 74 101L60 106L46 101Q31 91 28 62C25 36 34 17 60 17Z",
      angular:"M60 14L82 20Q95 35 91 61L85 82L72 102L60 108L48 102L35 82L29 61Q25 35 38 20Z",
      heart:"M60 18C79 11 95 26 92 50L86 78Q78 99 60 107Q42 99 34 78L28 50C25 26 41 11 60 18Z"
    };
    const paths=female?femalePaths:malePaths;
    return paths[shape]||paths.oval;
  }
  function shadeColor(hex,amount){
    const value=parseInt(hex.slice(1),16);
    const channel=shift=>Math.max(0,Math.min(255,((value>>shift)&255)+amount));
    return `#${[channel(16),channel(8),channel(0)].map(v=>v.toString(16).padStart(2,"0")).join("")}`;
  }
  function hairBack(style,color,female){
    const dark=shadeColor(color,-28),light=shadeColor(color,28),gold="#c99a32";
    if(style==="long")return female
      ?`<path d="M25 55C21 28 37 8 60 8s39 20 35 47l5 60H20Z" fill="${dark}"/><path d="M29 52C27 27 41 12 60 11s33 16 31 42l3 58-15-5-19 6-19-6-15 5Z" fill="${color}"/><path d="M31 58q-2 30 8 47M89 58q2 30-8 47" fill="none" stroke="${light}" stroke-width="3" opacity=".34" stroke-linecap="round"/>`
      :`<path d="M27 55C24 29 38 10 60 10s36 19 33 45l2 49-17 5-18-6-18 6-17-5Z" fill="${dark}"/><path d="M31 52C29 31 41 15 60 14s31 16 29 38l1 47-13 4-17-6-17 6-13-4Z" fill="${color}"/>`;
    if(style==="bob")return `<path d="M26 51C23 27 39 9 60 9s37 18 34 42l2 37q-11 10-25 4l-11-7-11 7q-14 6-25-4Z" fill="${dark}"/><path d="M30 49C28 29 41 13 60 12s32 17 30 38l1 34q-10 7-21 2l-10-6-10 6q-11 5-21-2Z" fill="${color}"/><path d="M32 54q-1 17 6 29M88 54q1 17-6 29" fill="none" stroke="${light}" stroke-width="2.5" opacity=".34"/>`;
    if(style==="ponytail")return `<path d="M31 51C28 27 41 10 61 10s33 16 31 39l-7 19H36Z" fill="${dark}"/><path d="M87 32c22 4 23 31 5 59 2-23-7-34-16-43Z" fill="${dark}"/><path d="M89 38c13 8 10 26 4 39-1-14-7-23-13-29Z" fill="${color}"/><circle cx="84" cy="40" r="4" fill="${gold}"/><circle cx="84" cy="40" r="2" fill="#f2cd65"/>`;
    if(style==="bun")return `<circle cx="60" cy="13" r="14" fill="${dark}"/><circle cx="60" cy="13" r="11" fill="${color}"/><path d="M50 14q10-8 20 0q-10 7-20 0Z" fill="${light}" opacity=".3"/><path d="M31 53C27 28 40 11 60 11s33 17 29 42l-6 17H37Z" fill="${dark}"/><path d="M47 18 75 8" stroke="${gold}" stroke-width="2.2" stroke-linecap="round"/><circle cx="76" cy="8" r="2.5" fill="#f2cd65"/>`;
    if(style==="braids")return `<path d="M29 53C25 27 39 9 60 9s35 18 31 44l-7 16H36Z" fill="${dark}"/><path d="M31 57C23 70 25 86 33 96c4 5 3 11-1 16M89 57c8 13 6 29-2 39-4 5-3 11 1 16" fill="none" stroke="${dark}" stroke-width="11" stroke-linecap="round"/><path d="M31 58c-6 13-4 25 3 35s3 15-1 19M89 58c6 13 4 25-3 35s-3 15 1 19" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round" stroke-dasharray="8 4"/><path d="M28 103h10M82 103h10" stroke="${gold}" stroke-width="4" stroke-linecap="round"/>`;
    if(style==="curls")return `<path d="M27 55C22 33 35 12 58 10c25-2 40 18 35 45l-6 14H33Z" fill="${dark}"/>`;
    if(style==="waves")return `<path d="M28 54C24 29 38 10 60 10s37 18 32 44l-6 18H34Z" fill="${dark}"/>`;
    return "";
  }
  function hairFront(style,color,female){
    const dark=shadeColor(color,-30),light=shadeColor(color,38),gold="#d2a53d";
    const shine=d=>`<path d="${d}" fill="none" stroke="${light}" stroke-width="2.4" stroke-linecap="round" opacity=".48"/>`;
    if(style==="buzz")return `<path d="M28 46C28 25 41 12 60 12C79 12 92 25 92 46C82 40 72 37 60 37C48 37 38 40 28 46Z" fill="${dark}"/><path d="M32 41C34 25 44 17 60 17C76 17 86 25 88 41C79 37 70 34 60 34C50 34 41 37 32 41Z" fill="${color}" opacity=".82"/><path d="M38 31Q49 20 62 21M67 22q9 3 14 11" fill="none" stroke="${light}" stroke-width="1.6" opacity=".45" stroke-linecap="round"/>`;
    if(style==="undercut")return `<path d="M27 50C27 28 40 12 61 13C81 14 92 29 92 49L85 55V39C75 34 67 31 59 31C49 35 40 42 34 51L27 50Z" fill="${dark}"/><path d="M32 37C37 18 54 10 72 15C84 18 89 28 88 38C77 31 68 27 58 25C49 31 41 35 32 37Z" fill="${color}"/>${shine("M43 27Q57 17 73 22M37 34q12-8 25-8")}<path d="M29 46v12M88 42v14" stroke="${dark}" stroke-width="4.5" stroke-linecap="round"/>`;
    if(style==="slickback")return `<path d="M28 49C27 26 41 10 61 11C82 12 93 28 91 49C80 43 70 38 59 35C49 37 39 42 28 49Z" fill="${dark}"/><path d="M32 44C33 27 45 15 61 15C77 16 87 27 88 43C78 38 69 34 59 31C50 34 41 38 32 44Z" fill="${color}"/>${shine("M39 36Q48 21 60 18M51 34Q61 20 71 22M64 34Q72 24 80 29")}<path d="M29 45v13M90 45v13" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>`;
    if(style==="bald")return `<path d="M40 32Q60 17 80 32" fill="none" stroke="#fff" opacity=".1" stroke-width="2.2" stroke-linecap="round"/>`;
    if(style==="crop")return female
      ?`<path d="M31 48C29 28 42 13 61 14C79 14 89 27 90 45C80 39 71 34 62 31C53 40 43 45 31 48Z" fill="${dark}"/><path d="M34 45C34 27 45 17 61 17C75 17 84 27 87 40c-10-5-17-9-25-11-8 8-17 13-28 16Z" fill="${color}"/>${shine("M43 31Q52 21 64 21M69 23q8 4 12 11")}`
      :`<path d="M28 48C27 28 39 13 60 13C81 13 92 28 92 47C81 41 72 37 62 36C51 34 40 40 28 48Z" fill="${dark}"/><path d="M31 44C32 28 42 18 60 17C77 17 86 27 89 42c-10-6-19-9-28-9-11 0-20 5-30 11Z" fill="${color}"/>${shine("M40 34Q51 23 64 22M69 23q8 4 12 11")}<path d="M29 45v13M91 45v13" stroke="${dark}" stroke-width="4" stroke-linecap="round"/>`;
    if(style==="side")return female
      ?`<path d="M29 50C27 25 42 10 62 12C81 13 91 27 90 48c-9-10-18-16-28-21-5 11-14 20-30 27Z" fill="${dark}"/><path d="M34 45C34 26 46 15 62 15C77 16 85 26 87 41c-8-7-16-12-25-16-6 9-14 16-28 20Z" fill="${color}"/><path d="M61 16C54 28 45 37 33 44" fill="none" stroke="${light}" stroke-width="3" opacity=".5"/>`
      :`<path d="M28 49C27 26 41 11 62 13C82 14 92 29 91 48c-11-9-21-14-32-18-7 9-16 15-31 19Z" fill="${dark}"/><path d="M32 45C33 28 44 17 62 17C77 18 86 27 88 42c-10-6-19-10-29-13-7 8-15 13-27 16Z" fill="${color}"/>${shine("M61 18Q47 23 37 36")}<path d="M29 45v14" stroke="${dark}" stroke-width="5" stroke-linecap="round"/>`;
    if(style==="quiff")return female
      ?`<path d="M29 50C27 31 35 20 47 17C48 4 66 3 74 14C85 15 93 29 90 48c-12-10-25-14-39-10-8 2-15 7-22 12Z" fill="${dark}"/><path d="M34 43C35 28 43 21 53 20C54 10 67 9 72 18C80 20 85 28 87 40c-13-8-25-9-36-5-7 2-12 5-17 8Z" fill="${color}"/>${shine("M46 27Q57 15 70 21M41 35q13-8 28-4")}`
      :`<path d="M28 50C27 31 35 21 46 18C43 8 53 2 63 9C72 1 84 9 80 19C88 23 93 33 91 48c-13-10-27-13-42-9-7 2-14 6-21 11Z" fill="${dark}"/><path d="M33 44C34 30 41 24 51 22C50 13 58 9 65 15C72 9 79 16 76 23C82 26 86 32 87 41c-13-7-25-8-37-5-6 1-11 4-17 8Z" fill="${color}"/>${shine("M45 28Q57 17 70 22M40 36q13-7 28-5")}`;
    if(style==="waves")return `<path d="M27 51C24 33 31 20 43 16C48 6 61 8 66 15C75 8 88 18 87 29C94 35 93 44 90 50c-8-5-13-14-21-12-8 1-9 10-18 8-8-2-9-11-16-7-4 2-5 8-8 12Z" fill="${dark}"/><path d="M32 45C30 32 37 22 47 20C52 12 61 14 65 21c8-8 18 1 17 10 7 4 7 10 7 13-8-3-13-10-20-8-7 1-9 9-17 7-7-2-8-9-14-6-3 2-4 6-5 9Z" fill="${color}" transform="translate(0 -2)"/>${shine("M40 28q8-8 16 0t16 0M35 38q7-7 14 0t15 0 14 0")}`;
    if(style==="curls"){
      const curls=[[31,47,7],[31,36,8],[37,26,8],[47,19,8],[58,18,8],[69,19,8],[79,25,8],[87,35,8],[89,47,7],[39,42,7],[50,33,8],[61,31,8],[73,35,8]];
      return `<g fill="${dark}">${curls.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="${p[2]+2}"/>`).join("")}</g><g fill="${color}">${curls.map(p=>`<circle cx="${p[0]}" cy="${p[1]-1}" r="${p[2]}"/>`).join("")}</g><g fill="none" stroke="${light}" stroke-width="1.8" opacity=".5">${[[37,25],[58,17],[79,24],[49,32],[72,34]].map(p=>`<path d="M${p[0]-3} ${p[1]}q3-4 6 0"/>`).join("")}</g>`;
    }
    if(style==="long")return female
      ?`<path d="M29 49C27 26 41 10 60 11C80 11 92 27 90 49c-11-7-20-15-30-24-8 11-17 19-31 24Z" fill="${dark}"/><path d="M33 44C33 27 44 15 60 15C76 15 86 26 87 42c-10-7-18-13-27-21-7 9-15 16-27 23Z" fill="${color}"/><path d="M59 15Q49 29 33 44M61 15Q72 28 87 42" fill="none" stroke="${light}" stroke-width="2.5" opacity=".44"/><path d="M31 43Q27 68 36 92M89 43Q93 68 84 92" fill="none" stroke="${color}" stroke-width="7" stroke-linecap="round"/>`
      :`<path d="M27 50C25 27 39 10 60 10C81 10 95 28 92 51c-12-8-23-16-34-24-7 11-17 18-31 23Z" fill="${dark}"/><path d="M32 44C33 27 43 15 60 14C77 15 87 27 88 43c-10-6-20-13-30-20-7 9-15 16-26 21Z" fill="${color}"/>${shine("M57 16Q45 27 35 39M64 17q10 7 17 18")}<path d="M30 45Q27 66 34 86M90 45Q93 67 85 87" fill="none" stroke="${color}" stroke-width="6" stroke-linecap="round"/>`;
    if(style==="bob")return `<path d="M28 50C26 26 41 10 60 11C80 11 92 27 90 50c-11-8-20-16-30-25-8 11-17 19-32 25Z" fill="${dark}"/><path d="M33 44C33 27 44 15 60 15C76 15 86 27 87 43c-10-7-18-14-27-22-7 10-15 17-27 23Z" fill="${color}"/>${shine("M59 16Q48 29 35 40M64 17q11 8 18 19")}<path d="M31 45q-2 20 6 35M89 45q2 20-6 35" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round"/>`;
    if(style==="ponytail")return `<path d="M30 49C28 27 42 11 61 12C80 13 91 27 89 47c-11-6-20-14-29-23-8 11-17 19-30 25Z" fill="${dark}"/><path d="M34 44C34 28 45 16 61 16C76 17 85 27 86 41c-10-6-17-12-26-20-7 10-14 16-26 23Z" fill="${color}"/>${shine("M59 17Q48 27 37 39M66 18q9 7 15 17")}<path d="M84 38h8" stroke="${gold}" stroke-width="3" stroke-linecap="round"/>`;
    if(style==="bun")return `<path d="M30 49C28 27 42 11 60 11C79 11 91 27 89 48c-10-7-19-15-29-24-8 11-17 19-30 25Z" fill="${dark}"/><path d="M34 44C34 28 45 16 60 16C75 16 85 27 86 41c-9-7-17-13-26-21-7 10-15 17-26 24Z" fill="${color}"/>${shine("M59 17Q48 28 37 39M65 18q9 7 15 17")}`;
    if(style==="braids")return `<path d="M29 50C27 26 41 10 60 11C80 11 92 27 90 50c-11-8-20-16-30-25-8 11-17 19-31 25Z" fill="${dark}"/><path d="M34 44C34 27 45 15 60 15C76 15 86 27 87 43c-10-7-18-14-27-22-7 10-15 17-26 23Z" fill="${color}"/><path d="M59 16Q49 29 36 40M61 16Q72 29 84 40" fill="none" stroke="${light}" stroke-width="2.4" opacity=".45"/>`;
    if(style==="pixie")return female
      ?`<path d="M29 49C29 27 42 12 61 14C79 15 89 28 90 45l-11-8-2 10-10-14-6 12-8-14-9 13-7-8-8 13Z" fill="${dark}"/><path d="M33 43C35 28 45 18 61 18C74 19 82 27 86 38l-9-6-2 8-9-11-6 10-7-10-8 10-5-6-7 10Z" fill="${color}"/>${shine("M43 29q10-8 20-6M66 24q8 3 12 9")}`
      :`<path d="M28 49C28 28 41 12 61 14C80 15 91 29 91 46l-12-8-4 10-9-15-7 12-8-14-9 13-6-8-8 13Z" fill="${dark}"/><path d="M32 43C34 29 45 18 61 18C76 19 85 28 88 40l-10-7-3 8-9-12-7 10-8-11-8 10-5-6-6 11Z" fill="${color}"/>${shine("M42 29q10-8 22-6M68 24q8 4 12 10")}`;
    return "";
  }
  function eyes(shape,color,baby,female){
    const y=58, scale=baby?1.18:1;
    function one(x){
      if(shape==="round")return `<ellipse cx="${x}" cy="${y}" rx="${6*scale}" ry="${5*scale}" fill="#f8eee2"/><circle cx="${x}" cy="${y}" r="${3*scale}" fill="${color}"/><circle cx="${x}" cy="${y}" r="${1.25*scale}" fill="#171218"/><circle cx="${x-1}" cy="${y-1}" r=".7" fill="#fff"/>`;
      if(shape==="wide")return `<path d="M${x-8} ${y}Q${x} ${y-7} ${x+8} ${y}Q${x} ${y+6} ${x-8} ${y}Z" fill="#f8eee2"/><circle cx="${x}" cy="${y}" r="3.4" fill="${color}"/><circle cx="${x}" cy="${y}" r="1.3" fill="#171218"/>`;
      if(shape==="narrow")return `<path d="M${x-7} ${y}Q${x} ${y-4} ${x+7} ${y}Q${x} ${y+3} ${x-7} ${y}Z" fill="#f8eee2"/><circle cx="${x}" cy="${y}" r="2.6" fill="${color}"/><circle cx="${x}" cy="${y}" r="1.1" fill="#171218"/>`;
      const hood=shape==="hooded"?`<path d="M${x-8} ${y-2}Q${x} ${y-8} ${x+8} ${y-2}" fill="none" stroke="#5d382d" opacity=".5" stroke-width="2"/>`:"";
      return `<path d="M${x-7} ${y}Q${x} ${y-6} ${x+7} ${y}Q${x} ${y+5} ${x-7} ${y}Z" fill="#f8eee2"/><circle cx="${x}" cy="${y}" r="3" fill="${color}"/><circle cx="${x}" cy="${y}" r="1.2" fill="#171218"/><circle cx="${x-1}" cy="${y-1}" r=".65" fill="#fff"/>${hood}`;
    }
    const lashes=female&&!baby?`<path d="M38 55l-3-2m4 1-1-3M82 55l3-2m-4 1 1-3" fill="none" stroke="#21171c" stroke-width="1.5" stroke-linecap="round"/>`:"";
    return `<g>${one(45)}${one(75)}${lashes}</g>`;
  }
  function brows(style,color,female){
    let d1="M38 48Q45 44 52 48",d2="M68 48Q75 44 82 48",w=2.4,op=1;
    if(style==="straight"){d1="M38 47L52 47";d2="M68 47L82 47";}
    if(style==="arched"){d1="M38 49Q45 41 52 47";d2="M68 47Q75 41 82 49";}
    if(style==="bold")w=4;
    if(style==="soft"){w=2;op=.55;}
    if(!female)w+=.8;
    return `<path d="${d1} ${d2}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" opacity="${op}"/>`;
  }
  function beard(style,color){
    if(style==="stubble")return `<path d="M40 76Q46 98 60 101Q74 98 80 76" fill="none" stroke="${color}" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 5" opacity=".65"/>`;
    if(style==="short")return `<path d="M35 72Q39 94 60 103Q81 94 85 72L78 87Q60 98 42 87Z" fill="${color}" opacity=".72"/>`;
    if(style==="full")return `<path d="M34 68Q34 94 45 106L60 116 75 106Q86 94 86 68L78 87 60 101 42 87Z" fill="${color}"/><path d="M47 81Q60 88 73 81" fill="none" stroke="#fff" opacity=".1" stroke-width="2"/>`;
    if(style==="goatee")return `<path d="M52 82Q60 87 68 82L66 103 60 110 54 103Z" fill="${color}"/>`;
    return "";
  }
  function mustache(style,color){
    if(style==="pencil")return `<path d="M47 77Q54 73 60 77Q66 73 73 77" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round"/>`;
    if(style==="classic")return `<path d="M60 77Q52 70 44 78Q53 83 60 78Q67 83 76 78Q68 70 60 77Z" fill="${color}"/>`;
    if(style==="handlebar")return `<path d="M60 77Q51 69 43 77Q37 82 34 76M60 77Q69 69 77 77Q83 82 86 76" fill="none" stroke="${color}" stroke-width="4" stroke-linecap="round"/>`;
    return "";
  }
  function glasses(style){
    if(!style||style==="none")return "";
    const frame="#d3a83e",dark="#30262a",lens="rgba(154,191,214,.12)";
    const arms=`<path d="M36 55 29 52M84 55l7-3" fill="none" stroke="${dark}" stroke-width="2.4" stroke-linecap="round"/>`;
    if(style==="round")return `<g>${arms}<circle cx="45" cy="58" r="8" fill="${lens}" stroke="${frame}" stroke-width="2.2"/><circle cx="75" cy="58" r="8" fill="${lens}" stroke="${frame}" stroke-width="2.2"/><path d="M53 57q7-4 14 0" fill="none" stroke="${frame}" stroke-width="2"/></g>`;
    if(style==="square")return `<g>${arms}<rect x="36" y="50" width="18" height="16" rx="3" fill="${lens}" stroke="${dark}" stroke-width="2.2"/><rect x="66" y="50" width="18" height="16" rx="3" fill="${lens}" stroke="${dark}" stroke-width="2.2"/><path d="M54 56h12" stroke="${dark}" stroke-width="2.2"/></g>`;
    if(style==="half")return `<g>${arms}<path d="M36 58V53Q45 48 54 53M66 53Q75 48 84 53M54 54q6-3 12 0" fill="none" stroke="${frame}" stroke-width="2.5" stroke-linecap="round"/><path d="M37 58q8 7 16 0M67 58q8 7 16 0" fill="none" stroke="${dark}" stroke-width="1" opacity=".62"/></g>`;
    if(style==="cat")return `<g>${arms}<path d="M35 51 55 54 52 65Q42 68 37 60ZM85 51 65 54 68 65Q78 68 83 60Z" fill="${lens}" stroke="${frame}" stroke-width="2" stroke-linejoin="round"/><path d="M54 56h12" stroke="${frame}" stroke-width="2"/></g>`;
    if(style==="aviator")return `<g>${arms}<path d="M35 51Q45 47 55 52L52 65Q45 71 38 64Z" fill="${lens}" stroke="${dark}" stroke-width="2"/><path d="M85 51Q75 47 65 52L68 65Q75 71 82 64Z" fill="${lens}" stroke="${dark}" stroke-width="2"/><path d="M54 54q6-3 12 0" fill="none" stroke="${dark}" stroke-width="2"/></g>`;
    if(style==="monocle")return `<g><circle cx="75" cy="58" r="9" fill="${lens}" stroke="${frame}" stroke-width="2.4"/><path d="M84 64q4 10 0 21q-2 6 3 11" fill="none" stroke="${frame}" stroke-width="1.5" stroke-dasharray="2 2"/><circle cx="87" cy="97" r="2" fill="none" stroke="${frame}" stroke-width="1.3"/></g>`;
    if(style==="arcane")return `<g filter="drop-shadow(0 0 2px #8f75ce)">${arms}<path d="m45 48 10 6-3 11H39l-4-11Z" fill="rgba(143,117,206,.18)" stroke="#a98cff" stroke-width="2"/><path d="m75 48 10 6-4 11H68l-3-11Z" fill="rgba(143,117,206,.18)" stroke="#a98cff" stroke-width="2"/><path d="M54 55h12M45 51v13M75 51v13" fill="none" stroke="${frame}" stroke-width="1.4"/></g>`;
    return "";
  }
  function deadAvatar(){
    return `<svg class="avatar-svg" viewBox="0 0 120 120" role="img" aria-label="Karakter telah wafat"><circle cx="60" cy="60" r="56" fill="#17131d" stroke="#75627f" stroke-width="2"/><path d="M31 55c0-22 12-37 29-37s29 15 29 37c0 15-7 23-15 28v17H46V83c-8-5-15-13-15-28Z" fill="#d9d0bd"/><circle cx="47" cy="57" r="9" fill="#211b25"/><circle cx="73" cy="57" r="9" fill="#211b25"/><path d="m60 65-5 10h10Z" fill="#211b25"/><path d="M48 87h24M54 82v18M66 82v18" stroke="#211b25" stroke-width="4"/></svg>`;
  }
  function juvenileAvatarSVG(ap,age,isMage){
    const skin=pick(AVATAR_SKINS,ap.skin).color;
    const hair=pick(HAIR_COLORS,ap.hairColor).color;
    const hairDark=shadeColor(hair,-28);
    const eye=pick(EYE_COLORS,ap.eyeColor).color;
    const female=ap.female;
    const stage=age<2?"Bayi":age<6?"Balita":age<13?"Anak":age<18?"Remaja":"Dewasa muda";
    const frame=`<circle cx="60" cy="60" r="57" fill="#17131d"/><circle cx="60" cy="60" r="54" fill="#2a2019" stroke="${isMage&&age>=16?'#8f75ce':'#a87922'}" stroke-width="2"/>`;
    const rune=isMage&&age>=16?`<g fill="none" stroke="#a98cff" stroke-width="1.4" opacity=".72"><path d="M60 4l4 7-4 7-4-7Z"/><path d="M10 60l7-4 7 4-7 4Z"/><path d="M110 60l-7-4-7 4 7 4Z"/></g>`:"";
    const shine=`<circle cx="60" cy="60" r="56" fill="none" stroke="#f0bd3b" stroke-width="1" opacity=".18"/>`;
    const wrap=body=>`<svg class="avatar-svg avatar-stage-${stage.toLowerCase().replace(/\s/g,"-")}" viewBox="0 0 120 120" role="img" aria-label="Avatar ${female?'perempuan':'lelaki'}, tahap ${stage}"><title>${stage}, usia ${age}</title>${frame}${rune}${body}${shine}</svg>`;

    if(age<2){
      const babyHair=female
        ?`<path d="M45 27q8-12 17-2 8-9 15 2-10 1-17 10-6-8-15-10Z" fill="${hairDark}"/><path d="M72 27q9 4 8 12" fill="none" stroke="${hair}" stroke-width="4" stroke-linecap="round"/>`
        :`<path d="M47 26q7-13 14 0 8-11 14 1-10-2-16 9-4-8-12-10Z" fill="${hair}"/>`;
      return wrap(`<path d="M35 119Q39 91 60 89Q81 91 85 119Z" fill="${female?'#665078':'#465a73'}"/><circle cx="31" cy="57" r="6" fill="${skin}"/><circle cx="89" cy="57" r="6" fill="${skin}"/><ellipse cx="60" cy="57" rx="31" ry="35" fill="${skin}" stroke="#75483a" stroke-width="1.2"/>${babyHair}<path d="M39 49q6-3 12 0M69 49q6-3 12 0" fill="none" stroke="${hair}" stroke-width="1.6" stroke-linecap="round"/>${eyes("round",eye,true,female)}<path d="M59 62q-2 6 2 7" fill="none" stroke="#8a5140" stroke-width="1.1" stroke-linecap="round"/><path d="M54 77q6 5 12 0" fill="none" stroke="#a95761" stroke-width="1.8" stroke-linecap="round"/><circle cx="43" cy="70" r="5" fill="#d8807f" opacity=".13"/><circle cx="77" cy="70" r="5" fill="#d8807f" opacity=".13"/>`);
    }

    if(age<6){
      const toddlerHair=female
        ?`<path d="M31 49C30 28 42 17 60 17s30 11 29 31c-10-5-19-12-28-21-7 10-16 17-30 22Z" fill="${hairDark}"/><circle cx="87" cy="37" r="7" fill="${hair}"/><circle cx="89" cy="36" r="2" fill="#e8b83d"/>`
        :`<path d="M31 47C31 28 42 18 60 18s29 10 29 28c-10-5-20-8-29-8s-19 3-29 9Z" fill="${hairDark}"/><path d="M40 33q10-10 24-9M67 24q8 2 13 9" fill="none" stroke="${hair}" stroke-width="3" stroke-linecap="round"/>`;
      return wrap(`<path d="M29 119Q34 94 52 90L60 96L68 90Q86 94 91 119Z" fill="${female?'#624a75':'#435772'}"/><rect x="53" y="82" width="14" height="17" rx="6" fill="${skin}"/><circle cx="31" cy="58" r="6" fill="${skin}"/><circle cx="89" cy="58" r="6" fill="${skin}"/><path d="M60 20C80 20 89 35 87 60C84 83 73 95 60 98C47 95 36 83 33 60C31 35 40 20 60 20Z" fill="${skin}" stroke="#75483a" stroke-width="1.2"/>${toddlerHair}${brows("soft",hair,female)}${eyes(ap.eyeShape,eye,true,female)}<path d="M59 62q-2 7 2 9" fill="none" stroke="#8a5140" stroke-width="1.1"/><path d="M52 81q8 5 16 0" fill="none" stroke="#99515b" stroke-width="1.7" stroke-linecap="round"/>`);
    }

    const child=age<13, teen=age<18;
    const scale=child ? 0.90 : (teen ? 0.95 : 0.98);
    const tx=(60-60*scale).toFixed(1), ty=child?"5":teen?"2":"1";
    const hairTransform=`translate(${tx} ${ty}) scale(${scale})`;
    const faceShape=child?(female?"round":"oval"):ap.faceShape;
    const faceTransform=hairTransform;
    const shoulders=child
      ?`<path d="M25 119Q31 99 50 94L60 100L70 94Q89 99 95 119Z" fill="${female?'#5d4770':'#40536d'}"/><path d="M50 94Q60 104 70 94" fill="none" stroke="${female?'#987bac':'#71819b'}" stroke-width="1.7"/>`
      :teen
        ?`<path d="M22 119Q29 96 49 92L60 99L71 92Q91 96 98 119Z" fill="${female?'#5a436b':'#3d5069'}"/><path d="M49 92L60 99L71 92" fill="none" stroke="${female?'#9b79aa':'#71819b'}" stroke-width="1.8"/>`
        :`<path d="M20 119Q27 95 48 91L60 99L72 91Q93 95 100 119Z" fill="${female?'#58406a':'#3c4d66'}"/><path d="M48 91L60 99L72 91" fill="none" stroke="${female?'#9b79aa':'#71819b'}" stroke-width="2"/>`;
    const neck=child?`<rect x="53" y="82" width="14" height="20" rx="6" fill="${skin}"/>`:`<rect x="${female?52:49}" y="82" width="${female?16:22}" height="24" rx="7" fill="${skin}"/>`;
    const ears=child?`<circle cx="33" cy="59" r="6" fill="${skin}"/><circle cx="87" cy="59" r="6" fill="${skin}"/>`:`<circle cx="${female?33:30}" cy="59" r="${female?7:8}" fill="${skin}"/><circle cx="${female?87:90}" cy="59" r="${female?7:8}" fill="${skin}"/>`;
    const nose=child?`<path d="M59 59q-2 9 2 12" fill="none" stroke="#8a5140" stroke-width="1.2" stroke-linecap="round"/>`:`<path d="M59 57q-3 11 1 16l4 1" fill="none" stroke="#804a3b" stroke-width="1.55" stroke-linecap="round"/>`;
    const mouth=female?`<path d="M51 83Q60 88 69 83" fill="none" stroke="#a95761" stroke-width="1.8" stroke-linecap="round"/>`:`<path d="M51 84Q60 88 69 84" fill="none" stroke="#87444c" stroke-width="1.9" stroke-linecap="round"/>`;
    const facial=!teen&&!child&&age>=20&&ap.beard==="stubble"?beard("stubble",hair):"";
    return wrap(`<g transform="${hairTransform}">${hairBack(ap.hair,hair,female)}</g>${shoulders}${neck}${ears}<path d="${facePath(faceShape,female)}" transform="${faceTransform}" fill="${skin}" stroke="#6b4033" stroke-width="${female?'1.2':'1.55'}"/><g transform="${hairTransform}">${hairFront(ap.hair,hair,female)}</g>${brows(ap.brows,hair,female)}${eyes(ap.eyeShape,eye,false,female)}${glasses(ap.glasses)}${nose}${mouth}${facial}`);
  }
  function avatarSVG(ap,age,isMage,alive){
    if(alive===false)return deadAvatar();
    ap=normalizeAppearance(ap);
    age=Number.isFinite(age)?age:24;
    if(age<24)return juvenileAvatarSVG(ap,Math.max(0,age),isMage);
    const baby=age<3, child=age<13;
    const skin=pick(AVATAR_SKINS,ap.skin).color;
    let hair=pick(HAIR_COLORS,ap.hairColor).color;
    const eye=pick(EYE_COLORS,ap.eyeColor).color;
    const shape=baby?"round":ap.faceShape;
    const facial=ap.female||child?"none":ap.beard;
    const moustache=ap.female||child?"none":ap.mustache;
    const old=age>=55;
    const rune=isMage&&age>=16?`<g fill="none" stroke="#a98cff" stroke-width="1.5" opacity=".8"><path d="M60 4l4 7-4 7-4-7Z"/><path d="M10 60l7-4 7 4-7 4Z"/><path d="M110 60l-7-4-7 4 7 4Z"/></g>`:"";
    const wrinkles=old?`<g fill="none" stroke="#6b4033" stroke-width="1" opacity=".45"><path d="M37 67q8 3 16 0M67 67q8 3 16 0M51 88q9 4 18 0"/></g>`:"";
    const shoulders=ap.female
      ?`<path d="M28 117Q34 97 51 93L60 100L69 93Q86 97 92 117Z" fill="#58406a"/><path d="M51 93Q60 104 69 93" fill="none" stroke="#9b79aa" stroke-width="2"/>`
      :`<path d="M19 117Q27 94 48 91L60 99L72 91Q93 94 101 117Z" fill="#3c4d66"/><path d="M48 91L60 99L72 91" fill="none" stroke="#71819b" stroke-width="2"/>`;
    const neck=ap.female?`<rect x="52" y="83" width="16" height="24" rx="7" fill="${skin}"/>`:`<rect x="47" y="81" width="26" height="28" rx="7" fill="${skin}"/>`;
    const ears=ap.female?`<circle cx="33" cy="59" r="7" fill="${skin}"/><circle cx="87" cy="59" r="7" fill="${skin}"/>`:`<circle cx="28" cy="59" r="9" fill="${skin}"/><circle cx="92" cy="59" r="9" fill="${skin}"/>`;
    const nose=ap.female
      ?`<path d="M60 59q-2 9 1 13l3 1" fill="none" stroke="#8a5140" stroke-width="1.35" stroke-linecap="round"/>`
      :`<path d="M59 56q-4 12 1 17l6 1M54 75q6 3 12 0" fill="none" stroke="#7b4638" stroke-width="1.8" stroke-linecap="round"/>`;
    const mouth=ap.female
      ?`<path d="M50 82Q60 88 70 82Q60 91 50 82Z" fill="#a95761" opacity=".88"/><path d="M52 83Q60 86 68 83" fill="none" stroke="#f0a2a3" stroke-width=".8"/>`
      :`<path d="M50 84Q60 88 70 84" fill="none" stroke="#87444c" stroke-width="2" stroke-linecap="round"/>`;
    const genderDetails=ap.female
      ?`<ellipse cx="40" cy="72" rx="7" ry="3" fill="#d8807f" opacity=".16"/><ellipse cx="80" cy="72" rx="7" ry="3" fill="#d8807f" opacity=".16"/>`
      :`<path d="M34 72Q38 92 48 99M86 72Q82 92 72 99" fill="none" stroke="#713f34" stroke-width="1.4" opacity=".4"/>`;
    return `<svg class="avatar-svg" viewBox="0 0 120 120" role="img" aria-label="Avatar ${ap.female?'perempuan':'lelaki'}">
      <circle cx="60" cy="60" r="57" fill="#17131d"/><circle cx="60" cy="60" r="54" fill="#2a2019" stroke="${isMage?'#8f75ce':'#a87922'}" stroke-width="2"/>
      ${rune}${hairBack(ap.hair,hair,ap.female)}
      ${shoulders}${neck}${ears}
      <path d="${facePath(shape,ap.female)}" fill="${skin}" stroke="#6b4033" stroke-width="${ap.female?'1.25':'1.8'}"/>
      ${genderDetails}${hairFront(ap.hair,hair,ap.female)}${brows(ap.brows,hair,ap.female)}${eyes(ap.eyeShape,eye,baby,ap.female)}${glasses(ap.glasses)}
      ${nose}${mouth}${wrinkles}${beard(facial,hair)}${mustache(moustache,hair)}
      <circle cx="60" cy="60" r="56" fill="none" stroke="#f0bd3b" stroke-width="1" opacity=".18"/>
    </svg>`;
  }

  let activeAvatarFolder="identity";
  const originalInitDraft=initDraft;
  initDraft=function(originId){
    originalInitDraft(originId);
    activeAvatarFolder="identity";
    draft.appearance=normalizeAppearance(draft.appearance,draft.female);
  };
  buildAvatar=function(ap,age,isMage,alive){return avatarSVG(normalizeAppearance(ap),age,isMage,alive);};
  previewAvatar=function(ap){return avatarSVG(normalizeAppearance(ap),24,false,true);};
  portraitEmoji=function(){
    C.appearance=normalizeAppearance(C.appearance,C.female);
    return avatarSVG(C.appearance,C.age,C.isMage,C.alive);
  };

  function visualChoices(label,key,options){
    const current=draft.appearance[key];
    return `<div class="cust-field avatar-field"><label>${label}</label><div class="avatar-options">${options.map(o=>{
      const sample={...draft.appearance,[key]:o.key,female:draft.female};
      return `<button type="button" class="avatar-choice ${current===o.key?'sel':''}" onclick="setAvatarOption('${key}','${o.key}')" aria-label="${label}: ${o.label}"><span class="avatar-choice-art">${avatarSVG(sample,24,false,true)}</span><span>${o.label}</span></button>`;
    }).join("")}</div></div>`;
  }
  function colorChoices(label,key,options){
    const current=draft.appearance[key];
    return `<div class="cust-field avatar-field"><label>${label}</label><div class="avatar-colors">${options.map(o=>`<button type="button" class="avatar-color ${current===o.key?'sel':''}" onclick="setAvatarOption('${key}','${o.key}')" aria-label="${label}: ${o.label}"><i style="--swatch:${o.color}"></i><span>${o.label}</span></button>`).join("")}</div></div>`;
  }
  function findField(text){
    return Array.from(document.querySelectorAll("#customizeScreen .cust-field")).find(el=>{
      const lab=el.querySelector(":scope > label");
      return lab&&lab.textContent.includes(text);
    });
  }
  function folderIcon(key){
    const paths={
      identity:`<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-5 3.1-7.5 7-7.5s6.2 2.5 7 7.5M4 4h3M17 4h3"/>`,
      face:`<path d="M12 3c5 0 8 3.7 8 8.5S16.8 21 12 21s-8-4.7-8-9.5S7 3 12 3Z"/><circle cx="9" cy="11" r=".8" fill="currentColor"/><circle cx="15" cy="11" r=".8" fill="currentColor"/><path d="M9 16q3 2 6 0"/>`,
      hair:`<path d="M4 14C2 6 7 2 12 2c6 0 9 4 8 12-2-4-5-6-8-8-2 4-5 6-8 8Z"/><path d="M5 13v7M19 13v7"/>`,
      skills:`<path d="m12 3 2.2 5.2L20 9l-4.2 3.8L17 19l-5-3-5 3 1.2-6.2L4 9l5.8-.8Z"/><path d="M12 7v5l3 2"/>`,
      city:`<path d="M3 21V9l5-3v15M8 21V4l5 3v14M13 21V8l8 3v10M1 21h22"/><path d="M5 12h1M10 10h1M16 13h2M16 17h2"/>`
    };
    return `<svg viewBox="0 0 24 24" aria-hidden="true">${paths[key]}</svg>`;
  }
  function mountCustomizerFolders(wrap){
    const groups={
      identity:["Nama","Jenis Kelamin"],
      face:["Warna Kulit","Bentuk Wajah","Bentuk Mata","Warna Mata","Bentuk Alis","Kacamata"],
      hair:["Gaya Rambut","Warna Rambut","Janggut","Kumis"],
      skills:["Alokasi Keahlian"],
      city:["Kota Awal"]
    };
    const shell=document.createElement("section");
    shell.className="avatar-folder-shell";
    shell.innerHTML=`<div class="avatar-folder-tabs" role="tablist" aria-label="Kelompok kustomisasi">${AVATAR_FOLDERS.map(folder=>`<button type="button" class="avatar-folder-tab" data-folder-tab="${folder.key}" role="tab" onclick="setAvatarFolder('${folder.key}')">${folderIcon(folder.key)}<span>${folder.label}</span></button>`).join("")}</div>
      <div class="avatar-folder-heading"><strong></strong><span></span></div>
      <div class="avatar-folder-panels">${AVATAR_FOLDERS.map(folder=>`<div class="avatar-folder-panel" data-folder-panel="${folder.key}" role="tabpanel"></div>`).join("")}</div>`;
    const avatarBox=wrap.querySelector(".cust-avatar");
    if(!avatarBox)return;
    avatarBox.insertAdjacentElement("afterend",shell);
    Object.entries(groups).forEach(([key,labels])=>{
      const panel=shell.querySelector(`[data-folder-panel="${key}"]`);
      labels.forEach(label=>{
        const field=findField(label);
        if(field)panel.appendChild(field);
      });
    });
    setAvatarFolder(activeAvatarFolder);
  }
  function mountAvatarBuilder(){
    if(!draft||!draft.appearance)return;
    draft.appearance=normalizeAppearance(draft.appearance,draft.female);
    const wrap=document.querySelector("#customizeScreen .cust-wrap");
    if(!wrap)return;
    const face=wrap.querySelector(".cust-face");
    if(face)face.innerHTML=previewAvatar(draft.appearance);
    const avatarBox=wrap.querySelector(".cust-avatar");
    if(avatarBox&&!avatarBox.querySelector(".avatar-random"))avatarBox.insertAdjacentHTML("beforeend",`<button type="button" class="avatar-random" onclick="randomizeAvatar()"><span class="avatar-random-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M20 7v5h-5M4 17v-5h5M6.2 8.5A7 7 0 0 1 18.5 7M17.8 15.5A7 7 0 0 1 5.5 17"/></svg></span> Acak Penampilan</button>`);

    const backButton=wrap.querySelector(".mc-cancel");
    if(backButton)backButton.innerHTML=`<span class="avatar-inline-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="m10 7-5 5 5 5M5 12h9a5 5 0 0 1 5 5"/></svg></span> Ganti Asal-usul`;

    const genderField=findField("Jenis Kelamin");
    if(genderField){
      const buttons=genderField.querySelectorAll(".seg-btn");
      if(buttons[0])buttons[0].innerHTML=`<span class="gender-face">${avatarSVG({...draft.appearance,female:false,faceShape:"angular",hair:"crop",beard:"short",mustache:"none"},24,false,true)}</span><span>Lelaki</span>`;
      if(buttons[1])buttons[1].innerHTML=`<span class="gender-face">${avatarSVG({...draft.appearance,female:true,faceShape:"heart",hair:"long",beard:"none",mustache:"none"},24,false,true)}</span><span>Perempuan</span>`;
    }

    const skinField=findField("Warna Kulit");
    if(skinField)skinField.outerHTML=colorChoices("Warna Kulit","skin",AVATAR_SKINS);
    const skillField=findField("Alokasi Keahlian");
    if(!skillField)return;
    let html=visualChoices("Bentuk Wajah","faceShape",FACE_SHAPES)+
      visualChoices("Gaya Rambut","hair",hairStylesFor(draft.female))+
      colorChoices("Warna Rambut","hairColor",HAIR_COLORS)+
      visualChoices("Bentuk Mata","eyeShape",EYE_SHAPES)+
      colorChoices("Warna Mata","eyeColor",EYE_COLORS)+
      visualChoices("Bentuk Alis","brows",BROW_STYLES)+
      visualChoices("Kacamata","glasses",GLASSES_STYLES);
    if(!draft.female)html+=visualChoices("Janggut","beard",BEARD_STYLES)+visualChoices("Kumis","mustache",MUSTACHE_STYLES);
    skillField.insertAdjacentHTML("beforebegin",html);
    mountCustomizerFolders(wrap);
  }

  setAvatarFolder=function(key){
    if(!AVATAR_FOLDERS.some(folder=>folder.key===key))key="identity";
    activeAvatarFolder=key;
    const root=document.querySelector("#customizeScreen .avatar-folder-shell");
    if(!root)return;
    root.querySelectorAll("[data-folder-tab]").forEach(button=>{
      const selected=button.dataset.folderTab===key;
      button.classList.toggle("sel",selected);
      button.setAttribute("aria-selected",selected?"true":"false");
    });
    root.querySelectorAll("[data-folder-panel]").forEach(panel=>{panel.hidden=panel.dataset.folderPanel!==key;});
    const folder=AVATAR_FOLDERS.find(item=>item.key===key);
    const title=root.querySelector(".avatar-folder-heading strong");
    const desc=root.querySelector(".avatar-folder-heading span");
    if(title)title.textContent=folder.label;
    if(desc)desc.textContent=key==="hair"&&draft&&draft.female?"Gaya dan warna rambut karakter.":folder.desc;
  };

  const originalRenderCustomize=renderCustomize;
  renderCustomize=function(){
    if(draft&&draft.appearance)draft.appearance=normalizeAppearance(draft.appearance,draft.female);
    originalRenderCustomize();
    mountAvatarBuilder();
  };
  setAvatarOption=function(key,value){
    if(!draft||!draft.appearance)return;
    draft.appearance[key]=value;
    normalizeAppearance(draft.appearance,draft.female);
    renderCustomize();
  };
  setGender=function(female){
    draft.female=!!female;
    draft.appearance=normalizeAppearance(draft.appearance,draft.female);
    if(female){
      draft.appearance.beard="none";
      draft.appearance.mustache="none";
      if(draft.appearance.hair==="bald")draft.appearance.hair="bob";
    }
    draft.name=randName(draft.female);
    renderCustomize();
  };
  randomizeAvatar=function(){
    if(!draft||!draft.appearance)return;
    const choose=list=>list[Math.floor(Math.random()*list.length)].key;
    Object.assign(draft.appearance,{
      faceShape:choose(FACE_SHAPES),skin:choose(AVATAR_SKINS),hair:choose(hairStylesFor(draft.female)),
      hairColor:choose(HAIR_COLORS),eyeShape:choose(EYE_SHAPES),eyeColor:choose(EYE_COLORS),
      brows:choose(BROW_STYLES),glasses:choose(GLASSES_STYLES),beard:draft.female?"none":choose(BEARD_STYLES),
      mustache:draft.female?"none":choose(MUSTACHE_STYLES)
    });
    renderCustomize();
  };

  // ---------- AVATAR NPC ----------
  // Penampilan dibuat deterministik dari identitas, kemudian disimpan pada
  // objek NPC. Dengan begitu wajah tidak berubah saat halaman dibuka kembali
  // dan kombinasi yang sudah dipakai tidak diberikan ke NPC lain.
  const npcAvatarRegistry=new Map();
  function avatarHash(value){
    let h=2166136261;
    const text=String(value||"");
    for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}
    return h>>>0;
  }
  function npcIdentity(npc){
    if(npc.id)return String(npc.id);
    if(npc._avatarId)return String(npc._avatarId);
    const basis=[npc.name||"Tanpa Nama",npc.role||npc.kin||npc.job||npc.title||"npc",npc.female].join("|");
    npc._avatarId="npc-"+avatarHash(basis).toString(36);
    return npc._avatarId;
  }
  function npcFemale(npc,owner){
    if(typeof npc.female==="boolean")return npc.female;
    const first=String(npc.name||"").split(" ")[0];
    if(typeof FIRST_F!=="undefined"&&FIRST_F.includes(first))return true;
    if(typeof FIRST_M!=="undefined"&&FIRST_M.includes(first))return false;
    npc.female=avatarHash(owner+"|gender")%2===0;
    return npc.female;
  }
  function npcVisualSignature(ap){
    return [ap.female,ap.faceShape,ap.skin,ap.hair,ap.hairColor,ap.eyeShape,ap.eyeColor,ap.brows,ap.glasses,ap.beard,ap.mustache].join("|");
  }
  function generatedNpcAppearance(npc,age,owner,salt){
    const state={v:avatarHash(owner+"|"+(salt||0))||1};
    const next=list=>{state.v=(Math.imul(state.v,1664525)+1013904223)>>>0;return list[state.v%list.length].key;};
    const female=npcFemale(npc,owner);
    const mature=age>=20;
    const glassesRoll=(state.v>>>3)%100;
    const glassesPool=glassesRoll<48?GLASSES_STYLES.slice(1):[GLASSES_STYLES[0]];
    return normalizeAppearance({
      female,
      faceShape:next(FACE_SHAPES),skin:next(AVATAR_SKINS),hair:next(hairStylesFor(female)),
      hairColor:next(HAIR_COLORS),eyeShape:next(EYE_SHAPES),eyeColor:next(EYE_COLORS),
      brows:next(BROW_STYLES),glasses:next(glassesPool),
      beard:female||!mature?"none":next(BEARD_STYLES),
      mustache:female||!mature?"none":next(MUSTACHE_STYLES)
    },female);
  }
  function ensureNpcAppearance(npc,age){
    npc=npc||{};
    const owner=npcIdentity(npc);
    const resolvedAge=Number.isFinite(age)?age:(Number.isFinite(npc.age)?npc.age:(Number.isFinite(npc._avatarAge)?npc._avatarAge:28+avatarHash(owner+"|age")%34));
    if(!Number.isFinite(npc._avatarAge))npc._avatarAge=resolvedAge;
    let ap=npc.appearance?normalizeAppearance(npc.appearance,npcFemale(npc,owner)):null;
    let salt=0,signature=ap?npcVisualSignature(ap):"";
    while(!ap||(npcAvatarRegistry.has(signature)&&npcAvatarRegistry.get(signature)!==owner)){
      ap=generatedNpcAppearance(npc,resolvedAge,owner,salt++);
      signature=npcVisualSignature(ap);
    }
    npc.appearance=ap;
    npcAvatarRegistry.set(signature,owner);
    return ap;
  }
  function npcIsMage(npc){
    if(npc&&npc.isMage!==undefined)return !!npc.isMage;
    return /penyihir|sihir|mage|arcane|arcanum|magister|alkemis/i.test([npc&&npc.role,npc&&npc.job,npc&&npc.title,npc&&npc.background].join(" "));
  }
  window.npcAvatar=function(npc,age,options){
    npc=npc||{};
    const resolvedAge=Number.isFinite(age)?age:(Number.isFinite(npc.age)?npc.age:(Number.isFinite(npc._avatarAge)?npc._avatarAge:28));
    const extra=typeof options==="string"?options:(options&&options.className||"");
    return `<span class="npc-avatar ${extra}">${avatarSVG(ensureNpcAppearance(npc,resolvedAge),Math.max(0,resolvedAge),npcIsMage(npc),npc.alive!==false)}</span>`;
  };

  if(typeof M!=="undefined"&&M.on){
    M.on("save:read",()=>{if(C&&C.appearance)C.appearance=normalizeAppearance(C.appearance,C.female);});
    M.on("char:born",()=>{if(C)C.appearance=normalizeAppearance(C.appearance,C.female);});
  }
  window.MantaraAvatar={render:avatarSVG,normalize:normalizeAppearance,npc:window.npcAvatar,ensureNpcAppearance};

  const css=document.createElement("style");
  css.id="mantara-avatar-styles";
  css.textContent=`
    .avatar-svg{display:block;width:100%;height:100%;overflow:visible}
    .cust-avatar{flex-direction:column;align-items:center;gap:9px;margin:8px 0 18px}
    .cust-face{width:164px;height:164px;padding:5px;border-radius:38px;font-size:0;background:radial-gradient(circle at 50% 35%,#39291d,#120e13 72%);border-color:rgba(223,166,38,.58);box-shadow:0 8px 30px rgba(0,0,0,.5),0 0 22px rgba(190,132,21,.14)}
    .portrait{overflow:hidden;padding:2px;font-size:0}
    .portrait .avatar-svg{width:100%;height:100%}
    .npc-avatar{display:inline-block;width:46px;height:46px;flex:0 0 46px;font-size:0;vertical-align:middle;overflow:visible}
    .npc-avatar .avatar-svg{filter:drop-shadow(0 3px 5px rgba(0,0,0,.32))}
    .npc-avatar--hero{width:94px;height:94px;margin:0 auto 7px}
    .npc-avatar--inline{width:30px;height:30px;margin-right:5px}
    .npc-avatar--battle{width:72px;height:72px;margin:auto}
    .relav:has(.npc-avatar){width:54px;height:54px;padding:2px;font-size:0;border-radius:16px;background:radial-gradient(circle at 50% 35%,rgba(77,54,31,.9),rgba(20,15,18,.96));border:1px solid rgba(190,132,21,.4)}
    .relav .npc-avatar{width:50px;height:50px}
    .pg-ico:has(.npc-avatar){width:52px;min-width:52px;height:52px;font-size:0}
    .pg-ico .npc-avatar{width:50px;height:50px}
    .mico:has(.npc-avatar){width:86px;height:86px;font-size:0;margin-inline:auto}
    .mico .npc-avatar{width:82px;height:82px}
    .avatar-random{display:flex;align-items:center;gap:7px;padding:8px 13px;border-radius:999px;background:rgba(190,132,21,.09);border:1px solid rgba(223,166,38,.45);color:var(--gold-bright);font-family:inherit;font-size:11px;font-weight:700;letter-spacing:.04em;cursor:pointer}
    .avatar-random-mark,.avatar-inline-icon{display:inline-flex;width:18px;height:18px;align-items:center;justify-content:center}
    .avatar-random-mark svg,.avatar-inline-icon svg{width:100%;height:100%;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
    .seg-btn{display:flex;align-items:center;justify-content:center;gap:10px;min-height:72px}
    .gender-face{display:block;width:52px;height:52px;flex:0 0 52px}
    .avatar-folder-shell{margin:4px 0 16px}
    .avatar-folder-tabs{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;padding:7px;border:1px solid rgba(184,134,11,.32);border-radius:17px;background:linear-gradient(145deg,rgba(48,34,25,.82),rgba(24,18,24,.92));box-shadow:0 8px 22px rgba(0,0,0,.22)}
    .avatar-folder-tab{min-width:0;min-height:66px;padding:8px 3px 7px;border:1px solid transparent;border-radius:12px;background:transparent;color:var(--ink-soft);font-family:inherit;font-size:8.5px;font-weight:700;letter-spacing:.025em;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;transition:.15s ease}
    .avatar-folder-tab svg{width:23px;height:23px;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}
    .avatar-folder-tab:hover{color:var(--parchment);background:rgba(255,255,255,.035)}
    .avatar-folder-tab.sel{color:var(--gold-bright);border-color:rgba(223,166,38,.62);background:linear-gradient(160deg,rgba(128,88,19,.32),rgba(55,37,29,.88));box-shadow:0 0 13px rgba(190,132,21,.15)}
    .avatar-folder-heading{display:flex;align-items:baseline;gap:9px;padding:13px 4px 9px;border-bottom:1px solid rgba(184,134,11,.2)}
    .avatar-folder-heading strong{color:var(--gold-bright);font-size:13px;letter-spacing:.06em;text-transform:uppercase}
    .avatar-folder-heading span{color:var(--ink-soft);filter:brightness(1.55);font-size:9px;line-height:1.35}
    .avatar-folder-panels{margin-top:10px;padding:15px 14px 2px;border:1px solid rgba(184,134,11,.28);border-radius:16px;background:linear-gradient(150deg,rgba(48,35,25,.74),rgba(24,18,22,.88));box-shadow:inset 0 1px rgba(255,255,255,.025)}
    .avatar-folder-panel[hidden]{display:none!important}
    .avatar-folder-panel:not([hidden]){animation:avatarFolderIn .18s ease-out}
    .avatar-folder-panel .cust-field:last-child{margin-bottom:12px}
    @keyframes avatarFolderIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:none}}
    .avatar-options{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
    .avatar-choice{min-width:0;min-height:82px;padding:6px 4px 7px;border-radius:13px;background:linear-gradient(145deg,rgba(55,40,27,.95),rgba(30,23,25,.96));border:1px solid var(--line);color:var(--ink-soft);font-family:inherit;font-size:9px;font-weight:700;line-height:1.2;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;transition:.15s ease}
    .avatar-choice:hover{border-color:rgba(223,166,38,.65);color:var(--parchment)}
    .avatar-choice.sel{border-color:var(--gold);color:var(--gold-bright);background:linear-gradient(145deg,rgba(111,75,18,.35),rgba(42,29,24,.98));box-shadow:0 0 13px rgba(190,132,21,.2);transform:translateY(-1px)}
    .avatar-choice-art{display:block;width:54px;height:54px}
    .avatar-colors{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px}
    .avatar-color{min-width:0;padding:8px 3px 6px;border-radius:12px;background:var(--card);border:1px solid var(--line);color:var(--ink-soft);font-family:inherit;font-size:8px;font-weight:700;line-height:1.15;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:5px}
    .avatar-color i{display:block;width:29px;height:29px;border-radius:50%;background:var(--swatch);border:2px solid rgba(255,255,255,.22);box-shadow:inset 0 2px 5px rgba(255,255,255,.18),0 2px 5px rgba(0,0,0,.35)}
    .avatar-color.sel{border-color:var(--gold);color:var(--gold-bright);box-shadow:0 0 12px rgba(190,132,21,.2)}
    .avatar-color.sel i{outline:2px solid var(--gold);outline-offset:2px}
    @media(max-width:430px){.cust-face{width:146px;height:146px}.avatar-options{grid-template-columns:repeat(3,minmax(0,1fr))}.avatar-colors{grid-template-columns:repeat(4,minmax(0,1fr))}.avatar-folder-tabs{gap:3px;padding:5px}.avatar-folder-tab{font-size:7.5px;min-height:60px}.avatar-folder-tab svg{width:20px;height:20px}.avatar-folder-heading{align-items:flex-start;flex-direction:column;gap:3px}.avatar-folder-panels{padding:13px 10px 1px}}
  `;
  document.head.appendChild(css);
})();
