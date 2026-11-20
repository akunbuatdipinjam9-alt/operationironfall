import {AnimationClip, AnimationMixer, NumberKeyframeTrack, Object3D, MathUtils, Frustum, Matrix4, Sphere, Vector3} from 'three';
const clamp=MathUtils.clamp, damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
const channels=['hipL','hipR','kneeL','kneeR','bob','sway','lean'];

function clip(name,amplitude,lift,lean){
 const tracks=channels.map(channel=>{
  const times=[],values=[];
  for(let i=0;i<=32;i++){
   const t=i/32,p=t*Math.PI*2,s=Math.sin(p),r=Math.sin(p+Math.PI);
   times.push(t);values.push(channel==='hipL'?s*amplitude:channel==='hipR'?r*amplitude:channel==='kneeL'?Math.max(0,-s)*lift:channel==='kneeR'?Math.max(0,-r)*lift:channel==='bob'?(1-Math.cos(p*2))*(amplitude?amplitude*.014:.002):channel==='sway'?s*amplitude*.025:lean);
  }
  return new NumberKeyframeTrack('.'+channel,times,values);
 });
 return new AnimationClip(name,1,tracks);
}
export const LOCOMOTION_CLIPS=Object.freeze([clip('idle',0,0,0),clip('walk',.38,.62,.035),clip('run',.68,1.02,.15)]);


export class MotionBlend {
 constructor(){this.reset();}
 reset(){this.speed=0;this.phase=0;this.time=0;this.weights=[1,0,0];this.grounded=true;this.airTime=0;this.landing=0;this.air=0;this.compression=0;this.state='IDLE';this.minVy=0;}
 update(dt,input){
  dt=clamp(Number.isFinite(dt)?dt:0,0,.1);this.time+=dt;
  const speed=clamp(Math.hypot(input.vx||0,input.vz||0),0,16),grounded=input.grounded!==false;
  this.speed=damp(this.speed,speed,12,dt);
  if(this.grounded&&!grounded){this.airTime=0;this.minVy=0;}
  if(!grounded){this.airTime+=dt;this.minVy=Math.min(this.minVy,input.vy||0);}
  if(!this.grounded&&grounded){this.landing=clamp(.035-Math.min(-1,this.minVy)*.012,.04,.13);this.airTime=0;}
  this.landing*=Math.exp(-11*dt);this.air=damp(this.air,grounded?0:1,18,dt);
  this.compression=damp(this.compression,grounded&&input.jumpRequested?.07:0,24,dt);
  const moving=MathUtils.smoothstep(this.speed,.08,.8),run=input.crouch?0:MathUtils.smoothstep(this.speed,3.5,6.5);
  const targets=[1-moving,moving*(1-run),moving*run];
  for(let i=0;i<3;i++)this.weights[i]=damp(this.weights[i],targets[i],10,dt);

  this.phase=(this.phase+dt*(grounded?this.speed/(2.2+run*1.5):0))%1;
  this.state=!grounded?(this.airTime<.12&&(input.vy||0)>0?'TAKEOFF':(input.vy||0)>0?'RISING':'FALLING'):this.landing>.018?'LANDING':input.jumpRequested?'ANTICIPATION':input.crouch?'CROUCH':this.speed>.2?(run>.5?'RUN':'WALK'):'IDLE';
  this.grounded=grounded;return this;
 }
}


export class AnimationBudget {
 constructor(){this.frustum=new Frustum();this.matrix=new Matrix4();this.sphere=new Sphere(new Vector3(),1.5);this.eye=new Vector3();this.ready=false;}
 prepare(camera){this.ready=!!camera;if(!camera)return;camera.updateWorldMatrix(true,false);camera.getWorldPosition(this.eye);this.matrix.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse);this.frustum.setFromProjectionMatrix(this.matrix);}
 interval(root){if(!this.ready)return 0;this.sphere.center.copy(root.position);this.sphere.center.y+=1;const d=this.eye.distanceToSquared(this.sphere.center);if(!root.visible||!this.frustum.intersectsSphere(this.sphere))return .25;return d>60*60?.1:d>25*25?.05:0;}
}


