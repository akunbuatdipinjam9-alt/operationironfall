

import * as THREE from 'three';
import { SLOT_LABEL, MAX_ATTACHMENTS, attachmentById, attachmentKey, optionsFor, slotsFor, applyBuild, ratings, loadBuilds, saveBuilds, setAttachment } from './Gunsmith.js';

const fmt = n => Number(n).toLocaleString('en-US');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export const GUNSMITH_CSS = `
.gs-panel{margin-top:12px;padding-top:10px;border-top:1px solid rgba(148,163,184,.22)}
.gs-head{display:flex;justify-content:space-between;align-items:baseline;font:700 11px/1 ui-monospace,monospace;letter-spacing:.12em;color:#fdba74}
.gs-head small{color:#94a3b8;font-weight:600;letter-spacing:.06em}
.gs-bars{display:grid;grid-template-columns:1fr 1fr;gap:6px 12px;margin:9px 0 4px}
.gs-bar span{display:flex;justify-content:space-between;font:600 9px/1.2 ui-monospace,monospace;color:#94a3b8;letter-spacing:.08em}
.gs-bar span b{color:#e2e8f0}.gs-bar span b.up{color:#4ade80}.gs-bar span b.down{color:#f87171}
.gs-bar i{display:block;position:relative;height:5px;border-radius:3px;background:rgba(148,163,184,.18);margin-top:3px;overflow:hidden}
.gs-bar i u{position:absolute;inset:0 auto 0 0;background:#64748b;border-radius:3px}
.gs-bar i em{position:absolute;top:0;bottom:0;border-radius:3px}
.gs-bar i em.up{background:#4ade80}.gs-bar i em.down{background:#f87171}
.gs-slot{margin-top:9px}
.gs-slot h5{font:700 9px/1 ui-monospace,monospace;letter-spacing:.14em;color:#94a3b8;margin:0 0 5px}
.gs-opts{display:flex;flex-wrap:wrap;gap:5px}
.gs-opt{font:600 10px/1.15 ui-monospace,monospace;padding:6px 8px;border-radius:6px;border:1px solid rgba(148,163,184,.3);background:rgba(15,23,42,.6);color:#cbd5e1;text-align:left;cursor:pointer}
.gs-opt small{display:block;font-weight:500;color:#94a3b8;margin-top:2px}
.gs-opt:hover:not(:disabled){border-color:#fb923c;color:#fff}
.gs-opt.on{border-color:#fb923c;background:rgba(249,115,22,.2);color:#fff}
.gs-opt.locked small{color:#fbbf24}
.gs-opt:disabled{opacity:.45;cursor:default}
.gs-opt:focus-visible{outline:2px solid #fb923c;outline-offset:1px}
.gs-note{font:500 10px/1.35 ui-monospace,monospace;color:#94a3b8;margin-top:8px;min-height:2.7em}
`;

export class GunsmithUI {

  constructor({ ic, catalog, storage = null, toast = () => {}, onChange = () => {} }) {
    this.ic = ic; this.catalog = catalog; this.storage = storage; this.toast = toast; this.onChange = onChange;
    this.builds = loadBuilds(storage, catalog, id => this.owns(id));
    if (typeof document !== 'undefined' && !document.getElementById('gs-css')) { const st = document.createElement('style'); st.id = 'gs-css'; st.textContent = GUNSMITH_CSS; document.head.append(st); }
  }
  owns(id) { return this.ic.ownsUnlock(attachmentKey(id)); }
  buildFor(i) { return this.builds[this.catalog[i]?.name] || {}; }

  statsFor(i) { return applyBuild(this.catalog[i], this.buildFor(i)); }

  netBuilds() { const out = {}; this.catalog.forEach((w, i) => { const b = this.builds[w.name]; if (b && Object.keys(b).length) out[i] = b; }); return out; }

  set(i, slot, id) {
    const w = this.catalog[i]; if (!w) return false;
    const before = JSON.stringify(this.buildFor(i)), next = setAttachment(w, this.buildFor(i), slot, id, x => this.owns(x));
    if (JSON.stringify(next) === before) { if (id) this.toast(`MAX ${MAX_ATTACHMENTS} ATTACHMENTS`); return false; }
    if (Object.keys(next).length) this.builds[w.name] = next; else delete this.builds[w.name];
    saveBuilds(this.storage, this.builds); this.onChange(i); return true;
  }

