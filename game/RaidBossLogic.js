















export const RAID = Object.freeze({
  id: 'WARDEN',
  bossName: 'WARDEN MK-IV',
  baseHealth: 7000,
  healthPerExtraHuman: 4000,
  timeLimitSec: 480,
  livesPerHuman: 3,
  allyBotDamageScale: 0.5,
  phaseThresholds: [0.66, 0.33],
  body: { radius: 1.55, height: 2.0 },
  core: { radius: 0.6, height: 2.75, forward: 1.3, multiplier: 2 },

  drone: { name: 'DRONE WARDEN', health: 140, radius: 0.55, height: 2.6, speed: 5.2, range: 18, damage: 13, cooldown: 1.0,
    boltSpeed: 21, boltRadius: 0.3, boltLife: 2.2, lockBots: 3, lockPlayers: 1, relock: 1.6 },
  attacks: {
    SLAM: { telegraph: 1.35, radius: 7.5, damage: 32, recover: 1.1 },
    BARRAGE: { telegraph: 0.9, orbs: [6, 9, 12], interval: 0.13, speed: 17, radius: 0.85, damage: 12, recover: 0.9, life: 3.2 },
    SWEEP: { telegraph: 1.15, duration: 1.5, arc: Math.PI * 0.55, range: 30, tick: 0.2, damage: 9, recover: 1.0 },
    DRONES: { telegraph: 1.0, count: 3, recover: 0.8 },
    SHOCKWAVE: { telegraph: 2.4, radius: 12, damage: 22 },
  },
  phaseAttacks: { 1: ['SLAM', 'BARRAGE'], 2: ['SLAM', 'BARRAGE', 'SWEEP', 'DRONES'], 3: ['SLAM', 'BARRAGE', 'SWEEP', 'DRONES'] },
  labels: { SLAM: 'WARDEN SLAM', BARRAGE: 'WARDEN ORB', SWEEP: 'WARDEN BEAM', SHOCKWAVE: 'WARDEN SHOCKWAVE', DRONE: 'DRONE WARDEN' },
});

export const SYIRIL = Object.freeze({
  id: 'SYIRIL',
  bossName: 'SYIRIL',
  baseHealth: 20000,
  healthPerExtraHuman: 0,
  timeLimitSec: 600,
  livesPerHuman: 3,
  allyBotDamageScale: 0.5,
  phaseThresholds: [0.66, 0.33],
  body: { radius: 2.4, height: 3.2 },
  core: { radius: 0.75, height: 5.45, forward: 1.15, multiplier: 2 },
  alien: { name: 'ALIEN', health: 42, radius: 0.5, height: 1.0, speed: 5.4, range: 1.9, damage: 10, cooldown: 0.9 },
  attacks: {
    SLAM: { telegraph: 1.4, radius: 8.5, damage: 34, recover: 1.1 },
    SHARKS: { telegraph: 1.3, count: [2, 3, 4], speed: 16, width: 1.5, range: 34, damage: 24, recover: 1.0 },
    METEOR: { telegraph: 1.8, count: [2, 3, 4], radius: 4.2, damage: 30, recover: 0.9, height: 38 },
    ALIENS: { telegraph: 1.1, count: [3, 3, 4], recover: 0.8 },
    SHOCKWAVE: { telegraph: 2.4, radius: 13, damage: 24 },
  },
  phaseAttacks: { 1: ['SLAM', 'SHARKS', 'METEOR'], 2: ['SLAM', 'SHARKS', 'METEOR', 'ALIENS'], 3: ['SLAM', 'SHARKS', 'METEOR', 'ALIENS'] },
  labels: { SLAM: 'SYIRIL SMASH', SHARKS: 'SYIRIL SHARK', METEOR: 'SYIRIL METEOR', SHOCKWAVE: 'SYIRIL ROAR', ALIEN: 'ALIEN SABER' },
});

