 
 
 
 
export const MAX_LEVEL = 500, REWARD_EVERY = 5;
export function rewardFor(level) {
  if (level === 1) return { kind: 'weapons' };
  if (level % REWARD_EVERY !== 0 || level < REWARD_EVERY || level > MAX_LEVEL) return null;
  return { kind: 'points', amount: 250 + 50 * (level / REWARD_EVERY) + (level % 50 === 0 ? 1000 : 0) };
}
const EARLY_XP = [0, 300, 750, 1350, 2100];  
export const MATCH_LEVELS = Object.freeze(Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).reduce((out, level) => {
  const xp = level <= 5 ? EARLY_XP[level - 1] : out[level - 2].xp + Math.min(1500, 750 + 50 * (level - 5));
  out.push(Object.freeze({ level, xp, reward: rewardFor(level) })); return out;
}, []));
export const MATCH_XP = Object.freeze({ kill: 15, finish: 60, win: 120, maxPerMatch: 600 });
export const MATCH_PROGRESS_KEY = 'ironfall.matchprogress.v1';

const nat = n => (Number.isFinite(+n) && +n > 0 ? Math.floor(+n) : 0);
export function matchXp({ kills = 0, won = false, completed = true } = {}) {
  if (!completed) return 0;
  return Math.min(MATCH_XP.maxPerMatch, nat(kills) * MATCH_XP.kill + MATCH_XP.finish + (won ? MATCH_XP.win : 0));
}
export function levelFor(xp) {  
  const x = nat(xp); let lo = 0, hi = MATCH_LEVELS.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (MATCH_LEVELS[mid].xp <= x) lo = mid; else hi = mid - 1; }
  return MATCH_LEVELS[lo].level;
}
const isRewardLevel = l => MATCH_LEVELS[l - 1]?.reward?.kind === 'points';

export function createMatchProgress({ storage = null, credit = () => 0, onChange = () => {} } = {}) {
  let state = { xp: 0, claimed: [], matches: 0 };
  try { const raw = JSON.parse(storage?.getItem(MATCH_PROGRESS_KEY) || 'null'); if (raw && typeof raw === 'object') state = { xp: nat(raw.xp), matches: nat(raw.matches), claimed: Array.isArray(raw.claimed) ? raw.claimed.filter(l => Number.isInteger(l) && isRewardLevel(l) && MATCH_LEVELS.some(s => s.level === l && s.reward.kind === 'points')) : [] }; } catch (e) {}
  const save = () => { try { storage?.setItem(MATCH_PROGRESS_KEY, JSON.stringify(state)); } catch (e) {} onChange(api); };
  const api = {
    get xp() { return state.xp; }, get matches() { return state.matches; }, get level() { return levelFor(state.xp); },
    claimed: l => state.claimed.includes(l),
     
    recordMatch(result) { const xp = matchXp(result); if (!xp) return 0; const before = levelFor(state.xp); state.xp += xp; state.matches++; save(); return { xp, levelUp: levelFor(state.xp) > before ? levelFor(state.xp) : 0 }; },
     
    addXp(amount) { const xp = nat(amount); if (!xp) return 0; const before = levelFor(state.xp); state.xp += xp; save(); return { xp, levelUp: levelFor(state.xp) > before ? levelFor(state.xp) : 0 }; },
    claimable() { const lvl = api.level; return MATCH_LEVELS.filter(s => s.reward?.kind === 'points' && s.level <= lvl && !state.claimed.includes(s.level)).map(s => s.level); },
    claimAll() { let got = 0; for (const l of api.claimable()) got += api.claim(l); return got; },
    claim(level) {
      const s = MATCH_LEVELS.find(x => x.level === level);
      if (!s || s.reward?.kind !== 'points' || level > api.level || state.claimed.includes(level)) return 0;
      state.claimed.push(level); save();   
      return credit(s.reward.amount, level) || 0;
    },
    view() {
      const lvl = api.level, next = MATCH_LEVELS.find(s => s.level === lvl + 1), cur = MATCH_LEVELS.find(s => s.level === lvl);
      return { xp: state.xp, level: lvl, max: MAX_LEVEL, next: next ? next.xp : null, into: next ? (state.xp - cur.xp) / (next.xp - cur.xp) : 1,
        levels: MATCH_LEVELS.map(s => ({ ...s, reached: s.level <= lvl, claimed: state.claimed.includes(s.level) })) };
    },
  };
  return api;
}

