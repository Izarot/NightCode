export class InputManager {
 constructor() {
  this.keys = {};
  this.mouse = {x:0, y:0, left:false, right:false};
  this.touchStart = {x:0, y:0};
  
  window.addEventListener('keydown', e => this.keys[e.code] = true);
  window.addEventListener('keyup', e => this.keys[e.code] = false);
  
  canvas.addEventListener('mousedown', e => {
   this.mouse.left = e.button === 0;
   this.mouse.right = e.button === 2;
  });
  
  canvas.addEventListener('mousemove', e => {
   const rect = canvas.getBoundingClientRect();
   this.mouse.x = e.clientX - rect.left;
   this.mouse.y = e.clientY - rect.top;
  });
  
  canvas.addEventListener('touchstart', e => {
   e.preventDefault();
   const touch = e.touches[0];
   this.touchStart = {x: touch.clientX, y: touch.clientY};
  });
 }
 
 update() {
  // Touch fallback
  if (this.touchStart) {
   // Simple tap detection
  }
 }
}
