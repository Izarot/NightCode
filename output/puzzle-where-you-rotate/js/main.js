let canvas, ctx, ball, level, hazards, powerUps, physics, gravitySys, particles, hud, input, gameState, audioCtx;

function init(){
  canvas = document.getElementById('gameCanvas');
  CanvasUI.resizeCanvas(canvas);
  window.addEventListener('resize', () => CanvasUI.resizeCanvas(canvas));
  ctx = canvas.getContext('2d');
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  ball = new Ball(50, 50, 12);
  level = new Level();
  hazards = new Hazards();
  powerUps = new PowerUps();
  physics = new PhysicsEngine(ball, level);
  gravitySys = new GravitySystem();
  particles = new ParticleSystem();
  hud = new HUD();
  input = new InputManager();
  gameState = GameState.PLAYING;
  const keys = ['p','n'];
  window.addEventListener('keydown', e => {
    if(e.key === 'p') gameState = gameState === GameState.PAUSED ? GameState.PLAYING : GameState.PAUSED;
    if(e.key === 'n' && gameState === GameState.VICTORY) nextLevel();
  });
  requestAnimationFrame(gameLoop);
}

function nextLevel(){
  hud.level++;
  hud.steps = 0;
  hud.startTime = performance.now();
  ball.pos.set(50, 50);
  ball.vel.set(0, 0);
  ball.trail = [];
  gameState = GameState.PLAYING;
}

function playSound(freq, dur=100){
  if(!audioCtx) return;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0.001, audioCtx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.1, audioCtx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur/1000);
  osc.start();
  osc.stop(audioCtx.currentTime + dur/1000);
}

function gameLoop(timestamp){
  const dt = timestamp - (gameLoop.last || timestamp);
  gameLoop.last = timestamp;
  update(dt);
  render();
  requestAnimationFrame(gameLoop);
}

function update(dt){
  if(gameState === GameState.PLAYING){
    const dirs = ['up','right','down','left'];
    for(const dir of dirs){
      if(input.isDown(dir)){
        gravitySys.rotate(dir);
        physics.rotateTo(gravitySys.angle);
        hud.incrementSteps();
        playSound(200, 50);
        break;
      }
    }
    physics.update(dt);
    gravitySys.angle = physics.currentAngle;
    physics.gravity = gravitySys.getVector();
    ball.vel.add(physics.gravity);
    for(const wall of level.walls){
      CollisionSystem.resolve(ball, wall, RESTITUTION);
    }
    if(CollisionSystem.circleRect(ball.pos.x, ball.pos.y, ball.r, level.exit.x, level.exit.y, level.exit.w, level.exit.h)){
      playSound(440, 300);
      const elapsed = Math.floor((performance.now() - hud.startTime) / 1000);
      if(elapsed < hud.highScore || hud.highScore === 0) hud.highScore = elapsed;
      localStorage.setItem('highScore', hud.highScore);
      gameState = GameState.VICTORY;
    }
    for(const spike of hazards.spikes){
      if(CollisionSystem.circleRect(ball.pos.x, ball.pos.y, ball.r, spike.x, spike.y, 10, 10)){
        playSound(100, 100);
        gameState = GameState.GAME_OVER;
      }
    }
    particles.update(dt);
  }
}

function render(){
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.translate(canvas.width/2, canvas.height/2);
  ctx.rotate(physics.currentAngle * Math.PI / 180);
  ctx.translate(-canvas.width/2, -canvas.height/2);
  for(const wall of level.walls){
    ctx.fillStyle = COLORS.wall;
    ctx.strokeStyle = COLORS.wallGlow;
    ctx.lineWidth = 2;
    ctx.shadowColor = COLORS.wallGlow;
    ctx.shadowBlur = 10;
    ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
    ctx.strokeRect(wall.x, wall.y, wall.w, wall.h);
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = COLORS.exit;
  ctx.strokeStyle = COLORS.wallGlow;
  ctx.shadowColor = COLORS.exit;
  ctx.shadowBlur = 20;
  ctx.fillRect(level.exit.x, level.exit.y, level.exit.w, level.exit.h);
  ctx.strokeRect(level.exit.x, level.exit.y, level.exit.w, level.exit.h);
  ctx.shadowBlur = 0;
  ball.draw(ctx, physics.currentAngle);
  ctx.restore();
  particles.draw(ctx);
  hud.draw(ctx, gravitySys.angle);
  if(gameState === GameState.PAUSED) Menus.drawPause(ctx);
  if(gameState === GameState.VICTORY) Menus.drawVictory(ctx, hud.level, Math.floor((performance.now()-hud.startTime)/1000), hud.highScore);
  if(gameState === GameState.GAME_OVER){
    ctx.fillStyle = COLORS.wallGlow;
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2);
  }
}

window.onload = init;
window.Ball = Ball;
window.Level = Level;
window.Hazards = Hazards;
window.PowerUps = PowerUps;
window.PhysicsEngine = PhysicsEngine;
window.GravitySystem = GravitySystem;
window.ParticleSystem = ParticleSystem;
window.HUD = HUD;
window.Menus = Menus;
window.CanvasUI = CanvasUI;
window.CollisionSystem = CollisionSystem;
window.GameState = GameState;
window.KEYS = KEYS;
window.ROTATIONS = ROTATIONS;
window.COLORS = COLORS;
window.GRAVITY = GRAVITY;
window.FRICTION = FRICTION;
window.RESTITUTION = RESTITUTION;
window.MAX_SPEED = MAX_SPEED;
window.ROTATION_TIME = ROTATION_TIME;
window.TRAIL_LENGTH = TRAIL_LENGTH;