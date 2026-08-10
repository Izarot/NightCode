export class Centipede {
 constructor(config) {
 this.config = config;
 this.segments = [];
 this.phase = 0;
 this.speed = config.centipede.baseSpeed;
 this.speedMultiplier = 1;
 this.lastSpeedIncrease = 0;
 this.direction = 1;
 this.initSegments();
 }
 
 initSegments() {
 this.segments = [];
 const startX = this.config.canvasWidth / 2;
 const startY = -this.config.centipede.segmentHeight * this.config.centipede.initialSegments;
 for (let i = 0; i < this.config.centipede.initialSegments; i++) {
 this.segments.push({
 x: startX,
 y: startY + i * this.config.centipede.segmentHeight,
 width: this.config.centipede.segmentWidth,
 height: this.config.centipede.segmentHeight,
 isHead: i === 0,
 dead: false,
 regenTimer: 0,
 index: i
 });
 }
 }
 
 update(dt) {
 this.phase += dt * 2;
 
 const now = performance.now() / 1000;
 if (now - this.lastSpeedIncrease >= this.config.centipede.speedIncreaseInterval) {
 this.speedMultiplier *= this.config.centipede.speedIncreaseFactor;
 this.lastSpeedIncrease = now;
 }
 
 const currentSpeed = this.speed * this.speedMultiplier;
 
 for (let i = 0; i < this.segments.length; i++) {
 const seg = this.segments[i];
 if (seg.dead) {
 seg.regenTimer -= dt;
 if (seg.regenTimer <= 0) {
 this.regenerateSegment(i);
 }
 continue;
 }
 
 seg.y += currentSpeed * dt;
 
 const offset = this.config.centipede.amplitude * Math.sin(this.phase + seg.index * this.config.centipede.frequency);
 seg.x = this.config.canvasWidth/2 + offset * this.direction;
 
 if (seg.x <= 0 || seg.x + seg.width >= this.config.canvasWidth) {
 this.direction *= -1;
 for (const s of this.segments) {
 if (!s.dead) s.y += 10;
 }
 break;
 }
 }
 
 this.segments = this.segments.filter(seg => !seg.dead || seg.regenTimer > 0);
 
 this.segments.forEach((seg, i) => seg.index = i);
 }
 
 hitSegment(index) {
 if (index < 0 || index >= this.segments.length) return 0;
 const seg = this.segments[index];
 if (seg.dead) return 0;
 
 seg.dead = true;
 seg.regenTimer = this.config.centipede.regenDelay;
 
 if (seg.isHead) {
 for (let i = index + 1; i < this.segments.length; i++) {
 if (!this.segments[i].dead) {
 this.segments[i].isHead = true;
 this.direction *= -1;
 return 50;
 }
 }
 return 50;
 }
 
 return 10;
 }
 
 regenerateSegment(index) {
 const tail = this.segments[this.segments.length - 1];
 if (!tail) return;
 this.segments.push({
 x: tail.x,
 y: tail.y + this.config.centipede.segmentHeight,
 width: this.config.centipede.segmentWidth,
 height: this.config.centipede.segmentHeight,
 isHead: false,
 dead: false,
 regenTimer: 0,
 index: this.segments.length
 });
 }
 
 reachedBottom() {
 return this.segments.some(seg => !seg.dead && seg.y + seg.height >= this.config.canvasHeight - 10);
 }
 
 getSegments() {
 return this.segments.filter(seg => !seg.dead);
 }
 
 getSpeedMultiplier() {
 return this.speedMultiplier;
 }
 
 render(ctx) {
 for (const seg of this.segments) {
 if (seg.dead) {
 if (Math.floor(performance.now() / 100) % 2 === 0) continue;
 ctx.fillStyle = this.config.colors.dead;
 }
 else if (seg.isHead) {
 ctx.fillStyle = this.config.colors.head;
 } else {
 ctx.fillStyle = this.config.colors.body;
 }
 
 ctx.beginPath();
 ctx.roundRect(seg.x, seg.y, seg.width, seg.height, 4);
 ctx.fill();
 
 if (seg.isHead && !seg.dead) {
 ctx.fillStyle = '#fff';
 ctx.beginPath();
 ctx.arc(seg.x + 6, seg.y + 4, 2, 0, Math.PI*2);
 ctx.arc(seg.x + seg.width - 6, seg.y + 4, 2, 0, Math.PI*2);
 ctx.fill();
 }
 
 if (!seg.isHead && !seg.dead) {
 ctx.fillStyle = 'rgba(0,0,0,0.1)';
 ctx.fillRect(seg.x + 2, seg.y + 2, seg.width - 4, seg.height - 4);
 }
 }
 }
 }
 
 reset() {
 this.phase = 0;
 this.speedMultiplier = 1;
 this.lastSpeedIncrease = performance.now() / 1000;
 this.direction = 1;
 this.initSegments();
 }
}