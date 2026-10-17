(function(){
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  let w, h, dpr;
  
  // Game state
  let score = 0, health = 100, wellsActive = 0;
  let gameRunning = false, paused = false;
  let lastTime = 0, elapsed = 0;
  let highScore = localStorage.getItem('highScore') || 0;
  
  // Entities
  const ship = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, va: 0, r: 15, mass: 1 };
  const bullets = [], asteroids = [], wells = [];
  
  // Input
  const keys = {}, touches = {};
  
  // Audio
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  function playSound(freq, dur, type='sine'){
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = type; osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
    osc.start(); osc.stop(audioCtx.currentTime + dur);
  }
  
  // Init
  function init(){
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', e => keys[e.code] = true);
    window.addEventListener('keyup', e => keys[e.code] = false);
    canvas.addEventListener('touchstart', e => { e.preventDefault(); for(let t of e.changedTouches) touches[t.identifier] = true; });
    canvas.addEventListener('touchend', e => { e.preventDefault(); for(let t of e.changedTouches) delete touches[t.identifier]; });
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('fireBtn').addEventListener('touchstart', e => { e.preventDefault(); fire(); });
    document.getElementById('thrustBtn').addEventListener('touchstart', e => { e.preventDefault(); keys.ArrowUp = true; });
    document.getElementById('thrustBtn').addEventListener('touchend', e => { e.preventDefault(); keys.ArrowUp = false; });
    resetGame();
    requestAnimationFrame(loop);
  }
  
  function resize(){
    dpr = window.devicePixelRatio || 1;
    w = canvas.width = window.innerWidth * dpr;
    h = canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
    ship.x = w/(2*dpr); ship.y = h/(2*dpr);
  }
  
  function resetGame(){
    score = 0; health = 100; wellsActive = 0; elapsed = 0;
    asteroids.length = 0; bullets.length = 0; wells.length = 0;
    spawnAsteroid(3, 5);
    gameRunning = true;
  }
  
  function spawnAsteroid(size, count){
    for(let i=0; i<count; i++){
      const edge = Math.floor(Math.random()*4);
      const speed = 2 + Math.random()*3;
      const asteroid = {
        x: edge===0 ? -30 : edge===1 ? w/dpr+30 : Math.random()*w/dpr,
        y: edge===2 ? -30 : edge===3 ? h/dpr+30 : Math.random()*h/dpr,
        vx: edge===0 ? speed : edge===1 ? -speed : (Math.random()-0.5)*2,
        vy: edge===2 ? speed : edge===3 ? -speed : (Math.random()-0.5)*2,
        r: [15,25,35][size-1],
        size,
        mass: size*10
      };n      asteroids.push(asteroid);
    }
  }
  
  function fire(){
    if(!gameRunning || paused) return;
    const bx = ship.x + Math.cos(ship.angle)*ship.r;
    const by = ship.y + Math.sin(ship.angle)*ship.r;
    const bvx = ship.vx + Math.cos(ship.angle)*15 - ship.vx*0.5;
    const bvy = ship.vy + Math.sin(ship.angle)*15 - ship.vy*0.5;
    bullets.push({ x: bx, y: by, vx: bvx, vy: bvy, r: 4, life: 60, maxLife: 60 });
    createWell(bx, by);
    playSound(800, 0.1);
  }
  
  function createWell(x, y){
    if(wellsActive >= 5) return;
    wellsActive++;
    wells.push({ x, y, r: 80, g: 0.02, dg: 0.0005, life: 300, maxLife: 300 });
  }
  
  function togglePause(){
    paused = !paused;
    document.getElementById('pauseBtn').textContent = paused ? '▶' : '⏸';
  }
  
  function update(dt){
    if(keys.ArrowUp || touches[0]){
      ship.vx += Math.cos(ship.angle)*0.15;
      ship.vy += Math.sin(ship.angle)*0.15;
    }
    if(keys.ArrowLeft || touches[1]) ship.angle -= 0.04;
    if(keys.ArrowRight || touches[2]) ship.angle += 0.04;
    if(keys.Space || touches[3]){
      ship.vx *= 0.5; ship.vy *= 0.5;
    }
    
    // Apply friction
    ship.vx *= 0.98; ship.vy *= 0.98;
    
    // Update position
    ship.x += ship.vx * dt;
    ship.y += ship.vy * dt;
    
    // Wrap
    if(ship.x < 0) ship.x = w/dpr; if(ship.x > w/dpr) ship.x = 0;
    if(ship.y < 0) ship.y = h/dpr; if(ship.y > h/dpr) ship.y = 0;
    
    // Update bullets
    for(let i=bullets.length-1; i>=0; i--){
      const b = bullets[i];
      b.x += b.vx; b.y += b.vy; b.life--;
      if(b.life <= 0) { bullets.splice(i,1); }
      else {
        for(let j=asteroids.length-1; j>=0; j--){
          const a = asteroids[j];
          const dx = b.x - a.x, dy = b.y - a.y;
          const dist = Math.sqrt(dx*dx+dy*dy);
          if(dist < b.r + a.r){
            asteroids.splice(j,1);
            bullets.splice(i,1);
            score += [10,30,60][a.size-1];
            if(a.size > 1) spawnAsteroid(a.size-1, 2);
            break;
          }
        }
      }
    }
    
    // Update wells
    for(let i=wells.length-1; i>=0; i--){
      const well = wells[i];
      well.g -= well.dg; well.life--;
      if(well.life <= 0) { wells.splice(i,1); wellsActive--; }
    }
    
    // Apply well forces
    for(const well of wells){
      for(const entity of [ship, ...asteroids]){
        const dx = well.x - entity.x, dy = well.y - entity.y;
        const dist = Math.sqrt(dx*dx+dy*dy);
        if(dist < well.r && dist > 0){
          const force = well.g * (1 - dist/well.r) * (entity.mass || 1) / dist;
          entity.vx += (dx/dist) * force;
          entity.vy += (dy/dist) * force;
        }
      }
    }
    
    // Update asteroids
    for(const a of asteroids){
      a.x += a.vx; a.y += a.vy;
      if(a.x < 0) a.x = w/dpr; if(a.x > w/dpr) a.x = 0;
      if(a.y < 0) a.y = h/dpr; if(a.y > h/dpr) a.y = 0;
    }
    
    // Collision detection
    for(const a of asteroids){
      const dx = ship.x - a.x, dy = ship.y - a.y;
      const dist = Math.sqrt(dx*dx+dy*dy);
      if(dist < ship.r + a.r){
        health -= 20;
        playSound(200, 0.3, 'sawtooth');
        if(health <= 0) { gameRunning = false; }
      }
    }
    
    // Update timer
    if(gameRunning && !paused) elapsed += dt;
    const mins = Math.floor(elapsed/60000), secs = Math.floor((elapsed%60000)/1000);
    document.getElementById('speedrunTimer').textContent = 'Time: ' + String(mins).padStart(2,'0') + ':' + String(secs).padStart(2,'0');
  }
  
  function render(){
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0,0,w/dpr,h/dpr);
    
    // Stars
    ctx.fillStyle = '#ffffff';
    for(let i=0; i<50; i++){
      ctx.fillRect(Math.random()*w/dpr, Math.random()*h/dpr, 1, 1);
    }
    
    // Wells
    for(const well of wells){
      const grad = ctx.createRadialGradient(well.x, well.y, 0, well.x, well.y, well.r);
      grad.addColorStop(0, 'rgba(0,0,51,0.3)');
      grad.addColorStop(1, 'rgba(0,0,51,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(well.x, well.y, well.r, 0, Math.PI*2);
      ctx.fill();
    }
    
    // Asteroids
    ctx.fillStyle = '#b35a00';
    for(const a of asteroids){
      ctx.beginPath();
      ctx.arc(a.x, a.y, a.r, 0, Math.PI*2);
      ctx.fill();
      ctx.strokeStyle = '#884000';
      ctx.stroke();
    }
    
    // Ship
    ctx.fillStyle = '#00ffff';
    ctx.beginPath();
    ctx.moveTo(ship.x + Math.cos(ship.angle)*ship.r, ship.y + Math.sin(ship.angle)*ship.r);
    for(let i=1; i<5; i++){
      const a = ship.angle + i*Math.PI*2/5 - Math.PI/2;
      ctx.lineTo(ship.x + Math.cos(a)*ship.r*0.6, ship.y + Math.sin(a)*ship.r*0.6);
    }
    ctx.closePath();
    ctx.fill();
    
    // Bullets
    ctx.fillStyle = '#ffffff';
    for(const b of bullets){
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
      ctx.fill();
    }
    
    // HUD
    ctx.fillStyle = '#00ff00';
    ctx.font = '14px Orbitron';
    ctx.fillText('Score: ' + score, 10, 20);
    ctx.fillText('Health: ' + health, 10, 40);
    ctx.fillText('Wells: ' + wellsActive + '/5', 10, 60);
  }
  
  function loop(timestamp){
    if(!lastTime) lastTime = timestamp;
    const dt = (timestamp - lastTime) / 16.67;
    lastTime = timestamp;
    
    if(gameRunning && !paused){
      update(dt);
      if(!gameRunning) {
        if(score > highScore) {
          highScore = score;
          localStorage.setItem('highScore', highScore);
        }
      }
    }
    
    render();
    requestAnimationFrame(loop);
  }
  
  init();
})();