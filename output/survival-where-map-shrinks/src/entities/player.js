import {Weapon, WEAPONS} from '../data/weapons.js';
import {rand, dist, angle, clamp} from '../core/util.js';
import {ISLAND_R, BLACK_HOLE_CX, BLACK_HOLE_CY} from '../data/constants.js';

export class Player{
  constructor(x,y,color,name){
    this.x=x; this.y=y; this.vx=0; this.vy=0;
    this.r = 12; this.color = color; this.name = name;
    this.hp = 100; this.shield = 0; this.shieldTimer = 0;
    this.aim = 0; this.alive = true;
    this.weapon = new Weapon('piston');
    this.fireCool = 0; this.reloading = 0;
    this.kills = 0; this.dmgDealt = 0;
    this.killedBy = ''; this.dmgFlash = 0;
    this.hitFlash = 0; this.chargeT = 0;
  }
  update(dt, world, input){
    if(!this.alive) return;
    const k = input.keys;
    let ax=0, ay=0;
    if(k['w']) ay=-1;
    if(k['s']) ay=1;
    if(k['a']) ax=-1;
    if(k['d']) ax=1;
    const len = Math.hypot(ax,ay);
    if(len>0){ ax/=len; ay/=len; }
    const spd = 240;
    this.vx = ax*spd; this.vy = ay*spd;
    this.x += this.vx*dt;
    this.y += this.vy*dt;
    const distC = Math.hypot(this.x-BLACK_HOLE_CX, this.y-BLACK_HOLE_CY);
    const safeR = world.currentRadius();
    if(distC > safeR && safeR>0){
      const pull = 1500*(1 - safeR/distC);
      const a = angle({x:this.x,y:this.y},{x:BLACK_HOLE_CX,y:BLACK_HOLE_CY});
      this.x += Math.cos(a)*pull*dt;
      this.y += Math.sin(a)*pull*dt;
      this.takeDmg(5*dt);
    }
    if(safeR<=0){
      this.takeDmg(20*dt);
    }
    this.x = clamp(this.x, BLACK_HOLE_CX-ISLAND_R+10, BLACK_HOLE_CX+ISLAND_R-10);
    this.y = clamp(this.y, BLACK_HOLE_CY-ISLAND_R+10, BLACK_HOLE_CY+ISLAND_R-10);
    this.aim = Math.atan2(input.mouse.worldY-this.y, input.mouse.worldX-this.x);
    this.shieldTimer -= dt;
    if(this.shieldTimer<=0 && this.shield<50){ this.shield = Math.min(50, this.shield + 5*dt); }
    if(this.dmgFlash>0) this.dmgFlash -= dt;
    if(this.hitFlash>0) this.hitFlash -= dt;
    this.handleShoot(dt, world, input);
    this.pickup(world);
  }
  handleShoot(dt, world, input){
    const w = this.weapon;
    if(this.fireCool>0) this.fireCool -= dt;
    if(this.reloading>0){
      this.reloading -= dt;
      if(this.reloading<=0){ w.ammo = w.mag; }
    }
    if(input.keys['r'] && w.ammo < w.mag && this.reloading<=0){ this.reloading = w.reload; }
    const wantFire = input.mouse.down || (w.scope && input.keys['shift']);
    if(w.charge){
      if(wantFire && this.fireCool<=0 && w.ammo>0 && this.reloading<=0){ this.chargeT += dt; }
      else if(this.chargeT>0){
        const ratio = clamp(this.chargeT/w.charge, 0.3, 1);
        this.fireBullet(world, w.dmg*ratio, w);
        w.ammo--; this.fireCool = 1/w.rate; this.chargeT = 0;
      }
    }else{
      if(wantFire && this.fireCool<=0 && w.ammo>0 && this.reloading<=0){
        this.fireBullet(world, w.dmg, w);
        w.ammo--; this.fireCool = 1/w.rate;
      }
    }
  }
  fireBullet(world, dmg, w){
    const pellets = w.pellets||1;
    for(let i=0;i<pellets;i++){
      const a = this.aim + (Math.random()-0.5)*w.spread*2;
      const spd = w.spd;
      world.bullets.push({x:this.x,y:this.y,vx:Math.cos(a)*spd,vy:Math.sin(a)*spd,dmg,w,owner:this,dead:false,life:1.5,hitscan:w.hitscan,arc:w.arc,t:0,color:w.color});
    }
  }
  pickup(world){
    for(const l of world.loot){
      if(l.taken) continue;
      if(dist(this,l)<26){
        if(l.type==='weapon' && this.weapon.key==='piston'){ this.weapon = new Weapon(l.key); l.taken=true; }
        else if(l.type==='shield'){ this.shield = Math.min(100, this.shield+25); l.taken=true; }
        else if(l.type==='ammo' && this.weapon.key!=='piston'){ this.weapon.ammo = Math.min(this.weapon.mag, this.weapon.ammo+l.amt); l.taken=true; }
      }
    }
  }
  takeDmg(d){
    if(d<=0) return;
    let rem = d;
    if(this.shield>0){
      const s = Math.min(this.shield, rem);
      this.shield -= s; rem -= s;
    }
    this.hp -= rem;
    this.shieldTimer = 5;
    this.dmgFlash = 0.2;
    if(this.hp<=0){ this.hp=0; this.alive=false; }
  }
}
