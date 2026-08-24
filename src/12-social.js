// ============================================================
//  TAKDIR — CONVERSATION + PROFIL KARAKTER DETAIL
// ============================================================

const NPC_JOBS=["Petani","Penjaga","Saudagar","Pandai Besi","Tabib","Bard","Penyihir","Ksatria","Pemburu","Nelayan","Penambang","Penjahit","Pengrajin","Pengembara"];
const NPC_ORIGINS=["Aetheria","Thornvale","Saltmoor","Frostspire","desa terpencil","negeri seberang"];
const WEALTH_TIERS=["miskin","pas-pasan","berkecukupan","kaya","sangat kaya"];

// lengkapi profil saat relasi dibuat (lazy: hanya kalau belum ada)
function ensureProfile(r){
  // Simpan selisih umur terhadap pemain agar umur NPC ikut bertambah tiap tahun.
  // Orang tua, saudara, anak, dan kenalan sebaya mendapat rentang yang berbeda.
  if(!Number.isFinite(r.ageOffset)){
    if(r.isChild)r.ageOffset=-(r.met||C.age);
    else if(r.kin==="Ibu"||r.kin==="Ayah")r.ageOffset=ri(24,38);
    else if(r.kin==="Kakak")r.ageOffset=ri(2,15);
    else if(r.kin==="Adik")r.ageOffset=-ri(1,8);
    else r.ageOffset=ri(-3,5);
  }
  const npcAge=Math.max(0,C.age+r.ageOffset);
  // Migrasi save lama yang sudah punya profil statis.
  if(r._profile){
    r._profile.age=npcAge;
    if(!r._profile.job||r._profile.job==="—")r._profile.job=npcAge<6?"Belum sekolah":npcAge<15?"Pelajar":npcAge<18?"Pelajar / magang":rand(NPC_JOBS);
    return r._profile;
  }
  const sibCount=ri(0,4);
  const sibs=[];for(let i=0;i<sibCount;i++)sibs.push(randName(chance(0.5)).split(" ")[0]);
  r._profile={
    age:npcAge,
    job:npcAge<6?"Belum sekolah":npcAge<15?"Pelajar":npcAge<18?"Pelajar / magang":rand(NPC_JOBS),
    origin:rand(NPC_ORIGINS),
    wealth:rand(WEALTH_TIERS),
    married:chance(0.4),
    children:chance(0.3)?ri(1,3):0,
    siblings:sibs,
    parents:[randName(false).split(" ")[0],randName(true).split(" ")[0]],
    ambition:rand(["jadi kaya raya","menemukan cinta sejati","membalas dendam","menjadi ksatria","menguasai sihir","hidup tenang","membuka usaha","menjelajah dunia"]),
    secret:rand(["pernah jadi pencuri","keturunan bangsawan tersembunyi","takut pada sihir","berhutang besar","mencintai diam-diam seseorang","menyimpan harta karun"]),
  };
  // tingkat keterbukaan info: 0=belum kenal dalam, naik tiap ngobrol
  if(r._known===undefined)r._known=0;
  return r._profile;
}

// Ringkasan profil yang konsisten untuk kartu, percakapan, dan halaman detail.
function relationAge(r){
  ensureProfile(r);
  return Math.max(0,Math.round(C.age+(Number.isFinite(r.ageOffset)?r.ageOffset:0)));
}
function relationJob(r){
  const p=ensureProfile(r), age=relationAge(r);
  if(age<6)return "Belum sekolah";
  if(age<15)return "Pelajar";
  if(age<18)return "Pelajar / magang";
  return p.job&&p.job!=="—"?p.job:"Belum bekerja";
}
function relationLifeStatus(r){
  const p=ensureProfile(r), age=relationAge(r);
  if(age<6)return "Kanak-kanak";
  if(age<13)return "Anak";
  if(age<18)return "Remaja";
  if(r._spouse)return "Menikah denganmu";
  if(r._engaged)return "Tunanganmu";
  return p.married?"Menikah":"Lajang";
}

