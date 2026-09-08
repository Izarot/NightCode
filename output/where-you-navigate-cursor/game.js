const canvas=document.getElementById('gameCanvas');
const ctx=canvas.getContext('2d');
const menuScreen=document.getElementById('menu-screen');
const pauseScreen=document.getElementById('pause-screen');
const gameoverScreen=document.getElementById('gameover-screen');
const victoryScreen=document.getElementById('victory-screen');
const startBtn=document.getElementById('start-btn');
const resumeBtn=document.getElementById('resume-btn');
const restartBtn=document.getElementById('restart-btn');
const quitBtn=document.getElementById('quit-btn');
const retryBtn=document.getElementById('retry-btn');
const menuBtn=document.getElementById('menu-btn');
const nextLevelBtn=document.getElementById('next-level-btn');
const bestTimeEl=document.getElementById('best-time');
const gameoverText=document.getElementById('gameover-text');
const gameoverReason=document.getElementById('gameover-reason');
const finalTime=document.getElementById('final-time');
const victoryTime=document.getElementById('victory-time');
const victoryLevel=document.getElementById('victory-level');

let W,H,scale;
function resize(){
    W=canvas.width=window.innerWidth;
    H=canvas.height=window.innerHeight;
    scale=Math.min(W,H)/600;
}
resize();
window.addEventListener('resize',resize);

let bestTime=parseFloat(localStorage.getItem('maze_best_time'))||null;
if(bestTime)bestTimeEl.textContent=bestTime.toFixed(2)+'s';

const keys={};
let touchDir={x:0,y:0};
let dashCooldown=0;
let interactCooldown=0;

window.addEventListener('keydown',e=>{keys[e.key]=true;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.key))e.preventDefault();});
window.addEventListener('keyup',e=>{keys[e.key]=false;});

// Touch controls
document.getElementById('btn-up').addEventListener('touchstart',e=>{e.preventDefault();touchDir.y=-1;});
document.getElementById('btn-down').addEventListener('touchstart',e=>{e.preventDefault();touchDir.y=1;});
document.getElementById('btn-left').addEventListener('touchstart',e=>{e.preventDefault();touchDir.x=-1;});
document.getElementById('btn-right').addEventListener('touchstart',e=>{e.preventDefault();touchDir.x=1;});
document.getElementById('btn-up').addEventListener('touchend',e=>{e.preventDefault();touchDir.y=0;});
document.getElementById('btn-down').addEventListener('touchend',e=>{e.preventDefault();touchDir.y=0;});
document.getElementById('btn-left').addEventListener('touchend',e=>{e.preventDefault();touchDir.x=0;});
document.getElementById('btn-right').addEventListener('touchend',e=>{e.preventDefault();touchDir.x=0;});
document.getElementById('btn-dash').addEventListener('touchstart',e=>{e.preventDefault();doDash();});
document.getElementById('btn-interact').addEventListener('touchstart',e=>{e.preventDefault();doInteract();});

function doDash(){
    if(dashCooldown<=0&&player.dashing===false){
        player.dashing=true;
        player.dashTimer=15;
        dashCooldown=60;
    }
}
function doInteract(){
    if(interactCooldown<=0){
        interactCooldown=30;
        // Try to open a window
        for(let w of windows){
            let dx=w.x-player.x,dy=w.y-player.y;
            let dist=Math.sqrt(dx*dx+dy*dy);
            if(dist<80&&!w.open){
                w.open=true;
                w.openTimer=120;
                particles.push(...createWindowOpenParticles(w.x,w.y));
                return;
            }
        }
    }
}

// Game state
let player,windows,particles,goal,level,gameState,timer,gameLoop;
let mazeData=[];

const LEVELS=[
    {size:5,windows:8,goal:'exit',desc:'Find the exit!'},
    {size:7,windows:14,goal:'exit',desc:'The windows are closing!'},
    {size:9,windows:20,goal:'exit',desc:'Navigate carefully!'},
    {size:11,windows:28,goal:'exit',desc:'The final challenge!'}
];

function generateMaze(size,windowCount){
    // Simple maze-like window placement
    let m=[];
    for(let i=0;i<size;i++){
        m[i]=[];
        for(let j=0;j<size;j++){
            m[i][j]=0;
        }
    }
    // Place walls in a pattern
    for(let i=0;i<size;i++){
        for(let j=0;j<size;j++){
            if((i+j)%3===0&&(i!==0||j!==0)&&(i!==size-1||j!==size-1)){
                if(Math.random()<0.4)m[i][j]=1;
            }
        }
    }
    // Ensure start and end are clear
    m[0][0]=0;
    m[size-1][size-1]=0;
    // BFS to ensure path exists
    if(!hasPath(m,size)){
        // Clear a path
        for(let i=0;i<size;i++){m[i][0]=0;m[0][i]=0;}
        for(let i=0;i<size;i++){m[i][size-1]=0;m[size-1][i]=0;}
    }
    return m;
}

