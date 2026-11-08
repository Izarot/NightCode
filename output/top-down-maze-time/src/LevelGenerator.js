export class LevelGenerator{
 generate(cols,rows){
  let tiles=Array.from({length:rows},()=>Array(cols).fill(1));
  let stack=[[1,1]]; tiles[1][1]=0; let visited=new Set(['1,1']);
  while(stack.length){ let cur=stack[stack.length-1]; let cx=cur[0],cy=cur[1]; let nb=[];
   [[2,0],[-2,0],[0,2],[0,-2]].forEach(d=>{let nx=cx+d[0],ny=cy+d[1]; if(nx>0&&nx<cols-1&&ny>0&&ny<rows-1&&!visited.has(nx+','+ny)) nb.push([nx,ny]);});
   if(!nb.length){stack.pop();continue;}
   let n=nb[Math.floor(Math.random()*nb.length)]; tiles[cy+(n[1]-cy)/2][cx+(n[0]-cx)/2]=0; tiles[n[1]][n[0]]=0; visited.add(n[0]+','+n[1]); stack.push(n);}
  for(let r=0;r<2;r++){let rx=1+Math.floor(Math.random()*(cols-4)),ry=1+Math.floor(Math.random()*(rows-4)); for(let y=ry;y<ry+3;y++)for(let x=rx;x<rx+3;x++) tiles[y][x]=0;}
  for(let i=0;i<7;i++){let x=1+Math.floor(Math.random()*(cols-2)),y=1+Math.floor(Math.random()*(rows-2)); tiles[y][x]=0;}
  tiles[1][1]=0; tiles[rows-2][cols-2]=0;
  let crates=[],anomalies=[];
  for(let y=1;y<rows-1;y++)for(let x=1;x<cols-1;x++){ if(tiles[y][x]===0&&!(x===1&&y===1)&&!(x===cols-2&&y===rows-2)){let rnd=Math.random(); if(rnd<0.045) crates.push({x:x*40+20,y:y*40+20,hp:3,r:16}); else if(rnd<0.065) anomalies.push({x:x*40+20,y:y*40+20,r:30});}}
  return {tiles,cols,rows,crates,anomalies,exit:{x:(cols-2)*40+20,y:(rows-2)*40+20},playerStart:{x:60,y:60}};
 }
}
