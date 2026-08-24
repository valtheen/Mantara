/* ==================================================================
   MANTARA — VISUAL UI: ilustrasi, ikon fungsi, dan grafik atribut
   ------------------------------------------------------------------
   Modul ini hanya memperkaya presentasi. Tidak mengubah mekanik, stat,
   ekonomi, ataupun isi save. Ikon dibuat sebagai SVG ringan agar tajam
   di semua ukuran; ilustrasi pembuka tetap berupa aset WebP terkompresi.
   ================================================================== */
(function(){
  "use strict";
  if(!window.Mantara) return;

  var M = window.Mantara;
  var U = M.u;
  var HERO_ASSET = "assets/art/mantara-realm-hero.webp";

  var ICONS = {
    life:'<path d="M5 4.5h5.2A3.8 3.8 0 0 1 14 8.3V20a3.8 3.8 0 0 0-3.8-3.8H5z"/><path d="M19 4.5h-5.2A3.8 3.8 0 0 0 10 8.3V20a3.8 3.8 0 0 1 3.8-3.8H19z"/>',
    action:'<path d="m13.2 2-7 11h5.4L10.8 22l7-11h-5.4z"/>',
    coin:'<circle cx="12" cy="12" r="8.2"/><path d="M14.8 8.7c-.7-.7-1.7-1.1-2.9-1.1-1.7 0-2.9.8-2.9 2s1 1.8 3 2.2 3 1.1 3 2.3-1.2 2.2-3 2.2c-1.3 0-2.5-.5-3.2-1.3M12 5.7v12.6"/>',
    wealth:'<path d="m7 4-4 5 9 11 9-11-4-5z"/><path d="m3 9 9 3 9-3M7 4l5 8 5-8"/>',
    reputation:'<path d="m12 3 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7L6.8 19l1-5.8-4.2-4.1 5.8-.8z"/>',
    property:'<path d="m3 11 9-7 9 7"/><path d="M5.5 9.5V20h13V9.5M9.5 20v-6h5v6"/>',
    business:'<path d="M4 9h16l-1.3-5H5.3zM5 9v11h14V9M8 20v-6h4v6M15 12h2"/><path d="M4 9c0 1.5 1.1 2.5 2.4 2.5S8.8 10.5 8.8 9c0 1.5 1.1 2.5 2.4 2.5s2.4-1 2.4-2.5c0 1.5 1.1 2.5 2.4 2.5s2.4-1 2.4-2.5"/>',
    career:'<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V4h6v3M3 12h18M10 11h4v3h-4z"/>',
    shop:'<circle cx="9" cy="20" r="1"/><circle cx="18" cy="20" r="1"/><path d="M3 4h2l2.4 10.5h10.8l2-7.2H6M8 17h10"/>',
    assets:'<path d="M4 20V9h4v3h3V7h3v5h3V9h3v11zM8 9V5h3v2M17 9V5h3v4M10 20v-4h4v4"/>',
    inventory:'<path d="M6 8h12l1.5 12h-15z"/><path d="M9 9V6a3 3 0 0 1 6 0v3M8 13h8"/>',
    pin:'<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/>',
    stats:'<path d="m12 2.5 8.2 4.8v9.4L12 21.5l-8.2-4.8V7.3z"/><path d="M12 6v6l4 2"/>'
  };

  Object.assign(ICONS,{
    rune:'<path d="m12 2.5 2.1 6.2 6.4 2.1-6.4 2.1-2.1 6.6-2.1-6.6-6.4-2.1 6.4-2.1z"/><circle cx="12" cy="10.8" r="1.6"/>',
    fire:'<path d="M13.2 2.5c.7 4.1-2.4 5.1-1.4 8.1 1.4-1 2.2-2.3 2.1-4 3.2 2.2 5 5 4.5 8.1-.5 3.8-3.5 6.4-7.1 6.1-3.7-.2-6.4-3-6.2-6.6.2-3.1 2.4-5.2 4.8-7.5-.2 2.2.6 3.6 1.5 4.2-.3-3.4 2.5-4.6 1.8-8.4z"/>',
    stone:'<path d="m5 19-1.5-7 5-7.5 6.5 1 5.5 7-3.2 7z"/><path d="m3.5 12 6.5 1 5-7.5M10 13l1 6.3"/>',
    lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    crown:'<path d="m3 7 4.5 3L12 4l4.5 6L21 7l-2 11H5z"/><path d="M5 18h14M8 14h8"/>',
    temple:'<path d="m3 9 9-5 9 5zM5 10h14M6 19h12M4 21h16M8 10v9M12 10v9M16 10v9"/>',
    balance:'<path d="M12 3v18M6 6h12M4 20h16M7 6 3.5 13h7zM17 6l-3.5 7h7z"/>',
    chart:'<path d="M4 20V5M4 20h17"/><path d="m6 16 4-5 3 2 6-8M16 5h3v3"/>',
    expedition:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.1 4.9-4.9 2.1 2.1-4.9zM12 2v2M12 20v2M2 12h2M20 12h2"/>',
    sound:'<path d="M4 10v4h4l5 4V6l-5 4zM16 9c1.5 1.7 1.5 4.3 0 6M18.5 6.5c3 3 3 8 0 11"/>',
    crystal:'<path d="m8 3-4 6 8 12 8-12-4-6zM4 9h16M8 3l4 6 4-6M12 9v12"/>',
    scroll:'<path d="M7 4h10a3 3 0 0 1 3 3v1h-4V7a3 3 0 0 0-3-3H7a3 3 0 0 0-3 3v13h9"/><path d="M7 8h7M7 12h7M7 16h5M16 20a3 3 0 0 0 3-3v-1h-6v1a3 3 0 0 0 3 3z"/>',
    sword:'<path d="m4 20 7-7M7.5 20 4 16.5M14 10l6-7 1 1-7 6-3 4zM12 12l3 3M16 16l4 4M20 16l-4 4"/>',
    shield:'<path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6z"/><path d="M12 7v9M8.5 11.5h7"/>',
    magic:'<circle cx="12" cy="13" r="6"/><path d="M12 2v3M4.2 5.2l2.1 2.1M19.8 5.2l-2.1 2.1M12 10v6M9 13h6"/>',
    heart:'<path d="M20.8 8.5c0 5.2-8.8 11-8.8 11s-8.8-5.8-8.8-11A4.6 4.6 0 0 1 12 6.4a4.6 4.6 0 0 1 8.8 2.1z"/>',
    gift:'<rect x="4" y="9" width="16" height="11" rx="1"/><path d="M12 9v11M3 9h18V6H3zM12 6c-1.5-4.3-6.5-3.5-5.4-.4C7.1 7 9.4 6 12 6zm0 0c1.5-4.3 6.5-3.5 5.4-.4C16.9 7 14.6 6 12 6z"/>',
    map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',
    mapNav:'<path d="m3 5.5 5-2.5 8 3 5-2.5v15L16 21l-8-3-5 2.5z"/><path d="M8 3v15M16 6v15"/><path d="m10.5 8.2 2.1-.8 1.7.7"/>',
    actionNav:'<polyline points="14.5 17.5 3 6 3 3 6 3 17.5 14.5"/><path d="m13 19 6-6M16 16l4 4M19 21l2-2"/><polyline points="14.5 6.5 18 3 21 3 21 6 17.5 9.5"/><path d="m5 14 4 4M7 17l-3 3M3 19l2 2"/>',
    school:'<path d="m3 9 9-5 9 5-9 5zM7 12v4c3 2 7 2 10 0v-4M21 9v7"/>',
    medal:'<circle cx="12" cy="14" r="5"/><path d="m8.5 10-3-7h5l1.5 5 1.5-5h5l-3 7M12 11.5l.8 1.6 1.7.3-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.3z"/>',
    dice:'<rect x="4" y="4" width="16" height="16" rx="3"/><circle cx="8" cy="8" r="1"/><circle cx="16" cy="8" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="8" cy="16" r="1"/><circle cx="16" cy="16" r="1"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/><path d="m14 10 7-7M17 3h4v4"/>',
    paw:'<path d="M7.5 13c-3 1.2-3.4 5.2-.5 6.3 2.2.8 3.2-1.2 5-1.2s2.8 2 5 1.2c2.9-1.1 2.5-5.1-.5-6.3-2.7-1.1-6.3-1.1-9 0z"/><circle cx="7" cy="8" r="2"/><circle cx="12" cy="6" r="2"/><circle cx="17" cy="8" r="2"/>',
    trophy:'<path d="M8 4h8v5c0 4-1.6 6-4 6s-4-2-4-6zM10 15v4M14 15v4M7 20h10M8 7H4v2c0 2 1 3 4 3M16 7h4v2c0 2-1 3-4 3"/>',
    book:'<path d="M4 5h6a3 3 0 0 1 3 3v12a3 3 0 0 0-3-3H4zM20 5h-6a3 3 0 0 0-3 3v12a3 3 0 0 1 3-3h6z"/>',
    snow:'<path d="M12 2v20M4 7l16 10M20 7 4 17M9 4l3 3 3-3M9 20l3-3 3 3"/>',
    alchemy:'<path d="M9 3h6M10 3v6l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3M7.5 16h9M9 13h6"/>',
    death:'<path d="M5 10a7 7 0 1 1 14 0c0 3-1.5 5-3 6v4H8v-4c-1.5-1-3-3-3-6z"/><circle cx="9" cy="10" r="1.5"/><circle cx="15" cy="10" r="1.5"/><path d="m12 13-1 2h2zM9 20v-3M12 20v-3M15 20v-3"/>',
    music:'<path d="M9 18V6l10-2v12M9 10l10-2"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/>',
    ship:'<path d="m4 14 16-3-3 8H7zM8 12V5h7v6M11 5V2l5 3M3 22c2-2 4 2 6 0s4 2 6 0 4 2 6 0"/>',
    tree:'<path d="M12 21v-7M9 21h6M12 3c-5 3-7 7-4 10 1.5 1.5 6.5 1.5 8 0 3-3 1-7-4-10z"/><path d="m12 14-3-4M12 13l3-4"/>',
    hammer:'<path d="m14 4 6 6M12 6l4-4 6 6-4 4zM14 10 5 21l-2-2 9-11"/>',
    health:'<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="9"/>',
    dialog:'<path d="M4 5h16v11H9l-5 4zM8 9h8M8 12h5"/>',
    warning:'<path d="m12 3 10 18H2zM12 9v5M12 17h.01"/>',
    door:'<path d="M5 21V3h13v18M5 21h16M9 7h5v10H9zM14 12h.01"/>',
    trash:'<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
    save:'<path d="M4 3h14l2 2v16H4zM8 3v6h8V3M8 21v-8h8v8"/>',
    monster:'<path d="M5 9 3 4l5 2c2-1 6-1 8 0l5-2-2 5v5c0 5-3 7-7 7s-7-2-7-7zM8 12l2 1M16 12l-2 1M9 17h6"/>',
    person:'<circle cx="12" cy="7" r="4"/><path d="M4 21c0-5 3-8 8-8s8 3 8 8"/>',
    child:'<circle cx="12" cy="8" r="3"/><path d="M6 21c0-4 2-7 6-7s6 3 6 7M9 5 7 3M15 5l2-2"/>',
    seed:'<path d="M12 21V10M12 14c-5 0-7-3-7-7 5 0 7 3 7 7zM12 11c0-5 3-7 7-7 0 5-3 7-7 7z"/>',
    water:'<path d="M12 3s6 7 6 12a6 6 0 0 1-12 0c0-5 6-12 6-12z"/>',
    moon:'<path d="M19 15.5A8 8 0 0 1 8.5 5 8.5 8.5 0 1 0 19 15.5z"/>',
    time:'<circle cx="12" cy="12" r="9"/><path d="M12 7v6l4 2"/>',
    power:'<path d="M12 2v9M6.5 5.5a8 8 0 1 0 11 0"/>',
    check:'<path d="m4 12 5 5L20 6"/>',
    close:'<path d="M5 5l14 14M19 5 5 19"/>',
    question:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.7 2.7 0 1 1 4.2 2.3c-1.1.7-1.7 1.2-1.7 2.7M12 17h.01"/>',
    clothingBody:'<path d="m8 4 4 2 4-2 5 4-3 4-2-1v10H8V11l-2 1-3-4z"/><path d="M8 15h8M12 6v15"/>',
    clothingLegs:'<path d="M7 3h10l-1 18h-4l-1-10-1 10H6z"/><path d="M7 8h10M12 3v8"/>',
    clothingFeet:'<path d="M5 4h7v10l7 2c2 .6 2 5-1 5H5z"/><path d="M5 15h12M9 8H5"/>',
    clothingHead:'<path d="M5 13c0-5 3-9 7-9s7 4 7 9v5H5z"/><path d="M3 18h18M8 13v-2a4 4 0 0 1 8 0v2"/>',
    food:'<path d="M7 3v8M4 3v5c0 2 1 3 3 3s3-1 3-3V3M7 11v10M16 3c-3 3-3 8 0 10v8M16 3c4 3 4 8 0 10"/>',
    walk:'<path d="M8.4 3.2c1.4.2 2.1 1.7 1.6 3.3L8.6 11c-.5 1.5-1.8 2.3-3 1.8-1.3-.5-1.7-2-.9-3.5l1.9-4.2c.5-1.2 1-2.1 1.8-1.9z"/><path d="M15.9 11c1.5-.1 2.4 1.2 2.2 2.9l-.5 4.6c-.2 1.6-1.4 2.7-2.7 2.5-1.4-.2-2.1-1.6-1.5-3.3l1.2-4.4c.3-1.3.6-2.2 1.3-2.3z"/><path d="M5.6 12.8c1.2.4 2.4.1 3-.8M14 19.5c1.1.5 2.4.1 3.2-.8"/>',
    fist:'<path d="M5.2 11.2V8.4a1.7 1.7 0 0 1 3.4 0v2.2-4.1a1.7 1.7 0 0 1 3.4 0v4-3a1.7 1.7 0 0 1 3.4 0v3.2-2a1.7 1.7 0 0 1 3.4 0v5.7c0 4.2-2.8 6.6-6.7 6.6h-.6c-2.6 0-4.1-1.4-5.5-3.5l-2.2-3.3a1.8 1.8 0 0 1 2.7-2.3l2 1.8"/><path d="M8.6 10.6v3M12 10.5v3.2M15.4 10.7v3"/>',
    mountMark:'<path d="M6 20v-7l2-5 5-4 5 2 2 5-3 1-2-2-1 3v7M6 14l5 1 3-2M8 8 5 5M13 4l1-2M9 20v-4M16 20v-5"/><circle cx="16.5" cy="7.5" r=".7"/>',
    schoolVillage:'<path d="m3 10 9-6 9 6M5 9v11h14V9M9 20v-6h6v6M8 11h.01M16 11h.01"/><path d="M3 20h18"/>',
    schoolArcane:'<path d="M7 21h10l-1-11-4-6-4 6zM9 12h6M12 4V2M10 7l-2-3M14 7l2-3"/><path d="m12 13 .8 1.7 1.7.3-1.2 1.2.3 1.8-1.6-.9-1.6.9.3-1.8-1.2-1.2 1.7-.3z"/>',
    schoolNoble:'<path d="M12 3 5 6v5c0 4.5 2.8 8.2 7 10 4.2-1.8 7-5.5 7-10V6z"/><path d="m7.5 9 2.4 1.5L12 7l2.1 3.5L16.5 9l-1 5h-7zM9 16h6"/>',
    schoolTrade:'<path d="M12 3v17M6 6h12M4 20h16M7 6 3.5 13h7zM17 6l-3.5 7h7z"/><circle cx="12" cy="5" r="2"/>',
    schoolRanger:'<path d="M5 20 18 7M13 5h6v6M4 16l4 4M7 13l4 4"/><path d="M4 7c3-4 7-4 10-2-1 4-4 7-9 7M6 11 3 8"/>',
    schoolLife:'<path d="M4 6h6a3 3 0 0 1 3 3v11a3 3 0 0 0-3-3H4zM20 6h-6a3 3 0 0 0-3 3v11a3 3 0 0 1 3-3h6z"/><circle cx="8" cy="10" r="1.5"/><path d="M5.5 15c.4-2 1.2-3 2.5-3s2.1 1 2.5 3M15 10h3M15 13h3"/>',
    handshake:'<path d="m3 13 4-4 4 2 2-1 3 2 5 5-3 3-2-1-2 1-2-1-2 1-4-4z"/><path d="m10 13 2 2 2 1 2 2M7 9 5 7 2 10M16 12l2-2 4 3"/>',
    medicineLeaf:'<path d="M12 4v16M5 12h14"/><path d="M15 4c4 0 6 2 6 5-4 0-6-2-6-5zM9 20c-4 0-6-2-6-5 4 0 6 2 6 5z"/>',
    robe:'<path d="m8 4 4 3 4-3 3 5-2 2 2 10H5l2-10-2-2z"/><path d="m9 5 3 5 3-5M8 15h8"/>',
    arcaneRobe:'<path d="m8 4 4 3 4-3 3 5-2 2 2 10H5l2-10-2-2z"/><path d="M12 7v5M9.5 10h5M8 16h8"/><path d="m12 13 .8 1.5 1.7.3-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.3z"/>',
    leatherArmor:'<path d="m8 3 4 3 4-3 4 4-3 4v10H7V11L4 7z"/><path d="M8 12h8M10 8l2 2 2-2M10 15v4M14 15v4"/>',
    plateArmor:'<path d="m8 3 4 2 4-2 5 5-3 5-2-2v10H8V11l-2 2-3-5z"/><path d="M8 10h8M12 5v16M8 15h8"/>',
    ridingPants:'<path d="M7 3h10l1 6-3 12h-4l1-10-3 10H5l3-12z"/><path d="M7 8h11M9 4l3 7 3-7"/>',
    greaves:'<path d="M6 3h6l-1 18H5zM13 3h5l1 18h-6z"/><path d="M6 8h5M13 8h5M6 16h5M13 16h6"/>',
    sandals:'<path d="M5 17c3 0 5-2 7-2l7 2c2 1 1 4-1 4H5z"/><path d="m8 16 2-8M14 16l-2-8M8 11h5"/>',
    travelBoot:'<path d="M6 3h8v11l5 2c2 1 2 5-1 5H6z"/><path d="M6 8h8M6 14h8M9 10l5 3"/>',
    warBoot:'<path d="M6 3h9v11l4 2c2 1 2 5-1 5H5z"/><path d="M6 7h9M6 11h9M6 15h10M9 7v8M13 7v8"/>',
    swiftBoot:'<path d="M6 4h8v10l5 2c2 1 2 5-1 5H6z"/><path d="M6 15h9M15 7l5-3-3 5 4-1-5 5"/>',
    hood:'<path d="M5 14c0-7 3-11 7-11s7 4 7 11l-2 7H7z"/><path d="M8 14c0-4 1-7 4-7s4 3 4 7-2 5-4 5-4-1-4-5z"/>',
    circlet:'<path d="M4 14c4 3 12 3 16 0M5 11l4 2 3-5 3 5 4-2"/><path d="m12 8 1-3-1-2-1 2z"/>',
    helm:'<path d="M5 13c0-6 3-10 7-10s7 4 7 10v7h-5v-6h-4v6H5z"/><path d="M12 3v11M5 13h14"/>',
    mageHat:'<path d="m7 16 5-14 5 14M3 19c5-2 13-2 18 0-5 3-13 3-18 0z"/><path d="m12 7 .7 1.4 1.5.3-1.1 1.1.3 1.6-1.4-.8-1.4.8.3-1.6-1.1-1.1 1.5-.3z"/>',
    southSword:'<path d="M5 20 19 4M9 19l-4-4M15 9l4 4M11 12l2 2"/><path d="M16 3h5v5M4 21l3-1-2-2z"/>',
    ironFist:'<path d="M5 12V8a2 2 0 0 1 4 0v3-5a2 2 0 0 1 4 0v5-4a2 2 0 0 1 4 0v5l2-1c2-1 3 1 2 3l-4 6H9c-3 0-5-2-5-5z"/><path d="M9 10v4M13 10v4M17 10v4"/>',
    bearGrapple:'<circle cx="8" cy="6" r="2"/><circle cx="16" cy="6" r="2"/><path d="M4 20c0-5 1-9 4-9 2 0 3 2 4 4 1-2 2-4 4-4 3 0 4 4 4 9M8 12l4 4 4-4M6 16l-3-2M18 16l3-2"/>',
    windBow:'<path d="M7 3c8 4 8 14 0 18M7 3c4 5 4 13 0 18M7 12h14M17 8l4 4-4 4"/><path d="M3 7h3M2 12h4M3 17h3"/>',
    lotus:'<path d="M12 20c-4-4-4-8 0-13 4 5 4 9 0 13zM12 20c-5 0-8-2-9-6 4-1 7 0 9 6zM12 20c5 0 8-2 9-6-4-1-7 0-9 6z"/><path d="M8 21h8M12 7V3"/>',
    runeCraft:'<path d="m12 3 7 4v10l-7 4-7-4V7zM8 8h8l-4 8zM9 13h6"/>',
    illusionEye:'<path d="M2 12s4-6 10-6 10 6 10 6-4 6-10 6S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="m12 3 1 2M5 5l2 2M19 5l-2 2"/>',
    relationship:'<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6M10.5 20c.4-4 2.2-6 5.5-6s5.1 2 5.5 6"/><path d="M12 13c-2.5-1.7-4-3.2-4-5a2.3 2.3 0 0 1 4-1.5A2.3 2.3 0 0 1 16 8c0 1.8-1.5 3.3-4 5z"/>',
    cattleBiz:'<path d="M5 9 2 5l5 1c3-2 7-2 10 0l5-1-3 4v7c0 3-3 5-7 5s-7-2-7-5z"/><path d="M8 14h.01M16 14h.01M9 18h6"/>',
    farmBiz:'<path d="M4 20V9l8-5 8 5v11M7 20v-6h10v6M8 10h.01M16 10h.01"/><path d="M2 20h20M12 4V1M12 2c-3 0-4-1-5-2M12 2c3 0 4-1 5-2"/>',
    merchantShop:'<path d="M4 9h16l-1-5H5zM5 9v11h14V9M8 20v-6h5v6M15 12h2"/><path d="M4 9c0 1.5 1 2.5 2.5 2.5S9 10.5 9 9c0 1.5 1 2.5 2.5 2.5S14 10.5 14 9c0 1.5 1 2.5 2.5 2.5S19 10.5 19 9"/>',
    tavernBiz:'<path d="M6 5h10v7c0 4-2 6-5 6s-5-2-5-6zM16 8h2c4 0 4 6 0 6h-2M8 22h6M11 18v4"/><path d="M8 9h6"/>',
    caravanBiz:'<path d="M3 7h12l5 5v6H3zM15 8v5h5M6 7V4h6v3"/><circle cx="7" cy="19" r="2"/><circle cx="17" cy="19" r="2"/>',
    worldNav:'<circle cx="12" cy="12" r="9"/><path d="M3.5 10h17M4 15h16M12 3c-3 3-4 6-4 9s1 6 4 9M12 3c3 3 4 6 4 9s-1 6-4 9"/><path d="m7 12 2-2 2 2 2-3 4 4"/>',
    identityNav:'<path d="M12 3 5 6v6c0 4.4 2.8 7.3 7 9 4.2-1.7 7-4.6 7-9V6z"/><circle cx="12" cy="9" r="2.5"/><path d="M8 16c.5-2.5 1.8-4 4-4s3.5 1.5 4 4"/>'
  });

  /* Peta semantik emoji → ikon SVG. Semua simbol yang belum punya padanan
     khusus tetap menjadi rune Mantara, bukan glyph emoji dari keyboard. */
  var GLYPH_GROUPS={
    fire:"🔥♨💥",stone:"🗿⚱⚰🪦🏺",lock:"🔒🔓",crown:"👑♛",temple:"🏛⛪⛩🛐🙏📿",
    balance:"⚖",chart:"📈📊",expedition:"🗺🧭🧳🪂",sound:"🔊🔈🔉🔇🔕🔔📯",
    crystal:"💠💎🔷🔹🔵🟣🟢⚫",scroll:"📜📋📝📓🗂",sword:"⚔🗡🔪🪓",
    shield:"🛡🪖🥋",magic:"🔮🪄🧙✨💫🌟✦✧☆🌌",heart:"❤💗💞💘💛💚💜💍🤝",
    gift:"🎁🍬🧸",map:"🗺📍",school:"🎓🏫📐",medal:"🏅🎖🥇",dice:"🎲🎰🃏🂡",
    target:"🎯🎾🏹🎣🥊🤺🤼🏋",paw:"🐾🐈🐄🐀🐻🐺🦊🦁🦫🐎🐴🕊🦅🦉🦋🦌🐗🐫🐟🦄",
    trophy:"🏆",book:"📚📖📕📘",snow:"❄🥶",alchemy:"⚗🧪🔬🥤🍷🍺🍻☕",
    death:"💀☠👻🧟",music:"🎵🎻♪♫",
    ship:"⚓🚢⛵",tree:"🌿🌾🌲🌳🌹🌸🍀🥬",hammer:"⚒🔨🔧⛏🛠⚙🧵✂💅🧹🛞",
    health:"⚕🩸",dialog:"🗣💬👂✉",warning:"⚠⛔🚫🦠🤒🪤⛓🌩🌪",door:"🚪",trash:"🗑",save:"💾♻🔁",
    monster:"😈👹👺🐉🐲🐍🦑🕷🕸",person:"👤👥🧑👨👩🧔👴👵🤵👰💂🦹👁🕶😤😴😊😠😡😢😖😜😂🙂😶🤗🤫👋💢🦵💆💇👯🧘💃💪✊✋♂♀🦰🦱🦳🦲",
    child:"👶🧒👦👧",seed:"🌱🌅",water:"💧🌊🏊☁🌫",moon:"🌙🌒🌓🌑🌌",
    time:"⏳⏸",power:"⏻",check:"✓✅👍",close:"✕✗🚫",question:"❓",
    coin:"💰🪙",wealth:"💎",reputation:"🌟",property:"🏠🏡🛖🏚🏘⛺🛏",
    business:"🏪🏨🏙🎪",career:"💼",shop:"🛒🛍",assets:"🏰🏗",inventory:"🎒📦",
    action:"⚡🏃🚶",clothingBody:"👕🧥👗",clothingLegs:"👖",clothingFeet:"👢",
    clothingHead:"🎩🪖",food:"🍎🍲🍖🍞🥕🥬",rune:"🎭🎉🧩🌀➕♾🏴"
  };
  var GLYPH_LOOKUP=Object.create(null);
  Object.keys(GLYPH_GROUPS).forEach(function(name){Array.from(GLYPH_GROUPS[name]).forEach(function(ch){GLYPH_LOOKUP[ch]=name;});});
  var EMOJI_RE=/(?:[\u{1F1E6}-\u{1F1FF}]{2}|[#*0-9]\uFE0F?\u20E3|[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}])(?:\uFE0F|\uFE0E)?(?:[\u{1F3FB}-\u{1F3FF}])?(?:\u200D(?:[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}])(?:\uFE0F|\uFE0E)?(?:[\u{1F3FB}-\u{1F3FF}])?)*/gu;

  function glyphName(raw){
    var chars=Array.from(raw).filter(function(ch){var cp=ch.codePointAt(0);return cp!==0xFE0F&&cp!==0xFE0E&&cp!==0x200D&&!(cp>=0x1F3FB&&cp<=0x1F3FF);});
    for(var i=0;i<chars.length;i++)if(GLYPH_LOOKUP[chars[i]])return GLYPH_LOOKUP[chars[i]];
    return "rune";
  }

  function replaceEmojiText(node){
    var value=node.nodeValue||"";EMOJI_RE.lastIndex=0;if(!EMOJI_RE.test(value))return 0;
    EMOJI_RE.lastIndex=0;var frag=document.createDocumentFragment(),last=0,count=0,match;
    while((match=EMOJI_RE.exec(value))){
      if(match.index>last)frag.appendChild(document.createTextNode(value.slice(last,match.index)));
      var name=glyphName(match[0]),span=document.createElement("span");
      span.className="glyph-icon glyph-"+name;span.setAttribute("aria-hidden","true");
      span.innerHTML=uiIcon(name,"func-icon--glyph");frag.appendChild(span);
      last=match.index+match[0].length;count++;if(match[0].length===0)EMOJI_RE.lastIndex++;
    }
    if(last<value.length)frag.appendChild(document.createTextNode(value.slice(last)));
    if(node.parentNode)node.parentNode.replaceChild(frag,node);return count;
  }

  function replaceAllEmoji(root){
    root=root||document.body;if(!root)return 0;
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(node){
      var p=node.parentElement;if(!p||p.closest("script,style,svg,.glyph-icon,.m-ico"))return NodeFilter.FILTER_REJECT;
      EMOJI_RE.lastIndex=0;return EMOJI_RE.test(node.nodeValue||"")?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
    }}),nodes=[],n,total=0;
    while((n=walker.nextNode()))nodes.push(n);nodes.forEach(function(node){total+=replaceEmojiText(node);});return total;
  }

  function rawEmojiCount(root){
    root=root||document.body;if(!root)return 0;
    var walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),n,total=0;
    while((n=walker.nextNode())){var p=n.parentElement;if(!p||p.closest("script,style,svg,.glyph-icon,.m-ico"))continue;EMOJI_RE.lastIndex=0;var m=(n.nodeValue||"").match(EMOJI_RE);if(m)total+=m.length;}
    return total;
  }

  function uiIcon(name, extra){
    var body = ICONS[name] || ICONS.stats;
    return '<span class="func-icon '+(extra||'')+'" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+body+'</svg></span>';
  }

  window.mantaraIcon=uiIcon;

  function schoolIconName(track, cityId){
    var byCity={aetheria:"schoolNoble",saltmoor:"schoolTrade",frostspire:"schoolArcane",thornvale:"schoolRanger"};
    if(cityId&&byCity[cityId])return byCity[cityId];
    return {sihir:"schoolArcane",bangsawan:"schoolNoble",dagang:"schoolTrade",rimba:"schoolRanger",umum:"schoolVillage"}[track]||"schoolVillage";
  }
  window.schoolCrestHTML=function(track,tier,cityId,label){
    var name=schoolIconName(track,cityId),level=Math.max(0,Math.min(2,Number(tier)||0));
    var pips="";for(var i=0;i<=level;i++)pips+='<i></i>';
    return '<span class="school-crest school-crest--'+name.replace("school","").toLowerCase()+'" title="'+String(label||"Lambang sekolah").replace(/"/g,"&quot;")+'">'
      +uiIcon(name,"func-icon--school")+'<span class="school-rank">'+pips+'</span></span>';
  };

  window.mantaraGearIcon=function(cat,key){
    var name=cat==="mount"?(key==="none"?"walk":"mountMark"):(cat==="weapon"?(key==="none"?"fist":"sword"):(key==="none"?"book":"magic"));
    return '<span class="gear-variant-glyph gear-variant-glyph--'+cat+'">'+uiIcon(name,"func-icon--gear")+'</span>';
  };

  window.wardrobeIconHTML=function(slot,key){
    var byKey={
      tunic:"clothingBody",silk:"robe",leather_armor:"leatherArmor",plate:"plateArmor",arcane_robe:"arcaneRobe",
      cloth:"clothingLegs",riding:"ridingPants",greaves:"greaves",
      sandals:"sandals",boots:"travelBoot",warboots:"warBoot",swift:"swiftBoot",
      hood:"hood",circlet:"circlet",helm:"helm",mage_hat:"mageHat"
    };
    var empty={body:"clothingBody",legs:"clothingLegs",feet:"walk",head:"person"};
    var name=byKey[key]||empty[slot]||"clothingBody";
    return '<span class="wardrobe-glyph wardrobe-glyph--'+String(key||"none")+'">'+uiIcon(name,"func-icon--wardrobe")+'</span>';
  };

  window.skillIconHTML=function(id){
    var map={swordsmanship:"sword",alchemy:"alchemy",diplomacy:"handshake",medicine:"medicineLeaf",sorcery:"magic"};
    return '<span class="skill-glyph skill-glyph--'+id+'">'+uiIcon(map[id]||"stats","func-icon--skill")+'</span>';
  };

  window.schoolLifeIconHTML=function(){
    return '<span class="school-action-glyph">'+uiIcon("schoolLife","func-icon--school-action")+'</span>';
  };

  window.courseIconHTML=function(id){
    var map={southSword:"southSword",ironFist:"ironFist",bearGrapple:"bearGrapple",windBow:"windBow",martialMeditation:"lotus",fireFlow:"fire",healingFlow:"medicineLeaf",illusionFlow:"illusionEye",runeFlow:"runeCraft",manaMeditation:"magic"};
    return '<span class="course-glyph course-glyph--'+id+'">'+uiIcon(map[id]||"target","func-icon--course")+'</span>';
  };

  window.businessIconHTML=function(id){
    var map={cattle:"cattleBiz",farm:"farmBiz",shop:"merchantShop",tavern:"tavernBiz",caravan:"caravanBiz"};
    return '<span class="business-glyph business-glyph--'+id+'">'+uiIcon(map[id]||"business","func-icon--business")+'</span>';
  };

  window.relationshipIconHTML=function(extra){return uiIcon("relationship",extra||"func-icon--relationship");};

  function heroCity(asset, emoji, label){
    var ico = (typeof imgIcon==="function") ? imgIcon(asset, emoji, "18px") : emoji;
    return '<span class="hero-city">'+ico+'<span>'+label+'</span></span>';
  }

  function mountStartHero(){
    var start = document.querySelector("#startScreen .start");
    if(!start || start.querySelector(".realm-hero")) return;
    var p = start.querySelector("p");
    if(!p) return;
    var hero = document.createElement("section");
    hero.className = "realm-hero";
    hero.setAttribute("aria-label", "Pemandangan empat kota di dunia Aetheria");
    var src = (typeof resolveAsset==="function") ? resolveAsset(HERO_ASSET) : HERO_ASSET;
    hero.innerHTML = '<img src="'+src+'" alt="Pemandangan Aetheria dengan empat kota fantasi" loading="eager" decoding="async">'
      +'<div class="hero-vignette"></div>'
      +'<div class="hero-copy"><span class="hero-kicker">JELAJAHI AETHERIA</span><strong>Empat kota. Satu takdir.</strong></div>'
      +'<div class="hero-cities">'
      +heroCity("city_aetheria","🔮","Aetheria")
      +heroCity("city_thornvale","🌿","Thornvale")
      +heroCity("city_saltmoor","⚓","Saltmoor")
      +heroCity("city_frostspire","❄️","Frostspire")
      +'</div>';
    start.insertBefore(hero, p);
  }

  function pt(cx, cy, r, angle){
    var a = (angle-90) * Math.PI / 180;
    return {x:cx+Math.cos(a)*r, y:cy+Math.sin(a)*r};
  }
  function pointsFor(values, scale){
    var out=[];
    for(var i=0;i<6;i++){
      var p=pt(120,70,43*(scale===undefined?values[i]/100:scale),i*60);
      out.push(p.x.toFixed(1)+","+p.y.toFixed(1));
    }
    return out.join(" ");
  }
  function statRadar(){
    if(typeof C==="undefined" || !C || !C.stats) return "";
    var defs=[
      {key:"health",short:"Nyawa",color:"#d75c68"},
      {key:"happy",short:"Bahagia",color:"#f0c040"},
      {key:"might",short:"Kuat",color:"#c98245"},
      {key:"mind",short:"Akal",color:"#78a0e6"},
      {key:"mana",short:"Mana",color:"#9b8cff"},
      {key:"charm",short:"Pesona",color:"#e184b4"}
    ];
    var values=defs.map(function(d){return Math.max(0,Math.min(100,Number(C.stats[d.key])||0));});
    var grids=[.25,.5,.75,1].map(function(s){return '<polygon class="radar-grid" points="'+pointsFor(values,s)+'"/>';}).join("");
    var axes=defs.map(function(d,i){var p=pt(120,70,43,i*60);return '<line class="radar-axis" x1="120" y1="70" x2="'+p.x.toFixed(1)+'" y2="'+p.y.toFixed(1)+'"/>';}).join("");
    var dots=defs.map(function(d,i){var p=pt(120,70,43*values[i]/100,i*60);return '<circle cx="'+p.x.toFixed(1)+'" cy="'+p.y.toFixed(1)+'" r="2.8" fill="'+d.color+'"/>';}).join("");
    var labels=defs.map(function(d,i){
      var p=pt(120,70,58,i*60), anchor=p.x>126?"start":(p.x<114?"end":"middle");
      return '<text x="'+p.x.toFixed(1)+'" y="'+(p.y+3).toFixed(1)+'" text-anchor="'+anchor+'">'+d.short+'</text>';
    }).join("");
    var legend=defs.map(function(d,i){return '<span><i style="background:'+d.color+'"></i>'+d.short+' <b>'+Math.round(values[i])+'</b></span>';}).join("");
    var best=0, weak=0;
    for(var i=1;i<values.length;i++){if(values[i]>values[best])best=i;if(values[i]<values[weak])weak=i;}
    var total=Math.max(1,(typeof ACTIONS_PER_YEAR!=="undefined"?ACTIONS_PER_YEAR:3)+(Number(C.actionBonus)||0));
    var left=Math.max(0,Math.min(total,Number(C.actionsLeft)||0));
    var orbs="";
    for(var j=0;j<total;j++)orbs+='<i class="action-orb '+(j<left?'on':'')+'"></i>';
    return '<section class="vital-chart">'
      +'<div class="vital-head"><span>'+uiIcon("stats")+'Grafik Atribut</span><span class="action-meter">'+uiIcon("action")+'<b>'+left+'/'+total+'</b>'+orbs+'</span></div>'
      +'<div class="radar-layout"><svg class="stat-radar" viewBox="0 0 240 140" role="img" aria-label="Grafik enam atribut karakter">'
      +grids+axes+'<polygon class="radar-value" points="'+pointsFor(values)+'"/>'+dots+labels+'</svg>'
      +'<div class="radar-summary"><span class="summary-label">KEUNGGULAN</span><strong>'+defs[best].short+' '+Math.round(values[best])+'</strong>'
      +'<span class="summary-label">PERLU DIJAGA</span><strong>'+defs[weak].short+' '+Math.round(values[weak])+'</strong>'
      +'<small>Grafik berubah setiap atribut naik atau turun.</small></div></div>'
      +'<div class="radar-legend">'+legend+'</div></section>';
  }

  function decorateCharacterCard(host){
    if(typeof C==="undefined" || !C || !host) return;
    var coin=host.querySelector(".coin");
    if(coin){
      var money=C.age<13?'<span class="minor-money">Anak-anak · belum punya uang</span>':uiIcon("coin")+' '+U.money(C.coin);
      coin.innerHTML=money+'<span class="coin-sep">·</span>'+uiIcon("action")+' Aksi '+(C.actionsLeft||0)+'/'+(typeof ACTIONS_PER_YEAR!=="undefined"?ACTIONS_PER_YEAR:3)+(C.actionBonus?' <small>(+'+C.actionBonus+')</small>':'');
    }
    var cage=host.querySelector(".cage");
    if(cage && cage.innerHTML.indexOf("📍")>=0)cage.innerHTML=cage.innerHTML.replace("📍",uiIcon("pin","func-icon--inline"));
    var nw=host.querySelectorAll(".nw-item");
    var vals=[
      {icon:"wealth",value:(typeof netWorth==="function"?netWorth():C.coin)},
      {icon:"reputation",value:C.reputation||0},
      {icon:"property",value:(C.properties||[]).length},
      {icon:"business",value:(C.businesses||[]).length}
    ];
    for(var i=0;i<nw.length&&i<vals.length;i++){
      var val=nw[i].querySelector(".nw-val");
      if(val)val.innerHTML=uiIcon(vals[i].icon)+" "+U.money(vals[i].value);
    }
  }

  function decorateNavigation(){
    var mainIcons={Hidup:"life",Dunia:"worldNav",Diri:"identityNav"};
    Object.keys(mainIcons).forEach(function(group){
      var ico=document.querySelector('.tab3[data-group="'+group+'"] .tabi');
      if(ico&&ico.dataset.ficon!==mainIcons[group]){
        ico.dataset.ficon=mainIcons[group];ico.innerHTML=uiIcon(mainIcons[group],"func-icon--nav");
      }
    });
    var map={Peta:"mapNav",Aksi:"actionNav",Toko:"shop",Karir:"career",Relasi:"relationship",Aset:"assets",Tas:"inventory"};
    var pills=document.querySelectorAll(".subpill");
    for(var i=0;i<pills.length;i++){
      var label=(pills[i].textContent||"").trim();
      var name=null;
      Object.keys(map).some(function(key){if(label.indexOf(key)>=0){name=map[key];return true;}return false;});
      var ico=pills[i].querySelector(".subpill-ico");
      if(name&&ico&&ico.dataset.ficon!==name){
        ico.dataset.ficon=name;ico.innerHTML=uiIcon(name,"func-icon--pill");
      }
    }
  }

  function installNavObserver(){
    if(!window.MutationObserver || window._mantaraVisualObserver) return;
    var observer=new MutationObserver(function(){decorateNavigation();});
    [document.getElementById("tabbar"),document.getElementById("globalSubbar")].forEach(function(el){
      if(el)observer.observe(el,{childList:true,subtree:true});
    });
    window._mantaraVisualObserver=observer;
  }

  function installGlyphObserver(){
    if(!window.MutationObserver||window._mantaraGlyphObserver)return;
    var queued=false;
    var observer=new MutationObserver(function(){
      if(queued)return;queued=true;
      requestAnimationFrame(function(){queued=false;replaceAllEmoji(document.body);decorateNavigation();});
    });
    observer.observe(document.body,{childList:true,subtree:true,characterData:true});
    window._mantaraGlyphObserver=observer;
  }

  function installWardrobeGraphics(){
    if(typeof WARDROBE_CATALOG==="undefined")return;
    Object.keys(WARDROBE_CATALOG).forEach(function(slot){
      if(WARDROBE_CATALOG[slot])WARDROBE_CATALOG[slot].graphic=window.wardrobeIconHTML(slot);
    });
  }

  function installSchoolGraphics(){
    if(typeof CITY_SCHOOLS!=="undefined")Object.keys(CITY_SCHOOLS).forEach(function(cityId){
      var sc=CITY_SCHOOLS[cityId];if(!sc)return;
      sc.ico=window.schoolCrestHTML(sc.mark||"umum",2,cityId,sc.name);
    });
    if(typeof CITIES!=="undefined")CITIES.forEach(function(city){
      (city.sublocs||[]).forEach(function(sub){if(sub._school)sub.ico=window.schoolCrestHTML("umum",2,city.id,sub.name);});
    });
  }

  function installSkillGraphics(){
    if(typeof SKILL_TYPES==="undefined")return;
    SKILL_TYPES.forEach(function(skill){skill.ico=window.skillIconHTML(skill.id);});
  }

  function installBusinessGraphics(){
    if(typeof BUSINESS_TYPES==="undefined")return;
    BUSINESS_TYPES.forEach(function(business){business.ico=window.businessIconHTML(business.id);});
  }

  function installStyles(){
    if(document.getElementById("visualUiStyle")) return;
    var st=document.createElement("style");st.id="visualUiStyle";
    st.textContent='\
      .func-icon{width:1.15em;height:1.15em;display:inline-flex;align-items:center;justify-content:center;vertical-align:-.2em;color:var(--gold-bright);flex:0 0 auto}.func-icon svg{width:100%;height:100%;display:block}.func-icon--inline{margin-right:2px}.func-icon--nav{width:30px;height:30px;filter:drop-shadow(0 0 4px rgba(240,192,64,.35))}.func-icon--pill{width:17px;height:17px}.glyph-icon{display:inline-flex;align-items:center;justify-content:center;width:1.18em;height:1.18em;margin:0 .08em;vertical-align:-.19em;color:var(--gold-bright)}.glyph-icon .func-icon--glyph{width:100%;height:100%;filter:drop-shadow(0 0 3px rgba(240,192,64,.22))}.glyph-lock,.glyph-shield{color:#aebcff}.glyph-fire,.glyph-warning{color:#e98169}.glyph-heart,.glyph-gift{color:#df85ae}.glyph-tree,.glyph-seed{color:#9fcf75}.glyph-water,.glyph-snow{color:#83c8e8}.glyph-magic,.glyph-crystal{color:#a99cff}.glyph-death,.glyph-monster{color:#c4869b}.glyph-check{color:var(--good)}.glyph-close{color:var(--bad)}.portrait>.glyph-icon,.cust-face>.glyph-icon,.relav>.glyph-icon,.mico>.glyph-icon{width:1em;height:1em;margin:0}.tile .ti>.glyph-icon,.assetico>.glyph-icon{width:30px;height:30px}.sechead>.glyph-icon{width:17px;height:17px}.tabi>.glyph-icon,.subpill-ico>.glyph-icon{margin:0}.wardrobe-glyph{width:52px;height:52px;border-radius:15px;display:inline-flex;align-items:center;justify-content:center;color:#f4ca54;background:radial-gradient(circle at 35% 30%,rgba(240,192,64,.2),rgba(91,110,225,.09));border:1px solid rgba(240,192,64,.48);box-shadow:inset 0 0 16px rgba(240,192,64,.08),0 0 12px rgba(184,134,11,.12)}.wardrobe-glyph .func-icon--wardrobe{width:34px;height:34px;filter:drop-shadow(0 0 5px rgba(240,192,64,.38))}.assetico:has(.wardrobe-glyph){min-width:54px}.asset:has(.wardrobe-glyph){padding:14px 12px}.gear-variant-glyph,.school-crest{width:48px;height:48px;border-radius:15px;display:inline-flex;align-items:center;justify-content:center;position:relative;color:#f4ca54;background:radial-gradient(circle at 32% 26%,rgba(240,192,64,.18),rgba(40,31,29,.94) 68%);border:1px solid rgba(240,192,64,.48);box-shadow:inset 0 0 14px rgba(240,192,64,.08),0 5px 14px rgba(0,0,0,.22)}.gear-variant-glyph .func-icon--gear,.school-crest .func-icon--school{width:30px;height:30px;filter:drop-shadow(0 0 5px rgba(240,192,64,.34))}.gear-variant-glyph--mount{color:#d9b25c}.gear-variant-glyph--weapon{color:#e4c777}.gear-variant-glyph--tome{color:#9faeff}.school-crest--arcane{color:#9faeff;background:radial-gradient(circle at 35% 25%,rgba(112,126,255,.28),rgba(29,23,43,.96) 68%)}.school-crest--noble{color:#f3cb55;background:radial-gradient(circle at 35% 25%,rgba(240,192,64,.25),rgba(49,31,20,.96) 70%)}.school-crest--trade{color:#7fc8d2;background:radial-gradient(circle at 35% 25%,rgba(70,167,180,.22),rgba(27,38,41,.96) 70%)}.school-crest--ranger{color:#9bc776;background:radial-gradient(circle at 35% 25%,rgba(102,154,69,.24),rgba(27,39,24,.96) 70%)}.school-crest--village{color:#e3bd68}.school-rank{position:absolute;left:0;right:0;bottom:4px;display:flex;justify-content:center;gap:2px}.school-rank i{width:3px;height:3px;display:block;transform:rotate(45deg);background:currentColor;box-shadow:0 0 3px currentColor}.portrait>.school-crest{width:62px;height:62px;border-radius:18px}.portrait>.school-crest .func-icon--school{width:38px;height:38px}.pg-ico>.school-crest,.pg-ico>.gear-variant-glyph{width:42px;height:42px;border-radius:13px}.pg-ico>.school-crest .func-icon--school,.pg-ico>.gear-variant-glyph .func-icon--gear{width:27px;height:27px}.assetico>.gear-variant-glyph{width:48px;height:48px}\
      .realm-hero{height:202px;position:relative;overflow:hidden;border:1px solid rgba(184,134,11,.42);border-radius:17px;margin:4px 0 15px;background:#171221;box-shadow:0 14px 34px rgba(0,0,0,.38)}.realm-hero>img{width:100%;height:100%;display:block;object-fit:cover}.hero-vignette{position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,5,2,.05) 20%,rgba(8,5,2,.18) 48%,rgba(8,5,2,.94) 100%),linear-gradient(90deg,rgba(12,8,4,.3),transparent 40%)}.hero-copy{position:absolute;left:14px;bottom:49px;display:flex;flex-direction:column;text-align:left;text-shadow:0 2px 8px #000}.hero-copy .hero-kicker{font-size:8px;letter-spacing:.2em;color:var(--gold-bright);font-weight:700}.hero-copy strong{font-size:16px;margin-top:3px;color:#f3e8cf}.hero-cities{position:absolute;left:10px;right:10px;bottom:10px;display:flex;gap:5px}.hero-city{flex:1;min-width:0;padding:5px 3px;border-radius:8px;background:rgba(18,12,9,.72);border:1px solid rgba(232,220,192,.12);backdrop-filter:blur(5px);display:flex;align-items:center;justify-content:center;gap:3px;font-size:7.5px;color:#dccda9;white-space:nowrap}.hero-city .m-ico{filter:drop-shadow(0 0 4px rgba(139,156,255,.45))}\
      .coin{display:flex;align-items:center;gap:4px;flex-wrap:wrap}.coin .coin-sep{opacity:.55;margin:0 2px}.coin small{font-size:9px}.minor-money{color:var(--ink-soft);filter:brightness(1.55)}.nw-val{display:flex;align-items:center;justify-content:center;gap:2px}.nw-val .func-icon{width:15px;height:15px}.cage .func-icon{width:12px;height:12px}\
      .vital-chart{background:linear-gradient(155deg,rgba(46,34,24,.98),rgba(23,17,33,.98));border:1px solid var(--line);border-radius:14px;padding:11px 12px;margin:11px 0;position:relative;overflow:hidden}.vital-chart:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 22% 45%,rgba(91,110,225,.09),transparent 48%);pointer-events:none}.vital-head{display:flex;justify-content:space-between;align-items:center;gap:8px;font-size:10px;letter-spacing:.11em;text-transform:uppercase;color:var(--gold);position:relative;z-index:1}.vital-head>span{display:flex;align-items:center;gap:6px}.action-meter{letter-spacing:.03em;color:var(--parchment)}.action-meter .func-icon{color:var(--arcane-glow)}.action-orb{display:inline-block;width:7px;height:7px;border-radius:2px;transform:rotate(45deg);border:1px solid rgba(139,156,255,.45);background:rgba(91,110,225,.08);margin-left:2px}.action-orb.on{background:var(--arcane-glow);box-shadow:0 0 5px rgba(139,156,255,.65)}.radar-layout{display:grid;grid-template-columns:minmax(0,1.65fr) minmax(88px,.8fr);align-items:center;gap:4px;position:relative;z-index:1}.stat-radar{width:100%;height:auto;overflow:visible}.radar-grid{fill:none;stroke:rgba(232,220,192,.12);stroke-width:.7}.radar-grid:last-of-type{stroke:rgba(184,134,11,.28)}.radar-axis{stroke:rgba(232,220,192,.1);stroke-width:.7}.radar-value{fill:rgba(184,134,11,.22);stroke:var(--gold-bright);stroke-width:1.4;filter:drop-shadow(0 0 4px rgba(240,192,64,.2))}.stat-radar text{font:8px Georgia,serif;fill:rgba(232,220,192,.75)}.radar-summary{display:flex;flex-direction:column;gap:2px;border-left:1px solid var(--line);padding-left:10px}.summary-label{font-size:7px;letter-spacing:.13em;color:var(--ink-soft);filter:brightness(1.7);margin-top:6px}.radar-summary strong{font-size:12px;color:var(--parchment)}.radar-summary small{font-size:8.5px;line-height:1.35;color:var(--ink-soft);filter:brightness(1.55);margin-top:7px}.radar-legend{display:grid;grid-template-columns:repeat(3,1fr);gap:5px 8px;padding-top:7px;border-top:1px solid rgba(184,134,11,.12);position:relative;z-index:1}.radar-legend span{display:flex;align-items:center;gap:4px;font-size:8.5px;color:var(--ink-soft);filter:brightness(1.6)}.radar-legend i{width:6px;height:6px;border-radius:50%;box-shadow:0 0 4px currentColor}.radar-legend b{margin-left:auto;color:var(--parchment);font-variant-numeric:tabular-nums}\
      @media(max-width:350px){.realm-hero{height:178px}.hero-city span{display:none}.hero-city{padding:5px}.radar-layout{grid-template-columns:1fr}.radar-summary{display:none}}\
      @media(prefers-reduced-motion:no-preference){.realm-hero>img{animation:heroBreathe 14s ease-in-out infinite alternate}@keyframes heroBreathe{from{transform:scale(1)}to{transform:scale(1.035)}}}';
    st.textContent+='\
      .skill-glyph,.school-action-glyph{width:50px;height:50px;border-radius:15px;display:inline-flex;align-items:center;justify-content:center;color:#f1c64f;background:linear-gradient(145deg,rgba(57,42,27,.98),rgba(25,19,28,.98));border:1px solid rgba(240,192,64,.5);box-shadow:inset 0 0 15px rgba(240,192,64,.08),0 5px 14px rgba(0,0,0,.22)}.skill-glyph .func-icon--skill,.school-action-glyph .func-icon--school-action{width:32px;height:32px;filter:drop-shadow(0 0 5px currentColor)}.skill-glyph--swordsmanship{color:#e1bd6a}.skill-glyph--alchemy{color:#8fcf9a;background:linear-gradient(145deg,rgba(30,55,42,.98),rgba(22,25,28,.98))}.skill-glyph--diplomacy{color:#dd98bd;background:linear-gradient(145deg,rgba(62,34,53,.98),rgba(28,21,29,.98))}.skill-glyph--medicine{color:#83cbd0;background:linear-gradient(145deg,rgba(25,54,55,.98),rgba(21,24,28,.98))}.skill-glyph--sorcery{color:#a7a8ff;background:linear-gradient(145deg,rgba(43,38,78,.98),rgba(24,20,36,.98))}.skill-group-title{display:flex;align-items:center;gap:6px;margin:12px 5px 7px;color:var(--gold);font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase}.skill-group-title:after{content:"";height:1px;flex:1;background:linear-gradient(90deg,rgba(184,134,11,.38),transparent)}.skill-group-title .func-icon{width:15px;height:15px}.assetico>.skill-glyph{width:48px;height:48px}.school-action-glyph{width:46px;height:46px;color:#9faeff;border-color:rgba(126,139,255,.5);background:radial-gradient(circle at 32% 25%,rgba(112,126,255,.24),rgba(29,23,43,.96) 70%)}.tile .ti>.school-action-glyph{width:46px;height:46px}.portrait>.school-crest{width:100%;height:100%;border:0;border-radius:inherit;background:transparent;box-shadow:none}.portrait>.school-crest .func-icon--school{width:72%;height:72%}.portrait>.school-crest .school-rank{bottom:2px}.wardrobe-glyph--silk,.wardrobe-glyph--arcane_robe{color:#c3a6ff;background:radial-gradient(circle at 35% 30%,rgba(135,108,226,.25),rgba(34,25,44,.96))}.wardrobe-glyph--leather_armor,.wardrobe-glyph--riding{color:#cf9c62}.wardrobe-glyph--plate,.wardrobe-glyph--greaves,.wardrobe-glyph--helm,.wardrobe-glyph--warboots{color:#b8c4d8;background:radial-gradient(circle at 35% 30%,rgba(151,170,199,.18),rgba(28,29,34,.96))}.wardrobe-glyph--swift,.wardrobe-glyph--mage_hat{color:#9faeff;background:radial-gradient(circle at 35% 30%,rgba(112,126,255,.24),rgba(29,23,43,.96))}.wardrobe-glyph--circlet{color:#f2d375}\
      @media(max-width:390px){.skill-glyph,.school-action-glyph{width:46px;height:46px}.skill-glyph .func-icon--skill{width:29px;height:29px}}';
    st.textContent+='\
      .course-glyph,.business-glyph{width:48px;height:48px;border-radius:14px;display:inline-flex;align-items:center;justify-content:center;color:#f0c64f;background:linear-gradient(145deg,rgba(55,41,27,.98),rgba(24,19,27,.98));border:1px solid rgba(240,192,64,.46);box-shadow:inset 0 0 14px rgba(240,192,64,.07),0 4px 12px rgba(0,0,0,.2)}.course-glyph .func-icon--course,.business-glyph .func-icon--business{width:31px;height:31px;filter:drop-shadow(0 0 4px currentColor)}.course-glyph--ironFist{color:#e09465}.course-glyph--bearGrapple{color:#c5a36d}.course-glyph--windBow{color:#83c7d0}.course-glyph--martialMeditation,.course-glyph--manaMeditation{color:#aaa6f4}.course-glyph--fireFlow{color:#ee856c}.course-glyph--healingFlow{color:#84cda0}.course-glyph--illusionFlow{color:#dc91bd}.course-glyph--runeFlow{color:#8faeff}.business-glyph--cattle{color:#d3a66f}.business-glyph--farm{color:#8fc878}.business-glyph--shop{color:#efc64f}.business-glyph--tavern{color:#da9a68}.business-glyph--caravan{color:#8fc8d4}.assetico>.business-glyph{width:48px;height:48px}.pg-ico>.course-glyph{width:42px;height:42px}.pg-ico>.course-glyph .func-icon--course{width:27px;height:27px}.subpill-ico .func-icon--relationship{width:20px;height:20px;color:#e2a2c2;filter:drop-shadow(0 0 4px rgba(226,130,178,.36))}\
      @media(max-width:390px){.course-glyph,.business-glyph{width:44px;height:44px}.course-glyph .func-icon--course,.business-glyph .func-icon--business{width:28px;height:28px}}';
    st.textContent+='\
      .topbar{padding:calc(10px + var(--app-safe-top)) 14px 11px;min-height:calc(var(--app-safe-top) + 98px)}.topbar .game-title{display:flex;align-items:center;justify-content:center;gap:7px;margin-top:50px;font-size:18px;line-height:1.2;white-space:nowrap}.topbar .logo-mark{display:inline-flex;align-items:center;justify-content:center;margin-right:0}.topbar .logo-mark img{height:1.3em!important;width:auto}.topbar .game-sub{margin-top:5px;line-height:1.3;letter-spacing:.22em}.topbar .tut-help{top:calc(var(--app-safe-top) + 8px);left:calc(50% - 66px);width:40px;height:40px;font-size:19px;box-shadow:inset 0 0 12px rgba(240,192,64,.06)}.topbar .tut-help.tut-exit{left:calc(50% - 20px);font-size:17px}.topbar #musicBtn{left:calc(50% + 26px)!important}.topbar .back-btn{position:relative;top:auto;right:auto;z-index:12;max-width:calc(100% - 24px);min-height:38px;margin:10px auto 0;padding:8px 14px;justify-content:center;pointer-events:auto;box-shadow:0 5px 14px rgba(0,0,0,.22),inset 0 0 10px rgba(139,156,255,.07)}.topbar .back-btn .bb-label{max-width:290px}\
      @media(max-width:350px){.topbar .game-title{font-size:16.5px;letter-spacing:.15em}.topbar .game-sub{font-size:8px}}';
    document.head.appendChild(st);
  }

  M.on("hidup:render",function(ctx){
    decorateCharacterCard(ctx.host);
    ctx.blocks.push(statRadar());
  },-20);
  M.on("tab:render",function(){decorateNavigation();},-20);
  M.on("boot",function(){
    installStyles();
    installWardrobeGraphics();
    installSchoolGraphics();
    installSkillGraphics();
    installBusinessGraphics();
    mountStartHero();
    decorateNavigation();
    installNavObserver();
    replaceAllEmoji(document.body);
    installGlyphObserver();
  },-20);

  window.MantaraVisual={icon:uiIcon,radar:statRadar,mountStartHero:mountStartHero,
    replaceEmoji:replaceAllEmoji,auditEmoji:rawEmojiCount};
})();