export const RAID_BOSSES = Object.freeze({ WARDEN: RAID, SYIRIL });
export const RAID_BOSS_IDS = Object.freeze(Object.keys(RAID_BOSSES));
export const bossConfig = id => RAID_BOSSES[id] || RAID;
const PHASE_SCALE = { 1: 1, 2: 1.15, 3: 1.3 };

export function raidBossHealth(humans = 1, boss = 'WARDEN') { const c = bossConfig(boss); return c.baseHealth + Math.max(0, humans - 1) * c.healthPerExtraHuman; }

function raySphere(o, d, c, r, max) {
  const ox = o.x - c.x, oy = o.y - c.y, oz = o.z - c.z;
  const b = ox * d.x + oy * d.y + oz * d.z, cc = ox * ox + oy * oy + oz * oz - r * r, h = b * b - cc;
  if (h < 0) return null;
  const t = -b - Math.sqrt(h);
  return t >= 0 && t <= max ? t : (cc < 0 ? 0 : null);
}
const angleDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return d; };
const r2 = v => +v.toFixed(2);

export class RaidBossSim {










  constructor({ boss = 'WARDEN', x = 0, y = 0, z = 0, humans = 1, canStand = () => true, canFly = null, lineOfSight = () => true, rng = Math.random, groundAt = () => y } = {}) {
    this.cfg = bossConfig(boss); this.boss = this.cfg.id;
    this.x = x; this.y = y; this.z = z; this.yaw = 0;
    this.maxHealth = raidBossHealth(humans, this.boss); this.health = this.maxHealth;
    this.phase = 1; this.state = 'INTRO'; this.stateTime = 2.2; this.attack = null; this.attackData = null;
    this.canStand = canStand; this.canFly = canFly || canStand; this.lineOfSight = lineOfSight; this.rng = rng; this.groundAt = groundAt;
    this.targetId = null; this.retarget = 0; this.cooldown = 1.2; this.lastAttack = null;
    this.orbs = []; this.drones = []; this.bolts = []; this.sharks = []; this.serial = 1; this.time = 0; this.damageLog = new Map();
    this.shielded = true;
  }
  get dead() { return this.state === 'DEAD'; }
  get scale() { return PHASE_SCALE[this.phase]; }
  get name() { return this.cfg.bossName; }
  minionCfg(m) { return m.type === 'alien' ? SYIRIL.alien : RAID.drone; }


  hitTest(origin, dir, maxDist = 200) {
    let best = null;
    const consider = (t, hit) => { if (t !== null && (!best || t < best.t)) best = { t, ...hit }; };
    if (!this.dead) {
      consider(raySphere(origin, dir, this.corePosition(), this.cfg.core.radius, maxDist), { kind: 'boss', weakpoint: true });
      consider(raySphere(origin, dir, { x: this.x, y: this.y + this.cfg.body.height, z: this.z }, this.cfg.body.radius, maxDist), { kind: 'boss', weakpoint: false });
      if (this.boss === 'SYIRIL') consider(raySphere(origin, dir, { x: this.x, y: this.y + 1.2, z: this.z }, 1.5, maxDist), { kind: 'boss', weakpoint: false });
    }
    for (const d of this.drones) { const c = this.minionCfg(d); consider(raySphere(origin, dir, { x: d.x, y: d.y + (d.type === 'alien' ? c.height : 0), z: d.z }, c.radius + (d.type === 'alien' ? 0.15 : 0), maxDist), { kind: 'drone', id: d.id }); }
    return best;
  }
  corePosition() { const c = this.cfg.core; return { x: this.x - Math.sin(this.yaw) * c.forward, y: this.y + c.height, z: this.z - Math.cos(this.yaw) * c.forward }; }

  overlaps(p, r = 0.1) {
    if (!this.dead) {
      const c = { x: this.x, y: this.y + this.cfg.body.height, z: this.z };
      if ((p.x - c.x) ** 2 + (p.y - c.y) ** 2 + (p.z - c.z) ** 2 <= (this.cfg.body.radius + r) ** 2) return { kind: 'boss', weakpoint: false };
    }
    for (const d of this.drones) { const c = this.minionCfg(d), cy = d.y + (d.type === 'alien' ? c.height : 0); if ((p.x - d.x) ** 2 + (p.y - cy) ** 2 + (p.z - d.z) ** 2 <= (c.radius + r + (d.type === 'alien' ? 0.25 : 0)) ** 2) return { kind: 'drone', id: d.id }; }
    return null;
  }


