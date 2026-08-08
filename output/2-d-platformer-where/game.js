const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
let width,height;
function resizeCanvas(){width=window.innerWidth;height=window.innerHeight;canvas.width=width;canvas.height=height;}
window.addEventListener('resize',resizeCanvas);
resizeCanvas();
const SCALE=50; // 1 unit = 50 pixels
const GRAVITY=1.2;
const JUMP_VELOCITY=-Math.sqrt(2*GRAVITY*3); // 3 units height
const PLAYER_SPEED_BASE=5;
const PLAYER_SPEED_MAX=8;
const PHASE_DURATION=3000; // ms
const PHASE_COOLDOWN=3000; // ms
const colors={player:'#3498db',ghost:'#3498db88',enemy:'#2c3e50',background:'#1abc9c',healthBar:'#e74c3c',phaseMeter:'#f1c40f',text:'#ecf0f1'};
let keys={};
window.addEventListener('keydown',e=>{keys[e.key]=true;});
window.addEventListener('keyup',e=>{keys[e.key]=false;});
canvas.addEventListener('contextmenu',e=>{e.preventDefault();player.startPhase();});
let audioCtx=new (window.AudioContext||window.webkitAudioContext)();
function playSound(freq,dur=0.1){let osc=audioCtx.createOscillator();osc.frequency.value=freq;osc.type='sine';osc.connect(audioCtx.destination);osc.start();osc.stop(audioCtx.currentTime+dur);}
function playJump(){playSound(600,0.15);}
function playHit(){playSound(200,0.2);}
function playPhaseStart(){playSound(800,0.2);}
function playPhaseEnd(){playSound(400,0.2);}
function playEnemyDefeat(){playSound(1000,0.2);}
class Player{constructor(){this.x=5;this.y=10;this.w=1;this.h=2;this.vx=0;this.vy=0;this.onGround=false;this.health=100;this.phaseState='normal';this.phaseTimer=0;this.cooldownTimer=0;this.flashAlpha=0;}
update(dt){let target=0;if(keys['ArrowRight']||keys['d'])target=1;if(keys['ArrowLeft']||keys['a'])target=-1;if(target!==0){this.vx+=target*0.1;if(Math.abs(this.vx)>PLAYER_SPEED_MAX)this.vx=PLAYER_SPEED_MAX*Math.sign(this.vx);}else{this.vx*=0.9;if(Math.abs(this.vx)<0.01)this.vx=0;}
this.x+=this.vx*dt;if(keys[' ' ]||keys['ArrowUp']){if(this.onGround){this.vy=JUMP_VELOCITY;this.onGround=false;playJump();}}
this.vy+=GRAVITY*dt;this.y+=this.vy*dt;if(this.y>10){this.y=10;this.vy=0;this.onGround=true;}
if(this.phaseState==='normal'&&this.cooldownTimer>0){this.cooldownTimer-=dt*1000;if(this.cooldownTimer<0)this.cooldownTimer=0;}
if(this.phaseState==='phasing'){this.phaseTimer-=dt*1000;if(this.phaseTimer<=0){this.phaseState='normal';playPhaseEnd();this.checkExitOverlap();}}
if(this.flashAlpha>0){this.flashAlpha-=dt*5; if(this.flashAlpha<0)this.flashAlpha=0;}
}
checkExitOverlap(){enemies.forEach(e=>{if(overlap(this,e))e.state='idle';});}
startPhase(){if(this.phaseState==='normal'&&this.onGround&&this.cooldownTimer===0&&!isCollidingWithEnemy()){this.phaseState='phasing';this.phaseTimer=PHASE_DURATION;this.cooldownTimer=PHASE_COOLDOWN;playPhaseStart();this.flashAlpha=0.5;}}
draw(){ctx.fillStyle=this.phaseState==='phasing'?colors.ghost:colors.player;ctx.fillRect(this.x*SCALE,this.y*SCALE,this.w*SCALE,this.h*SCALE);
if(this.phaseState==='phasing'){let alpha=0.5+0.5*Math.sin(performance.now()/200);ctx.strokeStyle='rgba(255,255,255,'+alpha+')';ctx.lineWidth=4;ctx.strokeRect(this.x*SCALE,this.y*SCALE,this.w*SCALE,this.h*SCALE);}}
}
class Enemy{constructor(x){this.x=x;this.y=10;this.w=1;this.h=2;this.vx=2;this.state='idle';this.stunTimer=0;this.health=100;}
update(dt){if(this.stunTimer>0){this.stunTimer-=dt*1000;if(this.stunTimer<=0)this.state='idle';}else{this.x+=this.vx*dt;if(this.x>15||this.x<5)this.vx*=-1;}}
draw(){ctx.fillStyle=this.state==='stunned'?'#8e44ad':colors.enemy;ctx.fillRect(this.x*SCALE,this.y*SCALE,this.w*SCALE,this.h*SCALE);}}
let player=new Player();
let enemies=[new Enemy(8),new Enemy(12),new Enemy(18)];
let score=0;
let highScore=localStorage.getItem('phaseShiftHighScore')||0;
let startTime=performance.now();
function loop(){let now=performance.now();let dt=(now-lastTime)/1000;lastTime=now;update(dt);render();requestAnimationFrame(loop);}let lastTime=performance.now();loop();
function update(dt){player.update(dt);enemies.forEach(e=>e.update(dt));checkCollisions();}
function checkCollisions(){enemies.forEach(e=>{if(overlap(player,e)){if(player.phaseState==='phasing'){if(e.state!=='stunned'){e.state='stunned';e.stunTimer=1000;e.health-=10;if(e.health<=0){enemies.splice(enemies.indexOf(e),1);score+=100;playEnemyDefeat();}}}else{player.health-=10;playHit();if(player.health<=0){resetGame();}}}})
}
function resetGame(){player=new Player();enemies=[new Enemy(8),new Enemy(12),new Enemy(18)];score=0;startTime=performance.now();}
function render(){ctx.fillStyle=colors.background;ctx.fillRect(0,0,width,height);player.draw();enemies.forEach(e=>e.draw());drawHUD();if(player.flashAlpha>0){ctx.fillStyle='rgba(255,255,255,'+player.flashAlpha+')';ctx.fillRect(0,0,width,height);}}
function drawHUD(){ctx.fillStyle=colors.healthBar;ctx.fillRect(20,20,200,20);ctx.fillStyle=colors.text;ctx.fillRect(20,20,200*(player.health/100),20);ctx.fillStyle=colors.text;ctx.font='16px Arial';ctx.fillText('Health',20,60);
let cx=240,cy=30,r=15;ctx.beginPath();ctx.arc(cx,cy,r,0,-2*Math.PI*(player.cooldownTimer/PHASE_COOLDOWN));ctx.strokeStyle=colors.phaseMeter;ctx.lineWidth=3;ctx.stroke();ctx.fillStyle=colors.text;ctx.fillText('Phase',cx-15,cy+5);
ctx.fillStyle=colors.text;ctx.fillText('Phase: '+(player.cooldownTimer/1000).toFixed(1)+'s',280,30);
ctx.fillStyle=colors.text;ctx.fillText('Score: '+score,20,90);
ctx.fillStyle=colors.text;ctx.fillText('High: '+highScore,20,110);
let elapsed=(performance.now()-startTime)/1000;ctx.fillStyle=colors.text;ctx.fillText('Time: '+elapsed.toFixed(1)+'s',width-120,30);
if(score>highScore){highScore=score;localStorage.setItem('phaseShiftHighScore',highScore);}}
function overlap(a,b){return a.x+a.w>b.x&&a.x<a.x+b.w&&a.y+a.h>b.y&&a.y<a.y+b.h;}
function isCollidingWithEnemy(){return enemies.some(e=>overlap(player,e));}
window.addEventListener('keydown',e=>{if(e.key==='e'||e.key==='E'){player.startPhase();}});