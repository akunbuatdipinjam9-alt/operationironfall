


import * as THREE from 'three';

export const EGG_TIMES = Object.freeze([240, 480, 540]);
export const EGG_DURATION = 15;
export const EGG_REVEAL_DISTANCE = 4.5;
export const EGG_NAME = 'ARYA';


export function eggWindow(t) {
  for (let i = 0; i < EGG_TIMES.length; i++) if (t >= EGG_TIMES[i] && t < EGG_TIMES[i] + EGG_DURATION) return i;
  return -1;
}

function buildRabbit() {
  const fur = new THREE.MeshStandardMaterial({ color: 0xd9cbb8, roughness: 0.92 });
  const belly = new THREE.MeshStandardMaterial({ color: 0xf2ebe1, roughness: 0.95 });
  const pink = new THREE.MeshStandardMaterial({ color: 0xe89aa4, roughness: 0.6 });
  const eye = new THREE.MeshStandardMaterial({ color: 0x14100e, roughness: 0.2, metalness: 0.1 });
  const snot = new THREE.MeshPhysicalMaterial({ color: 0xb9e07a, roughness: 0.08, transmission: 0.35, transparent: true, opacity: 0.82, clearcoat: 1 });
  const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
  const torso = new THREE.Mesh(new THREE.SphereGeometry(0.22, 18, 14), fur); torso.scale.set(1, 0.9, 1.25); torso.position.set(0, 0.22, 0.04); body.add(torso);
  const tummy = new THREE.Mesh(new THREE.SphereGeometry(0.16, 14, 10), belly); tummy.scale.set(0.9, 0.85, 0.7); tummy.position.set(0, 0.19, -0.14); body.add(tummy);
  const head = new THREE.Group(); head.position.set(0, 0.42, -0.2); body.add(head);
  const skull = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 14), fur); skull.scale.set(1, 0.95, 1.05); head.add(skull);
  const cheekL = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), belly); cheekL.position.set(-0.06, -0.05, -0.1); head.add(cheekL);
  const cheekR = cheekL.clone(); cheekR.position.x = 0.06; head.add(cheekR);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 8), pink); nose.position.set(0, -0.01, -0.15); head.add(nose);
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 8), eye); e.position.set(sx * 0.075, 0.04, -0.115); head.add(e);
    const ear = new THREE.Group(); ear.position.set(sx * 0.06, 0.12, 0.02); ear.rotation.set(-0.15, 0, sx * 0.18); head.add(ear);
    const outer = new THREE.Mesh(new THREE.CapsuleGeometry(0.04, 0.24, 4, 10), fur); outer.scale.set(1, 1, 0.45); outer.position.y = 0.15; ear.add(outer);
    const inner = new THREE.Mesh(new THREE.CapsuleGeometry(0.025, 0.2, 4, 8), pink); inner.scale.set(1, 1, 0.3); inner.position.set(0, 0.15, -0.012); ear.add(inner);
    ear.userData.side = sx; (g.userData.ears ||= []).push(ear);
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), fur); foot.scale.set(0.8, 0.5, 1.6); foot.position.set(sx * 0.11, 0.03, -0.02); body.add(foot);
  }
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.07, 10, 8), belly); tail.position.set(0, 0.25, 0.3); body.add(tail);

  const drip = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.05, 4, 8), snot); drip.position.set(0.012, -0.055, -0.15); head.add(drip);
  const bubble = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), snot); bubble.position.set(-0.01, -0.02, -0.19); head.add(bubble);
  g.userData.parts = { body, head, bubble, drip };
  g.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  return g;
}

