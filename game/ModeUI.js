import { gameStorage } from '../storage/IronStore.js';



import { MODES, MODE_IDS, NETWORK_ONLY_MODE_IDS, EVENT_MODE_IDS, HARDCORE_DEFAULTS, normalizeHardcore } from './GameModes.js';
const ALL_IDS = [...MODE_IDS, ...NETWORK_ONLY_MODE_IDS];
const PICKER_IDS = [...EVENT_MODE_IDS, ...ALL_IDS];  

const TEAM_KEY = 'ironfall.meleeTeam.v1', MODE_KEY = 'ironfall.mode.v1', HC_KEY = 'ironfall.hardcore.v1', BOSS_KEY = 'ironfall.raidboss.v1';
export const RAID_BOSS_CHOICES = [{ id: 'WARDEN', label: 'WARDEN MK-IV', hp: '7,000+' }, { id: 'SYIRIL', label: 'SYIRIL', hp: '20,000' }];
const store = { get(k, d) { try { const v = JSON.parse(gameStorage.getItem(k) || 'null'); return v ?? d; } catch { return d; } }, set(k, v) { try { gameStorage.setItem(k, JSON.stringify(v)); } catch { } } };

const CSS = `
#if-mode-picker{position:fixed;inset:0;z-index:90;display:grid;place-items:center;background:rgba(3,7,12,.74)}#if-mode-picker[hidden]{display:none}
.if-mp-box{width:min(620px,92vw);max-height:90vh;overflow:auto;background:#0C1018;border:1px solid rgba(156,170,184,.22);padding:20px 20px 14px;color:#e2e8f0}
.if-mp-head{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px}.if-mp-head small{font:600 10px 'JetBrains Mono',monospace;letter-spacing:2.4px;color:#FF8A35}
.if-mp-head h3{margin:3px 0 0;font:700 24px Rajdhani,Inter,sans-serif;letter-spacing:3px}.if-mp-x{background:none;border:1px solid rgba(156,170,184,.3);color:#cbd5e1;width:32px;height:32px;cursor:pointer}
.if-mp-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.if-mp-card{position:relative;display:flex;flex-direction:column;gap:5px;padding:14px 44px 14px 14px;background:rgba(17,27,37,.9);border:1px solid rgba(156,170,184,.2);cursor:pointer;transition:border-color .15s,background .15s;outline:none}
.if-mp-card b{font:700 15px Rajdhani,Inter,sans-serif;letter-spacing:2px;color:#f1f5f9}.if-mp-card span{font:600 9.5px 'JetBrains Mono',monospace;letter-spacing:1px;color:#94a3b8;line-height:1.5}
.if-mp-card:hover,.if-mp-card.focus{border-color:#FF8A35;background:rgba(40,24,12,.6)}.if-mp-card[aria-checked="true"]{box-shadow:inset 3px 0 0 #FF8A35}
.if-mp-gear{position:absolute;top:10px;right:10px;width:28px;height:28px;background:transparent;border:1px solid rgba(255,138,53,.5);color:#FFAD72;cursor:pointer}
.if-mp-boss{position:absolute;top:10px;right:10px;padding:5px 8px;background:rgba(10,16,24,.9);border:1px solid rgba(255,138,53,.55);color:#FFAD72;font:700 9px 'JetBrains Mono',monospace;letter-spacing:1.2px;cursor:pointer}
.if-mp-card[data-mode="RAID"]{padding-right:118px}
.if-mp-sec{grid-column:1/-1;margin:10px 0 0;font:700 10px 'JetBrains Mono',monospace;letter-spacing:2px;color:#5ad8ff;display:flex;justify-content:space-between;gap:8px}.if-mp-sec i{font-style:normal;color:#64748b;letter-spacing:1px}
.if-mp-card.net{border-color:rgba(90,216,255,.25)}.if-mp-card.net:hover,.if-mp-card.net.focus{border-color:#5ad8ff;background:rgba(10,34,46,.6)}
.if-mp-tag{position:absolute;top:10px;right:10px;padding:4px 7px;border:1px solid rgba(90,216,255,.5);color:#8be3ff;background:rgba(10,16,24,.9);font:700 9px 'JetBrains Mono',monospace;letter-spacing:1px;cursor:pointer}
.if-mp-card.net{padding-right:96px}
.if-mp-agent{display:flex;align-items:center;gap:8px;margin-right:8px;padding:6px 10px;background:rgba(17,27,37,.9);border:1px solid rgba(255,138,53,.45);color:#FFAD72;font:700 10px 'JetBrains Mono',monospace;letter-spacing:1.2px;cursor:pointer}
.if-mp-agent b{color:#f1f5f9}.if-mp-hr{display:flex;align-items:center}
.if-mp-card[hidden],.if-mp-sec[hidden]{display:none!important}
.if-mp-card.evt{border-color:rgba(214,64,52,.45)}.if-mp-card.evt:hover,.if-mp-card.evt.focus{border-color:#ef4444;background:rgba(48,10,14,.6)}.if-mp-card.evt .if-mp-tag{border-color:rgba(239,68,68,.6);color:#fca5a5}
.if-mp-foot{margin-top:12px;font:600 9.5px 'JetBrains Mono',monospace;letter-spacing:1.2px;color:#64748b}
@media (max-width:640px){.if-mp-grid{grid-template-columns:1fr}}
#if-hc-dialog{z-index:96}
#if-hc-dialog{position:fixed;inset:0;z-index:95;display:grid;place-items:center;background:rgba(3,7,12,.72)}#if-hc-dialog[hidden]{display:none}
.if-hc-box{width:min(420px,92vw);background:#0C1018;border:1px solid rgba(156,170,184,.25);padding:20px;color:#e2e8f0;font:600 12px 'JetBrains Mono',monospace;letter-spacing:.6px}
.if-hc-box h3{margin:0 0 4px;font:700 18px Rajdhani,Inter,sans-serif;letter-spacing:2px}.if-hc-box p{margin:0 0 14px;color:#94a3b8;font-size:10.5px;line-height:1.6}
.if-hc-row{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:9px 0}.if-hc-row input[type=range]{width:150px;accent-color:#FF8A35}.if-hc-row input[type=checkbox]{accent-color:#FF8A35;width:16px;height:16px}
.if-hc-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:16px}.if-hc-actions button{font:700 11px 'JetBrains Mono',monospace;letter-spacing:1px;padding:8px 14px;border:1px solid rgba(156,170,184,.3);background:#111b25;color:#e2e8f0;cursor:pointer}.if-hc-actions button.primary{background:#FF8A35;border-color:#FF8A35;color:#14100b}
#hud-mode-strip{position:absolute;top:58px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;pointer-events:none;z-index:6}
.hud-mode-badge{font:700 10px 'JetBrains Mono',monospace;letter-spacing:2px;color:#FFAD72;background:rgba(8,13,20,.62);border:1px solid rgba(255,138,53,.35);padding:3px 10px}
.hud-rg{font:700 11px 'JetBrains Mono',monospace;letter-spacing:1px;color:#e2e8f0;background:rgba(8,13,20,.7);border:1px solid rgba(156,170,184,.25);padding:5px 12px;display:flex;gap:10px;align-items:center}
.hud-rg b{color:#FF8A35;font-size:13px;min-width:3.2em;text-align:right}.hud-rg.urgent b{color:#f87171}
.hud-raid{width:min(560px,80vw);background:rgba(8,13,20,.72);border:1px solid rgba(255,138,53,.35);padding:7px 12px 9px}
.hud-raid-top{display:flex;justify-content:space-between;font:700 11px 'JetBrains Mono',monospace;letter-spacing:1.4px;color:#e2e8f0;margin-bottom:5px}
.hud-raid-top span:last-child{color:#94a3b8}.hud-raid-bar{height:8px;background:#1b2330;position:relative;overflow:hidden}
.hud-raid-fill{position:absolute;inset:0 auto 0 0;background:linear-gradient(90deg,#c2410c,#FF8A35);transition:width .2s}
.hud-raid-ticks{position:absolute;inset:0;background:linear-gradient(90deg,transparent calc(33% - 1px),#0C1018 33%,transparent calc(33% + 1px),transparent calc(66% - 1px),#0C1018 66%,transparent calc(66% + 1px))}
.hud-raid-sub{display:flex;justify-content:space-between;margin-top:5px;font:600 9.5px 'JetBrains Mono',monospace;letter-spacing:1px;color:#94a3b8}
.hud-raid-sub .warn{color:#fca5a5}.hud-raid.shielded .hud-raid-fill{background:linear-gradient(90deg,#0e7490,#5ad8ff)}
@media (max-width:720px){#hud-mode-strip{top:44px}.hud-raid{width:90vw}}
#hud-mode-strip [hidden]{display:none!important}
body.hc-hide-crosshair #crosshair-wrap,body.hc-hide-crosshair #hud-hitmarker{visibility:hidden}
body.hc-hide-minimap #iron-radar{display:none!important}
body.hc-hide-markers #world-markers-layer{visibility:hidden}
body.hc-hide-ammo #hud-ammo-mag,body.hc-hide-ammo #hud-ammo-res{visibility:hidden}`;

