export const vec2 = { 
  add: (a: number[], b: number[]) => [a[0] + b[0], a[1] + b[1]], 
  sub: (a: number[], b: number[]) => [a[0] - b[0], a[1] - b[1]], 
  mul: (a: number[], s: number) => [a[0] * s, a[1] * s], 
  dot: (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1], 
  length: (a: number[]) => Math.hypot(a[0], a[1]), 
  normalize: (a: number[]) => { const l = vec2.length(a); return l > 0 ? vec2.mul(a, 1 / l) : [0, 0]; }
};
