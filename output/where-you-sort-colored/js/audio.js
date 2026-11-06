// audio.js
export class AudioManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.buffers = {};
  }
  async load(name, url) {
    const resp = await fetch(url);
    const arrayBuf = await resp.arrayBuffer();
    const audioBuf = await this.ctx.decodeAudioData(arrayBuf);
    this.buffers[name] = audioBuf;
  }
  async init() {
    await this.load('pour', 'assets/audio/pour.wav');
    await this.load('success', 'assets/audio/success.wav');
  }
  playSound(name) {
    const buf = this.buffers[name];
    if (!buf) return;
    const source = this.ctx.createBufferSource();
    source.buffer = buf;
    source.connect(this.ctx.destination);
    source.start(0);
  }
}