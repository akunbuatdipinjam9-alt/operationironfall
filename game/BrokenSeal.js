 
 
 
 
 
 
 

import { POCKET, inPocket, pocketDoor, through } from './BackroomsLink.js';

export const SEAL = Object.freeze({
  firstSignSec: 120, awakeningSec: 240, abductionSec: 360,
  matchLimitSec: 1080,              
  onryoHealth: 20000,               
  exposedMul: 1.5,                  
  grabSec: 1.8,                     
  watcherStrikeSec: 6, watcherDamage: 150, watcherStunSec: 0.8,
  rescueSec: 45,                    
  portalRadius: 2.6, truce: true,    
  realmMargin: 6,
  preloadLeadMs: 4000,
});

 
export const CINEMATICS = Object.freeze({
  OPENING:      { id: 'OPENING', title: 'THE ACCIDENT', durationMs: 30000, skippable: true },
  FIRST_SIGN:   { id: 'FIRST_SIGN', title: 'THE FIRST SIGN', durationMs: 10000, skippable: false },
  ABDUCTION:    { id: 'ABDUCTION', title: 'THE ABDUCTION', durationMs: 28000, skippable: false },
  ALLIANCE:     { id: 'ALLIANCE', title: 'THE RELUCTANT ALLIANCE', durationMs: 20000, skippable: false },
  FINAL_RESCUE: { id: 'FINAL_RESCUE', title: 'THE FINAL RESCUE', durationMs: 32000, skippable: false },
  REVEAL:       { id: 'REVEAL', title: 'WHERE HE CAME FROM', durationMs: 42000, skippable: false },
  END_PARTIAL:  { id: 'END_PARTIAL', title: 'INCOMPLETE RESCUE', durationMs: 14000, skippable: false },
  END_FAILURE:  { id: 'END_FAILURE', title: 'DIMENSIONAL COLLAPSE', durationMs: 12000, skippable: false },
});

export const ENDINGS = Object.freeze({
  SEAL_RESTORED: { id: 'SEAL_RESTORED', title: 'SEAL RESTORED' },
  INCOMPLETE_RESCUE: { id: 'INCOMPLETE_RESCUE', title: 'INCOMPLETE RESCUE' },
  DIMENSIONAL_COLLAPSE: { id: 'DIMENSIONAL_COLLAPSE', title: 'DIMENSIONAL COLLAPSE' },
});

export const STORY_PHASES = Object.freeze(['OPENING', 'NORMAL_WARFARE', 'PARANORMAL', 'AWAKENING', 'DUAL_DIMENSION', 'ENDING', 'DONE']);

export function phaseAt(elapsedSec) {
  if (elapsedSec < SEAL.firstSignSec) return 'NORMAL_WARFARE';
  if (elapsedSec < SEAL.awakeningSec) return 'PARANORMAL';
  if (elapsedSec < SEAL.abductionSec) return 'AWAKENING';
  return 'DUAL_DIMENSION';
}

export function decideEnding({ redDone, blueDone }) {
  if (redDone && blueDone) return { ending: 'SEAL_RESTORED', winnerTeam: null };
  if (redDone || blueDone) return { ending: 'INCOMPLETE_RESCUE', winnerTeam: redDone ? 'RED' : 'BLUE' };
  return { ending: 'DIMENSIONAL_COLLAPSE', winnerTeam: null };
}

