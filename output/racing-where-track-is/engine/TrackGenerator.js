class TrackGenerator{
  constructor(){
    this.track = [];
    this.segmentCount = 100;
    this.generate();
  }
  generate(){
    this.track = [];
    for(let i = 0; i < this.segmentCount; i++){
      this.track.push({x: i * 10, y: 0, z: 0});
    }
  }
  update(waveform){
    if(!waveform) return;
    const avg = waveform.reduce((a,b) => a+b, 0) / waveform.length;
    for(let i = 0; i < this.segmentCount; i++){
      const idx = Math.floor(Math.random() * waveform.length);
      this.track[i].y = (waveform[idx] || 0) * 50;
      this.track[i].z = avg * 30;
    }
  }
}