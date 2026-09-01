const Persistence = {
  load() {
    try {
      const hs = localStorage.getItem('regulator_highscore');
      if (hs) GameState.highScore = parseInt(hs) || 0;
    } catch(e) {}
  },
  saveScore() {
    const score = GameState.metrics.approval + GameState.quarter * 5;
    if (score > GameState.highScore) {
      GameState.highScore = score;
      try { localStorage.setItem('regulator_highscore', score); } catch(e) {}
    }
  }
};
