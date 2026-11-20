

import { IC_SHORT, SHOP, SLOTS, EARN, DAILY_MATCH_CAP } from './IronCredits.js';
import { Odometer, gainPop } from './Odometer.js';

const CSS = `
.ic-chip{display:flex;align-items:center;gap:7px;height:42px;padding:0 13px;background:rgba(10,16,24,.88);border:1px solid rgba(255,138,53,.38);border-radius:2px;color:#F1F5F9;font:700 12px 'JetBrains Mono',monospace;letter-spacing:1px;cursor:pointer;transition:border-color .18s,transform .18s}
.ic-chip:hover,.ic-chip:focus-visible{border-color:#FF8A35;outline:none}
.ic-chip.bump{transform:scale(1.06)}
#ic-chip{position:relative}
.ic-chip small{color:#FF8A35;font-size:9.5px;letter-spacing:1.4px}
.ic-coin{width:15px;height:15px;flex:none}
.ic-coin{display:inline-block;vertical-align:middle}
.ic-ops{display:grid;grid-template-columns:1fr 1.6fr;gap:14px;margin-bottom:26px}
.ic-ops-col{padding:14px 16px;background:rgba(10,16,24,.7);border:1px solid rgba(156,170,184,.16);border-radius:2px}
.ic-ops-head{display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:10px}
.ic-ops-head .ic-sec{margin:0}
.ic-ops-head small{font:700 9px 'JetBrains Mono',monospace;letter-spacing:1.6px;color:#9CAAB8}
.ic-ops-list{list-style:none;margin:0;padding:0;display:grid;gap:10px}
.ic-ops-col:last-child .ic-ops-list{grid-template-columns:1fr 1fr;gap:10px 18px}
.ic-ops-list li{display:grid;gap:5px}
.ic-ops-top{display:flex;justify-content:space-between;gap:8px;font:600 11px 'Inter',sans-serif;color:#E2E8F0}
.ic-ops-top b{font:700 10px 'JetBrains Mono',monospace;color:#9CAAB8;white-space:nowrap}
.ic-ops-list li.done .ic-ops-top b{color:#34d399}
.ic-ops-bar{display:block;height:4px;background:rgba(156,170,184,.16);border-radius:2px;overflow:hidden}
.ic-ops-bar i{display:block;height:100%;background:#FF8A35}
.ic-ops-list li.done .ic-ops-bar i{background:#34d399}
.ic-ops-list small{font:700 9px 'JetBrains Mono',monospace;letter-spacing:1px;color:#FFAD72}
@media (max-width:900px){.ic-ops{grid-template-columns:1fr}.ic-ops-col:last-child .ic-ops-list{grid-template-columns:1fr}}
.ic-shop{max-width:1180px;margin:0 auto}
.ic-shop-top{display:flex;flex-wrap:wrap;align-items:stretch;gap:12px;margin-bottom:22px}
.ic-wallet{display:flex;align-items:center;gap:14px;padding:14px 18px;min-width:240px;background:linear-gradient(155deg,rgba(17,27,37,.91),rgba(8,13,20,.88));border:1px solid rgba(255,138,53,.4);border-left:3px solid #FF8A35;border-radius:2px}
.ic-wallet b{display:block;font:700 28px/1 Rajdhani,'Inter',sans-serif;letter-spacing:1.5px;color:#F1F5F9}
.ic-wallet small{display:block;margin-top:4px;font:700 9px 'JetBrains Mono',monospace;letter-spacing:1.8px;color:#9CAAB8}
.ic-wallet .ic-coin{width:30px;height:30px}
.ic-earn{flex:1;min-width:280px;padding:12px 16px;background:rgba(10,16,24,.7);border:1px solid rgba(156,170,184,.16);border-radius:2px}
.ic-earn h4{margin:0 0 8px;font:700 10px 'JetBrains Mono',monospace;letter-spacing:2px;color:#FF8A35}
.ic-earn ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:4px 16px}
.ic-earn li{display:flex;justify-content:space-between;gap:8px;font:600 10px 'JetBrains Mono',monospace;color:#9CAAB8;letter-spacing:.4px}
.ic-earn li b{color:#F1F5F9}
.ic-sec{margin:0 0 10px;font:700 12px Rajdhani,'Inter',sans-serif;letter-spacing:2.6px;color:#F1F5F9}
.ic-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:12px;margin-bottom:24px}
.ic-item{position:relative;display:flex;flex-direction:column;gap:9px;padding:12px;background:linear-gradient(155deg,rgba(17,27,37,.91),rgba(8,13,20,.88));border:1px solid rgba(156,170,184,.2);border-radius:2px;text-align:left}
.ic-item.equipped{border-color:#FF8A35;box-shadow:0 0 0 1px #FF8A35 inset}
.ic-swatch{height:58px;border-radius:2px;border:1px solid rgba(255,255,255,.08);display:grid;place-items:center}
.ic-item-name{font:700 12px Rajdhani,'Inter',sans-serif;letter-spacing:1.6px;color:#F1F5F9}
.ic-item button{padding:8px 0;border-radius:2px;border:1px solid rgba(156,170,184,.28);background:rgba(17,27,37,.85);color:#F1F5F9;font:700 9.5px 'JetBrains Mono',monospace;letter-spacing:1.4px;cursor:pointer}
.ic-item button.buy{border-color:#FF8A35;background:rgba(255,138,53,.14);color:#FFAD72}
.ic-item button:disabled{opacity:.45;cursor:not-allowed}
.ic-item button.on{border-color:#FF8A35;color:#FFAD72;cursor:default}
.ic-note{font:600 9.5px 'JetBrains Mono',monospace;letter-spacing:.6px;color:#64748b;margin:-6px 0 10px}
.ic-earn .ic-note{margin:10px 0 0}
#tdm-ic-summary{margin:0 0 16px;padding:12px 14px;border:1px solid rgba(255,138,53,.45);background:rgba(255,138,53,.07);border-radius:12px;font-family:'JetBrains Mono',monospace}
#tdm-ic-summary .ic-sum-head{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:8px}
#tdm-ic-summary .ic-sum-head b{font-size:20px;color:#FFAD72;letter-spacing:1px}
#tdm-ic-summary .ic-sum-head span{font-size:10px;letter-spacing:1.8px;color:#cbd5e1}
#tdm-ic-summary ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:3px 18px}
#tdm-ic-summary li{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:#94a3b8}
#tdm-ic-summary li b{color:#f1f5f9}
#tdm-ic-summary .ic-sum-foot{margin-top:7px;font-size:10px;color:#64748b}
@media (max-width:760px){.ic-chip{height:34px;padding:0 9px;font-size:11px}.ic-chip small{display:none}}
`;

