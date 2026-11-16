import { initInput } from "./input";
import { initAudio } from "./audio";
import { initPhysics } from "./physics";
import { initEntities } from "./entities";
import { initLevels } from "./levels";
import { initFX } from "./fx";
import { initUI } from "./ui";
import { initSave } from "./save";
import { startTimer } from "./core";

const FPS = 60;
const DT = 1 / FPS;
let accumulator = 0;
let lastTime = 0;
const canvas = document.getElementById("gameCanvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

const startTime = Date.now();
startTimer(document.getElementById("timer") as HTMLSpanElement, startTime);

function loop(timestamp: number) {
  const delta = (timestamp - lastTime) / 1000;
  accumulator += delta;
  while (accumulator >= DT) {
    initInput.update(DT);
    initPhysics.update(DT);
    initEntities.update(DT);
    initFX.update(DT);
    initUI.update(DT);
    accumulator -= DT;
  }
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  initEntities.render(ctx);
  initFX.render(ctx);
  initUI.render(ctx);
  lastTime = timestamp;
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);