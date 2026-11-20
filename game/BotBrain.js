







export const STATES = Object.freeze(['ADVANCE', 'PATROL', 'ENGAGE', 'COVER', 'RETREAT', 'FLANK', 'SUPPRESS', 'INVESTIGATE', 'RESUPPLY']);
export const THINK_MS = 220;
export const RETREAT_MS = 3200, RETREAT_COOLDOWN_MS = 12000;


export const ROLES = Object.freeze({
  ASSAULT: { aggression: 0.8, flank: 0.15, hold: 0.1, retreatHp: 0.28, idealRange: [7, 18], suppress: 0.5 },
  FLANKER: { aggression: 0.65, flank: 0.75, hold: 0.0, retreatHp: 0.34, idealRange: [6, 15], suppress: 0.2 },
  ANCHOR: { aggression: 0.4, flank: 0.0, hold: 0.7, retreatHp: 0.3, idealRange: [5, 13], suppress: 0.6 },
  SUPPORT: { aggression: 0.5, flank: 0.1, hold: 0.35, retreatHp: 0.4, idealRange: [12, 26], suppress: 0.85 },
});

 
 
 
 
 
 
 
 
 
 
export const DIFFICULTY = Object.freeze({
  RECRUIT: { reaction: 850, aim: 1.85, memory: 2500, fov: 100, hearing: 22, burstPause: 1.55, think: 1.5, settle: 700, flinch: 1.9, hesitate: [0.35, 650],
    retreatAdj: -0.12, flankMul: 0.3, suppressMul: 0.4, strafe: 0.2, coverOnReload: false, tacticalReload: 0, medkitHp: 0, lowMagCover: 0,
    lead: 0, aimHeight: [1.0, 0.55], preaim: 0, juke: null, dodge: 0 },
  VETERAN: { reaction: 400, aim: 1.0, memory: 6000, fov: 120, hearing: 40, burstPause: 1.0, think: 1, settle: 420, flinch: 1.5, hesitate: [0, 0],
    retreatAdj: 0, flankMul: 1, suppressMul: 1, strafe: 0.55, coverOnReload: true, tacticalReload: 0.2, medkitHp: 0.4, lowMagCover: 0,
    lead: 0.75, aimHeight: [1.25, 0.3], preaim: 0.45, juke: [0.7, 1.6], dodge: 0.3 },
  ELITE: { reaction: 180, aim: 0.55, memory: 11000, fov: 150, hearing: 60, burstPause: 0.65, think: 0.6, settle: 220, flinch: 1.15, hesitate: [0, 0],
    retreatAdj: 0.12, flankMul: 1.4, suppressMul: 1.2, strafe: 0.85, coverOnReload: true, tacticalReload: 0.5, medkitHp: 0.75, lowMagCover: 0.15,
    lead: 1, aimHeight: [1.42, 0.16], preaim: 0.8, juke: [0.3, 0.75], dodge: 0.65 },
});
 
export const difficultyOf = name => DIFFICULTY[name === 'IRONMAN' ? 'ELITE' : name] || DIFFICULTY.VETERAN;

export const BURST = Object.freeze({
  AR: { shots: [3, 6], pause: 0.42 }, SMG: { shots: [5, 9], pause: 0.32 }, LMG: { shots: [7, 14], pause: 0.6 },
  SHOTGUN: { shots: [1, 2], pause: 0.25 }, SNIPER: { shots: [1, 1], pause: 0.55 }, PISTOL: { shots: [2, 4], pause: 0.36 },
});