const COIN = '<svg class="ic-coin" viewBox="0 0 24 24" aria-hidden="true"><path fill="#FF8A35" d="M12 1.5 21.1 6.75v10.5L12 22.5 2.9 17.25V6.75z"/><path fill="#0a121b" d="M12 4.6 18.4 8.3v7.4L12 19.4l-6.4-3.7V8.3z"/><path fill="#FFAD72" d="M10.6 7.6h2.8v8.8h-2.8z"/></svg>';
const fmt = n => Math.max(0, n | 0).toLocaleString('en-US');
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const SLOT_TITLE = { camo: 'WEAPON CAMO', crosshair: 'CROSSHAIR COLOUR', plate: 'CALLSIGN PLATE' };
const SLOT_NOTE = { camo: 'Tints the first-person weapon model. Cosmetic only.', crosshair: 'Colour of the in-match crosshair.', plate: 'Frame of your callsign in the lobby.' };
const hex = v => '#' + (v >>> 0).toString(16).padStart(6, '0');

export class CreditsUI {

  constructor(ic, { sfx = null, onEquip = () => {}, toast = () => {}, daily = () => [] } = {}) {
    this.ic = ic; this.sfx = sfx; this.onEquip = onEquip; this.toast = toast; this.daily = daily;
    if (!document.getElementById('ic-style')) { const s = el('style'); s.id = 'ic-style'; s.textContent = CSS; document.head.append(s); }
  }

