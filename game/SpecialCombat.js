export const SPECIAL_WEAPONS = Object.freeze({
   
   
  30: { id: 'dagger', name: 'DAGGER', damage: 40, cooldown: 360, windup: 65, range: 2.3, cone: .7 },
  31: { id: 'katana', name: 'KATANA', damage: 65, cooldown: 1050, windup: 240, range: 3.1, cone: .5, parryStart: 50, parryEnd: 300 },
   
   
  32: { id: 'bladeon', name: 'BLADEON', damage: 75, shotDamage: 70, shotSpeed: 300, shotLifeMs: 450, cooldown: 720, windup: 150, range: 3.4, cone: .25, dash: 4.5,
        lifesteal: 75, hitRadius: 1.1, alt: { range: 4.2, cone: -.15, windup: 110, cooldown: 560 } },
  33: { id: 'double_blade', name: 'DOUBLE BLADE', damage: 75, cooldown: 440, windup: 110, range: 2.4, cone: .55, dash: 3.0 },
  34: { id: 'lightsaber', name: 'LIGHTSABER', damage: 58, cooldown: 620, windup: 210, range: 3, cone: .5, parryStart: 40, parryEnd: 320 },
   
  35: { id: 'lagun', name: 'LAGUN', damage: 40, cooldown: 700, windup: 0, range: 0, cone: 0, category: 'HYBRID', tags: ['ranged', 'teleport'],
        projectile: { speed: 300, lifeMs: 450 }, hitRadius: 1, ccMs: 500, pulse: { radius: 4.5, damage: 50 }, teleport: 1.4, sameTargetHits: 2, sameTargetCooldown: 3000 },
   
  36: { id: 'maul', name: 'MAUL', damage: 70, cooldown: 1400, windup: 380, range: 3.2, cone: .55, moveMul: .75, category: 'MELEE', tags: ['melee', 'heavy', 'slam'],
        slam: { windup: 260, radius: 4, damage: 55, stunMs: 1200, cooldown: 2200 } }
});
export const isSpecialWeapon = index => Object.hasOwn(SPECIAL_WEAPONS, index);
const finite = n => Number.isFinite(n);
const frontDot = (a, b) => {
 const dx = b.x - a.x, dz = b.z - a.z, d = Math.hypot(dx, dz);
 return d > .001 ? (-Math.sin(a.yaw) * dx - Math.cos(a.yaw) * dz) / d : 1;
};
export const isBackstab = (attacker, victim) => frontDot(victim, attacker) < -.5;
export function segmentHit(a, b, target, radius = .62) {
 const dx = b.x-a.x, dy = b.y-a.y, dz = b.z-a.z, l = dx*dx+dy*dy+dz*dz;
 const t = Math.max(0, Math.min(1, ((target.x-a.x)*dx+(target.y+1-a.y)*dy+(target.z-a.z)*dz) / Math.max(l, .000001)));
 return Math.hypot(a.x+dx*t-target.x,a.y+dy*t-target.y-1,a.z+dz*t-target.z) <= radius ? t : null;
}
export class SpecialCombat {
 constructor(hooks) { this.h = hooks; this.states = new Map(); this.pending = []; this.projectiles = []; this.serial = 0; }
 state(id) { if (!this.states.has(id)) this.states.set(id, { mode: 'GUN', hand: 0, readyAt: 0, shield: 0, shieldUntil: 0, parryFrom: 0, parryUntil: 0, sequence: 0, stunUntil: 0, lagunTarget: null, lagunStreak: 0 }); return this.states.get(id); }
 reset(id) { this.states.delete(id); this.pending = this.pending.filter(a=>a.id!==id); this.projectiles = this.projectiles.filter(a=>a.id!==id); }
 clear() { this.states.clear(); this.pending.length = this.projectiles.length = 0; }
 snapshot(id, now) { const s = this.state(id); this.expire(s, now); return { mode: s.mode, hand: s.hand, shield: s.shield, shieldMs: Math.max(0,s.shieldUntil-now), cooldownMs: Math.max(0,s.readyAt-now), sequence:s.sequence, stunMs: Math.max(0,s.stunUntil-now) }; }
 stunned(id, now) { const s = this.states.get(id); return !!s && now < s.stunUntil; }
 stun(id, ms, now) { if (!finite(ms) || ms <= 0) return; const s = this.state(id); s.stunUntil = Math.max(s.stunUntil, now + Math.min(ms, 3000)); this.h.event?.({ type: 'stun', id, ms: Math.round(s.stunUntil - now) }); }
 expire(s, now) { if (now >= s.shieldUntil) s.shield = 0; }
 defend(victim, source, amount, kind, now) {
  if (!finite(amount) || amount <= 0) return 0;
  const s = this.state(victim.id); this.expire(s, now);
  s.parried = false;
  if (kind === 'projectile' && SPECIAL_WEAPONS[victim.weaponIndex]?.parryEnd && now >= s.parryFrom && now < s.parryUntil && source && frontDot(victim, source) > .35) {
   s.parried = true; this.h.event?.({type:'parry',id:victim.id}); return 0;
  }
  const absorbed = Math.min(s.shield, amount); s.shield -= absorbed;
  return Math.max(0, amount-absorbed);
 }
 attack(actor, now, alt = false) {
  const spec = SPECIAL_WEAPONS[actor?.weaponIndex];
  if (!spec || actor.dead || actor.connected === false || ![now,actor.x,actor.y,actor.z,actor.yaw,actor.pitch||0].every(finite)) return {ok:false,reason:'INVALID'};
  const s = this.state(actor.id); if (now < s.readyAt) return {ok:false,reason:'COOLDOWN'};
  if (now < s.stunUntil) return {ok:false,reason:'STUNNED'};
  const altSlash = !!(alt && spec.alt), gun = !altSlash && (!!spec.projectile || (spec.id === 'bladeon' && s.mode === 'GUN')), slam = !!(spec.slam && actor.airborne) && !altSlash;
  if (gun && this.projectiles.length >= 128) return {ok:false,reason:'BUSY'};
  const scale = Number(this.h.cooldownScale?.(actor)), cooldown = Math.round((slam ? spec.slam.cooldown : altSlash ? spec.alt.cooldown : spec.cooldown)*(Number.isFinite(scale)&&scale>0?Math.min(2,Math.max(.25,scale)):1));
  s.readyAt = now+cooldown; s.sequence++; if (spec.id === 'double_blade') s.hand = 1-s.hand;
  s.parryFrom = spec.parryEnd ? now+spec.parryStart : 0; s.parryUntil = spec.parryEnd ? now+spec.parryEnd : 0;
  const shot = { id:actor.id, weaponIndex:actor.weaponIndex, yaw:actor.yaw, pitch:actor.pitch||0, sequence:s.sequence, mode:s.mode, hand:s.hand, slam, alt:altSlash };
  if (gun) {
   const pitch = Math.max(-1.48,Math.min(1.48,shot.pitch)), cp = Math.cos(pitch);
   const v = spec.projectile?.speed ?? spec.shotSpeed ?? 38, life = spec.projectile?.lifeMs ?? spec.shotLifeMs ?? 2200;
   this.projectiles.push({...shot, uid:++this.serial, x:actor.x,y:actor.y+1.35,z:actor.z, vx:-Math.sin(actor.yaw)*cp*v,vy:Math.sin(pitch)*v,vz:-Math.cos(actor.yaw)*cp*v,at:now,until:now+life});
  } else if (slam) {
   this.pending.push({...shot,at:now+spec.slam.windup});
  } else {
   if (spec.dash && !altSlash) {
     
    let d = spec.dash;
    for (const t of this.h.actors()) {
     if (t === actor || t.dead || t.team === actor.team || t.connected === false || Math.abs(t.y - actor.y) >= 1.5) continue;
     const dist = Math.hypot(t.x - actor.x, t.z - actor.z);
     if (dist <= spec.dash + spec.range && frontDot(actor, t) >= spec.cone) d = Math.min(d, Math.max(0, dist - 1.1));
    }
    if (d > 0.05) this.h.dash(actor, d, actor.yaw);
   }
   this.pending.push({...shot,at:now+(altSlash?spec.alt.windup:spec.windup)});
  }
  this.h.event?.({type:'specialAttack',...shot,x:actor.x,y:actor.y,z:actor.z,cooldownMs:cooldown,gun});
  return {ok:true,cooldownMs:cooldown};
 }
 hit(a, target, source, now, kind) {
  const spec = SPECIAL_WEAPONS[a.weaponIndex], back = spec.id === 'dagger' && isBackstab(source,target);
  const incoming=kind==='projectile'?{...source,x:a.x,y:a.y,z:a.z}:source;
  const base = kind === 'projectile' ? (spec.shotDamage ?? spec.damage) : spec.damage;
  const successful = this.h.damage(incoming,target,base*(back?2:1),spec.name,kind,now);
  if (!successful) return;
  const s = this.state(source.id);
  if (back) { s.shield=50; s.shieldUntil=now+3000; }
  if (spec.lifesteal && kind === 'melee') this.h.heal?.(source, spec.lifesteal);
  if (spec.id === 'bladeon' && s.mode === a.mode) s.mode = a.mode === 'GUN' ? 'BLADE' : 'GUN';
  this.h.event?.({type:'specialHit',id:source.id,targetId:target.id,backstab:back,mode:s.mode});
  if (spec.pulse) this.lagun(spec, source, target, now);
 }
  
