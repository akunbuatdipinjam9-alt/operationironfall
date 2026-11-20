




import * as THREE from 'three';
import { RAID, SYIRIL, bossConfig } from './RaidBossLogic.js';

const mat = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.45, metalness: o.m ?? 0.7, emissive: o.e ?? 0x000000, emissiveIntensity: o.ei ?? 0, transparent: !!o.t, opacity: o.o ?? 1, depthWrite: o.t ? false : true, side: o.side ?? THREE.FrontSide });

export class RaidBossView {




  constructor(scene, { boss = 'WARDEN', targetPos = null } = {}) {
    this.scene = scene; this.boss = bossConfig(boss).id; this.cfg = bossConfig(boss); this.targetPos = targetPos;
    this.materials = []; this.geometries = []; this.time = 0; this.flash = 0; this.dead = false; this.deathT = 0;
    const M = this.M = (c, o) => { const m = mat(c, o); this.materials.push(m); return m; };
    const G = this.G = g => { this.geometries.push(g); return g; };
    this.box = G(new THREE.BoxGeometry(1, 1, 1)); this.cyl = G(new THREE.CylinderGeometry(1, 1, 1, 14)); this.sph = G(new THREE.SphereGeometry(1, 20, 14)); this.oct = G(new THREE.OctahedronGeometry(1, 0)); this.cone = G(new THREE.ConeGeometry(1, 1, 10));
    this.mTele = M(0xff3b1f, { r: 1, m: 0, e: 0xff2a10, ei: 1.6, t: true, o: 0.35, side: THREE.DoubleSide });
    this.mBeam = M(0xff5a1f, { r: 1, m: 0, e: 0xff4a12, ei: 3, t: true, o: 0.55 });
    this.mShield = M(0x5ad8ff, { r: 0.1, m: 0, e: 0x3ac8ff, ei: 1.2, t: true, o: 0.16, side: THREE.DoubleSide });
    this.mOrb = M(0x220a02, { r: 0.3, m: 0, e: 0xff7a2a, ei: 4 });
    this.mDrone = M(0x323a42, { r: 0.4, m: 0.8 }); this.mDroneEye = M(0x0b0b0b, { e: 0xff3030, ei: 3 }); this.mAccent = M(0xc2410c, { r: 0.4, m: 0.55 });
    this.mBolt = M(0x2a0606, { r: 0.2, m: 0, e: 0xff3344, ei: 6 }); this.mLock = M(0xff2a3a, { r: 1, m: 0, e: 0xff2030, ei: 2.5, t: true, o: 0.45 });
    this.root = new THREE.Group(); this.body = new THREE.Group(); this.root.add(this.body); scene.add(this.root);
    if (this.boss === 'SYIRIL') this.buildSyiril(); else this.buildWarden();
    this.shield.castShadow = false; this.shield.visible = false;


    this.ring = new THREE.Mesh(G(new THREE.RingGeometry(0.92, 1, 64)), this.mTele); this.ring.rotation.x = -Math.PI / 2; this.ring.visible = false; scene.add(this.ring);
    this.disc = new THREE.Mesh(G(new THREE.CircleGeometry(1, 64)), this.mTele); this.disc.rotation.x = -Math.PI / 2; this.disc.visible = false; scene.add(this.disc);
    this.beam = new THREE.Mesh(this.box, this.mBeam); this.beam.visible = false; scene.add(this.beam);
    const arc = RAID.attacks.SWEEP.arc; this.fanMesh = new THREE.Mesh(G(new THREE.CircleGeometry(RAID.attacks.SWEEP.range, 32, Math.PI / 2 - arc / 2, arc)), this.mTele); this.fanMesh.rotation.x = -Math.PI / 2;
    this.fan = new THREE.Group(); this.fan.add(this.fanMesh); this.fan.visible = false; scene.add(this.fan);
    this.tele = null; this.extraTele = []; this.pulses = [];
    this.laneGeo = G(new THREE.PlaneGeometry(1, 1)); this.laneGeo.rotateX(-Math.PI / 2); this.laneGeo.translate(0, 0, -0.5);


    this.orbGeo = G(new THREE.SphereGeometry(0.32, 12, 8)); this.orbs = new Map(); this.orbPool = [];
    this.boltGeo = G(new THREE.CapsuleGeometry(0.11, 0.55, 4, 8)); this.boltGeo.rotateX(Math.PI / 2); this.bolts = new Map(); this.boltPool = [];
    this.droneParts = { body: this.oct, ring: G(new THREE.TorusGeometry(0.62, 0.05, 6, 24)), eye: G(new THREE.SphereGeometry(0.14, 10, 8)) }; this.drones = new Map();
    this.lockPool = []; this.locks = [];
    this.sharks = new Map(); this.meteors = [];
  }


