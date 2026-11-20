 
 
 
import { STAT_LIMITS, neutralMods } from './CardFFA.js';

export const AGENTS = Object.freeze({
  DEFAULT: { id: 'DEFAULT', name: 'DEFAULT', role: 'Balanced', color: '#9aa4b1', hex: 0x9aa4b1, rarity: 'COMMON', weight: 40, mods: {} },
  FRONTLINE: { id: 'FRONTLINE', name: 'FRONTLINE', role: 'Tank', color: '#3b82f6', hex: 0x3b82f6, rarity: 'COMMON', weight: 18,
    mods: { maxHpMul: 1.3, damageMul: 1.1, spreadMul: 1.25, moveMul: 0.9 } },
  BACKLINE: { id: 'BACKLINE', name: 'BACKLINE', role: 'Support', color: '#facc15', hex: 0xfacc15, rarity: 'COMMON', weight: 18,
    mods: { maxHpMul: 0.85, healMul: 1.6 }, aura: { radius: 8, healPerSec: 3 } },
  ASSASSIN: { id: 'ASSASSIN', name: 'ASSASSIN', role: 'Striker', color: '#a855f7', hex: 0xa855f7, rarity: 'RARE', weight: 12,
    mods: { maxHpMul: 0.8, damageMul: 1.2, moveMul: 1.12, meleeCooldownMul: 0.8 } },
  BLACK_KNIGHT: { id: 'BLACK_KNIGHT', name: 'BLACK KNIGHT', role: 'Duelist', color: '#1f2229', hex: 0x2a2d35, rarity: 'EPIC', weight: 7,
    mods: { maxHpMul: 0.85, damageTakenMul: 1.1, lifesteal: 0.2 } },
   
   
  GRIM_REAPER: { id: 'GRIM_REAPER', name: 'GRIM REAPER', role: 'Hunter', color: '#ef4444', hex: 0xef4444, rarity: 'LEGENDARY', weight: 5,
    mods: { maxHpMul: 0.9, moveMul: 1.05 }, blink: { distance: 6, minIntervalMs: 250, charges: 4, rechargeMs: 450 } },
  BLINK: { id: 'BLINK', name: 'BLINK', role: 'Bot buff', color: '#a16207', hex: 0x92622a, rarity: 'BOT', weight: 10, botOnly: true,
    mods: { moveMul: 1.1, damageMul: 1.05 }, blink: { distance: 5, minIntervalMs: 1200, charges: 1, rechargeMs: 5000 } },
});
export const AGENT_IDS = Object.freeze(Object.keys(AGENTS));
export const agentById = id => AGENTS[id] || AGENTS.DEFAULT;
export const playerAgents = () => AGENT_IDS.filter(id => !AGENTS[id].botOnly);
export const isPlayerAgent = id => Object.hasOwn(AGENTS, id) && !AGENTS[id].botOnly;

 
export function agentOdds({ bot = false } = {}) {
  const ids = AGENT_IDS.filter(id => bot || !AGENTS[id].botOnly), total = ids.reduce((s, id) => s + AGENTS[id].weight, 0);
  return ids.map(id => ({ id, name: AGENTS[id].name, rarity: AGENTS[id].rarity, chance: AGENTS[id].weight / total }));
}
export function rollAgent(rng = Math.random, { bot = false } = {}) {
  const odds = agentOdds({ bot }); let r = rng();
  for (const o of odds) { r -= o.chance; if (r < 0) return o.id; }
  return odds[odds.length - 1].id;
}

 
const EXTRA = { maxHpMul: [0.5, 2, 1], healMul: [0.5, 3, 1] };
const MULT = new Set(['damageMul', 'damageTakenMul', 'headshotMul', 'moveMul', 'reloadMul', 'fireRateMul', 'magMul', 'spreadMul', 'meleeCooldownMul', 'respawnMul', 'maxHpMul', 'healMul']);
 
export function combineMods(cardMods, agentId) {
  const out = { ...neutralMods(), ...(cardMods || {}) }; for (const [k, v] of Object.entries(EXTRA)) if (!(k in out)) out[k] = v[2];
  for (const [k, v] of Object.entries(agentById(agentId).mods)) { if (!(k in out) || !Number.isFinite(v)) continue; out[k] = MULT.has(k) ? out[k] * v : out[k] + v; }
  for (const k of Object.keys(out)) { const lim = STAT_LIMITS[k] || EXTRA[k]; if (lim) out[k] = Number.isFinite(out[k]) ? Math.min(lim[1], Math.max(lim[0], out[k])) : lim[2]; }
  return Object.freeze(out);
}

 
export function blinkState() { return { charges: null, lastAt: -Infinity, refillAt: 0 }; }
export function tryBlink(state, def, now) {
  if (!def) return false;
  if (state.charges === null) { state.charges = def.charges; state.refillAt = now; }
  while (state.charges < def.charges && now - state.refillAt >= def.rechargeMs) { state.charges++; state.refillAt += def.rechargeMs; }
  if (state.charges >= def.charges) state.refillAt = now;
  if (now - state.lastAt < def.minIntervalMs || state.charges <= 0) return false;
  state.charges--; state.lastAt = now; return true;
}
