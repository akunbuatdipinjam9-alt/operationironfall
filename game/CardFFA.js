 
 
 

export const CARD_FFA = Object.freeze({
  mode: 'CARD_FFA',
  offerSize: 3,
  pickTimeoutMs: 15000,    
  maxPending: 3,           
  maxCards: 40,            
  blastRadius: 5,
});

 
export const STAT_LIMITS = Object.freeze({
  damageMul: [0.25, 4, 1], damageTakenMul: [0.35, 2, 1], headshotMul: [1, 3, 1],
  maxHpAdd: [-60, 400, 0], moveMul: [0.6, 1.8, 1], reloadMul: [0.25, 2, 1],
  fireRateMul: [0.3, 2, 1], magMul: [0.5, 4, 1], spreadMul: [0.2, 2.5, 1],
  extraPellets: [0, 6, 0], meleeCooldownMul: [0.35, 1.5, 1], respawnMul: [0.4, 1.5, 1],
  lifesteal: [0, 0.6, 0], regenPerSec: [0, 20, 0], killHeal: [0, 150, 0],
  killShield: [0, 150, 0], spawnShield: [0, 150, 0], killBlastDamage: [0, 120, 0],
});
const MULTIPLY = new Set(['damageMul', 'damageTakenMul', 'headshotMul', 'moveMul', 'reloadMul', 'fireRateMul', 'magMul', 'spreadMul', 'meleeCooldownMul', 'respawnMul']);
export const SHIELD_CAP = 150;

export const TIERS = Object.freeze({
  COMMON: { weight: [70, 30], maxStacks: 3 },
  RARE: { weight: [24, 34], maxStacks: 2 },
  EPIC: { weight: [6, 24], maxStacks: 2 },
  LEGENDARY: { weight: [0, 12], maxStacks: 1 },
});

