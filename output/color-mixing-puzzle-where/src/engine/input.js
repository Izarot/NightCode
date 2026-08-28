import { KEY } from './constants.js';
export class Input{
  constructor(c){
    this.c=c; this.keys={}; this.just={};
    window.addEventListener('keydown',e=>{ if(!this.keys[e.code]) this.just[e.code]=true; this.keys[e.code]=true; if([KEY.L,KEY.R,KEY.U,KEY.W,KEY.S].includes(e.code)) e.preventDefault();});
    window.addEventListener('keyup',e=>{ this.keys[e.code]=false; });
    c.addEventListener('pointerdown',e=>{ this._down=true; this._px=e.offsetX/c.clientWidth*1280; this._py=e.offsetY/c.clientHeight*720; });
    c.addEventListener('pointerup',e=>{ this._down=false; });
  }
  consume(c){ const v=this.just[c]; if(v){this.just[c]=false; return true;} return false; }
  axis(){ return (this.keys[KEY.R]||this.keys['KeyD']?1:0) - (this.keys[KEY.L]||this.keys['KeyA']?1:0); }
  jumpDown(){ return this.keys[KEY.U]||this.keys[KEY.W]||this.keys['KeyW']; }
  throwHeld(){ return this.keys[KEY.S]; }
}
