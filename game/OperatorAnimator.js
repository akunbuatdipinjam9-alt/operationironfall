















import * as THREE from 'three';

export const STATES = Object.freeze(['IDLE', 'WALK', 'RUN', 'SPRINT', 'CROUCH_IDLE', 'CROUCH_WALK', 'JUMP', 'DEATH']);

export const GAIT = Object.freeze({
  WALK: { cycle: 0.92, amp: 0.5, knee: 0.75, bob: 0.018, lean: 0.05, ref: 1.9 },
  RUN: { cycle: 0.62, amp: 0.78, knee: 1.15, bob: 0.035, lean: 0.14, ref: 4.6 },
  SPRINT: { cycle: 0.5, amp: 0.95, knee: 1.4, bob: 0.045, lean: 0.24, ref: 7.4 },
  CROUCH_WALK: { cycle: 0.9, amp: 0.3, knee: 0.28, bob: 0.012, lean: 0.22, ref: 1.6 },
});
const BASE = { hipsY: 0.82, legY: 0.78, crouchDrop: 0.26 };
const FADE = { default: 0.18, toDeath: 0.07, toJump: 0.09, fromJump: 0.12 };
const TH = { idle: 0.35, walk: 2.7, run: 6.6 };





export function selectState(p, prev = 'IDLE') {
  if (p.dead) return 'DEATH';
  if (p.grounded === false) return 'JUMP';
  const v = p.speed || 0, h = 0.25;
  if (p.crouch) return v > (prev === 'CROUCH_WALK' ? TH.idle - 0.15 : TH.idle) ? 'CROUCH_WALK' : 'CROUCH_IDLE';
  if (v < (prev === 'IDLE' ? TH.idle : TH.idle - 0.15)) return 'IDLE';
  if (v < (prev === 'WALK' ? TH.walk + h : TH.walk - h)) return 'WALK';
  if (p.sprint && v > 5.2) return 'SPRINT';
  return v < (prev === 'RUN' ? TH.run + h : TH.run - h) ? 'RUN' : 'SPRINT';
}

export function gaitTimeScale(state, speed, backwards = false) {
  const g = GAIT[state]; if (!g) return 1;
  return THREE.MathUtils.clamp(speed / g.ref, 0.55, 1.6) * (backwards ? -1 : 1);
}


const J = { root: 'J_root', hips: 'J_hips', head: 'J_head', legL: 'J_legL', legR: 'J_legR', kneeL: 'J_kneeL', kneeR: 'J_kneeR' };
const TRACKS = ['root.rotation[x]', 'root.position[y]', 'hips.position[y]', 'hips.rotation[x]', 'hips.rotation[y]', 'hips.rotation[z]', 'head.rotation[x]', 'head.rotation[y]',
  'legL.rotation[x]', 'legR.rotation[x]', 'legL.position[y]', 'legR.position[y]', 'kneeL.rotation[x]', 'kneeR.rotation[x]'];
const REST = { 'hips.position[y]': BASE.hipsY, 'legL.position[y]': BASE.legY, 'legR.position[y]': BASE.legY };

function makeClip(name, duration, fn, fps = 30) {
  const n = Math.max(2, Math.round(duration * fps) + 1), times = new Float32Array(n), cols = TRACKS.map(() => new Float32Array(n));
  for (let i = 0; i < n; i++) {
    const t = (i / (n - 1)) * duration, pose = fn(t, t / duration); times[i] = t;
    TRACKS.forEach((k, c) => { cols[c][i] = pose[k] ?? REST[k] ?? 0; });
  }
  return new THREE.AnimationClip(name, duration, TRACKS.map((k, c) => { const [joint, prop] = k.split('.'); return new THREE.NumberKeyframeTrack(`${J[joint]}.${prop}`, times, cols[c]); }));
}
function gaitPose(g, phase, crouched) {
  const s = Math.sin(phase), drop = crouched ? BASE.crouchDrop : 0, hipBase = crouched ? 0.85 : 0, kneeBase = crouched ? -1.75 : -0.08;

  const kL = Math.max(0, Math.sin(phase + 1.9)), kR = Math.max(0, Math.sin(phase + Math.PI + 1.9));
  return {
    'hips.position[y]': BASE.hipsY - drop - g.bob + g.bob * Math.cos(phase * 2), 'hips.rotation[x]': -g.lean, 'hips.rotation[y]': -0.11 * g.amp * s, 'hips.rotation[z]': 0.035 * s,
    'head.rotation[x]': g.lean * 0.65, 'head.rotation[y]': 0.09 * g.amp * s,
    'legL.rotation[x]': hipBase + g.amp * s, 'legR.rotation[x]': hipBase - g.amp * s, 'legL.position[y]': BASE.legY - drop, 'legR.position[y]': BASE.legY - drop,
    'kneeL.rotation[x]': kneeBase - g.knee * kL, 'kneeR.rotation[x]': kneeBase - g.knee * kR,
  };
}
let SHARED = null;

