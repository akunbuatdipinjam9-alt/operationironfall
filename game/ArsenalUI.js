
import { CHARACTERS, DEFAULT_CHARACTER, FREE_WEAPONS, LOADOUT_SIZE, characterById, weaponPrice, weaponKey, characterKey,
  loadLoadout, saveLoadout, assignSlot, sanitizeLoadout } from './Arsenal.js';
import { portraitSvg } from './OperatorLook.js';
import { OperatorPreview, PREVIEW_ANIMS } from './OperatorPreview.js';

const CHAR_KEY = 'ironfall.character.v1';
const fmt = n => Math.max(0, n | 0).toLocaleString('en-US');
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

const CSS = `
.ar-bar{display:flex;flex-wrap:wrap;align-items:center;gap:10px;margin:0 0 16px;padding:12px 14px;background:rgba(10,16,24,.78);border:1px solid rgba(255,138,53,.35);border-left:3px solid #FF8A35;border-radius:2px}
.ar-bar h4{margin:0 8px 0 0;font:700 11px 'JetBrains Mono',monospace;letter-spacing:2px;color:#FF8A35}
.ar-bar h4 small{display:block;margin-top:3px;color:#9CAAB8;font-size:9px;letter-spacing:1.4px}
.ar-slot{display:flex;align-items:center;gap:9px;min-width:170px;padding:8px 11px;background:rgba(17,27,37,.85);border:1px solid rgba(156,170,184,.25);border-radius:2px;color:#F1F5F9;cursor:pointer;text-align:left}
.ar-slot b{display:grid;place-items:center;width:22px;height:22px;border-radius:2px;background:#1f2b38;font:700 12px 'JetBrains Mono',monospace;color:#FFAD72}
.ar-slot span{font:700 12px Rajdhani,'Inter',sans-serif;letter-spacing:1.4px}
.ar-slot small{display:block;font:600 8.5px 'JetBrains Mono',monospace;letter-spacing:1.2px;color:#9CAAB8}
.ar-slot.active{border-color:#FF8A35;box-shadow:0 0 0 1px #FF8A35 inset}
.ar-slot.active b{background:#FF8A35;color:#0a121b}
.ar-hint{flex:1 1 100%;font:600 9.5px 'JetBrains Mono',monospace;letter-spacing:.8px;color:#64748b}
.if-weapon.locked .if-weapon-art{filter:grayscale(.85) brightness(.6)}
.if-weapon .ar-badge{position:absolute;top:8px;right:8px;padding:3px 7px;border-radius:2px;font:700 9px 'JetBrains Mono',monospace;letter-spacing:1.2px;background:#FF8A35;color:#0a121b;z-index:2}
.if-weapon .ar-badge.lock{background:rgba(10,16,24,.9);color:#FFAD72;border:1px solid rgba(255,138,53,.5)}
.if-weapon .ar-badge.free{background:rgba(52,211,153,.16);color:#6ee7b7;border:1px solid rgba(52,211,153,.4)}
.if-weapon{position:relative}
.ar-btns{display:flex;gap:6px}
.ar-btns button{flex:1}
.if-weapon-equip.ar-buy{border-color:#FF8A35!important;color:#FFAD72!important;background:rgba(255,138,53,.12)!important}
.if-weapon-equip.ar-buy:disabled{opacity:.45;cursor:not-allowed}
.ar-shoptabs{display:flex;gap:6px;max-width:1180px;margin:0 auto 18px;padding:4px;background:rgba(8,13,20,.7);border:1px solid rgba(156,170,184,.16);border-radius:2px}
.ar-shoptabs button{flex:1;padding:10px 0;background:transparent;border:1px solid transparent;border-radius:2px;color:#9CAAB8;font:700 11px 'JetBrains Mono',monospace;letter-spacing:2px;cursor:pointer;transition:color .15s,background .15s}
.ar-shoptabs button:hover{color:#F1F5F9}
.ar-shoptabs button[aria-selected=true]{background:rgba(255,138,53,.14);border-color:#FF8A35;color:#FFAD72}
.ar-opview{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(260px,1fr);gap:14px;max-width:1180px;margin:0 auto 16px}
.ar-op3d{position:relative;height:440px;background:radial-gradient(ellipse at 50% 70%,#1d2a38 0%,#0b1219 70%);border:1px solid rgba(156,170,184,.2);border-radius:2px;overflow:hidden;touch-action:none}
.ar-op3d canvas{position:absolute;inset:0;width:100%!important;height:100%!important;display:block;cursor:grab}
.ar-op3d canvas:active{cursor:grabbing}
.ar-op3d-tag,.ar-op3d-hint{position:absolute;z-index:1;pointer-events:none;font:700 9px 'JetBrains Mono',monospace;letter-spacing:1.8px}
.ar-op3d-tag{top:12px;left:14px;color:#FF8A35}.ar-op3d-hint{bottom:12px;left:14px;color:#64748b}
.ar-op3d-anims{position:absolute;z-index:2;right:10px;top:10px;display:flex;flex-direction:column;gap:4px}
.ar-op3d-anims button{padding:5px 9px;background:rgba(8,13,20,.8);border:1px solid rgba(156,170,184,.28);border-radius:2px;color:#9CAAB8;font:700 8.5px 'JetBrains Mono',monospace;letter-spacing:1.4px;cursor:pointer;text-align:left}
.ar-op3d-anims button[aria-pressed=true]{border-color:#FF8A35;color:#FFAD72;background:rgba(255,138,53,.14)}
.ar-op3d .ar-op-svg{position:absolute;inset:0;display:grid;place-items:center}.ar-op3d .ar-op-svg svg{height:92%}
.ar-opinfo{display:flex;flex-direction:column;gap:10px;padding:18px;background:linear-gradient(155deg,rgba(17,27,37,.92),rgba(8,13,20,.9));border:1px solid rgba(156,170,184,.2);border-left:3px solid #FF8A35;border-radius:2px}
.ar-opinfo button{margin-top:auto;padding:12px 0;border-radius:2px;border:1px solid rgba(156,170,184,.28);background:rgba(17,27,37,.85);color:#F1F5F9;font:700 11px 'JetBrains Mono',monospace;letter-spacing:1.6px;cursor:pointer}
.ar-opinfo button.buy{border-color:#FF8A35;background:#FF8A35;color:#0a121b}
.ar-opinfo button.on{border-color:#FF8A35;color:#FFAD72;cursor:default}
.ar-opinfo button:disabled:not(.on){opacity:.45;cursor:not-allowed;background:rgba(255,138,53,.14);color:#FFAD72}
.ar-hp{display:flex;align-items:center;gap:8px;font:700 10px 'JetBrains Mono',monospace;color:#F1F5F9}
.ar-hp i{flex:1;height:5px;background:rgba(156,170,184,.16);border-radius:2px;overflow:hidden}
.ar-hp i u{display:block;height:100%;background:linear-gradient(90deg,#34d399,#FF8A35)}
.ar-ab{font:700 9.5px 'JetBrains Mono',monospace;letter-spacing:.8px;color:#FFAD72;padding:6px 8px;border:1px dashed rgba(255,138,53,.45);border-radius:2px}
.ar-op-name-lg{font-size:28px!important;letter-spacing:3px!important}
.ar-hp-lg i{height:8px!important}
.ar-op-price{font:700 10px 'JetBrains Mono',monospace;letter-spacing:1.2px;color:#9CAAB8}
.ar-ops{display:grid;grid-template-columns:repeat(auto-fill,minmax(108px,1fr));gap:10px;max-width:1180px;margin:0 auto}
.ar-op{display:flex;flex-direction:column;padding:0;text-align:left;background:linear-gradient(155deg,rgba(17,27,37,.92),rgba(8,13,20,.9));border:1px solid rgba(156,170,184,.2);border-radius:2px;overflow:hidden;cursor:pointer;color:inherit;transition:border-color .15s,transform .15s}
.ar-op:hover{border-color:rgba(255,138,53,.6);transform:translateY(-2px)}
.ar-op.inspected{border-color:#FFAD72;box-shadow:0 0 0 1px #FFAD72 inset}
.ar-op.selected .ar-op-sub{color:#FFAD72}
.ar-op.locked .ar-op-thumb{filter:grayscale(.6) brightness(.75)}
.ar-op-thumb{aspect-ratio:240/300;background:radial-gradient(ellipse at 50% 70%,#1d2a38 0%,#0b1219 75%);display:grid;place-items:center;overflow:hidden}
.ar-op-thumb img,.ar-op-thumb svg{width:100%;height:100%;object-fit:cover;display:block}
.ar-op-body{display:flex;flex-direction:column;gap:3px;padding:7px 8px 9px}
.ar-op-name{font:700 12px Rajdhani,'Inter',sans-serif;letter-spacing:1.4px;color:#F1F5F9}
.ar-op-sub{font:700 8.5px 'JetBrains Mono',monospace;letter-spacing:.8px;color:#9CAAB8}
.ar-op-role{font:700 9px 'JetBrains Mono',monospace;letter-spacing:1.6px;color:#FF8A35}
.ar-op-desc{font:500 12px/1.5 'Inter',sans-serif;color:#9CAAB8;margin:0}
@media (max-width:860px){.ar-opview{grid-template-columns:1fr}.ar-op3d{height:340px}.ar-shoptabs button{font-size:9.5px;letter-spacing:1px}}
.ar-redeem{display:flex;flex-wrap:wrap;gap:8px;align-items:center;max-width:1180px;margin:0 auto 22px;padding:12px 14px;background:rgba(10,16,24,.7);border:1px solid rgba(156,170,184,.16);border-radius:2px}
.ar-redeem h4{margin:0 10px 0 0;font:700 10px 'JetBrains Mono',monospace;letter-spacing:2px;color:#FF8A35}
.ar-redeem input{flex:1 1 220px;min-width:0;padding:9px 11px;background:#0b1219;border:1px solid rgba(156,170,184,.3);border-radius:2px;color:#F1F5F9;font:700 12px 'JetBrains Mono',monospace;letter-spacing:2px;text-transform:uppercase}
.ar-redeem input:focus{outline:none;border-color:#FF8A35}
.ar-redeem button{padding:9px 16px;border-radius:2px;border:1px solid #FF8A35;background:rgba(255,138,53,.14);color:#FFAD72;font:700 10px 'JetBrains Mono',monospace;letter-spacing:1.6px;cursor:pointer}
.ar-redeem output{flex:1 1 100%;font:600 10px 'JetBrains Mono',monospace;letter-spacing:.8px;color:#9CAAB8;min-height:13px}
.ar-redeem output.ok{color:#6ee7b7}.ar-redeem output.bad{color:#fca5a5}
#hud-ability{position:fixed;left:50%;bottom:92px;transform:translateX(-50%);z-index:30;display:none;align-items:center;gap:8px;padding:6px 11px;background:rgba(8,13,20,.82);border:1px solid rgba(255,138,53,.55);border-radius:2px;font:700 10px 'JetBrains Mono',monospace;letter-spacing:1.4px;color:#F1F5F9;pointer-events:none}
#hud-ability kbd{display:grid;place-items:center;width:20px;height:20px;border-radius:2px;background:#FF8A35;color:#0a121b;font:inherit}
#hud-ability.cooling{border-color:rgba(156,170,184,.35);color:#9CAAB8}
#hud-ability.cooling kbd{background:#334155;color:#cbd5e1}
body.ar-has-ability #hud-ability{display:flex}
@media (max-width:760px){.ar-slot{min-width:0;flex:1 1 30%}#hud-ability{bottom:150px}}
`;

