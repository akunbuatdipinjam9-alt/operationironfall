 
 
import { AGENTS, agentById, agentOdds, rollAgent, playerAgents, isPlayerAgent } from './Agents.js';

export const AGENT_KEY = 'ironfall.agent.v1';
const LABEL = { maxHpMul: 'Health', damageMul: 'Damage', spreadMul: 'Accuracy', moveMul: 'Speed', healMul: 'Healing', meleeCooldownMul: 'Cooldowns', damageTakenMul: 'Damage taken', lifesteal: 'Lifesteal' };
 
export function agentLines(id) {
  const d = agentById(id), out = [];
  for (const [k, v] of Object.entries(d.mods)) {
    if (!LABEL[k]) continue;
    if (k === 'lifesteal') { out.push({ text: `Lifesteal ${Math.round(v * 100)}%`, good: true }); continue; }
    const better = k === 'spreadMul' || k === 'meleeCooldownMul' || k === 'damageTakenMul' ? v < 1 : v > 1, pct = Math.round(Math.abs(v - 1) * 100);
    out.push({ text: `${LABEL[k]} ${better ? '+' : '−'}${pct}%`, good: better });
  }
  if (d.aura) out.push({ text: `Heals allies ${d.aura.healPerSec}/s within ${d.aura.radius} m`, good: true });
  if (d.blink) out.push({ text: `Blink ${d.blink.distance} m · ${d.blink.charges} charges (F)`, good: true });
  if (!out.length) out.push({ text: 'Standard stats', good: true });
  return out;
}

const CSS = `
#if-agent .ag-wrap{display:grid;grid-template-columns:minmax(220px,1fr) minmax(220px,1.2fr);gap:12px}
#if-agent .ag-card{position:relative;padding:14px 14px 12px 18px;background:rgba(20,24,30,.92);border:1px solid rgba(255,255,255,.12);border-radius:8px;overflow:hidden}
#if-agent .ag-card:before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--ac)}
#if-agent .ag-card small{font:700 10px 'JetBrains Mono',monospace;letter-spacing:.16em;color:#b9c0ca}
#if-agent .ag-card b{display:block;font:700 26px/1.05 Rajdhani,sans-serif;letter-spacing:.03em;margin:4px 0 2px}
#if-agent .ag-card em{font-style:normal;font:700 10px 'JetBrains Mono',monospace;letter-spacing:.14em;color:var(--ac)}
#if-agent .ag-lines{margin:10px 0 0;padding:0;list-style:none;font:500 12.5px Inter,sans-serif;color:#cfd6df;display:grid;gap:3px}
#if-agent .ag-lines li.bad{color:#9aa4b1}
#if-agent .ag-side{display:flex;flex-direction:column;gap:8px}
#if-agent .ag-odds{display:grid;grid-template-columns:1fr auto;gap:3px 10px;padding:10px 12px;background:rgba(20,24,30,.92);border:1px solid rgba(255,255,255,.12);border-radius:8px;font:700 11px 'JetBrains Mono',monospace;letter-spacing:.06em}
#if-agent .ag-odds span:nth-child(odd){display:flex;align-items:center;gap:7px}
#if-agent .ag-odds i{width:9px;height:9px;border-radius:50%;background:var(--ac);display:inline-block}
#if-agent .ag-odds span:nth-child(even){color:#8b95a3;text-align:right}
#if-agent .ag-roll{padding:10px;border-radius:6px;border:1px solid #f97316;background:rgba(249,115,22,.14);color:#f0b37b;font:700 11px 'JetBrains Mono',monospace;letter-spacing:.14em;cursor:pointer}
#if-agent .ag-roll:disabled{opacity:.5;cursor:default}
#if-agent-reveal{position:fixed;inset:0;z-index:140;display:grid;place-items:center;background:rgba(6,9,13,.78);pointer-events:none;opacity:0;transition:opacity .15s}
#if-agent-reveal.on{opacity:1}
#if-agent-reveal .rv-window{position:relative;width:min(560px,92vw);height:120px;overflow:hidden;border-top:1px solid rgba(255,255,255,.14);border-bottom:1px solid rgba(255,255,255,.14)}
#if-agent-reveal .rv-window:after{content:'';position:absolute;left:50%;top:0;bottom:0;width:2px;background:#f97316;box-shadow:0 0 12px #f97316}
#if-agent-reveal .rv-strip{position:absolute;left:0;top:10px;display:flex;gap:10px;will-change:transform}
#if-agent-reveal .rv-tile{width:130px;height:100px;flex:none;border-radius:6px;background:rgba(20,24,30,.95);border:1px solid rgba(255,255,255,.12);display:flex;flex-direction:column;justify-content:flex-end;padding:10px;box-shadow:inset 0 -4px 0 var(--ac)}
#if-agent-reveal .rv-tile b{font:700 17px Rajdhani,sans-serif;color:#e6ebf1}
#if-agent-reveal .rv-tile span{font:700 9px 'JetBrains Mono',monospace;letter-spacing:.14em;color:var(--ac)}
#if-agent-reveal .rv-result{position:absolute;bottom:18%;left:0;right:0;text-align:center;font:700 13px 'JetBrains Mono',monospace;letter-spacing:.2em;color:#e6ebf1;opacity:0;transition:opacity .2s}
#if-agent-reveal.done .rv-result{opacity:1}
#if-agent-chip{position:fixed;left:18px;bottom:96px;z-index:21;pointer-events:none;display:none;align-items:center;gap:7px;padding:4px 9px;background:rgba(15,18,23,.8);border:1px solid rgba(255,255,255,.1);border-left:3px solid var(--ac);border-radius:4px;font:700 10px 'JetBrains Mono',monospace;letter-spacing:.12em;color:#cfd6df}
#if-agent-chip.on{display:flex}
#if-agent-chip .pip{width:7px;height:7px;border-radius:50%;background:var(--ac)}
#if-agent-chip .pip.off{background:rgba(255,255,255,.15)}
@media (max-width:720px){#if-agent .ag-wrap{grid-template-columns:1fr}#if-agent-chip{bottom:150px;left:8px}}
@media (prefers-reduced-motion:reduce){#if-agent-reveal .rv-strip{transition:none!important}}
`;
const style = () => { if (!document.getElementById('if-agent-style')) { const s = document.createElement('style'); s.id = 'if-agent-style'; s.textContent = CSS; document.head.appendChild(s); } };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function loadAgent(storage) { try { const v = storage?.getItem(AGENT_KEY); return isPlayerAgent(v) ? v : 'DEFAULT'; } catch (e) { return 'DEFAULT'; } }

