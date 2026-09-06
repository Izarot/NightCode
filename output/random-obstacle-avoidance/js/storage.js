const KEY = 'nexus_flux_scores_v1';
const BEST = 'nexus_flux_best_v1';
export function loadScores() {
  try { const raw = localStorage.getItem(KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
}
export function saveScores(scores) {
  try { localStorage.setItem(KEY, JSON.stringify(scores.slice(0, 10))); }
  catch {}
}
export function addScore(seconds) {
  const scores = loadScores();
  scores.push({ score: seconds, time: Date.now() });
  scores.sort((a, b) => b.score - a.score);
  saveScores(scores);
  const prevBest = getBest();
  if (seconds > prevBest) { try { localStorage.setItem(BEST, seconds.toFixed(2)); } catch {} }
  return scores.slice(0, 10);
}
export function getBest() {
  const scores = loadScores();
  return scores.length ? scores[0].score : 0;
}
