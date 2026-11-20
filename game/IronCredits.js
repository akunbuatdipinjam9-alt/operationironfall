








import { REDEEM, codeHash } from './Arsenal.js';

export const IC_NAME = 'IRON CREDITS';
export const IC_SHORT = 'IC';
export const STORAGE_KEY = 'ironfall.credits.v1';


export const EARN = Object.freeze({
  KILL: { id: 'KILL', label: 'Eliminations', ic: 5, capped: true },
  HEADSHOT: { id: 'HEADSHOT', label: 'Headshot bonus', ic: 3, capped: true },
  STREAK: { id: 'STREAK', label: 'Kill streaks (3 without dying)', ic: 10, capped: true },
  WIN: { id: 'WIN', label: 'Match won', ic: 60, capped: true },
  FINISH: { id: 'FINISH', label: 'Match completed', ic: 20, capped: true },
  ASSIST: { id: 'ASSIST', label: 'Assists', ic: 2, capped: true },
  DAILY: { id: 'DAILY', label: 'Daily challenge', ic: 50, capped: false },
  WEEKLY: { id: 'WEEKLY', label: 'Weekly operation', ic: 200, capped: false },
  BOSS_KILL: { id: 'BOSS_KILL', label: 'Raid boss defeated', ic: 250, capped: true },
  BOSS_DAMAGE: { id: 'BOSS_DAMAGE', label: 'Raid boss damage (per 1,000)', ic: 5, capped: true },
  HARD_BONUS: { id: 'HARD_BONUS', label: 'Hardcore / Blind victory ×1.5', ic: 0, capped: true },
  LOGIN: { id: 'LOGIN', label: 'Daily login streak', ic: 10, capped: false },
  MATCH_LEVEL: { id: 'MATCH_LEVEL', label: 'Match level reward', ic: 300, capped: false }
});
export const DAILY_MATCH_CAP = 1500;
export const STREAK_EVERY = 3;
export const BOSS_DAMAGE_STEP = 1000;
export const HARD_MULTIPLIER = 1.5;
export const LOGIN_MAX = 50;
const HARD_MODES = ['HARDCORE', 'BLIND'];


export const WEEKLY = Object.freeze([
  { id: 'w_kills', label: 'Get 100 eliminations', goal: 100 },
  { id: 'w_head', label: 'Get 30 headshot eliminations', goal: 30 },
  { id: 'w_wins', label: 'Win 5 matches', goal: 5 },
  { id: 'w_raid', label: 'Defeat the Raid boss', goal: 1 },
  { id: 'w_modes', label: 'Finish matches in 3 different modes', goal: 3 },
  { id: 'w_maps', label: 'Finish matches on 4 different maps', goal: 4 }
]);


export const SHOP = Object.freeze([
  { id: 'camo_default', slot: 'camo', name: 'FACTORY FINISH', price: 0, value: null },
  { id: 'camo_desert', slot: 'camo', name: 'DESERT TAN', price: 500, value: 0xc9a574 },
  { id: 'camo_jungle', slot: 'camo', name: 'JUNGLE GREEN', price: 500, value: 0x6f8a52 },
  { id: 'camo_arctic', slot: 'camo', name: 'ARCTIC WHITE', price: 750, value: 0xe4e9ee },
  { id: 'camo_crimson', slot: 'camo', name: 'CRIMSON OPS', price: 1000, value: 0xa83a35 },
  { id: 'camo_cobalt', slot: 'camo', name: 'COBALT', price: 1000, value: 0x3f63a8 },
  { id: 'camo_gold', slot: 'camo', name: 'IRONFALL GOLD', price: 2500, value: 0xd8a83e },
  { id: 'xhair_default', slot: 'crosshair', name: 'STANDARD GREEN', price: 0, value: '#34d399' },
  { id: 'xhair_cyan', slot: 'crosshair', name: 'CYAN', price: 300, value: '#22d3ee' },
  { id: 'xhair_yellow', slot: 'crosshair', name: 'HAZARD YELLOW', price: 300, value: '#facc15' },
  { id: 'xhair_magenta', slot: 'crosshair', name: 'MAGENTA', price: 300, value: '#f472b6' },
  { id: 'xhair_white', slot: 'crosshair', name: 'PURE WHITE', price: 300, value: '#f8fafc' },
  { id: 'plate_default', slot: 'plate', name: 'STANDARD PLATE', price: 0, value: null },
  { id: 'plate_orange', slot: 'plate', name: 'IRONFALL ORANGE', price: 400, value: '#ff8a35' },
  { id: 'plate_steel', slot: 'plate', name: 'GUNMETAL', price: 400, value: '#94a3b8' },
  { id: 'plate_gold', slot: 'plate', name: 'VETERAN GOLD', price: 1500, value: '#f5c84c' }
]);
export const SLOTS = ['camo', 'crosshair', 'plate'];
const DEFAULT_EQUIP = { camo: 'camo_default', crosshair: 'xhair_default', plate: 'plate_default' };


