export class HUD{
constructor(game){this.game=game;}
draw(ctx){
const p=this.game.player;
ctx.fillStyle='rgba(0,0,0,0.5)';ctx.fillRect(0,0,1280,60);
ctx.fillStyle='#00ffcc';ctx.font='bold 20px Orbitron';ctx.textAlign='left';
ctx.fillText('SCORE: '+this.game.score,20,35);
ctx.fillText('HI: '+this.game.highScore,200,35);
ctx.fillText('TIME: '+Math.floor(this.game.runTime),380,35);
ctx.fillText('KILLS: '+this.game.enemiesKilled,520,35);
ctx.fillText('THROWS: '+this.game.boomerangsThrown,660,35);
ctx.fillText('DASH: '+Math.floor(this.game.dashDist),830,35);
ctx.fillStyle='#ff0044';ctx.fillText('LIVES: '+this.game.lives,1020,35);
ctx.fillStyle='#ffaa00';ctx.fillText(this.game.dashUnlocked?'DASH READY':'DASH LOCKED',1180,35);
this.drawHp(ctx,p);
}
drawHp(ctx,p){
const w=200,h=14,x=20,y=42;
ctx.fillStyle='#333';ctx.fillRect(x,y,w,h);
ctx.fillStyle=p&&p.hp>30?'#00ff66':'#ff0044';
const hp=p?p.hp:100;const max=p?p.maxHp:100;
ctx.fillRect(x,y,w*(hp/max),h);
ctx.strokeStyle='#fff';ctx.strokeRect(x,y,w,h);
}
}