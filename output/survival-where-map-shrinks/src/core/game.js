import {World} from './world.js';
import {Input} from './input.js';
import {Audio} from '../audio/audio.js';
import {HUD} from '../ui/hud.js';
import {Renderer} from '../render/renderer.js';
import {BLACK_HOLE_CX, BLACK_HOLE_CY, ISLAND_R} from '../data/constants.js';

export class Game{
  constructor(canvas, ctx){
    this.canvas = canvas;
    this.ctx = ctx;
    this.input = new Input(canvas);
    this.audio = new Audio();
    this.state = 'MENU';
    this.timer = 0;
    this.startTime = 0;
    this.bestTime = parseFloat(localStorage.getItem('vc_best')||'0');
    this.bestWins = parseInt(localStorage.getItem('vc_wins')||'0');
  }
  init(){
    document.getElementById('playBtn').onclick = ()=>this.start(1);
    document.getElementById('aiBtn').onclick = ()=>this.start(12);
    document.getElementById('retryBtn').onclick = ()=>this.start(1);
    document.getElementById('winBtn').onclick = ()=>this.start(1);
    this.loop(performance.now());
  }
  start(playerCount){
    this.world = new World(playerCount);
    this.state='PLAY';
    this.startTime = performance.now();
    this.timer = 0;
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('death').classList.add('hidden');
    document.getElementById('victory').classList.add('hidden');
    this.audio.startMusic();
  }
  loop(t){
    const dt = Math.min(0.05, (t-(this.lastT||t))/1000);
    this.lastT = t;
    if(this.state==='PLAY'){
      this.timer = (t-this.startTime)/1000;
      this.world.update(dt, this.input, this.audio);
      if(this.world.player.hp<=0){ this.endGame(false); }
      else if(this.world.aliveCount()<=1 && this.world.player.hp>0){ this.endGame(true); }
    }
    Renderer.draw(this);
    HUD.draw(this);
    requestAnimationFrame((tt)=>this.loop(tt));
  }
  endGame(won){
    this.state = won?'WIN':'DEAD';
    const t = this.timer;
    if(t>this.bestTime){ this.bestTime=t; localStorage.setItem('vc_best', t.toFixed(1)); }
    if(won){ this.bestWins++; localStorage.setItem('vc_wins', this.bestWins); }
    const kills = this.world.player.kills;
    const dmg = Math.floor(this.world.player.dmgDealt);
    if(won){
      document.getElementById('winInfo').innerHTML = `Time: <span class="stat">${t.toFixed(1)}s</span> · Kills: <span class="stat">${kills}</span> · Damage: <span class="stat">${dmg}</span><br>Best: ${this.bestTime.toFixed(1)}s · Wins: ${this.bestWins}`;
      document.getElementById('victory').classList.remove('hidden');
      this.audio.play('win');
    }else{
      const k = this.world.player.killedBy||'the void';
      document.getElementById('deathInfo').innerHTML = `Killed by <span class="stat">${k}</span><br>Time: ${t.toFixed(1)}s · Kills: ${kills} · Damage: ${dmg}<br>Best: ${this.bestTime.toFixed(1)}s`;
      document.getElementById('death').classList.remove('hidden');
      this.audio.play('death');
    }
  }
}
