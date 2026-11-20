 
 
 
 
export const ODO_CSS = `
.odo{display:inline-flex;align-items:flex-start;height:1em;line-height:1;overflow:hidden;font-variant-numeric:tabular-nums;vertical-align:-.12em}
.odo-c{display:inline-block;width:1ch;height:1em;overflow:hidden;transition:width .25s ease}
.odo-c.odo-off{width:0}
.odo-s{display:block;will-change:transform}
.odo-s i{display:block;height:1em;font-style:normal;text-align:center}
.odo-sep{display:inline-block;width:.45ch;overflow:hidden;transition:width .25s ease}.odo-sep.odo-off{width:0}
.odo-pre{display:inline-block}
.odo-gain{position:absolute;right:6px;top:-4px;font:800 12px ui-monospace,monospace;color:#fbbf24;pointer-events:none;animation:odo-gain 1.4s ease-out forwards;text-shadow:0 0 8px rgba(251,191,36,.6)}
@keyframes odo-gain{0%{opacity:0;transform:translateY(6px)}15%{opacity:1}100%{opacity:0;transform:translateY(-22px)}}
@media (prefers-reduced-motion:reduce){.odo-c,.odo-sep{transition:none}.odo-gain{animation-duration:.01s}}`;

 
export function wheelPositions(v, digits) {
  v = Math.max(0, v); const out = [];
  for (let i = 0; i < digits; i++) {
    const p = 10 ** i, whole = Math.floor(v / p), lower = v - whole * p;
    out.push((whole % 10) + (i === 0 ? v - Math.floor(v) : Math.max(0, lower - (p - 1))));
  }
  return out;
}
export const digitCount = v => Math.max(1, String(Math.floor(Math.max(0, v))).length);
export const odoDuration = delta => Math.round(800 + Math.min(1200, Math.log10(1 + Math.abs(delta)) * 300));
const ease = k => 1 - (1 - k) ** 3;
let cssDone = false;

export class Odometer {
  constructor(el, { value = 0, prefix = '', doc = typeof document !== 'undefined' ? document : null, raf = typeof requestAnimationFrame === 'function' ? f => requestAnimationFrame(f) : null,  
    now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()), reduced = null } = {}) {
    this.el = el; this.doc = doc; this.raf = raf; this.now = now; this.prefix = prefix; this.reducedOpt = reduced;
    this.value = Math.max(0, Math.round(+value || 0)); this.shown = this.value; this.target = this.value; this.digits = 0; this.cols = []; this.seps = []; this.anim = 0;
    if (doc && !cssDone && doc.head) { const s = doc.createElement('style'); s.textContent = ODO_CSS; doc.head.append(s); cssDone = true; }
    this.build(digitCount(this.value)); this.paint(this.value);
  }
  get reduced() { return this.reducedOpt ?? (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches); }
  build(digits) {
    const d = this.doc; this.digits = digits; this.cols = []; this.seps = [];
    if (!d) return;
    this.el.classList?.add('odo'); this.el.replaceChildren?.();
    if (this.prefix) { const p = d.createElement('span'); p.className = 'odo-pre'; p.textContent = this.prefix; this.el.append(p); }
    for (let i = digits - 1; i >= 0; i--) {
      const c = d.createElement('span'); c.className = 'odo-c'; c.setAttribute('aria-hidden', 'true');
      const s = d.createElement('span'); s.className = 'odo-s'; s.innerHTML = '<i>0</i><i>1</i><i>2</i><i>3</i><i>4</i><i>5</i><i>6</i><i>7</i><i>8</i><i>9</i><i>0</i>';
      c.append(s); this.el.append(c); this.cols[i] = { c, s, blur: 0 };
      if (i > 0 && i % 3 === 0) { const sep = d.createElement('span'); sep.className = 'odo-sep'; sep.textContent = ','; sep.setAttribute('aria-hidden', 'true'); this.el.append(sep); this.seps[i] = sep; }
    }
  }
  paint(v, speed = 0) {
    this.shown = v;
    this.el.setAttribute?.('aria-label', this.prefix + Math.round(this.target).toLocaleString('en-US'));
    if (!this.doc) { this.el.textContent = this.prefix + Math.round(v).toLocaleString('en-US'); return; }
    const pos = wheelPositions(v, this.digits), lead = Math.max(digitCount(v), digitCount(this.target), digitCount(this.value));
    for (let i = 0; i < this.digits; i++) {
      const col = this.cols[i]; if (!col) continue;
      col.s.style.transform = `translateY(${(-pos[i]).toFixed(3)}em)`;
      col.c.classList.toggle('odo-off', i >= lead);
      const blur = i === 0 ? Math.min(1.4, speed / 60) : i === 1 ? Math.min(0.8, speed / 600) : 0;
      if (Math.abs(blur - col.blur) > 0.05) { col.blur = blur; col.s.style.filter = blur > 0.05 ? `blur(${blur.toFixed(2)}px)` : ''; }
      if (this.seps[i]) this.seps[i].classList.toggle('odo-off', i >= lead);
    }
  }
   
  set(to, { from = null, instant = false } = {}) {
    to = Math.max(0, Math.round(+to || 0));
    const start = from == null ? this.shown : Math.max(0, Math.round(+from || 0));
    this.target = to; this.value = to; this.anim++;
    const need = Math.max(digitCount(to), digitCount(start));
    if (need > this.digits) this.build(need);
    if (instant || this.reduced || !this.raf || start === to) { this.paint(to); return 0; }
    const id = this.anim, ms = odoDuration(to - start), t0 = this.now(); let last = start, lastT = t0;
    const step = () => {
      if (id !== this.anim) return;
      const t = this.now(), k = Math.min(1, (t - t0) / ms), v = start + (to - start) * ease(k);
      const speed = Math.abs(v - last) / Math.max(1, t - lastT) * 16; last = v; lastT = t;
      this.paint(k >= 1 ? to : v, k >= 1 ? 0 : speed);
      if (k < 1) this.raf(step);
    };
    this.paint(start); this.raf(step);
     
    setTimeout(() => { if (id === this.anim && this.shown !== to) this.paint(to); }, ms + 150);
    return ms;
  }
}

 
export function gainPop(host, amount, { doc = typeof document !== 'undefined' ? document : null, label = '' } = {}) {
  if (!doc || !host || !(amount > 0)) return null;
  const s = doc.createElement('span'); s.className = 'odo-gain'; s.textContent = '+' + Math.round(amount).toLocaleString('en-US') + (label ? ' ' + label : '');
  host.append(s); setTimeout(() => s.remove(), 1500); return s;
}
