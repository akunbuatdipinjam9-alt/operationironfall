





const deep = (a, b) => { const o = { ...a }; for (const k of Object.keys(b || {})) o[k] = b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) ? deep(a[k] || {}, b[k]) : b[k]; return o; };

export const CATEGORY = Object.freeze({
  MELEE: {
    kick: { snap: 0, settle: 18, damping: .6, roll: 0, side: 0 },
    flash: { scale: 0, length: 0, color: 0xffffff, light: 0, prongs: 0 },
    tracer: { every: 1, speed: 38, length: .3, width: .025, color: 0xb7dded },
    casing: { kind: 'none', eject: [0, 0, 0], spin: 0, size: 0 },
    ads: { speed: 20 }, mass: .5, audio: { crack: 0, tail: 0, low: 0 },
  },
  HYBRID: {
    kick: { snap: .025, settle: 18, damping: .6, roll: .01, side: 0 },
    flash: { scale: 0, length: 0, color: 0xffffff, light: 0, prongs: 0 },
    tracer: { every: 1, speed: 38, length: .3, width: .025, color: 0xb7dded },
    casing: { kind: 'none', eject: [0, 0, 0], spin: 0, size: 0 },
    ads: { speed: 18 }, mass: .8, audio: { crack: .3, tail: .2, low: .4 },
  },
  AR: {
    kick: { snap: 0.055, settle: 16, damping: 0.62, roll: 0.035, side: 0.012 },
    flash: { scale: 1.0, length: 1.0, color: 0xffc46b, light: 3.6, prongs: 4 },
    tracer: { every: 1, speed: 320, length: 3.2, width: 0.016, color: 0xffd98a },
    casing: { kind: 'rifle', eject: [0.95, 1.05, 0.15], spin: 22, size: 1 },
    ads: { speed: 15 }, mass: 1.0, audio: { crack: 1.0, tail: 0.55, low: 1.0 },
  },
  SMG: {
    kick: { snap: 0.035, settle: 21, damping: 0.55, roll: 0.025, side: 0.016 },
    flash: { scale: 0.75, length: 0.75, color: 0xffcf80, light: 2.8, prongs: 4 },
    tracer: { every: 2, speed: 300, length: 2.4, width: 0.012, color: 0xffd98a },
    casing: { kind: 'pistol', eject: [1.0, 0.9, 0.1], spin: 26, size: 0.8 },
    ads: { speed: 18 }, mass: 0.75, audio: { crack: 0.8, tail: 0.4, low: 0.75 },
  },
  SHOTGUN: {
    kick: { snap: 0.16, settle: 10, damping: 0.7, roll: 0.07, side: 0.02 },
    flash: { scale: 1.55, length: 1.25, color: 0xffb347, light: 5.0, prongs: 6 },
    tracer: { every: 1, speed: 260, length: 1.6, width: 0.01, color: 0xffc070, visiblePellets: 4 },
    casing: { kind: 'shell', eject: [0.8, 1.3, 0.25], spin: 14, size: 1 },
    ads: { speed: 14 }, mass: 1.2, audio: { crack: 1.25, tail: 0.8, low: 1.5 },
  },
  SNIPER: {
    kick: { snap: 0.2, settle: 8, damping: 0.72, roll: 0.06, side: 0.008 },
    flash: { scale: 1.6, length: 1.6, color: 0xffd28a, light: 5.5, prongs: 4 },
    tracer: { every: 1, speed: 480, length: 6, width: 0.022, color: 0xfff0b8 },
    casing: { kind: 'rifle', eject: [0.7, 1.2, 0.2], spin: 12, size: 1.35 },
    ads: { speed: 10 }, mass: 1.35, audio: { crack: 1.5, tail: 1.1, low: 1.35 },
  },
  LMG: {
    kick: { snap: 0.07, settle: 13, damping: 0.66, roll: 0.03, side: 0.022 },
    flash: { scale: 1.2, length: 1.15, color: 0xffbd5e, light: 4.0, prongs: 4 },
    tracer: { every: 1, speed: 330, length: 3.8, width: 0.02, color: 0xff9a4a },
    casing: { kind: 'rifle', eject: [0.6, 0.4, 0.1], spin: 18, size: 1, link: true },
    ads: { speed: 11 }, mass: 1.6, audio: { crack: 1.1, tail: 0.7, low: 1.25 },
  },
  PISTOL: {
    kick: { snap: 0.09, settle: 18, damping: 0.6, roll: 0.05, side: 0.01 },
    flash: { scale: 0.7, length: 0.6, color: 0xffd08a, light: 2.6, prongs: 4 },
    tracer: { every: 2, speed: 280, length: 1.8, width: 0.011, color: 0xffd98a },
    casing: { kind: 'pistol', eject: [1.1, 1.2, 0.2], spin: 28, size: 0.8 },
    ads: { speed: 19 }, mass: 0.55, audio: { crack: 0.85, tail: 0.35, low: 0.8 },
  },
});


