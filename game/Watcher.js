 
 
 
 
 
 
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export const WATCHER = Object.freeze({
  firstAfter: 20, checkEvery: 3, baseChance: 0.10, aloneMul: 1.6, squadMul: 0.35, cooldown: [25, 55],
  minDist: 12, maxDist: 20, approach: 10, holdGaze: [2.5, 5], lookAwayVanish: 1.2, unseenLife: 12, retreatSpeed: 1.4, retreatMax: 2.5, fade: 1.5,
});

export class WatcherBrain {
   
  constructor(world) { this.w = world; this.reset(); }
  reset() { this.state = 'HIDDEN'; this.t = 0; this.clock = 0; this.nextCheck = WATCHER.firstAfter; this.pos = null; this.opacity = 0; this.seen = 0; this.away = 0; this.hold = 0; this.dir = null; this.appearances = 0; }
  chance({ allies = 0, combat = false } = {}) { if (combat) return 0; return WATCHER.baseChance * (allies >= 2 ? WATCHER.squadMul : allies === 0 ? WATCHER.aloneMul : 1); }
  vanish(cool = true) { this.state = 'HIDDEN'; this.pos = null; this.opacity = 0; if (cool) { const [a, b] = WATCHER.cooldown; this.nextCheck = this.clock + a + (b - a) * this.w.rand(); } }
   
  update(dt, ctx) {
    this.clock += dt; const P = ctx.player, R = this.w.rand;
    if (this.state === 'HIDDEN') {
      if (this.clock < this.nextCheck) return this.view();
      this.nextCheck = this.clock + WATCHER.checkEvery;
      if (R() >= this.chance(ctx)) return this.view();
      const spots = this.w.candidates(P).filter(c => { const d = Math.hypot(c.x - P.x, c.z - P.z); return d >= WATCHER.minDist && d <= WATCHER.maxDist && !this.w.inView(c) && this.w.los(c, P); });
      if (!spots.length) return this.view();
      this.pos = { ...spots[Math.floor(R() * spots.length)] }; this.state = 'PRESENT'; this.t = 0; this.opacity = 1; this.appearances++;
      return this.view();
    }
    this.t += dt;
    const dist = Math.hypot(this.pos.x - P.x, this.pos.z - P.z), visible = this.w.inView(this.pos) && this.w.los(this.pos, P);
    if (this.state === 'FADING') { this.opacity = Math.max(0, this.opacity - dt / WATCHER.fade); if (this.opacity <= 0 || !visible) this.vanish(); return this.view(); }
    if (ctx.combat) { if (!visible) this.vanish(); else this.state = 'FADING'; return this.view(); }
    if (this.state === 'PRESENT') {
      if (visible) { this.state = 'WATCHED'; this.seen = 0; this.away = 0; const [a, b] = WATCHER.holdGaze; this.hold = a + (b - a) * R(); }
      else if (this.t > WATCHER.unseenLife) this.vanish();
      else if (dist < WATCHER.approach) this.vanish();
      return this.view();
    }
    if (this.state === 'WATCHED') {
      if (!visible) { this.away += dt; if (this.away >= WATCHER.lookAwayVanish) this.vanish(); return this.view(); }
      this.away = 0; this.seen += dt;
      if (this.seen >= this.hold || dist < WATCHER.approach) this.startRetreat(P);
      return this.view();
    }
    if (this.state === 'RETREAT') {
      if (!visible) { this.vanish(); return this.view(); }
      const step = WATCHER.retreatSpeed * dt; this.pos.x += this.dir.x * step; this.pos.z += this.dir.z * step;
      if (this.t > WATCHER.retreatMax) { this.state = 'FADING'; }
      return this.view();
    }
    return this.view();
  }
   
  startRetreat(P) {
    const dx = this.pos.x - P.x, dz = this.pos.z - P.z, L = Math.hypot(dx, dz) || 1, side = { x: -dz / L, z: dx / L };
    const blockedAt = s => { for (let k = 1; k <= 3; k++) { const q = { x: this.pos.x + side.x * s * k * 1.2, z: this.pos.z + side.z * s * k * 1.2 }; if (!this.w.los(q, P)) return k; } return 9; };
    const s = blockedAt(1) <= blockedAt(-1) ? 1 : -1;
    this.dir = { x: side.x * s, z: side.z * s }; this.state = 'RETREAT'; this.t = 0;
  }
  view() { return { state: this.state, visible: this.state !== 'HIDDEN' && !!this.pos, pos: this.pos, opacity: this.opacity }; }
}

 
export function annexCandidates(layout, P) {
  const { N, S } = layout.grid, half = N * S / 2, i0 = Math.floor((P.x + half) / S), j0 = Math.floor((P.z + half) / S), out = [];
  for (let i = i0 - 3; i <= i0 + 3; i++) for (let j = j0 - 3; j <= j0 + 3; j++) {
    if (i < 0 || j < 0 || i >= N || j >= N) continue;
    const cx = -half + S / 2 + i * S, cz = -half + S / 2 + j * S;
    out.push({ x: cx, z: cz }, { x: cx + S / 2, z: cz }, { x: cx, z: cz + S / 2 });
  }
  return out.filter(c => Math.abs(c.x) < half - 0.8 && Math.abs(c.z) < half - 0.8);
}

 
 
 
 
 
 
