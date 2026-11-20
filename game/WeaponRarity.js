 
 
 
 
import { createRng } from './GameModes.js';

export const RARITY_TIERS = Object.freeze({
  COMMON: { weight: 60, label: 'Common' },
  STRONG: { weight: 26, label: 'Strong' },
  RARE: { weight: 10, label: 'Rare' },
  OP: { weight: 4, label: 'OP' },
});
export const RARITY_RULES = Object.freeze([
  { tier: 'OP', names: ['LIGHTSABER', 'MAUL', 'DOUBLE BLADE', 'BARRETT M82', 'LAGUN'] },
  { tier: 'RARE', names: ['AWM', 'KATANA', 'BLADEON', 'AA-12', 'PKP PECHENEG', 'DESERT EAGLE'] },
  { tier: 'STRONG', names: ['DAGGER', 'AK-12', 'SCAR-L'], categories: ['SNIPER', 'LMG', 'SHOTGUN'] },
  { tier: 'COMMON', categories: ['AR', 'SMG', 'PISTOL', 'MELEE', 'HYBRID'] },
]);
export function weaponTier(w) {
  if (!w) return 'COMMON';
  for (const r of RARITY_RULES) if (r.names?.includes(w.name) || r.categories?.includes(w.category)) return r.tier;
  return 'COMMON';
}
 
export function weaponOdds(catalog, allowed = catalog.map(w => w.index)) {
  const set = new Set(allowed), list = catalog.filter(w => set.has(w.index)), count = {};
  for (const w of list) { const t = weaponTier(w); count[t] = (count[t] || 0) + 1; }
  const total = Object.keys(count).reduce((s, t) => s + RARITY_TIERS[t].weight, 0);
  return list.map(w => { const t = weaponTier(w); return { index: w.index, name: w.name, tier: t, chance: RARITY_TIERS[t].weight / count[t] / total }; });
}
export function createWeaponRoller(catalog, seed = 0x9a11) {
  const rng = createRng(seed >>> 0 || 1), cache = new Map();
  return {
    roll(allowed = null) {
      const key = allowed ? allowed.join(',') : '*'; let odds = cache.get(key);
      if (!odds) { odds = weaponOdds(catalog, allowed || undefined); cache.set(key, odds); }
      if (!odds.length) return allowed?.[0] ?? 0;
      let r = rng(); for (const o of odds) { r -= o.chance; if (r < 0) return o.index; }
      return odds[odds.length - 1].index;
    },
  };
}
 
const BANDS = { SNIPER: [22, 40], LMG: [12, 26], AR: [9, 22], SMG: [5, 14], SHOTGUN: [2.5, 8], PISTOL: [7, 16], MELEE: [0, 1.6] };
export function combatProfile(w, special = null) {
  if (special?.projectile) return { band: [8, 20], style: 'blink-ranged' };
  if (w?.category === 'HYBRID') return { band: [4, 12], style: 'hybrid' };
  if (special?.dash) return { band: [0, special.range + special.dash], style: 'dash' };
  if (w?.category === 'MELEE') return { band: BANDS.MELEE, style: 'melee' };
  return { band: BANDS[w?.category] || [8, 20], style: 'ranged' };
}