const CSS = `
#if-view-match .ifm-top{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;margin-bottom:14px}
#if-view-match .ifm-lvl{font:700 34px/1 Rajdhani,Inter,sans-serif;letter-spacing:.02em}
#if-view-match .ifm-lvl small{display:block;font:700 10px 'JetBrains Mono',monospace;letter-spacing:.16em;color:#b9c0ca;margin-bottom:4px}
#if-view-match .ifm-xp{flex:1;max-width:420px;font:700 10px 'JetBrains Mono',monospace;letter-spacing:.12em;color:#b9c0ca;text-align:right}
#if-view-match .ifm-bar{height:6px;margin-top:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden}
#if-view-match .ifm-bar i{display:block;height:100%;background:#f97316;transform-origin:left}
#if-view-match .ifm-track{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(150px,1fr);gap:10px;position:relative;overflow-x:auto;padding-bottom:8px;scroll-snap-type:x proximity}
#if-view-match .ifm-node{scroll-snap-align:center}
#if-view-match .ifm-node.big{border-color:rgba(251,191,36,.6);background:rgba(60,40,10,.6)}
#if-view-match .ifm-all{margin-top:8px;padding:6px 10px;border-radius:4px;border:1px solid #f97316;background:rgba(249,115,22,.2);color:#f0b37b;font:700 10px 'JetBrains Mono',monospace;letter-spacing:.1em;cursor:pointer}
#if-view-match .ifm-node{position:relative;padding:12px 12px 14px;background:rgba(20,24,30,.92);border:1px solid rgba(255,255,255,.12);border-radius:8px;min-height:148px;display:flex;flex-direction:column;gap:6px}
#if-view-match .ifm-node.reached{border-color:rgba(240,179,123,.45)}
#if-view-match .ifm-node.current{box-shadow:0 0 0 1px #f0b37b inset}
#if-view-match .ifm-node.locked{opacity:.62}
#if-view-match .ifm-head{display:flex;justify-content:space-between;align-items:baseline;font:700 11px 'JetBrains Mono',monospace;letter-spacing:.12em;color:#b9c0ca}
#if-view-match .ifm-head b{font:700 22px/1 Rajdhani,Inter,sans-serif;color:#e6ebf1;letter-spacing:0}
#if-view-match .ifm-node.reached .ifm-head b{color:#f0b37b}
#if-view-match .ifm-reward{font:700 15px Rajdhani,Inter,sans-serif;letter-spacing:.02em}
#if-view-match .ifm-reward span{display:block;font:500 11.5px Inter,sans-serif;color:#b9c0ca;letter-spacing:0;margin-top:2px}
#if-view-match .ifm-weapons{display:flex;flex-direction:column;gap:4px}
#if-view-match .ifm-weapons span{display:flex;justify-content:space-between;padding:4px 7px;background:rgba(255,255,255,.04);border-radius:4px;font:700 11px 'JetBrains Mono',monospace;letter-spacing:.06em;color:#e6ebf1}
#if-view-match .ifm-weapons em{font-style:normal;color:#8b95a3}
#if-view-match .ifm-node button{margin-top:auto;padding:7px 8px;border-radius:4px;border:1px solid #f97316;background:rgba(249,115,22,.14);color:#f0b37b;font:700 10px 'JetBrains Mono',monospace;letter-spacing:.12em;cursor:pointer}
#if-view-match .ifm-node button:disabled{border-color:rgba(255,255,255,.14);background:transparent;color:#8b95a3;cursor:default}
#if-view-match .ifm-node button:not(:disabled):hover{background:rgba(249,115,22,.24)}
#if-view-match .ifm-note{margin-top:12px;font:500 12px Inter,sans-serif;color:#8b95a3}
@media (max-width:900px){#if-view-match .ifm-node{min-height:0}}
@media (max-width:520px){#if-view-match .ifm-track{grid-auto-columns:78%}#if-view-match .ifm-top{flex-direction:column;align-items:stretch}#if-view-match .ifm-xp{text-align:left;max-width:none}}
`;

