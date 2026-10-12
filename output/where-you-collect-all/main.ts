// Velocity Vault - Precision Platformer / Time-Attack Arcade
// Logical resolution: 480x270
const LOGICAL_WIDTH = 480;
const LOGICAL_HEIGHT = 270;

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;
let offscreen: OffscreenCanvas;
let offscreenCtx: OffscreenCanvasRenderingContext2D;
let displayWidth: number, displayHeight: number;

// Game state
let gameState: 'MENU' | 'PLAYING' | 'PAUSED' | 'LEVEL_COMPLETE' | 'GAME_OVER' = 'MENU';
let levelTime = 0;
let bestTime = loadBestTime();
let coinCount = 0;
let totalCoins = 10; // For demo

// Input
const keys: { [key: string]: boolean } = {};

// Player
const player = {
    x: LOGICAL_WIDTH / 2,
    y: LOGICAL_HEIGHT - 50,
    width: 14,
    height: 26,
    velX: 0,
    velY: 0,
    grounded: false,
    facing: 1,
    health: 3,
    color: '#00FFAA'
};

// Simple platforms (y = constant)
const platforms = [
    { x: 0, y: LOGICAL_HEIGHT - 20, width: LOGICAL_WIDTH, height: 20 },
    { x: 100, y: LOGICAL_HEIGHT - 100, width: 100, height: 20 },
    { x: 300, y: LOGICAL_HEIGHT - 180, width: 100, height: 20 },
    { x: 150, y: LOGICAL_HEIGHT - 260, width: 100, height: 20 },
    { x: 350, y: LOGICAL_HEIGHT - 340, width: 100, height: 20 }
];

// Coins
const coins: { x: number; y: number; collected: boolean }[] = [
    { x: 150, y: LOGICAL_HEIGHT - 120, collected: false },
    { x: 350, y: LOGICAL_HEIGHT - 200, collected: false },
    { x: 250, y: LOGICAL_HEIGHT - 280, collected: false },
    { x: 100, y: LOGICAL_HEIGHT - 360, collected: false },
    { x: 400, y: LOGICAL_HEIGHT - 360, collected: false }
];

// Audio context
let audioCtx: AudioContext;

// Initialize
await init();

async function init() {
    canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    ctx = canvas.getContext('2d')!;
    
    // Setup offscreen canvas for integer scaling
    offscreen = new OffscreenCanvas(LOGICAL_WIDTH, LOGICAL_HEIGHT);
    offscreenCtx = offscreen.getContext('2d')!;
    
    resize();
    window.addEventListener('resize', resize);
    
    // Audio initialization (user gesture required)
    window.addEventListener('click', initAudio, { once: true });
    window.addEventListener('keydown', initAudio, { once: true });
    
    // Input listeners
    window.addEventListener('keydown', (e) => { keys[e.key] = true; });
    window.addEventListener('keyup', (e) => { keys[e.key] = false; });
    
    // Start game loop
    requestAnimationFrame(gameLoop);
}

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
}

function resize() {
    // Calculate scale to fit window while maintaining aspect ratio
    const scaleX = window.innerWidth / LOGICAL_WIDTH;
    const scaleY = window.innerHeight / LOGICAL_HEIGHT;
    const scale = Math.min(scaleX, scaleY);
    
    displayWidth = LOGICAL_WIDTH * scale;
    displayHeight = LOGICAL_HEIGHT * scale;
    
    canvas.style.width = `${displayWidth}px`;
    canvas.style.height = `${displayHeight}px`;
    canvas.style.left = `${(window.innerWidth - displayWidth) / 2}px`;
    canvas.style.top = `${(window.innerHeight - displayHeight) / 2}px`;
}