export function createRng(seed) { let s = seed >>> 0 || 1; return () => { s = (1664525 * s + 1013904223) >>> 0; return s / 4294967296; }; }

 
export function pickFragments(candidates, rand, n = 3) {
  const pool = candidates.slice(), out = [];
  while (out.length < n && pool.length) { const i = Math.floor(rand() * pool.length); out.push(pool.splice(i, 1)[0]); }
  return out.map((f, i) => ({ id: 'F' + (i + 1), room: f.room, x: f.x, z: f.z, state: 'DORMANT', progress: 0 }));
}

 
export const abductionAt = i => 12 + i * 3.4;
export const abductionLength = n => abductionAt(n) + 9;
export function abductionScript(victims = []) {
  const T = abductionAt(victims.length);
  return [
    { at: 0, shot: 'RITUAL', text: 'The ritual chamber shakes. The seal is broken.' },
    { at: 5, shot: 'ONRYO', text: 'She climbs out of the broken seal.' },
    { at: 9, shot: 'MANSION', text: 'Red team is scattered across the house. She finds them one by one.' },
    ...victims.map((v, i) => ({ at: abductionAt(i), shot: 'TAKE:' + i, text: `${v.name || 'A Red operator'} is taken.` })),
    { at: T, shot: 'ARENA', text: 'Blue team is dragged into the ritual chamber. Every door slams shut. She is in there with them.' },
    { at: T + 4.5, shot: 'REALM', text: 'On the other side, her Shadow waits for Red.' },
  ];
}

 
export const CUTSCENE_SCRIPT = Object.freeze({
  OPENING: [
    { at: 0, shot: 'CORRIDOR', text: 'Halloween night. A Red operator walks the old mansion alone, a tumbler of water in hand.' },
    { at: 6, shot: 'TUMBLER', text: 'Into the ritual chamber. Nobody told them what the circle on the floor is.' },
    { at: 10, shot: 'DROP', text: 'The tumbler slips.' },
    { at: 13, shot: 'SEAL', text: 'Water runs across the old seal. The lines begin to break.' },
    { at: 19, shot: 'LIGHTS', text: 'Every light in the house goes out at once.' },
    { at: 25, shot: 'TITLE', text: 'THE BROKEN SEAL' },
  ],
  FIRST_SIGN: [{ at: 0, shot: 'MIRROR', text: '' }, { at: 4, shot: 'MIRROR', text: 'Something is wrong with this house.' }],
  ABDUCTION: abductionScript([]),
  ALLIANCE: [
    { at: 0, shot: 'CORRIDOR', text: '' },
    { at: 3, shot: 'PORTAL', text: 'Yellow light. The buzz of old lamps. A smell of wet carpet.' },
    { at: 7, shot: 'WATCHER', text: 'He steps out of the Backrooms.' },
    { at: 11, shot: 'ONRYO', text: 'He does not speak. He turns toward her. Blue: defeat Onryō — he fights beside you.' },
    { at: 15.5, shot: 'REALM', text: 'Red: destroy her Shadow. Both halves must fall.' },
  ],
  FINAL_RESCUE: [
    { at: 0, shot: 'REALM', text: 'Both halves of her are gone.' },
    { at: 6, shot: 'WATCHER', text: 'The Watcher opens a way through the Backrooms.' },
    { at: 13, shot: 'PORTAL', text: 'Red team steps through.' },
    { at: 20, shot: 'MANSION', text: 'Both teams stand in the mansion again.' },
    { at: 26, shot: 'WATCHER', text: 'He watches until they are safe.' },
  ],
   
   
  REVEAL: [
    { at: 0, shot: 'FOREST', text: 'A forest path. A child who never came home. Someone running from what they did.' },
    { at: 10, shot: 'DESERT', text: 'A desert at night. The same person, hiding from the police, moving between the dunes.' },
    { at: 20, shot: 'POLUS', text: 'Polus. A sealed laboratory far from Earth. Experiments no one approved. A soul taken.' },
    { at: 30, shot: 'BACKROOMS', text: 'A yellow maze made by the same hands. Something thrown away there, and left.' },
    { at: 38, shot: 'WATCHER', text: 'Sometimes, the one everyone fears is the one who comes to save them.' },
  ],
  END_PARTIAL: [{ at: 0, shot: 'PORTAL', text: 'The way between worlds will not hold.' }, { at: 7, shot: 'WATCHER', text: 'Not everyone made it back.' }],
  END_FAILURE: [{ at: 0, shot: 'RITUAL', text: 'The seal stays broken.' }, { at: 6, shot: 'MANSION', text: 'The house goes quiet.' }],
});

export function scriptLine(id, sec, victims = null) {
  const s = id === 'ABDUCTION' && victims ? abductionScript(victims) : CUTSCENE_SCRIPT[id] || []; let cur = s[0] || null;
  for (const l of s) if (l.at <= sec) cur = l;
  return cur;
}

 
 
export const ONRYO = Object.freeze({
  name: 'ONRYŌ',
  phaseThresholds: [0.70, 0.35],
  body: { radius: 0.9, height: 1.7, float: 0.45 },
  speed: [2.6, 3.0, 3.6],
  attacks: {
    GRASP:  { telegraph: 1.4, radius: 4.5, damage: 26, recover: 1.1 },           
    BLINK:  { telegraph: 0.8, range: 9, recover: 0.7 },                           
    ILLUSION: { telegraph: 1.0, copies: 3, life: 7, recover: 0.9 },              
    SHADOWS: { telegraph: 1.6, walls: 3, length: 12, life: 10, damage: 8, tick: 0.5, recover: 1.0 },   
    WAIL:   { telegraph: 2.2, radius: 12, damage: 22, recover: 1.4 },             
  },
  phaseAttacks: { 1: ['GRASP', 'BLINK', 'ILLUSION'], 2: ['GRASP', 'BLINK', 'ILLUSION', 'SHADOWS'], 3: ['GRASP', 'BLINK', 'SHADOWS', 'WAIL', 'COMBO'] },
  labels: { GRASP: 'ONRYŌ HAIR', SHADOWS: 'ONRYŌ SHADOW', WAIL: 'ONRYŌ WAIL', SHADE: 'SHADOW OF ONRYŌ' },
});
export const SHADE = Object.freeze({ health: 160, speed: 2.6, reach: 1.8, damage: 12, cooldown: 1.2, max: 4, respawnSec: 9, radius: 0.6, height: 1.6 });

export function onryoHealth() { return SEAL.onryoHealth; }

function raySphere(o, d, c, r, max) {
  const ox = o.x - c.x, oy = o.y - c.y, oz = o.z - c.z, b = ox * d.x + oy * d.y + oz * d.z, cc = ox * ox + oy * oy + oz * oz - r * r, h = b * b - cc;
  if (h < 0) return null; const t = -b - Math.sqrt(h); return t >= 0 && t <= max ? t : (cc < 0 ? 0 : null);
}
const r2 = v => +v.toFixed(2);
const segDist = (px, pz, ax, az, bx, bz) => { const vx = bx - ax, vz = bz - az, l = vx * vx + vz * vz || 1, t = Math.max(0, Math.min(1, ((px - ax) * vx + (pz - az) * vz) / l)); return Math.hypot(px - ax - vx * t, pz - az - vz * t); };

