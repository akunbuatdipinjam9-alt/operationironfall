


import * as THREE from 'three';
import { characterById, MINION_LOOK } from './Arsenal.js';
import { buildOperatorParts } from './OperatorModel.js';

const TEAM_TINT = { BLUE: 0x1d4ed8, RED: 0xb91c1c };

export function tinted(hex, team, amount = 0.28) {
  const c = new THREE.Color(hex), t = new THREE.Color(TEAM_TINT[team] ?? hex);
  return c.lerp(t, amount).getHex();
}
export function lookFor(characterId, minion = false) { return minion ? MINION_LOOK : characterById(characterId).look; }







export function dressBot(p, characterId, { minion = false } = {}) {
  const look = lookFor(characterId, minion), keep = new Set(p.keep || []);
  for (const root of [p.upperBodyPivot, p.leftLeg, p.rightLeg]) root.traverse(o => { if (o.isMesh && !keep.has(o)) o.visible = false; });
  const parts = buildOperatorParts(look, { team: p.team });
  p.upperBodyPivot.add(parts.upper); p.headGroup.add(parts.head); p.leftLeg.add(parts.legL); p.rightLeg.add(parts.legR); p.rightArmGroup.add(parts.arms);
  const s = look.scale || 1;
  p.visualGroup.scale.setScalar(s);
  if (p.hitbox) { p.hitbox.scale.set(s, s, s); p.hitbox.position.y = 1.0 * s; }
  return { look, parts, flashMat: parts.flash, flashHex: parts.flash.color.getHex(), dispose: parts.dispose,

    joints: { root: p.visualGroup, hips: p.upperBodyPivot, head: p.headGroup, arms: p.rightArmGroup, armL: parts.armL, mag: parts.mag, legL: p.leftLeg, legR: p.rightLeg, kneeL: parts.kneeL, kneeR: parts.kneeR } };
}


export function dressRemote(n, entity) {
  const look = lookFor(entity.character, !!entity.minion);
  if (n.parts) { for (const k of ['upper', 'head', 'legL', 'legR', 'arms']) n.parts[k].removeFromParent(); n.parts.dispose(); }
  const parts = n.parts = buildOperatorParts(look, { team: entity.team });
  n.upper.add(parts.upper); n.head.add(parts.head); n.legL.add(parts.legL); n.legR.add(parts.legR); n.weapon.add(parts.arms);
  n.visual.scale.setScalar(look.scale || 1);
  n.joints = { root: n.visual, hips: n.upper, head: n.head, arms: n.weapon, armL: parts.armL, mag: parts.mag, legL: n.legL, legR: n.legR, kneeL: parts.kneeL, kneeR: parts.kneeR };
}


