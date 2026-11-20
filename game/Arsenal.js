






export const CHARACTERS = Object.freeze([
  { id: 'vanguard', name: 'VANGUARD', role: 'Rifleman', hp: 100, price: 0, desc: 'Standard-issue operator. Balanced and dependable.',
    look: { top: 0x3a4a3c, pants: 0x2c3330, vest: 0x4b5a46, helmet: 0x39433a, skin: 0xc49a7a, accent: 0xff8a35, scale: 1 } },
  { id: 'ghost', name: 'GHOST', role: 'Infiltrator', hp: 85, price: 800, desc: 'Light kit, low profile. Fragile but hard to read at range.',
    look: { top: 0x1e2329, pants: 0x1a1d22, vest: 0x2a3038, helmet: 0x15181c, skin: 0xb98e6e, accent: 0x7dd3fc, scale: 0.96, hood: true } },
  { id: 'viper', name: 'VIPER', role: 'Skirmisher', hp: 90, price: 800, desc: 'Fast flanker in jungle camo.',
    look: { top: 0x4f6b3a, pants: 0x3a4a2a, vest: 0x5d7a44, helmet: 0x41532f, skin: 0x8d6345, accent: 0xa3e635, scale: 0.98 } },
  { id: 'specter', name: 'SPECTER', role: 'Marksman', hp: 95, price: 1000, desc: 'Long-range specialist with a ghillie wrap.',
    look: { top: 0x6b6247, pants: 0x4d4634, vest: 0x786d4e, helmet: 0x5c5440, skin: 0xd2a684, accent: 0xfacc15, scale: 1, hood: true } },
  { id: 'patch', name: 'PATCH', role: 'Field Medic', hp: 110, price: 1200, desc: 'Combat medic. Extra padding, white cross on the vest.',
    look: { top: 0x55606b, pants: 0x3a424a, vest: 0xd9dde2, helmet: 0x4a535c, skin: 0xa77b5b, accent: 0xef4444, scale: 1, cross: true } },
  { id: 'ranger', name: 'RANGER', role: 'Pathfinder', hp: 120, price: 1500, desc: 'Desert ranger with a boonie hat and chest rig.',
    look: { top: 0xb79c6f, pants: 0x8a7553, vest: 0x9c845c, helmet: 0xa38a60, skin: 0xc28f69, accent: 0xff8a35, scale: 1.02, boonie: true } },
  { id: 'nomad', name: 'NOMAD', role: 'Scout', hp: 130, price: 1800, desc: 'Arctic scout in layered winter gear.',
    look: { top: 0xdfe5ea, pants: 0xb9c2ca, vest: 0x9aa6b1, helmet: 0xe8edf1, skin: 0xe0b796, accent: 0x38bdf8, scale: 1.02 } },
  { id: 'bulwark', name: 'BULWARK', role: 'Breacher', hp: 150, price: 2500, desc: 'Heavy plate carrier and a visored helmet.',
    look: { top: 0x2f3b4a, pants: 0x232b36, vest: 0x1f2832, helmet: 0x18202a, skin: 0xb68866, accent: 0x60a5fa, scale: 1.06, visor: true } },
  { id: 'titan', name: 'TITAN', role: 'Juggernaut', hp: 200, price: 3500, desc: 'Full EOD-style armour. Slow to drop.',
    look: { top: 0x3c3f2f, pants: 0x30332a, vest: 0x4a4e38, helmet: 0x2d3024, skin: 0x9c7152, accent: 0xf97316, scale: 1.12, visor: true } },
  { id: 'sora', name: 'SORA', role: 'Recon Operator', hp: 92, price: 1500, desc: 'Young recon operator with sharp eyes. Gathers intel, marks enemy positions and backs up the squad.',
    look: { style: 'sora', top: 0x3a4a72, pants: 0xc9cdd8, vest: 0x1b1f27, helmet: null, skin: 0xf3dccd, accent: 0x38bdf8, scale: 0.95, hairColor: 0xdcdfe8, eyeColor: 0x9a8fc4 } },
  { id: 'yuna', name: 'YUNA', role: 'Defender / Support', hp: 125, price: 1800, desc: 'Laid-back and a bit sleepy, but the one you want holding the line. PERK: shotguns +14% damage, 100 reserve shells.',
    perk: { name: 'SHOTGUN SPECIALIST', category: 'SHOTGUN', damageMul: 1.14, reserve: 100 },
    look: { style: 'yuna', top: 0x2a3150, sleeve: 0xe3e6ee, pants: 0xd0d4dd, vest: 0x1b1f27, helmet: null, skin: 0xf4dccf, accent: 0x38bdf8, scale: 0.94, hairColor: 0xe0a6b8, eyeColor: 0xc580b4 } },
  { id: 'bigboss', name: 'BIG BOSS JEANS', role: 'Summoner', hp: 350, price: 6000, desc: 'White singlet, blue jeans, zero fear. Press P to call 3 MINI RAIDERS.',
    look: { top: 0xf1f1ec, pants: 0x355e88, vest: null, helmet: null, skin: 0xc99578, accent: 0xff8a35, scale: 1.14, singlet: true, belly: false, faceStyle: 'windah', hairColor: 0x171718 },
    ability: { key: 'P', name: 'MINI RAIDERS', count: 3, hp: 35, lifeSec: 9, cooldownSec: 15 } }
]);
export const DEFAULT_CHARACTER = 'vanguard';

