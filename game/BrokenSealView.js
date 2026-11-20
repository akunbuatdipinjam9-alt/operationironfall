 
 
 
import * as THREE from 'three';
import { WatcherView } from './Watcher.js';
import { makeOnryo, animateOnryo } from './OnryoModel.js';
import { assembleOperator } from './OperatorModel.js';
import { OperatorAnimator } from './OperatorAnimator.js';
import { characterById } from './Arsenal.js';
import { CUTSCENE_SCRIPT, CINEMATICS, SEAL, scriptLine } from './BrokenSeal.js';
import { buildOtherWorld, LinkPortal, makeChildFigure, openDirection } from './WorldPortals.js';
import { ARENA_MAPS } from '../world/ArenaMaps.js';
import { POCKET_OFFSET, inPocket, pocketDoor, crossed, through, yawDelta } from './BackroomsLink.js';

 
function segHitsBox(ax, az, bx, bz, b) {
  const minX = b.x - b.w / 2 - 0.25, maxX = b.x + b.w / 2 + 0.25, minZ = b.z - b.d / 2 - 0.25, maxZ = b.z + b.d / 2 + 0.25;
  let t0 = 0, t1 = 1; const dx = bx - ax, dz = bz - az;
  for (const [p, q] of [[-dx, ax - minX], [dx, maxX - ax], [-dz, az - minZ], [dz, maxZ - az]]) { if (Math.abs(p) < 1e-9) { if (q < 0) return false; continue; } const r = q / p; if (p < 0) { if (r > t1) return false; if (r > t0) t0 = r; } else { if (r < t0) return false; if (r < t1) t1 = r; } }
  return t0 <= t1;
}
export function clearSpot(L, v, dist = 3.2) {
  const tall = (L.boxes || []).filter(b => (b.y || 0) < 1.6 && (b.y || 0) + b.h > 1.4 && Math.abs(b.x - v.x) < dist + 4 && Math.abs(b.z - v.z) < dist + 4);
  for (const d of [dist, dist * 0.65, dist * 0.4]) for (let k = 0; k < 8; k++) { const a = Math.PI / 4 + k * Math.PI / 4, c = { x: v.x + Math.sin(a) * d, z: v.z + Math.cos(a) * d };
    if (!tall.some(b => segHitsBox(v.x, v.z, c.x, c.z, b))) return { ...c, a }; }
  return { x: v.x + 0.8, z: v.z + 0.8, a: Math.PI / 4 };
}

export const SEEN_OPENING_KEY = 'ironfall.seal.seenOpening.v1';

 
 
export function shotFraming(shot, L, ctx = {}) {
  const R = L.rooms, seal = L.story.seal, post = L.story.watcherPost, realm = L.realm;
  const v = (x, y, z) => ({ x, y, z });
  switch (shot) {
    case 'CORRIDOR': return { from: v(seal.x - 24, 1.7, -36), to: v(seal.x - 2, 1.5, -36), drift: v(6, 0, 0) };  
    case 'TUMBLER': return { from: v(seal.x + 5.5, 1.5, seal.z + 5.5), to: v(seal.x + 2.2, 0.4, seal.z + 1.4), drift: v(-0.6, -0.1, -0.4) };
    case 'DROP': return { from: v(seal.x + 3.6, 0.6, seal.z + 3.4), to: v(seal.x + 2.2, 0.1, seal.z + 1.4), drift: v(-0.2, 0, -0.2) };
    case 'SEAL': return { from: v(seal.x, 6.5, seal.z + 2), to: v(seal.x, 0, seal.z), drift: v(0, -1.2, 0.5) };
    case 'LIGHTS': case 'RITUAL': return { from: v(seal.x - 9, 3.2, seal.z + 9), to: v(seal.x, 1, seal.z), drift: v(1.5, 0, -1), shake: shot === 'RITUAL' };
    case 'ONRYO': return { from: v(seal.x - 5, 1.6, seal.z + 6), to: v(seal.x, 1.4, seal.z), drift: v(1, 0.1, -1), onryo: v(seal.x, 0.45, seal.z) };
    case 'TITLE': case 'MANSION': return { from: v(R.B.x - 14, 4.6, R.B.z + 22), to: v(R.B.x, 2, R.B.z - 6), drift: v(5, 0, 0) };
    case 'MIRROR': return { from: v(R.P.bounds.minX + 2, 1.7, R.P.z), to: v(R.P.bounds.maxX, 2.2, R.P.bounds.minZ + 0.3), drift: v(4, 0, 0), onryo: v(R.P.bounds.maxX - 6, 0.45, R.P.bounds.minZ - 1.4), ghost: true };
    case 'TAKEN': return { from: v(R.B.x, 3.4, R.B.z + 18), to: v(R.B.x, 1.4, R.B.z), drift: v(0, 0.4, -3), flash: true };
    case 'BLUE': { const p = ctx.self || { x: R.A.x, z: R.A.z }; return { from: v(p.x + 4, 2.2, p.z + 5), to: v(p.x, 1.4, p.z), drift: v(-1.5, 0, 0) }; }
    case 'WATCHER': { if (ctx.realm) { const w = { x: realm.portal.x, z: realm.portal.z - 2.2 }; return { from: v(w.x - 5.5, 1.6, w.z + 1.5), to: v(w.x, 1.5, w.z), drift: v(0.5, 0, 0.3), watcher: v(w.x, 0, w.z) }; }
      return { from: v(post.x + 5.5, 1.6, post.z + 1.5), to: v(post.x, 1.5, post.z), drift: v(-0.5, 0, 0.3), watcher: v(post.x, 0, post.z) }; }
    case 'ARENA': { const A = L.story.arena; return { from: v(A.maxX - 2.5, 3.6, A.maxZ - 2.5), to: v(seal.x, 0.8, seal.z), drift: v(-1.2, -0.3, -1.2), onryo: v(seal.x, 0.45, seal.z) }; }
    case 'RIFT': case 'PORTAL': {  
      if (ctx.realm) { const p = realm.portal; return { from: v(p.x - 5, 2, p.z - 7), to: v(p.x, 1.6, p.z), drift: v(0.8, 0.2, 0.5), portal: true, watcher: v(p.x, 0, p.z - 2.2) }; }
      const p = L.story.watcherDoor; return { from: v(p.x + 7, 1.8, p.z + 0.6), to: v(p.x, 1.6, p.z), drift: v(-0.8, 0.2, 0), portal: true, watcher: v(post.x, 0, post.z) }; }
    case 'REALM': return { from: v(realm.x - 22, 6, realm.z + 22), to: v(realm.x, 1.5, realm.z), drift: v(6, -1, 0), shadow: v(realm.boss.x, 0.45, realm.boss.z) };
    default:
      if (shot.startsWith('TAKE:')) {  
        const t = ctx.victim; if (!t) return null; const c = clearSpot(L, t);
        return { from: v(c.x, 1.85, c.z), to: v(t.x, 1.25, t.z), drift: v((t.x - c.x) * 0.12, -0.15, (t.z - c.z) * 0.12), onryo: v(t.x - Math.sin(c.a) * 1.1, 0.45, t.z - Math.cos(c.a) * 1.1), grab: SEAL.grabSec, victim: t }; }
      return null;  
  }
}
export const MEMORY_SHOTS = new Set(['FOREST', 'DESERT', 'POLUS', 'BACKROOMS']);

export function objectiveText(seal, team) {
  if (!seal) return '';
  if (seal.phase === 'OPENING') return 'THE ACCIDENT';
  if (seal.phase === 'NORMAL_WARFARE') return 'ELIMINATE THE ENEMY TEAM';
  if (seal.phase === 'PARANORMAL') return 'SOMETHING IS WRONG WITH THIS HOUSE';
  if (seal.phase === 'AWAKENING') return 'THE RITUAL IS FAILING';
  if (seal.phase === 'ENDING' || seal.phase === 'DONE') return (seal.ending || '').replaceAll('_', ' ');
  const onryoDown = seal.boss?.state === 'DEAD', shadowDown = seal.shadow?.state === 'DEAD';
  if (team === 'RED' && !seal.red.freed) {
    if (seal.portalOpen) return 'STEP INTO THE WATCHER\'S DOOR — GO HOME';
    if (shadowDown) return 'HER SHADOW IS GONE — HOLD ON, BLUE IS STILL FIGHTING ONRYŌ';
    return 'DESTROY THE SHADOW OF ONRYŌ';
  }
  if (seal.portalOpen) return team === 'RED' ? 'YOU ARE HOME — WAIT FOR THE OTHERS' : 'BOTH HALVES ARE GONE — THE WATCHER IS BRINGING RED HOME';
  if (onryoDown) return 'ONRYŌ IS GONE — RED IS STILL FIGHTING HER SHADOW';
  return 'DEFEAT ONRYŌ — THE WATCHER FIGHTS WITH YOU';
}

const fmt = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

