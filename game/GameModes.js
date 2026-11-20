




export const MODE_IDS = ['TDM', 'SHOTGUN', 'HARDCORE', 'RANDOM_GUN', 'BLIND', 'RAID'];
 
 
export const NETWORK_ONLY_MODE_IDS = ['CARD_FFA', 'PUSHCART', 'MELEE_SHOWDOWN', 'BATTLE_SIEGE'];
export const NETWORK_MODE_IDS = [...MODE_IDS, ...NETWORK_ONLY_MODE_IDS];
 
export const EVENT_MODE_IDS = ['THE_BROKEN_SEAL'];

export const MODES = {
  TDM: { label: 'TEAM DEATHMATCH', short: 'TDM', sub: '5 vs 5 · Against bots', pvp: true },
  SHOTGUN: { label: 'SHOTGUN MODE', short: 'SHOTGUN', sub: 'SHOTGUNS ONLY • PLAYERS AND BOTS', pvp: true },
  HARDCORE: { label: 'HARDCORE', short: 'HARDCORE', sub: 'LOW HEALTH • MINIMAL HUD • SHARPER BOTS', pvp: true },
  RANDOM_GUN: { label: 'RANDOM GUN', short: 'RANDOM', sub: 'NEW RANDOM WEAPON EVERY 95 SECONDS', pvp: true },
  BLIND: { label: 'BLIND MODE', short: 'BLIND', sub: 'SHORT SIGHT • DISTANCE FADES TO FOG', pvp: true },
  RAID: { label: 'RAID', short: 'RAID', sub: 'CO-OP PVE • DEFEAT THE WARDEN', pvp: false },
  MELEE_SHOWDOWN: { label: 'MELEE SHOWDOWN', short: 'MELEE', sub: 'BLADES ONLY • 1V1 TO 5V5', pvp: true, network: true, weaponTag: 'melee', teamSizes: [1, 2, 3, 4, 5] },
  BATTLE_SIEGE: { label: 'BATTLE SIEGE', short: 'SIEGE', sub: 'TOWERS • MINIONS • DESTROY THE ENEMY CORE', pvp: true, network: true, objective: true },
  PUSHCART: { label: 'PUSHCART', short: 'CART', sub: 'BLUE PUSHES THE CART • RED HOLDS THE LINE', pvp: true, network: true, objective: true },
  THE_BROKEN_SEAL: { label: 'THE BROKEN SEAL', short: 'SEAL', sub: 'HALLOWEEN STORY • THE RITUAL IS BROKEN • MINUTE 6', pvp: true, network: true, event: true },
  CARD_FFA: { label: 'CARD FFA', short: 'CARDS', sub: 'FREE FOR ALL • DRAFT A CARD ON EVERY KILL', pvp: true, network: true },
};

export const normalizeMode = id => (MODE_IDS.includes(id) ? id : 'TDM');
 
export const normalizeNetworkMode = id => (NETWORK_MODE_IDS.includes(id) || EVENT_MODE_IDS.includes(id) ? id : 'TDM');




export function allowedWeaponIndices(mode, catalog) {
  const all = catalog.map((w, i) => (Number.isInteger(w.index) ? w.index : i));
   
  const tag = MODES[mode]?.weaponTag;
  if (tag) { const tagged = catalog.filter(w => Array.isArray(w.tags) && w.tags.includes(tag)).map(w => w.index); return tagged.length ? tagged : all; }
  if (normalizeMode(mode) !== 'SHOTGUN') return all;
  const shotguns = catalog.filter(w => w.category === 'SHOTGUN').map(w => w.index);
  return shotguns.length ? shotguns : all;
}

export function isWeaponAllowed(mode, catalog, index) {
  return allowedWeaponIndices(mode, catalog).includes(index);
}





export function resolveAllowedWeapon(mode, catalog, index, dir = 1) {
  const allowed = allowedWeaponIndices(mode, catalog);
  if (allowed.includes(index)) return index;
  const sorted = allowed.slice().sort((a, b) => a - b);
  if (dir < 0) return [...sorted].reverse().find(i => i < index) ?? sorted[sorted.length - 1];
  return sorted.find(i => i > index) ?? sorted[0];
}






