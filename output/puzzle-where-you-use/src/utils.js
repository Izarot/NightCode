export function getVector(x, y) { return {x, y}; }
export function clamp(v, min, max) { return Math.min(Math.max(v, min), max); }
export function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx*dx + dy*dy);
}