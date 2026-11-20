 
 
 
 
 
 
 
 
 
 
 
 
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const canvasOk = () => typeof document !== 'undefined' && typeof document.createElement === 'function' && !!document.createElement('canvas').getContext?.('2d');

 
const FACE = { phiStart: Math.PI / 2 - 0.95, phiLen: 1.9, thetaStart: 0.2 * Math.PI, thetaLen: 0.8 * Math.PI, r: 0.1225, sc: [0.86, 1.28, 0.95] };
const EYE_Y = 0.4, EYE_U = 0.33, MOUTH_Y = 0.64, MOUTH_U0 = 0.3, MOUTH_U1 = 0.7;
function facePt(uf, yf, lift = 0, out = new THREE.Vector3()) {
  const phi = FACE.phiStart + uf * FACE.phiLen, th = FACE.thetaStart + yf * FACE.thetaLen, r = FACE.r + lift;
  return out.set(-r * Math.cos(phi) * Math.sin(th) * FACE.sc[0], r * Math.cos(th) * FACE.sc[1], r * Math.sin(phi) * Math.sin(th) * FACE.sc[2]);
}
function faceGeo(y0, y1, segH) {  
  const th0 = FACE.thetaStart + y0 * FACE.thetaLen, g = new THREE.SphereGeometry(FACE.r, 28, segH, FACE.phiStart, FACE.phiLen, th0, (y1 - y0) * FACE.thetaLen);
  const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - (y0 + (1 - uv.getY(i)) * (y1 - y0)));
  g.scale(...FACE.sc); return g;
}

