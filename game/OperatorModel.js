






import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { headLevels } from './OperatorAnatomy.js';
import { buildSoraParts } from './SoraModel.js';

const TEAM = { BLUE: { trim: 0x38bdf8, glow: 0x00e5ff }, RED: { trim: 0xf87171, glow: 0xff3030 } };
const tintTo = (hex, toward, k) => new THREE.Color(hex).lerp(new THREE.Color(toward), k).getHex();


class Batch {
  constructor(mats) { this.mats = mats; this.items = new Map(); this.tmp = new THREE.Object3D(); }
  add(geo, key, x, y, z, { s = [1, 1, 1], r = [0, 0, 0] } = {}) {
    this.tmp.position.set(x, y, z); this.tmp.rotation.set(r[0], r[1], r[2]); this.tmp.scale.set(s[0], s[1], s[2]); this.tmp.updateMatrix();
    const g = (geo.index ? geo.toNonIndexed() : geo.clone()); g.applyMatrix4(this.tmp.matrix);
    for (const name of Object.keys(g.attributes)) if (name !== 'position' && name !== 'normal' && name !== 'uv') g.deleteAttribute(name);
    if (!this.items.has(key)) this.items.set(key, []); this.items.get(key).push(g); geo.dispose();
    return this;
  }
  box(key, x, y, z, w, h, d, o) { return this.add(new THREE.BoxGeometry(w, h, d), key, x, y, z, o); }
  rbox(key, x, y, z, w, h, d, rad = 0.03, o) { return this.add(new RoundedBoxGeometry(w, h, d, 3, Math.min(rad, w / 2.01, h / 2.01, d / 2.01)), key, x, y, z, o); }
  sph(key, x, y, z, r, o) { return this.add(new THREE.SphereGeometry(r, 18, 12), key, x, y, z, o); }
  cyl(key, x, y, z, rt, rb, h, o, seg = 16) { return this.add(new THREE.CylinderGeometry(rt, rb, h, seg), key, x, y, z, o); }
  dome(key, x, y, z, r, theta = 0.56, o) { return this.add(new THREE.SphereGeometry(r, 22, 12, 0, Math.PI * 2, 0, Math.PI * theta), key, x, y, z, o); }

  limb(key, a, b, r) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length();
    const g = new THREE.CapsuleGeometry(r, Math.max(0.001, len - r * 0.6), 5, 12), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    const e = new THREE.Euler().setFromQuaternion(q), m = A.clone().add(B).multiplyScalar(0.5);
    return this.add(g, key, m.x, m.y, m.z, { r: [e.x, e.y, e.z] });
  }
  build(shadow = true) {
    const group = new THREE.Group();
    for (const [key, list] of this.items) {
      const geo = list.length > 1 ? mergeGeometries(list, false) : list[0]; if (list.length > 1) list.forEach(g => g.dispose());
      const mesh = new THREE.Mesh(geo, this.mats[key]); mesh.castShadow = shadow; mesh.receiveShadow = true; mesh.userData.part = key; group.add(mesh);
    }
    return group;
  }
}






