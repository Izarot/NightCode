import {GameState} from './GameState.js';
import {AssetLoader} from './AssetLoader.js';
import {AudioEngine} from './AudioEngine.js';
import {InputHandler} from './InputHandler.js';
import {Physics} from './Physics.js';
import {ParticleSystem} from './ParticleSystem.js';
import {UI} from './UI.js';
import {LevelManager} from './LevelManager.js';
import {Data} from './Data.js';

export class Game{
  constructor(canvas){
    this.canvas=canvas;
    this.ctx=canvas.getContext('2d');
    this.state=new GameState();
    this.assets=new AssetLoader();
    this.audio=new AudioEngine();
    this.input=new InputHandler(canvas,this.state);
    this.physics=new Physics(this.state);
    this.particles=new ParticleSystem(200);
    this.ui=new UI(this);
    this.levels=new LevelManager(this);
    this.last=0;
    this.running=false;
    this.startTime=0;
  }
  async init(){
    await this.audio.init();
    this.resize();
    window.addEventListener('resize',()=>this.resize());
    this.canvas.addEventListener('mousedown',()=>this.audio.resume());
    this.canvas.addEventListener('touchstart',()=>this.audio.resume());
    this.startTime=performance.now();
    this.running=true;
    requestAnimationFrame((t)=>this.loop(t));
  }
  resize(){
    const dpr=window.devicePixelRatio||1;
    const w=window.innerWidth,h=window.innerHeight;
    const scale=Math.min(w/1280,h/720);
    this.canvas.style.width=(1280*scale)+'px';
    this.canvas.style.height=(720*scale)+'px';
    this.canvas.width=1280*dpr;
    this.canvas.height=720*dpr;
    this.ctx.setTransform(dpr,0,0,dpr,0,0);
    this.state.scale=scale;
  }
  loop(t){
    if(!this.running)return;
    const dt=Math.min((t-this.last)/1000,0.05);
    this.last=t;
    this.state.elapsed=(t-this.startTime)/1000;
    this.update(dt);
    this.render();
    requestAnimationFrame((tt)=>this.loop(tt));
  }
  update(dt){
    this.state.update(dt,this.audio);
    this.physics.update(dt);
    this.particles.update(dt);
    this.input.update();
    this.levels.update(dt);
  }
  render(){
    const c=this.ctx;
    c.fillStyle='#1a0a2e';
    c.fillRect(0,0,1280,720);
    this.ui.drawBackground(c);
    this.ui.drawCauldron(c,this.state);
    this.ui.drawIngredients(c,this.state);
    this.particles.draw(c);
    this.ui.drawAvatar(c,this.state);
    this.ui.drawHUD(c,this.state);
  }
  playSound(f,vol=0.3){this.audio.play(f,vol);}
}