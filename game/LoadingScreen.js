






export const VERSION = 'V37';
export const CREDITS = [
  { title: 'IDEA & PLANNING', lines: ['Zahran Al-K', 'Alfian ZW', 'Revanda', 'Naryama', 'Fathan'] },
  { title: 'INSPIRED BY', lines: ['Free Fire', 'Fortnite', 'Rivals', 'Arsenal'] },
  { title: 'SPECIAL THANKS', lines: ['Three.js'] },
];
export const CREDIT_TIMING = { fadeIn: 500, visible: 2500, fadeOut: 500 };


export class LoadProgress {
  constructor() { this.stages = new Map(); this.items = { total: 0, done: 0, failed: 0 }; this.itemWeight = 0.3; this.shown = 0; }
  stage(name, weight = 1) { if (!this.stages.has(name)) this.stages.set(name, { weight, done: 0, label: name }); return this.stages.get(name); }

  set(name, f) { const s = this.stage(name); s.done = Math.max(s.done, Math.min(1, Math.max(0, f))); }
  complete(name) { this.set(name, 1); }
  itemStart() { this.items.total++; }
  itemEnd(ok = true) { this.items.done++; if (!ok) this.items.failed++; }
  get fraction() {
    let w = 0, d = 0; for (const s of this.stages.values()) { w += s.weight; d += s.weight * s.done; }
    const stageFrac = w ? d / w : 1, hasItems = this.items.total > 0;
    const itemFrac = hasItems ? this.items.done / this.items.total : 1;
    const f = hasItems ? stageFrac * (1 - this.itemWeight) + itemFrac * this.itemWeight : stageFrac;

    this.shown = Math.max(this.shown, f); return this.shown;
  }
  get done() { return [...this.stages.values()].every(s => s.done >= 1) && this.items.done >= this.items.total; }
}

const CSS = `
#if-loader{position:fixed;inset:0;z-index:130;background:#0C1018;color:#e6ebf0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:Rajdhani,Inter,system-ui,sans-serif;transition:opacity .3s ease}
#if-loader[hidden]{display:none}#if-loader.fade{opacity:0}
.ifl-box{width:min(560px,86vw);display:flex;flex-direction:column;gap:14px}
.ifl-title{font-weight:700;font-size:clamp(26px,5vw,42px);letter-spacing:.16em;line-height:1;margin:0}
.ifl-title span{color:#FF8A35}
.ifl-version{font:600 11px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.3em;color:#8a96a3}
.ifl-map{font:600 11px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.18em;color:#cbd5e1;min-height:14px}
.ifl-bar{height:4px;background:#1b2330;position:relative;overflow:hidden;border-radius:1px}
.ifl-fill{position:absolute;inset:0 auto 0 0;width:0;background:#FF8A35;transition:width .18s linear}
.ifl-row{display:flex;justify-content:space-between;gap:16px;font:500 11px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.08em;color:#9aa6b2}
.ifl-row b{color:#f1f5f9;font-weight:700;min-width:3.5em;text-align:right}
.ifl-status{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ifl-credits{position:absolute;left:0;right:0;bottom:12vh;text-align:center;min-height:120px;pointer-events:none}
.ifl-credit{opacity:0;transition:opacity .5s ease}
.ifl-credit.on{opacity:1}
.ifl-credit small{display:block;font:600 10.5px 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.32em;color:#FF8A35;margin-bottom:10px}
.ifl-credit div{font-weight:600;font-size:clamp(16px,2.6vw,22px);letter-spacing:.12em;color:#e6ebf0;line-height:1.45}
@media (max-height:520px){.ifl-credits{bottom:4vh;min-height:80px}.ifl-credit div{font-size:14px}}
@media (prefers-reduced-motion:reduce){.ifl-credit,.ifl-fill,#if-loader{transition:none}}`;

export class LoadingScreen {
  constructor({ THREE, version = VERSION, credits = CREDITS, timing = CREDIT_TIMING } = {}) {
    this.THREE = THREE; this.version = version; this.credits = credits; this.timing = timing;
    this.ticket = 0; this.active = false; this.progress = new LoadProgress(); this.creditIndex = -1; this.creditTimers = [];
    this.mount(); this.hookLoaders();
  }
  mount() {

    let el = document.getElementById('if-loader');
    if (!document.getElementById('if-loader-style')) { const st = document.createElement('style'); st.id = 'if-loader-style'; st.textContent = CSS; document.head.append(st); }
    if (!el) { el = document.createElement('div'); el.id = 'if-loader'; el.hidden = true; document.body.append(el); }
    el.setAttribute('role', 'progressbar'); el.setAttribute('aria-valuemin', '0'); el.setAttribute('aria-valuemax', '100');
    el.innerHTML = `<div class="ifl-box"><h1 class="ifl-title">OPERATION <span>IRONFALL</span></h1><div class="ifl-version">VERSION ${this.version}</div>
      <div class="ifl-map" id="ifl-map"></div><div class="ifl-bar"><div class="ifl-fill" id="ifl-fill"></div></div>
      <div class="ifl-row"><span class="ifl-status" id="ifl-status">Starting…</span><b id="ifl-pct">0%</b></div></div>
      <div class="ifl-credits" aria-live="polite"><div class="ifl-credit" id="ifl-credit"></div></div>`;
    this.el = el; this.fill = el.querySelector('#ifl-fill'); this.pct = el.querySelector('#ifl-pct'); this.statusEl = el.querySelector('#ifl-status'); this.mapEl = el.querySelector('#ifl-map'); this.creditEl = el.querySelector('#ifl-credit');
  }