function gameLoop(timestamp: number) {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

function update() {
    if (gameState !== 'PLAYING') return;
    
    // Update timer
    levelTime += 1/60;
    
    // Player input
    const accel = player.grounded ? 4800 : 2400;
    const targetSpeed = (keys['ArrowRight'] || keys['d']) ? 220 : (keys['ArrowLeft'] || keys['a']) ? -220 : 0;
    player.velX = approach(player.velX, targetSpeed, accel * (1/60));
    
    // Apply friction
    if (!(keys['ArrowRight'] || keys['d'] || keys['ArrowLeft'] || keys['a'])) {
        const friction = player.grounded ? 28 : 2;
        player.velX = approach(player.velX, 0, friction * (1/60));
    }
    
    // Jump
    if ((keys[' '] || keys['ArrowUp'] || keys['w']) && player.grounded && !player.jumpBuffered) {
        player.velY = -520;
        player.grounded = false;
        playJumpSound();
        player.jumpBuffered = true;
        setTimeout(() => { player.jumpBuffered = false; }, 120); // Jump buffer
    }
    
    // Variable jump height
    if ((keys[' '] || keys['ArrowUp'] || keys['w']) === false && player.velY < 0) {
        player.velY *= 0.45;
    }
    
    // Apply gravity
    player.velY += 1800 * (1/60);
    
    // Clamp max speed
    player.velX = Math.max(-220, Math.min(220, player.velX));
    
    // Update position
    player.x += player.velX * (1/60);
    player.y += player.velY * (1/60);
    
    // Reset grounded
    player.grounded = false;
    
    // Platform collision
    for (const p of platforms) {
        if (rectRect(player, p)) {
            // Resolve collision
            if (player.velY > 0 && player.y + player.height/2 < p.y) {
                player.y = p.y - player.height;
                player.velY = 0;
                player.grounded = true;
            }
            else if (player.velY < 0 && player.y - player.height/2 > p.y + p.height) {
                player.y = p.y + p.height;
                player.velY = 0;
            }
            else if (player.velX > 0 && player.x + player.width/2 < p.x) {
                player.x = p.x - player.width/2;
                player.velX = 0;
            }
            else if (player.velX < 0 && player.x - player.width/2 > p.x + p.width) {
                player.x = p.x + p.width/2;
                player.velX = 0;
            }
        }
    }
    
    // World bounds
    if (player.x < 0) player.x = 0;
    if (player.x > LOGICAL_WIDTH) player.x = LOGICAL_WIDTH;
    if (player.y > LOGICAL_HEIGHT) {
        // Fall off world - reset position
        player.x = LOGICAL_WIDTH / 2;
        player.y = LOGICAL_HEIGHT - 50;
        player.velY = 0;
        player.health--;
        if (player.health <= 0) gameState = 'GAME_OVER';
    }
    
    // Coin collection
    for (const coin of coins) {
        if (!coin.collected && dist(player, coin) < 20) {
            coin.collected = true;
            coinCount++;
            playCoinSound();
            if (coinCount >= totalCoins) {
                gameState = 'LEVEL_COMPLETE';
                saveBestTime(levelTime);
                bestTime = loadBestTime();
            }
        }
    }
}

function render() {
    // Clear offscreen canvas
    offscreenCtx.fillStyle = '#1A1A2E';
    offscreenCtx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    
    if (gameState === 'MENU') {
        renderMenu();
    }
    else if (gameState === 'PLAYING') {
        renderGame();
    }
    else if (gameState === 'PAUSED') {
        renderGame();
        renderPauseOverlay();
    }
    else if (gameState === 'LEVEL_COMPLETE') {
        renderGame();
        renderCompleteOverlay();
    }
    else if (gameState === 'GAME_OVER') {
        renderGame();
        renderGameOverOverlay();
    }
    
    // Draw offscreen to canvas with scaling
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(offscreen, 0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT, 0, 0, canvas.width, canvas.height);
    ctx.restore();
}

function renderMenu() {
    offscreenCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    offscreenCtx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    
    offscreenCtx.fillStyle = '#00FFAA';
    offscreenCtx.font = '20px "Press Start 2P"';
    offscreenCtx.textAlign = 'center';
    offscreenCtx.fillText('VELOCITY VAULT', LOGICAL_WIDTH/2, LOGICAL_HEIGHT/3);
    
    offscreenCtx.fillStyle = '#E0E0E0';
    offscreenCtx.font = '16px "Press Start 2P"';
    offscreenCtx.fillText('Press Any Key to Start', LOGICAL_WIDTH/2, LOGICAL_HEIGHT/2);
    
    offscreenCtx.fillStyle = '#FFD700';
    offscreenCtx.font = '14px "Press Start 2P"';
    offscreenCtx.fillText(`Best Time: ${formatTime(bestTime)}`, LOGICAL_WIDTH/2, LOGICAL_HEIGHT/2 + 40);
}

function renderGame() {
    // Platforms
    offscreenCtx.fillStyle = '#E0E0E0';
    for (const p of platforms) {
        offscreenCtx.fillRect(p.x, p.y, p.width, p.height);
    }
    
    // Coins
    for (const coin of coins) {
        if (!coin.collected) {
            offscreenCtx.fillStyle = '#FFD700';
            offscreenCtx.beginPath();
            offscreenCtx.arc(coin.x, coin.y, 8, 0, Math.PI*2);
            offscreenCtx.fill();
            
            // Pulse animation
            const pulse = 1 + Math.sin(performance.now() * 0.004) * 0.15;
            offscreenCtx.save();
            offscreenCtx.globalCompositeOperation = 'lighter';
            offscreenCtx.fillStyle = 'rgba(255, 215, 0, 0.5)';
            offscreenCtx.beginPath();
            offscreenCtx.arc(coin.x, coin.y, 8 * pulse, 0, Math.PI*2);
            offscreenCtx.fill();
            offscreenCtx.restore();
        }
    }
    
    // Player
    offscreenCtx.fillStyle = player.color;
    offscreenCtx.fillRect(player.x - player.width/2, player.y - player.height/2, player.width, player.height);
    
    // HUD
    offscreenCtx.fillStyle = '#E0E0E0';
    offscreenCtx.font = '14px "Press Start 2P"';
    offscreenCtx.textAlign = 'left';
    offscreenCtx.fillText(`Coins: ${coinCount}/${totalCoins}`, 10, 20);
    
    offscreenCtx.textAlign = 'right';
    offscreenCtx.fillText(`Time: ${formatTime(levelTime)}`, LOGICAL_WIDTH - 10, 20);
    
    // Warning if time low
    if (levelTime > 30) { // Example threshold
        const pulse = 1 + Math.sin(performance.now() * 0.01) * 0.1;
        offscreenCtx.fillStyle = `rgba(255, 51, 102, ${0.5 * pulse})`;
        offscreenCtx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    }
}

function renderPauseOverlay() {
    offscreenCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    offscreenCtx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    
    offscreenCtx.fillStyle = '#00FFAA';
    offscreenCtx.font = '20px "Press Start 2P"';
    offscreenCtx.textAlign = 'center';
    offscreenCtx.fillText('PAUSED', LOGICAL_WIDTH/2, LOGICAL_HEIGHT/2 - 20);
    offscreenCtx.font = '16px "Press Start 2P"';
    offscreenCtx.fillText('Press P to Resume', LOGICAL_WIDTH/2, LOGICAL_HEIGHT/2 + 20);
}

function renderCompleteOverlay() {
    offscreenCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    offscreenCtx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    
    offscreenCtx.fillStyle = '#00FFAA';
    offscreenCtx.font = '20px "Press Start 2P"';
    offscreenCtx.textAlign = 'center';
    offscreenCtx.fillText('LEVEL COMPLETE!', LOGICAL_WIDTH/2, LOGICAL_HEIGHT/3);
    
    offscreenCtx.fillStyle = '#FFD700';
    offscreenCtx.font = '16px "Press Start 2P"';
    offscreenCtx.fillText(`Time: ${formatTime(levelTime)}`, LOGICAL_WIDTH/2, LOGICAL_HEIGHT/2);
    offscreenCtx.fillText(`Best: ${formatTime(bestTime)}`, LOGICAL_WIDTH/2, LOGICAL_HEIGHT/2 + 30);
    
    offscreenCtx.fillStyle = '#E0E0E0';
    offscreenCtx.font = '14px "Press Start 2P"';
    offscreenCtx.fillText('Press R to Retry or M for Menu', LOGICAL_WIDTH/2, LOGICAL_HEIGHT/2 + 80);
}

function renderGameOverOverlay() {
    offscreenCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    offscreenCtx.fillRect(0, 0, LOGICAL_WIDTH, LOGICAL_HEIGHT);
    
    offscreenCtx.fillStyle = '#FF3366';
    offscreenCtx.font = '20px "Press Start 2P"';
    offscreenCtx.textAlign = 'center';
    offscreenCtx.fillText('GAME OVER', LOGICAL_WIDTH/2, LOGICAL_HEIGHT/3);
    
    offscreenCtx.fillStyle = '#E0E0E0';
    offscreenCtx.font = '16px "Press Start 2P"';
    offscreenCtx.fillText(`Time: ${formatTime(levelTime)}`, LOGICAL_WIDTH/2, LOGICAL_HEIGHT/2);
    offscreenCtx.fillText(`Coins: ${coinCount}/${totalCoins}`, LOGICAL_WIDTH/2, LOGICAL_HEIGHT/2 + 30);
    
    offscreenCtx.fillStyle = '#E0E0E0';
    offscreenCtx.font = '14px "Press Start 2P"';
    offscreenCtx.fillText('Press R to Retry or M for Menu', LOGICAL_WIDTH/2, LOGICAL_HEIGHT/2 + 80);
}

// Helper functions
function approach(current: number, target: number, amount: number) {
    if (current < target) return Math.min(current + amount, target);
    if (current > target) return Math.max(current - amount, target);
    return current;
}

function rectRect(a: any, b: any) {
    return a.x < b.x + b.width &&
           a.x + a.width > b.x &&
           a.y < b.y + b.height &&
           a.y + a.height > b.y;
}

function dist(a: any, b: any) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx*dx + dy*dy);
}

