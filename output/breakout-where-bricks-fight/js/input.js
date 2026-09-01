class InputHandler {
 constructor(canvas) {
 this.canvas = canvas;
 this.mouseX = CFG.w/2;
 this.keys = {};
 this.click = false;
 canvas.addEventListener('mousemove', e => {
 const r = canvas.getBoundingClientRect();
 this.mouseX = (e.clientX - r.left) * (CFG.w / r.width);
 });
 canvas.addEventListener('mousedown', () => this.click = true);
 window.addEventListener('keydown', e => {
 this.keys[e.key] = true;
 if (e.key === ' ') this.click = true;
 if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') this.keys['_pause'] = true;
 });
 window.addEventListener('keyup', e => this.keys[e.key] = false);
 }
 consumeClick() { const c = this.click; this.click = false; return c; }
 consumePause() { const c = this.keys['_pause']; this.keys['_pause'] = false; return c; }
}
