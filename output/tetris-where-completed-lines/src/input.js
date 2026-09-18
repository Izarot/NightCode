class InputHandler{
constructor(){
this.keys={};
this.actions=[];
this.touchActions=[];
window.addEventListener('keydown',e=>{
if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp','Space','Shift','KeyZ','KeyX','Escape','Enter'].includes(e.code))e.preventDefault();
if(!this.keys[e.code])this.actions.push(e.code);
this.keys[e.code]=true;
});
window.addEventListener('keyup',e=>{this.keys[e.code]=false;});
const btns=document.querySelectorAll('.touch-btn');
btns.forEach(btn=>{
const action=btn.dataset.action;
const handler=e=>{e.preventDefault();this.touchActions.push(action);};
btn.addEventListener('touchstart',handler,{passive:false});
btn.addEventListener('mousedown',handler);
});
}
consumeKey(code){const idx=this.actions.indexOf(code);if(idx>=0){this.actions.splice(idx,1);return true;}return false;}
consumeTouch(action){const idx=this.touchActions.indexOf(action);if(idx>=0){this.touchActions.splice(idx,1);return true;}return false;}
get left(){return this.consumeKey('ArrowLeft')||this.consumeKey('KeyA');}
get right(){return this.consumeKey('ArrowRight')||this.consumeKey('KeyD');}
get down(){return this.consumeKey('ArrowDown')||this.consumeKey('KeyS');}
get drop(){return this.consumeKey('Space');}
get rotate(){return this.consumeKey('ArrowUp')||this.consumeKey('KeyW')||this.consumeTouch('rotate');}
get rotateCCW(){return this.consumeKey('KeyZ');}
get hold(){return this.consumeKey('Shift');}
get pause(){return this.consumeKey('Escape')||this.consumeKey('Enter');}
}