export class ArsenalUI {
  constructor({ ic, catalog, storage = null, toast = () => {}, sfx = null, onChange = () => {} }) {
    this.ic = ic; this.catalog = catalog; this.storage = storage; this.toast = toast; this.sfx = sfx; this.onChange = onChange;
    this.activeSlot = 0; this.inspected = null; this.preview = null; this.PreviewClass = OperatorPreview;
    this.slots = loadLoadout(storage, catalog.length, i => this.ownsWeapon(i));
    let c = DEFAULT_CHARACTER; try { c = storage?.getItem(CHAR_KEY) || DEFAULT_CHARACTER; } catch {               }
    this.character = this.ownsCharacter(c) ? characterById(c).id : DEFAULT_CHARACTER;
  }


  ownsWeapon(i) { return FREE_WEAPONS.includes(i) || this.ic.ownsUnlock(weaponKey(i)); }
  ownsCharacter(id) { const c = characterById(id); return c.price === 0 || this.ic.ownsUnlock(characterKey(c.id)); }
  get char() { return characterById(this.character); }

  revalidate() { this.slots = sanitizeLoadout(this.slots, this.catalog.length, i => this.ownsWeapon(i)); }


  setSlot(slot, idx) {
    if (!this.ownsWeapon(idx)) return false;
    this.slots = assignSlot(this.slots, slot, idx);
    saveLoadout(this.storage, this.slots);
    this.toast(`SLOT ${slot + 1} — ${this.catalog[idx].name}`);
    this.activeSlot = (slot + 1) % LOADOUT_SIZE;
    this.renderBar(); this.onChange();
    return true;
  }
  buyWeapon(idx) {
    const w = this.catalog[idx]; if (!w) return;
    const r = this.ic.buyUnlock(weaponKey(idx), weaponPrice(w));
    if (r.ok) { this.toast(`UNLOCKED — ${w.name} · −${fmt(weaponPrice(w))} IC`); this.setSlot(this.activeSlot, idx); }
    else this.toast(r.reason === 'NOT_ENOUGH_IC' ? `NEED ${fmt(weaponPrice(w) - this.ic.balance)} MORE IC` : 'ALREADY OWNED');
    this.sfx?.click?.(); this.onChange();
  }

