 
 
 
 
 
 
 
 
 
import * as THREE from 'three';

 
export function buildOtherWorld(renderer, build) {
  const scene = new THREE.Scene(), exposure = renderer.toneMappingExposure;
  const world = build(renderer, scene);
  const ownExposure = renderer.toneMappingExposure; renderer.toneMappingExposure = exposure;
  scene.traverse(o => { if (o.isLight) o.castShadow = false; if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  scene.matrixWorldAutoUpdate = true;
  return { scene, world, exposure: ownExposure, dispose() { world?.dispose?.(); scene.clear(); } };
}

 
export function openDirection(layout, p, step = 0.5, max = 30) {
  let best = 0, bestLen = -1;
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    const dx = Math.sin(yaw), dz = Math.cos(yaw); let len = 0;
    for (; len < max; len += step) { const x = p.x + dx * len, z = p.z + dz * len;
      if (layout.boxes.some(b => Math.abs(b.x - x) < b.w / 2 + 0.4 && Math.abs(b.z - z) < b.d / 2 + 0.4)) break; }
    if (len > bestLen) { bestLen = len; best = yaw; }
  }
  return best;
}

const VERT = `varying vec4 vClip; void main(){ vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); vClip = p; gl_Position = p; }`;
const FRAG = `uniform sampler2D map; uniform float gain; varying vec4 vClip;
void main(){ vec2 uv = vClip.xy / vClip.w * 0.5 + 0.5; gl_FragColor = vec4(texture2D(map, uv).rgb * gain, 1.0);
#include <tonemapping_fragment>
#include <colorspace_fragment>
}`;

export class PortalView {
   
  constructor(renderer, other, exit, { scale = 0.5, update = null } = {}) {
    this.renderer = renderer; this.other = other; this.exit = exit; this.scale = scale; this.update = update;
    this.rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, depthBuffer: true });
    this.cam = new THREE.PerspectiveCamera(60, 1, 0.05, 200);
    this.material = new THREE.ShaderMaterial({ uniforms: { map: { value: this.rt.texture }, gain: { value: 1.15 } }, vertexShader: VERT, fragmentShader: FRAG, side: THREE.FrontSide });
    this.exitMatrix = new THREE.Matrix4().compose(new THREE.Vector3(exit.x, 0, exit.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), exit.yaw), new THREE.Vector3(1, 1, 1));
    this.flip = new THREE.Matrix4().makeRotationY(Math.PI);
    this.plane = new THREE.Plane(); this.size = new THREE.Vector2(); this._m = new THREE.Matrix4(); this._n = new THREE.Vector3(); this._p = new THREE.Vector3(); this.lastFrame = -1;
  }
   
  render(door, camera, dt = 0.016) {
    const r = this.renderer; door.updateMatrixWorld(); camera.updateMatrixWorld();
     
    const dp = this._p.setFromMatrixPosition(door.matrixWorld), fwd = this._n.set(0, 0, 1).transformDirection(door.matrixWorld);
    const toCam = camera.getWorldPosition(new THREE.Vector3()).sub(dp); if (toCam.length() > 60 || toCam.dot(fwd) < -0.2) return false;
    r.getDrawingBufferSize(this.size); const w = Math.max(2, Math.round(this.size.x * this.scale)), h = Math.max(2, Math.round(this.size.y * this.scale));
    if (this.rt.width !== w || this.rt.height !== h) this.rt.setSize(w, h);
     
    this._m.copy(door.matrixWorld).invert().premultiply(this.flip).premultiply(this.exitMatrix).multiply(camera.matrixWorld);
    this.cam.matrixAutoUpdate = false; this.cam.matrixWorld.copy(this._m); this.cam.matrixWorldInverse.copy(this._m).invert(); this.cam.matrix.copy(this._m);
    this.cam.projectionMatrix.copy(camera.projectionMatrix); this.cam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
     
    const n = new THREE.Vector3(Math.sin(this.exit.yaw), 0, Math.cos(this.exit.yaw)); this.plane.setFromNormalAndCoplanarPoint(n, new THREE.Vector3(this.exit.x, 0, this.exit.z).addScaledVector(n, -0.02));
    this.update?.(this.cam.getWorldPosition(new THREE.Vector3()), dt);
    const prevTarget = r.getRenderTarget(), prevClip = r.clippingPlanes, prevTone = r.toneMapping, prevShadow = r.shadowMap.autoUpdate;
    r.clippingPlanes = [this.plane]; r.toneMapping = THREE.NoToneMapping; r.shadowMap.autoUpdate = false;
    try { r.setRenderTarget(this.rt); r.clear(); r.render(this.other.scene, this.cam); }
    finally { r.setRenderTarget(prevTarget); r.clippingPlanes = prevClip; r.toneMapping = prevTone; r.shadowMap.autoUpdate = prevShadow; }
    return true;
  }
  dispose() { this.rt.dispose(); this.material.dispose(); }
}

 
 
 
export class LinkPortal {
  constructor(renderer, { scale = 0.6 } = {}) {
    this.renderer = renderer; this.scale = scale;
    this.rt = new THREE.WebGLRenderTarget(2, 2, { type: THREE.HalfFloatType, depthBuffer: true });
    this.cam = new THREE.PerspectiveCamera(60, 1, 0.05, 300);
    this.material = new THREE.ShaderMaterial({ uniforms: { map: { value: this.rt.texture }, gain: { value: 1.0 } }, vertexShader: VERT, fragmentShader: FRAG, side: THREE.FrontSide });
    this.flip = new THREE.Matrix4().makeRotationY(Math.PI); this.plane = new THREE.Plane(); this.size = new THREE.Vector2(); this._m = new THREE.Matrix4(); this._e = new THREE.Matrix4(); this._p = new THREE.Vector3(); this._n = new THREE.Vector3(); this._c = new THREE.Vector3();
  }
   