const CSS = `
#seal-hud{position:absolute;top:96px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;z-index:7;font-family:'JetBrains Mono',monospace}
#seal-hud[hidden]{display:none}
.seal-obj{padding:6px 14px;background:rgba(14,6,8,.72);border:1px solid rgba(214,64,52,.45);color:#f6dcd6;font:700 11px 'JetBrains Mono',monospace;letter-spacing:1.6px;text-align:center}
.seal-obj b{color:#fca5a5;margin-right:10px}.seal-obj i{font-style:normal;color:#fbbf24;margin-left:10px}
.seal-bar{width:min(460px,72vw);height:7px;background:#1b1316;position:relative;overflow:hidden}.seal-bar>span{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#5ad8ff,#e0f7ff);transition:width .2s}
.seal-boss{width:min(520px,78vw);background:rgba(10,4,6,.78);border:1px solid rgba(239,68,68,.45);padding:6px 10px 8px}
.seal-boss header{display:flex;justify-content:space-between;color:#fee2e2;font:700 11px 'JetBrains Mono',monospace;letter-spacing:1.4px;margin-bottom:5px}
.seal-boss .seal-bar>span{background:linear-gradient(90deg,#7f1d1d,#ef4444)}.seal-boss.shield .seal-bar>span{background:linear-gradient(90deg,#4c1d95,#a78bfa)}
.seal-boss [hidden],.seal-bar[hidden]{display:none!important}
.seal-boss .seal-bhp{color:#fff;font-size:13px;letter-spacing:1px}.seal-boss .seal-bar{height:10px}
.seal-sb{border-color:rgba(120,20,40,.6)}.seal-sb .seal-bar>span{background:linear-gradient(90deg,#1a0508,#7f1d2d)}.seal-boss.mine{box-shadow:0 0 0 1px rgba(255,255,255,.35)}
#seal-cine{position:fixed;inset:0;z-index:70;pointer-events:none}#seal-cine[hidden]{display:none}
body.seal-cine-on #hud-layer,body.seal-cine-on #iron-radar,body.seal-cine-on #seal-hud{visibility:hidden}
#seal-cine .lb{position:absolute;left:0;right:0;height:11vh;background:#000;transition:transform .5s}#seal-cine .lb.t{top:0}#seal-cine .lb.b{bottom:0}
#seal-cine .sub{position:absolute;left:50%;bottom:14vh;transform:translateX(-50%);max-width:min(860px,86vw);text-align:center;color:#f8eee8;font:600 clamp(14px,1.6vw,20px) Inter,sans-serif;text-shadow:0 2px 8px #000;padding:6px 14px;background:rgba(0,0,0,.42);transition:opacity .4s}
#seal-cine .sub:empty{opacity:0}
#seal-cine .title{position:absolute;inset:0;display:grid;place-items:center;color:#f3d8cf;font:700 clamp(30px,6vw,76px) Rajdhani,Inter,sans-serif;letter-spacing:.3em;text-shadow:0 0 30px rgba(200,30,40,.6);opacity:0;transition:opacity .9s}
#seal-cine .title.on{opacity:1}
#seal-cine .card{position:absolute;top:11vh;left:0;right:0;bottom:11vh;opacity:0;transition:opacity .8s;background:#000}#seal-cine .card.on{opacity:1}
#seal-cine .card svg{width:100%;height:100%;filter:sepia(.55) contrast(1.05) brightness(.85)}
#seal-cine .card:after{content:"";position:absolute;inset:0;background:radial-gradient(circle,transparent 45%,rgba(0,0,0,.75));pointer-events:none}
#seal-cine .grain{position:absolute;inset:0;opacity:.08;background:repeating-linear-gradient(0deg,#fff 0 1px,transparent 1px 3px);mix-blend-mode:overlay}
#seal-cine .skip{position:absolute;right:24px;bottom:calc(11vh + 14px);pointer-events:auto;background:rgba(0,0,0,.55);border:1px solid rgba(248,113,113,.6);color:#fecaca;font:700 11px 'JetBrains Mono',monospace;letter-spacing:1.2px;padding:8px 12px;cursor:pointer}
#seal-cine .skip[hidden]{display:none}
#seal-cine .flash{position:absolute;inset:0;background:#7f0d16;opacity:0;transition:opacity .25s}
#seal-cine .tag{position:absolute;left:24px;top:calc(11vh + 12px);color:#fca5a5;font:700 10px 'JetBrains Mono',monospace;letter-spacing:2px;opacity:.85}`;

 
const MEMORY_SVG = {
  FOREST: '<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice"><rect width="320" height="180" fill="#1f2a1c"/><rect y="120" width="320" height="60" fill="#2b2316"/>' + Array.from({ length: 14 }, (_, i) => `<path d="M${i * 24 + 6} 130 L${i * 24 + 18} ${30 + (i * 37) % 40} L${i * 24 + 30} 130Z" fill="#0f160d"/>`).join('') + '<path d="M150 180 Q160 140 168 120" stroke="#3a2f20" stroke-width="10" fill="none"/><ellipse cx="166" cy="150" rx="5" ry="3" fill="#b5a689"/><circle cx="250" cy="40" r="10" fill="#d8d0b8" opacity=".35"/></svg>',
  DESERT: '<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice"><defs><linearGradient id="dsk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b1a2e"/><stop offset="1" stop-color="#5a3a2a"/></linearGradient></defs><rect width="320" height="180" fill="url(#dsk)"/><path d="M0 130 Q80 100 160 128 T320 118 V180 H0Z" fill="#3a2a1c"/><path d="M0 150 Q100 130 200 152 T320 146 V180 H0Z" fill="#2a1f15"/><rect x="226" y="112" width="20" height="14" fill="#151010"/><rect x="230" y="116" width="4" height="4" fill="#e3b45a" opacity=".8"/><circle cx="60" cy="40" r="1.5" fill="#fff"/><circle cx="120" cy="25" r="1" fill="#fff"/><circle cx="280" cy="30" r="1.2" fill="#fff"/></svg>',
  POLUS: '<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice"><rect width="320" height="180" fill="#0d1a24"/><path d="M60 180 L120 60 H200 L260 180Z" fill="#162a38"/><path d="M120 60 H200 V40 H120Z" fill="#0a141c"/>' + Array.from({ length: 6 }, (_, i) => `<rect x="${126 + i * 12}" y="70" width="6" height="40" fill="#5ad8ff" opacity="${0.15 + (i % 3) * 0.1}"/>`).join('') + '<circle cx="160" cy="125" r="16" fill="none" stroke="#a5f3fc" stroke-width="2" opacity=".6"/><circle cx="160" cy="125" r="5" fill="#e0f7ff" opacity=".8"/></svg>',
  BACKROOMS: '<svg viewBox="0 0 320 180" preserveAspectRatio="xMidYMid slice"><rect width="320" height="180" fill="#b79a4c"/><rect y="0" width="320" height="22" fill="#d9d2b4"/>' + Array.from({ length: 5 }, (_, i) => `<rect x="${i * 70 + 10}" y="8" width="34" height="6" fill="#fff6c8"/>`).join('') + '<path d="M0 180 L110 60 H210 L320 180Z" fill="#a88a3e"/><rect x="140" y="60" width="40" height="70" fill="#5a4a20"/><rect x="152" y="96" width="16" height="34" fill="#2a2210"/></svg>',
};

function setOpacity(group, a) { for (const m of group.userData.mats) { m.opacity = m.isPointsMaterial ? 0.18 * a : a; m.depthWrite = a > 0.98; } group.visible = a > 0.01; }