let texCache = null;
function textures() {
  if (texCache !== null) return texCache;
  if (!canvasOk()) return (texCache = {});
  const make = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; };
  const seeded = (seed) => { let s = seed; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296); };
  const rnd = seeded(0x0a1b2c);
   
  const hair = make(128, 512, (x, w, h) => {
    x.clearRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { const sx = rnd() * w, len = h * (0.55 + rnd() * 0.45), wob = 2 + rnd() * 6, sh = 10 + Math.floor(rnd() * 22);
      x.strokeStyle = `rgba(${sh},${sh},${sh + 4},${0.55 + rnd() * 0.45})`; x.lineWidth = 0.8 + rnd() * 2.2; x.beginPath(); x.moveTo(sx, 0);
      for (let y = 0; y <= len; y += 16) x.lineTo(sx + Math.sin(y * 0.02 + i) * wob, y); x.stroke(); }
    for (let i = 0; i < 40; i++) { x.strokeStyle = 'rgba(120,130,140,.12)'; x.lineWidth = 1; const sx = rnd() * w; x.beginPath(); x.moveTo(sx, rnd() * h * 0.3); x.lineTo(sx + 2, h * (0.4 + rnd() * 0.4)); x.stroke(); }
  });
   
  const cloth = make(256, 256, (x, w, h) => {
    x.fillStyle = '#c9c6bd'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 1800; i++) { const v = 150 + Math.floor(rnd() * 70); x.fillStyle = `rgba(${v},${v - 4},${v - 10},.25)`; x.fillRect(rnd() * w, rnd() * h, 2, 6); }
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(60,52,40,.55)'); g.addColorStop(0.35, 'rgba(70,64,52,.15)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { x.fillStyle = `rgba(52,58,60,${0.12 + rnd() * 0.18})`; x.beginPath(); x.ellipse(rnd() * w, rnd() * h, 6 + rnd() * 26, 10 + rnd() * 40, rnd(), 0, Math.PI * 2); x.fill(); }
    for (let i = 0; i < 70; i++) { x.strokeStyle = 'rgba(40,36,30,.35)'; x.beginPath(); const sx = rnd() * w; x.moveTo(sx, 0); x.lineTo(sx + (rnd() - 0.5) * 8, 10 + rnd() * 50); x.stroke(); }
  });
   
  const skin = make(128, 128, (x, w, h) => {
    x.fillStyle = '#b4bac4'; x.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) { x.strokeStyle = `rgba(50,60,95,${0.18 + rnd() * 0.25})`; x.lineWidth = 0.6 + rnd(); x.beginPath(); let px = rnd() * w, py = rnd() * h; x.moveTo(px, py); for (let k = 0; k < 6; k++) { px += (rnd() - 0.5) * 22; py += (rnd() - 0.5) * 22; x.lineTo(px, py); } x.stroke(); }
    for (let i = 0; i < 500; i++) { x.fillStyle = `rgba(90,90,100,${rnd() * 0.08})`; x.fillRect(rnd() * w, rnd() * h, 2, 2); }
  });
   
  const face = (dark) => make(256, 256, (x, w, h) => {
    const r2 = seeded(dark ? 0x5eed02 : 0x5eed01), P = (u, y) => [u * w, y * h];
    x.fillStyle = dark ? '#141116' : '#c6ccd6'; x.fillRect(0, 0, w, h);
    const edge = x.createRadialGradient(w / 2, h * 0.45, w * 0.12, w / 2, h * 0.5, w * 0.62); edge.addColorStop(0, 'rgba(0,0,0,0)'); edge.addColorStop(1, dark ? 'rgba(0,0,0,.7)' : 'rgba(40,46,60,.55)'); x.fillStyle = edge; x.fillRect(0, 0, w, h);
    const blot = (u, y, rx, ry, a, col) => { const [cx, cy] = P(u, y), gr = x.createRadialGradient(cx, cy, 0, cx, cy, Math.max(rx, ry)); gr.addColorStop(0, `rgba(${col},${a})`); gr.addColorStop(1, `rgba(${col},0)`); x.save(); x.translate(cx, cy); x.scale(rx / Math.max(rx, ry), ry / Math.max(rx, ry)); x.translate(-cx, -cy); x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, Math.max(rx, ry), 0, Math.PI * 2); x.fill(); x.restore(); };
    for (const s of [-1, 1]) { blot(0.5 + s * 0.24, 0.6, 30, 46, 0.55, '20,22,34'); blot(0.5 + s * (0.5 - EYE_U), EYE_Y, 44, 36, 0.95, '6,6,10'); blot(0.5 + s * (0.5 - EYE_U), EYE_Y - 0.09, 40, 12, 0.5, '10,10,16'); }  
     
    const crack = (sx, sy, len, col, lw) => { x.strokeStyle = col; x.lineWidth = lw; x.beginPath(); let px = sx, py = sy; x.moveTo(px, py); for (let k = 0; k < len; k++) { px += (r2() - 0.5) * 18; py += (r2() - 0.35) * 14; x.lineTo(px, py); } x.stroke(); };
    for (let i = 0; i < 26; i++) { const s = r2() < 0.5 ? -1 : 1, [ex, ey] = P(0.5 + s * (0.5 - EYE_U), EYE_Y); crack(ex + (r2() - 0.5) * 40, ey + (r2() - 0.5) * 30, 5 + Math.floor(r2() * 5), dark ? `rgba(255,${30 + r2() * 40},20,${0.5 + r2() * 0.4})` : `rgba(48,58,96,${0.25 + r2() * 0.3})`, 0.8 + r2() * 1.4); }
    for (let i = 0; i < 6; i++) crack(w * (0.3 + r2() * 0.4), 4, 7, dark ? 'rgba(255,40,20,.7)' : 'rgba(30,30,40,.55)', 1.2);
     
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { const [ex, ey] = P(0.5 + s * (0.5 - EYE_U) + (k - 1) * 0.03, EYE_Y + 0.07); x.strokeStyle = dark ? `rgba(230,20,12,${0.75 - k * 0.15})` : `rgba(6,6,10,${0.9 - k * 0.2})`; x.lineWidth = 5 - k * 1.3; x.lineCap = 'round'; x.beginPath(); x.moveTo(ex, ey); let py = ey, px = ex; while (py < h) { py += 10; px += (r2() - 0.5) * 3; x.lineTo(px, py); } x.stroke(); }
     
    const [m0x, my] = P(MOUTH_U0, MOUTH_Y), [m1x] = P(MOUTH_U1, MOUTH_Y);
    x.strokeStyle = dark ? 'rgba(90,10,10,.9)' : 'rgba(70,64,82,.85)'; x.lineWidth = 9; x.beginPath(); x.moveTo(m0x, my - 14); x.quadraticCurveTo(w / 2, my + 10, m1x, my - 14); x.stroke();
    x.strokeStyle = '#030305'; x.lineWidth = 4; x.beginPath(); x.moveTo(m0x, my - 14); x.quadraticCurveTo(w / 2, my + 8, m1x, my - 14); x.stroke();
    for (let i = 0; i < 1400; i++) { x.fillStyle = `rgba(${dark ? '255,40,30' : '60,64,80'},${r2() * 0.06})`; x.fillRect(r2() * w, r2() * h, 2, 2); }  
  });
  const puff = make(64, 64, (x) => { const gr = x.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,.9)'); gr.addColorStop(0.5, 'rgba(255,255,255,.25)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); });
  return (texCache = { hair, cloth, skin, puff, face: face(false), faceDark: face(true) });
}

