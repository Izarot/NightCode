const Events = {
  trigger() {
    if (Math.random() > 0.4) return;
    const pool = [
      { msg: '📰 Worker injury exposed! Approval -15', apply: () => { GameState.metrics.approval -= 15; GameState.metrics.satisfaction += 5; }, type: 'warn' },
      { msg: '💰 Economic boom! Lobbying surges', apply: () => { GameState.metrics.gdp += 5; GameState.metrics.approval -= 3; }, type: 'info' },
      { msg: '🌊 River contamination discovered!', apply: () => { GameState.metrics.pollution += 10; GameState.metrics.approval -= 8; }, type: 'warn' },
      { msg: '🏆 Reform praised internationally!', apply: () => { GameState.metrics.approval += 10; GameState.budget += 100; }, type: 'ok' },
      { msg: '⚠️ Strike threat at Tech United', apply: () => { GameState.metrics.strikes += 1; GameState.metrics.satisfaction -= 5; }, type: 'warn' }
    ];
    const ev = pool[Math.floor(Math.random() * pool.length)];
    ev.apply();
    addLog(ev.msg, ev.type);
  },
  checkEnd() {
    if (GameState.metrics.approval < 20) return { over: true, msg: 'FIRED! Approval too low.' };
    if (GameState.metrics.pollution > 90 && GameState.metrics.satisfaction < 30) return { over: true, msg: 'Environmental collapse!' };
    if (GameState.metrics.debt > 95) return { over: true, msg: 'National debt crisis!' };
    if (GameState.quarter >= 12 && GameState.metrics.approval > 50) return { win: true, msg: 'Survived 12 quarters! Champion!' };
    return null;
  }
};
