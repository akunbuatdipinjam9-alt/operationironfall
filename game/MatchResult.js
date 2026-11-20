 
 
 
 
 
 

export const RESULT_VERSION = 1;
export const TIMELINE_INTERVAL_MS = 5000;
export const TIMELINE_MAX_SAMPLES = 240;    
export const TIMELINE_MAX_EVENTS = 160;

const n = v => (Number.isFinite(+v) ? +v : 0);
const pos = v => Math.max(0, Math.round(n(v)));
export const accuracyOf = (hits, shots) => (pos(shots) > 0 ? Math.min(100, Math.round(pos(hits) / pos(shots) * 100)) : null);
export const kdaOf = p => (pos(p.kills) + pos(p.assists)) / Math.max(1, pos(p.deaths));

 
export function contributionScore(p) {
  return Math.max(0, Math.round(pos(p.kills) * 100 + pos(p.assists) * 55 + pos(p.objectives) * 25 + n(p.damage) * 0.12 + (accuracyOf(p.hits, p.shots) ?? 0) * 0.35 - pos(p.deaths) * 18));
}

export function newMatchId(prefix = 'm') {
  const r = (globalThis.crypto?.randomUUID?.() || (Date.now().toString(36) + Math.random().toString(36).slice(2, 10)));
  return prefix + '-' + r;
}

 
export function weaponLedger() { return {}; }
export function ledgerAdd(ledger, index, field, amount = 1) {
  if (!ledger || !Number.isInteger(index) || index < 0) return;
  const w = ledger[index] || (ledger[index] = { shots: 0, hits: 0, kills: 0, damage: 0, headshotKills: 0 });
  w[field] = (w[field] || 0) + amount;
}

 
export function createTimeline({ intervalMs = TIMELINE_INTERVAL_MS, metric = 'TEAM_SCORE', startedAt = 0 } = {}) {
  const tl = { intervalMs, metric, startedAt, samples: [], events: [], nextAt: 0, lead: null };
  return tl;
}
export function timelineSample(tl, now, sample, force = false) {
  if (!tl) return false;
  if (!force && now < tl.nextAt) return false;
  tl.nextAt = now + tl.intervalMs;
  const t = Math.max(0, Math.round(now - tl.startedAt));
  if (tl.samples.length && tl.samples[tl.samples.length - 1].t === t) tl.samples[tl.samples.length - 1] = { t, ...sample };
  else tl.samples.push({ t, ...sample });
  if (tl.samples.length > TIMELINE_MAX_SAMPLES) {  
    tl.samples = [tl.samples[0], ...tl.samples.slice(1).filter((_, i) => i % 2 === 0)]; tl.intervalMs *= 2;
  }
  if (sample.blue != null && sample.red != null) {
    const lead = sample.blue > sample.red ? 'BLUE' : sample.red > sample.blue ? 'RED' : null;
    if (lead && tl.lead && lead !== tl.lead) timelineEvent(tl, now, { type: 'LEAD_CHANGE', team: lead, detail: `${sample.blue}–${sample.red}` });
    if (lead) tl.lead = lead;
  }
  return true;
}
export function timelineEvent(tl, now, ev) {
  if (!tl) return;
  tl.events.push({ t: Math.max(0, Math.round(now - tl.startedAt)), ...ev });
  if (tl.events.length > TIMELINE_MAX_EVENTS) tl.events.splice(0, tl.events.length - TIMELINE_MAX_EVENTS);
}

const deepFreeze = o => { if (o && typeof o === 'object' && !Object.isFrozen(o)) { Object.freeze(o); for (const v of Object.values(o)) deepFreeze(v); } return o; };

 
 
