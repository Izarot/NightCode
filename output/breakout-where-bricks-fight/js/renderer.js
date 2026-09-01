class Renderer {
 constructor(canvas) {
 this.canvas = canvas;
 this.ctx = canvas.getContext('2d');
 this.stars = Array.from({length:80}, () => new Star());
 this.shake = 0; this.shakeX = 0; this.shakeY = 0;
 }
 resize() {
 const wrap = document.getElementById('wrap');
 const ratio = CFG.w/CFG.h;
 let w = window.innerWidth, h = window.innerHeight;
 if (w/h > ratio) { h = h * 0.95; w = h * ratio; }
 else { w = w * 0.95; h = w / ratio; }
 this.canvas.style.width = w+'px'; this.canvas.style.height = h+'px';
 this.canvas.width = CFG.w; this.canvas.height = CFG.h;
 }
 clear() {
 this.ctx.fillStyle = COLORS.bg;
 this.ctx.fillRect(0,0,CFG.w,CFG.h);
 }
 drawStars() {
 this.ctx.save();
 this.stars.forEach(s => {
 this.ctx.fillStyle = `rgba(255,255,255,${0.3+s.s/5})`;
 this.ctx.fillRect(s.x, s.y, s.s, s.s);
 });
 this.ctx.restore();
 }
 drawPaddle(p) {
 this.ctx.save();
 const flash = p.inv > 0 && Math.floor(p.inv*20)%2;
 if (p.flash > 0) this.ctx.shadowColor = COLORS.red;
 else this.ctx.shadowColor = COLORS.paddle;
 this.ctx.shadowBlur = 20;
 this.ctx.fillStyle = flash ? 'rgba(0,255,255,0.3)' : (p.flash>0?COLORS.red:COLORS.paddle);
 this.ctx.beginPath();
 const x = p.x - p.w/2, y = p.y - p.h/2;
 this.ctx.roundRect(x,y,p.w,p.h,8);
 this.ctx.fill();
 this.ctx.restore();
 }
 drawBall(b) {
 b.trail.forEach((t,i) => {
 this.ctx.save();
 this.ctx.fillStyle = `rgba(255,255,0,${(i+1)/b.trail.length*0.5})`;
 this.ctx.beginPath(); this.ctx.arc(t.x,t.y,CFG.ballR,0,Math.PI*2); this.ctx.fill();
 this.ctx.restore();
 });
 this.ctx.save();
 this.ctx.shadowColor = COLORS.ball; this.ctx.shadowBlur = 25;
 this.ctx.fillStyle = b.boost > 0 ? '#ffffff' : COLORS.ball;
 this.ctx.beginPath(); this.ctx.arc(b.x,b.y,CFG.ballR,0,Math.PI*2); this.ctx.fill();
 this.ctx.restore();
 }
 drawBrick(b) {
 this.ctx.save();
 const flash = b.flash > 0;
 const charging = b.fire > 0 && b.charge >= 0;
 const r = b.recoil > 0 ? 2 : 0;
 this.ctx.shadowColor = b.color; this.ctx.shadowBlur = charging ? 18+Math.sin(b.charge*10)*8 : 12;
 this.ctx.fillStyle = flash ? '#ffffff' : b.color;
 this.ctx.fillRect(b.x - r, b.y, b.w, b.h);
 this.ctx.strokeStyle = 'rgba(0,0,0,0.4)'; this.ctx.lineWidth = 2;
 this.ctx.strokeRect(b.x - r, b.y, b.w, b.h);
 this.ctx.restore();
 }
 drawLaser(l) {
 this.ctx.save();
 this.ctx.shadowColor = COLORS.magenta; this.ctx.shadowBlur = 12;
 this.ctx.fillStyle = COLORS.magenta;
 this.ctx.fillRect(l.x - l.w/2, l.y, l.w, l.h);
 this.ctx.restore();
 }
 drawParticle(p) {
 this.ctx.save();
 this.ctx.globalAlpha = Math.max(0, p.life);
 this.ctx.shadowColor = p.color; this.ctx.shadowBlur = 8;
 this.ctx.fillStyle = p.color;
 this.ctx.fillRect(p.x-p.size/2, p.y-p.size/2, p.size, p.size);
 this.ctx.restore();
 }
 drawHUD(game) {
 this.ctx.save();
 this.ctx.font = 'bold 18px Orbitron, monospace';
 this.ctx.shadowColor = COLORS.cyan; this.ctx.shadowBlur = 8;
 this.ctx.fillStyle = COLORS.cyan;
 this.ctx.textAlign = 'left';
 this.ctx.fillText('SCORE: ' + String(game.score).padStart(5,'0'), 20, 28);
 this.ctx.textAlign = 'center';
 this.ctx.fillStyle = COLORS.red;
 let lives = ''; for (let i=0;i<game.lives;i++) lives += '♥';
 this.ctx.fillText(lives, CFG.w/2, 30);
 this.ctx.textAlign = 'right';
 this.ctx.fillStyle = COLORS.cyan;
 this.ctx.fillText('LEVEL: ' + String(game.level).padStart(2,'0'), CFG.w-20, 28);
 if (game.combo > 1) {
 this.ctx.textAlign = 'center';
 this.ctx.fillStyle = COLORS.yellow;
 this.ctx.font = 'bold 22px Orbitron';
 this.ctx.fillText(game.combo + 'X', CFG.w/2, 56);
 }
 if (game.timerRunning) {
 this.ctx.textAlign = 'left';
 this.ctx.fillStyle = '#ff00ff';
 this.ctx.font = 'bold 14px Orbitron';
 const t = game.timer.toFixed(1);
 this.ctx.fillText('TIME: ' + t, 20, CFG.h - 10);
 }
 this.ctx.restore();
 }
 drawDivider() {
 this.ctx.save();
 this.ctx.strokeStyle = '#00ffff33'; this.ctx.lineWidth = 1;
 this.ctx.beginPath(); this.ctx.moveTo(0,CFG.hud); this.ctx.lineTo(CFG.w,CFG.hud); this.ctx.stroke();
 this.ctx.restore();
 }
 shakeCam() {
 if (this.shake > 0) {
 this.shakeX = (Math.random()-0.5)*this.shake;
 this.shakeY = (Math.random()-0.5)*this.shake;
 this.shake *= 0.85;
 if (this.shake < 0.5) this.shake = 0;
 } else { this.shakeX = 0; this.shakeY = 0; }
 this.ctx.save();
 this.ctx.translate(this.shakeX, this.shakeY);
 }
 restoreCam() { this.ctx.restore(); }
}