export class MatchProgressUI {
  constructor(root, progress, { starterWeapons = [], onClaim = () => {} } = {}) {
    this.root = root; this.p = progress; this.starter = starterWeapons; this.onClaim = onClaim;
    if (!document.getElementById('if-match-style')) { const s = document.createElement('style'); s.id = 'if-match-style'; s.textContent = CSS; document.head.appendChild(s); }
    root.addEventListener('click', e => {
      if (e.target.closest('button[data-claimall]')) { const got = this.p.claimAll(); if (got) this.onClaim(got, 0); this.render(); return; }
      const b = e.target.closest('button[data-claim]'); if (!b) return; const got = this.p.claim(Number(b.dataset.claim)); if (got) this.onClaim(got, Number(b.dataset.claim)); this.render();
    });
  }
  render() {
    const v = this.p.view(), body = this.root;
    const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    const fmt = n => Math.round(n).toLocaleString('en-US');
     
    const nodes = v.levels.filter(s => s.reward).map(s => {
      const cur = s.level <= v.level && v.level < s.level + REWARD_EVERY;
      const state = (cur ? 'current ' : '') + (s.reached ? 'reached' : 'locked') + (s.level % 50 === 0 ? ' big' : '');
      let reward, action = '';
      if (s.reward.kind === 'weapons') reward = `<div class="ifm-reward">STARTER KIT<span>Free from the start</span></div><div class="ifm-weapons">${this.starter.map(w => `<span>${esc(w.name)}<em>${esc(w.category)}</em></span>`).join('')}</div>`;
      else {
        reward = `<div class="ifm-reward">+${fmt(s.reward.amount)} IC<span>${s.level % 50 === 0 ? 'Milestone bonus · ' : ''}claimed once</span></div>`;
        action = s.claimed ? '<button type="button" disabled>CLAIMED</button>' : s.reached ? `<button type="button" data-claim="${s.level}">CLAIM +${fmt(s.reward.amount)}</button>` : `<button type="button" disabled>${fmt(s.xp)} XP</button>`;
      }
      return `<div class="ifm-node ${state}" data-lvl="${s.level}"><div class="ifm-head">LEVEL<b>${s.level}</b></div>${reward}${action}</div>`;
    }).join('');
    const open = this.p.claimable(), openIc = open.reduce((a, l) => a + (v.levels[l - 1].reward?.amount || 0), 0);
    body.innerHTML = `<div class="ifm-top"><div class="ifm-lvl"><small>PLAYER LEVEL</small>LV. ${v.level}<span style="font-size:16px;color:#8b95a3"> / ${v.max}</span></div>
      <div class="ifm-xp">${v.next == null ? `${fmt(v.xp)} XP · MAX LEVEL` : `${fmt(v.xp)} / ${fmt(v.next)} XP TO LEVEL ${v.level + 1}`}<div class="ifm-bar"><i style="transform:scaleX(${Math.max(0, Math.min(1, v.into)).toFixed(3)})"></i></div>
      ${open.length > 1 ? `<button type="button" class="ifm-all" data-claimall>CLAIM ALL · ${open.length} REWARDS · +${fmt(openIc)} IC</button>` : ''}</div></div>
      <div class="ifm-track" role="list">${nodes}</div>
      <p class="ifm-note">Rewards every ${REWARD_EVERY} levels (bigger bonus every 50) up to level ${v.max}. XP: ${MATCH_XP.finish} per finished match, ${MATCH_XP.kill} per elimination, +${MATCH_XP.win} for a win (up to ${MATCH_XP.maxPerMatch} per match), plus daily challenge XP.</p>`;
    const curNode = body.querySelector('.ifm-node.current'), track = body.querySelector('.ifm-track');
    if (curNode && track) track.scrollLeft = Math.max(0, curNode.offsetLeft - track.clientWidth / 2 + curNode.clientWidth / 2);
  }
}