export class OperatorAnimator {
 constructor(rig){
  this.rig=rig;this.motion=new MotionBlend();this.pose=new Object3D();for(const k of channels)this.pose[k]=0;
  this.mixer=new AnimationMixer(this.pose);this.actions=LOCOMOTION_CLIPS.map(c=>this.mixer.clipAction(c).play());
  this.baseUpper=rig.upper.position.y;this.baseHead=rig.head.position.y;this.baseHipL=rig.legL.position.y;this.baseHipR=rig.legR.position.y;
  this.reset();
 }
 reset(){this.motion.reset();this.feetYaw=this.torsoYaw=this.rig.root.rotation.y;this.lastYaw=this.feetYaw;this.lastPosition=this.rig.root.position.clone();this.elapsed=1;this.crouch=0;this.turn=0;this.disposed=false;}
 update(dt,input={},interval=0){
  if(this.disposed)return false;dt=clamp(dt,0,.1);const r=this.rig;
  if(r.root.position.distanceToSquared(this.lastPosition)>9)this.reset();this.lastPosition.copy(r.root.position);
  const motion=this.motion.update(dt,input),yaw=r.root.rotation.y;
  const yawRate=angle(this.lastYaw,yaw)/Math.max(dt,.001);this.lastYaw=yaw;this.turn=damp(this.turn,clamp(yawRate,-3,3),10,dt);
  let travelOffset=0;
  if(motion.speed>.3){travelOffset=angle(yaw,Math.atan2(-(input.vx||0),-(input.vz||0)));if(Math.abs(travelOffset)>Math.PI/2)travelOffset=angle(0,travelOffset+Math.PI);travelOffset=clamp(travelOffset,-.65,.65);}
  this.feetYaw+=angle(this.feetYaw,yaw+travelOffset)*(1-Math.exp(-7*dt));this.torsoYaw+=angle(this.torsoYaw,yaw)*(1-Math.exp(-15*dt));

  this.feetYaw=yaw+clamp(angle(yaw,this.feetYaw),-.8,.8);this.torsoYaw=yaw+clamp(angle(yaw,this.torsoYaw),-.35,.35);
  this.crouch=damp(this.crouch,input.crouch?1:0,12,dt);this.elapsed+=dt;
  if(this.elapsed<interval)return false;this.elapsed=0;
  const forward=-((input.vx||0)*Math.sin(yaw)+(input.vz||0)*Math.cos(yaw));
  const gaitPhase=forward<-.2?1-motion.phase:motion.phase;
  const strafe=clamp(((input.vx||0)*Math.cos(yaw)-(input.vz||0)*Math.sin(yaw))/Math.max(motion.speed,.2),-1,1);
  for(let i=0;i<3;i++){this.actions[i].time=i?gaitPhase:motion.time*.22%1;this.actions[i].setEffectiveWeight(motion.weights[i]);}
  this.mixer.update(0);const p=this.pose,air=motion.air;
  const launch=motion.airTime<.12&&(input.vy||0)>0?Math.sin(motion.airTime/.12*Math.PI)*.18:0;
  const tuck=clamp(.32+(input.vy||0)*.025,.18,.55)*air;
  const lower=this.crouch*.19+motion.landing+motion.compression;
  const stance=Math.sin(motion.time*10)*Math.min(.14,Math.abs(this.turn)*.04)*(1-motion.weights[1]-motion.weights[2]);
  r.visual.rotation.y=angle(yaw,this.feetYaw);
  r.upper.position.y=this.baseUpper+p.bob*(1-air)-lower-launch*.1;
  r.upper.rotation.set(p.lean*(1-air)+.08*air,this.torsoYaw-this.feetYaw,clamp(-this.turn*.025,-.075,.075)+p.sway*.5);
  r.legL.position.y=this.baseHipL-lower*.7;r.legR.position.y=this.baseHipR-lower*.7;
  r.legL.rotation.set(p.hipL*(1-air)+tuck+this.crouch*.38+stance,0,p.sway*.35-p.hipL*strafe*.45);
  r.legR.rotation.set(p.hipR*(1-air)+tuck*.8+this.crouch*.38-stance,0,-p.sway*.35-p.hipR*strafe*.45);
  const bend=lower*3+launch;
  r.kneeL.rotation.x=-(p.kneeL*(1-air)+tuck*1.6+bend);r.kneeR.rotation.x=-(p.kneeR*(1-air)+tuck*1.4+bend);

  const pitch=clamp(input.pitch||0,-1.2,1.2);
  r.head.position.y=this.baseHead-p.bob*.7*(1-air);r.head.rotation.set(pitch*.55-r.upper.rotation.x*.65,angle(this.torsoYaw,yaw),-r.upper.rotation.z*.7);
  const reload=input.reloading?-.42+Math.sin(motion.time*6)*.08:0,kick=input.recoil||0;
  r.arms.rotation.set(pitch-r.upper.rotation.x+reload+kick+p.bob*.35,angle(this.torsoYaw,yaw),input.reloading?.3:-r.upper.rotation.z*.7);
  return true;
 }
 dispose(){if(this.disposed)return;this.mixer.stopAllAction();this.mixer.uncacheRoot(this.pose);this.disposed=true;}
}


export class ViewmodelMotion {
 constructor(){this.blend=new MotionBlend();this.y=0;this.pitch=0;}
 reset(){this.blend.reset();this.y=this.pitch=0;}
 update(dt,input){const m=this.blend.update(dt,input),aim=1-clamp(input.ads||0,0,1)*.9;this.y=(-m.air*.012-m.landing*.15-m.compression*.2)*aim;this.pitch=(m.air*clamp(-(input.vy||0)*.003,-.025,.025)+m.landing*.14)*aim;return this;}
}
