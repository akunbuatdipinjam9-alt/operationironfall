


import * as THREE from 'three';
import { characterById, CHARACTERS } from './Arsenal.js';
import { assembleOperator } from './OperatorModel.js';
import { OperatorAnimator } from './OperatorAnimator.js';


export const PREVIEW_ANIMS = Object.freeze([['IDLE', { speed: 0 }], ['WALK', { speed: 1.9 }], ['RUN', { speed: 4.6 }], ['SPRINT', { speed: 7.4, sprint: true }], ['CROUCH', { speed: 0, crouch: true }], ['AIM', { speed: 0, aiming: true, pitch: 0.05 }], ['RELOAD', { speed: 0, reloading: true }], ['JUMP', { speed: 0, grounded: false }], ['DEATH', { speed: 0, dead: true }]]);


export function buildOperatorFigure(characterId) {
  const fig = assembleOperator(characterById(characterId).look), g = new THREE.Group();
  fig.root.rotation.y = Math.PI; g.add(fig.root);
  const animator = new OperatorAnimator(fig.joints, { seed: 1 });
  g.userData.animator = animator; g.userData.dispose = () => { animator.dispose(); fig.dispose(); };
  return g;
}

export class OperatorPreview {
  constructor(host) {
    this.host = host; this.anim = 'IDLE'; this.animParams = PREVIEW_ANIMS[0][1]; this.yaw = 0.35; this.dragging = false; this.running = false; this.figure = null; this.current = null; this.thumbs = new Map(); this.time = 0;
    try {
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch { this.renderer = null; return; }
    const r = this.renderer; r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1)); r.outputColorSpace = THREE.SRGBColorSpace; r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.shadowMap.enabled = true;
    r.domElement.className = 'ar-op3d-canvas'; host.prepend(r.domElement);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(30, 1, 0.05, 30); this.camera.position.set(0, 1.3, 4.4); this.camera.lookAt(0, 1.0, 0);
    this.scene.add(new THREE.HemisphereLight(0xc9d6e6, 0x2a2018, 1.4));
    const key = new THREE.DirectionalLight(0xfff1dc, 2.6); key.position.set(2.2, 3.5, 3); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); Object.assign(key.shadow.camera, { left: -1.5, right: 1.5, top: 2.5, bottom: -0.5 }); this.scene.add(key);
    const rim = new THREE.DirectionalLight(0xff8a35, 1.6); rim.position.set(-2.5, 2, -2.5); this.scene.add(rim);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(1.1, 48), new THREE.MeshStandardMaterial({ color: 0x141c26, roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; this.scene.add(floor);
    const ring = new THREE.Mesh(new THREE.RingGeometry(1.06, 1.1, 64), new THREE.MeshBasicMaterial({ color: 0xff8a35, transparent: true, opacity: 0.6 })); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.002; this.scene.add(ring);
    this.pivot = new THREE.Group(); this.scene.add(this.pivot);

    const el = r.domElement; let lastX = 0;
    el.addEventListener('pointerdown', e => { this.dragging = true; lastX = e.clientX; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => { if (!this.dragging) return; this.yaw += (e.clientX - lastX) * 0.012; lastX = e.clientX; });
    el.addEventListener('pointerup', () => { this.dragging = false; }); el.addEventListener('pointercancel', () => { this.dragging = false; });
    el.addEventListener('dblclick', () => { this.yaw = 0.35; });
    this.resizeObs = new ResizeObserver(() => this.resize()); this.resizeObs.observe(host);
    this.loop = this.loop.bind(this);
  }
  get ok() { return !!this.renderer; }

  setAnim(name) {
    const found = PREVIEW_ANIMS.find(a => a[0] === name) || PREVIEW_ANIMS[0];
    if (this.anim === 'DEATH' && found[0] !== 'DEATH') this.figure?.userData.animator.respawn();
    this.anim = found[0]; this.animParams = found[1];
  }
  resize() { if (!this.renderer) return; const w = Math.max(1, this.host.clientWidth), h = Math.max(1, this.host.clientHeight); this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix(); }
  show(characterId) {
    if (!this.renderer || this.current === characterId) return;
    if (this.figure) { this.pivot.remove(this.figure); this.figure.userData.dispose(); }
    this.figure = buildOperatorFigure(characterId); this.pivot.add(this.figure); this.current = characterId; this.pop = 0;
    if (this.anim === 'DEATH') this.setAnim('IDLE');
    const s = characterById(characterId).look.scale || 1; this.camera.position.set(0, 1.25 * s, 4.3 * Math.max(1, s)); this.camera.lookAt(0, 0.98 * s, 0);
  }
  setActive(on) { if (!this.renderer) return; if (on && !this.running) { this.running = true; this.last = performance.now(); this.resize(); requestAnimationFrame(this.loop); } else if (!on) this.running = false; }
  loop(now) {
    if (!this.running) return;
    const dt = Math.min(0.05, (now - this.last) / 1000); this.last = now; this.time += dt;
    if (!this.dragging) this.yaw += dt * 0.35;
    this.pivot.rotation.y = this.yaw;
    if (this.figure) { this.pop = Math.min(1, (this.pop || 0) + dt * 4); const k = 0.92 + 0.08 * (1 - (1 - this.pop) ** 3); this.figure.scale.setScalar(k); this.figure.userData.animator.update(dt, { grounded: true, ...this.animParams, facingYaw: 0, moveYaw: 0 }); }
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.loop);
  }

  thumbnail(characterId) {
    if (!this.renderer) return null;
    if (this.thumbs.has(characterId)) return this.thumbs.get(characterId);
    const r = this.renderer, prevSize = new THREE.Vector2(); r.getSize(prevSize); const prevRatio = r.getPixelRatio();
    const fig = buildOperatorFigure(characterId), keep = this.figure; if (keep) keep.visible = false;
    for (let i = 0; i < 12; i++) fig.userData.animator.update(0.05, { speed: 0, grounded: true });
    this.pivot.add(fig); const yaw = this.pivot.rotation.y; this.pivot.rotation.y = 0.45;
    const camPos = this.camera.position.clone(), aspect = this.camera.aspect, s = characterById(characterId).look.scale || 1;
    r.setPixelRatio(1); r.setSize(240, 300, false); this.camera.aspect = 240 / 300; this.camera.position.set(0, 1.2 * s, 4.2 * Math.max(1, s)); this.camera.lookAt(0, 0.95 * s, 0); this.camera.updateProjectionMatrix();
    r.render(this.scene, this.camera);
    const url = r.domElement.toDataURL('image/png');
    this.pivot.remove(fig); fig.userData.dispose(); if (keep) keep.visible = true; this.pivot.rotation.y = yaw;
    r.setPixelRatio(prevRatio); r.setSize(prevSize.x, prevSize.y, false); this.camera.aspect = aspect; this.camera.position.copy(camPos); this.camera.updateProjectionMatrix();
    const cs = this.current ? characterById(this.current).look.scale || 1 : 1; this.camera.lookAt(0, 0.98 * cs, 0);
    this.thumbs.set(characterId, url); return url;
  }
  allThumbnails() { for (const c of CHARACTERS) this.thumbnail(c.id); }
}