export class OnryoSim {
  constructor({ x = 0, z = 0, maxHealth = null, arena, rand = Math.random, canStand = () => true, los = null } = {}) {
    this.x = x; this.z = z; this.y = ONRYO.body.float; this.yaw = 0; this.arena = arena; this.rand = rand; this.canStand = canStand; this.los = los; this.losAt = 0; this.losOk = true;
    this.maxHealth = maxHealth || onryoHealth(); this.health = this.maxHealth; this.phase = 1;
    this.state = 'INTRO'; this.stateTime = 2.5; this.attack = null; this.data = null; this.cooldown = 1.5; this.last = null;
    this.decoys = []; this.walls = []; this.stun = 0; this.serial = 1; this.time = 0; this.shielded = true; this.combo = 0;
  }
  get dead() { return this.state === 'DEAD'; }
  hitTest(o, d, max = 200) {
    if (this.dead) return null; let best = null;
    const body = { x: this.x, y: this.y + ONRYO.body.height * 0.55, z: this.z }, t = raySphere(o, d, body, ONRYO.body.radius, max);
    if (t !== null) best = { kind: 'boss', t, point: { x: o.x + d.x * t, y: o.y + d.y * t, z: o.z + d.z * t } };
    for (const dc of this.decoys) { const u = raySphere(o, d, { x: dc.x, y: this.y + ONRYO.body.height * 0.55, z: dc.z }, ONRYO.body.radius, max); if (u !== null && (!best || u < best.t)) best = { kind: 'decoy', id: dc.id, t: u, point: { x: o.x + d.x * u, y: o.y + d.y * u, z: o.z + d.z * u } }; }
    return best;
  }
  damage(amount, events = [], { decoy = null, force = false } = {}) {
    if (this.dead || !(amount > 0)) return 0;
    if (decoy) { const dc = this.decoys.find(x => x.id === decoy); if (dc) { dc.hp -= amount; if (dc.hp <= 0) { this.decoys = this.decoys.filter(x => x !== dc); events.push({ type: 'decoyGone', id: dc.id, x: r2(dc.x), z: r2(dc.z) }); } } return 0; }
    if (this.shielded && !force) { events.push({ type: 'shielded' }); return 0; }
    const before = this.health; this.health = Math.max(0, this.health - amount * (this.exposed || 1)); const applied = before - this.health;
    const frac = this.health / this.maxHealth, next = frac <= ONRYO.phaseThresholds[1] ? 3 : frac <= ONRYO.phaseThresholds[0] ? 2 : 1;
    if (this.health <= 0) { this.state = 'DEAD'; this.decoys = []; this.walls = []; this.shielded = true; this.attack = null; events.push({ type: 'defeated' }); return applied; }
    if (next > this.phase) { this.phase = next; this.decoys = []; this.attack = null; this.data = null; this.state = 'PHASE'; this.stateTime = 1.6; this.shielded = true; events.push({ type: 'phase', phase: next }); }
    return applied;
  }
  finishAttack(recover) { this.attack = null; this.data = null; this.state = 'RECOVER'; this.stateTime = recover; this.shielded = false; }
  pick(targets) {
    const alive = targets.filter(t => t.alive); if (!alive.length) return null;
    let cur = alive.find(t => t.id === this.targetId);
    if (!cur || this.time > (this.retargetAt || 0)) { alive.sort((a, b) => Math.hypot(a.x - this.x, a.z - this.z) - Math.hypot(b.x - this.x, b.z - this.z)); cur = alive[Math.floor(this.rand() * Math.min(2, alive.length))]; this.targetId = cur.id; this.retargetAt = this.time + 5; }
    return cur;
  }
  choose() { const all = ONRYO.phaseAttacks[this.phase], pool = all.filter(a => a !== this.last || all.length === 1); return pool[Math.floor(this.rand() * pool.length) % pool.length]; }
  begin(name, target, events) {
    const A = ONRYO.attacks[name === 'COMBO' ? 'GRASP' : name]; this.attack = name; this.last = name; this.shielded = name === 'WAIL';
    const ev = { type: 'telegraph', attack: name, duration: A.telegraph, x: r2(this.x), z: r2(this.z), phase: this.phase };
    if (name === 'GRASP' || name === 'COMBO') { this.combo = name === 'COMBO' ? 3 : 1; this.data = { x: target.x, z: target.z }; ev.at = { x: r2(target.x), z: r2(target.z) }; ev.radius = A.radius; }
    if (name === 'BLINK') {  
      let p = null, fb = null; for (let i = 0; i < 14 && !p; i++) { const a = this.rand() * Math.PI * 2, d = 5 + this.rand() * (A.range - 5), q = { x: target.x + Math.sin(a) * d, z: target.z + Math.cos(a) * d }; if (!this.canStand(q.x, q.z)) continue; fb ||= q; if (!this.los || this.los(q, target)) p = q; }
      this.data = p || fb || { x: this.x, z: this.z }; ev.to = { x: r2(this.data.x), z: r2(this.data.z) }; }
    if (name === 'WAIL') ev.radius = A.radius;
    if (name === 'SHADOWS') {
      const R = this.arena, walls = [];
      const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
      for (let i = 0; i < A.walls; i++) { const horiz = this.rand() < 0.5, cx = clamp(this.x + (this.rand() - 0.5) * 28, R.minX + 8, R.maxX - 8), cz = clamp(this.z + (this.rand() - 0.5) * 28, R.minZ + 8, R.maxZ - 8), h = A.length / 2; walls.push(horiz ? { id: this.serial++, ax: cx - h, az: cz, bx: cx + h, bz: cz } : { id: this.serial++, ax: cx, az: cz - h, bx: cx, bz: cz + h }); }
      this.data = { walls }; ev.walls = walls.map(w => ({ id: w.id, ax: r2(w.ax), az: r2(w.az), bx: r2(w.bx), bz: r2(w.bz) }));
    }
    this.state = 'TELEGRAPH'; this.stateTime = A.telegraph; events.push(ev);
  }
  resolve(targets, events) {
    const name = this.attack, A = ONRYO.attacks[name === 'COMBO' ? 'GRASP' : name], hit = (t, dmg, attack) => events.push({ type: 'hit', targetId: t.id, damage: Math.round(dmg), attack });
    if (name === 'GRASP' || name === 'COMBO') {
      for (const t of targets) if (t.alive && Math.hypot(t.x - this.data.x, t.z - this.data.z) <= A.radius) hit(t, A.damage, 'GRASP');
      events.push({ type: 'strike', attack: 'GRASP', x: r2(this.data.x), z: r2(this.data.z), radius: A.radius });
      if (--this.combo > 0) { const nt = this.pick(targets); if (nt) { this.data = { x: nt.x, z: nt.z }; this.state = 'TELEGRAPH'; this.stateTime = 0.75; events.push({ type: 'telegraph', attack: 'GRASP', duration: 0.75, at: { x: r2(nt.x), z: r2(nt.z) }, radius: A.radius, phase: this.phase }); return; } }
    }
    if (name === 'BLINK') { this.x = this.data.x; this.z = this.data.z; events.push({ type: 'blink', x: r2(this.x), z: r2(this.z) }); }
    if (name === 'ILLUSION') { this.decoys = []; for (let i = 0; i < A.copies; i++) { const a = (i + this.rand()) / A.copies * Math.PI * 2, d = 4 + this.rand() * 4, x = this.x + Math.sin(a) * d, z = this.z + Math.cos(a) * d; if (this.canStand(x, z)) this.decoys.push({ id: this.serial++, x, z, hp: 250, life: A.life }); } events.push({ type: 'illusion', decoys: this.decoys.map(d => ({ id: d.id, x: r2(d.x), z: r2(d.z) })) }); }
    if (name === 'SHADOWS') { for (const w of this.data.walls) this.walls.push({ ...w, life: A.life, tick: 0 }); events.push({ type: 'shadows', walls: this.data.walls.length }); }
    if (name === 'WAIL') { for (const t of targets) if (t.alive && Math.hypot(t.x - this.x, t.z - this.z) <= A.radius) hit(t, A.damage, 'WAIL'); events.push({ type: 'strike', attack: 'WAIL', x: r2(this.x), z: r2(this.z), radius: A.radius }); }
    this.finishAttack(A.recover);
  }
  update(dt, targets) {
    const events = []; this.time += dt; if (this.dead) return events;
    for (const d of this.decoys) d.life -= dt; this.decoys = this.decoys.filter(d => d.life > 0);
    const SW = ONRYO.attacks.SHADOWS;
    for (const w of this.walls) { w.life -= dt; w.tick -= dt; if (w.tick <= 0) { w.tick = SW.tick; for (const t of targets) if (t.alive && segDist(t.x, t.z, w.ax, w.az, w.bx, w.bz) < 0.9) events.push({ type: 'hit', targetId: t.id, damage: SW.damage, attack: 'SHADOWS' }); } }
    this.walls = this.walls.filter(w => w.life > 0);
    if (this.stun > 0) { this.stun -= dt; return events; }
    this.stateTime -= dt; this.cooldown -= dt;
    if (this.state === 'INTRO' || this.state === 'PHASE') { if (this.stateTime <= 0) { this.state = 'HOVER'; this.shielded = false; } return events; }
    const target = this.pick(targets); if (!target) { if (this.state !== 'TELEGRAPH') this.state = 'HOVER'; return events; }
    const dx = target.x - this.x, dz = target.z - this.z, dist = Math.hypot(dx, dz) || 1;
    this.yaw = Math.atan2(-dx, -dz);
    if (this.state === 'TELEGRAPH') { if (this.stateTime <= 0) this.resolve(targets, events); return events; }
    if (this.state === 'RECOVER') { if (this.stateTime <= 0) { this.state = 'HOVER'; this.cooldown = 0.9 + this.rand() * 0.8; } return events; }
     
    if (this.los && this.time >= this.losAt) { this.losAt = this.time + 0.5; this.losOk = this.los(this, target); }
    if ((dist > 16 || !this.losOk) && this.cooldown <= 0) { this.begin('BLINK', target, events); return events; }
    const want = dist > 14 ? 1 : dist < 7 ? -0.7 : 0, sp = ONRYO.speed[this.phase - 1];
    if (want) { const nx = this.x + dx / dist * sp * want * dt, nz = this.z + dz / dist * sp * want * dt; if (this.canStand(nx, nz)) { this.x = nx; this.z = nz; } }
    if (this.cooldown <= 0) this.begin(this.choose(), target, events);
    return events;
  }
  snapshot() {
    return { name: ONRYO.name, x: r2(this.x), y: r2(this.y), z: r2(this.z), yaw: +this.yaw.toFixed(3), health: Math.round(this.health), maxHealth: this.maxHealth, phase: this.phase, state: this.state, attack: this.attack,
      stateTime: +Math.max(0, this.stateTime).toFixed(2), shielded: this.shielded, stunned: this.stun > 0, exposed: (this.exposed || 1) > 1,
      decoys: this.decoys.map(d => ({ id: d.id, x: r2(d.x), z: r2(d.z) })), walls: this.walls.map(w => ({ id: w.id, ax: r2(w.ax), az: r2(w.az), bx: r2(w.bx), bz: r2(w.bz), life: r2(w.life) })),
      at: this.attack && this.data && 'x' in this.data ? { x: r2(this.data.x), z: r2(this.data.z) } : null };
  }
}

 
 
 
 
 
 
 
 
 
 
 
export class SealDirector {
  constructor({ layout, seed = 1, world, now = 0 } = {}) {
    this.L = layout; this.world = world; this.rand = createRng(seed); this.seed = seed;
    this.elapsed = 0; this.phase = 'OPENING'; this.cinematic = null; this.queue = []; this.pausedTotal = 0; this.pausedSince = 0;
    this.redDone = false; this.blueDone = false; this.redFreed = false; this.portalOpen = false; this.boss = null; this.shadow = null; this.wantReveal = false; this.rescueUntil = Infinity;
    this.victims = []; this.taken = new Set(); this.sealed = false; this.blueMoved = false;
    this.shades = []; this.shadeSerial = 1; this.nextShade = 0; this.ending = null; this.beats = new Set(); this.watcher = { state: 'HIDDEN', x: 0, z: 0 };
    this.watcherStrikeAt = Infinity; this.watcherMoveAt = Infinity; this.watcherStrikes = 0;
    this.startCinematic('OPENING', now);
  }
  get realm() { return this.L.realm; }
  get dual() { return this.phase === 'DUAL_DIMENSION' || this.phase === 'ENDING'; }
  get truce() { return SEAL.truce && this.dual; }
  get paused() { return !!this.cinematic; }
  worldOf(p) { return !p ? 'HOUSE' : inPocket(p) ? 'BACKROOMS' : p.x > this.realm.minX - SEAL.realmMargin ? 'REALM' : 'HOUSE'; }
   
