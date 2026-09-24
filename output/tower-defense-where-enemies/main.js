// Main Loop
let last=0;
let runTime=0;
function loop(ts){const dt=(ts-last)/1000;last=ts;runTime+=dt;updateCamera();updateEnemies(dt);render();updateTimer(runTime);updateHUD();requestAnimationFrame(loop);}
initLayers();
updateHS(hs);
requestAnimationFrame(loop);
// Touch support
let touchStart={x:0,y:0};canvas.addEventListener('touchstart',e=>{touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};});canvas.addEventListener('touchmove',e=>{camera.targetX-=e.touches[0].clientX-touchStart.x;camera.targetY-=e.touches[0].clientY-touchStart.y;touchStart={x:e.touches[0].clientX,y:e.touches[0].clientY};});
// Sound effects
const audioCtx=new (window.AudioContext||window.webkitAudioContext)();function playSound(type){const osc=audioCtx.createOscillator();const gain=audioCtx.createGain();osc.connect(gain);gain.connect(audioCtx.destination);if(type==='shoot'){osc.frequency.value=440;gain.gain.value=0.1}if(type==='hit'){osc.frequency.value=220;gain.gain.value=0.2}osc.start();gain.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.3);osc.stop(audioCtx.currentTime+0.3);}
// Place tower on click
canvas.addEventListener('click',e=>{if(energy>=10){const rect=canvas.getBoundingClientRect();const x=(e.clientX-rect.left)/camera.zoom+camera.x;const y=(e.clientY-rect.top)/camera.zoom+camera.y;towers.push({x:Math.floor(x/GRID)*GRID,y:Math.floor(y/GRID)*GRID,surface:selected});energy-=10;playSound('shoot');}});setInterval(()=>{spawnEnemy();energy+=5;},1500);
