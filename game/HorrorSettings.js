 
 
 
import { gameStorage } from '../storage/IronStore.js';

export const HORROR_KEY = 'ironfall.horror.v1';
export const HORROR_DEFAULTS = Object.freeze({ volume: 0.8, reduceFlicker: false, reduceCamera: false, subtitles: true });

export function normalizeHorror(v = {}) {
  const n = Number(v.volume);
  return { volume: Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : HORROR_DEFAULTS.volume,
    reduceFlicker: !!v.reduceFlicker, reduceCamera: !!v.reduceCamera, subtitles: v.subtitles === undefined ? true : !!v.subtitles };
}

export class HorrorSettings {
  constructor(storage = gameStorage) { this.storage = storage; this.listeners = new Set(); this.value = normalizeHorror(this.read()); }
  read() { try { return JSON.parse(this.storage.getItem(HORROR_KEY) || 'null') || {}; } catch { return {}; } }
  get() { return this.value; }
  set(patch) { this.value = normalizeHorror({ ...this.value, ...patch }); try { this.storage.setItem(HORROR_KEY, JSON.stringify(this.value)); } catch { } for (const f of this.listeners) f(this.value); return this.value; }
  onChange(f) { this.listeners.add(f); return () => this.listeners.delete(f); }
  mount(panel, doc = document) {
    if (!panel || doc.getElementById('if-horror-settings')) return;
    const box = doc.createElement('section'); box.id = 'if-horror-settings'; box.className = 'if-horror-settings';
    box.innerHTML = `<style>.if-horror-settings{margin-top:14px;padding:12px 14px;border:1px solid rgba(214,64,52,.35);background:rgba(30,8,10,.35)}
.if-horror-settings h4{margin:0 0 8px;font:700 12px 'JetBrains Mono',monospace;letter-spacing:2px;color:#fca5a5}
.if-horror-settings label{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:6px 0;font:600 10.5px 'JetBrains Mono',monospace;letter-spacing:1px;color:#cbd5e1}
.if-horror-settings input[type=range]{width:150px;accent-color:#ef4444}.if-horror-settings input[type=checkbox]{accent-color:#ef4444;width:15px;height:15px}</style>
<h4>HORROR &amp; COMFORT · HALLOWEEN</h4>
<label>HORROR VOLUME <input type="range" min="0" max="1" step="0.05" data-h="volume"></label>
<label>REDUCE FLICKER &amp; FLASHES <input type="checkbox" data-h="reduceFlicker"></label>
<label>REDUCE CAMERA EFFECTS <input type="checkbox" data-h="reduceCamera"></label>
<label>CUTSCENE SUBTITLES <input type="checkbox" data-h="subtitles"></label>`;
    const sync = () => { for (const i of box.querySelectorAll('[data-h]')) { const k = i.dataset.h; if (i.type === 'checkbox') i.checked = this.value[k]; else i.value = this.value[k]; } };
    box.addEventListener('input', e => { const i = e.target.closest('[data-h]'); if (i) this.set({ [i.dataset.h]: i.type === 'checkbox' ? i.checked : +i.value }); });
    panel.append(box); sync(); this.onChange(sync);
  }
}