// ---------- TOPIK PERCAKAPAN ----------
// tiap topik buka 1 level info; butuh bond minimal utk topik dalam
const CONVO_TOPICS=[
  {id:"basic",label:"Berkenalan",ico:"👋",minBond:0,reveal:p=>`${p.job==="—"?"keluargamu":"Ia bekerja sebagai "+p.job}, berasal dari ${p.origin}.`,bond:3},
  {id:"family",label:"Keluarga",ico:"👨‍👩‍👧",minBond:20,reveal:p=>`Orang tuanya ${p.parents.join(" & ")}. ${p.siblings.length?`Punya ${p.siblings.length} saudara: ${p.siblings.join(", ")}.`:"Anak tunggal."} ${p.married?`Sudah menikah${p.children?` & punya ${p.children} anak`:""}.`:"Belum menikah."}`,bond:5},
  {id:"wealth",label:"Kekayaan",ico:"💰",minBond:30,reveal:p=>`Secara ekonomi, ia tergolong ${p.wealth}.`,bond:4},
  {id:"ambition",label:"Ambisi",ico:"🎯",minBond:40,reveal:p=>`Cita-citanya: ${p.ambition}.`,bond:6},
  {id:"rumor",label:"Gosip & Rumor",ico:"👂",minBond:25,reveal:p=>`Terdengar kabar: ${rand(["ia sedang dilanda masalah","ia naksir seseorang","ia baru dapat warisan","ada yang mengincarnya"])}.`,bond:4},
  {id:"secret",label:"Rahasia",ico:"🤫",minBond:65,reveal:p=>`Setelah lama percaya, ia mengaku: ${p.secret}.`,bond:8},
];

// buka popup percakapan
function openConversation(relId){
  const r=C.relations.find(x=>x.id===relId);if(!r)return;
  const p=ensureProfile(r);
  const meter=r.role==="pengikut"?r.loyalty:r.bond;
  openChoice({ico:typeof npcAvatar==="function"?npcAvatar(r,relationAge(r),"npc-avatar--hero"):r.ico,prompt:`Ngobrol dengan <b>${r.name}</b><br><span style="font-size:11px;color:var(--ink-soft);filter:brightness(1.6)">${r.role} · ${r.trait} · ikatan ${Math.round(meter)}</span><br><span style="font-size:10.5px;color:var(--gold);filter:brightness(1.1)">Pilih topik (info terbuka makin sering ngobrol)</span>`,
    choices:CONVO_TOPICS.map(t=>{
      const locked=meter<t.minBond;
      return {label:`${t.ico} ${t.label}`,sub:locked?`🔒 butuh ikatan ${t.minBond}`:'',disabled:locked,
        run:()=>{
          const info=t.reveal(p);
          if(r.role==="pengikut")r.loyalty=clamp(r.loyalty+t.bond);else r.bond=clamp(r.bond+t.bond);
          r._known=(r._known||0)+1;
          applyStats({happy:+2});
          return{t:`💬 ${r.name}: "${info}"`,cls:"e-good"};
        }};
    })});
}

// ---------- PROFIL DETAIL (popup lihat profil lengkap) ----------
function openProfile(relId){
  const r=C.relations.find(x=>x.id===relId);if(!r)return;
  const p=ensureProfile(r);
  const known=r._known||0;
  // makin sering ngobrol, makin banyak baris terbuka
  const lines=[];
  lines.push(`<b>${r.name}</b> · ${r.female?"Perempuan":"Lelaki"}`);
  lines.push(`Status: ${r.role}${r.isChild?" (anak)":""} · sifat ${r.trait}`);
  lines.push(`Ikatan: ${Math.round(r.role==="pengikut"?r.loyalty:r.bond)} · kenal ${C.age-r.met} thn`);
  if(known>=1){lines.push(`Umur: ${relationAge(r)} · Pekerjaan: ${relationJob(r)}`);lines.push(`Asal: ${p.origin}`);}
  else lines.push(`<i style="color:var(--ink-soft)">Ngobrol lebih sering untuk tahu pekerjaan & asal...</i>`);
  if(known>=2){lines.push(`Kekayaan: ${p.wealth}`);lines.push(`Keluarga: ortu ${p.parents.join(" & ")}${p.siblings.length?`, saudara ${p.siblings.join(", ")}`:", anak tunggal"}`);}
  if(known>=3){lines.push(`Status nikah: ${p.married?`menikah${p.children?`, ${p.children} anak`:""}`:"lajang"}`);}
  if(known>=4){lines.push(`Ambisi: ${p.ambition}`);}
  if(known>=6){lines.push(`<span style="color:var(--arcane-glow)">Rahasia: ${p.secret}</span>`);}
  openChoice({ico:typeof npcAvatar==="function"?npcAvatar(r,relationAge(r),"npc-avatar--hero"):r.ico,prompt:`<div style="text-align:left;font-size:12.5px;line-height:1.7">${lines.join("<br>")}</div>`,
    choices:[
      {label:"💬 Ajak ngobrol",run:()=>{closeModal();setTimeout(()=>openConversation(relId),140);return null;}},
    ]});
}
