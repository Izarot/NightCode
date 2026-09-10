const Game = (() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const COLORS = { bg:'#1a1f2e', player:'#00d4ff', playerGlow:'#00ffff', obstacle:'#2a2a3a', target:'#7fff57', exit:'#ff9f43', ui:'#fff', accent:'#00b4a0', danger:'#ff3344' };
  const PHYSICS = { speed: 300, friction: 0.85, maxSpeed: 350 };
  const ROW_H = 80;
  const ROWS_DATA = [
    { obstacles: [{x:200,w:60},{x:400,w:80},{x:600,w:50}], targets: [{x:300}], exit: {x:750,w:50} },
    { obstacles: [{x:150,w:100},{x:350,w:60},{x:550,w:70},{x:700,w:40}], targets: [{x:250},{x:450}], exit: {x:760,w:40} },
    { obstacles: [{x:100,w:80},{x:300,w:90},{x:500,w:60},{x:650,w:80},{x:780,w:20}], targets: [{x:200},{x:400},{x:600}], exit: {x:770,w:30} },
    { obstacles: [{x:180,w:70},{x:380,w:100},{x:580,w:50},{x:720,w:60}], targets: [{x:280},{x:480},{x:650}], exit: {x:780,w:20} },
    { obstacles: [{x:120,w:90},{x:320,w:80},{x:520,w:70},{x:680,w:50},{x:750,w:30}], targets: [{x:220},{x:420},{x:600},{x:720}], exit: {x:785,w:15} }
  ];
  let state = 'START';
  let player = { x: 50, y: 0, w: 40, h: 50, vx: 0, vy: 0, row: 0, targetIdx: 0, bob: 0 };
  let rows = [];
  let timer = 0;
  let totalTime = 0;
  let score = 0;
  let highScore = parseInt(localStorage.getItem('slidefind_hs')||'0',10);
  let screenShake = 0;
  let lastTime = 0;
  let animId = 0;
  
  function resize() {
    const ratio = 800/400;
    const maxW = window.innerWidth * 0.98;
    const maxH = window.innerHeight * 0.98;
    let w = maxW, h = maxW/ratio;
    if(h > maxH) { h = maxH; w = h*ratio; }
    canvas.width = 800; canvas.height = 400;
    canvas.style.width = w+'px';
    canvas.style.height = h+'px';
  }
  
  function initRows() {
    rows = ROWS_DATA.map((d,i)=>({
      y: 40 + i*ROW_H,
      obstacles: d.obstacles.map(o=>({x:o.x,y:40+i*ROW_H+15,w:o.w,h:50})),
      targets: d.targets.map(t=>({x:t.x,y:40+i*ROW_H+15,w:20,h:50,hit:false})),
      exit: {x:d.exit.x,y:40+i*ROW_H+15,w:d.exit.w,h:50},
      completed: false
    }));
  }
  
  function reset() {
    player = { x: 50, y: 40, w: 40, h: 50, vx: 0, vy: 0, row: 0, targetIdx: 0, bob: 0 };
    initRows();
    timer = 60;
    totalTime = 0;
    score = 0;
    screenShake = 0;
    Particles.clear();
    document.getElementById('high-score-val').textContent = highScore;
  }
  
  function start() {
    state = 'PLAYING';
    document.getElementById('start-screen').classList.add('hidden');
    AudioSys.resume();
    lastTime = performance.now();
    animId = requestAnimationFrame(loop);
  }
  
  function loop(now) {
    const dt = Math.min((now-lastTime)/1000, 0.05);
    lastTime = now;
    
    if(state==='PLAYING') update(dt);
    draw();
    
    if(state!=='START') animId = requestAnimationFrame(loop);
  }
  
  function update(dt) {
    const input = Input.poll();
    if(input.pause) { state = state==='PLAYING'?'PAUSED':'PLAYING'; return; }
    if(state!=='PLAYING') return;
    
    totalTime += dt;
    timer -= dt;
    if(timer <= 0) { fail('Time\'s up!'); return; }
    
    const row = rows[player.row];
    player.bob += dt * 8;
    
    if(input.left) player.vx -= PHYSICS.speed * dt * 60;
    if(input.right) player.vx += PHYSICS.speed * dt * 60;
    player.vx *= PHYSICS.friction;
    player.vx = Math.max(-PHYSICS.maxSpeed, Math.min(PHYSICS.maxSpeed, player.vx));
    
    const newX = player.x + player.vx * dt;
    let blocked = false;
    row.obstacles.forEach(obs=>{
      if(newX+player.w > obs.x && newX < obs.x+obs.w && player.y+player.h > obs.y && player.y < obs.y+obs.h) blocked=true;
    });
    if(!blocked) player.x = newX;
    
    player.x = Math.max(0, Math.min(800-player.w, player.x));
    
    row.targets.forEach((t,i)=>
      !t.hit && player.x+player.w>t.x && player.x<t.x+t.w && player.y+player.h>t.y && player.y<t.y+t.h && (t.hit=true, score+=100, AudioSys.targetHit(), Particles.spawn(t.x+t.w/2,t.y+t.h/2,t.color,6,3))
    );
    
    const exit = row.exit;
    if(player.x+player.w>exit.x && player.x<exit.x+exit.w && player.y+player.h>exit.y && player.y<exit.y+exit.h) {
      if(row.targets.every(t=>t.hit)) {
        row.completed = true;
        score += 500 + Math.floor(timer*10);
        AudioSys.win();
        Particles.spawnConfetti(exit.x+exit.w/2, exit.y+exit.h/2);
        if(player.row < rows.length-1) {
          player.row++;
          player.x = 50;
          player.y = rows[player.row].y;
          player.targetIdx = 0;
          timer = 60;
        } else win();
      }
    }
    
    if(screenShake>0) screenShake-=dt;
  }
  
  function fail(reason) {
    state = 'FAILED';
    AudioSys.fail();
    AudioSys.collision();
    screenShake = 0.5;
    document.getElementById('fail-reason').textContent = reason;
    document.getElementById('fail-screen').classList.remove('hidden');
    cancelAnimationFrame(animId);
  }
  
  function win() {
    state = 'WON';
    if(score > highScore) { highScore = score; localStorage.setItem('slidefind_hs', highScore); }
    document.getElementById('final-score').textContent = score;
    document.getElementById('final-time').textContent = totalTime.toFixed(2);
    document.getElementById('high-score-val').textContent = highScore;
    document.getElementById('win-screen').classList.remove('hidden');
    cancelAnimationFrame(animId);
  }
  
  function draw() {
    ctx.save();
    if(screenShake>0) ctx.translate((Math.random()-0.5)*10*screenShake, (Math.random()-0.5)*10*screenShake);
    
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0,0,800,400);
    
    ctx.fillStyle = '#0a0d14';
    for(let i=0;i<5;i++) ctx.fillRect(0,40+i*ROW_H,800,ROW_H);
    
    rows.forEach((row,ri)=>
      row.obstacles.forEach(obs=>{
        ctx.fillStyle = ri===player.row ? '#3a3a4a' : COLORS.obstacle;
        ctx.fillRect(obs.x,obs.y,obs.w,obs.h);
        ctx.fillStyle = '#1a1f2e';
        ctx.fillRect(obs.x+2,obs.y+2,obs.w-4,obs.h-4);
      })
    );
    
    rows.forEach(row=>
      row.targets.forEach(t=>{
        if(!t.hit){
          const pulse = 0.8+0.2*Math.sin(totalTime*5);
          ctx.fillStyle = t.color;
          ctx.globalAlpha = pulse;
          ctx.beginPath();
          ctx.arc(t.x+t.w/2,t.y+t.h/2,12*pulse,0,Math.PI*2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      })
    );
    
    rows.forEach((row,ri)=>
      row.completed || ctx.fillStyle === undefined || (
        ctx.fillStyle = ri===player.row ? COLORS.exit : '#aa6622',
        ctx.fillRect(row.exit.x,row.exit.y,row.exit.w,row.exit.h),
        ctx.fillStyle = '#fff',
        ctx.font = 'bold 14px monospace',
        ctx.textAlign = 'center',
        ctx.fillText('EXIT', row.exit.x+row.exit.w/2, row.exit.y+32)
      )
    );
    
    const px = player.x, py = player.y + Math.sin(player.bob)*2;
    ctx.shadowColor = COLORS.playerGlow;
    ctx.shadowBlur = 15;
    ctx.fillStyle = COLORS.player;
    ctx.fillRect(px,py,player.w,player.h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff';
    ctx.fillRect(px+8,py+12,8,8);
    ctx.fillRect(px+24,py+12,8,8);
    
    Particles.draw(ctx);
    
    ctx.restore();
    
    ctx.fillStyle = COLORS.ui;
    ctx.font = 'bold 20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('SCORE: '+score, 20, 35);
    
    ctx.textAlign = 'right';
    const tc = timer>10?COLORS.ui:COLORS.danger;
    ctx.fillStyle = tc;
    ctx.fillText('TIME: '+Math.max(0,timer).toFixed(1), 780, 35);
    
    ctx.textAlign = 'center';
    ctx.fillStyle = COLORS.accent;
    ctx.font = '16px monospace';
    ctx.fillText('ROW '+(player.row+1)+' / '+rows.length, 400, 390);
    
    if(state==='PAUSED'){
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0,0,800,400);
      ctx.fillStyle = COLORS.player;
      ctx.font = 'bold 40px monospace';
      ctx.fillText('PAUSED', 400, 200);
    }
  }
  
  function init() {
    resize();
    window.addEventListener('resize', resize);
    Input.init(canvas);
    reset();
    
    document.getElementById('start-btn').onclick = start;
    document.getElementById('play-again-btn').onclick = ()=>{ document.getElementById('win-screen').classList.add('hidden'); reset(); start(); };
    document.getElementById('retry-btn').onclick = ()=>{ document.getElementById('fail-screen').classList.add('hidden'); reset(); start(); };
  }
  
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();