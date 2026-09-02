const BLOCK_TYPES={
  square:{w:1,h:1,cells:[[0,0]]},
  domino:{w:2,h:1,cells:[[0,0],[1,0]]},
  long:{w:1,h:3,cells:[[0,0],[0,1],[0,2]]},
  tblock:{w:3,h:2,cells:[[0,1],[1,0],[1,1],[2,1]]},
  lblock:{w:2,h:2,cells:[[0,0],[0,1],[1,1]]}
};
const COLORS={
  bg:'#1a1a2e',ground:'#16213e',grid:'#0f3460',
  block:'#e94560',stroke:'#ff6b6b',accent:'#ffd93d',
  text:'#eaeaea',mute:'#a0a0a0',
  valid:'#4ecca3',invalid:'#ff4757',textDark:'#1a1a2e'
};
const GRID_COLS=5,CELL=60,GROUND_ROWS=12;
const state={
  currentLevel:1,placed:[],palette:{},targetHeight:0,currentHeight:0,
  starsEarned:{},selectedBlock:null,selectedRot:0,
  mouseX:0,mouseY:0,hoverValid:false,hoverPos:null,
  totalStars:0,particles:[],shakeBlocks:[],windT:0,
  history:[],startTime:0,elapsedTime:0,bestTimes:{},
  showGhost:true,activeScreen:'title'
};
function saveBest(levelIdx,time){
  const key='bt_best_'+levelIdx;
  const prev=state.bestTimes[levelIdx];
  if(!prev||time<prev){state.bestTimes[levelIdx]=time;localStorage.setItem(key,time);return true;}
  return false;
}
function loadBest(){
  for(let i=1;i<=10;i++){
    const v=localStorage.getItem('bt_best_'+i);
    if(v)state.bestTimes[i]=parseFloat(v);
  }
  const hs=localStorage.getItem('bt_highscore');
  if(hs)state.totalStars=parseInt(hs);
  const ls=localStorage.getItem('bt_stars');
  if(ls)try{state.starsEarned=JSON.parse(ls);}catch(e){}
}
function saveStars(){
  localStorage.setItem('bt_stars',JSON.stringify(state.starsEarned));
  localStorage.setItem('bt_highscore',state.totalStars.toString());
}
function maxHeight(){
  if(!state.placed.length)return 0;
  return Math.max(...state.placed.map(b=>b.y+b.h));
}
function isValidPlacement(block,px,py,ignore){
  ignore=ignore||null;
  if(px<0||py<0||px+block.w>GRID_COLS)return false;
  for(let i=0;i<state.placed.length;i++){
    if(ignore&&state.placed[i]===ignore)continue;
    const b=state.placed[i];
    if(px<b.x+b.w&&px+block.w>b.x&&py<b.y+b.h&&py+block.h>b.y)return false;
  }
  let supported=false;
  for(let cy=0;cy<block.h;cy++){
    for(let cx=0;cx<block.w;cx++){
      const gx=px+cx,gy=py+cy;
      if(!BLOCK_TYPES[block.type].cells.some(c=>c[0]===cx&&c[1]===cy))continue;
      if(gy===0){supported=true;break;}
      for(let i=0;i<state.placed.length;i++){
        if(ignore&&state.placed[i]===ignore)continue;
        const b=state.placed[i];
        if(gx>=b.x&&gx<b.x+b.w&&gy-1>=b.y&&gy-1<b.y+b.h){supported=true;break;}
      }
      if(supported)break;
    }
    if(supported)break;
  }
  return supported;
}
function stabilityScore(){
  if(!state.placed.length)return 100;
  let total=0,support=0;
  for(const b of state.placed){
    total++;
    if(b.y===0){support++;continue;}
    const baseCells=[];
    for(let cx=0;cx<b.w;cx++){
      const supported=state.placed.some(o=>o!==b&&cx+b.x>=o.x&&cx+b.x<o.x+o.w&&b.y-1>=o.y&&b.y-1<o.y+o.h);
      if(supported)baseCells.push(true);
    }
    const ratio=baseCells.length/b.w;
    support+=ratio;
  }
  return Math.round((support/total)*100);
}
function resetLevel(){
  state.placed=[];state.history=[];state.selectedBlock=null;
  state.hoverPos=null;state.particles=[];
  const lvl=LEVELS[state.currentLevel-1];
  state.targetHeight=lvl.target;
  state.palette=JSON.parse(JSON.stringify(lvl.blocks));
  state.currentHeight=0;
  state.startTime=Date.now();
}
