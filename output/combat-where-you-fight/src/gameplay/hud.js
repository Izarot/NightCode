export class HUD {
 constructor(ctx, width, height) {
  this.ctx = ctx;
  this.width = width;
  this.height = height;
  this.font = '16px Orbitron';
 }
 
 updateDimensions(w, h) {
  this.width = w;
  this.height = h;
 }
 
 render(player1, player2, gameOver, highScore) {
  // Health bars
  this.ctx.fillStyle = '#fff';
  this.ctx.font = this.font;
  this.ctx.fillText(`P1: ${player1.health}`, 20, 30);
  this.ctx.fillText(`P2: ${player2.health}`, this.width - 150, 30);
  
  // High score
  this.ctx.fillText(`High Score: ${highScore}`, 20, this.height - 20);
  
  // Game over
  if (gameOver) {
   this.ctx.fillStyle = '#f00';
   this.ctx.textAlign = 'center';
   this.ctx.fillText('GAME OVER', this.width/2, this.height/2);
  }
 }
}
