export const GRID_SIZE = 20;
export const CELL_SIZE = 20;
export const VIRTUAL_WIDTH = 400;
export const VIRTUAL_HEIGHT = 400;

export const COLORS = {
  BACKGROUND_START: '#0a0a20',
  BACKGROUND_END: '#1a1a40',
  SNAKE_HEAD: '#00f5ff',
  SNAKE_TAIL: '#00aaff',
  FOOD: '#ff00c8',
  PORTAL_A: '#00ffff',
  PORTAL_B: '#ff00ff',
  HUD_TEXT: 'rgba(255, 255, 255, 0.8)',
  HIGH_SCORE: '#ff00ff',
  SPEEDRUN: '#00ff00',
};

export const GAME = {
  BASE_SPEED: 200,
  SPEED_INCREMENT: 15,
  MIN_SPEED: 50,
  MAX_SPEED: 200,
  START_LENGTH: 3,
  FOOD_SCORE: 10,
  PORTAL_PENALTY: 0.1,
};

export const PORTAL = {
  MAX_ACTIVE: 4,
  ENTRY_ANIMATION_TIME: 200,
};