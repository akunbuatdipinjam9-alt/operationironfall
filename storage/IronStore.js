export const DB_NAME = 'operation-ironfall', DB_VERSION = 1, KV = 'kv', META_MIGRATED = '__ironstore.migratedFromLocalStorage';
export const isGameKey = k => typeof k === 'string' && /^(ironfall[.:]|OPERATION_IRONFALL)/.test(k) && k !== 'ironfall.sessionToken' && k !== 'ironfall.lastRoom';

const req = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const txDone = tx => new Promise((res, rej) => { tx.oncomplete = () => res(); tx.onerror = () => rej(tx.error); tx.onabort = () => rej(tx.error || new Error('aborted')); });
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

export async function openGameStorage({ idb = globalThis.indexedDB, legacy = (() => { try { return globalThis.localStorage || null; } catch (e) { return null; } })(),
  channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('ironfall-store') : null, timeoutMs = 3000, win = typeof window !== 'undefined' ? window : null } = {}) {
  channel?.unref?.();  
  const map = new Map(); let db = null, backend = 'memory', migrated = 0;
  const pending = new Map(); let timer = null, writing = Promise.resolve();

  if (idb) {
    try {
      db = await withTimeout(new Promise((res, rej) => {
        const r = idb.open(DB_NAME, DB_VERSION);
        r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(KV)) r.result.createObjectStore(KV); };
        r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); r.onblocked = () => rej(new Error('blocked'));
      }), timeoutMs);
      const tx = db.transaction(KV, 'readonly'), st = tx.objectStore(KV);
      const [keys, vals] = await Promise.all([req(st.getAllKeys()), req(st.getAll())]);
      keys.forEach((k, i) => map.set(String(k), String(vals[i])));
      backend = 'indexeddb';
      if (!map.has(META_MIGRATED) && legacy) {
        const moved = [];
        for (let i = 0; i < legacy.length; i++) { const k = legacy.key(i); if (isGameKey(k) && !map.has(k)) moved.push([k, legacy.getItem(k)]); }
        const wtx = db.transaction(KV, 'readwrite'), ws = wtx.objectStore(KV);
        for (const [k, v] of moved) { ws.put(v, k); map.set(k, v); }
        ws.put('1', META_MIGRATED); map.set(META_MIGRATED, '1');
        await txDone(wtx);
        const vtx = db.transaction(KV, 'readonly'), vs = vtx.objectStore(KV);
        const back = await Promise.all(moved.map(([k]) => req(vs.get(k))));
        if (moved.every(([, v], i) => back[i] === v)) { for (const [k] of moved) { try { legacy.removeItem(k); } catch (e) {} } migrated = moved.length; }
      }
    } catch (e) { db = null; map.clear(); backend = 'memory'; }
  }
  if (!db && legacy) backend = 'localstorage';

  const flush = () => {
    clearTimeout(timer); timer = null;
    if (!db || !pending.size) return writing;
    const batch = [...pending]; pending.clear();
    writing = writing.then(() => { const tx = db.transaction(KV, 'readwrite'), st = tx.objectStore(KV); for (const [k, v] of batch) v === undefined ? st.delete(k) : st.put(v, k); return txDone(tx); })
      .catch(() => { for (const [k, v] of batch) if (!pending.has(k)) pending.set(k, v); });  
    return writing;
  };
  const queue = (k, v) => { pending.set(k, v); if (!timer) timer = setTimeout(flush, 0); channel?.postMessage({ k, v: v === undefined ? null : v, del: v === undefined }); };
  if (channel) channel.onmessage = e => { const { k, v, del } = e.data || {}; if (typeof k !== 'string') return; del ? map.delete(k) : map.set(k, String(v)); };
  if (win?.addEventListener) { win.addEventListener('pagehide', flush); win.addEventListener('visibilitychange', () => { if (globalThis.document?.visibilityState === 'hidden') flush(); }); }

  const visibleKeys = () => [...map.keys()].filter(k => k !== META_MIGRATED);
  const storage = backend === 'localstorage' ? legacy : {
    getItem: k => (map.has(String(k)) && String(k) !== META_MIGRATED ? map.get(String(k)) : null),
    setItem: (k, v) => { k = String(k); v = String(v); if (map.get(k) === v) return; map.set(k, v); if (db) queue(k, v); },
    removeItem: k => { k = String(k); if (!map.has(k)) return; map.delete(k); if (db) queue(k, undefined); },
    key: i => visibleKeys()[i] ?? null,
    get length() { return visibleKeys().length; },
    clear: () => { for (const k of visibleKeys()) { map.delete(k); if (db) queue(k, undefined); } },
  };
  return { storage, backend, migrated, flush, get pending() { return pending.size; } };
}

export const IronStore = await openGameStorage();
export const gameStorage = IronStore.storage;
if (typeof window !== 'undefined') window.IronStore = { backend: IronStore.backend, migrated: IronStore.migrated, flush: IronStore.flush };