  damage(amount, sourceId = 'unknown', { weakpoint = false, droneId = null } = {}, events = []) {
    if (droneId !== null) {
      const d = this.drones.find(v => v.id === droneId); if (!d) return { applied: 0 };
      const applied = Math.min(d.health, amount); d.health -= applied;
      if (d.health <= 0) { this.drones = this.drones.filter(v => v !== d); events.push({ type: 'droneDown', id: d.id, minion: d.type, by: sourceId, x: d.x, y: d.y, z: d.z }); }
      return { applied, killed: d.health <= 0, drone: true };
    }
    if (this.dead || this.shielded) return { applied: 0, shielded: this.shielded };
    const applied = Math.min(this.health, Math.round(amount * (weakpoint ? this.cfg.core.multiplier : 1)));
    this.health -= applied; this.damageLog.set(sourceId, (this.damageLog.get(sourceId) || 0) + applied);
    const frac = this.health / this.maxHealth, th = this.cfg.phaseThresholds;
    const nextPhase = frac <= th[1] ? 3 : frac <= th[0] ? 2 : 1;
    if (this.health <= 0) { this.setState('DEAD', 0); this.orbs.length = 0; this.drones.length = 0; this.bolts.length = 0; this.sharks.length = 0; events.push({ type: 'bossDefeated', by: sourceId, boss: this.boss }); return { applied, killed: true }; }
    if (nextPhase > this.phase) {
      this.phase = nextPhase; this.orbs.length = 0;
      this.beginAttack('SHOCKWAVE', events);
      events.push({ type: 'phase', phase: this.phase });
    }
    return { applied, killed: false, phase: this.phase };
  }

  setState(state, time) { this.state = state; this.stateTime = time; }

  pickTarget(targets) {
    const alive = targets.filter(t => t.alive);
    if (!alive.length) return null;
    let current = alive.find(t => t.id === this.targetId);
    if (!current || this.retarget <= 0) {

      const eye = { x: this.x, y: this.y + 3, z: this.z };
      const scored = alive.map(t => ({ t, d: Math.hypot(t.x - this.x, t.z - this.z), los: this.lineOfSight(eye, { x: t.x, y: t.y + 1.2, z: t.z }) }));
      scored.sort((a, b) => (b.los - a.los) || (a.d - b.d));
      current = scored[0].t; this.targetId = current.id; this.retarget = 6;
    }
    return current;
  }

  beginAttack(name, events, targets = []) {
    const a = this.cfg.attacks[name];
    this.attack = name; this.shielded = name === 'SHOCKWAVE';
    this.attackData = { name, fired: 0, sweepStart: this.yaw, tick: 0, origin: { x: this.x, y: this.y, z: this.z } };
    const ev = { type: 'telegraph', boss: this.boss, attack: name, duration: a.telegraph, x: this.x, y: this.y, z: this.z, yaw: this.yaw, radius: a.radius || 0, arc: a.arc || 0, range: a.range || 0, phase: this.phase };
    const alive = targets.filter(t => t.alive);
    if (name === 'SHARKS') {

      const n = a.count[this.phase - 1], sorted = alive.slice().sort((p, q) => Math.hypot(p.x - this.x, p.z - this.z) - Math.hypot(q.x - this.x, q.z - this.z));
      const lines = [];
      for (let i = 0; i < n; i++) {
        const t = sorted[i % Math.max(1, sorted.length)];
        let yaw = t ? Math.atan2(-(t.x - this.x), -(t.z - this.z)) : this.yaw;
        if (i >= sorted.length) yaw += (i % 2 ? 1 : -1) * (0.32 + 0.12 * i);
        const sx = this.x - Math.sin(yaw) * 2.6, sz = this.z - Math.cos(yaw) * 2.6;
        lines.push({ x: r2(sx), z: r2(sz), yaw: +yaw.toFixed(3), len: a.range });
      }
      this.attackData.lines = lines; ev.lines = lines; ev.width = a.width;
    } else if (name === 'METEOR') {
      const n = a.count[this.phase - 1], pts = [];
      for (let i = 0; i < n; i++) {
        const t = alive[i % Math.max(1, alive.length)];
        const jitter = i >= alive.length ? 3.5 : 0.6, base = t || { x: this.x, z: this.z, y: this.y };
        const px = base.x + (this.rng() - 0.5) * 2 * jitter, pz = base.z + (this.rng() - 0.5) * 2 * jitter;
        pts.push({ x: r2(px), y: r2(this.groundAt(px, pz)), z: r2(pz) });
      }
      this.attackData.points = pts; ev.points = pts;
    }
    this.setState('TELEGRAPH', a.telegraph);
    events.push(ev);
  }

