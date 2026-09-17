import { Input } from './input.js';
import { State } from './state.js';
import { Physics } from './physics.js';
import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { Weapon } from './weapon.js';
import { Audio } from './audio.js';
import { Render } from './render.js';
import { UI } from './ui.js';
import { RNG } from './lib/rng.js';

export class Game{
  constructor(canvas, ctx){
    this.canvas = canvas;
    this.ctx = ctx;
    this.rng = new RNG(12345);
    this.input = new Input();
    this.state = new State();
    this.audio = new Audio();
    this.physics = new Physics();
    this.player = new Player(this);
    this.weapon = new Weapon(this);
    this.enemy = new Enemy(this);
    this.render = new Render(this);
    this.ui = new UI(this);
    this.lastTime = 0;
    this.accumulator = 0;
    this.running = false;
    this.init();
  }
  
  init(){
    this.bindEvents();
    this.ui.showTitle();
  }
  
  bindEvents(){
    this.canvas.addEventListener('mousedown', e => this.input.mouseDown(e));
    this.canvas.addEventListener('mouseup', e => this.input.mouseUp(e));
    this.canvas.addEventListener('mousemove', e => this.input.mouseMove(e));
    window.addEventListener('keydown', e => this.input.keyDown(e));
    window.addEventListener('keyup', e => this.input.keyUp(e));
    document.addEventListener('visibilitychange', () => this.handleVisibility());
  }
  
  handleVisibility(){
    if(document.hidden && this.running) this.pause();
  }
  
  start(){
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }
  
  loop(timestamp){
    if(!this.running) return;
    const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
    this.lastTime = timestamp;
    this.accumulator += dt;
    while(this.accumulator >= 1/60 && this.accumulator < 0.5){
      this.update(1/60);
      this.accumulator -= 1/60;
    }
    this.render.frame();
    requestAnimationFrame(this.loop.bind(this));
  }
  
  update(dt){
    this.state.update(dt);
    this.input.update();
    this.physics.update(dt);
    this.player.update(dt);
    this.weapon.update(dt);
    this.enemy.update(dt);
    this.render.update(dt);
    this.ui.update(dt);
  }
  
  pause(){
    this.running = false;
    this.ui.showPause();
  }
  
  resize(){
    this.render.resize();
  }
}