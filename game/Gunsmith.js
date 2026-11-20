








export const SLOTS = Object.freeze(['optic', 'muzzle', 'barrel', 'underbarrel', 'magazine', 'stock', 'laser']);
export const SLOT_LABEL = Object.freeze({ optic: 'OPTIC', muzzle: 'MUZZLE', barrel: 'BARREL', underbarrel: 'UNDERBARREL', magazine: 'MAGAZINE', stock: 'STOCK', laser: 'LASER' });
export const GUNSMITH_KEY = 'ironfall.gunsmith.v1';
export const MAX_ATTACHMENTS = 5;

const ALL = ['AR', 'SMG', 'SHOTGUN', 'SNIPER', 'LMG', 'PISTOL'], LONG = ['AR', 'SMG', 'SHOTGUN', 'SNIPER', 'LMG'];





export const ATTACHMENTS = Object.freeze([

  { id: 'reddot', slot: 'optic', name: 'RED DOT', price: 250, cats: ALL, mods: { ads: 0.9, adsSpeed: 0.97 }, note: 'Clean sight picture.' },
  { id: 'holo', slot: 'optic', name: 'HOLO SIGHT', price: 350, cats: LONG, mods: { ads: 0.86, adsSpeed: 0.94, zoom: -2 }, note: 'Wider window, slight zoom.' },
  { id: 'acog', slot: 'optic', name: 'ACOG 3×', price: 600, cats: ['AR', 'LMG', 'SNIPER'], mods: { ads: 0.78, adsSpeed: 0.86, zoom: -9 }, note: 'Mid-range zoom, slower to raise.' },
  { id: 'scope8', slot: 'optic', name: 'LONG-RANGE 8×', price: 800, cats: ['SNIPER'], mods: { ads: 0.7, adsSpeed: 0.8, zoom: -7 }, note: 'Extra zoom for snipers.' },

  { id: 'suppressor', slot: 'muzzle', name: 'SUPPRESSOR', price: 500, cats: ['AR', 'SMG', 'SNIPER', 'PISTOL'], mods: { flash: 0.3, sound: 0.5, silent: true, hip: 1.06, recoil: 0.97 }, note: 'Bots cannot hear your shots. Small flash.' },
  { id: 'compensator', slot: 'muzzle', name: 'COMPENSATOR', price: 400, cats: ['AR', 'SMG', 'LMG', 'PISTOL'], mods: { recoil: 0.84, recoilH: 1.08, flash: 1.15 }, note: 'Less muzzle climb, a bit more sideways kick.' },
  { id: 'brake', slot: 'muzzle', name: 'MUZZLE BRAKE', price: 400, cats: ['AR', 'LMG', 'SNIPER'], mods: { recoilH: 0.8, recoil: 0.95, flash: 1.3, sound: 1.15 }, note: 'Less sideways kick, louder and brighter.' },
  { id: 'choke', slot: 'muzzle', name: 'FULL CHOKE', price: 450, cats: ['SHOTGUN'], mods: { hip: 0.82, ads: 0.82 }, note: 'Tighter pellet pattern.' },

  { id: 'longbarrel', slot: 'barrel', name: 'LONG BARREL', price: 450, cats: LONG, mods: { hip: 0.88, ads: 0.9, adsSpeed: 0.92 }, note: 'More accurate, slower handling.' },
  { id: 'shortbarrel', slot: 'barrel', name: 'SHORT BARREL', price: 350, cats: ['AR', 'SMG', 'SHOTGUN', 'LMG'], mods: { adsSpeed: 1.1, hip: 1.12, recoil: 1.05 }, note: 'Faster handling, less accurate.' },

  { id: 'vgrip', slot: 'underbarrel', name: 'VERTICAL GRIP', price: 350, cats: ['AR', 'SMG', 'LMG', 'SHOTGUN'], mods: { recoil: 0.9, adsSpeed: 0.97 }, note: 'Steadier vertical recoil.' },
  { id: 'agrip', slot: 'underbarrel', name: 'ANGLED GRIP', price: 350, cats: ['AR', 'SMG', 'LMG'], mods: { adsSpeed: 1.08, recoilH: 0.94 }, note: 'Faster ADS.' },
  { id: 'bipod', slot: 'underbarrel', name: 'BIPOD', price: 500, cats: ['LMG', 'SNIPER'], mods: { recoil: 0.8, recoilH: 0.85, adsSpeed: 0.88 }, note: 'Much steadier, slower to raise.' },

  { id: 'extmag', slot: 'magazine', name: 'EXTENDED MAG', price: 500, cats: ALL, mods: { mag: 1.34, reload: 1.12, adsSpeed: 0.97 }, note: '+34 % rounds, slower reload.' },
  { id: 'fastmag', slot: 'magazine', name: 'FAST MAG', price: 450, cats: ALL, mods: { reload: 0.8 }, note: '20 % faster reload.' },

  { id: 'lightstock', slot: 'stock', name: 'LIGHT STOCK', price: 300, cats: LONG, mods: { adsSpeed: 1.1, recoil: 1.07 }, note: 'Faster ADS, more climb.' },
  { id: 'heavystock', slot: 'stock', name: 'HEAVY STOCK', price: 300, cats: LONG, mods: { recoil: 0.9, recoilH: 0.93, adsSpeed: 0.92 }, note: 'Steadier, slower ADS.' },

  { id: 'laser', slot: 'laser', name: 'LASER SIGHT', price: 300, cats: ALL, mods: { hip: 0.8 }, note: 'Tighter hip fire. Visible beam.' },
]);
const BY_ID = new Map(ATTACHMENTS.map(a => [a.id, a]));
export const attachmentById = id => BY_ID.get(id) || null;
export const attachmentKey = id => 'att:' + id;

