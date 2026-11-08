export function updateHUD(s,els){
 els.healthBar.style.width=Math.max(0,s.player.hp)+'%'; els.healthBar.className=s.player.hp<30?'hit':''; els.healthBar.id='healthBar';
 els.wave.textContent='WAVE '+s.wave;
 els.freezeFill.style.width=s.freeze.energy+'%'; els.freezeFill.className=s.freeze.active?'active':''; els.freezeFill.id='freezeFill';
 let t=s.elapsed; let m=Math.floor(t/60),sec=Math.floor(t%60),ds=Math.floor((t%1)*10); els.timer.textContent='⏱ '+String(m).padStart(2,'0')+':'+String(sec).padStart(2,'0')+'.'+ds;
 let best=localStorage.getItem('chronoMazeBestTime'); els.score.textContent='BEST: '+(best?Number(best).toFixed(1)+'s':'-')+' | HS WAVE '+(localStorage.getItem('chronoMazeHighScore')||0);
 let mc=els.minimap.getContext('2d'); mc.fillStyle='#0a0a12';mc.fillRect(0,0,110,80); mc.fillStyle='#39ff88';mc.fillRect(s.level.exit.x/840*110-3,s.level.exit.y/600*80-3,6,6); mc.fillStyle='#fff';mc.fillRect(s.player.x/840*110-2,s.player.y/600*80-2,4,4); mc.fillStyle='#f00'; s.enemies.forEach(e=>mc.fillRect(e.x/840*110-2,e.y/600*80-2,4,4));
}
