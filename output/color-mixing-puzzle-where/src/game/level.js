import { TILE } from '../engine/constants.js';
import { tint } from '../engine/utils.js';

export function makeLevel(){
  const lvl={
    solids:[], droplets:[], palettes:[], gates:[], platforms:[], hazards:[], switches:[], exit:null,
    spawn:{x:80,y:520}, cam:{x:0,y:0}, t:0, par:45, state:'play', won:false, used:0
  };
  // ground
  for(let i=0;i<60;i++) lvl.solids.push({x:i*TILE,y:H()-TILE,w:TILE,h:TILE});
  for(let i=8;i<15;i++) lvl.solids.push({x:i*TILE,y:H()-TILE*5,w:TILE,h:TILE});
  for(let i=18;i<25;i++) lvl.solids.push({x:i*TILE,y:H()-TILE*3,w:TILE,h:TILE});
  for(let i=30;i<40;i++) lvl.solids.push({x:i*TILE,y:H()-TILE*6,w:TILE,h:TILE});
  for(let i=42;i<55;i++) lvl.solids.push({x:i*TILE,y:H()-TILE*4,w:TILE,h:TILE});
  // droplets
  lvl.droplets.push(makeDrop(360,200,'red'));
  lvl.droplets.push(makeDrop(500,300,'green'));
  lvl.droplets.push(makeDrop(700,400,'blue'));
  lvl.droplets.push(makeDrop(1100,300,'red'));
  lvl.droplets.push(makeDrop(1300,400,'green'));
  lvl.droplets.push(makeDrop(1500,500,'blue'));
  // palettes
  lvl.palettes.push({x:900,y:H()-TILE*2-32,w:64,h:64,c:null});
  lvl.palettes.push({x:1200,y:H()-TILE*4-32,w:64,h:64,c:null});
  // gates (colored)
  lvl.gates.push({x:1100,y:H()-TILE*3-80,w:24,h:80,c:tint('yellow'),open:false});
  lvl.gates.push({x:1600,y:H()-TILE*5-80,w:24,h:80,c:tint('cyan'),open:false});
  lvl.gates.push({x:1900,y:H()-TILE*2-80,w:24,h:80,c:tint('magenta'),open:false});
  // platforms (appear when matched)
  lvl.platforms.push({x:1400,y:H()-TILE*3,w:200,h:14,c:tint('yellow'),active:false});
  lvl.platforms.push({x:1750,y:H()-TILE*2,w:200,h:14,c:tint('cyan'),active:false});
  // hazards
  lvl.hazards.push({x:2000,y:H()-TILE-20,w:120,h:20,c:tint('red')});
  // exit
  lvl.exit={x:2200,y:H()-TILE*2-64,w:48,h:64};
  return lvl;
}
function makeDrop(x,y,name){ return {x:x-12,y:y-12,w:24,h:24,c:tint(name),dead:false,dynamic:false,vx:0,vy:0}; }
function H(){ return 720; }
