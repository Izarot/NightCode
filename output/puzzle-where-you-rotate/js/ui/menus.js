class Menus {
  static drawPause(ctx){
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLORS.wall;
    ctx.strokeStyle = COLORS.wallGlow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(canvas.width/2-100, canvas.height/2-75, 200, 150, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.wallGlow;
    ctx.font = '20px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width/2, canvas.height/2-20);
    ctx.font = '14px monospace';
    ctx.fillText('Press P to Resume', canvas.width/2, canvas.height/2+10);
    ctx.restore();
  }
  static drawVictory(ctx, level, time, highScore){
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = COLORS.exit;
    ctx.strokeStyle = COLORS.wallGlow;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(canvas.width/2-120, canvas.height/2-80, 240, 160, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = COLORS.wallGlow;
    ctx.font = '24px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('LEVEL COMPLETE', canvas.width/2, canvas.height/2-10);
    ctx.font = '16px monospace';
    ctx.fillText('Time: ' + time + 's', canvas.width/2, canvas.height/2+20);
    ctx.fillText('Best: ' + highScore + 's', canvas.width/2, canvas.height/2+45);
    ctx.fillText('Press N for Next Level', canvas.width/2, canvas.height/2+75);
    ctx.restore();
  }