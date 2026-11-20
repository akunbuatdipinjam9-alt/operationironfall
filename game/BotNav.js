 
 
 
 
 
const STEP = 0.5, BAND_LO = 0.35, BAND_HI = 1.82, REPLAN_MS = 1200, ROUTES_PER_FRAME = 2;

export class BotNav {
  constructor({ boxes, bounds, ground = null, radius = 0.7 } = {}) {
    this.boxesFn = boxes; this.boundsFn = bounds; this.ground = ground; this.radius = radius;
    this.grids = new Map(); this.version = ''; this.frame = -1; this.budget = ROUTES_PER_FRAME;
  }
   
  reset() { this.grids.clear(); this.version = ''; }
  gridFor(y) {
    const boxes = this.boxesFn(), b = this.boundsFn(); if (!boxes || !b) return null;
    const ver = boxes.length + ':' + b.minX + ':' + b.maxX + ':' + b.minZ + ':' + b.maxZ;
    if (ver !== this.version) { this.grids.clear(); this.version = ver; }
    const level = this.ground ? 'terrain' : Math.round(y * 2) / 2;
    if (!this.grids.has(level)) this.grids.set(level, this.build(boxes, b, this.ground ? null : level));
    return this.grids.get(level);
  }
  build(boxes, b, level) {
    const R = this.radius, minX = b.minX - 1, minZ = b.minZ - 1, W = Math.ceil((b.maxX - b.minX + 2) / STEP) + 1, H = Math.ceil((b.maxZ - b.minZ + 2) / STEP) + 1;
    if (W * H > 700 * 700) return null;  
    const blocked = new Uint8Array(W * H), ground = this.ground, base = new Float32Array(ground ? W * H : 0);
    if (ground) for (let z = 0; z < H; z++) for (let x = 0; x < W; x++) base[z * W + x] = ground(minX + x * STEP, minZ + z * STEP);
    const list = [];
    for (const s of boxes) {
      const q = s.box || s; if (!q || !q.min || s.polygon) continue;
      if (level != null && !(q.min.y < level + BAND_HI && q.max.y > level + BAND_LO)) continue;
      list.push(q);
      const x0 = Math.max(0, Math.floor((q.min.x - R - minX) / STEP)), x1 = Math.min(W - 1, Math.ceil((q.max.x + R - minX) / STEP));
      const z0 = Math.max(0, Math.floor((q.min.z - R - minZ) / STEP)), z1 = Math.min(H - 1, Math.ceil((q.max.z + R - minZ) / STEP));
      for (let z = z0; z <= z1; z++) for (let x = x0; x <= x1; x++) {
        const i = z * W + x, px = minX + x * STEP, pz = minZ + z * STEP;
        if (px <= q.min.x - R || px >= q.max.x + R || pz <= q.min.z - R || pz >= q.max.z + R) continue;
        if (ground && !(q.min.y < base[i] + BAND_HI && q.max.y > base[i] + BAND_LO)) continue;
        blocked[i] = 1;
      }
    }
    return { minX, minZ, W, H, blocked };
  }
  cell(g, x, z) { return Math.max(0, Math.min(g.H - 1, Math.round((z - g.minZ) / STEP))) * g.W + Math.max(0, Math.min(g.W - 1, Math.round((x - g.minX) / STEP))); }
  pos(g, i) { return { x: g.minX + (i % g.W) * STEP, z: g.minZ + Math.floor(i / g.W) * STEP }; }
  clear(g, x, z, tx, tz) {
    const n = Math.max(1, Math.ceil(Math.hypot(tx - x, tz - z) / (STEP * 0.5)));
    for (let i = 1; i <= n; i++) { const t = i / n; if (g.blocked[this.cell(g, x + (tx - x) * t, z + (tz - z) * t)]) return false; }
    return true;
  }
  nearestFree(g, x, z) {
    const c = this.cell(g, x, z); if (!g.blocked[c]) return c;
    const cx = c % g.W, cz = Math.floor(c / g.W);
    for (let r = 1; r < 20; r++) { let best = -1, bd = Infinity;
      for (let dz = -r; dz <= r; dz++) for (let dx = -r; dx <= r; dx++) { if (Math.abs(dx) !== r && Math.abs(dz) !== r) continue;
        const xx = cx + dx, zz = cz + dz; if (xx < 0 || zz < 0 || xx >= g.W || zz >= g.H) continue; const j = zz * g.W + xx; if (g.blocked[j]) continue;
        const d = dx * dx + dz * dz; if (d < bd) { bd = d; best = j; } }
      if (best >= 0) return best; }
    return -1;
  }
  route(g, x, z, tx, tz) {
    const s = this.nearestFree(g, x, z), e = this.nearestFree(g, tx, tz); if (s < 0 || e < 0) return null;
    const N = g.W * g.H, prev = new Int32Array(N).fill(-1), q = new Int32Array(N); let h = 0, t = 1; q[0] = s; prev[s] = s;
    while (h < t && prev[e] === -1) {
      const i = q[h++], cx = i % g.W, cz = (i / g.W) | 0;
      for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dz) continue;
        const xx = cx + dx, zz = cz + dz; if (xx < 0 || zz < 0 || xx >= g.W || zz >= g.H) continue; const j = zz * g.W + xx;
        if (g.blocked[j] || prev[j] !== -1) continue; if (dx && dz && (g.blocked[cz * g.W + xx] || g.blocked[zz * g.W + cx])) continue;
        prev[j] = i; q[t++] = j; }
    }
    if (prev[e] === -1) return null;
    const raw = []; for (let i = e; i !== s; i = prev[i]) raw.push(this.pos(g, i)); raw.push(this.pos(g, s)); raw.reverse();
    const out = []; let a = 0; for (let k = 2; k < raw.length; k++) if (!this.clear(g, raw[a].x, raw[a].z, raw[k].x, raw[k].z)) { out.push(raw[k - 1]); a = k - 1; }
    out.push(raw[raw.length - 1]); return out;
  }
   
  steer(bot, p, goal, now, frame = 0) {
    const g = this.gridFor(p.y || 0); if (!g || !goal) return null;
    if (frame !== this.frame) { this.frame = frame; this.budget = ROUTES_PER_FRAME; }
    if (!g.blocked[this.cell(g, p.x, p.z)] && this.clear(g, p.x, p.z, goal.x, goal.z)) { bot.navPath = null; return null; }
    const st = bot.navState || (bot.navState = {});
    const moved = !st.goal || Math.hypot(st.goal.x - goal.x, st.goal.z - goal.z) > 4;
    if ((!bot.navPath || moved || now >= (st.at || 0)) && this.budget > 0) {
      this.budget--; bot.navPath = this.route(g, p.x, p.z, goal.x, goal.z); st.at = now + REPLAN_MS; st.goal = { x: goal.x, z: goal.z };
    }
    const path = bot.navPath; if (!path || !path.length) return null;
    while (path.length > 1 && (Math.hypot(path[0].x - p.x, path[0].z - p.z) < 0.6 || this.clear(g, p.x, p.z, path[1].x, path[1].z))) path.shift();
    const n = path[0], d = Math.hypot(n.x - p.x, n.z - p.z); if (d < 0.05) return null;
    return { x: (n.x - p.x) / d, z: (n.z - p.z) / d };
  }
}