 lagun(spec, source, target, now) {
  const s = this.state(source.id), r = spec.pulse.radius;
  for (const t of this.h.actors()) {
   if (t === target || t.id === source.id || t.dead || t.team === source.team || t.connected === false || Math.abs(t.y - source.y) >= 2) continue;
   if (Math.hypot(t.x - source.x, t.z - source.z) <= r && this.h.clearLine({ ...source, y: source.y + 1 }, { ...t, y: t.y + 1 })) this.h.damage(source, t, spec.pulse.damage, spec.name + ' PULSE', 'pulse', now);
  }
  this.h.event?.({ type: 'lagunPulse', id: source.id, x: source.x, y: source.y, z: source.z, radius: r });
  const blinked = !target.dead && this.h.teleport;
  if (blinked) {
   const fx = -Math.sin(target.yaw || 0), fz = -Math.cos(target.yaw || 0), from = { x: source.x, y: source.y, z: source.z };
   for (const [back, side] of [[spec.teleport, 0], [spec.teleport * .7, 0], [spec.teleport, .9], [spec.teleport, -.9]]) {
    const p = { x: target.x - fx * back + fz * side, y: target.y, z: target.z - fz * back - fx * side, yaw: target.yaw || 0 };
    if (this.h.teleport(source, p)) { this.h.event?.({ type: 'teleport', id: source.id, from, to: { x: source.x, y: source.y, z: source.z } }); break; }
   }
  }
  if (!target.dead && spec.ccMs) this.stun(target.id, spec.ccMs, now);
   
  if (s.lagunTarget === target.id) s.lagunStreak++; else { s.lagunTarget = target.id; s.lagunStreak = 1; }
  if (s.lagunStreak >= spec.sameTargetHits) { s.readyAt = Math.max(s.readyAt, now + spec.sameTargetCooldown); s.lagunStreak = 0; s.lagunTarget = null; this.h.event?.({ type: 'lagunCooldown', id: source.id, ms: spec.sameTargetCooldown }); }
 }
 slamResolve(spec, source, now) {
  const sl = spec.slam;
  this.h.event?.({ type: 'slam', id: source.id, x: source.x, y: source.y, z: source.z, radius: sl.radius });
  for (const t of this.h.actors()) {
   if (t.id === source.id || t.dead || t.team === source.team || t.connected === false || Math.abs(t.y - source.y) >= 2.5) continue;
   if (Math.hypot(t.x - source.x, t.z - source.z) > sl.radius || !this.h.clearLine({ ...source, y: source.y + 1 }, { ...t, y: t.y + 1 })) continue;
   if (this.h.damage(source, t, sl.damage, spec.name + ' SLAM', 'melee', now)) { this.stun(t.id, sl.stunMs, now); this.h.event?.({ type: 'specialHit', id: source.id, targetId: t.id, slam: true }); }
  }
 }
 update(now) {
  const actors = this.h.actors(), byId = new Map(actors.map(a=>[a.id,a]));
  const valid = (a,b) => a && b && !a.dead && !b.dead && a.id!==b.id && a.team!==b.team && b.connected!==false;
  for (const id of this.states.keys()) if (!byId.has(id) || byId.get(id).dead) this.reset(id);
  for (let i=this.pending.length-1;i>=0;i--) {
   const a=this.pending[i]; if(now<a.at)continue;this.pending.splice(i,1);
   const source=byId.get(a.id);if(!source||source.dead||source.weaponIndex!==a.weaponIndex)continue;
   const spec=SPECIAL_WEAPONS[a.weaponIndex], facing={...source,yaw:a.yaw};
   if(a.slam){this.slamResolve(spec,source,now);continue;}
   const rng=a.alt&&spec.alt?spec.alt.range:spec.range,cone=a.alt&&spec.alt?spec.alt.cone:spec.cone,targets=actors.filter(t=>valid(source,t)&&Math.abs(t.y-source.y)<1.5&&Math.hypot(t.x-source.x,t.z-source.z)<=rng&&frontDot(facing,t)>=cone).sort((a,b)=>Math.hypot(a.x-source.x,a.z-source.z)-Math.hypot(b.x-source.x,b.z-source.z));
   for(const target of targets)if(this.h.clearLine({...source,y:source.y+1},{...target,y:target.y+1})){this.hit(a,target,source,now,'melee');break;}
  }
  for(let i=this.projectiles.length-1;i>=0;i--){
   const p=this.projectiles[i],source=byId.get(p.id);
   if(!source||source.dead||now>=p.until){this.projectiles.splice(i,1);continue;}
   const dt=Math.max(0,Math.min(.1,(now-p.at)/1000)),end={x:p.x+p.vx*dt,y:p.y+p.vy*dt,z:p.z+p.vz*dt};p.at=now;
   let hit=null,best=2;
   for(const t of actors)if(valid(source,t)){const f=segmentHit(p,end,t,SPECIAL_WEAPONS[p.weaponIndex]?.hitRadius);if(f!==null&&f<best){best=f;hit=t;}}
   if(hit){const point={x:p.x+(end.x-p.x)*best,y:p.y+(end.y-p.y)*best,z:p.z+(end.z-p.z)*best};if(this.h.clearLine(p,point))this.hit(p,hit,source,now,'projectile');this.projectiles.splice(i,1);}
   else if(!this.h.clearLine(p,end))this.projectiles.splice(i,1);
   else Object.assign(p,end);
  }
 }
}
