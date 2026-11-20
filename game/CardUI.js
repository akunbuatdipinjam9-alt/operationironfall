 
 
import { CARD_BY_ID, CARD_FFA } from './CardFFA.js';

const TIER = { COMMON: '#9aa4b1', RARE: '#5ab4ff', EPIC: '#b38bff', LEGENDARY: '#ffb547' };
const KEYS = ['Digit4', 'Digit5', 'Digit6'];
const CSS = `
#if-cards{position:fixed;left:50%;bottom:118px;transform:translateX(-50%);z-index:31;pointer-events:none;font-family:Rajdhani,Inter,system-ui,sans-serif;color:#e6ebf1;display:none}
#if-cards.on{display:block}
#if-cards .ifc-head{display:flex;align-items:center;gap:10px;margin:0 2px 6px;font:700 10px 'JetBrains Mono',monospace;letter-spacing:.14em;color:#FFAD72}
#if-cards .ifc-head em{font-style:normal;color:#8b95a3;letter-spacing:.08em}
#if-cards .ifc-head b{margin-left:auto;color:#0b0f14;background:#FF8A35;padding:1px 6px;border-radius:2px;display:none}
#if-cards .ifc-head b.on{display:inline-block}
#if-cards .ifc-row{display:flex;gap:8px}
#if-cards button{pointer-events:auto;position:relative;width:172px;min-height:84px;text-align:left;padding:9px 10px 10px 12px;background:rgba(15,18,23,.9);border:1px solid rgba(255,255,255,.12);border-radius:6px;color:inherit;cursor:pointer;overflow:hidden;transform:translateY(8px);opacity:0;transition:transform .16s ease-out,opacity .16s ease-out,border-color .12s}
#if-cards.in button{transform:none;opacity:1}
#if-cards.in button:nth-child(2){transition-delay:.04s}#if-cards.in button:nth-child(3){transition-delay:.08s}
#if-cards button:before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;background:var(--t)}
#if-cards button:hover,#if-cards button.hot{border-color:var(--t)}
#if-cards button.picked{border-color:var(--t);background:rgba(30,26,22,.95)}
#if-cards .ifc-k{position:absolute;right:8px;top:8px;width:18px;height:18px;display:grid;place-items:center;border:1px solid rgba(255,255,255,.22);border-radius:3px;font:700 10px 'JetBrains Mono',monospace;color:#cfd6df}
#if-cards .ifc-t{font:700 8.5px 'JetBrains Mono',monospace;letter-spacing:.16em;color:var(--t)}
#if-cards .ifc-n{display:block;margin:2px 22px 4px 0;font-weight:700;font-size:16px;line-height:1.05;letter-spacing:.02em}
#if-cards .ifc-d{display:block;font:500 12px Inter,system-ui,sans-serif;line-height:1.3;color:#b9c0ca}
#if-cards .ifc-bar{height:2px;margin-top:7px;background:rgba(255,255,255,.08);overflow:hidden;border-radius:1px}
#if-cards .ifc-bar i{display:block;height:100%;background:#FF8A35;transform-origin:left;transform:scaleX(var(--p,1))}
#if-cards-hand{position:fixed;right:18px;bottom:118px;z-index:30;pointer-events:none;display:none;align-items:center;gap:8px;padding:5px 10px;background:rgba(15,18,23,.82);border:1px solid rgba(255,255,255,.1);border-radius:6px;font:700 10px 'JetBrains Mono',monospace;letter-spacing:.1em;color:#cfd6df}
#if-cards-hand.on{display:flex}
#if-cards-hand span{color:#FFAD72}
#if-cards-hand .sh{color:#7fd4ff}
#if-cards-toast{position:fixed;left:50%;bottom:214px;transform:translateX(-50%);z-index:31;pointer-events:none;font:700 12px 'JetBrains Mono',monospace;letter-spacing:.14em;color:#0b0f14;background:#FF8A35;padding:3px 9px;border-radius:2px;opacity:0;transition:opacity .2s}
#if-cards-toast.on{opacity:1}
@media (max-width:760px){#if-cards{bottom:172px}#if-cards button{width:31vw;min-height:76px;padding:7px 8px 8px 10px}#if-cards .ifc-n{font-size:14px}#if-cards .ifc-d{font-size:11px}#if-cards .ifc-k{display:none}#if-cards-hand{bottom:172px;right:8px}}
@media (prefers-reduced-motion:reduce){#if-cards button{transition:none;transform:none;opacity:1}}
`;

