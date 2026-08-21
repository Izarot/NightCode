export function handleResize(width, height){
  // No-op for now, placeholder for future scaling logic
}
export function render(ctx){
  const gs = window.gameState;
  ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
  // Draw walls
  ctx.fillStyle='#555';
  gs.walls.forEach(w=>{
    ctx.fillRect(w.x,w.y,16,16);
  });
  // Draw targets
  gs.targets.forEach(t=>{
    ctx.beginPath();
    ctx.arc(t.x+8,t.y+8,12,0,Math.PI*2);
    ctx.fillStyle='rgba(255,255,255,0.3)';
    ctx.fill();
  });
  // Draw blocks
  gs.blocks.forEach(b=>{
    ctx.fillStyle='rgba(0,150,255,0.7)';
    ctx.fillRect(b.x,b.y,16,16);
  });
  // Draw player
  ctx.fillStyle='rgba(0,200,255,1)';
  ctx.fillRect(gs.player.x,gs.player.y,16,16);
}