  weaponButtons(i) {
    const w = this.catalog[i];
    if (!this.ownsWeapon(i)) {
      const p = weaponPrice(w), can = this.ic.balance >= p;
      return `<button type="button" class="if-weapon-equip ar-buy" data-buyw="${i}"${can ? '' : ' disabled'}>${can ? 'BUY' : 'LOCKED'} · ${fmt(p)} IC</button>`;
    }
    const at = this.slots.indexOf(i);
    return `<button type="button" class="if-weapon-equip${at >= 0 ? ' is-equipped' : ''}" data-equip="${i}">${at >= 0 ? `IN SLOT ${at + 1}` : `PUT IN SLOT ${this.activeSlot + 1}`}</button>`;
  }
  weaponBadge(i) {
    if (FREE_WEAPONS.includes(i)) return '<span class="ar-badge free">FREE</span>';
    if (!this.ownsWeapon(i)) return `<span class="ar-badge lock">&#128274; ${fmt(weaponPrice(this.catalog[i]))} IC</span>`;
    const at = this.slots.indexOf(i); return at >= 0 ? `<span class="ar-badge">SLOT ${at + 1}</span>` : '';
  }

  handleClick(e) {
    const buy = e.target.closest('[data-buyw]'); if (buy) { if (!buy.disabled) this.buyWeapon(Number(buy.dataset.buyw)); return true; }
    const eq = e.target.closest('[data-equip]'); if (eq) { const i = Number(eq.dataset.equip); const at = this.slots.indexOf(i); if (at >= 0) { this.activeSlot = at; this.renderBar(); this.onChange(); } else this.setSlot(this.activeSlot, i); this.sfx?.click?.(); return true; }
    const slot = e.target.closest('[data-arslot]'); if (slot) { this.activeSlot = Number(slot.dataset.arslot); this.renderBar(); this.onChange(); this.sfx?.click?.(); return true; }
    return false;
  }