const bake = (geo, [x = 0, y = 0, z = 0] = [], [rx = 0, ry = 0, rz = 0] = [], [sx = 1, sy = 1, sz = 1] = []) => { const o = new THREE.Object3D(); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz); o.updateMatrix(); return geo.applyMatrix4(o.matrix); };
const NECK_LEN = 0.26, NECK_TILT = 0.28;

export function makeOnryo({ shadow = false } = {}) {
  const T = textures(), g = new THREE.Group(), rig = {};
  const robe = new THREE.MeshStandardMaterial({ color: shadow ? 0x070608 : 0xffffff, map: shadow ? null : T.cloth || null, roughness: 0.95, emissive: shadow ? 0x0a0102 : 0x1d2632, emissiveIntensity: shadow ? 1 : 0.28, transparent: true, side: THREE.DoubleSide });
  const skin = new THREE.MeshStandardMaterial({ color: shadow ? 0x1c1a1e : 0xbfc6d2, map: shadow ? null : T.skin || null, roughness: 0.6, emissive: shadow ? 0x0e0204 : 0x141a24, emissiveIntensity: 0.35, transparent: true });
   
  const faceTex = shadow ? T.faceDark : T.face;
  const faceMat = new THREE.MeshStandardMaterial({ color: faceTex ? 0xffffff : (shadow ? 0x1c1a1e : 0xc6ccd6), map: faceTex || null, emissive: shadow ? 0xffffff : 0x9fb0c8, emissiveMap: faceTex || null, emissiveIntensity: shadow ? 0.5 : 0.12, roughness: 0.55, transparent: true });
  const hair = new THREE.MeshStandardMaterial({ color: 0xffffff, map: T.hair || null, alphaTest: T.hair ? 0.35 : 0, roughness: 0.35, metalness: 0.1, transparent: true, side: THREE.DoubleSide, ...(T.hair ? {} : { color: 0x050506 }) });
  const dark = new THREE.MeshBasicMaterial({ color: 0x010102, transparent: true });                     
  const eyeBase = shadow ? new THREE.Color(3.2, 0.18, 0.12) : new THREE.Color(1.05, 1.08, 1.12);
  const eye = new THREE.MeshBasicMaterial({ color: eyeBase.clone(), transparent: true, toneMapped: false });
  const pupil = new THREE.MeshBasicMaterial({ color: shadow ? 0x220000 : 0x000000, transparent: true });
  const iris = new THREE.MeshBasicMaterial({ color: shadow ? 0x5a0000 : 0x7f8a99, transparent: true });
  const tooth = new THREE.MeshStandardMaterial({ color: shadow ? 0x2a2224 : 0xd6cfbd, roughness: 0.4, emissive: shadow ? 0x300404 : 0x1a1a1a, transparent: true });
  const mats = [robe, skin, faceMat, hair, dark, eye, pupil, tooth, iris];

   
  const H = 1.5, pts = []; for (let i = 0; i <= 18; i++) { const t = i / 18; pts.push(new THREE.Vector2(0.12 + Math.pow(1 - t, 1.6) * 0.24 + Math.sin(t * 11) * 0.008, t * H)); }
  pts.push(new THREE.Vector2(0.05, H + 0.05));
  const robeGeo = new THREE.LatheGeometry(pts, 28), pos = robeGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) if (pos.getY(i) < 0.12) { const a = Math.atan2(pos.getZ(i), pos.getX(i)); pos.setY(i, pos.getY(i) - 0.05 - Math.abs(Math.sin(a * 7)) * 0.24 - Math.abs(Math.sin(a * 17 + 1)) * 0.1); }
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), height = THREE.MathUtils.clamp(pos.getY(i) / H, 0, 1);
    const angle = Math.atan2(z, x);
    const fold = 1 + (0.09 * Math.cos(9 * angle + height) + 0.045 * Math.sin(5 * angle - height * 3)) * (1 - height * 0.7);
    const shoulder = THREE.MathUtils.smoothstep(height, 0.76, 0.99);
    pos.setX(i, x * fold * (1 + shoulder * 0.62));
    pos.setZ(i, z * fold * (0.84 - shoulder * 0.14));
  }
  robeGeo.computeVertexNormals();
  const body = new THREE.Group(); body.position.y = -0.1; g.add(body); rig.body = body;
  const spine = new THREE.Group(); body.add(spine); rig.spine = spine;  
  const torso = new THREE.Mesh(robeGeo, robe); spine.add(torso);
  const sash = new THREE.Mesh(new THREE.CylinderGeometry(0.145, 0.155, 0.1, 20, 1, true), robe); sash.position.set(0, 0.98, 0.02); spine.add(sash);

   
  for (const s of [-1, 1]) { const f = new THREE.Group(); f.position.set(s * 0.09, 0.02, 0.05); body.add(f);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.032, 0.34, 8), skin); shin.position.y = -0.06; f.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.035, 0.22), skin); foot.position.set(0, -0.24, 0.05); foot.rotation.x = 1.2; f.add(foot); rig['foot' + s] = f; }

   
  const neck = new THREE.Group(); neck.position.set(0, H + 0.01, 0.06); spine.add(neck); rig.neck = neck;
  const neckGeo = new THREE.CylinderGeometry(0.032, 0.046, NECK_LEN, 10, 4); neckGeo.translate(0, NECK_LEN / 2, 0);
  const neckMesh = new THREE.Mesh(neckGeo, skin); neckMesh.rotation.z = NECK_TILT; neck.add(neckMesh); rig.neckMesh = neckMesh;
  const head = new THREE.Group(); neck.add(head); rig.head = head;

   
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.12, 20, 16, FACE.phiStart + FACE.phiLen, Math.PI * 2 - FACE.phiLen), skin); skull.scale.set(...FACE.sc); head.add(skull);
  const upper = new THREE.Mesh(faceGeo(0, MOUTH_Y, 12), faceMat); head.add(upper);
  const jawPivot = new THREE.Vector3(0, facePt(0.5, MOUTH_Y).y + 0.03, -0.03);
  const jaw = new THREE.Group(); jaw.position.copy(jawPivot); head.add(jaw); rig.jaw = jaw; rig.jawPivot = jawPivot;
  const lowerGeo = faceGeo(MOUTH_Y, 1, 8); lowerGeo.translate(-jawPivot.x, -jawPivot.y, -jawPivot.z); jaw.add(new THREE.Mesh(lowerGeo, faceMat));
   
  const mc = facePt(0.5, MOUTH_Y + 0.04, -0.06);
  const maw = new THREE.MeshBasicMaterial({ color: shadow ? 0x3a0303 : 0x14060a, transparent: true }); mats.push(maw);  
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(1, 14, 10), maw); mouth.position.copy(mc); mouth.scale.set(0.07, 0.03, 0.03); head.add(mouth); rig.mouth = mouth; rig.mouthY = mc.y;
   
  const up = [], lo = [], v = new THREE.Vector3(), N = 15;
  for (let i = 0; i < N; i++) { const uf = 0.34 + (i / (N - 1)) * 0.32, bend = Math.pow((i / (N - 1)) * 2 - 1, 2) * 0.05, L = 0.02 + ((i * 7) % 5) * 0.006;
    facePt(uf, MOUTH_Y - 0.03 - bend, 0.001, v); up.push(bake(new THREE.ConeGeometry(0.0048, L, 4), [v.x, v.y - L / 2, v.z], [Math.PI + ((i * 5) % 3 - 1) * 0.15, 0, ((i * 2) % 5 - 2) * 0.09]));
    facePt(uf, MOUTH_Y + 0.035 - bend, 0.001, v); lo.push(bake(new THREE.ConeGeometry(0.0042, L * 0.85, 4), [v.x - jawPivot.x, v.y + L * 0.42 - jawPivot.y, v.z - jawPivot.z], [((i * 7) % 3 - 1) * 0.15, 0, ((i * 5) % 3 - 1) * 0.2])); }
  head.add(new THREE.Mesh(mergeGeometries(up), tooth)); jaw.add(new THREE.Mesh(mergeGeometries(lo), tooth)); up.concat(lo).forEach(p => p.dispose());
   
  rig.eyes = [];
  for (const s of [-1, 1]) { const c = facePt(0.5 + s * (0.5 - EYE_U), EYE_Y, -0.017), n = c.clone().normalize();
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.024, 14, 10), eye); e.position.copy(c); e.scale.set(1.1, s < 0 ? 0.64 : 0.77, 0.96); head.add(e);
    const ir = new THREE.Mesh(new THREE.SphereGeometry(0.0105, 12, 8), iris); ir.position.copy(c).addScaledVector(n, 0.0205); ir.lookAt(ir.position.clone().add(n)); ir.scale.set(1, 1, 0.35); head.add(ir);
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.0034, 8, 6), pupil); p.position.copy(c).addScaledVector(n, 0.0238); head.add(p); rig.eyes.push(e, p); }
   
  const scalp = new THREE.Mesh(new THREE.SphereGeometry(0.134, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.46), hair); scalp.scale.set(0.9, 1.3, 0.98); scalp.rotation.x = -0.25; head.add(scalp);

   
  const strands = new THREE.Group(); neck.add(strands); rig.strands = strands;
  const clumps = [];
  for (let c = 0; c < 6; c++) {
    const parts = [];
    for (let i = 0; i < 26; i++) {
      const a = ((c * 26 + i) / 156) * Math.PI * 2, front = Math.cos(a) > 0.3, gap = front && Math.abs(Math.sin(a)) < 0.6;
      if (gap && i % 9) continue;  
      const len = front ? 0.75 + ((i * 13) % 7) * 0.06 : 1.05 + ((i * 7) % 9) * 0.06, w = gap ? 0.012 : 0.045 + ((i * 3) % 4) * 0.01;
      const p = new THREE.PlaneGeometry(1, 1, 2, 12);
      const pp = p.attributes.position;
      const phase = c * 1.43 + i * 2.39;
      for (let k = 0; k < pp.count; k++) {
        const t = 0.5 - pp.getY(k), edge = pp.getX(k) * 2;
        const breadth = w * (0.38 + 0.62 * Math.sin(Math.min(1, t * 3) * Math.PI / 2)) * (1 - Math.pow(t, 1.65) * 0.98);
        const sweep = Math.sin(a) * Math.sin(Math.PI * t) * 0.046;
        const wave = Math.sin(t * 8 + phase) * t * 0.032;
        pp.setXYZ(k, edge * breadth * 0.5 + sweep + wave, -len * t,
          0.037 * Math.sin(Math.PI * t) + (1 - edge * edge) * breadth * 0.22 + 0.024 * Math.sin(t * 5 + phase) * t);
      }
      p.computeVertexNormals();
      const top = 0.089 + 0.016 * Math.sin(phase), r = 0.122 + 0.005 * Math.cos(phase);
      parts.push(bake(p, [Math.sin(a) * r * 0.9, top, Math.cos(a) * r], [0, a, 0]));
    }
    if (!parts.length) continue;
    const m = new THREE.Mesh(mergeGeometries(parts), hair); parts.forEach(p => p.dispose()); const cg = new THREE.Group(); cg.add(m); strands.add(cg); clumps.push(cg);
  }
  rig.clumps = clumps;

   
  rig.arms = [];
  for (const s of [-1, 1]) {
    const sh = new THREE.Group(); sh.position.set(s * 0.16, H - 0.06 - (s < 0 ? 0.07 : 0), 0.03); sh.rotation.z = s * 0.05; spine.add(sh);  
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.085, 0.46, 12, 1, true), robe); sleeve.position.y = -0.23; sh.add(sleeve);
    const elbow = new THREE.Group(); elbow.position.y = -0.44; sh.add(elbow);
    const fore = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.022, 0.38, 8), skin); fore.position.y = -0.19; elbow.add(fore);
    const knot = new THREE.Mesh(new THREE.SphereGeometry(0.024, 8, 6), skin); knot.position.y = -0.38; elbow.add(knot);
    const joint = new THREE.Group(); joint.position.y = -0.38; elbow.add(joint);
    const fore2 = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.018, 0.34, 8), skin); fore2.position.y = -0.17; joint.add(fore2);
    const wrist = new THREE.Group(); wrist.position.y = -0.35; joint.add(wrist);
    const palm = new THREE.Mesh(new THREE.BoxGeometry(0.055, 0.1, 0.016), skin); palm.position.y = -0.045; wrist.add(palm);
    const fparts = [], nparts = [];
    for (let f = 0; f < 5; f++) { const x = (f - 2) * 0.013, L1 = f === 0 ? 0.08 : 0.13 + (f === 2 ? 0.03 : 0), L2 = f === 0 ? 0.06 : 0.11, z0 = 0.003 * (f - 2), spread = f === 0 ? s * 0.6 : (f - 2) * 0.05;
      fparts.push(bake(new THREE.CylinderGeometry(0.0045, 0.0065, L1, 5), [x, -0.095 - L1 / 2, z0], [0.15, 0, spread]));
      const kx = x + Math.sin(-spread) * L1 * 0.3, ky = -0.095 - L1, kz = z0 + L1 * 0.15;  
      fparts.push(bake(new THREE.CylinderGeometry(0.003, 0.0045, L2, 5), [kx, ky - Math.cos(0.7) * L2 / 2, kz + Math.sin(0.7) * L2 / 2], [0.7, 0, spread]));
      nparts.push(bake(new THREE.ConeGeometry(0.004, 0.035, 5), [kx, ky - Math.cos(0.9) * (L2 + 0.012), kz + Math.sin(0.9) * (L2 + 0.012)], [Math.PI + 0.9, 0, 0])); }
    const hand = new THREE.Group(); hand.add(new THREE.Mesh(mergeGeometries(fparts), skin), new THREE.Mesh(mergeGeometries(nparts), dark)); fparts.concat(nparts).forEach(p => p.dispose()); wrist.add(hand);
    rig.arms.push({ s, sh, elbow, joint, wrist, hand });
  }

   
  const n = 90, mp = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = Math.random() * 1.3; mp[i * 3] = Math.cos(a) * r; mp[i * 3 + 1] = -0.35 + Math.random() * (shadow ? 2.4 : 0.6); mp[i * 3 + 2] = Math.sin(a) * r; }
  const mg = new THREE.BufferGeometry(); mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
  const mist = new THREE.Points(mg, new THREE.PointsMaterial({ map: T.puff || null, color: shadow ? 0x2a0508 : 0xaeb8c6, size: shadow ? 0.38 : 0.6, transparent: true, opacity: 0.18, depthWrite: false })); g.add(mist);
  mats.push(mist.material);

  g.userData = { mats, strands, mist, rig, shadow, eyeBase, faceMat, faceGlow: faceMat.emissiveIntensity, glitch: 0, vanish: 0, nextTwitch: 1 + Math.random() * 2, twitch: 0, twitchAxis: 0, look: 0, open: 0, stretch: 1, lastStep: -1 };
  g.traverse(o => { o.raycast = () => {}; o.castShadow = false; });
  return g;
}