function hasPath(m,size){
    let visited=Array.from({length:size},()=>Array(size).fill(false));
    let queue=[[0,0]];
    visited[0][0]=true;
    while(queue.length){
        let[x,y]=queue.shift();
        if(x===size-1&&y===size-1)return true;
        for(let[dx,dy]of[[0,1],[0,-1],[1,0],[-1,0]]){
            letnx=x+dx,ny=y+dy;
            if(nx>=0&&nx<size&&ny>=0&&ny<size&&!visited[nx][ny]&&m[nx][ny]===0){
                visited[nx][ny]=true;
                queue.push([nx,ny]);
            }
        }
    }
    return false;
}

function createWindows(m,size,count){
    let wins=[];
    let placed=0;
    let attempts=0;
    while(placed<count&&attempts<500){
        attempts++;
        let x=Math.floor(Math.random()*size);
        let y=Math.floor(Math.random()*size);
        if(m[y][x]===0&&!(x===0&&y===0)&&!(x===size-1&&y===size-1)){
            let exists=wins.find(w=>w.gx===x&&w.gy===y);
            if(!exists){
                wins.push({gx:x,gy:y,open:false,openTimer:0,x:0,y:0,type:Math.random()<0.7?'normal':'locked'});
                placed++;
            }
        }
    }
    return wins;
}

function initLevel(lvl){
    let cfg=LEVELS[lvl];
    let size=cfg.size;
    mazeData=generateMaze(size,cfg.windows);
    let wins=createWindows(mazeData,size,cfg.windows);
    
    let cellW=W/size;
    let cellH=H/size;
    let offsetX=(W-size*cellW)/2;
    let offsetY=(H-size*cellH)/2;
    
    windows=wins.map(w=>({
        ...w,
        x:offsetX+w.gx*cellW+cellW/2,
        y:offsetY+w.gy*cellH+cellH/2,
        w:cellW*0.8,
        h:cellH*0.8
    }));
    
    player={x:offsetX+cellW/2,y:offsetY+cellH/2,r:Math.min(cellW,cellH)*0.3,vx:0,vy:0,speed:3,dashing:false,dashTimer:0,angle:0};
    
    goal={x:offsetX+(size-1)*cellW+cellW/2,y:offsetY+(size-1)*cellH+cellH/2,r:Math.min(cellW,cellH)*0.35};
    
    particles=[];
    level=lvl;
    timer=0;
    gameState='playing';
    dashCooldown=0;
    interactCooldown=0;
}

function createWindowOpenParticles(x,y){
    let pts=[];
    for(let i=0;i<20;i++){
        let angle=Math.random()*Math.PI*2;
        let speed=2+Math.random()*3;
        pts.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:60,maxLife:60,color:'#64ffda',size:2+Math.random()*3});
    }
    return pts;
}

function createTrailParticle(x,y,angle){
    return{x,y,vx:Math.cos(angle)*0.5,vy:Math.sin(angle)*0.5,life:20,maxLife:20,color:'#00f0ff',size:2};
}

