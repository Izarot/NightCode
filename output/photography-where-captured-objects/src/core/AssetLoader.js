export class AssetLoader {
  constructor() {
    this.assets = {};
    this.loaded = 0;
    this.total = 0;
  }

  loadAll() {
    return new Promise((resolve) => {
      // Simulate asset loading (in real game, load images/audio)
      setTimeout(() => {
        this.assets = {
          // Placeholder for actual assets
        };
        resolve();
      }, 300);
    });
  }

  get(name) {
    return this.assets[name];
  }
}