  chooseAttack(target) {
    const all = this.cfg.phaseAttacks[this.phase];
    const pool = all.filter(n => n !== this.lastAttack || all.length === 1);
    const dist = Math.hypot(target.x - this.x, target.z - this.z);
    const minions = this.drones.length;

    const weighted = pool.flatMap(n => (n === 'SLAM' ? (dist < 9.5 ? [n, n, n] : []) : (n === 'DRONES' || n === 'ALIENS') ? (minions ? [] : [n, n]) : [n, n]));
    const list = weighted.length ? weighted : pool.filter(n => n !== 'DRONES' && n !== 'ALIENS').concat(pool.length ? [] : all);
    const pick = list.length ? list : all;
    return pick[Math.floor(this.rng() * pick.length) % pick.length];
  }








  update(dt, targets) {
    const events = [];
    this.time += dt;
    if (this.dead) return events;
    this.retarget -= dt; this.cooldown -= dt; this.stateTime -= dt;
    const target = this.pickTarget(targets);
    this.updateOrbs(dt, targets, events);
    this.updateMinions(dt, targets, events);
    this.updateBolts(dt, targets, events);
    this.updateSharks(dt, targets, events);

    if (this.state === 'INTRO') { if (this.stateTime <= 0) { this.shielded = false; this.setState('CHASE', 0); events.push({ type: 'state', state: 'CHASE' }); } return events; }
    if (!target) { this.setState('CHASE', 0); return events; }
    const dx = target.x - this.x, dz = target.z - this.z, dist = Math.hypot(dx, dz) || 1;
    const wantYaw = Math.atan2(-dx, -dz);

    if (this.state === 'CHASE') {
      this.yaw += angleDiff(wantYaw, this.yaw) * Math.min(1, dt * 3);
      const speed = (this.phase === 3 ? 4.3 : 3.3) * (this.boss === 'SYIRIL' ? 0.9 : 1);
      const desired = dist > 13 ? 1 : dist < 6 ? -0.6 : 0;
      if (desired) this.move((dx / dist) * speed * desired * dt, (dz / dist) * speed * desired * dt);
      if (this.cooldown <= 0) this.beginAttack(this.chooseAttack({ x: target.x, z: target.z }), events, targets);
      return events;
    }
    if (this.state === 'TELEGRAPH') {
      if (this.attack !== 'SWEEP' && this.attack !== 'SHARKS') this.yaw += angleDiff(wantYaw, this.yaw) * Math.min(1, dt * 2.2);
      else if (this.attack === 'SWEEP') this.attackData.sweepStart = this.yaw;
      if (this.stateTime <= 0) {
        const a = this.cfg.attacks[this.attack];
        events.push({ type: 'attackStart', boss: this.boss, attack: this.attack, x: this.x, y: this.y, z: this.z, yaw: this.yaw });
        if (this.attack === 'SLAM' || this.attack === 'SHOCKWAVE') {
          for (const t of targets) if (t.alive && Math.hypot(t.x - this.x, t.z - this.z) <= a.radius && Math.abs(t.y - this.y) < 3)
            events.push({ type: 'hit', targetId: t.id, damage: Math.round(a.damage * this.scale), attack: this.attack });
          this.shielded = false; this.finishAttack(a.recover ?? 1.4); return events;
        }
        if (this.attack === 'DRONES') {
          for (let i = 0; i < a.count; i++) {
            const ang = this.yaw + (i - (a.count - 1) / 2) * 0.9, d = { id: 'drone-' + this.serial++, type: 'drone', x: this.x - Math.sin(ang) * 2.5, y: this.y + RAID.drone.height + 0.6, z: this.z - Math.cos(ang) * 2.5, health: RAID.drone.health, cooldown: 1.2, locks: [], relock: 0, shot: 0 };
            this.drones.push(d); events.push({ type: 'droneSpawn', id: d.id, minion: 'drone', x: d.x, y: d.y, z: d.z });
          }
          this.finishAttack(a.recover); return events;
        }
        if (this.attack === 'ALIENS') {
          const n = a.count[this.phase - 1], A = SYIRIL.alien;
          for (let i = 0; i < n; i++) {
            const ang = this.yaw + (i - (n - 1) / 2) * 0.8; let ax = this.x - Math.sin(ang) * 3.4, az = this.z - Math.cos(ang) * 3.4;
            if (!this.canStand(ax, az)) { ax = this.x; az = this.z; }
            const d = { id: 'alien-' + this.serial++, type: 'alien', x: ax, y: this.groundAt(ax, az), z: az, yaw: ang, health: A.health, cooldown: 0.8, swing: 0 };
            this.drones.push(d); events.push({ type: 'alienSpawn', id: d.id, minion: 'alien', x: d.x, y: d.y, z: d.z });
          }
          this.finishAttack(a.recover); return events;
        }
        if (this.attack === 'SHARKS') {
          for (const L of this.attackData.lines) {
            const s = { id: 'shark-' + this.serial++, x: L.x, z: L.z, y: this.groundAt(L.x, L.z), yaw: L.yaw, travelled: 0, len: L.len, hit: new Set() };
            this.sharks.push(s); events.push({ type: 'shark', id: s.id, x: s.x, y: s.y, z: s.z, yaw: s.yaw, len: s.len });
          }
          this.finishAttack(a.recover); return events;
        }
        if (this.attack === 'METEOR') {
          for (const p of this.attackData.points) {
            events.push({ type: 'meteorImpact', x: p.x, y: p.y, z: p.z, radius: a.radius });
            for (const t of targets) if (t.alive && Math.hypot(t.x - p.x, t.z - p.z) <= a.radius && Math.abs(t.y - p.y) < 4)
              events.push({ type: 'hit', targetId: t.id, damage: Math.round(a.damage * this.scale), attack: 'METEOR', from: { x: p.x, y: p.y + 6, z: p.z } });
          }
          this.finishAttack(a.recover); return events;
        }
        this.setState('ATTACK', this.attack === 'SWEEP' ? a.duration : a.orbs[this.phase - 1] * a.interval);
      }
      return events;
    }
    if (this.state === 'ATTACK') {
      const a = this.cfg.attacks[this.attack], d = this.attackData;
      if (this.attack === 'BARRAGE') {
        this.yaw += angleDiff(wantYaw, this.yaw) * Math.min(1, dt * 2);
        const total = a.orbs[this.phase - 1], due = Math.min(total, Math.floor((a.orbs[this.phase - 1] * a.interval - this.stateTime) / a.interval) + 1);
        while (d.fired < due) {
          const spread = (d.fired - (total - 1) / 2) * 0.07;
          const ty = target.y + 1.1, oy = this.y + this.cfg.core.height;
          const ang = Math.atan2(-dx, -dz) + spread, horiz = dist;
          const vy = (ty - oy) / Math.max(horiz, 1);
          const len = Math.hypot(1, vy);
          const orb = { id: 'orb-' + this.serial++, x: this.x, y: oy, z: this.z, vx: -Math.sin(ang) / len * a.speed, vy: vy / len * a.speed, vz: -Math.cos(ang) / len * a.speed, life: a.life };
          this.orbs.push(orb); events.push({ type: 'orb', ...orb }); d.fired++;
        }
      } else if (this.attack === 'SWEEP') {
        const progress = 1 - Math.max(0, this.stateTime) / a.duration;
        this.yaw = d.sweepStart - a.arc / 2 + a.arc * progress;
        d.tick -= dt;
        if (d.tick <= 0) {
          d.tick = a.tick;
          const eye = { x: this.x, y: this.y + this.cfg.core.height, z: this.z };
          for (const t of targets) {
            if (!t.alive) continue;
            const tx = t.x - this.x, tz = t.z - this.z, td = Math.hypot(tx, tz);
            if (td > a.range) continue;
            if (Math.abs(angleDiff(Math.atan2(-tx, -tz), this.yaw)) < 0.09 + 0.9 / Math.max(td, 1) && this.lineOfSight(eye, { x: t.x, y: t.y + 1.2, z: t.z }))
              events.push({ type: 'hit', targetId: t.id, damage: Math.round(a.damage * this.scale), attack: 'SWEEP' });
          }
        }
      }
      if (this.stateTime <= 0) this.finishAttack(a.recover);
      return events;
    }
    if (this.state === 'RECOVER' && this.stateTime <= 0) { this.setState('CHASE', 0); events.push({ type: 'state', state: 'CHASE' }); }
    return events;
  }