export function botWeaponStats(w) {
  const pellets = Math.max(1, w.pellets || 1);
  const dmg = pellets > 1 ? Math.round(w.damage * pellets * 0.19) : Math.max(6, Math.round(w.damage * (w.category === 'SNIPER' ? 0.45 : 0.58)));
  return { name: w.name, category: w.category, index: w.index, fireRate: Math.max(0.14, +(w.fireRate * 1.9).toFixed(3)), dmg, magSize: w.magSize, pellets };
}



export const RANDOM_GUN_INTERVAL_MS = 95_000;


export function createRng(seed = 0x9e3779b9) {
  let x = (seed >>> 0) || 0x12345678;
  return () => { x ^= x << 13; x ^= x >>> 17; x ^= x << 5; return (x >>> 0) / 4294967296; };
}





export function rollWeapons(ids, catalog, previous = {}, rng = Math.random, mode = 'RANDOM_GUN') {
  const pool = allowedWeaponIndices(mode, catalog);
  const out = {};
  for (const id of ids) {
    const options = pool.length > 1 ? pool.filter(i => i !== previous[id]) : pool;
    out[id] = options[Math.floor(rng() * options.length) % options.length];
  }
  return out;
}


export function nextRollIn(startedAt, now, interval = RANDOM_GUN_INTERVAL_MS) {
  const elapsed = Math.max(0, now - startedAt);
  return interval - (elapsed % interval);
}



export const HARDCORE_DEFAULTS = Object.freeze({
  health: 40,
  hideCrosshair: true,
  hideMinimap: true,
  hideEnemyMarkers: true,
  hideAmmoCount: false,
  disableAutoHeal: true,
  botSkill: 1.35,
});

export function normalizeHardcore(input = {}) {
  const d = HARDCORE_DEFAULTS, n = (v, lo, hi, def) => (Number.isFinite(+v) ? Math.min(hi, Math.max(lo, +v)) : def);
  const b = (v, def) => (typeof v === 'boolean' ? v : def);
  return {
    health: Math.round(n(input.health, 30, 100, d.health)),
    hideCrosshair: b(input.hideCrosshair, d.hideCrosshair),
    hideMinimap: b(input.hideMinimap, d.hideMinimap),
    hideEnemyMarkers: b(input.hideEnemyMarkers, d.hideEnemyMarkers),
    hideAmmoCount: b(input.hideAmmoCount, d.hideAmmoCount),
    disableAutoHeal: b(input.disableAutoHeal, d.disableAutoHeal),
    botSkill: +n(input.botSkill, 1, 2, d.botSkill).toFixed(2),
  };
}


export function combatRules(mode, hardcore = HARDCORE_DEFAULTS) {
  const m = normalizeMode(mode), hc = normalizeHardcore(hardcore);
  return {
    maxHealth: m === 'HARDCORE' ? hc.health : 100,
    autoHeal: !(m === 'HARDCORE' && hc.disableAutoHeal),
    botSkill: m === 'HARDCORE' ? hc.botSkill : 1,
    botSightRange: m === 'BLIND' ? BLIND.botSightRange : 56,
  };
}



export const BLIND = Object.freeze({
  fogDensity: 0.075,
  fogColor: 0x10161e,
  blurStart: 7,
  blurEnd: 24,
  botSightRange: 22,
  hearingRange: 40,
  hearingMs: 1500,
});


export const blindVisibility = d => Math.exp(-((BLIND.fogDensity * d) ** 2));


export function botCanSee(mode, distance, msSinceTargetFired = Infinity) {
  if (normalizeMode(mode) !== 'BLIND') return distance <= 56;
  if (distance <= BLIND.botSightRange) return true;
  return distance <= BLIND.hearingRange && msSinceTargetFired <= BLIND.hearingMs;
}
