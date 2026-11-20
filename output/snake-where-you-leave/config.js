export const CONFIG = {
  // Grid
  GRID_SIZE: 20,
  CELL_SIZE: 40,
  CANVAS_SIZE: 800,

  // Timing
  INITIAL_TICK_MS: 100,
  MIN_TICK_MS: 40,
  TICK_DECREASE_MS: 5,

  // Slime
  SLIME_FADE_MS: 3000,
  SLIME_STALE_MS: 4000,
  MAX_SLIME_TILES: 400,

  // Physics
  SLIP_EXTRA_CELLS: 0.5,
  SLIP_LOCK_TICKS: 1,

  // Viscosity
  VISCOSITY_PER_FOOD: 10,
  VISCOSITY_MAX: 100,
  BOOST_DURATION_MS: 3000,
  BOOST_SPEED_MULTIPLIER: 0.5,
  BOOST_SLIME_MULTIPLIER: 2,

  // Visual
  COLORS: {
    BG: '#0a0a0a',
    HEAD: '#00ff88',
    BODY_START: '#00ff88',
    BODY_END: '#006644',
    STALE_SLIME: 'rgba(0, 51, 34, 0.3)',
    FOOD: '#ff00ff',
    FOOD_CORE: '#ffffff',
    UI_TEXT: '#ffffff',
    UI_ACCENT: '#00ffff',
    UI_DIM: '#cccccc',
  },

  // Particles
  DRIP_INTERVAL_MS: 500,
  DRIP_PER_SEGMENT: 1.5,
  EVAPORATION_PARTICLES: 6,

  // Input
  INPUT_BUFFER_SIZE: 1,
};

export const GAME_STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  GAMEOVER: 'GAMEOVER',
};

export const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

// Helper to get opposite direction
export function getOpposite(dir) {
  if (dir.x === 1) return DIRECTIONS.LEFT;
  if (dir.x === -1) return DIRECTIONS.RIGHT;
  if (dir.y === 1) return DIRECTIONS.UP;
  if (dir.y === -1) return DIRECTIONS.DOWN;
  return DIRECTIONS.UP;
}