export class ModeUI {
  constructor({ onModeChange = () => { }, onNetworkMode = null, onAgent = null, agentLabel = () => '' } = {}) {
    this.onModeChange = onModeChange; this.onNetworkMode = onNetworkMode; this.onAgent = onAgent; this.agentLabel = agentLabel;
    this.visible = id => !EVENT_MODE_IDS.includes(id);  
    this.teamSize = Math.max(1, Math.min(5, +store.get(TEAM_KEY, 5) || 5));
    this.mode = MODE_IDS.includes(store.get(MODE_KEY, 'TDM')) ? store.get(MODE_KEY, 'TDM') : 'TDM';
    this.hardcore = normalizeHardcore(store.get(HC_KEY, HARDCORE_DEFAULTS));
    this.raidBoss = RAID_BOSS_CHOICES.some(b => b.id === store.get(BOSS_KEY, 'WARDEN')) ? store.get(BOSS_KEY, 'WARDEN') : 'WARDEN';
    const st = document.createElement('style'); st.textContent = CSS; document.head.append(st);
  }

  mountPicker(playCard, onStart) {
    if (!playCard || this.picker) return;
    this.onStart = onStart;
    playCard.removeAttribute('onclick'); playCard.onclick = null;
    playCard.addEventListener('click', e => { e.preventDefault(); this.openPicker(); });
    const d = document.createElement('div'); d.id = 'if-mode-picker'; d.hidden = true; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Choose game mode');
    d.innerHTML = `<div class="if-mp-box"><div class="if-mp-head"><div><small>PLAY YOUR WAY</small><h3>GAME MODE</h3></div><div class="if-mp-hr"><button type="button" class="if-mp-agent" data-act="agent" title="Choose / roll your agent">AGENT <b></b></button><button type="button" class="if-mp-x" data-act="close" aria-label="Close">✕</button></div></div>
      <div class="if-mp-grid" role="radiogroup"></div><div class="if-mp-foot"><span>Enter to deploy · Esc to cancel</span></div></div>`;
    const grid = d.querySelector('.if-mp-grid');
    const renderCard = id => {
      const evt = EVENT_MODE_IDS.includes(id), net = evt || NETWORK_ONLY_MODE_IDS.includes(id);
      if (id === EVENT_MODE_IDS[0]) { const h = document.createElement('div'); h.className = 'if-mp-sec'; h.dataset.sec = 'event'; h.innerHTML = '<span>HALLOWEEN EVENT · LIMITED TIME</span>'; grid.append(h); }
      if (id === MODE_IDS[0]) { const h = document.createElement('div'); h.className = 'if-mp-sec'; h.dataset.sec = 'regular'; h.innerHTML = '<span>MODES</span>'; grid.append(h); }
      if (id === NETWORK_ONLY_MODE_IDS[0]) { const h = document.createElement('div'); h.className = 'if-mp-sec'; h.dataset.sec = 'server'; h.innerHTML = '<span>SERVER MODES · SOLO WITH BOTS</span>'; grid.append(h); }
      const card = document.createElement('div'); card.className = 'if-mp-card' + (net ? ' net' : '') + (evt ? ' evt' : ''); card.dataset.mode = id; card.hidden = !this.visible(id); card.setAttribute('role', 'radio'); card.tabIndex = -1;
      const name = document.createElement('b'); name.textContent = MODES[id].label;
      const sub = document.createElement('span'); sub.textContent = MODES[id].sub;
      card.append(name, sub);
      if (id === 'HARDCORE') { const g = document.createElement('button'); g.type = 'button'; g.className = 'if-mp-gear'; g.textContent = '⚙'; g.title = 'Hardcore settings'; g.setAttribute('aria-label', 'Hardcore settings'); g.addEventListener('click', e => { e.stopPropagation(); this.openHardcore(); }); card.append(g); }
      if (id === 'RAID') {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'if-mp-boss'; b.title = 'Choose the raid boss'; b.setAttribute('aria-label', 'Raid boss');
        const paint = () => { const c = RAID_BOSS_CHOICES.find(x => x.id === this.raidBoss); b.textContent = 'BOSS: ' + c.label; sub.textContent = MODES[id].sub + ' · ' + c.label + ' ' + c.hp + ' HP'; };
        b.addEventListener('click', e => { e.stopPropagation(); const i = RAID_BOSS_CHOICES.findIndex(x => x.id === this.raidBoss); this.raidBoss = RAID_BOSS_CHOICES[(i + 1) % RAID_BOSS_CHOICES.length].id; store.set(BOSS_KEY, this.raidBoss); paint(); });
        paint(); card.append(b);
      }
      if (id === 'MELEE_SHOWDOWN') {
        const t = document.createElement('button'); t.type = 'button'; t.className = 'if-mp-tag'; t.title = 'Team size'; t.setAttribute('aria-label', 'Team size');
        const paint = () => { t.textContent = `${this.teamSize}V${this.teamSize}`; }; paint();
        t.addEventListener('click', e => { e.stopPropagation(); this.teamSize = this.teamSize % 5 + 1; store.set(TEAM_KEY, this.teamSize); paint(); }); card.append(t);
      } else if (net) { const t = document.createElement('span'); t.className = 'if-mp-tag'; t.textContent = 'ONLINE'; card.append(t); }
      card.addEventListener('click', () => this.deploy(id));
      grid.append(card);
    };
    for (const id of EVENT_MODE_IDS) renderCard(id);
    for (const id of ALL_IDS) renderCard(id);
    d.addEventListener('click', e => { if (e.target.closest('[data-act="agent"]')) { this.closePicker(); this.onAgent?.(); return; } if (e.target === d || e.target.closest('[data-act="close"]')) this.closePicker(); });
    d.addEventListener('keydown', e => {
      if (e.key === 'Escape') { this.closePicker(); return; }
      const ids = PICKER_IDS.filter(this.visible), cols = innerWidth < 640 ? 1 : 2, cur = ids.indexOf(this.focusMode || this.mode);
      const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[e.key];
      if (step) { this.focusMode = ids[(cur + step + ids.length) % ids.length]; this.syncPicker(true); e.preventDefault(); }
      else if (e.key === 'Enter' && e.target.closest('.if-mp-card')) { this.deploy(this.focusMode || this.mode); e.preventDefault(); }
    });
    document.body.append(d); this.picker = d; this.syncSections(); this.select(this.mode, false);
  }
   
