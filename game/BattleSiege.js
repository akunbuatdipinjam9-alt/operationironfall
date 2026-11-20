 
 
export const SIEGE = Object.freeze({
  tower: { hp: 1800, range: 16, damage: 34, intervalMs: 1100, height: 8 },
  core: { hp: 3200, range: 14, damage: 45, intervalMs: 1300, height: 14 },
  firstWaveMs: 6000, waveEveryMs: 25000, perLane: 3, maxMinions: 42,
  minion: { hp: 140, damage: 12, range: 2.6, hitMs: 900, speed: 3.2, aggro: 8, thinkMs: 450, radius: 0.45, height: 1.2 },
  defendWindowMs: 3000,
  turretHitsToKill: { minion: 9, brute: 18 },    
   
  waveScale: 0.05, maxScale: 2.5, bruteEvery: 3, brute: { hp: 2.5, structureDamage: 3, radius: 0.7 },
});
const TEAMS = ['BLUE', 'RED'];
const other = t => (t === 'BLUE' ? 'RED' : 'BLUE');
const d2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;

export class SiegeSim {
   
  constructor({ structures, lanes, laneNames = Object.keys(lanes), now = 0, cfg = SIEGE }) {
    this.cfg = cfg; this.serial = 0; this.result = null; this.minions = []; this.aggressors = new Map();
    this.structures = new Map(structures.map(s => { const c = cfg[s.kind]; return [s.id, { ...s, hp: c.hp, max: c.hp, alive: true, readyAt: now + 2000, height: s.height || c.height }]; }));
    this.lanes = Object.fromEntries(laneNames.filter(n => lanes[n]?.length >= 2).map(n => [n, lanes[n].map(p => ({ x: p.x, z: p.z }))]));
    this.nextWaveAt = now + cfg.firstWaveMs; this.wave = 0;
  }
  vulnerable(s) {
    if (!s.alive) return false;
    if (s.kind !== 'core') return true;
    for (const o of this.structures.values()) if (o.team === s.team && o.kind === 'tower' && !o.alive) return true;
    return false;
  }
   
  coreOf(team) { for (const s of this.structures.values()) if (s.team === team && s.kind === 'core') return s; return null; }
  coreGate(core, toward, lateral = 0, extra = 0) {
    const nx = toward.x - core.x, nz = toward.z - core.z, L = Math.hypot(nx, nz) || 1, ux = nx / L, uz = nz / L, r = (core.radius || 3) + 0.9 + extra;
    return { x: core.x + ux * r - uz * lateral, z: core.z + uz * r + ux * lateral };
  }
  noteAggression(attackerId, attackerTeam, victimTeam, now) { if (attackerTeam !== victimTeam && TEAMS.includes(victimTeam)) this.aggressors.set(attackerId, { team: attackerTeam, victimTeam, at: now }); }