  mountLoadout() {
    const view = document.getElementById('if-view-loadout'); if (!view || document.getElementById('ar-bar')) return;
    const h2 = view.querySelector('.if-sub-head h2 small'); if (h2) h2.textContent = 'Bring three weapons. Switch with 1, 2 or 3.';
    const bar = el('div', 'ar-bar'); bar.id = 'ar-bar';
    view.querySelector('.if-sub-body')?.prepend(bar);
    bar.addEventListener('click', e => this.handleClick(e));
    this.renderBar();
  }
  renderBar() {
    const bar = document.getElementById('ar-bar'); if (!bar) return;
    const h = el('h4', '', 'LOADOUT'); h.append(el('small', '', 'PICK 3 WEAPONS'));
    const parts = [h];
    this.slots.forEach((idx, s) => {
      const b = el('button', 'ar-slot' + (s === this.activeSlot ? ' active' : '')); b.type = 'button'; b.dataset.arslot = s;
      const t = el('div'); t.append(el('span', '', this.catalog[idx]?.name || '—'), el('small', '', `${this.catalog[idx]?.category || ''} · KEY ${s + 1}`));
      b.append(el('b', '', String(s + 1)), t); parts.push(b);
    });
    parts.push(el('div', 'ar-hint', `Click a slot, then a weapon. ${FREE_WEAPONS.length} weapons are free; the other ${this.catalog.length - FREE_WEAPONS.length} unlock with IRON CREDITS. Saved in this browser.`));
    bar.replaceChildren(...parts);
  }


