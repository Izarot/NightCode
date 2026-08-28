import { GRAV,JUMP,VMAX_X,A_H,A_D,A_HAIR,VMAX_Y,FRICTION } from '../engine/constants.js';
import { clamp,aabb } from '../engine/utils.js';
import { sfx } from '../engine/audio.js';

export class Player{
  constructor(x,y){ this.x=x; this.y=y; this.w=32; this.h=48; this.vx=0; this.vy=0; this.onGround=false; this.inventory=[]; this.active=[0,0,0]; this.throwing=false; this.throwT=0; this.aim=0; this.facing=1; }
  update(dt, lvl, input){
    const ax=input.axis();
    const a = (ax!==0) ? (this.onGround?A_H:A_HAIR) : 0;
    this.vx += a*ax*dt;
    if(ax===0){ const s=Math.sign(this.vx); this.vx -= s*A_D*dt; if(Math.sign(this.vx)!==s) this.vx=0; }
    this.vx = clamp(this.vx, -VMAX_X, VMAX_X);
    if(this.onGround) this.vx *= Math.pow(1-FRICTION, dt*10);
    this.vy += GRAV*dt; this.vy = clamp(this.vy, -999, VMAX_Y);
    if(input.jumpDown() && this.onGround){ this.vy=JUMP; sfx.jump(); this.onGround=false; }
    if(ax!==0) this.facing=ax;
    this.move(dt, lvl);
    // collect droplets
    lvl.droplets.forEach(d=>{ if(!d.dead && aabb(this,d)){ this.pickup(d); }});
    // palettes
    lvl.palettes.forEach(p=>{ if(aabb(this,p)){ this.mixPalette(p); }});
    // gates
    lvl.gates.forEach(g=>{
      if(aabb(this,g)){ const m=this.match(g.c); if(m) g.open=true; if(!g.open){ this.x-=this.vx*dt; this.vx=0; } }
    });
    // hazards
    lvl.hazards.forEach(h=>{ if(aabb(this,h)){ const m=this.match(h.c); if(!m){ sfx.die(); lvl.respawn(); }}});
    // platforms
    lvl.platforms.forEach(p=>{ if(p.active && aabb(this,p) && this.onGround && this.vy>=0) this.y=p.y-this.h; });
    // exit
    if(lvl.exit && aabb(this,lvl.exit)){ lvl.win(); }
    // throw
    if(input.throwHeld()){ this.throwing=true; this.throwT+=dt; this.aim=this.facing; }
    else if(this.throwing){ this.throwDroplet(lvl); this.throwing=false; this.throwT=0; }
  }
  throwDroplet(lvl){
    if(this.inventory.length===0) return;
    const d=this.inventory.pop(); d.dead=false; d.x=this.x+this.w/2; d.y=this.y+10; d.vx=this.facing*420; d.vy=-260-this.throwT*40; d.dynamic=true; lvl.droplets.push(d); this.recompute(); sfx.throw();
  }
  pickup(d){
    if(d.dynamic) return;
    if(this.inventory.length>=3){ sfx.throw(); d.vx=-this.facing*200; d.vy=-150; d.dynamic=true; return; }
    this.inventory.push(d); d.dead=true; this.recompute(); sfx.pick();
  }
  recompute(){ const c=[0,0,0]; this.inventory.forEach(d=>{ c[0]+=d.c[0]; c[1]+=d.c[1]; c[2]+=d.c[2]; }); this.active=[Math.min(255,c[0]),Math.min(255,c[1]),Math.min(255,c[2])]; }
  mixPalette(p){
    if(this.inventory.length===0) return;
    if(!p.c) p.c=[0,0,0];
    this.inventory.forEach(d=>{ p.c[0]=Math.min(255,p.c[0]+d.c[0]); p.c[1]=Math.min(255,p.c[1]+d.c[1]); p.c[2]=Math.min(255,p.c[2]+d.c[2]); });
    this.inventory=[]; this.active=[0,0,0]; sfx.mix();
  }
  match(c){ if(!c) return false; const d=Math.hypot(this.active[0]-c[0],this.active[1]-c[1],this.active[2]-c[2]); return d<=30; }
  move(dt, lvl){
    this.x += this.vx*dt; lvl.solids.forEach(s=>{ if(aabb(this,s)){ if(this.vx>0) this.x=s.x-this.w; else this.x=s.x+s.w; this.vx=0; }});
    this.y += this.vy*dt; this.onGround=false;
    lvl.solids.forEach(s=>{ if(aabb(this,s)){ if(this.vy>0){ this.y=s.y-this.h; this.vy=0; this.onGround=true; } else { this.y=s.y+s.h; this.vy=0; }}});
    if(this.y>H+200) lvl.respawn();
  }
  draw(ctx){
    // body
    const c=this.active;
    ctx.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;
    ctx.fillRect(this.x,this.y+12,this.w,this.h-12);
    // head
    ctx.fillStyle='#eaeaff';
    ctx.beginPath(); ctx.arc(this.x+this.w/2,this.y+14,14,0,Math.PI*2); ctx.fill();
    // antenna
    ctx.strokeStyle=`rgb(${c[0]},${c[1]},${c[2]})`;
    ctx.lineWidth=3;
    ctx.beginPath(); ctx.moveTo(this.x+this.w/2,this.y+4); ctx.lineTo(this.x+this.w/2,this.y-10); ctx.stroke();
    ctx.fillStyle=`rgb(${c[0]},${c[1]},${c[2]})`;
    const pulse=0.5+0.5*Math.sin(performance.now()/200);
    ctx.globalAlpha=0.5+0.5*pulse;
    ctx.beginPath(); ctx.arc(this.x+this.w/2,this.y-12,4+pulse*2,0,Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    // eyes
    ctx.fillStyle='#111';
    const ex=this.x+this.w/2+this.facing*4;
    ctx.fillRect(ex-4,this.y+12,3,5); ctx.fillRect(ex+2,this.y+12,3,5);
  }
}
