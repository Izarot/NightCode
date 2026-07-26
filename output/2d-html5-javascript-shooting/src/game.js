import { Player } from './player.js';
import { EnemyManager } from './enemy.js';
import { UI } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const player = new Player(canvas.width / 2, canvas.height - 50);
const enemies = new EnemyManager();
const ui = new UI();

let lastTime = 0;
function gameLoop(timestamp) {
    const delta = timestamp - lastTime;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    player.update(delta);
    player.draw(ctx);

    enemies.update(delta);
    enemies.draw(ctx);

    ui.update(player.score);
    ui.draw(ctx);

    requestAnimationFrame(gameLoop);
}

canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    player.shoot(x, y);
});

requestAnimationFrame(gameLoop);