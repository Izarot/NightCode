import {SONGS} from './songs.js';
export class Levels{
  constructor(idx){const s=SONGS[idx];this.bpm=s.bpm;this.platforms=s.platforms;
    this.notes=s.notes;this.spawnX=100;this.spawnY=400;}
  draw(ctx){
    for(const p of this.platforms){
      ctx.fillStyle='rgba(0,212,255,.15)';
      ctx.fillRect(p.x,p.y,p.w,8);
      ctx.shadowColor='#00d4ff';ctx.shadowBlur=8;
      ctx.fillStyle='rgba(0,212,255,.5)';
      ctx.fillRect(p.x,p.y,p.w,4);
      ctx.shadowBlur=0;
    }
  }
}
