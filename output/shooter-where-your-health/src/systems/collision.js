export class Collision {
  playerWorld(player, bounds){
    player.x = Math.max(player.radius, Math.min(bounds.w - player.radius, player.x));
    player.y = Math.max(player.radius, Math.min(bounds.h - player.radius, player.y));
  }
  playerEnemies(player, enemies){
    for(const e of enemies){
      const dx = player.x - e.x;
      const dy = player.y - e.y;
      const dist = Math.hypot(dx, dy);
      const minDist = player.radius + e.radius;
      if(dist < minDist && dist > 0){
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        player.x += nx * overlap * 0.5;
        player.y += ny * overlap * 0.5;
        e.x -= nx * overlap * 0.5;
        e.y -= ny * overlap * 0.5;
     }
    }
  }
  bulletsEnemies(bullets, enemies, game){
    for(let i=bullets.length-1;i>=0;i--){
      const b=bullets[i];
      for(let j=enemies.length-1;j>=0;j--){
        const e=enemies[j];
        const dx=b.x-e.x; const dy=b.y-e.y;
        if(Math.hypot(dx,dy) < b.radius+e.radius){
          if(e.takeDamage(b.damage)){
            game.addScreenShake(5,0.12);
          }
          bullets.splice(i,1);
          break;
        }
      }
    }
  }
  playerHealthPacks(player, packs, game){
    for(let i=packs.length-1;i>=0;i--){
      const p=packs[i];
      const dx=player.x-p.x; const dy=player.y-p.y;
      if(Math.hypot(dx,dy) < player.radius+p.radius){
        p.collected=true;
      }
    }
  }
}