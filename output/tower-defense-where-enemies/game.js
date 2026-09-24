// Game: Pathfinding, Towers, Enemies, Economy
const GRID=20;
const towers=[];
const enemies=[];
const orbs=[];
let energy=0;
let wave=1;
let lives=3;
let selected='floor';
function astar(start,end){const open=[];const closed=[];open.push({x:start.x,y:start.y,g:0,h:Math.hypot(end.x-start.x,end.y-start.y)});while(open.length){const cur=open.shift();if(cur.x===end.x&&cur.y===end.y)return cur;closed.push(cur);for(let dx=-1;dx<=1;dx++)for(let dy=-1;dy<=1;dy++){if(dx===0&&dy===0)continue;const nx=cur.x+dx,ny=cur.y+dy;if(!closed.find(c=>c.x===nx&&c.y===ny)){const g=cur.g+Math.hypot(dx,dy);const h=Math.hypot(end.x-nx,end.y-ny);open.push({x:nx,y:ny,g,h:f:g+h});}}open.sort((a,b)=>a.f-b.f);return null;}
function spawnEnemy(){enemies.push({x:0,y:Math.random()*600,hp:100,maxHp:100,surface:'floor',speed:60});}
function updateEnemies(dt){for(const e of enemies){e.x+=e.speed*dt;if(e.x>800){lives--;splice(enemies,e);}}}function dropOrb(x,y){orbs.push({x,y,collected:false});}
