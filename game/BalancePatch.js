import { BALANCE_SCHEDULE } from './BalanceSchedule.js';
 
 
 
 
 
 
 
 
export const PATCH_RULES = Object.freeze({ minBuffs: 1, maxBuffs: 3, minNerfs: 1, maxNerfs: 3, minPct: 8, maxPct: 15, tzOffsetMs: 7 * 3600 * 1000 });
const MONTHS = ['JANUARI', 'FEBRUARI', 'MARET', 'APRIL', 'MEI', 'JUNI', 'JULI', 'AGUSTUS', 'SEPTEMBER', 'OKTOBER', 'NOVEMBER', 'DESEMBER'];

export function patchKey(ms = Date.now()) { const d = new Date(ms + PATCH_RULES.tzOffsetMs); return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`; }
export function patchTitle(key) { const [y, m] = key.split('-'); return `PATCH ${MONTHS[(+m || 1) - 1]} ${y}`; }

function rngFor(key) { let h = 2166136261; for (const c of 'ironfall-balance:' + key) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } let s = h >>> 0 || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

export const isMelee = w => w.category === 'MELEE' || (w.magSize <= 1 && !w.reserve && w.reloadTime === 0);
 
export const GUN_STATS = [['damage', 'DAMAGE', true], ['damage', 'DAMAGE', true], ['fireRate', 'FIRE RATE', false], ['reloadTime', 'RELOAD', false], ['magSize', 'MAGAZINE', true], ['spread', 'ACCURACY', false]];
export const MELEE_STATS = [['damage', 'DAMAGE', true], ['damage', 'DAMAGE', true], ['fireRate', 'SWING SPEED', false]];

 
export function makeChange(catalog, index, kind, stat, pct) {
  const w = catalog[index], all = isMelee(w) ? MELEE_STATS : GUN_STATS, def = all.find(([s]) => s === stat) || all[0];
  const [st, label, higherIsBetter] = Number(w[def[0]]) > 0 ? def : all.find(([s2]) => Number(w[s2]) > 0) || ['damage', 'DAMAGE', true];
  const up = (kind === 'BUFF') === higherIsBetter; let to = w[st] * (up ? 1 + pct / 100 : 1 - pct / 100);
  if (st === 'damage' || st === 'magSize') { to = Math.round(to); if (to === w[st]) to += up ? 1 : -1; to = Math.max(1, to); } else to = +to.toFixed(4);
  return { index, name: w.name, kind, stat: st, label, pct, from: w[st], to };
}
const monthsBetween = (a, b) => { const [ay, am] = a.split('-').map(Number), [by, bm] = b.split('-').map(Number); return (by - ay) * 12 + (bm - am); };
 
export function scheduleSlot(key, S = BALANCE_SCHEDULE) { const L = S.months.length || 1; return ((monthsBetween(S.start, key) % L) + L) % L; }

export function monthlyPatch(key, catalog, S = BALANCE_SCHEDULE) {
  const slot = scheduleSlot(key, S), month = S.months[slot];
  const valid = month && month.every(e => catalog[e.index] && catalog[e.index].name === e.name);
  if (valid) return { key, title: patchTitle(key), slot: slot + 1, cycle: S.months.length, changes: month.map(e => makeChange(catalog, e.index, e.kind, e.stat, e.pct)) };
  return generatedPatch(key, catalog);    
}
 
export function generatedPatch(key, catalog) {
  const r = rngFor(key), R = PATCH_RULES, pick = (a, b) => a + Math.floor(r() * (b - a + 1));
  const nb = pick(R.minBuffs, R.maxBuffs), nn = pick(R.minNerfs, R.maxNerfs), pool = catalog.map((_, i) => i);
  for (let i = pool.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [pool[i], pool[j]] = [pool[j], pool[i]]; }
  const changes = pool.slice(0, nb + nn).map((index, k) => { const w = catalog[index], stats = (isMelee(w) ? MELEE_STATS : GUN_STATS).filter(([s]) => Number(w[s]) > 0);
    return makeChange(catalog, index, k < nb ? 'BUFF' : 'NERF', (stats[Math.floor(r() * stats.length)] || ['damage'])[0], pick(R.minPct, R.maxPct)); });
  return { key, title: patchTitle(key), slot: 0, cycle: 0, changes };
}
export { rngFor };

export function patchedEntry(base, ch) {
  const w = { ...base }; w[ch.stat] = ch.to;
  if (ch.stat === 'damage' && base.headDamage) w.headDamage = Math.max(1, Math.round(base.headDamage * ch.to / base.damage));
  if (ch.stat === 'magSize') { if (base.reserve) w.reserve = Math.max(ch.to, Math.round(base.reserve * ch.to / base.magSize)); if (base.maxReserve) w.maxReserve = Math.max(ch.to, Math.round(base.maxReserve * ch.to / base.magSize)); }
  if (ch.stat === 'spread' && base.adsSpread) w.adsSpread = +(base.adsSpread * ch.to / base.spread).toFixed(5);
  return w;
}

 
export function applyPatch(catalog, base, patch, special = null, specialBase = null) {
  catalog.forEach((w, i) => Object.assign(w, base[i]));
  if (special && specialBase) for (const [i, s] of Object.entries(specialBase)) if (special[i] && !Object.isFrozen(special[i])) Object.assign(special[i], s);
  for (const ch of patch.changes) {
    Object.assign(catalog[ch.index], patchedEntry(base[ch.index], ch));
    const sp = special?.[ch.index], sb = specialBase?.[ch.index];
    if (sp && sb && !Object.isFrozen(sp)) {    
      if (ch.stat === 'damage' && sb.damage) { const k = ch.to / ch.from; sp.damage = Math.max(1, Math.round(sb.damage * k)); if (sb.shotDamage) sp.shotDamage = Math.max(1, Math.round(sb.shotDamage * k)); }
      if (ch.stat === 'fireRate' && sb.cooldown) sp.cooldown = Math.max(80, Math.round(sb.cooldown * ch.to / ch.from));
    }
  }
  return patch;
}
export const snapshotSpecial = special => Object.fromEntries(Object.entries(special || {}).map(([i, s]) => [i, Object.fromEntries(['damage', 'shotDamage', 'cooldown'].filter(k => s[k] !== undefined).map(k => [k, s[k]]))]));
