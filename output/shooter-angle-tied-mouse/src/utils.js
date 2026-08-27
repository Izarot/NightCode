export const CONFIG = {
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  PLAYER_MAX_SPEED: 600,
  PLAYER_ACCELERATION: 1200,
  PLAYER_FRICTION: 800,
  PLAYER_ROTATION_SPEED: 4,
  FIRE_RATE: 0.15,
  BULLET_SPEED: 900,
  BULLET_LIFETIME: 2.5,
  BULLET_RADIUS: 6,
  WAVE_INTERVAL: 30,
  COLORS: {
    bg: '#0a0a1a',
    bg2: '#1a1a3a',
    player: '#00ffff',
    playerOutline: '#ffffff',
    enemy: '#ff4444',
    enemy2: '#ff8800',
    enemy3: '#ff00ff',
    bullet: '#ffff00',
    explosion: '#ff6600',
    crosshair: '#ffffff',
    healthBg: 'rgba(50, 50, 50, 0.7)',
    healthHigh: '#00ff00',
    healthMid: '#ffff00',
    healthLow: '#ff0000',
    score: '#00ff88',
    pauseBtn: '#333355'
  }
};\n
export const Utils = {
  lerpAngle(a, b, t) {
    let diff = b - a;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return a + diff * t;
  },

  circleCollision(x1, y1, r1, x2, y2, r2) {
    const dx = x1 - x2;
    const dy = y1 - y2;
    const dist = Math.sqrt(dx * dx + dy * dy);
    return dist < r1 + r2;
  }
};
