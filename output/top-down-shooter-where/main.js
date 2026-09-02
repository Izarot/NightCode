// Main game loop
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize(){
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

// Simple player
const player = {
  x: canvas.width/2,
  y: canvas.height - 50,
  width: 40,
  height: 40,
  color: '#ff6b6b'
};

function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.fillStyle = player.color;
  ctx.fillRect(player.x, player.y, player.width, player.height);
}

function update(){}

function gameLoop(timestamp){
  update();
  draw();
  requestAnimationFrame(gameLoop);
}
requestAnimationFrame(gameLoop);