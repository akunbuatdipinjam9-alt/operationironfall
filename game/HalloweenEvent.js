 
 
 
 

export const EVENT_MODE_IDS = ['THE_BROKEN_SEAL'];
export const EVENT_MAP_IDS = ['HAUNTED_MANSION'];

export const EVENT_MAP_INFO = {
  HAUNTED_MANSION: { name: 'HAUNTED MANSION', loc: 'Victorian estate • one vast floor • storm outside', size: 'Huge / 180×150 m / 24 areas', env: 'Indoor / Candlelight / Rain', range: 'Close to Medium', modes: 'The Broken Seal • Deathmatch' },
};

export const OFFLINE_STATUS = Object.freeze({
  type: 'eventStatus', id: null, name: '', phase: 'UNKNOWN', active: false, preview: false, takeover: false,
  serverTime: 0, startAt: 0, endAt: 0, graceEndsAt: 0, lobby: 'NORMAL',
  allowedModes: null, allowedMaps: null, hiddenModes: EVENT_MODE_IDS, hiddenMaps: EVENT_MAP_IDS,
  defaultMode: 'TDM', defaultMap: 'SECTOR7', contentReady: {},
});

const ids = v => (Array.isArray(v) ? v.filter(x => typeof x === 'string' && x.length < 40) : null);
const num = v => (Number.isFinite(+v) ? +v : 0);

export function normalizeStatus(raw) {
  if (!raw || typeof raw !== 'object') return OFFLINE_STATUS;
  const takeover = !!raw.takeover && !!ids(raw.allowedModes)?.length && !!ids(raw.allowedMaps)?.length;
  return Object.freeze({
    ...OFFLINE_STATUS,
    id: typeof raw.id === 'string' ? raw.id : null, name: String(raw.name || ''), phase: String(raw.phase || 'UNKNOWN'),
    active: !!raw.active, preview: !!raw.preview, takeover,
    serverTime: num(raw.serverTime), startAt: num(raw.startAt), endAt: num(raw.endAt), graceEndsAt: num(raw.graceEndsAt),
    lobby: takeover ? String(raw.lobby || 'HALLOWEEN_MANSION') : 'NORMAL',
    allowedModes: takeover ? ids(raw.allowedModes) : null, allowedMaps: takeover ? ids(raw.allowedMaps) : null,
    hiddenModes: [...new Set([...(ids(raw.hiddenModes) || []), ...EVENT_MODE_IDS])],
    hiddenMaps: [...new Set([...(ids(raw.hiddenMaps) || []), ...EVENT_MAP_IDS])],
    defaultMode: takeover ? String(raw.defaultMode || raw.allowedModes[0]) : 'TDM',
    defaultMap: takeover ? String(raw.defaultMap || raw.allowedMaps[0]) : 'SECTOR7',
    contentReady: raw.contentReady && typeof raw.contentReady === 'object' ? { ...raw.contentReady } : {},
  });
}

 
export function isVisible(kind, id, status) {
  const s = normalizeStatus(status);
  if (s.takeover) return (kind === 'mode' ? s.allowedModes : s.allowedMaps).includes(id);
  return !(kind === 'mode' ? s.hiddenModes : s.hiddenMaps).includes(id);
}

 
export function pickVisible(kind, current, list, status) {
  const s = normalizeStatus(status), ok = id => list.includes(id) && isVisible(kind, id, s);
  if (ok(current)) return current;
  const def = kind === 'mode' ? s.defaultMode : s.defaultMap;
  return ok(def) ? def : (list.find(ok) ?? current);
}

export function contentReady(id, status) {
  if (!EVENT_MODE_IDS.includes(id) && !EVENT_MAP_IDS.includes(id)) return true;
  return !!normalizeStatus(status).contentReady[id];
}

export function countdownText(ms) {
  const t = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(t / 86400), h = Math.floor(t / 3600) % 24, m = Math.floor(t / 60) % 60, s = t % 60;
  const hms = [h, m, s].map(v => String(v).padStart(2, '0')).join(':');
  return d ? `${d}D ${hms}` : hms;
}

 
export class EventClock {
  constructor({ now = () => Date.now() } = {}) { this.now = now; this.status = OFFLINE_STATUS; this.offset = 0; }
  set(raw) { this.status = normalizeStatus(raw); this.offset = this.status.serverTime ? this.status.serverTime - this.now() : 0; return this.status; }
  serverNow() { return this.now() + this.offset; }
  msToEnd() { return Math.max(0, this.status.endAt - this.serverNow()); }
  msToStart() { return Math.max(0, this.status.startAt - this.serverNow()); }
   
  stale() {
    const s = this.status, t = this.serverNow();
    const edge = { UPCOMING: s.startAt, ACTIVE: s.endAt, GRACE: s.graceEndsAt }[s.phase];
    return edge > 0 && t >= edge;
  }
  key() { const s = this.status; return `${s.takeover}|${s.preview}|${s.phase}|${(s.allowedModes || []).join()}|${(s.allowedMaps || []).join()}|${JSON.stringify(s.contentReady)}`; }
}

export function bannerModel(clock) {
  const s = clock.status;
  if (!s.takeover) return { show: false };
  return {
    show: true, preview: s.preview,
    title: s.name || 'THE BROKEN SEAL',
    tag: s.preview ? 'PREVIEW · PRIVATE ROOMS ONLY' : 'HALLOWEEN EVENT',
    countdown: s.preview ? (s.phase === 'UPCOMING' ? 'STARTS IN ' + countdownText(clock.msToStart()) : 'PREVIEW') : 'ENDS IN ' + countdownText(clock.msToEnd()),
  };
}

export const EVENT_CSS = `
#if-event-banner{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:14px;padding:8px 16px;background:linear-gradient(90deg,rgba(24,6,10,.92),rgba(40,10,14,.92));border:1px solid rgba(214,64,52,.55);box-shadow:0 10px 30px rgba(0,0,0,.5);color:#f4e7e1;font:600 10px 'JetBrains Mono',monospace;letter-spacing:1.6px;pointer-events:auto}
#if-event-banner[hidden]{display:none}
#if-event-banner b{font:700 17px Rajdhani,Inter,sans-serif;letter-spacing:4px;color:#ffd9cc}
#if-event-banner .evt-tag{color:#f87171}#if-event-banner .evt-time{color:#fbbf24;min-width:12ch}
#if-event-banner button{background:none;border:1px solid rgba(248,113,113,.6);color:#fecaca;font:700 9px 'JetBrains Mono',monospace;letter-spacing:1.2px;padding:5px 9px;cursor:pointer}`;

export function renderBanner(el, model) {
  if (!el) return;
  el.hidden = !model.show;
  if (!model.show) return;
  el.querySelector('.evt-title').textContent = model.title;
  el.querySelector('.evt-tag').textContent = model.tag;
  el.querySelector('.evt-time').textContent = model.countdown;
  el.querySelector('[data-act="exit-preview"]').hidden = !model.preview;
}
