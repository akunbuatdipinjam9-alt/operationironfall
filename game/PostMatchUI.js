 
 
import { scoreboardGroups, SORTS, outcomeFor } from './MatchResult.js';
import { Odometer } from './Odometer.js';

const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const num = v => (v == null ? '—' : Math.round(v).toLocaleString('en-US'));
export const SORT_LABELS = Object.freeze({ contribution: 'SCORE', kills: 'KILLS', damage: 'DAMAGE', kda: 'KDA' });
const TEAM_STYLE = { BLUE: 'sky', RED: 'red' };

export function scoreboardRowHTML(p, { selfId, mvpId, charName = id => id } = {}) {
  const self = p.id === selfId, mvp = p.id === mvpId;
  const cls = ['pm-row', self ? 'pm-self' : '', mvp ? 'pm-mvp' : '', p.disconnected ? 'pm-dc' : ''].filter(Boolean).join(' ');
  const tag = p.kind === 'bot' ? '<span class="pm-tag pm-bot" title="Bot">BOT</span>' : '<span class="pm-tag pm-human" title="Player">P</span>';
  return `<tr class="${cls}" data-id="${esc(p.id)}">`
    + `<td class="pm-rank">${p.rank}</td>`
    + `<td class="pm-name">${tag}${mvp ? '<span class="pm-tag pm-star" title="MVP">★</span>' : ''}<span>${esc(p.name)}</span>${self ? ' <b class="pm-you">YOU</b>' : ''}${p.disconnected ? ' <i class="pm-dc-l">DC</i>' : ''}</td>`
    + `<td class="pm-char">${esc(p.character ? charName(p.character) : '—')}</td>`
    + `<td>${p.kills}</td><td>${p.deaths}</td><td>${p.assists}</td>`
    + `<td>${num(p.damage)}</td><td>${p.accuracy == null ? '—' : p.accuracy + '%'}</td><td class="pm-score">${num(p.contribution)}</td></tr>`;
}

