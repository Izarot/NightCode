export class Audio {
  constructor() {
    this.ctx = null;
    this.orbBuffer = null;
    this.rewindBuffer = null;
    this.deathBuffer = null;
  }
  async init() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.orbBuffer = await this.createSound('sine', 800, 0.1);
    this.rewindBuffer = await this.createSound('sine', 400, 0.3);
    this.deathBuffer = await this.createSound('noise', 200, 0.5);
  }
  createSound(type, freq, duration) {
    return new Promise(resolve => {
      const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * duration, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        const t = i / this.ctx.sampleRate;
        if (type === 'sine') data[i] = Math.sin(2 * Math.PI * freq * t) * (1 - t/duration);
        else if (type === 'noise') data[i] = (Math.random()*2-1) * (1 - t/duration);
      }
      resolve(buffer);
    });
  }
  playOrb() { this.playBuffer(this.orbBuffer); }
  playRewind() { this.playBuffer(this.rewindBuffer); }
  playDeath() { this.playBuffer(this.deathBuffer); }
  playBuffer(buffer) {
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ctx.destination);
    source.start();
  }
}
