// Rendering: Layers, Particles, Neon
const layers={floor:null,wall:null,ceil:null};
const particles=[];
function initLayers(){const c=document.getElementById('c');layers.floor=c.getContext('2d');layers.wall=c.getContext('2d');layers.ceil=c.getContext('2d');}
function drawNeon(ctx,x,y,r,color){const grad=ctx.createRadialGradient(x,y,0,x,y,r);grad.addColorStop(0,color);grad.addColorStop(1,'transparent');ctx.fillStyle=grad;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();}
function drawTower(t){const ctx=layers[t.surface];ctx.fillStyle=t.surface==='floor'?'#ff00ff':t.surface==='wall'?'#00ffff':'#8800ff';ctx.fillRect(t.x,t.y,GRID,GRID);}
function drawEnemy(e){const ctx=layers[e.surface];ctx.fillStyle='#ff4444';ctx.beginPath();ctx.arc(e.x,e.y,8,0,Math.PI*2);ctx.fill();}
function drawOrb(o){if(o.collected)return;const ctx=layers.floor;ctx.fillStyle='#ffff00';ctx.beginPath();ctx.arc(o.x,o.y,5,0,Math.PI*2);ctx.fill();}
function render(){for(const l in layers){const ctx=layers[l];ctx.clearRect(0,0,800,600);ctx.save();ctx.scale(camera.zoom,camera.zoom);ctx.translate(-camera.x,-camera.y);for(const t of towers)drawTower(t);for(const e of enemies)drawEnemy(e);for(const o of orbs)drawOrb(o);ctx.restore();}}
