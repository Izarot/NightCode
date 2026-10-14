// Cube Surface Shooter - prototype with responsive canvas, emoji favicon, vibrant palette,
// localStorage high score, Web Audio API sound effects, and speedrun timer.

(() => {
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  const healthEl = document.getElementById('healthValue');
  const ammoEl = document.getElementById('ammoValue');
  const timerEl = document.getElementById('timerValue');
  const highScoreEl = document.getElementById('highScoreValue');

  // Responsive canvas
  function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // Vibrant color palette
  const palette = [
    '#ff6f61', // coral
    '#6b5b95', // muted purple
    '#88b04b', // fresh green
    '#f7cac9', // soft pink
    '#92a8d1', // periwinkle
    '#955251', // brick red
    '#009b77', // teal
    '#dd4124', // orange-red
    '#d65076', // raspberry
    '#f9cb40'  // mustard
  ];

  // Cube faces: define base normals and tangents (unit cube half-size = 1)
  const faces = [
    { n: [1,0,0], u: [0,0,-1], v: [0,1,0] }, // +X
    { n: [-1,0,0], u: [0,0,1], v: [0,1,0] }, // -X
    { n: [0,1,0], u: [1,0,0], v: [0,0,1] }, // +Y
    { n: [0,-1,0], u: [-1,0,0], v: [0,0,-1] }, // -Y
    { n: [0,0,1], u: [1,0,0], v: [0,1,0] }, // +Z
    { n: [0,0,-1], u: [-1,0,0], v: [0,1,0] }  // -Z
  ];

  let rotation = { x: 0, y: 0, z: 0 };
  const rotSpeed = { x: 0.001, y: 0.0015, z: 0.0008 };

  // Player state
  const player = {
    face: 0, // index into faces
    u: 0,    // -1..1
    v: 0,
    health: 100,
    ammo: Infinity,
    jumpVel: 0
  };

  // Enemies
  const enemies = [];
  const enemyCount = 5;
  for (let i = 0; i < enemyCount; i++) {
    enemies.push({
      face: Math.floor(Math.random()*faces.length),
      u: Math.random()*2 - 1,
      v: Math.random()*2 - 1,
      size: 0.1
    });
  }

  // Input
  const keys = {};
  window.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
  window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

  let mousePos = { x: 0, y: 0 };
  canvas.addEventListener('pointermove', e => {
    const rect = canvas.getBoundingClientRect();
    mousePos = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  });
  let shooting = false;
  canvas.addEventListener('pointerdown', e => { shooting = true; initAudio(); });
  canvas.addEventListener('pointerup', e => shooting = false);

  // Audio via Web Audio API
  let audioCtx = null;
  function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  function playTone(freq, duration, type = 'sine') {
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  }

  // Math helpers
  function matVec(m, v) {
    return [
      m[0]*v[0] + m[1]*v[1] + m[2]*v[2],
      m[3]*v[0] + m[4]*v[1] + m[5]*v[2],
      m[6]*v[0] + m[7]*v[1] + m[8]*v[2]
    ];
  }
  function rotateX(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [1,0,0, 0,c,-s, 0,s,c];
  }
  function rotateY(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [c,0,s, 0,1,0, -s,0,c];
  }
  function rotateZ(a) {
    const c = Math.cos(a), s = Math.sin(a);
    return [c,-s,0, s,c,0, 0,0,1];
  }
  function mul(m1, m2) {
    return [
      m1[0]*m2[0] + m1[1]*m2[3] + m1[2]*m2[6],
      m1[0]*m2[1] + m1[1]*m2[4] + m1[2]*m2[7],
      m1[0]*m2[2] + m1[1]*m2[5] + m1[2]*m2[8],
      m1[3]*m2[0] + m1[4]*m2[3] + m1[5]*m2[6],
      m1[3]*m2[1] + m1[4]*m2[4] + m1[5]*m2[7],
      m1[3]*m2[2] + m1[4]*m2[5] + m1[5]*m2[8],
      m1[6]*m2[0] + m1[7]*m2[3] + m1[8]*m2[6],
      m1[6]*m2[1] + m1[7]*m2[4] + m1[8]*m2[7],
      m1[6]*m2[2] + m1[7]*m2[5] + m1[8]*m2[8]
    ];
  }
  function getRotationMatrix() {
    const rx = rotateX(rotation.x);
    const ry = rotateY(rotation.y);
    const rz = rotateZ(rotation.z);
    return mul(mul(rz, ry), rx);
  }
  function transformVec(m, v) { return matVec(m, v); }

  // World position of a point on a face
  function worldPos(faceIdx, u, v) {
    const f = faces[faceIdx];
    const m = getRotationMatrix();
    const n = transformVec(m, f.n);
    const tu = transformVec(m, f.u);
    const tv = transformVec(m, f.v);
    return [
      n[0] + tu[0]*u + tv[0]*v,
      n[1] + tu[1]*u + tv[1]*v,
      n[2] + tu[2]*u + tv[2]*v
    ];
  }

  // Simple 3D to 2D projection (perspective)
  function project(p) {
    const z = p[2] + 3; // offset camera
    if (z <= 0) return null;
    const scale = Math.min(canvas.width, canvas.height) / z * 150;
    return {
      x: canvas.width/2 + p[0]*scale,
      y: canvas.height/2 - p[1]*scale // y up in canvas
    };
  }

  // Update player movement
  function updatePlayer(dt) {
    const speed = 5 * dt;
    let du = 0, dv = 0;
    if (keys['w']) dv -= speed;
    if (keys['s']) dv += speed;
    if (keys['a']) du -= speed;
    if (keys['d']) du += speed;
    // Jump (space)
    if (keys[' ']) {
      player.jumpVel += 20 * dt;
      playTone(400, 0.1, 'square');
    } else {
      player.jumpVel *= 0.9;
    }
    // Apply jump as offset along face normal
    const f = faces[player.face];
    const m = getRotationMatrix();
    const n = transformVec(m, f.n);
    // temporary jump offset (we just modify u/v? we'll just add a visual bounce)
    // For simplicity, we just affect health display later.
    player.u = Math.max(-1, Math.min(1, player.u + du));
    player.v = Math.max(-1, Math.min(1, player.v + dv));
  }

  // Update enemies (simple chase)
  function updateEnemies(dt) {
    enemies.forEach(e => {
      // move towards player on same face (simplistic)
      const dx = player.u - e.u;
      const dy = player.v - e.v;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.01) {
        e.u += (dx/dist) * 2 * dt;
        e.v += (dy/dist) * 2 * dt;
      }
    });
  }

  // Shooting
  function updateShooting() {
    if (!shooting) return;
    // Aim direction from player to mouse (screen space) approximated as forward
    // We'll just create a projectile that travels forward from player face normal
    const f = faces[player.face];
    const m = getRotationMatrix();
    const n = transformVec(m, f.n);
    const start = worldPos(player.face, player.u, player.v);
    const vel = [n[0]*10, n[1]*10, n[2]*10];
    // simple raycast: check each enemy
    enemies.forEach((e, ei) => {
      const ePos = worldPos(e.face, e.u, e.v);
      const to = [ePos[0]-start[0], ePos[1]-start[1], ePos[2]-start[2]];
      // distance to line (simplify: if dot product >0 and length < threshold)
      const proj = to[0]*n[0] + to[1]*n[1] + to[2]*n[2];
      if (proj > 0) {
        const perp = [to[0]-n[0]*proj, to[1]-n[1]*proj, to[2]-n[2]*proj];
        const perpLen = Math.hypot(perp[0], perp[1], perp[2]);
        if (perpLen < 0.2) {
          // hit
          playTone(800, 0.05, 'triangle');
          enemies.splice(ei, 1);
          // spawn new
          enemies.push({
            face: Math.floor(Math.random()*faces.length),
            u: Math.random()*2 - 1,
            v: Math.random()*2 - 1,
            size: 0.1
          });
          // increase score
          let score = parseInt(localStorage.getItem('cubeShooterHS')||'0');
          score += 10;
          localStorage.setItem('cubeShooterHS', score);
          highScoreEl.textContent = score;
        }
      }
    });
    playTone(600, 0.07, 'sine');
  }

  // Timer
  let startTime = Date.now();
  function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime)/1000);
    timerEl.textContent = `${elapsed}s`;
  }

  // Render
  function render() {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // Draw cube faces as colored polygons (simple approximation)
    faces.forEach((f, idx) => {
      const m = getRotationMatrix();
      const n = transformVec(m, f.n);
      const tu = transformVec(m, f.u);
      const tv = transformVec(m, f.v);
      // four corners of face
      const corners = [
        [-1,-1], [1,-1], [1,1], [-1,1]
      ].map(uv => {
        const pos = [
          n[0] + tu[0]*uv[0] + tv[0]*uv[1],
          n[1] + tu[1]*uv[0] + tv[1]*uv[1],
          n[2] + tu[2]*uv[0] + tv[2]*uv[1]
        ];
        const p = project(pos);
        return p ? {x:p.x, y:p.y} : null;
      }).filter(p => p !== null);
      if (corners.length < 4) return;
      ctx.fillStyle = palette[idx % palette.length];
      ctx.beginPath();
      ctx.moveTo(corners[0].x, corners[0].y);
      for (let i=1;i<corners.length;i++) ctx.lineTo(corners[i].x, corners[i].y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.stroke();
    });
    // Draw player
    const pPos = worldPos(player.face, player.u, player.v);
    const pp = project(pPos);
    if (pp) {
      ctx.fillStyle = '#0ff';
      ctx.beginPath();
      ctx.arc(pp.x, pp.y, 8, 0, Math.PI*2);
      ctx.fill();
    }
    // Draw enemies
    enemies.forEach(e => {
      const ePos = worldPos(e.face, e.u, e.v);
      const ep = project(ePos);
      if (ep) {
        ctx.fillStyle = '#f00';
        ctx.beginPath();
        ctx.arc(ep.x, ep.y, 6, 0, Math.PI*2);
        ctx.fill();
      }
    });
    // HUD values
    healthEl.textContent = player.health;
    ammoEl.textContent = player.ammo === Infinity ? '∞' : player.ammo;
  }

  // Game loop
  function loop() {
    const now = performance.now();
    const dt = (now - loop.last) / 1000;
    loop.last = now;
    // update rotation
    rotation.x += rotSpeed.x * dt;
    rotation.y += rotSpeed.y * dt;
    rotation.z += rotSpeed.z * dt;
    updatePlayer(dt);
    updateEnemies(dt);
    updateShooting();
    updateTimer();
    render();
    requestAnimationFrame(loop);
  }
  loop.last = performance.now();
  requestAnimationFrame(loop);

  // Load high score
  const saved = localStorage.getItem('cubeShooterHS');
  if (saved) highScoreEl.textContent = saved;
})();