  get linkOpen() { return this.dual; }  
  doorA() { return this.L.story.watcherDoor; }
  doorB() { return (this._doorB ||= pocketDoor()); }
   
  linkedStep(prev, next, tolerance) {
    if (!this.linkOpen || !prev || !next) return false;
    for (const [a, b] of [[this.doorA(), this.doorB()], [this.doorB(), this.doorA()]]) {
      const q = through(a, b, prev); if (Math.hypot(q.x - next.x, q.z - next.z) <= tolerance) return true;
    }
    return false;
  }
  pocketBounds() { return POCKET; }
  sameWorld(a, b) { return this.worldOf(a) === this.worldOf(b); }
  timeLeftSec() { return Math.max(0, SEAL.matchLimitSec - this.elapsed); }
  los(a, b) { return !this.world.los || this.world.los(a, b); }
   
  startCinematic(id, now) {
    const c = CINEMATICS[id];
    let durationMs = c.durationMs, victims = null;
    if (id === 'ABDUCTION') {  
      this.victims = [...this.world.entities()].filter(e => e.team === 'RED' && !e.minion).map(e => ({ id: e.id, name: e.name || e.id, x: r2(e.x), z: r2(e.z) }));
      victims = this.victims; durationMs = abductionLength(victims.length) * 1000;
    }
    this.cinematic = { id, title: c.title, startedAt: now, durationMs, endsAt: now + durationMs, skippable: c.skippable, votes: new Set(), matchElapsed: this.elapsed, victims };
    this.pausedSince = now;
    this.world.event({ type: 'cinematic', state: 'START', id, title: c.title, startedAt: now, durationMs, skippable: c.skippable, matchElapsed: +this.elapsed.toFixed(2), victims });
  }
  endCinematic(now, skipped = false) {
    const c = this.cinematic; if (!c) return; this.cinematic = null;
    const paused = Math.max(0, now - this.pausedSince); this.pausedTotal += paused; this.world.shiftTimers?.(paused);
    this.world.event({ type: 'cinematic', state: 'END', id: c.id, skipped, matchElapsed: +this.elapsed.toFixed(2) });
    this.afterCinematic(c.id);
    const next = this.queue.shift(); if (next) this.startCinematic(next, now); else if (this.phase === 'ENDING') this.complete();
  }
  humans() { return [...this.world.entities()].filter(e => e.kind === 'human' && e.connected !== false); }
  votesNeeded() { return Math.max(1, Math.floor(this.humans().length / 2) + 1); }
   
