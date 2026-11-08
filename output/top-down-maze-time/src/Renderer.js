export function draw(ctx,s){
 ctx.globalCompositeOperation='source-over';
 ctx.fillStyle='rgba(10,10,18,0.22)'; ctx.fillRect(0,0,840,600);
 let cell=40;
 for(let y=0;y<s.level.rows;y++)for(let x=0;x<s.level.cols;x++){ if(s.level.tiles[y][x]===1){ctx.fillStyle='#1a1a2e';ctx.fillRect(x*cell,y*cell,cell,cell);ctx.strokeStyle='#0ff';ctx.lineWidth=1;ctx.strokeRect(x*cell+0.5,y*cell+0.5,cell-1,cell-1);} }
 ctx.fillStyle='#39ff88';ctx.beginPath();ctx.arc(s.level.exit.x,s.level.exit.y,14,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.font='12px Courier New';ctx.fillText('EXIT',s.level.exit.x-14,s.level.exit.y+4);
 s.level.anomalies.forEach(a=>{ctx.fillStyle='rgba(98,0,170,0.5)';ctx.beginPath();ctx.arc(a.x,a.y,a.r,0,7);ctx.fill();ctx.strokeStyle='#ff2ec4';ctx.stroke();});
 s.level.crates.forEach(c=>{ctx.fillStyle='#fa0';ctx.fillRect(c.x-16,c.y-16,32,32);ctx.strokeStyle='#fff';ctx.strokeRect(c.x-16,c.y-16,32,32);});
 let ents=[...s.enemies.map(e=>({y:e.y,e})),{y:s.player.y,p:true}].sort((a,b)=>a.y-b.y);
 ents.forEach(o=>{ if(o.p){ctx.save();ctx.shadowColor='#0ff';ctx.shadowBlur=18;ctx.fillStyle='#0ff';ctx.beginPath();ctx.arc(s.player.x,s.player.y,16,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(s.player.x,s.player.y,7,0,7);ctx.fill();ctx.restore();
   ctx.strokeStyle=s.freeze.active?'#6200aa':'#0ff';ctx.lineWidth=3;ctx.beginPath();ctx.arc(s.player.x,s.player.y,24,-2.2,-2.2+ (Math.PI*1.5)*(s.freeze.energy/100));ctx.stroke();}
  else{let e=o.e;ctx.fillStyle=e.type==='chaser'?'#f00':e.type==='bomber'?'#ff2ec4':'#fa0';ctx.beginPath();ctx.arc(e.x,e.y,e.r,0,7);ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(e.x,e.y,4,0,7);ctx.fill();}});
 if(s.freeze.active){ctx.globalCompositeOperation='screen';let g=ctx.createRadialGradient(420,300,50,420,300,500);g.addColorStop(0,'rgba(98,0,170,0.35)');g.addColorStop(1,'rgba(0,255,255,0.25)');ctx.fillStyle=g;ctx.fillRect(0,0,840,600);ctx.globalCompositeOperation='source-over';ctx.fillStyle='rgba(0,255,255,0.15)';ctx.fillRect(2,0,840,600);ctx.fillStyle='rgba(255,46,196,0.12)';ctx.fillRect(-2,0,840,600);}
 if(s.frozenParticles){s.frozenParticles.forEach(p=>{ctx.fillStyle='rgba(0,255,255,0.7)';ctx.fillRect(p.x,p.y,3,3);});}
}