export class AgentPicker {
  constructor(root, { storage = null, onChange = () => {}, rng = Math.random } = {}) {
    style(); this.root = root; this.storage = storage; this.onChange = onChange; this.rng = rng; this.agent = loadAgent(storage); this.rolling = false;
    root.addEventListener('click', e => { if (e.target.closest('.ag-roll')) this.roll(); });
  }
  render() {
    const d = agentById(this.agent);
    this.root.innerHTML = `<h3 style="margin:18px 0 8px;font:700 11px JetBrains Mono,monospace;letter-spacing:.16em;color:#b9c0ca">AGENT</h3><div class="ag-wrap">
      <div class="ag-card" style="--ac:${d.color === '#1f2229' ? '#6b6f7a' : d.color}"><small>ACTIVE AGENT</small><b>${esc(d.name)}</b><em>${esc(d.role.toUpperCase())} · ${d.rarity}</em>
        <ul class="ag-lines">${agentLines(d.id).map(l => `<li class="${l.good ? '' : 'bad'}">${esc(l.text)}</li>`).join('')}</ul></div>
      <div class="ag-side"><div class="ag-odds">${agentOdds().map(o => { const c = AGENTS[o.id].color === '#1f2229' ? '#6b6f7a' : AGENTS[o.id].color; return `<span style="--ac:${c}"><i></i>${esc(o.name)}</span><span>${(o.chance * 100).toFixed(o.chance < .1 ? 1 : 0)}%</span>`; }).join('')}</div>
        <button type="button" class="ag-roll" ${this.rolling ? 'disabled' : ''}>ROLL AGENT</button></div></div>`;
  }
  roll() {
    if (this.rolling) return; this.rolling = true; this.render();
    const result = rollAgent(this.rng), pool = playerAgents();
    const ov = document.createElement('div'); ov.id = 'if-agent-reveal'; ov.setAttribute('aria-live', 'polite');
    const tiles = []; for (let i = 0; i < 26; i++) tiles.push(i === 22 ? result : pool[Math.floor(this.rng() * pool.length)]);
    ov.innerHTML = `<div class="rv-window"><div class="rv-strip">${tiles.map(id => { const d = AGENTS[id], c = d.color === '#1f2229' ? '#6b6f7a' : d.color; return `<div class="rv-tile" style="--ac:${c}"><span>${d.rarity}</span><b>${esc(d.name)}</b></div>`; }).join('')}</div></div><div class="rv-result">AGENT ASSIGNED · ${esc(AGENTS[result].name)}</div>`;
    document.body.appendChild(ov); const strip = ov.querySelector('.rv-strip'), win = ov.querySelector('.rv-window');
    requestAnimationFrame(() => {
      ov.classList.add('on'); const target = 22 * 140 + 65 - win.clientWidth / 2 + (this.rng() - .5) * 60;
      strip.style.transition = 'transform 1.05s cubic-bezier(.12,.75,.18,1)'; strip.style.transform = `translateX(${-target}px)`;
      setTimeout(() => { strip.style.transition = 'transform .18s ease-out'; strip.style.transform = `translateX(${-(22 * 140 + 65 - win.clientWidth / 2)}px)`; ov.classList.add('done'); }, 1080);
      setTimeout(() => { ov.classList.remove('on'); setTimeout(() => ov.remove(), 200); this.agent = result; try { this.storage?.setItem(AGENT_KEY, result); } catch (e) {} this.rolling = false; this.render(); this.onChange(result); }, 1750);
    });
  }
}

export class AgentHud {
  constructor() { style(); this.el = document.createElement('div'); this.el.id = 'if-agent-chip'; this.el.setAttribute('aria-hidden', 'true'); document.body.appendChild(this.el); this.sig = ''; }
  update(agentId, { visible = true, charges = null, max = 0 } = {}) {
    const d = agentById(agentId), sig = `${visible}|${d.id}|${charges}|${max}`; if (sig === this.sig) return; this.sig = sig;
    this.el.classList.toggle('on', visible && d.id !== 'DEFAULT'); this.el.style.setProperty('--ac', d.color === '#1f2229' ? '#6b6f7a' : d.color);
    this.el.innerHTML = `AGENT · ${esc(d.name)}${max ? ' ' + Array.from({ length: max }, (_, i) => `<span class="pip ${i < charges ? '' : 'off'}"></span>`).join('') : ''}`;
  }
}