export function buildOperatorParts(look, { team = null } = {}) {
  if (look.style === 'sora' || look.style === 'yuna') return buildSoraParts(look, { T: TEAM[team] || null, tintTo });
  const T = TEAM[team] || null, kitted = look.vest != null, S = look.singlet;
  const windah = look.faceStyle === 'windah';
  const tt = (hex, k) => (T ? tintTo(hex, T.trim, k) : hex);
  const std = (color, r = 0.8, m = 0.04, e = 0, ei = 0) => new THREE.MeshStandardMaterial({ color, roughness: r, metalness: m, emissive: e, emissiveIntensity: ei });
  const mats = {
    top: std(tt(look.top, S ? 0.06 : 0.2), 0.86), pants: std(tt(look.pants, 0.12), 0.9), skin: std(look.skin, 0.62),
    vest: std(tt(look.vest ?? look.top, 0.14), 0.7, 0.12), gear: std(0x1c2026, 0.6, 0.25), boot: std(0x17191c, 0.75, 0.05),
    helm: std(tt(look.helmet ?? look.top, 0.14), 0.55, 0.22), hair: std(look.hairColor ?? 0x2a2019, 0.9), eye: std(0xf3f1ea, 0.4), pupil: std(0x15110d, 0.3),
    gun: std(0x23272d, 0.38, 0.8), gunPoly: std(0x33383f, 0.7, 0.1),
    trim: std(T ? T.trim : look.accent, 0.45, 0.3, T ? T.trim : look.accent, T ? 0.55 : 0.3),
    glow: std(0x0b0f14, 0.2, 0.3, T ? T.glow : look.accent, T ? 2.6 : 1.2), glass: std(0x0b0f14, 0.15, 0.7), red: std(0xdc2626, 0.6, 0, 0xdc2626, 0.2),
  };


  const U = new Batch(mats);
  U.rbox('pants', 0, 0.03, 0, 0.44, 0.2, 0.27, 0.06).box('gear', 0, 0.14, 0, 0.46, 0.055, 0.285).box('trim', 0, 0.14, -0.146, 0.06, 0.045, 0.012);
  U.cyl('top', 0, 0.44, 0, 0.235, 0.19, 0.56, { s: [1, 1, 0.64] });
  for (const s of [-1, 1]) U.sph(S ? 'skin' : 'top', s * 0.262, 0.66, 0, windah ? 0.087 : 0.105);
  U.cyl('skin', 0, 0.78, 0, 0.058, 0.064, 0.12);
  if (S) { U.sph('skin', 0, 0.705, -0.02, 0.15, { s: [1, 0.38, 0.72] }); for (const s of [-1, 1]) U.rbox('top', s * 0.13, 0.7, 0, 0.07, 0.07, 0.24, 0.02); }
  if (look.belly) U.sph('top', 0, 0.3, -0.1, 0.25, { s: [1, 0.95, 0.82] });
  if (kitted) {
    U.rbox('vest', 0, 0.46, 0, 0.5, 0.45, 0.37, 0.06);
    U.rbox('vest', 0, 0.7, 0.02, 0.3, 0.08, 0.3, 0.03);
    for (const s of [-1, 1]) U.rbox('vest', s * 0.17, 0.69, 0, 0.09, 0.07, 0.34, 0.02);
    for (const x of [-0.13, 0, 0.13]) U.rbox('vest', x, 0.33, -0.2, 0.105, 0.17, 0.07, 0.02).box('gear', x, 0.405, -0.238, 0.07, 0.02, 0.008);
    U.rbox('gear', 0, 0.54, -0.195, 0.24, 0.1, 0.035, 0.012);
    U.box('trim', 0.13, 0.6, -0.19, 0.11, 0.045, 0.008);
    for (const s of [-1, 1]) U.rbox('gear', s * 0.255, 0.38, 0, 0.03, 0.22, 0.3, 0.012);
    U.rbox('gear', 0, 0.47, 0.25, 0.36, 0.42, 0.15, 0.05).rbox('gear', 0, 0.3, 0.33, 0.24, 0.16, 0.06, 0.02);
    U.rbox('gear', -0.2, 0.66, 0.2, 0.07, 0.13, 0.05, 0.012).cyl('gear', -0.2, 0.9, 0.2, 0.006, 0.008, 0.36, undefined, 6);
    U.rbox('gear', 0.25, 0.12, -0.02, 0.05, 0.13, 0.11, 0.012);
    if (look.cross) U.box('red', 0, 0.54, -0.216, 0.05, 0.14, 0.008).box('red', 0, 0.54, -0.216, 0.14, 0.05, 0.008);
  } else if (!S) {
    U.box('gear', 0, 0.52, -0.155, 0.02, 0.36, 0.01);
    for (const s of [-1, 1]) U.rbox('top', s * 0.13, 0.36, -0.15, 0.11, 0.1, 0.03, 0.012);
  }


  const H = new Batch(mats), hooded = !!look.hood, helmeted = look.helmet != null && !look.boonie && !look.cap;
  H.sph('skin', 0, 0, 0, 0.125, { s: windah ? [1.02, 1.18, 1.03] : [0.97, 1.1, 1.03] }).sph('skin', 0, -0.07, -0.02, 0.1, { s: windah ? [0.9, 0.87, 0.97] : [0.94, 0.72, 0.92] });
  for (const s of [-1, 1]) H.sph('skin', s * 0.122, -0.005, 0.01, 0.03, { s: [0.45, 1, 0.7] });
  H.rbox('skin', 0, -0.022, -0.128, 0.03, 0.05, 0.035, 0.012);
  if (look.visor) {
    H.rbox('glass', 0, 0.02, -0.108, 0.235, 0.085, 0.07, 0.03).box('glow', 0, 0.022, -0.146, 0.19, 0.022, 0.006);
    H.rbox('gear', 0, -0.075, -0.09, 0.17, 0.085, 0.1, 0.03);
  } else if (S && !windah) {
    for (const s of [-1, 1]) H.rbox('glass', s * 0.05, 0.022, -0.118, 0.082, 0.05, 0.02, 0.014);
    H.box('glass', 0, 0.03, -0.12, 0.03, 0.012, 0.012); for (const s of [-1, 1]) H.box('glass', s * 0.105, 0.03, -0.06, 0.008, 0.012, 0.12);
    H.rbox('hair', 0, -0.062, -0.118, 0.085, 0.022, 0.02, 0.008);
  } else {
    for (const s of [-1, 1]) { H.sph('eye', s * 0.046, 0.02, -0.108, 0.02, { s: [1.15, 0.8, 0.6] }).sph('pupil', s * 0.046, 0.02, -0.12, 0.0105, { s: [1, 1, 0.5] }); H.box('hair', s * 0.046, 0.05, -0.117, 0.05, 0.011, 0.012, { r: [0, 0, -s * 0.12] }); }
    if (hooded) H.rbox('gear', 0, -0.075, -0.085, 0.19, 0.1, 0.12, 0.04);
    else if (windah) {
      H.rbox('skin', 0, -0.037, -0.144, 0.043, 0.024, 0.026, 0.011);
      H.rbox('pupil', 0, -0.079, -0.119, 0.062, 0.004, 0.009, 0.002);
      for (const s of [-1, 1]) {
        H.rbox('skin', s * 0.047, 0.033, -0.119, 0.045, 0.014, 0.012, 0.006);
        H.box('pupil', s * 0.033, -0.076, -0.117, 0.01, 0.004, 0.008, { r: [0, 0, s * 0.4] });
      }
    } else H.box('pupil', 0, -0.068, -0.118, 0.05, 0.008, 0.008);
  }
  if (helmeted) {
    H.dome('helm', 0, 0.012, 0.004, 0.158, 0.57, { s: [1, 1, 1.09] });
    H.cyl('helm', 0, -0.012, 0.004, 0.161, 0.161, 0.022, { s: [1, 1, 1.09] }, 22);
    for (const s of [-1, 1]) H.rbox('gear', s * 0.142, -0.02, 0.012, 0.05, 0.1, 0.085, 0.022).box('gear', s * 0.118, -0.095, -0.03, 0.01, 0.1, 0.014, { r: [0.35, 0, 0] });
    H.rbox('gear', 0, 0.105, -0.158, 0.06, 0.045, 0.03, 0.01);
    H.box('trim', 0, 0.11, 0.165, 0.11, 0.035, 0.008).box('trim', 0.163, 0.07, 0.0, 0.006, 0.03, 0.09);
    if (!look.visor && !hooded) H.rbox('glass', 0, 0.105, -0.115, 0.2, 0.05, 0.05, 0.02);
  } else if (look.boonie) {
    H.cyl('helm', 0, 0.105, 0, 0.128, 0.138, 0.1, undefined, 20).cyl('helm', 0, 0.062, 0, 0.25, 0.26, 0.014, { s: [1, 1, 0.94] }, 24).cyl('gear', 0, 0.072, 0, 0.141, 0.141, 0.016, undefined, 20);
  } else if (look.cap) {
    H.dome('helm', 0, 0.02, 0, 0.142, 0.52).rbox('helm', 0, 0.045, -0.17, 0.2, 0.014, 0.13, 0.006);
  } else if (windah) {
    H.dome('hair', 0, 0.035, 0.014, 0.138, 0.4, { s: [1, 1.05, 1.02] });
    for (const s of [-1, 1]) H.rbox('hair', s * 0.12, 0.045, 0.025, 0.022, 0.1, 0.12, 0.01);

    for (let i = 0; i < 5; i++) H.sph('hair', -0.075 + i * 0.034, 0.137 + Math.sin(i * 0.7) * 0.014, -0.065, 0.043, { s: [1.18, 0.65, 1.3], r: [0, 0, -0.3] });
    H.rbox('hair', -0.079, 0.103, -0.106, 0.058, 0.045, 0.035, 0.014, { r: [0, 0, -0.45] });
  } else {
    H.dome('hair', 0, 0.018, 0.008, 0.134, S ? 0.42 : 0.5, { s: [1, 1, 1.04] });
  }
  if (hooded) { H.dome('top', 0, -0.01, 0.022, 0.175, 0.64, { s: [1, 1.04, 1.06] }); H.cyl('top', 0, -0.13, 0.01, 0.11, 0.13, 0.1); }



  const KNEE = [0, -0.4, -0.01];
  const leg = side => {
    const Th = new Batch(mats), Sh = new Batch(mats), k = KNEE[1];
    Th.limb('pants', [0, 0.02, 0], [0, -0.38, -0.01], 0.092);
    if (kitted) { Th.rbox('gear', side * 0.085, -0.17, 0, 0.045, 0.2, 0.13, 0.015); Th.box('gear', 0, -0.13, 0, 0.19, 0.022, 0.19); }
    Sh.limb('pants', [0, 0, 0], [0, -0.68 - k, 0.02], 0.074);
    Sh.rbox('boot', 0, -0.71 - k, -0.025, 0.15, 0.15, 0.3, 0.045).box('gear', 0, -0.775 - k, -0.025, 0.155, 0.022, 0.305).rbox('boot', 0, -0.62 - k, 0.015, 0.135, 0.1, 0.17, 0.035);
    if (kitted) Sh.rbox('gear', 0, 0, -0.055, 0.13, 0.13, 0.06, 0.03);
    else if (S) Sh.box('pants', 0, -0.63 - k, 0.01, 0.16, 0.035, 0.165);
    const hip = Th.build(), knee = Sh.build(); knee.position.set(...KNEE); hip.add(knee);
    return { hip, knee };
  };




  const A = new Batch(mats), LA = new Batch(mats), MG = new Batch(mats), sleeve = S ? 'skin' : 'top', hand = S ? 'skin' : 'gear', gx = -0.14;
  const rElbow = [0.035, -0.25, -0.1], rHand = [gx + 0.01, -0.15, -0.27], lSh = [-0.64, 0, 0], MAG = [gx, -0.1, -0.42];
  const lElbow = [0.09, -0.23, -0.27], lHand = [gx - 0.02 - lSh[0], -0.105, -0.62];
  A.limb(sleeve, [0, -0.01, 0], rElbow, 0.07).limb(sleeve, rElbow, rHand, 0.058).sph(hand, rHand[0], rHand[1], rHand[2], 0.058);
  LA.limb(sleeve, [0, -0.01, 0], lElbow, 0.07).limb(sleeve, lElbow, lHand, 0.058).sph(hand, lHand[0], lHand[1], lHand[2], 0.058);
  if (kitted) { A.rbox('gear', rElbow[0], rElbow[1], rElbow[2] + 0.01, 0.13, 0.11, 0.12, 0.03); LA.rbox('gear', lElbow[0], lElbow[1], lElbow[2] + 0.01, 0.13, 0.11, 0.12, 0.03); A.box('trim', 0.072, -0.1, -0.035, 0.008, 0.07, 0.09); }
  else if (!S) { A.cyl('top', rHand[0], rHand[1] + 0.03, rHand[2] + 0.04, 0.064, 0.064, 0.03, { r: [0.9, 0, 0] }); LA.cyl('top', lHand[0], lHand[1] + 0.03, lHand[2] + 0.04, 0.064, 0.064, 0.03, { r: [0.9, 0, 0] }); }

   
  const G = new Batch(mats);
  G.rbox('gunPoly', gx, -0.065, -0.04, 0.045, 0.1, 0.2, 0.015).box('gun', gx, -0.045, -0.15, 0.03, 0.035, 0.08);
  G.rbox('gun', gx, -0.05, -0.36, 0.06, 0.105, 0.36, 0.014).box('gun', gx, 0.008, -0.42, 0.04, 0.014, 0.46);
  G.rbox('gunPoly', gx, -0.045, -0.66, 0.056, 0.075, 0.27, 0.016);
  G.cyl('gun', gx, -0.04, -0.85, 0.013, 0.013, 0.14, { r: [Math.PI / 2, 0, 0] }, 10).cyl('gun', gx, -0.04, -0.915, 0.02, 0.02, 0.06, { r: [Math.PI / 2, 0, 0] }, 10);
  G.rbox('gunPoly', gx, -0.15, -0.275, 0.042, 0.11, 0.055, 0.012, { r: [-0.3, 0, 0] });
  MG.rbox('gunPoly', 0, -0.085, 0, 0.036, 0.18, 0.07, 0.01, { r: [-0.22, 0, 0] });
  G.rbox('gun', gx, 0.045, -0.4, 0.045, 0.05, 0.1, 0.012).box('glow', gx, 0.048, -0.452, 0.03, 0.03, 0.004);
  G.box('gun', gx, 0.03, -0.78, 0.01, 0.035, 0.014).rbox('gunPoly', gx, -0.105, -0.6, 0.03, 0.07, 0.035, 0.01);
  G.box('trim', gx + 0.031, -0.04, -0.36, 0.004, 0.012, 0.22);
  const arms = A.build(), armL = LA.build(), mag = MG.build(), gun = G.build(); armL.position.set(...lSh); mag.position.set(...MAG); arms.add(armL, mag, gun);
  const LL = leg(-1), LR = leg(1);

  const parts = { upper: U.build(), head: H.build(), legL: LL.hip, legR: LR.hip, kneeL: LL.knee, kneeR: LR.knee, arms, armL, mag, gun, materials: mats, flash: mats.top };
  headLevels(parts.head, mats);
  parts.dispose = () => { for (const g of [parts.upper, parts.head, parts.legL, parts.legR, parts.arms]) g.traverse(o => { if (!o.userData.sharedGeometry) o.geometry?.dispose?.(); }); Object.values(mats).forEach(m => m.dispose()); };
  return parts;
}


export const RIG = Object.freeze({ pelvisY: 0.82, hipY: 0.78, hipX: 0.15, headY: 0.92, shoulder: [0.32, 0.56, -0.04] });


export function assembleOperator(look, opts) {
  const p = buildOperatorParts(look, opts), root = new THREE.Group();
  const upper = new THREE.Group(); upper.position.y = RIG.pelvisY; root.add(upper); upper.add(p.upper);
  const head = new THREE.Group(); head.position.y = RIG.headY; upper.add(head); head.add(p.head);
  const arms = new THREE.Group(); arms.position.set(...RIG.shoulder); upper.add(arms); arms.add(p.arms);
  const legL = new THREE.Group(); legL.position.set(-RIG.hipX, RIG.hipY, 0); root.add(legL); legL.add(p.legL);
  const legR = new THREE.Group(); legR.position.set(RIG.hipX, RIG.hipY, 0); root.add(legR); legR.add(p.legR);
  root.scale.setScalar(look.scale || 1);
  return { root, upper, head, arms, legL, legR, parts: p, dispose: p.dispose,

    joints: { root, hips: upper, head, arms, armL: p.armL, mag: p.mag, legL, legR, kneeL: p.kneeL, kneeR: p.kneeR } };
}
