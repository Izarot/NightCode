import {INGREDIENTS,getCombo} from './Data.js';
export class LevelManager{
  constructor(game){this.game=game;this.lastMix=[];this.lastBeatIdx=-1;}
  commitMix(ingId,held){
    const s=this.game.state;
    const beatIdx=s.beatIndex;
    const sinceBeat=(s.elapsed*60/s.bpm)-beatIdx;
    const onBeat=sinceBeat<0.1||sinceBeat>0.9;
    let timing='Good';
    if(sinceBeat<0.02||sinceBeat>0.98)timing='Perfect';
    if(!onBeat){timing='Miss';}
    if(timing==='Miss'){
      s.progress=Math.max(0,s.progress-5);
      s.combo=0;
      this.game.audio.playMiss();
      s.dashCd=Math.max(s.dashCd,0.5);
      return;
    }
    const potency=Math.min(100,held*100);
    let bonus=timing==='Perfect'?2:1;
    this.lastMix.push(ingId);
    if(this.lastMix.length>2)this.lastMix.shift();
    if(this.lastMix.length===2){
      const combo=getCombo(this.lastMix[0],this.lastMix[1]);
      if(combo)bonus*=combo.mult;
    }
    const score=Math.floor((10+potency/10)*bonus);
    s.addScore(score);
    s.combo++;
    s.progress=Math.min(100,s.progress+8);
    const ing=INGREDIENTS.find(i=>i.id===ingId);
    s.queue.shift();
    this.game.particles.burst(s.cauldron.x,s.cauldron.y,ing.color,15);
    if(timing==='Perfect')this.game.audio.playPerfect();
    else this.game.audio.playSuccess();
    if(s.progress>=100){
      s.level++;s.progress=0;
      s.bpm=Math.min(180,s.bpm+10);
      this.game.input.spawn();
    }
  }
  update(dt){
    if(this.game.state.queue.length<3&&Math.random()<0.02){
      this.game.input.spawn();
    }
  }
}