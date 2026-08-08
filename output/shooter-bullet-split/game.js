import { Player } from './player.js';
import { EnemyManager } from './enemies.js';
import { BulletManager } from './bullets.js';
import { AudioManager } from './audio.js';
import { UI } from './ui.js';

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

const player = new Player(width/2, height/2);
const enemyManager = new EnemyManager();
const bulletManager = new BulletManager();
const audio = new AudioManager();
const ui = new UI();

let keys = {};
let mouse = { x: 0, y: 0, button: false };
let lastTime = 0;
let waveCount = 0;
let score = 0;
let combo = 1;
let comboTimer = 0;
let startTime = Date.now();
let highScore = localStorage.getItem('highScore') || 0;

window.addEventListener('resize', () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
});

window.addEventListener('keydown', e => keys[e.key] = true);
window.addEventListener('keyup', e => keys[e.key] = false);

canvas.addEventListener('mousemove', e => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

canvas.addEventListener('mousedown', () => mouse.button = true);
canvas.addEventListener('mouseup', () => mouse.button = false);

function gameLoop(timestamp) {
    const dt = (timestamp - lastTime) / 1000;
    lastTime = timestamp;
    
    update(dt);
    render();
    requestAnimationFrame(gameLoop);
}

function update(dt) {
    player.update(dt, keys, mouse, width, height, bulletManager);
    enemyManager.update(dt, player, bulletManager);
    bulletManager.update(dt);
    
    if (mouse.button && bulletManager.canFire()) {
        bulletManager.fire(player.x, player.y, mouse.x, mouse.y, player.angle);
        audio.play('fire');
    }
    
    checkCollisions();
    updateUI(dt);
}

function checkCollisions() {
    bulletManager.bullets.forEach(bullet => {
        enemyManager.enemies.forEach(enemy => {
            if (dist(bullet.x, bullet.y, enemy.x, enemy.y) < bullet.radius + enemy.radius) {
                const damage = bullet.damage;
                enemy.hp -= damage;
                bullet.alive = false;
                
                if (enemy.hp <= 0) {
                    score += enemy.value;
                    combo++;
                    comboTimer = 2;
                    audio.play('explode');
                    enemyManager.destroy(enemy);
                    
                    if (Math.random() < 0.3) {
                        bulletManager.split(bullet.x, bullet.y, enemy.x, enemy.y, 0);
                    }
                }
            }
        });
    });
}

function dist(x1, y1, x2, y2) {
    return Math.sqrt((x2-x1)**2 + (y2-y1)**2);
}

function updateUI(dt) {
    comboTimer -= dt;
    if (comboTimer <= 0) combo = 1;
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const mins = Math.floor(elapsed / 60);
    const secs = elapsed % 60;
    ui.updateTimer(mins, secs);
    
    ui.updateHealth(player.hp, player.maxHp);
    ui.updateScore(score);
    ui.updateCombo(combo);
    
    if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
    }
}

function render() {
    ctx.clearRect(0, 0, width, height);
    
    ctx.fillStyle = '#1a0033';
    ctx.fillRect(0, 0, width, height);
    
    player.render(ctx);
    enemyManager.render(ctx);
    bulletManager.render(ctx);
}

requestAnimationFrame(gameLoop);