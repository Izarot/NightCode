class Game {
 constructor() {
 this.canvas = document.getElementById('game');
 this.renderer = new Renderer(this.canvas);
 this.renderer.resize();
 window.addEventListener('resize', () => this.renderer.resize());
 this.input = new InputHandler(this.canvas);
 this.audio = new AudioManager();
 this.state = 'title';
 this.paddle = new Paddle();
 this.ball = new Ball();
 this.bricks = []; this.lasers = []; this.particles = [];
 this.score = 0; this.lives = 3; this.level = 1;
 this.combo = 1; this.comboTimer = 0; this.lastHit = 0;
 this.noDamage = true;
 this.timer = 0; this.timerRunning = false;
 this.levelClearTimer = 0;
 this.highScore = parseInt(localStorage.getItem('nb_high') || '0');
 this.lastT = 0;
 this.loop = this.loop.bind(this);
 }
 start() {
 this.audio.init();
 this.bricks = buildLevel(this.level);
 this.paddle.reset(); this.ball.reset();
 this.score = 0; this.lives = 3;
 this.noDamage = true;
 this.timer = 0; this.timerRunning = true;
 this.state = 'playing';
 }
 aabb(a,b) { return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y; }
 spawnParticles(x,y,color,n) {
 for (let i=0;i<n;i++) this.particles.push(new Particle(x,y,color));
 }
 loop(t) {
 const dt = Math.min(0.05, (t - this.lastT) / 1000 || 0.016);
 this.lastT = t;
 this.update(dt);
 this.render();
 requestAnimationFrame(this.loop);
 }
 update(dt) {
 this.renderer.stars.forEach(s => s.update());
 if (this.state === 'title') {
 if (this.input.consumeClick()) this.start();
 }
 else if (this.state === 'playing') {
 if (this.input.consumePause()) { this.state = 'paused'; return; }
 this.timer += dt;
 this.paddle.update(this.input, dt);
 if (this.ball.docked) {
 this.ball.x = this.paddle.x;
 this.ball.y = this.paddle.y - 25;
 if (this.input.consumeClick()) this.ball.launch();
 } else {
 this.ball.update(dt);
 // walls
 if (this.ball.x - CFG.ballR < CFG.pad) { this.ball.x = CFG.pad+CFG.ballR; this.ball.vx *= -1; }
 if (this.ball.x + CFG.ballR > CFG.w-CFG.pad) { this.ball.x = CFG.w-CFG.pad-CFG.ballR; this.ball.vx *= -1; }
 if (this.ball.y - CFG.ballR < CFG.hud) { this.ball.y = CFG.hud+CFG.ballR; this.ball.vy *= -1; }
 if (this.ball.y > CFG.h + 20) {
 this.loseLife();
 return;
 }
 // paddle
 const pb = {x:this.paddle.x-this.paddle.w/2, y:this.paddle.y-this.paddle.h/2, w:this.paddle.w, h:this.paddle.h};
 const bba = {x:this.ball.x-CFG.ballR, y:this.ball.y-CFG.ballR, w:CFG.ballR*2, h:CFG.ballR*2};
 if (this.aabb(pb, bba) && this.ball.vy > 0) {
 const hit = (this.ball.x - this.paddle.x) / (this.paddle.w/2);
 const ang = hit * (Math.PI/3);
 this.ball.vx = Math.sin(ang) * this.ball.speed;
 this.ball.vy = -Math.cos(ang) * this.ball.speed;
 this.ball.y = this.paddle.y - this.paddle.h/2 - CFG.ballR - 1;
 this.audio.hit();
 }
 // bricks
 for (let i=this.bricks.length-1;i>=0;i--) {
 const b = this.bricks[i];
 if (b.hp <= 0) continue;
 const bb = {x:b.x, y:b.y, w:b.w, h:b.h};
 if (this.aabb(bba, bb)) {
 // side detection
 const ox = Math.min(bba.x+bba.w-bb.x, bb.x+bba.w-bba.x);
 const oy = Math.min(bba.y+bba.h-bb.y, bb.y+bha-bba.y);
 if (ox < oy) this.ball.vx *= -1;
 else this.ball.vy *= -1;
 const dead = b.hit();
 if (dead) {
 this.spawnParticles(b.x+b.w/2, b.y+b.h/2, b.color, 18);
 this.renderer.shake = 8;
 this.audio.break();
 this.addScore(b.pts);
 this.ball.boost = 2;
 this.bricks.splice(i,1);
 } else { this.audio.hit(); this.addScore(5); }
 break;
 }
 }
 // bricks fire
 this.bricks.forEach(b => {
 if (b.hp > 0) b.update(dt);
 if (b.fire > 0 && b.charge >= 0 && Math.abs(b.charge - b.fire) < 0.016) {
 this.lasers.push(new Laser(b.x+b.w/2, b.y+b.h));
 this.audio.laser();
 b.charge = -1;
 }
 });
 // lasers
 for (let i=this.lasers.length-1;i>=0;i--) {
 const l = this.lasers[i];
 l.update();
 if (l.y > CFG.h) { this.lasers.splice(i,1); continue; }
 if (this.aabb(l, pb) && this.paddle.inv <= 0) {
 this.lasers.splice(i,1);
 this.spawnParticles(this.paddle.x, this.paddle.y, COLORS.magenta, 10);
 this.audio.lose();
 this.loseLife();
 return;
 }
 }
 }
 this.comboTimer -= dt;
 if (this.comboTimer <= 0) this.combo = 1;
 // particles
 for (let i=this.particles.length-1;i>=0;i--) {
 this.particles[i].update(dt);
 if (this.particles[i].life <= 0) this.particles.splice(i,1);
 }
 // level clear
 if (this.bricks.length === 0 && this.ball.docked === false) {
 // wait until ball not in air? just check bricks
 }
 if (this.bricks.length === 0) {
 this.state = 'levelcomplete';
 this.levelClearTimer = 2;
 this.timerRunning = false;
 const bonus = 500 * this.level + (this.noDamage ? 1000 : 0);
 this.score += bonus;
 }
 }
 else if (this.state === 'paused') {
 if (this.input.consumePause()) this.state = 'playing';
 }
 else if (this.state === 'levelcomplete') {
 this.levelClearTimer -= dt;
 if (this.levelClearTimer <= 0) {
 this.level++;
 this.bricks = buildLevel(this.level);
 this.paddle.reset(); this.ball.reset();
 this.ball.speed = Math.min(CFG.ballMax, CFG.ballBase + (this.level-1)*0.5);
 this.state = 'playing';
 this.noDamage = true;
 this.timerRunning = true;
 }
 }
 else if (this.state === 'gameover') {
 if (this.input.consumeClick()) {
 this.level = 1;
 this.start();
 }
 }
 }
 addScore(pts) {
 const now = performance.now();
 if (now - this.lastHit < 1000) { this.combo = Math.min(4, this.combo+1); }
 else this.combo = 1;
 this.comboTimer = 1; this.lastHit = now;
 this.score += pts * this.combo;
 }
 loseLife() {
 this.lives--;
 this.noDamage = false;
 if (this.score > 0 && this.score % 5000 < 100) this.lives = Math.min(5, this.lives+1);
 if (this.lives <= 0) {
 this.gameOver();
 } else {
 this.paddle.reset(); this.ball.reset();
 this.paddle.inv = 1.5;
 }
 }
 gameOver() {
 this.state = 'gameover';
 this.timerRunning = false;
 if (this.score > this.highScore) {
 this.highScore = this.score;
 localStorage.setItem('nb_high', this.highScore);
 }
 }
 render() {
 const r = this.renderer;
 r.clear();
 r.shakeCam();
 r.drawStars();
 r.drawDivider();
 if (this.state !== 'title') {
 this.bricks.forEach(b => { if (b.hp > 0) b.draw(r); });
 this.lasers.forEach(l => l.draw(r));
 this.ball.draw(r);
 this.paddle.draw(r);
 this.particles.forEach(p => p.draw(r));
 }
 r.drawHUD(this);
 r.restoreCam();
 if (this.state === 'title') this.drawTitle();
 if (this.state === 'paused') this.drawPaused();
 if (this.state === 'gameover') this.drawGameOver();
 if (this.state === 'levelcomplete') this.drawLevelClear();
 }
 drawTitle() {
 const ctx = this.renderer.ctx;
 ctx.save();
 ctx.textAlign = 'center';
 ctx.shadowColor = COLORS.cyan; ctx.shadowBlur = 30;
 ctx.fillStyle = COLORS.cyan;
 ctx.font = 'bold 64px Orbitron';
 ctx.fillText('NEON BREAKER', CFG.w/2, CFG.h/2 - 50);
 ctx.shadowColor = COLORS.magenta; ctx.shadowBlur = 15;
 ctx.fillStyle = COLORS.magenta;
 ctx.font = 'bold 24px Orbitron';
 ctx.fillText('BRICKS FIRE BACK', CFG.w/2, CFG.h/2);
 ctx.shadowBlur = 0;
 ctx.fillStyle = COLORS.yellow;
 ctx.font = '18px Orbitron';
 ctx.fillText('CLICK TO START', CFG.w/2, CFG.h/2 + 60);
 ctx.fillStyle = COLORS.cyan;
 ctx.font = '14px Orbitron';
 ctx.fillText('HIGH SCORE: ' + this.highScore, CFG.w/2, CFG.h/2 + 100);
 ctx.fillStyle = '#888';
 ctx.font = '12px Orbitron';
 ctx.fillText('MOUSE / ARROWS - MOVE   |   CLICK / SPACE - LAUNCH   |   P - PAUSE', CFG.w/2, CFG.h/2 + 140);
 ctx.restore();
 }
 drawPaused() {
 const ctx = this.renderer.ctx;
 ctx.save();
 ctx.fillStyle = 'rgba(0,0,0,0.7)';
 ctx.fillRect(0,0,CFG.w,CFG.h);
 ctx.textAlign = 'center';
 ctx.fillStyle = COLORS.cyan;
 ctx.shadowColor = COLORS.cyan; ctx.shadowBlur = 20;
 ctx.font = 'bold 48px Orbitron';
 ctx.fillText('PAUSED', CFG.w/2, CFG.h/2);
 ctx.font = '18px Orbitron';
 ctx.fillText('Press P or ESC to resume', CFG.w/2, CFG.h/2 + 40);
 ctx.restore();
 }
 drawGameOver() {
 const ctx = this.renderer.ctx;
 ctx.save();
 ctx.fillStyle = 'rgba(0,0,0,0.8)';
 ctx.fillRect(0,0,CFG.w,CFG.h);
 ctx.textAlign = 'center';
 ctx.fillStyle = COLORS.red;
 ctx.shadowColor = COLORS.red; ctx.shadowBlur = 25;
 ctx.font = 'bold 56px Orbitron';
 ctx.fillText('GAME OVER', CFG.w/2, CFG.h/2 - 30);
 ctx.shadowBlur = 0;
 ctx.fillStyle = COLORS.yellow;
 ctx.font = 'bold 24px Orbitron';
 ctx.fillText('SCORE: ' + this.score, CFG.w/2, CFG.h/2 + 20);
 if (this.score >= this.highScore && this.score > 0) {
 const flash = Math.floor(performance.now()/300)%2;
 ctx.fillStyle = flash ? '#ffff00' : '#ffaa00';
 ctx.shadowColor = '#ffff00'; ctx.shadowBlur = 15;
 ctx.fillText('★ NEW HIGH SCORE! ★', CFG.w/2, CFG.h/2 + 60);
 }
 ctx.shadowBlur = 0;
 ctx.fillStyle = COLORS.cyan;
 ctx.font = '16px Orbitron';
 ctx.fillText('TIME: ' + this.timer.toFixed(1) + 's   |   CLICK TO RESTART', CFG.w/2, CFG.h/2 + 100);
 ctx.restore();
 }
 drawLevelClear() {
 const ctx = this.renderer.ctx;
 ctx.save();
 ctx.textAlign = 'center';
 ctx.fillStyle = COLORS.cyan;
 ctx.shadowColor = COLORS.cyan; ctx.shadowBlur = 20;
 ctx.font = 'bold 40px Orbitron';
 ctx.fillText('LEVEL CLEAR', CFG.w/2, CFG.h/2 - 20);
 ctx.shadowBlur = 0;
 ctx.fillStyle = COLORS.yellow;
 ctx.font = '20px Orbitron';
 ctx.fillText('BONUS: ' + (500*this.level + (this.noDamage?1000:0)), CFG.w/2, CFG.h/2 + 20);
 ctx.fillStyle = COLORS.cyan;
 ctx.font = '14px Orbitron';
 ctx.fillText('TIME: ' + this.timer.toFixed(1) + 's', CFG.w/2, CFG.h/2 + 50);
 this.particles.forEach(p => p.draw(this.renderer));
 ctx.restore();
 }
}
const game = new Game();
requestAnimationFrame(game.loop);
