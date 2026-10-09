export class Snake {
  constructor() {
    this.reset();
  }

  reset() {
    this.body = [{ x: 20, y: 15 }];
    this.dir = { x: 1, y: 0 };
    this.inputBuffer = [];
    this.score = 0;
    this.hunger = 10;
    this.hp = 100;
    this.length = 1;
    this.eatenCount = 0;
  }

  queueInput(dir) {
    if (this.inputBuffer.length < 2) {
      this.inputBuffer.push(dir);
    }
  }

  move() {
    if (this.inputBuffer.length > 0) {
      const next = this.inputBuffer.shift();
      if (next.x !== -this.dir.x || next.y !== -this.dir.y) {
        this.dir = next;
      }
    }
    const head = { x: this.body[0].x + this.dir.x, y: this.body[0].y + this.dir.y };
    this.body.unshift(head);
  }

  popTail() {
    this.body.pop();
  }

  grow(type) {
    this.eatenCount++;
    if (type === 'golden') {
      this.score += 10;
      this.hunger = Math.max(0, this.hunger - 40);
      this.hp = Math.min(100, this.hp + 50);
    } else {
      this.score += 1;
      this.hunger = Math.max(0, this.hunger - 25);
      this.hp = Math.min(100, this.hp + 20);
    }
    this.length = this.body.length;
  }

  checkCollision(grid) {
    const head = this.body[0];
    if (head.x < 0 || head.x >= grid.cols || head.y < 0 || head.y >= grid.rows) return true;
    if (grid.isWall(head.x, head.y)) return true;
    for (let i = 1; i < this.body.length; i++) {
      if (this.body[i].x === head.x && this.body[i].y === head.y) return true;
    }
    return false;
  }

  draw(ctx, offsetX, offsetY, scale, ts) {
    const head = this.body[0];
    const gradient = ctx.createLinearGradient(
      offsetX + head.x * ts * scale,
      offsetY + head.y * ts * scale,
      offsetX + (head.x + 1) * ts * scale,
      offsetY + (head.y + 1) * ts * scale
    );
    gradient.addColorStop(0, '#00FF88');
    gradient.addColorStop(1, '#004D29');
    ctx.fillStyle = gradient;

    ctx.beginPath();
    for (let i = 0; i < this.body.length; i++) {
      const seg = this.body[i];
      const x = offsetX + seg.x * ts * scale;
      const y = offsetY + seg.y * ts * scale;
      const size = ts * scale * 0.9;
      if (i === 0) {
        ctx.moveTo(x + size / 2, y + size / 2);
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      } else {
        ctx.lineTo(x + size / 2, y + size / 2);
        ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      }\n    }\n    ctx.fill();\n\n    ctx.fillStyle = '#FFF';\n    const eyeSize = ts * scale * 0.15;\n    const eyeOffset = ts * scale * 0.2;\n    ctx.beginPath();\n    ctx.arc(offsetX + head.x * ts * scale + ts * scale / 2 - this.dir.x * eyeOffset - this.dir.y * eyeOffset, offsetY + head.y * ts * scale + ts * scale / 2 - this.dir.x * eyeOffset + this.dir.y * eyeOffset, eyeSize, 0, Math.PI * 2);\n    ctx.fill();\n    ctx.beginPath();\n    ctx.arc(offsetX + head.x * ts * scale + ts * scale / 2 - this.dir.x * eyeOffset + this.dir.y * eyeOffset, offsetY + head.y * ts * scale + ts * scale / 2 - this.dir.x * eyeOffset - this.dir.y * eyeOffset, eyeSize, 0, Math.PI * 2);\n    ctx.fill();\n  }\n}\n