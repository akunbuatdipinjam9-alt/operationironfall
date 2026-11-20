 
 
 
 
 
import * as THREE from 'three';
import { makeChildFigure } from './WorldPortals.js';

 
export const FOREST_SECRET_SPOTS = Object.freeze([{ x: -44, z: -69 }, { x: -46, z: -67 }, { x: -28, z: 47 }, { x: 50, z: -69 }, { x: -62, z: -16 }]);
export const FOREST_SECRET_RADIUS = 3.4;
export const FOREST_SECRET_LINE = 'A FOREST PATH. A CHILD WHO NEVER CAME HOME.';

const clearOf = (solids, x, z, r) => !(solids || []).some(s => { const b = s.box; return b && x > b.min.x - r && x < b.max.x + r && z > b.min.z - r && z < b.max.z + r && b.max.y > 0.3; });
export function pickSecretSpot(solids) { return FOREST_SECRET_SPOTS.find(p => clearOf(solids, p.x, p.z, 1.6)) || FOREST_SECRET_SPOTS[0]; }

export class ForestSecret {
  constructor(scene, { heightAt = () => 0, solids = [], onFound = () => {} } = {}) {
    this.scene = scene; this.onFound = onFound; this.found = false; this.t = 0;
    const spot = pickSecretSpot(solids), y = heightAt(spot.x, spot.z) || 0, g = new THREE.Group(); g.name = 'ForestSecret';
    g.position.set(spot.x, y, spot.z); g.rotation.y = 0.7; this.spot = spot; this.group = g; this.mats = []; this.geos = [];
    const mat = (o) => { const m = new THREE.MeshStandardMaterial(o); this.mats.push(m); return m; }, geo = (x) => (this.geos.push(x), x);
    const add = (gm, m, x, yy, z, rx = 0, ry = 0, rz = 0, s = 1) => { const mesh = new THREE.Mesh(gm, m); mesh.position.set(x, yy, z); mesh.rotation.set(rx, ry, rz); mesh.scale.setScalar(s); g.add(mesh); return mesh; };
     
    const child = makeChildFigure(); child.position.y = -0.04; g.add(child); this.child = child; this.mats.push(...child.userData.mats);
    const leafMats = [0x5a4320, 0x6e5426, 0x3f4a22, 0x7a5a2a].map(c => mat({ color: c, roughness: 1, side: THREE.DoubleSide })), leaf = geo(new THREE.CircleGeometry(0.09, 6));
    let s = 7; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 70; i++) { const a = r() * 6.28, d = r() * 1.3, lx = Math.cos(a) * d * 1.3, lz = Math.sin(a) * d * 0.8; add(leaf, leafMats[i % 4], lx, 0.03 + r() * (Math.abs(lx) < 0.5 && Math.abs(lz) < 0.25 ? 0.24 : 0.02), lz, -Math.PI / 2 + (r() - 0.5) * 0.6, 0, r() * 6.28, 0.7 + r() * 0.8); }
     
    const stone = mat({ color: 0x7c7a72, roughness: 0.95 }), rock = geo(new THREE.DodecahedronGeometry(0.13, 0));
    for (let i = 0; i < 11; i++) { const a = (i / 11) * Math.PI * 2; add(rock, stone, Math.cos(a) * 1.25, 0.05, Math.sin(a) * 0.85, r(), r() * 3, r(), 0.7 + r() * 0.5); }
    const stem = mat({ color: 0x4a5a2a, roughness: 0.9 }), petal = mat({ color: 0x9a6f7c, roughness: 0.9 }), stemG = geo(new THREE.CylinderGeometry(0.008, 0.008, 0.32, 4)), headG = geo(new THREE.SphereGeometry(0.035, 6, 5));
    for (let i = 0; i < 5; i++) { const ry = 0.5 + (i - 2) * 0.2, fx = 0.9, fz = -0.2 + (i - 2) * 0.03, dx = Math.cos(ry), dz = -Math.sin(ry);
      add(stemG, stem, fx, 0.03, fz, 0, ry, Math.PI / 2); const h = add(headG, petal, fx + dx * 0.17, 0.045, fz + dz * 0.17, 0, 0, 0, 0.8 + r() * 0.4); h.scale.y = 0.55; }  
     
    const n = 9, pos = new Float32Array(n * 3); this.flies = []; for (let i = 0; i < n; i++) this.flies.push({ a: r() * 6.28, r: 0.8 + r() * 2.2, h: 0.4 + r() * 1.4, sp: 0.3 + r() * 0.5, ph: r() * 6.28 });
    const fg = geo(new THREE.BufferGeometry()); fg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.flyMat = new THREE.PointsMaterial({ color: 0xd8ff7a, size: 0.09, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }); this.mats.push(this.flyMat);
    this.fireflies = new THREE.Points(fg, this.flyMat); this.fireflies.frustumCulled = false; g.add(this.fireflies);
    g.traverse(o => { o.raycast = () => {}; if (o.isMesh) { o.castShadow = false; o.receiveShadow = true; } });
    scene.add(g);
  }
  update(dt, playerPos) {
    this.t += dt; const t = this.t, p = this.fireflies.geometry.attributes.position;
    this.flies.forEach((f, i) => { const a = f.a + t * f.sp; p.setXYZ(i, Math.cos(a) * f.r, f.h + Math.sin(t * 1.3 + f.ph) * 0.25, Math.sin(a * 1.3) * f.r * 0.7); }); p.needsUpdate = true;
    this.flyMat.opacity = 0.55 + 0.35 * Math.sin(t * 2.1);
    if (!this.found && playerPos && Math.hypot(playerPos.x - this.spot.x, playerPos.z - this.spot.z) < FOREST_SECRET_RADIUS) { this.found = true; this.onFound(FOREST_SECRET_LINE); }
  }
  dispose() { this.group.removeFromParent(); this.geos.forEach(x => x.dispose()); this.child.traverse(o => o.geometry?.dispose?.()); this.mats.forEach(m => m.dispose()); }
}