  static SHOP_TABS = [['loadout', 'WEAPONS'], ['operators', 'OPERATORS'], ['shop', 'ITEMS & REDEEM']];
  mountShopTabs() {
    for (const id of ['if-view-loadout', 'if-view-operators', 'if-view-shop']) {
      const head = document.querySelector('#' + id + ' .if-sub-head'); if (!head || head.nextElementSibling?.classList.contains('ar-shoptabs')) continue;
      const h2 = head.querySelector('h2'), sub = { 'if-view-loadout': 'WEAPONS · PICK 3 · KEYS 1 · 2 · 3', 'if-view-operators': 'OPERATORS · ' + CHARACTERS.length + ' CHARACTERS · BOTS PICK AT RANDOM', 'if-view-shop': 'ITEMS · CHALLENGES · REDEEM' }[id];
      if (h2) { const small = h2.querySelector('small'); h2.firstChild.textContent = 'SHOP'; if (small) small.textContent = sub; }
      const bar = el('div', 'ar-shoptabs'); bar.setAttribute('role', 'tablist');
      for (const [tab, label] of ArsenalUI.SHOP_TABS) { const b = el('button', '', label); b.type = 'button'; b.dataset.iftab = tab; b.setAttribute('role', 'tab'); bar.append(b); }
      head.after(bar);
    }
  }

