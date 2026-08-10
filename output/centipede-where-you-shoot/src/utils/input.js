export class InputHandler {
 constructor(canvas) {
 this.canvas = canvas;
 this.listeners = {};
 this.keys = {};
 this.touchX = null;
 
 window.addEventListener('keydown', (e) => this.onKeyDown(e));
 window.addEventListener('keyup', (e) => this.onKeyUp(e));
 canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
 canvas.addEventListener('click', (e) => this.onClick(e));
 canvas.addEventListener('touchstart', (e) => this.onTouch(e), { passive: false });
 canvas.addEventListener('touchmove', (e) => this.onTouch(e), { passive: false });
 canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
 }
 
 on(event, callback) {
 if (!this.listeners[event]) this.listeners[event] = [];
 this.listeners[event].push(callback);
 }
 
 emit(event, data) {
 if (this.listeners[event]) {
 this.listeners[event].forEach(cb => cb(data));
 }
 }
 
 onKeyDown(e) {
 this.keys[e.code] = true;
 if (e.code === 'Space') {
 e.preventDefault();
 this.emit('fire');
 } else if (e.code === 'Escape' || e.code === 'KeyP') {
 this.emit('pause');
 }
 }
 
 onKeyUp(e) {
 this.keys[e.code] = false;
 }
 
 onMouseMove(e) {
 const rect = this.canvas.getBoundingClientRect();
 const x = e.clientX - rect.left;
 this.emit('move', x);
 }
 
 onClick(e) {
 this.emit('fire');
 }
 
 onTouch(e) {
 e.preventDefault();
 const rect = this.canvas.getBoundingClientRect();
 const touch = e.touches[0];
 if (touch) {
 const x = touch.clientX - rect.left;
 this.emit('move', x);
 }
 }
 
 onTouchEnd(e) {
 this.emit('fire');
 }
 
 update() {
 if (this.keys['ArrowLeft'] || this.keys['KeyA']) {
 this.emit('move', -1);
 } else if (this.keys['ArrowRight'] || this.keys['KeyD']) {
 this.emit('move', -2);
 }
 }
}