const c = (id, name, tier, mods, desc) => ({ id, name, tier, mods: Object.freeze(mods), desc });
export const CARDS = Object.freeze([
  c('sharpened', 'SHARPENED ROUNDS', 'COMMON', { damageMul: 1.1 }, '+10% damage'),
  c('plating', 'CERAMIC PLATING', 'COMMON', { maxHpAdd: 15 }, '+15 max health'),
  c('light_boots', 'LIGHT BOOTS', 'COMMON', { moveMul: 1.06 }, '+6% move speed'),
  c('quick_hands', 'QUICK HANDS', 'COMMON', { reloadMul: 0.85 }, '15% faster reload'),
  c('hair_trigger', 'HAIR TRIGGER', 'COMMON', { fireRateMul: 0.92 }, '8% faster fire rate'),
  c('ext_mag', 'EXTENDED MAG', 'COMMON', { magMul: 1.25 }, '+25% magazine'),
  c('steady', 'STEADY GRIP', 'COMMON', { spreadMul: 0.8 }, '20% tighter spread'),
  c('headhunter', 'HEADHUNTER', 'COMMON', { headshotMul: 1.2 }, '+20% headshot damage'),
  c('leech', 'LEECH ROUNDS', 'COMMON', { lifesteal: 0.06 }, 'Heal 6% of damage dealt'),
  c('field_medic', 'FIELD MEDIC', 'COMMON', { regenPerSec: 2 }, 'Regenerate 2 HP/s'),
  c('scavenger', 'SCAVENGER', 'COMMON', { killHeal: 20 }, 'Heal 20 on kill'),
  c('barrier', 'SPAWN BARRIER', 'COMMON', { spawnShield: 25 }, 'Spawn with 25 shield'),
  c('bladework', 'BLADEWORK', 'COMMON', { meleeCooldownMul: 0.88 }, 'Melee recovers 12% faster'),
  c('rapid_deploy', 'RAPID DEPLOY', 'COMMON', { respawnMul: 0.8 }, 'Respawn 20% sooner'),

  c('hollow_point', 'HOLLOW POINT', 'RARE', { damageMul: 1.2, spreadMul: 1.1 }, '+20% damage, wider spread'),
  c('juggernaut', 'JUGGERNAUT', 'RARE', { maxHpAdd: 40, moveMul: 0.95 }, '+40 max health, -5% speed'),
  c('sprinter', 'SPRINTER', 'RARE', { moveMul: 1.14 }, '+14% move speed'),
  c('sleight', 'SLEIGHT OF HAND', 'RARE', { reloadMul: 0.65 }, '35% faster reload'),
  c('overclock', 'OVERCLOCK', 'RARE', { fireRateMul: 0.82 }, '18% faster fire rate'),
  c('drum', 'DRUM FEED', 'RARE', { magMul: 1.6, reloadMul: 1.1 }, '+60% magazine, slower reload'),
  c('blood_pact', 'BLOOD PACT', 'RARE', { lifesteal: 0.15, maxHpAdd: -10 }, 'Heal 15% of damage, -10 max health'),
  c('trophy', 'TROPHY PLATE', 'RARE', { killShield: 40 }, '+40 shield on kill'),
  c('buckshot', 'BUCKSHOT CONVERSION', 'RARE', { extraPellets: 1, spreadMul: 1.2 }, '+1 projectile per shot'),
  c('deadeye', 'DEADEYE', 'RARE', { headshotMul: 1.5, spreadMul: 0.85 }, '+50% headshot damage'),
  c('second_wind', 'SECOND WIND', 'RARE', { killHeal: 45 }, 'Heal 45 on kill'),
  c('iron_skin', 'IRON SKIN', 'RARE', { damageTakenMul: 0.88 }, 'Take 12% less damage'),

  c('berserk', 'BERSERK', 'EPIC', { damageMul: 1.35, damageTakenMul: 1.15 }, '+35% damage, take 15% more'),
  c('colossus', 'COLOSSUS', 'EPIC', { maxHpAdd: 90, moveMul: 0.88 }, '+90 max health, -12% speed'),
  c('adrenal', 'ADRENAL SURGE', 'EPIC', { moveMul: 1.2, fireRateMul: 0.9 }, '+20% speed, 10% faster fire'),
  c('vampire', 'VAMPIRE', 'EPIC', { lifesteal: 0.25 }, 'Heal 25% of damage dealt'),
  c('shrapnel', 'SHRAPNEL BURST', 'EPIC', { killBlastDamage: 35 }, 'Kills explode for 35 damage'),
  c('scattergun', 'SCATTERGUN', 'EPIC', { extraPellets: 2, damageMul: 0.9 }, '+2 projectiles, -10% damage'),
  c('fortress', 'FORTRESS', 'EPIC', { spawnShield: 75, killShield: 25 }, '75 spawn shield, +25 on kill'),
  c('regenerator', 'REGENERATOR', 'EPIC', { regenPerSec: 6 }, 'Regenerate 6 HP/s'),
  c('duelist', 'DUELIST', 'EPIC', { meleeCooldownMul: 0.65, damageMul: 1.1 }, 'Melee 35% faster, +10% damage'),

  c('glass_cannon', 'GLASS CANNON', 'LEGENDARY', { damageMul: 1.8, maxHpAdd: -40 }, '+80% damage, -40 max health'),
  c('bullet_storm', 'BULLET STORM', 'LEGENDARY', { fireRateMul: 0.6, magMul: 2, spreadMul: 1.4 }, '40% faster fire, double mag, wild spread'),
  c('chain_reaction', 'CHAIN REACTION', 'LEGENDARY', { killBlastDamage: 70, killShield: 20 }, 'Kills explode for 70 damage'),
  c('hunger', 'ENDLESS HUNGER', 'LEGENDARY', { lifesteal: 0.4, damageTakenMul: 1.2 }, 'Heal 40% of damage, take 20% more'),
  c('overdrive', 'OVERDRIVE', 'LEGENDARY', { moveMul: 1.3, reloadMul: 0.5, fireRateMul: 0.75, damageTakenMul: 1.25 }, 'Fast everything, take 25% more damage'),
]);
export const CARD_BY_ID = new Map(CARDS.map(x => [x.id, x]));

const finite = n => typeof n === 'number' && Number.isFinite(n);
const clampStat = (k, v) => { const [lo, hi, neutral] = STAT_LIMITS[k]; return finite(v) ? Math.min(hi, Math.max(lo, v)) : neutral; };

