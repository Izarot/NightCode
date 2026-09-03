import {Player} from '../entities/player.js';
import {Bot} from '../entities/bot.js';
import {Weapon, WEAPONS} from '../data/weapons.js';
import {ISLAND_R, BLACK_HOLE_CX, BLACK_HOLE_CY, PHASES} from '../data/constants.js';
import {rand, dist, angle} from './util.js';

export class World{
  constructor(playerCount){
    this.entities = [];
    this.loot = [];
    this.bullets = [];
    this.particles = [];
    this.supplyTimer = 30;
    this.spawnLoot();
    const colors = ['#00f0ff','#ff00ff','#39ff14','#ff8c00','#ffff00','#ff0080','#80ff00','#00ff80','#ff4040','#4080ff','#c080ff','#ff8040'];
    for(let i=0;i<playerCount;i++){
      const ang = (i/playerCount)*Math.PI*2 + rand(-0.3,0.3);
      const r = ISLAND_R*0.7;
      const x = BLACK_HOLE_CX + Math.cos(ang)*r;
      const y = BLACK_HOLE_CY + Math.sin(ang)*r;
      const isHuman = i===0;
      const c = colors[i%colors.length];
      const p = isHuman ? new Player(x,y,c,'YOU') : new Bot(x,y,c,'BOT_'+(i));
      this.entities.push(p);
    }
    this.player = this.entities[0];
  }
  spawnLoot(){
    this.loot = [];
    const keys = Object.keys(WEAPONS);
    for(let i=0;i<80;i++){
      const ang = rand(0,Math.PI*2);
      const r = Math.sqrt(rand(0,1))*ISLAND_R*0.9;
      const x = BLACK_HOLE_CX + Math.cos(ang)*r;
      const y = BLACK_HOLE_CY + Math.sin(ang)*r;
      const roll = Math.random();
      if(roll<0.5){
        const k = keys[Math.floor(Math.random()*3)];
        this.loot.push({type:'weapon',key:k,x,y,taken:false});
      }else if(roll<0.85){
        this.loot.push({type:'ammo',x,y,amt:Math.floor(rand(10,30)),taken:false});
      }else{
        this.loot.push({type:'shield',x,y,taken:false});
      }
    }
  }
  supplyDrop(){
    const ang = rand(0,Math.PI*2);
    const r = rand(0,1)*this.currentRadius()*0.8;
    const x = BLACK_HOLE_CX + Math.cos(ang)*r;
    const y = BLACK_HOLE_CY + Math.sin(ang)*r;
    this.loot.push({type:'weapon',key:'railgun',x,y,taken:false,beam:true});
    this.loot.push({type:'shield',x,y,taken:false,beam:true});
  }
  currentRadius(){
    const t = this.game?this.game.timer:0;
    let r = ISLAND_R;
    if(t>30) r = ISLAND_R*0.7;
    if(t>180) r = ISLAND_R*0.4;
    if(t>360) r = ISLAND_R*0.15;
    if(t>480) r = 0;
    return r;
  }
  update(dt, input, audio){
    this.supplyTimer -= dt;
    if(this.supplyTimer<=0){ this.supplyDrop(); this.supplyTimer=60; }
    for(const e of this.entities){ e.update(dt, this, input); }
    for(const b of this.bullets){ b.update(dt, this); }
    for(let i=this.bullets.length-1;i>=0;i--){ if(this.bullets[i].dead) this.bullets.splice(i,1); }
    for(const p of this.particles){ p.update(dt); }
    for(let i=this.particles.length-1;i>=0;i--){ if(this.particles[i].dead) this.particles.splice(i,1); }
  }
  aliveCount(){
    let c=0;
    for(const e of this.entities) if(e.alive) c++;
    return c;
  }
}