export const WEAPON = Object.freeze({
  'DESERT EAGLE': { kick: { snap: 0.16, settle: 12 }, flash: { scale: 1.1 }, casing: { size: 1.15 }, audio: { crack: 1.2, low: 1.2 } },
  'BARRETT M82': { kick: { snap: 0.26, settle: 6.5 }, flash: { scale: 2.1, length: 2.0, light: 7 }, casing: { size: 1.7 }, audio: { crack: 1.8, tail: 1.4, low: 1.8 } },
  'AWM': { flash: { scale: 1.8 }, audio: { tail: 1.25 } },
  'P90': { casing: { eject: [0.05, -1.2, 0.0] } },
  'MP7': { flash: { scale: 0.6 } },
  'UMP45': { flash: { scale: 0.35, light: 1.2 }, audio: { crack: 0.55, tail: 0.25 } },
  'AA-12': { kick: { snap: 0.11, settle: 13 } },
  'M249': { tracer: { color: 0xff8a3a } },
  'PKP PECHENEG': { tracer: { color: 0xff7a2a } },
  'RPK-16': { tracer: { color: 0xff9a4a } },
  'MK14 EBR': { kick: { snap: 0.11 } },
});

const cache = new Map();

export function feelFor(w) {
  const key = w?.name || 'AR';
  if (cache.has(key)) return cache.get(key);
  const f = deep(CATEGORY[w?.category] || CATEGORY.AR, WEAPON[key] || {});
  cache.set(key, f); return f;
}

export function tracerOnShot(w, n) { const e = feelFor(w).tracer.every || 1; return n <= 1 || n % e === 0; }






export class RecoilSpring {
  constructor() { this.pitch = 0; this.roll = 0; this.yaw = 0; this.back = 0; this.vp = 0; this.vr = 0; this.vy = 0; this.vb = 0; this.k = 16; this.d = 0.62; }

  impulse(feel, scale = 1, rnd = Math.random()) {
    const k = feel.kick; this.k = k.settle; this.d = k.damping;
    this.vp += k.snap * k.settle * scale;
    this.vr += (rnd < 0.5 ? -1 : 1) * k.roll * k.settle * scale;
    this.vy += (rnd - 0.5) * 2 * k.side * k.settle * scale;
    this.vb += k.snap * 0.9 * k.settle * scale / (feel.mass || 1);
  }

  step(dt) {
    let t = Math.min(0.1, Math.max(0, dt));
    while (t > 1e-6) {
      const h = Math.min(t, 1 / 120); t -= h;
      const k = this.k * this.k, c = 2 * this.d * this.k;
      this.vp += (-k * this.pitch - c * this.vp) * h; this.pitch += this.vp * h;
      this.vr += (-k * this.roll - c * this.vr) * h; this.roll += this.vr * h;
      this.vy += (-k * this.yaw - c * this.vy) * h; this.yaw += this.vy * h;
      this.vb += (-k * this.back - c * this.vb) * h; this.back += this.vb * h;
    }
    return this;
  }
  reset() { this.pitch = this.roll = this.yaw = this.back = this.vp = this.vr = this.vy = this.vb = 0; }
}


export const IMPACT = Object.freeze({
  metal: { sparks: 9, spark: 0xffc46b, debris: 0, dust: 0, decal: 0x1a1d22, decalSize: 0.07, sound: 'metal' },
  concrete: { sparks: 2, spark: 0xffd9a0, debris: 6, debrisColor: 0x8e8a82, dust: 1, dustColor: 0xa8a29e, decal: 0x26241f, decalSize: 0.085, sound: 'concrete' },
  wood: { sparks: 0, debris: 7, debrisColor: 0x8a5a2b, dust: 1, dustColor: 0x9c7a55, decal: 0x2a1a0e, decalSize: 0.075, sound: 'wood' },
  dirt: { sparks: 0, debris: 8, debrisColor: 0x6b5233, dust: 2, dustColor: 0x8a7354, decal: 0x2a2014, decalSize: 0.1, sound: 'dirt' },
  sand: { sparks: 0, debris: 6, debrisColor: 0xc9a66b, dust: 3, dustColor: 0xd9c08f, decal: 0x7a6440, decalSize: 0.11, sound: 'dirt' },
  glass: { sparks: 0, debris: 9, debrisColor: 0xbfe6ff, dust: 0, decal: 0x9fb4c2, decalSize: 0.06, sound: 'glass' },
  water: { sparks: 0, debris: 10, debrisColor: 0xb7d6e6, dust: 1, dustColor: 0xdbeaf2, decal: 0, sound: 'water' },
  flesh: { sparks: 0, debris: 9, debrisColor: 0xcc2434, dust: 3, dustColor: 0xaa192c, particleScale: 1.55, decal: 0, sound: 'flesh' },
  armor: { sparks: 7, spark: 0xffb070, debris: 2, debrisColor: 0x334155, dust: 0, decal: 0, sound: 'metal' },
  energy: { sparks: 8, spark: 0x7dd3fc, debris: 0, dust: 1, dustColor: 0x5ad8ff, decal: 0, sound: 'metal' },
});

export function impactMaterial(surfaceType, hexColor) {
  const s = String(surfaceType || '').toLowerCase();
  if (IMPACT[s]) return s;
  if (s === 'grass' || s === 'mud' || s === 'ground' || s === 'jungle') return 'dirt';
  if (s === 'asphalt' || s === 'stone' || s === 'brick' || s === 'plaster' || s === 'tile') return 'concrete';
  if (s === 'bot' || s === 'body') return 'flesh';
  if (hexColor === 0x5ad8ff) return 'energy';
  return 'metal';
}

export function bloodIntensity(hpLost) {
  return Number.isFinite(hpLost) ? Math.sqrt(Math.min(1, Math.max(0, hpLost / 80))) : 0;
}