export const MINION_LOOK = Object.freeze({ top: 0xff8a35, pants: 0x2f5c9a, vest: null, helmet: 0xff8a35, skin: 0xd8a67f, accent: 0xffffff, scale: 0.62, cap: true });
export const MINION_WEAPON = 21;

export const characterById = id => CHARACTERS.find(c => c.id === id) || CHARACTERS[0];

 
 
export function characterPerk(characterId, weapon) {
  const p = characterById(characterId)?.perk;
  if (!p || !weapon || (p.category && weapon.category !== p.category)) return { damageMul: 1, reserve: null };
  return { damageMul: p.damageMul ?? 1, reserve: p.reserve ?? null };
}

export function characterHealth(id, modeMaxHealth = 100) {
  return Math.max(1, Math.round(characterById(id).hp * (modeMaxHealth / 100)));
}

export function botCharacter(seed) {
  let x = Math.imul(seed | 0, 2654435761) >>> 0; x = (x ^ (x >>> 15)) >>> 0; x = Math.imul(x, 2246822519) >>> 0; x = (x ^ (x >>> 13)) >>> 0;
  return CHARACTERS[x % CHARACTERS.length].id;
}


export const FREE_WEAPONS = Object.freeze([0, 1, 2]);
const CATEGORY_PRICE = { PISTOL: 300, SMG: 600, SHOTGUN: 650, AR: 900, LMG: 1300, SNIPER: 1300 };
const SPECIAL_PRICE = { 'DESERT EAGLE': 500, 'FIVE-SEVEN': 450, AWM: 1800, 'BARRETT M82': 2200, 'PKP PECHENEG': 1500, 'AA-12': 1100 };
export function weaponPrice(w) {
  if (!w) return 0;
  if (FREE_WEAPONS.includes(w.index)) return 0;
  return SPECIAL_PRICE[w.name] ?? CATEGORY_PRICE[w.category] ?? 900;
}
export const weaponKey = i => 'w:' + i;
export const characterKey = id => 'c:' + id;


export const LOADOUT_KEY = 'ironfall.loadout3.v1';
export const LOADOUT_SIZE = 3;
export const DEFAULT_LOADOUT = Object.freeze([0, 1, 2]);

export function sanitizeLoadout(raw, catalogLength, owns = () => true) {
  const out = [];
  if (Array.isArray(raw)) for (const v of raw) { const i = v | 0; if (Number.isInteger(v) && i >= 0 && i < catalogLength && owns(i) && !out.includes(i)) out.push(i); if (out.length === LOADOUT_SIZE) break; }
  for (const d of DEFAULT_LOADOUT) if (out.length < LOADOUT_SIZE && !out.includes(d)) out.push(d);
  return out.slice(0, LOADOUT_SIZE);
}
export function loadLoadout(storage, catalogLength, owns) {
  let raw = null; try { raw = JSON.parse(storage?.getItem(LOADOUT_KEY) || 'null'); } catch { raw = null; }
  return sanitizeLoadout(raw, catalogLength, owns);
}
export function saveLoadout(storage, slots) { try { storage?.setItem(LOADOUT_KEY, JSON.stringify(slots)); } catch {                                                            } }

export function assignSlot(slots, slot, idx) {
  const out = slots.slice(), at = out.indexOf(idx);
  if (slot < 0 || slot >= LOADOUT_SIZE) return out;
  if (at >= 0) out[at] = out[slot];
  out[slot] = idx;
  return out;
}


export function codeHash(code) {
  const s = String(code || '').trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  let h = 0x811c9dc5; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return s ? h.toString(16).padStart(8, '0') : '';
}
export const REDEEM = Object.freeze({
  '09537800': { label: '500 IRON CREDITS', ic: 500 },
  '79c48133': { label: '300 IRON CREDITS', ic: 300 },
  '9b987061': { label: '1,000 IRON CREDITS', ic: 1000 },
  'a0b37bec': { label: 'COBALT CAMO', items: ['camo_cobalt'] },
  '5492a09a': { label: '400 IC + IRONFALL ORANGE PLATE', ic: 400, items: ['plate_orange'] },
  '1cbac0d7': { label: 'DESERT EAGLE', unlocks: ['w:22'] },
  '75b97cf8': { label: '750 IRON CREDITS', ic: 750 },
  '37f99243': { label: '1,500 IRON CREDITS', ic: 1500 },
  'b089b9c5': { label: 'RANGER OPERATOR', unlocks: ['c:ranger'] }
});
