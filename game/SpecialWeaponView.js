import { Group, Mesh, BoxGeometry, ConeGeometry, MeshStandardMaterial } from 'three';
import { lightsaberMesh, LIGHTSABER_INDEX } from '../graphics/LightsaberModel.js';
import { meleeWeaponMesh } from '../graphics/MeleeModels.js';
export function specialWeaponMesh(index) {
 if(index===LIGHTSABER_INDEX)return lightsaberMesh();
 const authored=meleeWeaponMesh(index);if(authored){authored.userData.special=true;authored.userData.heavy=index===36;authored.visible=false;return authored;}
 const group=new Group(),steel=new MeshStandardMaterial({color:0xb4bec7,metalness:.85,roughness:.28}),grip=new MeshStandardMaterial({color:0x20252b,roughness:.85});
 const add=(geo,mat,x,y,z)=>{const m=new Mesh(geo,mat);m.position.set(x,y,z);group.add(m);return m;};
 const length=index===31?.74:index===32?.47:.32;
 for(const x of index===33?[-.28,.1]:[0]){
  add(new BoxGeometry(.045,.05,.18),grip,x,0,.02);
  add(new BoxGeometry(.13,.025,.035),steel,x,0,-.08);
  add(new BoxGeometry(.045,.012,length),steel,x,0,-.09-length/2);
  add(new ConeGeometry(.025,.1,4),steel,x,0,-.14-length).rotation.x=-Math.PI/2;
 }
 if(index===32)add(new BoxGeometry(.085,.075,.21),grip,0,-.035,-.04);
 group.userData.special=true;group.visible=false;return group;
}
 
function poseHeavy(mesh, p, slam) {
 const lift = slam ? 1.25 : 0.85, a = 0.27, s = 0.42;
 let up, fwd;
 if (p < a) { const k = p / a, e = 1 - (1 - k) ** 2; up = lift * e; fwd = -0.05 * e; }
 else if (p < s) { const k = (p - a) / (s - a), e = k * k * k; up = lift - (lift + (slam ? 1.0 : 0.75)) * e; fwd = -0.05 + 0.2 * e; }
 else { const k = (p - s) / (1 - s), e = 1 - (1 - k) ** 3; up = -(slam ? 1.0 : 0.75) * (1 - e); fwd = 0.15 * (1 - e); }
 mesh.rotation.set(up, 0, -up * 0.25);
 mesh.position.set(0, up * 0.05 - (p > a && p < 0.6 ? 0.03 : 0), -fwd);
}
export function poseSpecialWeapon(mesh, now, attack) {
 if(!mesh?.userData.special)return;
 if(mesh.userData.heavy){const p=attack?Math.max(0,Math.min(1,(now-attack.at)/attack.duration)):1;poseHeavy(mesh,p,!!attack?.slam);return;}
 const p=attack?Math.max(0,Math.min(1,(now-attack.at)/attack.duration)):1;
 const swing=Math.sin(p*Math.PI),side=attack?.hand===1?-1:1;
 mesh.rotation.set(swing*.65,side*swing*.85,-side*swing*.7);
 mesh.position.set(side*swing*.1,-swing*.035,-swing*.13);
}
