 
 
 
 
import { articulatedLeg, tailoredSurface, skinSleeve, headLevels } from './OperatorAnatomy.js';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
class Kit {
  constructor(mats) { this.mats = mats; this.items = new Map(); this.o = new THREE.Object3D(); }
  push(key, g) {
    const n = g.index ? g.toNonIndexed() : g; if (n !== g) g.dispose();
    for (const a of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(a)) n.deleteAttribute(a);
    if (!n.attributes.uv) n.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n.attributes.position.count * 2), 2));
    (this.items.get(key) || this.items.set(key, []).get(key)).push(n); return this;
  }
  put(key, g, p = [0, 0, 0], { r = [0, 0, 0], s = [1, 1, 1], q = null } = {}) {
    this.o.position.set(...p); if (q) this.o.quaternion.copy(q); else this.o.rotation.set(...r); this.o.scale.set(...s); this.o.updateMatrix();
    g.applyMatrix4(this.o.matrix); return this.push(key, g);
  }
  sph(key, p, r, o = {}, w = 28, h = 20) { return this.put(key, new THREE.SphereGeometry(r, w, h), p, o); }
  rbox(key, p, size, rad = 0.02, o = {}) { const [w, h, d] = size; return this.put(key, new RoundedBoxGeometry(w, h, d, 2, Math.min(rad, w / 2.01, h / 2.01, d / 2.01)), p, o); }
  cyl(key, p, rt, rb, h, o = {}, seg = 28) { return this.put(key, new THREE.CylinderGeometry(rt, rb, h, seg), p, o); }
  lathe(key, pts, p = [0, 0, 0], o = {}, seg = 48) { return this.put(key, new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), p, o); }
   
  limb(key, a, b, r, seg = 18) {
    const A = V(...a), B = V(...b), d = B.clone().sub(A), len = d.length();
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize()), m = A.clone().add(B).multiplyScalar(0.5);
    return this.put(key, new THREE.CapsuleGeometry(r, Math.max(0.001, len - r * 0.5), 5, seg), [m.x, m.y, m.z], { q });
  }
   
  seg(key, a, b, prof, radial = 22) {
    const A = V(...a), B = V(...b), d = B.clone().sub(A), len = d.length(), pts = [];
    const r0 = prof[0][1], r1 = prof[prof.length - 1][1];
    for (let k = 4; k >= 1; k--) { const ang = k / 4 * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(1e-4, r0 * Math.cos(ang)), -len / 2 - r0 * 0.7 * Math.sin(ang))); }
    for (const [t, r] of prof) pts.push(new THREE.Vector2(r, -len / 2 + t * len));
    for (let k = 1; k <= 4; k++) { const ang = k / 4 * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(1e-4, r1 * Math.cos(ang)), len / 2 + r1 * 0.7 * Math.sin(ang))); }
    const q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.normalize()), m = A.clone().add(B).multiplyScalar(0.5);
    return this.put(key, new THREE.LatheGeometry(pts, radial), [m.x, m.y, m.z], { q });
  }
   
  band(key, a, b, t, r, h) {
    const A = V(...a), B = V(...b), d = B.clone().sub(A), q = new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), d.clone().normalize()), m = A.clone().lerp(B, t);
    return this.put(key, new THREE.CylinderGeometry(r, r, h, 24, 1, true), [m.x, m.y, m.z], { q });
  }
   
  strand(key, points, r0, r1, { seg = 16, radial = 7, flat = 1 } = {}) {
    const curve = new THREE.CatmullRomCurve3(points.map(p => V(...p))), g = new THREE.TubeGeometry(curve, seg, 1, radial, false);
    const pos = g.attributes.position, frames = curve.computeFrenetFrames(seg, false), c = new THREE.Vector3(), v = new THREE.Vector3();
    for (let i = 0; i <= seg; i++) {
      const t = i / seg, r = r0 + (r1 - r0) * Math.pow(t, 1.15), center = curve.getPointAt(t, c);
      for (let j = 0; j <= radial; j++) {
        const k = i * (radial + 1) + j; v.fromBufferAttribute(pos, k).sub(center);
        const nb = frames.binormals[i], along = v.dot(nb); v.addScaledVector(nb, along * (flat - 1));  
        const hair = key === 'hair' || key === 'hairShade';
        const width = hair ? .68 + .75 * Math.sin(Math.PI * t ** .72) : 1;
        v.multiplyScalar(r * width).add(center); pos.setXYZ(k, v.x, v.y, v.z);
      }
    }
    g.computeVertexNormals(); return this.push(key, g);
  }
  build(shadow = true) {
    const group = new THREE.Group();
    for (const [key, list] of this.items) {
      const geo = list.length > 1 ? mergeGeometries(list, false) : list[0]; if (list.length > 1) list.forEach(g => g.dispose());
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, this.mats[key]); mesh.castShadow = shadow; mesh.receiveShadow = true; mesh.userData.part = key; group.add(mesh);
    }
    return group;
  }
}

 
 
 
 
