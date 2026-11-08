export function createEnemy(type,x,y){return{type,x,y,r:14,speed:type==='chaser'?115:type==='bomber'?185:85,waypoints:type==='patroller'?[{x:x+90,y},{x:x-90,y}]:[],wp:0,active:false,hitCd:0};}
function isWall(x,y,tiles,cols,rows,cell){let tx=Math.floor(x/cell),ty=Math.floor(y/cell); return tx<0||ty<0||tx>=cols||ty>=rows||tiles[ty][tx]===1;}
export function updateEnemy(e,player,dt,frozen,tiles,cols,rows,cell){
 if(e.type!=='chaser'&&frozen)return;
 let dx=player.x-e.x,dy=player.y-e.y,dist=Math.hypot(dx,dy)||1,mx=0,my=0;
 if(e.type==='chaser'){if(dist<250){mx=dx/dist*e.speed;my=dy/dist*e.speed;}}
 else if(e.type==='patroller'){let t=e.waypoints[e.wp];let d=Math.hypot(t.x-e.x,t.y-e.y); if(d<6)e.wp=(e.wp+1)%e.waypoints.length; else{mx=(t.x-e.x)/d*e.speed;my=(t.y-e.y)/d*e.speed;}}
 else if(e.type==='bomber'){if(dist<300){e.active=true;mx=dx/dist*e.speed;my=dy/dist*e.speed;}}
 e.x+=mx*dt; if(isWall(e.x,e.y,tiles,cols,rows,cell))e.x-=mx*dt;
 e.y+=my*dt; if(isWall(e.x,e.y,tiles,cols,rows,cell))e.y-=my*dt;
 if(e.hitCd>0)e.hitCd-=dt;
}
