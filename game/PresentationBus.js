 
 
 
 
 
const listeners = new Map();

export function onFX(type, fn) {
  let set = listeners.get(type);
  if (!set) listeners.set(type, (set = new Set()));
  set.add(fn);
  return () => set.delete(fn);
}

export function emitFX(type, detail = {}) {
  const set = listeners.get(type);
  if (!set) return 0;
  for (const fn of set) {
    try { fn(detail, type); } catch (e) { console.warn('[IronFX]', type, e); }
  }
  return set.size;
}

if (typeof window !== 'undefined' && !window.IronFX) {
  window.IronFX = { emit: emitFX, on: onFX };
  window.addEventListener('ironfall:fx', e => { const d = e.detail; if (d && d.type) emitFX(d.type, d); });
}
