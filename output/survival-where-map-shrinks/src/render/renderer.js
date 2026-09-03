import {ISLAND_R, BLACK_HOLE_CX, BLACK_HOLE_CY, COLORS} from '../data/constants.js';

export const Renderer = {
  draw(game){
    const ctx = game.ctx;
    const w = game.canvas.width, h = game.canvas.height;
    const world = game.world;
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0,0,w,h);
    if(game.state==='MENU') return;
    const cam = this.camera(game);
    ctx.save();
    ctx.translate(-cam.x, -cam.y);
    this.drawIsland(ctx, world, game.timer);
    this.drawSafeZone(ctx, world);
    this.drawBlackHole(ctx, game.timer);
    for(const l of world.loot) this.drawLoot(ctx, l, game.timer);
    for(const b of world.bullets) this.drawBullet(ctx, b);
    for(const e of world.entities) this.drawEntity(ctx, e, cam);
    for(const p of world.particles) this.drawParticle(ctx, p);
    ctx.restore();
  },
  camera(game){
    const w = game.canvas.width, h = game.canvas.height;
    const p = game.world.player;
    return {x: p.x - w/2, y: p.y - h/2};
  },
  drawIsland(ctx, world, t){
    const r = world.currentRadius();
    const baseR = ISLAND_R;
    ctx.save();
    const grd = ctx.createRadialGradient(BLACK_HOLE_CX, BLACK_HOLE_CY, r*0.1, BLACK_HOLE_CX, BLACK_HOLE_CY, baseR);
    grd.addColorStop(0, '#1a0a2a');
    grd.addColorStop(0.5, '#15103a');
    grd.addColorStop(1, '#0a0a1a');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(BLACK_HOLE_CX, BLACK_HOLE_CY, baseR, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 3;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 12;
    for(let i=0;i<40;i++){
      const a = (i/40)*Math.PI*2;
      const rr = baseR + Math.sin(t*2+i)*4;
      const x = BLACK_HOLE_CX + Math.cos(a)*rr;
      const y = BLACK_HOLE_CY + Math.sin(a)*rr;
      ctx.beginPath();
      ctx.arc(x,y,3,0,Math.PI*2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    for(let i=0;i<60;i++){
      const a = Math.random()*Math.PI*2;
      const rr = Math.random()*baseR*0.9;
      const x = BLACK_HOLE_CX + Math.cos(a)*rr;
      const y = BLACK_HOLE_CY + Math.sin(a)*rr;
      ctx.fillStyle = 'rgba(0,240,255,0.06)';
      ctx.fillRect(x,y,8,8);
    }
    if(r<baseR){
      ctx.save();
      ctx.beginPath();
      ctx.arc(BLACK_HOLE_CX, BLACK_HOLE_CY, r, 0, Math.PI*2);
      ctx.clip();
      ctx.restore();
    }
    ctx.restore();
  },
  drawSafeZone(ctx, world){
    const r = world.currentRadius();
    ctx.save();
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 4;
    ctx.shadowColor = COLORS.cyan;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(BLACK_HOLE_CX, BLACK_HOLE_CY, r, 0, Math.PI*2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.restore();
  },
  drawBlackHole(ctx, t){
    const r = 30 + Math.sin(t*2)*4;
    ctx.save();
    const grd = ctx.createRadialGradient(BLACK_HOLE_CX, BLACK_HOLE_CY, 0, BLACK_HOLE_CX, BLACK_HOLE_CY, r*2);
    grd.addColorStop(0, '#000000');
    grd.addColorStop(0.5, '#1a0030');
    grd.addColorStop(0.8, COLORS.magenta);
    grd.addColorStop(1, 'rgba(255,0,255,0)');
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.arc(BLACK_HOLE_CX, BLACK_HOLE_CY, r*2, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(BLACK_HOLE_CX, BLACK_HOLE_CY, r*0.5, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth =2;
    ctx.shadowColor = COLORS.magenta;
    ctx.shadowBlur = 30;
    for(let i=0;i<3;i++){
      ctx.beginPath();
      ctx.arc(BLACK_HOLE_CX, BLACK_HOLE_CY, r*(1+i*0.4) + Math.sin(t*3+i)*2, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.restore();
  },
  drawLoot(ctx, l, t){
    if(l.taken) return;
    ctx.save();
    const bob = Math.sin(t*3+l.x)*3;
    if(l.type==='weapon'){
      const w = WEAPONS[l.key];
      ctx.fillStyle = w.color;
      ctx.shadowColor = w.color;
      ctx.shadowBlur = 12;
      ctx.fillRect(l.x-10, l.y-4+bob, 20, 8);
      ctx.fillStyle = '#fff';
      ctx.fillRect(l.x+6, l.y-2+bob, 4, 4);
    }else if(l.type==='ammo'){
      ctx.fillStyle = '#ffff00';
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(l.x, l.y+bob, 6, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = '#000';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(l.amt, l.x, l.y+3+bob);
    }else if(l.type==='shield'){
      ctx.fillStyle = COLORS.green;
      ctx.shadowColor = COLORS.green;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y-8+bob);
      ctx.lineTo(l.x+7, l.y-3+bob);
      ctx.lineTo(l.x+5, l.y+5+bob);
      ctx.lineTo(l.x, l.y+8+bob);
      ctx.lineTo(l.x-5, l.y+5+bob);
      ctx.lineTo(l.x-7, l.y-3+bob);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  },
  drawBullet(ctx, b){
    ctx.save();
    ctx.fillStyle = b.color;
    ctx.shadowColor = b.color;
    ctx.shadowBlur = 10;
    if(b.hitscan){
      ctx.strokeStyle = b.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx*0.01, b.y - b.vy*0.01);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }else if(b.arc){
      ctx.beginPath();
      ctx.arc(b.x, b.y, 4, 0, Math.PI*2);
      ctx.fill();
    }else{
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  },
  drawEntity(ctx, e, cam){
    if(!e.alive) return;
    ctx.save();
    if(e.dmgFlash>0){
      ctx.shadowColor = '#ff0040';
      ctx.shadowBlur = 20;
    }
    ctx.fillStyle = e.color;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.r, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#0a0a1a';
    ctx.beginPath();
    ctx.arc(e.x + Math.cos(e.aim)*6, e.y + Math.sin(e.aim)*6, 3, 0, Math.PI*2);
    ctx.fill();
    ctx.rotate(e.aim);
    ctx.fillStyle = e.weapon.color;
    ctx.fillRect(e.x, e.y-2, 18, 4);
    ctx.restore();
    ctx.save();
    ctx.fillStyle = e.name==='YOU'?COLORS.gold:'#fff';
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(e.name, e.x, e.y - 22);
    const bw = 40, bh = 5;
    const bx = e.x - bw/2, by = e.y - 18;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = e.hp>60?'#39ff14':e.hp>30?'#ff8c00':'#ff0040';
    ctx.fillRect(bx, by, bw*(e.hp/100), bh);
    if(e.shield>0){
      ctx.fillStyle = COLORS.cyan;
      ctx.fillRect(bx, by-6, bw*(e.shield/100), 2);
    }
    ctx.restore();
  },
  drawParticle(ctx, p){
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x-2, p.y-2, 4, 4);
    ctx.restore();
  }
};
