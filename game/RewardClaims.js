 
 
 
export const CLAIMS_KEY = 'ironfall.rewardClaims.v1';
export const MAX_CLAIMS = 60;

export function createRewardClaims({ storage = null } = {}) {
  let list = [];
  try { const raw = storage?.getItem(CLAIMS_KEY); const v = raw ? JSON.parse(raw) : []; if (Array.isArray(v)) list = v.filter(x => x && typeof x.id === 'string'); } catch (e) { list = []; }
  const save = () => { try { storage?.setItem(CLAIMS_KEY, JSON.stringify(list)); } catch (e) {   } };
  return {
    has: id => !!id && list.some(x => x.id === id),
    get: id => list.find(x => x.id === id) || null,
     
    claim(id, record = {}) {
      if (!id || list.some(x => x.id === id)) return false;
      list.push({ id, at: Date.now(), ...JSON.parse(JSON.stringify(record)) });
      if (list.length > MAX_CLAIMS) list = list.slice(-MAX_CLAIMS);
      save(); return true;
    },
    get size() { return list.length; },
  };
}

 
 
export function guardEndMatch(ironCredits, { claims, progress = null, onSummary = () => {}, onLevelUp = () => {} }) {
  const endMatch = ironCredits.endMatch.bind(ironCredits);
  ironCredits.endMatch = opts => {
    const m = ironCredits.match, live = !!(m && !m.ended && !m.training), id = opts?.matchId || null, completed = opts?.completed !== false;
    if (live && id && completed && claims.has(id)) {
      m.ended = true; m.completed = true;
      const out = { ...(claims.get(id).summary || ironCredits.summary()), duplicate: true, matchId: id, balance: ironCredits.balance };
      onSummary(out); return out;
    }
    const out = endMatch(opts);
    if (live) {
      const r = progress?.recordMatch({ kills: m.kills, won: !!opts?.won, completed });
      if (r && r.levelUp) onLevelUp(r.levelUp);
      if (out) { out.xp = r ? r.xp : 0; out.levelUp = r?.levelUp || 0; if (id) out.matchId = id; }
      if (out && id && completed) claims.claim(id, { summary: out });
      if (out && completed) onSummary(out);
    }
    return out;
  };
  return ironCredits;
}
