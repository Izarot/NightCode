(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const BASE_W = 1280, BASE_H = 720;
  let W = BASE_W, H = BASE_H, scale = 1;

  function resize() {
    const vw = window.innerWidth, vh = window.innerHeight;
    scale = Math.min(vw/BASE_W, vh/BASE_H);
    canvas.width = vw; canvas.height = vh;
    W = vw; H = vh;
  }
  window.addEventListener('resize', resize); resize();

  const HS_KEY = 'paperPlaneHighScore';
  let highScore = parseInt(localStorage.getItem(HS_KEY)||'0',10) || 0;

  let plane, obstacles, score, distance, status, startTime, elapsed, started, lastObstacleX, shake, flash;
  const input = { up:false, down:false, left:false, right:false, flap:false, dive:false };

  function reset() {
    plane = new PaperPlane(200, H/scale*0.4);
    obstacles = [];
    score = 0; distance = 0; status = 'READY';
    startTime = 0; elapsed = 0; started = false;
    lastObstacleX = 600; shake = 0; flash = 0;
  }
  reset();

  function spawnObstacle() {
    const types = ['cloud','building','mountain'];
    const t = types[Math.floor(Math.random()*types.length)];
    let y, w, h;
    if (t==='cloud') { w=120; h=60; y = 80 + Math.random()*(H/scale*0.5); }
    else if (t==='building') { w=70; h=120+Math.random()*180; y = H/scale - h - 40; }
    else { w=160; h=180+Math.random()*120; y = H/scale - h - 40; }
    obstacles.push(new Obstacle(lastObstacleX, y, w, h, t));
    lastObstacleX += 280 + Math.random()*220;
  }

  // Input
  function keyHandler(e, down) {
    const k = e.key.toLowerCase();
    if (k==='w'||e.key==='ArrowUp') input.up = down;
    if (k==='s'||e.key==='ArrowDown') input.down = down;
    if (k==='a'||e.key==='ArrowLeft') input.left = down;
    if (k==='d'||e.key==='ArrowRight') input.right = down;
    if (k===' ') { input.flap = down; if(down && e.shiftKey) input.dive = true; if(!down) input.dive = false; if(!started && down) startGame(); e.preventDefault(); }
    if (k==='r' && down) reset();
  }
  window.addEventListener('keydown', e=>keyHandler(e,true));
  window.addEventListener('keyup', e=>keyHandler(e,false));
  canvas.addEventListener('pointerdown', e=>{
    Audio.init();
    if (!started) { startGame(); return; }
    if (status==='CRASHED'||status==='LANDED') { reset(); return; }
    input.flap = true;
    // touch: upper half = up, lower half = dive
    const ry = e.clientY / H;
    if (ry < 0.4) input.up = true;
    else if (ry > 0.7) input.dive = true;
  });
  canvas.addEventListener('pointerup', ()=>{ input.flap=false; input.up=false; input.dive=false; });

  function startGame() {
    Audio.init(); Audio.launch();
    started = true; status = 'FLYING'; startTime = performance.now();
  }

  let last = performance.now();
  function loop(now) {
    let dt = (now-last)/16.67; last = now;
    if (dt > 3) dt = 3;
    if (started && status==='FLYING') elapsed = now - startTime;

    // Update
    if (started && status==='FLYING') {
      plane.update(dt, input);
      if (input.flap && Math.random()<0.1) Audio.flap();
      // Camera follows
      const camX = plane.x - 250;
      // Spawn obstacles ahead
      while (lastObstacleX < plane.x + 1500) spawnObstacle();
      // Update obstacles
      for (const o of obstacles) o.update(dt);
      // Remove passed
      obstacles = obstacles.filter(o => o.x + o.w > plane.x - 400);
      // Collisions
      const b = plane.bounds();
      for (const o of obstacles) {
        if (o.hits(b)) {
          score = Math.max(0, score-20);
          flash = 1; shake = 8;
          Audio.crash();
          status='CRASHED'; plane.alive=false;
          break;
        }
      }
      // Ground / ceiling
      const groundY = H/scale - 40;
      if (plane.y >= groundY) {
        plane.y = groundY;
        if (Math.abs(plane.vy) < 4 && Math.abs(plane.angle) < 15) {
          status='LANDED'; plane.landed=true; score += 200; Audio.landing();
        } else {
          status='CRASHED'; plane.alive=false; Audio.crash();
        }
      }
      if (plane.y < 20) { plane.y = 20; plane.vy = Math.abs(plane.vy); }
      // Scoring
      distance = Math.max(distance, plane.x - 200);
      score = Math.floor(distance/1) + Math.floor(elapsed/1000 * 5);
      // High score
      if (score > highScore) { highScore = score; localStorage.setItem(HS_KEY, highScore); }
    }

    // Render
    ctx.fillStyle = '#0a0a1a'; ctx.fillRect(0,0,W,H);
    ctx.save();
    ctx.scale(scale, scale);
    let sx = 0, sy = 0;
    if (shake > 0) { sx = (Math.random()-0.5)*shake; sy=(Math.random()-0.5)*shake; shake*=0.9; }
    ctx.translate(-plane.x + 250 + sx, sy);

    // Sky gradient
    const skyG = ctx.createLinearGradient(0,0,0,H/scale);
    skyG.addColorStop(0,'#2d1b69'); skyG.addColorStop(0.5,'#7b2ff7'); skyG.addColorStop(1,'#ff6ec7');
    ctx.fillStyle = skyG; ctx.fillRect(plane.x-300, -100, 2000, H/scale+200);
    // Stars
    ctx.fillStyle='rgba(255,255,255,0.6)';
    for(let i=0;i<40;i++){ const sx2=Math.floor((i*97)%1800)+plane.x-300; const sy2=(i*53)%(H/scale*0.6); ctx.fillRect(sx2, sy2, 2,2); }
    // Ground
    ctx.fillStyle = '#6B8E23';
    ctx.fillRect(plane.x-300, H/scale-40, 2000, 40);
    ctx.fillStyle = '#557a1c';
    for(let i=0;i<60;i++){ const gx=Math.floor(i*40)+plane.x-300; ctx.fillRect(gx, H/scale-40, 20, 6); }
    // Obstacles
    for (const o of obstacles) o.draw(ctx);
    // Plane
    plane.draw(ctx);
    // Obstacle warnings
    for (const o of obstacles) {
      if (o.x > plane.x + 300 && o.x < plane.x + 700) {
        ctx.fillStyle = '#ffd23f'; ctx.font='20px Segoe UI'; ctx.textAlign='center';
        ctx.fillText('⚠️', o.x+o.w/2, o.y-10);
      }
    }
    ctx.restore();

    // Flash
    if (flash > 0) { ctx.fillStyle = 'rgba(255,255,255,'+flash*0.5+')'; ctx.fillRect(0,0,W,H); flash *= 0.85; }

    // UI
    drawUI(ctx, W, H, {
      score, distance, status,
      speed: Math.hypot(plane.vx, plane.vy),
      altitude: (H/scale-40-plane.y),
      highScore, timer: elapsed, started
    });

    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