export class BrokenSealView {
  constructor({ scene, layout, doc = document, horror = () => ({ volume: 0.8, reduceFlicker: false, reduceCamera: false, subtitles: true }), audio = null, storage = null, sendSkip = () => {}, serverNow = () => Date.now(), fx = {}, renderer = null, buildWorld = null, mansionObjects = null }) {
    this.mansionObjects = mansionObjects; this.backroomsMix = 0; this.zone = 'MANSION';
    this.fx = fx; this.renderer = renderer; this.buildWorld = buildWorld; this.memory = null; this.scene = scene; this.L = layout; this.doc = doc; this.horror = horror; this.audio = audio; this.storage = storage; this.sendSkip = sendSkip; this.serverNow = serverNow;
    this.root = new THREE.Group(); this.root.name = 'BrokenSeal'; scene.add(this.root); this.t = 0; this.seal = null; this.cine = null; this.team = 'BLUE';
    this.cam = new THREE.PerspectiveCamera(55, 16 / 9, 0.1, 400);
    this.onryo = makeOnryo(); this.root.add(this.onryo); setOpacity(this.onryo, 0);
    this.shadowModel = makeOnryo({ shadow: true }); this.root.add(this.shadowModel); setOpacity(this.shadowModel, 0);
    this.decoys = []; this.walls = []; this.rings = []; this.shades = new Map(); this.frags = new Map();
    const ringGeo = new THREE.RingGeometry(0.92, 1, 48).rotateX(-Math.PI / 2), discGeo = new THREE.CircleGeometry(1, 40).rotateX(-Math.PI / 2);
    this.geo = { ring: ringGeo, disc: discGeo, shard: new THREE.OctahedronGeometry(0.32), beam: new THREE.CylinderGeometry(0.08, 0.35, 8, 10, 1, true), wall: new THREE.BoxGeometry(1, 2.6, 0.25), torus: new THREE.TorusGeometry(1.35, 0.09, 10, 48), shade: new THREE.ConeGeometry(0.45, 1.7, 10, 1, true) };
    this.mat = {
      tele: new THREE.MeshBasicMaterial({ color: 0xff2a3a, transparent: true, opacity: 0.8, depthWrite: false, toneMapped: false }),
      teleFill: new THREE.MeshBasicMaterial({ color: 0x8b0b16, transparent: true, opacity: 0.25, depthWrite: false }),
      wall: new THREE.MeshBasicMaterial({ color: 0x1a0624, transparent: true, opacity: 0.8 }),
      shard: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.3, 2.0, 2.2), toneMapped: false }),
      beam: new THREE.MeshBasicMaterial({ color: 0x7fe8ff, transparent: true, opacity: 0.22, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
      portal: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 1.6, 2.0), toneMapped: false, transparent: true, opacity: 0.9 }),
      portalCore: new THREE.MeshBasicMaterial({ color: 0x0d2a36, transparent: true, opacity: 0.75, side: THREE.DoubleSide, depthWrite: false }),
      shade: new THREE.MeshBasicMaterial({ color: 0x050407, transparent: true, opacity: 0.82, side: THREE.DoubleSide }),
      shadeEye: new THREE.MeshBasicMaterial({ color: 0xff5a5a, toneMapped: false }),
    };
    for (let i = 0; i < 6; i++) { const r = new THREE.Group(), edge = new THREE.Mesh(ringGeo, this.mat.tele), fill = new THREE.Mesh(discGeo, this.mat.teleFill); r.add(fill, edge); r.visible = false; r.userData = { edge, fill, life: 0, dur: 1 }; this.root.add(r); this.rings.push(r); }
    this.portals = [backroomsDoor(this, layout.story.watcherDoor, layout.story.watcherDoor.yaw), backroomsDoor(this, layout.realm.portal, Math.PI)];
    this.sealDoors = sealedDoors(this, layout.story.sealDoors || []);
     
    this.exitB = pocketDoor(); this.doorB = backroomsDoor(this, this.exitB, this.exitB.yaw);
    this.doorB.traverse(o => { if (o.isMesh && o.material?.color && o !== this.doorB.userData.inner) { if (o === this.doorB.userData.glow || o === this.doorB.userData.spill) { o.material = o.material.clone(); o.material.color.setHex(0xffa060); (this.extraMats ||= []).push(o.material); } else if (!o.material.map) { o.material = o.material.clone(); o.material.color.setHex(0x2a170d); (this.extraMats ||= []).push(o.material); } } });
    this.aura = watcherAura(this); this.beam = strikeBeam(this);
     
    this.doorLamp = new THREE.PointLight(0xffe6a0, 0, 9, 2); this.auraLamp = new THREE.PointLight(0xffe6a0, 0, 7, 2); this.root.add(this.doorLamp, this.auraLamp);
    this.watcher = new WatcherView(scene);
    this.mountDom(); this.root.traverse(o => { o.raycast = () => {}; });
  }
   
  mountDom() {
    const d = this.doc, st = d.createElement('style'); st.textContent = CSS; d.head.append(st); this.style = st;
    const hud = d.createElement('div'); hud.id = 'seal-hud'; hud.hidden = true;
    hud.innerHTML = '<div class="seal-obj"><b class="seal-phase"></b><span class="seal-text"></span><i class="seal-time"></i></div><div class="seal-bar seal-prog" hidden><span></span></div><div class="seal-boss" hidden><header><span class="seal-bname">ONRYŌ · MANSION</span><span class="seal-bhp"></span><span class="seal-bphase"></span></header><div class="seal-bar"><span></span></div></div><div class="seal-boss seal-sb" hidden><header><span class="seal-bname">SHADOW OF ONRYŌ · REALM</span><span class="seal-bhp"></span><span class="seal-bphase"></span></header><div class="seal-bar"><span></span></div></div>';
    (d.getElementById('hud-layer') || d.body).append(hud); this.hud = hud;
    const c = d.createElement('div'); c.id = 'seal-cine'; c.hidden = true;
    c.innerHTML = '<div class="card"></div><div class="grain"></div><div class="flash"></div><div class="lb t"></div><div class="lb b"></div><div class="tag"></div><div class="title"></div><div class="sub"></div><button type="button" class="skip" hidden>SKIP ⏭</button>';
    c.querySelector('.skip').addEventListener('click', () => { this.sendSkip(); c.querySelector('.skip').textContent = 'WAITING FOR OTHERS…'; });
    d.body.append(c); this.cineEl = c;
  }
   
  apply(seal, { team = 'BLUE', selfPos = null, selfId = null } = {}) {
    this.selfId = selfId;
    this.seal = seal; this.team = team; this.selfPos = selfPos; if (!seal) { this.hud.hidden = true; return; }
    const h = this.hud; h.hidden = !!seal.cinematic;
    h.querySelector('.seal-phase').textContent = seal.phase === 'DUAL_DIMENSION' ? (team === 'RED' && !seal.red.freed ? 'ONRYŌ REALM' : 'MANSION') : seal.phase.replaceAll('_', ' ');
    h.querySelector('.seal-text').textContent = objectiveText(seal, team);
    h.querySelector('.seal-time').textContent = fmt(seal.timeLeftSec);
    const prog = h.querySelector('.seal-prog'), active = seal.fragments.find(f => f.state === 'ACTIVE' && f.progress > 0);
    const p = seal.seal.active && !seal.seal.restored ? seal.seal.progress : active ? active.progress : -1;
    prog.hidden = p < 0 || (team === 'RED' && !seal.red.freed); if (p >= 0) prog.firstElementChild.style.width = Math.round(p * 100) + '%';
     
    const inRealm = team === 'RED' && !seal.red.freed;
    const bar = (el, b, mine) => { const show = !!b && b.state !== 'DEAD' && seal.phase === 'DUAL_DIMENSION'; el.hidden = !show; if (!show) return;
      el.querySelector('.seal-bar span').style.width = (b.health / b.maxHealth * 100).toFixed(1) + '%'; el.classList.toggle('shield', !!b.shielded); el.classList.toggle('mine', mine);
      el.querySelector('.seal-bhp').textContent = `${Math.ceil(b.health).toLocaleString('en-US')} / ${b.maxHealth.toLocaleString('en-US')}`;
      el.querySelector('.seal-bphase').textContent = `PHASE ${b.phase}/3${b.stunned ? ' · STUNNED' : b.shielded ? ' · SHIELDED' : ''}${b.exposed ? ' · EXPOSED' : ''}`; };
    bar(h.querySelector('.seal-boss'), seal.boss, !inRealm); bar(h.querySelector('.seal-sb'), seal.shadow, inRealm);
    if (seal.cinematic && (!this.cine || this.cine.id !== seal.cinematic.id)) this.startCutscene(seal.cinematic);
    if (!seal.cinematic && this.cine) this.endCutscene();
    if (this.cine && seal.cinematic) { const sk = this.cineEl.querySelector('.skip'); if (!sk.hidden && seal.cinematic.votes) sk.textContent = `SKIP ${seal.cinematic.votes}/${seal.cinematic.needed}`; }
    this.syncWorld(seal);
  }
  syncWorld(seal) {
    const b = seal.boss;
     
    const sims = [b, seal.shadow].filter(x => x && x.state !== 'DEAD'), want = sims.flatMap(x => x.decoys);
    while (this.decoys.length < want.length) { const d = makeOnryo(); this.root.add(d); this.decoys.push(d); }
    this.decoys.forEach((d, i) => { const w = want[i]; if (!w) { setOpacity(d, 0); return; } d.position.set(w.x, 0.45, w.z); setOpacity(d, 0.62); });
     
    const walls = [b, seal.shadow].filter(Boolean).flatMap(x => x.walls);
    while (this.walls.length < walls.length) { const m = new THREE.Mesh(this.geo.wall, this.mat.wall); this.root.add(m); this.walls.push(m); }
    this.walls.forEach((m, i) => { const w = walls[i]; m.visible = !!w; if (!w) return; const len = Math.hypot(w.bx - w.ax, w.bz - w.az); m.position.set((w.ax + w.bx) / 2, 1.3, (w.az + w.bz) / 2); m.scale.set(len, 1, 1); m.rotation.y = -Math.atan2(w.bz - w.az, w.bx - w.ax); });
     
    const ids = new Set(seal.shades.map(s => s.id));
    for (const [id, m] of this.shades) if (!ids.has(id)) { this.root.remove(m); this.shades.delete(id); }
    for (const s of seal.shades) { let m = this.shades.get(s.id); if (!m) { m = new THREE.Group(); const body = new THREE.Mesh(this.geo.shade, this.mat.shade); body.position.y = 0.85; body.rotation.x = Math.PI; m.add(body); for (const x of [-0.08, 0.08]) { const e = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 4), this.mat.shadeEye); e.position.set(x, 1.55, -0.3); m.add(e); } this.root.add(m); this.shades.set(s.id, m); }
      m.userData.to = { x: s.x, z: s.z, yaw: s.yaw }; if (!m.userData.placed) { m.position.set(s.x, 0, s.z); m.userData.placed = true; } }
     
    for (const f of seal.fragments) { let m = this.frags.get(f.id); if (!m) { m = new THREE.Group(); const shard = new THREE.Mesh(this.geo.shard, this.mat.shard), beam = new THREE.Mesh(this.geo.beam, this.mat.beam); shard.position.y = 1.2; beam.position.y = 4; m.add(shard, beam); m.userData.shard = shard; m.position.set(f.x, 0, f.z); this.root.add(m); this.frags.set(f.id, m); }
      m.visible = f.state === 'ACTIVE'; m.userData.progress = f.progress; }
     
    this.portals[0].visible = seal.phase === 'DUAL_DIMENSION' || (seal.phase === 'ENDING' && seal.portalOpen);  
    this.portals[1].visible = !!seal.portalOpen;
    this.sealDoors.visible = !!seal.sealed;
    this.doorB.visible = !!seal.linkOpen;
  }
   
  event(ev) {
    const H = this.horror();
    if (ev.type === 'onryo') { const e = ev.event;
      if (e.type === 'telegraph') { if (e.at) this.ring(e.at.x, e.at.z, e.radius, e.duration); if (e.attack === 'WAIL') this.ring(this.seal?.boss?.x ?? e.x, this.seal?.boss?.z ?? e.z, e.radius || 12, e.duration); if (e.to) this.ring(e.to.x, e.to.z, 1.2, e.duration); this.sfx('whisper', e.duration); }
      else if (e.type === 'strike') this.sfx(e.attack === 'WAIL' ? 'wail' : 'thud');
      else if (e.type === 'phase') this.sfx('wail'); else if (e.type === 'weakened') this.sfx('chime'); else if (e.type === 'defeated') this.sfx('release'); }
    if (ev.type === 'sealObjective' && (ev.state === 'FRAGMENT_TAKEN' || ev.state === 'SEAL_RESTORED')) this.sfx('chime');
    if (ev.type === 'cinematic' && ev.state === 'START') this.sfx('stinger');
     
    if (ev.type === 'cinematic' && ev.state === 'START' && ev.id === 'ABDUCTION') setTimeout(() => this.ensureAnnex(), 1500);
    if (ev.type === 'cinematic' && ev.state === 'START' && (ev.id === 'FINAL_RESCUE' || ev.id === 'END_PARTIAL')) { setTimeout(() => this.ensureJungle(), 1500); setTimeout(() => this.ensureDesert(), 4500); setTimeout(() => this.ensurePolus(), 7500); setTimeout(() => this.ensureBackroomsMemory(), 10500); }
    if (ev.type === 'watcher' && ev.state === 'STRIKE') { const B = this.beam, a = new THREE.Vector3(ev.from.x, 1.55, ev.from.z), c = new THREE.Vector3(ev.to.x, 1.3, ev.to.z), len = a.distanceTo(c);
      B.position.copy(a).add(c).multiplyScalar(0.5); B.scale.set(1, len, 1); B.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), c.clone().sub(a).normalize()); B.userData.life = 0.45; B.visible = true; this.ring(ev.to.x, ev.to.z, 1.6, 0.5); this.sfx('buzz'); }
    if (ev.type === 'sealObjective' && ev.state === 'WATCHER_ALLY') this.sfx('buzz');
    void H;
  }
  ring(x, z, radius, dur) { const r = this.rings.find(q => !q.visible) || this.rings[0]; r.position.set(x, 0.03, z); r.scale.setScalar(Math.max(0.5, radius || 1)); r.userData.life = 0; r.userData.dur = Math.max(0.3, dur || 1); r.visible = true; }
   
  seenOpening() { try { return !!this.storage?.getItem(SEEN_OPENING_KEY); } catch { return false; } }
  startCutscene(c) {
    this.cine = { ...c, shot: null, from: new THREE.Vector3(), to: new THREE.Vector3() };
    const el = this.cineEl; el.hidden = false; this.doc.body?.classList?.add('seal-cine-on'); el.querySelector('.title').classList.remove('on'); el.querySelector('.card').classList.remove('on');
    el.querySelector('.tag').textContent = c.title; const sk = el.querySelector('.skip'); sk.hidden = !(c.skippable && this.seenOpening()); sk.textContent = 'SKIP ⏭';
  }
  endCutscene() {
    if (this.cine?.id === 'OPENING') try { this.storage?.setItem(SEEN_OPENING_KEY, '1'); } catch { }
    this.cine = null; this.memory = null; this.cineEl.hidden = true; this.doc.body?.classList?.remove('seal-cine-on'); setOpacity(this.onryo, 0);
  }
  get locked() { return !!this.cine; }
   
   
  ensureAnnex() {
    if (this.annex !== undefined) return this.annex; this.annex = null;
    if (!this.renderer || !this.buildWorld) return null;
    try {
      const other = buildOtherWorld(this.renderer, (r, sc) => this.buildWorld('ANNEX', sc)), group = new THREE.Group(); group.name = 'BackroomsPocket';
      group.position.set(POCKET_OFFSET.x, 0, POCKET_OFFSET.z);
      for (const o of [...other.scene.children]) { if (o.isMesh && !o.visible) continue; group.add(o); }  
      const lights = [], env = other.scene.environment, envI = other.scene.environmentIntensity ?? 1;
      group.traverse(o => { if (o.isLight) { o.userData.base = o.intensity * (o.isHemisphereLight ? 1.8 : 1); o.intensity = 0; lights.push(o); }  
         
        for (const m of [].concat(o.material || [])) if (m.isMeshStandardMaterial && env && !m.envMap) { m.envMap = env; m.envMapIntensity = envI; m.needsUpdate = true; } });
      group.visible = false; this.scene.add(group);
      const portal = new LinkPortal(this.renderer);
      for (const d of [...this.portals, this.doorB]) { d.userData.fallback = d.userData.inner.material; d.userData.inner.material = portal.material; }
      this.annex = { other, group, lights, fog: other.scene.fog, portal };
    } catch (e) { this.portalError = e?.message || String(e); console.error('[BrokenSeal] Backrooms pocket unavailable:', e); this.annex = null; }
    return this.annex;
  }
   
  setZone(z) {
    const a = this.annex; if (!a) return; const pocket = z === 'BACKROOMS';
    if (!this.mansionShown) this.mansionShown = (this.mansionObjects?.() || []).filter(o => o.visible && !o.isLight);
    for (const o of this.mansionShown) o.visible = !pocket;
    a.group.visible = pocket; for (const l of a.lights) l.intensity = pocket ? l.userData.base : 0;
    if (this.fx) { this.fx.lightScale = pocket ? 0 : 1; this.fx.applyLights?.(); }
    if (pocket) { if (this.scene.fog !== a.fog) { this.mansionFog = this.scene.fog; this.scene.fog = a.fog; } }
    else if (this.mansionFog && this.scene.fog === a.fog) this.scene.fog = this.mansionFog;
    this.zone = z;
  }
  portalStatus() { return { live: !!this.annex, zone: this.zone || 'MANSION', frames: this.portalFrames || 0, error: this.portalError || null, door: this.L.story.watcherDoor, backroomsDoor: this.exitB }; }
   
  renderPortals(camera, dt) {
    if (!camera) return; const cp = camera.getWorldPosition(new THREE.Vector3()), pocket = inPocket(cp);
    const wanted = pocket || this.portals.some(p => p.visible); if (!wanted) { if (this.annex) this.setZone('MANSION'); return; }
    const a = this.ensureAnnex(); if (!a) return;
    if (this.fx) this.fx.lightFocus = pocket ? { x: this.L.story.watcherDoor.x + 3, z: this.L.story.watcherDoor.z } : null;
    a.other.world.updateVegetation?.(new THREE.Vector3(cp.x - POCKET_OFFSET.x, cp.y, cp.z - POCKET_OFFSET.z), dt);
    try {
      if (pocket) {  
        this.setZone('BACKROOMS');
        if (this.doorB.visible) a.portal.render(this.scene, this.doorB, camera, this.L.story.watcherDoor, { before: () => this.setZone('MANSION'), after: () => this.setZone('BACKROOMS') });
      } else {
        this.setZone('MANSION'); let door = null, dd = Infinity;
        for (const p of this.portals) if (p.visible) { const d = p.position.distanceToSquared(cp); if (d < dd) { dd = d; door = p; } }
        if (door && dd < 70 * 70) a.portal.render(this.scene, door, camera, this.exitB, { before: () => this.setZone('BACKROOMS'), after: () => this.setZone('MANSION') });
      }
      this.portalFrames = (this.portalFrames || 0) + 1;
    } catch (e) {
      this.portalError = e?.message || String(e); console.error('[BrokenSeal] portal render failed:', e);
      for (const d of [...this.portals, this.doorB]) if (d.userData.fallback) d.userData.inner.material = d.userData.fallback;
      this.setZone('MANSION'); a.portal.dispose(); this.scene.remove(a.group); a.other.dispose(); this.annex = null;
    }
  }
   
  crossStep(prev, next) {
    if (!this.seal?.linkOpen) return null; const A = this.L.story.watcherDoor, B = this.exitB;
    for (const [from, to] of [[A, B], [B, A]]) if (crossed(from, prev, next)) {
      const q = through(from, to, next); this.lastCross = performance.now(); this.sfx('buzz');
      return { x: q.x, z: q.z, dYaw: yawDelta(from, to), into: to === B ? 'BACKROOMS' : 'MANSION' };
    }
    return null;
  }
   
  updateBackroomsAudio(pos) {
    const A = this.L.story.watcherDoor, B = this.exitB; let mix = 0;
    if (pos && inPocket(pos)) mix = 1 - 0.55 * Math.max(0, 1 - Math.hypot(pos.x - B.x, pos.z - B.z) / 6);
    else if (pos && this.seal?.linkOpen) mix = 0.45 * Math.max(0, 1 - Math.hypot(pos.x - A.x, pos.z - A.z) / 8);
    this.backroomsMix += (mix - this.backroomsMix) * 0.08;
    const ac = this.audio?.ctx, out = this.audio?.masterGain; if (!ac || !out || ac.state !== 'running') return;
    if (!this.hum && this.backroomsMix > 0.01) {  
      const g = ac.createGain(); g.gain.value = 0; g.connect(out); const oscs = [];
      for (const [f, v] of [[60, 0.5], [120, 0.9], [180, 0.35], [240, 0.25]]) { const o = ac.createOscillator(), b = ac.createBiquadFilter(), og = ac.createGain(); o.type = 'sawtooth'; o.frequency.value = f; b.type = 'bandpass'; b.frequency.value = f * 2; b.Q.value = 6; og.gain.value = v * 0.05; o.connect(b); b.connect(og); og.connect(g); o.start(); oscs.push(o); }
      this.hum = { g, oscs };
    }
    if (this.hum) this.hum.g.gain.setTargetAtTime(this.backroomsMix * this.horror().volume, ac.currentTime, 0.15);
  }
  darkFigure(scene, seed = 7) {
    try { const fig = assembleOperator(characterById('vanguard').look, {}), g = new THREE.Group(); g.add(fig.root);
      fig.root.traverse(o => { if (o.userData?.part === 'gun' || o.userData?.part === 'gunPoly') o.visible = false; if (o.isMesh) { o.material = o.material.clone(); o.material.color?.setHex(0x0d0d10); o.material.emissive?.setHex(0x000000); } });
      g.userData = { fig, anim: new OperatorAnimator(fig.joints, { seed }) }; scene.add(g); return g; } catch { return null; }
  }
   
   
  figureOf(scene, seed, paint) {
    try { const fig = assembleOperator(characterById('vanguard').look, {}), g = new THREE.Group(); g.add(fig.root);
      fig.root.traverse(o => { if (o.userData?.part === 'gun' || o.userData?.part === 'gunPoly') o.visible = false; if (o.isMesh) o.material = paint(o.material); });
      const anim = new OperatorAnimator(fig.joints, { seed }); anim.update(0.016, { speed: 0, moveYaw: 0, facingYaw: 0, grounded: true });
      g.userData = { fig, anim }; scene.add(g); return g; } catch { return null; }
  }
  ensurePolus() {
    if (this.polus !== undefined) return this.polus; this.polus = null;
    if (!this.renderer || !this.buildWorld) return null;
    try {
      const other = buildOtherWorld(this.renderer, (r, sc) => this.buildWorld('POLUS03', sc)), W = other.world, sc = other.scene;
      const lab = W.rooms?.find(r => r.name === 'Laboratory'); if (!lab) throw new Error('no Laboratory');
      const table = { x: lab.x - lab.w / 2 + 7.5, z: lab.z - lab.d / 2 + 2 };   
      const lie = (g) => { g.rotation.x = -Math.PI / 2; g.position.set(table.x, 0.97, table.z + 0.9); };
      const body = this.figureOf(sc, 31, m => { const c = m.clone(); c.color?.setHex(0x8d96a0); c.emissive?.setHex(0x000000); return c; }); if (body) lie(body);
      const soulMats = [];
      const soul = this.figureOf(sc, 32, () => { const c = new THREE.MeshBasicMaterial({ color: 0xc8f2ff, transparent: true, opacity: 0, depthWrite: false }); soulMats.push(c); return c; }); if (soul) lie(soul);
      const lights = []; sc.traverse(o => { if (o.isPointLight) { o.userData.base = o.intensity; lights.push(o); } });
      const cam = new THREE.PerspectiveCamera(48, 16 / 9, 0.05, 300);
      this.polus = { other, lab, table, body, soul, soulMats, lights, cam };
    } catch (e) { console.warn('[BrokenSeal] polus memory unavailable:', e?.message); this.polus = null; }
    return this.polus;
  }
  polusFrame(ls, dt) {
    const P = this.ensurePolus(); if (!P) return false;
    const T = P.table, k = Math.min(1, ls / 10), ez = k * k * (3 - 2 * k);
    P.cam.position.set(T.x - 2.4 + ez * 0.8, 2.25 - ez * 0.3, T.z + 5.6 - ez * 2); P.cam.lookAt(T.x, 1.15 + ez * 0.35, T.z - 0.1);
    P.cam.aspect = this.cam.aspect; P.cam.updateProjectionMatrix();
     
    const fl = Math.sin(ls * 23) > 0.6 || Math.random() < 0.05; for (const l of P.lights) l.intensity = l.userData.base * (fl ? 0.25 : 1);
     
    if (P.soul) { const r = THREE.MathUtils.clamp((ls - 3.5) / 4.5, 0, 1), fade = ls < 3.5 ? 0 : ls < 5 ? (ls - 3.5) / 1.5 : Math.max(0, 1 - (ls - 7.5) / 2);
      P.soul.position.y = 0.97 + r * 0.75; P.soul.rotation.x = -Math.PI / 2 * (1 - r * 0.6); P.soul.position.z = P.table.z + 0.9 - r * 0.6;
      for (const m of P.soulMats) m.opacity = 0.42 * fade * (0.8 + 0.2 * Math.sin(ls * 17)); P.soul.visible = fade > 0.01; }
    this.memory = { scene: P.other.scene, cam: P.cam, exposure: P.other.exposure * 0.75 };
    return true;
  }
   
  ensureBackroomsMemory() {
    if (this.brMemory !== undefined) return this.brMemory; this.brMemory = null;
    if (!this.renderer || !this.buildWorld) return null;
    try {
      const other = buildOtherWorld(this.renderer, (r, sc) => this.buildWorld('ANNEX', sc)), W = other.world, sc = other.scene, layout = ARENA_MAPS.ANNEX;
      const sp = W.data?.blue?.[2] || layout.blue?.[2] || { x: 0, z: 0 }, yaw = openDirection(layout, sp, 0.5, 40), dir = { x: Math.sin(yaw), z: Math.cos(yaw) };
      let open = 0; for (; open < 40; open += 0.5) { const x = sp.x + dir.x * open, z = sp.z + dir.z * open; if (layout.boxes.some(b => Math.abs(b.x - x) < b.w / 2 + 0.4 && Math.abs(b.z - z) < b.d / 2 + 0.4)) break; }
      if (sc.fog && 'density' in sc.fog) sc.fog.density *= 0.45;    
      const far = Math.max(6, Math.min(open - 1.5, 13)), figure = this.darkFigure(sc, 23);
      if (figure) { figure.position.set(sp.x + dir.x * far, 0, sp.z + dir.z * far); figure.rotation.y = Math.atan2(dir.x, dir.z); figure.userData.anim.update(0.016, { speed: 0, moveYaw: 0, facingYaw: 0, grounded: true }); }
      const lights = []; sc.traverse(o => { if (o.isLight && !o.isHemisphereLight) { o.userData.base = o.intensity; lights.push(o); } });
      const cam = new THREE.PerspectiveCamera(55, 16 / 9, 0.05, 200);
      this.brMemory = { other, sp, dir, far, figure, lights, cam };
    } catch (e) { console.warn('[BrokenSeal] backrooms memory unavailable:', e?.message); this.brMemory = null; }
    return this.brMemory;
  }
  backroomsFrame(ls, dt) {
    const B = this.ensureBackroomsMemory(); if (!B) return false;
    const d = Math.min(ls * 0.6, B.far - 5), bob = Math.sin(ls * 5.2) * 0.025;
    B.cam.position.set(B.sp.x + B.dir.x * d, 1.62 + bob, B.sp.z + B.dir.z * d); B.cam.lookAt(B.sp.x + B.dir.x * (d + 10), 1.5, B.sp.z + B.dir.z * (d + 10));
    B.cam.aspect = this.cam.aspect; B.cam.updateProjectionMatrix();
    const out = ls > 5 && ls < 5.6 || Math.random() < 0.03; for (const l of B.lights) l.intensity = l.userData.base * (out ? 0.08 : 1);
    if (B.figure) B.figure.visible = ls < 5.3 || (ls < 6 && Math.random() < 0.3);    
    this.memory = { scene: B.other.scene, cam: B.cam, exposure: B.other.exposure };
    return true;
  }
  previewMemory(shot, sec = 10) { const s = String(shot || '').toUpperCase(); if (!MEMORY_SHOTS.has(s)) return 'Use FOREST, DESERT, POLUS or BACKROOMS'; this.devMemory = { shot: s, t0: this.serverNow(), sec }; return `Playing ${s} memory for ${sec}s`; }
  ensureDesert() {
    if (this.desert !== undefined) return this.desert; this.desert = null;
    if (!this.renderer || !this.buildWorld) return null;
    try {
      const other = buildOtherWorld(this.renderer, (r, sc) => this.buildWorld('DESERT', sc)), W = other.world, sp = W.data?.red?.[0] || W.data?.blue?.[0] || { x: 0, z: 0 }, sc = other.scene;
       
      sc.background = new THREE.Color(0x05070d); if (sc.fog) { sc.fog.color = new THREE.Color(0x0a0f1c); if ('density' in sc.fog) sc.fog.density *= 1.6; }
      sc.environmentIntensity = 0.12;
      sc.traverse(o => { if (o.isDirectionalLight) { o.color.setHex(0x8fa6d8); o.intensity *= 0.18; } if (o.isHemisphereLight) { o.color.setHex(0x1c2640); o.groundColor.setHex(0x0b0906); o.intensity *= 0.35; } });
      const runner = this.darkFigure(sc, 11);
      const sirenMat = [0xff2a2a, 0x2a5aff].map(c => new THREE.SpriteMaterial({ color: c, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false })), sirens = sirenMat.map(m => { const s = new THREE.Sprite(m); s.scale.setScalar(4.5); sc.add(s); return s; });
      const cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 600);
      this.desert = { other, runner, sirens, sirenMat, cam, sp, y0: W.heightAt?.(sp.x, sp.z) || 0 };
    } catch (e) { console.warn('[BrokenSeal] desert memory unavailable:', e?.message); this.desert = null; }
    return this.desert;
  }
  desertFrame(ls, dt) {
    const D = this.ensureDesert(); if (!D) return false;
    const W = D.other.world, h = (x, z) => W.heightAt?.(x, z) ?? D.y0, dir = { x: Math.sin(-0.6), z: Math.cos(-0.6) }, side = { x: dir.z, z: -dir.x };
    const d = ls * 1.5, x = D.sp.x + dir.x * d, z = D.sp.z + dir.z * d;
    if (D.runner) { D.runner.position.set(x, h(x, z), z); D.runner.rotation.y = Math.atan2(-dir.x, -dir.z); D.runner.userData.anim.update(dt, { speed: 1.5, crouch: true, moveYaw: 0, facingYaw: 0, grounded: true }); }
     
    D.sirens.forEach((s, i) => { const bx = D.sp.x - dir.x * 40 + side.x * (i ? 3 : -3), bz = D.sp.z - dir.z * 40 + side.z * (i ? 3 : -3); s.position.set(bx, h(bx, bz) + 1.6, bz); D.sirenMat[i].opacity = (Math.sin(ls * 9 + i * Math.PI) > 0 ? 0.95 : 0.15); });
    const cx = x - dir.x * 7 + side.x * 2.5, cz = z - dir.z * 7 + side.z * 2.5;
    D.cam.position.set(cx, h(cx, cz) + 2.2, cz); D.cam.lookAt(x + dir.x * 4, h(x, z) + 1.1, z + dir.z * 4); D.cam.aspect = this.cam.aspect; D.cam.updateProjectionMatrix();
    W.updateVegetation?.(D.cam.position, dt, 1);
    this.memory = { scene: D.other.scene, cam: D.cam, exposure: D.other.exposure * 0.85 };
    return true;
  }
  ensureJungle() {
    if (this.jungle !== undefined) return this.jungle; this.jungle = null;
    if (!this.renderer || !this.buildWorld) return null;
    try {
      const other = buildOtherWorld(this.renderer, (r, sc) => this.buildWorld('JUNGLE', sc)), W = other.world, sp = W.data?.blue?.[0] || { x: 0, z: 0 }, y0 = W.heightAt?.(sp.x, sp.z) || 0;
      const child = makeChildFigure(); child.position.set(sp.x, y0, sp.z); child.rotation.y = 0.4; other.scene.add(child);
      const runner = this.darkFigure(other.scene, 7);
      const cam = new THREE.PerspectiveCamera(50, 16 / 9, 0.05, 400);
      this.jungle = { other, child, runner, cam, sp, y0 };
    } catch (e) { console.warn('[BrokenSeal] jungle memory unavailable:', e?.message); this.jungle = null; }
    return this.jungle;
  }
   
  forestFrame(ls, dt) {
    const J = this.ensureJungle(); if (!J) { this.memory = null; return false; }
    const W = J.other.world, h = (x, z) => W.heightAt?.(x, z) ?? J.y0, dir = { x: Math.sin(0.4), z: Math.cos(0.4) }, side = { x: dir.z, z: -dir.x };
    if (J.runner) { const d = 2 + ls * 3.2, x = J.sp.x + dir.x * d + side.x * Math.sin(ls * 0.8) * 0.6, z = J.sp.z + dir.z * d + side.z * Math.sin(ls * 0.8) * 0.6;
      J.runner.position.set(x, h(x, z), z); J.runner.rotation.y = Math.atan2(-dir.x, -dir.z); J.runner.visible = d < 40;
      J.runner.userData.anim.update(dt, { speed: 4.6, moveYaw: 0, facingYaw: 0, grounded: true }); }
    const back = 3.6 - Math.min(1, ls / 10) * 0.8, cx = J.sp.x - dir.x * back + side.x * 1.2, cz = J.sp.z - dir.z * back + side.z * 1.2;
    J.cam.position.set(cx, h(cx, cz) + 0.95, cz); J.cam.lookAt(J.sp.x + dir.x * 7, J.y0 + 0.7, J.sp.z + dir.z * 7);
    J.cam.aspect = this.cam.aspect; J.cam.updateProjectionMatrix();
    W.updateVegetation?.(J.cam.position, dt, 1);
    this.memory = { scene: J.other.scene, cam: J.cam, exposure: J.other.exposure * 0.7 };
    return true;
  }
   
  ensureActor() {
    if (this.actor !== undefined) return this.actor;
    try {
      const fig = assembleOperator(characterById('vanguard').look, { team: 'RED' }), g = new THREE.Group(); g.add(fig.root);
      fig.root.traverse(o => { if (o.userData?.part === 'gun' || o.userData?.part === 'gunPoly') o.visible = false; o.raycast = () => {}; });
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.04, 0.16, 12), new THREE.MeshStandardMaterial({ color: 0x8a949e, roughness: 0.3, metalness: 0.8 }));
      cup.position.set(0.16, 1.02, -0.4); g.add(cup);
      g.userData = { fig, cup, anim: new OperatorAnimator(fig.joints, { seed: 3 }) }; g.visible = false; this.root.add(g); this.actor = g;
    } catch { this.actor = null; }
    return this.actor;
  }
  actorShow(on) { const a = on ? this.ensureActor() : this.actor; if (a) a.visible = !!on; }
  actorPlace(x, z, yaw, speed, dt, cup = true) {
    const a = this.actor; if (!a) return; a.position.set(x, 0, z); a.rotation.y = yaw; a.userData.cup.visible = cup;
    a.userData.anim.update(dt, { speed, moveYaw: 0, facingYaw: 0, grounded: true });
  }
  openingFrame(sec, dt) {
    const T = this.L.decor?.find(d => d.kind === 'tumbler') || { x: this.L.story.seal.x + 2.2, z: this.L.story.seal.z + 1.4 }, S = this.L.story.seal, fx = this.fx || {};
    const lerp = (a, b, k) => a + (b - a) * Math.max(0, Math.min(1, k)), face = (dx, dz) => Math.atan2(-dx, -dz);
    this.actorShow(sec < 25);
    if (sec < 6) { const x = lerp(S.x - 17, S.x - 6, sec / 6); this.actorPlace(x, -36, face(1, 0), 1.8, dt); }
    else if (sec < 10) { const k = (sec - 6) / 4, x = lerp(T.x + 3.5, T.x + 0.7, k), z = lerp(T.z + 4.6, T.z + 1.0, k); this.actorPlace(x, z, face(T.x + 0.7 - (T.x + 3.5), T.z + 1.0 - (T.z + 4.6)), 1.6, dt); }
    else this.actorPlace(T.x + 0.7, T.z + 1.0, face(S.x - T.x, S.z - T.z), 0, dt, sec < 10.4);
     
    const tm = fx.tumbler, sp = fx.spill;
    if (tm) { tm.userData.rest ||= { p: tm.position.clone(), r: tm.rotation.clone() }; const R = tm.userData.rest;
      if (sec < 10.4) tm.visible = false;
      else { tm.visible = true; const k = Math.min(1, (sec - 10.4) / 0.5); tm.position.set(lerp(T.x + 0.6, R.p.x, k), lerp(1.02, R.p.y, k * k), lerp(T.z + 0.8, R.p.z, k)); tm.rotation.set(R.r.x * k, R.r.y, R.r.z * k); } }
    if (sp) { sp.userData.base ||= sp.scale.clone(); const B = sp.userData.base, k = sec < 10.9 ? 0 : Math.min(1, (sec - 10.9) / 6); sp.visible = k > 0; sp.scale.set(Math.max(0.02, B.x * k), B.y, Math.max(0.02, B.z * k)); }
    fx.sealPulse = sec > 13 && sec < 19.5 && !this.horror().reduceFlicker ? (Math.sin(sec * 23) > 0.2 ? 0.5 : 0) * Math.min(1, (sec - 13) / 2) : sec > 13 && sec < 19.5 ? 0.25 : 0;
    this.propsResting = false;
  }
   
  restProps() {
    if (this.propsResting) return; this.propsResting = true; const fx = this.fx || {}; this.actorShow(false); fx.sealPulse = 0;
    if (fx.tumbler) { fx.tumbler.visible = true; const R = fx.tumbler.userData.rest; if (R) { fx.tumbler.position.copy(R.p); fx.tumbler.rotation.copy(R.r); } }
    if (fx.spill) { fx.spill.visible = true; if (fx.spill.userData.base) fx.spill.scale.copy(fx.spill.userData.base); }
  }
  cutsceneFrame(dt) {
    const c = this.cine; if (!c) return;
    const H = this.horror(), sec = Math.max(0, (this.serverNow() - c.startedAt) / 1000), line = scriptLine(c.id, sec, c.victims), el = this.cineEl;
    const sub = el.querySelector('.sub'), text = line?.shot === 'TITLE' ? '' : (line?.text || '');
    sub.textContent = H.subtitles ? text : ''; el.querySelector('.title').textContent = line?.shot === 'TITLE' ? line.text : c.title;
    el.querySelector('.title').classList.toggle('on', line?.shot === 'TITLE' || sec < 2.2);
    const memory = line && MEMORY_SHOTS.has(line.shot), card = el.querySelector('.card');
    if (memory && card.dataset.shot !== line.shot) { card.innerHTML = MEMORY_SVG[line.shot]; card.dataset.shot = line.shot; }
    const forest3D = (line?.shot === 'FOREST' && this.forestFrame(sec - line.at, dt)) || (line?.shot === 'DESERT' && this.desertFrame(sec - line.at, dt)) || (line?.shot === 'POLUS' && this.polusFrame(sec - line.at, dt)) || (line?.shot === 'BACKROOMS' && this.backroomsFrame(sec - line.at, dt));
    if (!forest3D) this.memory = null;
    card.classList.toggle('on', !!memory && !forest3D);
    const realm = (this.team === 'RED' && !this.seal?.red?.freed) || c.id === 'FINAL_RESCUE' && sec < 13;
    const victim = line?.shot?.startsWith('TAKE:') ? c.victims?.[+line.shot.slice(5)] : null;
    const f = line && !memory ? shotFraming(line.shot, this.L, { self: this.selfPos, victim, realm: realm && (line.shot === 'WATCHER' || line.shot === 'PORTAL') }) : null;
    if (c.id === 'OPENING') this.openingFrame(sec, dt); else this.actorShow(false);
    if (f) {
      const k = Math.min(1, (sec - line.at) / 8), shake = f.shake && !H.reduceCamera ? 0.06 : 0;
      this.cam.position.set(f.from.x + f.drift.x * k + (Math.random() - 0.5) * shake, f.from.y + f.drift.y * k + (Math.random() - 0.5) * shake, f.from.z + f.drift.z * k);
      this.cam.lookAt(f.to.x, f.to.y, f.to.z);
      const showOnryo = !!f.onryo || (c.id === 'OPENING' && line.shot === 'LIGHTS');
      const ls = sec - line.at, gone = f.grab && ls > f.grab + 0.4;
      if (showOnryo && !gone) { const p = f.onryo || { x: this.L.story.seal.x + 3, y: 0.45, z: this.L.story.seal.z - 3 }; this.onryo.position.set(p.x, p.y, p.z); if (f.victim) this.onryo.lookAt(f.victim.x, p.y, f.victim.z); setOpacity(this.onryo, f.ghost ? 0.35 : Math.min(1, ls / (f.grab ? 1.2 : 2))); } else setOpacity(this.onryo, 0);
      if (f.shadow) { this.shadowModel.position.set(f.shadow.x, f.shadow.y, f.shadow.z); setOpacity(this.shadowModel, Math.min(0.95, ls / 2)); } else setOpacity(this.shadowModel, 0);
       
      if (f.victim && f.victim.id === this.selfId) { this.actorShow(!gone && ls < f.grab); this.actorPlace(f.victim.x, f.victim.z, Math.atan2(-(f.from.x - f.victim.x), -(f.from.z - f.victim.z)), 0, dt, false); }
      const flash = f.grab ? Math.max(0, 0.75 - Math.abs(ls - f.grab) * 1.6) : f.flash ? Math.max(0, 0.55 - ls * 0.4) : 0;
      el.querySelector('.flash').style.opacity = !H.reduceFlicker || f.grab ? String(H.reduceFlicker ? flash * 0.4 : flash) : '0';
      if (f.grab && ls >= f.grab && !this.grabbed?.has(line.shot)) { (this.grabbed ||= new Set()).add(line.shot); this.sfx('thud'); }
      this.cineWatcher = f.watcher || null;
      if (c.id === 'ALLIANCE' && line.shot === 'PORTAL') {  
        const k2 = Math.max(0, Math.min(1, (sec - line.at - 1.5) / 3)), d0 = this.L.story.watcherDoor, d1 = this.L.story.watcherPost;
        this.cineWatcher = k2 > 0 ? { x: d0.x + (d1.x - d0.x) * k2, z: d0.z + (d1.z - d0.z) * k2 } : null; }
    }
  }
  sfx(kind, dur = 1) {
    const a = this.audio?.ctx, out = this.audio?.masterGain; if (!a || !out || a.state !== 'running') return;
    const vol = this.horror().volume * 0.5; if (vol <= 0) return; const t = a.currentTime, g = a.createGain(); g.connect(out);
    const osc = (type, f0, f1, d, v) => { const o = a.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + d); const og = a.createGain(); og.gain.setValueAtTime(0.0001, t); og.gain.exponentialRampToValueAtTime(v * vol, t + Math.min(0.08, d / 4)); og.gain.exponentialRampToValueAtTime(0.0001, t + d); o.connect(og).connect(g); o.start(t); o.stop(t + d + 0.05); };
    const noise = (freq, d, v, q = 1) => { const n = a.createBufferSource(), len = Math.ceil(a.sampleRate * d), buf = a.createBuffer(1, len, a.sampleRate), ch = buf.getChannelData(0); for (let i = 0; i < len; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / len); n.buffer = buf; const f = a.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; const ng = a.createGain(); ng.gain.value = v * vol; n.connect(f).connect(ng).connect(g); n.start(t); };
    if (kind === 'stinger') { osc('sine', 70, 38, 2.4, 0.5); noise(300, 1.8, 0.25, 0.6); }
    if (kind === 'whisper') noise(1800, Math.min(2.5, dur + 0.4), 0.18, 4);
    if (kind === 'wail') { osc('sawtooth', 620, 180, 2.2, 0.08); osc('sine', 480, 140, 2.2, 0.2); }
    if (kind === 'thud') { osc('sine', 90, 40, 0.5, 0.6); noise(140, 0.4, 0.3); }
    if (kind === 'chime') { [660, 880, 1320].forEach((f, i) => { const o = a.createOscillator(), og = a.createGain(); o.type = 'triangle'; o.frequency.value = f; og.gain.setValueAtTime(0.0001, t + i * 0.09); og.gain.exponentialRampToValueAtTime(0.18 * vol, t + i * 0.09 + 0.02); og.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.09 + 0.9); o.connect(og).connect(g); o.start(t + i * 0.09); o.stop(t + i * 0.09 + 1); }); }
    if (kind === 'buzz') { osc('sawtooth', 118, 122, 0.6, 0.06); osc('square', 236, 240, 0.4, 0.03); }
    if (kind === 'release') { osc('sine', 220, 660, 2.5, 0.25); noise(900, 2.5, 0.12, 0.5); }
  }
   
  update(dt, cam) {
    this.t += dt; const t = this.t, seal = this.seal, H = this.horror();
    for (const r of this.rings) if (r.visible) { r.userData.life += dt; const k = r.userData.life / r.userData.dur; r.userData.fill.scale.setScalar(Math.min(1, k)); this.mat.tele.opacity = 0.5 + 0.4 * Math.sin(t * 14); if (k > 1.25) r.visible = false; }
    const b = seal?.boss;
    if (!this.cine) { if (b && b.state !== 'DEAD') { const p = this.onryo.position; if (Math.hypot(b.x - p.x, b.z - p.z) > 4) { p.x = b.x; p.z = b.z; } p.x += (b.x - p.x) * Math.min(1, dt * 8); p.z += (b.z - p.z) * Math.min(1, dt * 8); p.y = b.y + Math.sin(t * 1.3) * 0.08; this.onryo.rotation.y = b.yaw + Math.PI; setOpacity(this.onryo, b.stunned ? 0.55 + 0.2 * Math.sin(t * 20) : 1); } else setOpacity(this.onryo, 0); }
    const S = seal?.shadow;
    if (!this.cine) { if (S && S.state !== 'DEAD') { const p = this.shadowModel.position; if (Math.hypot(S.x - p.x, S.z - p.z) > 4) { p.x = S.x; p.z = S.z; } p.x += (S.x - p.x) * Math.min(1, dt * 8); p.z += (S.z - p.z) * Math.min(1, dt * 8); p.y = S.y + Math.sin(t * 1.1) * 0.08; this.shadowModel.rotation.y = S.yaw + Math.PI; setOpacity(this.shadowModel, S.stunned ? 0.5 : 0.95); } else setOpacity(this.shadowModel, 0); }
     
    const eyeAt = this.cine ? this.cam.position : cam, rm = !!(H.reduceCamera);
    animateOnryo(this.onryo, t, dt, { viewer: eyeAt, attacking: b?.state === 'TELEGRAPH' || (this.cine && this.cine.id === 'ABDUCTION'), stunned: !!b?.stunned, reduceMotion: rm });
    animateOnryo(this.shadowModel, t + 3, dt, { viewer: eyeAt, attacking: S?.state === 'TELEGRAPH', stunned: !!S?.stunned, reduceMotion: rm });
    for (const d of this.decoys) animateOnryo(d, t + d.position.x, dt, { viewer: eyeAt, reduceMotion: rm });
    if (!this.cine || this.cine.id !== 'OPENING') this.restProps();
    const sw = this.onryo.userData.strands; sw.rotation.z = Math.sin(t * 0.9) * 0.05; sw.rotation.x = Math.sin(t * 0.7) * 0.04; this.onryo.userData.mist.rotation.y = t * 0.3;
    for (const d of this.decoys) if (d.visible) d.rotation.y = this.onryo.rotation.y + Math.sin(t * 2 + d.position.x) * 0.1;
    for (const m of this.shades.values()) { const to = m.userData.to; m.position.x += (to.x - m.position.x) * Math.min(1, dt * 6); m.position.z += (to.z - m.position.z) * Math.min(1, dt * 6); m.position.y = 0.15 + Math.sin(t * 2 + m.position.x) * 0.08; m.rotation.y = (to.yaw || 0) + Math.PI; }
    for (const m of this.frags.values()) if (m.visible) { m.userData.shard.rotation.y = t * 1.5; m.userData.shard.position.y = 1.2 + Math.sin(t * 2) * 0.12; m.userData.shard.scale.setScalar(1 + (m.userData.progress || 0) * 0.6); }
     
    const buzz = (H.reduceFlicker ? 1 : (Math.sin(t * 50) > 0.97 || (t % 7.3) < 0.08 ? 0.55 : 1)) * (0.94 + 0.06 * Math.sin(t * 120));
    let door = null, dd = Infinity; const eye = this.cine ? this.cam.position : cam;
    for (const p of this.portals) if (p.visible) { const im = p.userData.inner.material; if (im.uniforms) im.uniforms.gain.value = 1.15 * buzz; else im.color.setScalar(1.15 * buzz); p.userData.glow.material.opacity = (this.annex ? 0.06 : 0.32) * buzz;  
      const d = eye ? (p.position.x - eye.x) ** 2 + (p.position.z - eye.z) ** 2 : 0; if (d < dd) { dd = d; door = p; } }
    this.doorLamp.intensity = door ? 6 * buzz : 0; if (door) this.doorLamp.position.set(door.userData.front.x, 2.4, door.userData.front.z);
    if (this.beam.visible) { this.beam.userData.life -= dt; this.beam.material.opacity = Math.max(0, this.beam.userData.life / 0.45) * 0.9; if (this.beam.userData.life <= 0) this.beam.visible = false; }
     
    const w = this.cine ? this.cineWatcher : seal && seal.phase === 'DUAL_DIMENSION' && seal.watcher.state !== 'HIDDEN' ? seal.watcher : null;
    const viewer = this.cine ? this.cam.position : cam;
    this.watcher.update({ visible: !!w, pos: w ? { x: w.x, z: w.z } : null, opacity: w ? 1 : 0 }, { x: viewer?.x ?? 0, z: viewer?.z ?? 0 }, dt);
     
    const A = this.aura; A.visible = !!w; this.auraLamp.intensity = w ? 7 * buzz : 0; if (w) { A.position.set(w.x, 0, w.z); this.auraLamp.position.set(w.x, 2.7, w.z); A.userData.dust.rotation.y = t * 0.15; }
    if (this.cine) this.cutsceneFrame(dt);
     
    if (this.devMemory && !this.cine) { const D = this.devMemory, ls = (this.serverNow() - D.t0) / 1000, fn = { FOREST: 'forestFrame', DESERT: 'desertFrame', POLUS: 'polusFrame', BACKROOMS: 'backroomsFrame' }[D.shot];
      if (ls > D.sec || !fn || !this[fn](ls, dt)) { this.devMemory = null; this.memory = null; } }
    this.updateBackroomsAudio(this.cine ? this.cam.position : cam);
    void H;
  }
  resize(w, h) { const a = w / Math.max(1, h); if (Math.abs(a - this.cam.aspect) > 0.002) { this.cam.aspect = a; this.cam.updateProjectionMatrix(); } }
  dispose() {
    this.doc.body?.classList?.remove('seal-cine-on');
    this.watcher.dispose(); this.scene.remove(this.root);
    this.root.traverse(o => { o.geometry?.dispose?.(); });
    for (const m of Object.values(this.mat)) m.dispose(); for (const g of Object.values(this.geo)) g.dispose();
    for (const d of [this.onryo, this.shadowModel, ...this.decoys]) for (const m of d.userData.mats) m.dispose();
    this.memory = null;
    if (this.annex) { this.setZone('MANSION'); for (const d of [...this.portals, this.doorB]) if (d.userData.fallback) { d.userData.inner.material = d.userData.fallback; } this.annex.portal.dispose(); this.scene.remove(this.annex.group); this.annex.other.dispose(); }
    if (this.fx) { this.fx.lightFocus = null; this.fx.lightScale = 1; this.fx.applyLights?.(); }
    if (this.hum) { for (const o of this.hum.oscs) try { o.stop(); } catch { } this.hum.g.disconnect(); this.hum = null; }
    if (this.desert) { this.desert.runner?.userData.anim.dispose(); this.desert.runner?.userData.fig.dispose?.(); this.desert.sirenMat.forEach(m => m.dispose()); this.desert.other.dispose(); }
    if (this.jungle) { this.jungle.runner?.userData.anim.dispose(); this.jungle.runner?.userData.fig.dispose?.(); this.jungle.other.dispose(); }
    if (this.polus) { for (const f of [this.polus.body, this.polus.soul]) { f?.userData.anim.dispose(); f?.userData.fig.dispose?.(); } this.polus.soulMats.forEach(m => m.dispose()); this.polus.other.dispose(); }
    if (this.brMemory) { this.brMemory.figure?.userData.anim.dispose(); this.brMemory.figure?.userData.fig.dispose?.(); this.brMemory.other.dispose(); }
    this.restProps(); if (this.actor) { this.actor.userData.anim.dispose(); this.actor.userData.fig.dispose?.(); }
    for (const m of this.extraMats || []) m.dispose(); for (const t of this.extraTex || []) t.dispose();
    this.hud.remove(); this.cineEl.remove(); this.style.remove();
  }
}

 
 