  toggle(i, id) {
    const a = attachmentById(id), w = this.catalog[i]; if (!a || !w) return;
    if (this.buildFor(i)[a.slot] === id) { this.set(i, a.slot, null); this.toast(`${a.name} REMOVED`); return; }
    if (!this.owns(id)) {
      const r = this.ic.buyUnlock(attachmentKey(id), a.price);
      if (!r.ok) { this.toast(r.reason === 'NOT_ENOUGH_IC' ? `NEED ${fmt(a.price - this.ic.balance)} MORE IC` : 'CANNOT BUY'); return; }
      this.toast(`UNLOCKED — ${a.name} · −${fmt(a.price)} IC`);
    }
    if (this.set(i, a.slot, id)) this.toast(`${a.name} MOUNTED ON ${w.name}`);
  }

  handleClick(e) {
    const b = e.target.closest?.('[data-gsatt]'); if (!b) return false;
    if (!b.disabled) this.toggle(Number(b.dataset.gsw), b.dataset.gsatt);
    return true;
  }

  html(i) {
    const w = this.catalog[i]; if (!w) return '';
    const build = this.buildFor(i), st = applyBuild(w, build), base = ratings(w), now = ratings({ ...w, ...st }, st.gs), count = Object.keys(build).length;
    const bar = (label, key) => { const a = base[key], b = now[key], d = b - a, lo = Math.min(a, b), cls = d > 0 ? 'up' : d < 0 ? 'down' : '';
      return `<div class="gs-bar"><span>${label}<b class="${cls}">${b}${d ? ` (${d > 0 ? '+' : ''}${d})` : ''}</b></span><i><u style="width:${lo}%"></u>${d ? `<em class="${cls}" style="left:${lo}%;width:${Math.abs(d)}%"></em>` : ''}</i></div>`; };
    const slots = slotsFor(w).map(slot => {
      const opts = optionsFor(w, slot).map(a => {
        const on = build[slot] === a.id, owned = this.owns(a.id), full = !on && !build[slot] && count >= MAX_ATTACHMENTS, poor = !owned && this.ic.balance < a.price;
        return `<button type="button" class="gs-opt${on ? ' on' : ''}${owned ? '' : ' locked'}" data-gsatt="${a.id}" data-gsw="${i}" title="${esc(a.note)}" aria-pressed="${on}"${full || poor ? ' disabled' : ''}>${esc(a.name)}<small>${on ? 'MOUNTED' : owned ? 'OWNED' : `${fmt(a.price)} IC`}</small></button>`;
      }).join('');
      return `<div class="gs-slot"><h5>${SLOT_LABEL[slot]}</h5><div class="gs-opts">${opts}</div></div>`;
    }).join('');
    const notes = Object.values(build).map(id => attachmentById(id)).filter(Boolean).map(a => `${a.name}: ${a.note}`).join(' ');
    return `<div class="gs-panel" id="gs-panel"><div class="gs-head">GUNSMITH<small>${count}/${MAX_ATTACHMENTS} ATTACHMENTS</small></div>
      <div class="gs-bars">${bar('ACCURACY', 'accuracy')}${bar('CONTROL', 'control')}${bar('HANDLING', 'handling')}${bar('CAPACITY', 'capacity')}</div>
      ${slots}<p class="gs-note">${esc(notes || 'Attachments change handling only: damage and fire rate stay the same. Bought once, usable on every weapon that fits.')}</p></div>`;
  }
}