  syncShopTabs(tab) {
    const inShop = ArsenalUI.SHOP_TABS.some(([t]) => t === tab);
    document.querySelectorAll('.ar-shoptabs [data-iftab]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.iftab === tab)));
    this.preview?.setActive(tab === 'operators');
    if (tab === 'operators') this.renderOperators();
    return inShop;
  }


  mountOperators() {
    const loadout = document.getElementById('if-view-loadout');
    if (loadout && !document.getElementById('if-view-operators')) {
      const sec = el('section', 'if-subpanel'); sec.id = 'if-view-operators'; sec.hidden = true;
      sec.innerHTML = `<div class="if-sub-head"><h2>OPERATORS<small>${CHARACTERS.length} CHARACTERS · DIFFERENT HEALTH · BOTS PICK AT RANDOM</small></h2><button type="button" class="if-back-btn" data-ifback="home">&#8592; BACK</button></div>
        <div class="if-sub-body"><div class="ar-opview"><div class="ar-op3d" id="ar-op3d"><span class="ar-op3d-tag">3D OPERATOR // 360&deg;</span><span class="ar-op3d-hint">DRAG ROTATE &bull; DOUBLE-CLICK RESET</span><div class="ar-op3d-anims" id="ar-op3d-anims" role="group" aria-label="Preview animation"></div></div><div class="ar-opinfo" id="ar-opinfo"></div></div><div class="ar-ops" id="ar-ops"></div></div>`;
      loadout.after(sec);
      sec.addEventListener('click', e => {
        const b = e.target.closest('[data-op]'); if (b) { if (!b.disabled) this.onOperator(b.dataset.op); return; }
        const an = e.target.closest('[data-opanim]'); if (an) { this.preview?.setAnim(an.dataset.opanim); sec.querySelectorAll('[data-opanim]').forEach(x => x.setAttribute('aria-pressed', String(x === an))); this.sfx?.click?.(); return; }
        const card = e.target.closest('[data-opcard]'); if (card) { this.inspected = card.dataset.opcard; this.sfx?.click?.(); this.renderOperators(); }
      });
      try { this.preview = new this.PreviewClass(document.getElementById('ar-op3d')); if (!this.preview.ok) this.preview = null; } catch (e) { console.warn('[Operators] 3D preview unavailable:', e.message); this.preview = null; }
      if (!this.preview) document.getElementById('ar-op3d')?.classList.add('is-fallback');
      else document.getElementById('ar-op3d-anims')?.append(...PREVIEW_ANIMS.map(([name], i) => { const b = el('button', '', name); b.type = 'button'; b.dataset.opanim = name; b.setAttribute('aria-pressed', String(i === 0)); return b; }));
    }
    this.renderOperators();
  }
  onOperator(id) {
    const c = characterById(id);
    if (!this.ownsCharacter(id)) {
      const r = this.ic.buyUnlock(characterKey(id), c.price);
      if (!r.ok) { this.toast(r.reason === 'NOT_ENOUGH_IC' ? `NEED ${fmt(c.price - this.ic.balance)} MORE IC` : 'ALREADY OWNED'); return; }
      this.toast(`UNLOCKED — ${c.name} · −${fmt(c.price)} IC`);
    }
    this.character = c.id; this.inspected = c.id; try { this.storage?.setItem(CHAR_KEY, c.id); } catch {                    }
    this.toast(`OPERATOR — ${c.name} · ${c.hp} HP`);
    this.sfx?.click?.(); this.renderOperators(); this.onChange();
  }
  opButton(c) {
    const own = this.ownsCharacter(c.id), sel = c.id === this.character, b = el('button'); b.type = 'button'; b.dataset.op = c.id;
    if (sel) { b.className = 'on'; b.textContent = 'SELECTED'; b.disabled = true; }
    else if (own) b.textContent = c.price === 0 ? 'SELECT · FREE' : 'SELECT';
    else { b.className = 'buy'; b.textContent = `BUY · ${fmt(c.price)} IC`; if (this.ic.balance < c.price) { b.disabled = true; b.title = `Need ${fmt(c.price - this.ic.balance)} more IC`; } }
    return b;
  }
  renderOperators() {
    const host = document.getElementById('ar-ops'), info = document.getElementById('ar-opinfo'); if (!host) return;
    const view = document.getElementById('if-view-operators'), visible = view && !view.hidden;
    const maxHp = Math.max(...CHARACTERS.map(c => c.hp)), ins = characterById(this.inspected || this.character);
    this.inspected = ins.id;
    if (visible && this.preview) this.preview.show(ins.id);
    if (!this.preview) { const st = document.getElementById('ar-op3d'); const old = st?.querySelector('.ar-op-svg'); if (st) { const d = el('div', 'ar-op-svg'); d.innerHTML = portraitSvg(ins.id); old ? old.replaceWith(d) : st.prepend(d); } }

    if (info) {
      const hp = el('div', 'ar-hp ar-hp-lg'); const bar = el('i'); const fill = el('u'); fill.style.width = (ins.hp / maxHp * 100).toFixed(1) + '%'; bar.append(fill); hp.append(el('span', '', `${ins.hp} HP`), bar);
      const parts = [el('span', 'ar-op-role', ins.role.toUpperCase()), el('span', 'ar-op-name ar-op-name-lg', ins.name), hp, el('p', 'ar-op-desc', ins.desc)];
      if (ins.ability) parts.push(el('div', 'ar-ab', `[${ins.ability.key}] ${ins.ability.name}: ${ins.ability.count} × ${ins.ability.hp} HP · ${ins.ability.lifeSec}s · CD ${ins.ability.cooldownSec}s`));
      parts.push(el('div', 'ar-op-price', ins.price ? (this.ownsCharacter(ins.id) ? 'OWNED' : `PRICE ${fmt(ins.price)} IC · BALANCE ${fmt(this.ic.balance)} IC`) : 'FREE OPERATOR'), this.opButton(ins));
      info.replaceChildren(...parts);
    }

    host.replaceChildren(...CHARACTERS.map(c => {
      const sel = c.id === this.character, insp = c.id === ins.id;
      const card = el('button', 'ar-op' + (sel ? ' selected' : '') + (insp ? ' inspected' : '')); card.type = 'button'; card.dataset.opcard = c.id; card.setAttribute('aria-label', c.name);
      const art = el('div', 'ar-op-thumb'), url = visible && this.preview ? this.preview.thumbnail(c.id) : this.preview?.thumbs.get(c.id);
      if (url) { const img = el('img'); img.src = url; img.alt = ''; img.draggable = false; art.append(img); } else art.innerHTML = portraitSvg(c.id);
      const meta = el('div', 'ar-op-body');
      meta.append(el('span', 'ar-op-name', c.name), el('span', 'ar-op-sub', `${c.hp} HP · ` + (sel ? 'SELECTED' : this.ownsCharacter(c.id) ? 'OWNED' : `${fmt(c.price)} IC`)));
      if (!this.ownsCharacter(c.id)) card.classList.add('locked');
      card.append(art, meta); return card;
    }));
  }


  mountRedeem() {
    const shop = document.getElementById('ic-shop'); if (!shop || document.getElementById('ar-redeem')) return;
    const box = el('form', 'ar-redeem'); box.id = 'ar-redeem'; box.autocomplete = 'off';
    const input = el('input'); input.name = 'code'; input.placeholder = 'ENTER CODE'; input.maxLength = 24; input.setAttribute('aria-label', 'Redeem code');
    const btn = el('button', '', 'REDEEM'); btn.type = 'submit';
    const out = el('output'); out.setAttribute('aria-live', 'polite');
    box.append(el('h4', '', 'REDEEM CODE'), input, btn, out);
    shop.before(box);
    box.addEventListener('submit', e => {
      e.preventDefault();
      const r = this.ic.redeem(input.value);
      out.className = r.ok ? 'ok' : 'bad';
      out.textContent = r.ok ? `REDEEMED — ${r.reward.label}` : r.reason === 'USED' ? 'CODE ALREADY USED IN THIS BROWSER' : r.reason === 'EMPTY' ? 'TYPE A CODE FIRST' : 'INVALID CODE';
      if (r.ok) { input.value = ''; this.toast('REDEEMED — ' + r.reward.label); this.revalidate(); this.onChange(); }
      this.sfx?.click?.();
    });
  }


  mountHud() {
    if (document.getElementById('hud-ability')) return;
    const h = el('div'); h.id = 'hud-ability'; h.append(el('kbd', '', 'P'), el('span', '', ''));
    document.body.append(h);
    if (!document.getElementById('ar-style')) { const s = el('style'); s.id = 'ar-style'; s.textContent = CSS; document.head.append(s); }
  }

  hudAbility(ability, cooldownLeft) {
    document.body.classList.toggle('ar-has-ability', !!ability);
    const h = document.getElementById('hud-ability'); if (!h || !ability) return;
    const cool = cooldownLeft > 0;
    h.classList.toggle('cooling', cool);
    const t = h.querySelector('span'), txt = cool ? `${ability.name} · ${Math.ceil(cooldownLeft)}s` : `${ability.name} · READY`;
    if (t.textContent !== txt) t.textContent = txt;
  }

  mount() { this.mountHud(); this.mountLoadout(); this.mountOperators(); this.mountRedeem(); this.mountShopTabs(); }
}
