export const levels = [
  {
    id: 1,
    zone: "Verdant Ruins",
    par: 70,
    tileset: "grid",
    enemies: [],
    goals: [{ x: 300, y: 200 }],
    fluxShards: 3,
    intro: "Swap to move!",
  },
  // levels 2‑8 omitted for brevity
];
export function loadLevel(id: number) { /* parse JSON, init entities */ }
