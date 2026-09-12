export const C = {
  // Player
  P_THRUST: 800, P_REV_MULT: 0.4, P_TORQUE: 12,
  P_LIN_DAMP: 0.985, P_ANG_DAMP: 0.92,
  P_MAX_SPD: 450, P_MAX_ROT: 18,
  P_HP: 3, P_IFRAME: 1.5,

  // Well Launcher
  W_MAX_SLOTS: 3, W_COOLDOWN: 0.15,
  W_CHARGE_MAX: 1.5,
  W_MASS_MIN: 500, W_MASS_MAX: 5000,
  W_LIFE_MIN: 4, W_LIFE_MAX: 12,
  W_SPEED_MIN: 600, W_SPEED_MAX: 1000,
  W_G_CONST: 0.00006,
  W_MAX_ACCEL: 3000,
  W_INNER_RADIUS: 40,

  // Asteroids
  AST_SPAWN_BASE_RATE: 1.5,
  AST_MAX_ON_SCREEN: 120,
  AST_TYPES: {
    STANDARD: { mass: 100, hp: 1, radius: 24, score: 10, fragments: 2, color: '#888' },
    DENSE: { mass: 500, hp: 3, radius: 32, score: 50, fragments: 3, color: '#445566' },
    VOLATILE: { mass: 50, hp: 1, radius: 20, score: 20, fragments: 0, color: '#FF6B00', explodes: true },
    FRAGMENT: { mass: 20, hp: 1, radius: 10, score: 5, fragments: 0, color: '#AAA', decay: 10 }
  },

  // Scoring
  SCORE_BASE: 10,
  MULT_DISPOSAL: 2.0,
  MULT_SHATTER: 1.5,
  MULT_CRUSH: 3.0,
  MULT_DECAY_RATE: 0.95,

  // Visuals
  GRID_RES: 40,
  SHAKE_MAX: 15,
  TRAUMA_DECAY: 0.9,
};