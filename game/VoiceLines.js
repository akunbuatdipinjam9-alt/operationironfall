 
 
 
 
export const VOICE_MANIFEST_URL = new URL('../assets/audio/voice/manifest.json', import.meta.url).href;

export const VOICE_RULES = Object.freeze({
  matchStart:   { cooldown: 0,      priority: 2 },
  enemyContact: { cooldown: 60000,  priority: 1 },
  explore:      { cooldown: 120000, priority: 0 },
  afk:          { cooldown: 90000,  priority: 1 },
  afkReturn:    { cooldown: 30000,  priority: 1 },
  damageLight:  { cooldown: 25000,  priority: 1, group: 'damage' },
  damageMedium: { cooldown: 25000,  priority: 1, group: 'damage' },
  damageHeavy:  { cooldown: 20000,  priority: 2, group: 'damage' },
  criticalHp:   { cooldown: 30000,  priority: 3, interrupt: true },
  healPrompt:   { cooldown: 35000,  priority: 2 },
  die:          { cooldown: 5000,   priority: 4, interrupt: true },
});
 
export const VOICE_FALLBACK = Object.freeze({
  damageLight: ['damage'], damageMedium: ['damage', 'damageLight'], damageHeavy: ['damage', 'damageMedium'],
  criticalHp: ['damageHeavy', 'damage'],
});
export const VOICE_TIMING = Object.freeze({ gapMs: 6000, afkMs: 45000, exploreAfterMs: 75000, contactQuietMs: 25000, healPromptDelayMs: 8000, criticalFrac: 0.25 });

export class VoiceDirector {
  constructor({ manifest = null, play = () => null, character = () => 'vanguard', rng = Math.random } = {}) {
    this.manifest = manifest; this.playFn = play; this.character = character; this.rng = rng;
    this.current = null; this.until = 0; this.lastEnd = -Infinity; this.lastAt = new Map(); this.lastPick = new Map();
    this.enabled = true; this.reset(0);
  }
  reset(now) { this.lastInput = now; this.afkActive = false; this.lastCombat = now; this.wasCritical = false; this.criticalAt = 0; this.alive = true; }
  clipsFor(event) {
    const chars = this.manifest?.characters?.[this.character()] || null; if (!chars) return null;
    for (const e of [event, ...(VOICE_FALLBACK[event] || [])]) if (chars[e]?.length) return chars[e];
    return null;
  }
  playing(now) { return !!this.current && now < this.until; }
   
  trigger(event, now) {
    const rule = VOICE_RULES[event]; if (!rule || !this.enabled) return null;
    const key = rule.group || event, last = this.lastAt.get(key) ?? -Infinity;
    if (now - last < rule.cooldown) return null;
    if (this.playing(now)) { if (!rule.interrupt || rule.priority <= this.current.priority) return null; this.stop(now); }
    else if (rule.priority < 3 && now - this.lastEnd < VOICE_TIMING.gapMs) return null;
    const clips = this.clipsFor(event); if (!clips) return null;
    let i = Math.floor(this.rng() * clips.length) % clips.length;
    if (clips.length > 1 && i === this.lastPick.get(event)) i = (i + 1) % clips.length;  
    const clip = clips[i]; this.lastPick.set(event, i); this.lastAt.set(key, now);
    this.current = { event, clip, priority: rule.priority, handle: this.playFn(clip) || null };
    this.until = now + Math.max(500, (clip.duration || 3) * 1000); this.lastEnd = this.until;
    return clip;
  }
  stop(now) { try { this.current?.handle?.stop?.(); } catch (e) {} if (this.current) this.lastEnd = Math.min(this.lastEnd, now); this.current = null; this.until = 0; }

   
  matchStart(now) { this.reset(now); return this.trigger('matchStart', now); }
  input(now) { this.lastInput = now; if (this.afkActive) { this.afkActive = false; this.trigger('afkReturn', now); } }
  combat(now) { const quiet = now - this.lastCombat >= VOICE_TIMING.contactQuietMs; this.lastCombat = now; if (quiet) this.trigger('enemyContact', now); }
  damage(amount, health, maxHealth, now) {
    if (!(amount > 0)) return;
    this.combat(now);
    if (health <= 0) { this.alive = false; this.trigger('die', now); return; }
    if ((health / (maxHealth || 100)) <= VOICE_TIMING.criticalFrac) { if (!this.wasCritical) { this.wasCritical = true; this.criticalAt = now; if (this.trigger('criticalHp', now)) return; } }
    this.trigger(amount >= 35 ? 'damageHeavy' : amount >= 15 ? 'damageMedium' : 'damageLight', now);
  }
   
  tick(now, { alive = true, health = 100, maxHealth = 100 } = {}) {
    if (!alive) { this.alive = false; return; }
    if (!this.alive) { this.alive = true; this.wasCritical = false; this.lastCombat = now; }
    const frac = health / (maxHealth || 100);
    if (this.wasCritical && frac > VOICE_TIMING.criticalFrac + 0.1) this.wasCritical = false;
    if (this.wasCritical && now - this.criticalAt >= VOICE_TIMING.healPromptDelayMs) this.trigger('healPrompt', now);
    if (!this.afkActive && now - this.lastInput >= VOICE_TIMING.afkMs) { if (this.trigger('afk', now)) this.afkActive = true; }
    else if (!this.afkActive && now - this.lastCombat >= VOICE_TIMING.exploreAfterMs) this.trigger('explore', now);
  }
}

 
export function audioElementPlayer(volume = () => 0.8) {
  const base = new URL('../assets/audio/', import.meta.url);
  return clip => {
    const a = new Audio(new URL(clip.file, base).href); a.preload = 'auto'; a.volume = Math.max(0, Math.min(1, volume() * 0.9));
    a.play().catch(() => {});
    return { stop() { a.pause(); a.removeAttribute('src'); a.load(); } };
  };
}

export async function loadVoiceManifest(url = VOICE_MANIFEST_URL) {
  try { const r = await fetch(url); return r.ok ? await r.json() : null; } catch (e) { return null; }
}
