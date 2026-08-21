export function updatePhysics(input, dt) {
  const speed = 80; // pixels per second
  const friction = 200;
  const player = window.gameState.player;
  if(input.left) player.vx = -speed;
  else if(input.right) player.vx = speed;
  else player.vx = 0;
  if(input.up) player.vy = -speed;
  else if(input.down) player.vy = speed;
  else player.vy = 0;
  // Move player
  const newPx = player.x + player.vx * dt;
  const newPy = player.y + player.vy * dt;
  if(!collides(newPx, newPy, 16, 16)) {
    player.x = newPx; player.y = newPy;
  }
  // Move blocks
  window.gameState.blocks.forEach(block=>{
    if(block.vx!==0||block.vy!==0){
      const nbx = block.x + block.vx * dt;
      const nby = block.y + block.vy * dt;
      if(!collides(nbx, nby, 16, 16)){
        block.x = nbx; block.y = nby;
      } else {
        block.vx = 0; block.vy = 0;
      }
    }
  });
}

function collides(x,y,w,h){
  const gs = window.gameState;
  // walls
  for(const wld of gs.walls){
    if(rectIntersect(x,y,w,h,wld.x,wld.y,16,16)) return true;
  }
  // blocks
  for(const blk of gs.blocks){
    if(rectIntersect(x,y,w,h,blk.x,blk.y,16,16)) return true;
  }
  return false;
}
function rectIntersect(ax,ay,aw,ah,bx,by,bw,bh){
  return ax<bx+bw && ax+aw>bx && ay<by+bh && ay+ah>by;
}
