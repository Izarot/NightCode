// FlexiForm: Safe Stretch Simulator
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let width, height, scale;

// Game State
let state = 'idle';
let currentTime = 0;
let levelTime = 60;
let highScore = 0;
let fatigue = 0;
let safety = 100;
let isPaused = false;
let selectedStretch = null;
let targetPoses = [];
let currentPoseIndex = 0;
let particles = [];
let wobbleOffset = 0;
let lastTimestamp = 0;

// Physics Constants
const STIFFNESS = 15;
const DAMPING = 2;
const MAX_TORQUE = 30;
const FATIGUE_ALPHA = 0.01;
const FATIGUE_BETA = 0.005;
const FATIGUE_GAMMA = 0.2;
const FATIGUE_MAX = 100;
const GRAVITY = 0.5;
const FRICTION = 0.6;

// Skeleton Structure
const skeleton = {
    bones: [],
    joints: [],
    avatar: {
        x: 0,
        y: 0,
        angle: 0,
        scale: 1
    }
};

// Initialize Canvas
function initCanvas() {
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;
    scale = Math.min(width / 800, height / 600);
    skeleton.avatar.x = width / 2;
    skeleton.avatar.y = height * 0.6;
}

// Avatar Setup
function createSkeleton() {
    const segments = [
        { name: 'head', length: 20, mass: 2, restAngle: 0, safeRange: [-30, 30] },
        { name: 'neck', length: 15, mass: 2, restAngle: 0, safeRange: [-15, 15] },
        { name: 'torso', length: 50, mass: 5, restAngle: 0, safeRange: [-10, 10] },
        { name: 'leftArm', length: 35, mass: 3, restAngle: 0, safeRange: [-90, 90] },
        { name: 'rightArm', length: 35, mass: 3, restAngle: 0, safeRange: [-90, 90] },
        { name: 'leftLeg', length: 45, mass: 4, restAngle: 0, safeRange: [-60, 60] },
        { name: 'rightLeg', length: 45, mass: 4, restAngle: 0, safeRange: [-60, 60] }
    ];

    skeleton.bones = segments.map((seg, i) => ({
        name: seg.name,
        length: seg.length * scale,
        mass: seg.mass,
        restAngle: seg.restAngle * Math.PI / 180,
        safeMin: seg.safeRange[0] * Math.PI / 180,
        safeMax: seg.safeRange[1] * Math.PI / 180,
        angle: seg.restAngle,
        velocity: 0,
        parent: i > 0 ? i - 1 : -1,
        child: i < segments.length - 1 ? i + 1 : -1
    }));
}

// Physics Update
function updatePhysics(dt) {
    for (let i = 0; i < skeleton.bones.length; i++) {
        const bone = skeleton.bones[i];
        const parent = bone.parent;

        if (parent >= 0) {
            const parentBone = skeleton.bones[parent];
            const targetAngle = selectedStretch?.targetAngles?.[i] || bone.restAngle;
            const angleDiff = targetAngle - bone.angle;
            const torque = Math.max(-MAX_TORQUE, Math.min(MAX_TORQUE, STIFFNESS * angleDiff - DAMPING * bone.velocity));
            bone.velocity += torque * dt;
            bone.angle += bone.velocity * dt;
            bone.velocity *= 0.98;
        }
    }

    // Update Fatigue
    if (state === 'stretching') {
        fatigue = Math.min(FATIGUE_MAX, fatigue + FATIGUE_ALPHA * Math.abs(MAX_TORQUE) * dt + FATIGUE_BETA * dt);
    } else if (state === 'recovering') {
        fatigue *= Math.exp(-FATIGUE_GAMMA * dt);
    }

    // Update Safety
    let minSafety = 100;
    for (const bone of skeleton.bones) {
        const safeCenter = (bone.safeMin + bone.safeMax) / 2;
        const safeRange = (bone.safeMax - bone.safeMin) / 2;
        const safetyFactor = 1 - Math.abs(bone.angle - safeCenter) / safeRange;
        minSafety = Math.min(minSafety, safetyFactor * 100);
    }
    safety = minSafety;

    // Wobble Effect
    if (safety < 50) {
        wobbleOffset = Math.sin(currentTime * 10) * 3 * scale;
    } else {
        wobbleOffset = 0;
    }
}

// Particle System
function createParticle(x, y, color) {
    particles.push({
        x, y,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        life: 1,
        color
    });
}

function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt;
        if (p.life <= 0) particles.splice(i, 1);
    }
}