const SKIN = 0x24201c, SKIN_DARK = 0x110f0d, CLOTH = 0x0c0b0a, BONE = 0xb9b3a4, EYE = 0xdfe6ea;
export class WatcherView {
  constructor(scene) {
    this.scene = scene; this.root = new THREE.Group(); this.root.visible = false; this.root.name = 'TheWatcher';
    const std = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.93, metalness: 0, transparent: true, opacity: 0, fog: false, ...extra });
    this.mats = { skin: std(SKIN), dark: std(SKIN_DARK), cloth: std(CLOTH, { side: THREE.DoubleSide, roughness: 1 }), bone: std(BONE, { roughness: 0.6 }),
      eye: new THREE.MeshBasicMaterial({ color: EYE, transparent: true, opacity: 0, fog: false }) };
    this.body = this.mats.skin; this.eyes = this.mats.eye;  
    this.geos = []; this.time = 0; this.twitchAt = 2; this.twitch = 0; this.curlAt = 1.5;
    const statics = { skin: [], dark: [], cloth: [], bone: [] }, tmp = new THREE.Object3D();
     
    const bake = (mat, geo, [x, y, z], [rx = 0, ry = 0, rz = 0] = [], [sx = 1, sy = 1, sz = 1] = []) => {
      tmp.position.set(x, y, z); tmp.rotation.set(rx, ry, rz); tmp.scale.set(sx, sy, sz); tmp.updateMatrix(); statics[mat].push(geo.applyMatrix4(tmp.matrix));
    };
     
    const seg = (mat, a, b, r1, r2, joint = true) => {
      const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
      const g = new THREE.CylinderGeometry(r2, r1, L, 8, 1); g.translate(0, L / 2, 0);
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.applyQuaternion(q); g.translate(A.x, A.y, A.z); statics[mat].push(g);
      if (joint) bake(mat, new THREE.SphereGeometry(r1 * 1.25, 8, 6), a);
    };
    const mirror = f => { f(1); f(-1); };
     
    mirror(s => {
      seg('skin', [0.11 * s, 1.36, 0], [0.13 * s, 0.74, 0.07], 0.06, 0.045);
      seg('skin', [0.13 * s, 0.74, 0.07], [0.12 * s, 0.08, -0.02], 0.045, 0.032);
      bake('dark', new THREE.SphereGeometry(0.06, 8, 6), [0.13 * s, 0.75, 0.1]);
      bake('skin', new THREE.BoxGeometry(0.08, 0.05, 0.3), [0.12 * s, 0.03, 0.08], [0.05, 0, 0]);
    });
     
    bake('skin', new THREE.SphereGeometry(0.15, 10, 8), [0, 1.38, 0], [], [1.25, 0.6, 0.8]);
    const spine = [[0, 1.42, -0.02], [0, 1.66, -0.06], [0, 1.9, -0.05], [0, 2.1, 0.03]];
    for (let i = 0; i < spine.length - 1; i++) seg('skin', spine[i], spine[i + 1], 0.075 - i * 0.004, 0.07 - i * 0.004);
    for (let i = 0; i < 9; i++) bake('dark', new THREE.SphereGeometry(0.028, 6, 5), [0, 1.48 + i * 0.07, -0.1 - Math.sin(i / 8 * Math.PI) * 0.04]);
    bake('skin', new THREE.SphereGeometry(0.2, 14, 10), [0, 1.93, 0.01], [0.15, 0, 0], [1, 1.25, 0.72]);        
    for (let i = 0; i < 6; i++) {  
      const y = 1.78 + i * 0.065, r = 0.185 - Math.abs(i - 2.5) * 0.012;
      bake('skin', new THREE.TorusGeometry(r, 0.011, 5, 18, Math.PI * 1.15), [0, y, 0.035], [Math.PI / 2 + 0.55, 0, Math.PI * -0.075], [1, 0.8, 1]);  
    }
    bake('dark', new THREE.SphereGeometry(0.11, 10, 8), [0, 1.62, 0.06], [], [1.1, 0.8, 0.5]);                  
     
    mirror(s => {
      bake('skin', new THREE.SphereGeometry(0.06, 8, 6), [0.27 * s, 2.12, 0]);
      seg('skin', [0.04 * s, 2.14, 0.06], [0.27 * s, 2.13, 0.02], 0.022, 0.02, false);
      seg('skin', [0.28 * s, 2.1, 0], [0.33 * s, 1.5, 0.05], 0.042, 0.032);                   
      seg('skin', [0.33 * s, 1.5, 0.05], [0.31 * s, 0.86, 0.12], 0.032, 0.024);               
      bake('dark', new THREE.SphereGeometry(0.04, 8, 6), [0.33 * s, 1.5, 0.05]);
      bake('skin', new THREE.BoxGeometry(0.07, 0.11, 0.035), [0.31 * s, 0.8, 0.13], [0.1, 0, 0]);  
    });
     
    const rag = (x, y, z, h, w, tilt) => { const g = new THREE.PlaneGeometry(w, h, 1, 4), p = g.attributes.position; for (let i = 0; i < p.count; i++) { const t = (y - p.getY(i)); p.setZ(i, p.getZ(i) + Math.sin(p.getY(i) * 7 + x * 9) * 0.03); } g.computeVertexNormals(); bake('cloth', g, [x, y - h / 2, z], [0.05, 0, tilt]); };
    [[-0.2, 2.06, 0.12, 0.5, 0.035, 0.12], [0.17, 2.04, 0.13, 0.62, 0.03, -0.1], [0.05, 2.02, -0.16, 0.75, 0.05, 0.03], [-0.15, 1.42, 0.12, 0.42, 0.03, 0.15],
     [0.16, 1.4, 0.11, 0.55, 0.028, -0.14], [0, 1.4, -0.14, 0.62, 0.05, 0.02], [0.31, 1.9, 0.03, 0.36, 0.025, -0.2]].forEach(r => rag(...r));
     
    for (const [k, list] of Object.entries(statics)) {
      if (!list.length) continue; const g = mergeGeometries(list.map(x => x.index ? x.toNonIndexed() : x), false); list.forEach(x => x.dispose()); g.computeVertexNormals?.();
      this.geos.push(g); this.add(new THREE.Mesh(g, this.mats[k]), this.root);
    }
     
    this.neck = new THREE.Group(); this.neck.position.set(0, 2.12, 0.04); this.neck.rotation.x = 0.35; this.root.add(this.neck);
    const ng = new THREE.CylinderGeometry(0.04, 0.05, 0.36, 8); ng.translate(0, 0.18, 0); this.geos.push(ng); this.add(new THREE.Mesh(ng, this.mats.skin), this.neck);
    this.head = new THREE.Group(); this.head.position.set(0, 0.38, 0.02); this.neck.add(this.head);
    const hp = (geo, mat, pos, rot = [0, 0, 0], sc = [1, 1, 1]) => { this.geos.push(geo); const m = new THREE.Mesh(geo, mat); m.position.set(...pos); m.rotation.set(...rot); m.scale.set(...sc); this.add(m, this.head); return m; };
    hp(new THREE.SphereGeometry(0.13, 16, 12), this.mats.skin, [0, 0.1, 0], [-0.35, 0, 0], [0.85, 1.55, 0.95]);    
    hp(new THREE.SphereGeometry(0.1, 12, 10), this.mats.skin, [0, -0.06, 0.05], [0.3, 0, 0], [0.8, 0.9, 0.9]);   
    for (const x of [-0.045, 0.045]) {
      hp(new THREE.SphereGeometry(0.036, 10, 8), this.mats.dark, [x, 0.08, 0.098], [0, 0, 0], [1, 1.25, 0.6]);    
      hp(new THREE.SphereGeometry(0.008, 6, 5), this.mats.eye, [x, 0.077, 0.112]);                                  
    }
     
    hp(new THREE.SphereGeometry(0.07, 10, 8), this.mats.skin, [0, 0.122, 0.07], [0, 0, 0], [1.25, 0.32, 0.6]);
    for (const x of [-0.055, 0.055]) hp(new THREE.SphereGeometry(0.03, 8, 6), this.mats.dark, [x, 0.005, 0.11], [0, 0, 0], [0.9, 1.3, 0.5]);
     
    hp(new THREE.TorusGeometry(0.079, 0.011, 5, 28, Math.PI * 0.95), this.mats.dark, [0, -0.01, 0.124], [0.12, 0, Math.PI * 1.025], [1.05, 0.5, 0.7]);
    for (let i = 0; i < 16; i++) { const a = Math.PI * (1.08 + 0.84 * i / 15), x = Math.cos(a) * 0.079 * 1.05, y = Math.sin(a) * 0.079 * 0.5 - 0.006;
      hp(new THREE.BoxGeometry(0.008, i % 2 ? 0.016 : 0.012, 0.006), this.mats.bone, [x, y, 0.14 - Math.abs(x) * 0.45]); }
     
    this.fingers = [];
    mirror(s => { for (let f = 0; f < 5; f++) {
      const g = new THREE.Group(), thumb = f === 4; g.position.set((0.31 + (thumb ? 0.035 : (f - 1.5) * 0.017)) * s, thumb ? 0.8 : 0.745, 0.14);
      const L1 = thumb ? 0.08 : 0.13 + (f === 1 || f === 2 ? 0.03 : 0), L2 = L1 * 0.85;
      const a = new THREE.CylinderGeometry(0.009, 0.011, L1, 5); a.translate(0, -L1 / 2, 0); this.geos.push(a); this.add(new THREE.Mesh(a, this.mats.skin), g);
      const tip = new THREE.Group(); tip.position.y = -L1; g.add(tip); const b = new THREE.CylinderGeometry(0.005, 0.009, L2, 5); b.translate(0, -L2 / 2, 0); this.geos.push(b); this.add(new THREE.Mesh(b, this.mats.skin), tip);
      g.rotation.z = (thumb ? 0.5 : 0.04) * s; this.root.add(g); this.fingers.push({ g, tip, base: 0.15 + f * 0.03, curl: 0 });
    } });
    scene.add(this.root);
  }
  add(mesh, parent) { mesh.raycast = () => {}; mesh.castShadow = false; mesh.receiveShadow = false; mesh.frustumCulled = false; mesh.renderOrder = 2; parent.add(mesh); return mesh; }
   
  update(v, player, dt, vis = () => 1) {
    this.time += dt;
    if (!v.visible) { this.root.visible = false; return; }
    const d = Math.hypot(v.pos.x - player.x, v.pos.z - player.z), a = Math.min(1, 0.18 + 2.2 * vis(d)) * v.opacity;
    this.root.visible = a > 0.01; this.root.position.set(v.pos.x, 0, v.pos.z);
    this.root.rotation.y = Math.atan2(player.x - v.pos.x, player.z - v.pos.z);
    const t = this.time;
     
    this.root.scale.set(1, 1 + Math.sin(t * 0.9) * 0.004, 1 + Math.sin(t * 0.9) * 0.01);
     
    if (t >= this.twitchAt) { this.twitch = (Math.random() < 0.5 ? -1 : 1) * (0.12 + Math.random() * 0.1); this.twitchAt = t + 3 + Math.random() * 4; }
    this.twitch *= Math.pow(0.02, dt);
    this.head.rotation.z = 0.42 + Math.sin(t * 0.3) * 0.06 + this.twitch;
    this.head.rotation.x = -0.1 + Math.sin(t * 0.22) * 0.03;
    this.neck.rotation.y = Math.sin(t * 0.17) * 0.05;
     
    if (t >= this.curlAt) { this.curlAt = t + 2.5 + Math.random() * 4; this.fingers.forEach((f, i) => { f.curl = 0.9 + (i % 5) * 0.08; f.delay = (i % 5) * 0.06; }); }
    for (const f of this.fingers) { if (f.delay > 0) { f.delay -= dt; continue; } f.curl *= Math.pow(0.15, dt); f.g.rotation.x = f.base + f.curl * 0.6; f.tip.rotation.x = 0.35 + f.curl * 0.9; }
    for (const m of Object.values(this.mats)) m.opacity = m === this.mats.eye ? a * 0.75 : a * 0.96;
  }
  dispose() { this.scene.remove(this.root); this.geos.forEach(g => g.dispose()); Object.values(this.mats).forEach(m => m.dispose()); }
}

 
 
