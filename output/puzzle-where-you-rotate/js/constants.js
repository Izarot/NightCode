const GRAVITY = 0.4;
const FRICTION = 0.92;
const RESTITUTION = 0.6;
const MAX_SPEED = 12;
const ROTATION_TIME = 300;
const TRAIL_LENGTH = 20;
const COLORS = {
  bg: '#08080f',
  wall: '#1a1a2e',
  wallGlow: '#00f0ff',
  exit: '#ff0055',
  ball: '#ffffff',
  trail: '#00f0ff'
};
const KEYS = {
  ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
  w: 'up', a: 'left', s: 'down', d: 'right'
};
const ROTATIONS = {
  up: 0, right: 90, down: 180, left: 270
};