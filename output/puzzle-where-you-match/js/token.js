class Token{
 constructor(){this.x=0;this.y=0;this.px=0;this.py=0;this.path=[];this.step=0;this.t=0;this.moving=false;this.rot=0;this.done=false}
 start(path){this.path=path;this.step=0;this.t=0;this.moving=true;this.done=false;this.x=path[0].x;this.y=path[0].y;this.px=this.x;this.py=this.y}
 update(dt){if(!this.moving||this.step>=this.path.length-1){if(this.moving&&this.step>=this.path.length-1){this.moving=false;this.done=true}return}
  this.t+=dt/150;if(this.t>=1){this.step++;this.t=0;this.x=this.path[this.step].x;this.y=this.path[this.step].y;this.px=this.x;this.py=this.y;this.rot+=90;if(window.onTokenStep)window.onTokenStep(this.step);return}
  const e=1-Math.pow(1-this.t,3);const a=this.path[this.step],b=this.path[this.step+1];this.px=a.x+(b.x-a.x)*e;this.py=a.y+(b.y-a.y)*e}
 halt(){this.moving=false}
}
