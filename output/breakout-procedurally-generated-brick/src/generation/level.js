import {C,palettes} from '../config.js';
import {stream} from './rng.js';
import {makeMask,families} from './patterns.js';
import {validate} from './validator.js';
export function generate(seed,level){
 const rng=stream(seed,`layout:${level}`),drops=stream(seed,`drops:${level}`);
 const family=Math.floor(rng()*families.length),rows=Math.min(10,5+Math.floor((level-1)/2));
 const mask=makeMask(family,rows,Math.min(.76,.5+level*.018),rng),colors=palettes[(level-1)%palettes.length];
 const bricks=[];
 for(let r=0;r<rows;r++)for(let c=0;c<C.COLS;c++)if(mask[r][c]){
  const roll=rng();let type=level>2&&r<rows-2&&roll<.045?'steel':level>1&&roll<.24?'armor':'normal';
  const hp=type==='armor'?2:1,dropRoll=drops();
  const drop=dropRoll<.16?['expand','slow','multi','shield'][Math.floor(drops()*4)]:null;
  bricks.push({id:r*14+c,row:r,col:c,x:C.GX+c*(C.BW+C.GAP),y:C.GY+r*(C.BH+C.GAP),w:C.BW,h:C.BH,type,hp,maxHp:hp,alive:true,color:colors[r%colors.length],drop});
 }
 if(!validate(bricks,rows,level).ok)for(const b of bricks)if(b.type==='steel')b.type='normal';
 if(bricks.length<28){for(let r=rows-1;r>=0&&bricks.length<28;r--)for(let c=0;c<14&&bricks.length<28;c++)if(!bricks.some(b=>b.id===r*14+c))bricks.push({id:r*14+c,row:r,col:c,x:C.GX+c*(C.BW+C.GAP),y:C.GY+r*(C.BH+C.GAP),w:C.BW,h:C.BH,type:'normal',hp:1,maxHp:1,alive:true,color:colors[r%4],drop:null});}
 return {bricks,name:families[family],rows};
}