export const neutralMods = () => { const m = {}; for (const k of Object.keys(STAT_LIMITS)) m[k] = STAT_LIMITS[k][2]; return m; };

 
export function computeMods(cardIds = []) {
  const m = neutralMods();
  for (const id of cardIds) {
    const card = CARD_BY_ID.get(id); if (!card) continue;
    for (const [k, v] of Object.entries(card.mods)) {
      if (!(k in m) || !finite(v)) continue;
      m[k] = MULTIPLY.has(k) ? m[k] * v : m[k] + v;
    }
  }
  for (const k of Object.keys(m)) m[k] = clampStat(k, m[k]);
  return m;
}

 
export function heat(elapsedMs, matchMs, kills) {
  const t = matchMs > 0 ? Math.min(1, Math.max(0, elapsedMs / matchMs)) : 0;
  return Math.min(1, t * 0.6 + Math.min(1, Math.max(0, kills) / 12) * 0.6);
}

export function tierWeight(tier, h) { const [a, b] = TIERS[tier].weight; return a + (b - a) * h; }

 
export function rollOffer(owned = [], h = 0, rng = Math.random, size = CARD_FFA.offerSize) {
  const counts = new Map(); for (const id of owned) counts.set(id, (counts.get(id) || 0) + 1);
  let pool = CARDS.filter(x => (counts.get(x.id) || 0) < TIERS[x.tier].maxStacks && tierWeight(x.tier, h) > 0);
  const out = [];
  while (out.length < size && pool.length) {
    let total = 0; for (const x of pool) total += tierWeight(x.tier, h);
    let r = rng() * total, pick = pool[pool.length - 1];
    for (const x of pool) { r -= tierWeight(x.tier, h); if (r < 0) { pick = x; break; } }
    out.push(pick.id); pool = pool.filter(x => x !== pick);
  }
  return out;
}

const TIER_RANK = { COMMON: 0, RARE: 1, EPIC: 2, LEGENDARY: 3 };
 
export function autoPick(offer) {
  let best = offer[0];
  for (const id of offer) if (TIER_RANK[CARD_BY_ID.get(id)?.tier] > TIER_RANK[CARD_BY_ID.get(best)?.tier]) best = id;
  return best;
}

 
export class CardHand {
  constructor() { this.cards = []; this.offers = []; this.serial = 0; this.mods = neutralMods(); this.shield = 0; this.regenCarry = 0; }
  get full() { return this.cards.length >= CARD_FFA.maxCards; }
  offer(now, h, rng) {
    if (this.full || this.offers.length >= CARD_FFA.maxPending) return null;
    const pending = this.offers.flatMap(o => o.cards);
    const cards = rollOffer([...this.cards, ...pending], h, rng);
    if (!cards.length) return null;
    const o = { id: ++this.serial, cards, at: now }; this.offers.push(o); return o;
  }
   
  pick(offerId, cardId) {
    const i = this.offers.findIndex(o => o.id === offerId); if (i < 0) return null;
    const o = this.offers[i]; if (!o.cards.includes(cardId) || this.full) return null;
    this.offers.splice(i, 1); this.cards.push(cardId); this.mods = computeMods(this.cards); return cardId;
  }
  expire(now) { const out = []; for (const o of [...this.offers]) if (now - o.at >= CARD_FFA.pickTimeoutMs) out.push(this.pick(o.id, autoPick(o.cards))); return out.filter(Boolean); }
  addShield(n) { if (finite(n) && n > 0) this.shield = Math.min(SHIELD_CAP, this.shield + n); }
  absorb(amount) { if (!finite(amount) || amount <= 0) return 0; const used = Math.min(this.shield, amount); this.shield -= used; return amount - used; }
  view(now) {
    const o = this.offers[0];
    return { cards: this.cards.slice(), shield: Math.round(this.shield), mods: this.mods, pending: this.offers.length,
      offer: o ? { id: o.id, cards: o.cards.slice(), expiresMs: Math.max(0, CARD_FFA.pickTimeoutMs - (now - o.at)) } : null };
  }
}