function update(){
    if(gameState!=='playing')return;
    timer++;
    
    // Player movement
    let mx=0,my=0;
    if(keys['ArrowLeft']||keys['a']||keys['A'])mx=-1;
    if(keys['ArrowRight']||keys['d']||keys['D'])mx=1;
    if(keys['ArrowUp']||keys['w']||keys['W'])my=-1;
    if(keys['ArrowDown']||keys['s']||keys['S'])my=1;
    
    // Touch direction
    if(touchDir.x!==0||touchDir.y!==0){
        mx=touchDir.x;
        my=touchDir.y;
    }
    
    let len=Math.sqrt(mx*mx+my*my);
    if(len>0){mx/=len;my/=len;}
    
    if(player.dashing){
        player.dashTimer--;
        if(player.dashTimer<=0)player.dashing=false;
        player.vx=mx*8;
        player.vy=my*8;
    }else{
        player.vx+=mx*0.4;
        player.vy+=my*0.4;
        player.vx*=0.85;
        player.vy*=0.85;
        if(Math.abs(player.vx)<0.1)player.vx=0;
        if(Math.abs(player.vy)<0.1)player.vy=0;
    }
    
    player.x+=player.vx;
    player.y+=player.vy;
    
    if(mx!==0||my!==0)player.angle=Math.atan2(my,mx);
    
    // Trail particles
    if((mx!==0||my!==0)&&Math.random()<0.5){
        particles.push(createTrailParticle(player.x,player.y,player.angle));
    }
    
    // Dash cooldown
    if(dashCooldown>0)dashCooldown--;
    if(interactCooldown>0)interactCooldown--;
    
    // Window open timers
    for(let w of windows){
        if(w.open&&w.openTimer>0){
            w.openTimer--;
            if(w.openTimer<=0)w.open=false;
        }
    }
    
    // Collision with windows
    for(let w of windows){
        if(w.open)continue;
        let dx=player.x-w.x;
        let dy=player.y-w.y;
        let dist=Math.sqrt(dx*dx+dy*dy);
        let minDist=(w.w/2+w.h/2)*0.7+player.r;
        if(dist<minDist&&dist>0){
            let nx=dx/dist;
            let ny=dy/dist;
            player.x=w.x+nx*minDist;
            player.y=w.y+ny*minDist;
            player.vx*=0.3;
            player.vy*=0.3;
        }
    }
    
    // Collision with goal
    let gdx=player.x-goal.x;
    let gdy=player.y-goal.y;
    let gdist=Math.sqrt(gdx*gdx+gdy*gdy);
    if(gdist<player.r+goal.r){
        // Victory!
        let time=timer/60;
        if(bestTime===null||time<bestTime){
            bestTime=time;
            localStorage.setItem('maze_best_time',bestTime.toString());
        }
        gameState='victory';
        victoryTime.textContent='Time: '+time.toFixed(2)+'s';
        victoryLevel.textContent='Level: '+(level+1)+' / '+LEVELS.length;
        if(level<LEVELS.length-1){
            nextLevelBtn.style.display='inline-block';
        }else{
            nextLevelBtn.textContent='PLAY AGAIN';
            nextLevelBtn.style.display='inline-block';
        }
        victoryScreen.classList.remove('hidden');
        return;
    }
    
    // Boundary
    player.x=Math.max(player.r,Math.min(W-player.r,player.x));
    player.y=Math.max(player.r,Math.min(H-player.r,player.y));
    
    // Update particles
    for(let i=particles.length-1;i>=0;i--){
        let p=particles[i];
        p.x+=p.vx;
        p.y+=p.vy;
        p.life--;
        p.vx*=0.98;
        p.vy*=0.98;
        if(p.life<=0)particles.splice(i,1);
    }
    
    // Check if player is stuck (falling off screen or too slow)
    if(player.y>H+50){
        gameState='gameover';
        gameoverText.textContent='GAME OVER';
        gameoverReason.textContent='You fell into the void!';
        finalTime.textContent='Time: '+(timer/60).toFixed(2)+'s';
        gameoverScreen.classList.remove('hidden');
    }
}