function canvasTex(view, w, h, draw) {
  const c = view.doc.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext?.('2d'); if (!x) return null;
  draw(x, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; (view.extraTex ||= []).push(t); return t;
}
function backroomsTexture(view) {
  return canvasTex(view, 256, 384, (x, W, H) => {
    x.fillStyle = '#c8ad5a'; x.fillRect(0, 0, W, H);
     
    const cx = W / 2, cy = H * 0.47, fw = W * 0.22, fh = H * 0.2;
    const quad = (pts, fill) => { x.beginPath(); x.moveTo(...pts[0]); for (const p of pts.slice(1)) x.lineTo(...p); x.closePath(); x.fillStyle = fill; x.fill(); };
    quad([[0, 0], [W, 0], [cx + fw / 2, cy - fh / 2], [cx - fw / 2, cy - fh / 2]], '#e2d9b4');             
    quad([[0, H], [W, H], [cx + fw / 2, cy + fh / 2], [cx - fw / 2, cy + fh / 2]], '#8a7436');             
    quad([[0, 0], [cx - fw / 2, cy - fh / 2], [cx - fw / 2, cy + fh / 2], [0, H]], '#c6aa55');               
    quad([[W, 0], [cx + fw / 2, cy - fh / 2], [cx + fw / 2, cy + fh / 2], [W, H]], '#bb9f4c');               
    x.fillStyle = '#d4b964'; x.fillRect(cx - fw / 2, cy - fh / 2, fw, fh);                                   
    x.fillStyle = '#5c4a1c'; x.fillRect(cx - fw * 0.12, cy - fh * 0.05, fw * 0.24, fh * 0.55);              
     
    x.strokeStyle = 'rgba(120,96,40,.28)'; x.lineWidth = 1;
    for (let k = 0; k < 14; k++) { const f = k / 14, lx = f * (cx - fw / 2); x.beginPath(); x.moveTo(lx, f * (cy - fh / 2)); x.lineTo(lx, H - f * (H - cy - fh / 2)); x.stroke();
      const rx = W - lx; x.beginPath(); x.moveTo(rx, f * (cy - fh / 2)); x.lineTo(rx, H - f * (H - cy - fh / 2)); x.stroke(); }
     
    for (let k = 0; k < 5; k++) { const f = k / 5, y = f * (cy - fh / 2) * 0.92 + 6, half = (W / 2) * (1 - f * (1 - fw / W)) * 0.32, hh = 10 * (1 - f * 0.8);
      x.fillStyle = '#fffbe2'; x.fillRect(cx - half, y, half * 2, hh); x.fillStyle = 'rgba(255,248,200,.25)'; x.fillRect(cx - half * 1.6, y - hh, half * 3.2, hh * 3); }
     
    for (let k = 0; k < 18; k++) { x.fillStyle = `rgba(60,48,14,${0.12 + Math.random() * 0.15})`; x.beginPath(); x.ellipse(Math.random() * W, cy + fh / 2 + Math.random() * (H - cy - fh / 2), 8 + Math.random() * 22, 3 + Math.random() * 8, 0, 0, Math.PI * 2); x.fill(); }
     
    const g = x.createRadialGradient(cx, cy, 4, cx, cy, W * 0.7); g.addColorStop(0, 'rgba(255,240,170,.55)'); g.addColorStop(1, 'rgba(255,240,170,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
  });
}
function glowTexture(view) {
  return canvasTex(view, 64, 64, (x) => { const g = x.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, 'rgba(255,240,170,1)'); g.addColorStop(0.5, 'rgba(255,220,120,.35)'); g.addColorStop(1, 'rgba(255,210,100,0)'); x.fillStyle = g; x.fillRect(0, 0, 64, 64); });
}
function backroomsDoor(view, p, yaw) {
  const mats = (view.extraMats ||= []), M = m => (mats.push(m), m);
  view.brTex ||= backroomsTexture(view); view.glowTex ||= glowTexture(view);
  const g = new THREE.Group(); g.position.set(p.x, 0, p.z); g.rotation.y = yaw;
  const frame = M(new THREE.MeshStandardMaterial({ color: 0x8c7a46, roughness: 0.85 }));
  const W = 2.2, Hh = 3.0;
  for (const sx of [-1, 1]) { const post = new THREE.Mesh(new THREE.BoxGeometry(0.18, Hh + 0.1, 0.3), frame); post.position.set(sx * (W / 2 + 0.09), (Hh + 0.1) / 2, 0); g.add(post); }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(W + 0.36, 0.18, 0.3), frame); lintel.position.set(0, Hh + 0.09, 0); g.add(lintel);
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(W, Hh), M(new THREE.MeshBasicMaterial({ map: view.brTex, color: view.brTex ? 0xffffff : 0xc8ad5a, toneMapped: false, side: THREE.DoubleSide })));
  inner.position.set(0, Hh / 2, 0.02); g.add(inner);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(W * 2.2, Hh * 1.6), M(new THREE.MeshBasicMaterial({ map: view.glowTex, color: 0xffe08a, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide })));
  glow.position.set(0, Hh / 2, 0.08); g.add(glow);
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(W * 1.6, 4.2), M(new THREE.MeshBasicMaterial({ map: view.glowTex, color: 0xffd66a, transparent: true, opacity: 0.42, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
  spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.02, 2.0); g.add(spill);
   
  g.userData = { inner, glow, spill, front: { x: p.x + Math.sin(yaw) * 1.2, z: p.z + Math.cos(yaw) * 1.2 } }; g.visible = false; g.traverse(o => { o.raycast = () => {}; }); view.root.add(g); return g;
}
 
function sealedDoors(view, doors) {
  const mats = (view.extraMats ||= []), g = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x140b09, roughness: 0.8 }), sigil = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.6, 0.15, 0.18), toneMapped: false, transparent: true, opacity: 0.85, side: THREE.DoubleSide });
  mats.push(wood, sigil); const ring = new THREE.RingGeometry(0.42, 0.5, 6), bar = new THREE.PlaneGeometry(0.06, 1.6);
  for (const d of doors) { const slab = new THREE.Group(); slab.position.set(d.x, 0, d.z); slab.rotation.y = d.vertical ? Math.PI / 2 : 0;
    const box = new THREE.Mesh(new THREE.BoxGeometry(d.w, d.h, 0.22), wood); box.position.y = d.h / 2; slab.add(box);
    for (const s of [-1, 1]) { const r = new THREE.Mesh(ring, sigil); r.position.set(0, 1.7, s * 0.12); slab.add(r); for (const a of [0, Math.PI / 3, -Math.PI / 3]) { const b = new THREE.Mesh(bar, sigil); b.position.set(0, 1.7, s * 0.121); b.rotation.z = a; slab.add(b); } }
    g.add(slab); }
  g.visible = false; g.traverse(o => { o.raycast = () => {}; }); view.root.add(g); return g;
}
function watcherAura(view) {
  const mats = (view.extraMats ||= []), M = m => (mats.push(m), m), g = new THREE.Group();
  const stain = new THREE.Mesh(new THREE.CircleGeometry(1.1, 24), M(new THREE.MeshBasicMaterial({ color: 0x6a5620, transparent: true, opacity: 0.55, depthWrite: false })));
  stain.rotation.x = -Math.PI / 2; stain.position.y = 0.012; stain.scale.set(1.2, 0.8, 1); g.add(stain);
  const n = 40, pos = new Float32Array(n * 3); for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, r = 0.3 + Math.random() * 1.1; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = 0.2 + Math.random() * 2.2; pos[i * 3 + 2] = Math.sin(a) * r; }
  const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dg, M(new THREE.PointsMaterial({ map: view.glowTex, color: 0xffe08a, size: 0.09, transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
  g.add(dust); g.userData = { dust }; g.visible = false; g.traverse(o => { o.raycast = () => {}; }); view.root.add(g); return g;
}
function strikeBeam(view) {
  const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.0, 1.2), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false });
  (view.extraMats ||= []).push(m);
  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.12, 1, 8, 1, true), m); b.visible = false; b.userData.life = 0; b.raycast = () => {}; view.root.add(b); return b;
}

export { CINEMATICS, SEAL };
