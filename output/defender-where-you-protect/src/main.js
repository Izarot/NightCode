const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const config = { cityHp: 5000, playerMaxSpeed: 8, enemyDamage: 25 };
function loop() { ctx.clearRect(0,0,1280,720); requestAnimationFrame(loop); }
requestAnimationFrame(loop);