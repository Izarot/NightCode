const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let ship = {x:100, y:300, vx:0, vy:0, angle:0};
function update() {
  ship.x += ship.vx;
  ship.y += ship.vy;
  ship.vx *= 0.98;
  ship.vy *= 0.98;
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.save();
  ctx.translate(ship.x, ship.y);
  ctx.rotate(ship.angle);
  ctx.fillStyle = '#0ff';
  ctx.beginPath();
  ctx.moveTo(10,0);
  ctx.lineTo(-10,5);
  ctx.lineTo(-10,-5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  requestAnimationFrame(update);
}
update();