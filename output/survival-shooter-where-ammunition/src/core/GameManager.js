import { Loop } from './Loop.js';
import { Input } from './Input.js';
import { SpatialGrid } from './SpatialGrid.js';
import { ECS } from './ECS.js';
import { Renderer } from '../render/Renderer.js';
import { HUD } from '../render/HUD.js';
import { Background } from '../render/Background.js';
import { Lighting } from '../render/Lighting.js';
import { Waves } from '../systems/Waves.js';
import { Movement } from '../systems/Movement.js';
import { Collision } from '../systems/Collision.js';
import { Combat } from '../systems/Combat.js';
import { AI } from '../systems/AI.js';
import { Ammo } from '../systems/Ammo.js';
import { Particles } from '../systems/Particles.js';
import { CONFIG } from '../data/config.js';
export class GameManager {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.ecs = new ECS();
    this.input = new Input(canvas);
    this.spatial = new SpatialGrid(CONFIG.gridSize);
    this.renderer = new Renderer(ctx);
    this.hud = new HUD(ctx);
    this.bg = new Background(ctx);
    this.lighting = new Lighting(ctx);
    this.waves = new Waves(this);
    this.movement = new Movement(this);
    this.collision = new Collision(this);
    this.combat = new Combat(this);
    this.ai = new AI(this);
    this.ammo = new Ammo(this);
    this.particles = new Particles(this);
    this.player = null;
    this.bullets = [];
    this.enemies = [];
    this.cells = [];
    this.particlesList = [];
    this.wave = 1;
    this.waveProgress = 0;
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('neo_mineral_high')||'0');
    this.speedrunTime = 0;
    this.shake = {x:0,y:0,timer:0};
    this.audio = new (window.AudioContext||window.webkitAudioContext)();
  }
  start(){ this.loop = new Loop(this.update.bind(this), this.render.bind(this)); this.loop.start(); }
  spawnPlayer(){ this.player = this.ecs.createEntity(); this.ecs.addComponent(this.player,'Physics',{x:400,y:300,vx:0,vy:0,r:16}); this.ecs.addComponent(this.player,'Health',{hp:5,max:5}); this.ecs.addComponent(this.player,'Weapon',{type:'pistol',mag:12,max:12,cool:0}); this.ecs.addComponent(this.player,'Render',{color:'#00f0ff'}); }
  update(dt){ this.speedrunTime+=dt; this.waves.update(dt); this.movement.update(dt); this.ai.update(dt); this.collision.update(dt); this.combat.update(dt); this.ammo.update(dt); this.particles.update(dt); this.applyShake(dt); }
  applyShake(dt){ if(this.shake.timer>0){ this.shake.timer-=dt; this.shake.x=(Math.random()-0.5)*this.shake.timer*40; this.shake.y=(Math.random()-0.5)*this.shake.timer*40; } else { this.shake.x=0; this.shake.y=0; } }
  render(){ const ctx=this.ctx; ctx.save(); ctx.translate(this.shake.x,this.shake.y); this.bg.render(); this.renderer.renderEntities(this.ecs,this.enemies,this.player,this.bullets,this.cells,this.particlesList); this.lighting.render(this.player); this.hud.render(this.player,this); ctx.restore(); }
}
