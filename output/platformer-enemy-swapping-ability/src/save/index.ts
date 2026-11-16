const SAVE_KEY = "shiftbound_v1";
export function loadSave() {
  try {
    const data = localStorage.getItem(SAVE_KEY);
    return data ? JSON.parse(data) : { shards: 0, bestTimes: {}, totalDeaths: 0, settings: { shake: true, motion: "normal" }, unlocks: {} };
  } catch { return {}; }
}
export function saveGame(state: any) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(state));
}