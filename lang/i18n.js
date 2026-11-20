import { gameStorage } from '../storage/IronStore.js';
 
 
 
 
 
 
 
export const LANGUAGES = [
  ['id', 'Bahasa Indonesia'], ['en', 'English'], ['zh', '中文'], ['hi', 'हिन्दी'], ['es', 'Español'],
  ['ar', 'العربية'], ['fr', 'Français'], ['pt', 'Português'], ['ru', 'Русский']
];
const CODES = LANGUAGES.map(l => l[0]), KEY = 'ironfall.lang.v1', DEFAULT = 'id', ATTRS = ['placeholder', 'title', 'aria-label'];
const SKIP = new Set(['SCRIPT', 'STYLE', 'CANVAS', 'TEXTAREA', 'INPUT', 'NOSCRIPT', 'svg', 'SVG']);
const norm = s => s.replace(/\s+/g, ' ').trim().toUpperCase();
const DECOR = /^([\s▶◀←→⏭⏮Ⅱ•·★✓✔↻⟳⚙]*)([\s\S]*?)([\s→▶✓…:]*)$/u;

let code = DEFAULT, table = new Map(), templates = [], cache = new Map(), observer = null, applying = false;
const original = new WeakMap(), originalAttr = new WeakMap(), listeners = new Set();

function readSaved() { try { const v = gameStorage.getItem(KEY); return CODES.includes(v) ? v : null; } catch { return null; } }
function save(c) { try { gameStorage.setItem(KEY, c); } catch {} }

function compile(strings) {
  table = new Map(); templates = []; cache = new Map();
  for (const [k, v] of Object.entries(strings || {})) {
    if (k.includes('{}')) {
      const parts = k.split('{}').map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      templates.push({ re: new RegExp('^' + parts.join('(.+?)') + '$', 'iu'), out: v });
    } else table.set(k, v);
  }
}
function caseLike(src, out) { return /\p{Ll}/u.test(src) || !/\p{Lu}/u.test(src) ? out : out.toLocaleUpperCase(code); }
function lookup(core) {
  const key = norm(core); if (!key) return null;
  const hit = table.get(key); if (hit != null) return caseLike(core, hit);
  if (/\d/.test(key)) for (const t of templates) {
     
    const m = core.replace(/\s+/g, ' ').trim().match(t.re); if (!m) continue;
    let i = 0; return caseLike(core, t.out.replace(/\{\}/g, () => m[++i] ?? ''));
  }
  return null;
}
export function t(text) {
  if (code === 'en' || typeof text !== 'string' || !text.trim()) return text;
  if (cache.has(text)) return cache.get(text);
  let out = lookup(text);
  if (out == null) { const m = text.match(DECOR); if (m && (m[1] || m[3]) && m[2]) { const inner = lookup(m[2]); if (inner != null) out = m[1] + inner + m[3]; } }
  if (out == null) out = text;
  if (cache.size > 4000) cache.clear();
  cache.set(text, out); return out;
}

function skipped(el) { for (let e = el; e; e = e.parentElement) { if (SKIP.has(e.tagName) || e.hasAttribute?.('data-no-i18n')) return true; } return false; }
function textNode(n) {
  const cur = n.data, prev = original.get(n);
   
  const src = prev && (cur === prev.out) ? prev.src : cur;
  const out = t(src);
  original.set(n, { src, out });
  if (out !== cur) n.data = out;
}
function attrs(el) {
  let rec = originalAttr.get(el);
  for (const a of ATTRS) {
    const cur = el.getAttribute(a); if (cur == null) continue;
    if (!rec) originalAttr.set(el, rec = {});
    const prev = rec[a], src = prev && cur === prev.out ? prev.src : cur, out = t(src);
    rec[a] = { src, out }; if (out !== cur) el.setAttribute(a, out);
  }
}
function walk(root) {
  if (!root) return;
  if (root.nodeType === 3) { if (!skipped(root.parentElement)) textNode(root); return; }
  if (root.nodeType !== 1 || skipped(root)) return;
  attrs(root);
  const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, {
    acceptNode: n => n.nodeType === 1 && (SKIP.has(n.tagName) || n.hasAttribute('data-no-i18n')) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
  });
  for (let n = w.nextNode(); n; n = w.nextNode()) n.nodeType === 3 ? (n.data.trim() && textNode(n)) : attrs(n);
}
function apply() {
  applying = true;
  try { walk(document.body); document.title = t(original.get(document)?.src ?? (original.set(document, { src: document.title }), document.title)); }
  finally { applying = false; }
}
function observe() {
  if (observer || typeof MutationObserver === 'undefined') return;
  observer = new MutationObserver(list => {
    if (applying) return;
    applying = true;
    try {
      for (const m of list) {
        if (m.type === 'characterData') { if (!skipped(m.target.parentElement)) textNode(m.target); }
        else if (m.type === 'attributes') { if (!skipped(m.target)) attrs(m.target); }
        else for (const n of m.addedNodes) walk(n);
      }
    } finally { applying = false; }
    observer.takeRecords();
  });
  observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
}

export async function setLanguage(next) {
  if (!CODES.includes(next)) next = DEFAULT;
  let mod; try { mod = await import(`./${next}.js`); } catch (e) { console.warn('[i18n] missing language', next, e); mod = await import('./en.js'); next = 'en'; }
  code = next; compile(mod.default?.strings); save(code);
  document.documentElement.lang = code;
   
  document.documentElement.dataset.langDir = mod.default?.dir || 'ltr';
  apply(); observe();
  for (const fn of listeners) try { fn(code); } catch {}
  return code;
}
export const getLanguage = () => code;
export const onLanguageChange = fn => (listeners.add(fn), () => listeners.delete(fn));

 
export function languagePicker({ className = '' } = {}) {
  const sel = document.createElement('select');
  sel.className = className; sel.setAttribute('data-no-i18n', ''); sel.id = 'select-language';
  for (const [c, name] of LANGUAGES) { const o = document.createElement('option'); o.value = c; o.textContent = name; sel.append(o); }
  sel.value = code; sel.addEventListener('change', () => setLanguage(sel.value));
  onLanguageChange(c => { sel.value = c; });
  return sel;
}

export function initI18n() {
  const start = readSaved() || DEFAULT;
  return setLanguage(start);
}
if (typeof window !== 'undefined') window.IronI18n = { t, setLanguage, getLanguage, languagePicker, LANGUAGES };