// Rendering
function render() {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(skeleton.avatar.x, skeleton.avatar.y);
    ctx.scale(scale, scale);
    ctx.translate(-400, -300);

    // Draw Background Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    for (let x = 0; x < 800; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 600);
        ctx.stroke();
    }
    for (let y = 0; y < 600; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
    }

    // Draw Skeleton
    let currentX = 400;
    let currentY = 500;
    let cumulativeAngle = 0;

    for (let i = 0; i < skeleton.bones.length; i++) {
        const bone = skeleton.bones[i];
        const prevBone = skeleton.bones[i - 1] || { x: 0, y: 0, angle: 0 };

        const boneColor = safety > 70 ? '#4CAF50' : safety > 40 ? '#FFC107' : '#F44336';
        const nextX = currentX + Math.cos(cumulativeAngle) * bone.length;
        const nextY = currentY - Math.sin(cumulativeAngle) * bone.length;

        // Draw Bone
        ctx.beginPath();
        ctx.moveTo(currentX, currentY);
        ctx.lineTo(nextX, nextY);
        ctx.strokeStyle = boneColor;
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();

        // Draw Joint
        ctx.beginPath();
        ctx.arc(nextX, nextY, 10, 0, Math.PI * 2);
        ctx.fillStyle = boneColor;
        ctx.fill();

        currentX = nextX;
        currentY = nextY;
        cumulativeAngle += bone.angle - bone.restAngle;
    }

    // Draw Particles
    for (const p of particles) {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
}

// Game Loop
function gameLoop(timestamp) {
    if (!lastTimestamp) lastTimestamp = timestamp;
    const dt = (timestamp - lastTimestamp) / 1000;
    lastTimestamp = timestamp;

    if (!isPaused) {
        currentTime += dt;
        updatePhysics(dt);
        updateParticles(dt);
    }

    render();
    updateUI();

    if (state !== 'complete') {
        requestAnimationFrame(gameLoop);
    }
}

// UI Updates
function updateUI() {
    document.getElementById('speedrunTimer').textContent = formatTime(currentTime);
    document.getElementById('safetyMeter').style.width = `${safety}%`;
    document.getElementById('fatigueMeter').style.width = `${fatigue}%`;
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// Input Handling
let dragging = false;
let dragBoneIndex = -1;

canvas.addEventListener('mousedown', startDrag);
canvas.addEventListener('mousemove', drag);
canvas.addEventListener('mouseup', endDrag);
canvas.addEventListener('touchstart', handleTouchStart);
canvas.addEventListener('touchmove', handleTouchMove);
canvas.addEventListener('touchend', handleTouchEnd);

function startDrag(e) {
    if (state !== 'stretching') return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Simplified drag detection
    dragging = true;
}

function drag(e) {
    if (!dragging) return;
    // Update target angles based on drag position
}

function endDrag() {
    dragging = false;
}

function handleTouchStart(e) {
    e.preventDefault();
    // Multi-touch handling
}

function handleTouchMove(e) {
    e.preventDefault();
}

function handleTouchEnd(e) {
    e.preventDefault();
}

// Button Handlers
document.getElementById('resetBtn').addEventListener('click', () => {
    resetPose();
});

document.getElementById('pauseBtn').addEventListener('click', () => {
    togglePause();
});

document.getElementById('stretchLibraryBtn').addEventListener('click', () => {
    showLibrary();
});

document.getElementById('hintBtn').addEventListener('click', () => {
    showHint();
});

document.getElementById('resumeBtn').addEventListener('click', () => {
    togglePause();
});

document.getElementById('restartBtn').addEventListener('click', () => {
    restartLevel();
});

document.getElementById('settingsBtn').addEventListener('click', () => {
    showSettings();
});

document.getElementById('exitBtn').addEventListener('click', () => {
    exitGame();
});

function resetPose() {
    for (const bone of skeleton.bones) {
        bone.angle = bone.restAngle;
        bone.velocity = 0;
    }
    state = 'recovering';
}

function togglePause() {
    isPaused = !isPaused;
    document.getElementById('modal').style.display = isPaused ? 'flex' : 'none';
}

function showLibrary() {
    // Show stretch selection modal
}

function showHint() {
    // Highlight safe ranges
}

function showSettings() {
    // Show settings modal
}

function restartLevel() {
    currentTime = 0;
    fatigue = 0;
    safety = 100;
    state = 'idle';
    togglePause();
}

function exitGame() {
    // Reset to main menu
}

// Sound Effects
const audioContext = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, duration) {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';
    oscillator.start();
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
    oscillator.stop(audioContext.currentTime + duration);
}

// High Score Management
function saveHighScore() {
    localStorage.setItem('flexiform_highscore', Math.max(highScore, currentTime));
}

function loadHighScore() {
    const saved = localStorage.getItem('flexiform_highscore');
    if (saved) highScore = parseFloat(saved);
}

// Initialize
createSkeleton();
loadHighScore();
initCanvas();
playSound(440, 0.1); // Startup sound