function formatTime(t: number): string {
    const minutes = Math.floor(t / 60);
    const seconds = Math.floor(t % 60);
    const centiseconds = Math.floor((t * 100) % 100);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${centiseconds.toString().padStart(2, '0')}`;
}

function loadBestTime(): number {
    const saved = localStorage.getItem('velocityVaultBestTime');
    return saved ? parseFloat(saved) : 999999;
}

function saveBestTime(time: number) {
    if (time < loadBestTime()) {
        localStorage.setItem('velocityVaultBestTime', time.toString());
    }
}

// Sound effects
function playJumpSound() {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'square';
    oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    
    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
}

function playCoinSound() {
    if (!audioCtx) return;
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1760, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.001, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.2);
    
    oscillator.connect(gainNode).connect(audioCtx.destination);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
}

// Handle menu/input
window.addEventListener('keydown', (e) => {
    if (gameState === 'MENU' && e.key !== 'Shift') {
        gameState = 'PLAYING';
        levelTime = 0;
        coinCount = 0;
        // Reset coins
        for (const c of coins) c.collected = false;
    }
    if (gameState === 'PAUSED' && e.key === 'p') {
        gameState = 'PLAYING';
    }
    if ((gameState === 'LEVEL_COMPLETE' || gameState === 'GAME_OVER') && (e.key === 'r' || e.key === 'm')) {
        if (e.key === 'r') {
            gameState = 'PLAYING';
            levelTime = 0;
            coinCount = 0;
            player.x = LOGICAL_WIDTH / 2;
            player.y = LOGICAL_HEIGHT - 50;
            player.velX = 0;
            player.velY = 0;
            player.health = 3;
            for (const c of coins) c.collected = false;
        } else if (e.key === 'm') {
            gameState = 'MENU';
        }
    }
});

// Prevent scrolling with arrow keys
window.addEventListener('keydown', (e) => {
    if (["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"," "].includes(e.key)) {
        e.preventDefault();
    }
});
}