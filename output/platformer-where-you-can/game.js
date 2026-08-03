const canvas=document.getElementById('gameCanvas'),ctx=canvas.getContext('2d');
const gauge=document.getElementById('gauge');
const timerEl=document.getElementById('timer');
const highscoreEl=document.getElementById('highscore');
let width=1280,height=720;function resize(){width=window.innerWidth;height=width*720/1280;canvas.width=width;canvas.height=height;canvas.style.width='100%';canvas.style.height='auto';}
window.addEventListener('resize',resize);resize();
const keys={};window.addEventListener('keydown',e=>keys[e.key]=true);window.addEventListener('keyup',e=>keys[e.key]=false);
const player={x:100,y:100,w:40,h:60,vx:0,vy:0,gravity:0.5,grounded:false,rev:false,energy:3,cd:0};
const gravity=()=>{player.vy+=player.gravity; if(player.vy>12)player.vy=12; if(player.vy<-12)player.vy=-12;}
const move=()=>{if(keys['a']||keys['ArrowLeft'])player.vx-=0.8; if(keys['d']||keys['ArrowRight'])player.vx+=0.8; if(!keys['a']&&!keys['ArrowLeft']&&player.vx>0)player.vx*=0.85; if(!keys['d']&&!keys['ArrowRight']&&player.vx<0)player.vx*=0.85; if(player.vx>6)player.vx=6; if(player.vx<-6)player.vx=-6;}
const jump=()=>{if((keys['w']||keys[' '])&&player.grounded){player.vy=-10;player.grounded=false;}}
const reverse=()=>{if((keys['Shift']||keys['k'])&&player.energy>0&&player.cd<=0){player.gravity*=-1;player.vy*= -0.5;player.rev=!player.rev;player.energy-=1;player.cd=2;}}
const updateEnergy=()=>{if(player.rev){player.energy-=0.016; if(player.energy<=0){player.gravity*=-1;player.rev=false;player.energy=0;}} if(player.cd>0)player.cd-=0.016;}
const drawPlayer=()=>{ctx.save();ctx.translate(player.x+player.w/2,player.y+player.h/2);if(player.rev)ctx.scale(1,-1);ctx.fillStyle='#00F2FF';ctx.fillRect(-player.w/2,-player.h/2,player.w,player.h);ctx.restore();}
const drawGauge=()=>{gauge.firstElementChild.style.width=(player.energy*100/3)+'%';}
const updateTimer=()=>{timerEl.textContent=(performance.now()/1000).toFixed(2);}
const highscore=()=>{const hs=localStorage.getItem('highScore')||0; if(performance.now()/1000>hs)localStorage.setItem('highScore',performance.now()/1000); highscoreEl.textContent='High: '+(localStorage.getItem('highScore')||0).toFixed(2);}
const loop=()=>{ctx.clearRect(0,0,width,height);move();jump();reverse();gravity();player.x+=player.vx;player.y+=player.vy; // simple ground
 if(player.y+player.h>=height){player.y=height-player.h;player.vy=0;player.grounded=true;}
 updateEnergy();drawPlayer();drawGauge();updateTimer();highscore();requestAnimationFrame(loop);}
loop();