  mount() {

    const badge = document.getElementById('if-player-badge');
    if (badge && !document.getElementById('ic-chip')) {
      const chip = el('button', 'ic-chip'); chip.type = 'button'; chip.id = 'ic-chip'; chip.title = 'IRON CREDITS — open shop'; chip.dataset.iftab = 'shop';
      chip.innerHTML = COIN; chip.append(el('span', '', '0'), el('small', '', IC_SHORT));
      badge.before(chip);
    }

    const nav = document.getElementById('if-nav');
    if (nav && !nav.querySelector('[data-iftab="shop"]')) {
      const b = el('button', 'if-nav-btn', 'SHOP'); b.type = 'button'; b.dataset.iftab = 'loadout'; b.dataset.shopnav = '1';
      const at = nav.querySelector('[data-iftab="settings"]'); if (at) at.before(b); else nav.append(b);
    }
    const maps = document.getElementById('if-view-maps');
    if (maps && !document.getElementById('if-view-shop')) {
      const sec = el('section', 'if-subpanel'); sec.id = 'if-view-shop'; sec.hidden = true;
      sec.innerHTML = `<div class="if-sub-head"><h2>SHOP<small>ITEMS · CHALLENGES · REDEEM · COSMETICS ONLY</small></h2><button type="button" class="if-back-btn" data-ifback="home">&#8592; BACK</button></div><div class="if-sub-body"><div class="ic-shop" id="ic-shop"></div></div>`;
      maps.after(sec);
      sec.addEventListener('click', e => this.onShopClick(e));
    }

    const hl = document.getElementById('tdm-match-highlights');
    if (hl && !document.getElementById('tdm-ic-summary')) { const box = el('div'); box.id = 'tdm-ic-summary'; box.hidden = true; hl.before(box); }
    this.render();
  }

   
  rollWhenVisible() {
    clearTimeout(this.rollTimer); let tries = 0;
    const tick = () => { const chip = document.getElementById('ic-chip'); if (chip && chip.offsetParent !== null) { this.render(); return; } if (++tries < 25) this.rollTimer = setTimeout(tick, 200); };
    tick();
  }

  render() {
     
     
    const chip = document.getElementById('ic-chip'), span = chip?.querySelector('span');
    if (span) {
      const bal = this.ic.balance;
      if (!this.odo) this.odo = new Odometer(span, { value: bal });
      else if (bal !== this.odo.target && chip.offsetParent !== null) {
        const gain = bal - this.odo.target, ms = this.odo.set(bal);
        if (gain > 0) gainPop(chip, gain);
        chip.classList.add('bump'); setTimeout(() => chip.classList.remove('bump'), Math.max(220, ms));
      }
    }
    this.renderShop();
  }


  opsList(rows) {
    const ul = el('ul', 'ic-ops-list');
    for (const w of rows) {
      const li = el('li', w.done ? 'done' : '');
      const top = el('div', 'ic-ops-top'); top.append(el('span', '', w.label), el('b', '', w.done ? 'DONE' : `${Math.min(w.progress, w.goal)}/${w.goal}`));
      const bar = el('span', 'ic-ops-bar'); const fill = el('i'); fill.style.width = (Math.min(1, w.progress / w.goal) * 100).toFixed(1) + '%'; bar.append(fill);
      li.append(top, bar, el('small', '', w.reward)); ul.append(li);
    }
    return ul;
  }
  resetIn(ms) {
    const s = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(s / 86400), h = Math.floor(s % 86400 / 3600), m = Math.floor(s % 3600 / 60);
    return d > 0 ? `${d}D ${h}H` : `${h}H ${String(m).padStart(2, '0')}M`;
  }
  tick() { const r = document.getElementById('ic-week-reset'); if (r) r.textContent = 'RESETS IN ' + this.resetIn(this.ic.weeklyResetAt() - Date.now()); }