export function operatorClips() {
  if (SHARED) return SHARED;
  const c = {};
  c.IDLE = makeClip('IDLE', 3.2, (t, u) => { const b = Math.sin(u * Math.PI * 2); return {
    'hips.position[y]': BASE.hipsY - 0.004 + 0.004 * b, 'hips.rotation[x]': -0.02 + 0.008 * b, 'hips.rotation[y]': 0.03 * Math.sin(u * Math.PI * 2 + 1), 'head.rotation[y]': 0.07 * Math.sin(u * Math.PI * 4 + 0.6),
    'legL.rotation[x]': 0.05, 'legR.rotation[x]': -0.07, 'kneeL.rotation[x]': -0.07, 'kneeR.rotation[x]': -0.05 }; });
  for (const k of ['WALK', 'RUN', 'SPRINT']) c[k] = makeClip(k, GAIT[k].cycle, (t, u) => gaitPose(GAIT[k], u * Math.PI * 2, false));
  c.CROUCH_WALK = makeClip('CROUCH_WALK', GAIT.CROUCH_WALK.cycle, (t, u) => gaitPose(GAIT.CROUCH_WALK, u * Math.PI * 2, true));
  c.CROUCH_IDLE = makeClip('CROUCH_IDLE', 2.6, (t, u) => { const b = Math.sin(u * Math.PI * 2); return {
    'hips.position[y]': BASE.hipsY - BASE.crouchDrop + 0.004 * b, 'hips.rotation[x]': -0.2, 'head.rotation[x]': 0.16, 'head.rotation[y]': 0.05 * b,
    'legL.rotation[x]': 0.95, 'legR.rotation[x]': 0.72, 'legL.position[y]': BASE.legY - BASE.crouchDrop, 'legR.position[y]': BASE.legY - BASE.crouchDrop, 'kneeL.rotation[x]': -1.8, 'kneeR.rotation[x]': -1.7 }; });
  c.JUMP = makeClip('JUMP', 1.0, (t, u) => { const w = 0.04 * Math.sin(u * Math.PI * 2); return {
    'hips.rotation[x]': -0.1, 'head.rotation[x]': 0.06, 'legL.rotation[x]': 0.6 + w, 'legR.rotation[x]': 0.12 - w, 'kneeL.rotation[x]': -1.05, 'kneeR.rotation[x]': -0.6 }; });

  const ease = x => x * x * (3 - 2 * x), fall = (dir) => (t, u) => { const buckle = ease(Math.min(1, u / 0.35)), drop = ease(Math.max(0, Math.min(1, (u - 0.18) / 0.7)));
    return { 'root.rotation[x]': dir * 1.52 * drop, 'root.position[y]': 0.17 * drop, 'hips.position[y]': BASE.hipsY - 0.1 * buckle * (1 - drop), 'hips.rotation[x]': dir * 0.22 * buckle * (1 - drop * 0.7), 'hips.rotation[z]': 0.1 * drop,
      'head.rotation[x]': -dir * 0.35 * buckle, 'head.rotation[y]': 0.4 * drop, 'legL.rotation[x]': 0.35 * buckle + 0.2 * drop, 'legR.rotation[x]': 0.15 * buckle - 0.25 * drop,
      'kneeL.rotation[x]': -0.9 * buckle * (1 - drop * 0.6), 'kneeR.rotation[x]': -0.7 * buckle * (1 - drop * 0.3) }; };
  c.DEATH_BACK = makeClip('DEATH_BACK', 0.95, fall(1)); c.DEATH_FRONT = makeClip('DEATH_FRONT', 1.05, fall(-1));
  return (SHARED = c);
}

const damp = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));

export class OperatorAnimator {




