import { Level } from './level/level.js';
import { LEVELS } from './level/levels.js';
import { Player } from './player/player.js';
import { SoundFX } from './core/audio.js';
import { aabb } from './core/physics.js';
import { drawHUD, drawButton, fmtTime } from './ui/hud.js';
const W=1280,H=720;
class Game{
constructor(){
this.canvas=document.getElementById('game');this.ctx=this.canvas.getContext('2d');
this.state='menu';this.keys={};this.mouse={x:0,y:0};this.sound=new SoundFX();
this.levelIndex=0;this.level=null;this.player=null;this.particles=[];this.shake=0;
this.elapsed=0;this.last=0;this.deadTimer=0;this.gears=0;this.totalGears=0;this.cam={x:0,y:0};
this.high=parseFloat(localStorage.getItem('coil_highscore')||'0');
this.bestGears=parseInt(localStorage.getItem('coil_best_gears')||'0');
this.soundOn=localStorage.getItem('coil_sound')!=='0';this.sound.enabled=this.soundOn;
this.resize();window.addEventListener('resize',()=>this.resize());
this.bind();
}
resize(){const r=this.canvas.getBoundingClientRect();this.canvas.width=Math.max(320,r.width);this.canvas.height=Math.max(180,r.height);this.scale=Math.min(this.canvas.width/W,this.canvas.height/H);this.ox=(this.canvas.width-W*this.scale)/2;this.oy=(this.canvas.height-H*this.scale)/2;}
bind(){
window.addEventListener('keydown',e=>{this.keys[e.code]=true;if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();this.sound.init();
if(e.code==='Enter'||e.code==='Space'){if(this.state==='menu')this.startGame();else if(this.state==='complete')this.nextLevel();}
if(e.code==='Escape'&&(this.state==='playing'||this.state==='paused'))this.state=this.state==='playing'?'paused':'playing';
if(e.code==='KeyR'&&this.state==='playing')this.loadLevel(this.levelIndex);
if(e.code==='KeyM'){this.soundOn=!this.soundOn;this.sound.enabled=this.soundOn;localStorage.setItem('coil_sound',this.soundOn?'1':'0');}
});
window.addEventListener('keyup',e=>{this.keys[e.code]=false;});
this.canvas.addEventListener('pointermove',e=>{const r=this.canvas.getBoundingClientRect();this.mouse.x=(e.clientX-r.left-this.ox/1)/this.scale* (r.width/this.canvas.width) * (this.canvas.width/r.width);this.mouse.x=((e.clientX-r.left)-this.ox)/this.scale;this.mouse.y=((e.clientY-r.top)-this.oy)/this.scale;});
this.canvas.addEventListener('pointerdown',e=>{this.sound.init();const r=this.canvas.getBoundingClientRect();const mx=((e.clientX-r.left)-this.ox)/this.scale,my=((e.clientY-r.top)-this.oy)/this.scale;this.handleClick(mx,my);});
const bindT=(id,code)=>{const el=document.getElementById(id);if(!el)return;el.addEventListener('pointerdown',e=>{e.preventDefault();this.keys[code]=true;this.sound.init();});el.addEventListener('pointerup',()=>{this.keys[code]=false;});el.addEventListener('pointerleave',()=>{this.keys[code]=false;});};
bindT('tL','ArrowLeft');bindT('tR','ArrowRight');bindT('tC','Space');
}
handleClick(x,y){const inB=(bx,by,bw,bh)=>x>bx&&x<bx+bw&&y>by&&y<by+bh;
if(this.state==='menu'){if(inB(490,420,300,60))this.startGame();if(inB(490,500,300,50)){this.soundOn=!this.soundOn;this.sound.enabled=this.soundOn;localStorage.setItem('coil_sound',this.soundOn?'1':'0');}}
else if(this.state==='paused'){if(inB(490,360,300,60))this.state='playing';if(inB(490,440,300,60))this.state='menu';}
else if(this.state==='complete'){if(inB(490,500,300,60))this.nextLevel();if(inB(490,580,300,50))this.state='menu';}
}
startGame(){this.levelIndex=0;this.elapsed=0;this.gears=0;this.loadLevel(0);this.state='playing';}
nextLevel(){this.levelIndex=(this.levelIndex+1)%LEVELS.length;this.elapsed=0;this.gears=0;this.loadLevel(this.levelIndex);this.state='playing';}
loadLevel(i){this.level=new Level(LEVELS[i]);this.player=new Player(this.level.spawn.x,this.level.spawn.y);this.particles=[];this.totalGears=this.level.gears.length;this.gears=0;this.elapsed=0;}
start(){this.loadLevel(0);requestAnimationFrame(t=>this.loop(t));}
loop(t){requestAnimationFrame(tt=>this.loop(tt));const dt=Math.min(32,t-(this.last||t));this.last=t;if(this.state==='playing'){this.elapsed+=dt/1000;this.update();}else if(this.state==='dead'){this.deadTimer-=dt/1000;if(this.deadTimer<=0){this.respawn();}}this.draw();}
respawn(){this.player.x=this.level.spawn.x;this.player.y=this.level.spawn.y;this.player.vx=0;this.player.vy=0;this.player.charge=0;this.state='playing';}
die(){if(this.state!=='playing')return;this.state='dead';this.deadTimer=1.2;this.sound.death();this.burst(this.player.x+16,this.player.y+24,'#ff3131',24);this.shake=10;}
burst(x,y,color,n){for(let i=0;i<n;i++)this.particles.push({x,y,vx:(Math.random()-0.5)*8,vy:(Math.random()-0.5)*8,life:30+Math.random()*20,color,size:2+Math.random()*4});}
update(){
const p=this.player,k=this.keys;
const left=k['KeyA']||k['ArrowLeft'],right=k['KeyD']||k['ArrowRight'];
const chargeKey=k['Space']||k['KeyS']||k['ArrowDown'];
this.level.update(performance.now()/1000);
const solids=[...this.level.platforms,...this.level.moving];
// horizontal input
if(p.grounded){p.vx*=0.85;if(left)p.vx=-6;if(right)p.vx=6;if(!left&&!right)p.vx*=0.85;}
else{p.vx*=0.98;if(left)p.vx=Math.max(-6,p.vx-0.6);if(right)p.vx=Math.min(6,p.vx+0.6);}
// charge / launch
if(p.grounded&&chargeKey){p.state='compressing';p.charge=Math.min(100,p.charge+5);p.vx=0;}
else if(p.state==='compressing'&&!chargeKey&&p.charge>0){const f=p.charge*0.4;p.vy=-f;p.state='launching';p.bounces++;this.sound.launch(p.charge);this.burst(p.x+16,p.y+48,'#00f2ff',Math.floor(p.charge/4));if(left)p.vx=-f*0.3;if(right)p.vx=f*0.3;p.charge=0;p.grounded=false;}
else if(p.grounded)p.state='idle';
const prevVy=p.vy;
p.vy+=0.8;if(p.vy>18)p.vy=18;
// move X
p.x+=p.vx;for(const s of solids){if(aabb(p,s)){if(p.vx>0)p.x=s.x-p.w;else if(p.vx<0)p.x=s.x+s.w;p.vx=0;}}
// move Y
p.y+=p.vy;p.grounded=false;
for(const s of solids){if(aabb(p,s)){if(p.vy>0){p.y=s.y-p.h;p.grounded=true;if(prevVy>10){p.squash=1;this.shake=Math.min(12,prevVy*0.5);this.sound.land();this.burst(p.x+16,p.y+48,'#c0c0c0',10);if(prevVy>16){p.vy=-prevVy*0.1;p.grounded=false;}}else p.vy=0;}else if(p.vy<0){p.y=s.y+s.h;p.vy=0;}}}
if(p.grounded&&p.state!=='compressing')p.charge=0;
if(p.squash>0)p.squash-=0.08;
// moving platform carry
for(const m of this.level.moving){if(p.grounded&&Math.abs((p.y+p.h)-m.y)<2&&p.x+p.w>m.x&&p.x<m.x+m.w)p.x+=m.dx;}
// spikes
for(const s of this.level.spikes){if(aabb({x:p.x+6,y:p.y+8,w:p.w-12,h:p.h-8},s))return this.die();}
if(p.y>this.level.height+200)return this.die();
// gears
for(const g of this.level.gears){if(!g.taken&&Math.hypot(p.x+16-g.x,p.y+24-g.y)<36){g.taken=true;this.gears++;this.sound.gear();this.burst(g.x,g.y,'#ffe600',14);}}
// anchor
if(this.level.anchor&&aabb(p,this.level.anchor)){this.state='complete';this.sound.win();if(!this.high||this.elapsed<this.high){this.high=this.elapsed;localStorage.setItem('coil_highscore',String(this.high));}if(this.gears>this.bestGears){this.bestGears=this.gears;localStorage.setItem('coil_best_gears',String(this.bestGears));}}
// particles
for(const pt of this.particles){pt.x+=pt.vx;pt.y+=pt.vy;pt.vy+=0.2;pt.life--;}
this.particles=this.particles.filter(pt=>pt.life>0);
// camera
this.cam.x=Math.max(0,Math.min(this.level.width-W,p.x-W/2));this.cam.y=Math.max(0,Math.min(this.level.height-H,p.y-H/2));
}
draw(){
const ctx=this.ctx;ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0b0b18';ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
ctx.setTransform(this.scale,0,0,this.scale,this.ox,this.oy);
ctx.save();if(this.shake>0){ctx.translate((Math.random()-0.5)*this.shake,(Math.random()-0.5)*this.shake);this.shake*=0.85;if(this.shake<0.5)this.shake=0;}
// bg gradient + grid
const grd=ctx.createLinearGradient(0,0,0,H);grd.addColorStop(0,'#2a1a4a');grd.addColorStop(0.5,'#1a1a2e');grd.addColorStop(1,'#0f2a3a');ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
ctx.strokeStyle='#ffffff11';for(let x=0;x<W;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,H);ctx.stroke();}
if(this.level&&this.player){ctx.save();ctx.translate(-this.cam.x,-this.cam.y);this.level.draw(ctx,performance.now()/1000);this.drawPlayer(ctx);for(const pt of this.particles){ctx.globalAlpha=pt.life/40;ctx.fillStyle=pt.color;ctx.fillRect(pt.x,pt.y,pt.size,pt.size);}ctx.globalAlpha=1;ctx.restore();}
ctx.restore();
drawHUD(ctx,this);
if(this.state==='menu')this.drawMenu(ctx);
if(this.state==='paused')this.drawPaused(ctx);
if(this.state==='dead'){ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);ctx.fillStyle='#ff3131';ctx.font='bold 48px monospace';ctx.textAlign='center';ctx.fillText('REBOOTING...',W/2,H/2);ctx.fillStyle='#fff';ctx.font='20px monospace';ctx.fillText(Math.ceil(this.deadTimer)+' ',W/2,H/2+40);}
if(this.state==='complete')this.drawComplete(ctx);
}
drawPlayer(ctx){const p=this.player;const scaleY=(1-p.charge/200)*(1-p.squash*0.4);const scaleX=1+p.squash*0.3;ctx.save();ctx.translate(p.x+16,p.y+48);ctx.scale(scaleX,scaleY);
// trail when launching
if(p.state==='launching'&&p.vy<-5){ctx.globalAlpha=0.3;ctx.fillStyle='#00f2ff';ctx.fillRect(-10,10,20,30);ctx.globalAlpha=1;}
ctx.strokeStyle=p.state==='compressing'?'#ff2ec4':'#00f2ff';ctx.lineWidth=4;ctx.beginPath();for(let i=0;i<=4;i++){const y=-i*10;const x=(i%2===0?-14:14);if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.stroke();
ctx.fillStyle='#c0c0c0';ctx.fillRect(-16,-48,32,8);ctx.fillStyle='#00f2ff';ctx.beginPath();ctx.arc(0,-44,7,0,7);ctx.fill();ctx.fillStyle='#000';ctx.beginPath();ctx.arc(2,-44,3,0,7);ctx.fill();ctx.restore();
// charge arc
if(p.charge>0){ctx.strokeStyle='#ff2ec4';ctx.lineWidth=4;ctx.beginPath();ctx.arc(p.x+16,p.y+24,28,-Math.PI/2,-Math.PI/2+Math.PI*2*(p.charge/100));ctx.stroke();}}
drawMenu(ctx){ctx.fillStyle='rgba(10,10,25,0.85)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='#00f2ff';ctx.font='bold 72px monospace';ctx.shadowColor='#00f2ff';ctx.shadowBlur=20;ctx.fillText('COIL',W/2,180);ctx.shadowBlur=0;ctx.fillStyle='#ff2ec4';ctx.font='bold 28px monospace';ctx.fillText('KINETIC ASCENT',W/2,220);ctx.fillStyle='#fff';ctx.font='18px monospace';ctx.fillText('Hold SPACE to compress - release to launch. A/D move. Reach the Anchor!',W/2,270);ctx.fillText('Collect gears. Avoid spikes. R restart - ESC pause - M sound',W/2,300);if(this.high)ctx.fillText('HIGH SCORE: '+fmtTime(this.high)+'  BEST GEARS: '+this.bestGears,W/2,340);drawButton(ctx,490,420,300,60,'▶ START',this.mouse);drawButton(ctx,490,500,300,50,'SOUND: '+(this.soundOn?'ON':'OFF'),this.mouse);ctx.font='14px monospace';ctx.fillStyle='#aaa';ctx.fillText('Press ENTER to start',W/2,620);}
drawPaused(ctx){ctx.fillStyle='rgba(0,0,0,0.7)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='#fff';ctx.font='bold 48px monospace';ctx.fillText('PAUSED',W/2,300);drawButton(ctx,490,360,300,60,'RESUME',this.mouse);drawButton(ctx,490,440,300,60,'MAIN MENU',this.mouse);}
drawComplete(ctx){ctx.fillStyle='rgba(10,10,25,0.9)';ctx.fillRect(0,0,W,H);ctx.textAlign='center';ctx.fillStyle='#ffe600';ctx.font='bold 56px monospace';ctx.fillText('LEVEL COMPLETE!',W/2,200);ctx.fillStyle='#fff';ctx.font='24px monospace';ctx.fillText('Time: '+fmtTime(this.elapsed),W/2,280);ctx.fillText('Gears: '+this.gears+'/'+this.totalGears,W/2,320);ctx.fillText('Bounces: '+this.player.bounces,W/2,360);ctx.fillText('High Score: '+fmtTime(this.high),W/2,400);ctx.fillText('Best Gears: '+this.bestGears,W/2,440);drawButton(ctx,490,500,300,60,'NEXT LEVEL ▶',this.mouse);drawButton(ctx,490,580,300,50,'MAIN MENU',this.mouse);}
}
export const game=new Game();