  render(scene, door, camera, exit, { before = null, after = null } = {}) {
    const r = this.renderer; door.updateMatrixWorld(); camera.updateMatrixWorld();
    const dp = this._p.setFromMatrixPosition(door.matrixWorld), fwd = this._n.set(0, 0, 1).transformDirection(door.matrixWorld), cp = camera.getWorldPosition(this._c);
    const toCam = cp.clone().sub(dp); if (toCam.length() > 70 || toCam.dot(fwd) < -0.05) return false;
    r.getDrawingBufferSize(this.size); const w = Math.max(2, Math.round(this.size.x * this.scale)), h = Math.max(2, Math.round(this.size.y * this.scale));
    if (this.rt.width !== w || this.rt.height !== h) this.rt.setSize(w, h);
    this._e.compose(new THREE.Vector3(exit.x, 0, exit.z), new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), exit.yaw), new THREE.Vector3(1, 1, 1));
    this._m.copy(door.matrixWorld).invert().premultiply(this.flip).premultiply(this._e).multiply(camera.matrixWorld);
    this.cam.matrixAutoUpdate = false; this.cam.matrixWorld.copy(this._m); this.cam.matrixWorldInverse.copy(this._m).invert(); this.cam.matrix.copy(this._m);
    this.cam.projectionMatrix.copy(camera.projectionMatrix); this.cam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    const n = new THREE.Vector3(Math.sin(exit.yaw), 0, Math.cos(exit.yaw)); this.plane.setFromNormalAndCoplanarPoint(n, new THREE.Vector3(exit.x, 0, exit.z).addScaledVector(n, -0.03));
    const prevTarget = r.getRenderTarget(), prevClip = r.clippingPlanes, prevTone = r.toneMapping, prevShadow = r.shadowMap.autoUpdate, wasVisible = door.visible;
    before?.(this.cam); door.visible = false;  
    r.clippingPlanes = [this.plane]; r.toneMapping = THREE.NoToneMapping; r.shadowMap.autoUpdate = false;
    try { r.setRenderTarget(this.rt); r.clear(); r.render(scene, this.cam); }
    finally { r.setRenderTarget(prevTarget); r.clippingPlanes = prevClip; r.toneMapping = prevTone; r.shadowMap.autoUpdate = prevShadow; door.visible = wasVisible; after?.(); }
    return true;
  }
  dispose() { this.rt.dispose(); this.material.dispose(); }
}

 
 
 
export function makeChildFigure() {
  const g = new THREE.Group(), coat = new THREE.MeshStandardMaterial({ color: 0xd9a531, roughness: 0.8 }), pants = new THREE.MeshStandardMaterial({ color: 0x34496b, roughness: 0.9 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xc89a7a, roughness: 0.7 }), hair = new THREE.MeshStandardMaterial({ color: 0x2b1d14, roughness: 0.9 }), boot = new THREE.MeshStandardMaterial({ color: 0x8a2a24, roughness: 0.6 });
  const part = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; };
   
  part(new THREE.CapsuleGeometry(0.16, 0.38, 4, 10), coat, 0, 0.17, 0, 0, 0, Math.PI / 2);
  part(new THREE.SphereGeometry(0.13, 14, 10), skin, -0.42, 0.17, 0.02);
  part(new THREE.SphereGeometry(0.135, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), hair, -0.44, 0.19, -0.03, 0, 0, Math.PI / 2);
  part(new THREE.CapsuleGeometry(0.07, 0.34, 4, 8), pants, 0.4, 0.13, 0.07, 0, 0, Math.PI / 2 - 0.25);
  part(new THREE.CapsuleGeometry(0.07, 0.32, 4, 8), pants, 0.36, 0.1, -0.08, 0, 0, Math.PI / 2 + 0.35);
  part(new THREE.CapsuleGeometry(0.05, 0.26, 4, 8), coat, -0.05, 0.2, 0.17, 0.6, 0, Math.PI / 2);
  part(new THREE.BoxGeometry(0.1, 0.08, 0.16), boot, 0.66, 0.06, 0.12);
  const shoe = part(new THREE.BoxGeometry(0.1, 0.08, 0.17), boot, 1.4, 0.04, -0.6, 0, 0.9, 0.3);  
  g.userData.mats = [coat, pants, skin, hair, boot]; g.userData.shoe = shoe;
  g.traverse(o => { o.castShadow = false; o.raycast = () => {}; });
  return g;
}
