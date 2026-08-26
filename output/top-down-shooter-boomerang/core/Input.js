export class Input{
constructor(canvas){
this.canvas=canvas;
this.keys={};this.pressed={};this.mouse={x:640,y:360,down:false,click:false};
this._bind();
}
_bind(){
window.addEventListener('keydown',e=>{if(!this.keys[e.code])this.pressed[e.code]=true;this.keys[e.code]=true;});
window.addEventListener('keyup',e=>{this.keys[e.code]=false;});
this.canvas.addEventListener('mousemove',e=>{
const r=this.canvas.getBoundingClientRect();
this.mouse.x=(e.clientX-r.left)*(1280/r.width);
this.mouse.y=(e.clientY-r.top)*(720/r.height);
});
this.canvas.addEventListener('mousedown',e=>{this.mouse.down=true;this.mouse.click=true;});
this.canvas.addEventListener('mouseup',e=>{this.mouse.down=false;});
this.canvas.addEventListener('contextmenu',e=>e.preventDefault());
}
update(){
this.mouse.click=false;
if(this.pressed['KeyW']||this.pressed['ArrowUp'])this.pressed['KeyW']=true;
}
held(code){return !!this.keys[code];}
pressed(code){return !!this.pressed[code];}
moveDir(){
let dx=0,dy=0;
if(this.held('KeyW')||this.held('ArrowUp'))dy-=1;
if(this.held('KeyS')||this.held('ArrowDown'))dy+=1;
if(this.held('KeyA')||this.held('ArrowLeft'))dx-=1;
if(this.held('KeyD')||this.held('ArrowRight'))dx+=1;
const l=Math.sqrt(dx*dx+dy*dy);
if(l>0){dx/=l;dy/=l;}
return{dx,dy};
}
clear(){
this.pressed={};
this.mouse.click=false;
}
}