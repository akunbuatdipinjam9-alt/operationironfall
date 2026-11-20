 
 
 
import { ARENA_MAPS } from '../world/ArenaMaps.js';

export const SURFACES = Object.freeze(['carpet', 'concrete', 'wet', 'dirt', 'metal']);
const MAP_SURFACE = { ANNEX: 'carpet', JUNGLE: 'dirt', DESERT: 'dirt', MOSSGRAVE: 'concrete', BRICKSPIRE: 'concrete', BLACKSITE: 'metal' };

 
function annexCell(x, z) {
  const m = ARENA_MAPS.ANNEX, { N, S } = m.grid, half = N * S / 2;
  const i = Math.floor((x + half) / S), j = Math.floor((z + half) / S);
  if (i < 0 || j < 0 || i >= N || j >= N) return null;
  return m.lights[i * N + j] || null;
}
export function surfaceAt(mapId, x, z, { wet = 0 } = {}) {
  if (mapId === 'ANNEX') return annexCell(x, z)?.wet ? 'wet' : 'carpet';
  const base = MAP_SURFACE[mapId] || 'concrete';
  return wet > 0.35 && base !== 'metal' ? 'wet' : base;
}

 
export const STEP_PROFILES = Object.freeze({
  carpet:   { thump: 70, thumpGain: 0.10, noiseType: 'lowpass',  noiseFreq: 520,  noiseQ: 0.7, noiseGain: 0.16, decay: 0.09, splash: 0 },
  concrete: { thump: 95, thumpGain: 0.12, noiseType: 'bandpass', noiseFreq: 2300, noiseQ: 1.1, noiseGain: 0.20, decay: 0.06, splash: 0 },
  wet:      { thump: 80, thumpGain: 0.09, noiseType: 'highpass', noiseFreq: 1500, noiseQ: 0.6, noiseGain: 0.22, decay: 0.16, splash: 0.18 },
  dirt:     { thump: 75, thumpGain: 0.10, noiseType: 'bandpass', noiseFreq: 900,  noiseQ: 0.8, noiseGain: 0.18, decay: 0.08, splash: 0 },
  metal:    { thump: 120, thumpGain: 0.10, noiseType: 'bandpass', noiseFreq: 3400, noiseQ: 4.0, noiseGain: 0.16, decay: 0.12, splash: 0 },
});
export function gaitGain({ sprint = false, crouch = false } = {}) { return crouch ? 0.4 : sprint ? 1.35 : 1; }

 
 
export function hearing({ blind = false } = {}) {
  return blind ? { range: 34, enemyGain: 1.45, allyGain: 0.55, crouchRange: 0.5 } : { range: 24, enemyGain: 1.0, allyGain: 0.45, crouchRange: 0.45 };
}

 
export function humAt(x, z) {
  const c = annexCell(x, z); if (!c) return { level: 0, faulty: false };
  const d = Math.hypot(x - c.x, z - c.z), level = Math.max(0.15, 1 - d / 5.7);
  return { level, faulty: !!c.faulty, distance: d };
}

 
 
 
export class FootstepTracker {
  constructor({ maxPerFrame = 3, maxPerSecond = 12 } = {}) { this.last = new Map(); this.maxPerFrame = maxPerFrame; this.maxPerSecond = maxPerSecond; this.window = []; }
  update(walkers, listener, now, { blind = false, selfTeam = null } = {}) {
    const h = hearing({ blind }), out = [], seen = new Set();
    for (const w of walkers) {
      if (!w || w.dead) { if (w) this.last.delete(w.id); continue; }
      seen.add(w.id);
      const prev = this.last.get(w.id), cur = { x: w.x, z: w.z, acc: prev?.acc || 0, t: now };
      if (prev) {
        const moved = Math.hypot(w.x - prev.x, w.z - prev.z), dt = Math.max(1, now - prev.t) / 1000, speed = moved / dt;
        if (moved < 4 && speed > 0.6) {                
          cur.acc = prev.acc + moved; const sprint = speed > 5.6, stride = sprint ? 2.0 : w.crouch ? 1.05 : 1.55;
          if (cur.acc >= stride) {
            cur.acc = 0;
            const dist = Math.hypot(w.x - listener.x, w.z - listener.z), enemy = selfTeam == null || w.team !== selfTeam;
            const range = h.range * (w.crouch ? h.crouchRange : 1);
            if (dist <= range) out.push({ id: w.id, x: w.x, y: w.y || 0, z: w.z, dist, range, sprint, crouch: !!w.crouch, enemy, gain: (enemy ? h.enemyGain : h.allyGain) * gaitGain({ sprint, crouch: w.crouch }) });
          }
        } else cur.acc = prev.acc;
      }
      this.last.set(w.id, cur);
    }
    for (const id of this.last.keys()) if (!seen.has(id)) this.last.delete(id);
    this.window = this.window.filter(t => now - t < 1000);
    const room = Math.max(0, Math.min(this.maxPerFrame, this.maxPerSecond - this.window.length));
    const pick = out.sort((a, b) => (b.enemy - a.enemy) || a.dist - b.dist).slice(0, room);
    for (let i = 0; i < pick.length; i++) this.window.push(now);
    return pick;
  }
}
