class Hazards {
  constructor(){
    this.spikes = [];
    this.saws = [];
  }
  addSpike(x,y){ this.spikes.push({x,y}); }
  addSaw(x,y){ this.saws.push({x,y,time:0}); }