  part(g, m, x, y, z, sx, sy, sz, parent, rx = 0, ry = 0, rz = 0) { const o = new THREE.Mesh(g, m); o.position.set(x, y, z); o.scale.set(sx, sy, sz); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; parent.add(o); return o; }
  buildWarden() {
    const { M, box, cyl, sph } = this, part = this.part.bind(this), B = this.body;
    this.mHull = M(0x2b3138, { r: 0.42, m: 0.78 }); this.mPlate = M(0x46505a, { r: 0.5, m: 0.7 });
    this.mJoint = M(0x15191e, { r: 0.35, m: 0.9 }); this.mCore = M(0x1a0f08, { r: 0.2, m: 0, e: 0xff6a1a, ei: 2.2 });
    this.mSensor = M(0x0b1114, { r: 0.15, m: 0.2, e: 0x38e1ff, ei: 2.6 });
    part(box, this.mHull, 0, 2.05, 0, 2.6, 1.25, 3.6, B); part(box, this.mPlate, 0, 2.78, 0.3, 2.2, 0.35, 2.6, B); part(box, this.mPlate, 0, 1.45, 0, 2.2, 0.3, 3.0, B);
    for (const s of [-1, 1]) { part(box, this.mPlate, s * 1.42, 2.1, 0, 0.3, 1.0, 3.2, B); part(box, this.mAccent, s * 1.58, 2.45, -0.6, 0.06, 0.16, 1.6, B); }
    part(box, this.mAccent, 0, 2.97, 0.3, 0.3, 0.06, 2.2, B);
    part(box, this.mHull, 0, RAID.core.height, -1.2, 1.5, 1.2, 0.6, B);
    this.core = part(sph, this.mCore, 0, RAID.core.height, -RAID.core.forward, RAID.core.radius, RAID.core.radius, RAID.core.radius, B);
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; part(box, this.mJoint, Math.cos(a) * 0.68, RAID.core.height + Math.sin(a) * 0.68, -1.45, 0.16, 0.16, 0.2, B, 0, 0, a); }
    this.head = new THREE.Group(); this.head.position.set(0, 3.3, -1.6); B.add(this.head);
    part(box, this.mHull, 0, 0.25, 0, 1.3, 0.45, 0.7, this.head); this.sensor = part(box, this.mSensor, 0, 0.28, -0.36, 1.05, 0.1, 0.04, this.head);
    this.pods = [];
    for (const s of [-1, 1]) { const pod = new THREE.Group(); pod.position.set(s * 1.65, 3.05, -0.4); B.add(pod); part(box, this.mHull, 0, 0, 0, 0.7, 0.62, 1.5, pod);
      for (const [dx, dy] of [[-0.16, 0.13], [0.16, 0.13], [-0.16, -0.13], [0.16, -0.13]]) part(cyl, this.mJoint, dx, dy, -0.82, 0.09, 0.4, 0.09, pod, Math.PI / 2); this.pods.push(pod); }
    this.legs = [];
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
      const hip = new THREE.Group(); hip.position.set(sx * 1.35, 1.75, sz * 1.25); B.add(hip);
      part(sph, this.mJoint, 0, 0, 0, 0.38, 0.38, 0.38, hip);
      const thigh = new THREE.Group(); hip.add(thigh); thigh.rotation.z = sx * 0.75; part(box, this.mPlate, 0, -0.65, 0, 0.42, 1.3, 0.5, thigh);
      const knee = new THREE.Group(); knee.position.y = -1.3; thigh.add(knee); part(sph, this.mJoint, 0, 0, 0, 0.27, 0.27, 0.27, knee);
      const shin = new THREE.Group(); knee.add(shin); shin.rotation.z = -sx * 1.2; part(box, this.mHull, 0, -0.75, 0, 0.32, 1.5, 0.38, shin); part(box, this.mAccent, sx * 0.17, -0.5, 0, 0.04, 0.5, 0.3, shin);
      part(box, this.mJoint, 0, -1.55, 0, 0.6, 0.18, 0.75, shin);
      this.legs.push({ hip, thigh, shin, sx, sz, phase: (sx + sz + 2) * 0.8 });
    }
    this.shield = part(sph, this.mShield, 0, 2.2, 0, 3.2, 2.8, 3.6, B);
    this.light = new THREE.PointLight(0xff6a1a, 6, 14, 2); this.light.position.set(0, RAID.core.height, -2); B.add(this.light);
    this.coreMat = this.mCore;
  }


  buildSyiril() {
    const { M, G, box, cyl, sph, cone } = this, part = this.part.bind(this), B = this.body, C = SYIRIL.core;
    this.mSkin = M(0x4a2f5e, { r: 0.72, m: 0.05 }); this.mBelly = M(0x7a5a86, { r: 0.8, m: 0.02 }); this.mDark = M(0x1d1424, { r: 0.6, m: 0.1 });
    this.mHorn = M(0xd9cbb0, { r: 0.5, m: 0.05 }); this.mClaw = M(0xece2cf, { r: 0.35, m: 0.1 });
    this.mEye = M(0x1a1400, { r: 0.15, m: 0, e: 0xffd21a, ei: 3.4 }); this.mPupil = M(0x060402, { r: 0.2, m: 0 });
    this.mMouth = M(0x2a0610, { r: 0.6, m: 0, e: 0x8a1022, ei: 0.8 });

    this.legs = [];
    for (const s of [-1, 1]) {
      const hip = new THREE.Group(); hip.position.set(s * 1.15, 2.1, 0.2); B.add(hip);
      part(sph, this.mSkin, 0, 0, 0, 0.95, 0.95, 0.95, hip);
      part(cyl, this.mSkin, 0, -1.0, 0, 0.62, 1.8, 0.62, hip); part(sph, this.mDark, 0, -1.95, -0.25, 0.75, 0.32, 1.05, hip);
      for (const dx of [-0.35, 0, 0.35]) part(cone, this.mClaw, dx, -2.0, -1.2, 0.12, 0.35, 0.12, hip, -Math.PI / 2);
      this.legs.push({ hip, s, phase: s > 0 ? 0 : Math.PI });
    }

    this.torso = new THREE.Group(); this.torso.position.y = 2.6; B.add(this.torso);
    part(sph, this.mSkin, 0, 1.0, 0, 2.15, 1.85, 1.75, this.torso); part(sph, this.mBelly, 0, 0.75, -0.95, 1.45, 1.35, 0.9, this.torso);
    for (let i = 0; i < 6; i++) part(cone, this.mHorn, (i % 2 ? 0.35 : -0.35), 1.6 + i * 0.25, 1.35 - i * 0.08, 0.22, 0.85, 0.22, this.torso, -0.9 + i * 0.05);

    this.head = new THREE.Group(); this.head.position.set(0, C.height - 0.15, -C.forward + 0.55); B.add(this.head);
    part(sph, this.mSkin, 0, 0, 0.1, 1.15, 1.0, 1.05, this.head);
    for (const s of [-1, 1]) part(cone, this.mHorn, s * 0.75, 0.75, 0.25, 0.22, 0.9, 0.22, this.head, -0.35, 0, -s * 0.5);
    this.eyes = [];
    for (const [ex, ey] of [[-0.42, 0.18], [0.42, 0.18], [0, 0.55]]) { const e = part(sph, this.mEye, ex, ey, -0.58, 0.27, 0.27, 0.2, this.head); part(sph, this.mPupil, ex, ey, -0.76, 0.1, 0.16, 0.05, this.head); this.eyes.push(e); }
    part(box, this.mMouth, 0, -0.42, -0.72, 0.95, 0.24, 0.2, this.head);
    for (let i = 0; i < 6; i++) { part(cone, this.mClaw, -0.38 + i * 0.152, -0.31, -0.82, 0.05, 0.14, 0.05, this.head, Math.PI); part(cone, this.mClaw, -0.3 + i * 0.12, -0.53, -0.82, 0.045, 0.12, 0.045, this.head); }

    this.arms = [];
    for (const s of [-1, 1]) {
      const sh = new THREE.Group(); sh.position.set(s * 2.15, 4.2, -0.1); B.add(sh); part(sph, this.mSkin, 0, 0, 0, 0.75, 0.75, 0.75, sh);
      const upper = new THREE.Group(); sh.add(upper); upper.rotation.z = s * 0.35; part(cyl, this.mSkin, 0, -0.85, 0, 0.42, 1.7, 0.42, upper);
      const elbow = new THREE.Group(); elbow.position.y = -1.7; upper.add(elbow); part(sph, this.mDark, 0, 0, 0, 0.45, 0.45, 0.45, elbow);
      const fore = new THREE.Group(); elbow.add(fore); fore.rotation.x = -0.6; part(cyl, this.mSkin, 0, -0.8, 0, 0.5, 1.6, 0.5, fore);
      part(sph, this.mDark, 0, -1.75, 0, 0.72, 0.6, 0.72, fore);
      for (const dx of [-0.35, 0, 0.35]) part(cone, this.mClaw, dx, -2.35, -0.2, 0.11, 0.55, 0.11, fore, Math.PI + 0.2);
      this.arms.push({ sh, upper, fore, s });
    }

    this.decoArms = [];
    for (const s of [-1, 1]) {
      const base = new THREE.Group(); base.position.set(s * 1.75, 4.85, 0.55); B.add(base); part(sph, this.mDark, 0, 0, 0, 0.32, 0.32, 0.32, base);
      const a1 = new THREE.Group(); base.add(a1); a1.rotation.set(0.35, 0, -s * 0.55); part(cyl, this.mSkin, 0, 0.6, 0, 0.16, 1.2, 0.16, a1);
      const a2 = new THREE.Group(); a2.position.y = 1.2; a1.add(a2); a2.rotation.z = s * 0.7; part(sph, this.mDark, 0, 0, 0, 0.18, 0.18, 0.18, a2); part(cyl, this.mSkin, 0, 0.5, 0, 0.13, 1.0, 0.13, a2);
      for (const k of [-1, 0, 1]) part(cone, this.mClaw, k * 0.12, 1.15, 0, 0.06, 0.32, 0.06, a2, 0, 0, k * 0.35);
      this.decoArms.push({ a1, a2, s });
    }
    this.shield = part(sph, this.mShield, 0, 3.4, 0, 4.2, 4.4, 3.8, B);
    this.light = new THREE.PointLight(0xffc21a, 6, 16, 2); this.light.position.set(0, C.height, -C.forward - 1); B.add(this.light);
    this.coreMat = this.mEye;

    this.mShark = M(0x5d6f7d, { r: 0.55, m: 0.15 }); this.mSharkBelly = M(0xd8dde0, { r: 0.6, m: 0.05 }); this.mSharkEye = M(0x050505, { r: 0.1, m: 0 });
    this.mMeteor = M(0x2a1206, { r: 0.8, m: 0.1, e: 0xff5a10, ei: 3.2 }); this.mTrail = M(0xff7a1a, { r: 1, m: 0, e: 0xff6a10, ei: 2.5, t: true, o: 0.45 });
    this.mAlien = M(0x5fae4c, { r: 0.6, m: 0.05 }); this.mAlienDark = M(0x0b0f0a, { r: 0.2, m: 0 }); this.mSaber = M(0x7df9ff, { r: 0.1, m: 0, e: 0x5ae8ff, ei: 5 }); this.mHilt = M(0x9aa3ab, { r: 0.3, m: 0.9 });
    this.mDirt = M(0x6a5a44, { r: 1, m: 0, t: true, o: 0.6 });
    this.finGeo = G(new THREE.ConeGeometry(0.5, 1, 4)); this.meteorGeo = G(new THREE.IcosahedronGeometry(1, 1));
  }

  buildShark() {
    const g = new THREE.Group(), part = this.part.bind(this), { sph, cone } = this;
    part(sph, this.mShark, 0, 0, 0, 0.55, 0.5, 1.6, g); part(sph, this.mSharkBelly, 0, -0.22, -0.1, 0.45, 0.28, 1.35, g);
    part(this.finGeo, this.mShark, 0, 0.6, 0.15, 0.55, 0.9, 0.18, g, -0.35);
    const tail = new THREE.Group(); tail.position.z = 1.45; g.add(tail); part(this.finGeo, this.mShark, 0, 0.35, 0.2, 0.4, 0.8, 0.12, tail, 0.5); part(this.finGeo, this.mShark, 0, -0.25, 0.15, 0.32, 0.6, 0.12, tail, Math.PI - 0.5);
    for (const s of [-1, 1]) { part(this.finGeo, this.mShark, s * 0.55, -0.2, -0.3, 0.3, 0.7, 0.1, g, 0, 0, s * 1.9); part(sph, this.mSharkEye, s * 0.3, 0.1, -1.25, 0.07, 0.07, 0.07, g); }
    for (let i = 0; i < 7; i++) part(cone, this.mClaw, -0.24 + i * 0.08, -0.12, -1.48, 0.03, 0.09, 0.03, g, Math.PI);
    g.userData.tail = tail; return g;
  }
  buildAlien() {
    const g = new THREE.Group(), part = this.part.bind(this), { sph, cyl, box } = this;
    for (const s of [-1, 1]) part(cyl, this.mAlien, s * 0.13, 0.35, 0, 0.08, 0.7, 0.08, g);
    part(sph, this.mAlien, 0, 0.95, 0, 0.26, 0.38, 0.2, g);
    const head = part(sph, this.mAlien, 0, 1.52, 0, 0.3, 0.36, 0.3, g);
    for (const s of [-1, 1]) part(sph, this.mAlienDark, s * 0.13, 1.55, -0.24, 0.1, 0.15, 0.05, g, 0, 0, s * 0.35);
    part(cyl, this.mAlien, -0.3, 1.0, 0, 0.06, 0.6, 0.06, g, 0, 0, 0.25);
    const arm = new THREE.Group(); arm.position.set(0.3, 1.25, 0); g.add(arm);
    part(cyl, this.mAlien, 0, -0.25, 0, 0.06, 0.55, 0.06, arm);
    part(cyl, this.mHilt, 0, -0.55, -0.05, 0.04, 0.22, 0.04, arm, Math.PI / 2 - 0.4);
    const saber = part(cyl, this.mSaber, 0, -0.62, -0.68, 0.035, 1.15, 0.035, arm, Math.PI / 2 - 0.4); saber.castShadow = false;
    g.userData.arm = arm; g.userData.head = head; return g;
  }



  onEvent(e) {
    if (e.type === 'telegraph') {
      this.tele = { attack: e.attack, time: 0, duration: e.duration, x: e.x, y: e.y, z: e.z, yaw: e.yaw, radius: e.radius, arc: e.arc, range: e.range };
      this.clearExtraTele();
      if (e.attack === 'SHARKS' && e.lines) for (const L of e.lines) { const m = new THREE.Mesh(this.laneGeo, this.mTele); m.position.set(L.x, (this.state?.y ?? e.y) + 0.06, L.z); m.rotation.y = L.yaw; m.scale.set((e.width || 1.5) * 2, 1, L.len); this.scene.add(m); this.extraTele.push(m); }
      if (e.attack === 'METEOR' && e.points) for (const p of e.points) {
        const ring = new THREE.Mesh(this.ring.geometry, this.mTele); ring.rotation.x = -Math.PI / 2; ring.position.set(p.x, p.y + 0.06, p.z); ring.scale.setScalar(SYIRIL.attacks.METEOR.radius); this.scene.add(ring); this.extraTele.push(ring);
        const rock = new THREE.Mesh(this.meteorGeo || this.oct, this.mMeteor || this.mOrb); rock.scale.setScalar(1.1); this.scene.add(rock);
        const trail = new THREE.Mesh(this.cone, this.mTrail || this.mBeam); trail.scale.set(0.9, 6, 0.9); this.scene.add(trail);
        this.meteors.push({ rock, trail, p, t: 0, d: e.duration });
      }
    } else if (e.type === 'attackStart') {
      if (e.attack === 'SWEEP') this.tele = { attack: 'SWEEP_LIVE', time: 0, duration: RAID.attacks.SWEEP.duration };
      else this.tele = null;
      if (e.attack !== 'METEOR') this.clearExtraTele();
      if (e.attack === 'SLAM' || e.attack === 'SHOCKWAVE') { this.pulses.push({ x: e.x, y: e.y, z: e.z, r: this.cfg.attacks[e.attack].radius, t: 0 }); this.slamT = 0.6; }
    } else if (e.type === 'meteorImpact') {
      this.pulses.push({ x: e.x, y: e.y, z: e.z, r: e.radius, t: 0 }); this.clearExtraTele();
      for (const m of this.meteors.splice(0)) { m.rock.removeFromParent(); m.trail.removeFromParent(); }
    } else if (e.type === 'bolt') {
      this.spawnBolt(e);
    } else if (e.type === 'boltEnd') {
      const m = this.bolts.get(e.id); if (m) { m.visible = false; this.bolts.delete(e.id); this.boltPool.push(m); }
    } else if (e.type === 'shark') {
      this.ensureShark(e);
    } else if (e.type === 'sharkEnd') {
      const s = this.sharks.get(e.id); if (s) { s.removeFromParent(); this.sharks.delete(e.id); }
    } else if (e.type === 'bossDefeated') { this.dead = true; this.tele = null; this.clearExtraTele(); }
  }
  clearExtraTele() { for (const m of this.extraTele) m.removeFromParent(); this.extraTele.length = 0; }
  spawnBolt(b) {
    let m = this.bolts.get(b.id);
    if (!m) { m = this.boltPool.pop() || new THREE.Mesh(this.boltGeo, this.mBolt); this.scene.add(m); this.bolts.set(b.id, m); }
    m.visible = true; m.position.set(b.x, b.y, b.z); m.userData.v = new THREE.Vector3(b.vx, b.vy, b.vz); m.lookAt(b.x + b.vx, b.y + b.vy, b.z + b.vz);
  }
  ensureShark(s) {
    let g = this.sharks.get(s.id);
    if (!g) { if (!this.mShark) return null; g = this.buildShark(); this.scene.add(g); this.sharks.set(s.id, g); g.userData.t = 0; }
    g.userData.base = new THREE.Vector3(s.x, s.y, s.z); g.userData.yaw = s.yaw; g.rotation.y = s.yaw;
    return g;
  }


  apply(s) {
    this.state = s;
    if (!s) return;
    this.root.position.set(s.x, s.y, s.z); this.root.rotation.y = s.yaw;
    if (s.health < (this.lastHealth ?? s.health)) this.flash = 0.08;
    this.lastHealth = s.health;
    const seen = new Set();
    for (const o of s.orbs || []) { seen.add(o.id); let m = this.orbs.get(o.id); if (!m) { m = this.orbPool.pop() || new THREE.Mesh(this.orbGeo, this.mOrb); this.scene.add(m); this.orbs.set(o.id, m); } m.visible = true; m.position.set(o.x, o.y, o.z); }
    for (const [id, m] of this.orbs) if (!seen.has(id)) { m.visible = false; this.orbs.delete(id); this.orbPool.push(m); }
    const bseen = new Set();
    for (const b of s.bolts || []) { bseen.add(b.id); this.spawnBolt(b); }
    for (const [id, m] of this.bolts) if (!bseen.has(id)) { m.visible = false; this.bolts.delete(id); this.boltPool.push(m); }
    const sseen = new Set();
    for (const sh of s.sharks || []) { sseen.add(sh.id); const g = this.ensureShark(sh); if (g) g.userData.base.set(sh.x, sh.y, sh.z); }
    for (const [id, g] of this.sharks) if (!sseen.has(id)) { g.removeFromParent(); this.sharks.delete(id); }

    const dseen = new Set();
    for (const d of s.drones || []) { dseen.add(d.id); let g = this.drones.get(d.id);
      if (!g) {
        if (d.type === 'alien' && this.mAlien) g = this.buildAlien();
        else { g = new THREE.Group(); const b = new THREE.Mesh(this.droneParts.body, this.mDrone); b.scale.set(0.42, 0.3, 0.42); b.castShadow = true; g.add(b); const r = new THREE.Mesh(this.droneParts.ring, this.mAccent); r.rotation.x = Math.PI / 2; g.add(r); const eye = new THREE.Mesh(this.droneParts.eye, this.mDroneEye); eye.position.set(0, -0.05, -0.38); g.add(eye); }
        g.userData.type = d.type || 'drone'; this.scene.add(g); this.drones.set(d.id, g);
      }
      g.position.set(d.x, d.y, d.z); g.userData.locks = d.locks || []; g.userData.swing = d.swing || 0; if (g.userData.type === 'alien') g.rotation.y = d.yaw || 0; }
    for (const [id, g] of this.drones) if (!dseen.has(id)) { g.removeFromParent(); this.drones.delete(id); }
  }

  updateLocks() {
    let n = 0;
    if (this.targetPos) for (const g of this.drones.values()) {
      if (g.userData.type === 'alien') continue;
      for (const id of g.userData.locks || []) {
        const p = this.targetPos(id); if (!p) continue;
        let m = this.lockPool[n]; if (!m) { m = new THREE.Mesh(this.box, this.mLock); m.castShadow = false; this.scene.add(m); this.lockPool.push(m); }
        const a = g.position, b = p.clone().add(new THREE.Vector3(0, 1.2, 0)), len = a.distanceTo(b);
        m.visible = true; m.scale.set(0.025, 0.025, len); m.position.copy(a).lerp(b, 0.5); m.lookAt(b); n++;
      }
    }
    for (let i = n; i < this.lockPool.length; i++) this.lockPool[i].visible = false;
    this.mLock.opacity = 0.3 + 0.2 * Math.sin(this.time * 14);
  }

  update(dt) {
    this.time += dt; const s = this.state; if (!s) return;
    const moving = s.state === 'CHASE';
    const charging = this.tele && this.tele.attack !== 'SWEEP_LIVE' ? this.tele.time / Math.max(0.01, this.tele.duration) : 0;
    if (this.boss === 'SYIRIL') this.animateSyiril(dt, moving, charging); else this.animateWarden(dt, moving, charging);
    this.light.intensity = this.dead ? 0 : 5 + charging * 18; this.flash -= dt;
    this.shield.visible = !!s.shielded && !this.dead; if (this.shield.visible) this.mShield.opacity = 0.12 + Math.sin(this.time * 8) * 0.05;

    this.ring.visible = this.disc.visible = this.beam.visible = this.fan.visible = false;
    if (this.tele && !this.dead) {
      const t = this.tele; t.time += dt; const k = Math.min(1, t.time / t.duration);
      if (t.attack === 'SLAM' || t.attack === 'SHOCKWAVE') {
        this.ring.visible = this.disc.visible = true; this.ring.position.set(t.x, t.y + 0.05, t.z); this.ring.scale.setScalar(t.radius);
        this.disc.position.set(t.x, t.y + 0.04, t.z); this.disc.scale.setScalar(Math.max(0.01, t.radius * k)); this.mTele.opacity = 0.25 + 0.2 * Math.sin(t.time * 18);
      } else if (t.attack === 'SWEEP' || t.attack === 'SWEEP_LIVE') {
        const core = new THREE.Vector3(0, RAID.core.height, -RAID.core.forward).applyEuler(this.root.rotation).add(this.root.position);
        const len = RAID.attacks.SWEEP.range, yaw = this.root.rotation.y;
        this.beam.visible = true; this.beam.scale.set(t.attack === 'SWEEP' ? 0.05 : 0.32, t.attack === 'SWEEP' ? 0.05 : 0.32, len);
        this.beam.position.set(core.x - Math.sin(yaw) * len / 2, core.y, core.z - Math.cos(yaw) * len / 2); this.beam.rotation.set(0, yaw, 0);
        this.mBeam.opacity = t.attack === 'SWEEP' ? 0.35 + 0.35 * Math.sin(t.time * 22) : 0.85;
        if (t.attack === 'SWEEP') { this.fan.visible = true; this.fan.rotation.y = yaw; this.fan.position.set(this.root.position.x, this.root.position.y + 0.05, this.root.position.z); this.mTele.opacity = 0.12 + 0.1 * k; }
      } else if (t.attack === 'SHARKS' || t.attack === 'METEOR') this.mTele.opacity = 0.2 + 0.25 * Math.abs(Math.sin(t.time * 10));
      if (t.time > t.duration + (t.attack === 'SWEEP_LIVE' ? 0 : 0.2)) this.tele = null;
    }

    for (const m of this.meteors) { m.t += dt; const k = Math.min(1, m.t / m.d), h = (1 - k) * SYIRIL.attacks.METEOR.height;
      m.rock.position.set(m.p.x + (1 - k) * 9, m.p.y + 1 + h, m.p.z - (1 - k) * 4); m.rock.rotation.x += dt * 3; m.rock.rotation.y += dt * 2;
      m.trail.position.copy(m.rock.position).add(new THREE.Vector3(2.2, 3.3, -1)); m.trail.lookAt(m.rock.position); m.trail.rotateX(Math.PI / 2); m.trail.visible = k < 0.98; }

    for (const p of this.pulses) { p.t += dt; }
    this.pulses = this.pulses.filter(p => p.t < 0.45);
    if (this.pulses.length && !this.tele) { const p = this.pulses[this.pulses.length - 1]; this.ring.visible = true; this.ring.position.set(p.x, p.y + 0.06, p.z); this.ring.scale.setScalar(p.r * (0.6 + p.t * 1.2)); this.mTele.opacity = 0.5 * (1 - p.t / 0.45); }

    for (const m of this.bolts.values()) if (m.userData.v) m.position.addScaledVector(m.userData.v, dt);
    for (const g of this.sharks.values()) {
      g.userData.t += dt; const step = SYIRIL.attacks.SHARKS.speed * dt;
      g.userData.base.x -= Math.sin(g.userData.yaw) * step; g.userData.base.z -= Math.cos(g.userData.yaw) * step;
      const leap = Math.abs(Math.sin(g.userData.t * 5.5));
      g.position.set(g.userData.base.x, g.userData.base.y - 0.45 + leap * 1.5, g.userData.base.z);
      g.rotation.set(Math.cos(g.userData.t * 5.5) * 0.5 * Math.sign(Math.sin(g.userData.t * 5.5)), g.userData.yaw, 0);
      g.userData.tail.rotation.y = Math.sin(g.userData.t * 18) * 0.5;
    }
    for (const g of this.drones.values()) {
      if (g.userData.type === 'alien') { g.userData.arm.rotation.x = g.userData.swing > 0 ? -1.6 * (g.userData.swing / 0.35) : Math.sin(this.time * 6 + g.id) * 0.15; g.userData.head.rotation.z = Math.sin(this.time * 3) * 0.1; }
      else { g.children[1].rotation.z += dt * 14; g.rotation.y += dt * 1.5; }
    }
    this.updateLocks();
    if (this.dead) { this.deathT += dt; this.body.rotation.z = Math.min(0.5, this.deathT * 0.4); this.body.position.y = -Math.min(1.1, this.deathT * 0.8); }
  }

  animateWarden(dt, moving, charging) {
    for (const L of this.legs) { const ph = this.time * (moving ? 5 : 1.2) + L.phase; const lift = moving ? Math.max(0, Math.sin(ph)) * 0.35 : 0; L.thigh.rotation.x = Math.sin(ph) * (moving ? 0.35 : 0.04); L.hip.position.y = 1.75 + lift * 0.2; }
    this.body.position.y = moving ? Math.abs(Math.sin(this.time * 5)) * 0.06 : Math.sin(this.time * 1.4) * 0.03;
    this.mCore.emissiveIntensity = this.dead ? 0.1 : 2.2 + charging * 6 + (this.flash > 0 ? 5 : 0) + Math.sin(this.time * 9) * 0.25;
    this.mSensor.emissive.setHex(this.state.phase === 3 ? 0xff3b30 : this.state.phase === 2 ? 0xffb020 : 0x38e1ff);
    for (const p of this.pods) p.rotation.x = this.tele?.attack === 'BARRAGE' ? -0.25 * charging : THREE.MathUtils.lerp(p.rotation.x, 0, dt * 4);
  }

  animateSyiril(dt, moving, charging) {
    const t = this.time, walk = moving ? 3.2 : 0.8;
    for (const L of this.legs) { L.hip.rotation.x = Math.sin(t * walk + L.phase) * (moving ? 0.38 : 0.03); }
    this.body.position.y = moving ? Math.abs(Math.sin(t * walk)) * 0.12 : Math.sin(t * 1.1) * 0.05;
    this.torso.rotation.z = Math.sin(t * walk * 0.5) * (moving ? 0.05 : 0.015);
    this.head.rotation.y = Math.sin(t * 0.7) * 0.18; this.head.rotation.x = this.tele?.attack === 'SHOCKWAVE' ? -0.35 * charging : Math.sin(t * 0.9) * 0.05;

    const slamming = this.tele?.attack === 'SLAM' || this.tele?.attack === 'SHOCKWAVE';
    this.slamT = Math.max(0, (this.slamT || 0) - dt);
    for (const A of this.arms) {
      const raise = slamming ? -2.3 * charging : this.slamT > 0 ? -2.3 * (this.slamT / 0.6) * 0.3 : 0;
      A.upper.rotation.x = raise + (moving ? Math.sin(t * walk + (A.s > 0 ? Math.PI : 0)) * 0.3 : Math.sin(t * 1.2 + A.s) * 0.06);
      A.fore.rotation.x = -0.6 + (slamming ? -0.5 * charging : 0);
      if (this.tele?.attack === 'METEOR' || this.tele?.attack === 'ALIENS') A.upper.rotation.z = A.s * (0.35 + 1.1 * charging);
      else A.upper.rotation.z = THREE.MathUtils.lerp(A.upper.rotation.z, A.s * 0.35, Math.min(1, dt * 4));
    }
    for (const D of this.decoArms) { D.a1.rotation.x = 0.35 + Math.sin(t * 1.6 + D.s) * 0.18; D.a2.rotation.z = D.s * (0.7 + Math.sin(t * 2.3 + D.s * 2) * 0.25); }
    const glow = this.dead ? 0.1 : 3.4 + charging * 6 + (this.flash > 0 ? 6 : 0) + Math.sin(t * 7) * 0.4;
    this.mEye.emissiveIntensity = glow; this.mEye.emissive.setHex(this.state.phase === 3 ? 0xff3b1a : this.state.phase === 2 ? 0xff9a1a : 0xffd21a);
    this.mMouth.emissiveIntensity = 0.8 + charging * 3;
  }

  dispose() {
    this.clearExtraTele();
    for (const m of this.meteors) { m.rock.removeFromParent(); m.trail.removeFromParent(); }
    for (const o of [this.root, this.ring, this.disc, this.beam, this.fan, ...this.orbs.values(), ...this.orbPool, ...this.bolts.values(), ...this.boltPool, ...this.lockPool, ...this.drones.values(), ...this.sharks.values()]) o.removeFromParent();
    for (const g of this.geometries) g.dispose(); for (const m of this.materials) m.dispose();
  }
}
