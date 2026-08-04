export class AssetLoader {
  constructor() {
    this.assets = {};
  }
  load(url, name) {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => { this.assets[name] = img; resolve(img); };
      img.src = url;
    });
  }
  get(name) { return this.assets[name]; }
}
