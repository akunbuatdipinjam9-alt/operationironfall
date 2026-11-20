import { SpecialCombat, SPECIAL_WEAPONS } from './SpecialCombat.js';
export class LocalSpecialCombat {
 constructor(h) {
  this.h=h;
  this.engine=new SpecialCombat({actors:()=>h.actors(),clearLine:h.clearLine,dash:h.dash,event:h.event,teleport:h.teleport,heal:h.heal,damage:(a,b,n,label,kind,now)=>{
   if(now<(b.protectedUntil||0))return false;
   const shield=this.engine.state(b.id).shield,before=b.health;
   h.damage(a,b,n,label,kind);
   const after=h.actors().find(x=>x.id===b.id);
   return !after||after.health<before||this.engine.state(b.id).shield<shield;
  }});
 }
 attack(id,now,alt=false){const actor=this.h.actors().find(a=>a.id===id);return this.engine.attack(actor,now,alt);}
 defense(id,source,n,kind,now){const actor=this.h.actors().find(a=>a.id===id);return actor?this.engine.defend(actor,source,n,kind,now):n;}
 wantsMelee(id,index){const s=SPECIAL_WEAPONS[index];return !!s&&!s.projectile&&!(index===32&&this.engine.state(id).mode==='GUN');}
}