export function scoreboardHTML(result, { selfId = null, sort = 'contribution', charName } = {}) {
  if (!result || !Array.isArray(result.players) || !result.players.length) return '<div class="pm-empty">No match data recorded.</div>';
  const key = SORTS[sort] ? sort : 'contribution';
  const sorter = Object.keys(SORT_LABELS).map(k => `<button type="button" class="pm-sort${k === key ? ' on' : ''}" data-sort="${k}" aria-pressed="${k === key}">${SORT_LABELS[k]}</button>`).join('');
  const groups = scoreboardGroups(result, key).map(g => {
    const color = TEAM_STYLE[g.team] || 'amber';
    const head = g.team ? `<div class="pm-team pm-${color}">${esc(g.team)} SQUAD${g.score != null ? ` <b>${g.score}</b>` : ''}${result.winnerTeam === g.team ? ' <span class="pm-win">WIN</span>' : ''}</div>` : '<div class="pm-team pm-amber">ALL OPERATORS</div>';
    const rows = g.players.map(p => scoreboardRowHTML(p, { selfId, mvpId: result.mvpId, charName })).join('');
    return `<div class="pm-group">${head}<div class="pm-scroll"><table class="pm-table"><thead><tr><th>#</th><th>PLAYER</th><th>CHAR</th><th title="Kills">K</th><th title="Deaths">D</th><th title="Assists">A</th><th>DMG</th><th>ACC</th><th>SCORE</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }).join('');
  return `<div class="pm-sortbar" role="group" aria-label="Sort scoreboard"><span>SORT</span>${sorter}</div>${groups}`;
}

export const SCOREBOARD_CSS = `
.pm-sortbar{display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:8px;font:700 10px ui-monospace,monospace;color:#94a3b8}
.pm-sort{padding:4px 9px;border:1px solid #334155;border-radius:6px;background:#0f172a;color:#cbd5e1;font:inherit;cursor:pointer}
.pm-sort.on{background:#0369a1;border-color:#38bdf8;color:#fff}.pm-sort:focus-visible{outline:2px solid #fbbf24;outline-offset:1px}
.pm-group{margin-bottom:10px}.pm-team{font:900 11px ui-monospace,monospace;letter-spacing:.12em;padding:4px 2px;border-bottom:1px solid #334155}
.pm-sky{color:#38bdf8}.pm-red{color:#f87171}.pm-amber{color:#fbbf24}.pm-win{background:#16a34a;color:#fff;padding:1px 6px;border-radius:4px;font-size:9px}
.pm-scroll{overflow-x:auto;max-height:260px;overflow-y:auto;-webkit-overflow-scrolling:touch}
.pm-table{width:100%;border-collapse:collapse;font:12px ui-monospace,monospace;color:#e2e8f0;min-width:560px}
.pm-table th{position:sticky;top:0;background:#0b1220;color:#64748b;font-size:10px;text-align:right;padding:4px 6px}
.pm-table td{text-align:right;padding:4px 6px;border-top:1px solid #1e293b;white-space:nowrap}
.pm-table th:nth-child(2),.pm-table td.pm-name,.pm-table th:nth-child(3),.pm-table td.pm-char{text-align:left}
.pm-rank{color:#64748b;width:22px}.pm-score{color:#fbbf24;font-weight:800}
.pm-self td{background:rgba(56,189,248,.12)}.pm-self td.pm-name{box-shadow:inset 3px 0 #38bdf8}.pm-mvp td.pm-score{color:#fde047}
.pm-dc{opacity:.6}.pm-tag{display:inline-block;font-size:9px;padding:0 4px;margin-right:5px;border-radius:3px;border:1px solid #475569;color:#94a3b8}
.pm-human{border-color:#38bdf8;color:#38bdf8}.pm-star{border-color:#fbbf24;color:#fbbf24}.pm-you{color:#38bdf8;font-size:10px}.pm-dc-l{color:#f87171;font-size:10px}
.pm-empty{font:12px ui-monospace,monospace;color:#94a3b8;padding:12px}
@media (max-width:640px){.pm-table td.pm-char,.pm-table th:nth-child(3){display:none}.pm-table{min-width:440px}}`;

 
export const TABS = Object.freeze(['overview', 'scoreboard', 'weapons', 'timeline', 'rewards']);
const REASONS = { TIME: 'TIME LIMIT', SCORE_LIMIT: 'SCORE LIMIT', CART_DELIVERED: 'PAYLOAD DELIVERED', CART_DEFENDED: 'PAYLOAD STOPPED',
  CORE_DESTROYED: 'CORE DESTROYED', RAID_COMPLETE: 'BOSS DEFEATED', RAID_FAILED: 'RAID FAILED' };
export const reasonLabel = r => REASONS[r] || String(r || 'MATCH OVER').replace(/_/g, ' ');
export const clock = ms => { const s = Math.max(0, Math.round((ms || 0) / 1000)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export const AWARDS = Object.freeze({
  impact: { icon: '✦', title: 'IMPACT', color: '#fbbf24', unit: v => `${num(v)} score`, blurb: 'Highest match score' },
  deadeye: { icon: '◎', title: 'DEADEYE', color: '#38bdf8', unit: v => `${v}% accuracy`, blurb: 'Best accuracy (10+ shots)' },
  support: { icon: '✚', title: 'SUPPORT', color: '#34d399', unit: v => `${v} assists`, blurb: 'Most assists' },
  objectives: { icon: '⚑', title: 'OBJECTIVE', color: '#f472b6', unit: v => `${v} actions`, blurb: 'Most objective play' },
});
const STATE_COLOR = { VICTORY: '#fbbf24', DEFEAT: '#f87171', DRAW: '#fcd34d', COMPLETE: '#cbd5e1', ABORTED: '#94a3b8' };

export function introModel(result, selfId) {
  const o = outcomeFor(result, selfId);
  let sub = '';
  if (result?.kind === 'TEAM' && result.teams) sub = `BLUE ${result.teams.BLUE} — ${result.teams.RED} RED`;
  else if (result?.kind === 'RAID') sub = result.raidResult === 'COMPLETE' ? 'BOSS DEFEATED' : 'RAID FAILED';
  else if (o.place) sub = `PLACED #${o.place} OF ${result.players.length}`;
  return { label: o.label, state: o.state, sub, reason: result ? reasonLabel(result.reason) : '', color: STATE_COLOR[o.state] || '#cbd5e1' };
}

export function introHTML(m) {
  return `<div class="pm-intro-in pm-${m.state.toLowerCase()}"><div class="pm-intro-label" style="color:${m.color}">${esc(m.label)}</div>`
    + (m.sub ? `<div class="pm-intro-sub">${esc(m.sub)}</div>` : '') + (m.reason ? `<div class="pm-intro-reason">// ${esc(m.reason)}</div>` : '')
    + `<button type="button" class="pm-skip" data-skip>SKIP ▸ <small>ENTER / ESC</small></button></div>`;
}

const playerLine = (p, charName) => `${esc(p.name)}${p.character ? ` <span class="pm-dim">· ${esc(charName(p.character))}</span>` : ''}`;
export function overviewHTML(result, { selfId = null, charName = id => id } = {}) {
  if (!result) return '<div class="pm-empty">No match data recorded.</div>';
  const m = introModel(result, selfId), me = result.players.find(p => p.id === selfId) || null;
  const mvp = result.players.find(p => p.id === result.mvpId) || null, byId = id => result.players.find(p => p.id === id);
  const score = result.kind === 'TEAM' && result.teams ? `<div class="pm-bigscore"><span class="pm-sky">${result.teams.BLUE}</span><i>—</i><span class="pm-red">${result.teams.RED}</span></div>` : '';
  const outcome = `<div class="pm-card pm-outcome" style="--c:${m.color}"><div class="pm-k">RESULT</div><div class="pm-outcome-l">${esc(m.label)}</div>${score}`
    + `<div class="pm-meta">${esc(result.gameMode)}${result.map ? ' · ' + esc(result.map) : ''} · ${clock(result.durationMs)} · ${esc(reasonLabel(result.reason))}</div></div>`;
  const mvpCard = mvp ? `<div class="pm-card pm-mvpcard${mvp.character ? ' pm-has3d' : ''}">${mvp.character ? '<div class="pm-mvp3d" data-mvp3d></div>' : ''}<div class="pm-mvpinfo"><div class="pm-k">MVP${mvp.id === selfId ? ' · YOU' : ''}</div><div class="pm-who">★ ${playerLine(mvp, charName)}</div>`
    + `<div class="pm-stats"><span><b>${mvp.kills}</b>K</span><span><b>${mvp.deaths}</b>D</span><span><b>${mvp.assists}</b>A</span><span><b>${num(mvp.damage)}</b>DMG</span></div>`
    + `<div class="pm-meta">Match score ${num(mvp.contribution)}${mvp.team ? ' · ' + esc(mvp.team) : ''}</div></div></div>` : '<div class="pm-card"><div class="pm-k">MVP</div><div class="pm-empty">No MVP</div></div>';
  const self = me ? `<div class="pm-card pm-selfcard"><div class="pm-k">YOUR PERFORMANCE · RANK #${me.rank}${me.team ? ` (#${me.teamRank} ${esc(me.team)})` : ''}</div>`
    + `<div class="pm-grid4">${[['KILLS', me.kills], ['DEATHS', me.deaths], ['ASSISTS', me.assists], ['KDA', me.kda], ['DAMAGE', num(me.damage)], ['ACCURACY', me.accuracy == null ? '—' : me.accuracy + '%'], ['HEADSHOT KILLS', me.headshotKills == null ? '—' : me.headshotKills], ['OBJECTIVES', me.objectives]]
      .map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('')}</div></div>`
    : '<div class="pm-card"><div class="pm-k">YOUR PERFORMANCE</div><div class="pm-empty">You were not in the final roster.</div></div>';
  const awards = `<div class="pm-card"><div class="pm-k">AWARDS</div><div class="pm-awards">${Object.entries(AWARDS).map(([k, a]) => {
    const w = result.awards?.[k], p = w && byId(w.id);
    return `<div class="pm-award${p ? '' : ' pm-none'}${p && p.id === selfId ? ' pm-mine' : ''}" style="--c:${a.color}" title="${esc(a.blurb)}"><span class="pm-aicon">${a.icon}</span><div><small>${a.title}</small>`
      + (p ? `<b>${esc(p.name)}</b><em>${esc(a.unit(w.value))}</em>` : '<b>Not awarded</b><em>' + esc(a.blurb) + '</em>') + '</div></div>';
  }).join('')}</div></div>`;
  return `<div class="pm-overview">${outcome}${mvpCard}${self}${awards}</div>`;
}

 
const pct = (a, b) => (b > 0 ? Math.round(a / b * 100) : 0);
function weaponCard(title, w, color, categoryOf) {
  if (!w) return `<div class="pm-wcard pm-none" style="--c:${color}"><small>${title}</small><b>—</b><em>Not enough data</em></div>`;
  const cat = categoryOf?.(w.index);
  return `<div class="pm-wcard" style="--c:${color}"><small>${title}</small><b>${esc(w.name)}</b>${cat ? `<span class="pm-dim">${esc(cat)}</span>` : ''}`
    + `<em>${w.kills} kills · ${num(w.damage)} dmg · ${w.accuracy == null ? '—' : w.accuracy + '%'} acc · ${w.shots} shots</em></div>`;
}
export function matchWeaponLeaders(result, limit = 5) {
  const agg = new Map();
  for (const p of result?.players || []) for (const w of p.weapons) {
    const a = agg.get(w.index) || { index: w.index, name: w.name, kills: 0, damage: 0, shots: 0, hits: 0, users: 0 };
    a.kills += w.kills; a.damage += w.damage; a.shots += w.shots; a.hits += w.hits; a.users++; agg.set(w.index, a);
  }
  return [...agg.values()].filter(a => a.kills || a.damage).sort((x, y) => y.kills - x.kills || y.damage - x.damage).slice(0, limit);
}
export function weaponsHTML(result, { selfId = null, categoryOf = null } = {}) {
  const me = result?.players.find(p => p.id === selfId);
  const leaders = matchWeaponLeaders(result);
  const board = leaders.length ? `<div class="pm-k pm-gap">MATCH-WIDE · TOP WEAPONS</div><div class="pm-leaders">${leaders.map((a, i) => `<div><span class="pm-rank">${i + 1}</span><b>${esc(a.name)}</b><span class="pm-dim">${a.kills} kills · ${num(a.damage)} dmg · ${a.users} ${a.users === 1 ? 'user' : 'users'}</span></div>`).join('')}</div>` : '';
  if (!me || !me.weapons.length) return `<div class="pm-empty">No weapon usage recorded for you this match.</div>${board}`;
  const byIdx = i => me.weapons.find(w => w.index === i) || null, total = me.weapons.reduce((a, w) => a + w.damage, 0);
  const cards = `<div class="pm-wcards">${weaponCard('MOST USED', byIdx(me.mostUsedWeapon), '#38bdf8', categoryOf)}${weaponCard('MOST EFFECTIVE', byIdx(me.mostEffectiveWeapon), '#fbbf24', categoryOf)}</div>`;
  const tag = w => (w.index === me.mostUsedWeapon ? '<span class="pm-tag pm-human">USED</span>' : '') + (w.index === me.mostEffectiveWeapon ? '<span class="pm-tag pm-star">BEST</span>' : '');
  const table = `<div class="pm-k pm-gap">YOUR WEAPONS</div><div class="pm-scroll"><table class="pm-table"><thead><tr><th>WEAPON</th><th>SHOTS</th><th>HITS</th><th>ACC</th><th>KILLS</th><th>HS KILLS</th><th>DMG</th><th>SHARE</th></tr></thead><tbody>`
    + me.weapons.map(w => { const sh = pct(w.damage, total); return `<tr><td class="pm-name">${esc(w.name)} ${tag(w)}</td><td>${w.shots}</td><td>${w.hits}</td><td>${w.accuracy == null ? '—' : w.accuracy + '%'}</td><td>${w.kills}</td><td>${me.headshotKills == null ? '—' : w.headshotKills}</td><td>${num(w.damage)}</td><td class="pm-share"><i style="width:${sh}%"></i><span>${sh}%</span></td></tr>`; }).join('')
    + '</tbody></table></div>';
  return cards + table + board;
}

export const TIMELINE_FILTERS = Object.freeze([['score', 'TEAM SCORE'], ['kills', 'ELIMINATIONS'], ['objectives', 'OBJECTIVES']]);
const FFA_COLORS = ['#fbbf24', '#38bdf8', '#f87171', '#34d399', '#a78bfa', '#f472b6'];
 
export function timelineSeries(result, filter = 'score') {
  const S = result?.timeline?.samples || [], has = k => S.some(x => x[k] != null);
  const line = (key, label, color, get) => ({ key, label, color, points: S.filter(x => get(x) != null).map(x => [x.t, get(x)]) });
  const none = { available: false, series: [], unit: '' };
  if (!S.length || !result) return none;
  if (result.kind === 'FFA') {
    if (filter === 'objectives' || !has('top')) return none;
    const ids = []; for (const x of S) for (const id of Object.keys(x.top || {})) if (!ids.includes(id)) ids.push(id);
    const last = S[S.length - 1].top || {}; ids.sort((a, b) => (last[b] ?? -1) - (last[a] ?? -1));
    const name = id => result.players.find(p => p.id === id)?.name || id;
    return { available: true, unit: 'kills', series: ids.slice(0, 6).map((id, i) => line(id, name(id), FFA_COLORS[i], x => x.top?.[id])) };
  }
  if (result.kind === 'SURVIVAL') return filter === 'score' && has('alive') ? { available: true, unit: 'alive', series: [line('alive', 'ALIVE', '#34d399', x => x.alive)] } : none;
  const team = (k1, k2, unit) => ({ available: true, unit, series: [line('BLUE', 'BLUE', '#38bdf8', x => x[k1]), line('RED', 'RED', '#f87171', x => x[k2])] });
  if (filter === 'score') return result.kind === 'RAID' || !has('blue') ? none : team('blue', 'red', 'score');
  if (filter === 'kills') return has('bk') ? team('bk', 'rk', 'kills') : none;
  if (has('objBlue')) return team('objBlue', 'objRed', 'structures standing');
  if (has('obj')) return { available: true, unit: '%', series: [line('obj', result.kind === 'RAID' ? 'BOSS HP %' : 'PAYLOAD %', '#f472b6', x => x.obj)] };
  if (has('bo') && S.some(x => x.bo || x.ro)) return team('bo', 'ro', 'objective actions');
  return none;
}
const EVENT_COLOR = { STREAK: '#fbbf24', LEAD_CHANGE: '#38bdf8', OBJECTIVE: '#f472b6' };
export function timelineChartSVG(result, filter = 'score', { w = 640, h = 220 } = {}) {
  const { available, series, unit } = timelineSeries(result, filter);
  if (!available || !series.some(x => x.points.length)) return '<div class="pm-empty">This stat was not recorded for this match.</div>';
  const L = 34, R = 44, T = 12, B = 24, iw = w - L - R, ih = h - T - B;
  const tMax = Math.max(1, result.durationMs || 0, ...series.flatMap(x => x.points.map(p => p[0])));
  const vMax = Math.max(1, ...series.flatMap(x => x.points.map(p => p[1])));
  const nice = vMax <= 5 ? Math.ceil(vMax) : Math.ceil(vMax / 5) * 5;
  const X = t => (L + t / tMax * iw).toFixed(1), Y = v => (T + ih - v / nice * ih).toFixed(1);
  const grid = [0, 0.5, 1].map(f => `<line x1="${L}" x2="${L + iw}" y1="${Y(nice * f)}" y2="${Y(nice * f)}" class="pm-gl"/><text x="${L - 6}" y="${+Y(nice * f) + 4}" text-anchor="end">${Math.round(nice * f)}</text>`).join('');
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => `<text x="${X(tMax * f)}" y="${h - 6}" text-anchor="middle">${clock(tMax * f)}</text>`).join('');
  const paths = series.filter(x => x.points.length).map(x => {
    const pts = x.points; let d = `M${X(pts[0][0])} ${Y(pts[0][1])}`;
    for (let i = 1; i < pts.length; i++) d += ` H${X(pts[i][0])} V${Y(pts[i][1])}`;
    const end = pts[pts.length - 1];
    return `<path d="${d}" fill="none" stroke="${x.color}" stroke-width="2.2" stroke-linejoin="round"><title>${esc(x.label)}: ${end[1]}</title></path>`
      + `<circle cx="${X(end[0])}" cy="${Y(end[1])}" r="3" fill="${x.color}"/><text x="${+X(end[0]) + 6}" y="${+Y(end[1]) + 4}" fill="${x.color}" class="pm-endv">${end[1]}</text>`;
  }).join('');
  const evs = (result.timeline.events || []).filter(e => filter !== 'objectives' || e.type === 'OBJECTIVE').map(e =>
    `<path d="M${X(e.t)} ${T + ih} l-4 7 h8z" fill="${EVENT_COLOR[e.type] || '#94a3b8'}"><title>${clock(e.t)} ${esc(String(e.type).replace(/_/g, ' '))}${e.name ? ' · ' + esc(e.name) : e.team ? ' · ' + esc(e.team) : ''} ${esc(e.detail || '')}</title></path>`).join('');
  const label = `${TIMELINE_FILTERS.find(f => f[0] === filter)?.[1] || filter} over ${clock(tMax)}. Final: ` + series.map(x => `${x.label} ${x.points.length ? x.points[x.points.length - 1][1] : '—'}`).join(', ') + '.';
  const legend = `<div class="pm-legend">${series.map(x => `<span><i style="background:${x.color}"></i>${esc(x.label)}</span>`).join('')}<span class="pm-dim">${esc(unit)}</span></div>`;
  return `${legend}<svg class="pm-chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${grid}${ticks}${paths}${evs}</svg>`;
}
export function timelineHTML(result, filter = 'score') {
  const tl = result?.timeline;
  if (!tl || !tl.samples.length) return '<div class="pm-empty">No timeline recorded for this match.</div>';
  const pick = TIMELINE_FILTERS.some(f => f[0] === filter) ? filter : 'score';
  const btns = TIMELINE_FILTERS.map(([k, l]) => { const ok = timelineSeries(result, k).available;
    return `<button type="button" class="pm-sort${k === pick ? ' on' : ''}" data-tlf="${k}" aria-pressed="${k === pick}"${ok ? '' : ' disabled title="Not recorded for this mode"'}>${l}</button>`; }).join('');
  const ev = tl.events.length ? `<ol class="pm-events">${tl.events.map(e => `<li><time>${clock(e.t)}</time><span class="pm-ev pm-ev-${esc(String(e.type).toLowerCase())}">${esc(String(e.type).replace(/_/g, ' '))}</span>${e.name ? ' ' + esc(e.name) : e.team ? ' ' + esc(e.team) : ''} <span class="pm-dim">${esc(e.detail || '')}</span></li>`).join('')}</ol>` : '<div class="pm-empty">No notable events.</div>';
  return `<div class="pm-sortbar" role="group" aria-label="Timeline filter">${btns}</div>${timelineChartSVG(result, pick)}<div class="pm-meta">${tl.samples.length} samples · every ${Math.round(tl.intervalMs / 1000)} s</div><div class="pm-k pm-gap">KEY MOMENTS</div>${ev}`;
}
export function mountTimeline(el, result) {
  if (!el) return; let f = TIMELINE_FILTERS.find(([k]) => timelineSeries(result, k).available)?.[0] || 'score';
  const draw = () => { el.innerHTML = timelineHTML(result, f); };
  el.onclick = e => { const b = e.target.closest?.('[data-tlf]'); if (!b || b.disabled) return; f = b.dataset.tlf; draw(); el.querySelector(`[data-tlf="${f}"]`)?.focus(); };
  draw();
}

 
 
export function rewardsHTML(summary, result, { selfId = null, cap = 1500 } = {}) {
  if (!summary) return '<div class="pm-empty">No reward data for this match.</div>';
  if (summary.training) return '<div class="pm-empty">Training matches do not award Iron Credits or XP.</div>';
  const me = result?.players?.find(p => p.id === selfId) || null;
  const killLine = (summary.lines || []).find(l => /^Eliminations$/i.test(l.label));
  const paidKills = killLine ? killLine.count : 0;
  const dup = summary.duplicate ? `<div class="pm-note pm-warn">Rewards for this match were already claimed (${esc(summary.matchId || '')}). Nothing was added again.</div>` : '';
  const lines = (summary.lines || []).map(l => `<li><span>${esc(l.label)}${l.count > 1 ? ` ×${l.count}` : ''}</span><b data-countup="${l.ic}" data-prefix="+">+${num(l.ic)}</b></li>`).join('') || '<li><span>No IC this match</span><b>+0</b></li>';
  const elim = me ? `<div class="pm-card"><div class="pm-k">ELIMINATIONS</div><div class="pm-elim"><div><small>TOTAL</small><b>${me.kills}</b></div><div><small>REWARD-ELIGIBLE</small><b>${paidKills}</b></div></div>`
    + (paidKills < me.kills ? `<div class="pm-meta">${me.kills - paidKills} elimination${me.kills - paidKills === 1 ? '' : 's'} earned no IC${summary.capped ? ' because the daily match cap was reached' : ' (only kills made by you while the match was live count)'}.</div>` : '<div class="pm-meta">Every elimination earned IC.</div>') + '</div>' : '';
  const capLeft = Math.max(0, summary.capLeft ?? 0), used = Math.max(0, cap - capLeft);
  const capCard = `<div class="pm-card"><div class="pm-k">DAILY MATCH CAP</div><div class="pm-capbar" role="meter" aria-valuemin="0" aria-valuemax="${cap}" aria-valuenow="${used}" aria-label="Daily match IC used"><i style="width:${pct(used, cap)}%"></i></div>`
    + `<div class="pm-meta">${num(used)} / ${num(cap)} IC from matches today · ${num(capLeft)} left.${summary.capped ? ' <b class="pm-warn">Cap reached</b> — kills, wins and bonuses pay again after the daily reset. Daily/weekly challenges and login rewards are not capped.' : ' Kills, assists, streaks, wins and bonuses count toward this cap; challenges and login rewards do not.'}</div></div>`;
  const xp = summary.xp != null ? `<div class="pm-xp"><small>MATCH XP</small><b data-countup="${summary.xp}" data-prefix="+">+${num(summary.xp)}</b>${summary.levelUp ? `<span class="pm-tag pm-star">LEVEL ${summary.levelUp} REACHED</span>` : ''}</div>` : '';
  return `${dup}<div class="pm-rewards"><div class="pm-card pm-ictotal"><div class="pm-k">IRON CREDITS EARNED</div><div class="pm-icbig" data-odo="${summary.total}" data-odo-from="0" data-prefix="+">+${num(summary.total)}</div>`
    + `<ul class="pm-iclines">${lines}</ul>${xp}<div class="pm-meta pm-bal">BALANCE <b data-odo="${summary.balance}" data-odo-from="${Math.max(0, summary.balance - (summary.duplicate ? 0 : summary.total))}">${num(summary.balance)}</b> IC</div></div><div class="pm-rewards-side">${elim}${capCard}</div></div>`;
}

 
export function runOdometers(root, opts = {}) {
  const els = root?.querySelectorAll?.('[data-odo]:not([data-counted])') || [];
  for (const el of els) {
    el.setAttribute('data-counted', '1');
    const to = +el.getAttribute('data-odo') || 0, from = +el.getAttribute('data-odo-from') || 0;
    new Odometer(el, { value: from, prefix: el.getAttribute('data-prefix') || '', ...opts }).set(to);
  }
  return els.length;
}

 
export function runCountUps(root, { reduced = false, ms = 900, raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null, now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now()) } = {}) {
  const els = root?.querySelectorAll?.('[data-countup]:not([data-counted])') || [];
  for (const el of els) {
    el.setAttribute('data-counted', '1');
    const to = Math.max(0, Math.round(+el.getAttribute('data-countup') || 0)), pre = el.getAttribute('data-prefix') || '';
    if (reduced || !raf || to === 0) { el.textContent = pre + num(to); continue; }
    const t0 = now(); el.textContent = pre + '0';
    const step = () => { const k = Math.min(1, (now() - t0) / ms), e = 1 - (1 - k) ** 3; el.textContent = pre + num(Math.round(to * e)); if (k < 1) raf(step); };
    raf(step);
  }
  return els.length;
}

export const DASH_CSS = `
.pm-tabs{display:flex;gap:4px;margin:0 0 12px;border-bottom:1px solid #334155;overflow-x:auto}
.pm-tab{padding:8px 12px;background:none;border:0;border-bottom:2px solid transparent;color:#94a3b8;font:800 11px ui-monospace,monospace;letter-spacing:.1em;cursor:pointer;white-space:nowrap}
.pm-tab[aria-selected=true]{color:#fff;border-bottom-color:#38bdf8}.pm-tab:focus-visible{outline:2px solid #fbbf24;outline-offset:-2px}
.pm-overview{display:grid;grid-template-columns:1fr 1fr;gap:10px}@media (max-width:700px){.pm-overview{grid-template-columns:1fr}}
.pm-card{border:1px solid #334155;background:rgba(15,23,42,.8);border-radius:12px;padding:12px 14px;font-family:ui-monospace,monospace;color:#e2e8f0;min-width:0}
.pm-k{font-size:10px;letter-spacing:.14em;color:#64748b;font-weight:800;margin-bottom:6px}
.pm-outcome{border-color:var(--c)}.pm-outcome-l{font:900 26px system-ui,sans-serif;color:var(--c);letter-spacing:.04em}
.pm-bigscore{font:900 30px ui-monospace,monospace;display:flex;gap:10px;align-items:center}.pm-bigscore i{color:#475569;font-style:normal}
.pm-meta{font-size:11px;color:#94a3b8;margin-top:6px}.pm-dim{color:#64748b}
.pm-mvpcard{border-color:rgba(251,191,36,.5);background:rgba(120,53,15,.18)}.pm-who{font-weight:800;color:#fde68a;margin-bottom:6px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pm-has3d{display:flex;gap:12px;align-items:center}.pm-mvpinfo{min-width:0;flex:1}
.pm-mvp3d{flex:0 0 auto;width:110px;height:140px;border-radius:10px;overflow:hidden;background:#0b1220;border:1px solid rgba(251,191,36,.35)}
.pm-mvp3d canvas,.pm-mvp3d svg{width:100%;height:100%;display:block}
@media (max-width:420px){.pm-mvp3d{width:84px;height:107px}}
.pm-stats{display:flex;gap:14px;font-size:11px;color:#94a3b8}.pm-stats b{font-size:18px;color:#fff;margin-right:2px}
.pm-selfcard{border-color:rgba(56,189,248,.45)}.pm-grid4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}
.pm-grid4 div{background:#0b1220;border-radius:6px;padding:5px 7px}.pm-grid4 small{display:block;font-size:9px;color:#64748b}.pm-grid4 b{font-size:15px}
.pm-awards{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.pm-award{display:flex;gap:8px;align-items:center;border:1px solid var(--c);border-radius:8px;padding:6px 8px;background:color-mix(in srgb,var(--c) 10%,transparent);min-width:0}
.pm-award div{min-width:0}.pm-award small{display:block;font-size:9px;letter-spacing:.12em;color:var(--c);font-weight:800}
.pm-award b{display:block;font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.pm-award em{font-style:normal;font-size:10px;color:#94a3b8}
.pm-aicon{font-size:20px;color:var(--c);width:24px;text-align:center}.pm-award.pm-none{opacity:.45;border-style:dashed}.pm-award.pm-mine{box-shadow:0 0 0 1px var(--c) inset}
.pm-gap{margin-top:14px}.pm-wcards{display:grid;grid-template-columns:1fr 1fr;gap:8px}@media (max-width:560px){.pm-wcards{grid-template-columns:1fr}}
.pm-wcard{border:1px solid var(--c);border-radius:10px;padding:10px 12px;font-family:ui-monospace,monospace;background:color-mix(in srgb,var(--c) 8%,transparent);min-width:0}
.pm-wcard small{display:block;font-size:9px;letter-spacing:.14em;color:var(--c);font-weight:800}.pm-wcard b{display:block;font-size:17px;color:#fff;margin:2px 0}
.pm-wcard em{display:block;font-style:normal;font-size:11px;color:#94a3b8;margin-top:3px}.pm-wcard.pm-none{opacity:.5;border-style:dashed}
.pm-share{position:relative;min-width:70px}.pm-share i{position:absolute;left:6px;top:7px;bottom:7px;background:rgba(56,189,248,.25);border-radius:2px;max-width:calc(100% - 12px)}.pm-share span{position:relative}
.pm-leaders{display:grid;gap:4px;font:12px ui-monospace,monospace;color:#e2e8f0}.pm-leaders div{display:flex;gap:10px;align-items:baseline;padding:4px 6px;border-top:1px solid #1e293b}.pm-leaders b{min-width:120px}
.pm-legend{display:flex;gap:14px;flex-wrap:wrap;font:11px ui-monospace,monospace;color:#cbd5e1;margin:2px 0 6px}.pm-legend i{display:inline-block;width:10px;height:3px;margin-right:5px;vertical-align:middle}
.pm-chart{width:100%;height:auto;display:block;background:#0b1220;border-radius:8px;font:10px ui-monospace,monospace;fill:#64748b}.pm-gl{stroke:#1e293b}.pm-endv{font-weight:800}
.pm-sort:disabled{opacity:.35;cursor:not-allowed}
.pm-rewards{display:grid;grid-template-columns:1.1fr .9fr;gap:10px}@media (max-width:700px){.pm-rewards{grid-template-columns:1fr}}
.pm-rewards-side{display:grid;gap:10px;align-content:start}.pm-ictotal{border-color:rgba(255,138,53,.5);background:rgba(255,138,53,.07)}
.pm-icbig{font:900 34px ui-monospace,monospace;color:#FFAD72;letter-spacing:.02em;height:1.1em}.pm-bal b{color:#FFAD72;font-size:13px}
.pm-iclines{list-style:none;margin:8px 0;padding:0;font-size:12px}.pm-iclines li{display:flex;justify-content:space-between;gap:8px;padding:3px 0;border-top:1px solid #1e293b;color:#94a3b8}.pm-iclines b{color:#f1f5f9}
.pm-xp{display:flex;gap:10px;align-items:baseline;margin-top:6px}.pm-xp small{font-size:9px;letter-spacing:.14em;color:#a78bfa;font-weight:800}.pm-xp b{font-size:18px;color:#c4b5fd}
.pm-elim{display:grid;grid-template-columns:1fr 1fr;gap:6px}.pm-elim div{background:#0b1220;border-radius:6px;padding:5px 8px}.pm-elim small{display:block;font-size:9px;color:#64748b}.pm-elim b{font-size:20px}
.pm-capbar{height:8px;border-radius:4px;background:#1e293b;overflow:hidden}.pm-capbar i{display:block;height:100%;background:linear-gradient(90deg,#ff8a35,#fbbf24)}
.pm-note{font:12px ui-monospace,monospace;padding:8px 10px;border-radius:8px;margin-bottom:10px;border:1px solid #475569}.pm-warn{color:#fbbf24;border-color:rgba(251,191,36,.5)}
.pm-events{list-style:none;margin:8px 0 0;padding:0;font:12px ui-monospace,monospace;color:#cbd5e1;max-height:260px;overflow-y:auto}
.pm-events li{padding:4px 0;border-top:1px solid #1e293b}.pm-events time{color:#64748b;margin-right:8px}
.pm-ev{font-size:10px;font-weight:800;padding:1px 5px;border-radius:4px;background:#1e293b}.pm-ev-streak{color:#fbbf24}.pm-ev-lead_change{color:#38bdf8}.pm-ev-objective{color:#f472b6}
.pm-intro{position:absolute;inset:0;z-index:5;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle,rgba(2,6,23,.75),rgba(2,6,23,.97));cursor:pointer}
.pm-intro-in{text-align:center;font-family:system-ui,sans-serif;animation:pm-pop .55s cubic-bezier(.2,.9,.3,1.25) both}
.pm-intro-label{font-size:clamp(44px,11vw,120px);font-weight:900;letter-spacing:.06em;text-shadow:0 0 40px currentColor}
.pm-intro-sub{font:900 clamp(18px,4vw,30px) ui-monospace,monospace;color:#e2e8f0;margin-top:4px;animation:pm-up .5s .25s both}
.pm-intro-reason{font:700 12px ui-monospace,monospace;letter-spacing:.2em;color:#94a3b8;margin-top:8px;animation:pm-up .5s .4s both}
.pm-skip{margin-top:26px;background:rgba(15,23,42,.8);border:1px solid #475569;color:#cbd5e1;border-radius:8px;padding:8px 14px;font:800 11px ui-monospace,monospace;letter-spacing:.12em;cursor:pointer}
.pm-skip small{color:#64748b;margin-left:6px}.pm-skip:focus-visible{outline:2px solid #fbbf24}
.pm-intro.pm-out{opacity:0;transition:opacity .25s}
.pm-intro[hidden]{display:none!important}
.pm-intro.pm-still .pm-intro-in,.pm-intro.pm-still .pm-intro-sub,.pm-intro.pm-still .pm-intro-reason{animation:none}.pm-intro.pm-still.pm-out{transition:none}
@keyframes pm-pop{0%{opacity:0;transform:scale(1.5);letter-spacing:.3em}100%{opacity:1;transform:none}}
@keyframes pm-up{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.pm-intro-in,.pm-intro-sub,.pm-intro-reason{animation:none}.pm-intro.pm-out{transition:none}}`;

let cssDone = false;
function ensureCss() {
  if (cssDone || typeof document === 'undefined') return;
  const s = document.createElement('style'); s.id = 'pm-style'; s.textContent = SCOREBOARD_CSS + DASH_CSS; document.head.append(s); cssDone = true;
}

export function mountScoreboard(el, result, opts = {}) {
  if (!el) return;
  ensureCss();
  let sort = opts.sort || 'contribution';
  const draw = () => { el.innerHTML = scoreboardHTML(result, { ...opts, sort }); };
  el.onclick = e => { const b = e.target.closest?.('[data-sort]'); if (!b) return; sort = b.dataset.sort; draw(); el.querySelector(`[data-sort="${sort}"]`)?.focus(); };
  el.hidden = !result; draw();
}

 
export function selectTab(root, tab, focus = false) {
  if (!root) return;
  for (const t of TABS) {
    const b = root.querySelector(`[data-tab="${t}"]`), p = root.querySelector(`#pm-panel-${t}`);
    if (b) { b.setAttribute('aria-selected', String(t === tab)); b.tabIndex = t === tab ? 0 : -1; if (t === tab && focus) b.focus(); }
    if (p) p.hidden = t !== tab;
  }
  if (tab === 'rewards') { const p = root.querySelector('#pm-panel-rewards'), reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches; runOdometers(p); runCountUps(p, { reduced }); }
}
export function bindTabs(root) {
  const bar = root?.querySelector('.pm-tabs'); if (!bar || bar.dataset.bound) return; bar.dataset.bound = '1'; ensureCss();
  bar.addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) selectTab(root, b.dataset.tab, true); });
  bar.addEventListener('keydown', e => {
    const cur = TABS.indexOf(bar.querySelector('[aria-selected=true]')?.dataset.tab); if (cur < 0) return;
    const next = { ArrowRight: cur + 1, ArrowLeft: cur - 1, Home: 0, End: TABS.length - 1 }[e.key]; if (next == null) return;
    e.preventDefault(); selectTab(root, TABS[(next + TABS.length) % TABS.length], true);
  });
}

 
export function playIntro(el, model, { reduced = false, low = false, onDone = () => {}, win = typeof window !== 'undefined' ? window : null } = {}) {
  if (!el) { onDone(); return { skip() {} }; }
  ensureCss();
  const still = reduced || low, hold = still ? 1200 : 2800;
  el.innerHTML = introHTML(model); el.hidden = false; el.classList.toggle('pm-still', still); el.classList.remove('pm-out');
  let done = false, t1 = 0, t2 = 0;
  const finish = () => {
    if (done) return; done = true; clearTimeout(t1); win?.removeEventListener('keydown', onKey, true);
    const close = () => { el.hidden = true; el.innerHTML = ''; onDone(); };
    el.classList.add('pm-out'); if (still) close(); else t2 = setTimeout(close, 250);
  };
  const onKey = e => { if (['Enter', 'Escape', ' ', 'Spacebar'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); finish(); } };
  el.onclick = finish; win?.addEventListener('keydown', onKey, true);
  el.querySelector('[data-skip]')?.focus?.({ preventScroll: true });
  t1 = setTimeout(finish, hold);
  return { skip: finish, get done() { return done; }, hold };
}
