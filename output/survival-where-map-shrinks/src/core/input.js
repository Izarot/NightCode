export class Input{
  constructor(canvas){
    this.keys = {};
    this.mouse = {x:0,y:0,down:false,worldX:0,worldY:0};
    this.canvas = canvas;
    window.addEventListener('keydown', e=>{ this.keys[e.key.toLowerCase()]=true; });
    window.addEventListener('keyup', e=>{ this.keys[e.key.toLowerCase()]=false; });
    canvas.addEventListener('mousemove', e=>{
      const r = canvas.getBoundingClientRect();
      this.mouse.x = (e.clientX-r.left)*(canvas.width/r.width);
      this.mouse.y = (e.clientY-r.top)*(canvas.height/r.height);
    });
    canvas.addEventListener('mousedown', ()=>this.mouse.down=true);
    canvas.addEventListener('mouseup', ()=>this.mouse.down=false);
    canvas.addEventListener('contextmenu', e=>e.preventDefault());
  }
  updateWorld(cam){
    this.mouse.worldX = this.mouse.x + cam.x;
    this.mouse.worldY = this.mouse.y + cam.y;
  }
}
