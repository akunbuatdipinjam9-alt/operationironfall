 
 
 
 
 
 
import * as THREE from 'three';

export const SHOWCASE_SIZE = Object.freeze({ w: 132, h: 168 });

export class MvpShowcase {
  constructor({ getRenderer, buildFigure, portrait, isVisible = () => true, now = () => performance.now() }) {
    this.getRenderer = getRenderer; this.buildFigure = buildFigure; this.portrait = portrait; this.isVisible = isVisible; this.now = now;
    this.host = null; this.canvas = null; this.ctx = null; this.scene = null; this.figure = null; this.owned = [];
    this.mode = 'off'; this.fps = 30; this.spin = true; this.last = 0; this.time = 0; this.frames = 0; this.yaw = 0.4;
  }

   
  show(host, player, { low = false, reduced = false, weaponIndex = null } = {}) {
    this.hide();
    if (!host) return 'none';
    this.host = host;
    const renderer = this.getRenderer?.();
    if (!player?.character || !renderer || typeof document === 'undefined') return this.fallback(player);
    try {
      const fig = this.buildFigure(player.character, weaponIndex ?? player.mostEffectiveWeapon ?? player.mostUsedWeapon ?? null);
      if (!fig?.root) return this.fallback(player);
      const scale = Math.min(1.5, renderer.getPixelRatio?.() || 1) * (low ? 0.75 : 1);
      const canvas = document.createElement('canvas'); canvas.className = 'pm-mvp3d-canvas';
      canvas.width = Math.round(SHOWCASE_SIZE.w * scale); canvas.height = Math.round(SHOWCASE_SIZE.h * scale);
      canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', `${player.name || 'MVP'} 3D model`);
      const ctx = canvas.getContext('2d'); if (!ctx) { fig.dispose?.(); return this.fallback(player); }
      this.canvas = canvas; this.ctx = ctx; this.figure = fig; this.buildScene(fig);
      host.replaceChildren(canvas);
      this.fps = reduced ? 0 : low ? 15 : 30; this.spin = !reduced; this.frames = 0; this.time = 0; this.last = 0;
      this.mode = '3d'; return '3d';
    } catch (err) {
      this.disposeScene(); return this.fallback(player);
    }
  }

  fallback(player) {
    if (this.host) this.host.innerHTML = player?.character && this.portrait ? this.portrait(player.character) : '';
    this.mode = this.host && player?.character ? 'portrait' : 'none'; return this.mode;
  }

  buildScene(fig) {
    const scene = new THREE.Scene(), own = o => (this.owned.push(o), o);
    scene.background = new THREE.Color(0x0b1220);
    scene.add(new THREE.HemisphereLight(0xc9d6e6, 0x2a2018, 1.4));
    const key = new THREE.DirectionalLight(0xfff1dc, 2.6); key.position.set(2.2, 3.5, 3); scene.add(key);
    const rim = new THREE.DirectionalLight(0xffc14d, 1.8); rim.position.set(-2.5, 2, -2.5); scene.add(rim);
    const floor = new THREE.Mesh(own(new THREE.CircleGeometry(0.9, 40)), own(new THREE.MeshStandardMaterial({ color: 0x141c26, roughness: 0.9 })));
    floor.rotation.x = -Math.PI / 2; scene.add(floor);
    const ring = new THREE.Mesh(own(new THREE.RingGeometry(0.86, 0.9, 48)), own(new THREE.MeshBasicMaterial({ color: 0xfbbf24, transparent: true, opacity: 0.7 })));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.003; scene.add(ring);
    this.pivot = new THREE.Group(); scene.add(this.pivot); this.pivot.add(fig.root);
    const s = fig.scale || 1;
    this.camera = new THREE.PerspectiveCamera(30, SHOWCASE_SIZE.w / SHOWCASE_SIZE.h, 0.05, 30);
    this.camera.position.set(0, 1.2 * s, 4.6 * Math.max(1, s)); this.camera.lookAt(0, 0.95 * s, 0);
    this.scene = scene;
  }

  visible() {
    return this.mode === '3d' && !!this.host?.isConnected && this.isVisible(this.host) && (typeof document === 'undefined' || document.visibilityState !== 'hidden');
  }

   
  frame(dt) {
    if (!this.visible()) return false;
    const t = this.now();
    if (this.fps === 0 ? this.frames >= 2 : t - this.last < 1000 / this.fps - 1) return false;
    const step = this.last ? Math.min(0.1, (t - this.last) / 1000) : 1 / 30; this.last = t; this.time += step;
    const r = this.getRenderer?.(); if (!r) return false;
    try {
      if (this.spin) this.yaw += step * 0.45; this.pivot.rotation.y = this.yaw;
      this.figure.animator?.update(this.frames === 0 ? 0.6 : step, { speed: 0, grounded: true, facingYaw: 0, moveYaw: 0 });
      const buf = r.domElement, pr = r.getPixelRatio() || 1;
      const w = Math.min(this.canvas.width, buf.width), h = Math.min(this.canvas.height, buf.height);
      const prev = { target: r.getRenderTarget(), scissorTest: r.getScissorTest(), tone: r.toneMapping, exposure: r.toneMappingExposure, cs: r.outputColorSpace, autoClear: r.autoClear,
        viewport: r.getViewport(new THREE.Vector4()), scissor: r.getScissor(new THREE.Vector4()) };
      r.setRenderTarget(null); r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.outputColorSpace = THREE.SRGBColorSpace; r.autoClear = true;
      r.setViewport(0, 0, w / pr, h / pr); r.setScissor(0, 0, w / pr, h / pr); r.setScissorTest(true);
      r.render(this.scene, this.camera);
       
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(buf, 0, buf.height - h, w, h, 0, 0, this.canvas.width, this.canvas.height);
      r.setScissorTest(prev.scissorTest); r.setScissor(prev.scissor); r.setViewport(prev.viewport); r.setRenderTarget(prev.target);
      r.toneMapping = prev.tone; r.toneMappingExposure = prev.exposure; r.outputColorSpace = prev.cs; r.autoClear = prev.autoClear;
      this.frames++; return true;
    } catch (err) {
      const player = { character: this.figure?.characterId }; this.disposeScene(); this.fallback(player); return false;
    }
  }

  disposeScene() {
    if (this.figure) { this.figure.root?.removeFromParent(); this.figure.dispose?.(); }
    for (const o of this.owned) o.dispose?.();
    this.owned = []; this.figure = null; this.scene = null; this.pivot = null; this.camera = null; this.canvas = null; this.ctx = null;
  }

  hide() {
    this.disposeScene(); this.mode = 'off';
    if (this.host) this.host.replaceChildren?.();
    this.host = null;
  }
}