  finishAttack(recover) {
    this.lastAttack = this.attack; this.attack = null; this.attackData = null; this.shielded = false;
    this.cooldown = (this.phase === 3 ? 1.6 : 2.4) + this.rng() * 1.2;
    this.setState('RECOVER', recover);
  }

  move(mx, mz) {
    const nx = this.x + mx, nz = this.z + mz;
    if (this.canStand(nx, nz)) { this.x = nx; this.z = nz; }
    else if (this.canStand(nx, this.z)) this.x = nx;
    else if (this.canStand(this.x, nz)) this.z = nz;
    this.y = this.groundAt(this.x, this.z);
  }

  updateOrbs(dt, targets, events) {
    const a = RAID.attacks.BARRAGE;
    for (const o of this.orbs) {
      const px = o.x, py = o.y, pz = o.z;
      o.x += o.vx * dt; o.y += o.vy * dt; o.z += o.vz * dt; o.life -= dt;
      if (!this.lineOfSight({ x: px, y: py, z: pz }, { x: o.x, y: o.y, z: o.z })) { o.life = 0; events.push({ type: 'orbEnd', id: o.id, x: o.x, y: o.y, z: o.z }); continue; }
      for (const t of targets) {
        if (!t.alive) continue;
        if ((t.x - o.x) ** 2 + (t.y + 1.1 - o.y) ** 2 + (t.z - o.z) ** 2 <= (a.radius + 0.35) ** 2) {
          events.push({ type: 'hit', targetId: t.id, damage: Math.round(a.damage * this.scale), attack: 'BARRAGE' });
          events.push({ type: 'orbEnd', id: o.id, x: o.x, y: o.y, z: o.z }); o.life = 0; break;
        }
      }
      if (o.life > 0 && o.y < this.y - 1) { o.life = 0; events.push({ type: 'orbEnd', id: o.id, x: o.x, y: o.y, z: o.z }); }
    }
    this.orbs = this.orbs.filter(o => o.life > 0);
  }