  spawnWave(now, events) {
    this.wave++;
    const scale = Math.min(this.cfg.maxScale, 1 + (this.wave - 1) * this.cfg.waveScale), brute = this.wave % this.cfg.bruteEvery === 0;
    for (const team of TEAMS) for (const [lane, pts] of Object.entries(this.lanes)) {
      for (let k = 0; k < this.cfg.perLane + (brute ? 1 : 0); k++) {
        if (this.minions.length >= this.cfg.maxMinions) break;
        const path = team === 'BLUE' ? pts : [...pts].reverse(), start = path[0], side = (k - (this.cfg.perLane - 1) / 2) * 0.9;
        const isBrute = brute && k === this.cfg.perLane, hp = Math.round(this.cfg.minion.hp * scale * (isBrute ? this.cfg.brute.hp : 1));
         
        const core = this.coreOf(team), at = core ? this.coreGate(core, path[1] || start, isBrute ? 0 : side, isBrute ? 1.4 : 0) : { x: start.x + (isBrute ? 0 : side), z: start.z };
        this.minions.push({ id: 'm' + (++this.serial), team, lane, path, wp: 1, side: isBrute ? 0 : side, x: at.x, z: at.z, hp, max: hp, scale, brute: isBrute, target: null, thinkAt: now + k * 120, hitAt: 0 });
      }
    }
    events.push({ type: 'minionWave', wave: this.wave });
  }

   
  update(now, dt, actors, hooks = {}, events = []) {
    if (this.result) return events;
    if (now >= this.nextWaveAt) { this.spawnWave(now, events); this.nextWaveAt = now + this.cfg.waveEveryMs; }
    const M = this.cfg.minion, byId = new Map(actors.map(a => [a.id, a]));
    for (const [id, a] of this.aggressors) if (now - a.at > this.cfg.defendWindowMs || !byId.has(id)) this.aggressors.delete(id);
    for (const m of this.minions) {
      if (m.hp <= 0) continue;
      if (now >= m.thinkAt) { m.thinkAt = now + M.thinkMs; m.target = this.pickMinionTarget(m, actors); }
      const t = this.resolve(m.target, byId);
      if (!t) m.target = null;
      const goal = t || this.laneGoal(m), reach = t ? (t.radius || 0) + M.range : 0.8, dist = Math.sqrt(d2(m, goal));
      if (dist > reach) { const s = Math.min(dist - reach * 0.9, M.speed * dt); m.x += (goal.x - m.x) / dist * s; m.z += (goal.z - m.z) / dist * s; }
      else if (t && now >= m.hitAt) { m.hitAt = now + M.hitMs; const dmg = M.damage * (m.scale || 1) * (m.brute && m.target.kind === 'structure' ? this.cfg.brute.structureDamage : 1); this.hit(m, m.target, dmg, m.brute ? 'BRUTE' : 'MINION', now, hooks, events); }
      else if (!t && m.wp < m.path.length - 1) m.wp++;
    }
    for (const s of this.structures.values()) {
      if (!s.alive || now < s.readyAt) continue;
      const c = this.cfg[s.kind], tgt = this.pickTowerTarget(s, c.range, actors, now); if (!tgt) continue;
      s.readyAt = now + c.intervalMs;
      const p = tgt.kind === 'minion' ? this.minions.find(x => x.id === tgt.id) : byId.get(tgt.id);
      events.push({ type: 'towerShot', id: s.id, team: s.team, from: [s.x, s.height, s.z], to: [p.x, (p.y || 0) + 1.1, p.z] });
      this.hit(s, tgt, tgt.kind === 'minion' ? this.turretDamageTo(tgt.id, c.damage) : c.damage, s.kind === 'core' ? 'CORE' : 'TOWER', now, hooks, events);
    }
    if (this.minions.some(m => m.hp <= 0)) this.minions = this.minions.filter(m => m.hp > 0);
    return events;
  }
  laneGoal(m) { const p = m.path[Math.min(m.wp, m.path.length - 1)]; return { x: p.x + m.side, z: p.z }; }
  resolve(t, byId) {
    if (!t) return null;
    if (t.kind === 'minion') { const m = this.minions.find(x => x.id === t.id && x.hp > 0); return m ? { x: m.x, z: m.z, radius: M_RADIUS } : null; }
    if (t.kind === 'structure') { const s = this.structures.get(t.id); return s && this.vulnerable(s) ? s : null; }
    const a = byId.get(t.id); return a ? { x: a.x, z: a.z, radius: 0.4 } : null;
  }
  pickMinionTarget(m, actors) {
    const R = this.cfg.minion.aggro ** 2; let best = null, bd = Infinity;
    for (const o of this.minions) if (o.team !== m.team && o.hp > 0) { const d = d2(m, o); if (d < R && d < bd) { bd = d; best = { kind: 'minion', id: o.id }; } }
    if (best) return best;
    for (const a of actors) if (a.team !== m.team && a.team !== undefined) { const d = d2(m, a); if (d < R && d < bd) { bd = d; best = { kind: 'actor', id: a.id }; } }
    if (best) return best;
    for (const s of this.structures.values()) if (s.team !== m.team && this.vulnerable(s)) { const d = Math.sqrt(d2(m, s)) - s.radius; if (d < this.cfg.minion.aggro && d < bd) { bd = d; best = { kind: 'structure', id: s.id }; } }
    return best;
  }
  pickTowerTarget(s, range, actors, now) {
    const R = range * range; let best = null, bd = Infinity;
    for (const a of actors) { const g = this.aggressors.get(a.id); if (g && a.team !== s.team && g.victimTeam === s.team && d2(s, a) <= R) return { kind: 'actor', id: a.id }; }
    for (const m of this.minions) if (m.team !== s.team && m.hp > 0) { const d = d2(s, m); if (d <= R && d < bd) { bd = d; best = { kind: 'minion', id: m.id }; } }
    if (best) return best;
    for (const a of actors) if (a.team !== s.team) { const d = d2(s, a); if (d <= R && d < bd) { bd = d; best = { kind: 'actor', id: a.id }; } }
    return best;
  }
  turretDamageTo(id, fallback) {
    const m = this.minions.find(x => x.id === id), H = this.cfg.turretHitsToKill; if (!m || !H) return fallback;
    return Math.ceil((m.max || this.cfg.minion.hp) / (m.brute ? H.brute : H.minion));
  }
  hit(src, t, dmg, label, now, hooks, events) {
    if (t.kind === 'actor') hooks.hitActor?.(src, t.id, dmg, label);
    else if (t.kind === 'minion') this.damageMinion(t.id, dmg, src.team, events);
    else this.damageStructure(t.id, dmg, src.team, events);
  }
  damageMinion(id, amount, team, events = []) {
    const m = this.minions.find(x => x.id === id); if (!m || m.hp <= 0 || m.team === team || !(amount > 0)) return 0;
    const a = Math.min(m.hp, amount); m.hp -= a; if (m.hp <= 0) events.push({ type: 'minionDown', id, team: m.team }); return a;
  }
  damageStructure(id, amount, team, events = []) {
    const s = this.structures.get(id); if (!s || s.team === team || !this.vulnerable(s) || !(amount > 0)) return 0;
    const a = Math.min(s.hp, amount); s.hp -= a;
    if (s.hp <= 0) { s.alive = false; events.push({ type: 'structureDestroyed', id, team: s.team, kind: s.kind }); if (s.kind === 'core') { this.result = other(s.team); events.push({ type: 'siegeResult', winner: this.result }); } }
    return a;
  }
   
