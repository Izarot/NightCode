const CONFIG = {
  // Canvas
  DESIGN_WIDTH: 1024,
  DESIGN_HEIGHT: 768,
  // Physics
  GRAVITY: 9.81,
  TORQUE_TOLERANCE: 0.005, // 0.5%
  BALANCE_HOLD_TIME: 500, // ms
  // Colors
  COLORS: {
    bg: '#1a1a2e',
    seesaw: '#e94560',
    fulcrum: '#0f3460',
    slot: 'rgba(255,255,255,0.15)',
    slotActive: 'rgba(255,215,0,0.3)',
    weightLight: '#00d9ff',
    weightMedium: '#ff6b6b',
    weightHeavy: '#feca57',
    weightStroke: '#fff',
    uiText: '#fff',
    uiBg: 'rgba(0,0,0,0.7)',
    torqueLeft: '#00d9ff',
    torqueRight: '#ff6b6b',
    highlight: '#ffd700',
    particle: '#ffd700'
  },
  // Weight types
  WEIGHT_TYPES: [
    { id: 'light', mass: 0.5, radius: 18, color: '#00d9ff', label: '0.5kg' },
    { id: 'medium', mass: 1.0, radius: 24, color: '#ff6b6b', label: '1kg' },
    { id: 'heavy', mass: 2.0, radius: 30, color: '#feca57', label: '2kg' }
  ],
  // Seesaw geometry
  SEESAW: {
    length: 600,
    thickness: 12,
    fulcrumHeight: 40,
    slotCount: 4,
    slotWidth: 50,
    slotHeight: 30,
    slotMargin: 20
  },
  // Game
  MAX_WEIGHTS_PER_LEVEL: 5,
  HINT_COOLDOWN: 2000,
  STAR_THRESHOLDS: [30, 20, 10], // seconds for 1,2,3 stars (lower better)
  LEVEL_COUNT: 15
};

// Derived constants
CONFIG.SEESAW.halfLength = CONFIG.SEESAW.length / 2;
CONFIG.SEESAW.slotPositions = [];
for (let side = -1; side <= 1; side += 2) {
  for (let i = 0; i < CONFIG.SEESAW.slotCount; i++) {
    const dist = CONFIG.SEESAW.slotMargin + (i + 0.5) * (CONFIG.SEESAW.slotWidth + CONFIG.SEESAW.slotMargin);
    CONFIG.SEESAW.slotPositions.push({ side, index: i, distance: dist * side });
  }
}
