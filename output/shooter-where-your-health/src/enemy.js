export class Enemy {
  constructor(game, x, y, type='basic'){
    this.game = game;
    this.x = x; this.y = y;
    this.vx = 0; this.vy = 0;
    this.radius = 14;
    this.type = type;
    this.maxSpeed = type==='fast'?200:120;
    this.accel = 800;
    this.health = type==='tank'?50: (type==='fast'?10:20);
    this.maxHealth = this.health;
    this.damage = type==='tank'?15:10;
    this.attackCooldown = 0;
    this.attackRange = 40;
    this.color = type==='tank'?'#ff6600':(type==='fast'?'#00ff88':'#ff0066');
    this.angle = 0;
    this.strafeTimer = Math.random()*Math.PI*2;
    this.strafeDir = Math.random()<0.5?1:-1;
  }
  update(dt, player){
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    this.angle = Math.atan2(dy, dx);
    if(this.attackCooldown > 0) this.attackCooldown -= dt;
    if(dist < 300){
      if(dist > this.attackRange + 20){
        this.vx += Math.cos(this.angle) * this.accel * dt;
        this.vy += Math.sin(this.angle) * this.accel * dt;
      }else if(dist < this.attackRange - 10){
        this.vx -= Math.cos(this.angle) * this.accel * dt * 0.5;
        this.vy -= Math.sin(this.angle) * this.accel * dt * 0.5;
      }else{
        this.strafeTimer += dt * 3;
        const strafeAngle = this.angle + Math.PI/2 * this.strafeDir;
        this.vx += Math.cos(strafeAngle) * this.accel * dt * 0.7;
        this.vy += Math.sin(strafeAngle) * this.accel * dt * 0.7;
        if(this.attackCooldown <= 0 && dist < this.attackRange){
          player.takeDamage(this.damage);
          this.attackCooldown = 1.2;
          this.game.addScreenShake(4, 0.1);
        }
      }
    }else{
      this.vx *= 0.95; this.vy *= 0.95;
    }
    const speed = Math.hypot(this.vx, this.vy);
    if(speed > this.maxSpeed){
      this.vx = (this.vx/speed)*this.maxSpeed;
      this.vy = (this.vy/speed)*this.maxSpeed;
    }
    this.x += this.vx * dt;
    this.y += this.vy * dt;
  }
  takeDamage(amount){
    this.health -= amount;
    this.game.audio.play('enemyHit');
    return this.health <= 0;
  }
}

export class EnemyManager {
  constructor(game){ this.game=game; this.list=[]; }
  spawnRandom(){
    const margin = 200;
    const x = Math.random()*(this.game.worldBounds.w-2*margin)+margin;
    const y = Math.random()*(this.game.worldBounds.h-2*margin)+margin;
    const types = ['basic','basic','basic','fast','tank'];
    const type = types[Math.floor(Math.random()*types.length)];
    this.list.push(new Enemy(this.game, x, y, type));
  }
  update(dt){
    for(let i=this.list.length-1;i>=0;i--){
      const e = this.list[i];
      e.update(dt, this.game.player);
      if(e.health <= 0){
        this.game.audio.play('enemyDeath');
        this.list.splice(i,1);
      }
    }
  }
}