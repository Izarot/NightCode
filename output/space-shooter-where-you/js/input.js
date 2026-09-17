export class Input{
  constructor(){
    this.keys = new Set();
    this.mouse = {x:0, y:0, left:false, right:false};
    this.pointer = {x:0, y:0, held:false};
  }
  
  keyDown(e){
    this.keys.add(e.code);
    if(['Space','Shift','M'].includes(e.code)) e.preventDefault();
  }
  
  keyUp(e){
    this.keys.delete(e.code);
  }
  
  mouseDown(e){
    if(e.button === 0) this.mouse.left = true;
    if(e.button === 2) this.mouse.right = true;
    this.pointer.held = true;
  }
  
  mouseUp(e){
    if(e.button === 0) this.mouse.left = false;
    if(e.button === 2) this.mouse.right = false;
    this.pointer.held = false;
  }
  
  mouseMove(e){
    const rect = e.target.getBoundingClientRect();
    this.mouse.x = e.clientX - rect.left;
    this.mouse.y = e.clientY - rect.top;
    this.pointer.x = e.clientX;
    this.pointer.y = e.clientY;
  }
  
  isDown(code){ return this.keys.has(code); }
  
  isPressed(code){ return this.keys.has(code); }
  
  update(){ }
}