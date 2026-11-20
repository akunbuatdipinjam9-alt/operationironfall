export const DASH_EASE_SECONDS = .22;

export function dashOffsetWeight(elapsed) {
  const t = Math.max(0, Math.min(1, elapsed / DASH_EASE_SECONDS));
  return 1 - t * t * (3 - 2 * t);
}