  applyEvent(visible) {
    this.visible = visible;
    this.picker?.querySelectorAll('.if-mp-card').forEach(c => { c.hidden = !visible(c.dataset.mode); });
    this.syncSections();
    if (!visible(this.mode)) { const next = MODE_IDS.find(visible); if (next) this.select(next); }
  }
  syncSections() {
    if (!this.picker) return;
    const groups = { event: EVENT_MODE_IDS, regular: MODE_IDS, server: NETWORK_ONLY_MODE_IDS };
    const eventOn = EVENT_MODE_IDS.some(this.visible);  
    this.picker.querySelectorAll('.if-mp-sec[data-sec]').forEach(h => { h.hidden = !groups[h.dataset.sec].some(this.visible) || (h.dataset.sec === 'regular' && !eventOn); });
  }
  openPicker() { if (!this.picker) return; const ag = this.picker.querySelector('.if-mp-agent b'); if (ag) ag.textContent = this.agentLabel() || 'DEFAULT'; this.focusMode = this.mode; this.picker.hidden = false; this.syncPicker(true); }
  closePicker() { if (this.picker) this.picker.hidden = true; }
  syncPicker(focus = false) {
    this.picker?.querySelectorAll('.if-mp-card').forEach(c => { const on = c.dataset.mode === (this.focusMode || this.mode); c.setAttribute('aria-checked', String(c.dataset.mode === this.mode)); c.classList.toggle('focus', on); c.tabIndex = on ? 0 : -1; if (on && focus) c.focus(); });
  }
  deploy(id) {
    if (!this.visible(id)) return;
    if (NETWORK_ONLY_MODE_IDS.includes(id) || EVENT_MODE_IDS.includes(id)) { this.focusMode = id; this.closePicker(); this.onNetworkMode?.(id, { teamSize: this.teamSize }); return; }
    this.select(id); this.closePicker(); this.onStart?.(id);
  }
  select(id, notify = true) {
    this.mode = MODE_IDS.includes(id) ? id : 'TDM'; store.set(MODE_KEY, this.mode);
    this.syncPicker();
    const label = document.querySelector('.if-play-mode'), sub = document.querySelector('.if-play-sub');
    if (label) label.textContent = MODES[this.mode].label; if (sub) sub.textContent = MODES[this.mode].sub;
    if (notify) this.onModeChange(this.mode);
  }
  openHardcore() {
    if (!this.dialog) {
      const d = document.createElement('div'); d.id = 'if-hc-dialog'; d.hidden = true; d.setAttribute('role', 'dialog'); d.setAttribute('aria-modal', 'true'); d.setAttribute('aria-label', 'Hardcore settings');
      d.innerHTML = `<div class="if-hc-box"><h3>HARDCORE SETTINGS</h3><p>Applies to Hardcore matches only. Health applies to players and bots alike.</p>
        <label class="if-hc-row">MAX HEALTH <span><input type="range" min="30" max="100" step="5" data-hc="health"> <b data-out="health"></b></span></label>
        <label class="if-hc-row">ENEMY BOT SKILL <span><input type="range" min="1" max="2" step="0.05" data-hc="botSkill"> <b data-out="botSkill"></b></span></label>
        <label class="if-hc-row">HIDE CROSSHAIR <input type="checkbox" data-hc="hideCrosshair"></label>
        <label class="if-hc-row">HIDE MINIMAP <input type="checkbox" data-hc="hideMinimap"></label>
        <label class="if-hc-row">HIDE ENEMY MARKERS <input type="checkbox" data-hc="hideEnemyMarkers"></label>
        <label class="if-hc-row">HIDE AMMO COUNT <input type="checkbox" data-hc="hideAmmoCount"></label>
        <label class="if-hc-row">DISABLE AUTO-HEAL <input type="checkbox" data-hc="disableAutoHeal"></label>
        <div class="if-hc-actions"><button type="button" data-act="reset">DEFAULTS</button><button type="button" data-act="close" class="primary">SAVE</button></div></div>`;
      document.body.append(d); this.dialog = d;
      const sync = () => { for (const i of d.querySelectorAll('[data-hc]')) { const k = i.dataset.hc; if (i.type === 'checkbox') i.checked = this.hardcore[k]; else i.value = this.hardcore[k]; const o = d.querySelector(`[data-out="${k}"]`); if (o) o.textContent = k === 'botSkill' ? '×' + this.hardcore[k].toFixed(2) : this.hardcore[k] + ' HP'; } };
      d.addEventListener('input', e => { const i = e.target.closest('[data-hc]'); if (!i) return; this.hardcore = normalizeHardcore({ ...this.hardcore, [i.dataset.hc]: i.type === 'checkbox' ? i.checked : +i.value }); store.set(HC_KEY, this.hardcore); sync(); });
      d.addEventListener('click', e => { const a = e.target.closest('[data-act]')?.dataset.act; if (a === 'reset') { this.hardcore = normalizeHardcore(HARDCORE_DEFAULTS); store.set(HC_KEY, this.hardcore); sync(); } else if (a === 'close' || e.target === d) this.closeHardcore(); });
      d.addEventListener('keydown', e => { if (e.key === 'Escape') this.closeHardcore(); });
      this.syncDialog = sync;
    }
    this.syncDialog(); this.dialog.hidden = false; this.dialog.querySelector('input')?.focus();
  }
  closeHardcore() { if (this.dialog) this.dialog.hidden = true; }


