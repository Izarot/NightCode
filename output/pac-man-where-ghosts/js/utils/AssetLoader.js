export class AssetLoader {
  constructor() {
    this.assets = {};
  }

  load(list) {
    const promises = list.map(({ key, src, type }) => {
      return new Promise((resolve, reject) => {
        if (type === 'image') {
          const img = new Image();
          img.onload = () => { this.assets[key] = img; resolve(); };
          img.onerror = reject;
          img.src = src;
        } else if (type === 'audio') {
          const audio = new Audio(src);
          audio.addEventListener('canplaythrough', () => { this.assets[key] = audio; resolve(); });
          audio.onerror = reject;
          audio.load();
        }
      });
    });
    return Promise.all(promises);
  }

  get(key) {
    return this.assets[key];
  }
}