  acquireLocks(d, targets, events) {
    const cfg = RAID.drone, eye = { x: d.x, y: d.y, z: d.z };
    const visible = targets.filter(t => t.alive && Math.hypot(t.x - d.x, t.z - d.z) <= cfg.range && this.lineOfSight(eye, { x: t.x, y: t.y + 1.2, z: t.z }))
      .sort((p, q) => Math.hypot(p.x - d.x, p.z - d.z) - Math.hypot(q.x - d.x, q.z - d.z));
    const humans = visible.filter(t => t.kind === 'human'), bots = visible.filter(t => t.kind !== 'human');
    const locks = humans.length ? humans.slice(0, cfg.lockPlayers) : bots.slice(0, cfg.lockBots);
    const ids = locks.map(t => t.id);
    if (ids.join('|') !== d.locks.join('|')) { d.locks = ids; events.push({ type: 'droneLock', id: d.id, targets: ids }); }
    d.relock = cfg.relock;
  }

  updateMinions(dt, targets, events) {
    const alive = targets.filter(t => t.alive);
    for (const d of this.drones) {
      if (d.type === 'alien') { this.updateAlien(d, dt, alive, events); continue; }
      const cfg = RAID.drone;
      d.relock -= dt;
      if (d.relock <= 0 || d.locks.some(id => !alive.find(t => t.id === id))) this.acquireLocks(d, targets, events);

      let goal = alive.find(t => t.id === d.locks[0]);
      if (!goal && alive.length) { let bd = Infinity; for (const t of alive) { const dd = Math.hypot(t.x - d.x, t.z - d.z); if (dd < bd) { bd = dd; goal = t; } } }
      if (goal) { const gd = Math.hypot(goal.x - d.x, goal.z - d.z) || 1; if (gd > cfg.range * 0.6 || !d.locks.length) { const nx = d.x + (goal.x - d.x) / gd * cfg.speed * dt, nz = d.z + (goal.z - d.z) / gd * cfg.speed * dt; if (this.canFly(nx, nz)) { d.x = nx; d.z = nz; } } }
      d.y += ((this.groundAt(d.x, d.z) + cfg.height) - d.y) * Math.min(1, dt * 2);
      d.cooldown -= dt;
      if (d.cooldown <= 0 && d.locks.length) {
        const t = alive.find(v => v.id === d.locks[d.shot % d.locks.length]); d.shot++;
        if (t && this.lineOfSight({ x: d.x, y: d.y, z: d.z }, { x: t.x, y: t.y + 1.2, z: t.z })) {
          const tx = t.x - d.x, ty = t.y + 1.15 - d.y, tz = t.z - d.z, len = Math.hypot(tx, ty, tz) || 1;
          const b = { id: 'bolt-' + this.serial++, from: d.id, x: d.x, y: d.y - 0.2, z: d.z, vx: tx / len * cfg.boltSpeed, vy: ty / len * cfg.boltSpeed, vz: tz / len * cfg.boltSpeed, life: cfg.boltLife, target: t.id };
          this.bolts.push(b); events.push({ type: 'bolt', id: b.id, from: d.id, x: r2(b.x), y: r2(b.y), z: r2(b.z), vx: r2(b.vx), vy: r2(b.vy), vz: r2(b.vz), target: t.id });
          d.cooldown = cfg.cooldown;
        } else d.cooldown = 0.25;
      }
    }
  }

