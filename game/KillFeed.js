





const SVG_NS = 'http://www.w3.org/2000/svg';

const ICONS = {
  AR: 'M1 4h14l1-1h4v2h3v1h-3v1h-5l-1 3h-2l1-3H8L6 9H4l1-2H1z',
  SMG: 'M3 3h11l1-1h3v2h3v1h-3v1h-4l-1 3h-2l1-3H8L7 6H3z',
  SHOTGUN: 'M1 4h17v1h5v1h-5v1H8l-2 2H3l2-2H1zM9 7h6v1H9z',
  SNIPER: 'M0 5h13l1-1h3V3h2v1h4v1h1v1h-1v1h-9l-1 2h-2l1-2H5L3 8H1l1-2H0zM8 2h5v1H8z',
  LMG: 'M1 4h13l1-1h4v2h4v1h-4v1h-4v2h-4V7H7L5 9H3l1-2H1zM6 7h4v2H6z',
  PISTOL: 'M6 3h12v3h-8l-1 4H6l1-4H6z',
  RAID: 'M12 1l3 4 5 1-3 4 1 4-6-2-6 2 1-4-3-4 5-1z',
  ENV: 'M2 9l5-7 3 4 3-3 7 6z',
};
function categoryOf(weapon, catalog) {
  const w = catalog.find(c => c.name === weapon) || catalog.find(c => weapon && String(weapon).startsWith(c.name));
  if (w) return w.category;
  const s = String(weapon || '').toUpperCase();
  if (/WARDEN|ORB|SLAM|SWEEP|SHOCKWAVE|DRONE/.test(s)) return 'RAID';
  if (/BREACHER|SHOTGUN|M870|AA-12|BENELLI/.test(s)) return 'SHOTGUN';
  if (/TALON|PISTOL|GLOCK|EAGLE/.test(s)) return 'PISTOL';
  return 'AR';
}

export class KillFeed {
  constructor(element, { catalog = [], max = 5, lifetimeMs = 6500, selfNames = () => [] } = {}) {
    this.el = element; this.catalog = catalog; this.max = max; this.lifetimeMs = lifetimeMs; this.selfNames = selfNames;
    this.seen = new Map(); this.rows = [];
    if (!document.getElementById('if-killfeed-style')) {
      const st = document.createElement('style'); st.id = 'if-killfeed-style';
      st.textContent = `.if-kf{display:flex;align-items:center;gap:7px;padding:4px 10px;background:rgba(8,13,20,.72);border:1px solid rgba(156,170,184,.18);border-radius:2px;
font:700 10.5px 'JetBrains Mono',monospace;letter-spacing:.4px;color:#e2e8f0;max-width:100%;opacity:0;transform:translateX(14px);transition:opacity .22s ease,transform .22s ease;pointer-events:none;white-space:nowrap}
.if-kf.show{opacity:1;transform:none}.if-kf.leave{opacity:0;transform:translateX(10px);transition-duration:.35s}
.if-kf b{overflow:hidden;text-overflow:ellipsis;max-width:9.5em}.if-kf .blue{color:#7dd3fc}.if-kf .red{color:#fca5a5}.if-kf .boss{color:#fdba74}.if-kf .neutral{color:#e2e8f0}
.if-kf.self{border-color:rgba(255,138,53,.65);background:rgba(40,20,8,.78)}.if-kf svg{width:26px;height:11px;fill:#cbd5e1;flex:none}.if-kf .hs{color:#fb923c;font-size:9px}
@media (max-width:720px){.if-kf{font-size:9px;padding:3px 7px;gap:5px}.if-kf b{max-width:6.5em}.if-kf svg{width:20px;height:9px}}
@media (prefers-reduced-motion:reduce){.if-kf{transition:none;transform:none}}`;
      document.head.append(st);
    }
  }
  teamClass(team) { return team === 'BLUE' ? 'blue' : team === 'RED' ? 'red' : team === 'BOSS' ? 'boss' : 'neutral'; }




  push(e) {
    const now = performance.now();
    for (const [k, t] of this.seen) if (now - t > 10_000) this.seen.delete(k);

    const key = e.id != null ? 'id:' + e.id : `${e.killer}|${e.victim}|${Math.floor(now / 400)}`;
    if (this.seen.has(key)) return false;
    this.seen.set(key, now);
    if (!this.el) return true;
    const row = document.createElement('div'); row.className = 'if-kf'; row.setAttribute('role', 'status');
    const self = this.selfNames();
    if (self.includes(e.killer) || self.includes(e.victim)) row.classList.add('self');
    const name = (text, team) => { const b = document.createElement('b'); b.className = this.teamClass(team); b.textContent = String(text ?? '').slice(0, 24); return b; };
    const svg = document.createElementNS(SVG_NS, 'svg'); svg.setAttribute('viewBox', '0 0 24 10'); svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(SVG_NS, 'path'); path.setAttribute('d', ICONS[categoryOf(e.weapon, this.catalog)] || ICONS.AR); svg.append(path);
    const label = document.createElement('span'); label.style.cssText = 'font-size:8.5px;color:#94a3b8;letter-spacing:.6px'; label.textContent = String(e.weapon || '').split(' ')[0].slice(0, 14);
    row.append(name(e.killer, e.killerTeam), svg, label);
    if (e.headshot) { const hs = document.createElement('span'); hs.className = 'hs'; hs.textContent = 'HS'; row.append(hs); }
    row.append(name(e.victim, e.victimTeam));
    row.setAttribute('aria-label', `${e.killer} eliminated ${e.victim}${e.weapon ? ' with ' + e.weapon : ''}`);
    this.el.prepend(row); requestAnimationFrame(() => row.classList.add('show'));
    const entry = { row, timer: setTimeout(() => this.remove(entry), this.lifetimeMs) };
    this.rows.unshift(entry);
    while (this.rows.length > this.max) this.remove(this.rows[this.rows.length - 1], true);
    return true;
  }
  remove(entry, fast = false) {
    const i = this.rows.indexOf(entry); if (i < 0) return; this.rows.splice(i, 1); clearTimeout(entry.timer);
    if (fast) { entry.row.remove(); return; }
    entry.row.classList.add('leave'); setTimeout(() => entry.row.remove(), 360);
  }
  clear() { for (const r of this.rows) { clearTimeout(r.timer); r.row.remove(); } this.rows.length = 0; this.seen.clear(); if (this.el) this.el.replaceChildren(); }
}