  hookLoaders() {
    const self = this, M = this.THREE?.DefaultLoadingManager;
    if (M) {
      const prev = { start: M.onStart, progress: M.onProgress, error: M.onError };
      M.itemStart = (orig => function (url) { if (self.active) { self.progress.itemStart(); self.pending.add(url); self.render(); } return orig.call(this, url); })(M.itemStart);
      M.itemEnd = (orig => function (url) { if (self.pending.delete(url)) { self.progress.itemEnd(true); self.lastItem = url; self.render(); } return orig.call(this, url); })(M.itemEnd);
      M.itemError = (orig => function (url) { if (self.pending.delete(url)) { self.progress.itemEnd(false); self.render(); } return orig.call(this, url); })(M.itemError);
      void prev;
    }
    const nativeFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      const url = typeof input === 'string' ? input : input?.url || String(input);
      const tracked = self.active && /\/assets\//.test(url);
      if (!tracked) return nativeFetch(input, init);
      self.progress.itemStart(); self.render();
      return nativeFetch(input, init).then(r => { self.progress.itemEnd(r.ok); self.lastItem = url; self.render(); return r; }, e => { self.progress.itemEnd(false); self.render(); throw e; });
    };
    this.pending = new Set();
  }

  begin(title, stages = [], subtitle = '') {
    this.ticket++; this.active = true; this.progress = new LoadProgress(); this.pending.clear(); this.started = performance.now();
    for (const [name, w] of stages) this.progress.stage(name, w);
    this.mapEl.textContent = [title, subtitle].filter(Boolean).join(' · ');
    this.el.hidden = false; this.el.classList.remove('fade'); this.status('Preparing…'); this.render(); this.startCredits();
    return this.ticket;
  }
  stage(name, f = 1, label) { this.progress.set(name, f); if (label) this.status(label); this.render(); }
  status(text) { this.statusText = text; if (this.statusEl) this.statusEl.textContent = text; }
  render() {
    if (!this.active) return;
    const pct = Math.floor(this.progress.fraction * 100), it = this.progress.items;
    this.fill.style.width = pct + '%'; this.pct.textContent = pct + '%'; this.el.setAttribute('aria-valuenow', String(pct));
    if (it.total && this.lastItem) this.statusEl.textContent = `${this.statusText} · assets ${it.done}/${it.total}`;
  }

  async settle(timeoutMs = 8000) {
    const t0 = performance.now();
    while (this.active && this.progress.items.done < this.progress.items.total && performance.now() - t0 < timeoutMs) await new Promise(r => setTimeout(r, 50));
    return this.progress.items.done >= this.progress.items.total;
  }
  async finish(ticket, note = 'Ready') {
    if (ticket !== this.ticket) return;
    for (const s of this.progress.stages.values()) s.done = 1;
    this.status(note); this.progress.shown = 1; this.fill.style.width = '100%'; this.pct.textContent = '100%';
    this.active = false; this.el.classList.add('fade');
    await new Promise(r => setTimeout(r, 300));
    if (ticket === this.ticket) { this.el.hidden = true; this.el.classList.remove('fade'); this.stopCredits(); }
  }
  abort() { this.ticket++; this.active = false; this.el.hidden = true; this.stopCredits(); }
  startCredits() {
    this.stopCredits(); const { fadeIn, visible, fadeOut } = this.timing;
    const show = () => {
      if (this.el.hidden) return;
      this.creditIndex = (this.creditIndex + 1) % this.credits.length; const c = this.credits[this.creditIndex];
      this.creditEl.replaceChildren(); const small = document.createElement('small'); small.textContent = 'CREDIT ' + (this.creditIndex + 1) + ' — ' + c.title; this.creditEl.append(small);
      for (const line of c.lines) { const d = document.createElement('div'); d.textContent = line; this.creditEl.append(d); }
      this.creditEl.classList.add('on');
      this.creditTimers.push(setTimeout(() => this.creditEl.classList.remove('on'), fadeIn + visible));
      this.creditTimers.push(setTimeout(show, fadeIn + visible + fadeOut));
    };
    show();
  }
  stopCredits() { for (const t of this.creditTimers) clearTimeout(t); this.creditTimers.length = 0; this.creditEl?.classList.remove('on'); }
}
