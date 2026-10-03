const CONFIG = {
  canvasWidth: 400,
  canvasHeight: 600,
  gravity: 0.5,
  jumpStrength: -8,
  birdRadius: 15,
  maxHorizontalSpeed: 7,
  pipeInterval: 1500,
  pipeGap: 120,
  pipeWidth: 60,
  groundY: 500,
  colors: {
    skyTop: '#87CEEB',
    skyBottom: '#FFD700',
    birdBody: '#FFD700',
    birdEye: '#000',
    birdBeak: '#FFA500',
    pipeBody: '#228B22',
    pipeBorder: '#006400',
    ground: '#8B4513',
    cloud: '#FFFFFF',
    scoreText: '#FFFFFF',
    highScoreText: '#CCCCCC',
    hudBg: 'rgba(0,0,0,0.3)'
  }
};

const STATE = {
  IDLE: 'idle',
  PLAYING: 'playing',
  GAME_OVER: 'game_over'
};