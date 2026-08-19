export class AudioManager {
  constructor() {
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.footstepBuffer = null;
    this.loadFootstep();
  }
  loadFootstep() {
    fetch('assets/footstep.wav')
      .then(r => r.arrayBuffer())
      .then(ab => this.ctx.decodeAudioData(ab))
      .then(buf => this.footstepBuffer = buf);
  }
  playFootstep() {
    if (!this.footstepBuffer) return;
    const source = this.ctx.createBufferSource();
    source.buffer = this.footstepBuffer;
    source.connect(this.ctx.destination);
    source.start(0);
  }
}