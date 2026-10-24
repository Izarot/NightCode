class AudioEngine{
  constructor(){
    this.audioCtx = null;
    this.analyser = null;
    this.audio = null;
    this.bufferSize = 256;
  }
  async start(){
    this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    this.analyser = this.audioCtx.createAnalyser();
    this.analyser.fftSize = this.bufferSize * 2;
    const response = await fetch('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA=');
    const arrayBuffer = await response.arrayBuffer();
    this.audio = await this.audioCtx.decodeAudioData(arrayBuffer);
    const source = this.audioCtx.createBufferSource();
    source.buffer = this.audio;
    source.loop = true;
    source.connect(this.analyser);
    source.connect(this.audioCtx.destination);
    source.start();
  }
  getWaveformData(){
    const timeDomain = new Uint8Array(this.bufferSize);
    this.analyser.getByteTimeDomainData(timeDomain);
    return Array.from(timeDomain).map(v => (v - 128) / 128);
  }
}