  constructor(joints, { clips = null, seed = Math.random() * 1000, reloadSec = 2.2 } = {}) {
    this.j = joints; this.seed = seed; this.reloadSec = reloadSec;
    for (const k of Object.keys(J)) if (joints[k]) joints[k].name = J[k];
    this.mixer = new THREE.AnimationMixer(joints.root);
    this.clips = clips || operatorClips(); this.actions = {};
    for (const [name, clip] of Object.entries(this.clips)) {
      const a = this.mixer.clipAction(clip); a.enabled = true; a.setEffectiveWeight(0);
      if (name.startsWith('DEATH')) { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
      this.actions[name] = a;
    }
    this.state = null; this.current = null;
    this.armBase = joints.arms ? joints.arms.position.clone() : new THREE.Vector3();
    this.magBase = joints.mag ? joints.mag.position.clone() : new THREE.Vector3();

    this.aimX = -0.38; this.cant = 0; this.kick = 0; this.hitT = 0; this.hitF = 0; this.hitS = 0; this.landT = 0; this.equipT = 1; this.respawnT = 1; this.reloadT = -1; this.strafe = 0;
    this.adds = [];
    this.setState('IDLE', 0);
    this.mixer.setTime(seed % 3);
  }

  setState(state, fade = FADE.default) {
    if (state === this.state) return;
    const key = state === 'DEATH' ? ((this.seed | 0) % 2 ? 'DEATH_FRONT' : 'DEATH_BACK') : state, next = this.actions[key]; if (!next) return;

    const phase = GAIT[this.state] && GAIT[state] && this.current ? this.current.time / this.current.getClip().duration : null;
    next.reset(); next.setEffectiveTimeScale(1); next.setEffectiveWeight(1); next.play();
    if (phase != null) next.time = phase * next.getClip().duration;
    if (this.current && this.current !== next) { if (fade > 0) this.current.crossFadeTo(next, fade, false); else this.current.stop(); }
    this.prevState = this.state; this.state = state; this.current = next;
  }



  add(vec, axis, v) { vec[axis] += v; this.adds.push(vec, axis, v); }
  undoAdds() { const a = this.adds; for (let i = 0; i < a.length; i += 3) a[i][a[i + 1]] -= a[i + 2]; a.length = 0; }


  fire(strength = 0.5) { this.kick = Math.min(1, this.kick + 0.35 + strength * 0.65); }

  hit(fromYaw = 0, strength = 1) { this.hitT = 1; this.hitF = Math.cos(fromYaw) * strength; this.hitS = Math.sin(fromYaw) * strength; }
  land(strength = 1) { this.landT = Math.min(1, strength); }

  equip() { this.equipT = 0; }
  respawn() { this.respawnT = 0; this.reloadT = -1; this.kick = this.hitT = this.landT = 0; this.setState('IDLE', 0); }












  update(dt, p) {
    dt = THREE.MathUtils.clamp(Number.isFinite(dt) ? dt : 0, 0, 0.1);
    this.undoAdds();
    const was = this.state, next = selectState(p, was);
    if (next !== was) {
      const fade = next === 'DEATH' ? FADE.toDeath : next === 'JUMP' ? FADE.toJump : was === 'JUMP' ? FADE.fromJump : FADE.default;
      if (was === 'JUMP' && next !== 'DEATH') this.land(1);
      if (was === 'DEATH') this.respawn(); else this.setState(next, fade);
      if (was === 'DEATH' && next !== 'IDLE') this.setState(next, 0);
    }

    let rel = 0;
    if (p.moveYaw != null && p.facingYaw != null && (p.speed || 0) > 0.3) rel = Math.atan2(Math.sin(p.moveYaw - p.facingYaw), Math.cos(p.moveYaw - p.facingYaw));
    const backwards = Math.abs(rel) > Math.PI * 0.6, strafeWant = backwards ? (rel > 0 ? rel - Math.PI : rel + Math.PI) : rel;
    if (GAIT[this.state]) this.current.setEffectiveTimeScale(gaitTimeScale(this.state, p.speed || 0, backwards));
    this.mixer.update(dt);
    const face = this.j.head?.children.find(child => child.userData.animateFace);
    face?.userData.animateFace(dt, p);
    if (this.state === 'DEATH') { this.applyArms(dt, { dead: true }); return; }
    const j = this.j;

    this.strafe = damp(this.strafe, GAIT[this.state] ? THREE.MathUtils.clamp(strafeWant, -1.1, 1.1) : 0, 10, dt);
    j.legL.rotation.y = j.legR.rotation.y = this.strafe * 0.8; this.add(j.hips.rotation, 'y', this.strafe * 0.22);

    if (this.landT > 0) { const l = this.landT; this.dip(0.11 * l, 0.42 * l, 0.8 * l); this.landT = Math.max(0, l - dt / 0.3); }

    if (this.respawnT < 1) { const r = 1 - (this.respawnT = Math.min(1, this.respawnT + dt / 0.45)), e = r * r; this.dip(0.2 * e, 0.7 * e, 1.4 * e); }

    if (this.hitT > 0) { const h = this.hitT * this.hitT; this.add(j.hips.rotation, 'x', 0.26 * h * this.hitF); this.add(j.hips.rotation, 'z', 0.24 * h * this.hitS); this.add(j.head.rotation, 'x', 0.3 * h * this.hitF); j.head.rotation.z = 0.25 * h * this.hitS; this.hitT = Math.max(0, this.hitT - dt / 0.32); } else j.head.rotation.z = 0;
    this.applyArms(dt, p);
  }


  dip(drop, hip, knee) {
    const j = this.j;
    this.add(j.hips.position, 'y', -drop); this.add(j.legL.position, 'y', -drop); this.add(j.legR.position, 'y', -drop);
    this.add(j.legL.rotation, 'x', hip); this.add(j.legR.rotation, 'x', hip); this.add(j.kneeL.rotation, 'x', -knee); this.add(j.kneeR.rotation, 'x', -knee);
  }

  applyArms(dt, p) {
    const j = this.j; if (!j.arms) return;

    if (p.reloading) this.reloadT = p.reloadProgress != null ? THREE.MathUtils.clamp(p.reloadProgress, 0, 0.999) : (this.reloadT < 0 ? 0 : Math.min(0.999, this.reloadT + dt / this.reloadSec));
    else this.reloadT = -1;
    const r = this.reloadT, reloading = r >= 0, sprinting = this.state === 'SPRINT', seg = (a, b) => THREE.MathUtils.smoothstep(r, a, b);
    const aimTarget = p.dead ? -1.1 : reloading ? -0.22 : sprinting ? -0.72 : p.aiming ? THREE.MathUtils.clamp(p.pitch || 0, -0.95, 0.95) : -0.38;
    const cantTarget = p.dead ? 0.5 : reloading ? 0.36 * seg(0, 0.12) * (1 - seg(0.88, 1)) : sprinting ? 0.32 : 0;
    this.aimX = damp(this.aimX, aimTarget, p.aiming ? 16 : 9, dt); this.cant = damp(this.cant, cantTarget, 10, dt);
    let ax = this.aimX, az = this.cant, pz = 0;
    if (this.equipT < 1) { this.equipT = Math.min(1, this.equipT + dt / 0.5); ax -= 1.15 * Math.sin(Math.PI * this.equipT); }
    if (this.kick > 0) { ax += 0.2 * this.kick; pz += 0.055 * this.kick; this.add(j.hips.rotation, 'x', 0.05 * this.kick); this.kick = Math.max(0, this.kick - dt / 0.14); }

    const gait = GAIT[this.state], phase = this.current ? this.current.time / this.current.getClip().duration * Math.PI * 2 : 0;
    const carry = gait && !reloading && !p.dead ? (p.aiming ? .12 : 1) * gait.amp : 0;
    ax += Math.sin(phase * 2) * .025 * carry;
    az += Math.sin(phase) * .035 * carry;

    j.arms.rotation.set(ax, sprinting ? 0.25 : p.aiming ? -j.hips.rotation.y : 0, az);
    j.arms.position.set(this.armBase.x, this.armBase.y + Math.cos(phase * 2) * .008 * carry, this.armBase.z + pz);

    if (j.armL && j.mag) {
      let la = 0, magY = 0, magVisible = true;
      if (reloading) {
        const reach = seg(0.08, 0.26), pull = seg(0.26, 0.44), bring = seg(0.5, 0.7), seat = seg(0.7, 0.8), back = seg(0.84, 1);
        la = 0.32 * reach - 0.75 * pull + 0.75 * bring - 0.32 * back + 0.1 * Math.sin(seat * Math.PI);
        magY = -0.32 * pull + 0.32 * bring; magVisible = !(r > 0.44 && r < 0.5);
      }
      j.armL.rotation.x = la; j.mag.position.y = this.magBase.y + magY; j.mag.visible = magVisible;
    }
  }

  dispose() { this.mixer.stopAllAction(); this.mixer.uncacheRoot(this.j.root); }
}
