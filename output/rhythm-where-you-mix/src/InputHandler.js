import {INGREDIENTS} from './Data.js';
export class InputHandler{
  constructor(canvas,state){
    this.canvas=canvas;
    this.state=state;
    this.dragging=null;
    this.pressStart=0;
    this.bindEvents();
    this.spawn();
  }
  bindEvents(){
    const c=this.canvas;
    const toXY=(e)=>{
      const r=c.getBoundingClientRect();
      const t=e.touches?e.touches[0]:e;
      return {x:(t.clientX-r.left)*(1280/r.width),y:(t.clientY-r.top)*(720/r.height)};
    };
    c.addEventListener('mousedown',(e)=>this.start(toXY(e)));
    c.addEventListener('mousemove',(e)=>this.move(toXY(e)));
    c.addEventListener('mouseup',(e)=>this.end(toXY(e)));
    c.addEventListener('touchstart',(e)=>{e.preventDefault();this.start(toXY(e));});
    c.addEventListener('touchmove',(e)=>{e.preventDefault();this.move(toXY(e));});
    c.addEventListener('touchend',(e)=>{e.preventDefault();this.end(toXY(e));});
    window.addEventListener('keydown',(e)=>{
      if(e.code==='Space'||e.code==='ShiftLeft')this.dash();
      if(e.code==='KeyG')this.state.showGrid=!this.state.showGrid;
      if(e.code==('KeyM'||'KeyM'))this.state.muted=!this.state.muted;
    });
  }
  spawn(){
    if(this.state.queue.length<3){
      this.state.queue.push(INGREDIENTS[Math.floor(Math.random()*INGREDIENTS.length)]);
    }
    this.state.ingredients=this.state.queue.map((ing,i)=>{
      const ang=(i/3)*Math.PI*2;
      return {...ing,x:640+Math.cos(ang)*200,y:400+Math.sin(ang)*200,r:40,idx:i};
    });
  }
  start(p){
    for(const ing of this.state.ingredients){
      const d=Math.hypot(p.x-ing.x,p.y-ing.y);
      if(d<ing.r){this.dragging=ing;this.pressStart=performance.now();return;}
    }
  }
  move(p){
    if(this.dragging){this.dragging.x=p.x;this.dragging.y=p.y;}
  }
  end(p){
    if(!this.dragging)return;
    const ing=this.dragging;this.dragging=null;
    const dx=p.x-this.state.cauldron.x,dy=p.y-this.state.cauldron.y;
    if(Math.hypot(dx,dy)<this.state.cauldron.r){
      const held=(performance.now()-this.pressStart)/1000;
      window.game.levels.commitMix(ing.id,held);
    }
  }
  dash(){
    if(this.state.dashCd>0)return;
    this.state.dashTarget={x:this.state.avatar.x+(Math.random()-0.5)*300,y:this.state.avatar.y+(Math.random()-0.5)*300};
    this.state.dashCd=0.8;
  }
  update(){}
}