  hitTest(o, dir, maxDist) {
    let best = null;
    const test = (cx, cz, r, y0, y1, kind, id, team) => {
      const fx = o.x - cx, fz = o.z - cz, a = dir.x * dir.x + dir.z * dir.z; if (a < 1e-9) return;
      const b = fx * dir.x + fz * dir.z, c = fx * fx + fz * fz - r * r, disc = b * b - a * c; if (disc < 0) return;
      let t = (-b - Math.sqrt(disc)) / a; if (t < 0) t = (-b + Math.sqrt(disc)) / a; if (t < 0 || t > maxDist) return;
      const y = o.y + dir.y * t; if (y < y0 || y > y1) return;
      if (!best || t < best.t) best = { kind, id, team, t };
    };
    for (const s of this.structures.values()) if (s.alive) test(s.x, s.z, s.radius, 0, s.height, 'structure', s.id, s.team);
    for (const m of this.minions) if (m.hp > 0) test(m.x, m.z, (m.brute ? this.cfg.brute.radius : M_RADIUS) + 0.1, 0, this.cfg.minion.height * (m.brute ? 1.5 : 1) + 0.3, 'minion', m.id, m.team);
    return best;
  }
   
  minionActors() { return this.minions.filter(m => m.hp > 0).map(m => ({ id: m.id, team: m.team, x: m.x, y: 0, z: m.z, yaw: 0, health: m.hp, dead: false, siegeMinion: true })); }
  standing(team) { let hp = 0, max = 0; for (const s of this.structures.values()) if (s.team === team) { hp += Math.max(0, s.hp); max += s.max; } return max ? hp / max : 0; }
  snapshot() {
    return {
      structures: [...this.structures.values()].map(s => ({ id: s.id, team: s.team, kind: s.kind, x: s.x, z: s.z, hp: Math.max(0, Math.round(s.hp)), max: s.max, alive: s.alive, vulnerable: this.vulnerable(s) })),
      minions: this.minions.map(m => [m.id, m.team === 'BLUE' ? 0 : 1, +m.x.toFixed(2), +m.z.toFixed(2), +(m.hp / (m.max || this.cfg.minion.hp)).toFixed(2), m.brute ? 1 : 0]),
      nextWaveMs: 0, wave: this.wave, result: this.result,
    };
  }
}
const M_RADIUS = SIEGE.minion.radius;