export class CardUI {
  constructor({ pick, canPick = () => true } = {}) {
    this.pick = pick; this.canPick = canPick; this.offerId = null; this.cards = []; this.sent = null; this.expiresAt = 0;
    if (!document.getElementById('if-cards-style')) { const s = document.createElement('style'); s.id = 'if-cards-style'; s.textContent = CSS; document.head.appendChild(s); }
    this.root = document.createElement('div'); this.root.id = 'if-cards'; this.root.setAttribute('role', 'dialog'); this.root.setAttribute('aria-label', 'Choose a card');
    this.root.innerHTML = '<div class="ifc-head">CARD DRAFT <em>PRESS 4 · 5 · 6</em><b></b></div><div class="ifc-row"></div><div class="ifc-bar"><i></i></div>';
    this.row = this.root.querySelector('.ifc-row'); this.pending = this.root.querySelector('b'); this.bar = this.root.querySelector('.ifc-bar i');
    this.hand = document.createElement('div'); this.hand.id = 'if-cards-hand'; this.hand.setAttribute('aria-live', 'polite');
    this.toastEl = document.createElement('div'); this.toastEl.id = 'if-cards-toast';
    document.body.append(this.root, this.hand, this.toastEl);
    this.row.addEventListener('click', e => { const b = e.target.closest('button'); if (b) this.choose(Number(b.dataset.i)); });
    this.onKey = e => { const i = KEYS.indexOf(e.code); if (i < 0 || !this.offerId || e.repeat || !this.canPick()) return; e.preventDefault(); this.choose(i); };
    window.addEventListener('keydown', this.onKey);
    this.tick = () => { this.raf = 0; if (!this.offerId) return; const left = Math.max(0, this.expiresAt - performance.now()); this.bar.style.setProperty('--p', (left / CARD_FFA.pickTimeoutMs).toFixed(3)); if (left > 0) this.raf = requestAnimationFrame(this.tick); };
  }

  choose(i) {
    const id = this.cards[i]; if (!id || this.sent === this.offerId) return;
    this.sent = this.offerId; this.row.children[i]?.classList.add('picked');
    try { this.pick?.(this.offerId, id); } catch (e) { console.warn('[CardUI]', e); }
  }

   
  update(view) {
    if (!view) { this.hide(); this.hand.classList.remove('on'); return; }
    this.hand.innerHTML = `CARDS <span>${view.cards.length}</span>${view.shield > 0 ? ` · SHIELD <span class="sh">${view.shield}</span>` : ''}`;
    this.hand.classList.toggle('on', view.cards.length > 0 || view.shield > 0);
    const o = view.offer;
    if (!o) { this.hide(); return; }
    this.pending.textContent = '+' + (view.pending - 1); this.pending.classList.toggle('on', view.pending > 1);
    this.expiresAt = performance.now() + o.expiresMs;
    if (o.id === this.offerId) return;
    this.offerId = o.id; this.cards = o.cards; this.sent = null;
    this.row.innerHTML = '';
    o.cards.forEach((id, i) => {
      const c = CARD_BY_ID.get(id) || { name: id, tier: 'COMMON', desc: '' };
      const b = document.createElement('button'); b.type = 'button'; b.dataset.i = i; b.style.setProperty('--t', TIER[c.tier] || TIER.COMMON);
      b.setAttribute('aria-label', `${c.name}, ${c.tier.toLowerCase()}: ${c.desc}. Key ${i + 4}`);
      b.innerHTML = `<span class="ifc-k">${i + 4}</span><span class="ifc-t">${c.tier}</span><span class="ifc-n"></span><span class="ifc-d"></span>`;
      b.querySelector('.ifc-n').textContent = c.name; b.querySelector('.ifc-d').textContent = c.desc;
      this.row.appendChild(b);
    });
    this.root.classList.add('on'); this.root.classList.remove('in'); void this.root.offsetWidth; this.root.classList.add('in');
    if (!this.raf) this.raf = requestAnimationFrame(this.tick);
  }

  picked(ev) {
    const c = CARD_BY_ID.get(ev.card); if (!c) return;
    this.toastEl.textContent = (ev.auto ? 'AUTO · ' : '+ ') + c.name; this.toastEl.style.background = TIER[c.tier];
    this.toastEl.classList.add('on'); clearTimeout(this.toastT); this.toastT = setTimeout(() => this.toastEl.classList.remove('on'), 1400);
  }

  hide() { this.offerId = null; this.cards = []; this.root.classList.remove('on', 'in'); if (this.raf) { cancelAnimationFrame(this.raf); this.raf = 0; } }
  dispose() { this.hide(); window.removeEventListener('keydown', this.onKey); this.root.remove(); this.hand.remove(); this.toastEl.remove(); }
}
