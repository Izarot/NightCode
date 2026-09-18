class UI{
constructor(){
this.screens={menu:document.getElementById('menuScreen'),pause:document.getElementById('pauseScreen'),gameover:document.getElementById('gameOverScreen')};
this.updateHighScore();
}
showScreen(name){for(const k in this.screens)this.screens[k].classList.remove('active');if(name&&this.screens[name])this.screens[name].classList.add('active');}
updateHighScore(){const hs=localStorage.getItem('towerTetrisHigh')||0;document.getElementById('menuHighScore').textContent=hs;}
showGameOver(score,level,lines,time){document.getElementById('finalScore').textContent=score;document.getElementById('finalLevel').textContent=level;document.getElementById('finalLines').textContent=lines;document.getElementById('finalTime').textContent=time;const best=localStorage.getItem('towerTetrisHigh')||0;document.getElementById('bestScore').textContent=Math.max(best,score);if(score>best)localStorage.setItem('towerTetrisHigh',score);this.showScreen('gameover');}
}