const REST = new THREE.Vector3(0.04, -0.96, 0.22).normalize();    
const _q = new THREE.Quaternion(), _qb = new THREE.Quaternion(), _p = new THREE.Vector3(), _t = new THREE.Vector3(), _l = new THREE.Vector3();
export const PONYTAIL_LIMITS = Object.freeze({ minBack: 0.04, backPerDown: 0.17, maxSide: 0.55, maxUp: 0.15 });
export function clampTail(local, backPerDown = PONYTAIL_LIMITS.backPerDown) {
  const L = PONYTAIL_LIMITS, down = Math.max(0, -local.y), minZ = L.minBack + backPerDown * down;
  if (local.z < minZ) local.z = minZ;
  local.x = Math.max(-L.maxSide, Math.min(L.maxSide, local.x));
  if (local.y > L.maxUp) local.y = L.maxUp;
  return local.normalize();
}
export function ponytailStep(group, dt) {
  const head = group.parent; if (!head || dt <= 0) return;
  const body = head.parent?.parent || head.parent || head, st = group.userData.tail || (group.userData.tail = { d: null, v: new THREE.Vector3(), last: null });
  head.getWorldQuaternion(_q); body.getWorldQuaternion(_qb); group.getWorldPosition(_p);
  if (!st.d) { st.d = REST.clone().applyQuaternion(_q); st.last = _p.clone(); }
  const vel = _p.clone().sub(st.last).divideScalar(Math.max(dt, 1e-3)); st.last.copy(_p);
   
  _t.set(0, -1, 0).addScaledVector(new THREE.Vector3(0, 0, 1).applyQuaternion(_qb), 0.35).addScaledVector(vel, -0.06).normalize();
  st.v.addScaledVector(_t.sub(st.d), 60 * dt).multiplyScalar(Math.max(0, 1 - 9 * dt));
  st.d.addScaledVector(st.v, dt).normalize();
   
   
  const tie = body.worldToLocal(_p.clone()); let lean = PONYTAIL_LIMITS.backPerDown;
  if (tie.y > 0.62 && Math.abs(tie.x) < 0.24) lean = Math.max(lean, (0.215 - tie.z) / (tie.y - 0.6));
  _l.copy(st.d).applyQuaternion(_qb.clone().invert()); const before = _l.clone(); clampTail(_l, Math.min(lean, 3));
  if (before.distanceToSquared(_l) > 1e-8) st.v.multiplyScalar(0.3);             
  st.d.copy(_l).applyQuaternion(_qb);
  group.quaternion.setFromUnitVectors(REST, st.d.clone().applyQuaternion(_q.invert()));
}
function installPonytail(group) {
  let last = 0;
  const tick = () => { const now = (globalThis.performance?.now?.() ?? Date.now()); const dt = last ? Math.min(0.05, (now - last) / 1000) : 0; if (last && dt < 0.004) return; last = now; ponytailStep(group, dt); };
  group.traverse(o => { if (o.isMesh && !group.userData.ticker) { o.onBeforeRender = tick; group.userData.ticker = o; } });
  group.userData.dispose = () => { if (group.userData.ticker) group.userData.ticker.onBeforeRender = () => {}; };
}

 
 
function sculptedHead(r = 0.122) {
  const g = new THREE.SphereGeometry(r, 64, 48), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); let { x, y, z } = v; x *= 0.91; y *= 1.09;
    if (y < -0.005) { const t = Math.min(1, (-0.005 - y) / 0.125), k = 1 - 0.32 * t * t * (3 - 2 * t); x *= k; z = z < 0 ? z * (1 - 0.16 * t) - 0.01 * t * t : z * (1 - 0.3 * t); }
    if (z < -0.06) z = -0.06 + (z + 0.06) * 0.74;                                                    
    if (z < 0) {
      const bridge = Math.exp(-(x*x/.00012 + (y+.019)**2/.00084));
      const tip = Math.exp(-(x*x/.00019 + (y+.039)**2/.00011));
      z -= bridge*.009 + tip*.009;
      const ck = Math.exp(-(((Math.abs(x) - 0.058) / 0.034) ** 2 + ((y + 0.04) / 0.03) ** 2)); z -= 0.006 * ck;            
      for (const s of [-1, 1]) z += 0.0065 * Math.exp(-(((x - s * 0.044) / 0.028) ** 2 + ((y - 0.002) / 0.022) ** 2)); }             
    p.setXYZ(i, x, y, z);
  }
  g.computeVertexNormals();
   
  const front = []; for (let i = 0; i < p.count; i++) if (p.getZ(i) < -0.03) front.push([p.getX(i), p.getY(i), p.getZ(i)]);
  const frontZ = (x, y) => { let best = 0, bd = Infinity; for (const [a, b, c] of front) { const d = (a - x) ** 2 + (b - y) ** 2; if (d < bd) { bd = d; best = c; } } return best; };
  return { geo: g, frontZ };
}

 
 
