import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import * as THREE from 'three';

let characterDistance = 14;
export function setCharacterDistance(value) { characterDistance = value; }
class CharacterLOD extends THREE.LOD {
  update(camera) {
    if (this.levels.length > 1) this.levels[1].distance = characterDistance;
    super.update(camera);
  }
}

export function tailoredSurface(rows, rings = 32, sides = 24, folds = 0) {
  const path = new THREE.CatmullRomCurve3(rows.map(r => new THREE.Vector3(...r.slice(0, 3))));
  const profile = new THREE.CatmullRomCurve3(rows.map((r, i) => new THREE.Vector3(r[3], r[4], i / rows.length)), false, 'catmullrom', .4);
  const vertices = [], uv = [], indices = [];
  for (let i = 0; i <= rings; i++) {
    const t = i / rings, point = path.getPoint(t), tangent = path.getTangent(t);
    const lateral = new THREE.Vector3(1, 0, 0);
    lateral.addScaledVector(tangent, -lateral.dot(tangent)).normalize();
    const depth = tangent.clone().cross(lateral), width = profile.getPoint(t);
    for (let j = 0; j < sides; j++) {
      const a = 2 * Math.PI * j / sides;
      const ripple = 1 + folds * Math.sin(24 * t + 2.3 * Math.cos(a)) * Math.sin(Math.PI * t) ** 2;
      const p = point.clone().addScaledVector(lateral, width.x * Math.cos(a) * ripple).addScaledVector(depth, width.y * Math.sin(a) * ripple);
      vertices.push(p.x,p.y,p.z); uv.push(j/sides,t);
      if (i < rings) {
        const k = i*sides+j, next = i*sides+(j+1)%sides;
        indices.push(k,next,k+sides,next,next+sides,k+sides);
      }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(vertices,3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv,2)); g.setIndex(indices);
  g.computeVertexNormals(); return g;
}

export function articulatedLeg(upper, lower, side, material) {
  const thigh = new THREE.Bone(), shin = new THREE.Bone();
  thigh.name = 'thigh'; shin.name = 'shin';
  upper.add(thigh); thigh.add(shin); shin.position.set(0,-.4,-.01); shin.add(lower);
  lower.position.set(0,0,0);
  const rows = [[-.045*side,.09,0,.048,.05],[-.032*side,.036,.006,.093,.092],[-.013*side,-.078,.002,.097,.098],
    [0,-.17,-.008,.086,.095],[.005*side,-.28,-.016,.068,.078],[0,-.365,-.019,.059,.061],
    [0,-.40,-.014,.058,.063],[-.003*side,-.45,.002,.052,.055],[.003*side,-.51,.02,.062,.065],
    [0,-.57,.022,.055,.059],[0,-.665,.008,.039,.041]];
  const lod = new CharacterLOD(); upper.add(lod);
  const skeleton = new THREE.Skeleton([thigh,shin]);
  upper.updateMatrixWorld(true); skeleton.calculateInverses();
  for (const [rings,sides,distance] of [[44,32,0],[14,10,13]]) {
    const g = tailoredSurface(rows,rings,sides,.035), pos = g.attributes.position;
    const weights = [], bones = [];
    for (let i=0;i<pos.count;i++) {
      const w = THREE.MathUtils.smoothstep(-pos.getY(i),.335,.465);
      weights.push(1-w,w,0,0); bones.push(0,1,0,0);
    }
    g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
    g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bones,4));
    const mesh = new THREE.SkinnedMesh(g,material); mesh.bind(skeleton,new THREE.Matrix4());
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.boundingSphere = new THREE.Sphere(new THREE.Vector3(0,-.27,0),.62);
    lod.addLevel(mesh,distance,.12);
  }
  upper.userData.releaseSkeleton = () => skeleton.dispose();
  return shin;
}

export function skinSleeve(group, elbow, hand) {
  const mesh = group.children.find(child => child.userData.part === 'sleeve');
  const shoulder = new THREE.Bone(), joint = new THREE.Bone();
  shoulder.name = 'shoulder'; joint.name = 'elbow';
  group.add(shoulder); shoulder.add(joint); joint.position.fromArray(elbow);
  const lower = new THREE.Vector3(...hand).sub(joint.position);
  const upper = joint.position.clone(), point = new THREE.Vector3();
  const weights = [], bones = [], pos = mesh.geometry.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    point.fromBufferAttribute(pos,i);
    const upperT = THREE.MathUtils.clamp(point.dot(upper)/upper.lengthSq(),0,1);
    const fromJoint = point.clone().sub(joint.position);
    const lowerT = THREE.MathUtils.clamp(fromJoint.dot(lower)/lower.lengthSq(),0,1);
    const onUpper = upper.clone().multiplyScalar(upperT).distanceToSquared(point);
    const onLower = lower.clone().multiplyScalar(lowerT).distanceToSquared(fromJoint);
    const signed = onUpper < onLower ? -(1-upperT)*upper.length() : lowerT*lower.length();
    const bend = THREE.MathUtils.smoothstep(signed,-.055,.055);
    const wrist = THREE.MathUtils.smoothstep(lowerT,.56,.88);
    bones.push(0,1,0,0); weights.push(1-bend*(1-wrist),bend*(1-wrist),0,0);
  }
  mesh.geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(bones,4));
  mesh.geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute(weights,4));
  const skin = new THREE.SkinnedMesh(mesh.geometry,mesh.material);
  skin.userData.part = 'sleeve'; skin.castShadow = skin.receiveShadow = true;
  mesh.removeFromParent(); group.add(skin);
  shoulder.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton([shoulder,joint]);
  skin.bind(skeleton,new THREE.Matrix4());
  return { joint, skeleton };
}

export function headLevels(head, materials) {
  const pieces = [];
  const fine = new THREE.Group(), coarse = new THREE.Group();
  for (const mesh of [...head.children]) {
    if (!mesh.isMesh) continue;
    fine.add(mesh);
    const g = mesh.geometry, pos = g.attributes.position;
    const cells = new Map(), vertices = [], indices = [], remap = [];
    for (let i=0;i<pos.count;i++) {
      const x=pos.getX(i), y=pos.getY(i), z=pos.getZ(i);
      const key=[x,y,z].map(n=>Math.round(n/.009)).join(',');
      if (!cells.has(key)) { cells.set(key,vertices.length/3); vertices.push(x,y,z); }
      remap.push(cells.get(key));
    }
    for (let i=0;i<remap.length;i+=3) {
      const [a,b,c]=[remap[i],remap[i+1],remap[i+2]];
      if (a!==b && b!==c && c!==a) indices.push(a,b,c);
    }
    if (!indices.length) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3)); geo.setIndex(indices); geo.computeVertexNormals();
    const colors = [];
    const color = mesh.material.color;
    for(let i=0;i<vertices.length/3;i++) colors.push(color.r,color.g,color.b);
    geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3)); pieces.push(geo);
  }
  const lod = new CharacterLOD();
  materials.headDistance = new THREE.MeshToonMaterial({vertexColors:true});
  const proxy = new THREE.Mesh(mergeGeometries(pieces),materials.headDistance);
  pieces.forEach(piece=>piece.dispose()); proxy.castShadow = proxy.receiveShadow = true; coarse.add(proxy);
  lod.addLevel(fine,0); lod.addLevel(coarse,15,.12); head.add(lod);
}
