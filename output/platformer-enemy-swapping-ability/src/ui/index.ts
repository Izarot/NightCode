const timerEl = document.getElementById("timer") as HTMLSpanElement;
const shardEl = document.getElementById("shards") as HTMLSpanElement;
const heartEls = document.querySelectorAll<HTMLElement>(".heart");
const swapDiamond = document.getElementById("swapDiamond") as HTMLDivElement;
let startTime = 0;
export function startTimer(el: HTMLSpanElement, ts: number) {
  startTime = ts;
  el.textContent = "00:00.0";
  setInterval(() => {
    const elapsed = (Date.now() - ts) / 1000;
    const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
    const secs = Math.floor(elapsed % 60).toString().padStart(2, "0");
    const dec = Math.floor((elapsed * 10) % 10).toString();
    el.textContent = `${mins}:${secs}.${dec}`;
  }, 100);
}
export function updateUI() {
  // hearts, shards, swap cooldown radial, chain pop
  swapDiamond.style.background = `conic-gradient(from 0deg, #0ff, #f0f ${player.chain * 20}%, #0ff)`;
  shardEl.textContent = `${player.shardsCollected}/3`;
  heartEls.forEach((h, i) => h.style.opacity = player.invuln > i * 1.2 ? "0.3" : "1");
}