  renderShop() {
    const root = document.getElementById('ic-shop'); if (!root) return;
    const ic = this.ic, wallet = el('div', 'ic-wallet');
    wallet.innerHTML = COIN; const w = el('div'); w.append(el('b', '', fmt(ic.balance)), el('small', '', `IRON CREDITS · ${fmt(Math.max(0, DAILY_MATCH_CAP - ic.state.earnedToday))} LEFT FROM MATCHES TODAY`)); wallet.append(w);
    const earn = el('div', 'ic-earn'); earn.append(el('h4', '', 'HOW TO EARN'));
    const ul = el('ul');
    const rows = [['Elimination', '+5'], ['Headshot elimination', '+3 bonus'], ['3 kills without dying', '+10'], ['Assist', '+2'], ['Match won', '+60'], ['Match finished (loss/draw)', '+20'], ['Daily challenge', '+50'], ['Weekly operation', '+200'], ['Raid boss defeated', '+250'], ['Raid boss damage', '+5 / 1,000'], ['Hardcore / Blind win', '×1.5'], ['Daily login streak', '+10 → +50']];
    for (const [a, b] of rows) { const li = el('li', '', a); li.append(el('b', '', b)); ul.append(li); }
    earn.append(ul, el('div', 'ic-note', `Training pays nothing. Matches pay up to ${fmt(DAILY_MATCH_CAP)} IC per day; challenges and login are extra.`));
    const top = el('div', 'ic-shop-top'); top.append(wallet, earn);
    const parts = [top];
    const ops = el('div', 'ic-ops');
    const daily = el('div', 'ic-ops-col'), weekly = el('div', 'ic-ops-col');
    const midnight = new Date(); midnight.setHours(24, 0, 0, 0);
    const dh = el('div', 'ic-ops-head'); dh.append(el('h3', 'ic-sec', 'DAILY CHALLENGES'), el('small', '', 'RESETS IN ' + this.resetIn(midnight - Date.now())));
    daily.append(dh, this.opsList(this.daily().map(c => ({ ...c, reward: `+${c.xp} XP · +${EARN.DAILY.ic} ${IC_SHORT}` }))));
    const wh = el('div', 'ic-ops-head'); const wr = el('small', ''); wr.id = 'ic-week-reset'; wh.append(el('h3', 'ic-sec', 'WEEKLY OPERATIONS · 6'), wr);
    weekly.append(wh, this.opsList(ic.weekly().map(w => ({ ...w, reward: `+${w.reward} ${IC_SHORT}` }))));
    ops.append(daily, weekly); parts.push(ops);
    for (const slot of SLOTS) {
      parts.push(el('h3', 'ic-sec', SLOT_TITLE[slot]), el('div', 'ic-note', SLOT_NOTE[slot]));
      const grid = el('div', 'ic-grid'); const eq = ic.equipped(slot).id;
      for (const item of SHOP.filter(i => i.slot === slot)) {
        const card = el('div', 'ic-item' + (item.id === eq ? ' equipped' : ''));
        const sw = el('div', 'ic-swatch'); this.paintSwatch(sw, item);
        const btn = el('button'); btn.type = 'button'; btn.dataset.icitem = item.id;
        if (item.id === eq) { btn.textContent = 'EQUIPPED'; btn.className = 'on'; }
        else if (ic.owns(item.id)) { btn.textContent = 'EQUIP'; }
        else { btn.className = 'buy'; btn.textContent = `BUY · ${fmt(item.price)} ${IC_SHORT}`; btn.disabled = ic.balance < item.price; if (btn.disabled) btn.title = `Need ${fmt(item.price - ic.balance)} more IC`; }
        card.append(sw, el('span', 'ic-item-name', item.name), btn); grid.append(card);
      }
      parts.push(grid);
    }
    root.replaceChildren(...parts);
    this.tick();
  }