export function dayKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

export function weekKey(d) { const m = new Date(d.getFullYear(), d.getMonth(), d.getDate()); m.setDate(m.getDate() - ((m.getDay() + 6) % 7)); return dayKey(m); }
export function nextWeekReset(d) { const m = new Date(d.getFullYear(), d.getMonth(), d.getDate()); m.setDate(m.getDate() - ((m.getDay() + 6) % 7) + 7); return m; }
function prevDayKey(key) { const [y, mo, da] = key.split('-').map(Number); const d = new Date(y, mo - 1, da); d.setDate(d.getDate() - 1); return dayKey(d); }
export function loginReward(streak) { return Math.min(LOGIN_MAX, EARN.LOGIN.ic * Math.max(1, streak | 0)); }

const nat = v => (Number.isFinite(+v) && +v > 0 ? Math.floor(+v) : 0);

function blank(now) {
  return {
    v: 1, balance: 0, lifetime: 0,
    day: dayKey(now), earnedToday: 0,
    login: { last: null, streak: 0 },
    week: weekKey(now), weekly: {}, claimedWeekly: {}, weeklyModes: [], weeklyMaps: [],
    owned: SHOP.filter(i => i.price === 0).map(i => i.id),
    equipped: { ...DEFAULT_EQUIP },
    unlocks: [], redeemed: []
  };
}


export function sanitize(raw, now) {
  const s = blank(now);
  if (!raw || typeof raw !== 'object') return s;
  s.balance = nat(raw.balance); s.lifetime = Math.max(nat(raw.lifetime), s.balance);
  if (typeof raw.day === 'string') { s.day = raw.day; s.earnedToday = nat(raw.earnedToday); }
  if (raw.login && typeof raw.login === 'object') { s.login.last = typeof raw.login.last === 'string' ? raw.login.last : null; s.login.streak = nat(raw.login.streak); }
  if (typeof raw.week === 'string') {
    s.week = raw.week;
    for (const w of WEEKLY) { s.weekly[w.id] = Math.min(w.goal, nat(raw.weekly?.[w.id])); if (raw.claimedWeekly?.[w.id] === true) s.claimedWeekly[w.id] = true; }
    s.weeklyModes = Array.isArray(raw.weeklyModes) ? raw.weeklyModes.filter(x => typeof x === 'string').slice(0, 16) : [];
    s.weeklyMaps = Array.isArray(raw.weeklyMaps) ? raw.weeklyMaps.filter(x => typeof x === 'string').slice(0, 32) : [];
  }
  const ids = new Set(SHOP.map(i => i.id));
  if (Array.isArray(raw.owned)) for (const id of raw.owned) if (ids.has(id) && !s.owned.includes(id)) s.owned.push(id);
  const KEY = /^(w:\d{1,3}|c:[a-z]{2,16})$/;
  if (Array.isArray(raw.unlocks)) s.unlocks = [...new Set(raw.unlocks.filter(k => typeof k === 'string' && KEY.test(k)))].slice(0, 200);
  if (Array.isArray(raw.redeemed)) s.redeemed = [...new Set(raw.redeemed.filter(k => typeof k === 'string' && REDEEM[k]))];
  for (const slot of SLOTS) { const id = raw.equipped?.[slot]; const item = SHOP.find(i => i.id === id); if (item && item.slot === slot && s.owned.includes(id)) s.equipped[slot] = id; }
  return s;
}