  vote(id, now) {
    const c = this.cinematic; if (!c || !c.skippable) return false;
    if (!this.humans().some(h => h.id === id)) return false;
    c.votes.add(id); this.world.event({ type: 'cinematic', state: 'VOTE', id: c.id, votes: c.votes.size, needed: this.votesNeeded() });
    if (c.votes.size >= this.votesNeeded()) this.endCinematic(now, true);
    return true;
  }
   
  update(now, dt) {
    if (this.phase === 'DONE') return false;
    if (this.cinematic) {
      if (this.cinematic.id === 'ABDUCTION') this.abductBeats(now);
      if (now >= this.cinematic.endsAt) this.endCinematic(now); return !!this.cinematic; }
    if (this.phase === 'ENDING') return false;
    this.elapsed += dt;
    const p = this.phase;
    if (p === 'NORMAL_WARFARE' || p === 'PARANORMAL' || p === 'AWAKENING') {
      if (!this.beats.has('preload-first') && this.elapsed >= SEAL.firstSignSec - SEAL.preloadLeadMs / 1000) { this.beats.add('preload-first'); this.world.event({ type: 'cinematic', state: 'PRELOAD', id: 'FIRST_SIGN' }); }
      if (!this.beats.has('preload-abduction') && this.elapsed >= SEAL.abductionSec - SEAL.preloadLeadMs / 1000) { this.beats.add('preload-abduction'); this.world.event({ type: 'cinematic', state: 'PRELOAD', id: 'ABDUCTION' }); }
      const next = phaseAt(this.elapsed);
      if (next === 'PARANORMAL' && !this.beats.has('first')) { this.beats.add('first'); this.elapsed = SEAL.firstSignSec; this.setPhase('PARANORMAL'); this.startCinematic('FIRST_SIGN', now); return true; }
      if (next === 'DUAL_DIMENSION' && !this.beats.has('abduction')) { this.beats.add('abduction'); this.elapsed = SEAL.abductionSec; this.startCinematic('ABDUCTION', now); this.queue.push('ALLIANCE'); return true; }
      if (next !== 'DUAL_DIMENSION' && next !== p) this.setPhase(next);
      return false;
    }
    if (p === 'DUAL_DIMENSION') { this.updateDual(now, dt); if (this.phase === 'DUAL_DIMENSION' && this.elapsed >= SEAL.matchLimitSec) this.conclude(now); }
    return !!this.cinematic;
  }
  setPhase(phase) { if (this.phase === phase) return; this.phase = phase; this.world.event({ type: 'sealPhase', phase, matchElapsed: +this.elapsed.toFixed(2) }); }
  afterCinematic(id) {
    if (id === 'OPENING') this.setPhase('NORMAL_WARFARE');
    if (id === 'ABDUCTION') this.abduct();
    if (id === 'ALLIANCE') {  
      const post = this.L.story.watcherPost; this.watcher = { state: 'ALLY', x: post.x, z: post.z };
      this.watcherStrikeAt = this.elapsed + 3; this.watcherMoveAt = this.elapsed + 2;
      this.world.event({ type: 'sealObjective', state: 'WATCHER_ALLY', x: post.x, z: post.z });
    }
    if (id === 'FINAL_RESCUE' && this.wantReveal && !this.queue.includes('REVEAL')) this.queue.unshift('REVEAL');
  }
   
