import { CONFIG } from '../data/config.js';
export class Waves {
  constructor(gm){ this.gm=gm; this.spawnTimer=0; this.enemiesToSpawn=0; this.killsThisWave=0; }
  update(dt){ this.spawnTimer-=dt; if(this.spawnTimer<=0&&this.gm.enemies.length<this.gm.wave*3+5){ this.spawnEnemy(); this.spawnTimer=1; } if(this.gm.enemies.length===0&&this.spawnTimer<=0){ this.gm.wave++; this.spawnTimer=2; } }
  spawnEnemy(){ const e=this.gm.ecs.createEntity(); const side=Math.floor(Math.random()*4); let x,y; switch(side){ case 0:x=0;y=Math.random()*this.gm.canvas.height;break; case 1:x=this.gm.canvas.width;y=Math.random()*this.gm.canvas.height;break; case 2:x=Math.random()*this.gm.canvas.width;y=0;break; case 3:x=Math.random()*this.gm.canvas.width;y=this.gm.canvas.height;break; } this.gm.ecs.addComponent(e,'Physics',{x,y,vx:0,vy:0,r:12}); this.gm.ecs.addComponent(e,'AI',{speed:80,maxSpeed:120}); this.gm.ecs.addComponent(e,'Health',{hp:3,max:3}); this.gm.ecs.addComponent(e,'Render',{color:'#ff0055'}); this.gm.enemies.push(e); }
}