function draw(){
    ctx.fillStyle='#050810';
    ctx.fillRect(0,0,W,H);
    
    // Draw grid background
    let size=mazeData.length;
    if(size>0){
        let cellW=W/size;
        let cellH=H/size;
        let offsetX=(W-size*cellW)/2;
        let offsetY=(H-size*cellH)/2;
        
        for(let y=0;y<size;y++){
            for(let x=0;x<size;x++){
                let px=offsetX+x*cellW;
                let py=offsetY+y*cellH;
                if(mazeData[y][x]===1){
                    ctx.fillStyle='rgba(0,240,255,0.05)';
                    ctx.fillRect(px,py,cellW,cellH);
                    ctx.strokeStyle='rgba(0,240,255,0.15)';
                    ctx.lineWidth=1;
                    ctx.strokeRect(px,py,cellW,cellH);
                }else{
                    ctx.strokeStyle='rgba(0,240,255,0.08)';
                    ctx.lineWidth=1;
                    ctx.strokeRect(px,py,cellW,cellH);
                }
            }
        }
    }
    
    // Draw goal
    let glow=Math.sin(timer*0.1)*0.3+0.7;
    ctx.save();
    ctx.shadowColor='#64ffda';
    ctx.shadowBlur=20*glow;
    ctx.fillStyle=`rgba(100,255,218,${0.5+glow*0.5})`;
    ctx.beginPath();
    ctx.arc(goal.x,goal.y,goal.r,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle='#64ffda';
    ctx.font=`${Math.max(12,16*scale)}px Courier New`;
    ctx.textAlign='center';
    ctx.textBaseline='middle';
    ctx.fillText('EXIT',goal.x,goal.y);
    
    // Draw windows
    for(let w of windows){
        let wx=w.x-w.w/2;
        let wy=w.y-w.h/2;
        if(w.open){
            ctx.fillStyle='rgba(100,255,218,0.15)';
            ctx.strokeStyle='rgba(100,255,218,0.6)';
        }else if(w.type==='locked'){
            ctx.fillStyle='rgba(255,0,102,0.1)';
            ctx.strokeStyle='rgba(255,0,102,0.5)';
        }else{
            ctx.fillStyle='rgba(0,240,255,0.1)';
            ctx.strokeStyle='rgba(0,240,255,0.5)';
        }
        ctx.lineWidth=2;
        ctx.strokeRect(wx,wy,w.w,w.h);
        ctx.fillRect(wx,wy,w.w,w.h);
        
        if(!w.open){
            ctx.fillStyle=w.type==='locked'?'#ff0066':'#00f0ff';
            ctx.font=`${Math.max(10,12*scale)}px Courier New`;
            ctx.textAlign='center';
            ctx.textBaseline='middle';
            ctx.fillText(w.type==='locked'?'🔒':'🪟',w.x,w.y);
        }
    }
    
    // Draw player
    ctx.save();
    if(player.dashing){
        ctx.shadowColor='#ff0066';
        ctx.shadowBlur=25;
    }else{
        ctx.shadowColor='#00f0ff';
        ctx.shadowBlur=15;
    }
    ctx.fillStyle=player.dashing?'#ff0066':'#00f0ff';
    ctx.beginPath();
    ctx.arc(player.x,player.y,player.r,0,Math.PI*2);
    ctx.fill();
    ctx.restore();
    
    // Player direction indicator
    ctx.fillStyle=player.dashing?'#ff0066':'#00f0ff';
    ctx.beginPath();
    ctx.arc(player.x+Math.cos(player.angle)*player.r*0.8,player.y+Math.sin(player.angle)*player.r*0.8,player.r*0.3,0,Math.PI*2);
    ctx.fill();
    
    // Draw particles
    for(let p of particles){
        let alpha=p.life/p.maxLife;
        ctx.globalAlpha=alpha;
        ctx.fillStyle=p.color;
        ctx.beginPath();
        ctx.arc(p.x,p.y,p.size*alpha,0,Math.PI*2);
        ctx.fill();
    }
    ctx.globalAlpha=1;
    
    // HUD
    ctx.fillStyle='#00f0ff';
    ctx.font=`${Math.max(14,18*scale)}px Courier New`;
    ctx.textAlign='left';
    ctx.textBaseline='top';
    let time=(timer/60).toFixed(2);
    ctx.fillText('Time: '+time,10,10);
    ctx.fillText('Level: '+(level+1)+'/'+LEVELS.length,10,10+20*scale);
    ctx.fillText('Windows: '+windows.filter(w=>w.open).length+'/'+windows.length,10,10+40*scale);
    
    if(dashCooldown>0){
        ctx.fillStyle='rgba(255,0,102,0.7)';
        ctx.fillText('DASH: '+Math.ceil(dashCooldown/60)+'s',10,10+60*scale);
    }
}

function gameLoopFn(){
    update();
    draw();
    if(gameState==='playing'){
        requestAnimationFrame(gameLoopFn);
    }
}

function startGame(){
    menuScreen.classList.add('hidden');
    initLevel(0);
    gameLoopFn();
}

function pauseGame(){
    gameState='paused';
    pauseScreen.classList.remove('hidden');
}

function resumeGame(){
    gameState='playing';
    pauseScreen.classList.add('hidden');
    gameLoopFn();
}

function restartGame(){
    pauseScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    victoryScreen.classList.add('hidden');
    initLevel(level);
    gameLoopFn();
}

function quitToMenu(){
    gameState='menu';
    pauseScreen.classList.add('hidden');
    gameoverScreen.classList.add('hidden');
    victoryScreen.classList.add('hidden');
    menuScreen.classList.remove('hidden');
    if(bestTime)bestTimeEl.textContent=bestTime.toFixed(2)+'s';
}

function nextLevel(){
    victoryScreen.classList.add('hidden');
    if(level<LEVELS.length-1){
        initLevel(level+1);
        gameLoopFn();
    }else{
        quitToMenu();
    }
}

// Button listeners
startBtn.addEventListener('click',startGame);
resumeBtn.addEventListener('click',resumeGame);
restartBtn.addEventListener('click',restartGame);
quitBtn.addEventListener('click',quitToMenu);
retryBtn.addEventListener('click',restartGame);
menuBtn.addEventListener('click',quitToMenu);
nextLevelBtn.addEventListener('click',nextLevel);

// Pause on tab
window.addEventListener('blur',()=>{
    if(gameState==='playing')pauseGame();
});

// Initial draw
ctx.fillStyle='#050810';
ctx.fillRect(0,0,W,H);
ctx.fillStyle='#00f0ff';
ctx.font='30px Courier New';
ctx.textAlign='center';
ctx.textBaseline='middle';
ctx.fillText('🪟 WINDOW MAZE NAVIGATOR 🪟',W/2,H/2);
</script>
}