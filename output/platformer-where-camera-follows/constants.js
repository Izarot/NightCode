export const CONFIG = {
  CANVAS_WIDTH: 1280,
  CANVAS_HEIGHT: 720,
  TILE_SIZE: 40,
  BALL_RADIUS: 20,
  GRAVITY: 980,
  MAX_TILT: 35,
  MAX_VELOCITY: 800,
  BALL_COLOR: '#ff6b5b',
  BALL_INNER: '#ff8a7a',
  GEOMETRY_COLOR: '#e8e4df',
  HAZARD_COLOR: '#7fff00',
  COLLECTIBLE_COLOR: '#ffd700',
  GOAL_COLOR: '#00ffcc',
  UI_ACCENT: '#4dabf7',
  BG_TOP: '#0a0e1a',
  BG_BOTTOM: '#1a1f2e'
};

export const STATES = {
  MENU: 'MENU',
  PLAYING: 'PLAYING',
  PAUSED: 'PAUSED',
  LEVEL_COMPLETE: 'LEVEL_COMPLETE'
};

export const KEYS = {
  A: 'a', D: 'd', W: 'w', S: 's',
  LEFT: 'ArrowLeft', RIGHT: 'ArrowRight', UP: 'ArrowUp', DOWN: 'ArrowDown',
  SPACE: ' ',
  ESC: 'Escape'
};