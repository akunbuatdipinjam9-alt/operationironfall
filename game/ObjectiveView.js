 
 
import * as THREE from 'three';
import { buildMinionGeometry, MINION_HIP } from './SiegeMinionModel.js';

const STATE_COLOR = { PUSHING: 0x5ab4ff, CONTESTED: 0xffb547, IDLE: 0x9aa4b1, ROLLBACK: 0xff5a4a, DELIVERED: 0x5ab4ff };
const CSS = `
#if-objective{position:fixed;left:50%;top:86px;transform:translateX(-50%);z-index:21;pointer-events:none;width:min(360px,70vw);font:700 10px 'JetBrains Mono',monospace;letter-spacing:.12em;color:#e6ebf1;display:none}
#if-objective.on{display:block}
#if-objective .ifo-row{display:flex;justify-content:space-between;margin-bottom:4px}
#if-objective .ifo-row span:last-child{color:var(--c,#9aa4b1)}
#if-objective .ifo-track{position:relative;height:6px;background:rgba(15,18,23,.85);border:1px solid rgba(255,255,255,.14);border-radius:2px;overflow:hidden}
#if-objective .ifo-fill{position:absolute;inset:0;transform-origin:left;background:linear-gradient(90deg,#2b6cb0,#5ab4ff);transition:transform .2s linear}
#if-objective .ifo-cp{position:absolute;top:-1px;bottom:-1px;width:2px;background:#FF8A35}
#if-objective.contested .ifo-track{border-color:#ffb547;animation:ifo-pulse .7s ease-in-out infinite alternate}
@keyframes ifo-pulse{to{box-shadow:0 0 10px rgba(255,181,71,.55)}}
#if-siege{position:fixed;left:50%;top:86px;transform:translateX(-50%);z-index:21;pointer-events:none;display:none;align-items:center;gap:12px;padding:5px 12px;background:rgba(15,18,23,.82);border:1px solid rgba(255,255,255,.1);border-radius:6px;font:700 10px 'JetBrains Mono',monospace;letter-spacing:.1em;color:#cfd6df}
#if-siege.on{display:flex}
#if-siege .s-team{display:flex;gap:4px;align-items:center}
#if-siege .s-pip{width:22px;height:8px;border-radius:2px;background:rgba(255,255,255,.12);overflow:hidden;position:relative}
#if-siege .s-pip.core{width:34px}
#if-siege .s-pip i{position:absolute;inset:0;transform-origin:left;background:var(--tc)}
#if-siege .s-pip.down{background:repeating-linear-gradient(45deg,rgba(255,255,255,.08) 0 3px,transparent 3px 6px)}
#if-siege .s-pip.locked i{opacity:.45}
#if-siege .s-wave{color:#FFAD72;min-width:74px;text-align:center}
@media (prefers-reduced-motion:reduce){#if-objective.contested .ifo-track{animation:none}}
`;