  mountHud(hudLayer) {
    if (!hudLayer || this.strip) return;
    const s = document.createElement('div'); s.id = 'hud-mode-strip';
    s.innerHTML = `<div class="hud-mode-badge" id="hud-mode-badge" hidden></div>
      <div class="hud-rg" id="hud-rg" hidden aria-live="polite"><span>NEXT RANDOM WEAPON</span><b id="hud-rg-time">1:35</b><span id="hud-rg-weapon"></span></div>
      <div class="hud-raid" id="hud-raid" hidden><div class="hud-raid-top"><span id="hud-raid-name"></span><span id="hud-raid-phase"></span></div>
        <div class="hud-raid-bar"><div class="hud-raid-fill" id="hud-raid-fill"></div><div class="hud-raid-ticks"></div></div>
        <div class="hud-raid-sub"><span id="hud-raid-hp"></span><span id="hud-raid-lives"></span><span id="hud-raid-time"></span></div></div>`;
    hudLayer.append(s); this.strip = s; this.$ = id => s.querySelector('#' + id);
  }

  setMatchMode(mode, hardcore = this.hardcore) {
    if (!this.strip) return;
    const badge = this.$('hud-mode-badge'); badge.hidden = mode === 'TDM'; badge.textContent = MODES[mode]?.label || '';
    this.$('hud-rg').hidden = mode !== 'RANDOM_GUN'; this.$('hud-raid').hidden = mode !== 'RAID';
    const hc = mode === 'HARDCORE' ? normalizeHardcore(hardcore) : null, b = document.body.classList;
    b.toggle('hc-hide-crosshair', !!hc?.hideCrosshair); b.toggle('hc-hide-minimap', !!hc?.hideMinimap);
    b.toggle('hc-hide-markers', !!hc?.hideEnemyMarkers); b.toggle('hc-hide-ammo', !!hc?.hideAmmoCount);
  }
  clearMatchMode() { this.setMatchMode('TDM'); }
  randomGun(msLeft, weaponName) {
    if (!this.strip) return; const sec = Math.max(0, Math.ceil(msLeft / 1000));
    this.$('hud-rg-time').textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
    this.$('hud-rg').classList.toggle('urgent', sec <= 5); this.$('hud-rg-weapon').textContent = weaponName || '';
  }
  raid(boss, { lives = null, timeLeftSec = 0 } = {}) {
    if (!this.strip || !boss) return;
    const pct = Math.max(0, boss.health / boss.maxHealth * 100);
    this.$('hud-raid-name').textContent = boss.name; this.$('hud-raid-phase').textContent = boss.state === 'DEAD' ? 'DEFEATED' : `PHASE ${boss.phase}/3${boss.shielded ? ' · SHIELDED' : ''}`;
    this.$('hud-raid-fill').style.width = pct + '%'; this.$('hud-raid').classList.toggle('shielded', !!boss.shielded);
    this.$('hud-raid-hp').textContent = `${boss.health.toLocaleString('en-US')} / ${boss.maxHealth.toLocaleString('en-US')} HP`;
    const lv = this.$('hud-raid-lives'); lv.textContent = lives === null ? '' : `LIVES ${lives}`; lv.className = lives !== null && lives <= 1 ? 'warn' : '';
    const t = Math.max(0, Math.ceil(timeLeftSec)); this.$('hud-raid-time').textContent = `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
  }
}
