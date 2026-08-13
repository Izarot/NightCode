export function applyForce(magnet, keys) {
  const {x:mx, y:my, radius, strength, polarity} = magnet;
  const r2 = radius*radius;
  for (const key of keys) {
    const dx = key.x - mx;
    const dy = key.y - my;
    const distSq = dx*dx + dy*dy;
    if (distSq <= r2) {
      const dist = Math.sqrt(distSq);
      const nx = dx/dist;
      const ny = dy/dist;
      const falloff = 1 - distSq/r2;
      const force = strength * falloff;
      const ax = (polarity===1 ? nx : -nx) * force / key.mass;
      const ay = (polarity===1 ? ny : -ny) * force / key.mass;
      key.vx += ax;
      key.vy += ay;
    }
  }
}