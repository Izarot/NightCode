const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const LOGICAL_W = 1280, LOGICAL_H = 720;
let scale = 1;
function resize() {
  scale = Math.min(window.innerWidth / LOGICAL_W, window.innerHeight / LOGICAL_H);
  canvas.style.width = (LOGICAL_W * scale) + 'px';
  canvas.style.height = (LOGICAL_H * scale) + 'px';
  canvas.width = LOGICAL_W;
  canvas.height = LOGICAL_H;
}
window.addEventListener('resize', resize);
resize();

// Isometric projection helpers
const ISO_ANGLE = Math.PI / 6; // 30 degrees
const TILE_W = 64, TILE_H = 32; // 2:1 ratio
function worldToScreen(x, y, z) {
  const sx = (x - y) * (TILE_W / 2);
  const sy = (x + y) * (TILE_H / 2) - z * TILE_H;
  return { x: sx, y: sy };
}
function screenToWorld(sx, sy, cam) {
  // inverse of worldToScreen with camera offset
  const wx = (sx / (TILE_W/2) + sy / (TILE_H/2)) / 2;
  const wy = (sy / (TILE_H/2) - sx / (TILE_W/2)) / 2;
  return { x: wx, y: wy };
}

// Camera
const cam = { x: 0, y: 0, zoom: 1, targetX: 0, targetY: 0, targetZoom: 1, angle: 0 };
const WORKBOX = 32;

// Voxel storage: sparse map key "x,y,z" -> { material, faces: {top,left,right}, layer }
const voxels = new Map();
const MATERIALS = [
  {id:0,name:'Clay',color:'#d4a574',spec:0.2,emissive:false,transparent:false},
  {id:1,name:'Metal',color:'#b0b0b0',spec:0.8,emissive:false,transparent:false},
  {id:2,name:'Glass',color:'#88ccff',spec:0.9,emissive:false,transparent:true},
  {id:3,name:'Wood',color:'#8b5a2b',spec:0.1,emissive:false,transparent:false},
  {id:4,name:'Neon',color:'#ff00ff',spec:0.5,emissive:true,transparent:false},
  {id:5,name:'Rubber',color:'#444444',spec:0.05,emissive:false,transparent:false},
  {id:6,name:'Stone',color:'#888888',spec:0.15,emissive:false,transparent:false},
  {id:7,name:'Glow',color:'#ffff00',spec:0.3,emissive:true,transparent:false}
];
let currentMaterial = 0;
let currentTool = 'select';
let brushSize = 1;
let selection = new Set();
let dragStart = null;
let isPanning = false;
let lastTime = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem('voxelHighScore')) || 0;
let timer = 0;
let timerRunning = false;
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playTone(freq, dur, type='sine') {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = 0.1; g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + dur);
  o.connect(g).connect(audioCtx.destination);
  o.start(); o.stop(audioCtx.currentTime + dur);
}

// Undo/Redo
const history = [];
let historyIndex = -1;
const MAX_HISTORY = 50;
function saveState(desc) {
  const state = { voxels: new Map(voxels), selection: new Set(selection), score };
  history.splice(historyIndex + 1);
  history.push(state);
  if (history.length > MAX_HISTORY) history.shift();
  else historyIndex++;
}
function undo() {
  if (historyIndex > 0) {
    historyIndex--;
    restoreState(history[historyIndex]);
  }
}
function redo() {
  if (historyIndex < history.length - 1) {
    historyIndex++;
    restoreState(history[historyIndex]);
  }
}
function restoreState(state) {
  voxels.clear();
  state.voxels.forEach((v,k)=>voxels.set(k,v));
  selection.clear();
  state.selection.forEach(k=>selection.add(k));
  score = state.score;
  updateUI();
}

