export class AudioManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.sounds = {};
  }

  async loadSounds(list) {
    for (const { key, url } of list) {
      const res = await fetch(url);
      const buf = await res.arrayBuffer();
      this.sounds[key] = await this.ctx.decodeAudioData(buf);
    }
  }

  play(key) {
    if (this.sounds[key]) {
      const source = this.ctx.createBufferSource();
      source.buffer = this.sounds[key];
      source.connect(this.ctx.destination);
      source.start(0);
    }
  }
}
