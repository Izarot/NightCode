// utils.js
export const COLORS = ['#e53935', '#1e88e5', '#43a047', '#fdd835', '#8e24aa', '#fb8c00'];
export function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}