export function buildMatchResult(input) {
  const catalog = input.catalog || [];
  const kind = input.kind || 'TEAM';
  const players = (input.players || []).filter(p => p && p.id != null && p.kind !== 'siege' && p.kind !== 'boss' && !p.minion).map(p => {
    const weapons = Object.entries(p.weapons || {}).map(([i, w]) => ({
      index: +i, name: catalog[+i]?.name || `#${i}`, shots: pos(w.shots), hits: pos(w.hits), kills: pos(w.kills), damage: pos(w.damage),
      headshotKills: pos(w.headshotKills), accuracy: accuracyOf(w.hits, w.shots),
    })).filter(w => w.shots || w.hits || w.kills || w.damage).sort((a, b) => b.kills - a.kills || b.damage - a.damage);
    const out = {
      id: String(p.id), name: String(p.name || p.id).slice(0, 40), kind: p.kind === 'human' ? 'human' : 'bot', team: p.team || null,
      character: p.character || null, agent: p.agent || null, disconnected: p.connected === false,
      kills: pos(p.kills), deaths: pos(p.deaths), assists: pos(p.assists), damage: pos(p.damage), shots: pos(p.shots), hits: pos(p.hits),
      headshotKills: p.headshotKills == null ? null : pos(p.headshotKills), objectives: pos(p.objectives),
      weapons,
    };
    out.accuracy = accuracyOf(out.hits, out.shots);
    out.kda = Math.round(kdaOf(out) * 100) / 100;
    out.contribution = contributionScore(out);
    return out;
  });
  const order = (a, b) => b.contribution - a.contribution || b.kills - a.kills || a.deaths - b.deaths || (a.id < b.id ? -1 : 1);
  players.sort(order).forEach((p, i) => { p.rank = i + 1; });
  for (const team of new Set(players.map(p => p.team))) players.filter(p => p.team === team).forEach((p, i) => { p.teamRank = i + 1; });
  for (const p of players) {
    const most = p.weapons.slice().sort((a, b) => b.shots - a.shots || b.kills - a.kills)[0] || null;
    const eff = p.weapons.filter(w => w.kills > 0 || w.damage > 0).sort((a, b) => b.kills - a.kills || b.damage - a.damage)[0] || null;
    p.mostUsedWeapon = most ? most.index : null; p.mostEffectiveWeapon = eff ? eff.index : null;
  }
  const mvp = players[0] || null;
  const best = (list, key) => list.slice().sort((a, b) => (b[key] ?? -1) - (a[key] ?? -1) || order(a, b))[0] || null;
  const deadeye = best(players.filter(p => p.shots >= 10 && p.accuracy != null), 'accuracy');
  const support = best(players.filter(p => p.assists > 0), 'assists');
  const objective = best(players.filter(p => p.objectives > 0), 'objectives');
  const award = (p, value, unit) => (p ? { id: p.id, value, unit } : null);

  const scores = input.teamScores ? { BLUE: pos(input.teamScores.BLUE), RED: pos(input.teamScores.RED) } : null;
  let winnerTeam = input.winnerTeam || null, winnerId = input.winnerId != null ? String(input.winnerId) : null;
   
  const story = input.story && typeof input.story.ending === 'string' ? { ending: input.story.ending } : null;
  if (kind === 'TEAM' && !winnerTeam && scores && !input.abnormal && !story) winnerTeam = scores.BLUE > scores.RED ? 'BLUE' : scores.RED > scores.BLUE ? 'RED' : null;
  if (kind === 'FFA' && !winnerId && players.length && !input.abnormal) { const top = players.slice().sort((a, b) => b.kills - a.kills || order(a, b)); if (top[0] && (!top[1] || top[0].kills > top[1].kills)) winnerId = top[0].id; }
  const draw = !input.abnormal && !story && ((kind === 'TEAM' && !winnerTeam && !!scores) || (kind === 'FFA' && !winnerId));
  const placements = kind === 'FFA' ? players.slice().sort((a, b) => b.kills - a.kills || order(a, b)).map(p => p.id) : null;

  const tl = input.timeline || null;
  const result = {
    v: RESULT_VERSION, matchId: String(input.matchId || newMatchId()), source: input.source === 'server' ? 'server' : 'local',
    gameMode: input.gameMode || 'TDM', map: input.map || null, kind, reason: input.reason || 'TIME',
    startedAt: pos(input.startedAt), endedAt: pos(input.endedAt), durationMs: Math.max(0, pos(input.endedAt) - pos(input.startedAt)),
    teams: scores, winnerTeam, winnerId, draw, abnormal: !!input.abnormal, placements,
    raidResult: input.raidResult || null, story,
    players, mvpId: mvp ? mvp.id : null,
    awards: {
      deadeye: award(deadeye, deadeye?.accuracy, '%'), support: award(support, support?.assists, 'assists'),
      objectives: award(objective, objective?.objectives, 'actions'), impact: award(mvp, mvp?.contribution, 'score'),
    },
    timeline: tl ? { intervalMs: tl.intervalMs, metric: tl.metric, samples: tl.samples.slice(), events: tl.events.slice() } : { intervalMs: 0, metric: 'NONE', samples: [], events: [] },
  };
  return deepFreeze(result);
}

 
export function isMatchResult(r) {
  return !!r && r.v === RESULT_VERSION && typeof r.matchId === 'string' && Array.isArray(r.players) && r.timeline && Array.isArray(r.timeline.samples);
}

 
export function outcomeFor(result, selfId) {
  if (!result) return { label: 'MATCH COMPLETE', state: 'COMPLETE' };
  if (result.abnormal) return { label: 'MATCH ENDED', state: 'ABORTED' };
  const me = result.players.find(p => p.id === selfId);
  if (result.story) {
    const e = result.story.ending, label = e.replaceAll('_', ' ');
    if (e === 'SEAL_RESTORED') return { label, state: 'VICTORY' };
    if (e === 'INCOMPLETE_RESCUE') return me && result.winnerTeam === me.team ? { label, state: 'VICTORY' } : { label, state: 'DEFEAT' };
    return { label, state: 'DEFEAT' };
  }
  if (result.kind === 'RAID') return result.raidResult === 'COMPLETE' ? { label: 'VICTORY', state: 'VICTORY' } : { label: 'DEFEAT', state: 'DEFEAT' };
  if (result.kind === 'FFA' || result.kind === 'SURVIVAL') {
    if (result.winnerId && result.winnerId === selfId) return { label: 'WINNER', state: 'VICTORY' };
    const place = result.placements ? result.placements.indexOf(selfId) + 1 : 0;
    return { label: 'MATCH COMPLETE', state: 'COMPLETE', place: place > 0 ? place : null };
  }
  if (result.draw) return { label: 'DRAW', state: 'DRAW' };
  if (!me || !me.team) return { label: result.winnerTeam ? result.winnerTeam + ' TEAM WINS' : 'MATCH COMPLETE', state: 'COMPLETE' };
  return result.winnerTeam === me.team ? { label: 'VICTORY', state: 'VICTORY' } : { label: 'DEFEAT', state: 'DEFEAT' };
}

export const SORTS = Object.freeze({
  contribution: (a, b) => b.contribution - a.contribution || b.kills - a.kills,
  kills: (a, b) => b.kills - a.kills || a.deaths - b.deaths,
  damage: (a, b) => b.damage - a.damage || b.kills - a.kills,
  kda: (a, b) => b.kda - a.kda || b.kills - a.kills,
});
export function scoreboardGroups(result, sortKey = 'contribution') {
  const cmp = SORTS[sortKey] || SORTS.contribution;
  if (!result) return [];
  if (result.kind === 'FFA' || result.kind === 'SURVIVAL' || !result.players.some(p => p.team === 'BLUE' || p.team === 'RED'))
    return [{ team: null, score: null, players: result.players.slice().sort(cmp) }];
  return ['BLUE', 'RED'].map(team => ({ team, score: result.teams ? result.teams[team] : null, players: result.players.filter(p => p.team === team).sort(cmp) }))
    .filter(g => g.players.length);
}
