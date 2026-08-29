export class Input{
constructor(canvas,game){
this.g=game;
canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();this.update(e.clientX-r.left,e.clientY-r.top);});
canvas.addEventListener('mousedown',e=>{if(e.button===0)this.g.placeTile(this.g.hover.x,this.g.hover.y,this.g.selected,this.g.rot);else if(e.button===2)this.g.rotateHover();});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('touchstart',e=>{e.preventDefault();const t=e.touches[0];const r=canvas.getBoundingClientRect();this.update(t.clientX-r.left,t.clientY-r.top);if(this.g.phase==='setup')this.longPressT=Date.now();},{passive:false});
canvas.addEventListener('touchend',e=>{e.preventDefault();if(this.longPressT&&Date.now()-this.longPressT>400)this.g.rotateHover();else this.g.placeTile(this.g.hover.x,this.g.hover.y,this.g.selected,this.g.rot);this.longPressT=0;},{passive:false});
window.addEventListener('keydown',e=>{
if(e.key>='1'&&e.key<='6')this.g.selected=['arrow4','conveyor','oneway','mirror','teleporter'][+e.key-1];
if(e.key==='r'||e.key==='R')this.g.rotateHover();
if(e.key===' '){e.preventDefault();this.g.startRun();}
if(e.key==='Escape')this.g.togglePause();
if(e.key==='+'||e.key==='='){this.g.setSpeed(Math.min(4,this.g.speed*2));}
if(e.key==='-')this.g.setSpeed(Math.max(1,this.g.speed/2));
});
}
update(mx,my){
if(!this.g.level)return;
const x=Math.floor((mx-this.g.offsetX)/this.g.cell),y=Math.floor((my-this.g.offsetY)/this.g.cell);
if(x>=0&&y>=0&&x<this.g.cols&&y<this.g.rows)this.g.hover={x,y};else this.g.hover=null;
}
}