  takeIntoRealm(e, i) {
    if (!e || this.taken.has(e.id)) return; this.taken.add(e.id); const sp = this.realm.spawns, p = sp[i % sp.length];
    if (e.dead) { e.dead = false; e.respawnAt = 0; e.health = e.maxHealth || 100; }
    this.world.teleport(e, { x: p.x + Math.floor(i / sp.length) * 1.5, z: p.z, yaw: 0 }); this.world.event({ type: 'abduction', state: 'TAKEN', id: e.id });
  }
  abductBeats(now) {
    const c = this.cinematic, byId = new Map([...this.world.entities()].map(e => [e.id, e]));
    this.victims.forEach((v, i) => { if (!this.taken.has(v.id) && now >= c.startedAt + (abductionAt(i) + SEAL.grabSec) * 1000) this.takeIntoRealm(byId.get(v.id), i); });
    if (!this.blueMoved && now >= c.startedAt + abductionAt(this.victims.length) * 1000) this.lockArena();
  }
   
  get arena() { return this.L.story.arena; }
  inArena(p, m = 0) { const A = this.arena; return p.x > A.minX + m && p.x < A.maxX - m && p.z > A.minZ + m && p.z < A.maxZ - m; }
  arenaSpot(i) { const S = this.L.story.arenaSpots; return S[i % S.length]; }
  lockArena() {
    this.blueMoved = true; this.sealed = true; let i = 0;
    for (const e of this.world.entities()) if (e.team === 'BLUE' && !e.minion) { const p = this.arenaSpot(i++); if (e.dead) { e.dead = false; e.respawnAt = 0; e.health = e.maxHealth || 100; } this.world.teleport(e, { x: p.x, z: p.z, yaw: Math.atan2(-(this.L.story.seal.x - p.x), -(this.L.story.seal.z - p.z)) }); }
    this.world.event({ type: 'sealObjective', state: 'DOORS_SEALED' });
  }
  homeSpot() { const d = this.L.story.watcherDoor; return { x: d.x + 2.4 + (this.rand() - 0.5) * 1.5, z: d.z + (this.rand() - 0.5) * 3, yaw: -Math.PI / 2 }; }
   
  abduct() {
    const reds = [...this.world.entities()].filter(e => e.team === 'RED' && !e.minion);
    reds.forEach((e, i) => this.takeIntoRealm(e, i)); if (!this.blueMoved) this.lockArena();
    const s = this.L.story.seal, R = this.realm, los = this.world.los ? (a, b) => this.world.los(a, b) : null;
    this.boss = new OnryoSim({ x: s.x, z: s.z, maxHealth: SEAL.onryoHealth, arena: this.arena, rand: this.rand, canStand: (x, z) => this.inArena({ x, z }, 1) && this.world.canStandHouse(x, z), los });
    this.shadow = new OnryoSim({ x: R.boss.x, z: R.boss.z, maxHealth: SEAL.onryoHealth, arena: R, rand: this.rand, canStand: (x, z) => this.world.canStandRealm(x, z) });
    this.setPhase('DUAL_DIMENSION');
    this.world.event({ type: 'abduction', state: 'DONE', red: reds.map(e => e.id), boss: this.boss.snapshot(), shadow: this.shadow.snapshot() });
    const post = this.L.story.watcherPost; this.watcher = { state: 'AWARE', x: post.x, z: post.z };
  }
   
