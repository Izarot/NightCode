import {Player} from './player.js';
import {Weapon, WEAPONS} from '../data/weapons.js';
import {rand, dist, angle, clamp} from '../core/util.js';
import {BLACK_HOLE_CX, BLACK_HOLE_CY, ISLAND_R} from '../data/constants.js';

export class Bot extends Player{
  constructor(x,y,color,name){
    super(x,y,color,name);
    this.target = null;
    this.thinkT = 0;
    this.moveDir = {x:0,y:0};
    this.weapon = new Weapon(['repeater','scatter','spitter','lance'][Math.floor(Math.random()*4)]);
    this.aggression = 0.6 + Math.random()*0.4;
  }
  update(dt, world, input){
    if(!this.alive) return;
    this.thinkT -= dt;
    if(this.thinkT<=0){ this.think(dt, world); this.thinkT = 0.3; }
    this.vx = this.moveDir.x*180;
    this.vy = this.moveDir.y*180;
    this.x += this.vx*dt;
    this.y += this.vy*dt;
    const distC = Math.hypot(this.x-BLACK_HOLE_CX, this.y-BLACK_HOLE_CY);
    const safeR = world.currentRadius();
    if(distC>safeR*0.95 && safeR>0){
      const a = angle({x:this.x,y:this.y},{x:BLACK_HOLE_CX,y:BLACK_HOLE_CY});
      this.moveDir.x = -Math.cos(a);
      this.moveDir.y = -Math.sin(a);
    }
    if(safeR<=0) this.takeDmg(20*dt);
    else if(distC>safeR) this.takeDmg(5*dt);
    this.x = clamp(this.x, BLACK_HOLE_CX-ISLAND_R+10, BLACK_HOLE_CX+ISLAND_R-10);
    this.y = clamp(this.y, BLACK_HOLE_CY-ISLAND_R+10, BLACK_HOLE_CY+ISLAND_R-10);
    this.shieldTimer -= dt;
    if(this.shieldTimer<=0 && this.shield<50) this.shield = Math.min(50, this.shield+5*dt);
    if(this.target && this.target.alive){
      this.aim = angle(this, this.target);
      const d = dist(this,this.target);
      const desired = this.weapon.key==='lance'?380:this.weapon.key==='scatter'?140:260;
      const dirX = Math.cos(this.aim), dirY = Math.sin(this.aim);
      if(d>desired+30){ this.moveDir.x=dirX*0.7; this.moveDir.y=dirY*0.7; }
      else if(d<desired-30){ this.moveDir.x=-dirX*0.7; this.moveDir.y=-dirY*0.7; }
      else { this.moveDir.x = Math.cos(this.aim+Math.PI/2)*0.3; this.moveDir.y = Math.sin(this.aim+Math.PI/2)*0.3; }
      if(this.fireCool<=0 && this.weapon.ammo>0 && Math.random()<this.aggression){
        this.fireBullet(world, this.weapon.dmg, this.weapon);
        this.weapon.ammo--;
        this.fireCool = 1/this.weapon.rate + rand(0,0.2);
      }
    }
    if(this.fireCool>0) this.fireCool -= dt;
    if(this.dmgFlash>0) this.dmgFlash -= dt;
    if(this.hitFlash>0) this.hitFlash -= dt;
    this.pickup(world);
  }
  think(dt, world){
    let best=null, bd=99999;
    for(const e of world.entities){
      if(e===this||!e.alive) continue;
      const d = dist(this,e);
      if(d<bd){ bd=d; best=e; }
    }
    if(best && bd<700) this.target = best;
    else this.target = null;
    if(this.weapon.ammo===0){
      this.weapon.ammo = this.weapon.mag;
    }
  }
}
