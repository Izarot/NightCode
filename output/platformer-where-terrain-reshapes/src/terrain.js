import {noise,clamp} from './utils.js';
export class Terrain{
constructor(){this.segW=32;this.segments=[];this.generate(0,22000);}
generate(start,end){this.segments=[];for(let x=start;x<end;x+=this.segW){const base=620+noise(x);this.segments.push({x,h:base,orig:base,stability:1,dissolve:0});}}
update(player,frame){const sp=Math.abs(player.speed);for(const s of this.segments){let amp=0;if(sp>=4&&sp<8)amp=(sp-4)*0.5;if(sp>=8)amp=2+(sp-8)*0.25; s.h=s.orig+Math.sin(s.x*0.1+frame*0.05)*amp*0.3; s.stability=1-sp/12; s.dissolve=s.stability<0.2?Math.min(1,s.dissolve+0.02):Math.max(0,s.dissolve-0.05);}}
groundAt(x){const i=Math.floor(x/this.segW);const s=this.segments[clamp(i,0,this.segments.length-1)];return s?s.h:620;}
draw(ctx,cam,player){const sp=Math.abs(player.speed);const hot=clamp((sp-4)/8,0,1);for(const s of this.segments){const sx=s.x-cam;if(sx<-40||sx>1700)continue;const h=s.h;const alpha=1-s.dissolve*0.7;ctx.globalAlpha=alpha;const g=ctx.createLinearGradient(0,h,0,900);if(hot<0.5){g.addColorStop(0,'#00e5ff');g.addColorStop(0.4,'#7b2ff7');g.addColorStop(1,'#ff2ea6');}else{g.addColorStop(0,'#ffe600');g.addColorStop(0.4,'#ff6a00');g.addColorStop(1,'#ff004c');}ctx.fillStyle=g;ctx.fillRect(sx,h,this.segW+1,900-h);ctx.fillStyle='rgba(255,255,255,0.85)';ctx.fillRect(sx,h,this.segW+1,5);}ctx.globalAlpha=1;}}
