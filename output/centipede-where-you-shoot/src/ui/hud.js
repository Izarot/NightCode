export class HUD {
 constructor(uiOverlay, config, persistence) {
 this.uiOverlay = uiOverlay;
 this.config = config;
 this.persistence = persistence;
 this.score = 0;
 
 this.createElements();
 }
 
 createElements() {
 this.scoreEl = document.createElement('div');
 this.scoreEl.id = 'score';
 this.scoreEl.className = 'hud';
 this.scoreEl.textContent = 'SCORE: 0';
 this.uiOverlay.appendChild(this.scoreEl);
 
 this.livesEl = document.createElement('div');
 this.livesEl.id = 'lives';
 this.livesEl.className = 'hud';
 this.livesEl.textContent = 'LIVES: 3';
 this.uiOverlay.appendChild(this.livesEl);
 
 this.timerEl = document.createElement('div');
 this.timerEl.id = 'timer';
 this.timerEl.className = 'hud';
 this.timerEl.textContent = '00:00.00';
 this.uiOverlay.appendChild(this.timerEl);
 
 this.speedMeterEl = document.createElement('div');
 this.speedMeterEl.id = 'speed-meter';
 this.speedMeterEl.className = 'hud';
 this.speedMeterEl.innerHTML = '<div id="speed-meter-fill"></div>';
 this.uiOverlay.appendChild(this.speedMeterEl);
 
 this.pauseBtn = document.createElement('button');
 this.pauseBtn.id = 'pause-btn';
 this.pauseBtn.className = 'hud';
 this.pauseBtn.textContent = '⏸';
 this.pauseBtn.addEventListener('click', () => window.dispatchEvent(new CustomEvent('pause')));
 this.uiOverlay.appendChild(this.pauseBtn);
 
 this.updateLives(3);
 }
 
 addScore(points) {
 this.score += points;
 this.scoreEl.textContent = `SCORE: ${this.score}`;
 }
 
 getScore() {
 return this.score;
 }
 
 updateLives(lives) {
 this.livesEl.innerHTML = '';
 for (let i = 0; i < 3; i++) {
 const heart = document.createElement('div');
 heart.className = 'heart' + (i >= lives ? ' lost' : '');
 this.livesEl.appendChild(heart);
 }
 }
 
 updateTimer(time) {
 const mins = Math.floor(time / 60).toString().padStart(2, '0');
 const secs = Math.floor(time % 60).toString().padStart(2, '0');
 const ms = Math.floor((time % 1) * 100).toString().padStart(2, '0');
 this.timerEl.textContent = `${mins}:${secs}.${ms}`;
 }
 
 updateSpeedMeter(multiplier) {
 const fill = document.getElementById('speed-meter-fill');
 if (fill) {
 const percent = Math.min(100, (multiplier - 1) * 100 + 20);
 fill.style.width = `${percent}%`;
 }
 }
 
 setHighScore(highScore) {
 // Could add high score display if needed
 }
 
 setPaused(paused) {
 this.pauseBtn.textContent = paused ? '▶' : '⏸';
 }
 
 reset() {
 this.score = 0;
 this.scoreEl.textContent = 'SCORE: 0';
 this.updateLives(3);
 this.timerEl.textContent = '00:00.00';
 const fill = document.getElementById('speed-meter-fill');
 if (fill) fill.style.width = '0%';
 }
}