export function createRng(seed = 1) { let s = (seed >>> 0) || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const wrap = a => { while (a > Math.PI) a -= Math.PI * 2; while (a < -Math.PI) a += Math.PI * 2; return a; };







export function perceive({ self, yaw, target, sightRange = 58, heardMsAgo = Infinity, isAttacker = false, diff = DIFFICULTY.VETERAN }) {
  const d = dist2(self, target);
  if (isAttacker) return 'hurt';
  if (d <= sightRange) {
    const bearing = Math.atan2(-(target.x - self.x), -(target.z - self.z));
    if (d < 6 || Math.abs(wrap(bearing - yaw)) <= (diff.fov * Math.PI / 180) / 2) return 'see';
  }
  if (heardMsAgo < 1500 && d <= diff.hearing) return 'hear';
  return null;
}


export function scoreTarget({ dist, los, hp = 100, isAttacker = false, engagedBy = 0, isCurrent = false }) {
  let s = (58 - dist) + (los ? 42 : -22);
  if (hp < 40) s += 18;
  if (isAttacker) s += 28;
  s -= Math.max(0, engagedBy - 1) * 14;
  if (isCurrent) s += 8;
  return s;
}


export function flankPoint(self, enemy, sign = 1, radius = 11, behind = 0.35) {
  const dx = enemy.x - self.x, dz = enemy.z - self.z, d = Math.hypot(dx, dz) || 1, fx = dx / d, fz = dz / d;
  const px = -fz * sign, pz = fx * sign;
  return { x: enemy.x + px * radius + fx * radius * behind, y: enemy.y || 0, z: enemy.z + pz * radius + fz * radius * behind };
}

export function retreatPoint(self, threat, home = null, distance = 12) {
  let ax = self.x - threat.x, az = self.z - threat.z; const d = Math.hypot(ax, az) || 1; ax /= d; az /= d;
  if (home) { const hx = home.x - self.x, hz = home.z - self.z, hd = Math.hypot(hx, hz) || 1; ax = ax * 0.55 + (hx / hd) * 0.45; az = az * 0.55 + (hz / hd) * 0.45; const n = Math.hypot(ax, az) || 1; ax /= n; az /= n; }
  return { x: self.x + ax * distance, y: self.y || 0, z: self.z + az * distance };
}


export class TeamIntel {
  constructor() { this.contacts = new Map(); }
  report(id, pos, now, by = null) { this.contacts.set(id, { x: pos.x, y: pos.y || 0, z: pos.z, t: now, by }); }
  forget(id) { this.contacts.delete(id); }

  nearest(self, now, maxAgeMs = 6000, maxDist = 70) {
    let best = null, bd = Infinity;
    for (const [id, c] of this.contacts) {
      if (now - c.t > maxAgeMs) { this.contacts.delete(id); continue; }
      const d = dist2(self, c); if (d < bd && d <= maxDist) { bd = d; best = { id, ...c, dist: d }; }
    }
    return best;
  }
  clear() { this.contacts.clear(); }
}

export class BotBrain {

  constructor({ role = 'ASSAULT', difficulty = 'VETERAN', skill = 1, seed = 1 } = {}) {
    this.role = ROLES[role] ? role : 'ASSAULT'; this.p = ROLES[this.role]; this.diff = difficultyOf(difficulty);
    this.skill = Math.max(0.5, skill); this.rng = createRng(seed * 2654435761);
    this.thinkOffset = Math.floor(this.rng() * THINK_MS);
    this.reset(0);
  }
  reset(now = 0) {
    this.state = 'ADVANCE'; this.stateSince = now; this.commitUntil = 0; this.nextThink = now + this.thinkOffset;
    this.targetId = null; this.firstSeenAt = 0; this.lastSeenAt = -1e9; this.memory = null;
    this.burstLeft = 0; this.burstPauseUntil = 0; this.flankSign = this.rng() < 0.5 ? -1 : 1; this.flankGoal = null; this.lastHurtAt = -1e9; this.noRetreatUntil = 0; this.goal = null;
  }

  due(now) { if (now < this.nextThink) return false; this.nextThink = now + THINK_MS * (this.diff.think ?? 1) / Math.min(1.6, this.skill) + this.rng() * 60; return true; }
  hurt(now) { this.lastHurtAt = now; }


  observe(now, target) {
    if (target) {
      if (this.targetId !== target.id || now - this.lastSeenAt > 900) {
        const h = this.diff.hesitate, tracked = this.diff.preaim && this.memory && this.memory.id === target.id && now - this.memory.t < Math.min(4000, this.diff.memory);
         
        this.firstSeenAt = tracked ? now - this.diff.reaction * this.diff.preaim - (this.diff.settle ?? 420) * this.diff.preaim * 2 : now + (h && h[0] && this.rng() < h[0] ? h[1] : 0);
      }
      this.targetId = target.id; this.lastSeenAt = now; this.memory = { id: target.id, x: target.x, y: target.y || 0, z: target.z, t: now };
    } else if (this.memory && now - this.memory.t > this.diff.memory) { this.memory = null; this.targetId = null; }
  }







  decide(c) {
    const now = c.now, p = this.p, hpFrac = c.maxHp > 0 ? c.hp / c.maxHp : 1;
    const mem = this.memory && now - this.memory.t <= this.diff.memory ? this.memory : null;
    const known = c.visible ? mem : (mem || c.intel || null);
    const set = (state, goal, reason, commitMs = 0) => { if (state !== this.state) { this.state = state; this.stateSince = now; } if (commitMs) this.commitUntil = now + commitMs; this.goal = goal; return { state, goal, reason }; };


    const D = this.diff, magFrac = c.magFrac ?? 1;
    if (c.reloading && D.coverOnReload !== false && (c.visible || now - this.lastHurtAt < 1500)) return set('COVER', null, 'reloading under fire');
     
    if (!c.reloading && D.lowMagCover && c.visible && magFrac <= D.lowMagCover) return { ...set('COVER', null, 'low mag, reloading behind cover'), reload: true };
    if (!c.reloading && D.tacticalReload && !c.visible && magFrac <= D.tacticalReload && now - this.lastHurtAt > 1200) { const r = this.state === 'ENGAGE' ? set('COVER', null, 'tactical reload') : { state: this.state, goal: this.goal, reason: 'tactical reload' }; return { ...r, reload: true }; }
    const outnumbered = c.enemiesNear >= c.alliesNear + 2;


    if (this.state === 'RETREAT' && now - this.stateSince > RETREAT_MS) this.noRetreatUntil = now + RETREAT_COOLDOWN_MS;
    const mayRetreat = now >= this.noRetreatUntil;
    const retreatHp = Math.max(0.08, p.retreatHp + (D.retreatAdj || 0));
    if (mayRetreat && (hpFrac <= retreatHp || (outnumbered && hpFrac < 0.6 + Math.max(0, D.retreatAdj || 0) && p.aggression < 0.7))) {
      if (known) return set('RETREAT', retreatPoint(c.self, known, c.home), hpFrac <= retreatHp ? 'low health' : 'outnumbered', 900);
      return set('COVER', null, 'low health');
    }

     
    if (D.medkitHp && c.medkit && hpFrac < D.medkitHp && !c.visible && (this.state === 'RESUPPLY' || now - this.lastHurtAt > 900)) return set('RESUPPLY', { x: c.medkit.x, y: c.medkit.y || 0, z: c.medkit.z }, 'grabbing a medkit');
    if (now < this.commitUntil && this.goal && !(c.visible && c.dist < 9)) return { state: this.state, goal: this.goal, reason: 'committed' };


    if (c.visible) {
      const wantsFlank = (c.order === 'FLANK' || this.rng() < p.flank * 0.35 * (D.flankMul ?? 1)) && c.dist > 12 && c.alliesNear >= 1 && now - this.stateSince > 1200 && this.state !== 'FLANK';
      if (wantsFlank && known) { this.flankSign = this.rng() < 0.5 ? -1 : 1; return set('FLANK', flankPoint(c.self, known, this.flankSign, 10 + this.rng() * 4), 'flanking while allies hold', 2600); }
      return set('ENGAGE', null, 'enemy in sight');
    }

    if (known) {
      const age = now - known.t;
      if (age < 1600 && c.canSuppress && this.rng() < Math.min(0.95, p.suppress * (D.suppressMul ?? 1))) return set('SUPPRESS', { x: known.x, y: known.y, z: known.z }, 'suppressing last known position');
      if (c.order === 'DEFEND' || this.rng() < p.hold) return set('COVER', null, 'holding angle');
      if (this.role === 'FLANKER' || c.order === 'FLANK') return set('FLANK', flankPoint(c.self, known, this.flankSign, 9), 'going around', 2200);
      return set('INVESTIGATE', { x: known.x, y: known.y, z: known.z }, age < 2500 ? 'pushing last known position' : 'checking a callout');
    }

    return set(c.order === 'DEFEND' ? 'PATROL' : 'ADVANCE', null, 'no contact');
  }






  canFire(now, category = 'AR') {
    const reaction = this.diff.reaction / Math.min(1.8, this.skill);
    if (now - this.firstSeenAt < reaction) return false;
    if (now < this.burstPauseUntil) return false;
    if (this.burstLeft <= 0) { const b = BURST[category] || BURST.AR; this.burstLeft = b.shots[0] + Math.floor(this.rng() * (b.shots[1] - b.shots[0] + 1)); this.burstCat = category; }
    return true;
  }
  shotFired(now) {
    if (--this.burstLeft <= 0) { const b = BURST[this.burstCat] || BURST.AR; this.burstPauseUntil = now + b.pause * 1000 * this.diff.burstPause * (0.8 + this.rng() * 0.5); }
  }




  aimError(now, o = {}) { return this.diff.aim * this.aimPenalty(now, o) / Math.min(1.6, Math.sqrt(this.skill)); }

  aimPenalty(now, { moving = 0, dist = 10 } = {}) {
    const onTarget = Math.max(0, now - this.firstSeenAt - this.diff.reaction * 0.5);
    const settle = 1 + 1.4 * Math.exp(-onTarget / (this.diff.settle ?? 420));
    const flinch = now - this.lastHurtAt < 450 ? (this.diff.flinch ?? 1.5) : 1;
    const move = 1 + Math.min(0.6, moving * 0.08);
    const far = dist > 30 ? 1 + (dist - 30) * 0.012 : 1;
    return settle * flinch * move * far;
  }
}






export function squadPicture(bots, maxFlankers = 2) {
  const engaged = new Map(); let flankers = 0;
  for (const b of bots) {
    const br = b.brain; if (!br) continue;
    if (br.targetId && (br.state === 'ENGAGE' || br.state === 'SUPPRESS')) engaged.set(br.targetId, (engaged.get(br.targetId) || 0) + 1);
    if (br.state === 'FLANK') { if (++flankers > maxFlankers) { br.state = 'ENGAGE'; br.commitUntil = 0; flankers--; } }
  }
  return { engaged, flankers };
}
