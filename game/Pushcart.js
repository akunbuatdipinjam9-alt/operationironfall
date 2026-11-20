 
 
export const PUSHCART = Object.freeze({
  attackers: 'BLUE', defenders: 'RED',
  radius: 4,               
  baseSpeed: 1.05,         
  perExtraPusher: 0.25,    
  maxPushers: 3,           
  rollbackDelayMs: 10000,  
  rollbackSpeed: 0.3,
  checkpoints: [1 / 3, 2 / 3],
});

export class PushcartSim {
  constructor(path, cfg = PUSHCART) {
    if (!Array.isArray(path) || path.length < 2) throw new Error('PUSHCART_PATH');
    this.cfg = cfg; this.path = path.map(p => ({ x: +p.x, y: Number.isFinite(+p.y) ? +p.y : 0, z: +p.z }));
    this.seg = []; let total = 0;
    for (let i = 1; i < this.path.length; i++) { const a = this.path[i - 1], b = this.path[i], l = Math.hypot(b.x - a.x, b.z - a.z); this.seg.push(l); total += l; }
    this.length = total; this.dist = 0; this.state = 'IDLE'; this.pushers = 0; this.defenders = 0; this.idleMs = 0; this.floor = 0;
    this.x = this.path[0].x; this.y = this.path[0].y; this.z = this.path[0].z; this.done = false;
  }
  get progress() { return this.length > 0 ? Math.min(1, this.dist / this.length) : 1; }
  locate(d) {
    let left = Math.max(0, Math.min(this.length, d));
    for (let i = 0; i < this.seg.length; i++) {
      if (left <= this.seg[i] || i === this.seg.length - 1) { const a = this.path[i], b = this.path[i + 1], t = this.seg[i] > 0 ? Math.min(1, left / this.seg[i]) : 1; this.x = a.x + (b.x - a.x) * t; this.y = a.y + (b.y - a.y) * t; this.z = a.z + (b.z - a.z) * t; this.heading = Math.atan2(b.x - a.x, b.z - a.z); return; }
      left -= this.seg[i];
    }
  }
   
  update(dt, actors) {
    if (this.done || !(dt > 0)) return null;
    const c = this.cfg, r2 = c.radius * c.radius; let push = 0, def = 0;
    for (const a of actors) { if (!a.alive) continue; const dx = a.x - this.x, dz = a.z - this.z; if (dx * dx + dz * dz > r2) continue; if (a.team === c.attackers) push++; else if (a.team === c.defenders) def++; }
    this.pushers = push; this.defenders = def;
    if (push > 0 && def > 0) { this.state = 'CONTESTED'; this.idleMs = 0; }
    else if (push > 0) {
      this.state = 'PUSHING'; this.idleMs = 0;
      this.dist += (c.baseSpeed + c.perExtraPusher * (Math.min(push, c.maxPushers) - 1)) * dt;
      for (const cp of c.checkpoints) if (this.progress >= cp) this.floor = Math.max(this.floor, cp * this.length);
    } else {
      this.idleMs += dt * 1000;
      if (this.idleMs >= c.rollbackDelayMs && this.dist > this.floor) { this.state = 'ROLLBACK'; this.dist = Math.max(this.floor, this.dist - c.rollbackSpeed * dt); }
      else this.state = 'IDLE';
    }
    this.locate(this.dist);
    if (this.dist >= this.length) { this.done = true; this.state = 'DELIVERED'; return 'DELIVERED'; }
    return null;
  }
  snapshot() { return { x: +this.x.toFixed(2), y: +this.y.toFixed(2), z: +this.z.toFixed(2), heading: +(this.heading || 0).toFixed(3), progress: +this.progress.toFixed(4), state: this.state, pushers: this.pushers, defenders: this.defenders, radius: this.cfg.radius, checkpoints: this.cfg.checkpoints, path: this.path }; }
}

 
export function pushcartPath(lane, attackerSpawn) {
  const pts = lane.map(p => ({ x: p.x, y: p.y, z: p.z }));
  const d = p => Math.hypot(p.x - attackerSpawn.x, p.z - attackerSpawn.z);
  return d(pts[0]) <= d(pts[pts.length - 1]) ? pts : pts.reverse();
}
