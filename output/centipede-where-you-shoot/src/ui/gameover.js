export class GameOverScreen {
 constructor(uiOverlay, onRestart) {
 this.uiOverlay = uiOverlay;
 this.onRestart = onRestart;
 this.visible = false;
 this.createElements();
 }
 
 createElements() {
 this.modal = document.createElement('div');
 this.modal.className = 'modal';
 this.modal.innerHTML = `
 <h1>GAME OVER</h1>
 <p id="final-score">Score: 0</p>
 <p id="high-score">High Score: 0</p>
 <button id="restart-btn">PLAY AGAIN</button>
 `;
 this.uiOverlay.appendChild(this.modal);
 
 this.modal.querySelector('#restart-btn').addEventListener('click', () => {
 this.hide();
 this.onRestart();
 });
 }
 
 show(finalScore, highScore) {
 this.modal.querySelector('#final-score').textContent = `Score: ${finalScore}`;
 this.modal.querySelector('#high-score').textContent = `High Score: ${highScore}`;
 if (finalScore >= highScore && finalScore > 0) {
 this.modal.querySelector('#high-score').textContent = `NEW HIGH SCORE: ${finalScore}!`;
 this.modal.querySelector('#high-score').style.color = '#00ff88';
 }
 this.modal.classList.add('visible');
 this.visible = true;
 }
 
 hide() {
 this.modal.classList.remove('visible');
 this.visible = false;
 }
}