// UI
const paletteEl = document.getElementById('material-palette');
MATERIALS.forEach(m => {
  const div = document.createElement('div');
  div.className = 'material-swatch' + (m.id===currentMaterial?' selected':'');
  div.style.background = m.color;
  div.dataset.id = m.id;
  div.dataset.name = m.name;
  div.addEventListener('click',()=>{currentMaterial=m.id;updatePalette();});
  paletteEl.appendChild(div);
});
function updatePalette() {
  document.querySelectorAll('.material-swatch').forEach(el=>{
    el.classList.toggle('selected', parseInt(el.dataset.id)===currentMaterial);
  });
}
function updateUI() {
  document.getElementById('voxel-count').textContent = `Voxels: ${voxels.size}/32768`;
  document.getElementById('score').textContent = `Score: ${score}`;
  document.getElementById('high-score').textContent = `Best: ${highScore}`;
  const sel = selection.size ? `Selection: ${selection.size} voxels` : 'Selection: None';
  document.getElementById('properties-panel').textContent = sel;
}
updateUI();
updatePalette();

// Tool buttons
document.querySelectorAll('.tool-btn').forEach(btn=>{
  btn.addEventListener('click',()=>{
    document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentTool = btn.dataset.tool;
  });
});

// Keyboard shortcuts
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undo(); }
  else if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redo(); }
  else if (e.key >= '1' && e.key <= '6') {
    const tools = ['select','sculpt','erase','paint','eyedropper','orbit'];
    currentTool = tools[parseInt(e.key)-1];
    document.querySelectorAll('.tool-btn').forEach(b=>b.classList.toggle('active', b.dataset.tool===currentTool));
  }
  else if (e.key === 'q' || e.key === 'e') {
    cam.targetAngle = (cam.targetAngle || 0) + (e.key==='q'? -Math.PI/2 : Math.PI/2);
  }
  else if (e.key === 'Delete') {
    if (selection.size) { saveState('delete'); selection.forEach(k=>voxels.delete(k)); selection.clear(); updateUI(); playTone(200,0.1,'square'); }
  }
  else if (e.ctrlKey && e.key === 'd') { duplicateSelection(); }
  else if (e.ctrlKey && e.key === 's') { e.preventDefault(); exportPNG(); }
});

// Mouse events
canvas.addEventListener('mousedown', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / scale;
  const my = (e.clientY - rect.top) / scale;
  const world = screenToWorld(mx - LOGICAL_W/2 - cam.x, my - LOGICAL_H/2 - cam.y, cam);
  const gx = Math.round(world.x), gy = Math.round(world.y);
  if (e.button === 1 || (e.button === 0 && e.altKey)) { isPanning = true; dragStart = {mx, my, camX: cam.x, camY: cam.y}; return; }
  if (currentTool === 'select') {
    dragStart = {mx, my, worldX: gx, worldY: gy, selecting: true};
  } else if (currentTool === 'sculpt') {
    tryPlaceVoxel(gx, gy);
  } else if (currentTool === 'erase') {
    tryRemoveVoxel(gx, gy);
  } else if (currentTool === 'paint') {
    paintFace(gx, gy, mx, my);
  }
});
window.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / scale;
  const my = (e.clientY - rect.top) / scale;
  const world = screenToWorld(mx - LOGICAL_W/2 - cam.x, my - LOGICAL_H/2 - cam.y, cam);
  document.getElementById('coords').textContent = `X:${Math.round(world.x)} Y:${Math.round(world.y)} Z:${0}`;
  if (isPanning) {
    cam.targetX = dragStart.camX + (mx - dragStart.mx);
    cam.targetY = dragStart.camY + (my - dragStart.my);
  } else if (dragStart && dragStart.selecting) {
    // marquee selection
    const x1 = dragStart.worldX, y1 = dragStart.worldY;
    const x2 = Math.round(world.x), y2 = Math.round(world.y);
    const minX = Math.min(x1,x2), maxX = Math.max(x1,x2);
    const minY = Math.min(y1,y2), maxY = Math.max(y1,y2);
    selection.clear();
    voxels.forEach((v,k)=>{const [vx,vy,vz]=k.split(',').map(Number); if(vx>=minX&&vx<=maxX&&vy>=minY&&vy<=maxY) selection.add(k);});
    updateUI();
  }
});
window.addEventListener('mouseup', e => {
  isPanning = false;
  dragStart = null;
});
canvas.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) / scale;
  const my = (e.clientY - rect.top) / scale;
  const factor = e.deltaY > 0 ? 0.9 : 1.1;
  cam.targetZoom = Math.max(0.5, Math.min(3, cam.targetZoom * factor));
});
canvas.addEventListener('contextmenu', e => e.preventDefault());

