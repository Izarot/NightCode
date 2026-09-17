import {shuffle} from './rng.js';
export const families=['Mirrored mosaic','Diamond','Waves','Chevrons','Fortress','Cellular islands','Concentric frames'];
export function makeMask(family,rows,density,rng){
 const scores=Array.from({length:rows},()=>Array(14).fill(0));
 let noise=Array.from({length:rows},()=>Array.from({length:14},()=>rng()));
 if(family===5){for(let k=0;k<2;k++){noise=noise.map((row,r)=>row.map((v,c)=>{let s=v*2,n=2;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const t=noise[r+dy]?.[c+dx];if(t!==undefined){s+=t;n++;}}return s/n;}));}}
 const phase=rng()*Math.PI*2;
 for(let r=0;r<rows;r++)for(let c=0;c<14;c++){
  const x=(c-6.5)/6.5,y=(r-(rows-1)/2)/Math.max(1,(rows-1)/2);let s=0;
  if(family===0){const mc=Math.min(c,13-c);s=noise[r][mc]*.6+(noise[Math.max(0,r-1)][mc]+noise[Math.min(rows-1,r+1)][mc])*.35;}
  if(family===1)s=1-Math.abs(x)*.72-Math.abs(y)*.62;
  if(family===2)s=Math.cos((r/rows*2.6-Math.sin(c*.52+phase)*.68)*Math.PI);
  if(family===3)s=Math.cos((r*.77-Math.abs(c-6.5)*.59)*Math.PI);
  if(family===4)s=(r>=rows-2?.85:0)+(c<3||c>10?.7:0)+(r===0&&(c%3===0)? .35:0)-(c===6||c===7?.5:0);
  if(family===5)s=noise[r][c]*5;
  if(family===6){const d=Math.min(r,rows-1-r,c,13-c);s=(d%2===0?1:0)-((c===6||c===7)&&r%3!==1?1.7:0);}
  scores[r][c]=s+rng()*.15;
 }
 const mask=Array.from({length:rows},()=>Array(14).fill(false));
 const symmetry=family===0||family===1||family===3||family===4;
 let target=Math.round(rows*14*density);
 if(symmetry){const cells=[];for(let r=0;r<rows;r++)for(let c=0;c<7;c++)cells.push({r,c,s:(scores[r][c]+scores[r][13-c])/2});cells.sort((a,b)=>b.s-a.s);for(const {r,c}of cells.slice(0,Math.round(target/2)))mask[r][c]=mask[r][13-c]=true;}
 else{const cells=[];for(let r=0;r<rows;r++)for(let c=0;c<14;c++)cells.push({r,c,s:scores[r][c]});cells.sort((a,b)=>b.s-a.s);for(const {r,c}of cells.slice(0,target))mask[r][c]=true;}
 if(family===5){const visited=new Set();for(let r=0;r<rows;r++)for(let c=0;c<14;c++){const id=r*14+c;if(!mask[r][c]||visited.has(id))continue;const group=[[r,c]];visited.add(id);for(let i=0;i<group.length;i++){const [y,x]=group[i];for(const [dy,dx]of [[0,1],[0,-1],[1,0],[-1,0]]){const yy=y+dy,xx=x+dx,key=yy*14+xx;if(yy>=0&&yy<rows&&xx>=0&&xx<14&&mask[yy][xx]&&!visited.has(key)){visited.add(key);group.push([yy,xx]);}}}if(group.length<3)for(const [y,x]of group)mask[y][x]=false;}
  const candidates=[];for(let r=0;r<rows;r++)for(let c=0;c<14;c++)if(!mask[r][c])candidates.push({r,c,s:scores[r][c]});candidates.sort((a,b)=>b.s-a.s);
  let count=mask.flat().filter(Boolean).length;while(count<target){const i=candidates.findIndex(({r,c})=>[[0,1],[0,-1],[1,0],[-1,0]].some(([dy,dx])=>mask[r+dy]?.[c+dx]));if(i<0)break;const {r,c}=candidates.splice(i,1)[0];mask[r][c]=true;count++;}
 }
 // The two bottom rows are a deliberate, readable entry band.
 let bottom=mask[rows-1].filter(Boolean).length+mask[rows-2].filter(Boolean).length;
 const order=shuffle([0,1,2,3,4,5,6],rng);
 for(const c of order){if(bottom>=6)break;for(const x of [c,13-c])if(!mask[rows-1][x]){mask[rows-1][x]=true;bottom++;}}
 let count=mask.flat().filter(Boolean).length;
 const max=Math.floor((density+.08)*rows*14);
 const removable=[];for(let r=0;r<rows-2;r++)for(let c=0;c<(symmetry?7:14);c++)if(mask[r][c])removable.push({r,c,s:scores[r][c]});removable.sort((a,b)=>a.s-b.s);
 for(const {r,c}of removable){if(count<=Math.max(target,max-1))break;mask[r][c]=false;count--;if(symmetry&&mask[r][13-c]){mask[r][13-c]=false;count--;}}
 return mask;
}