  paintSwatch(sw, item) {
    if (item.slot === 'camo') {
      const base = item.value == null ? '#3b4450' : hex(item.value);
      sw.style.background = `linear-gradient(135deg, ${base} 0%, ${base} 45%, rgba(0,0,0,.35) 46%, ${base} 60%), ${base}`;
      sw.innerHTML = '<svg viewBox="0 0 120 40" width="96" height="32" aria-hidden="true"><path d="M6 17h70l6-5h22v8H82l-5 4H40l-6 12h-9l3-12H6z" fill="rgba(5,8,12,.55)"/></svg>';
    } else if (item.slot === 'crosshair') {
      sw.style.background = '#0b1219';
      sw.innerHTML = `<svg viewBox="0 0 40 40" width="38" height="38" aria-hidden="true"><g fill="${item.value}"><rect x="19" y="5" width="2" height="9"/><rect x="19" y="26" width="2" height="9"/><rect x="5" y="19" width="9" height="2"/><rect x="26" y="19" width="9" height="2"/></g><circle cx="20" cy="20" r="1.4" fill="#fff"/></svg>`;
    } else {
      sw.style.background = '#0b1219';
      const c = item.value || 'rgba(156,170,184,.35)';
      const tag = el('span', '', (document.getElementById('if-player-name')?.textContent || 'OPERATOR').slice(0, 14)); tag.style.cssText = `padding:6px 12px;border:1px solid ${c};border-left:3px solid ${c};font:700 11px 'JetBrains Mono',monospace;letter-spacing:1.6px;color:${item.value || '#F1F5F9'}`;
      sw.append(tag);
    }
  }

  onShopClick(e) {
    const btn = e.target.closest('[data-icitem]'); if (!btn || btn.disabled) return;
    const id = btn.dataset.icitem, item = SHOP.find(i => i.id === id);
    if (this.ic.owns(id)) { if (this.ic.equip(id)) { this.toast('EQUIPPED — ' + item.name); this.onEquip(item); } }
    else {
      const r = this.ic.buy(id);
      if (r.ok) { this.toast(`PURCHASED — ${item.name} · −${fmt(item.price)} ${IC_SHORT}`); this.onEquip(item); }
      else if (r.reason === 'NOT_ENOUGH_IC') this.toast('NOT ENOUGH IRON CREDITS');
    }
    this.sfx?.click?.();
    this.render();
  }


  showSummary(sum) {
    const box = document.getElementById('tdm-ic-summary'); if (!box) return;
    if (!sum || sum.training) { box.hidden = true; return; }
    const head = el('div', 'ic-sum-head');
    const left = el('span'); left.innerHTML = COIN.replace('ic-coin', 'ic-coin" style="width:16px;height:16px;vertical-align:-3px;margin-right:6px'); left.append('IRON CREDITS EARNED');
    head.append(left, el('b', '', `+${fmt(sum.total)} ${IC_SHORT}`));
    const ul = el('ul');
    for (const l of sum.lines) { const li = el('li', '', l.count > 1 ? `${l.label} ×${l.count}` : l.label); li.append(el('b', '', `+${fmt(l.ic)}`)); ul.append(li); }
    if (!sum.lines.length) ul.append(el('li', '', 'No IC this match'));
    const foot = el('div', 'ic-sum-foot', `BALANCE ${fmt(sum.balance)} ${IC_SHORT}` + (sum.capped ? ' · DAILY MATCH CAP REACHED' : ` · ${fmt(sum.capLeft)} LEFT FROM MATCHES TODAY`));
    box.replaceChildren(head, ul, foot); box.hidden = false;
  }
}