  updateAlien(d, dt, alive, events) {
    const A = SYIRIL.alien;
    let best = null, bd = Infinity;
    for (const t of alive) { const dd = Math.hypot(t.x - d.x, t.z - d.z); if (dd < bd) { bd = dd; best = t; } }
    d.cooldown -= dt; d.swing = Math.max(0, d.swing - dt);
    if (!best) return;
    d.yaw = Math.atan2(-(best.x - d.x), -(best.z - d.z));
    if (bd > A.range * 0.85) {
      const nx = d.x + (best.x - d.x) / bd * A.speed * dt, nz = d.z + (best.z - d.z) / bd * A.speed * dt;
      if (this.canStand(nx, nz)) { d.x = nx; d.z = nz; } else if (this.canStand(nx, d.z)) d.x = nx; else if (this.canStand(d.x, nz)) d.z = nz;
      d.y = this.groundAt(d.x, d.z);
    }
    if (bd <= A.range && d.cooldown <= 0 && Math.abs(best.y - d.y) < 2.2) {
      d.cooldown = A.cooldown; d.swing = 0.35;
      events.push({ type: 'alienSwing', id: d.id, x: d.x, y: d.y, z: d.z });
      events.push({ type: 'hit', targetId: best.id, damage: A.damage, attack: 'ALIEN', from: { x: d.x, y: d.y + 1.1, z: d.z } });
    }
  }