  updateDual(now, dt) {
    const ents = [...this.world.entities()];
    if (this.sealed) for (const e of ents) if (!e.dead && this.worldOf(e) === 'HOUSE' && (e.team === 'BLUE' || e.team === 'RED') && !e.minion && !this.inArena(e, 0.55)) {  
      const A = this.arena, cx = Math.max(A.minX + 0.6, Math.min(A.maxX - 0.6, e.x)), cz = Math.max(A.minZ + 0.6, Math.min(A.maxZ - 0.6, e.z));
      if (Math.hypot(cx - e.x, cz - e.z) > 2) { const p = this.arenaSpot(Math.floor(this.rand() * 12)); this.world.teleport(e, { x: p.x, z: p.z, yaw: e.yaw }); } else { e.x = cx; e.z = cz; } }
    const prey = w => ents.filter(e => this.worldOf(e) === w && (w === 'REALM' ? e.team === 'RED' : (e.team === 'BLUE' || this.redFreed))).map(e => ({ id: e.id, x: e.x, z: e.z, alive: !e.dead && e.connected !== false }));
    if (this.boss && !this.boss.dead) { for (const ev of this.boss.update(dt, prey('HOUSE'))) this.bossEvent(ev, 'onryo'); this.updateWatcher(); }
    if (this.shadow && !this.shadow.dead) for (const ev of this.shadow.update(dt, prey('REALM'))) this.bossEvent(ev, 'shadow');
     
    if (this.portalOpen) {
      const P = this.realm.portal;
      for (const e of ents) if (e.team === 'RED' && !e.dead && this.worldOf(e) === 'REALM' && Math.hypot(e.x - P.x, e.z - P.z) <= SEAL.portalRadius) {
        this.world.teleport(e, this.homeSpot()); this.redFreed = true; this.world.objective?.(e, 1);
        this.world.event({ type: 'sealObjective', state: 'RED_RETURNED', id: e.id });
      }
      const reds = ents.filter(e => e.team === 'RED' && !e.minion && e.connected !== false);
      if (reds.every(e => this.worldOf(e) === 'HOUSE') || this.elapsed >= this.rescueUntil) this.conclude(now);
    }
  }
   
   
  updateWatcher() {
    const w = this.watcher, b = this.boss; if (w.state !== 'ALLY' || !b || b.dead) return;
    const far = Math.hypot(w.x - b.x, w.z - b.z) > 16;
    if (this.elapsed >= this.watcherMoveAt || (far && this.elapsed >= this.watcherStrikeAt)) {
      this.watcherMoveAt = this.elapsed + 5 + this.rand() * 2;
      for (let i = 0; i < 14; i++) { const a = this.rand() * Math.PI * 2, d = 6 + this.rand() * 4, q = { x: b.x + Math.sin(a) * d, z: b.z + Math.cos(a) * d };
        if (this.inArena(q, 1) && this.world.canStandHouse(q.x, q.z) && this.los(q, b)) { w.x = q.x; w.z = q.z; this.world.event({ type: 'watcher', state: 'MOVE', x: r2(q.x), z: r2(q.z) }); break; } }
    }
    if (this.elapsed >= this.watcherStrikeAt) {
      if (Math.hypot(w.x - b.x, w.z - b.z) > 16 || !this.los(w, b)) { this.watcherMoveAt = this.elapsed; return; }
      this.watcherStrikeAt = this.elapsed + SEAL.watcherStrikeSec; this.watcherStrikes++;
      const evs = [], applied = b.damage(SEAL.watcherDamage, evs, { force: true }); if (!b.dead) b.stun = Math.max(b.stun, SEAL.watcherStunSec);
      this.world.event({ type: 'watcher', state: 'STRIKE', from: { x: r2(w.x), z: r2(w.z) }, to: { x: r2(b.x), z: r2(b.z) }, amount: Math.round(applied) });
      for (const e of evs) this.bossEvent(e, 'onryo');
    }
  }
  bossEvent(ev, which = 'onryo') {
    if (ev.type === 'hit') { this.world.damage(ev.targetId, ev.damage, which === 'shadow' ? ONRYO.labels.SHADE : (ONRYO.labels[ev.attack] || ONRYO.name)); return; }
    this.world.event({ type: 'onryo', which, event: ev });
    if (ev.type === 'phase') this.world.event({ type: 'sealPhase', phase: 'DUAL_DIMENSION', which, bossPhase: ev.phase, matchElapsed: +this.elapsed.toFixed(2) });
    if (ev.type !== 'defeated') return;
    const other = which === 'onryo' ? this.shadow : this.boss;
    if (which === 'onryo') { this.blueDone = true; this.sealed = false; this.world.event({ type: 'sealObjective', state: 'DOORS_OPEN' }); for (const e of this.world.entities()) if (e.team === 'BLUE' && !e.dead && e.connected !== false) this.world.objective?.(e, 2); }
    else { this.redDone = true; for (const e of this.world.entities()) if (e.team === 'RED' && !e.dead && e.connected !== false) this.world.objective?.(e, 2); }
    this.world.event({ type: 'sealObjective', state: which === 'onryo' ? 'ONRYO_DEFEATED' : 'SHADOW_DEFEATED' });
    if (other && !other.dead) { other.exposed = SEAL.exposedMul; this.world.event({ type: 'sealObjective', state: which === 'onryo' ? 'SHADOW_EXPOSED' : 'ONRYO_EXPOSED' }); }
    if (this.blueDone && this.redDone) {  
      this.portalOpen = true; this.rescueUntil = this.elapsed + SEAL.rescueSec;
      this.watcher = { state: 'REALM_PORTAL', x: this.realm.portal.x, z: this.realm.portal.z - 2.2 };
      this.world.event({ type: 'sealObjective', state: 'PORTAL_OPEN' });
    }
  }
  simFor(hit) { return hit?.which === 'shadow' || hit?.id === 'shadow' ? this.shadow : this.boss; }
  damageBoss(amount, hit = {}) {
    const sim = this.simFor(hit); if (!sim || sim.dead || this.paused) return 0; const ev = [];
    const applied = sim.damage(amount, ev, { decoy: hit.kind === 'decoy' ? hit.id : null }); for (const e of ev) this.bossEvent(e, sim === this.shadow ? 'shadow' : 'onryo'); return applied;
  }
   
  hitTest(shooter, o, d, max) {
    if (!this.dual) return null;
    const w = this.worldOf(shooter); if (w === 'BACKROOMS') return null;
    const which = w === 'HOUSE' ? 'onryo' : 'shadow', sim = which === 'onryo' ? this.boss : this.shadow;
    const h = sim && !sim.dead ? sim.hitTest(o, d, max) : null; if (h) h.which = which; return h;
  }
  applyHit(hit, amount) { if (!hit) return 0; return this.damageBoss(amount, hit); }
   
