import {Input} from './Input.js';
import {AudioMgr} from '../audio/AudioMgr.js';
import {Player} from '../player/Player.js';
import {NoteMgr} from '../note/NoteMgr.js';
import {Particles} from '../particles/Particles.js';
import {Camera} from './Camera.js';
import {Score} from './Score.js';
import {Levels} from '../levels/Levels.js';
import {UI} from '../ui/UI.js';
export class Game{
  constructor(canvas){
    this.c=canvas;this.ctx=canvas.getContext('2d');
    this.input=new Input();
    this.audio=new AudioMgr();
    this.camera=new Camera();
    this.score=new Score();
    this.ui=new UI(this);
    this.particles=new Particles();
    this.state='TITLE';this.levelIdx=0;
    this.metronome=true;this.muted=false;
    this.beatTime=0;this.lastBeat=0;this.timer=0;this.bestMs=Infinity;
    this.bestMs=parseInt(localStorage.getItem('nj_best')||'9999999');
    this.ui.buildSongList();
    this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);
  }
  startLevel(idx){this.levelIdx=idx;this.levels=new Levels(idx);
    this.player=new Player(this.levels.spawnX,this.levels.spawnY);
    this.notes=new NoteMgr(this.levels.notes);
    this.score.reset();this.particles.clear();this.camera.reset();
    this.timer=0;this.beatTime=0;this.lastBeat=performance.now();
    this.state='PLAYING';this.ui.hideAll();}
  loop(t){
    const dt=Math.min((t-this.lastT||t)/16.67,3);this.lastT=t;
    this.update(dt);this.draw();
    requestAnimationFrame(this.loop);}
  update(dt){
    if(this.state==='PLAYING'){
      this.timer+=dt*16.67;
      const bpm=this.levels.bpm;
      const beatMs=60000/bpm;
      if(performance.now()-this.beatTime>beatMs){
        this.beatTime=performance.now();
        if(this.metronome)this.audio.metronomeTick();
      }
      this.player.update(this.input,this.levels.platforms);
      this.notes.update(this.player,this.audio,this.score,this.particles,this.metronome);
      this.particles.update();
      this.camera.follow(this.player);
      if(this.player.y>900){this.player.respawn(this.levels.spawnX,this.levels.spawnY);this.score.resetCombo();}
      if(this.notes.allHit()){this.finishLevel();}
      this.ui.update(this);
      if(this.input.pressed('KeyP')||this.input.pressed('Escape')){this.state='PAUSED';this.ui.show('pauseScreen');}
      if(this.input.pressed('KeyR')){this.startLevel(this.levelIdx);}
      if(this.input.pressed('KeyM')){this.metronome=!this.metronome;}
    }else if(this.state==='TITLE'){
      if(this.input.pressed('Space'))this.startLevel(this.levelIdx);
    }else if(this.state==='PAUSED'){
      if(this.input.pressed('KeyP')||this.input.pressed('Escape')){this.state='PLAYING';this.ui.hideAll();}
    }else if(this.state==='COMPLETE'){
      if(this.input.pressed('Space'))this.startLevel(Math.min(this.levelIdx+1,2));
      if(this.input.pressed('KeyR'))this.startLevel(this.levelIdx);
    }
  }
  draw(){
    const ctx=this.ctx;const W=this.c.width,H=this.c.height;
    ctx.fillStyle='#0a0a12';ctx.fillRect(0,0,W,H);
    const g=ctx.createLinearGradient(0,0,0,H);
    g.addColorStop(0,'#0a0a12');g.addColorStop(1,'#1a1a2e');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.save();ctx.translate(-this.camera.x,-this.camera.y);
    this.drawStars(ctx);
    this.levels.draw(ctx);
    this.notes.draw(ctx,this);
    this.player.draw(ctx);
    this.particles.draw(ctx);
    ctx.restore();
  }
  drawStars(ctx){
    if(!this.stars)this.stars=Array.from({length:120},()=>({x:Math.random()*4000-1000,y:Math.random()*2000-500,r:Math.random()*1.5+.3,s:Math.random()*.02+.005,p:Math.random()*Math.PI*2}));
    for(const s of this.stars){
      s.p+=s.s;s.x+=0.1;
      const a=.5+.5*Math.sin(s.p);
      ctx.fillStyle=`rgba(255,255,255,${a*.7})`;
      ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,Math.PI*2);ctx.fill();
    }
  }
  finishLevel(){
    this.state='COMPLETE';
    const t=this.timer;const ms=Math.floor(t);
    if(ms<this.bestMs){this.bestMs=ms;localStorage.setItem('nj_best',ms);}
    this.ui.showComplete(this);
  }
}
