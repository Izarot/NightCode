import { Player } from './player.js';
import { EnemyManager } from './enemy.js';
import { HealthPackManager } from './health.js';
import { Weapon } from './weapon.js';
import { UI } from './ui.js';
import { Input } from './systems/input.js';
import { Physics } from './systems/physics.js';
import { Collision } from './systems/collision.js';
import { Renderer } from './systems/rendering.js';
import { Audio } from './utils.js';

export class Game {
  constructor(canvas, uiOverlay){
    this.canvas = canvas;
    this.uiOverlay = uiOverlay;
    this.ctx = canvas.getContext('2d');
    this.logicalWidth = 960;
    this.logicalHeight = 540;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.lastTime = 0;
    this.dt = 0;
    this.running = true;
    this.worldBounds = {x:0,y:0,w:3000,h:2000};
    this.camera = {x:0,y:0,shake:0,shakeIntensity:0};
    this.input = new Input();
    this.physics = new Physics();
    this.collision = new Collision();
    this.renderer = new Renderer(this);
    this.audio = new Audio();
    this.player = null;
    this.enemies = null;
    this.healthPacks = null;
    this.weapon = null;
    this.ui = null;
    this.timer = 0;
    this.highScore = parseInt(localStorage.getItem('liveAmmoHighScore')) || 0;
    this.enemySpawnTimer = 0;
    this.maxEnemies = 30;
    this.resize();
    window.addEventListener('resize',()=>this.resize());
  }
  init(){
    this.player = new Player(this);
    this.enemies = new EnemyManager(this);
    this.healthPacks = new HealthPackManager(this);
    this.weapon = new Weapon(this);
    this.ui = new UI(this);
    this.spawnInitial();
  }
  spawnInitial(){
    for(let i=0;i<12;i++) this.enemies.spawnRandom();
    for(let i=0;i<6;i++) this.healthPacks.spawnRandom();
  }
  resize(){
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.canvas.width = w;
    this.canvas.height = h;
    const scaleX = w / this.logicalWidth;
    const scaleY = h / this.logicalHeight;
    this.scale = Math.min(scaleX, scaleY);
    this.offsetX = (w - this.logicalWidth * this.scale) / 2;
    this.offsetY = (h - this.logicalHeight * this.scale) / 2;
  }
  update(time){
    this.dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;
    if(!this.running) return;
    this.timer += this.dt;
    this.input.update();
    this.player.update(this.dt);
    this.weapon.update(this.dt);
    this.enemies.update(this.dt);
    this.healthPacks.update(this.dt);
    this.updateCamera();
    this.checkCollisions();
    this.enemySpawnTimer += this.dt;
    if(this.enemySpawnTimer > 3 && this.enemies.list.length < this.maxEnemies){
      this.enemies.spawnRandom();
      this.enemySpawnTimer = 0;
    }
    if(this.player.health <= 0) this.gameOver();
  }
  updateCamera(){
    const targetX = this.player.x - this.logicalWidth/2;
    const targetY = this.player.y - this.logicalHeight/2;
    this.camera.x += (targetX - this.camera.x) * 0.15;
    this.camera.y += (targetY - this.camera.y) * 0.15;
    this.camera.x = Math.max(0, Math.min(this.worldBounds.w - this.logicalWidth, this.camera.x));
    this.camera.y = Math.max(0, Math.min(this.worldBounds.h - this.logicalHeight, this.camera.y));
    if(this.camera.shake > 0){
      this.camera.shake -= this.dt;
      this.camera.shakeIntensity = Math.max(0, this.camera.shake * 8);
    }else{ this.camera.shakeIntensity = 0; }
  }
  checkCollisions(){
    this.collision.playerWorld(this.player, this.worldBounds);
    this.collision.playerEnemies(this.player, this.enemies.list);
    this.collision.bulletsEnemies(this.weapon.bullets, this.enemies.list, this);
    this.collision.playerHealthPacks(this.player, this.healthPacks.list, this);
  }
  render(){
    this.renderer.render();
  }
  gameOver(){
    this.running = false;
    if(this.timer > this.highScore){
      this.highScore = Math.floor(this.timer);
      localStorage.setItem('liveAmmoHighScore', this.highScore);
    }
    this.ui.showGameOver();
  }
  restart(){
    this.timer = 0;
    this.running = true;
    this.camera.shake = 0;
    this.player.reset();
    this.enemies.list = [];
    this.healthPacks.list = [];
    this.weapon.bullets = [];
    this.spawnInitial();
    this.ui.hideGameOver();
  }
  addScreenShake(intensity, duration){
    this.camera.shake = Math.max(this.camera.shake, duration);
    this.camera.shakeIntensity = Math.max(this.camera.shakeIntensity, intensity);
  }
}