const _v = new THREE.Vector3(), _w = new THREE.Vector3();
 
export function animateOnryo(g, t, dt, { viewer = null, attacking = false, stunned = false, reduceMotion = false } = {}) {
  const u = g.userData, R = u.rig; if (!R || !g.visible) return;
   
  const fps = attacking ? 14 : 9, st = reduceMotion ? t : Math.floor(t * fps) / fps, stepped = reduceMotion || st !== u.lastStep; u.lastStep = st;
  const rate = reduceMotion ? dt : (stepped ? 1 / fps : 0);
   
  let near = 0, want = u.look;
  if (viewer) { g.getWorldPosition(_w); near = THREE.MathUtils.clamp(1 - (Math.hypot(viewer.x - _w.x, viewer.z - _w.z) - 3) / 9, 0, 1);
    g.updateMatrixWorld(); _v.set(viewer.x, 0, viewer.z); R.body.worldToLocal(_v); want = THREE.MathUtils.clamp(Math.atan2(_v.x, _v.z), -2.75, 2.75); }
   
  if (stepped) u.look = (attacking || near > 0.55) && !reduceMotion ? want : u.look + (want - u.look) * Math.min(1, rate * 2.2);
  R.neck.rotation.y = u.look;
   
  u.nextTwitch -= dt; if (u.nextTwitch <= 0 && !reduceMotion) { u.twitch = 0.18 + Math.random() * 0.25; u.twitchAxis = Math.random(); u.nextTwitch = 0.5 + Math.random() * (attacking ? 0.7 : 2.8 - near * 1.6); }
  if (u.twitch > 0) u.twitch -= dt; const tw = u.twitch > 0;
   
  const stretchTo = 1 + (attacking ? 1.1 : 0) + near * 0.35, openTo = attacking ? 1 : 0.06 + near * 0.22 + Math.max(0, Math.sin(st * 0.5)) * 0.08;
  if (stepped) { u.stretch += (stretchTo - u.stretch) * Math.min(1, rate * 6); u.open += (openTo - u.open) * Math.min(1, rate * (attacking ? 10 : 3)); }
  R.neckMesh.scale.y = u.stretch; const nl = NECK_LEN * u.stretch;
  R.head.position.set(-Math.sin(NECK_TILT) * nl, Math.cos(NECK_TILT) * nl + 0.1, 0.02);
  R.strands.position.copy(R.head.position);
  R.head.rotation.z = 0.3 + (tw && u.twitchAxis < 0.45 ? 1.05 : 0) + Math.sin(st * 0.7) * 0.05;    
  R.head.rotation.x = 0.2 + (attacking ? -0.4 : -near * 0.15) + (tw && u.twitchAxis >= 0.45 && u.twitchAxis < 0.7 ? -0.5 : 0);  
  R.jaw.rotation.x = u.open * 0.55; R.jaw.position.y = R.jawPivot.y - u.open * 0.07;  
  R.mouth.scale.set(0.07 + u.open * 0.01, 0.03 + u.open * 0.06, 0.03); R.mouth.position.y = R.mouthY - u.open * 0.06;
   
  R.spine.rotation.x = 0.08 + (attacking ? 0.32 : near * 0.12) + (tw && u.twitchAxis >= 0.7 && u.twitchAxis < 0.85 ? 0.25 : 0);
   
  for (const a of R.arms) {
    const reach = attacking ? 1.35 : near * 0.35;
    a.sh.rotation.x = -reach + Math.sin(st * 0.8 + a.s) * 0.06;
    a.sh.rotation.z = a.s * (0.05 + (attacking ? 0.25 : 0));
    a.elbow.rotation.x = attacking ? -0.15 : 0.1 + Math.sin(st * 1.1 + a.s * 2) * 0.05;
    a.joint.rotation.x = attacking ? 0.75 : -0.32 + Math.sin(st * 0.9 + a.s) * 0.06;    
    a.hand.rotation.x = 0.25 + Math.sin(st * 7 + a.s * 3) * (attacking ? 0.4 : 0.15) + (tw && u.twitchAxis >= 0.85 ? 0.8 : 0);
    a.hand.rotation.y = attacking ? Math.sin(st * 11 + a.s) * 0.4 : 0;
  }
  for (const s of [-1, 1]) R['foot' + s].rotation.x = Math.sin(st * 0.9 + s) * 0.12;
  R.body.position.y = -0.1 + Math.sin(st * 0.9) * 0.05;
   
  R.clumps.forEach((c, i) => { c.rotation.x = Math.sin(t * 0.6 + i) * 0.05 + (attacking ? -0.14 : 0); c.rotation.z = Math.sin(t * 0.45 + i * 1.7) * 0.06; });
   
  const glow = 1 + near * 0.35 + (attacking ? 0.6 : 0) + (u.glitch > 0 ? 1.2 : 0);
  R.eyes[0].material.color.copy(u.eyeBase).multiplyScalar(glow);
  u.faceMat.emissiveIntensity = u.faceGlow * (1 + near * 1.8 + (attacking ? 1.5 : 0));
  for (let i = 1; i < R.eyes.length; i += 2) R.eyes[i].scale.setScalar(attacking ? 0.5 : 1);
   
  if (!reduceMotion && !stunned && Math.random() < dt * (attacking ? 3 : 0.4 + near * 0.8)) { u.glitch = 0.08; if (Math.random() < 0.35) u.vanish = 0.06; }
  if (u.glitch > 0) { u.glitch -= dt; R.body.position.x = (Math.random() - 0.5) * 0.16; R.body.position.z = (Math.random() - 0.5) * 0.16; } else { R.body.position.x = 0; R.body.position.z = 0; }
  if (u.vanish > 0) u.vanish -= dt; R.body.visible = !(u.vanish > 0);
  R.body.rotation.z = stunned ? Math.sin(t * 30) * 0.03 : 0;
  u.mist.rotation.y = t * (u.shadow ? 0.5 : 0.25);
  if (u.shadow) { const p = u.mist.geometry.attributes.position; for (let i = 0; i < p.count; i++) { let y = p.getY(i) + dt * 0.5; if (y > 2.4) y = -0.3; p.setY(i, y); } p.needsUpdate = true; }
}
