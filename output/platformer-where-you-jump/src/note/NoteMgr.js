import {Note} from './Note.js';
export class NoteMgr{
  constructor(notes){this.notes=notes.map(n=>new Note(n.x,n.y,n.pitch,n.beat,n.type||'q'));
    this.hitCount=0;}
  update(player,audio,score,particles,metro){
    for(const n of this.notes){
      if(n.hit)continue;
      const now=performance.now();
      const diff=Math.abs(now-n.beatTime);
      n.onBeat=Math.abs(now-n.lastBeat)<100;
      n.lastBeat=now;
      n.pulse=(Math.sin(now/300)*.1+.9);
      const px=player.x+player.w/2,py=player.y+player.h;
      if(px>n.x-24&&px<n.x+24&&py>n.y-20&&py<n.y+30&&player.vy>=0&&!n.hit){
        n.hit=true;n.playedAt=now;
        let q=diff<100?2:diff<200?1:0;
        const pts=score.add(q);
        audio.play(n.pitch,q===2?.9:q===1?.7:.4,q===2?.9:.6);
        player.vy=-10;
        particles.burst(n.x,n.y,q===2?'#fff':q===1?'#00d4ff':'#888');
        this.hitCount++;
      }
      if(!n.hit&&Math.abs(now-n.beatTime)>250&&now>n.beatTime+250&&px>n.x+200)n.missed=true;
      if(n.missed&&!n.dissonanced){n.dissonanced=true;audio.dissonance();score.resetCombo();}
    }
  }
  allHit(){return this.notes.every(n=>n.hit);}
  draw(ctx,game){
    const cam=game.camera;
    for(const n of this.notes){
      if(n.x<cam.x-100||n.x>cam.x+1400)continue;
      n.draw(ctx);
    }
  }
}
