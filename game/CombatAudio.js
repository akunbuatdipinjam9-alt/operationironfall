

export const IMPACTS = Object.freeze({
  concrete: [.19, 1900, 105, .03, .32], metal: [.38, 4600, 1780, .6, .25],
  wood: [.17, 1200, 240, .17, .32], glass: [.42, 8500, 4200, .5, .21],
  dirt: [.15, 650, 75, .01, .27], water: [.3, 2800, 360, .04, .25],
  flesh: [.12, 850, 95, .02, .21], armor: [.23, 3600, 920, .36, .27],
  bookshelf: [.13, 960, 156, .09, .29], upholstery: [.095, 580, 83, .025, .24],
  mattress: [.16, 470, 66, .06, .23], marble: [.25, 3400, 930, .29, .28],
  piano: [.68, 2400, 218, .74, .26], hollowWood: [.27, 1750, 148, .43, .30],
  bench: [.22, 2300, 310, .31, .26], stone: [.18, 2550, 480, .14, .30],
  plaster: [.105, 3100, 120, .035, .27], container: [.56, 3900, 370, .65, .28],
  sandbag: [.115, 720, 72, .045, .26], sand: [.13, 1650, 61, .018, .24],
  ceramic: [.31, 6800, 2490, .51, .24], plastic: [.16, 3100, 680, .31, .26],
  carpet: [.08, 620, 106, .035, .22], tile: [.23, 5900, 1920, .38, .26],
  energy: [.3, 6200, 2300, .4, .2]
});
export const SHOTS = Object.freeze({
  pistol: [.2, 4300, 210, .05, .55], rifle: [.27, 3400, 155, .04, .6],
  smg: [.17, 5000, 230, .03, .48], shotgun: [.48, 2100, 85, .06, .7],
  sniper: [.55, 3000, 110, .06, .7], lmg: [.34, 2700, 125, .05, .64]
});
export function surfaceFor(object, face) {
  const aliases = { stone: 'concrete', brick: 'concrete', asphalt: 'concrete', sand: 'dirt', grass: 'dirt', soil: 'dirt', steel: 'metal' };
  let node = object;
  while (node) {
    const tag = String(node.userData?.surfaceType || '').toLowerCase();
    if (IMPACTS[tag] || aliases[tag]) return aliases[tag] || tag;
    node = node.parent;
  }
  const m = Array.isArray(object?.material) ? object.material[face?.materialIndex || 0] : object?.material;
  if (m?.transmission > .1 || (m?.transparent && m.opacity < .7)) return 'glass';
  return m?.metalness > .55 ? 'metal' : 'concrete';
}


export function synthesize(profile, sampleRate, variant, shot = false) {
  const [duration, cutoff, frequency, ring, level] = profile;
  const pcm = new Float32Array(Math.ceil(sampleRate * duration));
  let seed = 9137 + variant * 7919, filtered = 0, phase = 0;
  const rate = 1 + (variant - 1.5) * .025, alpha = 1 - Math.exp(-2 * Math.PI * cutoff / sampleRate);
  for (let i = 0; i < pcm.length; i++) {
    const t = i / sampleRate, u = t / duration;
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    filtered += alpha * ((seed / 2147483648 - 1) - filtered);
    phase += 2 * Math.PI * frequency * rate * (shot ? .3 + .7 * Math.exp(-t * 35) : 1) / sampleRate;
    const noise = filtered * Math.exp(-u * (shot ? 8 : 10));
    const body = Math.sin(phase) * (shot ? .48 : ring) * Math.exp(-u * 6);
    const partial = Math.sin(phase * 2.73) * ring * .28 * Math.exp(-u * 8);
    const attack = Math.min(1, t / .0007), fade = Math.min(1, (duration - t) / .012);
    pcm[i] = Math.tanh((noise + body + partial) * 1.4) * level * attack * fade;
  }
  return pcm;
}

export class CombatAudio {
  constructor(ctx) { this.ctx = ctx; this.cache = new Map(); this.active = 0; this.serial = 0; this.lastImpact = -Infinity; }
  play(kind, type, destination, gain = 1, space = "outdoor") {
    const now = this.ctx.currentTime, shot = kind === 'shot';

    if (this.active >= 20 || (!shot && now - this.lastImpact < .022)) return false;
    const profiles = shot ? SHOTS : IMPACTS, keyType = profiles[type] ? type : shot ? 'rifle' : 'concrete';
    const variant = this.serial = (this.serial + 1 + Math.floor(Math.random() * 3)) % 4;
    const key = [kind, keyType, variant, space].join(":");
    let buffer = this.cache.get(key);
    if (!buffer) {
      let pcm = synthesize(profiles[keyType], this.ctx.sampleRate, variant, shot);
      if (shot && space !== 'outdoor') {
        const taps = space === 'corridor' ? [[.047,.34],[.106,.22],[.181,.13],[.265,.07]] : [[.023,.26],[.056,.16],[.088,.08]];
        const rate = this.ctx.sampleRate;
        const wet = new Float32Array(pcm.length + Math.ceil(taps.at(-1)[0] * rate));
        wet.set(pcm);
        for (const [seconds, level] of taps) {
          const offset = Math.round(seconds * rate);
          let filtered = 0;
          for (let i = 0; i < pcm.length; i++) {
            filtered += .23 * (pcm[i] - filtered);
            wet[i + offset] += filtered * level;
          }
        }
        pcm = wet;
      }
      buffer = this.ctx.createBuffer(1, pcm.length, this.ctx.sampleRate); buffer.copyToChannel(pcm, 0); this.cache.set(key, buffer);
    }
    const dest = destination(); if (!dest) return false;
    const source = this.ctx.createBufferSource(), volume = this.ctx.createGain();
    source.buffer = buffer; volume.gain.value = Math.max(0, Math.min(1.5, gain));
    source.connect(volume); volume.connect(dest.node); this.active++;
    if (!shot) this.lastImpact = now;
    source.onended = () => { source.disconnect(); volume.disconnect(); if (dest.owned) dest.node.disconnect(); this.active--; };
    source.start(); return true;
  }
}