  botTarget(bot) {
    if (!this.dual || this.phase === 'ENDING') return null;
    const w = this.worldOf(bot); if (w === 'BACKROOMS') return null;
    const which = w === 'HOUSE' ? 'onryo' : 'shadow', b = which === 'onryo' ? this.boss : this.shadow;
    return b && !b.dead ? { id: which, kind: 'boss', x: b.x, y: b.y + 1, z: b.z, boss: true, seal: true } : null;
  }
  objectiveFor(bot) {
    if (!this.dual || this.phase === 'ENDING') return null; const w = this.worldOf(bot);
    if (w === 'REALM') {
      if (this.portalOpen) { const P = this.realm.portal; return { x: P.x, z: P.z, cx: P.x, cz: P.z, radius: 1.5, engage: 2 }; }
      const S = this.shadow; if (S && !S.dead) { const a = ((bot.id.charCodeAt(bot.id.length - 1) || 0) % 12) / 12 * Math.PI * 2; return { x: S.x + Math.sin(a) * 11, z: S.z + Math.cos(a) * 11, cx: S.x, cz: S.z, radius: 14, engage: 40 }; }
      return null;
    }
    const b = this.boss; if (b && !b.dead) return { x: b.x, z: b.z, cx: b.x, cz: b.z, radius: 9, engage: 30 };
    return null;
  }
   
  spawnFor(e) {
    if (this.sealed && e.team === 'BLUE') { const p = this.arenaSpot(Math.floor(this.rand() * 12)); return { x: p.x, z: p.z, yaw: 0 }; }
    if (!this.dual || e.team !== 'RED') return null;
    if (this.portalOpen) return this.homeSpot();
    const sp = this.realm.spawns, p = sp[Math.floor(this.rand() * sp.length)]; return { x: p.x, z: p.z, yaw: 0 };
  }
   
  dev(action, now, { which = 'onryo', phase = 2 } = {}) {
    if (action === 'SKIP') { if (!this.cinematic) return false; this.endCinematic(now, true); return true; }
    if (action === 'BOSS') {  
      if (this.dual) return false; if (this.cinematic) { this.queue = []; this.endCinematic(now, true); }
      for (const b of ['first', 'preload-first', 'preload-abduction']) this.beats.add(b); this.elapsed = SEAL.abductionSec - 0.01; this.setPhase('AWAKENING'); return true; }
    const sim = which === 'shadow' ? this.shadow : this.boss; if (!sim || sim.dead || this.paused) return false;
    if (action === 'PHASE') { const n = Math.max(2, Math.min(3, phase | 0)), th = ONRYO.phaseThresholds[n - 2]; sim.health = Math.min(sim.health, th * sim.maxHealth + 1); sim.shielded = false; this.damageBoss(2, { which }); return true; }
    if (action === 'KILL') { sim.health = 1; sim.shielded = false; sim.state = sim.state === 'PHASE' ? 'HOVER' : sim.state; this.damageBoss(5, { which }); return true; }
    return false;
  }
   
  conclude(now) {
    if (this.phase === 'ENDING' || this.phase === 'DONE') return;
    const r = decideEnding({ redDone: this.redDone, blueDone: this.blueDone }); this.ending = r;
    this.setPhase('ENDING'); this.world.event({ type: 'sealEnding', ending: r.ending, winnerTeam: r.winnerTeam, matchElapsed: +this.elapsed.toFixed(2) });
    if (this.portalOpen) { for (const e of this.world.entities()) if (e.team === 'RED' && this.worldOf(e) === 'REALM') this.world.teleport(e, this.homeSpot()); this.redFreed = true; }
    this.sealed = false;
    this.wantReveal = r.ending !== 'DIMENSIONAL_COLLAPSE';
    if (r.ending === 'SEAL_RESTORED') this.startCinematic('FINAL_RESCUE', now);
    else if (r.ending === 'INCOMPLETE_RESCUE') { this.startCinematic('END_PARTIAL', now); this.queue.push('REVEAL'); }
    else this.startCinematic('END_FAILURE', now);
  }
  complete() { if (this.phase === 'DONE') return; this.phase = 'DONE'; this.world.finish(this.ending?.ending || 'DIMENSIONAL_COLLAPSE', this.ending?.winnerTeam ?? null); }
  snapshot() {
    const c = this.cinematic;
    return {
      phase: this.phase, elapsed: +this.elapsed.toFixed(2), timeLeftSec: +this.timeLeftSec().toFixed(1), paused: !!c, truce: this.truce,
      cinematic: c ? { id: c.id, title: c.title, startedAt: c.startedAt, durationMs: c.durationMs, skippable: c.skippable, votes: c.votes.size, needed: this.votesNeeded(), victims: c.victims || null } : null,
      boss: this.boss ? this.boss.snapshot() : null, shadow: this.shadow ? this.shadow.snapshot() : null, shades: [],
      fragments: [], seal: { active: false, progress: 0, restored: this.blueDone },
      red: { done: this.redDone, freed: this.redFreed }, portalOpen: this.portalOpen, sealed: this.sealed, linkOpen: this.linkOpen,
      rescueLeftSec: this.portalOpen && Number.isFinite(this.rescueUntil) ? +Math.max(0, this.rescueUntil - this.elapsed).toFixed(1) : null,
      watcher: { ...this.watcher }, ending: this.ending ? this.ending.ending : null,
    };
  }
}
