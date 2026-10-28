class HUD {
  constructor(){
    this.level = 1;
    this.steps = 0;
    this.highScore = localStorage.getItem('highScore') || 0;
    this.startTime = performance.now();
  }
  incrementSteps(){ this.steps++; }
  draw(ctx, gravityAngle){
    ctx.save();
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(10, 10, 120, 30);
    ctx.strokeStyle = COLORS.wallGlow;
    ctx.strokeRect(10, 10, 120, 30);
    ctx.fillStyle = COLORS.wallGlow;
    ctx.font = '14px monospace';
    ctx.fillText('LEVEL ' + this.level, 20, 30);
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(300, 10, 100, 30);
    ctx.strokeStyle = COLORS.wallGlow;
    ctx.strokeRect(300, 10, 100, 30);
    ctx.fillStyle = COLORS.wallGlow;
    ctx.save();
    ctx.translate(350, 25);
    ctx.rotate(gravityAngle * Math.PI / 180);
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(0, 10);
    ctx.lineTo(10, 10);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(670, 10, 120, 30);
    ctx.strokeStyle = COLORS.wallGlow;
    ctx.strokeRect(670, 10, 120, 30);
    ctx.fillStyle = COLORS.wallGlow;
    ctx.fillText('STEPS: ' + this.steps, 680, 30);
    const elapsed = Math.floor((performance.now() - this.startTime) / 1000);
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(300, 560, 200, 30);
    ctx.strokeStyle = COLORS.wallGlow;
    ctx.strokeRect(300, 560, 200, 30);
    ctx.fillStyle = COLORS.wallGlow;
    ctx.fillText('TIME: ' + elapsed + 's', 320, 580);
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(10, 560, 200, 30);
    ctx.strokeStyle = COLORS.wallGlow;
    ctx.strokeRect(10, 560, 200, 30);
    ctx.fillStyle = COLORS.wallGlow;
    ctx.fillText('BEST: ' + this.highScore + 's', 20, 580);
    ctx.restore();
  }