export const buildAnimeOperatorParts = (...a) => buildSoraParts(...a);
export function buildSoraParts(look, { T = null, tintTo = (h) => h } = {}) {
  const yuna = look.style === 'yuna';
  const tt = (hex, k) => (T ? tintTo(hex, T.trim, k) : hex);
  const std = (color, r = 0.8, m = 0.04, e = 0, ei = 0) => new THREE.MeshStandardMaterial({ color, roughness: r, metalness: m, emissive: e, emissiveIntensity: ei });
  const accent = T ? T.trim : look.accent, glowC = T ? T.glow : look.accent;
  const mats = {
    top: std(tt(look.top, 0.12), 0.82), pants: std(tt(look.pants, 0.06), 0.86), skin: new THREE.MeshToonMaterial({ color: look.skin }),
    vest: std(look.vest, 0.7, 0.12), gear: std(0x15181d, 0.6, 0.22), boot: std(0x121417, 0.7, 0.05), white: std(0xdfe3ea, 0.75),
    hair: std(look.hairColor, 0.42, 0.06), hairShade: std(new THREE.Color(look.hairColor).multiplyScalar(0.72).getHex(), 0.5, 0.05),
    sleeve: std(look.sleeve ?? look.top, 0.82), eye: std(0xf7f6fb, 0.35), iris: std(look.eyeColor, 0.25, 0, look.eyeColor, 0.18), pupil: std(0x1a1626, 0.3), lash: std(0x26232c, 0.6),
    shine: new THREE.MeshBasicMaterial({ color: 0xffffff }), lip: std(0xd99a96, 0.5),
    trim: std(accent, 0.45, 0.25, accent, T ? 0.5 : 0.35), glow: std(0x0b0f14, 0.2, 0.3, glowC, 2.4),
    helm: std(0x1a1d22, 0.5, 0.3), gun: std(0x23272d, 0.38, 0.8), gunPoly: std(0x33383f, 0.7, 0.1), glass: std(0x0b0f14, 0.15, 0.7),
  };
   
  const U = new Kit(mats);
  U.lathe('pants', [[0, -0.06], [0.15, -0.05], [0.162, 0.02], [0.155, 0.12], [0.145, 0.2], [0, 0.2]], [0, 0, 0], { s: [1, 1, 0.74] });
  U.push('top', tailoredSurface([[0,.027,0,.166,.125],[.004,.09,.002,.17,.128],
    [.005,.19,0,.15,.113],[.005,.30,.001,.135,.103],[.002,.4,-.003,.151,.115],
    [0,.51,-.008,.178,.133],[0,.61,0,.183,.123],[0,.665,.009,.163,.104],
    [0,.72,.006,.108,.079],[0,.76,0,.057,.054]],42,40,.037));
  U.cyl('white', [0, 0.065, 0], 0.172, 0.171, 0.035, { s: [1, 1, 0.74] });  
   
  for (const s of [-1, 1]) {
    const dy = s < 0 ? -0.012 : 0;
    U.seg('top', [s * 0.085, 0.7 + dy, 0.005], [s * 0.3, 0.585 + dy, -0.03], [[0, 0.04], [0.35, 0.052], [0.75, 0.062], [1, 0.06]], 24);
    U.seg('top', [s * 0.245, 0.625 + dy, -0.02], [s * 0.309, 0.55 + dy, -0.038], [[0, 0.048], [0.38, 0.063], [0.7, 0.055], [1, 0.043]], 16);
  }
  U.rbox('gear', [0, 0.19, -0.118], [0.008, 0.29, 0.004], 0.002, { r: [0.08, 0, 0] });                                    
  for (const s of [-1, 1]) U.rbox('lash', [s * 0.166, 0.18, 0], [0.003, 0.28, 0.004], 0.0015);                             
  for (const s of [-1, 1]) U.strand('white', [[s * 0.03, 0.06, -0.122], [s * 0.034, 0.02, -0.126], [s * 0.032, -0.01, -0.124]], 0.004, 0.003, { seg: 6, radial: 5 });  
  U.cyl('skin', [0, 0.8, 0], 0.048, 0.052, 0.12);
  U.cyl('gear', [0, 0.765, 0], 0.066, 0.08, 0.07, {}, 32);                        
  U.cyl('top', [0, 0.745, 0], 0.092, 0.108, 0.085, {}, 32);                          
  if (yuna) {  
    U.put('top', new THREE.SphereGeometry(0.13, 28, 14, 0, Math.PI, 0, Math.PI * 0.5), [0, 0.72, 0.05], { r: [-0.5, 0, 0], s: [1.05, 0.7, 0.9] });
    U.put('white', new THREE.TorusGeometry(0.105, 0.012, 8, 28, Math.PI), [0, 0.775, 0.02], { r: [Math.PI / 2, 0, 0] });  
  }
  U.rbox('gear', [0, 0.17, 0], [0.34, 0.045, 0.26], 0.02);                         
  U.rbox('helm', [0, 0.17, -0.13], [0.06, 0.035, 0.012], 0.006);                  
   
  U.rbox('vest', [0, 0.47, -0.105], [0.31, 0.27, 0.06], 0.025).rbox('vest', [0, 0.47, 0.11], [0.3, 0.28, 0.05], 0.02);
  for (const s of [-1, 1]) { U.rbox('vest', [s * 0.15, 0.47, 0], [0.04, 0.2, 0.2], 0.012); U.strand('vest', [[s * 0.1, 0.6, -0.11], [s * 0.12, 0.68, -0.06], [s * 0.12, 0.7, 0.04], [s * 0.1, 0.6, 0.12]], 0.026, 0.026, { seg: 10, radial: 6, flat: 0.35 }); }
  for (const x of (yuna ? [-0.095, 0, 0.095] : [-0.06, 0.04])) U.rbox('gear', [x, 0.39, -0.15], [0.085, 0.12, 0.05], 0.015).rbox('vest', [x, 0.455, -0.172], [0.08, 0.02, 0.012], 0.005);
  U.rbox('gear', [0.07, 0.56, -0.142], [0.1, 0.06, 0.025], 0.01).rbox('trim', [-0.08, 0.56, -0.14], [0.07, 0.035, 0.01], 0.004);
  U.rbox('gear', [-0.17, 0.12, -0.02], [0.05, 0.11, 0.1], 0.014);
   
  U.rbox('gear', [0, 0.44, 0.15], [0.24, 0.26, 0.06], 0.02);
  U.rbox('glow', [0.035, 0.44, 0.182], [0.012, 0.13, 0.004], 0.002).rbox('glow', [-0.005, 0.381, 0.182], [0.09, 0.012, 0.004], 0.002).rbox('glow', [-0.06, 0.48, 0.182], [0.012, 0.05, 0.004], 0.002);
  U.cyl('gear', [-0.1, 0.7, 0.13], 0.006, 0.008, 0.3, {}, 8);                     
   
  for (const y of [0.505, 0.535]) U.rbox('gear', [0, y, -0.137], [0.27, 0.007, 0.004], 0.002);
  for (const [x, y, w, h] of [[0, 0.598, 0.29, 0.004], [0, 0.342, 0.29, 0.004], [-0.15, 0.47, 0.004, 0.25], [0.15, 0.47, 0.004, 0.25]]) U.rbox('lash', [x, y, -0.1365], [w, h, 0.003], 0.0015);
  for (const [x, y, w, h] of [[0, 0.598, 0.28, 0.004], [0, 0.342, 0.28, 0.004]]) U.rbox('lash', [x, y, 0.1365], [w, h, 0.003], 0.0015);
  U.rbox('gear', [-0.115, 0.6, -0.128], [0.05, 0.075, 0.03], 0.01).rbox('helm', [-0.115, 0.64, -0.128], [0.03, 0.012, 0.03], 0.004);
  U.rbox('white', [0.07, 0.6, -0.1445], [0.08, 0.018, 0.004], 0.002);
  U.rbox('gear', [0.13, 0.15, 0.1], [0.09, 0.08, 0.05], 0.015);
   
  const H = new Kit(mats), eyes = new Kit(mats), tips = new Kit(mats);
  const skull = sculptedHead(); H.push('skin', skull.geo); const fz = skull.frontZ;
  for (const s of [-1, 1]) H.sph('skin', [s * 0.115, -0.01, 0.012], 0.026, { s: [0.45, 1, 0.7] });
  H.strand('lip', [[-0.014, -0.07, fz(-0.014, -0.07) - 0.001], [0, -0.072, fz(0, -0.072) - 0.0015], [0.014, yuna ? -0.066 : -0.071, fz(0.014, -0.07) - 0.001]], 0.0028, 0.0028, { seg: 6, radial: 5 });
   
  for (const s of [-1, 1]) {
     
    const ex = s * 0.044, ey = -0.002, ez = fz(ex, ey) + 0.0008, lid = yuna ? 0.013 : 0.019;
    eyes.sph('eye', [ex, ey, ez], 0.025, { s: [1.08, 0.95, 0.3] }, 24, 16);
    eyes.sph('iris', [ex + s * 0.001, ey - 0.004, ez - 0.0024], 0.018, { s: [0.85, 1.0, 0.3] }, 24, 16);
    eyes.sph('pupil', [ex + s * 0.001, ey - 0.005, ez - 0.0036], 0.008, { s: [0.85, 1.05, 0.3] }, 16, 12);
    eyes.sph('shine', [ex - s * 0.006, ey + 0.002, ez - 0.0078], 0.0034, { s: [1, 1, 0.5] }, 10, 8);
    H.sph('skin', [ex, ey + lid, ez + 0.0012], 0.0285, { s: [1.12, yuna ? 0.66 : 0.6, 0.3] }, 24, 14);                       
    const ll = lid - 0.019;  
    eyes.strand('lash', [[ex - s * 0.029, ey + 0.004 + ll, ez + 0.004], [ex - s * 0.008, ey + 0.012 + ll, ez - 0.007], [ex + s * 0.018, ey + 0.011 + ll, ez - 0.006], [ex + s * 0.032, ey + 0.006 + ll, ez + 0.003]], 0.0042, 0.0024, { seg: 10, radial: 5 });
    eyes.strand('lash', [[ex - s * 0.022, ey - 0.02, ez - 0.0015], [ex + s * 0.012, ey - 0.022, ez - 0.002]], 0.0013, 0.001, { seg: 4, radial: 4 });  
    H.strand('lash', [[ex - s * 0.026, ey + 0.044, fz(ex - s * 0.026, ey + 0.044) - 0.002], [ex, ey + 0.047, fz(ex, ey + 0.047) - 0.003], [ex + s * 0.027, ey + 0.043, fz(ex + s * 0.027, ey + 0.043) - 0.002]], 0.0026, 0.0016, { seg: 8, radial: 5 });
  }
   
  const rnd = (() => { let a = 0x50a7; return () => { a = (a * 1664525 + 1013904223) >>> 0; return a / 4294967296; }; })();
  H.put('hair', new THREE.SphereGeometry(0.136, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.36), [0, 0.012, 0.012], { s: [1, 1.04, 1.06] });            
  H.put('hair', new THREE.SphereGeometry(0.136, 32, 24, 0, Math.PI, Math.PI * 0.3, Math.PI * 0.42), [0, 0.012, 0.016], { s: [1, 1.04, 1.06] });  
  for (const s of [-1, 1]) H.put('hair', new THREE.SphereGeometry(0.135, 16, 16, s > 0 ? Math.PI * 1.02 : Math.PI * 1.73, Math.PI * 0.25, Math.PI * 0.3, Math.PI * 0.3), [0, 0.012, 0.016], { s: [1, 1.04, 1.06] });  
   
  const BANGS = [[-1, -0.03, 0.03], [-0.8, 0.02, 0.026], [-0.6, 0.045, 0.03], [-0.42, 0.03, 0.024], [-0.25, 0.05, 0.032], [-0.1, 0.008, 0.02], [0.05, 0.04, 0.03], [0.2, 0.055, 0.026], [0.36, 0.022, 0.03], [0.55, 0.048, 0.025], [0.75, 0.015, 0.03], [0.95, -0.025, 0.028]];
  const SWEEP = yuna ? 0.026 : -0.018;  
  BANGS.forEach(([t, tipY0, w0], i) => {
    const x = t * 0.1 + (rnd() - 0.5) * 0.012, hook = (Math.abs(t) > 0.6 ? 1 : -1) * Math.sign(t || 1) * (0.006 + rnd() * 0.012), lift = rnd() * 0.014;
    const sw = SWEEP * (0.4 + rnd() * 1.1), tipY = tipY0 + (rnd() - 0.5) * 0.02, w = w0 * (0.75 + rnd() * 0.5), bow = (rnd() - 0.5) * 0.012;
    H.strand(i % 4 === 1 ? 'hairShade' : 'hair', [[x * 0.4, 0.13, -0.03], [x * 0.88 + sw * 0.15, 0.115, -0.112], [x * 1.02 + sw * 0.45 + bow, 0.078 + lift, -0.142], [x * 1.06 + hook * 0.5 + sw * 0.75, (0.078 + tipY) / 2, -0.146], [x * 1.08 + hook + sw, tipY, -0.137]], w, 0.0012, { flat: 0.32 + rnd() * 0.18, seg: 14 });
    if (i % 3 === 0) H.strand('hair', [[x * 0.9, 0.11, -0.118], [x * 1.04 + hook, 0.07, -0.145], [x * 1.1 + hook * 1.6, tipY + 0.025, -0.14]], 0.009, 0.001, { seg: 8, radial: 5 });  
  });
   
  for (const s of [-1, 1]) (yuna ? [[0, 0.032, -0.215], [1, 0.028, -0.19], [2, 0.03, -0.225]] : [[0, 0.03, -0.2], [1, 0.024, -0.18], [2, 0.028, -0.21]]).forEach(([i, w, tipY]) => {
    const z = -0.075 + i * 0.035;
    (yuna ? tips : H).strand(i === 1 ? 'hairShade' : 'hair', [[s * 0.1, 0.09, z], [s * 0.133, 0.02, z - 0.01], [s * 0.13, -0.09, z - 0.02], [s * (0.12 + i * 0.008), tipY + 0.05, z - 0.03], [s * (yuna ? 0.15 + i * 0.01 : 0.13 + i * 0.008), tipY, z - 0.05 - rnd() * 0.02]], w, 0.0015, { flat: 0.48, seg: 16 });
  });
   
  for (let i = 0; i < (yuna ? 15 : 9); i++) {
     
    const n = yuna ? 14 : 8, a = (i / n - 0.5) * (yuna ? 3.2 : 2.2), x = Math.sin(a) * 0.12, z = Math.cos(a) * 0.12 + 0.02, len = yuna ? 0.17 + rnd() * 0.04 : 0.15 + rnd() * 0.07;
    const fl = yuna ? 1.32 : 1.12;  
    H.strand(i % 2 ? 'hairShade' : 'hair', [[x * 0.8, 0.1, z * 0.6], [x * 1.1, 0.0, z * 1.05], [x * 1.12, -len * 0.7, z * 1.12], [x * fl * (0.95 + rnd() * 0.08), -len, z * fl]], 0.028 + rnd() * 0.008, 0.002, { flat: 0.55 });
  }
  if (yuna) {  
    tips.strand('hair', [[0.0, 0.14, 0.0], [0.0, 0.21, 0.02], [0.05, 0.26, 0.0], [0.06, 0.22, -0.04], [0.02, 0.2, -0.03]], 0.011, 0.002, { seg: 18 });
    for (const [x, z, dx] of [[0.09, 0.05, 0.05], [-0.1, 0.03, -0.05], [0.06, 0.1, 0.03]]) H.strand('hairShade', [[x * 0.8, 0.09, z], [x * 1.25, 0.04, z + 0.01], [x * 1.3 + dx, 0.03, z + 0.02]], 0.01, 0.001, { seg: 8, radial: 5 });
  } else H.strand('hair', [[0.0, 0.14, -0.01], [0.01, 0.18, 0.0], [0.035, 0.19, -0.015], [0.045, 0.17, -0.03]], 0.007, 0.001, { seg: 12 });
  if (!yuna) H.strand('hair', [[-0.01, 0.14, 0.0], [-0.022, 0.17, 0.01], [-0.04, 0.175, -0.005]], 0.005, 0.001, { seg: 10 });
  const tie = [0.03, 0.1, 0.115];
  if (!yuna) H.cyl('gear', tie, 0.026, 0.026, 0.03, { r: [1.3, 0, 0.2] }, 20);
   
  const P = new Kit(mats);
  for (let i = 0; i < (yuna ? 0 : 13); i++) {
    const a = i / 13 * Math.PI * 2, sx = Math.cos(a) * 0.022, sz = Math.sin(a) * 0.018, sway = (i % 4 - 1.5) * 0.02, len = 0.4 + rnd() * 0.12, curl = (rnd() - 0.5) * 0.04;
    P.strand(i % 3 ? 'hair' : 'hairShade', [[sx * 0.5, 0, sz * 0.5], [0.02 + sx, 0.012, 0.06 + sz], [0.035 + sx + sway, -0.07, 0.11 + sz], [0.035 + sway * 1.5, -0.25, 0.13 + sz * 1.4], [0.02 + sway * 2 + curl, -len, 0.1 + curl]], 0.03 + rnd() * 0.006, 0.002, { seg: 18, flat: 0.6 });
  }
  const ponyMesh = P.build(); const ponytail = new THREE.Group(); ponytail.name = 'sora-ponytail'; ponytail.position.set(...tie); ponytail.add(ponyMesh);
  if (!yuna) for (const [x, y] of [[-0.088, 0.1], [-0.093, 0.078]]) H.rbox('gear', [x, y, -0.13], [0.05, 0.009, 0.01], 0.004, { r: [0.25, 0.3, -0.25] });  
  if (yuna) {  
    H.put('gear', new THREE.TorusGeometry(0.143, 0.009, 8, 48), [0, 0.075, 0.012], { r: [Math.PI / 2 + 0.42, 0, 0], s: [1, 1.06, 1] });  
    for (const s of [-1, 1]) {
      H.rbox('gear', [s * 0.045, 0.125, -0.115], [0.075, 0.05, 0.035], 0.016, { r: [-0.65, s * 0.18, 0] });
      H.rbox('glass', [s * 0.045, 0.128, -0.13], [0.06, 0.036, 0.012], 0.012, { r: [-0.65, s * 0.18, 0] });
      H.rbox('glow', [s * 0.07, 0.137, -0.136], [0.012, 0.006, 0.004], 0.002, { r: [-0.65, s * 0.18, 0] });
    }
    H.rbox('gear', [0, 0.12, -0.122], [0.03, 0.02, 0.02], 0.006, { r: [-0.65, 0, 0] });
  }
   
  H.strand('gear', [[-0.142, 0.0, 0.0], [-0.12, 0.12, 0.0], [0, 0.17, 0.0], [0.12, 0.12, 0.0], [0.142, 0.0, 0.0]], 0.012, 0.012, { seg: 24, radial: 8, flat: 0.5 });
  for (const s of [-1, 1]) {
    H.cyl('gear', [s * 0.146, -0.01, 0.005], 0.044, 0.044, 0.04, { r: [0, 0, Math.PI / 2] }, 32).cyl('helm', [s * 0.128, -0.01, 0.005], 0.045, 0.045, 0.02, { r: [0, 0, Math.PI / 2] }, 28);
    H.rbox('glow', [s * 0.167, -0.01, 0.005], [0.004, 0.01, 0.042], 0.002);
  }
  H.strand('gear', [[-0.15, -0.03, -0.02], [-0.13, -0.08, -0.08], [-0.07, -0.085, -0.115], [-0.035, -0.075, -0.125]], 0.005, 0.004, { seg: 12, radial: 6 });
  H.sph('helm', [-0.033, -0.075, -0.126], 0.011, { s: [1.4, 1, 1] });
   
  const A = new Kit(mats), LA = new Kit(mats), MG = new Kit(mats), G = new Kit(mats), gx = -0.14;
  const rElbow = [0.035, -0.25, -0.1], rHand = [gx + 0.01, -0.15, -0.27], lSh = [-0.64, 0, 0], MAG = [gx, -0.1, -0.42];
  const lElbow = [0.09, -0.23, -0.27], lHand = [gx - 0.02 - lSh[0], -0.105, -0.62];
  const arm = (K, elbow, hand, armband) => {
    const root = V(0,-.01,0), bend = V(...elbow), wrist = V(...hand);
    const section = (from,to,t,x,z) => [...from.clone().lerp(to,t).toArray(),x,z];
    K.push('sleeve', tailoredSurface([
      section(root,bend,-.13,.028,.035), section(root,bend,.08,.064,.066),
      section(root,bend,.36,.058,.054), section(root,bend,.66,.049,.054),
      section(root,bend,.93,.044,.046), section(bend,wrist,.12,.046,.044),
      section(bend,wrist,.34,.049,.044), section(bend,wrist,.68,.038,.035),
      section(bend,wrist,.96,.032,.028)],32,22,.045));
    if (yuna) K.band('top', elbow, hand, 0.8, 0.042, 0.07); else K.band('white', elbow, hand, 0.74, 0.041, 0.03).band('top', elbow, hand, 0.82, 0.041, 0.045);
    if (armband) {
      K.band('trim', [0, -0.01, 0], elbow, 0.6, 0.054, 0.05);
       
      const m = V(0, -0.01, 0).lerp(V(...elbow), 0.3), out = V(-1, 0, 0), q = new THREE.Quaternion().setFromUnitVectors(V(0, 0, 1), out);
      K.put('white', new RoundedBoxGeometry(0.055, 0.055, 0.008, 2, 0.008), [m.x - 0.056, m.y, m.z], { q });
      K.put('trim', new THREE.CylinderGeometry(0.019, 0.019, 0.004, 3), [m.x - 0.0605, m.y + 0.002, m.z], { r: [Math.PI / 2, 0, -Math.PI / 2], s: [1, 1, 1] });
    }
    K.sph('gear', hand, 0.04, { s: [0.85, 1.05, 1.2] }).sph('skin', [hand[0], hand[1] - 0.02, hand[2] - 0.035], 0.024, { s: [1.3, 0.8, 1] });
  };
  arm(A, rElbow, rHand, false); arm(LA, lElbow, lHand, true);
  G.rbox('gunPoly', [gx, -0.065, -0.04], [0.045, 0.1, 0.2], 0.015).rbox('gun', [gx, -0.05, -0.36], [0.06, 0.105, 0.36], 0.014).rbox('gunPoly', [gx, -0.045, -0.66], [0.056, 0.075, 0.27], 0.016);
  G.cyl('gun', [gx, -0.04, -0.85], 0.013, 0.013, 0.14, { r: [Math.PI / 2, 0, 0] }, 12).rbox('gun', [gx, 0.045, -0.4], [0.045, 0.05, 0.1], 0.012).rbox('gunPoly', [gx, -0.15, -0.275], [0.042, 0.11, 0.055], 0.012, { r: [-0.3, 0, 0] });
  MG.rbox('gunPoly', [0, -0.085, 0], [0.036, 0.18, 0.07], 0.01, { r: [-0.22, 0, 0] });
  const arms = A.build(), armL = LA.build(), mag = MG.build(), gun = G.build(); armL.position.set(...lSh); mag.position.set(...MAG); arms.add(armL, mag, gun);
  const rightSleeve = skinSleeve(arms,rElbow,rHand), leftSleeve = skinSleeve(armL,lElbow,lHand);
   
  const KNEE = [0, -0.4, -0.01];
  const leg = side => {
    const Th = new Kit(mats), Sh = new Kit(mats), k = KNEE[1];
    Th.band('gear', [0, 0.03, 0], [0, -0.39, -0.01], 0.3, 0.088, 0.025).band('gear', [0, 0.03, 0], [0, -0.39, -0.01], 0.6, 0.078, 0.025);
    if (side > 0) Th.rbox('gear', [0.085, -0.17, -0.01], [0.05, 0.17, 0.11], 0.016).rbox('vest', [0.112, -0.13, -0.01], [0.012, 0.06, 0.06], 0.004);  
    Sh.rbox('gear', [0, -0.01, -0.06], [0.12, 0.13, 0.06], 0.03).rbox('vest', [0, 0.0, -0.088], [0.07, 0.07, 0.012], 0.01);   
    Sh.rbox('boot', [0, -0.69 - k, -0.03], [0.13, 0.16, 0.29], 0.045).rbox('boot', [0, -0.59 - k, 0.01], [0.12, 0.13, 0.15], 0.035).rbox('gear', [0, -0.77 - k, -0.03], [0.14, 0.025, 0.3], 0.01);
    for (const y of [-0.56, -0.62]) Sh.cyl('gear', [0, y - k, 0.01], 0.066, 0.066, 0.016, {}, 24);
    const hip = Th.build(), knee = Sh.build(); knee.position.set(...KNEE); hip.add(knee);
    return { hip, knee: articulatedLeg(hip,knee,side,mats.pants) };
  };
  const LL = leg(-1), LR = leg(1);
   
  LL.hip.rotation.set(-0.02, 0, -0.03); LR.hip.rotation.set(0.01, 0, 0.022);
  const headGroup = H.build();
  headLevels(headGroup,mats);
  const gaze = eyes.build(), fringe = tips.build();
  headGroup.add(gaze, fringe);
  let elapsed = Math.random() * 3, sway = 0;
  headGroup.userData.animateFace = (dt, pose) => {
    elapsed += dt;
    const cycle = elapsed % (yuna ? 4.35 : 3.72);
    const close = pose.dead ? 1 : cycle < .19 ? Math.sin(Math.PI * cycle / .19) ** 2 : 0;
    gaze.scale.y = 1 - close * .97;
    gaze.position.y = -.012 * close;
    const motion = Math.min(1, (pose.speed || 0) / 6);
    const flex = pose.dead ? 0 : (.012 + motion * .038) * Math.sin(elapsed * (2 + 6 * motion));
    rightSleeve.joint.rotation.x = flex; leftSleeve.joint.rotation.x = -.8 * flex;
    const aim = pose.aiming ? .35 : 1;
    headGroup.rotation.z = pose.dead ? 0 : aim * (yuna ? .032 : .009) * Math.sin(elapsed * 1.55);
    headGroup.position.y = pose.dead ? 0 : .0025 * Math.sin(elapsed * (yuna ? 1.65 : 1.88));
    if (yuna) {
      const target = .022 * Math.sin(elapsed * 2) + motion * .055 * Math.sin(elapsed * 8);
      sway += (target - sway) * (1 - Math.exp(-10 * dt));
      fringe.rotation.z = sway;
    }
  }; if (!yuna) { headGroup.add(ponytail); installPonytail(ponytail); }
  const parts = { upper: U.build(), head: headGroup, ponytail: yuna ? null : ponytail, legL: LL.hip, legR: LR.hip, kneeL: LL.knee, kneeR: LR.knee, arms, armL, mag, gun, materials: mats, flash: mats.top };
  parts.dispose = () => { rightSleeve.skeleton.dispose(); leftSleeve.skeleton.dispose(); LL.hip.userData.releaseSkeleton(); LR.hip.userData.releaseSkeleton(); ponytail.userData.dispose?.(); for (const g of [parts.upper, parts.head, parts.legL, parts.legR, parts.arms]) g.traverse(o => { if (!o.userData.sharedGeometry) o.geometry?.dispose?.(); }); Object.values(mats).forEach(m => m.dispose()); };
  return parts;
}
