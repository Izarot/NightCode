import {COLORS} from '../data/constants.js';

export const HUD = {
  draw(game){
    if(game.state==='MENU') return;
    const ctx = game.ctx;
    const p = game.world.player;
    const w = game.canvas.width, h = game.canvas.height;
    ctx.save();
    ctx.fillStyle = 'rgba(10,10,26,0.6)';
    ctx.fillRect(0, 0, w, 60);
    ctx.fillRect(0, h-80, w, 80);
    ctx.fillStyle = COLORS.cyan;
    ctx.font = 'bold 18px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('TIME: '+game.timer.toFixed(1)+'s', 20, 30);
    ctx.fillText('ALIVE: '+game.world.aliveCount(), 20, 55);
    ctx.textAlign = 'right';
    ctx.fillStyle = COLORS.gold;
    ctx.fillText('KILLS: '+p.kills, w-20, 30);
    ctx.fillStyle = COLORS.orange;
    ctx.fillText('DMG: '+Math.floor(p.dmgDealt), w-20, 55);
    const bw = 280, bh = 18;
    const bx = (w-bw)/2, by = h-70;
    ctx.fillStyle = '#333';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = p.hp>60?'#39ff14':p.hp>30?'#ff8c00':'#ff0040';
    ctx.fillRect(bx, by, bw*(p.hp/100), bh);
    ctx.strokeStyle = COLORS.cyan;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('HP: '+Math.floor(p.hp), w/2, by+13);
    if(p.shield>0){
      const sbw = bw*(p.shield/100);
      ctx.fillStyle = COLORS.cyan;
      ctx.fillRect(bx, by-5, sbw, 4);
    }
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'left';
    const wep = p.weapon;
    ctx.fillText(wep.name, 20, h-50);
    ctx.fillStyle = COLORS.cyan;
    ctx.fillText(wep.ammo+'/'+wep.mag, 20, h-25);
    if(p.reloading>0){
      ctx.fillStyle = COLORS.orange;
      ctx.fillText('RELOADING', 200, h-25);
    }
    const cx = w-180, cy = h-50;
    ctx.fillStyle = '#222';
    ctx.fillRect(cx, cy, 160, 14);
    ctx.fillStyle = wep.color;
    ctx.fillRect(cx, cy, 160*((wep.mag-wep.ammo)/wep.mag), 14);
    ctx.strokeStyle = COLORS.cyan;
    ctx.strokeRect(cx, cy, 160, 14);
    ctx.restore();
  }
};
