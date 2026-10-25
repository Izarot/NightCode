class UI{
  constructor(){ this.scoreEl=document.getElementById('score'); this.levelEl=document.getElementById('level'); this.linesEl=document.getElementById('lines'); this.nextEl=document.getElementById('next-preview'); this.holdEl=document.getElementById('hold-preview'); this.pressureBar=document.getElementById('pressure-bar'); this.pressureLabel=document.getElementById('pressure-label'); this.startScreen=document.getElementById('start-screen'); this.pauseScreen=document.getElementById('pause-screen'); this.gameoverScreen=document.getElementById('gameover-screen'); this.gameoverStats=document.getElementById('gameover-stats'); this.swatches=document.getElementById('swatches'); this.startBtn=document.getElementById('start-btn'); this.resumeBtn=document.getElementById('resume-btn'); this.retryBtn=document.getElementById('retry-btn'); this.touchControls=document.getElementById('touch-controls'); this.initSwatches(); this.bindEvents(); }
  initSwatches(){ Emotion.EMOTIONS.forEach(e=>{ const s=document.createElement('div'); s.className='swatch'; s.style.background=e.color; s.title=e.id; this.swatches.appendChild(s); }); }
  bindEvents(){ this.startBtn.onclick=()=>window.Game.start(); this.resumeBtn.onclick=()=>window.Game.resume(); this.retryBtn.onclick=()=>window.Game.start(); document.querySelectorAll('.ctrl-btn').forEach(btn=>{ btn.addEventListener('touchstart',e=>{ e.preventDefault(); window.Game.handleInput(btn.dataset.action); },{passive:false}); btn.addEventListener('mousedown',()=>window.Game.handleInput(btn.dataset.action)); }); document.addEventListener('keydown',e=>{ if(e.repeat) return; const map={ArrowLeft:'left',ArrowRight:'right',ArrowDown:'down',ArrowUp:'rotate',Space:'hard',KeyZ:'rotate',KeyX:'rotate',KeyC:'hold',ShiftLeft:'hold',ShiftRight:'hold'}; if(map[e.code]){ e.preventDefault(); window.Game.handleInput(map[e.code]); } }); document.addEventListener('keyup',e=>{ if(e.code==='ArrowDown') window.Game.handleInput('downRelease'); }); document.addEventListener('visibilitychange',()=>{ if(document.hidden) window.Game.pause(); }); }
  updateScore(score){ this.scoreEl.textContent=score.toLocaleString(); }
  updateLevel(level){ this.levelEl.textContent=level; }
  updateLines(lines){ this.linesEl.textContent=lines; }
  updateNext(pieces){ Renderer.drawNext(pieces, this.nextEl); }
  updateHold(piece){ Renderer.drawHold(piece, this.holdEl); }
  updatePressure(pct){ this.pressureBar.style.width=(pct*100)+'%'; this.pressureLabel.textContent=Math.round(pct*100)+'%'; const hue=120-pct*120; this.pressureBar.style.background=`hsl(${hue}, 80%, 50%)`; }
  showStart(){ this.startScreen.classList.remove('hidden'); this.pauseScreen.classList.add('hidden'); this.gameoverScreen.classList.add('hidden'); }
  showPause(){ this.pauseScreen.classList.remove('hidden'); }
  hidePause(){ this.pauseScreen.classList.add('hidden'); }
  showGameOver(stats){ this.gameoverScreen.classList.remove('hidden'); this.gameoverStats.innerHTML=`
    <div class="stat-row"><span class="stat-label">Final Score</span><span class="stat-value">${stats.score.toLocaleString()}</span></div>
    <div class="stat-row"><span class="stat-label">Level Reached</span><span class="stat-value">${stats.level}</span></div>
    <div class="stat-row"><span class="stat-label">Lines Cleared</span><span class="stat-value">${stats.lines}</span></div>
    <div class="stat-row"><span class="stat-label">Tetrises</span><span class="stat-value">${stats.tetrises}</span></div>
    <div class="stat-row"><span class="stat-label">Resonances</span><span class="stat-value">${stats.resonances}</span></div>
    <div class="stat-row"><span class="stat-label">Tilts Survived</span><span class="stat-value">${stats.tilts}</span></div>
  `; }
  hideAll(){ this.startScreen.classList.add('hidden'); this.pauseScreen.classList.add('hidden'); this.gameoverScreen.classList.add('hidden'); }
}
window.UI = { UI };