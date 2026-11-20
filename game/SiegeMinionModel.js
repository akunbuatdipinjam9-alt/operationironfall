 
 
 
 
 
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const MINION_HIP = { x: 0.12, y: 0.42 };
const DARK = 0x2a2e35, METAL = 0x434a54, TRIM = 0xdfe4ea, _c = new THREE.Color(), _q = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);

function finish(geo, color) {
  const g = geo.index ? geo.toNonIndexed() : geo; if (g !== geo) geo.dispose();
  for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal') g.deleteAttribute(k);
  _c.set(color); const n = g.attributes.position.count, col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { col[i * 3] = _c.r; col[i * 3 + 1] = _c.g; col[i * 3 + 2] = _c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3)); return g;
}
const rb = (w, h, d, r, color, [x, y, z], [rx = 0, ry = 0, rz = 0] = []) => { const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2) * 0.999); g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z); return finish(g, color); };
const cyl = (r0, r1, h, seg, color, [x, y, z], [rx = 0, ry = 0, rz = 0] = []) => { const g = new THREE.CylinderGeometry(r0, r1, h, seg); g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z); return finish(g, color); };
const limb = (a, b, r, color) => { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), g = new THREE.CylinderGeometry(r, r * 0.9, d.length(), 8);
  g.applyQuaternion(_q.setFromUnitVectors(UP, d.normalize())); const m = A.add(B).multiplyScalar(0.5); g.translate(m.x, m.y, m.z); return finish(g, color); };
const merge = parts => { const g = mergeGeometries(parts); parts.forEach(p => p.dispose()); g.computeBoundingSphere(); return g; };

export function buildMinionGeometry(armor) {
  const A = armor, body = [], glow = [];
   
  body.push(rb(0.36, 0.13, 0.24, 0.04, DARK, [0, 0.45, 0]), rb(0.38, 0.12, 0.28, 0.04, DARK, [0, 0.55, 0]));
  body.push(rb(0.48, 0.4, 0.34, 0.08, A, [0, 0.74, 0]), rb(0.3, 0.15, 0.04, 0.015, TRIM, [0, 0.8, 0.17]));
  body.push(rb(0.34, 0.32, 0.16, 0.04, METAL, [0, 0.76, -0.22]), cyl(0.012, 0.012, 0.32, 6, DARK, [0.11, 1.02, -0.24]));
   
  for (const s of [-1, 1]) body.push(rb(0.2, 0.13, 0.27, 0.05, A, [s * 0.31, 0.92, 0], [0, 0, -s * 0.25]), rb(0.2, 0.03, 0.25, 0.012, TRIM, [s * 0.33, 0.995, 0], [0, 0, -s * 0.25]));
  body.push(limb([0.29, 0.86, 0.02], [0.26, 0.66, 0.16], 0.05, DARK), limb([0.26, 0.66, 0.16], [0.12, 0.68, 0.32], 0.045, METAL), rb(0.08, 0.08, 0.08, 0.025, DARK, [0.11, 0.68, 0.34]));
  body.push(limb([-0.29, 0.86, 0.02], [-0.24, 0.68, 0.2], 0.05, DARK), limb([-0.24, 0.68, 0.2], [0.02, 0.7, 0.48], 0.045, METAL), rb(0.08, 0.08, 0.08, 0.025, DARK, [0.03, 0.71, 0.5]));
   
  body.push(rb(0.09, 0.12, 0.46, 0.02, METAL, [0.06, 0.73, 0.4]), cyl(0.026, 0.026, 0.24, 8, DARK, [0.06, 0.75, 0.74], [Math.PI / 2, 0, 0]));
  body.push(rb(0.06, 0.13, 0.07, 0.015, A, [0.06, 0.61, 0.37]), rb(0.04, 0.045, 0.11, 0.01, DARK, [0.06, 0.81, 0.34]));
   
  body.push(cyl(0.07, 0.08, 0.09, 10, DARK, [0, 0.97, 0]), rb(0.37, 0.31, 0.35, 0.1, A, [0, 1.11, 0]), rb(0.06, 0.05, 0.3, 0.02, TRIM, [0, 1.27, -0.01]));
  body.push(rb(0.28, 0.1, 0.06, 0.025, DARK, [0, 1.03, 0.16]));
  for (const s of [-1, 1]) body.push(cyl(0.055, 0.055, 0.045, 12, METAL, [s * 0.19, 1.1, 0], [0, 0, Math.PI / 2]));
   
  glow.push(rb(0.3, 0.075, 0.04, 0.015, 0xffffff, [0, 1.13, 0.17]), cyl(0.04, 0.04, 0.02, 14, 0xffffff, [0, 0.68, 0.175], [Math.PI / 2, 0, 0]));
  glow.push(finish(new THREE.SphereGeometry(0.028, 8, 6).translate(0.11, 1.19, -0.24), 0xffffff), rb(0.022, 0.022, 0.07, 0.008, 0xffffff, [0.112, 0.75, 0.46]));
   
  const leg = [rb(0.13, 0.2, 0.15, 0.04, DARK, [0, -0.1, 0]), rb(0.15, 0.09, 0.06, 0.02, A, [0, -0.2, 0.075]), rb(0.12, 0.16, 0.13, 0.03, METAL, [0, -0.29, 0]),
    rb(0.17, 0.08, 0.25, 0.03, DARK, [0, -0.38, 0.04]), rb(0.15, 0.03, 0.05, 0.01, TRIM, [0, -0.35, 0.16])];
  return { body: merge(body), glow: merge(glow), leg: merge(leg) };
}