export function portraitSvg(characterId) {
  const c = characterById(characterId), L = c.look, hex = v => '#' + (v >>> 0).toString(16).padStart(6, '0');
  if (L.style === 'yuna') return `<svg viewBox="0 0 120 150" aria-hidden="true"><defs><linearGradient id="g-yuna" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2633"/><stop offset="1" stop-color="#0a1018"/></linearGradient></defs>
<rect width="120" height="150" fill="url(#g-yuna)"/><circle cx="60" cy="58" r="44" fill="#e0a6b8" opacity=".09"/>
<rect x="45" y="104" width="12" height="40" rx="3" fill="#d0d4dd"/><rect x="63" y="104" width="12" height="40" rx="3" fill="#d0d4dd"/><rect x="45" y="118" width="12" height="7" fill="#15181d"/><rect x="63" y="118" width="12" height="7" fill="#15181d"/>
<rect x="38" y="60" width="44" height="50" rx="9" fill="#2a3150"/>
<rect x="27" y="62" width="11" height="38" rx="5" fill="#e3e6ee"/><rect x="82" y="62" width="11" height="38" rx="5" fill="#e3e6ee"/><rect x="27" y="94" width="11" height="6" fill="#2a3150"/><rect x="82" y="94" width="11" height="6" fill="#2a3150"/><rect x="27" y="72" width="11" height="6" fill="#38bdf8"/>
<rect x="42" y="66" width="36" height="28" rx="4" fill="#1b1f27"/><rect x="45" y="80" width="8" height="10" fill="#2a2f39"/><rect x="56" y="80" width="8" height="10" fill="#2a2f39"/><rect x="67" y="80" width="8" height="10" fill="#2a2f39"/>
<path d="M44 56 Q60 66 76 56 L76 60 Q60 70 44 60Z" fill="#e3e6ee"/><rect x="50" y="52" width="20" height="10" rx="4" fill="#15181d"/>
<path d="M42 36 Q38 58 42 66 L48 52Z" fill="#e0a6b8"/><path d="M78 36 Q82 58 78 66 L72 52Z" fill="#e0a6b8"/>
<ellipse cx="60" cy="38" rx="13" ry="15" fill="#f4dccf"/>
<path d="M43 44 Q41 14 60 14 Q80 14 77 44 Q75 31 70 27 Q66 35 61 28 Q56 36 51 29 Q48 34 45 31Z" fill="#e0a6b8"/>
<path d="M59 15 Q57 4 64 3 Q70 4 66 10 Q63 13 61 11" stroke="#e0a6b8" stroke-width="2.4" fill="none"/>
<rect x="45" y="17" width="13" height="7" rx="3" fill="#15181d"/><rect x="62" y="17" width="13" height="7" rx="3" fill="#15181d"/><rect x="47" y="18.5" width="9" height="4" rx="2" fill="#2b3b4a"/><rect x="64" y="18.5" width="9" height="4" rx="2" fill="#2b3b4a"/>
<path d="M52 39 Q54.5 37.5 57 39" stroke="#26232c" stroke-width="1.4" fill="none"/><path d="M63 39 Q65.5 37.5 68 39" stroke="#26232c" stroke-width="1.4" fill="none"/><ellipse cx="54.5" cy="40.5" rx="2.4" ry="1.7" fill="#c580b4"/><ellipse cx="65.5" cy="40.5" rx="2.4" ry="1.7" fill="#c580b4"/>
<path d="M57.5 47 Q60 48 62.5 47" stroke="#c98a86" stroke-width="1" fill="none"/>
<rect x="40" y="33" width="6" height="10" rx="2" fill="#15181d"/><rect x="74" y="33" width="6" height="10" rx="2" fill="#15181d"/><rect x="41" y="37" width="1.5" height="4" fill="#38bdf8"/><path d="M43 41 Q46 48 54 48" stroke="#15181d" stroke-width="1.2" fill="none"/>
</svg>`;
  if (L.style === 'sora') return `<svg viewBox="0 0 120 150" aria-hidden="true"><defs><linearGradient id="g-sora" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2633"/><stop offset="1" stop-color="#0a1018"/></linearGradient></defs>
<rect width="120" height="150" fill="url(#g-sora)"/><circle cx="60" cy="58" r="44" fill="#38bdf8" opacity=".09"/>
<path d="M76 30 Q100 40 92 96 Q86 70 78 52Z" fill="#c9ccd6"/>
<rect x="45" y="104" width="12" height="40" rx="3" fill="#c9cdd8"/><rect x="63" y="104" width="12" height="40" rx="3" fill="#c9cdd8"/><rect x="45" y="118" width="12" height="7" fill="#15181d"/><rect x="63" y="118" width="12" height="7" fill="#15181d"/>
<rect x="38" y="60" width="44" height="50" rx="9" fill="#3a4a72"/><rect x="38" y="102" width="44" height="5" fill="#dfe3ea"/>
<rect x="27" y="62" width="11" height="38" rx="5" fill="#3a4a72"/><rect x="82" y="62" width="11" height="38" rx="5" fill="#3a4a72"/><rect x="27" y="72" width="11" height="6" fill="#38bdf8"/>
<rect x="42" y="66" width="36" height="28" rx="4" fill="#1b1f27"/><rect x="45" y="80" width="8" height="10" fill="#2a2f39"/><rect x="56" y="80" width="8" height="10" fill="#2a2f39"/><rect x="67" y="80" width="8" height="10" fill="#2a2f39"/>
<rect x="50" y="52" width="20" height="12" rx="4" fill="#15181d"/>
<ellipse cx="60" cy="38" rx="13" ry="15" fill="#f3dccd"/>
<path d="M44 44 Q42 14 60 14 Q79 14 76 44 Q74 30 69 26 Q64 34 57 27 Q52 33 46 30Z" fill="#dcdfe8"/><path d="M45 32 Q41 50 44 62 L48 46Z" fill="#dcdfe8"/><path d="M75 32 Q79 50 76 62 L72 46Z" fill="#dcdfe8"/>
<path d="M58 15 Q60 5 67 8" stroke="#dcdfe8" stroke-width="2" fill="none"/>
<ellipse cx="54.5" cy="39" rx="2.6" ry="3.4" fill="#9a8fc4"/><ellipse cx="65.5" cy="39" rx="2.6" ry="3.4" fill="#9a8fc4"/><circle cx="54" cy="38" r=".9" fill="#fff"/><circle cx="65" cy="38" r=".9" fill="#fff"/>
<path d="M57.5 47 Q60 48.4 62.5 47" stroke="#c98a86" stroke-width="1" fill="none"/>
<path d="M44 36 Q44 18 60 17 Q76 18 76 36" stroke="#15181d" stroke-width="2.4" fill="none"/><rect x="40" y="33" width="6" height="10" rx="2" fill="#15181d"/><rect x="74" y="33" width="6" height="10" rx="2" fill="#15181d"/><rect x="41" y="37" width="1.5" height="4" fill="#38bdf8"/>
<path d="M43 41 Q46 48 54 48" stroke="#15181d" stroke-width="1.2" fill="none"/>
<rect x="48" y="24" width="6" height="1.6" rx=".8" fill="#15181d" transform="rotate(-20 51 25)"/><rect x="48" y="28" width="6" height="1.6" rx=".8" fill="#15181d" transform="rotate(-20 51 29)"/>
</svg>`;
  const top = hex(L.top), pants = hex(L.pants), skin = hex(L.skin), vest = L.vest == null ? null : hex(L.vest), helm = L.helmet == null ? null : hex(L.helmet), acc = hex(L.accent);
  const w = 1 + ((L.scale || 1) - 1) * 1.6;
  return `<svg viewBox="0 0 120 150" aria-hidden="true"><defs><linearGradient id="g-${c.id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2633"/><stop offset="1" stop-color="#0a1018"/></linearGradient></defs>
<rect width="120" height="150" fill="url(#g-${c.id})"/><circle cx="60" cy="62" r="44" fill="${acc}" opacity=".08"/>
<g transform="translate(60 0) scale(${w.toFixed(3)} 1) translate(-60 0)">
<rect x="44" y="104" width="13" height="40" rx="3" fill="${pants}"/><rect x="63" y="104" width="13" height="40" rx="3" fill="${pants}"/>
<rect x="38" y="58" width="44" height="50" rx="7" fill="${top}"/>
${L.belly ? `<ellipse cx="60" cy="90" rx="22" ry="17" fill="${top}"/>` : ''}
${L.singlet ? `<rect x="26" y="60" width="12" height="40" rx="5" fill="${skin}"/><rect x="82" y="60" width="12" height="40" rx="5" fill="${skin}"/><path d="M46 58 Q60 72 74 58" fill="${skin}"/>` : `<rect x="26" y="60" width="12" height="40" rx="5" fill="${top}"/><rect x="82" y="60" width="12" height="40" rx="5" fill="${top}"/>`}
${vest ? `<rect x="40" y="66" width="40" height="30" rx="4" fill="${vest}"/><rect x="44" y="82" width="9" height="11" fill="${top}" opacity=".7"/><rect x="56" y="82" width="9" height="11" fill="${top}" opacity=".7"/><rect x="68" y="82" width="9" height="11" fill="${top}" opacity=".7"/>` : ''}
${L.cross ? `<rect x="56" y="70" width="8" height="20" fill="${acc}"/><rect x="50" y="76" width="20" height="8" fill="${acc}"/>` : ''}
<rect x="49" y="28" width="22" height="28" rx="6" fill="${skin}"/>
${helm ? `<path d="M45 40 Q45 18 60 18 Q75 18 75 40 Z" fill="${helm}"/>` : `<path d="M50 30 Q60 22 70 30" stroke="#2b2118" stroke-width="5" fill="none"/>`}
${L.boonie ? `<ellipse cx="60" cy="33" rx="22" ry="4" fill="${helm}"/>` : ''}
${L.hood ? `<path d="M43 46 Q42 16 60 15 Q78 16 77 46 L71 46 Q72 24 60 24 Q48 24 49 46Z" fill="${helm || top}"/>` : ''}
${L.visor ? `<rect x="49" y="36" width="22" height="8" rx="2" fill="#0b1219"/><rect x="51" y="38" width="18" height="3" fill="${acc}" opacity=".85"/>` : `<rect x="53" y="38" width="5" height="3" rx="1" fill="#1a1410"/><rect x="62" y="38" width="5" height="3" rx="1" fill="#1a1410"/>`}
${L.faceStyle === 'windah' ? `<path d="M48 34 Q46 20 59 21 Q76 19 73 33 Q61 26 48 34" fill="#171718"/><path d="M53 46 Q60 51 67 46" fill="none" stroke="#624136" stroke-width="1.5"/>` : L.singlet ? `<rect x="51" y="37" width="18" height="5" rx="2" fill="#0b0f14"/>` : ''}
</g></svg>`;
}