  updateBolts(dt, targets, events) {
    const cfg = RAID.drone;
    for (const b of this.bolts) {
      const px = b.x, py = b.y, pz = b.z;
      b.x += b.vx * dt; b.y += b.vy * dt; b.z += b.vz * dt; b.life -= dt;
      if (!this.lineOfSight({ x: px, y: py, z: pz }, { x: b.x, y: b.y, z: b.z })) { b.life = 0; events.push({ type: 'boltEnd', id: b.id, x: r2(b.x), y: r2(b.y), z: r2(b.z) }); continue; }
      for (const t of targets) {
        if (!t.alive) continue;
        if ((t.x - b.x) ** 2 + (t.y + 1.1 - b.y) ** 2 + (t.z - b.z) ** 2 <= (cfg.boltRadius + 0.42) ** 2) {
          events.push({ type: 'hit', targetId: t.id, damage: cfg.damage, attack: 'DRONE', from: { x: px, y: py, z: pz } });
          events.push({ type: 'boltEnd', id: b.id, x: r2(b.x), y: r2(b.y), z: r2(b.z), hit: true }); b.life = 0; break;
        }
      }
      if (b.life > 0 && b.life <= dt) events.push({ type: 'boltEnd', id: b.id, x: r2(b.x), y: r2(b.y), z: r2(b.z) });
    }
    this.bolts = this.bolts.filter(b => b.life > 0);
  }

  updateSharks(dt, targets, events) {
    const a = SYIRIL.attacks.SHARKS;
    for (const s of this.sharks) {
      const step = a.speed * dt, nx = s.x - Math.sin(s.yaw) * step, nz = s.z - Math.cos(s.yaw) * step;
      s.travelled += step;
      if (s.travelled >= s.len || !this.canStand(nx, nz)) { s.done = true; events.push({ type: 'sharkEnd', id: s.id, x: r2(s.x), y: r2(s.y), z: r2(s.z) }); continue; }
      s.x = nx; s.z = nz; s.y = this.groundAt(nx, nz);
      for (const t of targets) {
        if (!t.alive || s.hit.has(t.id)) continue;
        if (Math.hypot(t.x - s.x, t.z - s.z) <= a.width && Math.abs(t.y - s.y) < 2) {
          s.hit.add(t.id); events.push({ type: 'hit', targetId: t.id, damage: Math.round(a.damage * this.scale), attack: 'SHARKS', from: { x: s.x, y: s.y + 0.8, z: s.z } });
        }
      }
    }
    this.sharks = this.sharks.filter(s => !s.done);
  }

  snapshot() {
    return {
      boss: this.boss, name: this.cfg.bossName, x: r2(this.x), y: r2(this.y), z: r2(this.z), yaw: +this.yaw.toFixed(3),
      health: Math.max(0, Math.round(this.health)), maxHealth: this.maxHealth, phase: this.phase, state: this.state, attack: this.attack,
      stateTime: +Math.max(0, this.stateTime).toFixed(2), shielded: this.shielded,
      orbs: this.orbs.map(o => ({ id: o.id, x: r2(o.x), y: r2(o.y), z: r2(o.z) })),
      bolts: this.bolts.map(b => ({ id: b.id, x: r2(b.x), y: r2(b.y), z: r2(b.z), vx: r2(b.vx), vy: r2(b.vy), vz: r2(b.vz) })),
      sharks: this.sharks.map(s => ({ id: s.id, x: r2(s.x), y: r2(s.y), z: r2(s.z), yaw: +s.yaw.toFixed(3) })),
      drones: this.drones.map(d => ({ id: d.id, type: d.type, x: r2(d.x), y: r2(d.y), z: r2(d.z), yaw: d.yaw != null ? +d.yaw.toFixed(3) : 0, health: d.health, locks: d.locks ? d.locks.slice() : [], swing: d.swing ? +d.swing.toFixed(2) : 0 })),
    };
  }
}
