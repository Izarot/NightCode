// LocalStorage wrapper for high score persistence
export const Storage = {
  KEY: 'cubetris_high_score',
  load() {
    try {
      const v = localStorage.getItem(this.KEY);
      return v ? parseInt(v, 10) || 0 : 0;
    } catch (e) {
      return 0;
    }
  },
  save(score) {
    try {
      localStorage.setItem(this.KEY, String(score));
    } catch (e) {
      // ignore
    }
  }
};
