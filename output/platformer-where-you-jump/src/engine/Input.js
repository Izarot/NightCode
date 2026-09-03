export class Input{
  constructor(){this.keys=new Set();this.pressed=new Set();
    window.addEventListener('keydown',e=>{if(!this.keys.has(e.code))this.pressed.add(e.code);this.keys.add(e.code);e.preventDefault&&e.preventDefault();});
    window.addEventListener('keyup',e=>{this.keys.delete(e.code);});
  }
  isDown(c){return this.keys.has(c);}
  pressed(c){const p=this.pressed.has(c);return p;}
  endFrame(){this.pressed.clear();}
}