export const WATCHER_SOUND = Object.freeze({ url: '../assets/audio/watcher-giggle.mp3', gain: 1.4, maxDist: 45 });
export class WatcherAudio {
  constructor(engine, { fetchFn = (...a) => fetch(...a) } = {}) { this.engine = engine; this.fetchFn = fetchFn; this.buffer = null; this.loading = null; this.plays = 0; }
  preload() {
    if (this.buffer || this.loading || !this.engine.ctx) return this.loading;
    this.loading = this.fetchFn(new URL(WATCHER_SOUND.url, import.meta.url)).then(r => { if (!r.ok) throw Error('HTTP ' + r.status); return r.arrayBuffer(); })
      .then(b => this.engine.ctx.decodeAudioData(b)).then(buf => { this.buffer = buf; }).catch(e => console.warn('[Watcher sound]', e)).finally(() => { this.loading = null; });
    return this.loading;
  }
  play(pos) {
    const ctx = this.engine.ctx; if (!ctx || !this.buffer || !pos) { this.preload(); return false; }
    const out = this.engine.createSpatialChain({ x: pos.x, y: 1.6, z: pos.z }, WATCHER_SOUND.maxDist); if (!out) return false;
    const src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = this.buffer; g.gain.value = WATCHER_SOUND.gain;
    src.connect(g); g.connect(out); src.start(); src.onended = () => { src.disconnect(); g.disconnect(); }; this.plays++; return true;
  }
}