export function createIronCredits({ storage = null, now = () => new Date(), onChange = () => {}, onToast = () => {} } = {}) {
  let state;
  try { state = sanitize(JSON.parse(storage?.getItem(STORAGE_KEY) || 'null'), now()); } catch { state = blank(now()); }
  let match = null;

  const save = () => { try { storage?.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {                                             } };
  const changed = () => { save(); onChange(api); };

  function rollover() {
    const d = now(), dk = dayKey(d), wk = weekKey(d);
    if (state.day !== dk) { state.day = dk; state.earnedToday = 0; }
    if (state.week !== wk) { state.week = wk; state.weekly = {}; state.claimedWeekly = {}; state.weeklyModes = []; state.weeklyMaps = []; }
  }


  function credit(src, amount, note) {
    rollover();
    amount = nat(amount);
    if (!amount) return 0;
    if (src.capped) {
      const room = Math.max(0, DAILY_MATCH_CAP - state.earnedToday);
      if (amount > room) { amount = room; if (match) match.capped = true; }
      state.earnedToday += amount;
    }
    if (!amount) return 0;
    state.balance += amount; state.lifetime += amount;
    if (match) {
      const row = match.lines[src.id] || (match.lines[src.id] = { label: note || src.label, count: 0, ic: 0 });
      row.count++; row.ic += amount; match.total += amount;
      if (src.capped && src.id !== 'HARD_BONUS') match.baseEarned += amount;
    }
    return amount;
  }

  function bumpWeekly(id, n = 1) {
    rollover();
    const w = WEEKLY.find(x => x.id === id); if (!w) return;
    state.weekly[id] = Math.min(w.goal, (state.weekly[id] || 0) + n);
    if (state.weekly[id] >= w.goal && !state.claimedWeekly[id]) {
      state.claimedWeekly[id] = true;
      const got = credit(EARN.WEEKLY, EARN.WEEKLY.ic, 'Weekly: ' + w.label);
      onToast(`WEEKLY OPERATION COMPLETE — ${w.label.toUpperCase()} · +${got} ${IC_SHORT}`);
    }
  }

  const live = () => match && !match.ended && !match.training;

  const api = {
    get balance() { return state.balance; },
    get state() { return state; },
    get match() { return match; },


     
    matchLevelReward(amount, level) { const got = credit(EARN.MATCH_LEVEL, amount, `Match level ${level} reward`); changed(); return got; },

    checkLogin() {
      rollover();
      const today = state.day;
      if (state.login.last === today) return 0;
      state.login.streak = state.login.last === prevDayKey(today) ? state.login.streak + 1 : 1;
      state.login.last = today;
      const got = credit(EARN.LOGIN, loginReward(state.login.streak), `Login streak day ${state.login.streak}`);
      onToast(`DAILY LOGIN · DAY ${state.login.streak} · +${got} ${IC_SHORT}`);
      changed();
      return got;
    },

    startMatch({ mode = 'TDM', map = '', online = false, training = false } = {}) {
      rollover();
      match = { mode, map, online, training: !!training, lines: {}, total: 0, baseEarned: 0, streak: 0, kills: 0, bossDamageBank: 0, ended: false, capped: false };
      return match;
    },

    kill({ headshot = false } = {}) {
      if (!live()) return;
      match.kills++; match.streak++;
      credit(EARN.KILL, EARN.KILL.ic);
      bumpWeekly('w_kills');
      if (headshot) { credit(EARN.HEADSHOT, EARN.HEADSHOT.ic); bumpWeekly('w_head'); }
      if (match.streak % STREAK_EVERY === 0) credit(EARN.STREAK, EARN.STREAK.ic);
      changed();
    },
    death() { if (match) match.streak = 0; },
    assist(n = 1) { if (!live()) return; for (let i = 0; i < nat(n); i++) credit(EARN.ASSIST, EARN.ASSIST.ic); changed(); },

    bossDamage(amount) {
      if (!live()) return;
      match.bossDamageBank += Math.max(0, +amount || 0);
      let paid = false;
      while (match.bossDamageBank >= BOSS_DAMAGE_STEP) { match.bossDamageBank -= BOSS_DAMAGE_STEP; credit(EARN.BOSS_DAMAGE, EARN.BOSS_DAMAGE.ic); paid = true; }
      if (paid) changed();
    },
    bossDefeated() { if (!live() || match.bossPaid) return; match.bossPaid = true; credit(EARN.BOSS_KILL, EARN.BOSS_KILL.ic); bumpWeekly('w_raid'); changed(); },


    dailyChallenge(label) { const got = credit(EARN.DAILY, EARN.DAILY.ic, 'Daily: ' + label); changed(); return got; },





    endMatch({ won = false, completed = true } = {}) {
      if (!match || match.ended) return match ? api.summary() : null;
      if (match.training) { match.ended = true; return api.summary(); }
      if (completed) {
        if (won) { credit(EARN.WIN, EARN.WIN.ic); bumpWeekly('w_wins'); }
        else credit(EARN.FINISH, EARN.FINISH.ic);
        if (won && HARD_MODES.includes(match.mode)) credit(EARN.HARD_BONUS, Math.round(match.baseEarned * (HARD_MULTIPLIER - 1)), `${match.mode} victory ×${HARD_MULTIPLIER}`);
        if (match.mode && !state.weeklyModes.includes(match.mode)) { state.weeklyModes.push(match.mode); bumpWeekly('w_modes'); }
        if (match.map && !state.weeklyMaps.includes(match.map)) { state.weeklyMaps.push(match.map); bumpWeekly('w_maps'); }
      }
      match.ended = true; match.won = !!won; match.completed = !!completed;
      changed();
      return api.summary();
    },

    summary() {
      if (!match) return null;
      return { mode: match.mode, training: match.training, total: match.total, capped: match.capped, lines: Object.values(match.lines).map(l => ({ ...l })), balance: state.balance, capLeft: Math.max(0, DAILY_MATCH_CAP - state.earnedToday) };
    },

    weekly() { rollover(); return WEEKLY.map(w => ({ ...w, reward: EARN.WEEKLY.ic, progress: state.weekly[w.id] || 0, done: !!state.claimedWeekly[w.id] })); },
    weeklyResetAt() { return nextWeekReset(now()); },

    owns(id) { return state.owned.includes(id); },
    equipped(slot) { return SHOP.find(i => i.id === state.equipped[slot]) || SHOP.find(i => i.id === DEFAULT_EQUIP[slot]); },

    buy(id) {
      const item = SHOP.find(i => i.id === id);
      if (!item) return { ok: false, reason: 'UNKNOWN_ITEM' };
      if (state.owned.includes(id)) return { ok: false, reason: 'OWNED' };
      if (state.balance < item.price) return { ok: false, reason: 'NOT_ENOUGH_IC' };
      state.balance -= item.price; state.owned.push(id); state.equipped[item.slot] = id;
      changed();
      return { ok: true };
    },

    ownsUnlock(key) { return state.unlocks.includes(key); },
    buyUnlock(key, price) {
      if (state.unlocks.includes(key)) return { ok: false, reason: 'OWNED' };
      price = nat(price);
      if (state.balance < price) return { ok: false, reason: 'NOT_ENOUGH_IC' };
      state.balance -= price; state.unlocks.push(key); changed();
      return { ok: true };
    },

    redeem(code) {
      const h = codeHash(code);
      if (!h) return { ok: false, reason: 'EMPTY' };
      const reward = REDEEM[h];
      if (!reward) return { ok: false, reason: 'INVALID' };
      if (state.redeemed.includes(h)) return { ok: false, reason: 'USED' };
      state.redeemed.push(h);
      if (reward.ic) { state.balance += reward.ic; state.lifetime += reward.ic; }
      for (const id of reward.items || []) if (SHOP.some(i => i.id === id) && !state.owned.includes(id)) state.owned.push(id);
      for (const k of reward.unlocks || []) if (!state.unlocks.includes(k)) state.unlocks.push(k);
      changed();
      return { ok: true, reward };
    },
    equip(id) {
      const item = SHOP.find(i => i.id === id);
      if (!item || !state.owned.includes(id)) return false;
      state.equipped[item.slot] = id; changed(); return true;
    }
  };
  return api;
}
