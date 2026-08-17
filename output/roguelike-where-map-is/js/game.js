// ======== CONSTANTS ========
const CANVAS_ORIG_W = 1280;
const CANVAS_ORIG_H = 720;
const GRID_COLS = 8;
const GRID_ROWS = 8;
const ROOM_SIZE = 32; // in original grid
const MAX_HEALTH = 30;
const PLAYER_SPEED = 200; // pixels per second
const INPUT_KEYS = {left:0, right:0, up:0, down:0, action:0};

// ======== UTILITIES ========
function clamp(val, min, max){return Math.max(min, Math.min(max,val));}
function loadImage(src){const img=new Image();img.src=src;return img;}

// ======== AUDIO ========
class AudioSystem{
  constructor(){this.ctx=new (window.AudioContext||window.webkitAudioContext)();}
  playTone(freq,dur){const osc=this.ctx.createOscillator();osc.frequency.value=freq;osc.type='sine';osc.connect(this.ctx.destination);osc.start();setTimeout(()=>osc.stop(),dur);}
  playSound(buffer){const src=this.ctx.createBufferSource();src.buffer=buffer;src.connect(this.ctx.destination);src.start();}
}
const audio = new AudioSystem();

// ======== GAME STATE ========
const STATE = {MENU:0, PLAYING:1, GAMEOVER:2};
let currentState = STATE.MENU;

// ======== CANVAS SETUP ========
const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
let scale=1;
function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;scale=Math.min(canvas.width/CANVAS_ORIG_W, canvas.height/CANVAS_ORIG_H);}
window.addEventListener('resize',resize);resize();

// ======== GAME OBJECTS ========
class Player{
  constructor(){this.gridX=0;this.gridY=0;this.x=0;this.y=0;this.health=MAX_HEALTH;this.score=0;}
  update(dt){let targetX=this.gridX*ROOM_SIZE;let targetY=this.gridY*ROOM_SIZE;let dx=targetX-this.x;let dy=targetY-this.y;let dist=Math.hypot(dx,dy);if(dist>1){this.x+=dx/ dist*PLAYER_SPEED*dt;this.y+=dy/ dist*PLAYER_SPEED*dt;}}
  draw(){ctx.fillStyle='#ff0';ctx.beginPath();ctx.arc(this.x+ROOM_SIZE/2,this.y+ROOM_SIZE/2,ROOM_SIZE/4,0,Math.PI*2);ctx.fill();}
}
const player=new Player();

// ======== MAP ========
const tileTypes=['floor','wall','trap','chest'];
const map=new Array(GRID_ROWS).fill(null).map(()=>new Array(GRID_COLS).fill(null));
function generateMap(){for(let r=0;r<GRID_ROWS;r++)for(let c=0;c<GRID_COLS;c++){let t=tileTypes[Math.floor(Math.random()*tileTypes.length)];map[r][c]=t;}}
generateMap();

// ======== INPUT ========
window.addEventListener('keydown',e=>{switch(e.key){case 'ArrowLeft':case 'a':INPUT_KEYS.left=1;break;case 'ArrowRight':case 'd':INPUT_KEYS.right=1;break;case 'ArrowUp':case 'w':INPUT_KEYS.up=1;break;case 'ArrowDown':case 's':INPUT_KEYS.down=1;break;case ' ':INPUT_KEYS.action=1;break;}});
window.addEventListener('keyup',e=>{switch(e.key){case 'ArrowLeft':case 'a':INPUT_KEYS.left=0;break;case 'ArrowRight':case 'd':INPUT_KEYS.right=0;break;case 'ArrowUp':case 'w':INPUT_KEYS.up=0;break;case 'ArrowDown':case 's':INPUT_KEYS.down=0;break;case ' ':INPUT_KEYS.action=0;break;}});

// ======== GAME LOGIC ========
function handleInput(){let dirX=INPUT_KEYS.right-INPUT_KEYS.left;let dirY=INPUT_KEYS.down-INPUT_KEYS.up;if(dirX||dirY){let newX=clamp(player.gridX+dirX,0,GRID_COLS-1);let newY=clamp(player.gridY+dirY,0,GRID_ROWS-1);let tile=map[newY][newX];if(tile!=='wall'){player.gridX=newX;player.gridY=newY;audio.playTone(440,50);if(tile==='trap'){player.health-=5;audio.playTone(220,100);if(player.health<=0){currentState=STATE.GAMEOVER;}}if(tile==='chest'){player.score+=10;map[newY][newX]='floor';audio.playTone(880,50);}}}
}

// ======== RENDER ========
function drawMap(){for(let r=0;r<GRID_ROWS;r++)for(let c=0;c<GRID_COLS;c++){let tile=map[r][c];let x=c*ROOM_SIZE;let y=r*ROOM_SIZE;switch(tile){case 'floor':ctx.fillStyle='#444';break;case 'wall':ctx.fillStyle='#888';break;case 'trap':ctx.fillStyle='#f00';break;case 'chest':ctx.fillStyle='#ff0';break;default:ctx.fillStyle='#444';}ctx.fillRect(x,y,ROOM_SIZE,ROOM_SIZE);}}

function drawHUD(){ctx.fillStyle='#fff';ctx.font='16px monospace';ctx.fillText('Health: '+player.health,10,20);ctx.fillText('Score: '+player.score,10,40);ctx.fillText('Time: '+(Math.floor((Date.now()-startTime)/1000))+'s',10,60);ctx.fillText('High: '+highScore,10,80);}

function drawMenu(){ctx.fillStyle='#fff';ctx.font='48px monospace';ctx.textAlign='center';ctx.fillText('Room Shuffle',canvas.width/2,canvas.height/2-50);ctx.font='24px monospace';ctx.fillText('Press ENTER to Start',canvas.width/2,canvas.height/2+10);}

function drawGameOver(){ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.fillStyle='#fff';ctx.font='48px monospace';ctx.textAlign='center';ctx.fillText('Game Over',canvas.width/2,canvas.height/2-30);ctx.font='24px monospace';ctx.fillText('Score: '+player.score,canvas.width/2,canvas.height/2+10);ctx.fillText('Press ENTER to Restart',canvas.width/2,canvas.height/2+40);}

// ======== HIGH SCORE ========
let highScore=localStorage.getItem('roomShuffleHighScore')||0;
function updateHighScore(){if(player.score>highScore){highScore=player.score;localStorage.setItem('roomShuffleHighScore',highScore);}}

// ======== MAIN LOOP ========
let lastTime=performance.now();let startTime=0;
function mainLoop(now){let dt=(now-lastTime)/1000;lastTime=now;ctx.save();ctx.scale(scale,scale);ctx.clearRect(0,0,CANVAS_ORIG_W,CANVAS_ORIG_H);
if(currentState===STATE.MENU){drawMenu();if(INPUT_KEYS.action){currentState=STATE.PLAYING;startTime=now;player.health=MAX_HEALTH;player.score=0;generateMap();}}else if(currentState===STATE.PLAYING){handleInput();player.update(dt);drawMap();player.draw();drawHUD();}else if(currentState===STATE.GAMEOVER){drawGameOver();if(INPUT_KEYS.action){currentState=STATE.MENU;}}ctx.restore();requestAnimationFrame(mainLoop);}
requestAnimationFrame(mainLoop);

// ======== KEY FOR MENU START ========
window.addEventListener('keydown',e=>{if(e.key==='Enter'){INPUT_KEYS.action=1;}});
window.addEventListener('keyup',e=>{if(e.key==='Enter'){INPUT_KEYS.action=0;}});
