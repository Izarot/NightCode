// level.js
export class Level {
  constructor(data) {
    this.tubeCount = data.tubeCount;
    this.initial = data.initial;
  }
  static async load() {
    const resp = await fetch('data/levels.json');
    const data = await resp.json();
    return data.map(d => new Level(d));
  }
}