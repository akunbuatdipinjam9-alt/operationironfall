 
 
 
 
 
 
 
 
import { ARENA_MAPS } from '../world/ArenaMaps.js';

export const POCKET_OFFSET = Object.freeze({ x: 300, z: 0 });
export const POCKET_HALF = 40;  
export const POCKET = Object.freeze({ minX: POCKET_OFFSET.x - POCKET_HALF, maxX: POCKET_OFFSET.x + POCKET_HALF, minZ: POCKET_OFFSET.z - POCKET_HALF, maxZ: POCKET_OFFSET.z + POCKET_HALF });
export const DOOR_HALF_WIDTH = 1.05;

export const inPocket = p => !!p && p.x >= POCKET.minX - 3 && p.x <= POCKET.maxX + 3 && p.z >= POCKET.minZ - 3 && p.z <= POCKET.maxZ + 3;

 
export function pocketBoxes(annex = ARENA_MAPS.ANNEX) {
  const out = annex.boxes.filter(b => Math.abs(b.x) <= POCKET_HALF + 1 && Math.abs(b.z) <= POCKET_HALF + 1).map(b => ({ ...b, x: b.x + POCKET_OFFSET.x, z: b.z + POCKET_OFFSET.z }));
  const L = POCKET_HALF * 2 + 2, H = annex.ceiling || 3.4;
  for (const s of [-1, 1]) {
    out.push({ x: POCKET_OFFSET.x + s * (POCKET_HALF + 0.5), z: POCKET_OFFSET.z, w: 1, d: L, h: H, y: 0, kind: 'pocket-edge', bullets: true });
    out.push({ x: POCKET_OFFSET.x, z: POCKET_OFFSET.z + s * (POCKET_HALF + 0.5), w: L, d: 1, h: H, y: 0, kind: 'pocket-edge', bullets: true });
  }
  return out;
}

 
 
export function pocketDoor(annex = ARENA_MAPS.ANNEX) {
  const boxes = annex.boxes, clear = (x, z, hw, hd) => !boxes.some(b => Math.abs(b.x - x) < b.w / 2 + hw && Math.abs(b.z - z) < b.d / 2 + hd);
  let best = null, bestD = Infinity;
  for (const b of boxes) {
    if (b.kind !== 'wall' || Math.max(b.w, b.d) < 2.6 || Math.abs(b.x) > 24 || Math.abs(b.z) > 24) continue;
    const along = b.w > b.d, T = Math.min(b.w, b.d);
    for (const s of [-1, 1]) {
      const yaw = along ? (s > 0 ? 0 : Math.PI) : (s > 0 ? Math.PI / 2 : -Math.PI / 2), fx = Math.sin(yaw), fz = Math.cos(yaw);
      const x = b.x + fx * (T / 2 + 1.3), z = b.z + fz * (T / 2 + 1.3);  
      if (!clear(x + fx * 0.4, z + fz * 0.4, along ? 1.45 : 1.1, along ? 1.1 : 1.45)) continue;  
      if (!clear(x - fx * 0.55, z - fz * 0.55, along ? 1.3 : 0.35, along ? 0.35 : 1.3)) continue;  
      const d = Math.hypot(x, z); if (d < bestD) { bestD = d; best = { x, z, yaw }; }
    }
  }
  best ||= { x: 4, z: 4, yaw: 0 };
  return { x: +(best.x + POCKET_OFFSET.x).toFixed(3), z: +(best.z + POCKET_OFFSET.z).toFixed(3), yaw: best.yaw };
}

 
const frame = d => ({ fx: Math.sin(d.yaw), fz: Math.cos(d.yaw), rx: Math.cos(d.yaw), rz: -Math.sin(d.yaw) });
export function toLocal(d, p) { const f = frame(d), dx = p.x - d.x, dz = p.z - d.z; return { lx: dx * f.rx + dz * f.rz, lz: dx * f.fx + dz * f.fz }; }
export function through(from, to, p) {
  const { lx, lz } = toLocal(from, p), f = frame(to);
  return { x: to.x - f.rx * lx - f.fx * lz, z: to.z - f.rz * lx - f.fz * lz };
}
export const yawDelta = (from, to) => to.yaw - from.yaw + Math.PI;
 
export function crossed(door, a, b, halfWidth = DOOR_HALF_WIDTH) {
  const pa = toLocal(door, a), pb = toLocal(door, b);
  if (!(pa.lz > 0 && pb.lz <= 0)) return false;
  const k = pa.lz / (pa.lz - pb.lz), lx = pa.lx + (pb.lx - pa.lx) * k;
  return Math.abs(lx) <= halfWidth;
}