// Voxel operations
function key(x,y,z) { return `${x},${y},${z}`; }
function tryPlaceVoxel(gx, gy) {
  // find highest empty z at (gx,gy) up to WORKBOX
  for (let z = 0; z < WORKBOX; z++) {
    const k = key(gx,gy,z);
    if (!voxels.has(k)) {
      saveState('place');
      voxels.set(k, { material: currentMaterial, faces: {top:currentMaterial,left:currentMaterial,right:currentMaterial}, layer:0 });
      score++;
      if (score > highScore) { highScore = score; localStorage.setItem('voxelHighScore', highScore); }
      if (!timerRunning) { timerRunning = true; lastTime = performance.now(); }
      playTone(440, 0.05);
      updateUI();
      return;
    }
  }
}
function tryRemoveVoxel(gx, gy) {
  // remove topmost voxel at (gx,gy)
  for (let z = WORKBOX-1; z >= 0; z--) {
    const k = key(gx,gy,z);
    if (voxels.has(k)) {
      saveState('remove');
      voxels.delete(k);
      playTone(220, 0.05, 'square');
      updateUI();
      return;
    }
  }
}
function paintFace(gx, gy, mx, my) {
  // find topmost voxel and determine which face clicked (simplified: top face)
  for (let z = WORKBOX-1; z >= 0; z--) {
    const k = key(gx,gy,z);
    if (voxels.has(k)) {
      saveState('paint');
      const v = voxels.get(k);
      v.faces.top = currentMaterial;
      voxels.set(k, v);
      updateUI();
      return;
    }
  }
}
function duplicateSelection() {
  if (!selection.size) return;
  saveState('duplicate');
  const newSel = new Set();
  selection.forEach(k => {
    const [x,y,z] = k.split(',').map(Number);
    const nk = key(x+2, y, z);
    if (!voxels.has(nk)) {
      voxels.set(nk, {...voxels.get(k)});
      newSel.add(nk);
    }
  });
  selection = newSel;
  updateUI();
}
function exportPNG() {
  const link = document.createElement('a');
  link.download = 'voxel-sculptor.png';
  link.href = canvas.toDataURL('image/png');
  link.click();
}
document.getElementById('export-png').addEventListener('click', exportPNG);
document.getElementById('save-project').addEventListener('click', () => {
  const data = { voxels: Array.from(voxels.entries()), score, highScore };
  localStorage.setItem('voxelProject', JSON.stringify(data));
  alert('Project saved to localStorage');
});
document.getElementById('undo-btn').addEventListener('click', undo);
document.getElementById('redo-btn').addEventListener('click', redo);