const MAT = { metal: null, dark: null, glass: null, beam: null };
function mats() {
  if (!MAT.metal) {
    MAT.metal = new THREE.MeshStandardMaterial({ color: 0x1a1f26, metalness: 0.85, roughness: 0.35 });
    MAT.dark = new THREE.MeshStandardMaterial({ color: 0x0d1014, metalness: 0.4, roughness: 0.7 });
    MAT.glass = new THREE.MeshBasicMaterial({ color: 0xff3b30 });
    MAT.beam = new THREE.MeshBasicMaterial({ color: 0xff2a2a, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  }
  return MAT;
}






export function buildAttachmentMeshes(w, build) {
  const g = new THREE.Group(), m = mats(), L = w.muzzleLength || 0.78, sightY = -(w.adsPos?.y ?? -0.128), pistol = w.category === 'PISTOL';
  g.name = 'gunsmith-attachments'; g.userData.muzzleExtra = 0;
  const add = (geo, mat, x, y, z, rx = 0, rz = 0) => { const mesh = new THREE.Mesh(geo, mat); mesh.position.set(x, y, z); mesh.rotation.set(rx, 0, rz); g.add(mesh); return mesh; };
  const cyl = (r, len, seg = 12) => { const c = new THREE.CylinderGeometry(r, r, len, seg); c.rotateX(Math.PI / 2); return c; };

  const mz = build.muzzle;
  if (mz === 'suppressor') { add(cyl(0.017, 0.15), m.dark, 0, 0.032, -(L + 0.075)); g.userData.muzzleExtra = 0.15; }
  else if (mz === 'compensator' || mz === 'brake' || mz === 'choke') { add(cyl(mz === 'brake' ? 0.016 : 0.014, 0.05, 8), m.metal, 0, 0.032, -(L + 0.025)); g.userData.muzzleExtra = 0.05; }

  const op = build.optic;
  if (op) {
    const z = pistol ? -0.08 : -0.1, big = op === 'acog' || op === 'scope8';

    add(new THREE.BoxGeometry(0.02, 0.05, big ? 0.08 : 0.04), m.metal, 0, sightY - (big ? 0.046 : 0.042), z);
    if (big) { const tube = new THREE.CylinderGeometry(0.02, 0.02, op === 'scope8' ? 0.2 : 0.11, 14, 1, true); tube.rotateX(Math.PI / 2); const t = add(tube, m.dark, 0, sightY, z); t.material = m.dark.clone(); t.material.side = THREE.DoubleSide; }
    else { const ring = new THREE.TorusGeometry(op === 'holo' ? 0.019 : 0.015, 0.0028, 6, op === 'holo' ? 4 : 18); add(ring, m.metal, 0, sightY, z, 0, op === 'holo' ? Math.PI / 4 : 0); }
    add(new THREE.SphereGeometry(0.0011, 6, 6), m.glass, 0, sightY, z);
  }
  const ub = build.underbarrel;
  if (ub === 'vgrip') add(new THREE.CylinderGeometry(0.011, 0.013, 0.07, 8), m.dark, 0, -0.03, -L * 0.52);
  else if (ub === 'agrip') add(new THREE.BoxGeometry(0.02, 0.022, 0.09), m.dark, 0, -0.012, -L * 0.52, 0.35);
  else if (ub === 'bipod') { add(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 6), m.metal, -0.018, -0.045, -L * 0.7, 0.9); add(new THREE.CylinderGeometry(0.004, 0.004, 0.12, 6), m.metal, 0.018, -0.045, -L * 0.7, 0.9); }
  if (build.magazine === 'extmag' && !pistol) add(new THREE.BoxGeometry(0.02, 0.05, 0.03), m.dark, 0, -0.115, -0.11, 0.18);
  if (build.laser) {
    add(new THREE.BoxGeometry(0.014, 0.014, 0.045), m.metal, 0.024, 0.03, -L * 0.62);
    const beam = add(cyl(0.0012, 14, 5), m.beam, 0.024, 0.03, -L * 0.62 - 7.02); beam.name = 'gs-beam'; g.userData.beam = beam;
  }
  g.traverse(o => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; o.frustumCulled = false; } });
  return g;
}
export function disposeAttachmentMeshes(g) { g?.traverse(o => { if (o.isMesh) { o.geometry.dispose(); if (o.material !== MAT.metal && o.material !== MAT.dark && o.material !== MAT.glass && o.material !== MAT.beam) o.material.dispose(); } }); g?.removeFromParent(); }