export class ObjectiveView {
  constructor(scene, { groundAt = null, selfTeam = () => null, structures = () => null, camera = null } = {}) {
    this.scene = scene; this.groundAt = groundAt; this.selfTeam = selfTeam; this.structuresFn = structures; this.camera = camera; this.cart = null; this.siege = null; this.t = 0;
    if (!document.getElementById('if-objective-style')) { const s = document.createElement('style'); s.id = 'if-objective-style'; s.textContent = CSS; document.head.appendChild(s); }
    this.hud = document.createElement('div'); this.hud.id = 'if-objective'; this.hud.setAttribute('aria-live', 'polite');
    this.hud.innerHTML = '<div class="ifo-row"><span>PAYLOAD</span><span></span></div><div class="ifo-track"><div class="ifo-fill"></div></div>';
    this.hudState = this.hud.querySelector('.ifo-row span:last-child'); this.hudFill = this.hud.querySelector('.ifo-fill'); this.hudTrack = this.hud.querySelector('.ifo-track');
    document.body.appendChild(this.hud);
    this.siegeHud = document.createElement('div'); this.siegeHud.id = 'if-siege'; this.siegeHud.setAttribute('aria-live', 'polite'); document.body.appendChild(this.siegeHud);
  }

   
  buildSiege() {
    const team = { BLUE: 0x2f6fd6, RED: 0xd64235 }, glowHex = { BLUE: 0x6fe3ff, RED: 0xffb03a };
     
    const mats = [], geos = [], CAP = 32, minions = {};
    for (const [k, c] of Object.entries(team)) {
      const g = buildMinionGeometry(c); geos.push(g.body, g.glow, g.leg);
      const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.48, metalness: 0.3 }), gl = new THREE.MeshBasicMaterial({ color: glowHex[k], toneMapped: false }); mats.push(m, gl);
      const parts = [new THREE.InstancedMesh(g.body, m, CAP), new THREE.InstancedMesh(g.glow, gl, CAP), new THREE.InstancedMesh(g.leg, m, CAP * 2)];
      for (const p of parts) { p.count = 0; p.castShadow = true; p.frustumCulled = false; this.scene.add(p); }
      parts[1].castShadow = false; minions[k] = parts;
    }
    const barGeo = new THREE.PlaneGeometry(1, 1), bars = new Map();
    const beamGeo = new THREE.BufferGeometry(); beamGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(16 * 6), 3));
    const beamMat = new THREE.LineBasicMaterial({ vertexColors: false, color: 0xffffff, transparent: true, opacity: 0.9, toneMapped: false });
    const beams = new THREE.LineSegments(beamGeo, beamMat); beams.frustumCulled = false; beams.renderOrder = 7; this.scene.add(beams);
    this.siege = { minions, geos: [...geos, barGeo, beamGeo], mats: [...mats, beamMat], M: new THREE.Matrix4(), L: new THREE.Matrix4(), Q: new THREE.Matrix4(), barGeo, bars, beams, beamLife: new Float32Array(16), beamNext: 0, units: new Map(), tmp: new THREE.Object3D(), team };
  }
  bar(id, color) {
    const S = this.siege; let b = S.bars.get(id); if (b) return b;
    const bgM = new THREE.MeshBasicMaterial({ color: 0x0b0e12, transparent: true, opacity: 0.75, depthTest: false }), fgM = new THREE.MeshBasicMaterial({ color, depthTest: false });
    const g = new THREE.Group(), bg = new THREE.Mesh(S.barGeo, bgM), fg = new THREE.Mesh(S.barGeo, fgM); bg.scale.set(3.2, 0.32, 1); fg.position.z = 0.01; g.add(bg, fg); g.renderOrder = 9; bg.renderOrder = 9; fg.renderOrder = 10;
    this.scene.add(g); S.mats.push(bgM, fgM); b = { g, fg, fgM }; S.bars.set(id, b); return b;
  }
  applySiege(sg) {
    if (!this.siege) this.buildSiege();
    const S = this.siege, built = this.structuresFn?.(), mine = this.selfTeam();
    for (const st of sg.structures) {
      const vis = built?.get(st.id); if (vis) { vis.group.visible = st.alive; vis.rubble.visible = !st.alive; }
      const b = this.bar(st.id, S.team[st.team]); const h = (vis?.height ?? (st.kind === 'core' ? 14 : 8)) + 2.2;
      b.g.position.set(st.x, h, st.z); b.g.visible = st.alive; const f = Math.max(0, st.hp / st.max);
      b.fg.scale.set(3.1 * f, 0.22, 1); b.fg.position.x = -1.55 * (1 - f); b.fgM.color.setHex(st.vulnerable ? S.team[st.team] : 0x7d838c);
    }
    const seen = new Set();
    for (const [id, ti, x, z, , brute] of sg.minions) {
      seen.add(id); let u = S.units.get(id);
      if (!u) { u = { team: ti ? 'RED' : 'BLUE', x, z, tx: x, tz: z, yaw: ti ? 0 : Math.PI, brute: !!brute, phase: Math.random() * 6, move: 0 }; S.units.set(id, u); }
      if (Math.hypot(x - u.tx, z - u.tz) > 0.01) u.yaw = Math.atan2(x - u.tx, z - u.tz);
      u.tx = x; u.tz = z;
    }
    for (const id of [...S.units.keys()]) if (!seen.has(id)) S.units.delete(id);
    const pip = s => `<span class="s-pip ${s.kind === 'core' ? 'core' : ''} ${s.alive ? '' : 'down'} ${s.alive && !s.vulnerable ? 'locked' : ''}" style="--tc:#${S.team[s.team].toString(16).padStart(6, '0')}">${s.alive ? `<i style="transform:scaleX(${(s.hp / s.max).toFixed(3)})"></i>` : ''}</span>`;
    const side = t => sg.structures.filter(s => s.team === t).sort((a, b) => (a.kind === 'core') - (b.kind === 'core')).map(pip).join('');
    const wave = sg.nextWaveMs > 0 ? `WAVE ${sg.wave + 1} · ${Math.ceil(sg.nextWaveMs / 1000)}s` : 'WAVE ' + sg.wave;
    this.siegeHud.innerHTML = `<span class="s-team">${mine === 'BLUE' ? 'YOU ' : ''}${side('BLUE')}</span><span class="s-wave">${wave}</span><span class="s-team">${side('RED')}${mine === 'RED' ? ' YOU' : ''}</span>`;
    this.siegeHud.classList.add('on');
  }
  beam(ev) {
    const S = this.siege; if (!S || !ev.from || !ev.to) return;
    const i = S.beamNext; S.beamNext = (i + 1) % 16; const a = S.beams.geometry.attributes.position;
    a.setXYZ(i * 2, ev.from[0], ev.from[1], ev.from[2]); a.setXYZ(i * 2 + 1, ev.to[0], ev.to[1], ev.to[2]); a.needsUpdate = true;
    S.beamLife[i] = 0.18; S.beams.material.color.setHex(S.team[ev.team] ?? 0xffffff);
  }
  updateSiege(dt) {
    const S = this.siege; if (!S) return;
    const k = 1 - Math.exp(-dt * 8), counts = { BLUE: 0, RED: 0 }, T = S.tmp;
    for (const u of S.units.values()) {
      const px = u.x, pz = u.z; u.x += (u.tx - u.x) * k; u.z += (u.tz - u.z) * k;
      const parts = S.minions[u.team], n = counts[u.team]; if (n >= parts[0].instanceMatrix.count) continue;
       
      const step = Math.hypot(u.x - px, u.z - pz), sc = u.brute ? 1.5 : 1; u.phase += step * 6.5 / sc;
      u.move += ((step / Math.max(dt, 1e-3) > 0.4 ? 1 : 0) - u.move) * Math.min(1, dt * 8);
      const sw = Math.sin(u.phase) * 0.6 * u.move, bob = Math.abs(Math.sin(u.phase)) * 0.045 * u.move * sc;
      const jab = (1 - u.move) * Math.max(0, Math.sin(this.t * 6 + u.x * 3)) * 0.14, lean = 0.06 * u.move + jab;
      T.position.set(u.x, this.ground(u.x, u.z, 0) + bob, u.z); T.rotation.set(0, u.yaw, 0); T.scale.setScalar(sc); T.updateMatrix();
      S.M.copy(T.matrix).multiply(S.Q.makeRotationX(lean)); parts[0].setMatrixAt(n, S.M); parts[1].setMatrixAt(n, S.M);
      for (const side of [-1, 1]) { S.L.makeRotationX(sw * side); S.L.setPosition(side * MINION_HIP.x, MINION_HIP.y, 0); S.M.copy(T.matrix).multiply(S.L); parts[2].setMatrixAt(n * 2 + (side > 0 ? 1 : 0), S.M); }
      counts[u.team]++;
    }
    for (const t of ['BLUE', 'RED']) S.minions[t].forEach((p, i) => { p.count = counts[t] * (i === 2 ? 2 : 1); p.instanceMatrix.needsUpdate = true; });
    if (this.camera) for (const b of S.bars.values()) if (b.g.visible) b.g.quaternion.copy(this.camera.quaternion);
    const a = S.beams.geometry.attributes.position; let any = false;
    for (let i = 0; i < 16; i++) { if (S.beamLife[i] <= 0) continue; S.beamLife[i] -= dt; if (S.beamLife[i] <= 0) { a.setXYZ(i * 2, 0, -99, 0); a.setXYZ(i * 2 + 1, 0, -99, 0); a.needsUpdate = true; } else any = true; }
    S.beams.material.opacity = any ? 0.9 : 0;
  }
  clearSiege() {
    this.siegeHud.classList.remove('on');
    const S = this.siege; if (!S) return; this.siege = null;
    for (const parts of Object.values(S.minions)) for (const p of parts) { p.removeFromParent(); p.dispose(); }
    for (const b of S.bars.values()) b.g.removeFromParent(); S.beams.removeFromParent();
    for (const g of S.geos) g.dispose(); for (const m of S.mats) m.dispose();
    const built = this.structuresFn?.(); if (built) for (const v of built.values()) { v.group.visible = true; v.rubble.visible = false; }
  }

  buildCart(snap) {
    const g = new THREE.Group(); g.name = 'pushcart';
    const steel = new THREE.MeshStandardMaterial({ color: 0x2a3038, metalness: 0.8, roughness: 0.38 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x14181e, metalness: 0.4, roughness: 0.7 });
    const accent = new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.5, roughness: 0.45 });
    const beacon = new THREE.MeshBasicMaterial({ color: 0x9aa4b1, toneMapped: false });
    const add = (geo, mat, x, y, z, rx = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, 0, rz); m.castShadow = true; m.receiveShadow = true; g.add(m); return m; };
    add(new THREE.BoxGeometry(1.5, 0.22, 2.3), steel, 0, 0.42, 0);
    add(new THREE.BoxGeometry(1.56, 0.1, 2.36), accent, 0, 0.56, 0);
    const wheel = new THREE.CylinderGeometry(0.26, 0.26, 0.16, 14);
    for (const [x, z] of [[-0.78, 0.8], [0.78, 0.8], [-0.78, -0.8], [0.78, -0.8]]) add(wheel, dark, x, 0.26, z, 0, Math.PI / 2);
    const body = add(new THREE.CylinderGeometry(0.42, 0.42, 1.5, 16), dark, 0, 1.0, 0, Math.PI / 2);
    for (const z of [-0.45, 0, 0.45]) add(new THREE.CylinderGeometry(0.44, 0.44, 0.08, 16), accent, 0, 1.0, z, Math.PI / 2);
    add(new THREE.SphereGeometry(0.42, 16, 10), dark, 0, 1.0, -0.75).scale.z = 0.6;
    add(new THREE.BoxGeometry(0.12, 0.5, 0.12), steel, 0, 1.55, 0.35);
    const lamp = add(new THREE.SphereGeometry(0.11, 12, 8), beacon, 0, 1.85, 0.35); lamp.castShadow = false;
    const ringMat = new THREE.MeshBasicMaterial({ color: 0x9aa4b1, transparent: true, opacity: 0.4, depthWrite: false, side: THREE.DoubleSide, toneMapped: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(snap.radius - 0.08, snap.radius, 48), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = 0.05; ring.renderOrder = 2;
    const root = new THREE.Group(); root.add(g, ring);
    const pathPts = snap.path.map(p => new THREE.Vector3(p.x, this.ground(p.x, p.z, p.y ?? 0) + 0.06, p.z));
    const pathLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pathPts), new THREE.LineDashedMaterial({ color: 0xf97316, dashSize: 0.6, gapSize: 0.5, transparent: true, opacity: 0.55 }));
    pathLine.computeLineDistances();
    this.scene.add(root, pathLine);
    root.position.set(snap.x, this.ground(snap.x, snap.z, snap.y ?? 0), snap.z);
    this.cart = { root, body: g, ring, ringMat, beacon, lamp, pathLine, mats: [steel, dark, accent, beacon, ringMat, pathLine.material], target: new THREE.Vector3().copy(root.position), heading: snap.heading || 0, state: snap.state };
    const cps = this.hudTrack.querySelectorAll('.ifo-cp'); cps.forEach(c => c.remove());
    for (const cp of snap.checkpoints || []) { const m = document.createElement('i'); m.className = 'ifo-cp'; m.style.left = (cp * 100).toFixed(1) + '%'; this.hudTrack.appendChild(m); }
  }

  ground(x, z, y) { if (!this.groundAt) return y; const h = this.groundAt(x, z, y); return Number.isFinite(h) ? h : y; }

  apply(snapshot) {
    const sg = snapshot && snapshot.status === 'RUNNING' ? snapshot.siege : null;
    if (sg) this.applySiege(sg); else if (this.siege) this.clearSiege();
    const c = snapshot && snapshot.status === 'RUNNING' ? snapshot.cart : null;
    if (!c) { this.clear(); return; }
    if (!this.cart) this.buildCart(c);
    const v = this.cart; v.target.set(c.x, this.ground(c.x, c.z, c.y ?? 0), c.z); v.heading = c.heading || 0; v.state = c.state;
    const col = STATE_COLOR[c.state] ?? 0x9aa4b1; v.beacon.color.setHex(col); v.ringMat.color.setHex(col);
    const pct = Math.round(c.progress * 100), mine = this.selfTeam();
    const label = c.state === 'CONTESTED' ? 'CONTESTED' : c.state === 'PUSHING' ? `PUSHING ×${c.pushers}` : c.state === 'ROLLBACK' ? 'ROLLING BACK' : c.state;
    this.hudState.textContent = `${pct}% · ${label}${mine ? (mine === 'BLUE' ? ' · ATTACK' : ' · DEFEND') : ''}`;
    this.hud.style.setProperty('--c', '#' + col.toString(16).padStart(6, '0'));
    this.hudFill.style.transform = `scaleX(${c.progress.toFixed(4)})`;
    this.hud.classList.add('on'); this.hud.classList.toggle('contested', c.state === 'CONTESTED');
  }

  update(dt) {
    if (!(dt > 0)) return;
    this.t += dt; this.updateSiege(dt);
    const v = this.cart; if (!v) return; const k = 1 - Math.exp(-dt * 6);
    v.root.position.lerp(v.target, k);
    let dy = v.heading - v.body.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); v.body.rotation.y += dy * k;
    const pulse = v.state === 'CONTESTED' ? 0.5 + 0.5 * Math.sin(this.t * 10) : v.state === 'PUSHING' ? 0.85 : 0.6;
    v.ringMat.opacity = 0.18 + pulse * 0.32; v.lamp.scale.setScalar(0.85 + pulse * 0.35);
  }

  clear() {
    this.hud.classList.remove('on', 'contested');
    const v = this.cart; if (!v) return; this.cart = null;
    v.root.removeFromParent(); v.pathLine.removeFromParent();
    v.root.traverse(o => { if (o.geometry) o.geometry.dispose(); }); v.pathLine.geometry.dispose();
    for (const m of v.mats) m.dispose();
  }
  dispose() { this.clear(); this.clearSiege(); this.hud.remove(); this.siegeHud.remove(); }
}
