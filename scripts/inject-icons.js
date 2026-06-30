#!/usr/bin/env node
/**
 * Inject custom icon paths into mantara v23.html MANTARA_ASSETS
 */
const fs = require("fs");
const path = require("path");

const htmlPath = path.join(__dirname, "..", "mantara v23.html");
let html = fs.readFileSync(htmlPath, "utf8");

const NEW_ASSETS = {
  tab_aksi: "assets/icons/tab_aksi.png",
  tab_peta: "assets/icons/tab_peta.png",
  icon_aksi: "assets/icons/icon_aksi.png",
  wardrobe_body: "assets/icons/wardrobe_body.png",
  wardrobe_legs: "assets/icons/wardrobe_legs.png",
  wardrobe_feet: "assets/icons/wardrobe_feet.png",
  wardrobe_head: "assets/icons/wardrobe_head.png",
  biz_cattle: "assets/icons/biz_cattle.png",
  biz_farm: "assets/icons/biz_farm.png",
  biz_shop: "assets/icons/biz_shop.png",
  biz_tavern: "assets/icons/biz_tavern.png",
  biz_caravan: "assets/icons/biz_caravan.png",
  gear_mount: "assets/icons/gear_mount.png",
  gear_weapon: "assets/icons/gear_weapon.png",
  gear_tome: "assets/icons/gear_tome.png",
  skill_swordsmanship: "assets/icons/skill_swordsmanship.png",
  skill_alchemy: "assets/icons/skill_alchemy.png",
  skill_diplomacy: "assets/icons/skill_diplomacy.png",
  skill_medicine: "assets/icons/skill_medicine.png",
  skill_sorcery: "assets/icons/skill_sorcery.png",
};

// Update or insert each asset key in MANTARA_ASSETS
for (const [key, val] of Object.entries(NEW_ASSETS)) {
  const quoted = `"${key}"`;
  const entry = `${quoted}:"${val}"`;
  const re = new RegExp(`"${key}":"[^"]*"`);
  if (re.test(html)) {
    html = html.replace(re, entry);
  } else {
    html = html.replace(/const MANTARA_ASSETS=\{/, `const MANTARA_ASSETS={\n  ${entry},`);
  }
}

fs.writeFileSync(htmlPath, html);
console.log("Injected", Object.keys(NEW_ASSETS).length, "icon assets into MANTARA_ASSETS");