export class AryaRabbit {
  constructor(scene, { layer = null, onFound = () => {} } = {}) {
    this.scene = scene; this.layer = layer; this.onFound = onFound;
    this.root = null; this.tag = null; this.t = 0; this.found = false; this.visibleFor = 0; this.poof = null;
  }
  get active() { return !!this.root; }
  spawn(pos, yaw = 0) {
    this.despawn(true);
    this.root = buildRabbit(); this.root.position.copy(pos); this.root.rotation.y = yaw; this.root.scale.setScalar(0.01);
    this.scene.add(this.root); this.t = 0; this.found = false; this.visibleFor = 0;
    if (this.layer) {
      this.tag = document.createElement('div'); this.tag.className = 'egg-tag';
      const b = document.createElement('b'); b.textContent = EGG_NAME; const s = document.createElement('small'); s.textContent = 'THE SNIFFLY RABBIT';
      this.tag.append(b, s); this.tag.style.display = 'none'; this.layer.appendChild(this.tag);
    }
  }
  despawn(silent = false) {
    if (!this.root) return;
    if (!silent) this.burst(this.root.position.clone());
    this.scene.remove(this.root);
    this.root.traverse(o => { o.geometry?.dispose?.(); if (o.material && !o.material.userData.keep) o.material.dispose?.(); });
    this.root = null; this.tag?.remove(); this.tag = null;
  }
  burst(at) {
    const geo = new THREE.SphereGeometry(0.06, 6, 5), mat = new THREE.MeshBasicMaterial({ color: 0xf2ebe1, transparent: true, opacity: 0.9 });
    const g = new THREE.Group(); g.position.copy(at).add(new THREE.Vector3(0, 0.3, 0));
    for (let i = 0; i < 14; i++) { const m = new THREE.Mesh(geo, mat); m.userData.v = new THREE.Vector3(Math.random() - 0.5, Math.random() * 0.9, Math.random() - 0.5).multiplyScalar(2.6); g.add(m); }
    this.scene.add(g); this.poof = { g, geo, mat, t: 0 };
  }

  update(dt, playerPos, camera) {
    if (this.poof) { const p = this.poof; p.t += dt; for (const m of p.g.children) { m.position.addScaledVector(m.userData.v, dt); m.userData.v.y -= 3 * dt; } p.mat.opacity = Math.max(0, 0.9 - p.t * 1.6); if (p.t > 0.7) { this.scene.remove(p.g); p.geo.dispose(); p.mat.dispose(); this.poof = null; } }
    if (!this.root) return false;
    this.t += dt;
    const { body, head, bubble, drip } = this.root.userData.parts;
    this.root.scale.setScalar(Math.min(1, this.t * 4));

    const hop = Math.max(0, Math.sin(this.t * 2.2)) ** 6; body.position.y = hop * 0.12;
    head.rotation.x = Math.sin(this.t * 13) * 0.04; head.position.y = 0.42 + Math.sin(this.t * 13) * 0.006;
    for (const ear of this.root.userData.ears) ear.rotation.z = ear.userData.side * (0.18 + (Math.sin(this.t * 1.7 + ear.userData.side) > 0.92 ? 0.35 : 0));
    const cycle = (this.t % 2.6) / 2.6; const s = cycle < 0.88 ? 0.25 + cycle * 1.2 : 0.01; bubble.scale.setScalar(s);
    drip.scale.y = 1 + Math.sin(this.t * 3) * 0.25;
    const d = playerPos ? this.root.position.distanceTo(playerPos) : Infinity, near = d < EGG_REVEAL_DISTANCE;
    if (near) { const want = Math.atan2(-(playerPos.x - this.root.position.x), -(playerPos.z - this.root.position.z)); let dy = want - this.root.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); this.root.rotation.y += dy * Math.min(1, dt * 4); }
    if (near && !this.found) { this.found = true; this.onFound(); }
    if (this.tag && camera) {
      const v = this.root.position.clone().add(new THREE.Vector3(0, 0.95, 0)).project(camera);
      const show = near && v.z < 1;
      this.tag.style.display = show ? 'block' : 'none';
      if (show) { this.tag.style.left = ((v.x + 1) / 2 * window.innerWidth) + 'px'; this.tag.style.top = ((1 - v.y) / 2 * window.innerHeight) + 'px'; }
    }
    return near;
  }
  dispose() { this.despawn(true); if (this.poof) { this.scene.remove(this.poof.g); this.poof.geo.dispose(); this.poof.mat.dispose(); this.poof = null; } }
}