export function optionsFor(weapon, slot) { return ATTACHMENTS.filter(a => a.slot === slot && a.cats.includes(weapon?.category)); }
export function slotsFor(weapon) { return SLOTS.filter(s => optionsFor(weapon, s).length > 0); }





export function sanitizeBuild(weapon, build, owns = () => true) {
  const out = {}; let n = 0;
  if (!weapon || !build || typeof build !== 'object') return out;
  for (const slot of SLOTS) {
    const a = attachmentById(build[slot]);
    if (!a || a.slot !== slot || !a.cats.includes(weapon.category) || !owns(a.id) || n >= MAX_ATTACHMENTS) continue;
    out[slot] = a.id; n++;
  }
  return out;
}

const mul = (m, k) => (m[k] === undefined ? 1 : m[k]);




export function applyBuild(weapon, build) {
  const b = sanitizeBuild(weapon, build), gs = { adsSpeed: 1, flash: 1, sound: 1, silent: false, laser: false, ids: [] };
  let recoil = 1, recoilH = 1, hip = 1, ads = 1, reload = 1, mag = 1, zoom = 0;
  for (const slot of SLOTS) {
    const a = attachmentById(b[slot]); if (!a) continue; const m = a.mods; gs.ids.push(a.id);
    recoil *= mul(m, 'recoil'); recoilH *= mul(m, 'recoilH'); hip *= mul(m, 'hip'); ads *= mul(m, 'ads'); reload *= mul(m, 'reload'); mag *= mul(m, 'mag');
    zoom += m.zoom || 0; gs.adsSpeed *= mul(m, 'adsSpeed'); gs.flash *= mul(m, 'flash'); gs.sound *= mul(m, 'sound');
    if (m.silent) gs.silent = true; if (a.slot === 'laser') gs.laser = true;
  }
  const r = (v, d = 5) => Number(v.toFixed(d));
  return {
    recoilUp: r(weapon.recoilUp * recoil), recoilHoriz: r(weapon.recoilHoriz * recoilH),
    spread: r(weapon.spread * hip), adsSpread: r((weapon.adsSpread ?? weapon.spread * 0.35) * ads),
    reloadTime: r(weapon.reloadTime * reload, 3), magSize: Math.max(1, Math.round(weapon.magSize * mag)),
    adsFovOffset: (weapon.adsFovOffset ?? -12) + zoom, build: b, gs,
  };
}

export function serverSpec(weapon, build) { const s = applyBuild(weapon, build); return { magSize: s.magSize, reloadMs: Math.round(s.reloadTime * 1000), silent: s.gs.silent }; }


export function ratings(w, gs = { adsSpeed: 1 }) {
  const clamp = v => Math.max(0, Math.min(100, Math.round(v)));
  return {
    accuracy: clamp(100 - (w.adsSpread ?? w.spread * 0.35) * 2200 - w.spread * 500),
    control: clamp(100 - w.recoilUp * 700 - w.recoilHoriz * 900),
    handling: clamp(55 * (gs.adsSpeed || 1) + 45 - w.reloadTime * 9),
    capacity: clamp(Math.sqrt(w.magSize) * 10),
  };
}



export function loadBuilds(storage, catalog, owns = () => true) {
  let raw = {}; try { raw = JSON.parse(storage?.getItem(GUNSMITH_KEY) || '{}') || {}; } catch { raw = {}; }
  const out = {};
  for (const w of catalog) { const b = sanitizeBuild(w, raw[w.name], owns); if (Object.keys(b).length) out[w.name] = b; }
  return out;
}
export function saveBuilds(storage, builds) { try { storage?.setItem(GUNSMITH_KEY, JSON.stringify(builds)); } catch {                                                          } }

export function setAttachment(weapon, build, slot, id, owns = () => true) {
  const current = sanitizeBuild(weapon, build, owns), next = { ...current };

  if (id && !current[slot] && Object.keys(current).length >= MAX_ATTACHMENTS) return current;
  if (id) next[slot] = id; else delete next[slot];
  const clean = sanitizeBuild(weapon, next, owns);
  return id && clean[slot] !== id ? current : clean;
}