// Rendering
function render() {
  // smooth camera
  cam.x += (cam.targetX - cam.x) * 0.15;
  cam.y += (cam.targetY - cam.y) * 0.15;
  cam.zoom += (cam.targetZoom - cam.zoom) * 0.15;
  if (cam.targetAngle !== undefined) {
    cam.angle += (cam.targetAngle - cam.angle) * 0.1;
    if (Math.abs(cam.targetAngle - cam.angle) < 0.01) { cam.angle = cam.targetAngle; delete cam.targetAngle; }
  }
  
  ctx.setTransform(1,0,0,1,0,0);
  ctx.clearRect(0,0,LOGICAL_W,LOGICAL_H);
  ctx.translate(LOGICAL_W/2 + cam.x, LOGICAL_H/2 + cam.y);
  ctx.scale(cam.zoom, cam.zoom);
  
  // draw grid floor
  ctx.strokeStyle = '#00f2ff11';
  ctx.lineWidth = 1;
  for (let i = -WORKBOX; i <= WORKBOX; i++) {
    const p1 = worldToScreen(i, -WORKBOX, 0);
    const p2 = worldToScreen(i, WORKBOX, 0);
    ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.stroke();
    const p3 = worldToScreen(-WORKBOX, i, 0);
    const p4 = worldToScreen(WORKBOX, i, 0);
    ctx.beginPath(); ctx.moveTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y); ctx.stroke();
  }
  // axis indicators
  ctx.strokeStyle = '#ff000088'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(...Object.values(worldToScreen(WORKBOX,0,0))); ctx.stroke();
  ctx.strokeStyle = '#00ff0088'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(...Object.values(worldToScreen(0,WORKBOX,0))); ctx.stroke();
  ctx.strokeStyle = '#0000ff88'; ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(0, -WORKBOX*TILE_H); ctx.stroke();
  
  // sort voxels by depth (y + z)
  const sorted = Array.from(voxels.entries()).sort((a,b)=>{
    const [ax,ay,az]=a[0].split(',').map(Number);
    const [bx,by,bz]=b[0].split(',').map(Number);
    return (ay+az) - (by+bz);
  });
  
  sorted.forEach(([k, v]) => {
    const [x,y,z] = k.split(',').map(Number);
    const base = worldToScreen(x, y, z);
    const mat = MATERIALS[v.material];
    const faceMats = { top: MATERIALS[v.faces.top], left: MATERIALS[v.faces.left], right: MATERIALS[v.faces.right] };
    // draw three visible faces: top, left, right
    // top face
    drawFace(ctx, base, faceMats.top, 'top', v.material===4||v.material===7);
    // left face
    drawFace(ctx, base, faceMats.left, 'left', v.material===4||v.material===7);
    // right face
    drawFace(ctx, base, faceMats.right, 'right', v.material===4||v.material===7);
    
    // selection highlight
    if (selection.has(k)) {
      ctx.strokeStyle = '#00f2ff';
      ctx.lineWidth = 2;
      ctx.strokeRect(base.x - TILE_W/2, base.y - TILE_H, TILE_W, TILE_H);
    }
  });
  
  // timer
  if (timerRunning) {
    timer = (performance.now() - lastTime) / 1000;
    document.getElementById('timer').textContent = `Time: ${timer.toFixed(1)}s`;
  }
  
  requestAnimationFrame(render);
}
function drawFace(ctx, base, mat, face, emissive) {
  const hw = TILE_W/2, hh = TILE_H/2;
  let pts = [];
  if (face === 'top') {
    pts = [{x:base.x-hw,y:base.y-hh},{x:base.x,y:base.y-hh-hh},{x:base.x+hw,y:base.y-hh},{x:base.x,y:base.y}];
  } else if (face === 'left') {
    pts = [{x:base.x-hw,y:base.y-hh},{x:base.x,y:base.y},{x:base.x,y:base.y+TILE_H},{x:base.x-hw,y:base.y+hh}];
  } else {
    pts = [{x:base.x,y:base.y-hh-hh},{x:base.x+hw,y:base.y-hh},{x:base.x+hw,y:base.y+hh},{x:base.x,y:base.y}];
  }
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  pts.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));
  ctx.closePath();
  // lighting
  let shade = 1;
  if (face === 'top') shade = 1;
  else if (face === 'left') shade = 0.7;
  else shade = 0.5;
  if (emissive) shade = 1;
  const c = hexToRgb(mat.color);
  ctx.fillStyle = `rgb(${Math.round(c.r*shade)},${Math.round(c.g*shade)},${Math.round(c.b*shade)})`;
  ctx.fill();
  if (emissive) {
    ctx.shadowColor = mat.color;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.strokeStyle = '#00000044';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}
function hexToRgb(hex) {
  const m = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  return m ? {r:parseInt(m[1],16),g:parseInt(m[2],16),b:parseInt(m[3],16)} : {r:255,g:255,b:255};
}

render();
console.log('Voxel Sculptor ready');