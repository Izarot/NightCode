export function updateUI(){
  const gs = window.gameState;
  document.getElementById('levelInfo').textContent=`Level ${gs.level}/5`;
  document.getElementById('blockInfo').textContent=`${gs.blocks.filter(b=>gs.targets.some(t=>t.x===b.x&&t.y===b.y)).length}/${gs.totalBlocks} Blocks Placed`;
  const timerEl=document.getElementById('timer');
  const mins=Math.floor(gs.timer/60);
  const secs=(gs.timer%60).toFixed(1);
  timerEl.textContent=`${mins}:${secs.padStart(3,'0')}`;
  document.getElementById('highScore').textContent=`High Score: ${gs.highScore.toFixed(1)}s`;
}
export function showRestart(){
  document.getElementById('restartBtn').style.display='block';
  document.getElementById('restartBtn').onclick=()=>{window.gameState.level=1;window.gameState.completed=false;window.gameState.blocks=[];window.gameState.walls=[];window.gameState.targets=[];window.gameState.player={x:0,y:0,vx:0,vy:0};initGame();};
}
